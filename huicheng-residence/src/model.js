import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { X,Z,M,HEIGHT,outline,rooms,walls,windows,doors,passages,furnishings,pointInPoly } from './data.js';
import { createReferenceArtwork } from './artwork.js';
import { initStudyMaterials,studyTypes,buildStudyFurniture,addStudyDetails } from './study.js';
import { initMasterMaterials,masterTypes,buildMasterFurniture,addMasterDetails,createCabinetEntry } from './master.js';
import { initBathroomMaterials,buildBathroom,addBathroomDetails,addBathroomDoorDetails } from './bathroom.js';
import { initEntryMaterials,addEntryDoorDetails } from './entry.js';
import { initKitchenDiningMaterials,kitchenDiningTypes,buildKitchenDiningFurniture,addKitchenDiningDetails,createKitchenWindow,createRoomSlides } from './kitchen-dining.js';

const materials = {};
let seed = 42;
const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
function texture(kind) {
  const c = document.createElement('canvas'); c.width=c.height=512;
  const ctx=c.getContext('2d');
  if(kind==='wood') {
    ctx.fillStyle='#c8ad86';ctx.fillRect(0,0,512,512);
    for(let i=0;i<1500;i++) {const x=random()*512;ctx.strokeStyle=`rgba(${random()>.5?'90,56,25':'255,235,199'},${.015+random()*.05})`;ctx.beginPath();ctx.moveTo(x,0);ctx.bezierCurveTo(x+random()*10,170,x-5,370,x+random()*8,512);ctx.stroke();}
    for(let i=0;i<8;i++){ctx.fillStyle='rgba(80,60,35,.11)';ctx.fillRect(i*64,0,1,512);ctx.fillRect(i*64,(i%3)*170,64,1);}
  } else if(kind==='tile') {
    ctx.fillStyle='#e4e1d9';ctx.fillRect(0,0,512,512);
    for(let i=0;i<10000;i++){ctx.fillStyle=`rgba(95,91,85,${random()*.035})`;ctx.fillRect(random()*512,random()*512,2,2);}
    ctx.strokeStyle='#c5c2ba';ctx.lineWidth=2;ctx.strokeRect(0,0,512,512);
  } else if(kind==='fabric') {
    ctx.fillStyle='#ffffff';ctx.fillRect(0,0,512,512);
    for(let i=0;i<512;i+=2){ctx.fillStyle=`rgba(70,65,55,${.025+random()*.035})`;ctx.fillRect(i,0,1,512);ctx.fillRect(0,i,512,1);}
  } else {
    ctx.fillStyle='#ece8dd';ctx.fillRect(0,0,512,512);
    for(let i=0;i<130;i++){ctx.strokeStyle='rgba(170,167,159,.08)';ctx.beginPath();let x=random()*512,y=random()*512;ctx.moveTo(x,y);for(let j=0;j<8;j++)ctx.lineTo(x+=random()*50-18,y+=random()*50);ctx.stroke();}
  }
  const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.colorSpace=THREE.SRGBColorSpace;t.repeat.set(kind==='wood'?2:3,kind==='wood'?2:3);t.anisotropy=8;return t;
}
const wallFinishes={
  paint:{name:'暖白哑光乳胶漆',color:'#eee9df',roughness:.98,bumpScale:.0013,density:1.6,cloud:1.5,grain:1.8},
  cement:{name:'浅灰微水泥',color:'#c6c3bb',roughness:.96,bumpScale:.005,density:.65,cloud:13,grain:3},
  plaster:{name:'米色艺术涂料',color:'#dccab2',roughness:.97,bumpScale:.0035,density:.85,cloud:8,grain:2.5}
};
const wallMaps={};
function wallTextureMaps(id) {
  if(wallMaps[id])return wallMaps[id];
  const finish=wallFinishes[id],size=512;
  const canvases=Array.from({length:3},()=>{const c=document.createElement('canvas');c.width=c.height=size;return c;});
  const contexts=canvases.map(c=>c.getContext('2d')),images=contexts.map(ctx=>ctx.createImageData(size,size));
  let state=9127;
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    state=(Math.imul(state,1664525)+1013904223)>>>0;
    const grain=state/4294967296-.5,u=x/size*Math.PI*2,v=y/size*Math.PI*2;
    // Periodic clouds keep the broad tonal variations seamless; fine grain adds pores.
    const cloud=(Math.sin(u+Math.sin(v))*.5+Math.cos(v*2-u)*.3+Math.sin(u*3+v*2)*.2);
    const brush=id==='plaster'?Math.sin(u*13+v*7+Math.sin(v*3))*.17:0;
    const values=[247+(cloud+brush)*finish.cloud+grain*finish.grain,128+cloud*9+brush*35+grain*45,244+cloud*6+grain*12];
    const p=(y*size+x)*4;
    for(let i=0;i<3;i++){const n=Math.max(0,Math.min(255,values[i]));images[i].data[p]=images[i].data[p+1]=images[i].data[p+2]=n;images[i].data[p+3]=255;}
  }
  const textures=canvases.map((c,i)=>{contexts[i].putImageData(images[i],0,0);const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=8;if(i===0)t.colorSpace=THREE.SRGBColorSpace;return t;});
  return wallMaps[id]={map:textures[0],bumpMap:textures[1],roughnessMap:textures[2]};
}
function setWallFinish(id='paint') {
  if(!wallFinishes[id])id='paint';
  const finish=wallFinishes[id],wall=materials.wall;
  wall.color.set(finish.color);Object.assign(wall,wallTextureMaps(id));wall.roughness=finish.roughness;wall.bumpScale=finish.bumpScale;
  wall.userData.finish=id;wall.userData.density=finish.density;
  if(wall.userData.shader)wall.userData.shader.uniforms.wallDensity.value=finish.density;
  wall.needsUpdate=true;
  return finish.name;
}
function initMaterials() {
  const wood=texture('wood'),tile=texture('tile'),fabric=texture('fabric'),stone=texture('stone');
  const mat=(name,color,roughness=.7,extra={})=> materials[name]=new THREE.MeshStandardMaterial({color,roughness,...extra});
  mat('wall','#eee9df',.98);
  // Project textures in metres so long walls, lintels and cut walls keep one grain size.
  const configureWallUV=surface=>{surface.onBeforeCompile=shader=>{
    shader.uniforms.wallDensity={value:surface.userData.density};
    shader.vertexShader='uniform float wallDensity;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <worldpos_vertex>',`#include <worldpos_vertex>
      vec3 wallPosition=(modelMatrix*vec4(transformed,1.0)).xyz;
      vec3 wallNormal=abs(normalize(mat3(modelMatrix)*objectNormal));
      vec2 wallUV=wallNormal.x>0.5?wallPosition.zy:(wallNormal.z>0.5?wallPosition.xy:wallPosition.xz);
      vMapUv=wallUV*wallDensity;
      vBumpMapUv=wallUV*wallDensity;
      vRoughnessMapUv=wallUV*wallDensity;
    `);
    surface.userData.shader=shader;
  };surface.customProgramCacheKey=()=> 'wall-world-uv-v1';};
  configureWallUV(materials.wall);
  setWallFinish('paint');
  mat('studyWall','#c6c4bd',.98,{...wallTextureMaps('paint'),bumpScale:.0013});materials.studyWall.userData.density=1.6;configureWallUV(materials.studyWall);
  mat('masterWall','#dfd4c1',.98,{...wallTextureMaps('paint'),bumpScale:.0017});materials.masterWall.userData.density=1.6;configureWallUV(materials.masterWall);
  mat('trim','#faf7ef',.75);mat('wood','#e9cfa6',.64,{map:wood});mat('darkwood','#8c7055',.6,{map:wood});
  mat('floor','#ede5d5',.62,{map:stone});mat('woodfloor','#e5d0ae',.75,{map:wood});mat('tile','#d6d8d2',.6,{map:tile});
  mat('white','#eeece4',.48);mat('stone','#efede5',.35,{map:stone});mat('sage','#859489',.85,{map:fabric});
  mat('fabric','#e7dfcf',.93,{map:fabric});mat('blue','#95a9b1',.93,{map:fabric});mat('linen','#c8b7a0',.9,{map:fabric});
  mat('rug','#c7bca7',1,{map:fabric});mat('metal','#82796c',.3,{metalness:.65});mat('black','#252c2a',.42,{metalness:.3});
  mat('glass','#b4d0ce',.08,{transparent:true,opacity:.18,metalness:.15,depthWrite:false,side:THREE.DoubleSide});
  mat('mirror','#b5c9cd',.08,{metalness:.85});mat('screen','#142220',.24,{metalness:.3});mat('leaf','#668168',.9);mat('leaf2','#8d9c73',.95);
  mat('display','#577979',.35,{emissive:'#83aaa4',emissiveIntensity:.23});
  mat('soil','#3d382d',1);mat('pot','#c5b79d',.86);mat('gold','#b59860',.32,{metalness:.6});mat('book','#d4b399');mat('book2','#839b91');mat('book3','#dfdcd1');
  mat('lamp','#faf0d8',.6,{emissive:'#fff0c7',emissiveIntensity:.3});mat('curtain','#f3ede0',1,{transparent:true,opacity:.83,side:THREE.DoubleSide});
  mat('shadow','#433c2b',1,{transparent:true,opacity:.10,depthWrite:false});mat('foundation','#d0c5b3',.9);
  initStudyMaterials(materials);
  initMasterMaterials(materials);
  initBathroomMaterials(materials);
  initEntryMaterials(materials);
  initKitchenDiningMaterials(materials);
}
const geoBox=new THREE.BoxGeometry(1,1,1);
const geoRound=new RoundedBoxGeometry(1,1,1,3,.10);
const geoSphere=new THREE.SphereGeometry(1,12,8);
function box(parent,x,y,z,w,h,d,mat='wood',rounded=false) {
  const mesh=new THREE.Mesh(rounded?geoRound:geoBox,materials[mat]);mesh.position.set(x,y,z);mesh.scale.set(w,h,d);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
}
function ball(parent,x,y,z,w,h,d,mat='leaf') {
  const mesh=new THREE.Mesh(geoSphere,materials[mat]);mesh.position.set(x,y,z);mesh.scale.set(w,h,d);mesh.castShadow=true;parent.add(mesh);return mesh;
}
function cyl(parent,x,y,z,r1,r2,h,mat='metal',n=16) {
  const mesh=new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,h,n),materials[mat]);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
}
function rod(parent,a,b,r=.012,mat='metal') {
  const aa=new THREE.Vector3(...a),bb=new THREE.Vector3(...b),delta=bb.clone().sub(aa);
  const m=cyl(parent,...aa.clone().add(bb).multiplyScalar(.5).toArray(),r,r,delta.length(),mat,8);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());return m;
}
function torus(parent,x,y,z,r,t,mat='metal',rotation=[Math.PI/2,0,0]) {
  const mesh=new THREE.Mesh(new THREE.TorusGeometry(r,t,6,24),materials[mat]);mesh.position.set(x,y,z);mesh.rotation.set(...rotation);parent.add(mesh);return mesh;
}
function floorMesh(poly,mat,y=0,depth=.035) {
  const shape=new THREE.Shape(poly.map(p=>new THREE.Vector2(X(p[0]),-Z(p[1]))));
  const geo=new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:false});geo.rotateX(-Math.PI/2);
  const mesh=new THREE.Mesh(geo,materials[mat]);mesh.position.y=y;mesh.receiveShadow=true;return mesh;
}
// Batch the stationary details of each modeled object by material, retaining its identity.
function batch(group,meta) {
  group.updateMatrixWorld(true);
  const inverse=group.matrixWorld.clone().invert(),buckets=new Map(),remove=[];
  group.traverse(m=>{if(!m.isMesh||m.userData.dynamic)return;const g=m.geometry.index?m.geometry.toNonIndexed():m.geometry.clone();g.applyMatrix4(inverse.clone().multiply(m.matrixWorld));
    // All primitives have position, normal and UV attributes.
    for(const key of Object.keys(g.attributes))if(!['position','normal','uv'].includes(key))g.deleteAttribute(key);
    const bucket=buckets.get(m.material)||[];bucket.push(g);buckets.set(m.material,bucket);remove.push(m);
  });
  remove.forEach(m=>m.parent.remove(m));
  for(const [material,geometries] of buckets){const geo=mergeGeometries(geometries,false);geometries.forEach(g=>g.dispose());if(!geo)continue;const m=new THREE.Mesh(geo,material);m.castShadow=!material.transparent;m.receiveShadow=true;m.userData={...meta};group.add(m);}
}
function legs(g,w,d,h=.38,mat='darkwood') {for(const x of [-w/2+.08,w/2-.08])for(const z of [-d/2+.08,d/2-.08])box(g,x,h/2,z,.045,h,.045,mat);}
function lamp(g,x,y,z) {cyl(g,x,y+.025,z,.105,.11,.05,'metal');rod(g,[x,y,z],[x,y+.32,z],.016,'gold');cyl(g,x,y+.38,z,.16,.19,.20,'lamp');cyl(g,x,y+.49,z,.16,.16,.008,'trim');}
function bookStack(g,x,y,z,count=3) {for(let i=0;i<count;i++){const b=box(g,x+(i%2)*.01,y+i*.035,z,.25,.035,.18,['book','book2','book3'][i%3],true);b.rotation.y=(i%2)*.08;}}
function vase(g,x,y,z) {cyl(g,x,y+.12,z,.045,.09,.24,'pot');for(let i=0;i<4;i++)rod(g,[x,y+.15,z],[x+Math.sin(i*2)*.11,y+.50+random()*.15,z+Math.cos(i*2)*.1],.005,'leaf');}
function chair(g,x,z,rot=0,mat='sage',scale=1) {
  const c=new THREE.Group();c.position.set(x,0,z);c.rotation.y=rot;c.scale.setScalar(scale);g.add(c);
  legs(c,.48,.46,.44);box(c,0,.46,0,.5,.1,.48,mat,true);box(c,0,.73,.22,.5,.52,.075,mat,true);
}
function cushion(g,x,y,z,w,d,mat='fabric',rot=0) {const m=box(g,x,y,z,w,.13,d,mat,true);m.rotation.y=rot;return m;}
function sofa(g,w,d,mat='fabric') {
  // The canonical sofa faces +Z; long dimension always lies along local X.
  legs(g,w,d,.12);box(g,0,.28,0,w,.34,d,mat,true);box(g,0,.63,-d/2+.1,w,.59,.20,mat,true);
  box(g,-w/2+.12,.49,0,.25,.52,d+.04,mat,true);box(g,w/2-.12,.49,0,.25,.52,d+.04,mat,true);
  const count=w>1.6?3:2,usable=w-.52;
  for(let i=0;i<count;i++){const xx=-usable/2+usable/count*(i+.5);cushion(g,xx,.49,.06,usable/count-.025,d-.21,mat);box(g,xx,.72,-d/2+.16,usable/count-.025,.39,.16,mat,true);}
  for(const x of [-w/2+.34,w/2-.34]){const p=box(g,x,.66,-.03,.31,.33,.13,'sage',true);p.rotation.z=x>0?-.17:.17;p.rotation.x=-.15;}
}
function bed(g,w,d,mat='linen',single=false) {
  box(g,0,.22,0,w,.35,d,'wood',true);legs(g,w,d,.09);box(g,0,.49,.02,w-.05,.26,d-.03,'fabric',true);
  box(g,0,.73,-d/2+.025,w+.04,1.12,.1,'linen',true);
  const quilt=box(g,0,.64,d*.17,w-.01,.13,d*.65,mat,true);
  box(g,0,.715,-d*.14,w-.01,.055,.21,mat,true);
  const pillowWidth=single?Math.min(.65,w*.65):w*.43;
  for(const x of single?[0]:[-w*.24,w*.24]){cushion(g,x,.68,-d*.31,pillowWidth,.38,'fabric');box(g,x,.75,-d*.37,pillowWidth-.02,.07,.29,'white',true);}
  const throwM=box(g,0,.725,d*.32,w+.025,.045,.37,'sage',true);
  // Soft folds represented as narrow rounded raised strips.
  for(let i=0;i<10;i++)box(g,-w/2+.1+i*(w-.2)/9,.737,d*.32,.026,.015,.36,'sage',true);
  return [quilt,throwM];
}
function plant(g,w,d) {
  const s=Math.min(w,d);cyl(g,0,.19,0,s*.23,s*.17,.38,'pot');cyl(g,0,.375,0,s*.20,s*.20,.012,'soil');
  for(let i=0;i<13;i++){const a=i*2.4,r=s*(.1+random()*.42),h=.55+random()*.6;rod(g,[0,.35,0],[Math.cos(a)*r,h,Math.sin(a)*r],.009,'leaf');
    const leaf=ball(g,Math.cos(a)*r,h,Math.sin(a)*r,.08,.19,.055,i%3?'leaf':'leaf2');leaf.rotation.set(.6*Math.sin(a),a,.6*Math.cos(a));}
}
function table(g,w,d,h=.4) {legs(g,w-.09,d-.09,h-.04);box(g,0,h,0,w,.07,d,'wood',true);box(g,0,h+.045,0,w-.1,.012,d-.1,'stone',true);}
function desk(g,w,d,work=false) {
  const dd=work?d*.53:d*.44,zz=-d/2+dd/2;
  box(g,0,.76,zz,w,.06,dd,'wood',true);box(g,w/2-.19,.38,zz,.34,.74,dd-.06,'white');
  for(let i=0;i<3;i++){box(g,w/2-.185,.18+i*.23,zz+dd/2+.002,.31,.21,.015,'white');box(g,w/2-.185,.22+i*.23,zz+dd/2+.015,.1,.012,.018,'metal');}
  for(const x of [-w/2+.04,w/2-.38])box(g,x,.38,zz-dd/2+.045,.045,.74,.045,'darkwood');
  chair(g,0,d*.18,Math.PI,'sage',.9);
  const l=new THREE.Group();l.position.set(-.08,.81,zz);g.add(l);box(l,0,.014,0,.38,.024,.27,'black',true);const screen=box(l,0,.135,-.12,.38,.24,.012,'black',true);screen.rotation.x=-.18;box(l,0,.135,-.108,.34,.20,.005,'screen');
  bookStack(g,-w/2+.18,.81,zz+.04,3);lamp(g,w/2-.15,.81,zz-.09);
}
function computerDesk(g,w,d) {
  // South-facing workstation: desk against the wall, chair in the room.
  const dd=.62,zz=d/2-dd/2;
  box(g,0,.76,zz,w,.065,dd,'wood',true);
  box(g,-w/2+.20,.375,zz,.36,.73,dd-.06,'white',true);
  for(let i=0;i<3;i++){
    box(g,-w/2+.20,.15+i*.23,zz-dd/2+.025,.33,.21,.022,'white');
    box(g,-w/2+.20,.20+i*.23,zz-dd/2+.007,.12,.014,.025,'metal');
  }
  for(const z of [zz-dd/2+.04,zz+dd/2-.04])box(g,w/2-.05,.375,z,.05,.73,.05,'metal');
  box(g,0,.60,zz+dd/2-.065,w-.1,.06,.04,'metal');
  box(g,-.08,.799,zz-.055,.99,.005,.43,'linen',true);

  // Monitor, pedestal and a softly lit desktop interface facing the chair.
  const mx=-.10,mz=zz+.12;
  box(g,mx,.812,mz-.02,.28,.024,.17,'black',true);
  cyl(g,mx,.91,mz,.025,.033,.19,'metal');
  box(g,mx,1.14,mz,.71,.42,.045,'black',true);
  box(g,mx,1.14,mz-.025,.665,.372,.007,'display');
  box(g,mx-.245,1.15,mz-.030,.12,.315,.003,'screen');
  box(g,mx+.065,1.22,mz-.030,.42,.07,.003,'sage');
  for(let i=0;i<4;i++)box(g,mx+.045,1.13-i*.033,mz-.030,.34-i*.035,.009,.004,'white');
  cyl(g,mx+.30,.947,mz-.026,.004,.004,.005,'lamp');

  // Separate keyboard keys, space bar, mouse and mouse pad.
  const kz=zz-.19;
  box(g,-.13,.817,kz,.45,.024,.155,'black',true);
  for(let row=0;row<4;row++)for(let col=0;col<13;col++)box(g,-.323+col*.032,.833,kz-.055+row*.031,.025,.011,.021,'white',true);
  box(g,-.13,.838,kz+.048,.17,.012,.018,'white',true);
  box(g,.27,.808,kz,.21,.009,.22,'sage',true);
  ball(g,.27,.834,kz,.043,.026,.068,'black');
  box(g,.27,.858,kz-.018,.006,.008,.023,'metal',true);

  // Desktop tower under the right side; front ventilation and power control.
  const tx=w/2-.24,tz=zz-.015;
  box(g,tx,.31,tz,.28,.58,.45,'black',true);
  box(g,tx,.31,tz-.227,.24,.52,.012,'metal',true);
  for(const y of [.19,.38]){
    torus(g,tx,y,tz-.237,.071,.007,'black',[0,0,0]);
    for(let i=0;i<6;i++)box(g,tx-.059+i*.023,y,tz-.241,.006,.11,.004,'black');
  }
  box(g,tx-.075,.542,tz-.237,.026,.014,.006,'lamp',true);
  for(const x of [tx-.055,tx+.025])box(g,x,.513,tz-.237,.03,.009,.006,'black');
  rod(g,[mx,.81,mz+.027],[mx,.64,mz+.06],.008,'black');
  rod(g,[mx,.64,mz+.06],[tx,.64,tz+.12],.008,'black');
  lamp(g,-w/2+.20,.80,zz+.04);

  // Office chair with upholstered back, armrests and a five-caster base.
  const c=new THREE.Group();c.position.z=-d/2+.27;g.add(c);
  cyl(c,0,.27,0,.032,.045,.34,'metal');
  for(let i=0;i<5;i++){
    const a=i*Math.PI*2/5,x=Math.sin(a)*.30,z=Math.cos(a)*.30;
    rod(c,[0,.14,0],[x,.08,z],.022,'metal');
    ball(c,x,.047,z,.035,.042,.048,'black');
  }
  box(c,0,.47,0,.51,.12,.49,'sage',true);
  box(c,0,.76,-.225,.49,.53,.085,'sage',true);
  box(c,0,1.01,-.233,.30,.13,.10,'sage',true);
  for(const x of [-.285,.285]){
    rod(c,[x,.40,-.11],[x,.65,-.11],.018,'metal');
    box(c,x,.66,-.005,.055,.045,.34,'black',true);
  }
}
function cabinet(g,w,d,h=.81,mat='white',glass=false) {
  box(g,0,h/2,0,w,h,d,'wood');const n=Math.max(2,Math.round(w/.48));
  for(let i=0;i<n;i++){const x=-w/2+w/n*(i+.5);box(g,x,h*.51,d/2+.008,w/n-.018,h-.04,.022,glass?'glass':mat);box(g,x+(i%2?-.055:.055),h*.6,d/2+.025,.012,.1,.018,'metal');}
  box(g,0,h+.028,0,w+.025,.045,d+.025,'stone');
}
function wardrobe(g,w,d) {
  // Blueprint puts the wardrobe along X-normal side of the bedroom.
  const h=2.35;box(g,-w/2+.025,h/2,0,.05,h,d,'wood');box(g,0,.06,0,w,.12,d,'wood');box(g,0,h-.025,0,w,.05,d,'wood');
  const n=3;for(let i=0;i<n;i++){const z=-d/2+d/n*(i+.5);box(g,w/2,h/2,z,.036,h-.04,d/n-.025,'linen');rod(g,[w/2+.02,.9,z],[w/2+.02,1.15,z],.008,'gold');}
}
function closet(g,w,d) {
  const depth=.43,h=2.35;
  box(g,-w/2+.02,h/2,0,.04,h,d,'masterCabinet');
  for(const yy of [.08,.64,1.28,1.92,2.33])box(g,-w/2+depth/2,yy,0,depth,.035,d,'masterCabinet');
  for(let i=0;i<4;i++)box(g,-w/2+depth/2,h/2,-d/2+i*d/3,depth,h,.03,'masterCabinet');
  for(let side of [-1,1]){const z=side*(d/2-depth/2);box(g,depth/2,h/2,side*(d/2-.015),w-depth,h,.03,'masterCabinet');
    for(const yy of [.08,.6,1.94,2.33])box(g,depth/2,yy,z,w-depth,.035,depth,'masterCabinet');
    for(const xx of [-w/2+depth,w/2])box(g,xx,h/2,z,.035,h,depth,'masterCabinet');
    rod(g,[-w/2+depth+.06,1.68,z],[w/2-.06,1.68,z],.017,'metal');
    for(let j=0;j<8;j++){const xx=-w/2+depth+.12+j*(w-depth-.24)/7;const shirt=box(g,xx,1.25,z,.08,.65,.24,['fabric','blue','sage','linen'][j%4],true);rod(g,[xx,1.67,z],[xx-.09,1.53,z],.008,'metal');rod(g,[xx,1.67,z],[xx+.09,1.53,z],.008,'metal');shirt.rotation.z=(j%2)*.06;}
    for(let j=0;j<3;j++)box(g,-w/2+depth+.22+j*.32,2.13,z,.25,.28,.3,['book3','linen'][j%2],true);
  }
  for(let i=0;i<6;i++){const z=-d/2+.2+i*(d-.4)/5;box(g,-w/2+depth-.006,1.25,z,.025,.036,.3,'masterCabinet');box(g,-w/2+depth-.005,.56,z,.025,.036,.3,'masterCabinet');bookStack(g,-w/2+depth/2,1.28,z,4);}
}
function bookcase(g,w,d) {
  const h=2.3;box(g,0,h/2,-d/2,w,h,.035,'wood');box(g,0,.055,0,w,.11,d,'wood');
  const n=7;for(let i=0;i<=n;i++)box(g,-w/2+w/n*i,h/2,0,.035,h,d,'wood');
  for(let j=0;j<5;j++)box(g,0,.12+j*.54,0,w,.035,d,'wood');
  for(let i=0;i<n;i++){box(g,-w/2+w/n*(i+.5),.3,d/2+.01,w/n-.022,.48,.025,'sage');
    for(let shelf=1;shelf<4;shelf++)for(let k=0;k<6;k++){const x=-w/2+w/n*i+.07+k*.065;const book=box(g,x,.12+shelf*.54+.16,0,.045,.22+random()*.13,d*.8,['book','book2','book3'][Math.floor(random()*3)]);book.rotation.z=k===5?-.14:0;}
  }
}
function faucet(g,x,y,z) {rod(g,[x,y,z],[x,y+.26,z],.018,'metal');rod(g,[x,y+.26,z],[x,y+.26,z+.15],.018,'metal');rod(g,[x,y+.26,z+.15],[x,y+.2,z+.15],.018,'metal');}
function basin(g,x,y,z,w=.42,d=.32) {
  // Nested surfaces create a visible recessed bowl, rim, and waste outlet.
  box(g,x,y,z,w,.045,d,'white',true);box(g,x,y+.024,z,w*.78,.012,d*.7,'metal',true);box(g,x,y+.031,z,w*.65,.012,d*.55,'white',true);cyl(g,x,y+.044,z,.025,.025,.008,'metal');faucet(g,x,y,z-d*.38);
}
function kitchen(g,w,d) {
  const dep=.56;
  cabinet(g,w,dep,.86,'white');g.children.forEach(c=>c.position.z-=d/2-dep/2);
  const left=new THREE.Group();left.position.set(-w/2+dep/2,0,dep/2);left.rotation.y=Math.PI/2;g.add(left);cabinet(left,d-dep,dep,.86,'sage');
  const right=new THREE.Group();right.position.set(w/2-dep/2,0,dep/2);right.rotation.y=-Math.PI/2;g.add(right);cabinet(right,d-dep,dep,.86,'white');
  // Countertop appliances and oven.
  const cookz=-d/2+dep/2;box(g,0,.896,cookz,.66,.012,.45,'black',true);
  for(const x of [-.19,.19])for(const z of [-.12,.12]){torus(g,x,.911,cookz+z,.074,.012,'metal');cyl(g,x,.91,cookz+z,.04,.04,.022,'black');for(let a=0;a<4;a++){const m=box(g,x+Math.sin(a*Math.PI/2)*.077,.93,cookz+z+Math.cos(a*Math.PI/2)*.077,.07,.015,.014,'black');m.rotation.y=-a*Math.PI/2;}}
  box(g,0,.48,cookz+dep/2+.027,.61,.47,.027,'black',true);box(g,0,.49,cookz+dep/2+.045,.5,.32,.008,'screen');box(g,0,.66,cookz+dep/2+.06,.49,.023,.025,'metal');
  box(g,0,1.66,cookz,.74,.14,.52,'metal',true);box(g,0,2.09,cookz-.08,.28,.72,.27,'metal');
  for(const x of [-w/2+.47,w/2-.47]){const upper=new THREE.Group();upper.position.set(x,1.5,cookz-.06);g.add(upper);cabinet(upper,.82,.36,.65,'white');}
  const sinkx=-w/2+dep/2;basin(g,sinkx,.90,.12,.42,.33);basin(g,sinkx,.90,.49,.42,.30);
  const fridge=new THREE.Group();fridge.position.set(w/2-.32,0,d/2-.32);g.add(fridge);box(fridge,0,1.03,0,.59,2.04,.6,'white',true);box(fridge,-.31,1.04,0,.024,1.96,.56,'metal');rod(fridge,[-.33,.60,-.15],[-.33,.9,-.15],.015,'black');rod(fridge,[-.33,1.21,-.15],[-.33,1.64,-.15],.015,'black');
  cyl(g,-.82,.96,cookz,.12,.12,.14,'metal');torus(g,-.82,1.04,cookz,.07,.016,'black');box(g,.62,.94,cookz,.2,.075,.28,'wood',true);box(g,.58,.99,cookz,.025,.008,.23,'metal');
}
function laundry(g,w,d,utility=false) {
  if(utility) {
    const north=new THREE.Group();north.position.z=-d/2+.25;g.add(north);cabinet(north,w-.05,.46,.95,'white');
    const south=new THREE.Group();south.position.z=d/2-.25;g.add(south);cabinet(south,w-.03,.48,.78,'white');basin(south,0,.81,0,.49,.35);
    rod(g,[-w/2+.1,2.35,-d/2+.35],[-w/2+.1,2.35,d/2-.35],.018,'metal');
  }else{
    const xx=-w/2+.31;box(g,xx,.44,0,.60,.86,.58,'white',true);const door=cyl(g,xx,.43,d/2+.012,.20,.20,.03,'metal',32);door.rotation.x=Math.PI/2;const glass=cyl(g,xx,.43,d/2+.03,.15,.15,.018,'screen',32);glass.rotation.x=Math.PI/2;
    box(g,xx,.75,d/2+.005,.53,.075,.02,'white');box(g,xx-.09,.75,d/2+.02,.16,.035,.013,'screen');const dial=cyl(g,xx+.14,.75,d/2+.03,.035,.035,.02,'metal');dial.rotation.x=Math.PI/2;
    const sink=new THREE.Group();sink.position.x=w/2-.31;g.add(sink);cabinet(sink,.59,.57,.83,'white');basin(sink,0,.865,0,.49,.42);
  }
}
function bay(g,w,d) {
  box(g,0,.33,0,w,.6,d,'white');box(g,0,.64,0,w,.08,d,'linen',true);
  for(const z of [-d*.24,d*.24]){const p=box(g,0,.78,z,w*.8,.24,.39,'sage',true);p.rotation.z=.1;}
}
function ac(g,w,d) {box(g,0,.5,0,w,.64,d,'white',true);for(let i=0;i<9;i++)box(g,w/2+.004,.28+i*.046,0,.012,.01,d-.08,'metal');torus(g,w/2+.01,.50,0,.18,.018,'black',[0,Math.PI/2,0]);}
function createFurniture(item) {
  const [a,b,c,d]=item.rect,w=M(c-a),depth=M(d-b),g=new THREE.Group();g.position.set(X((a+c)/2),.035,Z((b+d)/2));
  const rot=item.rot||0;
  if(studyTypes.has(item.type))buildStudyFurniture(g,w,depth,item.type,{box,ball,cyl,rod,torus,materials});
  else if(masterTypes.has(item.type))buildMasterFurniture(g,w,depth,item.type,{box,ball,cyl,rod,torus,materials});
  else if(kitchenDiningTypes.has(item.type))buildKitchenDiningFurniture(g,w,depth,item.type,{box,ball,cyl,rod,torus,materials});
  else if(item.type==='sofa') {g.rotation.y=rot;sofa(g,Math.abs(Math.sin(rot))>.5?depth:w,Math.abs(Math.sin(rot))>.5?w:depth);}
  else if(item.type==='armchair') {g.rotation.y=rot;sofa(g,w,depth,'sage');}
  else if(item.type==='bed')bed(g,w,depth,item.color==='blue'?'blue':'linen',item.single);
  else if(item.type==='rug'){box(g,0,.015,0,w,.018,depth,'rug',true);for(let i=0;i<30;i++){const x=-w/2+i*w/29;box(g,x,.018,-depth/2-.025,.018,.014,.07,'linen');box(g,x,.018,depth/2+.025,.018,.014,.07,'linen');}}
  else if(item.type==='coffee'){table(g,w,depth);bookStack(g,-w*.15,.45,0,2);vase(g,w*.20,.45,-depth*.16);}
  else if(item.type==='side'){cabinet(g,w,depth,.5,'wood');lamp(g,0,.55,0);}
  else if(item.type==='plant')plant(g,w,depth);
  else if(item.type==='dining'){const tw=w*.64,td=depth*.5;table(g,tw,td,.76);for(const x of [-tw*.25,tw*.25]){chair(g,x,-td/2-.27,0);chair(g,x,td/2+.27,Math.PI);}chair(g,-tw/2-.27,0,-Math.PI/2);chair(g,tw/2+.27,0,Math.PI/2);vase(g,0,.805,0);for(const x of [-tw*.27,tw*.27])for(const z of [-td*.23,td*.23]){cyl(g,x,.807,z,.115,.115,.012,'white');cyl(g,x+.16,.855,z,.027,.022,.11,'glass');} }
  else if(item.type==='cabinet'){cabinet(g,w,depth);vase(g,-w*.30,.86,0);bookStack(g,w*.32,.86,0,4);}
  else if(item.type==='tv'){cabinet(g,w,depth,.44,'wood');box(g,0,.86,-depth*.25,w*.75,.74,.04,'black',true);box(g,0,.86,-depth*.25+.023,w*.72,.69,.008,'screen');for(const x of [-w*.28,w*.28])rod(g,[x,.53,-depth*.25],[x+.07,.46,depth*.03],.013,'black');}
  else if(item.type==='desk'||item.type==='workdesk')desk(g,w,depth,item.type==='workdesk');
  else if(item.type==='computerdesk')computerDesk(g,w,depth);
  else if(item.type==='closet')closet(g,w,depth);
  else if(item.type==='wardrobe')wardrobe(g,w,depth);
  else if(item.type==='bookcase')bookcase(g,w,depth);
  else if(item.type==='kitchen')kitchen(g,w,depth);
  else if(item.type==='bathroom')buildBathroom(g,w,depth,{box,ball,cyl,rod,torus,materials});
  else if(item.type==='bay')bay(g,w,depth);
  else if(item.type==='laundry')laundry(g,w,depth);
  else if(item.type==='utility')laundry(g,w,depth,true);
  else if(item.type==='ac')ac(g,w,depth);
  batch(g,{furniture:item.name,room:item.room,type:item.type});
  return g;
}
function curtain(root,x,z,width,axis='z',split=true) {
  const g=new THREE.Group();g.position.set(X(x),0,Z(z));if(axis==='z')g.rotation.y=Math.PI/2;root.add(g);
  const w=M(width);rod(g,[-w/2-.04,2.53,0],[w/2+.04,2.53,0],.018,'metal');
  const ends=split?[-1,1]:[1];for(const s of ends)for(let i=0;i<8;i++){const xx=s*w*.43+(i-4)*.025;const m=box(g,xx,1.35,.05+Math.sin(i*1.7)*.025,.045,2.3,.025,'curtain',true);m.castShadow=false;}
  batch(g,{furniture:'落地窗帘'});
}
export function createHome(scene) {
  initMaterials();
  const root=new THREE.Group();scene.add(root);
  const floor=floorMesh(outline,'floor',-.20,.20);root.add(floor);
  for(const room of rooms){const mat=room.id==='bath'?'bathFloor':room.id==='study'?'studyFloor':['master','wardrobe'].includes(room.id)?'masterFloor':['dining','kitchen'].includes(room.id)?'kdFloor':room.id==='utility'?'kdTerra':room.kind==='balcony'||room.kind==='service'?'tile':room.kind==='private'?'woodfloor':'floor';const f=floorMesh(room.poly,mat,.005,.018);f.userData={room:room.id};root.add(f);}
  const wallParts=[],colliders=[],doorObjects=[],tall=new THREE.Group(),ceilings=new THREE.Group();root.add(tall,ceilings);
  const studyPoly=rooms.find(r=>r.id==='study').poly,masterPoly=rooms.find(r=>r.id==='master').poly,bathPoly=rooms.find(r=>r.id==='bath').poly;
  const diningPoly=rooms.find(r=>r.id==='dining').poly,kitchenPoly=rooms.find(r=>r.id==='kitchen').poly;
  const solid=(x,z,w,d,bottom,h,mat='wall')=>{
    const mesh=box(root,X(x),bottom+h/2,Z(z),M(w),h,M(d),mat);
    if(mat==='wall'){
      const faces=Array(6).fill(materials.wall);
      for(const [i,px,pz] of [[0,x+w/2+.3,z],[1,x-w/2-.3,z],[4,x,z+d/2+.3],[5,x,z-d/2-.3]]){if(pointInPoly(px,pz,bathPoly))faces[i]=materials.bathTile;else if(pointInPoly(px,pz,kitchenPoly))faces[i]=materials.kdTile;else if(pointInPoly(px,pz,diningPoly))faces[i]=materials.kdWall;else if(pointInPoly(px,pz,studyPoly))faces[i]=materials.studyWall;else if(pointInPoly(px,pz,masterPoly))faces[i]=i===4&&pz<327?materials.masterWallpaper:materials.masterWall;}
      mesh.material=faces;
    }
    wallParts.push({mesh,bottom,h});return mesh;
  };
  // Split balcony walls around their continuous glazing instead of covering windows.
  for(const [x1,z1,x2,z2,t] of walls){const vertical=x1===x2,len=vertical?z2-z1:x2-x1,axis=vertical?'z':'x';
    const win=windows.find(w=>w.axis===axis&&(vertical?Math.abs(w.x-x1)<1:Math.abs(w.z-z1)<1)&&w.style==='balcony') ||
      (vertical && [225,1105].includes(x1) ? windows.find(w=>w.style==='bay'&&(x1===225?w.x===265:w.x===1065)) : null);
    if(win){const mid=vertical?(z1+z2)/2:(x1+x2)/2;solid((x1+x2)/2,(z1+z2)/2,vertical?t:len,vertical?len:t,0,win.sill);solid((x1+x2)/2,mid,vertical?t:len,vertical?len:t,win.sill+win.h,HEIGHT-win.sill-win.h);colliders.push({x:X((x1+x2)/2),z:Z((z1+z2)/2),w:M(vertical?t:len),d:M(vertical?len:t)});}
    else {solid((x1+x2)/2,(z1+z2)/2,vertical?t:len,vertical?len:t,0,HEIGHT);colliders.push({x:X((x1+x2)/2),z:Z((z1+z2)/2),w:M(vertical?t:len),d:M(vertical?len:t)});}
    // Thin skirting on both sides of every wall.
    for(const s of [-1,1]){const sx=(x1+x2)/2+(vertical?s*(t/2+1):0),sz=(z1+z2)/2+(vertical?0:s*(t/2+1));box(root,X(sx),.05,Z(sz),M(vertical?2:len),.10,M(vertical?len:2),'trim');}
  }
  // Each dark skirting segment stays on a study-facing wall surface.
  for(const [a,b,c,d] of [[273,393,511,393],[279,393,279,434],[279,554,279,599],[279,599,583,599],[511,393,511,525],[519,534,583,534]]){const vertical=a===c;box(root,X((a+c)/2),.05,Z((b+d)/2),M(vertical?2:c-a),.10,M(vertical?d-b:2),'studyWood');}
  for(const win of windows){if(win.style==='bath'){solid(win.x,win.z,win.w,24,0,win.sill);solid(win.x,win.z,win.w,24,win.sill+win.h,HEIGHT-win.sill-win.h);colliders.push({x:X(win.x),z:Z(win.z),w:M(win.w),d:M(24)});continue;}const g=new THREE.Group();const glassX=win.style==='bay'?(win.x===265?225:1105):win.x;g.position.set(X(glassX),0,Z(win.z));if(win.axis==='z')g.rotation.y=Math.PI/2;root.add(g);const w=M(win.w),h=win.h,y=win.sill+h/2;
    if(win.style==='kitchen')createKitchenWindow(g,win,{box,ball,cyl,rod,torus,materials});
    else{box(g,0,y,0,w,h,.018,'glass');for(const x of [-w/2,w/2])box(g,x,y,0,.045,h,.045,'trim');for(const yy of [win.sill,win.sill+h])box(g,0,yy,0,w,.045,.05,'trim');const n=win.style==='balcony'?4:3;for(let i=1;i<n;i++)box(g,-w/2+i*w/n,y,0,.032,h,.045,'trim');box(g,0,win.sill+.03,0,w+.07,.06,.28,'stone');}
    batch(g,{furniture:win.style==='bay'?'飘窗玻璃':'窗户'});tall.add(g);
    if(win.style!=='balcony'){solid(win.x,win.z,win.axis==='z'?16:win.w,win.axis==='z'?win.w:16,0,win.sill);solid(win.x,win.z,win.axis==='z'?16:win.w,win.axis==='z'?win.w:16,win.sill+h,HEIGHT-win.sill-h);colliders.push({x:X(win.x),z:Z(win.z),w:M(win.axis==='z'?16:win.w),d:M(win.axis==='z'?win.w:16)});}
  }
  for(const d of doors){const g=new THREE.Group();g.position.set(X(d.x),0,Z(d.z));if(d.axis==='z')g.rotation.y=Math.PI/2;root.add(g);const w=M(d.w),h=2.15;
    const whiteDoor=['study','bath'].includes(d.id),doorMat=d.id==='entry'?'entryWood':d.id==='bath'?'bathWhite':whiteDoor?'studyWhite':'wood',handleMat=d.id==='bath'?'bathChrome':whiteDoor?'black':'metal';
    for(const xx of [-w/2,w/2])box(g,xx,h/2,0,.055,h,.13,doorMat);box(g,0,h+.025,0,w+.05,.055,.13,doorMat);
    solid(d.x,d.z,d.axis==='z'?12:d.w,d.axis==='z'?d.w:12,h+.05,HEIGHT-h-.05);
    const pivot=new THREE.Group();pivot.position.x=d.hinge*w/2;g.add(pivot);const leaf=box(pivot,-d.hinge*w/2,h/2,0,w-.06,h-.03,.043,doorMat);
    if(d.id!=='entry')for(const sign of [-1,1]){box(pivot,-d.hinge*(w-.14),.98,sign*.04,.025,.12,.018,handleMat);rod(pivot,[-d.hinge*(w-.14),1.01,sign*.05],[-d.hinge*(w-.22),1.01,sign*.05],.012,handleMat);if(whiteDoor&&d.id!=='bath')for(let j=1;j<6;j++)box(pivot,-d.hinge*w/2,j*.34,sign*.023,w-.105,.004,.003,'studyFrame');}
    if(d.id==='entry')addEntryDoorDetails(pivot,d,w,{box,ball,cyl,rod,torus,materials});
    if(d.id==='bath'){leaf.material=materials.bathFrosted;addBathroomDoorDetails(pivot,d,w,{box,ball,cyl,rod,torus,materials});}
    pivot.rotation.y=d.angle;
    if(d.foldOffset){const fold=Math.abs(Math.sin(d.angle));pivot.position.x+=M(d.foldOffset[0])*fold;pivot.position.z=M(d.foldOffset[1])*fold;}
    leaf.userData={door:d.id,furniture:d.name};doorObjects.push({data:d,group:g,pivot,leaf,open:true,target:d.angle});
  }
  doorObjects.push(createCabinetEntry(root,{box,ball,cyl,rod,torus,materials}));
  doorObjects.push(...createRoomSlides(root,{box,ball,cyl,rod,torus,materials}));
  for(const z of [338,446])colliders.push({x:X(798),z:Z(z),w:.10,d:M(44)});
  for(const p of passages){if([789,537,438].includes(p.x))continue;const w=M(p.w),g=new THREE.Group();g.position.set(X(p.x),0,Z(p.z));if(p.axis==='z')g.rotation.y=Math.PI/2;root.add(g);
    for(const xx of [-w/2,w/2])box(g,xx,1.2,0,.04,2.4,.055,'trim');
    if(p.x===1067||p.x===1005||p.x===438){const sliding=new THREE.Group();g.add(sliding);for(const xx of [-w*.43,w*.43]){box(sliding,xx,1.18,0,w*.14,2.3,.022,'glass');for(const edge of [-1,1])box(sliding,xx+edge*w*.07,1.18,0,.023,2.3,.025,'trim');}tall.add(sliding);sliding.position.copy(g.position);sliding.rotation.copy(g.rotation);}
  }
  const furnitureGroups=[];
  for(const item of furnishings){const g=createFurniture(item);(['studyac','masterac'].includes(item.type)?tall:root).add(g);furnitureGroups.push(g);}
  curtain(tall,1056,879,142,'z');curtain(tall,1135,654,190,'z',false);curtain(tall,1162,883,204,'z',false);
  addStudyDetails(tall,ceilings,{box,ball,cyl,rod,torus,materials});
  addMasterDetails(tall,ceilings,{box,ball,cyl,rod,torus,materials});
  addBathroomDetails(tall,ceilings,{box,ball,cyl,rod,torus,materials});
  addKitchenDiningDetails(tall,ceilings,{box,ball,cyl,rod,torus,materials});
  // Pendant fixtures and a ceiling per room are restored only in first-person mode.
  for(const r of rooms){const ceiling=floorMesh(r.poly,'trim',HEIGHT+.02,.03);ceilings.add(ceiling);if(['study','master','bath','dining','kitchen'].includes(r.id))continue;const p=r.label;
    const fixture=new THREE.Group();fixture.position.set(X(p[0]),0,Z(p[1]));ceilings.add(fixture);cyl(fixture,0,HEIGHT-.025,0,.12,.12,.05,'white');rod(fixture,[0,HEIGHT,0],[0,2.38,0],.009,'black');
    if(r.id==='dining'){fixture.position.set(X(550),0,Z(826));for(const x of [-.4,0,.4]){rod(fixture,[x,2.7,0],[x,2.21,0],.01,'metal');cyl(fixture,x,2.15,0,.09,.19,.16,'lamp');}}
    else cyl(fixture,0,2.37,0,r.kind==='balcony'?.15:.28,r.kind==='balcony'?.15:.30,.11,'lamp');
    batch(fixture,{furniture:'灯具',room:r.id});
  }
  ceilings.add(floorMesh(outline,'trim',HEIGHT+.04,.04));
  ceilings.visible=false;
  // Decorative framed art, with a geometric original print.
  function art(x,z,rot,w=.8,h=.65){const g=new THREE.Group();g.position.set(X(x),1.75,Z(z));g.rotation.y=rot;root.add(g);box(g,0,0,0,w,h,.03,'darkwood');box(g,0,0,.025,w-.05,h-.05,.008,'fabric');cyl(g,-w*.16,.05,.037,w*.14,w*.14,.009,'sage').rotation.x=Math.PI/2;box(g,w*.14,-h*.12,.036,w*.25,h*.48,.009,'linen');batch(g,{furniture:'装饰画'});tall.add(g);}
  art(910,749,0);art(521,460,Math.PI/2,.58,.75);art(892,735,Math.PI,.8,.5);
  const referenceArtwork=createReferenceArtwork();referenceArtwork.position.set(X(690),1.57,Z(479)+.025);tall.add(referenceArtwork);
  // Furniture collisions use individual walkable spaces for composite installations.
  const obstacles=[];
  const addObstacle=(a,b,c,d)=>obstacles.push({x:X((a+c)/2),z:Z((b+d)/2),w:M(c-a),d:M(d-b)});
  for(const f of furnishings){const [a,b,c,d]=f.rect;if(['rug','ac','studyac','masterac'].includes(f.type))continue;
    if(f.type==='kitchen'){addObstacle(a,b,c,b+37);addObstacle(a,b,a+37,d);addObstacle(c-37,b,c,d);}
    else if(f.type==='closet'){addObstacle(a,b,a+29,d);addObstacle(a,b,c,b+29);addObstacle(a,d-29,c,d);}
    else if(f.type==='bathroom'){addObstacle(a,b,a+58,b+66);addObstacle(c-44,b,c-9,b+58);addObstacle(a,d-59,a+33,d);}
    else if(f.type==='utility'){addObstacle(a,b,c,b+33);addObstacle(a,d-35,c,d);}
    else if(f.type==='desk'||f.type==='workdesk'){addObstacle(a,b,c,b+(d-b)*.47);addObstacle((a+c)/2-14,b+(d-b)*.5,(a+c)/2+14,d-5);}
    else if(f.type==='computerdesk'){addObstacle(a,d-.62/M(1),c,d);addObstacle((a+c)/2-.32/M(1),b,(a+c)/2+.32/M(1),b+.58/M(1));}
    else if(f.type==='studydesk'){addObstacle(a,d-.62/M(1),a+2.10/M(1),d);addObstacle(a+2.10/M(1),d-.42/M(1),c,d);addObstacle(a+53,b+1,a+81,b+29);addObstacle(a+126,d-30,a+164,d);addObstacle(a,b+16,a+22,b+39);}
    else if(f.type==='studyaccessories'){addObstacle(c-24,b+6,c,d);addObstacle(a,b,a+16,d-3);}
    else if(f.type==='dining')addObstacle(a+18,b+9,c-18,d-9);
    else addObstacle(a,b,c,d);
  }
  function setWallHeight(height,walking=false) {
    for(const {mesh,bottom,h} of wallParts){const shown=Math.max(0,Math.min(h,height-bottom));mesh.visible=shown>0;mesh.scale.y=shown;mesh.position.y=bottom+shown/2;}
    for(const d of doorObjects){d.group.scale.y=Math.min(1,height/(d.data.style==='cabinetSlide'?2.62:d.data.height||2.2));}
    tall.visible=height>1.4;ceilings.visible=walking;
  }
  setWallHeight(.88);
  return {root,materials,colliders,obstacles,doorObjects,setWallHeight,setWallFinish,ceilings,tall,furnitureGroups,
    toggleDoor(id){const d=doorObjects.find(x=>x.data.id===id);if(!d)return;d.open=!d.open;d.target=d.open?(['cabinetSlide','roomSlide'].includes(d.data.style)?1:d.data.angle):0;return d.open;},
    update(dt){doorObjects.forEach(d=>{if(d.data.style==='cabinetSlide'){d.progress=THREE.MathUtils.damp(d.progress,d.target,8,dt);for(const leaf of d.leaves)leaf.position.z=leaf.userData.closedZ+leaf.userData.sign*M(d.data.travel)*d.progress;return;}if(d.data.style==='roomSlide'){d.progress=THREE.MathUtils.damp(d.progress,d.target,8,dt);for(const leaf of d.leaves)if(leaf.userData.movable)leaf.position.x=leaf.userData.closedX-M(d.data.w)/2*d.progress;return;}d.pivot.rotation.y=THREE.MathUtils.damp(d.pivot.rotation.y,d.target,8,dt);if(d.data.foldOffset){const fold=Math.abs(Math.sin(d.pivot.rotation.y));d.pivot.position.x=d.data.hinge*M(d.data.w)/2+M(d.data.foldOffset[0])*fold;d.pivot.position.z=M(d.data.foldOffset[1])*fold;}});}
  };
}
