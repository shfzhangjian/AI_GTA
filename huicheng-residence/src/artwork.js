import * as THREE from 'three';

// The original photo stays intact. Projective UVs sample only the painting's interior.
// This corrects the photographed perspective without redrawing or changing the artwork.
export function photoProjection(points,size) {
  const rows=[];
  for(const [u,v,x,y] of points){const px=x/size[0],py=1-y/size[1];
    rows.push([u,v,1,0,0,0,-px*u,-px*v,px],[0,0,0,u,v,1,-py*u,-py*v,py]);
  }
  for(let c=0;c<8;c++){
    let pivot=c;for(let r=c+1;r<8;r++)if(Math.abs(rows[r][c])>Math.abs(rows[pivot][c]))pivot=r;
    [rows[c],rows[pivot]]=[rows[pivot],rows[c]];
    const divisor=rows[c][c];for(let k=c;k<9;k++)rows[c][k]/=divisor;
    for(let r=0;r<8;r++){if(r===c)continue;const f=rows[r][c];for(let k=c;k<9;k++)rows[r][k]-=f*rows[c][k];}
  }
  const h=rows.map(r=>r[8]);return new THREE.Matrix3().set(h[0],h[1],h[2],h[3],h[4],h[5],h[6],h[7],1);
}

const photoCache=new Map();
export function referencePhotoMaterial(url,points,size=[1280,1707],statusKey) {
  let entry=photoCache.get(url);
  if(!entry){entry={status:'loading',keys:new Set()};photoCache.set(url,entry);const status=value=>{entry.status=value;for(const key of entry.keys)document.body.dataset[key]=value;};entry.texture=new THREE.TextureLoader().load(url,()=>status('loaded'),undefined,()=>status('failed'));entry.texture.colorSpace=THREE.SRGBColorSpace;entry.texture.anisotropy=8;}
  if(statusKey){entry.keys.add(statusKey);document.body.dataset[statusKey]=entry.status;}
  const photo=entry.texture;
  const material=new THREE.MeshBasicMaterial({map:photo,toneMapped:false});
  const projection=photoProjection(points,size);
  material.onBeforeCompile=shader=>{
    shader.uniforms.photoProjection={value:projection};
    shader.fragmentShader='uniform mat3 photoProjection;\n'+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#ifdef USE_MAP
      vec3 photoPoint=photoProjection*vec3(vMapUv,1.0);
      diffuseColor*=texture2D(map,photoPoint.xy/photoPoint.z);
    #endif`);
  };
  material.customProgramCacheKey=()=> 'reference-art-projective-v1';return material;
}
export function createReferenceArtwork() {
  const group=new THREE.Group();group.name='走廊挂画';
  const width=.70,height=1.42,frame=.018;
  const black=new THREE.MeshStandardMaterial({color:'#161b19',roughness:.55,metalness:.15});
  const addFrame=(x,y,w,h)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,.038),black);m.position.set(x,y,0);m.castShadow=true;m.receiveShadow=true;m.userData={furniture:'走廊挂画 · 黑色画框'};group.add(m);};
  addFrame(0,height/2-frame/2,width,frame);addFrame(0,-height/2+frame/2,width,frame);
  addFrame(-width/2+frame/2,0,frame,height-frame*2);addFrame(width/2-frame/2,0,frame,height-frame*2);
  const material=referencePhotoMaterial(window.__ARTWORK||'/public/art/hall-painting.jpg',[[0,1,410,385],[1,1,870,393],[1,0,836,1284],[0,0,415,1277]],[1280,1707],'artwork');
  const image=new THREE.Mesh(new THREE.PlaneGeometry(width-frame*2,height-frame*2),material);
  image.position.z=.014;image.userData={furniture:'走廊挂画 · 用户提供的原画'};group.add(image);
  return group;
}
