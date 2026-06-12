import type { DialogDef } from '../../engine/types';
import { lines } from '../../engine/script';
import { F } from '../flags';

export const biddyDialog: DialogDef = {
  id: 'biddy',
  actor: 'biddy',
  start: 'root',
  nodes: {
    root: {
      choices: [
        {
          id: 'hello',
          text: `Hello? Is this thing on?`,
          once: true,
          response: lines(
            ['biddy', `Base Integrated Data and Diagnostics, Yeoman-class. "BIDDY," if you must.`],
            ['pip', `Nice to meet you, BIDDY! I'm Pip!`],
            ['biddy', `I know. I scanned your luggage. My condolences on the socks.`],
            ['pip', `My luggage made it?!`],
            ['biddy', `No. But I scanned it on the way past the window.`],
          ),
        },
        {
          id: 'tips',
          text: `Any tips for my first day?`,
          response: async (ctx) => {
            if (!ctx.flag(F.knowsTonerNeeded)) {
              await ctx.say('biddy', `Tip one: Officer Pumblechook controls the only door. Tip two: he enjoys being needed. Combine these facts.`);
            } else if (!ctx.flag(F.crateOpen)) {
              await ctx.say('biddy', `The supply crate in the landing bay contains either toner or six hundred branded stress balls. The manifest is ambiguous.`);
              await ctx.sayP(`How do I get it open?`);
              await ctx.say('biddy', `Historically? Scissors. The emergency kit may surprise you with its commitment to mediocrity.`);
            } else if (!ctx.flag(F.badgePrinted)) {
              await ctx.say('biddy', `You possess toner. Pumblechook needs toner. I believe even an intern can complete this circuit.`);
            } else {
              await ctx.say('biddy', `You have a badge now. Try not to let the power change you.`);
            }
          },
        },
        {
          id: 'base',
          text: `What's the deal with this base?`,
          once: true,
          response: lines(
            ['biddy', `Havisham Base. Forty-one crew, one owner, zero functioning clocks. We mine helium-3 and, lately, secrets.`],
            ['pip', `Secrets?`],
            ['biddy', `Did I say secrets? I meant regolith. They sound so alike.`],
          ),
        },
        {
          id: 'clocks',
          text: `What happened to the clocks?`,
          condition: (s) => !!s.flags[F.sawStoppedClock],
          once: true,
          response: lines(
            ['biddy', `All base clocks stopped at 4:17 three weeks ago. This is fine.`],
            ['pip', `That doesn't sound fine.`],
            ['biddy', `Time is a social construct. NEXT QUESTION.`],
          ),
        },
        {
          id: 'bye',
          text: `Talk to you later, BIDDY.`,
          response: lines(['biddy', `I'll be here. I'm load-bearing.`]),
          goto: 'end',
        },
      ],
    },
  },
};
