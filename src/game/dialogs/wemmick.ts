import type { DialogDef } from '../../engine/types';
import { lines } from '../../engine/script';
import { F } from '../flags';

/** On-duty Wemmick: the human filing cabinet (stores). */
export const wemmickOnDialog: DialogDef = {
  id: 'wemmickOn',
  actor: 'wemmick',
  start: 'root',
  nodes: {
    root: {
      choices: [
        {
          id: 'intro',
          text: `Hello! I'm Pip, the new—`,
          once: true,
          response: lines(
            ['wemmick', `Name. Department. Requisition number.`],
            ['pip', `Pip. Um. Interning? No number yet?`],
            ['wemmick', `Then officially you are a rounding error. How may I assist you, rounding error?`],
          ),
        },
        {
          id: 'coil',
          text: `I need a heating coil for the coffee machine.`,
          condition: (s) => !!s.flags[F.knowsCoffeeBroken] && !s.flags[F.coffeeFixed],
          response: async (ctx) => {
            if (ctx.hasItem('form')) {
              await ctx.say('wemmick', `Form RQ-7. Signed. In TRIPLICATE.`);
              await ctx.sayP(`Ta-daa!`);
              await ctx.wait(400);
              await ctx.say('wemmick', `...It's beautiful work. The margins alone. One heating coil, dispensed with pleasure. Well. Dispensed.`);
              ctx.removeItem('form');
              ctx.giveItem('coil');
            } else {
              await ctx.say('wemmick', `Certainly. Upon receipt of requisition Form RQ-7, signed, in triplicate.`);
              await ctx.sayP(`Where do I get a Form RQ-7?`);
              await ctx.say('wemmick', `From someone who hoards forms the way dragons hoard gold.`);
              await ctx.sayP(`...Pumblechook.`);
              await ctx.say('wemmick', `I said what I said.`);
              ctx.setFlag(F.knowsFormNeeded);
            }
          },
        },
        {
          id: 'wrench',
          text: `Could I get Joe's wrench out of the cage?`,
          condition: (s) => !!s.flags[F.knowsAboutKeys] && !s.flags[F.hasWrench],
          response: lines(
            ['wemmick', `Confiscated item 779 requires the owner, a notarized affidavit, and me in a better mood.`],
            ['pip', `When are you in a better mood?`],
            ['wemmick', `Off duty. My shift ends at 4:30.`],
            ['pip', `The clocks all say 4:17.`],
            ['wemmick', `Yes. They have said 4:17 for THREE WEEKS. I have been thirteen minutes from happiness for THREE WEEKS.`],
          ),
        },
        {
          id: 'coffeeLure',
          text: `The hub coffee machine is fixed. Real coffee. Hot.`,
          condition: (s) => !!s.flags[F.coffeeFixed] && !s.flags[F.wemmickOffDuty],
          response: async (ctx) => {
            await ctx.say('wemmick', `Coffee. Actual coffee?`);
            await ctx.sayP(`I fixed the machine myself. It makes a noise like a tiny rocket launch.`);
            await ctx.say('wemmick', `Regulation 12-C entitles me to one (1) seven-minute break per... per...`);
            await ctx.wait(500);
            await ctx.say('wemmick', `Oh, HANG regulation 12-C.`);
            await ctx.say('wemmick', `NOTICE: the quartermaster is OFF DUTY. Anything you say will be met with warmth and generosity.`);
            ctx.setFlag(F.wemmickOffDuty);
            await ctx.fadeOut(300);
            ctx.placeActor('pip', 160, 175);
            await ctx.fadeIn(300);
            await ctx.sayP(`He cleared the counter in one leap. In lunar gravity that man could be an athlete.`);
          },
          goto: 'end',
        },
        {
          id: 'bye',
          text: `I'll come back with paperwork.`,
          response: lines(['wemmick', `Music to my ears, rounding error.`]),
          goto: 'end',
        },
      ],
    },
  },
};

/** Off-duty Wemmick: a man transformed (hub canteen). */
export const wemmickOffDialog: DialogDef = {
  id: 'wemmickOff',
  actor: 'wemmick',
  start: 'root',
  nodes: {
    root: {
      choices: [
        {
          id: 'who',
          text: `Wemmick? Is that you?`,
          once: true,
          response: lines(
            ['wemmick', `Pip! PIP! My favorite rounding error! Sit! Have you eaten? You haven't eaten.`],
            ['pip', `You seem... different.`],
            ['wemmick', `On duty I am the cage, Pip. Off duty I am the BIRD.`],
          ),
        },
        {
          id: 'cage',
          text: `About Joe's lucky wrench...`,
          condition: (s) => !s.flags[F.hasWrench],
          response: lines(
            ['wemmick', `The cage? Take whatever you need! The cage is a state of mind, Pip!`],
            ['pip', `It's also a literal cage. With a lock.`],
            ['wemmick', `Code's 4-1-7. Everything on this base is 4-1-7 now. We've stopped fighting it.`],
            ['pip', `Thanks, Wemmick!`],
            ['wemmick', `Thank YOU. This coffee tastes like 4:31, Pip. Like 4:31.`],
          ),
          effects: (s) => {
            s.flags.knowsCageCode = true;
          },
        },
        {
          id: 'bye',
          text: `Enjoy the break!`,
          response: lines(['wemmick', `Seven minutes, Pip. I shall live a LIFETIME.`]),
          goto: 'end',
        },
      ],
    },
  },
};
