/**
 * Records the committed scenario traces with a small goal-driven policy against the real
 * content bundle, then writes a replayable trace file.
 *
 * Usage: tsx tools/golden-traces/src/record-scenario.ts --name=move-reveal
 *        ... --name=combat | site-heal | one-round
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";

import { bundle } from "@emberwold/content";
import { applyAction, createGame, getLegalActions } from "@emberwold/engine";
import type { Action, GameEvent, GameState } from "@emberwold/engine";
import type { Hex } from "@emberwold/shared";

import { outcomeOf, type TraceFile } from "./trace";

type Policy = (state: GameState) => Action | null;

const TRACE_NAMES: Readonly<Record<string, string>> = {
  "move-reveal": "010-move-reveal.json",
  combat: "020-combat.json",
  "site-heal": "030-site-heal.json",
  "one-round": "040-one-round.json",
};

const NEIGHBOR_DELTAS: readonly Hex[] = [
  { q: 1, r: 0 },
  { q: 1, r: -1 },
  { q: 0, r: -1 },
  { q: -1, r: 0 },
  { q: -1, r: 1 },
  { q: 0, r: 1 },
];

function sameHex(a: Hex, b: Hex): boolean {
  return a.q === b.q && a.r === b.r;
}

function legal(state: GameState): readonly Action[] {
  return getLegalActions(state, bundle).actions;
}

function find(state: GameState, predicate: (action: Action) => boolean): Action | null {
  return legal(state).find(predicate) ?? null;
}

function resolvePending(state: GameState): Action | null {
  return find(state, (action) => action.type === "resolveChoice");
}

function cardOf(
  state: GameState,
  action: Action,
):
  | { id: string; effects: { basic: { op: string; options?: readonly { op: string }[] } } }
  | undefined {
  if (action.type !== "playCard" && action.type !== "playCardSideways") {
    return undefined;
  }
  const defId = state.cardInstances[action.card];
  return defId === undefined ? undefined : (bundle.cards[defId] as never);
}

function playBasicWhere(
  state: GameState,
  predicate: (def: {
    effects: { basic: { op: string; options?: readonly { op: string }[] } };
  }) => boolean,
): Action | null {
  return find(state, (action) => {
    if (action.type !== "playCard" || action.mode !== "basic") {
      return false;
    }
    const def = cardOf(state, action);
    return def !== undefined && predicate(def);
  });
}

function playMove(state: GameState): Action | null {
  return playBasicWhere(state, (def) => def.effects.basic.op === "gain_move");
}

function playInfluence(state: GameState): Action | null {
  return playBasicWhere(state, (def) => def.effects.basic.op === "gain_influence");
}

function sideways(state: GameState, as: "move" | "influence"): Action | null {
  return find(state, (action) => action.type === "playCardSideways" && action.as === as);
}

function endTurn(state: GameState): Action | null {
  return find(state, (action) => action.type === "endTurn");
}

function rest(state: GameState): Action | null {
  return find(state, (action) => action.type === "rest");
}

function fallback(state: GameState): Action | null {
  return (
    endTurn(state) ??
    rest(state) ??
    find(state, (action) => action.type === "moveTo") ??
    find(state, (action) => action.type === "playCardSideways") ??
    legal(state)[0] ??
    null
  );
}

function handWounds(state: GameState): number {
  const player = state.players[0];
  return (player?.hand ?? []).filter((card) => state.cardInstances[card] === bundle.woundCard.id)
    .length;
}

function aliveEnemies(state: GameState) {
  return state.map.enemies.filter((enemy) => enemy.alive);
}

function villageHex(state: GameState): Hex | null {
  return state.map.sites.find((site) => site.siteId === "site:village")?.hex ?? null;
}

/** Static map graph from the bundle, for routing (only revealed hexes are walkable later). */
function globalTerrain(): Map<string, { hex: Hex; terrain: string }> {
  const map = new Map<string, { hex: Hex; terrain: string }>();
  for (const placement of bundle.scenario.tiles) {
    const tile = bundle.tiles[placement.tileId];
    if (tile === undefined) {
      continue;
    }
    for (const hex of tile.hexes) {
      const global = { q: placement.origin.q + hex.q, r: placement.origin.r + hex.r };
      map.set(`${global.q},${global.r}`, { hex: global, terrain: hex.terrain });
    }
  }
  return map;
}

