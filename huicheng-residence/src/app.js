import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createHome } from './model.js';
import { createPlan } from './plan.js';
import { X,Z,M,SCALE,HEIGHT,rooms,outline,roomArea,modeledArea,pointInPoly,tourStops,doorPose } from './data.js';

const $=id=>document.getElementById(id);
const stage=$('stage');
let mode='orbit',selected='all',labelsEnabled=true,wallHeight=.88,furnitureVisible=true;
let yaw=0,pitch=0,drag=false,lastPointer={x:0,y:0},dragDistance=0;
let tourActive=false,tourPaused=false,tourIndex=0,tourElapsed=0,tourFrom=null;
let planScale=1,planPan={x:0,y:0};
const keys=new Set(),raycaster=new THREE.Raycaster(),mouse=new THREE.Vector2();
let toastTimeout,transition=null;
const scene=new THREE.Scene();scene.background=new THREE.Color('#eeeee6');
let renderer;
try { renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true,powerPreference:'high-performance'}); }
catch(error){$('loading').innerHTML='<b>当前浏览器无法启动 3D 画布</b><p>请启用硬件加速后刷新。平面图仍可查看。</p><button class="primary-button" id="fallback-plan">查看平面图</button>';
  $('plan-wrapper').innerHTML=createPlan();document.querySelector('#fallback-plan').onclick=()=>{$('loading').hidden=true;$('plan-view').hidden=false;};throw error;}
renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.0;
renderer.domElement.setAttribute('aria-label','户型三维模型，可拖动旋转和缩放');renderer.domElement.tabIndex=0;$('viewport').append(renderer.domElement);
const environment=new RoomEnvironment(),pmrem=new THREE.PMREMGenerator(renderer);scene.environment=pmrem.fromScene(environment,.04).texture;environment.dispose();pmrem.dispose();scene.environmentIntensity=.40;
const ambient=new THREE.HemisphereLight('#fff8e9','#b3b7a6',1.65);scene.add(ambient);
const sun=new THREE.DirectionalLight('#fff5de',2.5);sun.position.set(-6,14,7);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-11;sun.shadow.camera.right=11;sun.shadow.camera.top=11;sun.shadow.camera.bottom=-11;sun.shadow.camera.near=1;sun.shadow.camera.far=40;sun.shadow.bias=-.00045;sun.shadow.normalBias=.025;sun.shadow.radius=3;scene.add(sun);
const fill=new THREE.DirectionalLight('#e8efe7',.9);fill.position.set(8,7,-9);scene.add(fill);
const ground=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.MeshStandardMaterial({color:'#eeeee6',roughness:1}));ground.rotation.x=-Math.PI/2;ground.position.y=-.215;ground.receiveShadow=false;scene.add(ground);
const orbitCamera=new THREE.OrthographicCamera(-10,10,8,-8,.1,150);orbitCamera.position.set(15,20,24);
const walkCamera=new THREE.PerspectiveCamera(66,1,.04,180);walkCamera.rotation.order='YXZ';
let camera=orbitCamera;
const controls=new OrbitControls(orbitCamera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.07;controls.target.set(0,.3,0);controls.minZoom=.6;controls.maxZoom=4;controls.minPolarAngle=.05;controls.maxPolarAngle=Math.PI*.48;controls.maxDistance=50;
const home=createHome(scene);
let wallFinish='paint';
try{const saved=localStorage.getItem('residence-wall-finish');if(['paint','cement','plaster'].includes(saved))wallFinish=saved;}catch{}
home.setWallFinish(wallFinish);$('wall-finish').value=wallFinish;document.body.dataset.wallFinish=wallFinish;
// The outside is a subdued contextual setting, shown only through windows in walk mode.
const outdoor=new THREE.Group();scene.add(outdoor);outdoor.visible=false;
for(let i=0;i<28;i++){const a=i*Math.PI*2/28,dist=27+Math.sin(i*4)*5,h=3+(i%7)*1.3;const mesh=new THREE.Mesh(new THREE.BoxGeometry(3.2,h,3),new THREE.MeshStandardMaterial({color:i%2?'#cad4c5':'#d5d7cb',roughness:1}));mesh.position.set(Math.sin(a)*dist,h/2-1,Math.cos(a)*dist);outdoor.add(mesh);}
// Ceiling lamps create localized light without expensive additional shadow maps.
const indoorLights=[];
for(const r of rooms){const light=new THREE.PointLight('#ffe0b7',2.0,8,2);light.position.set(X(r.label[0]),2.45,Z(r.label[1]));light.userData.room=r.id;scene.add(light);light.visible=false;indoorLights.push(light);}
let lightRoom='';
function updateLighting(room=''){
  lightRoom=room;const evening=$('light-mode').value==='evening',bath=mode==='walk'&&room==='bath',kitchenDining=mode==='walk'&&['kitchen','dining'].includes(room);
  sun.color.set(evening?'#f5b976':'#fff5de');sun.intensity=bath?(evening?.85:1.2):kitchenDining?(evening?1.3:1.8):(evening?1.7:2.5);
  ambient.intensity=bath?(evening?.70:.95):kitchenDining?(evening?.95:1.20):(evening?1.15:1.65);fill.intensity=bath?.4:kitchenDining?.65:.9;
  renderer.toneMappingExposure=bath?.85:kitchenDining?.90:(evening?1.05:1.0);
  indoorLights.forEach(l=>{l.color.set(evening?'#ffc984':'#ffe0b7');l.intensity=bath?(l.userData.room==='bath'?(evening?2:1.2):.15):kitchenDining?(evening?2.8:1.3):(evening?4:2);});
}

function icon(type){const symbols={living:'M4 10V7h16v3M3 10h4v7H3v-7m14 0h4v7h-4v-7M7 13h10M5 17v3m14-3v3',dining:'M4 10h16M6 10v10m12-10v10M4 5h16v5H4V5',kitchen:'M4 6h16v14H4V6m0 6h16M7 4v4m10-4v4m-8 12v-6h6v6',bed:'M3 8h18v12M3 15h18M6 5h12v10M7 9h4m2 0h4',study:'M4 6h16v11H4V6m2 11v4m12-4v4M8 3v3m8-3v3',wardrobe:'M4 3h16v18H4V3m8 0v18m-3-8v3m6-3v3',bath:'M5 12h14v4a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4v-4m0 0V6a3 3 0 0 1 6 0M8 5h4m-6 15v2m12-2v2',balcony:'M4 8h16v12H4V8m4 0v12m8-12v12M4 14h16m-8-11v2'};
  return `<svg viewBox="0 0 24 24"><path d="${symbols[type]||symbols.balcony}"/></svg>`;
}
$('area-value').innerHTML=`${modeledArea.toFixed(1)}<small>m²</small>`;
$('room-list').innerHTML=rooms.map(r=>`<button class="room-row" data-room="${r.id}"><span class="room-icon">${icon(r.id==='master'||r.id==='bedroom'?'bed':r.id)}</span><span class="room-copy"><b>${r.name}</b><small>${r.en}</small></span><span class="room-area">${roomArea(r).toFixed(1)} m²</span></button>`).join('');
$('plan-wrapper').innerHTML=createPlan();$('minimap-map').innerHTML=createPlan(true);
const labelElements=rooms.map(r=>{const e=document.createElement('button');e.className='room-label';e.textContent=r.name;e.setAttribute('aria-label',`查看${r.name}`);e.onclick=()=>selectRoom(r.id);$('room-labels').append(e);return {room:r,element:e};});

function toast(text){clearTimeout(toastTimeout);$('toast').textContent=text;$('toast').hidden=false;toastTimeout=setTimeout(()=>$('toast').hidden=true,3000);}
function resize(){const w=stage.clientWidth,h=stage.clientHeight;renderer.setSize(w,h);const aspect=w/h,half=Math.max(8.6,8.6/aspect);orbitCamera.left=-half*aspect;orbitCamera.right=half*aspect;orbitCamera.top=half;orbitCamera.bottom=-half;orbitCamera.updateProjectionMatrix();walkCamera.aspect=aspect;walkCamera.updateProjectionMatrix();}
new ResizeObserver(resize).observe(stage);resize();
function fly(position,target,zoom=1){transition={start:performance.now(),duration:850,from:orbitCamera.position.clone(),to:new THREE.Vector3(...position),fromTarget:controls.target.clone(),target:new THREE.Vector3(...target),fromZoom:orbitCamera.zoom,zoom};}
function resetView(){selected='all';updateSelection();$('inspector').hidden=true;planScale=1;planPan={x:0,y:0};updatePlanTransform();if(mode==='orbit')fly([15,20,24],[0,.3,0],1);else if(mode==='walk')teleport([695,903],-.6);}
function updateSelection(){document.querySelectorAll('[data-room]').forEach(e=>e.classList.toggle('active',e.dataset.room===selected));document.querySelectorAll('.plan-room').forEach(e=>e.classList.toggle('selected',e.dataset.planRoom===selected));labelElements.forEach(({room,element})=>element.classList.toggle('selected',room.id===selected));}
function selectRoom(id,focus=true){
  selected=id;updateSelection();$('sidebar').classList.remove('open');
  if(id==='all'){resetView();return;}
  const r=rooms.find(v=>v.id===id);if(!r)return;
  $('inspector-en').textContent=r.en;$('inspector-title').textContent=r.name;$('inspector-desc').textContent=r.desc;$('inspector-detail').innerHTML=`<strong>${roomArea(r).toFixed(1)} m²</strong> · 模型净投影<br>${r.items}<br><span>${r.material}</span>`;
  $('inspector').hidden=mode==='walk';
  if(mode==='orbit'&&focus){const xx=X(r.label[0]),zz=Z(r.label[1]);fly([xx+11,15,zz+17],[xx,.1,zz],1.55);}
  if(mode==='walk'&&focus){stopTour(false);if(id==='wardrobe'){teleport([816,392],Math.PI/2,-.08);toast('衣帽间入口：按 E 或点击柜门左右推拉，再向前走入');}else{teleport(r.spawn,r.yaw,r.pitch||0);toast(`已到达${r.name}`);}}
}
function setMode(next,options={}){
  if(next===mode&&!options.force)return;
  if(tourActive&&!options.tour)stopTour(false);
  const prev=mode;mode=next;keys.clear();drag=false;
  if(document.pointerLockElement)document.exitPointerLock();
  controls.enabled=mode==='orbit';transition=null;camera=mode==='walk'?walkCamera:orbitCamera;
  document.querySelectorAll('[data-mode]').forEach(b=>b.classList.toggle('active',b.dataset.mode===mode));
  $('plan-view').hidden=mode!=='plan';$('viewport').hidden=mode==='plan';$('room-labels').hidden=mode!=='orbit';
  stage.classList.toggle('walking',mode==='walk');$('crosshair').hidden=mode!=='walk';$('walk-hint').hidden=mode!=='walk';$('minimap').hidden=mode!=='walk';$('touch-controls').hidden=mode!=='walk';
  $('bottom-bar').hidden=mode==='walk';$('scale-bar').hidden=mode==='walk';$('tour-card').hidden=mode==='walk';$('north').hidden=mode==='walk';$('settings').hidden=true;
  $('inspector').hidden=mode==='walk'||selected==='all';
  outdoor.visible=mode==='walk';ground.receiveShadow=mode==='walk';indoorLights.forEach(l=>l.visible=mode==='walk');
  updateLighting();
  home.setWallHeight(mode==='walk'?HEIGHT:wallHeight,mode==='walk');
  scene.background.set(mode==='walk'?'#dfe6df':'#eeeee6');ground.material.color.set(mode==='walk'?'#c4cfb5':'#eeeee6');
  if(mode==='walk'){
    if(!options.tour){const r=rooms.find(v=>v.id===selected);if(r?.id==='wardrobe'){teleport([816,392],Math.PI/2,-.08);toast('衣帽间入口：按 E 或点击柜门左右推拉，再向前走入');}else teleport(r?r.spawn:[695,903],r?r.yaw:-.6,r?.pitch||0);}
    $('view-eyebrow').textContent='AT HOME, AT YOUR PACE';$('view-title').textContent='走进家的日常';$('view-subtitle').textContent='点击房间快速到达，拖动视角自由探索。';
  }else if(mode==='plan'){$('view-eyebrow').textContent='EVERY SPACE, IN PLACE';$('view-title').textContent='生活的平面叙事';$('view-subtitle').textContent='按原图比例描摹，点击房间查看细节。';$('view-help').innerHTML='<span class="mouse-symbol">↔</span>拖动平移 <i>·</i> 滚轮缩放 <i>·</i> 点选空间';}
  else{$('view-eyebrow').textContent='A NEW PERSPECTIVE';$('view-title').textContent='家的另一种视角';$('view-subtitle').textContent='转动视角，读懂每一寸空间。';$('view-help').innerHTML='<span class="mouse-symbol">↔</span>拖动旋转 <i>·</i> 滚轮缩放 <i>·</i> 右键平移';if(prev==='walk')controls.update();}
}
function blocked(x,z){
  const px=x*SCALE+698.5,pz=z*SCALE+665.5,radius=.16;
  for(const [dx,dz] of [[radius,0],[-radius,0],[0,radius],[0,-radius]])if(!pointInPoly(px+dx*SCALE,pz+dz*SCALE,outline))return true;
  const boxes=furnitureVisible?[...home.colliders,...home.obstacles]:home.colliders;
  for(const b of boxes)if(Math.abs(x-b.x)<b.w/2+radius&&Math.abs(z-b.z)<b.d/2+radius)return true;
  for(const door of home.doorObjects){const p=door.data,w=M(p.w);
    if(p.style==='roomSlide'){const dx=x-door.group.position.x,dz=z-door.group.position.z,c=Math.cos(door.group.rotation.y),s=Math.sin(door.group.rotation.y),lx=c*dx-s*dz,lz=s*dx+c*dz;for(const leaf of door.leaves)if(Math.abs(lx-leaf.position.x)<w/4+.015+radius&&Math.abs(lz-leaf.position.z)<.018+radius)return true;continue;}
    if(p.style==='cabinetSlide'){for(const leaf of door.leaves)if(Math.abs(x-door.group.position.x-.027)<.020+radius&&Math.abs(z-door.group.position.z-leaf.position.z)<w/4+.012+radius)return true;continue;}
    if(['bath','study','entry'].includes(p.id)){const pose=doorPose(p,door.pivot.rotation.y),dx=x-X(pose.hinge[0]),dz=z-Z(pose.hinge[1]),c=Math.cos(pose.rotation),s=Math.sin(pose.rotation);if(Math.abs(c*dx-s*dz+p.hinge*w/2)<(w-.06)/2+radius&&Math.abs(s*dx+c*dz)<.022+radius)return true;continue;}
    if(door.open)continue;if(p.axis==='x'){if(Math.abs(x-X(p.x))<w/2+radius&&Math.abs(z-Z(p.z))<.035+radius)return true;}else if(Math.abs(x-X(p.x))<.035+radius&&Math.abs(z-Z(p.z))<w/2+radius)return true;
  }
  return false;
}
function teleport(p,angle=0,lookPitch=0){
  let x=X(p[0]),z=Z(p[1]);
  if(blocked(x,z)){
    let found=false;for(let radius=.15;radius<1.7&&!found;radius+=.15)for(let a=0;a<16;a++){const xx=x+Math.cos(a*Math.PI/8)*radius,zz=z+Math.sin(a*Math.PI/8)*radius;if(!blocked(xx,zz)){x=xx;z=zz;found=true;break;}}
  }
  walkCamera.position.set(x,1.62,z);yaw=angle;pitch=lookPitch;applyLook();updateMinimap();
}
function applyLook(){pitch=THREE.MathUtils.clamp(pitch,-1.15,1.15);walkCamera.rotation.set(pitch,yaw,0,'YXZ');}
function lookToward(p){const dx=X(p[0])-walkCamera.position.x,dz=Z(p[1])-walkCamera.position.z;yaw=Math.atan2(-dx,-dz);pitch=-.12;applyLook();}
function updateMinimap(){
  const px=walkCamera.position.x*SCALE+698.5,pz=walkCamera.position.z*SCALE+665.5;
  $('mini-player').setAttribute('cx',px);$('mini-player').setAttribute('cy',pz);
  const a=yaw,tx=px-Math.sin(a)*60,tz=pz-Math.cos(a)*60;
  $('mini-direction').setAttribute('d',`M${px},${pz} L${tx+Math.cos(a)*30},${tz-Math.sin(a)*30} L${tx-Math.cos(a)*30},${tz+Math.sin(a)*30} Z`);
  const r=rooms.find(r=>pointInPoly(px,pz,r.poly));$('current-room').textContent=r?.name||'玄关 / 过道';
  if(lightRoom!==(r?.id||''))updateLighting(r?.id||'');
  const fov=['study','master','bath','dining','kitchen'].includes(r?.id)?84:66;if(walkCamera.fov!==fov){walkCamera.fov=fov;walkCamera.updateProjectionMatrix();}
}
function nearestDoor(){let candidate=null,dist=2.0;for(const d of home.doorObjects){const dd=Math.hypot(walkCamera.position.x-X(d.data.x),walkCamera.position.z-Z(d.data.z));if(dd<dist){dist=dd;candidate=d;}}return candidate;}
function toggleDoor(id){const d=home.doorObjects.find(v=>v.data.id===id);if(!d)return;home.toggleDoor(id);toast(`${d.data.name}已${d.open?(d.data.style==='cabinetSlide'?'左右滑开，可走入衣帽间':'打开'):'关闭'}`);}
function updatePlanTransform(){$('plan-wrapper').style.transform=`translate(${planPan.x}px,${planPan.y}px) scale(${planScale})`;}
function zoom(delta){if(mode==='orbit'){transition=null;orbitCamera.zoom=THREE.MathUtils.clamp(orbitCamera.zoom*(delta>0?1.18:1/1.18),.6,4);orbitCamera.updateProjectionMatrix();}else if(mode==='plan'){planScale=THREE.MathUtils.clamp(planScale*(delta>0?1.15:1/1.15),.55,4);updatePlanTransform();}}
function hitTest(e){const r=renderer.domElement.getBoundingClientRect();mouse.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);raycaster.setFromCamera(mouse,camera);return raycaster.intersectObject(home.root,true).find(h=>{for(let p=h.object;p;p=p.parent)if(!p.visible)return false;return h.object.userData.furniture||h.object.userData.room||h.object.userData.door;});}
renderer.domElement.addEventListener('pointerdown',e=>{dragDistance=0;lastPointer={x:e.clientX,y:e.clientY};drag=e.button===0;transition=null;renderer.domElement.focus({preventScroll:true});if(mode==='walk')renderer.domElement.setPointerCapture(e.pointerId);});
renderer.domElement.addEventListener('pointermove',e=>{const dx=e.clientX-lastPointer.x,dy=e.clientY-lastPointer.y;lastPointer={x:e.clientX,y:e.clientY};if(drag)dragDistance+=Math.abs(dx)+Math.abs(dy);if(mode==='walk'&&(drag||document.pointerLockElement===renderer.domElement)){if(tourActive)stopTour(false);yaw-=(document.pointerLockElement?e.movementX:dx)*.003;pitch-=(document.pointerLockElement?e.movementY:dy)*.003;applyLook();}});
renderer.domElement.addEventListener('pointerup',e=>{drag=false;if(dragDistance>6)return;const hit=hitTest(e);if(!hit)return;const data=hit.object.userData;if(data.door){toggleDoor(data.door);return;}if(data.room&&mode==='orbit')selectRoom(data.room,false);if(data.furniture)toast(data.furniture);});
renderer.domElement.addEventListener('pointercancel',()=>drag=false);
window.addEventListener('keydown',e=>{if($('source-dialog').open||$('notes-dialog').open||/INPUT|SELECT|TEXTAREA/.test(e.target.tagName))return;
  if(mode==='walk'&&['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','ShiftLeft','ShiftRight'].includes(e.code)){e.preventDefault();keys.add(e.code);if(tourActive)stopTour(false);}
  if(e.code==='KeyE'&&mode==='walk'&&!e.repeat){const d=nearestDoor();if(d)toggleDoor(d.data.id);else toast('靠近门后按 E 键开关门');}
  if(e.code==='Escape'){if(document.pointerLockElement){document.exitPointerLock();return;}if(tourActive)stopTour();else if(mode==='walk')setMode('orbit');$('inspector').hidden=true;$('settings').hidden=true;}
  if(e.code==='Digit1')setMode('plan');if(e.code==='Digit2')setMode('orbit');if(e.code==='Digit3')setMode('walk');
});
window.addEventListener('keyup',e=>keys.delete(e.code));window.addEventListener('blur',()=>{keys.clear();drag=false;});
document.querySelectorAll('[data-move]').forEach(b=>{b.onpointerdown=e=>{e.preventDefault();keys.add(b.dataset.move);b.setPointerCapture(e.pointerId);if(tourActive)stopTour(false);};b.onpointerup=b.onpointercancel=()=>keys.delete(b.dataset.move);});
$('lock-pointer').onclick=async()=>{try{await renderer.domElement.requestPointerLock();toast('鼠标已锁定，按 Esc 释放');}catch{toast('拖动鼠标也可以自由转向');}};
$('view-artwork').onclick=()=>{stopTour(false);selected='all';updateSelection();teleport([681,575],-Math.atan2(9,96));pitch=-.035;applyLook();};
$('view-entry').onclick=()=>{stopTour(false);selected='all';updateSelection();const door=home.doorObjects.find(d=>d.data.id==='entry');if(door.open)home.toggleDoor('entry');teleport([692,818],Math.PI,-.22);toast('实拍入户大门：按 E 或点击门板开关');};
document.addEventListener('pointerlockchange',()=>{$('lock-pointer').textContent=document.pointerLockElement?'Esc 释放鼠标':'沉浸控制';});

