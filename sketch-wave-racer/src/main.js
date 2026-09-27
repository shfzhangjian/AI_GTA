// Sketch Wave Racer — 入口
// Phase 2：赛道 + 边界 + 检查点 + 圈数 + 排名 + 越界重置 + HUD。

import * as THREE from "three";
import { CONFIG } from "./config.js";
import { InputState } from "./core/InputState.js";
import { createAudio } from "./core/Audio.js";
import { createWater } from "./water/Water.js";
import { createSpraySystem } from "./water/Spray.js";
import { createBoat } from "./boat/BoatModel.js";
import { BoatController } from "./boat/BoatController.js";
import { FollowCamera } from "./camera/FollowCamera.js";
import { createSky, createScatterIslands } from "./world/Sky.js";
import { Track, TOTAL_LAPS } from "./track/Track.js";
import { generateMapChoices } from "./track/TrackGenerator.js";
import { TrackFeatures } from "./track/TrackFeatures.js";
import { createTrackView } from "./track/TrackView.js";
import { CollisionWorld } from "./physics/CollisionWorld.js";
import { RaceState } from "./race/RaceState.js";
import { createHUD } from "./ui/HUD.js";
import { createGauge } from "./ui/Gauge.js";
import { ItemSystem } from "./items/ItemSystem.js";
import { createItemView } from "./items/ItemView.js";
import { FlyingFishSystem } from "./hazards/FlyingFishSystem.js";
import { createFlyingFishView } from "./hazards/FlyingFishView.js";
import { createAiRacers } from "./boat/AiRacers.js";
import { t } from "./i18n/i18n.js";
import { createMenu } from "./ui/Menu.js";
import { createMiniMap } from "./ui/MiniMap.js";
import { recordRace } from "./ui/records.js";
import { loadQualityName } from "./ui/records.js";

// ---------------------------------------------------------------- renderer

const canvas = document.getElementById("game-canvas");

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: CONFIG.renderer.antialias,
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, CONFIG.renderer.pixelRatioCap));
renderer.setSize(window.innerWidth, window.innerHeight);

// ---------------------------------------------------------------- scene

const scene = new THREE.Scene();
scene.background = new THREE.Color(CONFIG.scene.background);
scene.fog = new THREE.Fog(
  CONFIG.scene.fogColor,
  CONFIG.scene.fogNear,
  CONFIG.scene.fogFar
);

const camera = new THREE.PerspectiveCamera(
  CONFIG.camera.fov,
  window.innerWidth / window.innerHeight,
  CONFIG.camera.near,
  CONFIG.camera.far
);
camera.position.set(...CONFIG.camera.position);

// ---------------------------------------------------------------- lights

scene.add(new THREE.HemisphereLight(0xffffff, 0x7fb2c9, 0.85));
const sun = new THREE.DirectionalLight(0xfff2d9, 1.8);
sun.position.set(120, 160, 80);
scene.add(sun);

// ------------------------------------------------- world: 天空 / 水面 / 布景

scene.add(createSky());
const waterQ = pickQuality();
let water = createWater(waterQ);
scene.add(water.mesh);
createScatterIslands(scene);

// ---------------------------------------------------------------- track

const mapChoices = generateMapChoices(3);
let selectedMapIndex = 0;
const track = new Track(mapChoices[selectedMapIndex]);
let trackView = createTrackView(track, scene);

// ------------------------------------------------------------- player boat

const input = new InputState();
const boatView = createBoat(CONFIG.boat.color);
scene.add(boatView.group);
// Phase 3：赛道互动特征 + 碰撞世界注入（未注入的字段保持 Phase 1 行为）
const features = new TrackFeatures(track);
const collision = new CollisionWorld(track);
const boat = new BoatController(boatView.group, input, {
  track, features, collision, raceId: "player", view: boatView, // race 在下一节补挂
});

// 出生位：起点线后 6m，面向切向
{
  const start = track.startLine;
  const p = start.pos.clone().addScaledVector(start.tangent, -6);
  p.y = 0.2;
  boat.setPose(p, Math.atan2(-start.tangent.x, -start.tangent.z));
}

