import * as T from '../vendor/three.module.min.js';
import {HEROES} from './data.mjs';
import {seeded} from './game.mjs';

// Character surfaces are profiled and sculpted meshes. Each limb has a separate
// knee/elbow pivot; fixed surface details are merged by material after modelling.
const cache=new Map(),templates=new Map(),sharedGeometries=new Set(),sharedMaterials=new Set();let buildLow=false;
const unitSphere=new T.SphereGeometry(1,24,16),lowSphere=new T.SphereGeometry(1,12,8),curlSphere=new T.SphereGeometry(1,10,7);
function mat(name,color,extra={}){if(!cache.has(name))cache.set(name,new T.MeshStandardMaterial({color,roughness:.64,metalness:0,...extra}));return cache.get(name);}
function g(parent,x=0,y=0,z=0){const p=new T.Group();p.position.set(x,y,z);parent.add(p);return p;}
function add(parent,geometry,material,x=0,y=0,z=0){const m=new T.Mesh(geometry,material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function ell(parent,material,x,y,z,sx,sy,sz,detail=false){const m=add(parent,buildLow?lowSphere:detail?new T.SphereGeometry(1,40,28):unitSphere,material,x,y,z);m.scale.set(sx,sy,sz);return m;}
function curve(parent,material,points,radius=.012){return add(parent,new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),Math.max(6,points.length*(buildLow?2:4)),radius,buildLow?6:8,false),material);}
const cat=(a,b,c,d,t)=>.5*((2*b)+(-a+c)*t+(2*a-5*b+4*c-d)*t*t+(-a+3*b-3*c+d)*t*t*t);
function profile(rings,{segments=28,steps=4,warp=null,cap=true}={}){
  if(buildLow){segments=Math.min(segments,16);steps=2;}
  const rows=[];for(let i=0;i<rings.length-1;i++)for(let j=0;j<steps;j++){
    const t=j/steps,a=rings[Math.max(0,i-1)],b=rings[i],c=rings[i+1],d=rings[Math.min(rings.length-1,i+2)];
    rows.push([b[0]+(c[0]-b[0])*t,Math.max(.001,cat(a[1],b[1],c[1],d[1],t)),Math.max(.001,cat(a[2],b[2],c[2],d[2],t)),cat(a[3]||0,b[3]||0,c[3]||0,d[3]||0,t)]);
  }rows.push(rings.at(-1));const pos=[],uv=[],index=[];
  for(let i=0;i<rows.length;i++){const [y,rx,rz,zc=0]=rows[i];for(let j=0;j<=segments;j++){const a=j/segments*Math.PI*2;let p=[Math.sin(a)*rx,y,Math.cos(a)*rz+zc];if(warp)p=warp(p,a,i/(rows.length-1));pos.push(...p);uv.push(j/segments,i/(rows.length-1));}}
  for(let i=0;i<rows.length-1;i++)for(let j=0;j<segments;j++){const a=i*(segments+1)+j,b=a+segments+1;index.push(a,a+1,b,a+1,b+1,b);}
  if(cap){for(const end of [0,rows.length-1]){const offset=pos.length/3;pos.push(0,rows[end][0],rows[end][3]||0);uv.push(.5,.5);for(let j=0;j<segments;j++){const a=end*(segments+1)+j;index.push(...(end===0?[offset,a+1,a]:[offset,a,a+1]));}}}
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(index);geo.computeVertexNormals();return geo;
}
function loft(parent,material,rings,options){return add(parent,profile(rings,options),material);}
function rounded(w,h,d,r=.035){const s=new T.Shape(),x=-w/2,y=-h/2;s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);s.lineTo(x+w,y+h-r);s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);s.lineTo(x+r,y+h);s.quadraticCurveTo(x,y+h,x,y+h-r);s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);const geom=new T.ExtrudeGeometry(s,{depth:d,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:r*.35,bevelThickness:r*.35,curveSegments:5});geom.translate(0,0,-d/2);return geom;}
function normalTexture(kind){const key=`normal-${kind}`;if(cache.has(key))return cache.get(key);const size=128,data=new Uint8Array(size*size*4),random=seeded(kind==='skin'?998:411);for(let y=0;y<size;y++)for(let x=0;x<size;x++){const i=(y*size+x)*4,n=(random()-.5)*(kind==='skin'?6:9);data[i]=128+n+(kind==='cloth'?(x%3===0?5:-2):0);data[i+1]=128+n+(kind==='cloth'?(y%3===0?5:-2):0);data[i+2]=255;data[i+3]=255;}const tex=new T.DataTexture(data,size,size);tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.repeat.set(kind==='skin'?3:9,kind==='skin'?3:9);tex.needsUpdate=true;cache.set(key,tex);return tex;}
function surface(name,color,kind='skin'){return mat(name,color,{roughness:kind==='skin'?.54:.85,normalMap:normalTexture(kind),normalScale:new T.Vector2(kind==='skin'?.08:.12,kind==='skin'?.08:.12)});}
function merge(parent){
  const batches=new Map();for(const m of parent.children.filter(m=>m.isMesh)){if(!batches.has(m.material))batches.set(m.material,[]);batches.get(m.material).push(m);}
  for(const [material,parts] of batches){if(parts.length<2)continue;const geos=parts.map(m=>{m.updateMatrix();const source=m.geometry.clone().applyMatrix4(m.matrix);const result=source.index?source.toNonIndexed():source;if(result!==source)source.dispose();return result;});const merged=new T.BufferGeometry();
    for(const name of ['position','normal','uv']){const size=geos[0].getAttribute(name).itemSize,arrays=geos.map(geo=>geo.getAttribute(name).array),buffer=new Float32Array(arrays.reduce((n,a)=>n+a.length,0));let at=0;for(const a of arrays){buffer.set(a,at);at+=a.length;}merged.setAttribute(name,new T.BufferAttribute(buffer,size));}
    add(parent,merged,material);for(const m of parts){parent.remove(m);if(![unitSphere,lowSphere,curlSphere].includes(m.geometry))m.geometry.dispose();}for(const geo of geos)geo.dispose();
  }
}
function finalize(root){root.traverse(p=>{if(p.isGroup)merge(p);});root.userData.characterVersion=2;return root;}
function copyModel(source){const data=source.userData;source.userData={};const root=source.clone(true);source.userData=data;const named=n=>root.getObjectByName(n),list=n=>[named(n+'0'),named(n+'1')];root.userData={characterVersion:2,id:data.id,kind:data.kind,big:data.big,body:named('character-body'),head:named('character-head'),legs:list('leg-'),calves:list('calf-'),feet:list('foot-'),arms:list('arm-'),forearms:list('forearm-'),badge:named('embroidery'),guns:data.guns?[0,1].map(i=>({gun:named('weapon-'+i),flash:named('flash-'+i)})):[]};return root;}
function remember(root,key){finalize(root);const d=root.userData;d.body.name='character-body';d.head.name='character-head';for(const [field,prefix] of [['legs','leg-'],['calves','calf-'],['feet','foot-'],['arms','arm-'],['forearms','forearm-']])d[field].forEach((p,i)=>p.name=prefix+i);if(d.badge)d.badge.name='embroidery';d.guns?.forEach((p,i)=>{p.gun.name='weapon-'+i;p.flash.name='flash-'+i;});root.traverse(o=>{if(o.isMesh){sharedGeometries.add(o.geometry);sharedMaterials.add(o.material);}});templates.set(key,root);return copyModel(root);}

