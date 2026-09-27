// unit-world.mjs — 纯逻辑单元测试（无浏览器 / 无 WebGL）。
// 运行：node --import ./scripts/register-loader.mjs scripts/unit-world.mjs
import * as THREE from 'three';
globalThis.THREE = THREE;

const { TerrainSampler } = await import('../src/world/TerrainSampler.js');
const { makeHeightField } = await import('../src/planet/Land.js');
const { latLonToVector3, vector3ToLatLon, alignObjectToSurface } = await import('../src/utils/GeoUtils.js');

let pass = 0, fail = 0;
const ok = (name, cond, extra = '') => {
  if (cond) { pass++; console.log('  ok  ' + name); }
  else { fail++; console.log('  XX  ' + name + (extra ? '  ' + extra : '')); }
};

console.log('--- GeoUtils 经纬度往返 ---');
let maxErr = 0;
for (let i = 0; i < 3000; i++) {
  const lat = Math.random() * 160 - 80, lon = Math.random() * 360 - 180;
  const v = latLonToVector3(lat, lon, 100, new THREE.Vector3());
  const back = vector3ToLatLon(v);
  const dLon = ((back.lon - lon + 540) % 360) - 180;
  maxErr = Math.max(maxErr, Math.abs(back.lat - lat), Math.abs(dLon));
}
ok('往返误差 < 1e-6', maxErr < 1e-6, 'maxErr=' + maxErr.toExponential(2));

console.log('--- alignObjectToSurface：局部 +Y == 球面外法线（§14 球面站立）---');
let worstAng = 0, posBad = 0;
for (let i = 0; i < 600; i++) {
  const lat = Math.random() * 160 - 80, lon = Math.random() * 360 - 180;
  const o = new THREE.Object3D();
  const pos = latLonToVector3(lat, lon, 100, new THREE.Vector3());
  alignObjectToSurface(o, pos, null, { upAxis: 'y', forwardAxis: 'z' });
  const up = new THREE.Vector3(0, 1, 0).applyQuaternion(o.quaternion).normalize();
  const ang = THREE.MathUtils.radToDeg(Math.acos(THREE.MathUtils.clamp(up.dot(pos.clone().normalize()), -1, 1)));
  worstAng = Math.max(worstAng, ang);
  if (o.position.distanceTo(pos) > 1e-6) posBad++;
}
ok('UP 严格对齐法线（偏差 < 0.01°）', worstAng < 0.01, 'worst=' + worstAng.toExponential(2));
ok('position 被正确写入', posBad === 0, 'bad=' + posBad);

console.log('--- 北极↑ / 南极↓ / 赤道→ 肉眼可辨 ---');
const upAt = (lat, lon) => {
  const o = new THREE.Object3D();
  alignObjectToSurface(o, latLonToVector3(lat, lon, 100, new THREE.Vector3()));
  return new THREE.Vector3(0, 1, 0).applyQuaternion(o.quaternion).normalize();
};
ok('北极 UP≈+Y', upAt(89.9, 20).y > 0.999);
ok('南极 UP≈-Y', upAt(-89.9, 20).y < -0.999);
ok('赤道 UP 水平(|y|<0.02)', Math.abs(upAt(0, 0).y) < 0.02);

console.log('--- forwardHint：船头沿航线切线（§18）---');
{
  const pos = latLonToVector3(10, 20, 100, new THREE.Vector3());
  const fwd = latLonToVector3(20, 30, 100, new THREE.Vector3()).sub(pos);
  const o = new THREE.Object3D();
  alignObjectToSurface(o, pos, fwd, { upAxis: 'y', forwardAxis: 'z' });
  const fWorld = new THREE.Vector3(0, 0, 1).applyQuaternion(o.quaternion).normalize();
  const upW = new THREE.Vector3(0, 1, 0).applyQuaternion(o.quaternion).normalize();
  const radial = pos.clone().normalize();
  ok('forward 垂直于法线（在切平面内）', Math.abs(fWorld.dot(radial)) < 0.02, 'dot=' + fWorld.dot(radial).toFixed(4));
  ok('up 仍是法线', upW.dot(radial) > 0.999);
  ok('forward 与期望切线同向', fWorld.dot(fwd.clone().projectOnPlane(radial).normalize()) > 0.99);
}

console.log('--- TerrainSampler 与陆地高度场同源（§落位不悬浮）---');
const field = makeHeightField(1.0);
const sampler = new TerrainSampler(field);
let mismatch = 0;
for (let i = 0; i < 800; i++) {
  const lat = Math.random() * 140 - 70, lon = Math.random() * 360 - 180;
  if (Math.abs(sampler.heightAt(lat, lon) - field.sample({ lat, lon })) > 1e-9) mismatch++;
}
ok('heightAt == field.sample', mismatch === 0, 'mismatch=' + mismatch);

console.log('--- 6 个设计港口都能找到可建造陆地 ---');
const PORTS = [
  ['Port Royal', 22, -46], ['Skull Bay', 6, 70], ['Golden Harbor', 34, 146],
  ['Turtle Island', -18, -46], ['Storm Port', 12, 100], ['Emerald Cove', -2, -100],
];
for (const [name, lat, lon] of PORTS) {
  const b = sampler.nearestBuildable(lat, lon, 28, 1.2);
  ok('可建造 ' + name, !!b, b ? '(' + b.lat.toFixed(1) + ',' + b.lon.toFixed(1) + ' h=' + b.h.toFixed(2) + ')' : '未找到!');
}

console.log('--- 港口聚落落点：可建造 + 半径正确 ---');
const landings = sampler.findLandings(22, -46, 14, 7);
ok('聚落落点 > 8 个', landings.length > 8, 'n=' + landings.length);
ok('全部 isBuildable', landings.every((f) => sampler.isBuildable(f.lat, f.lon)));
let rErr = 0;
for (const f of landings) rErr = Math.max(rErr, Math.abs(sampler.positionAt(f.lat, f.lon, 0).length() - (100 + f.h)));
ok('positionAt 半径 == R+height', rErr < 1e-6, 'err=' + rErr.toExponential(2));

console.log('--- scatter 植被撒点全部高于 minH ---');
const spots = sampler.scatter(500, { minH: 0.5 });
ok('撒点 > 0 且达 minH', spots.length > 0 && spots.every((s) => s.h >= 0.5), 'n=' + spots.length);

console.log('--- 陆地覆盖率合理（20%~60%）---');
let land = 0, tot = 4000;
for (let i = 0; i < tot; i++) {
  const lat = Math.asin(Math.random() * 2 - 1) * 180 / Math.PI;
  if (field.sample({ lat, lon: Math.random() * 360 - 180 }) > 0.6) land++;
}
const pct = (100 * land) / tot;
ok('覆盖率 ' + pct.toFixed(1) + '% 在合理区间', pct > 20 && pct < 60);

console.log('');
console.log(fail === 0 ? 'PASS 单元测试全通过 (' + pass + ')' : 'FAIL ' + fail + ' 失败 / ' + pass + ' 通过');
process.exit(fail ? 1 : 0);
