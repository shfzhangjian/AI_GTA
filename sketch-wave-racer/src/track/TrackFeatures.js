// Sketch Wave Racer — 赛道互动特征（Phase 3）：加速带 + 跳台
// 原则：数据与可视化分离（同 Track.js）。本模块只定义"哪里有什么、怎么判触发"；
// 网格在 TrackView.js。判定全部基于 Track.nearest 的 (t, dist)，
// 与 RaceState 判定一样与帧率解耦（触发用"进入区间"沿弧长判断，不做帧差）。

import { HALF_WIDTH } from "./Track.js";
import { CONFIG } from "../config.js";
import * as THREE from "three";

export class TrackFeatures {
  /** @param {Track} track */
  constructor(track) {
    this.track = track;
    this.rebuild(track);
  }

  rebuild(track = this.track) {
    this.track = track;
    // ---- 加速带：沿赛道均匀分布 3 条（避开跳台与 S 弯木桩区）
    // pad.t = 加速带起点弧长参数；船"正向跨过起点线"即触发。
    this.boosts = [0.10, 0.42, 0.80].map((t, i) => ({
      index: i,
      t,
      arc: t * track.length,
      halfWidth: CONFIG.trackFeatures.boost.padHalfWidth,
      length: CONFIG.trackFeatures.boost.padLength,
      lastTrigger: -Infinity, // race time
    }));

    // ---- 跳台：单条（S 弯出口直道前，t=0.30）
    const rf = CONFIG.trackFeatures.ramps;
    this.ramps = rf.map((r, i) => {
      const p = track.pointAt(r.t);
      const tan = track.tangentAt(r.t);
      return {
        index: i,
        t: r.t,
        arc: r.t * track.length,
        height: r.height,
        pos: p,
        tangent: tan,
        normal: new THREE.Vector3(-tan.z, 0, tan.x), // 横向
        halfWidth: HALF_WIDTH * 0.6, // 跳台只铺航道中部 60%
      };
    });
    return this;
  }

  // 跳台"坡面高度场"：给 BoatController 判定"船是否冲上坡、是否够弹射速度"。
  // 坡面弧长区 [arc-8, arc+2]（arc = 台顶），横向 |dist| ≤ halfWidth。
  // 返回 null（不在坡上）或 { ramp, h, along01 }。
  rampAt(arc, dist) {
    for (const r of this.ramps) {
      const d = arc - r.arc;
      if (d < -8 || d > 2) continue;
      if (Math.abs(dist) > r.halfWidth) continue;
      const along01 = (d + 8) / 10; // 0 坡底 → 1 台顶
      return { ramp: r, h: r.height * along01, along01 };
    }
    return null;
  }

  // 加速带触发检测：以"连续里程" arcN（RaceState._arcN 语义，只前进）判断
  // 本帧是否**正向跨过**某加速带起点线，且**横向位于带内**。
  // 返回触发的 boost 或 null。同一次通过不重复；绕圈回来可再触发（冷却除外）。
  checkBoostCrossing(prevArcN, arcN, dist, L, raceTime) {
    let hit = null;
    const wrap = (x) => ((x % L) + L) % L;
    const fwd = wrap(arcN - prevArcN); // 正向里程增量（不回绕假象）
    if (fwd <= 0 || fwd > 25) return null; // 不动 / 重锚跳变不触发
    for (const b of this.boosts) {
      const rel = wrap(b.arc - wrap(prevArcN)); // 带起点在 prev 前方的距离
      if (rel > 0 && rel <= fwd) {
        if (dist > b.halfWidth) continue; // 从侧面绕过加速带
        if (raceTime - b.lastTrigger <= CONFIG.trackFeatures.boost.cooldown) continue;
        b.lastTrigger = raceTime;
        hit = b;
      }
    }
    return hit;
  }
}
