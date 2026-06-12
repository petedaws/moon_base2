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
  form: {
    id: 'form',
    name: 'Form RQ-7',
    onLook: say('pip', `Requisition Form RQ-7, signed in triplicate. It smells faintly of power.`),
  },
  coil: {
    id: 'coil',
    name: 'heating coil',
    onLook: say('pip', `A heating coil. Rated for "beverages, morale, and light welding."`),
  },
  driver: {
    id: 'driver',
    name: 'multidriver',
    onLook: say('pip', `Joe's multidriver. It has seventeen bits and a bottle opener. A tool of civilization.`),
  },
  rubbings: {
    id: 'rubbings',
    name: 'glyph rubbings',
    onLook: say('pip', `Charcoal rubbings of alien glyphs. Looking at them too long makes my teeth itch.`),
  },
  paperweight: {
    id: 'paperweight',
    name: 'meteorite paperweight',
    onLook: say('pip', `Pumblechook's "meteorite" paperweight. Warm to the touch. Paperweights should not be warm.`),
  },
  wrench: {
    id: 'wrench',
    name: 'lucky wrench',
    onLook: say('pip', `Joe's lucky wrench. The handle is covered in the same glyphs as the rubbings. Lucky indeed.`),
  },
  stirrer: {
    id: 'stirrer',
    name: 'ceremonial cake stirrer',
    onLook: say('pip', `A long silver "stirrer" from a 26-year-old cake. It hums. Cutlery should not hum.`),
  },
};
