// Phase 5 headless 单元测试：道具系统（拾取/使用/命中/防御/气泡/AI 决策）
// 约束：纯 Node 桩 <60s（当前 ~3s）。运行：node test/phase5.test.mjs
import assert from "node:assert";

global.window = { devicePixelRatio: 1, innerWidth: 800, innerHeight: 600, addEventListener() {} };
global.document = {
  getElementById: () => null,
  createElement: () => ({ getContext: () => ({}), width: 0, height: 0 }),
};
global.localStorage = { getItem: () => null, setItem() {} };
global.performance = { now: () => 0 };

const THREE = await import("three");
const { Track, HALF_WIDTH } = await import("../src/track/Track.js");
const { TrackFeatures } = await import("../src/track/TrackFeatures.js");
const { CollisionWorld } = await import("../src/physics/CollisionWorld.js");
const { RaceState } = await import("../src/race/RaceState.js");
const { BoatController } = await import("../src/boat/BoatController.js");
const { ItemSystem, ITEM_TYPES } = await import("../src/items/ItemSystem.js");
const { CONFIG } = await import("../src/config.js");

const track = new Track();
const fakeGroup = () => ({
  position: { copy() {}, set() {}, x: 0, y: 0, z: 0 },
  rotation: { set() {} }, scale: { set() {} }, add() {}, traverse() {},
});
const start = track.startLine;
const nrm = new THREE.Vector3(-start.tangent.z, 0, start.tangent.x);

// 摆船到赛道弧长 arc 处（沿切向朝前）
function placeAtArc(boat, arc, lat = 0) {
  const t = ((arc % track.length) + track.length) % track.length / track.length;
  const p = track.pointAt(t);
  const tan = track.tangentAt(t);
  boat.setPose(new THREE.Vector3(p.x + -tan.z * lat, 0.2, p.z + tan.x * lat),
    Math.atan2(-tan.x, -tan.z));
}

// 造一局：n 船（含 player id="player"）。玩家船默认纯油门输入桩（测试里
// 玩家是"道具实验台"：要么恒油门、要么 override 指定；AI 船走线自驱）。
function makeWorld(n = 2, rngSeed = () => 0) {
  const boats = [];
  const racers = [];
  for (let i = 0; i < n; i++) {
    const boat = new BoatController(fakeGroup(), { isDown: () => false }, { track });
    placeAtArc(boat, -6 - i * 3, ((i % 2) - 0.5) * 3);
    boats.push(boat);
    racers.push({ id: i === 0 ? "player" : "ai" + (i - 1), label: "R" + i, color: 0, boat });
  }
  const race = new RaceState(track, [racers[0]]);
  racers[0].boat.race = race;
  if (racers.length > 1) race.addAiRacers(racers.slice(1), racers.slice(1).map((_, i) => 0.9 - i * 0.1));
  for (const r of racers) if (r.boat !== racers[0].boat) r.boat.race = race;
  const items = new ItemSystem(track, race, { rng: rngSeed });
  race.itemsAi = (dt, e, arcOf) => items.aiThink(dt, e, arcOf);
  const player = race.entryOf("player");
  return { race, items, boats, player, pboat: player.boat };
}

// 玩家当"恒油门实验船"（无碰撞世界：道具实验不掺碰撞噪声）
const PLAYER_DRIVE = () => ({ throttle: 1, brake: 0, steer: 0 });

// 测试几何用：让指定 AI 停着（覆盖走线 override）
const parkAi = (race, id) => { const e = race.entryOf(id); if (e) e.boat.override = { throttle: 0, brake: 0, steer: 0 }; };

// makeWorld 同布局的世界工厂；opts.items=false 时**不注入** AI 道具决策
// （免疫/弹道类单测要排除 AI 自动开火的干扰，存货必须归测试自己摆布）。
function makePlainWorld(n = 2, opts = {}) {
  const injectItems = opts.items !== false;
  const boats = [], racers = [];
  for (let i = 0; i < n; i++) {
    const boat = new BoatController(fakeGroup(), { isDown: () => false }, { track });
    placeAtArc(boat, -6 - i * 3, ((i % 2) - 0.5) * 3);
    boats.push(boat);
    racers.push({ id: i === 0 ? "player" : "ai" + (i - 1), label: "R" + i, color: 0, boat });
  }
  const race = new RaceState(track, [racers[0]]);
  racers[0].boat.race = race;
  if (racers.length > 1) race.addAiRacers(racers.slice(1), racers.slice(1).map((_, i) => 0.9 - i * 0.1));
  for (const r of racers) if (r.boat !== racers[0].boat) r.boat.race = race;
  let items = null;
  if (injectItems) {
    items = new ItemSystem(track, race, { rng: () => 0 });
    race.itemsAi = (dt, e, arcOf) => items.aiThink(dt, e, arcOf);
  }
  return { race, items, boats, player: race.entryOf("player") };
}

