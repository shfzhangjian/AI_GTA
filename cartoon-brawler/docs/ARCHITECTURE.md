# Architecture — Tinker's Crossing

## Stack

TypeScript strict · Vite 8 · three r185 (`three/addons/*` loaders) ·
@dimforge/rapier3d-compat 0.20 (WASM, `RAPIER.init()`) · Web Audio API (fully synthesized SFX).
No game frameworks; Three.js is the render core.

## Game loop (`src/core/GameLoop.ts`, `Time.ts`)

One `requestAnimationFrame` → `tickOnce(dt)`:

```
Time.tick(realDt)                 # clamped real dt, hit-stop scales simDelta only
Input   (realDt)                  # sample keyboard+gamepad into one InputFrame; endFrame()
Logic   (simDelta)                # player FSM + entities, wave/boss progression, despawns
AI      (simDelta)                # coordinator slots + utility scores + boss FSM decisions
FixedPhysics × N (1/60, ≤4 steps) # accumulator in Time.consumeFixedSteps; rapier world.step()
TransformSync(realDt)             # physics → visual roots; livePlayerPos refresh
Animation(simDelta)               # AnimationMixer advance → normalized-time events
Camera  (realDt)                  # follow + shake decay
Effects (simDelta)                # trails, particles, shockwaves
Render  (rawDt)                   # renderer.render()
```

- **HitStop** scales `simDelta` only — UI, camera and rendering keep real time.
- **Pause** zeroes `simDelta`; input keeps sampling so ESC resumes.
- All hot paths use scratch vectors (`core/TempObjects.ts`); physics owns private scratches
  (aliasing shared temps across systems was a real bug class found during testing).

## Composition root — `src/core/Game.ts`

Owns every system and wires them: EventBus, Time, RendererManager/Lighting/Environment,
PhysicsWorld, AssetManager, Input, Camera, Destruction, Combat (bindings + breakables),
HitReaction, Combo, Player, enemies[], Boss, VFX, Audio, HUD/BossBar/GameOver/DebugPanel.
Exposes `tickForTest / tickFramesWithTrace / testPress` for headless smoke tests.

## Character physics (`src/physics/CharacterPhysics.ts`)

Kinematic **PositionBased** capsule bodies moved through Rapier's
`KinematicCharacterController.computeColliderMovement`. Conventions that matter:

- Body translation = **feet position** + `centerOffset (halfHeight+radius)`; collider is
  centered on the body origin. Controller offset is a small constant (0.14), not the radius.
- Ground check = downward press consumption (not `computedGrounded()`).
- Guards: NaN check, absurd-step rejection, world bounds clamp — physics must never fling
  characters out of the level.
- Knockback/launch are velocity impulses with decay; landing impact feeds Knockdown.

## Collision layers (`src/config/physicsConfig.ts`)

Bit groups `WORLD / PLAYER / ENEMY / PLAYER_HITBOX / ENEMY_HITBOX / BREAKABLE / DEBRIS / TRIGGER`
encoded as Rapier `(membership << 16) | filter`. Hit boxes are **sensors-by-query, not colliders**:
`HitBox.query()` runs `world.intersectionsWithShape(Ball)` per active frame, filters membership
+ cone angle vs facing, then hands results to `CombatSystem.processAttack` which dedupes per
swing via a `hitSet`, resolves entity bindings (`colliderHandle → EntityBinding`) or breakables.

## Combat flow

```
input buffer (180ms) → Player.startAttack → FSM AttackState.enter
  combat.beginAttack(data, source) + configureHitBox(weapon) + anim.play(clip)
AnimationEvents (normalized time): HitBoxEnable/Disable, ComboWindowOpen/Close,
  InvincibleOn/Off, LandImpact, DeathApply…
each frame: combat.update(origin,facing) → processAttack → HitReactionSystem
  → hitstop + camera shake + 'impact' bus event → target.applyHit(reaction)
finish: anim.finished OR wall-clock fallback (dur×1.25); buffered chain → next AttackState
```

Chained attacks bypass the locomotion `canAttack` gate via an explicit `chaining` flag so a
swing can hand off to the next swing inside one update.

## Enemy AI (`src/enemy/`)

`EnemyCoordinator` owns N attack slots (angle = 2π·i/N around the player, re-assigned by
distance every 0.45 s) and soft separation. `EnemyAI.utilityScores` scores
attack/circle/approach/retreat/idle from distance, facing angle, cooldown, slot claim and LOS
(raycast filtered to WORLD membership only — characters never block sight). The FSM
(Idle/Patrol/Chase/Circle/Attack/Recover/Hit/Knockback/Airborne/Knockdown/GetUp/Death) consumes
the chosen action; Death requests despawn after 4 s.

## Boss (`src/boss/`)

Phase controller (thresholds 70 %/30 %) picks weighted-random skills per phase with anti-repeat
(same skill ×0.15, last-two ×0.5): horizontalSwing, hammerSmash, charge, jumpSmash+shockwave,
spinAttack (360° hitbox), doubleSmash. Shockwaves damage the player via a direct `applyHit`.

## Destruction (`src/world/`)

Props are dynamic rigid bodies (BREAKABLE group) with health + impact thresholds; weapons call
`onWeaponHit`, moving props smash each other in `checkPropImpacts()`. Destroy → pooled fragment
meshes + debris bodies (DEBRIS group), capped at ≤48 active debris and <100 total rigid bodies,
3–8 s lifetime then pooled.

## Assets & animation (`src/assets/`, `src/animation/`)

`AssetManager` = GLTFLoader + DRACOLoader + KTX2Loader; **every load is optional** — failures
are recorded and logged as `TODO Replace Asset`, procedural fallback meshes/clips are returned.
`ProceduralClipFactory` builds quaternion-keyframe clips against a *named-bone* contract, so the
same FSM works on fallback rigs and dropped-in GLBs. `AnimationController` merges file +
procedural clips (file wins) and fires normalized-time events through an `EventCursor`.

## Rendering (`src/renderer/`)

One directional sun (shadow frustum follows the player pivot) + hemisphere fill, fog, shared
static-body collider batch for level geometry (hundreds of colliders, one body). Environment
builds the whole corridor: gate z≈38 → road → plaza z≈-2 → river/bridge z≈-15 → arena z≈-34.

## UI (`src/ui/`)

Plain DOM overlay (HP bar, weapon slots, combo counter, wave banner, boss bar, pause/victory/
defeat screens, debug panel with collider/hitbox/AI/slot toggles + FPS/draws/bodies/debris).
DOM updates are diffed (write only on change) so hit-stop never freezes the UI.

## Testing hooks

`?autostart&ticks=N&mode=campaign|combat|world` runs deterministic simulated frames headlessly
and writes results to `document.title` / `window.__SMOKE`. Campaign mode verifies waves → boss
phases → victory → restart → defeat; combat mode verifies sword damage vs wave 1; world mode
verifies breakables/debris/rigidbody caps.
