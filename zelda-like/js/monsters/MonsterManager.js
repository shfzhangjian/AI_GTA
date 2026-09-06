// 怪物管理器：随机刷怪、追踪、攻击、死亡
import * as THREE from 'three';

const TEMPLATES = {
  slime: {
    name: '史莱姆', hp: 20, speed: 3.2, damage: 6, range: 1.3, atkCd: 1.0, score: 10, color: 0x55cc55,
    build() {
      const g = new THREE.Group();
      const m = new THREE.Mesh(
        new THREE.SphereGeometry(0.6, 10, 8),
        new THREE.MeshLambertMaterial({ color: 0x55cc55 })
      );
      m.scale.y = 0.75; m.position.y = 0.45; m.castShadow = true;
      g.add(m);
      for (const [ex, ez] of [[-0.18, 0.42], [0.18, 0.42]]) {
        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 5),
          new THREE.MeshBasicMaterial({ color: 0x111111 }));
        eye.position.set(ex, 0.62, ez);
        g.add(eye);
      }
      return g;
    }
  },
  bat: {
    name: '蝙蝠', hp: 12, speed: 5.5, damage: 5, range: 1.1, atkCd: 0.8, score: 8, color: 0x7755bb,
    build() {
      const g = new THREE.Group();
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 6),
        new THREE.MeshLambertMaterial({ color: 0x7755bb }));
      body.position.y = 0.6;
      const wingGeo = new THREE.BoxGeometry(0.9, 0.06, 0.4);
      const wMat = new THREE.MeshLambertMaterial({ color: 0x553399 });
      const wl = new THREE.Mesh(wingGeo, wMat); wl.position.set(-0.6, 0.6, 0);
      const wr = new THREE.Mesh(wingGeo, wMat); wr.position.set(0.6, 0.6, 0);
      g.add(body, wl, wr);
      g.userData.wings = [wl, wr];
      g.position.y = 0.8;
      return g;
    }
  },
  wolf: {
    name: '狼', hp: 35, speed: 4.5, damage: 10, range: 1.5, atkCd: 1.2, score: 20, color: 0x888888,
    build() {
      const g = new THREE.Group();
      const mat = new THREE.MeshLambertMaterial({ color: 0x888888 });
      const body = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.7, 0.8), mat);
      body.position.y = 0.7; body.castShadow = true;
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.5, 0.5), mat);
      head.position.set(0.95, 0.95, 0);
      g.add(body, head);
      for (const [lx, lz] of [[-0.5, 0.25], [-0.5, -0.25], [0.5, 0.25], [0.5, -0.25]]) {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.65, 0.16), mat);
        leg.position.set(lx, 0.32, lz);
        g.add(leg);
      }
      // 红眼
      const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff3333 });
      const e1 = new THREE.Mesh(new THREE.SphereGeometry(0.06, 5, 4), eyeMat);
      e1.position.set(1.2, 1.05, 0.12);
      const e2 = e1.clone(); e2.position.z = -0.12;
      g.add(e1, e2);
      return g;
    }
  },
  ogre: {
    name: '哥布林巨魔', hp: 80, speed: 2.6, damage: 18, range: 1.8, atkCd: 1.6, score: 50, color: 0x8a5a2a,
    build() {
      const g = new THREE.Group();
      const mat = new THREE.MeshLambertMaterial({ color: 0x8a5a2a });
      const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.7, 1.0, 4, 8), mat);
      body.position.y = 1.5; body.castShadow = true;
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.5, 10, 8), mat);
      head.position.y = 2.7;
      g.add(body, head);
      const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff6600 });
      const e1 = new THREE.Mesh(new THREE.SphereGeometry(0.1, 5, 4), eyeMat);
      e1.position.set(-0.18, 2.8, 0.4);
      const e2 = e1.clone(); e2.position.x = 0.18;
      g.add(e1, e2);
      // 木棒
      const club = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.15, 1.8, 6),
        new THREE.MeshLambertMaterial({ color: 0x5a3a1a }));
      club.position.set(0.85, 1.6, 0);
      club.rotation.z = 0.4;
      g.add(club);
      return g;
    }
  }
};

const POOL = [
  { type: 'slime', weight: 5, minDist: 12, maxDist: 30 },
  { type: 'bat', weight: 4, minDist: 15, maxDist: 35 },
  { type: 'wolf', weight: 3, minDist: 18, maxDist: 40 },
  { type: 'ogre', weight: 1.5, minDist: 25, maxDist: 45 },
];

class Monster {
  constructor(game, type, pos) {
    this.game = game;
    this.isMonster = true;
    const t = TEMPLATES[type];
    this.type = type;
    this.mesh = t.build();
    this.mesh.position.copy(pos);
    this.hp = t.hp; this.maxHp = t.hp;
    this.speed = t.speed; this.damage = t.damage; this.range = t.range;
    this.atkCd = t.atkCd;
    this._hasHurt = false; // 是否曾受伤（影响被锁定范围）
    this.attackTimer = 0;
    this.attackAnim = 0;
    this._stun = 0; // 先手打击硬直剩余时间
    this._knock = new THREE.Vector3();
    this.dead = false;
    this.bob = Math.random() * 6;
    game.scene.add(this.mesh);
  }

  takeDamage(dmg, source) {
    if (this.dead) return;
    this.hp -= dmg;
    // 先手惩罚：被玩家偷袭命中 → 短暂呆滞（硬直），不会立即反击
    // （类塞尔达"被打惊"处理：距离越近/伤害越大，硬直越长）
    const hard = THREE.MathUtils.clamp(0.35 + dmg * 0.02, 0.4, 1.1);
    this._stun = Math.max(this._stun || 0, hard);
    // 击退（带阻尼的冲击位移）
    const dir = this.mesh.position.clone().sub(source.mesh.position).normalize();
    this._knock = this._knock || new THREE.Vector3();
    this._knock.addScaledVector(dir, 1.2);
    this.game.addShake(0.15);
    if (this.hp <= 0) this.die();
  }

