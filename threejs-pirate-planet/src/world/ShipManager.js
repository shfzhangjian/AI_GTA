/**
 * ShipManager.js — 船只与球面航行 + 海战 AI（§16 / §17 / §18 / 本轮海战）
 *
 * 硬性要求：
 *   · 船**真正移动**（非装饰），沿水路弧线推进 → 走 RouteManager.sampleAt
 *   · 姿态：UP = 球面外法线，FORWARD = 航线切线（GeoUtils，禁止 rotation.set(0,0,0)）
 *   · 吃水线：船模原点在龙骨（实测 baseY=0）。航线弧抬升 ROUTE_LIFT=0.55 而旧吃水 0.38
 *     → 龙骨仍在海面 +0.17 = 「悬浮」根因。新吃水 DRAFT_SHIP=1.1（config.SHIPS 唯一来源）
 *     → 龙骨落到海平面下 ≈0.55，再叠加浪高 → 浮在浪面上。
 *   · 海浪：SeaSwell.waveHeight（升沉）/ waveTilt（随浪横摇俯仰 ≤4.5°）
 *   · 海盗船不载客！海洋随机游历（航线跑完随机换线）；发现其它船只（商船/渡轮）
 *     → 切线转向追踪 + 进射程开炮（弹道与伤害经 fx / DamageSystem）
 *   · 血量经 DamageSystem（血量/变暗单一真相）；归零 = 沉没（DamageSystem._destroy 残骸化）
 *
 * ⚠ 模型尺寸/朝向修正只来自 ModelUtils.MODEL_SPECS；战斗数值只来自 config.SHIPS。
 */
import * as THREE from 'three';
import { SHIPS } from '../config.js';
import { alignObjectToSurface, getSurfaceNormal, vector3ToLatLon } from '../utils/GeoUtils.js';
import { mulberry32 } from '../planet/Clouds.js';
import { waveHeight, waveTilt } from './SeaSwell.js';

/** 指数平滑：ship.tiltCur ← 浪面目标（秒级惯性 → 流畅摇摆） */
function smoothTiltFor(ship, target, dt) {
  if (!ship.tiltCur) ship.tiltCur = { roll: 0, pitch: 0 };
  const k = Math.min(1, dt / Math.max(0.05, SHIPS.TILT_SMOOTH_SECONDS));
  ship.tiltCur.roll += (target.roll - ship.tiltCur.roll) * k;
  ship.tiltCur.pitch += (target.pitch - ship.tiltCur.pitch) * k;
}

/** 切平面内 a→b 带符号角（弧度） */
function signedAngleRad(a, b, n) {
  const x = a.dot(b), y = new THREE.Vector3().crossVectors(a, b).dot(n);
  return Math.atan2(y, x);
}

const DRAFT = SHIPS.DRAFT_SHIP;
const AVOID_OFFSET_MAX = SHIPS.SHIP_AVOID_RADIUS * 1.05;
const AVOID_OFFSET_DAMP = 1.15;
const AVOID_OFFSET_RATE = SHIPS.SHIP_AVOID_RADIUS * 1.65;
const LANE_OFFSET_STEP = SHIPS.SHIP_AVOID_RADIUS * 0.28;
const SEPARATION_PUSH = SHIPS.SHIP_AVOID_RADIUS * 0.42;
const LIVE_PUSH_RATE = SHIPS.SHIP_AVOID_RADIUS * 1.25;
const ROUTE_NUDGE_RATE = SHIPS.SHIP_AVOID_RADIUS * 0.85;
const REROUTE_ATTACH_DISTANCE = SHIPS.SHIP_AVOID_RADIUS * 0.22;
const ROUTE_REJOIN_DISTANCE = SHIPS.SHIP_AVOID_RADIUS * 0.26;
const ROUTE_FOLLOW_TURN_RATE = 1.05;
const ROUTE_LOOKAHEAD_MIN = SHIPS.SHIP_AVOID_RADIUS * 0.42;
const ROUTE_LOOKAHEAD_MAX = SHIPS.SHIP_AVOID_RADIUS * 0.95;
const ROUTE_ARRIVE_DISTANCE = 3.0;
const BLOCKED_TURN_SECONDS = 1.15;
const TURN_BACK_RATE = 2.6;
const BLOCKED_DECAY = 0.35;
const PIRATE_NAV_TURN_RATE = 0.75;
const PIRATE_ATTACK_STANDOFF = SHIPS.PIRATE_CANNON_RANGE * 0.78;
const PIRATE_ATTACK_DEADBAND = SHIPS.SHIP_AVOID_RADIUS * 0.18;
const PIRATE_ATTACK_CRUISE = 0.34;
const PIRATE_TURRET_TURN_RATE = 5.2;
const PIRATE_TURRET_FIRE_ARC_DEG = 14;
const TRAFFIC_LOOKAHEAD_SECONDS = 4.0;
const TRAFFIC_DETECT_RADIUS = SHIPS.SHIP_AVOID_RADIUS * 1.55;
const TRAFFIC_RELEASE_RADIUS = SHIPS.SHIP_AVOID_RADIUS * 1.65;
const TRAFFIC_HARD_RADIUS = SHIPS.SHIP_AVOID_RADIUS * 0.82;
const TRAFFIC_SIDE_WEIGHT = 0.95;
const TRAFFIC_AWAY_WEIGHT = 0.34;
const TRAFFIC_STEER_RATE = SHIPS.SHIP_AVOID_STEER * 0.82;
const TRAFFIC_MIN_SPEED_SCALE = 0.26;
const TRAFFIC_PRIORITY_BOOST_MAX = 1.24;
const COLLISION_RING_SEGMENTS = 80;
const COLLISION_RING_OPACITY = 0.14;
const DYNAMIC_ROUTE_RECALC_COOLDOWN = 1.4;
const DYNAMIC_ROUTE_REJOIN_MULT = 1.18;
const STALL_WATCH_SECONDS = 0.72;
const STALL_MIN_FORWARD = 0.35;
const STALL_MIN_SURFACE = 0.18;
const STALL_MIN_WALKED = 0.28;
const STALL_YAW_MIN = 0.45;
const STALL_FORCE_SECONDS = 0.9;
const STALL_FORCE_SPEED_SCALE = 1.18;
const STALL_DEBUG_LOG_COOLDOWN = 1.25;
const DEBUG_SHIP_TRACE_SECONDS = 5;
const DEBUG_SHIP_TRACE_INTERVAL = 0.2;
const TANGENT_MIN_LENGTH_SQ = 1e-8;
// Land.js 海面高度为 -0.04；安全水域阈值必须略高于它。
const SHIP_WATER_HEIGHT_MAX = 0.03;
const SHIP_WATER_PROBE_MAX = 0.12;
const SHIP_WATER_CLEARANCE_DEG = 2.0;
const SEARCH_RANGE_SEGMENTS = 96;
const REPAIR_PROGRESS_EDGE = 0.045;

const SHIP_TYPES = {
  pirate: ['ship-pirate-large', 'ship-pirate-medium'],
  merchant: ['ship-large', 'ship-medium'],
};

/** 船名（海盗 / 大航海风，非任何既有游戏角色） */
const SHIP_NAMES = {
  pirate: ['Black Pearl', 'Sea Serpent', 'Tide Reaver', 'Crimson Wake'],
  merchant: ['Gilded Gale', 'Storm Petrel', 'Emerald Corsair', 'Salt Crown'],
};

const _v = new THREE.Vector3();
const _v2 = new THREE.Vector3();
const _n = new THREE.Vector3();
const WATER_PROBES = [
  [1, 0], [-1, 0], [0, 1], [0, -1],
  [0.7, 0.7], [0.7, -0.7], [-0.7, 0.7], [-0.7, -0.7],
];

export class ShipManager {
  /**
   * @param {{sceneManager, assets, routes, registry?, damageSystem?, fx?, group?, count?, seed?}} deps
   *        fx：CombatFx（炮火特效与着火；缺省时伤害仍结算、只无特效）
   */
  constructor(deps) {
    this.sm = deps.sceneManager;
    this.assets = deps.assets;
    this.routes = deps.routes;
    this.registry = deps.registry || null;
    this.damage = deps.damageSystem || null;
    this.fx = deps.fx || null;
    /** 音效（AudioFx，可选；main.js 注入） */
    this.audio = deps.audio || null;
    this.group = deps.group || this.sm.ships;
    this.group.name = 'Ships';
    this.rng = mulberry32(deps.seed ?? 86420);
    this.count = deps.count ?? null;

    /** @type {Array<object>} 船只记录 */
    this.ships = [];
    /** @type {null|(()=>Array<object>)} 渡轮队提供者（main.js 注入，海盗猎杀渡轮用） */
    this.ferryProvider = null;

    this._pos = new THREE.Vector3();
    this._tan = new THREE.Vector3();
    this._normal = new THREE.Vector3();
    this._q = new THREE.Quaternion();
    this._lastMotionSnapshotAt = -Infinity;
    this._debugShipTraces = new Map();
  }

  /** 建造船队：海盗随机游历可开炮，商船跑航线 */
  build() {
    this.clear();
    const availableByKind = Object.fromEntries(Object.keys(SHIP_TYPES).map((kind) => [
      kind,
      SHIP_TYPES[kind].filter((model) => this.assets.has(model)),
    ]));
    const available = Object.entries(availableByKind).flatMap(([kind, models]) => models.map((model) => ({ model, kind })));
    if (!available.length) {
      console.warn('[ShipManager] 没有可用船只模型（检查 MVP_MODELS 是否含 ship-*）');
      return this;
    }
    if (!this.routes || !this.routes.count) {
      console.warn('[ShipManager] 无航线，船只无法航行（需先 RouteManager.build(ports)）');
      return this;
    }

    const total = this._fleetSize();
    for (let i = 0; i < total; i++) {
      const t = pickShipType(i, availableByKind, available);
      const spawn = this._pickSpreadSpawn(i, t.kind);
      const route = spawn.route;
      const obj = this.assets.instance(t.model, { shadows: false });
      obj.visible = false;
      const maxHp = SHIPS.SHIP_MAX_HP[t.kind] ?? 120;

      const ship = {
        id: 'ship-' + i,
        name: SHIP_NAMES[t.kind][i % SHIP_NAMES[t.kind].length],
        model: t.model,
        kind: t.kind,
        typeLabel: t.kind === 'pirate' ? '海盗船' : '商船',
        object: obj,
        route,
        walked: spawn.walked,
        routeDir: 1,
        speed: cruiseSpeedFor(t.kind, this.rng),  // 巡航（世界单位/秒）：商船也有随机速度，可甩开海盗
        phase: this.rng() * Math.PI * 2,
        progress: 0,
        state: 'sailing',                          // sailing | chasing
        position: new THREE.Vector3(),
        tangent: new THREE.Vector3(),
        yieldPriority: i + 1,
        collisionRadius: shipLengthRadius(obj),
        collisionRing: null,
        // ── 战斗 ──
        hp: maxHp,
        maxHp,
        destroyed: false,
        destroyedAt: null,
        removeAt: null,
        hiddenAfterDestroyed: false,
        fireCooldown: 1.2 + this.rng() * 2.2,      // 首炮延迟（错峰开火）
        fireLevel: 0,
        repairing: false,
        repairPose: null,
        // 摇摆平滑状态（每帧朝浪面目标值插值 → 流畅）
        tiltCur: { roll: 0, pitch: 0 },
        laneOffset: laneOffsetFor(i),
        avoidOffset: 0,
        avoidLock: null,
        targetId: null,
        fleeFromId: null,
        attackerId: null,
        attackStatus: '',
        lastAttackAt: -Infinity,
        lastHitAt: -Infinity,
        lastShotChance: 0,
        aimDir: new THREE.Vector3(),
        cannon: null,
        patrolTimer: 0,
        waitTimer: 0,
        repairPinged: false,
        routeChange: null,
        turnBack: null,
        blockedTime: 0,
        driveMode: 'live',
        trafficPlan: null,
        trafficBoost: 1,
        routeRecalcCooldown: 0,
        forceForwardTimer: 0,
        motionWatch: {
          lastPos: new THREE.Vector3(),
          lastTan: new THREE.Vector3(),
          lastWalked: 0,
          lastRoute: null,
          stallTime: 0,
        },
      };

      obj.name = ship.name;
      obj.userData.model = t.model;
      obj.userData.isShip = true;
      obj.userData.shipId = ship.id;
      obj.userData.hp = ship.hp;
      obj.userData.maxHp = maxHp;
      if (this.registry) {
        const entity = this.registry.register(obj, {
          type: 'ship',
          tags: ['ship', t.kind, t.model],
          model: t.model,
          damageable: true,
          maxHp,
          data: { shipId: ship.id },
        });
        if (this.damage) this.damage.makeDamageable(obj, { maxHp });
      }
      if (ship.kind === 'pirate') {
        ship.cannon = this._makePirateCannon(obj);
        ship.searchRange = this._makeSearchRange();
      }
      ship.collisionRing = this._makeCollisionRing(ship);
      this.group.add(obj);
      this.ships.push(ship);
      this._place(ship, 0, 1 / 60);
      ship.motionWatch.lastPos.copy(ship.position);
      ship.motionWatch.lastTan.copy(ship.tangent);
      ship.motionWatch.lastWalked = ship.walked;
      ship.motionWatch.lastRoute = ship.route;
      this._updateCollisionRing(ship);
      if (ship.kind === 'pirate') {
        this._updatePirateAim(ship, null, 1 / 60);
        this._syncCannonTurret(ship);
      }
      obj.updateMatrixWorld(true);
      obj.visible = true;
      if (ship.kind === 'pirate') this._updateSearchRange(ship);
      this._updateCollisionRing(ship);
    }
    return this;
  }

