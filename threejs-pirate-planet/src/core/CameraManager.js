/**
 * CameraManager.js — 相机与视角状态机（§20–§23）
 *
 * 视角：GLOBE（全球轨道） / LOCAL（贴地，弯曲地平线） / FOLLOW（跟随船只）
 * 切换与导航一律走 FlyTo 平滑动画，禁止瞬移（§23）。
 *
 * 相机一律用「经纬度 + 距离/高度」参数化描述，
 * 再经 GeoUtils 转成世界位置 —— 保证飞到球体任何一侧都不会翻转错误（§30）。
 */
import * as THREE from 'three';
import { CAMERA, PLANET } from '../config.js';
import { latLonToVector3, rotateInTangentPlane, vector3ToLatLon } from '../utils/GeoUtils.js';

export const ViewMode = { GLOBE: 'GLOBE', LOCAL: 'LOCAL', FOLLOW: 'FOLLOW' };

/** 平滑参数 */
const EASE = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const LOCAL_PITCH_DEFAULT = 52;
const LOCAL_PITCH_MIN = 34;
const LOCAL_PITCH_MAX = 68;

export class CameraManager {
  /** @param {number} aspect */
  constructor(aspect) {
    this.camera = new THREE.PerspectiveCamera(CAMERA.FOV_GLOBE, aspect, CAMERA.NEAR, CAMERA.FAR);

    /** 当前视角的「球面参数」表示 */
    this.state = {
      lat: 20,
      lon: -30,
      dist: CAMERA.GLOBE_DIST_DEFAULT, // GLOBE: 到球心距离；LOCAL: 距地表高度
      yaw: 0,                          // LOCAL 环视方位
      pitch: LOCAL_PITCH_DEFAULT,       // LOCAL 斜俯角；越大越接近垂直俯视
    };
    this.mode = ViewMode.GLOBE;
    this.followTarget = null;

    this._lookTarget = new THREE.Vector3();
    this._tmpA = new THREE.Vector3();
    this._tmpB = new THREE.Vector3();

    /** 飞行动画状态 */
    this.fly = null;

    this._orbit = { active: false, id: -1, lastX: 0, lastY: 0, moved: 0 };
    this._apply();
  }

  /**
   * 全球视角「大小按屏幕适配」：反算相机距离，使星球(含大气辉光)正好占满视口。
   *   可见半径 = 球半径 / sin(视场半角) ；宽屏受垂直 FOV 限制，竖屏受水平 FOV 限制，取更大者。
   *   乘 fitMargin(>1) 留边距，保证居中且完整可见（§21 一屏看全）。
   * @param {number} fitMargin 边距系数，1.0=刚好贴边
   */
  fitGlobeToView(fitMargin = 1.06) {
    const R = PLANET.ATMOSPHERE_RADIUS;              // 最外层：大气辉光
    const fovV = THREE.MathUtils.degToRad(this.camera.fov);
    const aspect = this.camera.aspect || 1;
    const fovH = 2 * Math.atan(Math.tan(fovV / 2) * aspect);
    const dist = Math.max(R / Math.sin(fovV / 2), R / Math.sin(fovH / 2)) * fitMargin;
    return dist;
  }

  get isFlying() {
    return !!this.fly;
  }

  resize(aspect) {
    this.camera.aspect = aspect;
    // 局部视角用更宽的 FOV 强化曲率与地平线弯曲
    this.camera.fov = this.mode === ViewMode.GLOBE ? CAMERA.FOV_GLOBE : CAMERA.FOV_LOCAL;
    this.camera.updateProjectionMatrix();
  }

  /** 由球面参数计算世界位置与注视点 */
  _apply() {
    const s = this.state;
    if (this.mode === ViewMode.GLOBE) {
      // 适配距离作「最小距离」，真正用的是可被滚轮改的 state.dist（之前完全没用 state.dist → 缩放失效）
      const fit = this.fitGlobeToView();
      const dist = Math.max(s.dist || fit, fit);
      this.camera.position.copy(latLonToVector3(s.lat, s.lon, dist, this._tmpA));
      this._lookTarget.set(0, 0, 0);
    } else {
      // LOCAL / FOLLOW：RTS 式斜俯视。state.lat/lon 是镜头关注的地表点；
      // 相机放在该点的后上方，看向前方一点，而不是直盯球心。
      const alt = THREE.MathUtils.clamp(s.dist, CAMERA.LOCAL_ALT_MIN, CAMERA.LOCAL_ALT_MAX);
      const target = latLonToVector3(s.lat, s.lon, PLANET.RADIUS + 1.2, this._tmpA);
      const normal = this._tmpB.copy(target).normalize();
      const north = new THREE.Vector3(0, 1, 0).projectOnPlane(normal);
      if (north.lengthSq() < 1e-8) north.set(0, 0, 1).projectOnPlane(normal);
      north.normalize();
      const forward = rotateInTangentPlane(north, normal, s.yaw, new THREE.Vector3());
      const pitch = THREE.MathUtils.degToRad(THREE.MathUtils.clamp(s.pitch || LOCAL_PITCH_DEFAULT, LOCAL_PITCH_MIN, LOCAL_PITCH_MAX));
      const back = alt / Math.tan(pitch);
      const lookAhead = THREE.MathUtils.clamp(alt * 0.45, 4, 18);

      this.camera.position.copy(target)
        .addScaledVector(normal, alt)
        .addScaledVector(forward, -back);
      this._lookTarget.copy(target)
        .addScaledVector(forward, lookAhead)
        .addScaledVector(normal, Math.max(0.8, alt * 0.05));
      this._localUpNormal = normal.clone();
    }

    // ⭐ 相机 UP 规则
    //   · RTS 贴地视角（LOCAL/FOLLOW）：UP = 相机所在点的表面法线
    //     → 若用世界 +Y，相机绕球运动时画面会翻（这就是之前局部视角「怼地平线/翻转」的根因）
    //   · 全球视角：UP = 世界 +Y（北极朝上），极区退化时换参考轴防 lookAt 抖动
    if (this._localUpNormal) {
      this.camera.up.copy(this._localUpNormal);
    } else {
      const dir = this._tmpB.copy(this.camera.position).normalize();
      const up = this._tmpA.set(0, 1, 0);
      if (Math.abs(dir.dot(up)) > 0.999) up.set(0, 0, 1);
      this.camera.up.copy(up);
    }
    this._localUpNormal = null;
    this.camera.lookAt(this._lookTarget);
  }

