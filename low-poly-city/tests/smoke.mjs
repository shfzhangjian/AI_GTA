/**
 * 无头冒烟测试（Node v24，无浏览器）：用合成 fake 覆盖车辆/NPC/武器/警察/玩家生命系统。
 * 运行前需临时 three shim（见 run-smoke 说明）。断言全过打印 SMOKE TEST PASS。
 *   node tests/smoke.mjs
 */
import * as THREE from 'three';

globalThis.window = globalThis;
globalThis.document = { getElementById: () => null, querySelectorAll: () => [], createElement: () => ({ getContext: () => null, style: {} }) };
globalThis.requestAnimationFrame = () => 0;
globalThis.AudioContext = class { constructor() { this.state = 'running'; this.currentTime = 0; this.destination = {}; } createGain() { return gNode(); } createOscillator() { return oNode(); } createBiquadFilter() { return fNode(); } createBuffer() { return { getChannelData: () => new Float32Array(4) }; } createBufferSource() { return sNode(); } resume() { return Promise.resolve(); } };
globalThis.webkitAudioContext = globalThis.AudioContext;
function gNode() { return { gain: { value: 0, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {}, disconnect() {} }; }
function oNode() { return { type: 'sine', frequency: { value: 0, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {}, cancelScheduledValues() {} }, detune: { value: 0, setValueAtTime() {}, linearRampToValueAtTime() {} }, connect() {}, disconnect() {}, start() {}, stop() {}, onended: null }; }
function fNode() { return { type: 'lowpass', frequency: { value: 0, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {}, cancelScheduledValues() {} }, Q: { value: 0 }, connect() {}, disconnect() {} }; }
function sNode() { return { buffer: null, loop: false, playbackRate: { value: 1 }, connect() {}, disconnect() {}, start() {}, stop() {} }; }

let passed = 0; let failed = 0;
function check(name, ok) { if (ok) { passed++; console.log('PASS -', name); } else { failed++; console.log('FAIL -', name); } }
const mod = (p) => import('file:///E:/aibot/city-3d/src/' + p);

/* ============ 合成 fake 资产 ============ */

// —— 写实/自建车 fake（porsche911 规格：paint + Cylinder 轴对）——
function fakeCarTemplate() {
  const root = new THREE.Group();
  const nm = (n) => { const m = new THREE.MeshStandardMaterial(); m.name = n; return m; };
  const hull = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.9, 7.4), nm('paint')); hull.position.y = 0.1; root.add(hull);
  const hl = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.3, 0.1), nm('lights')); hl.position.set(0, 0.4, -3.75); root.add(hl);
  const islands = (z) => { let pos = []; for (const x of [1.5, -1.5]) { const g = new THREE.BoxGeometry(0.5, 1.1, 1.1).toNonIndexed(); g.translate(x, -0.55, z); pos.push(...g.attributes.position.array); } const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); return geo; };
  for (const [n, z] of [['Cylinder.000', 2.0], ['Cylinder.001', -2.0]]) { const a = new THREE.Mesh(islands(z), nm('rubber')); a.name = n; root.add(a); }
  return root;
}

// —— 卡通车 fake（threejs_role: wheel/headlight/siren/shadow_proxy）——
function fakeCartoonCarTemplate({ police = false } = {}) {
  const root = new THREE.Group();
  const nm = (n) => { const m = new THREE.MeshStandardMaterial(); m.name = n; return m; };
  const role = (o, r, extra) => { o.userData.threejs_role = r; Object.assign(o.userData, extra || {}); return o; };
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.9, 4.4), nm('mat_body_toy_blue')); body.position.y = 0.85; role(body, 'body'); root.add(body);
  // 车头 +z：headlight 在 +z
  for (const x of [-0.6, 0.6]) { const h = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.15, 0.1), nm('mat_breakable_warm_headlight')); h.position.set(x, 0.8, 2.25); role(h, 'headlight'); root.add(h); }
  if (police) {
    const r = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.1, 0.15), nm('mat_breakable_siren_red')); r.position.set(-0.2, 1.4, 0.2); role(r, 'siren'); root.add(r);
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.1, 0.15), nm('mat_breakable_siren_blue')); b.position.set(0.2, 1.4, 0.2); role(b, 'siren'); root.add(b);
  }
  // shadow_proxy 应被剔除
  const sh = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.04, 4.6), nm('mat_dark_trim')); sh.position.y = 0.03; role(sh, 'shadow_proxy', { render_helper: true }); root.add(sh);
  // 4 轮：spin_axis X，位于 ±x（左右），±z（前后）；轮心 y=0.4
  for (const [x, z, tag] of [[-1.0, 1.2, 'FL'], [1.0, 1.2, 'FR'], [-1.0, -1.2, 'RL'], [1.0, -1.2, 'RR']]) {
    const tire = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.8, 0.8), nm('mat_soft_black_rubber'));
    tire.position.set(x, 0.4, z); role(tire, 'wheel', { spin_axis: 'X', detachable: true }); root.add(tire);
    void tag;
  }
  return root;
}