function sculptHead(parent,skin,w=.22,h=.26,d=.2,monster=false){
  const geo=new T.SphereGeometry(1,buildLow?20:40,buildLow?14:28),p=geo.getAttribute('position');for(let i=0;i<p.count;i++){let x=p.getX(i),y=p.getY(i),z=p.getZ(i);const jaw=y<-.25?1+(y+.25)*(monster?.12:.37):1;const cheek=1+Math.exp(-Math.pow((y+.18)*4,2))*.07;x*=jaw*cheek;z*=y<-.3?.91:1;if(z>0&&y<.3&&y>-.45)z+=.035*(1-Math.abs(x));p.setXYZ(i,x*w,y*h,z*d);}geo.computeVertexNormals();return add(parent,geo,skin);
}
function face(parent,skin,{monster=false,boss=false}={}){
  const eyeWhite=mat('eye-ivory',0xfff6dc,{roughness:.3}),iris=mat('iris-dark',0x292c23,{roughness:.24}),mouth=mat('mouth',0x351b24,{roughness:.85}),lip=mat(monster?'lip-green':'lip-human',monster?0x42652c:0x9e6555),lid=skin;
  const sx=monster?.115:.084,ey=monster?.06:.032,z=monster?.238:.187;
  for(const s of [-1,1]){
    const eyeball=ell(parent,boss?mat('boss-eye-yellow',0xdce8a1,{roughness:.28}):eyeWhite,s*sx,ey,z,monster?.093:.041,boss?.041:monster?.069:.021,monster?.044:.02);if(monster)eyeball.rotation.z=s*.08;
    ell(parent,iris,s*sx,ey-.006,z+(monster?.045:.02),monster?.029:.012,monster?.037:.014,.009);
    ell(parent,mat('eye-light',0xffffff,{roughness:.1}),s*sx-.008,ey+.008,z+(monster?.055:.028),monster?.009:.004,monster?.01:.004,.003);
    if(monster){const brow=ell(parent,skin,s*sx,ey+(boss?.046:.061),z-.001,.127,.037,.067);brow.rotation.z=s*.31;curve(parent,mat('brow-shadow-green',0x3e6228),[[s*(sx-.06),ey+.025,z+.041],[s*sx,ey+.05,z+.055],[s*(sx+.07),ey+.085,z+.025]],.009);}
    else{curve(parent,mat('brow-black',0x252421),[[s*(sx-.034),ey+.061,z-.008],[s*sx,ey+.066,z+.004],[s*(sx+.036),ey+.051,z-.015]],.008);curve(parent,lid,[[s*(sx-.04),ey+.007,z+.008],[s*sx,ey+.021,z+.01],[s*(sx+.041),ey+.009,z]],.007);curve(parent,lip,[[s*(sx-.03),ey-.013,z],[s*sx,ey-.017,z+.003],[s*(sx+.03),ey-.012,z-.009]],.003);}
  }
  if(monster){ell(parent,skin,0,-.015,.26,.075,.075,.09);for(const s of [-1,1]){ell(parent,skin,s*.055,-.04,.28,.047,.028,.053);ell(parent,mat('nostril-green',0x395c25),s*.045,-.052,.325,.016,.009,.008);}const open=boss?.09:.067;
    ell(parent,mouth,0,-.15,.206,.137,open,.03);ell(parent,lip,0,-.18,.205,.151,.032,.036);
    const tooth=mat('teeth',0xf5dfad,{roughness:.46});for(let i=0;i<5;i++){const m=add(parent,rounded(.03,.047,.022,.006),tooth,-.094+i*.047,-.106+(i%2)*.005,.237);m.rotation.z=(i%2?1:-1)*.13;}for(let i=0;i<3;i++)add(parent,rounded(.032,.025,.02,.005),tooth,-.058+i*.058,-.18,.241);
    for(const s of [-1,1])curve(parent,skin,[[s*.095,-.048,.27],[s*.153,-.072,.214],[s*.16,-.155,.16]],.02);
  }else{
    ell(parent,skin,0,-.01,.193,.019,.065,.03);ell(parent,skin,0,-.046,.216,.029,.022,.033);for(const s of [-1,1]){ell(parent,skin,s*.023,-.054,.21,.018,.013,.018);ell(parent,lip,s*.017,-.064,.221,.006,.003,.002);}
    curve(parent,lip,[[-.045,-.104,.178],[-.017,-.108,.196],[0,-.106,.2],[.017,-.108,.196],[.045,-.104,.178]],.005);curve(parent,skin,[[-.04,-.118,.181],[0,-.123,.199],[.04,-.118,.181]],.008);
  }
  const earW=monster?.061:.033;for(const s of [-1,1]){ell(parent,skin,s*(monster?.286:.213),-.015,-.005,earW,monster?.1:.065,monster?.056:.04);ell(parent,lip,s*(monster?.31:.232),-.014,.013,earW*.25,monster?.049:.032,.016);}
}
function hair(parent,{female=false,older=false}={}){
  const dark=mat('hair-dark',0x171619,{roughness:.88}),edge=mat('hair-shine',0x28252a,{roughness:.74}),random=seeded(109);
  const scalp=new T.SphereGeometry(1,32,18);const position=scalp.getAttribute('position');for(let i=0;i<position.count;i++){const y=position.getY(i);if(y<.12)position.setY(i,.12+(y-.12)*.25);}scalp.computeVertexNormals();const cap=add(parent,scalp,dark,0,.117,-.009);cap.scale.set(.221,.181,.208);
  if(female){for(const s of [-1,1]){const side=ell(parent,dark,s*.174,.002,-.05,.069,.19,.15);side.rotation.z=-s*.16;}const tail=ell(parent,dark,.14,.065,-.31,.09,.22,.12);tail.rotation.x=-.3;ell(parent,mat('hair-tie',0xcc4250),.12,.12,-.23,.045,.028,.04);for(let i=0;i<18;i++){const a=i*.45;curve(parent,edge,[[Math.sin(a)*.14,.29,-.03],[Math.sin(a)*.19,.18,.11],[Math.sin(a)*.18,.08,.16]],.003);}}
  else for(let row=0;row<11;row++){const polar=.15+row*.16;for(let i=0;i<20;i++){const a=i/20*Math.PI*2+row*.22,rx=.20*Math.sin(polar),rz=.19*Math.sin(polar),y=.13+.18*Math.cos(polar);const n=(.022+random()*.011)*(row>8?.7:1);add(parent,curlSphere,i%5===0?edge:dark,Math.sin(a)*rx,y+random()*.01,Math.cos(a)*rz-.008).scale.set(n,n*.9,n);}}
  if(older)for(let i=0;i<10;i++)ell(parent,mat('hair-grey',0x686469,{roughness:.9}),Math.sin(i)*.2,.115+Math.sin(i*.73)*.04,-.02+Math.cos(i)*.1,.008,.017,.012);
}
function hand(parent,skin,x,y,z,{big=false,forward=-1}={}){
  const h=g(parent,x,y,z),r=big?.11:.042;ell(h,skin,0,0,0,r*1.2,r*1.35,r*.72);if(!buildLow)for(let i=0;i<4;i++){const finger=g(h,(i-1.5)*r*.48,-r*.74,forward*r*.12);loft(finger,skin,[[-r*.9,r*.16,r*.17,forward*r*.5],[-r*.62,r*.2,r*.22,forward*r*.54],[0,r*.19,r*.19,0]],{segments:12,steps:3});ell(finger,skin,0,-r*.62,forward*r*.6,r*.18,r*.22,r*.15);finger.updateMatrix();for(const part of [...finger.children]){part.updateMatrix();const geometry=part.geometry.clone().applyMatrix4(finger.matrix.clone().multiply(part.matrix));add(h,geometry,skin);if(![unitSphere,lowSphere,curlSphere].includes(part.geometry))part.geometry.dispose();}h.remove(finger);}const thumb=ell(h,skin,r*1.1,-r*.1,forward*r*.1,r*.38,r*.8,r*.4);thumb.rotation.z=-.65;return h;
}
function sneaker(parent,white,dark){
  const geo=profile([[-.39,.006,.022,-.067],[-.35,.112,.06,-.08],[-.2,.144,.08,-.095],[-.03,.135,.125,-.135],[.105,.118,.122,-.137],[.145,.079,.084,-.11]],{segments:24,steps:4});geo.rotateX(Math.PI/2);add(parent,geo,white);
  const outline=new T.Shape();outline.moveTo(-.11,.15);outline.quadraticCurveTo(-.15,.02,-.15,-.19);outline.quadraticCurveTo(-.15,-.4,0,-.415);outline.quadraticCurveTo(.15,-.4,.15,-.19);outline.quadraticCurveTo(.15,.02,.11,.15);outline.closePath();const sole=new T.ExtrudeGeometry(outline,{depth:.045,bevelEnabled:true,bevelSize:.012,bevelThickness:.009,bevelSegments:3,curveSegments:10});sole.rotateX(Math.PI/2);add(parent,sole,mat('shoe-sole',0xd8dadb,{roughness:.78}),0,.055,0);
  ell(parent,dark,0,.178,.07,.094,.018,.075);curve(parent,dark,[[-.119,.1,-.28],[-.145,.09,-.1],[-.126,.1,.1]],.009);curve(parent,dark,[[.119,.1,-.28],[.145,.09,-.1],[.126,.1,.1]],.009);
  for(let i=0;i<5;i++){const z=-.19+i*.035,y=.181+i*.009;curve(parent,white,[[-.054,y,z],[0,y+.014,z-.009],[.054,y,z-.02]],.006);}for(const s of [-1,1])curve(parent,dark,[[s*.146,.118,-.2],[s*.148,.13,-.12],[s*.137,.165,.04]],.009);
}
function weapon(parent){const gun=g(parent),metal=mat('gun-metal',0x253044,{metalness:.8,roughness:.3}),black=mat('gun-polymer',0x16191f,{roughness:.55});add(gun,rounded(.095,.12,.39,.014),metal,0,.015,-.03);add(gun,rounded(.074,.105,.11,.014),black,0,-.089,.077).rotation.x=-.18;
  add(gun,new T.CylinderGeometry(.028,.028,.12,20),mat('gun-barrel',0x526077,{metalness:.88,roughness:.26}),0,.004,-.273).rotation.x=Math.PI/2;ell(gun,black,0,.004,-.34,.025,.025,.004);add(gun,rounded(.064,.014,.022,.004),metal,0,.085,-.171);add(gun,rounded(.078,.012,.017,.003),metal,0,.085,.104);add(gun,new T.TorusGeometry(.036,.006,7,18),metal,0,-.075,-.033).rotation.y=Math.PI/2;
  for(const s of [-1,1])for(let i=0;i<5;i++)add(gun,rounded(.003,.068,.006,.001),black,s*.05,.023,.05+i*.017);
  merge(gun);const flash=add(gun,new T.ConeGeometry(.085,.32,8),mat('gun-flash',0xffdf91,{emissive:0xffad37,emissiveIntensity:3}),0,.004,-.45);flash.rotation.x=-Math.PI/2;flash.visible=false;return{gun,flash};
}
function embroidery(parent,name,color){const c=document.createElement('canvas');c.width=128;c.height=128;const cx=c.getContext('2d');cx.fillStyle=color;cx.font='500 73px "Microsoft YaHei"';cx.textAlign='center';cx.fillText(name,64,92);const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;const m=add(parent,new T.PlaneGeometry(.14,.14),new T.MeshStandardMaterial({map,transparent:true,roughness:.85,depthWrite:false}),-.12,2.19,.211);return m;}

