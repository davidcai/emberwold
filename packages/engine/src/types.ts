import type {
  BasicManaColor,
  CardId,
  CardInstanceId,
  CombatType,
  EffectOp,
  Element,
  EnemyInstanceId,
  Hex,
  ManaColor,
  PlayerId,
  RngState,
  SiteDefId,
  TerrainCostModifier,
  TileId,
  Terrain,
  UnitInstanceId,
} from "@emberwold/shared";

export type RulesetId = "emberwold-spike";
export type CardMode = "basic" | "powered";
export type SidewaysAs = "move" | "influence" | "attack" | "block";

export type ManaPayment =
  | { kind: "crystal"; color: BasicManaColor }
  | { kind: "token"; color: ManaColor }
  | { kind: "die"; index: number };

export interface ManaToken {
  color: ManaColor;
}

export interface SourceDie {
  color: ManaColor;
  used: boolean;
}

export interface TurnState {
  number: number;
  step: "start" | "movement" | "action" | "end";
  movePoints: number;
  influence: number;
  cardsPlayed: number;
  playedOrDiscarded: boolean;
  rested: boolean;
  handWasEmptyAtStart: boolean;
  extraSourceDie: boolean;
  cardBoost: number;
  flags: Record<string, boolean>;
  /** Turn-duration movement modifier (e.g. a skill that makes all terrain cost 0). */
  terrainModifier?: TerrainCostModifier;
}

export interface UnitState {
  instanceId: UnitInstanceId;
  defId: string;
  ready: boolean;
}

export interface PlayerState {
  id: PlayerId;
  heroId: string;
  seat: number;
  level: number;
  fame: number;
  reputation: number;
  position: Hex;
  hand: CardInstanceId[];
  deck: CardInstanceId[];
  discard: CardInstanceId[];
  playArea: CardInstanceId[];
  crystals: Record<BasicManaColor, number>;
  manaTokens: ManaToken[];
  /** Skill tokens still to be gained (fixed data order in T1; no shuffle yet). */
  skillDeck: string[];
  /** Skills gained so far (effects deferred for most, T1 simplification). */
  skills: string[];
  /** Recruited units (T1: ready/spent only; no wounded/damage assignment yet). */
  units: UnitState[];
}

export interface SkillUsage {
  /** Skill ids already used this turn (once-per-turn skills). */
  turn: string[];
  /** Skill ids already used this round (once-per-round skills). */
  round: string[];
}

export interface PlacedTile {
  tileId: TileId;
  origin: Hex;
  revealed: boolean;
  rotation: number;
}

export interface MapEnemy {
  instanceId: EnemyInstanceId;
  defId: string;
  hex: Hex;
  alive: boolean;
  /** Where the token came from; city tokens win the scenario when cleared. */
  kind?: "rampaging" | "city";
}

export interface MapSite {
  siteId: SiteDefId;
  hex: Hex;
  /** True once the site has been conquered/used up (city, keep, burned monastery...). */
  conquered?: boolean;
}

export interface MapState {
  tiles: PlacedTile[];
  enemies: MapEnemy[];
  sites: MapSite[];
}

export type CombatPhase = "rangedSiege" | "block" | "assignDamage" | "attack";

export interface CombatEnemy {
  instanceId: EnemyInstanceId;
  defId: string;
  blocked: boolean;
  defeated: boolean;
}

export interface AttackContribution {
  amount: number;
  element: Element;
  combatType: CombatType;
}

export interface BlockContribution {
  amount: number;
  element: Element;
}

export interface CombatState {
  phase: CombatPhase;
  enemies: CombatEnemy[];
  attackPool: AttackContribution[];
  blockPool: BlockContribution[];
  pendingDamage: { enemyInstanceId: EnemyInstanceId; amount: number }[];
}

export interface PendingChoice {
  choiceId: string;
  kind: "effectChoice" | "discardCost";
  options: string[];
  effectOptions: EffectOp[];
  thenEffect: EffectOp | null;
  eligibleCards: CardInstanceId[];
}

export interface GameResult {
  outcome: "victory" | "defeat";
  score: number;
  cityConquered: boolean;
  reason: string;
}

export interface GameState {
  schemaVersion: 1;
  engineVersion: string;
  rulesetId: RulesetId;
  contentHash: string;
  seed: number;
  round: number;
  timeOfDay: "day" | "night";
  activePlayer: PlayerId;
  turn: TurnState;
  players: PlayerState[];
  map: MapState;
  source: SourceDie[];
  combat: CombatState | null;
  pending: PendingChoice | null;
  cardInstances: Record<CardInstanceId, CardId>;
  woundCounter: number;
  actionEpoch: number;
  rng: RngState;
  gameOver: boolean;
  /** Filled when the scenario ends (victory or defeat); null while playing. */
  result: GameResult | null;
  /** Set while the round's tactics step is unresolved (T1). */
  tacticChoice: TacticChoice | null;
  tactics: TacticState;
  /** Simplified solo dummy player; null when the scenario has none. */
  dummy: DummyState | null;
  /** True once End of Round has been announced; the hero gets one final turn. */
  endOfRoundAnnounced: boolean;
  /** Cards currently offered at sites (T1: Advanced Actions at monasteries, Spells at towers). */
  offers: OfferState;
  /** Cards still behind each offer; a purchase shifts the next card into the offer. */
  offerDecks: OfferDecks;
  /** Skill usage tracking for the current turn and round (T1 skill activation). */
  skillUsage: SkillUsage;
}