// 弹道类道具的精确测试几何：AI 在走线中随时可能开火（useDelay 0.8s 拍），
// 摆位必须发生在**发射当帧**（由 items.log 的 use 事件触发），弹出射即在
// 靶船旁 —— 这是单测 ItemSystem 弹道的正确姿势。
function armedChase(items, ownerEntryId, targetBoat, gap) {
  return () => {
    const e = items.race.entryOf(ownerEntryId);
    const log = items.log;
    const used = log.some((ev) => ev.type === "use" && ev.racerId === ownerEntryId && (ev.item === "missile" || ev.item === "bubble"));
    if (used && !armedChase.done) {
      armedChase.done = true;
      // 把靶船瞬移到弹出射点正前方 gap（沿弹方向），保证首步命中
      const p = items.projectiles.find((q) => q.owner === ownerEntryId);
      if (p) {
        targetBoat.position.x = p.x + p.dx * gap;
        targetBoat.position.z = p.z + p.dz * gap;
      }
    }
  };
}

const step = (race, items, boats, dt = 1 / 60) => {
  race.updateFlow(dt);
  race.updateAi(dt);
  for (const b of boats) b.update(dt, 1000 + race.time);
  items.update(dt);
  race.update(dt);
};

// ============================================================ 1) 拾取与冷却
{
  const { race, items, boats, player } = makeWorld(2);
  const box = items.boxes[0];
  const row0 = items.boxes.filter((b) => b.row === box.row);
  assert(row0.length >= 3, `道具箱应每次生成一排，got row size ${row0.length}`);
  assert(row0.some((b) => b.lane < 0) && row0.some((b) => b.lane > 0), "道具箱一排应覆盖左右车道");
  const boat = player.boat;
  placeAtArc(boat, box.t * track.length); // 直接开到箱上
  step(race, items, boats);
  assert(boat.item && ITEM_TYPES.includes(boat.item), `进箱半径应拾取, got ${boat.item}`);
  assert(box.respawn > 0, "拾取后箱子应进冷却");
  assert(items.log.some((ev) => ev.type === "pickup" && ev.racerId === "player"), "应记 pickup 事件");
  // 冷却期内同一箱不能再被拾（第二艘船撞上去）
  const b2 = race.entries[1].boat;
  placeAtArc(b2, box.t * track.length, 0);
  step(race, items, boats);
  assert.strictEqual(b2.item, null, "冷却中的箱不应出货");
  // 冷却结束货新随机
  const firstName = boat.item;
  for (let i = 0; i < 60 * 8; i++) step(race, items, boats);
  assert(box.respawn <= 0, "8s 后箱应复活");
  console.log(`PASS pickup: got ${firstName}, cooldown+respawn ok`);
}

// ============================================================ 2) Speed / Turbo：极速加成生效与到期
{
  const { race, items, boats, player } = makeWorld(1);
  const boat = player.boat;
  boat.override = PLAYER_DRIVE(); // 实验船恒油门（无输入桩的 BoatController 不会自己动）
  boat.item = "speed";
  assert(items.use("player"), "speed 使用应成功");
  assert.strictEqual(boat.item, null, "用后存货清空");
  const cap = CONFIG.boat.maxSpeed + CONFIG.items.speed.speedAdd;
  for (let i = 0; i < 60 * 3; i++) step(race, items, boats);
  assert(boat.speed > CONFIG.boat.maxSpeed + 1, `道具应突破常规极速, got ${boat.speed.toFixed(1)}`);
  assert(boat.speed <= cap + 0.01, `不得超过合成上限 ${cap}, got ${boat.speed.toFixed(1)}`);
  // 衰减：60s 后基本归零
  for (let i = 0; i < 60 * 60; i++) step(race, items, boats);
  assert(boat.itemSpeed < 0.5, `speed 应指数衰减归零, got ${boat.itemSpeed.toFixed(2)}`);

  // turbo：固定时长
  boat.item = "turbo";
  items.use("player");
  assert.strictEqual(boat.turboLeft, CONFIG.items.turbo.duration);
  for (let i = 0; i < 60 * 3; i++) step(race, items, boats);
  assert(boat.itemSpeed > 0, "turbo 时长内加成应保持");
  for (let i = 0; i < 60 * 3; i++) step(race, items, boats);
  assert.strictEqual(boat.itemSpeed, 0, "turbo 到期应整段清除");
  console.log("PASS speed/turbo: over-cap active, decay/expiry ok");
}

