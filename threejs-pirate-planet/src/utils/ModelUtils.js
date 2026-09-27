/**
 * ModelUtils.js — 模型修正的唯一来源（§39）
 *
 * 职责：缩放、底面对齐、朝向轴声明、材质归一化、部件提取、克隆、阴影设置、命名分类。
 * 铁律：ShipManager / PortManager / BuildingManager 中不得再出现任何硬编码的
 *       scale / position offset / rotation 修正值 —— 一律来自本文件的 MODEL_SPECS。
 *
 * 所有规格数据来自实测：见 docs/asset-audit.md §5 与 src/assets/manifest.json。
 */
import * as THREE from 'three';
import { clone as cloneSkeleton } from 'three/addons/utils/SkeletonUtils.js';
import { manifest, miniManifest, petsManifest } from '../config.js';

/** 共享图集（实测：72 个 GLB 共用同一张 512×512 colormap.png） */
export const ATLAS_URL = 'assets/pirate-kit/Textures/colormap.png';
/** mini-characters 独立图集（实测：26 个 GLB 共用另一张 colormap.png，勿与 pirate 图集混用） */
export const MINI_ATLAS_URL = miniManifest.atlas;
/** cube-pets 独立图集（实测：24 个 GLB 又一张 colormap.png） */
export const PETS_ATLAS_URL = petsManifest.atlas;

/** 全部资产清单（查找顺序 = 声明顺序；每个资产包一张独立图集） */
export const ALL_MANIFESTS = [
  { key: 'pirate', manifest, atlas: ATLAS_URL },
  { key: 'mini', manifest: miniManifest, atlas: MINI_ATLAS_URL },
  { key: 'pets', manifest: petsManifest, atlas: PETS_ATLAS_URL },
];


/**
 * 实测模型规格表。
 *   up      模型局部 UP 轴（实测全部为 +Y）
 *   forward 模型局部 FORWARD 轴（船只为 +Z＝船头，其余 +Z 或无意义）
 *   unit    模型单位 / 世界单位换算（球半径 100，船原始 13.1 单位过长 → 缩放）
 *   baseY   底面偏移（实测；非 0 需抬升到地面）
 *   doubleSided 实测材质均为 true，保持不剔除背面
 *
 * 缺失项走 DEFAULT_SPEC（安全值：+Y up / +Z forward / 已地面对齐）。
 */
export const DEFAULT_SPEC = {
  up: 'y',
  forward: 'z',
  unit: 1,
  baseY: 0,
  doubleSided: true,
};