// ---------------------------------------------------------------- race

CONFIG.raceFlow.autoStart = false; // 人工比赛：3·2·1·GO 后再开跑
const race = new RaceState(track, [
  { id: "player", label: "Player", color: CONFIG.boat.color, boat },
]);
const playerEntry = race.entryOf("player");
boat.race = race; // Phase 3：加速带触发需要 race 的连续里程快照

// ------------------------------------------------ Phase 4：AI 选手
const AI_COUNT = 3;
const aiRacers = createAiRacers(track, {
  input, track, features, collision, BoatClass: BoatController,
}, AI_COUNT);
for (const r of aiRacers) {
  scene.add(r.view.group);
  r.boat.race = race;
}
race.addAiRacers(aiRacers.map(({ id, label, color, boat }) => ({ id, label, color, boat })),
  aiRacers.map((r) => r.skill));
// 船-船碰撞：每个 boat 的对手机器人（含玩家）
const allBoats = [boat, ...aiRacers.map((r) => r.boat)];
boat.mates = () => allBoats.filter((b) => b !== boat);
for (const r of aiRacers) r.boat.mates = () => allBoats.filter((b) => b !== r.boat);

const followCam = new FollowCamera(camera);
const hud = createHUD(race, playerEntry, CONFIG.boat.maxSpeed);
// 右上角卡通指针仪表盘（速度/圈数/名次/时间，canvas 手绘简笔画风）
const gaugeCanvas = document.getElementById("hud-gauge");
const gauge = gaugeCanvas ? createGauge(gaugeCanvas, race, playerEntry) : null;

// ------------------------------------------------ Phase 6：喷溅粒子
const spray = createSpraySystem(waterQ);
scene.add(spray.points);
const allBoats2 = [boat, ...aiRacers.map((r) => r.boat)];
for (const b of allBoats2) b.onSplash = (airV) => spray.emitSplash(b, airV);

// ------------------------------------------------ Phase 7+：音效（全程序合成，零素材）
const audio = createAudio();
const unlockAudio = () => audio.unlock(); // 首次手势解锁 AudioContext
window.addEventListener("pointerdown", unlockAudio, { once: true });
window.addEventListener("keydown", unlockAudio, { once: true });

// ------------------------------------------------ Phase 5：道具系统
const items = new ItemSystem(track, race, {
  onEvent: (ev) => {
    // 道具事件 → 音效（玩家相关；他人挨打也有声 = 打击感）
    if (ev.type === "pickup" && ev.racerId === "player") audio.sfx.pickup();
    if (ev.type === "use" && ev.racerId === "player") {
      const f = { speed: "speed", turbo: "turbo", shield: "shield", missile: "missile",
        bubble: "bubble", wave: "waveBurst" }[ev.item];
      (audio.sfx[f] || audio.sfx.use)();
    }
    if ((ev.type === "hit" || ev.type === "block") && ev.target === "player") {
      const f = { missile: "missileHit", bubble: "trapped", wave: "waveBurst" }[ev.weapon];
      (ev.type === "block" ? audio.sfx.block : (audio.sfx[f] || audio.sfx.hit))();
    }
  },
});
race.itemsAi = (dt, e, arcOf) => items.aiThink(dt, e, arcOf);
let itemView = createItemView(track, scene, items);

// ------------------------------------------------ 动态危险物：前 3 名飞鱼突袭
const flyingFish = new FlyingFishSystem(track, race, {
  onEvent: (ev) => {
    if (ev.type === "hit" && ev.target === "player") audio.sfx.hit();
  },
});
const flyingFishView = createFlyingFishView(scene, flyingFish);

// ------------------------------------------------ Phase 7：菜单 / 小地图 / 本地记录
const minimapCanvas = document.getElementById("minimap");
const miniMap = minimapCanvas ? createMiniMap(minimapCanvas, track, race) : null;

let raceStarted = false; // Start 之前：判定冻结在出生格（autoStart 已关 + paused 门控）