  _fleetSize() {
    const autoMerchants = Math.max(
      SHIPS.MIN_MERCHANT_SHIPS ?? 0,
      SHIPS.MERCHANTS_PER_ROUTE ? Math.max(0, this.routes?.count || 0) : 0,
    );
    const autoTotal = Math.max(0, SHIPS.PIRATE_COUNT ?? 0) + autoMerchants;
    const explicit = Number.isFinite(this.count) && this.count > 0 ? this.count : autoTotal;
    const hardCap = Number.isFinite(SHIPS.MAX_ACTIVE_SHIPS) && SHIPS.MAX_ACTIVE_SHIPS > 0
      ? SHIPS.MAX_ACTIVE_SHIPS
      : Infinity;
    return Math.min(explicit, hardCap);
  }

  _pickSpreadSpawn(index, kind = 'merchant') {
    const count = Math.max(1, this.routes.count || 1);
    const minDist = SHIPS.SPAWN_MIN_DISTANCE ?? 64;
    const samples = [0.06, 0.16, 0.28, 0.39, 0.51, 0.63, 0.74, 0.86, 0.96];
    const pos = new THREE.Vector3();
    const tan = new THREE.Vector3();
    const routeMid = new THREE.Vector3();
    const otherMid = new THREE.Vector3();
    const radius = this.routes?.sampler?.radius ?? 100;
    const usedRoutes = new Set(this.ships.map((s) => s.route));
    const usedMerchantRoutes = new Set(this.ships.filter((s) => s.kind === 'merchant').map((s) => s.route));
    const usedMerchantTargets = new Set(this.ships.filter((s) => s.kind === 'merchant').map((s) => s.route?.to?.id).filter(Boolean));
    const preferUnusedRoute = kind !== 'merchant' && usedRoutes.size < count;
    const merchantRouteAvailable = kind === 'merchant' && usedMerchantRoutes.size < count;
    const merchantTargetAvailable = kind === 'merchant' && usedMerchantTargets.size < count;
    const stride = spawnRouteStride(count);
    let best = null;

    for (let r = 0; r < count; r++) {
      const route = this.routes.pick((index * 3 + r * stride) % count);
      if (preferUnusedRoute && usedRoutes.has(route)) continue;
      if (merchantRouteAvailable && usedMerchantRoutes.has(route)) continue;
      if (merchantTargetAvailable && usedMerchantTargets.has(route.to?.id)) continue;
      this.routes.sampleAt(route, route.length * 0.5, routeMid, tan, { wrap: false });
      for (const f of samples) {
        const walked = route.length * ((f + this.rng() * 0.045) % 1);
        this.routes.sampleAt(route, walked, pos, tan);
        let nearest = Infinity;
        let routeRegionGap = Infinity;
        let targetGap = Infinity;
        for (const other of this.ships) {
          nearest = Math.min(nearest, surfaceDistance(pos, other.position, radius));
          if (!other.route) continue;
          this.routes.sampleAt(other.route, other.route.length * 0.5, otherMid, tan, { wrap: false });
          routeRegionGap = Math.min(routeRegionGap, surfaceDistance(routeMid, otherMid, radius));
          targetGap = Math.min(targetGap, surfaceDistance(route.B, other.route.B, radius));
        }
        if (!this.ships.length) nearest = minDist;
        const routeReusePenalty = this.ships.some((s) => s.route === route) ? minDist * 0.35 : 0;
        const sameTargetPenalty = this.ships.some((s) => s.route?.to?.id && s.route.to.id === route.to?.id) ? minDist * 1.4 : 0;
        const crowdedPenalty = nearest < minDist ? (minDist - nearest) * 4 : 0;
        const regionSpread = Number.isFinite(routeRegionGap) ? routeRegionGap : minDist;
        const targetSpread = Number.isFinite(targetGap) ? targetGap : minDist;
        const score = nearest * 1.2 + regionSpread * 0.45 + targetSpread * 0.35
          - routeReusePenalty - sameTargetPenalty - crowdedPenalty;
        if (!best || score > best.score) best = { route, walked, score, nearest };
      }
    }
    return best ? { route: best.route, walked: best.walked } : { route: this.routes.pick(index), walked: 0 };
  }

  /** 摆放：航线弧取位 → 吃水下沉 → 随浪升沉 + 随浪横摇/俯仰 */
  _place(ship, time, dt = 1 / 60) {
    const live = (ship.driveMode === 'live' || ship.state === 'chasing' || ship.state === 'fleeing' || ship.state === 'rerouting' || ship.state === 'turningBack') && ship.position.lengthSq() > 1e-6;
    const locked = ship.repairing && ship.repairPose;
    const s = locked
      ? { position: this._pos.copy(ship.repairPose.position), tangent: this._tan.copy(ship.repairPose.tangent), t: ship.repairPose.t }
      : live
      ? { position: this._pos.copy(ship.position).setLength((this.routes?.sampler?.radius ?? 100) + SHIPS.POS_LIFT), tangent: this._tan.copy(ship.tangent), t: ship.progress }
      : this._sampleTravelAt(ship, ship.route, ship.walked, this._pos, this._tan);
    const normal = getSurfaceNormal(s.position, this._normal).clone();
    const base = s.position.clone();
    if (live && !locked) {
      this._ensureSurfaceTangent(ship, normal, s.tangent);
      s.tangent.copy(ship.tangent);
    }
    const routeOffset = !live && !locked ? routeOffsetFor(ship) : 0;
    if (routeOffset) {
      _v.crossVectors(s.tangent, normal).normalize();
      if (!this._applySafeOffset(base, s.position, _v, routeOffset, ship)) this._markBlocked(ship, dt * 0.5, 'coast');
    }

    // ⭐ 吃水线：龙骨原点 = 航线位置 + 法线×(浪高 − DRAFT)，DRAFT(1.1) > ROUTE_LIFT(0.55)
    //    → 龙骨落到海平面下 ≈0.55，船体浮在浪面上（旧 DRAFT 0.38 → 龙骨 +0.17 悬浮）
    const ll = vector3ToLatLon(base);
    const offset = waveHeight(ll.lat, ll.lon, time) - DRAFT;
    const placed = base.clone().addScaledVector(normal, offset);

    // UP = 法线、FORWARD = 切线（GeoUtils 唯一姿态来源）
    alignObjectToSurface(ship.object, placed, s.tangent, modelAxes(ship.object));

    // ⚠ 随浪横摇/俯仰必须在定向「之后」右乘叠加（先定向、后摇浪）：
    //   先乘（左乘世界轴）会把局部 +Y 从法线掀开限幅角（船底朝外被破坏）。
    //   平滑：船体按 TILT_SMOOTH_SECONDS 惯性追随浪面目标值（不逐帧跳变 → 流畅）
    const tilt = waveTilt(ll.lat, ll.lon, time);
    smoothTiltFor(ship, tilt, dt);
    if (ship.tiltCur.roll) {
      _v.copy(s.tangent).normalize();
      ship.object.quaternion.multiply(this._q.setFromAxisAngle(_v, ship.tiltCur.roll));
    }
    if (ship.tiltCur.pitch) {
      _v.crossVectors(_v2.copy(s.tangent).normalize(), normal).normalize();
      ship.object.quaternion.multiply(this._q.setFromAxisAngle(_v, ship.tiltCur.pitch));
    }

    ship.position.copy(placed);
    ship.tangent.copy(s.tangent);
    ship.progress = s.t;
  }

  /* ═══════════════════ 海战 AI ═══════════════════ */

  /** 海盗猎杀渡轮时由 main.js 注入：() => ferry 记录数组 */
  setFerryProvider(fn) { this.ferryProvider = fn; }

  /** 每帧：移动 + 海盗 AI（发现 → 追踪 → 射程内开炮） */
  update(dt, time) {
    if (!this.ships.length) return;
    for (const ship of this.ships) {
      ship.trafficPlan = null;
      ship.trafficBoost = 1;
      ship.routeRecalcCooldown = Math.max(0, (ship.routeRecalcCooldown || 0) - dt);
      this._syncDamage(ship, time);
      if (ship.destroyed) {
        this._updateDestroyedShip(ship, time);
      }
    }
    this._planTrafficAvoidance(dt);
    for (const ship of this.ships) {
      if (ship.destroyed) continue;
      if (ship.position.lengthSq() > 1e-8) this._ensureSurfaceTangent(ship, getSurfaceNormal(ship.position, new THREE.Vector3()));
      if (this._updateForceForward(ship, dt)) {
        ship.avoidOffset *= Math.max(0, 1 - AVOID_OFFSET_DAMP * dt);
        continue;
      }
      if (ship.kind === 'pirate') this._updatePirate(ship, dt, time);
      else this._updateMerchant(ship, dt);
      ship.avoidOffset *= Math.max(0, 1 - AVOID_OFFSET_DAMP * dt);
    }
    // 运动后做一次统一船距求解；停靠/修理船也作为障碍，航行船必须绕开。
    this._avoidShips(dt);
    for (const ship of this.ships) {
      this._place(ship, time, dt);
      if (ship.kind === 'pirate') this._syncCannonTurret(ship);
      this._updateSearchRange(ship);
      this._updateCollisionRing(ship);
      this._updateMotionWatch(ship, dt);
    }
    this._updateDebugShipTraces(time);
  }

  /**
   * 硬分离只负责把已经过近的船推开；船头转向由 _planTrafficAvoidance
   * 生成的单一 trafficPlan 控制，避免多船同时改船头导致抖动。
   */
  _avoidShips(dt) {
    const all = this._avoidPool();
    for (let i = 0; i < all.length; i++) {
      const a = all[i];
      if (!this._blocksWaterway(a)) continue;
      for (let j = i + 1; j < all.length; j++) {
        const b = all[j];
        if (!this._blocksWaterway(b)) continue;
        const d = surfaceDistance(a.position, b.position, this.routes?.sampler?.radius ?? 100);
        const R = this._circlePairRadius(a, b);
        if (d >= R) continue;
        const n = getSurfaceNormal(a.position, new THREE.Vector3());
        const away = new THREE.Vector3().subVectors(b.position, a.position);
        away.addScaledVector(n, -away.dot(n));
        if (away.lengthSq() < 1e-9) {
          away.crossVectors(a.tangent || _v2.set(1, 0, 0), n);
          if (away.lengthSq() < 1e-9) away.crossVectors(_v2.set(0, 1, 0), n);
        }
        away.normalize();
        const overlap = d < 1e-6 ? 1 : (R - d) / R;
        this._repelVessel(a, b, away.clone().negate(), n, overlap, dt);
        this._repelVessel(b, a, away, n, overlap, dt);
      }
    }
  }

  _planTrafficAvoidance(dt) {
    const all = this._avoidPool().filter((v) => this._blocksWaterway(v));
    for (const vessel of all) {
      if (!vessel.avoidLock) continue;
      const other = all.find((v) => vesselId(v) === vessel.avoidLock.otherId);
      const releaseRadius = other ? Math.max(TRAFFIC_RELEASE_RADIUS, this._circlePairRadius(vessel, other) * 1.26) : TRAFFIC_RELEASE_RADIUS;
      if (!other || surfaceDistance(vessel.position, other.position, this.routes?.sampler?.radius ?? 100) > releaseRadius) vessel.avoidLock = null;
    }

    for (let i = 0; i < all.length; i++) {
      const a = all[i];
      for (let j = i + 1; j < all.length; j++) {
        const b = all[j];
        const conflict = this._trafficConflict(a, b);
        if (!conflict) continue;
        const give = this._chooseGiveWayVessel(a, b);
        if (!give) continue;
        const stand = give === a ? b : a;
        this._setTrafficCandidate(give, stand, conflict, dt);
        if (conflict.circleOverlap) this._recalculateRouteForOverlap(give, stand, conflict);
        this._setStandOnBoost(stand, give, conflict);
      }
    }
  }

  _trafficConflict(a, b) {
    const R = this._circlePairRadius(a, b);
    const detectRadius = Math.max(TRAFFIC_DETECT_RADIUS, R * 1.12);
    const surfaceRadius = this.routes?.sampler?.radius ?? 100;
    const normal = getSurfaceNormal(a.position, new THREE.Vector3());
    const rel = new THREE.Vector3().subVectors(b.position, a.position);
    rel.addScaledVector(normal, -rel.dot(normal));
    if (rel.lengthSq() < 1e-9) {
      rel.crossVectors(a.tangent || new THREE.Vector3(1, 0, 0), normal);
      if (rel.lengthSq() < 1e-9) rel.crossVectors(new THREE.Vector3(0, 1, 0), normal);
    }
    const distance = surfaceDistance(a.position, b.position, surfaceRadius);
    const relDir = rel.clone().normalize();
    const va = this._trafficVelocity(a, normal);
    const vb = this._trafficVelocity(b, normal);
    const relVel = vb.sub(va);
    relVel.addScaledVector(normal, -relVel.dot(normal));
    const relVelSq = relVel.lengthSq();
    let ttc = Infinity;
    let closest = distance;
    let closing = 0;

    if (relVelSq > 1e-8) {
      closing = -rel.dot(relVel) / Math.max(distance, 1e-6);
      ttc = THREE.MathUtils.clamp(-rel.dot(relVel) / relVelSq, 0, TRAFFIC_LOOKAHEAD_SECONDS);
      closest = rel.clone().addScaledVector(relVel, ttc).length();
    }

    const circleOverlap = distance < R;
    const immediate = distance < R * 1.08;
    const future = distance < detectRadius && ttc < TRAFFIC_LOOKAHEAD_SECONDS && closest < R * 1.02;
    const closingNear = closing > 0 && distance < detectRadius * 0.58;
    if (!immediate && !future && !closingNear) return null;

    const timeRisk = Number.isFinite(ttc) ? 1 - ttc / TRAFFIC_LOOKAHEAD_SECONDS : 0;
    const closeRisk = THREE.MathUtils.clamp((R * 1.28 - distance) / (R * 1.28), 0, 1);
    const courseRisk = THREE.MathUtils.clamp((R * 1.12 - closest) / (R * 1.12), 0, 1);
    const urgency = THREE.MathUtils.clamp(Math.max(closeRisk, courseRisk) + timeRisk * 0.45, 0.08, 1);
    return { normal, rel, relDir, distance, ttc, closest, urgency, circleOverlap, pairRadius: R };
  }

