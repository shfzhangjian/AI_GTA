/**
 * AudioEngine —— 全部音效由 WebAudio 程序化合成，零素材文件。
 * 浏览器策略要求首次用户手势后才能出声：ensure() 会在按下/点击时懒初始化并 resume。
 */
class AudioEngine {
  constructor() {
    this.enabled = true;
    this.ctx = null;
    this.master = null;
    this._noiseBuf = null;
  }

  ensure() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.5;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return true;
  }

  /** 单音：频率可滑移，指数衰减包络 */
  _tone(freq, dur, { type = 'square', vol = .2, slide = 0, delay = 0 } = {}) {
    const t0 = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slide) osc.frequency.linearRampToValueAtTime(Math.max(freq + slide, 20), t0 + dur);
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(.001, t0 + dur);
    osc.connect(g).connect(this.master);
    osc.start(t0); osc.stop(t0 + dur + .02);
  }

  /** 噪声：经低通滤波扫频，用于破碎/爆炸 */
  _noise(dur, { freq0 = 4000, freq1 = 200, vol = .5, delay = 0 } = {}) {
    if (!this._noiseBuf) {
      const len = this.ctx.sampleRate;
      this._noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = this._noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    }
    const t0 = this.ctx.currentTime + delay;
    const src = this.ctx.createBufferSource();
    src.buffer = this._noiseBuf; src.loop = true;
    const f = this.ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.setValueAtTime(freq0, t0);
    f.frequency.exponentialRampToValueAtTime(Math.max(freq1, 20), t0 + dur);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(.001, t0 + dur);
    src.connect(f).connect(g).connect(this.master);
    src.start(t0); src.stop(t0 + dur + .02);
  }

  /** 统一入口：audio.play('explosion') */
  play(name, opt = {}) {
    if (!this.enabled || !this.ensure()) return;
    switch (name) {
      case 'bounce':  this._tone(240 + Math.random() * 60, .05, { type: 'square', vol: .1 }); break;
      case 'paddle':  this._tone(190, .07, { type: 'triangle', vol: .18, slide: 60 }); break;
      case 'glass':   this._noise(.16, { freq0: 7000, freq1: 2600, vol: .3 });
                      this._tone(2100, .09, { type: 'sine', vol: .1, slide: -500 }); break;
      case 'ice':     this._noise(.14, { freq0: 5200, freq1: 1800, vol: .26 });
                      this._tone(1400, .1, { type: 'sine', vol: .1, slide: 300 }); break;
      case 'thud':    this._tone(110, .13, { type: 'triangle', vol: .26, slide: -50 });
                      this._noise(.09, { freq0: 800, freq1: 120, vol: .18 }); break;
      case 'wood':    this._tone(190, .09, { type: 'triangle', vol: .3, slide: -70 }); break;
      case 'metal':   this._tone(520, .16, { type: 'square', vol: .12, slide: 40 });
                      this._tone(780, .12, { type: 'square', vol: .08, delay: .03 }); break;
      case 'gold':    [880, 1174, 1568].forEach((f, i) =>
                        this._tone(f, .12, { type: 'sine', vol: .12, delay: i * .06 })); break;
      case 'explosion':
                      this._noise(.6, { freq0: 900, freq1: 45, vol: .9 });   // 主爆轰
                      this._tone(70, .5, { type: 'sine', vol: .5, slide: -35 }); // 低频轰鸣
                      break;
      case 'launch':  this._tone(300, .12, { type: 'square', vol: .14, slide: 380 }); break;
      case 'lose':    this._tone(320, .5, { type: 'sawtooth', vol: .2, slide: -250 }); break;
      case 'clear':   [523, 659, 784, 1046].forEach((f, i) =>
                        this._tone(f, .18, { type: 'triangle', vol: .16, delay: i * .12 })); break;
      case 'gameover': [392, 330, 262, 196].forEach((f, i) =>
                        this._tone(f, .3, { type: 'sawtooth', vol: .14, delay: i * .18 })); break;
    }
  }
}

export const audio = new AudioEngine();
