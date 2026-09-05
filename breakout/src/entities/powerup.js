/**
 * 掉落道具 —— 砖块破坏后按概率坠落，挡板接住即生效。
 * multi  多球：现有球各分裂出两颗
 * wide   加长：挡板 +60%，10s
 * narrow 缩短：挡板 -38%（负面道具），8s
 * fire   火球：6s 内小球穿透砖块并造成 3 倍伤害、火焰拖尾，
 *        且挡板接球自动开炮 / 空格·X 手动发射子弹
 */
export const POWERUPS = {
  multi:  { name: '多球', icon: '×3', color: '#50fa7b' },
  wide:   { name: '加长', icon: '+ +', color: '#4fd8ff' },
  narrow: { name: '缩短', icon: '-',  color: '#ff7b7b' },
  fire:   { name: '火球', icon: '✹',  color: '#ffb347' },
};

/** 掉落权重（负道具比例低一点，保证乐趣） */
export const DROP_WEIGHTS = [['fire', .34], ['wide', .28], ['multi', .22], ['narrow', .16]];

export function rollDropType() {
  let r = Math.random(), acc = 0;
  for (const [type, w] of DROP_WEIGHTS) { acc += w; if (r <= acc) return type; }
  return DROP_WEIGHTS[0][0];
}

let _pid = 1;

export class PowerUp {
  constructor(type, x, y) {
    this.id = _pid++;
    this.type = type;
    this.def = POWERUPS[type];
    this.x = x; this.y = y;      // 中心坐标
    this.w = 52; this.h = 20;
    this.vy = 155;
    this.t = 0;
  }

  update(dt) { this.y += this.vy * dt; this.t += dt; }

  rect() { return { x: this.x - this.w / 2, y: this.y - this.h / 2, w: this.w, h: this.h }; }

  draw(ctx) {
    const d = this.def;
    const wob = Math.sin(this.t * 6) * 0.12; // 轻微摇摆
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(wob);
    ctx.shadowColor = d.color;
    ctx.shadowBlur = 10;
    ctx.fillStyle = 'rgba(6,10,20,.85)';
    ctx.strokeStyle = d.color;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    const r = this.h / 2;
    ctx.roundRect?.(-this.w / 2, -r, this.w, this.h, r);
    if (!ctx.roundRect) { ctx.rect(-this.w / 2, -r, this.w, this.h); }
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = d.color;
    ctx.font = 'bold 12px Consolas, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${d.icon} ${d.name}`, 0, 1);
    ctx.textBaseline = 'alphabetic';
    ctx.restore();
  }
}
