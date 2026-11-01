/**
 * Seeded RNG: Mulberry32 with one explicit counter per stream.
 *
 * Stream separation matters more than the algorithm: adding a draw in one stream must not
 * perturb any other stream's sequence (that would break every golden trace). Each stream has
 * its own salt and counter, and `nextU32` is pure: it returns a fresh state.
 */
export type RngStream =
  "shuffle" | "sourceDice" | "enemyDraw" | "tileDraw" | "effectRandom" | "scenario";

export interface RngState {
  /** u32 seed. Display/audit only; the streams derive from it. */
  readonly seed: number;
  readonly counters: Readonly<Record<RngStream, number>>;
}

/** `shuffle` keeps salt 0 so its sequence matches the reference Mulberry32 vectors. */
const STREAM_SALT: Readonly<Record<RngStream, number>> = {
  shuffle: 0x00000000,
  sourceDice: 0x9e3779b9,
  enemyDraw: 0x85ebca6b,
  tileDraw: 0xc2b2ae35,
  effectRandom: 0x27d4eb2f,
  scenario: 0x165667b1,
};

export const RNG_STREAMS: readonly RngStream[] = [
  "shuffle",
  "sourceDice",
  "enemyDraw",
  "tileDraw",
  "effectRandom",
  "scenario",
];

export function createRng(seed: number): RngState {
  return {
    seed: seed >>> 0,
    counters: {
      shuffle: 0,
      sourceDice: 0,
      enemyDraw: 0,
      tileDraw: 0,
      effectRandom: 0,
      scenario: 0,
    },
  };
}

/** Draw one u32 from `stream`; returns the new state, leaving `rng` untouched. */
export function nextU32(
  rng: RngState,
  stream: RngStream,
): readonly [value: number, next: RngState] {
  const counter = rng.counters[stream];
  const base = (rng.seed ^ STREAM_SALT[stream]) >>> 0;
  // Mulberry32's internal state advances by a fixed constant per draw, so the state for draw
  // `counter + 1` is computable directly instead of replaying every earlier draw.
  const state = (base + Math.imul(counter + 1, 0x6d2b79f5)) >>> 0;
  const value = scramble(state);
  const next: RngState = {
    seed: rng.seed,
    counters: { ...rng.counters, [stream]: counter + 1 },
  };
  return [value, next] as const;
}

function scramble(state: number): number {
  let t = state | 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return (t ^ (t >>> 14)) >>> 0;
}
