// Golden-path playthrough: drives the running game in headless Chromium from
// shuttle arrival to the door opening, by clicking like a player. Fails loudly
// if any step can't proceed — this is the demo's solvability audit.
//
//   npm run dev &   then:   node tools/e2e-playthrough.mjs [playwright-module]
//
// The optional arg points at a playwright install (defaults to a global one).

const PW = process.argv[2] ?? '/opt/node22/lib/node_modules/playwright/index.mjs';
const { chromium } = await import(PW);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
await page.goto('http://localhost:5173/');
await sleep(1200);

const geo = await page.evaluate(() => {
  const r = document.getElementById('screen').getBoundingClientRect();
  return { l: r.left, t: r.top, sx: r.width / 320, sy: r.height / 200 };
});
const click = async (x, y) => {
  await page.mouse.click(geo.l + x * geo.sx, geo.t + y * geo.sy);
};
const snap = () =>
  page.evaluate(() => {
    const g = window.__game;
    return {
      room: g.room?.def.id ?? null,
      busy: g.scriptDepth > 0 || g.transitioning,
      dialog: g.dialogUI ? g.dialogUI.choices.map((c) => c.text) : null,
      walking: g.player.walking,
      flags: Object.entries(g.state.flags).filter(([, v]) => v === true).map(([k]) => k),
      inv: [...g.state.inventory],
    };
  });

async function settle() {
  await sleep(250); // let the game's update loop consume the click first
  for (let i = 0; i < 600; i++) {
    const s = await snap();
    if (s.dialog) return s;
    if (!s.busy && !s.walking) return s;
    await page.keyboard.press('Escape');
    await sleep(100);
  }
  throw new Error(`settle timeout in ${(await snap()).room}`);
}

async function pick(text) {
  const s = await settle();
  if (!s.dialog) throw new Error(`expected dialog, got none (room ${s.room}); wanted "${text}"`);
  const idx = s.dialog.findIndex((t) => t.startsWith(text));
  if (idx < 0) throw new Error(`choice "${text}" not in [${s.dialog.join(' | ')}]`);
  const top = 200 - s.dialog.length * 10 - 8;
  await click(80, top + 4 + idx * 10 + 4);
  await sleep(200);
}

async function endDialog(byeText) {
  let s = await settle();
  while (s.dialog) {
    const idx = s.dialog.findIndex((t) => t.startsWith(byeText));
    if (idx < 0) throw new Error(`no "${byeText}" in [${s.dialog.join(' | ')}]`);
    await pick(byeText);
    s = await settle();
  }
}

async function useOn(item, x, y) {
  await page.evaluate((id) => {
    window.__game.selectedItem = id;
  }, item);
  await click(x, y);
  await settle();
}

async function go(x, y, expectRoom) {
  await click(x, y);
  for (let i = 0; i < 100; i++) {
    const s = await settle();
    if (s.room === expectRoom && !s.busy && !s.walking) return;
    await sleep(120);
  }
  throw new Error(`never arrived in ${expectRoom}`);
}

const expect = async (cond, label) => {
  const s = await snap();
  if (!cond(s)) throw new Error(`FAILED: ${label} — state ${JSON.stringify(s)}`);
  console.log(`  ok: ${label}`);
};

