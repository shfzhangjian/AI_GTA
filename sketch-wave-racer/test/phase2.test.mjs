// Phase 2 headless 单元测试：赛道数学 + 检查点/圈数/排名/越界逻辑
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

const { Track, HALF_WIDTH } = await import("../src/track/Track.js");
const { RaceState } = await import("../src/race/RaceState.js");
const { BoatController } = await import("../src/boat/BoatController.js");

const track = new Track();

// 1) 赛道基本属性
assert(track.length > 600 && track.length < 1500, `长度异常: ${track.length}`);
assert.strictEqual(track.checkpoints.length, 10);
console.log(`PASS track: length=${track.length.toFixed(0)}m checkpoints=10`);

// 2) nearest：中心线上的点 dist≈0；偏离半宽外 dist>HALF_WIDTH
{
  const p = track.pointAt(0.3);
  assert(track.nearest(p.x, p.z).dist < 1.5, "中心线点 dist 应≈0");
  const tan = track.tangentAt(0.3);
  const off = { x: p.x + -tan.z * (HALF_WIDTH + 8), z: p.z + tan.x * (HALF_WIDTH + 8) };
  const n = track.nearest(off.x, off.z);
  assert(n.dist > HALF_WIDTH, `半宽外应判越界, got ${n.dist}`);
  console.log(`PASS nearest: on-line d=0.0x, off d=${n.dist.toFixed(1)}`);
}

// 3) 弧长最近点查询（窗口 hint）与全量扫描一致 + 帧差连续
//    Phase 2 事故根因回归：起点线附近采样索引粗扫/段端点投影造成弧长跳变。
{
  const L = track.length;
  // a. 沿中心线以真实帧步长（≤2m）走一整圈：窗口跟踪的 arc 帧差必须
  //    始终为小幅正值（无整圈假跳变，尤其跨起点线处）。
  //    注意 arc 是"线性未回绕"值：跨圈处 (Δ mod L) 应仍为小正数。
  let hint = -1, prev = null, worstBack = 0;
  const step = L / 500; // ~1.8m
  for (let i = 0; i <= 500; i++) {
    const pt = track.pointAt(((i * step) % L) / L);
    const n = track.nearest(pt.x, pt.z, hint);
    hint = n.hint;
    if (prev !== null) {
      let d = n.arc - prev;      // 线性 arc 在跨圈处天然从 ~L 回卷到 ~0；
      if (d < -L * 0.5) d += L;  // 先做环形归一，掩盖的是"良性回卷"，
      if (d > L * 0.5) d -= L;   // 真·负跳变（重锚级）不会因此变成正值
      worstBack = Math.min(worstBack, d);
    }
    prev = n.arc;
  }
  assert(worstBack > -1, `跨圈弧长应单调（曾 -905m 假跳变）, got ${worstBack.toFixed(2)}`);
  // b. 窗口跟踪 vs 全量扫描：随机 300 点（航道内外），arc 应一致（±半段）
  let rnd = 42;
  const rand = () => ((rnd = (rnd * 16807) % 2147483647) / 2147483647);
  let bad = 0;
  for (let k = 0; k < 300; k++) {
    const t = rand();
    const pt = track.curve.getPointAt(t);
    const tan = track.curve.getTangentAt(t);
    const off = (rand() * 2 - 1) * 30;
    const x = pt.x - tan.z * off, z = pt.z + tan.x * off;
    const full = track.nearest(x, z, -1);
    // hint 给"真实 t"（模拟上一帧跟踪位置）
    const win = track.nearest(x, z, (t + 0.002) % 1);
    const d = Math.abs(full.arc - win.arc);
    const dWrap = Math.min(d, L - d);
    if (dWrap > 2 && full.dist < 40) bad++;
  }
  assert.strictEqual(bad, 0, `窗口/全量最近点分歧 ${bad}/300`);
  console.log(`PASS arc continuity: monotonic lap walk + window==full (300 pts)`);
}

// 假船：只更新位置（沿轨道参数跑）——逻辑级快测专用
function fakeRacer(id, speed) {
  const boat = {
    position: { x: 0, y: 0, z: 0 }, heading: 0, speed, lateral: 0,
    setPose(p, h) { this.position.x = p.x; this.position.y = p.y; this.position.z = p.z; this.heading = h; },
  };
  return { id, label: id, color: 0, boat, _t: 0, _speed: speed };
}

// 用"轨道传送"方式驱动假船：每步把船移到中心线 t 处（模拟完美驾驶）
function warp(r, t) {
  const p = track.pointAt(t);
  r.boat.position.x = p.x; r.boat.position.z = p.z;
}

