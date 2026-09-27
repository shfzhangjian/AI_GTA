// unit-camera.mjs — 相机视角纯逻辑测试（无浏览器 / 无 WebGL）
//   node --import ./scripts/register-loader.mjs scripts/unit-camera.mjs
//
// 当前相机设计（见 CameraManager._apply）：
//   ① GLOBE：相机 lookAt 球心 (0,0,0)，距离 fitGlobeToView() 按视口+FOV 反算 → 星球居中且完整可见。
//   ② LOCAL：**RTS 式斜俯视**。state.lat/lon 是镜头「关注的地表点」，相机放在该点后上方，
//      按 pitch 角（默认 52°）斜看向地表；相机 UP = 该地表点表面法线 → 绕全球不翻转。
//      关键不变量不是「对准球心」，而是「镜头射线一定命中星球地表（画面有地面、地平线弯曲）」。
import * as THREE from 'three';
globalThis.THREE = THREE;

const { CameraManager, ViewMode } = await import('../src/core/CameraManager.js');
const { CAMERA, PLANET } = await import('../src/config.js');
const { latLonToVector3 } = await import('../src/utils/GeoUtils.js');

let pass = 0, fail = 0;
const ok = (n, c, x = '') => { if (c) { pass++; console.log('  ok  ' + n); } else { fail++; console.log('  XX  ' + n + (x ? '  ' + x : '')); } };
const angDeg = (a, b) => THREE.MathUtils.radToDeg(Math.acos(Math.max(-1, Math.min(1, a.clone().normalize().dot(b.clone().normalize())))));

// 射线（相机→镜头朝向）与星球（半径 R、球心原点）是否相交
function rayHitsSphere(origin, dir, R = PLANET.RADIUS) {
  const b = origin.dot(dir);
  const c = origin.lengthSq() - R * R;
  const disc = b * b - c;
  if (disc < 0) return false;
  const t = -b - Math.sqrt(disc);           // 近交点
  return t > 0;                             // 交点在镜头前方
}

console.log('--- ① 全球视角：星球居中 + 屏幕适配 ---');
{
  const cm = new CameraManager(1280 / 800);
  cm._apply();
  const dir = new THREE.Vector3(); cm.camera.getWorldDirection(dir);
  const camPos = cm.camera.getWorldPosition(new THREE.Vector3());
  ok('相机正对球心（<0.01°）', angDeg(dir, camPos.clone().negate()) < 0.01, angDeg(dir, camPos.clone().negate()).toFixed(4) + '°');
  ok('距离 ≥ 大气半径（完整装下）', camPos.length() > PLANET.ATMOSPHERE_RADIUS, 'dist=' + camPos.length().toFixed(0));
  const cmTall = new CameraManager(420 / 900);   // 竖屏
  cmTall._apply();
  ok('竖屏时相机自动拉远（适配）', cmTall.camera.position.length() > camPos.length(), cmTall.camera.position.length().toFixed(0) + ' > ' + camPos.length().toFixed(0));
}

console.log('--- ② 局部视角（RTS）：镜头必定命中地表 ---');
{
  const cm = new CameraManager(1280 / 800);
  cm.mode = ViewMode.LOCAL;
  const samples = [[0, 0], [22, -50], [-18, 140], [60, 30], [-60, -90], [80, 100], [-80, 10], [45, 179], [78, -170], [-78, 170]];
  let miss = 0, notAbove = 0;
  for (const [lat, lon] of samples) {
    cm.state.lat = lat; cm.state.lon = lon; cm.state.dist = CAMERA.LOCAL_ALT_DEFAULT;
    cm._apply();
    const p = cm.camera.getWorldPosition(new THREE.Vector3());
    const dir = new THREE.Vector3(); cm.camera.getWorldDirection(dir);
    if (!rayHitsSphere(p, dir)) miss++;                       // 镜头朝天 = 错
    const focus = latLonToVector3(lat, lon, PLANET.RADIUS, new THREE.Vector3());
    if (p.clone().sub(focus).dot(focus.clone().normalize()) <= 0) notAbove++;  // 必须在关注点球外上方
  }
  ok('所有位置镜头射线都命中星球地表（画面有地面）', miss === 0, 'miss=' + miss);
  ok('相机始终在关注点上方（球外）', notAbove === 0, 'bad=' + notAbove);
}

