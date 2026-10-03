import * as THREE from 'three';
import {OrbitControls} from '../vendor/OrbitControls.js';
import {RoomEnvironment} from '../vendor/RoomEnvironment.js';
import {mergeGeometries} from '../vendor/BufferGeometryUtils.js';
import {terrainHeight,PEARLS,LOCATIONS,ISLETS} from './game-state.js';

const TAU=Math.PI*2;
let seed=1703;
const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
const range=(a,b)=>a+(b-a)*random();
const materialCache=new Map();
const mat=(color,roughness=.8,extra={})=>{if(Object.keys(extra).length)return new THREE.MeshStandardMaterial({color,roughness,...extra});const key=color+'/'+roughness;if(!materialCache.has(key))materialCache.set(key,new THREE.MeshStandardMaterial({color,roughness}));return materialCache.get(key);};
const palettes={sand:mat('#e9d6a2'),wood:mat('#76614a'),darkWood:mat('#493b2d'),trim:mat('#f3e8ca'),green:mat('#547b31'),metal:mat('#d3d2bd',.35),gold:mat('#d4a954',.3),rock:mat('#817963'),coral:mat('#ca8980'),blue:mat('#398f9e')};

function texture(kind){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=256;const c=canvas.getContext('2d');
 const base=kind==='wood'?'#a3855b':kind==='roof'?'#47636b':'#887153';c.fillStyle=base;c.fillRect(0,0,256,256);
 for(let i=0;i<5000;i++){c.fillStyle=`rgba(${random()>.5?'255,244,198':'20,30,24'},${range(.02,.1)})`;c.fillRect(random()*256,random()*256,range(1,9),range(1,3));}
 if(kind==='wood'){for(let y=0;y<256;y+=32){c.fillStyle='#433a3355';c.fillRect(0,y,256,2);for(let i=0;i<8;i++){c.strokeStyle='#e4d1a724';c.beginPath();c.moveTo(random()*30,y+random()*25);c.bezierCurveTo(60,y+20,180,y+15,256,y+random()*25);c.stroke();}}}
 if(kind==='roof'){for(let y=0;y<256;y+=26)for(let x=0;x<256;x+=38){c.fillStyle=random()>.5?'#6d979522':'#1c3e4c33';c.fillRect(x+(y%52?19:0),y,36,24);}}
 const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;return t;
}
const woodTexture=texture('wood'),roofTexture=texture('roof'),earthTexture=texture('earth');
palettes.wood.map=woodTexture;
const roofMat=mat('#67858d',.85,{map:roofTexture});

function mesh(g,m,parent,pos=[0,0,0],shadow=true){const o=new THREE.Mesh(g,m);o.position.set(...pos);o.castShadow=shadow;o.receiveShadow=shadow;parent.add(o);return o;}
function box(parent,w,h,d,m,x=0,y=0,z=0){return mesh(new THREE.BoxGeometry(w,h,d),m,parent,[x,y,z]);}
function sphere(parent,r,m,x,y,z,sx=1,sy=1,sz=1){const o=mesh(new THREE.SphereGeometry(r,12,9),m,parent,[x,y,z]);o.scale.set(sx,sy,sz);return o;}
function rod(parent,a,b,r,m=palettes.wood){const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),v=bv.clone().sub(av);const o=mesh(new THREE.CylinderGeometry(r,r,v.length(),6),m,parent);o.position.copy(av.add(bv).multiplyScalar(.5));o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),v.normalize());return o;}
function tube(parent,points,r,m,segments=40){const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));return mesh(new THREE.TubeGeometry(curve,segments,r,5,false),m,parent);}
function makeGlowTexture(){const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d'),g=x.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.25,'rgba(255,255,255,.8)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,64,64);return new THREE.CanvasTexture(c);}
const glowTexture=makeGlowTexture();

const noiseGLSL=`
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.)),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<4;i++){v+=a*noise(p);p=p*2.03+17.1;a*=.5;}return v;}
`;
function createWater(){
 return new THREE.ShaderMaterial({uniforms:{time:{value:0},night:{value:0}},vertexShader:`uniform float time;varying vec3 wp;varying vec3 norm;void main(){vec3 p=position;float a=p.x*.85+time*.7,b=p.z*1.35-time*.9; p.y+=.038*sin(a)*cos(b)+.018*sin(p.x*2.8+p.z*2.2-time*1.4);norm=normalize(vec3(-.05*cos(a)*cos(b),1.,.06*sin(a)*sin(b)));wp=(modelMatrix*vec4(p,1.)).xyz;gl_Position=projectionMatrix*viewMatrix*vec4(wp,1.);}`,fragmentShader:`uniform float time;uniform float night;varying vec3 wp;varying vec3 norm;${noiseGLSL}
void main(){vec2 p=wp.xz;vec2 q=p*2.8+vec2(time*.18,-time*.11);float n=fbm(q);float wave=sin(q.x*3.+n*5.)*sin(q.y*3.+n*6.);float caustic=pow(1.-abs(wave),24.);float cloud=fbm(p*.5+time*.012);vec3 nrm=normalize(norm+vec3((noise(q+1.)-.5)*.2,0.,(noise(q+3.)-.5)*.2));vec3 v=normalize(cameraPosition-wp);float fres=pow(1.-max(0.,dot(v,nrm)),3.);float spec=pow(max(0.,dot(reflect(-normalize(vec3(-.7,1.,.3)),nrm),v)),95.);vec3 col=mix(vec3(.001,.15,.26),vec3(.008,.38,.43),n);col+=caustic*vec3(.07,.12,.10);col=mix(col,vec3(.77,.92,.95),fres*.22+cloud*.065);col+=spec*.65;col=mix(col,col*vec3(.18,.35,.52)+caustic*.04,night*.76);gl_FragColor=vec4(col,1.);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>}`});
}

function terrain(parent){
 const seg=130,size=15,g=new THREE.PlaneGeometry(size,size,seg,seg);g.rotateX(-Math.PI/2);const p=g.attributes.position,colors=[];
 const sand=new THREE.Color('#e8d39b'),grass=new THREE.Color('#668c3c'),rock=new THREE.Color('#817761');
 for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),y=terrainHeight(x,z);p.setY(i,y);let c=sand.clone();if(y>.54){c.lerp(grass,Math.min(1,(y-.54)*4));if(y>1.6)c.lerp(rock,.2+noiseSample(x,z)*.2);}c.multiplyScalar(.9+noiseSample(x*5,z*5)*.18);colors.push(c.r,c.g,c.b);}
 g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.computeVertexNormals();mesh(g,mat('#ffffff',1,{vertexColors:true}),parent);
}
function noiseSample(x,z){return .5+.25*Math.sin(x*8+z*3)+.25*Math.sin(x*3-z*9);}

