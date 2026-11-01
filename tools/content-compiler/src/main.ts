/**
 * Thin content compiler (plan S4): `game-data/` -> `packages/content`, read-only input.
 *
 * The Python validator is the single schema/rule gate (12-architecture §6.1); this tool only
 * selects the spike subset, maps it to the shared ContentBundle shape, verifies the manifest
 * hashes, hashes full file bytes for the content hash, and checks that every effect op used by
 * the selected cards is implemented by the engine.
 */
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

import type {
  BasicManaColor,
  CardDef,
  ContentBundle,
  EffectOp,
  EnemyDef,
  HeroDef,
  LevelDef,
  RulesConstants,
  SiteDef,
  SkillDef,
  TacticDef,
  TileDef,
  UnitAbilityDef,
  UnitDef,
} from "@emberwold/shared";

const ROOT = process.cwd();
const CONFIG_PATH = (() => {
  const index = process.argv.indexOf("--config");
  if (index >= 0) {
    const value = process.argv[index + 1];
    if (value === undefined) {
      console.error("content-compiler: --config needs a path");
      process.exit(1);
    }
    return resolve(value);
  }
  return join(ROOT, "tools/content-compiler/t1.config.json");
})();
const CONTENT_DIR = join(ROOT, "packages/content/src");
const dataDirArg = process.argv.indexOf("--data-dir");
const DATA_DIR =
  dataDirArg >= 0 ? resolve(process.argv[dataDirArg + 1] ?? "game-data") : join(ROOT, "game-data");

interface SpikeConfig {
  readonly schemaVersion: number;
  readonly hero: string;
  readonly scenarioId?: string;
  readonly scenarioName?: string;
  readonly tiles: readonly {
    readonly tileId: string;
    readonly origin: { q: number; r: number };
    readonly rotation?: number;
  }[];
  readonly enemies: readonly string[];
  readonly sites: readonly string[];
  readonly spawns: readonly { readonly enemyId: string; readonly hex: { q: number; r: number } }[];
  readonly roundCap: number;
  readonly startHex: { q: number; r: number };
  readonly timeOfDayPattern?: readonly ("day" | "night")[];
  readonly city?: {
    readonly siteId: string;
    readonly hex: { q: number; r: number };
    readonly level: number;
    readonly garrison: readonly string[];
    readonly fame?: number;
  } | null;
  readonly siteSeeds?: readonly {
    readonly siteId: string;
    readonly hex: { q: number; r: number };
  }[];
  readonly tacticIds?: readonly string[];
  readonly tacticRules?: {
    readonly humanChoosesFirst: boolean;
    readonly dummyRandom: boolean;
    readonly usedTacticsRemovedEachRound: boolean;
  };
  readonly dummy?: {
    readonly deckSize: number;
    readonly cardsPerTurn: number;
    readonly crystals: readonly BasicManaColor[];
  } | null;
  /** T1: Advanced Action and Spell definition ids to include (data order preserved). */
  readonly advancedActions?: readonly string[];
  readonly spells?: readonly string[];
  /** How many cards each offer shows (defaults 3/3); the rest form the offer deck. */
  readonly aaOfferSize?: number;
  readonly spellOfferSize?: number;
  /** T1: skill definition ids to include; the scenario skill deck defaults to the hero's. */
  readonly skills?: readonly string[];
  /** T1: unit definition ids to include and the unit offer size (default 3). */
  readonly units?: readonly string[];
  readonly unitOfferSize?: number;
  readonly woundCard: CardDef;
  readonly supportedOps: readonly string[];
}

interface DataFile<T> {
  readonly items: T[];
}

interface CardItem {
  readonly id: string;
  readonly name: string;
  readonly color: string;
  readonly powered_by: string | null;
  readonly sideways_value: number;
  readonly effects: { readonly basic: EffectOp; readonly powered: EffectOp | null };
}

interface HeroItem {
  readonly id: string;
  readonly name: string;
  readonly starting_crystals: readonly string[];
  readonly starting_deck: readonly string[];
}

