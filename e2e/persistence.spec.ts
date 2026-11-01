import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

/**
 * Persistence coverage for the T1 client: the run autosaves to localStorage after every action,
 * a reload offers "Continue", and "Undo" walks the snapshot stack back without ever offering a
 * button outside the legal action set the engine produced. No rules live in the test.
 */

interface SerializedAction {
  type: string;
  [key: string]: unknown;
}

interface SerializedState {
  actionEpoch: number;
  round: number;
  turn: { movePoints: number; influence: number };
  players: { hand: string[]; position: { q: number; r: number }; fame: number }[];
  rng: unknown;
  gameOver: boolean;
  combat: { phase: string } | null;
  pending: unknown;
}

interface Debug {
  state: SerializedState;
  legal: SerializedAction[];
  events: { type: string }[];
  seed: number;
}

interface Snapshot {
  epoch: number;
  round: number;
  movePoints: number;
  hand: string[];
  position: { q: number; r: number };
  fame: number;
  rng: unknown;
  seed: number;
  eventTypes: string[];
  stateJson: string;
}

interface StoredSave {
  version?: unknown;
  seed?: unknown;
  events?: unknown;
  state?: { actionEpoch?: unknown };
}

async function readStoredSave(page: Page): Promise<StoredSave | null> {
  const raw = await page.evaluate(() => window.localStorage.getItem("emberwold.save.v1"));
  return raw === null ? null : (JSON.parse(raw) as StoredSave);
}

async function readDebug(page: Page): Promise<Debug> {
  const debug = (await page.evaluate(() => window.__EMBERWOLD__)) as unknown as Debug | undefined;
  if (debug === undefined) {
    throw new Error("window.__EMBERWOLD__ is not set");
  }
  return debug;
}

async function readSnapshot(page: Page): Promise<Snapshot> {
  const snapshot = await page.evaluate(() => {
    const debug = window.__EMBERWOLD__;
    if (debug === undefined) {
      throw new Error("window.__EMBERWOLD__ is not set");
    }
    const player = debug.state.players[0];
    return {
      epoch: debug.state.actionEpoch,
      round: debug.state.round,
      movePoints: debug.state.turn.movePoints,
      hand: player?.hand ?? [],
      position: player?.position ?? { q: 0, r: 0 },
      fame: player?.fame ?? 0,
      rng: debug.state.rng,
      seed: debug.seed,
      eventTypes: debug.events.map((event) => event.type),
      stateJson: JSON.stringify(debug.state),
    };
  });
  return snapshot as unknown as Snapshot;
}

/** Click the button for legal action 0 and wait until the engine has applied it. */
async function playAction(page: Page): Promise<void> {
  const before = await page.evaluate(() => window.__EMBERWOLD__?.state.actionEpoch ?? -1);
  if (before < 0) {
    throw new Error("window.__EMBERWOLD__ is not set");
  }
  const button = page.locator('[data-testid="action"][data-index="0"]').first();
  await expect(button, "the first legal action is rendered").toBeVisible();
  await button.click();
  await page.waitForFunction(
    (previous) => (window.__EMBERWOLD__?.state.actionEpoch ?? -1) > previous,
    before,
  );
}

/** Every rendered action button must point at an action inside the legal set the client holds. */
async function expectButtonsWithinLegalSet(page: Page): Promise<void> {
  const legalLength = await page.evaluate(() => window.__EMBERWOLD__?.legal.length ?? 0);
  expect(legalLength, "the client holds legal actions").toBeGreaterThan(0);
  const indexes = await page.$$eval("[data-index]", (buttons) =>
    buttons.map((button) => Number(button.getAttribute("data-index"))),
  );
  for (const index of indexes) {
    expect(Number.isInteger(index), `button data-index ${index} is an integer`).toBe(true);
    expect(index, `button index ${index} within legal actions`).toBeGreaterThanOrEqual(0);
    expect(index, `button index ${index} within legal actions`).toBeLessThan(legalLength);
  }
}

function collectConsoleErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") {
      errors.push(message.text());
    }
  });
  page.on("pageerror", (error) => errors.push(error.message));
  return errors;
}

async function startSeededRun(page: Page, seed: string): Promise<void> {
  await page.goto("/");
  await page.getByTestId("seed").fill(seed);
  await page.getByTestId("new-run").click();
  await page.waitForFunction((expected) => window.__EMBERWOLD__?.seed === expected, Number(seed));
}

