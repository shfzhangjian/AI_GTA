import { mulberry32, rand } from '../utils/math.js';

/**
 * ============================================================
 * 元素注册表 —— “砖块建模”的最小单元
 * 每个元素拥有独立的：耐久 hp / 分值 score / 质量 mass / 破碎特效 fx /
 * 破坏音效 sound / 碎片颜色 frag；explosive 类额外带 explode（爆炸物理）。
 * 新增一种元素 = 在这里加一条定义 + 关卡里引用其别名，即可完成建模。
 * ============================================================
 */
export const ELEMENTS = {
  glass: {
    name: '玻璃', hp: 1, score: 12, mass: 1, color: '#7fd8ff', edge: '#c9f2ff',
    frag: ['#9fe6ff', '#e8fbff', '#5ab8e6'], fx: 'shatter', sound: 'glass',
  },
  ice: {
    name: '冰块', hp: 2, score: 14, mass: 2, color: '#5f9fd8', edge: '#a8d8f8',
    frag: ['#bfe6ff', '#7fb8e8', '#ffffff'], fx: 'shatter', sound: 'ice',
  },
  stone: {
    name: '石块', hp: 2, score: 10, mass: 3, color: '#8a8f98', edge: '#b6bcc6',
    frag: ['#9aa0aa', '#6a707a', '#c4c9d0'], fx: 'dust', sound: 'thud',
  },
  wood: {
    name: '木块', hp: 2, score: 8, mass: 2, color: '#a5713c', edge: '#d8a86f',
    frag: ['#c98f4e', '#7d5426', '#e8c088'], fx: 'splinter', sound: 'wood',
  },
  metal: {
    name: '金属', hp: 4, score: 25, mass: 6, color: '#9aa4b2', edge: '#d3dae2',
    frag: ['#c8d2dc', '#7a8492'], fx: 'spark', sound: 'metal',
  },
  gold: {
    name: '金块', hp: 3, score: 60, mass: 5, color: '#e8b64c', edge: '#ffe08a',
    frag: ['#ffd970', '#c8922c', '#fff2b8'], fx: 'spark', sound: 'gold',
  },
  explosive: {
    name: '炸药桶', hp: 1, score: 40, mass: 2, color: '#d8433c', edge: '#ff8a75',
    frag: ['#ff6a4d', '#ffb347', '#8c1f1a'], fx: 'boom', sound: 'explosion',
    explode: { radius: 80, damage: 4, delay: 0.12 }, // 被摧毁后延迟起爆，冲击波范围伤害 → 支持连锁爆炸
  },
};

let _uid = 1;

/**
 * Element —— 砖块网格中的一个可独立破坏单元。
 * 拥有自己的 AABB（x,y,w,h）、耐久与裂纹外观（seed 保证同一元素裂纹稳定）。
 */
export class Element {
  constructor(key, x, y, w, h, row, col, label = null) {
    this.id = _uid++;
    this.key = key;
    this.def = ELEMENTS[key];
    this.x = x; this.y = y; this.w = w; this.h = h;
    this.row = row; this.col = col;
    this.label = label; // 可选：绘制在砖面上的字符（顶部单词砖用）
    this.hp = this.def.hp;
    this.maxHp = this.def.hp;
    this.alive = true;
    this.seed = randiSeed();
  }

  get cx() { return this.x + this.w / 2; }
  get cy() { return this.y + this.h / 2; }

  /**
   * 承受伤害。返回 'destroyed' | 'damaged' | null（已死亡）。
   */
  damage(d = 1) {
    if (!this.alive) return null;
    this.hp -= d;
    if (this.hp <= 0) { this.alive = false; return 'destroyed'; }
    return 'damaged';
  }

  /** 绘制本体 + 受损裂纹（裂纹数量随损失耐久增加） */
  draw(ctx, time) {
    const d = this.def;
    ctx.fillStyle = d.color;
    ctx.fillRect(this.x, this.y, this.w, this.h);

    // 顶部高光条，让元素有体积感
    ctx.fillStyle = 'rgba(255,255,255,.18)';
    ctx.fillRect(this.x + 1, this.y + 1, this.w - 2, 3);
    ctx.strokeStyle = d.edge;
    ctx.lineWidth = 1;
    ctx.strokeRect(this.x + .5, this.y + .5, this.w - 1, this.h - 1);

    if (this.key === 'explosive') {
      // 炸药桶：闪烁引信
      const blink = 0.5 + 0.5 * Math.sin(time * 10 + this.seed);
      ctx.fillStyle = `rgba(255,${(160 * blink) | 0},60,${0.5 + blink * 0.5})`;
      ctx.beginPath();
      ctx.arc(this.cx, this.y + 4, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // 字母标签（单词砖）
    if (this.label) {
      ctx.fillStyle = 'rgba(8,12,22,.82)';
      ctx.font = `bold ${Math.min(this.w, this.h) * .62}px "Segoe UI", Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.label, this.cx, this.cy + 1);
      ctx.textBaseline = 'alphabetic';
    }

    // 裂纹
    const lost = 1 - this.hp / this.maxHp;
    if (lost > 0) {
      const rng = mulberry32(this.seed);
      const n = Math.ceil(lost * 3);
      ctx.strokeStyle = 'rgba(0,0,0,.55)';
      ctx.lineWidth = 1.4;
      for (let i = 0; i < n; i++) {
        let px = this.x + rng() * this.w, py = this.y + rng() * this.h;
        ctx.beginPath();
        ctx.moveTo(px, py);
        for (let s = 0; s < 3; s++) {
          px += (rng() - .5) * this.w * .6;
          py += (rng() - .5) * this.h * .6;
          ctx.lineTo(px, py);
        }
        ctx.stroke();
      }
    }
  }
}

function randiSeed() { return (Math.random() * 0xffffffff) >>> 0; }