interface TileItem {
  readonly id: string;
  readonly name: string;
  readonly hexes: readonly {
    readonly q: number;
    readonly r: number;
    readonly terrain: string;
    readonly site: string | null;
    readonly mine_color: string | null;
    readonly rampaging: readonly string[];
  }[];
}

interface EnemyItem {
  readonly id: string;
  readonly name: string;
  readonly color: string;
  readonly attack: number;
  readonly attack_element: string;
  readonly armor: number;
  readonly fame: number;
  readonly resistances: readonly string[];
  readonly abilities: readonly string[];
}

interface SiteItem {
  readonly id: string;
  readonly name: string;
  readonly site_kind: string;
  readonly fortified: boolean;
  readonly inhabited: boolean;
  readonly healing: { readonly influence_per_point: number } | null;
  readonly interaction: readonly string[];
}

interface TacticItem {
  readonly id: string;
  readonly name: string;
}

interface LevelItem {
  readonly op: "fame_threshold";
  readonly level: number;
  readonly fame: number;
}

interface LevelStatsItem {
  readonly min_level: number;
  readonly max_level: number;
  readonly armor: number;
  readonly hand_limit: number;
  readonly command_slots: number;
}

interface LevelFile {
  readonly level_stats: readonly LevelStatsItem[];
  readonly items: readonly LevelItem[];
}

interface SkillItem {
  readonly id: string;
  readonly name: string;
  readonly hero: string;
  readonly usage_type: string;
  readonly effect: EffectOp;
  readonly implemented?: boolean;
  readonly mvp?: boolean;
}

interface UnitAbilityItem {
  readonly mana_cost: string | null;
  readonly ability: { readonly op: string; readonly [key: string]: unknown };
}

interface UnitItem {
  readonly id: string;
  readonly name: string;
  readonly level: number;
  readonly influence_cost: number;
  readonly armor: number;
  readonly recruit_sites: readonly string[];
  readonly abilities: readonly UnitAbilityItem[];
  readonly mvp?: boolean;
}

interface RulesConstantsItem {
  readonly starting_hand_size: number;
  readonly hero_armor_level_1_2: number;
  readonly hero_hand_limit_level_1_2: number;
  readonly deed_deck_size: number;
  readonly tile_reveal_cost: number;
  readonly monastery_advanced_action_cost?: number;
  readonly spell_purchase_cost?: number;
  readonly terrain_move_cost: Record<
    string,
    { readonly day: number; readonly night: number } | null
  >;
}

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

function sha256(bytes: Buffer | string): string {
  return createHash("sha256").update(bytes).digest("hex");
}

function fail(message: string): never {
  console.error(`content-compiler: ${message}`);
  process.exit(1);
}

function collectOps(effect: EffectOp, out: Set<string>): void {
  out.add(effect.op);
  if (effect.op === "choice") {
    for (const option of effect.options) {
      collectOps(option, out);
    }
  }
  if (effect.op === "compound") {
    for (const part of effect.effects) {
      collectOps(part, out);
    }
  }
  if (effect.op === "discard_cost") {
    collectOps(effect.then_effect, out);
  }
}

function mapRulesConstants(item: RulesConstantsItem): RulesConstants {
  const terrain = item.terrain_move_cost;
  const terrainEntry = (terrainKey: string): { day: number; night: number } | null => {
    const entry = terrain[terrainKey];
    return entry === undefined || entry === null ? null : { day: entry.day, night: entry.night };
  };
  return {
    startingHandSize: item.starting_hand_size,
    heroArmor: item.hero_armor_level_1_2,
    heroHandLimit: item.hero_hand_limit_level_1_2,
    deedDeckSize: item.deed_deck_size,
    tileRevealCost: item.tile_reveal_cost,
    monasteryAaCost: item.monastery_advanced_action_cost,
    spellCost: item.spell_purchase_cost,
    terrainMoveCost: {
      plains: terrainEntry("plains"),
      hills: terrainEntry("hills"),
      forest: terrainEntry("forest"),
      wasteland: terrainEntry("wasteland"),
      desert: terrainEntry("desert"),
      swamp: terrainEntry("swamp"),
      lake: terrainEntry("lake"),
      mountain: terrainEntry("mountain"),
      city: terrainEntry("city"),
    },
  };
}

