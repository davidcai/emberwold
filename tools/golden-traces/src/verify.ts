/**
 * `pnpm trace:verify <file>...` — replays traces and compares every state hash.
 * With no arguments it verifies every `*.json` trace next to this tool (CI mode).
 */
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { bundle } from "@emberwold/content";
import { applyAction, createGame, hashState } from "@emberwold/engine";

import { outcomeOf, type TraceFile } from "./trace";

const TRACE_DIR = join(dirname(fileURLToPath(import.meta.url)), "..");

function verifyFile(path: string, label: string): boolean {
  const trace = JSON.parse(readFileSync(path, "utf8")) as TraceFile;
  const fail = (message: string): boolean => {
    console.error(`trace: ${label}: ${message}`);
    return false;
  };

  if (trace.traceVersion !== 1) {
    return fail(`unsupported traceVersion ${String(trace.traceVersion)}`);
  }
  if (trace.contentHash !== bundle.contentHash) {
    return fail(`content hash mismatch (trace ${trace.contentHash}, build ${bundle.contentHash})`);
  }

  let state = createGame(trace.config, bundle).state;
  if (hashState(state) !== hashState(createGame({ seed: trace.seed }, bundle).state)) {
    return fail("initial state hash mismatch");
  }

  for (let step = 0; step < trace.actions.length; step += 1) {
    const action = trace.actions[step];
    if (action === undefined) {
      break;
    }
    if (action.epoch !== state.actionEpoch) {
      return fail(
        `stale epoch at action ${step} (expected ${state.actionEpoch}, got ${action.epoch})`,
      );
    }
    const outcome = applyAction(state, action, bundle);
    if (!outcome.ok) {
      return fail(`action ${step} rejected: ${outcome.error.code}`);
    }
    const expected = trace.expectedHashes[step];
    if (expected !== outcome.result.stateHash) {
      return fail(
        `hash mismatch at action ${step}\n  expected ${expected ?? "<missing>"}\n  actual   ${outcome.result.stateHash}`,
      );
    }
    state = outcome.result.state;
  }

  const actual = outcomeOf(state, bundle.woundCard.id);
  const expectedOutcome = trace.expectedOutcome;
  const fields: readonly (keyof typeof expectedOutcome)[] = [
    "round",
    "gameOver",
    "fame",
    "handSize",
    "wounds",
    "defeatedEnemies",
  ];
  for (const field of fields) {
    if (actual[field] !== expectedOutcome[field]) {
      return fail(
        `outcome mismatch for ${field} (expected ${String(expectedOutcome[field])}, got ${String(actual[field])})`,
      );
    }
  }

  if (trace.expectedResult !== undefined) {
    const result = state.result;
    if (result === null) {
      return fail("expected a final GameResult but the game is still running");
    }
    const resultFields = ["outcome", "score", "cityConquered", "reason"] as const;
    for (const field of resultFields) {
      if (result[field] !== trace.expectedResult[field]) {
        return fail(
          `result mismatch for ${field} (expected ${String(trace.expectedResult[field])}, got ${String(result[field])})`,
        );
      }
    }
  }

  console.log(
    `trace verified: ${label} actions=${trace.actions.length} contentHash=${trace.contentHash.slice(0, 16)}… ` +
      `round=${actual.round} gameOver=${actual.gameOver} fame=${actual.fame}` +
      (trace.expectedResult === undefined ? "" : ` result=${trace.expectedResult.outcome}`),
  );
  return true;
}

const requested = process.argv.slice(2);
const paths =
  requested.length > 0
    ? requested.map((path) => ({ path, label: path }))
    : readdirSync(TRACE_DIR)
        .filter((entry) => /^\d{3}-.*\.json$/.test(entry))
        .sort()
        .map((entry) => ({ path: join(TRACE_DIR, entry), label: entry }));

if (paths.length === 0) {
  console.error("trace: no trace files found");
  process.exit(2);
}

let ok = true;
for (const { path, label } of paths) {
  ok = verifyFile(path, label) && ok;
}
process.exit(ok ? 0 : 1);
