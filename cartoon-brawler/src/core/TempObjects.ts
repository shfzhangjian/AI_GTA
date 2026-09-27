/** Reusable scratch objects — hot paths must not allocate Vector3/Quaternion. */
import * as THREE from 'three';

export const tmp = {
  vec3A: new THREE.Vector3(),
  vec3B: new THREE.Vector3(),
  vec3C: new THREE.Vector3(),
  vec3D: new THREE.Vector3(),
  vec3E: new THREE.Vector3(),
  quatA: new THREE.Quaternion(),
  quatB: new THREE.Quaternion(),
  eulerA: new THREE.Euler(0, 0, 0, 'YXZ'),
  mat4A: new THREE.Matrix4(),
  colorA: new THREE.Color(),
} as const;
