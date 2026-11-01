/**
 * Display helpers for the client: everything that turns engine ids and rules data into readable
 * text. The client never invents game values — names and effect text come from the content
 * bundle, and anything missing degrades to a humanized id instead of crashing.
 */
import { bundle } from "@emberwold/content";
import type {
  Action,
  GameEvent,
  GameState,
  ManaPayment,
  MapSite,
  SourceDie,
} from "@emberwold/engine";
import type {
  BasicManaColor,
  CardDef,
  CombatType,
  EffectOp,
  Element,
  LevelDef,
  LevelStats,
  ManaColor,
  SiteDef,
  Terrain,
  UnitDef,
} from "@emberwold/shared";

export const MANA_COLORS: readonly ManaColor[] = ["red", "blue", "green", "white", "gold", "black"];

export const ELEMENT_LABEL: Readonly<Record<Element, string>> = {
  physical: "physical",
  fire: "fire",
  ice: "ice",
  cold_fire: "cold fire",
  light: "light",
};

export const COMBAT_TYPE_LABEL: Readonly<Record<CombatType, string>> = {
  melee: "melee",
  ranged: "ranged",
  siege: "siege",
};

export const TERRAIN_LABEL: Readonly<Record<Terrain, string>> = {
  plains: "plains",
  hills: "hills",
  forest: "forest",
  wasteland: "wasteland",
  desert: "desert",
  swamp: "swamp",
  lake: "lake",
  mountain: "mountain",
  city: "city",
};

/** "early_bird" -> "Early Bird", "enemy:guardsmen" -> "Guardsmen". */
export function humanizeId(id: string): string {
  const tail = id.includes(":") ? id.slice(id.indexOf(":") + 1) : id;
  const words = tail.split(/[_\s.-]+/).filter((word) => word.length > 0);
  if (words.length === 0) {
    return id;
  }
  return words.map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
}

export function manaColorLabel(color: ManaColor): string {
  return humanizeId(color);
}

export function plural(count: number, singular: string, pluralForm?: string): string {
  return count === 1 ? `1 ${singular}` : `${count} ${pluralForm ?? `${singular}s`}`;
}

export function summarizeNames(names: readonly string[], limit = 3): string {
  if (names.length <= limit) {
    return names.join(", ");
  }
  const shown = names.slice(0, limit).join(", ");
  return `${shown} +${names.length - limit}`;
}

// ---------------------------------------------------------------------------
// Content lookups
// ---------------------------------------------------------------------------

export function cardDefById(defId: string | undefined): CardDef | undefined {
  return defId === undefined ? undefined : bundle.cards[defId];
}

export function cardDefIdOf(state: GameState, instance: string): string | undefined {
  const instances = state.cardInstances as Readonly<Record<string, string>>;
  return instances[instance];
}

export function cardDefByInstance(state: GameState, instance: string): CardDef | undefined {
  return cardDefById(cardDefIdOf(state, instance));
}

export function cardNameByInstance(state: GameState, instance: string): string {
  return cardDefByInstance(state, instance)?.name ?? cardDefIdOf(state, instance) ?? instance;
}

export function isWoundInstance(state: GameState, instance: string): boolean {
  return cardDefIdOf(state, instance) === bundle.woundCard.id;
}

export function heroName(heroId: string): string {
  return bundle.heroes[heroId]?.name ?? humanizeId(heroId);
}

export function siteDefById(siteId: string): SiteDef | undefined {
  return bundle.sites[siteId];
}

export function siteNameById(siteId: string): string {
  return siteDefById(siteId)?.name ?? humanizeId(siteId);
}

export function enemyNameById(defId: string): string {
  return bundle.enemies[defId]?.name ?? humanizeId(defId);
}

export function unitDefById(defId: string): UnitDef | undefined {
  return bundle.units?.[defId];
}

export function unitNameById(defId: string): string {
  return unitDefById(defId)?.name ?? humanizeId(defId);
}

export function skillNameById(skillId: string): string {
  return bundle.skills?.[skillId]?.name ?? humanizeId(skillId);
}

