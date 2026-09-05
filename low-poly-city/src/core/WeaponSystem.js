/**
 * WeaponSystem —— 第一人称武器状态机。
 *
 * - 数字键 1~4 切换：锤子 / 冲锋枪 / 狙击枪 / 火箭筒；R 装填。
 * - 左键开火（冲锋枪按住连发）；右键开关瞄准镜（狙击枪全屏瞄具）。
 * - 枪械命中用解析射线检测（NPC 圆柱近似 + 建筑 Box3 遮挡 + 地面）；
 * - 火箭筒发射重力抛物线弹体，触地/撞楼/近身引爆：范围伤害 + 火球 + 碎石 + 震屏。
 * - 音效全部来自 Sfx（WebAudio 合成）。
 */
import * as THREE from 'three';
import { WORLD } from '../config.js';
import { buildHammer, buildSmg, buildSniper, buildRpg, buildRocketMesh } from '../world/WeaponModels.js';

const WEAPONS = {
  hammer: { name: '锤子', model: buildHammer, rate: 0.55, dmg: 45, range: 2.2, arc: 0.72, ammo: Infinity, muzzle: [0, 0.3, -0.5] },
  smg:    { name: '冲锋枪', model: buildSmg, rate: 0.095, dmg: 12, mag: 30, spread: 0.028, range: 70, auto: true, adsFov: 30, recoil: 0.014, muzzle: [0.22, -0.12, -0.85] },
  sniper: { name: '狙击枪', model: buildSniper, rate: 1.1, dmg: 90, mag: 5, spread: 0.003, range: 140, adsFov: 12, scope: true, recoil: 0.045, muzzle: [0.18, -0.05, -1.1] },
  rocket: { name: '火箭筒', model: buildRpg, rate: 1.6, mag: 3, adsFov: 35, recoil: 0.022, speed: 30, boost: 2.4, gravity: 16, muzzle: [0.3, -0.2, -0.9] },
};
const ORDER = ['hammer', 'smg', 'sniper', 'rocket'];

const POSE_BASE = { pos: new THREE.Vector3(0.32, -0.34, -0.75), rot: new THREE.Euler(0, 0, 0) };
const POSE_ADS = { pos: new THREE.Vector3(0, -0.16, -0.55), rot: new THREE.Euler(0, 0, 0) };

export class WeaponSystem {
  /**
   * @param {{app, city, mode, sfx, police?:object, health?:object,
   *          hud:{bar:HTMLElement, slots:HTMLElement[], ammo:HTMLElement, scope:HTMLElement, flash:HTMLElement}}} opts
   */
  constructor({ app, city, mode, sfx, police = null, health = null, hud }) {
    this.app = app; this.city = city; this.mode = mode; this.sfx = sfx; this.hud = hud;
    this.police = police; // 袭击路人触发报案；射线可命中警察
    this.health = health; // 火箭近爆伤及玩家自身
    this.camera = app.camera;

    // —— 枪械视图模型（相机子物体）——
    this.view = new THREE.Group();
    this.camera.add(this.view);
    this.models = {};
    for (const key of ORDER) {
      const m = WEAPONS[key].model();
      m.visible = false;
      this.view.add(m);
      this.models[key] = m;
    }

    this.cur = 'hammer';
    this.ammo = {};
    for (const key of ORDER) {
      const w = WEAPONS[key];
      this.ammo[key] = { mag: w.mag ?? Infinity, max: w.mag ?? Infinity };
    }
    this.cooldownT = 0;
    this.reloadT = 0;
    this.ads = false;
    this.mouseL = false;
    this.kick = 0;          // 视图模型后座动画强度
    this.swingT = -1;       // 锤子挥击进度（-1 空闲）
    this._tmpV = new THREE.Vector3();
    this._ray = new THREE.Ray();

    // —— 世界特效池 ——
    this._rockets = [];   // {mesh, vel, t}
    this._fx = [];        // {kind, obj, t, life, ...}
    this._maxFxSeen = 0;  // 测试探针

    this._bindInput();
    this._select('hammer', true);
  }

