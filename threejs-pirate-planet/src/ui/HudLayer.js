/**
 * HudLayer.js — 船只头顶信息（DOM 叠加层：血槽 / 客人数量 / 修理标记）
 *
 * 用户要求：
 *   · 船只顶部要有血槽和客人数量等信息 → 受伤才显血条（满血不打扰）；
 *     渡轮标「👥 n/5」，海盗船标「☠ 海盗船」（不载客）
 *   · 修理时头上有修理动画 → 「🔧 修理中」文字脉冲（配合 CombatFx 3D 修理环）
 *   · Mini Globe 视口重叠 / 相机背面 / 船体隐藏 → 隐藏标签（互相不打扰）
 *
 * DOM 标签跟随：船体子级 (0, 桅高, 0) 世界坐标 → camera 投影 → CSS 定位。
 */
import * as THREE from 'three';

export class HudLayer {
  /**
   * @param {{sceneManager, cameraManager, rendererManager, root?}} deps
   */
  constructor(deps) {
    this.sm = deps.sceneManager;
    this.cam = deps.cameraManager;
    this.rm = deps.rendererManager;
    /** @type {Array<object>} 船记录（ships + ferries） */
    this.entries = [];
    this.root = deps.root || document.getElementById('ship-hud') || this._createRoot();
    /** @type {Map<object, HTMLElement>} */
    this.labels = new Map();
  }

  _createRoot() {
    const el = document.createElement('div');
    el.id = 'ship-hud';
    el.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:6;overflow:hidden';
    document.body.appendChild(el);
    return el;
  }

  /** 绑定船记录（需含 object / hp / maxHp；渡轮再带 passengers / repairing） */
  bindShips(list) {
    for (const rec of list) {
      if (this.entries.includes(rec)) continue;
      this.entries.push(rec);
      const el = this._makeLabel(rec);
      this.root.appendChild(el);
      this.labels.set(rec.object, el);
    }
  }

  _makeLabel(rec) {
    const el = document.createElement('div');
    const isFerry = !!(rec.object && rec.object.userData && rec.object.userData.isFerry);
    const isPirate = rec.kind === 'pirate';
    el.innerHTML =
      '<div class="tag-name">' + esc(rec.name || '船') + '</div>' +
      (isFerry ? '<div class="tag-pax">👥 <b>0</b>/5</div>' : '') +
      (isPirate ? '<div class="tag-kind">☠ 海盗船</div>' : '') +
      '<div class="tag-bar" style="display:none"><i style="width:100%"></i></div>' +
      '<div class="tag-repair" style="display:none">🔧 修理中</div>';
    el.style.cssText = 'position:absolute;transform:translate(-50%,-100%);display:none;text-align:center;' +
      'font:10px/1.4 ui-monospace,monospace;color:#eaf6ff;text-shadow:0 1px 2px #000';
    return el;
  }

  /** 每帧：投影定位 + 血条 / 客数 / 修理标记刷新 */
  update() {
    if (!this.entries.length) return;
    const cam = this.cam.camera;
    const _v = new THREE.Vector3();
    const mini = this.rm.miniRect;
    this.sm.world.updateMatrixWorld(true);
    for (const rec of this.entries) {
      const el = this.labels.get(rec.object);
      if (!el) continue;
      const obj = rec.object;
      obj.updateMatrixWorld();
      _v.set(0, topHeight(obj), 0);
      obj.localToWorld(_v);
      _v.project(cam);
      const behind = _v.z > 1 || _v.z < -1;
      const x = (_v.x * 0.5 + 0.5) * window.innerWidth;
      const y = (-_v.y * 0.5 + 0.5) * window.innerHeight;
      const inMini = mini && x >= mini.x && x <= mini.x + mini.w && y >= mini.y && y <= mini.y + mini.h;
      if (behind || inMini || !obj.visible) { el.style.display = 'none'; continue; }

      const hp = Math.max(0, rec.hp ?? 1);
      const maxHp = Math.max(1, rec.maxHp ?? 100);
      const ratio = hp / maxHp;

      const nameEl = el.querySelector('.tag-name');
      if (nameEl) nameEl.textContent = (rec.name || '船') + (rec.destroyed ? '（沉没）' : '');

      const barBox = el.querySelector('.tag-bar');
      const bar = el.querySelector('.tag-bar > i');
      if (barBox && bar) {
        barBox.style.display = ratio < 0.999 ? 'block' : 'none';
        bar.style.width = Math.round(ratio * 100) + '%';
        bar.style.background = ratio > 0.6 ? '#3ddc68' : ratio > 0.3 ? '#ffc23d' : '#ff4d4d';
      }
      const pax = el.querySelector('.tag-pax > b');
      if (pax) pax.textContent = String(rec.passengers ? rec.passengers.length : 0);
      const rep = el.querySelector('.tag-repair');
      if (rep) rep.style.display = rec.repairing ? 'block' : 'none';

      el.style.display = 'block';
      el.style.left = Math.round(x) + 'px';
      el.style.top = Math.round(y) + 'px';
    }
  }

  summary() { return { tags: this.labels.size }; }

  clear() {
    for (const [, el] of this.labels) el.remove();
    this.labels.clear();
    this.entries.length = 0;
  }
}

/** 船「头顶」局部高度（桅杆顶 ≈ 模型实测高 ×1.05） */
function topHeight(object) {
  const size = object && object.userData && object.userData.size;
  return (size ? size[1] : 5) * 1.05;
}

function esc(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}
