import type { DialogChoice, DialogDef } from './types';
import type { GameState } from './state';
import type { ScriptCtx } from './script';

export const pickedFlag = (dialogId: string, choiceId: string): string =>
  `_dlg.${dialogId}.${choiceId}`;

export function visibleChoices(def: DialogDef, node: string, state: GameState): DialogChoice[] {
  const n = def.nodes[node];
  if (!n) return [];
  return n.choices.filter((c) => {
    if (c.once && state.flags[pickedFlag(def.id, c.id)]) return false;
    return c.condition ? c.condition(state) : true;
  });
}

export interface DialogHost {
  /** Show choices; resolves with the picked choice. */
  presentChoices(choices: DialogChoice[]): Promise<DialogChoice>;
}

/** Runs a dialog tree to completion. */
export async function runDialog(def: DialogDef, ctx: ScriptCtx, host: DialogHost): Promise<void> {
  let node = def.start;
  for (;;) {
    const n = def.nodes[node];
    if (!n) return;
    if (n.onEnter) await n.onEnter(ctx);
    const choices = visibleChoices(def, node, ctx.state);
    if (choices.length === 0) return;
    const choice = await host.presentChoices(choices);
    if (choice.once) ctx.state.flags[pickedFlag(def.id, choice.id)] = true;
    if (choice.response) await choice.response(ctx);
    if (choice.effects) choice.effects(ctx.state);
    if (choice.goto === 'end') return;
    if (choice.goto) node = choice.goto;
  }
}
