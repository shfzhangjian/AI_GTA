/**
 * AgentBuilder —— 随机生成的行人与狗（城市“活物”），含完整受击反馈：
 *
 * - 行人：沿人行道线巡航，途经路口时偶尔横穿换边；腿/臂摆动动画。
 * - 狗：在草地与广场随机游走，目标点经碰撞采样（避开建筑/树/路灯）。
 * - bumpAt()：玩家走近/撞上时踉跄让开（人摇晃、狗弹跳逃开）。
 * - attack()：被挥拳命中 → 扣血 + 红闪 + 头顶血条 + 击退；血量归零被打倒，
 *   数秒后在远离玩家处满血复活；未打倒则立即转身朝反方向逃跑（panic）。
 * - 两两分离不穿模；每次刷新位置/配色/路线随机。
 * 模型均“面朝 +z”，朝向 = atan2(dir.x, dir.z)。
 */
import * as THREE from 'three';
import { PALETTE, WORLD } from '../config.js';
import { blockedCircle } from '../core/Collision.js';

const SKINS = [0xf1c27d, 0xe8b98a, 0xc68642];
const SHIRTS = [0xd94b41, 0x4a90d9, 0xf4c127, 0x3fb37f, 0x8e6fc0, 0xff8c5a, 0xf2f4f6];
const PANTS = [0x3a4552, 0x555c66, 0x6b5b4a, 0x2f3a46];
const DOG_COLORS = [0xb0793d, 0x8a8a8a, 0x5a4632, 0xd9c1a0];

const SW = WORLD.roadHalf + WORLD.walk / 2; // 人行道中心线：±8.5
const RADIUS = { human: 0.38, dog: 0.3 };   // 碰撞半径（米）
const BAR_Y = { human: 2.15, dog: 1.05 };   // 血条悬浮高度
const rand = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

const std = (color, opts = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.9, ...opts });

/* ---------------- 模型 ---------------- */

/** 小人：腿/臂用枢轴组实现前后摆动。返回 {group, parts:{pivots,opposite,mats}} */
function createHuman() {
  const g = new THREE.Group();
  const skin = std(pick(SKINS));
  const shirt = std(pick(SHIRTS));
  const pants = std(pick(PANTS));

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.56, 0.26), shirt);
  torso.position.y = 1.0;
  torso.castShadow = true;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.17, 8, 8), skin);
  head.position.y = 1.47;
  head.castShadow = true;
  g.add(torso, head);

  const parts = { pivots: [], mats: [shirt, skin] }; // mats：受击红闪材质
  const limb = (geo, mat, px, pivotY, meshY) => {
    const p = new THREE.Group();
    p.position.set(px, pivotY, 0);
    const m = new THREE.Mesh(geo, mat);
    m.position.y = meshY;
    m.castShadow = true;
    p.add(m);
    g.add(p);
    parts.pivots.push(p);
    return p;
  };
  const legGeo = new THREE.BoxGeometry(0.15, 0.72, 0.17);
  const armGeo = new THREE.BoxGeometry(0.11, 0.5, 0.13);
  limb(legGeo, pants, -0.11, 0.72, -0.36);
  limb(legGeo, pants, 0.11, 0.72, -0.36);
  limb(armGeo, shirt, -0.28, 1.24, -0.25);
  limb(armGeo, shirt, 0.28, 1.24, -0.25);
  parts.opposite = [1, -1, -1, 1]; // 腿与对侧臂同相（自然交叉步态）
  return { group: g, parts };
}

/** 小狗：四条腿交替摆动 + 尾巴 */
function createDog() {
  const g = new THREE.Group();
  const fur = std(pick(DOG_COLORS));
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.3, 0.62), fur);
  body.position.y = 0.44;
  body.castShadow = true;
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.24, 0.26), fur);
  head.position.set(0, 0.58, 0.38);
  head.castShadow = true;
  const snout = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.1, 0.14), std(0x3a2e22));
  snout.position.set(0, 0.52, 0.56);
  const tail = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.07, 0.24), fur);
  tail.position.set(0, 0.58, -0.38);
  tail.rotation.x = -0.6;
  g.add(body, head, snout, tail);

  const legs = [];
  const legGeo = new THREE.BoxGeometry(0.09, 0.3, 0.09);
  for (const [lx, lz] of [[-0.1, 0.2], [0.1, 0.2], [-0.1, -0.2], [0.1, -0.2]]) {
    const p = new THREE.Group();
    p.position.set(lx, 0.3, lz);
    const m = new THREE.Mesh(legGeo, fur);
    m.position.y = -0.15;
    p.add(m);
    g.add(p);
    legs.push(p);
  }
  return { group: g, parts: { pivots: legs, opposite: [1, -1, -1, 1], tail, mats: [fur] } };
}