  _trafficVelocity(vessel, normal) {
    const out = new THREE.Vector3();
    if (!this._blocksWaterway(vessel) || vessel.waitTimer > 0 || vessel.repairing || vessel.state === 'dock') return out;
    const tangent = vessel.tangent && vessel.tangent.lengthSq() > 1e-8
      ? vessel.tangent
      : new THREE.Vector3(1, 0, 0);
    out.copy(tangent).addScaledVector(normal, -tangent.dot(normal));
    if (out.lengthSq() < 1e-8) return out.set(0, 0, 0);
    const speed = vessel.state === 'chasing'
      ? Math.max(vessel.speed || 0, SHIPS.PIRATE_SPEED_CHASE * 0.72)
      : (vessel.speed || 0);
    return out.normalize().multiplyScalar(speed);
  }

  _chooseGiveWayVessel(a, b) {
    const aid = vesselId(a);
    const bid = vesselId(b);
    const ay = this._canYield(a);
    const by = this._canYield(b);
    if (ay && !by) return a;
    if (by && !ay) return b;
    if (!ay && !by) return null;
    const ap = trafficPriority(a);
    const bp = trafficPriority(b);
    if (ap !== bp) return ap < bp ? a : b;
    if (a.avoidLock?.otherId === bid) return a;
    if (b.avoidLock?.otherId === aid) return b;
    return stableSide(aid, bid) > 0 ? a : b;
  }

  _setTrafficCandidate(give, stand, conflict, dt) {
    if (!this._canYield(give)) return;
    const otherId = vesselId(stand);
    if (give.avoidLock?.otherId && give.avoidLock.otherId !== otherId && conflict.distance > TRAFFIC_HARD_RADIUS) return;

    const normal = getSurfaceNormal(give.position, new THREE.Vector3());
    const toOther = new THREE.Vector3().subVectors(stand.position, give.position);
    toOther.addScaledVector(normal, -toOther.dot(normal));
    if (toOther.lengthSq() < 1e-9) return;
    toOther.normalize();

    const side = this._trafficSideFor(give, stand, toOther, normal);
    const dir = this._trafficAvoidDirection(give, stand, side, toOther, normal)
      || this._trafficAvoidDirection(give, stand, -side, toOther, normal);
    if (!dir) return;

    give.avoidLock = { otherId, side };
    const pairRadius = Math.max(conflict.pairRadius || SHIPS.SHIP_AVOID_RADIUS, 1e-6);
    const closeRisk = THREE.MathUtils.clamp(
      (pairRadius * 1.18 - conflict.distance) / (pairRadius * 1.18),
      0,
      1,
    );
    const minScale = stand.kind === 'pirate' || give.kind === 'pirate' ? 0.62 : TRAFFIC_MIN_SPEED_SCALE;
    const speedScale = THREE.MathUtils.clamp(1 - conflict.urgency * 0.48 - closeRisk * 0.34, minScale, 1);
    const candidate = {
      otherId,
      otherName: stand.name || stand.typeLabel || '前方船只',
      dir,
      urgency: conflict.urgency,
      speedScale,
      distance: conflict.distance,
    };
    if (!give.trafficPlan || candidate.urgency > give.trafficPlan.urgency) give.trafficPlan = candidate;
  }

  _setStandOnBoost(stand, give, conflict) {
    if (!this._canYield(stand)) return;
    if (trafficPriority(stand) <= trafficPriority(give)) return;
    const boost = THREE.MathUtils.clamp(1 + conflict.urgency * 0.18, 1, TRAFFIC_PRIORITY_BOOST_MAX);
    stand.trafficBoost = Math.max(stand.trafficBoost || 1, boost);
  }

  _recalculateRouteForOverlap(give, stand, conflict) {
    if (!give?.route || give.repairing || give.destroyed || give.routeRecalcCooldown > 0) return false;
    if (!this.ships.includes(give)) return false;
    const len = Math.max(give.route.length || 0, 1e-6);
    const dir = Math.sign(give.routeDir || 1) || 1;
    const current = this._nearestWalkedOnRoute(give.route, give.position, give);
    const clearance = Math.max(conflict.pairRadius || this._circlePairRadius(give, stand), SHIPS.SHIP_AVOID_RADIUS);
    const targetWalked = THREE.MathUtils.clamp(current + dir * clearance * DYNAMIC_ROUTE_REJOIN_MULT, 0, len);
    if (Math.abs(targetWalked - current) < Math.min(len * 0.04, clearance * 0.4)) return false;
    give.walked = current;
    give.routeChange = { route: give.route, walked: targetWalked, rejoin: true, reason: 'collisionCircle' };
    give.state = 'rerouting';
    give.routeRecalcCooldown = DYNAMIC_ROUTE_RECALC_COOLDOWN;
    give.attackStatus = '航线被占用，动态改道';
    return true;
  }

  _trafficSideFor(vessel, other, toOther, normal) {
    const otherId = vesselId(other);
    if (vessel.avoidLock?.otherId === otherId) return vessel.avoidLock.side || 1;
    const forward = vessel.tangent.clone().addScaledVector(normal, -vessel.tangent.dot(normal));
    if (forward.lengthSq() < 1e-8) return stableSide(vesselId(vessel), otherId);
    forward.normalize();
    const bearing = signedAngleRad(forward, toOther, normal);
    if (Math.abs(bearing) < 0.32) return stableSide(vesselId(vessel), otherId);
    return -Math.sign(bearing || 1);
  }

  _trafficAvoidDirection(vessel, other, side, toOther, normal) {
    const forward = vessel.tangent.clone().addScaledVector(normal, -vessel.tangent.dot(normal));
    if (forward.lengthSq() < 1e-8) return null;
    forward.normalize();
    const sideVec = new THREE.Vector3().crossVectors(normal, forward);
    if (sideVec.lengthSq() < 1e-9) return null;
    sideVec.normalize().multiplyScalar(side || 1);
    const away = toOther.clone().negate();
    const dir = forward.multiplyScalar(0.66)
      .addScaledVector(sideVec, TRAFFIC_SIDE_WEIGHT)
      .addScaledVector(away, TRAFFIC_AWAY_WEIGHT);
    if (dir.lengthSq() < 1e-8) return null;
    dir.normalize();
    if (this._trafficDirectionSafe(vessel, dir)) return dir;
    const flipped = vessel.tangent.clone().addScaledVector(normal, -vessel.tangent.dot(normal)).normalize()
      .addScaledVector(sideVec.negate(), TRAFFIC_SIDE_WEIGHT)
      .addScaledVector(away, TRAFFIC_AWAY_WEIGHT);
    return flipped.lengthSq() > 1e-8 && this._trafficDirectionSafe(vessel, flipped.normalize()) ? flipped : null;
  }

  _trafficDirectionSafe(vessel, dir) {
    if (!vessel.position || dir.lengthSq() < 1e-8) return false;
    const probe = vessel.position.clone()
      .addScaledVector(dir, Math.max(SHIPS.SHIP_AVOID_RADIUS * 0.18, (vessel.speed || SHIPS.PIRATE_SPEED_CHASE) * 0.75))
      .setLength((this.routes?.sampler?.radius ?? 100) + SHIPS.POS_LIFT);
    return this._isSafeWater(probe);
  }

  _applyTrafficAvoidanceSteer(ship, desiredDir, normal, rate, dt) {
    const desired = desiredDir?.clone?.() || new THREE.Vector3();
    desired.addScaledVector(normal, -desired.dot(normal));
    if (desired.lengthSq() < 1e-8) desired.copy(ship.tangent || new THREE.Vector3(1, 0, 0));
    desired.addScaledVector(normal, -desired.dot(normal));
    if (desired.lengthSq() < 1e-8) return 1;
    desired.normalize();

    const plan = ship.trafficPlan;
    if (plan?.dir && plan.dir.lengthSq() > 1e-8) {
      const urgency = THREE.MathUtils.clamp(plan.urgency || 0, 0, 1);
      const avoid = plan.dir.clone().addScaledVector(normal, -plan.dir.dot(normal)).normalize();
      desired.multiplyScalar(1 - urgency * 0.58).addScaledVector(avoid, 0.58 + urgency * 0.32).normalize();
      if (ship.kind === 'merchant' && ship.state === 'sailing') ship.attackStatus = '避让 ' + plan.otherName;
      this._steerToward(ship, desired, normal, Math.max(rate, TRAFFIC_STEER_RATE), dt);
      return plan.speedScale ?? 1;
    }

    if (ship.kind === 'merchant' && ship.attackStatus?.startsWith?.('避让 ')) ship.attackStatus = '';
    this._steerToward(ship, desired, normal, rate, dt);
    return ship.trafficBoost || 1;
  }

  _updateMerchant(ship, dt) {
    if (this._updateTurnBack(ship, dt)) return;
    if (this._updateRouteTransition(ship, dt)) return;
    if (this._updateRepairIfDocked(ship, dt)) return;
    if (ship.waitTimer > 0) {
      ship.waitTimer = Math.max(0, ship.waitTimer - dt);
      this._markBlocked(ship, dt, 'traffic');
      return;
    }
    if (this._updateMerchantFlee(ship, dt)) return;
    this._clearBlocked(ship, dt);
    this._advanceOnRoute(ship, ship.speed * dt, dt);
  }

  _updateMerchantFlee(ship, dt) {
    const pirate = this._nearestPirateThreat(ship);
    if (pirate) {
      ship.state = 'fleeing';
      ship.fleeFromId = pirate.id;
      ship.attackerId = pirate.id;
      ship.attackStatus = '规避 ' + pirate.name;
      if (ship.position.lengthSq() < 1e-6) this._place(ship, 0, dt);
      const normal = getSurfaceNormal(ship.position, _n);
      _v.copy(ship.position).sub(pirate.position);
      _v.addScaledVector(normal, -_v.dot(normal));
      if (_v.lengthSq() > 1e-8) {
        _v.normalize();
        const trafficScale = this._applyTrafficAvoidanceSteer(ship, _v, normal, 2.8, dt);
        const speedAdvantage = THREE.MathUtils.clamp((ship.speed - SHIPS.PIRATE_SPEED_CHASE) / SHIPS.PIRATE_SPEED_CHASE, -0.25, 0.35);
        const fleeBoost = 1.12 + Math.max(0, speedAdvantage) * 0.55;
        this._advance(ship, ship.speed * fleeBoost * trafficScale * dt, dt);
      }
      return true;
    }
    if (ship.state === 'fleeing') {
      ship.walked = this._nearestWalkedOnRoute(ship.route, ship.position, ship);
      ship.state = 'sailing';
      ship.fleeFromId = null;
      ship.avoidOffset = 0;
      ship.attackerId = ship.hp < ship.maxHp ? ship.attackerId : null;
      ship.attackStatus = ship.hp < ship.maxHp ? '脱离追击，返航修理' : '';
    }
    return false;
  }

  _nearestPirateThreat(ship) {
    const selfId = vesselId(ship);
    let best = null, bestD = Infinity;
    for (const p of this.ships) {
      if (p === ship || p.kind !== 'pirate' || p.destroyed) continue;
      const lockedOnThis = p.targetId === vesselId(ship);
      const d = ship.position.distanceTo(p.position);
      const recentlyHitByThis = ship.attackerId === p.id && ship.hp < ship.maxHp;
      if (!lockedOnThis && !recentlyHitByThis) continue;
      const limit = lockedOnThis
        ? SHIPS.PIRATE_SEEK_RADIUS * 1.18
        : SHIPS.PIRATE_CANNON_RANGE * 1.35;
      if (d < limit && d < bestD) { bestD = d; best = p; }
    }
    if (!best && ship.state === 'fleeing') {
      const old = this.getById(ship.fleeFromId);
      if (old && !old.destroyed) {
        const stillLocked = old.targetId === selfId;
        const escapeDist = stillLocked ? SHIPS.PIRATE_SEEK_RADIUS * 1.25 : SHIPS.PIRATE_CANNON_RANGE * 1.1;
        if (ship.position.distanceTo(old.position) < escapeDist) best = old;
      }
    }
    return best;
  }

