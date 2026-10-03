import * as THREE from 'three';
import { referencePhotoMaterial,photoProjection } from './artwork.js';

// All front surfaces sample the intact reference photograph through one projection.
// Raised mouldings and magnetic pieces share those UVs, so their original patterns
// remain aligned while their edges, lock and handle have real depth in the room.
const photoSize=[1280,1707];
const photoCorners=[[0,1,139,141],[1,1,1005,138],[1,0,964,1707],[0,0,279,1707]];
const inverse=photoProjection(photoCorners,photoSize).invert();
function photoUV(x,y){const p=new THREE.Vector3(x/photoSize[0],1-y/photoSize[1],1).applyMatrix3(inverse);return [p.x/p.z,p.y/p.z];}

export function initEntryMaterials(materials){
  const mat=(name,color,roughness=.42,extra={})=>materials[name]=new THREE.MeshStandardMaterial({color,roughness,...extra});
  mat('entryWood','#34140f',.38,{metalness:.12});
  mat('entryCopper','#b67642',.27,{metalness:.76});
  mat('entryBlack','#101214',.28,{metalness:.22});
  mat('entryWhite','#e9e6e0',.48);
  for(const [name,color] of [['Red','#d32330'],['Orange','#ef8520'],['Blue','#152aa7'],['Cyan','#19b6c3'],['Purple','#7023a7'],['Yellow','#eed231']])mat('entry'+name,color,.33);
  materials.entryPhoto=referencePhotoMaterial(window.__ENTRY_PHOTO||'/public/entry/door.jpg',photoCorners,photoSize,'entryPhoto');
}

