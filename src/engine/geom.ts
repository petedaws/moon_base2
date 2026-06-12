import type { Vec } from './types';

export interface Pt {
  x: number;
  y: number;
}

export const pt = (v: Vec): Pt => ({ x: v[0], y: v[1] });
export const dist = (a: Pt, b: Pt): number => Math.hypot(a.x - b.x, a.y - b.y);

/** Inclusive point-in-polygon: boundary points count as inside. */
export function pointInPolygon(p: Pt, poly: Vec[]): boolean {
  if (pointOnBoundary(p, poly)) return true;
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i]!;
    const b = poly[j]!;
    const intersects =
      a[1] > p.y !== b[1] > p.y &&
      p.x < ((b[0] - a[0]) * (p.y - a[1])) / (b[1] - a[1]) + a[0];
    if (intersects) inside = !inside;
  }
  return inside;
}

function pointOnBoundary(p: Pt, poly: Vec[], eps = 0.75): boolean {
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    if (distToSegment(p, pt(poly[j]!), pt(poly[i]!)) <= eps) return true;
  }
  return false;
}

export function distToSegment(p: Pt, a: Pt, b: Pt): number {
  return dist(p, closestPointOnSegment(p, a, b));
}

export function closestPointOnSegment(p: Pt, a: Pt, b: Pt): Pt {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return { ...a };
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  return { x: a.x + t * dx, y: a.y + t * dy };
}

export function polygonCentroid(poly: Vec[]): Pt {
  let x = 0;
  let y = 0;
  for (const v of poly) {
    x += v[0];
    y += v[1];
  }
  return { x: x / poly.length, y: y / poly.length };
}
