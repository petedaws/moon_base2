import type { RoomDef } from '../../engine/types';
import { say } from '../../engine/script';
import { F } from '../flags';

export const lab: RoomDef = {
  id: 'lab',
  name: 'Xenoglyph Lab',
  background: 'bg/lab',
  music: 'music/reception',
  walkboxes: [{ points: [[102, 142], [300, 142], [300, 152], [102, 152]] }, { points: [[214, 142], [300, 142], [312, 196], [214, 196]] }, { points: [[8, 176], [312, 176], [312, 196], [8, 196]] }],
  scale: { yTop: 142, sTop: 0.7, yBottom: 196, sBottom: 1 },
  overlays: [
    { image: 'fg/lab-scanner', x: 0, y: 0, z: 164 },
    { image: 'fg/lab-chalkboard', x: 0, y: 0, z: 170 },
  ],
  ambients: [
    { image: 'fg/lab-amb-tube', x: 0, y: 0, z: 0, mode: 'flicker', max: 0.4 },
    { image: 'fg/lab-amb-porthole', x: 0, y: 0, z: 0, mode: 'pulse', period: 6.5, max: 0.3 },
  ],
  spawns: {
    fromHub: { at: [160, 190], facing: 'up' },
  },
  exits: [
    {
      to: 'hub',
      spawn: 'fromLab',
      name: 'the hub',
      polygon: [[120, 190], [200, 190], [200, 200], [120, 200]],
      walkTo: [160, 190],
    },
  ],
  actors: [
    {
      actor: 'estella',
      at: [220, 158],
      facing: 'down',
      dialog: 'estella',
      onLook: say('pip', `Dr. Estella. She looks at everything like it's late for a meeting.`),
      onUseItem: {
        rubbings: async (ctx) => {
          await ctx.sayP(`Dr. Estella? I found some, uh, theoretical glyphs.`);
          await ctx.say('estella', `If this is another doodle from the canteen I will— `);
          await ctx.wait(500);
          await ctx.say('estella', `...These are contact rubbings. Full-ring. COMPLETE. Where— no. Don't tell me. Plausible deniability.`);
          ctx.removeItem('rubbings');
          ctx.setFlag(F.gaveRubbings);
          await ctx.say('estella', `This is the missing half of my sentence. Give me a moment—`);
          await ctx.wait(700);
          await ctx.say('estella', `"DEAR VISITOR, WHATEVER YOU DO, PLEASE... RING AHEAD."`);
          await ctx.sayP(`Ring ahead?! It's a DOORBELL?`);
          await ctx.say('estella', `It's a doorbell. Twenty-six years of containment protocols for a doorbell.`);
          await ctx.say('estella', `I have to report this to Havisham. And YOU are coming with me — if she shoots the messenger I want a spare.`);
          await ctx.fadeOut(500);
          await ctx.goToRoom('havisham', 'fromLab');
        },
      },
    },
  ],
  hotspots: [
    {
      id: 'scanner',
      name: 'sample scanner',
      polygon: [[30, 90], [85, 90], [85, 145], [30, 145]],
      walkTo: [70, 158],
      facing: 'left',
      onLook: say('pip', `A sample scanner. The sample tray holds one (1) pebble with a sticky note: "NOT alien. Stop asking. -E"`),
      onUse: async (ctx) => {
        ctx.playSfx('error');
        await ctx.sayP(`It scanned my hand. Result: "ORGANIC. UNREMARKABLE."`);
        await ctx.sayP(`Harsh, but fair.`);
        await ctx.say('estella', `The scanner doesn't lie. That's my job security.`);
      },
    },
    {
      id: 'blackboard',
      name: 'blackboard',
      polygon: [[120, 65], [230, 65], [230, 130], [120, 130]],
      walkTo: [175, 150],
      facing: 'up',
      onLook: async (ctx) => {
        await ctx.sayP(`A blackboard covered in glyph transcriptions, arrows, and question marks.`);
        await ctx.sayP(`Someone has drawn angry eyebrows on one of the glyphs. It does look annoyed now.`);
        if (ctx.flag(F.knowsKeyOrder)) {
          await ctx.sayP(`In the corner: "moon < hand < spiral", circled three times. The key order.`);
        }
      },
    },
    {
      id: 'notice',
      name: 'confiscation notice',
      polygon: [[250, 75], [296, 75], [296, 115], [250, 115]],
      onLook: async (ctx) => {
        await ctx.sayP(`"ALL SHAFT 9 MATERIALS REMANDED TO ADMINISTRATION. By order of M.H."`);
        await ctx.sayP(`The signature is in fountain pen. Nobody has used a fountain pen since the Earth ran out of fountains.`);
      },
    },
  ],
};
