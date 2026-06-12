import type { RoomDef } from '../../engine/types';
import { say } from '../../engine/script';
import { F } from '../flags';

const hasAllKeys = (f: (k: string) => unknown) =>
  !!f(F.hasPaperweight) && !!f(F.hasWrench) && !!f(F.hasStirrer);

export const minehead: RoomDef = {
  id: 'minehead',
  name: 'Shaft 9 Mine Head',
  background: 'bg/minehead',
  music: 'music/tunnels',
  walkboxes: [{ points: [[20, 142], [300, 142], [312, 196], [8, 196]] }],
  scale: { yTop: 142, sTop: 0.68, yBottom: 196, sBottom: 1 },
  overlays: [
    { image: 'fg/minehead-winch', x: 0, y: 0, z: 180 },
  ],
  ambients: [
    { image: 'fg/minehead-amb-lamp-a', x: 0, y: 0, z: 0, mode: 'flicker', max: 0.5 },
    { image: 'fg/minehead-amb-lamp-b', x: 0, y: 0, z: 0, mode: 'flicker', max: 0.45 },
  ],
  spawns: {
    fromHub: { at: [30, 175], facing: 'right' },
    fromDoor: { at: [250, 160], facing: 'down' },
  },
  exits: [
    {
      to: 'hub',
      spawn: 'fromMinehead',
      name: 'the hub',
      polygon: [[0, 100], [22, 100], [22, 196], [0, 196]],
      walkTo: [28, 175],
    },
    {
      to: 'doorchamber',
      spawn: 'fromElevator',
      name: 'the elevator down',
      polygon: [[225, 70], [280, 70], [280, 145], [225, 145]],
      walkTo: [250, 158],
      onExit: async (ctx) => {
        if (!hasAllKeys(ctx.flag)) {
          await ctx.sayP(`I'm not going down to a 26-thousand-year-old door without all three keys.`);
          await ctx.say('biddy', `A rare display of intern judgment. Logged with disbelief.`);
          return false;
        }
        ctx.playSfx('door');
        await ctx.sayP(`Going down. Way down.`);
      },
    },
  ],
  actors: [
    {
      actor: 'biddy',
      at: [120, 120],
      dialog: 'biddy',
      onLook: say('pip', `A BIDDY intercom. The speaker grille looks... clenched? Can a grille look clenched?`),
    },
  ],
  hotspots: [
    {
      id: 'signs',
      name: 'warning signs',
      polygon: [[35, 70], [110, 70], [110, 115], [35, 115]],
      onLook: async (ctx) => {
        await ctx.sayP(`"SHAFT 9 DOES NOT EXIST."`);
        await ctx.sayP(`"HARD HATS REQUIRED INSIDE SHAFT 9."`);
        await ctx.sayP(`"IF YOU CAN READ THIS, YOU HAVE CLEARANCE YOU SHOULDN'T HAVE."`);
        await ctx.sayP(`The management style here is really coming into focus.`);
      },
    },
    {
      id: 'winch',
      name: 'mining winch',
      polygon: [[140, 85], [205, 85], [205, 140], [140, 140]],
      walkTo: [172, 152],
      facing: 'up',
      onLook: say('pip', `The big winch that dug the shaft. Someone has stuck a sticky note on it: "She's had enough. -J" `),
      onUse: say('pip', `Joe's handwriting says no, and I trust Joe's handwriting.`),
    },
  ],
  onEnter: async (ctx) => {
    if (ctx.flag('mineheadSeen')) return;
    ctx.setFlag('mineheadSeen');
    await ctx.say('biddy', `You are now inside Shaft 9, which does not exist. Accordingly, this conversation is not happening, and I am not asking you to be careful.`);
    await ctx.sayP(`BIDDY... are you WORRIED about me?`);
    await ctx.say('biddy', `I am a diagnostics system. I am diagnosing... concern. It's unpleasant. Please don't die; the paperwork is enormous.`);
  },
};
