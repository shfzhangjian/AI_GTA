import * as THREE from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { X,Z,M,HEIGHT } from './data.js';

// Photographed fixtures share the same corner and dimensions in the model and plan.
export const bathLayout={corner:[529,391],shower:[58,63],vanity:[529,463,562,521],toilet:[600,391,635,446]};
function texture(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=8;return t;}
function worldTile(mat,width,height){
  mat.onBeforeCompile=s=>{s.vertexShader=s.vertexShader.replace('#include <worldpos_vertex>',`#include <worldpos_vertex>
    vec3 tp=(modelMatrix*vec4(transformed,1.0)).xyz;
    vec3 tn=abs(normalize(mat3(modelMatrix)*objectNormal));
    vec2 tuv=tn.x>0.5?tp.zy:(tn.z>0.5?tp.xy:tp.xz);
    vMapUv=tuv/vec2(${width},${height});
    vBumpMapUv=tuv/vec2(${width},${height});
  `);};mat.customProgramCacheKey=()=>`bath-tile-${width}-${height}`;
}
export function initBathroomMaterials(m){
  const mat=(id,color,extra={})=>m[id]=new THREE.MeshStandardMaterial({color,roughness:.5,...extra});
  const marble=texture(512,1024,(ctx,w,h)=>{
    ctx.fillStyle='#cfbea2';ctx.fillRect(0,0,w,h);
    for(let i=0;i<9000;i++){const x=(i*97.17)%w,y=(i*137.13)%h;ctx.fillStyle=i%3?'#eee7d41b':'#7d735d0b';ctx.fillRect(x,y,3,3);}
    for(let j=0;j<21;j++){ctx.strokeStyle=j%3?'#86766189':'#fff7e7aa';ctx.lineWidth=j%4===0?2:1;ctx.beginPath();let x=(j*83)%w,y=(j*157)%h;ctx.moveTo(x,y);for(let k=0;k<20;k++){const nx=x+Math.sin(j*2+k*1.9)*21+7,ny=y+25;ctx.lineTo(nx,ny);if(k%4===1){ctx.moveTo(nx,ny);ctx.lineTo(nx-30+Math.sin(k)*14,ny+18);ctx.moveTo(nx,ny);}x=nx;y=ny;}ctx.stroke();}
    ctx.strokeStyle='#efe5d2';ctx.lineWidth=2;ctx.strokeRect(0,0,w,h);
  });
  mat('bathTile','#fff8eb',{map:marble,bumpMap:marble,bumpScale:.00045,roughness:.24});worldTile(m.bathTile,.30,.60);
  mat('bathFloor','#e2d5bd',{map:marble,bumpMap:marble,bumpScale:.0007,roughness:.58});worldTile(m.bathFloor,.30,.30);
  mat('bathWhite','#f4f1e8',{roughness:.28});mat('bathCream','#e1ddd0',{roughness:.50});
  mat('bathChrome','#b6c0bf',{metalness:.94,roughness:.19});mat('bathBronze','#75684d',{metalness:.7,roughness:.37});
  mat('bathBlack','#292925',{metalness:.55,roughness:.30});mat('bathWindow','#363737',{metalness:.48,roughness:.45});
  mat('bathTeal','#28838f');mat('bathOrange','#cc692a');mat('bathPink','#d2a2a5');mat('bathPurple','#9b95b3');
  mat('bathYellow','#d5b633');mat('bathGreen','#a3b07a');mat('bathWine','#714947');mat('bathBlue','#477ca6');
  mat('bathClear','#b9d7cf',{transparent:true,opacity:.26,depthWrite:false,roughness:.16,side:THREE.DoubleSide});
  mat('bathFrosted','#dddccb',{transparent:true,opacity:.91,roughness:.8,side:THREE.DoubleSide});
  mat('bathWindowGlass','#c4b595',{roughness:.9,emissive:'#deb98b',emissiveIntensity:.22});
  const waist=texture(1024,192,(ctx,w,h)=>{
    ctx.fillStyle='#b7a284';ctx.fillRect(0,0,w,h);ctx.strokeStyle='#eadfc9';ctx.lineWidth=4;
    for(const y of [4,12,h-10,h-3]){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();}
    for(let i=-1;i<9;i++){const x=i*128+64;ctx.fillStyle='#d4c6ac';ctx.beginPath();ctx.ellipse(x,100,46,66,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#8f7c5f';ctx.lineWidth=2;ctx.stroke();
      for(let j=0;j<8;j++){const a=j*Math.PI/4;ctx.fillStyle=j%2?'#ede4d0':'#b2a185';ctx.beginPath();ctx.ellipse(x+Math.sin(a)*18,100+Math.cos(a)*25,9,24,-a,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#f6efd9';ctx.stroke();}
      ctx.fillStyle='#eee2c8';ctx.beginPath();ctx.arc(x,100,7,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#e9ddc3';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x+44,110);ctx.bezierCurveTo(x+110,20,x+96,170,x+129,82);ctx.stroke();
    }
  });mat('bathBorder','#fff9e8',{map:waist,bumpMap:waist,bumpScale:.001,roughness:.26});
  for(const [id,color] of [['TowelBlue','#3d9bad'],['TowelOrange','#d87135'],['TowelBrown','#a07854'],['TowelCream','#dfd8b9'],['TowelPink','#c6a4ab']]){
    const t=texture(256,256,(ctx)=>{ctx.fillStyle=color;ctx.fillRect(0,0,256,256);for(let y=0;y<256;y+=3)for(let x=0;x<256;x+=3){ctx.fillStyle=(x+y)%2?'#ffffff24':'#35292018';ctx.fillRect(x,y,1,2);}ctx.fillStyle='#efe2bf';ctx.fillRect(10,0,9,256);ctx.fillRect(0,240,256,7);if(id==='TowelBlue'){ctx.strokeStyle='#aebd79';ctx.lineWidth=5;ctx.beginPath();ctx.arc(118,99,44,0,Math.PI*2);ctx.stroke();for(const x of [106,132]){ctx.fillStyle='#4d7360';ctx.fillRect(x,87,5,5);}}if(id==='TowelBrown'){ctx.strokeStyle='#e6d3b2';ctx.lineWidth=5;for(let i=0;i<3;i++){ctx.beginPath();ctx.arc(115,45+i*76,33,0,Math.PI*1.6);ctx.stroke();}}});
    mat(`bath${id}`,'#ffffff',{map:t,bumpMap:t,bumpScale:.0014,roughness:1,side:THREE.DoubleSide});
  }
  const ceiling=texture(512,512,(ctx)=>{ctx.fillStyle='#e6ddc8';ctx.fillRect(0,0,512,512);ctx.strokeStyle='#baa88c';ctx.lineWidth=2;for(let y=0;y<512;y+=128)for(let x=0;x<512;x+=128){ctx.strokeRect(x,y,128,128);ctx.save();ctx.translate(x+64,y+64);ctx.rotate(Math.PI/4);ctx.strokeRect(-17,-17,34,34);for(let j=0;j<4;j++){ctx.rotate(Math.PI/2);ctx.beginPath();ctx.moveTo(-12,0);ctx.bezierCurveTo(-3,20,13,-20,12,0);ctx.stroke();}ctx.restore();}});
  mat('bathCeiling','#fff9ed',{map:ceiling,roughness:.65});
}
function tube(g,points,r,mat,k,closed=false){const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)),closed);const mesh=new THREE.Mesh(new THREE.TubeGeometry(curve,Math.max(16,points.length*7),r,8,closed),k.materials[mat]);g.add(mesh);return mesh;}
function cloth(g,x,y,z,w,h,mat,k,fold=1){
  const geo=new THREE.PlaneGeometry(w,h,18,24),p=geo.attributes.position;
  for(let i=0;i<p.count;i++){const xx=p.getX(i),yy=p.getY(i);p.setZ(i,fold*(.016*Math.sin(xx*31)+.009*Math.sin(yy*16+xx*9)));p.setY(i,yy+.017*Math.sin(xx*15)*(1-yy/h));}geo.computeVertexNormals();
  const mesh=new THREE.Mesh(geo,k.materials[mat]);mesh.position.set(x,y,z);mesh.castShadow=true;g.add(mesh);return mesh;
}
function bottle(g,x,y,z,h,mat,k,r=.033,pump=true){
  k.cyl(g,x,y+h*.39,z,r*.80,r,h*.76,mat,16);k.cyl(g,x,y+h*.81,z,r*.48,r*.70,h*.10,mat,16);
  k.cyl(g,x,y+h*.94,z,r*.34,r*.34,h*.15,pump?'bathWhite':mat,12);
  if(pump){k.box(g,x+.014,y+h*1.025,z,.065,.013,.014,'bathWhite',true);}
  k.box(g,x,y+h*.42,z+r+.001,r*1.32,h*.31,.002,'bathCream',true);for(let i=0;i<3;i++)k.box(g,x,y+h*(.36+i*.04),z+r+.003,r*.9,.002,.002,mat);
}
function panelTrim(g,x,y,z,w,h,k){
  const pts=[[-w/2,h/2],[-w/2,-h*.25],[-w*.35,-h/2],[w*.35,-h/2],[w/2,-h*.25],[w/2,h/2],[-w/2,h/2]];
  tube(g,pts.map(([xx,yy])=>[x+xx,y+yy,z]),.006,'bathCream',k);
}
function handle(g,x,y,z,k){tube(g,[[x-.055,y,z],[x-.03,y-.014,z+.018],[x+.03,y-.014,z+.018],[x+.055,y,z]],.006,'bathBronze',k);for(const xx of [-.065,.065])k.ball(g,x+xx,y,z,.023,.010,.004,'bathBronze');}
function basins(g,x,y,z,k,rounded=false){
  const b=new THREE.Group();b.position.set(x,y,z);g.add(b);
  if(rounded){k.box(b,0,0,.03,.44,.47,.07,'bathCream',true);k.box(b,0,0,.074,.395,.418,.055,'bathBlack',true);k.box(b,0,0,.107,.338,.358,.042,'bathWhite',true);}
  else {const body=k.cyl(b,0,0,.03,.235,.222,.045,'bathBlue',48);body.rotation.x=Math.PI/2;k.torus(b,0,0,.072,.188,.038,'bathTeal',[0,0,0]);const base=k.cyl(b,0,0,.079,.158,.158,.018,'bathPurple',40);base.rotation.x=Math.PI/2;}
  k.box(b,0,.272,0,.10,.105,.005,'bathCream',true);tube(b,[[-.035,.244,.03],[0,.275,.06],[.035,.244,.03]],.006,'bathBronze',k);
}
function wallFan(g,x,y,z,k){const f=new THREE.Group();f.position.set(x,y,z);g.add(f);const body=k.cyl(f,0,0,.04,.145,.145,.075,'bathPurple',40);body.rotation.x=Math.PI/2;
  for(let i=0;i<5;i++){const a=i*Math.PI*2/5,b=k.box(f,Math.cos(a)*.055,Math.sin(a)*.055,.09,.095,.043,.007,'bathCream',true);b.rotation.z=a+.55;}
  for(let i=0;i<34;i++){const a=i*Math.PI/17;tube(f,[[Math.cos(a)*.03,Math.sin(a)*.03,.115],[Math.cos(a+.27)*.09,Math.sin(a+.27)*.09,.11],[Math.cos(a+.5)*.137,Math.sin(a+.5)*.137,.11]],.002,'bathWhite',k);}
  k.torus(f,0,0,.11,.143,.005,'bathWhite',[0,0,0]);const hub=k.cyl(f,0,0,.115,.034,.034,.014,'bathBlack',20);hub.rotation.x=Math.PI/2;
}
function rack(g,x,y,z,length,k,matList,shelf=false){
  for(const xx of [-length/2,length/2]){k.box(g,x+xx,y,z,.035,.09,.028,'bathChrome');k.rod(g,[x+xx,y,z],[x+xx,y,z+.11],.013,'bathChrome');}
  k.rod(g,[x-length/2,y,z+.11],[x+length/2,y,z+.11],.013,'bathChrome');
  if(shelf)for(let i=0;i<4;i++)k.rod(g,[x-length/2,y+.03,z+.025+i*.05],[x+length/2,y+.03,z+.025+i*.05],.01,'bathChrome');
  matList.forEach((mat,i)=>{const xx=x-length*.34+i*length*.68/Math.max(1,matList.length-1),h=.40+i%2*.10;cloth(g,xx,y-h/2,z+.125,.19,h,mat,k);});
}
function vanity(g,w,d,k){
  const {box,cyl,rod}=k;box(g,0,.43,0,w,.62,d,'bathWhite',true);
  box(g,-w*.18,.435,d/2+.008,w*.57,.58,.025,'bathWhite',true);panelTrim(g,-w*.18,.435,d/2+.026,w*.50,.51,k);handle(g,-w*.18,.49,d/2+.045,k);
  for(let i=0;i<2;i++){const yy=.28+i*.27;box(g,w*.30,yy,d/2+.02,w*.33,.25,.03,'bathWhite',true);panelTrim(g,w*.30,yy,d/2+.039,w*.29,.20,k);handle(g,w*.30,yy+.025,d/2+.052,k);}
  // A genuine recessed ceramic basin, with a hole through the countertop.
  const top=new THREE.Shape();top.moveTo(-w/2,-d/2);top.lineTo(w/2,-d/2);top.lineTo(w/2,d/2);top.quadraticCurveTo(0,d/2+.045,-w/2,d/2);top.closePath();
  const hole=new THREE.Path();hole.absellipse(-w*.10,.015,.23,.162,0,Math.PI*2,true);top.holes.push(hole);
  const geo=new THREE.ExtrudeGeometry(top,{depth:.035,bevelEnabled:true,bevelSegments:2,bevelSize:.008,bevelThickness:.005});geo.rotateX(-Math.PI/2);const counter=new THREE.Mesh(geo,k.materials.bathWhite);counter.position.y=.76;counter.receiveShadow=true;g.add(counter);
  const bowl=new THREE.Mesh(new THREE.LatheGeometry([[0,.625],[.035,.625],[.065,.635],[.10,.655],[.16,.68],[.21,.72],[.23,.76],[.245,.766]].map(p=>new THREE.Vector2(...p)),48),k.materials.bathWhite);bowl.scale.z=.705;bowl.position.set(-w*.1,0,-.015);g.add(bowl);cyl(g,-w*.1,.63,-.015,.026,.026,.008,'bathChrome',24);cyl(g,-w*.1,.634,-.015,.017,.017,.008,'bathBlack',20);
  const fx=-w*.1,fz=-d*.34;box(g,fx,.78,fz,.11,.025,.07,'bathChrome',true);cyl(g,fx,.856,fz,.027,.032,.14,'bathChrome',20);tube(g,[[fx,.88,fz],[fx,.93,fz+.04],[fx,.905,fz+.11]],.028,'bathChrome',k);rod(g,[fx,.94,fz],[fx,.955,fz+.07],.01,'bathChrome');const filter=cyl(g,fx,.877,fz+.12,.031,.029,.065,'bathChrome',24);filter.rotation.x=.6;
  // Mirror cabinet with raised panel and open storage, plus the actual room reflection.
  box(g,0,1.48,-d/2+.027,w,.96,.07,'bathWhite');box(g,w*.33,1.51,-d/2+.10,w*.29,.84,.14,'bathWhite',true);panelTrim(g,w*.33,1.53,-d/2+.178,w*.25,.78,k);
  box(g,w*.33,1.08,-d/2+.11,w*.29,.22,.12,'bathCream');box(g,0,1.005,-d/2+.11,w+.025,.026,.22,'bathWhite');
  const mirror=new Reflector(new THREE.PlaneGeometry(w*.67,.89),{textureWidth:512,textureHeight:640,clipBias:.003,color:0xb7b9b7,multisample:0});mirror.position.set(-w*.155,1.49,-d/2+.071);mirror.userData={dynamic:true,furniture:'浴室镜柜 · 实时镜面',room:'bath'};
  const renderMirror=mirror.onBeforeRender;mirror.onBeforeRender=function(renderer,scene,camera){if(!camera.isPerspectiveCamera)return;const at=new THREE.Vector3();this.getWorldPosition(at);if(camera.position.distanceTo(at)>3)return;renderMirror.call(this,renderer,scene,camera);document.body.dataset.bathMirror='ready';};g.add(mirror);
  for(const [x,h,mat] of [[-.30,.18,'bathPurple'],[-.19,.20,'bathWhite'],[-.085,.21,'bathGreen'],[.04,.17,'bathChrome'],[.18,.19,'bathWhite'],[.32,.14,'bathWine']])bottle(g,x,1.03,-d/2+.16,h,mat,k,.022,false);
  for(const [x,z,h,mat] of [[-.32,.12,.20,'bathOrange'],[-.26,-.05,.17,'bathPink'],[.24,.06,.23,'bathGreen'],[.32,.10,.25,'bathClear'],[.34,-.06,.22,'bathWine']])bottle(g,x,.80,z,h,mat,k,.029);
  box(g,.26,.845,-.12,.18,.06,.10,'bathWine',true);for(let i=0;i<3;i++)bottle(g,.21+i*.046,.87,-.13,.11+i%2*.04,['bathPink','bathChrome','bathBlack'][i],k,.016,false);
  cyl(g,.13,.92,-d*.32,.022,.024,.24,'bathWhite',16);box(g,.13,1.00,-d*.32+.026,.014,.08,.005,'bathBlack',true);
  // Toothbrush dispenser, inverted cups and colorful toothbrushes beside the basin.
  const tooth=new THREE.Group();tooth.position.set(-w/2+.02,0,.03);tooth.rotation.y=Math.PI/2;g.add(tooth);
  box(tooth,0,1.035,0,.37,.19,.085,'bathWhite',true);box(tooth,-.04,1.033,.046,.24,.022,.005,'bathBlack',true);box(tooth,.13,1.04,.050,.055,.15,.01,'bathCream',true);
  for(let i=0;i<4;i++){cyl(tooth,-.135+i*.09,.89,.047,.033,.029,.09,'bathWhite',20);rod(tooth,[-.135+i*.09,.78,.02],[-.135+i*.09,.66,.02],.008,['bathGreen','bathYellow','bathPink','bathBlue'][i]);}
  tube(g,[[-.34,.84,-.14],[-.30,.79,-.08],[-.25,.78,0]],.003,'bathWhite',k);
  // Floor baskets and slippers are tucked underneath, leaving the center passage clear.
  cyl(g,-.23,.095,.02,.11,.10,.18,'bathCream',20);box(g,-.23,.15,.02,.14,.18,.12,'bathBronze');cyl(g,.22,.07,.02,.125,.11,.13,'bathPink',20);box(g,.23,.13,.02,.085,.08,.10,'bathBlue',true);
  for(const x of [-.11,.11]){box(g,x,.028,d/2+.08,.10,.032,.23,'bathCream',true);box(g,x,.061,d/2+.14,.10,.032,.10,'bathCream',true);for(let j=0;j<4;j++)box(g,x-.033+j*.021,.081,d/2+.145,.010,.003,.053,'bathBronze',true);}
}
function shower(g,rx,rz,k){
  const shape=new THREE.Shape();shape.moveTo(0,0);shape.lineTo(rx,0);shape.absellipse(0,0,rx,rz,0,-Math.PI/2,true);shape.lineTo(0,0);
  const trayGeo=new THREE.ExtrudeGeometry(shape,{depth:.035,bevelEnabled:true,bevelSize:.012,bevelThickness:.006,bevelSegments:2});trayGeo.rotateX(-Math.PI/2);const tray=new THREE.Mesh(trayGeo,k.materials.bathWhite);tray.position.y=.026;tray.receiveShadow=true;g.add(tray);
  const arc=(a,y)=>[rx*Math.cos(a),y,rz*Math.sin(a)];
  for(const yy of [.075,2.12])tube(g,Array.from({length:18},(_,i)=>arc(i*Math.PI/34,yy)),.019,'bathWhite',k);
  // Four separately modeled curved glass panels and their aluminum stiles.
  for(let j=0;j<4;j++){const lo=j*Math.PI/8+.005,hi=(j+1)*Math.PI/8-.005,geo=new THREE.CylinderGeometry(1,1,2.04,20,1,true,lo,hi-lo);geo.rotateY(Math.PI/2);geo.scale(rx,1,rz);const p=geo.attributes.position;for(let i=0;i<p.count;i++)p.setZ(i,-p.getZ(i));geo.computeVertexNormals();const pane=new THREE.Mesh(geo,k.materials.bathClear);pane.position.y=1.095;pane.userData={furniture:'弧形淋浴玻璃 · 分片门扇',room:'bath'};g.add(pane);}
  for(const a of [0,Math.PI/8,Math.PI/4,Math.PI*3/8,Math.PI/2]){const p=arc(a,0);k.rod(g,[p[0],.08,p[2]],[p[0],2.12,p[2]],.009,'bathChrome');}
  for(const a of [Math.PI*.24,Math.PI*.29]){const p=arc(a,0);tube(g,[[p[0]+.025,.87,p[2]+.026],[p[0]+.042,.90,p[2]+.045],[p[0]+.042,1.12,p[2]+.045],[p[0]+.025,1.15,p[2]+.026]],.012,'bathChrome',k);}
  k.cyl(g,rx*.36,.071,rz*.47,.033,.033,.008,'bathChrome',24);for(let i=0;i<5;i++)k.box(g,rx*.36-.016+i*.008,.078,rz*.47,.003,.002,.025,'bathBlack');
  // Square rainfall head, handheld shower, rail, mixer shelf and coiled hose.
  const x=rx*.32,z=.06;k.rod(g,[x,.89,z],[x,2.15,z],.013,'bathBlack');tube(g,[[x,2.15,z],[x,2.24,z+.025],[x,2.26,z+.23],[x,2.21,z+.31]],.013,'bathBlack',k);
  k.box(g,x,2.185,z+.30,.29,.032,.29,'bathBlack',true);for(let i=0;i<13;i++)for(let j=0;j<13;j++)k.cyl(g,x-.125+i*.0208,2.163,z+.175+j*.0208,.0028,.0028,.004,'bathCream',6);
  k.box(g,x,1.00,z+.07,.30,.048,.13,'bathBlack',true);for(const xx of [-.12,.12]){const p=k.cyl(g,x+xx,1.00,z+.01,.032,.032,.04,'bathBlack');p.rotation.x=Math.PI/2;}
  const hand=new THREE.Group();hand.position.set(x+.033,1.44,z+.045);hand.rotation.x=-.13;g.add(hand);k.box(hand,0,0,0,.085,.115,.020,'bathBlack',true);k.box(hand,0,-.14,0,.037,.21,.025,'bathBlack',true);for(let i=0;i<6;i++)for(let j=0;j<7;j++)k.ball(hand,-.030+i*.012,-.041+j*.013,.013,.002,.002,.002,'bathCream');
  const coil=Array.from({length:74},(_,i)=>{const a=i/73*Math.PI*10;return[x+.08+Math.cos(a)*.027,.93-i*.004,z+.06+Math.sin(a)*.027];});tube(g,coil,.004,'bathBlack',k);tube(g,[[x+.04,.71,z+.04],[x+.03,1.11,z+.05],[x+.03,1.27,z+.06]],.004,'bathBlack',k);
  // Three triangular corner shelves with pump bottles, sponge and bath brush.
  for(let row=0;row<3;row++){const yy=.86+row*.34,s=.31;const sh=new THREE.Shape();sh.moveTo(.022,.022);sh.lineTo(s,.022);sh.quadraticCurveTo(s,s,.022,s);sh.closePath();const geo=new THREE.ExtrudeGeometry(sh,{depth:.014,bevelEnabled:false});geo.rotateX(Math.PI/2);const shelf=new THREE.Mesh(geo,k.materials.bathChrome);shelf.position.y=yy;g.add(shelf);tube(g,[[s,yy+.045,.025],[s*.83,yy+.045,s*.75],[.025,yy+.045,s]],.007,'bathChrome',k);
    for(let j=0;j<3;j++)bottle(g,.063+j*.083,yy+.02,.070+(j%2)*.08,.19+(row+j)%3*.035,['bathYellow','bathWhite','bathBlue','bathPink'][((row*3)+j)%4],k,.03);
  }
}
export function buildBathroom(g,w,d,k){
  const showerGroup=new THREE.Group();showerGroup.position.set(-w/2,0,-d/2+.045);g.add(showerGroup);shower(showerGroup,M(bathLayout.shower[0]),M(bathLayout.shower[1]),k);
  const v=new THREE.Group();v.position.set(-w/2+.245,0,d/2-.435);v.rotation.y=Math.PI/2;g.add(v);vanity(v,.85,.47,k);
  // The supplied close-ups do not show the toilet: retain its plan position.
  const tx=w/2-.35,tz=-d/2+.36;k.box(g,tx,.59,tz-.15,.34,.45,.18,'bathWhite',true);k.ball(g,tx,.23,tz+.085,.20,.22,.28,'bathWhite');k.torus(g,tx,.435,tz+.10,.165,.026,'bathWhite');k.ball(g,tx,.446,tz+.10,.17,.020,.25,'bathWhite');k.box(g,tx,.829,tz-.15,.064,.007,.028,'bathChrome',true);
  const east=new THREE.Group();east.position.set(w/2-.017,0,0);east.rotation.y=-Math.PI/2;g.add(east);
  wallFan(east,-.38,1.70,0,k);basins(east,.09,1.87,0,k);basins(east,.60,1.85,0,k,true);
  rack(east,-.78,1.87,0,.36,k,['bathTowelCream','bathTowelPink'],true);k.cyl(east,-.78,1.965,.09,.15,.115,.16,'bathBronze',24);
  k.rod(east,[.20,.13,.025],[.20,1.36,.025],.012,'bathChrome');k.box(east,.20,.10,.025,.28,.055,.09,'bathCream',true);
  const south=new THREE.Group();south.position.set(-w/2+.43,0,d/2+.001);south.rotation.y=Math.PI;g.add(south);
  rack(south,-.065,1.83,.018,.55,k,['bathTowelBrown','bathTowelBlue','bathTowelOrange']);
  // Silver cylindrical dryer in its wall cradle, with a red hanging power lead.
  const dryer=k.cyl(south,.37,2.03,.10,.049,.053,.19,'bathChrome',32);dryer.rotation.z=Math.PI/2;k.rod(south,[.355,1.82,.10],[.355,2.02,.10],.022,'bathWhite');k.box(south,.355,2.0,.045,.22,.024,.095,'bathWhite',true);
  tube(south,[[.355,1.82,.10],[.37,1.19,.11],[.39,.89,.085],[.27,.99,.035]],.004,'bathWine',k);k.box(south,.27,1.06,.018,.11,.12,.016,'bathWhite');k.box(south,.27,1.06,.03,.061,.07,.012,'bathTeal');
  // Hooks and hanging towels on the white bathroom door are added with its leaf.
}
export function addBathroomDetails(tall,ceilings,k){
  const {box}=k;
  const addBand=(a,b,c,d)=>{const len=Math.hypot(c-a,d-b),geo=new THREE.PlaneGeometry(M(len),.11);const uv=geo.attributes.uv;for(let i=0;i<uv.count;i++)uv.setX(i,uv.getX(i)*M(len)/.96);const mesh=new THREE.Mesh(geo,k.materials.bathBorder);mesh.position.set(X((a+c)/2),.92,Z((b+d)/2));mesh.rotation.y=a===c?Math.PI/2:0;if(a>c||b>d)mesh.rotation.y+=Math.PI;mesh.userData={furniture:'卫生间花纹瓷砖腰线',room:'bath'};tall.add(mesh);};
  for(const wall of [[526,394,526,520],[639,520,639,394],[529,392,636,392],[587,520,529,520]])addBand(...wall);
  const win=new THREE.Group();win.position.set(X(583),0,Z(379));tall.add(win);const w=M(48),bottom=.62,h=1.77;
  box(win,0,bottom+h/2,0,w,h,.035,'bathWindowGlass');for(const x of [-w/2,w/2])box(win,x,bottom+h/2,0,.04,h,.085,'bathWindow');for(const yy of [bottom,bottom+h,bottom+.66])box(win,0,yy,0,w,.048,.085,'bathWindow');box(win,0,bottom-.01,.11,w+.07,.055,.30,'bathTile');box(win,0,bottom+h/2+.29,.048,w-.09,.007,.010,'bathChrome');
  for(let i=0;i<5;i++)bottle(win,-w*.35+i*w*.17,bottom+.025,.105,.17+i%3*.055,['bathWhite','bathBlue','bathClear','bathWhite','bathWine'][i],k,.025);
  // Warm frosted window, not a view of the exterior room.
  const ceiling=new THREE.Mesh(new THREE.PlaneGeometry(M(117),M(135)),k.materials.bathCeiling);ceiling.rotation.x=Math.PI/2;ceiling.position.set(X(586.5),HEIGHT-.012,Z(454.5));ceilings.add(ceiling);
  const light=new THREE.Group();light.position.set(X(587),HEIGHT-.07,Z(453));ceilings.add(light);box(light,0,0,0,.34,.08,.34,'bathWhite',true);box(light,0,-.045,0,.29,.006,.29,'lamp');
  for(const [a,b,c,d] of [[530,393,636,393],[530,393,530,519],[636,393,636,519],[530,519,636,519]]){const vertical=a===c;box(ceilings,X((a+c)/2),HEIGHT-.06,Z((b+d)/2),M(vertical?3:c-a),.065,M(vertical?d-b:3),'bathCream');}
}
export function addBathroomDoorDetails(pivot,d,w,k){
  const center=-d.hinge*w/2;for(const sign of [-1,1]){
    k.box(pivot,center,1.19,sign*.027,w-.14,1.70,.012,'bathFrosted');k.box(pivot,center,.73,sign*.036,w-.13,.035,.016,'bathWhite');
    for(const xx of [center-(w-.14)/2,center+(w-.14)/2])k.box(pivot,xx,1.19,sign*.035,.027,1.70,.017,'bathWhite');
  }
  // The rail faces the bathroom when closed; shallow hooks also clear the wall when open.
  const hooks=new THREE.Group();hooks.position.set(center,1.96,-.024);pivot.add(hooks);k.rod(hooks,[-w*.36,0,0],[w*.36,0,0],.005,'bathWhite');
  for(let i=0;i<4;i++){const x=-w*.28+i*w*.56/3;tube(hooks,[[x,0,0],[x,-.16,-.006],[x,-.20,-.026],[x,-.12,-.026]],.005,'bathWhite',k);cloth(hooks,x,-.38,-.026,w*.17,.46,['bathTowelCream','bathTowelPink','bathTowelCream','bathTowelBrown'][i],k,.2);}
}
