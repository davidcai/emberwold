import { describe, expect, it } from "vitest";

import { bundle, contentHash } from "./index";

describe("@emberwold/content", () => {
  it("ships the generated spike bundle", () => {
    expect(contentHash).toMatch(/^[0-9a-f]{64}$/);
    expect(Object.keys(bundle.heroes)).toHaveLength(1);
    expect(bundle.heroes["hero:goldyx"]?.startingDeck).toHaveLength(16);
    expect(Object.keys(bundle.cards)).toHaveLength(13);
    expect(Object.keys(bundle.tiles)).toHaveLength(2);
    expect(Object.keys(bundle.enemies)).toHaveLength(3);
    expect(Object.keys(bundle.sites)).toHaveLength(2);
    expect(bundle.scenario.roundCap).toBe(10);
    expect(bundle.rulesConstants.tileRevealCost).toBe(2);
  });
});
