# Jelly Dice

Open `index.html` directly in a WebGPU-capable browser, or serve this folder on localhost. The HTML is the entire application: inline JavaScript, CSS, WGSL, embedded Instrument Serif / Sans fonts, procedural geometry, lighting, materials and synthesised audio. There are no runtime requests, libraries or build steps.

## Play

- Tap a die to poke it. Pull gently to stretch it against the plate; pull farther to lift it.
- Drag the empty table to orbit. Scroll or pinch to zoom.
- Space / R rolls 1–5 dice. The result is read from the simulated orientation once every die is asleep.
- Tab through the controls. Focus the playground, use 1–5 to select a die, Enter to poke, and arrows to nudge.
- Settings include softness, decay, quarter speed, lattice display, sound, pause, and resets. Sound is off initially. Reduced-motion preferences reduce poke/roll motion and disable camera drift.

## Implementation

Each die has 125 simulated nodes, 64 overlapping co-rotational cell clusters and 384 tetrahedra with per-tet co-rotational elasticity and XPBD signed-volume constraints. The simulation runs at 120 Hz. A final deformation projection bounds every tet edge to 0.62–1.48 times its rest length while retaining the rigid pose. Inverted tets receive a proper-rotation recovery projection. Internal damping removes only the velocity left after subtracting translation and angular motion. Floor and rounded-box contact include friction; die-to-die reactions are distributed through barycentric lattice attachments. Floor rotation loses energy separately, and heavy landings receive a short extra damping window. Sleep freezes every node. Neighbour wake-up uses movement or an active grab, so stationary neighbours and aligned stacks can settle together.

The raw WebGPU renderer computes node deformation Jacobians, embeds the rounded, dimpled surface into the lattice and transforms smooth normals with the cofactor. Dynamic geometry uploads contain node positions only. Five front depth layers are peeled with 4× MSAA, and per-die back-face passes supply exit positions, normals and far-face pips. Refraction applies Snell's law, refines the exit against the back-face depth and samples the scene behind each depth layer. Beer–Lambert absorption gives thickness-dependent colour; Fresnel reflection, studio softbox/strip/fill illumination and an ivory under-skin pip layer finish the candy. A top-down height map provides tinted soft shadows and contact occlusion. The final pass applies Khronos PBR Neutral tone mapping and dither.

Refraction is a screen-space approximation with five depth layers. Geometry outside the screen and repeated internal optical bounces are not traced. The plate uses a procedural glass shading model. Rendering resolution is capped at 1.4 million pixels; achievable frame rate depends on the graphics adapter and browser.

## Headless validation

`tests/qa.mjs` exercises roll, poke, drag, release, sleep, colour controls, settings, mobile layout and the no-WebGPU fallback. `tests/stress.mjs` checks full-lattice inversion recovery, deliberately overlapping dice at maximum softness, the force/strain bounds, base adhesion, neighbour sleep, pause, pinch, keyboard input and direct-file loading. See [VALIDATION.md](./VALIDATION.md) for the recorded results and [validation/](./validation/) for the JSON reports.

The optional test harness requires Node.js, `puppeteer-core` and an installed Chrome browser. The application itself remains dependency-free. From this directory:

```sh
npm install --no-save puppeteer-core
python -m http.server 9017 --bind 127.0.0.1
# In a second terminal, from the same directory:
node tests/qa.mjs
node tests/stress.mjs
node tests/settling.mjs
```

Set `CHROME_PATH` to your browser executable if it is not in a standard location. Set `JELLY_BASE_URL` to use another local server, or `PUPPETEER_MODULE` to a local Puppeteer module file. New test outputs go to the ignored `artifacts/` directory. The included desktop and phone screenshots are [preview.png](./preview.png) and [preview-mobile.png](./preview-mobile.png).

The embedded Instrument fonts are distributed under the SIL Open Font License, included inside the HTML. The PBR Neutral implementation is adapted from [KhronosGroup/ToneMapping](https://github.com/KhronosGroup/ToneMapping).
