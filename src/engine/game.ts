import type { ActorDef, ActorPlacement, DialogChoice, DialogDef, ExitDef, Facing, HotspotDef, ItemDef, RoomDef, Script } from './types';
import { Renderer, W, H } from './renderer';
import { Input } from './input';
import { Assets } from './assets';
import { Font } from './font';
import { Actor } from './actor';
import { Room, type HitTarget } from './room';
import { newGameState, saveState, loadState, type GameState, type FlagValue } from './state';
import type { ScriptCtx } from './script';
import { runDialog } from './dialog';
import { AudioEngine } from './audio';
import type { Pt } from './geom';

export interface GameContent {
  rooms: Record<string, RoomDef>;
  actors: Record<string, ActorDef>;
  items: Record<string, ItemDef>;
  dialogs: Record<string, DialogDef>;
  player: string;
  startRoom: string;
  startSpawn: string;
  /** Quip pools for unscripted interactions; picked deterministically per target. */
  defaults: { look: string[]; use: string[]; useItem: string[]; talk: string[] };
}

interface Fade {
  from: number;
  to: number;
  t: number;
  dur: number;
  resolve: () => void;
}

interface ActiveSay {
  actor: Actor;
  deadline: number;
  resolve: () => void;
}

interface DialogUI {
  choices: DialogChoice[];
  resolve: (c: DialogChoice) => void;
}

const INV_COLS = 10;
const INV_CELL = 26;

export class Game {
  readonly renderer: Renderer;
  readonly input: Input;
  readonly assets = new Assets();
  readonly audio = new AudioEngine();
  readonly font = new Font();
  readonly content: GameContent;
  state: GameState;
  room: Room | null = null;
  player: Actor;
  debugHook: ((g: Game, ctx: CanvasRenderingContext2D) => void) | null = null;

  private fadeLevel = 1;
  private fade: Fade | null = null;
  private scriptDepth = 0;
  private cutsceneAbort: AbortController | null = null;
  private activeSay: ActiveSay | null = null;
  private dialogUI: DialogUI | null = null;
  private dialogHoverIndex = -1;
  private selectedItem: string | null = null;
  private inventoryOpen = false;
  private actionSeq = 0;
  private clock = 0;
  private hover: HitTarget | null = null;
  private transitioning = false;

  constructor(canvas: HTMLCanvasElement, content: GameContent) {
    this.renderer = new Renderer(canvas);
    this.input = new Input(this.renderer, canvas.parentElement ?? document.body);
    this.content = content;
    this.state = newGameState(content.startRoom);
    const pdef = content.actors[content.player];
    if (!pdef) throw new Error(`player actor '${content.player}' not defined`);
    this.player = new Actor(pdef, W / 2, H - 30);
    canvas.parentElement?.addEventListener('mousedown', () => this.audio.unlock(), { once: true });
  }

  // ---------------------------------------------------------------- lifecycle

