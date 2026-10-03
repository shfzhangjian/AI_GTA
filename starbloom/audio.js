/** STARBLOOM original procedural audio. No downloaded samples or external dependencies.
 * Scores and renderers are shared by live WebAudio buffers and offline WAV QA.
 * Call unlock() directly from a user gesture; events before unlock are discarded.
 */
const freeze = value => {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
};
const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
const finite = (n, fallback) => Number.isFinite(Number(n)) ? Number(n) : fallback;
const tone = (at, duration, frequency, endFrequency, gain, wave = 'sine', extra = {}) =>
  ({ kind: 'tone', at, duration, frequency, endFrequency, gain, wave, attack: .004, decay: 5, ...extra });
const noise = (at, duration, gain, lowpass, extra = {}) =>
  ({ kind: 'noise', at, duration, gain, lowpass, attack: .003, decay: 5, ...extra });

export const AUDIO_STORAGE_KEY = 'starbloom-audio-v1';
export const MAX_VOICES = 24;
export const SFX_SCORES = freeze({
  shoot: [tone(0, .115, 1380, 235, .40, 'triangle', { decay: 3.8 }),
    tone(0, .045, 2280, 730, .12), noise(0, .035, .09, 6200)],
  enemyshoot: [tone(0, .15, 510, 155, .28, 'triangle', { decay: 4 }),
    tone(.025, .09, 255, 115, .12), noise(0, .032, .065, 3400)],
  hit: [noise(0, .12, .53, 3100, { highpass: 230, decay: 6.5 }),
    tone(0, .09, 240, 88, .31, 'triangle')],
  kill: [noise(0, .40, .64, 1450, { endLowpass: 140, decay: 5 }),
    tone(0, .32, 156, 38, .43), tone(.065, .22, 520, 156, .09, 'triangle')],
  hurt: [tone(0, .29, 195, 72, .38, 'triangle', { tremolo: 32, tremoloDepth: .45, decay: 3.5 }),
    tone(.055, .25, 146, 64, .23, 'triangle'), noise(0, .14, .14, 1900)],
  dash: [noise(0, .29, .52, 700, { endLowpass: 7100, highpass: 380, attack: .025, decay: 3 }),
    tone(0, .21, 190, 1100, .15, 'sine', { attack: .014, decay: 3.5 })],
  wave: [tone(0, .20, 220, 220, .29, 'triangle'), tone(.16, .30, 330, 330, .27, 'triangle'),
    tone(.32, .43, 440, 440, .28, 'sine'), tone(.32, .33, 660, 660, .08)],
  clear: [tone(0, .45, 523.25, 523.25, .25), tone(.12, .46, 659.25, 659.25, .24),
    tone(.24, .5, 783.99, 783.99, .26), tone(.39, .78, 1046.5, 1046.5, .30),
    tone(.39, .66, 1567.98, 1567.98, .075)],
  upgrade: [tone(0, .40, 659.25, 659.25, .26), tone(.085, .4, 830.61, 830.61, .25),
    tone(.17, .45, 987.77, 987.77, .26), tone(.255, .73, 1318.51, 1318.51, .31),
    tone(.255, .64, 1975.53, 1975.53, .055)],
  launch: [noise(0, 1.25, .72, 340, { endLowpass: 4600, attack: .12, hold: .23, decay: 2.9 }),
    tone(0, .98, 48, 170, .35, 'triangle', { attack: .06, hold: .08, decay: 2.4 }),
    tone(.22, .8, 190, 1280, .11, 'sine', { attack: .06, decay: 2.7 })],
  land: [tone(0, .48, 112, 34, .58, 'sine', { decay: 5 }),
    noise(0, .28, .55, 1150, { endLowpass: 230, decay: 5 }),
    tone(.07, .35, 260, 180, .09, 'triangle')],
  dead: [tone(0, .50, 330, 165, .30, 'triangle', { decay: 3.8 }),
    tone(.27, .56, 261.63, 98, .29, 'triangle', { decay: 3.8 }),
    tone(.55, .92, 196, 49, .34, 'sine', { decay: 4.3 }),
    noise(.55, .55, .18, 600, { endLowpass: 100 })],
  win: [tone(0, .5, 523.25, 523.25, .27), tone(.14, .5, 659.25, 659.25, .26),
    tone(.28, .56, 783.99, 783.99, .28), tone(.46, 1.05, 1046.5, 1046.5, .29),
    tone(.46, .98, 659.25, 659.25, .17), tone(.46, .95, 783.99, 783.99, .17),
    tone(.73, .82, 2093, 2093, .06)],
  eruption: [noise(0, 1.13, .76, 1100, { endLowpass: 140, attack: .018, decay: 3.8 }),
    tone(0, .84, 86, 28, .54, 'sine', { decay: 4.3 }),
    noise(.20, .54, .26, 2700, { endLowpass: 390, decay: 5 })],
});