const menu = createMenu(document.getElementById("app"), {
  onStart: () => {
    audio.unlock(); audio.sfx.click(); resetRace(); raceStarted = true;
    race.startArmed = true; // 起步判定开门：START 前按着的 W 不背抢跑锅
  },
  onResume: () => { audio.unlock(); audio.sfx.click(); raceStarted = true; race.startArmed = true; },
  onMapChange: (index) => { audio.sfx.click(); applyMapChoice(index); },
  maps: mapChoices,
  selectedMapIndex,
  onLangChange: () => { refreshHudTexts(); },
  onQualityChange: (name) => rebuildWater(name),
  onSound: () => audio.toggleSound(),
  isSoundOn: () => audio.isEnabled(),
  race,
});

function refreshHudTexts() {
  // 左上角 = 游戏名称（跟语言：中文显示中文、English 显示英文）；
  // "Phase X" 调试文案已按用户要求去掉。
  document.getElementById("hud-title").textContent = t("menu.title");
  document.getElementById("hud-controls").textContent = t("controls");
}

// 画质热重建：旧 water.mesh 移除 → 新档重建（scene 材质/网格即时生效）
function rebuildWater(name) {
  const q = CONFIG.quality[name] || CONFIG.quality[CONFIG.defaultQuality];
  scene.remove(water.mesh);
  water.mesh.geometry.dispose();
  water.mesh.material.dispose();
  water = createWater(q);
  scene.add(water.mesh);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, q === CONFIG.quality.low ? 1 : CONFIG.renderer.pixelRatioCap));
}

function applyMapChoice(index) {
  if (index === selectedMapIndex || !mapChoices[index]) return;
  selectedMapIndex = index;
  track.configure(mapChoices[selectedMapIndex]);
  features.rebuild(track);
  collision.rebuild(track);
  race.rebuildTrackGeometry(track);

  scene.remove(trackView.group);
  trackView = createTrackView(track, scene);

  scene.remove(itemView.group);
  items.rebuild(track);
  itemView = createItemView(track, scene, items);

  flyingFish.reset();
  flyingFishView.reset();
  race.time = 0; race.phase = "countdown"; race.countdown = CONFIG.raceFlow.countdown;
  race.started = false; race._goLeft = 0; race.finishedOrder = []; race.event = null;
  raceStarted = false;
  placeEntriesAtStart();
  preCountdown();
  resultShown = false;
}

// 新一局：全船回出生格、比赛回倒计时、道具体系刷新（道具箱到货重随）
function resetRace() {
  // 用户要求：欢迎/开始界面不许残留上一局的任何声画——先静音清音，
  // 新一局的 3·2·1·GO 由 tick 的倒计时哔声重新起播。
  audio.stopAllSfx();
  audio.engineUpdate(0, 1);
  for (const e of race.entries) {
    e.finished = false; e.finishTime = null; e.lap = 1; e.nextCp = 1;
    e.lapStart = 0; e.bestLap = null; e.total = 0; e.progress = 0;
    e.offCourse = 0; e.outOfBounds = false;
    e._arcN = undefined; e._s = 0; e._s_prev = 0; e._hint = undefined;
  }
  race.time = 0; race.phase = "countdown"; race.countdown = CONFIG.raceFlow.countdown;
  // started=false：倒计时冻结一切——判定、计时、以及**船的油门/漂移**
  //（用户缺陷：倒计时按住 W+Shift 会"假蓄力"且船偷偷提速滑出，GO 瞬间爆
  //  boost/滑飞）。tick 里 race.update 每帧从 phase 重算 started，倒计时
  // 全程保持 false；GO 帧 updateFlow 置 true 才放行。
  race.started = false; race._goLeft = 0; race.finishedOrder = []; race.event = null;
  placeEntriesAtStart();
  // 起步账本 + AI 抢跑掷骰重开（用户：AI 少量随机抢跑）
  preCountdown();
  // 道具体系重开（道具箱重随机到货，飞行体清空 + 视觉网格/音爆环回收）
  items.reset();
  itemView.reset();
  flyingFish.reset();
  flyingFishView.reset();
  resultShown = false;
  // 结算面板收起 + 倒计时开跑由 raceStarted 门控
  menu.hideResult();
  menu.hideMenu();
}

