import type { RoomDef } from '../../engine/types';
import { say } from '../../engine/script';
import { F } from '../flags';

export const havisham: RoomDef = {
  id: 'havisham',
  name: "Ms. Havisham's Quarters",
  background: 'bg/havisham',
  music: 'music/door',
  walkboxes: [{ points: [[25, 145], [295, 145], [305, 196], [15, 196]] }],
  scale: { yTop: 145, sTop: 0.7, yBottom: 196, sBottom: 1 },
  overlays: [
    { image: 'fg/havisham-table', x: 0, y: 0, z: 192 },
    { image: 'fg/havisham-chair', x: 0, y: 0, z: 187 },
  ],
  ambients: [
    { image: 'fg/havisham-amb-sconce', x: 0, y: 0, z: 0, mode: 'flicker', max: 0.45 },
    { image: 'fg/havisham-amb-window-shaft', x: 0, y: 0, z: 0, mode: 'pulse', period: 9, max: 0.2 },
  ],
  spawns: {
    fromHub: { at: [35, 172], facing: 'right' },
    fromLab: { at: [35, 172], facing: 'right' },
  },
  exits: [
    {
      to: 'hub',
      spawn: 'fromAdmin',
      name: 'the hub',
      polygon: [[0, 100], [27, 100], [27, 196], [0, 196]],
      walkTo: [33, 172],
    },
  ],
  actors: [
    {
      actor: 'havisham',
      at: [272, 192],
      facing: 'left',
      dialog: 'havisham',
      onLook: say('pip', `Ms. Havisham. She sits perfectly still, like a portrait of herself. The dust around her chair is undisturbed in a precise circle.`),
      onUseItem: {
        mint: async (ctx) => {
          await ctx.sayP(`Ms. Havisham... I'd like to offer something for the table. It's not much.`);
          await ctx.say('havisham', `A... confection?`);
          await ctx.sayP(`A complimentary mint. From the shuttle. It's shaped like a tiny moon.`);
          await ctx.wait(700);
          await ctx.say('havisham', `Child. Nothing NEW has been brought to this table in twenty-six years. They bring reports. Forms. Apologies. Never... sweetness.`);
          ctx.removeItem('mint');
          ctx.setFlag(F.gaveMint);
          await ctx.say('havisham', `It will sit beside the cake. The first new guest at the party. And you—`);
          await ctx.say('havisham', `Take the silver from the cake, child. I believe it has been waiting for you, the way I have been waiting for the door.`);
          await ctx.sayP(`You KNEW it was a key?`);
          await ctx.say('havisham', `I told you. The door and I understand each other.`);
          await ctx.say('havisham', `And take my clearance. ALL of it. If the bell is to ring, let it be rung by someone who brings mints to old women.`);
          ctx.setFlag(F.minerClearance);
          ctx.playSfx('print');
          await ctx.sayP(`...My badge just made a noise like a promotion.`);
        },
      },
    },
    {
      actor: 'estella',
      at: [80, 158],
      facing: 'right',
      condition: (s) => !s.flags[F.metHavisham],
      onTalk: say('estella', `Report first, gawp later, Pip. And don't mention the dust. She considers it an heirloom.`),
      onLook: say('pip', `Estella, standing at parade rest. She's done this report before. Many times.`),
    },
  ],
  hotspots: [
    {
      id: 'cake',
      name: 'the cake',
      polygon: [[140, 100], [205, 100], [205, 148], [140, 148]],
      walkTo: [172, 160],
      facing: 'up',
      onLook: async (ctx) => {
        if (ctx.flag(F.hasStirrer)) {
          await ctx.sayP(`The commissioning cake, minus one ceremonial stirrer, plus one complimentary mint. The party is finally coming together.`);
        } else {
          await ctx.sayP(`A six-tier cake under a glass dome, freeze-dried by 26 years of base air. A long silver stirrer stands in the top tier like a sword in a stone.`);
        }
      },
      onUse: async (ctx) => {
        if (ctx.flag(F.hasStirrer)) {
          await ctx.sayP(`I have what I came for. The cake and I are at peace.`);
          return;
        }
        if (ctx.flag(F.gaveMint)) {
          await ctx.sayP(`Excuse me, cake. By invitation of the lady of the house...`);
          ctx.playSfx('pickup');
          ctx.giveItem('stirrer');
          ctx.setFlag(F.hasStirrer);
          await ctx.sayP(`It slid out like it was greased. And it's HUMMING. Key number three.`);
          await ctx.say('havisham', `Mind the crumbs, child. They're vintage.`);
          return;
        }
        await ctx.say('havisham', `DON'T. TOUCH. THE CAKE.`);
        await ctx.sayP(`Noted! Hands very visible! Nobody is touching the cake!`);
      },
    },
    {
      id: 'grandclock',
      name: 'grandfather clock',
      polygon: [[255, 65], [290, 65], [290, 145], [255, 145]],
      walkTo: [260, 158],
      facing: 'right',
      onLook: async (ctx) => {
        await ctx.sayP(`A grandfather clock, stopped at 4:17. Naturally.`);
        await ctx.sayP(`There's a brass plaque: "STOPPED BY MUTUAL AGREEMENT."`);
      },
    },
    {
      id: 'portrait',
      name: 'covered portrait',
      polygon: [[55, 60], [115, 60], [115, 130], [55, 130]],
      walkTo: [85, 155],
      facing: 'up',
      onLook: say('pip', `A portrait under a dust sheet. A corner has slipped: I can see a painted shuttle, and the name "SATIS" on the hull.`),
      onUse: async (ctx) => {
        await ctx.say('havisham', `Leave the sheet, child. Some guests prefer to arrive before they are seen.`);
        await ctx.sayP(`That sentence is going to keep me up at night.`);
      },
    },
  ],
  onEnter: async (ctx) => {
    if (ctx.flag('havishamRoomSeen')) return;
    ctx.setFlag('havishamRoomSeen');
    await ctx.fadeIn(600);
    await ctx.sayP(`...Every clock in here is stopped. There must be thirty of them.`);
    await ctx.say('estella', `Thirty-one. She'll know if you wind one. Don't wind one.`);
    await ctx.say('havisham', `Estella. You've brought me... a development.`);
    await ctx.say('estella', `Ma'am. The glyph sequence is complete. It reads: "Dear visitor, whatever you do, please ring ahead."`);
    await ctx.wait(800);
    await ctx.say('havisham', `Ahhh. After twenty-six years... etiquette at last.`);
  },
};