export const BIOME_SPECS = freeze([
  { name: 'Grassland', sound: 'gentle wind and small birds', duration: 24, seed: 1701,
    lowpass: 820, highpass: 85, noiseGain: .16, modulation: .29, birds: [2.8, 8.3, 17.1, 21.0], birdGain: .055 },
  { name: 'River', sound: 'flowing water', duration: 24, seed: 2701,
    lowpass: 3700, highpass: 220, noiseGain: .28, modulation: .15, bubbles: true },
  { name: 'Ice', sound: 'soft high mountain wind', duration: 24, seed: 3701,
    lowpass: 1750, highpass: 320, noiseGain: .22, modulation: .46, ice: true },
  { name: 'Forest', sound: 'leaf wind and distant birds', duration: 24, seed: 4701,
    lowpass: 2400, highpass: 190, noiseGain: .21, modulation: .23, birds: [1.9, 6.5, 12.8, 20.1], birdGain: .075 },
  { name: 'Volcano', sound: 'low volcanic rumble', duration: 24, seed: 5701,
    lowpass: 370, highpass: 18, noiseGain: .45, modulation: .30, rumble: true },
]);

function random(seed) {
  let state = seed >>> 0;
  return () => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state / 4294967296; };
}
function hash(text) {
  let result = 2166136261;
  for (const letter of text) result = Math.imul(result ^ letter.charCodeAt(0), 16777619);
  return result >>> 0;
}
function envelope(t, note) {
  const attack = Math.max(.0001, note.attack || .004);
  const hold = note.hold || 0;
  if (t < attack) return t / attack;
  if (t < attack + hold) return 1;
  const tail = Math.max(.001, note.duration - attack - hold);
  return Math.exp(-(note.decay ?? 5) * (t - attack - hold) / tail)
    * clamp((note.duration - t) / Math.min(.014, tail * .15), 0, 1);
}
function waveAt(phase, wave) {
  if (wave === 'triangle') return (2 / Math.PI) * Math.asin(Math.sin(phase));
  // Harmonic-limited saw/square support for future scores, never discontinuous raw waves.
  if (wave === 'square') return .81 * (Math.sin(phase) + Math.sin(phase * 3) / 3 + Math.sin(phase * 5) / 5);
  if (wave === 'sawtooth') return .64 * (Math.sin(phase) - Math.sin(phase * 2) / 2 + Math.sin(phase * 3) / 3);
  return Math.sin(phase);
}
function mixNote(output, note, sampleRate, rng) {
  const start = Math.floor(note.at * sampleRate);
  const frames = Math.min(Math.ceil(note.duration * sampleRate), output.length - start);
  let phase = 0, lp = 0, highpassLow = 0;
  for (let i = 0; i < frames; i++) {
    const t = i / sampleRate, u = t / note.duration;
    let sample;
    if (note.kind === 'tone') {
      const f = note.frequency * Math.pow((note.endFrequency || note.frequency) / note.frequency, u);
      phase += 2 * Math.PI * f / sampleRate;
      sample = waveAt(phase, note.wave);
    } else {
      const cutoff = (note.lowpass || 4000) * Math.pow((note.endLowpass || note.lowpass || 4000) / (note.lowpass || 4000), u);
      lp += (1 - Math.exp(-2 * Math.PI * cutoff / sampleRate)) * ((rng() * 2 - 1) - lp);
      sample = lp;
      if (note.highpass) {
        highpassLow += (1 - Math.exp(-2 * Math.PI * note.highpass / sampleRate)) * (lp - highpassLow);
        sample -= highpassLow;
      }
    }
    const tremolo = note.tremolo ? 1 - (note.tremoloDepth || .2) * (.5 + .5 * Math.sin(t * note.tremolo * 2 * Math.PI)) : 1;
    output[start + i] += sample * note.gain * envelope(t, note) * tremolo;
  }
}
export function scoreDuration(event) {
  const score = typeof event === 'string' ? SFX_SCORES[event] : event;
  return score?.length ? Math.max(...score.map(n => n.at + n.duration)) + .025 : 0;
}
/** Returns mono pre-bus/pre-master PCM. Same renderer used by live audio. */
export function renderSfxPCM(event, sampleRate = 44100) {
  const score = SFX_SCORES[event];
  if (!score) throw new RangeError(`Unknown STARBLOOM sound: ${event}`);
  sampleRate = clamp(Math.round(finite(sampleRate, 44100)), 8000, 192000);
  const output = new Float32Array(Math.ceil(scoreDuration(score) * sampleRate));
  score.forEach((note, i) => mixNote(output, note, sampleRate, random(hash(event) + i * 7919)));
  for (let i = 0; i < output.length; i++) output[i] = .9 * Math.tanh(output[i] / .9);
  return output;
}
/** A seamless, original 24-second nature loop with a short boundary fade. */
export function renderAmbiencePCM(index, sampleRate = 44100) {
  const spec = BIOME_SPECS[clamp(Math.floor(finite(index, 0)), 0, 4)];
  sampleRate = clamp(Math.round(finite(sampleRate, 44100)), 8000, 192000);
  const output = new Float32Array(Math.round(spec.duration * sampleRate));
  const rng = random(spec.seed), twoPi = Math.PI * 2;
  const lowAlpha = 1 - Math.exp(-twoPi * spec.lowpass / sampleRate);
  const highAlpha = 1 - Math.exp(-twoPi * spec.highpass / sampleRate);
  let lp = 0, low = 0;
  for (let i = 0; i < output.length; i++) {
    const t = i / sampleRate;
    lp += lowAlpha * (rng() * 2 - 1 - lp);
    low += highAlpha * (lp - low);
    const swell = 1 - spec.modulation * .5 + spec.modulation * .5 * Math.sin(twoPi * t / 8 + .8 * Math.sin(twoPi * t / 24));
    let value = (lp - low) * spec.noiseGain * swell;
    if (spec.rumble) value += .024 * Math.sin(twoPi * 39 * t) + .017 * Math.sin(twoPi * 57 * t) * (.7 + .3 * Math.sin(twoPi * t / 6));
    if (spec.ice) value += .006 * Math.sin(twoPi * 510 * t + 2.8 * Math.sin(twoPi * t / 12)) * (.5 + .5 * Math.sin(twoPi * t / 8));
    output[i] = value;
  }
  (spec.birds || []).forEach((at, i) => {
    mixNote(output, tone(at, .15, 2200 + i * 160, 3420 + i * 110, spec.birdGain, 'sine', { attack: .014, decay: 2.5 }), sampleRate, rng);
    mixNote(output, tone(at + .19, .21, 3150 + i * 100, 1870 + i * 90, spec.birdGain * .85, 'sine', { attack: .014, decay: 3 }), sampleRate, rng);
  });
  if (spec.bubbles) for (let at = 1.2; at < 23; at += 1.9) {
    mixNote(output, tone(at, .11, 310 + 180 * rng(), 970 + 120 * rng(), .018, 'sine', { attack: .01, decay: 5 }), sampleRate, rng);
  }
  // Boundary fade is deliberate: no discontinuity or click at a loop seam.
  const edge = Math.round(sampleRate * .12);
  for (let i = 0; i < edge; i++) {
    const gain = .5 - .5 * Math.cos(Math.PI * i / edge);
    output[i] *= gain;
    output[output.length - 1 - i] *= gain;
  }
  return output;
}

