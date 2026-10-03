export const PEARLS = [[-8,5],[-5,6],[0,7],[5.5,6.3],[9,3],[9,-3],[2.8,-8],[-8,-5]];
export const ISLETS=[[-7.6,1.2,1.05],[-2.2,5.2,.9],[5.4,4.7,.9],[8.4,-1.5,.8]];
export const LOCATIONS = [
 {id:'harbor',name:'木屋码头',symbol:'⌂',x:-4.2,y:1.6,z:1.2,description:'木板被阳光晒得暖暖的。替码头挂上灯串，让远行的小船记得回家的方向。',cost:2},
 {id:'wheel',name:'龙骨瀑布',symbol:'♧',x:1.7,y:4.8,z:-.7,description:'古老的恐龙头骨，被海风磨成了小岛的守护者。点亮它眼里的碧光，让清泉从巨口流向海湾。',cost:2},
 {id:'tower',name:'望海灯塔',symbol:'♜',x:-4.2,y:6.8,z:-4,description:'站在云海之上，替那些迷路的星星指路。灯塔的光，会绕着小岛走一整夜。',cost:2},
 {id:'garden',name:'肋骨珊瑚庭',symbol:'❧',x:6.7,y:2,z:3,description:'巨大的肋骨弯成一座海上拱廊，里面生长着小小的珊瑚花园。用珍珠唤醒珊瑚，也唤醒这里的灯。',cost:2},
 {id:'volcano',name:'火山与瀑布',symbol:'△',x:.1,y:5.5,z:-3.1,description:'地心的火与山间的水，在这座小岛相遇。看一缕烟升向天空，听瀑布落进碧蓝的海。',cost:0},
];
export function terrainHeight(x,z){
 const zz=z+1.8;
 const a=Math.atan2(zz/4.2,x/6.2);
 const edge=1+.085*Math.sin(a*5)+.055*Math.sin(a*9+1);
 const d=Math.sqrt((x/6.2)**2+(zz/4.2)**2)/edge;
 if(d>1)return -.25;
 const sand=Math.min(.42,(1-d)*3.4);
 const hill=2.1*Math.exp(-((x+2.9)**2/4.6+(z+3.1)**2/3.7));
 return .18+sand+hill*Math.min(1,(1-d)*6);
}
export function waterAllowed(x,z,margin=.24){
 if(Math.hypot(x,z)>12.05-margin)return false;
 if(ISLETS.some(([a,b,r])=>Math.hypot(x-a,z-b)<r*1.05+margin))return false;
 for(const [dx,dz] of [[0,0],[margin,0],[-margin,0],[0,margin],[0,-margin]])
  if(terrainHeight(x+dx,z+dz)>.01)return false;
 return true;
}
// A* on the lagoon: automatic sailing takes the coastline into account.
export function findWaterPath(start,goal){
 if(!waterAllowed(goal.x,goal.z))return [];
 const step=.5, radius=24, key=(x,z)=>`${x},${z}`;
 const snap=(p)=>({x:Math.round(p.x/step),z:Math.round(p.z/step)});
 const a=snap(start),b=snap(goal);
 let open=[{...a,g:0,f:0}], seen=new Map([[key(a.x,a.z),{...a,g:0,prev:null}]]),closed=new Set();
 const dirs=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]];
 for(let n=0;open.length&&n<6000;n++){
  open.sort((a,b)=>a.f-b.f); const cur=open.shift(),k=key(cur.x,cur.z);
  if(closed.has(k))continue;closed.add(k);
  if(cur.x===b.x&&cur.z===b.z){let route=[],c=seen.get(k);while(c){route.unshift({x:c.x*step,z:c.z*step});c=c.prev?seen.get(c.prev):null;}route.push(goal);return route;}
  for(const [dx,dz] of dirs){
   const x=cur.x+dx,z=cur.z+dz,nk=key(x,z);
   if(Math.abs(x)>radius||Math.abs(z)>radius||closed.has(nk)||!waterAllowed(x*step,z*step))continue;
   if(dx&&dz&&(!waterAllowed((cur.x+dx)*step,cur.z*step)||!waterAllowed(cur.x*step,(cur.z+dz)*step)))continue;
   const g=cur.g+Math.hypot(dx,dz);
   if(seen.has(nk)&&seen.get(nk).g<=g)continue;
   const next={x,z,g,prev:k};seen.set(nk,next);open.push({...next,f:g+Math.hypot(x-b.x,z-b.z)});
  }
 }
 return [];
}
export class IslandGame {
 constructor(saved){this.started=false;this.paused=false;this.boat={x:0,z:9.4,heading:Math.PI};this.path=[];this.collected=[];this.restored=[];this.discovered=[];this.elapsed=0;this.events=[];if(saved)this.restore(saved);}
 get pearls(){return this.collected.length-this.restored.length*2;}
 get complete(){return this.restored.length===4;}
 start(){this.started=true;}
 sailTo(x,z){if(!this.started||this.paused||!waterAllowed(x,z))return false;const path=findWaterPath(this.boat,{x,z});if(!path.length)return false;this.path=path;return true;}
 repair(id){const place=LOCATIONS.find(p=>p.id===id);if(!this.started||this.paused||!place||place.cost===0||this.restored.includes(id))return false;if(this.pearls<place.cost)return false;this.restored.push(id);this.events.push({type:'repair',id});if(this.complete)this.events.push({type:'complete'});return true;}
 discover(id){if(LOCATIONS.some(p=>p.id===id)&&!this.discovered.includes(id))this.discovered.push(id);}
 update(dt,input={}){
  if(!this.started||this.paused)return;
  dt=Math.max(0,Math.min(dt,.06));this.elapsed+=dt;
  let dx=(input.right?1:0)-(input.left?1:0),dz=(input.down?1:0)-(input.up?1:0);
  if(dx||dz)this.path=[];
  else if(this.path.length){const p=this.path[0],dist=Math.hypot(p.x-this.boat.x,p.z-this.boat.z);if(dist<.14)this.path.shift();else{dx=(p.x-this.boat.x)/dist;dz=(p.z-this.boat.z)/dist;}}
  const len=Math.hypot(dx,dz);
  if(len){dx/=len;dz/=len;const nx=this.boat.x+dx*dt*2.1,nz=this.boat.z+dz*dt*2.1;if(waterAllowed(nx,nz)){this.boat.x=nx;this.boat.z=nz;this.boat.heading=Math.atan2(dx,dz);}else if(waterAllowed(nx,this.boat.z)){this.boat.x=nx;}else if(waterAllowed(this.boat.x,nz)){this.boat.z=nz;}else this.path=[];}
  PEARLS.forEach(([x,z],i)=>{if(!this.collected.includes(i)&&Math.hypot(x-this.boat.x,z-this.boat.z)<.85){this.collected.push(i);this.events.push({type:'pearl',id:i});}});
 }
 serialize(){return {version:1,started:this.started,boat:{...this.boat},collected:[...this.collected],restored:[...this.restored],discovered:[...this.discovered],elapsed:this.elapsed};}
 restore(s){if(s?.version!==1)return;this.collected=[...new Set((s.collected||[]).filter(i=>Number.isInteger(i)&&i>=0&&i<8))];this.restored=[...new Set((s.restored||[]).filter(id=>LOCATIONS.some(p=>p.id===id&&p.cost===2)))].slice(0,Math.floor(this.collected.length/2));this.discovered=[...new Set((s.discovered||[]).filter(id=>LOCATIONS.some(p=>p.id===id)))];if(s.boat&&Number.isFinite(s.boat.x)&&Number.isFinite(s.boat.z)&&waterAllowed(s.boat.x,s.boat.z))this.boat={x:s.boat.x,z:s.boat.z,heading:Number.isFinite(s.boat.heading)?s.boat.heading:0};this.started=!!s.started;this.elapsed=Number.isFinite(s.elapsed)?Math.max(0,s.elapsed):0;}
}
