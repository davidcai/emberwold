/** Deterministic random-legal policy used by play-cli and fuzz (independent of game RNG). */
import type { Action, GameState } from "@emberwold/engine";
import { getLegalActions } from "@emberwold/engine";
import type { ContentBundle } from "@emberwold/shared";

export function pickAction(state: GameState, content: ContentBundle, cursor: number): Action {
  const actions = getLegalActions(state, content).actions;
  if (actions.length === 0) {
    throw new Error("policy: no legal actions");
  }
  const mixed = Math.imul(cursor + 1, 2654435761) >>> 0;
  return actions[mixed % actions.length] as Action;
}

export function describeAction(action: Action): string {
  const { epoch: _epoch, ...rest } = action;
  return JSON.stringify(rest);
}
