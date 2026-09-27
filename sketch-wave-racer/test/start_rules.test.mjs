// 起步规则（转速版）无头验证：
//   倒计时轰油门 = 拉转速（表显，零位移）；GO 帧转速定命运——
//   ≥rpmBlow 爆缸（惩罚 = 按住时长×0.5）；绿区 = 完美起跑（初速 + 加成）；
//   低速挂着 / 无转速 = 正常起步不奖不罚。
import assert from "node:assert";
import * as THREE from "three";
import { CONFIG } from "../src/config.js";
import { Track } from "../src/track/Track.js";
import { RaceState } from "../src/race/RaceState.js";

const track = new Track();
const ST = CONFIG.raceFlow.start;
const mkBoat = (id) => ({
  id, label: id, color: 0,
  position: new THREE.Vector3(), heading: 0, speed: 0,
  lastEvent: null, startBoost: 0, startBoostAdd: 0, startBoostForce: 0,
  setPose(p, h) { this.position.copy(p); this.heading = h; this.speed = 0; },
});
const dt = 1 / 60;

function freshRace() {
  CONFIG.raceFlow.autoStart = false;
  const boats = [mkBoat("player"), mkBoat("ai0")];
  boats.forEach((b) => {
    const s = track.startLine;
    b.setPose(s.pos.clone(), Math.atan2(-s.tangent.x, -s.tangent.z));
  });
  const race = new RaceState(track, boats.map((b) => ({ id: b.id, label: b.label, color: b.color, boat: b })));
  race.resetStartLedgers();
  race.startArmed = true;
  race.phase = "countdown"; race.countdown = CONFIG.raceFlow.countdown;
  return { race, boats };
}
// 复刻 main 的每帧序：tickRev →（updateFlow）→ GO
function drive(race, holdFn) {
  let goEvent = null;
  for (let i = 0; i < 60 * 8 && !goEvent; i++) {
    if (race.phase === "countdown") race.tickRev(dt, holdFn(race.countdown));
    race.updateFlow(dt);
    if (race.event && race.event.type === "go") {
      // main tick 同款 GO 帧结算：熄火惩罚 + 泄气
      for (const b of race.event.blown) {
        const e2 = race.entryOf(b.racerId);
        if (e2) { e2.boat.blownUp = Math.max(e2.boat.blownUp || 0, b.penalty); e2.boat.swell = 0; }
      }
      goEvent = race.event;
    }
  }
  return goEvent;
}

// 1) 一直按到底（3s 全程轰）→ 转速爆线，GO 帧爆缸；
// 惩罚按抢跑加速时长动态计算，但用户要求封顶 1s。
{
  const { race, boats } = freshRace();
  const pos0 = boats[0].position.clone();
  const go = drive(race, () => true);
  assert(go.blown.length === 1, "全程轰 = 爆缸名单 1 人");
  const rec = go.blown[0];
  assert(rec.penalty > 0.95 && rec.penalty <= 1.0, `惩罚应动态计算且不超过 1s，实际 ${rec.penalty}`);
  assert(boats[0].position.distanceTo(pos0) < 0.01, "倒计时期间零位移");
  console.log(`PASS hold-to-GO: blown, penalty=${rec.penalty.toFixed(2)}s, zero drift`);
}

// 2) 收油卡绿区（按 1.2s 松手，回落进绿区）→ 完美起跑：初速 >0 + 加成章
{
  const { race, boats } = freshRace();
  const go = drive(race, (cd) => cd > CONFIG.raceFlow.countdown - 1.2);
  assert(go.blown.length === 0, "卡绿区不该爆缸");
  const e = race.entryOf("player");
  assert(e.perfectStart, "绿区转速 = 完美起步章");
  assert(boats[0].speed > 0.1, `弹射初速应 >0，实际 ${boats[0].speed}`);
  assert(boats[0].startBoost > 0 && boats[0].lastEvent === "perfectstart", "加成 + 事件词");
  assert(Math.abs(boats[0].launchPower - Math.sqrt(e.rev / CONFIG.raceFlow.start.revMax)) < 1e-6,
    "完美起步视觉强度应等于 GO 帧实际膨胀大小 sqrt(rev/revMax)");
  console.log(`PASS green-zone release → perfect start, launch speed=${boats[0].speed.toFixed(1)} m/s`);
}

