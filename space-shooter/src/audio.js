// Procedural sound engine (WebAudio) — shot / hit / explosion / powerup / drone.
// All sounds are synthesised, no audio files needed.

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.sfxBus = null;
    this.musicBus = null;
    this.noise = null;
    this.enabled = true;
    this.started = false;
  }

  // Must be called from a user gesture.
  init() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) { this.enabled = false; return; }
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.9;
    this.master.connect(this.ctx.destination);

    this.sfxBus = this.ctx.createGain();
    this.sfxBus.gain.value = 0.55;
    this.sfxBus.connect(this.master);

    this.musicBus = this.ctx.createGain();
    this.musicBus.gain.value = 0.16;
    this.musicBus.connect(this.master);

    // white-noise buffer, reused by every noise-based sound
    const len = Math.floor(this.ctx.sampleRate * 1.2);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this.noise = buf;

    this._startDrone();
    this.started = true;
  }

  resume() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); }

  get t() { return this.ctx.currentTime; }

  setMuted(m) {
    if (!this.master) return;
    this.master.gain.setTargetAtTime(m ? 0 : 0.9, this.ctx.currentTime, 0.02);
  }

  _noiseSource(dur) {
    const s = this.ctx.createBufferSource();
    s.buffer = this.noise;
    s.loop = true;
    s.playbackRate.value = 1;
    s.start(this.t);
    s.stop(this.t + dur);
    return s;
  }

  // ---- shooting: short bright zap, slight random detune for variety
  shoot(kind = 'vulcan') {
    if (!this.ctx || !this.enabled) return;
    const t = this.t;
    const g = this.ctx.createGain();
    const hp = this.ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = kind === 'plasma' ? 320 : 900;

    if (kind === 'plasma') {
      const o = this.ctx.createOscillator();
      o.type = 'triangle';
      o.frequency.setValueAtTime(1400, t);
      o.frequency.exponentialRampToValueAtTime(320, t + 0.13);
      const n = this._noiseSource(0.06);
      const ng = this.ctx.createGain();
      ng.gain.setValueAtTime(0.12, t);
      ng.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
      o.connect(g); n.connect(ng).connect(g);
      o.start(t); o.stop(t + 0.14);
    } else {
      const o = this.ctx.createOscillator();
      o.type = 'square';
      const f = 1250 + Math.random() * 180;
      o.frequency.setValueAtTime(f, t);
      o.frequency.exponentialRampToValueAtTime(190, t + 0.07);
      const n = this._noiseSource(0.05);
      const ng = this.ctx.createGain();
      ng.gain.setValueAtTime(0.2, t);
      ng.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
      o.connect(g); n.connect(ng).connect(g);
      o.start(t); o.stop(t + 0.08);
    }
    g.gain.setValueAtTime(kind === 'plasma' ? 0.22 : 0.14, t);
    g.gain.exponentialRampToValueAtTime(0.0008, t + (kind === 'plasma' ? 0.15 : 0.08));
    g.connect(hp).connect(this.sfxBus);
  }

  // ---- hit: metallic tick + noise burst, pitched by intensity
  hit(intensity = 1) {
    if (!this.ctx || !this.enabled) return;
    const t = this.t;
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 2400 + intensity * 900;
    bp.Q.value = 1.4;
    const n = this._noiseSource(0.09);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.3 * intensity, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
    n.connect(bp).connect(g).connect(this.sfxBus);

    const o = this.ctx.createOscillator();
    o.type = 'square';
    o.frequency.setValueAtTime(680 + intensity * 240, t);
    o.frequency.exponentialRampToValueAtTime(180, t + 0.05);
    const og = this.ctx.createGain();
    og.gain.setValueAtTime(0.09, t);
    og.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
    o.connect(og).connect(this.sfxBus);
    o.start(t); o.stop(t + 0.07);
  }

  // ---- explosion: filtered noise thump + falling tone + rumble tail
  explode(size = 1) {
    if (!this.ctx || !this.enabled) return;
    const t = this.t;
    const dur = 0.28 + size * 0.45;

    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(3600, t);
    lp.frequency.exponentialRampToValueAtTime(180, t + dur);
    lp.Q.value = 0.9;

    const n = this._noiseSource(dur + 0.15);
    const ng = this.ctx.createGain();
    ng.gain.setValueAtTime(0.0001, t);
    ng.gain.exponentialRampToValueAtTime(0.6 * size, t + 0.012);
    ng.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    n.connect(lp).connect(ng).connect(this.sfxBus);

    const sub = this.ctx.createOscillator();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(150 * (2 - size), t);
    sub.frequency.exponentialRampToValueAtTime(38, t + dur * 0.8);
    const sg = this.ctx.createGain();
    sg.gain.setValueAtTime(0.5 * size, t);
    sg.gain.exponentialRampToValueAtTime(0.001, t + dur * 0.9);
    sub.connect(sg).connect(this.sfxBus);
    sub.start(t); sub.stop(t + dur);

    // crackle transient
    const cr = this._noiseSource(0.05);
    const hp = this.ctx.createBiquadFilter();
    hp.type = 'highpass'; hp.frequency.value = 3200;
    const cg = this.ctx.createGain();
    cg.gain.setValueAtTime(0.28 * size, t);
    cg.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    cr.connect(hp).connect(cg).connect(this.sfxBus);
  }

  // ---- player damage: harsh descending buzz
  hurt() {
    if (!this.ctx || !this.enabled) return;
    const t = this.t;
    const o = this.ctx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(240, t);
    o.frequency.exponentialRampToValueAtTime(60, t + 0.35);
    const dist = this.ctx.createWaveShaper();
    dist.curve = this._curve(18);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.3, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    o.connect(dist).connect(g).connect(this.sfxBus);
    o.start(t); o.stop(t + 0.42);

    const n = this._noiseSource(0.2);
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = 700; bp.Q.value = 0.7;
    const ng = this.ctx.createGain();
    ng.gain.setValueAtTime(0.25, t);
    ng.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    n.connect(bp).connect(ng).connect(this.sfxBus);
  }

  // ---- powerup / wave jingle
  fanfare(up = true) {
    if (!this.ctx || !this.enabled) return;
    const t0 = this.t;
    const notes = up ? [523.25, 659.25, 783.99, 1046.5] : [392, 311.13, 233.08];
    notes.forEach((f, i) => {
      const o = this.ctx.createOscillator();
      o.type = up ? 'triangle' : 'sawtooth';
      const t = t0 + i * 0.075;
      o.frequency.setValueAtTime(f, t);
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.2, t + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0008, t + 0.26);
      o.connect(g).connect(this.sfxBus);
      o.start(t); o.stop(t + 0.3);
    });
  }

  _curve(k) {
    const n = 1024, c = new Float32Array(n);
    for (let i = 0; i < n; i++) { const x = (i * 2) / n - 1; c[i] = ((3 + k) * x * 20 * (Math.PI / 180)) / (Math.PI + k * Math.abs(x)); }
    return c;
  }

  // ---- ambient engine drone: continuous bed, intensity follows game state
  _startDrone() {
    const ctx = this.ctx;
    this.droneGain = ctx.createGain();
    this.droneGain.gain.value = 0.0;
    this.droneGain.connect(this.musicBus);

    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 420;
    lp.Q.value = 3;
    lp.connect(this.droneGain);

    for (const det of [-6, 5, 0]) {
      const o = ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = 55;
      o.detune.value = det;
      const g = ctx.createGain();
      g.gain.value = 0.28;
      o.connect(g).connect(lp);
      o.start();
    }

    // slow LFO on filter for movement
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.13;
    const lg = ctx.createGain();
    lg.gain.value = 180;
    lfo.connect(lg).connect(lp.frequency);
    lfo.start();

    // pad chord, very quiet
    const padGain = ctx.createGain();
    padGain.gain.value = 0.05;
    padGain.connect(this.musicBus);
    [110, 164.81, 220].forEach((f, i) => {
      const o = ctx.createOscillator();
      o.type = 'triangle';
      o.frequency.value = f;
      o.detune.value = (i - 1) * 7;
      const g = ctx.createGain();
      g.gain.value = 0.3;
      o.connect(g).connect(padGain);
      o.start();
    });
    this.padGain = padGain;

    // arpeggio sequencer (5th-scale pulses) for momentum
    this.seqStep = 0;
    const scale = [220, 261.63, 329.63, 392, 440, 523.25];
    this.seqTimer = setInterval(() => {
      if (!this.ctx || !this.enabled) return;
      const t = this.ctx.currentTime;
      const o = this.ctx.createOscillator();
      o.type = 'square';
      const s = this.scaleIntensity || 0;
      const f = scale[(this.seqStep * 3 + (this.seqStep % 2)) % scale.length] * (s > 0.5 ? 1 : 0.5);
      o.frequency.setValueAtTime(f, t);
      const bp = this.ctx.createBiquadFilter();
      bp.type = 'bandpass'; bp.frequency.value = f * 2.4; bp.Q.value = 4;
      const g = this.ctx.createGain();
      const amp = 0.035 + s * 0.05;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(amp, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0006, t + 0.16);
      o.connect(bp).connect(g).connect(this.musicBus);
      o.start(t); o.stop(t + 0.2);
      this.seqStep++;
    }, 150);

    // heartbeat kick when intensity high
    this.kickTimer = setInterval(() => {
      if (!this.ctx || !this.enabled || (this.scaleIntensity || 0) < 0.45) return;
      const t = this.ctx.currentTime;
      const o = this.ctx.createOscillator();
      o.type = 'sine';
      o.frequency.setValueAtTime(120, t);
      o.frequency.exponentialRampToValueAtTime(45, t + 0.16);
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.34, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      o.connect(g).connect(this.musicBus);
      o.start(t); o.stop(t + 0.22);
    }, 500);
  }

  // intensity 0..1 — how "hot" the current situation is
  setIntensity(v) {
    this.scaleIntensity = v;
    if (!this.ctx || !this.droneGain) return;
    this.droneGain.gain.setTargetAtTime(0.05 + v * 0.3, this.ctx.currentTime, 0.4);
  }

  silence() {
    if (this.ctx) this.setIntensity(0);
  }
}
