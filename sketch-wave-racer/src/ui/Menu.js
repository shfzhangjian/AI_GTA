// Sketch Wave Racer — 开始菜单 / Esc 暂停菜单 / 结算界面（Phase 7）
// 手绘卡通风 DOM 覆盖层：标题、Start、赛道信息、语言/画质切换、控制说明、
// 最佳记录；结算 = 名次表 + 圈速 + 新纪录标记 + Race Again / Return Menu。
// 语言/画质持久化走 src/ui/records.js + i18n.setLang；文案全走 i18n。

import { t, setLang, detectLang } from "../i18n/i18n.js";
import { loadBest, hasAnyBest, saveQualityName, loadQualityName } from "./records.js";
import { CONFIG } from "../config.js";

function el(tag, id, cls, parent, text) {
  const e = document.createElement(tag);
  if (id) e.id = id;
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  if (parent) parent.appendChild(e);
  return e;
}

export function createMenu(app, {
  onStart, onResume, onLangChange, onQualityChange, onSound, isSoundOn = () => true,
  onMapChange, maps = [], selectedMapIndex = 0, race,
}) {
  // ------------------------------------------------ 开始/暂停菜单
  const menu = el("div", "menu", "menu-overlay", app);
  const card = el("div", null, "menu-card", menu);
  el("h1", "menu-title", null, card, "");
  el("div", "menu-track", "menu-sub", card, "");
  const mapWrap = el("div", "menu-maps", "menu-maps", card);
  const controlsEl = el("div", "menu-controls", "menu-controls", card, "");
  const startRuleEl = el("div", "menu-startrule", "menu-startrule", card, "");
  const bestEl = el("div", "menu-best", "menu-best", card, "");

  const row = el("div", "menu-row", "menu-row", card);
  const startBtn = el("button", "btn-start", "btn btn-primary", row, "");
  const resumeBtn = el("button", "btn-resume", "btn", row, "");
  resumeBtn.style.display = "none";

  const setRow = el("div", null, "menu-row menu-row-set", card);
  el("span", null, "menu-label", setRow, "").textContent = "";
  const langBtn = el("button", "btn-lang", "btn btn-mini", setRow, "");
  const soundBtn = el("button", "btn-sound", "btn btn-mini", setRow, "");
  const qLabel = el("span", "lbl-quality", "menu-label", setRow, "");
  const qBtn = el("button", "btn-quality", "btn btn-mini", setRow, "");
  let currentMapIndex = selectedMapIndex;
  const mapButtons = [];
  maps.forEach((m, i) => {
    const btn = el("button", null, "map-card", mapWrap);
    btn.type = "button";
    const title = el("span", null, "map-card-title", btn, m.name);
    const meta = el("span", null, "map-card-meta", btn, "");
    btn.dataset.mapIndex = String(i);
    btn.addEventListener("click", () => {
      currentMapIndex = i;
      onMapChange?.(i, m);
      updateMapButtons();
      refresh();
    });
    mapButtons.push({ btn, title, meta, map: m });
  });

  // ------------------------------------------------ 结算面板（用户要求：欢迎/
  // 比赛中的 DOM 里不得常驻结算对话框）——懒建：仅 showResult 时创建，关闭即
  // display:none 隐藏。startBtn 的 forceCloseAll 监听注册在前，天然清旧面板。
  let result = null, againBtn = null, backBtn = null;
  let rPlace = null, rBody = null, rBest = null;

  // ------------------------------------------------ 本地化刷新
  function refresh() {
    const lang = detectLang();
    document.title = t("menu.title") + " — Sketch Wave Racer";
    const chosen = maps[currentMapIndex] || maps[0];
    menu.querySelector("#menu-title").textContent = t("menu.title");
    menu.querySelector("#menu-track").textContent = chosen
      ? `${t("menu.track")}: ${chosen.name}`
      : t("menu.track");
    updateMapButtons();
    controlsEl.textContent = t("menu.controls");
    startRuleEl.textContent = t("menu.startrule");
    startBtn.textContent = t("menu.start");
    resumeBtn.textContent = t("menu.resume");
    langBtn.textContent = `${t("menu.lang")}: ${lang === "zh" ? "中文 ▸ English" : "English ▸ 中文"}`;
    const q = loadQualityName() || CONFIG.defaultQuality;
    qLabel.textContent = t("menu.quality");
    qBtn.textContent = q;
    soundBtn.textContent = t("menu.sound") + ": " + (isSoundOn() ? t("menu.sound.on") : t("menu.sound.off"));
    // 最佳记录
    const b = loadBest();
    if (!hasAnyBest()) {
      bestEl.innerHTML = `<b>${t("menu.best")}</b><br><span class="menu-dim">${t("menu.best.none")}</span>`;
    } else {
      const bits = [`<b>${t("menu.best")}</b>`];
      if (b.bestLap !== null) bits.push(t("menu.best.bestLap", { t: fmt(b.bestLap) }));
      if (b.finishTime !== null) bits.push(t("menu.best.finishTime", { t: fmt(b.finishTime) }));
      if (b.place !== null) bits.push(t("menu.best.place", { p: b.place }));
      bestEl.innerHTML = bits.join("<br>");
    }
    if (againBtn) againBtn.textContent = t("result.again");
    if (backBtn) backBtn.textContent = t("result.back");
  }

  function updateMapButtons() {
    for (const { btn, meta, map } of mapButtons) {
      const i = Number(btn.dataset.mapIndex);
      btn.classList.toggle("selected", i === currentMapIndex);
      meta.textContent = `${map.label || t("menu.map.random")} · ${"★".repeat(map.difficulty || 1)}`;
      btn.title = t("menu.map.choose");
    }
  }

  // ------------------------------------------------ 事件
  const forceCloseAll = () => { if (result) result.style.display = "none"; menu.style.display = "none"; };
  // 兜底监听：点结算/菜单面板任意处 = 收面板（防任何按钮忘关/事件漏送）
  startBtn.addEventListener("click", () => { forceCloseAll(); onStart(); });
  resumeBtn.addEventListener("click", () => { menu.style.display = "none"; onResume(); });
  langBtn.addEventListener("click", () => {
    const next = detectLang() === "zh" ? "en" : "zh";
    setLang(next);
    refresh();
    onLangChange?.(next);
  });
  soundBtn.addEventListener("click", () => {
    const on = onSound();
    soundBtn.textContent = t("menu.sound") + ": " + (on ? t("menu.sound.on") : t("menu.sound.off"));
  });
  qBtn.addEventListener("click", () => {
    const order = ["high", "auto", "low"];
    const cur = loadQualityName() || CONFIG.defaultQuality;
    const next = order[(order.indexOf(cur) + 1) % order.length];
    saveQualityName(next);
    refresh();
    onQualityChange?.(next);
  });
  // 启动时同步画质持久化（默认档也落盘：菜单/设置显示一致）
  if (!loadQualityName()) saveQualityName(CONFIG.defaultQuality);
  //（again/back 按钮与其监听在 showResult 懒建时注册）

  // ------------------------------------------------ 结算构建
  // entries: [{place, label, color, finished, finishTime, bestLap, id}]
  function showResult(entries, playerEntry, bestMark) {
    const pe = playerEntry;
    // 懒建：每次弹结算建全新面板（文案/监听都是新鲜的）
    result = el("div", "result", "menu-overlay", app);
    result.style.display = "none";
    result.addEventListener("click", () => { result.style.display = "none"; });
    const rCard = el("div", null, "menu-card", result);
    rPlace = el("div", "result-place", "result-place", rCard, "");
    rBody = el("div", "result-body", "result-body", rCard, "");
    rBest = el("div", "result-best", "menu-best", rCard, "");
    const rRow = el("div", null, "menu-row", rCard);
    againBtn = el("button", "btn-again", "btn btn-primary", rRow, t("result.again"));
    backBtn = el("button", "btn-back", "btn", rRow, t("result.back"));
    againBtn.addEventListener("click", () => { forceCloseAll(); onStart(); });
    backBtn.addEventListener("click", () => { result.style.display = "none"; menu.style.display = "flex"; });
    rPlace.innerHTML = `${t("result.place", { p: pe.place })}` +
      (bestMark.newBestPlace ? ` <span class="new-best">★ ${t("result.newBest")}</span>` : "");
    const lines = entries
      .slice()
      .sort((a, b) => a.place - b.place)
      .map((x) => {
        const lapTxt = x.bestLap !== null && x.bestLap !== undefined
          ? `${t("result.bestLap")} ${fmt(x.bestLap)}` : "";
        const isNew = x.id === "player" && bestMark.newBestLap;
        return `<div class="result-line"><span class="rp-dot" style="background:#${(x.color || 0).toString(16).padStart(6, "0")}"></span>` +
          `<b>${x.place}.</b> ${x.label} — ${x.finishTime ? fmt(x.finishTime) : "--"} ` +
          `<span class="menu-dim">${lapTxt}</span>${isNew ? ` <span class="new-best">★ ${t("result.newBest")}</span>` : ""}</div>`;
      });
    rBody.innerHTML = lines.join("");
    rBest.innerHTML = bestMark.newBestTime
      ? `★ ${t("result.newBest")} ${t("result.total")} ${fmt(pe.finishTime)}`
      : `${t("result.total")} ${pe.finishTime ? fmt(pe.finishTime) : "--"}`;
    result.style.display = "flex";
  }

  // ------------------------------------------------ 开关
  return {
    refresh,
    showPauseMenu(hasStarted) {
      resumeBtn.style.display = hasStarted ? "inline-block" : "none";
      startBtn.textContent = hasStarted ? "↻ " + t("menu.start") : t("menu.start");
      menu.style.display = "flex";
    },
    hideMenu() { menu.style.display = "none"; },
    showResult,
    hideResult() { if (result) result.style.display = "none"; },
    forceCloseAll,
    menuOpen: () => menu.style.display === "flex",
    resultOpen: () => !!result && result.style.display === "flex",
  };
}

function fmt(sec) {
  if (sec === null || sec === undefined) return "--";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  const cs = Math.floor((sec * 100) % 100);
  return `${m}:${String(s).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
}
