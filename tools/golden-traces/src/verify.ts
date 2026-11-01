/** `pnpm trace:verify <file>` — replays a trace and compares every state hash. */
import { readFileSync } from "node:fs";

import { bundle } from "@emberwold/content";
import { applyAction, createGame, hashState } from "@emberwold/engine";

import { outcomeOf, type TraceFile } from "./trace";

const path = process.argv[2];
if (path === undefined) {
  console.error("usage: pnpm trace:verify <trace.json>");
  process.exit(2);
}

const trace = JSON.parse(readFileSync(path, "utf8")) as TraceFile;
if (trace.traceVersion !== 1) {
  console.error(`trace: unsupported traceVersion ${String(trace.traceVersion)}`);
  process.exit(1);
}
if (trace.contentHash !== bundle.contentHash) {
  console.error(
    `trace: content hash mismatch (trace ${trace.contentHash}, build ${bundle.contentHash})`,
  );
  process.exit(1);
}

let state = createGame(trace.config, bundle).state;
if (hashState(state) !== hashState(createGame({ seed: trace.seed }, bundle).state)) {
  console.error("trace: initial state hash mismatch");
  process.exit(1);
}

for (let step = 0; step < trace.actions.length; step += 1) {
  const action = trace.actions[step];
  if (action === undefined) {
    break;
  }
  if (action.epoch !== state.actionEpoch) {
    console.error(
      `trace: stale epoch at action ${step} (expected ${state.actionEpoch}, got ${action.epoch})`,
    );
    process.exit(1);
  }
  const outcome = applyAction(state, action, bundle);
  if (!outcome.ok) {
    console.error(`trace: action ${step} rejected: ${outcome.error.code}`);
    process.exit(1);
  }
  const expected = trace.expectedHashes[step];
  if (expected !== outcome.result.stateHash) {
    console.error(
      `trace: hash mismatch at action ${step}\n  expected ${expected ?? "<missing>"}\n  actual   ${outcome.result.stateHash}`,
    );
    process.exit(1);
  }
  state = outcome.result.state;
}

const actual = outcomeOf(state);
const expected = trace.expectedOutcome;
const fields: readonly (keyof typeof expected)[] = ["round", "gameOver", "fame", "handSize"];
for (const field of fields) {
  if (actual[field] !== expected[field]) {
    console.error(
      `trace: outcome mismatch for ${field} (expected ${String(expected[field])}, got ${String(actual[field])})`,
    );
    process.exit(1);
  }
}

console.log(
  `trace verified: ${path} actions=${trace.actions.length} contentHash=${trace.contentHash.slice(0, 16)}… ` +
    `round=${actual.round} gameOver=${actual.gameOver} fame=${actual.fame}`,
);
