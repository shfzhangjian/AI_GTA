/* Paper Zero: readable production loop. All canvas art is original procedural ink. */
(() => {
  const MathRules = window.PaperZeroMath;
  const BossAI = window.PaperZeroBoss;
  const Combat = window.PaperZeroCombat;
  const canvas = document.querySelector('#game');
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const $ = id => document.getElementById(id);
  const ui = { overlay:$('overlay'), title:$('overlayTitle'), text:$('overlayText'), start:$('start'), choices:$('choices'), ops:$('operators'), hp:$('hp'), score:$('score'), wave:$('wave'), chapter:$('chapterNum'), mode:$('modeName'), objective:$('objective'), hint:$('hint') };
  const pages = [
    {name:'归零练习', goal:0, waves:[[4,6,8],[9,12,16]], tip:'−1 永远可用；先找整除和平方根。'},
    {name:'整除走廊', goal:0, waves:[[12,16,18],[20,24,25],[32,36]], tip:'奇数不能 ÷2，非完全平方数不能 √。'},
    {name:'余数迷宫', goal:0, waves:[[10,14,22],[28,16,19],[25,11,8]], tip:'mod 3 是真实余数，不是清场。'},
    {name:'十点钟', goal:10, waves:[[11,12,16],[25,36,40],[64,100,121]], tip:'不能低于 10；mod 3 本页禁用。'},
    {name:'涂鸦大王', goal:0, boss:true, waves:[[64]], tip:'先用合法运算拆护甲，再躲开纸墨与尺痕。'}
  ];
  let state, last = 0, music = null, audio = null, muted = true;

  function makeRun(pageIndex=0) {
    state = { page:pageIndex, wave:0, hp:5, score:0, paused:true, ended:false, keys:{},
      player:{x:W/2,y:H*.6,r:15,dash:0,dashCool:0,inv:0,walk:0},
      aim:{x:W*.7,y:H*.4}, touchMove:null, touchMoveId:null, op:'minus',
      charges:{half:7,root:5,mod:4}, cool:{minus:0,half:0,root:0,mod:0},
      upgrades:{minusCooldown:0.12}, enemies:[], shots:[], threats:[], particles:[], floats:[],
      bossAI:null, pendingBoss:null, toast:'', toastTime:0, operatorDirty:true, firing:false };
    spawnWave();
  }
  function page(){ return pages[state.page]; }
  function spawnWave() {
    const values = page().waves[state.wave];
    state.enemies = values.map((value,i)=>({ value, x:170+(i%3)*300, y:150+Math.floor(i/3)*230,
      r:page().boss?70:29, dead:false, hit:0, walk:Math.random()*6, boss:!!page().boss,
      armor:page().boss?3:0, phase:1, attackTimer:0 }));
    state.shots=[]; state.threats=[];
    if(page().boss) state.bossAI=BossAI.createBossState();
    state.player.x=W/2; state.player.y=H*.62; // every page resets to a safe paper-center spawn.
    syncHud();
  }
  function restartPage(){ const i=state.page; makeRun(i); state.paused=false; hideOverlay(); }
  function toast(message){ state.toast=message; state.toastTime=1.2; }
  function syncHud(){
    const p=page(); ui.chapter.textContent=state.page+1; ui.mode.textContent=p.name;
    ui.objective.textContent=p.goal===0?'把所有数字变成 0':'让所有数字变成 10';
    ui.hint.textContent=p.tip; ui.hp.textContent=state.hp; ui.score.textContent=state.score; ui.wave.textContent=`${state.wave+1}/${p.waves.length}`;
    // The markup's initial fallback is replaced as one semantic wave label.
    ui.wave.parentElement.childNodes.forEach(node=>{if(node.nodeType===Node.TEXT_NODE)node.textContent='';});
    if(!ui.wave.parentElement.dataset.waveLabel){ui.wave.parentElement.insertBefore(document.createTextNode('波次 '),ui.wave);ui.wave.parentElement.dataset.waveLabel='true';}
    if(state.operatorDirty) renderOperators();
  }
  function renderOperators(){
    const p=page(); state.operatorDirty=false; ui.ops.innerHTML='';
    Object.entries(MathRules.OPERATORS).forEach(([id,def])=>{
      const disabled=(p.goal===10&&id==='mod') || (id!=='minus'&&state.charges[id]===0);
      const b=document.createElement('button'); b.className='op'; b.dataset.op=id;
      b.onclick=()=>{ if(!disabled){state.op=id; state.operatorDirty=true;} };
      ui.ops.appendChild(b);
    }); updateOperatorButtons();
  }
  function updateOperatorButtons(){
    [...ui.ops.children].forEach(b=>{ const id=b.dataset.op, d=MathRules.OPERATORS[id];
      const disabled=(page().goal===10&&id==='mod') || (id!=='minus'&&state.charges[id]===0);
      b.className='op '+(state.op===id?'active ':'')+(disabled?'disabled':'');
      b.innerHTML=`<span class="label">${d.label}</span><span class="charge">[${d.key}] ${page().goal===10&&id==='mod'?'本页禁用':id==='minus'?'∞':state.charges[id]} · ${state.cool[id].toFixed(1)}s</span>`;
    });
  }
  function shoot(){
    if(state.paused||state.ended||state.cool[state.op]>0) return;
    const id=state.op;
    if(page().goal===10&&id==='mod'){ toast('目标 10 禁用模 3'); return; }
    if(id!=='minus'&&state.charges[id]<=0){toast('铅笔芯用完'); return;}
    const dx=state.aim.x-state.player.x, dy=state.aim.y-state.player.y, len=Math.hypot(dx,dy)||1;
    state.shots.push({x:state.player.x,y:state.player.y,vx:dx/len*700,vy:dy/len*700,id,life:1.25});
    state.cool[id]=id==='mod'?8:(id==='minus'?state.upgrades.minusCooldown:MathRules.OPERATORS[id].cooldown);
    state.operatorDirty=true; tone(290,.04);
  }
  function harm(amount, label){
    if(state.player.inv>0) return; state.hp-=amount; state.player.inv=0.8;
    toast(label); tone(95,.12); if(state.hp<=0) end(false);
  }
  function resolveShot(enemy, shot){
    if(shot.id!=='minus'&&state.charges[shot.id]<=0){toast('铅笔芯用完'); return false;}
    if(enemy.armor>0&&shot.id==='mod'){toast('余数免疫：mod 3 无效'); return false;}
    const result=MathRules.apply(enemy.value,shot.id,page().goal);
    if(!result.ok){toast(result.reason); return false;}
    if(result.value===enemy.value){toast('数值没有变化'); return false;}
    if(enemy.armor>0){
      enemy.armor--; enemy.hit=.35; toast(`合法算式拆护甲：${enemy.armor}`); spawnParticles(enemy.x,enemy.y,'#d18045',10);
      if(enemy.armor===0) toast('余数免疫护甲碎了！');
      return true;
    }
    const before=enemy.value; enemy.value=result.value; enemy.hit=.35;
    state.floats.push({x:enemy.x,y:enemy.y-35,text:`${before} ${MathRules.OPERATORS[shot.id].label} → ${result.value}`,color:'#d05b39',t:1});
    if(!Combat.consumeCharge(state.charges,shot.id).ok){toast('铅笔芯用完');return false;} // atomic check prevents multi-projectile overdraft.
    state.operatorDirty=true;
    if((page().goal===0&&enemy.value===0)||(page().goal===10&&enemy.value===10)){
      enemy.dead=true; state.score+=10; state.floats.push({x:enemy.x,y:enemy.y-63,text:'✓ 正确',color:'#2c9b57',t:1.1});
      spawnParticles(enemy.x,enemy.y,'#5aa76a',18); tone(650,.09);
    }
    if(enemy.boss&&enemy.phase===1&&enemy.value<=16){
      enemy.phase=2; state.threats=[]; BossAI.resetPhase(state.bossAI,2); toast('大王进入第二阶段！旧墨迹清除');
    }
    return true;
  }
  function spawnParticles(x,y,color,count){ for(let i=0;i<count;i++) state.particles.push({x,y,vx:(Math.random()-.5)*220,vy:(Math.random()-.5)*220,color,t:.45+Math.random()*.45}); }
  function emitBoss(event, boss){
    if(event.type==='telegraph'){ state.pendingBoss={attack:event.attack,x:boss.x,y:boss.y,tx:state.player.x,ty:state.player.y}; state.threats.push({kind:'warning',...state.pendingBoss,t:event.duration}); toast(event.attack==='ink-ring'?'墨团正在聚集！':'尺子压线中！'); return; }
    const warn=state.pendingBoss; state.pendingBoss=null; state.threats=state.threats.filter(t=>t.kind!=='warning');
    if(event.attack==='ink-ring') for(let i=0;i<8+(event.phase-1)*3;i++){let a=i*Math.PI*2/(8+(event.phase-1)*3);state.threats.push({kind:'ink',x:boss.x,y:boss.y,vx:Math.cos(a)*180,vy:Math.sin(a)*180,t:3,r:9});}
    if(event.attack==='ruler-dash'&&warn) state.threats.push({kind:'ruler',x:warn.x,y:warn.y,tx:warn.tx,ty:warn.ty,t:.5,width:34});
  }
  function update(dt){
    if(state.paused||state.ended) return; dt=Math.min(dt,.04); state.toastTime-=dt;
    if(state.firing) shoot();
    Object.keys(state.cool).forEach(k=>state.cool[k]=Math.max(0,state.cool[k]-dt));
    const p=state.player; p.dash=Math.max(0,p.dash-dt);p.dashCool=Math.max(0,p.dashCool-dt);p.inv=Math.max(0,p.inv-dt);p.walk+=dt*8;
    let dx=(state.keys.d?1:0)-(state.keys.a?1:0),dy=(state.keys.s?1:0)-(state.keys.w?1:0);
    if(state.touchMove){dx+=(state.touchMove.x-p.x)/65;dy+=(state.touchMove.y-p.y)/65;} const len=Math.hypot(dx,dy)||1;
    p.x=Math.max(28,Math.min(W-28,p.x+dx/len*(p.dash?520:240)*dt)); p.y=Math.max(50,Math.min(H-28,p.y+dy/len*(p.dash?520:240)*dt));
    state.shots.forEach(s=>{s.x+=s.vx*dt;s.y+=s.vy*dt;s.life-=dt; for(const e of state.enemies)if(!e.dead&&Math.hypot(s.x-e.x,s.y-e.y)<e.r+6){ if(resolveShot(e,s)) s.life=0; else s.life=0; break; }});
    state.shots=state.shots.filter(s=>s.life>0&&s.x>-30&&s.x<W+30&&s.y>-30&&s.y<H+30);
    for(const e of state.enemies)if(!e.dead){ const d=Math.hypot(p.x-e.x,p.y-e.y)||1; e.walk+=dt*5; e.x+=(p.x-e.x)/d*(e.boss?25:45)*dt;e.y+=(p.y-e.y)/d*(e.boss?25:45)*dt;e.hit=Math.max(0,e.hit-dt);if(d<e.r+p.r)harm(1,'被数字踩到了！'); if(e.boss)BossAI.tick(state.bossAI,dt,false).forEach(ev=>emitBoss(ev,e)); }
    state.threats.forEach(t=>{t.t-=dt;if(t.kind==='ink'){t.x+=t.vx*dt;t.y+=t.vy*dt;if(Math.hypot(t.x-p.x,t.y-p.y)<t.r+p.r)harm(1,'墨团命中！');}if(t.kind==='ruler'){const vx=t.tx-t.x,vy=t.ty-t.y,len2=vx*vx+vy*vy||1,u=Math.max(0,Math.min(1,((p.x-t.x)*vx+(p.y-t.y)*vy)/len2)),cx=t.x+u*vx,cy=t.y+u*vy;if(Math.hypot(p.x-cx,p.y-cy)<t.width/2+p.r)harm(1,'尺痕擦到了！');}}); state.threats=state.threats.filter(t=>t.t>0);
    state.particles.forEach(q=>{q.x+=q.vx*dt;q.y+=q.vy*dt;q.t-=dt;});state.particles=state.particles.filter(q=>q.t>0);state.floats.forEach(f=>{f.y-=28*dt;f.t-=dt;});state.floats=state.floats.filter(f=>f.t>0);
    if(state.enemies.every(e=>e.dead)){ if(state.wave<page().waves.length-1){state.wave++;spawnWave();toast('下一波涂鸦来了');}else end(true); } syncHud(); updateOperatorButtons();
  }
  function end(win){if(state.ended)return;state.ended=true;state.paused=true;showOverlay(win?'这一页写完了！':'铅笔断了',win?(state.page===pages.length-1?'五页练习全部完成！':'选择一条批注，继续。'):'数字占领了纸页，重新布局再试。',win&&state.page<pages.length-1);}
  const upgrades=[['锐利铅芯','−1 冷却缩短','sharp'],['备用橡皮','生命 +2','heart'],['多一格墨水','稀缺符号 +2','ink']];
  function showOverlay(title,text,choose){ui.title.textContent=title;ui.text.textContent=text;ui.choices.innerHTML='';ui.start.style.display=choose?'none':'';ui.start.textContent=title==='铅笔断了'?'本页重开':title.includes('全部')?'重新练习':'继续';if(choose){ui.choices.className='choice-grid';upgrades.forEach(([n,d,k])=>{const b=document.createElement('button');b.innerHTML=`<b>${n}</b>${d}`;b.onclick=()=>{if(k==='sharp')state.upgrades.minusCooldown=Math.max(.04,state.upgrades.minusCooldown-.03);if(k==='heart')state.hp+=2;if(k==='ink')for(const id of ['half','root','mod'])state.charges[id]+=2;state.page++;state.wave=0;state.ended=false;state.paused=false;spawnWave();hideOverlay();};ui.choices.appendChild(b);});}ui.overlay.classList.remove('hide');}
  function hideOverlay(){ui.overlay.classList.add('hide');}
  function togglePause(){if(state.ended)return;state.paused=!state.paused;if(state.paused)showOverlay('暂停','时间、敌人与冷却都冻结。',false);else hideOverlay();}
  ui.start.onclick=()=>{if(state.ended){if(state.hp<=0)restartPage();else{makeRun(0);state.paused=false;hideOverlay();}}else{state.paused=false;hideOverlay();}};
  $('pause').onclick=togglePause;
  window.addEventListener('keydown',e=>{const k=e.key.toLowerCase();if('wasd'.includes(k))state.keys[k]=true;if(['1','2','3','4'].includes(e.key)){const id=Object.keys(MathRules.OPERATORS).find(x=>MathRules.OPERATORS[x].key===e.key);if(id){state.op=id;state.operatorDirty=true;}}if(e.code==='Space'&&state.player.dashCool<=0){e.preventDefault();state.player.dash=.18;state.player.dashCool=.8;state.player.inv=Math.max(state.player.inv,.18);}if(k==='p'||e.key==='Escape')togglePause();});
  window.addEventListener('keyup',e=>state.keys[e.key.toLowerCase()]=false);window.addEventListener('blur',()=>{state.keys={};state.firing=false;if(!state.paused&&!state.ended)togglePause();});
  function pointer(e){const r=canvas.getBoundingClientRect();state.aim.x=(e.clientX-r.left)*W/r.width;state.aim.y=(e.clientY-r.top)*H/r.height;}
  canvas.addEventListener('pointerdown',e=>{canvas.setPointerCapture?.(e.pointerId);pointer(e);if(e.pointerType==='touch'&&state.aim.x<W*.48){state.touchMoveId=e.pointerId;state.touchMove={...state.aim};}else{state.firing=true;shoot();}});
  canvas.addEventListener('pointermove',e=>{pointer(e);if(e.pointerId===state.touchMoveId)state.touchMove={...state.aim};});
  function releasePointer(e){state.firing=false;if(e.pointerId===state.touchMoveId){state.touchMove=null;state.touchMoveId=null;}}
  canvas.addEventListener('pointerup',releasePointer);canvas.addEventListener('pointercancel',releasePointer);window.addEventListener('pointerup',releasePointer);window.addEventListener('pointercancel',releasePointer);
  function tone(f,d){if(!audio||muted)return;const o=audio.createOscillator(),g=audio.createGain();o.frequency.value=f;g.gain.value=.035;o.connect(g).connect(audio.destination);o.start();g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+d);o.stop(audio.currentTime+d);}
  $('music').onclick=async e=>{muted=!muted;if(muted){if(music){clearInterval(music);music=null;}e.currentTarget.textContent='♫ 静音';return;}audio=audio||new AudioContext();await audio.resume();e.currentTarget.textContent='♫ 音乐：开';if(!music)music=setInterval(()=>{if(!state.paused)tone([220,277,330,392][Math.floor(Math.random()*4)],.08);},620);};
  function draw(){ctx.fillStyle='#fffdf3';ctx.fillRect(0,0,W,H);ctx.strokeStyle='#dbe5ee';ctx.lineWidth=1;for(let x=0;x<W;x+=32){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}for(let y=0;y<H;y+=32){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}ctx.strokeStyle='#e8a0a0';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(72,0);ctx.lineTo(72,H);ctx.stroke();drawDeskObjects();state.threats.forEach(drawThreat);state.shots.forEach(s=>{ctx.strokeStyle='#d0643b';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(s.x-s.vx*.018,s.y-s.vy*.018);ctx.lineTo(s.x,s.y);ctx.stroke();ctx.fillStyle='#263952';ctx.font='bold 15px system-ui';ctx.fillText(MathRules.OPERATORS[s.id].label,s.x+5,s.y-6);});state.enemies.forEach(drawEnemy);drawPlayer();state.particles.forEach(q=>{ctx.globalAlpha=q.t;ctx.fillStyle=q.color;ctx.fillRect(q.x,q.y,4,4);});state.floats.forEach(f=>{ctx.globalAlpha=f.t;ctx.fillStyle=f.color;ctx.font='bold 17px system-ui';ctx.fillText(f.text,f.x-35,f.y);});ctx.globalAlpha=1;ctx.strokeStyle='#2c9b57';ctx.lineWidth=2;ctx.beginPath();ctx.arc(state.aim.x,state.aim.y,9,0,Math.PI*2);ctx.moveTo(state.aim.x-14,state.aim.y);ctx.lineTo(state.aim.x+14,state.aim.y);ctx.moveTo(state.aim.x,state.aim.y-14);ctx.lineTo(state.aim.x,state.aim.y+14);ctx.stroke();if(state.toastTime>0){ctx.textAlign='center';ctx.fillStyle='#263952';ctx.font='bold 20px system-ui';ctx.fillText(state.toast,W/2,58);ctx.textAlign='left';}}
  function drawDeskObjects(){ctx.save();ctx.globalAlpha=.35;ctx.fillStyle='#e3b06e';ctx.fillRect(900,45,120,18);ctx.fillStyle='#c86d42';ctx.fillRect(1000,45,56,18);ctx.strokeStyle='#56616d';ctx.lineWidth=2;ctx.strokeRect(830,600,190,30);ctx.restore();}
  function drawThreat(t){ctx.save();if(t.kind==='warning'){ctx.strokeStyle=t.attack==='ink-ring'?'#9c5c7d':'#d68044';ctx.setLineDash([9,8]);ctx.lineWidth=t.attack==='ruler-dash'?34:4;ctx.beginPath();if(t.attack==='ruler-dash'){ctx.moveTo(t.x,t.y);ctx.lineTo(t.tx,t.ty);}else ctx.arc(t.x,t.y,115,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);}if(t.kind==='ink'){ctx.fillStyle='#40334b';ctx.beginPath();ctx.arc(t.x,t.y,t.r,0,Math.PI*2);ctx.fill();}if(t.kind==='ruler'){ctx.strokeStyle='#e88a43';ctx.lineWidth=t.width;ctx.beginPath();ctx.moveTo(t.x,t.y);ctx.lineTo(t.tx,t.ty);ctx.stroke();}ctx.restore();}
  function drawEnemy(e){if(e.dead)return;ctx.save();ctx.translate(e.x,e.y);ctx.strokeStyle=e.hit?'#e26344':'#313d50';ctx.fillStyle=e.boss?'#f1b174':'#fff8e6';ctx.lineWidth=3;if(e.boss){ctx.beginPath();for(let i=0;i<10;i++){const a=i*Math.PI*2/10,r=i%2?e.r*.78:e.r;ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r);}ctx.closePath();}else{ctx.beginPath();ctx.arc(0,0,e.r,0,Math.PI*2);}ctx.fill();ctx.stroke();ctx.beginPath();ctx.moveTo(-e.r*.42,e.r*.8);ctx.lineTo(-e.r*.65,e.r+12+Math.sin(e.walk)*4);ctx.moveTo(e.r*.42,e.r*.8);ctx.lineTo(e.r*.65,e.r+12-Math.sin(e.walk)*4);ctx.stroke();ctx.fillStyle='#273a54';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`900 ${e.boss?46:30}px system-ui`;ctx.fillText(e.value,0,0);if(e.armor){ctx.fillStyle='#925333';ctx.font='bold 11px system-ui';ctx.fillText('余数免疫 ×'+e.armor,0,-e.r-16);}ctx.restore();}
  function drawPlayer(){const p=state.player;ctx.save();ctx.translate(p.x,p.y);ctx.strokeStyle=p.inv?'#e87845':'#233950';ctx.lineWidth=4;ctx.lineCap='round';const swing=Math.sin(p.walk)*6;ctx.beginPath();ctx.arc(0,-10,6,0,Math.PI*2);ctx.moveTo(0,-4);ctx.lineTo(0,12);ctx.moveTo(0,2);ctx.lineTo(-10,7);ctx.moveTo(0,2);ctx.lineTo(10,7);ctx.moveTo(0,12);ctx.lineTo(-8,21+swing);ctx.moveTo(0,12);ctx.lineTo(8,21-swing);ctx.stroke();ctx.restore();}
  function frame(t){update((t-last)/1000||0);last=t;draw();requestAnimationFrame(frame);}
  makeRun(); showOverlay('纸上归零','WASD 移动、鼠标瞄准。左半屏拖动移动，右半屏点按射击。',false);requestAnimationFrame(frame);
})();
