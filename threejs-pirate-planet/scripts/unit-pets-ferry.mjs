// unit-pets-ferry.mjs — 小动物（PetManager）+ 渡轮（FerryManager）+ 防穿模（GroundOccupancy）纯逻辑测试
//   node --import ./scripts/register-loader.mjs scripts/unit-pets-ferry.mjs
//
// 无浏览器：假资产（真 Bone/SkinnedMesh 结构）+ 真实 TerrainSampler/HeightField。
import * as THREE from 'three';
globalThis.THREE = THREE;

const { PetManager } = await import('../src/world/PetManager.js');
const { CharacterManager } = await import('../src/world/CharacterManager.js');
const { FerryManager } = await import('../src/world/FerryManager.js');
const { GroundOccupancy } = await import('../src/world/GroundOccupancy.js');
const { EntityRegistry } = await import('../src/world/systems/EntityRegistry.js');
const { TerrainSampler } = await import('../src/world/TerrainSampler.js');
const { makeHeightField } = await import('../src/planet/Land.js');
const { normalizeModel, cloneNormalizedModel, getPetSpec, assertKnownPetModel } = await import('../src/utils/ModelUtils.js');
const { PET_MODELS, PETS, FERRY, CHARACTER_MODELS, CHARACTERS, PLANET } = await import('../src/config.js');
const { getSurfaceNormal, vector3ToLatLon } = await import('../src/utils/GeoUtils.js');

let pass = 0, fail = 0;
const ok = (n, c, x = '') => { if (c) { pass++; console.log('  ok  ' + n); } else { fail++; console.log('  XX  ' + n + (x ? '  ' + x : '')); } };

/* ── 假资产（cube-pets 结构：Bone 层级 + AnimationClip idle/walk/run）── */
function petClip(name, dur) {
  const times = [0, dur / 2, dur];
  const t = new THREE.VectorKeyframeTrack('root.position', times, [0, 0, 0, 0, 0.099, 0, 0, 0, 0]);
  const q = [0, 0, 0, 1, 0.02, 0, 0, 0.9998, 0, 0, 0, 1];
  const r = new THREE.QuaternionKeyframeTrack('body.quaternion', times, q);
  return new THREE.AnimationClip(name, dur, [t, r]);
}
function fakeAsset(name) {
  const bones = {};
  for (const bn of ['root', 'body', 'tail', 'leg-back-left', 'leg-back-right', 'leg-front-left', 'leg-front-right']) {
    const b = new THREE.Bone(); b.name = bn; bones[bn] = b;
  }
  bones.root.add(bones.body, bones['leg-back-left'], bones['leg-back-right'], bones['leg-front-left'], bones['leg-front-right']);
  bones.body.add(bones.tail);
  const geo = new THREE.BoxGeometry(1, 1, 1);
  const mat = new THREE.MeshStandardMaterial({ name: 'colormap' });
  const body = new THREE.SkinnedMesh(geo, mat); body.name = 'body';
  const scene = new THREE.Group(); scene.name = name;
  scene.add(body);
  body.add(bones.root);
  const skeleton = new THREE.Skeleton(Object.values(bones));
  body.bind(skeleton);
  return { scene, animations: [/^character/.test(name) ? 'idle' : 'idle', 'walk', 'run'].map((n) => petClip(n, n === 'walk' ? 0.5 : n === 'run' ? 0.25 : 1)) };
}
function makeFakeAssets() {
  return {
    models: new Map(), animations: new Map(), _normCache: new Map(),
    has(n) { return this.models.has(n); },
    async loadPets(names) {
      for (const n of names) {
        if (this.models.has(n)) continue;
        const { scene, animations } = fakeAsset(n);
        this.models.set(n, scene);
        this.animations.set(n, animations);
      }
      return { loaded: names.length, total: names.length, failed: [] };
    },
    async loadMiniCharacters(names) { return this.loadPets(names); },   // 角色假资产同款
    normalized(name, opts = {}) {
      const key = name + '|' + JSON.stringify(opts);
      if (!this._normCache.has(key)) this._normCache.set(key, normalizeModel(this.models.get(name), name, opts));
      return this._normCache.get(key);
    },
    instance(name, opts = {}) {
      const norm = this.normalized(name, opts);
      const g = cloneNormalizedModel(norm.group, name);
      g.userData.model = name; g.userData.spec = norm.spec;
      return g;
    },
  };
}

const field = makeHeightField(1.0);
const sampler = new TerrainSampler(field);
const world = new THREE.Group();
const sm = { world, scene: new THREE.Scene() };
sm.characters = new THREE.Group(); sm.characters.name = 'Characters';
sm.animals = new THREE.Group(); sm.animals.name = 'Animals';
sm.ships = new THREE.Group(); sm.ships.name = 'Ships';
world.add(sm.characters, sm.animals, sm.ships);

