import { describe, expect, it } from "vitest";

import { createFixtureContent } from "./__fixtures__/content";
import {
  applyAction,
  checkInvariants,
  createGame,
  getLegalActions,
  getReachableHexes,
  hashState,
} from "./engine";
import type { Action, ApplyOutcome, GameState } from "./types";
import { hexKey as hexKeyFor } from "@emberwold/shared";
import type { CardInstanceId, ContentBundle } from "@emberwold/shared";

function setup(seed = 1): { content: ContentBundle; state: GameState } {
  const content = createFixtureContent();
  const { state } = createGame({ seed }, content);
  return { content, state };
}

function applyOk(state: GameState, action: Action, content: ContentBundle) {
  const outcome = applyAction(state, action, content);
  expect(outcome.ok).toBe(true);
  if (!outcome.ok) {
    throw new Error(`unexpected error: ${outcome.error.code}`);
  }
  return outcome.result;
}

function clone(state: GameState): GameState {
  return JSON.parse(JSON.stringify(state)) as GameState;
}

/** Finds a card instance of a definition anywhere in the player's deck/discard and moves it to hand. */
function giveCard(state: GameState, defId: string): { state: GameState; instance: CardInstanceId } {
  const draft = clone(state);
  const player = draft.players[0];
  if (player === undefined) {
    throw new Error("no player");
  }
  const instance = [...player.hand, ...player.deck, ...player.discard].find(
    (candidate) => String(draft.cardInstances[candidate]) === defId,
  );
  if (instance === undefined) {
    throw new Error(`fixture is missing a ${defId} instance`);
  }
  if (player.hand.includes(instance)) {
    return { state: draft, instance };
  }
  player.deck = player.deck.filter((candidate) => candidate !== instance);
  player.discard = player.discard.filter((candidate) => candidate !== instance);
  player.hand.push(instance);
  return { state: draft, instance };
}

function giveDeckCard(state: GameState, defId: string): GameState {
  const draft = clone(state);
  const player = draft.players[0];
  if (player === undefined) {
    throw new Error("no player");
  }
  const instance = [...player.deck, ...player.discard].find(
    (candidate) => String(draft.cardInstances[candidate]) === defId,
  );
  if (instance === undefined) {
    throw new Error(`fixture is missing a ${defId} instance`);
  }
  player.deck = player.deck.filter((candidate) => candidate !== instance);
  player.discard = player.discard.filter((candidate) => candidate !== instance);
  player.hand.push(instance);
  return draft;
}

function playMarch(
  state: GameState,
  content: ContentBundle,
): { state: GameState; instance: CardInstanceId } {
  const legal = getLegalActions(state, content).actions;
  const march = legal.find((candidate) => {
    if (candidate.type !== "playCard" || !("card" in candidate)) {
      return false;
    }
    return String(state.cardInstances[candidate.card]) === "basic:march";
  });
  if (march === undefined || !("card" in march)) {
    throw new Error("no march playable");
  }
  return { state: applyOk(state, march, content).state, instance: march.card };
}

function addWounds(
  state: GameState,
  count: number,
): { state: GameState; wounds: CardInstanceId[] } {
  const draft = clone(state);
  const player = draft.players[0];
  if (player === undefined) {
    throw new Error("no player");
  }
  const wounds: CardInstanceId[] = [];
  for (let i = 0; i < count; i += 1) {
    const id = `test-wound:${i}` as CardInstanceId;
    draft.cardInstances[id] = "card:wound" as never;
    player.hand.push(id);
    wounds.push(id);
  }
  return { state: draft, wounds };
}

function legalOfType(
  state: GameState,
  content: ContentBundle,
  predicate: (action: Action) => boolean,
): Action[] {
  return getLegalActions(state, content).actions.filter(predicate);
}

