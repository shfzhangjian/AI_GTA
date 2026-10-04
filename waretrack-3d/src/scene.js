import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {roadHeight,siteOrigin,toWorld,ROAD_WEST,ROAD_EAST} from './traffic.js';
import {SITES, CARRIERS, activeShipments, product, STATUS, operationSite} from './store.js';

export class WarehouseScene {
  constructor(container,{onSelect,onHover,onReady}){
    this.container=container;this.onSelect=onSelect;this.onHover=onHover;this.entities=new Map();this.pickables=[];this.materials=new Map();this.textures=[];this.selected=null;this.state=null;this.lastTime=0;this.simTime=0;
    this.scene=new THREE.Scene();this.scene.background=new THREE.Color('#e5ebf6');
    this.camera=new THREE.OrthographicCamera(-30,30,20,-20,.1,800);this.camera.position.set(36,30,42);
    this.renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
    this.renderer.setPixelRatio(Math.min(devicePixelRatio,2));this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.05;
    this.renderer.domElement.setAttribute('aria-label','可交互三维仓库场景：拖动旋转，滚轮缩放，点击车辆或货盘查看详情');this.renderer.domElement.tabIndex=0;container.append(this.renderer.domElement);
    this.controls=new OrbitControls(this.camera,this.renderer.domElement);this.controls.enableDamping=true;this.controls.dampingFactor=.09;this.controls.minZoom=.1;this.controls.maxZoom=3.4;this.controls.minPolarAngle=.22;this.controls.maxPolarAngle=Math.PI/2.15;this.controls.target.set(0,0,0);this.controls.autoRotateSpeed=.55;this.controls.addEventListener('start',()=>{this.followKey=null;this.isOverview=false;});this.controls.mouseButtons={LEFT:THREE.MOUSE.ROTATE,MIDDLE:THREE.MOUSE.DOLLY,RIGHT:THREE.MOUSE.PAN};
    this.scene.add(new THREE.HemisphereLight(0xffffff,0x9bafd0,1.6));this.sun=new THREE.DirectionalLight(0xfff8ed,2.8);this.sun.position.set(-60,160,90);this.sun.castShadow=true;this.sun.shadow.mapSize.set(2048,2048);Object.assign(this.sun.shadow.camera,{left:-155,right:155,top:130,bottom:-130,near:.5,far:400});this.sun.shadow.normalBias=.045;this.sun.shadow.bias=-.0001;this.sun.shadow.radius=5;this.scene.add(this.sun);
    this.root=new THREE.Group();this.scene.add(this.root);this.ray=new THREE.Raycaster();this.pointer=new THREE.Vector2();
    this.ring=new THREE.Mesh(new THREE.RingGeometry(.9,1.05,64),new THREE.MeshBasicMaterial({color:0x386cff,side:THREE.DoubleSide,transparent:true,opacity:.9,depthWrite:false}));this.ring.rotation.x=-Math.PI/2;this.ring.position.y=.12;this.ring.visible=false;this.scene.add(this.ring);
    this.routeGroup=new THREE.Group();this.scene.add(this.routeGroup);
    this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(container);
    let down=null;
    this.renderer.domElement.addEventListener('pointerdown',e=>{down={x:e.clientX,y:e.clientY,time:performance.now()};});
    this.renderer.domElement.addEventListener('pointerup',e=>{if(down&&Math.hypot(e.clientX-down.x,e.clientY-down.y)<6&&performance.now()-down.time<600&&e.button===0){const entity=this.hit(e);if(entity){this.select(entity.key);onSelect(entity.kind,entity.id,entity.siteId);}}down=null;});
    this.renderer.domElement.addEventListener('pointermove',e=>{if(e.buttons)return;const entity=this.hit(e);this.renderer.domElement.style.cursor=entity?'pointer':'grab';onHover?.(entity,e.clientX,e.clientY);});
    this.renderer.domElement.addEventListener('pointerleave',()=>onHover?.(null));
    this.renderer.domElement.addEventListener('keydown',e=>{if(e.key==='Home'){e.preventDefault();this.home();}if(e.key==='+'||e.key==='=')this.zoom(1.2);if(e.key==='-')this.zoom(1/1.2);});
    this.renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();container.dispatchEvent(new CustomEvent('scene-error',{detail:'三维渲染暂停，请刷新页面恢复。数据已保存在本地。'}));});
    this.labelLayer=document.createElement('div');this.labelLayer.className='map-labels';container.append(this.labelLayer);this.siteLabels=SITES.map(cfg=>{const button=document.createElement('button');button.className='map-label';button.textContent=cfg.name;button.setAttribute('aria-label',`定位${cfg.name}`);button.addEventListener('click',()=>{onSelect('site',cfg.id,cfg.id);this.focus('site',cfg.id);});this.labelLayer.append(button);return {cfg,button};});
    this.resize();this.frame(0);onReady?.();
  }
  mat(color,opts={}){const key=color+JSON.stringify(opts);if(!this.materials.has(key))this.materials.set(key,new THREE.MeshStandardMaterial({color,roughness:.78,...opts}));return this.materials.get(key)}
  box(parent,w,h,d,x,y,z,color,r=0){const geometry=r?new RoundedBoxGeometry(w,h,d,2,r):new THREE.BoxGeometry(w,h,d);const m=new THREE.Mesh(geometry,this.mat(color));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
  cylinder(parent,r,h,x,y,z,color,segments=12){const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,segments),this.mat(color));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
  line(parent,points,color,width=1){const geo=new THREE.BufferGeometry().setFromPoints(points.map(p=>new THREE.Vector3(...p)));const line=new THREE.Line(geo,new THREE.LineBasicMaterial({color,linewidth:width}));parent.add(line);return line;}
  text(parent,text,x,y,z,w=3,h=.6,color='#3e65cd',bg=null,rotation=0){const canvas=document.createElement('canvas');canvas.width=512;canvas.height=128;const c=canvas.getContext('2d');if(bg){c.fillStyle=bg;c.fillRect(0,0,512,128);}c.fillStyle=color;c.font='bold 55px "PingFang SC", "Microsoft YaHei", sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(text,256,68,485);const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;this.textures.push(tex);const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false,side:THREE.DoubleSide}));m.position.set(x,y,z);m.rotation.y=rotation;parent.add(m);return m;}
  entityKey(kind,id,siteId=this.state.siteId){return ['product','dock'].includes(kind)?`${kind}:${siteId}:${id}`:`${kind}:${id}`;}
  entity(group,kind,id,label,siteId=this.buildingSiteId){const key=this.entityKey(kind,id,siteId),entry={key,kind,id,label,group,siteId};group.userData.entity=entry;group.traverse(o=>{if(o.isMesh)this.pickables.push(o)});this.entities.set(key,entry);return entry;}
  disposeTree(root){root.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material&&!Array.from(this.materials.values()).includes(o.material)){if(o.material.map){o.material.map.dispose();this.textures=this.textures.filter(t=>t!==o.material.map);}o.material.dispose();}});root.clear();}
  build(state){
    this.state=state;this.disposeTree(this.root);this.disposeTree(this.routeGroup);for(const t of this.textures)t.dispose();this.textures=[];this.entities.clear();this.pickables=[];this.selected=null;this.ring.visible=false;this.trucks=new Map();this.forkGroups=new Map();this.pins=[];this.siteGroups=new Map();
    this.world=this.root;this.buildRoads();
    for(const cfg of SITES){
      const origin=siteOrigin(cfg),group=new THREE.Group();group.position.set(origin.x,0,origin.z);this.world.add(group);this.siteGroups.set(cfg.id,group);this.root=group;this.buildingSiteId=cfg.id;
      this.buildSite(cfg);
    }
    this.root=this.world;this.buildingSiteId=null;this.cfg=SITES.find(s=>s.id===state.siteId);this.sync(state);this.home(true);
  }
  buildRoads(){
    this.box(this.root,242,.35,155,0,-.8,-6,0xe3ebef,1);
    for(const z of [-20,45]){
      this.box(this.root,216,.09,8,0,-.59,z+1.5,0x8ea7be);
      for(let x=-100;x<=100;x+=5){this.box(this.root,2,.02,.11,x,-.53,z+1.5,0xe3ecf3);}
      for(let x=-90;x<100;x+=30){for(const [lane,dir] of [[z,1],[z+3,-1]])this.line(this.root,[[x-dir,-.52,lane-.65],[x+dir,-.52,lane],[x-dir,-.52,lane+.65]],0xe8f0f5);}
    }
    for(const x of [ROAD_WEST,ROAD_EAST])this.box(this.root,7,.09,72,x,-.59,14,0x8ea7be);
    const park=this.box(this.root,202,.12,15,0,-.62,-2,0xc3d8cc,.8);
    for(let x=-90;x<94;x+=11)this.tree(x,-2,.8);
    const label=this.text(this.root,'五仓互联 · 物流环线',0,-.5,66,28,3,'#7290a7');label.rotation.x=-Math.PI/2;
  }
  buildSite(cfg){
    const {w,d,h}=cfg;this.dockXs=Array.from({length:cfg.docks},(_,i)=>-w/2+2.3+i*(w-4.6)/Math.max(1,cfg.docks-1));
    this.box(this.root,w+23,.46,d+24,0,-.4,1,0xf0f3fa,.15);
    const name=this.text(this.root,cfg.name,0,.02,-d/2-7,w+4,1.8,'#456681');name.rotation.x=-Math.PI/2;
    // Warehouse shell, blue structural frame, loading doors and corrugated metal roof.
    const building=new THREE.Group();this.root.add(building);
    this.box(building,w,.28,d,0,0,0,0xbcc9df);
    this.box(building,w,h,.28,0,h/2,-d/2,0xeaf0f9);
    this.box(building,.28,h,d,-w/2,h/2,0,cfg.id==='WH-01'?0x4277e8:0xe0e8f6);
    this.box(building,.28,h,d,w/2,h/2,0,cfg.id==='WH-01'?0x386ad6:0xd6e2f3);
    this.box(building,w,h-3.05,.3,0,(h+3.05)/2,d/2,0xeef3fa);
    const doorW=2.25;
    let prev=-w/2;
    for(let i=0;i<cfg.docks;i++){const x=this.dockXs[i];const left=x-doorW/2;this.box(building,left-prev,3.05,.3,(left+prev)/2,1.525,d/2,0xeef3fa);prev=x+doorW/2;
      this.box(building,doorW+.32,3.14,.22,x,1.57,d/2+.16,0x345fc1);
      this.box(building,doorW,2.9,.12,x,1.52,d/2+.3,0xabb8ce);
      this.box(building,doorW,1.75,.12,x,.9,d/2+.39,0x344664);
      for(let j=0;j<5;j++)this.box(building,doorW,.025,.12,x,2.05+j*.17,d/2+.42,0x889ab8);
      this.box(building,.14,1.1,.2,x-doorW/2-.18,.55,d/2+.47,0xf4c34f);
      this.box(building,.14,1.1,.2,x+doorW/2+.18,.55,d/2+.47,0xf4c34f);
      this.box(building,2.2,.15,.9,x,.1,d/2+.58,0x93a4c0);
      this.text(building,`${String(i+1).padStart(2,'0')}`,x,3.46,d/2+.23,.52,.26,'#ffffff','#3c65c9');
      this.crate(building,x,0,d/2+.7,.78,0xd5b284);
      const dock=new THREE.Group();dock.position.set(x,0,d/2+3.6);this.root.add(dock);
      this.line(dock,[[-1.6,.015,-2.2],[-1.6,.015,2.8],[1.6,.015,2.8],[1.6,.015,-2.2]],0xe4bb5a);
      const plane=new THREE.Mesh(new THREE.PlaneGeometry(3.2,5),new THREE.MeshBasicMaterial({color:0x4d7af5,transparent:true,opacity:.025,side:THREE.DoubleSide,depthWrite:false}));plane.rotation.x=-Math.PI/2;plane.position.y=.018;dock.add(plane);this.entity(dock,'dock',String(i+1),`月台 ${i+1}`);
    }
    this.box(building,w/2-prev,3.05,.3,(prev+w/2)/2,1.525,d/2,0xeef3fa);
    for(const x of [-w/2,w/2])for(const z of [-d/2,d/2])this.box(building,.23,h+.15,.23,x,h/2,z,0x3566cc);
    this.box(building,w+.6,.26,d+.6,0,h,0,cfg.roof);
    this.box(building,w+.68,.15,.18,0,h+.13,d/2+.3,0x3965c9);
    this.box(building,.18,.15,d+.68,w/2+.3,h+.13,0,0x3965c9);
    for(let x=-w/2;x<w/2;x+=.25)this.box(building,.025,.035,d+.3,x,h+.15,0,cfg.id==='WH-01'?0x4174d6:0xbaccea);
    this.text(building,'▣  仓流智控',0,h-.82,d/2+.2,3.6,.6,'#335fc7');
    this.text(building,cfg.id,0,h-1.28,d/2+.2,1.9,.3,'#768daf');
    const roofLabel=this.text(building,`▣  ${cfg.id}`,0,h+.2,0,4,1.1,'#ffffff');roofLabel.rotation.x=-Math.PI/2;
    for(let i=0;i<(cfg.docks>3?4:2);i++){const x=-w/2+3+i*4.7;this.box(building,1.3,.42,.85,x,h+.37,-d/2+2,0xc4cfdf,.06);for(let j=0;j<4;j++)this.box(building,.8,.02,.055,x,h+.59,-d/2+1.8+j*.12,0x9eafc9);}
    if(cfg.id==='WH-03')for(let i=0;i<4;i++){this.box(building,1.1,1.7,.55,w/2+.7,.87,-4+i*2,0xf6f8fc,.05);this.cylinder(building,.32,.09,w/2+.8,1.5,-4+i*2,0x8298b5);}
    if(cfg.id==='WH-01'){this.box(building,w*.55,.7,d*.6,-w*.225,h+.46,-d*.2,0x376bdf);this.box(building,w*.55+.3,.17,d*.6+.3,-w*.225,h+.9,-d*.2,0x2f62d5);for(let x=-w/2+.3;x<.65;x+=.25)this.box(building,.025,.035,d*.6,x,h+1,-d*.2,0x5485e9);for(let z=-d/2+.25;z<d/2;z+=.28)this.box(building,.03,h-.3,.03,w/2+.16,h/2,z,0x6b95e3);}
    this.entity(building,'site',cfg.id,cfg.name);
    // Pallet staging, blue bins, racks and shipping container.
    for(let i=0;i<4;i++){const id=cfg.products[i],x=-w/2-4+(i%2)*3.1,z=2+Math.floor(i/2)*3.3;const pallet=new THREE.Group();pallet.position.set(x,0,z);this.root.add(pallet);this.crate(pallet,0,0,0,1.1,product(id).color);if(i!==2)this.crate(pallet,0,1.05,0,1.02,product(id).color);this.entity(pallet,'product',id,product(id).name);this.pin(pallet,0,i!==2?3.15:2.1,0);}
    for(let i=0;i<3;i++)this.crate(this.root,w/2+3.6,0,-d/2+1+i*2,1.1,0x557ee9);
    const rack=new THREE.Group();rack.position.set(-w/2-4.5,0,-d/2+1);this.root.add(rack);
    for(const x of [-1.8,0,1.8])for(const z of [-.8,.8])this.box(rack,.09,4.3,.09,x,2.15,z,0x4266b5);
    for(const y of [.15,1.6,3.05]){this.box(rack,3.7,.12,1.75,0,y,0,0x6e8cca);this.box(rack,3.75,.13,.12,0,y,.86,0xf0be54);this.crate(rack,-.9,y+.1,0,.74,0xd0ae7f);this.crate(rack,.95,y+.1,0,.8,0xd8b98f);}
    const container=new THREE.Group();container.position.set(-w/2-8,0,-2);this.root.add(container);this.box(container,3.2,2.9,6,0,1.45,0,0x42a99e);for(let z=-2.9;z<=2.9;z+=.26){this.box(container,.05,2.8,.045,1.61,1.45,z,0x278d8d);this.box(container,3.15,.04,.04,0,2.92,z,0x74c2b8);}this.text(container,'北线物流',1.64,1.7,0,3.6,.6,'#e5fffa',null,Math.PI/2);
    // Site perimeter: planted islands, fencing, street lamps and distant offices.
    const front=d/2+10.8;
    for(let x=-w/2-8;x<=w/2+9;x+=4.8){const inGate=xx=>Math.abs(xx-(-w/2-7))<2.8||Math.abs(xx-(w/2+7))<2.8;if(!inGate(x))this.tree(x,front,1);if(x<w/2+5&&!inGate(x+2.4)&&!inGate(x)&&!inGate(x+4.8)){this.cylinder(this.root,.042,1.35,x,.4,front+1.15,0x8298b9);this.line(this.root,[[x,1.05,front+1.15],[x+4.8,1.05,front+1.15]],0x94a8c5);this.line(this.root,[[x,.45,front+1.15],[x+4.8,.45,front+1.15]],0xa8bad3);}}
    for(const [x,label] of [[-w/2-7,'入口'],[w/2+7,'出口']]){this.box(this.root,5.4,.08,6,x,-.25,d/2+12.1,0xd9e3f1);const sign=this.text(this.root,label,x,.06,d/2+10.6,2.2,.45,'#7898c5');sign.rotation.x=-Math.PI/2;for(const dx of [-2.6,2.6]){this.cylinder(this.root,.09,1.5,x+dx,.65,d/2+11.9,0xeac56a);this.box(this.root,.2,.35,.2,x+dx,1.2,d/2+11.9,0xf5f7fa);}}
    for(let i=0;i<5;i++)this.tree(-w/2+2+i*5,-d/2-4,1.1);

    for(const x of [-w/2-9,w/2+9]){this.cylinder(this.root,.055,5,x,2.2,front-.6,0xa3b1c8);this.box(this.root,.8,.13,.3,x+.3,4.72,front-.6,0xc7d3e4);}
  }
  crate(parent,x,y,z,s=1,color=0xd2aa75){const g=new THREE.Group();g.position.set(x,y,z);parent.add(g);for(let k=0;k<3;k++)this.box(g,s*.95,.11,s*.18,0,.075,(k-1)*s*.35,0xb48b5e);this.box(g,s,.12,s,0,.17,0,0xcba773);for(let i=0;i<2;i++)for(let j=0;j<2;j++){const h=s*.7;this.box(g,s*.45,h,s*.46,(i-.5)*s*.49,.24+h/2,(j-.5)*s*.49,color,.025);this.box(g,s*.09,.012,s*.46,(i-.5)*s*.49,.245+h,(j-.5)*s*.49,color===0x5478eb?0x7a9df3:0xe8cc9f);this.box(g,s*.1,h,s*.015,(i-.5)*s*.49,.24+h/2,(j-.5)*s*.49+s*.24,color===0x5478eb?0x7a9df3:0xe5c89d);}return g;}
  pin(parent,x,y,z){const p=new THREE.Group();p.position.set(x,y,z);const head=new THREE.Mesh(new THREE.SphereGeometry(.22,16,12),this.mat(0x4275ed));head.scale.set(1,1.1,.45);p.add(head);const tip=new THREE.Mesh(new THREE.ConeGeometry(.18,.34,12),this.mat(0x4275ed));tip.rotation.z=Math.PI;tip.position.y=-.23;p.add(tip);const dot=new THREE.Mesh(new THREE.SphereGeometry(.08,12,8),this.mat(0xffffff));dot.position.z=.1;p.add(dot);parent.add(p);this.pins.push(p);}
  tree(x,z,scale){const g=new THREE.Group();g.position.set(x,-.2,z);g.scale.setScalar(scale);this.root.add(g);this.cylinder(g,.1,1.5,0,.65,0,0x8e997c);const crown=new THREE.Mesh(new THREE.IcosahedronGeometry(.72,2),this.mat(0x82bba2));crown.position.y=1.65;crown.scale.set(.85,1.25,.85);crown.castShadow=true;g.add(crown);const shrub=new THREE.Mesh(new THREE.IcosahedronGeometry(.28,1),this.mat(0x9ac5aa));shrub.scale.y=.55;shrub.position.set(.75,.02,.15);g.add(shrub);}
  truck(sh){const g=new THREE.Group(),c=CARRIERS[sh.carrier];this.root.add(g);this.box(g,1.55,.27,3.9,0,.48,0,0x3e4b61);this.box(g,1.6,1.45,2.65,0,1.36,-.57,0xf9fbff,.05);this.box(g,1.63,.28,2.65,0,.85,-.57,c.color);this.box(g,1.52,1.2,1.2,0,1.02,1.22,sh.carrier===0?0x477af1:0xf5f8fd,.08);this.box(g,1.31,.46,.035,0,1.4,1.84,0x253a55);this.box(g,.03,.45,.66,.78,1.4,1.18,0x304761);this.box(g,.03,.45,.66,-.78,1.4,1.18,0x304761);this.box(g,1.25,.26,.035,0,.76,1.84,0x51627b);for(const x of [-.58,.58])this.box(g,.22,.14,.04,x,.86,1.85,0xfff1b0);for(const x of [-.79,.79])for(const z of [-1.35,-.75,1.24]){const wheel=this.cylinder(g,.32,.15,x,.38,z,0x29364a,16);wheel.rotation.z=Math.PI/2;const hub=this.cylinder(g,.15,.16,x,.38,z,0xacb8ca,12);hub.rotation.z=Math.PI/2;}
    this.text(g,c.name,.814,1.5,-.6,2.15,.48,'#325b9b',null,Math.PI/2);this.text(g,c.name,-.814,1.5,-.6,2.15,.48,'#325b9b',null,-Math.PI/2);this.entity(g,'truck',sh.id,`${sh.truckId} · ${c.name}`,operationSite(sh));this.trucks.set(sh.id,g);return g;}
  forklift(f,cfg){const g=new THREE.Group();this.root.add(g);this.box(g,.9,.62,1.15,0,.54,0,0xf4bc40,.09);this.box(g,.6,.36,.45,0,.95,.12,0x37465b,.04);for(const x of [-.38,.38])for(const z of [-.4,.35])this.box(g,.065,1.35,.065,x,1.32,z,0x33435b);this.box(g,1,.09,1.06,0,2.02,-.02,0x35465c,.025);for(const x of [-.32,.32]){this.box(g,.09,2.1,.09,x,1.13,.68,0x465269);this.box(g,.13,.07,.85,x,.24,1.05,0x647289);}for(const x of [-.45,.45])for(const z of [-.38,.4]){const wh=this.cylinder(g,.23,.14,x,.29,z,0x2b394c);wh.rotation.z=Math.PI/2;}this.cylinder(g,.14,.25,0,1.47,0,0xe9c29b);this.box(g,.35,.38,.24,0,1.13,0,0x4c86c2,.06);g.userData.load=this.crate(g,0,.28,1.08,.64,0xd5b284);g.userData.load.visible=false;this.entity(g,'fork',f.id,`${f.id} · 电量 ${Math.round(f.battery)}%`,cfg.id);this.forkGroups.set(f.id,g);return g;}
  sync(state){this.state=state;this.cfg=SITES.find(s=>s.id===state.siteId);
    const list=activeShipments(state).filter(sh=>sh.status!=='transit'||sh.destinationSiteId);const keep=new Set(list.map(s=>s.id));for(const[id,g]of this.trucks){if(!keep.has(id)){this.root.remove(g);this.pickables=this.pickables.filter(m=>!this.belongs(m,g));this.entities.delete(`truck:${id}`);this.disposeTree(g);this.trucks.delete(id);}}
    for(const sh of list){if(!this.trucks.has(sh.id))this.truck(sh);this.trucks.get(sh.id).userData.entity.siteId=operationSite(sh);}
    for(const cfg of SITES)for(const f of state.sites[cfg.id].forks)if(!this.forkGroups.has(f.id))this.forklift(f,cfg);
    this.controls.autoRotate=state.settings.autoRotate;this.renderer.shadowMap.enabled=state.settings.shadows;this.pins.forEach(p=>p.visible=state.settings.labels);if(this.selected&&!this.entities.has(this.selected)){this.selected=null;this.ring.visible=false;this.disposeTree(this.routeGroup);}
  }
  belongs(o,parent){for(let p=o;p;p=p.parent)if(p===parent)return true;return false;}
  hit(e){const r=this.renderer.domElement.getBoundingClientRect();this.pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);this.ray.setFromCamera(this.pointer,this.camera);const hits=this.ray.intersectObjects(this.pickables,false);for(const hit of hits){for(let p=hit.object;p;p=p.parent)if(p.userData.entity)return p.userData.entity;}return null;}
  select(key){this.selected=key;this.ring.visible=this.entities.has(key);this.routeSource=null;this.updateRoute();}
  updateRoute(){
    const entry=this.entities.get(this.selected);let route=null;
    if(entry?.kind==='truck')route=this.state.shipments.find(s=>s.id===entry.id)?.motion;
    if(entry?.kind==='fork')route=this.state.sites[entry.siteId].forks.find(f=>f.id===entry.id)?.motion;
    if(this.routeSource===route)return;this.routeSource=route;this.disposeTree(this.routeGroup);
    if(!route)return;
    const cfg=SITES.find(s=>s.id===entry.siteId);
    const points=route.points.map(p=>{const world=route.space==='world'?p:toWorld(cfg,p);return new THREE.Vector3(world.x,route.space==='world'?-.3:roadHeight(cfg,p.z)+.08,world.z);});
    const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineDashedMaterial({color:0x4b79f0,dashSize:.32,gapSize:.2,transparent:true,opacity:.85}));line.computeLineDistances();this.routeGroup.add(line);
  }
  follow(kind,id){this.focus(kind,id);this.followKey=`${kind}:${id}`;}
  positionVehicle(group,vehicle,dt){
    const pose=vehicle.pose;if(!pose)return;
    if(vehicle.siteId)group.userData.entity.siteId=operationSite(vehicle);
    const cfg=SITES.find(s=>s.id===group.userData.entity.siteId),world=vehicle.poseSpace==='world'?pose:toWorld(cfg,pose);
    const target=new THREE.Vector3(world.x,group.userData.entity.kind==='truck'?(vehicle.poseSpace==='world'?-.4:roadHeight(cfg,pose.z)):0,world.z);
    const first=!group.userData.positioned;
    if(first){group.position.copy(target);group.rotation.y=pose.yaw;group.userData.positioned=true;}
    else if(!this.state.paused){group.position.lerp(target,1-Math.exp(-dt*22));const angle=Math.atan2(Math.sin(pose.yaw-group.rotation.y),Math.cos(pose.yaw-group.rotation.y));group.rotation.y+=angle*(1-Math.exp(-dt*14));}
    if(group.userData.load)group.userData.load.visible=Boolean(vehicle.carrying);
  }
  focus(kind,id){this.isOverview=false;const entry=this.entities.get(this.entityKey(kind,id));if(!entry)return;this.select(entry.key);const target=entry.group.getWorldPosition(new THREE.Vector3());if(kind==='site'){const o=siteOrigin(SITES.find(s=>s.id===id));target.set(o.x,1,o.z);}this.focusTarget=target.clone();this.focusZoom=kind==='site'?1:1.8;}
  zoom(factor){this.isOverview=false;this.camera.zoom=THREE.MathUtils.clamp(this.camera.zoom*factor,.1,3.4);this.camera.updateProjectionMatrix();}
  rotate(direction=1){const offset=this.camera.position.clone().sub(this.controls.target);offset.applyAxisAngle(new THREE.Vector3(0,1,0),direction*Math.PI/8);this.camera.position.copy(this.controls.target).add(offset);this.controls.update();}
  top(){this.camera.position.copy(this.controls.target).add(new THREE.Vector3(.1,55,.1));this.controls.update();}
  home(instant=false){this.isOverview=true;this.followKey=null;this.camera.position.set(110,160,180);const target=new THREE.Vector3(0,0,-6);this.controls.target.copy(target);this.camera.zoom=this.overviewZoom();this.camera.updateProjectionMatrix();this.controls.update();this.focusTarget=null;}
  overviewZoom(){const w=this.container.clientWidth,h=this.container.clientHeight;return w<700?Math.min(.42,38*(w/h)/128):Math.min(.37,24*(w/h)/140);}
  resize(){const {clientWidth:w,clientHeight:h}=this.container;if(!w||!h)return;this.renderer.setSize(w,h);const extent=w<700?38:24;const aspect=w/h;this.camera.left=-extent*aspect;this.camera.right=extent*aspect;this.camera.top=extent;this.camera.bottom=-extent;if(this.isOverview)this.camera.zoom=this.overviewZoom();this.camera.clearViewOffset();this.camera.updateProjectionMatrix();}
  frame(ms){this.frameId=requestAnimationFrame(t=>this.frame(t));const dt=Math.min((ms-this.lastTime)/1000,.1);this.lastTime=ms;
    if(this.state&&this.cfg){const st=this.state,cfg=this.cfg,paused=st.paused;this.simTime+=paused?0:dt*st.speed;const time=this.simTime;
      for(const sh of activeShipments(st)){const g=this.trucks.get(sh.id);if(g)this.positionVehicle(g,sh,dt);}
      for(const site of SITES)for(const f of st.sites[site.id].forks){const g=this.forkGroups.get(f.id);if(g)this.positionVehicle(g,f,dt);}
      this.updateRoute();
      if(this.followKey&&!this.focusTarget){const e=this.entities.get(this.followKey);if(e){const target=e.group.position.clone();const delta=target.sub(this.controls.target).multiplyScalar(.12);this.controls.target.add(delta);this.camera.position.add(delta);}else this.home();}
      this.pins.forEach((p,i)=>{p.rotation.y=this.controls.getAzimuthalAngle();p.children[0].position.y=Math.sin(ms*.002+i)*.055;});
      if(this.selected){const e=this.entities.get(this.selected);if(e){const p=e.group.getWorldPosition(new THREE.Vector3());this.ring.position.set(p.x,.1,p.z);const scale=e.kind==='site'?5:e.kind==='truck'?1.8:e.kind==='dock'?1.3:1;this.ring.scale.setScalar(scale*(1+Math.sin(ms*.003)*.02));}}
    }
    if(this.focusTarget){const d=this.focusTarget.clone().sub(this.controls.target).multiplyScalar(.08);this.controls.target.add(d);this.camera.position.add(d);this.camera.zoom=THREE.MathUtils.lerp(this.camera.zoom,this.focusZoom,.08);this.camera.updateProjectionMatrix();if(d.length()<.005)this.focusTarget=null;}
    this.controls.update();this.renderer.render(this.scene,this.camera);
    for(const {cfg,button} of this.siteLabels){const origin=siteOrigin(cfg),p=new THREE.Vector3(origin.x,1,origin.z+cfg.d/2+9).project(this.camera);button.hidden=this.camera.zoom>.72||Math.abs(p.x)>1.05||Math.abs(p.y)>1.05;button.style.transform=`translate(${(p.x+1)*this.container.clientWidth/2}px,${(1-p.y)*this.container.clientHeight/2}px) translate(-50%,-50%)`;}
  }
  dispose(){this.labelLayer.remove();cancelAnimationFrame(this.frameId);this.resizeObserver.disconnect();this.controls.dispose();this.disposeTree(this.root);this.disposeTree(this.routeGroup);for(const m of this.materials.values())m.dispose();for(const t of this.textures)t.dispose();this.renderer.dispose();}
}