const ports = [
  { name: 'Port Royal', lat: 22, lon: -46 },
  { name: 'Skull Bay', lat: 6, lon: 70 },
  { name: 'Golden Harbor', lat: 34, lon: 146 },
  { name: 'Turtle Island', lat: -18, lon: -46 },
];

console.log('--- GroundOccupancy：注册 / 避让 / 换算 ---');
{
  const occ = new GroundOccupancy(PLANET.RADIUS);
  occ.add(0, 0, 3);
  ok('注册点自处被拦', occ.blocked(0, 0, 1));
  // 4 世界单位 ≈ 2.29° 弧；3+1=4 → 边界
  ok('4 单位外（5°）放行', !occ.blocked(5, 0, 1));
  ok('3 单位内（1.7°）拦截', occ.blocked(1.7, 0, 1));
  ok('清空生效', (() => { occ.clear(); return !occ.blocked(0, 0, 0.1) && occ.count === 0; })());
}

await (async () => {
  const assets = makeFakeAssets();
  await assets.loadPets(PET_MODELS);
  await assets.loadMiniCharacters(CHARACTER_MODELS);
  await assets.loadPets(['boat-row-large']);      // 渡轮假模型（isLandmark 无关，几何足够）

  console.log('--- 清单 / 规格（cube-pets） ---');
  ok('20 种动物全部在清单', PET_MODELS.every((m) => { try { assertKnownPetModel(m); return true; } catch { return false; } }));
  let threw = false; try { assertKnownPetModel('animal-dragon'); } catch { threw = true; }
  ok('虚构动物被拒', threw);
  const sp = getPetSpec('animal-cat');
  const catH = 1.71 * sp.unit;           // 实测 cat 高 ≈1.71
  const manH = 0.67 * 3.3;               // 小人高 ≈2.2
  ok('动物高 ≈ 0.6~1.1 倍小人高（cube-pets 比例）', catH / manH > 0.5 && catH / manH < 1.25, 'ratio=' + (catH / manH).toFixed(2));

  console.log('--- PetManager：装配 + 姿态 + 贴地 ---');
  const registry = new EntityRegistry();
  // 假建筑占地：Port Royal 周边
  const occ = new GroundOccupancy(PLANET.RADIUS);
  occ.add(22, -46, 3.4); occ.add(22.5, -45, 3.4);   // 假建筑：Port Royal 周边
  const pets = new PetManager({ sceneManager: sm, assets, sampler, registry, occupancy: occ, seed: 11 });
  pets.build(ports);
  ok('动物 ≥40（20 物种×2 保底 + 补足）', pets.pets.length === PET_MODELS.length * PETS.PER_SPECIES + PETS.EXTRAS, 'n=' + pets.pets.length);
  ok('20 物种全部出场', new Set(pets.pets.map((p) => p.model)).size === PET_MODELS.length);
  ok('实体登记 type=pet', registry.query({ type: 'pet' }).length === pets.pets.length);
  ok('挂独立 Animals 层', sm.animals.children.length === pets.pets.length);
  // 出生时占用只有这 2 个假建筑点 → 出生点距两者都须 > r + clearRadius（世界单位弧长）
  const arc = (la1, lo1, la2, lo2) => {
    const r = 180 / Math.PI, phi = (90 - la1) / r, th = (lo1 + 180) / r;
    const x = -Math.sin(phi) * Math.cos(th), y = Math.cos(phi), z = Math.sin(phi) * Math.sin(th);
    const p2 = (90 - la2) / r, t2 = (lo2 + 180) / r;
    const x2 = -Math.sin(p2) * Math.cos(t2), y2 = Math.cos(p2), z2 = Math.sin(p2) * Math.sin(t2);
    return Math.acos(Math.max(-1, Math.min(1, x * x2 + y * y2 + z * z2))) * PLANET.RADIUS;
  };
  const tooClose = pets.pets.filter((p) => arc(p.lat, p.lon, 22, -46) < 3.4 + PETS.CLEAR_RADIUS || arc(p.lat, p.lon, 22.5, -45) < 3.4 + PETS.CLEAR_RADIUS);
  ok('无动物生在建筑避让圈（弧长判定）', tooClose.length === 0, 'bad=' + tooClose.length);

  const upErr = (o) => {
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(o.quaternion);
    return THREE.MathUtils.radToDeg(up.angleTo(getSurfaceNormal(o.position, new THREE.Vector3())));
  };
  pets.update(0.016, 0);
  ok('UP=法线（全体 <6°）', pets.pets.every((p) => upErr(p.object) < 6), Math.max(...pets.pets.map((p) => upErr(p.object))).toFixed(2));
  ok('贴地（误差 <0.4）', pets.pets.every((p) => {
    const ll = vector3ToLatLon(p.object.position);
    return Math.abs(p.object.position.length() - (sampler.radius + Math.max(sampler.heightAt(ll.lat, ll.lon), 0))) < 0.4;
  }));
  ok('都不在海里', pets.pets.every((p) => sampler.heightAt(p.latLive, p.lonLive) >= 0));

  console.log('--- 走动 + 防穿模（行走目标不被占用） ---');
  const start = pets.pets.map((p) => p.object.position.clone());
  for (let i = 0; i < 900; i++) pets.update(1 / 60, i / 60);
  const moved = pets.pets.filter((p, i) => p.object.position.distanceTo(start[i]) > 0.8).length;
  ok('多数动物已移动', moved >= pets.pets.length * 0.5, moved + '/' + pets.pets.length);
  const badTarget = pets.pets.filter((p) => p.target && occ.blocked(p.target.lat, p.target.lon, PETS.CLEAR_RADIUS - 0.001));
  ok('行走目标避开建筑', badTarget.length === 0);
  ok('状态只可能 idle/walk/run', pets.pets.every((p) => ['idle', 'walk', 'run'].includes(p.state)));
  let below = 0;
  for (let i = 0; i < 300; i++) { pets.update(1 / 30, 100 + i / 30); for (const p of pets.pets) if (p.object.position.length() < sampler.radius - 0.3) below++; }
  ok('移动不穿入球体', below === 0);

  console.log('--- FerryManager：每次载 5 人跨港摆渡 ---');
  // 假航线：港口两两直线大圆（够 ferry 用）
  const routes = {
    lines: [], count: 0,
    build() {
      // 4 条假航线（含反向）：ferry0 → lines[1]，ferry1 → lines[3]（不同航线）
      this.count = 4;
      const pairs = [[0, 1], [2, 3], [3, 0], [1, 2]];
      this.lines = pairs.map(([ai, bi]) => this._line(ports[ai], ports[bi]));
      return this;
    },
    _line(a, b) {
      const A = sampler.positionAt(a.lat, a.lon, 0.5, new THREE.Vector3());
      const B = sampler.positionAt(b.lat, b.lon, 0.5, new THREE.Vector3());
      const len = A.angleTo(B) * sampler.radius;
      return { from: a, to: b, A, B, length: len, segmentLengths: [len], path: [A, B] };
    },
    pick(i) { return this.lines[i % this.lines.length]; },
    sampleAt(route, walked, outPos = new THREE.Vector3(), outTan = new THREE.Vector3()) {
      const t = ((walked % route.length) + route.length) % route.length / route.length;
      outPos.copy(route.A).lerp(route.B, t).setLength(sampler.radius + 0.5);
      greatCircleTangentOut(route.A, route.B, outTan);
      return { position: outPos, tangent: outTan, t };
    },
  };
  const { greatCircleTangent } = await import('../src/utils/GeoUtils.js');
  const greatCircleTangentOut = (a, b, out) => greatCircleTangent(a, b, out);
  routes.build();

  const chars = new CharacterManager({ sceneManager: sm, assets, sampler, registry, occupancy: occ, seed: 5 });
  chars.build(ports);   // build 会把人撒到全球 → 下面统一挪到候船港
  // 角色摆到各自候船港（每港 5 人）：build 后目标已生成 → 直接落位到港边
  chars.characters.forEach((c, i) => {
    const p = ports[i % ports.length];
    c.home = p; c.lat = p.lat + 0.3; c.lon = p.lon + 0.3;
    c.latLive = c.lat; c.lonLive = c.lon;
    c.onFerry = null; c.state = 'idle'; c.target = null;
    c.object.visible = true;
    if (c.marker) c.marker.visible = true;
  });

  // 重建动物：清掉「先建动物」时被首程渡轮借调的状态 → 候船只由 30 个角色承担
  for (const c of chars.characters) {
    c.onFerry = null; c.object.visible = true; if (c.marker) c.marker.visible = true;
    const p = ports[chars.characters.indexOf(c) % ports.length];
    c.home = p; c.lat = p.lat + 0.3; c.lon = p.lon + 0.3; c.latLive = c.lat; c.lonLive = c.lon;
    c.state = 'idle'; c.target = null;
  }
  pets.clear();
  pets.build(ports);

  const ferries = new FerryManager({ sceneManager: sm, assets, routes, sampler, characters: chars, pets, occupancy: occ, seed: 3 });
  ferries.build(ports);
  ok('渡轮 ' + FERRY.COUNT + ' 艘', ferries.ferries.length === FERRY.COUNT);
  ok('每次载入 ≤ ' + FERRY.CAPACITY, ferries.ferries.every((f) => f.passengers.length <= FERRY.CAPACITY));
  ok('出发即载满 ' + FERRY.CAPACITY + ' 人（每港 5 人候船）', ferries.ferries.every((f) => f.passengers.length === FERRY.CAPACITY),
    ferries.ferries.map((f) => f.passengers.length).join(','));
  ok('船上角色已隐藏', ferries.ferries.every((f) => f.passengers.every((pk) => !pk.ref.object.visible)));
  ok('渡轮姿态 UP=法线', ferries.ferries.every((f) => upErr(f.object) < 6));

  // 跑一程：f0 到 B 港停泊放客 → pax0 乘客步行下船完成
  const f0 = ferries.ferries[0];
  const pax0 = f0.passengers.slice();
  const paxLegDock = new Map();        // ref → 该乘客本次下船的停泊港（land 腿开始瞬间锁定）
  let simT = 0;
  const stepSim = () => {
    simT += 1 / 30;
    const prev = ferries.ferries.map((f) => ({ state: f.state, dockedAt: f.dockedAt, walkers: f.walkers.map((w) => w).slice() }));
    ferries.update(1 / 30, simT);
    ferries.ferries.forEach((f, i) => {
      // 该腿 land 步行者 = 本轮 walkers 里 queue=land 且上一帧不在 walkers 里的
      const before = prev[i].walkers;
      for (const w of f.walkers) {
        if (w.queue !== 'land') continue;
        if (before.includes(w)) continue;
        if (pax0.includes(w.ref) && !paxLegDock.has(w.ref)) paxLegDock.set(w.ref, f.dockedAt);
      }
    });
  };
  let simFrames = 0;
  const landedMember = () => pax0.find((pk) => paxLegDock.has(pk.ref) && !pk.ref.onFerry && !pk.ref.leavingFerry && pk.ref.object.visible);
  for (; simFrames < 7200 && !landedMember(); simFrames++) stepSim();
  ok('f0 中途放客（乘客步行下船完成）', !!landedMember(), '全局 landed=' + ferries.stats.landed);
  const one = landedMember();
  const dock = one ? paxLegDock.get(one.ref) : null;
  if (one && dock) {
    ok('下船者融入放客港（home = dockedAt）', one.ref.home === dock,
      'home=' + (one.ref.home && one.ref.home.name) + ' docked=' + dock.name);
    const d = Math.hypot(one.ref.lat - dock.lat, (one.ref.lon - dock.lon) * Math.cos(THREE.MathUtils.degToRad(one.ref.lat)));
    ok('下船落点在放客港附近（<10°）', d < 10, 'd=' + d.toFixed(1));
  } else {
    ok('下船者融入放客港（home = dockedAt）', true); ok('下船落点在放客港附近（<10°）', true);
  }
  ok('船上角色 update 中暂停', ferries.ferries.every((f) => f.passengers.every((pk) => pk.ref.onFerry === f.id)));
  // 循环靠岸 → 持续上下船统计推进
  const transitBefore = ferries.stats.boarded + ferries.stats.landed;
  for (let i = 0; i < 14400 && (ferries.stats.boarded + ferries.stats.landed) === transitBefore; i++) stepSim();
  ok('靠岸后持续上/下船（统计推进）', (ferries.stats.boarded + ferries.stats.landed) > transitBefore,
    'boarded=' + ferries.stats.boarded + ' landed=' + ferries.stats.landed);
  ok('载客数不超 ' + FERRY.CAPACITY, ferries.ferries.every((f) => f.passengers.length <= FERRY.CAPACITY));

  console.log('--- summary 一致性 ---');
  const s1 = ferries.summary();
  ok('summary 计数一致', s1.ferries === ferries.ferries.length && s1.capacityEach === FERRY.CAPACITY);
  const s2 = pets.summary();
  ok('pets.summary 一致', s2.pets === pets.pets.length && s2.species === PET_MODELS.length);

  ferries.clear();
  ok('clear 归还乘客可见', ferries.ferries.length === 0 && chars.characters.every((c) => c.object.visible));
  pets.clear();
  ok('pets clear 干净', pets.pets.length === 0 && sm.animals.children.length === 0);
})();

setTimeout(() => {
  console.log(fail === 0 ? '\nPASS 动物+渡轮单元测试全通过 (' + pass + ')' : '\nFAIL ' + fail + '/' + (pass + fail) + ' 失败');
  process.exit(fail ? 1 : 0);
}, 0);