function palm(parent,x,z,h=3.4,angle=0){
 const y=Math.max(.18,terrainHeight(x,z)),group=new THREE.Group();group.position.set(x,y,z);group.rotation.y=angle;parent.add(group);
 const bend=range(.2,.55),trunkMat=mat('#92774c',1);const points=[];for(let i=0;i<=7;i++)points.push([Math.sin(i/7)*bend,i*h/7,0]);tube(group,points,.095,trunkMat,15);
 for(let i=1;i<11;i++){const ring=mesh(new THREE.TorusGeometry(.099,.017,3,8),palettes.darkWood,group,[Math.sin(i/11)*bend,i*h/11,0]);ring.rotation.x=Math.PI/2;}
 const leaves=[mat('#2c703e',.8,{side:THREE.DoubleSide}),mat('#498b3d',.8,{side:THREE.DoubleSide}),mat('#699b3e',.8,{side:THREE.DoubleSide})];
 for(let k=0;k<9;k++){
  const a=k*TAU/9+range(-.15,.15),len=range(1.55,2.25),pos=[],uv=[],indices=[];
  for(let i=0;i<=18;i++){const t=i/18,curve=Math.sin(t*Math.PI)*.28-t*t*.9,width=Math.sin(t*Math.PI)*.19*(i%2?.68:1);for(let side of [-1,1]){pos.push(Math.cos(a)*len*t+Math.sin(a)*width*side+bend*.84,h+curve,Math.sin(a)*len*t-Math.cos(a)*width*side);uv.push(t,(side+1)/2);}}
  for(let i=0;i<18;i++){const a=i*2;indices.push(a,a+1,a+2,a+1,a+3,a+2);}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();mesh(g,leaves[k%3],group);
  tube(group,[[bend*.84,h,0],[Math.cos(a)*len*.5+bend*.84,h+.05,Math.sin(a)*len*.5],[Math.cos(a)*len+bend*.84,h-.9,Math.sin(a)*len]],.012,leaves[0],8);
 }
 for(let i=0;i<3;i++)sphere(group,.13,palettes.darkWood,bend*.84+Math.cos(i*2)*.14,h-.1,Math.sin(i*2)*.14);
 return group;
}

const foliageMat=mat('#ffffff',.85,{vertexColors:true,side:THREE.DoubleSide});
function broadTree(parent,x,z,h=2.4){
 const y=terrainHeight(x,z),g=new THREE.Group();g.position.set(x,y,z);parent.add(g);rod(g,[0,0,0],[.12,h,0],.1,palettes.darkWood);
 const positions=[],colors=[],greens=['#28593a','#477542','#6a914a'];
 for(let i=0;i<12;i++){const a=random()*TAU,r=range(.15,.85),p=[Math.cos(a)*r,range(h-.65,h+.35),Math.sin(a)*r];if(i<6)rod(g,[.06,h*.55,0],p,.035,palettes.wood);
  for(let j=0;j<29;j++){const center=new THREE.Vector3(p[0]+range(-.45,.45),p[1]+range(-.3,.3),p[2]+range(-.45,.45)),length=range(.11,.23),width=length*.4,az=random()*TAU,tilt=range(-.8,.8),axis=new THREE.Vector3(Math.cos(az),tilt,Math.sin(az)).normalize().multiplyScalar(length),side=new THREE.Vector3(-Math.sin(az),.1,Math.cos(az)).multiplyScalar(width),tip=center.clone().add(axis),base=center.clone().sub(axis),left=center.clone().add(side),right=center.clone().sub(side);const color=new THREE.Color(greens[i%3]).multiplyScalar(range(.85,1.2));for(const v of [base,left,tip,base,tip,right]){positions.push(v.x,v.y,v.z);colors.push(color.r,color.g,color.b);}}
 }
 const leafGeo=new THREE.BufferGeometry();leafGeo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));leafGeo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));leafGeo.computeVertexNormals();mesh(leafGeo,foliageMat,g);
 // A few hanging vines add depth without needing external textures.
 for(let i=0;i<3;i++){const x=range(-.65,.65),z=range(-.65,.65);tube(g,[[x,h,z],[x+.1,h-.6,z],[x-.05,h-1.3,z]],.013,mat('#446837'),9);}
}

function hut(parent,x,z,scale=1){
 const group=new THREE.Group(),y=Math.max(.38,terrainHeight(x,z));group.position.set(x,y,z);group.scale.setScalar(scale);parent.add(group);
 for(let a of [-.7,.7])for(let b of [-.6,.6])rod(group,[a,-.45,b],[a,1.42,b],.045,palettes.darkWood);
 box(group,1.9,.12,1.8,palettes.wood,0,.17,0);box(group,1.5,1.03,1.3,palettes.wood,0,.74,0);
 for(let i=0;i<9;i++)box(group,.023,1.02,1.31,palettes.darkWood,-.7+i*.175,.74,0);
 const windows=[];for(const a of [-.45,.45]){box(group,.36,.43,.025,palettes.darkWood,a,.87,.66);const w=box(group,.29,.35,.035,mat('#ffc865',.6,{emissive:'#df8a2e',emissiveIntensity:.12}),a,.87,.68);windows.push(w);box(group,.026,.4,.04,palettes.trim,a,.87,.7);}
 box(group,.32,.78,.03,palettes.darkWood,0,.63,.67);
 for(let a of [-1,1]){const roof=box(group,1.12,.07,1.8,roofMat,a*.49,1.47,0);roof.rotation.z=a*-.42;}
 rod(group,[-1,1.72,0],[1,1.72,0],.035,palettes.trim);for(let a of [-.83,.83])rod(group,[a,.22,.79],[a,1.45,.79],.035,palettes.trim);
 for(let i=0;i<3;i++)box(group,.62,.1,.24,palettes.wood,0,.1-i*.08,1.02+i*.18);
 return {group,windows};
}

function bridge(parent,points,width=.9){
 const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));const len=curve.getLength(),count=Math.ceil(len/.17);
 for(let i=0;i<=count;i++){const t=i/count,p=curve.getPoint(t),tan=curve.getTangent(t),angle=Math.atan2(tan.x,tan.z),board=box(parent,width,.055,.154,palettes.wood,p.x,p.y,p.z);board.rotation.y=angle;
  if(i%5===0){const left=new THREE.Vector3(Math.cos(angle)*width*.5,0,-Math.sin(angle)*width*.5);for(let s of [-1,1]){const x=p.x+left.x*s,z=p.z+left.z*s;rod(parent,[x,-.16,z],[x,p.y+.6,z],.03,palettes.wood);}}
 }
 for(let s of [-1,1]){const pts=[];for(let i=0;i<=40;i++){const t=i/40,p=curve.getPoint(t),tan=curve.getTangent(t);const a=Math.atan2(tan.x,tan.z);pts.push([p.x+Math.cos(a)*width*.5*s,p.y+.46,p.z-Math.sin(a)*width*.5*s]);}tube(parent,pts,.022,palettes.trim,80);}
 return curve;
}

