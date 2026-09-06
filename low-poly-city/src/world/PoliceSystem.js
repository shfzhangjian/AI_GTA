/**
 * PoliceSystem —— 袭击路人后的警方响应（单警察制）。
 *
 * 流程：reportCrime() 概率触发 → pending 延迟数秒 dispatch →
 * 警车沿最近车道鸣笛驶入案发点附近 → 警察下车走向玩家，进入射程后用手枪/冲锋枪反击。
 * 警察被击倒、玩家逃远（>60m 持续 10s）或退出第一人称时收队离开，冷却后可再次出警。
 * 车顶红蓝警灯交替闪烁 + WebAudio 警笛。
 */
import * as THREE from 'three';
import { WORLD } from '../config.js';
import { normalizeCarClone } from './CarModel.js';

const rand = (a, b) => a + Math.random() * (b - a);
const std = (color, opts = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.85, ...opts });
const _pa = new THREE.Vector3(); // 警车车轮滚动轴复用
const _pf = new THREE.Vector3();

/* ---------------- 模型 ---------------- */

/** 警车（车头朝 +x）：白车身 + 黑车门条 + 红蓝警灯。返回 {group, lightR, lightB} */
function createPoliceCar() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.72, 1.66), std(0xf4f6f8, { roughness: 0.4 }));
  body.position.y = 0.86;
  body.castShadow = true;
  const door = new THREE.Mesh(new THREE.BoxGeometry(3.62, 0.3, 1.68), std(0x1c2a3f));
  door.position.y = 0.72;
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.55, 1.46), std(0x2f3a46, { metalness: 0.3, roughness: 0.35 }));
  cabin.position.set(-0.15, 1.44, 0);
  const wheelMat = std(0x2a2e33);
  for (const [wx, wz] of [[1.2, 0.8], [1.2, -0.8], [-1.2, 0.8], [-1.2, -0.8]]) {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.31, 0.31, 0.18, 10), wheelMat);
    w.rotation.x = Math.PI / 2;
    w.position.set(wx, 0.31, wz);
    g.add(w);
  }
  const lightR = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.16, 0.5), new THREE.MeshBasicMaterial({ color: 0xff2d2d }));
  lightR.position.set(-0.15, 1.8, -0.24);
  const lightB = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.16, 0.5), new THREE.MeshBasicMaterial({ color: 0x1f5fff }));
  lightB.position.set(-0.15, 1.8, 0.24);
  g.add(body, door, cabin, lightR, lightB);
  return { group: g, lightR, lightB };
}

/** 警车（GLB 模板版）：优先用模型内置警灯条（GEO-light_red/blue，发光强度脉冲），无则外挂红蓝灯盒 */
export function createPoliceCarGLB(template) {
  const car = normalizeCarClone(template, 4.5, '#f2f4f7');
  if (!car) return null; // 模板损坏 -> 调用方回退程序化警车
  const lightR = car.getObjectByName('GEO-light_red');
  const lightB = car.getObjectByName('GEO-light_blue');
  if (lightR && lightB) {
    return { group: car, lightR, lightB, pulseMat: true }; // 材质已在 normalizeCarClone 逐实例克隆，可安全脉冲
  }
  const h = car.userData.height || 1.3;
  const boxR = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.16, 0.5), new THREE.MeshBasicMaterial({ color: 0xff2d2d }));
  boxR.position.set(-0.1, h + 0.08, -0.24);
  const boxB = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.16, 0.5), new THREE.MeshBasicMaterial({ color: 0x1f5fff }));
  boxB.position.set(-0.1, h + 0.08, 0.24);
  car.add(boxR, boxB);
  return { group: car, lightR: boxR, lightB: boxB };
}