describe("createGame", () => {
  it("sets up the deck, hand, crystals, source and map", () => {
    const { content, state } = setup();
    const player = state.players[0];
    expect(player).toBeDefined();
    expect(player?.hand).toHaveLength(content.rulesConstants.startingHandSize);
    expect(player?.deck).toHaveLength(
      content.rulesConstants.deedDeckSize - content.rulesConstants.startingHandSize,
    );
    expect(player?.crystals.green).toBe(2);
    expect(player?.crystals.blue).toBe(1);
    expect(state.source).toHaveLength(3);
    expect(state.map.tiles[0]?.revealed).toBe(true);
    expect(state.map.tiles[1]?.revealed).toBe(false);
    expect(checkInvariants(state, content)).toEqual([]);
    expect(state.engineVersion).toBe("0.1.0-spike");
    expect(state.rulesetId).toBe("emberwold-spike");
    expect(state.contentHash).toBe("fixture-content-hash");
  });
});

describe("legal actions", () => {
  it("every legal action applies (totality)", () => {
    const { content, state } = setup();
    const legal = getLegalActions(state, content);
    expect(legal.actions.length).toBeGreaterThan(0);
    for (const action of legal.actions) {
      const outcome = applyAction(state, action, content);
      expect(outcome.ok, `action ${JSON.stringify(action)} should apply`).toBe(true);
    }
  });

  it("rejects stale-epoch and illegal actions without mutating state", () => {
    const { content, state } = setup();
    const stale = {
      ...(getLegalActions(state, content).actions[0] as Action),
      epoch: state.actionEpoch + 5,
    };
    const staleOutcome = applyAction(state, stale, content);
    expect(staleOutcome.ok).toBe(false);
    if (!staleOutcome.ok) {
      expect(staleOutcome.error.code).toBe("staleEpoch");
    }

    const illegal: Action = { epoch: state.actionEpoch, type: "endTurn" };
    const endTurnLegal = getLegalActions(state, content).actions.some(
      (action) => action.type === "endTurn",
    );
    if (!endTurnLegal) {
      const illegalOutcome = applyAction(state, illegal, content);
      expect(illegalOutcome.ok).toBe(false);
      if (!illegalOutcome.ok) {
        expect(illegalOutcome.error.code).toBe("notLegal");
      }
    }
    expect(hashState(state)).toBe(hashState(setup().state));
  });
});

describe("cards", () => {
  it("plays a basic move card and increments the epoch", () => {
    const { content, state } = setup();
    const given = giveCard(state, "basic:march");
    const actions = legalOfType(
      given.state,
      content,
      (action) =>
        action.type === "playCard" && action.card === given.instance && action.mode === "basic",
    );
    expect(actions).toHaveLength(1);
    const result = applyOk(given.state, actions[0] as Action, content);
    expect(result.state.turn.movePoints).toBe(2);
    expect(result.state.turn.playedOrDiscarded).toBe(true);
    expect(result.events.some((event) => event.type === "movePointsGained")).toBe(true);
    expect(result.state.actionEpoch).toBe(given.state.actionEpoch + 1);
    expect(result.state.players[0]?.playArea).toContain(given.instance);
    expect(checkInvariants(result.state, content)).toEqual([]);
  });

  it("powers a card by paying a matching crystal", () => {
    const { content, state } = setup();
    const given = giveCard(state, "basic:march");
    const powered = legalOfType(
      given.state,
      content,
      (action) =>
        action.type === "playCard" && action.card === given.instance && action.mode === "powered",
    );
    expect(powered).toHaveLength(1);
    const result = applyOk(given.state, powered[0] as Action, content);
    expect(result.state.turn.movePoints).toBe(4);
    expect(result.state.players[0]?.crystals.green).toBe(1);
  });

  it("resolves a choice effect", () => {
    const { content, state } = setup();
    const given = giveCard(state, "basic:tranquility");
    const play = legalOfType(
      given.state,
      content,
      (action) =>
        action.type === "playCard" && action.card === given.instance && action.mode === "basic",
    );
    expect(play).toHaveLength(1);
    const played = applyOk(given.state, play[0] as Action, content);
    expect(played.state.pending).not.toBeNull();
    const choices = legalOfType(played.state, content, (action) => action.type === "resolveChoice");
    expect(choices).toHaveLength(2);
    const resolved = applyOk(played.state, choices[0] as Action, content);
    expect(resolved.state.pending).toBeNull();
    expect(resolved.events.some((event) => event.type === "healGained")).toBe(true);
  });

  it("resolves a discard cost and then its follow-up choice", () => {
    const { content, state } = setup();
    const given = giveCard(state, "basic:improvisation");
    const victim = giveCard(given.state, "basic:promise");
    const play = legalOfType(
      victim.state,
      content,
      (action) =>
        action.type === "playCard" && action.card === given.instance && action.mode === "basic",
    );
    expect(play).toHaveLength(1);
    const played = applyOk(victim.state, play[0] as Action, content);
    expect(played.state.pending?.kind).toBe("discardCost");
    const pending = played.state.pending;
    expect(pending).not.toBeNull();
    const victimIndex = pending === null ? -1 : pending.eligibleCards.indexOf(victim.instance);
    expect(victimIndex).toBeGreaterThanOrEqual(0);
    const discardAction: Action = {
      epoch: played.state.actionEpoch,
      type: "resolveChoice",
      choiceId: pending?.choiceId ?? "",
      optionIndex: victimIndex,
    };
    const discarded = applyOk(played.state, discardAction as Action, content);
    expect(discarded.state.pending?.kind).toBe("effectChoice");
    const followUp = legalOfType(
      discarded.state,
      content,
      (action) => action.type === "resolveChoice",
    );
    const finished = applyOk(discarded.state, followUp[0] as Action, content);
    expect(finished.state.pending).toBeNull();
    expect(finished.state.players[0]?.discard).toContain(victim.instance);
  });
});

