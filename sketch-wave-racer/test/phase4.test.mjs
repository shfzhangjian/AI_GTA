// Phase 4 headless 单元测试：AI 走线控制律 + 多人比赛（排名/反超/完赛顺序）
// 约束：纯 Node 桩 <60s（当前 ~10s）。运行：node test/phase4.test.mjs
import assert from "node:assert";

global.window = {
  devicePixelRatio: 1, innerWidth: 800, innerHeight: 600,
  addEventListener() {},
};
global.document = {
  getElementById: () => null,
  createElement: () => ({ getContext: () => ({}), width: 0, height: 0 }),
};
global.localStorage = { getItem: () => null, setItem() {} };
global.performance = { now: () => 0 };
// Phase 4 流程：config 默认 autoStart=true → 单测直接开跑；
// 浏览器 main.js 置 false 走人工 3·2·1·GO 倒计时。

const THREE = await import("three");
const { Track, HALF_WIDTH, TOTAL_LAPS } = await import("../src/track/Track.js");
const { TrackFeatures } = await import("../src/track/TrackFeatures.js");
const { CollisionWorld } = await import("../src/physics/CollisionWorld.js");
const { RaceState } = await import("../src/race/RaceState.js");
const { BoatController } = await import("../src/boat/BoatController.js");
const { CONFIG } = await import("../src/config.js");

const track = new Track();
const fakeGroup = () => ({
  position: { copy() {}, set() {}, x: 0, y: 0, z: 0 },
  rotation: { set() {} }, scale: { set() {} }, add() {}, traverse() {},
});
const start = track.startLine;
const nrm = new THREE.Vector3(-start.tangent.z, 0, start.tangent.x);

// 造一艘带全套 Phase 3/4 ctx 的船并摆到出生格
function mkBoat(id, back, lat, useTrack = true) {
  const withFeat = useTrack ? { track, features: new TrackFeatures(track), collision: new CollisionWorld(track), raceId: id } : {};
  const boat = new BoatController(fakeGroup(), { isDown: () => false }, withFeat);
  const p = start.pos.clone().addScaledVector(start.tangent, -back).addScaledVector(nrm, lat);
  p.y = 0.2;
  boat.setPose(p, Math.atan2(-start.tangent.x, -start.tangent.z));
  return boat;
}

// ============================================================ 1) AI 走线：3 圈完赛、零重置、横向稳定
{
  const boat = mkBoat("ai0", 8, 0);
  const race = new RaceState(track, []);
  race.addAiRacers([{ id: "ai0", label: "AI", color: 0, boat }], [0.9]);
  const e = race.entries[0];
  const dt = 1 / 30;
  let maxDist = 0, resets = 0, done = false;
  for (let i = 0; i < 30 * 260 && !done; i++) {
    race.updateAi(dt); boat.update(dt, i * dt); race.update(dt);
    const n = track.nearest(boat.position.x, boat.position.z, e._hint);
    maxDist = Math.max(maxDist, n.dist);
    if (race.event?.type === "reset") resets++;
    done = e.finished;
  }
  assert(e.finished, `AI 应在 260s 内完 ${TOTAL_LAPS} 圈, lap=${e.lap}`);
  assert.strictEqual(resets, 0, `AI 走线不应触发越界重置, resets=${resets}`);
  assert(maxDist < HALF_WIDTH, `AI 应始终在航道内, maxDist=${maxDist.toFixed(1)}`);
  assert(e.bestLap < 70, `AI 圈速应合理（<70s）, best=${e.bestLap.toFixed(1)}`);
  console.log(`PASS ai line: 3 laps, resets=0, maxDist=${maxDist.toFixed(1)}m best=${e.bestLap.toFixed(1)}s`);
}