function smallBoat(parent,x,z,color='#92552f',sail=false){
 const g=new THREE.Group();parent.add(g);g.position.set(x,.12,z);
 const shape=new THREE.Shape();shape.moveTo(0,.86);shape.quadraticCurveTo(.47,.35,.36,-.6);shape.quadraticCurveTo(0,-.95,-.36,-.6);shape.quadraticCurveTo(-.47,.35,0,.86);
 const hull=mesh(new THREE.ExtrudeGeometry(shape,{depth:.22,bevelEnabled:true,bevelThickness:.035,bevelSize:.035,bevelSegments:2,steps:1}),mat(color),g);hull.rotation.x=-Math.PI/2;
 box(g,.53,.035,.25,palettes.wood,0,.26,-.35);box(g,.55,.035,.2,palettes.trim,0,.26,.24);
 if(sail){rod(g,[0,.3,0],[0,2.15,0],.025,palettes.wood);const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute([0,.5,0,0,2.1,0,1.02,.55,0],3));geo.computeVertexNormals();mesh(geo,mat('#f5e7c5',.9,{side:THREE.DoubleSide}),g);}
 return g;
}

export class IslandWorld {
 constructor(canvas){
  this.canvas=canvas;this.scene=new THREE.Scene();this.scene.fog=new THREE.FogExp2('#c3e1e7',.0025);this.renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,preserveDrawingBuffer:true});this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));this.renderer.setSize(innerWidth,innerHeight);this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFShadowMap;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.14;
  const pmrem=new THREE.PMREMGenerator(this.renderer),environment=new RoomEnvironment();this.scene.environment=pmrem.fromScene(environment,.025).texture;environment.dispose();pmrem.dispose();this.scene.environmentIntensity=.22;
  this.camera=new THREE.PerspectiveCamera(38,innerWidth/innerHeight,.1,300);this.controls=new OrbitControls(this.camera,canvas);this.controls.enableDamping=true;this.controls.dampingFactor=.045;this.controls.minDistance=13;this.controls.maxDistance=72;this.controls.maxPolarAngle=Math.PI*.47;this.controls.minPolarAngle=.14;this.controls.autoRotate=true;this.controls.autoRotateSpeed=.42;this.controls.target.set(0,.9,0);this.home(true);
  this.hemi=new THREE.HemisphereLight('#c6eaff','#526844',1.7);this.scene.add(this.hemi);this.sun=new THREE.DirectionalLight('#fff0c9',3.6);this.sun.position.set(-13,20,10);this.sun.castShadow=true;this.sun.shadow.mapSize.set(2048,2048);Object.assign(this.sun.shadow.camera,{left:-15,right:15,top:15,bottom:-15,near:1,far:55});this.sun.shadow.normalBias=.035;this.sun.shadow.bias=-.00015;this.scene.add(this.sun);
  this.night=0;this.nightTarget=0;this.time=0;this.focusTween=null;this.animated=[];this.glows=[];this.landmarks={};this.clickables=[];this.particles=[];this.foam=[];this.clouds=[];
  this.root=new THREE.Group();this.scene.add(this.root);this.makeSky();this.makeBase();terrain(this.root);this.makeLandscape();this.makeHarbor();this.makeWheel();this.makeTower();this.makeGarden();this.makeVolcano();this.makeLife();this.makePearls();this.makeShore();
  this.boat=smallBoat(this.root,0,9.4,'#bd6236',true);this.boat.scale.setScalar(.6);this.boat.name='player-boat';this.boatFlag=box(this.boat,.18,.1,.014,mat('#df7448'),0,2.12,0);this.goalRing=mesh(new THREE.TorusGeometry(.3,.014,4,32),mat('#f9e7a3',.5,{emissive:'#ffe19a',emissiveIntensity:.5}),this.root,[0,.1,0],false);this.goalRing.rotation.x=-Math.PI/2;this.goalRing.visible=false;
  this.batchStaticMeshes();this.raycaster=new THREE.Raycaster();this.waterPlane=new THREE.Plane(new THREE.Vector3(0,1,0),0);this.projected=new THREE.Vector3();this.resize=()=>{this.camera.aspect=innerWidth/innerHeight;this.camera.updateProjectionMatrix();this.renderer.setSize(innerWidth,innerHeight);};window.addEventListener('resize',this.resize);
 }
 home(immediate=false){const aspect=innerWidth/innerHeight,factor=Math.max(1,(innerWidth<700?1.12:1.35)/aspect),position=new THREE.Vector3(19,15,28).multiplyScalar(factor);this.controls.maxDistance=Math.max(72,position.length()*1.35);const target=new THREE.Vector3(0,.3,0);if(immediate){this.camera.position.copy(position);this.controls.target.copy(target);this.controls.update();}else this.focusTween={from:this.camera.position.clone(),to:position,fromTarget:this.controls.target.clone(),toTarget:target,t:0};}
 focus(id){const p=LOCATIONS.find(x=>x.id===id);if(!p)return;const target=new THREE.Vector3(p.x,p.y*.42,p.z),direction=this.camera.position.clone().sub(this.controls.target).normalize();const distance=innerWidth<700?22:18;this.focusTween={from:this.camera.position.clone(),to:target.clone().add(direction.multiplyScalar(distance)),fromTarget:this.controls.target.clone(),toTarget:target,t:0};this.controls.autoRotate=false;}
 makeSky(){
  const material=new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,uniforms:{time:{value:0},night:{value:0}},vertexShader:'varying vec3 vPos;void main(){vPos=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:`varying vec3 vPos;uniform float time;uniform float night;${noiseGLSL}void main(){vec3 d=normalize(vPos);float h=smoothstep(-.15,.8,d.y);vec3 col=mix(vec3(.55,.74,.86),vec3(.36,.62,.82),h);vec2 p=d.xz/(abs(d.y)+.23)*2.5;float c=smoothstep(.49,.69,fbm(p+vec2(time*.006,0.)));col=mix(col,vec3(.98,.98,.93),c*(1.-h)*.74);vec3 evening=mix(vec3(.56,.36,.30),vec3(.055,.12,.24),h);col=mix(col,evening,night);gl_FragColor=vec4(col,1.);\n#include <colorspace_fragment>}`});this.sky=mesh(new THREE.SphereGeometry(120,32,16),material,this.scene,[0,0,0],false);
  // Soft clouds below the floating island, at several depths.
  for(let i=0;i<45;i++){const material=new THREE.SpriteMaterial({map:glowTexture,color:'#ffffff',opacity:range(.15,.35),depthWrite:false});const s=new THREE.Sprite(material),angle=random()*TAU,r=range(19,54);s.position.set(Math.cos(angle)*r,range(-11,-5),Math.sin(angle)*r);s.scale.set(range(12,23),range(4,10),1);this.scene.add(s);this.clouds.push(s);}
 }
 makeBase(){
  const soil=mat('#bd9463',1,{map:earthTexture}),edge=mat('#edd6a4',.95);mesh(new THREE.CylinderGeometry(12.85,12.6,.6,144),edge,this.root,[0,-.88,0]);mesh(new THREE.CylinderGeometry(12.62,12.36,.7,144),soil,this.root,[0,-1.51,0]);
  const sections=8,sides=112,pos=[],indices=[],colors=[];
  for(let row=0;row<=sections;row++){const t=row/sections;for(let i=0;i<=sides;i++){const a=i/sides*TAU,r=12.45*Math.pow(1-t*.68,.45)*(1+.025*Math.sin(a*13+t*8)+.018*Math.sin(a*21));pos.push(Math.cos(a)*r,-1.65-t*5.2+Math.sin(a*9)*.16*(1-t),Math.sin(a)*r);const c=new THREE.Color('#432a20').lerp(new THREE.Color('#98653f'),random()*.3+.22*(1-t));colors.push(c.r,c.g,c.b);}}
  for(let j=0;j<sections;j++)for(let i=0;i<sides;i++){const a=j*(sides+1)+i,b=a+sides+1;indices.push(a,a+1,b,a+1,b+1,b);}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.setIndex(indices);g.computeVertexNormals();mesh(g,mat('#ffffff',1,{vertexColors:true,flatShading:true}),this.root);
  this.waterMat=createWater();const water=mesh(new THREE.CircleGeometry(12.8,160),this.waterMat,this.root,[0,0,0],false);water.rotation.x=-Math.PI/2; // Circle starts in XY; rotate vertices to keep shader axes in world XZ.
  water.geometry.rotateX(-Math.PI/2);water.rotation.x=0;this.water=water;
  // Transparent turquoise edge of the sliced sea.
  const rimMat=new THREE.ShaderMaterial({transparent:true,side:THREE.DoubleSide,uniforms:{time:{value:0},night:{value:0}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:`varying vec2 vUv;uniform float time;uniform float night;void main(){float v=sin(vUv.x*850.+vUv.y*28.+time*1.7)*sin(vUv.x*490.-vUv.y*20.-time);float glow=pow(abs(v),9.);vec3 c=mix(vec3(.01,.65,.70),vec3(.48,.95,.86),glow*.8+(1.-vUv.y)*.2);c*=1.-night*.65;gl_FragColor=vec4(c,.88);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>}`});this.rimMat=rimMat;mesh(new THREE.CylinderGeometry(12.8,12.8,.62,160,1,true),rimMat,this.root,[0,-.31,0],false);
  const ring=mesh(new THREE.TorusGeometry(12.8,.032,5,180),mat('#b6f1dd',.4,{emissive:'#4acbca',emissiveIntensity:.25}),this.root,[0,-.01,0],false);ring.rotation.x=Math.PI/2;
  for(let i=0;i<19;i++){const a=range(0,TAU),r=range(11.5,12.5);tube(this.root,[[Math.cos(a)*r,-1.4,Math.sin(a)*r],[Math.cos(a)*r*1.04,-2.5,Math.sin(a)*r*1.04],[Math.cos(a)*r*.89,-range(3,5.1),Math.sin(a)*r*.89]],.025,palettes.darkWood,12);}
 }
 makeLandscape(){
  const mainPalms=[[-6.1,-1.5,3.8],[-5.1,.6,3.4],[-4.9,2.2,2.6],[-2.9,1.8,3],[1.5,.4,3.5],[3.2,-.2,2.9],[5,-2.8,3.3],[4.2,-4.4,3],[1.6,-5.8,3.7],[-2.3,-5,3.4],[-5.1,-3.7,3.1]];
  mainPalms.forEach(([x,z,h])=>palm(this.root,x,z,h,range(0,6)));
  for(let i=0;i<24;i++){const x=range(-5.7,4.8),z=range(-5.4,.9);if(terrainHeight(x,z)>.65&&Math.hypot(x-.1,z+3.1)>2.15&&Math.hypot(x+4.2,z+4)>1) broadTree(this.root,x,z,range(1.1,2.3));}
  // Grass, fern fans, flowering undergrowth and scattered weathered boulders.
  const grassMat=mat('#54863c',1,{side:THREE.DoubleSide}),grassGeo=new THREE.BufferGeometry(),gp=[];
  for(let i=0;i<1900;i++){const x=range(-6,6),z=range(-6,2.4),y=terrainHeight(x,z);if(y<.55||Math.hypot(x-.1,z+3.1)<1.6)continue;const h=range(.07,.22),w=range(.025,.045),a=random()*TAU;gp.push(x-Math.cos(a)*w,y,z-Math.sin(a)*w,x+Math.cos(a)*w,y,z+Math.sin(a)*w,x+.06,y+h,z+.02);}grassGeo.setAttribute('position',new THREE.Float32BufferAttribute(gp,3));grassGeo.computeVertexNormals();mesh(grassGeo,grassMat,this.root);
  for(let i=0;i<60;i++){const x=range(-6.8,6.5),z=range(-6,3),y=terrainHeight(x,z);if(y<0||Math.hypot(x-.1,z+3.1)<1.8)continue;const r=range(.14,.55);const o=mesh(new THREE.DodecahedronGeometry(r,1),mat(i%3?'#8c8b72':'#b1a689'),this.root,[x,y+r*.3,z]);o.scale.set(1,range(.7,1.2),range(.7,1.4));o.rotation.set(random(),random(),random());}
  for(const [x,z,r] of ISLETS){
   sphere(this.root,r,palettes.sand,x,-.05,z,1.1,.38,1);palm(this.root,x,z,range(2.3,3.3));for(let i=0;i<4;i++)mesh(new THREE.DodecahedronGeometry(range(.18,.38),0),palettes.rock,this.root,[x+range(-r,r),.1,z+range(-r,r)]);
  }
  for(let i=0;i<45;i++){const a=random()*TAU;const x=Math.cos(a)*range(8.5,11.8),z=Math.sin(a)*range(8.5,11.8);const rock=mesh(new THREE.IcosahedronGeometry(range(.13,.36),0),mat('#cdca9a'),this.root,[x,-.2,z],false);rock.scale.y=.3;}
 }
 makeShore(){
  const positions=[],uvs=[],indices=[],count=180;for(let i=0;i<=count;i++){const a=i/count*TAU,edge=1+.085*Math.sin(a*5)+.055*Math.sin(a*9+1);for(let j=0;j<2;j++){const delta=j?.13:.018;positions.push(Math.cos(a)*6.2*(edge+delta),.065,Math.sin(a)*4.2*(edge+delta)-1.8);uvs.push(i/count,j);}}for(let i=0;i<count;i++){const k=i*2;indices.push(k,k+1,k+2,k+1,k+3,k+2);}const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geo.setIndex(indices);geo.computeVertexNormals();
  this.shoreMat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,uniforms:{time:{value:0}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:`uniform float time;varying vec2 vUv;${noiseGLSL}void main(){float n=fbm(vec2(vUv.x*150.,vUv.y*6.+time*.5));float stripes=pow(max(0.,sin(vUv.y*22.+n*10.-time)),5.);float alpha=stripes*.36*(1.-vUv.y)+smoothstep(.6,.8,n)*.15;gl_FragColor=vec4(.77,.97,.90,alpha);}`});mesh(geo,this.shoreMat,this.root,[0,0,0],false);
 }
 addLandmark(id,group){const p=LOCATIONS.find(p=>p.id===id),hit=mesh(new THREE.SphereGeometry(id==='tower'?1.25:1.6,8,6),new THREE.MeshBasicMaterial({visible:false}),this.root,[p.x,p.y*.58,p.z],false);hit.userData.location=id;this.clickables.push(hit);this.landmarks[id]={group,lights:[],active:false};return this.landmarks[id];}
 lamp(parent,x,y,z,id){const bulb=mesh(new THREE.SphereGeometry(.065,8,5),mat('#e8e1b8',.6,{emissive:'#ffd88e',emissiveIntensity:.18}),parent,[x,y,z],false);const s=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTexture,color:'#ffd88e',transparent:true,opacity:.02,depthWrite:false}));s.position.set(x,y,z);s.scale.set(.45,.45,1);parent.add(s);this.glows.push(s);if(id&&this.landmarks[id])this.landmarks[id].lights.push({bulb,s});return {bulb,s};}
 makeHarbor(){
  const g=new THREE.Group();this.root.add(g);const l=this.addLandmark('harbor',g);l.windows=[];
  for(const [x,z,s] of [[-4.8,.65,1.05],[-2.8,-.2,.85],[-5.35,-1.45,.8],[-3.7,-2.7,.8],[3.8,-1.6,.9],[4.8,1.1,1]]){const h=hut(g,x,z,s);l.windows.push(...h.windows);}
  const pts=[[-6.4,1.0,2.2],[-4.8,.68,3.1],[-2,.62,3.45],[1,.68,3.0],[3.2,.95,1.5],[3.3,1,-1.2]];this.bridge=bridge(g,pts,.9);
  bridge(g,[[-4.7,.5,3.1],[-4.7,.4,4.15],[-4.4,.4,4.9]],1.0);
  for(let i=0;i<15;i++){const p=this.bridge.getPoint(i/14);rod(g,[p.x,p.y+.5,p.z],[p.x,p.y+1.35,p.z],.025,palettes.darkWood);this.lamp(g,p.x,p.y+1.32,p.z,'harbor');}
  const strings=[];for(let i=0;i<=40;i++){const p=this.bridge.getPoint(i/40);strings.push([p.x,p.y+1.29-.13*Math.sin(i/40*Math.PI*14),p.z]);}tube(g,strings,.01,palettes.darkWood,80);
  for(let i=0;i<3;i++){const boat=smallBoat(g,-4.8+i*.85,4.5+i*.4,['#9a5f3b','#4b898a','#9e7647'][i]);boat.scale.setScalar(.55);boat.rotation.y=range(-2,2);this.animated.push({type:'boat',object:boat,base:boat.position.clone(),phase:random()*TAU});}
  // Beach parasol and a pair of loungers.
  rod(g,[-.6,.4,1.5],[-.6,2.05,1.5],.025,palettes.wood);const umb=mesh(new THREE.ConeGeometry(.8,.3,10,1,true),mat('#dfad6b',.8,{side:THREE.DoubleSide}),g,[-.6,2,1.5]);
  for(let a of [-1.05,-.3]){const chair=box(g,.34,.035,.9,mat('#efdfb5'),a,.47,2);chair.rotation.x=-.12;for(let z of [1.7,2.3])rod(g,[a,.3,z],[a,.46,z],.025,palettes.wood);}
 }
 makeWheel(){
  const g=new THREE.Group();g.position.set(1.7,.7,-.7);this.root.add(g);const l=this.addLandmark('wheel',g);this.wheel=new THREE.Group();g.add(this.wheel);this.cabins=[];
  this.makeSkull(g,1,'wheel');
  const ancient=new THREE.Group();ancient.position.set(-2.9,terrainHeight(-2.9,-2.3)+.15,-2.3);ancient.rotation.y=-.22;ancient.scale.setScalar(.66);this.root.add(ancient);this.makeSkull(ancient,.9,null);
  this.skullFalls=[];
  const fallingWater=this.waterfallSkullMaterial=new THREE.ShaderMaterial({transparent:true,side:THREE.DoubleSide,uniforms:{time:{value:0},night:{value:0}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:`varying vec2 vUv;uniform float time;uniform float night;${noiseGLSL}void main(){float n=fbm(vec2(vUv.x*24.,vUv.y*9.-time*2.5));float edge=smoothstep(0.,.14,vUv.x)*smoothstep(1.,.86,vUv.x);vec3 c=mix(vec3(.24,.79,.8),vec3(.96,.99,.97),n*.95);c*=1.-night*.5;gl_FragColor=vec4(c,edge*(.65+n*.3));\n#include <tonemapping_fragment>\n#include <colorspace_fragment>}`});
  for(const [x,y,z,w] of [[1.7,1.5,1.12,.66],[-2.9,1.5,-1.02,.43]]){const f=mesh(new THREE.PlaneGeometry(w,2.25,4,18),fallingWater,this.root,[x,y,z],false);f.rotation.x=-.17;this.skullFalls.push(f);for(let i=0;i<6;i++){const splash=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTexture,color:'#edffff',opacity:.25,depthWrite:false}));splash.position.set(x+range(-.45,.45),.16,z+.5+range(-.2,.4));splash.scale.set(.65,.18,1);this.root.add(splash);}}
 }
 makeSkull(parent,size=1,id=null){
  const g=new THREE.Group();g.scale.setScalar(size);parent.add(g);
  const bone=mat('#a39570',.95,{map:earthTexture}),shadow=mat('#343b30'),ivory=mat('#e3d7a6',.9);
  // Dome, cheek arches and long snout form a recognizable dinosaur skull.
  sphere(g,1.05,bone,0,2.7,-.15,1,.98,1.1);sphere(g,.8,bone,0,2.7,.63,.85,.63,1.3);
  for(const side of [-1,1]){
   sphere(g,.38,bone,side*.65,2.31,.4,.72,1.8,1.1);
   sphere(g,.4,shadow,side*.62,2.92,.8,1,.9,.38);
   const eye=sphere(g,.14,mat('#7ee7d0',.4,{emissive:'#23dec1',emissiveIntensity:id?.6:1.4}),side*.65,2.95,.95,1,1,.7);
   if(id){if(!this.landmarks[id].eyes)this.landmarks[id].eyes=[];this.landmarks[id].eyes.push(eye);}
   sphere(g,.23,bone,side*.29,2.9,1.27,1,.8,1.6);sphere(g,.105,shadow,side*.22,2.94,1.55,.65,.5,.5);
   tube(g,[[side*.65,2.94,.93],[side*.71,3.16,.61],[side*.57,3.25,.35]],.065,bone,12);
   tube(g,[[side*.72,2.5,.35],[side*.6,1.85,.85],[side*.35,1.85,1.42]],.12,bone,14);
   for(let i=0;i<6;i++){const z=.34+i*.21,x=side*(.48-i*.025);mesh(new THREE.ConeGeometry(.052,.23,7),ivory,g,[x,2.42-i*.016,z]).rotation.z=Math.PI;mesh(new THREE.ConeGeometry(.045,.18,6),ivory,g,[x,2.0-i*.012,z]);}
  }
  sphere(g,.6,shadow,0,2.26,.92,.8,.4,1.1);sphere(g,.5,bone,0,1.83,.98,1.04,.24,1.45);
  // Moss clings to the brow and the spine behind the ancient stone head.
  for(let i=0;i<9;i++)sphere(g,range(.12,.22),mat('#537a3e'),range(-.65,.65),range(3.27,3.56),range(-.75,.25),1,.28,1);
  for(let i=0;i<3;i++)mesh(new THREE.ConeGeometry(.11,.6,6),bone,g,[0,2.7,-.75-i*.26]).rotation.x=-Math.PI*.3;
 }
 makeTower(){
  const g=new THREE.Group();g.position.set(-4.2,terrainHeight(-4.2,-4),-4);this.root.add(g);this.addLandmark('tower',g);
  const h=5.1;for(let x of [-.56,.56])for(let z of [-.56,.56]){rod(g,[x*1.45,0,z*1.45],[x*.65,h,z*.65],.06,palettes.darkWood);}
  for(let j=0;j<4;j++){const y=j*1.13;for(let z of [-1,1]){rod(g,[-.66,y,z*.66],[.58,y+1.12,z*.58],.024,palettes.wood);rod(g,[.66,y,z*.66],[-.58,y+1.12,z*.58],.024,palettes.wood);}for(let x of [-1,1])rod(g,[x*.65,y,-.65],[x*.6,y+1.12,.6],.025,palettes.wood);}
  for(let i=0;i<19;i++)rod(g,[-.22,i*.25,.66],[.22,i*.25,.66],.017,palettes.trim);
  box(g,1.85,.13,1.85,palettes.wood,0,h-.03,0);for(let x of [-.6,.6])for(let z of [-.6,.6])rod(g,[x,h,z],[x,h+1,z],.035,palettes.trim);
  const glass=mat('#9db5a4',.2,{transparent:true,opacity:.32});box(g,1.17,.78,1.17,glass,0,h+.43,0);mesh(new THREE.ConeGeometry(1.12,.54,4),mat('#c2a364'),g,[0,h+1.19,0]).rotation.y=Math.PI/4;
  this.lamp(g,0,h+.42,0,'tower');const lantern=mesh(new THREE.CylinderGeometry(.22,.22,.36,12),mat('#ffd98c',.2,{emissive:'#ffb94b',emissiveIntensity:.3}),g,[0,h+.44,0]);this.landmarks.tower.lantern=lantern;
  this.beam=mesh(new THREE.ConeGeometry(2.4,13,24,1,true),new THREE.MeshBasicMaterial({color:'#ffebb0',transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide}),g,[0,h+.44,0],false);this.beam.geometry.translate(0,-6.5,0);this.beam.rotation.z=Math.PI/2;
  this.lighthouseLight=new THREE.PointLight('#ffc877',0,12,2);this.lighthouseLight.position.set(-4.2,8,-4);this.scene.add(this.lighthouseLight);
 }
 makeGarden(){
  const g=new THREE.Group();g.position.set(6.7,.25,3);g.rotation.y=-.28;this.root.add(g);this.addLandmark('garden',g);
  box(g,3.5,.15,2.8,palettes.trim,0,.06,0);for(let i=0;i<8;i++){const z=-1.2+i*.34,pts=[];for(let j=0;j<=20;j++){const a=j/20*Math.PI;pts.push([Math.cos(a)*1.65,.2+Math.sin(a)*2.1,z]);}tube(g,pts,.035,palettes.trim,25);}
  for(let a of [-.65,0,.65])tube(g,[[-1.55,.55+a*.4,-1.3],[-1.5,1.1+a,-.5],[-1.5,1.1+a,.5],[-1.55,.55+a*.4,1.3]],.016,palettes.metal,15);
  // Curved glass canopy, deliberately subtle so the coral remains readable.
  const glass=mesh(new THREE.CylinderGeometry(1.66,1.66,2.64,32,1,true,0,Math.PI),mat('#b6ece4',.12,{transparent:true,opacity:.14,side:THREE.DoubleSide,depthWrite:false}),g,[0,.2,0],false);glass.rotation.x=Math.PI/2;glass.rotation.z=Math.PI/2;
  const corals=[];for(let i=0;i<19;i++){const x=range(-1.3,1.3),z=range(-1.05,1.05),h=range(.25,.8),m=mat(['#d48e8a','#d4b76b','#81a397','#c293ad'][i%4]);corals.push(m);rod(g,[x,.14,z],[x,.14+h,z],.035,m);for(let j=0;j<3;j++)rod(g,[x,.18+h*.4,z],[x+range(-.25,.25),.2+h+range(-.15,.1),z+range(-.2,.2)],.025,m);sphere(g,.15,palettes.rock,x,.18,z,1,.5,1);}
  this.landmarks.garden.corals=corals;for(let i=0;i<8;i++)this.lamp(g,range(-1.3,1.3),.4,range(-1,1),'garden');bridge(this.root,[[3.3,.8,1.5],[4.6,.4,2.6],[6.7,.4,3]],.7);
 }
 makeVolcano(){
  const g=new THREE.Group();g.position.set(.1,.55,-3.1);this.root.add(g);this.addLandmark('volcano',g);
  const rows=28,sides=60,pos=[],colors=[],ind=[];for(let j=0;j<=rows;j++){const t=j/rows,y=t*3.35,r=2.0*Math.pow(1-t,.85)+.48;for(let i=0;i<=sides;i++){const a=i/sides*TAU,rr=r*(1+.08*Math.sin(a*7+t*3)+.06*Math.sin(a*11));pos.push(Math.cos(a)*rr,y+Math.sin(a*5)*.12*t,Math.sin(a)*rr);const lava=t>.72&&Math.sin(a*7+t*4)>.75;const c=new THREE.Color(lava?'#e28e29':t<.2?'#677742':'#66574d').multiplyScalar(.8+random()*.3);colors.push(c.r,c.g,c.b);}}
  for(let j=0;j<rows;j++)for(let i=0;i<sides;i++){const a=j*(sides+1)+i,b=a+sides+1;ind.push(a,b,a+1,a+1,b,b+1);}const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geo.setIndex(ind);geo.computeVertexNormals();mesh(geo,mat('#ffffff',.95,{vertexColors:true}),g);
  const lava=mesh(new THREE.CircleGeometry(.51,40),mat('#fd9529',.6,{emissive:'#ff5312',emissiveIntensity:1.5}),g,[0,3.29,0],false);lava.rotation.x=-Math.PI/2;
  for(let i=0;i<6;i++){const a=i*TAU/6;const pts=[];for(let j=0;j<9;j++){const t=j/8,y=3.3-t*range(.9,1.9),r=.51+(3.35-y)*.59;pts.push([Math.cos(a+Math.sin(j)*.02)*r,y,Math.sin(a+Math.sin(j)*.02)*r]);}tube(g,pts,.02,mat('#f99b30',.7,{emissive:'#ff551b',emissiveIntensity:1.1}),18);}
  this.smoke=[];for(let i=0;i<22;i++){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTexture,color:'#6f706b',opacity:.12,depthWrite:false}));g.add(s);this.smoke.push({object:s,phase:i/22});}
  // Layered waterfall flowing from the hillside into the lagoon.
  const waterfallMat=new THREE.ShaderMaterial({transparent:true,side:THREE.DoubleSide,uniforms:{time:{value:0},night:{value:0}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:`varying vec2 vUv;uniform float time;uniform float night;${noiseGLSL}void main(){float n=fbm(vec2(vUv.x*23.,vUv.y*8.-time*3.));vec3 c=mix(vec3(.28,.79,.8),vec3(.95,1.,.94),n*.9);c*=1.-night*.55;gl_FragColor=vec4(c,.65+n*.3);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>}`});this.waterfallMat=waterfallMat;
  for(let i=0;i<3;i++){const f=mesh(new THREE.PlaneGeometry(.47,2.3,5,20),waterfallMat,this.root,[-1.15+i*.3,1.45,.2],false);f.rotation.x=-.12;f.rotation.z=range(-.06,.06);}
  for(let i=0;i<16;i++){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTexture,color:'#e2ffff',opacity:.2,depthWrite:false}));s.position.set(-.9+range(-.6,.6),.18,1.15+range(-.3,.3));s.scale.set(.55,.15,1);this.root.add(s);this.foam.push(s);}
 }
 makeLife(){
  this.birds=[];const birdMaterial=new THREE.MeshBasicMaterial({color:'#f5f3df',side:THREE.DoubleSide});for(let i=0;i<15;i++){const g=new THREE.Group();this.root.add(g);for(let s of [-1,1]){const wing=mesh(new THREE.PlaneGeometry(.25,.055),birdMaterial,g,[s*.1,0,0],false);wing.rotation.z=s*.23;wing.rotation.x=Math.PI/2;}this.birds.push({g,a:random()*TAU,r:range(5,14),h:range(5.5,9),speed:range(.07,.14)});}
  for(let i=0;i<4;i++){const b=smallBoat(this.root,0,0,['#e9b781','#4d8791','#a38b56','#a47760'][i],i%2===0);b.scale.setScalar(range(.5,.8));this.animated.push({type:'sail',object:b,r:9.5+i*.5,phase:i*1.5,speed:.028+i*.005});}
  // Schools of fish travel just under the surface.
  this.fish=[];for(let i=0;i<32;i++){const f=sphere(this.root,.1,mat(i%3?'#489e9a':'#d9a253'),0,-.07,0,1,.45,2);this.fish.push({f,a:random()*TAU,r:range(7.2,11.3),speed:range(.05,.1)});}
 }
 makePearls(){
  this.pearls=PEARLS.map(([x,z],i)=>{const group=new THREE.Group();group.position.set(x,.42,z);this.root.add(group);const jewel=mesh(new THREE.OctahedronGeometry(.16,1),mat('#ffecb4',.2,{metalness:.28,emissive:'#d8a740',emissiveIntensity:.45}),group,[0,0,0],false);const glow=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTexture,color:'#ffe7a1',opacity:.4,depthWrite:false}));glow.scale.set(.95,.95,1);group.add(glow);const ring=mesh(new THREE.TorusGeometry(.3,.009,4,32),mat('#f0e9b6',.5,{emissive:'#e9d596',emissiveIntensity:.5}),group,[0,-.3,0],false);ring.rotation.x=Math.PI/2;const hit=mesh(new THREE.SphereGeometry(.48,8,6),new THREE.MeshBasicMaterial({visible:false}),group,[0,0,0],false);hit.userData.pearl=i;this.clickables.push(hit);return {group,jewel,ring};});
 }
 activate(id){const l=this.landmarks[id];if(!l)return;l.active=true;for(const {bulb,s} of l.lights){bulb.material.emissiveIntensity=2.5;s.material.opacity=.35;}l.windows?.forEach(w=>w.material.emissiveIntensity=1.4);l.eyes?.forEach(w=>w.material.emissiveIntensity=2.3);if(id==='tower')l.lantern.material.emissiveIntensity=3;if(id==='garden')l.corals.forEach(m=>{m.emissive=m.color.clone();m.emissiveIntensity=.16;});this.burst(new THREE.Vector3(...[LOCATIONS.find(p=>p.id===id).x,LOCATIONS.find(p=>p.id===id).y,LOCATIONS.find(p=>p.id===id).z]),'#ffd78b',35);}
 burst(position,color='#fff1b6',count=20){for(let i=0;i<count;i++){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTexture,color,opacity:1,depthWrite:false}));s.position.copy(position);s.scale.setScalar(range(.06,.17));this.root.add(s);const velocity=new THREE.Vector3(range(-1.3,1.3),range(.5,2.4),range(-1.3,1.3));this.particles.push({s,velocity,life:range(.8,1.8),age:0});}}
 collect(i){const pearl=this.pearls[i];if(!pearl)return;this.burst(pearl.group.position);pearl.group.visible=false;}
 setNight(value){this.nightTarget=value?1:0;}
 setGoal(x,z){this.goalRing.position.set(x,.095,z);this.goalRing.visible=true;}
 pick(clientX,clientY){const rect=this.canvas.getBoundingClientRect(),p=new THREE.Vector2((clientX-rect.left)/rect.width*2-1,-(clientY-rect.top)/rect.height*2+1);this.raycaster.setFromCamera(p,this.camera);const hits=this.raycaster.intersectObjects(this.clickables,false).filter(h=>h.object.parent.visible);if(hits.length){const d=hits[0].object.userData;if(d.location)return {location:d.location};if(d.pearl!==undefined&&!this.pearls[d.pearl].group.visible)return null;return {pearl:d.pearl};}const point=new THREE.Vector3();if(this.raycaster.ray.intersectPlane(this.waterPlane,point)&&Math.hypot(point.x,point.z)<12.4)return {water:{x:point.x,z:point.z}};return null;}
 project(position){this.projected.set(position.x,position.y,position.z).project(this.camera);return {x:(this.projected.x*.5+.5)*innerWidth,y:(-.5*this.projected.y+.5)*innerHeight,visible:this.projected.z>-1&&this.projected.z<1};}
 update(dt,game){
  this.time+=dt;const t=this.time;this.night+=(this.nightTarget-this.night)*Math.min(1,dt*.7);const n=this.night;
  this.waterMat.uniforms.time.value=t;this.waterMat.uniforms.night.value=n;this.rimMat.uniforms.time.value=t;this.rimMat.uniforms.night.value=n;this.sky.material.uniforms.time.value=t;this.sky.material.uniforms.night.value=n;this.waterfallMat.uniforms.time.value=t;this.waterfallMat.uniforms.night.value=n;this.shoreMat.uniforms.time.value=t;this.waterfallSkullMaterial.uniforms.time.value=t;this.waterfallSkullMaterial.uniforms.night.value=n;
  this.hemi.intensity=THREE.MathUtils.lerp(1.7,.65,n);this.sun.intensity=THREE.MathUtils.lerp(3.6,.95,n);this.sun.color.set('#fff0c9').lerp(new THREE.Color('#eaa877'),n);this.scene.fog.color.set('#c3e1e7').lerp(new THREE.Color('#727b91'),n);this.renderer.toneMappingExposure=THREE.MathUtils.lerp(1.14,.97,n);
  this.clouds.forEach((s,i)=>{s.position.x+=dt*.065;s.material.color.set('#ffffff').lerp(new THREE.Color('#a6a1b0'),n);if(s.position.x>60)s.position.x=-60;});
  const stopped=game.paused;
  if(!stopped){
   const active=this.landmarks.wheel.active;this.landmarks.wheel.eyes?.forEach(eye=>eye.material.emissiveIntensity=(active?2.3:.6)+Math.sin(t*.8)*.1);
   this.smoke.forEach(({object:s,phase})=>{const age=(t*.115+phase)%1;s.position.set(age*3.5+Math.sin(t+phase*20)*.12,3.4+age*4,age*.4);s.scale.setScalar(.45+age*1.6);s.material.opacity=(1-age)*.28;});
   this.birds.forEach(({g,a,r,h,speed},i)=>{const angle=a+t*speed;g.position.set(Math.cos(angle)*r,h+Math.sin(t*.5+i)*.35,Math.sin(angle)*r);g.rotation.y=-angle;g.children.forEach((w,j)=>w.rotation.z=(j===0?-1:1)*(.2+Math.sin(t*4+i)*.28));});
   this.animated.forEach(a=>{const b=a.object;if(a.type==='boat'){b.position.y=a.base.y+Math.sin(t*1.3+a.phase)*.025;b.rotation.z=Math.sin(t+a.phase)*.025;}else {const angle=t*a.speed+a.phase;b.position.set(Math.cos(angle)*a.r,.1+Math.sin(t+a.phase)*.025,Math.sin(angle)*a.r);b.rotation.y=-angle;}});
   this.fish.forEach(({f,a,r,speed})=>{const angle=a+t*speed;f.position.set(Math.cos(angle)*r,-.038,Math.sin(angle)*r);f.rotation.y=-angle;});
   this.pearls.forEach(({group,jewel,ring},i)=>{group.position.y=.42+Math.sin(t*1.5+i)*.09;jewel.rotation.y=t*.7;ring.scale.setScalar(1+Math.sin(t*2+i)*.1);});
   this.boat.position.set(game.boat.x,.12+Math.sin(t*1.7)*.025,game.boat.z);let delta=THREE.MathUtils.euclideanModulo(game.boat.heading-this.boat.rotation.y+Math.PI,TAU)-Math.PI;this.boat.rotation.y+=delta*Math.min(1,dt*5);this.boat.rotation.z=Math.sin(t*1.4)*.025;
   if(game.path.length&&Math.floor(t*20)!==Math.floor((t-dt)*20)){const p=this.boat.position.clone();p.y=.04;p.x-=Math.sin(this.boat.rotation.y)*.5;p.z-=Math.cos(this.boat.rotation.y)*.5;this.burst(p,'#b2f4ee',1);}
   this.beam.rotation.y=t*.24;this.beam.material.opacity=this.landmarks.tower.active?n*.06:0;this.lighthouseLight.intensity=this.landmarks.tower.active?2+n*3:0;
  }
  this.goalRing.visible=game.path.length>0;this.goalRing.scale.setScalar(1+Math.sin(t*3)*.15);
  for(let i=this.particles.length-1;i>=0;i--){const p=this.particles[i];p.age+=dt;p.s.position.addScaledVector(p.velocity,dt);p.velocity.y-=dt*.8;p.s.material.opacity=Math.max(0,1-p.age/p.life);if(p.age>p.life){this.root.remove(p.s);p.s.material.dispose();this.particles.splice(i,1);}}
  if(this.focusTween){const f=this.focusTween;f.t=Math.min(1,f.t+dt*.75);const e=1-Math.pow(1-f.t,3);this.camera.position.lerpVectors(f.from,f.to,e);this.controls.target.lerpVectors(f.fromTarget,f.toTarget,e);if(f.t===1)this.focusTween=null;}
  this.controls.update();this.renderer.render(this.scene,this.camera);
 }
 photograph(){this.renderer.render(this.scene,this.camera);return new Promise((resolve,reject)=>this.canvas.toBlob(blob=>{if(!blob){reject(new Error('Image encoding failed'));return;}const url=URL.createObjectURL(blob),a=document.createElement('a');a.download='tidelands-island.png';a.href=url;a.style.display='none';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);resolve(url);},'image/png'));}
 batchStaticMeshes(){
  const exclude=new Set([this.boat,this.wheel,this.beam,...this.animated.map(a=>a.object),...this.birds.map(b=>b.g),...this.pearls.map(p=>p.group),...this.fish.map(f=>f.f)]),batches=new Map();this.root.updateMatrixWorld(true);
  this.root.traverse(o=>{if(!o.isMesh||!o.material?.isMeshStandardMaterial)return;for(let p=o;p&&p!==this.root;p=p.parent)if(exclude.has(p))return;const key=o.material.uuid;if(!batches.has(key))batches.set(key,[]);batches.get(key).push(o);});
  for(const objects of batches.values()){if(objects.length<3)continue;const geos=objects.map(o=>{const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();g.applyMatrix4(o.matrixWorld);for(const key of Object.keys(g.attributes))if(!['position','normal','uv','color'].includes(key))g.deleteAttribute(key);if(!g.attributes.uv)g.setAttribute('uv',new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count*2),2));return g;});const combined=mergeGeometries(geos);if(combined){mesh(combined,objects[0].material,this.root);objects.forEach(o=>o.removeFromParent());}geos.forEach(g=>g.dispose());}
 }
}
