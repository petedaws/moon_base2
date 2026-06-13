import type { RoomDef } from '../../engine/types';
import { say } from '../../engine/script';
import { F } from '../flags';

export const engineering: RoomDef = {
  id: 'engineering',
  name: 'Engineering Bay',
  background: 'bg/engineering',
  music: 'music/reception',
  walkboxes: [{ points: [[126, 142], [300, 142], [312, 196], [126, 196]] }, { points: [[8, 166], [312, 166], [312, 196], [8, 196]] }],
  scale: { yTop: 142, sTop: 0.7, yBottom: 196, sBottom: 1 },
  overlays: [
    { image: 'fg/engineering-bench', x: 0, y: 0, z: 162 },
  ],
  ambients: [
    { image: 'fg/engineering-amb-reactor', x: 0, y: 0, z: 0, mode: 'pulse', period: 3.2, min: 0.08, max: 0.5 },
    { image: 'fg/engineering-amb-lamp', x: 0, y: 0, z: 0, mode: 'flicker', max: 0.45 },
  ],
  spawns: {
    fromHub: { at: [30, 175], facing: 'right' },
  },
  exits: [
    {
      to: 'hub',
      spawn: 'fromEngineering',
      name: 'the hub',
      polygon: [[0, 100], [22, 100], [22, 196], [0, 196]],
      walkTo: [28, 175],
    },
  ],
  actors: [
    {
      actor: 'biddy',
      at: [110, 105],
      dialog: 'biddy',
      onLook: say('pip', `A BIDDY intercom with a dent in it. Joe and BIDDY have history.`),
    },
    {
      actor: 'joe',
      at: [190, 160],
      facing: 'down',
      dialog: 'joe',
      onLook: say('pip', `Joe. He's the kind of person who pats machines after fixing them.`),
      onUseItem: {
        wrench: say('joe', `Keep her for now, Pip. She's found a better story than mine.`),
      },
    },
  ],
  hotspots: [
    {
      id: 'toolwall',
      name: 'tool wall',
      polygon: [[120, 70], [240, 70], [240, 130], [120, 130]],
      walkTo: [180, 150],
      facing: 'up',
      onLook: async (ctx) => {
        await ctx.sayP(`A pegboard with a painted outline for every tool. All filled but one: a wrench-shaped hole.`);
        if (ctx.flag(F.hasWrench)) {
          await ctx.sayP(`I could put the lucky wrench back... but Joe said she's got a bigger appointment.`);
        } else {
          await ctx.sayP(`The empty outline has been... decorated. There's a tiny candle painted under it.`);
        }
      },
    },
    {
      id: 'reactor',
      name: 'fusion reactor',
      polygon: [[255, 60], [300, 60], [300, 140], [255, 140]],
      walkTo: [260, 155],
      facing: 'right',
      onLook: say('pip', `The fusion reactor. It powers the base and, according to the warning label, "most local physics."`),
      onUse: async (ctx) => {
        await ctx.sayP(`I'm not touching the fusion reactor.`);
        await ctx.say('biddy', `Thank you. There's a sticker chart in the airlock for interns who survive the week. You just earned a star.`);
      },
    },
    {
      id: 'workbench',
      name: 'workbench',
      polygon: [[30, 110], [105, 110], [105, 145], [30, 145]],
      walkTo: [70, 158],
      facing: 'up',
      onLook: say('pip', `A workbench mid-surgery: a coffee machine's evil twin, opened up, with its heating coil removed as evidence.`),
      onUse: say('joe', `Don't touch the patient, Pip. She's stable but bitter.`),
    },
  ],
};