export function tacticNameById(tacticId: string): string {
  return bundle.tactics?.[tacticId]?.name ?? humanizeId(tacticId);
}

export function levelDefFor(level: number): LevelDef | undefined {
  return bundle.levels?.find((entry) => entry.level === level);
}

export function nextLevelDef(level: number): LevelDef | undefined {
  return bundle.levels?.find((entry) => entry.level > level);
}

export function levelStatsFor(level: number): LevelStats {
  return (
    levelDefFor(level)?.stats ?? {
      armor: bundle.rulesConstants.heroArmor,
      handLimit: bundle.rulesConstants.heroHandLimit,
      commandSlots: 1,
    }
  );
}

export function commandSlotsFor(level: number): number {
  return levelStatsFor(level).commandSlots;
}

export function currentMapSite(state: GameState): MapSite | undefined {
  const player = state.players[0];
  if (player === undefined) {
    return undefined;
  }
  return state.map.sites.find(
    (site) => site.hex.q === player.position.q && site.hex.r === player.position.r,
  );
}

export function currentSiteDef(state: GameState): SiteDef | undefined {
  const site = currentMapSite(state);
  return site === undefined ? undefined : siteDefById(site.siteId);
}

export function woundCount(state: GameState): number {
  const player = state.players[0];
  if (player === undefined) {
    return 0;
  }
  return player.hand.filter((instance) => isWoundInstance(state, instance)).length;
}

export function skillUsed(state: GameState, skillId: string): boolean {
  const usageType = bundle.skills?.[skillId]?.usageType;
  const scope = usageType === "once_per_round" ? state.skillUsage.round : state.skillUsage.turn;
  return scope.includes(skillId);
}

export function skillUsageLabel(usageType: string | undefined): string {
  switch (usageType) {
    case "once_per_turn":
      return "once per turn";
    case "once_per_round":
      return "once per round";
    case undefined:
      return "passive";
    default:
      return humanizeId(usageType);
  }
}

export function enemyNameByInstance(state: GameState, instance: string): string {
  const mapEnemy = state.map.enemies.find((enemy) => enemy.instanceId === instance);
  if (mapEnemy !== undefined) {
    return enemyNameById(mapEnemy.defId);
  }
  const combatEnemy = state.combat?.enemies.find((enemy) => enemy.instanceId === instance);
  return combatEnemy === undefined ? instance : enemyNameById(combatEnemy.defId);
}

export function unitNameByInstance(state: GameState, instance: string): string {
  const player = state.players[0];
  const unit = player?.units.find((candidate) => candidate.instanceId === instance);
  return unit === undefined ? instance : unitNameById(unit.defId);
}

export function enemiesAtPlayer(state: GameState): readonly string[] {
  const player = state.players[0];
  if (player === undefined) {
    return [];
  }
  return state.map.enemies
    .filter(
      (enemy) =>
        enemy.alive && enemy.hex.q === player.position.q && enemy.hex.r === player.position.r,
    )
    .map((enemy) => enemyNameById(enemy.defId));
}

export function pendingDamageFor(state: GameState, enemyInstance: string): number {
  const entry = state.combat?.pendingDamage.find(
    (candidate) => candidate.enemyInstanceId === enemyInstance,
  );
  return entry?.amount ?? 0;
}

// ---------------------------------------------------------------------------
// Mana and effects
// ---------------------------------------------------------------------------

export function paymentLabel(payment: ManaPayment, state: GameState): string {
  switch (payment.kind) {
    case "crystal":
      return `${manaColorLabel(payment.color)} crystal`;
    case "token":
      return `${manaColorLabel(payment.color)} token`;
    case "die": {
      const die: SourceDie | undefined = state.source[payment.index];
      return die === undefined
        ? `source die ${payment.index + 1}`
        : `source die ${payment.index + 1} (${manaColorLabel(die.color)})`;
    }
  }
}

