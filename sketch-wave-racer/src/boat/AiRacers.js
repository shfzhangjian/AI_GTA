// Sketch Wave Racer — AI 选手（Phase 4）
// 走线控制律 = RaceState.updateAi 的横向 PD（无头扫参验证：3 圈 maxD<13m、
// 零重置、5 条出生道全部完赛）。本模块只负责"造船 + 摆出生位 + 注册"。

import { createBoat } from "./BoatModel.js";

const AI_COLORS = [0xe4572e, 0x35b24c, 0x5a76d8, 0xb06ad8, 0xd8b93c, 0x3cc4c0];

// @param {Track} track @param {object} ctx {input, track, collision, mates}
// @param {number} count AI 数量 1..6 @param {number[]} skills 0..1（可省略）
// 返回 [{ id, label, color, boat, view, entry }]
export function createAiRacers(track, ctx, count = 3, skills) {
  const s = track.startLine;
  const lateral = s.tangent.clone().cross(new s.pos.constructor(0, 1, 0)).normalize();
  const out = [];
  for (let i = 0; i < Math.max(1, Math.min(6, count)); i++) {
    const color = AI_COLORS[i % AI_COLORS.length];
    const view = createBoat(color);
    const boat = new ctx.BoatClass(view.group, { isDown: () => false }, {
      ...ctx, raceId: `ai${i}`, view, // 起步规则视觉句柄（胀大/爆跳/拉长）
    });
    // 出生格：线后错开 3m，横向 ±1.5m 交错（避免出生即重叠触发碰撞）
    const p = s.pos.clone()
      .addScaledVector(s.tangent, -10 - i * 3)
      .addScaledVector(lateral, ((i % 2) - 0.5) * 3 * ((i >> 1) + 1) * 0.8);
    p.y = 0.2;
    boat.setPose(p, Math.atan2(-s.tangent.x, -s.tangent.z));
    out.push({
      id: `ai${i}`,
      label: `AI ${i + 1}`,
      color,
      boat,
      view,
      skill: skills?.[i] ?? 0.9 - i * 0.12, // 前排更强（画面：领船走得漂亮）
    });
  }
  return out;
}
