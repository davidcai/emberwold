/**
 * Sidebar panels for the First Conquest client. Every legal action is rendered exactly once as a
 * button with `data-testid="action"` + `data-index` (the index into the legal action list), which
 * is what the Playwright replay tests click.
 */
import { bundle } from "@emberwold/content";
import type { Action, GameEvent, GameState } from "@emberwold/engine";
import type { CombatType, Element, Hex, ManaColor } from "@emberwold/shared";
import type { ReactElement } from "react";

import type { ActionEntry } from "./groups";
import { boardHexAt } from "./hex";
import {
  COMBAT_TYPE_LABEL,
  ELEMENT_LABEL,
  TERRAIN_LABEL,
  actionLabel,
  cardDefByInstance,
  cardNameByInstance,
  choiceOptionLabel,
  commandSlotsFor,
  currentMapSite,
  currentSiteDef,
  effectSummary,
  enemiesAtPlayer,
  enemyNameByInstance,
  eventLabel,
  heroName,
  humanizeId,
  isWoundInstance,
  levelStatsFor,
  manaColorLabel,
  manaColorsForCrystals,
  nextLevelDef,
  offerCardName,
  paymentLabel,
  pendingDamageFor,
  plural,
  reasonLabel,
  skillNameById,
  skillUsageLabel,
  skillUsed,
  summarizeNames,
  tacticNameById,
  unitDefById,
  unitNameById,
  woundCount,
} from "./text";

const COMBAT_PHASE_LABEL: Readonly<Record<string, string>> = {
  rangedSiege: "ranged & siege",
  block: "block",
  assignDamage: "assign damage",
  attack: "attack",
};

const TUTORIAL_TEXT: readonly string[] = [
  "Pick a tactic for the round, then play cards from your hand to move, explore and fight. End your turn when your move and influence are spent — the dummy deck flips after each hero turn.",
  "The dummy deck is the round clock. When it runs out the round ends after one final turn, and the next round flips between day and night with different terrain costs.",
  "Fame levels you up and unlocks skills. Spend influence at sites to heal, train advanced actions, buy spells or recruit units — then march on the city in the east before the round cap.",
];

interface EntriesProps {
  readonly entries: readonly ActionEntry[];
  readonly state: GameState;
  readonly onAction: (action: Action) => void;
}

export function ActionButton({
  entry,
  label,
  onAction,
}: {
  readonly entry: ActionEntry;
  readonly label: string;
  readonly onAction: (action: Action) => void;
}): ReactElement {
  return (
    <button
      type="button"
      className="action-button"
      data-testid="action"
      data-index={entry.index}
      data-action={entry.action.type}
      onClick={() => onAction(entry.action)}
    >
      {label}
    </button>
  );
}

function Chip({
  color,
  count,
}: {
  readonly color: ManaColor;
  readonly count?: number;
}): ReactElement {
  return (
    <span className="mana-chip" data-color={color}>
      {count === undefined ? manaColorLabel(color) : `${manaColorLabel(color)} ${count}`}
    </span>
  );
}

