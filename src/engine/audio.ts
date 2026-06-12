// Audio engine placeholder — implemented in the audio phase (tracker music +
// sfxr-style effects). The interface is stable so game code can call it now.

export class AudioEngine {
  playMusic(_name: string | null): void {}
  playSfx(_name: string): void {}
  /** Call on first user gesture (autoplay policy). */
  unlock(): void {}
}