function placeEntriesAtStart() {
  const s0 = track.startLine;
  const V = Object.getPrototypeOf(s0.pos).constructor;
  const nrm = new V(-s0.tangent.x === 0 ? 0 : -s0.tangent.z, 0, s0.tangent.x);
  race.entries.forEach((e, i) => {
    const p = s0.pos.clone().addScaledVector(s0.tangent, -6 - i * 3).addScaledVector(nrm, ((i % 2) - 0.5) * 3);
    p.y = 0.2;
    e.boat.setPose(p, Math.atan2(-s0.tangent.x, -s0.tangent.z));
    // 漂移状态硬清（setPose 不清漂移）：杜绝重开后"幽灵蓄力/白放 boost"
    e.boat.drifting = false; e.boat.driftTime = 0; e.boat.driftCharge = 0;
    e.boat.driftBoost = 0;
    // 起步规则状态硬清：上局的膨胀/熄火/完美加成绝不带入新一局
    e.boat.swell = 0; e.boat.blownUp = 0;
    e.boat.startBoost = 0; e.boat.startBoostAdd = 0; e.boat.startBoostForce = 0;
    e.boat.launchPop = false; e.boat.launchPower = 0;
    if (e.boat.view?.setEngineSwell) e.boat.view.setEngineSwell(0);
    if (e.boat.view?.applySwellShake) { e.boat.view.group.scale.set(1, 1, 1); }
  });
}

// ---- 起步规则状态（倒计时轰油门：膨胀→爆缸惩罚 / 完美起步奖励）----
// 声明提前：resetRace 在菜单 onStart 回调里就会调 preCountdown()，
// 必须早于其使用点完成初始化（const/let 无提升，见 TDZ 历史教训）。
const _aiPlan = {};            // { racerId: 'perfect'|'blow'|null } 本局 AI 抢跑掷骰

// 新一局开场掷骰：AI 少量随机抢跑（轰过爆缸线）/ 完美起步（卡绿区）
// 计划 = "收油时机"：从按下起转速按 revRamp 上冲，到点收油则回落在
// (rev-revDrop·剩余) 附近——blow 党一直轰到 GO；perfect 卡在绿区落点。
function preCountdown() {
  race.resetStartLedgers();
  for (const key of Object.keys(_aiPlan)) delete _aiPlan[key];
  const ST = CONFIG.raceFlow.start;
  for (const e of race.entries) {
    if (!e.ai) continue;
    const r = Math.random();
    if (r < ST.aiFalseStartChance) {
      _aiPlan[e.id] = 'blow';
      e.heldStartAt = CONFIG.raceFlow.countdown * (0.3 + Math.random() * 0.4);
      e.revStopAt = null; // 一直轰 → GO 帧转速破爆线
    } else if (r < ST.aiFalseStartChance + 0.3) {
      _aiPlan[e.id] = 'perfect';
      e.heldStartAt = 1.5 + Math.random() * 0.9; // 剩 1.5~2.4s 时按下
      // 收油时机：hold h 秒后收油，GO 帧回落转速 = ramp·h − drop·(start−h)
      // 取目标 = 绿区中段 → h = (target + drop·start) / (ramp + drop)
      const target = (ST.rpmGreenLo + ST.rpmGreenHi) / 2;
      const h = Math.min(e.heldStartAt, (target + ST.revDrop * e.heldStartAt) / (ST.revRamp + ST.revDrop));
      e.revStopAt = e.heldStartAt - h;
    } else {
      e.heldStartAt = null;
      e.revStopAt = null;
    }
    e.held = 0; e.heldSince = null;
  }
}

