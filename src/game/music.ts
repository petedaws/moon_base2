// Songs as tracker data. Volumes stay low — this is mood, not concert.
import type { Song } from '../engine/audio';

/** Landing bay: slow, wide-eyed wonder. */
const landing: Song = {
  bpm: 72,
  channels: [
    {
      wave: 'triangle',
      volume: 0.055,
      notes: [
        ['A4', 1.5], ['C5', 0.5], ['E5', 2], [null, 2],
        ['D5', 1.5], ['C5', 0.5], ['A4', 2], [null, 2],
        ['F4', 1.5], ['A4', 0.5], ['C5', 2], [null, 2],
        ['G4', 1], ['B4', 1], ['D5', 2], [null, 4],
      ],
    },
    {
      wave: 'sine',
      volume: 0.07,
      notes: [
        ['A2', 4], ['A2', 4], ['F2', 4], ['F2', 4],
        ['D2', 4], ['D2', 4], ['G2', 4], ['G2', 4],
      ],
    },
    {
      wave: 'noise',
      volume: 0.012,
      notes: [[null, 3.5], ['A5', 0.5], [null, 7.5], ['E5', 0.5]],
    },
  ],
};

/** Reception: prim, tidy, faintly menacing clockwork. */
const reception: Song = {
  bpm: 104,
  channels: [
    {
      wave: 'square',
      volume: 0.028,
      notes: [
        ['E4', 0.5], [null, 0.5], ['G4', 0.5], [null, 0.5],
        ['F#4', 0.5], [null, 0.5], ['A4', 0.5], [null, 0.5],
        ['G4', 0.5], [null, 0.5], ['B4', 0.5], [null, 0.5],
        ['A4', 0.5], ['G4', 0.5], ['F#4', 0.5], ['D4', 0.5],
        ['E4', 0.5], [null, 0.5], ['G4', 0.5], [null, 0.5],
        ['F#4', 0.5], [null, 0.5], ['A4', 0.5], [null, 0.5],
        ['B4', 0.5], ['A4', 0.5], ['G4', 0.5], ['F#4', 0.5],
        ['E4', 1.5], [null, 2.5],
      ],
    },
    {
      wave: 'triangle',
      volume: 0.075,
      notes: [
        ['E2', 1], ['B2', 1], ['E2', 1], ['B2', 1],
        ['D2', 1], ['A2', 1], ['D2', 1], ['A2', 1],
      ],
    },
    {
      wave: 'noise',
      volume: 0.01,
      notes: [['C6', 0.25], [null, 0.75], ['C6', 0.25], [null, 0.75]],
    },
  ],
};

/** Central hub: a small intern with big plans. */
const hub: Song = {
  bpm: 92,
  channels: [
    {
      wave: 'square',
      volume: 0.03,
      notes: [
        ['C4', 1], ['E4', 1], ['G4', 1.5], ['E4', 0.5],
        ['F4', 1], ['A4', 1], ['G4', 2],
        ['E4', 1], ['G4', 1], ['C5', 1.5], ['B4', 0.5],
        ['A4', 1], ['F4', 1], ['G4', 2],
      ],
    },
    {
      wave: 'triangle',
      volume: 0.07,
      notes: [
        ['C3', 2], ['G2', 2], ['F2', 2], ['G2', 2],
        ['A2', 2], ['E2', 2], ['F2', 2], ['G2', 2],
      ],
    },
    {
      wave: 'noise',
      volume: 0.014,
      notes: [['A5', 0.25], [null, 1.75], ['A5', 0.25], [null, 1.25], ['E5', 0.5]],
    },
  ],
};

export const music: Record<string, Song> = {
  'music/landing': landing,
  'music/reception': reception,
  'music/hub': hub,
};
