// Image loader with synthesized placeholders so the game runs before any
// art exists. Keys map to /assets/<key>.png.

const PLACEHOLDER_COLORS = ['#1d2b53', '#3b2d4f', '#26433f', '#4a3429', '#2d3a52'];

export class Assets {
  private images = new Map<string, HTMLCanvasElement | HTMLImageElement>();

  async load(key: string): Promise<HTMLCanvasElement | HTMLImageElement> {
    const cached = this.images.get(key);
    if (cached) return cached;
    try {
      const img = await loadImage(`${import.meta.env.BASE_URL}assets/${key}.png`);
      this.images.set(key, img);
      return img;
    } catch {
      const ph = makePlaceholder(key);
      this.images.set(key, ph);
      return ph;
    }
  }

  get(key: string): HTMLCanvasElement | HTMLImageElement | undefined {
    return this.images.get(key);
  }
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

/** Flat-shaded stand-in background with the asset key printed on it. */
function makePlaceholder(key: string): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = 320;
  c.height = 200;
  const ctx = c.getContext('2d')!;
  let hash = 0;
  for (const ch of key) hash = (hash * 31 + ch.charCodeAt(0)) | 0;
  const base = PLACEHOLDER_COLORS[Math.abs(hash) % PLACEHOLDER_COLORS.length]!;
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 320, 200);
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(0, 140, 320, 60); // darker floor band
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  for (let x = 0; x < 320; x += 32) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 200);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.font = '10px monospace';
  ctx.fillText(`[${key}]`, 8, 14);
  return c;
}