  /** 每帧：处理飞行动画 + 应用参数 */
  update(dt) {
    if (this.fly) {
      const f = this.fly;
      f.t = Math.min(1, f.t + dt / f.duration);
      const e = EASE(f.t);

      // 位置沿「经纬度」插值 → 相机轨迹贴球面走弧线，不会直穿球体
      this.state.lat = f.from.lat + (f.to.lat - f.from.lat) * e;
      this.state.lon = this._lerpLon(f.from.lon, f.to.lon, e);
      // 距离单调 ease 插值（不做 sin 弧线抬升）→ 全球视角下星球始终居中、平滑推拉
      this.state.dist = f.from.dist + (f.to.dist - f.from.dist) * e;
      this.state.yaw = f.from.yaw + (f.to.yaw - f.from.yaw) * e;
      this.state.pitch = f.from.pitch + (f.to.pitch - f.from.pitch) * e;

      if (f.t >= 1) {
        this.mode = f.mode;
        this.fly = null;
        this._onFlyDone && this._onFlyDone();
      }
    }

    if (this.mode === ViewMode.FOLLOW && this.followTarget) this._syncFollow();
    this._apply();
  }

  _syncFollow() {
    const t = this.followTarget;
    if (!t || !t.parent) { this.followTarget = null; this.mode = ViewMode.LOCAL; return; }
    const p = this._tmpA.setFromMatrixPosition(t.matrixWorld);
    const ll = this._posToLatLon(p);
    this.state.lat = ll.lat;
    this.state.lon = ll.lon;
    this.state.yaw = 0;
  }

  _posToLatLon(p) {
    const r = p.length();
    const lat = Math.asin(THREE.MathUtils.clamp(p.y / r, -1, 1)) * 180 / Math.PI;
    let lon = Math.atan2(p.z, -p.x) * 180 / Math.PI - 180;
    lon = ((lon + 180) % 360 + 360) % 360 - 180;
    return { lat, lon };
  }

  _lerpLon(a, b, t) {
    let d = ((b - a + 540) % 360) - 180; // 最短经度差
    return a + d * t;
  }

  /**
   * 飞往某处（平滑，§23/§26）。
   * @param {{lat:number, lon:number, dist?:number, mode?:string, duration?:number, arc?:number, yaw?:number}} to
   */
  flyTo(to, onDone) {
    const mode = to.mode || this.mode;
    const from = { ...this.state };
    const target = {
      lat: to.lat,
      lon: this._nearestLon(from.lon, to.lon),
      dist: to.dist ?? (mode === ViewMode.GLOBE ? this.fitGlobeToView() : CAMERA.LOCAL_ALT_DEFAULT),
      yaw: to.yaw ?? (mode === ViewMode.GLOBE ? 0 : this.state.yaw),
      pitch: to.pitch ?? (mode === ViewMode.GLOBE ? LOCAL_PITCH_DEFAULT : this.state.pitch),
    };
    // 跨视角飞行时抬升弧线，观感更顺
    const crossView = mode !== this.mode;
    this.fly = {
      t: 0,
      duration: to.duration ?? (crossView ? CAMERA.FLY_DURATION : Math.max(0.7, CAMERA.FLY_DURATION * 0.7)),
      from,
      to: target,
      mode,
      arc: to.arc ?? (crossView ? 90 : 12),
    };
    // 视角切换瞬间即更新 FOV，配合位置插值完成过渡
    this.camera.fov = mode === ViewMode.GLOBE ? CAMERA.FOV_GLOBE : CAMERA.FOV_LOCAL;
    this.camera.updateProjectionMatrix();
    this._onFlyDone = onDone || null;
    return this.fly;
  }