/* ---------------- 采样工具 ---------------- */

/** 随机人行道点 */
function sidewalkPoint() {
  const side = Math.floor(Math.random() * 4);
  const along = rand(-58, 58);
  return side < 2 ? { x: (side ? SW : -SW), z: along } : { x: along, z: (side === 2 ? -SW : SW) };
}

/** 行人：沿人行道线走一段；在路口附近偶尔横穿到另一条人行道 */
function humanTarget(x, z) {
  const onV = Math.abs(Math.abs(x) - SW) < 2.5;
  const onH = Math.abs(Math.abs(z) - SW) < 2.5;
  if (onV && !(Math.abs(z) < 16 && Math.random() < 0.3)) {
    return { x: Math.sign(x || 1) * SW, z: clamp(z + rand(10, 34) * pick([-1, 1]), -58, 58) };
  }
  if (onH && !(Math.abs(x) < 16 && Math.random() < 0.3)) {
    return { x: clamp(x + rand(10, 34) * pick([-1, 1]), -58, 58), z: Math.sign(z || 1) * SW };
  }
  return sidewalkPoint();
}

/** 狗：在远离车道的开放区域采样无障碍目标点 */
function dogTarget(colliders) {
  for (let i = 0; i < 16; i++) {
    const x = rand(-58, 58);
    const z = rand(-58, 58);
    if (Math.abs(x) < 12 && Math.abs(z) < 12) continue; // 不在路口车道区
    if (!blockedCircle(colliders, x, z, 0.6)) return { x, z };
  }
  return sidewalkPoint();
}

/* ---------------- Agent 行为 ---------------- */

class Agent {
  constructor(model, scene, colliders, x, z, speed, targetFn, { kind = 'human' } = {}) {
    this.model = model;           // {group, parts}
    this.scene = scene;
    this.colliders = colliders;   // 障碍查询（踉跄/避障/逃跑采样共用）
    this.kind = kind;             // 'human' | 'dog'
    this.radius = RADIUS[kind];
    this.mats = model.parts.mats; // 受击红闪材质
    this.x = x;
    this.z = z;
    this.speed = speed;
    this.targetFn = targetFn;
    this.target = targetFn(x, z);
    this.angle = rand(-Math.PI, Math.PI);
    this.phase = rand(0, 6.28);   // 步态相位（错开，避免整齐正步走）
    this.clock = rand(0, 10);     // 本地时钟（摇晃/尾巴动画）
    this.wait = 0;
    this.stumbleT = 0;            // >0：被撞踉跄剩余时间
    this.sx = 0; this.sz = 0; this.power = 0; // 踉跄方向与力度

    // —— 战斗状态 ——
    this.hp = 100;
    this.panicT = 0;              // >0：恐慌逃跑剩余时间
    this.flashT = 0;              // 受击红闪剩余时间
    this.barT = 0;                // 血条可见剩余时间
    this.downT = 0;               // >0：被打倒躺地剩余时间
    this.fallDir = 1;
    this.threatX = 0; this.threatZ = 0;
    this.bar = null;              // 血条精灵（首次受击时创建）
    this._lastPlayer = null;

    model.group.position.set(x, WORLD.surfGrass, z);
    model.group.scale.setScalar(rand(0.9, 1.12));
  }

  /* —— 血条 —— */
  _ensureBar() {
    if (this.bar) return;
    const bg = new THREE.Sprite(new THREE.SpriteMaterial({
      color: 0x1c2128, transparent: true, opacity: 0.75, depthTest: false,
    }));
    bg.scale.set(0.76, 0.11, 1);
    const fg = new THREE.Sprite(new THREE.SpriteMaterial({
      color: 0x35d07f, transparent: true, opacity: 0.95, depthTest: false,
    }));
    fg.scale.set(0.68, 0.06, 1);
    this.bar = { bg, fg };
    this.scene.add(bg, fg);
  }

