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
  RulesConstants,
  SiteDef,
  TacticDef,
  TileDef,
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

interface RulesConstantsItem {
  readonly starting_hand_size: number;
  readonly hero_armor_level_1_2: number;
  readonly hero_hand_limit_level_1_2: number;
  readonly deed_deck_size: number;
  readonly tile_reveal_cost: number;
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
  const hashed: string[] = [];
  for (const file of [...manifest.files].sort((a, b) => (a.path < b.path ? -1 : 1))) {
    const absolute = join(DATA_DIR, file.path.replace(/^game-data\//, ""));
    const digest = sha256(readFileSync(absolute));
    if (!digest.startsWith(file.sha256)) {
      fail(
        `manifest hash mismatch for ${file.path} (recorded ${file.sha256}, actual ${digest.slice(0, 16)})`,
      );
    }
    hashed.push(`${file.path}:${digest}`);
  }
  // The compiler config (tile placement, spawns, selection) is part of the content identity:
  // a trace must refuse to replay if the authored spike scenario changed.
  const configDigest = sha256(readFileSync(CONFIG_PATH));
  const contentHash = sha256(
    `${manifest.schema_version}|${configDigest}|${[...hashed].sort().join(";")}`,
  );

  // 3. Select and map the spike subset.
  const heroes = readJson<DataFile<HeroItem>>(join(DATA_DIR, "heroes.json"));
  const cards = readJson<DataFile<CardItem>>(join(DATA_DIR, "basic-actions.json"));
  const tiles = readJson<DataFile<TileItem>>(join(DATA_DIR, "tiles.json"));
  const enemies = readJson<DataFile<EnemyItem>>(join(DATA_DIR, "enemies.json"));
  const sites = readJson<DataFile<SiteItem>>(join(DATA_DIR, "sites.json"));
  const tactics = readJson<DataFile<TacticItem>>(join(DATA_DIR, "tactics.json"));
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

  const bundle: ContentBundle = {
    schemaVersion: config.schemaVersion,
    contentHash,
    rulesConstants: mapRulesConstants(keywords.rules_constants),
    cards: cardDefs,
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
    },
    tactics: tacticDefs,
    woundCard: config.woundCard,
  };

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
