# Validation — 2026-10-03

- Built 546 KB single HTML; Three.js r165 and its MIT notice are inline. No sidecar runtime dependency. Only Google Fonts may load externally.
- `node --check app.js` and `node verify.cjs` passed. The latter compiles the actual HTML's inline JavaScript and checks 1,000 seeded Gent curves for initial peak, lower middle pressure, finite positive readings, sharp terminal increase, and 18–28 scraps.
- Browser interaction verified at 1280×720, 390×844, and 844×390: pumping with Space, F, W, R, result controls, sound toggle, both experiment modes, and responsive framing.
- Air ended at 30 pumps / 14.3× area / 7.6 kPa. Replay seed 1138963839 produced exactly the original 120th physics-step fingerprint `ca7daaa9`.
- Water ended at 21 pumps / 12.6× area / 7.5 kPa. Replay seed 338035143 produced exactly the original fragment + droplet fingerprint `82359825`.
- Both localStorage best records appeared in the result sheet. A reload retained the air best. The seeded simulation keeps progressing behind the result sheet until the scraps land.
- 24 shader programs compiled during startup; the count remained 24 during pumping, air and water bursts, and replay. A fresh final browser session logged no errors or warnings.
- After reducing idle mesh updates, the 390×844 water viewport measured approximately 50 fps in this desktop test browser. This is viewport emulation, not a measurement on physical phone hardware.
- The browser tool permits HTTP(S) only, so direct `file://` execution could not be exercised. The export's single-file structure and inline script were checked statically; live checks used the identical `index.html` served at localhost.
- Reduced-motion CSS and simulation branches were reviewed; the host's OS media preference was not changed.
- Repository packaging: `npm run build` and `npm run check` passed using the lockfile. Generated shader lines have their trailing whitespace normalized for Git checks. The root navigation link opened `/balloon-test/` successfully with a working pump and no console errors.

Folded shapes, the aneurysm, rubber curling and falling water are visual approximations around the Gent membrane pressure model. Full continuum and fluid solvers are outside this implementation.
