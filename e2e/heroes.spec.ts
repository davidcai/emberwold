import { expect, test } from "@playwright/test";

/**
 * Hero selection coverage: the T1 bundle ships two heroes, the client lets the player pick one
 * on a new run, and the engine starts that hero's deck, crystals and skill deck. No rules live
 * in the test — assertions read the engine state the client exposes.
 */

interface DebugState {
  actionEpoch: number;
  cardInstances: Record<string, string>;
  players: {
    heroId: string;
    crystals: { red: number; blue: number; green: number; white: number };
    hand: string[];
    deck: string[];
    discard: string[];
    playArea: string[];
    skillDeck: string[];
  }[];
}

interface Debug {
  state: DebugState;
  legal: { type: string }[];
}

test("starts a new run with the selected hero and its own deck", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.clear();
  });
  await page.goto("/");
  await page.waitForFunction(() => window.__EMBERWOLD__ !== undefined);

  await expect(page.getByTestId("hero-select")).toBeVisible();
  await expect(page.getByTestId("hero-select")).toHaveValue("hero:goldyx");
  await page.getByTestId("hero-select").selectOption("hero:arythea");
  await page.getByTestId("seed").fill("7");
  await page.getByTestId("new-run").first().click();
  await expect
    .poll(async () => page.evaluate(() => window.__EMBERWOLD__?.state.actionEpoch))
    .toBe(0);

  const debug = (await page.evaluate(() => window.__EMBERWOLD__)) as unknown as Debug;
  const player = debug.state.players[0];
  expect(player?.heroId).toBe("hero:arythea");
  expect(player?.crystals).toEqual({ red: 2, blue: 0, green: 0, white: 1 });
  expect(player?.skillDeck).toHaveLength(10);
  expect(debug.legal.length).toBeGreaterThan(0);
  const deckDefs = new Set(
    [...(player?.hand ?? []), ...(player?.deck ?? []), ...(player?.discard ?? [])].map(
      (instance) => debug.state.cardInstances[instance],
    ),
  );
  expect(deckDefs.has("basic:arythea_battle_versatility")).toBe(true);
  expect(deckDefs.has("basic:goldyx_crystal_joy")).toBe(false);

  // Switching back to the default hero starts the other deck on the next run.
  await page.getByTestId("hero-select").selectOption("hero:goldyx");
  await page.getByTestId("new-run").first().click();
  await expect
    .poll(async () => page.evaluate(() => window.__EMBERWOLD__?.state.actionEpoch))
    .toBe(0);
  const next = (await page.evaluate(() => window.__EMBERWOLD__)) as unknown as Debug;
  const nextPlayer = next.state.players[0];
  expect(nextPlayer?.heroId).toBe("hero:goldyx");
  const nextDefs = new Set(
    [...(nextPlayer?.hand ?? []), ...(nextPlayer?.deck ?? []), ...(nextPlayer?.discard ?? [])].map(
      (instance) => next.state.cardInstances[instance],
    ),
  );
  expect(nextDefs.has("basic:goldyx_will_focus")).toBe(true);
  expect(nextDefs.has("basic:arythea_battle_versatility")).toBe(false);
});