  /** 海盗船：随机游历（航线跑完随机换线）；发现猎物和船 → 追踪 + 开炮 */
  _updatePirate(ship, dt, time) {
    if (this._updateTurnBack(ship, dt)) return;
    if (ship.routeChange?.reason === 'collisionCircle' && this._updateRouteTransition(ship, dt)) return;
    const prey = this._findPrey(ship);
    if (prey) {
      if (ship.routeChange?.reason !== 'collisionCircle') ship.routeChange = null;
      ship.state = 'chasing';
      ship.patrolTimer = 0;
      const dist = ship.position.distanceTo(prey.position);
      const normal = getSurfaceNormal(ship.position, _n);
      this._updatePirateAim(ship, prey, dt);
      const keepAway = SHIPS.SHIP_AVOID_RADIUS * 1.08;
      if (dist < keepAway) {
        _v.copy(ship.position).sub(prey.position);
        _v.addScaledVector(normal, -_v.dot(normal));
        if (_v.lengthSq() > 1e-8) {
          _v.normalize();
          _v2.crossVectors(normal, _v).normalize();
          if ((ship.id.charCodeAt(ship.id.length - 1) & 1) === 0) _v2.negate();
          _v.multiplyScalar(0.82).addScaledVector(_v2, 0.42).normalize();
          this._steerToward(ship, _v, normal, 2.6, dt);
          this._pushLiveVessel(ship, _v, Math.max(keepAway - dist, SHIPS.SHIP_AVOID_RADIUS * 0.18), dt);
        }
      } else {
        // 船头只控制航行：远了才缓慢转向追击，进入炮击距离后保持前进航迹；
        // 炮台单独用 aimDir 追踪目标，避免整条船为了瞄准来回摆头。
        const targetDir = this._directionToTarget(ship, prey, normal, _v);
        let throttle = ship.speed * PIRATE_ATTACK_CRUISE;
        let navDir = null;
        if (targetDir) {
          const current = this._ensureSurfaceTangent(ship, normal, targetDir) || targetDir;
          const headingError = Math.abs(signedAngleInPlane(current, targetDir, normal));
          if (dist > PIRATE_ATTACK_STANDOFF + PIRATE_ATTACK_DEADBAND) {
            navDir = targetDir;
            throttle = SHIPS.PIRATE_SPEED_CHASE;
          } else if (dist < PIRATE_ATTACK_STANDOFF - PIRATE_ATTACK_DEADBAND) {
            navDir = targetDir.clone().negate();
            throttle = ship.speed * 0.62;
          } else if (headingError > Math.PI * 0.62) {
            navDir = targetDir;
            throttle = ship.speed * 0.48;
          }
        }
        const trafficScale = this._applyTrafficAvoidanceSteer(ship, navDir || ship.tangent, normal, PIRATE_NAV_TURN_RATE, dt);
        throttle *= trafficScale;
        this._advance(ship, throttle * dt, dt);   // 沿船头方向大圆推进
      }

      ship.fireCooldown -= dt;
      if (dist <= SHIPS.PIRATE_CANNON_RANGE && this._targetInAttackArc(ship, prey) && ship.fireCooldown <= 0) {
        ship.fireCooldown = nextCooldown(this.rng);
        this._fireCannon(ship, prey, time);
      }
    } else {
      if (this._updateRouteTransition(ship, dt)) return;
      ship.state = 'sailing';
      ship.patrolTimer += dt;
      this._updatePirateAim(ship, null, dt);
      // 随机游历：沿当前航线找商船，10 秒没遇到就换另一条航线。
      this._clearBlocked(ship, dt);
      this._advanceOnRoute(ship, ship.speed * dt, dt);
      if (ship.patrolTimer >= SHIPS.PIRATE_ROUTE_SEARCH_SECONDS) this._switchPirateRoute(ship);
    }
  }

  /** 猎物：商船 + 渡轮（海盗互不打），未沉，索敌半径内最近 */
  _findPrey(ship) {
    const locked = this._targetById(ship.targetId);
    if (locked && this._canKeepPirateTarget(ship, locked)) return locked;

    const best = this._nearestPrey(ship, SHIPS.PIRATE_SEEK_RADIUS, { avoidClaimed: true })
      || this._nearestPrey(ship, SHIPS.PIRATE_SEEK_RADIUS);
    ship.targetId = best ? vesselId(best) : null;
    return best;
  }

  _canKeepPirateTarget(ship, prey) {
    if (!this._isAttackablePrey(prey)) return false;
    const d = ship.position.distanceTo(prey.position);
    if (d > SHIPS.PIRATE_SEEK_RADIUS) return false;
    if (d <= SHIPS.PIRATE_CANNON_RANGE * 1.55) return true;
    const nearestInRange = this._nearestPrey(ship, SHIPS.PIRATE_CANNON_RANGE * 1.08);
    if (nearestInRange && nearestInRange !== prey) {
      ship.targetId = vesselId(nearestInRange);
      return false;
    }
    return true;
  }

  _nearestPrey(ship, maxDist, opts = {}) {
    let best = null, bestD = maxDist;
    for (const s of this.ships) {
      if (s === ship || s.kind === 'pirate' || !this._isAttackablePrey(s)) continue;
      if (opts.avoidClaimed && this._preyClaimedByOtherPirate(s, ship)) continue;
      const d = ship.position.distanceTo(s.position);
      if (d < bestD) { bestD = d; best = s; }
    }
    if (this.ferryProvider) {
      for (const f of this.ferryProvider()) {
        if (!this._isAttackablePrey(f)) continue;
        if (opts.avoidClaimed && this._preyClaimedByOtherPirate(f, ship)) continue;
        const d = ship.position.distanceTo(f.position);
        if (d < bestD) { bestD = d; best = f; }
      }
    }
    return best;
  }

  _isAttackablePrey(prey) {
    if (!prey || prey.kind === 'pirate' || prey.destroyed || prey.hiddenAfterDestroyed) return false;
    if (prey.object && prey.object.visible === false) return false;
    if (this._hasRepairProtection(prey)) return false;
    return true;
  }

  _hasRepairProtection(prey) {
    if (!prey) return false;
    if (prey.repairing || prey.state === 'repairing') return true;

    const hp = Number(prey.hp);
    const maxHp = Number(prey.maxHp);
    const progress = Number(prey.progress);
    return Number.isFinite(hp)
      && Number.isFinite(maxHp)
      && Number.isFinite(progress)
      && hp < maxHp
      && (progress < REPAIR_PROGRESS_EDGE || progress > 1 - REPAIR_PROGRESS_EDGE);
  }

  _preyClaimedByOtherPirate(prey, pirate) {
    const id = vesselId(prey);
    return this.ships.some((s) => s !== pirate && s.kind === 'pirate' && !s.destroyed && s.targetId === id);
  }

  _releasePirateClaims(prey) {
    const id = vesselId(prey);
    if (!id) return;
    for (const pirate of this.ships) {
      if (pirate.kind !== 'pirate' || pirate.destroyed || pirate.targetId !== id) continue;
      pirate.targetId = null;
      pirate.patrolTimer = SHIPS.PIRATE_ROUTE_SEARCH_SECONDS;
      if (pirate.state === 'chasing') pirate.state = 'sailing';
    }
  }

  _targetById(id) {
    if (!id) return null;
    for (const s of this.ships) if (vesselId(s) === id) return s;
    if (this.ferryProvider) {
      for (const f of this.ferryProvider()) if (vesselId(f) === id) return f;
    }
    return null;
  }

  _switchPirateRoute(ship) {
    const count = Math.max(1, this.routes?.count || 1);
    if (count <= 1) {
      ship.walked = 0;
      ship.patrolTimer = 0;
      return;
    }
    const current = ship.route;
    let next = current;
    for (let tries = 0; tries < 8 && next === current; tries++) {
      next = this.routes.pick(Math.floor(this.rng() * count));
    }
    if (next === current) next = this.routes.pick((this.routes.lines.indexOf(current) + 1) % count);
    const walked = this._nearestWalkedOnRoute(next, ship.position);
    ship.routeChange = { route: next, walked };
    ship.state = 'rerouting';
    ship.targetId = null;
    ship.patrolTimer = 0;
    ship.avoidOffset = 0;
  }

  _advanceOnRoute(ship, distance, dt = 1 / 60) {
    if (!ship.route || !Number.isFinite(distance) || distance <= 0) return false;
    const len = Math.max(ship.route.length || 0, 1e-6);
    const dir = Math.sign(ship.routeDir || 1) || 1;
    if (ship.position.lengthSq() < 1e-6) this._place(ship, 0, dt);

    const currentWalked = Number.isFinite(ship.walked)
      ? THREE.MathUtils.clamp(ship.walked, 0, len)
      : this._nearestWalkedOnRoute(ship.route, ship.position, ship);
    ship.walked = currentWalked;
    ship.progress = currentWalked / len;

    const remaining = dir > 0 ? len - currentWalked : currentWalked;
    if (remaining <= Math.max(ROUTE_ARRIVE_DISTANCE, distance * 1.35)) {
      if (!this._isRouteEndClose(ship, dir, len)) {
        ship.routeChange = { route: ship.route, walked: dir > 0 ? len : 0, rejoin: true, reason: 'routeEndCatchup' };
        ship.state = 'rerouting';
        ship.attackStatus = '接近终点航道';
        return false;
      }
      ship.walked = dir > 0 ? len : 0;
      ship.progress = dir > 0 ? 1 : 0;
      if (ship.kind !== 'pirate' && ship.hp < ship.maxHp) {
        ship.attackStatus = '抵岸，准备修理';
        return false;
      }
      this._beginTurnBack(ship, 'routeEnd');
      return false;
    }

    const lookAhead = THREE.MathUtils.clamp(
      Math.max(distance * 3.2, ship.speed * 2.4),
      ROUTE_LOOKAHEAD_MIN,
      ROUTE_LOOKAHEAD_MAX,
    );
    const targetWalked = THREE.MathUtils.clamp(currentWalked + dir * Math.min(lookAhead, remaining), 0, len);
    const targetPos = new THREE.Vector3();
    const targetTan = new THREE.Vector3();
    this._sampleRouteTargetAt(ship, ship.route, targetWalked, targetPos, targetTan, { wrap: false });

    const normal = getSurfaceNormal(ship.position, _n);
    _v.copy(targetPos).sub(ship.position);
    _v.addScaledVector(normal, -_v.dot(normal));
    let trafficScale = 1;
    if (_v.lengthSq() > 1e-8) {
      _v.normalize();
      trafficScale = this._applyTrafficAvoidanceSteer(ship, _v, normal, ROUTE_FOLLOW_TURN_RATE, dt);
    }

    const moved = this._advance(ship, distance * trafficScale, dt);
    if (moved) {
      const step = Math.max(0, distance * trafficScale);
      ship.walked = THREE.MathUtils.clamp(currentWalked + dir * step, 0, len);
    } else {
      ship.walked = currentWalked;
    }
    ship.progress = ship.walked / len;
    return moved;
  }

  _isRouteEndClose(ship, dir, len) {
    if (!ship?.route || !ship.position || ship.position.lengthSq() < 1e-8) return false;
    const endpoint = dir > 0 ? len : 0;
    const targetPos = new THREE.Vector3();
    const targetTan = new THREE.Vector3();
    this._sampleRouteTargetAt(ship, ship.route, endpoint, targetPos, targetTan, { wrap: false });
    const radius = this.routes?.sampler?.radius ?? 100;
    const d = surfaceDistance(ship.position, targetPos, radius);
    const arriveRadius = Math.max(ROUTE_ARRIVE_DISTANCE * 2.4, REROUTE_ATTACH_DISTANCE * 1.35, (ship.speed || 0) * 0.85);
    return d <= arriveRadius;
  }

  _sampleTravelAt(ship, route, walked, outPos = new THREE.Vector3(), outTan = new THREE.Vector3(), opts = {}) {
    const s = this.routes.sampleAt(route, walked, outPos, outTan, opts);
    if ((Math.sign(ship.routeDir || 1) || 1) < 0) outTan.negate();
    return s;
  }

  _sampleRouteTargetAt(ship, route, walked, outPos = new THREE.Vector3(), outTan = new THREE.Vector3(), opts = {}) {
    const s = this._sampleTravelAt(ship, route, walked, outPos, outTan, opts);
    const offset = routeOffsetFor(ship);
    if (offset) {
      const normal = getSurfaceNormal(outPos, new THREE.Vector3());
      const side = new THREE.Vector3().crossVectors(outTan, normal);
      if (side.lengthSq() > 1e-9) {
        const origin = outPos.clone();
        this._applySafeOffset(outPos, origin, side.normalize(), offset, ship);
      }
    }
    return s;
  }

  _markBlocked(ship, dt = 1 / 60, reason = 'blocked') {
    if (!ship || ship.destroyed || ship.repairing || ship.turnBack) return;
    ship.blockedTime = (ship.blockedTime || 0) + dt;
    if (ship.kind === 'merchant') ship.attackStatus = reason === 'traffic' ? '前方拥堵，准备掉头' : '前方不通，准备掉头';
    if (ship.blockedTime >= BLOCKED_TURN_SECONDS) this._beginTurnBack(ship, reason);
  }

  _clearBlocked(ship, dt = 1 / 60) {
    if (!ship || ship.turnBack) return;
    ship.blockedTime = Math.max(0, (ship.blockedTime || 0) - dt / Math.max(0.05, BLOCKED_DECAY));
    if (ship.blockedTime === 0 && ship.attackStatus === '前方拥堵，准备掉头') ship.attackStatus = '';
    if (ship.blockedTime === 0 && ship.attackStatus === '前方不通，准备掉头') ship.attackStatus = '';
  }