export function makeHero(id='lin'){
  buildLow=false;const key='hero-'+id;if(templates.has(key))return copyModel(templates.get(key));
  const hero=HEROES.find(h=>h.id===id)||HEROES[0],root=new T.Group(),body=g(root),female=id==='su';
  const skin=surface(`skin-${id}`,id==='lin'?0xc99570:female?0xe5b49a:0xbd8967);
  const cloth=surface(`cloth-${id}`,id==='lin'?0x151a25:female?0x9f253e:0x204b54,'cloth'),pants=surface(`pants-${id}`,0x171e2b,'cloth'),white=mat('shoe-white',0xf0f0ec,{roughness:.6}),piping=mat(`piping-${id}`,id==='lin'?0xdde2e5:female?0xe7c58f:0x98d3cb,{roughness:.73}),dark=mat('shoe-dark',0x2a3040,{roughness:.64});
  loft(body,cloth,[[1.39,.25,.15,0],[1.48,.285,.168,0],[1.65,.286,.175,.004],[1.88,.305,.188,0],[2.17,.36,.185,0],[2.32,.38,.18,0],[2.4,.23,.14,0],[2.43,.13,.096,-.014]],{segments:36,steps:5,warp:(p,a,v)=>[p[0]+Math.sin(a*5+v*30)*.006,p[1],p[2]+Math.sin(a*3+v*25)*.008]});
  const hem=loft(body,cloth,[[1.39,.25,.15,0],[1.42,.271,.171,0],[1.48,.275,.168,0]],{segments:32});
  loft(body,skin,[[2.4,.092,.092,0],[2.59,.095,.086,0]],{segments:24});
  const hood=ell(body,cloth,0,2.36,.11,.238,.166,.154);hood.rotation.x=-.25;
  const opening=add(body,new T.TorusGeometry(.118,.038,12,36),cloth,0,2.456,0);opening.rotation.x=Math.PI/2;
  for(const s of [-1,1]){curve(body,piping,[[s*.10,2.41,-.09],[s*.105,2.34,-.187],[s*.13,2.16,-.197]],.006);ell(body,piping,s*.13,2.148,-.2,.01,.028,.009);curve(body,cloth,[[s*.05,1.62,-.185],[s*.18,1.65,-.189],[s*.246,1.82,-.147]],.015);}
  curve(body,mat('cloth-seam',0x252c36,{roughness:.9}),[[-.235,1.58,.1],[0,1.54,.176],[.235,1.58,.1]],.004);
  const head=g(body,0,2.753,-.008);head.rotation.y=Math.PI;sculptHead(head,skin,.21,female?.243:.247,.192);face(head,skin);hair(head,{female,older:id==='chen'});
  const badge=embroidery(body,hero.name[0],id==='lin'?'#a8afb9':hero.color);
  const legs=[],calves=[],feet=[];
  for(const s of [-1,1]){
    const leg=g(body,s*.167,1.4,0);loft(leg,pants,[[-.61,.09,.103,0],[-.49,.104,.112,.006],[-.18,.137,.144,0],[0,.135,.147,0]],{segments:28,steps:4,warp:(p,a,v)=>[p[0],p[1],p[2]+Math.sin(v*16+a*2)*.005]});
    const calf=g(leg,0,-.586,.006);loft(calf,pants,[[-.57,.069,.078,0],[-.49,.072,.076,.018],[-.23,.095,.092,.04],[0,.089,.105,0]],{segments:28,steps:4,warp:(p,a,v)=>[p[0]+Math.sin(v*20+a)*.004,p[1],p[2]]});
    ell(calf,pants,0,-.02,.006,.091,.075,.104);
    for(const joint of [leg,calf]){const len=joint===leg?.57:.55;for(const stripe of [-.017,.017])curve(joint,piping,[[s*(joint===leg?.13:.087),-.035,stripe],[s*(joint===leg?.127:.092),-len*.45,stripe+.006],[s*(joint===leg?.097:.074),-len,stripe+.005]],.005);}
    const ankle=loft(calf,pants,[[-.573,.069,.078,0],[-.54,.072,.078,0]],{segments:24});
    const foot=g(calf,0,-.80,.012);sneaker(foot,white,dark);legs.push(leg);calves.push(calf);feet.push(foot);
  }
  const arms=[],guns=[],forearms=[];
  for(const s of [-1,1]){
    const arm=g(body,s*.36,2.29,.004);loft(arm,cloth,[[-.34,.097,.106,-.075],[-.25,.114,.118,-.058],[-.10,.126,.131,-.023],[0,.12,.122,0]],{segments:28,steps:4});arm.rotation.z=s*.17;
    ell(arm,cloth,0,-.025,-.012,.125,.139,.128);
    const elbow=g(arm,s*.035,-.29,-.088);elbow.rotation.x=Math.PI*.48;loft(elbow,cloth,[[-.35,.067,.073,0],[-.26,.079,.088,0],[-.13,.095,.096,0],[0,.095,.10,0]],{segments:26,steps:4});
    ell(elbow,cloth,0,-.01,.003,.096,.087,.10);
    loft(elbow,cloth,[[-.37,.069,.074,0],[-.325,.073,.078,0]],{segments:24});hand(elbow,skin,0,-.404,0,{forward:-1});
    const grip=g(elbow,0,-.432,-.018);grip.rotation.x=-Math.PI*.48;const w=weapon(grip);w.gun.rotation.y=s*.035;guns.push(w);arms.push(arm);forearms.push(elbow);
    curve(arm,piping,[[s*.118,-.04,.03],[s*.121,-.14,-.017],[s*.099,-.29,-.07]],.006);
  }
  root.userData={body,head,legs,calves,feet,arms,forearms,guns,badge,id,kind:'hero'};return remember(root,key);
}

