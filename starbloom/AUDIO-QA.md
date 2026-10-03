# STARBLOOM original audio QA

## Result
- 16 automated tests passed; 0 failed (Node 24, 2026-10-03)
- `node --test tests/audio.test.mjs` reproduces the tests
- `node audio-preview/render-preview.mjs` reproduces two 44.1 kHz, mono, 16-bit WAV previews
- Every sound and biome is original, procedurally synthesized from frozen score/spec data. No external or copyrighted samples are used
- These WAVs are offline synthesis previews from the exact PCM generator used by the WebAudio engine. No browser/speaker audition is claimed. The engine's live dynamics compressor is not included in the offline WAV mix

## Integration contract
Import `GameAudio` from `audio.js` and instantiate it once. The constructor optionally accepts `{ contextFactory, storage, storageKey }`; defaults use the current window's AudioContext and localStorage. The default key is `starbloom-audio-v1`.

Call `unlock()` directly from the Start/Retry/Unmute user gesture, then await its boolean result before the first `play('land')`. The context is created lazily and resume is called synchronously. Repeating unlock retries resume even if a previous non-gesture call is still pending. Unsupported/denied audio resolves false and leaves the game usable. Events before a successful unlock are dropped, never queued.

API: `.muted` (false unless specifically saved), `.volume` (SFX-only, .7), `.ambientVolume` (.25), `.unlocked`, `setMuted(bool)`, `setVolume(0..1)`, `setAmbientVolume(0..1)`, `setAmbientActive(bool)`, `setBiome(0..4)`, `setPaused(bool)`, `setHidden(bool)`, `play(name, {id, level, intensity})`, `reset()`, `dispose()`, `snapshot()`.

The 14 names are shoot, enemyshoot, hit, kill, hurt, dash, wave, clear, upgrade, launch, land, dead, win, eruption. Duplicate event-name/ID pairs are ignored in a bounded 512-entry cache. ID-free effects may repeat. Play returns a boolean; it never resumes a context automatically.

Biomes: 0 grass wind/birds; 1 flowing water; 2 icy wind; 3 forest wind/birds; 4 low volcanic rumble. Ambient loops start only after `setAmbientActive(true)` and successful unlock; at most one exists. `setBiome` replaces it immediately. There are no JS timers for effects or loops.

Mute, pause, hidden, reset, and dispose stop all relevant sources immediately, including the unplayed later notes in a multi-note score. Unmute does not replay old SFX. Pause/hidden gates remain effective when unmuting. Reset clears event IDs and disables ambience while preserving preferences and explicit paused/hidden state. Gameplay should explicitly set its desired phase flags after reset. Dispose disconnects nodes, drops buffers, and closes the context.

At most 24 live sources exist including the ambient loop. The oldest SFX is stolen at the cap. Every source routes through its own gain, a separate SFX/ambient bus, a compressor, and the shared mute/pause/hidden master gate. Finished sources disconnect. SFX buffers are reused; there are at most 19 cached buffers, about 25 MB at 44.1 kHz after every biome/effect has been visited.

## Automated coverage
1. Unmuted new-player defaults, lazy context, no stale queue, synchronous resume
2. Persisted/validated settings, corrupt/blocked storage
3. Stored mute preservation and two buses plus compressor
4. Event deduplication, memory bound, reset replay
5. 24-source cap including ambience and oldest-SFX stealing
6. Immediate mute, pending-note cancellation, single-loop unmute
7. Independent SFX/ambience sliders including zero
8. Combined pause/hidden/unmute/biome gating
9. Loop replacement and phase gating preserving transition SFX
10. Natural source completion and reset lifecycle
11. Complete/idempotent disposal and no revival
12. Unsupported/denied context and retry recovery
13. Later real gesture recovers a pending non-gesture resume
14. Disposal during unresolved unlock cannot recreate nodes
15. All 14 SFX are immutable, unique, deterministic, finite, with measurable nonzero amplitude and no PCM clipping
16. All 5 ambiences are immutable, unique, deterministic, bounded, and zero at loop boundaries

## Files
- `audio.js`: production engine and shared score/render exports
- `fake-audio-context.mjs`: exported FakeAudioContext and MemoryStorage for integration tests
- `audio.test.mjs`: self-contained tests (adjust its audio.js import if placed beside an app's tests)
- `starbloom-original-sfx-preview.wav`: all 14 effects in order, separated by 600 ms
- `starbloom-original-biomes-preview.wav`: 6 seconds per biome at default ambience level
- `preview-cues.json`: timestamps, mix limits, file properties

## Application regression
The actual game.js event dispatcher was exercised with a WebAudio-shaped test context, while the DOM and WebGL renderer remain stubs. A complete five-planet combat run emitted 1,644 audio events, peaked at 12 simultaneous voices, and retained the one-planet/two-during-transit resource budget. No browser or physical speaker audition is claimed.
