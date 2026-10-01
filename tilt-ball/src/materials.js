import * as THREE from 'three';

// Seeded textures: stable grain, fabric weave and trapped bubbles at every restart.
function texture(kind, grayscale=false){
 const size=512,canvas=document.createElement('canvas');canvas.width=canvas.height=size;
 const ctx=canvas.getContext('2d'),pixels=ctx.createImageData(size,size);let seed=84621;
 const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const noise=random()-.5;let base,color;
  if(kind==='wood'){
   const warp=y+9*Math.sin(x*.019)+3*Math.sin(x*.057);
   const grain=Math.sin(warp*.64+Math.sin(x*.012)*3)*.5+.5;
   const fine=Math.sin(warp*2.8)*.5+.5;
   const seam=y%128<2?-.35:0;
   base=.57+grain*.18+fine*.05+noise*.06+seam;color=[base*235,base*159,base*87];
  }else if(kind==='felt'){
   const weave=(Math.sin(x*Math.PI/2)*Math.sin(y*Math.PI/2));
   base=.57+noise*.3+weave*.11;color=[base*132,base*123,base*172];
  }else{
   base=.8+noise*.05+Math.sin(x*.025+y*.017)*.03;color=[base*163,base*216,base*233];
  }
  const i=(y*size+x)*4;for(let c=0;c<3;c++)pixels.data[i+c]=grayscale?base*255:color[c];pixels.data[i+3]=255;
 }
 ctx.putImageData(pixels,0,0);
 if(kind==='ice'){
  for(let i=0;i<180;i++){const x=random()*size,y=random()*size,r=.5+random()*2.6;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=grayscale?'rgba(255,255,255,.12)':'rgba(236,253,255,.38)';ctx.fill();}
  for(let i=0;i<7;i++){let x=random()*size,y=random()*size;ctx.beginPath();ctx.moveTo(x,y);for(let j=0;j<9;j++){x+=8+random()*15;y+=(random()-.5)*18;ctx.lineTo(x,y);}ctx.strokeStyle='rgba(236,253,255,.25)';ctx.lineWidth=.65;ctx.stroke();}
 }
 const map=new THREE.CanvasTexture(canvas);map.wrapS=map.wrapT=THREE.RepeatWrapping;map.anisotropy=8;if(!grayscale)map.colorSpace=THREE.SRGBColorSpace;return map;
}
export const materials={
 wood:new THREE.MeshPhysicalMaterial({map:texture('wood'),bumpMap:texture('wood',true),bumpScale:.035,roughness:.43,clearcoat:.22,clearcoatRoughness:.36}),
 ice:new THREE.MeshPhysicalMaterial({map:texture('ice'),bumpMap:texture('ice',true),bumpScale:.012,roughness:.11,metalness:0,ior:1.31,clearcoat:1,clearcoatRoughness:.07}),
 felt:new THREE.MeshStandardMaterial({map:texture('felt'),bumpMap:texture('felt',true),bumpScale:.045,roughness:1}),
 rail:new THREE.MeshStandardMaterial({color:'#35473d',metalness:.65,roughness:.32})
};
export function worldUV(geometry,x,z){const uv=geometry.attributes.uv,p=geometry.attributes.position,n=geometry.attributes.normal;for(let i=0;i<uv.count;i++)if(Math.abs(n.getY(i))>.5)uv.setXY(i,(p.getX(i)+x)/3,(p.getZ(i)+z)/3);uv.needsUpdate=true;}
export const ballFinishes=[
 {name:'抛光黄铜',color:'#cfa35a',metalness:1,roughness:.18,clearcoat:.3},
 {name:'镜面铬',color:'#dde4ea',metalness:1,roughness:.075,clearcoat:.2},
 {name:'釉面陶瓷',color:'#258c8f',metalness:0,roughness:.18,clearcoat:1},
 {name:'珠光珐琅',color:'#d5c0e0',metalness:.12,roughness:.22,clearcoat:1,iridescence:.65},
 {name:'铜球',color:'#bd7351',metalness:1,roughness:.22,clearcoat:.3}
];
