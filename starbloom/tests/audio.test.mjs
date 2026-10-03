import test from 'node:test';
import assert from 'node:assert/strict';
import { GameAudio, AUDIO_STORAGE_KEY, MAX_VOICES, SFX_SCORES, BIOME_SPECS, renderSfxPCM, renderAmbiencePCM, scoreDuration } from '../audio.js';
import { FakeAudioContext, MemoryStorage } from './fake-audio-context.mjs';
function setup(options = {}) {
  const context = new FakeAudioContext(options.contextOptions);
  const storage = options.storage || new MemoryStorage();
  let created = 0;
  const audio = new GameAudio({ contextFactory: () => { created++; return context; }, storage });
  return { audio, context, storage, get created() { return created; } };
}
const stats = data => {
  let energy = 0, peak = 0;
  for (const value of data) { assert.ok(Number.isFinite(value)); energy += value * value; peak = Math.max(peak, Math.abs(value)); }
  return { rms: Math.sqrt(energy / data.length), peak };
};

test('new players hear sound by default; context is lazy; old unrelated mute is ignored', async () => {
  const { audio, context } = setup({ storage: new MemoryStorage({ 'muted': 'true' }) });
  assert.equal(audio.muted, false); assert.equal(audio.volume, .7); assert.equal(audio.ambientVolume, .25);
  assert.equal(audio.unlocked, false); assert.equal(audio.snapshot().contextState, 'not-created');
  assert.equal(audio.play('land', { id: 'stale' }), false); assert.equal(context.nodes.length, 0);
  const promise = audio.unlock();
  assert.equal(context.resumeCalls, 1, 'resume happened synchronously during the gesture');
  assert.equal(await promise, true); assert.equal(audio.unlocked, true);
  assert.equal(audio.snapshot().sfxVoices, 0, 'no stale-event replay queue');
  assert.equal(audio.play('land', { id: 'fresh' }), true);
});

test('all preferences persist and validate; blocked/corrupt storage stays safe', () => {
  const { audio, storage } = setup();
  audio.setMuted(true); audio.setVolume(.43); audio.setAmbientVolume(.17);
  const loaded = new GameAudio({ storage });
  assert.equal(loaded.muted, true); assert.equal(loaded.volume, .43); assert.equal(loaded.ambientVolume, .17);
  assert.deepEqual(JSON.parse(storage.getItem(AUDIO_STORAGE_KEY)), { muted: true, volume: .43, ambientVolume: .17 });
  loaded.setVolume(99); loaded.setAmbientVolume(-4); assert.equal(loaded.volume, 1); assert.equal(loaded.ambientVolume, 0);
  loaded.setVolume(NaN); assert.equal(loaded.volume, 1);
  assert.equal(new GameAudio({ storage: new MemoryStorage({ [AUDIO_STORAGE_KEY]: '{bad' }) }).muted, false);
  assert.doesNotThrow(() => { const bad = new GameAudio({ storage: { getItem() { throw Error(); }, setItem() { throw Error(); } } }); bad.setMuted(true); });
});

test('unlock preserves stored mute and creates separate buses plus compressor', async () => {
  const { audio, context } = setup({ storage: new MemoryStorage({ [AUDIO_STORAGE_KEY]: JSON.stringify({ muted: true, volume: .3, ambientVolume: .2 }) }) });
  assert.equal(await audio.unlock(), true); assert.equal(audio.muted, true);
  assert.equal(audio.snapshot().masterGain, 0); assert.equal(audio.snapshot().sfxGain, .3); assert.equal(audio.snapshot().ambientGain, .2);
  const compressor = context.nodes.find(n => n.kind === 'compressor');
  assert.ok(compressor); assert.equal(compressor.ratio.value, 16);
  assert.equal(context.nodes.filter(n => n.connections.has(compressor)).length, 2);
  assert.equal(audio.play('shoot'), false);
});

test('dedup uses event and ID, is bounded, and reset allows replay IDs', async () => {
  const { audio, context } = setup(); await audio.unlock();
  assert.equal(audio.play('shoot', { id: 8 }), true); assert.equal(audio.play('shoot', { id: 8 }), false);
  assert.equal(audio.play('hit', { id: 8 }), true);
  assert.equal(audio.play('shoot'), true); assert.equal(audio.play('shoot'), true);
  assert.equal(audio.snapshot().duplicates, 1);
  for (let i = 0; i < 530; i++) { audio.play('shoot', { id: `unique-${i}` }); context.advance(.2); }
  assert.equal(audio.snapshot().dedupEntries, 512);
  audio.reset(); assert.equal(audio.snapshot().dedupEntries, 0); assert.equal(audio.play('shoot', { id: 8 }), true);
});

