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
  it("accepts endTurn at any time outside combat and closes the round without a dummy", () => {
    const { content, state } = setup();
    const endTurn = { epoch: state.actionEpoch, type: "endTurn" } as Action;
    expect(getLegalActions(state, content).actions).toContainEqual(endTurn);
    const ended = applyOk(state, endTurn, content);
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
  it("runs the T1 round clock: tactics, dummy flips, final turn, next-round prep", () => {
    const base = createFixtureContent();
    const content: ContentBundle = {
      ...base,
      tactics: {
        "tactic:a": { id: "tactic:a", name: "A" },
        "tactic:b": { id: "tactic:b", name: "B" },
        "tactic:c": { id: "tactic:c", name: "C" },
      },
      scenario: {
        ...base.scenario,
        tacticIds: ["tactic:a", "tactic:b", "tactic:c"],
        tacticRules: {
          humanChoosesFirst: true,
          dummyRandom: true,
          usedTacticsRemovedEachRound: true,
        },
        dummy: { deckSize: 4, cardsPerTurn: 3, crystals: ["green", "green", "blue"] },
        timeOfDayPattern: ["day", "night", "day"],
      },
    };
    let state = createGame({ seed: 1 }, content).state;
    expect(state.tacticChoice?.options).toHaveLength(3);
    expect(state.tactics.available).toHaveLength(3);
    const tacticActions = getLegalActions(state, content).actions;
    expect(tacticActions.every((candidate) => candidate.type === "chooseTactic")).toBe(true);
    state = applyOk(
      state,
      { epoch: state.actionEpoch, type: "chooseTactic", tactic: "tactic:a" },
      content,
    ).state;
    expect(state.tacticChoice).toBeNull();
    expect(state.tactics.human).toBe("tactic:a");
    expect(state.tactics.dummy).not.toBeNull();
    expect(state.turn.number).toBe(1);

    // Turn 1 ends → dummy flips 3 of 4 cards, hero turn 2 starts.
    let outcome = applyOk(state, { epoch: state.actionEpoch, type: "endTurn" }, content);
    state = outcome.state;
    expect(outcome.events.some((event) => event.type === "dummyFlipped")).toBe(true);
    expect(state.dummy?.cardsRemaining).toBe(1);
    expect(state.endOfRoundAnnounced).toBe(false);
    expect(state.turn.number).toBe(2);
    expect(state.round).toBe(1);

    // Turn 2 ends → dummy flips the last card and announces End of Round; hero gets one
    // more turn before the round closes.
    outcome = applyOk(state, { epoch: state.actionEpoch, type: "endTurn" }, content);
    state = outcome.state;
    expect(state.endOfRoundAnnounced).toBe(true);
    expect(state.turn.number).toBe(3);
    expect(state.round).toBe(1);
    expect(outcome.events.some((event) => event.type === "endOfRoundAnnounced")).toBe(true);

    // Final turn ends → round 2 prepare: night, fresh hand, dummy refilled, tactics reduced
    // to the unused card, and the round's two tactic picks are removed.
    outcome = applyOk(state, { epoch: state.actionEpoch, type: "endTurn" }, content);
    state = outcome.state;
    expect(state.round).toBe(2);
    expect(state.timeOfDay).toBe("night");
    expect(state.players[0]?.hand).toHaveLength(5);
    expect(state.dummy?.cardsRemaining).toBe(4);
    expect(state.tactics.used).toHaveLength(2);
    expect(state.tacticChoice?.options).toHaveLength(1);
    expect(state.tactics.available).toHaveLength(1);

    // Round 2: pick the remaining tactic, then end the round immediately (one dummy flip).
    state = applyOk(
      state,
      {
        epoch: state.actionEpoch,
        type: "chooseTactic",
        tactic: state.tacticChoice?.options[0] ?? "",
      } as Action,
      content,
    ).state;
    state = applyOk(state, { epoch: state.actionEpoch, type: "endTurn" }, content).state;
    state = applyOk(state, { epoch: state.actionEpoch, type: "endTurn" }, content).state;
    state = applyOk(state, { epoch: state.actionEpoch, type: "endTurn" }, content).state;
    expect(state.round).toBe(3);
    expect(state.tacticChoice).toBeNull();

    // Round 3 ends → defeat with reason round_limit.
    state = applyOk(state, { epoch: state.actionEpoch, type: "endTurn" }, content).state;
    state = applyOk(state, { epoch: state.actionEpoch, type: "endTurn" }, content).state;
    state = applyOk(state, { epoch: state.actionEpoch, type: "endTurn" }, content).state;
    expect(state.gameOver).toBe(true);
    expect(state.result).toMatchObject({ outcome: "defeat", reason: "round_limit" });
  });
  it("sells an advanced action at a monastery and tops the offer up from the deck", () => {
    const base = createFixtureContent();
    const startTile = base.tiles["tile:start"];
    if (startTile === undefined) {
      throw new Error("fixture tile missing");
    }
    const content: ContentBundle = {
      ...base,
      cards: {
        ...base.cards,
        "advanced:test_rage": {
          id: "advanced:test_rage",
          name: "Test Rage",
          color: "red",
          poweredBy: "red",
          sidewaysValue: 1,
          effects: {
            basic: { op: "gain_attack", amount: 2, combat_type: "melee", element: "physical" },
            powered: null,
          },
        },
        "advanced:test_guard": {
          id: "advanced:test_guard",
          name: "Test Guard",
          color: "blue",
          poweredBy: "blue",
          sidewaysValue: 1,
          effects: { basic: { op: "gain_block", amount: 2, element: "physical" }, powered: null },
        },
      },
      sites: {
        ...base.sites,
        "site:monastery": {
          id: "site:monastery",
          name: "Monastery",
          siteKind: "monastery",
          fortified: false,
          inhabited: true,
          healing: { influencePerPoint: 2 },
          interaction: [],
        },
      },
      tiles: {
        ...base.tiles,
        "tile:start": {
          ...startTile,
          hexes: startTile.hexes.map((hex) =>
            hex.q === 0 && hex.r === 0 ? { ...hex, site: null } : hex,
          ),
        },
      },
      scenario: {
        ...base.scenario,
        site: { siteId: "site:monastery", hex: { q: 0, r: 0 } },
        aaOffer: ["advanced:test_rage"],
        aaDeck: ["advanced:test_guard"],
        spellOffer: [],
        spellDeck: [],
      },
    };
    let state = createGame({ seed: 3 }, content).state;
    state = clone(state);
    state.turn.influence = 6;
    state = applyOk(state, { epoch: state.actionEpoch, type: "enterSite" }, content).state;
    const buys = legalOfType(state, content, (action) => action.type === "buyAdvancedAction");
    expect(buys).toHaveLength(1);
    const outcome = applyOk(state, buys[0] as Action, content);
    state = outcome.state;
    expect(outcome.events).toContainEqual(
      expect.objectContaining({ type: "cardGained", source: "monastery" }),
    );
    expect(state.offers.aa).toEqual(["advanced:test_guard"]);
    expect(state.offers.aa).toHaveLength(1);
    const top = state.players[0]?.deck[0];
    expect(top).toBeDefined();
    expect(String(state.cardInstances[top as CardInstanceId])).toBe("advanced:test_rage");
    expect(state.turn.influence).toBe(0);
  });

  it("sells a spell at a tower site for influence plus one matching mana crystal", () => {
    const base = createFixtureContent();
    const startTile = base.tiles["tile:start"];
    if (startTile === undefined) {
      throw new Error("fixture tile missing");
    }
    const content: ContentBundle = {
      ...base,
      cards: {
        ...base.cards,
        "spell:test_fire": {
          id: "spell:test_fire",
          name: "Test Fire",
          color: "red",
          poweredBy: "red",
          sidewaysValue: 1,
          effects: {
            basic: { op: "gain_attack", amount: 5, combat_type: "ranged", element: "fire" },
            powered: null,
          },
        },
      },
      sites: {
        ...base.sites,
        "site:mage_tower": {
          id: "site:mage_tower",
          name: "Tower Site",
          siteKind: "mage_tower",
          fortified: true,
          inhabited: true,
          healing: null,
          interaction: [],
        },
      },
      tiles: {
        ...base.tiles,
        "tile:start": {
          ...startTile,
          hexes: startTile.hexes.map((hex) =>
            hex.q === 0 && hex.r === 0 ? { ...hex, site: null } : hex,
          ),
        },
      },
      scenario: {
        ...base.scenario,
        site: { siteId: "site:mage_tower", hex: { q: 0, r: 0 } },
        aaOffer: [],
        aaDeck: [],
        spellOffer: ["spell:test_fire"],
        spellDeck: [],
      },
    };
    let state = createGame({ seed: 4 }, content).state;
    state = clone(state);
    state.turn.influence = 7;
    state.players[0] = {
      ...state.players[0]!,
      crystals: { ...state.players[0]!.crystals, red: 1 },
    };
    state = applyOk(state, { epoch: state.actionEpoch, type: "enterSite" }, content).state;
    const buys = legalOfType(state, content, (action) => action.type === "buySpell");
    expect(buys).toHaveLength(1);
    const outcome = applyOk(state, buys[0] as Action, content);
    state = outcome.state;
    expect(outcome.events).toContainEqual(
      expect.objectContaining({ type: "cardGained", source: "mage_tower" }),
    );
    expect(state.players[0]?.crystals.red).toBe(0);
    expect(state.turn.influence).toBe(0);
    expect(String(state.cardInstances[state.players[0]?.deck[0] as CardInstanceId])).toBe(
      "spell:test_fire",
    );
  });

  it("discards one wound on a magical glade without healing it", () => {
    const base = createFixtureContent();
    const startTile = base.tiles["tile:start"];
    if (startTile === undefined) {
      throw new Error("fixture tile missing");
    }
    const content: ContentBundle = {
      ...base,
      sites: {
        ...base.sites,
        "site:magical_glade": {
          id: "site:magical_glade",
          name: "Magical Glade",
          siteKind: "special",
          fortified: false,
          inhabited: false,
          healing: null,
          interaction: [],
        },
      },
      tiles: {
        ...base.tiles,
        "tile:start": {
          ...startTile,
          hexes: startTile.hexes.map((hex) =>
            hex.q === 0 && hex.r === 0 ? { ...hex, site: null } : hex,
          ),
        },
      },
      scenario: {
        ...base.scenario,
        site: { siteId: "site:magical_glade", hex: { q: 0, r: 0 } },
      },
    };
    let state = createGame({ seed: 5 }, content).state;
    state = addWounds(state, 1).state;
    const glade = legalOfType(state, content, (action) => action.type === "discardGladeWound");
    expect(glade).toHaveLength(1);
    const outcome = applyOk(state, glade[0] as Action, content);
    state = outcome.state;
    expect(outcome.events).toContainEqual({ type: "woundDiscarded", count: 1 });
    const wounds = state.players[0]?.hand.filter(
      (instance) => String(state.cardInstances[instance]) === "card:wound",
    );
    expect(wounds).toHaveLength(0);
  });

  it("yields one crystal when the turn ends on a crystal mine", () => {
    const base = createFixtureContent();
    const startTile = base.tiles["tile:start"];
    if (startTile === undefined) {
      throw new Error("fixture tile missing");
    }
    const content: ContentBundle = {
      ...base,
      tiles: {
        ...base.tiles,
        "tile:start": {
          ...startTile,
          hexes: startTile.hexes.map((hex) =>
            hex.q === 0 && hex.r === 0 ? { ...hex, site: null, mine_color: "red" } : hex,
          ),
        },
      },
    };
    let state = createGame({ seed: 6 }, content).state;
    const redBefore = state.players[0]?.crystals.red ?? 0;
    const outcome = applyOk(state, { epoch: state.actionEpoch, type: "endTurn" }, content);
    state = outcome.state;
    expect(outcome.events).toContainEqual({ type: "crystalGained", color: "red" });
    expect(state.players[0]?.crystals.red).toBe(redBefore + 1);
  });

  it("applies take_wound inside a combat card choice", () => {
    const base = createFixtureContent();
    const content: ContentBundle = {
      ...base,
      cards: {
        ...base.cards,
        "advanced:test_blood": {
          id: "advanced:test_blood",
          name: "Test Blood",
          color: "red",
          poweredBy: "red",
          sidewaysValue: 1,
          effects: {
            basic: {
              op: "choice",
              options: [
                { op: "gain_attack", amount: 2, combat_type: "melee", element: "physical" },
                {
                  op: "compound",
                  effects: [
                    { op: "take_wound" },
                    { op: "gain_attack", amount: 5, combat_type: "melee", element: "physical" },
                  ],
                },
              ],
            },
            powered: null,
          },
        },
      },
    };
    let state = createGame({ seed: 7 }, content).state;
    state = clone(state);
    const instance = "test:blood" as CardInstanceId;
    state.cardInstances[instance] = "advanced:test_blood" as never;
    state.players[0]?.hand.push(instance);
    state.combat = {
      phase: "attack",
      enemies: [
        {
          instanceId: "enemy:test" as never,
          defId: "enemy:test_brute",
          blocked: false,
          defeated: false,
        },
      ],
      attackPool: [],
      blockPool: [],
      pendingDamage: [],
    };
    state.map.enemies.push({
      instanceId: "enemy:test" as never,
      defId: "enemy:test_brute",
      hex: state.players[0]?.position ?? { q: 0, r: 0 },
      alive: true,
      kind: "rampaging",
    });
    const play = legalOfType(
      state,
      content,
      (action) => action.type === "playCard" && "card" in action && action.card === instance,
    );
    expect(play).toHaveLength(1);
    let outcome = applyOk(state, play[0] as Action, content);
    expect(outcome.state.pending?.kind).toBe("effectChoice");
    outcome = applyOk(
      outcome.state,
      {
        epoch: outcome.state.actionEpoch,
        type: "resolveChoice",
        choiceId: outcome.state.pending?.choiceId ?? "",
        optionIndex: 1,
      },
      content,
    );
    const events = outcome.events.map((event) => event.type);
    expect(events).toContain("woundGained");
    expect(outcome.state.combat?.attackPool).toContainEqual({
      amount: 5,
      element: "physical",
      combatType: "melee",
    });
  });
  it("levels up at the end of the turn, gaining a skill and an advanced action at even levels", () => {
    const base = createFixtureContent();
    const content: ContentBundle = {
      ...base,
      levels: [
        { level: 1, fame: 0, stats: { armor: 2, handLimit: 5, commandSlots: 1 } },
        { level: 2, fame: 3, stats: { armor: 2, handLimit: 5, commandSlots: 1 } },
        { level: 3, fame: 8, stats: { armor: 3, handLimit: 5, commandSlots: 2 } },
        { level: 4, fame: 15, stats: { armor: 3, handLimit: 5, commandSlots: 2 } },
      ],
      cards: {
        ...base.cards,
        "advanced:test_reward": {
          id: "advanced:test_reward",
          name: "Test Reward",
          color: "red",
          poweredBy: "red",
          sidewaysValue: 1,
          effects: {
            basic: { op: "gain_attack", amount: 1, combat_type: "melee", element: "physical" },
            powered: null,
          },
        },
        "advanced:test_next": {
          id: "advanced:test_next",
          name: "Test Next",
          color: "blue",
          poweredBy: "blue",
          sidewaysValue: 1,
          effects: { basic: { op: "gain_block", amount: 1, element: "physical" }, powered: null },
        },
      },
      skills: {
        "skill:test_first": {
          id: "skill:test_first",
          name: "First",
          hero: "test",
          usageType: "once_per_turn",
          effect: null,
        },
      },
      scenario: {
        ...base.scenario,
        aaOffer: ["advanced:test_reward"],
        aaDeck: ["advanced:test_next"],
        skillDeck: ["skill:test_first"],
      },
    };
    let state = createGame({ seed: 8 }, content).state;
    expect(state.players[0]?.level).toBe(1);
    state = clone(state);
    state.players[0]!.fame = 3;
    const outcome = applyOk(state, { epoch: state.actionEpoch, type: "endTurn" }, content);
    state = outcome.state;
    expect(state.players[0]?.level).toBe(2);
    expect(state.players[0]?.skills).toEqual(["skill:test_first"]);
    const gained = outcome.events.filter((event) => event.type === "cardGained");
    expect(gained).toHaveLength(1);
    expect((gained[0] as { source?: string }).source).toBe("level_up");
    // The round-end shuffle re-randomises the deck, so the gained card is somewhere in it.
    const player = state.players[0];
    const allCards = [...(player?.hand ?? []), ...(player?.deck ?? []), ...(player?.discard ?? [])];
    const reward = allCards.find(
      (instance) => String(state.cardInstances[instance]) === "advanced:test_reward",
    );
    expect(reward).toBeDefined();
    expect(state.offers.aa).toEqual(["advanced:test_next"]);
  });

  it("uses the level table for hero armor when assigning damage", () => {
    const base = createFixtureContent();
    const content: ContentBundle = {
      ...base,
      levels: [
        { level: 1, fame: 0, stats: { armor: 2, handLimit: 5, commandSlots: 1 } },
        { level: 2, fame: 3, stats: { armor: 4, handLimit: 5, commandSlots: 1 } },
      ],
    };
    let state = createGame({ seed: 9 }, content).state;
    state = clone(state);
    state.players[0]!.level = 2;
    state.combat = {
      phase: "assignDamage",
      enemies: [
        {
          instanceId: "enemy:test" as never,
          defId: "enemy:test_brute",
          blocked: false,
          defeated: false,
        },
      ],
      attackPool: [],
      blockPool: [],
      pendingDamage: [{ enemyInstanceId: "enemy:test" as never, amount: 5 }],
    };
    const legal = legalOfType(state, content, (action) => action.type === "assignDamage");
    expect(legal).toHaveLength(1);
    const outcome = applyOk(state, legal[0] as Action, content);
    // 5 damage vs armor 4 → floor(5/4) = 1 wound; with the level-1 armor 2 it would be 2.
    expect(outcome.events).toContainEqual({
      type: "damageAssigned",
      enemy: "enemy:test",
      wounds: 1,
    });
  });
  it("activates gained skills with per-turn and per-round usage limits", () => {
    const base = createFixtureContent();
    const content: ContentBundle = {
      ...base,
      skills: {
        "skill:test_turn": {
          id: "skill:test_turn",
          name: "Test Turn",
          hero: "test",
          usageType: "once_per_turn",
          effect: { op: "gain_influence", amount: 1 },
        },
        "skill:test_round": {
          id: "skill:test_round",
          name: "Test Round",
          hero: "test",
          usageType: "once_per_round",
          effect: { op: "gain_crystal", color: "red" },
        },
        "skill:test_unimplemented": {
          id: "skill:test_unimplemented",
          name: "Test Unimplemented",
          hero: "test",
          usageType: "once_per_turn",
          effect: null,
        },
      },
    };
    let state = createGame({ seed: 10 }, content).state;
    state = clone(state);
    state.players[0]!.skills = ["skill:test_turn", "skill:test_round", "skill:test_unimplemented"];
    const offered = legalOfType(state, content, (action) => action.type === "useSkill");
    expect(offered.map((action) => (action as { skill: string }).skill).sort()).toEqual([
      "skill:test_round",
      "skill:test_turn",
    ]);
    let outcome = applyOk(state, offered[0] as Action, content);
    state = outcome.state;
    expect(outcome.events).toContainEqual(expect.objectContaining({ type: "skillUsed" }));
    const afterFirst = legalOfType(state, content, (action) => action.type === "useSkill");
    expect(afterFirst).toHaveLength(offered.length - 1);
    outcome = applyOk(state, afterFirst[0] as Action, content);
    state = outcome.state;
    expect(legalOfType(state, content, (action) => action.type === "useSkill")).toHaveLength(0);
    // Ending the round resets both usage buckets.
    outcome = applyOk(state, { epoch: state.actionEpoch, type: "endTurn" }, content);
    state = outcome.state;
    expect(legalOfType(state, content, (action) => action.type === "useSkill")).toHaveLength(2);
  });
  it("recruits a unit at a village, activates it, and refreshes it at the next round", () => {
    const base = createFixtureContent();
    const startTile = base.tiles["tile:start"];
    if (startTile === undefined) {
      throw new Error("fixture tile missing");
    }
    const content: ContentBundle = {
      ...base,
      units: {
        "unit:test_peasant": {
          id: "unit:test_peasant",
          name: "Test Peasant",
          level: 1,
          influenceCost: 4,
          armor: 3,
          recruitSites: ["village"],
          abilities: [
            {
              manaCost: null,
              text: "influence",
              effect: { op: "gain_influence", amount: 2 },
            },
            {
              manaCost: null,
              text: "attack",
              effect: {
                op: "gain_attack",
                amount: 2,
                combat_type: "melee",
                element: "physical",
              },
            },
          ],
        },
        "unit:test_scout": {
          id: "unit:test_scout",
          name: "Test Scout",
          level: 1,
          influenceCost: 3,
          armor: 3,
          recruitSites: ["village"],
          abilities: [{ manaCost: null, text: "move", effect: { op: "gain_move", amount: 2 } }],
        },
      },
      sites: {
        ...base.sites,
        "site:village": {
          id: "site:village",
          name: "Village",
          siteKind: "inhabited",
          fortified: false,
          inhabited: true,
          healing: { influencePerPoint: 3 },
          interaction: [],
        },
      },
      tiles: {
        ...base.tiles,
        "tile:start": {
          ...startTile,
          hexes: startTile.hexes.map((hex) =>
            hex.q === 0 && hex.r === 0 ? { ...hex, site: null } : hex,
          ),
        },
      },
      levels: [{ level: 1, fame: 0, stats: { armor: 2, handLimit: 5, commandSlots: 1 } }],
      scenario: {
        ...base.scenario,
        site: { siteId: "site:village", hex: { q: 0, r: 0 } },
        unitOffer: ["unit:test_peasant"],
        unitDeck: ["unit:test_scout"],
      },
    };
    let state = createGame({ seed: 11 }, content).state;
    state = clone(state);
    state.turn.influence = 4;
    state = applyOk(state, { epoch: state.actionEpoch, type: "enterSite" }, content).state;
    const recruits = legalOfType(state, content, (action) => action.type === "recruitUnit");
    expect(recruits).toHaveLength(1);
    let outcome = applyOk(state, recruits[0] as Action, content);
    state = outcome.state;
    expect(state.players[0]?.units).toHaveLength(1);
    expect(state.turn.influence).toBe(0);
    expect(state.offers.unit).toEqual([]);
    const unit = state.players[0]?.units[0];
    expect(unit?.ready).toBe(true);
    const activates = legalOfType(state, content, (action) => action.type === "activateUnit");
    // Outside combat only the influence ability applies; attack stays a combat action.
    expect(activates).toHaveLength(1);
    outcome = applyOk(
      state,
      {
        epoch: state.actionEpoch,
        type: "activateUnit",
        unit: unit?.instanceId as never,
        ability: 0,
      },
      content,
    );
    state = outcome.state;
    expect(state.turn.influence).toBe(2);
    expect(state.players[0]?.units[0]?.ready).toBe(false);
    expect(legalOfType(state, content, (action) => action.type === "activateUnit")).toHaveLength(0);
    outcome = applyOk(state, { epoch: state.actionEpoch, type: "endTurn" }, content);
    state = outcome.state;
    expect(state.players[0]?.units[0]?.ready).toBe(true);
    expect(state.offers.unit).toEqual(["unit:test_scout"]);
  });

  it("stops recruiting past the command slot limit", () => {
    const base = createFixtureContent();
    const startTile = base.tiles["tile:start"];
    if (startTile === undefined) {
      throw new Error("fixture tile missing");
    }
    const units: ContentBundle["units"] = {
      "unit:test_a": {
        id: "unit:test_a",
        name: "A",
        level: 1,
        influenceCost: 1,
        armor: 1,
        recruitSites: ["village"],
        abilities: [],
      },
      "unit:test_b": {
        id: "unit:test_b",
        name: "B",
        level: 1,
        influenceCost: 1,
        armor: 1,
        recruitSites: ["village"],
        abilities: [],
      },
    };
    const content: ContentBundle = {
      ...base,
      units,
      sites: {
        ...base.sites,
        "site:village": {
          id: "site:village",
          name: "Village",
          siteKind: "inhabited",
          fortified: false,
          inhabited: true,
          healing: null,
          interaction: [],
        },
      },
      tiles: {
        ...base.tiles,
        "tile:start": {
          ...startTile,
          hexes: startTile.hexes.map((hex) =>
            hex.q === 0 && hex.r === 0 ? { ...hex, site: null } : hex,
          ),
        },
      },
      levels: [{ level: 1, fame: 0, stats: { armor: 2, handLimit: 5, commandSlots: 1 } }],
      scenario: {
        ...base.scenario,
        site: { siteId: "site:village", hex: { q: 0, r: 0 } },
        unitOffer: ["unit:test_a", "unit:test_b"],
        unitDeck: [],
      },
    };
    let state = createGame({ seed: 12 }, content).state;
    state = clone(state);
    state.turn.influence = 10;
    state = applyOk(state, { epoch: state.actionEpoch, type: "enterSite" }, content).state;
    const recruits = legalOfType(state, content, (action) => action.type === "recruitUnit");
    expect(recruits).toHaveLength(2);
    state = applyOk(state, recruits[0] as Action, content).state;
    expect(legalOfType(state, content, (action) => action.type === "recruitUnit")).toHaveLength(0);
  });
  it("draws back up to the hand limit at the end of a non-final turn", () => {
    const base = createFixtureContent();
    const content: ContentBundle = {
      ...base,
      scenario: {
        ...base.scenario,
        dummy: { deckSize: 4, cardsPerTurn: 3, crystals: ["green", "green", "blue"] },
        timeOfDayPattern: ["day", "night", "day"],
      },
    };
    let state = createGame({ seed: 13 }, content).state;
    state = clone(state);
    const player = state.players[0];
    const discarded = player?.hand.pop();
    if (discarded !== undefined) {
      player?.discard.push(discarded);
    }
    expect(state.players[0]?.hand).toHaveLength(4);
    const outcome = applyOk(state, { epoch: state.actionEpoch, type: "endTurn" }, content);
    expect(outcome.state.players[0]?.hand).toHaveLength(content.rulesConstants.startingHandSize);
    expect(outcome.events).toContainEqual({ type: "cardDrawn", count: 1 });
  });
  it("discards a non-wound card before the end-of-turn draw", () => {
    const base = createFixtureContent();
    const content: ContentBundle = {
      ...base,
      scenario: {
        ...base.scenario,
        dummy: { deckSize: 4, cardsPerTurn: 3, crystals: ["green", "green", "blue"] },
      },
    };
    let state = createGame({ seed: 14 }, content).state;
    state = clone(state);
    const card = state.players[0]?.hand[0];
    if (card === undefined) {
      throw new Error("no hand card");
    }
    const discards = legalOfType(
      state,
      content,
      (action) => action.type === "discardCard" && action.card === card,
    );
    expect(discards).toHaveLength(1);
    let outcome = applyOk(state, discards[0] as Action, content);
    state = outcome.state;
    expect(outcome.events).toContainEqual({ type: "cardDiscarded", card });
    expect(state.players[0]?.hand).toHaveLength(4);
    outcome = applyOk(state, { epoch: state.actionEpoch, type: "endTurn" }, content);
    expect(outcome.state.players[0]?.hand).toHaveLength(5);
  });
  it("reveals tile sites only when the tile is explored", () => {
    const content = createFixtureContent();
    let state = createGame({ seed: 21 }, content).state;
    expect(state.map.sites.map((site) => site.siteId as string)).toContain("site:portal");
    expect(state.map.sites.map((site) => site.siteId as string)).not.toContain("site:village");
    state = clone(state);
    const player = state.players[0];
    if (player === undefined) {
      throw new Error("no player");
    }
    player.position = { q: 1, r: 0 };
    state.turn.movePoints = 2;
    const explore = getLegalActions(state, content).actions.find(
      (action) => action.type === "explore",
    );
    expect(explore).toBeDefined();
    const outcome = applyOk(state, explore as Action, content);
    const siteIds = outcome.state.map.sites.map((site) => site.siteId as string);
    expect(siteIds).toContain("site:village");
    const village = outcome.state.map.sites.find(
      (site) => (site.siteId as string) === "site:village",
    );
    expect(village?.hex).toEqual({ q: 2, r: 0 });
  });
});
