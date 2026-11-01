/**
 * App shell for the First Conquest client. Owns the run: creates games, applies legal actions,
 * autosaves to localStorage, keeps an in-memory undo stack and exposes the state to Playwright
 * through window.__EMBERWOLD__.
 */
import { bundle, contentHash } from "@emberwold/content";
import {
  applyAction,
  createGame,
  getLegalActions,
  type Action,
  type GameEvent,
  type GameResult,
  type GameState,
} from "@emberwold/engine";
import { useEffect, useMemo, useState } from "react";
import type { ReactElement } from "react";

import { Board } from "./board";
import { groupActions } from "./groups";
import {
  ChoicePanel,
  CombatPanel,
  DebriefPanel,
  EventsPanel,
  FallbackPanel,
  HandPanel,
  LegendPanel,
  RetinuePanel,
  SitePanel,
  StatusPanel,
  TacticPanel,
  TurnPanel,
  TutorialPanel,
} from "./panels";
import { SAVE_VERSION, clearSave, loadSave, writeSave } from "./save";
import { currentMapSite } from "./text";

export interface EmberwoldDebug {
  readonly state: GameState;
  readonly legal: readonly Action[];
  readonly events: readonly GameEvent[];
  readonly seed: number;
  readonly result: GameResult | null;
}

interface Run {
  readonly seed: number;
  readonly state: GameState;
  readonly events: readonly GameEvent[];
}

function createRun(seed: number): Run {
  // Creation events are not part of a run's history; the event log starts with the first action.
  return { seed, state: createGame({ seed }, bundle).state, events: [] };
}

function parseSeed(text: string): number {
  const parsed = Number.parseInt(text, 10);
  return Number.isFinite(parsed) ? parsed : 1;
}

export function App(): ReactElement {
  const [bootSave] = useState(() => loadSave(contentHash));
  const [resumeOffered, setResumeOffered] = useState<boolean>(bootSave !== null);
  const [seedText, setSeedText] = useState("1");
  const [run, setRun] = useState<Run>(() => createRun(1));
  const [undoStack, setUndoStack] = useState<readonly Run[]>([]);
  const [tutorialDismissed, setTutorialDismissed] = useState(false);

  const legal = useMemo(() => getLegalActions(run.state, bundle).actions, [run]);
  const groups = useMemo(() => groupActions(run.state, legal), [run.state, legal]);
  const heroTurn = useMemo(
    () => 1 + run.events.filter((event) => event.type === "turnStarted").length,
    [run.events],
  );

  // Autosave first, debug bridge second: a page reload must always find the current run saved.
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
    window.__EMBERWOLD__ = {
      state: run.state,
      legal,
      events: run.events,
      seed: run.seed,
      result: run.state.result,
    };
  }, [run, legal, resumeOffered]);

  function newRun(): void {
    const seed = parseSeed(seedText);
    clearSave();
    setResumeOffered(false);
    setRun(createRun(seed));
    setUndoStack([]);
    setTutorialDismissed(false);
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
            <p className="subtitle">First Conquest · T1 vertical slice</p>
          </div>
        </header>
        <main className="resume-main">
          <section className="panel resume" data-testid="resume">
            <h2>Saved run</h2>
            <p>
              seed {bootSave.seed} · round {bootSave.state.round} · action{" "}
              {bootSave.state.actionEpoch} · {bootSave.events.length} events
            </p>
            <p className="muted-line">
              Continue where you left off, or start over. A new run discards this saved run.
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

  const site = currentMapSite(run.state);
  const showSitePanel = site !== undefined || groups.site.length > 0;

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <h1>Emberwold</h1>
          <p className="subtitle">First Conquest · T1 vertical slice</p>
        </div>
        <div className="controls">
          <label>
            seed{" "}
            <input
              data-testid="seed"
              value={seedText}
              inputMode="numeric"
              onChange={(event) => setSeedText(event.target.value)}
            />
          </label>
          <button type="button" data-testid="undo" disabled={undoStack.length === 0} onClick={undo}>
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
          <DebriefPanel state={run.state} />
          {heroTurn > 3 || tutorialDismissed ? null : (
            <TutorialPanel heroTurn={heroTurn} onDismiss={() => setTutorialDismissed(true)} />
          )}
          <StatusPanel state={run.state} />
          {groups.tactic.length === 0 && run.state.tacticChoice === null ? null : (
            <TacticPanel entries={groups.tactic} state={run.state} onAction={dispatch} />
          )}
          {groups.choice.length === 0 && run.state.pending === null ? null : (
            <ChoicePanel entries={groups.choice} state={run.state} onAction={dispatch} />
          )}
          {groups.combat.length === 0 && run.state.combat === null ? null : (
            <CombatPanel entries={groups.combat} state={run.state} onAction={dispatch} />
          )}
          <HandPanel entries={groups.hand} state={run.state} onAction={dispatch} />
          <TurnPanel entries={groups.turn} state={run.state} onAction={dispatch} />
          {showSitePanel ? (
            <SitePanel entries={groups.site} state={run.state} onAction={dispatch} />
          ) : null}
          <RetinuePanel entries={groups.retinue} state={run.state} onAction={dispatch} />
          <FallbackPanel entries={groups.fallback} state={run.state} onAction={dispatch} />
          <LegendPanel />
          <EventsPanel state={run.state} events={run.events} />
        </aside>
      </main>
    </div>
  );
}
