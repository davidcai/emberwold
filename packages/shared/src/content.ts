/**
 * Content-bundle contract shared by the compiler, the engine and the client.
 * This is the spike subset of `game-data/` (see docs/design/19-t0-spike-plan.md Appendix B).
 * Display strings stay placeholders for T0 (re-theme is a release gate, 15-retheme-bible §10).
 */
export type Element = "physical" | "fire" | "ice" | "cold_fire" | "light";
export type BasicManaColor = "red" | "blue" | "green" | "white";
export type ManaColor = BasicManaColor | "gold" | "black";
export type CombatType = "melee" | "ranged" | "siege";
export type Terrain =
  "plains" | "hills" | "forest" | "wasteland" | "desert" | "swamp" | "lake" | "mountain" | "city";

export type EffectOp =
  | { readonly op: "choice"; readonly options: readonly EffectOp[] }
  | { readonly op: "compound"; readonly effects: readonly EffectOp[] }
  | { readonly op: "gain_move"; readonly amount: number }
  | { readonly op: "gain_influence"; readonly amount: number }
  | {
      readonly op: "gain_attack";
      readonly amount: number;
      readonly combat_type: CombatType;
      readonly element: Element;
    }
  | { readonly op: "gain_block"; readonly amount: number; readonly element: Element }
  | { readonly op: "gain_healing"; readonly amount: number }
  | { readonly op: "draw_cards"; readonly count: number }
  | { readonly op: "gain_mana"; readonly color: ManaColor; readonly amount: number }
  | { readonly op: "gain_crystal"; readonly color: BasicManaColor; readonly amount?: number }
  | { readonly op: "convert_mana_to_crystal" }
  | {
      readonly op: "mana_draw_powered";
      readonly dice_count: number;
      readonly tokens_per_die: number;
    }
  | {
      readonly op: "apply_modifier";
      readonly effect: { readonly op: "rule_override"; readonly rule: string };
      readonly duration: "turn" | "combat";
      readonly scope?: string;
    }
  | { readonly op: "rule_override"; readonly rule: string }
  | { readonly op: "card_boost"; readonly bonus: number }
  | {
      readonly op: "discard_cost";
      readonly count: number;
      readonly filter_wounds: boolean;
      readonly wounds_only: boolean;
      readonly then_effect: EffectOp;
    }
  | { readonly op: "change_reputation"; readonly amount: number }
  | { readonly op: "special"; readonly id: string };

export interface CardDef {
  readonly id: string;
  readonly name: string;
  readonly color: ManaColor;
  readonly poweredBy: ManaColor | "any_basic" | null;
  readonly sidewaysValue: number;
  readonly effects: {
    readonly basic: EffectOp;
    readonly powered: EffectOp | null;
  };
}

export interface HeroDef {
  readonly id: string;
  readonly name: string;
  readonly startingCrystals: readonly BasicManaColor[];
  readonly startingDeck: readonly string[];
}

export interface TileHexDef {
  readonly q: number;
  readonly r: number;
  readonly terrain: Terrain;
  readonly site: string | null;
  readonly mine_color: BasicManaColor | null;
  readonly rampaging: readonly string[];
}

export interface TileDef {
  readonly id: string;
  readonly name: string;
  readonly hexes: readonly TileHexDef[];
}

export interface EnemyDef {
  readonly id: string;
  readonly name: string;
  readonly color: string;
  readonly attack: number;
  readonly attackElement: Element;
  readonly armor: number;
  readonly fame: number;
  readonly resistances: readonly Element[];
  readonly abilities: readonly string[];
}

export interface HealingDef {
  readonly influencePerPoint: number;
}

export interface SiteDef {
  readonly id: string;
  readonly name: string;
  readonly siteKind: string;
  readonly fortified: boolean;
  readonly inhabited: boolean;
  readonly healing: HealingDef | null;
  readonly interaction: readonly string[];
}

export interface ScenarioTilePlacement {
  readonly tileId: string;
  /** Axial origin of the tile's (0,0) hex. */
  readonly origin: { readonly q: number; readonly r: number };
  /** Tile rotation in 60-degree steps (0-5); defaults to 0. */
  readonly rotation?: number;
}

export interface ScenarioSpawn {
  readonly enemyId: string;
  readonly hex: { readonly q: number; readonly r: number };
}

export interface ScenarioSite {
  readonly siteId: string;
  readonly hex: { readonly q: number; readonly r: number };
}

export interface ScenarioCity {
  readonly siteId: string;
  readonly hex: { readonly q: number; readonly r: number };
  readonly level: number;
  /** Enemy definitions standing in the city; defeated in one assault. */
  readonly garrison: readonly string[];
  readonly fame?: number;
}

export interface SpikeScenarioDef {
  readonly id: string;
  readonly roundCap: number;
  readonly heroId: string;
  readonly tiles: readonly ScenarioTilePlacement[];
  readonly spawns: readonly ScenarioSpawn[];
  readonly site: ScenarioSite | null;
  /** Hero starting hex on the starting tile. */
  readonly startHex: { readonly q: number; readonly r: number };
  /** One entry per round; the length overrides roundCap (T1 day/night schedule). */
  readonly timeOfDayPattern?: readonly ("day" | "night")[];
  /** Additional authored site placements (T1 tiles carry their own sites too). */
  readonly siteSeeds?: readonly ScenarioSite[];
  /** The city to conquer (T1 climax); null for the T0 spike. */
  readonly city?: ScenarioCity | null;
  /** Human-readable scenario name for the UI. */
  readonly name?: string;
}

export interface RulesConstants {
  readonly startingHandSize: number;
  readonly heroArmor: number;
  readonly heroHandLimit: number;
  readonly deedDeckSize: number;
  readonly tileRevealCost: number;
  readonly terrainMoveCost: Readonly<
    Record<Terrain, { readonly day: number; readonly night: number } | null>
  >;
}

export interface ContentBundle {
  readonly schemaVersion: number;
  readonly contentHash: string;
  readonly rulesConstants: RulesConstants;
  readonly cards: Readonly<Record<string, CardDef>>;
  readonly heroes: Readonly<Record<string, HeroDef>>;
  readonly tiles: Readonly<Record<string, TileDef>>;
  readonly enemies: Readonly<Record<string, EnemyDef>>;
  readonly sites: Readonly<Record<string, SiteDef>>;
  readonly scenario: SpikeScenarioDef;
  /** Rules-defined card with no effect (02-rules-core §14.1); not in game-data yet (B7). */
  readonly woundCard: CardDef;
}