export function StatusPanel({ state }: { readonly state: GameState }): ReactElement {
  const player = state.players[0];
  const level = player?.level ?? 1;
  const stats = levelStatsFor(level);
  const fame = player?.fame ?? 0;
  const next = nextLevelDef(level);
  const fameTarget = next?.fame ?? null;
  const progress =
    fameTarget === null || fameTarget === 0
      ? 100
      : Math.min(100, Math.max(0, Math.round((fame / fameTarget) * 100)));
  const crystals = player === undefined ? [] : manaColorsForCrystals(player.crystals);
  const usedSlots = player?.units.length ?? 0;

  return (
    <section className="panel status-panel" data-testid="status">
      <h2 className="status-head">
        <span>{bundle.scenario.name ?? "First Conquest"}</span>
        <span className="badge" data-testid="round">
          round {state.round} / {bundle.scenario.roundCap}
        </span>
        <span
          className="badge badge-ember"
          data-testid="time-of-day"
          data-time-of-day={state.timeOfDay}
        >
          {state.timeOfDay}
        </span>
      </h2>
      {player !== undefined ? (
        <p className="muted-line">
          {heroName(player.heroId)} · level {level} · fame {fame}
          {fameTarget === null ? " (max)" : ` / ${fameTarget}`}
        </p>
      ) : null}
      <div className="fame-bar" aria-hidden="true">
        <div className="fame-fill" style={{ width: `${progress}%` }} />
      </div>
      <div className="stat-grid">
        <span>
          move <strong>{state.turn.movePoints}</strong>
        </span>
        <span>
          influence <strong>{state.turn.influence}</strong>
        </span>
        <span>
          hand <strong>{player?.hand.length ?? 0}</strong> / {stats.handLimit}
        </span>
        <span>
          armor <strong>{stats.armor}</strong>
        </span>
        <span>
          slots <strong>{usedSlots}</strong> / {commandSlotsFor(level)}
        </span>
        <span>
          wounds <strong>{woundCount(state)}</strong>
        </span>
        <span>
          reputation <strong>{player?.reputation ?? 0}</strong>
        </span>
      </div>
      <p className="muted-line">
        tactic {state.tactics.human === null ? "—" : tacticNameById(state.tactics.human)}
        {state.tactics.dummy === null ? "" : ` · dummy ${tacticNameById(state.tactics.dummy)}`}
      </p>
      {state.dummy !== null ? (
        <p className="muted-line">
          dummy deck {state.dummy.cardsRemaining} / {state.dummy.deckSize}
          {state.endOfRoundAnnounced ? " · end of round announced, final turn" : ""}
        </p>
      ) : null}
      <div className="chips" data-testid="crystals">
        <span className="chip-label">crystals</span>
        {crystals.map((entry) =>
          entry.count > 0 ? (
            <Chip key={entry.color} color={entry.color} count={entry.count} />
          ) : null,
        )}
        {crystals.every((entry) => entry.count === 0) ? (
          <span className="muted-line">none</span>
        ) : null}
      </div>
      <div className="chips" data-testid="source">
        <span className="chip-label">source</span>
        {state.source.map((die, index) => (
          <Chip key={`${die.color}-${index}`} color={die.color} />
        ))}
        {state.source.map((die, index) =>
          die.used ? (
            <span key={`used-${index}`} className="muted-line">
              used: {manaColorLabel(die.color)}
            </span>
          ) : null,
        )}
      </div>
      {player !== undefined && player.manaTokens.length > 0 ? (
        <div className="chips">
          <span className="chip-label">mana tokens</span>
          {player.manaTokens.map((token, index) => (
            <Chip key={`${token.color}-${index}`} color={token.color} />
          ))}
        </div>
      ) : null}
      {state.gameOver ? <p className="badge badge-ember">run finished</p> : null}
    </section>
  );
}

export function TutorialPanel({
  heroTurn,
  onDismiss,
}: {
  readonly heroTurn: number;
  readonly onDismiss: () => void;
}): ReactElement | null {
  const text = TUTORIAL_TEXT[heroTurn - 1];
  if (text === undefined) {
    return null;
  }
  return (
    <section className="panel tutorial-panel" data-testid="tutorial">
      <h2>First turns · {heroTurn} / 3</h2>
      <p>{text}</p>
      <button type="button" data-testid="tutorial-dismiss" onClick={onDismiss}>
        Got it
      </button>
    </section>
  );
}

export function TacticPanel({ entries, state, onAction }: EntriesProps): ReactElement {
  return (
    <section className="panel tactic-panel">
      <h2>Tactics{state.tacticChoice === null ? "" : " · choose one"}</h2>
      {state.tactics.human === null ? null : (
        <p className="muted-line">your tactic: {tacticNameById(state.tactics.human)}</p>
      )}
      {state.tactics.dummy === null ? null : (
        <p className="muted-line">dummy tactic: {tacticNameById(state.tactics.dummy)}</p>
      )}
      {state.tactics.used.length === 0 ? null : (
        <p className="muted-line">
          used:{" "}
          {summarizeNames(
            state.tactics.used.map((tactic) => tacticNameById(tactic)),
            4,
          )}
        </p>
      )}
      <div className="actions">
        {entries.map((entry) => (
          <ActionButton
            key={entry.index}
            entry={entry}
            label={
              entry.action.type === "chooseTactic"
                ? tacticNameById(entry.action.tactic)
                : actionLabel(entry.action, state)
            }
            onAction={onAction}
          />
        ))}
      </div>
    </section>
  );
}