const TERRAIN = globalTerrain();

function nextHop(from: Hex, to: Hex): Hex | null {
  if (sameHex(from, to)) {
    return null;
  }
  // BFS over the authored map (cost ignores movement points; the policy gains points).
  const queue: Hex[] = [from];
  const firstStep = new Map<string, Hex>();
  const seen = new Set<string>([`${from.q},${from.r}`]);
  while (queue.length > 0) {
    const current = queue.shift() as Hex;
    for (const delta of NEIGHBOR_DELTAS) {
      const neighbor = { q: current.q + delta.q, r: current.r + delta.r };
      const key = `${neighbor.q},${neighbor.r}`;
      if (seen.has(key) || !TERRAIN.has(key)) {
        continue;
      }
      seen.add(key);
      const step = sameHex(current, from) ? neighbor : firstStep.get(`${current.q},${current.r}`);
      if (step !== undefined) {
        firstStep.set(key, step);
      }
      if (sameHex(neighbor, to)) {
        return sameHex(current, from)
          ? neighbor
          : (firstStep.get(`${current.q},${current.r}`) ?? neighbor);
      }
      queue.push(neighbor);
    }
  }
  return null;
}

function approach(state: GameState, target: Hex): Action | null {
  const player = state.players[0];
  if (player === undefined) {
    return fallback(state);
  }
  const direct = find(
    state,
    (action) => action.type === "moveTo" && sameHex(action.target, target),
  );
  if (direct !== null) {
    return direct;
  }
  const hop = nextHop(player.position, target);
  if (hop !== null) {
    const step = find(state, (action) => action.type === "moveTo" && sameHex(action.target, hop));
    if (step !== null) {
      return step;
    }
  }
  return (
    playMove(state) ?? sideways(state, "move") ?? endTurn(state) ?? rest(state) ?? fallback(state)
  );
}

function combatAction(state: GameState): Action | null {
  const combat = state.combat;
  if (combat === null) {
    return null;
  }
  if (state.pending !== null) {
    return resolvePending(state);
  }
  if (combat.phase === "rangedSiege" || combat.phase === "block") {
    return find(state, (action) => action.type === "endCombatPhase");
  }
  if (combat.phase === "assignDamage") {
    return find(state, (action) => action.type === "assignDamage");
  }
  const kill = find(state, (action) => action.type === "assignAttack");
  if (kill !== null) {
    return kill;
  }
  const attack = find(state, (action) => action.type === "playCard" && action.mode === "basic");
  const sidewaysAttack = find(
    state,
    (action) => action.type === "playCardSideways" && action.as === "attack",
  );
  return attack ?? sidewaysAttack ?? find(state, (action) => action.type === "endCombatPhase");
}

function explore(state: GameState): Action | null {
  return find(state, (action) => action.type === "explore");
}

function moveRevealPolicy(state: GameState): Action | null {
  if (state.pending !== null) {
    return resolvePending(state);
  }
  if (state.combat !== null) {
    return combatAction(state);
  }
  if (state.turn.rested) {
    return endTurn(state);
  }
  if (explore(state) !== null) {
    return explore(state);
  }
  if (state.turn.movePoints >= bundle.rulesConstants.tileRevealCost) {
    const step = find(
      state,
      (action) => action.type === "moveTo" && sameHex(action.target, { q: 1, r: 0 }),
    );
    if (step !== null) {
      return step;
    }
  }
  return playMove(state) ?? approach(state, { q: 1, r: 0 }) ?? endTurn(state) ?? rest(state);
}

function combatFirstPolicy(state: GameState): Action | null {
  if (state.pending !== null) {
    return resolvePending(state);
  }
  if (state.combat !== null) {
    return combatAction(state);
  }
  if (state.turn.rested) {
    return endTurn(state);
  }
  if (state.map.tiles.some((tile) => !tile.revealed)) {
    return moveRevealPolicy(state);
  }
  const enemy = aliveEnemies(state)[0];
  if (enemy === undefined) {
    return null;
  }
  if (sameHex(state.players[0]?.position ?? { q: 0, r: 0 }, enemy.hex)) {
    return find(state, (action) => action.type === "challengeRampaging") ?? fallback(state);
  }
  return approach(state, enemy.hex);
}

