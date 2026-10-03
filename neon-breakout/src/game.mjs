import {HEROES,LEVELS,LANES} from './data.mjs';
export const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
export function seeded(seed){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
export function generateLevel(level){
  const rand=seeded(level.seed),enemies=[],gates=[],obstacles=[],pickups=[];let id=0;
  const pairs=[['gun','loss'],['ammo','damage'],['rate','loss'],['ammo','heal'],['damage','ammo']];
  for(let i=0;i<5;i++){
    const s=33+i*(level.length-65)/5;const p=pairs[i];const reverse=i%2===1;
    gates.push({id:++id,s,choices:[{x:-2,type:p[reverse?1:0]},{x:2,type:p[reverse?0:1]}],done:false});
  }
  for(let s=19;s<level.length-10;s+=12){
    if(gates.some(g=>Math.abs(g.s-s)<7))continue;
    const count=s<50?2:2+Math.floor(rand()*(level.id>=3?3:2));
    for(let j=0;j<count;j++){const lane=j%3;enemies.push({id:++id,s:s+Math.floor(j/3)*4,x:LANES[lane]+(rand()-.5)*.7,hp:level.enemyHP+(j===3?1:0),maxHP:level.enemyHP+(j===3?1:0),kind:j===3?'heavy':'normal',phase:rand()*6.28,dead:false});}
  }
  for(let i=0;i<4;i++){const s=58+i*(level.length-90)/4;if(!gates.some(g=>Math.abs(g.s-s)<9))obstacles.push({id:++id,s,x:LANES[Math.floor(rand()*3)],done:false});}
  for(let i=0;i<6;i++)pickups.push({id:++id,s:23+i*(level.length-40)/6,x:LANES[i%3],done:false});
  return {enemies,gates,obstacles,pickups};
}
export class Game {
  constructor(){this.status='menu';this.events=[];this.time=0;this.keys={};this.uid=10000;}
  start(levelID=1,heroID='lin',endless=false){
    this.level={...LEVELS[clamp(levelID,1,6)-1]};this.hero=HEROES.find(h=>h.id===heroID)||HEROES[0];this.endless=endless;
    this.status='running';this.phase='run';this.time=0;this.distance=0;this.x=0;this.targetX=0;this.hp=this.hero.hp;this.maxHP=this.hp;
    this.ammo=this.hero.ammo;this.guns=1;this.rate=1;this.damage=this.hero.damage;this.shotCD=0;this.kills=0;this.score=0;this.combo=0;this.comboTime=0;this.invincible=0;
    this.jumpTime=0;this.jumpY=0;this.energy=100;this.burst=0;this.bullets=[];this.hazards=[];this.boss=null;this.events=[];this.wave=1;this.emptyTime=0;this.runStart=0;
    Object.assign(this,generateLevel(this.level));this.emit('start',{text:this.level.name});
  }
  emit(type,extra={}){this.events.push({type,...extra});}
  drain(){const e=this.events;this.events=[];return e;}
  pause(){if(this.status==='running'){this.status='paused';return true;}return false;}
  resume(){if(this.status==='paused'){this.status='running';return true;}return false;}
  jump(){if(this.status==='running'&&this.jumpTime<=0){this.jumpTime=.85;this.emit('jump');}}
  ability(){if(this.status!=='running'||this.energy<100)return false;this.energy=0;this.burst=4;this.ammo+=22;this.emit('ability',{text:this.hero.skill});return true;}
  hit(amount=1){if(this.invincible>0||this.status!=='running'||(this.burst>0&&this.hero.id==='chen'))return;
    this.hp=Math.max(0,this.hp-amount);this.invincible=1.25;this.combo=0;this.emit('hurt');if(this.hp===0){this.status='lost';this.emit('lost');}}
  applyGate(type){
    switch(type){case'ammo':this.ammo=Math.min(999,this.ammo+60);break;case'gun':this.guns=Math.min(3,this.guns+1);break;case'rate':this.rate=Math.min(3,this.rate*2);break;case'damage':this.damage+=1;break;case'heal':this.hp=Math.min(this.maxHP,this.hp+1);break;case'loss':this.ammo=Math.max(0,this.ammo-35);break;}
    this.emit('gate',{gate:type});this.score+=type==='loss'?0:50;
  }
  kill(e){e.dead=true;this.kills++;this.combo++;this.comboTime=2.4;this.score+=100+Math.min(this.combo,10)*10;this.energy=Math.min(100,this.energy+3);this.emit('kill',{x:e.x,s:e.s,kind:e.kind});}
  beginBoss(){this.phase='boss';this.boss={x:0,s:this.distance+17,hp:this.level.bossHP,maxHP:this.level.bossHP,clock:0,nextAttack:2.2,attackCount:0,telegraph:null,flash:0};this.bullets=[];this.emit('boss',{text:this.level.boss});}
  win(){if(this.endless){this.wave++;this.level={...this.level,length:this.distance+270,speed:Math.min(17,this.level.speed+.7),bossHP:Math.round(this.level.bossHP*1.25),seed:this.level.seed+37,enemyHP:this.level.enemyHP+1};
      const generated=generateLevel({...this.level,length:270});for(const key of ['enemies','gates','obstacles','pickups']){this[key]=generated[key];for(const e of this[key])e.s+=this.distance;}
      this.phase='run';this.runStart=this.distance;this.boss=null;this.bullets=[];this.hazards=[];this.ammo+=100;this.hp=Math.min(this.maxHP,this.hp+2);this.emit('wave',{text:`第 ${this.wave} 波`});
    }else{this.status='won';this.score+=Math.round(this.hp*200+this.ammo*3);this.emit('won');}}
  update(dt,input={}){
    if(this.status!=='running')return;dt=clamp(dt,0,.05);this.time+=dt;
    if(typeof input.targetX==='number')this.targetX=clamp(input.targetX,-3.6,3.6);
    if(input.axis)this.targetX=clamp(this.targetX+input.axis*12*dt,-3.6,3.6);
    this.x+=(this.targetX-this.x)*Math.min(1,dt*15);
    this.invincible=Math.max(0,this.invincible-dt);this.burst=Math.max(0,this.burst-dt);this.energy=Math.min(100,this.energy+dt*2.6);
    if(this.jumpTime>0){this.jumpTime=Math.max(0,this.jumpTime-dt);this.jumpY=Math.sin(Math.PI*(1-this.jumpTime/.85))*1.9;}else this.jumpY=0;
    this.comboTime-=dt;if(this.comboTime<=0)this.combo=0;
    if(this.phase==='run')this.updateRun(dt);else this.updateBoss(dt);
    if(this.status!=='running')return;
    this.shotCD-=dt;
    const target=this.phase==='boss'?this.boss:this.enemies.filter(e=>!e.dead&&e.s>this.distance+2&&e.s<this.distance+53&&Math.abs(e.x-this.x)<1.65).sort((a,b)=>a.s-b.s)[0];
    if(target&&this.shotCD<=0&&this.ammo>0){
      this.shotCD=1/(5*this.rate*(this.burst>0?1.6:1));const count=Math.min(this.guns,this.ammo);this.ammo-=count;
      for(let i=0;i<count;i++){const x=this.x+(i-(count-1)/2)*.26;const ds=Math.max(2,target.s-this.distance);this.bullets.push({id:++this.uid,x,s:this.distance+1.2,prev:this.distance+1.2,vx:(target.x-x)/ds*60,damage:this.damage*(this.burst>0?(this.hero.id==='su'?3:2):1),pierce:this.burst>0});}
      this.emit('shot');
    }
    for(const b of this.bullets){b.prev=b.s;b.s+=60*dt;b.x+=b.vx*dt;
      if(this.phase==='boss'){const boss=this.boss;if(b.s>=boss.s-1.7&&b.prev<=boss.s+1.7&&Math.abs(b.x-boss.x)<2.7){boss.hp=Math.max(0,boss.hp-b.damage);boss.flash=.08;b.dead=true;this.emit('impact',{x:b.x,s:boss.s});if(boss.hp===0){this.emit('bossDead');this.win();break;}}}
      else for(const e of this.enemies){if(e.dead||b.dead||b.hitTargets?.has(e.id))continue;if(b.s>=e.s-.65&&b.prev<=e.s+.65&&Math.abs(b.x-e.x)<(e.kind==='heavy'?.85:.65)){(b.hitTargets??=new Set()).add(e.id);e.hp-=b.damage;this.emit('impact',{x:e.x,s:e.s});if(e.hp<=0)this.kill(e);if(!b.pierce)b.dead=true;}}
      if(b.s-this.distance>75)b.dead=true;
    }
    this.bullets=this.bullets.filter(b=>!b.dead);
  }
  updateRun(dt){
    this.distance=Math.min(this.level.length,this.distance+this.level.speed*dt);
    for(const e of this.enemies){if(e.dead)continue;e.s-=dt*.6;const d=e.s-this.distance;if(d<1.2){e.dead=true;if(Math.abs(e.x-this.x)<1.15&&this.jumpY<.8)this.hit();}}
    for(const g of this.gates){if(!g.done&&g.s-this.distance<1){g.done=true;const c=g.choices.reduce((a,b)=>Math.abs(b.x-this.x)<Math.abs(a.x-this.x)?b:a);this.applyGate(c.type);}}
    for(const o of this.obstacles){if(!o.done&&o.s-this.distance<.8){o.done=true;if(Math.abs(o.x-this.x)<1.1&&this.jumpY<.75){this.hit();this.emit('obstacle');}}}
    for(const p of this.pickups){if(!p.done&&p.s-this.distance<.8){p.done=true;if(Math.abs(p.x-this.x)<1.2){this.ammo+=15;this.emit('pickup',{text:'+15 弹药'});this.score+=30;}}}
    if(this.distance>=this.level.length&&this.status==='running')this.beginBoss();
  }
  updateBoss(dt){
    const b=this.boss;b.clock+=dt;b.flash=Math.max(0,b.flash-dt);b.x=Math.sin(b.clock*.65)*1.5;
    if(b.telegraph){b.telegraph.remaining-=dt;if(b.telegraph.remaining<=0){const t=b.telegraph;if(t.kind==='wave'){if(this.jumpY<.75)this.hit();this.emit('slam',{x:0,kind:'wave'});}else{if(Math.abs(this.x-t.x)<1.25&&this.jumpY<.8)this.hit();this.emit('slam',{x:t.x});}b.telegraph=null;}}
    if(b.clock>=b.nextAttack&&!b.telegraph){
      b.attackCount++;const kind=b.attackCount%3===0?'wave':'smash';const x=LANES.reduce((a,c)=>Math.abs(c-this.x)<Math.abs(a-this.x)?c:a,0);
      b.telegraph={x,kind,remaining:1.4};b.nextAttack=b.clock+(b.hp/b.maxHP<.4?2.5:3.3);this.emit('warning',{text:kind==='wave'?'冲击波！跳跃躲避':'重击来袭！离开红色区域'});
      if(b.attackCount%2===0){for(const lane of LANES.filter(l=>Math.abs(l-this.x)>1)){this.hazards.push({id:++this.uid,x:lane,s:this.distance+16,dead:false});}}
    }
    for(const h of this.hazards){h.s-=dt*10;if(h.s-this.distance<1){h.dead=true;if(Math.abs(h.x-this.x)<.9&&this.jumpY<.8)this.hit();}}
    this.hazards=this.hazards.filter(h=>!h.dead);
    if(this.ammo===0&&!this.bullets.length){this.emptyTime=(this.emptyTime||0)+dt;if(this.emptyTime>2.3){this.ammo=25;this.emptyTime=0;this.emit('pickup',{text:'应急补给 +25 弹药'});}}else this.emptyTime=0;
  }
  snapshot(){return{status:this.status,phase:this.phase,level:this.level?.id,hero:this.hero?.id,distance:this.distance,x:this.x,hp:this.hp,ammo:this.ammo,guns:this.guns,rate:this.rate,damage:this.damage,kills:this.kills,score:this.score,energy:this.energy,bossHP:this.boss?.hp,bossMaxHP:this.boss?.maxHP,wave:this.wave};}
}
