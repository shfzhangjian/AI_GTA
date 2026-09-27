// Sketch Wave Racer — 道具系统（Phase 5）
// 九种箱内道具 + 连续星星：Speed / Missile / Bubble / Shield / Wave / Turbo / Lightning / Giant / Bomb。
//
// 原则（同 TrackFeatures：数据与可视化分离）：
//   本模块只管**判定与规则**（拾取、使用、飞行、命中、防御）；
//   网格在 ItemView.js。所有几何判定用世界坐标距离，与 RaceState 判定一样
//   与帧率解耦（导弹位移按 dt 积分、命中判定"经过即中"用半径 + 扫掠检查）。
//
// 防御规则（统一入口 applyHit）：
//   - 护盾：命中前若有 shield>0 → 挡下（消耗护盾），不结算命中效果。
//   - 气泡里的船不成为导弹/水波目标（困住即免撞，防连坐）。
//
// 主循环顺序约定（main.js / 测试）：
//   items.update(dt)（推进飞行体、结算命中/拾取）→ race.update(dt)

import * as THREE from "three";
import { CONFIG } from "../config.js";

export const ITEM_TYPES = ["speed", "missile", "bubble", "shield", "wave", "turbo", "lightning", "giant", "bomb"];

// 均匀权重随机（确定性：可注入 rng 便于测试）
function pickType(rng = Math.random) {
  const w = CONFIG.items.weights;
  const pool = ITEM_TYPES.flatMap((k) => Array(Math.round(w[k]) || 0).fill(k));
  return pool[Math.floor(rng() * pool.length) % pool.length];
}

export class ItemSystem {
  /**
   * @param {Track} track
   * @param {RaceState} race
   * @param {{rng?:()=>number, onEvent?:(ev:object)=>void}} opts
   */
  constructor(track, race, opts = {}) {
    this.track = track;
    this.race = race;
    this.rng = opts.rng || Math.random;
    this.onEvent = opts.onEvent || (() => {});

    this.boxes = [];
    this._buildBoxes();

    /** 活跃飞行体：missile | bubble */
    this.projectiles = [];
    /** 连续星星：落后选手前方随机生成，即时拾取加速 */
    this.stars = [];
    this._starId = 0;
    const SI = CONFIG.items.stars?.spawnInterval || [7, 11];
    this._starTimer = SI[0] + this.rng() * Math.max(0, SI[1] - SI[0]);
    /** 一次性视觉效果（冲击波环等）：{type, pos, age, life} */
    this.effects = [];

    this.log = []; // 结构化事件（测试断言用）：{type:'pickup'|'use'|'hit'|'block'|'trap', ...}
  }

  rebuild(track = this.track) {
    this.track = track;
    this._buildBoxes();
    this.reset();
    return this;
  }

  _buildBoxes() {
    const C = CONFIG.items;
    // ---- 道具箱：每个赛道位横向生成一排（中心、左、右），便于多人抢线拾取。
    this.boxes = [];
    let boxIndex = 0;
    const lanes = C.boxes.lanes || [0];
    for (const [row, t] of C.boxes.ts.entries()) {
      const p = this.track.pointAt(t);
      const tan = this.track.tangentAt(t);
      for (const lane of lanes) {
        this.boxes.push({
          index: boxIndex++, row, lane, t,
          pos: new THREE.Vector3(p.x + -tan.z * lane, 0.25, p.z + tan.x * lane),
          radius: C.boxes.radius,
          respawn: 0,            // >0 = 冷却中（剩余秒）
          cooldown: C.boxes.respawn,
          type: pickType(this.rng),
        });
      }
    }
  }

  // ---- 新一局重开（main.resetRace 调用）：清飞行体/视觉效果/事件日志，
  // 道具箱冷却清零并重随机到货；全船存货清空（setPose 不清 item——由这里统一收口）
  reset() {
    this.projectiles = [];
    this.stars = [];
    this.effects = [];
    this.log = [];
    const SI = CONFIG.items.stars?.spawnInterval || [7, 11];
    this._starTimer = SI[0] + this.rng() * Math.max(0, SI[1] - SI[0]);
    for (const b of this.boxes) {
      b.respawn = 0;
      b.type = pickType(this.rng);
    }
    for (const e of this.race.entries) {
      const b = e.boat;
      b.item = null; b.shield = 0; b.trapped = 0;
      b.itemSpeed = 0; b.turboLeft = 0; b._trappedFrom = 0;
      b.starBoostLeft = 0; b.lightningSlow = 0;
      b.giantTime = 0; b.giantShrink = 0; b.giantScale = 1;
      if (b.view?.setItemScale) b.view.setItemScale(1);
    }
  }

