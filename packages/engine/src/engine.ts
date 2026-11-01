import {
  asCardInstanceId,
  asEnemyInstanceId,
  asPlayerId,
  asSiteDefId,
  asUnitInstanceId,
  asTileId,
  createRng,
  hashState as sharedHashState,
  nextU32,
  type BasicManaColor,
  type CardDef,
  type CardId,
  type CardInstanceId,
  type ContentBundle,
  type EffectOp,
  type EnemyInstanceId,
  type Hex,
  type ManaColor,
  type RngState,
  type UnitInstanceId,
} from "@emberwold/shared";

import {
  attackValueAfterResistance,
  enemyDamage,
  isBlocked,
  totalAttackAgainst,
  woundsFromDamage,
} from "./combatMath";
import type {
  Action,
  ApplyOutcome,
  DummyState,
  GameConfig,
  GameEvent,
  GameState,
  LegalActionSet,
  ManaPayment,
  PendingChoice,
  PlayerState,
  PlacedTile,
  TacticChoice,
  TurnState,
} from "./types";

export const ENGINE_VERSION = "0.1.0-spike";
export const RULESET_ID = "emberwold-spike" as const;
export const SCHEMA_VERSION = 2;
const SOURCE_DICE = 3;
const SOURCE_COLORS: readonly ManaColor[] = ["red", "blue", "green", "white", "gold", "black"];
const BASIC_COLORS: readonly BasicManaColor[] = ["green", "blue", "red", "white"];

type Draft = GameState;

type PendingDraft = PendingChoice;

interface Env {
  readonly content: ContentBundle;
  readonly events: GameEvent[];
}

// ---------------------------------------------------------------------------
// Generic helpers
// ---------------------------------------------------------------------------

function cloneState(state: GameState): Draft {
  return JSON.parse(JSON.stringify(state)) as Draft;
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreeze(child);
    }
    Object.freeze(value);
  }
  return value;
}

function hexKey(hex: Hex): string {
  return `${hex.q},${hex.r}`;
}

function addHex(a: Hex, b: Hex): Hex {
  return { q: a.q + b.q, r: a.r + b.r };
}

function hexesEqual(a: Hex, b: Hex): boolean {
  return a.q === b.q && a.r === b.r;
}

/** Rotate axial coordinates by `steps` * 60 degrees (cube rotation). */
function rotateHex(hex: Hex, steps: number): Hex {
  let q = hex.q;
  let r = hex.r;
  const turns = ((steps % 6) + 6) % 6;
  for (let i = 0; i < turns; i += 1) {
    const z = r;
    const x = q;
    const y = -x - z;
    // 60-degree rotation: (x, y, z) -> (-z, -x, -y)
    q = -z;
    r = -y;
  }
  return { q, r };
}

const NEIGHBORS: readonly Hex[] = [
  { q: 1, r: 0 },
  { q: 1, r: -1 },
  { q: 0, r: -1 },
  { q: -1, r: 0 },
  { q: -1, r: 1 },
  { q: 0, r: 1 },
];

function neighbors(hex: Hex): readonly Hex[] {
  return NEIGHBORS.map((delta) => addHex(hex, delta));
}

// ---------------------------------------------------------------------------
// Content lookups
// ---------------------------------------------------------------------------

function cardOf(
  content: ContentBundle,
  cardInstances: Readonly<Record<CardInstanceId, string>>,
  instance: CardInstanceId,
): CardDef {
  const defId = cardInstances[instance];
  const def = defId === undefined ? undefined : content.cards[defId];
  if (def === undefined) {
    throw new Error(`content: unknown card instance ${instance}`);
  }
  return def;
}

function isWound(content: ContentBundle, def: CardDef): boolean {
  return def.id === content.woundCard.id;
}

function enemyOf(content: ContentBundle, defId: string) {
  const def = content.enemies[defId];
  if (def === undefined) {
    throw new Error(`content: unknown enemy ${defId}`);
  }
  return def;
}

// ---------------------------------------------------------------------------
// Randomness helpers
// ---------------------------------------------------------------------------

function rollSource(draft: Draft): void {
  const dice: { color: ManaColor; used: boolean }[] = [];
  let rng: RngState = draft.rng;
  for (let i = 0; i < SOURCE_DICE; i += 1) {
    const [value, next] = nextU32(rng, "sourceDice");
    rng = next;
    const color = SOURCE_COLORS[value % SOURCE_COLORS.length];
    if (color !== undefined) {
      // 02 §8.2: the "wrong" special colour is depleted (unusable) on the round reset.
      const depleted =
        (draft.timeOfDay === "day" && color === "black") ||
        (draft.timeOfDay === "night" && color === "gold");
      dice.push({ color, used: depleted });
    }
  }
  draft.rng = rng;
  draft.source = dice;
}

function rollColor(draft: Draft, stream: "sourceDice" | "effectRandom"): ManaColor {
  const [value, next] = nextU32(draft.rng, stream);
  draft.rng = next;
  return SOURCE_COLORS[value % SOURCE_COLORS.length] as ManaColor;
}

function shuffleWithRng<T>(items: readonly T[], rng: RngState): { items: T[]; rng: RngState } {
  const result = [...items];
  let state = rng;
  for (let i = result.length - 1; i > 0; i -= 1) {
    const [value, next] = nextU32(state, "shuffle");
    state = next;
    const j = value % (i + 1);
    const a = result[i];
    const b = result[j];
    if (a !== undefined && b !== undefined) {
      result[i] = b;
      result[j] = a;
    }
  }
  return { items: result, rng: state };
}

function drawCards(draft: Draft, env: Env, count: number): void {
  const player = draft.players[0];
  if (player === undefined) {
    return;
  }
  let drawn = 0;
  for (let i = 0; i < count; i += 1) {
    const card = player.deck.shift();
    if (card === undefined) {
      break;
    }
    player.hand.push(card);
    drawn += 1;
  }
  if (drawn > 0) {
    env.events.push({ type: "cardDrawn", count: drawn });
  }
}

function nextWoundInstance(draft: Draft, env: Env): CardInstanceId {
  const id = asCardInstanceId(`wound:${draft.woundCounter}`);
  draft.woundCounter += 1;
  draft.cardInstances[id] = env.content.woundCard.id as unknown as CardId;
  return id;
}

// ---------------------------------------------------------------------------
// Create game
// ---------------------------------------------------------------------------

function seedEnemiesForRevealedTiles(
  draft: Draft,
  content: ContentBundle,
  events: GameEvent[],
): void {
  const scenario = content.scenario;
  const revealed = new Set<string>();
  for (const tile of draft.map.tiles) {
    if (!tile.revealed) {
      continue;
    }
    for (const info of tileHexInfos(tile, content)) {
      revealed.add(hexKey(info.hex));
    }
  }
  const existing = new Set(draft.map.enemies.map((enemy) => enemy.instanceId as string));
  scenario.spawns.forEach((spawn, index) => {
    const instanceId = `enemy:spawn:${index}`;
    if (existing.has(instanceId) || !revealed.has(hexKey(spawn.hex))) {
      return;
    }
    draft.map.enemies.push({
      instanceId: asEnemyInstanceId(instanceId),
      defId: spawn.enemyId,
      hex: spawn.hex,
      alive: true,
      kind: "rampaging",
    });
    events.push({
      type: "enemySpawned",
      enemy: asEnemyInstanceId(instanceId),
      defId: spawn.enemyId,
    });
  });
  const city = scenario.city ?? null;
  if (city !== null) {
    city.garrison.forEach((defId, index) => {
      const instanceId = `enemy:city:${index}`;
      if (existing.has(instanceId) || !revealed.has(hexKey(city.hex))) {
        return;
      }
      draft.map.enemies.push({
        instanceId: asEnemyInstanceId(instanceId),
        defId,
        hex: city.hex,
        alive: true,
        kind: "city",
      });
      events.push({ type: "enemySpawned", enemy: asEnemyInstanceId(instanceId), defId });
    });
  }
}