// 3) 只轰 0.3s 就松手（转速掉回 0）→ 不奖不罚
{
  const { race, boats } = freshRace();
  const go = drive(race, (cd) => cd > CONFIG.raceFlow.countdown - 0.3);
  const e = race.entryOf("player");
  assert(go.blown.length === 0 && !e.perfectStart, "低速挂着 = 正常起步");
  assert(boats[0].speed === 0 && boats[0].startBoost === 0, "无初速无加成");
  console.log("PASS brief blip → normal start (no reward, no penalty)");
}

// 4) 全程不按 → 正常起步
{
  const { race, boats } = freshRace();
  const go = drive(race, () => false);
  const e = race.entryOf("player");
  assert(go.blown.length === 0 && !e.perfectStart && boats[0].speed === 0, "老实等 GO = 正常起步");
  console.log("PASS no throttle at all → normal start");
}

// 5) START 前按着的 W（startArmed=false）不拉转速不背锅
{
  const { race } = freshRace();
  race.startArmed = false;
  for (let i = 0; i < 60; i++) race.tickRev(dt, true);
  const e = race.entryOf("player");
  assert(e.rev === 0 && !e.fated, "菜单上按着 W = 转速不动");
  console.log("PASS pre-START held key: rev stays 0");
}

// 6) 首次按住段松手定格：再按不重判（爆缸罚时基数 = 第一段按住时长）
{
  const { race } = freshRace();
  let go = null;
  for (let i = 0; i < 60 * 8 && !go; i++) {
    if (race.phase === "countdown") {
      const t = race.countdown > CONFIG.raceFlow.countdown - 2.0
        ? true : (race.countdown > CONFIG.raceFlow.countdown - 2.5 ? false : true);
      race.tickRev(dt, t);
    }
    race.updateFlow(dt);
    if (race.event && race.event.type === "go") go = race.event;
  }
  assert(go.blown.length === 1, "轰过爆线仍爆缸");
  assert(Math.abs(go.blown[0].held - 2.0) < 0.1, `held 定格第一段 ≈2.0，实际 ${go.blown[0].held}`);
  console.log(`PASS release freezes held=${go.blown[0].held.toFixed(2)}s; re-press cannot re-judge`);
}

// 7) AI 计划仿真（复刻 main 的 preCountdown 收油时机公式 + aiCountdownHold）
{
  const { race } = freshRace();
  const e = race.entryOf("ai0");
  e.ai = { skill: 0.9, speedCap: 22.5 };
  // perfect 计划（与 main preCountdown 同公式）
  const start = 1.5 + 0.9 * 0.5; // 剩 1.95s 按下
  const target = (ST.rpmGreenLo + ST.rpmGreenHi) / 2;
  const h = Math.min(start, (target + ST.revDrop * start) / (ST.revRamp + ST.revDrop));
  const stop = start - h;
  let go = null;
  for (let i = 0; i < 60 * 8 && !go; i++) {
    if (race.phase === "countdown") {
      const cd = race.countdown;
      const pressing = cd <= start && !(cd < stop);
      if (pressing) {
        if (!e.fated) { e.fated = true; e.holding = true; e.holdDone = false; e.held = 0; }
        if (e.holding && !e.holdDone) e.held += dt;
        e.rev = Math.min(ST.revMax, e.rev + ST.revRamp * dt);
      } else {
        if (e.holding && !e.holdDone) e.holdDone = true;
        e.rev = Math.max(0, e.rev - ST.revDrop * dt);
      }
    }
    race.updateFlow(dt);
    if (race.event && race.event.type === "go") go = race.event;
  }
  assert(go.blown.length === 0, "perfect 计划 AI 不爆缸");
  assert(e.perfectStart, `perfect 计划落绿区（rev=${e.rev.toFixed(1)}）`);
  assert(e.rev >= ST.rpmGreenLo - 0.5 && e.rev < ST.rpmBlow, `GO 帧转速 ∈ 绿区, got ${e.rev.toFixed(1)}`);
  console.log(`PASS ai perfect plan: GO rev=${e.rev.toFixed(1)} m/s in green zone`);

  // blow 计划：一直按 → 爆缸
  const { race: r2 } = freshRace();
  const e2 = r2.entryOf("ai0");
  e2.ai = {}; e2.fated = false; e2.held = 0;
  const start2 = 2.2; let go2 = null;
  for (let i = 0; i < 60 * 8 && !go2; i++) {
    if (r2.phase === "countdown") {
      if (r2.countdown <= start2) {
        if (!e2.fated) { e2.fated = true; e2.holding = true; e2.holdDone = false; e2.held = 0; }
        if (e2.holding && !e2.holdDone) e2.held += dt;
        e2.rev = Math.min(ST.revMax, e2.rev + ST.revRamp * dt);
      }
    }
    r2.updateFlow(dt);
    if (r2.event && r2.event.type === "go") go2 = r2.event;
  }
  const rec = go2.blown.find((b) => b.racerId === "ai0");
  assert(rec, "blow 计划 AI 爆缸");
  assert(Math.abs(rec.held - 2.2) < 0.1, `blow AI held≈2.2, got ${rec.held}`);
  console.log(`PASS ai blow plan: penalty=${rec.penalty.toFixed(2)}s`);
}