// ============================================================ 3) Shield：挡一次命中 + 破盾后再命中
{
  const { race, items, boats, player } = makeWorld(2);
  const A = player.boat, B = race.entries[1].boat;
  const bId = race.entries[1].id;
  // A 停着开盾；B 在 A 前方 8m（同向），从后方发弹追打 A 是反向——改为
  // 同向追逐布局：A 前 B 后：A 在前 arc=8（停着开盾），B 在 arc=0 朝前发弹
  placeAtArc(A, 8); placeAtArc(B, 0);
  A.override = { throttle: 0, brake: 0, steer: 0 }; // 盾主停着当靶
  A.item = "shield"; items.use("player");
  assert(A.shield > 0, "应开盾");
  B.item = "missile"; items.use(bId);
  let blocked = null;
  for (let i = 0; i < 60 * 2; i++) {
    step(race, items, boats);
    blocked = items.log.find((ev) => ev.type === "block" && ev.target === "player") || blocked;
  }
  assert(blocked, `盾应挡下导弹并记 block, log=${JSON.stringify(items.log.slice(-6))}`);
  assert.strictEqual(A.shield, 0, "挡一次后护盾消耗归零");
  assert(!items.log.some((ev) => ev.type === "hit" && ev.target === "player"), "被挡时不得同时记 hit");
  // 破盾后 B 补一发 → 真命中（A 重新停着）
  placeAtArc(A, 8); placeAtArc(B, 0);
  A.override = { throttle: 0, brake: 0, steer: 0 };
  B.item = "missile"; items.use(bId);
  let hit = null;
  for (let i = 0; i < 60 * 4 && !hit; i++) {
    step(race, items, boats);
    hit = items.log.find((ev) => ev.type === "hit" && ev.weapon === "missile" && ev.target === "player") || hit;
  }
  assert(hit, "无盾时应被第二发命中");
  console.log("PASS shield: block once (no hit), second missile lands after shield down");
}

// ============================================================ 4) Bubble Trap：困住 → 漂浮 → 破泡限速
{
  const { race, items, boats, player } = makeWorld(2);
  const A = player.boat, B = race.entries[1].boat;
  placeAtArc(A, 0);
  placeAtArc(B, 12);
  B.override = { throttle: 0, brake: 0, steer: 0 }; // B 停着挨泡
  A.item = "bubble";
  items.use("player");
  let trapped = false;
  for (let i = 0; i < 60 * 3 && !trapped; i++) { step(race, items, boats); trapped = B.trapped > 0; }
  assert(trapped, `泡应命中困住, trapped=${B.trapped}`);
  // 困住期间：油门全开也不加速（动力冻结）
  const frozen = [];
  for (let i = 0; i < 60; i++) {
    step(race, items, boats);
    if (B.trapped > 0) frozen.push(B.speed);
  }
  assert(frozen.length > 20, "应持续被困约 2.2s");
  const grow = frozen[frozen.length - 1] - frozen[0];
  assert(grow <= 0.01, `困住期间不得有动力（只许漂停）, Δspeed=${grow.toFixed(2)}`);
  // 破泡
  let popped = false;
  for (let i = 0; i < 60 * 4 && !popped; i++) { step(race, items, boats); popped = B.lastEvent === "bubblepop"; }
  assert(popped, "到时应破泡（bubblepop 事件）");
  assert(B.trapped === 0 && B.speed <= CONFIG.items.bubble.popDrop + 0.01, "破泡后限速");
  console.log(`PASS bubble trap: ~2.2s frozen (no throttle effect), pop限速 ok`);
}

