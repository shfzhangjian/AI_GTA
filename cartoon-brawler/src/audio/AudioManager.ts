/**
 * AudioManager: fully procedural Web Audio SFX (no external files required).
 * Must be initialized from a user gesture (START GAME click).
 */

export type SfxName =
  | 'swing' | 'hitLight' | 'hitHeavy' | 'break' | 'dodge' | 'jump'
  | 'hurt' | 'death' | 'bossRoar' | 'shockwave' | 'ui' | 'victory' | 'lose';

export class AudioManager {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  enabled = true;

  init(): void {
    if (this.ctx) return;
    try {
      this.ctx = new AudioContext();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.35;
      this.master.connect(this.ctx.destination);
    } catch {
      console.warn('[Audio] unavailable');
    }
  }

  play(name: SfxName): void {
    const ctx = this.ctx;
    if (!ctx || !this.master || !this.enabled) return;
    const t = ctx.currentTime;
    switch (name) {
      case 'swing': this.noise(t, 0.08, 900, 0.25, 'bandpass'); break;
      case 'hitLight':
        this.tone(t, 0.07, 190, 'square', 0.3);
        this.noise(t, 0.06, 2400, 0.3, 'highpass');
        break;
      case 'hitHeavy':
        this.tone(t, 0.16, 95, 'sawtooth', 0.5);
        this.noise(t, 0.12, 700, 0.45, 'lowpass');
        break;
      case 'break':
        this.noise(t, 0.3, 1600, 0.5, 'bandpass', 0.6);
        this.tone(t + 0.02, 0.1, 140, 'triangle', 0.3);
        break;
      case 'dodge': this.noise(t, 0.12, 500, 0.2, 'bandpass', 3); break;
      case 'jump': this.sweep(t, 0.12, 240, 520, 'triangle', 0.22); break;
      case 'hurt': this.tone(t, 0.14, 150, 'sawtooth', 0.35); break;
      case 'death': this.sweep(t, 0.6, 320, 60, 'sawtooth', 0.4); break;
      case 'bossRoar':
        this.sweep(t, 0.7, 110, 45, 'sawtooth', 0.55);
        this.noise(t, 0.6, 240, 0.35, 'lowpass');
        break;
      case 'shockwave':
        this.sweep(t, 0.4, 90, 40, 'sine', 0.6);
        this.noise(t, 0.35, 420, 0.4, 'lowpass');
        break;
      case 'ui': this.tone(t, 0.06, 660, 'square', 0.15); break;
      case 'victory':
        [523, 659, 784, 1047].forEach((f, i) => this.tone(t + i * 0.14, 0.22, f, 'square', 0.18));
        break;
      case 'lose':
        [392, 330, 262, 196].forEach((f, i) => this.tone(t + i * 0.2, 0.3, f, 'sawtooth', 0.16));
        break;
    }
  }

  private tone(t: number, dur: number, freq: number, type: OscillatorType, gain: number): void {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(g).connect(this.master!);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  private sweep(t: number, dur: number, from: number, to: number, type: OscillatorType, gain: number): void {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(from, t);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, to), t + dur);
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(g).connect(this.master!);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  private noise(t: number, dur: number, freq: number, gain: number, filter: BiquadFilterType, q = 1): void {
    const ctx = this.ctx!;
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const f = ctx.createBiquadFilter();
    f.type = filter;
    f.frequency.value = freq;
    f.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(f).connect(g).connect(this.master!);
    src.start(t);
  }
}
