// 世界：地形、树木、草丛、火堆、果子、羊、投射物、武器掉落
import * as THREE from 'three';
import { WEAPONS, createWeaponMesh } from '../player/Weapons.js';

export const MAP_SIZE = 200; // 世界边长
const R = MAP_SIZE / 2;

// 简单可复现随机
function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20240601);

export class World {
  constructor(scene, game) {
    this.scene = scene;
    this.game = game; // Game 引用（lightCampfire/update 中需要 sfx、特效）
    this.BOUNDS = R - 2;
    this.trees = [];
    this.grassPatches = [];
    this.campfires = [];
    this.fruits = [];
    this.sheep = [];
    this.projectiles = [];
    this.drops = []; // 地面物品（武器/肉/树枝）
    this._spawnTimers = { fruit: 0, drop: 0, grass: 0 };

    this.buildGround();
    this.buildTrees();
    this.buildGrass();
    this.buildCampfires();
    this.spawnFruits(8);
    this.spawnSheep(5);
    // 初始掉落：一把刀在附近，方便体验
    this.spawnDrop(new THREE.Vector3(8, 0, 6), 'knife');
    this.spawnDrop(new THREE.Vector3(-10, 0, -8), 'rock');
    this.spawnDrop(new THREE.Vector3(12, 0, -6), 'bow');
    this.spawnDrop(new THREE.Vector3(-14, 0, 10), 'firebow');
  }

