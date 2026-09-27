/**
 * AudioFx.js — 程序化音效（WebAudio 合成，零资产文件、可离线）
 *
 * 用户要求：增加音效。全部用振荡器/噪声合成，无 mp3：
 *   · 海浪环境声（低通噪声慢涌，常开）
 *   · 海鸥鸣叫（随机啁啾）
 *   · 开炮 / 炮弹呼啸 / 命中爆炸（海战）
 *   · 登船 / 下船脚步叮
 *   · 修理叮当
 *   · 海盗旗飘动（低频抖噪，战斗时）
 *
 * 浏览器自动播放策略：AudioContext 必须等首次用户手势才能 start ——
 * main.js 里 `document.addEventListener('pointerdown', audio.resume)` 一次解锁。
 */
export class AudioFx {
  constructor(opts = {}) {
    this.enabled = true;
    this.masterVolume = opts.volume ?? 0.5;
    this.unlocked = false;
    this.ctx = null;
    this.master = null;
    this.ambientGain = null;
    this._sea = null;
    this._gullTimer = null;
  }

  /** 首次用户手势调用（pointerdown）。可重复调。 */
  resume() {
    if (!this.enabled) return;
    if (!this.ctx) this._init();
    if (this.ctx.state === 'suspended') this.ctx.resume();
    if (this.unlocked) return;
    this.unlocked = true;
    this._startSea();
    this._scheduleGull();
  }

  _init() {
    const AC = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.masterVolume;
    this.master.connect(this.ctx.destination);
    this.ambientGain = this.ctx.createGain();
    this.ambientGain.gain.value = 0.34;
    this.ambientGain.connect(this.master);
  }

  /** 常开海浪：粉噪 → 低通 → 慢 LFO 起伏 */
  _startSea() {
    if (!this.ctx || this._sea) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;
    const dur = 4;
    const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < d.length; i++) {          // 粉噪近似
      const w = Math.random() * 2 - 1;
      last = (last + 0.02 * w) / 1.02;
      d[i] = last * 3.2;
    }
    const src = ctx.createBufferSource();
    src.buffer = buf; src.loop = true;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 480;
    const swell = ctx.createGain(); swell.gain.value = 0.5;
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.09;
    const lfoGain = ctx.createGain(); lfoGain.gain.value = 0.4;
    lfo.connect(lfoGain).connect(swell.gain);
    src.connect(lp).connect(swell).connect(this.ambientGain);
    src.start(t); lfo.start(t);
    this._sea = { src, lfo };
  }

  /** 海鸥：随机 8~25s 一声双啁啾 */
  _scheduleGull() {
    if (!this.enabled) return;
    const next = 8000 + Math.random() * 17000;
    this._gullTimer = setTimeout(() => { this._gullOnce(); this._scheduleGull(); }, next);
  }

  _gullOnce() {
    if (!this.ctx || this.ctx.state !== 'running') return;
    const ctx = this.ctx, t = ctx.currentTime;
    for (let i = 0; i < 2; i++) {
      const o = ctx.createOscillator(); o.type = 'sawtooth';
      const g = ctx.createGain();
      const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2400; bp.Q.value = 4;
      const f0 = 2100 + Math.random() * 900;
      o.frequency.setValueAtTime(f0, t + i * 0.22);
      o.frequency.exponentialRampToValueAtTime(f0 * 0.62, t + i * 0.22 + 0.16);
      g.gain.setValueAtTime(0.0001, t + i * 0.22);
      g.gain.exponentialRampToValueAtTime(0.12, t + i * 0.22 + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.22 + 0.2);
      o.connect(bp).connect(g).connect(this.master);
      o.start(t + i * 0.22); o.stop(t + i * 0.22 + 0.24);
    }
  }

  /** 开炮：低频砰 + 噪声爆 */
  cannon() { this._noiseHit(0.9, 180, 0.5, 'lowpass', 700, 0.16); this._tone('square', 62, 38, 0.22, 0.5); }

  /** 炮弹呼啸（掠过）：带通噪声上扫 */
  cannonWhiz() {
    if (!this.ctx || !this.unlocked) return;
    const ctx = this.ctx, t = ctx.currentTime;
    const nb = this._noiseBuffer(0.45);
    const src = ctx.createBufferSource(); src.buffer = nb;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 8;
    bp.frequency.setValueAtTime(900, t); bp.frequency.exponentialRampToValueAtTime(2600, t + 0.4);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.16, t + 0.08);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.42);
    src.connect(bp).connect(g).connect(this.master); src.start(t);
  }

  /** 命中爆炸：砰 + 嘶 */
  explosion() {
    this._noiseHit(1.1, 120, 0.85, 'lowpass', 900, 0.5);
    const ctx = this.ctx; if (!ctx || !this.unlocked) return;
    const t = ctx.currentTime;
    const nb = this._noiseBuffer(0.7);
    const src = ctx.createBufferSource(); src.buffer = nb;
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 3000;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.28, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
    src.connect(hp).connect(g).connect(this.master); src.start(t);
  }

  /** 修理叮当：两记金属脆响 */
  repairPing() {
    if (!this.ctx || !this.unlocked) return;
    const ctx = this.ctx, t = ctx.currentTime;
    [0, 0.14].forEach((dt, i) => {
      const o = ctx.createOscillator(); o.type = 'sine';
      const f = i ? 1560 : 1320;
      o.frequency.setValueAtTime(f, t + dt);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.14, t + dt); g.gain.exponentialRampToValueAtTime(0.0001, t + dt + 0.12);
      o.connect(g).connect(this.master); o.start(t + dt); o.stop(t + dt + 0.14);
    });
  }

  /** 上/下船：木质脚步（两声低嗒） */
  footstep(up) {
    if (!this.ctx || !this.unlocked) return;
    const ctx = this.ctx, t = ctx.currentTime;
    [0, 0.13].forEach((dt, i) => {
      const o = ctx.createOscillator(); o.type = 'triangle';
      o.frequency.setValueAtTime(up ? 320 - i * 40 : 260 + i * 40, t + dt);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.09, t + dt); g.gain.exponentialRampToValueAtTime(0.0001, t + dt + 0.07);
      o.connect(g).connect(this.master); o.start(t + dt); o.stop(t + dt + 0.09);
    });
  }

  /** 通用噪声冲击（爆炸/炮声复用） */
  _noiseHit(dur, lowHz, peak, type, cut, q) {
    if (!this.ctx || !this.unlocked) return;
    const ctx = this.ctx, t = ctx.currentTime;
    const nb = this._noiseBuffer(dur);
    const src = ctx.createBufferSource(); src.buffer = nb;
    const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = cut; if (q) f.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(peak, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(this.master); src.start(t);
    void lowHz;
  }

  /** 简短正弦/方音（砰低音） */
  _tone(type, f0, f1, dur, peak) {
    if (!this.ctx || !this.unlocked) return;
    const ctx = this.ctx, t = ctx.currentTime;
    const o = ctx.createOscillator(); o.type = type;
    o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(peak, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.master); o.start(t); o.stop(t + dur + 0.02);
  }

  _noiseBuffer(dur) {
    const ctx = this.ctx;
    const buf = ctx.createBuffer(1, Math.max(1, Math.floor(ctx.sampleRate * dur)), ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }

  summary() { return { unlocked: this.unlocked, enabled: this.enabled }; }

  clear() {
    if (this._gullTimer) clearTimeout(this._gullTimer);
    this._gullTimer = null;
    if (this._sea) { try { this._sea.src.stop(); this._sea.lfo.stop(); } catch (e) { /* 已停 */ } this._sea = null; }
  }
}
