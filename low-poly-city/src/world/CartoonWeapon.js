/**
 * CartoonWeapon —— ComfyUI 卡通武器 GLB 的第一人称视图模型适配。
 *
 * 资产（libs/weapons/cartoon/*.glb）由 Blender 生成，glTF extras.threejs_role → userData，
 * 关键角色节点：first_person_mount（持枪原点锚点）、muzzle / muzzle_fx_anchor（枪口）、
 * scope / scope_lens_front / scope_lens_rear（瞄具）、magazine、trigger、barrel、stock 等。
 *
 * 约定：程序化视图模型朝向 **-z（相机前方）**，持枪点在 +x 右下。本模块把 GLB 归一到同一约定：
 *   ① 以 first_person_mount 为原点（若存在）；② 枪管/ muzzle 方向旋到 -z；
 *   ③ 等比缩放到合理 FP 长度（步枪 ~0.85m，手雷 ~0.16m）。
 * 返回的 Group 直接挂到 WeaponSystem.view（相机子物体）即可，后座/瞄准/枪口特效逻辑零改动。
 */
import * as THREE from 'three';

export const CARTOON_WEAPONS = {
  smg: './libs/weapons/cartoon/cartoon_ak47.glb',
  sniper: './libs/weapons/cartoon/cartoon_sniper_rifle.glb',
  m14: './libs/weapons/cartoon/cartoon_m14.glb',
  rocket: './libs/weapons/cartoon/cartoon_rocket_launcher.glb',
  grenade: './libs/weapons/cartoon/cartoon_grenade.glb',
};

const _wv = new THREE.Vector3();

function findRole(root, re) {
  let f = null;
  root.traverse((o) => { if (!f && o.userData && re.test(o.userData.threejs_role || '')) f = o; });
  return f;
}

/**
 * 由武器模板克隆一个第一人称视图模型（朝 -z，持枪点原点，目标长度缩放）。
 * @param {THREE.Object3D} template GLB .scene
 * @param {number} targetLen 期望 FP 视觉长度（沿 z 轴）
 * @returns {THREE.Group} 归一化视图模型（含 userData.muzzleFx / scopeLens 供特效/瞄具挂点）
 */
export function buildCartoonWeapon(template, targetLen = 0.85) {
  const root = template.clone(true);
  root.traverse((o) => { if (o.isMesh) { o.material = o.material.clone(); o.castShadow = false; } });

  const outer = new THREE.Group();
  const inner = new THREE.Group();
  outer.add(inner);
  inner.add(root);

  root.updateMatrixWorld(true);

  // ① 朝向：muzzle（或 barrel/charging_handle）相对 first_person_mount 指向 -z
  const mount = findRole(root, /first_person_mount/);
  const front = findRole(root, /^muzzle$/) || findRole(root, /^barrel$/) || findRole(root, /charging_handle/);
  if (mount && front) {
    const m = mount.getWorldPosition(new THREE.Vector3());
    const f = front.getWorldPosition(new THREE.Vector3());
    const dx = f.x - m.x; const dz = f.z - m.z;
    if (Math.hypot(dx, dz) > 1e-3) inner.rotation.y = Math.PI - Math.atan2(dx, dz); // 把枪管方向 (dx,dz) 旋到 -z（Object3D.rotation.y 约定）
  } else {
    // 无锚点：按长轴近似——较长轴视为枪身，转到沿 z
    const b = new THREE.Box3().setFromObject(root).getSize(_wv);
    inner.rotation.y = b.x >= b.z ? Math.PI / 2 : 0;
  }
  inner.updateMatrixWorld(true);

  // ② 缩放：inner 系里沿 z 的长度归一到 targetLen
  let box = new THREE.Box3().setFromObject(inner);
  const size = box.getSize(_wv);
  const len = Math.max(size.x, size.z, 1e-3);
  root.scale.multiplyScalar(targetLen / len);
  inner.updateMatrixWorld(true);

  // ③ 对齐 first_person_mount 到 outer 原点（右手持枪点）
  box = new THREE.Box3().setFromObject(inner);
  if (mount) {
    const m = mount.getWorldPosition(new THREE.Vector3());
    inner.position.sub(m); // 持枪点归零
  } else {
    const c = box.getCenter(_wv);
    inner.position.set(-c.x, -box.min.y - size.y * 0.15, -c.z); // 无锚点：底部略沉，居中
  }
  inner.updateMatrixWorld(true);

  // ④ 记录特效/瞄具挂点（outer 局部）：枪口火光、瞄具后镜片
  const muzzleFx = findRole(root, /muzzle_fx_anchor|^muzzle$/) || front;
  const scopeLens = findRole(root, /scope_lens_rear/) || findRole(root, /scope_lens/) || findRole(root, /^scope$/);
  outer.userData.muzzleFx = muzzleFx ? outer.worldToLocal(muzzleFx.getWorldPosition(new THREE.Vector3())) : null;
  outer.userData.scopeLens = scopeLens ? outer.worldToLocal(scopeLens.getWorldPosition(new THREE.Vector3())) : null;
  outer.userData.cartoonWeapon = true;
  return outer;
}

const _cache = new Map();

export function loadCartoonWeapon(kind) {
  const url = CARTOON_WEAPONS[kind];
  if (!url) return Promise.resolve(null);
  if (_cache.has(url)) return _cache.get(url);
  const p = import('three/addons/loaders/GLTFLoader.js')
    .then(({ GLTFLoader }) => new GLTFLoader().loadAsync(url))
    .then((g) => g.scene)
    .catch(() => null);
  _cache.set(url, p);
  return p;
}

export function loadAllCartoonWeapons() {
  const keys = Object.keys(CARTOON_WEAPONS);
  return Promise.all(keys.map((k) => loadCartoonWeapon(k))).then((list) => {
    const out = {};
    keys.forEach((k, i) => { out[k] = list[i]; });
    return out;
  });
}