  buildGround() {
    const geo = new THREE.PlaneGeometry(MAP_SIZE, MAP_SIZE, 64, 64);
    geo.rotateX(-Math.PI / 2);
    const mat = new THREE.MeshLambertMaterial({ color: 0x5fa83f });
    const ground = new THREE.Mesh(geo, mat);
    ground.receiveShadow = true;
    this.scene.add(ground);
    // 边界标记（树墙提示）
    const edgeMat = new THREE.MeshLambertMaterial({ color: 0x3f7a2a });
    for (let i = 0; i < 4; i++) {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(i < 2 ? MAP_SIZE : 2, 4, i < 2 ? 2 : MAP_SIZE), edgeMat);
      wall.position.set(
        i === 2 ? -R : i === 3 ? R : 0, 2,
        i === 0 ? -R : i === 1 ? R : 0
      );
      wall.castShadow = true;
      this.scene.add(wall);
    }
  }

  buildTrees() {
    const trunkGeo = new THREE.CylinderGeometry(0.4, 0.6, 3, 8);
    const trunkMat = new THREE.MeshLambertMaterial({ color: 0x6b4423 });
    const leafGeo = new THREE.ConeGeometry(2.2, 4.5, 8);
    const leafMat = new THREE.MeshLambertMaterial({ color: 0x2d7a3a });
    const leafMat2 = new THREE.MeshLambertMaterial({ color: 0x388a44 });

    for (let i = 0; i < 130; i++) {
      const x = (rand() * 2 - 1) * (R - 6);
      const z = (rand() * 2 - 1) * (R - 6);
      // 避免出生点附近
      if (Math.hypot(x, z) < 8) continue;
      const g = new THREE.Group();
      const t = new THREE.Mesh(trunkGeo, trunkMat);
      t.position.y = 1.5; t.castShadow = true;
      const l1 = new THREE.Mesh(leafGeo, rand() > 0.5 ? leafMat : leafMat2);
      l1.position.y = 4.2; l1.castShadow = true;
      const l2 = new THREE.Mesh(leafGeo, leafMat);
      l2.scale.setScalar(0.7); l2.position.y = 5.6; l2.castShadow = true;
      g.add(t, l1, l2);
      g.position.set(x, 0, z);
      this.scene.add(g);
      this.trees.push(g);
    }
  }

  buildGrass() {
    const mat = new THREE.MeshLambertMaterial({ color: 0x7ac94e });
    const geo = new THREE.ConeGeometry(0.15, 0.7, 4);
    const group = new THREE.Group();
    for (let i = 0; i < 220; i++) {
      const x = (rand() * 2 - 1) * (R - 4);
      const z = (rand() * 2 - 1) * (R - 4);
      const blade = new THREE.Mesh(geo, mat);
      blade.position.set(x + (rand() - 0.5) * 1.5, 0.3, z + (rand() - 0.5) * 1.5);
      blade.rotation.z = (rand() - 0.5) * 0.3;
      blade.rotation.x = (rand() - 0.5) * 0.3;
      group.add(blade);
    }
    this.scene.add(group);
    this.grassPatches.push(group);
  }

  buildCampfires() {
    for (let i = 0; i < 10; i++) {
      const x = (rand() * 2 - 1) * (R - 12);
      const z = (rand() * 2 - 1) * (R - 12);
      if (Math.hypot(x, z) < 10) { i--; continue; }
      const fire = this.makeCampfire(x, z);
      this.campfires.push(fire);
    }
  }

  makeCampfire(x, z) {
    const stoneMat = new THREE.MeshLambertMaterial({ color: 0x666666 });
    const logMat = new THREE.MeshLambertMaterial({ color: 0x5a3a1a });
    const g = new THREE.Group();
    // 石头圈
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2;
      const s = new THREE.Mesh(new THREE.DodecahedronGeometry(0.3, 0), stoneMat);
      s.position.set(Math.cos(a) * 1.1, 0.25, Math.sin(a) * 1.1);
      s.castShadow = true;
      g.add(s);
    }
    // 木头
    for (let i = 0; i < 3; i++) {
      const log = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.4, 6), logMat);
      log.position.y = 0.4;
      log.rotation.z = Math.PI / 2.4;
      log.rotation.y = i * 2.1;
      g.add(log);
    }
    // 火焰（可开关）
    const flame = new THREE.Mesh(
      new THREE.ConeGeometry(0.5, 1.2, 8),
      new THREE.MeshBasicMaterial({ color: 0xff8830 })
    );
    flame.position.y = 1.0;
    flame.visible = false;
    g.add(flame);
    const light = new THREE.PointLight(0xff8830, 0, 10);
    light.position.y = 1.3;
    g.add(light);

    g.position.set(x, 0, z);
    g.userData = { lit: false, flame, light };
    this.scene.add(g);
    return g;
  }

  lightCampfire(fire) {
    if (fire.userData.lit) return false;
    fire.userData.lit = true;
    fire.userData.flame.visible = true;
    fire.userData.light.intensity = 1.6;
    this.game.sfx.play('fire');
    this.game.sparkBurst(fire.position.clone().add(new THREE.Vector3(0, 1, 0)), 0xff9944, 14, 4);
    this.game.showMessage('火堆点燃了！');
    return true;
  }

  // ---- 果子 ----
  spawnFruits(n) {
    for (let i = 0; i < n; i++) this.spawnFruit();
  }

  spawnFruit() {
    const x = (Math.random() * 2 - 1) * (R - 6);
    const z = (Math.random() * 2 - 1) * (R - 6);
    const g = new THREE.Group();
    const stick = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 0.6, 5),
      new THREE.MeshLambertMaterial({ color: 0x4a7a2a })
    );
    stick.position.y = 0.3;
    const colors = [0xff5544, 0xffcc33, 0xdd3388, 0x88dd33];
    for (let i = 0; i < 3; i++) {
      const c = new THREE.Mesh(
        new THREE.SphereGeometry(0.18, 8, 6),
        new THREE.MeshLambertMaterial({ color: colors[(Math.random() * colors.length) | 0] })
      );
      c.position.set((Math.random() - 0.5) * 0.5, 0.7 + Math.random() * 0.3, (Math.random() - 0.5) * 0.5);
      c.castShadow = true;
      g.add(c);
    }
    g.add(stick);
    g.position.set(x, 0, z);
    g.userData = { kind: 'fruit', heal: 15 + Math.random() * 15 };
    this.scene.add(g);
    this.fruits.push(g);
  }

  // ---- 羊 ----
  spawnSheep(count = 1) {
    for (let i = 0; i < count; i++) this._spawnOneSheep();
  }

  _spawnOneSheep() {
    const x = (Math.random() * 2 - 1) * (R - 10);
    const z = (Math.random() * 2 - 1) * (R - 10);
    if (Math.hypot(x, z) < 12) return this._spawnOneSheep();
    const g = new THREE.Group();
    const wool = new THREE.MeshLambertMaterial({ color: 0xf2efe6 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.9, 1.0), wool);
    body.position.y = 0.9; body.castShadow = true;
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5),
      new THREE.MeshLambertMaterial({ color: 0x554433 }));
    head.position.set(1.0, 1.15, 0);
    g.add(body, head);
    for (const [lx, lz] of [[-0.6, 0.35], [-0.6, -0.35], [0.6, 0.35], [0.6, -0.35]]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.8, 0.2),
        new THREE.MeshLambertMaterial({ color: 0x554433 }));
      leg.position.set(lx, 0.4, lz);
      g.add(leg);
    }
    g.position.set(x, 0, z);
    g.userData = { kind: 'sheep', hp: 20, maxHp: 20, wanderT: 0, dir: Math.random() * Math.PI * 2, meat: true };
    this.scene.add(g);
    this.sheep.push(g);
  }

  // ---- 地面掉落 ----
  spawnDrop(pos, kind) {
    let g;
    if (kind === 'branch') {
      g = createWeaponMesh(WEAPONS.branch);
      g.scale.setScalar(0.8);
      g.rotation.z = Math.PI / 2;
      g.position.set(pos.x, 0.25, pos.z);
      g.userData = { kind: 'drop', item: 'branch', bob: Math.random() * 6 };
    } else if (kind === 'meat') {
      g = new THREE.Mesh(
        new THREE.SphereGeometry(0.25, 8, 6),
        new THREE.MeshLambertMaterial({ color: 0xc04030 })
      );
      g.position.set(pos.x, 0.3, pos.z);
      g.userData = { kind: 'drop', item: 'meat', bob: Math.random() * 6 };
    } else {
      g = createWeaponMesh(WEAPONS[kind] || WEAPONS.rock);
      g.scale.setScalar(0.9);
      g.rotation.z = Math.PI / 2;
      g.position.set(pos.x, 0.35, pos.z);
      g.userData = { kind: 'drop', item: kind, bob: Math.random() * 6 };
    }
    this.scene.add(g);
    this.drops.push(g);
    return g;
  }

  // ---- 投射物 ----
  spawnProjectile(pos, dir, owner, def) {
    const isBow = def.id === 'bow' || def.id === 'firebow';
    let mesh;
    if (isBow) {
      mesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.04, 1.0, 5),
        new THREE.MeshLambertMaterial({ color: def.fire ? 0xff7a30 : 0xccd8e8 })
      );
      mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
      if (def.fire) {
        const flame = new THREE.Mesh(
          new THREE.SphereGeometry(0.12, 6, 5),
          new THREE.MeshBasicMaterial({ color: 0xffa040 })
        );
        flame.position.y = -0.5;
        mesh.add(flame);
      }
    } else {
      mesh = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.2, 0),
        new THREE.MeshLambertMaterial({ color: 0x8a8a88 })
      );
    }
    mesh.position.copy(pos);
    mesh.castShadow = true;
    this.scene.add(mesh);
    const speed = isBow ? 35 : 20;
    this.projectiles.push({
      mesh, dir: dir.clone(),
      speed,
      life: def.range / speed + 1,
      owner, def,
      spin: def.throwable ? new THREE.Vector3(0, 8, 5) : new THREE.Vector3(0, 0, 0)
    });
  }

  // ---- 玩家交互 E ----
  tryInteract(player) {
    const p = player.mesh.position;
    // 火堆：有树枝时点燃，制成火炬
    for (const f of this.campfires) {
      if (p.distanceTo(f.position) < 2.2) {
        if (!f.userData.lit && player.inventory.includes('branch')) {
          if (this.lightCampfire(f)) {
            if (!player.inventory.includes('torch')) {
              player.addWeapon('torch');
              const slot = player.inventory.indexOf('torch') + 1;
              player.game.showMessage(`树枝点燃制成火炬！(按 ${slot} 使用)`);
              player.game.sfx.play('torchLight');
            }
          }
        } else if (f.userData.lit) {
          player.game.showMessage('火堆已经点燃了');
        }
        return;
      }
    }
    // 果子
    for (let i = this.fruits.length - 1; i >= 0; i--) {
      const f = this.fruits[i];
      if (p.distanceTo(f.position) < 1.8) {
        this.scene.remove(f);
        this.fruits.splice(i, 1);
        player.heal(Math.round(f.userData.heal));
        return;
      }
    }
    // 掉落物
    for (let i = this.drops.length - 1; i >= 0; i--) {
      const d = this.drops[i];
      if (p.distanceTo(d.position) < 1.6) {
        const item = d.userData.item;
        this.scene.remove(d);
        this.drops.splice(i, 1);
        player.game.sfx.play('pick');
        if (item === 'meat') {
          player.heal(25);
        } else if (item === 'branch') {
          player.addWeapon('branch');
          player.game.showMessage('获得树枝');
        } else {
          if (player.addWeapon(item)) player.game.showMessage(`获得 ${WEAPONS[item].name}！(按 ${player.inventory.indexOf(item) + 1} 切换)`);
        }
        return;
      }
    }
  }

  update(dt, player) {
    const now = performance.now();
    // 火焰晃动
    for (const f of this.campfires) {
      if (f.userData.lit) {
        const fl = f.userData.flame;
        fl.scale.setScalar(1 + Math.sin(now / 90 + f.position.x) * 0.2);
        f.userData.light.intensity = 1.5 + Math.sin(now / 70) * 0.3;
      }
    }
    // 掉落物漂浮
    for (const d of this.drops) {
      d.position.y = 0.3 + Math.sin(now / 400 + d.userData.bob) * 0.12;
      d.rotation.y += dt * 1.5;
    }
    // 果子轻微摆动
    for (const f of this.fruits) f.rotation.y += dt * 0.4;

    // 羊漫游 + 被杀处理
    for (let i = this.sheep.length - 1; i >= 0; i--) {
      const s = this.sheep[i];
      const u = s.userData;
      u.wanderT -= dt;
      if (u.wanderT <= 0) { u.dir = Math.random() * Math.PI * 2; u.wanderT = 2 + Math.random() * 4; }
      // 躲避玩家
      const dp = s.position.distanceTo(player.mesh.position);
      let dir = u.dir;
      if (dp < 5) dir = Math.atan2(s.position.z - player.mesh.position.z, s.position.x - player.mesh.position.x);
      s.position.x += Math.cos(dir) * 1.5 * dt;
      s.position.z += Math.sin(dir) * 1.5 * dt;
      s.position.x = THREE.MathUtils.clamp(s.position.x, -R, R);
      s.position.z = THREE.MathUtils.clamp(s.position.z, -R, R);
      s.rotation.y = -dir;

      if (u.hp <= 0) {
        this.scene.remove(s);
        this.sheep.splice(i, 1);
        this.game.sfx.play('sheepDeath');
        this.game.sparkBurst(s.position.clone().add(new THREE.Vector3(0, 1, 0)), 0xf2efe6, 10, 5);
        this.game.addShake(0.25);
        this.spawnDrop(new THREE.Vector3(s.position.x, 0, s.position.z), 'meat');
        this.game.showMessage('获得一块肉！(C 拾取)');
        s._removed = true;
        if (this.game.player.target === s) this.game.player.target = null;
      }
    }

    // 投射物
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const pr = this.projectiles[i];
      pr.life -= dt;
      const prev = pr.mesh.position.clone();
      pr.mesh.position.addScaledVector(pr.dir, pr.speed * dt);
      if (pr.spin.x) pr.mesh.rotation.x += pr.spin.x * dt;
      if (pr.spin.y) pr.mesh.rotation.y += pr.spin.y * dt;
      // 箭矢拖尾：冰蓝（弓）/ 火焰橙红（火箭、火矢），节流每 2 帧一次
      const isArrow = pr.def.id === 'bow' || pr.def.fire;
      if (isArrow && (this._trailTick = (this._trailTick || 0) + 1) % 2 === 0) {
        this.game.sparkBurst(prev, pr.def.fire ? 0xff7733 : 0xcfe8ff, 1, 0.4);
      }

      let dead = pr.life <= 0 || Math.abs(pr.mesh.position.x) > R || Math.abs(pr.mesh.position.z) > R;

      // 撞怪物/羊
      if (!dead) {
        for (const m of this.game.monsters.list) {
          if (m.mesh.position.distanceTo(pr.mesh.position) < 1) {
            m.takeDamage(pr.def.damage, pr.owner);
            this.game.sfx.play('hit', pr.def.id);
            this.game.addShake(0.2);
            const ip = m.mesh.position.clone().add(new THREE.Vector3(0, 1, 0));
            this.game.sparkBurst(ip, pr.def.fire ? 0xff8844 : 0xffee99, pr.def.fire ? 12 : 8, 5);
            this.game.damageText(m.mesh.position.clone().add(new THREE.Vector3(0, 1.4, 0)), `-${pr.def.damage}`, '#fff');
            m._hasHurt = true;
            this.game.healthBar(m, m.mesh.position, Math.max(0, m.hp) / m.maxHp, '#ff5a5a');
            // 火箭命中后小范围溅射点燃（对附近怪物 40% 伤害）
            if (pr.def.fire && pr.def.multishot) {
              for (const o of this.game.monsters.list) {
                if (o === m || o.dead || o._removed) continue;
                if (o.mesh.position.distanceTo(m.mesh.position) < 2.5) {
                  const sd = Math.round(pr.def.damage * 0.4);
                  o.takeDamage(sd, pr.owner);
                  this.game.damageText(o.mesh.position.clone().add(new THREE.Vector3(0, 1.4, 0)), `-${sd}`, '#ffaa55', 0.9);
                }
              }
            }
            dead = true;
            break;
          }
        }
        if (!dead) {
          for (const s of this.sheep) {
            if (s.position.distanceTo(pr.mesh.position) < 1) {
              s.userData.hp -= pr.def.damage;
              this.game.sfx.play('hit', pr.def.id);
              const ip = s.position.clone().add(new THREE.Vector3(0, 1, 0));
              this.game.sparkBurst(ip, 0xffb0a0, 6, 4);
              this.game.damageText(ip.clone().add(new THREE.Vector3(0, 0.6, 0)), `-${pr.def.damage}`, '#fff');
              s.userData._hasHurt = true;
              this.game.healthBar(s, s.position, Math.max(0, s.userData.hp) / s.userData.maxHp, '#ffb0a0');
              dead = true;
              break;
            }
          }
        }
      }
      // 撞树
      if (!dead) {
        for (const t of this.trees) {
          if (t.position.distanceTo(pr.mesh.position) < 1.5) {
            this.game.sparkBurst(pr.mesh.position, 0xaadd88, 5, 3);
            dead = true;
            break;
          }
        }
      }
      if (dead) {
        this.scene.remove(pr.mesh);
        this.projectiles.splice(i, 1);
      }
    }

    // 定期刷新资源
    this._spawnTimers.fruit -= dt;
    this._spawnTimers.drop -= dt;
    if (this._spawnTimers.fruit <= 0 && this.fruits.length < 15) {
      this.spawnFruit();
      this._spawnTimers.fruit = 6 + Math.random() * 6;
    }
    if (this._spawnTimers.drop <= 0 && this.drops.length < 12) {
      const pool = ['branch', 'branch', 'knife', 'rock', 'bow', 'firebow', 'meat'];
      const item = pool[(Math.random() * pool.length) | 0];
      // 靠近玩家的位置刷，保证能捡到
      const ang = Math.random() * Math.PI * 2;
      const dist = 15 + Math.random() * 25;
      this.spawnDrop(
        new THREE.Vector3(
          THREE.MathUtils.clamp(player.mesh.position.x + Math.cos(ang) * dist, -R + 4, R - 4),
          0,
          THREE.MathUtils.clamp(player.mesh.position.z + Math.sin(ang) * dist, -R + 4, R - 4)
        ), item
      );
      this._spawnTimers.drop = 8 + Math.random() * 8;
    }
    // 羊补充
    if (this.sheep.length < 5 && Math.random() < dt * 0.1) this.spawnSheep();
  }
}
