import { bundle } from "@emberwold/content";
import { applyAction, createGame, getLegalActions } from "@emberwold/engine";
import type { Action, GameEvent, GameState } from "@emberwold/engine";
import { useEffect, useMemo, useState } from "react";
import type { ReactElement } from "react";

import { Board } from "./board";

export interface EmberwoldDebug {
  readonly state: GameState;
  readonly legal: readonly Action[];
  readonly events: readonly GameEvent[];
  readonly seed: number;
}

function defFor(state: GameState, instance: string): { name: string } | undefined {
  const defId = (state.cardInstances as Readonly<Record<string, string>>)[instance];
  return defId === undefined ? undefined : bundle.cards[defId];
}

function actionLabel(action: Action, state: GameState): string {
  switch (action.type) {
    case "playCard": {
      const def = defFor(state, action.card);
      return `${action.mode} · ${def?.name ?? action.card}`;
    }
    case "playCardSideways": {
      const def = defFor(state, action.card);
      return `${action.as} · ${def?.name ?? action.card}`;
    }
    case "moveTo":
      return `move to ${action.target.q},${action.target.r}`;
    case "explore":
      return "explore the frontier";
    case "enterSite":
      return "enter site";
    case "challengeRampaging":
      return "challenge enemies";
    case "buyHealing":
      return `buy ${action.points} healing`;
    case "rest":
      return `${action.kind} rest`;
    case "resolveChoice":
      return `choose option ${action.optionIndex + 1}`;
    case "assignDamage":
      return "assign damage";
    case "assignAttack":
      return "assign attack";
    case "endCombatPhase":
      return "end combat phase";
    case "endTurn":
      return "end turn";
    default:
      return "unknown action";
  }
}

function cardActionsFor(legal: readonly Action[], state: GameState, card: string): Action[] {
  return legal.filter(
    (action) =>
      (action.type === "playCard" || action.type === "playCardSideways") &&
      action.card === card &&
      (state.cardInstances as Readonly<Record<string, string>>)[card] !== undefined,
  );
}

export function App(): ReactElement {
  const [seedText, setSeedText] = useState("1");
  const [seed, setSeed] = useState(1);
  const [state, setState] = useState<GameState>(() => createGame({ seed: 1 }, bundle).state);
  const [events, setEvents] = useState<readonly GameEvent[]>([]);
  const legal = useMemo(() => getLegalActions(state, bundle).actions, [state]);
  const player = state.players[0];
  const cardActionSet = useMemo(
    () =>
      legal.filter((action) => action.type === "playCard" || action.type === "playCardSideways"),
    [legal],
  );
  const otherActions = legal.filter(
    (action) => action.type !== "playCard" && action.type !== "playCardSideways",
  );

  useEffect(() => {
    window.__EMBERWOLD__ = { state, legal, events, seed };
  }, [state, legal, events, seed]);

  function newRun(): void {
    const parsed = Number.parseInt(seedText, 10);
    const nextSeed = Number.isFinite(parsed) ? parsed : 1;
    setSeed(nextSeed);
    setState(createGame({ seed: nextSeed }, bundle).state);
    setEvents([]);
  }

  function dispatch(action: Action): void {
    const outcome = applyAction(state, action, bundle);
    if (!outcome.ok) {
      return;
    }
    setState(outcome.result.state);
    setEvents((previous) => [...previous, ...outcome.result.events]);
  }

  const indexOf = (action: Action): number => legal.indexOf(action);

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <h1>Emberwold</h1>
          <p className="subtitle">T0 spike · placeholder art · no rules in the client</p>
        </div>
        <div className="controls">
          <label>
            seed
            <input
              data-testid="seed"
              value={seedText}
              onChange={(event) => setSeedText(event.target.value)}
              inputMode="numeric"
            />
          </label>
          <button type="button" data-testid="new-run" onClick={newRun}>
            New run
          </button>
        </div>
      </header>

      <main>
        <section className="board-panel">
          <Board state={state} />
        </section>

        <aside className="sidebar">
          <section className="status" data-testid="status">
            <span>round {state.round}</span>
            <span>move {state.turn.movePoints}</span>
            <span>influence {state.turn.influence}</span>
            <span>fame {player?.fame ?? 0}</span>
            <span>hand {player?.hand.length ?? 0}</span>
            {state.gameOver ? <strong>game over</strong> : null}
          </section>

          {state.combat !== null ? (
            <section className="panel combat" data-testid="combat">
              <h2>Combat · {state.combat.phase}</h2>
              <ul>
                {state.combat.enemies.map((enemy) => {
                  const def = bundle.enemies[enemy.defId];
                  return (
                    <li key={enemy.instanceId}>
                      {def?.name ?? enemy.defId} · attack {def?.attack} · armor {def?.armor}
                      {enemy.blocked ? " · blocked" : ""}
                      {enemy.defeated ? " · defeated" : ""}
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : null}

          <section className="panel">
            <h2>Hand</h2>
            <ul className="hand" data-testid="hand">
              {(player?.hand ?? []).map((instance) => {
                const def = defFor(state, instance);
                const actions = cardActionsFor(cardActionSet, state, instance);
                return (
                  <li key={instance} className="card">
                    <strong>{def?.name ?? instance}</strong>
                    <div className="card-actions">
                      {actions.map((action) => (
                        <button
                          type="button"
                          key={`${action.type}-${indexOf(action)}`}
                          data-testid="action"
                          data-index={indexOf(action)}
                          onClick={() => dispatch(action)}
                        >
                          {actionLabel(action, state)}
                        </button>
                      ))}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="panel">
            <h2>Actions</h2>
            <div className="actions">
              {otherActions.map((action) => (
                <button
                  type="button"
                  key={`${action.type}-${indexOf(action)}`}
                  data-testid="action"
                  data-index={indexOf(action)}
                  onClick={() => dispatch(action)}
                >
                  {actionLabel(action, state)}
                </button>
              ))}
            </div>
          </section>

          <section className="panel log">
            <h2>Events</h2>
            <ul data-testid="events">
              {events
                .slice(-12)
                .reverse()
                .map((event, index) => (
                  <li key={`${event.type}-${index}`}>{event.type}</li>
                ))}
            </ul>
          </section>
        </aside>
      </main>
    </div>
  );
}