export function createGame(
  config: GameConfig,
  content: ContentBundle,
): { state: GameState; events: GameEvent[] } {
  const events: GameEvent[] = [];
  const scenario = content.scenario;
  const heroId = config.heroId ?? scenario.heroId;
  const hero = content.heroes[heroId];
  if (hero === undefined) {
    throw new Error(`content: unknown hero ${heroId}`);
  }
  const skillDeck = scenario.skillDecks?.[hero.id] ?? scenario.skillDeck ?? [];

  const cardInstances: Record<CardInstanceId, CardId> = {};
  const deck: CardInstanceId[] = [];
  hero.startingDeck.forEach((defId, index) => {
    const instance = asCardInstanceId(`p1:deck:${index}`);
    cardInstances[instance] = defId as unknown as CardId;
    deck.push(instance);
  });

  const shuffled = shuffleWithRng(deck, createRng(config.seed));
  const crystals: Record<BasicManaColor, number> = { red: 0, blue: 0, green: 0, white: 0 };
  for (const color of hero.startingCrystals) {
    crystals[color] += 1;
  }

  const player: PlayerState = {
    id: asPlayerId("p1"),
    heroId: hero.id,
    seat: 0,
    level: 1,
    fame: 0,
    reputation: 0,
    position: scenario.startHex,
    hand: [],
    deck: shuffled.items,
    discard: [],
    playArea: [],
    crystals,
    manaTokens: [],
    skillDeck: [...skillDeck],
    skills: [],
    units: [],
  };

  const placed: PlacedTile[] = scenario.tiles.map((placement, index) => {
    const tile = content.tiles[placement.tileId];
    if (tile === undefined) {
      throw new Error(`content: unknown tile ${placement.tileId}`);
    }
    const rotation = placement.rotation ?? 0;
    const containsStart = tile.hexes.some((hex) =>
      hexesEqual(
        addHex(placement.origin, rotateHex({ q: hex.q, r: hex.r }, rotation)),
        scenario.startHex,
      ),
    );
    return {
      tileId: asTileId(placement.tileId),
      origin: placement.origin,
      revealed: containsStart || index === 0,
      rotation,
    };
  });

  const sites = sitesOnRevealedHexes(placed, content);

  const turn: TurnState = {
    number: 1,
    step: "movement",
    movePoints: 0,
    influence: 0,
    cardsPlayed: 0,
    playedOrDiscarded: false,
    rested: false,
    handWasEmptyAtStart: false,
    extraSourceDie: false,
    cardBoost: 0,
    flags: {},
  };

  const allTactics = scenario.tacticIds ?? Object.keys(content.tactics ?? {});
  const dummyScenario = scenario.dummy ?? null;
  const dummy: DummyState | null =
    dummyScenario === null
      ? null
      : {
          cardsRemaining: dummyScenario.deckSize,
          deckSize: dummyScenario.deckSize,
          cardsPerTurn: dummyScenario.cardsPerTurn,
          crystals: [...dummyScenario.crystals],
        };
  const tacticChoice: TacticChoice | null =
    allTactics.length === 0 ? null : { options: [...allTactics] };
  const timeOfDay = scenario.timeOfDayPattern?.[0] ?? "day";
  const state: GameState = {
    schemaVersion: SCHEMA_VERSION,
    engineVersion: ENGINE_VERSION,
    rulesetId: RULESET_ID,
    contentHash: content.contentHash,
    seed: config.seed,
    round: 1,
    timeOfDay,
    activePlayer: player.id,
    turn,
    players: [player],
    map: {
      tiles: placed,
      enemies: [],
      sites: sites.map((site) => ({ siteId: asSiteDefId(site.siteId), hex: site.hex })),
    },
    source: [],
    combat: null,
    pending: null,
    cardInstances,
    woundCounter: 0,
    actionEpoch: 0,
    rng: shuffled.rng,
    gameOver: false,
    result: null,
    tacticChoice,
    tactics: { available: [...allTactics], used: [], human: null, dummy: null },
    dummy,
    endOfRoundAnnounced: false,
    offers: {
      aa: [...(scenario.aaOffer ?? [])] as CardId[],
      spell: [...(scenario.spellOffer ?? [])] as CardId[],
      unit: [...(scenario.unitOffer ?? [])],
    },
    offerDecks: {
      aa: [...(scenario.aaDeck ?? [])] as CardId[],
      spell: [...(scenario.spellDeck ?? [])] as CardId[],
      unit: [...(scenario.unitDeck ?? [])],
    },
    skillUsage: { turn: [], round: [] },
  };
  const draft = cloneState(state);
  seedEnemiesForRevealedTiles(draft, content, events);
  rollSource(draft);
  draft.turn.handWasEmptyAtStart = true;
  drawCards(draft, { content, events }, content.rulesConstants.startingHandSize);
  draft.turn.handWasEmptyAtStart = draft.players[0]?.hand.length === 0;
  events.push({ type: "gameCreated", seed: config.seed, contentHash: content.contentHash });
  events.push({ type: "roundStarted", round: 1 });
  events.push({ type: "sourceRolled", dice: draft.source.map((die) => die.color) });
  if (draft.tacticChoice === null) {
    events.push({ type: "turnStarted", player: asPlayerId("p1") });
  }
  return { state: deepFreeze(draft) as unknown as GameState, events };
}

// ---------------------------------------------------------------------------
// Effects and legality
// ---------------------------------------------------------------------------

function effectApplicable(state: GameState, content: ContentBundle, effect: EffectOp): boolean {
  switch (effect.op) {
    case "choice":
      return effect.options.some((option) => effectApplicable(state, content, option));
    case "compound":
      return effect.effects.every((part) => effectApplicable(state, content, part));
    case "gain_move":
    case "gain_influence":
    case "gain_healing":
    case "draw_cards":
    case "gain_mana":
    case "gain_crystal":
    case "convert_mana_to_crystal":
    case "mana_draw_powered":
    case "apply_modifier":
    case "rule_override":
    case "card_boost":
    case "change_reputation":
      return state.combat === null;
    case "discard_cost": {
      if (state.combat !== null) {
        return false;
      }
      return (
        state.players[0]?.hand.some((instance) => {
          const def = cardOf(content, state.cardInstances, instance);
          if (effect.wounds_only) {
            return isWound(content, def);
          }
          return !isWound(content, def);
        }) ?? false
      );
    }
    case "take_wound":
      return state.combat !== null;
    case "gain_attack": {
      if (state.combat === null) {
        return false;
      }
      if (state.combat.phase === "rangedSiege") {
        const hasFortified = state.combat.enemies.some((enemy) => {
          const def = enemyOf(content, enemy.defId);
          return (
            !enemy.defeated &&
            (def.abilities.includes("fortified") || def.abilities.includes("double_fortified"))
          );
        });
        if (effect.combat_type === "melee") {
          return false;
        }
        if (hasFortified && effect.combat_type !== "siege") {
          return false;
        }
        return true;
      }
      return state.combat.phase === "attack";
    }
    case "gain_block":
      return state.combat !== null && state.combat.phase === "block";
    default:
      return false;
  }
}

function boosted(draft: Draft, amount: number): number {
  const boost = draft.turn.cardBoost;
  if (boost > 0) {
    draft.turn.cardBoost = 0;
    return amount + boost;
  }
  return amount;
}

function applyEffect(draft: Draft, env: Env, effect: EffectOp): void {
  const { content, events } = env;
  const player = draft.players[0];
  if (player === undefined) {
    return;
  }
  switch (effect.op) {
    case "choice": {
      const pending: PendingDraft = {
        choiceId: `choice:${draft.actionEpoch + 1}`,
        kind: "effectChoice",
        options: effect.options.map((option) => describeEffect(option)),
        effectOptions: [...effect.options],
        thenEffect: null,
        eligibleCards: [],
      };
      draft.pending = pending;
      events.push({
        type: "choiceRequested",
        choiceId: pending.choiceId,
        kind: "effectChoice",
        options: pending.options,
      });
      return;
    }
    case "compound": {
      for (const part of effect.effects) {
        applyEffect(draft, env, part);
      }
      return;
    }
    case "gain_move": {
      const amount = boosted(draft, effect.amount);
      draft.turn.movePoints += amount;
      events.push({ type: "movePointsGained", amount });
      return;
    }
    case "gain_influence": {
      const amount = boosted(draft, effect.amount);
      draft.turn.influence += amount;
      events.push({ type: "influenceGained", amount });
      return;
    }
    case "gain_healing": {
      let healed = 0;
      const hand = player.hand;
      for (let i = hand.length - 1; i >= 0 && healed < effect.amount; i -= 1) {
        const instance = hand[i];
        if (instance === undefined) {
          continue;
        }
        if (isWound(content, cardOf(content, draft.cardInstances, instance))) {
          hand.splice(i, 1);
          healed += 1;
        }
      }
      events.push({ type: "healGained", points: healed });
      return;
    }
    case "draw_cards":
      drawCards(draft, env, effect.count);
      return;
    case "gain_mana":
      for (let i = 0; i < effect.amount; i += 1) {
        player.manaTokens.push({ color: effect.color });
        events.push({ type: "manaGained", color: effect.color });
      }
      return;
    case "gain_crystal": {
      const current = player.crystals[effect.color];
      if (current < 3) {
        player.crystals[effect.color] = current + 1;
        events.push({ type: "crystalGained", color: effect.color });
      }
      return;
    }
    case "convert_mana_to_crystal": {
      const index = player.manaTokens.findIndex((token) =>
        (BASIC_COLORS as readonly ManaColor[]).includes(token.color),
      );
      const token = index >= 0 ? player.manaTokens[index] : undefined;
      if (token !== undefined) {
        player.manaTokens.splice(index, 1);
        const color = token.color as BasicManaColor;
        if (player.crystals[color] < 3) {
          player.crystals[color] += 1;
          events.push({ type: "crystalGained", color });
        }
      }
      return;
    }
    case "mana_draw_powered": {
      for (let die = 0; die < effect.dice_count; die += 1) {
        const color = rollColor(draft, "effectRandom");
        for (let token = 0; token < effect.tokens_per_die; token += 1) {
          player.manaTokens.push({ color });
          events.push({ type: "manaGained", color });
        }
      }
      return;
    }
    case "apply_modifier": {
      if (effect.effect.op === "rule_override" && effect.effect.rule === "extra_source_die") {
        draft.turn.extraSourceDie = true;
        draft.source.push({ color: rollColor(draft, "sourceDice"), used: false });
        events.push({
          type: "sourceRolled",
          dice: [draft.source[draft.source.length - 1]?.color ?? "gold"],
        });
      }
      if (effect.effect.op === "terrain_cost" && effect.duration === "turn") {
        draft.turn.terrainModifier = effect.effect;
      }
      return;
    }
    case "rule_override": {
      if (effect.rule === "extra_source_die") {
        draft.turn.extraSourceDie = true;
      }
      return;
    }
    case "card_boost":
      draft.turn.cardBoost += effect.bonus;
      return;
    case "change_reputation":
      player.reputation += effect.amount;
      events.push({ type: "reputationChanged", amount: effect.amount });
      return;
    case "discard_cost": {
      const eligible = player.hand.filter((instance) => {
        const def = cardOf(content, draft.cardInstances, instance);
        if (effect.wounds_only) {
          return isWound(content, def);
        }
        if (effect.filter_wounds) {
          return !isWound(content, def);
        }
        return true;
      });
      if (eligible.length === 0) {
        return;
      }
      const pending: PendingDraft = {
        choiceId: `choice:${draft.actionEpoch + 1}`,
        kind: "discardCost",
        options: [...eligible],
        effectOptions: [],
        thenEffect: effect.then_effect,
        eligibleCards: [...eligible],
      };
      draft.pending = pending;
      events.push({
        type: "choiceRequested",
        choiceId: pending.choiceId,
        kind: "discardCost",
        options: pending.options,
      });
      return;
    }
    case "take_wound": {
      const wound = nextWoundInstance(draft, env);
      player.hand.push(wound);
      events.push({ type: "woundGained", amount: 1 });
      return;
    }
    case "gain_attack": {
      if (draft.combat === null) {
        return;
      }
      const amount = boosted(draft, effect.amount);
      draft.combat.attackPool.push({
        amount,
        element: effect.element,
        combatType: effect.combat_type,
      });
      events.push({ type: "movePointsGained", amount: 0 });
      return;
    }
    case "gain_block": {
      if (draft.combat === null) {
        return;
      }
      const amount = boosted(draft, effect.amount);
      draft.combat.blockPool.push({ amount, element: effect.element });
      return;
    }
    default:
      return;
  }
}