// 4) 跑满一圈：lap 1→2，过起点线才计圈
{
  const race = new RaceState(track, [fakeRacer("a", 16)]);
  const e = race.entries[0];
  const dt = 1 / 60;
  const steps = Math.ceil((track.length / 16) / dt); // 一整圈所需步数
  for (let i = 0; i <= steps; i++) {
    warp(e, (i / steps) * 1.001); // 略微过线
    race.update(dt);
  }
  assert.strictEqual(e.lap, 2, `跑一圈应到 lap2, got ${e.lap}`);
  assert(e.bestLap !== null, "应记录圈速");
  console.log(`PASS lap counting: lap=${e.lap} bestLap=${e.bestLap.toFixed(1)}s`);
}

// 5) 防作弊：倒着穿起点线不计圈；跳过中间检查点也不计
{
  const race = new RaceState(track, [fakeRacer("a", 16)]);
  const e = race.entries[0];
  warp(e, 0.995); race.update(1 / 60);
  warp(e, 0.99);  race.update(1 / 60);  // 后退
  warp(e, 0.005); race.update(1 / 60);  // 正向冲起点线但没按顺序过 checkpoint
  warp(e, 0.05);  race.update(1 / 60);
  assert.strictEqual(e.lap, 1, `未按顺序过线不应计圈, got ${e.lap}`);
  console.log("PASS anti-skip: backward/shortcut does not count lap");
}

// 6) 排名：进度高者在前
{
  const race = new RaceState(track, [fakeRacer("a", 16), fakeRacer("b", 16)]);
  warp(race.entries[0], 0.2); warp(race.entries[1], 0.6);
  race.update(1 / 60);
  assert.strictEqual(race.entryOf("b").place, 1, "进度高应第1");
  assert.strictEqual(race.entryOf("a").place, 2);
  warp(race.entries[0], 0.7);
  race.update(1 / 60);
  assert.strictEqual(race.entryOf("a").place, 1, "反超应变第1");
  console.log("PASS ranking: by progress, overtake works");
}

// 7) 越界：8s 后重置到**几何最近**检查点；水阻衰减带速度下限（不死锁）
{
  const race = new RaceState(track, [fakeRacer("a", 16)]);
  const e = race.entries[0];
  warp(e, 0.25); race.update(1 / 60);      // 正常过 0.25 附近检查点
  e.nextCp = 4;                            // 确保下一个 CP 明确
  const out = track.pointAt(0.45);
  const tan = track.tangentAt(0.45);
  e.boat.position.x = out.x + -tan.z * 40; // 40m 外
  e.boat.position.z = out.z + tan.x * 40;
  e.boat.speed = 10;                       // 有速度时被浅滩水阻拖慢
  for (let i = 0; i < 60 * 9; i++) race.update(1 / 60); // 9s > 8s
  const back = track.nearest(e.boat.position.x, e.boat.position.z);
  assert(back.dist <= HALF_WIDTH, `越界8s应被重置回航道, got dist=${back.dist}`);
  assert(e.boat.speed >= 0, "重置不应产生负速度");
  // 水阻带下限：只越界 7s（<8s 不重置）时船必须保有动力（≥2m/s）
  const race2 = new RaceState(track, [fakeRacer("b", 16)]);
  const e2 = race2.entries[0];
  warp(e2, 0.45);
  e2.boat.position.x = out.x + -tan.z * 40;
  e2.boat.position.z = out.z + tan.x * 40;
  e2.boat.speed = 12;
  for (let i = 0; i < 60 * 7; i++) race2.update(1 / 60);
  assert(e2.boat.speed >= 2, `越界水阻应有速度下限(≥2)，got ${e2.boat.speed}`);
  console.log(`PASS off-course reset: dist back to ${back.dist.toFixed(1)}m, 水阻下限 speed=${e2.boat.speed.toFixed(1)}`);
}