  die() {
    if (this.dead) return;
    this.dead = true;
    this.game.sfx.play(this.type === 'ogre' ? 'monsterDeath' : 'monsterHit');
    // 死亡爆裂特效
    const pos = this.mesh.position.clone().add(new THREE.Vector3(0, 0.8, 0));
    this.game.sparkBurst(pos, TEMPLATES[this.type].color, 16, 6);
    this.game.addShake(0.4);
    // 掉落
    const roll = Math.random();
    const p = this.mesh.position;
    if (roll < 0.3) this.game.world.spawnDrop(new THREE.Vector3(p.x, 0, p.z), 'meat');
    else if (roll < 0.45) this.game.world.spawnDrop(new THREE.Vector3(p.x, 0, p.z), 'branch');
    else if (roll < 0.55) this.game.world.spawnDrop(new THREE.Vector3(p.x, 0, p.z), roll < 0.5 ? 'rock' : 'knife');
    this._dieT = 0.5;
  }

  update(dt, player) {
    if (this.dead) {
      if (this._dieT !== undefined) {
        this._dieT -= dt;
        this.mesh.scale.multiplyScalar(1 - dt * 2.5);
        this.mesh.rotation.y += dt * 6;
        if (this._dieT <= 0) {
          this.game.scene.remove(this.mesh);
          this.game.monsters.list.splice(this.game.monsters.list.indexOf(this), 1);
          this.game.monsters.kills++;
          this.game.monsters.score += TEMPLATES[this.type].score;
          this._removed = true;
          if (this.game.player.target === this) this.game.player.target = null;
        }
      }
      return;
    }

    const p = player.mesh.position;
    const pos = this.mesh.position;
    const dist = pos.distanceTo(p);

    // 呆滞（被先手打击硬直）：不追击、不攻击，身体摇晃表示眩晕
    if (this._stun > 0) {
      this._stun -= dt;
      this.mesh.rotation.z = Math.sin(performance.now() / 60) * 0.12;
      if (this._stun <= 0) this.mesh.rotation.z = 0;
    }

    // 玩家死亡后停止追击；呆滞中不行动
    if (!player._dead && this._stun <= 0) {
      if (dist > this.range) {
        const dir = p.clone().sub(pos).normalize();
        pos.addScaledVector(dir, this.speed * dt);
        this.mesh.rotation.y = Math.atan2(dir.x, dir.z);
      } else {
        this.attackTimer -= dt;
        if (this.attackTimer <= 0) {
          this.attackTimer = this.atkCd;
          this.attackAnim = 0.3;
          player.takeDamage(this.damage, this);
          this.game.sfx.play('monsterHit');
        }
      }
    }
    if (this.attackAnim > 0) this.attackAnim -= dt;

    // 击退冲量（阻尼衰减）
    if (this._knock && this._knock.lengthSq() > 0.0001) {
      pos.addScaledVector(this._knock, dt);
      this._knock.multiplyScalar(Math.max(0, 1 - dt * 8));
    }

    // 蝙蝠扇翅
    if (this.type === 'bat' && this.mesh.userData.wings) {
      const t = performance.now() / 100;
      this.mesh.userData.wings[0].rotation.z = Math.sin(t) * 0.6;
      this.mesh.userData.wings[1].rotation.z = -Math.sin(t) * 0.6;
      this.mesh.position.y = 0.8 + Math.sin(t * 0.7) * 0.2;
    } else {
      // 其他上下浮动
      this.mesh.position.y = Math.abs(Math.sin(performance.now() / 300 + this.bob)) * 0.15;
    }
  }
}

export class MonsterManager {
  constructor(game) {
    this.game = game;
    this.list = [];
    this.kills = 0;
    this.score = 0;
    this.spawnTimer = 0;
  }

  spawnInitial() {
    for (let i = 0; i < 8; i++) this.randomSpawn();
  }

  randomSpawn() {
    const player = this.game.player.mesh.position;
    const R = this.game.world.BOUNDS - 4;
    // 选权重模板
    const total = POOL.reduce((s, p) => s + p.weight, 0);
    let r = Math.random() * total;
    let tpl = POOL[0];
    for (const p of POOL) { r -= p.weight; if (r <= 0) { tpl = p; break; } }

    let x, z, tries = 0;
    do {
      const ang = Math.random() * Math.PI * 2;
      const dist = tpl.minDist + Math.random() * (tpl.maxDist - tpl.minDist);
      x = THREE.MathUtils.clamp(player.x + Math.cos(ang) * dist, -R, R);
      z = THREE.MathUtils.clamp(player.z + Math.sin(ang) * dist, -R, R);
      tries++;
    } while (Math.hypot(x - player.x, z - player.z) < tpl.minDist && tries < 10);

    const m = new Monster(this.game, tpl.type, new THREE.Vector3(x, 0, z));
    this.list.push(m);
  }

  update(dt) {
    const player = this.game.player;
    if (player._dead) return;

    // 保持怪物数量
    this.spawnTimer -= dt;
    const alive = this.list.filter(m => !m.dead).length;
    const target = Math.min(15, 6 + Math.floor(this.score / 100)); // 随分数提升
    if (alive < target && this.spawnTimer <= 0) {
      this.randomSpawn();
      this.spawnTimer = 3 + Math.random() * 4;
    }

    for (const m of this.list) m.update(dt, player);
  }
}
