import type { RoomDef } from '../../engine/types';
import { say } from '../../engine/script';

export const tunnels: RoomDef = {
  id: 'tunnels',
  name: 'Maintenance Tunnels',
  background: 'bg/tunnels',
  music: 'music/tunnels',
  walkboxes: [{ points: [[30, 145], [290, 145], [300, 196], [20, 196]] }],
  scale: { yTop: 145, sTop: 0.8, yBottom: 196, sBottom: 1 },
  spawns: {
    fromCorridor: { at: [45, 170], facing: 'right' },
  },
  exits: [
    {
      to: 'corridor',
      spawn: 'fromTunnels',
      name: 'the corridor',
      polygon: [[0, 100], [32, 100], [32, 196], [0, 196]],
      walkTo: [42, 170],
    },
  ],
  actors: [
    {
      actor: 'magwitch',
      at: [200, 165],
      facing: 'left',
      dialog: 'magwitch',
      onLook: say('pip', `A man who has clearly been living here a very long time, and has made it... homey? The beard has its own zip code.`),
      onUseItem: {
        mint: say('magwitch', `Keep your sweets, lad. I've got a potato crop coming in. Third generation. They know me.`),
      },
    },
  ],
  hotspots: [
    {
      id: 'nest',
      name: 'cozy nest',
      polygon: [[235, 110], [295, 110], [295, 150], [235, 150]],
      walkTo: [240, 162],
      facing: 'right',
      onLook: say('pip', `A nest of insulation panels, arranged with real interior-design intent. There's a throw pillow made of caution tape.`),
      onUse: say('magwitch', `Oi! You don't sit in another man's nest. Vent rules.`),
    },
    {
      id: 'garden',
      name: 'filter garden',
      polygon: [[90, 110], [160, 110], [160, 148], [90, 148]],
      walkTo: [125, 160],
      facing: 'up',
      onLook: async (ctx) => {
        await ctx.sayP(`He's growing potatoes in an old air filter. Rows of them. With little name tags.`);
        await ctx.sayP(`This one's called "Gerald".`);
      },
      onUse: say('magwitch', `Don't touch Gerald. Gerald's nearly ready.`),
    },
    {
      id: 'tally',
      name: 'tally marks',
      polygon: [[180, 80], [240, 80], [240, 108], [180, 108]],
      onLook: async (ctx) => {
        await ctx.sayP(`Tally marks scratched into the wall. Thousands. Grouped in fives, then crossed out and regrouped in sevens.`);
        await ctx.say('magwitch', `Weeks felt more honest. Then the clocks stopped and I gave up arithmetic altogether.`);
      },
    },
  ],
  onEnter: async (ctx) => {
    if (ctx.flag('tunnelsEntered')) return;
    ctx.setFlag('tunnelsEntered');
    await ctx.sayP(`Hello? Mysterious breathing sound?`);
    await ctx.wait(600);
    await ctx.say('magwitch', `WHO GOES TH— ...oh. It's a small one.`);
    await ctx.sayP(`AAAH! I mean. Hello. I'm Pip. I like what you've done with the... duct.`);
    await ctx.say('magwitch', `Twenty-six years and the first visitor compliments the decor. Sit down, lad. Mind Gerald.`);
  },
};
