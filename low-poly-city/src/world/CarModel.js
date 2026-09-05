/**
 * CarModel —— 集成 simple-muscle-car（MIT, ASouthernCat）的 Blender 肌肉车模型，按本项目需求改造：
 *
 * - 剔除 Blender 展示用"固定底座/旋转底座"（材质"底座"），否则包围盒被圆盘撑歪导致车辆悬空；
 * - 以真实几何归一化：目标车长、轮胎接地（min.y 即胎面）、车头朝 +x
 *   （模型车头在 -z：车灯"发光"/前牌所在侧）；
 * - "轮子"是单个含 4 岛的多材质网格 —— 按象限聚类拆成 4 个独立轮毂枢轴（userData.wheels），
 *   供车流逐帧 rotateOnWorldAxis 实现真实滚动。
 * 加载失败返回 null，车流自动回退程序化盒装车。
 */
import * as THREE from 'three';

let templatePromise = null;

/** 异步加载肌肉车模板（仅浏览器；node 测试不触发） */
export function loadMuscleCarTemplate(url = './libs/car/car_draco.glb', dracoPath = './libs/draco/') {
  if (!templatePromise) {
    templatePromise = (async () => {
      const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
      const { DRACOLoader } = await import('three/addons/loaders/DRACOLoader.js');
      const draco = new DRACOLoader();
      draco.setDecoderPath(dracoPath);
      const loader = new GLTFLoader();
      loader.setDRACOLoader(draco);
      const gltf = await loader.loadAsync(url);
      const root = gltf.scene;
      stripBases(root);
      root.traverse((o) => { if (o.isMesh) o.castShadow = true; });
      return root;
    })().catch(() => null);
  }
  return templatePromise;
}

/**
 * 剔除展示转盘（幂等，加载与每次克隆都会执行）。
 * 注意：GLB 里"旋转底座"是网格节点且车身挂在它下面 —— 只丢弃自身几何、
 * 用空 Group 容器保留子树，直接 remove 会连车带轮全部消失。
 */
function stripBases(root) {
  for (const name of ['固定底座', '旋转底座']) {
    const n = root.getObjectByName(name);
    if (!n || !n.parent) continue;
    if (n.children.length) {
      const holder = new THREE.Group();
      holder.position.copy(n.position);
      holder.rotation.copy(n.rotation);
      holder.scale.copy(n.scale);
      for (const ch of [...n.children]) holder.add(ch);
      n.parent.add(holder);
      n.parent.remove(n); // 不 dispose 几何：原模板还可能被再次克隆
    } else {
      n.parent.remove(n);
    }
  }
}

/** 浅拷贝几何属性（避免共享原始几何被后续 dispose 误伤） */
function copyGeoAttrs(geo) {
  const g = new THREE.BufferGeometry();
  for (const key of ['position', 'normal', 'uv']) {
    if (geo.attributes[key]) g.setAttribute(key, geo.attributes[key].clone());
  }
  return g;
}

/**
 * 把"轮子"节点（单网格多岛或多子网格）拆成 4 个可独立旋转的轮毂枢轴。
 * 三角形按质心象限聚类；重建几何为枢轴相对坐标，半径由最远顶点量得。
 */
function splitWheels(root) {
  const wheelNode = root.getObjectByName('轮子');
  if (!wheelNode) return [];
  const meshes = [];
  wheelNode.traverse((o) => o.isMesh && meshes.push(o));
  if (meshes.length < 4 && meshes.length === 1 && meshes[0].geometry.attributes.position.count < 12) return [];

  wheelNode.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(wheelNode.matrixWorld).invert();
  const v = new THREE.Vector3();

  // 每个源网格：非索引副本 + 三角形质心（轮子节点局部系）+ 变换矩阵
  const items = meshes.map((mesh) => {
    const geo = mesh.geometry.index ? mesh.geometry.toNonIndexed() : copyGeoAttrs(mesh.geometry);
    const m4 = new THREE.Matrix4().multiplyMatrices(inv, mesh.matrixWorld);
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

  // 全体质心包围 -> 象限分割中点
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

  // 象限 -> [{item, tris[]}]
  const quads = new Map();
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

  // 重建为枢轴组（只摘除克隆体上的子节点，不 dispose 共享几何）
  wheelNode.clear();
  const pivots = [];
  for (const parts of quads.values()) {
    let sx = 0; let sz = 0; let n = 0;
    for (const p of parts) {
      for (const t of p.tris) { sx += p.item.centers[t * 3]; sz += p.item.centers[t * 3 + 2]; n++; }
    }
    const cx = sx / n; const cz = sz / n;
    const pivot = new THREE.Group();
    pivot.position.set(cx, 0, cz);
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
      g.applyMatrix4(part.item.m4); // mesh 局部系 -> 轮子节点系
      g.translate(-cx, -pivot.position.y, -cz); // 枢轴相对坐标
      const pp = g.attributes.position;
      for (let i = 0; i < pp.count; i++) {
        const d = Math.hypot(pp.getX(i), pp.getY(i), pp.getZ(i));
        if (d > rMax) rMax = d;
      }
      const sub = new THREE.Mesh(g, part.item.mat);
      sub.castShadow = true;
      pivot.add(sub);
    }
    pivot.userData.wheelRadius = Math.max(0.2, rMax * 0.95);
    wheelNode.add(pivot);
    pivots.push(pivot);
  }
  items.forEach((it) => it.geo.dispose()); // 只释放中间副本，原几何仍归模板共享
  return pivots;
}

/**
 * 生成一辆"可上路"的归一化车：去底座 / 缩放 / 车头朝 +x / 轮胎接地 / 逐实例材质换漆 / 拆轮。
 * @returns {THREE.Group} wrapper，userData = { height, wheels: Group[], wheelRadius }
 */
export function normalizeCarClone(template, targetLen = 4.3, paint = null) {
  const inner = template.clone(true);
  stripBases(inner); // 幂等兜底：模板处理与否都安全

  let hasMesh = false;
  inner.traverse((o) => { if (o.isMesh) hasMesh = true; });
  if (!hasMesh) return null; // 空/损坏模板 -> 调用方回退程序化车身

  inner.traverse((o) => {
    if (!o.isMesh) return;
    o.material = o.material.clone(); // 实例独立材质：逐车换漆/黑化互不影响
    o.castShadow = true;
    if (paint && o.material.name === '车漆') o.material.color.set(paint);
  });

  const outer = new THREE.Group();
  outer.add(inner);

  // ① 判向：模型车头在 -z（车灯/前牌侧）；绕 Y 转 -90° 使局部 -z 指向 wrapper +x
  inner.rotation.y = -Math.PI / 2;
  inner.updateMatrixWorld(true);

  // ② 等比缩放到目标车长（底座已剔除，size.x 即车长）
  let box = new THREE.Box3().setFromObject(inner);
  const size = box.getSize(new THREE.Vector3());
  inner.scale.setScalar(targetLen / Math.max(size.x, 1e-4));
  inner.updateMatrixWorld(true);

  // ③ 水平居中、轮胎接地
  box = new THREE.Box3().setFromObject(inner);
  const c = box.getCenter(new THREE.Vector3());
  inner.position.set(-c.x, -box.min.y, -c.z);

  // ④ 拆轮（在最终变换下做，枢轴随车整体运动）
  const wheels = splitWheels(inner);
  inner.updateMatrixWorld(true);

  outer.userData.height = box.max.y - box.min.y;
  outer.userData.wheels = wheels;
  outer.userData.wheelRadius = wheels.length ? wheels[0].userData.wheelRadius : 0.33;
  return outer;
}
