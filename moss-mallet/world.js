import * as THREE from './vendor/three.module.js';

const palette = { grass:0x96b963, gold:0xe9b34c, blue:0x6da8b9, pink:0xd58da9, wood:0xad8055, bomb:0xdd8f7c, rainbow:0xad90ce };
const materialCache = new Map(), geoCache = new Map();
function mat(color, roughness = .85, metalness = 0) {
  const normalized=new THREE.Color(color),key = `${normalized.getHexString()}-${roughness}-${metalness}`;
  if (!materialCache.has(key)) materialCache.set(key,new THREE.MeshStandardMaterial({color:normalized,roughness,metalness}));
  return materialCache.get(key);
}
function roundedGeometry() {
  if(geoCache.has('round')) return geoCache.get('round');
  const s=new THREE.Shape(), r=.09, a=-.5,b=.5;
  s.moveTo(a+r,a);s.lineTo(b-r,a);s.quadraticCurveTo(b,a,b,a+r);s.lineTo(b,b-r);s.quadraticCurveTo(b,b,b-r,b);s.lineTo(a+r,b);s.quadraticCurveTo(a,b,a,b-r);s.lineTo(a,a+r);s.quadraticCurveTo(a,a,a+r,a);
  const g=new THREE.ExtrudeGeometry(s,{depth:.82,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.04,bevelThickness:.09,curveSegments:3});g.center();g.computeVertexNormals();geoCache.set('round',g);return g;
}
function mesh(geometry,material,parent,x=0,y=0,z=0) {const m=new THREE.Mesh(geometry,material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function box(parent,x,y,z,w,h,d,color) {const m=mesh(roundedGeometry(),mat(color),parent,x,y,z);m.scale.set(w,h,d);return m;}
function sphere(parent,x,y,z,r,color,detail=1){const key='ico'+detail;if(!geoCache.has(key))geoCache.set(key,new THREE.IcosahedronGeometry(1,detail));const m=mesh(geoCache.get(key),mat(color),parent,x,y,z);m.scale.setScalar(r);return m;}
function ellipsoid(parent,x,y,z,sx,sy,sz,color){const key='sphere';if(!geoCache.has(key))geoCache.set(key,new THREE.SphereGeometry(1,18,14));const m=mesh(geoCache.get(key),mat(color),parent,x,y,z);m.scale.set(sx,sy,sz);return m;}
function cylinder(parent,x,y,z,r1,r2,h,color,segments=10){return mesh(new THREE.CylinderGeometry(r1,r2,h,segments),mat(color),parent,x,y,z);}
function crystal(parent,x,y,z,size,color){const m=mesh(new THREE.CylinderGeometry(0,size*.42,size,5,1),mat(color,.3,.15),parent,x,y+size*.42,z);m.rotation.z=(x*.8);return m;}
function ringShape(size=.49,width=.035) {
  const s = new THREE.Shape(), h = new THREE.Path(),r=.12;
  const draw=(p,k)=>{p.moveTo(-k+r,-k);p.lineTo(k-r,-k);p.quadraticCurveTo(k,-k,k,-k+r);p.lineTo(k,k-r);p.quadraticCurveTo(k,k,k-r,k);p.lineTo(-k+r,k);p.quadraticCurveTo(-k,k,-k,k-r);p.lineTo(-k,-k+r);p.quadraticCurveTo(-k,-k,-k+r,-k);};
  draw(s,size);draw(h,size-width);s.holes.push(h);return new THREE.ShapeGeometry(s,5);
}

export class IslandWorld {
  constructor(container,onHover,onHit) {
    this.container=container;this.onHover=onHover;this.onHit=onHit;this.tiles=[];this.particles=[];this.foliage=[];this.highlights=[];this.elapsed=0;this.swing=0;this.motion=true;
    this.scene=new THREE.Scene();
    this.renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio,container.clientWidth<700?1.5:2));
    this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.02;
    this.renderer.setClearColor(0xf5f3ec,0);container.appendChild(this.renderer.domElement);
    this.renderer.domElement.setAttribute('aria-label','7 × 7 森林矿块棋盘，点击相邻同类砖块进行连锁消除');
    this.camera=new THREE.OrthographicCamera(-10,10,8,-8,.1,100);
    this.raycaster=new THREE.Raycaster();this.pointer=new THREE.Vector2();
    this.scene.add(new THREE.HemisphereLight(0xfff7e1,0x9cac79,1.6));
    const light=new THREE.DirectionalLight(0xfff2dc,2.7);light.position.set(-5,14,8);light.castShadow=true;const shadowSize=container.clientWidth<700?1024:2048;light.shadow.mapSize.set(shadowSize,shadowSize);light.shadow.camera.left=-10;light.shadow.camera.right=10;light.shadow.camera.top=10;light.shadow.camera.bottom=-10;light.shadow.normalBias=.04;light.shadow.bias=-.0003;light.shadow.radius=4;this.scene.add(light);
    const fill=new THREE.DirectionalLight(0xdcf0e7,.85);fill.position.set(7,6,-8);this.scene.add(fill);
    this.island=new THREE.Group();this.scene.add(this.island);
    this.makeIsland();this.makeBunny();this.makeFloatingDetails();
    const plane=mesh(new THREE.PlaneGeometry(200,200),new THREE.ShadowMaterial({opacity:.09}),this.scene,0,-2.05,0);plane.rotation.x=-Math.PI/2;plane.castShadow=false;
    this.selectionMaterial=new THREE.MeshBasicMaterial({color:0xfdf4b7,side:THREE.DoubleSide,transparent:true,opacity:.95});
    this.selectionGeometry=ringShape();
    const canvas=this.renderer.domElement;
    this.touches=new Map();this.pan={x:0,y:0};
    canvas.addEventListener('pointermove',e=>this.movePointer(e));
    canvas.addEventListener('pointerleave',()=>this.onHover(null));
    canvas.addEventListener('pointerdown',e=>this.downPointer(e));
    canvas.addEventListener('pointerup',e=>this.upPointer(e));
    canvas.addEventListener('pointercancel',e=>{this.touches.delete(e.pointerId);this.onHover(null);});
    this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(container);this.resize();
    this.last=performance.now();this.frame=this.frame.bind(this);this.frameId=requestAnimationFrame(this.frame);
  }
  resize() {
    const w=this.container.clientWidth,h=this.container.clientHeight;this.renderer.setSize(w,h);const aspect=w/h;
    const mobile=w<700, span=Math.max(12.8,13.6/aspect);
    this.camera.left=-span*aspect/2;this.camera.right=span*aspect/2;this.camera.top=span/2;this.camera.bottom=-span/2;
    this.camera.position.set(13,15,18);this.camera.lookAt(0,.65,0);
    this.pan={x:0,y:0};this.camera.zoom=1;this.camera.clearViewOffset();
    this.camera.updateProjectionMatrix();
  }
  setTheme(level){
    const colors=[0x8ca76b,0xb7ac73,0xbc9a9b,0x9c99b4,0x87b3a5];
    const backgrounds=[['#e3e9c9','#ccdcb4','#a6c28e'],['#f1e8bf','#dfd7a8','#b8bb82'],['#efe1d5','#dfcfc5','#b9bc9b'],['#dce1e5','#c1cbd7','#97aeb8'],['#dcebdd','#b8dacd','#93bdad']];
    document.querySelector('.playground').style.background=`radial-gradient(ellipse at 50% 38%,${backgrounds[level][0]} 0,${backgrounds[level][1]} 44%,${backgrounds[level][2]} 100%)`;
    for(const f of this.foliage)if(!f.float)f.g.traverse(o=>{if(o.isMesh){if(!o.userData.baseColor)o.userData.baseColor=o.material.color.clone();const color=o.userData.baseColor.clone().lerp(new THREE.Color(colors[level]),level===0?0:.45);o.material=mat(color);}});
  }
  downPointer(e){
    if(e.button!==0)return;
    this.renderer.domElement.setPointerCapture(e.pointerId);
    this.touches.set(e.pointerId,{x:e.clientX,y:e.clientY,sx:e.clientX,sy:e.clientY,drag:false});
    if(this.touches.size===2){const [a,b]=[...this.touches.values()];this.pinch={distance:Math.hypot(a.x-b.x,a.y-b.y),zoom:this.camera.zoom};for(const p of this.touches.values())p.drag=true;this.onHover(null);}
    else this.pointerEvent(e,false);
  }
  movePointer(e){
    const p=this.touches.get(e.pointerId);
    if(!p){if(e.pointerType!=='touch')this.pointerEvent(e,false);return;}
    const dx=e.clientX-p.x,dy=e.clientY-p.y;p.x=e.clientX;p.y=e.clientY;
    if(this.touches.size===2&&this.pinch){const [a,b]=[...this.touches.values()];this.camera.zoom=THREE.MathUtils.clamp(this.pinch.zoom*Math.hypot(a.x-b.x,a.y-b.y)/this.pinch.distance,1,1.85);this.camera.updateProjectionMatrix();return;}
    if(Math.hypot(p.x-p.sx,p.y-p.sy)>8)p.drag=true;
    if(p.drag&&this.camera.zoom>1){this.pan.x=THREE.MathUtils.clamp(this.pan.x+dx,-this.container.clientWidth*.4,this.container.clientWidth*.4);this.pan.y=THREE.MathUtils.clamp(this.pan.y+dy,-this.container.clientHeight*.25,this.container.clientHeight*.25);this.camera.setViewOffset(this.container.clientWidth,this.container.clientHeight,-this.pan.x,-this.pan.y,this.container.clientWidth,this.container.clientHeight);this.onHover(null);}
    else this.pointerEvent(e,false);
  }
  upPointer(e){const p=this.touches.get(e.pointerId);this.touches.delete(e.pointerId);if(!this.touches.size)this.pinch=null;if(p&&!p.drag)this.pointerEvent(e,true);if(e.pointerType==='touch')this.onHover(null);}
  makeIsland() {
    const g=this.island;
    box(g,0,-.2,0,8.85,.5,8.85,0x829759);
    box(g,0,-.61,0,8.65,.6,8.65,0xb2926f);
    box(g,0,-1.05,0,8.12,.48,8.12,0x8e8065);
    box(g,0,-1.37,0,7.2,.25,7.2,0xaaa48a);
    for(let i=0;i<36;i++){
      const side=i%4,t=Math.floor(i/4)/8*7.6-3.8;
      const x=side===0?-4.32:side===1?4.32:t,z=side===2?-4.32:side===3?4.32:t;
      box(g,x,-.64+(i%3)*.055,z,.15+.1*(i%2),.18,.22,[0xc7ab84,0x9c8264,0xbca17a][i%3]);
    }
    for(let i=0;i<10;i++) {
      const x=(i-4.5)*.73;
      sphere(g,x,-1.23,3.78,.2+(i%3)*.04,0xa8a18a,0);
      if(i%3===0)crystal(g,x,-1.15,4.13,.22,0xc8bea5);
    }
    this.makeTree(-3.8,-3.5,2.7,0x879e64);this.makeTree(.05,-4.02,3.35,0xa2b57b);this.makeTree(3.8,-3.2,3.0,0x749268);this.makeTree(4.1,1.2,1.9,0xadc18c);
    for(let i=0;i<35;i++){
      const side=i%4,t=(Math.floor(i/4)-4)*.9;
      const x=side===0?-4.05:side===1?4.05:t,z=side===2?-4.05:side===3?4.05:t;
      if(Math.abs(x)>3.7&&Math.abs(z)>3)continue;
      this.tuft(g,x,.11,z,.15+(i%3)*.035);
      if(i%4===0)this.flower(g,x+.15,.17,z+.1,i%8===0?0xf1d28a:0xdba7a0);
    }
    this.makeMushroom(g,-4,.2,1.8,.48);this.makeMushroom(g,-3.9,.16,2.35,.28);this.makeMushroom(g,3.4,.15,4.15,.35);
    // A shallow pond and tiny timber fence frame the back of the diorama.
    const pond=cylinder(g,-2.4,.11,-3.88,.78,.83,.11,0x9ac5bf,32);pond.scale.z=.58;
    const water=cylinder(g,-2.4,.18,-3.88,.68,.68,.025,0xb4d7cb,32);water.scale.z=.55;
    for(let i=0;i<4;i++){const lily=cylinder(g,-2.8+i*.25,.202,-3.8+(i%2)*.16,.1,.1,.016,0x7ca06a,10);lily.rotation.y=i;}
    for(let i=0;i<7;i++){const x=-1.25+i*.64;box(g,x,.4,-4.18,.12,.66,.13,0xd1b792);sphere(g,x,.75,-4.18,.07,0xe1cba8,0);}
    box(g,.65,.45,-4.18,3.9,.08,.09,0xc4a57e);box(g,.65,.22,-4.18,3.9,.08,.09,0xc4a57e);
    this.makeStump(g,3.65,.05,3.45,.4);
    const bird=new THREE.Group();bird.position.set(1.35,.85,-4.18);g.add(bird);ellipsoid(bird,0,0,0,.12,.14,.17,0xe6c26b);ellipsoid(bird,.02,.15,0,.10,.11,.11,0xf3d887);sphere(bird,.097,.17,.065,.018,0x40513f,1);box(bird,.03,.14,.13,.05,.035,.08,0xb78e4c);ellipsoid(bird,.1,0,-.02,.045,.09,.1,0xcca555);this.bird=bird;
    // Small vines on the front-facing soil stratum.
    for(let i=0;i<6;i++){
      const x=-3+i*1.12;
      for(let j=0;j<4;j++)ellipsoid(g,x+Math.sin(j)*.07,-.36-j*.15,4.38,.09,.12,.035,j%2?0x7a935a:0x96a56e);
    }
  }
  tuft(parent,x,y,z,size=.15) {
    const t=new THREE.Group();t.position.set(x,y,z);parent.add(t);
    for(let i=0;i<3;i++){const m=mesh(new THREE.ConeGeometry(size*.16,size*(1.3+(i%2)*.4),3),mat(i%2?0xb4c984:0x8faf65),t,(i-1)*size*.22,size*.6,0);m.rotation.z=(i-1)*-.32;}
    return t;
  }
  flower(parent,x,y,z,color){cylinder(parent,x,y+.09,z,.013,.014,.2,0x839965,5);for(let i=0;i<5;i++)sphere(parent,x+Math.cos(i*1.256)*.055,y+.2,z+Math.sin(i*1.256)*.055,.045,color,1);sphere(parent,x,y+.215,z,.03,0xd1ab65,1);}
  makeTree(x,z,height,color) {
    const g=new THREE.Group();g.position.set(x,.05,z);this.island.add(g);
    cylinder(g,0,height*.34,0,.12,.2,height*.7,0xd8c8a7,8);
    for(let j=0;j<5;j++)box(g,.12,height*.12+j*.29,.07,.05,.05+.018*(j%2),.14,0xa0957c);
    const branch=cylinder(g,.16,height*.53,0,.06,.075,.5,0xc3b193,7);branch.rotation.z=-.6;
    const crown=new THREE.Group();g.add(crown);crown.position.y=height*.66;
    const clumps=[[-.38,.18,.06,.64],[.33,.16,.02,.69],[0,.6,0,.71],[.04,.08,.4,.52],[-.05,.34,-.35,.6]];
    clumps.forEach(([a,b,c,r],i)=>{const m=sphere(crown,a,b,c,r*(height/3),i%2?color:new THREE.Color(color).multiplyScalar(1.09),1);m.rotation.set(i*.7,i*.8,.2);});
    this.foliage.push({g:crown,phase:x+z});
    for(let i=0;i<3;i++)sphere(g,(i-1)*.18,.05,.12,.13,0x80925c,0);
  }
  makeMushroom(parent,x,y,z,size) {
    const g=new THREE.Group();g.position.set(x,y,z);parent.add(g);
    cylinder(g,0,size*.29,0,size*.11,size*.17,size*.58,0xf3e9cc,9);
    const cap=mesh(new THREE.SphereGeometry(size*.45,16,10,0,Math.PI*2,0,Math.PI/2),mat(0xdf9a86),g,0,size*.52,0);cap.scale.y=.69;
    cylinder(g,0,size*.52,0,size*.45,size*.45,.025,0xecd8b2,16);
    for(let i=0;i<5;i++){const a=i*2.4,r=i%2?size*.25:size*.16;sphere(g,Math.cos(a)*r,size*.68+(i%2)*size*.075,Math.sin(a)*r,size*.065,0xffecd1,1);}
    return g;
  }
  makeStump(parent,x,y,z,size) {
    const g=new THREE.Group();g.position.set(x,y,z);parent.add(g);cylinder(g,0,size*.4,0,size*.83,size,size*.8,0xa9825b,12);cylinder(g,0,size*.81,0,size*.78,size*.78,.035,0xd7bb8b,24);
    for(let i=0;i<3;i++){const m=mesh(new THREE.TorusGeometry(size*(.24+i*.17),.009,4,28),mat(0xa98960),g,0,size*.84,0);m.rotation.x=-Math.PI/2;}
    return g;
  }
  makeBunny() {
    const p=this.island;
    const platform=cylinder(p,-4.03,-.05,3.55,.91,.8,.4,0xb9a079,18);platform.receiveShadow=true;
    cylinder(p,-4.03,.17,3.55,.87,.87,.05,0xc4d29b,24);
    const g=new THREE.Group();g.position.set(-4.03,.23,3.55);g.rotation.y=.28;p.add(g);this.bunny=g;
    ellipsoid(g,0,.47,0,.31,.42,.24,0xe8d8bd);
    ellipsoid(g,0,.4,.02,.315,.32,.25,0x769b83);
    box(g,0,.54,.226,.34,.3,.04,0x9dbb9b);box(g,-.13,.72,.2,.05,.19,.04,0x9dbb9b);box(g,.13,.72,.2,.05,.19,.04,0x9dbb9b);
    for(const x of [-.14,.14]){ellipsoid(g,x,.1,.12,.16,.11,.21,0xeee2c8);sphere(g,x*.5,.54,.262,.017,0xd3bc87,1);}
    sphere(g,0,.35,-.26,.12,0xf2e7ce,2);
    const head=new THREE.Group();head.position.y=1.01;g.add(head);this.bunnyHead=head;
    ellipsoid(head,0,0,0,.36,.33,.3,0xf1e7d0);
    const earL=ellipsoid(head,-.17,.4,-.045,.105,.34,.095,0xf1e7d0);earL.rotation.z=.16;
    const earR=ellipsoid(head,.17,.44,-.045,.105,.37,.095,0xf1e7d0);earR.rotation.z=-.15;
    const innerL=ellipsoid(head,-.18,.43,.039,.046,.24,.016,0xd8b3a6);innerL.rotation.z=.16;
    const innerR=ellipsoid(head,.18,.47,.038,.047,.26,.016,0xd8b3a6);innerR.rotation.z=-.15;
    for(const x of [-.115,.115]){ellipsoid(head,x,.028,.279,.032,.045,.022,0x3e5241);sphere(head,x-.007,.046,.296,.009,0xfff7e7,1);ellipsoid(head,x*1.8,-.076,.255,.064,.03,.014,0xdcb3a0);}
    ellipsoid(head,0,-.071,.297,.028,.021,.017,0xba8f7d);
    const mouth=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-.034,-.115,.296),new THREE.Vector3(0,-.127,.304),new THREE.Vector3(.034,-.115,.296)]),new THREE.LineBasicMaterial({color:0x8b7d66}));head.add(mouth);
    // A tiny miner's scarf and copper backpack add character to the model.
    box(g,0,.77,.12,.4,.09,.28,0xdfb471);box(g,.18,.65,.25,.1,.22,.06,0xe5bf7e);
    box(g,0,.46,-.29,.4,.45,.16,0xba9270);box(g,0,.49,-.39,.29,.15,.05,0xcba57f);
    const leftArm=ellipsoid(g,-.35,.58,.05,.12,.22,.12,0xf1e4ca);leftArm.rotation.z=-.3;
    const arm=new THREE.Group();arm.position.set(.31,.69,.03);g.add(arm);this.hammerArm=arm;
    ellipsoid(arm,.045,-.1,.07,.12,.19,.12,0xf1e4ca);
    const handle=cylinder(arm,.06,.07,.17,.035,.035,.58,0x9b805c,9);handle.rotation.z=-.3;
    const hammer=box(arm,.13,.36,.17,.39,.21,.23,0xbcb3a0);hammer.rotation.z=-.3;
    box(arm,.30,.40,.17,.04,.21,.235,0xd4c5a8);
  }
  makeFloatingDetails() {
    for(let i=0;i<9;i++){
      const g=new THREE.Group();const a=i*2.4;g.position.set(Math.cos(a)*(6.2+i*.07),-.3+(i%3)*.8,Math.sin(a)*5.4);this.scene.add(g);
      const m=sphere(g,0,0,0,.035+(i%3)*.015,0xc7bb86,0);m.castShadow=false;this.foliage.push({g,phase:i,float:true,base:g.position.y});
    }
  }
  makeTile(tile) {
    const g=new THREE.Group();g.position.set((tile.col-3)*.98,.08,(tile.row-3)*.98);g.userData.tile=tile;this.island.add(g);tile.mesh=g;
    const type=tile.type,color=palette[type];
    const body=box(g,0,.24,0,.9,.45,.9,type==='grass'?0xb19369: type==='wood'?0x9d784f:0xa2a695);body.userData.tile=tile;
    const top=box(g,0,.47,0,.91,.16,.91,type==='grass'?color:type==='wood'?0xc7a679: new THREE.Color(color).lerp(new THREE.Color(0xbfc1af),.66));top.userData.tile=tile;
    if(type==='grass') {
      const turf=box(g,0,.52,0,.86,.15,.86,0xa9c67d);turf.userData.tile=tile;
      this.tuft(g,-.19,.61,-.14,.1);this.tuft(g,.19,.6,.18,.075);
      box(g,-.22,.41,.44,.15,.14,.025,0x9fbe75);box(g,.15,.4,.44,.24,.12,.025,0x93b16a);
      if(tile.id%5===0)this.flower(g,.2,.59,-.2,0xe9dbaa);
      for(let i=0;i<3;i++)box(g,(i-1)*.21,.594,-.29,.10,.015,.08,i%2?0xbbd593:0x93b66c);
    } else if(type==='wood') {
      cylinder(g,0,.65,0,.31,.35,.3,0xad8257,10);cylinder(g,0,.811,0,.29,.29,.025,0xd3b58a,24);
      for(let i=0;i<3;i++){const ring=mesh(new THREE.TorusGeometry(.06+i*.065,.009,3,20),mat(0xaa8b60),g,0,.829,0);ring.rotation.x=-Math.PI/2;}
      for(let i=0;i<5;i++){const a=i*1.256;box(g,Math.cos(a)*.33,.65,Math.sin(a)*.33,.035,.19,.035,0x8b6748);}
    } else if(type==='bomb') {this.makeMushroom(g,0,.54,0,.64);}
    else if(type==='rainbow') {
      for(let i=0;i<5;i++){const a=i*1.256;const c=crystal(g,Math.cos(a)*.15,.56,Math.sin(a)*.15,.43,[0xe4bd76,0xa3c0a0,0x99becd,0xbea7d2,0xe0a8b5][i]);c.rotation.z=Math.cos(a)*.28;c.rotation.x=Math.sin(a)*.28;}
      crystal(g,0,.66,0,.55,0xe4dbef);
    } else {
      const rock=sphere(g,0,.58,0,.31,0xb5b8a6,0);rock.scale.y=.65;
      for(let i=0;i<4;i++){const a=i*2.1;crystal(g,Math.cos(a)*.21,.56,Math.sin(a)*.21,.28+(i%3)*.10,color);}
      crystal(g,-.04,.58,.02,.5,new THREE.Color(color).multiplyScalar(1.13));
      for(let i=0;i<2;i++)box(g,(i-1)*.32,.21,.461,.13,.1,.035,color);
    }
    g.traverse(obj=>{if(obj.isMesh)obj.userData.tile=tile;});this.tiles.push(tile);
    return g;
  }
  setBoard(board) {
    this.clearHighlights();
    for(const tile of this.tiles)if(tile.mesh){this.island.remove(tile.mesh);this.disposeUnique(tile.mesh);tile.mesh=null;}
    this.tiles=[];
    for(const tile of board)this.makeTile(tile);
  }
  disposeUnique(group) {
    group.traverse(o=>{if(o.isMesh && ![...geoCache.values()].includes(o.geometry))o.geometry.dispose();});
  }
  pointerEvent(e,hit) {
    const rect=this.renderer.domElement.getBoundingClientRect();
    this.pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);this.raycaster.setFromCamera(this.pointer,this.camera);
    const objs=this.tiles.filter(t=>t.mesh&&!t.removed).map(t=>t.mesh);
    const intersections=this.raycaster.intersectObjects(objs,true);
    const tile=intersections.length?intersections[0].object.userData.tile:null;
    if(hit){this.onHit(tile);}else{this.onHover(tile,{x:e.clientX-rect.left,y:e.clientY-rect.top});}
  }
  highlight(tiles,special=false) {
    this.clearHighlights();this.selectionMaterial.color.set(special?0xffdba5:0xf8f3b5);
    for(const tile of tiles){if(!tile.mesh)continue;const m=new THREE.Mesh(this.selectionGeometry,this.selectionMaterial);m.rotation.x=-Math.PI/2;m.position.set(tile.mesh.position.x,.77,tile.mesh.position.z);this.island.add(m);this.highlights.push(m);}
  }
  clearHighlights(){for(const h of this.highlights)this.island.remove(h);this.highlights=[];}
  project(tile){const pos=new THREE.Vector3((tile.col-3)*.98,1.1,(tile.row-3)*.98);pos.applyMatrix4(this.island.matrixWorld).project(this.camera);return{x:(pos.x*.5+.5)*this.container.clientWidth,y:(-.5*pos.y+.5)*this.container.clientHeight};}
  breakTiles(tiles,special=false) {
    this.clearHighlights();this.swing=1;
    for(const tile of tiles){
      const g=tile.mesh;if(!g)continue;
      const origin=g.position.clone();this.island.remove(g);this.disposeUnique(g);tile.mesh=null;
      for(let i=0;i<(tiles.length>20?5:9);i++){
        const m=mesh(geoCache.get('ico0')||new THREE.IcosahedronGeometry(1,0),mat(i%3?palette[tile.type]:0xe5d8b5),this.island,origin.x,origin.y+.5,origin.z);
        m.scale.setScalar(.055+Math.random()*.065);m.castShadow=false;
        this.particles.push({m,v:new THREE.Vector3((Math.random()-.5)*3,2+Math.random()*2,(Math.random()-.5)*3),life:0,duration:.55+Math.random()*.4});
      }
    }
    if(special)this.shake=.22;
  }
  settle(board,newTiles) {
    this.tiles=[];
    for(const tile of board){
      if(!tile.mesh){this.makeTile(tile);tile.mesh.position.y=2.2+tile.row*.07;}
      tile.target=new THREE.Vector3((tile.col-3)*.98,.08,(tile.row-3)*.98);
    }
    // makeTile registers new tiles; normalize to a unique board list.
    this.tiles=[...new Set(board)];
  }
  frame(now) {
    const dt=Math.min((now-this.last)/1000,.05);this.last=now;
    if(this.motion){
      this.elapsed+=dt;
      this.island.position.y=Math.sin(this.elapsed*.7)*.035;
      for(const f of this.foliage){if(f.float)f.g.position.y=f.base+Math.sin(this.elapsed+f.phase)*.18;else f.g.rotation.z=Math.sin(this.elapsed*.8+f.phase)*.016;}
      this.bunnyHead.rotation.z=Math.sin(this.elapsed*1.15)*.035;
      this.bunny.scale.y=1+Math.sin(this.elapsed*2)*.012;
      this.bird.rotation.y=Math.sin(this.elapsed*.6)*.4;
      if(this.swing>0){this.swing=Math.max(0,this.swing-dt*2.3);this.hammerArm.rotation.x=-Math.sin(this.swing*Math.PI)*1.8;this.hammerArm.rotation.z=Math.sin(this.swing*Math.PI)*-.2;}else{this.hammerArm.rotation.x=Math.sin(this.elapsed)*.05;}
      if(this.shake>0){this.shake-=dt;this.island.rotation.z=Math.sin(this.shake*75)*this.shake*.016;}else this.island.rotation.z=0;
      for(const tile of this.tiles){if(tile.mesh&&tile.target)tile.mesh.position.lerp(tile.target,1-Math.exp(-dt*15));}
      for(let i=this.particles.length-1;i>=0;i--){const p=this.particles[i];p.life+=dt;p.v.y-=dt*9;p.m.position.addScaledVector(p.v,dt);p.m.rotation.x+=dt*7;p.m.rotation.z+=dt*5;p.m.scale.multiplyScalar(Math.exp(-dt*2));if(p.life>p.duration){this.island.remove(p.m);this.particles.splice(i,1);}}
      this.selectionMaterial.opacity=.75+Math.sin(this.elapsed*4)*.2;
    }
    this.renderer.render(this.scene,this.camera);this.frameId=requestAnimationFrame(this.frame);
  }
  clearParticles(){for(const p of this.particles)this.island.remove(p.m);this.particles=[];}
}
