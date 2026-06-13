import type { RoomDef } from '../../engine/types';
import { say } from '../../engine/script';
import { F } from '../flags';

export const corridor: RoomDef = {
  id: 'corridor',
  name: 'Dormitory Corridor',
  background: 'bg/corridor',
  music: 'music/hub',
  walkboxes: [{ points: [[20, 142], [300, 142], [312, 196], [8, 196]] }],
  scale: { yTop: 142, sTop: 0.7, yBottom: 196, sBottom: 1 },
  overlays: [
    { image: 'fg/corridor-locker', x: 0, y: 0, z: 151 },
  ],
  ambients: [
    { image: 'fg/corridor-amb-light-a', x: 0, y: 0, z: 0, mode: 'flicker', max: 0.45 },
    { image: 'fg/corridor-amb-light-b', x: 0, y: 0, z: 0, mode: 'flicker', max: 0.45 },
  ],
  spawns: {
    fromHub: { at: [30, 175], facing: 'right' },
    fromQuarters: { at: [95, 152], facing: 'down' },
    fromTunnels: { at: [215, 150], facing: 'down' },
  },
  exits: [
    {
      to: 'hub',
      spawn: 'fromCorridor',
      name: 'the hub',
      polygon: [[0, 100], [22, 100], [22, 196], [0, 196]],
      walkTo: [28, 175],
    },
    {
      to: 'quarters',
      spawn: 'fromCorridor',
      name: 'your quarters',
      polygon: [[80, 80], [112, 80], [112, 142], [80, 142]],
      walkTo: [95, 150],
    },
    {
      to: 'tunnels',
      spawn: 'fromCorridor',
      name: 'the maintenance tunnels',
      condition: (s) => !!s.flags[F.ventOpen],
      polygon: [[200, 98], [232, 98], [232, 138], [200, 138]],
      walkTo: [215, 150],
    },
  ],
  actors: [
    {
      actor: 'biddy',
      at: [118, 124],
      dialog: 'biddy',
      onLook: say('pip', `A BIDDY intercom. The corridor ones have a slight echo, which she uses for dramatic effect.`),
    },
  ],
  hotspots: [
    {
      id: 'vent',
      name: 'ventilation grate',
      polygon: [[200, 98], [232, 98], [232, 138], [200, 138]],
      walkTo: [215, 150],
      facing: 'up',
      condition: (s) => !s.flags[F.ventOpen],
      onLook: async (ctx) => {
        await ctx.sayP(`A big ventilation grate. It's rattling.`);
        await ctx.sayP(`Vents don't rattle when the fans are off. Something in there is... breathing?`);
      },
      onUse: async (ctx) => {
        await ctx.sayP(`It's held on by four screws with weird heads. Of course it is.`);
        await ctx.say('biddy', `Tri-wing security screws. Standard issue for keeping interns out of load-bearing spaces.`);
      },
      onUseItem: {
        driver: async (ctx) => {
          await ctx.sayP(`Seventeen bits... here we go. Tri-wing!`);
          ctx.playSfx('cut');
          await ctx.wait(600);
          ctx.playSfx('door');
          ctx.setFlag(F.ventOpen);
          await ctx.sayP(`The grate's off! It's... roomier in there than I expected.`);
          await ctx.sayP(`Is that a WELCOME MAT?`);
        },
        scissors: say('pip', `Safety scissors versus security screws. I already know how this ends.`),
      },
    },
    {
      id: 'doors',
      name: 'crew quarters',
      polygon: [[130, 82], [186, 82], [186, 140], [130, 140]],
      onLook: say('pip', `Crew quarters. Through the doors: snoring in three-part harmony.`),
      onUse: say('pip', `I'm not waking up miners on my first week. They have drills. The big kind.`),
    },
    {
      id: 'noticeboard',
      name: 'notice board',
      polygon: [[250, 80], [292, 80], [292, 120], [250, 120]],
      onLook: async (ctx) => {
        await ctx.sayP(`"LOST: one wrench. Sentimental value. — Joe."`);
        await ctx.sayP(`"FOUND: nothing. Nothing has ever been found. — Quartermaster Wemmick."`);
        await ctx.sayP(`"SHAFT 9 DOES NOT EXIST — Management." Someone wrote "then where does the elevator go" underneath.`);
      },
    },
  ],
};
