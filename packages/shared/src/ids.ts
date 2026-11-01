/**
 * Nominal (branded) string IDs: cheap to serialize, impossible to mix up at compile time.
 * Definitions and instances are separate types (a CardId is not a CardInstanceId).
 */
export type Brand<T, B extends string> = T & { readonly __brand: B };

export type PlayerId = Brand<string, "PlayerId">;
export type CardId = Brand<string, "CardId">;
export type CardInstanceId = Brand<string, "CardInstanceId">;
export type EnemyDefId = Brand<string, "EnemyDefId">;
export type EnemyInstanceId = Brand<string, "EnemyInstanceId">;
export type TileId = Brand<string, "TileId">;
export type SiteDefId = Brand<string, "SiteDefId">;
export type UnitDefId = Brand<string, "UnitDefId">;
export type UnitInstanceId = Brand<string, "UnitInstanceId">;
export type SkillDefId = Brand<string, "SkillDefId">;

export const asPlayerId = (value: string): PlayerId => value as PlayerId;
export const asCardId = (value: string): CardId => value as CardId;
export const asCardInstanceId = (value: string): CardInstanceId => value as CardInstanceId;
export const asEnemyDefId = (value: string): EnemyDefId => value as EnemyDefId;
export const asEnemyInstanceId = (value: string): EnemyInstanceId => value as EnemyInstanceId;
export const asTileId = (value: string): TileId => value as TileId;
export const asSiteDefId = (value: string): SiteDefId => value as SiteDefId;
export const asUnitDefId = (value: string): UnitDefId => value as UnitDefId;
export const asUnitInstanceId = (value: string): UnitInstanceId => value as UnitInstanceId;
export const asSkillDefId = (value: string): SkillDefId => value as SkillDefId;

/** Axial hex coordinate; all game geometry is integer-only. */
export interface Hex {
  readonly q: number;
  readonly r: number;
}

export function hexKey(hex: Hex): string {
  return `${hex.q},${hex.r}`;
}
