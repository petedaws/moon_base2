import type { RoomDef } from '../../engine/types';
import { lines, say } from '../../engine/script';
import { F } from '../flags';

export const reception: RoomDef = {
  id: 'reception',
  name: 'Reception',
  background: 'bg/reception',
  music: 'music/reception',
  walkboxes: [{ points: [[20, 142], [300, 142], [312, 196], [8, 196]] }],
  scale: { yTop: 142, sTop: 0.78, yBottom: 196, sBottom: 1 },
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
    },
    {
      to: 'hub',
      spawn: 'fromReception',
      name: 'the base proper',
      polygon: [[298, 95], [320, 95], [320, 196], [298, 196]],
      walkTo: [292, 172],
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
      actor: 'pumblechook',
      at: [170, 138],
      facing: 'down',
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
