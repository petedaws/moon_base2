import { beforeEach, describe, expect, it } from 'vitest';
import { loadState, newGameState, saveState } from '../src/engine/state';

// Minimal localStorage for the node test environment.
const store = new Map<string, string>();
beforeEach(() => {
  store.clear();
  globalThis.localStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
    key: () => null,
    length: 0,
  } as Storage;
});

describe('save/load', () => {
  it('round-trips game state', () => {
    const s = newGameState('landing');
    s.flags.badgePrinted = true;
    s.flags.counter = 3;
    s.inventory.push('mint', 'badge');
    s.room = 'reception';
    saveState(s, 'auto');
    const loaded = loadState('auto');
    expect(loaded).toEqual(s);
    expect(loaded).not.toBe(s);
  });

  it('returns null for missing or corrupt saves', () => {
    expect(loadState(1)).toBeNull();
    store.set('crater-expectations.save.2', '{not json');
    expect(loadState(2)).toBeNull();
  });
});
