import type { GameContent } from '../engine/game';
import { actors } from './actors';
import { items } from './items';
import { landing } from './rooms/landing';
import { reception } from './rooms/reception';
import { hub } from './rooms/hub';
import { corridor } from './rooms/corridor';
import { quarters } from './rooms/quarters';
import { engineering } from './rooms/engineering';
import { lab } from './rooms/lab';
import { stores } from './rooms/stores';
import { tunnels } from './rooms/tunnels';
import { havisham } from './rooms/havisham';
import { minehead } from './rooms/minehead';
import { doorchamber } from './rooms/doorchamber';
import { pumblechookDialog } from './dialogs/pumblechook';
import { biddyDialog } from './dialogs/biddy';
import { joeDialog } from './dialogs/joe';
import { wemmickOnDialog, wemmickOffDialog } from './dialogs/wemmick';
import { estellaDialog } from './dialogs/estella';
import { magwitchDialog } from './dialogs/magwitch';
import { havishamDialog } from './dialogs/havisham';
import { music } from './music';
import { sfx } from './sfx';

export const content: GameContent = {
  rooms: {
    landing,
    reception,
    hub,
    corridor,
    quarters,
    engineering,
    lab,
    stores,
    tunnels,
    havisham,
    minehead,
    doorchamber,
  },
  dialogs: {
    pumblechook: pumblechookDialog,
    biddy: biddyDialog,
    joe: joeDialog,
    wemmickOn: wemmickOnDialog,
    wemmickOff: wemmickOffDialog,
    estella: estellaDialog,
    magwitch: magwitchDialog,
    havisham: havishamDialog,
  },
  actors,
  items,
  music,
  sfx,
  player: 'pip',
  startRoom: 'landing',
  startSpawn: 'start',
  defaults: {
    look: [
      `It's exactly as thrilling as it looks.`,
      `I have no strong feelings about that, and I intend to keep it that way.`,
      `Fascinating. In the way that beige is fascinating.`,
      `I'd describe it, but my contract says I'm not allowed to editorialize.`,
    ],
    use: [
      `It refuses to cooperate.`,
      `Nothing happens. Aggressively.`,
      `I poked it. We both regret it.`,
      `My clearance level says no.`,
    ],
    useItem: [
      `Those two things have no future together.`,
      `That combination violates several safety codes I was forced to memorize on the shuttle.`,
      `I don't think so. And if it DID work, I'd be legally responsible.`,
    ],
    talk: [
      `I talk to objects on Tuesdays only.`,
      `It has nothing to say to a probationary intern.`,
    ],
  },
};
