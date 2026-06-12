import { describe, expect, it } from 'vitest';
import { runDialog, visibleChoices } from '../src/engine/dialog';
import type { DialogChoice, DialogDef } from '../src/engine/types';
import type { ScriptCtx } from '../src/engine/script';
import { newGameState } from '../src/engine/state';

function fakeCtx(): { ctx: ScriptCtx; spoken: string[] } {
  const spoken: string[] = [];
  const state = newGameState('test');
  const ctx = {
    state,
    signal: null,
    say: async (_a: string, t: string) => {
      spoken.push(t);
    },
    sayP: async (t: string) => {
      spoken.push(t);
    },
    walkTo: async () => {},
    face: () => {},
    placeActor: () => {},
    wait: async () => {},
    fadeOut: async () => {},
    fadeIn: async () => {},
    giveItem: (id: string) => state.inventory.push(id),
    removeItem: () => {},
    hasItem: (id: string) => state.inventory.includes(id),
    setFlag: (k: string, v: boolean | number | string = true) => {
      state.flags[k] = v;
    },
    flag: (k: string) => state.flags[k],
    goToRoom: async () => {},
    startDialog: async () => {},
    playSfx: () => {},
    playMusic: () => {},
  } satisfies ScriptCtx;
  return { ctx, spoken };
}

const def: DialogDef = {
  id: 'test',
  actor: 'npc',
  start: 'root',
  nodes: {
    root: {
      choices: [
        {
          id: 'a',
          text: 'Ask once',
          once: true,
          response: async (ctx) => ctx.say('npc', 'answer A'),
        },
        {
          id: 'b',
          text: 'Conditional',
          condition: (s) => !!s.flags.unlocked,
          response: async (ctx) => ctx.say('npc', 'answer B'),
        },
        { id: 'bye', text: 'Bye', goto: 'end' },
      ],
    },
  },
};

describe('dialog runner', () => {
  it('hides once-choices after picking and respects conditions', async () => {
    const { ctx, spoken } = fakeCtx();
    const seen: string[][] = [];
    const picks = ['a', 'bye'];
    await runDialog(def, ctx, {
      presentChoices: async (choices: DialogChoice[]) => {
        seen.push(choices.map((c) => c.id));
        return choices.find((c) => c.id === picks.shift())!;
      },
    });
    expect(seen[0]).toEqual(['a', 'bye']); // 'b' hidden by condition
    expect(seen[1]).toEqual(['bye']); // 'a' consumed by once
    expect(spoken).toContain('answer A');
  });

  it('shows conditional choices once their flag is set', () => {
    const { ctx } = fakeCtx();
    ctx.state.flags.unlocked = true;
    const ids = visibleChoices(def, 'root', ctx.state).map((c) => c.id);
    expect(ids).toContain('b');
  });

  it('ends when a node has no visible choices', async () => {
    const { ctx } = fakeCtx();
    const empty: DialogDef = {
      id: 'e',
      actor: 'npc',
      start: 'root',
      nodes: { root: { choices: [{ id: 'x', text: 'x', once: true }] } },
    };
    let presented = 0;
    await runDialog(empty, ctx, {
      presentChoices: async (choices) => {
        presented++;
        return choices[0]!;
      },
    });
    expect(presented).toBe(1); // second visit found no choices and ended
  });
});
