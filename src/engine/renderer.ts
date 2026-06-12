export const W = 320;
export const H = 200;

/**
 * Draws everything to a 320×200 offscreen canvas, then blits it to the
 * display canvas at the largest integer scale that fits, letterboxed.
 */
export class Renderer {
  readonly ctx: CanvasRenderingContext2D;
  private offscreen: HTMLCanvasElement;
  private display: HTMLCanvasElement;
  private displayCtx: CanvasRenderingContext2D;
  scale = 1;
  offsetX = 0;
  offsetY = 0;

  constructor(display: HTMLCanvasElement) {
    this.display = display;
    this.offscreen = document.createElement('canvas');
    this.offscreen.width = W;
    this.offscreen.height = H;
    this.ctx = this.offscreen.getContext('2d')!;
    this.ctx.imageSmoothingEnabled = false;
    this.displayCtx = display.getContext('2d')!;
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  private resize(): void {
    const scale = Math.max(1, Math.floor(Math.min(window.innerWidth / W, window.innerHeight / H)));
    this.scale = scale;
    this.display.width = W * scale;
    this.display.height = H * scale;
    this.offsetX = Math.floor((window.innerWidth - W * scale) / 2);
    this.offsetY = Math.floor((window.innerHeight - H * scale) / 2);
    this.display.style.left = `${this.offsetX}px`;
    this.display.style.top = `${this.offsetY}px`;
    this.displayCtx.imageSmoothingEnabled = false;
  }

  /** Display-canvas pixel coords → 320×200 game coords. */
  toGame(clientX: number, clientY: number): { x: number; y: number } {
    return {
      x: Math.floor((clientX - this.offsetX) / this.scale),
      y: Math.floor((clientY - this.offsetY) / this.scale),
    };
  }

  present(): void {
    this.displayCtx.drawImage(this.offscreen, 0, 0, W * this.scale, H * this.scale);
  }
}