describe("rest and turn submission", () => {
  it("rejects endTurn before any card is played, then accepts it after a play", () => {
    const { content, state } = setup();
    const endTurn = { epoch: state.actionEpoch, type: "endTurn" } as Action;
    expect(getLegalActions(state, content).actions).not.toContainEqual(endTurn);
    const given = giveCard(state, "basic:march");
    const play = legalOfType(
      given.state,
      content,
      (action) =>
        action.type === "playCard" && action.card === given.instance && action.mode === "basic",
    )[0] as Action;
    const played = applyOk(given.state, play, content);
    const ended = applyOk(
      played.state,
      { epoch: played.state.actionEpoch, type: "endTurn" } as Action,
      content,
    );
    expect(ended.events.some((event) => event.type === "roundEnded")).toBe(true);
    expect(ended.state.round).toBe(2);
  });

  it("standard rest discards one non-wound card plus wounds and only leaves endTurn legal", () => {
    const { content, state } = setup();
    const wounded = addWounds(state, 1);
    const given = giveCard(wounded.state, "basic:march");
    const rests = legalOfType(
      given.state,
      content,
      (action) => action.type === "rest" && action.kind === "standard",
    );
    expect(rests.length).toBeGreaterThan(0);
    const rested = applyOk(given.state, rests[0] as Action, content);
    expect(rested.state.turn.rested).toBe(true);
    expect(rested.events.some((event) => event.type === "rested")).toBe(true);
    const legal = getLegalActions(rested.state, content);
    expect(legal.actions.every((action) => action.type === "endTurn")).toBe(true);
  });

  it("slow recovery is the only turn when the hand is all wounds", () => {
    const { content, state } = setup();
    const draft = clone(state);
    const player = draft.players[0];
    if (player === undefined) {
      throw new Error("no player");
    }
    player.deck.push(...player.hand);
    player.hand = [];
    const wounded = addWounds(draft, 2);
    const standard = legalOfType(
      wounded.state,
      content,
      (action) => action.type === "rest" && action.kind === "standard",
    );
    const slow = legalOfType(
      wounded.state,
      content,
      (action) => action.type === "rest" && action.kind === "slowRecovery",
    );
    expect(standard).toHaveLength(0);
    expect(slow.length).toBeGreaterThan(0);
    const rested = applyOk(wounded.state, slow[0] as Action, content);
    expect(rested.state.turn.rested).toBe(true);
    expect(rested.state.players[0]?.hand.length).toBe(1);
    expect(getLegalActions(rested.state, content).actions).toContainEqual({
      epoch: rested.state.actionEpoch,
      type: "endTurn",
    });
  });
});

