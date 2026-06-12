import type { Sfx } from '../engine/audio';

export const sfx: Record<string, Sfx> = {
  pickup: [
    { wave: 'square', freq: 660, freqEnd: 1320, dur: 0.09, vol: 0.1 },
    { wave: 'square', freq: 990, freqEnd: 1760, dur: 0.12, delay: 0.07, vol: 0.08 },
  ],
  cut: [
    { wave: 'noise', freq: 3000, freqEnd: 800, dur: 0.18, vol: 0.12 },
    { wave: 'noise', freq: 3500, freqEnd: 900, dur: 0.15, delay: 0.18, vol: 0.1 },
  ],
  print: [
    { wave: 'noise', freq: 1200, dur: 0.5, vol: 0.06 },
    { wave: 'square', freq: 80, dur: 0.45, vol: 0.05 },
    { wave: 'square', freq: 1400, freqEnd: 1402, dur: 0.06, delay: 0.55, vol: 0.07 },
    { wave: 'square', freq: 1800, freqEnd: 2400, dur: 0.12, delay: 0.65, vol: 0.08 },
  ],
  door: [
    { wave: 'noise', freq: 400, freqEnd: 1600, dur: 0.35, vol: 0.1 },
    { wave: 'triangle', freq: 90, freqEnd: 140, dur: 0.3, vol: 0.12 },
  ],
  error: [
    { wave: 'square', freq: 220, freqEnd: 110, dur: 0.2, vol: 0.1 },
  ],
};