// —— 卡通 NPC fake（人形关节链 + head 朝 +z）——
function fakeNpcHuman({ prefix = 'npc' } = {}) {
  const root = new THREE.Group();
  const nm = (n) => { const m = new THREE.MeshStandardMaterial(); m.name = n; return m; };
  const joint = (name, suf, parent) => { const o = new THREE.Group(); o.name = `${prefix}_${name}`; o.userData.threejs_role = 'joint'; o.userData.joint_name = o.name; (parent || root).add(o); void suf; return o; };
  const rootM = joint('root_motion', 'root'); rootM.userData.threejs_role = 'root_motion';
  const hips = joint('hips', 'hips', rootM); hips.position.y = 0.95;
  const spine = joint('spine', 'spine', hips); spine.position.y = 0.35;
  const head = joint('head_joint', 'head', spine); head.position.y = 0.5;
  const hm = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.45, 0.4), nm('mat_warm_skin')); hm.position.set(0, 0, 0.05); head.add(hm);
  for (const s of ['L', 'R']) {
    const sh = joint(`shoulder_${s}`, 'shoulder', spine); sh.position.set(s === 'L' ? -0.3 : 0.3, 0.2, 0);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.4, 0.12), nm('mat_police_uniform_blue')); arm.position.y = -0.2; sh.add(arm);
    const knee = joint(`knee_${s}`, 'knee', hips); knee.position.set(s === 'L' ? -0.15 : 0.15, -0.1, 0);
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.7, 0.14), nm('mat_dark_pants')); leg.position.y = -0.35; knee.add(leg);
  }
  return root;
}

// —— 卡通 NPC fake（四足 dog + tail）——
function fakeNpcQuad({ prefix = 'dog' } = {}) {
  const root = new THREE.Group();
  const nm = (n) => { const m = new THREE.MeshStandardMaterial(); m.name = n; return m; };
  const j = (name, role, parent, y) => { const o = new THREE.Group(); o.name = `${prefix}_${name}`; o.userData.threejs_role = role; (parent || root).add(o); if (y !== undefined) o.position.y = y; return o; };
  j('root_motion', 'root_motion');
  const body = j('body_joint', 'joint', root, 0.45);
  const bm = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.62), nm('mat_fur')); bm.position.set(0, 0, 0.1); body.add(bm);
  const head = j('head_joint', 'joint', body); head.position.set(0, 0.12, 0.4);
  head.add(new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.22, 0.24), nm('mat_fur')));
  const tail = j('tail_joint', 'tail', body); tail.position.set(0, 0.1, -0.35);
  tail.add(new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.07, 0.24), nm('mat_fur')));
  for (const s of ['L', 'R']) {
    const fp = j(`front_paw_${s}`, 'joint', body); fp.position.set(s === 'L' ? -0.1 : 0.1, -0.15, 0.24);
    fp.add(new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.3, 0.09), nm('mat_fur')));
    const bp = j(`back_paw_${s}`, 'joint', body); bp.position.set(s === 'L' ? -0.1 : 0.1, -0.15, -0.24);
    bp.add(new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.3, 0.09), nm('mat_fur')));
  }
  return root;
}

// —— 卡通武器 fake（first_person_mount + muzzle 在 +x → 应归一到 -z）——
function fakeWeaponTemplate({ muzzleDir = 'x' } = {}) {
  const root = new THREE.Group();
  const nm = (n) => { const m = new THREE.MeshStandardMaterial(); m.name = n; return m; };
  const role = (o, r) => { o.userData.threejs_role = r; return o; };
  const rec = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.25, 0.18), nm('mat_soft_gunmetal')); rec.position.set(0, 0.18, 0); role(rec, 'receiver'); root.add(rec);
  const mz = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.14), nm('mat_matte_black'));
  if (muzzleDir === 'x') mz.position.set(1.6, 0.2, 0); else mz.position.set(0, 0.2, 1.6);
  role(mz, 'muzzle'); root.add(mz);
  const mount = new THREE.Object3D(); mount.position.set(-0.1, -0.05, 0.05); role(mount, 'first_person_mount'); root.add(mount);
  const lens = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.1, 0.1), nm('mat_scope_blue_glass')); lens.position.set(mz.position.x, 0.4, mz.position.z); role(lens, 'scope_lens_rear'); root.add(lens);
  return root;
}

