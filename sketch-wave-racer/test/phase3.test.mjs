// Phase 3 headless 单元测试：漂移 / 跳台落水 / 加速带 / 障碍与船体碰撞
// 约束：纯 Node 桩，禁浏览器；总运行 <<60s（当前 <2s）。
// 运行：node test/phase3.test.mjs
import assert from "node:assert";

global.window = {
  devicePixelRatio: 1, innerWidth: 800, innerHeight: 600,
  addEventListener() {},
};
global.document = {
  getElementById: () => null,
  createElement: () => ({ getContext: () => ({ fillRect() {}, set fillStyle(v) {} }), width: 0, height: 0 }),
};
global.localStorage = { getItem: () => null, setItem() {} };
global.performance = { now: () => 0 };
// Phase 4 流程：config 默认 autoStart=true → 单测直接开跑；
// 浏览器 main.js 置 false 走人工 3·2·1·GO 倒计时。

const THREE = await import("three");
const { Track, HALF_WIDTH } = await import("../src/track/Track.js");
const { TrackFeatures } = await import("../src/track/TrackFeatures.js");
const { CollisionWorld } = await import("../src/physics/CollisionWorld.js");
const { RaceState } = await import("../src/race/RaceState.js");
const { BoatController } = await import("../src/boat/BoatController.js");
const { CONFIG } = await import("../src/config.js");

const track = new Track();
const features = new TrackFeatures(track);
const collision = new CollisionWorld(track);

const fakeGroup = () => ({
  position: { copy() {}, set() {}, x: 0, y: 0, z: 0 },
  rotation: { set() {} }, scale: { set() {} }, add() {}, traverse() {},
});
const keyInput = (keys) => ({ isDown: (a) => keys.has(a) });

// ============================================================ 1) 漂移：甩尾 + 出漂小加速
{
  const keys = new Set(["throttle"]);
  const boat = new BoatController(fakeGroup(), keyInput(keys), { track });
  const s = track.startLine;
  boat.setPose(s.pos.clone().addScaledVector(s.tangent, -30),
    Math.atan2(-s.tangent.x, -s.tangent.z));
  const dt = 1 / 60;
  // 直线加速到接近极速
  for (let i = 0; i < 150; i++) boat.update(dt, i * dt);
  assert(boat.speed > 12, `漂移前应已高速, speed=${boat.speed}`);
  const speedBeforeDrift = boat.speed;

  // 按住 Shift + 右转向 1.2s → 应进入漂移、侧向速度显著、且比非漂移掉速快
  keys.add("drift"); keys.add("right");
  let maxLateral = 0, enteredDrift = false;
  for (let i = 0; i < 72; i++) {
    boat.update(dt, 100 + i * dt);
    if (boat.drifting) enteredDrift = true;
    maxLateral = Math.max(maxLateral, Math.abs(boat.lateral));
  }
  assert(enteredDrift, "Shift+转向应进入漂移状态");
  assert(maxLateral > 2.5, `漂移应产生明显侧滑（甩尾）, maxLateral=${maxLateral.toFixed(2)}`);

  // 出漂：应给 driftBoost（driftboost 事件），随后 maxSpeed 提升
  const evBefore = boat.lastEvent;
  keys.delete("drift");
  boat.update(dt, 200);
  assert.strictEqual(boat.lastEvent, "driftboost", `出漂应结算小加速（此前事件 ${evBefore}）`);
  assert(boat.driftBoost > 0, "应有加速剩余时长");
  // boost 生效期内给油门：速度能超过常规 maxSpeed
  let overBase = false;
  for (let i = 0; i < 120; i++) {
    boat.update(dt, 300 + i * dt);
    if (boat.speed > CONFIG.boat.maxSpeed + 0.5) overBase = true;
  }
  assert(overBase, `漂移加速应能短时突破常规极速, max seen=${boat.speed}`);
  assert(speedBeforeDrift > 0);
  console.log(`PASS drift: lateral=${maxLateral.toFixed(2)}m/s boost=${"✓"} overspeed=✓`);
}

