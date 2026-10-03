import {sim,state,start,selectUpgrade,launch,snapshot} from './game.js';
import {V,arc,toward} from './core.js';
import {BIOMES} from './worlds.js';

const source=document.querySelector('#game');
const output=document.createElement('canvas');output.width=1280;output.height=720;
const ctx=output.getContext('2d');
const btn=document.createElement('button');btn.textContent='开始实机录制';
Object.assign(btn.style,{position:'fixed',right:'28px',bottom:'26px',zIndex:1000,padding:'12px 20px',background:'#89f4dc',border:'none',borderRadius:'10px',font:'bold 16px Microsoft YaHei',cursor:'pointer'});
document.body.append(btn);
const status=document.createElement('div');status.id='record-status';
Object.assign(status.style,{position:'fixed',right:'28px',bottom:'82px',zIndex:1000,color:'white',font:'14px Microsoft YaHei'});document.body.append(status);
let active=false,recordStart=0,recorder,chunks=[],trace=[],phaseStart=0,lastPhase='title',finishedAt=0;
let titleSeconds=5,endingSeconds=5;
function box(x,y,w,h,color='#091429e8',r=12){ctx.fillStyle=color;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();}
function txt(t,x,y,size=20,color='#f2f7ff',align='left'){ctx.font=`${size>=25?'bold ':''}${size}px "Microsoft YaHei", sans-serif`;ctx.fillStyle=color;ctx.textAlign=align;ctx.fillText(t,x,y);}
function lines(text,x,y,max=42){let a=String(text).match(new RegExp(`.{1,${max}}`,'g'))||[];a.forEach((s,i)=>txt(s,x,y+i*25,16,'#c1cee2'));}
function bot(){
 if(!active||sim.phase!=='playing')return {};
 const p=sim.player,cf=sim.camForward,r=V().crossVectors(cf,p.n).normalize();
 let nearest=null,d=Infinity;for(const e of sim.enemies){const q=arc(e.n,p.n);if(q<d){d=q;nearest=e}}
 let move=V();if(nearest){const t=toward(p.n,nearest.n);if(d>6)move.copy(t);else if(d<4)move.copy(t).negate();else move.crossVectors(t,p.n).normalize();}
 return {x:move.dot(r),y:move.dot(cf),fire:true,dash:d<2.8&&p.hp<40,autoAim:true};
}
window.__recordInput=bot;
function overlay(t){
 ctx.drawImage(source,0,0,1280,720);
 box(0,0,1280,75,'#060d1dec',0);txt('✦  星环漫游',34,43,28,'#8df4db');txt('STARBLOOM ODYSSEY',262,43,17,'#c8d3e9');txt('浏览器实机录制 · 自动操作演示',1244,42,15,'#adbedb','right');
 if(sim.phase==='title'){
  box(55,125,490,390);txt('小小星球，无尽旅途',88,172,18,'#8df4db');txt('沿着星球的弧线奔跑',88,227,34);
  txt('球面重力 × 射击 × 随机强化',88,283,24,'#d3e1f4');txt('五种环境 · 十五波战斗',88,337,23);txt('真实游戏画面 / 原创 Three.js 网页游戏',88,402,16,'#adbedb');
 }else{
  box(28,94,230,76);txt(BIOMES[sim.level].name,45,126,25);txt(`第 ${Math.max(1,sim.wave)} / 3 波 · 航程 ${sim.visited.length} / 5`,45,154,15,'#aebfd7');
  box(910,94,342,76);txt(`生命 ${Math.ceil(sim.player.hp)} / ${sim.stats.maxHp}`,931,124,20);txt(`击破 ${sim.kills}  ·  剩余 ${sim.enemies.length}`,931,153,18,'#8df4db');
 }
 if(sim.phase==='upgrade'){
  box(175,213,930,339,'#071127f5');txt('让星光成为你的力量',640,260,34,'#eaf8ff','center');txt('星球净化完成 · 从真实候选项中选择强化',640,296,18,'#b0c5de','center');
  state.upgradeChoices.forEach((u,i)=>{box(202+i*289,320,271,203,'#172643');txt(u.tag,223+i*289,353,17,'#8df4db');txt(u.name,223+i*289,399,23);lines(u.desc,223+i*289,443,14)});
 }else if(sim.phase==='route'){
  box(165,240,950,243,'#071127f5');txt('下一颗星球，由你选择',640,286,32,'#eaf8ff','center');
  BIOMES.forEach((b,i)=>{const x=192+i*180;box(x,317,168,133,sim.visited.includes(i)?'#172235':'#203b4b');txt(`0${i+1}`,x+20,350,18,'#8df4db');txt(b.name,x+20,392,22);txt(sim.visited.includes(i)?'已清理':'即将启航',x+20,427,15,'#b0c5de')});
 }else if(sim.phase==='won'||sim.phase==='dead'){
  box(237,211,806,303,'#071127ed');txt(sim.phase==='won'?'整片星空，为你闪耀':'旅途还没有结束',640,285,36,'#8df4db','center');txt(`净化 ${sim.visited.length} 颗星球 · 击破 ${sim.kills} 个敌人`,640,337,25,'#edf7ff','center');txt('立即试玩：shfzhangjian.github.io/AI_GTA/starbloom/',640,412,20,'#cedff7','center');
 }
 box(0,655,1280,65,'#060d1ded',0);txt('WASD 移动  ·  鼠标 / 空格射击  ·  Shift 冲刺  ·  Q / E 转动视角',34,694,19,'#cfdaeb');txt(`${t.toFixed(0)}s`,1245,694,17,'#8df4db','right');
}
window.__recordFrame=now=>{
 if(!active)return;const t=(now-recordStart)/1000;
 if(sim.phase!==lastPhase){lastPhase=sim.phase;phaseStart=t;trace.push({t,kind:'phase',...snapshot()});}
 if(sim.phase==='title'&&t>=titleSeconds)start(0);
 if(sim.phase==='upgrade'&&t-phaseStart>3.3){const order=['rapid','health','split','leech','power','pierce','dash','speed'];const u=order.map(id=>state.upgradeChoices.find(v=>v.id===id)).find(Boolean);trace.push({t,kind:'upgrade-choice',offered:state.upgradeChoices.map(v=>v.id),chosen:u.id});selectUpgrade(u.id);}
 if(sim.phase==='route'&&t-phaseStart>2.8)launch([0,1,2,3,4].find(i=>!sim.visited.includes(i)));
 overlay(t);status.textContent=`录制中 ${t.toFixed(0)} 秒 · ${BIOMES[sim.level].name} · ${sim.phase}`;
 if(sim.phase==='won'||sim.phase==='dead'){finishedAt ||= t;if(t-finishedAt>endingSeconds)stop();}
 if(t>430)stop();
};
async function stop(){if(!active)return;active=false;trace.push({t:(performance.now()-recordStart)/1000,kind:'final',...snapshot()});recorder.stop();status.textContent='正在保存实机录像';}
btn.onclick=()=>{if(active)return;btn.style.display='none';chunks=[];trace=[];recordStart=performance.now();lastPhase='title';phaseStart=0;finishedAt=0;
 const mime=['video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm'].find(t=>MediaRecorder.isTypeSupported(t));
 recorder=new MediaRecorder(output.captureStream(30),{mimeType:mime,videoBitsPerSecond:6000000});
 recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};
 recorder.onstop=async()=>{const blob=new Blob(chunks,{type:mime});await fetch('/save-video',{method:'POST',body:blob});await fetch('/save-trace',{method:'POST',body:JSON.stringify({recording:'actual WebGL game frames; automated controls; original simulation stats unchanged',viewport:{width:innerWidth,height:innerHeight},video:{width:1280,height:720,fps:30},trace},null,2)});status.textContent=`录制完成 · ${sim.kills} 次击破 · ${sim.visited.length} 颗星球`;document.title='录制完成 · STARBLOOM';};
 active=true;recorder.start(1000);trace.push({t:0,kind:'begin',...snapshot()});
};