// 倒计时每帧：把 AI 计划的"按下时机"折算成 held 累计（与玩家同账本，
// GO 帧由 RaceState._resolveStarts 统一结算爆缸/完美）。
function aiCountdownHold(dt) {
  const ST = CONFIG.raceFlow.start;
  for (const e of race.entries) {
    if (!e.ai || _aiPlan[e.id] === undefined) continue;
    // 按下态：计划时间窗内 = 按住；到 revStopAt 收油
    const pressing = e.heldStartAt !== null && e.heldStartAt !== undefined &&
      race.countdown <= e.heldStartAt &&
      !(e.revStopAt !== null && e.revStopAt !== undefined && race.countdown < e.revStopAt);
    if (pressing) {
      if (!e.fated) { e.fated = true; e.holding = true; e.holdDone = false; e.held = 0; }
      if (e.holding && !e.holdDone) e.held += dt;
      e.rev = Math.min(ST.revMax, (e.rev || 0) + ST.revRamp * dt);
    } else {
      if (e.holding && !e.holdDone) e.holdDone = true;
      e.rev = Math.max(0, (e.rev || 0) - ST.revDrop * dt);
    }
  }
}

// R 键：手动回到最近检查点（菜单打开时忽略）
window.addEventListener("keydown", (e) => {
  if (menu.menuOpen() || menu.resultOpen()) return;
  if (e.code === "KeyR") { race.manualReset("player"); audio.sfx.reset(); }
});

// Esc：暂停菜单（比赛中弹出，Resume 继续）
window.addEventListener("keydown", (e) => {
  if (e.code !== "Escape") return;
  if (menu.resultOpen()) return;
  if (menu.menuOpen()) { menu.hideMenu(); }
  else {
    // 用户要求：Esc 进入暂停立即停止音效——引擎声归零 + 掐断全部在途音源与
    // 排队旋律（GO/完赛等 setTimeout 音符）。新一局 3·2·1·GO 由 tick 重新起播。
    audio.stopAllSfx();
    audio.engineUpdate(0, 1);
    menu.showPauseMenu(raceStarted);
  }
});

// ---------------------------------------------------------------- resize

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// 全局错误兜底：任何未捕获异常直接显示在页面上（杜绝"无反应黑屏"类静默 bug）
function showFatal(msg) {
  let el = document.getElementById("fatal");
  if (!el) {
    el = document.createElement("div");
    el.id = "fatal";
    document.getElementById("app").appendChild(el);
  }
  el.textContent = "⚠ " + msg;
}
window.addEventListener("error", (e) => {
  showFatal(e.message + (e.error?.stack ? "\n" + String(e.error.stack).split("\n").slice(1, 4).join("\n") : ""));
});
window.addEventListener("unhandledrejection", (e) => showFatal(String(e.reason)));

// Phase 6：画质分档（localStorage 可覆盖；默认 CONFIG.defaultQuality）
function pickQuality() {
  const saved = loadQualityName();
  const q = CONFIG.quality;
  return q[saved] || q[CONFIG.defaultQuality] || q.high;
}

// ------------------------------------------------------------ main loop

let resultShown = false;
let _cdTick = 0;
const fpsEl = document.getElementById("hud-fps");

let fpsAccum = 0;
let fpsFrames = 0;
let fpsTimer = 0;

