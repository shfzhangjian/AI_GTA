/**
 * GroundBuilder —— 地块底座、草地四象限、人行道，以及用于鼠标拾取的隐形平面。
 */
import * as THREE from 'three';
import { PALETTE, WORLD } from '../config.js';

const std = (color) => new THREE.MeshStandardMaterial({ color, roughness: 0.95 });

/** 便捷方法：生成一个“顶面恰好位于 topY”的扁盒 */
export function boxToTop(w, d, topY, h, mat) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  mesh.position.y = topY - h / 2;
  mesh.receiveShadow = true;
  return mesh;
}

export function build(scene) {
  const g = new THREE.Group();
  const H = WORLD.half;
  const e = WORLD.roadHalf + WORLD.walk; // 草地起始：路缘 + 人行道外沿
  const o = H - 1;

  // ---- 底座“浮岛”侧面 ----
  const slab = new THREE.Mesh(
    new THREE.BoxGeometry(H * 2, 6, H * 2),
    std(PALETTE.slabSide)
  );
  slab.position.y = -3;
  slab.receiveShadow = true;
  g.add(slab);

  // ---- 草地四象限（顶面 surfGrass）----
  const grassRects = [
    [-o, -e, -o, -e, PALETTE.grass[0]], // 西北
    [ e,  o, -o, -e, PALETTE.grass[1]], // 东北
    [-o, -e,  e,  o, PALETTE.grass[2]], // 西南
    [ e,  o,  e,  o, PALETTE.grass[0]], // 东南
  ];
  for (const [x0, x1, z0, z1, color] of grassRects) {
    const m = boxToTop(x1 - x0, z1 - z0, WORLD.surfGrass, 0.3, std(color));
    m.position.set((x0 + x1) / 2, m.position.y, (z0 + z1) / 2);
    g.add(m);
  }

  // ---- 人行道（贴着十字路口四边，顶面与草地齐平）----
  const swMat = std(PALETTE.sidewalk);
  const L = o * 2;                 // 人行道总长
  const c0 = WORLD.roadHalf + WORLD.walk / 2; // 中心偏移
  const spans = [
    { x: 0, z:  c0, w: L, d: WORLD.walk },
    { x: 0, z: -c0, w: L, d: WORLD.walk },
    { x:  c0, z: 0, w: WORLD.walk, d: L },
    { x: -c0, z: 0, w: WORLD.walk, d: L },
  ];
  for (const s of spans) {
    const m = boxToTop(s.w, s.d, WORLD.surfGrass, 0.3, swMat);
    m.position.set(s.x, m.position.y, s.z);
    g.add(m);
  }

  // ---- 鼠标拾取平面（不可见，仅用于射线检测落点）----
  const picker = new THREE.Mesh(
    new THREE.PlaneGeometry(H * 2, H * 2),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
  );
  picker.rotation.x = -Math.PI / 2;
  picker.position.y = WORLD.surfGrass + 0.02;
  picker.updateMatrixWorld(); // 不在场景图中，需手动刷新一次世界矩阵供射线使用

  scene.add(g);
  return { group: g, picker };
}
