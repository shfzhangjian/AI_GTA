import * as THREE from 'three';
export const HOLE_HALF=.78;
export const HOLE_RADIUS=.62;
export function addGoal(board,world,platform,RAPIER,x,z){
 const shape=new THREE.Shape();shape.moveTo(-HOLE_HALF,-HOLE_HALF);shape.lineTo(HOLE_HALF,-HOLE_HALF);shape.lineTo(HOLE_HALF,HOLE_HALF);shape.lineTo(-HOLE_HALF,HOLE_HALF);shape.closePath();
 const hole=new THREE.Path();hole.absarc(0,0,HOLE_RADIUS,0,Math.PI*2,true);shape.holes.push(hole);
 const geometry=new THREE.ExtrudeGeometry(shape,{depth:.3,bevelEnabled:false,curveSegments:48});geometry.rotateX(-Math.PI/2);
 const rim=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({color:'#738879',metalness:.8,roughness:.27}));rim.position.set(x,-.3,z);rim.receiveShadow=true;rim.castShadow=true;rim.userData.disposable=true;board.add(rim);
 const vertices=geometry.attributes.position.array,indices=geometry.index?.array??Uint32Array.from({length:vertices.length/3},(_,i)=>i);
 world.createCollider(RAPIER.ColliderDesc.trimesh(vertices,indices).setTranslation(x,-.3,z).setFriction(.4),platform);
 const tunnel=new THREE.Mesh(new THREE.CylinderGeometry(HOLE_RADIUS,HOLE_RADIUS,1.4,64,1,true),new THREE.MeshStandardMaterial({color:'#23382d',metalness:.35,roughness:.6,side:THREE.DoubleSide}));tunnel.position.set(x,-.75,z);tunnel.userData.disposable=true;board.add(tunnel);
 // Solid cup walls catch lateral momentum after the ball enters the opening.
 for(let i=0;i<48;i++){const angle=i*Math.PI*2/48,rotation=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),angle);world.createCollider(RAPIER.ColliderDesc.cuboid(.046,.7,.04).setTranslation(x+Math.sin(angle)*.66,-.75,z+Math.cos(angle)*.66).setRotation(rotation).setFriction(.35).setRestitution(.12),platform);}
 const bottom=new THREE.Mesh(new THREE.CylinderGeometry(HOLE_RADIUS,HOLE_RADIUS,.08,64),new THREE.MeshStandardMaterial({color:'#0a1410',roughness:1}));bottom.position.set(x,-1.46,z);bottom.userData.disposable=true;board.add(bottom);
 world.createCollider(RAPIER.ColliderDesc.cylinder(.04,HOLE_RADIUS).setTranslation(x,-1.46,z).setRestitution(.18),platform);
 const ring=new THREE.Mesh(new THREE.TorusGeometry(.67,.027,12,64),new THREE.MeshStandardMaterial({color:'#8ceca6',metalness:.3,roughness:.25,emissive:'#339c54',emissiveIntensity:.55}));ring.rotation.x=Math.PI/2;ring.position.set(x,.016,z);ring.userData.disposable=true;board.add(ring);return ring;
}
