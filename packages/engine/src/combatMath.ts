/**
 * Single implementation of the combat arithmetic, per docs/research/02-rules-core.md §7.3/§7.4.
 * No UI or reducer file may duplicate these formulas.
 */
import type { BlockContribution, AttackContribution } from "./types";
import type { Element } from "@emberwold/shared";
import type { EnemyDef } from "@emberwold/shared";

/** Efficiency matrix from 02 §7.3: which block elements are efficient against an attack element. */
export function isEfficientBlock(blockElement: Element, attackElement: Element): boolean {
  if (attackElement === "physical") {
    return true;
  }
  if (attackElement === "fire") {
    return blockElement === "ice" || blockElement === "cold_fire";
  }
  if (attackElement === "ice") {
    return blockElement === "fire" || blockElement === "cold_fire";
  }
  if (attackElement === "cold_fire") {
    return blockElement === "cold_fire";
  }
  return false;
}

/** Efficient blocks count fully; inefficient blocks are summed, halved (floor), then added. */
export function efficientBlockValue(
  blocks: readonly BlockContribution[],
  attackElement: Element,
): number {
  let efficient = 0;
  let inefficient = 0;
  for (const block of blocks) {
    if (isEfficientBlock(block.element, attackElement)) {
      efficient += block.amount;
    } else {
      inefficient += block.amount;
    }
  }
  return efficient + Math.floor(inefficient / 2);
}

/** Swift enemies need twice their attack value in block (02 §7.3 step 5). */
export function requiredBlock(enemy: EnemyDef): number {
  return enemy.abilities.includes("swift") ? enemy.attack * 2 : enemy.attack;
}

export function isBlocked(enemy: EnemyDef, blocks: readonly BlockContribution[]): boolean {
  return efficientBlockValue(blocks, enemy.attackElement) >= requiredBlock(enemy);
}

/** Resistance halves attacks of that element (round down, so resistance always helps the enemy). */
export function attackValueAfterResistance(
  contribution: AttackContribution,
  enemy: EnemyDef,
): number {
  const resistant =
    enemy.resistances.includes(contribution.element) ||
    (contribution.element === "cold_fire" &&
      (enemy.resistances.includes("fire") || enemy.resistances.includes("ice")));
  return resistant ? Math.floor(contribution.amount / 2) : contribution.amount;
}

export function totalAttackAgainst(pool: readonly AttackContribution[], enemy: EnemyDef): number {
  return pool.reduce(
    (total, contribution) => total + attackValueAfterResistance(contribution, enemy),
    0,
  );
}

/** Hero wounds: each wound needs hero armor in damage; leftover below armor does nothing (02 §7.4). */
export function woundsFromDamage(damage: number, heroArmor: number): number {
  if (damage < heroArmor) {
    return 0;
  }
  return Math.floor(damage / heroArmor);
}

/** Brutal enemies deal twice their attack value as damage (02 §7.4 step 2). */
export function enemyDamage(enemy: EnemyDef): number {
  return enemy.abilities.includes("brutal") ? enemy.attack * 2 : enemy.attack;
}

/** Fortified enemies can only be attacked with siege attacks in the ranged/siege phase. */
export function attackAllowedInRangedPhase(
  enemy: EnemyDef,
  combatType: "melee" | "ranged" | "siege",
): boolean {
  if (enemy.abilities.includes("fortified") || enemy.abilities.includes("double_fortified")) {
    return combatType === "siege";
  }
  return combatType !== "melee";
}
