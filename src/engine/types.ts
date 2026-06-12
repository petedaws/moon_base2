// Shared contracts between the engine and game content.
// Content (rooms, dialogs, items) is authored as plain TS objects of these types.

import type { ScriptCtx } from './script';
import type { GameState } from './state';

export type Vec = readonly [number, number];
export type Facing = 'up' | 'down' | 'left' | 'right';

export type Script = (ctx: ScriptCtx) => Promise<void>;
export type Condition = (state: GameState) => boolean;

export interface Polygon {
  points: Vec[];
}

export interface RoomScale {
  /** Actor scale at yTop and yBottom, lerped between; clamped outside. */
  yTop: number;
  sTop: number;
  yBottom: number;
  sBottom: number;
}

export interface HotspotDef {
  id: string;
  name: string;
  polygon: Vec[];
  /** Where the player walks before interacting. Omit to interact in place. */
  walkTo?: Vec;
  facing?: Facing;
  condition?: Condition;
  onLook?: Script;
  onUse?: Script;
  /** Scripts keyed by inventory item id for "use item on hotspot". */
  onUseItem?: Record<string, Script>;
}

export interface ExitDef {
  to: string;
  spawn: string;
  polygon: Vec[];
  walkTo: Vec;
  name?: string;
  condition?: Condition;
  /** Runs after the walk, before the room change. Return false to cancel. */
  onExit?: (ctx: ScriptCtx) => Promise<boolean | void>;
  /**
   * Door-leaf slide played before the room change: image is a full-frame
   * cut of the leaf; it slides by (dx,dy) clipped to `clip` while its
   * original footprint shows dark (the revealed opening).
   */
  door?: DoorDef;
}

export interface DoorDef {
  image: string;
  clip: [number, number, number, number];
  dx: number;
  dy: number;
  ms?: number;
}

/**
 * A region of the background re-drawn over it with time-varying alpha —
 * flickering lamps, pulsing glows, blinking signs. The image is typically a
 * brightened cut of the same pixels so full transparency is the painted
 * baseline.
 */
export interface AmbientDef {
  image: string;
  x: number;
  y: number;
  /** Depth for actor sorting; 0 keeps it behind everyone (wall fixtures). */
  z: number;
  mode: 'flicker' | 'pulse' | 'blink';
  /** Cycle seconds (default 2.4). */
  period?: number;
  min?: number;
  max?: number;
}

export interface SpawnDef {
  at: Vec;
  facing: Facing;
}

export interface ActorPlacement {
  actor: string;
  at: Vec;
  facing?: Facing;
  condition?: Condition;
  /** Left-click default: start this dialog. */
  dialog?: string;
  onLook?: Script;
  onTalk?: Script;
  onUseItem?: Record<string, Script>;
}

export interface RoomDef {
  id: string;
  name: string;
  background: string;
  music?: string;
  walkboxes: Polygon[];
  scale?: RoomScale;
  exits?: ExitDef[];
  spawns: Record<string, SpawnDef>;
  hotspots?: HotspotDef[];
  actors?: ActorPlacement[];
  overlays?: { image: string; x: number; y: number; z: number; condition?: Condition }[];
  ambients?: AmbientDef[];
  onEnter?: Script;
  onExit?: Script;
}

export interface ActorDef {
  id: string;
  name: string;
  /** Talk text color (CSS). */
  talkColor: string;
  /** Placeholder body color until sprites exist. */
  color: string;
  /** Feet-anchored size in room pixels at scale 1. */
  w: number;
  h: number;
  /** Sprite sheet asset key; placeholder rendering when absent. */
  sheet?: string;
  /** Never draw a body — for off-screen voices that only anchor talk text. */
  invisible?: boolean;
  walkSpeed?: number;
}

export interface ItemDef {
  id: string;
  name: string;
  icon?: string;
  onLook?: Script;
  /** "Use item A on item B" combinations, keyed by other item id. */
  onCombine?: Record<string, Script>;
}

export interface DialogChoice {
  id: string;
  text: string;
  condition?: Condition;
  /** Hide once picked. */
  once?: boolean;
  response?: Script;
  effects?: (state: GameState) => void;
  /** Next node id, or 'end'. Defaults to staying on the same node. */
  goto?: string;
}

export interface DialogNode {
  /** Runs when the node is entered, before choices show. */
  onEnter?: Script;
  choices: DialogChoice[];
}

export interface DialogDef {
  id: string;
  /** Actor the player is talking to. */
  actor: string;
  start: string;
  nodes: Record<string, DialogNode>;
}
