# Reference and implementation parity

Reference inspected directly in the cloud browser on 2026-10-02: https://destroy.spritefusion.com/.

| Observed feature | Implementation | Fidelity / limitation |
| --- | --- | --- |
| Pixel game-native title, address input, demo/Wikipedia shortcuts | Implemented | Layout follows reference; independent font/art and attribution replace original brand |
| Orange stick figure, aiming, run, jump, flip, sustained flight | Implemented in original skeletal pixel-grid renderer | Different sprite artwork, animation timing and physics; not byte-identical |
| Ten weapon slots and mouse-wheel / numeric selection | All ten implemented | Weapon art, projectiles, effects and tuning independently authored |
| Right-click grenade | Ballistic grenade, timer, blast, fragments | Independent physics and sound |
| Muzzle flashes, recoil, fragments, letter debris, smoke, flame, shockwave, beams | Implemented | Observed effect categories reproduced, exact frame timing/particle distribution differs |
| Destruction progress and completion | Implemented | Progress measures removed pixel cells rather than original body material accounting |
| Full page capture and semantic website destruction | Public viewport screenshot capture | Only 1200×1200, no authenticated pages or query URLs; pixel shards, no semantic DOM/letter capture on arbitrary websites |
| Built-in demo destruction | Implemented | Individual letter debris and page fragments; independently written content and scene |
| Wikipedia shortcut | Built-in attributed sample | Short local stick-figure page, not a fresh live Wikipedia capture |
| Pause, resume, restart, new site | Implemented | Repeat flows pending browser acceptance test |
| Three backgrounds | Licensed mountain, sunny ocean and city artwork | Matching themes, different actual artwork |
| Sound toggle | Synthesized Web Audio | Original sound recordings not reused |
| Create/join room, name, invite, host start | Implemented with remote D1 state | Four players; 350ms polling rather than original Durable Objects/WebSockets |
| Damage, health, kills, respawn, scoreboard, 10-kill victory, rematch | Implemented | Server handles health/kills; movement and terrain collision are client simulated |
| Sharing and embed, dark/light badge | Implemented | Private Site remains access-controlled; invite/badge does not grant access |
| Mobile touch controls | Implemented | Needs actual mobile browser acceptance test |

No public reusable license for the original game's artwork or source was found. Public asset URLs alone were not treated as reuse permission. Licensed substitutes are documented in the app.
