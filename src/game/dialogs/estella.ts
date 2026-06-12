import type { DialogDef } from '../../engine/types';
import { lines } from '../../engine/script';
import { F } from '../flags';

export const estellaDialog: DialogDef = {
  id: 'estella',
  actor: 'estella',
  start: 'root',
  nodes: {
    root: {
      choices: [
        {
          id: 'intro',
          text: `Hi! Pip Gibbous! I'm new!`,
          once: true,
          response: lines(
            ['estella', `Evidently. You're standing on my calibration grid.`],
            ['pip', `Sorry! Is this better?`],
            ['estella', `Now you're standing on my other calibration grid. Dr. Estella. Xenoglyphology. Don't touch anything, including, ideally, the floor.`],
          ),
          effects: (s) => {
            s.flags[F.metEstella] = true;
          },
        },
        {
          id: 'xeno',
          text: `Xenoglyphology? So there ARE alien glyphs!`,
          condition: (s) => !!s.flags[F.metEstella],
          once: true,
          response: lines(
            ['estella', `There are THEORETICAL glyphs. My entire field is theoretical, according to the administration. So is my funding.`],
            ['pip', `What would the theoretical glyphs say? Theoretically.`],
            ['estella', `That's the infuriating part. I had three weeks with the originals before the shaft was sealed and every sample was "remanded to administration."`],
            ['estella', `Three weeks of data, and the sequence is incomplete. It's like being handed half a sentence. "DEAR VISITOR, WHATEVER YOU DO, PLEASE—" and then nothing.`],
          ),
          effects: (s) => {
            s.flags[F.knowsEstellaStuck] = true;
          },
        },
        {
          id: 'whoSealed',
          text: `Who sealed the shaft?`,
          condition: (s) => !!s.flags[F.knowsEstellaStuck],
          once: true,
          response: lines(
            ['estella', `Ms. Havisham. The owner. I report to her weekly: no progress, no samples, no access. She listens, smiles, and says "good."`],
            ['pip', `Good?!`],
            ['estella', `She's been waiting 26 years for that door. I think she wants to be the one holding the data when it matters.`],
          ),
        },
        {
          id: 'afterRubbings',
          text: `So what do the glyphs actually say?`,
          condition: (s) => !!s.flags[F.gaveRubbings],
          response: lines(
            ['estella', `It's an arrival protocol. The door isn't a lock, Pip. It's a doorbell. The keys ring it.`],
            ['pip', `And the order? Of the keys?`],
            ['estella', `Moon, hand, spiral. Smallest to largest. Get it wrong and... actually the glyphs are quite relaxed about it. There's what I can only translate as "no wrong answers, friend."`],
            ['pip', `Friendly door.`],
            ['estella', `That's what worries me.`],
          ),
          effects: (s) => {
            s.flags[F.knowsKeyOrder] = true;
          },
        },
        {
          id: 'bye',
          text: `I'll let you calibrate.`,
          response: lines(['estella', `Take your footprints with you.`]),
          goto: 'end',
        },
      ],
    },
  },
};
