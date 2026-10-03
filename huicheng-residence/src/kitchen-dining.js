import * as THREE from 'three';
import { X,Z,M,HEIGHT,rooms,passages } from './data.js';
import { referencePhotoMaterial } from './artwork.js';

export const kitchenDiningTypes=new Set(['dining','diningcabinet','diningstorage','kitchen']);
export const roomSlides=passages.filter(p=>p.x===537||p.x===438).map(p=>({...p,id:p.x===537?'kitchen-entry':'utility-entry',name:p.x===537?'厨房玻璃推拉门':'生活阳台玻璃推拉门',style:'roomSlide',height:2.28}));
const photo=(key)=>window.__KITCHEN_DINING_PHOTOS?.[key]||`/public/kitchen-dining/${key}.jpg`;
function canvasTexture(draw){const c=document.createElement('canvas');c.width=c.height=512;draw(c.getContext('2d'));const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=8;return t;}
export function initKitchenDiningMaterials(m){
  const mat=(key,color,roughness=.6,extra={})=>m[key]=new THREE.MeshStandardMaterial({color,roughness,...extra});
  mat('kdWhite','#eeeae0',.46);mat('kdGrey','#969d9d',.55);mat('kdSteel','#b8bcbc',.27,{metalness:.83});mat('kdDark','#151e25',.32,{metalness:.3});mat('kdBlue','#5a718c',.4,{metalness:.45});mat('kdBlack','#151817',.23,{metalness:.25});
  mat('kdWood','#bc9357',.65);mat('kdGold','#b69a59',.3,{metalness:.6});mat('kdPot','#867758',.34,{metalness:.74});mat('kdWok','#9e7b40',.6,{metalness:.5});mat('kdRed','#cb3630',.67);mat('kdYellow','#e5b348',.7);mat('kdTeal','#609e9b',.65);mat('kdOrange','#d98643',.65);mat('kdPink','#d897b3',.63);mat('kdNavy','#283e67',.75);mat('kdPaper','#ece5d6',.9);mat('kdAmber','#826035',.3,{transparent:true,opacity:.87});
  mat('kdClear','#d1d7d5',.13,{transparent:true,opacity:.26,depthWrite:false});mat('kdGlass','#d4e1de',.10,{transparent:true,opacity:.12,side:THREE.DoubleSide,depthWrite:false});mat('kdLamp','#f7f3e6',.5,{emissive:'#fff0bd',emissiveIntensity:.26});
  const grain=canvasTexture(ctx=>{ctx.fillStyle='#f1ede3';ctx.fillRect(0,0,512,512);for(let i=0;i<280;i++){ctx.strokeStyle=`rgba(95,86,66,${.008+(i%7)*.002})`;ctx.beginPath();ctx.moveTo(i*1.83,0);ctx.bezierCurveTo(i*1.83+3,160,i*1.83-2,350,i*1.83,512);ctx.stroke();}});
  mat('kdGrain','#ffffff',.48,{map:grain,bumpMap:grain,bumpScale:.001});
  const stone=canvasTexture(ctx=>{ctx.fillStyle='#eee9db';ctx.fillRect(0,0,512,512);let n=17;for(let i=0;i<14000;i++){n=(Math.imul(n,1664525)+1013904223)>>>0;const x=n%512,y=(n>>>10)%512;ctx.fillStyle=i%3?'#d7d1c21c':'#827d7023';ctx.fillRect(x,y,1+i%2,1);}});stone.repeat.set(2,2);mat('kdCounter','#ffffff',.35,{map:stone});
  const wall=canvasTexture(ctx=>{ctx.fillStyle='#e9e9e4';ctx.fillRect(0,0,512,512);for(let i=0;i<100;i++){ctx.fillStyle='#999b9b06';ctx.fillRect(0,i*5.13,512,1);}ctx.strokeStyle='#b9b9b633';ctx.lineWidth=2;ctx.strokeRect(0,0,512,512);});
  mat('kdTile','#ffffff',.24,{map:wall});m.kdTile.onBeforeCompile=s=>{s.vertexShader=s.vertexShader.replace('#include <worldpos_vertex>',`#include <worldpos_vertex>
    vec3 tilePosition=(modelMatrix*vec4(transformed,1.0)).xyz;
    vec3 tileNormal=abs(normalize(mat3(modelMatrix)*objectNormal));
    vMapUv=vec2(tileNormal.x>0.5?tilePosition.z:tilePosition.x,tilePosition.y)/vec2(0.60,0.30);
  `);};m.kdTile.customProgramCacheKey=()=> 'kitchen-tile-metres';
  const diningWall=canvasTexture(ctx=>{ctx.fillStyle='#cbc9c2';ctx.fillRect(0,0,512,512);for(let i=0;i<16000;i++){ctx.fillStyle=i%2?'#ffffff10':'#77746c10';ctx.fillRect((i*73)%512,(i*137+Math.floor(i/512))%512,1,1);}});diningWall.repeat.set(4,4);mat('kdWall','#ffffff',.98,{map:diningWall,bumpMap:diningWall,bumpScale:.0012});
  const floor=canvasTexture(ctx=>{ctx.fillStyle='#dedbd0';ctx.fillRect(0,0,512,512);ctx.strokeStyle='#b3b1a680';ctx.lineWidth=2;ctx.strokeRect(0,0,512,512);});floor.repeat.set(1.7,1.7);mat('kdFloor','#ffffff',.5,{map:floor});
  const terra=canvasTexture(ctx=>{ctx.fillStyle='#bb8154';ctx.fillRect(0,0,512,512);ctx.strokeStyle='#dbbc98';ctx.lineWidth=4;ctx.strokeRect(0,0,512,512);ctx.fillStyle='#7e7564';for(const [x,y] of [[0,0],[512,0],[0,512],[512,512]]){ctx.beginPath();ctx.moveTo(x-20,y);ctx.lineTo(x,y-20);ctx.lineTo(x+20,y);ctx.lineTo(x,y+20);ctx.fill();}});terra.repeat.set(2.5,2.5);mat('kdTerra','#ffffff',.64,{map:terra});
}
function plane(g,x,y,z,w,h,material,rot=0){const p=new THREE.Mesh(new THREE.PlaneGeometry(w,h),material);p.position.set(x,y,z);p.rotation.y=rot;g.add(p);return p;}
function sourceFace(key,quad,status){return referencePhotoMaterial(photo(key),[[0,1,...quad[0]],[1,1,...quad[1]],[1,0,...quad[2]],[0,0,...quad[3]]],key==='storage'?[1280,1707]:[1707,1280],status);}
function pipe(g,points,r,mat,h){const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));const t=new THREE.Mesh(new THREE.TubeGeometry(curve,24,r,8,false),h.materials[mat]);t.castShadow=true;g.add(t);return t;}
function bottle(g,x,y,z,height,colour,h,index=0){const r=height*.16;h.cyl(g,x,y+height*.38,z,r,r*.95,height*.76,colour);h.cyl(g,x,y+height*.84,z,r*.45,r*.65,height*.20,colour);h.cyl(g,x,y+height*.97,z,r*.49,r*.49,height*.09,['kdRed','kdYellow','kdBlack','kdWhite'][index%4]);h.box(g,x,y+height*.38,z+r+.001,r*1.5,height*.22,.003,'kdPaper');}
function books(g,x,y,z,count,h,step=.043,height=.28,depth=.17){for(let i=0;i<count;i++){const ht=height+(i%4)*.017;const b=h.box(g,x+i*step,y+ht/2,z,step-.006,ht,depth,['kdPaper','kdRed','kdNavy','kdTeal','kdWhite'][i%5]);b.rotation.z=i===count-1?-.12:0;h.box(g,x+i*step,y+.05,z-depth/2-.002,step-.014,.032,.003,'kdPaper');}}
function cup(g,x,y,z,r,h){h.cyl(g,x,y+.065,z,r,r*.82,.13,'kdWhite');h.cyl(g,x,y+.13,z,r*.78,r*.78,.003,'kdDark');h.torus(g,x+r,y+.07,z,.032,.007,'kdWhite',[Math.PI/2,Math.PI/2,0]);}
function knobHandle(g,x,y,z,length,h){h.rod(g,[x-length/2,y,z+.018],[x+length/2,y,z+.018],.011,'kdSteel');for(const s of [-1,1])h.rod(g,[x+s*length/2,y,z],[x+s*length/2,y,z+.018],.007,'kdSteel');}

