/* ============================================================
   sound.js — 程序化合成音效（WebAudio，无需任何音频文件）
   球碰撞 / 库边 / 落袋 / 球杆击球 /  UI 音 / 环境噪声
   ============================================================ */
export class Sound {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.master = null;
    this._lastHit = 0;      // 节流，避免同帧大量爆音
    this._noiseBuf = null;
  }

  /* 必须在用户手势里调用一次 */
  resume() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.9;
      // 轻压缩，防止多球连环碰撞削顶
      const comp = this.ctx.createDynamicsCompressor();
      comp.threshold.value = -18;
      comp.ratio.value = 6;
      this.master.connect(comp).connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  setMuted(m) {
    this.muted = m;
    if (this.master) this.master.gain.value = m ? 0 : 0.9;
  }

  get t() { return this.ctx.currentTime; }

  _whiteNoise() {
    if (this._noiseBuf) return this._noiseBuf;
    const len = this.ctx.sampleRate * 0.5;
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this._noiseBuf = buf;
    return buf;
  }

  /* ---------- 球-球碰撞：短促"嗒" ---------- */
  ballHit(v) {
    if (!this.ctx || this.muted) return;
    const now = this.t;
    if (now - this._lastHit < 0.018) return;
    this._lastHit = now;
    const g = Math.min(1, Math.max(0.08, v / 4));
    const out = this.ctx.createGain();
    out.gain.value = 0.5 * g;
    out.connect(this.master);

    // 高频"哒"：正弦快速下滑
    const o = this.ctx.createOscillator();
    o.type = 'sine';
    const f0 = 1400 + 900 * g + Math.random() * 300;
    o.frequency.setValueAtTime(f0, now);
    o.frequency.exponentialRampToValueAtTime(f0 * 0.45, now + 0.05);
    const og = this.ctx.createGain();
    og.gain.setValueAtTime(0.9 * g, now);
    og.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    o.connect(og).connect(out);
    o.start(now); o.stop(now + 0.08);

    // 瞬态"咔"：滤波噪声
    const n = this.ctx.createBufferSource();
    n.buffer = this._whiteNoise();
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = 3200; bp.Q.value = 1.2;
    const ng = this.ctx.createGain();
    ng.gain.setValueAtTime(0.8 * g, now);
    ng.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
    n.connect(bp).connect(ng).connect(out);
    n.start(now); n.stop(now + 0.05);
  }

  /* ---------- 撞库边：闷响 ---------- */
  cushion(v) {
    if (!this.ctx || this.muted) return;
    const now = this.t;
    if (now - this._lastHit < 0.02) return;
    this._lastHit = now;
    const g = Math.min(1, Math.max(0.1, v / 5));
    const n = this.ctx.createBufferSource();
    n.buffer = this._whiteNoise();
    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.setValueAtTime(700, now);
    lp.frequency.exponentialRampToValueAtTime(180, now + 0.08);
    const ng = this.ctx.createGain();
    ng.gain.setValueAtTime(0.5 * g, now);
    ng.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    n.connect(lp).connect(ng).connect(this.master);
    n.start(now); n.stop(now + 0.12);
  }

  /* ---------- 击球（球杆撞母球）：干脆的一声 ---------- */
  cueStrike(power) {
    if (!this.ctx || this.muted) return;
    const now = this.t;
    const g = 0.4 + 0.6 * Math.min(1, power);
    const o = this.ctx.createOscillator();
    o.type = 'triangle';
    o.frequency.setValueAtTime(950, now);
    o.frequency.exponentialRampToValueAtTime(240, now + 0.05);
    const og = this.ctx.createGain();
    og.gain.setValueAtTime(0.9 * g, now);
    og.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
    o.connect(og).connect(this.master);
    o.start(now); o.stop(now + 0.09);

    const n = this.ctx.createBufferSource();
    n.buffer = this._whiteNoise();
    const hp = this.ctx.createBiquadFilter();
    hp.type = 'highpass'; hp.frequency.value = 2000;
    const ng = this.ctx.createGain();
    ng.gain.setValueAtTime(0.5 * g, now);
    ng.gain.exponentialRampToValueAtTime(0.001, now + 0.025);
    n.connect(hp).connect(ng).connect(this.master);
    n.start(now); n.stop(now + 0.04);
  }

  /* ---------- 落袋：滑进 + 咚 ---------- */
  pocket() {
    if (!this.ctx || this.muted) return;
    const now = this.t;
    // 下滑"嗖"
    const o = this.ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(620, now);
    o.frequency.exponentialRampToValueAtTime(160, now + 0.18);
    const og = this.ctx.createGain();
    og.gain.setValueAtTime(0.28, now);
    og.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    o.connect(og).connect(this.master);
    o.start(now); o.stop(now + 0.22);
    // 兜底"咚"
    const k = this.ctx.createOscillator();
    k.type = 'sine';
    k.frequency.setValueAtTime(95, now + 0.14);
    const kg = this.ctx.createGain();
    kg.gain.setValueAtTime(0.5, now + 0.14);
    kg.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
    k.connect(kg).connect(this.master);
    k.start(now + 0.14); k.stop(now + 0.34);
    // 摩擦沙沙
    const n = this.ctx.createBufferSource();
    n.buffer = this._whiteNoise();
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = 900; bp.Q.value = 0.7;
    const ng = this.ctx.createGain();
    ng.gain.setValueAtTime(0.16, now);
    ng.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
    n.connect(bp).connect(ng).connect(this.master);
    n.start(now); n.stop(now + 0.18);
  }

  /* ---------- 犯规（母球落袋）：警示两连音 ---------- */
  foul() {
    if (!this.ctx || this.muted) return;
    const now = this.t;
    [0, 0.14].forEach((d, i) => {
      const o = this.ctx.createOscillator();
      o.type = 'square';
      o.frequency.value = i ? 220 : 330;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.0001, now + d);
      g.gain.exponentialRampToValueAtTime(0.12, now + d + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, now + d + 0.11);
      o.connect(g).connect(this.master);
      o.start(now + d); o.stop(now + d + 0.12);
    });
  }

  /* ---------- UI 点击 ---------- */
  click() {
    if (!this.ctx || this.muted) return;
    const now = this.t;
    const o = this.ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(880, now);
    o.frequency.exponentialRampToValueAtTime(660, now + 0.05);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.18, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    o.connect(g).connect(this.master);
    o.start(now); o.stop(now + 0.07);
  }

  /* ---------- 开球环境 noise（观众嗡嗡 + 灯光嗡） ---------- */
  ambience() {
    if (!this.ctx || this.muted || this._amb) return;
    const now = this.t;
    const src = this.ctx.createBufferSource();
    src.buffer = this._whiteNoise();
    src.loop = true;
    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 320;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.linearRampToValueAtTime(0.02, now + 1.5);
    src.connect(lp).connect(g).connect(this.master);
    src.start(now);
    this._amb = { src, g };
  }

  /* ---------- 胜利和弦 ---------- */
  fanfare(win) {
    if (!this.ctx || this.muted) return;
    const now = this.t;
    const notes = win ? [523.25, 659.25, 783.99, 1046.5] : [415.3, 349.23, 277.18];
    notes.forEach((f, i) => {
      const t = now + i * 0.13;
      const o = this.ctx.createOscillator();
      o.type = 'triangle';
      o.frequency.value = f;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.2, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
      o.connect(g).connect(this.master);
      o.start(t); o.stop(t + 0.55);
    });
  }
}
