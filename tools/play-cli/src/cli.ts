/**
 * `pnpm play [--seed=1] [--random]`
 * Interactive text mode by default; `--random` plays a deterministic random-legal run and
 * writes a replayable trace to the OS temp directory.
 */
import { writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { stdin, stdout } from "node:process";
import { createInterface } from "node:readline/promises";

import { bundle } from "@emberwold/content";
import { applyAction, createGame, getLegalActions } from "@emberwold/engine";
import type { Action, GameState } from "@emberwold/engine";
import { outcomeOf, type TraceFile } from "@emberwold/golden-traces";

import { describeAction, pickAction } from "./bot";

function argValue(name: string, fallback: string): string {
  const prefix = `--${name}=`;
  const found = process.argv.find((argument) => argument.startsWith(prefix));
  return found === undefined ? fallback : found.slice(prefix.length);
}

const seed = Number(argValue("seed", "1"));
const random = process.argv.includes("--random");

function summary(state: GameState): string {
  const player = state.players[0];
  return (
    `round ${state.round} | move ${player?.position.q},${player?.position.r} | ` +
    `hand ${player?.hand.length} deck ${player?.deck.length} | move pts ${state.turn.movePoints} | ` +
    `influence ${state.turn.influence} | fame ${player?.fame}`
  );
}

async function interactive(): Promise<void> {
  let state = createGame({ seed }, bundle).state;
  const rl = createInterface({ input: stdin, output: stdout });
  while (!state.gameOver) {
    const legal = getLegalActions(state, bundle).actions;
    console.log(`\n${summary(state)}`);
    legal.forEach((action, index) => console.log(`  [${index}] ${describeAction(action)}`));
    const answer = (await rl.question("action (number, q to quit)> ")).trim();
    if (answer === "q") {
      break;
    }
    const index = Number(answer);
    const action = legal[index] as Action | undefined;
    if (action === undefined) {
      console.log("not a legal action number");
      continue;
    }
    const outcome = applyAction(state, action, bundle);
    if (!outcome.ok) {
      console.log(`rejected: ${outcome.error.code}`);
      continue;
    }
    state = outcome.result.state;
    console.log(`events: ${outcome.result.events.map((event) => event.type).join(", ")}`);
  }
  rl.close();
  console.log(`\ngame over: ${summary(state)}`);
}

function randomRun(): void {
  let state = createGame({ seed }, bundle).state;
  const actions: Action[] = [];
  const expectedHashes: string[] = [];
  for (let step = 0; step < 2000 && !state.gameOver; step += 1) {
    const action = pickAction(state, bundle, step);
    const outcome = applyAction(state, action, bundle);
    if (!outcome.ok) {
      throw new Error(`play: action ${step} rejected (${outcome.error.code})`);
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
    expectedOutcome: outcomeOf(state, bundle.woundCard.id),
  };
  const path = join(tmpdir(), `emberwold-play-${seed}.json`);
  writeFileSync(path, `${JSON.stringify(trace, null, 2)}\n`);
  console.log(
    `play(random): seed=${seed} actions=${actions.length} gameOver=${state.gameOver} ` +
      `round=${state.round} fame=${state.players[0]?.fame ?? 0}`,
  );
  console.log(`wrote trace: ${path}`);
}

if (random) {
  randomRun();
} else {
  await interactive();
}
