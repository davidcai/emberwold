import { describe, expect, it } from "vitest";

import { createFixtureContent } from "./__fixtures__/content";
import { applyAction, checkInvariants, createGame, getLegalActions, getReachableHexes, hashState } from "./engine";
import type { Action, ApplyOutcome, GameState } from "./types";
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
        terrainMoveCost: { ...content.rulesConstants.terrainMoveCost, plains: { day: 7, night: 7 } },
      },
    };
    expect(getReachableHexes(draft, content).has("1,0")).toBe(true);
    expect(getReachableHexes(draft, mutated).has("1,0")).toBe(false);
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
    expect(state.players[0]?.hand.length).toBeGreaterThan(0);
  });
});