  // ---- 发放（主循环每帧调用；在全体 boat.update 之后、race.update 之前）
  update(dt) {
    this._updateStars(dt);
    this._updateBoxes(dt);
    this._updateProjectiles(dt);
    this._updateEffects(dt);
  }

  // ---- 拾取：船进入道具箱半径（空中船拾不到——跳台飞过时不白捡）
  _updateBoxes(dt) {
    for (const box of this.boxes) {
      if (box.respawn > 0) { box.respawn -= dt; continue; }
      for (const e of this.race.entries) {
        if (e.finished) continue;
        const b = e.boat;
        if (b.airborne || b.trapped > 0) continue;
        if (b.item) continue; // 已有存货不抢箱（也防止一箱被两船同帧分食）
        const d = Math.hypot(box.pos.x - b.position.x, box.pos.z - b.position.z);
        if (d <= box.radius + CONFIG.trackFeatures.colliderRadius) {
          b.item = box.type;
          box.type = pickType(this.rng); // 刷新成随机新货
          box.respawn = box.cooldown;
          this._emit({ type: "pickup", racerId: e.id, item: b.item });
          break; // 一箱一帧最多一人
        }
      }
    }
  }

  // ---- 连续星星：落后选手前方 3~5 颗，拾到每颗延长 +2s 加速。
  _updateStars(dt) {
    const C = CONFIG.items.stars;
    if (!C) return;
    for (const s of this.stars) {
      if (!s.alive) continue;
      s.age += dt;
      if (s.age >= s.life) { s.alive = false; continue; }
      for (const e of this.race.entries) {
        if (e.finished) continue;
        const b = e.boat;
        if (b.airborne || b.trapped > 0) continue;
        const d = Math.hypot(s.x - b.position.x, s.z - b.position.z);
        if (d > s.radius + CONFIG.trackFeatures.colliderRadius) continue;
        s.alive = false;
        b.starBoostLeft = Math.min(C.maxDuration, (b.starBoostLeft || 0) + C.boostDuration);
        b.lastEvent = "itemstar";
        this._emit({ type: "pickup", racerId: e.id, item: "star", boostTime: b.starBoostLeft });
        break;
      }
    }
    this.stars = this.stars.filter((s) => s.alive);

    const raceLive = this.race.started !== false && this.race.phase !== "over";
    if (!raceLive || this.race.entries.length < 2) return;
    this._starTimer -= dt;
    if (this._starTimer > 0) return;
    const SI = C.spawnInterval || [7, 11];
    this._starTimer = SI[0] + this.rng() * Math.max(0, SI[1] - SI[0]);
    if (this.rng() > C.chance) return;
    const lagging = this._laggingEntries();
    if (!lagging.length) return;
    const target = lagging[Math.floor(this.rng() * lagging.length) % lagging.length];
    this._spawnStarChain(target);
  }

  _spawnStarChain(entry, count = null) {
    const C = CONFIG.items.stars;
    if (!entry || !C) return [];
    const n = count ?? (C.chainMin + Math.floor(this.rng() * (C.chainMax - C.chainMin + 1)));
    const near = this.track.nearest(entry.boat.position.x, entry.boat.position.z);
    const ahead = C.aheadMin + this.rng() * Math.max(0, C.aheadMax - C.aheadMin);
    const made = [];
    for (let i = 0; i < n; i++) {
      const arc = near.arc + ahead + i * C.spacing;
      const t = (((arc / this.track.length) % 1) + 1) % 1;
      const p = this.track.pointAt(t);
      const tan = this.track.tangentAt(t);
      const side = ((i % 2 === 0 ? -0.5 : 0.5) + (this.rng() - 0.5) * 0.35) * (C.lateral || 0);
      const s = {
        id: ++this._starId,
        targetId: entry.id,
        x: p.x + -tan.z * side,
        z: p.z + tan.x * side,
        y: 0.8,
        arc: ((arc % this.track.length) + this.track.length) % this.track.length,
        radius: C.radius,
        age: 0,
        life: C.life,
        alive: true,
      };
      this.stars.push(s);
      made.push(s);
    }
    this._emit({ type: "spawn", item: "star", target: entry.id, count: made.length });
    return made;
  }

