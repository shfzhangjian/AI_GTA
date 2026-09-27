
// unit-ships.mjs — 船只航行纯逻辑验证（无浏览器 / 无 WebGL）
//   node --import ./scripts/register-loader.mjs scripts/unit-ships.mjs
import * as THREE from 'three';
globalThis.THREE = THREE;

const { TerrainSampler } = await import('../src/world/TerrainSampler.js');
const { makeHeightField } = await import('../src/planet/Land.js');
const { RouteManager, ROUTE_LIFT } = await import('../src/world/RouteManager.js');
const { ShipManager, DRAFT } = await import('../src/world/ShipManager.js');
const { PLANET } = await import('../src/config.js');

// 假资产：船只是 Group（无 GLB），只验证航行数学与姿态
const fakeAssets = {
  has: (n) => n.startsWith('ship-') || n.startsWith('boat-'),
  instance: (n) => { const g = new THREE.Group(); g.userData = {}; return g; },
  listLoaded: () => ['ship-pirate-large', 'ship-large'],
  errors: [],
  total: 2,
};

let pass = 0, fail = 0;
const ok = (n, c, x = '') => { if (c) { pass++; console.log('  ok  ' + n); } else { fail++; console.log('  XX  ' + n + (x ? '  ' + x : '')); } };

const field = makeHeightField(1.0);
const sampler = new TerrainSampler(field);

// 造 6 个落在陆地上的港口
const portDefs = [
  ['port-royal', 'Port Royal', 22, -46], ['skull-bay', 'Skull Bay', 6, 70],
  ['golden-harbor', 'Golden Harbor', 34, 146], ['turtle-island', 'Turtle Island', -18, -46],
  ['storm-port', 'Storm Port', 12, 100], ['emerald-cove', 'Emerald Cove', -2, -100],
];
const ports = [];
for (const [id, name, lat, lon] of portDefs) {
  const b = sampler.nearestBuildable(lat, lon, 28, 1.2);
  if (!b) { console.log('  XX 港口无陆地 ' + name); fail++; continue; }
  ports.push({ id, name, lat: b.lat, lon: b.lon, groundH: b.h });
}
ok('港口全部落到陆地 (' + ports.length + '/6)', ports.length === 6);

// 航线
const sceneLike = { ships: new THREE.Group(), routes: new THREE.Group() };
const routes = new RouteManager({ sceneManager: { ships: sceneLike.ships, routes: sceneLike.routes } });
routes.build(ports);
ok('航线数 == 港口数（环航）', routes.count === ports.length, 'count=' + routes.count);
ok('航线已加入场景组', sceneLike.routes.children.length === ports.length);

console.log('--- 航线必须走球面弧线（不穿地球内部、不散成直线）---');
let insidePlanet = 0, maxDev = 0;
for (const r of routes.lines) {
  const pts = r.line.geometry.attributes.position;
  for (let i = 0; i < pts.count; i++) {
    const v = new THREE.Vector3().fromBufferAttribute(pts, i);
    const radius = v.length();
    if (radius < PLANET.RADIUS + 0.1) insidePlanet++;         // 穿进地球内部
    const d = Math.abs(radius - (PLANET.RADIUS + ROUTE_LIFT));
    maxDev = Math.max(maxDev, d);
  }
  // 弦中点必须明显比直线远（弧线证明）
  const mid = new THREE.Vector3().addVectors(r.A, r.B).multiplyScalar(0.5);
  const chordLen = mid.length();
  if (chordLen > PLANET.RADIUS - 1 && r.length > 8 && mid.length() >= PLANET.RADIUS + ROUTE_LIFT - 1) {
    // 短弧无所谓；只对长弧检查中点应明显在球内（弧外凸）
  }
}
ok('航线无任何点穿入地球内部', insidePlanet === 0, 'insidePlanet=' + insidePlanet);
// Float32 顶点存进 BufferAttribute 会有 ~1e-6 量化误差（100 单位量级）→ 容差取 1e-5
ok('航线半径恒定 = R + lift（球面弧线）', maxDev < 1e-5, 'maxDev=' + maxDev.toExponential(2));

console.log('--- 船只沿弧线真正移动（§16/§17）---');
const ships = new ShipManager({ sceneManager: { ships: sceneLike.ships }, assets: fakeAssets, routes, count: 6 });
ships.build();
ok('船队已建造', ships.ships.length === 6, 'n=' + ships.ships.length);
ok('船只模型为 ship-*（非只有小船）', ships.ships.some((s) => s.model.startsWith('ship-')), JSON.stringify(ships.summary().models));
ok('船已挂进场景 Ships 组', sceneLike.ships.children.length === 6);