export const MODEL_SPECS = {
  // ── 船只：实测 baseY=0（原点在船底），forward=+Z（D 轴最长）──
  'ship-pirate-large':  { up: 'y', forward: 'z', unit: 1.9, baseY: 0 },
  'ship-pirate-medium': { up: 'y', forward: 'z', unit: 1.72, baseY: 0 },
  'ship-pirate-small':  { up: 'y', forward: 'z', unit: 1.56, baseY: 0 },
  'ship-large':         { up: 'y', forward: 'z', unit: 1.9, baseY: 0 },
  'ship-medium':        { up: 'y', forward: 'z', unit: 1.72, baseY: 0 },
  'ship-small':         { up: 'y', forward: 'z', unit: 1.56, baseY: 0 },
  'ship-ghost':         { up: 'y', forward: 'z', unit: 1.72, baseY: 0 },
  // 实测 baseY = -0.785 → 必须抬升
  'ship-wreck':         { up: 'y', forward: 'z', unit: 0.42, baseY: -0.785 },
  'boat-row-large':     { up: 'y', forward: 'z', unit: 1.2, baseY: 0 },
  'boat-row-small':     { up: 'y', forward: 'z', unit: 1.2, baseY: 0 },

  // ── 建筑：实测 baseY=0，UP=+Y ──
  'tower-complete-large':  { up: 'y', forward: 'z', unit: 2.3, baseY: 0 },
  'tower-complete-small':  { up: 'y', forward: 'z', unit: 2.1, baseY: 0 },
  'tower-watch':           { up: 'y', forward: 'z', unit: 1.9, baseY: 0 },
  'tower-top':             { up: 'y', forward: 'z', unit: 2.0, baseY: 0 },
  'tower-roof':            { up: 'y', forward: 'z', unit: 2.0, baseY: 0 },
  'tower-base':            { up: 'y', forward: 'z', unit: 2.0, baseY: 0 },
  'tower-base-door':       { up: 'y', forward: 'z', unit: 2.0, baseY: 0 },
  'tower-middle':          { up: 'y', forward: 'z', unit: 2.0, baseY: 0 },
  'tower-middle-windows':  { up: 'y', forward: 'z', unit: 2.0, baseY: 0 },
  'castle-gate':           { up: 'y', forward: 'z', unit: 2.2, baseY: 0 },
  'castle-wall':           { up: 'y', forward: 'z', unit: 2.2, baseY: 0 },
  'castle-window':         { up: 'y', forward: 'z', unit: 2.2, baseY: 0 },
  'castle-door':           { up: 'y', forward: 'z', unit: 2.2, baseY: 0 },
  'structure':             { up: 'y', forward: 'z', unit: 2.4, baseY: 0 },
  'structure-roof':        { up: 'y', forward: 'z', unit: 2.4, baseY: 0 },

  // ── 码头 / 平台 ──
  'structure-platform-dock':       { up: 'y', forward: 'z', unit: 2.6, baseY: 0 },
  'structure-platform-dock-small': { up: 'y', forward: 'z', unit: 2.4, baseY: 0 },
  'structure-platform':            { up: 'y', forward: 'z', unit: 2.4, baseY: 0 },
  'structure-platform-small':      { up: 'y', forward: 'z', unit: 2.2, baseY: 0 },
  'platform':                      { up: 'y', forward: 'z', unit: 2.4, baseY: 0 },
  'platform-planks':               { up: 'y', forward: 'z', unit: 2.6, baseY: 0 },
  'structure-fence':               { up: 'y', forward: 'z', unit: 1.8, baseY: 0 },
  'structure-fence-sides':         { up: 'y', forward: 'z', unit: 1.8, baseY: 0 },

  // ── 自然物 ──
  'palm-straight':          { up: 'y', forward: 'z', unit: 2.7, baseY: 0 },
  'palm-bend':              { up: 'y', forward: 'z', unit: 2.7, baseY: 0 },
  'palm-detailed-straight': { up: 'y', forward: 'z', unit: 2.7, baseY: 0 },
  'palm-detailed-bend':     { up: 'y', forward: 'z', unit: 2.7, baseY: 0 },
  'rocks-a':                { up: 'y', forward: 'z', unit: 1.15, baseY: 0 },
  'rocks-b':                { up: 'y', forward: 'z', unit: 1.15, baseY: 0 },
  'rocks-c':                { up: 'y', forward: 'z', unit: 1.1, baseY: 0 },
  'rocks-sand-a':           { up: 'y', forward: 'z', unit: 1.05, baseY: 0 },
  'rocks-sand-b':           { up: 'y', forward: 'z', unit: 1.05, baseY: 0 },
  'rocks-sand-c':           { up: 'y', forward: 'z', unit: 1.0, baseY: 0 },
  'patch-sand':             { up: 'y', forward: 'z', unit: 1.6, baseY: 0 },
  'patch-sand-foliage':     { up: 'y', forward: 'z', unit: 1.6, baseY: 0 },
  'patch-grass':            { up: 'y', forward: 'z', unit: 1.6, baseY: 0 },
  'patch-grass-foliage':    { up: 'y', forward: 'z', unit: 1.6, baseY: 0 },
  'grass-patch':            { up: 'y', forward: 'z', unit: 0.75, baseY: 0 },
  'grass-plant':            { up: 'y', forward: 'z', unit: 0.75, baseY: 0 },
  'grass':                  { up: 'y', forward: 'z', unit: 0.7, baseY: 0 },
  'hole':                   { up: 'y', forward: 'z', unit: 0.90, baseY: 0 },

  // ── 道具 ──
  'barrel':        { up: 'y', forward: 'z', unit: 1.0, baseY: 0 },
  'crate':         { up: 'y', forward: 'z', unit: 1.0, baseY: 0 },
  'crate-bottles': { up: 'y', forward: 'z', unit: 1.0, baseY: 0 },
  'chest':         { up: 'y', forward: 'z', unit: 1.0, baseY: 0 },
  'bottle':        { up: 'y', forward: 'z', unit: 0.9, baseY: 0 },
  'bottle-large':  { up: 'y', forward: 'z', unit: 0.9, baseY: 0 },
  'cannon':        { up: 'y', forward: 'z', unit: 1.3, baseY: 0 },
  'cannon-mobile': { up: 'y', forward: 'z', unit: 1.3, baseY: 0 },
  // 实测 baseY = -0.335 → 必须抬升
  'cannon-ball':   { up: 'y', forward: 'z', unit: 0.9, baseY: -0.335 },
  'tool-paddle':   { up: 'y', forward: 'z', unit: 1.2, baseY: 0 },
  'tool-shovel':   { up: 'y', forward: 'z', unit: 1.2, baseY: 0 },
  'flag-pirate-high':         { up: 'y', forward: 'z', unit: 1.9, baseY: 0 },
  'flag-pirate-high-pennant': { up: 'y', forward: 'z', unit: 1.9, baseY: 0 },
  'flag-pirate':              { up: 'y', forward: 'z', unit: 1.6, baseY: 0 },
  'flag-pirate-pennant':      { up: 'y', forward: 'z', unit: 1.6, baseY: 0 },
  'flag-high':                { up: 'y', forward: 'z', unit: 1.9, baseY: 0 },
  'flag-high-pennant':        { up: 'y', forward: 'z', unit: 1.9, baseY: 0 },
  'flag':                     { up: 'y', forward: 'z', unit: 1.6, baseY: 0 },
  'flag-pennant':             { up: 'y', forward: 'z', unit: 1.6, baseY: 0 },
  // 实测 baseY = -0.024
  'mast':       { up: 'y', forward: 'z', unit: 2.2, baseY: -0.024 },
  'mast-ropes': { up: 'y', forward: 'z', unit: 2.2, baseY: -0.024 },
};

