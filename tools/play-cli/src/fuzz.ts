/**
 * `pnpm fuzz [--turns=1000] [--seed=1]`
 * Random-legal play across restarted games; asserts invariants and termination.
 */
import { bundle } from "@emberwold/content";
import { applyAction, checkInvariants, createGame, getLegalActions } from "@emberwold/engine";
import type { Action } from "@emberwold/engine";

function argValue(name: string, fallback: string): string {
  const prefix = `--${name}=`;
  const found = process.argv.find((argument) => argument.startsWith(prefix));
  return found === undefined ? fallback : found.slice(prefix.length);
}

const turnBudget = Number(argValue("turns", "1000"));
const baseSeed = Number(argValue("seed", "1"));
const maxActionsPerGame = 600;

let state = createGame({ seed: baseSeed }, bundle).state;
let games = 0;
let actionsTaken = 0;
let invariantFailures = 0;
let terminationViolations = 0;
let cursor = 0;

function check(): boolean {
  const problems = checkInvariants(state, bundle);
  if (problems.length > 0) {
    console.error(`invariant failure: ${problems[0]}`);
    invariantFailures += 1;
    return false;
  }
  return true;
}

while (actionsTaken < turnBudget) {
  if (state.gameOver) {
    if (actionsTaken < turnBudget) {
      games += 1;
      state = createGame({ seed: baseSeed + games }, bundle).state;
      cursor = 0;
      continue;
    }
    break;
  }
  const legal = getLegalActions(state, bundle).actions;
  if (legal.length === 0) {
    terminationViolations += 1;
    console.error("termination: no legal actions and game is not over");
    break;
  }
  const action = legal[(Math.imul(cursor + 1, 2654435761) >>> 0) % legal.length] as
    Action | undefined;
  cursor += 1;
  if (action === undefined) {
    terminationViolations += 1;
    break;
  }
  const outcome = applyAction(state, action, bundle);
  if (!outcome.ok) {
    console.error(`fuzz: action rejected: ${outcome.error.code}`);
    invariantFailures += 1;
    break;
  }
  actionsTaken += 1;
  state = outcome.result.state;
  if (!check()) {
    break;
  }
  if (cursor > maxActionsPerGame && !state.gameOver) {
    terminationViolations += 1;
    console.error(`termination: game did not end within ${maxActionsPerGame} actions`);
    break;
  }
}

console.log(
  `fuzz: seed=${baseSeed} games=${games + 1} actions=${actionsTaken} ` +
    `invariantFailures=${invariantFailures} terminationViolations=${terminationViolations}`,
);
process.exitCode = invariantFailures + terminationViolations > 0 ? 1 : 0;
