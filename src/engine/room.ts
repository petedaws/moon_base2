import type { ActorPlacement, ExitDef, HotspotDef, RoomDef } from './types';
import type { GameState } from './state';
import { pointInPolygon, type Pt } from './geom';
import { WalkArea } from './walk';
import type { Actor } from './actor';

export type HitTarget =
  | { kind: 'actor'; actor: Actor; placement: ActorPlacement }
  | { kind: 'hotspot'; hotspot: HotspotDef }
  | { kind: 'exit'; exit: ExitDef };

export class Room {
  def: RoomDef;
  walkArea: WalkArea;
  /** Actors placed by this room (player excluded), keyed by actor id. */
  npcs = new Map<string, { actor: Actor; placement: ActorPlacement }>();

  constructor(def: RoomDef) {
    this.def = def;
    this.walkArea = new WalkArea(def.walkboxes);
  }

  scaleAt(y: number): number {
    const s = this.def.scale;
    if (!s) return 1;
    const t = Math.max(0, Math.min(1, (y - s.yTop) / (s.yBottom - s.yTop)));
    return s.sTop + (s.sBottom - s.sTop) * t;
  }

  hotspots(state: GameState): HotspotDef[] {
    return (this.def.hotspots ?? []).filter((h) => !h.condition || h.condition(state));
  }

  exits(state: GameState): ExitDef[] {
    return (this.def.exits ?? []).filter((e) => !e.condition || e.condition(state));
  }

  /** Topmost interactive thing under the cursor. Actors > hotspots > exits. */
  hitTest(p: Pt, state: GameState): HitTarget | null {
    for (const { actor, placement } of this.npcs.values()) {
      if (placement.condition && !placement.condition(state)) continue;
      const b = actor.bounds();
      if (p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h) {
        return { kind: 'actor', actor, placement };
      }
    }
    for (const hotspot of this.hotspots(state)) {
      if (pointInPolygon(p, hotspot.polygon)) return { kind: 'hotspot', hotspot };
    }
    for (const exit of this.exits(state)) {
      if (pointInPolygon(p, exit.polygon)) return { kind: 'exit', exit };
    }
    return null;
  }
}
