// Phase 6 headless 单元测试：真实感水面（uniform 波数组 / 双层波纹 GLSL /
// 菲涅耳反射 / 泡沫）+ 喷溅粒子系统 + 落水水花回调 + 画质分档。
// 约束：纯 Node 桩 <60s（当前 <2s）。运行：node test/phase6.test.mjs
import assert from "node:assert";

global.window = { devicePixelRatio: 1, innerWidth: 800, innerHeight: 600, addEventListener() {} };
global.document = {
  getElementById: () => null,
  createElement: () => ({ getContext: () => ({}), width: 0, height: 0 }),
};
global.localStorage = {
  _s: {},
  getItem(k) { return this._s[k] ?? null; },
  setItem(k, v) { this._s[k] = String(v); },
};
global.performance = { now: () => 0 };

const THREE = await import("three");
const { Track } = await import("../src/track/Track.js");
const { CONFIG } = await import("../src/config.js");
const { sampleWater, buildWaveUniforms, createWater } = await import("../src/water/Water.js");
const { createSpraySystem } = await import("../src/water/Spray.js");
const { BoatController } = await import("../src/boat/BoatController.js");

// ============================================================ 1) uniform 数组化：与 CONFIG.waves 同源
{
  const W = buildWaveUniforms(CONFIG.water.waves);
  assert.strictEqual(W.count, CONFIG.water.waves.length);
  assert(W.count <= 8, "波层数不得超过 uniform 数组容量 8");
  // 第 i 层 uniform 的 kdir 长度 = 2π/波长（与 JS sampleWater 同一数学）
  for (let i = 0; i < W.count; i++) {
    const [amp, len, speed] = CONFIG.water.waves[i];
    assert(Math.abs(W.kdirs[i].length() - (2 * Math.PI) / len) < 1e-6, `第 ${i} 层 k 不符`);
    assert.strictEqual(W.amps[i], amp);
    assert.strictEqual(W.speeds[i], speed);
  }
  // 补齐零层：第 7、8 层（超出部分）应为 0 向量，不会引入噪声
  for (let i = CONFIG.water.waves.length; i < 8; i++) {
    assert.strictEqual(W.amps[i], 0);
    assert.strictEqual(W.kdirs[i].length(), 0);
  }
  console.log(`PASS wave uniforms: ${W.count} 层与 CONFIG 同源（单一来源）`);
}

// ============================================================ 2) sampleWater 跳过高频细节波（船体浮动稳定）
{
  const lowWaves = CONFIG.water.waves.filter(([, len]) => len >= 2 * Math.PI);
  assert(lowWaves.length < CONFIG.water.waves.length, "config 应含高频细节波");
  const x = 37.7, z = -91.2;
  // sampleWater 只叠加低频波 → 与"只含低频波"的临时配置结果一致
  const orig = CONFIG.water.waves;
  CONFIG.water.waves = lowWaves;
  const yLowOnly = sampleWater(x, z, 4.3).y;
  CONFIG.water.waves = orig;
  const yMixed = sampleWater(x, z, 4.3).y;
  assert(Math.abs(yLowOnly - yMixed) < 1e-9, "船体采样应完全忽略高频细节波（浮动模型不变）");
  // 高频波存在性（GLSL 波纹来源）
  assert(orig.some(([, len]) => len < 2 * Math.PI), "waves 应含高频细节波层");
  console.log("PASS sampleWater: detail waves excluded from hull bobbing (stable)");
}

