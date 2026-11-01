import {
  asCardInstanceId,
  asEnemyInstanceId,
  asPlayerId,
  asSiteDefId,
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
  GameConfig,
  GameEvent,
  GameState,
  LegalActionSet,
  ManaPayment,
  PendingChoice,
  PlayerState,
  PlacedTile,
  TurnState,
} from "./types";

export const ENGINE_VERSION = "0.1.0-spike";
export const RULESET_ID = "emberwold-spike" as const;
export const SCHEMA_VERSION = 1;
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
      dice.push({ color, used: false });
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

export function createGame(
  config: GameConfig,
  content: ContentBundle,
): { state: GameState; events: GameEvent[] } {
  const events: GameEvent[] = [];
  const scenario = content.scenario;
  const hero = content.heroes[scenario.heroId];
  if (hero === undefined) {
    throw new Error(`content: unknown hero ${scenario.heroId}`);
  }

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
  };

  const placed: PlacedTile[] = scenario.tiles.map((placement, index) => {
    const tile = content.tiles[placement.tileId];
    if (tile === undefined) {
      throw new Error(`content: unknown tile ${placement.tileId}`);
    }
    const containsStart = tile.hexes.some((hex) =>
      hexesEqual(addHex(placement.origin, hex), scenario.startHex),
    );
    return {
      tileId: asTileId(placement.tileId),
      origin: placement.origin,
      revealed: containsStart || index === 0,
      rotation: 0,
    };
  });

  const sites: { siteId: string; hex: Hex }[] = [];
  for (const tilePlacement of placed) {
    const tile = content.tiles[tilePlacement.tileId];
    if (tile === undefined) {
      continue;
    }
    for (const hex of tile.hexes) {
      if (hex.site !== null) {
        sites.push({ siteId: `site:${hex.site}`, hex: addHex(tilePlacement.origin, hex) });
      }
    }
  }
  if (scenario.site !== null) {
    sites.push({ siteId: scenario.site.siteId, hex: scenario.site.hex });
  }

  const enemies: { instanceId: string; defId: string; hex: Hex; alive: boolean }[] = [];
  for (const spawn of scenario.spawns) {
    const tile = placed.find((candidate) => {
      const def = content.tiles[candidate.tileId];
      return (
        def?.hexes.some((hex) => hexesEqual(addHex(candidate.origin, hex), spawn.hex)) ?? false
      );
    });
    if (tile?.revealed === true) {
      enemies.push({
        instanceId: `enemy:${enemies.length}`,
        defId: spawn.enemyId,
        hex: spawn.hex,
        alive: true,
      });
    }
  }

  const rng = shuffled.rng;
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

  const state: GameState = {
    schemaVersion: SCHEMA_VERSION,
    engineVersion: ENGINE_VERSION,
    rulesetId: RULESET_ID,
    contentHash: content.contentHash,
    seed: config.seed,
    round: 1,
    timeOfDay: "day",
    activePlayer: player.id,
    turn,
    players: [player],
    map: {
      tiles: placed,
      enemies: enemies.map((e) => ({
        instanceId: asEnemyInstanceId(e.instanceId),
        defId: e.defId,
        hex: e.hex,
        alive: e.alive,
      })),
      sites: sites.map((site) => ({ siteId: asSiteDefId(site.siteId), hex: site.hex })),
    },
    source: [],
    combat: null,
    pending: null,
    cardInstances,
    woundCounter: 0,
    actionEpoch: 0,
    rng,
    gameOver: false,
  };
  const draft = cloneState(state);
  rollSource(draft);
  draft.turn.handWasEmptyAtStart = true;
  drawCards(draft, { content, events }, content.rulesConstants.startingHandSize);
  draft.turn.handWasEmptyAtStart = draft.players[0]?.hand.length === 0;
  events.push({ type: "gameCreated", seed: config.seed, contentHash: content.contentHash });
  events.push({ type: "roundStarted", round: 1 });
  events.push({ type: "sourceRolled", dice: draft.source.map((die) => die.color) });
  events.push({ type: "turnStarted", player: asPlayerId("p1") });
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
    hex: addHex(tile.origin, hex),
    terrain: hex.terrain,
    site: hex.site,
  }));
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

