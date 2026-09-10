/**
 * CartoonCar —— ComfyUI 卡通车辆 GLB 的加载与"可上路"归一化。
 *
 * 资产：libs/car/cartoon/*.glb（cartoon_small_car / cartoon_truck / cartoon_police_car），
 * 由 Blender 脚本生成、glTF extras 打了 threejs_role 标记（→ three.js userData）：
 *   wheel（带 spin_axis / detachable）、wheel_hub、siren(_blue/_red)、headlight、taillight、
 *   window、body、shadow_proxy（运行时假阴影，加载时剔除，本项目用自带 Canvas 假阴影）。
 *
 * 归一化产物与旧 normalizeCarClone 接口一致：outer 根，userData = { height, wheels, wheelRadius }，
 * 车头朝 wrapper 局部 +x（车流写 outer.rotation.y），轮子为 4 个独立枢轴挂在 head 层（水平系，滚动精确）。
 * 与写实档（CarModel.js）区别：轮子已按角色命名，无需几何象限聚类，直接按 spin_axis 取轴。
 */
import * as THREE from 'three';
import { rollWheel } from './CarModel.js';

export const CARTOON_VEHICLES = {
  small: './libs/car/cartoon/cartoon_small_car.glb',
  truck: './libs/car/cartoon/cartoon_truck.glb',
  police: './libs/car/cartoon/cartoon_police_car.glb',
};

const _cv1 = new THREE.Vector3();
const _cv2 = new THREE.Vector3();
const _cvq = new THREE.Quaternion();
const _CVX = new THREE.Vector3(1, 0, 0);

/** 材质调校：资产缺 metallic/roughness 因子（glTF 默认全金属），按材质名收敛到卡通观感 */
function tuneCartoon(root) {
  root.traverse((o) => {
    if (!o.isMesh || !o.material || Array.isArray(o.material)) return;
    const m = o.material;
    const n = m.name || '';
    if (/glass/.test(n)) { m.metalness = 0; m.roughness = 0.25; if (m.transparent) m.depthWrite = false; }
    else if (/chrome|rim|silver/.test(n)) { m.metalness = 0.85; m.roughness = 0.3; }
    else if (/rubber|black|tire|dark/.test(n)) { m.metalness = 0.1; m.roughness = 0.85; }
    else if (/emissive|siren|light|flash/.test(n)) { m.metalness = 0; m.roughness = 0.4; }
    else { m.metalness = 0.15; m.roughness = 0.6; } // 卡通漆面：低金属、中粗糙
  });
}

/** 收集角色节点（userData.threejs_role 匹配） */
function roleNodes(root, re) {
  const out = [];
  root.traverse((o) => { if (o.userData && re.test(o.userData.threejs_role || '')) out.push(o); });
  return out;
}

/**
 * 生成一辆可上路的卡通车：剔假阴影 / 缩放 / 车头朝 +x / 轮按 spin_axis 成枢轴 / 逐实例换漆。
 * @param {THREE.Object3D} template 原始 GLB 场景（加载一次共享）
 * @param {number} targetLen 目标车长（米，沿 +x）
 * @param {string|null} paint 车漆材质名替换色（仅 paint/body 主漆面）
 * @returns {THREE.Group|null} outer，userData={height,wheels,wheelRadius,sirens,wheelsByRole}
 */
