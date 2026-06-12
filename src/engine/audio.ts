// Procedural WebAudio engine: tracker-style looping music (oscillators +
// gain envelopes, lookahead-scheduled) and synthesized SFX. Zero audio
// assets; songs and effects are note/parameter data in game content.

export interface Channel {
  wave: OscillatorType | 'noise';
  volume: number;
  /** [noteName|null, lengthInBeats]; null = rest. Pattern loops. */
  notes: [string | null, number][];
}

export interface Song {
  bpm: number;
  channels: Channel[];
}

export interface SfxStep {
  wave: OscillatorType | 'noise';
  freq: number;
  freqEnd?: number;
  dur: number;
  delay?: number;
  vol?: number;
}

export type Sfx = SfxStep[];

const NOTE_INDEX: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

export function noteFreq(name: string): number {
  const m = /^([A-G])([#b]?)(\d)$/.exec(name);
  if (!m) return 440;
  let semis = NOTE_INDEX[m[1]!]!;
  if (m[2] === '#') semis++;
  if (m[2] === 'b') semis--;
  const octave = Number(m[3]);
  const midi = 12 * (octave + 1) + semis;
  return 440 * Math.pow(2, (midi - 69) / 12);
}

interface PlayingSong {
  gain: GainNode;
  timer: ReturnType<typeof setInterval>;
  active: Set<AudioScheduledSourceNode>;
}

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private music: Record<string, Song> = {};
  private sfx: Record<string, Sfx> = {};
  private current: PlayingSong | null = null;
  private currentName: string | null = null;
  private pendingMusic: string | null = null;
  private noiseBuffer: AudioBuffer | null = null;

  setLibrary(music: Record<string, Song>, sfx: Record<string, Sfx>): void {
    this.music = music;
    this.sfx = sfx;
  }

  unlock(): void {
    if (this.ctx) {
      void this.ctx.resume();
      return;
    }
    this.ctx = new AudioContext();
    const len = this.ctx.sampleRate;
    this.noiseBuffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = this.noiseBuffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    if (this.pendingMusic) {
      const m = this.pendingMusic;
      this.pendingMusic = null;
      this.playMusic(m);
    }
  }

  playMusic(name: string | null): void {
    if (!this.ctx) {
      this.pendingMusic = name;
      return;
    }
    if (name === this.currentName) return;
    this.stopMusic();
    this.currentName = name;
    if (!name) return;
    const song = this.music[name];
    if (!song) return;
    this.current = this.startSong(song);
  }

  private stopMusic(): void {
    const cur = this.current;
    if (!cur || !this.ctx) {
      this.current = null;
      return;
    }
    this.current = null;
    clearInterval(cur.timer);
    const t = this.ctx.currentTime;
    cur.gain.gain.setValueAtTime(cur.gain.gain.value, t);
    cur.gain.gain.linearRampToValueAtTime(0, t + 0.7);
    setTimeout(() => {
      for (const n of cur.active) {
        try {
          n.stop();
        } catch {
          // already stopped
        }
      }
      cur.gain.disconnect();
    }, 800);
  }

  private startSong(song: Song): PlayingSong {
    const ctx = this.ctx!;
    const master = ctx.createGain();
    master.gain.setValueAtTime(0, ctx.currentTime);
    master.gain.linearRampToValueAtTime(1, ctx.currentTime + 0.6);
    master.connect(ctx.destination);
    const active = new Set<AudioScheduledSourceNode>();

    const secPerBeat = 60 / song.bpm;
    const positions = song.channels.map(() => ({ index: 0, time: ctx.currentTime + 0.1 }));

    const schedule = () => {
      const horizon = ctx.currentTime + 0.4;
      song.channels.forEach((ch, ci) => {
        const pos = positions[ci]!;
        while (pos.time < horizon) {
          const [note, beats] = ch.notes[pos.index % ch.notes.length]!;
          const dur = beats * secPerBeat;
          if (note) this.scheduleNote(ch, note, pos.time, dur, master, active);
          pos.time += dur;
          pos.index++;
        }
      });
      // Prune finished sources so the set stays small.
      if (active.size > 200) {
        for (const n of [...active].slice(0, 100)) active.delete(n);
      }
    };
    schedule();
    const timer = setInterval(schedule, 150);
    return { gain: master, timer, active };
  }

  private scheduleNote(
    ch: Channel,
    note: string,
    t: number,
    dur: number,
    out: AudioNode,
    active: Set<AudioScheduledSourceNode>,
  ): void {
    const ctx = this.ctx!;
    const gain = ctx.createGain();
    const sustain = Math.max(0.03, dur * 0.85);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(ch.volume, t + 0.012);
    gain.gain.setValueAtTime(ch.volume, t + sustain * 0.7);
    gain.gain.linearRampToValueAtTime(0, t + sustain);
    gain.connect(out);

    let src: AudioScheduledSourceNode;
    if (ch.wave === 'noise') {
      const node = ctx.createBufferSource();
      node.buffer = this.noiseBuffer!;
      node.loop = true;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = noteFreq(note) * 4;
      filter.Q.value = 1.2;
      node.connect(filter);
      filter.connect(gain);
      src = node;
    } else {
      const osc = ctx.createOscillator();
      osc.type = ch.wave;
      osc.frequency.setValueAtTime(noteFreq(note), t);
      osc.connect(gain);
      src = osc;
    }
    src.start(t);
    src.stop(t + sustain + 0.05);
    active.add(src);
    src.onended = () => active.delete(src);
  }

  playSfx(name: string): void {
    if (!this.ctx) return;
    const steps = this.sfx[name];
    if (!steps) return;
    const ctx = this.ctx;
    for (const s of steps) {
      const t = ctx.currentTime + (s.delay ?? 0);
      const vol = s.vol ?? 0.15;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(vol, t + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.001, t + s.dur);
      gain.connect(ctx.destination);
      let src: AudioScheduledSourceNode;
      if (s.wave === 'noise') {
        const node = ctx.createBufferSource();
        node.buffer = this.noiseBuffer!;
        node.loop = true;
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(s.freq, t);
        if (s.freqEnd) filter.frequency.exponentialRampToValueAtTime(s.freqEnd, t + s.dur);
        filter.Q.value = 1;
        node.connect(filter);
        filter.connect(gain);
        src = node;
      } else {
        const osc = ctx.createOscillator();
        osc.type = s.wave;
        osc.frequency.setValueAtTime(s.freq, t);
        if (s.freqEnd) osc.frequency.exponentialRampToValueAtTime(s.freqEnd, t + s.dur);
        osc.connect(gain);
        src = osc;
      }
      src.start(t);
      src.stop(t + s.dur + 0.05);
    }
  }
}