function rotateHex(hex: { q: number; r: number }, steps: number): { q: number; r: number } {
  let q = hex.q;
  let r = hex.r;
  const turns = ((steps % 6) + 6) % 6;
  for (let i = 0; i < turns; i += 1) {
    const z = r;
    const x = q;
    const y = -x - z;
    q = -z;
    r = -y;
  }
  return { q, r };
}

/** T1 unit-ability mapping: only abilities expressible with implemented ops become playable. */
function mapUnitAbility(item: UnitAbilityItem): UnitAbilityDef {
  const ability = item.ability;
  const manaCost = item.mana_cost === null ? null : (item.mana_cost as EffectOpManaColor);
  const text = String(ability.op);
  const value = typeof ability["value"] === "number" ? ability["value"] : 0;
  const element = (ability["element"] as string | undefined) ?? "physical";
  const mapped = (effect: EffectOp | null): UnitAbilityDef => ({ manaCost, effect, text });
  switch (ability.op) {
    case "attack":
      return mapped({
        op: "gain_attack",
        amount: value,
        combat_type: "melee",
        element: element as "physical",
      });
    case "ranged_attack":
      return mapped({
        op: "gain_attack",
        amount: value,
        combat_type: "ranged",
        element: element as "physical",
      });
    case "siege_attack":
      return mapped({
        op: "gain_attack",
        amount: value,
        combat_type: "siege",
        element: element as "physical",
      });
    case "block":
      return mapped({ op: "gain_block", amount: value, element: element as "physical" });
    case "move":
    case "move_with_terrain_reduction":
    case "move_with_extended_explore":
      return mapped({ op: "gain_move", amount: value });
    case "influence":
      return mapped({ op: "gain_influence", amount: value });
    case "heal":
      return mapped({ op: "gain_healing", amount: value });
    case "gain_mana":
      return mapped({
        op: "gain_mana",
        color: ability["color"] as string as "red",
        amount: 1,
      });
    default:
      // ready_unit / scout_peek / anything else: deferred until its ops exist (T1 note).
      return mapped(null);
  }
}

type EffectOpManaColor = "red" | "blue" | "green" | "white" | "gold" | "black";