function tick() {
  // 兜底：任何路径（菜单/按钮/新代码）把面板关了 → resultShown 必须跟着复位。
  // 否则 race.phase 一旦回到 over，tick 会误判"还没弹过结算"把面板再弹出来
  //（用户缺陷：再来一局后旧结算面板反复挡屏）。
  if (menu.forceCloseAll && !menu.resultOpen() && resultShown) resultShown = false;
  const dt = Math.min(clock.getDelta(), 0.1);
  const t = clock.elapsedTime;
  const paused = menu.menuOpen() || menu.resultOpen() || !raceStarted;

  if (!paused) {
    water.update(t);
    trackView.update(t);
    // Phase 4 顺序约定：流程 → AI 决策 → 全体船物理 → 比赛判定
    race.updateFlow(dt);
    // updateFlow 产生的 GO 事件必须在 race.update(dt) 之前消费：
    // race.update 会清空 race.event；此前爆缸视觉/音效挂在后面，导致浏览器里根本没点火。
    const flowEvent = race.event?.type === "go" ? race.event : null;
    if (race.phase === "countdown") {
      const n = Math.ceil(race.countdown);
      if (n !== _cdTick) { _cdTick = n; if (n > 0) audio.sfx.count(n); }
      // ---- 起步规则·膨胀期（倒计时轰油门 = 拉转速，转速表实时显示）----
      // 转速越轰越高 → 马达慢慢膨胀（胀度 = rev/revMax）+ 越憋越抖；
      // 结局（爆缸/完美/正常）由 GO 帧 _resolveStarts 按转速结算。
      // ★ updateFlow 可能就在本帧把 phase 从 countdown 推到 racing——GO 帧
      //   仍走膨胀结算，否则最后一帧的转速不计，边界按住者漏判成完美起步。
      race.tickRev(dt, input.isDown("throttle"));
      aiCountdownHold(dt);
      // 胀度感知曲线：sqrt(rev/revMax)——轰到一半转速就有 ~75% 体积，
      // "一按就明显变大"，越轰越见顶（线性要轰满才大，体感"没大多少"）。
      for (const e of race.entries) {
        const r = Math.min(1, (e.rev || 0) / CONFIG.raceFlow.start.revMax);
        e.boat.swell = Math.sqrt(r);
      }
    } else if (!flowEvent) {
      // GO 之后：清膨胀视觉（GO 帧保留，爆缸表演用最后一帧胀度）
      for (const e of race.entries) e.boat.swell = 0;
    }
    if (flowEvent) {
      audio.stopAllSfx();
      audio.sfx.go();
      for (const b of (flowEvent.blown || [])) {
        const e = race.entryOf(b.racerId);
        const bb = e && e.boat;
        if (bb) {
          // 动力锁 = 本次抢跑时长换算出的动态惩罚，最长不超过 popDriverTime(1s)。
          // 视觉动画同源，保证"闪动还原完成才能向前"，但不固定 5 秒。
          const lockT = Math.min(CONFIG.raceFlow.start.popDriverTime, Math.max(0.35, b.penalty || 0));
          bb.popT = Math.max(bb.popT || 0, lockT);
          bb.blownUp = Math.max(bb.blownUp || 0, lockT);
          if (bb.view?.setEngineSwell) bb.view.setEngineSwell(bb.swell || 0); // 爆炸从胀态起弹
          bb.swell = 0; // 泄气：膨胀量归零，pop 动画弹回原形
          if (b.racerId === "player") bb.lastEvent = "falsestart";
          const view = bb.view;
          if (view?.triggerBlowUp) view.triggerBlowUp();
          if (view?.triggerSpringHead) view.triggerSpringHead(lockT);
          audio.sfx.explosion();
          spray.emitBlast(bb.position.x, bb.position.z);
        }
      }
    }
    race.updateAi(dt);
    boat.update(dt, t);
    for (const r of aiRacers) r.boat.update(dt, t);
    items.update(dt); // 道具飞行体在全体船物理之后推进（命中判定当帧生效）
    race.update(dt);
    flyingFish.update(dt, t);
    itemView.update(dt, t);
    flyingFishView.update(dt, t);
    // ---- 音效层：比赛事件 + 船身事件 + 引擎声 ----
    if (race.event) {
      if (race.event.type === "lap" && race.event.racerId === "player") audio.sfx.lap();
      if (race.event.type === "finish" && race.event.racerId === "player") audio.sfx.finish();
    }
    {
      const ev = boat.lastEvent;
      if (ev) {
        const f = { driftboost: "drift", boostpad: "pad", launch: "launch", splash: "splash",
          hit: "hit", bubblepop: "bubblePop", shieldblock: "block",
          hitfish: "hit",
          hitbomb: "missileHit", itembomb: "missile", itembombdrop: "use",
          perfectstart: "perfectStart" }[ev];
        if (f) audio.sfx[f]();
      }
    }
    // 膨胀引擎低吼（非一次性源；GO 帧起本行 engineUpdate 正常接管增益）。
    // 取胀度最大的船来吼——画面在谁身上谁响，玩家轰爆缸时必然最大。
    if (race.phase === "countdown") {
      let maxSwell = 0;
      for (const e of race.entries) maxSwell = Math.max(maxSwell, e.boat.swell || 0);
      if (maxSwell > 0.02) audio.sfx.engineSwell(maxSwell);
    } else {
      audio.engineUpdate(boat.speed, CONFIG.boat.maxSpeed + CONFIG.trackFeatures.boost.speedAdd);
    }
    // Phase 6：粒子（尾迹喷溅随船速；水花由 onSplash 回调触发）
    spray.emitWake(boat, dt, t);
    for (const r of aiRacers) spray.emitWake(r.boat, dt, t);
    spray.update(dt);
    followCam.update(dt, boat);
    hud.update();
    if (gauge) gauge.draw();
    if (miniMap) miniMap.draw();

    // 结算：全员完赛 → 记最佳 + 弹结算界面
    if (race.phase === "over" && !resultShown) {
      resultShown = true;
      // 用户要求：完赛后音效立即停掉——掐掉在途引擎循环之外的全部音源，
      // 引擎声立刻归零（比赛结束了不许再轰油门）。
      audio.stopAllSfx();
      audio.engineUpdate(0, 1);
      const pe = race.entryOf("player");
      const mark = recordRace(pe.place, pe.bestLap, pe.finishTime ?? race.time);
      menu.showResult(race.entries.map((e) => ({
        place: e.place, label: e.label, color: e.color, finished: e.finished,
        finishTime: e.finishTime, bestLap: e.bestLap, id: e.id,
      })), pe, mark);
    }
  }

  // 起步规则视觉收尾：整船膨胀/爆缸弹跳/起跑拉长加在视觉节点上，
  // 渲染后立即复位（下一帧 BoatController 重写 position，scale 显式还原）。
  for (const e of race.entries) {
    const v = e.boat.view;
    if (!v) continue; // 测试桩无视觉节点：安静跳过
    if (v.syncLaunchPop) v.syncLaunchPop(e.boat); // 完美起跑拉长（含 AI）
    if (v.applySwellShake) v.applySwellShake(dt, t);
  }
  renderer.render(scene, camera);
  for (const e of race.entries) {
    const v = e.boat.view;
    if (!v) continue;
    if (v.applySwellShake) {
      v.group.position.copy(e.boat.position);
      v.group.scale.set(1, 1, 1);
      // 动画补充旋转回中性：group 主旋转下一帧由 BoatController 用
      // rotation.set() 整体覆写，残留 x 不会存活一帧以上。
      v.group.rotation.x = 0;
      if (v.restoreHead) v.restoreHead(); // 弹簧头零件回位（动画中由动画自持）
    }
  }

  // HUD 速度条 + FPS（每 0.5s 一并刷新）
  fpsAccum += dt;
  fpsFrames += 1;
  fpsTimer += dt;
  if (fpsTimer >= 0.5) {
    if (fpsEl) fpsEl.textContent = `FPS: ${(fpsFrames / fpsAccum).toFixed(0)}  |  ${boat.speedKmh.toFixed(0)} km/h`;
    fpsAccum = 0;
    fpsFrames = 0;
    fpsTimer = 0;
  }

  if (input.wasPressed("item")) items.use("player", { drop: input.isDown("brake") });
  input.endFrame();
  requestAnimationFrame(tick);
}

const clock = new THREE.Clock();
refreshHudTexts();
menu.refresh();
menu.showPauseMenu(false); // 开场 = 开始菜单
requestAnimationFrame(tick);

window.SWR = { THREE, scene, camera, renderer, CONFIG, boat, input, track, race, features, collision, aiRacers, items, flyingFish, menu, audio,
  // 调试辅助（e2e / 控制台）：把玩家放到指定检查点
  debugPlaceAt: (cp) => {
    const e = race.entryOf("player");
    race.placeAtCheckpoint(e, cp);
    return { lap: e.lap, nextCp: e.nextCp };
  },
};
console.log(
  "%cSketch Wave Racer — Phase 7: full race experience ready. Press START.",
  "color:#e4572e;font-weight:bold"
);