// ── mini-characters（kenney_mini-characters，独立图集，实测清单）──────
// 实测：角色高 ≈0.67~0.78 单位、底面对齐（baseY=0）、带骨骼动画（walk/sprint/idle…）。
// unit = 模型单位 / 世界单位。选 3.3 → 人物高 ≈2.2~2.6 世界单位（RTS 镜头高度
// 下不被港口 / 树 / 地形视觉吞掉），对比棕榈（≈7 单位）约 1:3 —— 微缩星球小人比例。
export const MINI_CHARACTER_SPECS = {
  'character-male-a':     { up: 'y', forward: 'z', unit: 3.3, baseY: 0 },
  'character-male-b':     { up: 'y', forward: 'z', unit: 3.3, baseY: 0 },
  'character-male-c':     { up: 'y', forward: 'z', unit: 3.3, baseY: 0 },
  'character-male-d':     { up: 'y', forward: 'z', unit: 3.3, baseY: 0 },
  'character-male-e':     { up: 'y', forward: 'z', unit: 3.3, baseY: 0 },
  'character-male-f':     { up: 'y', forward: 'z', unit: 3.3, baseY: 0 },
  'character-female-a':   { up: 'y', forward: 'z', unit: 3.3, baseY: 0 },
  'character-female-b':   { up: 'y', forward: 'z', unit: 3.3, baseY: 0 },
  'character-female-c':   { up: 'y', forward: 'z', unit: 3.3, baseY: 0 },
  'character-female-d':   { up: 'y', forward: 'z', unit: 3.3, baseY: 0 },
  'character-female-e':   { up: 'y', forward: 'z', unit: 3.3, baseY: 0 },
  'character-female-f':   { up: 'y', forward: 'z', unit: 3.3, baseY: 0 },
  // 轮椅：坐姿，略矮
  'wheelchair':                 { up: 'y', forward: 'z', unit: 2.4, baseY: 0 },
  'wheelchair-deluxe':          { up: 'y', forward: 'z', unit: 2.4, baseY: 0 },
  'wheelchair-power':           { up: 'y', forward: 'z', unit: 2.4, baseY: 0 },
  'wheelchair-power-deluxe':    { up: 'y', forward: 'z', unit: 2.4, baseY: 0 },
};