// ============================================================ 5) Wave Burst：范围减速 + 推离
{
  const { race, items, boats, player } = makeWorld(3);
  const A = player.boat;
  placeAtArc(A, 50);
  placeAtArc(race.entries[1].boat, 56);   // 前方 6m
  placeAtArc(race.entries[2].boat, 61);   // 前方 11m（半径 12 内）
  for (const e of race.entries.slice(1)) { e.boat.speed = 12; e.boat.override = { throttle: 1, brake: 0, steer: 0 }; }
  const before = race.entries.slice(1).map((e) => e.boat.speed);
  A.item = "wave";
  items.use("player");
  const hits = items.log.filter((ev) => ev.type === "hit" && ev.weapon === "wave" && ev.from === "player");
  assert.strictEqual(hits.length, 2, `半径内 2 人均应被命中, got ${hits.length}`);
  for (const e of race.entries.slice(1)) {
    assert(e.boat.speed < 12 * CONFIG.items.wave.slowKeep + 0.01, `应减速, got ${e.boat.speed.toFixed(1)}`);
  }
  assert(before.every((v, i) => v === 12));
  // 半径外不受影响
  placeAtArc(A, 200);
  const far = new BoatController(fakeGroup(), { isDown: () => false }, { track });
  // 简化：直接检查距离判定——把 C 摆到 30m 外用纯函数式判定
  placeAtArc(race.entries[2].boat, 230); // 距 A 30m
  const cnt0 = items.log.filter((ev) => ev.type === "hit" && ev.weapon === "wave").length;
  A.item = "wave";
  items.use("player");
  const cnt1 = items.log.filter((ev) => ev.type === "hit" && ev.weapon === "wave").length;
  assert.strictEqual(cnt1, cnt0, "半径外不应命中");
  console.log("PASS wave burst: in-radius slow+push, out-of-radius unaffected");
}

// ============================================================ 6) AI 道具决策（真实 updateAi 闭环）
{
  const { race, items, boats, player } = makeWorld(3);
  // 玩家当靶子：同向布局（决策窗用弧长判定）
  const ai0 = race.entryOf("ai0");
  ai0.boat.item = "missile";
  placeAtArc(ai0.boat, -20, 0);
  placeAtArc(player.boat, 0, 0);
  player.boat.override = { throttle: 0, brake: 0, steer: 0 }; // 靶子停着
  const targetId = player.id;
  armedChase.done = false;
  const placeTargetAhead = (proj, gap) => {
    if (!proj || armedChase.done) return;
    armedChase.done = true;
    player.boat.position.x = proj.x + proj.dx * gap;
    player.boat.position.z = proj.z + proj.dz * gap;
  };
  let fired = false;
  for (let i = 0; i < 60 * 12 && !fired; i++) {
    race.updateFlow(1 / 60);
    race.updateAi(1 / 60);
    for (const b of boats) b.update(1 / 60, 1000 + race.time);
    const pre = items.projectiles.find((q) => q.owner === "ai0" && !q.travelled0);
    if (pre) { pre.travelled0 = true; placeTargetAhead(pre, 2); }
    items.update(1 / 60); // update 内已结算命中（靶已摆在弹出射点前方 2m）
    race.update(1 / 60);
    fired = items.log.some((ev) => ev.type === "use" && ev.racerId === "ai0" && ev.item === "missile");
  }
  assert(fired, `AI 前方有船应发导弹, log=${JSON.stringify(items.log.slice(-6))}`);
  // 命中判定：导弹自 ai0 船尾发射点出射，与停着的靶船横向偏 ~0.2m、
  // 命中半径 2.6m → 首半步必命中（单测 ItemSystem 用精确布局坐实）。
  const hit = items.log.find((ev) => ev.type === "hit" && ev.weapon === "missile" && ev.from === "ai0" && ev.target === targetId);
  assert(hit, `AI 发射的水弹应命中, log=${JSON.stringify(items.log.slice(-8))}`);
  // bubble：前方有人 → AI 放追踪泡。摆定后玩家保持停着，让水泡锁前方目标。
  const ai1 = race.entryOf("ai1");
  placeAtArc(ai1.boat, 0, 0);
  placeAtArc(player.boat, 18, 0);
  parkAi(race, "ai1");          // 停住，避免跑远
  ai1.boat.item = "bubble";
  let bubbled = false;
  armedChase.done = false;
  for (let i = 0; i < 60 * 20 && !bubbled; i++) {
    race.updateFlow(1 / 60);
    race.updateAi(1 / 60);
    for (const b of boats) b.update(1 / 60, 1000 + race.time);
    const pre = items.projectiles.find((q) => q.owner === "ai1" && !q.travelled0);
    if (pre) { pre.travelled0 = true; player.boat.position.x = pre.x + pre.dx * 2; player.boat.position.z = pre.z + pre.dz * 2; }
    items.update(1 / 60);
    race.update(1 / 60);
    bubbled = items.log.some((ev) => ev.type === "hit" && ev.weapon === "bubble" && ev.from === "ai1");
  }
  assert(bubbled, `AI 前方有船应放追踪水牢泡并命中, log=${JSON.stringify(items.log.slice(-8))}`);
  console.log("PASS ai item use: missile ahead + homing bubble ahead (real loop)");
}