describe("determinism and invariants", () => {
  it("replays the same random-legal sequence to the same hashes", () => {
    const content = createFixtureContent();
    let first = createGame({ seed: 99 }, content).state;
    let second = createGame({ seed: 99 }, content).state;
    expect(hashState(first)).toBe(hashState(second));
    for (let step = 0; step < 12; step += 1) {
      const legal = getLegalActions(first, content);
      if (legal.actions.length === 0) {
        break;
      }
      const action = legal.actions[0] as Action;
      const a = applyAction(first, action, content);
      const b = applyAction(second, action, content);
      expect(a.ok && b.ok).toBe(true);
      if (!a.ok || !b.ok) {
        break;
      }
      expect(hashState(a.result.state)).toBe(hashState(b.result.state));
      expect(a.result.stateHash).toBe(b.result.stateHash);
      expect(checkInvariants(a.result.state, content)).toEqual([]);
      first = a.result.state;
      second = b.result.state;
    }
  });

  it("reads terrain costs from the content bundle (mutation test)", () => {
    const { content, state } = setup();
    const draft = clone(state);
    draft.turn.movePoints = 6;
    const mutated: ContentBundle = {
      ...content,
      rulesConstants: {
        ...content.rulesConstants,
        terrainMoveCost: {
          ...content.rulesConstants.terrainMoveCost,
          plains: { day: 7, night: 7 },
        },
      },
    };
    expect(getReachableHexes(draft, content).has("1,0")).toBe(true);
    expect(getReachableHexes(draft, mutated).has("1,0")).toBe(false);
  });

  it("loads Day terrain costs from the content bundle", () => {
    const { content, state } = setup();
    const draft = clone(state);
    draft.turn.movePoints = 10;
    const costs = getReachableHexes(draft, content);
    expect(costs.get("1,0")).toBe(2);
    expect(costs.get("-1,0")).toBe(2);
    expect(costs.get("0,-1")).toBe(3);
    expect(costs.get("0,1")).toBe(3);
    expect(costs.get("-1,1")).toBe(3);
    expect(costs.get("1,-1")).toBe(2);
    expect(costs.has("-1,2")).toBe(false);
    expect(costs.has("0,2")).toBe(false);
  });

  it("explore is its own 2-Move action and a plain move reveals nothing", () => {
    const { content, state } = setup();
    const draft = clone(state);
    draft.turn.movePoints = 2;
    draft.players[0]!.position = { q: 1, r: 0 };
    const exploreAction = { epoch: draft.actionEpoch, type: "explore" } as Action;
    expect(getLegalActions(draft, content).actions).toContainEqual(exploreAction);
    const revealed = applyOk(draft, exploreAction, content);
    expect(revealed.state.turn.movePoints).toBe(0);
    expect(revealed.state.map.tiles[1]?.revealed).toBe(true);
    expect(revealed.events.some((event) => event.type === "tileRevealed")).toBe(true);
    expect(revealed.state.map.enemies).toHaveLength(2);
    expect(checkInvariants(revealed.state, content)).toEqual([]);

    const step = clone(state);
    step.turn.movePoints = 2;
    const moved = applyOk(
      step,
      { epoch: step.actionEpoch, type: "moveTo", target: { q: 1, r: 0 } } as Action,
      content,
    );
    expect(moved.state.map.tiles[1]?.revealed).toBe(false);
    expect(moved.events.some((event) => event.type === "heroMoved")).toBe(true);
  });

  it("rejects an explore that is not adjacent to an unexplored edge", () => {
    const { content, state } = setup();
    const draft = clone(state);
    draft.turn.movePoints = 10;
    draft.players[0]!.position = { q: 0, r: 1 };
    const exploreAction = { epoch: draft.actionEpoch, type: "explore" } as Action;
    expect(getLegalActions(draft, content).actions).not.toContainEqual(exploreAction);
    const rejected = applyAction(draft, exploreAction, content);
    expect(rejected.ok).toBe(false);
  });

  it("expires mana tokens at end of turn and advances to the next round", () => {
    const { content, state } = setup();
    const given = giveCard(state, "basic:will_focus");
    const play = legalOfType(
      given.state,
      content,
      (action) =>
        action.type === "playCard" && action.card === given.instance && action.mode === "basic",
    )[0] as Action;
    const played = applyOk(given.state, play, content);
    const tokens = played.state.players[0]?.manaTokens.length ?? 0;
    // resolve the mana choice, which adds a token
    const choice = legalOfType(
      played.state,
      content,
      (action) => action.type === "resolveChoice",
    )[0] as Action;
    const gained = applyOk(played.state, choice, content);
    expect(gained.state.players[0]?.manaTokens.length).toBeGreaterThanOrEqual(1);
    const ended = applyOk(
      gained.state,
      { epoch: gained.state.actionEpoch, type: "endTurn" } as Action,
      content,
    );
    expect(ended.state.players[0]?.manaTokens).toHaveLength(0);
    expect(ended.state.round).toBe(2);
    expect(ended.state.turn.number).toBe(1);
    expect(ended.state.turn.movePoints).toBe(0);
    expect(tokens).toBeGreaterThanOrEqual(0);
  });

  it("recycles hand, discard and deck (including Wounds) at the end of a round", () => {
    const { content, state } = setup();
    const given = giveCard(state, "basic:march");
    const play = legalOfType(
      given.state,
      content,
      (action) =>
        action.type === "playCard" && action.card === given.instance && action.mode === "basic",
    )[0] as Action;
    const played = applyOk(given.state, play, content);
    const wounded = addWounds(played.state, 1);
    const ended = applyOk(
      wounded.state,
      { epoch: wounded.state.actionEpoch, type: "endTurn" } as Action,
      content,
    );
    const player = ended.state.players[0];
    if (player === undefined) {
      throw new Error("no player");
    }
    const cards = [...player.deck, ...player.discard, ...player.hand];
    expect(cards).toHaveLength(content.rulesConstants.deedDeckSize + 1);
    expect(player.hand).toHaveLength(content.rulesConstants.startingHandSize);
    // 02 §15.2: the Wound went back into the deed deck cycle, not lost and not stuck in hand.
    expect(cards).toContain(wounded.wounds[0]);
    expect(ended.state.round).toBe(2);
  });

  it("flips day/night per scenario pattern and uses night terrain costs", () => {
    const content = createFixtureContent();
    const scenario = { ...content.scenario, timeOfDayPattern: ["day", "night", "day"] as const };
    const patched: ContentBundle = { ...content, scenario };
    const { state } = createGame({ seed: 1 }, patched);
    expect(state.timeOfDay).toBe("day");
    // A turn needs at least one played/discarded card before it can be ended.
    const given = giveCard(state, "basic:march");
    const play = legalOfType(
      given.state,
      patched,
      (action) =>
        action.type === "playCard" && action.card === given.instance && action.mode === "basic",
    )[0] as Action;
    const played = applyOk(given.state, play, patched);
    const ended = applyOk(
      played.state,
      { epoch: played.state.actionEpoch, type: "endTurn" } as Action,
      patched,
    );
    expect(ended.state.round).toBe(2);
    expect(ended.state.timeOfDay).toBe("night");

    // Fixture: forest costs 3 by day and 5 by night. Start (0,0) -> forest (0,1).
    const byDay = { ...ended.state, timeOfDay: "day" as const };
    byDay.turn = { ...byDay.turn, movePoints: 4 };
    const byNight = { ...ended.state, timeOfDay: "night" as const };
    byNight.turn = { ...byNight.turn, movePoints: 4 };
    expect(getReachableHexes(byDay, patched).has(hexKeyFor({ q: 0, r: 1 }))).toBe(true);
    expect(getReachableHexes(byNight, patched).has(hexKeyFor({ q: 0, r: 1 }))).toBe(false);
  });

  it("places the city garrison once the city tile is revealed", () => {
    const content = createFixtureContent();
    const scenario = {
      ...content.scenario,
      city: {
        siteId: "site:city",
        hex: { q: 0, r: 0 },
        level: 4,
        garrison: ["enemy:test_brute"],
        fame: 10,
      },
    };
    const patched: ContentBundle = { ...content, scenario };
    const { state } = createGame({ seed: 1 }, patched);
    expect(state.result).toBeNull();
    const garrison = state.map.enemies.filter((enemy) => enemy.kind === "city");
    expect(garrison).toHaveLength(1);
    expect(state.map.sites.some((site) => (site.siteId as string) === "site:city")).toBe(true);
  });

  it("round-trips through JSON with an identical hash", () => {
    const { state } = setup();
    expect(hashState(JSON.parse(JSON.stringify(state)))).toBe(hashState(state));
  });

  it("completes a round and ends the game at the round cap", () => {
    const { content } = setup();
    let state = createGame({ seed: 7 }, content).state;
    for (let step = 0; step < 40 && !state.gameOver; step += 1) {
      const legal = getLegalActions(state, content);
      const endTurn = legal.actions.find((action) => action.type === "endTurn");
      let action: Action;
      if (endTurn !== undefined) {
        action = endTurn;
      } else if (state.pending !== null) {
        action = legal.actions[0] as Action;
      } else {
        const play = legal.actions.find((candidate) => candidate.type === "playCard");
        action = (play ?? legal.actions[0]) as Action;
      }
      const outcome: ApplyOutcome = applyAction(state, action, content);
      expect(outcome.ok).toBe(true);
      if (!outcome.ok) {
        break;
      }
      state = outcome.result.state;
    }
    expect(state.gameOver).toBe(true);
    expect(state.result?.outcome).toBe("defeat");
    // The final round has no next prepare, so no fresh hand is drawn.
    expect(state.players[0]?.hand).toHaveLength(0);
  });
  it("allows only one combat per space per turn", () => {
    const setupResult = setup(3);
    const content = setupResult.content;
    let state = setupResult.state;
    for (let index = 0; index < 4; index += 1) {
      state = giveDeckCard(state, "basic:march");
    }
    const playLegal = (candidate: Action) => {
      state = applyOk(state, candidate, content).state;
    };
    // Step off the start tile, then reveal the countryside adjacent to (1,0).
    state = playMarch(state, content).state;
    const walkTo = (target: { q: number; r: number }) =>
      getLegalActions(state, content).actions.find(
        (candidate) =>
          candidate.type === "moveTo" &&
          candidate.target.q === target.q &&
          candidate.target.r === target.r,
      );
    playLegal(walkTo({ q: 1, r: 0 }) as Action);
    state = playMarch(state, content).state;
    const exploreAction = getLegalActions(state, content).actions.find(
      (candidate) => candidate.type === "explore",
    );
    expect(exploreAction).toBeDefined();
    playLegal(exploreAction as Action);
    expect(state.map.enemies).toHaveLength(2);

    // Walk onto the hills hex holding the first enemy and assault it.
    for (let index = 0; index < 2; index += 1) {
      state = playMarch(state, content).state;
    }
    playLegal(walkTo({ q: 2, r: 0 }) as Action);
    expect(state.map.enemies.some((enemy) => enemy.alive)).toBe(true);

    const challenge = getLegalActions(state, content).actions.find(
      (candidate) => candidate.type === "challengeRampaging",
    );
    expect(challenge).toBeDefined();
    playLegal(challenge as Action);
    expect(state.combat).not.toBeNull();
    // Run the phases to the attack step, then withdraw without defeating the enemy.
    while (state.combat !== null && state.combat.phase !== "attack") {
      const legal = getLegalActions(state, content).actions;
      const next =
        legal.find((candidate) => candidate.type === "assignDamage") ??
        legal.find((candidate) => candidate.type === "endCombatPhase");
      expect(next).toBeDefined();
      playLegal(next as Action);
    }
    playLegal(
      getLegalActions(state, content).actions.find(
        (candidate) => candidate.type === "endCombatPhase",
      ) as Action,
    );
    expect(state.combat).toBeNull();
    expect(
      getLegalActions(state, content).actions.some(
        (candidate) => candidate.type === "challengeRampaging",
      ),
    ).toBe(false);
    // The flag clears with the turn: next round the same space may be assaulted again.
    playLegal(
      getLegalActions(state, content).actions.find(
        (candidate) => candidate.type === "endTurn",
      ) as Action,
    );
    expect(state.round).toBe(2);
    expect(
      getLegalActions(state, content).actions.some(
        (candidate) => candidate.type === "challengeRampaging",
      ),
    ).toBe(true);
  });

  it("conquers the city when the whole garrison is defeated", () => {
    const base = createFixtureContent();
    const content: ContentBundle = {
      ...base,
      sites: {
        ...base.sites,
        "site:city": {
          id: "site:city",
          name: "City",
          siteKind: "city",
          fortified: true,
          inhabited: true,
          healing: null,
          interaction: [],
        },
      },
      scenario: {
        ...base.scenario,
        city: {
          siteId: "site:city",
          hex: { q: 1, r: 0 },
          level: 4,
          garrison: ["enemy:test_brute", "enemy:test_brute"],
          fame: 10,
        },
      },
    };
    let state = createGame({ seed: 1 }, content).state;
    const garrison = state.map.enemies.filter((enemy) => enemy.kind === "city");
    expect(garrison).toHaveLength(2);
    state = giveCard(state, "basic:march").state;
    state = playMarch(state, content).state;
    const move = getLegalActions(state, content).actions.find(
      (candidate) => candidate.type === "moveTo" && candidate.target.q === 1,
    );
    state = applyOk(state, move as Action, content).state;
    state = applyOk(
      state,
      getLegalActions(state, content).actions.find(
        (candidate) => candidate.type === "challengeRampaging",
      ) as Action,
      content,
    ).state;
    while (state.combat !== null && state.combat.phase !== "assignDamage") {
      state = applyOk(
        state,
        getLegalActions(state, content).actions.find(
          (candidate) => candidate.type === "endCombatPhase",
        ) as Action,
        content,
      ).state;
    }
    while (
      state.combat !== null &&
      state.combat.phase === "assignDamage" &&
      state.combat.pendingDamage.length > 0
    ) {
      state = applyOk(
        state,
        getLegalActions(state, content).actions.find(
          (candidate) => candidate.type === "assignDamage",
        ) as Action,
        content,
      ).state;
    }
    // Give the hero enough attack to wipe the garrison; each assignment consumes its attack.
    for (let index = 0; index < 2; index += 1) {
      const armed = clone(state);
      if (armed.combat === null) {
        break;
      }
      const target = armed.combat.enemies.find((enemy) => !enemy.defeated);
      if (target === undefined) {
        break;
      }
      armed.combat.attackPool.push({ amount: 12, element: "physical", combatType: "melee" });
      state = armed;
      state = applyOk(
        state,
        { epoch: state.actionEpoch, type: "assignAttack", enemy: target.instanceId },
        content,
      ).state;
    }
    expect(state.gameOver).toBe(true);
    expect(state.result).toMatchObject({
      outcome: "victory",
      cityConquered: true,
      reason: "city_conquered",
    });
    expect(state.result?.score).toBe((state.players[0]?.fame ?? 0) + 10);
    expect(state.map.sites.find((site) => (site.siteId as string) === "site:city")?.conquered).toBe(
      true,
    );
  });

  it("depletes gold source dice at night and black dice by day", () => {
    const base = createFixtureContent();
    const nightContent: ContentBundle = {
      ...base,
      scenario: { ...base.scenario, timeOfDayPattern: ["night", "day"] },
    };
    const nightState = createGame({ seed: 1 }, nightContent).state;
    expect(nightState.timeOfDay).toBe("night");
    for (const die of nightState.source) {
      if (die.color === "gold") {
        expect(die).toMatchObject({ used: true });
      }
      if (die.color === "black") {
        expect(die.used).toBe(false);
      }
    }
    const dayContent: ContentBundle = {
      ...base,
      scenario: { ...base.scenario, timeOfDayPattern: ["day", "night"] },
    };
    const dayState = createGame({ seed: 1 }, dayContent).state;
    expect(dayState.timeOfDay).toBe("day");
    for (const die of dayState.source) {
      if (die.color === "black") {
        expect(die).toMatchObject({ used: true });
      }
      if (die.color === "gold") {
        expect(die.used).toBe(false);
      }
    }
  });
});