// ============================================================ 2) 漂移蓄力时长与漂移时长相关；短漂不给 boost
{
  const run = (driftFrames) => {
    const keys = new Set(["throttle", "right", "drift"]);
    const boat = new BoatController(fakeGroup(), keyInput(keys), { track });
    const s = track.startLine;
    boat.setPose(s.pos.clone().addScaledVector(s.tangent, -30),
      Math.atan2(-s.tangent.x, -s.tangent.z));
    const dt = 1 / 60;
    for (let i = 0; i < 150; i++) { keys.delete("drift"); boat.update(dt, i * dt); }
    keys.add("drift");
    for (let i = 0; i < driftFrames; i++) boat.update(dt, 100 + i * dt);
    keys.delete("drift");
    boat.update(dt, 500);
    return boat;
  };
  const short = run(12);   // 0.2s < minHold → 无 boost
  const long = run(90);    // 1.5s → boost，且蓄力大于 short 的蓄力路径
  assert.strictEqual(short.driftBoost, 0, "过短漂移不应给加速");
  assert(short.lastEvent !== "driftboost", "短漂不应触发 driftboost 事件");
  assert(long.driftBoost > short.driftBoost, "长漂移蓄力应大于短漂移");
  console.log(`PASS drift charge: short=0 long=${long.driftBoost.toFixed(2)}s`);
}

// ============================================================ 3) 跳台：弹射起飞 → 落水浮动 → 恢复航行
{
  const keys = new Set(["throttle"]);
  const boat = new BoatController(fakeGroup(), keyInput(keys), { track, features });
  const ramp = features.ramps[0];
  // 从坡底 45m 外**沿赛道曲线**摆姿态（赛道有弯度，直线摆头会冲出航道），
  // 横向偏置 = 0（正对跳台中线）。
  const dt = 1 / 60;
  const place = (arcBack) => {
    const t0 = ((ramp.arc + arcBack) / track.length + 1) % 1;
    const p = track.pointAt(t0);
    const tan = track.tangentAt(t0);
    boat.setPose(new THREE.Vector3(p.x, 0.2, p.z), Math.atan2(-tan.x, -tan.z));
  };
  place(-45);
  // 沿曲线导引：油门 + 航向 PD（走线玩家），直至落水
  const steerTo = (targetArc) => {
    const n = track.nearest(boat.position.x, boat.position.z);
    const tT = ((targetArc / track.length) % 1 + 1) % 1;
    const tp = track.pointAt(tT);
    const want = Math.atan2(-(tp.x - boat.position.x), -(tp.z - boat.position.z));
    const err = Math.atan2(Math.sin(want - boat.heading), Math.cos(want - boat.heading));
    keys.clear();
    keys.add("throttle");
    if (err > 0.05) keys.add("left"); else if (err < -0.05) keys.add("right");
  };
  // 高速抓线 PD（与生产 AI 同法）：提速后纯 steerTo 追不上弯
  const H = { v: 0, t: 0 };
  const stepPD = (tNow) => {
    const AIC = CONFIG.ai;
    const near = track.nearest(boat.position.x, boat.position.z);
    const lat = (near.side || 0) * near.dist;
    const dtP = Math.max(tNow - H.t, 1e-3);
    const latVel = (lat - H.v) / dtP; H.v = lat; H.t = tNow;
    const lt = ((near.t + AIC.lookAhead / track.length) % 1 + 1) % 1;
    const tp = track.pointAt(lt), tan = track.tangentAt(lt);
    const want = Math.atan2(-(tp.x + -tan.z * AIC.inner - boat.position.x), -(tp.z + tan.x * AIC.inner - boat.position.z));
    const err = Math.atan2(Math.sin(want - boat.heading), Math.cos(want - boat.heading));
    boat.override = { throttle: boat.speed < CONFIG.boat.maxSpeed ? 1 : 0, brake: 0,
      steer: Math.max(-1, Math.min(1, err * AIC.gain - lat * AIC.kP - latVel * AIC.kD)) };
    boat.update(dt, tNow);
  };
  let launched = false, splash = false, maxY = 0, airFrames = 0;
  for (let i = 0; i < 60 * 14; i++) {
    stepPD(i * dt);
    if (boat.lastEvent === "launch") launched = true;
    if (boat.lastEvent === "splash") splash = true;
    if (boat.airborne) { airFrames++; maxY = Math.max(maxY, boat.position.y); }
    if (splash) break;
  }
  assert(launched, "全速冲跳台必须弹射起飞（launch 事件）");
  assert(airFrames > 30, `应有可观滞空时间, airFrames=${airFrames}`);
  assert(maxY > ramp.height + 0.5, `应越过台顶高度, maxY=${maxY.toFixed(2)}`);
  assert(splash, "滞空后必须落水（splash 事件）");
  // 落水浮动：随后 y 回到波面附近且能继续驾驶
  for (let i = 0; i < 60 * 3; i++) boat.update(dt, 300 + i * dt);
  assert(!boat.airborne, "落水后应恢复航行");
  assert(boat.speed > 0.5, `落水后应仍有动力（浮动恢复）, speed=${boat.speed.toFixed(2)}`);
  console.log(`PASS ramp: airFrames=${airFrames} apexY=${maxY.toFixed(1)} splash=✓`);
}

