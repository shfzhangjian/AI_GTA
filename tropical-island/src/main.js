import {IslandGame,PEARLS,LOCATIONS,waterAllowed} from './game-state.js';
import {IslandWorld} from './world.js';
import {IslandAudio} from './audio.js';

const $=id=>document.getElementById(id),storageKey='tidelands-journey-v1'+(new URLSearchParams(location.search).has('qa')?'-qa':'');
let saved=null;try{saved=JSON.parse(localStorage.getItem(storageKey));}catch{}
let game=new IslandGame(saved),world,audio=new IslandAudio(),selected=null,keys={},toastTimer=null,lastSave=0,dragStart=null;
try{world=new IslandWorld($('world'));}catch(error){$('loading').innerHTML='<p>这台设备暂时无法打开 3D 海岛</p><small>请使用支持 WebGL 的 Chrome / Edge 浏览器。</small>';console.error(error);throw error;}
const markers=LOCATIONS.map((location,i)=>{const button=document.createElement('button');button.className='marker';button.dataset.index=i+1;button.textContent=location.name;button.setAttribute('aria-label','探索'+location.name);button.addEventListener('click',()=>openLocation(location.id));$('markers').append(button);const listButton=document.createElement('button');listButton.innerHTML=`<span>0${i+1}</span>${location.name}`;listButton.addEventListener('click',()=>openLocation(location.id));$('locationsList').append(listButton);return {button,location,listButton};});
const pearlButtons=PEARLS.map(([x,z],i)=>{const b=document.createElement('button');b.className='pearl-marker';b.textContent='✧';b.setAttribute('aria-label',`驶向第${i+1}颗珍珠`);b.title='点击，让小船驶向珍珠';b.hidden=true;b.addEventListener('click',()=>{if(game.sailTo(x,z)){closeLocation();world.setGoal(x,z);world.controls.autoRotate=false;$('orbitBtn').classList.remove('active');}});$('markers').append(b);return b;});
function toast(message){$('toast').textContent=message;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,3400);}
function save(){try{localStorage.setItem(storageKey,JSON.stringify(game.serialize()));}catch{}}
function updateUI(){
 $('intro').hidden=game.started;$('mission').hidden=!game.started;$('hudStatus').hidden=!game.started;$('touchControls').hidden=!game.started||!matchMedia('(pointer:coarse)').matches;
 $('pearlCount').textContent=game.pearls;$('repairCount').textContent=`${game.restored.length} / 4`;$('progressFill').style.width=`${game.collected.length/8*100}%`;$('progressLabel').textContent=`${game.collected.length} / 8`;
 if(game.complete){$('missionTitle').textContent='把这片海，留在心里。';$('missionText').textContent='四处地标都已点亮。继续自由航行，或者为你的岛拍一张纪念照。';}
 else if(game.pearls>=2){$('missionTitle').textContent='让一处风景，亮起来。';$('missionText').textContent='珍珠足够了。点击岛上的地标，用 2 颗珍珠点亮它，再去寻找下一处闪光。';}
 else if(game.collected.length===8){$('missionTitle').textContent='最后一盏灯，在等你。';$('missionText').textContent='海上的珍珠已收齐，点亮剩下的地标，完成你的海岛旅程。';}
 else{$('missionTitle').textContent='去海上，找一点闪光。';$('missionText').textContent='点击珍珠，小船会自动驶向它。收集 2 颗珍珠，就能点亮一处地标。';}
 markers.forEach(m=>{m.button.classList.toggle('restored',game.restored.includes(m.location.id));m.listButton.classList.toggle('active',m.location.id===selected);});
 if(selected)updateLocation();
 $('controlHint').innerHTML=game.started?'WASD 驾船 <span>·</span> 点击海面自动航行':'拖动环视 <span>·</span> 滚轮缩放 <span>·</span> 点击地标探索';
}
function openLocation(id){if(game.paused)return;selected=id;game.discover(id);$('locationPanel').hidden=false;world.focus(id);$('orbitBtn').classList.remove('active');updateLocation();save();}
function updateLocation(){const index=LOCATIONS.findIndex(p=>p.id===selected),l=LOCATIONS[index];if(!l)return;const restored=game.restored.includes(l.id);$('locationIndex').textContent=`ISLAND FIELD NOTES / 0${index+1}`;$('locationSymbol').textContent=l.symbol;$('locationTitle').textContent=l.name;$('locationText').textContent=l.description;$('locationState').classList.toggle('restored',restored);
 if(l.cost===0){$('locationState').textContent='自然的礼物 · 已发现';$('repairBtn').textContent='回到全岛视角 ↗';$('repairBtn').disabled=false;}
 else if(restored){$('locationState').textContent='✧ 已点亮 · 海岛记住了你的温柔';$('repairBtn').textContent='回到全岛视角 ↗';$('repairBtn').disabled=false;}
 else {$('locationState').textContent=game.started?`需要 2 颗珍珠 · 你拥有 ${game.pearls} 颗`:'启航后，收集珍珠即可点亮这里';$('repairBtn').textContent=game.started?'点亮地标 · ◈ 2':'先启航探索 →';$('repairBtn').disabled=game.started&&game.pearls<2;}
 markers.forEach(m=>m.listButton.classList.toggle('active',m.location.id===selected));
}
function closeLocation(){selected=null;$('locationPanel').hidden=true;}
function start(){game.start();updateUI();closeLocation();save();world.home();world.controls.autoRotate=false;$('orbitBtn').classList.remove('active');toast('点击海上发光的珍珠，小船会带你去。');$('world').focus();}
$('startBtn').addEventListener('click',start);
$('repairBtn').addEventListener('click',()=>{const l=LOCATIONS.find(p=>p.id===selected);if(!game.started){start();return;}if(l.cost===0||game.restored.includes(l.id)){closeLocation();world.home();return;}if(game.repair(l.id)){handleEvents();updateUI();save();}});
$('closePanel').addEventListener('click',closeLocation);
$('journalBtn').addEventListener('click',()=>openLocation(LOCATIONS.find(p=>p.cost&&!game.restored.includes(p.id))?.id||'harbor'));
$('homeBtn').addEventListener('click',()=>{closeLocation();world.home();});
$('orbitBtn').addEventListener('click',()=>{world.controls.autoRotate=!world.controls.autoRotate;$('orbitBtn').classList.toggle('active',world.controls.autoRotate);});
$('timeBtn').addEventListener('click',()=>{const isNight=world.nightTarget===0;world.setNight(isNight);document.body.classList.toggle('night',isNight);$('timeLabel').textContent=isNight?'暮色':'晴日';$('weatherIcon').textContent=isNight?'☾':'☀';$('timeBtn').setAttribute('aria-label',isNight?'切换为晴日':'切换为暮色');});
$('soundBtn').addEventListener('click',async()=>{try{const on=await audio.toggle();$('soundBtn').innerHTML=on?'<svg viewBox="0 0 24 24"><path d="M10 5L5 9H2v6h3l5 4zM14 8a6 6 0 010 8M17 5a10 10 0 010 14"/></svg>':'<svg viewBox="0 0 24 24"><path d="M10 5L5 9H2v6h3l5 4zM15 8l6 8M21 8l-6 8"/></svg>';$('soundBtn').setAttribute('aria-label',on?'关闭声音':'打开声音');toast(on?'听，海风来了。':'海岛声音已关闭。');}catch{toast('声音暂时不可用，仍可继续探索。');}});
function photo(){document.body.classList.add('photo');requestAnimationFrame(async()=>{try{await world.photograph();toast('海岛照片已生成 · 请查看浏览器下载。');}catch{toast('照片生成失败，请重试。');}finally{setTimeout(()=>document.body.classList.remove('photo'),250);}});}
$('photoBtn').addEventListener('click',photo);$('winPhotoBtn').addEventListener('click',photo);
$('fullscreenBtn').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{toast('当前浏览器不支持全屏，可放大浏览器窗口。');}});
let helpWasPaused=false;
function showHelp(){helpWasPaused=game.paused;game.paused=true;keys={};$('helpOverlay').hidden=false;}
function hideHelp(){$('helpOverlay').hidden=true;game.paused=helpWasPaused;}
$('helpBtn').addEventListener('click',showHelp);$('closeHelp').addEventListener('click',hideHelp);$('helpDone').addEventListener('click',hideHelp);
function pause(){game.paused=true;keys={};world.controls.autoRotate=false;$('orbitBtn').classList.remove('active');$('pauseOverlay').hidden=false;save();}
function resume(){game.paused=false;$('pauseOverlay').hidden=true;$('world').focus();}
$('pauseBtn').addEventListener('click',pause);$('resumeBtn').addEventListener('click',resume);
function reset(){game=new IslandGame();world.pearls.forEach(p=>p.group.visible=true);Object.values(world.landmarks).forEach(l=>{l.active=false;for(const {bulb,s}of l.lights){bulb.material.emissiveIntensity=.18;s.material.opacity=.02;}l.windows?.forEach(w=>w.material.emissiveIntensity=.12);});world.landmarks.tower.lantern.material.emissiveIntensity=.3;world.landmarks.garden.corals.forEach(m=>m.emissiveIntensity=0);closeLocation();$('pauseOverlay').hidden=true;world.home();save();updateUI();}
let resetArmed=false;$('resetBtn').addEventListener('click',()=>{if(!resetArmed){resetArmed=true;$('resetBtn').textContent='再次点击，清除本次进度';setTimeout(()=>{resetArmed=false;$('resetBtn').textContent='重新开始旅程';},5000);return;}resetArmed=false;reset();$('resetBtn').textContent='重新开始旅程';});
$('continueBtn').addEventListener('click',()=>{$('completion').hidden=true;game.paused=false;world.home();if(!world.nightTarget)$('timeBtn').click();world.controls.autoRotate=true;$('orbitBtn').classList.add('active');});
$('world').addEventListener('pointerdown',e=>{dragStart={x:e.clientX,y:e.clientY};});
$('world').addEventListener('pointerup',e=>{const start=dragStart;dragStart=null;if(!start||Math.hypot(e.clientX-start.x,e.clientY-start.y)>5||e.button!==0)return;if(game.paused)return;const picked=world.pick(e.clientX,e.clientY);if(!picked)return;if(picked.location){openLocation(picked.location);return;}if(!game.started){toast('点击「启航探索」，开始你的海岛旅程。');return;}let target=picked.water;if(picked.pearl!==undefined){const [x,z]=PEARLS[picked.pearl];target={x,z};}if(target){if(game.sailTo(target.x,target.z)){world.setGoal(target.x,target.z);world.controls.autoRotate=false;$('orbitBtn').classList.remove('active');}else toast('这里是陆地。试着点击旁边的海面。');}});
$('world').addEventListener('pointermove',e=>{if(dragStart)return;const picked=world.pick(e.clientX,e.clientY);$('world').style.cursor=picked?.location||picked?.pearl!==undefined?'pointer':'grab';});
$('world').addEventListener('pointercancel',()=>dragStart=null);
world.controls.addEventListener('start',()=>{world.controls.autoRotate=false;world.focusTween=null;$('orbitBtn').classList.remove('active');});
const keyMap={w:'up',W:'up',ArrowUp:'up',s:'down',S:'down',ArrowDown:'down',a:'left',A:'left',ArrowLeft:'left',d:'right',D:'right',ArrowRight:'right'};
addEventListener('keydown',e=>{if(e.key==='Escape'){if(!$('helpOverlay').hidden)hideHelp();else if(!$('pauseOverlay').hidden)resume();else if(!$('locationPanel').hidden)closeLocation();else if(game.started)pause();return;}if(keyMap[e.key]&&game.started){e.preventDefault();keys[keyMap[e.key]]=true;world.controls.autoRotate=false;$('orbitBtn').classList.remove('active');}});
addEventListener('keyup',e=>{if(keyMap[e.key])keys[keyMap[e.key]]=false;});addEventListener('blur',()=>{keys={};});
document.querySelectorAll('#touchControls button').forEach(b=>{const key=keyMap[b.dataset.key];b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);keys[key]=true;});for(const event of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(event,()=>keys[key]=false);});
function handleEvents(){for(const event of game.events.splice(0)){if(event.type==='pearl'){world.collect(event.id);audio.collect();toast(`拾到一颗海上珍珠 · ${game.collected.length} / 8`);updateUI();save();}else if(event.type==='repair'){world.activate(event.id);audio.repair();toast(`${LOCATIONS.find(p=>p.id===event.id).name}，亮起来了。`);}else if(event.type==='complete'){closeLocation();setTimeout(()=>{game.paused=true;keys={};$('completion').hidden=false;world.home();},1200);}}}
game.collected.forEach(i=>world.pearls[i].group.visible=false);game.restored.forEach(id=>world.activate(id));world.controls.autoRotate=!game.started;$('orbitBtn').classList.toggle('active',world.controls.autoRotate);updateUI();
let previous=performance.now(),frame=0,frames=0,fpsStart=previous;
function animate(now){requestAnimationFrame(animate);const dt=Math.min((now-previous)/1000,.05);previous=now;game.update(dt,keys);handleEvents();world.update(dt,game);const placed=[];markers.forEach(({button,location})=>{const p=world.project(location);const spacing=innerWidth<700?25:100;for(let n=0;n<5;n++){if(placed.some(q=>Math.abs(p.x-q.x)<spacing&&Math.abs(p.y-q.y)<27))p.y+=28;else break;}placed.push({x:p.x,y:p.y});button.style.transform=`translate(${p.x}px,${p.y}px) translate(-50%,-100%)`;button.style.opacity=p.visible&&p.x>40&&p.x<innerWidth-40&&p.y>80&&p.y<innerHeight-100?'1':'0';button.style.pointerEvents=button.style.opacity==='0'?'none':'auto';});
 if(frame++%20===0){$('boatStatus').textContent=game.paused?'旅程暂停中':game.path.length?'小船正在航行 · 海风相伴':'小船停泊中';document.body.dataset.gameState=game.complete?'complete':game.started?'playing':'intro';document.body.dataset.collected=game.collected.length;document.body.dataset.restored=game.restored.length;}
 pearlButtons.forEach((b,i)=>{b.hidden=!game.started||game.collected.includes(i);if(b.hidden)return;const [x,z]=PEARLS[i],p=world.project({x,y:.5,z});b.style.transform=`translate(${p.x}px,${p.y}px) translate(-50%,-50%)`;b.style.opacity=p.visible&&p.x>15&&p.x<innerWidth-15&&p.y>85&&p.y<innerHeight-75?'1':'0';b.style.pointerEvents=b.style.opacity==='0'?'none':'auto';});
 if(game.started&&now-lastSave>3000){save();lastSave=now;}frames++;if(now-fpsStart>1000){document.body.dataset.fps=Math.round(frames*1000/(now-fpsStart));document.body.dataset.drawCalls=world.renderer.info.render.calls;document.body.dataset.boatX=game.boat.x.toFixed(2);document.body.dataset.boatZ=game.boat.z.toFixed(2);frames=0;fpsStart=now;}
}
requestAnimationFrame(animate);requestAnimationFrame(()=>{$('loading').style.opacity=0;setTimeout(()=>$('loading').hidden=true,550);});
addEventListener('pagehide',save);
// Readable diagnostics help verify the actual runtime without affecting gameplay.
window.tidelands={get state(){return game.serialize();},get rendering(){return {calls:world.renderer.info.render.calls,triangles:world.renderer.info.render.triangles,webgl:world.renderer.capabilities.isWebGL2};}};