  _beginTurnBack(ship, reason = 'blocked') {
    if (!ship || ship.destroyed || ship.repairing || ship.turnBack) return false;
    if (ship.route) {
      const len = Math.max(ship.route.length || 0, 1e-6);
      if (reason === 'routeEnd') {
        ship.walked = (Math.sign(ship.routeDir || 1) || 1) > 0 ? len : 0;
      } else {
        const center = Number.isFinite(ship.walked) ? ship.walked : this._nearestWalkedOnRoute(ship.route, ship.position, ship);
        ship.walked = this._nearestWalkedNearRoute(ship.route, ship.position, ship, center, SHIPS.SHIP_AVOID_RADIUS * 0.75);
      }
      ship.progress = ship.walked / len;
    }
    const normal = getSurfaceNormal(ship.position, _n);
    if (!this._ensureSurfaceTangent(ship, normal)) return false;
    const target = ship.tangent.clone().addScaledVector(normal, -ship.tangent.dot(normal));
    if (target.lengthSq() < 1e-8) return false;
    target.normalize().negate();
    ship.turnBack = { target, reason, walked: ship.walked };
    ship.state = 'turningBack';
    ship.routeChange = null;
    ship.targetId = null;
    ship.fleeFromId = null;
    ship.waitTimer = 0;
    ship.avoidOffset = 0;
    ship.avoidLock = null;
    ship.blockedTime = 0;
    if (ship.kind === 'merchant') ship.attackStatus = reason === 'routeEnd' ? '到达端点，掉头返航' : '前方不通，掉头返航';
    return true;
  }

  _updateTurnBack(ship, dt) {
    const turn = ship.turnBack;
    if (!turn) return false;
    ship.state = 'turningBack';
    const normal = getSurfaceNormal(ship.position, _n);
    const target = turn.target.clone().addScaledVector(normal, -turn.target.dot(normal));
    if (target.lengthSq() < 1e-8) {
      this._finishTurnBack(ship);
      return true;
    }
    target.normalize();
    const current = ship.tangent.clone().addScaledVector(normal, -ship.tangent.dot(normal));
    if (current.lengthSq() < 1e-8) current.copy(target).negate();
    current.normalize();
    const angle = signedAngleInPlane(current, target, normal);
    const step = THREE.MathUtils.clamp(angle, -TURN_BACK_RATE * dt, TURN_BACK_RATE * dt);
    ship.tangent.copy(current.applyAxisAngle(normal, step)).normalize();
    if (ship.kind === 'pirate') this._updatePirateAim(ship, null, dt);
    if (Math.abs(angle) <= TURN_BACK_RATE * dt * 1.15) this._finishTurnBack(ship);
    return true;
  }

  _finishTurnBack(ship) {
    const turn = ship.turnBack;
    ship.routeDir = -(Math.sign(ship.routeDir || 1) || 1);
    if (ship.route) {
      const len = Math.max(ship.route.length || 0, 1e-6);
      const center = Number.isFinite(turn?.walked)
        ? turn.walked
        : (Number.isFinite(ship.walked) ? ship.walked : this._nearestWalkedOnRoute(ship.route, ship.position, ship));
      ship.walked = this._nearestWalkedNearRoute(ship.route, ship.position, ship, center, SHIPS.SHIP_AVOID_RADIUS * 0.75);
      ship.progress = ship.walked / len;
      this._sampleRouteTargetAt(ship, ship.route, ship.walked, this._pos, this._tan, { wrap: false });
      const rejoinDist = ship.position.distanceTo(this._pos);
      if (rejoinDist > ROUTE_REJOIN_DISTANCE) {
        ship.routeChange = { route: ship.route, walked: ship.walked, rejoin: true };
      } else {
        ship.tangent.copy(this._tan);
      }
    } else {
      const target = ship.turnBack?.target;
      if (target && target.lengthSq() > 1e-8) ship.tangent.copy(target).normalize();
    }
    ship.turnBack = null;
    ship.state = ship.routeChange ? 'rerouting' : 'sailing';
    ship.blockedTime = 0;
    ship.waitTimer = 0;
    ship.avoidOffset = 0;
    ship.avoidLock = null;
  }

  _updateRouteTransition(ship, dt) {
    const change = ship.routeChange;
    if (!change || !change.route) return false;

    const targetPos = new THREE.Vector3();
    const targetTan = new THREE.Vector3();
    this._sampleRouteTargetAt(ship, change.route, change.walked, targetPos, targetTan, { wrap: false });

    if (ship.position.lengthSq() < 1e-6) {
      ship.route = change.route;
      ship.walked = change.walked;
      ship.routeChange = null;
      ship.state = 'sailing';
      ship.tangent.copy(targetTan);
      ship.patrolTimer = 0;
      return true;
    }

    const normal = getSurfaceNormal(ship.position, _n);
    _v.copy(targetPos).sub(ship.position);
    _v.addScaledVector(normal, -_v.dot(normal));
    const dist = _v.length();
    if (dist <= REROUTE_ATTACH_DISTANCE) {
      ship.route = change.route;
      ship.walked = change.walked;
      ship.routeChange = null;
      ship.state = 'sailing';
      ship.tangent.copy(targetTan);
      ship.patrolTimer = 0;
      return true;
    }
    if (dist > 1e-8) {
      _v.normalize();
      this._steerToward(ship, _v, normal, 1.4, dt);
      this._advance(ship, Math.min(ship.speed * dt, dist), dt);
    }
    ship.state = 'rerouting';
    return true;
  }

  _targetInAttackArc(ship, prey) {
    const normal = getSurfaceNormal(ship.position, _n);
    _v.copy(prey.position).sub(ship.position);
    _v.addScaledVector(normal, -_v.dot(normal));
    if (_v.lengthSq() < 1e-8) return true;
    _v.normalize();
    const aim = this._aimVector(ship, normal);
    const angle = Math.abs(signedAngleInPlane(aim, _v, normal));
    return angle <= THREE.MathUtils.degToRad(PIRATE_TURRET_FIRE_ARC_DEG);
  }

  _cannonHitChance(ship, prey) {
    const dist = ship.position.distanceTo(prey.position);
    const distPenalty = THREE.MathUtils.clamp((dist - SHIPS.PIRATE_CANNON_RANGE * 0.45) / SHIPS.PIRATE_CANNON_RANGE, 0, 0.28);
    const speedAdvantage = (prey.speed || 0) - SHIPS.PIRATE_SPEED_CHASE;
    const speedPenalty = THREE.MathUtils.clamp(speedAdvantage * 0.08, -0.12, 0.34);
    const fleeingPenalty = prey.state === 'fleeing' ? 0.08 : 0;
    return THREE.MathUtils.clamp(0.82 - distPenalty - speedPenalty - fleeingPenalty, 0.24, 0.92);
  }

  /**
   * 开炮：fx 弹道 + 命中才结算（伤害 → DamageSystem 单一真相；
   * 按破坏程度 fx.setShipFire 分级着火；沉没 = hp 归零 Destroyed）。
   */
  _fireCannon(ship, prey, time) {
    const victimShip = prey?.ship || prey;
    if (!this._isAttackablePrey(victimShip)) {
      if (ship.targetId === vesselId(victimShip)) ship.targetId = null;
      return;
    }
    if (!this.damage) return;
    const victimObject = prey.object || prey.ship?.object;
    if (!victimObject) return;
    if (this.audio) { this.audio.cannon(); this.audio.cannonWhiz(); }
    const targetPos = prey.position.clone();
    const hitChance = this._cannonHitChance(ship, prey);
    const roll = this.rng();
    victimShip.attackerId = ship.id;
    victimShip.lastAttackAt = time;
    victimShip.lastShotChance = hitChance;
    if (roll > hitChance) {
      victimShip.attackStatus = '速度闪避成功';
      return;
    }
    const settle = () => {
      if (victimShip.destroyed) return;
      const dmg = SHIPS.PIRATE_CANNON_DAMAGE_MIN
        + this.rng() * (SHIPS.PIRATE_CANNON_DAMAGE_MAX - SHIPS.PIRATE_CANNON_DAMAGE_MIN);
      victimShip.attackStatus = '被 ' + ship.name + ' 命中';
      victimShip.lastHitAt = time;
      const ent = this.damage.applyDamage(victimObject, dmg, { source: ship.id, roll: 0.2 });
      if (!ent) return;
      victimShip.hp = ent.hp;
      const ratio = 1 - ent.hp / Math.max(1, ent.maxHp);
      if (this.fx) {
        victimShip.fireLevel = this.fx.setShipFire(victimObject, ratio);
        this.fx.spawnExplosion(currentObjectHitPoint(victimObject, victimShip.position), 5);
      }
      if (this.audio) this.audio.explosion();
      if (ent.destroyed) this._markDestroyed(victimShip, time);
    };
    if (this.fx) this.fx.spawnCannonShot(ship.object, targetPos, settle, time, { originWorld: this._cannonMuzzleWorld(ship) });
    else settle();
  }

  _directionToTarget(ship, prey, normal, out = new THREE.Vector3()) {
    if (!ship || !prey?.position) return null;
    out.copy(prey.position).sub(ship.position);
    out.addScaledVector(normal, -out.dot(normal));
    if (out.lengthSq() < 1e-8) return null;
    return out.normalize();
  }

  _ensureSurfaceTangent(ship, normal = null, fallback = null) {
    if (!ship?.tangent || !ship.position || ship.position.lengthSq() < 1e-8) return null;
    const n = normal || getSurfaceNormal(ship.position, new THREE.Vector3());
    const tangent = ship.tangent;

    tangent.addScaledVector(n, -tangent.dot(n));
    if (tangent.lengthSq() < TANGENT_MIN_LENGTH_SQ && fallback?.lengthSq?.() > TANGENT_MIN_LENGTH_SQ) {
      tangent.copy(fallback).addScaledVector(n, -fallback.dot(n));
    }

    if (tangent.lengthSq() < TANGENT_MIN_LENGTH_SQ && ship.route) {
      const routePos = new THREE.Vector3();
      const routeTan = new THREE.Vector3();
      const walked = Number.isFinite(ship.walked) ? ship.walked : 0;
      this._sampleTravelAt(ship, ship.route, walked, routePos, routeTan, { wrap: false });
      tangent.copy(routeTan).addScaledVector(n, -routeTan.dot(n));
    }

    if (tangent.lengthSq() < TANGENT_MIN_LENGTH_SQ && ship.motionWatch?.lastTan?.lengthSq?.() > TANGENT_MIN_LENGTH_SQ) {
      tangent.copy(ship.motionWatch.lastTan).addScaledVector(n, -ship.motionWatch.lastTan.dot(n));
    }

    if (tangent.lengthSq() < TANGENT_MIN_LENGTH_SQ) {
      tangent.set(0, 1, 0).addScaledVector(n, -n.y);
      if (tangent.lengthSq() < TANGENT_MIN_LENGTH_SQ) tangent.set(1, 0, 0).addScaledVector(n, -n.x);
    }

    if (tangent.lengthSq() < TANGENT_MIN_LENGTH_SQ) return null;
    return tangent.normalize();
  }

  _steerToward(ship, desiredDir, normal, rate, dt) {
    if (!ship || !desiredDir || desiredDir.lengthSq() < 1e-8) return false;
    desiredDir.addScaledVector(normal, -desiredDir.dot(normal));
    if (desiredDir.lengthSq() < 1e-8) return false;
    desiredDir.normalize();
    const current = this._ensureSurfaceTangent(ship, normal, desiredDir);
    if (!current) return false;
    const signed = signedAngleInPlane(current, desiredDir, normal);
    const yaw = THREE.MathUtils.clamp(signed, -rate * dt, rate * dt);
    ship.tangent.applyAxisAngle(normal, yaw).normalize();
    this._ensureSurfaceTangent(ship, normal, desiredDir);
    return true;
  }

  _updatePirateAim(ship, prey, dt = 1 / 60) {
    if (!ship || ship.kind !== 'pirate') return;
    const normal = getSurfaceNormal(ship.position.lengthSq() > 1e-8 ? ship.position : ship.object.position, new THREE.Vector3());
    const desired = prey ? this._directionToTarget(ship, prey, normal, new THREE.Vector3()) : null;
    const fallback = ship.tangent && ship.tangent.lengthSq() > 1e-8
      ? ship.tangent.clone()
      : new THREE.Vector3(0, 0, 1).projectOnPlane(normal);
    fallback.addScaledVector(normal, -fallback.dot(normal));
    if (fallback.lengthSq() < 1e-8) fallback.set(1, 0, 0).projectOnPlane(normal);
    fallback.normalize();

    if (!ship.aimDir) ship.aimDir = new THREE.Vector3();
    ship.aimDir.addScaledVector(normal, -ship.aimDir.dot(normal));
    if (ship.aimDir.lengthSq() < 1e-8) ship.aimDir.copy(fallback);
    ship.aimDir.normalize();

    const target = desired || fallback;
    const turn = signedAngleInPlane(ship.aimDir, target, normal);
    const step = THREE.MathUtils.clamp(turn, -PIRATE_TURRET_TURN_RATE * dt, PIRATE_TURRET_TURN_RATE * dt);
    ship.aimDir.applyAxisAngle(normal, step).normalize();
    this._syncCannonTurret(ship);
  }

  _aimVector(ship, normal) {
    const aim = ship.aimDir && ship.aimDir.lengthSq() > 1e-8
      ? ship.aimDir.clone()
      : ship.tangent.clone();
    aim.addScaledVector(normal, -aim.dot(normal));
    if (aim.lengthSq() < 1e-8) return ship.tangent.clone().normalize();
    return aim.normalize();
  }

  _syncCannonTurret(ship) {
    if (!ship?.cannon || !ship.object) return;
    const normal = getSurfaceNormal(ship.position.lengthSq() > 1e-8 ? ship.position : ship.object.position, new THREE.Vector3());
    const aim = this._aimVector(ship, normal);
    const localAim = aim.applyQuaternion(ship.object.quaternion.clone().invert());
    localAim.y = 0;
    if (localAim.lengthSq() < 1e-8) return;
    localAim.normalize();
    ship.cannon.rotation.y = Math.atan2(localAim.x, localAim.z);
  }

