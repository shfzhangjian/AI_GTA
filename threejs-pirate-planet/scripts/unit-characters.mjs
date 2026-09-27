// unit-characters.mjs — 陆地小人（CharacterManager / mini-characters）纯逻辑测试
//   node --import ./scripts/register-loader.mjs scripts/unit-characters.mjs
//
// 无浏览器、无 WebGL：假 AssetManager（返回 Kenney 式骨骼层级 + walk/sprint/idle clip）
// 验证：清单防呆、球面姿态、贴地、大圆移动、状态机、动画混合器接入。
import * as THREE from 'three';
globalThis.THREE = THREE;

const { CharacterManager } = await import('../src/world/CharacterManager.js');
const { EntityRegistry } = await import('../src/world/systems/EntityRegistry.js');
const { TerrainSampler } = await import('../src/world/TerrainSampler.js');
const { makeHeightField } = await import('../src/planet/Land.js');
const { getSpec, getMiniSpec, assertKnownModel, assertKnownMiniCharacterModel, normalizeModel, cloneNormalizedModel } = await import('../src/utils/ModelUtils.js');
const { CHARACTER_MODELS, CHARACTERS, PLANET } = await import('../src/config.js');
const { getSurfaceNormal, vector3ToLatLon } = await import('../src/utils/GeoUtils.js');

let pass = 0, fail = 0;
const ok = (n, c, x = '') => { if (c) { pass++; console.log('  ok  ' + n); } else { fail++; console.log('  XX  ' + n + (x ? '  ' + x : '')); } };

/* ── 假 AssetManager：复刻 mini-characters 的骨骼层级与 clip 结构 ── */
function fakeCharacterClip(name, dur, movingRoot) {
  const times = [0, dur / 2, dur];
  const tracks = [];
  if (movingRoot) {
    // ⚠ 实测：walk 的 root.translation 只是 ±0.05 原地起伏，不是 root motion
    tracks.push(new THREE.VectorKeyframeTrack('root.position', times, [0, 0, 0, 0, 0.05, 0, 0, 0, 0]));
  }
  const q = (x, y, z, w) => [x, y, z, w];
  tracks.push(new THREE.QuaternionKeyframeTrack('torso.quaternion', times,
    [...q(0, 0, 0, 1), ...q(0.03, 0, 0, 0.9995), ...q(0, 0, 0, 1)]));
  return new THREE.AnimationClip(name, dur, tracks);
}
function fakeAsset(name) {
  // ⭐ 真·蒙皮层级（复刻 GLTFLoader 产物）：Bone 链 + SkinnedMesh + Skeleton
  //    （GLTFLoader：skinned mesh 挂到 scene 根、root bone 挂进 mesh、再 bind(skeleton)）
  const geo = new THREE.BoxGeometry(0.16, 0.34, 0.2);
  const mat = new THREE.MeshStandardMaterial({ name: 'colormap' });
  const bones = {};
  for (const bn of ['root', 'leg-left', 'leg-right', 'torso', 'arm-left', 'arm-right', 'head']) {
    const b = new THREE.Bone(); b.name = bn; bones[bn] = b;
  }
  bones.root.add(bones['leg-left'], bones['leg-right'], bones.torso);
  bones.torso.add(bones['arm-left'], bones['arm-right'], bones.head);
  const skeleton = new THREE.Skeleton(Object.values(bones));
  const body = new THREE.SkinnedMesh(geo, mat); body.name = 'body-mesh';
  const head = new THREE.SkinnedMesh(geo.clone(), mat); head.name = 'head-mesh';
  const scene = new THREE.Group(); scene.name = name;
  scene.add(body, head);
  body.add(bones.root);
  body.bind(skeleton);
  head.bind(skeleton);

  const animations = [];
  if (/^character-/.test(name)) {
    animations.push(fakeCharacterClip('idle', 1.33, false));
    animations.push(fakeCharacterClip('walk', 0.67, true));
    animations.push(fakeCharacterClip('sprint', 0.5, true));
  }
  return { scene, animations };
}
function makeFakeAssets() {
  const assets = {
    models: new Map(), animations: new Map(),
    has(n) { return this.models.has(n); },
    async loadMiniCharacters(names) {
      for (const n of names) {
        if (this.models.has(n)) continue;
        const { scene, animations } = fakeAsset(n);
        this.models.set(n, scene);
        if (animations.length) this.animations.set(n, animations);
      }
      return { loaded: names.length, total: names.length, failed: [] };
    },
    _normCache: new Map(),
    normalized(name, opts = {}) {
      const m = this.models.get(name);
      if (!m) throw new Error('未加载 ' + name);
      const key = name + '|' + JSON.stringify(opts);
      if (!this._normCache.has(key)) this._normCache.set(key, normalizeModel(m, name, opts));
      return this._normCache.get(key);
    },
    // 与真实 AssetManager 同款：走 cloneNormalizedModel（蒙皮 → SkeletonUtils.clone）
    instance(name, opts = {}) {
      const norm = this.normalized(name, opts);
      const g = cloneNormalizedModel(norm.group, name);
      g.userData.model = name; g.userData.spec = norm.spec;
      return g;
    },
  };
  return assets;
}