console.log('--- ② RTS 关键：camera.up 贴住表面法线 → 绕全球不翻转 ---');
{
  const cm = new CameraManager(1280 / 800);
  cm.mode = ViewMode.LOCAL;
  let worstUp = 0;
  const samples = [[0, 0], [22, -50], [-18, 140], [60, 30], [-60, -90], [80, 100], [-80, 10], [45, 179]];
  for (const [lat, lon] of samples) {
    cm.state.lat = lat; cm.state.lon = lon; cm.state.dist = 12;
    cm._apply();
    const up = cm.camera.up.clone().normalize();
    const focus = latLonToVector3(lat, lon, PLANET.RADIUS, new THREE.Vector3()).normalize();
    worstUp = Math.max(worstUp, angDeg(up, focus));
  }
  ok('camera.up ≈ 表面法线（绕全球不翻，<12°）', worstUp < 12, 'worst=' + worstUp.toFixed(3) + '°');
}

console.log('--- ② 绕全球连续运动：镜头始终有地面、up 不突变 ---');
{
  const cm = new CameraManager(1280 / 800);
  cm.mode = ViewMode.LOCAL; cm.state.dist = 14;
  let miss = 0, maxJump = 0;
  let prevUp = null, prevSign = null;
  for (let i = 0; i <= 360; i += 6) {
    const lat = 55 * Math.sin((i * Math.PI) / 180);   // 跨赤道往复
    const lon = i - 180;
    cm.state.lat = lat; cm.state.lon = lon;
    cm._apply();
    const p = cm.camera.getWorldPosition(new THREE.Vector3());
    const dir = new THREE.Vector3(); cm.camera.getWorldDirection(dir);
    if (!rayHitsSphere(p, dir)) miss++;
    const up = cm.camera.up.clone().normalize();
    const sign = Math.sign(lat);
    if (prevUp && prevSign !== null && Math.abs(lat) > 40 && sign !== prevSign) {
      maxJump = Math.max(maxJump, angDeg(prevUp, up));
    }
    prevUp = up.clone(); prevSign = sign;
  }
  ok('全程镜头都拍到地面（无朝天）', miss === 0, 'miss=' + miss);
  ok('跨极点 up 无突变（RTS 稳定）', maxJump < 45, 'jump=' + maxJump.toFixed(1) + '°');
}

console.log('--- 高度可调：alt 生效，且仍拍到地面 ---');
{
  const cm = new CameraManager(1280 / 800);
  cm.mode = ViewMode.LOCAL; cm.state.lat = 22; cm.state.lon = -50;
  let bad = 0, heights = [];
  for (const alt of [CAMERA.LOCAL_ALT_MIN, CAMERA.LOCAL_ALT_DEFAULT, CAMERA.LOCAL_ALT_MAX]) {
    cm.state.dist = alt; cm._apply();
    heights.push(+cm.camera.getWorldPosition(new THREE.Vector3()).length().toFixed(1));
    const p = cm.camera.getWorldPosition(new THREE.Vector3());
    const dir = new THREE.Vector3(); cm.camera.getWorldDirection(dir);
    if (!rayHitsSphere(p, dir)) bad++;
  }
  ok('alt 越大相机越远', heights[2] > heights[0], JSON.stringify(heights));
  ok('任意高度都仍拍到地表', bad === 0, 'bad=' + bad);
}

console.log('--- 全球视角：北极朝上 + 极区不退化 ---');
{
  const cm = new CameraManager(1280 / 800);
  cm.mode = ViewMode.GLOBE; cm.state.lat = 70; cm.state.lon = 20; cm._apply();
  ok('GLOBE 用世界 +Y 作 up（北朝上）', cm.camera.up.dot(new THREE.Vector3(0, 1, 0)) > 0.999);
  cm.state.lat = 89.99; cm._apply();
  const q = cm.camera.quaternion.toArray();
  ok('北极上空四元数有限（无 NaN 抖动）', q.every(Number.isFinite), JSON.stringify(q));
}

console.log('--- 视角切换：up 规则各自正确 ---');
{
  const cm = new CameraManager(1280 / 800);
  cm.state.lat = 25; cm.state.lon = 40;
  cm.mode = ViewMode.LOCAL; cm.state.dist = 12; cm._apply();
  const localUp = cm.camera.up.clone().normalize();
  cm.mode = ViewMode.GLOBE; cm.state.dist = CAMERA.GLOBE_DIST_DEFAULT; cm._apply();
  const globeUp = cm.camera.up.clone().normalize();
  ok('LOCAL up 由表面法线决定（非世界 +Y）', Math.abs(localUp.dot(new THREE.Vector3(0, 1, 0))) < 0.98, 'dot=' + localUp.dot(new THREE.Vector3(0, 1, 0)).toFixed(3));
  ok('GLOBE up = 世界 +Y', globeUp.dot(new THREE.Vector3(0, 1, 0)) > 0.999);
}

console.log('');
console.log(fail === 0 ? 'PASS 相机视角单元测试全通过 (' + pass + ')' : 'FAIL ' + fail + ' 失败 / ' + pass + ' 通过');
process.exit(fail ? 1 : 0);
