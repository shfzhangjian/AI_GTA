// Coordinates are shared by simulation, drawing, and route tests.
export const dockX = (site, dock) => -site.w / 2 + 2.3 + (dock - 1) * (site.w - 4.6) / Math.max(1, site.docks - 1);
export const dockPose = (site, dock) => ({x: dockX(site, dock), z: site.d / 2 + 3.4, yaw: 0});
export const parkingPose = (site, index) => ({x: site.w / 2 + 3.4 + index % 2 * 1.8, z: -site.d / 2 + 4 + Math.floor(index / 2) * 2.5, yaw: Math.PI});
export const pickupPose = (site, index=0) => ({x: -site.w / 2 - 3.6, z: site.d / 2 + .65 + index * .17, yaw: -Math.PI / 2});
export const workPose = (site, dock) => ({x: dockX(site, dock) + 1.7, z: site.d / 2 + 2.25, yaw: 0});
export const waitingPose = (site, slot=0) => ({x: -site.w / 2 - 15 - slot * 5.4, z: site.d / 2 + 15, yaw: Math.PI / 2});
const dist = (a,b) => Math.hypot(b.x-a.x,b.z-a.z);
const mix = (a,b,t) => ({x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t});

// Quadratic fillets keep steering continuous through every road corner.
export function roundedPath(waypoints,radius=1.8){
  const pts=waypoints.filter((p,i)=>!i||dist(p,waypoints[i-1])>.001).map(p=>({...p}));
  if(pts.length<2)return pts;
  const out=[pts[0]];
  for(let i=1;i<pts.length-1;i++){
    const prev=pts[i-1],corner=pts[i],next=pts[i+1];
    const r=Math.min(radius,dist(prev,corner)*.4,dist(corner,next)*.4);
    const a=mix(corner,prev,r/dist(prev,corner)),b=mix(corner,next,r/dist(corner,next));
    out.push(a);
    for(let j=1;j<=8;j++){const t=j/8;out.push({x:(1-t)**2*a.x+2*(1-t)*t*corner.x+t*t*b.x,z:(1-t)**2*a.z+2*(1-t)*t*corner.z+t*t*b.z});}
  }
  out.push(pts.at(-1));return out;
}
export function motion(points,speed=1.8){
  return {points,distance:0,length:points.slice(1).reduce((n,p,i)=>n+dist(points[i],p),0),speed:0,cruise:speed,waiting:false};
}
export function sampleMotion(m,distance=m.distance){
  let remaining=Math.max(0,Math.min(distance,m.length));
  for(let i=1;i<m.points.length;i++){
    const a=m.points[i-1],b=m.points[i],length=dist(a,b);
    if(remaining<=length+.000001||i===m.points.length-1){const p=mix(a,b,length?Math.min(1,remaining/length):1);return {...p,yaw:Math.atan2(b.x-a.x,b.z-a.z)+(b.reverse?Math.PI:0),reverse:Boolean(b.reverse)};}
    remaining-=length;
  }
  return {...m.points[0],yaw:0,reverse:false};
}
export function moveAlong(m,dt){
  if(m.waiting){m.speed=0;return false;}
  const pose=sampleMotion(m),target=m.cruise*(pose.reverse?.48:1);
  m.speed=Math.min(target,m.speed+dt*1.5);
  m.distance=Math.min(m.length,m.distance+m.speed*dt);
  return m.distance>=m.length-1e-6;
}
export function arrivalMotion(site,dock,start=waitingPose(site)){
  const x=dockX(site,dock),z=site.d/2;
  const points=roundedPath([start,{x:-site.w/2-7,z:z+15},{x:-site.w/2-7,z:z+7.2},{x:x-2.5,z:z+7.2},{x,z:z+7.2},{x,z:z+9.3}],1.65);
  // Forward alignment followed by reverse parking, with unchanged cab heading.
  points.push({x,z:z+3.4,reverse:true});return motion(points,2.25);
}
export function departureMotion(site,dock,start=dockPose(site,dock)){
  const z=site.d/2;
  return motion(roundedPath([start,{x:start.x,z:z+7.2},{x:site.w/2+7,z:z+7.2},{x:site.w/2+7,z:z+15},{x:site.w/2+18,z:z+15}],1.7),2.25);
}
export function forkMotion(site,start,destination){
  if(dist(start,destination)<.001)return motion([{...start}],2);
  const lane=site.d/2+6.1;
  const points=[start,{x:start.x,z:lane},{x:destination.x,z:lane},destination];
  return motion(roundedPath(points,.45),2);
}
export const roadHeight=(site,z)=>-.4*Math.max(0,Math.min(1,(z-site.d/2-11.4)/3.1));

export const ROAD_WEST=-104, ROAD_EAST=104;
export function siteOrigin(site){
  const index=Number(site.id.slice(-2))-1;
  return {x:[-64,0,64,-36,36][index],z:(index<3?-20:45)-site.d/2-15};
}
export const roadZ=site=>siteOrigin(site).z+site.d/2+15;
export const toWorld=(site,p)=>({...p,x:p.x+siteOrigin(site).x,z:p.z+siteOrigin(site).z});
export const toLocal=(site,p)=>({...p,x:p.x-siteOrigin(site).x,z:p.z-siteOrigin(site).z});

// Two eastbound loading streets share a westbound return lane and perimeter links.
// Endpoints exactly match the source exit and the destination entrance queue.
export function transferMotion(source,destination,start){
  const a=start||toWorld(source,sampleMotion(departureMotion(source,1),departureMotion(source,1).length));
  const b=toWorld(destination,waitingPose(destination)),sourceZ=roadZ(source),targetZ=roadZ(destination);
  let points;
  if(sourceZ===targetZ&&b.x>a.x)points=[a,b];
  else points=[a,{x:ROAD_EAST,z:sourceZ},{x:ROAD_EAST,z:targetZ+3},{x:ROAD_WEST,z:targetZ+3},{x:ROAD_WEST,z:targetZ},{...b}];
  const route=motion(roundedPath(points,1.3),6);route.space='world';return route;
}