function healRunPolicy(state: GameState): Action | null {
  if (state.pending !== null) {
    return resolvePending(state);
  }
  if (state.combat !== null) {
    return combatAction(state);
  }
  if (state.turn.rested) {
    return endTurn(state);
  }
  if (state.map.tiles.some((tile) => !tile.revealed)) {
    return moveRevealPolicy(state);
  }
  const player = state.players[0];
  if (player === undefined) {
    return null;
  }
  const wounds = handWounds(state);
  const enemy = aliveEnemies(state)[0];
  if (wounds === 0 && enemy !== undefined) {
    if (sameHex(player.position, enemy.hex)) {
      return find(state, (action) => action.type === "challengeRampaging") ?? fallback(state);
    }
    return approach(state, enemy.hex);
  }
  const village = villageHex(state);
  if (village === null) {
    return null;
  }
  if (!sameHex(player.position, village)) {
    return approach(state, village);
  }
  const entered = state.turn.flags[`enteredSite:${village.q},${village.r}`] === true;
  if (!entered) {
    return find(state, (action) => action.type === "enterSite") ?? fallback(state);
  }
  if (wounds > 0) {
    const heal = find(state, (action) => action.type === "buyHealing");
    if (heal !== null) {
      return heal;
    }
    const influence = state.turn.influence;
    if (influence < 3) {
      return (
        playInfluence(state) ??
        sideways(state, "influence") ??
        endTurn(state) ??
        rest(state) ??
        fallback(state)
      );
    }
    return endTurn(state) ?? fallback(state);
  }
  return endTurn(state) ?? null;
}

type StopWhen = (eventTypes: readonly string[]) => boolean;

function healHappened(eventTypes: readonly string[]): boolean {
  const entered = eventTypes.lastIndexOf("siteEntered");
  const spent = eventTypes.lastIndexOf("influenceSpent");
  const healed = eventTypes.lastIndexOf("healGained");
  return entered >= 0 && spent > entered && healed > spent;
}

function run(seed: number, policy: Policy, stopWhen: StopWhen, maxActions = 500) {
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
    if (process.env.DEBUG_SCENARIO === "1") {
      const player = state.players[0];
      console.error(
        `step ${step} seed ${seed} pos ${player?.position.q},${player?.position.r} mv ${state.turn.movePoints} ` +
          `infl ${state.turn.influence} wounds ${handWounds(state)} combat ${state.combat?.phase ?? "-"} action ${action.type}`,
      );
    }
    actions.push(action);
    expectedHashes.push(outcome.result.stateHash);
    seen.push(...outcome.result.events);
    state = outcome.result.state;
    const eventTypes = seen.map((event) => event.type);
    if (stopWhen(eventTypes)) {
      return { seed, state, actions, expectedHashes, seen };
    }
  }
  return null;
}

function findSeed(policy: Policy, stopWhen: StopWhen) {
  for (let seed = 1; seed <= 80; seed += 1) {
    const result = run(seed, policy, stopWhen);
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
  let stopWhen: StopWhen;
  switch (name) {
    case "move-reveal":
      [policy, stopWhen] = [moveRevealPolicy, (types) => types.includes("tileRevealed")];
      break;
    case "combat":
      [policy, stopWhen] = [
        combatFirstPolicy,
        (types) => types.includes("combatEnded") && types.includes("enemyDefeated"),
      ];
      break;
    case "site-heal":
      [policy, stopWhen] = [healRunPolicy, (types) => healHappened(types)];
      break;
    case "one-round":
      [policy, stopWhen] = [
        (state) => healRunPolicy(state) ?? find(state, (action) => action.type === "endTurn"),
        (types) => {
          const healed = types.lastIndexOf("healGained");
          return healHappened(types) && types.lastIndexOf("turnEnded") > healed;
        },
      ];
      break;
    default:
      console.error(`record-scenario: scenario "${name}" not implemented`);
      process.exit(2);
  }
  const result = findSeed(policy, stopWhen);
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
    expectedOutcome: outcomeOf(result.state, bundle.woundCard.id),
  };
  const out = join("tools", "golden-traces", fileName);
  writeFileSync(out, `${JSON.stringify(trace, null, 2)}\n`);
  const eventTypes = [...new Set(result.seen.map((event) => event.type))];
  console.log(
    `scenario recorded: ${out} seed=${trace.seed} actions=${trace.actions.length} ` +
      `events=${eventTypes.join(",")} outcome=${JSON.stringify(trace.expectedOutcome)}`,
  );
}

main();
