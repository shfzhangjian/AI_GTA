# Extension Architecture

This project now has a small extension layer for future gameplay systems.

## Entity Registry

`src/world/systems/EntityRegistry.js`

All gameplay-relevant objects should register here once:

- `type`: `building`, `dock`, `boat`, `ship`, `character`, `water-prop`, etc.
- `tags`: searchable labels such as `port`, `ship`, `landmark`, model name.
- `damageable`: whether disasters/combat can affect it.

Avoid direct coupling between systems. Weather, missions, interaction, and damage should query the registry instead of importing each manager.

## Damage System

`src/world/systems/DamageSystem.js`

Use:

```js
damageSystem.applyRadialDamage(position, radius, amount, { color: 0xffb45c });
damageSystem.applyDamage(entityIdOrObject, amount);
```

Damage currently darkens meshes, scales destroyed objects down, tilts them, and spawns impact rings. Replace or extend this file when adding richer destruction, debris, fire, collapse animations, or repair.

## Environment Events

`src/world/systems/EnvironmentEventSystem.js`

Supported event types:

- `rain`
- `tornado`
- `tsunami`
- `meteor`

Example from console:

```js
__debug.environment.trigger('meteor', { lat: 12, lon: 100, radius: 28, damage: 80 });
__debug.environment.trigger('tornado', { lat: 22, lon: -46, duration: 10 });
__debug.environment.trigger('tsunami', { lat: -18, lon: -46 });
__debug.environment.trigger('rain', { lat: 6, lon: 70, duration: 12 });
```

The event system owns lifecycle and visuals; it calls `DamageSystem` for destruction.

## Adding New Content

Buildings:

1. Add the GLB to `public/assets/...`.
2. Add/refresh manifest entry.
3. Add model scale/orientation in `ModelUtils.MODEL_SPECS`.
4. Add layout entry in `PortManager` or a future `BuildingManager`.
5. Register the object with `EntityRegistry`; call `DamageSystem.makeDamageable` if it can break.

Characters: ✅ implemented as `src/world/CharacterManager.js`

- Assets: `kenney_mini-characters` → `public/assets/mini-characters/` + `src/assets/manifest-mini-characters.json` (separate colormap atlas; generate with `npm run gen:mini-manifest`).
- Registers `type: 'character'`, tags `walker`/`wheelchair` + model key; not damageable by design (change via `makeDamageable` later).
- Locomotion: great-circle legs between buildable land points (same spherical pattern as ships), UP = surface normal, FORWARD = route tangent; ground height only from `TerrainSampler`.
- Skinned animation: `AnimationMixer` + shared GLTF clips per model. Note: walk/sprint clips have **no root motion** (root.translation is a ±0.05 in-place bob) — real displacement is driven by the manager; the bob is re-applied only to render radius.
- Clone rule: skinned models must be cloned via `new Ctor(); copy(src, true)` (`cloneNormalizedModel`), animation targets resolve by joint node name.

Animals: ✅ implemented as `src/world/PetManager.js`

- Assets: `kenney_cube-pets_1.0` → `public/assets/cube-pets/` + `src/assets/manifest-cube-pets.json` (`npm run gen:pets-manifest`).
- Registers `type: 'pet'`, tags `pet/animal/<model>`; separate `SceneManager.animals` layer.
- Same spherical locomotion as characters (great-circle legs, skinned GLTF clips walk/run/idle).
- Ferry boarding supported (`onFerry` pauses locomotion and hides the animal).

Ground occupancy / anti-clipping: ✅ `src/world/GroundOccupancy.js` + `src/world/WalkerBase.js`

- Ports, trees, rocks register footprints when placed; characters/animals query `blocked(lat, lon, r)`
  before spawning and before choosing each walking target (arc-length distance in world units).

Ferry transport: ✅ `src/world/FerryManager.js`

- 2 ferries follow existing water routes; each trip carries up to `FERRY.CAPACITY` (5) travellers
  (characters first, animals fill remaining seats). Mid-route they disembark at the destination port,
  adopt it as their `home`, and rejoin its population; returning to port A reboards a fresh batch.

Water Models:

Create a `WaterFeatureManager` for reefs, waves, whirlpools, foam lines, or harbor water props. Register `type: 'water-prop'` so storms and tsunamis can query or replace them.

Disasters:

Add event-specific visual creation and damage timing in `EnvironmentEventSystem`. Keep physics/damage calls centralized through `DamageSystem`.