  _nearestLon(fromLon, toLon) {
    let d = ((toLon - fromLon + 540) % 360) - 180;
    return fromLon + d;
  }

  /** 切换视角（平滑动画） */
  setMode(mode, anchor = null) {
    if (mode === ViewMode.FOLLOW) return; // 须经 follow() 进入
    const dist = mode === ViewMode.GLOBE ? CAMERA.GLOBE_DIST_DEFAULT : CAMERA.LOCAL_ALT_DEFAULT;
    const a = anchor || { lat: this.state.lat, lon: this.state.lon };
    this.flyTo({ lat: a.lat, lon: a.lon, dist, mode, pitch: LOCAL_PITCH_DEFAULT });
  }

  /** 跟随目标（船） */
  follow(object, dist = CAMERA.LOCAL_ALT_DEFAULT) {
    this.followTarget = object;
    this.mode = ViewMode.FOLLOW;
    this.state.dist = dist;
    this.camera.fov = CAMERA.FOV_LOCAL;
    this.camera.updateProjectionMatrix();
  }

  unfollow() {
    this.followTarget = null;
    this.mode = ViewMode.LOCAL;
  }

  // ───────────── 鼠标交互（自实现，避免 OrbitControls 与球面参数化冲突） ─────────────

  /**
   * 拖拽旋转。GLOBE：改变观察经纬度并平移 yaw 视角；LOCAL：环视。
   */
  onPointerDown(x, y, id = 0) {
    this._orbit.active = true;
    this._orbit.id = id;
    this._orbit.lastX = x;
    this._orbit.lastY = y;
    this._orbit.moved = 0;
  }

  onPointerMove(x, y) {
    if (!this._orbit.active) return 0;
    const dx = x - this._orbit.lastX;
    const dy = y - this._orbit.lastY;
    this._orbit.lastX = x;
    this._orbit.lastY = y;
    this._orbit.moved += Math.abs(dx) + Math.abs(dy);

    if (this.fly) this.fly = null; // 用户操作即中断飞行

    if (this.mode === ViewMode.GLOBE) {
      this.state.lon -= dx * 0.22;
      this.state.lat = THREE.MathUtils.clamp(this.state.lat + dy * 0.22, -89, 89);
    } else {
      this.state.yaw -= dx * 0.008;
      this.state.pitch = THREE.MathUtils.clamp(this.state.pitch + dy * 0.12, LOCAL_PITCH_MIN, LOCAL_PITCH_MAX);
    }
    return this._orbit.moved;
  }

  onPointerUp() {
    const moved = this._orbit.moved;
    this._orbit.active = false;
    return moved;
  }

  /** 滚轮缩放：GLOBE 改轨道半径，LOCAL 改贴地高度 */
  onWheel(deltaY) {
    if (this.fly) this.fly = null;
    const k = 1 + Math.sign(deltaY) * 0.12;
    if (this.mode === ViewMode.GLOBE) {
      const fit = this.fitGlobeToView();          // 适配为最小可见距离
      this.state.dist = THREE.MathUtils.clamp(this.state.dist * k, fit, CAMERA.GLOBE_DIST_MAX);
    } else {
      this.state.dist = THREE.MathUtils.clamp(this.state.dist * k, CAMERA.LOCAL_ALT_MIN, CAMERA.LOCAL_ALT_MAX);
    }
  }

  /** LOCAL/FOLLOW：沿当前镜头方向移动关注点，单位为世界距离 */
  moveLocal(forwardStep = 0, rightStep = 0) {
    if (this.fly) this.fly = null;
    if (this.mode === ViewMode.GLOBE) return;

    const focus = latLonToVector3(this.state.lat, this.state.lon, PLANET.RADIUS, this._tmpA);
    const normal = this._tmpB.copy(focus).normalize();
    const north = new THREE.Vector3(0, 1, 0).projectOnPlane(normal);
    if (north.lengthSq() < 1e-8) north.set(0, 0, 1).projectOnPlane(normal);
    north.normalize();
    const forward = rotateInTangentPlane(north, normal, this.state.yaw, new THREE.Vector3());
    const right = new THREE.Vector3().crossVectors(forward, normal).normalize();
    const moved = focus.clone()
      .addScaledVector(forward, forwardStep)
      .addScaledVector(right, rightStep)
      .normalize()
      .multiplyScalar(PLANET.RADIUS);
    const ll = vector3ToLatLon(moved);
    this.state.lat = THREE.MathUtils.clamp(ll.lat, -82, 82);
    this.state.lon = ll.lon;
  }

  /** Mini Globe 点击 → 飞往该球面位置（§26） */
  flyToLatLon(lat, lon, opts = {}) {
    return this.flyTo({
      lat,
      lon,
      mode: ViewMode.LOCAL,
      dist: CAMERA.LOCAL_ALT_DEFAULT,
      ...opts,
    });
  }

  get state_() {
    return this.state;
  }
}

// 追加：飞行时对外暴露目标视角（供 UI 同步按钮高亮）
Object.defineProperty(CameraManager.prototype, 'pendingMode', {
  get() { return this.fly ? this.fly.mode : this.mode; },
});