function defaultStorage() { try { return globalThis.localStorage || null; } catch { return null; } }
function defaultContextFactory() {
  const Constructor = globalThis.AudioContext || globalThis.webkitAudioContext;
  return Constructor ? new Constructor({ latencyHint: 'interactive' }) : null;
}
function setParam(param, value, time) {
  if (!param) return;
  param.cancelScheduledValues?.(time);
  if (param.setValueAtTime) param.setValueAtTime(value, time); else param.value = value;
}

export class GameAudio {
  constructor({ contextFactory = defaultContextFactory, storage = defaultStorage(), storageKey = AUDIO_STORAGE_KEY } = {}) {
    this._factory = contextFactory;
    this._storage = storage;
    this._storageKey = storageKey;
    let saved = null;
    try { saved = JSON.parse(storage?.getItem(storageKey) || 'null'); } catch { /* blocked/corrupt storage is harmless */ }
    this._muted = typeof saved?.muted === 'boolean' ? saved.muted : false;
    this._volume = typeof saved?.volume === 'number' && Number.isFinite(saved.volume) ? clamp(saved.volume, 0, 1) : .7;
    this._ambientVolume = typeof saved?.ambientVolume === 'number' && Number.isFinite(saved.ambientVolume) ? clamp(saved.ambientVolume, 0, 1) : .25;
    this._ctx = null;
    this._master = this._limiter = this._sfxBus = this._ambientBus = null;
    this._voices = new Set();
    this._buffers = new Map();
    this._seen = new Set();
    this._ambientVoice = null;
    this._ambientActive = false;
    this._biome = 0;
    this._paused = false;
    this._hidden = false;
    this._unlocked = false;
    this._unlocking = null;
    this._disposed = false;
    this._stats = { played: 0, dropped: 0, duplicates: 0, stolen: 0, maxVoicesSeen: 0, renderedBuffers: 0 };
  }
  get muted() { return this._muted; }
  set muted(value) { this.setMuted(value); }
  get volume() { return this._volume; }
  set volume(value) { this.setVolume(value); }
  get ambientVolume() { return this._ambientVolume; }
  set ambientVolume(value) { this.setAmbientVolume(value); }
  get unlocked() { return !this._disposed && this._unlocked && this._ctx?.state === 'running'; }

