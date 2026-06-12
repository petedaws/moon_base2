import type { RoomDef } from '../../engine/types';
import { say } from '../../engine/script';

export const quarters: RoomDef = {
  id: 'quarters',
  name: "Pip's Quarters",
  background: 'bg/quarters',
  music: 'music/hub',
  walkboxes: [{ points: [[70, 150], [250, 150], [262, 196], [58, 196]] }],
  scale: { yTop: 150, sTop: 0.85, yBottom: 196, sBottom: 1 },
  spawns: {
    fromCorridor: { at: [160, 188], facing: 'up' },
  },
  exits: [
    {
      to: 'corridor',
      spawn: 'fromQuarters',
      name: 'the corridor',
      polygon: [[120, 190], [200, 190], [200, 200], [120, 200]],
      walkTo: [160, 190],
    },
  ],
  actors: [
    {
      actor: 'biddy',
      at: [140, 92],
      dialog: 'biddy',
      onLook: say('pip', `A BIDDY intercom. In my own room. Privacy is a pre-space concept, apparently.`),
    },
  ],
  hotspots: [
    {
      id: 'bunk',
      name: 'bunk',
      polygon: [[70, 105], [150, 105], [150, 150], [70, 150]],
      walkTo: [120, 165],
      facing: 'up',
      onLook: say('pip', `My bunk. It's 80% of the room. The other 20% is regret.`),
      onUse: async (ctx) => {
        await ctx.sayP(`A power nap couldn't hurt.`);
        await ctx.fadeOut(500);
        await ctx.wait(400);
        await ctx.fadeIn(500);
        await ctx.sayP(`I dreamt I was filing. Even my dreams have been onboarded.`);
      },
    },
    {
      id: 'broom',
      name: 'broom',
      polygon: [[228, 100], [240, 100], [240, 152], [228, 152]],
      walkTo: [225, 165],
      facing: 'right',
      onLook: say('pip', `The previous occupant left a broom. It leans away from me slightly. I think it resents the company.`),
      onUse: async (ctx) => {
        await ctx.sayP(`I sweep a little. The dust relocates with prejudice.`);
        await ctx.say('biddy', `Janitorial initiative logged. Your file grows ever stranger.`);
      },
    },
    {
      id: 'locker',
      name: 'locker',
      polygon: [[160, 95], [205, 95], [205, 150], [160, 150]],
      walkTo: [182, 165],
      facing: 'up',
      onLook: say('pip', `My locker. Previous intern left a single sock and a note.`),
      onUse: async (ctx) => {
        await ctx.sayP(`The note says: "RUN." `);
        await ctx.sayP(`...The sock says nothing. Socks rarely do.`);
      },
    },
    {
      id: 'porthole',
      name: 'porthole',
      polygon: [[100, 70], [125, 70], [125, 95], [100, 95]],
      onLook: say('pip', `A porthole the size of a dinner plate. The brochure called this "panoramic crater views."`),
    },
  ],
};
