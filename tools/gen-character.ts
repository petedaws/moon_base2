// Character sprite pipeline: Meshy text-to-3D → rig → animate → headless
// Blender render → quantize → packed sprite sheet.
//
//   npm run gen:char -- <charId> [--force]
//
// Reads the character prompt from tools/prompts/chars.json. Each stage's
// output is cached in .cache/ keyed by prompt hash, so reruns resume where
// they left off.
//
// Rigging/animation request fields confirmed against https://docs.meshy.ai
// (rigging: input_task_id or model_url; animations: integer action_id from
// the Animation Library; result GLB at result.animation_glb_url).

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { ROOT, cachePath, loadEnv, pollUntil, requireEnv, sha, writeOut } from './util';
import { quantizeImage } from './quantize';

loadEnv();
const API_KEY = requireEnv('MESHY_API_KEY');
const BASE = 'https://api.meshy.ai';

const [charId, ...flags] = process.argv.slice(2);
if (!charId) {
  console.error('usage: npm run gen:char -- <charId> [--force]');
  process.exit(1);
}
const force = flags.includes('--force');

const chars = JSON.parse(readFileSync(join(ROOT, 'tools/prompts/chars.json'), 'utf8')) as Record<string, string>;
const charPrompt = chars[charId];
if (!charPrompt) {
  console.error(`no prompt for '${charId}' in tools/prompts/chars.json`);
  process.exit(1);
}
const key = sha(charPrompt);

