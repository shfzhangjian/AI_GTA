/**
 * CartoonNpc —— ComfyUI 卡通 NPC GLB 的运行时适配，产出与程序化 createHuman/createDog
 * 完全相同的模型契约 {group, parts:{pivots, opposite, tail?, mats, mixer?, clips?}}，
 * 让 AgentBuilder / PoliceSystem 里既有的步态/受击/倒地逻辑零改动地驱动真实关节。
 *
 * 资产（libs/npcs/cartoon/*.glb，Blender 生成，glTF extras.threejs_role → userData）：
 *  人形（citizen_male/female, athlete, rioter, police_officer）关节：
 *    root_motion > hips > spine > {head_joint, shoulder_L>R > elbow > hand, knee_L>R > foot}
 *  四足（dog, cat）关节：
 *    root_motion > body_joint > {head_joint, tail_joint, front/back_paw_L>R}
 *  自带 48 帧 walk_cycle（刚体节点动画，非蒙皮），这里既可用 AnimationMixer 播放，
 *  也可退回"用 pivots 做正弦摆腿"（与旧盒装人一致，速度/相位由 Agent 统一管理）。
 *
 * 归一化：以 root_motion 为可整体旋转的 group；朝向约定与旧模型一致——**面朝 +z**
 * （head/muzzle 在 +z 侧，资产 look_target/navigation_agent 锚点在 +z 佐证）。
 */
import * as THREE from 'three';

export const CARTOON_NPCS = {
  citizen_male: './libs/npcs/cartoon/cartoon_citizen_male.glb',
  citizen_female: './libs/npcs/cartoon/cartoon_citizen_female.glb',
  athlete: './libs/npcs/cartoon/cartoon_athlete.glb',
  rioter: './libs/npcs/cartoon/cartoon_rioter.glb',
  police_officer: './libs/npcs/cartoon/cartoon_police_officer.glb',
  dog: './libs/npcs/cartoon/cartoon_dog.glb',
  cat: './libs/npcs/cartoon/cartoon_cat.glb',
};

const _nv = new THREE.Vector3();

function byName(root, names) {
  for (const n of names) { const o = root.getObjectByName(n); if (o) return o; }
  return null;
}

/** 关节节点名（去掉角色前缀，资产用 <prefix>_knee_L 形式，这里按尾缀匹配更稳） */
function jointBySuffix(root, suffixes) {
  for (const suf of suffixes) {
    let found = null;
    root.traverse((o) => { if (!found && o.userData && o.userData.threejs_role === 'joint' && (o.name || '').endsWith(suf)) found = o; });
    if (found) return found;
  }
  return null;
}

/** 受击红闪材质：挑"制服/皮肤/毛皮"这类主体色，排除黑/眼/金属 */
function bodyMats(root) {
  const out = [];
  root.traverse((o) => {
    if (!o.isMesh || Array.isArray(o.material)) return;
    const m = o.material;
    const n = (m.name || '').toLowerCase();
    if (/eye|black|dark_pants|chrome|metal|gold|badge/.test(n)) return;
    if (!out.includes(m)) out.push(m);
  });
  return out.slice(0, 4);
}

function isQuadruped(root) {
  return !!jointBySuffix(root, ['front_paw_L', 'body_joint']);
}

/**
 * 由模板克隆一个可动画 NPC（朝向 +z，脚底 y≈0）。
 * @param {THREE.Object3D} template 已加载 GLB 的 .scene
 * @param {string} kind 'human' | 'dog'（决定 opposite 步态相位）
 * @returns {{group, parts:{pivots, opposite, tail?, mats, mixer, clips, walkClip}}}
 */