/** 警察（面朝 +z）：深蓝制服 + 警帽 + 手枪。返回 {group, parts:{legs,mats}} */
function createCopMesh() {
  const g = new THREE.Group();
  const uniform = std(0x27408b);
  const skin = std(0xe8b98a);
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.58, 0.28), uniform);
  torso.position.y = 1.02;
  torso.castShadow = true;
  const belt = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.09, 0.3), std(0x14181f));
  belt.position.y = 0.75;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.17, 8, 8), skin);
  head.position.y = 1.5;
  const cap = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.12, 0.36), std(0x1b2c55));
  cap.position.y = 1.63;
  const brim = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.04, 0.16), std(0x101a33));
  brim.position.set(0, 1.58, 0.24);
  // 持枪右臂（前伸）+ 手枪
  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.14, 0.5), uniform);
  arm.position.set(0.29, 1.22, 0.3);
  const gun = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.16, 0.26), std(0x181c22, { metalness: 0.5 }));
  gun.position.set(0.29, 1.2, 0.62);
  const legs = [];
  const legGeo = new THREE.BoxGeometry(0.16, 0.72, 0.18);
  for (const lx of [-0.12, 0.12]) {
    const p = new THREE.Group();
    p.position.set(lx, 0.72, 0);
    const m = new THREE.Mesh(legGeo, std(0x1d2a4d));
    m.position.y = -0.36;
    m.castShadow = true;
    p.add(m);
    g.add(p);
    legs.push(p);
  }
  g.add(torso, belt, head, cap, brim, arm, gun);
  return { group: g, parts: { legs, mats: [uniform, skin] } };
}

/* ---------------- 警察实体（供武器射线/火箭识别） ---------------- */

class Cop {
  constructor(mesh, x, z) {
    this.model = mesh;
    this.kind = 'cop';          // 小地图/射线判定用
    this.radius = 0.42;
    this.x = x;
    this.z = z;
    this.hp = 120;
    this.downT = 0;
    this.angle = 0;
    this.phase = rand(0, 6.28);
    this.weapon = Math.random() < 0.5 ? 'pistol' : 'smg';
    this.fireT = 1.2;           // 开火倒计时
    this.burst = 0;             // 冲锋枪连射剩余发数
    this.moving = false;
    mesh.group.position.set(x, WORLD.surfGrass, z);
  }

  takeHit(fromX, fromZ, dmg) {
    if (this.downT > 0) return;
    this.hp -= dmg;
    if (this.hp <= 0) this.downT = 999; // 永久倒地，由系统收队
  }

  /** 步态 + 朝向；moving=true 时摆腿 */
  face(ax, az) {
    this.angle = Math.atan2(ax - this.x, az - this.z);
  }

  animate(dt) {
    const m = this.model;
    if (this.downT > 0) { // 倒地动画
      m.group.rotation.z += ((Math.PI / 2) * 0.96 - m.group.rotation.z) * Math.min(1, dt * 6);
      return;
    }
    m.group.position.set(this.x, WORLD.surfGrass, this.z);
    m.group.rotation.y = this.angle;
    if (this.moving) {
      this.phase += dt * 9;
      const s = Math.sin(this.phase) * 0.55;
      m.parts.legs[0].rotation.x = s;
      m.parts.legs[1].rotation.x = -s;
    } else {
      m.parts.legs[0].rotation.x *= 0.85;
      m.parts.legs[1].rotation.x *= 0.85;
    }
  }
}

/* ---------------- 系统 ---------------- */

export class PoliceSystem {
  /**
   * @param {{scene:THREE.Scene, colliders:{boxes:Array,circles:Array}, sfx}} opts
   */
  constructor({ scene, colliders, sfx }) {
    this.scene = scene;
    this.colliders = colliders;
    this.sfx = sfx;
    this.state = 'idle';        // idle | pending | enroute | arrived | leaving
    this.coolT = 0;             // 再次出警冷却
    this.pendingT = 0;
    this.crime = null;          // {x,z} 案发点
    this.car = null;            // {group, lightR, lightB, axis, dest, dir}
    this.cop = null;            // Cop | null
    this.giveUpT = 0;           // 玩家逃远累计
    this.leaveT = 0;
    this.clock = 0;
    this.onPlayerHit = () => {}; // main 注入：扣血回调
    this.template = null;        // main 注入：肌肉车 GLB 模板（有则警车也用真模型）
    this.proxy = { x: 999, z: 999 }; // 供车流避让（警察横穿马路不被撞）
    this._ray = new THREE.Ray();
  }

  /** 玩家袭击路人后报案：75% 概率延迟 2~5s 出警 */
  reportCrime(x, z) {
    if (this.state !== 'idle' || this.coolT > 0) return;
    if (Math.random() > 0.75) { this.coolT = 8; return; } // 不是每次都有警车
    this.crime = { x, z };
    this.pendingT = rand(2, 5);
    this.state = 'pending';
  }

