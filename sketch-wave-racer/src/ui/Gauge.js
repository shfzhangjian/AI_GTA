// Sketch Wave Racer — 卡通仪表盘（Phase 7 用户指定：右上角赛车指针仪表）
// 手绘简笔画风 canvas 仪表：指针式速度表（km/h）+ 圈数 / 名次 / 圈速·总时间 /
// 漂移蓄力环。判定零耦合——纯展示，只读 race/boat。

import { CONFIG } from "../config.js";

const INK = "#2e2a26";
const PAPER = "rgba(246,239,226,0.92)";
const ACCENT = "#f4b942";
const RED = "#e4572e";
const GREEN = "#35b24c";

export function createGauge(canvas, race, playerEntry) {
  const ctx = canvas.getContext("2d");
  const W = canvas.width, H = canvas.height;
  const CX = W / 2, CY = 78;          // 表盘圆心（上部）
  const R = 62;                        // 表盘半径
  const A0 = Math.PI * 0.82;           // 起始角（左下）
  const A1 = Math.PI * 2.18;           // 结束角（右下）
  const topSpeedKmh = Math.round(CONFIG.boat.maxSpeed * 3.6); // 120
  const maxKmh = 190;                  // 表顶（加速带/道具能冲到 ~170）

  let needle = 0; // 平滑后的指针 km/h

  const line = (x1, y1, x2, y2, w = 2.5, col = INK) => {
    ctx.strokeStyle = col; ctx.lineWidth = w;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  };
  const arc = (r, a0, a1, w, col) => {
    ctx.strokeStyle = col; ctx.lineWidth = w;
    ctx.beginPath(); ctx.arc(CX, CY, r, a0, a1); ctx.stroke();
  };
  const text = (s, x, y, size, col = INK, bold = true, align = "center") => {
    ctx.fillStyle = col;
    ctx.font = `${bold ? "800" : "600"} ${size}px "Comic Sans MS","PingFang SC",sans-serif`;
    ctx.textAlign = align; ctx.textBaseline = "middle";
    ctx.fillText(s, x, y);
  };

  function draw() {
    const e = playerEntry;
    const boat = e.boat;
    ctx.clearRect(0, 0, W, H);

    // ---- 卡片底板（手绘抖动感：双线描边）----
    ctx.fillStyle = PAPER;
    rr(2, 2, W - 4, H - 4, 16); ctx.fill();
    ctx.strokeStyle = INK; ctx.lineWidth = 3.5; rr(2, 2, W - 4, H - 4, 16); ctx.stroke();
    ctx.lineWidth = 1.5; ctx.globalAlpha = 0.35; rr(6, 6, W - 12, H - 12, 12); ctx.stroke(); ctx.globalAlpha = 1;

    // ---- 速度表底盘 ----
    ctx.fillStyle = "#ffffff";
    ctx.beginPath(); ctx.arc(CX, CY, R + 9, 0, Math.PI * 2); ctx.fill();
    line(CX - 0.1, CY, CX - 0.1, CY, 0, INK); // no-op keep
    ctx.strokeStyle = INK; ctx.lineWidth = 3.5;
    ctx.beginPath(); ctx.arc(CX, CY, R + 9, 0, Math.PI * 2); ctx.stroke();

    // 刻度：每 20 km/h 一格，长格带数字
    for (let kmh = 0; kmh <= maxKmh; kmh += 10) {
      const a = A0 + (A1 - A0) * (kmh / maxKmh);
      const major = kmh % 40 === 0;
      const r1 = R - (major ? 12 : 7), r2 = R;
      line(CX + Math.cos(a) * r1, CY + Math.sin(a) * r1, CX + Math.cos(a) * r2, CY + Math.sin(a) * r2, major ? 3 : 1.8);
      if (major) {
        const rt = R - 24;
        text(String(kmh), CX + Math.cos(a) * rt, CY + Math.sin(a) * rt, 10.5, INK, true);
      }
    }
    // 红区（>140）
    arc(R - 3, A0 + (A1 - A0) * (140 / maxKmh), A1, 4, "rgba(228,87,46,0.85)");

    // ---- 起步规则：倒计时转速带（绿=完美起跑区 / 红端=爆缸线）----
    // 只读 race 账本：倒计时中油门 = 空挡轰油门，船速恒 0 但转速 e.rev 上表。
    if (race.phase === "countdown") {
      const pe = playerEntry;
      const rev = (pe && pe.rev) || 0;
      const S = CONFIG.raceFlow.start;
      const gA = (v) => A0 + (A1 - A0) * (Math.min(v, maxKmh) / maxKmh);
      // 绿区弧（奖励区间，按转速 m/s×3.6 折算 km/h 表盘刻度）
      arc(R - 3, gA(S.rpmGreenLo * 3.6), gA(S.rpmGreenHi * 3.6), 4, "rgba(53,178,76,0.9)");
      // 爆缸线刻痕
      {
        const a = gA(S.rpmBlow * 3.6);
        line(CX + Math.cos(a) * (R - 12), CY + Math.sin(a) * (R - 12),
          CX + Math.cos(a) * (R + 1), CY + Math.sin(a) * (R + 1), 3, RED);
        text("爆", CX + Math.cos(a) * (R - 22), CY + Math.sin(a) * (R - 22), 11, RED);
      }
      // 当前转速细针（橙）：与主指针（船速=0）并存，倒计时一眼看懂"在轰空挡"
      {
        const a = gA(rev * 3.6);
        line(CX + Math.cos(a) * (R - 14), CY + Math.sin(a) * (R - 14),
          CX - Math.cos(a) * 6, CY - Math.sin(a) * 6, 2, "rgba(244,185,66,0.95)");
      }
      // 中央大字改显转速（km/h 表显），下方补 "RPM" 标签
      text(Math.round(rev * 3.6) + "", CX, CY + 26, 22, "#b0781e", true);
      text("RPM", CX, CY + 41, 10.5, "#b0781e", false);
    }
    // 120 基准刻度点（游戏极速=黄点）
    // 120 基准刻度点（游戏极速=黄点）
    {
      const a = A0 + (A1 - A0) * (topSpeedKmh / maxKmh);
      ctx.fillStyle = ACCENT;
      ctx.beginPath(); ctx.arc(CX + Math.cos(a) * (R - 3), CY + Math.sin(a) * (R - 3), 3.4, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.stroke();
    }

    // ---- 指针（手绘：墨线粗针 + 空心圆轴心）----
    // 倒计时中主针钉在 0（船真速恒 0——空挡轰油门不溜车），转速另显（见下）。
    const kmh = race.phase === "countdown" ? 0 : Math.abs(boat.speed) * 3.6;
    needle += (kmh - needle) * 0.22; // 平滑摆动
    const na = A0 + (A1 - A0) * (Math.min(needle, maxKmh) / maxKmh);
    line(CX + Math.cos(na) * (R - 16), CY + Math.sin(na) * (R - 16),
      CX - Math.cos(na) * 9, CY - Math.sin(na) * 9, 4);
    ctx.fillStyle = "#fff";
    ctx.beginPath(); ctx.arc(CX, CY, 5.5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.stroke();

    // 数字速度（km/h）
    if (race.phase !== "countdown") {
      text(Math.round(kmh) + "", CX, CY + 26, 22, INK, true);
      text("km/h", CX, CY + 41, 10.5, INK, false);
    }

    // ---- 漂移蓄力弧（表盘下缘）----
    const charge = boat.drifting ? Math.min(1, boat.driftCharge / CONFIG.boat.drift.chargeMax)
      : (boat.driftBoost > 0 ? 1 : 0);
    if (charge > 0.02) {
      arc(R + 4, Math.PI * 0.78, Math.PI * 0.78 + Math.PI * 0.44 * charge, 5, GREEN);
    }

    // ---- 三格数据：名次 / 圈数 / 时间 ----
    const y = H - 34;
    const cw = (W - 20) / 3;
    const cell = (i, top, big, col) => {
      const x = 10 + cw * i;
      ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.globalAlpha = 0.5;
      rr(x + 3, y - 15, cw - 6, 34, 8); ctx.stroke(); ctx.globalAlpha = 1;
      text(top, x + cw / 2, y - 6, 9.5, INK, false);
      text(big, x + cw / 2, y + 9, 14, col || INK, true);
    };
    cell(0, "RANK", P_LABEL(e.place));
    cell(1, "LAP", `${Math.min(e.lap, race.laps)}/${race.laps}`);
    cell(2, "TIME", fmt(race.time));
  }

  const P_LABEL = (p) => ["", "1st", "2nd", "3rd", "4th", "5th", "6th", "7th"][p] || (p + "th");
  const fmt = (sec) => {
    if (sec === null || sec === undefined) return "--:--";
    const m = Math.floor(sec / 60), s = Math.floor(sec % 60);
    return `${m}:${String(s).padStart(2, "0")}`;
  };
  function rr(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  return { draw };
}
