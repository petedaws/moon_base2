// Re-render an existing room background in the rendered, dimensional style
// that matches the Meshy 3D characters, via the OpenAI image-EDIT endpoint.
//
//   npm run restyle:bg -- <roomId> [--force]
//
// Image-edit (not a fresh generation) is deliberate: it keeps the scene's
// composition, camera, and object positions, so every hand-tuned occluder,
// walkbox, hotspot, and exit stays pixel-aligned. The cached raw background
// from gen-background.ts is the edit base; the restyled raw is cached too,
// then center-cropped to 16:10 and mapped to the frozen master palette.

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, CACHE_DIR, cachePath, loadEnv, requireEnv, writeOut } from './util';
import { quantizeImage } from './quantize';

loadEnv();
const API_KEY = requireEnv('OPENAI_API_KEY');

const STYLE = readFileSync(join(ROOT, 'tools/prompts/restyle.md'), 'utf8')
  .split('\n')
  .filter((l) => l && !l.startsWith('#'))
  .join(' ');

const [roomId, ...flags] = process.argv.slice(2);
if (!roomId) {
  console.error('usage: npm run restyle:bg -- <roomId> [--force]');
  process.exit(1);
}
const force = flags.includes('--force');

// The base is gen-background's cached raw (1536x1024), not the committed
// 320x200 — the edit model needs the detail to preserve the composition.
const base = readdirSync(CACHE_DIR).find(
  (f) => f.startsWith(`bg-${roomId}-`) && f.endsWith('.png') && !f.includes('-crop') && !f.includes('-restyled'),
);
if (!base) {
  console.error(`no cached raw background for '${roomId}' (run gen:bg first)`);
  process.exit(1);
}
const restyled = join(CACHE_DIR, base.replace('.png', '-restyled.png'));

if (force || !existsSync(restyled)) {
  console.log(`re-styling '${roomId}' from ${base}...`);
  const fd = new FormData();
  fd.append('model', 'gpt-image-1');
  fd.append('image', new Blob([readFileSync(join(CACHE_DIR, base))], { type: 'image/png' }), 'bg.png');
  fd.append('prompt', STYLE);
  fd.append('size', '1536x1024');
  fd.append('quality', 'high');
  fd.append('input_fidelity', 'high');
  const res = await fetch('https://api.openai.com/v1/images/edits', {
    method: 'POST',
    headers: { Authorization: `Bearer ${API_KEY}` },
    body: fd,
  });
  if (!res.ok) {
    console.error(`OpenAI edit error ${res.status}: ${await res.text()}`);
    process.exit(1);
  }
  const json = (await res.json()) as { data: { b64_json?: string; url?: string }[] };
  const item = json.data[0]!;
  const buf = item.b64_json
    ? Buffer.from(item.b64_json, 'base64')
    : Buffer.from(await (await fetch(item.url!)).arrayBuffer());
  writeOut(restyled, buf);
} else {
  console.log(`cache hit: ${restyled}`);
}

const sharp = (await import('sharp')).default;
const cropped = cachePath(`bg-${roomId}-restyled-crop`, 'png');
const meta = await sharp(restyled).metadata();
const cropH = Math.round((meta.width! * 200) / 320);
await sharp(restyled)
  .extract({ left: 0, top: Math.max(0, Math.round((meta.height! - cropH) / 2)), width: meta.width!, height: Math.min(cropH, meta.height!) })
  .toFile(cropped);
await quantizeImage(cropped, join(ROOT, `public/assets/bg/${roomId}.png`), 320, 200);
console.log(`done: public/assets/bg/${roomId}.png`);