document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>setMode(b.dataset.mode));document.querySelectorAll('[data-room]').forEach(b=>b.onclick=()=>selectRoom(b.dataset.room));
$('plan-wrapper').addEventListener('click',e=>{if(dragDistance>6)return;const r=e.target.closest('[data-plan-room]');if(r)selectRoom(r.dataset.planRoom,false);});
$('minimap-map').addEventListener('click',e=>{const r=e.target.closest('[data-plan-room]');if(r)selectRoom(r.dataset.planRoom);});
$('plan-view').addEventListener('wheel',e=>{e.preventDefault();zoom(e.deltaY<0?1:-1);},{passive:false});
let planDrag=false,planPrev={x:0,y:0};$('plan-view').onpointerdown=e=>{if(e.button!==0)return;planDrag=true;dragDistance=0;planPrev={x:e.clientX,y:e.clientY};};
$('plan-view').onpointermove=e=>{if(!planDrag)return;const dx=e.clientX-planPrev.x,dy=e.clientY-planPrev.y;dragDistance+=Math.abs(dx)+Math.abs(dy);if(dragDistance>6)$('plan-view').setPointerCapture(e.pointerId);planPan.x+=dx;planPan.y+=dy;planPrev={x:e.clientX,y:e.clientY};updatePlanTransform();};$('plan-view').onpointerup=$('plan-view').onpointercancel=()=>planDrag=false;
$('close-inspector').onclick=()=>$('inspector').hidden=true;$('enter-room').onclick=()=>setMode('walk');$('exit-walk').onclick=()=>setMode('orbit');
$('view-wardrobe').onclick=()=>{if(mode!=='walk')setMode('walk');stopTour(false);selectRoom('wardrobe');};
$('zoom-in').onclick=()=>zoom(1);$('zoom-out').onclick=()=>zoom(-1);$('reset-view').onclick=resetView;
function updateLabels(){labelsEnabled=$('show-labels').checked;$('labels-button').classList.toggle('enabled',labelsEnabled);$('plan-labels').style.display=labelsEnabled?'':'none';}
$('labels-button').onclick=()=>{$('show-labels').checked=!labelsEnabled;updateLabels();};$('show-labels').onchange=updateLabels;
$('settings-button').onclick=()=>$('settings').hidden=!$('settings').hidden;$('close-settings').onclick=()=>$('settings').hidden=true;
$('wall-height').onchange=e=>{wallHeight=Number(e.target.value);home.setWallHeight(wallHeight,false);};
$('wall-finish').onchange=e=>{wallFinish=e.target.value;const name=home.setWallFinish(wallFinish);document.body.dataset.wallFinish=wallFinish;try{localStorage.setItem('residence-wall-finish',wallFinish);}catch{}toast(`墙面已切换为${name}`);};
$('show-furniture').onchange=e=>{furnitureVisible=e.target.checked;home.furnitureGroups.forEach(g=>g.visible=furnitureVisible);$('plan-wrapper').querySelector('.plan-furniture').style.display=furnitureVisible?'':'none';};
$('blueprint-overlay').onchange=e=>{if(e.target.checked&&mode!=='plan')setMode('plan');$('plan-blueprint').style.display=e.target.checked?'':'none';};
$('light-mode').onchange=()=>updateLighting(lightRoom);
$('mobile-menu').onclick=()=>$('sidebar').classList.toggle('open');
$('source-button').onclick=()=>$('source-dialog').showModal();$('close-source').onclick=()=>$('source-dialog').close();
$('model-notes').onclick=()=>$('notes-dialog').showModal();$('close-notes').onclick=()=>$('notes-dialog').close();
for(const d of [$('source-dialog'),$('notes-dialog')])d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}});
document.querySelectorAll('[data-drawing]').forEach(b=>b.onclick=()=>{document.querySelectorAll('[data-drawing]').forEach(v=>v.classList.toggle('active',v===b));$('drawing-image').src=window.__DRAWINGS?.[b.dataset.drawing]||`/public/drawings/${b.dataset.drawing}.jpg`;$('drawing-image').alt=b.textContent;$('drawing-image').parentElement.scrollTop=0;});