  get locked() { return this.mode.mode === 'fp' && this.mode.fp.pl.isLocked; }

  /* ---------------- 输入 ---------------- */
  _bindInput() {
    window.addEventListener('keydown', (e) => {
      if (!this.locked) return;
      const i = ['Digit1', 'Digit2', 'Digit3', 'Digit4'].indexOf(e.code);
      if (i >= 0) this._select(ORDER[i]);
      else if (e.code === 'KeyR') this._startReload();
    });
    window.addEventListener('mousedown', (e) => {
      if (!this.locked) return;
      this.sfx.ensure();
      if (e.button === 0) { this.mouseL = true; this._tryFire(); }
      else if (e.button === 2) this.toggleAds();
    });
    window.addEventListener('mouseup', (e) => { if (e.button === 0) this.mouseL = false; });
    window.addEventListener('contextmenu', (e) => { if (this.locked) e.preventDefault(); });
  }

  toggleAds() {
    const w = WEAPONS[this.cur];
    if (!w.adsFov) return; // 锤子无瞄准镜
    this.ads = !this.ads;
    this.mode.fp.pl.pointerSpeed = this.ads ? 0.35 : 1; // 瞄准时降低灵敏度
    this.sfx.scopeIn();
  }

  /* ---------------- 武器选择 / 弹药 ---------------- */
  _select(key, silent = false) {
    if (this.cur === key && !silent) return;
    this.models[this.cur].visible = false;
    this.cur = key;
    this.models[key].visible = true;
    this.ads = false;
    this.mode.fp.pl.pointerSpeed = 1;
    this.swingT = -1;
    if (!silent) this.sfx.weaponSwitch();
    this._hudDirty = true;
  }

  _startReload() {
    const a = this.ammo[this.cur];
    const w = WEAPONS[this.cur];
    if (w.mag === undefined || a.mag >= a.max || this.reloadT > 0) return;
    this.reloadT = this.cur === 'rocket' ? 2.5 : 1.6;
    this.sfx.reload();
  }

  /* ---------------- 开火 ---------------- */
  _tryFire() {
    if (this.cooldownT > 0 || this.reloadT > 0) return;
    const w = WEAPONS[this.cur];
    const a = this.ammo[this.cur];

    if (this.cur === 'hammer') {
      this.swingT = 0;
      this.cooldownT = w.rate;
      this.sfx.hammerSwing();
      return; // 命中在挥击动画中段结算（update 里）
    }
    if (a.mag <= 0) { this._startReload(); return; }
    a.mag--;
    this.cooldownT = w.rate;
    this.kick = 1;
    this._hudDirty = true;

    const cam = this.camera;
    const dir = cam.getWorldDirection(this._tmpV.clone()).normalize();
    // 弹道散布
    if (w.spread) {
      const s = this.ads ? w.spread * 0.25 : w.spread;
      dir.x += (Math.random() - 0.5) * s * 2;
      dir.y += (Math.random() - 0.5) * s * 2;
      dir.z += (Math.random() - 0.5) * s * 2;
      dir.normalize();
    }
    const muzzle = cam.localToWorld(new THREE.Vector3(...w.muzzle));

    if (this.cur === 'rocket') {
      this.sfx.rocketLaunch();
      const vel = dir.clone().multiplyScalar(w.speed);
      vel.y += w.boost; // 上抛，让抛物线可见
      const mesh = buildRocketMesh();
      mesh.position.copy(muzzle);
      this.app.scene.add(mesh);
      this._rockets.push({ mesh, vel, t: 0 });
    } else {
      if (this.cur === 'smg') this.sfx.smgShot();
      else this.sfx.sniperShot();
      cam.rotateX(w.recoil * (this.ads ? 0.5 : 1)); // 枪口上跳

      const hit = this._rayHit(muzzle, dir, w.range);
      this._tracer(muzzle, hit.point);
      if (hit.agent) {
        hit.agent.takeHit(cam.position.x, cam.position.z, w.dmg);
        this.sfx.tick();
        // 袭击平民 -> 报警（打警察不再重复报案）
        if (hit.agent.kind === 'human') this.police?.reportCrime(hit.agent.x, hit.agent.z);
      }
    }
    if (a.mag <= 0) this._startReload();
  }

