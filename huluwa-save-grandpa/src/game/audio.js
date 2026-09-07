const DEFAULT_VOLUME = 0.42;

export class GameAudio {
  constructor() {
    this.context = null;
    this.master = null;
    this.enabled = loadEnabled();
    this.unlocked = false;
  }

  bindState(state) {
    state.addEventListener('start', () => this.play('start'));
    state.addEventListener('pause', () => this.play('pause'));
    state.addEventListener('resume', () => this.play('resume'));
    state.addEventListener('upgrade', () => this.play('upgrade'));
    state.addEventListener('skill-unlocked', () => this.play('unlock'));
    state.addEventListener('denied', () => this.play('denied'));
    state.addEventListener('skill', (event) => this.play(`skill:${event.detail.id}`));
    state.addEventListener('grandpa-hit', () => this.play('danger'));
    state.addEventListener('level-complete', () => this.play('level'));
    state.addEventListener('won', () => this.play('win'));
    state.addEventListener('lost', () => this.play('lost'));
  }

  async unlock() {
    if (!this.enabled) {
      return;
    }

    this.ensureContext();
    this.unlocked = true;
    if (this.context.state === 'suspended') {
      await this.context.resume();
    }
  }

  toggle() {
    this.enabled = !this.enabled;
    localStorage.setItem('huluwa-audio-enabled', this.enabled ? '1' : '0');

    if (this.enabled) {
      void this.unlock().then(() => this.play('toggle-on'));
    } else {
      this.play('toggle-off', { force: true });
      if (this.context && this.master) {
        this.master.gain.setTargetAtTime(0, this.context.currentTime + 0.14, 0.025);
      }
    }

    return this.enabled;
  }

  play(name, options = {}) {
    if ((!this.enabled && !options.force) || !this.ensurePlayable(options.force)) {
      return;
    }

    const now = this.context.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setTargetAtTime(this.enabled || options.force ? DEFAULT_VOLUME : 0, now, 0.02);

    if (name === 'shoot') {
      this.shoot(now);
    } else if (name === 'hit') {
      this.hit(now);
    } else if (name === 'critical') {
      this.critical(now);
    } else if (name === 'defeat') {
      this.defeat(now);
    } else if (name === 'seal') {
      this.seal(now);
    } else if (name === 'upgrade') {
      this.upgrade(now);
    } else if (name === 'unlock') {
      this.unlockChime(now);
    } else if (name.startsWith('skill:')) {
      this.skill(now, name.split(':')[1]);
    } else if (name === 'danger') {
      this.danger(now);
    } else if (name === 'level') {
      this.level(now);
    } else if (name === 'win') {
      this.win(now);
    } else if (name === 'lost') {
      this.lost(now);
    } else if (name === 'denied') {
      this.denied(now);
    } else if (name === 'start' || name === 'resume') {
      this.startBell(now);
    } else if (name === 'pause') {
      this.pauseBell(now);
    } else if (name === 'toggle-on') {
      this.tone({ at: now, frequency: 660, endFrequency: 880, duration: 0.11, gain: 0.09, type: 'triangle' });
    } else if (name === 'toggle-off') {
      this.tone({ at: now, frequency: 420, endFrequency: 220, duration: 0.12, gain: 0.08, type: 'triangle' });
    }
  }

  ensureContext() {
    if (this.context) {
      return;
    }

    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) {
      return;
    }