export function effectSummary(effect: EffectOp): string {
  switch (effect.op) {
    case "choice":
      return `one of: ${effect.options.map((option) => effectSummary(option)).join(" / ")}`;
    case "compound":
      return effect.effects.map((nested) => effectSummary(nested)).join(", ");
    case "gain_move":
      return `move ${effect.amount}`;
    case "gain_influence":
      return `influence ${effect.amount}`;
    case "gain_attack": {
      const element = effect.element === "physical" ? "" : ` ${ELEMENT_LABEL[effect.element]}`;
      return `${effect.amount}${element} ${COMBAT_TYPE_LABEL[effect.combat_type]} attack`;
    }
    case "gain_block": {
      const element = effect.element === "physical" ? "" : ` ${ELEMENT_LABEL[effect.element]}`;
      return `${effect.amount}${element} block`;
    }
    case "ready_units_budget":
      return `ready units with total levels up to ${effect.total_levels}`;
    case "gain_healing":
      return `heal ${effect.amount}`;
    case "draw_cards":
      return `draw ${effect.count}`;
    case "gain_mana":
      return `${effect.amount === 1 ? "" : `${effect.amount} `}${manaColorLabel(effect.color)} mana`;
    case "gain_crystal":
      return `${manaColorLabel(effect.color)} crystal`;
    case "convert_mana_to_crystal":
      return "turn a mana into a crystal";
    case "mana_draw_powered":
      return `draw up to ${effect.dice_count} source dice (${effect.tokens_per_die} token each)`;
    case "apply_modifier": {
      if (effect.effect.op === "rule_override") {
        return `${effect.duration} bonus (${humanizeId(effect.effect.rule)})`;
      }
      if (effect.effect.op === "unit_combat_bonus") {
        return `${effect.duration} unit bonus (+${effect.effect.attack_bonus} attack, +${effect.effect.block_bonus} block)`;
      }
      const cost = effect.effect.replace_cost ?? effect.effect.amount;
      const terrain =
        typeof effect.effect.terrain === "string"
          ? effect.effect.terrain
          : effect.effect.terrain.terrain;
      return `${effect.duration} modifier (${humanizeId(terrain)} terrain cost ${cost})`;
    }
    case "schedule_end_turn":
      return `at end of turn, put this card on the ${effect.effect.destination} of your deck`;
    case "offer_deck_placement":
      return `put a card on the ${effect.destination} of a deck`;
    case "rule_override":
      return `special rule (${humanizeId(effect.rule)})`;
    case "card_boost":
      return `next card +${effect.bonus}`;
    case "discard_cost": {
      const then = effect.then_effect as EffectOp | undefined;
      return then === undefined
        ? `discard ${plural(effect.count, "card")}`
        : `discard ${plural(effect.count, "card")} → ${effectSummary(then)}`;
    }
    case "take_wound":
      return "take a wound";
    case "change_reputation":
      return `reputation ${effect.amount >= 0 ? "+" : ""}${effect.amount}`;
    case "special":
      return effect.id === "none" ? "no effect" : `special (${humanizeId(effect.id)})`;
    default: {
      const unknown: unknown = effect;
      const op =
        typeof unknown === "object" && unknown !== null
          ? (unknown as Readonly<Record<string, unknown>>).op
          : undefined;
      return typeof op === "string" ? humanizeId(op) : "special effect";
    }
  }
}

export function offerCardName(kind: "aa" | "spell", index: number, state: GameState): string {
  const cardId = kind === "aa" ? state.offers.aa[index] : state.offers.spell[index];
  return cardDefById(cardId)?.name ?? `offer ${index + 1}`;
}

export function offerUnitName(index: number, state: GameState): string {
  return unitNameById(state.offers.unit[index] ?? "");
}

export function discardNames(state: GameState, cards: readonly string[]): string {
  return summarizeNames(cards.map((card) => cardNameByInstance(state, card)));
}