  async start(continueGame = false): Promise<void> {
    if (continueGame) {
      const loaded = loadState('auto');
      if (loaded) this.state = loaded;
    }
    const spawn = continueGame ? 'restore' : this.content.startSpawn;
    let last = performance.now();
    let acc = 0;
    const step = 1 / 60;
    const frame = (now: number) => {
      acc += Math.min(0.25, (now - last) / 1000);
      last = now;
      while (acc >= step) {
        this.update(step);
        acc -= step;
      }
      this.render();
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
    // The loop must be running before the first room enter: fades and says
    // resolve inside update().
    await this.enterRoom(this.state.room, spawn, true);
  }

  private roomDef(id: string): RoomDef {
    const def = this.content.rooms[id];
    if (!def) throw new Error(`unknown room '${id}'`);
    return def;
  }

  private async enterRoom(roomId: string, spawnId: string, first = false): Promise<void> {
    const def = this.roomDef(roomId);
    const old = this.room;
    if (old?.def.onExit && !first) await old.def.onExit(this.makeCtx(null));

    this.room = new Room(def);
    this.state.room = roomId;
    const spawn = def.spawns[spawnId];
    if (spawn) {
      this.player.teleport(spawn.at[0], spawn.at[1]);
      this.player.facing = spawn.facing;
    } else if (spawnId !== 'restore') {
      console.warn(`room '${roomId}' has no spawn '${spawnId}'`);
    }

    for (const placement of def.actors ?? []) {
      const adef = this.content.actors[placement.actor];
      if (!adef) {
        console.warn(`unknown actor '${placement.actor}' in room '${roomId}'`);
        continue;
      }
      const actor = new Actor(adef, placement.at[0], placement.at[1], placement.facing ?? 'down');
      this.room.npcs.set(placement.actor, { actor, placement });
    }

    const toLoad = [def.background, ...(def.overlays ?? []).map((o) => o.image)];
    for (const a of Object.values(this.content.actors)) if (a.sheet) toLoad.push(a.sheet);
    await Promise.all(toLoad.map((k) => this.assets.load(k)));

    this.audio.playMusic(def.music ?? null);
    saveState(this.state, 'auto');

    await this.doFade(0, first ? 600 : 250);
    if (def.onEnter) await this.runCutscene(def.onEnter);
  }

  // ---------------------------------------------------------------- update

  private update(dt: number): void {
    this.clock += dt;

    if (this.fade) {
      this.fade.t += dt * 1000;
      const k = Math.min(1, this.fade.t / this.fade.dur);
      this.fadeLevel = this.fade.from + (this.fade.to - this.fade.from) * k;
      if (k >= 1) {
        const f = this.fade;
        this.fade = null;
        f.resolve();
      }
    }

    this.player.update(dt);
    this.player.scale = this.room?.scaleAt(this.player.y) ?? 1;
    if (this.room) {
      for (const { actor } of this.room.npcs.values()) {
        actor.update(dt);
        actor.scale = this.room.scaleAt(actor.y);
      }
    }

    if (this.activeSay && this.clock >= this.activeSay.deadline) this.finishSay();

    for (const key of this.input.takeKeys()) this.handleKey(key);
    for (const click of this.input.takeClicks()) this.handleClick(click.x, click.y, click.button);

    this.hover = null;
    if (!this.busy() && this.room && !this.inInventoryPanel(this.input.mouseX, this.input.mouseY)) {
      this.hover = this.room.hitTest({ x: this.input.mouseX, y: this.input.mouseY }, this.state);
    }
    if (this.dialogUI) {
      this.dialogHoverIndex = this.dialogChoiceAt(this.input.mouseX, this.input.mouseY);
    }
    if (!this.busy() && this.input.mouseY <= 1) this.inventoryOpen = true;
  }

  private busy(): boolean {
    return this.scriptDepth > 0 || this.dialogUI !== null || this.transitioning;
  }

  private handleKey(key: string): void {
    if (key === 'Escape' || key === '.') {
      if (this.cutsceneAbort) {
        this.cutsceneAbort.abort();
        this.finishSay();
        return;
      }
      if (this.activeSay) {
        this.finishSay();
        return;
      }
      if (this.selectedItem) {
        this.selectedItem = null;
        return;
      }
      this.inventoryOpen = false;
    }
    if ((key === 'i' || key === 'I' || key === 'Tab') && !this.busy()) {
      this.inventoryOpen = !this.inventoryOpen;
    }
  }

  private handleClick(x: number, y: number, button: 'left' | 'right'): void {
    if (this.dialogUI) {
      if (this.activeSay) {
        this.finishSay();
        return;
      }
      const idx = this.dialogChoiceAt(x, y);
      if (idx >= 0) {
        const ui = this.dialogUI;
        this.dialogUI = null;
        ui.resolve(ui.choices[idx]!);
      }
      return;
    }
    if (this.scriptDepth > 0 || this.transitioning) {
      this.finishSay();
      return;
    }
    if (this.inventoryOpen && this.inInventoryPanel(x, y)) {
      this.handleInventoryClick(x, y, button);
      return;
    }
    if (this.inventoryOpen) this.inventoryOpen = false;
    if (!this.room) return;

    const target = this.room.hitTest({ x, y }, this.state);
    if (button === 'right') {
      this.lookAt(target);
      return;
    }
    if (target?.kind === 'exit') {
      this.useExit(target.exit);
    } else if (target?.kind === 'actor') {
      this.talkToActor(target.actor, target.placement);
    } else if (target?.kind === 'hotspot') {
      this.useHotspot(target.hotspot);
    } else {
      void this.playerWalk({ x, y });
    }
  }

  // ---------------------------------------------------------------- verbs

  /** Walk the player; true if they arrived without being superseded. */
  private async playerWalk(to: Pt, facing?: Facing): Promise<boolean> {
    if (!this.room) return false;
    const seq = ++this.actionSeq;
    const path = this.room.walkArea.findPath({ x: this.player.x, y: this.player.y }, to);
    const arrived = await this.player.walkPath(path);
    if (!arrived || seq !== this.actionSeq) return false;
    if (facing) this.player.facing = facing;
    return true;
  }

  private lookAt(target: HitTarget | null): void {
    if (!target) return;
    const sel = this.selectedItem;
    this.selectedItem = null;
    void this.runScript(async (ctx) => {
      if (sel) return; // right-click cancels item selection, no quip
      if (target.kind === 'hotspot') {
        if (target.hotspot.onLook) await target.hotspot.onLook(ctx);
        else await ctx.sayP(this.defaultQuip('look', target.hotspot.id));
      } else if (target.kind === 'actor') {
        if (target.placement.onLook) await target.placement.onLook(ctx);
        else await ctx.sayP(this.defaultQuip('look', target.placement.actor));
      } else if (target.exit.name) {
        await ctx.sayP(`That goes to ${target.exit.name}.`);
      }
    });
  }

  private useExit(exit: ExitDef): void {
    void (async () => {
      if (!(await this.playerWalk({ x: exit.walkTo[0], y: exit.walkTo[1] }))) return;
      if (exit.onExit) {
        let blocked = false;
        await this.runScript(async (ctx) => {
          blocked = (await exit.onExit!(ctx)) === false;
        });
        if (blocked) return;
      }
      await this.changeRoom(exit.to, exit.spawn);
    })();
  }

  private talkToActor(actor: Actor, placement: ActorPlacement): void {
    const sel = this.selectedItem;
    void (async () => {
      const near = this.nearPoint(actor);
      if (!(await this.playerWalk(near))) return;
      this.player.facing = this.faceToward(this.player, actor);
      actor.facing = this.faceToward(actor, this.player);
      await this.runScript(async (ctx) => {
        if (sel) {
          this.selectedItem = null;
          const handler = placement.onUseItem?.[sel];
          if (handler) await handler(ctx);
          else await ctx.sayP(this.defaultQuip('useItem', placement.actor + sel));
          return;
        }
        if (placement.onTalk) await placement.onTalk(ctx);
        else if (placement.dialog) await ctx.startDialog(placement.dialog);
        else await ctx.sayP(this.defaultQuip('talk', placement.actor));
      });
    })();
  }

  private useHotspot(hotspot: HotspotDef): void {
    const sel = this.selectedItem;
    void (async () => {
      if (hotspot.walkTo) {
        if (!(await this.playerWalk({ x: hotspot.walkTo[0], y: hotspot.walkTo[1] }, hotspot.facing))) return;
      }
      await this.runScript(async (ctx) => {
        if (sel) {
          this.selectedItem = null;
          const handler = hotspot.onUseItem?.[sel];
          if (handler) await handler(ctx);
          else await ctx.sayP(this.defaultQuip('useItem', hotspot.id + sel));
          return;
        }
        if (hotspot.onUse) await hotspot.onUse(ctx);
        else if (hotspot.onLook) await hotspot.onLook(ctx);
        else await ctx.sayP(this.defaultQuip('use', hotspot.id));
      });
    })();
  }

  private nearPoint(actor: Actor): Pt {
    const dx = this.player.x >= actor.x ? 18 : -18;
    return { x: actor.x + dx, y: actor.y + 2 };
  }

  private faceToward(from: Actor, to: Actor): Facing {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? 'right' : 'left';
    return dy > 0 ? 'down' : 'up';
  }

  private defaultQuip(kind: keyof GameContent['defaults'], seed: string): string {
    const pool = this.content.defaults[kind];
    let hash = 0;
    for (const ch of seed) hash = (hash * 31 + ch.charCodeAt(0)) | 0;
    return pool[Math.abs(hash) % pool.length] ?? 'Hmm.';
  }

  // ---------------------------------------------------------------- inventory

  private inventoryRows(): number {
    return Math.max(1, Math.ceil(this.state.inventory.length / INV_COLS));
  }

  private inventoryPanelHeight(): number {
    return this.inventoryRows() * INV_CELL + 14;
  }

  private inInventoryPanel(x: number, y: number): boolean {
    return this.inventoryOpen && y <= this.inventoryPanelHeight() && x >= 0 && x <= W;
  }

  private itemAt(x: number, y: number): string | null {
    const col = Math.floor((x - 30) / INV_CELL);
    const row = Math.floor((y - 6) / INV_CELL);
    if (col < 0 || col >= INV_COLS || row < 0) return null;
    return this.state.inventory[row * INV_COLS + col] ?? null;
  }

  private handleInventoryClick(x: number, y: number, button: 'left' | 'right'): void {
    const id = this.itemAt(x, y);
    if (!id) return;
    const def = this.content.items[id];
    if (button === 'right') {
      void this.runScript(async (ctx) => {
        if (def?.onLook) await def.onLook(ctx);
        else await ctx.sayP(this.defaultQuip('look', id));
      });
      return;
    }
    if (!this.selectedItem) {
      this.selectedItem = id;
    } else if (this.selectedItem === id) {
      this.selectedItem = null;
    } else {
      const a = this.selectedItem;
      this.selectedItem = null;
      const combine = this.content.items[a]?.onCombine?.[id] ?? def?.onCombine?.[a];
      void this.runScript(async (ctx) => {
        if (combine) await combine(ctx);
        else await ctx.sayP(this.defaultQuip('useItem', a + id));
      });
    }
  }

  // ---------------------------------------------------------------- scripts

  private async runScript(script: Script): Promise<void> {
    this.scriptDepth++;
    try {
      await script(this.makeCtx(this.cutsceneAbort?.signal ?? null));
    } catch (err) {
      console.error('script error:', err);
    } finally {
      this.scriptDepth--;
    }
  }

  async runCutscene(script: Script): Promise<void> {
    const ac = new AbortController();
    this.cutsceneAbort = ac;
    this.scriptDepth++;
    try {
      await script(this.makeCtx(ac.signal));
    } catch (err) {
      console.error('cutscene error:', err);
    } finally {
      this.scriptDepth--;
      if (this.cutsceneAbort === ac) this.cutsceneAbort = null;
    }
  }

  private findActor(id: string): Actor | null {
    if (id === this.content.player) return this.player;
    return this.room?.npcs.get(id)?.actor ?? null;
  }

  private finishSay(): void {
    if (this.activeSay) {
      const s = this.activeSay;
      this.activeSay = null;
      s.actor.talkText = null;
      s.resolve();
    }
  }

  private async changeRoom(roomId: string, spawn: string): Promise<void> {
    if (this.transitioning) return;
    this.transitioning = true;
    try {
      await this.doFade(1, 250);
      await this.enterRoom(roomId, spawn);
    } finally {
      this.transitioning = false;
    }
  }

  private doFade(to: number, dur: number, signal?: AbortSignal | null): Promise<void> {
    this.fade?.resolve();
    if (signal?.aborted || dur <= 0) {
      this.fade = null;
      this.fadeLevel = to;
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      this.fade = { from: this.fadeLevel, to, t: 0, dur, resolve };
    });
  }

