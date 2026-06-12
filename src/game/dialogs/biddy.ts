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
          text: `Any tips? I'm asking the walls now. This is my life.`,
          response: async (ctx) => {
            const f = (k: string) => !!ctx.flag(k);
            if (!f(F.knowsTonerNeeded)) {
              await ctx.say('biddy', `Tip one: Officer Pumblechook controls the only door. Tip two: he enjoys being needed. Combine these facts.`);
            } else if (!f(F.crateOpen)) {
              await ctx.say('biddy', `The supply crate in the landing bay contains either toner or six hundred branded stress balls. The manifest is ambiguous.`);
              await ctx.sayP(`How do I get it open?`);
              await ctx.say('biddy', `Historically? Scissors. The emergency kit may surprise you with its commitment to mediocrity.`);
            } else if (!f(F.badgePrinted)) {
              await ctx.say('biddy', `You possess toner. Pumblechook needs toner. I believe even an intern can complete this circuit.`);
            } else if (!f(F.metMagwitch)) {
              if (!f(F.hasDriver)) {
                await ctx.say('biddy', `The dormitory corridor vent rattles at night. Officially: thermal expansion. Unofficially: ask the engineer for something with a screwdriver bit.`);
                if (!f(F.coffeeFixed)) {
                  await ctx.say('biddy', `The engineer's cooperation, like most things on this base, runs on coffee.`);
                }
              } else {
                await ctx.say('biddy', `You have a multidriver. The corridor vent has screws. I have said too much.`);
              }
            } else if (!f(F.knowsAboutKeys)) {
              await ctx.say('biddy', `Your new neighbor in the ventilation has 26 years of base history. Interview him thoroughly.`);
            } else if (!f(F.hasPaperweight) || !f(F.hasWrench) || !f(F.hasStirrer)) {
              const missing: string[] = [];
              if (!f(F.hasPaperweight)) missing.push('a paperweight guarded by a man who never leaves his desk');
              if (!f(F.hasWrench)) missing.push('a wrench in a cage guarded by a man who never leaves his shift');
              if (!f(F.hasStirrer)) missing.push('cutlery guarded by a woman who never leaves the past');
              await ctx.say('biddy', `Outstanding: ${missing.join('; ')}. Every guardian on this base has exactly one weakness. Find them.`);
              if (!f(F.hasStirrer) && !f(F.gaveRubbings) && f(F.knowsEstellaStuck)) {
                await ctx.say('biddy', `Also: Dr. Estella would commit minor crimes for complete glyph data. The administration wing only opens for her.`);
              }
            } else if (!f(F.knowsKeyOrder)) {
              await ctx.say('biddy', `Three keys, one order. Dr. Estella finished her translation. Asking her would be faster than guessing.`);
            } else if (!f(F.doorOpened)) {
              await ctx.say('biddy', `Shaft 9 is open to you. I would say "good luck," but my sincerity module was never installed.`);
            } else {
              await ctx.say('biddy', `Tips? You opened the door. I'm taking tips from YOU now.`);
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