const field = makeHeightField(1.0);
const sampler = new TerrainSampler(field);
const world = new THREE.Group();
const sm = { world, scene: new THREE.Scene() };
sm.characters = new THREE.Group(); sm.characters.name = 'Characters'; world.add(sm.characters);

console.log('--- 清单防呆（mini-characters） ---');
{
  ok('manifest-mini-characters 收录全部角色 key', CHARACTER_MODELS.every((m) => { try { return !!assertKnownMiniCharacterModel(m); } catch { return false; } }));
  ok('12 个站立角色齐全', CHARACTER_MODELS.length === 12);
  let threw = false;
  try { assertKnownModel('character-imaginary-hero'); } catch { threw = true; }
  ok('虚构角色 key 被拒绝', threw);
  ok('assertKnownModel 兼容 pirate 清单（ship-pirate-large）', !!assertKnownModel('ship-pirate-large'));
  const sp = getMiniSpec('character-male-a');
  ok('角色规格存在且 up=y forward=z', sp.up === 'y' && sp.forward === 'z');
  // 比例：实测角色高 ≈0.67~0.78，unit 2.6 → 世界 ≈1.7~2.0；棕榈 unit 2.7 × 高约 2.6 ≈ 7
  const chH = 0.67 * sp.unit;
  const palm = getSpec('palm-straight');
  ok('小人相对棕榈约 1:2 ~ 1:4（RTS 镜头可见性优先）', chH / (2.6 * palm.unit) > 0.24 && chH / (2.6 * palm.unit) < 0.52,
    'ratio=' + (chH / (2.6 * palm.unit)).toFixed(2));
  ok('unit 已调大到 3.3（视觉不被地形吞）', sp.unit === 3.3, 'unit=' + sp.unit);
}

