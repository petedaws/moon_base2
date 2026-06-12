import type { Renderer } from './renderer';

export interface ClickEvent {
  x: number;
  y: number;
  button: 'left' | 'right';
}

export class Input {
  mouseX = 160;
  mouseY = 100;
  private clickQueue: ClickEvent[] = [];
  private keyQueue: string[] = [];

  constructor(renderer: Renderer, target: HTMLElement) {
    target.addEventListener('mousemove', (e) => {
      const p = renderer.toGame(e.clientX, e.clientY);
      this.mouseX = p.x;
      this.mouseY = p.y;
    });
    target.addEventListener('mousedown', (e) => {
      const p = renderer.toGame(e.clientX, e.clientY);
      this.clickQueue.push({ x: p.x, y: p.y, button: e.button === 2 ? 'right' : 'left' });
    });
    target.addEventListener('contextmenu', (e) => e.preventDefault());
    window.addEventListener('keydown', (e) => {
      this.keyQueue.push(e.key);
    });
  }

  /** Drain queued clicks (call once per update). */
  takeClicks(): ClickEvent[] {
    const c = this.clickQueue;
    this.clickQueue = [];
    return c;
  }

  takeKeys(): string[] {
    const k = this.keyQueue;
    this.keyQueue = [];
    return k;
  }
}