// ── cube-pets（kenney_cube-pets_1.0，独立图集，实测清单）──────────
// 实测：cube 宠物高 ≈1.4~2.0 单位、底面对齐（baseY≈0，fish 例外 -0.104 由 DEFAULT_SPEC 兜底）、
// 骨骼动画 idle/walk/run/…（walk root 仅 +0.099 原地起伏，同 mini 角色）。
// 动物整体比小人小一号：unit 0.9~1.2 → 高 ≈1.3~2.2 世界单位（小 ≈2.2~2.6）。
export const PET_SPECS = {
  'animal-beaver':      { up: 'y', forward: 'z', unit: 0.9, baseY: 0 },
  'animal-bee':         { up: 'y', forward: 'z', unit: 0.9, baseY: 0 },
  'animal-bunny':       { up: 'y', forward: 'z', unit: 0.9, baseY: 0 },
  'animal-cat':         { up: 'y', forward: 'z', unit: 1.0, baseY: 0 },
  'animal-caterpillar': { up: 'y', forward: 'z', unit: 0.8, baseY: 0 },
  'animal-chick':       { up: 'y', forward: 'z', unit: 0.85, baseY: 0 },
  'animal-cow':         { up: 'y', forward: 'z', unit: 1.05, baseY: 0 },
  'animal-crab':        { up: 'y', forward: 'z', unit: 1.0, baseY: 0 },
  'animal-deer':        { up: 'y', forward: 'z', unit: 1.05, baseY: 0 },
  'animal-dog':         { up: 'y', forward: 'z', unit: 1.0, baseY: 0 },
  'animal-elephant':    { up: 'y', forward: 'z', unit: 1.2, baseY: 0 },
  'animal-fish':        { up: 'y', forward: 'z', unit: 1.0, baseY: -0.104 },
  'animal-fox':         { up: 'y', forward: 'z', unit: 0.95, baseY: 0 },
  'animal-giraffe':     { up: 'y', forward: 'z', unit: 1.15, baseY: 0 },
  'animal-hog':         { up: 'y', forward: 'z', unit: 1.0, baseY: 0 },
  'animal-koala':       { up: 'y', forward: 'z', unit: 0.9, baseY: 0 },
  'animal-lion':        { up: 'y', forward: 'z', unit: 1.15, baseY: 0 },
  'animal-monkey':      { up: 'y', forward: 'z', unit: 0.95, baseY: 0 },
  'animal-panda':       { up: 'y', forward: 'z', unit: 1.0, baseY: 0 },
  'animal-parrot':      { up: 'y', forward: 'z', unit: 0.95, baseY: 0 },
  'animal-penguin':     { up: 'y', forward: 'z', unit: 0.95, baseY: 0 },
  'animal-pig':         { up: 'y', forward: 'z', unit: 1.0, baseY: 0 },
  'animal-polar':       { up: 'y', forward: 'z', unit: 1.15, baseY: 0 },
  'animal-tiger':       { up: 'y', forward: 'z', unit: 1.15, baseY: 0 },
};

/** 动物规格表；未登记走 DEFAULT_SPEC + 告警 */
export function getPetSpec(name) {
  const spec = PET_SPECS[name];
  if (!spec) {
    console.warn('[ModelUtils] 未登记的 cube-pet，使用 DEFAULT_SPEC：', name);
    return { ...DEFAULT_SPEC };
  }
  return { ...DEFAULT_SPEC, ...spec };
}

/** cube-pets 专属存在性校验 */
export function assertKnownPetModel(name) {
  if (!petsManifest.models[name]) {
    throw new Error(
      `[ModelUtils] cube-pets 清单中不存在 "${name}"。` +
      `（可用 ${Object.keys(petsManifest.models).length} 个，见 src/assets/manifest-cube-pets.json）`,
    );
  }
  return petsManifest.models[name];
}

/** mini 规格表；未登记的角色走 DEFAULT_SPEC + 告警（同 getSpec 规则） */
export function getMiniSpec(name) {
  const spec = MINI_CHARACTER_SPECS[name];
  if (!spec) {
    console.warn('[ModelUtils] 未登记的 mini-character，使用 DEFAULT_SPEC：', name);
    return { ...DEFAULT_SPEC };
  }
  return { ...DEFAULT_SPEC, ...spec };
}

/** 取规格；未登记的模型走 DEFAULT_SPEC 并告警（防「凭空假设」） */
export function getSpec(name) {
  const spec = MODEL_SPECS[name];
  if (!spec) {
    console.warn('[ModelUtils] 未登记的模型，使用 DEFAULT_SPEC：', name);
    return { ...DEFAULT_SPEC };
  }
  return { ...DEFAULT_SPEC, ...spec };
}

