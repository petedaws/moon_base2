import type { RoomDef } from '../../engine/types';
import { say } from '../../engine/script';
import { F } from '../flags';

export const hub: RoomDef = {
  id: 'hub',
  name: 'Central Hub',
  background: 'bg/hub',
  music: 'music/hub',
  walkboxes: [{ points: [[24, 140], [296, 140], [310, 196], [10, 196]] }],
  scale: { yTop: 140, sTop: 0.78, yBottom: 196, sBottom: 1 },
  spawns: {
    fromReception: { at: [35, 172], facing: 'right' },
  },
  exits: [
    {
      to: 'reception',
      spawn: 'fromHub',
      name: 'reception',
      polygon: [[0, 100], [24, 100], [24, 196], [0, 196]],
      walkTo: [32, 172],
    },
  ],
  hotspots: [
    {
      id: 'barrier',
      name: 'maintenance barrier',
      polygon: [[180, 90], [300, 90], [300, 150], [180, 150]],
      walkTo: [200, 165],
      facing: 'up',
      onLook: say('pip', `A barrier blocking the rest of the hub. "PARDON OUR MOON DUST — MORE BASE COMING SOON."`),
      onUse: async (ctx) => {
        await ctx.sayP(`It won't budge. The rest of the base is... under construction?`);
        await ctx.say('biddy', `The remainder of Havisham Base is being assembled by the developers. Please enjoy this load-bearing demo boundary.`);
      },
    },
  ],
  actors: [
    {
      actor: 'biddy',
      at: [150, 118],
      dialog: 'biddy',
      onLook: say('pip', `Another BIDDY intercom. She gets around. Well... she IS the walls.`),
    },
  ],
  onEnter: async (ctx) => {
    if (ctx.flag(F.enteredHub)) return;
    ctx.setFlag(F.enteredHub);
    await ctx.sayP(`The central hub! The beating heart of Havisham Base!`);
    await ctx.wait(400);
    await ctx.say('biddy', `Congratulations on completing the demo's first puzzle. Your achievement has been noted in your file.`);
    await ctx.sayP(`The file again?! What's IN my file?`);
    await ctx.say('biddy', `As of today: toner.`);
  },
};
