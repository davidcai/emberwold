import { readFileSync } from "node:fs";

import { expect, test } from "@playwright/test";

/**
 * Drives the real UI through the committed `050-victory` golden trace: the whole First Conquest
 * run (city assault and victory debrief included). No rules live in the test — every click
 * targets the legal action the client received from the engine.
 */

interface SerializedAction {
  epoch: number;
  type: string;
  [key: string]: unknown;
}

interface SerializedState {
  actionEpoch: number;
  round: number;
  gameOver: boolean;
  combat: { phase: string } | null;
  players: {
    hand: string[];
    fame: number;
  }[];
  cardInstances: Record<string, string>;
  map: {
    enemies: { alive: boolean }[];
  };
  result: {
    outcome: string;
    score: number;
    cityConquered: boolean;
    reason: string;
  } | null;
}

interface Debug {
  state: SerializedState;
  legal: SerializedAction[];
  events: { type: string }[];
  result: SerializedState["result"];
}

interface TraceFile {
  seed: number;
  actions: SerializedAction[];
  expectedOutcome: {
    round: number;
    gameOver: boolean;
    fame: number;
    handSize: number;
    wounds: number;
    defeatedEnemies: number;
  };
  expectedResult: {
    outcome: string;
    score: number;
    cityConquered: boolean;
    reason: string;
  };
}

const trace = JSON.parse(readFileSync("tools/golden-traces/050-victory.json", "utf8")) as TraceFile;

test("replays the victory golden trace and shows the debrief", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });
  page.on("pageerror", (error) => {
    consoleErrors.push(String(error));
  });

  // Start from a clean save so the run is created with the trace's seed.
  await page.addInitScript(() => {
    window.localStorage.clear();
  });
  await page.goto("/");
  await page.getByTestId("seed").fill(String(trace.seed));
  await page.getByTestId("new-run").first().click();
  await page.waitForFunction(() => window.__EMBERWOLD__ !== undefined);
  await expect
    .poll(async () => page.evaluate(() => window.__EMBERWOLD__?.state.actionEpoch))
    .toBe(0);

  let lastEpoch = 0;
  let steps = 0;
  for (const action of trace.actions) {
    const debug = (await page.evaluate(() => window.__EMBERWOLD__)) as unknown as Debug;
    expect(debug.state.actionEpoch).toBe(lastEpoch);

    // Every rendered action button must map to an entry in the client's legal set.
    const buttonIndexes = await page.$$eval("[data-index]", (buttons) =>
      buttons.map((button) => Number(button.getAttribute("data-index"))),
    );
    for (const index of buttonIndexes) {
      expect(index, `button index ${index} within legal actions`).toBeGreaterThanOrEqual(0);
      expect(index, `button index ${index} within legal actions`).toBeLessThan(debug.legal.length);
    }

    // Find the exact legal action the trace recorded, then click its button.
    const index = debug.legal.findIndex(
      (candidate) => JSON.stringify(candidate) === JSON.stringify(action),
    );
    expect(index, `trace action ${action.type} is offered by the client`).toBeGreaterThanOrEqual(0);
    await page.locator(`[data-testid="action"][data-index="${index}"]`).first().click();
    await page.waitForFunction(
      (previous) => (window.__EMBERWOLD__?.state.actionEpoch ?? -1) > previous,
      lastEpoch,
    );
    lastEpoch += 1;
    steps += 1;
  }

  expect(steps, "the whole victory trace replayed").toBe(trace.actions.length);

  const debug = (await page.evaluate(() => window.__EMBERWOLD__)) as unknown as Debug;
  const outcome = trace.expectedOutcome;
  expect(debug.state.round).toBe(outcome.round);
  expect(debug.state.gameOver).toBe(outcome.gameOver);
  expect(debug.state.players[0]?.fame).toBe(outcome.fame);
  expect(debug.state.players[0]?.hand.length).toBe(outcome.handSize);
  const wounds = (debug.state.players[0]?.hand ?? []).filter(
    (card) => debug.state.cardInstances[card] === "card:wound",
  ).length;
  expect(wounds).toBe(outcome.wounds);
  const defeated = debug.state.map.enemies.filter((enemy) => !enemy.alive).length;
  expect(defeated).toBe(outcome.defeatedEnemies);

  // The engine result and the debug bridge both expose the victory.
  expect(debug.state.result).toEqual(trace.expectedResult);
  expect(debug.result).toEqual(trace.expectedResult);

  // The debrief replaces the action surface: no legal actions, no action buttons.
  expect(debug.legal.length, "a finished run offers no legal actions").toBe(0);
  await expect(page.getByTestId("debrief")).toBeVisible();
  await expect(page.getByTestId("debrief-outcome")).toHaveText(trace.expectedResult.outcome);
  await expect(page.getByTestId("debrief-score")).toHaveText(String(trace.expectedResult.score));
  await expect(page.getByTestId("debrief-round")).toHaveText(String(outcome.round));
  await expect(page.getByTestId("debrief-fame")).toHaveText(String(outcome.fame));
  await expect(page.getByTestId("debrief-city")).toHaveText("conquered");
  await expect(page.getByTestId("debrief-reason")).toHaveText("city conquered");
  await expect(page.locator('[data-testid="action"]')).toHaveCount(0);
  await expect(page.getByTestId("board")).toBeVisible();
  expect(consoleErrors, "no console errors").toEqual([]);
});

