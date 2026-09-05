import { rand } from '../utils/math.js';

/** 破碎特效预设：不同元素引用不同手感参数（碎片数量/速度/重力/形状） */
export const FX_PRESETS = {
  shatter:  { count: 16, speed: [90, 270], life: [.3, .7],  gravity: 540, size: [1.5, 3.5], shape: 'shard' },
  dust:     { count: 18, speed: [40, 160], life: [.4, .95], gravity: 280, size: [1, 3],     shape: 'dot'   },
  splinter: { count: 13, speed: [70, 210], life: [.35, .8], gravity: 620, size: [2, 4.5],   shape: 'shard' },
  spark:    { count: 20, speed: [130, 330], life: [.18, .5], gravity: 240, size: [1, 2.5],  shape: 'spark' },
};

/**
 * ParticleSystem —— 粒子 / 冲击波环 / 漂浮文字 三类特效的统一容器。
 */
export class ParticleSystem {
  constructor() { this.p = []; this.rings = []; this.texts = []; }

  clear() { this.p.length = 0; this.rings.length = 0; this.texts.length = 0; }

  /** 按预设喷发碎片 */
  burst(x, y, presetName, colors) {
    const p = FX_PRESETS[presetName] || FX_PRESETS.dust;
    for (let i = 0; i < p.count; i++) {
      const a = rand(0, Math.PI * 2), sp = rand(p.speed[0], p.speed[1]);
      this.p.push({
        x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
        life: rand(p.life[0], p.life[1]), max: 1,
        color: colors[(Math.random() * colors.length) | 0],
        size: rand(p.size[0], p.size[1]),
        gravity: p.gravity, shape: p.shape,
        rot: rand(0, Math.PI * 2), vr: rand(-8, 8), drag: 0.995,
      });
      this.p[this.p.length - 1].max = this.p[this.p.length - 1].life;
    }
  }

  /** 爆炸专用：火球 + 烟雾 + 冲击波环 */
  explode(x, y, radius) {
    for (let i = 0; i < 34; i++) {
      const a = rand(0, Math.PI * 2), sp = rand(60, radius * 5);
      this.p.push({
        x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 40,
        life: rand(.3, .8), max: 1,
        color: ['#ff6a4d', '#ffb347', '#ffd970', '#5a5a5a'][(Math.random() * 4) | 0],
        size: rand(2, 5.5), gravity: 320, shape: 'dot', rot: 0, vr: 0, drag: .985,
      });
    }
    this.rings.push({ x, y, r: 6, maxR: radius * 1.4, t: 0, dur: .42, color: 'rgba(255,150,70,' });
  }

  ring(x, y, maxR, colorPrefix) { this.rings.push({ x, y, r: 4, maxR, t: 0, dur: .35, color: colorPrefix }); }

  /** 火球拖尾：一小簇上飘火焰 */
  flame(x, y) {
    for (let i = 0; i < 2; i++) {
      const life = rand(.18, .4);
      this.p.push({
        x: x + rand(-4, 4), y: y + rand(-4, 4),
        vx: rand(-30, 30), vy: rand(-70, -20),
        life, max: life,
        color: ['#ff6a4d', '#ffb347', '#ffd970'][(Math.random() * 3) | 0],
        size: rand(1.5, 3.4), gravity: -60, shape: 'dot', rot: 0, vr: 0, drag: .98,
      });
    }
  }

  text(x, y, str, color = '#fff') { this.texts.push({ x, y, str, color, life: .9, max: .9 }); }

  update(dt) {
    for (const q of this.p) {
      q.life -= dt;
      q.vy += q.gravity * dt;
      q.vx *= q.drag; q.vy *= q.drag;
      q.x += q.vx * dt; q.y += q.vy * dt;
      q.rot += q.vr * dt;
    }
    this.p = this.p.filter(q => q.life > 0);

    for (const r of this.rings) r.t += dt;
    this.rings = this.rings.filter(r => r.t < r.dur);

    for (const t of this.texts) { t.life -= dt; t.y -= 42 * dt; }
    this.texts = this.texts.filter(t => t.life > 0);
  }

  draw(ctx) {
    for (const q of this.p) {
      const a = Math.max(q.life / q.max, 0);
      ctx.globalAlpha = a;
      ctx.fillStyle = ctx.strokeStyle = q.color;
      if (q.shape === 'shard') {
        ctx.save();
        ctx.translate(q.x, q.y); ctx.rotate(q.rot);
        ctx.fillRect(-q.size, -q.size * .45, q.size * 2, q.size * .9);
        ctx.restore();
      } else if (q.shape === 'spark') {
        ctx.lineWidth = q.size * .7;
        ctx.beginPath();
        ctx.moveTo(q.x, q.y);
        ctx.lineTo(q.x - q.vx * .03, q.y - q.vy * .03);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(q.x, q.y, q.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    for (const r of this.rings) {
      const k = r.t / r.dur;
      ctx.globalAlpha = 1 - k;
      ctx.strokeStyle = r.color + `${(1 - k).toFixed(2)})`;
      ctx.lineWidth = 3 * (1 - k) + 1;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.r + (r.maxR - r.r) * k, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.textAlign = 'center';
    for (const t of this.texts) {
      ctx.globalAlpha = Math.min(t.life / t.max * 1.6, 1);
      ctx.font = 'bold 15px Consolas, monospace';
      ctx.fillStyle = t.color;
      ctx.fillText(t.str, t.x, t.y);
    }
    ctx.globalAlpha = 1;
  }
}
