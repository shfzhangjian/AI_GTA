// 起步视觉"到达渲染帧"回归（trace_swell）：按 main.js 真实 tick 顺序驱动
// 真 BoatModel + BoatController + RaceState，采样 renderer.render 时刻的
// group.scale —— 曾因把视觉方法挂在控制器句柄（.obj=THREE.Group，上面没有
// 这些方法）上，`if (group.setEngineSwell)` 恒 false 全线静默 =
// "完全没效果"且所有单测全绿。本测试断言视觉真的作用于每一渲染帧。
import assert from "node:assert";

global.window = { addEventListener() {}, devicePixelRatio: 1, innerWidth: 800, innerHeight: 600, AudioContext: null };
global.document = {
  getElementById: () => ({ getContext: () => null, width: 0, height: 0 }),
  createElement: () => ({ style: {}, classList: { add() {}, remove() {} }, appendChild() {}, addEventListener() {} }),
  title: "",
};
global.localStorage = { getItem: () => null, setItem() {} };
Object.defineProperty(global, "navigator", { value: { language: "zh-CN" }, configurable: true });
global.performance = { now: () => 0 };
global.requestAnimationFrame = () => 0;

const { Track } = await import("../src/track/Track.js");
const { RaceState } = await import("../src/race/RaceState.js");
const { BoatController } = await import("../src/boat/BoatController.js");
const { createBoat } = await import("../src/boat/BoatModel.js");
const { CONFIG } = await import("../src/config.js");

const track = new Track();
CONFIG.raceFlow.autoStart = false;
const view = createBoat(0xf4b942);
let down = true; // 倒计时全程按住（爆缸剧本）；GO 帧松手
// ★ 真实键盘语义：按住 W 时 isDown("brake") 必须 false（_throttle = throttle − brake，
// 恒真桩 = 1-1=0 永远加不了速——上一版 trace 的"回位后应恢复行驶"就是这么误红）
const boat = new BoatController(view.group, { isDown: (a) => down && a === "throttle" }, { track, raceId: "player", view });
const s = track.startLine;
boat.setPose(s.pos.clone(), Math.atan2(-s.tangent.x, -s.tangent.z));
const race = new RaceState(track, [{ id: "player", label: "P", color: 0, boat }]);
boat.race = race;
race.resetStartLedgers();
race.startArmed = true;
race.phase = "countdown";
race.countdown = 3.0;

const dt = 1 / 60;
let t = 0;
const samples = []; // [t, swell, scale.x@render, speed, bowZ, bowScale, popT, blownUp, blastOpacity, driverY]
for (let i = 0; i < 60 * 14; i++) {
  t += dt;
  // ==== main tick 同款顺序 ====
  race.updateFlow(dt);
  if (race.phase === "countdown") {
    race.tickRev(dt, down);
    const r = Math.min(1, (race.entryOf("player").rev || 0) / CONFIG.raceFlow.start.revMax);
    boat.swell = Math.sqrt(r);
  } else if (!race.event || race.event.type !== "go") {
    boat.swell = 0;
  }
  if (race.event && race.event.type === "go" && race.event.blown) {
    for (const b of race.event.blown) {
      const bb = race.entryOf(b.racerId).boat;
      // main 同款：popT 锁 = 抢跑时长动态惩罚，最长 1s
      const lockT = Math.min(CONFIG.raceFlow.start.popDriverTime, Math.max(0.35, b.penalty || 0));
      bb.popT = Math.max(bb.popT || 0, lockT);
      bb.blownUp = Math.max(bb.blownUp || 0, lockT);
      bb._traceLockT = lockT;
      if (bb.view?.setEngineSwell) bb.view.setEngineSwell(bb.swell || 0); // 胀态定格
      bb.swell = 0;
    }
  }
  // main 同款：GO 事件在船物理**之前**点火（updateFlow 在船 update 前面）
  if (race.event && race.event.type === "go") {
    for (const b of race.event.blown || []) {
      const bb = race.entryOf(b.racerId).boat;
      bb.view.triggerBlowUp?.();      // 砰冲击
      bb.view.triggerSpringHead?.(bb._traceLockT || 1);  // 船头弹簧点火
    }
  }
  boat.update(dt, t); // popT 锁定期内部驱动爆缸动画（applySwellShake 喂帧）
  const v = boat.view;
  v.syncLaunchPop?.(boat);
  v.applySwellShake(dt, t); // 视觉收尾补充
  // ==== RENDER 时刻采样 ====
  const findG = (o, type) => { for (const c of o.children || []) { if (c.geometry?.type === type) return c; const r = findG(c, type); if (r) return r; } return null; };
  const bowOff = v.group ? findG(v.group, "ConeGeometry") : null;
  const anim = v.animState ? v.animState() : { bow: { scale: 1 }, blast: { opacity: 0 }, driver: { y: 0, z: 0, visible: true } };
  // ★ speed 在 boat.update 之后采样 = 该帧真实运动意图（GO 帧锁 0 / 解锁后回升）
  samples.push([+t.toFixed(3), +boat.swell.toFixed(2), v.group.scale.x, boat.speed,
    bowOff ? +(bowOff.position.z - bowOff.userData.baseZ).toFixed(3) : 0,
    +anim.bow.scale.toFixed(3), boat.popT, boat.blownUp,
    +anim.blast.opacity.toFixed(3), +anim.driver.y.toFixed(3),
    +anim.driver.z.toFixed(3), anim.driver.visible ? 1 : 0]);
  v.group.position.y = boat.position.y;
  v.group.scale.set(1, 1, 1);
  v.group.rotation.x = 0;
  // 注意：main 的渲染后回位只动 group.position.y / scale / rotation.x；
  // 船头零件由动画自持，此处不可 restoreHead（会掐断回弹，复刻 main 真实行为）
  race.update(dt);
}

