import * as THREE from './vendor/three.module.min.js';

// Original SUNFALL port district. Meters; playable ground and 4.8 m roof access
// deliberately retain the combat prototype's collision and spawn contract.
export function createWorld(scene) {
  const root=new THREE.Group();root.name='SUNFALL / PORT INDUSTRIAL';scene.add(root);
  const colliders=[],lootSpots=[],spawns=[];
  const regions=[{name:'SOLAR QUAY',x:-48,z:-44},{name:'OLD QUARTER',x:-42,z:36},{name:'RADIO WORKS',x:43,z:-35},{name:'MIRAGE MARKET',x:39,z:37},{name:'THE CROSSING',x:0,z:0},{name:'SOUTH PROMENADE',x:0,z:72}];
  let seed=721;const rnd=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
  // Original generated local surface maps. UVs are in world meters, including
  // every side of boxes, rather than stretching a single tile over a whole wall.
  const loader=new THREE.TextureLoader(),maps={};
  for(const name of ['concrete','brick','asphalt','metal']){
    const t=loader.load(`./assets/${name}.jpg`);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;maps[name]=t;
  }
  const palette={chalk:'#d1d2c7',cream:'#dedbcc',coral:'#b6aa97',terra:'#ae988b',peach:'#c7c5b4',teal:'#8da49d',tealDark:'#526d6e',navy:'#4b5963',asphalt:'#b6bcba',stripe:'#beb59b',stone:'#ada99b',sand:'#b6b5a6',roof:'#b4b8ac',gold:'#c4ad75',metal:'#a6b2ac',dark:'#333c3b',foliage:'#485340',leafLight:'#5e684f',red:'#864e43',white:'#cacdc1',brick:'#c6b7a7',rust:'#a58b6d',wood:'#6c6553',horizon:'#5d716e'};
  const mats={};
  for(const [key,color] of Object.entries(palette)){
    const texture=key==='asphalt'?'asphalt':['terra','coral','brick'].includes(key)?'brick':['teal','tealDark','navy','metal','rust','gold'].includes(key)?'metal':['chalk','cream','peach','stone','sand','roof'].includes(key)?'concrete':null;
    mats[key]=new THREE.MeshStandardMaterial({color,map:texture?maps[texture]:null,roughness:['metal','teal','tealDark'].includes(key)?.72:.94,metalness:['metal','teal','tealDark'].includes(key)?.25:0});
  }
  mats.glass=new THREE.MeshStandardMaterial({color:'#425c63',roughness:.28,metalness:.5});
  mats.glassDark=new THREE.MeshStandardMaterial({color:'#243638',roughness:.44,metalness:.32});
  mats.rubber=new THREE.MeshStandardMaterial({color:'#242924',roughness:1});
  mats.brakeLight=new THREE.MeshStandardMaterial({color:'#842d24',emissive:'#842d24',emissiveIntensity:.1,roughness:.4});
  mats.water=new THREE.MeshStandardMaterial({color:'#456e75',roughness:.38,metalness:.38});
  mats.foam=new THREE.MeshBasicMaterial({color:'#a5beb6',transparent:true,opacity:.18,depthWrite:false});
  mats.light=new THREE.MeshStandardMaterial({color:'#e2e6d2',emissive:'#abb4a0',emissiveIntensity:1.1,roughness:.5});
  const geos=new Map();
  function boxGeo(w,h,d){const k=`b${w}/${h}/${d}`;if(geos.has(k))return geos.get(k);const g=new THREE.BoxGeometry(w,h,d);const uv=g.attributes.uv;const sizes=[[d,h],[d,h],[w,d],[w,d],[w,h],[w,h]];for(let f=0;f<6;f++)for(let j=0;j<4;j++){const i=f*4+j;uv.setXY(i,uv.getX(i)*sizes[f][0]/3,uv.getY(i)*sizes[f][1]/3);}geos.set(k,g);return g;}
  const cylinder=(top,bottom,h,n=12)=>{const k=`c${top}/${bottom}/${h}/${n}`;if(!geos.has(k)){const g=new THREE.CylinderGeometry(top,bottom,h,n);geos.set(k,g);}return geos.get(k);};
  function mesh(geo,mat,x,y,z,solid=false,cast=true){const m=new THREE.Mesh(geo,typeof mat==='string'?mats[mat]:mat);m.position.set(x,y,z);m.castShadow=cast;m.receiveShadow=true;m.userData.staticBatch=!solid;root.add(m);if(solid){m.userData.solid=true;colliders.push(m);}return m;}
  function box(x,y,z,w,h,d,mat,solid=false,cast=true){return mesh(boxGeo(w,h,d),mat,x,y,z,solid,cast);}
  function pole(x,y,z,r,h,mat='metal',solid=false,n=10){return mesh(cylinder(r,r,h,n),mat,x,y,z,solid);}
  function beam(a,b,r,mat='metal',n=6){const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),delta=bv.clone().sub(av);const m=mesh(cylinder(r,r,delta.length(),n),mat,...av.clone().add(bv).multiplyScalar(.5).toArray());m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());return m;}
  function label(text,w=5,h=1,background='#3a4948',color='#d8d8c8'){
    const c=document.createElement('canvas');c.width=1024;c.height=192;const ctx=c.getContext('2d');ctx.fillStyle=background;ctx.fillRect(0,0,1024,192);ctx.fillStyle=color;ctx.fillRect(18,18,8,156);ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`700 ${text.length>17?58:70}px Arial, sans-serif`;ctx.fillText(text,527,99,940);const tx=new THREE.CanvasTexture(c);tx.colorSpace=THREE.SRGBColorSpace;return mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshStandardMaterial({map:tx,roughness:.87}),0,0,0,false,false);
  }
  // Concrete sea wall, broken shoreline, and distant geological horizon.
  const islandGeo=new THREE.CylinderGeometry(105,108,3,96);const islandPos=islandGeo.attributes.position,islandUV=islandGeo.attributes.uv;for(let i=0;i<islandPos.count;i++)islandUV.setXY(i,islandPos.getX(i)/4,islandPos.getZ(i)/4);const ground=mesh(islandGeo,'sand',0,-1.51,0,false,false);
  const water=mesh(new THREE.CircleGeometry(1300,128),'water',0,-2.6,0,false,false);water.rotation.x=-Math.PI/2;water.userData.staticBatch=false;
  for(let i=0;i<54;i++){const a=i*Math.PI*2/54,r=104+Math.sin(i*2.7)*1.2;const rock=mesh(new THREE.DodecahedronGeometry(4+rnd()*3,1),'stone',Math.cos(a)*r,-3,Math.sin(a)*r,false,false);rock.scale.set(1,.65+rnd()*.4,1);rock.rotation.set(.1,a,.15);}
  const foamRings=[];for(let i=0;i<3;i++){const r=mesh(new THREE.RingGeometry(106+i*1.8,106.35+i*1.8,96),'foam',0,-2.54+i*.02,0,false,false);r.rotation.x=-Math.PI/2;r.userData.staticBatch=false;foamRings.push(r);}
  const distantRidges=[[-2.95,345,72,19,46],[-2.43,315,87,23,38],[-1.84,365,69,16,43],[-1.32,330,83,26,46],[-.72,385,76,21,48],[-.23,340,65,15,39],[.51,375,81,24,41],[2.65,390,89,18,45]];
  for(const [a,r,sx,sy,sz] of distantRidges){const geo=new THREE.IcosahedronGeometry(1,3);const p=geo.attributes.position;for(let j=0;j<p.count;j++){const x=p.getX(j),y=p.getY(j),z=p.getZ(j);const n=1+.11*Math.sin(x*7+z*4)*Math.cos(y*6)+.045*Math.sin(z*17);p.setXYZ(j,x*n,Math.max(-.18,y*n),z*n);}geo.computeVertexNormals();const ridge=mesh(geo,'horizon',Math.cos(a)*r,-5,Math.sin(a)*r,false,false);ridge.scale.set(sx,sy,sz);ridge.rotation.y=a+.7;}
  // Streets, broad concrete pedestrian shoulders and narrow embedded curbs.
  box(0,.008,0,18,.016,194,'asphalt',false,false);box(0,.012,0,181,.016,14,'asphalt',false,false);
  box(-72,.01,-2,9,.02,139,'asphalt',false,false);box(73,.01,0,9,.02,132,'asphalt',false,false);box(0,.011,-65,147,.02,8,'asphalt',false,false);box(0,.013,65,147,.02,8,'asphalt',false,false);
  for(let z=-88;z<=88;z+=12)if(Math.abs(z)>9)box(0,.025,z,.15,.025,4.3,'stripe',false,false);
  for(let x=-78;x<=78;x+=12)if(Math.abs(x)>12)box(x,.03,0,4.5,.025,.15,'stripe',false,false);
  for(const x of [-10.1,10.1]){box(x,.025,0,1.8,.05,190,'chalk',false,false);box(x+(x<0?.94:-.94),.055,0,.14,.09,190,'cream',false,false);}
  for(const z of [-8.2,8.2])box(0,.028,z,142,.05,1.8,'chalk',false,false);
  for(const z of [-12,12])for(let x=-7;x<=7;x+=2)box(x,.045,z,1,.02,2.5,'chalk',false,false);
  for(const x of [-14,14])for(let z=-5;z<=5;z+=2)box(x,.044,z,2.5,.02,1,'chalk',false,false);
  // Road drainage, repaired asphalt strips and loading-bay markings.
  for(let z=-76;z<81;z+=22)for(const x of [-8.7,8.7]){box(x,.035,z,.58,.025,1.4,'dark',false,false);for(let j=0;j<6;j++)box(x,.052,z-.58+j*.23,.62,.025,.045,'metal',false,false);}
  for(const [x,z] of [[-67,-48],[66,-52],[-20,60],[60,60]])for(let j=0;j<5;j++)box(x+j*1.8,.038,z,.11,.018,4.6,'stripe',false,false);
  // The original generous 3 m through-doorways and exact external stair run remain.
  function building(cx,cz,w,d,tone,name,index,stairs=false){
    const H=4.52,T=.4,DW=3,DH=3.15,side=w<18?1:-1;
    box(cx,.04,cz,w,.08,d,'chalk',true);
    for(const x of [cx-w/2,cx+w/2]){const segment=(d-DW)/2;box(x,H/2,cz-(DW+segment)/2,T,H,segment,tone,true);box(x,H/2,cz+(DW+segment)/2,T,H,segment,tone,true);box(x,DH+(H-DH)/2,cz,T,H-DH,DW,tone,true);box(x,.5*DH,cz-DW/2-.09,.52,DH,.15,'tealDark');box(x,.5*DH,cz+DW/2+.09,.52,DH,.15,'tealDark');box(x,DH+.1,cz,.57,.2,DW+.36,'metal');const dir=x<cx?-1:1;box(x+dir*.43,3.44,cz,1.08,.11,3.9,'metal');box(x+dir*.23,.12,cz,.65,.1,3,'dark');}
    box(cx,H/2,cz-d/2,w,H,T,tone,true);box(cx,H/2,cz+d/2,w,H,T,tone,true);
    for(const x of [cx-w/2,cx+w/2])for(const z of [cz-d/2,cz+d/2])box(x,2.3,z,.6,4.6,.6,'chalk');
    box(cx,4.64,cz,w+.6,.32,d+.6,'roof',true);
    box(cx,4.44,cz-d/2-.13,w+.7,.18,.36,'chalk');box(cx,4.44,cz+d/2+.13,w+.7,.18,.36,'chalk');
    for(const x of [cx-w/2-.12,cx+w/2+.12])box(x,4.44,cz,.36,.18,d+.7,'chalk');
    box(cx,5.06,cz-d/2,w+.5,.52,.34,tone,true);for(const x of [cx-w/2,cx+w/2])box(x,5.06,cz,.34,.52,d+.5,tone,true);
    const stairEnd=cx-w/2+.5+19*.62,stairExit=stairEnd+1;
    if(stairs){const lo=cx-w/2,hi=cx+w/2,gap=2.7;if(stairExit-gap/2>lo)box((lo+stairExit-gap/2)/2,5.06,cz+d/2,stairExit-gap/2-lo,.52,.34,tone,true);if(stairExit+gap/2<hi)box((stairExit+gap/2+hi)/2,5.06,cz+d/2,hi-stairExit-gap/2,.52,.34,tone,true);
      for(let i=0;i<19;i++){const h=(i+1)*4.8/19;box(cx-w/2+.5+(i+.5)*.62,h/2,cz+d/2+1.55,.64,h,2.5,'chalk',true);box(cx-w/2+.5+(i+.5)*.62,h+.018,cz+d/2+1.55,.15,.036,2.48,'metal');}
      box(stairExit,4.66,cz+d/2+.3,2,.28,3,'chalk',true);const rz=cz+d/2+2.84;beam([cx-w/2+.5,.9,rz],[stairExit,5.7,rz],.055,'metal');for(let i=0;i<6;i++){const f=i/5;pole(cx-w/2+.5+f*(stairExit-(cx-w/2+.5)),.47+f*4.8,rz,.045,.94,'metal');}
    }else box(cx,5.06,cz+d/2,w+.5,.52,.34,tone,true);
    // Deep masonry window reveals: glazing is behind protruding piers, sill and
    // lintel, with actual frame depth and projecting small metal shade canopies.
    for(const dir of [-1,1]){const z=cz+dir*d/2;box(cx,.38,z+dir*.27,w-.5,.64,.2,'chalk');
      for(const dx of [-w*.3,0,w*.3]){const xx=cx+dx,ww=index%3===0?2.5:2.05;box(xx,2.45,z+dir*.245,ww,1.9,.12,'dark');box(xx,2.45,z+dir*.325,ww-.22,1.63,.07,(index+Math.round(dx))%2?'glass':'glassDark');for(const sx of [-1,1])box(xx+sx*(ww/2+.13),2.43,z+dir*.42,.28,2.35,.62,'chalk');box(xx,3.58,z+dir*.42,ww+.54,.24,.62,'chalk');box(xx,1.32,z+dir*.5,ww+.7,.22,.82,'chalk');box(xx,2.45,z+dir*.39,.065,1.86,.065,'metal');box(xx,2.48,z+dir*.39,ww,.065,.065,'metal');box(xx,3.7,z+dir*.83,ww+.82,.065,1.2,'tealDark');
        // Lower opaque panels and a vertical blind in alternating rooms.
        if(index%3===1)for(let j=0;j<5;j++)box(xx-ww*.38+j*ww*.19,2.45,z+dir*.37,.06,1.61,.055,'cream');}
      // Downpipes with collars and wall-mounted power conduits.
      const px=cx-w/2+.78;pole(px,2.35,z+dir*.52,.09,4.45,'rust');for(const y of [.7,2.5,4.15])box(px,y,z+dir*.49,.26,.075,.23,'metal');
      box(cx+w*.4,1.3,z+dir*.38,.72,.9,.32,'metal');box(cx+w*.4,1.3,z+dir*.56,.49,.66,.07,'tealDark');beam([cx+w*.4,1.8,z+dir*.42],[cx+w*.4,4.1,z+dir*.42],.028,'dark');
    }
    const faceX=cx+(cx<0?w/2:-w/2),sx=cx<0?1:-1;const sign=label(name,Math.min(d-2,8),.75,index%2?'#384e50':'#665849');sign.position.set(faceX+sx*.32,3.84,cz);sign.rotation.y=sx*Math.PI/2;
    const number=label(String(index+1).padStart(2,'0'),1.2,.85,'#8e804f','#242e2e');number.position.set(faceX+sx*.27,2.36,cz+2.32);number.rotation.y=sx*Math.PI/2;
    // Original cover volumes; detailed desk and storage furniture around them.
    const deskX=cx+side*w*.23,deskZ=cz-d*.22,storeX=cx-side*w*.24,storeZ=cz+d*.2;
    box(deskX,.62,deskZ,3.4,1.24,1.1,'tealDark',true);box(storeX,.8,storeZ,2.1,1.6,1.6,'wood',true);box(deskX,1.29,deskZ,3.6,.12,1.3,'wood');
    for(const xx of [-1.1,1.1]){box(deskX+xx,.71,deskZ+.57,.87,.85,.055,'metal');for(let j=0;j<3;j++)box(deskX+xx,.42+j*.26,deskZ+.607,.22,.035,.04,'dark');}
    box(deskX+.6,1.69,deskZ,.84,.59,.1,'dark');box(deskX+.6,1.7,deskZ+.061,.73,.46,.03,'glass');box(deskX+.6,1.39,deskZ,.15,.19,.15,'metal');box(deskX+.6,1.345,deskZ+.26,.86,.035,.28,'dark');box(deskX-1.05,1.44,deskZ,.4,.24,.58,'cream');
    for(const y of [.38,.82,1.25])box(storeX,y,storeZ+.83,1.83,.045,.04,'dark');
    const shelfX=cx-w*.3,shelfZ=cz-d/2+.75;for(const xx of [-1.7,1.7])for(const zz of [-.35,.35])box(shelfX+xx,1.5,shelfZ+zz,.065,3,.065,'metal');for(let y=.35;y<3;y+=.8){box(shelfX,y,shelfZ,3.6,.08,.8,'metal');for(let j=0;j<3;j++)box(shelfX-1.1+j*1.08,y+.29,shelfZ,.72,.48,.62,j%2?'wood':'cream');}
    // Ceiling beams, cable trays and practical fluorescent fixtures.
    for(const dz of [-d*.25,d*.25]){box(cx,4.21,cz+dz,w-.4,.25,.19,'metal');box(cx,4.05,cz+dz,3.2,.15,.38,'navy');box(cx,3.96,cz+dz,2.88,.06,.19,'light');}
    box(cx+w/2-.36,2.0,cz+d*.27,.16,1.4,.65,'red');box(cx+w/2-.24,2.1,cz+d*.27,.1,.14,.18,'cream');
    // Existing roof utility cover plus intake grille, ductwork and safety rails.
    box(cx-w*.2,5.15,cz-d*.22,2.1,.7,1.5,'metal',true);box(cx-w*.2,5.56,cz-d*.22,2.2,.12,1.6,'chalk');for(let j=0;j<7;j++)box(cx-w*.2-.82+j*.27,5.18,cz-d*.22+.76,.08,.46,.045,'dark');
    box(cx-w*.2,5.04,cz-d*.36,1.1,.44,d*.23,'metal');pole(cx+w*.25,5.5,cz-d*.25,.12,1.4,'metal');mesh(cylinder(.45,.45,.15,12),'dark',cx+w*.25,6.19,cz-d*.25);
    // Setback service wings provide a varied industrial roofline while keeping
    // the south stair landing and central rooftop loot fully unobstructed.
    if([0,3,6,8,11].includes(index)){const th=[0,6].includes(index)?8.7:4.6,tw=w*.4,td=d*.25,ux=cx+w*.2,uz=cz-d*.31;box(ux,4.8+th/2,uz,tw,th,td,index%2?'brick':'chalk',true);box(ux,4.8+th+.15,uz,tw+.42,.3,td+.42,'roof');
      for(let yy=6.4;yy<4.8+th-1;yy+=2.85)for(let j=0;j<3;j++){const wx=ux-tw*.32+j*tw*.32;box(wx,yy,uz+td/2+.075,tw*.21,1.5,.15,'glassDark');for(const k of [-1,1])box(wx+k*tw*.115,yy,uz+td/2+.2,.1,1.76,.38,'metal');box(wx,yy+.85,uz+td/2+.23,tw*.26,.13,.4,'chalk');}
      for(const dx of [-tw*.35,tw*.35])pole(ux+dx,5.4+th,uz,.2,1.2,'metal');
    }
    lootSpots.push({x:cx,y:.12,z:cz-d*.2},{x:cx,y:.12,z:cz+d*.22},{x:cx+2,y:4.92,z:cz+1});
  }
  const lots=[[-49,-40,20,19,'peach','QUAY LOGISTICS',true],[-25,-35,16,18,'coral','DIESEL & PARTS',false],[-50,-14,20,15,'chalk','MACHINE SHOP',false],[-30,21,20,18,'terra','PORT AUTHORITY',true],[-54,43,18,20,'cream','CUSTOMS OFFICE',false],[-27,48,17,18,'peach','STOREHOUSE 06',false],[28,-40,19,23,'cream','RADIO STATION 07',true],[54,-36,18,20,'terra','HELIOS WORKS',false],[30,12,20,18,'coral','FIELD OPERATIONS',false],[55,16,17,20,'chalk','MEDICAL DEPOT',true],[29,43,20,18,'peach','SUPPLY EXCHANGE',true],[55,46,18,18,'terra','MAINTENANCE 12',false]];
  lots.forEach((b,i)=>building(...b.slice(0,6),i,b[6]));
  function crate(x,z,w=2.2,h=1.5,d=2.2,tone='teal',y=0){box(x,y+h/2,z,w,h,d,tone,true);box(x,y+h+.04,z,w+.07,.09,d+.07,'wood');for(const xx of [-w*.32,w*.32]){box(x+xx,y+h/2,z+d/2+.025,.12,h,.09,'metal');box(x+xx,y+h/2,z-d/2-.025,.12,h,.09,'metal');}for(const zz of [-d*.38,d*.38])box(x,y+.1,z+zz,w+.1,.2,.18,'wood');}
  function barrier(x,z,rot=0){const m=box(x,.6,z,4.8,1.2,.85,'chalk',true);m.rotation.y=rot;const b=box(x,1.03,z,4.7,.18,.88,'gold');b.rotation.y=rot;for(const dx of [-1.5,0,1.5]){const xx=x+Math.cos(rot)*dx,zz=z-Math.sin(rot)*dx;const q=box(xx,1.034,zz,.4,.185,.895,'dark');q.rotation.y=rot;}}
  [[-14,-53],[14,-25],[-15,31],[15,57],[-62,-26],[-39,8],[43,-16],[69,38],[40,58],[-57,63],[-82,8],[81,-8]].forEach(([x,z],i)=>crate(x,z,2.4,1.55,2,i%3?'teal':'wood'));
  [[-13,-17],[12,29],[-10,61],[35,-10],[-33,-9],[-63,12],[68,-11],[-11,-75],[14,78]].forEach(([x,z],i)=>barrier(x,z,i%3===0?Math.PI/2:0));
  // Worn curbside service vehicles provide grounded street scale and useful
  // waist/cab-high cover. Their axes align to existing collision AABBs.
  function utilityVehicle(x,z,van=false,tone='teal',facing=1){
    const zz=v=>z+v*facing;
    box(x,.77,z,2.13,.72,5.05,tone,true);
    box(x,.48,z,1.73,.22,4.78,'dark');
    // Distinct short engine hood, slanted windshield, and upright rear cabin.
    box(x,1.27,zz(-1.68),2.08,.3,1.28,tone);
    box(x,1.21,zz(-2.48),2.13,.55,.14,'metal');
    box(x,1.18,zz(-2.566),1.09,.25,.05,'dark');
    for(let j=0;j<5;j++)box(x-.44+j*.22,1.18,zz(-2.6),.045,.2,.05,'metal');
    for(const dx of [-.83,.83]){box(x+dx,1.3,zz(-2.575),.35,.21,.055,'cream');box(x+dx,.88,zz(2.565),.24,.29,.07,'brakeLight');}
    box(x,.73,zz(-2.67),2.28,.18,.2,'metal');box(x,.72,zz(2.62),2.26,.16,.17,'metal');
    const cabZ=van?.35:-.26,cabDepth=van?3.65:2.2,cabHeight=van?1.33:1.02,cabTop=1.27+cabHeight;
    // Full physical cabin volume, with glazing recessed behind the pillars.
    const cabGeo=new THREE.BoxGeometry(1.94,cabHeight,cabDepth);const cp=cabGeo.attributes.position;for(let i=0;i<cp.count;i++)if(cp.getY(i)>0&&cp.getZ(i)<0)cp.setZ(i,cp.getZ(i)+.42);cabGeo.computeVertexNormals();const cab=mesh(cabGeo,tone,x,1.27+cabHeight/2,zz(cabZ),true);cab.rotation.y=facing<0?Math.PI:0;
    box(x,cabTop+.025,zz(cabZ+.2),2.02,.13,cabDepth-.28,tone);
    const frontZ=cabZ-cabDepth/2;
    const windshield=box(x,1.27+cabHeight*.55,zz(frontZ+.20),1.66,cabHeight*.82,.055,'glassDark');windshield.rotation.x=facing*Math.atan(.42/cabHeight);
    for(const dx of [-.92,.92]){const pillar=box(x+dx,1.27+cabHeight*.55,zz(frontZ+.20),.11,cabHeight*.93,.11,'metal');pillar.rotation.x=facing*Math.atan(.42/cabHeight);}
    box(x,1.44,zz(frontZ-.17),1.94,.12,.19,tone);
    for(const dx of [-1,1]){
      // Door glass sits behind projecting frames, mirror and stamped door skin.
      box(x+dx*.986,1.93,zz(van?-1.0:-.43),.055,.69,1.03,'glass');
      for(const q of [-1.58,-.43])box(x+dx*1.025,1.91,zz(van?q:q+.59),.08,.9,.07,'metal');
      box(x+dx*1.018,1.48,zz(van?-1.0:-.43),.055,.13,1.22,tone);
      box(x+dx*1.035,1.24,zz(van?-1.0:-.43),.06,.29,1.2,tone);
      box(x+dx*1.07,1.55,zz(van?-.56:.06),.08,.055,.2,'metal');
      beam([x+dx*.96,1.79,zz(frontZ+.05)],[x+dx*1.31,1.79,zz(frontZ-.08)],.04,'metal');
      box(x+dx*1.32,1.84,zz(frontZ-.08),.17,.27,.31,'navy');
      box(x+dx*1.07,.92,z,.13,.13,4.74,'dark');
      // Round tire silhouettes, inset hubs, fender brows and mud flaps.
      for(const wz of [-1.7,1.66]){
        const tire=mesh(cylinder(.48,.48,.27,20),'rubber',x+dx*1.075,.52,zz(wz));tire.rotation.z=Math.PI/2;
        const hub=mesh(cylinder(.25,.25,.285,16),'metal',x+dx*1.09,.52,zz(wz));hub.rotation.z=Math.PI/2;
        const hubCap=mesh(cylinder(.11,.11,.305,10),'dark',x+dx*1.1,.52,zz(wz));hubCap.rotation.z=Math.PI/2;
        box(x+dx*1.09,1.0,zz(wz),.2,.16,1.19,tone);
        box(x+dx*1.03,.34,zz(wz+.48),.29,.31,.065,'rubber');
      }
    }
    if(van){
      // Rear cargo doors, locking hardware, roof gutter and weathered roof rack.
      for(const dx of [-.47,.47]){box(x+dx,1.92,zz(2.222),.88,1.06,.06,'tealDark');box(x+dx,2.16,zz(2.26),.64,.43,.035,'glassDark');box(x+dx*.25,1.65,zz(2.28),.05,.28,.05,'metal');}
      for(const dx of [-.77,.77])box(x+dx,cabTop+.23,zz(.31),.08,.19,3.28,'metal');
      for(const dz of [-1.15,.25,1.6])box(x,cabTop+.24,zz(dz),1.65,.09,.08,'metal');
      box(x+.19,cabTop+.38,zz(.65),1.25,.3,1.48,'wood');
      for(const dz of [.1,1.2])box(x+.19,cabTop+.55,zz(dz),1.32,.06,.09,'metal');
    }else{
      // Open pickup bed, separate side walls and strapped maintenance cargo.
      box(x,1.17,zz(1.75),1.86,.1,1.32,'dark');
      for(const dx of [-.98,.98])box(x+dx,1.42,zz(1.6),.15,.56,1.72,tone);
      box(x,1.42,zz(2.43),2.02,.56,.14,tone);
      box(x,1.36,zz(2.52),.61,.08,.04,'metal');
      box(x-.37,1.47,zz(1.73),.81,.56,.85,'wood');box(x+.49,1.43,zz(1.68),.55,.48,.99,'tealDark');
      for(const dx of [-.65,-.14])box(x+dx,1.77,zz(1.73),.055,.045,.91,'metal');
      box(x,1.88,zz(.876),1.52,.48,.055,'glassDark');
    }
    const plate=label('SFL '+String(Math.round(Math.abs(z))*7).padStart(3,'0'),.59,.16,'#c7c9b9','#303935');plate.position.set(x,.79,zz(-2.782));plate.rotation.y=facing>0?Math.PI:0;
  }
  utilityVehicle(-6.35,-52,false,'teal',1);utilityVehicle(6.35,-28,true,'cream',-1);
  utilityVehicle(-6.35,26,true,'teal',1);utilityVehicle(6.35,51,false,'cream',-1);
  utilityVehicle(6.35,-76,false,'rust',1);utilityVehicle(-6.35,65,true,'navy',-1);
  // Small curbside works; central street and existing AI corridors stay open.
  for(const [x,z] of [[-7.4,-13],[7.5,12],[-7.4,43]]){
    box(x,.47,z,1.8,.94,.66,'gold',true);box(x,.52,z+.35,1.79,.28,.045,'dark');
    for(const dx of [-.7,.7])box(x+dx,.1,z,.28,.2,1.05,'metal');
    for(const dz of [-1.23,1.23]){box(x,.055,z+dz,.4,.11,.4,'rubber');mesh(cylinder(.045,.17,.58,8),'gold',x,.38,z+dz);}
  }
  function container(x,z,tone,length=11,y=0,solid=true){box(x,y+1.6,z,length,3.2,4.5,tone,solid);box(x,y+3.23,z,length+.1,.13,4.6,'metal');for(const side of [-1,1]){for(let j=0;j<18;j++)box(x-length/2+.35+j*(length-.7)/17,y+1.6,z+side*2.28,.09,2.95,.11,'tealDark');box(x,y+.12,z+side*2.31,length,.17,.16,'metal');}box(x+length/2+.05,y+1.6,z,.13,2.9,4.22,'tealDark');for(const dz of [-1.1,1.1]){box(x+length/2+.16,y+1.6,z+dz,.08,2.65,.075,'metal');for(const h of [.6,2.6])box(x+length/2+.18,y+h,z+dz,.09,.12,.33,'metal');}const tag=label('SFL  0'+Math.round(Math.abs(x)),3.6,.55,'#425b5d');tag.position.set(x,y+2.52,z+2.355);}
  container(-53,-75,'teal',15);container(-31,-76,'rust',12);container(34,-76,'teal',12);container(56,-73,'coral',14);
  container(-53,-75,'rust',14,3.32);container(56,-73,'teal',12,3.32);
  function crane(x,z,flip=1){box(x,1.1,z,4.5,2.2,4.5,'stone',true);for(const dx of [-1.2,1.2])for(const dz of [-1.2,1.2])box(x+dx,8.5,z+dz,.32,15,.32,'gold');for(let y=3;y<15;y+=3){beam([x-1.2,y,z-1.2],[x+1.2,y+3,z-1.2],.09,'gold');beam([x-1.2,y,z+1.2],[x+1.2,y+3,z+1.2],.09,'gold');}box(x+flip*5.5,15.5,z,16,1,1.15,'gold');box(x-flip*3,14.1,z,3,2.1,2.8,'teal');box(x-flip*3,14.25,z+1.44,2.58,1.4,.06,'glass');beam([x,18,z],[x+flip*13,16,z],.075,'metal');beam([x,18,z],[x-flip*3.8,16,z],.075,'metal');pole(x,16.7,z,.12,3,'gold');pole(x+flip*11,11.5,z,.065,7,'metal');box(x+flip*11,7.8,z,.8,.65,.75,'dark');for(let dx=-2;dx<13;dx+=2)beam([x+flip*dx,15.15,z-.56],[x+flip*(dx+1.5),16,z-.56],.065,'metal');}
  crane(-76,-62,1);crane(77,-57,-1);
  // Three inaccessible skyline setpieces stand across the water, outside the
  // playable island. No fake ground-level entrances are presented to players.
  function skyline(x,z,w,d,h,tone){box(x,h/2-1,z,w,h,d,tone,false);box(x,h-1,z,w+.7,.6,d+.7,'roof');for(let y=4;y<h-2;y+=3.7){box(x,y-1.25,z+d/2+.2,w+.2,.22,.42,'chalk');for(let xx=-w/2+1.35;xx<w/2-1;xx+=2.75){box(x+xx,y,z+d/2+.19,1.7,2.05,.18,'glassDark');box(x+xx-1,y,z+d/2+.36,.23,2.6,.48,'chalk');}for(let zz=-d/2+1.5;zz<d/2;zz+=2.8){box(x-w/2-.17,y,z+zz,.15,2.05,1.7,'glassDark');box(x-w/2-.32,y,z+zz-1,.45,2.6,.2,'chalk');}}box(x-w*.1,h+1,z-d*.1,w*.5,4,d*.47,'metal');for(let j=0;j<3;j++)box(x-w*.35+j*w*.3,h+.8,z+d*.3,1.4,3,1.4,'metal');}
  skyline(-35,-149,19,17,36,'chalk');skyline(-1,-160,27,20,49,'brick');skyline(36,-146,20,24,32,'peach');
  // A single broad northern industrial shore grounds the three towers. Its
  // nearest bank stays beyond the playable island; open water remains elsewhere.
  const mainland=mesh(cylinder(1,1.08,4,48),'horizon',0,-2,-154,false,false);mainland.scale.set(70,1,34);
  box(0,.025,-154,111,.15,43,'roof',false,false);
  const tx=-63,tz=65;for(const dx of [-2.5,2.5])for(const dz of [-2.5,2.5]){pole(tx+dx,5.5,tz+dz,.22,11,'metal');beam([tx+dx,1,tz+dz],[tx-dx,10,tz+dz],.085,'metal');}
  mesh(cylinder(4,4,5.5,24),'teal',tx,12,tz);mesh(cylinder(0,4.3,1.8,24),'metal',tx,15.65,tz);mesh(cylinder(4.2,4.2,.35,24),'chalk',tx,9.35,tz);for(const y of [9.9,13.9]){const ring=mesh(new THREE.TorusGeometry(4.03,.055,6,40),'metal',tx,y,tz);ring.rotation.x=Math.PI/2;}const wl=label('SUNFALL  /  H2O',5.8,1);wl.position.set(tx,12,tz+4.035);
  const radioX=29,radioZ=-46;pole(radioX,12,radioZ,.15,14,'cream');for(let y=7;y<18;y+=2){box(radioX,y,radioZ,2.5,.08,.08,'red');beam([radioX-1.25,y,radioZ],[radioX+1.25,y+2,radioZ],.045,'metal');}for(const x of [radioX-1.1,radioX+1.1])pole(x,18,radioZ,.08,3,'red');
  // Supply shelters retain their useful low cover while losing resort stripes.
  function stall(x,z,tone){for(const dx of [-2.5,2.5])for(const dz of [-1.7,1.7])pole(x+dx,1.7,z+dz,.08,3.4,'metal');box(x,1,z,4.5,2,1.15,'tealDark',true);box(x,2.07,z,4.75,.14,1.4,'wood');box(x,3.5,z,5.4,.12,3.8,tone);for(let j=0;j<8;j++)box(x-2.45+j*.7,3.6,z,.1,.13,3.8,'metal');for(let i=0;i<4;i++)crate(x-1.6+i*1.05,z,.75,.3,.65,i%2?'wood':'cream',2.15);lootSpots.push({x:x-1.2,y:.12,z:z+2.5});}
  stall(27,72,'rust');stall(42,73,'teal');stall(-27,72,'rust');
  // Former monument becomes an industrial pump station with the same footprints.
  mesh(cylinder(5,5,.35,32),'chalk',0,.15,77,true);mesh(cylinder(3.9,4.2,.4,32),'teal',0,.5,77,true);box(0,.78,77,1.2,.65,1.2,'stone',true);mesh(cylinder(1.75,1.75,3.8,24),'metal',0,2.45,77);for(const x of [-2.8,2.8]){pole(x,1.7,77,.36,2.4,'tealDark');beam([x,2.9,77],[0,2.9,77],.36,'tealDark',12);}pole(0,5,77,.13,1.3,'metal');
  // Sparse wind-shaped coastal trees with layered organic crowns.
  const leafGeo=new THREE.BufferGeometry();leafGeo.setAttribute('position',new THREE.Float32BufferAttribute([0,0,-.16,-.065,.008,-.08,-.078,.009,.045,0,.018,.17,.078,.009,.045,.065,.008,-.08,0,.026,0],3));leafGeo.setIndex([6,0,1,6,1,2,6,2,3,6,3,4,6,4,5,6,5,0]);leafGeo.computeVertexNormals();mats.foliage.side=mats.leafLight.side=THREE.DoubleSide;
  function coastalTree(x,z,h=8){
    const trunk=mesh(cylinder(.11,.27,h*.69,9),'wood',x,h*.345,z);trunk.rotation.z=.05;
    for(let k=0;k<7;k++){
      const a=k*2.399+(x+z)*.08,reach=.85+(k%3)*.5,tipX=x+Math.cos(a)*reach,tipZ=z+Math.sin(a)*reach,tipY=h*(.59+(k%4)*.085);
      beam([x,h*.37+k*.18,z],[tipX,tipY,tipZ],.047+(k%2)*.018,'wood');
      // Numerous small separated leaf sprays, each composed of intersecting
      // curved individual leaves. The gaps expose branches and break the silhouette.
      for(let q=0;q<5;q++){
        const qa=a+q*2.1,offset=.18+q*.11,lx=tipX+Math.cos(qa)*offset,lz=tipZ+Math.sin(qa)*offset,ly=tipY+Math.sin(q*1.7)*.39;
        for(let j=0;j<14;j++){const ja=j*2.399+qa,jr=.12+(j%4)*.1;const leaf=mesh(leafGeo,(k+q+j)%3?'foliage':'leafLight',lx+Math.cos(ja)*jr,ly+Math.sin(j*1.27)*.23,lz+Math.sin(ja)*jr);leaf.scale.setScalar(.9+(j%3)*.22);leaf.rotation.set(Math.sin(j*1.7)*.9,ja,Math.cos(j*.8)*.7);}
      }
    }
  }
  [[-84,-32],[-84,32],[-77,49],[-67,80],[-44,84],[-19,87],[18,88],[49,81],[77,51],[86,25],[86,-30],[-11,-43],[12,44],[-13,11],[13,-61],[-44,61],[69,59],[-62,-53],[65,-54],[-65,23]].forEach(([x,z],i)=>coastalTree(x,z,7+(i%4)*.6));
  for(const z of [-56,-26,26,56])for(const x of [-11.3,11.3]){pole(x,3,z,.075,6,'navy');box(x+(x>0?-.6:.6),6,z,1.4,.14,.45,'navy');box(x+(x>0?-.95:.95),5.88,z,.75,.05,.3,'light');}
  // Utility lines sag between real poles and sit well above all traversal lanes.
  for(const x of [-69,70]){for(const z of [-48,-16,18,51]){pole(x,4.65,z,.105,9.3,'wood');box(x,8.85,z,1.5,.12,.14,'metal');for(const dx of [-.56,.56])pole(x+dx,9.1,z,.055,.4,'cream');}for(const za of [-48,-16,18])for(const dx of [-.56,.56])for(let j=0;j<8;j++){const a=j/8,b=(j+1)/8;beam([x+dx,9-1.4*Math.sin(a*Math.PI),za+a*(za===18?33:za===-16?34:32)],[x+dx,9-1.4*Math.sin(b*Math.PI),za+b*(za===18?33:za===-16?34:32)],.019,'dark',4);}}
  function bench(x,z){box(x,.5,z,3,.18,.7,'wood',true);for(const dx of [-1.1,1.1])box(x+dx,.25,z,.2,.5,.62,'metal');box(x,1,z-.35,3,.7,.14,'wood');}bench(-14,77);bench(14,77);bench(-65,38);bench(70,30);
  for(let i=0;i<21;i++){const a=(i+.4)*Math.PI*2/21,r=93+(i%3)*2;const b=mesh(new THREE.DodecahedronGeometry(1.5+(i%4)*.3,1),'stone',Math.cos(a)*r,.7,Math.sin(a)*r,true);b.scale.set(1.4,.8,1);b.rotation.y=a;}
  [[0,-84],[-16,-61],[15,-48],[-11,-30],[10,-10],[-21,0],[21,0],[-63,0],[65,0],[-14,19],[14,18],[-15,44],[13,68],[0,57],[-43,64],[59,64],[-81,-4],[82,4],[-41,-61],[48,-60],[-64,30],[69,26]].forEach(([x,z])=>spawns.push({x,z}));
  [[-17,-55],[18,-20],[-16,38],[17,59],[-40,-74],[44,-74],[-66,-40],[66,-34],[-72,16],[73,46],[-24,64],[42,65]].forEach(([x,z])=>lootSpots.push({x,y:.12,z}));
  // Merge all decorative geometry by material/shadow state. Keeps world-scale
  // UVs, dramatically reduces draws, and leaves solid colliders individually
  // inspectable by the existing movement, stair and weapon raycast code.
  const batches=new Map();for(const child of [...root.children]){if(!child.isMesh||!child.userData.staticBatch||child.material.transparent)continue;const key=child.material.uuid+'/'+child.castShadow;if(!batches.has(key))batches.set(key,[]);batches.get(key).push(child);}
  for(const list of batches.values()){if(list.length<2)continue;let vc=0,ic=0;for(const m of list){vc+=m.geometry.attributes.position.count;ic+=m.geometry.index?m.geometry.index.count:m.geometry.attributes.position.count;}const pos=new Float32Array(vc*3),nor=new Float32Array(vc*3),uv=new Float32Array(vc*2),ind=new Uint32Array(ic);let vo=0,io=0;const v=new THREE.Vector3(),n=new THREE.Vector3(),nm=new THREE.Matrix3();for(const m of list){m.updateMatrix();nm.getNormalMatrix(m.matrix);const a=m.geometry.attributes;for(let j=0;j<a.position.count;j++){v.fromBufferAttribute(a.position,j).applyMatrix4(m.matrix);pos.set([v.x,v.y,v.z],(vo+j)*3);if(a.normal){n.fromBufferAttribute(a.normal,j).applyMatrix3(nm).normalize();nor.set([n.x,n.y,n.z],(vo+j)*3);}if(a.uv)uv.set([a.uv.getX(j),a.uv.getY(j)],(vo+j)*2);}const ix=m.geometry.index;const count=ix?ix.count:a.position.count;for(let j=0;j<count;j++)ind[io+j]=vo+(ix?ix.getX(j):j);io+=count;vo+=a.position.count;root.remove(m);}const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(pos,3));geo.setAttribute('normal',new THREE.BufferAttribute(nor,3));geo.setAttribute('uv',new THREE.BufferAttribute(uv,2));geo.setIndex(new THREE.BufferAttribute(ind,1));geo.computeBoundingSphere();const b=new THREE.Mesh(geo,list[0].material);b.name='Batched port architecture';b.castShadow=list[0].castShadow;b.receiveShadow=true;root.add(b);}
  root.updateMatrixWorld(true);
  return {root,colliders,spawns,lootSpots,regions,groundHeight:(x,z)=>Math.hypot(x,z)<=105?0:-2.6,update(t,dt){foamRings.forEach((r,i)=>{const s=1+Math.sin(t*.45+i)*.004;r.scale.set(s,s,1);r.material.opacity=.18;});}};
}
