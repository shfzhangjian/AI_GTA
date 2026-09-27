// Sketch Wave Racer — 碰撞世界（Phase 3）
// 原则 Visual ≠ Collider：木桩等网格在 TrackView 绘制，本模块只存**圆柱近似**
// 数据并做求解。浮标链保持装饰性可穿越（设计内，见 KNOWN_ISSUES #6 的处理决定）。
//
// 两类求解（都在 BoatController 移动之后统一调用 resolve，返回修正后速度，
// 由调用方写回 boat.speed / lateral——不直接写控制器，保证无头测试可独立驱动）：
//   1) resolveObstacles：与固定障碍（木桩/岩石）圆-圆相交 → 推开 + 法向反弹。
//   2) resolveBoatPairs：船-船圆柱相交 → 中点对半分 + 沿连线交换动量分量（轻微偏转）。

import { CONFIG } from "../config.js";

const BOAT_R = () => CONFIG.trackFeatures.colliderRadius;

export class CollisionWorld {
  /** @param {Track} track */
  constructor(track) {
    this.track = track;
    /** 固定障碍：{x, z, r, kind}（y 不参与，全为水面/近水面物体） */
    this.obstacles = [];
    this.rebuild(track);
  }

  rebuild(track = this.track) {
    this.track = track;
    this.obstacles = [];
    // S 弯障碍木桩：与 TrackView 的木桩位置**同一公式**，改布局必须两边同步。
    for (let i = 0; i < 5; i++) {
      const t = 0.55 + i * 0.035;
      const p = track.curve.getPointAt(t);
      const tan = track.curve.getTangentAt(t);
      const s = i % 2 === 0 ? 1 : -1;
      const nx = -tan.z, nz = tan.x;
      this.obstacles.push({
        x: p.x + nx * 15 * 0.45 * s,
        z: p.z + nz * 15 * 0.45 * s,
        r: 0.85,
        kind: "stake",
      });
    }
    // 中央大岛：拦截冲出航道直穿环心的捷径（视觉岛半径 ~30）
    this.obstacles.push({ x: 0, z: 0, r: 30, kind: "island" });
    return this;
  }

  addObstacle(x, z, r, kind = "rock") {
    this.obstacles.push({ x, z, r, kind });
    return this.obstacles[this.obstacles.length - 1];
  }

  // 固定障碍：位置修正 + 水平速度法向反弹。
  // pos: {x,z}（就地修改）；vel: {x,z} 水平速度（就地修改）。
  // 返回本帧发生碰撞的障碍描述（最后一次），否则 null。
  resolveObstacles(pos, vel) {
    const boatR = BOAT_R();
    const bounce = CONFIG.trackFeatures.obBounce;
    const keep = CONFIG.trackFeatures.obSpeedKeep;
    let hit = null;
    for (const o of this.obstacles) {
      let dx = pos.x - o.x, dz = pos.z - o.z;
      const d = Math.hypot(dx, dz);
      const minD = o.r + boatR;
      if (d >= minD) continue;
      if (d < 1e-6) { dx = 1; dz = 0; }
      const nx = dx / (d || 1), nz = dz / (d || 1);
      // 推回切线
      pos.x = o.x + nx * minD;
      pos.z = o.z + nz * minD;
      // 法向分量反弹，切向保留大部分
      const vn = vel.x * nx + vel.z * nz;
      if (vn < 0) {
        vel.x -= (1 + bounce) * vn * nx;
        vel.z -= (1 + bounce) * vn * nz;
        // 整体降速（撞桩子不可能全速继续）
        vel.x *= keep;
        vel.z *= keep;
      }
      hit = { kind: o.kind, nx, nz };
    }
    return hit;
  }

  // 船-船：boats 为 [{position:{x,y,z}, speed, lateral, heading}] 子集。
  // 两两圆-圆检测；相交 → 沿连线对半分位置 + 交换连线方向动量分量 × deflect。
  // 返回碰撞对 [{a,b}]（索引对）供事件/UI 使用。
  resolveBoatPairs(boats) {
    const out = [];
    const boatR = BOAT_R();
    const deflect = CONFIG.trackFeatures.boatDeflect;
    for (let i = 0; i < boats.length; i++) {
      for (let j = i + 1; j < boats.length; j++) {
        const A = boats[i], B = boats[j];
        if (A.airborne || B.airborne) continue; // 空中船不互撞（跳台交错设计）
        let dx = B.position.x - A.position.x;
        let dz = B.position.z - A.position.z;
        let d = Math.hypot(dx, dz);
        const minD = boatR * 2;
        if (d >= minD) continue;
        if (d < 1e-6) { dx = 1; dz = 0; d = 1e-6; }
        const nx = dx / d, nz = dz / d;
        const push = (minD - d) / 2;
        A.position.x -= nx * push; A.position.z -= nz * push;
        B.position.x += nx * push; B.position.z += nz * push;
        // 连线方向的速度分量（前向 + 侧向合成后投影）
        const va = velOf(A), vb = velOf(B);
        const van = va.x * nx + va.z * nz;
        const vbn = vb.x * nx + vb.z * nz;
        const swap = (vbn - van) * 0.5 * deflect; // 等质量弹性交换的一部分
        if (swap !== 0) {
          applyImpulse(A, nx * swap, nz * swap);
          applyImpulse(B, -nx * swap, -nz * swap);
        }
        out.push({ a: i, b: j, nx, nz });
      }
    }
    return out;
  }
}

// 船的近似水平速度向量（前向 × speed + 右向 × lateral），与 BoatController 一致。
function velOf(b) {
  const fx = -Math.sin(b.heading), fz = -Math.cos(b.heading);
  const rx = Math.cos(b.heading), rz = -Math.sin(b.heading);
  return { x: fx * b.speed + rx * b.lateral, z: fz * b.speed + rz * b.lateral };
}

// 把世界系冲量分解回 speed/lateral（近似的轻量偏转）。
function applyImpulse(b, ix, iz) {
  const fx = -Math.sin(b.heading), fz = -Math.cos(b.heading);
  const rx = Math.cos(b.heading), rz = -Math.sin(b.heading);
  b.speed += ix * fx + iz * fz;
  b.lateral += ix * rx + iz * rz;
}
