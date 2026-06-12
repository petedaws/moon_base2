import type { DialogDef } from '../../engine/types';
import { lines } from '../../engine/script';
import { F } from '../flags';

export const havishamDialog: DialogDef = {
  id: 'havisham',
  actor: 'havisham',
  start: 'root',
  nodes: {
    root: {
      choices: [
        {
          id: 'who',
          text: `Ms. Havisham? I'm Pip. The, um, intern.`,
          once: true,
          response: lines(
            ['havisham', `An intern. How wonderful. We had interns on the Satis. Bright little candles, all of them.`],
            ['pip', `You were on the first expedition?`],
            ['havisham', `I FUNDED the first expedition, child. I have funded everything in this crater since before your parents met. Sit. No — stand. The chairs are part of the arrangement.`],
          ),
          effects: (s) => {
            s.flags[F.metHavisham] = true;
          },
        },
        {
          id: 'cake',
          text: `That's a... remarkable cake.`,
          condition: (s) => !!s.flags[F.metHavisham],
          once: true,
          response: lines(
            ['havisham', `The commissioning cake. Baked for the grand opening of the dig. Twenty-six years ago next Tuesday.`],
            ['pip', `You never cut it?`],
            ['havisham', `One does not cut the cake before the guests arrive, child.`],
            ['pip', `What guests?`],
            ['havisham', `The ones beneath us. They were INVITED. The glyphs are an invitation — did your clever doctor not tell you? It would be rude to celebrate without them.`],
          ),
        },
        {
          id: 'waiting',
          text: `You've been waiting for the door all this time?`,
          condition: (s) => !!s.flags[F.metHavisham],
          once: true,
          response: lines(
            ['havisham', `I stopped the clocks myself, you know. The first time. Or — no. The door did that. But I LET it. We understand each other, the door and I.`],
            ['pip', `What do you think is behind it?`],
            ['havisham', `At my age, child, what matters is not what answers the bell. It is that I am still here to hear the chime.`],
            ['pip', `That's either beautiful or terrifying.`],
            ['havisham', `At my age, those are the same thing.`],
          ),
        },
        {
          id: 'askStirrer',
          text: `About the stirrer in your cake...`,
          condition: (s) => !!s.flags[F.knowsAboutKeys] && !s.flags[F.hasStirrer] && !s.flags[F.gaveMint],
          response: lines(
            ['havisham', `The silver piece? It came up from the dig with the first samples. The crew mislabeled it "catering equipment." I knew better. Into the cake it went — the heart of the celebration.`],
            ['pip', `Could I... borrow it?`],
            ['havisham', `Child. One does not REACH INTO the cake. One is INVITED to the cake. Bring something worthy of the table, and we shall discuss it.`],
          ),
        },
        {
          id: 'bye',
          text: `I should let you... wait.`,
          response: lines(['havisham', `Yes. We're all waiting, child. Some of us are simply better at it.`]),
          goto: 'end',
        },
      ],
    },
  },
};