function diningCabinet(g,w,d,h){
  h.box(g,0,.43,0,w,.80,d,'kdGrain');h.box(g,0,.86,0,w+.02,.04,d+.03,'kdCounter');h.box(g,0,.09,-d/2-.002,w,.09,.014,'kdGrey');
  const count=5,unit=w/count;
  for(let i=0;i<count;i++){const x=-w/2+(i+.5)*unit;for(const [y,ht] of [[.69,.25],[.33,.44]])h.box(g,x,y,-d/2-.012,unit-.018,ht,.02,'kdGrain');h.box(g,x,.565,-d/2-.028,unit-.02,.018,.021,'kdSteel');}
  const tallX=w/2-.31;
  h.box(g,tallX,1.91,d*.04,.60,1.33,d,'kdGrain');
  for(const x of [tallX-.292,tallX+.292])h.box(g,x,1.09,0,.016,.31,d,'kdGrain');
  for(const x of [tallX-.152,tallX+.152]){h.box(g,x,1.90,-d/2-.022,.289,1.31,.022,'kdGrain');h.box(g,x,1.255,-d/2-.039,.282,.016,.020,'kdSteel');}
  h.box(g,tallX,1.08,d/2-.005,.55,.27,.005,'kdWall');h.box(g,tallX,.94,0,.60,.02,d,'kdWhite');
  for(let i=0;i<4;i++)bottle(g,tallX-.2+i*.105,.95,-.04,.17,['kdAmber','kdWhite','kdYellow','kdPink'][i],h,i);
  const boxesX=tallX-.56;
  for(let j=0;j<4;j++){h.box(g,boxesX,.94+j*.092,0,.30,.085,.25,['kdNavy','kdOrange','kdTeal','kdYellow'][j],true);h.box(g,boxesX,.94+j*.092,-.132,.065,.029,.015,'kdSteel',true);}
  h.box(g,boxesX-.33,.98,0,.29,.20,.25,'kdClear',true);h.box(g,boxesX-.33,1.085,0,.30,.019,.26,'kdWhite');h.box(g,boxesX-.33,1.18,0,.23,.17,.22,'kdClear',true);h.box(g,boxesX-.33,1.27,0,.25,.022,.23,'kdPink');
  books(g,-w/2+.48,.89,-.01,14,h,.043,.31,.18);books(g,-w/2+1.12,.89,-.01,6,h,.037,.28,.18);
  h.box(g,-w/2+.18,1.12,0,.29,.46,.24,'kdClear');for(let j=0;j<2;j++)h.box(g,-w/2+.18,.97+j*.16,0,.27,.015,.23,'kdSteel');
  h.cyl(g,-w/2+.42,.97,-.04,.035,.035,.17,'kdWhite');for(let i=0;i<6;i++)h.rod(g,[-w/2+.42,.99,-.04],[-w/2+.42+Math.sin(i)*.035,1.12+(i%2)*.02,-.04+Math.cos(i)*.025],.004,['kdRed','kdNavy','kdWood'][i%3]);
  h.ball(g,-w/2+.65,1.28,.03,.052,.068,.047,'kdWhite');h.ball(g,-w/2+.65,1.285,-.013,.028,.042,.012,'kdBlack');h.cyl(g,-w/2+.65,1.19,.03,.035,.054,.08,'kdWhite');
  bottle(g,-w/2+1.39,.89,-.02,.16,'kdAmber',h);bottle(g,boxesX-.55,.89,-.025,.18,'kdWhite',h,1);
}
function diningTable(g,w,d,h){
  const tw=w*.64,td=d*.50;
  h.box(g,0,.755,0,tw,.055,td,'kdWhite',true);h.box(g,0,.699,0,tw-.08,.052,td-.08,'kdSteel');
  for(const x of [-tw/2+.08,tw/2-.08])for(const z of [-td/2+.07,td/2-.07])h.box(g,x,.35,z,.045,.70,.045,'kdDark');
  function chair(x,z,rot){const c=new THREE.Group();c.position.set(x,0,z);c.rotation.y=rot;g.add(c);for(const xx of [-.205,.205])for(const zz of [-.185,.185])h.rod(c,[xx,.04,zz],[xx,.46,zz],.013,'kdDark');h.box(c,0,.465,0,.43,.05,.41,'kdGrey',true);h.box(c,0,.76,.18,.405,.34,.038,'kdGrey',true);for(const xx of [-.20,.20])h.rod(c,[xx,.47,.18],[xx,.94,.18],.013,'kdDark');h.rod(c,[-.20,.94,.18],[.20,.94,.18],.013,'kdDark');}
  for(const x of [-tw*.25,tw*.25]){chair(x,-td/2-.27,Math.PI);chair(x,td/2+.27,0);}chair(-tw/2-.27,0,-Math.PI/2);chair(tw/2+.27,0,Math.PI/2);
  books(g,-.18,.787,-.05,6,h,.031,.25,.16);h.box(g,-.24,.81,.13,.24,.045,.17,'kdNavy',true);
  h.cyl(g,.42,.80,.09,.11,.12,.028,'kdWhite');h.rod(g,[.42,.81,.09],[.42,1.16,.09],.015,'kdWhite');h.rod(g,[.42,1.16,.09],[.26,1.25,.09],.013,'kdWhite');h.cyl(g,.22,1.25,.09,.14,.14,.023,'kdWhite');h.cyl(g,.22,1.236,.09,.125,.125,.006,'kdLamp');
  for(let i=0;i<3;i++)h.box(g,-.5,.792+i*.009,-.12,.22,.008,.15,'kdPaper');h.box(g,-.50,.846,-.12,.17,.056,.06,'kdPink',true);
}
function storageTower(g,w,d,h){
  h.box(g,0,1.03,0,w,2.02,d,'kdWhite');h.box(g,0,1.07,-d/2-.007,w-.038,1.86,.008,'kdDark');
  for(const [y,ht] of [[.42,.57],[1.02,.49],[1.63,.61]]){h.box(g,0,y,-d/2-.02,w-.044,ht,.012,'kdGlass');for(let i=0;i<24;i++)h.box(g,-w/2+.03+i*(w-.06)/23,y,-d/2-.028,.003,ht,.006,'kdSteel');for(const yy of [y-ht/2,y+ht/2])h.box(g,0,yy,-d/2-.034,w-.025,.023,.018,'kdWhite');h.ball(g,-w/2+.055,y,-d/2-.052,.012,.012,.012,'kdGold');}
  h.box(g,0,2.11,0,w-.02,.14,d*.82,'kdNavy');h.box(g,w*.30,2.20,.04,w*.30,.32,d*.60,'kdPaper');
  // This tower faces the dining room east of the two adjacent doorways.
  g.rotation.y=-Math.PI/2;
  const map=sourceFace('storage',[[459,909],[805,916],[806,1208],[460,1191]],'diningMap');
  plane(g,0,1.21,-d/2-.077,.40,.33,map,Math.PI);
  h.box(g,0,1.53,-d/2-.084,.095,.36,.009,'kdRed');h.box(g,0,1.725,-d/2-.084,.095,.035,.01,'kdPaper');
}

