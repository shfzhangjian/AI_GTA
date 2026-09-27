/**
 * CombatFx.js — 海战特效：炮口闪光 / 炮弹弧线 / 命中炸点 / 按伤势着火（§战斗）
 *
 * 用户要求：受到攻击的船出血条（HUD 层负责），并按破坏程度着火：
 *   伤 ≥30% 火星点 → ≥55% 火苗+黑烟 → ≥80% 大火。
 * 火光挂在船体 object 局部空间（跟船走、跟船翻正），由 update(dt) 统一推进/回收。
 *
 * 纯逻辑可测：fireLevelForRatio(ratio) / setShipFire(ship, ratio) / spawn*()。
 */
import * as THREE from 'three';
import { SHIPS } from '../../config.js';

const _v = new THREE.Vector3();

/** 伤级 → 火级（0 无火 / 1 火星 / 2 火苗+烟 / 3 大火） */
export function fireLevelForRatio(ratio, levels = SHIPS.FIRE_LEVELS) {
  if (ratio >= levels[2]) return 3;
  if (ratio >= levels[1]) return 2;
  if (ratio >= levels[0]) return 1;
  return 0;
}

function localForwardOffset(object, distance, out) {
  const forward = object.userData.spec?.forward || 'z';
  const sign = forward.startsWith('-') ? -1 : 1;
  const axis = forward.replace('-', '');
  out.set(0, 0, 0);
  if (axis === 'x') out.x = sign * distance;
  else if (axis === 'y') out.y = sign * distance;
  else out.z = sign * distance;
  return out;
}

/** 船尾方向：模型规格 forward 的反方向 */
function sternOffset(object, out) {
  const h = object.userData.size ? object.userData.size[1] : 5;
  const depth = object.userData.size ? object.userData.size[2] * 0.3 : 2;
  localForwardOffset(object, -depth, out);
  out.y = h * 0.55;
  return out;
}

export class CombatFx {
  /**
   * @param {{sceneManager, registry?, group?}} deps
   */
  constructor(deps) {
    this.sm = deps.sceneManager;
    this.group = deps.group || this.sm.world;   // 弹道/炸点在星球局部空间
    /** @type {Array<object>} 时变特效（闪光/炮弹/炸点） */
    this.fx = [];
    /** @type {Map<object, object>} 船 → 火焰组（挂在船体内，跟船走） */
    this.fires = new Map();
    this._tmp = new THREE.Vector3();
  }

  /**
   * 开炮：炮口闪光 + 抛物线炮弹；到达目标位置时回调 hit（由 CombatSystem 结算伤害）。
   * @param {THREE.Object3D} fromObj 炮船（默认起点取其局部 +Z 船头 + 甲板高）
   * @param {THREE.Vector3} targetPos 星球局部坐标（与船同父空间 → 自转不影响）
   * @param {(landedPos:THREE.Vector3)=>void} onHit
   * @param {{originWorld?:THREE.Vector3}} opts 可选炮口世界坐标；用于炮台独立瞄准
   */
  spawnCannonShot(fromObj, targetPos, onHit, time = 0, opts = {}) {
    const from = opts.originWorld ? opts.originWorld.clone() : this._bowLocal(fromObj, new THREE.Vector3());
    const origin = this.group.worldToLocal(from.clone());

    // 炮口闪光
    const flash = new THREE.Mesh(
      new THREE.SphereGeometry(0.7, 8, 6),
      new THREE.MeshBasicMaterial({ color: 0xffd27a, transparent: true, opacity: 0.95, depthWrite: false }),
    );
    flash.position.copy(origin);
    flash.renderOrder = 7;
    this.group.add(flash);
    this.fx.push({ obj: flash, kind: 'flash', life: 0.12, maxLife: 0.12 });

    // 炮弹（球 + 抛物线抬升）
    const ball = new THREE.Mesh(
      new THREE.SphereGeometry(0.4, 8, 6),
      new THREE.MeshBasicMaterial({ color: 0x2b2b2f }),
    );
    const dest = this.group.worldToLocal(targetPos.clone());
    ball.position.copy(origin);
    ball.renderOrder = 7;
    this.group.add(ball);
    const dist = origin.distanceTo(dest);
    this.fx.push({
      obj: ball, kind: 'ball', life: 0, maxLife: THREE.MathUtils.clamp(dist / 60, 0.35, 1.4),
      from: origin.clone(), to: dest.clone(), arc: Math.min(dist * 0.22, 12), onHit,
    });
    void time;
    return ball;
  }

