// All sounds are synthesized locally. No samples or external audio requests.
export class ForestAudio {
  constructor() { this.ctx = null; this.muted = false; this.timer = null; this.note = 0; }
  async unlock() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.master = this.ctx.createGain(); this.master.gain.value = this.muted ? 0 : .42;
      const compressor = this.ctx.createDynamicsCompressor();
      this.master.connect(compressor); compressor.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') await this.ctx.resume();
  }
  tone(freq, at = 0, duration = .2, type = 'sine', volume = .16) {
    if (!this.ctx || this.muted || this.ctx.state !== 'running') return;
    const time = this.ctx.currentTime + at, osc = this.ctx.createOscillator(), gain = this.ctx.createGain();
    osc.type = type; osc.frequency.setValueAtTime(freq, time);
    gain.gain.setValueAtTime(0, time); gain.gain.linearRampToValueAtTime(volume, time + .007);
    gain.gain.exponentialRampToValueAtTime(.0001, time + duration);
    osc.connect(gain); gain.connect(this.master); osc.start(time); osc.stop(time + duration + .05);
    osc.onended = () => { osc.disconnect(); gain.disconnect(); };
  }
  noise(duration = .09, volume = .25, frequency = 1300) {
    if (!this.ctx || this.muted) return;
    const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate * duration, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i=0;i<data.length;i++) data[i] = (Math.random()*2-1) * Math.pow(1-i/data.length,3);
    const source = this.ctx.createBufferSource(), filter = this.ctx.createBiquadFilter(), gain = this.ctx.createGain();
    source.buffer=buffer; filter.type='lowpass'; filter.frequency.value=frequency; gain.gain.value=volume;
    source.connect(filter);filter.connect(gain);gain.connect(this.master);source.start();
    source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect();};
  }
  hit(count, special = false) {
    this.noise(special ? .25 : .07, special ? .5 : .28, special ? 800 : 1900);
    this.tone(special ? 105 : 180,0,.13,'triangle',.23);
    const notes=[523.25,659.25,783.99,1046.5,1318.5,1567.98];
    const n=Math.min(6,Math.max(1,Math.ceil(count/2)));
    for(let i=0;i<n;i++) this.tone(notes[i],.05+i*.055,.42,'sine',.12);
    if(special) this.tone(65,0,.45,'sine',.35);
  }
  select() {this.tone(660,0,.12,'sine',.08);this.tone(880,.07,.15,'sine',.06);}
  win() {[523,659,784,1047,1318,1047].forEach((n,i)=>this.tone(n,i*.13,.65,'sine',.2));}
  lose() {[392,330,262].forEach((n,i)=>this.tone(n,i*.2,.5,'triangle',.14));}
  startAmbience() {
    if(this.timer) return;
    const melody=[523,0,659,0,784,0,659,0,587,0,523,0,440,0,0,0];
    this.timer=setInterval(()=>{
      if(document.hidden || this.muted) return;
      const freq=melody[this.note++%melody.length];
      if(freq) {this.tone(freq,0,1.25,'sine',.023);this.tone(freq/2,.02,1.7,'sine',.018);}
      if(this.note%7===0) {this.tone(1760,.1,.09,'sine',.017);this.tone(2100,.2,.13,'sine',.014);}
    },680);
  }
  pause() {clearInterval(this.timer);this.timer=null;}
  toggle() {this.muted=!this.muted;if(this.master)this.master.gain.setTargetAtTime(this.muted?0:.42,this.ctx.currentTime,.04);return this.muted;}
}
