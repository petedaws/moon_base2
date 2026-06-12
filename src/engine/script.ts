// Script context: the API game content uses for cutscenes and interactions.
// Scripts are plain async functions. Skipping a cutscene fast-forwards it:
// when the skip signal fires, every primitive completes instantly (walks
// teleport, lines vanish, fades snap) so the script still runs to the end
// and all state changes apply.

import type { Facing, Script } from './types';
import type { GameState, FlagValue } from './state';

export interface ScriptCtx {
  state: GameState;
  /** Aborted = fast-forward (cutscene skip). Null outside cutscenes. */
  signal: AbortSignal | null;

  say(actorId: string, text: string): Promise<void>;
  /** Player says it (most lines are Pip's). */
  sayP(text: string): Promise<void>;
  walkTo(actorId: string, x: number, y: number): Promise<void>;
  face(actorId: string, facing: Facing): void;
  placeActor(actorId: string, x: number, y: number, facing?: Facing): void;
  wait(ms: number): Promise<void>;
  fadeOut(ms?: number): Promise<void>;
  fadeIn(ms?: number): Promise<void>;
  giveItem(id: string): void;
  removeItem(id: string): void;
  hasItem(id: string): boolean;
  setFlag(key: string, value?: FlagValue): void;
  flag(key: string): FlagValue | undefined;
  goToRoom(roomId: string, spawn: string): Promise<void>;
  startDialog(dialogId: string): Promise<void>;
  playSfx(name: string): void;
  playMusic(name: string | null): void;
}

/** True once the ctx has been asked to fast-forward. */
export const skipped = (ctx: ScriptCtx): boolean => ctx.signal?.aborted ?? false;

/** Shorthand script: one actor line. */
export const say = (actorId: string, text: string): Script => (ctx) => ctx.say(actorId, text);

/** Shorthand script: a sequence of [actorId, text] lines. */
export const lines = (...pairs: [string, string][]): Script => async (ctx) => {
  for (const [actor, text] of pairs) await ctx.say(actor, text);
};

/** Compose scripts sequentially. */
export const seq = (...scripts: Script[]): Script => async (ctx) => {
  for (const s of scripts) await s(ctx);
};