  /** 解析射线检测：NPC（圆柱近似）> 建筑（Box3）> 地面，取最近 */
  _rayHit(origin, dir, maxDist) {
    const ray = this._ray.set(origin.clone(), dir.clone());
    const tmp = new THREE.Vector3();
    let best = maxDist;
    let agent = null;
    let point = null;

    for (const box of this.city.colliders.boxes) {
      const p = ray.intersectBox(box, tmp);
      if (p) {
        const d = origin.distanceTo(p);
        if (d < best) { best = d; agent = null; point = p.clone(); }
      }
    }
    for (const a of this._shootables()) {
      if (a.downT > 0) continue;
      // 水平圆柱近似：XZ 平面求最近点，再校验交点高度落在躯干带内
      const rx = a.x - origin.x;
      const rz = a.z - origin.z;
      const dxz2 = dir.x * dir.x + dir.z * dir.z;
      if (dxz2 < 1e-8) continue; // 近乎垂直俯视
      const t = (rx * dir.x + rz * dir.z) / dxz2;
      if (t <= 0 || t > best) continue;
      const px = rx - dir.x * t;
      const pz = rz - dir.z * t;
      const r = a.radius + 0.18;
      if (px * px + pz * pz >= r * r) continue;
      const hitY = origin.y + dir.y * t;
      const h = a.kind === 'dog' ? 0.75 : 1.9; // 躯干高度带（人/警察同高）
      if (hitY < WORLD.surfGrass + 0.05 || hitY > WORLD.surfGrass + h) continue;
      best = t; agent = a; point = origin.clone().addScaledVector(dir, t);
    }
    if (dir.y < -1e-4) { // 地面
      const tg = (WORLD.surfGrass - origin.y) / dir.y;
      if (tg > 0 && tg < best) { best = tg; agent = null; point = origin.clone().addScaledVector(dir, tg); }
    }
    if (!point) point = origin.clone().addScaledVector(dir, maxDist);
    return { dist: best, agent, point };
  }

  /** 可被子弹命中的活体：行人/狗 + 在场警察 */
  _shootables() {
    const cop = this.police?.cop;
    return cop ? [...this.city.agents.list, cop] : this.city.agents.list;
  }

