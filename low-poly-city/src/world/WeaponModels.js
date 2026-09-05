/**
 * WeaponModels —— 第一人称低多边形武器模型（挂在相机前，枪口朝 -z）。
 */
import * as THREE from 'three';

const std = (color, opts = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0.35, ...opts });

const box = (w, h, d, mat) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
const cyl = (r1, r2, h, mat, seg = 10) => {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, seg), mat);
  m.rotation.x = Math.PI / 2; // 轴向转到 z（枪管方向）
  return m;
};

/** 锤子：木柄 + 铁头 */
export function buildHammer() {
  const g = new THREE.Group();
  const wood = std(0x8a5a33, { metalness: 0.05 });
  const iron = std(0x6f7b8a);
  const handle = cyl(0.035, 0.042, 0.85, wood);
  handle.rotation.x = -0.9; // 斜向上握持
  handle.position.set(0, -0.05, -0.1);
  const head = box(0.34, 0.14, 0.16, iron);
  head.position.set(0, 0.32, -0.42);
  g.add(handle, head);
  return g;
}

/** 冲锋枪：机匣 + 短枪管 + 弹匣 + 握把 */
export function buildSmg() {
  const g = new THREE.Group();
  const metal = std(0x2f353d);
  const grip = std(0x1c2128, { metalness: 0.1 });
  const body = box(0.1, 0.14, 0.5, metal);
  const barrel = cyl(0.022, 0.022, 0.3, metal);
  barrel.position.set(0, 0.02, -0.4);
  const mag = box(0.06, 0.22, 0.1, grip);
  mag.position.set(0, -0.17, -0.05);
  mag.rotation.x = 0.25;
  const pistolGrip = box(0.07, 0.16, 0.09, grip);
  pistolGrip.position.set(0, -0.14, 0.14);
  g.add(body, barrel, mag, pistolGrip);
  return g;
}

/** 狙击枪：木质枪托 + 长枪管 + 大瞄准镜 */
export function buildSniper() {
  const g = new THREE.Group();
  const wood = std(0x7a5230, { metalness: 0.05 });
  const metal = std(0x24282e);
  const stock = box(0.09, 0.13, 0.62, wood);
  const barrel = cyl(0.02, 0.02, 0.75, metal);
  barrel.position.set(0, 0.02, -0.62);
  const scopeBody = cyl(0.045, 0.045, 0.3, std(0x11141a));
  scopeBody.position.set(0, 0.13, -0.18);
  const lens = cyl(0.05, 0.05, 0.02, new THREE.MeshBasicMaterial({ color: 0x9fd0ff }));
  lens.position.set(0, 0.13, -0.34);
  g.add(stock, barrel, scopeBody, lens);
  return g;
}

/** 火箭筒：大筒身 + 喇叭口 + 外露战斗部 */
export function buildRpg() {
  const g = new THREE.Group();
  const metal = std(0x3d4a3c);
  const dark = std(0x22262c);
  const tube = cyl(0.09, 0.09, 1.05, metal);
  const flare = cyl(0.09, 0.15, 0.22, dark);
  flare.position.z = 0.58; // 尾部喇叭
  const warhead = cyl(0.06, 0.02, 0.24, std(0x8a3b2e));
  warhead.position.z = -0.62; // 头部锥
  const grip = box(0.07, 0.18, 0.1, dark);
  grip.position.set(0, -0.16, 0.05);
  g.add(tube, flare, warhead, grip);
  return g;
}

/** 火箭弹（世界空间飞行体，头部朝 -z） */
export function buildRocketMesh() {
  const g = new THREE.Group();
  const body = cyl(0.09, 0.09, 0.5, std(0x4a5248));
  const nose = cyl(0.09, 0.01, 0.22, std(0x8a3b2e));
  nose.position.z = -0.36;
  for (let i = 0; i < 4; i++) {
    const fin = box(0.02, 0.14, 0.14, std(0x2a2e33));
    fin.position.z = 0.24;
    fin.rotation.z = (i * Math.PI) / 2;
    fin.position.x = Math.sin((i * Math.PI) / 2) * 0.1;
    fin.position.y = Math.cos((i * Math.PI) / 2) * 0.1;
    g.add(fin);
  }
  g.add(body, nose);
  return g;
}
