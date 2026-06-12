import type { RoomDef } from '../../engine/types';
import { say } from '../../engine/script';
import { F } from '../flags';

export const landing: RoomDef = {
  id: 'landing',
  name: 'Landing Bay',
  background: 'bg/landing',
  music: 'music/landing',
  walkboxes: [{ points: [[30, 145], [290, 145], [312, 196], [8, 196]] }],
  scale: { yTop: 145, sTop: 0.78, yBottom: 196, sBottom: 1 },
  spawns: {
    start: { at: [60, 170], facing: 'right' },
    fromReception: { at: [285, 175], facing: 'left' },
  },
  exits: [
    {
      to: 'reception',
      spawn: 'fromLanding',
      name: 'reception',
      polygon: [[296, 100], [320, 100], [320, 196], [296, 196]],
      walkTo: [290, 175],
    },
  ],
  actors: [
    {
      actor: 'biddy',
      at: [250, 122],
      dialog: 'biddy',
      onLook: say('pip', `An intercom panel. The label reads "B.I.D.D.Y. — please speak clearly and without hope."`),
    },
  ],
  hotspots: [
    {
      id: 'shuttle',
      name: 'shuttle',
      polygon: [[10, 60], [120, 60], [120, 148], [10, 148]],
      walkTo: [110, 165],
      facing: 'left',
      onLook: say('pip', `The shuttle that brought me here. It's already pointed back at Earth, which feels like commentary.`),
      onUse: async (ctx) => {
        await ctx.sayP(`Hello? Can I get back on?`);
        await ctx.say('biddy', `The shuttle departs in four minutes. Tickets cost one month of intern salary.`);
        await ctx.sayP(`How much is intern salary?`);
        await ctx.say('biddy', `One complimentary mint per flight.`);
      },
    },
    {
      id: 'kit',
      name: 'emergency kit',
      polygon: [[150, 92], [178, 92], [178, 122], [150, 122]],
      walkTo: [164, 155],
      facing: 'up',
      onUse: async (ctx) => {
        if (ctx.flag(F.kitOpened)) {
          await ctx.sayP(`Just the dust now. Even the dust looks like it wants to leave.`);
          return;
        }
        await ctx.sayP(`Let's see... "EMERGENCY KIT — FOR EMERGENCIES ONLY."`);
        await ctx.sayP(`Being me is an ongoing emergency.`);
        await ctx.wait(400);
        await ctx.sayP(`One flare (expired), one whistle (no air out here), and... safety scissors!`);
        ctx.giveItem('scissors');
        ctx.setFlag(F.kitOpened);
        await ctx.say('biddy', `Please note the kit's contents are intended for morale, not function.`);
      },
      onLook: say('pip', `A wall-mounted emergency kit. The "in case of emergency, break glass" glass has been replaced with plywood. Budget cuts.`),
    },
    {
      id: 'crate',
      name: 'supply crate',
      polygon: [[196, 118], [248, 118], [248, 152], [196, 152]],
      walkTo: [222, 162],
      facing: 'up',
      onLook: async (ctx) => {
        if (ctx.flag(F.crateOpen)) {
          await ctx.sayP(`It's open. The packing peanuts have already begun colonizing the floor.`);
        } else {
          await ctx.sayP(`A supply crate, triple-sealed in regulation packing tape. The tape has tape on it.`);
        }
      },
      onUse: async (ctx) => {
        if (ctx.flag(F.crateOpen)) {
          await ctx.sayP(`Nothing left but stress balls. Six hundred of them.`);
          return;
        }
        await ctx.sayP(`Hnnng... the tape... is winning...`);
        await ctx.say('biddy', `Regulation packing tape is rated for atmospheric re-entry. Fingers are not.`);
      },
      onUseItem: {
        scissors: async (ctx) => {
          if (ctx.flag(F.crateOpen)) {
            await ctx.sayP(`It's already open. The scissors look disappointed.`);
            return;
          }
          await ctx.sayP(`Safety scissors versus regulation tape. The duel of the century.`);
          await ctx.wait(700);
          ctx.playSfx('cut');
          await ctx.sayP(`Got it! Let's see... stress balls, stress balls, more stress balls... and one toner cartridge!`);
          ctx.giveItem('toner');
          ctx.setFlag(F.crateOpen);
          ctx.setFlag(F.knowsStressBalls);
          await ctx.say('biddy', `Congratulations. You have peaked on day one.`);
        },
        mint: say('pip', `The crate is unmoved by hospitality.`),
      },
    },
    {
      id: 'viewport',
      name: 'viewport',
      polygon: [[262, 70], [296, 70], [296, 104], [262, 104]],
      onLook: async (ctx) => {
        await ctx.sayP(`You can see Earth from here. Everyone I've ever met is on that little blue marble.`);
        await ctx.sayP(`...Except everyone I'm about to meet. Okay. Pep talk over.`);
      },
    },
  ],
  onEnter: async (ctx) => {
    if (ctx.flag(F.introSeen)) return;
    ctx.setFlag(F.introSeen);
    ctx.giveItem('mint');
    await ctx.wait(500);
    await ctx.say('biddy', `Attention: shuttle LT-4017 has docked. Cargo: one (1) intern. Condition: as-is, no warranty.`);
    await ctx.walkTo('pip', 130, 170);
    await ctx.sayP(`Wow. The Moon. The actual Moon!`);
    await ctx.sayP(`First day of my space career. Nothing can possibly go wrong from here.`);
    await ctx.say('biddy', `Statistically inaccurate. Welcome to Havisham Base.`);
  },
};