// ============================================================ 3) 菲涅耳 + 环境双段反射（着色器源码级断言）
{
  // createWater 返回 mesh；从材质源码验证 Phase 6 关键要素齐全。
  const water = createWater(CONFIG.quality.high);
  const src = water.mesh.material.fragmentShader;
  assert(/reflect\(-V, N\)/.test(src), "应有视线-法线反射向量（环境反射感）");
  assert(/pow\(1\.0 - max\(dot\(N, V\), 0\.0\), 3\.0\)/.test(src), "应有菲涅耳项");
  assert(/sunBand/.test(src) && /env/.test(src), "应有天空/阳光双段环境混合");
  assert(/rippleNormal/.test(src), "应有程序化波纹法线扰动");
  assert(/foamBand/.test(src), "应有泡沫条带");
  assert(/uDetail/.test(src) && water.mesh.material.uniforms.uDetail.value === 1, "high 档波纹开关应开");
  const vsrc = water.mesh.material.vertexShader;
  assert(/uniform float uAmp\[8\]/.test(vsrc) && /for \(int i = 0; i < 8; i\+\+\)/.test(vsrc), "顶点波应走 uniform 数组循环");
  assert(!/const float A0=/.test(vsrc), "不得残留内联波常数（Phase 1 手工同步隐患已根除）");
  // 分档：low 关波纹、网格降档
  const low = createWater(CONFIG.quality.low);
  assert.strictEqual(low.mesh.material.uniforms.uDetail.value, 0, "low 档应关细节法线");
  const segs = (g) => g.attributes.position.count;
  assert(segs(low.mesh.geometry) < segs(water.mesh.geometry), "low 档水面网格应更稀");
  water.update(1.5); low.update(1.5);
  assert.strictEqual(water.mesh.material.uniforms.uTime.value, 1.5);
  console.log("PASS fresnel/env/detail/foam in shader; quality tiers switch geometry+detail");
}

// ============================================================ 4) 喷溅粒子：尾迹随速产生、寿命淡出
{
  const spray = createSpraySystem(CONFIG.quality.high);
  const fakeBoat = (speed, lateral = 0) => ({
    position: { x: 12, y: 0.3, z: -60 }, heading: 0.7, speed, lateral, trapped: 0,
  });
  const b = fakeBoat(14);
  // 高速 1s：应产生尾迹粒子
  for (let i = 0; i < 60; i++) { spray.emitWake(b, 1 / 60, i / 60); spray.update(1 / 60); }
  assert(spray.liveCount() > 10, `高速尾迹应可见, live=${spray.liveCount()}`);
  // 低速 / 被困：不产生
  const before = spray.liveCount();
  const frozen = fakeBoat(0);
  for (let i = 0; i < 60; i++) { spray.emitWake(frozen, 1 / 60, i / 60); spray.update(1 / 60); }
  assert(spray.liveCount() < before + 2, "停船不应喷尾迹");
  // 转弯溅水：大侧滑增量应显著
  const s2 = createSpraySystem(CONFIG.quality.high);
  const straight = fakeBoat(12, 0), carve = fakeBoat(12, 6);
  for (let i = 0; i < 30; i++) { s2.emitWake(straight, 1 / 60, i / 60); s2.update(1 / 60); }
  const n1 = s2.liveCount();
  for (let i = 0; i < 30; i++) { s2.emitWake(carve, 1 / 60, i / 60); s2.update(1 / 60); }
  const n2 = s2.liveCount();
  assert(n2 > n1, `转弯外侧应追加溅水, ${n1}→${n2}`);
  // 淡出归零：停发后全部过期
  const s3 = createSpraySystem(CONFIG.quality.high);
  for (let i = 0; i < 30; i++) { s3.emitWake(carve, 1 / 60, i / 60); s3.update(1 / 60); }
  assert(s3.liveCount() > 0);
  for (let i = 0; i < 60 * 3; i++) s3.update(1 / 60);
  assert.strictEqual(s3.liveCount(), 0, "粒子应按时全部淡出归零");
  console.log("PASS spray: wake@speed / carve splash / lifetime fade");
}

