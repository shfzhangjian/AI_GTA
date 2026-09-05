/**
 * Minimap —— 第一人称模式的右上角 2D 小地图。
 * 静态层（草地/道路/建筑轮廓/树/进入区域）预渲染到离屏画布一次；
 * 每帧仅叠加“视野扇形 + 玩家箭头”，几乎零开销。
 * 数据直接复用 CityBuilder 已算好的碰撞体，天然与场景一致。
 */
import { WORLD } from '../config.js';
import { TREES, ZONES } from '../data/cityLayout.js';

const SIZE = 170; // 小地图边长（CSS 像素）

export class Minimap {
  /** @param {HTMLElement} el 包含 <canvas> 的容器 @param {object} city buildCity() 返回值 */
  constructor(el, city) {
    this.el = el;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    this.canvas = el.querySelector('canvas');
    this.canvas.width = SIZE * dpr;
    this.canvas.height = SIZE * dpr;
    this.ctx = this.canvas.getContext('2d');
    this.ctx.scale(dpr, dpr);

    /** 世界坐标 -> 地图像素 的比例 */
    this.s = SIZE / (WORLD.half * 2);

    // 静态层离屏缓存
    this._buf = document.createElement('canvas');
    this._buf.width = SIZE * dpr;
    this._buf.height = SIZE * dpr;
    const bctx = this._buf.getContext('2d');
    bctx.scale(dpr, dpr);
    this._renderStatic(bctx, city);
    this.agents = city.agents || null; // 行人/狗实时圆点（可选）

    this._lastAngle = 0; // 俯视正下方时 fwd 水平分量≈0，沿用上次朝向
  }

  mx(x) { return (x + WORLD.half) * this.s; }
  mz(z) { return (z + WORLD.half) * this.s; } // 地图向下 = 世界 +z

  _renderStatic(c, city) {
    const H = WORLD.half;
    const s = this.s;
    const mx = (x) => (x + H) * s;
    const mz = (z) => (z + H) * s;

    // 底座与草地四象限（与 GroundBuilder 同一套几何参数）
    c.fillStyle = '#e8ebef';
    c.fillRect(0, 0, SIZE, SIZE);
    const e = WORLD.roadHalf + WORLD.walk;
    const o = H - 1;
    c.fillStyle = '#9cc766';
    for (const [x0, x1, z0, z1] of [[-o, -e, -o, -e], [e, o, -o, -e], [-o, -e, e, o], [e, o, e, o]]) {
      c.fillRect(mx(x0), mz(z0), (x1 - x0) * s, (z1 - z0) * s);
    }

    // 人行道（浅灰十字加粗边）与沥青路（深灰十字）
    const sw = WORLD.roadHalf + WORLD.walk;
    c.fillStyle = '#d7dbe2';
    c.fillRect(mx(-H), mz(-sw), 2 * H * s, 2 * sw * s);
    c.fillRect(mx(-sw), mz(-H), 2 * sw * s, 2 * H * s);
    c.fillStyle = '#3a3f47';
    const rh = WORLD.roadHalf;
    c.fillRect(mx(-H), mz(-rh), 2 * H * s, 2 * rh * s);
    c.fillRect(mx(-rh), mz(-H), 2 * rh * s, 2 * H * s);

    // 建筑轮廓：按高度分三档蓝色，带 1px 偏移假阴影增强可读性
    for (const b of city.colliders.boxes) {
      const h = b.max.y - b.min.y;
      const x = mx(b.min.x);
      const z = mz(b.min.z);
      const w = Math.max(2, (b.max.x - b.min.x) * s);
      const d = Math.max(2, (b.max.z - b.min.z) * s);
      c.fillStyle = 'rgba(40,60,90,0.25)';
      c.fillRect(x + 1, z + 1, w, d);
      c.fillStyle = h > 35 ? '#3f6fa6' : h > 20 ? '#5b87b5' : '#8ba9c6';
      c.fillRect(x, z, w, d);
    }

    // 树木小圆点
    c.fillStyle = 'rgba(110,160,70,0.9)';
    for (const t of TREES) {
      c.beginPath();
      c.arc(mx(t.x), mz(t.z), Math.max(1.2, (t.s ?? 1) * 1.5), 0, Math.PI * 2);
      c.fill();
    }

    // 进入区域标记（蓝色细圈）
    c.strokeStyle = 'rgba(47,143,255,0.8)';
    c.lineWidth = 1.2;
    for (const z of ZONES) {
      c.beginPath();
      c.arc(mx(z.x), mz(z.z), 3.2, 0, Math.PI * 2);
      c.stroke();
    }

    // 指北针
    c.fillStyle = 'rgba(40,60,90,0.8)';
    c.font = 'bold 11px system-ui, sans-serif';
    c.textAlign = 'center';
    c.fillText('N', SIZE / 2, 13);
  }

  /** @param {THREE.Vector3} pos 相机位置 @param {THREE.Vector3} fwd 相机朝向（世界系） */
  update(pos, fwd) {
    const c = this.ctx;
    c.clearRect(0, 0, SIZE, SIZE);
    c.drawImage(this._buf, 0, 0, SIZE, SIZE);

    // 行人（橙）/狗（棕）实时圆点
    if (this.agents) {
      for (const a of this.agents.list) {
        c.fillStyle = a.kind === 'dog' ? '#8a5a2b' : '#e8734a';
        c.beginPath();
        c.arc(this.mx(a.x), this.mz(a.z), 1.6, 0, Math.PI * 2);
        c.fill();
      }
    }

    // 警情：闪烁警车（红蓝交替方块）+ 警察蓝点
    const pol = this.police;
    if (pol?.car) {
      const blink = performance.now() % 400 < 200;
      c.fillStyle = blink ? '#ff4d4d' : '#3b82f6';
      const cp = pol.car.group.position;
      c.fillRect(this.mx(cp.x) - 2.5, this.mz(cp.z) - 2.5, 5, 5);
    }
    if (pol?.cop && pol.cop.downT <= 0) {
      c.fillStyle = '#1f5fff';
      c.beginPath();
      c.arc(this.mx(pol.cop.x), this.mz(pol.cop.z), 2.4, 0, Math.PI * 2);
      c.fill();
    }

    let dx = fwd.x;
    let dz = fwd.z;
    const L = Math.hypot(dx, dz);
    if (L > 1e-3) {
      this._lastAngle = Math.atan2(dx / L, -dz / L); // 屏幕“上”=世界 -z
    }
    const a = this._lastAngle;
    const px = this.mx(pos.x);
    const pz = this.mz(pos.z);

    c.save();
    c.translate(px, pz);
    c.rotate(a);

    // 视野扇形（60° 半透蓝）
    c.fillStyle = 'rgba(47,143,255,0.22)';
    c.beginPath();
    c.moveTo(0, 0);
    c.arc(0, 0, 26, -Math.PI / 2 - 0.52, -Math.PI / 2 + 0.52);
    c.closePath();
    c.fill();

    // 玩家箭头（白底蓝描边）
    c.beginPath();
    c.moveTo(0, -7);
    c.lineTo(5, 5);
    c.lineTo(0, 2);
    c.lineTo(-5, 5);
    c.closePath();
    c.fillStyle = '#ffffff';
    c.strokeStyle = '#2f6fd0';
    c.lineWidth = 1.4;
    c.fill();
    c.stroke();
    c.restore();
  }
}
