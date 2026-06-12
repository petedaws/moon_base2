// Dev-only authoring overlay. Backquote toggles it. While active:
//   - walkboxes (green), hotspots (cyan), exits (magenta), spawns (yellow)
//   - press P to log the cursor position, C to start/finish capturing a
//     polygon (clicks add points; result logged as JSON for pasting into a
//     room def)
import type { Game } from '../engine/game';
import { W, H } from '../engine/renderer';

export function attachDebugOverlay(game: Game): void {
  let active = false;
  let capture: [number, number][] | null = null;

  window.addEventListener('keydown', (e) => {
    if (e.key === '`') active = !active;
    if (!active) return;
    if (e.key === 'p' || e.key === 'P') {
      console.log(`[${game.input.mouseX}, ${game.input.mouseY}]`);
    }
    if (e.key === 'c' || e.key === 'C') {
      if (capture) {
        console.log('polygon:', JSON.stringify(capture));
        capture = null;
      } else {
        capture = [];
        console.log('capturing polygon — click points, press C to finish');
      }
    }
  });

  window.addEventListener('mousedown', () => {
    if (active && capture) capture.push([game.input.mouseX, game.input.mouseY]);
  });

  game.debugHook = (g, ctx) => {
    if (!active || !g.room) return;
    const poly = (points: readonly (readonly [number, number])[], color: string) => {
      if (points.length === 0) return;
      ctx.strokeStyle = color;
      ctx.beginPath();
      ctx.moveTo(points[0]![0], points[0]![1]);
      for (const p of points.slice(1)) ctx.lineTo(p[0], p[1]);
      ctx.closePath();
      ctx.stroke();
    };
    for (const b of g.room.def.walkboxes) poly(b.points, 'rgba(80,255,80,0.8)');
    for (const h of g.room.def.hotspots ?? []) poly(h.polygon, 'rgba(80,220,255,0.8)');
    for (const e of g.room.def.exits ?? []) poly(e.polygon, 'rgba(255,80,255,0.8)');
    ctx.fillStyle = '#ff0';
    for (const s of Object.values(g.room.def.spawns)) ctx.fillRect(s.at[0] - 1, s.at[1] - 1, 3, 3);
    if (capture) poly(capture, 'rgba(255,255,0,0.9)');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, H - 10, 70, 10);
    ctx.fillStyle = '#000';
    ctx.font = '8px monospace';
    ctx.fillText(`${game.input.mouseX},${game.input.mouseY} ${g.room.def.id}`, 2, H - 2);
  };
}