function goTour(index){tourIndex=(index+tourStops.length)%tourStops.length;tourElapsed=0;const stop=tourStops[tourIndex];if(stop.openDoor){const d=home.doorObjects.find(d=>d.data.id===stop.openDoor);if(d&&!d.open)home.toggleDoor(d.data.id);}tourFrom=walkCamera.position.clone();teleport(stop.p);lookToward(stop.look);$('tour-name').textContent=stop.name;$('tour-counter').textContent=`SPACE ${String(tourIndex+1).padStart(2,'0')} / ${tourStops.length}`;$('inspector').hidden=true;}
function startTour(){setMode('walk',{tour:true});tourActive=true;tourPaused=false;$('tour-player').hidden=false;$('tour-pause').textContent='Ⅱ';$('tour-pause').setAttribute('aria-label','暂停导览');goTour(0);}
function stopTour(exit=true){tourActive=false;tourPaused=false;$('tour-player').hidden=true;if(exit)setMode('orbit');}
$('start-tour').onclick=startTour;$('tour-stop').onclick=()=>stopTour();$('tour-next').onclick=()=>goTour(tourIndex+1);$('tour-prev').onclick=()=>goTour(tourIndex-1);$('tour-pause').onclick=()=>{tourPaused=!tourPaused;$('tour-pause').textContent=tourPaused?'▷':'Ⅱ';$('tour-pause').setAttribute('aria-label',tourPaused?'继续导览':'暂停导览');};
async function saveImage(){
  let canvas;
  if(mode==='plan'){
    const svg=$('plan-wrapper').querySelector('svg').cloneNode(true);svg.setAttribute('width','1600');svg.setAttribute('height','1200');
    const style=document.createElementNS('http://www.w3.org/2000/svg','style');style.textContent=`.plan-room{stroke:#dfe3d5}.plan-wall{fill:#839078}.plan-fixture{fill:#f5f3e7;stroke:#a8ae9a;stroke-width:1}.plan-green{fill:#dae2cd;stroke:#a0af8b;stroke-width:1}.plan-label{fill:#61725a;font-size:12px;font-family:sans-serif}.plan-area{fill:#a2ab96;font-size:8px;font-family:serif}.plan-dimension{fill:#8d9681;font-size:11px}.blueprint-overlay{display:none}`;svg.prepend(style);svg.querySelector('image')?.remove();
    const url=URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg)],{type:'image/svg+xml;charset=utf-8'}));const img=new Image();await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=reject;img.src=url;});canvas=document.createElement('canvas');canvas.width=1600;canvas.height=1200;const ctx=canvas.getContext('2d');ctx.fillStyle='#f3f3ec';ctx.fillRect(0,0,1600,1200);ctx.drawImage(img,0,0);URL.revokeObjectURL(url);
  }else{renderer.render(scene,camera);canvas=document.createElement('canvas');canvas.width=renderer.domElement.width;canvas.height=renderer.domElement.height;canvas.getContext('2d').drawImage(renderer.domElement,0,0);}
  const ctx=canvas.getContext('2d');ctx.fillStyle='#f9faf2db';ctx.fillRect(20,20,320,67);ctx.fillStyle='#405a45';ctx.font='20px sans-serif';ctx.fillText('汇成上东 · 29 / 507',35,47);ctx.font='11px sans-serif';ctx.fillText('图纸重建 · 材质与家具立面为示意',35,70);
  const link=document.createElement('a');link.download=`汇成上东-507-${mode}-${Date.now()}.png`;link.href=canvas.toDataURL('image/png');link.click();toast('当前画面已保存');
}
$('screenshot').onclick=()=>saveImage().catch(()=>toast('保存失败，请稍后再试'));

