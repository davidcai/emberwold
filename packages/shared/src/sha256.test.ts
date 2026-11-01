import { describe, expect, it } from "vitest";

import { sha256Hex } from "./sha256";

const VECTORS: ReadonlyArray<readonly [input: string, expected: string]> = [
  ["", "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"],
  ["abc", "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"],
  [
    "abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq",
    "248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1",
  ],
  // Cross-checked with Python hashlib and Node crypto during planning (plan Appendix A).
  ["emberwold", "ee5f116d1dd573dec04e652341751763fc68a8cacd6bc38aee603f0f6a44a9bc"],
];

describe("sha256Hex", () => {
  it.each(VECTORS)("hashes %j", (input, expected) => {
    expect(sha256Hex(input)).toBe(expected);
  });

  it("handles multi-block input deterministically", () => {
    const long = "a".repeat(1000 + 7);
    expect(sha256Hex(long)).toBe(sha256Hex(long));
    expect(sha256Hex(long)).toHaveLength(64);
  });

  it("produces different hashes for different input", () => {
    expect(sha256Hex("a")).not.toBe(sha256Hex("b"));
  });
});