function describeEffect(effect: EffectOp): string {
  switch (effect.op) {
    case "gain_move":
      return `gain ${effect.amount} move`;
    case "gain_influence":
      return `gain ${effect.amount} influence`;
    case "gain_attack":
      return `gain ${effect.amount} ${effect.combat_type} attack`;
    case "gain_block":
      return `gain ${effect.amount} block`;
    case "gain_healing":
      return `heal ${effect.amount}`;
    case "draw_cards":
      return `draw ${effect.count}`;
    case "gain_mana":
      return `gain ${effect.amount} ${effect.color} mana`;
    case "gain_crystal":
      return `gain ${effect.color} crystal`;
    case "convert_mana_to_crystal":
      return "convert mana to crystal";
    default:
      return effect.op;
  }
}

// ---------------------------------------------------------------------------
// Mana payment
// ---------------------------------------------------------------------------

function isBasicColor(color: ManaColor): color is BasicManaColor {
  return (BASIC_COLORS as readonly string[]).includes(color);
}

function matchingColor(color: ManaColor, wanted: ManaColor | "any_basic"): boolean {
  if (wanted === "any_basic") {
    return isBasicColor(color) || color === "gold";
  }
  return color === wanted || color === "gold";
}

function pickMana(state: GameState, poweredBy: ManaColor | "any_basic" | null): ManaPayment | null {
  const player = state.players[0];
  if (player === undefined || poweredBy === null) {
    return null;
  }
  for (const color of BASIC_COLORS) {
    if (matchingColor(color, poweredBy) && player.crystals[color] > 0) {
      return { kind: "crystal", color };
    }
  }
  const tokenIndex = player.manaTokens.findIndex((token) => matchingColor(token.color, poweredBy));
  const token = tokenIndex >= 0 ? player.manaTokens[tokenIndex] : undefined;
  if (token !== undefined) {
    return { kind: "token", color: token.color };
  }
  const dieIndex = state.source.findIndex(
    (die) => !die.used && matchingColor(die.color, poweredBy),
  );
  if (dieIndex >= 0) {
    return { kind: "die", index: dieIndex };
  }
  return null;
}

function applyManaPayment(draft: Draft, payment: ManaPayment): void {
  const player = draft.players[0];
  if (player === undefined) {
    return;
  }
  if (payment.kind === "crystal") {
    player.crystals[payment.color] = Math.max(0, player.crystals[payment.color] - 1);
    return;
  }
  if (payment.kind === "token") {
    const index = player.manaTokens.findIndex((token) => token.color === payment.color);
    if (index >= 0) {
      player.manaTokens.splice(index, 1);
    }
    return;
  }
  const die = draft.source[payment.index];
  if (die !== undefined) {
    die.used = true;
  }
}

function paymentIsPossible(
  state: GameState,
  payment: ManaPayment,
  poweredBy: ManaColor | "any_basic" | null,
): boolean {
  const player = state.players[0];
  if (player === undefined || poweredBy === null) {
    return false;
  }
  if (payment.kind === "crystal") {
    return matchingColor(payment.color, poweredBy) && player.crystals[payment.color] > 0;
  }
  if (payment.kind === "token") {
    return player.manaTokens.some(
      (token) => token.color === payment.color && matchingColor(token.color, poweredBy),
    );
  }
  const die = state.source[payment.index];
  return die !== undefined && !die.used && matchingColor(die.color, poweredBy);
}

// ---------------------------------------------------------------------------
// Map helpers
// ---------------------------------------------------------------------------

interface HexInfo {
  readonly hex: Hex;
  readonly terrain: string;
  readonly site: string | null;
}

function tileHexInfos(tile: PlacedTile, content: ContentBundle): HexInfo[] {
  const def = content.tiles[tile.tileId];
  if (def === undefined) {
    return [];
  }
  return def.hexes.map((hex) => ({
    hex: addHex(tile.origin, rotateHex({ q: hex.q, r: hex.r }, tile.rotation)),
    terrain: hex.terrain,
    site: hex.site,
  }));
}

function revealedHexSet(tiles: PlacedTile[], content: ContentBundle): Set<string> {
  const revealed = new Set<string>();
  for (const tile of tiles) {
    if (!tile.revealed) {
      continue;
    }
    for (const info of tileHexInfos(tile, content)) {
      revealed.add(hexKey(info.hex));
    }
  }
  return revealed;
}

function candidateSites(
  tiles: PlacedTile[],
  content: ContentBundle,
): { siteId: string; hex: Hex }[] {
  const scenario = content.scenario;
  const out: { siteId: string; hex: Hex }[] = [];
  for (const tile of tiles) {
    for (const info of tileHexInfos(tile, content)) {
      if (info.site !== undefined && info.site !== null) {
        out.push({ siteId: `site:${info.site}`, hex: info.hex });
      }
    }
  }
  if (scenario.site !== null) {
    out.push({ siteId: scenario.site.siteId, hex: scenario.site.hex });
  }
  for (const seedSite of scenario.siteSeeds ?? []) {
    out.push({ siteId: seedSite.siteId, hex: seedSite.hex });
  }
  if (scenario.city !== undefined && scenario.city !== null) {
    out.push({ siteId: scenario.city.siteId, hex: scenario.city.hex });
  }
  return out;
}

function sitesOnRevealedHexes(
  tiles: PlacedTile[],
  content: ContentBundle,
): { siteId: string; hex: Hex }[] {
  const revealed = revealedHexSet(tiles, content);
  return candidateSites(tiles, content).filter((site) => revealed.has(hexKey(site.hex)));
}

function seedSitesForRevealedTiles(draft: Draft, content: ContentBundle): void {
  const revealed = revealedHexSet(draft.map.tiles, content);
  const existing = new Set(
    draft.map.sites.map((site) => `${site.siteId as string}@${hexKey(site.hex)}`),
  );
  for (const site of candidateSites(draft.map.tiles, content)) {
    const key = `${site.siteId}@${hexKey(site.hex)}`;
    if (existing.has(key) || !revealed.has(hexKey(site.hex))) {
      continue;
    }
    draft.map.sites.push({ siteId: asSiteDefId(site.siteId), hex: site.hex });
    existing.add(key);
  }
}

function revealedHexes(state: GameState, content: ContentBundle): Map<string, HexInfo> {
  const map = new Map<string, HexInfo>();
  for (const tile of state.map.tiles) {
    if (!tile.revealed) {
      continue;
    }
    for (const info of tileHexInfos(tile, content)) {
      map.set(hexKey(info.hex), info);
    }
  }
  return map;
}

function terrainCost(state: GameState, content: ContentBundle, terrain: string): number | null {
  const entry = (
    content.rulesConstants.terrainMoveCost as Record<string, { day: number; night: number } | null>
  )[terrain];
  const base = entry === null || entry === undefined ? null : entry[state.timeOfDay];
  const modifier = state.turn.terrainModifier;
  if (modifier === undefined || (modifier.terrain !== "all" && modifier.terrain !== terrain)) {
    return base;
  }
  if (modifier.replace_cost !== undefined) {
    return modifier.replace_cost;
  }
  if (base === null) {
    return null;
  }
  return Math.max(modifier.minimum ?? 0, base + modifier.amount);
}

function reachableHexes(state: GameState, content: ContentBundle): Map<string, number> {
  const revealed = revealedHexes(state, content);
  const player = state.players[0];
  const costs = new Map<string, number>();
  if (player === undefined) {
    return costs;
  }
  const startKey = hexKey(player.position);
  if (!revealed.has(startKey)) {
    return costs;
  }
  costs.set(startKey, 0);
  const queue: Hex[] = [player.position];
  while (queue.length > 0) {
    const current = queue.shift() as Hex;
    const currentCost = costs.get(hexKey(current)) ?? 0;
    for (const neighbor of neighbors(current)) {
      const key = hexKey(neighbor);
      if (!revealed.has(key)) {
        continue;
      }
      const info = revealed.get(key);
      if (info === undefined) {
        continue;
      }
      const step = terrainCost(state, content, info.terrain);
      if (step === null) {
        continue;
      }
      const nextCost = currentCost + step;
      if (nextCost > state.turn.movePoints) {
        continue;
      }
      const existing = costs.get(key);
      if (existing === undefined || nextCost < existing) {
        costs.set(key, nextCost);
        queue.push(neighbor);
      }
    }
  }
  costs.delete(startKey);
  return costs;
}

function adjacentHiddenTile(state: GameState, content: ContentBundle): PlacedTile | undefined {
  const player = state.players[0];
  if (player === undefined) {
    return undefined;
  }
  const playerNeighbors = new Set(neighbors(player.position).map((hex) => hexKey(hex)));
  return state.map.tiles.find((tile) => {
    if (tile.revealed) {
      return false;
    }
    return tileHexInfos(tile, content).some((info) => playerNeighbors.has(hexKey(info.hex)));
  });
}

function canExplore(state: GameState, content: ContentBundle): boolean {
  if (state.turn.movePoints < content.rulesConstants.tileRevealCost) {
    return false;
  }
  return adjacentHiddenTile(state, content) !== undefined;
}

function siteAt(state: GameState, hex: Hex): { siteId: string; hex: Hex } | null {
  return state.map.sites.find((site) => hexesEqual(site.hex, hex)) ?? null;
}