// ============================================================ 2) 出生横向偏离下均能完赛（3 条线）
{
  for (const lat of [-9, 0, 9]) {
    const boat = mkBoat("ai", 8, lat);
    const race = new RaceState(track, []);
    race.addAiRacers([{ id: "ai", label: "AI", color: 0, boat }], [0.7]);
    const e = race.entries[0];
    let done = false;
    for (let i = 0; i < 30 * 300 && !done; i++) {
      race.updateAi(1 / 30); boat.update(1 / 30, i / 30); race.update(1 / 30);
      done = e.finished;
    }
    assert(done, `出生横向 ${lat}m 应能完赛, lap=${e.lap}`);
  }
  console.log("PASS ai spawn lanes -9/0/+9 all finish");
}

// ============================================================ 3) 多人比赛：名次实时变化 + 完赛排序
{
  const player = mkBoat("player", 6, 0);
  // 玩家剧本：油门恒开 + 与 AI 同律的横向 PD（熟练但略慢于头名 AI）
  const race = new RaceState(track, [{ id: "player", label: "P", color: 0, boat: player }]);
  player.race = race;
  const ais = [];
  for (let i = 0; i < 3; i++) {
    const b = mkBoat("ai" + i, 10 + i * 3, ((i % 2) - 0.5) * 3);
    b.race = race; b.raceId = "ai" + i;
    ais.push(b);
  }
  race.addAiRacers(ais.map((b, i) => ({ id: "ai" + i, label: "A" + i, color: 0, boat: b })), [0.9, 0.55, 0.2]);
  const all = [player, ...ais];
  for (const b of all) b.mates = () => all.filter((x) => x !== b);
  const pdt = 1 / 30;
  let placeChanged = false, prevPlaces = "";
  let playerFinish = null, finishOrder = [];
  const AI = CONFIG.ai;
  // 玩家导引：完整 PD（含横向速度阻尼——单独 PD 在急弯有极限环，扫参结论）
  const latHist = { v: 0, t: 0 };
  const stepPlayer = (tNow) => {
    const near = track.nearest(player.position.x, player.position.z);
    const lat = (near.side || 0) * near.dist;
    const dtP = Math.max(tNow - latHist.t, 1e-3);
    const latVel = (lat - latHist.v) / dtP;
    latHist.v = lat; latHist.t = tNow;
    const lt = ((near.t + AI.lookAhead / track.length) % 1 + 1) % 1;
    const tp = track.pointAt(lt), tan = track.tangentAt(lt);
    const want = Math.atan2(-(tp.x + -tan.z * AI.inner - player.position.x), -(tp.z + tan.x * AI.inner - player.position.z));
    const err = Math.atan2(Math.sin(want - player.heading), Math.cos(want - player.heading));
    player.override = {
      throttle: player.speed < 20 ? 1 : 0, brake: 0,
      steer: Math.max(-1, Math.min(1, err * AI.gain - lat * AI.kP - latVel * AI.kD)),
    };
    player.update(pdt, tNow);
  };
  {
    // 第一帧先摆正（latHist 初始化）
    stepPlayer(0);
  }
  let finishEv = 0; // update() 内事件当帧即置 null：同帧双完赛需逐帧计数
  const seenFinish = new Set();
  let settledEvent = null;
  for (let i = 1; i < 30 * 600; i++) {
    race.updateFlow(pdt); // 与 main 同序（autoStart 下首帧即 racing）
    race.updateAi(pdt);
    stepPlayer(i * pdt);
    for (const b of ais) b.update(pdt, i * pdt);
    const prevFin = race.entries.filter((e) => e.finished).length;
    race.update(pdt);
    // race.event 每帧被覆盖：finish 以 entry.finished 增量捕获；settled 当帧捕获
    if (race.entries.filter((e) => e.finished).length > prevFin) finishEv++;
    for (const e of race.entries) {
      if (e.finished && !seenFinish.has(e.id)) { seenFinish.add(e.id); finishOrder.push(e.id); }
    }
    if (race.event?.type === "settled") settledEvent = race.event;
    const places = race.entries.map((e) => e.place).join(",");
    if (prevPlaces && places !== prevPlaces) placeChanged = true;
    prevPlaces = places;
    const pe = race.entryOf("player");
    if (pe.finished && playerFinish === null) playerFinish = { t: race.time, place: pe.place };
    if (settledEvent) break;
  }
  assert(placeChanged, "名次应随进度实时变化（AI 更快/玩家反超等）");
  assert.strictEqual(finishOrder.length, 4, `4 人均应完赛, got [${finishOrder}]`);
  assert(settledEvent && settledEvent.order.length === 4, "全员完赛应发 settled 结算事件（含顺序）");
  assert(Array.from(seenFinish).join() === settledEvent.order.join(), "冲线顺序=完赛顺序");
  // 完赛排序：完赛时间先后与 place 一致
  const sorted = [...race.entries].sort((a, b) => a.place - b.place);
  const sortedByFinish = [...race.entries].sort((a, b) => a.finishTime - b.finishTime);
  assert.deepStrictEqual(sorted.map((e) => e.id), sortedByFinish.map((e) => e.id), "名次必须=完赛时间序");
  // 头名应是最强 AI（speedCap 最高），除非玩家更快——两者之一合理
  console.log(`PASS multiplayer: places dynamic, finishes=${finishOrder.length}, order=[${sorted.map((e) => e.id).join(">")}]`);
}

