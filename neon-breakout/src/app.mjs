import {Game,clamp} from './game.mjs';
import {Renderer} from './render.mjs';
import {Audio} from './audio.mjs';
import {HEROES,LEVELS,GATE_INFO} from './data.mjs';
const $=id=>document.getElementById(id),game=new Game(),storageKey='neon-breakout-cn-v1';
let save={unlocked:1,hero:'lin',sound:true,quality:innerWidth<700?'low':'high',records:{},tutorial:false};
try{const data=JSON.parse(localStorage.getItem(storageKey)||'null');if(data&&typeof data==='object'){save={...save,...data};save.unlocked=clamp(Number(save.unlocked)||1,1,6);if(!HEROES.some(h=>h.id===save.hero))save.hero='lin';if(!['low','high'].includes(save.quality))save.quality='high';if(!save.records||typeof save.records!=='object')save.records={};}}catch{}
function persist(){try{localStorage.setItem(storageKey,JSON.stringify(save));}catch{}}
let renderer,selectedLevel=1,selectedHero=save.hero,lastTime=0,countdown=0,countdownNumber=0,toastTime=0,warningTime=0,tutorialTime=0,settingsResume=false,settingsPaused=false,resultShown=false;
const keys=new Set(),audio=new Audio(save.sound),input={axis:0},canvas=$('scene');
function portrait(hero){const color=hero.color;return `<svg viewBox="0 0 42 64" aria-hidden="true"><path d="M3 64V49q1-10 18-10t18 10v15" fill="${color}" opacity=".8"/><path d="M17 37v8q4 4 8 0v-8" fill="#d49b74"/><ellipse cx="21" cy="24" rx="13" ry="17" fill="#f0b78c"/><path d="M8 23Q1 0 22 2q19-1 13 22l-5-12-9 4-10-3z" fill="#172337"/><path d="M12 24h6m6 0h6" stroke="#343247" stroke-width="2"/><path d="M13 28h3m9 0h3" stroke="#252e3c" stroke-width="2.5"/><path d="m18 35 6 0" stroke="#a66353" stroke-width="1.5"/><path d="M15 45h12l-3 5h-6z" fill="#19273d"/><path d="M21 50v14" stroke="#ffe3a6" stroke-width="1"/>${hero.id==='su'?'<path d="M33 13q12-3 8 20l-5 16 1-24" fill="#172337"/><circle cx="36" cy="15" r="3" fill="#ffba64"/>':''}</svg>`;}
function menuUI(){
  $('hero-list').innerHTML=HEROES.map(h=>`<button class="hero-card ${h.id===selectedHero?'active':''}" data-hero="${h.id}" style="--hero-color:${h.color}" aria-pressed="${h.id===selectedHero}">${portrait(h)}<span><strong>${h.name}</strong><small>${h.title}</small></span></button>`).join('');
  $('hero-list').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{selectedHero=b.dataset.hero;save.hero=selectedHero;persist();renderer.setHero(selectedHero);menuUI();}));
  const hero=HEROES.find(h=>h.id===selectedHero);$('hero-desc').textContent=hero.description;$('hero-role').textContent=hero.title;$('caption-hero').textContent=`${hero.name} / ${hero.title}`;
  $('level-list').innerHTML=LEVELS.map(l=>`<button class="level-btn ${l.id===selectedLevel?'active':''} ${l.id>save.unlocked?'locked':''}" data-level="${l.id}" aria-label="${l.tag} ${l.name}${l.id>save.unlocked?'，尚未解锁':''}" aria-pressed="${l.id===selectedLevel}" ${l.id>save.unlocked?'disabled':''}>${l.id>save.unlocked?'<svg class="lock" width="13" height="14" viewBox="0 0 16 18" style="margin:auto" aria-hidden="true"><rect x="3" y="8" width="10" height="8" rx="2" fill="none" stroke="currentColor"/><path d="M5 8V5a3 3 0 0 1 6 0v3" fill="none" stroke="currentColor"/></svg>':String(l.id).padStart(2,'0')}</button>`).join('');
  $('level-list').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{selectedLevel=Number(b.dataset.level);menuUI();}));
  const level=LEVELS[selectedLevel-1];$('chapter-name').textContent=level.name;$('chapter-subtitle').textContent=level.subtitle;$('progress-label').textContent=`已解锁 ${save.unlocked} / 6`;
  const record=save.records[selectedLevel];$('chapter-record').textContent=record?`最佳 ${record.score.toLocaleString()} 分`:'等待你的首战';$('endless-btn').hidden=!save.records[6];
}
function setHidden(id,value){$(id).hidden=value;}
function hideOverlays(){for(const id of ['pause','result','settings','countdown','tutorial','warning'])setHidden(id,true);}
function toMenu(){keys.clear();countdown=0;game.status='menu';hideOverlays();setHidden('hud',true);setHidden('menu',false);document.body.classList.remove('playing','boss');renderer.setMode('menu');renderer.setHero(selectedHero);menuUI();}
function start(level=selectedLevel,endless=false){
  audio.unlock();keys.clear();game.start(level,selectedHero,endless);game.pause();resultShown=false;renderer.setMode('game');renderer.setHero(selectedHero);hideOverlays();setHidden('menu',true);setHidden('hud',false);setHidden('countdown',false);document.body.classList.add('playing');document.body.classList.remove('boss');
  $('hud-chapter').textContent=endless?'无尽挑战':game.level.tag;$('hud-level').textContent=game.level.name;
  $('ability-label').innerHTML=`${game.hero.skill} <kbd>E</kbd>`;countdown=2.4;countdownNumber=0;toastTime=0;warningTime=0;$('toast').classList.remove('visible');hudUI();
}
function pause(){if(countdown>0)return;if(game.pause()){setHidden('pause',false);keys.clear();}}
function resume(){setHidden('pause',true);game.resume();keys.clear();lastTime=performance.now();}
function toast(text,color='#fff3b5',duration=1.5){$('toast').textContent=text;$('toast').style.color=color;$('toast').classList.add('visible');toastTime=duration;}
function hudUI(){if(!game.level)return;
  $('ammo').textContent=game.ammo;$('ammo').style.color=game.ammo<20?'#ff8094':'#ffcc63';$('score').textContent=String(game.score).padStart(6,'0');
  const hearts=Array.from({length:game.maxHP},(_,i)=>`<svg viewBox="0 0 24 24" class="${i>=game.hp?'empty':''}" aria-hidden="true"><path d="M12 21S2 15 2 8a5.5 5.5 0 0 1 10-3 5.5 5.5 0 0 1 10 3c0 7-10 13-10 13z"/></svg>`).join('');
  if($('hearts').dataset.hp!==`${game.hp}/${game.maxHP}`){$('hearts').innerHTML=hearts;$('hearts').dataset.hp=`${game.hp}/${game.maxHP}`;$('hearts').setAttribute('aria-label',`生命 ${game.hp} / ${game.maxHP}`);}
  $('weapon-stat').textContent=`${game.guns===1?'单枪':game.guns===2?'双枪':'三连枪'} · 射速 ×${game.rate} · 威力 ${game.damage.toFixed(1)}`;
  $('run-progress').style.width=`${(game.distance-game.runStart)/(game.level.length-game.runStart)*100}%`;$('ability-btn').disabled=game.energy<100||game.status!=='running';$('energy-fill').style.width=`${game.energy}%`;
  setHidden('combo',game.combo<3);if(game.combo>=3)$('combo').innerHTML=`${game.combo} 连击<small>火力全开</small>`;
  const boss=game.phase==='boss';setHidden('boss-hud',!boss);document.body.classList.toggle('boss',boss);
  if(boss){$('boss-name').textContent=game.level.boss;$('boss-health').style.width=`${game.boss.hp/game.boss.maxHP*100}%`;$('boss-health-text').textContent=`${Math.ceil(game.boss.hp)} / ${game.boss.maxHP}`;}
  if(game.endless)$('hud-chapter').textContent=`无尽挑战 · 第 ${game.wave} 波`;
}
function finish(){if(resultShown)return;resultShown=true;const won=game.status==='won';keys.clear();setHidden('warning',true);setHidden('tutorial',true);setHidden('result',false);const stars=won?(game.hp>=game.maxHP-1?3:game.hp>=2?2:1):0;
  if(won){save.unlocked=Math.max(save.unlocked,Math.min(6,game.level.id+1));const prior=save.records[game.level.id];save.records[game.level.id]={score:Math.max(game.score,prior?.score||0),stars:Math.max(stars,prior?.stars||0),time:Math.min(game.time,prior?.time||Infinity)};persist();}
  $('result-label').textContent=won?'行动完成 / 章节通关':'行动未完成';$('result-title').textContent=won?(game.level.id===6?'霓城，重获新生。':'霓城，为你亮起。'):'这次，就差一点。';$('result-symbol').textContent=won?'✦':'↻';$('result-symbol').style.color=won?'#ffbe58':'#ff829a';
  $('result-message').textContent=won?(game.level.id===6?'镇城尸王已倒下。六章完成，无尽挑战已解锁。':`${game.level.boss}已被击败，下一段天街等你出发。`):game.endless?`你守住了 ${game.wave} 波进攻。换个策略，再战霓城。`:'多选蓝绿增益门，躲开红区。跳跃和爆发能扭转战局。';
  $('result-score').textContent=game.score.toLocaleString();$('result-kills').textContent=game.kills;$('result-time').textContent=`${Math.floor(game.time/60)}:${String(Math.floor(game.time%60)).padStart(2,'0')}`;
  $('result-stars').textContent=won?'★'.repeat(stars)+'☆'.repeat(3-stars):'';setHidden('next-btn',!won);$('next-btn').innerHTML=game.level.id===6?'无尽挑战 <span>→</span>':'下一章 <span>→</span>';
}
function handleEvents(){for(const e of game.drain()){audio.event(e.type);renderer.event(e,game);
  if(e.type==='gate'){const g=GATE_INFO[e.gate];toast(g.text,`#${g.color.toString(16).padStart(6,'0')}`);}
  if(e.type==='pickup'||e.type==='ability'||e.type==='wave')toast(e.text);
  if(e.type==='boss')toast(`首领现身 · ${e.text}`,'#fff0b1',2);
  if(e.type==='hurt'){$('damage-flash').classList.remove('flash');void $('damage-flash').offsetWidth;$('damage-flash').classList.add('flash');}
  if(e.type==='warning'){$('warning').textContent=e.text;setHidden('warning',false);warningTime=1.5;}
  if(e.type==='won'||e.type==='lost')finish();
}}
function openSettings(){settingsResume=game.status==='running';settingsPaused=!$('pause').hidden;if(settingsResume)game.pause();keys.clear();setHidden('pause',true);setHidden('settings',false);$('sound-btn').textContent=save.sound?'开启':'关闭';$('sound-btn').setAttribute('aria-pressed',String(save.sound));$('quality-select').value=save.quality;}
function closeSettings(){setHidden('settings',true);if(settingsResume)game.resume();if(settingsPaused)setHidden('pause',false);settingsResume=false;settingsPaused=false;}
function tick(t){const dt=Math.min(.25,(t-(lastTime||t))/1000);lastTime=t;
  if(countdown>0){countdown-=dt;const n=Math.max(1,Math.ceil(countdown/.8));if(n!==countdownNumber){countdownNumber=n;$('countdown').querySelector('strong').textContent=n;audio.tone(480,.12,'sine',.05);}if(countdown<=0){setHidden('countdown',true);game.resume();toast('突围开始','#fff2b7');if(!save.tutorial){setHidden('tutorial',false);tutorialTime=6;save.tutorial=true;persist();}}}
  input.axis=(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0);
  let remaining=dt;while(remaining>0){const step=Math.min(1/60,remaining);game.update(step,input);remaining-=step;}handleEvents();if(game.level&&game.status!=='menu')hudUI();
  if(toastTime>0){toastTime-=dt;if(toastTime<=0)$('toast').classList.remove('visible');}if(warningTime>0){warningTime-=dt;if(warningTime<=0)setHidden('warning',true);}if(tutorialTime>0){tutorialTime-=dt;if(tutorialTime<=0)setHidden('tutorial',true);}
  if(game.status==='running'||game.status==='menu'||game.status==='won'||game.status==='lost'||countdown>0)renderer.update(dt,game);else renderer.renderer.render(renderer.scene,renderer.camera);
  audio.update(dt,game.status==='running');requestAnimationFrame(tick);
}
try{
  renderer=new Renderer(canvas,save.quality);renderer.setHero(selectedHero);menuUI();$('loading').hidden=true;
  $('start-btn').addEventListener('click',()=>start());$('endless-btn').addEventListener('click',()=>start(6,true));$('pause-btn').addEventListener('click',pause);$('resume-btn').addEventListener('click',resume);$('restart-btn').addEventListener('click',()=>start(game.level.id,game.endless));$('menu-btn').addEventListener('click',toMenu);$('result-menu-btn').addEventListener('click',toMenu);$('retry-btn').addEventListener('click',()=>start(game.level.id,game.endless));$('next-btn').addEventListener('click',()=>{selectedLevel=Math.min(6,game.level.id+1);start(selectedLevel,game.level.id===6);});
  $('jump-btn').addEventListener('click',()=>game.jump());$('ability-btn').addEventListener('click',()=>game.ability());$('settings-btn').addEventListener('click',openSettings);$('close-settings').addEventListener('click',closeSettings);$('home-link').addEventListener('click',e=>{e.preventDefault();toMenu();});
  $('sound-btn').addEventListener('click',()=>{save.sound=!save.sound;audio.set(save.sound);$('sound-btn').textContent=save.sound?'开启':'关闭';$('sound-btn').setAttribute('aria-pressed',String(save.sound));persist();});$('quality-select').addEventListener('change',e=>{save.quality=e.target.value;renderer.setQuality(save.quality);persist();});
  $('fullscreen-btn').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await $('game-shell').requestFullscreen();$('fullscreen-btn').textContent=document.fullscreenElement?'退出全屏':'进入全屏';}catch{$('fullscreen-btn').textContent='当前浏览器不支持';}});
  document.addEventListener('keydown',e=>{if(e.target.matches('input,select,textarea'))return;const key=e.key.toLowerCase();if([' ','arrowleft','arrowright','arrowup','arrowdown'].includes(key))e.preventDefault();if(e.repeat){keys.add(key);return;}keys.add(key);
    if(key==='escape'||key==='p'){if(!$('settings').hidden)closeSettings();else if(game.status==='paused'&&countdown<=0)resume();else pause();}
    if(key===' '&&countdown<=0)game.jump();if(key==='e'&&countdown<=0)game.ability();});document.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
  let dragging=false,dragX=0,startX=0;
  canvas.addEventListener('pointerdown',e=>{if(game.status!=='running')return;dragging=true;dragX=e.clientX;startX=game.targetX;canvas.setPointerCapture(e.pointerId);});
  canvas.addEventListener('pointermove',e=>{if(dragging&&game.status==='running'){game.targetX=clamp(startX+(e.clientX-dragX)*7.2/(canvas.clientWidth*.68),-3.6,3.6);}});for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,()=>dragging=false);
  window.addEventListener('blur',()=>{keys.clear();pause();});document.addEventListener('visibilitychange',()=>{if(document.hidden){keys.clear();pause();}});
  if(new URLSearchParams(location.search).has('test'))window.__NEON__={game,renderer,state:()=>game.snapshot(),save:()=>structuredClone(save),start:(l,h='lin')=>{selectedHero=h;start(l);},skipCountdown:()=>{countdown=0;setHidden('countdown',true);game.resume();},step:(dt=.016,n=1)=>{for(let i=0;i<n;i++){game.update(dt);handleEvents();}renderer.update(.016,game);hudUI();},finishUI:finish};
  requestAnimationFrame(tick);
}catch(error){$('loading').hidden=true;setHidden('fatal',false);$('fatal-detail').textContent=String(error);console.error(error);}