  /* ---------------- 爆炸与特效 ---------------- */
  explodeAt(pos) {
    const camP = this.camera.position;
    const dist = Math.hypot(pos.x - camP.x, pos.z - camP.z);
    const humanHits = this.city.agents.explodeAt(pos.x, pos.z, 6, 100);
    const carsKilled = this.city.traffic.damageAt(pos.x, pos.z, 6); // 摧毁汽车
    // 警察与玩家也会被爆炸波及
    const cop = this.police?.cop;
    if (cop && cop.downT <= 0 && Math.hypot(cop.x - pos.x, cop.z - pos.z) < 6.5) {
      cop.takeHit(pos.x, pos.z, 100);
    }
    if (dist < 5.5) this.health?.takeHit(20); // 自己的火箭也炸自己
    if (humanHits > 0 || carsKilled > 0) this.police?.reportCrime(pos.x, pos.z);
    this.sfx.explosion(dist);

    // 火球
    const ball = new THREE.Mesh(
      new THREE.SphereGeometry(1, 12, 10),
      new THREE.MeshBasicMaterial({ color: 0xffb347, transparent: true, opacity: 0.95, depthWrite: false })
    );
    ball.position.copy(pos);
    this.app.scene.add(ball);
    this._fx.push({ kind: 'ball', obj: ball, t: 0, life: 0.5 });

    // 光闪
    const light = new THREE.PointLight(0xff7a29, 40, 30, 1.8);
    light.position.copy(pos).add(new THREE.Vector3(0, 0.6, 0));
    this.app.scene.add(light);
    this._fx.push({ kind: 'light', obj: light, t: 0, life: 0.45 });

    // 碎石飞溅
    const debrisMat = new THREE.MeshBasicMaterial({ color: 0x9aa2ad });
    for (let i = 0; i < 14; i++) {
      const d = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.13, 0.13), debrisMat);
      d.position.copy(pos).add(new THREE.Vector3(0, 0.2, 0));
      const ang = Math.random() * Math.PI * 2;
      const sp = 5 + Math.random() * 8;
      this.app.scene.add(d);
      this._fx.push({
        kind: 'debris', obj: d, t: 0, life: 1.1,
        vel: new THREE.Vector3(Math.cos(ang) * sp, 6 + Math.random() * 7, Math.sin(ang) * sp),
      });
    }

    // 近距震屏白闪
    if (dist < 12) this.flashT = Math.max(this.flashT || 0, 0.35 * (1 - dist / 12));
    this._maxFxSeen = Math.max(this._maxFxSeen, this._fx.length);
  }

  _tracer(from, to) {
    const geo = new THREE.BufferGeometry().setFromPoints([from.clone(), to.clone()]);
    const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0xffd27a, transparent: true, opacity: 0.9 }));
    this.app.scene.add(line);
    this._fx.push({ kind: 'tracer', obj: line, t: 0, life: 0.07 });
  }

  /* ---------------- 每帧更新 ---------------- */
  update(dt) {
    const active = this.locked;
    // 狙击开镜时隐藏枪模：否则深色瞄准镜筒会移到屏幕中央挡住视线（实心黑块 bug）
    const scopeOn = this.ads && WEAPONS[this.cur].scope;
    this.view.visible = active && !scopeOn;
    if (this.hud) {
      this.hud.bar.classList.toggle('hidden', !active);
      if (!active) this.hud.scope.classList.add('hidden');
    }
    if (!active) {
      if (this.ads) this.toggleAds();
      return;
    }

    const w = WEAPONS[this.cur];
    this.cooldownT -= dt;
    if (this.reloadT > 0) {
      this.reloadT -= dt;
      if (this.reloadT <= 0) {
        this.ammo[this.cur].mag = this.ammo[this.cur].max;
        this._hudDirty = true;
      }
    }
    if (w.auto && this.mouseL) this._tryFire();

    // 锤子命中帧（挥到 ~35% 行程时结算）
    if (this.swingT >= 0) {
      const prev = this.swingT;
      this.swingT += dt / w.rate;
      if (prev < 0.35 && this.swingT >= 0.35) {
        const cam = this.camera;
        const res = this.city.agents.attack(
          cam.position.x, cam.position.z, this.mode.fp.facing.x, this.mode.fp.facing.z,
          { dmg: w.dmg, range: w.range, arc: Math.cos(w.arc) });
        if (res.hits > 0) {
          this.sfx.hammerHit();
          this.police?.reportCrime(res.x, res.z); // 当街行凶 -> 有人报警
        }
      }
      if (this.swingT >= 1) this.swingT = -1;
    }

    // 视图模型：姿态过渡 + 后座 + 行走晃动
    this.kick *= Math.exp(-9 * dt);
    const target = this.ads && w.adsFov ? POSE_ADS : POSE_BASE;
    const bob = Math.sin(this.mode.fp.walkPhase) * 0.014 * this.mode.fp.movingRatio;
    this.view.position.lerp(this._tmpV.set(
      target.pos.x, target.pos.y + bob - (this.swingT >= 0 ? 0 : 0), target.pos.z - 0.16 * this.kick
    ), Math.min(1, dt * 12));
    let rotX = -0.35 * this.kick;
    if (this.cur === 'hammer' && this.swingT >= 0) { // 挥锤弧线
      const s = Math.sin(Math.min(this.swingT, 1) * Math.PI);
      rotX += -1.6 * s;
    }
    this.view.rotation.x += (rotX - this.view.rotation.x) * Math.min(1, dt * 14);

    // FOV 平滑（瞄准镜）
    const fovTarget = this.ads && w.adsFov ? w.adsFov : 45;
    if (Math.abs(this.camera.fov - fovTarget) > 0.05) {
      this.camera.fov += (fovTarget - this.camera.fov) * Math.min(1, dt * 9);
      this.camera.updateProjectionMatrix();
    }

    this._updateRockets(dt);
    this._updateFx(dt);
    this._syncHud(active);
  }

  _updateRockets(dt) {
    const g = WEAPONS.rocket.gravity;
    for (let i = this._rockets.length - 1; i >= 0; i--) {
      const r = this._rockets[i];
      r.t += dt;
      r.vel.y -= g * dt; // 抛物线
      r.mesh.position.addScaledVector(r.vel, dt);
      r.mesh.lookAt(r.mesh.position.clone().add(r.vel)); // 弹头朝速度方向

      const p = r.mesh.position;
      let boom = false;
      if (p.y <= WORLD.surfRoad + 0.12) boom = true; // 触地
      for (const box of this.city.colliders.boxes) {
        if (box.containsPoint(p)) { boom = true; break; } // 撞楼
      }
      if (!boom) {
        for (const a of this._shootables()) {
          if (a.downT > 0) continue;
          const dx = a.x - p.x, dz = a.z - p.z;
          if (dx * dx + dz * dz < 1.4 && Math.abs(p.y - WORLD.surfGrass) < 2.2) { boom = true; break; }
        }
      }
      if (boom || r.t > 6) {
        this.app.scene.remove(r.mesh);
        this._rockets.splice(i, 1);
        if (boom) this.explodeAt(p.clone());
      }
    }
  }

  _updateFx(dt) {
    for (let i = this._fx.length - 1; i >= 0; i--) {
      const f = this._fx[i];
      f.t += dt;
      const k = f.t / f.life;
      if (k >= 1) {
        this.app.scene.remove(f.obj);
        f.obj.geometry?.dispose();
        if (f.obj.material) f.obj.material.dispose();
        this._fx.splice(i, 1);
        continue;
      }
      if (f.kind === 'ball') {
        const s = 0.6 + k * 5.4;
        f.obj.scale.setScalar(s);
        f.obj.material.opacity = 0.95 * (1 - k * k);
      } else if (f.kind === 'light') {
        f.obj.intensity = 40 * (1 - k) ** 2;
      } else if (f.kind === 'tracer') {
        f.obj.material.opacity = 0.9 * (1 - k);
      } else if (f.kind === 'debris') {
        f.vel.y -= 20 * dt;
        f.obj.position.addScaledVector(f.vel, dt);
        f.obj.rotation.x += dt * 7;
        f.obj.rotation.z += dt * 5;
      }
    }
    // 震屏白闪衰减
    if (this.flashT > 0) {
      this.flashT -= dt;
      this.hud.flash.style.opacity = Math.max(0, this.flashT / 0.35) * 0.4;
    } else if (this.hud.flash.style.opacity !== '0') {
      this.hud.flash.style.opacity = '0';
    }
  }

  /* ---------------- HUD ---------------- */
  _syncHud() {
    const scopeOn = this.ads && WEAPONS[this.cur].scope;
    this.hud.scope.classList.toggle('hidden', !scopeOn);
    if (!this._hudDirty) return;
    this._hudDirty = false;
    this.hud.slots.forEach((el, i) => {
      el.classList.toggle('active', ORDER[i] === this.cur);
    });
    const a = this.ammo[this.cur];
    this.hud.ammo.textContent = a.mag === Infinity ? '∞' : `${a.mag} / ∞`;
  }
}
