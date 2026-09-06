// 玩家：移动、跳跃、攻击(近战/远程)、拾取、武器切换
import * as THREE from 'three';
import { WEAPONS, createWeaponMesh } from './Weapons.js';
import { Input } from '../core/Input.js';

const WALK = 6, SPRINT = 9.5, GRAV = 22, JUMP = 8.5;

export class Player {
  constructor(game) {
    this.game = game;
    this.input = new Input();

    this.hp = 100; this.maxHp = 100;
    this.stamina = 100; this.maxStamina = 100;

    // 武器：初始只有树枝
    this.inventory = ['branch'];
    this.current = 'branch';
    this.coolTimer = 0;

    this.velY = 0;
    this._airY = 0;
    this._bobT = 0;
    this._hurtFlash = 0;
    this.target = null;   // 当前锁定的目标（怪物或羊）
    this._lockT = 0;      // 锁定保持时间
    this._rangeRing = null; // 攻击范围圈（懒创建）
    this.onGround = true;
    this.attackAnim = 0; // >0 攻击动画中
    this.facing = new THREE.Vector3(0, 0, -1);
    this._moveDir = new THREE.Vector3();
    this._aimRay = new THREE.Raycaster();
    this._aimPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

    this.buildMesh();
    this.buildWeaponMesh();

    // HUD 武器槽
    this.updateWeaponSlots();
  }

