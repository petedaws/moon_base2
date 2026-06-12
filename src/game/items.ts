import type { ItemDef } from '../engine/types';
import { say } from '../engine/script';

export const items: Record<string, ItemDef> = {
  mint: {
    id: 'mint',
    name: 'complimentary mint',
    onLook: say('pip', `"Thank you for flying LunarTrans." It's shaped like a tiny, disappointed moon.`),
  },
  scissors: {
    id: 'scissors',
    name: 'safety scissors',
    onLook: say('pip', `Safety scissors. For when you need to cut something very slowly while feeling judged.`),
  },
  toner: {
    id: 'toner',
    name: 'toner cartridge',
    onLook: say('pip', `Genuine Tycho-brand toner. "Now with 30% more existential black."`),
  },
  badge: {
    id: 'badge',
    name: 'intern badge',
    onLook: say('pip', `"P. GIBBOUS — INTERN (PROBATIONARY). Clearance: LOW." The photo is of someone else entirely.`),
  },
};