function main(): void {
  const config = readJson<SpikeConfig>(CONFIG_PATH);

  // 1. Run the single validator. Local runners may override the interpreter with PYTHON.
  const python = process.env.PYTHON ?? "python3";
  try {
    execFileSync(python, [join(ROOT, "tools/validate_data.py")], { stdio: "inherit" });
  } catch {
    fail("data validator failed - content build aborted");
  }

  // 2. Verify manifest prefixes against real files, then hash full bytes.
  const manifest = readJson<{ files: { path: string; sha256: string }[]; schema_version: string }>(
    join(DATA_DIR, "manifest.json"),
  );
  for (const file of [...manifest.files].sort((a, b) => (a.path < b.path ? -1 : 1))) {
    const absolute = join(DATA_DIR, file.path.replace(/^game-data\//, ""));
    const digest = sha256(readFileSync(absolute));
    if (!digest.startsWith(file.sha256)) {
      fail(
        `manifest hash mismatch for ${file.path} (recorded ${file.sha256}, actual ${digest.slice(0, 16)})`,
      );
    }
  }

  // 3. Select and map the spike subset.
  const heroes = readJson<DataFile<HeroItem>>(join(DATA_DIR, "heroes.json"));
  const cards = readJson<DataFile<CardItem>>(join(DATA_DIR, "basic-actions.json"));
  const tiles = readJson<DataFile<TileItem>>(join(DATA_DIR, "tiles.json"));
  const enemies = readJson<DataFile<EnemyItem>>(join(DATA_DIR, "enemies.json"));
  const sites = readJson<DataFile<SiteItem>>(join(DATA_DIR, "sites.json"));
  const tactics = readJson<DataFile<TacticItem>>(join(DATA_DIR, "tactics.json"));
  const advancedActions = readJson<DataFile<CardItem>>(join(DATA_DIR, "advanced-actions.json"));
  const spells = readJson<DataFile<CardItem>>(join(DATA_DIR, "spells.json"));
  const levels = readJson<LevelFile>(join(DATA_DIR, "levels.json"));
  const skills = readJson<DataFile<SkillItem>>(join(DATA_DIR, "skills.json"));
  const units = readJson<DataFile<UnitItem>>(join(DATA_DIR, "units.json"));
  const keywords = readJson<{ rules_constants: RulesConstantsItem }>(
    join(DATA_DIR, "keywords.json"),
  );

  const heroItem = heroes.items.find((item) => item.id === config.hero);
  if (heroItem === undefined) {
    fail(`hero not found: ${config.hero}`);
  }
  const hero: HeroDef = {
    id: heroItem.id,
    name: heroItem.name,
    startingCrystals: heroItem.starting_crystals as readonly BasicManaColor[],
    startingDeck: heroItem.starting_deck,
  };

  const cardItems = new Map(cards.items.map((item) => [item.id, item]));
  const usedOps = new Set<string>();
  const cardDefs: Record<string, CardDef> = {};
  for (const defId of new Set(hero.startingDeck)) {
    const item = cardItems.get(defId);
    if (item === undefined) {
      fail(`hero deck references unknown card: ${defId}`);
    }
    const def: CardDef = {
      id: item.id,
      name: item.name,
      color: item.color as CardDef["color"],
      poweredBy: item.powered_by as CardDef["poweredBy"],
      sidewaysValue: item.sideways_value,
      effects: { basic: item.effects.basic, powered: item.effects.powered },
    };
    collectOps(def.effects.basic, usedOps);
    if (def.effects.powered !== null) {
      collectOps(def.effects.powered, usedOps);
    }
    cardDefs[def.id] = def;
  }
  const unsupported = [...usedOps].filter((op) => !config.supportedOps.includes(op));
  if (unsupported.length > 0) {
    fail(`unmapped effect ops in the spike selection: ${unsupported.join(", ")}`);
  }
  cardDefs[config.woundCard.id] = config.woundCard;

  const tileDefs: Record<string, TileDef> = {};
  for (const placement of config.tiles) {
    const item = tiles.items.find((candidate) => candidate.id === placement.tileId);
    if (item === undefined) {
      fail(`tile not found: ${placement.tileId}`);
    }
    tileDefs[item.id] = {
      id: item.id,
      name: item.name,
      hexes: item.hexes.map((hex) => ({
        q: hex.q,
        r: hex.r,
        terrain: hex.terrain as TileDef["hexes"][number]["terrain"],
        site: hex.site,
        mine_color: hex.mine_color as BasicManaColor | null,
        rampaging: hex.rampaging,
      })),
    };
  }

  // Authored placements must not overlap: the same global hex on two tiles is a data bug.
  const occupied = new Map<string, string>();
  for (const placement of config.tiles) {
    const def = tileDefs[placement.tileId];
    if (def === undefined) {
      fail(`tile not mapped: ${placement.tileId}`);
    }
    for (const hex of def.hexes) {
      const rotated = rotateHex({ q: hex.q, r: hex.r }, placement.rotation ?? 0);
      const key = `${placement.origin.q + rotated.q},${placement.origin.r + rotated.r}`;
      const owner = occupied.get(key);
      if (owner !== undefined) {
        fail(`tile placement overlap at ${key}: ${owner} and ${placement.tileId}`);
      }
      occupied.set(key, placement.tileId);
    }
  }

  const enemyDefs: Record<string, EnemyDef> = {};
  for (const enemyId of config.enemies) {
    const item = enemies.items.find((candidate) => candidate.id === enemyId);
    if (item === undefined) {
      fail(`enemy not found: ${enemyId}`);
    }
    enemyDefs[item.id] = {
      id: item.id,
      name: item.name,
      color: item.color,
      attack: item.attack,
      attackElement: item.attack_element as EnemyDef["attackElement"],
      armor: item.armor,
      fame: item.fame,
      resistances: item.resistances as readonly EnemyDef["resistances"][number][],
      abilities: item.abilities,
    };
  }

  const siteDefs: Record<string, SiteDef> = {};
  for (const siteId of config.sites) {
    const item = sites.items.find((candidate) => candidate.id === siteId);
    if (item === undefined) {
      fail(`site not found: ${siteId}`);
    }
    siteDefs[item.id] = {
      id: item.id,
      name: item.name,
      siteKind: item.site_kind,
      fortified: item.fortified,
      inhabited: item.inhabited,
      healing:
        item.healing === null ? null : { influencePerPoint: item.healing.influence_per_point },
      interaction: item.interaction,
    };
  }

  const tacticIds = config.tacticIds ?? tactics.items.map((item) => item.id);
  const tacticDefs: Record<string, TacticDef> = {};
  for (const tacticId of tacticIds) {
    const item = tactics.items.find((candidate) => candidate.id === tacticId);
    if (item === undefined) {
      fail(`tactic not found: ${tacticId}`);
    }
    tacticDefs[item.id] = { id: item.id, name: item.name };
  }

  // T1 offers: Advanced Actions (monastery) and Spells (mage tower). Only cards whose whole
  // effect tree is implemented by the engine enter the bundle; the rest stay out for now.
  const additionalCards: Record<string, CardDef> = {};
  const selectOfferCards = (
    items: readonly CardItem[],
    ids: readonly string[],
    kind: string,
  ): string[] => {
    const selected: string[] = [];
    for (const id of ids) {
      const item = items.find((candidate) => candidate.id === id);
      if (item === undefined) {
        fail(`${kind} not found: ${id}`);
      }
      const ops = new Set<string>();
      collectOps(item.effects.basic, ops);
      if (item.effects.powered !== null) {
        collectOps(item.effects.powered, ops);
      }
      const unsupported = [...ops].filter((op) => !config.supportedOps.includes(op));
      if (unsupported.length > 0) {
        fail(`${kind} ${id} uses unsupported ops: ${unsupported.join(", ")}`);
      }
      for (const op of ops) {
        usedOps.add(op);
      }
      additionalCards[item.id] = {
        id: item.id,
        name: item.name,
        color: item.color as CardDef["color"],
        poweredBy: item.powered_by as CardDef["poweredBy"],
        sidewaysValue: item.sideways_value,
        effects: { basic: item.effects.basic, powered: item.effects.powered },
      };
      selected.push(item.id);
    }
    return selected;
  };
  const aaIds = selectOfferCards(
    advancedActions.items,
    config.advancedActions ?? [],
    "advanced action",
  );
  const spellIds = selectOfferCards(spells.items, config.spells ?? [], "spell");
  const aaOffer = aaIds.slice(0, config.aaOfferSize ?? 3);
  const aaDeck = aaIds.slice(config.aaOfferSize ?? 3);
  const spellOffer = spellIds.slice(0, config.spellOfferSize ?? 3);
  const spellDeck = spellIds.slice(config.spellOfferSize ?? 3);

  // T1 leveling: flatten the fame thresholds and stat bands to one entry per level.
  const levelDefs: LevelDef[] = [];
  for (let level = 1; level <= 10; level += 1) {
    const threshold = levels.items.find((item) => item.level === level);
    const band = levels.level_stats.find(
      (candidate) => candidate.min_level <= level && level <= candidate.max_level,
    );
    if (threshold === undefined || band === undefined) {
      fail(`levels.json is missing level ${level}`);
    }
    levelDefs.push({
      level,
      fame: threshold.fame,
      stats: {
        armor: band.armor,
        handLimit: band.hand_limit,
        commandSlots: band.command_slots,
      },
    });
  }

  // T1 skills: acquisition is implemented; the effect is only kept when its ops exist.
  const heroName = hero.id.replace(/^hero:/, "");
  const skillIds =
    config.skills ?? skills.items.filter((item) => item.mvp === true).map((item) => item.id);
  const skillDefs: Record<string, SkillDef> = {};
  const skillDeck: string[] = [];
  for (const skillId of skillIds) {
    const item = skills.items.find((candidate) => candidate.id === skillId);
    if (item === undefined) {
      fail(`skill not found: ${skillId}`);
    }
    const ops = new Set<string>();
    collectOps(item.effect, ops);
    const supported = [...ops].every((op) => config.supportedOps.includes(op));
    skillDefs[item.id] = {
      id: item.id,
      name: item.name,
      hero: item.hero,
      usageType: item.usage_type,
      effect: supported ? item.effect : null,
    };
    if (item.hero === heroName) {
      skillDeck.push(item.id);
    }
  }

  // T1 units: offers refresh each round; abilities are mapped only when implemented.
  const unitDefs: Record<string, UnitDef> = {};
  const unitIds =
    config.units ?? units.items.filter((item) => item.mvp === true).map((item) => item.id);
  for (const unitId of unitIds) {
    const item = units.items.find((candidate) => candidate.id === unitId);
    if (item === undefined) {
      fail(`unit not found: ${unitId}`);
    }
    unitDefs[item.id] = {
      id: item.id,
      name: item.name,
      level: item.level,
      influenceCost: item.influence_cost,
      armor: item.armor,
      recruitSites: item.recruit_sites,
      abilities: item.abilities.map(mapUnitAbility),
    };
  }
  const unitOfferSize = config.unitOfferSize ?? 3;
  const unitOffer = unitIds.slice(0, unitOfferSize);
  const unitDeck = unitIds.slice(unitOfferSize);

  const draftBundle: Omit<ContentBundle, "contentHash"> = {
    schemaVersion: config.schemaVersion,
    rulesConstants: mapRulesConstants(keywords.rules_constants),
    cards: { ...cardDefs, ...additionalCards },
    heroes: { [hero.id]: hero },
    tiles: tileDefs,
    enemies: enemyDefs,
    sites: siteDefs,
    scenario: {
      id: config.scenarioId ?? "scenario:spike",
      name: config.scenarioName ?? "Spike",
      roundCap: config.roundCap,
      heroId: hero.id,
      tiles: config.tiles,
      spawns: config.spawns,
      site: null,
      startHex: config.startHex,
      timeOfDayPattern: config.timeOfDayPattern,
      siteSeeds: config.siteSeeds,
      city: config.city ?? null,
      tacticIds,
      tacticRules: config.tacticRules,
      dummy: config.dummy ?? null,
      aaOffer,
      spellOffer,
      aaDeck,
      spellDeck,
      skillDeck,
      unitOffer,
      unitDeck,
    },
    tactics: tacticDefs,
    levels: levelDefs,
    skills: skillDefs,
    units: unitDefs,
    woundCard: config.woundCard,
  };

  // The content hash covers the emitted bundle itself, so any selection, mapping, authored
  // scenario or bundle-shape change invalidates old traces automatically.
  const contentHash = sha256(JSON.stringify(draftBundle));
  const bundle: ContentBundle = { ...draftBundle, contentHash };

  // 4. Emit deterministic output + stats.
  writeFileSync(join(CONTENT_DIR, "bundle.json"), `${JSON.stringify(bundle, null, 2)}\n`);
  const indexSource = `/**
 * Generated by tools/content-compiler (do not hand-edit). Rebuild with \`pnpm content:build\`.
 */
import type { ContentBundle } from "@emberwold/shared";

import bundleData from "./bundle.json";

export const bundle: ContentBundle = bundleData as unknown as ContentBundle;
export const contentHash: string = bundle.contentHash;
export default bundle;
`;
  writeFileSync(join(CONTENT_DIR, "index.ts"), indexSource);

  const deckSize = hero.startingDeck.length;
  if (deckSize !== bundle.rulesConstants.deedDeckSize) {
    fail(
      `hero deck size ${deckSize} != rules deed deck size ${bundle.rulesConstants.deedDeckSize}`,
    );
  }
  if (Object.keys(tileDefs).length !== config.tiles.length) {
    fail("tile count mismatch");
  }
  console.log("content-compiler: OK");
  console.log(`  contentHash: ${contentHash}`);
  console.log(
    `  bundle: ${hero.startingDeck.length} deck instances / ${Object.keys(cardDefs).length} card defs ` +
      `(incl. wound), ${Object.keys(tileDefs).length} tiles, ${Object.keys(enemyDefs).length} enemies, ` +
      `${Object.keys(siteDefs).length} sites`,
  );
  console.log(`  effect ops used: ${[...usedOps].sort().join(", ")}`);
}

main();
