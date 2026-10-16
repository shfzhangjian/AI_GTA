# 符林守夜 · RUNEWARD

Original fantasy arena roguelite, inspired by the arena-survival genre. All characters, environments and sounds are procedurally authored for this game; no reference-game assets are used.

## Play

Serve this folder over HTTP (ES modules): `python3 -m http.server 4180`, then visit `http://localhost:4180/`. No build, account, CDN or network dependency. Three.js is bundled with its MIT license. WebGL2 is preferred; a complete Canvas2D renderer automatically takes over if unavailable. `?canvas` forces compatibility mode.

WASD or arrow keys move relative to the screen. Space dashes with a short invulnerability window. 1/2/3 switches weapons at any time. F toggles auto aim; with it off, hold mouse to fire toward the cursor. Touch uses a movement stick, automatic fire, and dash/weapon buttons. P/Escape pauses; losing focus also pauses.

Six waves, culminating in the antler king. Between waves choose one of three random upgrades. Bow arrows pierce; thrown stones follow an arc, splash and knock enemies back; magic seeks targets and chains. Imps rush, brutes charge, wisps fire fans, boss fires rings. Attacks have advance telegraphs. Four pillars block movement and straight projectiles; thrown stones clear them. Pickups grant healing or seven-second haste/damage buffs.

Earned embers are banked on victory, defeat or returning to camp; a five-level health/damage workshop uses localStorage. No personal data is sent anywhere. Clearing browser storage clears progress.

## Tests

`npm test` (Node built-in runner, no install required). Tests cover weapons, dash invulnerability, obstacles, wave/choice/win loop, splash/knockback, chains/piercing, defeat/restart, pause and bounded stress. Rendering QA is separate from engine unit tests.

## Files

- `engine.js`: rendering-independent simulation
- `app.js`: UI, input, save, generated audio
- `render3d.js`: procedural Three.js art
- `render2d.js`: isometric Canvas compatibility art
- `vendor/`: bundled Three.js modules and MIT license

All sounds are synthesized after the first user interaction. The game contains no analytics, remote assets or authentication.
