import { describe, expect, it } from "vitest";

import { asCardId, asPlayerId, hexKey } from "./index";
import { createRng, nextU32, RNG_STREAMS } from "./rng";

describe("ids", () => {
  it("keys hexes by axial coordinate", () => {
    expect(hexKey({ q: 1, r: -2 })).toBe("1,-2");
  });

  it("casts without changing the value", () => {
    expect(asPlayerId("p1")).toBe("p1");
    expect(asCardId("card:vow:trek")).toBe("card:vow:trek");
  });
});

describe("shared surface", () => {
  it("exposes all RNG streams", () => {
    expect(RNG_STREAMS).toHaveLength(6);
    const rng = createRng(0);
    for (const stream of RNG_STREAMS) {
      const [value, next] = nextU32(rng, stream);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(2 ** 32);
      expect(next.counters[stream]).toBe(1);
    }
  });
});