  private makeCtx(signal: AbortSignal | null): ScriptCtx {
    const game = this;
    const fast = () => signal?.aborted ?? false;
    const ctx: ScriptCtx = {
      state: game.state,
      signal,
      async say(actorId, text) {
        const actor = game.findActor(actorId);
        if (!actor || fast()) return;
        game.finishSay();
        actor.talkText = text;
        const ms = Math.min(6000, 900 + text.length * 55);
        await new Promise<void>((resolve) => {
          game.activeSay = { actor, deadline: game.clock + ms / 1000, resolve };
          signal?.addEventListener('abort', () => game.finishSay(), { once: true });
        });
      },
      sayP: (text) => ctx.say(game.content.player, text),
      async walkTo(actorId, x, y) {
        const actor = game.findActor(actorId);
        if (!actor) return;
        if (fast()) {
          actor.teleport(x, y);
          return;
        }
        const area = actor === game.player ? game.room?.walkArea : null;
        const path = area ? area.findPath({ x: actor.x, y: actor.y }, { x, y }) : [{ x: actor.x, y: actor.y }, { x, y }];
        const done = actor.walkPath(path);
        signal?.addEventListener('abort', () => actor.teleport(x, y), { once: true });
        await done;
      },
      face(actorId, facing) {
        const actor = game.findActor(actorId);
        if (actor) actor.facing = facing;
      },
      placeActor(actorId, x, y, facing) {
        const actor = game.findActor(actorId);
        if (actor) {
          actor.teleport(x, y);
          if (facing) actor.facing = facing;
        }
      },
      async wait(ms) {
        if (fast()) return;
        await new Promise<void>((resolve) => {
          const t = setTimeout(resolve, ms);
          signal?.addEventListener(
            'abort',
            () => {
              clearTimeout(t);
              resolve();
            },
            { once: true },
          );
        });
      },
      fadeOut: (ms = 400) => game.doFade(1, ms, signal),
      fadeIn: (ms = 400) => game.doFade(0, ms, signal),
      giveItem(id) {
        if (!game.state.inventory.includes(id)) game.state.inventory.push(id);
        game.audio.playSfx('pickup');
      },
      removeItem(id) {
        game.state.inventory = game.state.inventory.filter((i) => i !== id);
        if (game.selectedItem === id) game.selectedItem = null;
      },
      hasItem: (id) => game.state.inventory.includes(id),
      setFlag(key, value: FlagValue = true) {
        game.state.flags[key] = value;
      },
      flag: (key) => game.state.flags[key],
      goToRoom: (roomId, spawn) => game.changeRoom(roomId, spawn),
      async startDialog(dialogId) {
        const def = game.content.dialogs[dialogId];
        if (!def) {
          console.warn(`unknown dialog '${dialogId}'`);
          return;
        }
        await runDialog(def, ctx, {
          presentChoices: (choices) =>
            new Promise<DialogChoice>((resolve) => {
              game.dialogUI = { choices, resolve };
            }),
        });
      },
      playSfx: (name) => game.audio.playSfx(name),
      playMusic: (name) => game.audio.playMusic(name),
    };
    return ctx;
  }

