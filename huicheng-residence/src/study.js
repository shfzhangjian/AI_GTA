import * as THREE from 'three';
import { X,Z,M,HEIGHT,rooms } from './data.js';
import { referencePhotoMaterial } from './artwork.js';

export const studyTypes=new Set(['studybookcase','studybed','studydesk','studyfiling','studybay','studyac','studyaccessories']);
const palette=['#eee8db','#398497','#b63845','#d6a447','#466767','#7b658a','#2d4f74','#ececec'];
function canvasTexture(w,h,draw,repeat=[1,1]) {
  const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;draw(canvas.getContext('2d'),w,h);
  const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(...repeat);t.anisotropy=8;return t;
}
export function initStudyMaterials(m) {
  const material=(id,color,extra={})=>m[id]=new THREE.MeshStandardMaterial({color,roughness:.7,...extra});
  material('studyWhite','#e8e7df',{roughness:.45});material('studyFrame','#a3afaa',{metalness:.52,roughness:.38});
  material('studyWood','#602d20',{roughness:.40});material('studyPaper','#e9e6d9');material('studyNavy','#263947');
  material('studyTeal','#2893a2');material('studyCurtain','#85878a',{roughness:1});material('studySilver','#a49f92',{metalness:.55,roughness:.36});
  material('studyClear','#b6c3c6',{transparent:true,opacity:.12,depthWrite:false,roughness:.28,side:THREE.DoubleSide});
  material('studyGlass','#b2c4c0',{transparent:true,opacity:.10,depthWrite:false,roughness:.14,side:THREE.DoubleSide});
  material('studySheer','#eeede7',{transparent:true,opacity:.38,depthWrite:false,side:THREE.DoubleSide,roughness:1});
  const wood=canvasTexture(768,768,(ctx,w,h)=>{
    ctx.fillStyle='#78362a';ctx.fillRect(0,0,w,h);
    for(let row=0;row<8;row++){
      ctx.fillStyle=['#6d2b20','#79362a','#823b2b','#65291e'][row%4];ctx.fillRect(0,row*96,w,96);
      for(let j=0;j<48;j++){ctx.strokeStyle=j%2?'#c68a5b28':'#31100b3b';ctx.lineWidth=.5;const yy=row*96+j*2;
        ctx.beginPath();ctx.moveTo(0,yy);ctx.bezierCurveTo(w*.33,yy+Math.sin(j)*2,w*.7,yy+Math.cos(j*3)*3,w,yy);ctx.stroke();}
      ctx.fillStyle='#351810';ctx.fillRect(0,row*96,w,1.1);ctx.fillRect((row%3)*256,row*96,1,96);
    }
  },[1.6,1.6]);
  material('studyFloor','#ffffff',{map:wood,roughness:.40});
  const waffle=canvasTexture(512,512,(ctx)=>{ctx.fillStyle='#c6dce2';ctx.fillRect(0,0,512,512);for(let y=0;y<512;y+=32)for(let x=0;x<512;x+=32){ctx.fillStyle='#e3eff0';ctx.fillRect(x+2,y+2,28,28);ctx.fillStyle='#adc7d1';ctx.fillRect(x+6,y+6,20,20);ctx.fillStyle='#c7dce2';ctx.fillRect(x+9,y+9,14,14);}},[7,9]);
  material('studyCover','#b4d0d8',{map:waffle,bumpMap:waffle,bumpScale:.004,roughness:.98});
  const ribbing=canvasTexture(256,256,(ctx)=>{ctx.fillStyle='#c6d1ce';ctx.fillRect(0,0,256,256);for(let x=0;x<256;x+=5){ctx.fillStyle='#e6e9e4';ctx.fillRect(x,0,1,256);ctx.fillStyle='#8c999d';ctx.fillRect(x+2,0,1,256);}},[3,1]);
  material('studyRibbed','#c3ccca',{map:ribbing,transparent:true,opacity:.50,depthWrite:false,roughness:.54});
  const globe=canvasTexture(512,256,(ctx,w,h)=>{
    ctx.fillStyle='#2195c8';ctx.fillRect(0,0,w,h);ctx.strokeStyle='#c1e7ec65';ctx.lineWidth=.7;
    for(let x=0;x<w;x+=32){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke();}for(let y=0;y<h;y+=32){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();}
    const continents=[[[28,42],[62,30],[104,56],[90,95],[65,112],[56,92],[23,70]],[[93,118],[116,133],[116,157],[105,206],[86,220],[79,164]],[[235,57],[263,45],[276,68],[260,91],[243,84]],[[246,93],[278,85],[294,121],[276,163],[252,171],[232,123]],[[275,45],[351,31],[410,48],[434,75],[395,86],[370,110],[330,112],[309,90],[283,79]],[[387,162],[425,160],[450,185],[409,203],[392,186]]];
    continents.forEach(p=>{ctx.fillStyle='#b8b46f';ctx.beginPath();ctx.moveTo((p[0][0]+p.at(-1)[0])/2,(p[0][1]+p.at(-1)[1])/2);p.forEach(([x,y],i)=>{const next=p[(i+1)%p.length];ctx.quadraticCurveTo(x,y,(x+next[0])/2,(y+next[1])/2);});ctx.closePath();ctx.fill();ctx.strokeStyle='#587968';ctx.stroke();});
    ctx.fillStyle='#e6e7d1';ctx.font='5px sans-serif';ctx.textAlign='center';for(const [label,x,y] of [['NORTH AMERICA',62,65],['SOUTH AMERICA',100,148],['EUROPE',252,69],['AFRICA',266,125],['ASIA',353,66],['AUSTRALIA',418,183],['PACIFIC OCEAN',173,130],['ATLANTIC',191,108]])ctx.fillText(label,x,y);
  });material('studyGlobe','#ffffff',{map:globe,roughness:.50});
  palette.forEach((color,i)=>{
    const spine=canvasTexture(64,256,(ctx)=>{ctx.fillStyle=color;ctx.fillRect(0,0,64,256);ctx.fillStyle=i%2?'#eef1e9':'#53625d';ctx.fillRect(12,16,40,3);ctx.font='14px sans-serif';ctx.textAlign='center';const title=['阅读','笔记','语文','数学','练习','绘本','百科','资料'][i];[...title].forEach((s,j)=>ctx.fillText(s,32,63+j*22));for(let j=0;j<3;j++)ctx.fillRect(20,184+j*7,24-j*4,2);});
    material(`studyBook${i}`,'#b8b8b8',{map:spine,roughness:.85});
  });
  const clock=canvasTexture(256,256,(ctx)=>{ctx.fillStyle='#ececdd';ctx.fillRect(0,0,256,256);ctx.strokeStyle='#293a37';ctx.fillStyle='#293a37';ctx.font='22px serif';ctx.textAlign='center';ctx.textBaseline='middle';for(let n=1;n<=12;n++){const a=n*Math.PI/6;ctx.fillText(String(n),128+Math.sin(a)*90,128-Math.cos(a)*90);}ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(128,128);ctx.lineTo(128,70);ctx.moveTo(128,128);ctx.lineTo(182,145);ctx.stroke();ctx.lineWidth=2;ctx.strokeStyle='#b65040';ctx.beginPath();ctx.moveTo(128,128);ctx.lineTo(84,192);ctx.stroke();});
  m.studyClock=new THREE.MeshBasicMaterial({map:clock,toneMapped:false});
  m.studyFamily=referencePhotoMaterial(window.__STUDY_PHOTOS?.family||'/public/study/family.jpg',[[0,1,511,479],[1,1,640,510],[1,0,639,697],[0,0,510,685]],[1280,1707],'studyFamily');
  m.studyCalendar=referencePhotoMaterial(window.__STUDY_PHOTOS?.cabinet||'/public/study/cabinet.jpg',[[0,1,354,931],[1,1,520,934],[1,0,515,1145],[0,0,349,1150]],[1280,1707],'studyCalendar');
  m.studyBookCover=referencePhotoMaterial(window.__STUDY_PHOTOS?.cabinet||'/public/study/cabinet.jpg',[[0,1,510,665],[1,1,573,674],[1,0,578,794],[0,0,510,791]],[1280,1707]);
}
function book(g,x,bottom,z,w,h,d,index,k,tilt=0,front=1) {
  const {box}=k,b=new THREE.Group();b.position.set(x,bottom,z);b.rotation.z=tilt;g.add(b);
  box(b,0,h/2,0,w,h,d,`studyBook${index%8}`);
  box(b,0,h/2,-front*d*.48,w*.85,h-.014,.007,'studyPaper');return b;
}
function stack(g,x,y,z,count,k,index=0,width=.26,depth=.19) {
  for(let j=0;j<count;j++){k.box(g,x+(j%2)*.009,y+j*.023+.011,z,width,.023,depth,`studyBook${(j+index)%8}`);k.box(g,x,y+j*.023+.011,z-depth/2-.003,width*.92,.015,.003,'studyPaper');}
}
function clearCube(g,x,y,z,w,h,d,k) {
  const {box,rod}=k;box(g,x,y+h/2,z,w,h,d,'studyClear');
  for(const sx of [-1,1])for(const sz of [-1,1])rod(g,[x+sx*w/2,y,z+sz*d/2],[x+sx*w/2,y+h,z+sz*d/2],.006,'studyFrame');
  for(const yy of [y,y+h])for(const sx of [-1,1])rod(g,[x+sx*w/2,yy,z-d/2],[x+sx*w/2,yy,z+d/2],.006,'studyFrame');
  box(g,x,y+.012,z,w,.016,d,'studyClear');
}
function studyBookcase(g,w,d,k) {
  const {box,ball,cyl,rod}=k,h=2.13,base=.56,n=4;
  box(g,0,h/2,-d/2+.015,w,h,.03,'studyWhite');box(g,0,.05,0,w,.08,d,'studyFrame');
  for(let i=0;i<=n;i++)box(g,-w/2+i*w/n,h/2,0,.027,h,d,'studyWhite');
  for(const y of [base,.95,1.34,1.73,2.11])box(g,0,y,0,w,.025,d,'studyWhite');
  for(let col=0;col<n;col++){
    const xx=-w/2+(col+.5)*w/n,cw=w/n-.036;
    box(g,xx,.30,d/2+.013,cw,.51,.027,'studyWhite');
    for(let row=0;row<4;row++){
      const y=base+.022+row*.39;
      if((col+row)%3===0){stack(g,xx,y+.02,-.02,7,k,row+col,cw-.07,d-.05);for(let j=0;j<3;j++)book(g,xx-cw*.31+j*.055,y+.19,-.04,.04,.16,d-.11,j+row,k,(j-1)*.05);}
      else for(let j=0;j<8;j++)book(g,xx-cw*.38+j*cw*.094,y,-.04,.03+(j%3)*.005,.21+(j%5)*.025,d-.10,col*3+row+j,k,j>4?-.10-(j%3)*.04:.035);
    }
    const front=d/2+.019;
    box(g,xx,(base+h)/2,front,cw-.030,h-base-.03,.009,'studyGlass');
    for(const sx of [-1,1])box(g,xx+sx*cw/2,(base+h)/2,front,.021,h-base,.027,'studyFrame');
    for(const y of [base,h])box(g,xx,y,front,cw,.022,.027,'studyFrame');
    ball(g,xx+(col%2?-.12:.12),1.25,front+.025,.017,.017,.012,'studyFrame');
  }
  // Recognizable small toys remain among the books behind the glazed doors.
  const bx=w*.37,by=.97;
  ball(g,bx,by+.22,.11,.06,.065,.055,'studyWhite');for(const x of [bx-.025,bx+.025])ball(g,x,by+.305,.11,.014,.065,.013,'studyWhite');
  ball(g,bx,by+.10,.11,.065,.10,.050,'studyBook3');box(g,bx,by+.015,.11,.11,.08,.085,'studyBook6',true);
  for(let j=0;j<4;j++)box(g,bx,by+.055+j*.028,.157,.098,.012,.006,'studyWhite');
  for(const sign of [-1,1])ball(g,bx+sign*.071,by+.11,.10,.015,.065,.016,'studyWhite');
  for(const x of [bx-.020,bx+.020])ball(g,x,by+.23,.164,.004,.004,.002,'black');
  rod(g,[bx-.006,by+.203,.166],[bx+.006,by+.193,.166],.002,'black');rod(g,[bx+.006,by+.203,.166],[bx-.006,by+.193,.166],.002,'black');
  box(g,-w*.12,1.125,d/2-.075,.22,.32,.058,'studyPaper');box(g,-w*.12,1.125,d/2-.044,.22,.32,.004,'studyBookCover');
  const rx=w*.09;box(g,rx,1.85,.06,.11,.14,.08,'black');box(g,rx,1.97,.06,.07,.06,.07,'black');for(const s of [-1,1]){box(g,rx+s*.075,1.83,.06,.04,.15,.04,'studyFrame');box(g,rx+s*.036,1.74,.06,.04,.1,.045,'black');}
  ball(g,-w*.39,1.04,.13,.046,.055,.042,'studyBook3');ball(g,-w*.38,1.11,.15,.036,.037,.030,'studyBook3');
  // Calendar retains the original photograph as a projectively mapped texture.
  box(g,-w*.12,.92,d/2+.07,.29,.39,.008,'studyCalendar');
  for(const y of [.715,1.125])box(g,-w*.12,y,d/2+.073,.31,.015,.018,'wood');
  rod(g,[-w*.12-.12,1.13,d/2+.07],[-w*.12,1.31,d/2+.07],.003,'studyBook2');rod(g,[-w*.12+.12,1.13,d/2+.07],[-w*.12,1.31,d/2+.07],.003,'studyBook2');
  box(g,-w*.12,.63,d/2+.073,.03,.12,.006,'studyBook2');ball(g,-w*.12,.69,d/2+.075,.027,.027,.004,'gold');
  clearCube(g,w*.33,h+.025,0,.19,.23,.18,k);box(g,w*.33,h+.14,0,.085,.15,.075,'black');
  box(g,-w*.05,h+.095,0,.28,.16,.21,'studyClear',true);box(g,-w*.05,h+.18,0,.29,.025,.22,'studyBook3',true);
  box(g,-w*.05,h+.07,0,.19,.10,.15,'studyPaper');
  for(const sx of [-1,1])for(const sz of [-1,1])box(g,-w*.05+sx*.135,h+.095,sz*.10,.006,.16,.006,'studyWhite');
}
function studyBed(g,w,d,k) {
  const {box,rod,torus}=k;
  box(g,0,.235,0,w,.43,d,'studyWhite',true);box(g,0,.465,0,w-.018,.16,d-.02,'fabric',true);
  box(g,0,.555,0,w,.025,d,'studyCover',true);box(g,0,.493,d/2,.99*w,.02,.009,'linen');
  box(g,0,.72,-d/2+.026,w+.035,1.03,.08,'studyWhite',true);
  box(g,0,.92,-d/2+.075,w-.016,.39,.028,'studyWhite',true);box(g,0,.605,-d/2+.075,w-.016,.23,.028,'studyWhite',true);
  rod(g,[-w/2,.714,-d/2+.092],[w/2,.714,-d/2+.092],.0035,'studyFrame');
  for(const z of [-d*.245,d*.245]){
    box(g,-w/2-.004,.25,z,.016,.31,d*.475,'studyWhite');
    torus(g,-w/2-.020,.28,z,.062,.004,'studyFrame',[0,Math.PI/2,0]);
    box(g,-w/2-.025,.321,z,.013,.065,.13,'studyWhite');
  }
  // Rolled spare mattress between the bed and the bookcase.
  box(g,-w/2-.065,.55,-d*.29,.11,1.03,.22,'fabric',true);
}
function studyDesk(g,w,d,k) {
  const {box,ball,cyl,rod,torus}=k,main=2.10,back=d/2,mainX=-w/2+main/2,extension=w-main;
  box(g,mainX,.78,back-.31,main,.052,.62,'studyWhite');box(g,w/2-extension/2,.70,back-.21,extension,.044,.42,'studyWhite');
  for(const x of [-w/2+.045,-w/2+main-.055,w/2-.045])for(const z of [back-.40,back-.06])box(g,x,.37,z,.038,.72,.038,'studyFrame');
  box(g,0,.59,back-.05,w-.09,.07,.035,'studyWhite');
  const mx=-w/2+1.06,mz=back-.29;
  cyl(g,mx,.825,mz,.11,.12,.028,'studyWhite');rod(g,[mx,.83,mz],[mx,1.00,mz+.03],.015,'studyFrame');
  const tablet=box(g,mx,1.01,mz+.03,.34,.245,.025,'studyWhite',true);tablet.rotation.x=.07;
  box(g,mx,1.01,mz+.013,.312,.219,.007,'mirror');box(g,mx,1.126,mz+.008,.042,.013,.007,'studyFrame');
  // Slim white LED lamp, rather than the former decorative table lamp.
  const lz=back-.095;rod(g,[mx-.04,.80,lz],[mx-.04,1.28,lz],.009,'studyWhite');box(g,mx+.08,1.28,lz-.08,.35,.018,.026,'studyWhite',true);box(g,mx+.08,1.268,lz-.08,.30,.006,.020,'lamp');
  // Tidy piles leave the middle of the desk usable.
  stack(g,mainX+.31,.812,back-.44,2,k,3,.26,.21);stack(g,mainX-.53,.812,back-.43,3,k,5,.29,.22);
  for(const sign of [-1,1]){
    const xx=mx+sign*.56;box(g,xx,.92,back-.14,.10,.27,.22,'wood');
    for(let j=0;j<7;j++)book(g,xx+sign*(.08+j*.034),.814,back-.14,.028,.24+(j%3)*.025,.21,j+3,k,-sign*.12,-1);
  }
  const cx=mx-.34,cz=back-.12;const clock=cyl(g,cx,.92,cz,.085,.085,.046,'studyNavy',32);clock.rotation.x=Math.PI/2;
  const face=new THREE.Mesh(new THREE.CircleGeometry(.077,32),k.materials.studyClock);face.rotation.y=Math.PI;face.position.set(cx,.92,cz-.026);g.add(face);
  for(const s of [-1,1]){ball(g,cx+s*.063,1.005,cz,.045,.022,.036,'studyNavy');rod(g,[cx+s*.054,.84,cz],[cx+s*.063,.816,cz-.02],.010,'studyFrame');}
  rod(g,[mx+.165,1.01,mz],[mx+.19,.80,mz-.03],.003,'studyWhite');rod(g,[mx+.19,.80,mz-.03],[mx+.46,.797,back-.04],.003,'studyWhite');
  // Transparent three-cube book tower and the adjacent two-cube globe rack.
  const tx=w/2-.87,tz=back-.22;
  for(let row=0;row<3;row++){const y=.733+row*.30;clearCube(g,tx,y,tz,.33,.30,.30,k);if(row===2)for(let j=0;j<7;j++)book(g,tx-.125+j*.038,y+.02,tz,.024,.25,.235,j+1,k,.04,-1);else{stack(g,tx,y+.04,tz,4,k,row,.28,.23);box(g,tx,y+.17,tz-.151,.27,.23,.004,'studyPaper');for(let j=0;j<9;j++)box(g,tx,y+.08+j*.019,tz-.154,.20-(j%3)*.02,.002,.002,'studyFrame');}}
  const frame=box(g,tx,1.74,tz,.22,.27,.025,'wood');frame.rotation.x=.08;box(g,tx,1.74,tz-.017,.19,.24,.005,'studyPaper');for(let j=0;j<6;j++)box(g,tx,1.80-j*.027,tz-.021,.13,.004,.003,'studyFrame');
  const gx=w/2-.43;for(let row=0;row<2;row++){clearCube(g,gx,.733+row*.29,tz,.34,.29,.30,k);stack(g,gx,.78+row*.29,tz,6,k,row+5,.28,.23);}
  cyl(g,gx,1.345,tz,.115,.13,.018,'studyFrame');const globe=new THREE.Mesh(new THREE.SphereGeometry(.145,32,20),k.materials.studyGlobe);globe.position.set(gx,1.535,tz);globe.rotation.z=-.24;g.add(globe);
  torus(g,gx,1.535,tz,.158,.006,'studyFrame',[0,0,-.24]);rod(g,[gx,1.35,tz],[gx,1.40,tz],.016,'studyFrame');
  box(g,gx,.80,back-.46,.25,.10,.18,'studyTeal',true);box(g,gx,.856,back-.46,.23,.014,.16,'studyNavy',true);
  box(g,gx-.28,.756,back-.36,.18,.012,.065,'studyWhite',true);box(g,gx-.28,.764,back-.36,.055,.007,.034,'screen');
  cyl(g,w/2-.13,.805,back-.12,.035,.035,.14,'studyWhite');
  // Drawer trolley under the window end of the desk.
  const dx=-w/2+.30,dz=back-.28;
  for(let row=0;row<4;row++){clearCube(g,dx,.09+row*.145,dz,.40,.145,.39,k);stack(g,dx,.11+row*.145,dz,3,k,row,.33,.30);box(g,dx,.19+row*.145,dz-.205,.12,.012,.023,'studyFrame');}
  // Dark wooden bench is tucked under the lower desktop.
  const bx=.32,bz=back-.20;box(g,bx,.43,bz,.57,.052,.35,'studyWood');
  for(const x of [bx-.23,bx+.23])for(const z of [bz-.12,bz+.12])box(g,x,.21,z,.042,.42,.042,'studyWood');box(g,bx,.13,bz,.51,.026,.30,'studyWood');stack(g,bx,.15,bz,4,k,0,.34,.24);
  // Round wooden stool and a neatly placed backpack in front of the window.
  const sx=-w/2+1.00,sz=-d/2+.21;cyl(g,sx,.425,sz,.205,.20,.055,'studyWood',32);
  for(let i=0;i<4;i++){const a=i*Math.PI/2;rod(g,[sx+Math.cos(a)*.12,.40,sz+Math.sin(a)*.12],[sx+Math.cos(a)*.16,.04,sz+Math.sin(a)*.16],.021,'studyWood');}torus(g,sx,.19,sz,.145,.011,'studyWood');
  box(g,-w/2+.16,.26,-d/2+.42,.29,.43,.18,'studyNavy',true);box(g,-w/2+.16,.19,-d/2+.315,.23,.21,.036,'studyNavy',true);torus(g,-w/2+.16,.49,-d/2+.42,.055,.008,'black',[0,0,0]);
  cyl(g,w/2-.24,.19,back-.30,.14,.11,.33,'black',24);torus(g,w/2-.24,.36,back-.30,.138,.006,'studyWhite');
}
function studyFiling(g,w,d,k) {
  const {box,ball,cyl,rod}=k,h=1.60;
  box(g,0,h/2,d/2-.02,w,h,.035,'studyWhite');for(const x of [-w/2+.016,w/2-.016])box(g,x,h/2,0,.030,h,d,'studyWhite');
  for(let row=0;row<4;row++){
    const y=.10+row*.375;box(g,0,y,0,w,.025,d,'studyWhite');stack(g,0,y+.035,0,7,k,row,.50,d-.06);
    box(g,0,y+.185,-d/2-.006,w-.06,.34,.010,'studyRibbed');
    for(const x of [-w/2+.032,w/2-.032])box(g,x,y+.185,-d/2,.029,.35,.029,'studyWhite');
    for(const yy of [y+.025,y+.352])box(g,0,yy,-d/2,w-.035,.024,.027,'studyWhite');box(g,0,y+.027,-d/2-.023,.12,.016,.028,'wood',true);
  }
  box(g,0,h,0,w,.04,d,'studyWhite');for(const x of [-w/2+.06,w/2-.06])for(const z of [-d/2+.06,d/2-.06]){const wheel=cyl(g,x,.04,z,.028,.028,.035,'black');wheel.rotation.z=Math.PI/2;}
  // Compact printer, paper slit and a spherical indoor camera on the cabinet.
  box(g,.08,1.705,0,.43,.18,.31,'studyWhite',true);box(g,.08,1.685,-.164,.34,.009,.012,'black');box(g,.08,1.73,-.164,.19,.008,.012,'studyPaper');
  cyl(g,-w/2+.10,1.69,-.035,.061,.072,.13,'studyWhite');ball(g,-w/2+.10,1.80,-.035,.074,.075,.072,'studyWhite');ball(g,-w/2+.10,1.805,-.102,.016,.016,.003,'screen');
  box(g,-w/2-.016,1.09,0,.035,.38,.23,'studyNavy',true);rod(g,[-w/2-.024,1.3,0],[-w/2-.024,1.50,.06],.004,'black');
}
function studyAC(g,w,d,k) {
  const {box,rod}=k;
  box(g,0,2.30,0,w,.34,.21,'studySilver',true);box(g,0,2.325,-.10,w-.04,.24,.018,'studySilver',true);
  box(g,0,2.185,-.102,w-.06,.013,.015,'black');for(let j=0;j<4;j++)box(g,0,2.155+j*.012,-.088,w-.09,.005,.022,'studyFrame');
  box(g,w*.36,2.29,-.122,.030,.011,.005,'lamp');box(g,w*.33,2.42,-.116,.06,.036,.005,'studyPaper');box(g,w*.33,2.43,-.120,.05,.018,.005,'studyBook1');
  const pipe=new THREE.CatmullRomCurve3([new THREE.Vector3(-w/2+.08,2.14,.065),new THREE.Vector3(-w/2+.05,1.95,.07),new THREE.Vector3(-w/2+.01,1.86,.07)]);
  const tube=new THREE.Mesh(new THREE.TubeGeometry(pipe,20,.028,8,false),k.materials.studyWhite);g.add(tube);
  rod(g,[-w/2+.03,1.84,.07],[-w/2+.03,1.57,.065],.004,'studyWhite');box(g,-w/2+.03,1.57,.077,.077,.077,.023,'studyFrame');box(g,-w/2+.03,1.57,.058,.039,.045,.026,'studyNavy');
}
function studyAccessories(g,w,d,k) {
  const {box,cyl,rod,torus}=k;
  const ax=w/2-.16,az=.10;cyl(g,ax,.28,az,.13,.14,.51,'studyWhite',32);cyl(g,ax,.235,az,.14,.14,.35,'black',32);
  for(let j=0;j<18;j++){const a=j*Math.PI*2/18;rod(g,[ax+Math.sin(a)*.141,.075,az+Math.cos(a)*.141],[ax+Math.sin(a)*.141,.40,az+Math.cos(a)*.141],.005,'studyFrame');}
  for(let j=0;j<3;j++)box(g,ax-.06+j*.045,.547,az,.021,.005,.07,'studyNavy',true);
  const fx=-w/2+.08;rod(g,[fx,.05,-.1],[fx,1.08,-.1],.018,'black');for(const s of [-1,1])rod(g,[fx,.22,-.1],[fx+s*.11,.035,.06],.011,'studyFrame');box(g,fx+.065,.61,-.07,.17,.48,.018,'wood');
  box(g,fx+.065,.61,-.082,.15,.45,.006,'studyPaper');box(g,fx+.065,.87,-.09,.075,.02,.025,'black');
  box(g,-.05,.30,.10,.28,.56,.10,'studyClear',true);for(const x of [-.18,.08])rod(g,[x,.04,.16],[x,.60,.16],.010,'black');torus(g,-.05,.64,.10,.075,.009,'black',[0,0,0]);
}
export function buildStudyFurniture(g,w,d,type,k) {
  const builders={studybookcase:studyBookcase,studybed:studyBed,studydesk:studyDesk,studyfiling:studyFiling,studyac:studyAC,studyaccessories:studyAccessories};
  if(builders[type])builders[type](g,w,d,k);
  else if(type==='studybay'){k.box(g,0,.31,0,w,.58,d,'studyWhite');k.box(g,0,.625,0,w,.06,d,'stone');}
}
export function addStudyDetails(tall,ceilings,k) {
  const {box,rod,cyl}=k;
  const photo=new THREE.Group();photo.position.set(X(467),1.78,Z(392));tall.add(photo);
  box(photo,0,0,0,.46,.64,.025,'wood');box(photo,0,0,.019,.424,.604,.006,'studyFamily');
  photo.traverse(m=>{if(m.isMesh)m.userData={furniture:'书房 · 原照片中的九宫格相框',room:'study'};});
  const curtains=new THREE.Group();curtains.position.set(X(276),0,Z(494));curtains.rotation.y=Math.PI/2;tall.add(curtains);
  const width=M(126);rod(curtains,[-width/2-.10,2.55,0],[width/2+.10,2.55,0],.018,'studyWhite');
  for(const sign of [-1,1])for(let i=0;i<12;i++){
    const x=sign*width*.45+(i-5.5)*.025;
    box(curtains,x,1.37,.05+Math.sin(i*1.8)*.035,.04,2.28,.035,'studyCurtain',true);
    const ring=k.torus(curtains,x,2.55,0,.034,.008,'studyWhite',[0,Math.PI/2,0]);ring.castShadow=false;
  }
  const sheerGeo=new THREE.PlaneGeometry(width*1.02,1.93,40,1),p=sheerGeo.attributes.position;
  for(let i=0;i<p.count;i++)p.setZ(i,.10+Math.sin(p.getX(i)*33)*.023);sheerGeo.computeVertexNormals();
  const sheer=new THREE.Mesh(sheerGeo,k.materials.studySheer);sheer.position.set(0,1.48,0);curtains.add(sheer);
  curtains.traverse(m=>{if(m.isMesh)m.userData={furniture:'书房 · 灰色环扣窗帘与白纱',room:'study'};});
  // Stepped white crown moulding follows the original room's wall recess.
  const r=rooms.find(r=>r.id==='study');for(let i=0;i<r.poly.length;i++){
    const a=r.poly[i],b=r.poly[(i+1)%r.poly.length],vertical=a[0]===b[0],length=M(Math.abs(vertical?b[1]-a[1]:b[0]-a[0]));
    for(let layer=0;layer<3;layer++)box(ceilings,X((a[0]+b[0])/2),HEIGHT-.045-layer*.028,Z((a[1]+b[1])/2),vertical?.038+layer*.020:length,.024,vertical?length:.038+layer*.020,'studyWhite');
  }
  const light=new THREE.Group();light.position.set(X(384),HEIGHT-.105,Z(482));ceilings.add(light);
  const petalShape=(r)=>{const s=new THREE.Shape();for(let j=0;j<=100;j++){const a=j*Math.PI*2/100,rr=r*(1+.12*Math.cos(a*5));j?s.lineTo(Math.cos(a)*rr,Math.sin(a)*rr):s.moveTo(Math.cos(a)*rr,Math.sin(a)*rr);}return s;};
  for(const [radius,depth,material] of [[.34,.045,'gold'],[.31,.055,'lamp']]){const geo=new THREE.ExtrudeGeometry(petalShape(radius),{depth,bevelEnabled:true,bevelSize:.006,bevelThickness:.006,bevelSegments:2,steps:1});geo.rotateX(Math.PI/2);const mesh=new THREE.Mesh(geo,k.materials[material]);light.add(mesh);}
  cyl(light,0,.032,0,.11,.11,.032,'studyWhite');
}
