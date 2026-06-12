// Palette pipeline: downscale generated art to game resolution and map it to
// the master palette so every asset reads as one game.
//
//   npx tsx tools/quantize.ts build-palette <img1> <img2> ...   # freeze master palette
//   npx tsx tools/quantize.ts apply <in> <out> [w] [h]          # quantize one image

import sharp from 'sharp';
import { applyPalette, buildPalette, utils } from 'image-q';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from './util';

const PALETTE_FILE = join(ROOT, 'tools', 'palette.json');
const PALETTE_SIZE = 64;

async function toPointContainer(path: string, w?: number, h?: number) {
  let img = sharp(path).ensureAlpha();
  if (w && h) img = img.resize(w, h, { fit: 'fill', kernel: 'lanczos3' });
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  return utils.PointContainer.fromUint8Array(data, info.width, info.height);
}

export async function buildMasterPalette(images: string[]): Promise<void> {
  const containers = await Promise.all(images.map((i) => toPointContainer(i, 320, 200)));
  const palette = await buildPalette(containers, {
    colors: PALETTE_SIZE,
    paletteQuantization: 'wuquant',
  });
  const points = palette.getPointContainer().getPointArray();
  const colors = points.map((p) => [p.r, p.g, p.b]);
  writeFileSync(PALETTE_FILE, JSON.stringify({ colors }, null, 1));
  console.log(`master palette frozen: ${colors.length} colors -> ${PALETTE_FILE}`);
}

export async function quantizeImage(
  input: string,
  output: string,
  w?: number,
  h?: number,
): Promise<void> {
  const container = await toPointContainer(input, w, h);
  let palette;
  if (existsSync(PALETTE_FILE)) {
    const { colors } = JSON.parse(readFileSync(PALETTE_FILE, 'utf8')) as { colors: number[][] };
    palette = new utils.Palette();
    for (const [r, g, b] of colors) {
      palette.add(utils.Point.createByRGBA(r!, g!, b!, 255));
    }
  } else {
    console.warn('no master palette yet — quantizing standalone');
    palette = await buildPalette([container], { colors: PALETTE_SIZE, paletteQuantization: 'wuquant' });
  }
  const out = await applyPalette(container, palette, { imageQuantization: 'nearest' });
  const arr = out.toUint8Array();
  // Preserve transparency from the source (palette mapping forces alpha 255).
  const src = container.toUint8Array();
  for (let i = 3; i < arr.length; i += 4) if (src[i]! < 128) arr[i] = 0;
  const png = await sharp(Buffer.from(arr), {
    raw: { width: out.getWidth(), height: out.getHeight(), channels: 4 },
  })
    .png()
    .toBuffer();
  writeFileSync(output, png);
  console.log(`quantized ${input} -> ${output} (${out.getWidth()}x${out.getHeight()})`);
}

import { pathToFileURL } from 'node:url';

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [cmd, ...args] = process.argv.slice(2);
  if (cmd === 'build-palette') {
    await buildMasterPalette(args);
  } else if (cmd === 'apply') {
    const [input, output, w, h] = args;
    await quantizeImage(input!, output!, w ? Number(w) : undefined, h ? Number(h) : undefined);
  } else {
    console.error('usage: quantize.ts build-palette <imgs...> | apply <in> <out> [w] [h]');
    process.exit(1);
  }
}