/** 清单存在性校验：任一清单里存在即可；都没有 → 抛错，杜绝虚构 GLB 路径 */
export function assertKnownModel(name) {
  for (const m of ALL_MANIFESTS) {
    if (m.manifest.models[name]) return m.manifest.models[name];
  }
  const total = ALL_MANIFESTS.reduce((s, m) => s + Object.keys(m.manifest.models).length, 0);
  throw new Error(
    `[ModelUtils] manifest 中不存在模型 "${name}"，禁止引用未扫描到的模型。` +
    `（可用 ${total} 个，见 src/assets/manifest*.json）`,
  );
}

/** 按 key 找所属清单（动物用 PET_SPECS，角色用 MINI_CHARACTER_SPECS） */
export function findManifest(name) {
  for (const m of ALL_MANIFESTS) if (m.manifest.models[name]) return m;
  return null;
}

/** mini-characters 专属存在性校验（角色管理器等只允许引用该清单） */
export function assertKnownMiniCharacterModel(name) {
  if (!miniManifest.models[name]) {
    throw new Error(
      `[ModelUtils] mini-characters 清单中不存在 "${name}"。` +
      `（可用 ${Object.keys(miniManifest.models).length} 个，见 src/assets/manifest-mini-characters.json）`,
    );
  }
  return miniManifest.models[name];
}

/**
 * 材质归一化：卡通平涂 + Lambert，保持 doubleSided（实测 true）。
 * 共享同一张图集 → 同贴图材质可复用，利于合批。
 * @param {THREE.Material} material
 * @param {{flat?:boolean}} [opts]
 */
export function normalizeMaterial(material, opts = {}) {
  if (!material) return material;
  const map = material.map || null;
  const m = new THREE.MeshLambertMaterial({
    map,
    color: opts.flat ? 0xffffff : material.color?.clone?.() ?? new THREE.Color(0xffffff),
    side: THREE.DoubleSide,          // 实测 doubleSided: true，不可剔除背面
    transparent: !!material.transparent,
    opacity: material.opacity ?? 1,
  });
  m.name = material.name || 'kenney-lambert';
  m.flatShading = true;              // Kenney 低多边形硬边观感
  return m;
}

/**
 * 对整个模型做归一化：缩放 + 底面对齐 + 材质 + 阴影 + 命名。
 * 返回一个已「可直接种到球面」的 Group（其局部原点落在模型底面中心）。
 *
 * @param {THREE.Group|THREE.Object3D} source GLTFLoader 得到的 scene
 * @param {string} name manifest key
 * @param {object} [opts]
 * @param {number} [opts.extraScale=1] 额外缩放（如船队统一尺度）
 * @param {boolean} [opts.shadows=true]
 * @returns {{group:THREE.Group, parts:Map<string,THREE.Object3D>, spec:object}}
 */
export function normalizeModel(source, name, opts = {}) {
  assertKnownModel(name);
  const owner = findManifest(name);
  const entry = owner.manifest.models[name];
  const spec = owner.key === 'pets' ? getPetSpec(name)
    : owner.key === 'mini' ? getMiniSpec(name)
    : getSpec(name);

  const group = new THREE.Group();
  group.name = name;

  // 内层承载缩放与底面抬升，外层保持单位变换 → 外层可安全交给 GeoUtils 定位
  const inner = new THREE.Group();
  inner.name = name + '__inner';

  const scale = spec.unit * (opts.extraScale ?? 1);
  inner.scale.setScalar(scale);
  // 实测 baseY < 0 的模型需抬升到局部地面（沿模型 UP 轴）
  const lift = -spec.baseY * spec.unit * (opts.extraScale ?? 1);
  const axis = { x: [1, 0, 0], y: [0, 1, 0], z: [0, 0, 1] }[spec.up[spec.up.length - 1]];
  inner.position.set(axis[0] * lift, axis[1] * lift, axis[2] * lift);

  // 共享材质缓存：同 name 材质只建一次（同图集 → 利于合批 / Instancing）
  const matCache = new Map();
  const parts = new Map();

  source.traverse((o) => {
    if (!o.isMesh) return;
    // 按 index 而非 name 记录部件（实测 flag-c 等重名，§7）
    const key = o.name || 'part';
    if (!parts.has(key)) parts.set(key, o);
    else parts.set(`${key}#${parts.size}`, o);

    const src = Array.isArray(o.material) ? o.material[0] : o.material;
    const ck = src?.name || src?.uuid || 'anon';
    if (!matCache.has(ck)) matCache.set(ck, normalizeMaterial(src, opts));
    o.material = matCache.get(ck);
    // 蒙皮角色：three ≥ r15x 按 object.isSkinnedMesh 自动启用 skinning，
    // 材质无需标志；但同模型共享材质即可（同角色实例动画各自独立于关节矩阵）。

    if (opts.shadows !== false) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
    o.userData.model = name;
  });

  group.add(inner);
  inner.add(source);

  group.userData.model = name;
  group.userData.spec = spec;
  group.userData.tris = entry.tris;
  group.userData.size = entry.size;

  return { group, parts, spec };
}