  /** 命中炸点（橙环 + 白闪） */
  spawnExplosion(worldPos, radius = 4) {
    const pos = this.group.worldToLocal(worldPos.clone());
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(radius * 0.6, radius, 24),
      new THREE.MeshBasicMaterial({ color: 0xff9a3c, transparent: true, opacity: 0.9, side: THREE.DoubleSide, depthWrite: false }),
    );
    ring.position.copy(pos);
    ring.lookAt(0, 0, 0);
    ring.renderOrder = 7;
    this.group.add(ring);
    this.fx.push({ obj: ring, kind: 'boom', life: 0.5, maxLife: 0.5, grow: radius * 1.6 });
  }

  /**
   * 按伤势设置/更新船上火焰（0=灭火回收）。
   * 火焰 = 几团加色火舌 + （level≥2）黑烟柱。局部坐标挂在船体内。
   */
  setShipFire(shipObject, ratio) {
    const level = fireLevelForRatio(ratio);
    let fire = this.fires.get(shipObject);

    if (level === 0) {
      if (fire) { this._disposeFire(fire); this.fires.delete(shipObject); }
      return 0;
    }
    if (!fire) {
      fire = { level: 0, group: new THREE.Group(), flames: [], smoke: [], t: Math.random() * 10, shared: null };
      fire.group.name = 'ShipFire';
      fire.group.position.copy(sternOffset(shipObject, this._tmp));
      shipObject.add(fire.group);
      this.fires.set(shipObject, fire);
    } else {
      fire.group.position.copy(sternOffset(shipObject, this._tmp));
    }
    if (fire.level === level) return level;
    this._clearFireParts(fire);

    fire.level = level;
    const flameGeo = new THREE.ConeGeometry(0.55, 1.9, 6);
    const smokeGeo = new THREE.DodecahedronGeometry(0.95, 0);
    const flameCount = level === 1 ? 2 : level === 2 ? 4 : 7;
    for (let i = 0; i < flameCount; i++) {
      const f = new THREE.Mesh(flameGeo, new THREE.MeshBasicMaterial({ color: i % 2 ? 0xffb238 : 0xff6420 }));
      f.position.set((Math.random() - 0.5) * 1.6, 0.7 + Math.random() * 0.6, (Math.random() - 0.5) * 2.2);
      f.userData.baseScale = new THREE.Vector3(0.85 + Math.random() * 0.25, 0.85 + Math.random() * 0.35, 0.85 + Math.random() * 0.25);
      f.userData.phase = Math.random() * Math.PI * 2;
      f.scale.copy(f.userData.baseScale);
      f.renderOrder = 8;
      fire.flames.push(f);
      fire.group.add(f);
    }
    if (level >= 2) {
      const smokeCount = level === 2 ? 3 : 5;
      for (let i = 0; i < smokeCount; i++) {
        const s = new THREE.Mesh(smokeGeo, new THREE.MeshBasicMaterial({ color: i % 2 ? 0x35302b : 0x25211f }));
        s.position.set((Math.random() - 0.5) * 1.2, 2.6 + i * 1.4, (Math.random() - 0.5) * 1.6);
        s.userData.baseScale = 0.85 + i * 0.18 + Math.random() * 0.2;
        s.userData.phase = Math.random() * Math.PI * 2;
        s.scale.setScalar(s.userData.baseScale);
        s.renderOrder = 7;
        fire.smoke.push(s);
        fire.group.add(s);
      }
    }
    fire.shared = { flameGeo, smokeGeo };   // 几何同组共享 → _disposeFire 统一销毁一次
    return level;
  }

  /**
   * 修理环（渡轮到岸修理：头顶旋转金色光环）。挂船体局部空间 → 跟船走。
   * @param {boolean} on
   */
  setRepairBeacon(shipObject, on) {
    if (!this.beacons) this.beacons = new Map();
    let b = this.beacons.get(shipObject);
    if (!on) {
      if (b) {
        if (b.parent) b.parent.remove(b);
        b.geometry.dispose(); b.material.dispose();
        this.beacons.delete(shipObject);
      }
      return;
    }
    if (b) return;
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(1.9, 0.16, 8, 28),
      new THREE.MeshBasicMaterial({ color: 0x7fe3a8, transparent: true, opacity: 0.9, depthWrite: false }),
    );
    ring.name = 'RepairBeacon';
    const h = shipObject.userData.size ? shipObject.userData.size[1] * 0.9 : 4.5;
    ring.position.set(0, h + 1.6, 0);
    ring.rotation.x = Math.PI / 2;        // 水平环（局部 +Y = 船上）
    ring.renderOrder = 8;
    shipObject.add(ring);
    this.beacons.set(shipObject, ring);
  }

  /** 船沉没：火全灭 + 残骸渐隐（渐隐由 DamageSystem 处理，这里只清火） */
  clearShipFire(shipObject) {
    const fire = this.fires.get(shipObject);
    if (fire) { this._disposeFire(fire); this.fires.delete(shipObject); }
  }

  /** 每帧：弹道推进 + 炸点扩环 + 火焰摇曳 */
  update(dt, time) {
    for (let i = this.fx.length - 1; i >= 0; i--) {
      const f = this.fx[i];
      f.life += dt;
      const t = f.life / f.maxLife;
      if (f.kind === 'flash') {
        f.obj.material.opacity = Math.max(0, 0.95 * (1 - t));
        f.obj.scale.setScalar(1 + t * 2);
      } else if (f.kind === 'ball') {
        const p = Math.min(1, t);
        // 抛物线：直线插值 + 沿「远离球心」径向抬升（星球局部球心在原点）
        f.obj.position.copy(f.from).lerp(f.to, p);
        _v.copy(f.from).lerp(f.to, p).normalize();
        f.obj.position.addScaledVector(_v, Math.sin(p * Math.PI) * f.arc);
        if (p >= 1 && f.onHit) {
          const landing = this.group.localToWorld(f.to.clone());
          f.onHit(landing);
          f.onHit = null;
        }
      } else if (f.kind === 'boom') {
        f.obj.material.opacity = 0.9 * (1 - t);
        f.obj.scale.setScalar(1 + t * 2.2);
      }
      if (f.life >= f.maxLife) {
        this.group.remove(f.obj);
        f.obj.geometry.dispose();
        f.obj.material.dispose();
        this.fx.splice(i, 1);
      }
    }
    // 修理环：转 + 呼吸
    if (this.beacons) {
      for (const [, ring] of this.beacons) {
        ring.rotation.z += dt * 2.6;
        ring.material.opacity = 0.7 + Math.sin(time * 5) * 0.25;
      }
    }
    // 火焰摇曳 + 烟上飘
    for (const [, fire] of this.fires) {
      fire.t += dt;
      for (const fl of fire.flames) {
        const base = fl.userData.baseScale;
        const phase = fl.userData.phase || 0;
        fl.scale.set(
          base.x * (1 + Math.sin(fire.t * 7 + phase) * 0.08),
          base.y * (1 + Math.sin(fire.t * 8 + phase) * 0.14),
          base.z,
        );
        fl.rotation.z = Math.sin(fire.t * 4 + phase) * 0.08;
        void time;
      }
      for (const s of fire.smoke) {
        const base = s.userData.baseScale || 1;
        const phase = s.userData.phase || 0;
        s.scale.setScalar(base * (1 + Math.sin(fire.t * 1.8 + phase) * 0.06));
        s.rotation.y += dt * 0.18;
      }
    }
  }

  _bowLocal(object, out) {
    // 船头：沿模型规格 forward 方向取点 → 世界（同父：world 树内）
    const s = object.userData.size ? object.userData.size : [4, 6, 12];
    localForwardOffset(object, s[2] * 0.4, out);
    out.y = s[1] * 0.4;
    object.updateMatrixWorld();
    return object.localToWorld(out);
  }

  _disposeFire(fire) {
    if (fire.group.parent) fire.group.parent.remove(fire.group);
    this._clearFireParts(fire);
    fire.group.clear();
  }

  _clearFireParts(fire) {
    const materials = new Set();
    fire.group.traverse((o) => {
      if (!o.isMesh) return;
      if (Array.isArray(o.material)) o.material.forEach((m) => materials.add(m));
      else if (o.material) materials.add(o.material);
    });
    for (const mat of materials) mat.dispose();
    if (fire.shared) {
      fire.shared.flameGeo?.dispose?.();
      fire.shared.smokeGeo?.dispose?.();
    }
    fire.flames.length = 0;
    fire.smoke.length = 0;
    fire.shared = null;
    fire.group.clear();
  }

  clear() {
    for (const f of this.fx) { this.group.remove(f.obj); f.obj.geometry.dispose(); f.obj.material.dispose(); }
    this.fx.length = 0;
    for (const [obj] of this.fires) this.clearShipFire(obj);
    this.fires.clear();
    if (this.beacons) {
      for (const [obj, ring] of this.beacons) { if (ring.parent) ring.parent.remove(ring); ring.geometry.dispose(); ring.material.dispose(); }
      this.beacons.clear();
    }
  }

  summary() {
    return { fx: this.fx.length, burning: this.fires.size, repairing: this.beacons ? this.beacons.size : 0 };
  }
}
