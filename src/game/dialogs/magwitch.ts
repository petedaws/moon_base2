import type { DialogDef } from '../../engine/types';
import { lines } from '../../engine/script';
import { F } from '../flags';

export const magwitchDialog: DialogDef = {
  id: 'magwitch',
  actor: 'magwitch',
  start: 'root',
  nodes: {
    root: {
      choices: [
        {
          id: 'who',
          text: `Who ARE you?`,
          once: true,
          response: lines(
            ['magwitch', `Magwitch. Atmospheric technician, second class, of the survey vessel Satis. Crew complement: forty.`],
            ['pip', `I haven't heard of any Satis docked here.`],
            ['magwitch', `You wouldn't have. She left 26 years ago. I... didn't.`],
            ['pip', `You've been hiding in the VENTS for 26 YEARS?`],
            ['magwitch', `Hiding's a strong word. I prefer "long-term unauthorized residency." The air filters have never been cleaner.`],
          ),
          effects: (s) => {
            s.flags[F.metMagwitch] = true;
          },
        },
        {
          id: 'door',
          text: `What happened 26 years ago?`,
          condition: (s) => !!s.flags[F.metMagwitch],
          once: true,
          response: lines(
            ['magwitch', `We found it first. The door. Drilled right into its porch, so to speak.`],
            ['magwitch', `Went down with clocks, came up without 'em. Every timepiece on the Satis stopped the moment we brushed the dust off.`],
            ['pip', `The clocks here stopped three weeks ago!`],
            ['magwitch', `Aye. Which means the new crew brushed the dust off again. The door's awake, lad. It's holding its breath, waiting for someone to knock.`],
          ),
          effects: (s) => {
            s.flags[F.knowsAboutDoor] = true;
          },
        },
        {
          id: 'keys',
          text: `Is there a way to open it?`,
          condition: (s) => !!s.flags[F.knowsAboutDoor],
          once: true,
          response: lines(
            ['magwitch', `Open it! Ha! We spent a year trying to LOCK it. Made three keys from its own castoff metal, to plug the doorbell, and scattered 'em as rubbish so none would think to look.`],
            ['pip', `Scattered them where?`],
            ['magwitch', `A paperweight that fell from no sky. A wrench that never once slipped. And the silverware at the heart of the old lady's cake.`],
            ['pip', `...That's weirdly poetic.`],
            ['magwitch', `Twenty-six years in a vent, lad. You polish your material.`],
          ),
          effects: (s) => {
            s.flags[F.knowsAboutKeys] = true;
          },
        },
        {
          id: 'glyphs',
          text: `Do you know what the glyphs say?`,
          condition: (s) => !!s.flags[F.knowsAboutDoor] && !s.flags.gaveRubbingsToPip,
          response: async (ctx) => {
            await ctx.say('magwitch', `Couldn't read 'em. But I TOOK 'em. Charcoal and patience, the whole ring.`);
            await ctx.say('magwitch', `Here. Twenty-six years under my pillow. Well. Under my pile of pillow-shaped insulation.`);
            ctx.giveItem('rubbings');
            ctx.setFlag('gaveRubbingsToPip');
            await ctx.sayP(`The scientist in the lab would trade her calibration grids for these.`);
            await ctx.say('magwitch', `Then trade, lad! Knowledge kept in a vent helps nobody. I'm living proof.`);
          },
        },
        {
          id: 'havisham',
          text: `Did you know Ms. Havisham?`,
          condition: (s) => !!s.flags[F.knowsAboutKeys],
          once: true,
          response: lines(
            ['magwitch', `Know her? She was our expedition sponsor. Brilliant woman. Terrible at letting go.`],
            ['magwitch', `When the company recalled the Satis and sealed the find, she bought the whole crater. Built this base on top of it. Been sitting on that door like a hen on an egg ever since.`],
            ['pip', `For 26 years? Why?`],
            ['magwitch', `Some folk wait for a letter. Some for a ship. She waits for whatever's on the other side to answer.`],
          ),
        },
        {
          id: 'bye',
          text: `I should go. Need anything? Sunlight? A rescue?`,
          response: lines(
            ['magwitch', `At my age? The vent IS the rescue. But come back and talk, lad. The filters are poor conversation.`],
          ),
          goto: 'end',
        },
      ],
    },
  },
};