  _laggingEntries() {
    const live = this.race.entries.filter((e) => !e.finished);
    if (live.length < 2) return [];
    const sorted = [...live].sort((a, b) => this._raceProgress(b) - this._raceProgress(a));
    const leader = sorted[0];
    return sorted.filter((e) => e.id !== leader.id && (e.place > 1 || this._raceProgress(e) < this._raceProgress(leader) - 0.01));
  }

  _raceProgress(e) {
    if (Number.isFinite(e.total) && e.total > 0) return e.total;
    const n = this.track.nearest(e.boat.position.x, e.boat.position.z);
    return n.arc / this.track.length;
  }

  _isAheadOf(base, other) {
    if (other.finished) return true;
    const a = this._raceProgress(base);
    const b = this._raceProgress(other);
    if (Math.abs(b - a) > 0.0001) return b > a;
    return (other.place || Infinity) < (base.place || Infinity);
  }

  _pickAheadTarget(entry) {
    const C = CONFIG.items.bubble;
    const live = this.race.entries.filter((o) => {
      if (o.id === entry.id || o.finished) return false;
      if (!this._isAheadOf(entry, o)) return false;
      const d = this._arcDelta(entry, o);
      return d >= (C.targetMinAhead ?? 0) && d <= (C.targetMaxAhead ?? 70);
    });
    if (!live.length) return null;
    return live[Math.floor(this.rng() * live.length) % live.length];
  }

  _arcDelta(base, other) {
    const a = this.track.nearest(base.boat.position.x, base.boat.position.z).arc;
    const b = this.track.nearest(other.boat.position.x, other.boat.position.z).arc;
    return ((b - a) % this.track.length + this.track.length) % this.track.length;
  }