export function ChoicePanel({ entries, state, onAction }: EntriesProps): ReactElement {
  const pending = state.pending;
  return (
    <section className="panel choice-panel">
      <h2>
        Choose
        {pending === null
          ? ""
          : pending.kind === "discardCost"
            ? " · discard a card"
            : pending.kind === "readyUnits"
              ? " · ready units"
              : " · effect"}
      </h2>
      {pending !== null && pending.kind === "discardCost" ? (
        <p className="muted-line">
          eligible:{" "}
          {summarizeNames(
            pending.eligibleCards.map((card) => cardNameByInstance(state, card)),
            6,
          )}
        </p>
      ) : null}
      <div className="actions">
        {entries.map((entry) => (
          <ActionButton
            key={entry.index}
            entry={entry}
            label={choiceOptionLabel(entry.action, state)}
            onAction={onAction}
          />
        ))}
      </div>
    </section>
  );
}

function combatActionLabel(action: Action, state: GameState): string {
  switch (action.type) {
    case "assignDamage":
      return `take the damage from ${enemyNameByInstance(state, action.enemy)}`;
    case "assignAttack":
      return `defeat ${enemyNameByInstance(state, action.enemy)}`;
    case "endCombatPhase": {
      const phase = state.combat === null ? "combat" : COMBAT_PHASE_LABEL[state.combat.phase];
      return `end ${phase} phase`;
    }
    default:
      return actionLabel(action, state);
  }
}

interface PoolContribution {
  readonly amount: number;
  readonly element: Element;
  readonly combatType?: CombatType;
}

function poolSummary(pool: readonly PoolContribution[]): string {
  if (pool.length === 0) {
    return "none";
  }
  return pool
    .map((entry) => {
      const type = entry.combatType === undefined ? "" : ` ${COMBAT_TYPE_LABEL[entry.combatType]}`;
      return `${entry.amount}${type} ${ELEMENT_LABEL[entry.element]}`;
    })
    .join(" + ");
}

export function CombatPanel({ entries, state, onAction }: EntriesProps): ReactElement {
  const combat = state.combat;
  return (
    <section className="panel combat" data-testid="combat">
      <h2>
        Combat · {combat === null ? "active" : (COMBAT_PHASE_LABEL[combat.phase] ?? combat.phase)}
      </h2>
      {combat === null ? null : (
        <>
          <ul className="combat-list">
            {combat.enemies.map((enemy) => {
              const def = bundle.enemies[enemy.defId];
              const damage = pendingDamageFor(state, enemy.instanceId);
              return (
                <li key={enemy.instanceId}>
                  <strong>{def?.name ?? enemy.defId}</strong>
                  <span className="muted-line">
                    {" "}
                    attack {def?.attack ?? "?"}{" "}
                    {def === undefined ? "" : ELEMENT_LABEL[def.attackElement]} · armor{" "}
                    {def?.armor ?? "?"}
                    {enemy.blocked ? " · blocked" : ""}
                    {enemy.defeated ? " · defeated" : ""}
                    {damage > 0 ? ` · damage ${damage}` : ""}
                  </span>
                </li>
              );
            })}
          </ul>
          <p className="muted-line">attack pool: {poolSummary(combat.attackPool)}</p>
          <p className="muted-line">block pool: {poolSummary(combat.blockPool)}</p>
        </>
      )}
      <div className="actions">
        {entries.map((entry) => (
          <ActionButton
            key={entry.index}
            entry={entry}
            label={combatActionLabel(entry.action, state)}
            onAction={onAction}
          />
        ))}
      </div>
    </section>
  );
}

function cardActionLabel(action: Action, state: GameState): string {
  switch (action.type) {
    case "playCard": {
      const def = cardDefByInstance(state, action.card);
      const effect =
        def === undefined
          ? undefined
          : action.mode === "powered"
            ? def.effects.powered
            : def.effects.basic;
      const effectText =
        effect === undefined || effect === null ? "" : ` · ${effectSummary(effect)}`;
      const mana = action.mana === undefined ? "" : ` · ${paymentLabel(action.mana, state)}`;
      return `${action.mode}${effectText}${mana}`;
    }
    case "playCardSideways":
      return `sideways · ${action.as}`;
    case "discardCard":
      return "discard";
    default:
      return actionLabel(action, state);
  }
}