try {
  console.log('TITLE');
  await click(160, 137); // "Begin" (fresh profile has no save)
  await sleep(400);

  console.log('ACT 1 — badge');
  await settle(); // intro cutscene
  await click(164, 107); await settle(); // emergency kit → scissors
  await expect((s) => s.inv.includes('scissors'), 'got scissors');
  await useOn('scissors', 222, 135); // crate → toner
  await expect((s) => s.inv.includes('toner'), 'got toner');
  await go(310, 150, 'reception');
  await click(170, 120); // talk to Pumblechook
  await pick('Hi! I'); await pick('Can I head'); await pick('So print me'); await endDialog(`I'll see what`);
  await useOn('toner', 170, 120); // badge ceremony
  await expect((s) => s.inv.includes('badge'), 'badge printed');
  await go(310, 170, 'hub');

  console.log('ACT 1 — vents');
  await go(310, 120, 'engineering');
  await click(190, 140); await pick('Hi! Pip'); await pick(`Could I borrow`); await endDialog('See you');
  await go(10, 150, 'hub');
  await go(265, 110, 'stores');
  await click(165, 120); await pick('Hello!'); await pick('I need a heating coil'); await endDialog(`I'll come back`);
  await go(160, 195, 'hub');
  await go(10, 150, 'reception');
  await click(170, 120); await pick('Could I have a blank'); await endDialog(`I'd better go`);
  await expect((s) => s.inv.includes('form'), 'got Form RQ-7');
  await go(310, 150, 'hub');
  await go(265, 110, 'stores');
  await click(165, 120); await pick('I need a heating coil'); await endDialog(`I'll come back`);
  await expect((s) => s.inv.includes('coil'), 'got heating coil');
  await go(160, 195, 'hub');
  await useOn('coil', 34, 120); // fix coffee machine
  await expect((s) => s.flags.includes('coffeeFixed'), 'coffee fixed');
  await go(310, 120, 'engineering');
  await click(190, 140); await pick(`Could I borrow`); await endDialog('See you');
  await expect((s) => s.inv.includes('driver'), 'got multidriver');
  await go(10, 150, 'hub');
  await go(75, 110, 'corridor');
  await useOn('driver', 216, 118); // open vent
  await expect((s) => s.flags.includes('ventOpen'), 'vent open');
  await go(216, 118, 'tunnels');
  await click(200, 145); // Magwitch
  await pick('Who ARE you'); await pick('What happened 26'); await pick('Is there a way'); await pick('Do you know what the glyphs');
  await endDialog('I should go');
  await expect((s) => s.inv.includes('rubbings') && s.flags.includes('knowsAboutKeys'), 'rubbings + key lore');

  console.log('ACT 2 — three keys');
  await go(10, 150, 'corridor');
  await go(10, 150, 'hub');
  await go(10, 150, 'reception');
  await click(170, 120); await pick('Did you know there are 600');
  await settle();
  await click(204, 128); await settle(); // take paperweight
  await expect((s) => s.inv.includes('paperweight'), 'key 1: paperweight');
  await go(310, 150, 'hub');
  await go(265, 110, 'stores');
  await click(165, 120); await pick('The hub coffee machine is fixed');
  await settle();
  await go(160, 195, 'hub');
  await click(110, 150); await pick('Wemmick? Is that you'); await pick('About Joe'); await endDialog('Enjoy the break');
  await go(265, 110, 'stores');
  await click(260, 110); await settle(); // cage with code
  await expect((s) => s.inv.includes('wrench'), 'key 2: lucky wrench');
  await go(160, 195, 'hub');
  await go(145, 110, 'lab');
  await click(220, 140); await pick('Hi! Pip Gibbous! I'); await pick('Xenoglyphology'); await endDialog(`I'll let you`);
  await useOn('rubbings', 220, 140); // → escorted to Havisham
  for (let i = 0; i < 50; i++) {
    const s = await settle();
    if (s.room === 'havisham' && !s.busy) break;
    await sleep(150);
  }
  await expect((s) => s.room === 'havisham', 'escorted to administration');
  await useOn('mint', 230, 145); // the mint gambit
  await expect((s) => s.flags.includes('minerClearance'), 'miner clearance granted');
  await click(172, 125); await settle(); // take stirrer from cake
  await expect((s) => s.inv.includes('stirrer'), 'key 3: cake stirrer');
  await go(10, 150, 'hub');
  await go(145, 110, 'lab');
  await click(220, 140); await pick('So what do the glyphs actually'); await endDialog(`I'll let you`);
  await expect((s) => s.flags.includes('knowsKeyOrder'), 'key order known');

  console.log('ACT 3 — the descent');
  await go(160, 195, 'hub');
  await go(310, 170, 'minehead');
  await go(250, 110, 'doorchamber');
  await click(185, 100); // ring the doorbell
  await settle();
  await expect((s) => s.flags.includes('doorOpened'), 'THE DOOR IS OPEN');

  console.log(`\nPLAYTHROUGH COMPLETE. Console errors: ${errors.length ? errors.join('; ') : 'none'}`);
  await page.screenshot({ path: '/tmp/shots/99-finale.png' });
  process.exitCode = errors.length ? 1 : 0;
} catch (e) {
  console.error('\nPLAYTHROUGH FAILED:', e.message);
  await page.screenshot({ path: '/tmp/shots/99-failure.png' });
  console.error('state:', JSON.stringify(await snap(), null, 1));
  process.exitCode = 1;
} finally {
  await browser.close();
}
