import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/game.mjs';
import {HEROES,LEVELS} from '../src/data.mjs';
// Exercise a complete campaign using only movement, jump and skill controls.
// The controller receives no extra health, ammo, damage or invulnerability.
export function playChapter(level,hero){const g=new Game();g.start(level,hero);
  for(let frame=0;frame<60*120&&g.status==='running';frame++){
    if(g.energy>=100)g.ability();
    if(g.phase==='run'){
      const gate=g.gates.find(gate=>!gate.done&&gate.s-g.distance<18);let target=0;
      if(gate){const choice=gate.choices.find(c=>['gun','rate','damage'].includes(c.type))||gate.choices.find(c=>c.type==='ammo')||gate.choices[0];target=choice.x;}
      else{const e=g.enemies.filter(e=>!e.dead&&e.s>g.distance+2&&e.s<g.distance+48).sort((a,b)=>a.s-b.s)[0];target=e?.x||0;}
      g.targetX=target;if(g.obstacles.some(o=>!o.done&&o.s-g.distance<4&&Math.abs(o.x-g.x)<1.2))g.jump();
    }else{const t=g.boss.telegraph;if(t){if(t.kind==='wave'){if(t.remaining<.45)g.jump();}else g.targetX=t.x>=0?-2.65:2.65;}else g.targetX=0;}
    g.update(1/60);g.drain();
  }
  return g;
}
for(const hero of HEROES)for(const level of LEVELS)test(`${hero.name}能通过${level.name}的完整跑道与首领战`,()=>{const game=playChapter(level.id,hero.id);assert.equal(game.status,'won');assert.equal(game.boss.hp,0);assert.ok(game.hp>0);assert.ok(game.kills>15);assert.ok(game.time<120);});