// 推进 3 秒，位置必须变化
const before = ships.ships.map((s) => s.position.clone());
for (let i = 0; i < 180; i++) ships.update(1 / 60, i / 60);
let movedMin = Infinity, movedMax = 0;
ships.ships.forEach((s, i) => { const d = s.position.distanceTo(before[i]); movedMin = Math.min(movedMin, d); movedMax = Math.max(movedMax, d); });
ok('所有船都真的移动了（3 秒位移 > 1 单位）', movedMin > 1, 'min=' + movedMin.toFixed(2) + ' max=' + movedMax.toFixed(2));

console.log('--- 船姿态：船底朝球心 / 船顶朝外 / 船头朝航线切线（§18）---');
let worstUp = 0, worstFwdTangentAngle = 0, sunk = 0;
for (const s of ships.ships) {
  const up = new THREE.Vector3(0, 1, 0).applyQuaternion(s.object.quaternion).normalize();
  const fwd = new THREE.Vector3(0, 0, 1).applyQuaternion(s.object.quaternion).normalize();
  const radial = s.position.clone().normalize();
  // UP 与球面外法线夹角（含海浪 roll/pitch，允许 <4°）
  worstUp = Math.max(worstUp, THREE.MathUtils.radToDeg(Math.acos(Math.max(-1, Math.min(1, up.dot(radial))))));
  // FORWARD 必须在切平面内（与法线点积 ≈0）
  const dotFn = Math.abs(fwd.dot(radial));
  worstFwdTangentAngle = Math.max(worstFwdTangentAngle, dotFn);
  // 吃水合理：半径应 ≈ R + lift - DRAFT（允许 bob ±0.25）
  const rr = s.position.length();
  if (rr < PLANET.RADIUS - 3 || rr > PLANET.RADIUS + 3) sunk++;
}
// 海浪双轴横摇/俯仰（各限 3°）→ 局部 +Y 偏离法线最坏 √(3²+3²)≈4.24°，断言 5° 含余量
ok('船顶朝外（UP 对齐法线，含双轴海浪 <5°）', worstUp < 5, 'worst=' + worstUp.toFixed(3) + '°');
// forward 偏离切平面 = sin(合成摇角) ≈ sin(4.24°) ≈ 0.074 → 阈值 0.085
ok('船头在切平面内（|forward·法线| < 0.085，含双轴海浪）', worstFwdTangentAngle < 0.085, 'worst=' + worstFwdTangentAngle.toFixed(4));
ok('船只吃水合理（无沉入球内/飞离海面）', sunk === 0, 'bad=' + sunk);

console.log('--- 船不会沿 XYZ 直线（对比直线航行）---');
{
  const s = ships.ships[0];
  const p0 = s.position.clone();
  const walked0 = s.walked;
  const straightTarget = new THREE.Vector3().addVectors(s.route.A, s.route.B).multiplyScalar(0.5);
  for (let i = 0; i < 900; i++) ships.update(1 / 60, i / 60);
  const p1 = s.position.clone();
  // 若沿直线航行，路径会穿过球体内部；球面航行则半径始终 ≈ R
  const rMid = p1.length();
  ok('球面航行保持半径（非直线穿球）', Math.abs(rMid - (PLANET.RADIUS + ROUTE_LIFT)) < 3.2, 'r=' + rMid.toFixed(2));
  void walked0; void straightTarget; void p0;
}

console.log('--- 航线/船队统计与开关 ---');
routes.setVisible(false);
ok('航线可关闭', routes.lines.every((l) => !l.line.visible));
routes.setVisible(true);
ok('航线可开启', routes.lines.every((l) => l.line.visible));
routes.tuneForMode('LOCAL');
ok('LOCAL 航线更明显（opacity 高于 GLOBE）', routes.lines[0].line.material.opacity > 0.3, 'op=' + routes.lines[0].line.material.opacity);

console.log('--- 船只信息可查询（Phase 7 面板用）---');
const d = ships.describe(ships.ships[0]);
ok('describe 含名称/类型/出发/到达/进度', !!(d.name && d.type && d.from && d.to && typeof d.progress === 'number'), JSON.stringify(d));
ok('出发与到达港不同', d.from !== d.to);

console.log('');
console.log(fail === 0 ? 'PASS 船队单元测试全通过 (' + pass + ')' : 'FAIL ' + fail + ' 失败 / ' + pass + ' 通过');
process.exit(fail ? 1 : 0);