  // ---- 使用（Space / AI 决策调用）。返回 true = 消耗了存货。
  // opts.drop=true：炸弹原地放下；默认炸弹向前投掷。
  use(id, opts = {}) {
    const e = this.race.entryOf(id);
    if (!e || e.finished) return false;
    const b = e.boat;
    if (!b.item || b.trapped > 0) return false;
    const type = b.item;
    b.item = null;
    const fwd = { x: -Math.sin(b.heading), z: -Math.cos(b.heading) };
    switch (type) {
      case "speed":
        b.itemSpeed += CONFIG.items.speed.speedAdd;
        b.lastEvent = "itemspeed";
        break;
      case "turbo":
        b.itemSpeed += CONFIG.items.turbo.speedAdd;
        b.turboLeft = CONFIG.items.turbo.duration;
        b.lastEvent = "itemturbo";
        break;
      case "lightning": {
        const C = CONFIG.items.lightning;
        const hits = [];
        for (const o of this.race.entries) {
          if (o.id === id || o.finished) continue;
          if (!this._isAheadOf(e, o)) continue;
          const ob = o.boat;
          if (ob.trapped > 0) continue;
          if (this._blockByShield(ob, id, "lightning")) continue;
          ob.lightningSlow = Math.max(ob.lightningSlow || 0, C.duration);
          ob.lastEvent = "hitlightning";
          hits.push(o.id);
          this._emit({ type: "hit", weapon: "lightning", from: id, target: o.id });
        }
        this.effects.push({ type: "lightning", targets: hits, age: 0, life: C.duration });
        b.lastEvent = "itemlightning";
        break;
      }
      case "giant":
        b.giantTime = CONFIG.items.giant.duration;
        b.giantShrink = 0;
        b.giantScale = CONFIG.items.giant.scale;
        if (b.view?.setItemScale) b.view.setItemScale(b.giantScale);
        b.lastEvent = "itemgiant";
        break;
      case "shield":
        b.shield = CONFIG.items.shield.duration;
        b.lastEvent = "itemshield";
        break;
      case "missile":
        this.projectiles.push({
          kind: "missile", owner: id,
          x: b.position.x + fwd.x * 2.2, z: b.position.z + fwd.z * 2.2,
          dx: fwd.x, dz: fwd.z, speed: CONFIG.items.missile.speed,
          travelled: 0, alive: true, age: 0,
        });
        b.lastEvent = "itemmissile";
        break;
      case "bubble":
        this.projectiles.push({
          kind: "bubble", owner: id,
          x: b.position.x + fwd.x * 2.2, z: b.position.z + fwd.z * 2.2,
          dx: fwd.x, dz: fwd.z, speed: CONFIG.items.bubble.speed,
          travelled: 0, alive: true, age: 0,
          target: this._pickAheadTarget(e)?.id || null,
        });
        b.lastEvent = "itembubble";
        break;
      case "bomb": {
        const C = CONFIG.items.bomb;
        const drop = !!opts.drop;
        this.projectiles.push({
          kind: "bomb", owner: id,
          x: b.position.x + fwd.x * (drop ? -2.4 : 2.2),
          z: b.position.z + fwd.z * (drop ? -2.4 : 2.2),
          dx: fwd.x, dz: fwd.z,
          speed: drop ? 0 : C.throwSpeed,
          travelled: 0, alive: true, age: 0, fuse: C.fuse,
          mode: drop ? "drop" : "throw",
        });
        b.lastEvent = drop ? "itembombdrop" : "itembomb";
        break;
      }
      case "wave": {
        const C = CONFIG.items.wave;
        const hits = [];
        for (const o of this.race.entries) {
          if (o.id === id || o.finished) continue;
          const ob = o.boat;
          if (ob.trapped > 0) continue;
          const d = Math.hypot(ob.position.x - b.position.x, ob.position.z - b.position.z);
          if (d > C.radius) continue;
          if (this._blockByShield(ob, id, "wave")) continue;
          // 径向推离 + 掉速
          const nx = d < 0.01 ? 1 : (ob.position.x - b.position.x) / d;
          const nz = d < 0.01 ? 0 : (ob.position.z - b.position.z) / d;
          const push = Math.max(0, 1 - d / C.radius) * C.push;
          ob.speed = Math.max(0, ob.speed * C.slowKeep);
          // 世界系推离（位置级：把目标沿径向推出）
          ob.position.x += nx * push * 0.35;
          ob.position.z += nz * push * 0.35;
          hits.push(o.id);
          this._emit({ type: "hit", weapon: "wave", from: id, target: o.id });
        }
        this.effects.push({ type: "wave", x: b.position.x, z: b.position.z, age: 0, life: 0.8 });
        b.lastEvent = "itemwave";
        if (hits.length) b.lastEvent = "itemwave";
        break;
      }
      default:
        return false;
    }
    this._emit({ type: "use", racerId: id, item: type });
    return true;
  }

  // ---- 飞行体推进 + 命中
  _updateProjectiles(dt) {
    const entries = this.race.entries;
    for (const p of this.projectiles) {
      if (!p.alive) continue;
      p.age += dt;
      if (p.kind === "bomb") {
        const h = p.speed * dt;
        if (h > 0) {
          p.x += p.dx * h; p.z += p.dz * h;
          p.travelled += h;
          p.speed *= Math.exp(-1.5 * dt);
          if (p.travelled >= CONFIG.items.bomb.throwRange) p.speed = 0;
        }
        if (p.age >= (p.fuse ?? CONFIG.items.bomb.fuse)) {
          this._explodeBomb(p);
          p.alive = false;
        }
        continue;
      }
      if (p.kind === "bubble") this._steerBubble(p, dt);
      const step = p.speed * dt;
      // 扫掠：分 2 半步检查，防高速穿人（帧率解耦）
      for (let half = 0; half < 2; half++) {
        const h = step / 2;
        p.x += p.dx * h; p.z += p.dz * h;
        p.travelled += h;
        if (!p.alive) break;
        const range = p.kind === "bubble" ? CONFIG.items.bubble.range : CONFIG.items.missile.range;
        if (p.travelled >= range) { p.alive = false; break; }
        // 目标：非主人、非完赛、非气泡内、非空中
        for (const e of entries) {
          if (e.id === p.owner || e.finished) continue;
          const ob = e.boat;
          if (ob.trapped > 0 || ob.airborne) continue;
          const d = Math.hypot(ob.position.x - p.x, ob.position.z - p.z);
          const hitR = p.kind === "bubble" ? CONFIG.items.bubble.radius : CONFIG.items.missile.radius;
          if (d > hitR) continue;
          // 命中！
          p.alive = false;
          if (this._blockByShield(ob, p.owner, p.kind)) break;
          if (p.kind === "missile") {
            // 命中：大幅掉速 + 甩横向
            ob.speed = Math.max(1.5, ob.speed * CONFIG.items.missile.slowKeep);
            ob.lateral += (this.rng() < 0.5 ? -1 : 1) * 3.5;
            ob.lastEvent = "hitmissile";
            this._pushExplosionEffect(p.x, p.z, 5.5, 0x3a86ff, 0.55);
          } else {
            // 气泡陷阱：困住漂浮
            ob.trapped = CONFIG.items.bubble.floatTime;
            ob._trappedFrom = ob.speed;
            ob.speed *= CONFIG.items.trap.slowKeep;
            ob.lastEvent = "hitbubble";
            this._pushExplosionEffect(p.x, p.z, 6.5, 0x9be8ff, 0.65);
          }
          this._emit({ type: "hit", weapon: p.kind, from: p.owner, target: e.id });
          break;
        }
      }
    }
    this.projectiles = this.projectiles.filter((p) => p.alive && p.age < 8);
  }