// ---- 断言 ----
const preGo = samples.filter((x) => x[0] < 3.0);
for (let i = 1; i < preGo.length; i++) {
  assert(preGo[i][2] - preGo[i - 1][2] > -0.001, `膨胀段 scale 不得回落 t=${preGo[i][0]}`);
}
const maxScale = Math.max(...preGo.map((x) => x[2]));
assert(maxScale >= 1.55, `倒计时膨胀必须到达渲染帧（scale≥1.55），实际峰值 ${maxScale}`);
const goI = samples.findIndex((x) => x[0] >= 3.0);
// 爆跳：GO 后从胀态起爆，窗内峰值 >1.3
const popPeak = Math.max(...samples.slice(goI, goI + 40).map((x) => x[2]));
assert(popPeak > 1.3, `爆缸当帧应从胀态弹跳（峰值>1.3），got ${popPeak}`);
const blastPeak = Math.max(...samples.slice(goI, goI + 24).map((x) => x[8]));
assert(blastPeak > 0.65, `爆炸星芒必须明显可见（opacity>0.65），got ${blastPeak}`);
// 爆跳窗后：scale 精确回 1（每帧重写的自愈性）
const late = samples.filter((x) => x[0] > samples[goI][0] + 1.2);
const worstLate = Math.max(...late.map((x) => Math.abs(x[2] - 1)));
assert(worstLate < 1e-6, `爆跳结束后应复位 1，偏差 ${worstLate}`);
// —— 船头弹簧头：爆缸后船头向前弹出、放大，并在锁定期内缩回 ——
const springWindow = samples.slice(goI, goI + 80);
const bowPeak = Math.min(...springWindow.map((x) => x[4]));
assert(bowPeak < -0.65, `船头应向前弹出（z offset<-0.65m），got ${bowPeak}`);
const bowScalePeak = Math.max(...springWindow.map((x) => x[5]));
assert(bowScalePeak > 1.35, `船头应随爆缸明显放大（scale>1.35），got ${bowScalePeak}`);
const bowMid = samples.find((x) => x[0] > samples[goI][0] + 0.45);
assert(bowMid && Math.abs(bowMid[4]) > 0.2, `0.45s 后船头仍应处于动态缩回中，got ${bowMid?.[4]}`);
const driverPeak = Math.max(...springWindow.map((x) => Math.abs(x[9])));
assert(driverPeak > 2.4, `驾驶员应被爆炸明显弹出离座，got y ${driverPeak}`);
const waterY = 0.05 - 1.1;
const floatWindow = samples.filter((x) => x[0] > samples[goI][0] + 0.36 && x[0] < samples[goI][0] + 0.72);
assert(floatWindow.some((x) => Math.abs(x[9] - waterY) < 0.2 && x[10] < -3.0 && x[11] === 1),
  "驾驶员头应掉到水面并漂浮一段");
const blinkWindow = samples.filter((x) => x[0] > samples[goI][0] + 0.72 && x[0] < samples[goI][0] + 1.0);
assert(blinkWindow.some((x) => x[11] === 0) && blinkWindow.some((x) => x[11] === 1),
  "水面漂浮后应闪动还原");
const lateBow = samples.filter((x) => x[0] > samples[goI][0] + 1.2);
assert(Math.max(...lateBow.map((x) => Math.abs(x[4]))) < 0.05, "动画结束船头应缩回原位");
assert(Math.max(...lateBow.map((x) => Math.abs(x[5] - 1))) < 0.05, "动画结束船头应缩回原尺寸");
assert(Math.max(...lateBow.map((x) => Math.abs(x[9]))) < 0.05, "动画结束驾驶员应回座");
assert(Math.max(...lateBow.map((x) => Math.abs(x[10]))) < 0.05, "动画结束驾驶员头应回到座位前后位置");
// —— 动力锁：锁定期（GO 帧之后的帧里 popT>0 的窗口）speed 恒 0 ——
// （GO 帧本身 speed 带弹射前的动量属正常；锁从下一帧 boat.update 起吞一切动力）
const lockFrames = samples.filter((x) => x[0] > samples[goI][0] + 0.03 && x[6] > 0);
const maxSpeedLocked = Math.max(...lockFrames.map((x) => Math.abs(x[3])));
assert(lockFrames.length > 40, `锁定期应有 ≥40 帧, got ${lockFrames.length}`);
assert(maxSpeedLocked < 0.01, `锁定期不许前进（speed=0），got ${maxSpeedLocked}`);
// 解锁后：继续按住油门应能走（锁不是永久）。从"最后一个 0 速帧"起观察，
// 覆盖 blownUp 罚时到期的确切时刻（3s 罚 → 6s 解锁，比 +2.3 的估计晚）。
const lastZero = samples.map((x) => x[3]).map((v, i) => [v, i]).filter((p0) => Math.abs(p0[0]) < 0.001).map((p0) => p0[1]).pop();
assert(lastZero !== undefined && lastZero < samples.length - 10, "应有解锁后的可行驶帧");
const post = samples.slice(lastZero + 1);
assert(Math.max(...post.map((x) => Math.abs(x[3]))) > 1, `回位后应恢复行驶, got max ${Math.max(0, ...post.map((x) => Math.abs(x[3])))}`);
console.log(`PASS swell->render ${maxScale.toFixed(2)}, bow spring ${bowPeak.toFixed(2)}m scale ${bowScalePeak.toFixed(2)}, locked then driving again`);
