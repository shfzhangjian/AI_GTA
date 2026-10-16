import * as THREE from './vendor/three.module.min.js';

// All scenery and characters are built from original procedural geometry.
const C={ground:0x152e32, stone:0x344849, moss:0x456455, edge:0x102125, teal:0x64f4dc, gold:0xffd484, coral:0xff756f, ink:0x17252c, pale:0xd9e9cf};
const TAU=Math.PI*2;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function rng(seed=718){return ()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296}}
function mat(color,extra={}){return new THREE.MeshStandardMaterial({color,roughness:.86,flatShading:true,...extra})}
function part(group,geo,material,x=0,y=0,z=0,sx=1,sy=1,sz=1){const m=new THREE.Mesh(geo,material);m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=true;m.receiveShadow=true;group.add(m);return m}
const boxG=new THREE.BoxGeometry(1,1,1),sphereG=new THREE.IcosahedronGeometry(1,1),rockG=new THREE.IcosahedronGeometry(1,0),coneG=new THREE.ConeGeometry(1,1,6),cylG=new THREE.CylinderGeometry(1,1,1,8);
function box(g,m,x,y,z,a,b,c){return part(g,boxG,m,x,y,z,a,b,c)}
function orb(g,m,x,y,z,a,b=a,c=a){return part(g,sphereG,m,x,y,z,a,b,c)}
function beam(g,m,a,b,r=.06){const va=new THREE.Vector3(...a),vb=new THREE.Vector3(...b),d=vb.clone().sub(va),o=part(g,cylG,m,...va.add(vb).multiplyScalar(.5).toArray(),r,d.length(),r);o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());return o}
function ring(g,color,r,opacity=.8,width=.055){const o=new THREE.Mesh(new THREE.RingGeometry(Math.max(.01,r-width),r,48),new THREE.MeshBasicMaterial({color,transparent:true,opacity,side:THREE.DoubleSide,depthWrite:false}));o.rotation.x=-Math.PI/2;o.position.y=.045;g.add(o);return o}
function glow(g,color,x,y,z,r=.1){return orb(g,new THREE.MeshBasicMaterial({color}),x,y,z,r)}