// ============================================================ 5) 落水水花回调（跳台落水联动粒子）
{
  const track = new Track();
  const fakeGroup = () => ({
    position: { copy() {}, set() {}, x: 0, y: 0, z: 0 },
    rotation: { set() {} }, scale: { set() {} }, add() {}, traverse() {},
  });
  const boat = new BoatController(fakeGroup(), { isDown: () => false }, { track });
  const start = track.startLine;
  boat.setPose(start.pos.clone(), Math.atan2(-start.tangent.x, -start.tangent.z));
  const splashes = [];
  boat.onSplash = (airV) => splashes.push(airV);
  // 手动构造空中→落水
  boat.airborne = true;
  boat.airPos = 3;
  boat.airV = 4;
  const dt = 1 / 30;
  for (let i = 0; i < 60 && !splashes.length; i++) boat.update(dt, i * dt);
  assert.strictEqual(splashes.length, 1, `落水应触发水花回调一次, got ${splashes.length}`);
  assert(splashes[0] < 0, "回调应携带向下（负）垂直速度");
  assert(!boat.airborne && boat.splashUp > 0, "落水应恢复水面 + 浮动缓冲");
  // 粒子系统接水花：数量与垂直速度相关
  const spray = createSpraySystem(CONFIG.quality.high);
  const dummy = { position: { x: 0, y: 0, z: 0 } };
  spray.emitSplash(dummy, -2);
  const nSoft = spray.liveCount();
  spray.emitSplash(dummy, -14);
  const nHard = spray.liveCount();
  assert(nHard > nSoft, `重落水水花应更多, ${nSoft}→${nHard}`);
  console.log(`PASS splash callback: airV=${splashes[0].toFixed(1)} 联动粒子`);
}

// ============================================================ 5.5) 起步爆缸爆炸：大爆烟量 + 烟雾粒子存活 + 0 池安全
{
  const spray = createSpraySystem(CONFIG.quality.high);
  spray.emitBlast(0, 0);
  const n0 = spray.liveCount();
  assert(n0 >= 50, `爆缸爆炸应放大量粒子（烟+花 ≥50）, got ${n0}`);
  // 烟雾慢慢飘：2 秒后仍有存活（白水花早落完）
  for (let i = 0; i < 120; i++) spray.update(1 / 60);
  const n2s = spray.liveCount();
  assert(n2s > 0, `烟雾应仍在飘（2s 后存活）, got ${n2s}`);
  // 0 粒子池安静无事
  const s0 = createSpraySystem({ ...CONFIG.quality.low, particles: 0 });
  s0.emitBlast(0, 0); s0.update(1 / 60);
  assert.strictEqual(s0.liveCount(), 0, "0 池 emitBlast 应安静");
  console.log(`PASS blow explosion: ${n0} particles + smoke persists 2s (${n2s} alive) + 0-pool safe`);
}

// ============================================================ 6) 画质分档完整性 + localStorage 覆盖语义
{
  for (const key of ["low", "auto", "high"]) {
    const q = CONFIG.quality[key];
    assert(q.waterSegments > 0 && q.particles >= 0 && typeof q.detailNormals === "boolean");
  }
  assert(CONFIG.quality.low.waterSegments < CONFIG.quality.high.waterSegments);
  assert(CONFIG.quality.low.particles < CONFIG.quality.high.particles);
  // low 档 0 粒子池不崩
  const s0 = createSpraySystem({ ...CONFIG.quality.low, particles: 0 });
  s0.emitWake({ position: { x: 0, y: 0, z: 0 }, heading: 0, speed: 15, lateral: 0, trapped: 0 }, 1 / 60, 1);
  s0.emitSplash({ position: { x: 0, y: 0, z: 0 } }, -10);
  s0.update(1 / 60);
  assert.strictEqual(s0.liveCount(), 0, "0 粒子池应安静无事");
  // localStorage 覆盖键约定（main.pickQuality 语义在此同构验证）
  localStorage.setItem("swr-quality", "low");
  const pick = () => CONFIG.quality[localStorage.getItem("swr-quality")] || CONFIG.quality[CONFIG.defaultQuality];
  assert.strictEqual(pick().name, "low");
  localStorage.setItem("swr-quality", "nonsense");
  assert.strictEqual(pick().name, CONFIG.defaultQuality, "非法档名应回落默认");
  console.log("PASS quality tiers + localStorage override semantics");
}

console.log("ALL PHASE-6 HEADLESS TESTS PASSED");