export function choiceOptionLabel(action: Action, state: GameState): string {
  if (action.type !== "resolveChoice") {
    return "choice";
  }
  const pending = state.pending;
  if (pending === null || pending.choiceId !== action.choiceId) {
    return `option ${action.optionIndex + 1}`;
  }
  const option = pending.options[action.optionIndex];
  if (option === undefined) {
    return `option ${action.optionIndex + 1}`;
  }
  if (pending.kind === "discardCost") {
    return `discard ${cardNameByInstance(state, option)}`;
  }
  return option;
}

// ---------------------------------------------------------------------------
// Actions and events
// ---------------------------------------------------------------------------

export function actionLabel(action: Action, state: GameState): string {
  switch (action.type) {
    case "chooseTactic":
      return `choose ${tacticNameById(action.tactic)}`;
    case "playCard": {
      const mana = action.mana === undefined ? "" : ` · ${paymentLabel(action.mana, state)}`;
      return `${action.mode} · ${cardNameByInstance(state, action.card)}${mana}`;
    }
    case "playCardSideways":
      return `sideways ${action.as} · ${cardNameByInstance(state, action.card)}`;
    case "resolveChoice":
      return choiceOptionLabel(action, state);
    case "rest":
      return action.kind === "standard"
        ? `rest · discard ${discardNames(state, action.discard)}`
        : `slow recovery · discard ${discardNames(state, action.discard)}`;
    case "moveTo":
      return `move to ${action.target.q},${action.target.r}`;
    case "explore":
      return "explore";
    case "enterSite":
      return "enter site";
    case "challengeRampaging":
      return "challenge rampaging enemies";
    case "buyHealing":
      return `heal ${plural(action.points, "wound")}`;
    case "buyAdvancedAction":
      return `learn ${offerCardName("aa", action.index, state)}`;
    case "buySpell": {
      const mana =
        action.mana === undefined ? " · matching mana" : ` · ${paymentLabel(action.mana, state)}`;
      return `buy ${offerCardName("spell", action.index, state)}${mana}`;
    }
    case "discardGladeWound":
      return "discard a wound (glade)";
    case "useSkill":
      return `use ${skillNameById(action.skill)}`;
    case "discardCard":
      return `discard ${cardNameByInstance(state, action.card)}`;
    case "recruitUnit":
      return `recruit ${offerUnitName(action.index, state)}`;
    case "activateUnit": {
      const unit = unitNameByInstance(state, action.unit);
      const mana = action.mana === undefined ? "" : ` · ${paymentLabel(action.mana, state)}`;
      return `activate ${unit}${mana}`;
    }
    case "assignDamage": {
      const target = action.unit === undefined ? "hero" : unitNameByInstance(state, action.unit);
      return `assign ${enemyNameByInstance(state, action.enemy)} damage to ${target}`;
    }
    case "healUnit":
      return `heal ${unitNameByInstance(state, action.unit)}`;
    case "assignAttack":
      return `defeat ${enemyNameByInstance(state, action.enemy)}`;
    case "endCombatPhase":
      return "end combat phase";
    case "endTurn":
      return "end turn";
    default: {
      // The engine may add action types before this client catches up: keep the button usable
      // and the label honest instead of hiding the action.
      const unknown = action as Action;
      return humanizeId(unknown.type);
    }
  }
}