  // ---------------------------------------------------------------- render

  private render(): void {
    const ctx = this.renderer.ctx;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);

    if (this.room) {
      const bg = this.assets.get(this.room.def.background);
      if (bg) ctx.drawImage(bg, 0, 0);

      type Drawable = { z: number; draw: () => void };
      const drawables: Drawable[] = [];
      drawables.push({ z: this.player.y, draw: () => this.player.draw(ctx, this.sheetFor(this.player)) });
      for (const { actor, placement } of this.room.npcs.values()) {
        if (placement.condition && !placement.condition(this.state)) continue;
        drawables.push({ z: actor.y, draw: () => actor.draw(ctx, this.sheetFor(actor)) });
      }
      for (const o of this.room.def.overlays ?? []) {
        if (o.condition && !o.condition(this.state)) continue;
        const img = this.assets.get(o.image);
        if (img) drawables.push({ z: o.z, draw: () => ctx.drawImage(img, o.x, o.y) });
      }
      drawables.sort((a, b) => a.z - b.z);
      for (const d of drawables) d.draw();
    }

    this.debugHook?.(this, ctx);

    if (this.fadeLevel > 0) {
      ctx.fillStyle = `rgba(0,0,0,${this.fadeLevel.toFixed(3)})`;
      ctx.fillRect(0, 0, W, H);
    }

