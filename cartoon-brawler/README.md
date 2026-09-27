# Tinker's Crossing — Cartoon Brawler

A stylized cartoon-medieval 3D beat 'em up / hack-and-slash built from scratch with
**TypeScript (strict) + Vite + Three.js + Rapier3D**. One continuous level: Castle Gate →
Village Road → Small Plaza → Wooden Bridge → Boss Arena. Fight 3 waves of soldiers, then the
boss **Ser Boldwyn the Hollow** through 3 phases.

## Play online (GitHub Pages)

Compiled `dist/` (self-contained, relative base) is published with the repo:
**<https://shfzhangjian.github.io/AI_GTA/cartoon-brawler/dist/>**

## Run

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck (tsc --noEmit) + production bundle to dist/
npm run typecheck  # strict TS only
```

Open the dev URL, wait for the loading bar, press **START GAME**.

## Controls

| Action | Keys / Gamepad |
|---|---|
| Move (camera-relative) | `W A S D` / arrows / left stick |
| Sprint | `Shift` / LT-RT |
| Light attack (3-hit combo) | `J` / `Z` / A-X |
| Heavy attack | `K` / `X` / B-Y |
| Dodge (i-frames + cooldown, dodge-cancels attacks) | `Space` / right shift / RB-LB |
| Jump | `L` / `C` |
| Switch weapon (sword ⇄ hammer) | `1` `2` |
| Pause | `Esc` / `P` / Start |
| Debug panel / god mode | `F3` / `F4` |

Win: kill the boss. Lose: die. Both screens restart with the button or `R`.

## What's in here (MVP scope)

- 1 player, 2 weapons (sword = fast arc, hammer = slow knockdown), 3 enemy types
  (swordsman / brute / rogue), boss with 3 phases and 6 weighted-random skills.
- Combat feel: hit-stop (sim-time only — UI keeps running), camera shake (trauma² decay),
  weapon trail ribbons, impact particle bursts, knockback / launch / knockdown / getup,
  input buffering (~180 ms) and combo chaining windows, i-frame dodges.
- Enemy siege AI: attack slots around the player (`angle = 2π·i/N`), utility scoring
  (distance × angle × cooldown × slot × visibility), circle/strafe behavior, separation.
- Destruction: crates / barrels / fences / tables / chairs / carts / small walls with
  fragments + debris pools (hard caps: <100 rigid bodies, ≤48 debris, 3–8 s expiry),
  chain reactions, enemies smashing props while charging or being knocked into them.
- Fixed-timestep physics (1/60 accumulator) under a variable render frame; game-loop order
  Input → Logic → AI → FixedPhysics → TransformSync → Animation → Camera → Effects → Render.
- Procedural fallback for every character and animation clip — the game is fully playable
  with zero external art files (see [ASSET_LICENSES.md](./docs/ASSET_LICENSES.md)).

## Automated smoke tests

The page accepts `?autostart&ticks=<frames>&mode=<campaign|combat|world>` which boots, starts
the game and runs simulated frames headlessly (result is written to `document.title` /
`window.__SMOKE`). A CDP driver example lives in the repo history (`/tmp/cdp_smoke.mjs` during
development). Verified flows: wave siege & damage numbers, breakables + debris caps, boss
activation → phase 2 → phase 3 → victory, restart, defeat screen.

## Project layout

See [ARCHITECTURE.md](./docs/ARCHITECTURE.md) for module map and data flow,
[ART_STYLE.md](./docs/ART_STYLE.md) for the visual language,
[ASSET_LICENSES.md](./docs/ASSET_LICENSES.md) for asset provenance.