function enemiesAt(state: GameState, hex: Hex): string[] {
  return state.map.enemies
    .filter((enemy) => enemy.alive && hexesEqual(enemy.hex, hex))
    .map((enemy) => enemy.instanceId);
}

// ---------------------------------------------------------------------------
// Legal actions
// ---------------------------------------------------------------------------

function actionEpoch(state: GameState): number {
  return state.actionEpoch;
}

function canRest(state: GameState, content: ContentBundle): boolean {
  const player = state.players[0];
  if (player === undefined) {
    return false;
  }
  return (
    player.hand.some(
      (instance) => !isWound(content, cardOf(content, state.cardInstances, instance)),
    ) ||
    player.hand.some((instance) => isWound(content, cardOf(content, state.cardInstances, instance)))
  );
}

function canEndTurn(state: GameState): boolean {
  // T1: ending your turn is always legal outside combat (02 §4.2); the round clock is
  // driven by the dummy player / deck depletion instead of the T0 one-turn-round shortcut.
  return state.pending === null && state.combat === null && !state.gameOver;
}

function combatLegality(state: GameState, content: ContentBundle): Action[] {
  const combat = state.combat;
  const player = state.players[0];
  if (combat === null || player === undefined) {
    return [];
  }
  const actions: Action[] = [];
  for (const instance of player.hand) {
    const def = cardOf(content, state.cardInstances, instance);
    if (isWound(content, def)) {
      continue;
    }
    if (effectApplicable(state, content, def.effects.basic)) {
      actions.push({ epoch: actionEpoch(state), type: "playCard", card: instance, mode: "basic" });
    }
    if (
      def.effects.powered !== null &&
      effectApplicable(state, content, def.effects.powered) &&
      pickMana(state, def.poweredBy) !== null
    ) {
      actions.push({
        epoch: actionEpoch(state),
        type: "playCard",
        card: instance,
        mode: "powered",
      });
    }
    if (combat.phase === "block") {
      actions.push({
        epoch: actionEpoch(state),
        type: "playCardSideways",
        card: instance,
        as: "block",
      });
    }
    if (combat.phase === "attack") {
      actions.push({
        epoch: actionEpoch(state),
        type: "playCardSideways",
        card: instance,
        as: "attack",
      });
    }
  }
  if (combat.phase === "assignDamage") {
    for (const pending of combat.pendingDamage) {
      actions.push({
        epoch: actionEpoch(state),
        type: "assignDamage",
        enemy: pending.enemyInstanceId,
      });
      const enemy = combat.enemies.find(
        (candidate) => candidate.instanceId === pending.enemyInstanceId,
      );
      const enemyDef = enemy === undefined ? undefined : enemyOf(content, enemy.defId);
      if (
        pending.amount > 0 &&
        enemyDef !== undefined &&
        !enemyDef.abilities.includes("assassination")
      ) {
        for (const unit of player.units) {
          if (unit.wounds === 0) {
            actions.push({
              epoch: actionEpoch(state),
              type: "assignDamage",
              enemy: pending.enemyInstanceId,
              unit: unit.instanceId,
            });
          }
        }
      }
    }
  }
  if (combat.phase === "attack") {
    for (const enemy of combat.enemies) {
      if (!enemy.defeated) {
        const def = enemyOf(content, enemy.defId);
        const total = totalAttackAgainst(combat.attackPool, def);
        if (total >= def.armor) {
          actions.push({
            epoch: actionEpoch(state),
            type: "assignAttack",
            enemy: enemy.instanceId,
          });
        }
      }
    }
  }
  if (!(combat.phase === "assignDamage" && combat.pendingDamage.length > 0)) {
    actions.push({ epoch: actionEpoch(state), type: "endCombatPhase" });
  }
  return actions;
}

export function getLegalActions(state: GameState, content: ContentBundle): LegalActionSet {
  const player = state.players[0];
  const epoch = actionEpoch(state);
  if (player === undefined || state.gameOver) {
    return { epoch, player: asPlayerId("p1"), actions: [] };
  }
  if (state.tacticChoice !== null) {
    return {
      epoch,
      player: player.id,
      actions: state.tacticChoice.options.map((tactic) => ({
        epoch,
        type: "chooseTactic",
        tactic,
      })),
    };
  }
  if (state.pending !== null) {
    const actions: Action[] = [];
    if (state.pending.kind === "effectChoice") {
      state.pending.effectOptions.forEach((_option, index) => {
        actions.push({
          epoch,
          type: "resolveChoice",
          choiceId: state.pending?.choiceId ?? "",
          optionIndex: index,
        });
      });
    } else {
      state.pending.eligibleCards.forEach((card, index) => {
        actions.push({
          epoch,
          type: "resolveChoice",
          choiceId: state.pending?.choiceId ?? "",
          optionIndex: index,
        });
      });
    }
    return { epoch, player: player.id, actions };
  }
  if (state.combat !== null) {
    return { epoch, player: player.id, actions: combatLegality(state, content) };
  }
  if (state.turn.rested) {
    const actions: Action[] = [];
    if (canEndTurn(state)) {
      actions.push({ epoch, type: "endTurn" });
    }
    return { epoch, player: player.id, actions };
  }
  const actions: Action[] = [];
  for (const instance of player.hand) {
    const def = cardOf(content, state.cardInstances, instance);
    if (isWound(content, def)) {
      continue;
    }
    if (effectApplicable(state, content, def.effects.basic)) {
      actions.push({ epoch, type: "playCard", card: instance, mode: "basic" });
    }
    if (
      def.effects.powered !== null &&
      effectApplicable(state, content, def.effects.powered) &&
      pickMana(state, def.poweredBy) !== null
    ) {
      actions.push({ epoch, type: "playCard", card: instance, mode: "powered" });
    }
    actions.push({ epoch, type: "playCardSideways", card: instance, as: "move" });
    actions.push({ epoch, type: "playCardSideways", card: instance, as: "influence" });
  }

  // End-of-turn step 7 pre-draw discard (02 §15.1): any non-Wound card can be discarded.
  for (const instance of player.hand) {
    if (!isWound(content, cardOf(content, state.cardInstances, instance))) {
      actions.push({ epoch, type: "discardCard", card: instance });
    }
  }

  for (const [key, cost] of reachableHexes(state, content)) {
    const [qText, rText] = key.split(",");
    if (cost <= state.turn.movePoints) {
      actions.push({ epoch, type: "moveTo", target: { q: Number(qText), r: Number(rText) } });
    }
  }
  if (canExplore(state, content)) {
    actions.push({ epoch, type: "explore" });
  }
  if (
    enemiesAt(state, player.position).length > 0 &&
    state.turn.flags[`fought:${hexKey(player.position)}`] !== true
  ) {
    actions.push({ epoch, type: "challengeRampaging" });
  }
  const site = siteAt(state, player.position);
  const siteDef = site === null ? undefined : content.sites[site.siteId];
  if (
    siteDef !== undefined &&
    state.turn.flags[`enteredSite:${hexKey(player.position)}`] !== true
  ) {
    actions.push({ epoch, type: "enterSite" });
  }
  if (
    siteDef !== undefined &&
    siteDef.healing !== null &&
    state.turn.flags[`enteredSite:${hexKey(player.position)}`] === true
  ) {
    const wounds = player.hand.filter((instance) =>
      isWound(content, cardOf(content, state.cardInstances, instance)),
    ).length;
    const affordable = Math.floor(state.turn.influence / siteDef.healing.influencePerPoint);
    const points = Math.min(wounds, affordable);
    if (points >= 1) {
      actions.push({ epoch, type: "buyHealing", points });
    }
    for (const unit of player.units) {
      const unitDef = content.units?.[unit.defId];
      if (
        unit.wounds > 0 &&
        unitDef !== undefined &&
        unitDef.level * siteDef.healing.influencePerPoint <= state.turn.influence
      ) {
        actions.push({ epoch, type: "healUnit", unit: unit.instanceId });
      }
    }
  }
  const enteredSite =
    siteDef !== undefined && state.turn.flags[`enteredSite:${hexKey(player.position)}`] === true;
  if (enteredSite && siteDef.siteKind === "monastery" && state.offers.aa.length > 0) {
    const cost = content.rulesConstants.monasteryAaCost ?? 6;
    if (state.turn.influence >= cost) {
      state.offers.aa.forEach((_offer, index) => {
        actions.push({ epoch, type: "buyAdvancedAction", index });
      });
    }
  }
  if (enteredSite && siteDef.siteKind === "mage_tower" && state.offers.spell.length > 0) {
    const cost = content.rulesConstants.spellCost ?? 7;
    if (state.turn.influence >= cost) {
      state.offers.spell.forEach((defId, index) => {
        const spellDef = content.cards[defId];
        if (spellDef !== undefined && pickMana(state, spellDef.color as ManaColor) !== null) {
          actions.push({ epoch, type: "buySpell", index });
        }
      });
    }
  }
  if (
    siteDef !== undefined &&
    siteDef.siteKind === "special" &&
    siteDef.id === "site:magical_glade" &&
    player.hand.some((instance) => isWound(content, cardOf(content, state.cardInstances, instance)))
  ) {
    actions.push({ epoch, type: "discardGladeWound" });
  }
  for (const skill of player.skills) {
    const def = content.skills?.[skill];
    if (def === undefined || def.effect === null) {
      continue;
    }
    const usage = def.usageType === "once_per_round" ? "round" : "turn";
    if (state.skillUsage[usage].includes(skill)) {
      continue;
    }
    if (effectApplicable(state, content, def.effect)) {
      actions.push({ epoch, type: "useSkill", skill });
    }
  }
  // Units: recruit at any entered inhabited site; activate a ready unit's implemented abilities.
  const unitOffer = state.offers.unit;
  if (enteredSite && siteDef.inhabited && unitOffer.length > 0) {
    const slots = commandSlots(content, player.level);
    if (player.units.length < slots) {
      unitOffer.forEach((unitId, index) => {
        const unitDef = content.units?.[unitId];
        if (unitDef !== undefined && state.turn.influence >= unitDef.influenceCost) {
          actions.push({ epoch, type: "recruitUnit", index });
        }
      });
    }
  }
  for (const unit of player.units) {
    const unitDef = content.units?.[unit.defId];
    if (!unit.ready || unit.wounds > 0 || unitDef === undefined) {
      continue;
    }
    unitDef.abilities.forEach((ability, abilityIndex) => {
      if (ability.effect === null) {
        return;
      }
      if (ability.manaCost !== null && pickMana(state, ability.manaCost) === null) {
        return;
      }
      if (ability.effect !== null && effectApplicable(state, content, ability.effect)) {
        actions.push({ epoch, type: "activateUnit", unit: unit.instanceId, ability: abilityIndex });
      }
    });
  }
  if (canRest(state, content)) {
    const wounds = player.hand.filter((instance) =>
      isWound(content, cardOf(content, state.cardInstances, instance)),
    );
    const nonWounds = player.hand.filter(
      (instance) => !isWound(content, cardOf(content, state.cardInstances, instance)),
    );
    for (const nonWound of nonWounds) {
      actions.push({ epoch, type: "rest", kind: "standard", discard: [nonWound, ...wounds] });
    }
    for (const wound of wounds) {
      actions.push({ epoch, type: "rest", kind: "slowRecovery", discard: [wound] });
    }
  }
  if (canEndTurn(state)) {
    actions.push({ epoch, type: "endTurn" });
  }
  return { epoch, player: player.id, actions };
}

