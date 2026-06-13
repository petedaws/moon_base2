import type { ActorDef, Facing } from './types';
import type { Pt } from './geom';
import { dist } from './geom';
import type { Font } from './font';
import { W } from './renderer';

const DEFAULT_SPEED = 55; // px/sec at scale 1

interface Walk {
  path: Pt[];
  index: number;
  resolve: (arrived: boolean) => void;
}

export class Actor {
  def: ActorDef;
  x: number;
  y: number;
  facing: Facing = 'down';
  scale = 1;
  talkText: string | null = null;
  private walk: Walk | null = null;
  private animTime = 0;

  constructor(def: ActorDef, x: number, y: number, facing: Facing = 'down') {
    this.def = def;
    this.x = x;
    this.y = y;
    this.facing = facing;
  }

  get walking(): boolean {
    return this.walk !== null;
  }

  /** Follow a path; resolves true on arrival, false if replaced/stopped. */
  walkPath(path: Pt[]): Promise<boolean> {
    this.stopWalk(false);
    if (path.length <= 1) return Promise.resolve(true);
    return new Promise((resolve) => {
      this.walk = { path, index: 1, resolve };
    });
  }

  stopWalk(arrived: boolean): void {
    if (this.walk) {
      const w = this.walk;
      this.walk = null;
      w.resolve(arrived);
    }
  }

  teleport(x: number, y: number): void {
    this.stopWalk(true);
    this.x = x;
    this.y = y;
  }

  update(dt: number): void {
    this.animTime += dt;
    const w = this.walk;
    if (!w) return;
    let budget = (this.def.walkSpeed ?? DEFAULT_SPEED) * Math.max(0.4, this.scale) * dt;
    while (budget > 0 && this.walk) {
      const target = w.path[w.index]!;
      const d = dist({ x: this.x, y: this.y }, target);
      if (d <= budget) {
        this.x = target.x;
        this.y = target.y;
        budget -= d;
        w.index++;
        if (w.index >= w.path.length) {
          this.stopWalk(true);
        }
      } else {
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        this.x += (dx / d) * budget;
        this.y += (dy / d) * budget;
        this.setFacingFrom(dx, dy);
        budget = 0;
      }
    }
  }

  private setFacingFrom(dx: number, dy: number): void {
    if (Math.abs(dx) > Math.abs(dy)) this.facing = dx > 0 ? 'right' : 'left';
    else this.facing = dy > 0 ? 'down' : 'up';
  }

  /** Screen-space bounding box (feet-anchored), for hit-testing and labels. */
  bounds(): { x: number; y: number; w: number; h: number } {
    const w = this.def.w * this.scale;
    const h = this.def.h * this.scale;
    return { x: this.x - w / 2, y: this.y - h, w, h };
  }

  draw(ctx: CanvasRenderingContext2D, sheet?: HTMLCanvasElement | HTMLImageElement): void {
    if (this.def.invisible) return;
    const b = this.bounds();
    this.drawShadow(ctx, b);
    if (sheet) {
      this.drawSheet(ctx, sheet, b);
      return;
    }
    // Placeholder: a friendly little capsule person until sprites land.
    const bob = this.walking ? Math.sin(this.animTime * 14) * 1.5 : 0;
    const x = Math.round(b.x);
    const y = Math.round(b.y + bob);
    const w = Math.max(4, Math.round(b.w));
    const h = Math.max(8, Math.round(b.h));
    const headH = Math.round(h * 0.32);
    ctx.fillStyle = this.def.color;
    ctx.fillRect(x, y + headH, w, h - headH);
    ctx.fillStyle = '#e8c8a0';
    ctx.fillRect(x + Math.round(w * 0.15), y, Math.round(w * 0.7), headH);
    ctx.fillStyle = '#000';
    const eyeY = y + Math.round(headH * 0.4);
    if (this.facing !== 'up') {
      const off = this.facing === 'left' ? -1 : this.facing === 'right' ? 1 : 0;
      ctx.fillRect(x + Math.round(w * 0.3) + off, eyeY, 1, 2);
      if (this.facing === 'down') ctx.fillRect(x + Math.round(w * 0.6), eyeY, 1, 2);
    }
    if (this.talkText !== null) {
      const mouthY = y + headH - 3;
      const open = Math.sin(this.animTime * 18) > 0;
      ctx.fillRect(x + Math.round(w * 0.4), mouthY, 2, open ? 2 : 1);
    }
  }

  /** Soft contact shadow on the floor at the feet — grounds the sprite so it
   *  reads as standing in the scene rather than pasted over it. */
  private drawShadow(ctx: CanvasRenderingContext2D, b: { x: number; y: number; w: number; h: number }): void {
    const cx = b.x + b.w / 2;
    const cy = this.y - 1;
    const rx = Math.max(3, b.w * 0.42);
    const ry = Math.max(1.5, rx * 0.32);
    ctx.save();
    ctx.globalAlpha = 0.28;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  /**
   * Sprite sheets: 4 rows (down/left/right/up) × 9 columns: col 0 idle,
   * cols 1-6 walk, cols 7-8 talk. Cell size comes from the sheet dimensions,
   * so each character's sheet can use its own natural aspect; actor defs
   * should keep w/h near the cell aspect to avoid distortion.
   */
  private drawSheet(
    ctx: CanvasRenderingContext2D,
    sheet: HTMLCanvasElement | HTMLImageElement,
    b: { x: number; y: number; w: number; h: number },
  ): void {
    const cols = 9;
    const cellH = sheet.height / 4;
    const cellW = sheet.width / cols;
    const row = { down: 0, left: 1, right: 2, up: 3 }[this.facing];
    let col = 0;
    if (this.walking) col = 1 + (Math.floor(this.animTime * 9) % Math.min(6, cols - 1));
    else if (this.talkText !== null && cols > 8) col = 7 + (Math.floor(this.animTime * 6) % 2);
    ctx.drawImage(sheet, col * cellW, row * cellH, cellW, cellH, Math.round(b.x), Math.round(b.y), Math.round(b.w), Math.round(b.h));
  }

  /** Faint sprite drawn over foreground occluders so a fully-hidden actor is
   *  never completely lost (classic "ghost" behind tall props). */
  drawSilhouette(ctx: CanvasRenderingContext2D, sheet: HTMLCanvasElement | HTMLImageElement | undefined, alpha: number): void {
    if (this.def.invisible || !sheet) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    this.drawSheet(ctx, sheet, this.bounds());
    ctx.restore();
  }

  drawTalkText(ctx: CanvasRenderingContext2D, font: Font): void {
    if (this.talkText === null) return;
    const lines = font.wrap(this.talkText, 180);
    const b = this.bounds();
    let ty = Math.max(4, Math.round(b.y) - lines.length * font.lineHeight - 4);
    for (const line of lines) {
      const lw = font.width(line);
      const tx = Math.max(2, Math.min(W - lw - 2, Math.round(this.x - lw / 2)));
      font.drawOutlined(ctx, line, tx, ty, this.def.talkColor);
      ty += font.lineHeight;
    }
  }
}
