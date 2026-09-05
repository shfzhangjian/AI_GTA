/**
 * NatureBuilder —— 低多边形树（球形簇）、灌木。
 * 树木位置使用坐标哈希做确定性伪随机，刷新页面造型稳定可复现。
 */
import * as THREE from 'three';
import { PALETTE } from '../config.js';

function seededRandom(x, z) {
  let s = ((x * 73856093) ^ (z * 19349663)) >>> 0;
  if (s === 0) s = 0x9e3779b9;
  return () => {
    s ^= s << 13; s >>>= 0;
    s ^= s >> 17;
    s ^= s << 5;  s >>>= 0;
    return s / 4294967296;
  };
}

const blobGeo = new THREE.SphereGeometry(1, 8, 6); // 低分段数 + flatShading = 多面体感
const trunkGeo = new THREE.CylinderGeometry(0.22, 0.32, 1.5, 7);

/** @param {{x,z,s?:number,c?:number}} t s=缩放 c=秋色索引 */
function createTree(t) {
  const rnd = seededRandom(Math.round(t.x * 10), Math.round(t.z * 10));
  const scale = t.s ?? 1;
  const color = PALETTE.foliage[(t.c ?? Math.floor(rnd() * PALETTE.foliage.length)) % PALETTE.foliage.length];

  const g = new THREE.Group();
  const trunk = new THREE.Mesh(trunkGeo, new THREE.MeshStandardMaterial({ color: PALETTE.trunk, roughness: 1 }));
  trunk.position.y = 0.75;
  trunk.castShadow = true;

  const leafMat = new THREE.MeshStandardMaterial({ color, roughness: 1, flatShading: true });
  const blobs = [
    { r: 0.98, p: [0, 2.0, 0] },
    { r: 0.64, p: [0.5 + rnd() * 0.2, 2.5, (rnd() - 0.5) * 0.6] },
    { r: 0.55, p: [-0.45, 2.35, -0.35 + (rnd() - 0.5) * 0.3] },
  ];
  for (const b of blobs) {
    const m = new THREE.Mesh(blobGeo, leafMat);
    m.scale.setScalar(b.r);
    m.position.set(...b.p);
    m.castShadow = true;
    g.add(m);
  }
  g.add(trunk);
  g.position.set(t.x, 0, t.z);
  g.scale.setScalar(scale);
  g.rotation.y = rnd() * Math.PI * 2;
  return g;
}

/** @param {Array} list 树列表 @param {(x,z,r)=>void} addCircle 注册圆形碰撞体 */
export function buildTrees(scene, list, addCircle) {
  const g = new THREE.Group();
  for (const t of list) {
    g.add(createTree(t));
    addCircle(t.x, t.z, 0.7 * (t.s ?? 1)); // 树干碰撞（细，方便贴近观赏）
  }
  scene.add(g);
  return g;
}

/** 小灌木球（无碰撞，可穿行） */
export function buildBushes(scene, list) {
  const mat = new THREE.MeshStandardMaterial({ color: PALETTE.foliage[3], roughness: 1, flatShading: true });
  const g = new THREE.Group();
  for (const b of list) {
    const m = new THREE.Mesh(blobGeo, mat);
    m.scale.setScalar(0.6 * (b.s ?? 1));
    m.position.set(b.x, 0.42, b.z);
    m.castShadow = true;
    g.add(m);
  }
  scene.add(g);
  return g;
}