    this.player.drawTalkText(ctx, this.font);
    if (this.room) {
      for (const { actor } of this.room.npcs.values()) actor.drawTalkText(ctx, this.font);
    }

    if (this.dialogUI) this.renderDialog(ctx);
    if (this.inventoryOpen && !this.busy()) this.renderInventory(ctx);
    this.renderCursor(ctx);
    this.renderer.present();
  }

  private sheetFor(actor: Actor): HTMLCanvasElement | HTMLImageElement | undefined {
    return actor.def.sheet ? this.assets.get(actor.def.sheet) : undefined;
  }

  private dialogChoiceAt(x: number, y: number): number {
    if (!this.dialogUI) return -1;
    const n = this.dialogUI.choices.length;
    const top = H - n * this.font.lineHeight - 8;
    if (y < top || x < 6) return -1;
    const idx = Math.floor((y - top - 4) / this.font.lineHeight);
    return idx >= 0 && idx < n ? idx : -1;
  }

  private renderDialog(ctx: CanvasRenderingContext2D): void {
    const choices = this.dialogUI!.choices;
    const top = H - choices.length * this.font.lineHeight - 8;
    ctx.fillStyle = 'rgba(8,8,24,0.88)';
    ctx.fillRect(0, top, W, H - top);
    ctx.fillStyle = '#5a5a8a';
    ctx.fillRect(0, top, W, 1);
    choices.forEach((c, i) => {
      const y = top + 4 + i * this.font.lineHeight;
      const color = i === this.dialogHoverIndex ? '#ffe080' : '#b8e0c8';
      this.font.draw(ctx, c.text, 8, y, color);
    });
  }

  private renderInventory(ctx: CanvasRenderingContext2D): void {
    const h = this.inventoryPanelHeight();
    ctx.fillStyle = 'rgba(8,8,24,0.92)';
    ctx.fillRect(0, 0, W, h);
    ctx.fillStyle = '#5a5a8a';
    ctx.fillRect(0, h - 1, W, 1);
    this.state.inventory.forEach((id, i) => {
      const cx = 30 + (i % INV_COLS) * INV_CELL;
      const cy = 6 + Math.floor(i / INV_COLS) * INV_CELL;
      const selected = this.selectedItem === id;
      ctx.fillStyle = selected ? '#3a3a6a' : '#1a1a3a';
      ctx.fillRect(cx, cy, INV_CELL - 4, INV_CELL - 4);
      ctx.strokeStyle = selected ? '#ffe080' : '#5a5a8a';
      ctx.strokeRect(cx + 0.5, cy + 0.5, INV_CELL - 5, INV_CELL - 5);
      const def = this.content.items[id];
      const icon = def?.icon ? this.assets.get(def.icon) : undefined;
      if (icon) ctx.drawImage(icon, cx + 1, cy + 1, INV_CELL - 6, INV_CELL - 6);
      else this.font.draw(ctx, (def?.name ?? id).slice(0, 2), cx + 5, cy + 6, '#d8d8f8');
    });
    if (this.state.inventory.length === 0) {
      this.font.draw(ctx, 'Your pockets contain only ambition.', 30, 9, '#8888aa');
    }
  }

  private renderCursor(ctx: CanvasRenderingContext2D): void {
    const mx = this.input.mouseX;
    const my = this.input.mouseY;

    // Label: hovered target name (with selected item: "Use X on Y").
    let label = '';
    const targetName =
      this.hover?.kind === 'hotspot'
        ? this.hover.hotspot.name
        : this.hover?.kind === 'actor'
          ? this.content.actors[this.hover.placement.actor]?.name ?? ''
          : this.hover?.kind === 'exit'
            ? this.hover.exit.name ?? ''
            : '';
    const selName = this.selectedItem ? this.content.items[this.selectedItem]?.name ?? this.selectedItem : '';
    const hoverInvItem = this.inInventoryPanel(mx, my) ? this.itemAt(mx, my) : null;
    const hoverInvName = hoverInvItem ? this.content.items[hoverInvItem]?.name ?? hoverInvItem : '';
    if (this.selectedItem) {
      label = `Use ${selName}${targetName ? ` on ${targetName}` : hoverInvName ? ` on ${hoverInvName}` : ''}`;
    } else if (targetName) {
      label = this.hover?.kind === 'exit' ? `Go to ${targetName}` : targetName;
    } else if (hoverInvName) {
      label = hoverInvName;
    }
    if (label && !this.busy()) {
      const lw = this.font.width(label);
      const lx = Math.max(2, Math.min(W - lw - 2, mx - lw / 2));
      const ly = Math.min(H - 14, my + 12);
      this.font.drawOutlined(ctx, label, lx, ly, '#ffe080');
    }

    // Crosshair cursor, highlighted over interactives.
    const hot = this.hover !== null || hoverInvItem !== null;
    ctx.fillStyle = hot ? '#ffe080' : '#e8e8e8';
    ctx.fillRect(mx - 4, my, 3, 1);
    ctx.fillRect(mx + 2, my, 3, 1);
    ctx.fillRect(mx, my - 4, 1, 3);
    ctx.fillRect(mx, my + 2, 1, 3);
    if (this.busy() && this.scriptDepth > 0 && !this.dialogUI) {
      // hourglass-ish dot while scripts run
      ctx.fillRect(mx - 1, my - 1, 3, 3);
    }
  }
}
