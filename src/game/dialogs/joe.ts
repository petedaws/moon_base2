import type { DialogDef } from '../../engine/types';
import { lines } from '../../engine/script';
import { F } from '../flags';

export const joeDialog: DialogDef = {
  id: 'joe',
  actor: 'joe',
  start: 'root',
  nodes: {
    root: {
      choices: [
        {
          id: 'intro',
          text: `Hi! Pip Gibbous, new intern!`,
          once: true,
          response: lines(
            ['joe', `The intern! Ha! They said you'd be taller.`],
            ['pip', `Who said?`],
            ['joe', `The betting pool. Don't worry about it. Joe. Engineering. If it spins, hums, or explodes, it's mine.`],
            ['pip', `What if it does all three?`],
            ['joe', `Then it's the coffee machine, and we don't speak of her.`],
          ),
          effects: (s) => {
            s.flags[F.metJoe] = true;
          },
        },
        {
          id: 'coffee',
          text: `What's wrong with the coffee machine?`,
          condition: (s) => !!s.flags[F.metJoe] && !s.flags[F.coffeeFixed],
          response: lines(
            ['joe', `Heating coil burnt out three weeks ago. Same night the clocks stopped, not that anyone's counting.`],
            ['pip', `Can't you fix it?`],
            ['joe', `Stores has coils. Stores has Wemmick. Wemmick has FORMS. I'd rather drink coolant.`],
            ['pip', `How's the coolant?`],
            ['joe', `Minty.`],
          ),
          effects: (s) => {
            s.flags[F.knowsCoffeeBroken] = true;
          },
        },
        {
          id: 'borrow',
          text: `Could I borrow a screwdriver? Or... seventeen?`,
          condition: (s) => !s.flags[F.hasDriver],
          response: async (ctx) => {
            if (ctx.flag(F.coffeeFixed)) {
              await ctx.say('joe', `For the hero of the coffee machine? Take the multidriver. Bring her back with a story.`);
              ctx.giveItem('driver');
              ctx.setFlag(F.hasDriver);
              await ctx.sayP(`I will treasure and/or lose it.`);
              return;
            }
            await ctx.say('joe', `Tools are family, Pip. I don't lend family to strangers.`);
            await ctx.sayP(`How do I stop being a stranger?`);
            await ctx.say('joe', `Get that coffee machine in the hub humming again and you can borrow anything that isn't bolted down.`);
            await ctx.say('joe', `...And on this base, kid, everything's bolted down except the problems.`);
            ctx.setFlag(F.knowsCoffeeBroken);
          },
        },
        {
          id: 'shaft9',
          text: `What can you tell me about Shaft 9?`,
          condition: (s) => !!s.flags[F.heardShaft9Denial] || !!s.flags[F.enteredHub],
          once: true,
          response: lines(
            ['joe', `...You see that tool wall? Every outline filled but one.`],
            ['pip', `The wrench-shaped one?`],
            ['joe', `My lucky wrench. Carried her eleven years. Then I did one little repair job down a shaft that doesn't exist, and suddenly she's "unauthorized morale equipment" in Wemmick's cage.`],
            ['pip', `What did you repair down there?`],
            ['joe', `An elevator. For going down to a thing I didn't see, that isn't there, behind a door that doesn't open. Allegedly.`],
          ),
        },
        {
          id: 'wrench',
          text: `I got your lucky wrench back!`,
          condition: (s) => !!s.flags[F.hasWrench],
          once: true,
          response: lines(
            ['joe', `Ha! Look at her! Eleven years of luck and not a scratch— hang on. Why's she glowing?`],
            ['pip', `Funny story. She might be a 26-thousand-year-old alien artifact.`],
            ['joe', `...That explains the luck. Keep her, Pip. Sounds like you'll need it more than me.`],
            ['pip', `Joe, I— thank you.`],
            ['joe', `Bring her back with a story. That's all I ask.`],
          ),
        },
        {
          id: 'bye',
          text: `See you around, Joe.`,
          response: lines(['joe', `Mind the third floor panel. It bites.`]),
          goto: 'end',
        },
      ],
    },
  },
};
