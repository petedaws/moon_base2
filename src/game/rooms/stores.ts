import type { RoomDef } from '../../engine/types';
import { say } from '../../engine/script';
import { F } from '../flags';

export const stores: RoomDef = {
  id: 'stores',
  name: 'Quartermaster Stores',
  background: 'bg/stores',
  music: 'music/reception',
  walkboxes: [{ points: [[20, 142], [300, 142], [300, 147], [20, 147]] }, { points: [[20, 142], [78, 142], [78, 196], [8, 196]] }, { points: [[214, 142], [300, 142], [312, 196], [214, 196]] }, { points: [[8, 182], [312, 182], [312, 196], [8, 196]] }],
  scale: { yTop: 142, sTop: 0.7, yBottom: 196, sBottom: 1 },
  overlays: [
    { image: 'fg/stores-counter', x: 0, y: 0, z: 178 },
    { image: 'fg/stores-shelf', x: 0, y: 0, z: 170 },
  ],
  ambients: [
    { image: 'fg/stores-amb-lamp', x: 0, y: 0, z: 0, mode: 'flicker', max: 0.4 },
    { image: 'fg/stores-amb-wrench', x: 0, y: 0, z: 0, mode: 'pulse', period: 2.6, min: 0.1, max: 0.55 },
  ],
  spawns: {
    fromHub: { at: [160, 190], facing: 'up' },
  },
  exits: [
    {
      to: 'hub',
      spawn: 'fromStores',
      name: 'the hub',
      polygon: [[120, 190], [200, 190], [200, 200], [120, 200]],
      walkTo: [160, 190],
    },
  ],
  actors: [
    {
      actor: 'biddy',
      at: [200, 118],
      dialog: 'biddy',
      onLook: say('pip', `A BIDDY intercom, labeled and inventoried. Asset tag: BIDDY-OUTLET-0047.`),
    },
    {
      actor: 'wemmick',
      at: [165, 140],
      facing: 'down',
      condition: (s) => !s.flags[F.wemmickOffDuty],
      dialog: 'wemmickOn',
      onLook: say('pip', `Quartermaster Wemmick, on duty. His posture could be used to calibrate instruments.`),
      onUseItem: {
        mint: say('wemmick', `Foodstuffs require Form ED-3, "Intent to Snack." Do not test me, rounding error.`),
      },
    },
  ],
  hotspots: [
    {
      id: 'cage',
      name: 'confiscation cage',
      polygon: [[230, 70], [300, 70], [300, 145], [230, 145]],
      walkTo: [255, 158],
      facing: 'right',
      onLook: async (ctx) => {
        if (ctx.flag(F.hasWrench)) {
          await ctx.sayP(`The confiscation cage. One wrench lighter. Still holds: a kazoo, a hot plate, and someone's entire personality, apparently.`);
        } else {
          await ctx.sayP(`The confiscation cage. Inside: a kazoo, a hot plate, a yo-yo, and one suspiciously lucky-looking wrench.`);
        }
      },
      onUse: async (ctx) => {
        if (ctx.flag(F.hasWrench)) {
          await ctx.sayP(`I got what I came for. The kazoo can wait for its own hero.`);
          return;
        }
        if (ctx.flag(F.knowsCageCode)) {
          await ctx.sayP(`Code 4-1-7...`);
          ctx.playSfx('door');
          await ctx.sayP(`Click! Sorry, kazoo. Just the wrench today.`);
          ctx.playSfx('pickup');
          ctx.giveItem('wrench');
          ctx.setFlag(F.hasWrench);
          await ctx.sayP(`Huh. The handle's covered in tiny glyphs. "A wrench that never slipped" indeed.`);
          return;
        }
        if (ctx.flag(F.wemmickOffDuty)) {
          await ctx.sayP(`Locked. A keypad. I need a code.`);
          await ctx.sayP(`Maybe the off-duty quartermaster is feeling generous...`);
          return;
        }
        await ctx.say('wemmick', `Step AWAY from the cage, rounding error.`);
      },
    },
    {
      id: 'bell',
      name: 'counter bell',
      polygon: [[120, 122], [136, 122], [136, 136], [120, 136]],
      walkTo: [128, 155],
      facing: 'up',
      onUse: async (ctx) => {
        ctx.playSfx('pickup');
        if (ctx.flag(F.wemmickOffDuty)) {
          await ctx.sayP(`Ding!`);
          await ctx.wait(600);
          await ctx.say('biddy', `The quartermaster is legally on break. Your ding has been queued. Estimated response time: the heat death of bureaucracy.`);
        } else {
          await ctx.sayP(`Ding!`);
          await ctx.say('wemmick', `I am ALREADY HERE. I am ALWAYS here. The bell is for emergencies and you are not an emergency, you are a mild irregularity.`);
        }
      },
      onLook: say('pip', `A counter bell polished to a mirror shine. My reflection looks under-qualified.`),
    },
    {
      id: 'shelves',
      name: 'supply shelves',
      polygon: [[20, 65], [105, 65], [105, 140], [20, 140]],
      walkTo: [65, 155],
      facing: 'left',
      onLook: async (ctx) => {
        await ctx.sayP(`Shelving sorted by a system I can't begin to parse. Boxes labeled "MISC", "MISC II", and "SON OF MISC".`);
      },
      onUse: say('wemmick', `Browsing requires Form BR-1, "Intent to Gaze."`),
    },
  ],
};
