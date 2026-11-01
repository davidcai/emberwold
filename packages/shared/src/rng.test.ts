import { describe, expect, it } from "vitest";

import { createRng, nextU32, type RngState } from "./rng";

/** Golden vectors from plan Appendix A, independently derived with a Python implementation. */
const VECTORS: ReadonlyArray<readonly [seed: number, expected: readonly number[]]> = [
  [0, [1144304738, 1416247, 958946056, 627933444, 2007157716]],
  [1, [2693262067, 11749833, 2265367787, 4213581821, 4159151403]],
  [12345, [4207900869, 1317490944, 2079646450, 3513001552, 2187978186]],
];

function drawShuffle(rng: RngState, count: number): readonly number[] {
  const values: number[] = [];
  let state = rng;
  for (let i = 0; i < count; i += 1) {
    const [value, next] = nextU32(state, "shuffle");
    values.push(value);
    state = next;
  }
  return values;
}

describe("Mulberry32 streams", () => {
  it.each(VECTORS)("matches the reference vectors for seed %i", (seed, expected) => {
    expect(drawShuffle(createRng(seed), expected.length)).toEqual(expected);
  });

  it("is deterministic for the same seed", () => {
    expect(drawShuffle(createRng(42), 20)).toEqual(drawShuffle(createRng(42), 20));
  });

  it("does not let one stream perturb another", () => {
    let state = createRng(7);
    for (let i = 0; i < 3; i += 1) {
      state = nextU32(state, "shuffle")[1];
    }

    const [mixedValue] = nextU32(state, "sourceDice");
    const [freshValue] = nextU32(createRng(7), "sourceDice");

    expect(mixedValue).toBe(freshValue);
  });

  it("returns a new state and leaves the input untouched", () => {
    const original = createRng(3);
    const [, next] = nextU32(original, "sourceDice");

    expect(original.counters.sourceDice).toBe(0);
    expect(next.counters.sourceDice).toBe(1);
    expect(next.seed).toBe(original.seed);
    expect(next).not.toBe(original);
  });

  it("keeps the next state JSON-serializable", () => {
    const [, next] = nextU32(createRng(9), "scenario");
    expect(JSON.parse(JSON.stringify(next))).toEqual(next);
  });
});