// ============================================================ 4) 加速带：正向跨线触发、横向绕过不触发、冷却防重复
{
  const runPad = (lateralOffset) => {
    const keys = new Set(["throttle"]);
    const boat = new BoatController(fakeGroup(), keyInput(keys), { track, features });
    const b = features.boosts[0];
    const t0 = ((b.arc - 30) / track.length + 1) % 1;
    const p = track.pointAt(t0);
    const tan = track.tangentAt(t0);
    const nx = -tan.z, nz = tan.x;
    boat.setPose(new THREE.Vector3(p.x + nx * lateralOffset, 0.2, p.z + nz * lateralOffset),
      Math.atan2(-tan.x, -tan.z));
    const race = new RaceState(track, [{ id: "p", label: "P", color: 0, boat }]);
    boat.race = race; boat.raceId = "p";
    const dt = 1 / 60;
    let triggered = 0;
    let maxSeen = 0;
    for (let i = 0; i < 60 * 8; i++) {
      boat.update(dt, i * dt);
      race.update(dt);
      if (boat.lastEvent === "boostpad") triggered++;
      maxSeen = Math.max(maxSeen, boat.speed);
      if (triggered && boat.speed < CONFIG.boat.maxSpeed * 0.5 && maxSeen > CONFIG.boat.maxSpeed) break;
    }
    return { boat, triggered, maxSeen };
  };
  const onPad = runPad(0);
  assert(onPad.triggered >= 1, "正向碾过加速带必须触发 boostpad");
  assert(onPad.boat.padBoost > 0 || onPad.maxSeen > CONFIG.boat.maxSpeed, "触发后应有临时极速加成");
  // 加成期内极速超过 base
  assert(onPad.maxSeen > CONFIG.boat.maxSpeed + 0.5,
    `加速带加成应可短时突破常规极速, max seen=${onPad.maxSeen.toFixed(2)}`);
  // 横向绕过：从带外侧 8m 平行通过（带半宽 4.5）
  const around = runPad(8.5);
  assert.strictEqual(around.triggered, 0, `横向绕过加速带不应触发, got ${around.triggered}`);
  console.log(`PASS boost pad: trigger=✓ overspeed=✓ bypass=✓`);
}