test('24-source limit includes ambience; oldest SFX stolen; each buffer rendered once', async () => {
  const { audio, context } = setup(); await audio.unlock(); audio.setAmbientActive(true);
  const loop = context.liveSources.find(n => n.loop);
  for (let i = 0; i < 150; i++) audio.play('launch', { id: i });
  const snap = audio.snapshot();
  assert.equal(snap.voices, MAX_VOICES); assert.equal(snap.sfxVoices, 23); assert.equal(snap.ambientLoops, 1);
  assert.equal(snap.maxVoicesSeen, MAX_VOICES); assert.equal(snap.cachedBuffers, 2);
  assert.ok(snap.stolen > 0); assert.equal(loop.stopped, false); assert.equal(context.liveSources.length, MAX_VOICES);
});

test('mute immediately cancels all voices and future sequence notes; unmute starts only one loop', async () => {
  const { audio, context } = setup(); await audio.unlock(); audio.setAmbientActive(true); audio.play('win');
  assert.ok(audio.snapshot().pendingNotes > 0);
  audio.setMuted(true);
  assert.equal(audio.snapshot().masterGain, 0); assert.equal(audio.snapshot().voices, 0); assert.equal(audio.snapshot().pendingNotes, 0);
  assert.equal(context.liveSources.length, 0);
  context.advance(4); assert.equal(audio.snapshot().voices, 0);
  audio.setMuted(false); audio.setMuted(false); audio.setAmbientActive(true);
  assert.equal(audio.snapshot().ambientLoops, 1); assert.equal(audio.snapshot().sfxVoices, 0);
});

test('SFX and ambience sliders are independent, including zero', async () => {
  const { audio } = setup(); await audio.unlock(); audio.setAmbientActive(true); audio.play('launch');
  audio.setVolume(0);
  assert.equal(audio.snapshot().sfxGain, 0); assert.equal(audio.snapshot().ambientGain, .25);
  assert.equal(audio.snapshot().masterGain, 1); assert.equal(audio.snapshot().sfxVoices, 0); assert.equal(audio.snapshot().ambientLoops, 1);
  assert.equal(audio.play('shoot'), false);
  audio.setVolume(.62); audio.setAmbientVolume(0);
  assert.equal(audio.play('shoot'), true); assert.equal(audio.snapshot().ambientLoops, 0); assert.equal(audio.snapshot().sfxGain, .62);
  audio.setAmbientVolume(.36); assert.equal(audio.snapshot().ambientLoops, 1);
});

test('pause and hidden gating compose; unmute or biome changes cannot leak audio', async () => {
  const { audio, context } = setup(); await audio.unlock(); audio.setAmbientActive(true); audio.play('upgrade');
  audio.setPaused(true); assert.equal(audio.snapshot().voices, 0); assert.equal(audio.snapshot().masterGain, 0);
  audio.setMuted(true); audio.setMuted(false); audio.setBiome(2); audio.setAmbientActive(true);
  assert.equal(audio.play('shoot'), false); assert.equal(context.liveSources.length, 0);
  audio.setHidden(true); audio.setPaused(false); assert.equal(audio.snapshot().voices, 0);
  audio.setHidden(false); audio.setHidden(false); audio.setPaused(false);
  assert.equal(audio.snapshot().ambientLoops, 1); assert.equal(audio.snapshot().masterGain, 1);
  audio.play('win'); audio.setHidden(true); assert.equal(audio.snapshot().pendingNotes, 0); assert.equal(context.liveSources.length, 0);
});

test('biome changes replace rather than multiply loops; phase gating does not kill SFX', async () => {
  const { audio, context } = setup(); await audio.unlock(); audio.setAmbientActive(true);
  const first = context.liveSources[0]; audio.setBiome(4);
  assert.equal(first.stopped, true); assert.equal(audio.snapshot().biome, 4); assert.equal(audio.snapshot().ambientLoops, 1);
  for (let i = 0; i < 50; i++) { audio.setBiome(4); audio.setAmbientActive(true); }
  assert.equal(audio.snapshot().ambientLoops, 1);
  audio.play('clear'); audio.setAmbientActive(false); assert.equal(audio.snapshot().sfxVoices, 1); assert.equal(audio.snapshot().ambientLoops, 0);
});