test("autosaves after every action and continues the exact run after a reload", async ({
  page,
}) => {
  const consoleErrors = collectConsoleErrors(page);
  await startSeededRun(page, "7");

  await playAction(page);
  await playAction(page);
  await playAction(page);

  const before = await readSnapshot(page);
  expect(before.epoch, "three applied actions advanced the epoch three times").toBe(3);
  expect(before.eventTypes.length).toBeGreaterThan(0);

  const stored = await readStoredSave(page);
  expect(stored, "the versioned save key exists").not.toBeNull();
  expect(stored?.version).toBe(1);
  expect(stored?.seed).toBe(7);
  expect(Array.isArray(stored?.events)).toBe(true);
  expect(stored?.state?.actionEpoch, "the save holds the latest action").toBe(before.epoch);

  await page.reload();
  await expect(page.getByTestId("resume")).toBeVisible();
  await expect(page.getByTestId("continue")).toBeEnabled();
  expect(
    await page.evaluate(() => window.__EMBERWOLD__),
    "no run is exposed before Continue is chosen",
  ).toBeUndefined();

  await page.getByTestId("continue").click();
  await page.waitForFunction(() => window.__EMBERWOLD__ !== undefined);

  const after = await readSnapshot(page);
  expect(after).toEqual(before);
  expect(after.seed).toBe(7);
  expect(consoleErrors, "no console errors").toEqual([]);
});

test("undo restores the previous snapshot and never offers an illegal action", async ({ page }) => {
  const consoleErrors = collectConsoleErrors(page);
  await startSeededRun(page, "7");
  await expect(page.getByTestId("undo")).toBeDisabled();

  await playAction(page);
  const afterFirst = await readSnapshot(page);
  expect(afterFirst.epoch).toBe(1);
  await expect(page.getByTestId("undo")).toBeEnabled();

  await playAction(page);
  expect((await readSnapshot(page)).epoch).toBe(2);

  await page.getByTestId("undo").click();
  await page.waitForFunction(
    (expected) => window.__EMBERWOLD__?.state.actionEpoch === expected,
    afterFirst.epoch,
  );
  const undone = await readSnapshot(page);
  expect(undone.epoch, "one undo steps back one action").toBe(afterFirst.epoch);
  expect(undone.stateJson, "the whole restored state matches").toBe(afterFirst.stateJson);
  expect(undone.eventTypes, "the events shown before the action are restored").toEqual(
    afterFirst.eventTypes,
  );
  await expectButtonsWithinLegalSet(page);
  await expect(page.getByTestId("undo")).toBeEnabled();

  await page.getByTestId("undo").click();
  await page.waitForFunction(() => (window.__EMBERWOLD__?.state.actionEpoch ?? -1) === 0);
  const rewound = await readSnapshot(page);
  expect(rewound.epoch, "undo reaches the start of the run").toBe(0);
  await expect(page.getByTestId("undo")).toBeDisabled();
  await expectButtonsWithinLegalSet(page);
  expect(consoleErrors, "no console errors").toEqual([]);
});

test("starts fresh without a save and New run discards a saved run", async ({ page }) => {
  const consoleErrors = collectConsoleErrors(page);
  await page.goto("/");
  await expect(page.getByTestId("resume")).toHaveCount(0);
  await expect(page.getByTestId("continue")).toHaveCount(0);
  await page.waitForFunction(() => window.__EMBERWOLD__ !== undefined);

  const created = await readStoredSave(page);
  expect(created, "the run is autosaved at creation").not.toBeNull();
  expect(created?.version).toBe(1);
  expect(created?.seed).toBe(1);
  expect(created?.state?.actionEpoch, "the creation save is at epoch zero").toBe(0);

  await playAction(page);
  const played = await readSnapshot(page);
  expect(played.epoch).toBe(1);

  await page.reload();
  await expect(page.getByTestId("resume")).toBeVisible();
  await expect(page.getByTestId("continue")).toBeVisible();

  await page.getByTestId("new-run").click();
  await page.waitForFunction(() => window.__EMBERWOLD__ !== undefined);
  await expect(page.getByTestId("resume")).toHaveCount(0);

  const fresh = await readDebug(page);
  expect(fresh.state.actionEpoch, "a new run starts at epoch zero").toBe(0);
  expect(fresh.seed).toBe(1);
  const savedFresh = await readStoredSave(page);
  expect(savedFresh?.seed, "New run replaces the previous save").toBe(1);
  expect(savedFresh?.state?.actionEpoch).toBe(0);
  await expect(page.getByTestId("undo")).toBeDisabled();
  await expectButtonsWithinLegalSet(page);
  expect(consoleErrors, "no console errors").toEqual([]);
});