async function meshy(path: string, body?: unknown): Promise<any> {
  const res = await fetch(`${BASE}${path}`, {
    method: body ? 'POST' : 'GET',
    headers: { Authorization: `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`meshy ${path} -> ${res.status}: ${await res.text()}`);
  return res.json();
}

async function awaitTask(pathPrefix: string, id: string): Promise<any> {
  return pollUntil(async () => {
    const t = await meshy(`${pathPrefix}/${id}`);
    if (t.status === 'SUCCEEDED') return t;
    if (t.status === 'FAILED' || t.status === 'CANCELED') throw new Error(`task failed: ${JSON.stringify(t.task_error ?? t)}`);
    console.log(`  ${pathPrefix.split('/').pop()} ${id}: ${t.status} ${t.progress ?? ''}%`);
    return null;
  });
}

async function download(url: string, dest: string): Promise<void> {
  const buf = Buffer.from(await (await fetch(url)).arrayBuffer());
  writeOut(dest, buf);
}

// Stage 1+2: text-to-3D preview, then refine for textures.
const refinedGlb = cachePath(`char-${charId}-${key}-refined`, 'glb');
const metaJson = cachePath(`char-${charId}-${key}-meta`, 'json');
if (force || !existsSync(refinedGlb)) {
  console.log('stage 1: text-to-3d preview...');
  const prev = await meshy('/openapi/v2/text-to-3d', {
    mode: 'preview',
    prompt: `${charPrompt}. Full body game character, standing A-pose, single character, cartoon proportions, stylized 90s adventure game look.`,
    art_style: 'realistic', // only accepted value on the current API

    pose_mode: 'a-pose',
    should_remesh: true,
    target_polycount: 30000,
  });
  const prevTask = await awaitTask('/openapi/v2/text-to-3d', prev.result);
  console.log('stage 2: refine (textures)...');
  const ref = await meshy('/openapi/v2/text-to-3d', { mode: 'refine', preview_task_id: prevTask.id });
  const refTask = await awaitTask('/openapi/v2/text-to-3d', ref.result);
  writeOut(metaJson, Buffer.from(JSON.stringify({ previewTaskId: prevTask.id, refineTaskId: refTask.id }, null, 2)));
  await download(refTask.model_urls.glb, refinedGlb);
}

// Stage 3: rig.
const rigJson = cachePath(`char-${charId}-${key}-rig`, 'json');
if (force || !existsSync(rigJson)) {
  console.log('stage 3: rigging...');
  const body: Record<string, unknown> = { height_meters: 1.8 };
  if (existsSync(metaJson)) {
    body.input_task_id = JSON.parse(readFileSync(metaJson, 'utf8')).refineTaskId;
  } else {
    // Cached GLB from a run that predates the meta file: send the model itself.
    body.model_url = `data:model/gltf-binary;base64,${readFileSync(refinedGlb).toString('base64')}`;
  }
  const rig = await meshy('/openapi/v1/rigging', body);
  const rigTask = await awaitTask('/openapi/v1/rigging', rig.result);
  writeOut(rigJson, Buffer.from(JSON.stringify(rigTask, null, 2)));
}

// Stage 4: animations (walk + idle + talk) → animated GLBs.
// Integer ids from the Meshy Animation Library: 0 Idle, 30 Casual_Walk,
// 313 Talk_with_Hands_Open.
const anims: Record<string, number> = { walk: 30, idle: 0, talk: 313 };
const animFiles: Record<string, string> = {};
for (const [animName, actionId] of Object.entries(anims)) {
  const dest = cachePath(`char-${charId}-${key}-${animName}`, 'glb');
  animFiles[animName] = dest;
  if (!force && existsSync(dest)) continue;
  console.log(`stage 4: animation '${animName}'...`);
  const rigTask = JSON.parse(readFileSync(rigJson, 'utf8'));
  const anim = await meshy('/openapi/v1/animations', {
    rig_task_id: rigTask.id,
    action_id: actionId,
  });
  const animTask = await awaitTask('/openapi/v1/animations', anim.result);
  const glbUrl = animTask.result?.animation_glb_url ?? animTask.animation_glb_url ?? animTask.model_urls?.glb;
  if (!glbUrl) throw new Error(`no animated GLB url in task: ${JSON.stringify(animTask).slice(0, 400)}`);
  await download(glbUrl, dest);
}

// Stage 5: headless Blender render → frames.
const framesDir = cachePath(`char-${charId}-${key}-frames`, 'd');
console.log('stage 5: rendering sprite frames with bpy...');
execFileSync('python3', [
  join(ROOT, 'tools/render_sprites.py'),
  '--out', framesDir,
  '--walk', animFiles.walk!,
  '--idle', animFiles.idle!,
  '--talk', animFiles.talk!,
], { stdio: 'inherit' });

// Stage 6: pack the sheet (4 rows × 9 cols, cell 64x128).
//
// Blender's scene bbox can't be trusted for framing (Meshy GLBs carry
// geometry below the feet), so measure the union of opaque pixels across
// every rendered frame and crop all frames with one shared, bottom-anchored
// window: the character fills the cell, feet sit on the cell bottom, and
// scale is identical in every frame so nothing pops between animations.
console.log('stage 6: packing sheet...');
const sharp = (await import('sharp')).default;
const CELL_H = 128; // cell width is per-character, from the frame aspect
const COLS = 9; // idle ×1, walk ×6, talk ×2
const DIRS = ['down', 'left', 'right', 'up'];

const frameNames: string[][] = DIRS.map((d) => [
  `idle-${d}-0`,
  ...[0, 1, 2, 3, 4, 5].map((i) => `walk-${d}-${i}`),
  ...[0, 1].map((i) => `talk-${d}-${i}`),
]);

// Per-frame opaque bboxes. The walk animation carries horizontal root
// motion, so frames must be re-centered horizontally on their own bbox;
// the vertical window and scale stay shared (bob is real motion, and a
// shared scale means nothing pops between frames).
type Box = { l: number; t: number; r: number; b: number };
const boxes = new Map<string, Box>();
let uT = Infinity, uB = -1, maxW = 0;
for (const f of frameNames.flat()) {
  const fpath = join(framesDir, `${f}.png`);
  if (!existsSync(fpath)) continue;
  const { data, info } = await sharp(fpath).raw().toBuffer({ resolveWithObject: true });
  let l = Infinity, t = Infinity, r = -1, b = -1;
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      if (data[(y * info.width + x) * 4 + 3]! >= 64) {
        if (x < l) l = x;
        if (x > r) r = x;
        if (y < t) t = y;
        if (y > b) b = y;
      }
    }
  }
  if (r < 0) continue;
  boxes.set(f, { l, t, r, b });
  if (t < uT) uT = t;
  if (b > uB) uB = b;
  if (r - l + 1 > maxW) maxW = r - l + 1;
}
if (uB < 0) throw new Error('no opaque pixels in rendered frames');
// Bottom-anchored shared window at the character's natural aspect; pad
// below the feet maps to ~1 cell px so feet land on the actor's anchor.
const PAD = 3;
const cropH = uB - uT + 1 + 2 * PAD;
const cropW = maxW + 2 * PAD;
const CELL_W = Math.round((CELL_H * cropW) / cropH);
const cropBottom = uB + PAD;
const cropTop = cropBottom - cropH + 1;
console.log(
  `frames y ${uT}..${uB}, max width ${maxW} -> window ${cropW}x${cropH}, cell ${CELL_W}x${CELL_H}, def aspect w = h * ${(CELL_W / CELL_H).toFixed(3)}`,
);

const sheet = sharp({
  create: { width: CELL_W * COLS, height: CELL_H * 4, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
});
const composites: { input: string; left: number; top: number }[] = [];
for (let d = 0; d < 4; d++) {
  for (let c = 0; c < frameNames[d]!.length; c++) {
    const name = frameNames[d]![c]!;
    const box = boxes.get(name);
    if (!box) continue;
    const cropLeft = Math.round((box.l + box.r) / 2 - cropW / 2);
    const cropped = join(framesDir, `${name}-crop.png`);
    // extend with transparent margins so the extract window never leaves
    // the source frame, whatever the per-frame centering needs
    await sharp(join(framesDir, `${name}.png`))
      .extend({
        top: Math.max(0, -cropTop),
        bottom: Math.max(0, cropBottom + 1 - 256),
        left: Math.max(0, -cropLeft),
        right: Math.max(0, cropLeft + cropW - 128),
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .extract({
        left: cropLeft + Math.max(0, -cropLeft),
        top: cropTop + Math.max(0, -cropTop),
        width: cropW,
        height: cropH,
      })
      .toFile(cropped);
    const q = join(framesDir, `${name}-q.png`);
    await quantizeImage(cropped, q, CELL_W, CELL_H);
    composites.push({ input: q, left: c * CELL_W, top: d * CELL_H });
  }
}
const out = join(ROOT, `public/assets/sprites/${charId}.png`);
mkdirSync(dirname(out), { recursive: true });
await sheet.composite(composites).png().toFile(out);
console.log(`done: ${out}`);
