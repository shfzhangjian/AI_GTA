import { CubeModel, FACES, FACE_ORDER, inverse, parseMove, scramble, simplify } from './model.js';
import { CubeView } from './cube-view.js';

const $=id=>document.getElementById(id);
const paths={
  cube:'<path d="m12 2 9 5v10l-9 5-9-5V7z M3 7l9 5 9-5 M12 12v10"/>',
  book:'<path d="M12 5c-3-2-6-2-9-1v15c3-1 6-1 9 1 3-2 6-2 9-1V4c-3-1-6-1-9 1v15"/>',
  help:'<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 2-2.5 2-2.5 4 M12 16h.01"/>',
  keyboard:'<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M6 9h.01 M10 9h.01 M14 9h.01 M18 9h.01 M6 13h.01 M10 13h.01 M14 13h.01 M18 13h.01 M7 16h10"/>',
  hand:'<path d="M8 13V5a1.5 1.5 0 0 1 3 0v7-9a1.5 1.5 0 0 1 3 0v9-7a1.5 1.5 0 0 1 3 0v7-4a1.5 1.5 0 0 1 3 0v8c0 5-7 7-10 4l-6-6c-2-2 0-4 2-2l2 1"/>',
  spark:'<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5z M20 2v4 M18 4h4"/>',
  shuffle:'<path d="M3 6h3c5 0 7 12 12 12h3 M3 18h3c5 0 7-12 12-12h3 M18 3l3 3-3 3 M18 15l3 3-3 3"/>',
  focus:'<path d="M8 3H3v5 M16 3h5v5 M21 16v5h-5 M8 21H3v-5"/><circle cx="12" cy="12" r="4"/>',
  tag:'<path d="M4 20 11 4h2l7 16 M7 14h10"/>',
  mouse:'<rect x="6" y="2" width="12" height="20" rx="6"/><path d="M12 6v4"/>',
  refresh:'<path d="M20 7V3l-4 4a8 8 0 1 0 4 7 M20 3h-5"/>',
  compass:'<circle cx="12" cy="12" r="9"/><path d="m16 8-2 6-6 2 2-6z"/>',
  bulb:'<path d="M9 18h6 M9 21h6 M8 15c-5-5-1-12 4-12s9 7 4 12l-1 2H9z"/>',
  undo:'<path d="m8 4-5 5 5 5 M3 9h11a6 6 0 0 1 0 12h-2"/>',
  redo:'<path d="m16 4 5 5-5 5 M21 9H10a6 6 0 0 0 0 12h2"/>',
  copy:'<rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V3H3v13h5"/>',
  close:'<path d="m6 6 12 12 M6 18 18 6"/>',
  arrow:'<path d="M4 12h16 M14 6l6 6-6 6"/>',
  play:'<path d="m8 4 12 8-12 8z"/>',
  pause:'<path d="M8 4v16 M16 4v16"/>',
  check:'<path d="m5 12 4 4L19 6"/>'
};
function icon(name){return `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${paths[name]||paths.cube}</svg>`;}
function hydrateIcons(root=document){root.querySelectorAll('[data-icon]').forEach(e=>e.innerHTML=icon(e.dataset.icon));}
hydrateIcons();

