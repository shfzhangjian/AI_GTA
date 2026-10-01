import { IslandWorld } from './world.js';
import { ForestAudio } from './audio.js';
import { selection as selectBoard, expandSpecials as expandBoard, collapseBoard } from './rules.js';

const $=id=>document.getElementById(id);
const audio=new ForestAudio();
const types=['grass','grass','grass','gold','blue','pink','wood'];
const names={grass:'青苔',gold:'蜂蜜晶石',blue:'溪蓝晶石',pink:'桃桃晶石',wood:'小树桩',bomb:'蘑菇炸弹',rainbow:'彩虹矿石'};
const chapters=['青苔森林','蜜糖溪谷','桃桃花园','月光矿洞','彩虹秘境'];
const targetSets=[[18,12],[22,16],[25,20],[28,24],[32,28]];
let board=[],level=0,moves=32,maxMoves=32,score=0,grass=0,gems=0,bombs=2,rainbows=1,tool='hammer',phase='ready',locked=false,hover=null,world=null,timer=null,toastTimer=null,nextId=0,seed=2311;
let best=0,completed=0;
try{best=Number(localStorage.getItem('moss-best')||0);completed=Number(localStorage.getItem('moss-completed')||0);}catch{}
function random(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;}
function randomType(){return types[Math.floor(random()*types.length)];}
function initialBoard() {
  const result=[];
  for(let row=0;row<7;row++)for(let col=0;col<7;col++){
    // Patches make the first island readable, with several rewarding chains.
    let type=randomType();
    if(level===0){if(row<3&&col<3)type='grass';if(row>=4&&col>=4)type='gold';if(row<3&&col>=4)type='pink';if(row>=4&&col<2)type='blue';if(row===3&&col>=2&&col<=4)type='wood';}
    result.push({row,col,type,id:nextId++});
  }
  result.find(t=>t.row===3&&t.col===5).type='bomb';
  result.find(t=>t.row===5&&t.col===2).type='rainbow';
  return result;
}
function save(){best=Math.max(best,score);try{localStorage.setItem('moss-best',String(best));localStorage.setItem('moss-completed',String(completed));}catch{}}
function updateUI() {
  $('score').textContent=score.toLocaleString('en-US');$('moves').textContent=moves;
  const [a,b]=targetSets[level];$('grass-count').textContent=Math.min(grass,a);$('gem-count').textContent=Math.min(gems,b);$('grass-target').textContent=` / ${a}`;$('gem-target').textContent=` / ${b}`;
  document.querySelectorAll('.goal')[0].classList.toggle('complete',grass>=a);document.querySelectorAll('.goal')[1].classList.toggle('complete',gems>=b);
  $('grass-progress').style.width=Math.min(100,grass/a*100)+'%';$('gem-progress').style.width=Math.min(100,gems/b*100)+'%';
  $('moves-ring').style.strokeDashoffset=String(245*(1-moves/maxMoves));$('moves-ring').style.stroke=moves<7?'#ce9b80':'#a4b886';
  $('bomb-count').textContent=bombs;$('rainbow-count').textContent=rainbows;
  document.querySelectorAll('[data-tool]').forEach(button=>{const active=button.dataset.tool===tool;button.classList.toggle('selected',active);button.setAttribute('aria-pressed',String(active));button.disabled=(button.dataset.tool==='bomb'&&bombs===0)||(button.dataset.tool==='rainbow'&&rainbows===0);});
  $('mission-level').textContent=`LEVEL 0${level+1}`;$('chapter-count').textContent=`0${level+1} / 05`;$('chapter-name').textContent=`第${['一','二','三','四','五'][level]}章 · ${chapters[level]}`;
  $('start-button').innerHTML=phase==='ready'?'<span>开始探险</span><svg><use href="#i-arrow"/></svg>':phase==='paused'?'<span>继续探险</span><svg><use href="#i-play"/></svg>':'<span>探险进行中</span><svg><use href="#i-leaf"/></svg>';
  $('start-note').textContent=phase==='ready'?'没有倒计时，按自己的节奏来。':`${chapters[level]} · 相邻同色，一起敲开`;
  if(phase==='won')$('start-button').innerHTML=`<span>${level===4?'再玩一次':'下一关'}</span><svg><use href="#i-arrow"/></svg>`;
  if(phase==='lost')$('start-button').innerHTML='<span>再试一次</span><svg><use href="#i-refresh"/></svg>';
  $('start-button').hidden=['playing','paused'].includes(phase);
  $('shuffle-button').disabled=phase!=='playing'||locked||moves<2;
  $('pause-button').disabled=phase==='ready'||phase==='won'||phase==='lost'||locked;
  $('pause-button').setAttribute('aria-label',phase==='paused'?'继续':'暂停');
  $('pause-button').innerHTML=`<svg><use href="#i-${phase==='paused'?'play':'pause'}"/></svg>`;
}
function toast(message){clearTimeout(toastTimer);$('toast').textContent=message;$('toast').classList.add('show');toastTimer=setTimeout(()=>$('toast').classList.remove('show'),3100);}
function reset(next=false) {
  clearTimeout(timer);timer=null;locked=false;hover=null;world?.clearParticles();
  if(!next){level=0;score=0;bombs=2;rainbows=1;seed=2311;}
  else{bombs=Math.max(2,bombs);rainbows=Math.max(1,rainbows);seed+=level*971;}
  grass=0;gems=0;moves=maxMoves=32+level*2;phase='ready';tool='hammer';board=initialBoard();world?.setBoard(board);world?.setTheme(level);world.motion=true;audio.pause();
  $('combo-label').textContent='点同色，连锁消除';$('combo-value').textContent='HELLO, EXPLORER';$('bunny-note').textContent='准备好了吗？';updateUI();
}
async function start(){
  if(phase==='ready'){await audio.unlock();phase='playing';audio.startAmbience();audio.select();updateUI();toast('试着敲一片青苔 · 相邻同色会一起消除');}
  else if(phase==='paused'){closeModal();}
  else if(phase==='playing')toast('点击小岛上的砖块，开始连锁开采吧！');
  else if(phase==='won'){hideModal();if(level===4)reset();else{level++;reset(true);}start();}
  else if(phase==='lost'){hideModal();reset(true);start();}
}
function chooseTool(name){
  if(locked)return;
  if(name==='bomb'&&!bombs||name==='rainbow'&&!rainbows){toast('工具用完啦，试试连消获得奖励');return;}
  tool=name;audio.select();updateUI();hoverTile(null);
  if(phase==='playing'&&name!=='hammer')toast(name==='bomb'?'蘑菇炸弹：点击砖块，炸开周围 3 × 3 区域':'彩虹魔法：点击砖块，收集全岛同类矿块');
}
function selection(tile){
  return selectBoard(board,tile,tool);
}
function hoverTile(tile,pos){
  if(!world)return;
  if(!tile||phase!=='playing'||locked){hover=null;world.clearHighlights();$('hover-tip').style.display='none';return;}
  if(tile!==hover){hover=tile;world.highlight(selection(tile),tool!=='hammer'||['bomb','rainbow'].includes(tile.type));}
  const group=selection(tile),tip=$('hover-tip');tip.textContent=`${names[tile.type]} · ${group.length>1?'连消 '+group.length+' 块':'敲开 1 块'}`;tip.style.display='block';
  if(pos){tip.style.left=Math.min(world.container.clientWidth-tip.offsetWidth-8,Math.max(8,pos.x+18))+'px';tip.style.top=Math.max(8,pos.y-42)+'px';}
}
function expandSpecials(selected){
  return expandBoard(board,selected);
}
function popup(tile,points,count){const p=world.project(tile),el=document.createElement('div');el.className='score-pop'+(count>=5?' special':'');el.style.left=p.x+'px';el.style.top=p.y+'px';el.textContent=count>=5?`✦ ${count} 连消  +${points}`:`+${points}`;$('float-layer').appendChild(el);setTimeout(()=>el.remove(),1200);}
async function hitTile(tile) {
  if(!tile||locked||phase==='paused'||phase==='won'||phase==='lost')return;
  if(phase==='ready'){toast('先点击「开始探险」，小兔就准备好啦！');return;}
  await audio.unlock();
  // Re-check after the async audio gesture to prevent rapid taps spending twice.
  if(locked||phase!=='playing')return;
  locked=true;const chosenTool=tool;
  const selected=expandSpecials(selection(tile));const special=chosenTool!=='hammer'||selected.some(t=>['bomb','rainbow'].includes(t.type));
  const amount=selected.length;const points=amount*25+Math.max(0,amount-2)*amount*5;
  moves--;score+=points;
  if(chosenTool==='bomb')bombs--;if(chosenTool==='rainbow')rainbows--;
  grass+=selected.filter(t=>t.type==='grass').length;gems+=selected.filter(t=>['blue','gold','pink','rainbow'].includes(t.type)).length;
  // Rewards are earned only with the mallet so spending a power-up can't mint itself.
  if(chosenTool==='hammer'&&!special&&amount>=5){bombs=Math.min(9,bombs+1);toast(`漂亮的 ${amount} 连消！蘑菇炸弹 +1`);}
  if(chosenTool==='hammer'&&!special&&amount>=8){rainbows=Math.min(5,rainbows+1);toast(`${amount} 连消！蘑菇炸弹 +1，彩虹魔法 +1`);}
  $('combo-label').textContent=amount>=8?'森林级大连消！':amount>=5?'一锤好多惊喜！':amount>=2?'好棒的连锁！':'慢慢来，也很棒';
  $('combo-value').textContent=`${amount} BLOCKS · +${points} POINTS`;
  $('bunny-note').textContent=amount>=5?'「哇！这一锤也太厉害啦！」':'「晶石在闪闪发光呢！」';
  popup(tile,points,amount);world.breakTiles(selected,special);selected.forEach(t=>t.removed=true);audio.hit(amount,special);hover=null;$('hover-tip').style.display='none';save();updateUI();
  timer=setTimeout(()=>{
    const collapsed=collapseBoard(board,selected,(row,col)=>({row,col,id:nextId++,type:randomType()}));board=collapsed.board;
    world.settle(board,collapsed.fresh);tool='hammer';
    timer=setTimeout(()=>{locked=false;updateUI();checkEnd();},430);
  },230);
}
function checkEnd(){
  const [a,b]=targetSets[level];
  if(grass>=a&&gems>=b){phase='won';score+=moves*50;completed=Math.max(completed,level+1);save();audio.win();audio.pause();updateUI();
    const stars=moves>=18?3:moves>=8?2:1;
    openModal(level===4?'森林探险完成！':'小岛通关！',`<div class="stars">${'★'.repeat(stars)}${'☆'.repeat(3-stars)}</div><div class="modal-stats"><div><strong>${score.toLocaleString()}</strong><span>探险积分</span></div><div><strong>+${moves*50}</strong><span>剩余奖励</span></div></div>`,level===4?'再玩一次':'下一关',start,'ISLAND COMPLETE','✧');
  }else if(moves<=0){phase='lost';audio.lose();audio.pause();save();updateUI();openModal('先让小锤休息一下',`<p>这次敲击用完了，离目标只差一点点。<br>多找相邻同色，记得用蘑菇和彩虹魔法！</p><div class="modal-stats"><div><strong>${grass}/${a}</strong><span>采集青苔</span></div><div><strong>${gems}/${b}</strong><span>发现晶石</span></div></div>`,'重新挑战本关',()=>{hideModal();reset(true);start();},'A LITTLE BREAK','♡');}
}
function shuffle(){
  if(phase!=='playing'||locked)return;if(moves<2){toast('重新排列需要 2 次敲击');return;}
  moves-=2;const all=board.map(t=>t.type);for(let i=all.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[all[i],all[j]]=[all[j],all[i]];}
  board.forEach((t,i)=>t.type=all[i]);world.setBoard(board);hover=null;audio.select();updateUI();toast('小岛换了个排列 · 消耗 2 次敲击');checkEnd();
}
let modalAction=null,modalPreviousFocus=null,pausedByModal=false;
function openModal(title,body,action,callback,kicker='THE FIELD GUIDE',art='✦') {
  if(!$('modal').hidden){hideModal();}
  if(phase==='playing'){phase='paused';pausedByModal=true;world.motion=false;audio.pause();}else pausedByModal=false;
  $('modal-title').textContent=title;$('modal-body').innerHTML=body;$('modal-action').textContent=action;$('modal-kicker').textContent=kicker;$('modal-art').textContent=art;
  modalAction=callback;modalPreviousFocus=document.activeElement;$('modal').hidden=false;$('modal-action').focus();hoverTile(null);updateUI();
}
function hideModal(){
  $('modal').hidden=true;
  if(pausedByModal&&phase==='paused'){phase='playing';world.motion=true;audio.startAmbience();pausedByModal=false;}
  modalPreviousFocus?.focus?.();updateUI();
}
function closeModal(){hideModal();}
function guide(){openModal('森林探险小册',`<div class="guide-row"><span><svg><use href="#i-hammer"/></svg></span><div><strong>一锤连消，越多越开心</strong><p>点击砖块，四向相邻的同类砖块一起消除。每锤消耗 1 次敲击；矿块会下落补齐。</p></div></div><div class="guide-row"><span><svg><use href="#i-mushroom"/></svg></span><div><strong>把惊喜连成一片</strong><p>连消 5 块奖励炸弹，8 块再送彩虹魔法。炸弹消除 3 × 3；彩虹工具消除全岛同类。</p></div></div><div class="guide-row"><span><svg><use href="#i-gem"/></svg></span><div><strong>藏在小岛上的特殊砖</strong><p>敲蘑菇触发范围爆破；敲彩虹矿石清除一整行和一整列。它们还能接力触发！</p></div></div><p>收齐青苔与晶石，解锁五座森林小岛。<br><small>1 / 2 / 3 选工具 · P 暂停 · M 音效 · R 重开<br>也支持手机触摸；没有时间限制。</small></p>`,'知道啦，去敲敲',closeModal);}
function pause(){
  if(locked)return;if(phase==='paused'){closeModal();return;}if(phase!=='playing')return;
  openModal('森林也需要慢慢呼吸',`<p>你的探险已经暂停。<br>喝口水，小兔阿苔会在这里等你。</p>`,'继续探险',closeModal,'TAKE YOUR TIME','☁');
}
function restart(){if(phase==='ready'){reset();toast('新的探险准备好了');return;}openModal('再出发一次？','<p>重新开始会回到第一座小岛。<br>最高积分会留在探险记录里。</p>','重新开始',()=>{save();hideModal();reset();start();},'A FRESH ADVENTURE','↻');}
function records(){openModal('每次探险，都有收获',`<div class="modal-stats"><div><strong>${best.toLocaleString()}</strong><span>最高探险积分</span></div><div><strong>${completed} / 5</strong><span>最远小岛记录</span></div></div><p>你的探险记录保存在这台设备上。<br>小小的进步，也值得一颗星星。</p>`,'继续我的探险',closeModal,'YOUR LITTLE MILESTONES','☆');}
function toggleSound(){const muted=audio.toggle();$('sound-button').innerHTML=`<svg><use href="#i-${muted?'mute':'sound'}"/></svg>`;$('sound-button').setAttribute('aria-label',muted?'开启音效':'关闭音效');$('sound-button').title=muted?'开启音效 · M':'关闭音效 · M';toast(muted?'安静敲敲 · 音效已关闭':'森林旋律 · 音效已开启');}