  /* —— 出警调度 —— */
  _dispatch() {
    const c = this.crime;
    // 选择离案发点最近的车道线作为停车点（四个候选：x=±3.5 / z=±3.5）
    const cand = [
      { axis: 'z', lane: -3.5, d: Math.abs(c.x + 3.5) },
      { axis: 'z', lane: 3.5, d: Math.abs(c.x - 3.5) },
      { axis: 'x', lane: -3.5, d: Math.abs(c.z + 3.5) },
      { axis: 'x', lane: 3.5, d: Math.abs(c.z - 3.5) },
    ].sort((a, b) => a.d - b.d)[0];

    const clampC = (v) => Math.max(-54, Math.min(54, v));
    const dest = cand.axis === 'z'
      ? { x: cand.lane, z: clampC(c.z) }
      : { x: clampC(c.x), z: cand.lane };

    const car = (this.template && createPoliceCarGLB(this.template)) || createPoliceCar();
    const dir = -1; // 从负方向驶来（车头朝向 dest）
    const start = cand.axis === 'z'
      ? { x: cand.lane, z: -78 }
      : { x: -78, z: cand.lane };
    car.group.position.set(start.x, WORLD.surfRoad, start.z);
    car.group.rotation.y = cand.axis === 'x' ? 0 : -Math.PI / 2; // 车头朝正方向
    this.scene.add(car.group);

    this.car = { ...car, axis: cand.axis, dest };
    this.state = 'enroute';
    this.sfx.ensure();
    this.sfx.sirenStart();
  }

  _spawnCop() {
    const p = this.car.dest;
    // 下车点：警车靠案发侧
    const side = this.crime.x - p.x || 1;
    const cx = Math.max(-60, Math.min(60, p.x + (this.car.axis === 'z' ? Math.sign(side) * 2.4 : 0)));
    const cz = Math.max(-60, Math.min(60, p.z + (this.car.axis === 'x' ? Math.sign(this.crime.z - p.z || 1) * 2.4 : 0)));
    this.cop = new Cop(createCopMesh(), cx, cz);
    this.scene.add(this.cop.model.group);
    this.state = 'arrived';
  }

  /** 视线是否被建筑阻挡（警察不隔墙开枪） */
  _losBlocked(ax, az, bx, bz) {
    const dx = bx - ax; const dz = bz - az;
    const L = Math.hypot(dx, dz);
    if (L < 0.3) return false;
    this._ray.set(
      new THREE.Vector3(ax, WORLD.surfGrass + 1.2, az),
      new THREE.Vector3(dx / L, 0, dz / L)
    );
    const hit = new THREE.Vector3();
    for (const box of this.colliders.boxes) {
      if (box.min.y > WORLD.surfGrass + 1.4 || box.max.y < WORLD.surfGrass + 0.5) continue;
      const p = this._ray.intersectBox(box, hit);
      if (p && origin_dist(ax, az, p) < L - 0.5) return true;
    }
    return false;
    function origin_dist(x0, z0, p) { return Math.hypot(p.x - x0, p.z - z0); }
  }

  /* ---------------- 每帧更新 ---------------- */
  update(dt, playerPos) {
    this.clock += dt;
    if (this.coolT > 0) this.coolT -= dt;

    // 警灯闪烁（行驶/驻停期间）
    if (this.car && this.state !== 'leaving') {
      const on = Math.sin(this.clock * 14) > 0;
      if (this.car.pulseMat) { // 内置发光灯带：红蓝交替爆闪（emissive 强度）
        this.car.lightR.material.emissiveIntensity = on ? 3.2 : 0.1;
        this.car.lightB.material.emissiveIntensity = on ? 0.1 : 3.2;
      } else {
        this.car.lightR.visible = on;   // 红蓝交替旋转报警
        this.car.lightB.visible = !on;
      }
    }

    switch (this.state) {
      case 'pending':
        this.pendingT -= dt;
        if (this.pendingT <= 0) this._dispatch();
        break;

      case 'enroute': {
        const c = this.car;
        const p = c.group.position;
        const key = c.axis === 'z' ? 'z' : 'x';
        const want = c.dest[key];
        const step = 16 * dt;
        if (Math.abs(want - p[key]) <= step) {
          p[key] = want;
          this._spawnCop();
        } else {
          p[key] += Math.sign(want - p[key]) * step;
          // GLB 警车行驶轮滚动（车头朝 +方向驶来）
          const wheels = c.group.userData?.wheels;
          if (wheels) {
            _pa.set(0, 1, 0).cross(_pf.set(c.axis === 'x' ? 1 : 0, 0, c.axis === 'z' ? 1 : 0));
            const ang = (16 * dt) / (c.group.userData.wheelRadius || 0.34);
            for (const w of wheels) w.rotateOnWorldAxis(_pa, ang);
          }
        }
        break;
      }

      case 'arrived': this._updateCop(dt, playerPos); break;

      case 'leaving': {
        this.leaveT -= dt;
        if (this.leaveT <= 0) this._despawn();
        break;
      }
    }

    // 警察避让车流（横穿马路时汽车刹停）
    this.proxy.x = this.cop && this.cop.downT <= 0 ? this.cop.x : 999;
    this.proxy.z = this.cop && this.cop.downT <= 0 ? this.cop.z : 999;
    if (this.cop) this.cop.animate(dt);
  }

