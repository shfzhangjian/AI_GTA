// Sketch Wave Racer — 飞鱼动态危险物
// 规则：当前前 3 名会按名次概率遇到飞鱼从水面跃出横穿航道；
// 玩家/AI 可以通过转向避开。Visual 在 FlyingFishView.js，本文件只负责生成/运动/碰撞。

import { CONFIG } from "../config.js";

const wrap01 = (x) => ((x % 1) + 1) % 1;

export class FlyingFishSystem {
  /**
   * @param {Track} track
   * @param {RaceState} race
   * @param {{rng?:()=>number,onEvent?:(ev:object)=>void}} opts
   */
  constructor(track, race, opts = {}) {
    this.track = track;
    this.race = race;
    this.rng = opts.rng || Math.random;
    this.onEvent = opts.onEvent || (() => {});
    this.fish = [];
    this._id = 0;
    this._cooldowns = new Map();
    this.log = [];
  }

  reset() {
    this.fish = [];
    this._cooldowns.clear();
    this.log = [];
  }

  update(dt, t = 0) {
    const C = CONFIG.flyingFish;
    if (!C?.enabled) return;
    this._spawnRanked(dt);
    this._updateFish(dt, t);
  }

  _spawnRanked(dt) {
    const C = CONFIG.flyingFish;
    const raceLive = this.race.started !== false && this.race.phase !== "over";
    if (!raceLive) return;
    for (const e of this._eligibleEntries()) {
      const cd = Math.max(0, (this._cooldowns.get(e.id) || 0) - dt);
      if (cd > 0) { this._cooldowns.set(e.id, cd); continue; }
      const rank = Math.max(1, Math.min(3, e.place || 3));
      const chance = C.rankChancePerSec[rank - 1] || 0;
      if (this.rng() >= chance * dt) continue;
      this._spawnFor(e, rank);
      this._cooldowns.set(e.id, this._rand(C.cooldown[0], C.cooldown[1]));
    }
  }

  _eligibleEntries() {
    return this.race.entries
      .filter((e) => !e.finished && e.place >= 1 && e.place <= 3)
      .sort((a, b) => a.place - b.place);
  }

  _spawnFor(entry, rank = entry.place || 1) {
    const C = CONFIG.flyingFish;
    const near = this.track.nearest(entry.boat.position.x, entry.boat.position.z);
    const ahead = this._rand(C.ahead[0], C.ahead[1]);
    const arc = near.arc + ahead;
    const t = wrap01(arc / this.track.length);
    const p = this.track.pointAt(t);
    const tan = this.track.tangentAt(t);
    const nx = -tan.z;
    const nz = tan.x;
    const dir = this.rng() < 0.5 ? -1 : 1;
    const startSide = dir * 12.5;
    const endSide = -dir * 12.5;
    const midSide = (near.side || 0) * Math.min(2.2, near.dist || 0) +
      this._rand(-C.laneJitter, C.laneJitter);
    const f = {
      id: ++this._id,
      targetId: entry.id,
      rank,
      arc: ((arc % this.track.length) + this.track.length) % this.track.length,
      cx: p.x,
      cz: p.z,
      nx,
      nz,
      tx: tan.x,
      tz: tan.z,
      startSide,
      endSide,
      midSide,
      x: p.x + nx * startSide,
      z: p.z + nz * startSide,
      y: -0.3,
      age: 0,
      life: C.life,
      alive: true,
      hitIds: new Set(),
    };
    this.fish.push(f);
    this._emit({ type: "spawn", hazard: "flyingFish", target: entry.id, rank, fishId: f.id });
    return f;
  }

  _updateFish(dt, t) {
    const C = CONFIG.flyingFish;
    for (const f of this.fish) {
      if (!f.alive) continue;
      f.age += dt;
      if (f.age >= f.life) { f.alive = false; continue; }
      const u = Math.min(1, f.age / Math.max(0.01, C.crossTime));
      const side = bezier(f.startSide, f.midSide, f.endSide, u);
      f.x = f.cx + f.nx * side;
      f.z = f.cz + f.nz * side;
      f.y = -0.25 + Math.sin(Math.min(1, f.age / f.life) * Math.PI) * C.jumpHeight;
      f.roll = Math.sin(t * 8 + f.id) * 0.35;
      f.heading = Math.atan2(-f.nx * Math.sign(f.endSide - f.startSide), -f.nz * Math.sign(f.endSide - f.startSide));
      this._collide(f);
    }
    this.fish = this.fish.filter((f) => f.alive);
  }

  _collide(f) {
    const C = CONFIG.flyingFish;
    if (f.y < 0.15 || f.y > 2.6) return;
    for (const e of this.race.entries) {
      if (e.finished || f.hitIds.has(e.id)) continue;
      const b = e.boat;
      if (b.airborne || b.trapped > 0) continue;
      const d = Math.hypot(b.position.x - f.x, b.position.z - f.z);
      if (d > C.radius + CONFIG.trackFeatures.colliderRadius) continue;
      const nx = d < 0.01 ? f.nx : (b.position.x - f.x) / d;
      const nz = d < 0.01 ? f.nz : (b.position.z - f.z) / d;
      b.position.x += nx * C.push * 0.35;
      b.position.z += nz * C.push * 0.35;
      b.speed = Math.max(1.5, b.speed * C.slowKeep);
      b.lateral += (nx * Math.cos(b.heading) + nz * -Math.sin(b.heading)) * 4.0;
      b.lastEvent = "hitfish";
      f.hitIds.add(e.id);
      this._emit({ type: "hit", hazard: "flyingFish", target: e.id, fishId: f.id });
    }
  }

  _rand(a, b) {
    return a + this.rng() * (b - a);
  }

  _emit(ev) {
    const out = { ...ev, t: this.race.time };
    this.log.push(out);
    if (this.log.length > 120) this.log.shift();
    this.onEvent(out);
  }
}

function bezier(a, b, c, u) {
  const v = 1 - u;
  return v * v * a + 2 * v * u * b + u * u * c;
}
