// Sketch Wave Racer — 比赛 HUD（Phase 2；Phase 3 漂移蓄力；Phase 5 道具格与状态）
// 名次 / 圈数 / 时间 / 速度条 / 漂移蓄力 / 道具 / 越界警告 / 事件条。文本全走 i18n。

import { t } from "../i18n/i18n.js";

const EVENT_KEYS = {
  lap: null, finish: null, // 圈事件走原格式
  driftboost: "event.driftboost",
  boostpad: "event.boostpad",
  launch: "event.launch",
  splash: "event.splash",
  hit: "event.hit",
  // Phase 5 使用/命中事件词
  pickup: "event.pickup",
  itemspeed: "event.itemspeed",
  itemturbo: "event.itemturbo",
  itemshield: "event.itemshield",
  itemmissile: "event.itemmissile",
  itembubble: "event.itembubble",
  itemwave: "event.itemwave",
  itemlightning: "event.itemlightning",
  itemgiant: "event.itemgiant",
  itembomb: "event.itembomb",
  itembombdrop: "event.itembombdrop",
  itemstar: "event.itemstar",
  hitmissile: "event.hitmissile",
  hitbubble: "event.hitbubble",
  hitlightning: "event.hitlightning",
  hitbomb: "event.hitbomb",
  hitfish: "event.hitfish",
  shieldblock: "event.shieldblock",
  bubblepop: "event.bubblepop",
  falsestart: "event.falsestart",
  perfectstart: "event.perfectstart",
};

const ITEM_ICONS = {
  speed: "⚡", missile: "💧", bubble: "🫧", shield: "🛡", wave: "🌀", turbo: "🔥",
  lightning: "⚡", giant: "⬆", bomb: "●",
};

export function createHUD(race, playerEntry, topSpeed = 33.3) {
  // 名次/圈数/时间已移入右上角卡通仪表盘（src/ui/Gauge.js canvas 绘制）
  const warnEl = document.getElementById("hud-warn");
  const eventEl = document.getElementById("hud-event");
  const speedEl = document.getElementById("speedbar");
  const chargeEl = document.getElementById("driftcharge");
  const countEl = document.getElementById("hud-countdown");
  const itemEl = document.getElementById("hud-item");
  const statusEl = document.getElementById("hud-item-status");

  let eventUntil = 0;

  return {
    update() {
      const e = playerEntry;
      const boat = e.boat;
      

      // ---- Phase 4 流程展示 ----
      const label = race.flowLabel(); // "3"|"2"|"1"|"GO!"|null
      if (countEl) {
        countEl.style.display = label ? "block" : "none";
        if (label) countEl.textContent = label;
      }
      // Phase 7：结算面板由 Menu.showResult 统一弹（含名次/圈速/★新纪录），
      // 旧 HUD 内嵌结算已移除——避免"欢迎界面还挂着上次结算对话框"的叠加缺陷。
      const lapShown = Math.min(e.lap, race.laps);

      if (warnEl) {
        warnEl.style.display = e.offCourse > 0.4 ? "block" : "none";
        if (e.offCourse > 0.4) warnEl.textContent = t("hud.warn.offcourse");
      }
      if (speedEl) {
        speedEl.style.width = `${Math.min((Math.abs(boat.speed) / topSpeed) * 100, 100)}%`;
      }
      // Phase 5：道具格（当前持有；空格释放）+ 状态角标（盾剩余/被困）
      if (itemEl) {
        const it = boat.item;
        if (it) {
          itemEl.style.display = "flex";
          itemEl.textContent = ITEM_ICONS[it] || "?";
          itemEl.title = t("item." + it);
        } else itemEl.style.display = "none";
      }
      if (statusEl) {
        const bits = [];
        if (boat.shield > 0) bits.push("🛡" + Math.ceil(boat.shield));
        if (boat.trapped > 0) bits.push("🫧" + Math.ceil(boat.trapped));
        if (boat.starBoostLeft > 0) bits.push("★" + Math.ceil(boat.starBoostLeft));
        if (boat.lightningSlow > 0) bits.push("⚡" + Math.ceil(boat.lightningSlow));
        if (boat.giantTime > 0 || boat.giantShrink > 0) {
          bits.push("⬆" + Math.ceil(Math.max(boat.giantTime || 0, boat.giantShrink || 0)));
        }
        statusEl.style.display = bits.length ? "block" : "none";
        if (bits.length) statusEl.textContent = bits.join("  ");
      }
      // Phase 3：漂移蓄力条（漂移中增长；boost 生效时满条闪烁由 CSS 类略，Phase 7 打磨）
      if (chargeEl) {
        const c = boat.drifting ? boat.driftCharge : (boat.driftBoost > 0 ? 1 : 0);
        chargeEl.style.width = `${Math.min(c * 100, 100)}%`;
        chargeEl.style.display = c > 0.02 ? "block" : "none";
      }
      if (eventEl) {
        const ev = race.event;
        const boatEv = boat.lastEvent;
        boat.lastEvent = null; // 消费
        if (ev && (ev.type === "lap" || ev.type === "finish") && ev.racerId === e.id) {
          eventEl.textContent = ev.type === "lap"
            ? `${t("event.lap", { lap: `${lapShown}/${race.laps}` })} ${race.formatTime(ev.lapTime)}`
            : `🏁 ${t("event.finish")} ${t("hud.place", { p: e.place })}`;
          eventUntil = performance.now() + 2500;
        } else if (boatEv && EVENT_KEYS[boatEv]) {
          eventEl.textContent = t(EVENT_KEYS[boatEv]);
          eventUntil = performance.now() + 1200;
        }
        eventEl.style.display = performance.now() < eventUntil ? "block" : "none";
      }
    },
  };
}
