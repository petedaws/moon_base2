# Crater Expectations

*A moon base mystery adventure* — a browser point-and-click in the spirit of
mid-90s LucasArts (Day of the Tentacle, Monkey Island, Fate of Atlantis).

You are **Pip Gibbous**, a wildly underqualified intern arriving at **Havisham
Base** on the day nobody will admit what the mining crew dug up at the bottom
of a shaft that officially does not exist. Every clock on the base stopped at
4:17 three weeks ago. Nobody seems bothered by that, which should bother you.

## Play

```sh
npm install
npm run dev      # → http://localhost:5173
```

| Input | Action |
|---|---|
| Left-click | Walk / interact / talk |
| Right-click | Examine |
| Top of screen, `Tab` or `I` | Inventory (click an item to use it on things) |
| `Esc` / `.` | Skip line or cutscene |

Progress autosaves on every room change; the title screen offers **Continue**.

## Development

```sh
npm test         # engine unit tests (pathfinding, dialog, saves)
npm run build    # type-check + static production build to dist/
node tools/e2e-playthrough.mjs   # full golden-path playthrough in headless
                                 # Chromium (needs `npm run dev` running)
```

- `src/engine/` — game-agnostic SCUMM-like engine: 320×200 integer-scaled
  canvas, polygon walk-areas + A*, async/await cutscenes with fast-forward
  skip, dialog trees, inventory, procedural WebAudio music/SFX.
- `src/game/` — all content as typed data: rooms, dialogs, items, songs.
- Backtick (`` ` ``) in dev builds toggles a debug overlay (walkboxes,
  hotspots; `P` logs cursor position, `C` captures polygons for room defs).

## Asset pipeline (art is currently placeholders)

Backgrounds come from the OpenAI Images API, characters from Meshy
(text-to-3D → rig → animate → headless-Blender sprite render); everything is
downscaled and quantized to a frozen 64-color master palette
(`tools/quantize.ts`). Keys go in `.env` (see `.env.example`); raw API output
is cached in `.cache/`, processed art is committed under `public/assets/` so
the game always builds without network access.

```sh
npm run gen:bg -- landing      # one background
npm run gen:char -- pip        # one character sheet (needs pip install -r tools/requirements.txt)
```

Running in Claude Code on the web: add `api.openai.com` and `api.meshy.ai`
to the environment's network allowlist first.
