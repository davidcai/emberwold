/**
 * Records the committed scenario traces by running a small goal-driven policy against the
 * real content bundle, then writes a replayable trace file.
 *
 * Usage: tsx tools/golden-traces/src/record-scenario.ts --name=move-reveal
 *        tsx tools/golden-traces/src/record-scenario.ts --name=combat
 *        tsx tools/golden-traces/src/record-scenario.ts --name=site-heal
 *        tsx tools/golden-traces/src/record-scenario.ts --name=one-round
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";

import { bundle } from "@emberwold/content";
import { applyAction, createGame, getLegalActions } from "@emberwold/engine";
import type { Action, GameEvent, GameState } from "@emberwold/engine";

import { outcomeOf, type TraceFile } from "./trace";

type Policy = (state: GameState) => Action | null;

const TRACE_NAMES: Readonly<Record<string, string>> = {
  "move-reveal": "010-move-reveal.json",
  combat: "020-combat.json",
  "site-heal": "030-site-heal.json",
  "one-round": "040-one-round.json",
};

function predicateAction(state: GameState, predicate: (action: Action) => boolean): Action | null {
  return getLegalActions(state, bundle).actions.find(predicate) ?? null;
}

function resolvePending(state: GameState): Action | null {
  return predicateAction(state, (action) => action.type === "resolveChoice");
}

function moveCardInHand(state: GameState): Action | null {
  return predicateAction(state, (action) => {
    if (action.type !== "playCard" || action.mode !== "basic") {
      return false;
    }
    const defId = state.cardInstances[action.card];
    const def = defId === undefined ? undefined : bundle.cards[defId];
    return def?.effects.basic.op === "gain_move";
  });
}

function moveTo(state: GameState, q: number, r: number): Action | null {
  return predicateAction(
    state,
    (action) => action.type === "moveTo" && action.target.q === q && action.target.r === r,
  );
}

/** Takes a generic action if the specific goal is not yet reachable this turn. */
function fallback(state: GameState, preferEndTurn: boolean): Action | null {
  const endTurn = predicateAction(state, (action) => action.type === "endTurn");
  if (preferEndTurn && endTurn !== null) {
    return endTurn;
  }
  return (
    predicateAction(
      state,
      (action) => action.type === "playCardSideways" && action.as === "move",
    ) ??
    predicateAction(state, (action) => action.type === "playCardSideways") ??
    predicateAction(state, (action) => action.type === "rest") ??
    endTurn
  );
}

/** Explore the countryside tile: get 2 Move, step to the frontier, then explore. */
const moveRevealPolicy: Policy = (state) => {
  if (state.pending !== null) {
    return resolvePending(state);
  }
  if (state.combat !== null) {
    return predicateAction(state, (action) => action.type === "endCombatPhase");
  }
  if (predicateAction(state, (action) => action.type === "explore") !== null) {
    return predicateAction(state, (action) => action.type === "explore");
  }
  if (state.turn.movePoints >= bundle.rulesConstants.tileRevealCost) {
    const frontier = moveTo(state, 1, 0);
    if (frontier !== null) {
      return frontier;
    }
  }
  const move = moveCardInHand(state) ?? moveTo(state, 1, 0);
  if (move !== null) {
    return move;
  }
  return fallback(state, true);
};

function run(seed: number, policy: Policy, stopEvents: readonly string[], maxActions = 200) {
  let state = createGame({ seed }, bundle).state;
  const actions: Action[] = [];
  const expectedHashes: string[] = [];
  const seen: GameEvent[] = [];
  for (let step = 0; step < maxActions && !state.gameOver; step += 1) {
    const action = policy(state);
    if (action === null) {
      return null;
    }
    const outcome = applyAction(state, action, bundle);
    if (!outcome.ok) {
      return null;
    }
    actions.push(action);
    expectedHashes.push(outcome.result.stateHash);
    seen.push(...outcome.result.events);
    state = outcome.result.state;
    if (seen.some((event) => stopEvents.includes(event.type))) {
      return { seed, state, actions, expectedHashes, seen };
    }
  }
  return null;
}

function findSeed(policy: Policy, stopEvents: readonly string[]): ReturnType<typeof run> {
  for (let seed = 1; seed <= 60; seed += 1) {
    const result = run(seed, policy, stopEvents);
    if (result !== null) {
      return result;
    }
  }
  return null;
}

function main(): void {
  const nameArg = process.argv.find((argument) => argument.startsWith("--name="));
  const name = nameArg === undefined ? "" : nameArg.slice("--name=".length);
  const fileName = TRACE_NAMES[name];
  if (fileName === undefined) {
    console.error(`record-scenario: unknown scenario "${name}"`);
    process.exit(2);
  }

  let policy: Policy;
  let stopEvents: string[];
  switch (name) {
    case "move-reveal":
      policy = moveRevealPolicy;
      stopEvents = ["tileRevealed"];
      break;
    default:
      console.error(`record-scenario: scenario "${name}" not implemented yet`);
      process.exit(2);
  }

  const result = findSeed(policy, stopEvents);
  if (result === null) {
    console.error(`record-scenario: ${name}: no seed completed the scenario within the action cap`);
    process.exit(1);
  }
  const trace: TraceFile = {
    traceVersion: 1,
    contentHash: bundle.contentHash,
    engineVersion: result.state.engineVersion,
    rulesetId: result.state.rulesetId,
    seed: result.seed,
    config: { seed: result.seed },
    actions: result.actions,
    expectedHashes: result.expectedHashes,
    expectedOutcome: outcomeOf(result.state),
  };
  const out = join("tools", "golden-traces", fileName);
  writeFileSync(out, `${JSON.stringify(trace, null, 2)}\n`);
  const eventTypes = [...new Set(result.seen.map((event) => event.type))];
  console.log(
    `scenario recorded: ${out} seed=${trace.seed} actions=${trace.actions.length} ` +
      `events=${eventTypes.join(",")} round=${result.state.round}`,
  );
}

main();
