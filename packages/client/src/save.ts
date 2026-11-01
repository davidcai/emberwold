import type { GameEvent, GameState } from "@emberwold/engine";

/**
 * Autosave format for the client. The engine is untouched: a save is a JSON snapshot of the
 * public `GameState` plus the events the client has shown so far. `schemaVersion` and
 * `contentHash` are checked on load so an incompatible engine schema or a rebuilt content
 * bundle starts a fresh run instead of restoring a state the engine no longer understands.
 */
export const SAVE_KEY = "emberwold.save.v1";
export const SAVE_VERSION = 1;

export interface SaveData {
  readonly version: typeof SAVE_VERSION;
  readonly contentHash: string;
  readonly seed: number;
  readonly state: GameState;
  readonly events: readonly GameEvent[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Parse and validate a serialized save. Exported for tests; returns null on anything suspicious. */
export function parseSave(raw: string | null, expectedContentHash: string): SaveData | null {
  if (raw === null) {
    return null;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!isRecord(parsed)) {
    return null;
  }
  if (parsed.version !== SAVE_VERSION) {
    return null;
  }
  if (parsed.contentHash !== expectedContentHash) {
    return null;
  }
  if (typeof parsed.seed !== "number" || !Number.isFinite(parsed.seed)) {
    return null;
  }
  if (!Array.isArray(parsed.events)) {
    return null;
  }
  const state = parsed.state;
  if (!isRecord(state)) {
    return null;
  }
  if (state.schemaVersion !== 2 || state.contentHash !== expectedContentHash) {
    return null;
  }
  if (!Array.isArray(state.players) || state.players.length === 0) {
    return null;
  }
  if (!isRecord(state.map) || typeof state.actionEpoch !== "number") {
    return null;
  }
  return {
    version: SAVE_VERSION,
    contentHash: expectedContentHash,
    seed: parsed.seed,
    state: state as unknown as GameState,
    events: parsed.events as GameEvent[],
  };
}

export function loadSave(expectedContentHash: string): SaveData | null {
  try {
    return parseSave(window.localStorage.getItem(SAVE_KEY), expectedContentHash);
  } catch {
    // Storage can be unavailable (private mode, disabled cookies); run without persistence then.
    return null;
  }
}

export function writeSave(data: SaveData): boolean {
  try {
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

export function clearSave(): void {
  try {
    window.localStorage.removeItem(SAVE_KEY);
  } catch {
    // Nothing to clear if storage is unavailable.
  }
}
