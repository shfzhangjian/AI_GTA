import { PADDLE, VIEW, PHYSICS } from '../config/constants.js';
import { clamp } from '../utils/math.js';

/** 挡板：跟随指针或键盘；反弹角度取决于击中偏移（经典打砖块手感） */
export class Paddle {
  constructor() {
    this.w = PADDLE.w;
    this.h = PADDLE.h;
    this.y = PADDLE.y;
    this.x = VIEW.width / 2; // 中心 X
    this.vx = 0;
  }

  rect() { return { x: this.x - this.w / 2, y: this.y - this.h / 2, w: this.w, h: this.h }; }

  update(dt, input) {
    const prev = this.x;
    if (input.mode === 'pointer' && input.pointerX != null) {
      this.x = input.pointerX;
    } else {
      const dir = (input.keys.has('ArrowRight') || input.keys.has('d') ? 1 : 0)
                - (input.keys.has('ArrowLeft')  || input.keys.has('a') ? 1 : 0);
      this.x += dir * PADDLE.keySpeed * dt;
    }
    this.x = clamp(this.x, this.w / 2, VIEW.width - this.w / 2);
    this.vx = (this.x - prev) / Math.max(dt, 1e-4);
  }

  /**
   * 顶部命中时的角度映射反弹：
   * 击中偏移 r∈[-1,1] → 反弹角 = r × 60°（相对竖直），叠加少量挡板横向动量。
   */
  reflect(ball) {
    const r = clamp((ball.x - this.x) / (this.w / 2), -1, 1);
    const a = r * PADDLE.maxBounceAngle;
    let ux = Math.sin(a) + clamp(this.vx / 3000, -0.25, 0.25);
    let uy = -Math.abs(Math.cos(a));
    const l = Math.hypot(ux, uy) || 1;
    const s = Math.min(ball.speed || PHYSICS.maxSpeed, PHYSICS.maxSpeed);
    ball.vx = (ux / l) * s;
    ball.vy = (uy / l) * s;
  }
}
