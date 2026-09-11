/* ============================================================
 * 三维应用核心：渲染器 / 相机 / 控制器 / 拾取 / 视角飞行
 * ============================================================ */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export class App {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = false;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x04101f);
    this.scene.fog = new THREE.Fog(0x04101f, 180, 620);

    this.camera = new THREE.PerspectiveCamera(55, 1, .5, 2000);
    this.camera.position.set(-150, 130, 170);

    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = .06;
    this.controls.maxPolarAngle = Math.PI * .49;
    this.controls.minDistance = 8;
    this.controls.maxDistance = 480;
    this.controls.target.set(10, 4, 0);

    /* ---- 灯光 ---- */
    this.scene.add(new THREE.HemisphereLight(0x9fc4e8, 0x0a1424, 1.05));
    const key = new THREE.DirectionalLight(0xdfeeff, 2.6);
    key.position.set(-120, 200, 110); this.scene.add(key);
    const rim = new THREE.DirectionalLight(0x3f8fff, 1.0);
    rim.position.set(170, 100, -150); this.scene.add(rim);

    /* ---- 星空感背景点 ---- */
    const starGeo = new THREE.BufferGeometry();
    const sp = new Float32Array(320 * 3);
    for (let i = 0; i < 320; i++) {
      const r = 700 + Math.random() * 300, a = Math.random() * Math.PI * 2;
      sp[i*3] = Math.cos(a) * r; sp[i*3+1] = 60 + Math.random() * 400; sp[i*3+2] = Math.sin(a) * r;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(sp, 3));
    this.scene.add(new THREE.Points(starGeo,
      new THREE.PointsMaterial({ color: 0x3f74b8, size: 1.6, transparent: true, opacity: .7 })));

    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.pickTargets = [];
    this.onClickEquip = null;   // 回调(equipData, screenXY)
    this.hoverObj = null;

    /* ---- 相机飞行动画 ---- */
    this.flight = null;

    addEventListener('resize', () => this.resize());
    this._down = null;
    canvas.addEventListener('pointerdown', e => { this._down = [e.clientX, e.clientY]; this.flyTo(null); });
    canvas.addEventListener('wheel', () => this.flyTo(null), { passive: true });
    canvas.addEventListener('pointerup', e => this._pick(e));
    canvas.addEventListener('pointermove', e => this._hover(e));
  }

  resize() {
    const el = this.canvas.parentElement;
    const w = el.clientWidth, h = el.clientHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  _ndc(e) {
    const r = this.canvas.getBoundingClientRect();
    this.pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    return r;
  }

  _pick(e) {
    if (!this._down) return;
    const moved = Math.hypot(e.clientX - this._down[0], e.clientY - this._down[1]);
    this._down = null;
    if (moved > 5 || this.flight) return;   // 拖拽 / 飞行中不拾取
    this._ndc(e);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hits = this.raycaster.intersectObjects(this.pickTargets, true)
      .filter(h => !h.object.userData.noPick && !isLabelPart(h.object) && isShownByCamera(h.object));
    if (hits.length) {
      const root = findEquipRoot(hits[0].object);
      if (root && root.userData.equip && this.onClickEquip) {
        const r = this.canvas.getBoundingClientRect();
        this.onClickEquip(root.userData.equip, e.clientX - r.left, e.clientY - r.top);
        return;
      }
    }
    this.onClickEquip && this.onClickEquip(null);
  }

  _hover(e) {
    if (this.flight) return;
    this._ndc(e);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hit = this.raycaster.intersectObjects(this.pickTargets, true)
      .find(h => !h.object.userData.noPick && findEquipRoot(h.object));
    this.canvas.style.cursor = hit ? 'pointer' : '';
  }

  /** 相机飞行到目标位姿；新飞行立即取代旧的；传 null 取消（用户开始交互时） */
  flyTo(pos, target, dur = 1600, onDone) {
    if (pos === null) {
      const f = this.flight; this.flight = null; f && f.onCancel && f.onCancel(); return;
    }
    this.flight = {
      p0: this.camera.position.clone(), p1: new THREE.Vector3(...pos),
      t0: this.controls.target.clone(), t1: new THREE.Vector3(...target),
      start: performance.now(), dur, onDone, onCancel: () => this._cancelled.add(onDone),
    };
  }

  _cancelled = new Set();

  update(dt) {
    if (this.flight) {
      const f = this.flight;
      let k = (performance.now() - f.start) / f.dur;
      if (k >= 1) {
        k = 1; this.flight = null;
        this.controls.target.copy(f.t1);
        this.camera.position.copy(f.p1);
        if (!this._cancelled.has(f.onDone)) f.onDone && f.onDone();
        this._cancelled.delete(f.onDone);
      } else {
        k = k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;  // easeInOutCubic
        this.camera.position.lerpVectors(f.p0, f.p1, k);
        this.controls.target.lerpVectors(f.t0, f.t1, k);
      }
    }
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}

function isLabelPart(o) { return o.userData && o.userData.isLabel; }
/** 不可见（ghost 透明 / 隐藏）的物体不参与拾取 */
function isShownByCamera(o) {
  let c = o;
  while (c) {
    if (!c.visible) return false;
    if (c.material && c.material.opacity !== undefined && c.material.opacity < 0.15) return false;
    c = c.parent;
  }
  return true;
}
export function findEquipRoot(o) {
  let cur = o;
  while (cur) { if (cur.userData && cur.userData.equip) return cur; cur = cur.parent; }
  return null;
}