  _updateBar(dt) {
    if (!this.bar) return;
    this.barT -= dt;
    const vis = this.barT > 0 && this.downT <= 0;
    this.bar.bg.visible = vis;
    this.bar.fg.visible = vis;
    if (!vis) return;
    const y = WORLD.surfGrass + BAR_Y[this.kind];
    this.bar.bg.position.set(this.x, y, this.z);
    const ratio = Math.max(0, this.hp / 100);
    const w = 0.68 * ratio;
    this.bar.fg.scale.x = w;
    this.bar.fg.position.set(this.x - (0.68 - w) / 2, y, this.z);
    this.bar.fg.material.color.setHex(ratio > 0.6 ? 0x35d07f : ratio > 0.3 ? 0xf4a127 : 0xe23b3b);
  }

  /* —— 受击 —— */
  takeHit(fromX, fromZ, dmg = 34) {
    if (this.downT > 0) return;
    this.hp -= dmg;
    this.flashT = 0.3;
    this.barT = 3.2;
    this._ensureBar();
    this.threatX = fromX;
    this.threatZ = fromZ;

    let dx = this.x - fromX;
    let dz = this.z - fromZ;
    const d = Math.hypot(dx, dz) || 1;
    dx /= d; dz /= d;

    if (this.hp <= 0) {           // 破坏效果：打倒躺地，稍后远离玩家处满血复活
      this.downT = 4;
      this.fallDir = Math.random() < 0.5 ? 1 : -1;
      this.stumbleT = 0;
      this.barT = 0;              // 隐藏血条
      return;
    }
    this.stumble(dx, dz, 2.6);    // 击退踉跄
    this.panicT = rand(4, 7);     // 随后立即转身逃跑
  }

  /** 恐慌目标：背向威胁源、避开障碍的落点 */
  _fleeTarget() {
    let ax = this.x - this.threatX;
    let az = this.z - this.threatZ;
    const d = Math.hypot(ax, az) || 1;
    ax /= d; az /= d;
    for (let i = 0; i < 8; i++) {
      const rot = rand(-0.9, 0.9);
      const ca = Math.cos(rot), sa = Math.sin(rot);
      const dirx = ax * ca - az * sa;
      const dirz = ax * sa + az * ca;
      const p = {
        x: clamp(this.x + dirx * rand(14, 26), -58, 58),
        z: clamp(this.z + dirz * rand(14, 26), -58, 58),
      };
      if (!blockedCircle(this.colliders, p.x, p.z, 0.7)) return p;
    }
    return this.kind === 'dog' ? dogTarget(this.colliders) : humanTarget(this.x, this.z);
  }

  /** 被打倒后复活：远离玩家的随机安全点 */
  _revive() {
    for (let i = 0; i < 12; i++) {
      const p = this.kind === 'dog' ? dogTarget(this.colliders) : sidewalkPoint();
      if (!this._lastPlayer || Math.hypot(p.x - this._lastPlayer.x, p.z - this._lastPlayer.z) > 14) {
        this.x = p.x; this.z = p.z;
        break;
      }
    }
    this.hp = 100;
    this.model.group.rotation.z = 0;
    this.target = this.targetFn(this.x, this.z);
    this.wait = rand(0.5, 2);
  }

  /** 被撞：朝 (nx,nz) 反冲并摇晃；狗弹得更远更夸张 */
  stumble(nx, nz, power) {
    this.stumbleT = 0.55 + Math.random() * 0.35;
    this.sx = nx; this.sz = nz;
    this.power = power;
    this.angle = Math.atan2(nx, nz); // 顺势背向来撞者
    this.wait = 0;
  }