  _makePirateCannon(shipObject) {
    const turret = new THREE.Group();
    turret.name = 'PirateMovingCannon';
    turret.userData.muzzleLocal = new THREE.Vector3(0, 0.45, 2.25);
    const size = shipObject.userData.size || [4, 6, 12];
    turret.position.set(0, size[1] * 0.44, size[2] * 0.02);

    if (this.assets?.has?.('cannon')) {
      const cannon = this.assets.instance('cannon', { shadows: false, extraScale: 0.95 });
      cannon.name = 'PirateCannonModel';
      turret.add(cannon);
    } else {
      const base = new THREE.Mesh(
        new THREE.BoxGeometry(1.15, 0.32, 1.15),
        new THREE.MeshStandardMaterial({ color: 0x513222, roughness: 0.8 }),
      );
      const barrel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.26, 2.4, 10),
        new THREE.MeshStandardMaterial({ color: 0x15171c, roughness: 0.65 }),
      );
      barrel.rotation.x = Math.PI / 2;
      barrel.position.set(0, 0.38, 0.72);
      base.userData.ownsPirateCannonGeometry = true;
      barrel.userData.ownsPirateCannonGeometry = true;
      turret.add(base, barrel);
    }

    shipObject.add(turret);
    return turret;
  }

  _cannonMuzzleWorld(ship) {
    if (ship?.cannon) {
      ship.cannon.updateMatrixWorld(true);
      const muzzle = ship.cannon.userData.muzzleLocal || new THREE.Vector3(0, 0.45, 2.25);
      return ship.cannon.localToWorld(muzzle.clone());
    }
    return currentObjectHitPoint(ship?.object, ship?.position);
  }

  /** 沿当前切线在球面前进 d 世界单位（大圆推进：位置绕「法线×切线」轴转） */
  _advance(ship, d, dt = 1 / 60) {
    const R = this.routes?.sampler?.radius ?? 100;
    const angle = d / R;
    const normal = getSurfaceNormal(ship.position, _n);
    const before = ship.position.clone();
    const beforeTan = ship.tangent.clone();
    const tangent = this._ensureSurfaceTangent(ship, normal);
    if (!tangent) {
      this._markBlocked(ship, dt, 'coast');
      return false;
    }
    // 大圆推进 = 绕 (normal × tangent) 轴旋转位置
    _v.crossVectors(normal, tangent);
    if (_v.lengthSq() < TANGENT_MIN_LENGTH_SQ) {
      ship.tangent.copy(beforeTan);
      this._markBlocked(ship, dt, 'coast');
      return false;
    }
    _v.normalize();
    ship.position.applyAxisAngle(_v, angle);
    ship.tangent.applyAxisAngle(_v, angle);
    ship.position.setLength(R + SHIPS.POS_LIFT);   // 恒定海面上方（不穿球）
    this._ensureSurfaceTangent(ship, getSurfaceNormal(ship.position, new THREE.Vector3()), beforeTan);
    if (!this._isSafeWater(ship.position)) {
      ship.position.copy(before);
      ship.tangent.copy(beforeTan);
      this._beginTurnBack(ship, 'coast');
      return false;
    }
    this._clearBlocked(ship, dt);
    return true;
  }

  _isSafeWater(position) {
    const sampler = this.routes && this.routes.sampler;
    if (!sampler) return true;
    const ll = vector3ToLatLon(position);
    if (sampler.heightAt(ll.lat, ll.lon) > SHIP_WATER_HEIGHT_MAX) return false;
    for (const [dlat, dlonRaw] of WATER_PROBES) {
      const lat = THREE.MathUtils.clamp(ll.lat + dlat * SHIP_WATER_CLEARANCE_DEG, -72, 72);
      const lon = ll.lon + (dlonRaw * SHIP_WATER_CLEARANCE_DEG) / Math.max(0.25, Math.cos(THREE.MathUtils.degToRad(lat)));
      if (sampler.heightAt(lat, lon) > SHIP_WATER_PROBE_MAX) return false;
    }
    return true;
  }

  _updateForceForward(ship, dt) {
    if (!ship || ship.forceForwardTimer <= 0 || ship.destroyed || ship.repairing) return false;
    if (this._isPlannedRotationState(ship)) {
      ship.forceForwardTimer = 0;
      if (ship.attackStatus === '脱困直行') ship.attackStatus = '';
      return false;
    }
    ship.forceForwardTimer = Math.max(0, ship.forceForwardTimer - dt);
    ship.trafficPlan = null;
    ship.routeChange = null;
    ship.turnBack = null;
    ship.waitTimer = 0;
    ship.blockedTime = 0;
    ship.attackStatus = '脱困直行';
    const speed = Math.max(ship.speed || 0, SHIPS.PIRATE_SPEED_CHASE * 0.65);
    const distance = speed * STALL_FORCE_SPEED_SCALE * dt;
    const moved = this._advance(ship, distance, dt);
    if (!moved) ship.forceForwardTimer = 0;
    if (ship.route && moved) {
      const len = Math.max(ship.route.length || 1, 1e-6);
      const dir = Math.sign(ship.routeDir || 1) || 1;
      const current = Number.isFinite(ship.walked)
        ? THREE.MathUtils.clamp(ship.walked, 0, len)
        : this._nearestWalkedOnRoute(ship.route, ship.position, ship);
      ship.walked = THREE.MathUtils.clamp(current + dir * distance, 0, len);
      ship.progress = ship.walked / len;
    }
    if (moved && ship.forceForwardTimer <= 0 && ship.attackStatus === '脱困直行') ship.attackStatus = '';
    return true;
  }

  _updateMotionWatch(ship, dt) {
    if (!ship?.motionWatch || ship.destroyed || ship.repairing || !ship.position || !ship.tangent) return;
    const watch = ship.motionWatch;
    if (this._isPlannedRotationState(ship)) {
      watch.lastPos.copy(ship.position);
      watch.lastTan.copy(ship.tangent);
      watch.lastWalked = ship.walked;
      watch.lastRoute = ship.route;
      watch.stallTime = 0;
      return;
    }
    if (watch.lastRoute && watch.lastRoute !== ship.route) {
      watch.lastPos.copy(ship.position);
      watch.lastTan.copy(ship.tangent);
      watch.lastWalked = ship.walked;
      watch.lastRoute = ship.route;
      watch.stallTime = 0;
      return;
    }
    if (watch.lastPos.lengthSq() <= 1e-10 || watch.lastTan.lengthSq() <= 1e-10) {
      watch.lastPos.copy(ship.position);
      watch.lastTan.copy(ship.tangent);
      watch.lastWalked = ship.walked;
      watch.lastRoute = ship.route;
      watch.stallTime = 0;
      return;
    }

    const normal = getSurfaceNormal(ship.position, new THREE.Vector3());
    const previousForward = watch.lastTan.clone().addScaledVector(normal, -watch.lastTan.dot(normal));
    const currentForward = ship.tangent.clone().addScaledVector(normal, -ship.tangent.dot(normal));
    if (previousForward.lengthSq() < 1e-8 || currentForward.lengthSq() < 1e-8) {
      watch.lastPos.copy(ship.position);
      watch.lastTan.copy(ship.tangent);
      return;
    }
    previousForward.normalize();
    currentForward.normalize();

    const delta = ship.position.clone().sub(watch.lastPos);
    delta.addScaledVector(normal, -delta.dot(normal));
    const surfaceSpeed = delta.length() / Math.max(dt, 1e-4);
    const forwardSpeed = delta.dot(previousForward) / Math.max(dt, 1e-4);
    const walkedSpeed = Math.abs(routeWalkedDelta(ship, watch.lastWalked)) / Math.max(dt, 1e-4);
    const yawRate = Math.abs(signedAngleRad(previousForward, currentForward, normal)) / Math.max(dt, 1e-4);
    const coordinatesStill = surfaceSpeed < STALL_MIN_SURFACE && walkedSpeed < STALL_MIN_WALKED;
    const forwardCoordinateStill = forwardSpeed < STALL_MIN_FORWARD && coordinatesStill;
    const stuckRotating = forwardCoordinateStill && yawRate > STALL_YAW_MIN;
    watch.stallTime = stuckRotating
      ? watch.stallTime + dt
      : Math.max(0, watch.stallTime - dt * 1.6);

    if (watch.stallTime >= STALL_WATCH_SECONDS) {
      this._logMotionStallSnapshot(ship, { forwardSpeed, surfaceSpeed, walkedSpeed, yawRate, dt });
      ship.forceForwardTimer = Math.max(ship.forceForwardTimer || 0, STALL_FORCE_SECONDS);
      watch.stallTime = 0;
    }

    watch.lastPos.copy(ship.position);
    watch.lastTan.copy(ship.tangent);
    watch.lastWalked = ship.walked;
    watch.lastRoute = ship.route;
  }

  _isPlannedRotationState(ship) {
    return !!ship && (
      !!ship.turnBack
      || ship.state === 'turningBack'
      || ship.routeChange?.reason === 'routeEndCatchup'
      || ship.state === 'repairing'
      || ship.state === 'dock'
    );
  }

  _logMotionStallSnapshot(triggerShip, metrics = {}) {
    if (typeof console === 'undefined') return;
    const now = Date.now() / 1000;
    if (now - this._lastMotionSnapshotAt < STALL_DEBUG_LOG_COOLDOWN) return;
    this._lastMotionSnapshotAt = now;

    const triggerId = vesselId(triggerShip);
    const rows = this._avoidPool()
      .filter(Boolean)
      .map((ship) => this._motionSnapshotRow(ship, triggerId, metrics));

    console.warn('[ShipMotionWatch] 船疑似原地转向：坐标/航线前进量过低，但船头持续变化。已触发脱困直行。', {
      trigger: triggerShip?.name || triggerId,
      id: triggerId,
      forwardSpeed: round2(metrics.forwardSpeed),
      surfaceSpeed: round2(metrics.surfaceSpeed),
      walkedSpeed: round2(metrics.walkedSpeed),
      yawRate: round2(metrics.yawRate),
      dt: round3(metrics.dt),
    });
    if (typeof console.table === 'function') console.table(rows);
    else console.log(rows);
  }

  _motionSnapshotRow(ship, triggerId, metrics = {}) {
    const id = vesselId(ship);
    const pos = ship.position || ship.object?.position || new THREE.Vector3();
    const tan = ship.tangent || new THREE.Vector3();
    const ll = pos.lengthSq?.() > 1e-10 ? vector3ToLatLon(pos) : { lat: 0, lon: 0 };
    const route = ship.route
      ? `${ship.route.from?.name || '?'} -> ${ship.route.to?.name || '?'}`
      : '';
    const isTrigger = id === triggerId;
    return {
      trigger: isTrigger ? 'YES' : '',
      id,
      name: ship.name || '',
      kind: ship.kind || ship.typeLabel || '',
      state: ship.state || '',
      x: round2(pos.x),
      y: round2(pos.y),
      z: round2(pos.z),
      lat: round2(ll.lat),
      lon: round2(ll.lon),
      headingX: round3(tan.x),
      headingY: round3(tan.y),
      headingZ: round3(tan.z),
      walked: round2(ship.walked),
      progress: round3(ship.progress),
      speed: round2(ship.speed),
      routeDir: Math.sign(ship.routeDir || 1) || 1,
      route,
      hp: Number.isFinite(ship.hp) && Number.isFinite(ship.maxHp) ? `${Math.round(ship.hp)}/${Math.round(ship.maxHp)}` : '',
      targetId: ship.targetId || ship.fleeFromId || ship.attackerId || '',
      yieldingTo: ship.trafficPlan?.otherName || ship.avoidLock?.otherId || '',
      collisionRadius: round2(collisionRadiusFor(ship)),
      forceForward: round2(ship.forceForwardTimer),
      stallForward: isTrigger ? round2(metrics.forwardSpeed) : '',
      stallSurface: isTrigger ? round2(metrics.surfaceSpeed) : '',
      stallWalked: isTrigger ? round2(metrics.walkedSpeed) : '',
      stallYaw: isTrigger ? round2(metrics.yawRate) : '',
    };
  }

  traceShipForSeconds(shipOrId, now = 0, duration = DEBUG_SHIP_TRACE_SECONDS) {
    const ship = typeof shipOrId === 'string' ? this.getById(shipOrId) : shipOrId;
    if (!ship) return false;
    const id = vesselId(ship);
    const seconds = Math.max(0.5, Number(duration) || DEBUG_SHIP_TRACE_SECONDS);
    const trace = {
      id,
      ship,
      startAt: now,
      endAt: now + seconds,
      nextAt: now,
      interval: DEBUG_SHIP_TRACE_INTERVAL,
      basePos: ship.position?.clone?.() || new THREE.Vector3(),
      baseTan: ship.tangent?.clone?.() || new THREE.Vector3(),
      baseWalked: ship.walked,
      samples: [],
    };
    this._debugShipTraces.set(id, trace);
    this._sampleDebugShipTrace(trace, now);
    console.info('[ShipTrace] 开始记录船体坐标，5 秒后输出表格。', this._debugTraceHeader(ship, seconds));
    return true;
  }

  getByObject(object) {
    for (let o = object, i = 0; o && i < 12; o = o.parent, i++) {
      const id = o.userData?.shipId;
      if (id) return this.getById(id);
    }
    return null;
  }

  _updateDebugShipTraces(time) {
    if (!this._debugShipTraces.size) return;
    for (const [id, trace] of [...this._debugShipTraces.entries()]) {
      if (!trace.ship || trace.ship.destroyed || trace.ship.hiddenAfterDestroyed) {
        this._flushDebugShipTrace(trace, time, '船已销毁/隐藏');
        this._debugShipTraces.delete(id);
        continue;
      }
      if (time >= trace.nextAt) {
        this._sampleDebugShipTrace(trace, time);
        trace.nextAt = time + trace.interval;
      }
      if (time >= trace.endAt) {
        this._flushDebugShipTrace(trace, time, '完成');
        this._debugShipTraces.delete(id);
      }
    }
  }

  _sampleDebugShipTrace(trace, time) {
    const ship = trace.ship;
    const pos = ship.position || ship.object?.position || new THREE.Vector3();
    const tan = ship.tangent || new THREE.Vector3();
    const ll = pos.lengthSq?.() > 1e-10 ? vector3ToLatLon(pos) : { lat: 0, lon: 0 };
    const radius = this.routes?.sampler?.radius ?? 100;
    trace.samples.push({
      sample: trace.samples.length,
      t: round2(time - trace.startAt),
      name: ship.name || '',
      state: ship.state || '',
      x: round2(pos.x),
      y: round2(pos.y),
      z: round2(pos.z),
      lat: round2(ll.lat),
      lon: round2(ll.lon),
      headingX: round3(tan.x),
      headingY: round3(tan.y),
      headingZ: round3(tan.z),
      movedFromStart: round2(surfaceDistance(trace.basePos, pos, radius)),
      walkedDelta: round2(routeWalkedDelta(ship, trace.baseWalked)),
      walked: round2(ship.walked),
      progress: round3(ship.progress),
      speed: round2(ship.speed),
      routeDir: Math.sign(ship.routeDir || 1) || 1,
      yieldingTo: ship.trafficPlan?.otherName || ship.avoidLock?.otherId || '',
      status: ship.attackStatus || '',
      forceForward: round2(ship.forceForwardTimer),
    });
  }

  _flushDebugShipTrace(trace, time, reason = '完成') {
    if (!trace.samples.length) this._sampleDebugShipTrace(trace, time);
    console.info('[ShipTrace] ' + reason + '：' + (trace.ship?.name || trace.id) + '，共 ' + trace.samples.length + ' 个采样点。');
    if (typeof console.table === 'function') console.table(trace.samples);
    else console.log(trace.samples);
  }

  _debugTraceHeader(ship, seconds) {
    const pos = ship.position || new THREE.Vector3();
    const ll = pos.lengthSq?.() > 1e-10 ? vector3ToLatLon(pos) : { lat: 0, lon: 0 };
    return {
      id: ship.id,
      name: ship.name,
      kind: ship.kind,
      state: ship.state,
      seconds,
      lat: round2(ll.lat),
      lon: round2(ll.lon),
      route: ship.route ? `${ship.route.from?.name || '?'} -> ${ship.route.to?.name || '?'}` : '',
    };
  }

  _avoidPool() {
    const ferries = this.ferryProvider ? this.ferryProvider() : [];
    return [...this.ships, ...ferries].filter(Boolean);
  }

  _blocksWaterway(vessel) {
    return !!vessel && !vessel.destroyed && vessel.state !== 'wreck' && vessel.position && vessel.position.lengthSq() > 1e-6;
  }

  _canYield(vessel) {
    return this._blocksWaterway(vessel) && vessel.state !== 'dock' && !vessel.repairing;
  }

  _circlePairRadius(a, b) {
    return collisionRadiusFor(a) + collisionRadiusFor(b);
  }

  _repelVessel(vessel, other, desiredAway, normal, overlap, dt) {
    if (!this._canYield(vessel)) return;
    desiredAway.addScaledVector(normal, -desiredAway.dot(normal));
    if (desiredAway.lengthSq() < 1e-9) return;
    desiredAway.normalize();

    if (vessel.driveMode === 'live' || vessel.state === 'chasing' || vessel.state === 'fleeing' || vessel.state === 'rerouting') {
      this._pushLiveVessel(vessel, desiredAway, SEPARATION_PUSH * Math.max(overlap, 0.35), dt);
      return;
    }

    const side = this._avoidSide(vessel, other, desiredAway, normal);
    const wanted = THREE.MathUtils.clamp(
      (vessel.avoidOffset || 0) + side * SHIPS.SHIP_AVOID_RADIUS * (0.55 + overlap),
      -AVOID_OFFSET_MAX,
      AVOID_OFFSET_MAX,
    );
    vessel.avoidOffset = approach(vessel.avoidOffset || 0, wanted, AVOID_OFFSET_RATE * dt);
    this._nudgeAlongRoute(vessel, desiredAway, SHIPS.SHIP_AVOID_RADIUS * overlap * 0.55, dt);
    if (vessel.kind === 'merchant' && other && other.kind !== 'pirate' && overlap > 0.35) vessel.waitTimer = Math.max(vessel.waitTimer || 0, 0.45);
  }

  _avoidSide(vessel, other, desiredAway, normal) {
    const otherId = vesselId(other);
    const d = other?.position ? vessel.position.distanceTo(other.position) : Infinity;
    if (vessel.avoidLock && vessel.avoidLock.otherId === otherId && d < SHIPS.SHIP_AVOID_RADIUS * 1.55) {
      return vessel.avoidLock.side;
    }
    if (vessel.avoidLock && d >= SHIPS.SHIP_AVOID_RADIUS * 1.55) vessel.avoidLock = null;
    const tangent = this._ensureSurfaceTangent(vessel, normal, desiredAway) || desiredAway;
    const raw = signedAngleRad(tangent, desiredAway, normal);
    const fallback = stableSide(vesselId(vessel), otherId) * Math.sign(vessel.laneOffset || 1);
    const side = Math.sign(raw || fallback || 1);
    vessel.avoidLock = { otherId, side };
    return side;
  }

  _pushLiveVessel(vessel, desiredAway, amount, dt = 1 / 60) {
    if (!vessel.position || !Number.isFinite(amount)) return false;
    const before = vessel.position.clone();
    const beforeTan = vessel.tangent?.clone?.() || null;
    const step = Math.min(amount, LIVE_PUSH_RATE * dt);
    vessel.position.addScaledVector(desiredAway, step).setLength((this.routes?.sampler?.radius ?? 100) + SHIPS.POS_LIFT);
    this._ensureSurfaceTangent(vessel, getSurfaceNormal(vessel.position, new THREE.Vector3()), beforeTan || desiredAway);
    if (!this._isSafeWater(vessel.position)) {
      vessel.position.copy(before);
      if (beforeTan && vessel.tangent) vessel.tangent.copy(beforeTan);
      this._markBlocked(vessel, dt, 'traffic');
      return false;
    }
    this._clearBlocked(vessel, dt);
    return true;
  }

  _applySafeOffset(out, origin, side, offset, vessel) {
    const scales = [1, 0.75, 0.5, 0.25];
    for (const scale of scales) {
      out.copy(origin).addScaledVector(side, offset * scale).setLength(origin.length());
      if (this._isSafeWater(out)) return true;
    }
    out.copy(origin);
    return false;
  }

  _nudgeAlongRoute(vessel, desiredAway, amount, dt = 1 / 60) {
    if (!vessel.route || typeof vessel.walked !== 'number' || !Number.isFinite(amount) || amount <= 0) return;
    const len = Math.max(vessel.route.length || 0, 1e-6);
    const along = desiredAway.dot(vessel.tangent || _v2.set(1, 0, 0));
    if (Math.abs(along) < 0.08) return;
    const travelSign = vessel.object?.userData?.isFerry
      ? (vessel.atFrom === false ? -1 : 1)
      : (Math.sign(vessel.routeDir || 1) || 1);
    const step = Math.min(amount, ROUTE_NUDGE_RATE * dt);
    vessel.walked += Math.sign(along) * travelSign * step;
    if (vessel.object?.userData?.isFerry) vessel.walked = THREE.MathUtils.clamp(vessel.walked, 0, len);
    else vessel.walked = ((vessel.walked % len) + len) % len;
  }

  _syncDamage(ship, time = 0) {
    const ent = this.damage ? this.damage.registry.get(ship.object) : null;
    if (!ent) return;
    ship.hp = ent.hp;
    if (ent.destroyed) {
      this._markDestroyed(ship, time);
      return;
    }
    if (this.fx) ship.fireLevel = this.fx.setShipFire(ship.object, 1 - ent.hp / Math.max(1, ent.maxHp));
  }

  _markDestroyed(ship, time = 0) {
    if (!ship || (ship.destroyed && ship.destroyedAt !== null)) return;
    ship.destroyed = true;
    ship.destroyedAt = time;
    ship.removeAt = time + (SHIPS.DESTROYED_SHIP_HIDE_SECONDS ?? 1);
    ship.state = 'destroyed';
    ship.hp = 0;
    ship.targetId = null;
    ship.fleeFromId = null;
    ship.waitTimer = 0;
    ship.avoidOffset = 0;
    ship.attackStatus = '已被摧毁';
    if (ship.object) {
      ship.object.userData.destroyed = true;
      ship.object.userData.hp = 0;
      ship.object.visible = true;
    }
    if (ship.searchRange) ship.searchRange.visible = false;
    if (ship.collisionRing) ship.collisionRing.visible = false;
    if (this.fx) ship.fireLevel = this.fx.setShipFire(ship.object, 1);
  }

  _updateDestroyedShip(ship, time) {
    if (ship.destroyedAt === null) this._markDestroyed(ship, time);
    if (ship.hiddenAfterDestroyed || time < ship.removeAt) return;
    ship.hiddenAfterDestroyed = true;
    if (this.fx) this.fx.clearShipFire(ship.object);
    if (ship.object) {
      ship.object.visible = false;
      this.group.remove(ship.object);
    }
    if (ship.searchRange) {
      ship.searchRange.visible = false;
      this.group.remove(ship.searchRange);
    }
    if (ship.collisionRing) {
      ship.collisionRing.visible = false;
      ship.collisionRing.geometry?.dispose?.();
      ship.collisionRing.material?.dispose?.();
      this.group.remove(ship.collisionRing);
    }
  }

  _makeSearchRange() {
    const positions = new Float32Array(SEARCH_RANGE_SEGMENTS * 3);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.LineBasicMaterial({
      color: 0xff5a4f,
      transparent: true,
      opacity: 0.38,
      depthWrite: false,
    });
    const ring = new THREE.LineLoop(geometry, material);
    ring.name = 'PirateSearchRange';
    ring.visible = false;
    ring.frustumCulled = false;
    ring.renderOrder = 2;
    this.group.add(ring);
    return ring;
  }

  _makeCollisionRing(ship) {
    const positions = new Float32Array(COLLISION_RING_SEGMENTS * 3);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.LineBasicMaterial({
      color: ship.kind === 'pirate' ? 0xffb45f : 0x78e8ff,
      transparent: true,
      opacity: COLLISION_RING_OPACITY,
      depthWrite: false,
    });
    const ring = new THREE.LineLoop(geometry, material);
    ring.name = 'ShipCollisionCircle:' + ship.id;
    ring.visible = false;
    ring.frustumCulled = false;
    ring.renderOrder = 2;
    this.group.add(ring);
    return ring;
  }

  _updateCollisionRing(ship) {
    const ring = ship?.collisionRing;
    if (!ring) return;
    ring.visible = !ship.destroyed && !!ship.object?.visible && !!ship.position && ship.position.lengthSq() > 1e-8;
    if (!ring.visible) return;
    const radius = this.routes?.sampler?.radius ?? 100;
    const visualRadius = radius + SHIPS.POS_LIFT + 0.13;
    const angularRadius = THREE.MathUtils.clamp(collisionRadiusFor(ship) / radius, 0.002, Math.PI * 0.42);
    const center = ship.position.clone().normalize();
    const forward = ship.tangent && ship.tangent.lengthSq() > 1e-8
      ? ship.tangent.clone().addScaledVector(center, -ship.tangent.dot(center)).normalize()
      : new THREE.Vector3(0, 1, 0).projectOnPlane(center).normalize();
    if (forward.lengthSq() < 1e-8) forward.set(1, 0, 0).projectOnPlane(center).normalize();
    const side = new THREE.Vector3().crossVectors(center, forward).normalize();
    const attr = ring.geometry.getAttribute('position');
    for (let i = 0; i < COLLISION_RING_SEGMENTS; i++) {
      const a = (i / COLLISION_RING_SEGMENTS) * Math.PI * 2;
      _v.copy(center).multiplyScalar(Math.cos(angularRadius))
        .addScaledVector(forward, Math.cos(a) * Math.sin(angularRadius))
        .addScaledVector(side, Math.sin(a) * Math.sin(angularRadius))
        .normalize()
        .multiplyScalar(visualRadius);
      attr.setXYZ(i, _v.x, _v.y, _v.z);
    }
    attr.needsUpdate = true;
    ring.geometry.computeBoundingSphere();
  }

  _updateSearchRange(ship) {
    if (ship.kind !== 'pirate' || !ship.searchRange) return;
    const ring = ship.searchRange;
    ring.visible = !ship.destroyed && !!ship.object?.visible;
    if (!ring.visible || !ship.position || ship.position.lengthSq() < 1e-6) return;
    const radius = this.routes?.sampler?.radius ?? 100;
    const visualRadius = radius + SHIPS.POS_LIFT + 0.08;
    const angularRadius = THREE.MathUtils.clamp(SHIPS.PIRATE_SEEK_RADIUS / radius, 0.01, Math.PI * 0.92);
    const center = ship.position.clone().normalize();
    const forward = (ship.tangent && ship.tangent.lengthSq() > 1e-8)
      ? ship.tangent.clone().addScaledVector(center, -ship.tangent.dot(center)).normalize()
      : new THREE.Vector3(0, 1, 0).projectOnPlane(center).normalize();
    if (forward.lengthSq() < 1e-8) forward.set(1, 0, 0).projectOnPlane(center).normalize();
    const side = new THREE.Vector3().crossVectors(center, forward).normalize();
    const attr = ring.geometry.getAttribute('position');
    for (let i = 0; i < SEARCH_RANGE_SEGMENTS; i++) {
      const a = (i / SEARCH_RANGE_SEGMENTS) * Math.PI * 2;
      _v.copy(center).multiplyScalar(Math.cos(angularRadius))
        .addScaledVector(forward, Math.cos(a) * Math.sin(angularRadius))
        .addScaledVector(side, Math.sin(a) * Math.sin(angularRadius))
        .normalize()
        .multiplyScalar(visualRadius);
      attr.setXYZ(i, _v.x, _v.y, _v.z);
    }
    attr.needsUpdate = true;
    ring.geometry.computeBoundingSphere();
  }

  _updateRepairIfDocked(ship, dt) {
    if (ship.kind === 'pirate' || ship.destroyed || ship.hp >= ship.maxHp) return false;
    const nearDock = ship.progress < REPAIR_PROGRESS_EDGE || ship.progress > 1 - REPAIR_PROGRESS_EDGE;
    if (!ship.repairing && !nearDock) return false;

    if (!ship.repairing) {
      ship.repairing = true;
      ship.state = 'repairing';
      ship.avoidOffset = 0;
      ship.fleeFromId = null;
      ship.attackerId = null;
      ship.attackStatus = '靠岸修理中';
      ship.lastAttackAt = -Infinity;
      ship.repairPose = this._makeRepairPose(ship);
      ship.repairPinged = true;
      this._releasePirateClaims(ship);
      if (this.audio) this.audio.repairPing();
      if (this.fx) this.fx.setRepairBeacon(ship.object, true);
    } else {
      this._releasePirateClaims(ship);
    }
    const healed = this.damage ? this.damage.applyRepair(ship.object, SHIPS.REPAIR_HP_PER_SECOND * dt) : 0;
    ship.hp = Math.min(ship.maxHp, ship.hp + healed);
    if (this.fx) ship.fireLevel = this.fx.setShipFire(ship.object, 1 - ship.hp / Math.max(1, ship.maxHp));
    if (ship.hp >= ship.maxHp) {
      ship.repairing = false;
      ship.repairPose = null;
      ship.repairPinged = false;
      ship.state = 'sailing';
      ship.attackerId = null;
      ship.fleeFromId = null;
      ship.attackStatus = '';
      ship.lastShotChance = 0;
      if (this.fx) this.fx.setRepairBeacon(ship.object, false);
    }
    return true;
  }

  _makeRepairPose(ship) {
    const base = ship.position.clone().setLength((this.routes?.sampler?.radius ?? 100) + SHIPS.POS_LIFT);
    const normal = getSurfaceNormal(base, new THREE.Vector3());
    const tangent = ship.tangent.clone().normalize();
    const side = new THREE.Vector3().crossVectors(tangent, normal).normalize();
    const signs = [1, -1, 2, -2, 3, -3, 0];
    for (const s of signs) {
      const candidate = base.clone().addScaledVector(side, s * LANE_OFFSET_STEP).setLength(base.length());
      if (!this._isSafeWater(candidate)) continue;
      if (!this._isBerthFree(candidate, ship, SHIPS.SHIP_AVOID_RADIUS * 1.05)) continue;
      return { position: candidate, tangent, t: ship.progress };
    }
    return { position: base, tangent, t: ship.progress };
  }

  _isBerthFree(position, self, minDist = SHIPS.SHIP_AVOID_RADIUS) {
    for (const other of this._avoidPool()) {
      if (other === self || !this._blocksWaterway(other)) continue;
      if (position.distanceTo(other.position) < minDist) return false;
    }
    return true;
  }

  _nearestWalkedOnRoute(route, position, ship = null) {
    const p = new THREE.Vector3();
    const t = new THREE.Vector3();
    const len = Math.max(route.length || 0, 1e-6);
    let bestWalked = 0;
    let bestD = Infinity;

    const score = (walked) => {
      const clamped = THREE.MathUtils.clamp(walked, 0, len);
      if (ship) this._sampleRouteTargetAt(ship, route, clamped, p, t, { wrap: false });
      else this.routes.sampleAt(route, clamped, p, t, { wrap: false });
      const d = p.distanceTo(position);
      if (d < bestD) {
        bestD = d;
        bestWalked = clamped;
      }
    };

    const samples = 96;
    for (let i = 0; i <= samples; i++) score((len * i) / samples);

    const span = len / samples;
    for (let i = -8; i <= 8; i++) score(bestWalked + (span * i) / 8);
    for (let i = -6; i <= 6; i++) score(bestWalked + (span * i) / 48);

    return bestWalked;
  }

  _nearestWalkedNearRoute(route, position, ship = null, centerWalked = 0, range = SHIPS.SHIP_AVOID_RADIUS * 0.75) {
    const len = Math.max(route.length || 0, 1e-6);
    const center = Number.isFinite(centerWalked)
      ? THREE.MathUtils.clamp(centerWalked, 0, len)
      : this._nearestWalkedOnRoute(route, position, ship);
    const span = Math.max(ROUTE_ARRIVE_DISTANCE * 2, Math.abs(range));
    const lo = Math.max(0, center - span);
    const hi = Math.min(len, center + span);
    const p = new THREE.Vector3();
    const t = new THREE.Vector3();
    let bestWalked = center;
    let bestD = Infinity;

    const score = (walked) => {
      const clamped = THREE.MathUtils.clamp(walked, 0, len);
      if (ship) this._sampleRouteTargetAt(ship, route, clamped, p, t, { wrap: false });
      else this.routes.sampleAt(route, clamped, p, t, { wrap: false });
      const d = p.distanceTo(position);
      if (d < bestD) {
        bestD = d;
        bestWalked = clamped;
      }
    };

    const samples = 24;
    for (let i = 0; i <= samples; i++) score(lo + ((hi - lo) * i) / samples);

    const refine = Math.max((hi - lo) / samples, ROUTE_ARRIVE_DISTANCE * 0.35);
    for (let i = -6; i <= 6; i++) score(bestWalked + (refine * i) / 6);
    return bestWalked;
  }

  getById(id) { return this.ships.find((s) => s.id === id) || null; }

  setVisible(v) { this.group.visible = !!v; }

  clear() {
    for (const s of this.ships) {
      if (this.fx) this.fx.clearShipFire(s.object);
      this.group.remove(s.object);
      if (s.searchRange) {
        s.searchRange.geometry?.dispose?.();
        s.searchRange.material?.dispose?.();
        this.group.remove(s.searchRange);
      }
      if (s.collisionRing) {
        s.collisionRing.geometry?.dispose?.();
        s.collisionRing.material?.dispose?.();
        this.group.remove(s.collisionRing);
      }
    }
    this.ships.length = 0;
    this._debugShipTraces.clear();
    if (this.fx) this.fx.clear();
  }

  describe(ship) {
    return {
      name: ship.name,
      type: ship.typeLabel,
      model: ship.model,
      from: ship.route.from.name,
      to: ship.route.to.name,
      status: ship.state,
      hp: ship.hp,
      maxHp: ship.maxHp,
      yieldPriority: ship.yieldPriority,
      trafficBoost: ship.trafficBoost,
      yieldingTo: ship.trafficPlan?.otherName || '',
      collisionRadius: ship.collisionRadius,
      forceForward: ship.forceForwardTimer,
      fire: ship.fireLevel,
      progress: ship.progress,
    };
  }

  summary() {
    return {
      ships: this.ships.length,
      pirates: this.ships.filter((s) => s.kind === 'pirate').length,
      chasing: this.ships.filter((s) => s.state === 'chasing').length,
      sunk: this.ships.filter((s) => s.destroyed).length,
      models: [...new Set(this.ships.map((s) => s.model))],
      drawing: this.group.visible,
    };
  }

  merchantStatus() {
    return this.ships
      .filter((s) => s.kind === 'merchant')
      .map((s) => ({
        id: s.id,
        name: s.name,
        hp: s.hp,
        maxHp: s.maxHp,
        speed: s.speed,
        yieldPriority: s.yieldPriority,
        trafficBoost: s.trafficBoost,
        yieldingTo: s.trafficPlan?.otherName || '',
        collisionRadius: s.collisionRadius,
        forceForward: s.forceForwardTimer,
        state: s.state,
        destroyed: s.destroyed,
        attackerId: s.attackerId,
        attackStatus: s.attackStatus,
        lastShotChance: s.lastShotChance,
      }));
  }
}

