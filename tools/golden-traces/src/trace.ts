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
  /** Wound cards in hand at the end (the spike has no other wound zones). */
  readonly wounds: number;
  /** Enemies removed from the map (defeated) at the end. */
  readonly defeatedEnemies: number;
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
  /** Present on scenario-completion traces: the final GameResult when the run ended. */
  readonly expectedResult?: TraceResult;
}

export interface TraceResult {
  readonly outcome: "victory" | "defeat";
  readonly score: number;
  readonly cityConquered: boolean;
  readonly reason: string;
}

export function outcomeOf(
  state: {
    round: number;
    gameOver: boolean;
    players: readonly { fame: number; hand: readonly unknown[]; discard?: readonly unknown[] }[];
    cardInstances: Readonly<Record<string, string>>;
    map: { enemies: readonly { alive: boolean }[] };
  },
  woundCardId: string,
): TraceOutcome {
  const player = state.players[0];
  const wounds = (player?.hand ?? []).filter(
    (card) => state.cardInstances[String(card)] === woundCardId,
  ).length;
  return {
    round: state.round,
    gameOver: state.gameOver,
    fame: player?.fame ?? 0,
    handSize: player?.hand.length ?? 0,
    wounds,
    defeatedEnemies: state.map.enemies.filter((enemy) => !enemy.alive).length,
  };
}