export class Renderer3D{
 constructor(canvas){
  this.canvas=canvas;this.renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
  this.renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.6));this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  this.renderer.setClearColor(0x0b171e);this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.28;
  this.scene=new THREE.Scene();this.scene.background=new THREE.Color(0x0b171e);this.scene.fog=new THREE.FogExp2(0x12252d,.018);
  this.camera=new THREE.OrthographicCamera(-20,20,16,-16,.1,120);this.camera.position.set(19,26,28);this.camera.lookAt(0,0,0);
  this.ray=new THREE.Raycaster();this.pointer=new THREE.Vector2();this.plane=new THREE.Plane(new THREE.Vector3(0,1,0),0);
  this.scene.add(new THREE.HemisphereLight(0xa9e8e9,0x1c2925,2));
  const sun=new THREE.DirectionalLight(0xffe6b2,3.3);sun.position.set(-8,19,6);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-20,right:20,top:20,bottom:-20,near:1,far:60});sun.shadow.bias=-.0007;sun.shadow.normalBias=.035;this.scene.add(sun);
  const rim=new THREE.DirectionalLight(0x4acfc4,1.7);rim.position.set(12,8,-12);this.scene.add(rim);
  this.materials={stone:mat(C.stone),moss:mat(C.moss),dark:mat(C.ink),gold:mat(C.gold,{metalness:.5,roughness:.35}),skin:mat(0xe6b18b),cloth:mat(0x438b73),leather:mat(0x553d37),pale:mat(C.pale)};
  this.enemies=new Map();this.projectiles=new Map();this.obstacleMeshes=new Map();this.pickupMeshes=[];this.effectMeshes=[];
  this.buildWorld();this.player=this.makeRanger();this.scene.add(this.player);this.effectsRoot=new THREE.Group();this.scene.add(this.effectsRoot);this.pickupRoot=new THREE.Group();this.scene.add(this.pickupRoot);
  this.resize(canvas.clientWidth||window.innerWidth,canvas.clientHeight||window.innerHeight);
 }
 buildWorld(){
  const s=this.scene,m=this.materials,r=rng();
  const base=part(s,new THREE.CylinderGeometry(20,21,1,64),mat(0x102124),0,-.6,0);base.receiveShadow=true;
  part(s,new THREE.CircleGeometry(20,64),mat(C.ground),0,-.08,0).rotation.x=-Math.PI/2;
  // Uneven flagstones and the old ceremonial arena outline.
  for(let x=-13;x<=13;x+=2){for(let z=-13;z<=13;z+=2){if(r()<.13)continue;const t=box(s,mat([0x243d3d,0x2b4341,0x223938,0x2d4542][Math.floor(r()*4)]),x+(r()-.5)*.17,-.05,z+(r()-.5)*.17,1.92,.12,1.92);t.rotation.y=(r()-.5)*.025;}}
  ring(s,0x526957,12.95,.65,.055);ring(s,0x66705c,13.2,.3,.025);
  for(let i=0;i<32;i++){const a=i*TAU/32;const t=box(s,m.stone,Math.sin(a)*13.85,.08,Math.cos(a)*13.85,.75,.3,1.05);t.rotation.y=a;}
  const dais=new THREE.Group();s.add(dais);ring(dais,0x638b78,3.5,.36,.04);ring(dais,0x638b78,3.8,.24,.02);
  for(let i=0;i<8;i++){let a=i*TAU/8;const q=box(dais,m.moss,Math.sin(a)*3.65,.015,Math.cos(a)*3.65,.18,.02,.5);q.rotation.y=a;}
  // Ruined outer colonnade, lit braziers, and small gold inscriptions.
  for(let i=0;i<12;i++){const a=i*TAU/12,x=Math.sin(a)*15.5,z=Math.cos(a)*15.5,h=1.6+r()*2.8,g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=-a;s.add(g);
   box(g,m.stone,0,.22,0,1.65,.45,1.65);box(g,m.moss,0,.5,0,1.38,.15,1.38);box(g,m.stone,0,h/2+.5,0,1,h,1);box(g,m.stone,0,h+.6,0,1.45,.35,1.45);
   for(let j=0;j<3;j++)box(g,m.dark,0,.9+j*.55,.508,.5,.045,.025);
   if(i%2===0){const crystal=part(g,rockG,mat(C.teal,{emissive:C.teal,emissiveIntensity:1.1}),0,h+1.1,0,.22,.5,.22);crystal.rotation.z=.2;const light=new THREE.PointLight(C.teal,4,7,2);light.position.set(0,h+.8,0);g.add(light);}
   const rubble=part(g,rockG,m.stone,.9,.25,.7,.6,.4,.7);rubble.rotation.set(r(),r(),r());
  }
  for(let i=0;i<140;i++){let a=r()*TAU,d=14+r()*6,x=Math.sin(a)*d,z=Math.cos(a)*d;
   if(i<70){const stone=part(s,rockG,r()<.4?m.moss:m.stone,x,.08+r()*.2,z,.15+r()*.65,.2+r()*.5,.2+r()*.6);stone.rotation.set(r(),r(),r());}
   else{const grass=new THREE.Group();grass.position.set(x,0,z);s.add(grass);for(let j=0;j<3;j++){const blade=part(grass,coneG,mat(j===0?0x467968:0x31584b),(r()-.5)*.3,.2+r()*.1,(r()-.5)*.3,.075,.5+r()*.4,.07);blade.rotation.z=(r()-.5)*.6;}}
  }
  // Black-pine silhouettes stay behind the playing field.
  for(let i=0;i<22;i++){const a=i*TAU/22,d=19+r()*3,g=new THREE.Group();g.position.set(Math.sin(a)*d,-.25,Math.cos(a)*d);s.add(g);const h=3+r()*4;box(g,mat(0x263b36),0,h*.35,0,.28,h*.7,.3);for(let j=0;j<3;j++)part(g,coneG,mat([0x173e39,0x20473e,0x285245][j]),0,h*.42+j*h*.21,0,1.65-j*.35,h*.63,1.65-j*.35);}
  const firePositions=new Float32Array(70*3);for(let i=0;i<70;i++){firePositions[i*3]=(r()-.5)*34;firePositions[i*3+1]=.3+r()*3;firePositions[i*3+2]=(r()-.5)*34;}
  const fg=new THREE.BufferGeometry();fg.setAttribute('position',new THREE.BufferAttribute(firePositions,3));this.fireflies=new THREE.Points(fg,new THREE.PointsMaterial({color:0xb2eed0,size:.065,transparent:true,opacity:.7,depthWrite:false}));s.add(this.fireflies);
 }
 makeRanger(){
  const g=new THREE.Group(),m=this.materials,torso=new THREE.Group();g.add(torso);g.userData.body=torso;
  const cape=part(torso,new THREE.ConeGeometry(.52,1.1,5,1,true),mat(0x244b49,{side:THREE.DoubleSide}),0,.88,-.22,.95,1,.5);cape.rotation.x=-.14;g.userData.cape=cape;
  box(torso,m.leather,0,.62,0,.48,.35,.32);orb(torso,m.cloth,0,1.05,0,.37,.47,.28);
  box(torso,m.leather,0,.93,.02,.7,.09,.56);box(torso,m.gold,0,.93,.313,.13,.12,.045);
  const strap=box(torso,m.leather,0,1.21,.235,.09,.64,.065);strap.rotation.z=-.52;
  orb(torso,m.cloth,0,1.6,-.05,.4,.4,.35);orb(torso,m.dark,0,1.57,.19,.3,.27,.15);orb(torso,m.skin,0,1.54,.27,.215,.24,.12);
  const hood=part(torso,coneG,m.cloth,0,1.82,-.1,.35,.45,.35);hood.rotation.x=-.25;
  box(torso,m.dark,-.075,1.6,.38,.045,.035,.025);box(torso,m.dark,.075,1.6,.38,.045,.035,.025);
  box(torso,m.skin,0,1.52,.395,.05,.07,.055);box(torso,m.cloth,0,1.37,.27,.43,.12,.1);
  const feather=part(torso,coneG,m.gold,-.28,1.9,-.11,.055,.48,.04);feather.rotation.z=-.55;
  const legs=[];for(const side of [-1,1]){const leg=new THREE.Group();leg.position.set(side*.19,.65,0);torso.add(leg);box(leg,m.leather,0,-.22,0,.23,.48,.24);box(leg,m.dark,0,-.48,.06,.27,.23,.4);box(leg,m.gold,0,-.34,.13,.2,.045,.035);legs.push(leg);}
  g.userData.legs=legs;
  const armL=new THREE.Group();armL.position.set(-.36,1.22,0);torso.add(armL);orb(armL,m.cloth,0,-.08,0,.19,.2,.2);beam(armL,m.leather,[0,-.12,0],[-.08,-.36,.29],.105);orb(armL,m.skin,-.08,-.36,.32,.11);
  const armR=new THREE.Group();armR.position.set(.36,1.22,0);torso.add(armR);orb(armR,m.cloth,0,-.08,0,.19,.2,.2);beam(armR,m.leather,[0,-.1,0],[.05,-.3,.2],.105);orb(armR,m.skin,.05,-.3,.24,.11);
  const weapon=new THREE.Group();weapon.position.set(-.45,.9,.39);torso.add(weapon);const bowmat=mat(0xc0a16d);const pts=[[-.04,-.57,0],[.12,-.36,.05],[.19,0,.1],[.12,.36,.05],[-.04,.57,0]];for(let i=1;i<pts.length;i++)beam(weapon,bowmat,pts[i-1],pts[i],.045);beam(weapon,m.pale,pts[0],pts[4],.008);g.userData.weapon=weapon;const staff=new THREE.Group();staff.position.set(-.43,.85,.28);beam(staff,m.leather,[0,-.75,0],[0,.95,0],.04);orb(staff,m.gold,0,.94,0,.16);part(staff,rockG,new THREE.MeshBasicMaterial({color:C.teal}),0,1.12,0,.13,.23,.13);torso.add(staff);g.userData.staff=staff;const heldRock=part(torso,rockG,m.stone,-.45,.9,.42,.23,.23,.23);g.userData.heldRock=heldRock;
  // Quiver with individually visible arrows.
  const quiver=box(torso,m.leather,.26,1.08,-.31,.23,.62,.23);quiver.rotation.z=-.18;for(let i=0;i<3;i++){beam(torso,bowmat,[.16+i*.085,1.27,-.31],[.1+i*.085,1.78,-.31],.012);box(torso,m.pale,.1+i*.085,1.73,-.31,.07,.12,.025);}
  const shadow=ring(g,C.teal,.55,.45,.03);g.userData.aura=shadow;return g;
 }
 makeEnemy(type){
  const g=new THREE.Group(),m=this.materials,t=String(type).toLowerCase();let kind=t.includes('boss')||t.includes('warden')?'boss':t.includes('brute')||t.includes('tank')||t.includes('golem')?'brute':t.includes('wisp')||t.includes('mage')||t.includes('caster')?'wisp':'imp';
  g.userData.kind=kind;const body=new THREE.Group();g.add(body);g.userData.body=body;
  if(kind==='imp'){
   const skin=mat(0x9b6858),cloth=mat(0x664447),ivory=mat(0xe2cba1);
   orb(body,cloth,0,.66,0,.34,.41,.25);orb(body,skin,0,1.1,.03,.37,.3,.28);
   for(const side of [-1,1]){const ear=part(body,coneG,skin,side*.39,1.16,0,.17,.48,.12);ear.rotation.z=side*-1.1;orb(body,m.dark,side*.13,1.12,.27,.12,.1,.04);glow(body,C.coral,side*.13,1.13,.305,.045);beam(body,skin,[side*.3,.82,0],[side*.43,.45,.12],.095);box(body,m.dark,side*.18,.2,.04,.21,.4,.26);const horn=part(body,coneG,ivory,side*.2,1.42,-.02,.08,.27,.08);horn.rotation.z=side*-.25;}
   box(body,ivory,0,.99,.3,.16,.04,.035);const knife=box(body,m.pale,.44,.55,.28,.07,.37,.1);knife.rotation.x=.5;box(body,m.gold,.43,.38,.17,.22,.035,.08);
  }else if(kind==='brute'){
   const stone=mat(0x6a7770),dark=mat(0x3f514f);orb(body,stone,0,1.1,0,.75,.73,.53);box(body,dark,0,.7,.05,1,.25,.7);orb(body,stone,0,1.96,0,.43,.38,.36);
   box(body,m.dark,0,1.96,.34,.57,.12,.07);box(body,new THREE.MeshBasicMaterial({color:C.coral}),0,1.96,.385,.36,.035,.03);
   for(const side of [-1,1]){orb(body,stone,side*.8,1.45,0,.43,.4,.44);orb(body,dark,side*.96,.84,.05,.31,.49,.31);box(body,stone,side*1,.46,.12,.52,.5,.5);box(body,dark,side*.39,.35,.03,.45,.65,.48);box(body,stone,side*.39,.12,.15,.57,.22,.72);part(body,rockG,m.moss,side*.58,1.83,-.03,.3,.23,.35);}
   const rune=box(body,new THREE.MeshBasicMaterial({color:0xff977a}),0,1.2,.52,.09,.45,.03);rune.rotation.z=.4;box(body,m.moss,0,2.28,-.08,.5,.12,.4);
  }else if(kind==='wisp'){
   const robe=mat(0x66547b),inner=mat(0x302c4b);part(body,new THREE.ConeGeometry(.54,1.1,7),robe,0,.77,0);orb(body,robe,0,1.47,0,.38,.4,.34);orb(body,inner,0,1.46,.23,.28,.29,.12);glow(body,C.teal,0,1.47,.35,.13);
   for(const side of [-1,1]){const arm=part(body,coneG,robe,side*.43,1.05,.03,.24,.64,.25);arm.rotation.z=side*.6;glow(body,C.teal,side*.6,.9,.1,.1);}
   beam(body,m.leather,[.65,.3,.1],[.65,1.95,.1],.035);const gem=part(body,rockG,new THREE.MeshBasicMaterial({color:C.teal}),.65,2.03,.1,.14,.24,.14);ring(body,C.teal,.45,.35,.025).position.y=.2;
  }else{
   const bone=mat(0xdbcca9),bark=mat(0x4c5851),robe=mat(0x4d383e);part(body,new THREE.ConeGeometry(1,1.7,8),robe,0,.95,0);orb(body,bark,0,1.9,0,.9,.85,.6);orb(body,bone,0,2.8,.15,.53,.64,.4);orb(body,m.dark,0,2.93,.49,.4,.23,.06);
   for(const side of [-1,1]){glow(body,C.coral,side*.2,2.96,.55,.09);beam(body,bark,[side*.7,2.3,0],[side*1.1,1.15,.1],.22);orb(body,bone,side*1.16,1.05,.1,.24,.33,.24);beam(body,bone,[side*.34,3.15,0],[side*.85,3.85,-.1],.12);beam(body,bone,[side*.85,3.85,-.1],[side*.99,4.45,-.2],.065);beam(body,bone,[side*.64,3.56,-.05],[side*1.25,3.8,-.1],.075);beam(body,bone,[side*1.25,3.8,-.1],[side*1.42,4.08,-.1],.04);beam(body,bone,[side*.9,4,-.1],[side*1.3,4.25,-.1],.045);}
   const crown=part(body,rockG,new THREE.MeshBasicMaterial({color:C.coral}),0,2,.62,.22,.38,.12);for(let i=0;i<5;i++)beam(body,bone,[(i-2)*.16,1.8,.54],[(i-2)*.2,1.3,.61],.035);
  }
  const tell=ring(g,C.coral,1,.75,.07);tell.visible=false;g.userData.tell=tell;
  const hp=new THREE.Group();hp.position.y=kind==='boss'?4.8:kind==='brute'?2.65:2.2;g.add(hp);const back=box(hp,new THREE.MeshBasicMaterial({color:0x18262a}),0,0,0,.8,.075,.035),fill=box(hp,new THREE.MeshBasicMaterial({color:C.coral}),0,.002,.025,.76,.045,.025);hp.visible=false;g.userData.hp=hp;g.userData.hpFill=fill;
  return g;
 }
 disposeTransient(root){
  const sharedGeometry=new Set([boxG,sphereG,rockG,coneG,cylG]);
  const sharedMaterials=new Set(Object.values(this.materials));
  const geometries=new Set(),materials=new Set();
  root.traverse(o=>{if(o.geometry&&!sharedGeometry.has(o.geometry))geometries.add(o.geometry);if(o.material)for(const m of(Array.isArray(o.material)?o.material:[o.material]))if(!sharedMaterials.has(m))materials.add(m);});
  for(const g of geometries)g.dispose();for(const m of materials)m.dispose();
 }
 resize(width,height){this.width=width;this.height=height;this.renderer.setSize(width,height,false);const aspect=width/Math.max(height,1),view=aspect<1?19/aspect:17;this.camera.left=-view*aspect;this.camera.right=view*aspect;this.camera.top=view;this.camera.bottom=-view;this.camera.updateProjectionMatrix();}
 aim(clientX,clientY){const r=this.canvas.getBoundingClientRect();this.pointer.set((clientX-r.left)/r.width*2-1,-(clientY-r.top)/r.height*2+1);this.ray.setFromCamera(this.pointer,this.camera);const v=new THREE.Vector3();const hit=this.ray.ray.intersectPlane(this.plane,v);return hit?{x:clamp(v.x,-13,13),z:clamp(v.z,-13,13)}:{x:0,z:0};}
 render(game,dt=.016){
  const t=game.time||0,p=game.player||{};this.player.position.set(p.x||0,0,p.z||0);this.player.rotation.y=p.angle||0;this.player.userData.weapon.visible=!p.weapon||p.weapon==='bow';this.player.userData.staff.visible=p.weapon==='magic';this.player.userData.heldRock.visible=p.weapon==='rock';
  const prev=this.lastPlayer||{x:p.x,z:p.z};const speed=Math.min(1,Math.hypot((p.x||0)-(prev.x||0),(p.z||0)-(prev.z||0))/Math.max(.001,dt)/4);this.lastPlayer={x:p.x,z:p.z};
  this.player.userData.body.position.y=Math.sin(t*16)*.045*speed+(p.dash>0?.08:0);this.player.userData.legs.forEach((l,i)=>l.rotation.x=Math.sin(t*16+i*Math.PI)*.6*speed);this.player.userData.cape.rotation.x=-.15-speed*.32+Math.sin(t*4)*.03;
  this.player.visible=!(p.invuln>0&&Math.floor(t*24)%3===0);this.player.userData.aura.material.opacity=.3+Math.sin(t*3)*.1;
  const living=new Set();for(const e of game.enemies||[]){living.add(e.id);let mesh=this.enemies.get(e.id);if(!mesh){mesh=this.makeEnemy(e.type);this.scene.add(mesh);this.enemies.set(e.id,mesh);}mesh.position.set(e.x,0,e.z);mesh.rotation.y=e.angle||0;const kind=mesh.userData.kind;mesh.userData.body.position.y=kind==='wisp'?.18+Math.sin(t*3+(typeof e.id==='number'?e.id:String(e.id).length))*.12:Math.sin(t*10+(typeof e.id==='number'?e.id:String(e.id).length))*.035;
   mesh.userData.body.rotation.z=kind==='imp'?Math.sin(t*10+(typeof e.id==='number'?e.id:String(e.id).length))*.035:0;mesh.userData.tell.visible=e.tell>0;const radius=kind==='boss'?3.6:kind==='brute'?2.2:1.15;mesh.userData.tell.scale.setScalar(radius);mesh.userData.tell.material.opacity=.45+Math.sin(t*18)*.25;
   mesh.userData.hp.visible=e.hp<e.maxHp;mesh.userData.hp.quaternion.copy(this.camera.quaternion);mesh.userData.hp.rotation.y-=mesh.rotation.y;mesh.userData.hpFill.scale.x=clamp(e.hp/e.maxHp,0,1);mesh.userData.hpFill.position.x=-.38*(1-clamp(e.hp/e.maxHp,0,1));
  }for(const [id,m]of this.enemies)if(!living.has(id)){this.scene.remove(m);this.disposeTransient(m);this.enemies.delete(id);}
  const active=new Set();for(const p of game.projectiles||[]){active.add(p.id);let mesh=this.projectiles.get(p.id);if(!mesh){mesh=new THREE.Group();const color=p.enemy?C.coral:p.kind==='magic'||p.kind==='orb'?C.teal:C.gold;if(p.kind==='rock'){part(mesh,rockG,this.materials.stone,0,0,0,.28,.3,.3);part(mesh,rockG,this.materials.gold,0,.08,.2,.11,.12,.07);}else if(p.kind==='arrow'){beam(mesh,this.materials.leather,[0,0,-.38],[0,0,.28],.025);const tip=part(mesh,coneG,this.materials.pale,0,0,.36,.07,.2,.07);tip.rotation.x=Math.PI/2;box(mesh,this.materials.pale,0,0,-.3,.16,.025,.14);}else{orb(mesh,new THREE.MeshBasicMaterial({color}),0,0,0,.16);orb(mesh,new THREE.MeshBasicMaterial({color,transparent:true,opacity:.18,depthWrite:false}),0,0,0,.3);}this.scene.add(mesh);this.projectiles.set(p.id,mesh);}mesh.position.set(p.x,p.y??.85,p.z);mesh.rotation.y=p.angle||0;}
  for(const[id,m]of this.projectiles)if(!active.has(id)){this.scene.remove(m);this.disposeTransient(m);this.projectiles.delete(id);}
  // Pooled transient effects keep combat smooth even during a full wave.
  const effects=game.effects||[];while(this.effectMeshes.length<effects.length){const g=new THREE.Group();const ringMesh=ring(g,C.gold,1,.8,.06);g.userData.ring=ringMesh;const sparks=[];for(let j=0;j<7;j++)sparks.push(part(g,rockG,new THREE.MeshBasicMaterial({color:C.gold}),0,0,0,.05,.05,.05));g.userData.sparks=sparks;const chain=part(g,cylG,new THREE.MeshBasicMaterial({color:C.teal,transparent:true,opacity:1}),0,0,0,.035,1,.035);chain.visible=false;g.userData.chain=chain;this.effectsRoot.add(g);this.effectMeshes.push(g);}
  this.effectMeshes.forEach((g,i)=>{const e=effects[i];g.visible=!!e;if(!e)return;const age=1-clamp(e.life/(e.maxLife||.5),0,1),kind=String(e.kind),color=kind.includes('heal')?C.teal:kind.includes('hit')||kind.includes('enemy')?C.coral:C.gold;g.position.set(e.x,e.y||.02,e.z);g.userData.chain.visible=kind==='chain';if(kind==='chain'){const d=new THREE.Vector3((e.tx??e.x)-e.x,0,(e.tz??e.z)-e.z);g.userData.chain.position.copy(d).multiplyScalar(.5);g.userData.chain.scale.set(.035,d.length(),.035);g.userData.chain.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.clone().normalize());g.userData.chain.material.opacity=1-age;}const radius=(e.r||.75)*(.2+age*.8);g.userData.ring.scale.setScalar(radius);g.userData.ring.material.color.setHex(color);g.userData.ring.material.opacity=(1-age)*.65;g.userData.sparks.forEach((s,j)=>{const a=j*TAU/7+age*.6;s.position.set(Math.sin(a)*radius,Math.sin(age*Math.PI)*.7+.08,Math.cos(a)*radius);s.scale.setScalar(.06*(1-age));s.material.color.setHex(color);});});
  const pickups=game.pickups||[];while(this.pickupMeshes.length<pickups.length){const g=new THREE.Group();const gem=part(g,rockG,mat(C.teal,{emissive:C.teal,emissiveIntensity:.7}),0,.4,0,.13,.23,.13);g.userData.gem=gem;ring(g,C.teal,.24,.35,.022);this.pickupRoot.add(g);this.pickupMeshes.push(g);}this.pickupMeshes.forEach((g,i)=>{const o=pickups[i];g.visible=!!o;if(!o)return;g.position.set(o.x,0,o.z);g.userData.gem.position.y=.38+Math.sin(t*4+i)*.08;g.userData.gem.rotation.y=t*1.6;const color=o.kind==='health'||o.kind==='heal'?C.coral:C.teal;g.userData.gem.material.color.setHex(color);g.userData.gem.material.emissive.setHex(color);});
  const obs=game.obstacles||[];obs.forEach((o,i)=>{if(!this.obstacleMeshes.has(i)){const g=new THREE.Group();const rr=o.r||.7;part(g,rockG,this.materials.stone,0,rr*.55,0,rr,rr*.8,rr);part(g,rockG,this.materials.moss,-rr*.2,rr*1.08,0,rr*.65,rr*.2,rr*.65);g.position.set(o.x,0,o.z);g.rotation.y=i*1.77;this.scene.add(g);this.obstacleMeshes.set(i,g);}});
  this.fireflies.rotation.y=Math.sin(t*.03)*.03;this.fireflies.position.y=Math.sin(t*.7)*.1;this.renderer.render(this.scene,this.camera);
 }
 dispose(){this.scene.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material){for(const m of(Array.isArray(o.material)?o.material:[o.material]))m.dispose();}});this.renderer.dispose();}
}