/** 切平面内 a→b 的带符号角（绕法线 n 为正） */
function signedAngleInPlane(a, b, n) {
  const x = a.dot(b);
  const y = _v2.crossVectors(a, b).dot(n);
  return Math.atan2(y, x);
}

/** 炮击冷却（config.SHIPS.PIRATE_CANNON_COOLDOWN 区间随机） */
function nextCooldown(rng) {
  const [c0, c1] = SHIPS.PIRATE_CANNON_COOLDOWN;
  return c0 + rng() * (c1 - c0);
}

function pickShipType(index, availableByKind, fallback) {
  const pirateCount = SHIPS.PIRATE_COUNT ?? 1;
  const pattern = index < pirateCount ? ['pirate'] : ['merchant'];
  const preferred = pattern[index % pattern.length];
  const pool = availableByKind[preferred] || [];
  if (pool.length) {
    return { kind: preferred, model: pool[index % pool.length] };
  }
  return fallback[index % fallback.length];
}

function cruiseSpeedFor(kind, rng) {
  const base = SHIPS.PIRATE_SPEED_CHASE;
  if (kind === 'merchant') return base * (0.88 + rng() * 0.42);
  return base * (0.92 + rng() * 0.28);
}

function trafficPriority(vessel) {
  if (!vessel) return 0;
  if (vessel.repairing || vessel.state === 'repairing' || vessel.state === 'dock') return 100000;
  return Number.isFinite(vessel.yieldPriority) ? vessel.yieldPriority : 0;
}

