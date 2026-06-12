import type { ActorDef } from '../engine/types';

export const actors: Record<string, ActorDef> = {
  pip: {
    id: 'pip',
    name: 'Pip Gibbous',
    talkColor: '#e8e8e8',
    color: '#4a78c8',
    w: 14,
    h: 42,
  },
  pumblechook: {
    id: 'pumblechook',
    name: 'Officer Pumblechook',
    talkColor: '#f0a868',
    color: '#8a5a30',
    w: 18,
    h: 44,
  },
  // BIDDY speaks through intercom panels; this "actor" is only used so the
  // engine has something to attach talk text to when an intercom is on-screen.
  biddy: {
    id: 'biddy',
    name: 'BIDDY',
    talkColor: '#78e8d8',
    color: '#203838',
    w: 10,
    h: 10,
  },
};