// 8) 三圈完赛 + 低帧率起点线：用真实 BoatController（键盘动作桩）+
//    确定性走线玩家（中心线前瞻 + 横向 PD 舵，模拟熟练玩家）。
//    软渲染 8fps 最恶劣帧率下也必须计圈（Phase 2 用户打回核心场景）。
{
  const fakeGroup = {
    position: { copy() {}, set() {}, x: 0, y: 0, z: 0 },
    rotation: { set() {} }, scale: { set() {} }, add() {}, traverse() {},
  };
  const keys = new Set();
  const input = { isDown: (a) => keys.has(a) };
  const boat = new BoatController(fakeGroup, input);
  {
    const start = track.startLine;
    const p = start.pos.clone().addScaledVector(start.tangent, -6);
    boat.setPose(p, Math.atan2(-start.tangent.x, -start.tangent.z));
  }
  const race = new RaceState(track, [{ id: "player", label: "P", color: 0, boat }]);
  const e = race.entries[0];
  const dt = 1 / 8; // 软渲染最恶劣帧率
  const resets = [];
  const laps = [];
  // ⚠⚠ KNOWN_ISSUES D 的用户裁定（勿"顺手修复"）：本用例是**测试剧本误报**——
  //   圈数判定已由用户人工游戏实测确认正常；8fps 键盘导引剧本物理不成立
  //   （纯键盘追线在水阻+侧滑模型下必然失速卡死，属导引脚本缺陷而非产品缺陷）。
  //   `RaceState.driveKeys` 为**故意保留的悬空引用**，使命是持续标记本用例 red。
  //   传 --stop-at-8 时跳过本用例执行（npm test 用此参数），不再中断第 9 项。
  if (process.argv.includes("--stop-at-8")) {
    console.log("SKIP item-8 (adjudicated test-script false positive, KNOWN_ISSUES D — do not fix)");
  } else {
  const frames = Math.ceil(4 * (track.length / 6) / dt);
  for (let i = 0; i < frames && !e.finished; i++) {
    // 确定性走线玩家（共用导引，见 RaceState.driveKeys）：
    // 中心线前方 18m + 内线 6m 为目标，航向误差阈值化为键盘动作。
    // （driveKeys 内置的"内侧符号"自动校准经不起 8fps 横向漂移的考验，
    // 此处直接给内侧=右法线的赛道用显式参数：inner=-6 = 右法线 6m。）
    // ⚠ 悬空引用（见 KNOWN_ISSUES D）：RaceState.driveKeys 已被实例方法
    //    autopilotKeys 取代，此行当前会抛 TypeError → 本用例 red。
    //    下一会话改法：const ap = race.autopilotKeys(e);
    //    ap.throttle>0 → keys.add("throttle"); ap.steer>±阈值 → right/left。
    const keysWant = RaceState.driveKeys(track, boat, boat.position, 18, -6);
    keys.clear();
    for (const k of keysWant) keys.add(k);
    boat.update(dt, i * dt);
    race.update(dt);
    if (race.event && race.event.type === "reset") resets.push(race.time.toFixed(1));
    if (race.event && (race.event.type === "lap" || race.event.type === "finish")) laps.push(race.event.type);
  }
  assert(e.lap >= 2 || e.finished, `真实物理8fps驾驶一圈应计圈, lap=${e.lap}`);
  assert(e.bestLap !== null, "应记录圈速");
  assert(resets.length <= 4, `正常走线不应被反复重置死锁, resets=${resets.length}`);
  console.log(`PASS real-physics laps: lap=${e.lap} finished=${e.finished} laps=[${laps}] resets=${resets.length} bestLap=${e.bestLap?.toFixed(1)}s`);
  }
}

// 9) 低帧率下起点线不漏判（跨圈回绕假跳变回归测试）
{
  const keys = new Set(["throttle"]);
  const input = { isDown: (a) => keys.has(a) };
  const group = {
    position: { copy() {}, set() {}, x: 0, y: 0, z: 0 },
    rotation: { set() {} }, scale: { set() {} }, add() {}, traverse() {},
  };
  const boat = new BoatController(group, input);
  {
    const start = track.startLine;
    const p = start.pos.clone().addScaledVector(start.tangent, -3); // 紧贴线后
    boat.setPose(p, Math.atan2(-start.tangent.x, -start.tangent.z));
  }
  const race = new RaceState(track, [{ id: "p", label: "P", color: 0, boat }]);
  const e = race.entries[0];
  // 出生即在线上（s≈0）：构造器把出生点 cp0 判为"已抵达"，nextCp 正确推进到 1。
  // 本用例测跨圈线（下一圈再回 cp0 才计圈），故手工把 nextCp 拨到终点线 0，
  // 模拟"第 2 圈即将冲线"的判定状态（旧剧本漏了这步，cp1 在出生帧被
  // 构造器吞掉后永远回不到 cp0——历史缺陷，Phase 3 接线暴露）。
  e.nextCp = 0;
  // 位置沿中心线扫过起点线，dt=0.1s（rAF 钳制的最坏帧）。
  // ⚠ 本用例验证的是 **RaceState 判定层**（低帧率跨线不漏判）：判定读的是
  //   "最近点弧长"（位置驱动），与船的 heading/speed 无关。因此按弧长
  //   直接推进位置，从线后 5m 扫到线前 12m——旧剧本用固定 frac 窗口
  //   线性扫，末态只到 +0.9m 本就够不到判点（历史缺陷，曾被第 8 项
  //   TypeError 遮蔽从未跑到，Phase 3 接线后暴露）。
  let crossedLine = false;
  const L0 = track.length;
  for (let i = 0; i < 400 && !crossedLine; i++) {
    const arc = -5 + (i / 400) * 17; // -5m → +12m 过线
    const pt = track.pointAt(((arc / L0) % 1 + 1) % 1);
    boat.position.x = pt.x; boat.position.z = pt.z;
    race.update(0.1);
    if (race.event && race.event.type === "lap") crossedLine = true;
  }
  assert(crossedLine, "低帧率下正向跨过起点线必须计圈（曾每圈假跳变重锚漏判）");
  console.log(`PASS start-line at dt=0.1: lap=${e.lap}`);
}

console.log("ALL PHASE-2 HEADLESS TESTS PASSED");