function collisionRadiusFor(vessel) {
  if (Number.isFinite(vessel?.collisionRadius) && vessel.collisionRadius > 0) return vessel.collisionRadius;
  const radius = shipLengthRadius(vessel?.object);
  if (vessel) vessel.collisionRadius = radius;
  return radius;
}

function shipLengthRadius(object) {
  const size = object?.userData?.size || [4, 6, 12];
  const spec = object?.userData?.spec || {};
  const unit = Number.isFinite(spec.unit) ? spec.unit : 1;
  const length = Math.max(size[2] || 0, size[0] || 0, 12);
  return Math.max(6, length * unit);
}

function routeWalkedDelta(ship, previousWalked) {
  const current = Number(ship?.walked);
  const previous = Number(previousWalked);
  if (!Number.isFinite(current) || !Number.isFinite(previous)) return 0;
  const len = Number(ship?.route?.length) || 0;
  let delta = current - previous;
  if (len > 1e-6 && Math.abs(delta) > len * 0.5) delta -= Math.sign(delta) * len;
  return delta;
}

function round2(value) {
  return Number.isFinite(value) ? Math.round(value * 100) / 100 : value;
}

function round3(value) {
  return Number.isFinite(value) ? Math.round(value * 1000) / 1000 : value;
}

function surfaceDistance(a, b, radius = 100) {
  if (!a || !b || a.lengthSq?.() <= 1e-10 || b.lengthSq?.() <= 1e-10) return Infinity;
  const dot = THREE.MathUtils.clamp(a.clone().normalize().dot(b.clone().normalize()), -1, 1);
  return Math.acos(dot) * radius;
}

function spawnRouteStride(count) {
  if (count <= 2) return 1;
  let stride = count - 1;
  while (stride > 1 && gcd(stride, count) !== 1) stride--;
  return stride;
}

function gcd(a, b) {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y) {
    const r = x % y;
    x = y;
    y = r;
  }
  return x || 1;
}

function laneOffsetFor(index) {
  const lanes = [-1, 1, -2, 2, 0, -3, 3];
  return lanes[index % lanes.length] * LANE_OFFSET_STEP;
}

function routeOffsetFor(ship) {
  const dir = Math.sign(ship.routeDir || 1) || 1;
  return (ship.laneOffset || 0) * dir + (ship.avoidOffset || 0);
}

function vesselId(vessel) {
  return vessel?.id || vessel?.object?.uuid || vessel?.name || '';
}

function currentObjectHitPoint(object, fallback) {
  if (!object) return fallback ? fallback.clone() : new THREE.Vector3();
  object.updateMatrixWorld(true);
  const size = object.userData.size || [4, 6, 12];
  return object.localToWorld(new THREE.Vector3(0, size[1] * 0.45, 0));
}

function modelAxes(object) {
  const spec = object?.userData?.spec || {};
  return {
    upAxis: spec.up || 'y',
    forwardAxis: spec.forward || 'z',
  };
}

function approach(current, target, maxStep) {
  if (Math.abs(target - current) <= maxStep) return target;
  return current + Math.sign(target - current) * maxStep;
}

function stableSide(a, b) {
  const s = String(a) + '|' + String(b);
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return (h & 1) ? 1 : -1;
}

export { DRAFT };
