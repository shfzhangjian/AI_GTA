import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import './style.css';
import {materials,worldUV,ballFinishes} from './materials.js';
import {addGoal,HOLE_HALF} from './goal.js';

const $ = s => document.querySelector(s);
const canvas=$('#scene');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.setClearColor('#edf0e8');renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
const scene=new THREE.Scene();scene.fog=new THREE.Fog('#edf0e8',28,65);
const camera=new THREE.PerspectiveCamera(38,1,.1,100);
scene.add(new THREE.HemisphereLight(0xffffff,0x869276,1.15));
const sun=new THREE.DirectionalLight(0xfff5de,2.6);sun.position.set(-5,14,7);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-13,right:13,top:13,bottom:-13});sun.shadow.bias=-.0002;scene.add(sun);
const fill=new THREE.DirectionalLight(0xaacbff,1.5);fill.position.set(6,4,-8);scene.add(fill);
// Procedural studio environment gives glossy balls readable reflections without downloads.
const studio=new THREE.Scene();studio.background=new THREE.Color('#9fae9a');
for(let i=0;i<5;i++){const panel=new THREE.Mesh(new THREE.PlaneGeometry(8,5),new THREE.MeshBasicMaterial({color:i%2? '#b7ccd5':'#fff7df',side:THREE.DoubleSide}));panel.position.set(Math.cos(i*1.26)*10,5,Math.sin(i*1.26)*10);panel.lookAt(0,0,0);studio.add(panel);}
const pmrem=new THREE.PMREMGenerator(renderer);scene.environment=pmrem.fromScene(studio,.08).texture;pmrem.dispose();
const ground=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.MeshStandardMaterial({color:'#e5eadd',roughness:1}));ground.rotation.x=-Math.PI/2;ground.position.y=-2;ground.receiveShadow=true;scene.add(ground);
const board=new THREE.Group();scene.add(board);
const profiles={wood:{label:'木板',friction:.55,drag:.22},ice:{label:'冰面',friction:.06,drag:.025},felt:{label:'毛毡',friction:.8,drag:1.8}};
const levels=[{start:[-4,3.8],goal:[4,-3.8],surface:'wood',walls:[],stars:[[-2,2],[0,-1],[2,-3]]},{start:[-4,3.8],goal:[4,-3.8],surface:'ice',walls:[[-1,1,6,.25],[1,-1.5,6,.25]],stars:[[-4,-.5],[4,0],[0,-3.5]]},{start:[-4,3.8],goal:[4,-3.8],surface:'felt',walls:[[-2,2,4,.25],[1,0,.25,5],[-2,-2,4,.25]],stars:[[-4,0],[-.3,3],[3,-2]]}];
let world,platform,ballBody,ballMesh,goalRing,stars=[],level=0,elapsed=0,collected=0,hold=0,won=false,paused=false,accumulator=0,falling=false,sinking=false,dropTime=0,finishIndex=-1;
let tiltX=0,tiltZ=0;const input={x:0,y:0},keys=new Set();const q=new THREE.Quaternion(),euler=new THREE.Euler();
function box(x,z,w,d,h,mat,y=-.15){const geometry=new THREE.BoxGeometry(w,h,d);worldUV(geometry,x,z);const mesh=new THREE.Mesh(geometry,mat);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;board.add(mesh);world.createCollider(RAPIER.ColliderDesc.cuboid(w/2,h/2,d/2).setTranslation(x,y,z).setFriction(mat===materials.ice?.06:mat===materials.felt?.8:.55).setRestitution(.08),platform);return mesh;}
function skin(){if(!ballMesh)return;finishIndex=(finishIndex+1+Math.floor(Math.random()*(ballFinishes.length-1)))%ballFinishes.length;const {name,...params}=ballFinishes[finishIndex];ballMesh.material.iridescence=0;ballMesh.material.setValues(params);$('#skin').title=name;}
function loadLevel(index){level=index;world?.free();world=new RAPIER.World({x:0,y:-9.81,z:0});world.timestep=1/60;
 while(board.children.length){const c=board.children[0];board.remove(c);c.geometry?.dispose();if(c.userData.disposable)c.material?.dispose();}if(ballMesh){scene.remove(ballMesh);ballMesh.geometry.dispose();ballMesh.material.dispose();}
 platform=world.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased());board.quaternion.identity();q.identity();tiltX=tiltZ=0;
 const l=levels[level];
 // Single-material floor partitions leave a genuine opening for the cup.
 const [gx,gz]=l.goal;
 const cuts=(min,max,values)=>[...new Set([min,max,...values.filter(v=>v>min&&v<max)])].sort((a,b)=>a-b); const xs=cuts(-5.5,5.5,[gx-HOLE_HALF,gx+HOLE_HALF]),zs=cuts(-5,5,[gz-HOLE_HALF,gz+HOLE_HALF]); for(let a=0;a<xs.length-1;a++)for(let b=0;b<zs.length-1;b++){const cx=(xs[a]+xs[a+1])/2,cz=(zs[b]+zs[b+1])/2;if(Math.abs(cx-gx)<HOLE_HALF&&Math.abs(cz-gz)<HOLE_HALF)continue;const type=l.surface;box(cx,cz,xs[a+1]-xs[a],zs[b+1]-zs[b],.3,materials[type]);}
 // Perimeter frame leaves the cup open through the entire board.
 box(-5.55,0,.2,10.2,.3,materials.rail,-.42);box(5.55,0,.2,10.2,.3,materials.rail,-.42);box(0,-5.05,11.3,.2,.3,materials.rail,-.42);box(0,5.05,11.3,.2,.3,materials.rail,-.42);
 box(-5.6,0,.2,10.4,.4,materials.rail,.08);box(5.6,0,.2,10.4,.4,materials.rail,.08);box(0,-5.1,11.4,.2,.4,materials.rail,.08);box(0,5.1,11.4,.2,.4,materials.rail,.08);
 for(const [x,z,w,d]of l.walls)box(x,z,w,d,.65,materials.rail,.325);
 goalRing=addGoal(board,world,platform,RAPIER,gx,gz);
 stars=l.stars.map(([x,z])=>{const mesh=new THREE.Mesh(new THREE.OctahedronGeometry(.2),new THREE.MeshStandardMaterial({color:'#ffce70',metalness:.65,roughness:.23,emissive:'#b8882e',emissiveIntensity:.3}));mesh.position.set(x,.55,z);mesh.castShadow=true;mesh.userData.disposable=true;board.add(mesh);return {mesh,x,z,taken:false};});
 ballBody=world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(l.start[0],1.2,l.start[1]).setCcdEnabled(true).setLinearDamping(.025).setAngularDamping(.025));world.createCollider(RAPIER.ColliderDesc.ball(.28).setDensity(3).setFriction(.6).setRestitution(.22),ballBody);
 ballMesh=new THREE.Mesh(new THREE.SphereGeometry(.28,40,28),new THREE.MeshPhysicalMaterial({color:'#d99741',metalness:.85,roughness:.15,clearcoat:1}));ballMesh.castShadow=true;scene.add(ballMesh);skin();
 elapsed=collected=hold=accumulator=dropTime=0;won=paused=falling=sinking=false;release();$('#pause').textContent='Ⅱ 暂停';$('#result').hidden=true;$('#collected').innerHTML='0 <em>/ 3</em>';$('#hint').textContent='按 WASD / 方向键，或拖动右下角摇杆';$('#surface').textContent=profiles[l.surface].label;$('.intro .eyebrow').textContent=`PLAY WITH GRAVITY / 0${level+1}`;document.querySelectorAll('[data-level]').forEach(b=>b.classList.toggle('active',+b.dataset.level===level));sync();}
