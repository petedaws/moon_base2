// Cut foreground/ambient/door images out of the quantized room backgrounds.
//
//   npx tsx tools/cut-overlays.ts [room]
//
// Three specs, all in 320x200 room coords, all emitting full-frame
// transparent PNGs under public/assets/fg/ that align 1:1 with the
// background:
//
// - tools/overlays.json  — occluders the player walks behind (crisp cuts;
//   rooms reference them as overlays: { image, x: 0, y: 0, z }).
// - tools/ambients.json  — light regions redrawn with time-varying alpha
//   (brightened + feathered so the edges never show; rooms reference them
//   as ambients).
// - tools/doors.json     — door leaves slid open by exits (crisp cuts;
//   exits reference them via door: { image, clip, dx, dy }).

import sharp from 'sharp';
import { mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from './util';

type Shape = { polygon?: [number, number][]; circle?: [number, number, number, number] };

function maskSvg(shape: Shape): Buffer {
  let body: string;
  if (shape.circle) {
    const [cx, cy, rOut, rIn] = shape.circle;
    body =
      `<path fill-rule="evenodd" fill="#fff" d="M ${cx - rOut},${cy} a ${rOut},${rOut} 0 1,0 ${rOut * 2},0 a ${rOut},${rOut} 0 1,0 ${-rOut * 2},0 Z ` +
      `M ${cx - rIn},${cy} a ${rIn},${rIn} 0 1,0 ${rIn * 2},0 a ${rIn},${rIn} 0 1,0 ${-rIn * 2},0 Z"/>`;
  } else {
    const pts = shape.polygon!.map(([x, y]) => `${x},${y}`).join(' ');
    body = `<polygon points="${pts}" fill="#fff"/>`;
  }
  return Buffer.from(`<svg width="320" height="200" shape-rendering="crispEdges">${body}</svg>`);
}

async function cut(
  bg: string,
  shape: Shape,
  out: string,
  opts: { brighten?: number; feather?: number } = {},
): Promise<void> {
  let mask = sharp(maskSvg(shape)).ensureAlpha();
  if (opts.feather) mask = mask.blur(opts.feather);
  const maskPng = await mask.png().toBuffer();
  let img = sharp(bg).composite([{ input: maskPng, blend: 'dest-in' }]);
  if (opts.brighten) {
    const buf = await img.png().toBuffer();
    img = sharp(buf).modulate({ brightness: opts.brighten, saturation: 1.1 });
  }
  await img.png().toFile(out);
  console.log(`cut ${out.slice(out.indexOf('fg/'))}`);
}

const only = process.argv[2];
const FG = join(ROOT, 'public/assets/fg');
mkdirSync(FG, { recursive: true });

const overlays = JSON.parse(readFileSync(join(ROOT, 'tools/overlays.json'), 'utf8'));
const ambients = JSON.parse(readFileSync(join(ROOT, 'tools/ambients.json'), 'utf8'));
const doors = JSON.parse(readFileSync(join(ROOT, 'tools/doors.json'), 'utf8'));

for (const [room, cuts] of Object.entries(overlays) as [string, any[]][]) {
  if (only && room !== only) continue;
  for (const c of cuts) {
    await cut(join(ROOT, `public/assets/bg/${room}.png`), c, join(FG, `${room}-${c.id}.png`));
  }
}
for (const [room, cuts] of Object.entries(ambients) as [string, any[]][]) {
  if (only && room !== only) continue;
  for (const c of cuts) {
    await cut(join(ROOT, `public/assets/bg/${room}.png`), c, join(FG, `${room}-amb-${c.id}.png`), {
      brighten: c.brighten ?? 1.4,
      feather: c.feather ?? 5,
    });
  }
}
for (const [room, cuts] of Object.entries(doors) as [string, any[]][]) {
  if (only && room !== only) continue;
  for (const c of cuts) {
    await cut(join(ROOT, `public/assets/bg/${room}.png`), c, join(FG, `${room}-${c.id}.png`));
  }
}
