import type { RoomDef } from '../../engine/types';
import { say } from '../../engine/script';
import { F } from '../flags';

export const hub: RoomDef = {
  id: 'hub',
  name: 'Central Hub',
  background: 'bg/hub',
  music: 'music/hub',
  walkboxes: [{ points: [[70, 140], [296, 140], [296, 147], [70, 147]] }, { points: [[258, 140], [296, 140], [310, 196], [258, 196]] }, { points: [[10, 190], [310, 190], [310, 196], [10, 196]] }, { points: [[10, 153], [53, 153], [53, 196], [10, 196]] }],
  scale: { yTop: 140, sTop: 0.62, yBottom: 196, sBottom: 1 },
  overlays: [
    { image: 'fg/hub-table-left', x: 0, y: 0, z: 193 },
    { image: 'fg/hub-table-right', x: 0, y: 0, z: 184 },
    { image: 'fg/hub-vending', x: 0, y: 0, z: 152 },
  ],
  ambients: [
    { image: 'fg/hub-amb-skylight', x: 0, y: 0, z: 0, mode: 'pulse', period: 7, max: 0.3 },
    { image: 'fg/hub-amb-lamp-a', x: 0, y: 0, z: 0, mode: 'flicker', max: 0.4 },
    { image: 'fg/hub-amb-lamp-b', x: 0, y: 0, z: 0, mode: 'flicker', max: 0.4 },
    { image: 'fg/hub-amb-coffee-sign', x: 0, y: 0, z: 0, mode: 'blink', period: 3.4, max: 0.45 },
  ],
  spawns: {
    fromReception: { at: [35, 172], facing: 'right' },
    fromCorridor: { at: [108, 144], facing: 'down' },
    fromLab: { at: [178, 144], facing: 'down' },
    fromAdmin: { at: [232, 144], facing: 'down' },
    fromStores: { at: [275, 144], facing: 'down' },
    fromEngineering: { at: [288, 148], facing: 'left' },
    fromMinehead: { at: [288, 178], facing: 'left' },
  },
  exits: [
    {
      to: 'reception',
      spawn: 'fromHub',
      name: 'reception',
      polygon: [[0, 100], [24, 100], [24, 196], [0, 196]],
      walkTo: [32, 172],
    },
    {
      to: 'corridor',
      spawn: 'fromHub',
      name: 'the dormitories',
      polygon: [[88, 75], [130, 75], [130, 142], [88, 142]],
      walkTo: [108, 150],
      door: { image: 'fg/hub-door1', clip: [92, 96, 37, 71], dx: 0, dy: -65 },
    },
    {
      to: 'lab',
      spawn: 'fromHub',
      name: 'the lab',
      polygon: [[158, 75], [200, 75], [200, 142], [158, 142]],
      walkTo: [178, 150],
      door: { image: 'fg/hub-door2', clip: [163, 100, 35, 65], dx: 0, dy: -60 },
    },
    {
      to: 'havisham',
      spawn: 'fromHub',
      name: 'the administration wing',
      condition: (s) => !!s.flags[F.gaveRubbings],
      polygon: [[214, 75], [253, 75], [253, 142], [214, 142]],
      walkTo: [232, 150],
      door: { image: 'fg/hub-door3', clip: [219, 103, 34, 60], dx: 0, dy: -55 },
    },
    {
      to: 'stores',
      spawn: 'fromHub',
      name: 'stores',
      polygon: [[257, 75], [295, 75], [295, 142], [257, 142]],
      walkTo: [275, 150],
      door: { image: 'fg/hub-door4', clip: [262, 106, 32, 56], dx: 0, dy: -50 },
    },
    {
      to: 'engineering',
      spawn: 'fromHub',
      name: 'engineering',
      polygon: [[298, 95], [320, 95], [320, 148], [298, 148]],
      walkTo: [290, 146],
    },
    {
      to: 'minehead',
      spawn: 'fromHub',
      name: 'Shaft 9',
      condition: (s) => !!s.flags[F.minerClearance],
      polygon: [[298, 150], [320, 150], [320, 196], [298, 196]],
      walkTo: [290, 178],
    },
  ],
  actors: [
    {
      actor: 'biddy',
      at: [240, 118],
      dialog: 'biddy',
      onLook: say('pip', `Another BIDDY intercom. She gets around. Well... she IS the walls.`),
    },
    {
      actor: 'wemmick',
      at: [110, 168],
      facing: 'down',
      condition: (s) => !!s.flags[F.wemmickOffDuty],
      dialog: 'wemmickOff',
      onLook: say('pip', `Wemmick, off duty. He's holding his coffee with both hands like it might be recalled.`),
    },
  ],
  hotspots: [
    {
      id: 'adminDoor',
      name: 'administration wing door',
      polygon: [[214, 75], [253, 75], [253, 142], [214, 142]],
      walkTo: [232, 150],
      facing: 'up',
      condition: (s) => !s.flags[F.gaveRubbings],
      onLook: say('pip', `"ADMINISTRATION WING — BY APPOINTMENT ONLY." The appointment book is chained shut.`),
      onUse: async (ctx) => {
        await ctx.sayP(`Hello? Anyone?`);
        await ctx.say('biddy', `The administration wing admits Ms. Havisham, Dr. Estella on report days, and dust. You are none of these.`);
      },
    },
    {
      id: 'barrier',
      name: 'Shaft 9 barrier',
      polygon: [[298, 150], [320, 150], [320, 196], [298, 196]],
      walkTo: [290, 178],
      facing: 'right',
      condition: (s) => !s.flags[F.minerClearance],
      onLook: async (ctx) => {
        await ctx.sayP(`A heavy barrier across the freight lift to the mine. "AUTHORIZED MINING PERSONNEL ONLY."`);
        await ctx.sayP(`Someone has crossed out "MINING" and written "NO". Authorized no personnel only.`);
      },
      onUse: async (ctx) => {
        await ctx.say('biddy', `Mining clearance can be granted only by the base owner. The base owner has not granted anything since 2041.`);
        await ctx.sayP(`What happened in 2041?`);
        await ctx.say('biddy', `She granted one (1) interview. It went poorly for the interviewer.`);
      },
    },
    {
      id: 'coffee',
      name: 'coffee machine',
      polygon: [[20, 95], [48, 95], [48, 140], [20, 140]],
      walkTo: [40, 150],
      facing: 'left',
      onLook: async (ctx) => {
        if (ctx.flag(F.coffeeFixed)) {
          await ctx.sayP(`The coffee machine, alive and gurgling. It sounds like a tiny rocket launch. I'm so proud.`);
        } else {
          await ctx.sayP(`The base coffee machine. A black wreath hangs on it. Someone has left flowers.`);
        }
      },
      onUse: async (ctx) => {
        if (ctx.flag(F.coffeeFixed)) {
          ctx.playSfx('print');
          await ctx.sayP(`One cup of "Lunar Roast". It tastes like burnt regolith. It's PERFECT.`);
          return;
        }
        await ctx.sayP(`Nothing. Not a gurgle. The screen just says "4:17".`);
        await ctx.sayP(`Even the COFFEE MACHINE'S clock stopped. This base has problems.`);
      },
      onUseItem: {
        coil: async (ctx) => {
          await ctx.sayP(`Okay. Panel off... old coil out... new coil in... and the moment of truth.`);
          await ctx.wait(600);
          ctx.playSfx('print');
          await ctx.sayP(`IT LIVES! It's making a noise like a tiny rocket launch!`);
          ctx.removeItem('coil');
          ctx.setFlag(F.coffeeFixed);
          await ctx.say('biddy', `Base morale projection revised upward 340%. The intern is hereby slightly less of a rounding error.`);
        },
      },
    },
    {
      id: 'plant',
      name: 'potted plant',
      polygon: [[230, 125], [252, 125], [252, 145], [230, 145]],
      onLook: say('pip', `A potted fern, growing at a 45-degree angle toward the only window. I respect the hustle.`),
    },
  ],
  onEnter: async (ctx) => {
    if (ctx.flag(F.enteredHub)) return;
    ctx.setFlag(F.enteredHub);
    await ctx.sayP(`The central hub! The beating heart of Havisham Base!`);
    await ctx.wait(400);
    await ctx.say('biddy', `Dormitories north-west. Laboratory north. Stores north-east. Engineering east. The thing we don't talk about: below.`);
    await ctx.sayP(`What thing?`);
    await ctx.say('biddy', `Precisely.`);
  },
};