function terrainCost(content: ContentBundle, terrain: string): number | null {
  const entry = (content.rulesConstants.terrainMoveCost as Record<string, { day: number } | null>)[
    terrain
  ];
  return entry === null || entry === undefined ? null : entry.day;
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
      const step = terrainCost(content, info.terrain);
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

function canExplore(state: GameState, content: ContentBundle): boolean {
  const player = state.players[0];
  if (player === undefined) {
    return false;
  }
  const hidden = state.map.tiles.find((tile) => !tile.revealed);
  if (hidden === undefined || state.turn.movePoints < content.rulesConstants.tileRevealCost) {
    return false;
  }
  const hiddenKeys = new Set(tileHexInfos(hidden, content).map((info) => hexKey(info.hex)));
  return neighbors(player.position).some((hex) => hiddenKeys.has(hexKey(hex)));
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
  if (state.pending !== null || state.combat !== null || state.gameOver) {
    return false;
  }
  if (state.turn.rested || state.turn.playedOrDiscarded) {
    return true;
  }
  return (state.players[0]?.hand.length ?? 0) === 0;
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

  for (const [key, cost] of reachableHexes(state, content)) {
    const [qText, rText] = key.split(",");
    if (cost <= state.turn.movePoints) {
      actions.push({ epoch, type: "moveTo", target: { q: Number(qText), r: Number(rText) } });
    }
  }
  if (canExplore(state, content)) {
    actions.push({ epoch, type: "explore" });
  }
  if (enemiesAt(state, player.position).length > 0) {
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
    case "playCard":
      playCard(draft, action.card, action.mode, action.mana, env);
      return;
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
      const hidden = draft.map.tiles.find((tile) => !tile.revealed);
      if (hidden === undefined) {
        throw new Error("nothing to reveal");
      }
      hidden.revealed = true;
      draft.turn.movePoints -= content.rulesConstants.tileRevealCost;
      env.events.push({ type: "tileRevealed", tile: hidden.tileId, origin: hidden.origin });
      for (const spawn of content.scenario.spawns) {
        const tileDef = content.tiles[hidden.tileId];
        const onTile =
          tileDef?.hexes.some((hex) => hexesEqual(addHex(hidden.origin, hex), spawn.hex)) ?? false;
        if (
          onTile &&
          !draft.map.enemies.some(
            (enemy) => hexesEqual(enemy.hex, spawn.hex) && enemy.defId === spawn.enemyId,
          )
        ) {
          draft.map.enemies.push({
            instanceId: asEnemyInstanceId(`enemy:${draft.map.enemies.length}`),
            defId: spawn.enemyId,
            hex: spawn.hex,
            alive: true,
          });
        }
      }
      return;
    }
    case "enterSite": {
      const site = siteAt(draft, player.position);
      if (site === null) {
        throw new Error("no site here");
      }
      draft.turn.flags[`enteredSite:${hexKey(player.position)}`] = true;
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
    case "challengeRampaging": {
      const enemyIds = enemiesAt(draft, player.position);
      if (enemyIds.length === 0) {
        throw new Error("no enemies here");
      }
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
      assignDamage(draft, action.enemy, env);
      return;
    case "assignAttack":
      assignAttack(draft, action.enemy, env);
      return;
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
}

function assignDamage(draft: Draft, enemy: EnemyInstanceId, env: Env): void {
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
  const wounds = woundsFromDamage(entry.amount, env.content.rulesConstants.heroArmor);
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
  }
}

function endTurn(draft: Draft, env: Env): void {
  const { content } = env;
  const player = draft.players[0];
  if (player === undefined) {
    return;
  }
  for (const card of player.playArea) {
    player.discard.push(card);
  }
  player.playArea = [];
  player.manaTokens = [];
  draft.turn.extraSourceDie = false;
  draft.turn.cardBoost = 0;
  env.events.push({ type: "turnEnded", player: player.id });

  // End-of-turn draw (02 §15.1 step 7).
  const handLimit = content.rulesConstants.heroHandLimit;
  const missing = Math.max(0, handLimit - player.hand.length);
  drawCards(draft, env, missing);

  // Round end: wounds in hand shuffle back into the deed deck (02 §15.2).
  const woundsInHand = player.hand.filter((instance) =>
    isWound(content, cardOf(content, draft.cardInstances, instance)),
  );
  player.hand = player.hand.filter((instance) => !woundsInHand.includes(instance));
  const shuffled = shuffleWithRng([...player.deck, ...player.discard], draft.rng);
  draft.rng = shuffled.rng;
  player.deck = shuffled.items;
  player.discard = [];
  const woundsAgain = shuffleWithRng([...woundsInHand], draft.rng);
  draft.rng = woundsAgain.rng;
  player.deck.push(...woundsAgain.items);
  env.events.push({ type: "roundEnded", round: draft.round });

  if (draft.round >= content.scenario.roundCap) {
    draft.gameOver = true;
    env.events.push({ type: "gameEnded", round: draft.round });
    return;
  }

  draft.round += 1;
  draft.turn = {
    number: 1,
    step: "movement",
    movePoints: 0,
    influence: 0,
    cardsPlayed: 0,
    playedOrDiscarded: false,
    rested: false,
    handWasEmptyAtStart: player.hand.length === 0,
    extraSourceDie: false,
    cardBoost: 0,
    flags: {},
  };
  rollSource(draft);
  env.events.push({ type: "roundStarted", round: draft.round });
  env.events.push({ type: "sourceRolled", dice: draft.source.map((die) => die.color) });
  env.events.push({ type: "turnStarted", player: player.id });
}

// ---------------------------------------------------------------------------
// Public surface
// ---------------------------------------------------------------------------

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
