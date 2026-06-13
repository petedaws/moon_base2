import type { RoomDef } from '../../engine/types';
import { lines, say } from '../../engine/script';
import { F } from '../flags';

export const reception: RoomDef = {
  id: 'reception',
  name: 'Reception',
  background: 'bg/reception',
  music: 'music/reception',
  walkboxes: [{ points: [[20, 142], [68, 142], [68, 196], [8, 196]] }, { points: [[230, 142], [300, 142], [312, 196], [230, 196]] }, { points: [[8, 158], [312, 158], [312, 196], [8, 196]] }],
  scale: { yTop: 142, sTop: 0.7, yBottom: 196, sBottom: 1 },
  overlays: [
    { image: 'fg/reception-desk', x: 0, y: 0, z: 152 },
    { image: 'fg/reception-post-left', x: 0, y: 0, z: 172 },
    { image: 'fg/reception-post-center', x: 0, y: 0, z: 176 },
    { image: 'fg/reception-post-right', x: 0, y: 0, z: 188 },
    { image: 'fg/reception-post-front', x: 0, y: 0, z: 198 },
    { image: 'fg/reception-rope-left', x: 0, y: 0, z: 176 },
    { image: 'fg/reception-rope-right', x: 0, y: 0, z: 188 },
  ],
  ambients: [
    { image: 'fg/reception-amb-sconce', x: 0, y: 0, z: 0, mode: 'flicker', max: 0.5 },
  ],
  spawns: {
    fromLanding: { at: [30, 175], facing: 'right' },
    fromHub: { at: [290, 172], facing: 'left' },
  },
  exits: [
    {
      to: 'landing',
      spawn: 'fromReception',
      name: 'the landing bay',
      polygon: [[0, 100], [22, 100], [22, 196], [0, 196]],
      walkTo: [28, 175],
      door: { image: 'fg/reception-door-landing', clip: [1, 45, 36, 104], dx: 0, dy: -96 },
    },
    {
      to: 'hub',
      spawn: 'fromReception',
      name: 'the base proper',
      polygon: [[298, 95], [320, 95], [320, 196], [298, 196]],
      walkTo: [292, 172],
      door: { image: 'fg/reception-door-security', clip: [272, 49, 40, 96], dx: 0, dy: -90 },
      onExit: async (ctx) => {
        if (!ctx.flag(F.badgePrinted)) {
          await ctx.say('pumblechook', `AHEM. Badge.`);
          await ctx.sayP(`I was just admiring the door.`);
          await ctx.say('pumblechook', `Admire it from a badge-holding posture.`);
          return false;
        }
      },
    },
  ],
  actors: [
    {
      actor: 'biddy',
      at: [105, 122],
      dialog: 'biddy',
      onLook: say('pip', `A BIDDY intercom, mounted at exactly regulation height.`),
    },
    {
      actor: 'pumblechook',
      at: [245, 150],
      facing: 'left',
      condition: (s) => !s.flags[F.pumblechookGone],
      dialog: 'pumblechook',
      onLook: say('pip', `Officer Pumblechook. He has the posture of a man who irons his uniform while wearing it.`),
      onUseItem: {
        toner: async (ctx) => {
          await ctx.sayP(`One toner cartridge. Unopened. Mostly unlicked.`);
          await ctx.say('pumblechook', `...It's beautiful. Tycho-brand. The good kind.`);
          ctx.removeItem('toner');
          await ctx.say('pumblechook', `Very well. As I am now legally cornered, prepare yourself for the badge ceremony.`);
          await ctx.sayP(`Is the ceremony long?`);
          await ctx.say('pumblechook', `The ceremony is this.`);
          ctx.playSfx('print');
          await ctx.wait(900);
          ctx.giveItem('badge');
          ctx.setFlag(F.badgePrinted);
          await ctx.say('pumblechook', `Welcome to Havisham Base, Intern Gibbous. Your clearance opens the canteen and most bathrooms.`);
          await ctx.sayP(`MOST bathrooms?`);
          await ctx.say('pumblechook', `Ambition is healthy in the young.`);
        },
        mint: lines(
          ['pumblechook', `A bribe? On day one?`],
          ['pip', `It's a MINT.`],
          ['pumblechook', `It's a gateway confection. Keep it.`],
        ),
      },
    },
  ],
  hotspots: [
    {
      id: 'desk',
      name: 'reception desk',
      polygon: [[130, 130], [216, 130], [216, 152], [130, 152]],
      walkTo: [172, 162],
      facing: 'up',
      onLook: say('pip', `The reception desk. Every object on it is at a precise right angle to every other object. It's a little frightening.`),
      onUse: say('pumblechook', `Please do not touch the desk. The desk and I have an understanding.`),
    },
    {
      id: 'paperweight',
      name: 'meteorite paperweight',
      polygon: [[196, 122], [212, 122], [212, 134], [196, 134]],
      walkTo: [196, 162],
      facing: 'up',
      condition: (s) => !s.flags[F.hasPaperweight],
      onLook: async (ctx) => {
        await ctx.sayP(`A lump of dark metal keeping a stack of blank forms from escaping.`);
        if (ctx.flag(F.knowsAboutKeys)) {
          await ctx.sayP(`"A paperweight that fell from no sky." That's key number one, alright.`);
        }
      },
      onUse: async (ctx) => {
        if (!ctx.flag(F.pumblechookGone)) {
          await ctx.say('pumblechook', `That paperweight has seniority over you, Gibbous.`);
          await ctx.sayP(`It's a ROCK.`);
          await ctx.say('pumblechook', `It's a rock with TENURE.`);
          return;
        }
        await ctx.sayP(`As Acting Receptionist, I hereby requisition this paperweight for... door-related purposes.`);
        ctx.playSfx('pickup');
        ctx.giveItem('paperweight');
        ctx.setFlag(F.hasPaperweight);
        await ctx.sayP(`It's humming. Pumblechook's desk rock is HUMMING.`);
        await ctx.say('biddy', `Noted for the record: the intern's first official act was theft.`);
        await ctx.sayP(`REQUISITION.`);
      },
    },
    {
      id: 'clock',
      name: 'wall clock',
      polygon: [[60, 60], [88, 60], [88, 88], [60, 88]],
      onLook: async (ctx) => {
        await ctx.sayP(`A wall clock, stopped at 4:17.`);
        if (!ctx.flag(F.sawStoppedClock)) {
          ctx.setFlag(F.sawStoppedClock);
          await ctx.sayP(`The second hand is straining against something. Like it WANTS to move and can't.`);
          await ctx.sayP(`...I'm going to pretend I didn't notice that.`);
        }
      },
    },
    {
      id: 'poster',
      name: 'motivational poster',
      polygon: [[232, 58], [288, 58], [288, 100], [232, 100]],
      onLook: async (ctx) => {
        await ctx.sayP(`"HAVISHAM BASE: Tomorrow's Yesterday, Today."`);
        await ctx.sayP(`There's a kitten in a spacesuit. The kitten looks like it has seen things.`);
      },
    },
  ],
  onEnter: async (ctx) => {
    if (!ctx.flag(F.metPumblechook)) {
      await ctx.say('pumblechook', `Halt. State your designation and the nature of your existence.`);
    }
  },
};