export interface OfferState {
  aa: CardId[];
  spell: CardId[];
  unit: string[];
}

export interface OfferDecks {
  aa: CardId[];
  spell: CardId[];
  unit: string[];
}

export interface TacticChoice {
  readonly options: string[];
}

export interface TacticState {
  available: string[];
  used: string[];
  human: string | null;
  dummy: string | null;
}

export interface DummyState {
  /** Cards left in the dummy's current-round deed deck (count only in T1). */
  cardsRemaining: number;
  readonly deckSize: number;
  readonly cardsPerTurn: number;
  readonly crystals: BasicManaColor[];
}

type ActionPayload =
  | { type: "chooseTactic"; tactic: string }
  | { type: "playCard"; card: CardInstanceId; mode: CardMode; mana?: ManaPayment }
  | { type: "playCardSideways"; card: CardInstanceId; as: SidewaysAs }
  | { type: "resolveChoice"; choiceId: string; optionIndex: number }
  | { type: "rest"; kind: "standard" | "slowRecovery"; discard: CardInstanceId[] }
  | { type: "moveTo"; target: Hex }
  | { type: "explore" }
  | { type: "enterSite" }
  | { type: "challengeRampaging" }
  | { type: "buyHealing"; points: number }
  | { type: "buyAdvancedAction"; index: number }
  | { type: "buySpell"; index: number; mana?: ManaPayment }
  | { type: "discardGladeWound" }
  | { type: "useSkill"; skill: string }
  | { type: "discardCard"; card: CardInstanceId }
  | { type: "recruitUnit"; index: number }
  | { type: "activateUnit"; unit: UnitInstanceId; ability: number; mana?: ManaPayment }
  | { type: "assignDamage"; enemy: EnemyInstanceId }
  | { type: "assignAttack"; enemy: EnemyInstanceId }
  | { type: "endCombatPhase" }
  | { type: "endTurn" };

export type Action = ActionPayload & { epoch: number };

export type GameEvent =
  | { type: "gameCreated"; seed: number; contentHash: string }
  | { type: "roundStarted"; round: number }
  | { type: "sourceRolled"; dice: ManaColor[] }
  | { type: "turnStarted"; player: PlayerId }
  | { type: "tacticChosen"; tactic: string; player: "human" | "dummy" }
  | { type: "dummyFlipped"; count: number; remaining: number }
  | { type: "endOfRoundAnnounced"; by: "dummy" | "hero" }
  | { type: "cardPlayed"; card: CardInstanceId; defId: CardId; mode: CardMode | "sideways" }
  | { type: "choiceRequested"; choiceId: string; kind: PendingChoice["kind"]; options: string[] }
  | { type: "choiceResolved"; choiceId: string; optionIndex: number }
  | { type: "movePointsGained"; amount: number }
  | { type: "influenceGained"; amount: number }
  | { type: "manaGained"; color: ManaColor }
  | { type: "crystalGained"; color: BasicManaColor }
  | { type: "reputationChanged"; amount: number }
  | { type: "cardDrawn"; count: number }
  | { type: "cardDiscarded"; card: CardInstanceId }
  | { type: "rested"; kind: "standard" | "slowRecovery" }
  | { type: "woundGained"; amount: number }
  | { type: "healGained"; points: number }
  | { type: "heroMoved"; from: Hex; to: Hex; cost: number }
  | { type: "tileRevealed"; tile: TileId; origin: Hex }
  | { type: "siteEntered"; site: SiteDefId }
  | { type: "influenceSpent"; amount: number }
  | {
      type: "cardGained";
      card: CardInstanceId;
      defId: CardId;
      source: "monastery" | "mage_tower" | "level_up";
    }
  | { type: "levelGained"; level: number }
  | { type: "skillGained"; skill: string }
  | { type: "skillUsed"; skill: string }
  | { type: "unitRecruited"; unit: UnitInstanceId; defId: string }
  | { type: "unitActivated"; unit: UnitInstanceId; ability: number }
  | { type: "woundDiscarded"; count: number }
  | { type: "enemySpawned"; enemy: EnemyInstanceId; defId: string }
  | { type: "combatStarted"; enemies: EnemyInstanceId[] }
  | { type: "enemyBlocked"; enemy: EnemyInstanceId }
  | { type: "enemyDefeated"; enemy: EnemyInstanceId; fame: number }
  | { type: "damageAssigned"; enemy: EnemyInstanceId; wounds: number }
  | { type: "combatEnded" }
  | { type: "turnEnded"; player: PlayerId }
  | { type: "roundEnded"; round: number }
  | { type: "cityConquered"; site: SiteDefId; score: number }
  | { type: "gameEnded"; round: number; outcome: "victory" | "defeat"; score: number };

export interface LegalActionSet {
  epoch: number;
  player: PlayerId;
  actions: Action[];
}

export type ApplyError =
  | { code: "staleEpoch"; expected: number; got: number }
  | { code: "notLegal"; reason: string; action: Action }
  | { code: "invalidState"; message: string };

export interface ApplyResult {
  state: GameState;
  events: GameEvent[];
  legalActions: LegalActionSet;
  stateHash: string;
}

export type ApplyOutcome = { ok: true; result: ApplyResult } | { ok: false; error: ApplyError };

export interface GameConfig {
  seed: number;
}

export type CombatTerrain = Terrain;
export type { EnemyDef } from "@emberwold/shared";
