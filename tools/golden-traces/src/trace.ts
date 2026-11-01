/**
 * Trace file format shared by the recorder, verifier, play-cli and fuzz harness.
 * A trace is the canonical replay record: content hash + engine version + seed + actions +
 * the state hash expected after each action + the expected final outcome.
 */
import type { Action } from "@emberwold/engine";

export interface TraceOutcome {
  readonly round: number;
  readonly gameOver: boolean;
  readonly fame: number;
  readonly handSize: number;
}

export interface TraceFile {
  readonly traceVersion: 1;
  readonly contentHash: string;
  readonly engineVersion: string;
  readonly rulesetId: string;
  readonly seed: number;
  readonly config: { readonly seed: number };
  readonly actions: readonly Action[];
  readonly expectedHashes: readonly string[];
  readonly expectedOutcome: TraceOutcome;
}

export function outcomeOf(state: {
  round: number;
  gameOver: boolean;
  players: readonly { fame: number; hand: readonly unknown[] }[];
}): TraceOutcome {
  return {
    round: state.round,
    gameOver: state.gameOver,
    fame: state.players[0]?.fame ?? 0,
    handSize: state.players[0]?.hand.length ?? 0,
  };
}