function kitchen(g,w,d,h){
  const dep=M(37),north=-d/2+dep/2,west=-w/2+dep/2,east=w/2-dep/2,top=.885;
  h.box(g,0,.435,north,w,.80,dep,'kdGrey');
  h.box(g,west,.365,dep/2,dep,.66,d-dep,'kdGrey');h.box(g,east,.435,dep/2,dep,.80,d-dep,'kdGrey');
  // Real single-bowl sink: four countertop strips leave a true opening.
  const sz=.18,sw=.39,sd=.68,innerWest=-w/2+dep,innerEast=w/2-dep;
  h.box(g,0,top,north,w+.015,.042,dep+.02,'kdCounter');h.box(g,east,top,dep/2,dep,.042,d-dep,'kdCounter');
  for(const xx of [-1,1])h.box(g,west+xx*(sw/2+(dep-sw)/4),top,dep/2,(dep-sw)/2,.042,d-dep,'kdCounter');
  for(const [a,b] of [[-d/2+dep,sz-sd/2],[sz+sd/2,d/2]])if(b>a)h.box(g,west,top,(a+b)/2,sw,.042,b-a,'kdCounter');
  h.box(g,west,.735,sz,sw,.012,sd,'kdSteel');for(const xx of [-1,1])h.box(g,west+xx*sw/2,.803,sz,.009,.148,sd,'kdSteel');for(const zz of [-1,1])h.box(g,west,.803,sz+zz*sd/2,sw,.148,.009,'kdSteel');
  for(const xx of [-1,1])h.box(g,west+xx*(sw/2+.008),top+.025,sz,.025,.012,sd+.046,'kdSteel');for(const zz of [-1,1])h.box(g,west,top+.025,sz+zz*(sd/2+.008),sw+.04,.012,.025,'kdSteel');h.torus(g,west,.746,sz,.023,.006,'kdSteel');h.cyl(g,west,.741,sz,.017,.017,.003,'kdDark');
  pipe(g,[[west-.20,top+.02,sz-.08],[west-.20,1.19,sz-.08],[west-.12,1.25,sz-.08],[west+.05,1.17,sz-.08]],.013,'kdSteel',h);h.cyl(g,west-.20,.918,sz-.08,.029,.029,.055,'kdSteel');h.rod(g,[west-.19,.94,sz-.08],[west-.15,.98,sz-.08],.008,'kdSteel');
  for(let i=0;i<6;i++){const x=-w/2+(i+.5)*w/6;h.box(g,x,.45,-d/2+dep+.012,w/6-.016,.80,.020,'kdGrey');knobHandle(g,x,.74,-d/2+dep+.025,.17,h);}
  for(const [x,rot] of [[west,Math.PI/2],[east,-Math.PI/2]]){const c=new THREE.Group();c.position.set(x,0,dep/2);c.rotation.y=rot;g.add(c);for(let j=0;j<2;j++){h.box(c,(j-.5)*(d-dep)/2,.45,dep/2+.01,(d-dep)/2-.015,.80,.020,'kdGrey');knobHandle(c,(j-.5)*(d-dep)/2,.74,dep/2+.025,.17,h);}}
  const cookX=.12,cookZ=north+.008;
  h.box(g,cookX,top+.03,cookZ,.91,.024,.46,'kdBlack');
  for(const x of [cookX-.245,cookX+.245]){h.torus(g,x,top+.056,cookZ,.112,.012,'kdSteel');h.cyl(g,x,top+.066,cookZ,.086,.086,.019,'kdDark');for(let i=0;i<4;i++){const a=i*Math.PI/2;h.rod(g,[x+Math.cos(a)*.06,top+.098,cookZ+Math.sin(a)*.06],[x+Math.cos(a)*.135,top+.098,cookZ+Math.sin(a)*.135],.009,'kdDark');}h.cyl(g,x,top+.069,cookZ+.174,.022,.022,.052,'kdSteel');}
  const wokX=cookX-.245;
  h.cyl(g,wokX,1.072,cookZ,.181,.09,.11,'kdWok',32);h.cyl(g,wokX,1.13,cookZ,.170,.17,.003,'kdDark',32);h.torus(g,wokX,1.133,cookZ,.179,.005,'kdSteel');h.rod(g,[wokX-.14,1.075,cookZ+.09],[wokX-.42,1.075,cookZ+.26],.021,'kdWood');
  const potX=cookX+.245;h.cyl(g,potX,1.025,cookZ,.118,.112,.23,'kdPot',24);h.torus(g,potX,1.148,cookZ,.122,.008,'kdSteel');h.cyl(g,potX,1.157,cookZ,.124,.105,.025,'kdSteel');h.ball(g,potX,1.182,cookZ,.045,.018,.03,'kdBlack');for(const s of [-1,1])h.torus(g,potX+s*.126,1.052,cookZ,.041,.011,'kdBlack',[0,Math.PI/2,0]);
  // Side-draft hood, with an angled black intake panel and stainless surround.
  const hood=new THREE.Group();hood.position.set(cookX,1.90,-d/2+.145);g.add(hood);
  h.box(hood,0,0,0,.95,.66,.20,'kdSteel');h.box(hood,0,.02,.111,.885,.49,.030,'kdBlack');h.box(hood,0,.27,.025,.98,.105,.22,'kdSteel');h.box(hood,0,-.30,.045,.95,.075,.22,'kdSteel');
  const intake=h.box(hood,0,-.012,.152,.64,.34,.065,'kdBlack',true);intake.rotation.x=-.16;
  plane(hood,0,.014,.192,.60,.30,sourceFace('hood',[[505,278],[919,278],[936,547],[462,536]],'kitchenHood'));
  for(let i=0;i<4;i++)h.torus(hood,-.075+i*.05,.275,.141,.012,.002,'kdDark',[0,0,0]);h.box(g,cookX,2.40,-d/2+.115,.28,.38,.16,'kdSteel');
  for(const [x,width] of [[-w/2+.36,.69],[w/2-.34,.64]]){h.box(g,x,1.995,-d/2+.18,width,.72,.35,'kdWhite');h.box(g,x,1.995,-d/2+.363,width-.02,.69,.018,'kdGrain');knobHandle(g,x,1.685,-d/2+.376,.17,h);}
  // Boiler beside the dark framed window, utensils and windowsill plants.
  h.box(g,-w/2+.12,1.94,-.55,.19,.49,.34,'kdWhite',true);h.box(g,-w/2+.222,1.83,-.55,.005,.067,.092,'kdDark');
  pipe(g,[[-w/2+.13,2.20,-.55],[-w/2+.13,2.43,-.55],[-w/2+.06,2.55,-.67]],.034,'kdSteel',h);for(let j=0;j<8;j++)h.torus(g,-w/2+.13,2.22+j*.026,-.55,.036,.004,'kdSteel');
  for(let i=0;i<2;i++){h.cyl(g,-w/2+.16,1.04,-.23+i*.22,.044,.037,.095,i?'kdClear':'kdTeal');for(let j=0;j<4;j++){h.rod(g,[-w/2+.16,1.09,-.23+i*.22],[-w/2+.16+Math.sin(j)*.04,1.20+(j%2)*.04,-.23+i*.22+Math.cos(j)*.04],.003,'leaf');h.ball(g,-w/2+.16+Math.sin(j)*.04,1.22,-.23+i*.22+Math.cos(j)*.04,.021,.012,.023,'leaf');}}
  h.box(g,innerWest+.17,1.12,north,.05,.43,.27,'kdWood');h.box(g,innerWest+.23,.994,north+.12,.16,.19,.13,'kdRed');for(let i=0;i<4;i++)h.rod(g,[innerWest+.18+i*.031,1.06,north+.12],[innerWest+.18+i*.031,1.21+(i%2)*.025,north+.12],.011,'kdDark');
  for(let i=0;i<8;i++)bottle(g,-.90+i*.070,top+.027,north-.13,.19+(i%3)*.035,'kdAmber',h,i);
  for(const y of [1.20,1.42]){h.box(g,-.90,y,-d/2+.10,.52,.015,.18,'kdSteel');h.rod(g,[-1.15,y+.044,-d/2+.20],[-.65,y+.044,-d/2+.20],.008,'kdSteel');for(let i=0;i<4;i++)bottle(g,-1.09+i*.12,y+.012,-d/2+.09,.12,['kdWhite','kdTeal','kdDark','kdAmber'][i],h,i);}
  cup(g,-.64,top+.023,north+.09,.045,h);for(let i=0;i<3;i++){h.cyl(g,-.83,top+.046+i*.035,north+.16,.076+i*.016,.064+i*.016,.042,'kdWhite');}cup(g,-.45,top+.022,north+.15,.038,h);
  // Right-hand appliance corner: oven, microwave niche, fryer and kettles.
  const appliances=new THREE.Group();appliances.position.set(east,0,.35);appliances.rotation.y=-Math.PI/2;g.add(appliances);
  h.box(appliances,0,1.03,0,.41,.25,.40,'kdWhite',true);h.box(appliances,-.035,1.03,.206,.29,.16,.009,'kdBlack');for(let j=0;j<3;j++)h.cyl(appliances,.159,.96+j*.066,.217,.014,.014,.01,'kdWhite').rotation.x=Math.PI/2;
  h.box(appliances,0,2.015,-.014,.47,.23,.38,'kdWhite');h.box(appliances,0,1.73,-.195,.47,.34,.015,'kdWhite');for(const x of [-.227,.227])h.box(appliances,x,1.73,-.014,.015,.34,.38,'kdWhite');h.box(appliances,0,1.55,.008,.45,.02,.40,'kdWhite');
  h.box(appliances,0,1.68,.016,.43,.25,.35,'kdBlack',true);h.box(appliances,-.025,1.68,.197,.32,.22,.005,'kdDark');h.box(appliances,.12,1.68,.208,.018,.17,.014,'kdSteel');for(let j=0;j<5;j++)h.box(appliances,.18,1.63+j*.022,.196,.027,.006,.002,'kdPaper');h.box(appliances,0,2.095,.193,.45,.19,.018,'kdGrain');knobHandle(appliances,0,2.038,.211,.16,h);
  h.box(g,east,1.015,-.15,.39,.26,.33,'kdWhite',true);h.box(g,east,1.15,-.15,.37,.015,.30,'kdDark',true);h.torus(g,east-dep/2-.013,1.006,-.15,.037,.006,'kdGold',[0,Math.PI/2,0]);
  for(const z of [.04,.65]){h.cyl(g,east,1.03,z,.075,.068,.24,z>.5?'kdWhite':'kdClear');h.cyl(g,east,1.16,z,.078,.078,.024,'kdWhite');h.rod(g,[east+.055,1.05,z],[east+.10,1.08,z],.018,'kdWhite');h.torus(g,east-.075,1.06,z,.065,.012,'kdWhite',[0,Math.PI/2,0]);}
  h.box(g,east,1.42,.35,.39,.02,.45,'kdDark');for(const xx of [east-.16,east+.16])for(const zz of [.15,.55])h.rod(g,[xx,1.20,zz],[xx,1.47,zz],.006,'kdDark');h.box(g,east,1.32,.55,.32,.085,.10,'kdPink');for(let i=0;i<5;i++)bottle(g,east-.12+i*.06,1.433,.28,.105,'kdWhite',h,i);
  h.box(g,.88,1.48,-d/2+.10,.40,.02,.18,'kdSteel');for(let i=0;i<3;i++){const lid=h.torus(g,.77+i*.11,1.57,-d/2+.10,.085,.007,'kdSteel',[Math.PI/2,0,0]);lid.rotation.z=.12;}
  for(let i=0;i<2;i++){h.rod(g,[.82+i*.13,1.49,-d/2+.20],[.82+i*.13,1.13,-d/2+.20],.014,i?'kdWood':'kdOrange');h.box(g,.82+i*.13,1.48,-d/2+.20,.053,.083,.015,i?'kdWood':'kdOrange',true);}
}
export function buildKitchenDiningFurniture(g,w,d,type,h){if(type==='dining')diningTable(g,w,d,h);else if(type==='diningcabinet')diningCabinet(g,w,d,h);else if(type==='diningstorage')storageTower(g,w,d,h);else kitchen(g,w,d,h);}

