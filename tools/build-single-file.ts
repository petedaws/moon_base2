// Bundle the game into a single self-contained HTML file: JS inlined, every
// PNG embedded as a data: URI. No network requests at runtime, so the result
// works from file://, a static host, or a strict-CSP embed.
//
//   npx tsx tools/build-single-file.ts
//
// Emits:
//   dist/crater-expectations.html  full standalone document (double-clickable)
//   dist/artifact.html             body fragment (for hosts that supply the
//                                  <html>/<head>/<body> skeleton themselves)

import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { ROOT } from './util';

const DIST = join(ROOT, 'dist');
const ASSETS = join(ROOT, 'public/assets');

console.log('building...');
execFileSync('npx', ['vite', 'build'], { cwd: ROOT, stdio: 'inherit' });

// Collect every PNG under public/assets as key -> data URI, where the key is
// the path the engine asks for (e.g. "bg/landing", "sprites/pip").
function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

const inline: Record<string, string> = {};
let rawBytes = 0;
for (const file of walk(ASSETS)) {
  if (!file.endsWith('.png')) continue;
  const buf = readFileSync(file);
  rawBytes += buf.length;
  const key = relative(ASSETS, file).replace(/\\/g, '/').replace(/\.png$/, '');
  inline[key] = `data:image/png;base64,${buf.toString('base64')}`;
}
console.log(`inlined ${Object.keys(inline).length} assets (${(rawBytes / 1048576).toFixed(2)} MB raw)`);

// Pull the built JS bundle out of dist/index.html.
const builtHtml = readFileSync(join(DIST, 'index.html'), 'utf8');
const scriptSrc = /<script[^>]+src="([^"]+)"/.exec(builtHtml)?.[1];
if (!scriptSrc) throw new Error('could not find the built script tag in dist/index.html');
const js = readFileSync(join(DIST, scriptSrc.replace(/^\.?\//, '')), 'utf8');

// Single-theme on purpose: the page is a 1990s VGA game screen, so the ground
// is the same black as the canvas letterbox in any viewer theme. The hint line
// uses the game's own amber UI accent and is pointer-events:none so it can
// never swallow a click meant for the game.
const STYLE = `
  .ce-root { position: fixed; inset: 0; background: #000; overflow: hidden; }
  .ce-root canvas { position: fixed; image-rendering: pixelated; image-rendering: crisp-edges; cursor: none; }
  .ce-hint {
    position: fixed; left: 0; right: 0; bottom: 10px;
    text-align: center; pointer-events: none; user-select: none;
    font: 11px/1.5 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    letter-spacing: .08em; color: #ffe080; opacity: .55;
    text-shadow: 0 1px 2px #000;
    animation: ce-fade 1.2s ease-out 7s forwards;
  }
  @keyframes ce-fade { to { opacity: 0; } }
  @media (prefers-reduced-motion: reduce) { .ce-hint { animation-delay: 7s; animation-duration: 1ms; } }
`;

const HINT = '<p class="ce-hint">click to move &amp; interact &nbsp;·&nbsp; right-click to examine &nbsp;·&nbsp; I for inventory &nbsp;·&nbsp; Esc to skip</p>';

// </script> inside a string literal would close the tag early.
const safeJs = js.replace(/<\/script>/gi, '<\\/script>');
const body = `<title>Crater Expectations</title>
<style>${STYLE}</style>
<div class="ce-root"><canvas id="screen"></canvas>${HINT}</div>
<script>window.__INLINE_ASSETS = ${JSON.stringify(inline)};</script>
<script type="module">${safeJs}</script>`;

writeFileSync(join(DIST, 'artifact.html'), body);
writeFileSync(
  join(DIST, 'crater-expectations.html'),
  `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Crater Expectations</title>
<style>html,body{margin:0;padding:0;width:100%;height:100%;background:#000;overflow:hidden}${STYLE}</style>
</head>
<body>
<div class="ce-root"><canvas id="screen"></canvas>${HINT}</div>
<script>window.__INLINE_ASSETS = ${JSON.stringify(inline)};</script>
<script type="module">${safeJs}</script>
</body>
</html>`,
);

for (const f of ['crater-expectations.html', 'artifact.html']) {
  console.log(`  dist/${f}  ${(statSync(join(DIST, f)).size / 1048576).toFixed(2)} MB`);
}