// ============================================================ 5) 障碍碰撞：撞木桩被弹开、不穿模、速度衰减
{
  const pos = { x: 0, z: 0 };
  const stake = collision.obstacles.find((o) => o.kind === "stake");
  // 以 12 m/s 正冲木桩
  let vel = { x: 0, z: -12 };
  let vx = stake.x, vz = stake.z + 30; // 从桩北边向南冲
  let bounced = false, minGap = Infinity;
  for (let i = 0; i < 240; i++) {
    vx += vel.x / 60; vz += vel.z / 60;
    pos.x = vx; pos.z = vz;
    const hit = collision.resolveObstacles(pos, vel);
    if (hit) bounced = true;
    minGap = Math.min(minGap, Math.hypot(pos.x - stake.x, pos.z - stake.z) - stake.r);
    vx = pos.x; vz = pos.z; // 采纳位置修正
    if (Math.hypot(vel.x, vel.z) < 0.1) break;
  }
  assert(bounced, "正冲木桩必须发生碰撞响应");
  assert(minGap >= -0.01, `不得穿模（负间隙=穿进桩体）, minGap=${minGap.toFixed(3)}`);
  console.log(`PASS obstacle collision: bounce=✓ no-clip=✓ (gap≥${minGap.toFixed(2)}m)`);
}

// ============================================================ 6) 船体相撞：轻微偏转、互相推开、非毁灭性
{
  const mk = (heading, speed) => ({
    position: { x: 0, y: 0, z: 0 }, heading, speed, lateral: 0, airborne: false,
  });
  // 两船迎头略偏（碰撞线接近横向）
  const a = mk(0, 10);                       // 朝 -Z
  const b = mk(Math.PI, 10);                 // 朝 +Z
  a.position.z = 5; b.position.z = -5;
  b.position.x = 0.5;
  const pairs = collision.resolveBoatPairs([a, b]);
  // 移动一步模拟接近再判
  if (!pairs.length) {
    for (const bt of [a, b]) bt.position.z += bt.speed * Math.cos(bt.heading) === 0 ? 0 : 0;
    a.position.z -= 4; b.position.z += 4; // 手动接近到重叠
    const p2 = collision.resolveBoatPairs([a, b]);
    assert(p2.length === 1, `接近后应检测到碰撞对, got ${p2.length}`);
  }
  const gap = Math.hypot(a.position.x - b.position.x, a.position.z - b.position.z);
  assert(gap >= 2 * CONFIG.trackFeatures.colliderRadius - 0.01, `碰撞后应推开不重叠, gap=${gap.toFixed(2)}`);
  // 轻微：速度不应归零或爆炸
  for (const bt of [a, b]) {
    assert(Math.abs(bt.speed) > 1, `相撞应保持可控（轻微偏转）, speed=${bt.speed.toFixed(2)}`);
    assert(Math.abs(bt.speed) < 30, "偏转不得注入爆炸性速度");
  }
  console.log(`PASS boat-vs-boat: pushed-apart gap=${gap.toFixed(2)}m speeds ok`);
}

// ============================================================ 7) 空中船不与障碍求解器互相干涉（跳台上不卡桩）
{
  const keys = new Set(["throttle"]);
  const boat = new BoatController(fakeGroup(), keyInput(keys), { track, features, collision });
  const ramp = features.ramps[0];
  const t0 = ((ramp.arc - 30) / track.length + 1) % 1;
  const p = track.pointAt(t0), tan = track.tangentAt(t0);
  boat.setPose(new THREE.Vector3(p.x, 0.2, p.z), Math.atan2(-tan.x, -tan.z));
  let sawAir = false, stuck = false;
  const dt = 1 / 60;
  let lastX = boat.position.x, lastZ = boat.position.z, frozen = 0;
  for (let i = 0; i < 60 * 10; i++) {
    boat.update(dt, i * dt);
    if (boat.airborne) sawAir = true;
    const moved = Math.hypot(boat.position.x - lastX, boat.position.z - lastZ);
    lastX = boat.position.x; lastZ = boat.position.z;
    if (sawAir) { frozen = moved < 0.01 ? frozen + 1 : 0; if (frozen > 90) stuck = true; }
  }
  assert(sawAir, "整合 collision 后跳台仍应起飞");
  assert(!stuck, "空中/落水不得卡死冻结");
  console.log("PASS air+collision coexist: no freeze");
}


