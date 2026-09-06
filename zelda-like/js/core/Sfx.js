// 音效系统：全部用 Web Audio API 程序化合成，无需外部音频文件
// 后续可在 assets/audio 放置真实文件并在这里替换实现
export class Sfx {
  constructor() {
    this.ctx = null;
    this.musicNodes = [];
    this.musicTimer = null;
    this.enabled = true;
  }

  _ensure() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  // 基础：播放一段包络音符（带异常保护，音频故障不阻断游戏逻辑）
  _tone({ freq = 440, type = 'sine', dur = 0.2, vol = 0.2, slide = 0, delay = 0 }) {
    if (!this.enabled) return;
    try {
      this._ensure();
      const t0 = this.ctx.currentTime + delay;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t0);
      if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t0 + dur);
      gain.gain.setValueAtTime(vol, t0);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
      osc.connect(gain).connect(this.ctx.destination);
      osc.start(t0);
      osc.stop(t0 + dur + 0.05);
    } catch (e) { this.enabled = false; console.warn('[sfx] tone failed, audio disabled:', e.message); }
  }

  // 噪声（用于挥砍/脚步等）
  _noise({ dur = 0.15, vol = 0.15, freq = 1000, delay = 0 }) {
    if (!this.enabled) return;
    try {
      this._ensure();
      const t0 = this.ctx.currentTime + delay;
      const len = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
      const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = freq;
      filter.Q.value = 1;
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(vol, t0);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
      src.connect(filter).connect(gain).connect(this.ctx.destination);
      src.start(t0);
    } catch (e) { this.enabled = false; console.warn('[sfx] noise failed, audio disabled:', e.message); }
  }

  // 命名音效（hit/swing 接收武器 id 区分音色）；整体保护，任何音频异常都不允许打断游戏循环
  play(name, weapon = '') {
    if (!this.enabled) return;
    try { this._play(name, weapon); }
    catch (e) { this.enabled = false; console.warn('[sfx] disabled after error:', e.message); }
  }

  _play(name, weapon) {
    switch (name) {
      case 'hit': { // 攻击命中：按武器区分音色
        const cfg = {
          branch: { f: 700, vol: 0.2, type: 'triangle' },
          knife:  { f: 1400, vol: 0.22, type: 'square' },
          torch:  { f: 300, vol: 0.28, type: 'sawtooth' },
          rock:   { f: 400, vol: 0.24, type: 'square' },
          bow:    { f: 1000, vol: 0.2, type: 'triangle' },
        }[weapon] || { f: 800, vol: 0.22, type: 'triangle' };
        this._noise({ dur: 0.14, vol: cfg.vol, freq: cfg.f });
        this._tone({ freq: 140, type: 'sine', dur: 0.14, vol: 0.2, slide: -60 });
        this._tone({ freq: cfg.f * 0.6, type: cfg.type, dur: 0.1, vol: 0.1 });
        break;
      }
      case 'swing': { // 挥砍风声：按武器区分
        const cfg = {
          branch: { f: 500, dur: 0.18, vol: 0.12 },
          knife:  { f: 900, dur: 0.12, vol: 0.15 },
          torch:  { f: 280, dur: 0.26, vol: 0.18 },
          rock:   { f: 400, dur: 0.15, vol: 0.13 },
          bow:    { f: 1200, dur: 0.1, vol: 0.12 },
        }[weapon] || { f: 500, dur: 0.18, vol: 0.12 };
        this._noise({ dur: cfg.dur, vol: cfg.vol, freq: cfg.f });
        break;
      }
      case 'pick': // 拾取
        this._tone({ freq: 660, type: 'triangle', dur: 0.12, vol: 0.25 });
        this._tone({ freq: 990, type: 'triangle', dur: 0.18, vol: 0.22, delay: 0.09 });
        break;
      case 'eat': // 吃东西回血
        this._tone({ freq: 300, type: 'sine', dur: 0.1, vol: 0.2 });
        this._tone({ freq: 380, type: 'sine', dur: 0.1, vol: 0.2, delay: 0.1 });
        this._tone({ freq: 460, type: 'sine', dur: 0.16, vol: 0.2, delay: 0.2 });
        break;
      case 'hurt': // 玩家受伤：低频冲击 + 噪声
        this._tone({ freq: 200, type: 'sawtooth', dur: 0.22, vol: 0.24, slide: -100 });
        this._noise({ dur: 0.12, vol: 0.18, freq: 250 });
        break;
      case 'fire': // 点火
        this._noise({ dur: 0.5, vol: 0.2, freq: 300 });
        this._tone({ freq: 90, type: 'sawtooth', dur: 0.5, vol: 0.1, slide: 40 });
        break;
      case 'arrow': // 射箭
        this._noise({ dur: 0.2, vol: 0.18, freq: 2000 });
        this._tone({ freq: 800, type: 'sine', dur: 0.25, vol: 0.1, slide: -500 });
        break;
      case 'monsterDeath':
        this._tone({ freq: 300, type: 'sawtooth', dur: 0.4, vol: 0.22, slide: -200 });
        this._noise({ dur: 0.3, vol: 0.15, freq: 400, delay: 0.1 });
        break;
      case 'monsterHit':
        this._noise({ dur: 0.1, vol: 0.2, freq: 600 });
        break;
      case 'torchLight': // 树枝点成火炬
        this._noise({ dur: 0.4, vol: 0.25, freq: 250 });
        this._tone({ freq: 500, type: 'sine', dur: 0.3, vol: 0.18, slide: 300 });
        break;
      case 'sheepDeath':
        this._tone({ freq: 600, type: 'triangle', dur: 0.3, vol: 0.2, slide: -200 });
        break;
      case 'jump':
        this._tone({ freq: 250, type: 'sine', dur: 0.15, vol: 0.15, slide: 200 });
        break;
      case 'dead':
        this._tone({ freq: 400, type: 'sawtooth', dur: 1.2, vol: 0.25, slide: -320 });
        break;
      case 'coin':
        this._tone({ freq: 1200, type: 'square', dur: 0.08, vol: 0.12 });
        this._tone({ freq: 1600, type: 'square', dur: 0.15, vol: 0.12, delay: 0.06 });
        break;
    }
  }

  // 简易环境音乐：低频循环和弦
  startMusic() {
    if (this.musicTimer) return;
    this._ensure();
    const chords = [
      [130.8, 196.0, 261.6], // C
      [110.0, 164.8, 220.0], // Am
      [146.8, 220.0, 293.7], // F
      [164.8, 196.0, 246.9], // G
    ];
    let i = 0;
    const playChord = () => {
      const notes = chords[i % chords.length];
      i++;
      for (const f of notes) {
        this._tone({ freq: f, type: 'sine', dur: 2.4, vol: 0.05 });
        this._tone({ freq: f * 2, type: 'triangle', dur: 2.4, vol: 0.02, delay: 0.05 });
      }
    };
    playChord();
    this.musicTimer = setInterval(playChord, 2600);
  }

  stopMusic() {
    if (this.musicTimer) { clearInterval(this.musicTimer); this.musicTimer = null; }
  }
}
