import * as THREE from 'three';
import { OrbitControls } from './vendor/OrbitControls.js';
import { RoundedBoxGeometry } from './vendor/RoundedBoxGeometry.js';
import { FACES, FACE_ORDER, parseMove } from './model.js';

export class CubeView {
  constructor(container,model,onSelect) {
    this.container=container;this.model=model;this.cubies=[];this.labels=[];this.onSelect=onSelect;this.labelsVisible=true;
    this.scene=new THREE.Scene();
    this.renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
    this.renderer.outputColorSpace=THREE.SRGBColorSpace;
    this.renderer.toneMapping=THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure=1.05;
    this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    container.append(this.renderer.domElement);
    this.camera=new THREE.PerspectiveCamera(34,1,.1,100);
    this.camera.position.set(5.2,4.4,7.3);
    this.controls=new OrbitControls(this.camera,this.renderer.domElement);
    this.controls.enableDamping=true;this.controls.dampingFactor=.09;this.controls.enablePan=false;
    this.controls.minDistance=6.8;this.controls.maxDistance=16;this.controls.target.set(0,-.1,0);
    this.controls.saveState();this.controls.addEventListener('change',()=>this.requestRender());
    this.scene.add(new THREE.HemisphereLight(0xfffdf3,0xc6cabb,3));
    const key=new THREE.DirectionalLight(0xfff4df,3.8);key.position.set(-3,7,5);key.castShadow=true;
    key.shadow.mapSize.set(1024,1024);Object.assign(key.shadow.camera,{left:-5,right:5,top:5,bottom:-5,near:.1,far:25});
    key.shadow.normalBias=.025;key.shadow.bias=-.0003;this.scene.add(key);
    const fill=new THREE.DirectionalLight(0xffffff,1.2);fill.position.set(5,3,-4);this.scene.add(fill);
    const floor=new THREE.Mesh(new THREE.PlaneGeometry(100,100),new THREE.ShadowMaterial({opacity:.025}));
    floor.rotation.x=-Math.PI/2;floor.position.y=-2.02;floor.receiveShadow=true;this.scene.add(floor);
    const shadowCanvas=document.createElement('canvas');shadowCanvas.width=shadowCanvas.height=256;
    const shadowContext=shadowCanvas.getContext('2d');
    const shadowGradient=shadowContext.createRadialGradient(128,128,10,128,128,124);
    shadowGradient.addColorStop(0,'rgba(55,66,47,0.23)');shadowGradient.addColorStop(.4,'rgba(55,66,47,0.12)');shadowGradient.addColorStop(1,'rgba(55,66,47,0)');
    shadowContext.fillStyle=shadowGradient;shadowContext.fillRect(0,0,256,256);
    const softShadow=new THREE.Mesh(new THREE.PlaneGeometry(5.5,4.7),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(shadowCanvas),transparent:true,depthWrite:false}));
    softShadow.rotation.x=-Math.PI/2;softShadow.position.set(.25,-2.01,.15);this.scene.add(softShadow);
    this.root=new THREE.Group();this.scene.add(this.root);
    this.bodyGeo=new RoundedBoxGeometry(.98,.98,.98,3,.06);
    this.bodyMaterial=new THREE.MeshStandardMaterial({color:0x282d29,roughness:.47,metalness:.06});
    const shape=new THREE.Shape();const s=.427,r=.068;
    shape.moveTo(-s+r,-s);shape.lineTo(s-r,-s);shape.quadraticCurveTo(s,-s,s,-s+r);shape.lineTo(s,s-r);shape.quadraticCurveTo(s,s,s-r,s);shape.lineTo(-s+r,s);shape.quadraticCurveTo(-s,s,-s,s-r);shape.lineTo(-s,-s+r);shape.quadraticCurveTo(-s,-s,-s+r,-s);
    this.stickerGeo=new THREE.ExtrudeGeometry(shape,{depth:.024,bevelEnabled:true,bevelThickness:.005,bevelSize:.005,bevelSegments:2,steps:1,curveSegments:6});
    this.materials=Object.fromEntries(FACE_ORDER.map(f=>[f,new THREE.MeshPhysicalMaterial({color:FACES[f].color,roughness:.29,metalness:0,clearcoat:.45,clearcoatRoughness:.35})]));
    this.labelMaterials=Object.fromEntries(FACE_ORDER.map(f=>{
      const canvas=document.createElement('canvas');canvas.width=canvas.height=128;const ctx=canvas.getContext('2d');
      ctx.font='600 64px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=f==='U'||f==='D'?'#60644a':'#ffffff';ctx.globalAlpha=.58;ctx.fillText(f,64,68);
      const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
      return [f,new THREE.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1})];
    }));
    this.labelGeo=new THREE.PlaneGeometry(.29,.29);
    this.selectionGeo=new RoundedBoxGeometry(1.001,1.001,1.001,2,.06);
    this.selectionMaterial=new THREE.MeshBasicMaterial({color:0x859c6a,transparent:true,opacity:.07,depthWrite:false});
    this.raycaster=new THREE.Raycaster();this.pointer=new THREE.Vector2();
    let pointerStart;
    container.addEventListener('pointerdown',event=>{pointerStart={x:event.clientX,y:event.clientY};});
    container.addEventListener('pointerup',event=>{
      if(!pointerStart||Math.hypot(event.clientX-pointerStart.x,event.clientY-pointerStart.y)>5||this.animating)return;
      const rect=container.getBoundingClientRect();this.pointer.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);
      this.raycaster.setFromCamera(this.pointer,this.camera);
      const hit=this.raycaster.intersectObjects(this.stickerMeshes,false)[0];
      if(hit)this.onSelect(hit.object.userData.face);
    });
    this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(container);
    this.rebuild();this.resize();this.tick=this.tick.bind(this);this.tick();
  }
  resize() {
    const w=this.container.clientWidth,h=this.container.clientHeight;if(!w||!h)return;
    this.renderer.setSize(w,h);this.camera.aspect=w/h;
    this.camera.fov=w/h<1.2?39:34;this.camera.updateProjectionMatrix();this.requestRender();
  }
  requestRender() {this.dirty=true;}
  tick() {
    this.frame=requestAnimationFrame(this.tick);
    this.controls.update();
    if(this.dirty||this.animating){this.renderer.render(this.scene,this.camera);this.dirty=false;}
  }
  rebuild() {
    this.root.clear();this.cubies=[];this.labels=[];this.stickerMeshes=[];this.selectionMeshes=[];
    for(let x=-1;x<=1;x++)for(let y=-1;y<=1;y++)for(let z=-1;z<=1;z++) {
      if(x===0&&y===0&&z===0)continue;
      const group=new THREE.Group();group.position.set(x,y,z);group.userData.position=[x,y,z];
      const body=new THREE.Mesh(this.bodyGeo,this.bodyMaterial);body.castShadow=true;body.receiveShadow=true;group.add(body);
      for(const s of this.model.stickers.filter(s=>s.position[0]===x&&s.position[1]===y&&s.position[2]===z)) {
        const normal=new THREE.Vector3(...s.normal);
        const face=FACE_ORDER.find(f=>FACES[f].normal.every((n,i)=>n===s.normal[i]));
        const sticker=new THREE.Mesh(this.stickerGeo,this.materials[s.color]);sticker.position.copy(normal).multiplyScalar(.493);
        sticker.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),normal);sticker.userData.face=face;sticker.castShadow=true;sticker.receiveShadow=true;group.add(sticker);this.stickerMeshes.push(sticker);
        if(Math.abs(x)+Math.abs(y)+Math.abs(z)===1) {
          const label=new THREE.Mesh(this.labelGeo,this.labelMaterials[s.color]);label.position.copy(normal).multiplyScalar(.526);
          const f=FACES[face];const matrix=new THREE.Matrix4().makeBasis(new THREE.Vector3(...f.right),new THREE.Vector3(...f.up),normal);label.quaternion.setFromRotationMatrix(matrix);
          label.visible=this.labelsVisible;group.add(label);this.labels.push(label);
        }
      }
      const select=new THREE.Mesh(this.selectionGeo,this.selectionMaterial);select.visible=false;group.add(select);this.selectionMeshes.push(select);
      this.root.add(group);this.cubies.push(group);
    }
    this.highlight(this.highlightFace);this.requestRender();
  }
  highlight(face) {
    this.highlightFace=face;
    this.cubies.forEach((c,i)=>{this.selectionMeshes[i].visible=!!face&&c.userData.position[FACES[face].axis]===FACES[face].layer;});
    this.requestRender();
  }
  setLabels(visible) {this.labelsVisible=visible;this.labels.forEach(l=>l.visible=visible);this.requestRender();}
  resetCamera() {this.controls.reset();this.requestRender();}
  renderedState() {
    this.root.updateMatrixWorld(true);
    const faces=Object.fromEntries(FACE_ORDER.map(f=>[f,Array(9)]));
    for(const sticker of this.stickerMeshes){
      const normal=new THREE.Vector3(0,0,1).applyQuaternion(sticker.getWorldQuaternion(new THREE.Quaternion())).toArray().map(Math.round);
      const face=FACE_ORDER.find(f=>FACES[f].normal.every((n,i)=>n===normal[i]));
      const position=sticker.parent.getWorldPosition(new THREE.Vector3()).toArray().map(Math.round),f=FACES[face];
      const col=position.reduce((a,n,k)=>a+n*f.right[k],0)+1,row=1-position.reduce((a,n,k)=>a+n*f.up[k],0);
      faces[face][row*3+col]=FACE_ORDER.find(f=>this.materials[f]===sticker.material);
    }
    return FACE_ORDER.map(f=>faces[f].join('')).join('');
  }
  async animateMove(move,duration=320) {
    const m=parseMove(move),pivot=new THREE.Group();this.root.add(pivot);
    for(const cubie of this.cubies)if(cubie.userData.position[m.axis]===m.layer)pivot.attach(cubie);
    this.animating=true;this.controls.enabled=false;
    const rotation=['x','y','z'][m.axis],angle=m.quarter*Math.PI/2;
    const start=performance.now();
    await new Promise(resolve=>{
      const frame=now=>{
        const t=Math.min(1,(now-start)/Math.max(1,duration));const ease=t*t*(3-2*t);
        pivot.rotation[rotation]=angle*ease;this.requestRender();
        if(t<1)requestAnimationFrame(frame);else resolve();
      };requestAnimationFrame(frame);
    });
    this.model.move(move);this.rebuild();this.animating=false;this.controls.enabled=true;
  }
}