  _updateCop(dt, playerPos) {
    const cop = this.cop;
    if (!cop || !playerPos) return;

    if (cop.downT > 0) { // 被击倒 → 收队
      this.state = 'leaving';
      this.leaveT = 3.5;
      this.sfx.sirenStop();
      return;
    }

    const dx = playerPos.x - cop.x;
    const dz = playerPos.z - cop.z;
    const dist = Math.hypot(dx, dz);

    // 玩家逃远计时 → 放弃
    if (dist > 60) {
      this.giveUpT += dt;
      if (this.giveUpT > 10) {
        this.state = 'leaving';
        this.leaveT = 4;
        this.sfx.sirenStop();
        return;
      }
    } else this.giveUpT = 0;

    cop.face(playerPos.x, playerPos.z);

    if (dist > 11) { // 走向玩家
      const sp = 3.4 * dt;
      cop.x += (dx / dist) * sp;
      cop.z += (dz / dist) * sp;
      cop.moving = true;
      return;
    }
    cop.moving = false;

    // —— 交战：开火节奏 ——
    cop.fireT -= dt;
    if (cop.fireT > 0) return;
    const blocked = this._losBlocked(cop.x, cop.z, playerPos.x, playerPos.z);
    if (blocked) { cop.fireT = 0.3; return; }

    let nextGap;
    if (cop.weapon === 'smg') {
      cop.burst++;
      this._copShoot(cop, playerPos);
      nextGap = cop.burst % 3 === 0 ? rand(2.0, 2.8) : 0.14; // 三连发点射
    } else {
      this._copShoot(cop, playerPos);
      nextGap = rand(1.0, 1.6);
    }
    cop.fireT = nextGap;
  }

  /** 警察开一枪：距离衰减命中率，命中回调扣玩家血 */
  _copShoot(cop, playerPos) {
    const dist = Math.hypot(playerPos.x - cop.x, playerPos.z - cop.z);
    const pHit = Math.max(0.4, Math.min(0.9, 0.95 - dist * 0.012));
    const from = new THREE.Vector3(cop.x, WORLD.surfGrass + 1.25, cop.z);
    let to;
    if (Math.random() < pHit) {
      to = new THREE.Vector3(playerPos.x, playerPos.y - 0.4, playerPos.z);
      this.onPlayerHit();
    } else { // 脱靶：飞向玩家身侧
      to = new THREE.Vector3(
        playerPos.x + rand(-1.2, 1.2),
        playerPos.y - rand(0, 1.4),
        playerPos.z + rand(-1.2, 1.2)
      );
    }
    if (cop.weapon === 'smg') this.sfx.smgShot(); else this.sfx.pistolShot();
    // 曳光弹（短促橙线）
    const geo = new THREE.BufferGeometry().setFromPoints([from, to]);
    const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0xffd27a, transparent: true, opacity: 0.85 }));
    this.scene.add(line);
    setTimeout(() => {
      this.scene.remove(line);
      geo.dispose(); line.material.dispose();
    }, 70);
  }

  _despawn() {
    if (this.car) {
      this.scene.remove(this.car.group);
      this.car = null;
    }
    if (this.cop) {
      this.scene.remove(this.cop.model.group);
      this.cop = null;
    }
    this.giveUpT = 0;
    this.state = 'idle';
    this.coolT = 16; // 下次报案的冷却
  }

  /** 退出第一人称 / 玩家死亡：立即收队清场 */
  standDown() {
    this.sfx.sirenStop();
    if (this.car) this.scene.remove(this.car.group);
    if (this.cop) this.scene.remove(this.cop.model.group);
    this.car = null;
    this.cop = null;
    this.crime = null;
    this.state = 'idle';
    this.coolT = 8;
    this.giveUpT = 0;
    this.proxy.x = 999; this.proxy.z = 999;
  }
}