export function eventLabel(event: GameEvent, state: GameState): string {
  switch (event.type) {
    case "gameCreated":
      return `new run · seed ${event.seed}`;
    case "roundStarted":
      return `round ${event.round} started`;
    case "sourceRolled":
      return `source rolled: ${event.dice.map((die) => manaColorLabel(die)).join(", ")}`;
    case "turnStarted":
      return "turn started";
    case "tacticChosen":
      return `${event.player} chose ${tacticNameById(event.tactic)}`;
    case "dummyFlipped":
      return `dummy flipped ${plural(event.count, "card")} (${event.remaining} left)`;
    case "endOfRoundAnnounced":
      return `end of round announced by the ${event.by}`;
    case "cardPlayed":
      return `${cardDefById(event.defId)?.name ?? humanizeId(event.defId)} (${event.mode})`;
    case "choiceRequested":
      return `choice: ${event.options.join(" / ")}`;
    case "choiceResolved":
      return `choice option ${event.optionIndex + 1}`;
    case "movePointsGained":
      return `+${event.amount} move`;
    case "influenceGained":
      return `+${event.amount} influence`;
    case "manaGained":
      return `+1 ${manaColorLabel(event.color)} mana`;
    case "crystalGained":
      return `+1 ${manaColorLabel(event.color)} crystal`;
    case "reputationChanged":
      return `reputation ${event.amount >= 0 ? "+" : ""}${event.amount}`;
    case "cardDrawn":
      return `drew ${plural(event.count, "card")}`;
    case "cardDiscarded":
      return `discarded ${cardNameByInstance(state, event.card)}`;
    case "rested":
      return actionRestLabel(event.kind);
    case "woundGained":
      return `+${plural(event.amount, "wound")}`;
    case "healGained":
      return `healed ${plural(event.points, "wound")}`;
    case "heroMoved":
      return `moved to ${event.to.q},${event.to.r} (cost ${event.cost})`;
    case "tileRevealed":
      return `tile revealed (${humanizeId(event.tile)})`;
    case "siteEntered":
      return `entered ${siteNameById(event.site)}`;
    case "influenceSpent":
      return `-${event.amount} influence`;
    case "cardGained":
      return `gained ${cardDefById(event.defId)?.name ?? humanizeId(event.defId)}`;
    case "levelGained":
      return `reached level ${event.level}`;
    case "skillGained":
      return `gained skill ${skillNameById(event.skill)}`;
    case "skillUsed":
      return `used skill ${skillNameById(event.skill)}`;
    case "unitRecruited":
      return `recruited ${unitNameById(event.defId)}`;
    case "unitActivated":
      return `activated ${unitNameByInstance(state, event.unit)}`;
    case "unitWounded":
      return `${unitNameByInstance(state, event.unit)} wounded (${event.wounds})`;
    case "unitDestroyed":
      return `${unitNameByInstance(state, event.unit)} destroyed`;
    case "unitHealed":
      return `${unitNameByInstance(state, event.unit)} healed (${event.wounds} left)`;
    case "woundDiscarded":
      return `discarded ${plural(event.count, "wound")}`;
    case "enemySpawned":
      return `${enemyNameById(event.defId)} appeared`;
    case "combatStarted":
      return `combat: ${summarizeNames(
        event.enemies.map((enemy) => enemyNameByInstance(state, enemy)),
      )}`;
    case "enemyBlocked":
      return `${enemyNameByInstance(state, event.enemy)} blocked`;
    case "enemyDefeated":
      return `${enemyNameByInstance(state, event.enemy)} defeated (+${event.fame} fame)`;
    case "damageAssigned":
      return `${plural(event.wounds, "wound")} from ${enemyNameByInstance(state, event.enemy)}`;
    case "combatEnded":
      return "combat ended";
    case "turnEnded":
      return "turn ended";
    case "roundEnded":
      return `round ${event.round} ended`;
    case "cityConquered":
      return `city conquered (+${event.score} score)`;
    case "gameEnded":
      return `run over · ${event.outcome} · score ${event.score}`;
    default: {
      const unknown = event as GameEvent;
      return humanizeId(unknown.type);
    }
  }
}

function actionRestLabel(kind: "standard" | "slowRecovery"): string {
  return kind === "standard" ? "rested" : "slow recovery";
}

export function reasonLabel(reason: string | undefined): string {
  if (reason === undefined) {
    return "unknown";
  }
  const labels: Readonly<Record<string, string>> = {
    city_conquered: "city conquered",
    round_cap: "round cap reached",
    defeat: "hero defeated",
    hero_defeated: "hero defeated",
  };
  return labels[reason] ?? humanizeId(reason);
}

export function manaColorsForCrystals(
  crystals: Readonly<Record<BasicManaColor, number>>,
): readonly { color: BasicManaColor; count: number }[] {
  const colors: readonly BasicManaColor[] = ["red", "blue", "green", "white"];
  return colors.map((color) => ({ color, count: crystals[color] }));
}
