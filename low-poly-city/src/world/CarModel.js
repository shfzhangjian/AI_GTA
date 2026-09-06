/**
 * CarModel —— 车辆 GLB 模板加载与"可上路"归一化（当前主力：保时捷 911，来自 3d-car-showcase）。
 *
 * 规格驱动（SPECS）自动识别车型并适配各自的脏数据：
 * - porsche911（Sketchfab 导出，Draco+clearcoat，根节点带 -90°X 的 Z-up→Y-up 旋转！）：
 *   剔除展示台背景板 Cube.001、反光地板/展台面板 Plane~Plane.004；
 *   车轮是 Cylinder.000/001 两个"轴对"节点（左右胎合并网格），按象限聚类拆成 4 个独立轮毂枢轴；
 *   材质缺 metallic/roughness 因子（glTF 默认全金属），加载时统一调校。
 * - muscle（simple-muscle-car）：剔除固定/旋转底座，"轮子"单网格四岛拆分。作为回退保留。
 *
 * 层级结构：outer（摆位/朝向 rotY 由车流控制）> head（判向后的车头朝 +x 修正）> inner（模型原始根，
 * 可能自带 -90°X 旋转）；轮毂枢轴挂在 head 下（水平系，聚类与滚动都成立）。
 * 判向用几何驱动：包围盒中心 → 车灯材质质心的水平向量 atan2，免疫任何根旋转。
 */
import * as THREE from 'three';

/* ---------------- 车型规格 ---------------- */

const SPECS = [
  {
    id: 'porsche911',
    detect: (root) => !!findMeshByMat(root, 'paint'),
    wheelNode: (o) => /^Cylinder\.\d+$/.test(o.name || ''), // 每个节点 = 一根轴（左右两轮并框）
    paintMat: 'paint',
    frontMats: ['lights'], // 前杠大灯材质（几何判向用）
    strip: ['Cube.001', 'Plane', 'Plane.001', 'Plane.002', 'Plane.003', 'Plane.004'], // 背景板/反光地板/展台面板（车牌 Plane.005/006 保留）
  },
  {
    id: 'muscle',
    detect: (root) => !!root.getObjectByName('轮子'),
    wheelNode: (o) => o.name === '轮子', // 单网格装 4 个轮胎岛
    paintMat: '车漆',
    frontMats: ['发光'],
    strip: ['固定底座', '旋转底座'],
  },
];

function findMeshByMat(root, matName) {
  let found = null;
  root.traverse((o) => { if (!found && o.isMesh && o.material && o.material.name === matName) found = o; });
  return found;
}

/**
 * 剔除展示道具（幂等）。节点若挂有子树（如肌肉车"旋转底座"之下就是车身），
 * 只摘自身几何、以空 Group 容器保留子树，直接 remove 会连坐删车。
 */
function stripProps(root, names) {
  for (const name of names) {
    const n = root.getObjectByName(name);
    if (!n || !n.parent) continue;
    if (n.children.length) {
      const holder = new THREE.Group();
      holder.position.copy(n.position);
      holder.rotation.copy(n.rotation);
      holder.scale.copy(n.scale);
      for (const ch of [...n.children]) holder.add(ch);
      n.parent.add(holder);
      n.parent.remove(n); // 不 dispose：原模板还可能被再次克隆
    } else {
      n.parent.remove(n);
    }
  }
}

/** Sketchfab 导出缺 metallic/roughness 因子（glTF 默认全金属），按材质名调校成可信观感 */
function tuneMaterials(root) {
  root.traverse((o) => {
    if (!o.isMesh || !o.material || Array.isArray(o.material)) return;
    const m = o.material;
    switch (m.name) {
      case 'paint': case 'silver':
        m.metalness = 0.9; m.roughness = 0.25; break;
      case 'coat':
        m.metalness = 0.8; m.roughness = 0.3; break;
      case 'full_black': case 'plastic': case 'rubber':
        m.metalness = 0.25; m.roughness = 0.75; break;
      case 'lights': // 前照灯常亮微光
        m.emissive = new THREE.Color(0xfff2d8); m.emissiveIntensity = 0.9; break;
      case 'tex_shiny': // 车尾 LED 灯带贴图：熄自发光，白天避免怪光圈
        m.emissive = new THREE.Color(0x000000); break;
      default: break;
    }
  });
}

/* ---------------- 轮子拆分（通用） ---------------- */

/** 浅拷贝几何属性（避免共享原始几何被后续 dispose 误伤） */
function copyGeoAttrs(geo) {
  const g = new THREE.BufferGeometry();
  for (const key of ['position', 'normal', 'uv']) {
    if (geo.attributes[key]) g.setAttribute(key, geo.attributes[key].clone());
  }
  return g;
}

/**
 * 收集 spec.wheelNode 命中节点的全部网格，三角形按质心水平象限（head 系 x/z）聚类成 4 轮，
 * 重建为 head 直属的 4 个轮毂枢轴（独立旋转、世界单位半径），原轮轴节点移除。
 */