  update(dt, playerPos) {
    const m = this.model;
    this.clock += dt;
    if (playerPos) this._lastPlayer = playerPos;

    // 受击红闪衰减
    if (this.flashT > 0) {
      this.flashT -= dt;
      const k = Math.max(0, this.flashT / 0.3) * 0.85;
      for (const mat of this.mats) mat.emissive.setRGB(k, 0, 0);
    }
    this._updateBar(dt);

    /* —— 被打倒：躺地 —— */
    if (this.downT > 0) {
      this.downT -= dt;
      const want = this.fallDir * 1.5; // 侧倒
      m.group.rotation.z += (want - m.group.rotation.z) * Math.min(1, dt * 8);
      if (this.downT <= 0) this._revive();
      return;
    }

    /* —— 恐慌计时 —— */
    if (this.panicT > 0) this.panicT -= dt;

    /* —— 被撞踉跄状态 —— */
    if (this.stumbleT > 0) {
      this.stumbleT -= dt;
      const sp = this.power * Math.max(0, this.stumbleT) * 2.2; // 衰减冲量
      const nxp = this.x + this.sx * sp * dt;
      const nzp = this.z + this.sz * sp * dt;
      if (Math.abs(nxp) <= 61 && Math.abs(nzp) <= 61 &&
          !blockedCircle(this.colliders, nxp, nzp, this.radius)) {
        this.x = nxp; this.z = nzp;
      } else {
        this.stumbleT = 0; // 撞墙即停，不穿模
      }
      m.group.position.set(this.x, WORLD.surfGrass, this.z);
      if (this.kind === 'dog') { // 狗：小跳 + 尾巴狂摆
        m.group.position.y += Math.abs(Math.sin(this.clock * 18)) * 0.06 * Math.min(1, this.stumbleT * 2.5);
        m.parts.tail.rotation.x = -0.6 + Math.sin(this.clock * 24) * 0.4;
      }
      m.group.rotation.y = this.angle;
      m.group.rotation.z = Math.sin(this.clock * 26) * 0.14 * Math.min(1, this.stumbleT * 3); // 摇晃
      m.parts.pivots.forEach((p) => (p.rotation.x = 0));
      return;
    }
    m.group.rotation.z = 0;

    /* —— 驻足（张望/嗅闻）—— */
    if (this.wait > 0) {
      this.wait -= dt;
      m.parts.pivots.forEach((p) => (p.rotation.x = 0));
      if (this.kind === 'dog') m.parts.tail.rotation.x = -0.6 + Math.sin(this.clock * 9) * 0.3;
      return;
    }

    /* —— 漫步/逃跑 —— */
    const panic = this.panicT > 0;
    let dx = this.target.x - this.x;
    let dz = this.target.z - this.z;
    const dist = Math.hypot(dx, dz);
    if (dist < 0.8) {              // 到达：恐慌则继续逃，否则歇一会儿再选目标
      this.target = panic ? this._fleeTarget() : this.targetFn(this.x, this.z);
      if (!panic) this.wait = rand(0.6, 3.2);
      return;
    }
    dx /= dist; dz /= dist;
    const speed = this.speed * (panic ? 2.1 : 1); // 逃跑狂奔
    const nx = this.x + dx * speed * dt;
    const nz = this.z + dz * speed * dt;
    if (blockedCircle(this.colliders, nx, nz, 0.35)) {
      this.target = panic ? this._fleeTarget() : this.targetFn(this.x, this.z); // 障碍改道
      return;
    }
    this.x = nx;
    this.z = nz;

    // 平滑转向（最短弧）
    const want = Math.atan2(dx, dz);
    let diff = want - this.angle;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    this.angle += diff * Math.min(1, dt * (panic ? 10 : 6));

    // 步态动画：腿臂交替摆动
    this.phase += dt * (panic ? 12 : 7.5);
    const swing = Math.sin(this.phase) * (panic ? 0.7 : 0.55);
    m.parts.pivots.forEach((p, i) => (p.rotation.x = swing * m.parts.opposite[i]));
    if (this.kind === 'dog') m.parts.tail.rotation.x = -0.6 + Math.sin(this.clock * 10) * 0.28;

    m.group.position.set(this.x, WORLD.surfGrass, this.z);
    m.group.rotation.y = this.angle;
  }
}

/**
 * 在场景中生成随机行人和狗。需在碰撞体汇总之后调用。
 * @returns {{update:(dt:number,playerPos?:{x,z})=>void, bumpAt:(x,z,r)=>boolean,
 *            attack:(x,z,dx,dz)=>boolean, list:Agent[], count:number}}
 */