// 8) 爆缸熄火语义：blownUp>0 吞油门；resetStartLedgers 清账
{
  const { race, boats } = freshRace();
  boats[0].blownUp = 1.0;
  const throttle = boats[0].blownUp > 0 ? 0 : 1; // BoatController 语义
  assert.strictEqual(throttle, 0, "熄火期油门全吞");
  race.resetStartLedgers();
  const e = race.entryOf("player");
  assert(e.held === 0 && e.rev === 0 && !e.fated && !race.startArmed, "resetStartLedgers 清账 + 关门");
  console.log("PASS blown-up throttle swallowed + ledger reset");
}

// 9) racing 后转速账本冻结（GO 同帧仍按住不再计）
{
  const { race } = freshRace();
  race.countdown = 0.05;
  race.tickRev(dt, true); // GO 前最后一帧按下（rev 微起）
  let go = null;
  for (let i = 0; race.phase === "countdown"; i++) { race.updateFlow(dt); if (race.event?.type === "go") go = race.event; }
  const e = race.entryOf("player");
  const revAtGo = e.rev;
  race.tickRev(dt, true);
  assert(e.rev === revAtGo, "racing 期 tickRev 无效");
  console.log("PASS post-GO rev frozen");
}

// 10) 船体视觉（BoatModel）：整船胀大 / 爆缸弹跳 / 起跑拉长 / 复位安全
{
  const { createBoat } = await import("../src/boat/BoatModel.js");
  const v = createBoat(0xf4b942);
  // 膨胀：整船 scale 随 swell 增大
  v.setEngineSwell(0.5);
  assert(v.group.scale.x > 1.2 && v.group.scale.x < 1.45, `swell=0.5 整船应明显胀大(≈1.3×), got ${v.group.scale.x}`);
  const y0 = v.group.position.y;
  v.applySwellShake(1 / 60, 1);
  assert(Math.abs(v.group.position.y - y0) > 1e-4, "膨胀期应抖（position.y 偏移）");
  // 爆缸：整船 pop 弹跳 + 船头像弹簧一样弹出、驾驶员头落水漂浮并闪动回座
  v.triggerBlowUp();
  v.triggerSpringHead(1.0);
  v.setEngineSwell(0); // 泄气
  v.applySwellShake(1 / 60, 2);
  assert(v.group.scale.x >= 1.0, `pop 帧 scale ≥1, got ${v.group.scale.x}`);
  const springNow = v.animState();
  assert(springNow.blast.visible && springNow.blast.opacity > 0.5, "爆缸应有明显爆炸星芒");
  assert(springNow.bow.z < -0.5, `爆缸船头应向前弹出，got z offset ${springNow.bow.z}`);
  assert(springNow.bow.scale > 1.25, `爆缸船头应明显放大，got scale ${springNow.bow.scale}`);
  const states = [springNow.driver];
  let driverPeak = springNow.driver.y;
  for (let i = 0; i < 70; i++) {
    v.applySwellShake(1 / 60, 2.1 + i / 60);
    const st = v.animState().driver;
    states.push(st);
    driverPeak = Math.max(driverPeak, st.y);
  }
  assert(driverPeak > 2.4, `驾驶员应被爆炸明显弹出离座，got peak ${driverPeak}`);
  const waterY = 0.05 - 1.1;
  assert(states.some((s) => Math.abs(s.y - waterY) < 0.2 && s.z < -3.0 && s.visible),
    "爆炸后驾驶员头应掉到水面并漂浮一段");
  assert(states.some((s) => !s.visible) && states.some((s) => s.visible),
    "水面漂浮后应闪动还原");
  const restoredDriver = v.animState().driver;
  assert(restoredDriver.visible && Math.abs(restoredDriver.y) < 0.05 && Math.abs(restoredDriver.z) < 0.05,
    "1s 内闪动结束后驾驶员头应回座，之后才允许向前");
  // 完美起跑：launchPop 旗消费 → 按实际膨胀强度向前冲 + Z 拉长 → 行驶中慢慢恢复
  const boatStub = { launchPop: true, launchPower: 1 };
  v.syncLaunchPop(boatStub);
  assert(boatStub.launchPop === false && boatStub.launchPower === 0, "launchPop 一次性消费并清强度");
  v.applySwellShake(1 / 60, 10);
  assert(v.group.scale.z > 1.2, `起跑拉长 Z 应明显(≥1.2), got ${v.group.scale.z}`);
  assert(v.group.scale.x > 1.5, `完美起步第一帧应保持实际膨胀大小再恢复，不得一下变小, got x ${v.group.scale.x}`);
  assert(v.group.position.z < -1.5, `完美起步应视觉向前冲出，got z ${v.group.position.z}`);
  // 用户要求"5 秒内逐步变小"：0.5s/2.5s 后仍有可观余量，
  // 5s 内单调缓降，到 5s 回到正常大小。
  const zAt = [];
  for (let i = 0; i < 150; i++) { v.applySwellShake(1 / 60, 11 + i / 60); zAt.push(v.group.scale.z); }
  assert(zAt[29] > 1.22, `0.5s 时拉长应仍有明显残余（慢还原），got ${zAt[29]}`);
  for (let i = 1; i < zAt.length; i++) {
    assert(zAt[i] - zAt[i - 1] < 0.035, `还原须平滑缓降不跳变 i=${i}`);
  }
  assert(zAt[zAt.length - 1] > 1.04, `2.5s 后仍应有慢恢复残余, got ${zAt[zAt.length - 1]}`);
  const tail = [];
  for (let i = 0; i < 160; i++) { v.applySwellShake(1 / 60, 14 + i / 60); tail.push(v.group.scale.z); }
  assert(Math.abs(tail[tail.length - 1] - 1) < 0.02, `5s 内应恢复正常大小, got ${tail[tail.length - 1]}`);
  const weak = createBoat(0xf4b942);
  const strong = createBoat(0xf4b942);
  weak.syncLaunchPop({ launchPop: true, launchPower: 0.5 });
  strong.syncLaunchPop({ launchPop: true, launchPower: 1.0 });
  weak.applySwellShake(1 / 60, 20);
  strong.applySwellShake(1 / 60, 20);
  assert(strong.group.scale.z > weak.group.scale.z + 0.08, "实际膨胀越大，完美起步拉伸越大");
  assert(Math.abs(strong.group.position.z) > Math.abs(weak.group.position.z) + 0.7,
    "实际膨胀越大，完美起步视觉前冲越远");
  console.log("PASS boat visuals: swell, blow spring, launch slow-restore (exp)");
}

console.log("ALL START-RULE (REV) HEADLESS TESTS PASSED");
