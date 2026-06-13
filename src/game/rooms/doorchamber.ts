import type { RoomDef } from '../../engine/types';
import { say } from '../../engine/script';
import { F } from '../flags';

export const doorchamber: RoomDef = {
  id: 'doorchamber',
  name: 'The Door',
  background: 'bg/doorchamber',
  music: 'music/door',
  walkboxes: [{ points: [[40, 150], [206, 150], [206, 196], [30, 196]] }],
  scale: { yTop: 150, sTop: 0.6, yBottom: 196, sBottom: 1 },
  overlays: [
    { image: 'fg/doorchamber-chairs', x: 0, y: 0, z: 192 },
    { image: 'fg/doorchamber-tripod', x: 0, y: 0, z: 192 },
  ],
  ambients: [
    { image: 'fg/doorchamber-amb-glyphs', x: 0, y: 0, z: 0, mode: 'pulse', period: 4.2, min: 0.12, max: 0.5 },
    { image: 'fg/doorchamber-amb-torch', x: 0, y: 0, z: 0, mode: 'flicker', max: 0.55 },
  ],
  spawns: {
    fromElevator: { at: [55, 175], facing: 'right' },
  },
  exits: [
    {
      to: 'minehead',
      spawn: 'fromDoor',
      name: 'the elevator up',
      polygon: [[0, 90], [42, 90], [42, 196], [0, 196]],
      walkTo: [52, 175],
    },
  ],
  actors: [
    {
      actor: 'biddy',
      at: [70, 130],
      dialog: 'biddy',
      onLook: say('pip', `An emergency intercom, bolted on by the first crew. The cable runs all the way up the shaft. BIDDY's longest limb.`),
    },
  ],
  hotspots: [
    {
      id: 'door',
      name: 'the Door',
      polygon: [[130, 30], [250, 30], [250, 150], [130, 150]],
      walkTo: [185, 165],
      facing: 'up',
      onLook: async (ctx) => {
        if (ctx.flag(F.doorOpened)) {
          await ctx.sayP(`The Door stands open. Beyond it: a porch light, warm and ancient, and stairs going down further than down should go.`);
          return;
        }
        await ctx.sayP(`It's... enormous. Older than enormous. The glyphs wrap around it in a ring, glowing faintly.`);
        await ctx.sayP(`At the center: three slots. A small moon shape, a hand shape, and a spiral.`);
      },
      onUse: async (ctx) => {
        if (ctx.flag(F.doorOpened)) {
          await ctx.sayP(`I already rang once. Ringing twice is how you annoy a civilization.`);
          return;
        }
        const haveAll = ctx.flag(F.hasPaperweight) && ctx.flag(F.hasWrench) && ctx.flag(F.hasStirrer);
        if (!haveAll) {
          await ctx.sayP(`Three slots, and I don't have everything that fits them. Story of my career so far.`);
          return;
        }
        if (!ctx.flag(F.knowsKeyOrder)) {
          await ctx.sayP(`Three keys, three slots... but which goes first?`);
          await ctx.sayP(`I'm not jamming priceless artifacts into a cosmic doorbell by trial and error. Estella finished the translation — I should ask her.`);
          return;
        }
        // ----- finale -----
        await ctx.sayP(`Moon. Hand. Spiral. Smallest to largest. "No wrong answers, friend."`);
        await ctx.sayP(`Okay. For the first crew. For Magwitch. For Havisham's cake.`);
        ctx.playSfx('pickup');
        await ctx.sayP(`The paperweight... it's pulling toward the slot like it's going home.`);
        ctx.removeItem('paperweight');
        await ctx.wait(400);
        ctx.playSfx('pickup');
        await ctx.sayP(`The wrench. Thanks, Joe.`);
        ctx.removeItem('wrench');
        await ctx.wait(400);
        ctx.playSfx('pickup');
        await ctx.sayP(`And the stirrer. Twenty-six years in a cake, and NOW look at you.`);
        ctx.removeItem('stirrer');
        ctx.setFlag(F.keysInserted);
        await ctx.wait(800);
        ctx.playSfx('print');
        await ctx.say('biddy', `ALERT: chronometers resuming basewide. 4:17 has become 4:18. I repeat: IT IS 4:18. WHO AUTHORIZED 4:18?`);
        await ctx.sayP(`The clocks! The door was holding the base's time and now it's— giving it back?`);
        await ctx.wait(600);
        ctx.playSfx('door');
        await ctx.say('biddy', `Seismic event. Non-threatening. It resembles... chimes.`);
        await ctx.sayP(`DING... DONG.`);
        await ctx.wait(900);
        await ctx.sayP(`It's opening. There's a light. A little warm light, like... like a porch light left on.`);
        await ctx.say('biddy', `Deep acoustic response detected. Source: seventy kilometers down. Translation per Dr. Estella's matrix:`);
        await ctx.say('biddy', `"COMING. PUT THE KETTLE ON."`);
        ctx.setFlag(F.doorOpened);
        await ctx.wait(800);
        await ctx.sayP(`...BIDDY. Update my file.`);
        await ctx.say('biddy', `Already done. "P. GIBBOUS — INTERN (PROBATIONARY). Clearance: LOW. Achievements: TONER. COFFEE. FIRST CONTACT."`);
        await ctx.fadeOut(1200);
        await ctx.wait(600);
        await ctx.say('biddy', `CRATER EXPECTATIONS: ACT ONE COMPLETE. Thank you for playing the demo. The kettle, presumably, is ON.`);
        await ctx.fadeIn(800);
      },
    },
    {
      id: 'glyphring',
      name: 'glyph ring',
      polygon: [[100, 60], [128, 60], [128, 140], [100, 140]],
      walkTo: [130, 165],
      facing: 'up',
      onLook: async (ctx) => {
        await ctx.sayP(`The full ring of glyphs, the ones from Magwitch's rubbings. Up close they're warm, like sun-heated stone.`);
        if (ctx.flag(F.doorOpened)) {
          await ctx.sayP(`They've all gone porch-light amber. Cozy, for an eldritch doorbell.`);
        }
      },
    },
    {
      id: 'oldcamp',
      name: 'abandoned camp',
      polygon: [[255, 110], [295, 110], [295, 150], [255, 150]],
      walkTo: [255, 162],
      facing: 'right',
      onLook: async (ctx) => {
        await ctx.sayP(`The first crew's camp: folding chairs, a dead floodlight, a thermos. Abandoned in a hurry, 26 years ago.`);
        await ctx.sayP(`One chair has "MAGWITCH" written on the back in marker. He never got to use it.`);
      },
    },
  ],
  onEnter: async (ctx) => {
    if (ctx.flag('doorchamberSeen')) return;
    ctx.setFlag('doorchamberSeen');
    await ctx.wait(400);
    await ctx.sayP(`Oh.`);
    await ctx.wait(600);
    await ctx.sayP(`Oh, that's a DOOR.`);
    await ctx.say('biddy', `Confirmed. After three weeks of basewide denial, I cannot tell you how liberating that is to acknowledge.`);
  },
};
