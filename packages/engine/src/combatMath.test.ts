import { describe, expect, it } from "vitest";

import {
  attackAllowedInRangedPhase,
  attackValueAfterResistance,
  efficientBlockValue,
  enemyDamage,
  isBlocked,
  isEfficientBlock,
  requiredBlock,
  totalAttackAgainst,
  woundsFromDamage,
} from "./combatMath";
import type { EnemyDef } from "@emberwold/shared";

function enemy(overrides: Partial<EnemyDef> = {}): EnemyDef {
  return {
    id: "enemy:test",
    name: "Test",
    color: "green",
    attack: 3,
    attackElement: "physical",
    armor: 3,
    fame: 2,
    resistances: [],
    abilities: [],
    ...overrides,
  };
}

describe("block efficiency (02 §7.3 matrix)", () => {
  it("physical attacks can be blocked by any element", () => {
    expect(isEfficientBlock("physical", "physical")).toBe(true);
    expect(isEfficientBlock("fire", "physical")).toBe(true);
    expect(isEfficientBlock("ice", "physical")).toBe(true);
  });

  it("fire attacks are efficiently blocked by ice and cold fire only", () => {
    expect(isEfficientBlock("ice", "fire")).toBe(true);
    expect(isEfficientBlock("cold_fire", "fire")).toBe(true);
    expect(isEfficientBlock("physical", "fire")).toBe(false);
    expect(isEfficientBlock("fire", "fire")).toBe(false);
  });

  it("ice attacks are efficiently blocked by fire and cold fire only", () => {
    expect(isEfficientBlock("fire", "ice")).toBe(true);
    expect(isEfficientBlock("cold_fire", "ice")).toBe(true);
    expect(isEfficientBlock("physical", "ice")).toBe(false);
    expect(isEfficientBlock("ice", "ice")).toBe(false);
  });

  it("cold fire attacks are only efficiently blocked by cold fire", () => {
    expect(isEfficientBlock("cold_fire", "cold_fire")).toBe(true);
    expect(isEfficientBlock("fire", "cold_fire")).toBe(false);
    expect(isEfficientBlock("ice", "cold_fire")).toBe(false);
  });

  it("inefficient block is halved (floor) and added to efficient block", () => {
    expect(efficientBlockValue([{ amount: 4, element: "ice" }], "fire")).toBe(4);
    expect(efficientBlockValue([{ amount: 5, element: "physical" }], "fire")).toBe(2);
    expect(
      efficientBlockValue(
        [
          { amount: 4, element: "ice" },
          { amount: 5, element: "physical" },
        ],
        "fire",
      ),
    ).toBe(6);
  });
});

describe("swift and fortify", () => {
  it("swift enemies require double block", () => {
    expect(requiredBlock(enemy({ attack: 3 }))).toBe(3);
    expect(requiredBlock(enemy({ attack: 3, abilities: ["swift"] }))).toBe(6);
  });

  it("a failed block has no partial effect", () => {
    expect(
      isBlocked(enemy({ attack: 4, attackElement: "fire" }), [{ amount: 5, element: "physical" }]),
    ).toBe(false);
    expect(
      isBlocked(enemy({ attack: 4, attackElement: "fire" }), [{ amount: 8, element: "physical" }]),
    ).toBe(true);
  });

  it("fortified enemies can only be attacked with siege in the ranged phase", () => {
    const fortified = enemy({ abilities: ["fortified"] });
    expect(attackAllowedInRangedPhase(fortified, "siege")).toBe(true);
    expect(attackAllowedInRangedPhase(fortified, "ranged")).toBe(false);
    expect(attackAllowedInRangedPhase(fortified, "melee")).toBe(false);
    const open = enemy();
    expect(attackAllowedInRangedPhase(open, "ranged")).toBe(true);
    expect(attackAllowedInRangedPhase(open, "melee")).toBe(false);
  });
});

describe("resistance and damage", () => {
  it("resistance halves the matching attack element (floor)", () => {
    const resistant = enemy({ resistances: ["physical"] });
    expect(
      attackValueAfterResistance(
        { amount: 6, element: "physical", combatType: "melee" },
        resistant,
      ),
    ).toBe(3);
    expect(
      attackValueAfterResistance({ amount: 5, element: "fire", combatType: "ranged" }, resistant),
    ).toBe(5);
    const fireResistant = enemy({ resistances: ["fire"] });
    expect(
      attackValueAfterResistance(
        { amount: 5, element: "cold_fire", combatType: "melee" },
        fireResistant,
      ),
    ).toBe(2);
  });

  it("sums a mixed attack pool against resistances", () => {
    const resistant = enemy({ resistances: ["physical"] });
    const pool = [
      { amount: 2, element: "fire" as const, combatType: "melee" as const },
      { amount: 4, element: "physical" as const, combatType: "melee" as const },
    ];
    expect(totalAttackAgainst(pool, resistant)).toBe(4);
  });

  it("hero wounds need armor-sized damage and leftover below armor does nothing", () => {
    expect(woundsFromDamage(1, 2)).toBe(0);
    expect(woundsFromDamage(2, 2)).toBe(1);
    expect(woundsFromDamage(3, 2)).toBe(1);
    expect(woundsFromDamage(5, 2)).toBe(2);
  });

  it("brutal enemies deal double damage", () => {
    expect(enemyDamage(enemy({ attack: 3 }))).toBe(3);
    expect(enemyDamage(enemy({ attack: 3, abilities: ["brutal"] }))).toBe(6);
  });
});