// ============================================================ 4) skill → 速度档映射正确
{
  const boat = mkBoat("ai", 8, 0);
  const race = new RaceState(track, []);
  race.addAiRacers([
    { id: "a0", label: "A0", color: 0, boat },
    { id: "a1", label: "A1", color: 0, boat: mkBoat("b", 12, 3) },
  ], [1.0, 0.0]);
  const caps = CONFIG.ai.speedCap;
  assert.strictEqual(race.entryOf("a0").ai.speedCap, Math.max(...caps), "skill=1 → 最快档");
  assert.strictEqual(race.entryOf("a1").ai.speedCap, Math.min(...caps), "skill=0 → 最慢档");
  console.log(`PASS skill→speedCap: ${caps}`);
}

// ============================================================ 5) 完赛 AI 漂停（不永远狂奔）
{
  const boat = mkBoat("ai", 8, 0);
  const race = new RaceState(track, []);
  race.addAiRacers([{ id: "ai", label: "AI", color: 0, boat }], [0.9]);
  const e = race.entries[0];
  const dt = 1 / 30;
  for (let i = 0; i < 30 * 260 && !e.finished; i++) {
    race.updateAi(dt); boat.update(dt, i * dt); race.update(dt);
  }
  assert(e.finished, "前置：先完赛");
  for (let i = 0; i < 30 * 10; i++) { race.updateAi(dt); boat.update(dt, 9000 + i * dt); race.update(dt); }
  assert(boat.speed < 1.5, `完赛 AI 应漂停, speed=${boat.speed.toFixed(2)}`);
  console.log(`PASS finished ai coasts: speed=${boat.speed.toFixed(2)}`);
}