// ---------------------------------------------------------------------------
// Apply
// ---------------------------------------------------------------------------

function isSameAction(a: Action, b: Action): boolean {
  if (a.type !== b.type) {
    return false;
  }
  if (a.type === "playCard" && b.type === "playCard") {
    return a.card === b.card && a.mode === b.mode;
  }
  return JSON.stringify(a) === JSON.stringify(b);
}

export function applyAction(
  state: GameState,
  action: Action,
  content: ContentBundle,
): ApplyOutcome {
  if (action.epoch !== state.actionEpoch) {
    return {
      ok: false,
      error: { code: "staleEpoch", expected: state.actionEpoch, got: action.epoch },
    };
  }
  const legal = getLegalActions(state, content);
  if (!legal.actions.some((candidate) => isSameAction(candidate, action))) {
    return { ok: false, error: { code: "notLegal", reason: `illegal ${action.type}`, action } };
  }
  const draft = cloneState(state);
  const events: GameEvent[] = [];
  const env: Env = { content, events };
  try {
    dispatch(draft, action, env);
  } catch (error) {
    return {
      ok: false,
      error: {
        code: "invalidState",
        message: error instanceof Error ? error.message : String(error),
      },
    };
  }
  draft.actionEpoch += 1;
  const frozen = deepFreeze(draft) as unknown as GameState;
  return {
    ok: true,
    result: {
      state: frozen,
      events,
      legalActions: getLegalActions(frozen, content),
      stateHash: hashState(frozen),
    },
  };
}

function dispatch(draft: Draft, action: Action, env: Env): void {
  const { content } = env;
  const player = draft.players[0];
  if (player === undefined) {
    throw new Error("no player");
  }
  switch (action.type) {
    case "chooseTactic":
      chooseTactic(draft, env, action.tactic);
      return;
    case "playCard":
      playCard(draft, action.card, action.mode, action.mana, env);
      return;
    case "discardCard": {
      const index = player.hand.indexOf(action.card);
      if (index < 0) {
        throw new Error("card not in hand");
      }
      if (isWound(content, cardOf(content, draft.cardInstances, action.card))) {
        throw new Error("wounds cannot be discarded this way");
      }
      player.hand.splice(index, 1);
      player.discard.push(action.card);
      draft.turn.playedOrDiscarded = true;
      env.events.push({ type: "cardDiscarded", card: action.card });
      return;
    }
    case "playCardSideways":
      playCardSideways(draft, action.card, action.as, env);
      return;
    case "resolveChoice":
      resolveChoice(draft, action.choiceId, action.optionIndex, env);
      return;
    case "rest":
      rest(draft, action.kind, action.discard, env);
      return;
    case "moveTo": {
      const costs = reachableHexes(draft, content);
      const cost = costs.get(hexKey(action.target));
      if (cost === undefined) {
        throw new Error("target not reachable");
      }
      const from = player.position;
      player.position = action.target;
      draft.turn.movePoints -= cost;
      env.events.push({ type: "heroMoved", from, to: action.target, cost });
      return;
    }
    case "explore": {
      const hidden = adjacentHiddenTile(draft, content);
      if (hidden === undefined) {
        throw new Error("nothing to reveal");
      }
      hidden.revealed = true;
      draft.turn.movePoints -= content.rulesConstants.tileRevealCost;
      env.events.push({ type: "tileRevealed", tile: hidden.tileId, origin: hidden.origin });
      seedSitesForRevealedTiles(draft, content);
      seedEnemiesForRevealedTiles(draft, content, env.events);
      return;
    }
    case "enterSite": {
      const site = siteAt(draft, player.position);
      if (site === null) {
        throw new Error("no site here");
      }
      draft.turn.flags[`enteredSite:${hexKey(player.position)}`] = true;
      // Reputation modifies the Influence generated during this interaction, once (02 §13).
      if (draft.turn.flags["interactionReputation"] !== true && player.reputation !== 0) {
        draft.turn.flags["interactionReputation"] = true;
        const before = draft.turn.influence;
        draft.turn.influence = Math.max(0, before + player.reputation);
        env.events.push({ type: "influenceGained", amount: draft.turn.influence - before });
      }
      env.events.push({ type: "siteEntered", site: asSiteDefId(site.siteId) });
      return;
    }
    case "buyHealing": {
      const site = siteAt(draft, player.position);
      const def = site === null ? undefined : content.sites[site.siteId];
      if (def === undefined || def.healing === null) {
        throw new Error("no healing here");
      }
      const cost = action.points * def.healing.influencePerPoint;
      draft.turn.influence -= cost;
      draft.turn.flags["healed"] = true;
      let healed = 0;
      for (let i = player.hand.length - 1; i >= 0 && healed < action.points; i -= 1) {
        const instance = player.hand[i];
        if (
          instance !== undefined &&
          isWound(content, cardOf(content, draft.cardInstances, instance))
        ) {
          player.hand.splice(i, 1);
          healed += 1;
        }
      }
      env.events.push({ type: "influenceSpent", amount: cost });
      env.events.push({ type: "healGained", points: healed });
      return;
    }
    case "buyAdvancedAction": {
      const site = siteAt(draft, player.position);
      const def = site === null ? undefined : content.sites[site.siteId];
      const cost = content.rulesConstants.monasteryAaCost ?? 6;
      if (def?.siteKind !== "monastery") {
        throw new Error("monastery purchase needs a monastery");
      }
      if (draft.turn.flags[`enteredSite:${hexKey(player.position)}`] !== true) {
        throw new Error("interact first");
      }
      const defId = draft.offers.aa[action.index];
      if (defId === undefined) {
        throw new Error("no such offer");
      }
      if (draft.turn.influence < cost) {
        throw new Error("not enough influence");
      }
      draft.turn.influence -= cost;
      draft.offers.aa.splice(action.index, 1);
      const next = draft.offerDecks.aa.shift();
      if (next !== undefined) {
        draft.offers.aa.push(next);
      }
      const instance = asCardInstanceId(`p1:gained:${draft.turn.number}:${draft.actionEpoch}`);
      draft.cardInstances[instance] = defId;
      player.deck.unshift(instance);
      env.events.push({ type: "influenceSpent", amount: cost });
      env.events.push({ type: "cardGained", card: instance, defId, source: "monastery" });
      return;
    }
    case "buySpell": {
      const site = siteAt(draft, player.position);
      const def = site === null ? undefined : content.sites[site.siteId];
      const cost = content.rulesConstants.spellCost ?? 7;
      if (def?.siteKind !== "mage_tower") {
        throw new Error("spell purchase needs a tower site");
      }
      if (draft.turn.flags[`enteredSite:${hexKey(player.position)}`] !== true) {
        throw new Error("interact first");
      }
      const defId = draft.offers.spell[action.index];
      const cardDef = defId === undefined ? undefined : content.cards[defId];
      if (defId === undefined || cardDef === undefined) {
        throw new Error("no such offer");
      }
      if (draft.turn.influence < cost) {
        throw new Error("not enough influence");
      }
      const payment = action.mana ?? pickMana(draft, cardDef.color as ManaColor);
      if (payment === null || !paymentIsPossible(draft, payment, cardDef.color as ManaColor)) {
        throw new Error("spell mana not available");
      }
      applyManaPayment(draft, payment);
      draft.turn.influence -= cost;
      draft.offers.spell.splice(action.index, 1);
      const next = draft.offerDecks.spell.shift();
      if (next !== undefined) {
        draft.offers.spell.push(next);
      }
      const instance = asCardInstanceId(`p1:gained:${draft.turn.number}:${draft.actionEpoch}`);
      draft.cardInstances[instance] = defId;
      player.deck.unshift(instance);
      env.events.push({ type: "influenceSpent", amount: cost });
      env.events.push({ type: "cardGained", card: instance, defId, source: "mage_tower" });
      return;
    }
    case "discardGladeWound": {
      const site = siteAt(draft, player.position);
      if (site?.siteId !== "site:magical_glade") {
        throw new Error("not on a magical glade");
      }
      const index = player.hand.findIndex((instance) =>
        isWound(content, cardOf(content, draft.cardInstances, instance)),
      );
      if (index < 0) {
        throw new Error("no wound to discard");
      }
      player.hand.splice(index, 1);
      env.events.push({ type: "woundDiscarded", count: 1 });
      return;
    }
    case "recruitUnit": {
      const site = siteAt(draft, player.position);
      const siteDef = site === null ? undefined : content.sites[site.siteId];
      if (
        siteDef === undefined ||
        !siteDef.inhabited ||
        draft.turn.flags[`enteredSite:${hexKey(player.position)}`] !== true
      ) {
        throw new Error("recruit needs an entered inhabited site");
      }
      const unitId = draft.offers.unit[action.index];
      const unitDef = unitId === undefined ? undefined : content.units?.[unitId];
      if (unitId === undefined || unitDef === undefined) {
        throw new Error("no such unit offer");
      }
      if (player.units.length >= commandSlots(content, player.level)) {
        throw new Error("no free command slot");
      }
      if (draft.turn.influence < unitDef.influenceCost) {
        throw new Error("not enough influence");
      }
      draft.turn.influence -= unitDef.influenceCost;
      draft.offers.unit.splice(action.index, 1);
      const instance = asUnitInstanceId(`p1:unit:${draft.actionEpoch}:${unitId}`);
      player.units.push({ instanceId: instance, defId: unitId, ready: true, wounds: 0 });
      env.events.push({ type: "influenceSpent", amount: unitDef.influenceCost });
      env.events.push({ type: "unitRecruited", unit: instance, defId: unitId });
      return;
    }
    case "activateUnit": {
      const unit = player.units.find((candidate) => candidate.instanceId === action.unit);
      const unitDef = unit === undefined ? undefined : content.units?.[unit.defId];
      if (unit === undefined || unitDef === undefined) {
        throw new Error("no such unit");
      }
      if (!unit.ready) {
        throw new Error("unit is spent");
      }
      const ability = unitDef.abilities[action.ability];
      if (ability === undefined || ability.effect === null) {
        throw new Error("ability not implemented");
      }
      if (ability.manaCost !== null) {
        const payment = action.mana ?? pickMana(draft, ability.manaCost);
        if (payment === null || !paymentIsPossible(draft, payment, ability.manaCost)) {
          throw new Error("unit mana not available");
        }
        applyManaPayment(draft, payment);
      }
      unit.ready = false;
      env.events.push({ type: "unitActivated", unit: unit.instanceId, ability: action.ability });
      applyEffect(draft, env, ability.effect);
      return;
    }
    case "challengeRampaging": {
      const enemyIds = enemiesAt(draft, player.position);
      if (enemyIds.length === 0) {
        throw new Error("no enemies here");
      }
      // One combat per space per turn (02 §11); a failed assault waits for the next turn.
      draft.turn.flags[`fought:${hexKey(player.position)}`] = true;
      draft.combat = {
        phase: "rangedSiege",
        enemies: enemyIds.map((instanceId) => ({
          instanceId: asEnemyInstanceId(instanceId),
          defId: draft.map.enemies.find((enemy) => enemy.instanceId === instanceId)?.defId ?? "",
          blocked: false,
          defeated: false,
        })),
        attackPool: [],
        blockPool: [],
        pendingDamage: [],
      };
      const assaultsCity = draft.map.enemies.some(
        (enemy) => enemyIds.includes(enemy.instanceId) && enemy.kind === "city",
      );
      if (assaultsCity) {
        player.reputation -= 1;
        env.events.push({ type: "reputationChanged", amount: -1 });
      }
      env.events.push({
        type: "combatStarted",
        enemies: enemyIds.map((id) => asEnemyInstanceId(id)),
      });
      return;
    }
    case "endCombatPhase":
      advanceCombat(draft, env);
      return;
    case "assignDamage":
      assignDamage(draft, action.enemy, env, action.unit);
      return;
    case "healUnit": {
      const site = siteAt(draft, player.position);
      const def = site === null ? undefined : content.sites[site.siteId];
      if (def === undefined || def.healing === null) {
        throw new Error("no healing here");
      }
      if (draft.turn.flags[`enteredSite:${hexKey(player.position)}`] !== true) {
        throw new Error("interact first");
      }
      const unit = player.units.find((candidate) => candidate.instanceId === action.unit);
      const unitDef = unit === undefined ? undefined : content.units?.[unit.defId];
      if (unit === undefined || unitDef === undefined || unit.wounds <= 0) {
        throw new Error("no wounded unit");
      }
      const cost = unitDef.level * def.healing.influencePerPoint;
      if (draft.turn.influence < cost) {
        throw new Error("not enough influence");
      }
      draft.turn.influence -= cost;
      draft.turn.flags["healed"] = true;
      unit.wounds -= 1;
      env.events.push({ type: "influenceSpent", amount: cost });
      env.events.push({ type: "unitHealed", unit: unit.instanceId, wounds: unit.wounds });
      return;
    }
    case "assignAttack":
      assignAttack(draft, action.enemy, env);
      return;
    case "useSkill": {
      const def = env.content.skills?.[action.skill];
      if (def === undefined || def.effect === null) {
        throw new Error("skill not implemented");
      }
      if (!player.skills.includes(action.skill)) {
        throw new Error("skill not gained");
      }
      const usage = def.usageType === "once_per_round" ? "round" : "turn";
      if (draft.skillUsage[usage].includes(action.skill)) {
        throw new Error("skill already used");
      }
      draft.skillUsage[usage].push(action.skill);
      env.events.push({ type: "skillUsed", skill: action.skill });
      applyEffect(draft, env, def.effect);
      return;
    }
    case "endTurn":
      endTurn(draft, env);
      return;
  }
}

