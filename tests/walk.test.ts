import { describe, expect, it } from 'vitest';
import { WalkArea } from '../src/engine/walk';

// L-shaped union: horizontal corridor + vertical corridor, overlapping at the corner.
const lShape = new WalkArea([
  { points: [[0, 0], [100, 0], [100, 20], [0, 20]] },
  { points: [[80, 0], [100, 0], [100, 100], [80, 100]] },
]);

describe('WalkArea', () => {
  it('contains points in either box', () => {
    expect(lShape.contains({ x: 10, y: 10 })).toBe(true);
    expect(lShape.contains({ x: 90, y: 90 })).toBe(true);
    expect(lShape.contains({ x: 10, y: 90 })).toBe(false);
  });

  it('returns a straight path when unobstructed', () => {
    const path = lShape.findPath({ x: 5, y: 10 }, { x: 60, y: 10 });
    expect(path).toHaveLength(2);
    expect(path[1]).toEqual({ x: 60, y: 10 });
  });

  it('routes around the corner of an L', () => {
    const path = lShape.findPath({ x: 5, y: 10 }, { x: 90, y: 95 });
    expect(path.length).toBeGreaterThan(2);
    const end = path[path.length - 1]!;
    expect(end.x).toBeCloseTo(90);
    expect(end.y).toBeCloseTo(95);
    // every waypoint stays inside the walkable union
    for (const p of path) expect(lShape.contains(p)).toBe(true);
  });

  it('clamps unreachable targets to the nearest walkable point', () => {
    const clamped = lShape.clamp({ x: 10, y: 90 });
    expect(lShape.contains(clamped)).toBe(true);
    const path = lShape.findPath({ x: 5, y: 10 }, { x: 10, y: 90 });
    const end = path[path.length - 1]!;
    expect(lShape.contains(end)).toBe(true);
  });

  it('always returns at least the start point', () => {
    const path = lShape.findPath({ x: 5, y: 10 }, { x: 5, y: 10 });
    expect(path.length).toBeGreaterThanOrEqual(1);
  });
});
