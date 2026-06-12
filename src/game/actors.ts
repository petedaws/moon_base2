import type { ActorDef } from '../engine/types';

export const actors: Record<string, ActorDef> = {
  pip: {
    id: 'pip',
    name: 'Pip Gibbous',
    talkColor: '#e8e8e8',
    color: '#4a78c8',
    // 21:42 matches the 32x64 sheet cell aspect so frames aren't squashed.
    w: 21,
    h: 42,
    sheet: 'sprites/pip',
  },
  pumblechook: {
    id: 'pumblechook',
    name: 'Officer Pumblechook',
    talkColor: '#f0a868',
    color: '#8a5a30',
    w: 18,
    h: 44,
  },
  joe: {
    id: 'joe',
    name: 'Joe',
    talkColor: '#f0c860',
    color: '#c87830',
    w: 20,
    h: 46,
  },
  estella: {
    id: 'estella',
    name: 'Dr. Estella',
    talkColor: '#c8b8f8',
    color: '#e8e8f0',
    w: 14,
    h: 44,
  },
  wemmick: {
    id: 'wemmick',
    name: 'Quartermaster Wemmick',
    talkColor: '#a8d8a8',
    color: '#607060',
    w: 13,
    h: 42,
  },
  magwitch: {
    id: 'magwitch',
    name: 'Magwitch',
    talkColor: '#d8a888',
    color: '#5a4a40',
    w: 19,
    h: 44,
  },
  havisham: {
    id: 'havisham',
    name: 'Ms. Havisham',
    talkColor: '#f8e8c8',
    color: '#b0a890',
    w: 16,
    h: 38,
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