// ============================================================ 6) 比赛流程：倒计时冻结 → GO → 结算
{
  const { CONFIG } = await import("../src/config.js");
  const boat = mkBoat("ai", 8, 0);
  const race = new RaceState(track, []);
  race.addAiRacers([{ id: "ai", label: "AI", color: 0, boat }], [0.9]);
  // 浏览器路径：关 autoStart，手动推进 updateFlow/update 配对
  CONFIG.raceFlow.autoStart = false;
  const dt = 1 / 30;
  // 倒计时 3s 内：判定冻结（time=0），AI 怠速（override.throttle=0）
  for (let i = 0; i < 30 * 2.5; i++) { race.updateFlow(dt); race.updateAi(dt); boat.update(dt, i * dt); race.update(dt); }
  assert.strictEqual(race.phase, "countdown", "2.5s 仍在倒计时");
  assert.strictEqual(race.time, 0, "倒计时期间比赛计时必须冻结");
  assert.strictEqual(boat.override.throttle, 0, "倒计时期间 AI 必须怠速");
  // 3s 后：racing + GO 标签
  for (let i = 0; i < 30; i++) race.updateFlow(dt);
  assert.strictEqual(race.phase, "racing", "3s 后应开跑");
  assert(race._goLeft > 0, "开跑帧应处于 GO! 闪现窗");
  for (let i = 0; i < 30 * 2; i++) { race.updateAi(dt); boat.update(dt, i * dt); race.update(dt); }
  assert(race.time > 1.5, `开跑后计时应推进, time=${race.time.toFixed(1)}`);
  assert(boat.speed > 1, "开跑后 AI 应起步");
  // 全员完赛 → settled 事件 + over
  const e = race.entries[0];
  for (let i = 0; i < 30 * 400 && race.phase !== "over"; i++) {
    race.updateFlow(dt); race.updateAi(dt); boat.update(dt, i * dt); race.update(dt);
    if (race.event?.type === "settled") var settled = race.event;
  }
  assert.strictEqual(race.phase, "over", "全员完赛应进结算");
  assert(settled && settled.order[0] === "ai", "结算事件应含顺序");
  CONFIG.raceFlow.autoStart = true; // 复位（后续用例按默认路径）
  console.log("PASS race flow: countdown frozen → GO → racing → settled");
}


// ============================================================ 7) 浏览器全流程：倒计时标签 → 开跑 → HUD 结算面板
{
  const { CONFIG } = await import("../src/config.js");
  const el = () => ({ style: {}, set textContent(v) { this._t = v; }, get textContent() { return this._t; },
    set innerHTML(v) { this._h = v; }, get innerHTML() { return this._h; } });
  const els = {};
  const prevDoc = global.document;
  global.document = {
    getElementById: (id) => (els[id] || (els[id] = el())),
    createElement: () => ({ getContext: () => ({}), width: 0, height: 0 }),
  };
  const { createHUD } = await import("../src/ui/HUD.js");
  const boat = mkBoat("ai", 8, 0);
  CONFIG.raceFlow.autoStart = false;
  const race = new RaceState(track, []);
  race.addAiRacers([{ id: "ai", label: "AI 1", color: 0, boat }], [0.9]);
  const e = race.entries[0];
  const hud = createHUD(race, e);
  const dt = 1 / 30;
  const labels = new Set();
  let goFrames = 0;
  for (let i = 0; i < 30 * 500 && race.phase !== "over"; i++) {
    race.updateFlow(dt); race.updateAi(dt); boat.update(dt, i * dt); race.update(dt);
    hud.update();
    const cd = els["hud-countdown"];
    if (cd && cd.style.display === "block") {
      labels.add(cd._t);
      if (cd._t === "GO!") goFrames++;
    }
  }
  global.document = prevDoc; // 还原文档桩（后续用例）
  assert(["3", "2", "1", "GO!"].every((x) => labels.has(x)), `倒计时应闪过 3/2/1/GO, got ${[...labels]}`);
  assert(goFrames > dt * 20 * 30 * 0.5, "GO! 闪现窗 ~0.8s（30fps 下 >10 帧）");
  assert.strictEqual(race.phase, "over");
  // Phase 7 起：结算面板由 Menu.showResult 统一承担；名次/圈数/时间移入
  // 右上角仪表盘 canvas（#hud-gauge 由 main 创建，HUD 只保留倒计时/警告/事件/
  // 速度条——本用例断言这些 HUD 元素在位）。
  assert(els["hud-countdown"] && els["hud-warn"], "HUD 倒计时/警告面板应在位");
  CONFIG.raceFlow.autoStart = true;
  console.log("PASS browser flow: 3·2·1·GO rendered (result panel now owned by Menu)");
}

console.log("ALL PHASE-4 HEADLESS TESTS PASSED");
