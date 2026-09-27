// Phase 1 headless 单元测试：BoatController 物理收敛性 + sampleWater 数学
import assert from "node:assert";

// ---- 浏览器桩 ----
const listeners = {};
global.window = {
  devicePixelRatio: 1,
  innerWidth: 800,
  innerHeight: 600,
  addEventListener: (ev, fn) => { (listeners[ev] ||= []).push(fn); },
};
global.document = { getElementById: () => null };

const { CONFIG } = await import("../src/config.js");
const { sampleWater } = await import("../src/water/Water.js");
const { BoatController } = await import("../src/boat/BoatController.js");

// 假 THREE.Group
const FakeObj = () => ({ position: {x:0,y:0,z:0, copy(){return this;}, clone(){return {...this};}}, rotation: {set(){}} });

function makeInput(held = new Set()) {
  return { isDown: (a) => held.has(a), wasPressed: () => false, endFrame(){} };
}

// 1) sampleWater：有起伏、法线单位化、随时间变化
const w1 = sampleWater(3, 5, 0);
const w2 = sampleWater(3, 5, 2.5);
const nlen = Math.hypot(w1.nx, w1.ny, w1.nz);
assert(Math.abs(nlen - 1) < 1e-6, "法线应为单位向量");
assert(Math.abs(w1.y - w2.y) > 1e-4, "水面应随时间变化");
console.log("PASS sampleWater: waves + unit normal + time-varying");

// 2) 全油门：速度趋近 maxSpeed 且不发散
{
  const c = new BoatController(FakeObj(), makeInput(new Set(["throttle"])));
  let t = 0;
  for (let i = 0; i < 600; i++) { c.update(1/60, t += 1/60); }
  assert(c.speed > CONFIG.boat.maxSpeed * 0.95 && c.speed <= CONFIG.boat.maxSpeed + 1e-6,
    `全油门应收敛到 maxSpeed, got ${c.speed}`);
  console.log(`PASS throttle: speed -> ${c.speed.toFixed(2)} (max ${CONFIG.boat.maxSpeed})`);
}

// 3) 松油门：水阻使速度衰减到 0
{
  const c = new BoatController(FakeObj(), makeInput(new Set(["throttle"])));
  let t = 0;
  for (let i = 0; i < 180; i++) c.update(1/60, t += 1/60);
  c.input = makeInput(new Set());
  for (let i = 0; i < 720; i++) c.update(1/60, t += 1/60);
  assert(Math.abs(c.speed) < 0.1, `松油门应停船, got ${c.speed}`);
  console.log("PASS drag: coast -> stop");
}

// 4) 转向：持续右转使 heading 单调变化且位置移动有限
{
  const c = new BoatController(FakeObj(), makeInput(new Set(["throttle"])));
  let t = 0;
  for (let i = 0; i < 120; i++) c.update(1/60, t += 1/60);
  c.input = makeInput(new Set(["throttle","right"]));
  const h0 = c.heading;
  for (let i = 0; i < 600; i++) c.update(1/60, t += 1/60);
  assert(h0 - c.heading > 2, `右转应减小航向, got ${h0} -> ${c.heading}`);
  assert(Number.isFinite(c.position.x) && Number.isFinite(c.position.z), "位置应有限");
  console.log(`PASS steering: heading ${h0.toFixed(2)} -> ${c.heading.toFixed(2)}`);
}

// 5) 倒车限速
{
  const c = new BoatController(FakeObj(), makeInput(new Set(["brake"])));
  let t = 0;
  for (let i = 0; i < 600; i++) c.update(1/60, t += 1/60);
  assert(c.speed >= -CONFIG.boat.maxReverse - 1e-6, `倒车限速, got ${c.speed}`);
  console.log(`PASS reverse: speed ${c.speed.toFixed(2)} >= -${CONFIG.boat.maxReverse}`);
}

// 6) 转向惯性：steer 不是瞬时满舵
{
  const c = new BoatController(FakeObj(), makeInput(new Set(["throttle"])));
  let t = 0;
  for (let i = 0; i < 60; i++) c.update(1/60, t += 1/60);
  c.input = makeInput(new Set(["throttle","left"]));
  c.update(1/60, t += 1/60);
  assert(Math.abs(c.steer) < 1 && Math.abs(c.steer) > 0.001, `舵量应平滑过渡, got ${c.steer}`);
  console.log(`PASS steer inertia: first-frame steer ${c.steer.toFixed(3)}`);
}

console.log("ALL PHASE-1 HEADLESS TESTS PASSED");