function rippedEdge(parent,cloth,rings,width=.09){return loft(parent,cloth,rings,{segments:40,steps:5,warp:(p,a,v)=>{if(v<.17)p[1]-=(.5+.5*Math.sin(a*9+.4))*width*(1-v/.17);return p;}});}
function monsterFoot(parent,skin){ell(parent,skin,0,.09,.075,.16,.12,.25);for(let i=0;i<3;i++){ell(parent,skin,(i-1)*.092,.067,.266,.055,.05,.1);ell(parent,mat('toenail',0xced296,{roughness:.6}),(i-1)*.092,.098,.313,.031,.012,.04);}}
export function makeZombie(big=false,low=false){
  buildLow=low;const key=`monster-${big}-${low}`;if(templates.has(key))return copyModel(templates.get(key));
  const root=new T.Group(),body=g(root),skin=surface(big?'boss-skin':'zombie-skin',big?0x78b938:0x8cb94d),darkSkin=mat('green-fold',0x5f8733,{roughness:.7}),cloth=surface(big?'boss-shirt':'zombie-shirt',big?0x7942a3:0x9c633b,'cloth'),pants=surface(big?'boss-pants':'zombie-pants',big?0x43314f:0x404e5d,'cloth');
  const legs=[],calves=[],feet=[],arms=[],forearms=[];
  if(big){
    // A single sculpted torso gives the boss its broad trapezius and heavy belly silhouette.
    loft(body,skin,[[.8,.36,.26,0],[.97,.53,.34,.075],[1.22,.69,.46,.11],[1.52,.67,.44,.09],[1.77,.55,.34,.035],[2.02,.63,.32,0],[2.19,.54,.27,0],[2.28,.28,.2,0]],{segments:48,steps:6,warp:(p,a,v)=>[p[0],p[1],p[2]+Math.cos(a)*Math.sin(v*Math.PI)*.028]});
    rippedEdge(body,cloth,[[1.60,.667,.455,.067],[1.78,.607,.411,.038],[2.02,.712,.393,.004],[2.19,.618,.338,0],[2.28,.331,.258,0]],.10);
    ell(body,skin,0,1.212,.164,.672,.47,.432,true);
    for(const s of [-1,1])ell(body,skin,s*.47,2.12,.01,.235,.18,.228);
    const navel=add(body,new T.TorusGeometry(.031,.009,8,18),darkSkin,0,1.14,.589);navel.scale.set(1,.8,1);ell(body,darkSkin,0,1.14,.586,.018,.011,.006);
    const rand=seeded(85);for(let i=0;i<10;i++){const a=(rand()-.5)*1.8,y=1.05+rand()*.45,x=Math.sin(a)*.5,z=.1+Math.cos(a)*.4;ell(body,skin,x,y,z,.015+rand()*.016,.013+rand()*.015,.014);}
    for(const s of [-1,1])curve(body,darkSkin,[[s*.24,1.38,.53],[s*.39,1.34,.474],[s*.46,1.3,.41]],.006);
  }else{
    loft(body,skin,[[.93,.24,.16,0],[1.13,.272,.185,0],[1.37,.243,.17,0],[1.59,.31,.18,0],[1.76,.335,.177,0],[1.87,.156,.12,0]],{segments:30,steps:4});
    rippedEdge(body,cloth,[[1.03,.276,.19,0],[1.12,.285,.201,0],[1.42,.263,.185,0],[1.62,.319,.201,0],[1.78,.34,.197,0],[1.86,.163,.122,0]],.1);
    curve(body,mat('shirt-stitch',0xc29160),[[-.1,1.25,.201],[-.08,1.43,.188],[-.1,1.66,.2]],.006);
    for(let i=0;i<3;i++)ell(body,mat('button',0x4b423b),-.08,1.35+i*.15,.205,.014,.014,.007);
  }
  loft(body,skin,[[big?2.16:1.82,big?.17:.103,big?.15:.1,0],[big?2.34:2.03,big?.17:.108,big?.15:.1,0]],{segments:24});
  const head=g(body,0,big?2.46:2.145,big?.035:.02);sculptHead(head,skin,big?.29:.255,big?.323:.278,big?.248:.21,true);face(head,skin,{monster:true,boss:big});
  if(big){
    curve(head,darkSkin,[[-.08,.226,.168],[-.045,.243,.183],[.02,.238,.201]],.009);curve(head,darkSkin,[[.09,.196,.193],[.112,.143,.2],[.118,.11,.231]],.008);
    ell(head,skin,-.165,.231,.1,.026,.023,.024);ell(head,skin,.096,.275,.072,.013,.012,.015);
    curve(head,skin,[[-.044,.19,.229],[-.02,.128,.25],[0,.1,.259]],.012);
  }else{const hairMat=mat('zombie-hair',0x333923);for(let i=0;i<12;i++){const x=Math.sin(i)*.12,z=Math.cos(i)*.115;const m=ell(head,hairMat,x,.267,z,.026,.045,.031);m.rotation.z=Math.sin(i)*.6;}}
  const hip=big?1.04:.99,xHip=big?.275:.18;
  for(const s of [-1,1]){
    const leg=g(body,s*xHip,hip,0);
    if(big){rippedEdge(leg,pants,[[-.43,.18,.206,0],[-.3,.224,.24,0],[-.10,.234,.255,0],[0,.222,.246,0]],.07);loft(leg,skin,[[-.50,.147,.17,0],[-.35,.174,.199,0]],{segments:28});}
    else{loft(leg,pants,[[-.43,.10,.114,0],[-.25,.126,.147,0],[0,.135,.149,0]],{segments:26,steps:4});}
    const calf=g(leg,0,big?-.44:-.42,0);loft(calf,skin,[[-.43,big?.09:.065,big?.104:.069,0],[-.33,big?.125:.08,big?.14:.09,-.015],[-.13,big?.159:.097,big?.157:.101,-.015],[0,big?.151:.10,big?.177:.115,0]],{segments:28});
    ell(calf,skin,0,-.025,.02,big?.152:.1,big?.12:.09,big?.17:.11);
    const foot=g(calf,0,big?-.55:-.5,0);monsterFoot(foot,skin);if(!big){const shoe=ell(foot,mat('zombie-shoe',0x3e5433),0,.07,.08,.154,.097,.232);}
    legs.push(leg);calves.push(calf);feet.push(foot);
    const arm=g(body,s*(big?.60:.326),big?2.05:1.73,0);arm.rotation.z=s*(big?.15:.19);
    if(big){ell(arm,skin,s*.06,-.073,.02,.264,.284,.249);rippedEdge(arm,cloth,[[-.19,.271,.255,.016],[-.06,.273,.262,0],[.05,.245,.235,0]],.08);loft(arm,skin,[[-.58,.17,.183,0],[-.45,.213,.226,0],[-.27,.247,.233,0],[-.12,.238,.216,0]],{segments:32});ell(arm,skin,.02,-.32,.116,.175,.19,.128);}
    else{rippedEdge(arm,cloth,[[-.22,.129,.13,0],[-.07,.151,.149,0],[.03,.134,.131,0]],.035);loft(arm,skin,[[-.46,.079,.089,0],[-.29,.107,.113,0],[-.14,.117,.115,0]],{segments:26});}
    const elbow=g(arm,0,big?-.53:-.44,.015);elbow.rotation.x=big?-.28:-.56;
    ell(elbow,skin,0,-.018,0,big?.171:.087,big?.17:.09,big?.18:.092);
    loft(elbow,skin,[[-(big?.53:.37),big?.125:.061,big?.137:.066,.012],[-(big?.40:.29),big?.173:.086,big?.189:.094,.013],[-.15,big?.19:.096,big?.19:.097,0],[0,big?.174:.087,big?.185:.095,0]],{segments:32,steps:5});
    hand(elbow,skin,0,big?-.58:-.427,.026,{big,forward:1});
    if(big)for(const x of [-.04,.04])curve(elbow,darkSkin,[[x,-.2,.177],[x*.9,-.32,.177],[x*.8,-.45,.144]],.007);
    arms.push(arm);forearms.push(elbow);
  }
  root.userData={body,head,legs,calves,feet,arms,forearms,big,kind:big?'boss':'zombie'};if(big)root.scale.setScalar(3.1);return remember(root,key);
}