function gallery(root,h){
  const g=new THREE.Group();g.position.set(X(534),0,Z(919));g.rotation.y=Math.PI;g.name='实拍餐厅照片墙';root.add(g);
  // Each frame samples its own photograph from the untouched original image.
  const frames=[
    [671,389,753,451,'kdBlack'],[784,359,885,443,'kdWhite'],[907,389,984,451,'kdBlack'],[552,423,636,485,'kdWhite'],
    [438,479,531,545,'kdWhite'],[659,473,792,627,'kdWood'],[805,472,880,531,'kdWhite'],[915,469,988,532,'kdWhite'],[1008,451,1065,529,'kdWhite'],[1091,442,1147,520,'kdWhite'],[1170,471,1243,530,'kdWhite'],
    [334,547,403,634,'kdWhite'],[440,570,533,635,'kdBlack'],[569,534,633,620,'kdBlack'],[810,561,885,621,'kdWhite'],[916,550,1048,665,'kdBlack'],[1076,548,1171,625,'kdBlack'],[1197,548,1285,618,'kdBlack'],
    [447,677,536,743,'kdWhite'],[577,654,687,746,'kdWhite'],[726,657,780,743,'kdWhite'],[815,644,892,750,'kdBlack'],[927,688,982,770,'kdWhite'],[1012,691,1080,750,'kdWhite'],[1106,650,1163,729,'kdWhite'],[1197,642,1257,715,'kdBlack']
  ];
  const scale=2.22/955;
  for(const [a,b,c,d,colour] of frames){const x=((a+c)/2-809.5)*scale,y=2.32-((b+d)/2-358)*scale,w=(c-a)*scale,ht=(d-b)*scale,f=.011;
    h.box(g,x,y,.009,w,ht,.025,colour);h.box(g,x,y,.024,w-f*2,ht-f*2,.004,'kdPaper');
    const inset=colour==='kdWood'?22:9;
    const image=sourceFace('gallery',[[a+inset,b+inset],[c-inset,b+inset],[c-inset,d-inset],[a+inset,d-inset]],'diningGallery');
    plane(g,x,y,.028,w-f*4,ht-f*4,image);}
  g.traverse(m=>{if(m.isMesh)m.userData={furniture:'餐厅照片墙 · 原照片中的相框与画面',room:'dining'};});
}
export function addKitchenDiningDetails(tall,ceilings,h){
  gallery(tall,h);
  const dining=rooms.find(r=>r.id==='dining'),[a,b]=dining.poly[0],[c,d]=dining.poly[2];
  for(const [x,z,w,depth] of [[(a+c)/2,b+8,c-a,16],[(a+c)/2,d-8,c-a,16],[a+8,(b+d)/2,16,d-b],[c-8,(b+d)/2,16,d-b]]){h.box(ceilings,X(x),2.69,Z(z),M(w),.14,M(depth),'kdWhite');h.box(ceilings,X(x),2.609,Z(z),M(w),.016,M(depth)+.025,'trim');}
  const light=new THREE.Group();light.position.set(X(550),0,Z(826));ceilings.add(light);h.cyl(light,0,2.735,0,.082,.082,.07,'kdSteel');h.rod(light,[0,2.72,0],[0,2.42,0],.022,'kdSteel');h.cyl(light,0,2.39,0,.145,.275,.16,'kdBlue',32);h.cyl(light,0,2.295,0,.282,.282,.045,'kdSteel',32);h.torus(light,0,2.32,0,.29,.009,'kdGold');h.cyl(light,0,2.257,0,.279,.279,.024,'kdLamp',32);h.cyl(light,0,2.241,0,.067,.067,.009,'kdGold');h.torus(light,0,2.235,0,.073,.005,'kdGold');
  const kitchen=rooms.find(r=>r.id==='kitchen'),[kx,kz]=kitchen.poly[0],[kxx,kzz]=kitchen.poly[2];for(let x=kx;x<=kxx;x+=40)h.box(ceilings,X(x),HEIGHT-.012,Z((kz+kzz)/2),.007,.006,M(kzz-kz),'kdSteel');for(let z=kz;z<=kzz;z+=40)h.box(ceilings,X((kx+kxx)/2),HEIGHT-.012,Z(z),M(kxx-kx),.006,.007,'kdSteel');h.box(ceilings,X(551),2.739,Z(682),.29,.025,.29,'kdLamp');
}
export function createKitchenWindow(g,win,h){const w=M(win.w),y=win.sill+win.h/2;h.box(g,0,y,0,w,win.h,.013,'kdGlass');for(const x of [-w/2,0,w/2])h.box(g,x,y,0,.035,win.h,.054,'kdDark');for(const yy of [win.sill,win.sill+win.h])h.box(g,0,yy,0,w,.037,.054,'kdDark');h.box(g,0,win.sill-.025,0,w+.03,.052,.28,'kdCounter');h.box(g,.024,y+.04,.036,.012,.085,.016,'kdDark');}
export function createRoomSlides(root,h){return roomSlides.map(data=>{
  const g=new THREE.Group();g.position.set(X(data.x),0,Z(data.z));if(data.axis==='z')g.rotation.y=Math.PI/2;root.add(g);const w=M(data.w),height=data.height,frame=data.id==='utility-entry'?'kdDark':'kdSteel';
  for(const xx of [-w/2-.03,w/2+.03]){h.box(g,xx,height/2,0,.071,height+.06,.12,'kdWhite');h.box(g,xx,height/2,.025,.032,height,.065,frame);}for(const y of [.017,height]){h.box(g,0,y,0,w+.075,.041,.09,frame);h.box(g,0,y+.027,-.027,w+.10,.022,.025,'kdWhite');}
  h.box(g,0,height+(HEIGHT-height)/2+.02,0,w+.06,HEIGHT-height-.04,.15,'kdWall');
  const leaves=[];
  for(let i=0;i<2;i++){const leaf=new THREE.Group();leaf.position.set(-w/4,.0,i?-.029:.025);leaf.userData={door:data.id,movable:i===1,closedX:i?w/4:-w/4};g.add(leaf);leaves.push(leaf);const lw=w/2;
    h.box(leaf,0,height/2,0,lw-.042,height-.055,.009,'kdGlass');for(const x of [-lw/2,lw/2])h.box(leaf,x,height/2,0,.028,height-.02,.03,frame);for(const y of [.034,height-.024])h.box(leaf,0,y,0,lw,.027,.034,frame);if(data.id==='kitchen-entry')for(const y of [.64,1.38])h.box(leaf,0,y,0,lw,.016,.016,frame);
    h.box(leaf,lw/2-.045,1.05,.025,.017,.13,.019,frame);
    if(!i&&data.id==='utility-entry'){const charts=sourceFace('charts',[[311,840],[619,837],[610,1095],[302,1091]],'diningCharts');plane(leaf,0,.91,.026,Math.min(lw-.08,.43),.35,charts);const chart2=sourceFace('charts',[[231,665],[463,665],[463,839],[231,839]],'diningCharts');plane(leaf,-.04,1.33,.026,Math.min(lw-.08,.45),.31,chart2);}
    if(data.id==='kitchen-entry'&&!i){h.torus(leaf,0,1.12,.020,.12,.006,'kdRed',[0,0,0]);h.torus(leaf,0,1.12,.022,.106,.004,'kdRed',[0,0,0]);for(let j=0;j<16;j++){const a=j*Math.PI/8;h.ball(leaf,Math.cos(a)*.09,1.12+Math.sin(a)*.09,.026,.019,.012,.002,'kdRed');}h.box(leaf,0,1.12,.025,.048,.09,.003,'kdRed');}
    leaf.traverse(m=>{if(m.isMesh)m.userData={door:data.id,furniture:data.name,dynamic:true};});
  }
  return {data,group:g,leaves,progress:1,open:true,target:1};
});}
