import type { DialogDef } from '../../engine/types';
import { lines } from '../../engine/script';
import { F } from '../flags';

export const pumblechookDialog: DialogDef = {
  id: 'pumblechook',
  actor: 'pumblechook',
  start: 'root',
  nodes: {
    root: {
      choices: [
        {
          id: 'intro',
          text: `Hi! I'm Pip Gibbous, the new intern!`,
          once: true,
          response: lines(
            ['pumblechook', `Gibbous... Gibbous... ah. The intern. We expected you Tuesday.`],
            ['pip', `It IS Tuesday.`],
            ['pumblechook', `We expected you LAST Tuesday. Your punctuality has been noted in your file.`],
            ['pip', `I have a file already?`],
            ['pumblechook', `Everyone has a file. Some of us have two.`],
          ),
          effects: (s) => {
            s.flags[F.metPumblechook] = true;
          },
        },
        {
          id: 'place',
          text: `So this is Havisham Base! It's... cozy.`,
          once: true,
          response: lines(
            ['pumblechook', `Havisham Base is the premier lunar mining facility in this crater.`],
            ['pip', `How many mining facilities are in this crater?`],
            ['pumblechook', `One. Which is what makes us premier.`],
          ),
        },
        {
          id: 'through',
          text: `Can I head into the base now?`,
          condition: (s) => !s.flags[F.badgePrinted],
          response: lines(
            ['pumblechook', `Not without an intern badge. No badge, no entry. No entry, no badge ceremony. No ceremony, no badge.`],
            ['pip', `That's circular.`],
            ['pumblechook', `Thank you. I wrote it myself.`],
          ),
          goto: 'badge',
        },
        {
          id: 'shaft9',
          text: `What's everyone whispering about Shaft 9?`,
          once: true,
          condition: (s) => !!s.flags[F.metPumblechook],
          response: lines(
            ['pumblechook', `There is no Shaft 9. There has never been a Shaft 9. The shafts go: 8, then 10.`],
            ['pip', `That's not how numbers work.`],
            ['pumblechook', `Numbers work however the safety committee says they work. This conversation is not occurring.`],
          ),
          effects: (s) => {
            s.flags[F.heardShaft9Denial] = true;
          },
        },
        {
          id: 'desk',
          text: `Do you ever leave that desk?`,
          once: true,
          condition: (s) => !!s.flags[F.metPumblechook],
          response: lines(
            ['pumblechook', `The desk must never be unmanned. It's in the charter. Article one. The only article.`],
            ['pip', `What happens if it's unmanned?`],
            ['pumblechook', `Nobody knows. Nobody has ever been brave enough to find out.`],
          ),
        },
        {
          id: 'bye',
          text: `I'd better go.`,
          response: lines(['pumblechook', `Walk, don't bounce. Bouncing is for the gift shop.`]),
          goto: 'end',
        },
      ],
    },
    badge: {
      choices: [
        {
          id: 'wave',
          text: `Couldn't you just... wave me through?`,
          once: true,
          response: lines(
            ['pumblechook', `Wave you through? WAVE you THROUGH?`],
            ['pip', `Is that a no?`],
            ['pumblechook', `The last person I "waved through" turned out to be a meteoroid. We're still patching the canteen.`],
          ),
        },
        {
          id: 'printer',
          text: `So print me a badge!`,
          response: lines(
            ['pumblechook', `The badge printer is out of toner. Has been for a month. I have filed form TR-1138 in triplicate.`],
            ['pip', `And?`],
            ['pumblechook', `The forms department needs a badge to deliver the toner. You see the elegance of the system.`],
            ['pip', `So if I FOUND you some toner...`],
            ['pumblechook', `Then I would be legally cornered into printing your badge, yes.`],
          ),
          effects: (s) => {
            s.flags[F.knowsTonerNeeded] = true;
          },
        },
        {
          id: 'whereToner',
          text: `Where would one find toner around here?`,
          condition: (s) => !!s.flags[F.knowsTonerNeeded],
          response: lines(
            ['pumblechook', `Supplies arrive on your shuttle. Where they go after that is between the universe and the logistics department.`],
            ['pip', `So... the landing bay.`],
            ['pumblechook', `I admire an intern who can draw a conclusion. Slowly.`],
          ),
        },
        {
          id: 'back',
          text: `Let me ask about something else.`,
          goto: 'root',
        },
        {
          id: 'bye2',
          text: `I'll see what I can do about that toner.`,
          response: lines(['pumblechook', `Bring it unopened. I can tell. I can always tell.`]),
          goto: 'end',
        },
      ],
    },
  },
};
