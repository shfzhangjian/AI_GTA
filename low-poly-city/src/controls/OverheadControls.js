/**
 * OverheadControls —— 俯视模式：轨道相机 + 鼠标悬停拾取“进入区域”。
 * 悬停高亮最近城区，点击（非拖拽）触发 onActivate(zone)。
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const HOVER_RANGE = 26; // 距区域中心多远以内算悬停命中

export class OverheadControls {
  /**
   * @param {{camera, dom, zones:Array, picker:THREE.Mesh, onActivate:(zone)=>void}} opts
   */
  constructor({ camera, dom, zones, picker, onActivate }) {
    this.camera = camera;
    this.dom = dom;
    this.zones = zones;
    this.picker = picker;
    this.onActivate = onActivate;
    this.hovered = null;

    this.orbit = new OrbitControls(camera, dom);
    this.orbit.enableDamping = true;
    this.orbit.dampingFactor = 0.08;
    this.orbit.target.set(0, 5, 0);
    this.orbit.minDistance = 34;
    this.orbit.maxDistance = 210;
    this.orbit.maxPolarAngle = Math.PI * 0.46; // 不允许钻到地面以下
    this.orbit.panSpeed = 0.9;
    this.orbit.zoomSpeed = 0.9;

    this._ray = new THREE.Raycaster();
    this._ndc = new THREE.Vector2();
    this._mouse = { x: -1e4, y: -1e4 };
    this._down = [0, 0];

    dom.addEventListener('pointermove', (e) => {
      this._mouse.x = e.clientX;
      this._mouse.y = e.clientY;
    });
    dom.addEventListener('pointerdown', (e) => {
      this._down = [e.clientX, e.clientY];
    });
    // 区分“点击”与“拖拽旋转”：位移超过阈值不触发进入
    dom.addEventListener('click', (e) => {
      if (!this.orbit.enabled) return;
      if (Math.hypot(e.clientX - this._down[0], e.clientY - this._down[1]) > 6) return;
      if (this.hovered) this.onActivate(this.hovered);
    });
  }

  setEnabled(v) {
    this.orbit.enabled = v;
    if (!v) {
      this.hovered = null;
      this.dom.style.cursor = '';
    }
  }

  /** 每帧调用：更新阻尼 + 射线拾取悬停区域 */
  update() {
    if (!this.orbit.enabled) return;
    this.orbit.update();

    const r = this.dom.getBoundingClientRect();
    this._ndc.set(
      ((this._mouse.x - r.left) / r.width) * 2 - 1,
      -((this._mouse.y - r.top) / r.height) * 2 + 1
    );
    this._ray.setFromCamera(this._ndc, this.camera);
    const hits = this._ray.intersectObject(this.picker, false);

    let best = null;
    let bestDist = HOVER_RANGE;
    if (hits.length > 0) {
      const p = hits[0].point;
      for (const z of this.zones) {
        const d = Math.hypot(p.x - z.x, p.z - z.z);
        if (d < bestDist) {
          bestDist = d;
          best = z;
        }
      }
    }
    this.hovered = best;
    this.dom.style.cursor = best ? 'pointer' : 'grab';
  }

  getHovered() {
    return this.hovered;
  }
}