function splitWheels(head, inner, spec) {
  const nodes = [];
  inner.traverse((o) => { if (spec.wheelNode(o)) nodes.push(o); });
  if (!nodes.length) return [];
  const meshes = [];
  for (const n of nodes) n.traverse((o) => o.isMesh && meshes.push(o));
  if (!meshes.length) return [];

  head.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(head.matrixWorld).invert(); // head 系 = 水平 upright 系
  const v = new THREE.Vector3();

  const items = meshes.map((mesh) => {
    const geo = mesh.geometry.index ? mesh.geometry.toNonIndexed() : copyGeoAttrs(mesh.geometry);
    const m4 = new THREE.Matrix4().multiplyMatrices(inv, mesh.matrixWorld); // 含 inner 的根旋转与缩放
    const p = geo.attributes.position;
    const nTri = Math.floor(p.count / 3);
    const centers = new Float32Array(nTri * 3);
    for (let t = 0; t < nTri; t++) {
      const i = t * 3;
      v.set(
        (p.getX(i) + p.getX(i + 1) + p.getX(i + 2)) / 3,
        (p.getY(i) + p.getY(i + 1) + p.getY(i + 2)) / 3,
        (p.getZ(i) + p.getZ(i + 1) + p.getZ(i + 2)) / 3,
      ).applyMatrix4(m4);
      centers[t * 3] = v.x; centers[t * 3 + 1] = v.y; centers[t * 3 + 2] = v.z;
    }
    return { geo, mat: mesh.material, centers, m4 };
  });

  // 水平象限分割中点（x=左右，z=前后；y 只用于轮心高度）
  let minX = 1e9, maxX = -1e9, minZ = 1e9, maxZ = -1e9;
  for (const it of items) {
    for (let t = 0; t < it.centers.length / 3; t++) {
      const x = it.centers[t * 3]; const z = it.centers[t * 3 + 2];
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (z < minZ) minZ = z; if (z > maxZ) maxZ = z;
    }
  }
  const mx = (minX + maxX) / 2;
  const mz = (minZ + maxZ) / 2;

  const quads = new Map(); // 象限键 -> [{item, tris[]}]
  for (const it of items) {
    for (let t = 0; t < it.centers.length / 3; t++) {
      const key = (it.centers[t * 3] >= mx ? 1 : 0) + (it.centers[t * 3 + 2] >= mz ? 2 : 0);
      let parts = quads.get(key);
      if (!parts) { parts = []; quads.set(key, parts); }
      let part = parts.find((pp) => pp.item === it);
      if (!part) { part = { item: it, tris: [] }; parts.push(part); }
      part.tris.push(t);
    }
  }

  for (const n of nodes) n.parent?.remove(n); // 只摘克隆体上的节点，不 dispose 共享几何
  const pivots = [];
  for (const parts of quads.values()) {
    let sx = 0; let sy = 0; let sz = 0; let n = 0;
    for (const p of parts) {
      for (const t of p.tris) {
        sx += p.item.centers[t * 3]; sy += p.item.centers[t * 3 + 1]; sz += p.item.centers[t * 3 + 2]; n++;
      }
    }
    const cx = sx / n; const cy = sy / n; const cz = sz / n;
    const pivot = new THREE.Group();
    pivot.position.set(cx, cy, cz); // head 系下的轮心
    let rMax = 0;
    for (const part of parts) {
      const src = part.item.geo.attributes;
      const pos = []; const nor = []; const uv = [];
      for (const t of part.tris) {
        for (let k = 0; k < 3; k++) {
          const i = t * 3 + k;
          pos.push(src.position.getX(i), src.position.getY(i), src.position.getZ(i));
          if (src.normal) nor.push(src.normal.getX(i), src.normal.getY(i), src.normal.getZ(i));
          if (src.uv) uv.push(src.uv.getX(i), src.uv.getY(i));
        }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      if (nor.length) g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); else g.computeVertexNormals();
      if (uv.length) g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
      g.applyMatrix4(part.item.m4); // mesh 局部系 -> head 系（含根旋转与缩放）
      g.translate(-cx, -cy, -cz); // 枢轴相对坐标
      const pp = g.attributes.position;
      for (let i = 0; i < pp.count; i++) {
        const d = Math.hypot(pp.getX(i), pp.getY(i), pp.getZ(i));
        if (d > rMax) rMax = d;
      }
      const sub = new THREE.Mesh(g, part.item.mat);
      pivot.add(sub);
    }
    pivot.userData.wheelRadius = Math.max(0.1, rMax * 0.92); // head 系已是世界单位（缩放烘焙进 m4）
    head.add(pivot);
    pivots.push(pivot);
  }
  items.forEach((it) => it.geo.dispose()); // 只释放中间副本，原几何归模板共享
  return pivots;
}

/* ---------------- 加载与归一化 ---------------- */

let templatePromise = null;

