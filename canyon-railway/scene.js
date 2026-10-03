import * as THREE from 'three';
import {OrbitControls} from 'three/addons/OrbitControls.js';
import {mergeGeometries} from 'three/addons/BufferGeometryUtils.js';
import {STATIONS,GOODS,LANDMARKS,key,coords,riverX,isRiver,railPath,blocked} from './model.js';

const TILE=2.8,UP=new THREE.Vector3(0,1,0);
const palette={sand:0xe6bc81,dust:0xdbae75,rock:0xba6b44,rockLight:0xd28a54,wood:0x8e6845,darkWood:0x6e5036,cream:0xecd9ad,rail:0x717171,blue:0x537e9b,green:0x4e855c};
let seed=7317;function random(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;}const rand=(a,b)=>a+(b-a)*random();
const materials=new Map();function mat(color){if(!materials.has(color))materials.set(color,new THREE.MeshStandardMaterial({color,roughness:1,flatShading:true}));return materials.get(color);}
function mesh(parent,g,color,x=0,y=0,z=0){const m=new THREE.Mesh(g,typeof color==='object'?color:mat(color));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function box(p,w,h,d,c,x=0,y=h/2,z=0){return mesh(p,new THREE.BoxGeometry(w,h,d),c,x,y,z);}
function cyl(p,rt,rb,h,c,x=0,y=h/2,z=0,n=8){return mesh(p,new THREE.CylinderGeometry(rt,rb,h,n),c,x,y,z);}
function ball(p,r,c,x,y,z,detail=0){return mesh(p,new THREE.IcosahedronGeometry(r,detail),c,x,y,z);}
function beam(p,a,b,width,color){const va=new THREE.Vector3(...a),vb=new THREE.Vector3(...b),m=box(p,width,va.distanceTo(vb),width,color);m.position.copy(va.add(vb).multiplyScalar(.5));m.quaternion.setFromUnitVectors(UP,new THREE.Vector3(...b).sub(new THREE.Vector3(...a)).normalize());return m;}
function bake(root){root.updateMatrixWorld(true);const sets=new Map(),original=[];root.traverse(o=>{if(o.isMesh&&!o.material.map){let g=o.geometry.clone();if(g.index)g=g.toNonIndexed();g.applyMatrix4(o.matrixWorld);g.deleteAttribute('uv');g.deleteAttribute('uv1');const list=sets.get(o.material)||[];list.push(g);sets.set(o.material,list);original.push(o);}});for(const o of original){o.removeFromParent();o.geometry.dispose();}for(const [material,geos]of sets){const g=mergeGeometries(geos,false),m=new THREE.Mesh(g,material);m.castShadow=true;m.receiveShadow=true;root.add(m);for(const geo of geos)geo.dispose();}}
function disposeGroup(root){root.traverse(o=>{if(o.isMesh)o.geometry.dispose();});root.clear();}
function sign(p,text,w,x,y,z,background='#eadbb5',color='#6c5940'){
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=128;const c=canvas.getContext('2d');c.fillStyle=background;c.fillRect(0,0,512,128);c.strokeStyle=color;c.lineWidth=7;c.strokeRect(12,12,488,104);c.font='bold 64px "Songti SC", serif';c.textAlign='center';c.textBaseline='middle';c.fillStyle=color;c.fillText(text,256,67,440);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;const m=mesh(p,new THREE.PlaneGeometry(w,w/4),new THREE.MeshStandardMaterial({map:texture,roughness:1}),x,y,z);m.castShadow=false;return m;
}

export class World{
  constructor(canvas,labels,onPick){
    this.canvas=canvas;this.labels=labels;this.onPick=onPick;this.state=null;this.trains=new Map();this.smoke=[];this.windmills=[];this.time=0;this.follow=null;this.plan=null;this.dark=false;
    this.renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.65));this.renderer.setSize(innerWidth,innerHeight);this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFShadowMap;this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.08;
    this.scene=new THREE.Scene();this.scene.background=new THREE.Color(palette.sand);this.scene.fog=new THREE.Fog(palette.sand,120,225);
    this.camera=new THREE.OrthographicCamera(-1,1,1,-1,.1,350);this.camera.position.set(39,63,80);this.camera.zoom=innerWidth<760?.72:1.15;
    this.controls=new OrbitControls(this.camera,canvas);this.controls.target.set(-11,0,0);this.controls.enableDamping=true;this.controls.dampingFactor=.07;this.controls.minZoom=.55;this.controls.maxZoom=3.4;this.controls.minPolarAngle=.3;this.controls.maxPolarAngle=1.25;this.controls.mouseButtons={LEFT:THREE.MOUSE.PAN,MIDDLE:THREE.MOUSE.DOLLY,RIGHT:THREE.MOUSE.ROTATE};this.controls.touches={ONE:THREE.TOUCH.PAN,TWO:THREE.TOUCH.DOLLY_ROTATE};this.controls.screenSpacePanning=false;this.controls.panSpeed=.9;this.controls.addEventListener('start',()=>{this.follow=null;this.focusTarget=null;});
    this.hemi=new THREE.HemisphereLight(0xfff0d4,0xb89058,1.8);this.scene.add(this.hemi);this.sun=new THREE.DirectionalLight(0xffeac7,2.7);this.sun.position.set(-35,65,35);this.sun.castShadow=true;Object.assign(this.sun.shadow.camera,{left:-74,right:74,top:64,bottom:-64,near:1,far:160});this.sun.shadow.mapSize.set(2048,2048);this.sun.shadow.bias=-.00045;this.sun.shadow.normalBias=.07;this.scene.add(this.sun);
    this.terrain=new THREE.Group();this.scene.add(this.terrain);this.rails=new THREE.Group();this.scene.add(this.rails);this.preview=new THREE.Group();this.scene.add(this.preview);
    this.makeTerrain();bake(this.terrain);this.raycaster=new THREE.Raycaster();this.ground=new THREE.Plane(UP,0);this.pointer=new THREE.Vector2();this.resize();
    this.stationLabels=STATIONS.map(s=>{const el=document.createElement('button');el.className='station-label';el.innerHTML=`<i></i>${s.name}`;el.setAttribute('aria-label',`${s.name}车站`);el.onclick=()=>onPick({station:s,x:s.x,z:s.z});labels.append(el);return {s,el};});
    this.hover=mesh(this.scene,new THREE.PlaneGeometry(TILE*.95,TILE*.95),new THREE.MeshBasicMaterial({color:0x9bbd8b,transparent:true,opacity:.3,side:THREE.DoubleSide,depthWrite:false}),0,.085,0);this.hover.rotation.x=-Math.PI/2;this.hover.visible=false;
    let down=null;canvas.addEventListener('pointerdown',e=>{down={x:e.clientX,y:e.clientY,button:e.button};});canvas.addEventListener('pointermove',e=>{const p=this.groundPoint(e);if(p){this.hover.position.set(Math.round(p.x/TILE)*TILE,.085,Math.round(p.z/TILE)*TILE);}});canvas.addEventListener('pointerup',e=>{if(down&&down.button===0&&Math.hypot(e.clientX-down.x,e.clientY-down.y)<7){this.pick(e);}down=null;});canvas.addEventListener('contextmenu',e=>e.preventDefault());window.addEventListener('resize',()=>this.resize());
  }
  resize(){const aspect=innerWidth/innerHeight;const size=innerWidth<760?58:59;this.camera.left=-size*aspect/2;this.camera.right=size*aspect/2;this.camera.top=size/2;this.camera.bottom=-size/2;this.camera.updateProjectionMatrix();this.renderer.setSize(innerWidth,innerHeight);}
  groundPoint(e){const r=this.canvas.getBoundingClientRect();this.pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);this.raycaster.setFromCamera(this.pointer,this.camera);const p=new THREE.Vector3();return this.raycaster.ray.intersectPlane(this.ground,p);}
  pick(e){const p=this.groundPoint(e);if(!p)return;const x=Math.round(p.x/TILE),z=Math.round(p.z/TILE);if(!this.buildMode){for(const [id,v]of this.trains){const screen=v.engine.position.clone().project(this.camera);if(Math.hypot(e.clientX-(screen.x+1)*innerWidth/2,e.clientY-(1-screen.y)*innerHeight/2)<24){this.onPick({train:id});return;}}}const station=STATIONS.find(s=>Math.abs(s.x-x)<=2&&z<=s.z&&z>=s.z-3);this.onPick({x:station?station.x:x,z:station?station.z:z,station});}
  makeTerrain(){
    const p=this.terrain;box(p,290,.9,230,palette.sand,0,-.49,0);
    // Gentle dry riverbanks and one continuous turquoise river.
    const river=(width,y,color)=>{const pos=[];for(let i=-80;i<80;i++){const za=i,zb=i+1,xa=riverX(za/TILE)*TILE,xb=riverX(zb/TILE)*TILE;pos.push(xa-width,y,za,xb-width,y,zb,xa+width,y,za,xa+width,y,za,xb-width,y,zb,xb+width,y,zb);}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.computeVertexNormals();mesh(p,g,new THREE.MeshStandardMaterial({color,roughness:.8,side:THREE.DoubleSide}));};
    river(4.1,.002,0xd7b785);river(3.3,.006,0x79bcc0);river(2.65,.01,0x83c6c6);
    this.waterLines=new THREE.Group();this.scene.add(this.waterLines);for(let i=0;i<70;i++){const z=rand(-64,64),x=riverX(z/TILE)*TILE+rand(-2.5,2.5);const l=box(this.waterLines,rand(.25,1.1),.008,.04,0xb2d9d0,x,.025,z);l.castShadow=false;}
    // Broad patches of dust keep the world from feeling like a flat board.
    for(let i=0;i<75;i++){const x=rand(-76,76),z=rand(-58,58);if(Math.abs(x-riverX(z/TILE)*TILE)<6)continue;const patch=cyl(p,rand(2,5),3,.013,[0xdfb47b,0xe9c18a,0xe2b67d][i%3],x,.005,z,7);patch.rotation.y=rand(0,6.28);}
    for(const s of STATIONS)this.settlement(s);
    // Canyon walls, composed of leaning, sun-bleached layers.
    const formations=LANDMARKS;
    for(const [x,z,r,h]of formations)this.mesa(p,x,z,r,h);
    for(let i=0;i<750;i++){const x=rand(-62,61),z=rand(-43,43),gx=Math.round(x/TILE),gz=Math.round(z/TILE);if(Math.abs(x-gx*TILE)<.85||Math.abs(z-gz*TILE)<.85||Math.abs(x-riverX(z/TILE)*TILE)<5||STATIONS.some(s=>Math.abs(x-s.x*TILE)<10&&Math.abs(z-s.z*TILE)<12)||Math.abs(z-TILE)<2.1)continue;
      if(i%5===0)this.cactus(p,x,z,rand(.5,1.45));else if(i%3===0){const stone=ball(p,rand(.3,.9),[0xc6814b,0xc17c4e,0xd49761][i%3],x,.32,z);stone.scale.set(1,rand(.6,1.3),rand(.7,1.3));stone.rotation.y=random()*6.28;}else {const bush=ball(p,rand(.19,.42),i%2?0x899563:0xa4a06a,x,.17,z);bush.scale.y=.6;}}
    for(let i=0;i<35;i++){const x=rand(-43,-24),z=rand(-37,-21);if(STATIONS.some(s=>Math.abs(s.x*TILE-x)<6&&Math.abs(s.z*TILE-z)<7))continue;this.pine(p,x,z,rand(.65,1.1));}
    for(let i=0;i<11;i++)this.telegraph(p,-33+i*3.2,6.3);
    this.makeClouds();
  }
  mesa(p,x,z,r,h){
    const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=rand(0,6.28);p.add(g);
    cyl(g,r*.64,r,h*.45,0xa85538,0,h*.225,0,5);cyl(g,r*.51,r*.67,h*.46,0xb56743,r*.07,h*.57,0,5);cyl(g,r*.36,r*.51,h*.34,0xc77c4c,r*.04,h*.87,-r*.03,5);
    cyl(g,r*.53,r*.56,.18,0xd39157,r*.07,h*.77,0,5);for(let j=0;j<3;j++){const rock=ball(g,r*.28,0xbc7044,rand(-r,r),r*.15,rand(-r,r));rock.scale.y=.65;}
  }
  cactus(p,x,z,s=1){const g=new THREE.Group();g.position.set(x,.02,z);g.scale.setScalar(s);p.add(g);cyl(g,.17,.21,2.2,0x4e8a59,0,1.1,0,7);ball(g,.18,0x5b9761,0,2.18,0);beam(g,[-.02,.8,0],[-.58,.8,0],.25,0x50845a);cyl(g,.13,.14,.9,0x55935e,-.58,1.25,0,6);ball(g,.14,0x68a066,-.58,1.7,0);beam(g,[.02,1.25,0],[.5,1.25,0],.22,0x50845a);cyl(g,.11,.12,.65,0x6a9b63,.5,1.55,0,6);}
  pine(p,x,z,s){const g=new THREE.Group();g.position.set(x,0,z);g.scale.setScalar(s);p.add(g);cyl(g,.11,.18,1.1,0x7b6040,0,.55,0,6);cyl(g,0,1.25,2.1,0x658060,0,1.6,0,6);cyl(g,0,.96,1.9,0x749169,0,2.5,0,6);cyl(g,0,.66,1.6,0x819e6e,0,3.25,0,6);}
  settlement(s){const p=this.terrain,x=s.x*TILE,z=s.z*TILE;
    box(p,15,.025,10.5,0xdeae76,x,.015,z-3.8);
    // Station platform lies outside the rail gauge.
    box(p,8,.28,1.7,0xb69a70,x,.14,z-1.22);for(let i=-11;i<=11;i++)box(p,.04,.018,1.65,0xa58962,x+i*.34,.29,z-1.22);
    this.lamp(p,x-3.6,z-.8);this.lamp(p,x+3.6,z-.8);
    if(s.kind==='林场'){
      this.house(p,x,z-4.3,3.6,2.8,2.5,0xa98355,0x6d8668,'松林木场',true);
      for(let i=0;i<13;i++){const log=cyl(p,.24,.24,2.3,0x946746,x-5+(i%4)*.52,.25+Math.floor(i/4)*.41,z-3.7,8);log.rotation.x=Math.PI/2;}
      this.pine(p,x+5,z-5,1.5);this.pine(p,x-6,z-6,1.4);
    }else if(s.kind==='矿场'){
      this.mesa(p,x+2,z-7,4.5,6);box(p,2.5,2.7,.7,0x635346,x+1,1.35,z-3.75);box(p,1.7,1.9,.1,0x403c32,x+1,1,z-3.3);beam(p,[x-.2,.1,z-3.1],[x-.2,2.3,z-3.1],.2,0x8e6743);beam(p,[x+2.2,.1,z-3.1],[x+2.2,2.3,z-3.1],.2,0x8e6743);box(p,2.7,.3,.25,0x9d7951,x+1,2.4,z-3.1);this.house(p,x-4,z-4,2.4,2.4,1.8,0xac8c64,0x956a4d,'铜溪矿业');for(let i=0;i<7;i++)ball(p,.42,0x8c7960,x-2+rand(-1,1),.3,z-2+rand(-.6,.6));
    }else if(s.kind==='农场'){
      this.house(p,x,z-4.4,3.9,3,3,0xb0664b,0x986c47,'金穗牧场',true);
      const field=box(p,7,.045,5,0xb99553,x+8,.027,z-4);for(let i=0;i<10;i++)for(let j=0;j<8;j++){cyl(p,.025,.035,.47,0xdcb654,x+5+i*.65,.25,z-6+j*.53,4);cyl(p,.09,.06,.2,0xe5c976,x+5+i*.65,.5,z-6+j*.53,5);}this.fence(p,x-6,z-3,4);this.windmill(p,x-5,z-6);this.hay(p,x+3,z-3);
    }else{
      const colors=[0xa6ac77,0xb78e63,0x688eaa,0xbb7f5b,0x86a180];const names=s.id==='canyon'?['杂货铺','西部酒馆','红岩驿站','邮局','旅人客栈']:s.id==='pine'?['松谷商店','木匠铺','松谷车站','邮政局','小酒馆']:['银泉商行','银行','银泉车站','面包房','旅店'];
      for(let i=0;i<5;i++){this.house(p,x+(i-2)*3.05,z-5,2.55,2.45,rand(2.1,2.9),colors[i],i%2?0x846a50:0x50778c,names[i]);}
      if(s.id==='canyon'||s.id==='pine'){this.house(p,x-3.8,z+7,2.7,3,2.6,0xc3b194,0x907459,'货运仓库',true,Math.PI);this.house(p,x+2,z+7.2,2.4,2.8,3.1,0xc5aa7c,0x957048,'旅人之家',true,Math.PI);}
      this.waterTower(p,x+8,z-4);this.windmill(p,x-8,z+6);this.wagon(p,x+.5,z+4.2);this.fence(p,x-7,z+8.6,4);
      for(let i=0;i<3;i++)this.person(p,x-4+i*3.5,z-2.35,i);
    }
    // Station canopy and freight crates.
    box(p,3.4,.15,1.8,0x507b93,x,2.6,z-1.5);for(const dx of [-1.4,1.4])box(p,.13,2.5,.13,0x8d6946,x+dx,1.35,z-1.5);sign(p,s.name,2.6,x,2.18,z-.56,'#efdbaf','#6e6549');
    for(let i=0;i<3;i++)this.crate(p,x+3.9+i*.56,z-1.8,i===1?.55:.4);
    this.barrel(p,x-4.3,z-1.2);this.barrel(p,x-4.8,z-1.4);
  }
  house(p,x,z,w,d,h,color,roofColor,title,gabled=false,rotation=0){
    const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=rotation;p.add(g);box(g,w+.12,.28,d+.16,0x9c7956,0,.14);box(g,w,h,d,color,0,h/2+.25);
    // Plank grooves, square sash windows, shaded porch and false front.
    for(let y=.65;y<h+.1;y+=.4)box(g,w,.025,.018,0x967b53,0,y,d/2+.01);
    box(g,.5,1.25,.07,0x685740,0,.9,d/2+.05);box(g,.035,.3,.035,0xcfb575,.17,.85,d/2+.1);
    for(const xx of [-w*.33,w*.33]){box(g,.57,.78,.08,0xe8d8ac,xx,1.47,d/2+.035);box(g,.44,.64,.095,0x5c7476,xx,1.47,d/2+.055);box(g,.055,.7,.1,0xd8c595,xx,1.47,d/2+.115);box(g,.51,.05,.1,0xd8c595,xx,1.47,d/2+.115);}
    box(g,w+.5,.18,1.15,0x956d46,0,.28,d/2+.55);for(let k=0;k<8;k++)box(g,.024,.014,1.1,0xb09567,-w/2+k*w/7,.38,d/2+.55);
    for(const xx of [-w/2,w/2])box(g,.11,1.7,.11,0x795c3f,xx,1.12,d/2+1);
    const awning=box(g,w+.35,.12,1.32,roofColor,0,2.12,d/2+.5);awning.rotation.x=.12;
    if(gabled){const roof=cyl(g,w*.73,w*.73,d+.36,roofColor,0,h+.45,0,3);roof.rotation.set(Math.PI/2,Math.PI,0);roof.scale.z=.7;}else{box(g,w+.28,.19,d+.27,roofColor,0,h+.3,0);box(g,w+.1,.7,.18,color,0,h+.53,d/2+.03);box(g,w+.35,.13,.3,roofColor,0,h+.9,d/2+.03);}
    box(g,.28,.75,.34,0x9e6549,-w*.28,h+.58,-d*.18);sign(g,title,w*.85,0,gabled?h+.1:h+.53,d/2+.135);
  }
  crate(p,x,z,s){const y=s/2+.02;box(p,s,s,s,0xbd985e,x,y,z);box(p,s+.02,.05,s+.03,0x8e7048,x,y+s*.25,z);box(p,s+.02,.05,s+.03,0x8e7048,x,y-s*.25,z);}
  barrel(p,x,z){cyl(p,.26,.24,.61,0xa88754,x,.34,z,10);cyl(p,.27,.27,.05,0x695f49,x,.18,z,10);cyl(p,.27,.27,.05,0x695f49,x,.48,z,10);}
  hay(p,x,z){for(let i=0;i<4;i++){box(p,.9,.6,.7,0xdabb69,x+i%2*.92,.3+Math.floor(i/2)*.61,z);box(p,.1,.62,.71,0x9e8b55,x+i%2*.92,.3+Math.floor(i/2)*.61,z);}}
  lamp(p,x,z){cyl(p,.055,.08,2.5,0x655841,x,1.25,z,6);box(p,.32,.4,.32,0xf3dd91,x,2.6,z);cyl(p,0,.29,.25,0x6d5b42,x,2.92,z,4);box(p,.4,.08,.4,0x6d5b42,x,2.39,z);}
  waterTower(p,x,z){for(const dx of [-.7,.7])for(const dz of [-.7,.7])beam(p,[x+dx,0,z+dz],[x+dx*.8,3.4,z+dz*.8],.13,0x785b3c);beam(p,[x-.7,.5,z+.7],[x+.6,3,z+.6],.11,0x8d6a45);beam(p,[x+.7,.5,z+.7],[x-.6,3,z+.6],.11,0x8d6a45);cyl(p,1.04,1.04,1.6,0xa48052,x,3.75,z,12);cyl(p,1.065,1.065,.09,0x70634b,x,3.2,z,12);cyl(p,1.065,1.065,.09,0x70634b,x,4.3,z,12);cyl(p,.05,1.2,.5,0x557898,x,4.8,z,12);}
  windmill(p,x,z){for(const dx of [-.5,.5])for(const dz of [-.4,.4])beam(p,[x+dx,0,z+dz],[x,4,z],.12,0x9d7750);beam(p,[x-.4,1,z+.3],[x+.2,2.8,z+.1],.1,0x9d7750);const g=new THREE.Group();g.position.set(x,4.2,z+.2);this.scene.add(g);for(let i=0;i<8;i++){const b=box(g,.34,1.1,.05,0xd3c4a0);b.position.set(Math.sin(i*Math.PI/4)*.6,Math.cos(i*Math.PI/4)*.6,0);b.rotation.z=-i*Math.PI/4+.3;}cyl(g,.15,.15,.2,0x8e7551,0,0,0).rotation.x=Math.PI/2;this.windmills.push(g);}
  fence(p,x,z,length){for(let i=0;i<=length;i++){box(p,.12,.9,.12,0xa38558,x+i*1.2,.45,z);if(i<length){box(p,1.2,.1,.1,0xbb9c6e,x+i*1.2+.6,.7,z);box(p,1.2,.1,.1,0xbb9c6e,x+i*1.2+.6,.36,z);}}}
  wagon(p,x,z){box(p,1.7,.2,.9,0x926942,x,.67,z);for(const dz of [-.43,.43])box(p,1.7,.4,.08,0xab7d4e,x,.92,z+dz);for(const dx of [-.6,.6])for(const dz of [-.55,.55]){const w=cyl(p,.36,.36,.09,0x674e35,x+dx,.43,z+dz,12);w.rotation.x=Math.PI/2;cyl(p,.1,.1,.11,0xab895a,x+dx,.43,z+dz,8).rotation.x=Math.PI/2;}beam(p,[x+.8,.6,z],[x+2.5,.3,z],.1,0x956d44);}
  person(p,x,z,i){cyl(p,.13,.18,.45,[0x588090,0x9d6c4e,0x8d8860][i%3],x,.43,z,6);ball(p,.13,0xd5af7f,x,.81,z);cyl(p,.23,.23,.07,0x6e5c42,x,.91,z,8);cyl(p,.13,.14,.13,0x846845,x,1.01,z,7);for(const dx of [-.075,.075])box(p,.09,.25,.11,0x605b4c,x+dx,.13,z);}
  telegraph(p,x,z){cyl(p,.065,.1,3.1,0x82603e,x,1.55,z,6);box(p,.9,.09,.1,0x806342,x,2.8,z);for(const dx of [-.35,.35])cyl(p,.055,.055,.17,0xbcc1a2,x+dx,2.93,z,6);}
  makeClouds(){this.clouds=new THREE.Group();this.scene.add(this.clouds);const shadowMat=new THREE.MeshBasicMaterial({color:0xc5a177,transparent:true,opacity:.075,depthWrite:false});for(let i=0;i<7;i++){const s=mesh(this.clouds,new THREE.CircleGeometry(rand(4,8),9),shadowMat,rand(-65,65),.02,rand(-50,50));s.rotation.x=-Math.PI/2;s.scale.y=.6;s.castShadow=false;}}
  syncRails(state){this.state=state;disposeGroup(this.rails);for(const [k,type]of Object.entries(state.tracks)){const [x,z]=coords(k);this.trackTile(this.rails,state,x,z,type,false);}bake(this.rails);this.stationLabels.forEach(({s,el})=>el.classList.toggle('connected',!!railPath(state,STATIONS[0],s)));}
  trackTile(group,state,x,z,type,preview){
    const worldX=x*TILE,worldZ=z*TILE,ns=[[1,0],[-1,0],[0,1],[0,-1]].filter(([dx,dz])=>state.tracks[key(x+dx,z+dz)]);if(!ns.length)ns.push([1,0],[-1,0]);if(ns.length===1)ns.push([-ns[0][0],-ns[0][1]]);
    const color=preview?0x8faf78:0x8d7860,railColor=preview?0xaec798:0x8f9791;
    if(type==='bridge'&&!preview){box(group,TILE+.1,.22,TILE*.7,0x92734e,worldX,.11,worldZ);for(const dx of [-1.25,1.25])for(const dz of [-.85,.85])box(group,.12,.96,.12,0x805f40,worldX+dx,.48,worldZ+dz);for(const dz of [-.85,.85]){box(group,TILE,.1,.1,0xb39666,worldX,.87,worldZ+dz);beam(group,[worldX-1.25,.2,worldZ+dz],[worldX+1.25,.83,worldZ+dz],.08,0xa3885e);beam(group,[worldX+1.25,.2,worldZ+dz],[worldX-1.25,.83,worldZ+dz],.08,0xa3885e);}}
    const y=type==='bridge'?.3:.09;
    const addPiece=(points)=>{for(let i=0;i<points.length-1;i++){const a=points[i],b=points[i+1],dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz),nx=-dz/len,nz=dx/len;for(const side of [-1,1]){const m=box(group,.064,.085,len+.025,railColor,worldX+(a.x+b.x)/2+nx*.35*side,y+.11,worldZ+(a.z+b.z)/2+nz*.35*side);m.rotation.y=Math.atan2(dx,dz);}}
      for(let i=0;i<points.length-1;i+=Math.max(1,Math.floor(points.length/7))){const a=points[i],b=points[i+1],tie=box(group,.98,.09,.19,color,worldX+a.x,y+.025,worldZ+a.z);tie.rotation.y=Math.atan2(b.x-a.x,b.z-a.z);}
    };
    if(ns.length===2&&ns[0][0]*ns[1][0]+ns[0][1]*ns[1][1]===0){const a=new THREE.Vector3(ns[0][0]*TILE/2,0,ns[0][1]*TILE/2),b=new THREE.Vector3(ns[1][0]*TILE/2,0,ns[1][1]*TILE/2);const curve=new THREE.QuadraticBezierCurve3(a,new THREE.Vector3(0,0,0),b);addPiece(curve.getPoints(16));}
    else{for(const d of ns){const pts=[];for(let i=0;i<=4;i++)pts.push(new THREE.Vector3(d[0]*TILE*i/8,0,d[1]*TILE*i/8));addPiece(pts);}}
    if(!preview&&type!=='bridge'){const bed=box(group,ns.some(n=>n[0])?TILE:1.35,.035,ns.some(n=>n[1])?TILE:1.35,0xc7ae87,worldX,.035,worldZ);bed.receiveShadow=true;}
  }
  showPlan(plan,state){this.plan=plan;disposeGroup(this.preview);if(!plan?.path)return;const temp={tracks:{...state.tracks}};for(const [x,z]of plan.path)temp.tracks[key(x,z)]=isRiver(x,z)?'bridge':'rail';for(const [x,z]of plan.fresh)this.trackTile(this.preview,temp,x,z,temp.tracks[key(x,z)],true);bake(this.preview);}
  setBuildMode(mode){this.buildMode=mode!=='inspect';this.hover.visible=this.buildMode;this.canvas.style.cursor=mode==='remove'?'not-allowed':this.buildMode?'crosshair':'grab';}
  makeTrain(t){
    const engine=new THREE.Group();this.scene.add(engine);const wheels=[];const blue=t.id%3===0?0x7b8b61:t.id%2===0?0x9c5943:0x457696;
    box(engine,2.35,.22,.92,0x5e5140,0,.4,0);box(engine,.98,1.15,1.03,blue,-.7,1.03,0);box(engine,1.23,.16,1.27,0x344e5f,-.73,1.7,0);
    for(const side of [-1,1]){box(engine,.57,.57,.03,0xe3c89d,-.7,1.24,side*.53);box(engine,.44,.44,.035,0x344c4e,-.7,1.24,side*.553);box(engine,.05,.47,.04,0xb4aa8d,-.7,1.24,side*.574);}
    const boiler=cyl(engine,.4,.4,1.45,blue,.42,.94,0,12);boiler.rotation.z=Math.PI/2;for(const x of [0,.68])cyl(engine,.419,.419,.085,0xc2a364,x,.94,0,12).rotation.z=Math.PI/2;
    cyl(engine,.14,.11,.56,0x394345,.98,1.51,0,8);cyl(engine,.21,.15,.21,0x475052,.98,1.86,0,8);cyl(engine,.16,.16,.25,0xcfab60,.15,1.44,0,8);
    box(engine,.16,.36,.45,0x514d42,1.21,.97,0);cyl(engine,.17,.17,.14,0xe7cc85,1.33,1.13,0,12).rotation.z=Math.PI/2;
    for(let i=0;i<5;i++){const slat=box(engine,.07,.12,.6,0x9b784a,1.43+i*.1,.38-i*.035,0);slat.rotation.y=.1;}box(engine,.22,.13,1.15,0xbba16c,1.3,.46,0);
    for(const x of [-.83,-.15,.6])for(const side of [-1,1]){const wheel=new THREE.Group();wheel.position.set(x,.35,side*.53);engine.add(wheel);cyl(wheel,.31,.31,.1,0x394c51,0,0,0,16).rotation.x=Math.PI/2;cyl(wheel,.21,.21,.12,blue,0,0,0,12).rotation.x=Math.PI/2;for(let i=0;i<5;i++){const spoke=box(wheel,.035,.43,.14,0xc4ad78,0,0,0);spoke.rotation.z=i*Math.PI/5;}cyl(wheel,.07,.07,.16,0xc9b17a,0,0,0,10).rotation.x=Math.PI/2;wheels.push(wheel);}
    const rods=[];for(const side of [-1,1])rods.push(box(engine,1.64,.075,.075,0xc8b58d,-.13,.3,side*.65));
    const wagons=[];for(let i=0;i<3;i++){const g=new THREE.Group();this.scene.add(g);box(g,1.8,.18,1.0,0x5d5141,0,.44,0);box(g,1.72,.48,1.02,i===0?0x485862:0x99744b,0,.75,0);box(g,1.42,.07,.77,0x484a3b,0,1,0);for(const x of [-.58,.58])for(const side of [-1,1]){const wheel=cyl(g,.24,.24,.09,0x4d5149,x,.3,side*.53,10);wheel.rotation.x=Math.PI/2;}for(const side of [-1,1])for(const x of [-.7,0,.7])box(g,.065,.54,.07,0xb99562,x,.76,side*.53);if(i===0){for(let j=0;j<10;j++)ball(g,.21,0x444c46,rand(-.6,.6),1.07,rand(-.29,.29));}wagons.push(g);}
    const v={engine,wagons,wheels,rods,cargoGood:null,smokeTime:0};this.trains.set(t.id,v);return v;
  }
  cargo(v,t){if(v.cargoGood===`${t.good}:${t.cargo}:${t.level}`)return;v.cargoGood=`${t.good}:${t.cargo}:${t.level}`;for(let i=1;i<v.wagons.length;i++){const w=v.wagons[i];const old=w.getObjectByName('cargo');if(old){disposeGroup(old);w.remove(old);}const g=new THREE.Group();g.name='cargo';w.add(g);if(t.cargo<=0)continue;for(let j=0;j<6;j++){const x=(j%3-1)*.43,z=(Math.floor(j/3)-.5)*.42;if(t.good==='wood'){const log=cyl(g,.14,.14,1.45,0xb99159,0,1.09+Math.floor(j/3)*.23,(j%3-1)*.27,7);log.rotation.z=Math.PI/2;}else if(t.good==='ore'){ball(g,.28,0xa77b57,x,1.13,z);}else{box(g,.39,.32,.36,GOODS[t.good].color,x,1.16,z);box(g,.055,.34,.38,0xa89166,x,1.16,z);}}}}
  pathCurve(path){
    const points=path.map(([x,z])=>new THREE.Vector3(x*TILE,(isRiver(x,z)?.3:.09),z*TILE));const smooth=[];
    for(let i=0;i<points.length;i++){if(i===0||i===points.length-1){smooth.push(points[i]);continue;}const a=points[i-1],b=points[i],c=points[i+1];if(Math.abs((b.x-a.x)*(c.z-b.z)-(b.z-a.z)*(c.x-b.x))>.01){const start=a.clone().lerp(b,.5),end=b.clone().lerp(c,.5);const q=new THREE.QuadraticBezierCurve3(start,b,end);smooth.push(...q.getPoints(8));}else smooth.push(b);}
    // Arc-length interpolation keeps wheels on the rails through every curve.
    const distances=[0];for(let i=1;i<smooth.length;i++)distances.push(distances[i-1]+smooth[i].distanceTo(smooth[i-1]));const total=distances.at(-1);
    return {length:total,point:(d)=>{let index=1;if(d<0){const dir=smooth[1].clone().sub(smooth[0]).normalize();return smooth[0].clone().addScaledVector(dir,d);}if(d>total){const dir=smooth.at(-1).clone().sub(smooth.at(-2)).normalize();return smooth.at(-1).clone().addScaledVector(dir,d-total);}while(index<distances.length-1&&distances[index]<d)index++;return smooth[index-1].clone().lerp(smooth[index],(d-distances[index-1])/(distances[index]-distances[index-1]||1));}};
  }
  focusStation(s){this.follow=null;this.focusTarget=new THREE.Vector3(s.x*TILE,0,s.z*TILE);this.targetZoom=1.7;}
  recenter(){this.follow=null;this.focusTarget=new THREE.Vector3(0,0,-2);this.targetZoom=innerWidth<760?.7:.82;}
  zoom(factor){this.camera.zoom=THREE.MathUtils.clamp(this.camera.zoom*factor,.55,3.4);this.camera.updateProjectionMatrix();}
  setNight(){this.dark=!this.dark;this.sun.color.set(this.dark?0xffbb77:0xffeac7);this.sun.intensity=this.dark?1.8:2.7;this.hemi.intensity=this.dark?1.25:1.8;this.scene.background.set(this.dark?0xc6a487:palette.sand);this.scene.fog.color.copy(this.scene.background);this.renderer.toneMappingExposure=this.dark?.95:1.08;return this.dark;}
  update(state,dt,simDt){this.time+=dt;
    for(const w of this.windmills)w.rotation.z+=dt*.3;this.waterLines.position.z=Math.sin(this.time*.2)*.6;this.clouds.position.x=Math.sin(this.time*.009)*18;
    const ids=new Set(state.trains.map(t=>t.id));for(const [id,v]of this.trains)if(!ids.has(id)){for(const g of [v.engine,...v.wagons]){disposeGroup(g);this.scene.remove(g);}this.trains.delete(id);}
    for(const t of state.trains){const v=this.trains.get(t.id)||this.makeTrain(t),path=railPath(state,STATIONS.find(s=>s.id===t.from),STATIONS.find(s=>s.id===t.to));if(!path)continue;
      const signature=path.map(p=>p.join(',')).join(';');if(v.pathSignature!==signature){v.pathSignature=signature;v.curve=this.pathCurve(path);}const curve=v.curve;const distance=(t.direction===1?t.progress:1-t.progress)*curve.length;const velocity=t.direction;
      const place=(g,offset)=>{const d=distance-offset*velocity,p=curve.point(d),p2=curve.point(d+.05*velocity);g.position.copy(p);g.rotation.y=-Math.atan2(p2.z-p.z,p2.x-p.x);};place(v.engine,0);v.wagons.forEach((w,i)=>{place(w,2.5+i*2.05);w.visible=i<1+t.level;});
      if(t.dwell<=0&&t.condition>0){v.wheels.forEach(w=>w.rotation.z-=simDt*6.4);v.rods.forEach(r=>r.position.y=.31+Math.sin(this.time*7)*.07);v.smokeTime+=simDt;if(v.smokeTime>.16){v.smokeTime=0;const p=v.engine.localToWorld(new THREE.Vector3(.97,2.1,0));const m=mesh(this.scene,new THREE.IcosahedronGeometry(.18,0),new THREE.MeshBasicMaterial({color:0xfff4dd,transparent:true,opacity:.62,depthWrite:false}),p.x,p.y,p.z);m.castShadow=false;this.smoke.push({m,age:0});}}
      this.cargo(v,t);if(this.follow===t.id){const delta=v.engine.position.clone().sub(this.controls.target).multiplyScalar(Math.min(1,dt*3));delta.y=0;this.controls.target.add(delta);this.camera.position.add(delta);}
    }
    for(let i=this.smoke.length-1;i>=0;i--){const s=this.smoke[i];s.age+=dt;s.m.position.y+=dt*.72;s.m.position.x-=dt*.4;s.m.scale.setScalar(1+s.age*1.15);s.m.material.opacity=Math.max(0,.6-s.age*.18);if(s.age>3.3){s.m.geometry.dispose();s.m.material.dispose();this.scene.remove(s.m);this.smoke.splice(i,1);}}
    if(this.focusTarget){const delta=this.focusTarget.clone().sub(this.controls.target).multiplyScalar(Math.min(1,dt*4));this.controls.target.add(delta);this.camera.position.add(delta);this.camera.zoom=THREE.MathUtils.lerp(this.camera.zoom,this.targetZoom??this.camera.zoom,Math.min(1,dt*4));this.camera.updateProjectionMatrix();if(delta.length()<.004){this.focusTarget=null;this.targetZoom=null;}}
    this.controls.update();this.controls.target.x=THREE.MathUtils.clamp(this.controls.target.x,-65,65);this.controls.target.z=THREE.MathUtils.clamp(this.controls.target.z,-50,50);
    for(const {s,el}of this.stationLabels){const p=new THREE.Vector3(s.x*TILE,3.7,s.z*TILE-5).project(this.camera);el.style.left=`${(p.x+1)*innerWidth/2}px`;el.style.top=`${(1-p.y)*innerHeight/2}px`;el.style.visibility=p.z>1||Math.abs(p.x)>1.1||Math.abs(p.y)>1.1?'hidden':'visible';}
    this.renderer.render(this.scene,this.camera);
  }
  minimap(canvas,state){const c=canvas.getContext('2d'),w=canvas.width,h=canvas.height,scale=w/42,px=x=>w/2+x*scale,pz=z=>h/2+z*scale;
    c.fillStyle='#e4c79c';c.fillRect(0,0,w,h);c.strokeStyle='#9abebc';c.lineWidth=10;c.beginPath();for(let z=-20;z<=20;z+=.25){const x=riverX(z);if(z===-20)c.moveTo(px(x),pz(z));else c.lineTo(px(x),pz(z));}c.stroke();
    c.fillStyle='#c99e74';for(let i=0;i<12;i++){const x=Math.sin(i*52.72)*17,z=Math.cos(i*22.28)*11;c.beginPath();c.arc(px(x),pz(z),3.3,0,6.28);c.fill();}
    c.strokeStyle='#a28b65';c.lineWidth=1.5;for(const k of Object.keys(state.tracks)){const [x,z]=coords(k);for(const [dx,dz]of [[1,0],[0,1]])if(state.tracks[key(x+dx,z+dz)]){c.beginPath();c.moveTo(px(x),pz(z));c.lineTo(px(x+dx),pz(z+dz));c.stroke();}}
    for(const s of STATIONS){c.fillStyle=railPath(state,STATIONS[0],s)?'#617e6a':'#b79c75';c.beginPath();c.arc(px(s.x),pz(s.z),3.3,0,6.28);c.fill();c.strokeStyle='#fff0cb';c.lineWidth=1.5;c.stroke();}
    for(const v of this.trains.values()){c.fillStyle='#467f9d';c.fillRect(px(v.engine.position.x/TILE)-2,pz(v.engine.position.z/TILE)-2,4,4);}
    c.strokeStyle='#fff8e2';c.lineWidth=1;c.strokeRect(px(this.controls.target.x/TILE)-15,pz(this.controls.target.z/TILE)-10,30,20);
  }
  mapFocus(x,z){this.follow=null;this.focusTarget=new THREE.Vector3(x*TILE,0,z*TILE);this.targetZoom=this.camera.zoom;}
}