test("continues a saved run from mid-combat and still reaches the victory debrief", async ({
  page,
}) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });
  page.on("pageerror", (error) => {
    consoleErrors.push(String(error));
  });

  // A fresh Playwright context has an empty save, so the reload below can offer Continue.
  await page.goto("/");
  await page.getByTestId("seed").fill(String(trace.seed));
  await page.getByTestId("new-run").first().click();
  await page.waitForFunction(() => window.__EMBERWOLD__ !== undefined);

  const readDebug = async (): Promise<Debug> =>
    (await page.evaluate(() => window.__EMBERWOLD__)) as unknown as Debug;
  const playTraceAction = async (action: SerializedAction, epoch: number): Promise<number> => {
    const debug = await readDebug();
    expect(debug.state.actionEpoch).toBe(epoch);
    const index = debug.legal.findIndex(
      (candidate) => JSON.stringify(candidate) === JSON.stringify(action),
    );
    expect(index, `trace action ${action.type} is offered by the client`).toBeGreaterThanOrEqual(0);
    await page.locator(`[data-testid="action"][data-index="${index}"]`).first().click();
    await page.waitForFunction(
      (previous) => (window.__EMBERWOLD__?.state.actionEpoch ?? -1) > previous,
      epoch,
    );
    return epoch + 1;
  };

  // Replay until the run is in a combat, then reload and continue from the autosave.
  let epoch = 0;
  let combatIndex = -1;
  for (let index = 0; index < trace.actions.length; index += 1) {
    epoch = await playTraceAction(trace.actions[index]!, epoch);
    if ((await readDebug()).state.combat !== null) {
      combatIndex = index;
      break;
    }
  }
  expect(combatIndex, "the victory trace enters a combat").toBeGreaterThanOrEqual(0);

  const beforeReload = await readDebug();
  expect(beforeReload.state.combat).not.toBeNull();
  expect(
    await page.evaluate(() => window.localStorage.getItem("emberwold.save.v1")),
  ).not.toBeNull();

  await page.reload();
  await expect(page.getByTestId("resume")).toBeVisible();
  await expect(page.getByTestId("continue")).toBeEnabled();
  await page.getByTestId("continue").click();
  await page.waitForFunction(() => window.__EMBERWOLD__ !== undefined);

  const restored = await readDebug();
  expect(restored.state.actionEpoch).toBe(beforeReload.state.actionEpoch);
  expect(restored.state.combat?.phase).toBe(beforeReload.state.combat?.phase);
  expect(restored.state.players[0]?.hand).toEqual(beforeReload.state.players[0]?.hand);

  for (let index = combatIndex + 1; index < trace.actions.length; index += 1) {
    epoch = await playTraceAction(trace.actions[index]!, epoch);
  }

  const finalDebug = await readDebug();
  expect(finalDebug.state.result).toEqual(trace.expectedResult);
  await expect(page.getByTestId("debrief")).toBeVisible();
  await expect(page.getByTestId("debrief-outcome")).toHaveText(trace.expectedResult.outcome);
  await expect(page.getByTestId("debrief-score")).toHaveText(String(trace.expectedResult.score));
  expect(consoleErrors, "no console errors").toEqual([]);
});
