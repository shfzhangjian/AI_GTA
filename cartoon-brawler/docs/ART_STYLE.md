# Art Style Guide — Tinker's Crossing

## Pillars

1. **Cartoon medieval, saturated but warm.** Storybook village under a late-afternoon sun.
   Chunky shapes, no realism, no grimdark.
2. **Exaggerated proportions.** Heroes and enemies: big heads/hands/feet, ~4.5–5 heads tall,
   narrow waists, wide shoulders. Weapons are 30–40 % larger than "realistic".
3. **Strong silhouette readability.** Player is always the brightest, most saturated figure on
   screen; enemies read by shape (swordsman = slim & pointy, brute = barrel + tiny head,
   rogue = hunched & spiky). The boss is ~1.85× player scale with a huge hammer.
4. **Everything reacts.** Hit = squash/anticipation/overshoot in animation, particle burst,
   hit-stop freeze frame, camera trauma shake, debris everywhere.

## Color language (see `src/config/graphicsConfig.ts` → `PALETTE`)

| Role | Color | Notes |
|---|---|---|
| Hero tunic | saturated red `#d8352b` | highest saturation on screen |
| Hero armor trim | warm gold `#f0b429` | |
| Enemy swordsman | steel blue-grey `#5a6f8c` | desaturated vs hero |
| Enemy brute | mud brown `#7d5a37` | |
| Enemy rogue | sickly green `#4e7a3f` | |
| Boss | hollow black-steel `#2b2b33` + ember orange `#ff7847` | glows in phase 3 |
| Grass / dirt / stone | `#5da147`, `#b98d5a`, `#9aa3ad` | mid-value, low-ish sat so characters pop |
| Danger telegraphs | ember orange, white flash | windups & shockwaves |

Lighting: one warm directional sun with shadows + cool hemisphere fill. Materials are flat
`MeshLambert/Standard` with high roughness — no PBR realism, minimal texture work (vertex or
solid colors), optional fog for depth.

## Geometry rules

- Low/mid-poly: boxes, capsules, cylinders, cones — chamfered feel via slight bevels and
  chunky proportions rather than dense meshes.
- Characters are built from primitives parented to a named bone hierarchy
  (`hips/spine/head/armL/R/forearmL/R/legL/R/handR`) so procedural clips work on any rig —
  including dropped-in GLBs (`rigFromGLB` normalizes scale and finds `hips/head/handR`).
- Weapons attach to the hand bone via a virtual-hand transform; tips have `tipAnchor` empties
  for trail ribbons.

## Animation rules (procedural clips, `src/animation/ProceduralClips.ts`)

- Every attack: anticipation (windup pulls back) → snap-through (overshoot past target) →
  settle. Hit boxes are enabled by normalized-time events inside the clip window.
- Reactions sell force: hit = head/torso recoil; knockback = flail + slide; launch = spin;
  knockdown = ragdoll-ish collapse + getup with a head-shake.
- Loops (Idle/Walk/Run) are subtle; one-shots never loop; crossfades ≤ 0.15 s.

## VFX rules

- Weapon trail: pooled ribbon from `tipAnchor` history, fades over ~0.15 s.
- Impact bursts: 8–12 small boxes, velocity cone away from hit direction, gravity, ≤ 0.6 s.
- Shockwaves: expanding flat ring + radial dust, white → orange.
- Breakables shatter into 3–7 chunky fragments with angular velocity; debris fades out at
  3–8 s and is pooled (never allocated in steady state).

## Camera rules

- Fixed-pitch (~28°) follow camera, slight look-ahead toward facing / enemy centroid.
- Distance grows when surrounded or in boss mode. Shake = trauma² decay, positional noise on
  the Y/Z axes only (no roll), max ~0.35 m.
