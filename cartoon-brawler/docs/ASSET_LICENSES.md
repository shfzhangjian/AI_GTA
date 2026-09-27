# Asset Licenses & Provenance

All runtime assets live in `public/assets/`. The project is designed so that **every asset is
optional**: if a file is missing or fails to load, `AssetManager` logs
`TODO Replace Asset` and the game falls back to fully procedural meshes/animations.

## Bundled files

### `public/assets/characters/soldier.glb` and `public/assets/enemies/soldier.glb`

- Source: three.js repository example model `Soldier.glb`, tag `r128`
  (`examples/models/gltf/Soldier.glb`), fetched from
  `https://raw.githubusercontent.com/mrdoob/three.js/r128/examples/models/gltf/Soldier.glb`.
- License: **MIT License** (three.js project, mrdoob/three.js).
  Copyright: the three.js authors; the model itself ships inside the MIT-licensed repo.
- Modifications: none to the file. At runtime it is uniformly re-scaled and re-tinted per
  character via material color overrides; its `Idle/Run/Walk` clips are used only as extras —
  all gameplay-critical animation comes from procedural clips.

### Loader binaries (`draco/`, `basis/` under `public/`)

- Ship with the `three` npm package (MIT) and are copied by Vite at build time.

## Procedural fallbacks (no third-party content)

Everything else in the game — characters, weapons, props, level geometry, particles, UI —
is generated in code from Three.js primitives (`src/characters/Character.ts`,
`src/weapons/Weapon.ts`, `src/world/*`, `src/renderer/Environment.ts`). All sound effects are
synthesized at runtime with the Web Audio API (`src/audio/AudioManager.ts`) — no samples.

## Policy for future drops

- Only CC0 / MIT / equivalent permissive sources (Quaternius, Kenney, three.js examples…).
- Keep original license text next to each file (e.g. `public/assets/<name>/LICENSE.txt`).
- The game must remain playable if the file is deleted (fallback path already wired).
- **No content ripped from existing commercial games.**