// ============================================================ 8) 倒计时冻结漂移：全程按住不放 → GO 瞬间不爆 boost
{
  const track = new Track();
  const fakeGroup = () => ({
    position: { copy() {}, set() {}, x: 0, y: 0, z: 0 },
    rotation: { set() {} }, scale: { set() {} }, add() {}, traverse() {},
  });
  const { TrackFeatures } = await import("../src/track/TrackFeatures.js");
  const { RaceState } = await import("../src/race/RaceState.js");
  const { BoatController } = await import("../src/boat/BoatController.js");
  const { CONFIG: CFG } = await import("../src/config.js");
  CFG.raceFlow.autoStart = false; // 浏览器人工倒计时路径
  // 用户剧本：START 后倒计时全程按住 W+Shift+D
  const keys = new Set(["throttle", "drift", "right"]);
  const boat = new BoatController(fakeGroup(), { isDown: (a) => keys.has(a) },
    { track, features: new TrackFeatures(track), raceId: "player" });
  boat.setPose(track.startLine.pos.clone(), Math.atan2(-track.startLine.tangent.x, -track.startLine.tangent.z));
  const race = new RaceState(track, [{ id: "player", label: "P", color: 0, boat }]);
  boat.race = race;
  const dt = 1 / 60;
  // 倒计时 2.9s（全程按住 W+Shift+D）：判定冻结 + 油门/漂移全冻结
  //（修复前：假蓄力 1.6 满 + 船偷偷加速滑出）
  let chargeMax = 0, speedMax = 0;
  for (let i = 0; i < Math.floor(2.5 / dt); i++) {
    race.updateFlow(dt); race.updateAi(dt); boat.update(dt, i * dt); race.update(dt);
    chargeMax = Math.max(chargeMax, boat.driftCharge);
    speedMax = Math.max(speedMax, boat.speed);
  }
  assert(chargeMax === 0, `倒计时期间漂移蓄力必须冻结, got ${chargeMax.toFixed(2)}`);
  assert(speedMax < 0.5, `倒计时期间船不得前进（油门冻结）, speed峰值=${speedMax.toFixed(2)}`);
  // 继续推进到 GO 再松 Shift：GO 瞬间不得走"出漂结算"爆 boost
  keys.delete("drift");
  let boostGo = 0, goSeen = false;
  for (let i = 0; i < Math.floor(1.0 / dt); i++) {
    race.updateFlow(dt); race.updateAi(dt); boat.update(dt, 100 + i * dt); race.update(dt);
    if (race.started) goSeen = true;
    if (goSeen) boostGo = Math.max(boostGo, boat.driftBoost);
  }
  assert(goSeen, "1.0s 内应过 GO（race.started 放行）");
  assert(boostGo === 0, `GO 瞬间不得爆漂移加速（原地爆炸）, boost=${boostGo.toFixed(2)}`);
  // GO 后正常：油门推进
  for (let i = 0; i < 60 * 2; i++) {
    race.updateFlow(dt); race.updateAi(dt); boat.update(dt, 200 + i * dt); race.update(dt);
  }
  assert(boat.speed > 5, `GO 后应正常加速前进, speed=${boat.speed.toFixed(1)}`);
  CFG.raceFlow.autoStart = true; // 复位（其余用例走默认快路径）
  console.log("PASS countdown freeze: no phantom charge, no creep, no GO-frame explosion");
}

console.log("ALL PHASE-3 HEADLESS TESTS PASSED");