/**
 * 异步加载车辆模板（仅浏览器）：优先保时捷 911，失败回退肌肉车；双双失败返回 null -> 盒装车。
 * @param {string[]} urls
 */
export function loadCarTemplate(urls = ['./libs/car/porsche911.glb', './libs/car/car_draco.glb'], dracoPath = './libs/draco/') {
  if (!templatePromise) {
    templatePromise = (async () => {
      const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
      const { DRACOLoader } = await import('three/addons/loaders/DRACOLoader.js');
      const draco = new DRACOLoader();
      draco.setDecoderPath(dracoPath);
      const loader = new GLTFLoader();
      loader.setDRACOLoader(draco);
      for (const url of urls) {
        try {
          const gltf = await loader.loadAsync(url);
          const root = gltf.scene;
          const spec = SPECS.find((s) => s.detect(root));
          if (spec) stripProps(root, spec.strip);
          tuneMaterials(root); // 肌肉车无同名材质，switch 全部落空，无害
          return root;
        } catch (e) { /* 尝试下一个候选 */ }
      }
      return null;
    })();
  }
  return templatePromise;
}

/** @deprecated 兼容旧调用名 */
export const loadMuscleCarTemplate = loadCarTemplate;

const _hv1 = new THREE.Vector3();
const _hv2 = new THREE.Vector3();

/**
 * 几何驱动判向（head 层旋转角）：包围盒中心指向车灯材质质心的水平向量 θ=atan2(dz,dx)，
 * 使 head 旋转后车头端指向 +x。免疫模型任何根旋转（Sketchfab Z-up 导出常带 -90°X）。
 */
function headingRotation(inner, spec) {
  inner.updateMatrixWorld(true);
  let n = 0; let hx = 0; let hz = 0;
  inner.traverse((o) => {
    if (o.isMesh && o.material && spec.frontMats.includes(o.material.name)) {
      const p = o.getWorldPosition(_hv1);
      hx += p.x; hz += p.z; n++;
    }
  });
  if (!n) return -Math.PI / 2; // 找不到车灯的保守回退
  const c = new THREE.Box3().setFromObject(inner).getCenter(_hv2);
  const dx = hx / n - c.x;
  const dz = hz / n - c.z;
  if (Math.hypot(dx, dz) < 1e-4) return 0;
  return Math.atan2(dz, dx); // Ry(θ) 把该水平向量旋到 +x
}

/**
 * 生成一辆"可上路"的归一化车：去展示道具 / 缩放 / 车头朝 +x / 轮胎接地 / 逐实例换漆 / 拆轮。
 * @returns {THREE.Group|null} wrapper(outer)，userData = { height, wheels: Group[], wheelRadius }；空模板返回 null
 */
export function normalizeCarClone(template, targetLen = 4.5, paint = null) {
  const inner = template.clone(true);
  const spec = SPECS.find((s) => s.detect(inner)) || SPECS[SPECS.length - 1];
  stripProps(inner, spec.strip); // 幂等兜底

  let hasMesh = false;
  inner.traverse((o) => { if (o.isMesh) hasMesh = true; });
  if (!hasMesh) return null; // 空/损坏模板 -> 调用方回退程序化车身

  inner.traverse((o) => {
    if (!o.isMesh) return;
    o.material = o.material.clone(); // 实例独立材质：逐车换漆/黑化互不影响
    o.castShadow = false; // 130 万三角投影太贵，改用贴地假阴影（PropBuilder）
    if (paint && o.material.name === spec.paintMat) o.material.color.set(paint);
  });

  const outer = new THREE.Group(); // 摆位层：车流写它的 position/rotation.y
  const head = new THREE.Group(); // 判向层：车头朝 +x
  outer.add(head);
  head.add(inner);

  // ① 判向（head 层，不碰 inner —— 其可能自带根旋转）
  head.rotation.y = headingRotation(inner, spec);
  head.updateMatrixWorld(true);

  // ② 等比缩放到目标车长（旋转后 size.x 即车长）
  let box = new THREE.Box3().setFromObject(head);
  const size = box.getSize(_hv1);
  inner.scale.setScalar(targetLen / Math.max(size.x, 1e-4));
  head.updateMatrixWorld(true);

  // ③ 水平居中、轮胎接地（min.y 即胎面）；平移量换算进 head 局部系
  box = new THREE.Box3().setFromObject(head);
  const c = box.getCenter(_hv1);
  const off = _hv2.set(-c.x, -box.min.y, -c.z).applyAxisAngle(
    new THREE.Vector3(0, 1, 0), -head.rotation.y,
  );
  inner.position.copy(off);

  // ④ 拆轮（最终变换下做，枢轴挂 head 直属随车运动）
  const wheels = splitWheels(head, inner, spec);
  head.updateMatrixWorld(true);

  outer.userData.height = box.max.y - box.min.y;
  outer.userData.wheels = wheels;
  outer.userData.wheelRadius = wheels.length ? wheels[0].userData.wheelRadius : 0.33;
  return outer;
}