function playCard(
  draft: Draft,
  card: CardInstanceId,
  mode: "basic" | "powered",
  mana: ManaPayment | undefined,
  env: Env,
): void {
  const { content } = env;
  const player = draft.players[0];
  if (player === undefined) {
    return;
  }
  const def = cardOf(content, draft.cardInstances, card);
  if (isWound(content, def)) {
    throw new Error("wounds are not playable");
  }
  const index = player.hand.indexOf(card);
  if (index < 0) {
    throw new Error("card not in hand");
  }
  if (mode === "powered") {
    const payment = mana ?? pickMana(draft, def.poweredBy);
    if (payment === null || !paymentIsPossible(draft, payment, def.poweredBy)) {
      throw new Error("mana not available");
    }
    applyManaPayment(draft, payment);
  }
  player.hand.splice(index, 1);
  player.playArea.push(card);
  draft.turn.cardsPlayed += 1;
  draft.turn.playedOrDiscarded = true;
  env.events.push({ type: "cardPlayed", card, defId: def.id as never, mode });
  const effect = mode === "basic" ? def.effects.basic : def.effects.powered;
  if (effect !== null) {
    applyEffect(draft, env, effect);
  }
}

function playCardSideways(
  draft: Draft,
  card: CardInstanceId,
  as: "move" | "influence" | "attack" | "block",
  env: Env,
): void {
  const { content } = env;
  const player = draft.players[0];
  if (player === undefined) {
    return;
  }
  const def = cardOf(content, draft.cardInstances, card);
  if (isWound(content, def)) {
    throw new Error("wounds cannot be played sideways");
  }
  const index = player.hand.indexOf(card);
  if (index < 0) {
    throw new Error("card not in hand");
  }
  player.hand.splice(index, 1);
  player.playArea.push(card);
  draft.turn.cardsPlayed += 1;
  draft.turn.playedOrDiscarded = true;
  env.events.push({ type: "cardPlayed", card, defId: def.id as never, mode: "sideways" });
  if (as === "move") {
    draft.turn.movePoints += def.sidewaysValue;
    env.events.push({ type: "movePointsGained", amount: def.sidewaysValue });
    return;
  }
  if (as === "influence") {
    draft.turn.influence += def.sidewaysValue;
    env.events.push({ type: "influenceGained", amount: def.sidewaysValue });
    return;
  }
  if (as === "block") {
    draft.combat?.blockPool.push({ amount: def.sidewaysValue, element: "physical" });
    return;
  }
  draft.combat?.attackPool.push({
    amount: def.sidewaysValue,
    element: "physical",
    combatType: "melee",
  });
}

function resolveChoice(draft: Draft, choiceId: string, optionIndex: number, env: Env): void {
  const pending = draft.pending;
  if (pending === null || pending.choiceId !== choiceId) {
    throw new Error("choice mismatch");
  }
  const player = draft.players[0];
  if (player === undefined) {
    return;
  }
  if (pending.kind === "effectChoice") {
    const option = pending.effectOptions[optionIndex];
    if (option === undefined) {
      throw new Error("bad option");
    }
    draft.pending = null;
    env.events.push({ type: "choiceResolved", choiceId, optionIndex });
    applyEffect(draft, env, option);
    return;
  }
  const card = pending.eligibleCards[optionIndex];
  if (card === undefined) {
    throw new Error("bad discard choice");
  }
  const index = player.hand.indexOf(card);
  if (index < 0) {
    throw new Error("card not in hand");
  }
  player.hand.splice(index, 1);
  player.discard.push(card);
  draft.turn.playedOrDiscarded = true;
  draft.pending = null;
  env.events.push({ type: "choiceResolved", choiceId, optionIndex });
  if (pending.thenEffect !== null) {
    applyEffect(draft, env, pending.thenEffect);
  }
}

function rest(
  draft: Draft,
  kind: "standard" | "slowRecovery",
  discard: readonly CardInstanceId[],
  env: Env,
): void {
  const player = draft.players[0];
  if (player === undefined) {
    return;
  }
  if (kind === "standard") {
    const nonWounds = discard.filter(
      (instance) => !isWound(env.content, cardOf(env.content, draft.cardInstances, instance)),
    );
    const wounds = discard.filter((instance) =>
      isWound(env.content, cardOf(env.content, draft.cardInstances, instance)),
    );
    if (nonWounds.length !== 1 || wounds.length !== discard.length - 1) {
      throw new Error("standard rest discards one non-wound card plus only wounds");
    }
  } else if (discard.length !== 1) {
    throw new Error("slow recovery discards exactly one wound");
  }
  for (const instance of discard) {
    const index = player.hand.indexOf(instance);
    if (index < 0) {
      throw new Error("card not in hand");
    }
    player.hand.splice(index, 1);
    player.discard.push(instance);
  }
  draft.turn.playedOrDiscarded = true;
  draft.turn.rested = true;
  draft.turn.step = "end";
  env.events.push({ type: "rested", kind });
}

