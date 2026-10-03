import * as THREE from 'three';
import { X,Z,M,HEIGHT,rooms } from './data.js';
import { referencePhotoMaterial } from './artwork.js';

export const masterTypes=new Set(['masterbed','masternight','masterdrawer','masterbay','masterstorage','masterfan','masterac']);
export const cabinetEntry={id:'wardrobe-entry',name:'衣帽间推拉柜门',x:798,z:392,w:66,axis:'z',style:'cabinetSlide',travel:35};
function texture(w,h,draw,repeat=[1,1]){
  const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(...repeat);t.anisotropy=8;return t;
}
export function initMasterMaterials(m){
  const mat=(id,color,extra={})=>m[id]=new THREE.MeshStandardMaterial({color,roughness:.8,...extra});
  mat('masterLeather','#d4c4a3',{roughness:.47});mat('masterBase','#e4d9c0',{roughness:.52});mat('masterPink','#c3a9b4');mat('masterLilac','#a6a0b6');
  mat('masterTaupe','#918778',{roughness:1});mat('masterSheet','#eeebe0',{roughness:1});mat('masterGray','#7b8586');mat('masterYellow','#e2a20d',{roughness:.43});
  mat('masterSheer','#f4f0e6',{transparent:true,opacity:.35,depthWrite:false,roughness:1,side:THREE.DoubleSide});
  mat('masterCrystal','#ebe3cf',{transparent:true,opacity:.53,depthWrite:false,roughness:.18,metalness:.2});
  mat('masterAC','#b5a697',{metalness:.3,roughness:.37});
  const wood=texture(768,768,(ctx,w,h)=>{
    ctx.fillStyle='#984d2d';ctx.fillRect(0,0,w,h);
    for(let row=0;row<8;row++){
      ctx.fillStyle=['#874021','#9d5030','#a75b34','#8b4026'][row%4];ctx.fillRect(0,row*96,w,96);
      for(let j=0;j<50;j++){const y=row*96+j*1.9;ctx.strokeStyle=j%3?'#3e170d36':'#eab27b35';ctx.lineWidth=.6;ctx.beginPath();ctx.moveTo(0,y);ctx.bezierCurveTo(w*.33,y+Math.sin(j*2)*3,w*.67,y+Math.cos(j)*2,w,y);ctx.stroke();}
      ctx.fillStyle='#4f2318';ctx.fillRect(0,row*96,w,1);ctx.fillRect((row%3)*256,row*96,1,96);
    }
  },[1.5,1.5]);mat('masterFloor','#ffffff',{map:wood,roughness:.30});
  const grain=texture(512,512,(ctx,w,h)=>{ctx.fillStyle='#e1ddcc';ctx.fillRect(0,0,w,h);for(let i=0;i<380;i++){const y=i*h/380;ctx.strokeStyle=i%3?'#918b7043':'#faf7e382';ctx.lineWidth=.6;ctx.beginPath();ctx.moveTo(0,y);ctx.bezierCurveTo(w*.3,y+Math.sin(i*.45)*3,w*.7,y+Math.sin(i*.3)*2,w,y);ctx.stroke();}},[2,2]);
  mat('masterCabinet','#f5f0df',{map:grain,roughness:.65,bumpMap:grain,bumpScale:.0006});
  const wallpaper=texture(512,1024,(ctx,w,h)=>{
    ctx.fillStyle='#d7c9b5';ctx.fillRect(0,0,w,h);
    ctx.fillStyle='#87738d';
    for(let i=-1;i<6;i++){
      ctx.beginPath();for(let j=0;j<=100;j++){const y=h*j/100,x=i*103+38*Math.sin(y/h*Math.PI*2+.3);j?ctx.lineTo(x,y):ctx.moveTo(x,y);}
      for(let j=100;j>=0;j--){const y=h*j/100,x=i*103+38*Math.sin(y/h*Math.PI*2+.3)+11+7*Math.sin(y/h*Math.PI*2+1.4);ctx.lineTo(x,y);}ctx.closePath();ctx.fill();
    }
  },[4,1]);mat('masterWallpaper','#fff8ed',{map:wallpaper,roughness:1});
  const floral=texture(768,192,(ctx,w,h)=>{
    ctx.fillStyle='#342b2b';ctx.fillRect(0,0,w,h);ctx.strokeStyle='#b0d6cf';ctx.fillStyle='#b4ded4';ctx.lineWidth=3;
    for(let i=0;i<4;i++){
      const x=i*192;ctx.beginPath();ctx.moveTo(x-20,h);ctx.bezierCurveTo(x+40,h*.15,x+95,h*.9,x+180,0);ctx.stroke();
      for(let j=0;j<5;j++){const xx=x+25+j*31,yy=155-j*27,side=j%2?1:-1;ctx.beginPath();ctx.moveTo(xx,yy);ctx.bezierCurveTo(xx+side*11,yy-40,xx+side*50,yy-28,xx+side*40,yy-46);ctx.bezierCurveTo(xx+side*28,yy-4,xx+side*10,yy-7,xx,yy);ctx.fill();}
      for(let j=0;j<6;j++){const a=j*Math.PI/3;ctx.beginPath();ctx.ellipse(x+105+Math.cos(a)*18,95+Math.sin(a)*18,11,6,a,0,Math.PI*2);ctx.fill();}ctx.beginPath();ctx.arc(x+105,95,5,0,Math.PI*2);ctx.fill();
    }
  });mat('masterFloral','#ffffff',{map:floral,roughness:.65});
  const quilt=texture(512,512,(ctx,w,h)=>{ctx.fillStyle='#c9d2bd';ctx.fillRect(0,0,w,h);ctx.strokeStyle='#71836d';ctx.lineWidth=2;for(let i=0;i<16;i++){const x=(i*83)%w,y=(i*137)%h;ctx.beginPath();ctx.arc(x,y,17,0,Math.PI*1.7);ctx.stroke();for(let j=0;j<4;j++){ctx.beginPath();ctx.ellipse(x+j*9,y-22-j*10,4,9,-.5,0,Math.PI*2);ctx.stroke();}}},[2,2]);mat('masterQuilt','#e0e6d0',{map:quilt,roughness:1,side:THREE.DoubleSide});
  const stripes=texture(256,256,(ctx,w,h)=>{ctx.fillStyle='#b9c2ba';ctx.fillRect(0,0,w,h);for(let x=0;x<w;x+=15){ctx.fillStyle='#dedfd4';ctx.fillRect(x,0,5,h);}},[2,1]);mat('masterPillow','#d8d8cd',{map:stripes,roughness:1});
  m.masterPoster=referencePhotoMaterial(window.__MASTER_PHOTOS?.door||'/public/master/door.jpg',[[0,1,813,730],[1,1,1045,786],[1,0,1007,1514],[0,0,751,1341]],[1280,1707],'masterPoster');
}
function cloth(g,x,y,z,w,d,material,k,rotation=0,rumple=.055,mound=.06){
  const geo=new THREE.PlaneGeometry(w,d,44,46);geo.rotateX(-Math.PI/2);const p=geo.attributes.position;
  for(let i=0;i<p.count;i++){const xx=p.getX(i),zz=p.getZ(i),u=xx/w,v=zz/d;const folds=(Math.sin(xx*27+zz*13)+Math.sin(zz*32-xx*7)*.45)*rumple;const center=Math.exp(-((u-.1)**2*17+(v+.07)**2*14))*mound;p.setY(i,folds+center);p.setX(i,xx+Math.sin(zz*18)*.012);}
  geo.computeVertexNormals();const mesh=new THREE.Mesh(geo,k.materials[material]);mesh.position.set(x,y,z);mesh.rotation.y=rotation;mesh.castShadow=true;mesh.receiveShadow=true;g.add(mesh);return mesh;
}
function star(g,x,y,z,k){
  const s=new THREE.Shape();for(let i=0;i<10;i++){const a=Math.PI/2+i*Math.PI/5,r=i%2?.044:.094;const px=Math.cos(a)*r,py=Math.sin(a)*r;i?s.lineTo(px,py):s.moveTo(px,py);}s.closePath();
  const geo=new THREE.ExtrudeGeometry(s,{depth:.035,bevelEnabled:true,bevelSize:.006,bevelThickness:.006,bevelSegments:2});const m=new THREE.Mesh(geo,k.materials.masterYellow);m.position.set(x,y,z);g.add(m);
  for(const sign of [-1,1])k.box(g,x+sign*.023,y+.01,z+.043,.010,.034,.007,'black',true);
}
function bed(g,w,d,k){
  const {box,ball,rod}=k;
  for(const x of [-w/2+.10,w/2-.10])for(const z of [-d/2+.12,d/2-.12])box(g,x,.07,z,.07,.14,.07,'metal');
  box(g,0,.27,0,w,.32,d,'masterBase',true);box(g,0,.49,.015,w-.015,.18,d-.015,'masterSheet',true);
  box(g,0,.72,-d/2+.035,w+.15,1.22,.14,'masterLeather',true);
  for(let i=0;i<3;i++){
    const x=-w/2+w/3*(i+.5),panel=box(g,x,.98,-d/2+.135,w/3-.018,.71,.16,'masterLeather',true);panel.rotation.x=-.10;
    for(let j=0;j<5;j++){const xx=x-w/6+.06+j*(w/3-.12)/4;const crease=ball(g,xx,.97,-d/2+.218,.007,.23,.006,'masterLeather');crease.rotation.z=Math.sin(j)*.13;}
    rod(g,[x-w/6+.02,.66,-d/2+.215],[x-w/6+.02,1.29,-d/2+.14],.003,'masterBase');
  }
  for(const sign of [-1,1]){ball(g,sign*(w/2+.07),.81,-d/2+.1,.07,.44,.105,'masterLeather');box(g,sign*w/2,.45,0,.018,.028,d-.12,'masterLeather',true);}
  box(g,0,.588,.015,w-.035,.016,d-.04,'masterSheet',true);
  for(const [x,mat,rot] of [[-.48,'masterPink',.10],[.49,'masterPillow',-.14]]){const p=box(g,x,.69,-d*.32,.62,.17,.43,mat,true);p.rotation.set(-.12,rot,0);}
  const accent=box(g,.19,.76,-d*.32,.35,.34,.12,'masterQuilt',true);accent.rotation.z=.25;
  // Neatly spread bedding replaces the photographed heap of rumpled fabrics.
  box(g,0,.619,d*.125,w-.06,.044,d*.70,'masterQuilt',true);
  star(g,w*.33,1.34,-d/2+.18,k);
  // Two upholstered safety rails on the window side, as visible in the photographs.
  for(const [z,mat] of [[-d*.13,'masterPink'],[d*.29,'masterGray']]){
    const xx=w/2+.035;box(g,xx,.805,z,.058,.33,.65,mat,true);
    for(const zz of [z-.27,z+.27])rod(g,[xx,.44,zz],[xx,1.05,zz],.012,'studyFrame');
    const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(xx,.97,z-.21),new THREE.Vector3(xx,1.10,z-.19),new THREE.Vector3(xx,1.10,z+.19),new THREE.Vector3(xx,.97,z+.21)]);
    const handle=new THREE.Mesh(new THREE.TubeGeometry(curve,20,.012,8,false),k.materials.studyFrame);g.add(handle);
  }
}
function night(g,w,d,k){
  const {box,rod,cyl}=k;box(g,0,.30,0,w,.57,d,'masterLeather',true);box(g,0,.598,0,w+.01,.028,d+.01,'masterLeather',true);
  for(let i=0;i<2;i++){const yy=.18+i*.22;box(g,0,yy,d/2+.012,w-.04,.205,.025,'masterLeather',true);rod(g,[-.09,yy+.02,d/2+.032],[.09,yy+.02,d/2+.032],.006,'gold');}
  box(g,-w*.15,.75,-d*.16,.25,.26,.02,'studyPaper');for(let i=0;i<4;i++)box(g,-w*.15,.75-i*.037,-d*.16+.014,.19,.004,.002,'masterLilac');
  for(const side of [-1,1])rod(g,[side*w*.36,.61,d*.22],[side*w*.36,.77,d*.22],.005,'studyFrame');box(g,0,.625,d*.14,w*.7,.018,d*.6,'studyClear');
  box(g,w*.18,.635,d*.17,.13,.024,.065,'black',true);cyl(g,w*.28,.77,-d*.22,.018,.018,.27,'masterSheet');
  rod(g,[0,.63,d*.19],[.15,.69,d*.30],.003,'masterSheet');
}
function drawers(g,w,d,k){
  k.box(g,0,.40,0,w,.77,d,'masterBase',true);for(let i=0;i<3;i++){const yy=.16+i*.235;k.box(g,0,yy,d/2+.008,w-.055,.205,.016,i%2?'masterPink':'masterLilac',true);k.box(g,0,yy+.04,d/2+.021,.14,.022,.025,'masterBase',true);}
  cloth(g,0,.813,0,w+.035,d+.025,'masterQuilt',k,0,.008,.006);
}
function fan(g,w,d,k){
  const {box,cyl,rod,torus}=k;box(g,0,.24,0,.42,.45,.36,'masterBase');box(g,0,.48,0,.44,.03,.38,'masterSheet');
  cyl(g,0,.523,0,.185,.19,.05,'masterBase',32);rod(g,[0,.54,.04],[0,1.06,.02],.025,'masterBase');
  const f=new THREE.Group();f.position.set(0,1.15,0);g.add(f);f.rotation.y=Math.PI/2+.25;
  const housing=cyl(f,0,0,.045,.20,.185,.17,'masterBase',48);housing.rotation.x=Math.PI/2;
  for(let i=0;i<5;i++){const a=i*Math.PI*2/5;const b=box(f,Math.cos(a)*.095,Math.sin(a)*.095,-.048,.16,.07,.008,'masterLilac',true);b.rotation.z=a+.4;}
  for(let i=0;i<6;i++)torus(f,0,0,-.058,.06+i*.027,.003,'masterBase',[0,0,0]);
  for(let i=0;i<28;i++){const a=i*Math.PI/14;rod(f,[Math.cos(a)*.035,Math.sin(a)*.035,-.062],[Math.cos(a)*.194,Math.sin(a)*.194,-.062],.0025,'masterBase');}
  const hub=cyl(f,0,0,-.072,.039,.039,.024,'masterBase',24);hub.rotation.x=Math.PI/2;cyl(g,.02,.555,-.055,.026,.026,.008,'black',24);
}
function storage(g,w,d,k){
  const {box,rod,ball}=k;box(g,-w*.16,.29,-d*.08,.35,.53,.30,'masterYellow',true);for(let i=0;i<4;i++)box(g,-w*.16-.12+i*.08,.30,-d*.08+.157,.010,.43,.008,'gold',true);
  for(const x of [-w*.16-.13,-w*.16+.13]){ball(g,x,.03,-d*.08+.08,.026,.035,.026,'black');rod(g,[x,.48,-d*.08],[x,.66,-d*.08],.007,'studyFrame');}rod(g,[-w*.16-.13,.66,-d*.08],[-w*.16+.13,.66,-d*.08],.011,'black');
  box(g,w*.31,.37,-d*.08,.24,.69,.30,'masterSheet',true);for(let i=0;i<3;i++){box(g,w*.31,.18+i*.19,d*.1,.22,.17,.02,'masterBase',true);box(g,w*.31,.19+i*.19,d*.1+.018,.075,.009,.02,'studyWood');}
  cloth(g,w*.31,.725,-d*.08,.28,.32,'masterPink',k,0,.015,.025);
}
function ac(g,w,d,k){
  k.box(g,0,2.22,0,w,.34,.22,'masterAC',true);k.box(g,0,2.105,-.112,w-.08,.045,.02,'masterBase',true);for(let i=0;i<5;i++)k.box(g,0,2.088+i*.012,-.124,w-.10,.004,.009,'studyFrame');
  k.box(g,w*.36,2.205,-.114,.014,.012,.004,'lamp');k.box(g,-w*.36,2.275,-.113,.10,.14,.004,'studyPaper');
  k.rod(g,[w*.38,2.10,.025],[w*.38+.09,1.84,.05],.028,'masterBase');k.rod(g,[w*.38+.09,1.84,.05],[w*.38+.11,1.64,.05],.012,'masterBase');
}
export function buildMasterFurniture(g,w,d,type,k){
  if(type==='masterbed')bed(g,w,d,k);else if(type==='masternight')night(g,w,d,k);else if(type==='masterdrawer')drawers(g,w,d,k);else if(type==='masterfan')fan(g,w,d,k);else if(type==='masterstorage')storage(g,w,d,k);else if(type==='masterac')ac(g,w,d,k);
  else if(type==='masterbay'){
    k.box(g,0,.53,0,w,.06,d,'masterBase');for(let i=0;i<3;i++)cloth(g,0,.59,-d*.29+i*d*.29,w*.80,d*.36,i%2?'masterSheet':'masterPink',k,0,.021,.11);
  }
}
export function createCabinetEntry(root,k){
  const {box}=k,data=cabinetEntry,g=new THREE.Group();g.position.set(X(data.x),0,Z(data.z));g.name=data.name;root.add(g);
  const h=2.62,span=M(150),opening=M(data.w),side=(span-opening)/2;
  for(const zz of [-span/2,span/2])box(g,0,h/2,zz,.15,h,.045,'masterCabinet');
  for(const y of [.028,h-.022]){box(g,0,y,0,.15,.042,span,'masterCabinet');for(const xx of [-.034,.014,.055])box(g,xx,y-.005,0,.008,.010,span,'studyFrame');}
  const panel=(parent,z,width,front)=>{
    box(parent,front,h/2,z,.040,h-.085,width,'masterCabinet');
    const band=new THREE.Mesh(new THREE.PlaneGeometry(width-.027,.32),k.materials.masterFloral);band.rotation.y=Math.PI/2;band.position.set(front+.022,1.08,z);parent.add(band);
    for(const zz of [z-width/2+.01,z+width/2-.01])box(parent,front+.024,h/2,zz,.012,h-.09,.012,'masterBase');
  };
  for(const sign of [-1,1])panel(g,sign*(opening/2+side/2),side+.028,-.028);
  const leaves=[];
  for(const sign of [-1,1]){
    const leaf=new THREE.Group();leaf.userData.sign=sign;leaf.userData.closedZ=sign*opening/4;leaf.position.z=leaf.userData.closedZ;g.add(leaf);
    panel(leaf,0,opening/2+.024,.027);for(const y of [.95,1.15])box(leaf,.060,y,-sign*(opening/4-.023),.013,.10,.020,'studyFrame');
    leaf.traverse(m=>{if(m.isMesh)m.userData={door:data.id,furniture:data.name};});leaves.push(leaf);
  }
  return {data,group:g,leaves,open:false,target:0,progress:0};
}
export function addMasterDetails(tall,ceilings,k){
  const {box,ball,cyl,rod,torus}=k;
  const curtain=new THREE.Group();curtain.position.set(X(1044),0,Z(400));curtain.rotation.y=Math.PI/2;tall.add(curtain);const width=M(122);
  rod(curtain,[-width/2-.10,2.57,0],[width/2+.10,2.57,0],.019,'masterBase');
  for(const sign of [-1,1])for(let i=0;i<12;i++){
    const xx=sign*(width*.43)+(i-5.5)*.028;
    box(curtain,xx,1.28,.08+Math.sin(i*1.8)*.045,.047,2.50,.046,'masterTaupe',true);torus(curtain,xx,2.55,0,.038,.009,'masterBase',[0,Math.PI/2,0]);
    const yy=2.22+Math.sin(i*Math.PI/11)*.045;ball(curtain,xx,yy,.127,.010,.020,.010,'gold');rod(curtain,[xx,yy,.13],[xx,yy-.08,.13],.004,'gold');cyl(curtain,xx,yy-.13,.13,.014,.032,.10,'studyWood',10);
  }
  const sheerGeo=new THREE.PlaneGeometry(width*1.03,1.97,48,1),p=sheerGeo.attributes.position;for(let i=0;i<p.count;i++)p.setZ(i,.18+Math.sin(p.getX(i)*33)*.02);sheerGeo.computeVertexNormals();const sheer=new THREE.Mesh(sheerGeo,k.materials.masterSheer);sheer.position.y=1.43;curtain.add(sheer);
  curtain.traverse(m=>{if(m.isMesh)m.userData={room:'master',furniture:'主卧 · 米色环扣流苏窗帘与白纱'};});
  // White stepped crown moulding, textured walls and dark wooden skirting.
  const r=rooms.find(r=>r.id==='master');for(let i=0;i<r.poly.length;i++){
    const a=r.poly[i],b=r.poly[(i+1)%r.poly.length],vertical=a[0]===b[0],len=M(Math.abs(vertical?b[1]-a[1]:b[0]-a[0]));
    for(let j=0;j<3;j++)box(ceilings,X((a[0]+b[0])/2),HEIGHT-.033-j*.026,Z((a[1]+b[1])/2),vertical?.04+j*.016:len,.022,vertical?len:.04+j*.016,'masterBase');
  }
  for(const [a,b,c,d] of [[799,327,1054,327],[1056,477,1056,537],[799,536,1054,536]]){const vertical=a===c;box(tall,X((a+c)/2),.065,Z((b+d)/2),M(vertical?2:c-a),.13,M(vertical?d-b:2),'studyWood');}
  const lamp=new THREE.Group();lamp.position.set(X(918),HEIGHT-.29,Z(431));ceilings.add(lamp);cyl(lamp,0,.24,0,.08,.08,.042,'gold',32);rod(lamp,[0,.23,0],[0,.13,0],.025,'gold');cyl(lamp,0,.095,0,.28,.31,.045,'gold',48);torus(lamp,0,.074,0,.312,.022,'gold');
  const geo=new THREE.SphereGeometry(.315,56,24,0,Math.PI*2,Math.PI/2,Math.PI/2),pos=geo.attributes.position;
  for(let i=0;i<pos.count;i++){const x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i),a=Math.atan2(z,x),rib=1+.055*Math.cos(a*12);pos.setXYZ(i,x*rib,y*.64,z*rib);}geo.computeVertexNormals();const shade=new THREE.Mesh(geo,k.materials.masterCrystal);lamp.add(shade);
  for(let i=0;i<12;i++){const a=i*Math.PI/6,curve=new THREE.CatmullRomCurve3([new THREE.Vector3(Math.cos(a)*.307,0,Math.sin(a)*.307),new THREE.Vector3(Math.cos(a)*.24,-.13,Math.sin(a)*.24),new THREE.Vector3(Math.cos(a)*.045,-.205,Math.sin(a)*.045)]);const rib=new THREE.Mesh(new THREE.TubeGeometry(curve,16,.005,6,false),k.materials.gold);lamp.add(rib);}
  ball(lamp,0,-.207,0,.034,.024,.034,'gold');cyl(lamp,0,.025,0,.22,.24,.032,'lamp',40);
}
