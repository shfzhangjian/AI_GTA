import { clamp } from '../utils/math.js';

/**
 * 圆 vs AABB 碰撞检测。
 * 返回 { nx, ny, depth }：法线由矩形指向圆心，depth 为穿透深度；不相交返回 null。
 */
export function circleRectHit(cx, cy, r, x, y, w, h) {
  const px = clamp(cx, x, x + w);
  const py = clamp(cy, y, y + h);
  const dx = cx - px, dy = cy - py;
  const d2 = dx * dx + dy * dy;
  if (d2 > r * r) return null;

  if (d2 > 1e-9) {
    const d = Math.sqrt(d2);
    return { nx: dx / d, ny: dy / d, depth: r - d };
  }
  // 圆心在矩形内部：沿最浅穿透轴推出
  const l = cx - x, rr = x + w - cx, t = cy - y, b = y + h - cy;
  const m = Math.min(l, rr, t, b);
  if (m === l) return { nx: -1, ny: 0, depth: l + r };
  if (m === rr) return { nx: 1, ny: 0, depth: rr + r };
  if (m === t) return { nx: 0, ny: -1, depth: t + r };
  return { nx: 0, ny: 1, depth: b + r };
}

/** 速度沿法线镜面反射 */
export function reflect(vel, n) {
  const d = vel.vx * n.nx + vel.vy * n.ny;
  vel.vx -= 2 * d * n.nx;
  vel.vy -= 2 * d * n.ny;
}

/**
 * 轨迹预测（调试模式可视化用）：以小球当前速度做光线步进，模拟墙壁/元素反弹。
 * 返回折线点列 [{x,y}, ...]
 */
export function predictTrajectory(x, y, vx, vy, r, rects, bounds, maxBounces = 7) {
  const pts = [{ x, y }];
  let px = x, py = y, bvx = vx, bvy = vy;
  let dist = 0, bounces = 0;
  const STEP = 6, MAXD = 1500;

  while (dist < MAXD && bounces <= maxBounces) {
    const l = Math.hypot(bvx, bvy) || 1;
    px += (bvx / l) * STEP;
    py += (bvy / l) * STEP;
    dist += STEP;

    let hit = false;
    if (px - r < 0) { px = r; bvx = Math.abs(bvx); hit = true; }
    else if (px + r > bounds.width) { px = bounds.width - r; bvx = -Math.abs(bvx); hit = true; }
    if (py - r < 0) { py = r; bvy = Math.abs(bvy); hit = true; }

    if (!hit && py - r > bounds.height) break; // 飞出底部，预测结束

    if (!hit) {
      for (const rc of rects) {
        const h = circleRectHit(px, py, r, rc.x, rc.y, rc.w, rc.h);
        if (h) {
          px += h.nx * (h.depth + 0.5);
          py += h.ny * (h.depth + 0.5);
          const d = bvx * h.nx + bvy * h.ny;
          bvx -= 2 * d * h.nx;
          bvy -= 2 * d * h.ny;
          hit = true;
          break;
        }
      }
    }
    if (hit) { pts.push({ x: px, y: py }); bounces++; }
  }
  return pts;
}