export function animateHero(hero,time,{running=false,jump=0,shooting=false,gunCount=1,menu=false}={}){
  const h=hero.userData,phase=time*(running?9.5:2);
  for(let i=0;i<2;i++){const sin=Math.sin(phase+i*Math.PI);h.legs[i].rotation.x=running?sin*.67:sin*.015;h.calves[i].rotation.x=running?Math.max(0,-sin)*1.25:.06;h.feet[i].rotation.x=running?-h.legs[i].rotation.x*.35-h.calves[i].rotation.x*.23:0;}
  h.body.position.y=(running?Math.abs(Math.sin(phase))*.055:Math.sin(phase)*.012)+jump;h.body.rotation.x=running?-.045:0;
  h.arms.forEach((a,i)=>{a.rotation.x=menu?-.08:(i===0&&gunCount===1?.26:-.09);a.rotation.z=(i===0?-1:1)*.17;h.forearms[i].rotation.x=Math.PI*.48+(shooting?-.07:0);});
}
export function animateMonster(monster,time,phase=0,{boss=false,attacking=false}={}){
  const h=monster.userData,t=time*(boss?2.2:5.6)+phase;
  h.legs.forEach((l,i)=>{const s=Math.sin(t+i*Math.PI);l.rotation.x=s*(boss?.10:.38);h.calves[i].rotation.x=Math.max(0,-s)*(boss?.18:.55);h.feet[i].rotation.x=-l.rotation.x*.25;});
  h.body.position.y=Math.abs(Math.sin(t))*(boss?.017:.028);h.body.rotation.z=Math.sin(t)*(boss?.014:.02);
  h.arms.forEach((a,i)=>{a.rotation.x=attacking?-2.55:(boss?Math.sin(t+i)*.06:-.16+Math.sin(t+i)*.13);a.rotation.z=(i===0?-1:1)*(attacking?.6:boss?.18:.18);h.forearms[i].rotation.x=attacking?-.8:boss?-.28:-.56;});
  if(boss){const breathe=1+Math.sin(time*2)*.012;h.body.scale.set(1,breathe,1);h.head.rotation.x=attacking?-.09:Math.sin(time*1.3)*.023;}
}
export function characterResources(){return{geometries:new Set([unitSphere,lowSphere,curlSphere,...sharedGeometries]),materials:new Set([...sharedMaterials,...[...cache.values()].filter(v=>v.isMaterial)])};}