  _steerBubble(p, dt) {
    const tgt = p.target ? this.race.entryOf(p.target) : null;
    if (!tgt || tgt.finished || tgt.boat.trapped > 0) return;
    const vx = tgt.boat.position.x - p.x;
    const vz = tgt.boat.position.z - p.z;
    const len = Math.hypot(vx, vz);
    if (len < 0.001) return;
    const tx = vx / len, tz = vz / len;
    const k = Math.min(1, (CONFIG.items.bubble.homing || 0) * dt);
    let nx = p.dx * (1 - k) + tx * k;
    let nz = p.dz * (1 - k) + tz * k;
    const n = Math.hypot(nx, nz) || 1;
    p.dx = nx / n;
    p.dz = nz / n;
  }

  _explodeBomb(p) {
    const C = CONFIG.items.bomb;
    const hits = [];
    for (const e of this.race.entries) {
      if (e.id === p.owner || e.finished) continue;
      const ob = e.boat;
      if (ob.airborne || ob.trapped > 0) continue;
      const d = Math.hypot(ob.position.x - p.x, ob.position.z - p.z);
      if (d > C.radius) continue;
      if (this._blockByShield(ob, p.owner, "bomb")) continue;
      const falloff = Math.max(0, 1 - d / C.radius);
      const nx = d < 0.01 ? 1 : (ob.position.x - p.x) / d;
      const nz = d < 0.01 ? 0 : (ob.position.z - p.z) / d;
      ob.speed = Math.max(1.0, ob.speed * C.slowKeep);
      ob.lateral += (this.rng() < 0.5 ? -1 : 1) * (2.5 + 3.5 * falloff);
      ob.position.x += nx * C.push * falloff * 0.35;
      ob.position.z += nz * C.push * falloff * 0.35;
      ob.lastEvent = "hitbomb";
      hits.push(e.id);
      this._emit({ type: "hit", weapon: "bomb", from: p.owner, target: e.id });
    }
    this._pushExplosionEffect(p.x, p.z, C.radius, 0xff6b2c, 0.75);
    this._emit({ type: "explode", weapon: "bomb", from: p.owner, targets: hits });
  }

  _pushExplosionEffect(x, z, radius, color, life = 0.6) {
    this.effects.push({ type: "explosion", x, z, radius, color, age: 0, life });
  }

  // 护盾挡下 = true（消耗护盾）。命中方事件记 block。
  _blockByShield(boat, from, kind) {
    if (boat.shield > 0) {
      boat.shield = 0;
      boat.lastEvent = "shieldblock";
      const tgt = this.race.entries.find((x) => x.boat === boat);
      this._emit({ type: "block", weapon: kind, from, target: tgt ? tgt.id : "?", via: "shield" });
      return true;
    }
    return false;
  }

  _updateEffects(dt) {
    for (const fx of this.effects) fx.age += dt;
    this.effects = this.effects.filter((fx) => fx.age < fx.life);
  }