test('natural end disconnects voices; reset cancels all but preserves preferences', async () => {
  const { audio, context } = setup(); await audio.unlock(); audio.play('shoot');
  const source = context.liveSources[0]; context.advance(.3);
  assert.equal(audio.snapshot().voices, 0); assert.equal(source.connections.size, 0);
  audio.setVolume(.44); audio.setAmbientVolume(.33); audio.setAmbientActive(true); audio.play('win', { id: 'ending' }); audio.reset();
  const snap = audio.snapshot(); assert.equal(snap.voices, 0); assert.equal(snap.pendingNotes, 0); assert.equal(snap.dedupEntries, 0);
  assert.equal(snap.ambientActive, false); assert.equal(snap.volume, .44); assert.equal(snap.ambientVolume, .33); assert.equal(snap.muted, false);
});

test('dispose closes context, releases nodes/buffers, cannot revive, and is idempotent', async () => {
  const { audio, context } = setup(); await audio.unlock(); audio.setAmbientActive(true); audio.play('win');
  await audio.dispose(); await audio.dispose();
  assert.equal(context.closeCalls, 1); assert.equal(context.liveSources.length, 0); assert.equal(context.connectedNodes.length, 0);
  assert.equal(audio.snapshot().cachedBuffers, 0); assert.equal(audio.snapshot().disposed, true); assert.equal(audio.snapshot().voices, 0);
  assert.equal(await audio.unlock(), false); assert.equal(audio.play('shoot'), false); audio.setMuted(false); audio.setAmbientActive(true);
  assert.equal(context.liveSources.length, 0);
});

test('unavailable and denied audio are graceful and may be retried', async () => {
  assert.equal(await new GameAudio({ contextFactory: () => null, storage: null }).unlock(), false);
  assert.equal(await new GameAudio({ contextFactory: () => { throw Error('unsupported'); }, storage: null }).unlock(), false);
  const { audio, context } = setup({ contextOptions: { resumeMode: 'reject' } });
  assert.equal(await audio.unlock(), false); assert.equal(audio.play('land'), false);
  context.resumeMode = 'auto'; assert.equal(await audio.unlock(), true); assert.equal(audio.play('land'), true);
});

test('a second real gesture retries resume while first non-gesture promise remains pending', async () => {
  const { audio, context } = setup({ contextOptions: { resumeMode: 'manual' } });
  const first = audio.unlock(); assert.equal(context.resumeCalls, 1); assert.equal(audio.unlocked, false);
  context.resumeMode = 'auto'; const second = audio.unlock();
  assert.equal(context.resumeCalls, 2); assert.equal(await second, true); assert.equal(await first, true);
  assert.equal(audio.snapshot().sfxVoices, 0); assert.equal(audio.play('land'), true);
});

test('disposing during pending unlock cannot resurrect nodes or loops', async () => {
  const { audio, context } = setup({ contextOptions: { resumeMode: 'manual' } });
  audio.setAmbientActive(true); const pending = audio.unlock(); await audio.dispose(); context.allowResume();
  assert.equal(await pending, false); assert.equal(audio.snapshot().unlocked, false); assert.equal(audio.snapshot().voices, 0);
});

test('all 14 original effect scores are immutable, distinct, deterministic, finite and audible', () => {
  assert.equal(Object.keys(SFX_SCORES).length, 14); assert.ok(Object.isFrozen(SFX_SCORES.shoot[0]));
  const fingerprints = new Set();
  for (const [name, score] of Object.entries(SFX_SCORES)) {
    const pcm = renderSfxPCM(name, 16000); const meter = stats(pcm);
    assert.ok(meter.peak > .13, `${name} has usable peak`); assert.ok(meter.rms > .015, `${name} has usable energy`);
    assert.ok(meter.peak < 1, `${name} is not clipped`); assert.ok(pcm.length / 16000 >= scoreDuration(score));
    assert.deepEqual(pcm, renderSfxPCM(name, 16000)); assert.equal(pcm[pcm.length - 1], 0);
    fingerprints.add(`${pcm.length}:${meter.rms}:${meter.peak}`);
  }
  assert.equal(fingerprints.size, 14);
});

test('all five ambience buffers are distinct, quiet, deterministic, bounded, click-free at seams', () => {
  assert.equal(BIOME_SPECS.length, 5); assert.ok(Object.isFrozen(BIOME_SPECS[0]));
  const fingerprints = new Set();
  for (let biome = 0; biome < 5; biome++) {
    const pcm = renderAmbiencePCM(biome, 12000), meter = stats(pcm);
    assert.equal(pcm.length, 24 * 12000); assert.ok(meter.rms > .008); assert.ok(meter.rms < .15); assert.ok(meter.peak < .6);
    assert.ok(Math.abs(pcm[0]) < 1e-9); assert.ok(Math.abs(pcm[pcm.length - 1]) < 1e-9);
    assert.deepEqual(pcm, renderAmbiencePCM(biome, 12000)); fingerprints.add(meter.rms);
  }
  assert.equal(fingerprints.size, 5);
});