const FORMULAS=[
  {name:'顺手公式',english:'SEXY MOVE',code:"R U R' U'",note:'右手最常用的四步练习。理解右层与上层的配合；完整执行六轮后回到原状态。',short:'建立右手转动的节奏，熟悉基础四步。'},
  {name:'左手顺手公式',english:'LEFT HAND',code:"L' U' L U",note:'顺手公式的左手镜像。正对左面判断 L 的方向；不要把左面的顺时针与前面的方向混淆。',short:'左右手一起练，让方向感更扎实。'},
  {name:'顶面十字',english:'TOP CROSS',code:"F R U R' U' F'",note:'用于底下两层已经还原时调整顶层棱块朝向。以 U 为目标顶面（本工具默认白色）；先把顶面的横线横着摆，拐角情况需调整角度或重复。',short:'调整顶层棱块朝向，形成顶面十字。'},
  {name:'小鱼公式',english:'SUNE',code:"R U R' U R U2 R'",note:'用于顶层十字完成后调整角块朝向。以 U 为目标顶面；小鱼形状需要摆到匹配的位置。其他情况需调整 U 或重复。',short:'顶层角块朝向练习，认识经典小鱼。'},
  {name:'中层右插',english:'RIGHT INSERT',code:"U R U' R' U' F' U F",note:'底层还原后，把顶层不含顶面色的棱块插入前右中层。先对齐前面中心色，并确认目标棱块应向右插入。',short:'把顶层棱块送到前右中层的位置。'},
  {name:'T 置换',english:'T PERM',code:"R U R' U' R' F R2 U' R' U' R U R' F'",note:'用于所有块朝向正确后，交换顶层的一对相邻角块和一对棱块。需要把待交换的块摆到对应位置；它不是通用的一步还原公式。',short:'观察顶层角块与棱块如何交换位置。'}
];
const cube=new CubeModel();
let history=[],actions=[],redoActions=[],scrambleText='',mode='free',selectedFace=null;
let busy=false,batch=false,autoplay=false,solution=null,solutionIndex=0,computing=false,solverReady=false,workerFailed=false,ticket=0;
let demo=null,demoSnapshot=null,elapsed=0,startedAt=null,viewMode='3d',toastTimer;
const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const STORE_KEY='cube-atelier-practice-v1';
let view;
const formatMove=m=>m.replace("'",'′');
const elapsedNow=()=>elapsed+(startedAt?Date.now()-startedAt:0);
const isLocked=()=>busy||batch||autoplay;
function notify(text){$('toast').textContent=text;$('toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('visible'),2800);}
function save(){
  if(demo)return;
  try{localStorage.setItem(STORE_KEY,JSON.stringify({history,actions,redoActions,scrambleText,mode,elapsed:elapsedNow()}));}catch{}
}
try{
  const saved=JSON.parse(localStorage.getItem(STORE_KEY));
  if(saved&&Array.isArray(saved.history)&&saved.history.length<10000&&saved.history.every(m=>/^[URFDLB](2|')?$/.test(m))){
    cube.apply(saved.history);history=saved.history;
    actions=(saved.actions||[]).filter(a=>a&&/^[URFDLB](2|')?$/.test(a.move));
    redoActions=(saved.redoActions||[]).filter(a=>a&&/^[URFDLB](2|')?$/.test(a.move));
    scrambleText=typeof saved.scrambleText==='string'?saved.scrambleText:'';mode=saved.mode==='guide'?'guide':'free';elapsed=Number(saved.elapsed)||0;
  }
}catch{cube.reset();history=[];}

function buildNet(container){
  const net=container.classList.contains('cube-net')?container:container.appendChild(Object.assign(document.createElement('div'),{className:'cube-net'}));
  net.innerHTML=FACE_ORDER.map(face=>`<button class="net-face" data-face="${face}" title="选择${FACES[face].name} ${face}" aria-label="选择${FACES[face].name} ${face}">${Array.from({length:9},(_,i)=>`<span class="net-tile" data-tile="${i}"></span>`).join('')}</button>`).join('');
  net.addEventListener('click',e=>{const button=e.target.closest('[data-face]');if(button&&!busy&&!batch)selectFace(button.dataset.face);});
}
buildNet($('cube-net'));buildNet($('large-net'));
$('face-legend').innerHTML=FACE_ORDER.map(f=>`<div class="legend-item"><i style="background:${FACES[f].color}"></i><b>${f}</b>${FACES[f].name}</div>`).join('');
$('face-controls').innerHTML=FACE_ORDER.map(f=>`<div class="face-control" data-control="${f}"><div class="face-control-title"><i style="background:${FACES[f].color}"></i><b>${f}</b>${FACES[f].name}<span>${f==='U'?'UP':f==='R'?'RIGHT':f==='F'?'FRONT':f==='D'?'DOWN':f==='L'?'LEFT':'BACK'}</span></div><div class="turn-buttons">${['',"'",'2'].map(s=>`<button data-move="${f+s}" aria-label="${FACES[f].name}${s==="'"?'逆时针90度':s==='2'?'转动180度':'顺时针90度'}" title="${FACES[f].name} ${formatMove(f+s)}">${formatMove(f+s)}</button>`).join('')}</div></div>`).join('');
$('formula-library').innerHTML=FORMULAS.map((f,i)=>`<button class="formula-card" data-formula="${i}"><h3>${f.name}<span>↗</span></h3><span class="eyebrow">${f.english}</span><div class="formula-code">${formatMove(f.code).replaceAll("'",'′')}</div><p>${f.short}</p></button>`).join('');

function renderNets(){
  document.querySelectorAll('.net-face').forEach(button=>{
    const face=button.dataset.face,colors=cube.face(face);
    button.classList.toggle('selected',selectedFace===face);button.setAttribute('aria-pressed',String(selectedFace===face));
    button.querySelectorAll('.net-tile').forEach((tile,i)=>{tile.style.background=FACES[colors[i]].color;tile.style.color=FACES[colors[i]].text;tile.textContent=i===4&&view?.labelsVisible!==false?face:'';});
  });
}
function selectFace(face){selectedFace=face;view?.highlight(face);renderNets();renderControls();$('viewer-annotation').textContent=`已选 ${face} · ${FACES[face].name}中心块`;}
function renderControls(){
  const current=nextExpected();
  document.querySelectorAll('[data-move]').forEach(button=>{button.disabled=isLocked();button.classList.toggle('active',mode==='guide'&&button.dataset.move===current);});
  document.querySelectorAll('[data-control]').forEach(e=>e.classList.toggle('selected',selectedFace===e.dataset.control));
  $('scramble').disabled=isLocked()||!!demo;$('reset-cube').disabled=isLocked()||!!demo;
  $('undo').disabled=isLocked()||!!demo||!actions.length;$('redo').disabled=isLocked()||!!demo||!redoActions.length;
  $('mode-free').disabled=busy||batch||!!demo;$('mode-guide').disabled=busy||batch||!!demo;
  ['free','guide'].forEach(m=>{$(`mode-${m}`).classList.toggle('selected',mode===m);$(`mode-${m}`).setAttribute('aria-pressed',String(mode===m));});
}
function renderStats(){
  const seconds=Math.floor(elapsedNow()/1000);
  $('timer').textContent=`${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;
  $('move-count').innerHTML=`${actions.length}<small>步</small>`;
  const percent=Math.round(cube.correctCount()/54*100);$('completion').innerHTML=`${percent}<small>%</small>`;$('completion-bar').style.width=percent+'%';
  $('state-label').textContent=demo?'公式演示':batch?'正在打乱':cube.isSolved()?'已还原':mode==='guide'?'指导中':'练习中';
  $('viewer-status').style.color=cube.isSolved()?'#7e8b71':'#999577';
}
function renderHistory(){
  const list=actions.slice(-36);
  $('history-moves').innerHTML=list.length?list.map(a=>`<span class="history-chip">${formatMove(a.move)}</span>`).join(''):'<span class="empty-history">'+(scrambleText?'打乱完成，轮到你了。':'你的第一步，从这里开始。')+'</span>';
  $('history-moves').scrollLeft=$('history-moves').scrollWidth;
  $('copy-scramble').disabled=!scrambleText||!!demo;
}
function nextExpected(){return demo?demo.formula.moves[demo.index]:solution?.[solutionIndex];}
function wireCube(){return '<div class="guide-illustration"><svg viewBox="0 0 140 140" aria-hidden="true"><path d="m70 20 44 25v51l-44 25-44-25V45Z M26 45l44 25 44-25 M70 70v51 M41 36l44 25v51 M55 28l44 26v50 M26 62l44 25 44-25 M26 79l44 25 44-25 M85 28 41 54v50 M99 36 55 61v51"/><path d="M21 17h11 M26 12v10 M116 110h11 M121 105v10" stroke="#b6c1a4"/></svg></div>';}
function directionSvg(move){
  const m=parseMove(move),fill=FACES[m.face].color,reverse=m.turns===-1;
  return `<div class="direction-graphic"><svg viewBox="0 0 120 120" aria-hidden="true"><g${reverse?' transform="translate(120 0) scale(-1 1)"':''}><path d="M60 14a46 46 0 1 1-36 17" fill="none" stroke="#a8b791" stroke-width="1.5"/><path d="m15 31 9 0 2 10" fill="none" stroke="#a8b791" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></g>${Array.from({length:9},(_,i)=>`<rect x="${34+(i%3)*18}" y="${34+Math.floor(i/3)*18}" width="16" height="16" rx="2" fill="${fill}" stroke="#e0e5d7" stroke-width=".5"/>`).join('')}<text x="60" y="63" fill="${FACES[m.face].text}" font-family="Arial" font-size="10" text-anchor="middle">${m.face}</text></svg></div>`;
}
function renderGuide(){
  const el=$('guide-content');
  if(demo){renderStepGuide(demo.formula.moves,demo.index,true);return;}
  $('guide-badge').textContent=mode==='guide'?'指导模式':'随时待命';
  if(computing){
    el.innerHTML=`<div class="guide-eyebrow">FINDING YOUR NEXT MOVE</div><h2 class="guide-title">给思路一点时间。</h2><p class="guide-copy">正在为当前魔方规划还原路线。<br>每一步都将配有方向说明。</p>${wireCube()}<button class="guide-cta" disabled><span class="spinner"></span>${solverReady?'计算还原路线…':'准备还原助手…'}</button>`;return;
  }
  if(cube.isSolved()&&actions.length){
    $('guide-badge').textContent='六面归位';
    el.innerHTML=`<div class="guide-eyebrow">EVERY TWIST WAS WORTH IT.</div><h2 class="guide-title">六面归位，做得好。</h2><p class="guide-copy">${actions.length} 次转动，${$('timer').textContent} 的专注。<br>颜色回到原位，新的节奏留在手里。</p><div class="guide-success">✳</div><div class="guide-checklist"><div><span>✓</span>六个面，全部同色</div><div><span>✓</span>再来一轮，巩固方向感</div></div><button class="guide-cta" data-action="scramble">${icon('shuffle')}再打乱一次 ${icon('arrow')}</button>`;return;
  }
  if(mode==='guide'&&solution?.length){renderStepGuide(solution,solutionIndex,false);return;}
  const solved=cube.isSolved();
  el.innerHTML=`<div class="guide-eyebrow">YOUR NEXT MOVE STARTS HERE</div><h2 class="guide-title">${solved?'每一步，都有方向。':'有思路，就慢慢来。'}</h2><p class="guide-copy">${solved?'先打乱，再探索。需要一点提示时，<br>我们会陪你找到下一步。':'自由观察、动手试试。遇到卡住的地方，<br>让助手为当前魔方找到还原路线。'}</p>${wireCube()}<div class="guide-checklist"><div><span>1</span>打乱魔方，开启新挑战</div><div><span>2</span>观察中心块，确定面与方向</div><div><span>3</span>跟随提示，一步步找回秩序</div></div><button class="guide-cta" data-action="${solved?'start-guide':'solve'}">${icon('compass')}${solved?'打乱并开始指导':'生成还原指导'}${icon('arrow')}</button>`;
}
function renderStepGuide(moves,index,isDemo){
  const complete=index>=moves.length;const current=moves[index];
  $('guide-badge').textContent=isDemo?'公式演示':`${moves.length-index} 步待完成`;
  if(isDemo&&complete){
    $('guide-content').innerHTML=`<div class="guide-eyebrow">A FORMULA, NOW IN YOUR HANDS.</div><h2 class="guide-title">${demo.formula.name}<br>演示完成。</h2><p class="guide-copy">这 ${moves.length} 步如何改变魔方，<br>现在你已经亲眼见过。</p><div class="guide-success">✳</div><div class="demo-banner">${demo.formula.note}</div><div class="guide-buttons"><button class="primary-button" data-action="demo-replay">${icon('refresh')}再练一遍</button><button class="subtle-button demo-exit" data-action="demo-exit">回到我的练习 ${icon('arrow')}</button></div>`;return;
  }
  if(!current)return;
  const m=parseMove(current),direction=m.turns===2?'转动 180°':m.turns===-1?'逆时针转动 90°':'顺时针转动 90°';
  const caption=isDemo?demo.formula.name:'一步一步，回到秩序。';
  $('guide-content').innerHTML=`<div class="guide-eyebrow">${isDemo?demo.formula.english:'A CLEAR PATH TO SOLVED'}</div><h2 class="guide-title ${isDemo?'demo-title':''}">${caption}</h2>${isDemo?`<div class="demo-banner">独立示例 · 退出后恢复你的练习<br>${demo.formula.short}</div>`:''}<div class="step-progress"><span>第 ${index+1} 步 / 共 ${moves.length} 步</span><span>${Math.round(index/moves.length*100)}%</span></div><div class="step-track"><span style="width:${index/moves.length*100}%"></span></div><div class="move-explanation"><div class="move-symbol">${formatMove(current)}</div><div><h3>${FACES[m.face].name} · ${m.face}</h3><p>${direction}<br>其余层保持不动</p></div></div>${directionSvg(current)}<p class="direction-note">想象自己正对「${FACES[m.face].name}」观察。<br>${m.turns===2?'180° 的两个方向，结果相同。':'箭头表示从该面外侧观察的方向。'}</p><div class="small-section-title">${isDemo?'完整公式':'当前还原路线'}<span>${isDemo?'FORMULA':'SOLUTION'}</span></div><div class="solution-moves">${moves.map((move,i)=>`<span class="solution-token ${i<index?'done':i===index?'current':''}">${formatMove(move)}</span>`).join('')}</div><div class="guide-buttons"><button class="primary-button" data-action="next" ${isLocked()?'disabled':''}>${icon('arrow')}执行这一步 · ${formatMove(current)}</button><button class="subtle-button" data-action="play" ${busy&&!autoplay?'disabled':''}>${icon(autoplay?'pause':'play')}${autoplay?'暂停连续演示':'连续演示'}</button>${isDemo?'<button class="subtle-button demo-exit" data-action="demo-exit">退出演示，继续练习</button>':''}</div>`;
}
function render(){renderNets();renderControls();renderStats();renderHistory();renderGuide();}
function invalidateSolution(){ticket++;solution=null;solutionIndex=0;computing=false;}
function stopTimer(){if(startedAt){elapsed=elapsedNow();startedAt=null;}}
async function performTurn(move,{record=true,source='manual',duration}={}){
  busy=true;
  const expected=nextExpected();
  if(!demo&&!startedAt)startedAt=Date.now();
  selectedFace=move[0];view?.highlight(selectedFace);render();
  try{
    if(view)await view.animateMove(move,duration??(reducedMotion?1:Math.abs(parseMove(move).turns)===2?420:310));
    else cube.move(move);
    history=simplify([...history,move]);
    if(record){actions.push({move,source});redoActions=[];}
    if(demo){if(move===expected)demo.index++;}
    else if(mode==='guide'&&solution){
      if(move===expected)solutionIndex++;
      else{invalidateSolution();notify('这一步改变了路线，正在重新规划。');}
    }
    if(cube.isSolved()&&!demo){stopTimer();if(actions.length)notify('六面归位！这一次的练习完成了。');}
    const nextMove=nextExpected();
    if(mode==='guide'&&nextMove){selectedFace=nextMove[0];view?.highlight(selectedFace);$('viewer-annotation').textContent=`已选 ${selectedFace} · ${FACES[selectedFace].name}中心块`;}
  }finally{busy=false;render();save();}
  if(!demo&&mode==='guide'&&!solution&&!cube.isSolved())requestSolution();
}
async function manualMove(move){
  if(isLocked())return;
  if(demo&&move!==nextExpected()){notify('请跟随当前演示步骤，或退出演示自由练习。');return;}
  await performTurn(move);
}
async function scrambleCube({guide=mode==='guide'}={}){
  if(isLocked()||demo)return;
  autoplay=false;batch=true;invalidateSolution();cube.reset();history=[];actions=[];redoActions=[];elapsed=0;startedAt=null;selectedFace=null;
  const moves=scramble(Number($('scramble-length').value));scrambleText=moves.join(' ');view?.rebuild();render();
  try{
    for(const move of moves){if(view)await view.animateMove(move,reducedMotion?1:50);else cube.move(move);renderNets();}
    history=[...moves];
  }finally{batch=false;view?.highlight(null);render();save();}
  notify(`已打乱 ${moves.length} 步，现在轮到你了。`);
  if(guide){mode='guide';requestSolution();}
}
function requestSolution(){
  if(demo||busy||batch)return;
  mode='guide';autoplay=false;
  if(cube.isSolved()){invalidateSolution();render();save();return;}
  computing=true;solution=null;solutionIndex=0;const id=++ticket,state=cube.asString();render();
  if(workerFailed||!solverWorker){fallbackSolution(id,state);return;}
  solverWorker.postMessage({id,state});
}
function acceptSolution(data){
  if(data.id!==ticket||data.state!==cube.asString()||demo)return;
  const check=cube.clone().apply(data.moves);
  if(!check.isSolved()){fallbackSolution(data.id,data.state);return;}
  computing=false;solution=data.moves;solutionIndex=0;
  if(solution[0])selectFace(solution[0][0]);render();save();
}
function fallbackSolution(id,state){
  const moves=simplify(history).reverse().map(inverse);
  acceptSolution({id,state,moves});notify('已生成按转动记录回溯的还原路线。');
}
let solverWorker;
try{
  solverWorker=new Worker('./solver-worker.js');
  solverWorker.onmessage=({data})=>{
    if(data.type==='ready'){solverReady=true;renderGuide();}
    else if(data.type==='solution')acceptSolution(data);
    else if(data.type==='init-error'){workerFailed=true;if(computing)fallbackSolution(ticket,cube.asString());}
    else if(data.type==='error'&&data.id===ticket){workerFailed=true;fallbackSolution(ticket,cube.asString());}
  };
  solverWorker.onerror=()=>{workerFailed=true;if(computing)fallbackSolution(ticket,cube.asString());};
}catch{workerFailed=true;}

async function next(){if(isLocked())return;const expected=nextExpected();if(expected)await performTurn(expected,{source:demo?'demo':'guide'});}
async function play(){
  if(autoplay){autoplay=false;render();return;}
  if(busy||batch||!nextExpected())return;
  autoplay=true;render();
  try{while(autoplay&&nextExpected()){
    await performTurn(nextExpected(),{source:demo?'demo':'guide',duration:reducedMotion?1:390});
    if(autoplay)await new Promise(resolve=>setTimeout(resolve,170));
  }}finally{autoplay=false;render();}
}
async function undo(){
  if(isLocked()||demo||!actions.length)return;
  const action=actions.pop();redoActions.push(action);invalidateSolution();
  await performTurn(inverse(action.move),{record:false,source:'undo'});
}
async function redo(){
  if(isLocked()||demo||!redoActions.length)return;
  const action=redoActions.pop();const rest=[...redoActions];invalidateSolution();
  await performTurn(action.move,{record:true,source:action.source});redoActions=rest;render();save();
}
function resetCube(){
  if(isLocked()||demo)return;
  invalidateSolution();cube.reset();history=[];actions=[];redoActions=[];scrambleText='';elapsed=0;startedAt=null;selectedFace=null;
  view?.rebuild();$('viewer-annotation').textContent='白色朝上 · 绿色朝前';render();save();notify('魔方已回到初始状态。');
}
function setMode(value){
  if(busy||batch||demo)return;autoplay=false;mode=value;
  if(value==='guide')requestSolution();else{computing=false;ticket++;render();save();}
}
function startDemo(index){
  if(busy||batch)return;
  autoplay=false;
  if(!demoSnapshot)demoSnapshot={history:[...history],actions:structuredClone(actions),redoActions:structuredClone(redoActions),scrambleText,mode,elapsed:elapsedNow(),started:!!startedAt,selectedFace};
  const formula={...FORMULAS[index],moves:FORMULAS[index].code.split(' ')};
  demo={formula,index:0,formulaIndex:index};invalidateSolution();mode='guide';elapsed=0;startedAt=null;actions=[];redoActions=[];scrambleText='';
  history=formula.moves.slice().reverse().map(inverse);cube.reset().apply(history);view?.rebuild();view?.resetCamera();
  selectFace(formula.moves[0][0]);$('library-dialog').close();render();notify(`正在演示：${formula.name}。你的练习已保留。`);
  $('guide-content').scrollIntoView({behavior:reducedMotion?'instant':'smooth',block:'nearest'});
}
async function exitDemo(){
  if(!demo)return;autoplay=false;while(busy)await new Promise(resolve=>setTimeout(resolve,20));
  const saved=demoSnapshot;demo=null;demoSnapshot=null;invalidateSolution();
  history=saved.history;actions=saved.actions;redoActions=saved.redoActions;scrambleText=saved.scrambleText;mode=saved.mode;elapsed=saved.elapsed;startedAt=saved.started?Date.now():null;selectedFace=saved.selectedFace;
  cube.reset().apply(history);view?.rebuild();view?.highlight(selectedFace);render();save();
  if(mode==='guide'&&!cube.isSolved())requestSolution();notify('已回到你的练习，魔方状态保持原样。');
}
function openDialog(id){$(id).showModal();}
function setView(value){
  viewMode=value;$('scene').hidden=value==='net';$('large-net').hidden=value!=='net';
  document.querySelectorAll('[data-view]').forEach(b=>{b.classList.toggle('selected',b.dataset.view===value);b.setAttribute('aria-pressed',String(b.dataset.view===value));});
  $('reset-camera').hidden=value==='net';
  $('viewer-hint').innerHTML=value==='net'?`${icon('hand')}点击任一面，再使用下方按钮转动`:`${icon('mouse')}拖动旋转视角<span class="hint-divider">·</span>滚轮缩放<span class="hint-divider">·</span>点击选择面`;
  if(value==='3d')view?.resize();
}
async function copyScramble(){
  if(!scrambleText)return;
  try{await navigator.clipboard.writeText(scrambleText);}
  catch{const input=document.createElement('textarea');input.value=scrambleText;input.style.position='fixed';input.style.opacity='0';document.body.append(input);input.select();const copied=document.execCommand('copy');input.remove();if(!copied){notify('复制未成功，请允许浏览器访问剪贴板。');return;}}
  notify('本次打乱公式已复制。');
}

$('face-controls').addEventListener('click',e=>{const button=e.target.closest('[data-move]');if(button)manualMove(button.dataset.move);});
$('guide-content').addEventListener('click',e=>{
  const action=e.target.closest('[data-action]')?.dataset.action;
  if(action==='next')next();else if(action==='play')play();else if(action==='solve')requestSolution();else if(action==='scramble')scrambleCube();else if(action==='start-guide'){mode='guide';scrambleCube({guide:true});}else if(action==='demo-exit')exitDemo();else if(action==='demo-replay')startDemo(demo.formulaIndex);
});
$('scramble').addEventListener('click',()=>scrambleCube());$('reset-cube').addEventListener('click',resetCube);
$('mode-free').addEventListener('click',()=>setMode('free'));$('mode-guide').addEventListener('click',()=>setMode('guide'));
$('undo').addEventListener('click',undo);$('redo').addEventListener('click',redo);$('copy-scramble').addEventListener('click',copyScramble);
$('reset-camera').addEventListener('click',()=>{view?.resetCamera();notify('视角已复位：白色朝上，绿色朝前。');});
$('toggle-labels').addEventListener('click',()=>{if(view)view.setLabels(!view.labelsVisible);$('toggle-labels').setAttribute('aria-pressed',String(view?.labelsVisible!==false));renderNets();});
document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.view)));
['nav-formulas','tip-formulas'].forEach(id=>$(id).addEventListener('click',()=>openDialog('library-dialog')));
['nav-help','header-help','notation-help'].forEach(id=>$(id).addEventListener('click',()=>openDialog('help-dialog')));
$('nav-practice').addEventListener('click',()=>{window.scrollTo({top:0,behavior:reducedMotion?'instant':'smooth'});});
document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>$(b.dataset.close).close()));
document.querySelectorAll('dialog').forEach(d=>d.addEventListener('click',event=>{if(event.target===d){const r=d.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)d.close();}}));
$('formula-library').addEventListener('click',e=>{const b=e.target.closest('[data-formula]');if(b)startDemo(Number(b.dataset.formula));});
window.addEventListener('keydown',e=>{
  if(document.querySelector('dialog[open]')||/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;
  if(e.key==='Escape'&&demo){exitDemo();return;}
  if(e.key==='?'){e.preventDefault();openDialog('help-dialog');return;}
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();if(e.shiftKey)redo();else undo();return;}
  if(e.ctrlKey||e.metaKey||e.altKey)return;
  if(e.code==='Space'&&(solution||demo)){e.preventDefault();next();return;}
  const face=e.key.toUpperCase();if(FACE_ORDER.includes(face)&&!e.repeat){e.preventDefault();manualMove(face+(e.shiftKey?"'":''));}
});
window.addEventListener('pagehide',save);
setInterval(()=>{if(startedAt)renderStats();},250);
try{
  view=new CubeView($('scene'),cube,selectFace);$('scene-loading').hidden=true;
}catch(error){
  $('scene-loading').hidden=true;setView('net');notify('3D 视图暂不可用，可以继续使用展开图练习。');
  console.warn('3D initialization failed:',error);
}
render();if(mode==='guide'&&!cube.isSolved())requestSolution();
window.cubeAtelier={
  get state(){return cube.asString();},get solved(){return cube.isSolved();},get moves(){return actions.map(a=>a.move);},get history(){return [...history];},
  get solution(){return solution?[...solution]:null;},get solutionIndex(){return solutionIndex;},get busy(){return isLocked();},get demo(){return demo?{index:demo.index,name:demo.formula.name,total:demo.formula.moves.length}:null;},
  get solverReady(){return solverReady;},get workerFailed(){return workerFailed;},get webgl(){return !!view;},get view(){return viewMode;},
  get renderedState(){return view?.renderedState()||null;},
  get stickerCount(){return view?.stickerMeshes.length||0;},get renderedFacelets(){return view?.stickerMeshes.map(s=>({face:s.userData.face,color:FACE_ORDER.find(f=>view.materials[f]===s.material)}))||[];}
};