export function normalizeCartoonCar(template, targetLen = 4.7, paint = null) {
  const inner = template.clone(true);

  // ① 剔除运行时假阴影（本项目自带贴地椭圆阴影）
  for (const n of roleNodes(inner, /shadow_proxy/)) {
    if (n.children.length) {
      const h = new THREE.Group();
      h.position.copy(n.position); h.rotation.copy(n.rotation); h.scale.copy(n.scale);
      for (const c of [...n.children]) h.add(c);
      n.parent.add(h); n.parent.remove(n);
    } else n.parent?.remove(n);
  }

  let hasMesh = false;
  inner.traverse((o) => { if (o.isMesh) hasMesh = true; });
  if (!hasMesh) return null;

  // ② 逐实例克隆材质（换漆/爆闪互不影响）；可选换主漆
  inner.traverse((o) => {
    if (!o.isMesh || Array.isArray(o.material)) return;
    o.material = o.material.clone();
    o.castShadow = false;
    if (paint) {
      const role = o.userData?.threejs_role || '';
      const mn = o.material.name || '';
      if ((role === 'body' || role === 'paint_accent') && !/dark|trim|black|glass|chrome|rubber/.test(mn)) o.material.color.set(paint);
    }
  });

  const outer = new THREE.Group();
  const head = new THREE.Group(); // 判向 + 轮枢轴挂这层（水平系）
  outer.add(head);
  head.add(inner);

  // ③ 判向：headlight 角色节点 → 车头 +x；无则按 body 长轴兜底
  const lights = roleNodes(inner, /headlight/);
  let theta = 0;
  if (lights.length) {
    let hx = 0; let hz = 0; let n = 0;
    for (const l of lights) { const p = l.getWorldPosition(_cv1); hx += p.x; hz += p.z; n++; }
    const c = new THREE.Box3().setFromObject(inner).getCenter(_cv2);
    const dx = hx / n - c.x; const dz = hz / n - c.z;
    if (Math.hypot(dx, dz) > 1e-4) theta = Math.atan2(dz, dx); // Ry(θ) 把车头向量旋到 +x
  } else {
    const b = new THREE.Box3().setFromObject(inner).getSize(_cv1);
    theta = b.z >= b.x ? Math.PI / 2 : 0;
  }
  head.rotation.y = theta;
  head.updateMatrixWorld(true);

  // ④ 等比缩放到目标车长（旋转后 size.x = 车长）
  let box = new THREE.Box3().setFromObject(head);
  const size = box.getSize(_cv1);
  inner.scale.setScalar(targetLen / Math.max(size.x, 1e-4));
  head.updateMatrixWorld(true);

  // ⑤ 居中 + 贴地：把包围盒中心移到原点、最低点抬到 y=0（head 局部系）
  box = new THREE.Box3().setFromObject(head);
  const c = box.getCenter(_cv1);
  const off = _cv2.set(-c.x, -box.min.y, -c.z).applyAxisAngle(new THREE.Vector3(0, 1, 0), -theta);
  inner.position.copy(off);
  head.updateMatrixWorld(true);

  // ⑥ 轮子：wheel 角色节点本身即旋转枢轴（资产已按 spin_axis 摆好），就地滚动，无需重挂。
  // 半径取该节点几何在世界系的最大径向距离；世界自转轴每帧由 rollCartoonWheel 现算（缩放不改轴向）。
  const wheelNodes = roleNodes(inner, /^wheel$/);
  const wheels = [];
  let rSum = 0; let rN = 0;
  for (const w of wheelNodes) {
    w.updateWorldMatrix(true, false); // 含 inner 的缩放与平移
    const center = w.getWorldPosition(new THREE.Vector3());
    let r = 0;
    if (w.isMesh) {
      const p = w.geometry.attributes.position; const m = w.matrixWorld;
      for (let i = 0; i < p.count; i++) {
        _cv1.fromBufferAttribute(p, i).applyMatrix4(m).sub(center);
        const d = Math.hypot(_cv1.x, _cv1.y, _cv1.z);
        if (d > r) r = d;
      }
    }
    r = Math.max(0.15, r * 0.95);
    rSum += r; rN++;
    const spin = (w.userData?.spin_axis || 'X').toUpperCase();
    w.userData.spinAxis = spin === 'Y' ? new THREE.Vector3(0, 1, 0)
      : spin === 'Z' ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(1, 0, 0);
    w.userData.wheelRadius = r;
    wheels.push(w);
  }

  // ⑦ 警灯（siren 角色）：按红/蓝（节点名或材质名）分色，供 PoliceSystem 爆闪脉冲
  const sirens = { red: null, blue: null };
  for (const s of roleNodes(inner, /^siren(_|$)/)) {
    if (!s.isMesh) continue;
    const key = /red/.test((s.name || '') + (s.material?.name || '')) ? 'red'
      : /blue/.test((s.name || '') + (s.material?.name || '')) ? 'blue' : null;
    if (key && !sirens[key]) sirens[key] = s.material;
  }

  outer.userData.height = box.max.y - box.min.y;
  outer.userData.wheels = wheels;
  outer.userData.wheelRadius = rN ? rSum / rN : 0.42;
  outer.userData.sirens = (sirens.red || sirens.blue) ? sirens : null;
  return outer;
}

let carPromise = null;

/** 加载 3 款卡通车模板（small/truck/police），任一失败返回 null */
export function loadCartoonCar(kind = 'small') {
  const url = CARTOON_VEHICLES[kind] || CARTOON_VEHICLES.small;
  const key = 'cartoon_' + kind;
  if (!carPromise) carPromise = (async () => {
    const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
    const loader = new GLTFLoader();
    const load = (u) => loader.loadAsync(u).then((g) => { tuneCartoon(g.scene); return g.scene; }).catch(() => null);
    const [small, truck, police] = await Promise.all([
      load(CARTOON_VEHICLES.small), load(CARTOON_VEHICLES.truck), load(CARTOON_VEHICLES.police),
    ]);
    return { small, truck, police };
  })();
  void key;
  return carPromise.then((m) => m);
}

const _cvs = new THREE.Vector3();

/**
 * 单辆卡通车轮滚动。worldAxis = normalize(up × v_c)（前进的无滑移世界角速度方向，已带符号）。
 * 资产轮的 spin_axis 在其局部系（本资产为 X）；用纯旋转的世界四元数变换成实际世界自转轴 A（缩放不入四元数）。
 * 正确摆轴的轮 A 与 worldAxis 平行：signed = angle·sign(A·worldAxis) 定号；若两轴垂直（摆错）则自动不滚，安全。
 */
export function rollCartoonWheel(pivot, worldAxis, angle) {
  pivot.getWorldQuaternion(_cvq);
  _cvs.copy(pivot.userData.spinAxis || _CVX).applyQuaternion(_cvq).normalize();
  const d = _cvs.dot(worldAxis);
  const s = Math.abs(d) < 0.2 ? 0 : Math.sign(d); // 垂直=轴不对，不滚（避免乱转）
  if (s !== 0) rollWheel(pivot, _cvs, angle * s);
}
