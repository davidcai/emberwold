import { bundle, contentHash } from "@emberwold/content";
import { applyAction, createGame, getLegalActions } from "@emberwold/engine";
import type { Action, GameEvent, GameState } from "@emberwold/engine";
import { useEffect, useMemo, useState } from "react";
import type { ReactElement } from "react";

import { Board } from "./board";
import { SAVE_VERSION, clearSave, loadSave, writeSave } from "./save";

export interface EmberwoldDebug {
  readonly state: GameState;
  readonly legal: readonly Action[];
  readonly events: readonly GameEvent[];
  readonly seed: number;
}

/** Everything that has to be snapshotted for undo and for the autosave. */
interface Run {
  readonly seed: number;
  readonly state: GameState;
  readonly events: readonly GameEvent[];
}

function createRun(seed: number): Run {
  const created = createGame({ seed }, bundle);
  return { seed, state: created.state, events: [] };
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
      // A future engine action type must not blank the whole client; it just gets a dull label.
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
  // A save is restored only after the player asks for it, so the run on screen is never
  // overwritten by the autosave before the "Continue" decision.
  const [bootSave] = useState(() => loadSave(contentHash));
  const [resumeOffered, setResumeOffered] = useState(bootSave !== null);
  const [seedText, setSeedText] = useState("1");
  const [run, setRun] = useState<Run>(() => createRun(1));
  const [undoStack, setUndoStack] = useState<readonly Run[]>([]);
  const legal = useMemo(() => getLegalActions(run.state, bundle).actions, [run]);

  // Declared before the debug bridge below: e2e reads window.__EMBERWOLD__ after every action
  // and must never observe a state that has not reached localStorage yet.
  useEffect(() => {
    if (resumeOffered) {
      return;
    }
    writeSave({
      version: SAVE_VERSION,
      contentHash,
      seed: run.seed,
      state: run.state,
      events: run.events,
    });
  }, [run, resumeOffered]);

  useEffect(() => {
    if (resumeOffered) {
      return;
    }
    window.__EMBERWOLD__ = { state: run.state, legal, events: run.events, seed: run.seed };
  }, [run, legal, resumeOffered]);

  function newRun(): void {
    const parsed = Number.parseInt(seedText, 10);
    const nextSeed = Number.isFinite(parsed) ? parsed : 1;
    clearSave();
    setResumeOffered(false);
    setRun(createRun(nextSeed));
    setUndoStack([]);
  }

  function continueRun(): void {
    if (bootSave === null) {
      return;
    }
    setRun({ seed: bootSave.seed, state: bootSave.state, events: bootSave.events });
    setUndoStack([]);
    setSeedText(String(bootSave.seed));
    setResumeOffered(false);
  }

  function dispatch(action: Action): void {
    const outcome = applyAction(run.state, action, bundle);
    if (!outcome.ok) {
      return;
    }
    setUndoStack((previous) => [...previous, run]);
    setRun({
      seed: run.seed,
      state: outcome.result.state,
      events: [...run.events, ...outcome.result.events],
    });
  }

  function undo(): void {
    const previous = undoStack[undoStack.length - 1];
    if (previous === undefined) {
      return;
    }
    setRun(previous);
    setUndoStack(undoStack.slice(0, -1));
  }

  if (resumeOffered && bootSave !== null) {
    return (
      <div className="app">
        <header className="topbar">
          <div>
            <h1>Emberwold</h1>
            <p className="subtitle">T0 spike · placeholder art · no rules in the client</p>
          </div>
        </header>
        <main className="resume-main">
          <section className="panel resume" data-testid="resume">
            <h2>Saved run</h2>
            <p>
              seed {bootSave.seed} · round {bootSave.state.round} · action{" "}
              {bootSave.state.actionEpoch} · {bootSave.events.length} events
            </p>
            <div className="actions">
              <button type="button" data-testid="continue" onClick={continueRun}>
                Continue
              </button>
              <button type="button" data-testid="new-run" onClick={newRun}>
                New run
              </button>
            </div>
          </section>
        </main>
      </div>
    );
  }

  const player = run.state.players[0];
  const cardActionSet = legal.filter(
    (action) => action.type === "playCard" || action.type === "playCardSideways",
  );
  const otherActions = legal.filter(
    (action) => action.type !== "playCard" && action.type !== "playCardSideways",
  );

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
          <button type="button" data-testid="undo" onClick={undo} disabled={undoStack.length === 0}>
            Undo
          </button>
          <button type="button" data-testid="new-run" onClick={newRun}>
            New run
          </button>
          <span className="save-note">autosaves locally</span>
        </div>
      </header>

      <main>
        <section className="board-panel">
          <Board state={run.state} />
        </section>

        <aside className="sidebar">
          <section className="status" data-testid="status">
            <span>round {run.state.round}</span>
            <span>move {run.state.turn.movePoints}</span>
            <span>influence {run.state.turn.influence}</span>
            <span>fame {player?.fame ?? 0}</span>
            <span>hand {player?.hand.length ?? 0}</span>
            {run.state.gameOver ? <strong>game over</strong> : null}
          </section>

          {run.state.combat !== null ? (
            <section className="panel combat" data-testid="combat">
              <h2>Combat · {run.state.combat.phase}</h2>
              <ul>
                {run.state.combat.enemies.map((enemy) => {
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
                const def = defFor(run.state, instance);
                const actions = cardActionsFor(cardActionSet, run.state, instance);
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
                          {actionLabel(action, run.state)}
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
                  {actionLabel(action, run.state)}
                </button>
              ))}
            </div>
          </section>

          <section className="panel log">
            <h2>Events</h2>
            <ul data-testid="events">
              {run.events
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