function advanceCombat(draft: Draft, env: Env): void {
  const combat = draft.combat;
  if (combat === null) {
    return;
  }
  const { content } = env;
  if (combat.phase === "rangedSiege") {
    combat.phase = "block";
    return;
  }
  if (combat.phase === "block") {
    const pendingDamage: { enemyInstanceId: string; amount: number }[] = [];
    for (const enemy of combat.enemies) {
      if (enemy.defeated) {
        continue;
      }
      const def = enemyOf(content, enemy.defId);
      if (isBlocked(def, combat.blockPool)) {
        enemy.blocked = true;
        env.events.push({ type: "enemyBlocked", enemy: enemy.instanceId });
      } else {
        pendingDamage.push({ enemyInstanceId: enemy.instanceId, amount: enemyDamage(def) });
      }
    }
    if (pendingDamage.length === 0) {
      combat.phase = "attack";
    } else {
      combat.pendingDamage = pendingDamage as never;
      combat.phase = "assignDamage";
    }
    return;
  }
  if (combat.phase === "assignDamage") {
    if (combat.pendingDamage.length > 0) {
      return;
    }
    combat.phase = "attack";
    return;
  }
  draft.combat = null;
  env.events.push({ type: "combatEnded" });
  resolveCityConquest(draft, env);
}

function assignDamage(
  draft: Draft,
  enemy: EnemyInstanceId,
  env: Env,
  unitInstanceId?: UnitInstanceId,
): void {
  const combat = draft.combat;
  if (combat === null) {
    return;
  }
  const index = combat.pendingDamage.findIndex((entry) => entry.enemyInstanceId === enemy);
  const entry = index >= 0 ? combat.pendingDamage[index] : undefined;
  if (entry === undefined) {
    throw new Error("nothing to assign");
  }
  const player = draft.players[0];
  if (player === undefined) {
    return;
  }
  if (unitInstanceId !== undefined) {
    const unit = player.units.find((candidate) => candidate.instanceId === unitInstanceId);
    const unitDef = unit === undefined ? undefined : env.content.units?.[unit.defId];
    const enemyInstance = combat.enemies.find(
      (candidate) => candidate.instanceId === entry.enemyInstanceId,
    );
    const enemyDef =
      enemyInstance === undefined ? undefined : enemyOf(env.content, enemyInstance.defId);
    if (unit === undefined || unitDef === undefined) {
      throw new Error("no such unit");
    }
    if (unit.wounds > 0) {
      throw new Error("unit already wounded");
    }
    if (enemyDef === undefined) {
      throw new Error("no such enemy");
    }
    const poison = enemyDef.abilities.includes("poison");
    const paralyze = enemyDef.abilities.includes("paralyze");
    const woundsPlaced = poison ? 2 : 1;
    if (paralyze) {
      player.units = player.units.filter((candidate) => candidate.instanceId !== unitInstanceId);
      env.events.push({ type: "unitDestroyed", unit: unitInstanceId });
    } else {
      unit.wounds = Math.min(2, unit.wounds + woundsPlaced);
      env.events.push({ type: "unitWounded", unit: unitInstanceId, wounds: unit.wounds });
    }
    const remaining = Math.max(0, entry.amount - unitDef.armor);
    entry.amount = remaining;
    env.events.push({ type: "damageAssigned", enemy, wounds: woundsPlaced });
    if (remaining <= 0) {
      combat.pendingDamage.splice(index, 1);
    }
    if (combat.pendingDamage.length === 0) {
      combat.phase = "attack";
    }
    return;
  }
  const wounds = woundsFromDamage(entry.amount, heroArmor(env.content, player.level));
  for (let i = 0; i < wounds; i += 1) {
    const instance = nextWoundInstance(draft, env);
    player.hand.push(instance);
  }
  combat.pendingDamage.splice(index, 1);
  env.events.push({ type: "damageAssigned", enemy, wounds });
  if (wounds > 0) {
    env.events.push({ type: "woundGained", amount: wounds });
  }
  if (combat.pendingDamage.length === 0) {
    combat.phase = "attack";
  }
}

function assignAttack(draft: Draft, enemy: EnemyInstanceId, env: Env): void {
  const combat = draft.combat;
  if (combat === null) {
    return;
  }
  const target = combat.enemies.find(
    (candidate) => candidate.instanceId === enemy && !candidate.defeated,
  );
  if (target === undefined) {
    throw new Error("enemy not active");
  }
  const def = enemyOf(env.content, target.defId);
  const total = totalAttackAgainst(combat.attackPool, def);
  if (total < def.armor) {
    throw new Error("not enough attack");
  }
  target.defeated = true;
  const player = draft.players[0];
  if (player !== undefined) {
    player.fame += def.fame;
    const mapEnemy = draft.map.enemies.find((candidate) => candidate.instanceId === enemy);
    if (mapEnemy?.kind === "rampaging") {
      const reputation = def.color === "green" ? 1 : def.color === "brown" ? 2 : 0;
      if (reputation > 0) {
        player.reputation += reputation;
        env.events.push({ type: "reputationChanged", amount: reputation });
      }
    }
  }
  let remaining = def.armor;
  const kept = [];
  for (const contribution of combat.attackPool) {
    const effective = attackValueAfterResistance(contribution, def);
    if (remaining > 0) {
      remaining -= effective;
      continue;
    }
    kept.push(contribution);
  }
  combat.attackPool = kept as never;
  const mapEnemy = draft.map.enemies.find((candidate) => candidate.instanceId === enemy);
  if (mapEnemy !== undefined) {
    mapEnemy.alive = false;
  }
  env.events.push({ type: "enemyDefeated", enemy, fame: def.fame });
  if (combat.enemies.every((candidate) => candidate.defeated)) {
    draft.combat = null;
    env.events.push({ type: "combatEnded" });
    resolveCityConquest(draft, env);
  }
}

/** If the last city soldier has fallen, the scenario is won (T1 scoring: fame + city fame). */
function resolveCityConquest(draft: Draft, env: Env): void {
  const city = env.content.scenario.city ?? null;
  if (city === null || draft.gameOver) {
    return;
  }
  const site = draft.map.sites.find(
    (candidate) =>
      (candidate.siteId as string) === city.siteId && hexesEqual(candidate.hex, city.hex),
  );
  if (site === undefined || site.conquered === true) {
    return;
  }
  const garrison = draft.map.enemies.filter(
    (enemy) => enemy.kind === "city" && hexesEqual(enemy.hex, city.hex),
  );
  if (garrison.length === 0 || garrison.some((enemy) => enemy.alive)) {
    return;
  }
  site.conquered = true;
  const player = draft.players[0];
  const bonus = city.fame ?? 10;
  const score = (player?.fame ?? 0) + bonus;
  draft.gameOver = true;
  draft.result = {
    outcome: "victory",
    score,
    cityConquered: true,
    reason: "city_conquered",
  };
  env.events.push({ type: "cityConquered", site: asSiteDefId(city.siteId), score });
  env.events.push({ type: "gameEnded", round: draft.round, outcome: "victory", score });
}

function emptyTurn(number: number, handWasEmptyAtStart: boolean): TurnState {
  return {
    number,
    step: "movement",
    movePoints: 0,
    influence: 0,
    cardsPlayed: 0,
    playedOrDiscarded: false,
    rested: false,
    handWasEmptyAtStart,
    extraSourceDie: false,
    cardBoost: 0,
    flags: {},
  };
}

/** T1 tactics step: the human picks first, then the dummy takes one of the rest at random. */
function chooseTactic(draft: Draft, env: Env, tactic: string): void {
  const choice = draft.tacticChoice;
  if (choice === null || !choice.options.includes(tactic)) {
    throw new Error("tactic not offered");
  }
  draft.tactics.human = tactic;
  env.events.push({ type: "tacticChosen", tactic, player: "human" });
  const remaining = choice.options.filter((option) => option !== tactic);
  if (draft.dummy !== null && remaining.length > 0) {
    const [value, next] = nextU32(draft.rng, "scenario");
    draft.rng = next;
    const parked = remaining[value % remaining.length];
    if (parked !== undefined) {
      draft.tactics.dummy = parked;
      env.events.push({ type: "tacticChosen", tactic: parked, player: "dummy" });
    }
  }
  draft.tacticChoice = null;
  env.events.push({ type: "turnStarted", player: asPlayerId("p1") });
  checkHeroDeckEmpty(draft, env);
}

/** Rules 02 §4.1.2: with an empty deck and hand the hero must announce End of Round. */
function checkHeroDeckEmpty(draft: Draft, env: Env): void {
  const player = draft.players[0];
  if (player === undefined || draft.endOfRoundAnnounced) {
    return;
  }
  if (player.deck.length === 0 && player.hand.length === 0) {
    draft.endOfRoundAnnounced = true;
    env.events.push({ type: "endOfRoundAnnounced", by: "hero" });
    finishRound(draft, env);
  }
}

function startHumanTurn(draft: Draft, env: Env): void {
  const player = draft.players[0];
  if (player === undefined) {
    return;
  }
  draft.skillUsage.turn = [];
  draft.turn = emptyTurn(draft.turn.number + 1, player.hand.length === 0);
  draft.combat = null;
  env.events.push({ type: "turnStarted", player: asPlayerId("p1") });
  checkHeroDeckEmpty(draft, env);
}

