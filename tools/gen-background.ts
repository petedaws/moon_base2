// Generate a room background via the OpenAI Images API, then downscale and
// palette-quantize it into public/assets/bg/<room>.png.
//
//   npm run gen:bg -- <roomId> [--force]
//
// Raw API output is cached by SHA(model+prompt+size) in .cache/, so rerunning
// without --force (or without a prompt change) costs nothing.

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, cachePath, loadEnv, requireEnv, sha, writeOut } from './util';
import { quantizeImage } from './quantize';

loadEnv();
const API_KEY = requireEnv('OPENAI_API_KEY');
const MODEL = process.env.IMAGE_MODEL || 'gpt-image-1';
const SIZE = '1536x1024';

const [roomId, ...flags] = process.argv.slice(2);
if (!roomId) {
  console.error('usage: npm run gen:bg -- <roomId> [--force]');
  process.exit(1);
}
const force = flags.includes('--force');

const style = readFileSync(join(ROOT, 'tools/prompts/style.md'), 'utf8')
  .split('\n')
  .filter((l) => l && !l.startsWith('#'))
  .join(' ');
const rooms = JSON.parse(readFileSync(join(ROOT, 'tools/prompts/rooms.json'), 'utf8')) as Record<string, string>;
const roomPrompt = rooms[roomId];
if (!roomPrompt) {
  console.error(`no prompt for room '${roomId}' in tools/prompts/rooms.json`);
  process.exit(1);
}
const prompt = `${style}\n\nThis room: ${roomPrompt}`;

const key = sha(`${MODEL}|${SIZE}|${prompt}`);
const raw = cachePath(`bg-${roomId}-${key}`, 'png');

if (force || !existsSync(raw)) {
  console.log(`generating '${roomId}' with ${MODEL}...`);
  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: { Authorization: `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      prompt,
      size: SIZE,
      quality: 'high',
      output_format: 'png',
      moderation: 'low',
      n: 1,
    }),
  });
  if (!res.ok) {
    console.error(`OpenAI API error ${res.status}: ${await res.text()}`);
    process.exit(1);
  }
  const json = (await res.json()) as { data: { b64_json?: string; url?: string }[] };
  const item = json.data[0]!;
  let buf: Buffer;
  if (item.b64_json) buf = Buffer.from(item.b64_json, 'base64');
  else buf = Buffer.from(await (await fetch(item.url!)).arrayBuffer());
  writeOut(raw, buf);
} else {
  console.log(`cache hit: ${raw}`);
}

// 1536x1024 → center-crop to 16:10 → 320x200 master-palette quantize.
const sharp = (await import('sharp')).default;
const cropped = cachePath(`bg-${roomId}-${key}-crop`, 'png');
const meta = await sharp(raw).metadata();
const cropH = Math.round((meta.width! * 200) / 320);
await sharp(raw)
  .extract({ left: 0, top: Math.max(0, Math.round((meta.height! - cropH) / 2)), width: meta.width!, height: Math.min(cropH, meta.height!) })
  .toFile(cropped);
await quantizeImage(cropped, join(ROOT, `public/assets/bg/${roomId}.png`), 320, 200);
console.log(`done: public/assets/bg/${roomId}.png`);
