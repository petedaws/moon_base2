// Bitmap font baked at runtime: rasterize a system font at low size onto a
// scratch canvas, threshold the alpha to kill anti-aliasing, and keep 1-bit
// glyphs. Crisp at integer scale with zero assets. A dedicated pixel font
// (@font-face) can be swapped in later without changing callers.

const CHARS = ' !"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~’“”…éè';
const CELL = 12;

interface Glyph {
  x: number;
  w: number;
}

export class Font {
  readonly lineHeight: number;
  private atlas: HTMLCanvasElement;
  private glyphs = new Map<string, Glyph>();
  private tinted = new Map<string, HTMLCanvasElement>();

  constructor(cssFont = 'bold 9px sans-serif', baseline = 9) {
    this.lineHeight = 10;
    const scratch = document.createElement('canvas');
    scratch.width = CELL;
    scratch.height = CELL;
    const sctx = scratch.getContext('2d', { willReadFrequently: true })!;

    this.atlas = document.createElement('canvas');
    this.atlas.width = CHARS.length * CELL;
    this.atlas.height = CELL;
    const actx = this.atlas.getContext('2d')!;

    let cursor = 0;
    for (const ch of CHARS) {
      sctx.clearRect(0, 0, CELL, CELL);
      sctx.font = cssFont;
      sctx.fillStyle = '#fff';
      sctx.fillText(ch, 1, baseline);
      const data = sctx.getImageData(0, 0, CELL, CELL);
      let maxX = 0;
      for (let y = 0; y < CELL; y++) {
        for (let x = 0; x < CELL; x++) {
          const i = (y * CELL + x) * 4;
          const on = data.data[i + 3]! >= 110;
          data.data[i] = data.data[i + 1] = data.data[i + 2] = 255;
          data.data[i + 3] = on ? 255 : 0;
          if (on && x > maxX) maxX = x;
        }
      }
      sctx.putImageData(data, 0, 0);
      actx.drawImage(scratch, cursor * CELL, 0);
      const w = ch === ' ' ? 3 : Math.max(2, maxX);
      this.glyphs.set(ch, { x: cursor * CELL, w: w + 1 });
      cursor++;
    }
  }

  private atlasInColor(color: string): HTMLCanvasElement {
    let t = this.tinted.get(color);
    if (!t) {
      t = document.createElement('canvas');
      t.width = this.atlas.width;
      t.height = this.atlas.height;
      const ctx = t.getContext('2d')!;
      ctx.drawImage(this.atlas, 0, 0);
      ctx.globalCompositeOperation = 'source-in';
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, t.width, t.height);
      this.tinted.set(color, t);
    }
    return t;
  }

  width(text: string): number {
    let w = 0;
    for (const ch of text) w += (this.glyphs.get(ch) ?? this.glyphs.get('?')!).w;
    return w;
  }

  draw(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color = '#fff'): void {
    const atlas = this.atlasInColor(color);
    let cx = Math.round(x);
    const cy = Math.round(y);
    for (const ch of text) {
      const g = this.glyphs.get(ch) ?? this.glyphs.get('?')!;
      ctx.drawImage(atlas, g.x, 0, CELL, CELL, cx, cy, CELL, CELL);
      cx += g.w;
    }
  }

  /** Text with a 1px black outline (speech, labels). */
  drawOutlined(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color = '#fff'): void {
    for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]] as const) {
      this.draw(ctx, text, x + dx, y + dy, '#000');
    }
    this.draw(ctx, text, x, y, color);
  }

  /** Word-wrap to maxWidth; returns lines. */
  wrap(text: string, maxWidth: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let line = '';
    for (const word of words) {
      const cand = line ? `${line} ${word}` : word;
      if (line && this.width(cand) > maxWidth) {
        lines.push(line);
        line = word;
      } else {
        line = cand;
      }
    }
    if (line) lines.push(line);
    return lines;
  }
}
