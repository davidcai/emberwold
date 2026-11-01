import { describe, expect, it } from "vitest";

import { PACKAGE_NAME, createEngineRng } from "./index";

describe("@emberwold/engine", () => {
  it("identifies itself", () => {
    expect(PACKAGE_NAME).toBe("@emberwold/engine");
  });

  it("consumes shared RNG primitives", () => {
    const rng = createEngineRng(5);
    expect(rng.seed).toBe(5);
    expect(rng.counters.shuffle).toBe(0);
  });
});