export function HandPanel({ entries, state, onAction }: EntriesProps): ReactElement {
  const player = state.players[0];
  const hand = player?.hand ?? [];
  const handSet = new Set<string>(hand);
  const byCard = new Map<string, ActionEntry[]>();
  const extras: ActionEntry[] = [];
  for (const entry of entries) {
    const card =
      entry.action.type === "playCard" ||
      entry.action.type === "playCardSideways" ||
      entry.action.type === "discardCard"
        ? entry.action.card
        : undefined;
    if (card !== undefined && handSet.has(card)) {
      const list = byCard.get(card) ?? [];
      list.push(entry);
      byCard.set(card, list);
    } else {
      extras.push(entry);
    }
  }

  return (
    <section className="panel hand-panel">
      <h2>
        Hand · {hand.length} / {levelStatsFor(player?.level ?? 1).handLimit}
      </h2>
      <ul className="hand" data-testid="hand">
        {hand.map((instance) => {
          const def = cardDefByInstance(state, instance);
          const actions = byCard.get(instance) ?? [];
          const wound = isWoundInstance(state, instance);
          return (
            <li key={instance} className={wound ? "card card-wound" : "card"}>
              <div className="card-head">
                {def === undefined ? null : (
                  <span className="color-dot" data-color={def.color} aria-hidden="true" />
                )}
                <strong>{def?.name ?? cardNameByInstance(state, instance)}</strong>
                {def === undefined ? null : (
                  <span className="card-meta">sideways {def.sidewaysValue}</span>
                )}
              </div>
              {def === undefined ? null : (
                <p className="card-effects">
                  {effectSummary(def.effects.basic)}
                  {def.effects.powered === null
                    ? ""
                    : ` · powered (${
                        def.poweredBy === null
                          ? "none"
                          : def.poweredBy === "any_basic"
                            ? "any basic"
                            : manaColorLabel(def.poweredBy)
                      }): ${effectSummary(def.effects.powered)}`}
                </p>
              )}
              <div className="card-actions">
                {actions.map((entry) => (
                  <ActionButton
                    key={entry.index}
                    entry={entry}
                    label={cardActionLabel(entry.action, state)}
                    onAction={onAction}
                  />
                ))}
              </div>
            </li>
          );
        })}
        {hand.length === 0 ? <li className="muted-line">hand empty</li> : null}
      </ul>
      {extras.length > 0 ? (
        <div className="actions">
          {extras.map((entry) => (
            <ActionButton
              key={entry.index}
              entry={entry}
              label={actionLabel(entry.action, state)}
              onAction={onAction}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}

function moveLabel(state: GameState, target: Hex): string {
  const boardHex = boardHexAt(state, target);
  if (boardHex === undefined) {
    return `move to ${target.q},${target.r}`;
  }
  const terrain = boardHex.revealed ? TERRAIN_LABEL[boardHex.terrain] : "unexplored";
  return `move to ${target.q},${target.r} · ${terrain}`;
}

export function TurnPanel({ entries, state, onAction }: EntriesProps): ReactElement | null {
  if (entries.length === 0) {
    return null;
  }
  const movement: ActionEntry[] = [];
  const challenge: ActionEntry[] = [];
  const rest: ActionEntry[] = [];
  const end: ActionEntry[] = [];
  const other: ActionEntry[] = [];
  for (const entry of entries) {
    switch (entry.action.type) {
      case "moveTo":
      case "explore":
        movement.push(entry);
        break;
      case "challengeRampaging":
        challenge.push(entry);
        break;
      case "rest":
        rest.push(entry);
        break;
      case "endTurn":
        end.push(entry);
        break;
      default:
        other.push(entry);
        break;
    }
  }

  const challengeNames = enemiesAtPlayer(state);

  return (
    <section className="panel turn-panel">
      <h2>Actions</h2>
      {movement.length === 0 ? null : (
        <div className="action-group">
          <h3>Move</h3>
          <div className="actions">
            {movement.map((entry) => (
              <ActionButton
                key={entry.index}
                entry={entry}
                label={
                  entry.action.type === "moveTo"
                    ? moveLabel(state, entry.action.target)
                    : `explore · reveal a tile (${bundle.rulesConstants.tileRevealCost} move)`
                }
                onAction={onAction}
              />
            ))}
          </div>
        </div>
      )}
      {challenge.length === 0 ? null : (
        <div className="action-group">
          <h3>Fight</h3>
          <div className="actions">
            {challenge.map((entry) => (
              <ActionButton
                key={entry.index}
                entry={entry}
                label={
                  challengeNames.length === 0
                    ? "challenge rampaging enemies"
                    : `challenge ${summarizeNames(challengeNames, 2)}`
                }
                onAction={onAction}
              />
            ))}
          </div>
        </div>
      )}
      {rest.length === 0 ? null : (
        <div className="action-group">
          <h3>Rest</h3>
          <div className="actions">
            {rest.map((entry) => (
              <ActionButton
                key={entry.index}
                entry={entry}
                label={
                  entry.action.type === "rest"
                    ? entry.action.kind === "standard"
                      ? `rest · discard ${plural(entry.action.discard.length, "card")}`
                      : "slow recovery · discard a wound"
                    : actionLabel(entry.action, state)
                }
                onAction={onAction}
              />
            ))}
          </div>
        </div>
      )}
      {end.length === 0 && other.length === 0 ? null : (
        <div className="action-group">
          <h3>End</h3>
          <div className="actions">
            {[...other, ...end].map((entry) => (
              <ActionButton
                key={entry.index}
                entry={entry}
                label={actionLabel(entry.action, state)}
                onAction={onAction}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function siteActionLabel(action: Action, state: GameState): string {
  switch (action.type) {
    case "enterSite":
      return "enter the site";
    case "buyHealing": {
      const rate = currentSiteDef(state)?.healing?.influencePerPoint;
      return rate === undefined
        ? `heal ${plural(action.points, "wound")}`
        : `heal ${plural(action.points, "wound")} · ${action.points * rate} influence`;
    }
    case "buyAdvancedAction":
      return `learn ${offerCardName("aa", action.index, state)} · ${
        bundle.rulesConstants.monasteryAaCost ?? 6
      } influence`;
    case "buySpell": {
      const mana = action.mana === undefined ? "matching mana" : paymentLabel(action.mana, state);
      return `buy ${offerCardName("spell", action.index, state)} · ${
        bundle.rulesConstants.spellCost ?? 7
      } influence + ${mana}`;
    }
    case "recruitUnit": {
      const def = unitDefById(state.offers.unit[action.index] ?? "");
      return `recruit ${unitNameById(state.offers.unit[action.index] ?? "")} · ${
        def?.influenceCost ?? "?"
      } influence`;
    }
    case "discardGladeWound":
      return "discard a wound";
    default:
      return actionLabel(action, state);
  }
}

export function SitePanel({ entries, state, onAction }: EntriesProps): ReactElement {
  const site = currentMapSite(state);
  const def = site === undefined ? undefined : currentSiteDef(state);
  return (
    <section className="panel site-panel">
      <h2>{def === undefined ? "Site" : `Site · ${def.name}`}</h2>
      {def === undefined ? null : (
        <p className="muted-line">
          {humanizeId(def.siteKind)} · {def.fortified ? "fortified" : "open"}
          {def.healing === null
            ? ""
            : ` · healing ${def.healing.influencePerPoint} influence per wound`}
        </p>
      )}
      {def === undefined || def.interaction.length === 0 ? null : (
        <p className="muted-line">
          interaction: {def.interaction.map((entry) => humanizeId(entry)).join(", ")}
        </p>
      )}
      <p className="muted-line">influence available: {state.turn.influence}</p>
      <div className="actions">
        {entries.map((entry) => (
          <ActionButton
            key={entry.index}
            entry={entry}
            label={siteActionLabel(entry.action, state)}
            onAction={onAction}
          />
        ))}
      </div>
      <div className="offers">
        {state.offers.aa.length === 0 ? null : (
          <p className="muted-line">
            advanced actions on offer:{" "}
            {summarizeNames(
              state.offers.aa.map((card) => bundle.cards[card]?.name ?? humanizeId(card)),
              4,
            )}
          </p>
        )}
        {state.offers.spell.length === 0 ? null : (
          <p className="muted-line">
            spells on offer:{" "}
            {summarizeNames(
              state.offers.spell.map((card) => bundle.cards[card]?.name ?? humanizeId(card)),
              4,
            )}
          </p>
        )}
        {state.offers.unit.length === 0 ? null : (
          <p className="muted-line">
            units on offer:{" "}
            {summarizeNames(
              state.offers.unit.map((unit) => unitNameById(unit)),
              4,
            )}
          </p>
        )}
      </div>
    </section>
  );
}

export function RetinuePanel({ entries, state, onAction }: EntriesProps): ReactElement | null {
  const player = state.players[0];
  if (player === undefined) {
    return null;
  }
  if (player.skills.length === 0 && player.units.length === 0 && entries.length === 0) {
    return null;
  }
  const matched = new Set<number>();

  return (
    <section className="panel retinue-panel">
      <h2>Skills & units</h2>
      {player.skills.length === 0 && player.units.length === 0 ? (
        <p className="muted-line">
          none yet — level up for skills, recruit units at inhabited sites.
        </p>
      ) : (
        <ul className="retinue-list">
          {player.skills.map((skillId) => {
            const def = bundle.skills?.[skillId];
            const used = skillUsed(state, skillId);
            const skillEntries = entries.filter(
              (entry) => entry.action.type === "useSkill" && entry.action.skill === skillId,
            );
            for (const entry of skillEntries) {
              matched.add(entry.index);
            }
            return (
              <li key={skillId} className="retinue-row">
                <div className="retinue-head">
                  <strong>{def?.name ?? skillNameById(skillId)}</strong>
                  <span className={used ? "badge" : "badge badge-ready"}>
                    {used ? "used" : "ready"}
                  </span>
                </div>
                <p className="muted-line">
                  {skillUsageLabel(def?.usageType)}
                  {def === undefined || def.effect === null
                    ? ""
                    : ` · ${effectSummary(def.effect)}`}
                </p>
                {def !== undefined && def.effect === null ? (
                  <p className="muted-line">effect not implemented in this build</p>
                ) : null}
                {skillEntries.length === 0 ? null : (
                  <div className="actions">
                    {skillEntries.map((entry) => (
                      <ActionButton
                        key={entry.index}
                        entry={entry}
                        label={`use ${def?.name ?? skillNameById(skillId)}`}
                        onAction={onAction}
                      />
                    ))}
                  </div>
                )}
              </li>
            );
          })}
          {player.units.map((unit) => {
            const def = unitDefById(unit.defId);
            const unitEntries = entries.filter(
              (entry) =>
                (entry.action.type === "activateUnit" || entry.action.type === "healUnit") &&
                entry.action.unit === unit.instanceId,
            );
            const healEntries = unitEntries.filter((entry) => entry.action.type === "healUnit");
            for (const entry of healEntries) {
              matched.add(entry.index);
            }
            return (
              <li key={unit.instanceId} className="retinue-row">
                <div className="retinue-head">
                  <strong>{def?.name ?? unitNameById(unit.defId)}</strong>
                  <span className={unit.ready ? "badge badge-ready" : "badge"}>
                    {unit.ready ? "ready" : "spent"}
                  </span>
                  {unit.wounds > 0 ? (
                    <span className="badge badge-wounded">
                      {unit.wounds === 1 ? "1 wound" : `${unit.wounds} wounds`}
                    </span>
                  ) : null}
                </div>
                <p className="muted-line">
                  level {def?.level ?? "?"} · armor {def?.armor ?? "?"}
                </p>
                {healEntries.length === 0 ? null : (
                  <p className="ability-actions">
                    {healEntries.map((entry) => (
                      <ActionButton
                        key={entry.index}
                        entry={entry}
                        label="heal unit"
                        onAction={onAction}
                      />
                    ))}
                  </p>
                )}
                {def === undefined ? null : (
                  <ul className="ability-list">
                    {def.abilities.map((ability, abilityIndex) => {
                      const abilityEntries = unitEntries.filter(
                        (entry) =>
                          entry.action.type === "activateUnit" &&
                          entry.action.ability === abilityIndex,
                      );
                      for (const entry of abilityEntries) {
                        matched.add(entry.index);
                      }
                      return (
                        <li key={abilityIndex}>
                          {ability.effect === null
                            ? humanizeId(ability.text)
                            : effectSummary(ability.effect)}
                          {ability.manaCost === null
                            ? ""
                            : ` · ${manaColorLabel(ability.manaCost)} mana`}
                          {abilityEntries.length === 0 ? null : (
                            <span className="ability-actions">
                              {abilityEntries.map((entry) => (
                                <ActionButton
                                  key={entry.index}
                                  entry={entry}
                                  label={`use ability ${abilityIndex + 1}`}
                                  onAction={onAction}
                                />
                              ))}
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {entries
        .filter((entry) => !matched.has(entry.index))
        .map((entry) => (
          <ActionButton
            key={entry.index}
            entry={entry}
            label={actionLabel(entry.action, state)}
            onAction={onAction}
          />
        ))}
    </section>
  );
}

export function FallbackPanel({ entries, state, onAction }: EntriesProps): ReactElement | null {
  if (entries.length === 0) {
    return null;
  }
  return (
    <section className="panel fallback-panel">
      <h2>Other actions</h2>
      <div className="actions">
        {entries.map((entry) => (
          <ActionButton
            key={entry.index}
            entry={entry}
            label={actionLabel(entry.action, state)}
            onAction={onAction}
          />
        ))}
      </div>
    </section>
  );
}

export function DebriefPanel({ state }: { readonly state: GameState }): ReactElement | null {
  if (!state.gameOver) {
    return null;
  }
  const result = state.result;
  const outcome = result?.outcome ?? "defeat";
  const player = state.players[0];
  return (
    <section className="panel debrief-panel" data-testid="debrief">
      <p className="debrief-kicker">run over · {bundle.scenario.name ?? "First Conquest"}</p>
      <h2 className="debrief-outcome" data-testid="debrief-outcome">
        {outcome}
      </h2>
      <p className="debrief-summary">
        {outcome === "victory"
          ? "The city is taken and the First Conquest is complete."
          : "The run ended before the city fell."}
      </p>
      <dl className="debrief-stats">
        <div>
          <dt>score</dt>
          <dd data-testid="debrief-score">{result?.score ?? 0}</dd>
        </div>
        <div>
          <dt>round</dt>
          <dd data-testid="debrief-round">{state.round}</dd>
        </div>
        <div>
          <dt>fame</dt>
          <dd data-testid="debrief-fame">{player?.fame ?? 0}</dd>
        </div>
        <div>
          <dt>city</dt>
          <dd data-testid="debrief-city">
            {result?.cityConquered === true ? "conquered" : "not conquered"}
          </dd>
        </div>
        <div>
          <dt>reason</dt>
          <dd data-testid="debrief-reason">{reasonLabel(result?.reason)}</dd>
        </div>
      </dl>
      <p className="muted-line">New run starts fresh; undo steps back one action.</p>
    </section>
  );
}

export function LegendPanel(): ReactElement {
  return (
    <details className="panel legend-panel" data-testid="legend">
      <summary>Legend & keywords</summary>
      <dl>
        <div>
          <dt>move</dt>
          <dd>spent moving between tiles; terrain costs change between day and night.</dd>
        </div>
        <div>
          <dt>influence</dt>
          <dd>spent at sites: healing, advanced actions, spells, recruiting units.</dd>
        </div>
        <div>
          <dt>fame</dt>
          <dd>levels you up; each level grants skill draws and better stats.</dd>
        </div>
        <div>
          <dt>crystals</dt>
          <dd>persistent mana, refreshed each round; spent to power cards or buy spells.</dd>
        </div>
        <div>
          <dt>source</dt>
          <dd>the round&apos;s rolled mana dice; each die is used once.</dd>
        </div>
        <div>
          <dt>dummy deck</dt>
          <dd>the round clock: it flips after each hero turn and ends the round when empty.</dd>
        </div>
        <div>
          <dt>round cap</dt>
          <dd>the city must fall before the final round ends, or the run is a defeat.</dd>
        </div>
      </dl>
    </details>
  );
}

export function EventsPanel({
  state,
  events,
}: {
  readonly state: GameState;
  readonly events: readonly GameEvent[];
}): ReactElement {
  const recent = events.slice(-16).reverse();
  return (
    <section className="panel log-panel">
      <h2>Events</h2>
      <ul data-testid="events">
        {recent.map((event, index) => (
          <li key={`${event.type}-${index}`}>{eventLabel(event, state)}</li>
        ))}
      </ul>
    </section>
  );
}