await (async () => {
  console.log('--- 装配：加载 + build ---');
  const assets = makeFakeAssets();
  await assets.loadMiniCharacters([...CHARACTER_MODELS]);
  const registry = new EntityRegistry();
  const ports = [
    { name: 'Port Royal', lat: 22, lon: -46 },
    { name: 'Skull Bay', lat: 6, lon: 70 },
    { name: 'Golden Harbor', lat: 34, lon: 146 },
    { name: 'Turtle Island', lat: -18, lon: -46 },
    { name: 'Storm Port', lat: 12, lon: 100 },
    { name: 'Emerald Cove', lat: -2, lon: -100 },
  ];
  const mgr = new CharacterManager({ sceneManager: sm, assets, sampler, registry, seed: 42 });
  mgr.build(ports);
  ok('build 生成小人 ≥ 20（用户要求）', mgr.characters.length >= 20, 'n=' + mgr.characters.length);
  ok('人数 = max(TOTAL, PER_PORT×港数) + 散居补足', mgr.characters.length === Math.max(CHARACTERS.TOTAL, CHARACTERS.PER_PORT * 6) + Math.max(CHARACTERS.WANDERERS, Math.max(CHARACTERS.TOTAL, CHARACTERS.PER_PORT * 6) - CHARACTERS.PER_PORT * 6),
    'n=' + mgr.characters.length);
  ok('每个小人登记 entity type=character', registry.query({ type: 'character' }).length === mgr.characters.length);
  ok('小人挂进独立 Characters 层', sm.characters.children.length === mgr.characters.length && world.children.includes(sm.characters));
  ok('全部使用站立角色（无 aid 道具 / 无轮椅）', mgr.characters.every((c) => /^character-/.test(c.model)));
  ok('12 个角色全部出场（可重复）', new Set(mgr.characters.map((c) => c.model)).size === 12,
    'used=' + new Set(mgr.characters.map((c) => c.model)).size);

  console.log('--- 姿态：UP=球面法线（南北极都站得起来） ---');
  mgr.update(0.016, 0);   // 先放一次
  const upErr = (c) => {
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(c.object.quaternion);
    const n = getSurfaceNormal(c.object.position, new THREE.Vector3());
    return THREE.MathUtils.radToDeg(up.angleTo(n));
  };
  let worst = 0;
  for (const c of mgr.characters) worst = Math.max(worst, upErr(c));
  ok('UP 与表面法线偏差 < 6°（全体）', worst < 6, 'worst=' + worst.toFixed(2) + '°');
  const south = mgr.characters.find((c) => c.latLive < -10);
  if (south) ok('南半球小人也竖直站立', upErr(south) < 6, south.latLive.toFixed(1) + '° lat');

  console.log('--- 贴地：脚底贴合高度场，不悬浮不陷地 ---');
  for (const c of mgr.characters) {
    const ll = vector3ToLatLon(c.object.position);
    const h = sampler.heightAt(ll.lat, ll.lon);
    const err = Math.abs(c.object.position.length() - (sampler.radius + Math.max(h, 0)));
    ok('贴地误差 < 0.35 ' + c.id, err < 0.35, 'err=' + err.toFixed(2));
    if (mgr.characters.indexOf(c) > 5) break;   // 抽样 6 个
  }
  let anyOcean = false;
  for (const c of mgr.characters) {
    const h = sampler.heightAt(c.latLive, c.lonLive);
    if (h < 0) anyOcean = true;
  }
  ok('无小人落在海里（heightAt>=0）', !anyOcean);

  console.log('--- 走动：状态机 + 大圆位移 ---');
  let moved = 0;
  const start = mgr.characters.map((c) => c.object.position.clone());
  for (let i = 0; i < 1200; i++) mgr.update(1 / 60, i / 60);   // 20 秒模拟
  for (let i = 0; i < mgr.characters.length; i++) {
    const d = mgr.characters[i].object.position.distanceTo(start[i]);
    if (d > 1.0) moved++;
  }
  ok('20 秒后多数小人已移动', moved >= mgr.characters.length * 0.5, moved + '/' + mgr.characters.length);
  const states = new Set(mgr.characters.map((c) => c.state));
  ok('状态只可能是 idle/walk/sprint', [...states].every((s) => ['idle', 'walk', 'sprint'].includes(s)), [...states].join(','));
  // 大圆移动不穿球：全程 radius >= R
  let below = 0;
  for (const c of mgr.characters) {
    for (let i = 0; i < 30; i++) { mgr.update(1 / 30, 100 + i / 30); if (c.object.position.length() < sampler.radius - 0.3) below++; }
  }
  ok('移动不穿入球体内部', below === 0, 'below=' + below);
  // 目标点全在陆地
  let seaTarget = 0;
  for (const c of mgr.characters) if (c.target && sampler.heightAt(c.target.lat, c.target.lon) < 0) seaTarget++;
  ok('步行目标都在陆地（或海平面以上）', seaTarget === 0);

  console.log('--- 骨骼动画：AnimationMixer 接入且驱动关节 ---');
  const c0 = mgr.characters.find((c) => !c.isChair);
  ok('每小人有 AnimationMixer', !!c0.mixer && c0.mixer instanceof THREE.AnimationMixer);
  const rootObj = c0.object.getObjectByName('root');
  ok('动画目标节点 root 存在（同名解析）', !!rootObj);
  ok('mixer 正在播放某动作', [...(c0.mixer._actions || [])].some((a) => a.isRunning()),
    'actions=' + Object.keys(c0.actions).join(','));
  // walk 的 root.translation 是原地起伏 → 验证混合器让 root.position.y 波动
  const ys = new Set();
  for (let i = 0; i < 80; i++) {
    mgr.update(1 / 60, 200 + i / 60);
    if (rootObj) ys.add(+c0.object.getObjectByName('root').position.y.toFixed(3));
  }
  ok('骨骼动画在驱动 root 位移（混合器生效）', ys.size >= 2, 'distinct=' + ys.size);

  console.log('--- 蒙皮克隆独立性（SkeletonUtils.clone 回归防线） ---');
  {
    // 12 角色池 + 前 12 人轮转发牌 → 任意单一 model 可能恰好只有 1 个；
    // 「可重复」的正确断言：鸽巢——出现最多的 model 的份数 ≥ ceil(20/12) = 2
    const byModel = {};
    for (const c of mgr.characters) byModel[c.model] = (byModel[c.model] || 0) + 1;
    const maxRep = Math.max(...Object.values(byModel));
    ok('角色可重复（鸽巢：最多者 ≥2 份）', maxRep >= 2, 'maxRep=' + maxRep);
    // 用重复最多的那个 model 验克隆独立性
    const dupModel = Object.keys(byModel).find((m) => byModel[m] === maxRep);
    const clones = mgr.characters.filter((c) => c.model === dupModel).slice(0, 2);
    ok('重复模型取到 2 个实例', clones.length === 2, dupModel);
    const bA = clones[0].object.getObjectByName('root');
    const bB = clones[1].object.getObjectByName('root');
    ok('克隆体各自拥有独立 root 骨骼（不共享）', !!bA && !!bB && bA !== bB);
    const skA = clones[0].object.getObjectByName('body-mesh').skeleton;
    const skB = clones[1].object.getObjectByName('body-mesh').skeleton;
    ok('克隆体各自拥有独立 Skeleton', skA !== skB);
    ok('Skeleton.bones 指向各自克隆内节点', skA.bones[0] !== skB.bones[0] && clones[0].object.getObjectByName('root') === skA.bones[0]);
    // 移动 A 的骨骼 → B 世界坐标不受影响（旧 copy 克隆在此必挂）
    const before = clones[1].object.getObjectByName('head-mesh').getWorldPosition(new THREE.Vector3()).clone();
    bA.position.set(9.1, 4.2, -7.7);
    clones[0].object.updateMatrixWorld(true);
    const after = clones[1].object.getObjectByName('head-mesh').getWorldPosition(new THREE.Vector3());
    ok('动 A 骨骼不影响 B（骨骼链独立）', before.distanceTo(after) < 1e-6, 'drift=' + before.distanceTo(after).toFixed(4));
  }

  console.log('--- 独立 Characters 层 + 头顶标记 ---');
  {
    ok('角色挂进 SceneManager.characters 层', mgr.group === sm.characters || sm.characters.children.length === mgr.characters.length);
    ok('头顶标记存在（RTS 镜头确认在图上）', mgr.characters.every((c) => !!c.marker && c.marker.parent === c.object));
    const m0 = mgr.characters[0].marker;
    ok('标记在世界上方（局部 +Y，随球站立）', m0.position.y > 1.5 && m0.position.y < 6, 'y=' + m0.position.y.toFixed(2));
  }

  console.log('--- describe / summary ---');
  const s = mgr.summary();
  ok('summary 计数一致', s.characters === mgr.characters.length && s.modelsUsed === new Set(mgr.characters.map((c) => c.model)).size);
  const d = mgr.describe(mgr.characters[0]);
  ok('describe 带实时经纬度', typeof d.lat === 'number' && typeof d.lon === 'number');

  console.log('--- 显隐与清理 ---');
  mgr.clear();
  ok('clear 后清空', mgr.characters.length === 0 && sm.characters.children.length === 0);
  mgr.update(0.016, 1);   // 不应抛错
  ok('clear 后 update 不抛错', true);
})();

setTimeout(() => {
  console.log(fail === 0 ? '\nPASS 小人单元测试全通过 (' + pass + ')' : '\nFAIL ' + fail + '/' + (pass + fail) + ' 失败');
  process.exit(fail ? 1 : 0);
}, 0);
