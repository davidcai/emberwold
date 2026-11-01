/**
 * Splits the legal action list into the groups the sidebar renders. Every legal action lands in
 * exactly one group, and anything this client has no dedicated panel for goes to `fallback`, so
 * the UI can never hide an action that the engine allows (important for replay tests).
 */
import type { Action, GameState } from "@emberwold/engine";

export interface ActionEntry {
  readonly action: Action;
  readonly index: number;
}

export interface ActionGroups {
  readonly tactic: ActionEntry[];
  readonly choice: ActionEntry[];
  readonly combat: ActionEntry[];
  readonly hand: ActionEntry[];
  readonly turn: ActionEntry[];
  readonly site: ActionEntry[];
  readonly retinue: ActionEntry[];
  readonly fallback: ActionEntry[];
}

export function groupActions(state: GameState, legal: readonly Action[]): ActionGroups {
  const player = state.players[0];
  const hand = new Set<string>(player?.hand ?? []);
  const groups: {
    tactic: ActionEntry[];
    choice: ActionEntry[];
    combat: ActionEntry[];
    hand: ActionEntry[];
    turn: ActionEntry[];
    site: ActionEntry[];
    retinue: ActionEntry[];
    fallback: ActionEntry[];
  } = {
    tactic: [],
    choice: [],
    combat: [],
    hand: [],
    turn: [],
    site: [],
    retinue: [],
    fallback: [],
  };

  legal.forEach((action, index) => {
    const entry: ActionEntry = { action, index };
    switch (action.type) {
      case "chooseTactic":
        groups.tactic.push(entry);
        break;
      case "resolveChoice":
        groups.choice.push(entry);
        break;
      case "playCard":
      case "playCardSideways":
      case "discardCard":
        if (hand.has(action.card)) {
          groups.hand.push(entry);
        } else {
          groups.fallback.push(entry);
        }
        break;
      case "assignDamage":
      case "assignAttack":
      case "endCombatPhase":
        groups.combat.push(entry);
        break;
      case "moveTo":
      case "explore":
      case "challengeRampaging":
      case "rest":
      case "endTurn":
        groups.turn.push(entry);
        break;
      case "enterSite":
      case "buyHealing":
      case "buyAdvancedAction":
      case "buySpell":
      case "discardGladeWound":
      case "recruitUnit":
        groups.site.push(entry);
        break;
      case "useSkill":
      case "activateUnit":
        groups.retinue.push(entry);
        break;
      default:
        groups.fallback.push(entry);
        break;
    }
  });

  return groups;
}
