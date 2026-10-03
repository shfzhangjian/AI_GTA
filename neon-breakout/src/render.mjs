import * as T from '../vendor/three.module.min.js';
import {HEROES,LANES,GATE_INFO} from './data.mjs';
import {seeded,clamp} from './game.mjs';
import {makeHero,makeZombie,animateHero,animateMonster,characterResources} from './characters.mjs';
export {makeHero,makeZombie} from './characters.mjs';
const geo={box:new T.BoxGeometry(1,1,1),ball:new T.SphereGeometry(1,14,10),cylinder:new T.CylinderGeometry(1,1,1,12),cone:new T.ConeGeometry(1,1,12),capsule:new T.CapsuleGeometry(.16,.45,3,8)};
const materials=new Map();
function material(color,options={}){const key=`${color}-${JSON.stringify(options)}`;if(!materials.has(key))materials.set(key,new T.MeshStandardMaterial({color,roughness:.68,metalness:.05,...options}));return materials.get(key);}
function mesh(parent,type,color,x,y,z,sx,sy,sz,options={}){const m=new T.Mesh(geo[type],material(color,options));m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function group(parent,x=0,y=0,z=0){const g=new T.Group();g.position.set(x,y,z);parent.add(g);return g;}
// Batch the fixed parts of each articulated limb by material; joints still animate independently.
function batchParts(parent){
  const batches=new Map();for(const m of parent.children.filter(m=>m.isMesh)){if(!batches.has(m.material))batches.set(m.material,[]);batches.get(m.material).push(m);}
  for(const [mat,parts] of batches){if(parts.length<2)continue;const transformed=parts.map(m=>{m.updateMatrix();const clone=m.geometry.clone().applyMatrix4(m.matrix);return clone.index?clone.toNonIndexed():clone;});const merged=new T.BufferGeometry();
    for(const name of ['position','normal','uv']){const size=transformed[0].getAttribute(name).itemSize;const arrays=transformed.map(g=>g.getAttribute(name).array);const buffer=new Float32Array(arrays.reduce((sum,a)=>sum+a.length,0));let offset=0;for(const a of arrays){buffer.set(a,offset);offset+=a.length;}merged.setAttribute(name,new T.BufferAttribute(buffer,size));}
    const combined=new T.Mesh(merged,mat);combined.castShadow=true;combined.receiveShadow=true;parts.forEach(m=>parent.remove(m));transformed.forEach(g=>g.dispose());parent.add(combined);
  }
}
function labelTexture(text,sub='',bg='#168ace',fg='#fff',width=512,height=256){
  const c=document.createElement('canvas');c.width=width;c.height=height;const ctx=c.getContext('2d');
  ctx.fillStyle=bg;ctx.fillRect(0,0,width,height);ctx.strokeStyle=fg;ctx.lineWidth=6;ctx.strokeRect(10,10,width-20,height-20);ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillStyle=fg;ctx.font=`900 ${sub?72:88}px "Microsoft YaHei", sans-serif`;ctx.fillText(text,width/2,sub?height*.43:height*.5,width-32);
  if(sub){ctx.globalAlpha=.8;ctx.font='600 30px "Microsoft YaHei", sans-serif';ctx.fillText(sub,width/2,height*.77,width-32);}
  const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;return tex;
}
function label(parent,text,sub,bg,x,y,z,w,h,fg){const tex=labelTexture(text,sub,bg,fg);const m=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map:tex,side:T.DoubleSide}));m.position.set(x,y,z);parent.add(m);return m;}
function instanced(parent,geometry,mat,entries){const m=new T.InstancedMesh(geometry,mat,entries.length);const o=new T.Object3D();for(let i=0;i<entries.length;i++){const e=entries[i];o.position.set(...e.p);o.scale.set(...e.s);o.rotation.set(...(e.r||[0,0,0]));o.updateMatrix();m.setMatrixAt(i,o.matrix);if(e.c)m.setColorAt(i,new T.Color(e.c));}m.receiveShadow=true;parent.add(m);return m;}
function roof(parent,x,y,z,w,d,color=0x253f68){
  const shape=new T.Shape();shape.moveTo(-w/2,-.18);shape.lineTo(-w*.61,.3);shape.quadraticCurveTo(-w*.3,-.02,0,.62);shape.quadraticCurveTo(w*.3,-.02,w*.61,.3);shape.lineTo(w/2,-.18);shape.closePath();
  const r=new T.Mesh(new T.ExtrudeGeometry(shape,{depth:d,bevelEnabled:false}),material(color));r.position.set(x,y,z-d/2);r.castShadow=true;parent.add(r);
  mesh(parent,'box',0xf8c776,x,y-.19,z,w,.07,d+0.04);
}
export class Renderer {
  constructor(canvas,quality='high'){
    this.canvas=canvas;this.quality=quality;this.renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});this.renderer.outputColorSpace=T.SRGBColorSpace;this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.1;this.renderer.shadowMap.type=T.PCFSoftShadowMap;
    this.scene=new T.Scene();this.scene.fog=new T.Fog(0xe6b2ba,65,170);this.camera=new T.PerspectiveCamera(52,1,.1,300);this.elapsed=0;this.mode='menu';this.heroID='lin';this.entityMeshes=new Map();this.particles=[];this.particlePool=[];this.scenery=[];this.gateMeshes=new Map();this.demo=new T.Group();this.scene.add(this.demo);
    this.scene.add(new T.HemisphereLight(0xbadffa,0xc18b68,1.8));
    this.sunLight=new T.DirectionalLight(0xffe0ae,2.8);this.sunLight.position.set(-17,34,12);this.sunLight.castShadow=true;this.sunLight.shadow.mapSize.set(2048,2048);Object.assign(this.sunLight.shadow.camera,{left:-25,right:25,top:35,bottom:-35,near:1,far:100});this.sunLight.shadow.bias=-.0007;this.scene.add(this.sunLight);this.scene.add(this.sunLight.target);
    this.buildSky();this.buildTrack();this.buildTown();this.buildArena();this.hero=makeHero();this.scene.add(this.hero);this.boss=makeZombie(true);this.boss.visible=false;this.scene.add(this.boss);
    this.warningArea=new T.Mesh(new T.PlaneGeometry(2.55,6),new T.MeshBasicMaterial({color:0xff295d,transparent:true,opacity:.46,side:T.DoubleSide,depthWrite:false}));this.warningArea.rotation.x=-Math.PI/2;this.warningArea.position.y=.035;this.warningArea.visible=false;this.scene.add(this.warningArea);
    this.waveRing=new T.Mesh(new T.TorusGeometry(1,.075,6,64),new T.MeshBasicMaterial({color:0xff6672,transparent:true,opacity:.8}));this.waveRing.rotation.x=-Math.PI/2;this.waveRing.visible=false;this.scene.add(this.waveRing);
    this.aura=new T.Mesh(new T.TorusGeometry(.9,.035,6,50),new T.MeshBasicMaterial({color:0xffd266,transparent:true,opacity:.8}));this.aura.rotation.x=-Math.PI/2;this.aura.visible=false;this.scene.add(this.aura);
    this.buildDemo();this.resize();this.setQuality(quality);window.addEventListener('resize',()=>this.resize());
  }
  setQuality(q){this.quality=q;this.renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,q==='low'?1:1.7));this.renderer.shadowMap.enabled=q==='high';this.sunLight.castShadow=q==='high';this.resize();}
  resize(){const w=this.canvas.clientWidth,h=this.canvas.clientHeight;this.mobile=w<700;this.camera.aspect=w/h;this.camera.fov=this.mobile?68:49;this.camera.updateProjectionMatrix();this.renderer.setSize(w,h,false);}
  setHero(id){if(id===this.heroID)return;this.scene.remove(this.hero);this.disposeDynamic(this.hero);this.hero=makeHero(id);this.scene.add(this.hero);this.heroID=id;}
  disposeDynamic(root){const c=characterResources(),sharedGeo=new Set([...Object.values(geo),...c.geometries]),sharedMat=new Set([...materials.values(),...c.materials]);root.traverse(o=>{if(!o.isMesh)return;if(!sharedGeo.has(o.geometry))o.geometry.dispose();if(!sharedMat.has(o.material)){o.material.map?.dispose();o.material.dispose();}});}
  buildSky(){
    const sky=new T.Mesh(new T.SphereGeometry(240,24,16),new T.ShaderMaterial({side:T.BackSide,depthWrite:false,uniforms:{top:{value:new T.Color(0x9b91c5)},middle:{value:new T.Color(0xffb0b9)},bottom:{value:new T.Color(0xffd6a0)}},vertexShader:'varying vec3 vP;void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'uniform vec3 top;uniform vec3 middle;uniform vec3 bottom;varying vec3 vP;void main(){float h=normalize(vP).y;vec3 c=mix(bottom,middle,smoothstep(-.04,.26,h));c=mix(c,top,smoothstep(.22,.85,h));gl_FragColor=vec4(c,1.);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}'}));this.scene.add(sky);
    const sun=new T.Mesh(new T.SphereGeometry(1,32,16),new T.MeshBasicMaterial({color:0xffe0a6,fog:false}));sun.position.set(48,32,-165);sun.scale.setScalar(13);this.scene.add(sun);
    const rand=seeded(424),clouds=[];for(let i=0;i<40;i++){const x=(rand()-.5)*220,y=25+rand()*25,z=-65-rand()*125;clouds.push({p:[x,y,z],s:[4+rand()*8,1+rand()*2,2+rand()*4],c:0xffdacb});}instanced(this.scene,geo.ball,new T.MeshStandardMaterial({color:0xffdfdc,roughness:1}),clouds);
  }
  buildTrack(){
    this.track=new T.Group();this.scene.add(this.track);
    const c=document.createElement('canvas');c.width=256;c.height=256;const cx=c.getContext('2d');cx.fillStyle='#1474d1';cx.fillRect(0,0,256,256);cx.fillStyle='#1585dc';cx.fillRect(0,0,128,128);cx.fillRect(128,128,128,128);cx.strokeStyle='#75c6ff';cx.lineWidth=1;for(let i=0;i<=256;i+=128){cx.beginPath();cx.moveTo(i,0);cx.lineTo(i,256);cx.stroke();cx.beginPath();cx.moveTo(0,i);cx.lineTo(256,i);cx.stroke();}
    this.floorTexture=new T.CanvasTexture(c);this.floorTexture.colorSpace=T.SRGBColorSpace;this.floorTexture.wrapS=this.floorTexture.wrapT=T.RepeatWrapping;this.floorTexture.repeat.set(3,50);this.floorTexture.anisotropy=4;
    const road=new T.Mesh(new T.BoxGeometry(8.9,.4,180),new T.MeshStandardMaterial({map:this.floorTexture,roughness:.34,metalness:.25,color:0xd1f8ff}));road.position.set(0,-.25,-70);road.receiveShadow=true;this.track.add(road);
    for(const x of [-4.65,4.65]){mesh(this.track,'box',0xf7f3e9,x,.06,-70,.24,.2,180);mesh(this.track,'box',0x31dcf7,x-.03,.18,-70,.08,.05,180,{emissive:0x22c9ee,emissiveIntensity:.8});mesh(this.track,'box',0x526b92,x,-.45,-70,.18,.7,180);}
    // Split lane markings, chevrons, and pylons use instancing to keep mobile draw calls bounded.
    const marks=[];for(let z=0;z>-155;z-=8)for(const x of [-1.48,1.48])marks.push({p:[x,.011,z],s:[.045,.018,3],c:0x8fdae5});instanced(this.track,geo.box,material(0xc3f6fb,{transparent:true,opacity:.35}),marks);
    this.pylons=new T.Group();this.track.add(this.pylons);const posts=[],tips=[];for(let i=0;i<24;i++)for(const s of [-1,1]){posts.push({p:[s*4.68,.63,-i*7],s:[.06,1.08,.06]});tips.push({p:[s*4.68,1.2,-i*7],s:[.12,.12,.12]});}instanced(this.pylons,geo.cylinder,material(0xf4f4ec),posts);instanced(this.pylons,geo.ball,material(0x36e3f8,{emissive:0x0abae4,emissiveIntensity:1.1}),tips);
  }
  buildTown(){
    const rand=seeded(1204);this.town=new T.Group();this.scene.add(this.town);const buildings=[],roofs=[],windows=[],ground=[],trunks=[],leaves=[];const palette=[0xfca977,0xf27ca4,0x5cbebb,0x729ed2,0xe9c888,0xa495bd,0xff9a95];
    for(let i=0;i<160;i++){
      const side=i%2?1:-1,x=side*(9+rand()*70),z=-155+rand()*200,w=2+rand()*4,d=3+rand()*4,h=3+rand()*16,y=-6+h/2;const col=palette[Math.floor(rand()*palette.length)];
      buildings.push({p:[x,y,z],s:[w,h,d],c:col});roofs.push({p:[x,-6+h+.15,z],s:[w+.15,.3,d+.15],c:0xf9d0a0});
      for(let row=0;row<Math.min(6,h/2);row++)for(let col=0;col<2;col++)windows.push({p:[x+(col-.5)*w*.5,-4+row*2,z+d/2+.015],s:[w*.17,.65,.04],c:rand()>.5?0xffe7b0:0x456d86});
      ground.push({p:[x,-6.1,z],s:[w+1,.1,d+1],c:0xe9bc8a});
    }
    instanced(this.town,geo.box,material(0xffffff),buildings);instanced(this.town,geo.box,material(0xffffff),roofs);instanced(this.town,geo.box,material(0xffffff,{roughness:.3}),windows);instanced(this.town,geo.box,material(0xffffff),ground);
    for(let i=0;i<28;i++){const side=i%2?1:-1,x=side*(7+rand()*12),z=-145+rand()*180,y=-3.4;trunks.push({p:[x,y,z],s:[.17,5.2,.17],r:[0,0,(rand()-.5)*.15]});for(let j=0;j<6;j++){const a=j*Math.PI/3;leaves.push({p:[x+Math.cos(a)*.8,y+2.6,z+Math.sin(a)*.8],s:[.28,.16,2.5],r:[.3,a,0],c:j%2?0x449b74:0x6ebd77});}}
    instanced(this.town,geo.cylinder,material(0xad7750),trunks);instanced(this.town,geo.ball,material(0xffffff),leaves);
    const plaza=mesh(this.town,'box',0xe4b682,0,-6.3,-50,200,.2,240);plaza.castShadow=false;
    const sea=mesh(this.scene,'box',0x37becb,0,-7,-110,260,.3,300,{metalness:.35,roughness:.25});sea.castShadow=false;
    this.palace=group(this.scene,0,0,-128);mesh(this.palace,'box',0x765786,0,6,-2,30,16,12);mesh(this.palace,'box',0xc198a4,0,1.6,5,30,3.2,5);mesh(this.palace,'box',0x314663,0,5,5,5,7,2);label(this.palace,'霓 城','守住这座城','#192d4c',0,9,5.1,6,2,'#ffdd93');
    roof(this.palace,0,14,-1,32,13);for(const x of [-11,-6,6,11]){mesh(this.palace,'box',0xd48c88,x,14,0,3.5,11,4);roof(this.palace,x,19.5,0,5,5);mesh(this.palace,'cone',0xfac676,x,21,0,.15,2,.15);}mesh(this.palace,'box',0x976e96,0,19,-2,11,9,7);roof(this.palace,0,24,-2,15,8);mesh(this.palace,'box',0xbd7e88,0,27,-2,5,6,5);roof(this.palace,0,30,-2,8,6);
    for(let i=0;i<10;i++){const g=group(this.scene,(i%2?1:-1)*8.2,0,-10-Math.floor(i/2)*22);mesh(g,'cylinder',0x74597c,0,.7,0,.1,7,.1);const lantern=mesh(g,'ball',0xff6d67,0,3.2,0,.45,.55,.45,{emissive:0xb63a28,emissiveIntensity:.3});mesh(g,'cylinder',0xffd685,0,3.8,0,.35,.1,.35);mesh(g,'cylinder',0xffd685,0,2.65,0,.3,.1,.3);mesh(g,'box',0xf2ba54,0,2.4,0,.035,.35,.035);this.scenery.push({g,z:g.position.z,lantern});}
    const signs=['天街','茶舍','霓城','长桥'];for(let i=0;i<4;i++){const g=group(this.town,(i%2?1:-1)*12,1.5,-20-i*30);label(g,signs[i],'','#295b77',0,0,0,2.4,1.2,'#ffe5ba');}
  }
  buildArena(){
    this.arena=new T.Group();this.arena.visible=false;this.scene.add(this.arena);
    const disc=new T.Mesh(new T.CylinderGeometry(14,14,.7,64),material(0x269ecd,{metalness:.2,roughness:.3}));disc.position.set(0,-.4,-9);disc.receiveShadow=true;this.arena.add(disc);
    for(let i=0;i<3;i++){const r=new T.Mesh(new T.TorusGeometry(7+i*3.2,.085,6,72),material(i%2?0xff77af:0xa5edff,{emissive:i%2?0xc64d83:0x75c3dd,emissiveIntensity:.5}));r.rotation.x=-Math.PI/2;r.position.set(0,0,-9);this.arena.add(r);}
    for(let i=0;i<16;i++){const a=i/16*Math.PI*2;const m=mesh(this.arena,'box',i%2?0xee689d:0x69c8e4,Math.sin(a)*12,-.02,-9+Math.cos(a)*12,1.5,.05,2.5);m.rotation.y=a;}
    for(const s of [-1,1]){const stands=group(this.arena,s*15,0,-16);mesh(stands,'box',0x805991,0,2.5,0,4,5,26);mesh(stands,'box',0xfdd490,-s*2,3.8,0,.1,.12,26);const crowd=[];for(let i=0;i<50;i++)crowd.push({p:[s*(.5+(i%3)*.65),3+Math.floor(i%9)/5,-12+i*.48],s:[.3,.58,.3],c:[0xffae61,0xfb91a8,0x62cccf][i%3]});instanced(stands,geo.ball,material(0xffffff),crowd);
      for(let i=0;i<4;i++){const x=s*13,z=-6-i*7;mesh(this.arena,'cylinder',0x354966,x,5,z,.12,10,.12);mesh(this.arena,'box',0xfd96d0,x,9.5,z,.8,.5,.8,{emissive:0xff5aac,emissiveIntensity:1});const beam=new T.Mesh(new T.ConeGeometry(3,15,12,1,true),new T.MeshBasicMaterial({color:i%2?0x69e0fb:0xff7ac0,transparent:true,opacity:.09,side:T.DoubleSide,depthWrite:false}));beam.position.set(s*9,3,z);beam.rotation.z=-s*.4;this.arena.add(beam);}}
    const gate=group(this.arena,0,0,-32);mesh(gate,'box',0x38476f,-9,5,0,1.2,10,1.2);mesh(gate,'box',0x38476f,9,5,0,1.2,10,1.2);mesh(gate,'box',0x694d84,0,9,0,19,1.5,1.2);roof(gate,0,10,0,20,3);label(gate,'霓城擂台','最后的防线','#29345e',0,8.8,.67,7.2,1.4,'#ffe09b');
  }
  makeGate(gate){const root=new T.Group();for(const c of gate.choices){const info=GATE_INFO[c.type],part=group(root,c.x,0,0);for(const side of [-1,1]){mesh(part,'cylinder',info.color,side*1.87,1.6,0,.055,3.2,.055,{emissive:info.color,emissiveIntensity:.35});mesh(part,'ball',0xf5fbff,side*1.87,3.22,0,.115,.115,.115);}mesh(part,'box',info.color,0,3.07,0,3.75,.07,.07,{emissive:info.color,emissiveIntensity:.7});
      const panel=new T.Mesh(new T.PlaneGeometry(3.65,2.9),new T.MeshBasicMaterial({color:info.color,transparent:true,opacity:.17,side:T.DoubleSide,depthWrite:false}));panel.position.y=1.5;part.add(panel);const hex=`#${new T.Color(info.color).getHexString()}`;label(part,info.text,info.sub,hex,0,2.13,.025,3.1,1.3);mesh(part,'box',info.color,0,.02,0,3.7,.025,1.15,{emissive:info.color,emissiveIntensity:.3});}
    return root;
  }
  buildDemo(){const z1=makeZombie(false,true);z1.position.set(0,0,-12);this.demo.add(z1);const z2=makeZombie(false,true);z2.position.set(2.7,0,-19);this.demo.add(z2);const z3=makeZombie(false,true);z3.position.set(-2.7,0,-17);this.demo.add(z3);const gate=this.makeGate({choices:[{x:-2,type:'gun'},{x:2,type:'rate'}]});gate.position.z=-29;this.demo.add(gate);this.demoZombies=[z1,z2,z3];}
  clear(){for(const m of this.entityMeshes.values()){this.scene.remove(m);this.disposeDynamic(m);}this.entityMeshes.clear();for(const m of this.gateMeshes.values()){this.scene.remove(m);this.disposeDynamic(m);}this.gateMeshes.clear();for(const p of this.particles){p.mesh.visible=false;this.particlePool.push(p.mesh);}this.particles=[];}
  setMode(mode){if(mode===this.mode)return;this.mode=mode;this.clear();this.demo.visible=mode==='menu';this.track.visible=true;this.arena.visible=false;this.boss.visible=false;this.warningArea.visible=false;this.waveRing.visible=false;}
  spawnParticles(x,y,z,color,count=8,power=1){for(let i=0;i<count;i++){let m=this.particlePool.pop();if(!m)m=new T.Mesh(geo.box,new T.MeshBasicMaterial({color,transparent:true}));m.material.color.set(color);m.material.opacity=1;m.visible=true;if(!m.parent)this.scene.add(m);m.position.set(x,y,z);m.scale.setScalar(.07+Math.random()*.09);this.particles.push({mesh:m,life:.5+Math.random()*.5,ttl:1,vx:(Math.random()-.5)*5*power,vy:(1+Math.random()*4)*power,vz:(Math.random()-.5)*5*power});}}
  event(e,game){
    const z=e.s!==undefined?-(e.s-game.distance):0;
    if(e.type==='kill')this.spawnParticles(e.x,1.2,z,0xc1eb72,12,1.2);
    if(e.type==='impact')this.spawnParticles(e.x,1.5,z,0xffdc6c,3,.6);
    if(e.type==='gate')this.spawnParticles(game.x,1,0,GATE_INFO[e.gate].color,18,1.5);
    if(e.type==='ability')this.spawnParticles(game.x,.5,0,0xffd378,30,2);
    if(e.type==='slam'){this.shake=.35;this.spawnParticles(e.x,.2,0,0xf1c3a4,35,2);}
    if(e.type==='hurt')this.shake=.2;
    if(e.type==='bossDead')this.spawnParticles(this.boss.position.x,3,this.boss.position.z,0xffda78,65,3);
    if(e.type==='won')this.celebrate=3;
    if(e.type==='shot'){this.muzzle=.065;for(const g of this.hero.userData.guns)g.flash.rotation.z=Math.random()*6;}
  }
  entity(key,factory,used){used.add(key);if(!this.entityMeshes.has(key)){const m=factory();this.scene.add(m);this.entityMeshes.set(key,m);}return this.entityMeshes.get(key);}
  syncGame(game){
    const used=new Set();this.arena.visible=game.phase==='boss';this.track.visible=game.phase!=='boss';this.demo.visible=false;this.boss.visible=game.phase==='boss'&&game.boss.hp>0;
    for(const e of game.enemies){if(e.dead||e.s-game.distance>65||e.s-game.distance<-.5)continue;const low=e.s-game.distance>(this.quality==='low'?18:28);const m=this.entity(`e${e.id}-${low}`,()=>makeZombie(e.kind==='heavy',low),used);if(e.kind==='heavy')m.scale.setScalar(1.15);m.position.set(e.x,0,-(e.s-game.distance));animateMonster(m,game.time,e.phase);}
    for(const g of game.gates){if(g.done||g.s-game.distance>85)continue;const key=`g${g.id}`;used.add(key);if(!this.gateMeshes.has(key)){const m=this.makeGate(g);this.scene.add(m);this.gateMeshes.set(key,m);}this.gateMeshes.get(key).position.z=-(g.s-game.distance);}
    for(const o of game.obstacles){if(o.done||o.s-game.distance>65)continue;const m=this.entity(`o${o.id}`,()=>{const root=new T.Group();mesh(root,'box',0x283e59,0,.53,0,1.8,1.06,1.1);mesh(root,'box',0xffba58,0,.65,.56,1.78,.28,.015);for(const x of [-.6,0,.6]){const stripe=mesh(root,'box',0x384b60,x,.65,.577,.2,.28,.018);stripe.rotation.z=-.4;}return root;},used);m.position.set(o.x,0,-(o.s-game.distance));}
    for(const p of game.pickups){if(p.done||p.s-game.distance>65)continue;const m=this.entity(`p${p.id}`,()=>{const root=new T.Group();mesh(root,'box',0xffc357,0,.7,0,.6,.6,.6,{emissive:0xd69318,emissiveIntensity:.3});mesh(root,'box',0xffebbb,0,.7,.31,.12,.38,.02);mesh(root,'box',0xffebbb,0,.7,.32,.38,.12,.02);return root;},used);m.position.set(p.x,.1+Math.sin(this.elapsed*3+p.id)*.14,-(p.s-game.distance));m.rotation.y=this.elapsed*1.4;}
    for(const b of game.bullets){const m=this.entity(`b${b.id}`,()=>{const root=new T.Group();const trail=mesh(root,'box',game.burst>0?0xffda64:0x78eeff,0,1.98,0,.05,.05,.8,{emissive:game.burst>0?0xffae22:0x31b8ff,emissiveIntensity:2});const tip=mesh(root,'ball',0xffffff,0,1.98,-.42,.065,.065,.09,{emissive:0xffffff,emissiveIntensity:1});return root;},used);m.position.set(b.x,0,-(b.s-game.distance));}
    for(const h of game.hazards){const m=this.entity(`h${h.id}`,()=>{const root=new T.Group();mesh(root,'ball',0xf35796,0,.8,0,.42,.42,.42,{emissive:0xe82374,emissiveIntensity:.8});return root;},used);m.position.set(h.x,.05*Math.sin(this.elapsed*8),-(h.s-game.distance));}
    for(const [key,m] of this.entityMeshes)if(!used.has(key)){this.scene.remove(m);this.disposeDynamic(m);this.entityMeshes.delete(key);}
    for(const [key,m] of this.gateMeshes)if(!used.has(key)){this.scene.remove(m);this.disposeDynamic(m);this.gateMeshes.delete(key);}
    if(game.phase==='boss'){
      const b=game.boss;this.boss.position.set(b.x,Math.abs(Math.sin(b.clock*1.4))*.08,-17);
      const attacking=b.telegraph!==null;animateMonster(this.boss,b.clock,0,{boss:true,attacking});
      this.boss.scale.setScalar(3.1+(b.flash>0?.04:0));
      this.warningArea.visible=attacking&&b.telegraph.kind!=='wave';if(this.warningArea.visible){this.warningArea.position.set(b.telegraph.x,.04,-1);this.warningArea.material.opacity=.25+Math.sin(this.elapsed*18)*.17;}
      this.waveRing.visible=attacking&&b.telegraph.kind==='wave';if(this.waveRing.visible){this.waveRing.position.set(0,.15,-17);this.waveRing.scale.setScalar(1+(1-b.telegraph.remaining/1.4)*17);}
    }else{this.warningArea.visible=false;this.waveRing.visible=false;}
  }
  update(dt,game){
    this.elapsed+=dt;const running=game?.status==='running';const active=this.mode!=='menu'&&game?.level;
    if(active)this.syncGame(game);
    const h=this.hero.userData;const run=active?game.phase==='run'&&running:false;
    animateHero(this.hero,this.elapsed,{running:run,jump:active?game.jumpY:0,shooting:this.muzzle>0,gunCount:active?game.guns:2,menu:!active});
    this.muzzle=Math.max(0,(this.muzzle||0)-dt);h.guns.forEach((g,i)=>{g.flash.visible=active&&this.muzzle>0&&(i===1||game.guns>1);g.gun.visible=!active||i===1||game.guns>1;});
    this.hero.position.set(active?game.x:(this.mobile?1.5:2.15),0,active?0:(this.mobile?-12:1));
    this.hero.rotation.y=active?-(game.targetX-game.x)*.16:(this.mobile?-.5:-.22);this.hero.rotation.z=active?clamp((game.targetX-game.x)*-.035,-.1,.1):0;
    this.hero.visible=!active||game.invincible<=0||Math.floor(game.invincible*14)%2===0;
    const distance=active?game.distance:this.elapsed*2;
    this.floorTexture.offset.y=-distance/3.6/2;
    this.pylons.position.z=distance%7;
    this.town.position.z=(distance*.25)%12;
    for(const {g,z} of this.scenery)g.position.z=((z+distance+150)%154)-150;
    if(!active)this.demoZombies.forEach((m,i)=>animateMonster(m,this.elapsed,i));
    this.aura.visible=active&&game.burst>0;if(this.aura.visible){this.aura.position.set(game.x,.08,0);this.aura.rotation.z=this.elapsed*2;this.aura.scale.setScalar(1+Math.sin(this.elapsed*10)*.07);}
    if(this.celebrate>0){this.celebrate-=dt;if(Math.random()<.4)this.spawnParticles((Math.random()-.5)*10,5+Math.random()*4,-5,[0xffd56b,0xff7aab,0x68f7dc][Math.floor(Math.random()*3)],3,.5);}
    for(const p of this.particles){p.life-=dt;p.mesh.position.x+=p.vx*dt;p.mesh.position.y+=p.vy*dt;p.mesh.position.z+=p.vz*dt;p.vy-=dt*7;p.mesh.rotation.x+=dt*4;p.mesh.rotation.z+=dt*3;p.mesh.material.opacity=Math.max(0,p.life);}
    const live=[];for(const p of this.particles)if(p.life>0)live.push(p);else{p.mesh.visible=false;this.particlePool.push(p.mesh);}this.particles=live;
    const cam=active?(game.phase==='boss'?[game.x*(this.mobile?.4:.18),this.mobile?8:6.7,this.mobile?15:12]:[game.x*(this.mobile?.48:.18),this.mobile?7.8:6.6,this.mobile?14.5:10.3]):(this.mobile?[4.2,8.2,7]:[7,6,12]);
    const look=active?(game.phase==='boss'?[0,2.2,-10]:[game.x*.12,1,-11]):(this.mobile?[0,1.2,-16]:[0,1.3,-10]);
    const factor=this.mode==='menu'?.035:.08;this.camera.position.lerp(new T.Vector3(...cam),factor);this.lookTarget=this.lookTarget||new T.Vector3(...look);this.lookTarget.lerp(new T.Vector3(...look),factor);this.camera.lookAt(this.lookTarget);
    if(this.shake>0){this.shake-=dt;this.camera.position.x+=(Math.random()-.5)*this.shake*.9;this.camera.position.y+=(Math.random()-.5)*this.shake*.6;}
    this.renderer.render(this.scene,this.camera);
  }
  stats(){return{calls:this.renderer.info.render.calls,triangles:this.renderer.info.render.triangles,geometries:this.renderer.info.memory.geometries,textures:this.renderer.info.memory.textures};}
  heroBounds(){const b=new T.Box3().setFromObject(this.hero),points=[];for(const x of [b.min.x,b.max.x])for(const y of [b.min.y,b.max.y])for(const z of [b.min.z,b.max.z])points.push(new T.Vector3(x,y,z).project(this.camera));return{minX:Math.min(...points.map(p=>p.x)),maxX:Math.max(...points.map(p=>p.x)),minY:Math.min(...points.map(p=>p.y)),maxY:Math.max(...points.map(p=>p.y))};}
}