$('start-button').onclick=start;$('guide-button').onclick=guide;$('help-button').onclick=guide;$('records-button').onclick=records;$('island-button').onclick=()=>toast('你就在森间小岛 · 让我们敲开一些惊喜');
$('avatar-button').onclick=()=>openModal('阿苔，今天也在努力',`<p>喜欢青苔、胡萝卜和闪闪的晶石。<br>职业：森林里最小只的矿工。<br>梦想：让每座小岛都开满小花。</p>`,'一起去探险',closeModal,'MEET YOUR LITTLE FRIEND','ᵔᴥᵔ');
$('sound-button').onclick=toggleSound;$('shuffle-button').onclick=shuffle;$('pause-button').onclick=pause;$('restart-button').onclick=restart;
document.querySelectorAll('[data-tool]').forEach(b=>b.onclick=()=>chooseTool(b.dataset.tool));
$('modal-close').onclick=closeModal;$('modal-action').onclick=()=>modalAction?.();
$('modal').addEventListener('click',e=>{if(e.target===$('modal'))closeModal();});
document.addEventListener('keydown',e=>{
  if(e.repeat)return;
  if(!$('modal').hidden){if(e.key==='Escape')closeModal();if(e.key==='Tab'){const focusable=[$('modal-close'),$('modal-action')];const index=focusable.indexOf(document.activeElement);e.preventDefault();focusable[(index+(e.shiftKey?-1:1)+2)%2].focus();}return;}
  if(['1','2','3'].includes(e.key))chooseTool({1:'hammer',2:'bomb',3:'rainbow'}[e.key]);
  if(e.key.toLowerCase()==='p')pause();if(e.key.toLowerCase()==='m')toggleSound();if(e.key.toLowerCase()==='r')restart();
  if(e.key===' '&&phase==='ready'){e.preventDefault();start();}
});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&phase==='playing'&&!locked)pause();});

try {
  world=new IslandWorld($('scene'),hoverTile,hitTile);$('loading').remove();reset();
} catch(error){
  console.error(error);$('loading').hidden=true;$('boot-error').hidden=false;$('boot-error').textContent='小岛暂时无法显示。请使用支持 WebGL 的浏览器，并通过本地服务器打开本游戏。';
}

// A compact, read-only snapshot for playtesting and bug reports.
window.mossGame={getState:()=>({phase,level:level+1,score,moves,grass,gems,bombs,rainbows,tool,locked,targets:targetSets[level],tiles:board.map(t=>({id:t.id,row:t.row,col:t.col,type:t.type,screen:world?.project(t)})),audio:audio.ctx?{state:audio.ctx.state,muted:audio.muted}:null})};
