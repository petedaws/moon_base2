export type FlagValue = boolean | number | string;

export interface GameState {
  version: number;
  room: string;
  flags: Record<string, FlagValue>;
  inventory: string[];
  /** Player position for restoring a saved game. */
  pos?: [number, number];
}

export const SAVE_VERSION = 1;
const KEY_PREFIX = 'crater-expectations.save.';

export function newGameState(startRoom: string): GameState {
  return { version: SAVE_VERSION, room: startRoom, flags: {}, inventory: [] };
}

export function saveState(state: GameState, slot: number | 'auto'): void {
  try {
    localStorage.setItem(KEY_PREFIX + slot, JSON.stringify(state));
  } catch {
    // Storage unavailable (private mode etc.) — play on without saves.
  }
}

export function loadState(slot: number | 'auto'): GameState | null {
  try {
    const raw = localStorage.getItem(KEY_PREFIX + slot);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GameState;
    if (parsed.version !== SAVE_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function hasSave(slot: number | 'auto'): boolean {
  return loadState(slot) !== null;
}