  buildMesh() {
    const g = new THREE.Group();
    // 身体
    const body = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.45, 0.9, 4, 8),
      new THREE.MeshLambertMaterial({ color: 0x3a6ed0 })
    );
    body.position.y = 1.0; body.castShadow = true;
    g.add(body);
    // 头
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.38, 12, 10),
      new THREE.MeshLambertMaterial({ color: 0xffd9b3 })
    );
    head.position.y = 1.95; head.castShadow = true;
    g.add(head);
    // 帽子(塞尔达绿帽)
    const hat = new THREE.Mesh(
      new THREE.ConeGeometry(0.42, 0.7, 10),
      new THREE.MeshLambertMaterial({ color: 0x2e9e4f })
    );
    hat.position.y = 2.4;
    g.add(hat);
    this.head = head; this.bodyMesh = body;
    this.mesh = g;
    this.game.scene.add(g);
  }

  buildWeaponMesh() {
    if (this.weaponMesh) {
      this.weaponMesh.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
      this.mesh.remove(this.weaponMesh);
    }
    // 切换武器时重置挥砍动画姿态，避免残留旋转
    this.attackAnim = 0;
    const def = WEAPONS[this.current];
    this.weaponMesh = createWeaponMesh(def);
    this.weaponMesh.position.set(0.55, 0.4, -0.3);
    this.weaponMesh.castShadow = true;
    this.mesh.add(this.weaponMesh);
  }

  addWeapon(id) {
    if (this.inventory.includes(id)) return false;
    this.inventory.push(id);
    this.updateWeaponSlots();
    return true;
  }

  switchWeapon(index) {
    const id = this.inventory[index];
    if (!id || id === this.current) return;
    this.current = id;
    this.buildWeaponMesh();
    this.updateWeaponSlots();
    this.game.sfx.play('pick');
  }

  updateWeaponSlots() {
    const el = document.getElementById('weapon-slots');
    if (!el) return;
    el.innerHTML = this.inventory.map((id, i) => {
      const w = WEAPONS[id];
      return `<div class="weapon-slot ${id === this.current ? 'active' : ''}">${i + 1}. ${w.name} <span class="dmg">伤${w.damage}</span></div>`;
    }).join('');
  }

  bindInput() {
    this._numberKeyHandler = (e) => {
      const map = { Digit1: 0, Digit2: 1, Digit3: 2, Digit4: 3, Digit5: 4, Digit6: 5 };
      if (map[e.code] !== undefined) this.switchWeapon(map[e.code]);
    };
    window.addEventListener('keydown', this._numberKeyHandler);
  }

  update(dt) {
    const k = this.input;
    const def = WEAPONS[this.current];

    // 移动
    let mx = 0, mz = 0;
    if (k.key('KeyW')) mz -= 1;
    if (k.key('KeyS')) mz += 1;
    if (k.key('KeyA')) mx -= 1;
    if (k.key('KeyD')) mx += 1;
    const moving = mx !== 0 || mz !== 0;
    const sprinting = k.key('ShiftLeft') || k.key('ShiftRight');
    const speed = (sprinting && this.stamina > 1 && moving) ? SPRINT : WALK;
    if (sprinting && moving && this.stamina > 0) this.stamina = Math.max(0, this.stamina - 25 * dt);
    else this.stamina = Math.min(this.maxStamina, this.stamina + 20 * dt);

    if (moving) {
      const len = Math.hypot(mx, mz);
      mx /= len; mz /= len;
      this.mesh.position.x += mx * speed * dt;
      this.mesh.position.z += mz * speed * dt;
      // 移动方向仅记入 _moveDir；面朝由鼠标瞄准决定（见下）
      this._moveDir.set(mx, 0, mz);
      this._bobT = (this._bobT || 0) + dt * (sprinting ? 14 : 10);
      this.mesh.position.y = Math.abs(Math.sin(this._bobT)) * 0.12 + Math.max(0, this._airY || 0);
      this.bodyMesh.rotation.x = Math.sin(performance.now() / 120) * 0.15;
    } else {
      this.bodyMesh.rotation.x *= 0.85;
      this._airY = 0;
      this._moveDir.set(0, 0, 0);
    }

    // ---- 鼠标瞄准：面朝 = 指向鼠标在地面的投影点（扇面打击方向）----
    const aim = this.getAimPoint();
    if (aim) {
      const dx = aim.x - this.mesh.position.x, dz = aim.z - this.mesh.position.z;
      if (Math.hypot(dx, dz) > 0.5) { // 死区：鼠标几乎指在脚下时不转身，避免朝向抖动
        this.facing.set(dx, 0, dz).normalize();
        // 攻击动画中不强制转身，避免姿态跳变
        if (this.attackAnim <= 0) this.mesh.rotation.y = Math.atan2(this.facing.x, this.facing.z);
      }
    } else if (moving) {
      this.facing.copy(this._moveDir);
      if (this.attackAnim <= 0) this.mesh.rotation.y = Math.atan2(mx, mz);
    }

    // 世界边界
    const B = this.game.world.BOUNDS;
    this.mesh.position.x = THREE.MathUtils.clamp(this.mesh.position.x, -B, B);
    this.mesh.position.z = THREE.MathUtils.clamp(this.mesh.position.z, -B, B);

    // 重力/跳跃（_airY 为空中高度，与移动上下起伏叠加）
    if (k.key('Space') && this.onGround) {
      this.velY = JUMP; this.onGround = false;
      this.game.sfx.play('jump');
    }
    this.velY -= GRAV * dt;
    this._airY = Math.max(0, this._airY + this.velY * dt);
    if (this._airY <= 0 && this.velY < 0) { this._airY = 0; this.velY = 0; this.onGround = true; }
    if (!moving) this.mesh.position.y = this._airY;

    // 受击红闪
    if (this._hurtFlash > 0) {
      this._hurtFlash -= dt;
      this.bodyMesh.material.emissive.setHex(0x882222);
      this.head.material.emissive.setHex(0x882222);
      if (this._hurtFlash <= 0) {
        this.bodyMesh.material.emissive.setHex(0x000000);
        this.head.material.emissive.setHex(0x000000);
      }
    }

    // 锁定目标过期：死亡/移除/超出 1.5 倍范围则解除
    if (this.target) {
      const t = this.target;
      if (!this._targetAlive(t)) {
        this.target = null;
        this._lockT = 0;
      } else {
        const d = this._tPos(t).distanceTo(this.mesh.position);
        if (d > WEAPONS[this.current].range * 1.5 + 1) {
          this.target = null;
          this._lockT = 0;
        } else {
          this._lockT -= dt;
          if (this._lockT <= 0) this.target = null;
        }
      }
    }
    this.updateRangeRing();

    // 攻击
    this.coolTimer = Math.max(0, this.coolTimer - dt);
    if (this.attackAnim > 0) {
      this.attackAnim = Math.max(0, this.attackAnim - dt);
      const t = 1 - this.attackAnim / def.cooldown;
      if (def.type === 'melee') {
        this.weaponMesh.rotation.z = Math.sin(t * Math.PI) * -1.6;
        this.weaponMesh.rotation.x = Math.sin(t * Math.PI) * -0.6;
      }
      if (this.attackAnim <= 0.001) { this.weaponMesh.rotation.z = 0; this.weaponMesh.rotation.x = 0; }
    }

    // ---- 攻击输入：左键近战（长按连续挥砍），右键远程发射（按住连发）----
    if (def.type === 'melee') {
      // 长按左键 = 冷却一好就自动继续挥；J 键同样支持按住连挥
      const wantMelee = k.mouseLeft || k.key('KeyJ');
      if (wantMelee && this.coolTimer <= 0) this.doMelee();
    } else {
      // 远程：右键发射；左键点按=单发，长按=连发
      const wantRanged = k.mouseRight || k.mouseLeft || k.key('KeyK');
      if (wantRanged && this.coolTimer <= 0) this.fireRanged();
    }

    // 火焰武器发光
    if (def.fire && this.weaponMesh.userData.flame) {
      const f = this.weaponMesh.userData.flame;
      f.scale.setScalar(1 + Math.sin(performance.now() / 90) * 0.15);
    }

    // 交互(C)：拾取/点燃营火等
    if (k.keys.has('KeyC') && !this._eLatch) {
      this._eLatch = true;
      this.game.world.tryInteract(this);
    }
    if (!k.keys.has('KeyC')) this._eLatch = false;

    // 低血量恢复节奏：缓慢回血
    if (this.hp > 0 && this.hp < this.maxHp) {
      this._regenT = (this._regenT || 0) + dt;
      if (this._regenT > 3) { this._regenT = 0; this.hp = Math.min(this.maxHp, this.hp + 1); }
    }

    // 死亡
    if (this.hp <= 0 && !this._dead) {
      this._dead = true;
      this.game.playerDied();
    }
  }

  // 统一取目标世界坐标（羊是 Group 本身，怪物包装对象有 .mesh）
  _tPos(t) { return t.isMonster ? t.mesh.position : t.position; }

  // ---- 鼠标瞄准：把屏幕鼠标位置投射到玩家脚底高度的水平面，得到地面瞄准点 ----
  getAimPoint() {
    const k = this.input;
    if (!k.mouseMoved) return null; // 还没动过鼠标则用移动朝向
    const ndcX = (k.mx / window.innerWidth) * 2 - 1;
    const ndcY = -(k.my / window.innerHeight) * 2 + 1;
    this._aimRay.setFromCamera({ x: ndcX, y: ndcY }, this.game.camera);
    // 平面过玩家脚底：y=0（玩家的 y 只是弹跳偏移，不能参与瞄准平面，否则鼠标在角色附近时投影会翻转）
    this._aimPlane.constant = 0;
    const hit = this._aimHit || (this._aimHit = new THREE.Vector3());
    if (!this._aimRay.ray.intersectPlane(this._aimPlane, hit)) return null;
    // 相机俯视下鼠标永远投得到地面；若交点在相机后方(理论上不会)则忽略
    return hit;
  }

  // 目标是否有效（死亡/移除/正在死亡动画都不算）
  _targetAlive(t) {
    if (t._removed) return false;
    if (t.isMonster) return !t.dead;
    return this.game.world.sheep.includes(t);
  }

  // ---- 攻击目标收集（扇面 + 自动锁敌）----
  // 扇面中心 = 鼠标瞄准方向(this.facing)；主目标：扇面内最近有效目标，主目标吃全额伤害，扇面内其他目标吃 45% 溅射
  // 距离：已受伤 1.0x / 未受伤 1.35x
  collectAttackTargets(def) {
    const pos = this.mesh.position;
    const f = this.facing;
    let main = null, mainD = Infinity;
    const others = [];
    const inRange = (tp, hasHurt) => {
      const d = tp.distanceTo(pos);
      // 距离上限：范围外排除；贴脸重叠(≈0)也视为有效命中（不再被漏掉）
      const R = def.range * (hasHurt ? 1.0 : 1.35) + 0.5;
      if (d > R) return { out: true, d };
      // 全向武器（火炬）：360° 无角度限制
      if (def.omnidirectional || d < 0.5) return { out: false, d, ang: 0 };
      const ang = f.angleTo(tp.clone().sub(pos).normalize());
      // 扇面：鼠标指向 ±90°（共180°）内可命中
      return { out: ang > Math.PI / 2, d, ang };
    };
    for (const m of this.game.monsters.list) {
      if (!this._targetAlive(m)) continue;
      if (m.hp < m.maxHp && m.hp > 0) m._hasHurt = true;
      const r = inRange(m.mesh.position, m._hasHurt);
      if (r.out) continue;
      if (r.d < mainD) { main = m; mainD = r.d; }
    }
    for (const s of this.game.world.sheep) {
      if (!this._targetAlive(s)) continue;
      if (s.userData.hp < s.userData.maxHp) s.userData._hasHurt = true;
      const r = inRange(this._tPos(s), s.userData._hasHurt);
      if (r.out) continue;
      if (r.d < mainD) { main = s; mainD = r.d; }
    }
    // 收集次级目标（排除主目标）
    if (main) {
      for (const m of this.game.monsters.list) {
        if (m === main || !this._targetAlive(m)) continue;
        const r = inRange(m.mesh.position, m._hasHurt);
        if (!r.out) others.push(m);
      }
      for (const s of this.game.world.sheep) {
        if (s === main || !this._targetAlive(s)) continue;
        const r = inRange(this._tPos(s), s.userData._hasHurt);
        if (!r.out) others.push(s);
      }
    }
    return { main, others };
  }

  doMelee() {
    const def = WEAPONS[this.current];
    this.coolTimer = def.cooldown;
    this.attackAnim = def.cooldown;
    this.game.sfx.play('swing', def.id);
    this._lockT = 1.0; // 攻击后短暂保持锁定

    this._dbgSwings = (this._dbgSwings || 0) + 1;
    const { main, others } = this.collectAttackTargets(def);
    if (!main) {
      this.target = null;
      this._lockT = 0.4; // 挥空：短促刀光提示
      this.game.slashArc(this.mesh.position, this.facing, def);
      return;
    }
    this.target = main;
    this._lockT = 1.0;
    this.game.sfx.play('hit', def.id);
    this.game.addShake(0.35);
    const arcColor = def.fire ? 0xff9944 : (def.id === 'knife' ? 0xcfe8ff : 0xffdd88);
    this.game.slashArc(this.mesh.position, this.facing, def);
    // 火花打在主目标身上
    const impact = this._tPos(main).clone().add(new THREE.Vector3(0, 1, 0));
    this.game.sparkBurst(impact, arcColor, 12, 6);

    const hitTarget = (t, dmg) => {
      const ip = this._tPos(t).clone().add(new THREE.Vector3(0, 1, 0));
      this.game.sparkBurst(ip, def.fire ? 0xff8844 : 0xffee99, 8, 5);
      this.game.damageText(ip.clone().add(new THREE.Vector3(0, 0.4, 0)), `-${dmg}`, def.fire ? '#ffaa55' : '#fff', dmg >= def.damage ? 1.25 : 0.95);
      if (t.isMonster) {
        t.takeDamage(dmg, this);
        t._hasHurt = true;
        this.game.healthBar(t, t.mesh.position, Math.max(0, t.hp) / t.maxHp, '#ff5a5a');
      } else {
        t.userData.hp -= dmg;
        t.userData._hasHurt = true;
        this.game.healthBar(t, this._tPos(t), Math.max(0, t.userData.hp) / t.userData.maxHp, '#ffb0a0');
      }
    };
    hitTarget(main, def.damage);
    for (const t of others) hitTarget(t, Math.round(def.damage * 0.45));
    if (def.fire) this.game.sfx.play('fire');
  }

  fireRanged() {
    const def = WEAPONS[this.current];
    this.coolTimer = def.cooldown;
    this.attackAnim = def.cooldown * 0.6;
    this.game.sfx.play(def.id === 'bow' || def.fire ? 'arrow' : 'swing');

    const pos = this.mesh.position.clone().add(new THREE.Vector3(0, 1.5, 0));
    // 方向：优先鼠标瞄准方向；无鼠标时自动锁定最近目标，否则面朝
    let dir = null;
    const aim = this.getAimPoint();
    if (aim) dir = new THREE.Vector3(aim.x - pos.x, 1.0 - pos.y, aim.z - pos.z).normalize();
    let nearest = null, nd = Infinity;
    for (const m of this.game.monsters.list) {
      if (m.dead) continue;
      const d = m.mesh.position.distanceTo(this.mesh.position);
      if (d < def.range && d < nd) { nd = d; nearest = m; }
    }
    for (const s of this.game.world.sheep) {
      const d = this._tPos(s).distanceTo(this.mesh.position);
      if (d < def.range && d < nd) { nd = d; nearest = s; }
    }
    this.target = nearest;
    this._lockT = nearest ? 1.2 : 0.3;
    // 无鼠标瞄准时才自动吸附最近目标；有鼠标则完全由玩家控制方向
    if (!dir && nearest) {
      const aimY = nearest.isMonster ? 0.8 : 1.0;
      dir = this._tPos(nearest).clone().add(new THREE.Vector3(0, aimY, 0)).sub(pos).normalize();
    }
    if (!dir) dir = this.facing.clone();

    // 多发（火焰连弓三连箭）：围绕基准方向扇形展开
    const shots = def.multishot || 1;
    const spread = def.spread || 0;
    for (let i = 0; i < shots; i++) {
      let d = dir;
      if (shots > 1) {
        const a = (i - (shots - 1) / 2) * spread;
        d = dir.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), a);
      }
      this.game.world.spawnProjectile(pos, d, this, def);
    }
  }

  // 攻击范围指示：近战显示鼠标指向的扇面；远程隐藏（射程远，圈无意义）
  updateRangeRing() {
    const def = WEAPONS[this.current];
    if (def.type !== 'melee') {
      if (this._rangeRing) { this._rangeRing.visible = false; }
      return;
    }
    if (!this._rangeRing) {
      // 扇面：±90°（与命中判定一致），半径=武器范围；全向武器用整圆
      const arc = def.omnidirectional ? Math.PI * 2 : Math.PI;
      const start = def.omnidirectional ? 0 : -Math.PI / 2;
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(def.range * 0.12, def.range + 0.5, 32, 1, start, arc),
        new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.12, side: THREE.DoubleSide })
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.05;
      ring.visible = false;
      this.game.scene.add(ring);
      this._rangeRing = ring;
    }
    const r = this._rangeRing;
    const locked = !!this.target;
    r.visible = true;
    r.position.set(this.mesh.position.x, 0.05, this.mesh.position.z);
    // 扇面朝向鼠标瞄准方向（全向武器整圆无所谓朝向）
    if (!WEAPONS[this.current].omnidirectional) {
      r.rotation.z = -Math.atan2(this.facing.x, this.facing.z) + Math.PI / 2;
    }
    r.material.color.setHex(locked ? 0xffdd55 : (def.fire ? 0xff9944 : 0xffffff));
    const base = locked ? 0.4 : 0.12;
    r.material.opacity = Math.min(0.75, base + Math.sin(performance.now() / 200) * 0.05 * (locked ? 2 : 1));
  }

  takeDamage(dmg, source) {
    this.hp = Math.max(0, this.hp - dmg);
    this.game.sfx.play('hurt');
    this.game.addShake(0.5);
    // 受击红闪 + 伤害飘字
    this._hurtFlash = 0.25;
    this.game.damageText(
      this.mesh.position.clone().add(new THREE.Vector3(0, 2.8, 0)),
      `-${dmg}`, '#ff6666', 1.1
    );
  }

  heal(amount) {
    this.hp = Math.min(this.maxHp, this.hp + amount);
    this.game.sfx.play('eat');
    this.game.showMessage(`+${amount} HP`);
    this.game.damageText(
      this.mesh.position.clone().add(new THREE.Vector3(0, 2.8, 0)),
      `+${amount}`, '#66ff88', 1.1
    );
  }
}