export function buildAgents(scene, colliders, { humans = 14, dogs = 7 } = {}) {
  const agents = [];

  for (let i = 0; i < humans; i++) {
    const p = sidewalkPoint();
    agents.push(new Agent(createHuman(), scene, colliders, p.x, p.z, rand(1.1, 1.9), humanTarget,
      { kind: 'human' }));
  }
  for (let i = 0; i < dogs; i++) {
    const p = dogTarget(colliders);
    agents.push(new Agent(createDog(), scene, colliders, p.x, p.z, rand(2.0, 3.2),
      () => dogTarget(colliders), { kind: 'dog' }));
  }

  const group = new THREE.Group();
  agents.forEach((a) => group.add(a.model.group));
  scene.add(group);

  return {
    count: agents.length,
    list: agents, // 供车流刹车避让 / 小地图 / 玩家碰撞读取

    /** 玩家位置与所有活物做圆碰撞：重叠者被撞得踉跄让开 */
    bumpAt(x, z, r) {
      let hit = false;
      for (const a of agents) {
        if (a.downT > 0) continue;
        const dx = a.x - x;
        const dz = a.z - z;
        const d = Math.hypot(dx, dz);
        if (d < r + a.radius + 0.12) {
          hit = true;
          if (a.stumbleT <= 0 && a.panicT <= 0) { // 正在逃的人不再被推
            if (d > 1e-4) a.stumble(dx / d, dz / d, a.kind === 'dog' ? 3.4 : 1.9);
            else a.stumble(Math.random() * 2 - 1, Math.random() * 2 - 1, 2.2);
          }
        }
      }
      return hit;
    },

    /**
     * 近战/锥形命中判定：以 (x,z) 为原点、(dx,dz) 为朝向，扇区内所有活物受击。
     * @param {{dmg?:number, range?:number, arc?:number}} opts arc=夹角余弦阈值
     * @returns {{hits:number, x:number, z:number}} 命中数量与最后一名受害者位置（报案用）
     */
    attack(x, z, dx, dz, opts = {}) {
      const { dmg = 34, range = 1.6, arc = 0.8 } = opts;
      const L = Math.hypot(dx, dz) || 1;
      dx /= L; dz /= L;
      let hits = 0;
      let lastX = x; let lastZ = z;
      for (const a of agents) {
        if (a.downT > 0) continue;
        const rx = a.x - x;
        const rz = a.z - z;
        const d = Math.hypot(rx, rz);
        if (d < 0.05 || d > range + a.radius) continue;
        const dot = (rx * dx + rz * dz) / d; // 与朝向夹角余弦
        if (dot > arc) {
          a.takeHit(x, z, dmg);
          hits++;
          lastX = a.x; lastZ = a.z;
        }
      }
      return { hits, x: lastX, z: lastZ };
    },

    /**
     * 爆炸范围伤害：距离线性衰减（保底 25），波及圈内受击、圈缘恐慌逃散。
     * @returns {number} 直接受击数量
     */
    explodeAt(x, z, radius = 6, maxDmg = 100) {
      let hits = 0;
      for (const a of agents) {
        if (a.downT > 0) continue;
        const d = Math.hypot(a.x - x, a.z - z);
        if (d < radius) {
          a.takeHit(x, z, Math.max(25, maxDmg * (1 - d / radius)));
          hits++;
        } else if (d < radius * 1.8 && a.panicT <= 0) { // 波及圈：立刻恐慌逃散
          a.threatX = x;
          a.threatZ = z;
          a.panicT = rand(3, 5);
          a.target = a._fleeTarget();
        }
      }
      return hits;
    },

    update(dt, playerPos) {
      for (const a of agents) a.update(dt, playerPos);

      // 两两分离：活物之间不穿模（n=21，O(n²) 开销可忽略）
      for (let i = 0; i < agents.length; i++) {
        for (let j = i + 1; j < agents.length; j++) {
          const a = agents[i];
          const b = agents[j];
          if (a.downT > 0 || b.downT > 0) continue;
          let dx = b.x - a.x;
          let dz = b.z - a.z;
          const d = Math.hypot(dx, dz);
          const min = a.radius + b.radius;
          if (d < min && d > 1e-4) {
            const push = (min - d) / 2;
            dx /= d; dz /= d;
            a.x -= dx * push; a.z -= dz * push;
            b.x += dx * push; b.z += dz * push;
          }
        }
      }
    },
  };
}