/** Simplified solo dummy (11-mvp-scope §4; full logic in the Classic preset later). */
function dummyTurn(draft: Draft, env: Env): void {
  const dummy = draft.dummy;
  if (dummy === null) {
    return;
  }
  if (dummy.cardsRemaining <= 0) {
    draft.endOfRoundAnnounced = true;
    env.events.push({ type: "endOfRoundAnnounced", by: "dummy" });
    return;
  }
  const flipped = Math.min(dummy.cardsPerTurn, dummy.cardsRemaining);
  dummy.cardsRemaining -= flipped;
  env.events.push({ type: "dummyFlipped", count: flipped, remaining: dummy.cardsRemaining });
  if (dummy.cardsRemaining === 0) {
    draft.endOfRoundAnnounced = true;
    env.events.push({ type: "endOfRoundAnnounced", by: "dummy" });
  }
}

/** End of round → prepare the next round (02 §3.1) or finish the scenario with a defeat. */
function finishRound(draft: Draft, env: Env): void {
  const { content } = env;
  const scenario = content.scenario;
  const player = draft.players[0];
  if (player === undefined) {
    return;
  }
  draft.endOfRoundAnnounced = false;
  const tacticRules = scenario.tacticRules;
  if (tacticRules?.usedTacticsRemovedEachRound !== false) {
    for (const pick of [draft.tactics.human, draft.tactics.dummy]) {
      if (pick !== null && !draft.tactics.used.includes(pick)) {
        draft.tactics.used.push(pick);
      }
    }
  }
  // Every hand card (including Wounds), the discard pile and the deck are shuffled into a new
  // deed deck, then a fresh hand is drawn (02 §3.4 / §15.2).
  const shuffled = shuffleWithRng([...player.deck, ...player.discard, ...player.hand], draft.rng);
  draft.rng = shuffled.rng;
  player.deck = shuffled.items;
  player.discard = [];
  player.hand = [];
  env.events.push({ type: "roundEnded", round: draft.round });

  const pattern = scenario.timeOfDayPattern ?? null;
  const roundLimit = pattern === null ? scenario.roundCap : pattern.length;
  if (draft.round >= roundLimit) {
    draft.gameOver = true;
    const score = player.fame;
    draft.result = { outcome: "defeat", score, cityConquered: false, reason: "round_limit" };
    env.events.push({ type: "gameEnded", round: draft.round, outcome: "defeat", score });
    return;
  }

  draft.round += 1;
  if (pattern !== null) {
    draft.timeOfDay = pattern[draft.round - 1] ?? draft.timeOfDay;
  }
  draft.skillUsage.turn = [];
  draft.skillUsage.round = [];
  draft.turn = emptyTurn(1, player.hand.length === 0);
  draft.combat = null;
  rollSource(draft);
  drawCards(draft, env, heroHandLimit(content, player.level));
  if (draft.dummy !== null) {
    draft.dummy.cardsRemaining = draft.dummy.deckSize;
  }
  // Units ready at round start; the unit offer refreshes from the deck (02 §3.1 / §10.2).
  for (const unit of player.units) {
    unit.ready = true;
  }
  if (draft.offers.unit.length > 0 || draft.offerDecks.unit.length > 0) {
    draft.offerDecks.unit.push(...draft.offers.unit);
    draft.offers.unit = draft.offerDecks.unit.splice(0, 3);
  }
  const allTactics = scenario.tacticIds ?? Object.keys(content.tactics ?? {});
  const removed = tacticRules?.usedTacticsRemovedEachRound === false ? [] : draft.tactics.used;
  const available = allTactics.filter((tactic) => !removed.includes(tactic));
  draft.tactics.available = available;
  draft.tactics.human = null;
  draft.tactics.dummy = null;
  draft.tacticChoice = available.length > 0 ? { options: [...available] } : null;
  env.events.push({ type: "roundStarted", round: draft.round });
  env.events.push({ type: "sourceRolled", dice: draft.source.map((die) => die.color) });
  if (draft.tacticChoice === null) {
    env.events.push({ type: "turnStarted", player: player.id });
    checkHeroDeckEmpty(draft, env);
  }
}

function levelDefOf(content: ContentBundle, level: number) {
  return content.levels?.find((definition) => definition.level === level);
}

function heroArmor(content: ContentBundle, level: number): number {
  return levelDefOf(content, level)?.stats.armor ?? content.rulesConstants.heroArmor;
}

function heroHandLimit(content: ContentBundle, level: number): number {
  return levelDefOf(content, level)?.stats.handLimit ?? content.rulesConstants.heroHandLimit;
}

function commandSlots(content: ContentBundle, level: number): number {
  return levelDefOf(content, level)?.stats.commandSlots ?? 1;
}

/** End-of-turn level-ups (02 §12/§15): each even level grants a skill and an AA card. */
function applyLevelUps(draft: Draft, env: Env): void {
  const { content, events } = env;
  const player = draft.players[0];
  if (player === undefined || content.levels === undefined) {
    return;
  }
  for (;;) {
    const next = content.levels.find((definition) => definition.level === player.level + 1);
    if (next === undefined || player.fame < next.fame) {
      break;
    }
    player.level = next.level;
    events.push({ type: "levelGained", level: next.level });
    if (next.level % 2 !== 0) {
      continue;
    }
    const skill = player.skillDeck.shift();
    if (skill !== undefined) {
      player.skills.push(skill);
      events.push({ type: "skillGained", skill });
    }
    const defId = draft.offers.aa.shift();
    if (defId !== undefined) {
      const replacement = draft.offerDecks.aa.shift();
      if (replacement !== undefined) {
        draft.offers.aa.push(replacement);
      }
      const instance = asCardInstanceId(
        `p1:gained:${draft.turn.number}:${draft.actionEpoch}:level`,
      );
      draft.cardInstances[instance] = defId;
      player.deck.unshift(instance);
      events.push({ type: "cardGained", card: instance, defId, source: "level_up" });
    }
  }
}

function mineColorAt(state: GameState, content: ContentBundle, hex: Hex): BasicManaColor | null {
  for (const placed of state.map.tiles) {
    if (!placed.revealed) {
      continue;
    }
    const tile = content.tiles[placed.tileId];
    if (tile === undefined) {
      continue;
    }
    for (const hexDef of tile.hexes) {
      if (hexDef.mine_color === null) {
        continue;
      }
      const local = rotateHex({ q: hexDef.q, r: hexDef.r }, placed.rotation);
      if (placed.origin.q + local.q === hex.q && placed.origin.r + local.r === hex.r) {
        return hexDef.mine_color;
      }
    }
  }
  return null;
}

function endTurn(draft: Draft, env: Env): void {
  const player = draft.players[0];
  if (player === undefined) {
    return;
  }
  applyLevelUps(draft, env);
  // Crystal mine: ending the turn on a mine yields one crystal of its colour (02 §16.4).
  const mineColor = mineColorAt(draft, env.content, player.position);
  if (mineColor !== null && player.crystals[mineColor] < 3) {
    player.crystals[mineColor] += 1;
    env.events.push({ type: "crystalGained", color: mineColor });
  }
  for (const card of player.playArea) {
    player.discard.push(card);
  }
  player.playArea = [];
  player.manaTokens = [];
  draft.turn.extraSourceDie = false;
  draft.turn.cardBoost = 0;
  env.events.push({ type: "turnEnded", player: player.id });

  if (draft.endOfRoundAnnounced) {
    // The round's prepare step shuffles and draws; no extra draw on the final turn.
    finishRound(draft, env);
    return;
  }
  // End-of-turn step 7: draw up to the (modified) hand limit (02 §15.1).
  const toDraw = heroHandLimit(env.content, player.level) - player.hand.length;
  if (toDraw > 0) {
    drawCards(draft, env, toDraw);
  }
  if (draft.dummy !== null) {
    dummyTurn(draft, env);
    startHumanTurn(draft, env);
    return;
  }
  // Scenarios without a dummy player (fixtures/T0 traces) keep the one-hero-turn-per-round
  // compatibility shortcut so the old tests and traces stay meaningful.
  finishRound(draft, env);
}

// ---------------------------------------------------------------------------
// Public surface
// ---------------------------------------------------------------------------

/** Exposed for the S4 mutation test: movement costs must come from the content bundle. */
export function getReachableHexes(
  state: GameState,
  content: ContentBundle,
): ReadonlyMap<string, number> {
  return reachableHexes(state, content);
}

export function hashState(state: GameState): string {
  return sharedHashState(state);
}

export function checkInvariants(state: GameState, content: ContentBundle): readonly string[] {
  const problems: string[] = [];
  const player = state.players[0];
  if (player === undefined) {
    return ["no player"];
  }
  const revealed = revealedHexes(state, content);
  if (!state.gameOver && !revealed.has(hexKey(player.position))) {
    problems.push(`hero off revealed map at ${hexKey(player.position)}`);
  }
  for (const color of BASIC_COLORS) {
    const count = player.crystals[color];
    if (count < 0 || count > 3) {
      problems.push(`crystal ${color} out of bounds: ${count}`);
    }
  }
  const zones = [player.hand, player.deck, player.discard, player.playArea];
  const seen = new Set<string>();
  for (const zone of zones) {
    for (const instance of zone) {
      if (seen.has(instance)) {
        problems.push(`card ${instance} appears in two zones`);
      }
      seen.add(instance);
      if (state.cardInstances[instance] === undefined) {
        problems.push(`card ${instance} has no definition`);
      }
    }
  }
  if (state.pending !== null && state.pending.choiceId.length === 0) {
    problems.push("pending choice without id");
  }
  for (const unit of player.units) {
    if (content.units?.[unit.defId] === undefined) {
      problems.push(`unknown unit ${unit.defId}`);
    }
    if (unit.wounds < 0 || unit.wounds > 2) {
      problems.push(`unit ${unit.instanceId} has ${unit.wounds} wounds`);
    }
  }
  for (const enemy of state.map.enemies) {
    if (content.enemies[enemy.defId] === undefined) {
      problems.push(`unknown enemy ${enemy.defId}`);
    }
  }
  return problems;
}

export function createFixtureGame(content: ContentBundle, seed: number): GameState {
  return createGame({ seed }, content).state;
}
