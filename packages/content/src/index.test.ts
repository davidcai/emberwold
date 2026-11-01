import { describe, expect, it } from "vitest";

import { bundle, contentHash } from "./index";

describe("@emberwold/content", () => {
  it("ships the generated First Conquest bundle", () => {
    expect(contentHash).toMatch(/^[0-9a-f]{64}$/);
    expect(Object.keys(bundle.heroes)).toHaveLength(1);
    expect(bundle.heroes["hero:goldyx"]?.startingDeck).toHaveLength(16);
    expect(Object.keys(bundle.cards)).toHaveLength(13);
    expect(Object.keys(bundle.tiles)).toHaveLength(4);
    expect(Object.keys(bundle.enemies)).toHaveLength(12);
    expect(Object.keys(bundle.sites)).toHaveLength(8);
    expect(bundle.scenario.id).toBe("scenario:first-conquest");
    expect(bundle.scenario.timeOfDayPattern).toEqual(["day", "night", "day"]);
    expect(bundle.scenario.city?.level).toBe(4);
    expect(bundle.scenario.city?.garrison).toHaveLength(2);
    expect(bundle.scenario.tacticIds).toHaveLength(12);
    expect(bundle.scenario.tacticRules?.usedTacticsRemovedEachRound).toBe(true);
    expect(bundle.scenario.dummy).toEqual({
      deckSize: 16,
      cardsPerTurn: 3,
      crystals: ["green", "green", "blue"],
    });
    expect(Object.keys(bundle.tactics ?? {})).toHaveLength(12);
    expect(bundle.rulesConstants.tileRevealCost).toBe(2);
  });
});