export function buildCartoonNpc(template, kind = 'human') {
  const root = template.clone(true);

  // 逐实例克隆材质（受击红闪互不影响），关投影用假阴影/轻量
  root.traverse((o) => { if (o.isMesh) { o.material = o.material.clone(); o.castShadow = false; } });

  const group = new THREE.Group();
  group.add(root);

  const quad = isQuadruped(root);

  // —— pivots：交给既有"rotation.x = swing·opposite[i]"驱动的真实关节 ——
  let pivots; let opposite;
  if (quad) {
    // 四足：对角步态（与旧 createDog 的 [1,-1,-1,1] 一致）
    pivots = [
      jointBySuffix(root, ['front_paw_L', 'paw_L']),
      jointBySuffix(root, ['front_paw_R', 'paw_R']),
      jointBySuffix(root, ['back_paw_L', 'back_L']),
      jointBySuffix(root, ['back_paw_R', 'back_R']),
    ].filter(Boolean);
    opposite = [1, -1, -1, 1];
  } else {
    // 人形：腿 knee + 臂 shoulder，交叉步态 [1,-1,-1,1]（左腿+右臂同相）
    pivots = [
      jointBySuffix(root, ['knee_L', 'leg_L', 'foot_L']),
      jointBySuffix(root, ['knee_R', 'leg_R', 'foot_R']),
      jointBySuffix(root, ['shoulder_L', 'arm_L']),
      jointBySuffix(root, ['shoulder_R', 'arm_R']),
    ].filter(Boolean);
    opposite = [1, -1, -1, 1];
  }

  // —— 尾巴（狗/猫）——
  let tail = null;
  if (quad) tail = byName(root, byTailNames(root));

  // —— 归一化：脚底贴地、身高 ~1.75m（人）/ ~0.55m（四足），root_motion 为旋转枢轴 ——
  root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(root);
  const size = box.getSize(_nv);
  const targetH = quad ? 0.6 : 1.78;
  const s = targetH / Math.max(size.y, 1e-3);
  root.scale.setScalar(s);
  root.updateMatrixWorld(true);
  const box2 = new THREE.Box3().setFromObject(root);
  root.position.y -= box2.min.y; // 脚底贴地
  // 资产朝向：head/look_target 在 +z（与旧契约一致），否则补 180°
  if (!facesPositiveZ(root)) root.rotation.y = Math.PI;

  const mats = bodyMats(root);

  // —— 可选：AnimationMixer 播放自带 walk_cycle（Agent 默认仍用 pivots 正弦步态，避免两套动画打架；
  //    这里仅在需要"资产原生走路"时由外部 mixer.play 使用）——
  const mixer = new THREE.AnimationMixer(root);
  const clips = template.animations || [];
  const walkClip = clips.find((c) => /walk/i.test(c.name || '')) || clips[0] || null;

  return { group, parts: { pivots, opposite, tail, mats, mixer, clips, walkClip } };
}

function byTailNames(root) {
  const names = [];
  root.traverse((o) => { if (o.userData && /tail/.test(o.userData.threejs_role || '')) names.push(o.name); });
  return names;
}

/** 判朝向：head 关节（或 muzzle）是否落在 +z 半侧 */
function facesPositiveZ(root) {
  const h = jointBySuffix(root, ['head_joint']) || byNameLoose(root, ['muzzle', 'head']);
  if (!h) return true;
  const p = h.getWorldPosition(new THREE.Vector3());
  const c = new THREE.Box3().setFromObject(root).getCenter(new THREE.Vector3());
  return p.z - c.z >= 0;
}

function byNameLoose(root, keys) {
  for (const k of keys) {
    let f = null;
    root.traverse((o) => { if (!f && (o.name || '').toLowerCase().includes(k)) f = o; });
    if (f) return f;
  }
  return null;
}

const _cache = new Map();

/** 加载单个 NPC 模板（缓存）；失败返回 null */
export function loadCartoonNpc(kind) {
  const url = CARTOON_NPCS[kind];
  if (!url) return Promise.resolve(null);
  if (_cache.has(url)) return _cache.get(url);
  const p = import('three/addons/loaders/GLTFLoader.js')
    .then(({ GLTFLoader }) => new GLTFLoader().loadAsync(url))
    .then((g) => g.scene)
    .catch(() => null);
  _cache.set(url, p);
  return p;
}

/** 批量加载全部 NPC 模板，返回 {kind: scene|null} */
export function loadAllCartoonNpcs() {
  const keys = Object.keys(CARTOON_NPCS);
  return Promise.all(keys.map((k) => loadCartoonNpc(k))).then((list) => {
    const out = {};
    keys.forEach((k, i) => { out[k] = list[i]; });
    return out;
  });
}
