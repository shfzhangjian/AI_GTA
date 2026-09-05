/**
 * Sfx —— WebAudio 程序化音效（零音频素材，全部实时合成）。
 * AudioContext 需在用户手势后创建；无音频环境自动静默降级。
 */
export class Sfx {
  constructor() {
    this.ctx = null;
    this.master = null;
    this._noise = null;
    this.disabled = false;
  }

  /** 惰性初始化（首次交互时调用）；失败则永久静默，不影响游戏 */
  ensure() {
    if (this.ctx || this.disabled) return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.5;
      this.master.connect(this.ctx.destination);
      if (this.ctx.state === 'suspended') this.ctx.resume();
    } catch {
      this.disabled = true;
    }
  }

  _t() { return this.ctx.currentTime; }

  /** 共享白噪声缓冲 */
  _noiseBuf() {
    if (!this._noise) {
      const len = this.ctx.sampleRate * 2;
      this._noise = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = this._noise.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    }
    return this._noise;
  }

  _src(dur) {
    const s = this.ctx.createBufferSource();
    s.buffer = this._noiseBuf();
    s.loop = true;
    s.playbackRate.value = 1 + Math.random() * 0.2;
    s.start(this._t());
    s.stop(this._t() + dur);
    return s;
  }

  /** 包络增益：attack a 秒起、decay d 秒指数衰减到 0 */
  _env(peak, a, d) {
    const g = this.ctx.createGain();
    const t0 = this._t();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(peak, t0 + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + a + d);
    g.connect(this.master);
    return g;
  }

  _osc(type, f0, f1, dur, peak) {
    const o = this.ctx.createOscillator();
    o.type = type;
    const t0 = this._t();
    o.frequency.setValueAtTime(f0, t0);
    o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t0 + dur);
    const g = this._env(peak, 0.005, dur);
    o.connect(g);
    o.start(t0);
    o.stop(t0 + dur + 0.05);
  }

  _noiseHit(dur, peak, filtType, f0, f1) {
    const n = this._src(dur + 0.05);
    const f = this.ctx.createBiquadFilter();
    f.type = filtType;
    const t0 = this._t();
    f.frequency.setValueAtTime(f0, t0);
    f.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t0 + dur);
    const g = this._env(peak, 0.004, dur);
    n.connect(f); f.connect(g);
  }

  /* ---------------- 具体音效 ---------------- */

  /** 切枪：两声机械咔哒 */
  weaponSwitch() {
    if (!this.ctx) return; // 未初始化或环境不支持 -> 静默
    this._osc('square', 1400, 900, 0.04, 0.12);
    setTimeout(() => this.ctx && this._osc('square', 800, 500, 0.05, 0.1), 60);
  }

  reload() {
    if (!this.ctx) return; // 未初始化或环境不支持 -> 静默
    this._osc('square', 300, 180, 0.05, 0.14);
    setTimeout(() => this.ctx && this._noiseHit(0.05, 0.12, 'bandpass', 2400, 1600), 180);
    setTimeout(() => this.ctx && this._osc('square', 500, 900, 0.04, 0.12), 380);
  }

  hammerSwing() { if (this.ctx) this._noiseHit(0.14, 0.25, 'bandpass', 700, 260); }
  hammerHit() {
    if (!this.ctx) return; // 未初始化或环境不支持 -> 静默
    this._osc('sine', 120, 45, 0.2, 0.6);
    this._noiseHit(0.06, 0.3, 'lowpass', 500, 120);
  }

  smgShot() {
    if (!this.ctx) return; // 未初始化或环境不支持 -> 静默
    const p = 0.9 + Math.random() * 0.2;
    this._osc('square', 190 * p, 60, 0.07, 0.34);
    this._noiseHit(0.05, 0.3, 'highpass', 2200, 900);
  }

  sniperShot() {
    if (!this.ctx) return; // 未初始化或环境不支持 -> 静默
    // 低频爆音 + 高频撕裂 + 回声尾
    this._osc('sine', 75, 28, 0.5, 0.75);
    this._noiseHit(0.35, 0.45, 'lowpass', 3200, 180);
    const t = this.ctx;
    const n = t.createBufferSource();
    n.buffer = this._noiseBuf();
    n.loop = true;
    n.start(t.currentTime);
    n.stop(t.currentTime + 1.2);
    const f = t.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 1400;
    const delay = t.createDelay(0.5);
    delay.delayTime.value = 0.16;
    const fb = t.createGain(); fb.gain.value = 0.32;
    const wet = t.createGain(); wet.gain.value = 0.2;
    n.connect(f); f.connect(delay); delay.connect(fb); fb.connect(delay);
    delay.connect(wet); wet.connect(this.master);
  }

  rocketLaunch() {
    if (!this.ctx) return; // 未初始化或环境不支持 -> 静默
    this._osc('sine', 95, 40, 0.4, 0.5);
    this._noiseHit(0.6, 0.4, 'bandpass', 350, 1600); // 上升呼啸
  }

  /** 爆炸：按玩家距离衰减 */
  explosion(dist) {
    if (!this.ctx) return; // 未初始化或环境不支持 -> 静默
    const vol = Math.max(0.08, Math.min(1, 1 - dist / 70));
    this._osc('sine', 62, 24, 0.9, 0.9 * vol);
    this._noiseHit(1.3, 0.75 * vol, 'lowpass', 5200, 70);
    // 碎石噼啪
    for (let i = 0; i < 4; i++) {
      const dt = 80 + Math.random() * 500;
      setTimeout(() => this.ctx && this._noiseHit(0.04, 0.12 * vol, 'highpass', 3000, 2200), dt);
    }
    // 尾回声
    const delay = this.ctx.createDelay(1);
    delay.delayTime.value = 0.25;
    const fb = this.ctx.createGain(); fb.gain.value = 0.3;
    const wet = this.ctx.createGain(); wet.gain.value = 0.18 * vol;
    const n = this._src(1.6);
    const f = this.ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 900;
    n.connect(f); f.connect(delay); delay.connect(fb); fb.connect(delay);
    delay.connect(wet); wet.connect(this.master);
  }

  /** 命中提示音 */
  tick() { if (this.ctx) this._osc('square', 1900, 1500, 0.03, 0.12); }

  scopeIn() { if (this.ctx) this._osc('sine', 900, 1600, 0.08, 0.1); }

  /** 警察手枪：短促中频爆音 */
  pistolShot() {
    if (!this.ctx) return;
    const p = 0.9 + Math.random() * 0.2;
    this._osc('square', 150 * p, 55, 0.09, 0.3);
    this._noiseHit(0.06, 0.26, 'bandpass', 1600, 500);
  }

  /** 玩家中弹：闷响 + 高频耳鸣 */
  playerHit() {
    if (!this.ctx) return;
    this._osc('sine', 140, 50, 0.25, 0.55);
    this._noiseHit(0.08, 0.3, 'lowpass', 700, 150);
    this._osc('sine', 5200, 4300, 1.0, 0.05); // 耳鸣余韵
  }

  /** 警笛：锯齿波被 3.4Hz LFO 调制出“哇——呜——”连绵音，持续直到 sirenStop */
  sirenStart() {
    if (!this.ctx || this._siren) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = 720;
    const lfo = this.ctx.createOscillator();
    lfo.frequency.value = 3.4;
    const lfoAmt = this.ctx.createGain();
    lfoAmt.gain.value = 190;
    lfo.connect(lfoAmt); lfoAmt.connect(osc.frequency);
    const f = this.ctx.createBiquadFilter();
    f.type = 'lowpass'; f.frequency.value = 1600;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.075, t + 0.4); // 由远及近渐强入场
    osc.connect(f); f.connect(g); g.connect(this.master);
    osc.start(t); lfo.start(t);
    this._siren = { osc, lfo, g };
  }

  sirenStop() {
    if (!this._siren) return;
    const t = this.ctx.currentTime;
    const { osc, lfo, g } = this._siren;
    g.gain.setTargetAtTime(0.0001, t, 0.25);
    osc.stop(t + 1); lfo.stop(t + 1);
    this._siren = null;
  }
}
