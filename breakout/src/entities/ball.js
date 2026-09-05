import { BALL, PHYSICS } from '../config/constants.js';
import { rand } from '../utils/math.js';

/** 小球：位置 + 速度矢量；stuck 状态吸附在挡板上等待发射 */
export class Ball {
  constructor() {
    this.trail = [];
    this.fireHits = new Map(); // 火球穿透模式：元素id → 上次灼烧时刻（冷却防同帧重复判定）
    this.reset(0, 0);
  }

  reset(x, y) {
    this.x = x; this.y = y;
    this.vx = 0; this.vy = 0;
    this.stuck = true;
    this.trail.length = 0;
    this.fireHits.clear();
  }

  get speed() { return Math.hypot(this.vx, this.vy); }

  setSpeed(s) {
    const l = this.speed || 1;
    this.vx *= s / l;
    this.vy *= s / l;
  }

  /** 发射：以竖直向上为基准 ±25° 随机角 */
  launch(speed) {
    const a = (-90 + rand(-25, 25)) * Math.PI / 180;
    this.vx = Math.cos(a) * speed;
    this.vy = Math.sin(a) * speed;
    this.stuck = false;
  }

  /** 反弹后限制最小垂直速度，避免近乎水平的死循环轨迹 */
  clampBounceDir() {
    if (Math.abs(this.vy) < PHYSICS.minVy) {
      this.vy = Math.sign(this.vy || -1) * PHYSICS.minVy;
      const s = Math.min(Math.hypot(this.vx, this.vy), PHYSICS.maxSpeed);
      this.setSpeed(s);
    }
  }

  update(dt) {
    if (this.stuck) return;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.trail.unshift({ x: this.x, y: this.y });
    if (this.trail.length > BALL.trail) this.trail.pop();
  }
}
