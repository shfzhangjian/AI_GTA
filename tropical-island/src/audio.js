export class IslandAudio {
 constructor(){this.enabled=false;this.ctx=null;this.master=null;this.timer=null;this.nodes=[];}
 async toggle(){if(!this.ctx)this.create();await this.ctx.resume();this.enabled=!this.enabled;this.master.gain.setTargetAtTime(this.enabled?.22:0,this.ctx.currentTime,.25);return this.enabled;}
 create(){const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;this.ctx=new Audio();this.master=this.ctx.createGain();this.master.gain.value=0;this.master.connect(this.ctx.destination);
  const buffer=this.ctx.createBuffer(1,this.ctx.sampleRate*4,this.ctx.sampleRate),data=buffer.getChannelData(0);let last=0;for(let i=0;i<data.length;i++){last=(last+(.02*(Math.random()*2-1)))/1.02;data[i]=last*3;}
  const source=this.ctx.createBufferSource();source.buffer=buffer;source.loop=true;const filter=this.ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=700;const gain=this.ctx.createGain();gain.gain.value=.42;source.connect(filter).connect(gain).connect(this.master);source.start();
  const wave=this.ctx.createOscillator();wave.frequency.value=.12;const modulation=this.ctx.createGain();modulation.gain.value=.12;wave.connect(modulation).connect(gain.gain);wave.start();
  this.timer=setInterval(()=>{if(this.enabled){const note=[0,4,7,11,14][Math.floor(Math.random()*5)];this.tone(196*2**(note/12),.12,3,'sine');}},4500);
 }
 tone(freq,volume=.2,duration=.7,type='sine'){if(!this.enabled||!this.ctx)return;const o=this.ctx.createOscillator(),g=this.ctx.createGain(),t=this.ctx.currentTime;o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(volume,t+.025);g.gain.exponentialRampToValueAtTime(.001,t+duration);o.connect(g).connect(this.master);o.start();o.stop(t+duration);}
 collect(){this.tone(659,.2,.55);setTimeout(()=>this.tone(988,.15,.8),100);}
 repair(){[392,494,587,784].forEach((f,i)=>setTimeout(()=>this.tone(f,.17,1.8),i*140));}
}
