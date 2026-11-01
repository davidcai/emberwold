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
  TileId,
  Terrain,
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
}

type ActionPayload =
  | { type: "playCard"; card: CardInstanceId; mode: CardMode; mana?: ManaPayment }
  | { type: "playCardSideways"; card: CardInstanceId; as: SidewaysAs }
  | { type: "resolveChoice"; choiceId: string; optionIndex: number }
  | { type: "rest"; kind: "standard" | "slowRecovery"; discard: CardInstanceId[] }
  | { type: "moveTo"; target: Hex }
  | { type: "explore" }
  | { type: "enterSite" }
  | { type: "challengeRampaging" }
  | { type: "buyHealing"; points: number }
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
  | { type: "cardPlayed"; card: CardInstanceId; defId: CardId; mode: CardMode | "sideways" }
  | { type: "choiceRequested"; choiceId: string; kind: PendingChoice["kind"]; options: string[] }
  | { type: "choiceResolved"; choiceId: string; optionIndex: number }
  | { type: "movePointsGained"; amount: number }
  | { type: "influenceGained"; amount: number }
  | { type: "manaGained"; color: ManaColor }
  | { type: "crystalGained"; color: BasicManaColor }
  | { type: "reputationChanged"; amount: number }
  | { type: "cardDrawn"; count: number }
  | { type: "rested"; kind: "standard" | "slowRecovery" }
  | { type: "woundGained"; amount: number }
  | { type: "healGained"; points: number }
  | { type: "heroMoved"; from: Hex; to: Hex; cost: number }
  | { type: "tileRevealed"; tile: TileId; origin: Hex }
  | { type: "siteEntered"; site: SiteDefId }
  | { type: "influenceSpent"; amount: number }
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
