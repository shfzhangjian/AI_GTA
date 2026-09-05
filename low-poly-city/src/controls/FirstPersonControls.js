/**
 * FirstPersonControls —— 第一人称漫游：
 * PointerLockControls 负责鼠标转向；本类负责 WASD 移动、惯性平滑与碰撞检测，
 * 外加 FPS 手感件：可见双手（闲置晃动/挥拳）、汽车等动态障碍阻挡。
 * 碰撞体来自 CityBuilder：建筑 AABB + 树/路灯圆形 + traffic.carRects() 车辆矩形。
 */
import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { WORLD, FP } from '../config.js';
import { blockedCircle } from '../core/Collision.js';
import { createFpHands } from '../world/PlayerAvatar.js';

const UP = new THREE.Vector3(0, 1, 0);
const PUNCH_DURATION = 0.5; // 出拳全程秒数
const PUNCH_HIT_AT = 0.32;  // 命中判定时刻（行程比例）

export class FirstPersonControls {
  /**
   * @param {{camera, dom, colliders, onEnter?:()=>void, onExit?:()=>void}} opts
   */
  constructor({ camera, dom, colliders, onEnter, onExit }) {
    this.colliders = colliders;
    this.keys = {};
    this._onEnter = onEnter || null;
    this.vel = new THREE.Vector3();
    this._fwd = new THREE.Vector3();
    this._right = new THREE.Vector3();

    // 供 ModeManager 注入：(() => [{x,z,hx,hz}]) —— 车辆等动态阻挡
    this.dynamicRects = null;

    // FPS 表现状态（Main/Avatar 读取）
    this.movingRatio = 0;
    this.walkPhase = 0;
    this.facing = { x: 0, z: -1 };

    // 挥拳状态机
    this.punch = null;        // {hand:0|1, t:0~1}
    this._hitReady = false;   // 到达命中帧，待主循环消费
    this._hitDone = false;
    this.nextHand = 1;

    // 双手（挂在相机下）
    this.hands = createFpHands();
    this.hands.group.visible = false;
    camera.add(this.hands.group);

    this.pl = new PointerLockControls(camera, dom);
    this.pl.addEventListener('lock', () => { this.hands.group.visible = true; });
    this.pl.addEventListener('unlock', () => {
      this.hands.group.visible = false;
      this.punch = null;
      if (onExit) onExit();
    });

    window.addEventListener('keydown', (e) => { this.keys[e.code] = true; });
    window.addEventListener('keyup', (e) => { this.keys[e.code] = false; });
    window.addEventListener('mousedown', (e) => {
      if (this.pl.isLocked && e.button === 0 && !this.punch) {
        this.punch = { hand: this.nextHand, t: 0 };
        this._hitDone = false;
        this.nextHand ^= 1; // 左右交替出拳
      }
    });
  }

  get isLocked() {
    return this.pl.isLocked;
  }

  /** 必须在用户点击手势内调用（浏览器指针锁定要求） */
  tryEnter(zone) {
    const c = this.pl.camera;
    c.position.set(zone.x, WORLD.surfGrass + FP.eye, zone.z);
    c.lookAt(zone.fx, WORLD.surfGrass + FP.eye - 0.2, zone.fz); // 进场先面向城区内部
    this.vel.set(0, 0, 0);
    if (this._onEnter) this._onEnter();
    this.pl.lock();
  }

  /** 主循环调用：若本帧到达命中时刻则消费并返回 true（用于挥拳判定） */
  consumePunchHit() {
    if (this._hitReady) {
      this._hitReady = false;
      return true;
    }
    return false;
  }

  /** 玩家圆形碰撞体是否落入障碍（建筑/树/路灯 + 车辆矩形） */
  _blocked(x, z) {
    if (blockedCircle(this.colliders, x, z, FP.radius)) return true;
    if (this.dynamicRects) {
      const r = FP.radius;
      for (const q of this.dynamicRects()) {
        if (x > q.x - q.hx - r && x < q.x + q.hx + r &&
            z > q.z - q.hz - r && z < q.z + q.hz + r) return true;
      }
    }
    return false;
  }

  update(dt) {
    if (!this.pl.isLocked) return;
    const k = this.keys;
    const f = (k.KeyW || k.ArrowUp ? 1 : 0) - (k.KeyS || k.ArrowDown ? 1 : 0);
    const s = (k.KeyD || k.ArrowRight ? 1 : 0) - (k.KeyA || k.ArrowLeft ? 1 : 0);
    const speed = k.ShiftLeft || k.ShiftRight ? FP.runSpeed : FP.walkSpeed;

    this.pl.getDirection(this._fwd).setY(0);
    if (this._fwd.lengthSq() < 1e-6) this._fwd.set(0, 0, -1);
    this._fwd.normalize();
    this.facing.x = this._fwd.x;
    this.facing.z = this._fwd.z;
    this._right.crossVectors(this._fwd, UP).normalize(); // 前进方向 × 上 = 右

    let tx = this._fwd.x * f + this._right.x * s;
    let tz = this._fwd.z * f + this._right.z * s;
    const len = Math.hypot(tx, tz);
    if (len > 1e-6) {
      tx = (tx / len) * speed;
      tz = (tz / len) * speed;
    } else {
      tx = tz = 0;
    }
    // 速度平滑（起步/急停不突兀）
    const lerp = Math.min(1, dt * 12);
    this.vel.x += (tx - this.vel.x) * lerp;
    this.vel.z += (tz - this.vel.z) * lerp;

    // 分轴推进：撞墙时保留另一轴速度（可贴墙滑行）
    const p = this.pl.camera.position;
    const B = FP.bounds;
    const nx = Math.max(-B, Math.min(B, p.x + this.vel.x * dt));
    if (!this._blocked(nx, p.z)) p.x = nx;
    const nz = Math.max(-B, Math.min(B, p.z + this.vel.z * dt));
    if (!this._blocked(p.x, nz)) p.z = nz;
    p.y = WORLD.surfGrass + FP.eye; // 无跳跃，恒定视高

    // —— FPS 表现：步态相位 / 双手闲置 / 挥拳推进 ——
    const vLen = Math.hypot(this.vel.x, this.vel.z);
    this.movingRatio = Math.min(1, vLen / FP.walkSpeed);
    this.walkPhase += dt * (5 + 7 * this.movingRatio);
    if (this.punch) {
      this.punch.t += dt / PUNCH_DURATION;
      if (!this._hitDone && this.punch.t >= PUNCH_HIT_AT) {
        this._hitReady = true;
        this._hitDone = true;
      }
      if (this.punch.t >= 1) this.punch = null;
    }
    this.hands.update(dt, this.movingRatio, this.walkPhase, this.punch);
  }
}