let lastFrame=performance.now(),fpsFrames=0,fpsTime=0,fps=0,lastCabinetProgress=-1;
function animate(){requestAnimationFrame(animate);const now=performance.now(),dt=Math.min((now-lastFrame)/1000,.05);lastFrame=now;
  home.update(dt);
  const cabinet=home.doorObjects.find(d=>d.data.style==='cabinetSlide');
  for(const slide of home.doorObjects.filter(d=>d.data.style==='roomSlide'))for(const e of document.querySelectorAll(`[data-room-slide="${slide.data.id}"]`)){const offset=-slide.data.w/2*slide.progress;e.setAttribute('transform',slide.data.axis==='x'?`translate(${offset} 0)`:`translate(0 ${-offset})`);}
  if(Math.abs(cabinet.progress-lastCabinetProgress)>.002){lastCabinetProgress=cabinet.progress;for(const e of document.querySelectorAll('[data-cabinet-leaf]'))e.setAttribute('transform',`translate(0 ${Number(e.dataset.cabinetLeaf)*cabinet.data.travel*cabinet.progress})`);$('plan-cabinet-entry').setAttribute('aria-label',`衣帽间推拉柜门 · ${cabinet.open?'已左右滑开':'已关闭'}`);}
  if(mode==='orbit'){
    if(transition){let t=THREE.MathUtils.clamp((performance.now()-transition.start)/transition.duration,0,1);t=t*t*(3-2*t);orbitCamera.position.lerpVectors(transition.from,transition.to,t);controls.target.lerpVectors(transition.fromTarget,transition.target,t);orbitCamera.zoom=THREE.MathUtils.lerp(transition.fromZoom,transition.zoom,t);orbitCamera.updateProjectionMatrix();if(t===1)transition=null;}
    controls.update();
    $('north').querySelector('svg').style.transform=`rotate(${controls.getAzimuthalAngle()}rad)`;
  }else if(mode==='walk'){
    if(tourActive&&!tourPaused){tourElapsed+=dt;const speed=5.5;$('tour-progress').style.width=`${tourElapsed/speed*100}%`;yaw+=dt*.025;applyLook();if(tourElapsed>speed)goTour(tourIndex+1);}
    else{
      const turn=(keys.has('ArrowLeft')?1:0)-(keys.has('ArrowRight')?1:0);yaw+=turn*dt*1.6;if(keys.has('ArrowUp'))pitch+=dt*.8;if(keys.has('ArrowDown'))pitch-=dt*.8;applyLook();
      const f=(keys.has('KeyW')?1:0)-(keys.has('KeyS')?1:0),s=(keys.has('KeyD')?1:0)-(keys.has('KeyA')?1:0),norm=Math.hypot(f,s)||1;
      const speed=(keys.has('ShiftLeft')||keys.has('ShiftRight')?2.4:1.45)*dt/norm;
      const dx=(-Math.sin(yaw)*f+Math.cos(yaw)*s)*speed,dz=(-Math.cos(yaw)*f-Math.sin(yaw)*s)*speed;
      // Axis-separated steps let the visitor slide along walls instead of sticking.
      if(!blocked(walkCamera.position.x+dx,walkCamera.position.z))walkCamera.position.x+=dx;
      if(!blocked(walkCamera.position.x,walkCamera.position.z+dz))walkCamera.position.z+=dz;
    }
    updateMinimap();
  }
  if(mode!=='plan'){renderer.render(scene,camera);
    if(mode==='orbit')for(const {room,element} of labelElements){if(!labelsEnabled){element.hidden=true;continue;}const p=new THREE.Vector3(X(room.label[0]),.18,Z(room.label[1])).project(orbitCamera);const x=(p.x*.5+.5)*stage.clientWidth,y=(-p.y*.5+.5)*stage.clientHeight;element.hidden=p.z>1||x<0||x>stage.clientWidth||y<0||y>stage.clientHeight; element.style.left=`${x}px`;element.style.top=`${y}px`;}
  }
  fpsFrames++;fpsTime+=dt;if(fpsTime>1){fps=Math.round(fpsFrames/fpsTime);fpsFrames=0;fpsTime=0;}
}
animate();$('loading').hidden=true;
window.__residence={scene,home,renderer,rooms,walkCamera,orbitCamera,blocked,selectRoom,setMode,teleport,lookToward,startTour,stopTour,get mode(){return mode},get selected(){return selected},get fps(){return fps},get tourIndex(){return tourIndex},get tourActive(){return tourActive},get area(){return modeledArea}};
window.__ready=true;
if(new URL(location.href).searchParams.has('qa'))import('./qa.js').then(({runDiagnostics})=>runDiagnostics(window.__residence));