  /** Context construction/resume is synchronous until the first await: user-gesture safe. */
  async unlock() {
    if (this._disposed) return false;
    // Repeated gestures must retry resume even if an earlier non-gesture resume is pending.
    try {
      if (!this._ctx || this._ctx.state === 'closed') {
        this._ctx = this._factory();
        if (!this._ctx) return false;
        this._createGraph();
      }
      const context = this._ctx;
      const resuming = context.state === 'running' ? undefined : context.resume();
      this._unlocking = Promise.resolve(resuming).then(() => {
        if (this._disposed || this._ctx !== context) return false;
        this._unlocked = context.state === 'running';
        this._applyGains();
        this._syncAmbience();
        return this.unlocked;
      }).catch(() => { this._unlocked = this._ctx === context && context.state === 'running'; return this.unlocked; });
      return await this._unlocking;
    } catch {
      this._unlocked = false;
      return false;
    } finally {
      this._unlocking = null;
    }
  }
  _createGraph() {
    const context = this._ctx;
    this._master = context.createGain();
    this._sfxBus = context.createGain();
    this._ambientBus = context.createGain();
    this._limiter = context.createDynamicsCompressor();
    setParam(this._limiter.threshold, -9, context.currentTime);
    setParam(this._limiter.knee, 6, context.currentTime);
    setParam(this._limiter.ratio, 16, context.currentTime);
    setParam(this._limiter.attack, .002, context.currentTime);
    setParam(this._limiter.release, .12, context.currentTime);
    this._sfxBus.connect(this._limiter);
    this._ambientBus.connect(this._limiter);
    this._limiter.connect(this._master);
    this._master.connect(context.destination);
    this._applyGains();
  }
  _persist() {
    try { this._storage?.setItem(this._storageKey, JSON.stringify({ muted: this._muted, volume: this._volume, ambientVolume: this._ambientVolume })); } catch { /* private mode/quota */ }
  }
  _allowed() { return this.unlocked && !this._muted && !this._paused && !this._hidden; }
  _applyGains() {
    const time = this._ctx?.currentTime || 0;
    setParam(this._master?.gain, this._muted || this._paused || this._hidden || this._disposed ? 0 : 1, time);
    setParam(this._sfxBus?.gain, this._volume, time);
    setParam(this._ambientBus?.gain, this._ambientVolume, time);
  }
  setMuted(value) {
    this._muted = Boolean(value);
    this._persist();
    this._applyGains();
    if (this._muted) this._stopAll(); else this._syncAmbience();
    return this._muted;
  }
  setVolume(value) {
    this._volume = clamp(finite(value, this._volume), 0, 1);
    this._persist(); this._applyGains();
    if (!this._volume) for (const voice of [...this._voices]) if (!voice.loop) this._stopVoice(voice);
    return this._volume;
  }
  setAmbientVolume(value) {
    this._ambientVolume = clamp(finite(value, this._ambientVolume), 0, 1);
    this._persist(); this._applyGains(); this._syncAmbience();
    return this._ambientVolume;
  }
  setPaused(value) {
    this._paused = Boolean(value); this._applyGains();
    if (this._paused) this._stopAll(); else this._syncAmbience();
  }
  setHidden(value) {
    this._hidden = Boolean(value); this._applyGains();
    if (this._hidden) this._stopAll(); else this._syncAmbience();
  }
  setAmbientActive(value) { this._ambientActive = Boolean(value); this._syncAmbience(); }
  setBiome(index) {
    const next = clamp(Math.floor(finite(index, 0)), 0, BIOME_SPECS.length - 1);
    if (next !== this._biome) { this._biome = next; this._stopVoice(this._ambientVoice); }
    this._syncAmbience();
  }
  _buffer(key) {
    if (this._buffers.has(key)) return this._buffers.get(key);
    const rate = this._ctx.sampleRate;
    const pcm = key.startsWith('ambient:') ? renderAmbiencePCM(Number(key.slice(8)), rate) : renderSfxPCM(key, rate);
    const buffer = this._ctx.createBuffer(1, pcm.length, rate);
    if (buffer.copyToChannel) buffer.copyToChannel(pcm, 0); else buffer.getChannelData(0).set(pcm);
    this._buffers.set(key, buffer);
    this._stats.renderedBuffers++;
    return buffer;
  }
  _prune() {
    if (!this._ctx) return;
    for (const voice of this._voices) if (!voice.loop && voice.end <= this._ctx.currentTime) this._stopVoice(voice);
  }
  _stopVoice(voice) {
    if (!voice || !this._voices.has(voice)) return;
    this._voices.delete(voice);
    if (this._ambientVoice === voice) this._ambientVoice = null;
    voice.source.onended = null;
    try { voice.source.stop(); } catch { /* already ended */ }
    try { voice.source.disconnect(); } catch { /* already disconnected */ }
    try { voice.gain.disconnect(); } catch { /* already disconnected */ }
    try { voice.source.buffer = null; } catch { /* source still becomes collectable */ }
  }
  _stopAll() { for (const voice of [...this._voices]) this._stopVoice(voice); }
  _startVoice(buffer, { loop = false, gain = 1, rate = 1, event = null } = {}) {
    this._prune();
    while (this._voices.size >= MAX_VOICES) {
      const oldest = [...this._voices].find(v => !v.loop) || this._voices.values().next().value;
      this._stopVoice(oldest); this._stats.stolen++;
    }
    const source = this._ctx.createBufferSource();
    const gainNode = this._ctx.createGain();
    source.buffer = buffer; source.loop = loop;
    setParam(source.playbackRate, rate, this._ctx.currentTime);
    setParam(gainNode.gain, gain, this._ctx.currentTime);
    source.connect(gainNode);
    gainNode.connect(loop ? this._ambientBus : this._sfxBus);
    const voice = { source, gain: gainNode, loop, event, rate, start: this._ctx.currentTime,
      end: loop ? Infinity : this._ctx.currentTime + buffer.duration / rate };
    source.onended = () => this._stopVoice(voice);
    this._voices.add(voice);
    this._stats.maxVoicesSeen = Math.max(this._stats.maxVoicesSeen, this._voices.size);
    try { source.start(); } catch (error) { this._stopVoice(voice); throw error; }
    return voice;
  }
  play(event, { id, level = 0, intensity = 1 } = {}) {
    if (!SFX_SCORES[event] || !this._allowed() || this._volume <= 0) { this._stats.dropped++; return false; }
    // IDs are scoped to event type: target entity IDs may legitimately be reused by another effect.
    const key = id == null ? null : `${event}:${typeof id}:${String(id)}`;
    if (key && this._seen.has(key)) { this._stats.duplicates++; return false; }
    try {
      const rate = Math.pow(2, clamp(finite(level, 0), 0, 12) * .06 / 12);
      this._startVoice(this._buffer(event), { event, rate, gain: clamp(finite(intensity, 1), 0, 1.4) });
      if (key) {
        this._seen.add(key);
        if (this._seen.size > 512) this._seen.delete(this._seen.values().next().value);
      }
      this._stats.played++;
      return true;
    } catch { this._stats.dropped++; return false; }
  }
  _syncAmbience() {
    const shouldPlay = this._ambientActive && this._allowed() && this._ambientVolume > 0;
    if (!shouldPlay) { this._stopVoice(this._ambientVoice); return; }
    if (this._ambientVoice) return;
    try { this._ambientVoice = this._startVoice(this._buffer(`ambient:${this._biome}`), { loop: true }); } catch { /* audio is optional */ }
  }
  /** Optional convenience: explicit game events still belong in play(), never update(). */
  update(_dt, _time, { playing, level } = {}) {
    if (Number.isFinite(level)) this.setBiome(level);
    if (typeof playing === 'boolean') this.setAmbientActive(playing);
  }
  reset() {
    this._stopAll(); this._seen.clear(); this._ambientActive = false;
    // User settings and explicit paused/hidden state are intentionally preserved.
  }
  snapshot() {
    this._prune();
    const now = this._ctx?.currentTime || 0;
    const voices = [...this._voices];
    return {
      unlocked: this.unlocked, contextState: this._ctx?.state || (this._disposed ? 'disposed' : 'not-created'),
      muted: this._muted, volume: this._volume, ambientVolume: this._ambientVolume,
      paused: this._paused, hidden: this._hidden, ambientActive: this._ambientActive, biome: this._biome,
      voices: voices.length, sfxVoices: voices.filter(v => !v.loop).length,
      ambientLoops: voices.filter(v => v.loop).length,
      pendingNotes: voices.reduce((n, v) => n + (v.event ? SFX_SCORES[v.event].filter(note => v.start + note.at / v.rate > now).length : 0), 0),
      dedupEntries: this._seen.size, cachedBuffers: this._buffers.size, maxVoices: MAX_VOICES,
      masterGain: this._master?.gain.value ?? 0, sfxGain: this._sfxBus?.gain.value ?? 0,
      ambientGain: this._ambientBus?.gain.value ?? 0,
      disposed: this._disposed, ...this._stats,
    };
  }
  async dispose() {
    if (this._disposed) return;
    this._disposed = true; this._unlocked = false; this.reset(); this._applyGains();
    for (const node of [this._sfxBus, this._ambientBus, this._limiter, this._master]) {
      try { node?.disconnect(); } catch { /* already disconnected */ }
    }
    const context = this._ctx;
    this._ctx = this._master = this._limiter = this._sfxBus = this._ambientBus = null;
    this._buffers.clear();
    try { if (context && context.state !== 'closed') await context.close(); } catch { /* teardown still complete */ }
  }
}
