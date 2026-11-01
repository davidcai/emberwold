import { expect, test } from "@playwright/test";

/**
 * Drives the real UI through the spike flow with no rules in the test:
 * the test only reads the state/legal actions the client was given by the engine and clicks
 * the corresponding button. It fails if the UI ever offers an action outside the legal set.
 */

interface SerializedAction {
  type: string;
  card?: string;
  mode?: string;
  as?: string;
  target?: { q: number; r: number };
  points?: number;
  optionIndex?: number;
}

interface SerializedState {
  actionEpoch: number;
  turn: { movePoints: number; influence: number; flags: Record<string, boolean> };
  round: number;
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
}

interface Debug {
  state: SerializedState;
  legal: SerializedAction[];
  events: { type: string }[];
}

const WOUND_CARD = "card:wound";
const FRONTIER = { q: 1, r: 0 };

function sameHex(a: { q: number; r: number }, b: { q: number; r: number }): boolean {
  return a.q === b.q && a.r === b.r;
}

function distance(a: { q: number; r: number }, b: { q: number; r: number }): number {
  const dq = a.q - b.q;
  const dr = a.r - b.r;
  return (Math.abs(dq) + Math.abs(dr) + Math.abs(dq + dr)) / 2;
}

function firstByType(legal: SerializedAction[], ...types: string[]): SerializedAction | undefined {
  for (const type of types) {
    const found = legal.find((action) => action.type === type);
    if (found !== undefined) {
      return found;
    }
  }
  return undefined;
}

function choose(debug: Debug): SerializedAction | undefined {
  const { state, legal } = debug;
  if (legal.length === 0) {
    return undefined;
  }
  if (state.pending !== null) {
    return firstByType(legal, "resolveChoice");
  }
  if (state.combat !== null) {
    if (state.combat.phase === "assignDamage") {
      return firstByType(legal, "assignDamage", "endCombatPhase");
    }
    return (
      firstByType(legal, "assignAttack") ??
      legal.find((action) => action.type === "playCard" && action.mode === "basic") ??
      legal.find((action) => action.type === "playCardSideways" && action.as === "attack") ??
      firstByType(legal, "endCombatPhase")
    );
  }

  const player = state.players[0];
  if (player === undefined) {
    return undefined;
  }
  const wounds = player.hand.filter((card) => state.cardInstances[card] === WOUND_CARD).length;
  const enemies = state.map.enemies.filter((candidate) => candidate.alive);
  const village = state.map.sites.find((site) => site.siteId === "site:village");
  const hidden = state.map.tiles.some((tile) => !tile.revealed);
  const endOrRest = () => firstByType(legal, "endTurn", "rest") ?? legal[0];
  const moveActions = legal.filter(
    (action) => action.type === "moveTo" && action.target !== undefined,
  );

  const moveToward = (goal: { q: number; r: number }): SerializedAction | undefined => {
    const progress = moveActions
      .filter(
        (action) =>
          distance(action.target as { q: number; r: number }, goal) <
          distance(player.position, goal),
      )
      .sort(
        (a, b) =>
          distance(a.target as { q: number; r: number }, goal) -
          distance(b.target as { q: number; r: number }, goal),
      );
    if (progress[0] !== undefined) {
      return progress[0];
    }
    // No useful jump yet: bank movement (basic card first, then sideways) or pass the turn.
    return (
      legal.find((action) => action.type === "playCard" && action.mode === "basic") ??
      legal.find((action) => action.type === "playCardSideways" && action.as === "move") ??
      endOrRest()
    );
  };

  if (hidden) {
    if (firstByType(legal, "explore") !== undefined) {
      return firstByType(legal, "explore");
    }
    return moveToward(FRONTIER);
  }

  if (enemies.length > 0 && wounds === 0) {
    const enemy = enemies[0] as { hex: { q: number; r: number } };
    if (sameHex(player.position, enemy.hex)) {
      return firstByType(legal, "challengeRampaging") ?? endOrRest();
    }
    return moveToward(enemy.hex);
  }
  // Wounded: skip further fights and walk to the village to heal (one fight is enough for S9).

  if (village !== undefined) {
    if (!sameHex(player.position, village.hex)) {
      return moveToward(village.hex);
    }
    const entered = state.turn.flags[`enteredSite:${village.hex.q},${village.hex.r}`] === true;
    if (!entered) {
      return firstByType(legal, "enterSite") ?? endOrRest();
    }
    if (wounds > 0) {
      const buy = firstByType(legal, "buyHealing");
      if (buy !== undefined) {
        return buy;
      }
      return (
        legal.find((action) => action.type === "playCardSideways" && action.as === "influence") ??
        legal.find((action) => action.type === "playCard") ??
        endOrRest()
      );
    }
  }

  return endOrRest();
}

test("plays the spike flow through the real UI without ever offering an illegal action", async ({
  page,
}) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));

  await page.goto("/");
  await page.getByTestId("new-run").click();
  await page.waitForFunction(() => window.__EMBERWOLD__ !== undefined);

  let steps = 0;
  let lastEpoch = -1;
  for (; steps < 220; steps += 1) {
    const debug = (await page.evaluate(() => window.__EMBERWOLD__)) as unknown as Debug | undefined;
    if (debug === undefined) {
      throw new Error("debug state unavailable");
    }
    const buttonIndexes = await page.$$eval("[data-index]", (buttons) =>
      buttons.map((button) => Number(button.getAttribute("data-index"))),
    );
    for (const index of buttonIndexes) {
      expect(index, `button index ${index} within legal actions`).toBeGreaterThanOrEqual(0);
      expect(index, `button index ${index} within legal actions`).toBeLessThan(debug.legal.length);
    }

    const eventTypes = debug.events.map((event) => event.type);
    const enteredIndex = eventTypes.lastIndexOf("siteEntered");
    const spentIndex = eventTypes.lastIndexOf("influenceSpent");
    const healIndex = eventTypes.lastIndexOf("healGained");
    const villageHeal = enteredIndex >= 0 && spentIndex > enteredIndex && healIndex > spentIndex;
    const endedAfterHeal = villageHeal && eventTypes.slice(healIndex).includes("turnEnded");
    if (endedAfterHeal || debug.state.gameOver) {
      break;
    }

    const action = choose(debug);
    if (action === undefined) {
      break;
    }
    const index = debug.legal.findIndex(
      (candidate) => JSON.stringify(candidate) === JSON.stringify(action),
    );
    expect(index, "chosen action is in the legal set the client holds").toBeGreaterThanOrEqual(0);
    const epoch = debug.state.actionEpoch;
    await page.locator(`[data-testid="action"][data-index="${index}"]`).first().click();
    await page.waitForFunction(
      (previous) => (window.__EMBERWOLD__?.state.actionEpoch ?? -1) > previous,
      epoch,
    );
    lastEpoch = epoch;
  }

  expect(steps, "the flow advanced").toBeGreaterThan(20);
  expect(lastEpoch).toBeGreaterThan(0);

  const debug = (await page.evaluate(() => window.__EMBERWOLD__)) as unknown as Debug;
  const types = debug.events.map((event) => event.type);
  for (const required of [
    "heroMoved",
    "tileRevealed",
    "combatStarted",
    "siteEntered",
    "healGained",
    "turnEnded",
  ]) {
    expect(types, `event ${required} occurred`).toContain(required);
  }
  expect(debug.legal.length).toBeGreaterThan(0);
  expect(consoleErrors, "no console errors").toEqual([]);
});
