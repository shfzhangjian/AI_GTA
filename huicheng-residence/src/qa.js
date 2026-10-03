// Optional integration diagnostics, available only at /?qa=1.
// Verifies actual walkable connectivity of the built model, including all furniture.
import { X,Z,SCALE,rooms,pointInPoly } from './data.js';
import { Box3 } from 'three';
export function runDiagnostics(app) {
  const {home,blocked,teleport,walkCamera}=app;
  const cabinet=home.doorObjects.find(d=>d.data.id==='wardrobe-entry'),initiallyClosed=!cabinet.open;
  if(initiallyClosed){home.toggleDoor(cabinet.data.id);home.update(2);}
  const report={spaces:rooms.length,furniture:home.furnitureGroups.length,meshes:0,triangles:0,geometryErrors:[],destinations:[],unreachable:[]};
  home.root.updateMatrixWorld(true);
  home.root.traverse(m=>{if(!m.isMesh)return;report.meshes++;const p=m.geometry.getAttribute('position');report.triangles+=(m.geometry.index?.count||p.count)/3;
    for(let i=0;i<p.array.length;i++)if(!Number.isFinite(p.array[i])){report.geometryErrors.push(m.userData.furniture||'architecture');break;}
  });
  const step=6,nx=162,nz=122,walkable=new Uint8Array(nx*nz),visited=new Uint8Array(nx*nz),queue=[];
  for(let j=0;j<nz;j++)for(let i=0;i<nx;i++)walkable[j*nx+i]=!blocked(X(217+i*step),Z(303+j*step));
  const index=(x,z)=>Math.round((z-303)/step)*nx+Math.round((x-217)/step);
  teleport([695,903]);const original=walkCamera.position.clone();
  const start=index(original.x*SCALE+698.5,original.z*SCALE+665.5);
  if(walkable[start]){queue.push(start);visited[start]=1;}
  for(let q=0;q<queue.length;q++){const id=queue[q],i=id%nx,j=Math.floor(id/nx);for(const [di,dj] of [[1,0],[-1,0],[0,1],[0,-1]]){const ii=i+di,jj=j+dj,n=jj*nx+ii;if(ii<0||ii>=nx||jj<0||jj>=nz||visited[n]||!walkable[n])continue;visited[n]=1;queue.push(n);}}
  for(const r of rooms){teleport(r.spawn,r.yaw);const p=walkCamera.position,px=p.x*SCALE+698.5,pz=p.z*SCALE+665.5;let reachable=false;const target=index(px,pz);
    for(let dj=-2;dj<=2;dj++)for(let di=-2;di<=2;di++)if(visited[target+dj*nx+di])reachable=true;
    const entry={name:r.name,spawnClear:!blocked(p.x,p.z),insideRoom:pointInPoly(px,pz,r.poly),reachable,actual:[+px.toFixed(1),+pz.toFixed(1)]};report.destinations.push(entry);if(!reachable)report.unreachable.push(r.name);
  }
  const bathroomDoor=home.doorObjects.find(d=>d.data.id==='bath'),bounds=new Box3().setFromObject(bathroomDoor.pivot);
  report.bathroomDoor={inward:Math.abs(bathroomDoor.pivot.rotation.y+Math.PI/2)<.001,insideBathroom:bounds.max.z*SCALE+665.5<528,wallClearanceMm:+((X(639)-bounds.max.x)*1000).toFixed(1)};
  const studyDoor=home.doorObjects.find(d=>d.data.id==='study'),studyBounds=new Box3().setFromObject(studyDoor.pivot),study=rooms.find(r=>r.id==='study');
  report.masterApproach={noDoor:!home.doorObjects.some(d=>d.data.id==='master'),passageClear:!blocked(X(766),Z(538))};
  const studyCorners=[[studyBounds.min.x,studyBounds.min.z],[studyBounds.min.x,studyBounds.max.z],[studyBounds.max.x,studyBounds.min.z],[studyBounds.max.x,studyBounds.max.z]];
  report.studyDoor={insideStudy:studyCorners.every(([x,z])=>pointInPoly(x*SCALE+698.5,z*SCALE+665.5,study.poly)),wallClearanceMm:+((studyBounds.min.z-Z(532))*1000).toFixed(1),leafCollision:blocked((studyBounds.min.x+studyBounds.max.x)/2,(studyBounds.min.z+studyBounds.max.z)/2),passageClear:!blocked(X(597),Z(575))};
  const entry=home.doorObjects.find(d=>d.data.id==='entry'),entryBounds=new Box3().setFromObject(entry.leaf);
  const nearEntry=[X(692),Z(933)-.17],entryOpenClear=!blocked(...nearEntry);
  const viewDoor=home.doorObjects.reduce((nearest,d)=>Math.hypot(d.data.x-692,d.data.z-818)<Math.hypot(nearest.data.x-692,nearest.data.z-818)?d:nearest);
  report.entryDoor={opensInside:entryBounds.max.z<Z(933),openLeafCollision:blocked((entryBounds.min.x+entryBounds.max.x)/2,(entryBounds.min.z+entryBounds.max.z)/2),openPassageClear:entryOpenClear,viewpointClear:!blocked(X(692),Z(818)),viewpointTargetsEntry:viewDoor.data.id==='entry'};
  home.toggleDoor('entry');home.update(2);report.entryDoor.closedBlocks=blocked(...nearEntry);
  home.toggleDoor('entry');home.update(2);home.root.updateMatrixWorld(true);
  report.roomSlides=[];
  for(const [id,point] of [['kitchen-entry',[562,736]],['utility-entry',[438,805]]]){
    const slide=home.doorObjects.find(d=>d.data.id===id),width=slide.data.w/2/SCALE;
    const passageClear=!blocked(X(point[0]),Z(point[1]));
    home.toggleDoor(id);home.update(2);const closedBlocks=blocked(X(point[0]),Z(point[1]));
    home.toggleDoor(id);home.update(2);
    const stacked=Math.abs(slide.leaves[0].position.x-slide.leaves[1].position.x)<.001;
    report.roomSlides.push({name:slide.data.name,passageClear,closedBlocks,stacked,openingMm:+((width-.058)*1000).toFixed(1)});
  }
  home.toggleDoor(cabinet.data.id);home.update(2);home.root.updateMatrixWorld(true);
  const closedBlocks=blocked(X(803),Z(392));
  const closedVisited=new Uint8Array(nx*nz),closedQueue=[index(816,392)];closedVisited[closedQueue[0]]=1;
  for(let qi=0;qi<closedQueue.length;qi++){const id=closedQueue[qi],i=id%nx,j=Math.floor(id/nx);for(const [di,dj] of [[1,0],[-1,0],[0,1],[0,-1]]){const ii=i+di,jj=j+dj,n=jj*nx+ii;if(ii<0||ii>=nx||jj<0||jj>=nz||closedVisited[n]||blocked(X(217+ii*step),Z(303+jj*step)))continue;closedVisited[n]=1;closedQueue.push(n);}}
  const closedSeparatesCloset=!closedVisited[index(739,405)];
  home.toggleDoor(cabinet.data.id);home.update(2);home.root.updateMatrixWorld(true);
  const leafBounds=cabinet.leaves.map(leaf=>new Box3().setFromObject(leaf));
  const gapMm=(leafBounds[1].min.z-leafBounds[0].max.z)*1000;
  const entryPath=Array.from({length:27},(_,i)=>[816-i*3,392]);
  report.wardrobeEntry={initiallyClosed,closedBlocks,closedSeparatesCloset,openPassageClear:entryPath.every(([x,z])=>!blocked(X(x),Z(z))),openingMm:+gapMm.toFixed(1),slidesApart:leafBounds[0].max.z<Z(392)&&leafBounds[1].min.z>Z(392)};
  report.walkableNodes=queue.length;report.passed=report.spaces===11&&!report.geometryErrors.length&&!report.unreachable.length&&report.destinations.every(d=>d.spawnClear)&&Object.values(report.masterApproach).every(Boolean)&&report.roomSlides.every(d=>d.passageClear&&d.closedBlocks&&d.stacked&&d.openingMm>650)&&Object.values(report.entryDoor).every(Boolean)&&report.bathroomDoor.inward&&report.bathroomDoor.insideBathroom&&report.bathroomDoor.wallClearanceMm>0&&report.studyDoor.insideStudy&&report.studyDoor.wallClearanceMm>0&&report.studyDoor.leafCollision&&report.studyDoor.passageClear&&report.wardrobeEntry.closedBlocks&&closedSeparatesCloset&&report.wardrobeEntry.openPassageClear&&gapMm>750&&report.wardrobeEntry.slidesApart;
  teleport([695,903],-.6);
  if(initiallyClosed){home.toggleDoor(cabinet.data.id);home.update(2);}
  const e=document.createElement('pre');e.id='qa-report';e.textContent=JSON.stringify(report,null,2);e.hidden=true;document.body.append(e);document.body.dataset.qa=report.passed?'passed':'failed';
  return report;
}