/* ============ 1. 卡通车归一化 ============ */
const { normalizeCartoonCar, rollCartoonWheel } = await mod('world/CartoonCar.js');
const cc = normalizeCartoonCar(fakeCartoonCarTemplate({ police: true }), 4.7, '#ff2b2b');
cc.updateMatrixWorld(true);
check('cartoon car: 4 wheels', cc && cc.userData.wheels.length === 4);
const cbox = new THREE.Box3().setFromObject(cc);
check('cartoon car: grounded', Math.abs(cbox.min.y) < 0.05);
// shadow_proxy 剔除：无 role==='shadow_proxy' 网格
let helper = 0; cc.traverse((o) => { if (o.userData && o.userData.threejs_role === 'shadow_proxy') helper++; });
check('cartoon car: shadow_proxy stripped', helper === 0);
// 车头朝 +x：headlight 世界 x > 中心
let hx = 0; let hn = 0; cc.traverse((o) => { if (o.isMesh && o.userData.threejs_role === 'headlight') { hx += o.getWorldPosition(new THREE.Vector3()).x; hn++; } });
const ccx = (cbox.min.x + cbox.max.x) / 2;
check('cartoon car: headlight faces +x', hn > 0 && hx / hn > ccx);
// 轮滚动 world 系无滑移：dir+1 与 dir-1 轴向相反且匹配 up×v_c
function firstWheel(scene) { let p = null; scene.traverse((o) => { if (!p && o.userData && o.userData.wheelRadius !== undefined && o.userData.spinAxis) p = o; }); return p; }
function worldSpin(pivot, q0) { const d = pivot.getWorldQuaternion(new THREE.Quaternion()).multiply(q0.invert()); if (d.w < 0) d.set(-d.x, -d.y, -d.z, -d.w); const ang = 2 * Math.acos(Math.min(1, d.w)); const s = Math.sqrt(Math.max(1e-12, 1 - d.w * d.w)); return { axis: new THREE.Vector3(d.x / s, d.y / s, d.z / s), ang }; }
function cartoonWheelScene(dir) {
  const s = new THREE.Scene();
  const car = normalizeCartoonCar(fakeCartoonCarTemplate(), 4.7, null);
  // 模拟车流摆位：outer 旋转 + 前进方向 up×v_c
  const fwdv = new THREE.Vector3(dir, 0, 0);
  const wAxis = new THREE.Vector3(0, 1, 0).cross(fwdv).normalize();
  s.add(car); s.updateMatrixWorld(true);
  const w = firstWheel(s);
  const q0 = w.getWorldQuaternion(new THREE.Quaternion());
  for (let i = 0; i < 6; i++) rollCartoonWheel(w, wAxis, 0.2);
  const ws = worldSpin(w, q0);
  return { ws, wAxis };
}
const cwPos = cartoonWheelScene(1);
check('cartoon wheel no-slip dir+1', cwPos.ws.axis.dot(cwPos.wAxis) > 0.9 && cwPos.ws.ang > 0.5);

/* ============ 2. 警灯爆闪 wiring（PoliceSystem）============ */
const { createPoliceCarGLB } = await mod('world/PoliceSystem.js');
const pc = createPoliceCarGLB({ police: fakeCartoonCarTemplate({ police: true }), small: fakeCartoonCarTemplate(), truck: fakeCartoonCarTemplate() });
check('police cartoon: builtin siren pulseMat', !!pc && pc.pulseMat === true && pc.car && pc.car.userData.sirens);

/* ============ 3. 卡通 NPC 归一化 + 步态接口 ============ */
const { buildCartoonNpc } = await mod('world/CartoonNpc.js');
const npc = buildCartoonNpc(fakeNpcHuman({ prefix: 'p' }), 'human');
check('npc human: 4 joint pivots', npc.parts.pivots.length === 4);
check('npc human: has mats', npc.parts.mats.length >= 1);
const nbox = new THREE.Box3().setFromObject(npc.group);
check('npc human: grounded', Math.abs(nbox.min.y) < 0.05);
check('npc human: height ~1.75m', nbox.max.y - nbox.min.y > 1.3 && nbox.max.y - nbox.min.y < 2.2);
// 头朝 +z：head_joint 世界 z > 中心
const headNode = npc.parts && npc.group.getObjectByName('p_head_joint');
let hz = null; if (headNode) hz = headNode.getWorldPosition(new THREE.Vector3()).z;
const nz = (nbox.min.z + nbox.max.z) / 2;
check('npc human: faces +z', hz !== null && hz > nz);
const quad = buildCartoonNpc(fakeNpcQuad({ prefix: 'd' }), 'dog');
check('npc quad: 4 paw pivots + tail', quad.parts.pivots.length === 4 && !!quad.parts.tail);
// 步态写入不报错（既有 Agent/Cop 用 rotation.x）
quad.parts.pivots.forEach((p, i) => (p.rotation.x = 0.3 * quad.parts.opposite[i]));
check('npc quad: gait writes rotation.x', Math.abs(quad.parts.pivots[0].rotation.x) > 0.1);