// ============================================================ 7) 防御规则：气泡中的船免疫命中
{
  const { race, boats, player } = makePlainWorld(3, { items: false });
  const items = new ItemSystem(track, race, { rng: () => 0 }); // 免疫规则单测：不挂 AI 决策
  const A = player.boat, B = race.entries[1].boat, C = race.entries[2].boat;
  // 全部停住：纯弹道几何测试，排除走线干扰；B 全程钉住困住状态
  A.override = { throttle: 0, brake: 0, steer: 0 };
  C.override = { throttle: 0, brake: 0, steer: 0 };
  placeAtArc(A, 0); placeAtArc(B, 12); placeAtArc(C, 20);
  A.item = "missile";
  items.use("player");
  let hitB = false, hitC = false;
  const dt = 1 / 60;
  for (let i = 0; i < 60 * 3; i++) {
    race.updateFlow(dt);
    race.updateAi(dt); // AI 决策可能给 override——不影响被钉住的 B（下行动）
    B.override = { throttle: 0, brake: 0, steer: 0 };
    B.trapped = 2.0; // 免疫规则单测：状态钉住（真实 trapped 生命周期见用例 4）
    A.update(dt, i * dt); B.update(dt, i * dt); C.update(dt, i * dt);
    B.trapped = 2.0; // BoatController 会递减 trapped：在 items.update 前再钉一次
    items.update(dt);
    race.update(dt);
    hitB = hitB || items.log.some((ev) => ev.type === "hit" && ev.target === race.entries[1].id);
    hitC = hitC || items.log.some((ev) => ev.type === "hit" && ev.target === race.entries[2].id);
  }
  assert(hitB === false || B.trapped <= 0, "气泡中的船不应被导弹命中（穿透打后方）");
  assert(hitC, "应能穿过后命中后方的船");
  console.log("PASS trap immunity: missile passes trapped boat, hits behind");
}

// ============================================================ 8) 持有/使用互斥与终态
{
  const { race, boats, player } = makePlainWorld(1, { items: false });
  const items = new ItemSystem(track, race, { rng: () => 0 }); // 本用例测手动 use 闸门，不注入决策
  const boat = player.boat;
  assert.strictEqual(items.use("player"), false, "无存货使用应失败");
  boat.item = "shield";
  assert(items.use("player"), "有存货可用");
  boat.item = "wave";
  boat.trapped = 1.0;
  assert.strictEqual(items.use("player"), false, "被困时不能使用道具");
  boat.trapped = 0;
  // 完赛者不能用
  const e = race.entries[0];
  e.finished = true;
  assert.strictEqual(items.use("player"), false, "完赛后不能用道具");
  console.log("PASS use guards: empty/trapped/finished all refuse");
}

// ============================================================ 9) 连续星星：落后者前方 3~5 颗；每颗 +2s 加速
{
  const { race, boats, player } = makePlainWorld(2, { items: false });
  const items = new ItemSystem(track, race, { rng: () => 0.4 });
  race.phase = "racing"; race.started = true;
  const A = player.boat;
  placeAtArc(A, 0);
  const stars = items._spawnStarChain(player, 5);
  assert.strictEqual(stars.length, 5, "应能生成 5 颗连续星星");
  for (let i = 1; i < stars.length; i++) {
    assert(stars[i].arc > stars[i - 1].arc, "连续星星应沿前方依次排列");
  }
  for (const s of stars) {
    A.position.set(s.x, 0.2, s.z);
    items.update(1 / 60);
  }
  assert.strictEqual(items.stars.length, 0, "吃完后星星应回收");
  assert(Math.abs(A.starBoostLeft - 10) < 0.001, `5 颗星每颗 +2s，应为 10s, got ${A.starBoostLeft}`);
  assert.strictEqual(items.log.filter((ev) => ev.item === "star" && ev.type === "pickup").length, 5, "每颗星都应记 pickup");
  A.override = PLAYER_DRIVE();
  A.speed = CONFIG.boat.maxSpeed;
  A.update(1, 1000);
  assert(A.speed > CONFIG.boat.maxSpeed, `星星加速期间应突破常规极速, got ${A.speed.toFixed(2)}`);
  console.log("PASS star chain: 5 stars ahead, each pickup extends +2s speed window");
}

