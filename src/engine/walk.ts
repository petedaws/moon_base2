// Walkable-area pathfinding over a union of (possibly overlapping) convex
// polygons. Straight line when unobstructed, otherwise A* over a visibility
// graph built from polygon vertices. Small rooms keep this cheap.

import type { Polygon, Vec } from './types';
import { closestPointOnSegment, dist, pointInPolygon, type Pt } from './geom';

export class WalkArea {
  private polys: Vec[][];
  private verts: Pt[];

  constructor(walkboxes: Polygon[]) {
    this.polys = walkboxes.map((b) => b.points);
    this.verts = this.polys.flatMap((p) => p.map((v) => ({ x: v[0], y: v[1] })));
  }

  contains(p: Pt): boolean {
    return this.polys.some((poly) => pointInPolygon(p, poly));
  }

  /** Nearest walkable point to p (p itself if already walkable). */
  clamp(p: Pt): Pt {
    if (this.contains(p)) return p;
    let best: Pt = this.verts[0] ?? p;
    let bestD = Infinity;
    for (const poly of this.polys) {
      for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const c = closestPointOnSegment(p, { x: poly[j]![0], y: poly[j]![1] }, { x: poly[i]![0], y: poly[i]![1] });
        const d = dist(p, c);
        if (d < bestD) {
          bestD = d;
          best = c;
        }
      }
    }
    return best;
  }

  /** Segment lies fully in the walkable union (sampled). */
  private clear(a: Pt, b: Pt): boolean {
    const steps = Math.max(2, Math.ceil(dist(a, b) / 2));
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      if (!this.contains({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t })) return false;
    }
    return true;
  }

  /**
   * Path from a to b through the walkable union. Both endpoints are clamped
   * to the area first. Always returns at least [start]; returns the best
   * partial path even if b is unreachable (never strands the player).
   */
  findPath(from: Pt, to: Pt): Pt[] {
    const a = this.clamp(from);
    const b = this.clamp(to);
    if (this.clear(a, b)) return [a, b];

    const nodes: Pt[] = [a, b, ...this.verts];
    const n = nodes.length;
    const adj: number[][] = nodes.map(() => []);
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        if (this.clear(nodes[i]!, nodes[j]!)) {
          adj[i]!.push(j);
          adj[j]!.push(i);
        }
      }
    }

    // A* from node 0 (a) to node 1 (b).
    const g = new Array<number>(n).fill(Infinity);
    const prev = new Array<number>(n).fill(-1);
    const closed = new Array<boolean>(n).fill(false);
    g[0] = 0;
    for (;;) {
      let cur = -1;
      let curF = Infinity;
      for (let i = 0; i < n; i++) {
        if (!closed[i] && g[i]! < Infinity) {
          const f = g[i]! + dist(nodes[i]!, nodes[1]!);
          if (f < curF) {
            curF = f;
            cur = i;
          }
        }
      }
      if (cur === -1) break;
      if (cur === 1) break;
      closed[cur] = true;
      for (const nb of adj[cur]!) {
        const cand = g[cur]! + dist(nodes[cur]!, nodes[nb]!);
        if (cand < g[nb]!) {
          g[nb] = cand;
          prev[nb] = cur;
        }
      }
    }

    if (g[1] === Infinity) {
      // Unreachable (disjoint boxes): walk toward the closest reachable vertex.
      let best = 0;
      let bestD = Infinity;
      for (let i = 0; i < n; i++) {
        if (g[i]! < Infinity) {
          const d = dist(nodes[i]!, b);
          if (d < bestD) {
            bestD = d;
            best = i;
          }
        }
      }
      return this.rebuild(nodes, prev, best);
    }
    return this.rebuild(nodes, prev, 1);
  }

  private rebuild(nodes: Pt[], prev: number[], end: number): Pt[] {
    const path: Pt[] = [];
    for (let i = end; i !== -1; i = prev[i]!) path.unshift(nodes[i]!);
    return path;
  }
}
