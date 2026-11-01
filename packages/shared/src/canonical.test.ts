import { describe, expect, it } from "vitest";

import { canonicalJson, hashState } from "./canonical";

describe("canonicalJson", () => {
  it("sorts object keys and strips whitespace", () => {
    expect(canonicalJson({ b: 1, a: [2, 3] })).toBe('{"a":[2,3],"b":1}');
  });

  it("preserves array order", () => {
    expect(canonicalJson([1, 2])).not.toBe(canonicalJson([2, 1]));
  });

  it("rejects values the engine must not produce", () => {
    expect(() => canonicalJson(1.5)).toThrow(/integer/);
    expect(() => canonicalJson(Number.NaN)).toThrow(/integer/);
    expect(() => canonicalJson(Number.POSITIVE_INFINITY)).toThrow(/integer/);
    expect(() => canonicalJson(undefined)).toThrow(/unsupported/);
    expect(() => canonicalJson({ a: undefined })).toThrow(/unsupported/);
  });
});

describe("hashState", () => {
  it("is order-independent for object keys", () => {
    const first = { wheel: { q: 1, r: 0 }, round: 2, fame: 3 };
    const second = { fame: 3, round: 2, wheel: { r: 0, q: 1 } };
    expect(hashState(first)).toBe(hashState(second));
  });

  it("changes when any value changes", () => {
    expect(hashState({ fame: 3 })).not.toBe(hashState({ fame: 4 }));
  });

  it("returns a 64-char hex digest", () => {
    expect(hashState({ a: 1 })).toMatch(/^[0-9a-f]{64}$/);
  });
});