// ============================================================ 10) 闪电：释放后前方所有人受击并渐慢，身后不受影响
{
  const { race, player } = makePlainWorld(3, { items: false });
  const items = new ItemSystem(track, race, { rng: () => 0.5 });
  race.phase = "racing"; race.started = true;
  const A = player.boat;
  const ahead = race.entries[1].boat;
  const behind = race.entries[2].boat;
  placeAtArc(A, 20);
  placeAtArc(ahead, 55);
  placeAtArc(behind, 5);
  race.update(1 / 60); // 写入进度，闪电按比赛进度判定前后
  ahead.speed = 24;
  behind.speed = 24;
  A.item = "lightning";
  assert(items.use("player"), "lightning 使用应成功");
  assert(ahead.lightningSlow > 0, "前方选手应进入闪电渐慢状态");
  assert.strictEqual(behind.lightningSlow || 0, 0, "身后选手不应被闪电命中");
  assert(items.log.some((ev) => ev.type === "hit" && ev.weapon === "lightning" && ev.target === race.entries[1].id), "应记录闪电命中");
  const before = ahead.speed;
  ahead.override = { throttle: 0, brake: 0, steer: 0 };
  ahead.update(0.5, 1000);
  assert(ahead.speed < before, `闪电应让速度渐慢, before=${before}, after=${ahead.speed}`);
  console.log("PASS lightning: hits all racers ahead, slows over time, leaves behind untouched");
}

// ============================================================ 11) 变大加速：4s 巨大化提速，结束后慢慢缩回
{
  const { race, player } = makePlainWorld(1, { items: false });
  const items = new ItemSystem(track, race, { rng: () => 0.5 });
  race.phase = "racing"; race.started = true;
  const A = player.boat;
  A.item = "giant";
  assert(items.use("player"), "giant 使用应成功");
  assert.strictEqual(A.giantTime, CONFIG.items.giant.duration, "巨大化应持续配置的 4s");
  A.override = PLAYER_DRIVE();
  A.speed = CONFIG.boat.maxSpeed;
  A.update(1, 1000);
  assert(A.giantScale > 1.4, `巨大化期间模型倍率应明显 >1, got ${A.giantScale}`);
  assert(A.speed > CONFIG.boat.maxSpeed, `巨大化期间应突破常规极速, got ${A.speed.toFixed(2)}`);
  const scaleDuring = A.giantScale;
  for (let i = 0; i < 60 * 4; i++) A.update(1 / 60, 1001 + i / 60);
  assert.strictEqual(A.giantTime, 0, "4s 后巨大化加速应结束");
  assert(A.giantShrink > 0, "结束后应进入慢慢缩回阶段");
  assert(A.giantScale < scaleDuring && A.giantScale > 1, `缩回阶段倍率应介于巨大化和正常之间, got ${A.giantScale}`);
  for (let i = 0; i < 60 * 3; i++) A.update(1 / 60, 1006 + i / 60);
  assert.strictEqual(A.giantShrink, 0, "缩回阶段最终应结束");
  assert(Math.abs(A.giantScale - 1) < 0.001, `最终应恢复正常大小, got ${A.giantScale}`);
  console.log("PASS giant: 4s large speed boost, then visible shrink-back to normal");
}