export function addEntryDoorDetails(pivot,d,w,{box,cyl,torus,materials}){
  const centre=-d.hinge*w/2,width=w-.06,height=2.12,bottom=.015;
  const uvOf=(x,y)=>[.5-(x-centre)/width,(y-bottom)/height];
  const xyOf=(u,v)=>[centre+(.5-u)*width,bottom+v*height];
  const pixel=(x,y)=>xyOf(...photoUV(x,y));
  const mark=(mesh,name)=>{mesh.userData={door:d.id,furniture:name};mesh.castShadow=true;mesh.receiveShadow=true;return mesh;};
  const photoUVs=geometry=>{
    const positions=geometry.getAttribute('position'),uv=[];
    for(let i=0;i<positions.count;i++)uv.push(...uvOf(positions.getX(i),positions.getY(i)));
    geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));return geometry;
  };
  const faceGeometry=new THREE.PlaneGeometry(width,height);
  faceGeometry.rotateY(Math.PI);faceGeometry.translate(centre,bottom+height/2,-.024);
  const face=mark(new THREE.Mesh(photoUVs(faceGeometry),materials.entryPhoto),'入户大门 · 原照片贴纸与木纹');pivot.add(face);

  // The three rectangular panel frames follow the photographed bevels.
  function moulding(a,b,c,e,profile,name){
    const positions=[],uv=[],indices=[];
    for(const [inset,depth] of profile){
      const du=inset/width,dv=inset/height;
      for(const [u,v] of [[a+du,b+dv],[c-du,b+dv],[c-du,e-dv],[a+du,e-dv]]){positions.push(...xyOf(u,v),-depth);uv.push(u,v);}
    }
    for(let level=0;level<profile.length-1;level++)for(let corner=0;corner<4;corner++){
      const i=level*4+corner,j=level*4+(corner+1)%4,k=i+4,l=j+4;indices.push(i,j,l,i,l,k);
    }
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setIndex(indices);geo.computeVertexNormals();
    const mesh=mark(new THREE.Mesh(geo,materials.entryPhoto),name);pivot.add(mesh);return mesh;
  }
  const panels=[[[317,294],[845,643]],[[354,736],[825,1370]],[[411,1480],[797,1704]]];
  for(let i=0;i<panels.length;i++){
    const [tl,br]=panels[i],a=photoUV(...tl),b=photoUV(...br);
    moulding(a[0],Math.max(.007,b[1]),b[0],a[1],[[0,.025],[.008,.033],[.015,.045],[.022,.045],[.032,.028],[.038,.025]],`入户大门 · 第 ${i+1} 段凹凸门板`);
  }
  moulding(.005,.006,.995,.995,[[0,.025],[.005,.034],[.012,.037],[.019,.025]],'入户大门 · 门板包边');

  function relief(points,holes=[],thickness=.009,side='entryBlue',name='入户大门 · 彩色磁力片'){
    const shape=new THREE.Shape(points.map(p=>new THREE.Vector2(...pixel(...p))));
    for(const hole of holes)shape.holes.push(new THREE.Path(hole.map(p=>new THREE.Vector2(...pixel(...p)))));
    const geometry=new THREE.ExtrudeGeometry(shape,{depth:thickness,steps:1,bevelEnabled:false,UVGenerator:{
      generateTopUV(geo,vertices,a,b,c){return [a,b,c].map(i=>new THREE.Vector2(...uvOf(vertices[i*3],vertices[i*3+1])));},
      generateSideWallUV(){return [new THREE.Vector2(0,0),new THREE.Vector2(1,0),new THREE.Vector2(1,1),new THREE.Vector2(0,1)];}
    }});
    const mesh=mark(new THREE.Mesh(geometry,[materials.entryPhoto,materials[side]]),name);mesh.position.z=-.027;mesh.scale.z=-1;pivot.add(mesh);return mesh;
  }
  function square(cx,cy,size,angle,color){
    const points=(half)=>[[-half,-half],[half,-half],[half,half],[-half,half]].map(([x,y])=>[cx+x*Math.cos(angle)-y*Math.sin(angle),cy+x*Math.sin(angle)+y*Math.cos(angle)]);
    relief(points(size/2),[points(size/2-8)],.012,'entry'+color);
  }
  for(const [x,y,s,a,color] of [[241,675,57,.38,'Blue'],[365,692,60,0,'Orange'],[293,1026,56,.18,'Purple'],[287,1081,57,.18,'Purple'],[279,1126,54,.18,'Orange'],[669,961,49,.07,'Red'],[451,1071,59,-.50,'Red'],[500,1044,59,-.50,'Orange'],[531,1090,58,-.50,'Cyan'],[382,1416,55,.25,'Yellow']])square(x,y,s,a,color);
  for(const [outer,inner,color] of [
    [[[902,601],[879,708],[932,713]],[[900,629],[891,695],[919,697]],'Blue'],
    [[[605,1229],[591,1270],[690,1277]],[[611,1244],[605,1263],[660,1268]],'Blue'],
    [[[839,860],[867,823],[893,862],[866,907]],[[851,862],[867,839],[881,863],[866,890]],'Purple'],
    [[[308,1388],[327,1351],[352,1381]],[[320,1381],[329,1367],[341,1380]],'Yellow'],
    [[[312,1397],[350,1397],[334,1432]],[[324,1405],[339,1405],[334,1419]],'Yellow'],
    [[[323,645],[394,643],[425,699],[394,750],[332,750],[303,693]],[[332,657],[387,656],[410,699],[386,736],[341,736],[318,693]],'Red']
  ])relief(outer,[inner],.011,'entry'+color);
  // Multi-sided magnetic outlines, including the purple cube and brick diamond.
  for(const [a,b,color] of [
    [[749,631],[794,601],'Purple'],[[794,601],[847,630],'Purple'],[[847,630],[802,665],'Purple'],[[802,665],[749,631],'Purple'],[[749,631],[752,682],'Purple'],[[752,682],[802,718],'Purple'],[[802,718],[848,682],'Purple'],[[848,682],[847,630],'Purple'],[[802,665],[802,718],'Purple'],
    [[626,648],[663,642],'Red'],[[663,642],[705,682],'Red'],[[705,682],[678,714],'Red'],[[678,714],[640,714],'Red'],[[640,714],[606,673],'Red'],[[606,673],[626,648],'Red']
  ]){
    const delta=new THREE.Vector2(b[0]-a[0],b[1]-a[1]).normalize().multiplyScalar(4),normal=[-delta.y,delta.x];
    relief([[a[0]+normal[0],a[1]+normal[1]],[b[0]+normal[0],b[1]+normal[1]],[b[0]-normal[0],b[1]-normal[1]],[a[0]-normal[0],a[1]-normal[1]]],[],.012,'entry'+color);
  }
  // Photo-backed outlines retain the irregular curved pieces and round magnets.
  const pieces=[[[238,953],[260,931],[281,940],[292,974],[261,998],[237,997]],[[679,1132],[708,1117],[737,1129],[724,1162],[703,1167]],[[477,1145],[492,1121],[518,1129],[521,1154],[505,1170],[481,1167]],[[507,1406],[527,1416],[548,1431],[541,1450],[519,1456],[505,1438]]];
  for(let i=0;i<pieces.length;i++)relief(pieces[i],[],.009,i<2?'entryBlue':'entryCyan');
  for(const [x,y,r] of [[477,865,30],[608,895,29],[709,859,30]]){
    const circle=Array.from({length:32},(_,i)=>[x+Math.cos(i*Math.PI/16)*r,y+Math.sin(i*Math.PI/16)*r]);relief(circle,[],.005,'entryWhite','入户大门 · 圆形磁贴');
  }

  relief([[894,894],[958,890],[963,1008],[893,1010]],[],.024,'entryBlack','入户大门 · 黑色电子锁面板');
  relief([[891,1008],[963,1008],[961,1195],[889,1203]],[],.029,'entryCopper','入户大门 · 铜金色锁体');
  relief([[827,1069],[946,1068],[954,1076],[948,1090],[828,1095]],[],.065,'entryCopper','入户大门 · 铜金色执手');
  relief([[181,460],[230,457],[235,532],[184,535]],[],.013,'entryWhite','入户大门 · 白色数显装置');
  const [px,py]=pixel(590,678);torus(pivot,px,py,-.032,.012,.003,'entryCopper',[0,0,0]);
  const lens=cyl(pivot,px,py,-.033,.007,.007,.006,'entryBlack',16);lens.rotation.x=Math.PI/2;mark(lens,'入户大门 · 猫眼');
  // Hinges are on the left when viewed from inside, matching the photograph.
  for(const y of [.37,1.13,1.89]){const hinge=cyl(pivot,-d.hinge*.018,y,0,.013,.013,.12,'entryCopper',12);mark(hinge,'入户大门 · 铰链');}
  // The outside face receives matching panel relief and a simple metal handle.
  for(const [y,h] of [[1.70,.51],[.95,.78],[.25,.30]]){
    box(pivot,centre,y,.028,width*.64,h,.016,'entryWood');
    for(const s of [-1,1])box(pivot,centre+s*width*.34,y,.035,.025,h+.04,.019,'entryWood');
    for(const s of [-1,1])box(pivot,centre,y+s*(h/2+.01),.035,width*.70,.024,.019,'entryWood');
  }
  box(pivot,-d.hinge*(w-.13),.96,.041,.06,.30,.026,'entryCopper',true);
  box(pivot,-d.hinge*(w-.19),1.01,.064,.16,.023,.035,'entryCopper',true);
}