/**
 * 克隆已归一化的模型。
 * ⚠ 蒙皮模型必须走 three 官方 SkeletonUtils.clone：
 *   Object3D.clone/copy 只复制 SkinnedMesh.skeleton 的**共享引用**，
 *   克隆体的骨骼仍指向**原始 GLTF scene 的关节节点** —— 原始层级一旦被
 *   normalizeModel 搬进别的 group / 被别的实例复用，骨骼变换互相覆盖，
 *   表现为「角色不显示 / 挤在原点 / 动画不动」。
 *   SkeletonUtils.clone 会并行遍历克隆体，重建独立 Skeleton 并把 bones
 *   映射到克隆体内的对应关节，再重新 bind()。
 */
export function cloneNormalizedModel(model, name) {
  let hasSkinnedMesh = false;
  model.traverse((o) => { if (o.isSkinnedMesh) hasSkinnedMesh = true; });

  const group = hasSkinnedMesh ? cloneSkeleton(model) : model.clone(true);
  group.name = name || model.name;
  group.userData = { ...model.userData };
  return group;
}

/** 统一阴影开关 */
export function setShadow(root, cast = true, receive = true) {
  root.traverse((o) => {
    if (o.isMesh) {
      o.castShadow = cast;
      o.receiveShadow = receive;
    }
  });
  return root;
}

/** 分类（UI / LOD 使用） */
export function classify(name) {
  if (/^ship-|^boat-/.test(name)) return 'ship';
  if (/^character-/.test(name)) return 'character';
  if (/^wheelchair-|^aid-|^aid_/.test(name)) return 'character';
  if (/^tower-|^castle-|^structure$|^structure-/.test(name) && !/platform|fence/.test(name)) return 'building';
  if (/platform|dock|fence/.test(name)) return 'dock';
  if (/^palm-|^rocks?-|^grass|^patch-|^hole/.test(name)) return 'nature';
  return 'prop';
}

/**
 * 构建 InstancedMesh 用的合并几何：把归一化模型的全部几何烘到局部空间。
 * @param {THREE.Object3D} model
 * @param {THREE.Material} material
 */
export function buildInstancedGeometry(model, material) {
  const geos = [];
  const inv = new THREE.Matrix4();
  model.updateMatrixWorld(true);
  model.traverse((o) => {
    if (!o.isMesh) return;
    const g = o.geometry.clone();
    const local = new THREE.Matrix4().copy(o.matrixWorld).premultiply(inv.copy(model.matrixWorld).invert());
    g.applyMatrix4(local);
    geos.push(g);
  });
  return { geometry: mergeSimple(geos), material };
}

/**
 * 轻量几何合并（非索引 → 索引统一）。仅用于同材质道具合并成 1 个 DrawCall。
 * 若需要更稳健可换 three/examples BufferGeometryUtils.mergeGeometries。
 */
export function mergeSimple(geometries) {
  const positions = [];
  const normals = [];
  const uvs = [];
  let count = 0;
  for (const g of geometries) {
    const ng = g.index ? g.toNonIndexed() : g;
    const p = ng.attributes.position;
    const n = ng.attributes.normal;
    const u = ng.attributes.uv;
    for (let i = 0; i < p.count; i++) {
      positions.push(p.getX(i), p.getY(i), p.getZ(i));
      if (n) normals.push(n.getX(i), n.getY(i), n.getZ(i));
      if (u) uvs.push(u.getX(i), u.getY(i));
    }
    count += p.count;
  }
  const merged = new THREE.BufferGeometry();
  merged.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  if (normals.length === count * 3) merged.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  if (uvs.length === count * 2) merged.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  merged.computeBoundingSphere();
  return merged;
}
