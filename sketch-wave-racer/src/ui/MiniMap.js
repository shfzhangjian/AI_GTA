// Sketch Wave Racer — 小地图（Phase 7）：canvas 俯视迷你赛道 + 各船光点。
// 数据源：race.entries[].boat.position；赛道折线一次性预烘焙。
// 与判定零耦合：纯展示组件。

import { t } from "../i18n/i18n.js";

export function createMiniMap(canvas, track, race) {
  const ctx = canvas.getContext("2d");
  const SIZE = canvas.width; // 方形（css 已定尺寸）
  const PAD = 10;

  let cache = null;
  function bake() {
    // 预烘焙：中心线 → 归一化坐标。track.configure() 切图后 draw() 会自动重烘。
    const pts = [];
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    for (let i = 0; i <= 120; i++) {
      const p = track.curve.getPointAt(i / 120);
      pts.push(p);
      minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
      minZ = Math.min(minZ, p.z); maxZ = Math.max(maxZ, p.z);
    }
    const span = Math.max(maxX - minX, maxZ - minZ) || 1;
    const scale = (SIZE - PAD * 2) / span;
    cache = {
      key: `${track.map?.id || "track"}:${track.length.toFixed(3)}`,
      pts, minX, minZ, scale,
    };
  }
  bake();
  const toPx = (x, z) => [
    PAD + (x - cache.minX) * cache.scale,
    PAD + (z - cache.minZ) * cache.scale, // z 直接当下方向（俯视 -Z 朝上则翻转）
  ];
  const flip = (y) => SIZE - y; // 北（-Z）朝上

  return {
    draw() {
      const key = `${track.map?.id || "track"}:${track.length.toFixed(3)}`;
      if (!cache || cache.key !== key) bake();
      const dpr = 1; // canvas 固定分辨率，靠 css 缩放
      ctx.clearRect(0, 0, SIZE * dpr, SIZE * dpr);
      // 底：纸片 + 墨线
      ctx.fillStyle = "rgba(246,239,226,0.88)";
      ctx.strokeStyle = "#2e2a26";
      ctx.lineWidth = 3;
      roundRect(ctx, 1.5, 1.5, SIZE - 3, SIZE - 3, 12);
      ctx.fill(); ctx.stroke();
      // 航道折线
      ctx.beginPath();
      cache.pts.forEach((p, i) => {
        const [x, y] = toPx(p.x, p.z);
        if (i === 0) ctx.moveTo(x, flip(y)); else ctx.lineTo(x, flip(y));
      });
      ctx.closePath();
      ctx.strokeStyle = "rgba(58,134,255,0.75)";
      ctx.lineWidth = 6;
      ctx.stroke();
      // 起终点：黑白格旗标（用户要求明确标注）——过线中点画短促的
      // 黑白棋盘竖标（垂直于切线方向，像切在航道上的一道旗门）+ 文字标签。
      {
        const s = track.startLine;
        const tan = s.tangent;
        // 世界系：垂直切线的水平法向 = 旗标走向；像素系需经 toPx+flip 映射。
        // 直接取"中心线 ±12m"两个真实赛道点投影连线，天然跟随地图朝向。
        const a = track.pointAt(((0 - 9 / track.length) % 1 + 1) % 1);
        const b = track.pointAt((9 / track.length) % 1);
        const [ax, ay0] = toPx(a.x, a.z);
        const [bx, by0] = toPx(b.x, b.z);
        const ay = flip(ay0), by = flip(by0);
        const cells = 5;
        for (let k = 0; k < cells; k++) {
          const t0 = k / cells, t1 = (k + 1) / cells;
          ctx.strokeStyle = k % 2 ? "#2e2a26" : "#ffffff";
          ctx.lineWidth = 6;
          ctx.beginPath();
          ctx.moveTo(ax + (bx - ax) * t0, ay + (by - ay) * t0);
          ctx.lineTo(ax + (bx - ax) * t1, ay + (by - ay) * t1);
          ctx.stroke();
        }
        // 墨线垫底（白格与蓝航道不粘连）
        ctx.globalCompositeOperation = "destination-over";
        ctx.strokeStyle = "rgba(46,42,38,0.85)";
        ctx.lineWidth = 8.5;
        ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
        ctx.globalCompositeOperation = "source-over";
        // "起终点"标签：贴旗标旁，纸底衬避免压在航道上看不清
        const label = t("minimap.finish");
        ctx.font = '700 10px "Comic Sans MS","PingFang SC",sans-serif';
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        const [mx, my0] = toPx(s.pos.x, s.pos.z);
        const lx = mx + 20, ly = flip(my0) + 15;
        const tw = ctx.measureText(label).width + 8;
        ctx.fillStyle = "rgba(246,239,226,0.92)";
        ctx.strokeStyle = "#2e2a26"; ctx.lineWidth = 1.5;
        roundRect(ctx, lx - tw / 2, ly - 7, tw, 14, 4);
        ctx.fill(); ctx.stroke();
        ctx.fillStyle = "#2e2a26";
        ctx.fillText(label, lx, ly + 0.5);
      }
      // 船：玩家 = 黄大号，AI = 各自色
      for (const e of race.entries) {
        const [x, y] = toPx(e.boat.position.x, e.boat.position.z);
        const isP = e.id === "player";
        const py = flip(y);
        if (isP) drawPlayerIcon(ctx, x, py, e.boat.heading || 0);
        else {
          ctx.beginPath();
          ctx.arc(x, py, 3.5, 0, Math.PI * 2);
          ctx.fillStyle = "#" + (e.color || 0xe4572e).toString(16).padStart(6, "0");
          ctx.fill();
        }
      }
    },
  };
}

function drawPlayerIcon(ctx, x, y, heading) {
  // 外圈：在复杂航道上先把“自己”钉住；箭头：显示船头方向。
  ctx.beginPath();
  ctx.arc(x, y, 6.2, 0, Math.PI * 2);
  ctx.fillStyle = "#f4b942";
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#2e2a26";
  ctx.stroke();

  const fx = -Math.sin(heading);
  const fz = -Math.cos(heading);
  const rx = Math.cos(heading);
  const rz = -Math.sin(heading);
  const tip = [x + fx * 8.5, y - fz * 8.5];
  const left = [x - fx * 4.2 + rx * 4.4, y + fz * 4.2 - rz * 4.4];
  const right = [x - fx * 4.2 - rx * 4.4, y + fz * 4.2 + rz * 4.4];
  ctx.beginPath();
  ctx.moveTo(tip[0], tip[1]);
  ctx.lineTo(left[0], left[1]);
  ctx.lineTo(right[0], right[1]);
  ctx.closePath();
  ctx.fillStyle = "#fff3b0";
  ctx.fill();
  ctx.lineWidth = 1.7;
  ctx.strokeStyle = "#2e2a26";
  ctx.stroke();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
