// Phase 7 headless 单元测试：菜单系统 / 本地最佳成绩 / 语言切换 / 结算 / 小地图
// 约束：纯 Node 桩 <60s。运行：node test/phase7.test.mjs
import assert from "node:assert";

// ---- 迷你 DOM 桩（够 Menu/MiniMap/i18n 用）----
function makeCtx() {
  const noop = () => {};
  return {
    clearRect: noop, beginPath: noop, moveTo: noop, lineTo: noop, closePath: noop,
    arc: noop, arcTo: noop, fill: noop, stroke: noop, fillRect: noop,
    fillText: noop, font: "", textAlign: "", textBaseline: "",
    globalCompositeOperation: "source-over",
    measureText: (t) => ({ width: t.length * 6 }),
    set fillStyle(v) { this._fs = v; }, get fillStyle() { return this._fs; },
    set strokeStyle(v) { this._ss = v; }, get strokeStyle() { return this._ss; },
    set lineWidth(v) { this._lw = v; }, get lineWidth() { return this._lw; },
  };
}

function makeEl(tag) {
  return {
    tag, id: "", className: "", style: { display: "none" }, children: [],
    _text: "", _html: "", _ev: {},
    appendChild(c) { this.children.push(c); c.parent = this; return c; },
    removeChild(c) { this.children = this.children.filter((x) => x !== c); return c; },
    addEventListener(ev, cb) { this._ev[ev] = cb; },
    click() { this._ev.click && this._ev.click(); },
    querySelector(sel) { return findDesc(this, sel.replace(/^#/, "")); },
    get textContent() { return this._text; },
    set textContent(v) { this._text = String(v); },
    get innerHTML() { return this._html; },
    set innerHTML(v) { this._html = String(v); },
    _ctx: null,
    getContext() { return this._ctx || (this._ctx = makeCtx()); },
    width: 150, height: 150,
  };
}

function findDesc(node, id) {
  for (const c of node.children || []) {
    if (c.id === id) return c;
    const r = findDesc(c, id);
    if (r) return r;
  }
  return null;
}

const els = {};
global.window = { devicePixelRatio: 1, innerWidth: 800, innerHeight: 600, addEventListener() {} };
global.document = {
  title: "",
  getElementById: (id) => (els[id] || (els[id] = makeEl("div"))),
  createElement: (tag) => makeEl(tag),
};
const store = {};
global.localStorage = {
  getItem: (k) => (k in store ? store[k] : null),
  setItem: (k, v) => { store[k] = String(v); },
  removeItem: (k) => { delete store[k]; },
};
// Node 自带只读 navigator：defineProperty 注入浏览器语义桩（i18n 自动中文）
Object.defineProperty(globalThis, "navigator", {
  value: { language: "zh-CN" }, configurable: true, writable: true,
});
global.performance = { now: () => 0 };

const { Track } = await import("../src/track/Track.js");
const { RaceState } = await import("../src/race/RaceState.js");
const { BoatController } = await import("../src/boat/BoatController.js");
const { CONFIG } = await import("../src/config.js");
const { createMenu } = await import("../src/ui/Menu.js");
const { createMiniMap } = await import("../src/ui/MiniMap.js");
const REC = await import("../src/ui/records.js");
const { recordRace, loadBest, hasAnyBest, loadQualityName, saveQualityName, BEST_KEY } = REC;

const track = new Track();
const fakeGroup = () => ({
  position: { copy() {}, set() {}, x: 0, y: 0, z: 0 },
  rotation: { set() {} }, scale: { set() {}, x: 1, y: 1, z: 1 }, add() {}, traverse() {},
});

function makeRace(n = 2) {
  const racers = [];
  const COLORS = [0xf4b942, 0xe4572e, 0x35b24c, 0x5a76d8];
  for (let i = 0; i < n; i++) {
    const boat = new BoatController(fakeGroup(), { isDown: () => false }, { track });
    boat.setPose(track.startLine.pos.clone(),
      Math.atan2(-track.startLine.tangent.x, -track.startLine.tangent.z));
    racers.push({
      id: i === 0 ? "player" : "ai" + (i - 1),
      label: i === 0 ? "Player" : "AI " + i,
      color: COLORS[i % COLORS.length], boat,
    });
  }
  const race = new RaceState(track, [racers[0]]);
  racers[0].boat.race = race;
  if (n > 1) {
    race.addAiRacers(racers.slice(1), racers.slice(1).map((_, i) => 0.9 - i * 0.2));
    for (const r of racers.slice(1)) r.boat.race = race;
  }
  return { race };
}

const asResult = (race) => race.entries.map((e) => ({
  place: e.place, label: e.label, color: e.color, finished: e.finished,
  finishTime: e.finishTime, bestLap: e.bestLap, id: e.id,
}));

// ============================================================ 1) 本地最佳成绩：记录/刷新/更差不覆盖/坏数据容错
{
  delete store[BEST_KEY];
  REC._resetMemoryFallback();
  assert.strictEqual(hasAnyBest(), false, "初始应无记录");
  let r = recordRace(1, 44.2, 140.5);
  assert(r.newBestLap && r.newBestTime && r.newBestPlace, "首记录三项全 NEW");
  r = recordRace(2, 50.1, 200);
  assert(!r.newBestLap && !r.newBestTime && !r.newBestPlace, "更差成绩不得覆盖");
  assert.strictEqual(loadBest().bestLap, 44.2);
  r = recordRace(1, 43.0, 135);
  assert(r.newBestLap && r.newBestTime, "更好成绩应刷新");
  assert(!r.newBestPlace, "名次持平不 NEW");
  assert(store[BEST_KEY], "应写 localStorage");
  assert.strictEqual(JSON.parse(store[BEST_KEY]).bestLap, 43.0);
  store[BEST_KEY] = "{broken";
  REC._resetMemoryFallback();
  const b = loadBest();
  assert.strictEqual(b.bestLap, null, "损坏数据应回落空记录（不崩）");
  console.log("PASS best records: record/keep-worse/beat-diff/broken-json safe");
}

// ============================================================ 2) 画质持久化语义
{
  saveQualityName("low");
  assert.strictEqual(loadQualityName(), "low");
  saveQualityName("high");
  assert.strictEqual(loadQualityName(), "high");
  store["swr-quality"] = "ultra-magic";
  assert.strictEqual(loadQualityName(), null, "非法档名读作 null → 上层回落默认");
  console.log("PASS quality persistence: low/high save+load, bogus rejected");
}

// ============================================================ 3) 菜单：构建/开始/暂停/语言/画质切换
{
  store["swr-lang"] = "zh";
  const app = makeEl("div");
  const { race } = makeRace(2);
  let startCalls = 0, resumeCalls = 0, langCalls = 0, qualityCalls = 0;
  const menu = createMenu(app, {
    onStart: () => startCalls++, onResume: () => resumeCalls++,
    onLangChange: () => langCalls++, onQualityChange: () => qualityCalls++,
    race,
  });
  menu.refresh();
  assert(app.children.length >= 1, "应挂开始菜单（结算面板懒建，欢迎界面不常驻）");
  menu.showPauseMenu(false);
  assert.strictEqual(menu.menuOpen(), true, "开场=开始菜单");
  findDesc(app, "btn-start").click();
  assert.strictEqual(startCalls, 1, "START 应触发 onStart");
  assert.strictEqual(menu.menuOpen(), false, "点 START 后菜单收起");
  menu.showPauseMenu(true);
  const resumeBtn = findDesc(app, "btn-resume");
  assert(resumeBtn.style.display !== "none", "已开局暂停应显示 Resume");
  resumeBtn.click();
  assert.strictEqual(resumeCalls, 1);
  assert.strictEqual(menu.menuOpen(), false);
  // 语言切换 zh → en：按钮文案应随之刷新
  assert(/开始比赛/.test(findDesc(app, "btn-start").textContent), "初始中文按钮");
  findDesc(app, "btn-lang").click();
  assert.strictEqual(langCalls, 1);
  assert(/START/.test(findDesc(app, "btn-start").textContent),
    `切 English 后按钮应英文, got ${findDesc(app, "btn-start").textContent}`);
  assert(store["swr-lang"] === "en", "语言应持久化");
  // 画质切换：按钮三档循环 + 持久化 + 回调（桩无原生 click，手动派发）
  const qBtn = findDesc(app, "btn-quality");
  qBtn._ev.click();
  assert.strictEqual(qualityCalls, 1, "画质按钮应触发回调链");
  assert(["high", "auto", "low"].includes(store["swr-quality"]), "画质应持久化三档之一");
  console.log("PASS menu: start/resume/lang(zh→en)/quality all reactive");
}

// ============================================================ 4) 结算界面：名次表 + 新纪录标记 + 双按钮
{
  store["swr-lang"] = "zh";
  const app = makeEl("div");
  const { race } = makeRace(3);
  const menu = createMenu(app, { onStart() {}, onResume() {}, race });
  menu.refresh();
  const pe = race.entryOf("player");
  pe.place = 1; pe.bestLap = 43.9; pe.finishTime = 132.4; pe.finished = true;
  race.entries.forEach((e, i) => { if (i) { e.finished = true; e.finishTime = 140 + i; } });
  const mark = { newBestLap: true, newBestTime: true, newBestPlace: true };
  menu.showResult(asResult(race), pe, mark);
  assert.strictEqual(menu.resultOpen(), true, "结算应弹出");
  const body = findDesc(app, "result-body");
  assert(/1\./.test(body.innerHTML) && /2\./.test(body.innerHTML), "名次表应含各行");
  assert(findDesc(app, "result-place").innerHTML.includes("★") || body.innerHTML.includes("★"),
    "新纪录应有 ★ 标记");
  findDesc(app, "btn-again").click();
  assert.strictEqual(menu.resultOpen(), false, "再来一局应收结算");
  menu.showResult(asResult(race), pe, {});
  findDesc(app, "btn-back").click();
  assert.strictEqual(menu.resultOpen(), false);
  assert.strictEqual(menu.menuOpen(), true, "Return Menu 应弹开始菜单");
  console.log("PASS result screen: rankings + ★new-best + again/back flow");
}

// ============================================================ 5) 小地图：绘制不崩、全员光点、空局健壮
{
  const { race } = makeRace(4);
  // 桩的 getContext() 每次新建：先建 mini（其持有 ctxA），再取同一 ctx 装 arc 探针
  const canvas = makeEl("canvas");
  const ctxA = canvas.getContext(); // 与 createMiniMap 内部 getContext 同一引用
  let drawnArcs = 0;
  ctxA.arc = () => { drawnArcs++; };
  const mini = createMiniMap(canvas, track, race);
  race.entries.forEach((e, i) => {
    const p = track.pointAt(i * 0.2);
    e.boat.position.x = p.x; e.boat.position.z = p.z;
  });
  let lineToCalls = 0;
  const origLineTo = ctxA.lineTo;
  ctxA.lineTo = (...a) => { lineToCalls++; return origLineTo(...a); };
  mini.draw();
  assert(drawnArcs >= 4, `每船应画一个光点, got ${drawnArcs}`);
  assert(lineToCalls >= 6 + 2, `起终点旗标应画棋盘格线(≥7 段 lineTo), got ${lineToCalls}`);
  const mini2 = createMiniMap(canvas, track, { entries: [] });
  mini2.draw();
  console.log(`PASS minimap: ${drawnArcs} boat dots drawn, robust to empty`);
}

// ============================================================ 6) i18n：Phase 7 键中英齐全 + 占位替换
{
  const keys = ["menu.title", "menu.start", "menu.track", "menu.controls", "menu.best",
    "menu.best.none", "menu.resume", "result.place", "result.newBest", "result.again",
    "result.back", "hud.speed", "event.result", "menu.startrule", "event.perfectstart", "minimap.finish"];
  const { t } = await import("../src/i18n/i18n.js");
  for (const lang of ["zh", "en"]) {
    store["swr-lang"] = lang;
    for (const k of keys) {
      const v = t(k);
      assert(v !== k, `语言 ${lang} 缺键 ${k}（回落键名）`);
      assert(v.length > 0);
    }
  }
  store["swr-lang"] = "zh";
  assert(t("result.place", { p: 3 }).includes("3"), "占位 {p} 应替换");
  assert(t("menu.best.bestLap", { t: "0:44.20" }).includes("0:44.20"), "占位 {t} 应替换");
  console.log(`PASS i18n: ${keys.length} Phase-7 keys complete in zh/en + placeholders`);
}

console.log("ALL PHASE-7 HEADLESS TESTS PASSED");
