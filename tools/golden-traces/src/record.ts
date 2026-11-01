/** `pnpm trace:record --seed=1 --out=tools/golden-traces/000-smoke.json` */
import { writeFileSync } from "node:fs";
import { join } from "node:path";

import { bundle } from "@emberwold/content";
import { applyAction, createGame, getLegalActions } from "@emberwold/engine";
import type { Action } from "@emberwold/engine";

import { outcomeOf, type TraceFile } from "./trace";

function argValue(name: string, fallback: string): string {
  const prefix = `--${name}=`;
  const found = process.argv.find((argument) => argument.startsWith(prefix));
  return found === undefined ? fallback : found.slice(prefix.length);
}

const seed = Number(argValue("seed", "1"));
const maxActions = Number(argValue("max-actions", "400"));
const out = argValue("out", join("tools", "golden-traces", "000-smoke.json"));

let state = createGame({ seed }, bundle).state;
const actions: Action[] = [];
const expectedHashes: string[] = [];

for (let step = 0; step < maxActions && !state.gameOver; step += 1) {
  const legal = getLegalActions(state, bundle).actions;
  if (legal.length === 0) {
    break;
  }
  const action = legal[step % legal.length] as Action;
  const outcome = applyAction(state, action, bundle);
  if (!outcome.ok) {
    throw new Error(`record: action ${step} failed: ${outcome.error.code}`);
  }
  actions.push(action);
  expectedHashes.push(outcome.result.stateHash);
  state = outcome.result.state;
}

const trace: TraceFile = {
  traceVersion: 1,
  contentHash: bundle.contentHash,
  engineVersion: state.engineVersion,
  rulesetId: state.rulesetId,
  seed,
  config: { seed },
  actions,
  expectedHashes,
  expectedOutcome: outcomeOf(state),
};
writeFileSync(out, `${JSON.stringify(trace, null, 2)}\n`);
console.log(
  `trace recorded: ${out} actions=${actions.length} gameOver=${state.gameOver} round=${state.round}`,
);
