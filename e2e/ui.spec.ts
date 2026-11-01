import { readFileSync } from "node:fs";

import { expect, test } from "@playwright/test";

/**
 * Drives the real UI through the committed `030-site-heal` golden trace with no rules in the
 * test: each click targets the legal action the client received from the engine, and the run
 * must reproduce the trace's event stream (move, reveal, combat, site, heal, turn end).
 */

interface SerializedAction {
  type: string;
  tactic?: string;
  card?: string;
  mode?: string;
  as?: string;
  target?: { q: number; r: number };
  points?: number;
  optionIndex?: number;
  enemy?: string;
}

interface SerializedState {
  actionEpoch: number;
  turn: { movePoints: number; influence: number; flags: Record<string, boolean> };
  round: number;
  timeOfDay: string;
  gameOver: boolean;
  players: {
    position: { q: number; r: number };
    hand: string[];
    fame: number;
  }[];
  cardInstances: Record<string, string>;
  map: {
    tiles: { revealed: boolean }[];
    enemies: { alive: boolean; hex: { q: number; r: number } }[];
    sites: { siteId: string; hex: { q: number; r: number } }[];
  };
  combat: { phase: string } | null;
  pending: unknown;
  result: { outcome: string; reason: string } | null;
}

interface Debug {
  state: SerializedState;
  legal: SerializedAction[];
  events: { type: string }[];
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
}

const trace = JSON.parse(
  readFileSync("tools/golden-traces/030-site-heal.json", "utf8"),
) as TraceFile;

test("replays the site-heal golden trace through the real UI without offering an illegal action", async ({
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

  expect(steps, "the trace replayed").toBe(trace.actions.length);

  const debug = (await page.evaluate(() => window.__EMBERWOLD__)) as unknown as Debug;
  const types = debug.events.map((event) => event.type);
  for (const required of [
    "tacticChosen",
    "heroMoved",
    "tileRevealed",
    "combatStarted",
    "siteEntered",
    "healGained",
    "turnEnded",
  ]) {
    expect(types, `event ${required} occurred`).toContain(required);
  }

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
  expect(debug.legal.length, "the final turn still offers legal actions").toBeGreaterThan(0);
  expect(consoleErrors, "no console errors").toEqual([]);
});
