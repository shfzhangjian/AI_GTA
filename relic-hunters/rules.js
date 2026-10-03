import {HEROES,WEAPONS,RELICS} from './data.js';
export const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
export const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export const meleeTypes=new Set(['sword','hammer','spear','scythe','dagger']);
export function createRng(seed){let a=seed>>>0;return()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
export function shuffle(items,rng=Math.random){const a=[...items];for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
export function statsFor(hero,relicIds=[],gold=0){
  const s={maxhp:hero.hp,speed:hero.speed,damage:1,attackSpeed:1,armor:0,crit:.05,critMult:1.8,cooldown:0,dodge:0,magnet:95,healing:1,regen:0,burn:0,poison:0,slow:0,chain:0,extraShot:0,lifeSteal:0,killHeal:0,xp:1,gold:1,shield:0,revive:0,echo:0,choice:0,thorns:0,skillDamage:1,explode:0,counts:{}};
  for(const id of relicIds){const r=RELICS.find(x=>x.id===id);if(!r)continue;s.counts[r.tag]=(s.counts[r.tag]||0)+1;for(const [key,value] of Object.entries(r.effect)){if(key==='maxhp')s.maxhp+=value;else if(key==='speed')s.speed*=1+value;else if(key==='magnet')s.magnet*=1+value;else s[key]=(s[key]||0)+value;}}
  switch(hero.passiveId){case'collector':s.magnet*=1.45;break;case'armor':s.armor+=.15;break;case'critical':s.crit+=.15;s.dodge+=.25;break;case'engineer':s.choice+=1;break;case'frost':s.cooldown+=.15;break;case'healer':s.healing+=.3;break;case'gold':s.gold+=.25;s.damage+=Math.min(.25,Math.floor(gold/100)*.05);break;}
  for(const [tag,n] of Object.entries(s.counts)){if(n>=3){if(tag==='storm')s.chain++;if(tag==='echo')s.cooldown+=.15;if(tag==='iron')s.armor+=.10;}if(n>=6){if(tag==='ember')s.explode++;if(tag==='storm')s.attackSpeed+=.25;if(tag==='venom')s.regen+=2;if(tag==='iron')s.shield+=35;}}
  s.maxhp=Math.max(35,s.maxhp);s.armor=clamp(s.armor,0,.65);s.cooldown=clamp(s.cooldown,0,.60);s.dodge=clamp(s.dodge,0,.65);s.crit=clamp(s.crit,0,.85);s.magnet=Math.min(s.magnet,650);return s;
}
export function attackDamage(hero,weapon,stats,critical=false){let damage=weapon.damage*stats.damage;if(hero.passiveId==='ember'&&weapon.tag==='ember')damage*=1.25;if(hero.passiveId==='melee'&&meleeTypes.has(weapon.type))damage*=1.2;if(hero.passiveId==='engineer'&&!meleeTypes.has(weapon.type))damage*=1.15;return damage*(critical?(weapon.special==='crit'?2.3:stats.critMult):1);}
export function inMeleeArc(player,target,angle,weapon){const dx=target.x-player.x,dy=target.y-player.y,d=Math.hypot(dx,dy);if(d>weapon.range+target.radius)return false;const diff=Math.atan2(Math.sin(Math.atan2(dy,dx)-angle),Math.cos(Math.atan2(dy,dx)-angle));if(weapon.type==='hammer')return true;if(weapon.type==='spear')return Math.abs(Math.sin(diff)*d)<25+target.radius&&Math.cos(diff)>0;return Math.abs(diff)<(weapon.type==='scythe'?1.85:weapon.type==='dagger'?.9:1.2);}
export function segmentHit(ax,ay,bx,by,target,radius=0){const dx=bx-ax,dy=by-ay,t=clamp(((target.x-ax)*dx+(target.y-ay)*dy)/(dx*dx+dy*dy||1),0,1);return Math.hypot(target.x-(ax+dx*t),target.y-(ay+dy*t))<=target.radius+radius;}
export function rewardChoices(owned,rng,count=3){const available=RELICS.filter(r=>!owned.includes(r.id));return shuffle(available,rng).slice(0,count);}
export function weaponChoices(current,rng,count=3){return shuffle(WEAPONS.filter(w=>w.id!==current),rng).slice(0,count);}
export function roomPlan(index){return {act:Math.floor(index/3),step:index%3,boss:index%3===2,last:index===8,total:9};}
export const byHero=id=>HEROES.find(h=>h.id===id)||HEROES[0];
export const byWeapon=id=>WEAPONS.find(w=>w.id===id)||WEAPONS[0];