    this.context = new AudioContext();
    this.master = this.context.createGain();
    this.master.gain.value = this.enabled ? DEFAULT_VOLUME : 0;
    this.master.connect(this.context.destination);
  }

  ensurePlayable(force = false) {
    this.ensureContext();
    return Boolean(this.context && this.master && (this.unlocked || force));
  }

  shoot(at) {
    this.tone({ at, frequency: 360, endFrequency: 760, duration: 0.08, gain: 0.09, type: 'triangle' });
    this.noise({ at, duration: 0.06, gain: 0.032, filter: 2100 });
    this.tone({ at: at + 0.035, frequency: 1120, endFrequency: 760, duration: 0.07, gain: 0.036, type: 'sine' });
  }

  hit(at) {
    this.tone({ at, frequency: 170, endFrequency: 110, duration: 0.12, gain: 0.1, type: 'sawtooth' });
    this.noise({ at, duration: 0.08, gain: 0.042, filter: 520 });
  }

  critical(at) {
    this.hit(at);
    this.tone({ at: at + 0.015, frequency: 840, endFrequency: 1320, duration: 0.11, gain: 0.11, type: 'square' });
    this.tone({ at: at + 0.07, frequency: 1560, endFrequency: 980, duration: 0.13, gain: 0.06, type: 'triangle' });
  }

  defeat(at) {
    this.tone({ at, frequency: 250, endFrequency: 82, duration: 0.26, gain: 0.12, type: 'sawtooth' });
    this.noise({ at: at + 0.04, duration: 0.18, gain: 0.055, filter: 360 });
  }

  seal(at) {
    this.tone({ at, frequency: 520, endFrequency: 330, duration: 0.12, gain: 0.07, type: 'triangle' });
    this.tone({ at: at + 0.035, frequency: 880, endFrequency: 520, duration: 0.08, gain: 0.045, type: 'sine' });
  }

  upgrade(at) {
    this.arpeggio(at, [440, 554, 659, 880], 0.075, 0.08, 'triangle');
  }

  unlockChime(at) {
    this.arpeggio(at, [392, 523, 659, 784, 1046], 0.07, 0.072, 'sine');
    this.noise({ at: at + 0.08, duration: 0.2, gain: 0.018, filter: 3400 });
  }

  skill(at, id) {
    if (id === 'dawa') {
      this.tone({ at, frequency: 105, endFrequency: 68, duration: 0.26, gain: 0.18, type: 'sawtooth' });
      this.noise({ at: at + 0.04, duration: 0.22, gain: 0.08, filter: 260 });
      return;
    }

    if (id === 'erwa') {
      this.arpeggio(at, [780, 980, 1320, 1560], 0.06, 0.055, 'sine');
      return;
    }

    if (id === 'sanwa') {
      this.tone({ at, frequency: 196, endFrequency: 294, duration: 0.22, gain: 0.11, type: 'triangle' });
      this.tone({ at: at + 0.08, frequency: 392, endFrequency: 330, duration: 0.22, gain: 0.08, type: 'sine' });
      return;
    }

    this.noise({ at, duration: 0.16, gain: 0.08, filter: 1800 });
    this.arpeggio(at + 0.04, [330, 494, 740, 988], 0.05, 0.08, 'square');
  }

  danger(at) {
    this.tone({ at, frequency: 160, endFrequency: 140, duration: 0.12, gain: 0.12, type: 'square' });
    this.tone({ at: at + 0.15, frequency: 150, endFrequency: 125, duration: 0.12, gain: 0.09, type: 'square' });
  }

  level(at) {
    this.arpeggio(at, [330, 392, 494, 659, 784], 0.11, 0.088, 'triangle');
    this.tone({ at: at + 0.45, frequency: 988, endFrequency: 1174, duration: 0.22, gain: 0.07, type: 'sine' });
  }

  win(at) {
    this.arpeggio(at, [392, 523, 659, 784, 1046, 1318], 0.095, 0.086, 'triangle');
  }

  lost(at) {
    this.tone({ at, frequency: 260, endFrequency: 92, duration: 0.58, gain: 0.14, type: 'sawtooth' });
    this.noise({ at: at + 0.08, duration: 0.32, gain: 0.05, filter: 180 });
  }

  denied(at) {
    this.tone({ at, frequency: 220, duration: 0.05, gain: 0.07, type: 'square' });
    this.tone({ at: at + 0.08, frequency: 185, duration: 0.06, gain: 0.06, type: 'square' });
  }

  startBell(at) {
    this.arpeggio(at, [294, 392, 587], 0.08, 0.07, 'triangle');
  }

  pauseBell(at) {
    this.tone({ at, frequency: 440, endFrequency: 330, duration: 0.12, gain: 0.07, type: 'triangle' });
  }

  arpeggio(at, frequencies, step, gain, type) {
    frequencies.forEach((frequency, index) => {
      this.tone({
        at: at + index * step,
        frequency,
        endFrequency: frequency * 1.015,
        duration: step * 1.8,
        gain: gain * Math.max(0.45, 1 - index * 0.08),
        type,
      });
    });
  }

  tone({ at, frequency, endFrequency = frequency, duration, gain, type = 'sine' }) {
    const oscillator = this.context.createOscillator();
    const envelope = this.context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, at);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, endFrequency), at + duration);
    envelope.gain.setValueAtTime(0.0001, at);
    envelope.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), at + 0.01);
    envelope.gain.exponentialRampToValueAtTime(0.0001, at + duration);
    oscillator.connect(envelope);
    envelope.connect(this.master);
    oscillator.start(at);
    oscillator.stop(at + duration + 0.03);
  }

  noise({ at, duration, gain, filter }) {
    const buffer = this.context.createBuffer(1, this.context.sampleRate * duration, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    }

    const source = this.context.createBufferSource();
    const biquad = this.context.createBiquadFilter();
    const envelope = this.context.createGain();
    source.buffer = buffer;
    biquad.type = 'lowpass';
    biquad.frequency.setValueAtTime(filter, at);
    envelope.gain.setValueAtTime(0.0001, at);
    envelope.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), at + 0.01);
    envelope.gain.exponentialRampToValueAtTime(0.0001, at + duration);
    source.connect(biquad);
    biquad.connect(envelope);
    envelope.connect(this.master);
    source.start(at);
  }
}

function loadEnabled() {
  return localStorage.getItem('huluwa-audio-enabled') !== '0';
}
