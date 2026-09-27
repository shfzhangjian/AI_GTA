/**
 * Clouds.js — 云层（§11/§34）
 *
 * 做法：CPU 撒若干「云团」，每团 = 5 个压扁球合并成单一几何 →
 *   · InstancedMesh（1 个 DrawCall）
 *   · MeshLambertMaterial：正确接收场景 DirectionalLight（与 Mini Globe 同光照模型）
 *   · 落在 CLOUD_RADIUS，彼此分离 → 干净蓬松
 *   · renderOrder=3 保证在透明海洋之后绘制并被其正确混合
 *
 * 历史教训（务必保留）：
 *   ① 用 ShaderMaterial 自写光照 → 因不接收场景 lights 而发灰发暗。
 *   ② 用 gl_FrontFacing / ndv>0 discard 剔「背面」→ 把朝向相机的云顶误删，云层消失。
 */
import * as THREE from 'three';
import { PLANET } from '../config.js';
import { latLonToVector3, alignObjectToSurface } from '../utils/GeoUtils.js';

/** 可复现随机 */
export function mulberry32(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

/** 合并几何为单一 BufferGeometry（保留 position/normal） */
function mergeGeos(geos) {
  const pos = [], nor = [];
  let count = 0;
  for (const g of geos) {
    const ng = g.index ? g.toNonIndexed() : g;
    const p = ng.attributes.position, n = ng.attributes.normal;
    for (let i = 0; i < p.count; i++) {
      pos.push(p.getX(i), p.getY(i), p.getZ(i));
      if (n) nor.push(n.getX(i), n.getY(i), n.getZ(i));
    }
    count += p.count;
  }
  const m = new THREE.BufferGeometry();
  m.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  if (nor.length === count * 3) m.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  m.computeBoundingSphere();
  return m;
}

/** 一个云 puff = 5 个压扁球 */
function buildPuffGeometry(rng = Math.random) {
  const base = new THREE.SphereGeometry(1, 12, 9);
  const parts = [];
  for (let i = 0; i < 5; i++) {
    const g = base.clone();
    const a = (i / 5) * Math.PI * 2;
    const sc = 0.55 + rng() * 0.45;
    const off =
      i === 0
        ? new THREE.Vector3(0, 0.14, 0)
        : new THREE.Vector3(Math.cos(a) * 0.78, (rng() - 0.5) * 0.1, Math.sin(a) * 0.6);
    g.applyMatrix4(
      new THREE.Matrix4().compose(off, new THREE.Quaternion(), new THREE.Vector3(sc * 1.3, sc * 0.55, sc * 0.95)),
    );
    parts.push(g);
  }
  return mergeGeos(parts);
}

function scatter(inst, radius, count, rng, sizeFn) {
  const dummy = new THREE.Object3D();
  const dir = new THREE.Vector3();
  for (let i = 0; i < count; i++) {
    const lat = (rng() * 2 - 1) * 68;
    const lon = rng() * 360 - 180;
    latLonToVector3(lat, lon, radius, dir);
    // 关键：用 alignObjectToSurface 让「模型局部 +Y = 球面外法线」→ 云盘严格平行地表切平面，
    // 绝不会再「竖起来」。之前用 lookAt(0,0,0) 只保证 +Z 指向球心，未定义绕该轴的滚转 → 朝向随机。
    alignObjectToSurface(dummy, dir, null, { upAxis: 'y', forwardAxis: 'z' });
    dummy.rotateY(rng() * Math.PI * 2);   // 在切平面内随机自转（此时 +Y 已是法线，自转是「水平转」）
    const sc = sizeFn(rng);
    dummy.scale.set(sc, sc * (0.5 + rng() * 0.2), sc * (0.9 + rng() * 0.3));  // y=法线向厚度
    dummy.updateMatrix();
    inst.setMatrixAt(i, dummy.matrix);
  }
  inst.instanceMatrix.needsUpdate = true;
  inst.frustumCulled = false;
}

/** 云团（高空） */
export function createClouds(radius = PLANET.CLOUD_RADIUS, count = 46, opts = {}) {
  const rng = mulberry32(opts.seed ?? 90210);
  const mat = new THREE.MeshLambertMaterial({
    color: 0xffffff,
    emissive: 0x2a3a52,
    transparent: true,
    opacity: 0.95,
    depthWrite: false,
  });
  mat.name = 'cloud-puff';
  // 关键：把云盘「躺平」——CircleGeometry 默认在 XY 平面（法线 +Z），
  // 绕局部 X 轴转 -90° 后法线变 +Y → 之后 alignObjectToSurface(up=y) 才能把盘面摆成水平漂浮，
  // 而不是「竖立」。（之前直接 up=y 把 +Y 立成球面法线，圆盘就竖起来了）
  const puffGeo = buildPuffGeometry(rng);
  puffGeo.rotateX(-Math.PI / 2);
  const inst = new THREE.InstancedMesh(puffGeo, mat, count);
  inst.name = 'Clouds';
  scatter(inst, radius, count, rng, (r) => 6.5 + r() * 6);
  inst.renderOrder = 3;
  // 昼夜：仅调 emissive（Lambert 自动跟随场景 sun light）
  inst.setSun = () => {};
  inst.setNight = (n) => {
    const v = 0.16 - 0.12 * THREE.MathUtils.clamp(n, 0, 1);
    mat.emissive.setRGB(v, v * 1.15, v * 1.6);
  };
  inst.update = () => {};
  return inst;
}

/** 贴地薄雾（默认 Planet 关闭） */
export function createGroundMist(radius = PLANET.RADIUS + 1.6, count = 26, opts = {}) {
  const rng = mulberry32(opts.seed ?? 13579);
  const mat = new THREE.MeshLambertMaterial({
    color: 0xe6eef8,
    emissive: 0x1a2436,
    transparent: true,
    opacity: 0.28,
    depthWrite: false,
  });
  mat.name = 'ground-mist';
  const mistGeo = buildPuffGeometry(rng);
  mistGeo.rotateX(-Math.PI / 2);   // 同云：躺平
  const inst = new THREE.InstancedMesh(mistGeo, mat, count);
  inst.name = 'GroundMist';
  scatter(inst, radius, count, rng, (r) => 9 + r() * 10);
  inst.renderOrder = 2;
  inst.setSun = () => {};
  inst.setNight = () => {};
  inst.update = () => {};
  return inst;
}