// ============================================================ 12) 炸弹：可前投/放下，2s 后爆炸命中范围内目标
{
  const { race, player } = makePlainWorld(2, { items: false });
  const items = new ItemSystem(track, race, { rng: () => 0.25 });
  race.phase = "racing"; race.started = true;
  const A = player.boat;
  const B = race.entries[1].boat;
  placeAtArc(A, 0);
  placeAtArc(B, 18);
  B.speed = 20;
  A.item = "bomb";
  assert(items.use("player"), "bomb 前投使用应成功");
  const thrown = items.projectiles.find((p) => p.kind === "bomb");
  assert(thrown && thrown.speed > 0 && thrown.mode === "throw", "普通使用应向前投掷炸弹");
  for (let i = 0; i < 60 * 3; i++) items.update(1 / 60);
  assert(!items.projectiles.some((p) => p === thrown), "2s 后炸弹应爆炸并回收");
  assert(items.log.some((ev) => ev.type === "explode" && ev.weapon === "bomb"), "应记录炸弹爆炸");
  assert(items.log.some((ev) => ev.type === "hit" && ev.weapon === "bomb" && ev.target === race.entries[1].id), "爆炸半径内目标应被命中");
  assert(B.speed < 20, "炸弹爆炸应让目标减速");

  A.item = "bomb";
  assert(items.use("player", { drop: true }), "bomb 放下使用应成功");
  const dropped = items.projectiles.find((p) => p.kind === "bomb");
  assert(dropped && dropped.speed === 0 && dropped.mode === "drop", "drop=true 应原地放下炸弹");
  console.log("PASS bomb: throw/drop modes + 2s timed explosion hit");
}

// ============================================================ 13) 追踪水泡：随机锁定前方目标并命中产生爆炸效果
{
  const { race, player } = makePlainWorld(3, { items: false });
  const items = new ItemSystem(track, race, { rng: () => 0 });
  race.phase = "racing"; race.started = true;
  const A = player.boat;
  const B = race.entries[1].boat;
  const C = race.entries[2].boat;
  placeAtArc(A, 0);
  placeAtArc(B, 22, 3);
  placeAtArc(C, -15, 0);
  race.update(1 / 60);
  A.item = "bubble";
  assert(items.use("player"), "bubble 使用应成功");
  const bubble = items.projectiles.find((p) => p.kind === "bubble");
  assert(bubble?.target === race.entries[1].id, `水泡应锁定前方目标, got ${bubble?.target}`);
  B.override = { throttle: 0, brake: 0, steer: 0 };
  for (let i = 0; i < 60 * 4 && !B.trapped; i++) {
    B.update(1 / 60, 1000 + i / 60);
    items.update(1 / 60);
  }
  assert(B.trapped > 0, "追踪水泡应命中并困住前方目标");
  assert.strictEqual(C.trapped || 0, 0, "身后目标不应被随机锁定");
  assert(items.effects.some((fx) => fx.type === "explosion" && fx.color === 0x9be8ff), "水泡命中应产生爆炸效果");
  console.log("PASS homing bubble: random front target lock + hit explosion");
}

// ============================================================ 14) 新一局重开（main.resetRace 依赖的 reset API）
{
  const { race, items, boats, player } = makeWorld(2);
  const A = player.boat;
  A.item = "missile";
  placeAtArc(A, 0);
  placeAtArc(race.entries[1].boat, 20);
  items.use("player"); // 发一枚水弹
  for (let i = 0; i < 60 * 4; i++) step(race, items, boats);
  assert(items.log.some((ev) => ev.type === "use"), "前置：有使用记录");
  A.item = "shield"; // 留个存货
  assert.strictEqual(typeof items.reset, "function", "reset API 必须存在（main.resetRace 依赖）");
  items.reset();
  assert.strictEqual(items.projectiles.length, 0, "飞行体应清空");
  assert.strictEqual(items.stars.length, 0, "连续星星应清空");
  assert.strictEqual(items.effects.length, 0, "视觉效果应清空");
  assert(items.log.length === 0, "事件日志应清空");
  assert.strictEqual(A.item, null, "玩家存货应清空");
  assert.strictEqual(A.starBoostLeft, 0, "星星加速应清空");
  assert.strictEqual(A.lightningSlow, 0, "闪电渐慢应清空");
  assert.strictEqual(A.giantScale, 1, "巨大化倍率应恢复正常");
  for (const b of items.boxes) {
    assert.strictEqual(b.respawn, 0, "箱冷却应清零");
    assert(ITEM_TYPES.includes(b.type), "箱应重随机到货");
  }
  // 重开后流程照常可拾可用
  const box = items.boxes[0];
  placeAtArc(A, box.t * track.length);
  step(race, items, boats);
  assert(A.item, "reset 后拾取应正常");
  console.log("PASS reset: view-independent state wipe + reopen");
}

console.log("ALL PHASE-5 HEADLESS TESTS PASSED");