function sync(){const p=ballBody.translation(),r=ballBody.rotation();ballMesh.position.set(p.x,p.y,p.z);ballMesh.quaternion.set(r.x,r.y,r.z,r.w);board.quaternion.copy(q);}
function step(){const x=Math.max(-1,Math.min(1,input.x+(keys.has('arrowright')||keys.has('d')?1:0)-(keys.has('arrowleft')||keys.has('a')?1:0)));const y=Math.max(-1,Math.min(1,input.y+(keys.has('arrowdown')||keys.has('s')?1:0)-(keys.has('arrowup')||keys.has('w')?1:0)));
 if(!sinking){tiltX=THREE.MathUtils.lerp(tiltX,y*.19,.09);tiltZ=THREE.MathUtils.lerp(tiltZ,-x*.19,.09);}q.setFromEuler(euler.set(tiltX,0,tiltZ));platform.setNextKinematicRotation(q);
 const pos=ballBody.translation();const local=new THREE.Vector3(pos.x,pos.y,pos.z).applyQuaternion(q.clone().invert());const l=levels[level];const type=l.surface;
 if(local.y<.4&&local.y>.15){const v=ballBody.linvel(),normal=new THREE.Vector3(0,1,0).applyQuaternion(q),tangent=new THREE.Vector3(v.x,v.y,v.z);tangent.addScaledVector(normal,-tangent.dot(normal));const drag=profiles[type].drag;ballBody.applyImpulse({x:-tangent.x*drag*ballBody.mass()/60,y:-tangent.y*drag*ballBody.mass()/60,z:-tangent.z*drag*ballBody.mass()/60},true);const av=ballBody.angvel();ballBody.setAngvel({x:av.x/(1+drag/60),y:av.y/(1+drag/60),z:av.z/(1+drag/60)},true);}
 world.step();elapsed+=1/60;$('#surface').textContent=profiles[type].label;
 for(const s of stars)if(!s.taken&&Math.hypot(local.x-s.x,local.z-s.z)<.48&&local.y<1){s.taken=true;s.mesh.visible=false;collected++;$('#collected').innerHTML=`${collected} <em>/ 3</em>`;}
 const v=ballBody.linvel(),speed=Math.hypot(v.x,v.y,v.z);const after=ballBody.translation(),inside=new THREE.Vector3(after.x,after.y,after.z).applyQuaternion(q.clone().invert());
 if(!sinking&&Math.hypot(inside.x-l.goal[0],inside.z-l.goal[1])<.66&&inside.y<-.12){sinking=true;dropTime=0;release();}
 if(sinking){dropTime+=1/60;$('#hint').textContent='漂亮！小球正在落入接球洞…';if(dropTime>.9&&inside.y<-.8)finish();}else{$('#hint').textContent=speed>2.5?'反向倾斜，提前减速':'收集金色能量，滚进绿色接球洞';}
 if(after.y<-4&&!falling&&!sinking){falling=true;loadLevel(level);}
}
function finish(){won=true;$('#result-text').textContent=`用时 ${elapsed.toFixed(1)} 秒 · 收集 ${collected} / 3 颗能量`;$('#next').textContent=level===2?'回到第一关 →':'下一关 →';$('#result').hidden=false;}
function resize(){const w=innerWidth,h=innerHeight;renderer.setSize(w,h,false);camera.aspect=w/h;const mobile=w<560;camera.position.set(0,mobile?19:15,mobile?19:15);camera.lookAt(w>900?-2.5:0,0,mobile?1:0);camera.fov=mobile?58:w<900?48:38;camera.updateProjectionMatrix();}resize();addEventListener('resize',resize);
addEventListener('keydown',e=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault();keys.add(e.key.toLowerCase());if(e.key.toLowerCase()==='r')loadLevel(level);});addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
function release(){keys.clear();input.x=input.y=0;$('#knob').style.transform='translate(0px,0px)';}addEventListener('blur',()=>{release();paused=true;$('#pause').textContent='▶ 继续';});document.addEventListener('visibilitychange',()=>{if(document.hidden){release();paused=true;$('#pause').textContent='▶ 继续';}});
const joystick=$('#joystick');let pointer=null;function move(e){if(pointer!==e.pointerId)return;const r=joystick.getBoundingClientRect();let x=e.clientX-r.left-r.width/2,y=e.clientY-r.top-r.height/2;const length=Math.hypot(x,y);if(length>42){x*=42/length;y*=42/length;}input.x=x/42;input.y=y/42;$('#knob').style.transform=`translate(${x}px,${y}px)`;}
joystick.addEventListener('pointerdown',e=>{pointer=e.pointerId;joystick.setPointerCapture(pointer);move(e);});joystick.addEventListener('pointermove',move);for(const event of ['pointerup','pointercancel','lostpointercapture'])joystick.addEventListener(event,()=>{pointer=null;release();});
$('#reset').onclick=()=>loadLevel(level);$('#again').onclick=()=>loadLevel(level);$('#next').onclick=()=>loadLevel((level+1)%3);$('#skin').onclick=skin;$('#pause').onclick=()=>{paused=!paused;release();$('#pause').textContent=paused?'▶ 继续':'Ⅱ 暂停';};document.querySelectorAll('[data-level]').forEach(b=>b.onclick=()=>loadLevel(+b.dataset.level));
let last=performance.now();function frame(now){requestAnimationFrame(frame);const dt=Math.min((now-last)/1000,.08);last=now;if(world){if(!paused&&!won){accumulator+=dt;while(accumulator>=1/60){step();accumulator-=1/60;}}sync();stars.forEach(s=>{s.mesh.rotation.y=now*.001;s.mesh.position.y=.55+Math.sin(now*.003+s.x)*.08;});goalRing.material.emissiveIntensity=.5+Math.sin(now*.003)*.2;$('#time').textContent=`${String(Math.floor(elapsed/60)).padStart(2,'0')}:${String(Math.floor(elapsed%60)).padStart(2,'0')}`;$('#angle').textContent=`${Math.round(-tiltZ*180/Math.PI)}° / ${Math.round(tiltX*180/Math.PI)}°`;}renderer.render(scene,camera);}
try{await RAPIER.init();loadLevel(0);$('#loading').remove();requestAnimationFrame(frame);}catch(error){$('#loading').textContent='加载失败，请刷新重试';console.error(error);}
// Read-only diagnostics used by browser validation.
window.tiltLab={get state(){return {level,elapsed,collected,won,paused,sinking,dropTime,position:ballBody?.translation(),tiltX,tiltZ};}};