  _emit(ev) {
    this.log.push({ ...ev, t: this.race.time });
    if (this.log.length > 200) this.log.shift();
    this.onEvent(ev);
  }

  // ---- AI 道具决策（RaceState.updateAi 尾部调用，entry.ai 在场时）。
  // 简化策略（Phase 5 设计内）：
  //   missile：正前方 6..45m 弧长内有船 → 开火
  //   bubble ：前方有船 → 发追踪泡
  //   shield ：刚被撞/最近 2s 内挨过打 → 立刻开盾；否则攒着
  //   speed/turbo/wave：拿到就用（延迟 useDelay 拍）
  aiThink(dt, e, arcOf) {
    const b = e.boat;
    if (!b.item || b.trapped > 0 || b.airborne) { e.ai.itemWait = 0; return; }
    e.ai.itemWait = (e.ai.itemWait || 0) + dt;
    const C = CONFIG.items.ai;
    const delay = C.useDelay[0] + (1 - e.ai.skill) * (C.useDelay[1] - C.useDelay[0]);
    if (e.ai.itemWait < delay) return;
    const myArc = arcOf(b.position);
    if (myArc === null) return;
    const L = this.track.length;
    const ahead = (id) => {
      const a = arcOf(this.race.entryOf(id).boat.position);
      if (a === null) return null;
      let d = a - myArc;
      d = ((d % L) + L) % L;
      if (d > L / 2) d -= L; // 负 = 身后
      return d;
    };
    let fire = false;
    switch (b.item) {
      case "missile": {
        for (const o of this.race.entries) {
          if (o.id === e.id) continue;
          const d = ahead(o.id);
          if (d !== null && d >= C.missileMinAhead && d <= C.missileMaxAhead) { fire = true; break; }
        }
        break;
      }
      case "bubble": {
        for (const o of this.race.entries) {
          if (o.id === e.id) continue;
          const d = ahead(o.id);
          if (d !== null && d >= CONFIG.items.bubble.targetMinAhead && d <= CONFIG.items.bubble.targetMaxAhead) { fire = true; break; }
        }
        break;
      }
      case "shield":
        fire = C.shieldWhenHit && this._recentHitAgainst(e.id);
        break;
      case "wave":
        // 音爆波：半径内有目标才放（AI 不空放）
        for (const o of this.race.entries) {
          if (o.id === e.id) continue;
          const d = Math.hypot(o.boat.position.x - b.position.x, o.boat.position.z - b.position.z);
          if (d <= CONFIG.items.wave.radius * 0.9) { fire = true; break; }
        }
        break;
      case "lightning":
        fire = this.race.entries.some((o) => o.id !== e.id && !o.finished && this._isAheadOf(e, o));
        break;
      case "bomb":
        fire = this.race.entries.some((o) => {
          if (o.id === e.id || o.finished) return false;
          const d = ahead(o.id);
          return d !== null && d >= 5 && d <= CONFIG.items.bomb.throwRange + CONFIG.items.bomb.radius;
        });
        break;
      default:
        // speed/turbo/giant：直道才用（急弯放了会甩飞）——直道 = 前瞻弯率小
        {
          const arcOfNear = this.track.nearest(b.position.x, b.position.z);
          const d8 = 14 / this.track.length;
          const ta = this.track.tangentAt(((arcOfNear.t + d8 * 2) % 1 + 1) % 1);
          const tb = this.track.tangentAt(((arcOfNear.t + d8 * 6) % 1 + 1) % 1);
          const curv = Math.abs(Math.atan2(ta.x * tb.z - ta.z * tb.x, ta.x * tb.x + ta.z * tb.z));
          fire = curv < 0.05;
        }
    }
    if (fire) { this.use(e.id); e.ai.itemWait = 0; }
  }

  _recentHitAgainst(id) {
    const C = CONFIG.items.ai;
    for (let i = this.log.length - 1; i >= 0; i--) {
      const ev = this.log[i];
      if (ev.type !== "hit") continue;
      if (ev.target !== id) continue;
      return this.race.time - ev.t < 2.0;
    }
    return false;
  }

  // 供视图/HUD：当前在场玩家存货简表
  inventoryOf(id) {
    const e = this.race.entryOf(id);
    const b = e?.boat;
    return { item: b?.item || null, shield: b?.shield || 0, trapped: b?.trapped || 0 };
  }
}