/* ============ 4. 卡通武器视图模型 ============ */
const { buildCartoonWeapon } = await mod('world/CartoonWeapon.js');
for (const dir of ['x', 'z']) {
  const w = buildCartoonWeapon(fakeWeaponTemplate({ muzzleDir: dir }), 0.85);
  w.updateMatrixWorld(true);
  const mb = new THREE.Box3().setFromObject(w).getSize(new THREE.Vector3());
  const len = Math.max(mb.x, mb.z);
  const mzw = w.getObjectByProperty('type', 'Mesh') && (() => { let mz = null; w.traverse((o) => { if (o.isMesh && o.userData.threejs_role === 'muzzle') mz = o.getWorldPosition(new THREE.Vector3()); }); return mz; })();
  check(`weapon(${dir}): muzzle faces -z`, !!mzw && mzw.z < -len * 0.25);
  check(`weapon(${dir}): scaled to target len`, len > 0.5 && len < 1.4);
  check(`weapon(${dir}): muzzleFx anchor present`, !!w.userData.muzzleFx);
}

/* ============ 5. AgentBuilder + PoliceSystem 用 GLB fake 跑通 ============ */
const { buildAgents } = await mod('world/AgentBuilder.js');
const colliders = { boxes: [], circles: [] };
const ag = buildAgents(new THREE.Scene(), colliders, {
  humans: 3, dogs: 2,
  npcTemplates: { citizen_male: fakeNpcHuman({ prefix: 'm' }), citizen_female: fakeNpcHuman({ prefix: 'f' }), athlete: fakeNpcHuman({ prefix: 'a' }), rioter: fakeNpcHuman({ prefix: 'r' }), dog: fakeNpcQuad({ prefix: 'd' }), cat: fakeNpcQuad({ prefix: 'c' }) },
});
let npcGroups = 0; ag.list.forEach((a) => { if (a.model.parts.mixer) npcGroups++; });
check('agents: built from GLB templates', ag.count === 5 && npcGroups === 5);
for (let i = 0; i < 60; i++) ag.update(0.05, { x: 0, z: 0 });
check('agents: update loop no throw', true);
const a0 = ag.list[0];
const hitRes = ag.attack(a0.x - 0.6, a0.z, 1, 0, { dmg: 200, range: 2.5 });
check('agents: melee attack lands', hitRes.hits > 0);
ag.list.forEach((a) => a.takeHit(a.x - 1, a.z, 120));
check('agents: takeHit sets down', ag.list.some((a) => a.downT > 0));
for (let i = 0; i < 100; i++) ag.update(0.05, { x: 0, z: 0 });
check('agents: down agents respawn', ag.list.some((a) => a.downT <= 0));

/* ============ 6. PoliceSystem 全流程（卡通车 + GLB 警察）============ */
const { PoliceSystem } = await mod('world/PoliceSystem.js');
const { Sfx } = await mod('core/Sfx.js');
const sfxP = new Sfx();
const realRandom = Math.random; Math.random = () => 0.5;
const pol = new PoliceSystem({ scene: new THREE.Scene(), colliders, sfx: sfxP });
pol.template = { police: fakeCartoonCarTemplate({ police: true }), small: fakeCartoonCarTemplate(), truck: fakeCartoonCarTemplate() };
pol.npcTemplate = fakeNpcHuman({ prefix: 'cop' });
let fired = false; pol.onPlayerHit = () => { fired = true; };
pol.reportCrime(2, 2);
for (let i = 0; i < 600; i++) pol.update(0.05, { x: 4, z: 4 });
check('police: cartoon car + GLB cop arrived', pol.state === 'arrived' && !!pol.cop && !!pol.car.car);
for (let i = 0; i < 600; i++) pol.update(0.05, { x: 4, z: 4 });
check('police: GLB cop fires', fired === true);
Math.random = realRandom;

/* ============ 结果 ============ */
console.log(`\n--- ${failed ? 'SMOKE FAILED' : 'SMOKE TEST PASS'} (${passed} passed, ${failed} failed) ---`);
if (failed) process.exit(1);
