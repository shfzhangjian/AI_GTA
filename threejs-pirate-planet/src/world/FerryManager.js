/**
 * FerryManager.js — 渡轮：靠岸停靠 + 乘客排队上下船 + 修理（跨港旅行）
 *
 * 用户要求（本轮）：
 *   · 船只靠岸要**停下**（不能消失）：到 B 港 → 停泊 FERRY.DOCK_SECONDS → 开回 A 港停泊，循环
 *   · 乘客**有上船下船效果**：角色/动物沿「岸 ↔ 船」走廊步行（全程可见地走，不瞬移不消失）
 *   · 每次载入 ≤ FERRY.CAPACITY(5) 人（角色优先、动物补位）
 *   · 被海盗打伤 → 到岸**修理**：头顶旋转修理环（CombatFx.setRepairBeacon）+ 缓慢回血
 *   · 吃水线：与 ShipManager 同款 SeaSwell 漂浮，DRAFT_FERRY 压过 ROUTE_LIFT → 泡在水里
 *
 * 状态机：sail → dock（下船+上船+修理）→ sail（反向）→ dock → 循环
 * ⚠ 船模 scale 只来自 ModelUtils.MODEL_SPECS；球面姿态只走 GeoUtils；血量只走 DamageSystem。
 */
import * as THREE from 'three';
import { FERRY, SHIPS } from '../config.js';
import { alignObjectToSurface, getSurfaceNormal, vector3ToLatLon } from '../utils/GeoUtils.js';
import { mulberry32 } from '../planet/Clouds.js';
import { findClearSpot } from './WalkerBase.js';
import { waveHeight, waveTilt } from './SeaSwell.js';

const DRAFT = SHIPS.DRAFT_FERRY;      // 吃水（config 唯一来源，≈ ROUTE_LIFT → 泡在水里）
const WALK_SPEED = 1.5;               // 乘客上下船步行速度（世界单位/秒）
const AVOID_OFFSET_MAX = SHIPS.SHIP_AVOID_RADIUS * 0.95;
const AVOID_OFFSET_DAMP = 1.15;
const LANE_OFFSET_STEP = SHIPS.SHIP_AVOID_RADIUS * 0.24;
const VISUAL_SEPARATION_RADIUS = SHIPS.SHIP_AVOID_RADIUS * 0.92;
// Land.js 海面高度为 -0.04；安全水域阈值必须略高于它。
const FERRY_WATER_HEIGHT_MAX = 0.03;
const FERRY_WATER_PROBE_MAX = 0.12;
const FERRY_WATER_CLEARANCE_DEG = 1.6;
const DOCK_SEARCH_MAX_DEG = 28;

export class FerryManager {
  /**
   * @param {{sceneManager, assets, routes, sampler, characters, pets, occupancy?, damageSystem?, fx?, group?, seed?}} deps
   */
  constructor(deps) {
    this.sm = deps.sceneManager;
    this.assets = deps.assets;
    this.routes = deps.routes;
    this.sampler = deps.sampler;
    this.characters = deps.characters || null;
    this.pets = deps.pets || null;
    this.occupancy = deps.occupancy || null;
    this.damage = deps.damageSystem || null;
    this.fx = deps.fx || null;
    /** 音效（AudioFx，可选） */
    this.audio = deps.audio || null;
    this.group = deps.group || this.sm.ships;
    this.rng = mulberry32(deps.seed ?? 97531);

    /** @type {Array<object>} 渡轮记录 */
    this.ferries = [];
    this.shipProvider = null;
    this.stats = { boarded: 0, landed: 0, repairs: 0 };

    this._pos = new THREE.Vector3();
    this._tan = new THREE.Vector3();
    this._n = new THREE.Vector3();
    this._q = new THREE.Quaternion();
  }

  /** 建造渡轮船队（每艘一条航线，A↔B 循环摆渡） */
  build(ports = []) {
    this.clear();
    if (FERRY.COUNT <= 0) return this;
    const model = this.assets.has(FERRY.MODEL) ? FERRY.MODEL : ['boat-row-large', 'boat-row-small'].find((m) => this.assets.has(m));
    if (!model) {
      console.warn('[FerryManager] 无可用渡轮模型（需先加载 boat-row-large）');
      return this;
    }
    if (!this.routes || !this.routes.count) {
      console.warn('[FerryManager] 无航线，渡轮无法开航');
      return this;
    }

    for (let i = 0; i < FERRY.COUNT; i++) {
      const route = this.routes.pick(i * 2 + 1);   // 与商船队错开航线索引
      const obj = this.assets.instance(model, { shadows: false });
      obj.visible = false;
      obj.name = 'ferry';
      obj.userData.model = model;
      obj.userData.isFerry = true;
      obj.userData.maxHp = SHIPS.FERRY_MAX_HP;
      obj.userData.hp = SHIPS.FERRY_MAX_HP;

      const ferry = {
        id: 'ferry-' + i,
        object: obj,
        route,
        walked: this.rng() * route.length,
        speed: FERRY.SPEED_MIN + this.rng() * (FERRY.SPEED_MAX - FERRY.SPEED_MIN),
        phase: this.rng() * Math.PI * 2,
        /** 船上乘客 ≤ CAPACITY（pk = {ref, mgr, type}） */
        passengers: [],
        /** 正在步行上下船的人（pk.queue = 'board'|'land'） */
        walkers: [],
        state: 'sail',                  // sail | dock | wreck
        dockTimer: 0,
        dockedAt: null,
        atFrom: true,                   // 下一程终点 = route.to？（A→B→A 循环掉头）
        dockPose: null,                 // 靠岸后冻结的位置/船头方向，避免停泊时被航线投海/避让扰动
        // 战斗 / 修理
        hp: SHIPS.FERRY_MAX_HP,
        maxHp: SHIPS.FERRY_MAX_HP,
        destroyed: false,
        fireLevel: 0,
        repairing: false,
        tiltCur: { roll: 0, pitch: 0 },
        laneOffset: laneOffsetFor(i),
        avoidOffset: 0,
        avoidLock: null,
        waitTimer: 0,
        position: new THREE.Vector3(),
        tangent: new THREE.Vector3(),
        progress: 0,
      };

      if (this.damage) this.damage.makeDamageable(obj, { maxHp: SHIPS.FERRY_MAX_HP, type: 'ferry', tags: ['ferry', model] });

      this.group.add(obj);
      this.ferries.push(ferry);
      this._place(ferry, 0, 1 / 60);

      // 首航带满 ≤5 人（候船者直接登船，无排队动画）
      this._boardAt(ferry, route.from, false);
      obj.updateMatrixWorld(true);
      obj.visible = true;
    }
    return this;
  }

  /** 船队占位提供者：停靠/修理/航行船都算水面障碍。 */
  setShipProvider(fn) { this.shipProvider = fn; }

  /* ─────────────────── 航行 / 停泊状态机 ─────────────────── */

  /** 每帧：伤害同步 → 步行推进 → 航行 / 停泊（修理）→ 掉头 */
  update(dt, time) {
    if (!this.ferries.length) return;
    for (const ferry of this.ferries) {
      // DamageSystem 是血量单一真相：同步 + 着火分级 + 沉没
      const ent = this.damage ? this.damage.registry.get(ferry.object) : null;
      if (ent) {
        ferry.hp = ent.hp;
        if (ent.destroyed) {
          if (!ferry.destroyed) {
            ferry.destroyed = true;
            ferry.state = 'wreck';
            for (const pk of [...ferry.passengers, ...ferry.walkers]) this._abandonShip(ferry, pk);
          }
          if (this.fx) ferry.fireLevel = this.fx.setShipFire(ferry.object, 1);
        } else if (this.fx) {
          ferry.fireLevel = this.fx.setShipFire(ferry.object, 1 - ent.hp / Math.max(1, ent.maxHp));
        }
      }

      this._updateWalkers(ferry, dt);

      if (ferry.destroyed) continue;

      if (ferry.state === 'dock') {
        ferry.avoidOffset = 0;
        ferry.dockTimer -= dt;
        // 修理：缓慢回血（DamageSystem.applyRepair 同步褪色恢复）
        if (ferry.repairing) {
          const healed = this.damage ? this.damage.applyRepair(ferry.object, SHIPS.REPAIR_HP_PER_SECOND * dt) : 0;
          ferry.hp = Math.min(ferry.maxHp, ferry.hp + healed);
          if (this.fx) this.fx.setShipFire(ferry.object, 1 - ferry.hp / Math.max(1, ferry.maxHp));
          if (ferry.hp >= ferry.maxHp) this._finishRepair(ferry);
        } else if (ferry.hp < ferry.maxHp && !ferry.repairing) {
          this._startRepair(ferry);   // 带伤进港 → 自动开修（延长停泊到修完）
        }
        if (ferry.dockTimer <= 0) {
          if (ferry.walkers.length === 0 && this._departureClear(ferry)) this._depart(ferry);
          else ferry.dockTimer = 1.0;   // 等步行乘客完成（绝不让船瞬移/消失）
        }
        continue;
      }

      // 航行：atFrom=true 表示 A→B；false 表示 B→A。靠岸端点不能取模回起点。
      const route = ferry.route;
      if (ferry.waitTimer > 0) ferry.waitTimer = Math.max(0, ferry.waitTimer - dt);
      else ferry.walked += (ferry.atFrom ? 1 : -1) * ferry.speed * dt;
      ferry.avoidOffset *= Math.max(0, 1 - AVOID_OFFSET_DAMP * dt);
      if ((ferry.atFrom && ferry.walked >= route.length) || (!ferry.atFrom && ferry.walked <= 0)) {
        ferry.walked = ferry.atFrom ? route.length : 0;
        this._arrive(ferry, ferry.atFrom ? route.to : route.from);
      }
    }
    this._avoidShips(dt);
    for (const ferry of this.ferries) this._place(ferry, time, dt);
    this._separateVisualOverlaps();
  }

  /** 到岸停泊：全员下船（步行）+ 候船者登船（步行）+ 开修（若伤） */
  _arrive(ferry, port) {
    ferry.state = 'dock';
    ferry.dockedAt = port;
    ferry.dockTimer = FERRY.DOCK_SECONDS;
    ferry.avoidOffset = 0;
    ferry.dockPose = this._makeDockPose(ferry, port);
    ferry.position.copy(ferry.dockPose.position);
    ferry.tangent.copy(ferry.dockPose.tangent);
    ferry.progress = ferry.dockPose.t;

    for (const pk of ferry.passengers.splice(0)) this._startDisembark(ferry, pk, port);
    this._boardAt(ferry, port, true);       // 候船者步行登船（≤ CAPACITY，含排队中）
  }

  _depart(ferry) {
    ferry.state = 'sail';
    ferry.dockedAt = null;
    ferry.dockPose = null;
    // 掉头：A→B 走完（walked=length）→ 回 A（walked 递减）；B→A 走完（walked=0）→ 去 B（递增）
    if (ferry.atFrom) ferry.walked = ferry.route.length;
    else ferry.walked = 0;
    ferry.atFrom = !ferry.atFrom;
    if (ferry.repairing && ferry.hp < ferry.maxHp) this._finishRepair(ferry);   // 残血也开船，离港停修
  }

  _departureClear(ferry) {
    const minDist = SHIPS.SHIP_AVOID_RADIUS * 1.12;
    for (const other of this._avoidPool()) {
      if (other === ferry || !this._blocksWaterway(other)) continue;
      if (ferry.position.distanceTo(other.position) < minDist) return false;
    }
    return true;
  }

  /* ─────────────────── 上下船（步行效果） ─────────────────── */

  /** 候船者登船：角色优先、动物补位；总数（船上+在途）≤ CAPACITY。
   *  walking=true → 步行登船（可见排队）；false（首航）→ 直接登船 */
  _boardAt(ferry, port, walking) {
    if (!port) return;
    const onboard = () => ferry.passengers.length + ferry.walkers.filter((w) => w.queue === 'board').length;
    const takeDirect = (c, mgr, type) => {
      if (onboard() >= FERRY.CAPACITY) return false;
      if (c.onFerry || c.leavingFerry) return false;
      if (c.home && !this._nearPort(c.home, port)) return false;
      if (this._degDist(c, port) > FERRY.BOARD_DEG) return false;
      const pk = { ref: c, mgr, type };
      ferry.passengers.push(pk);
      c.onFerry = ferry.id;
      c.object.visible = false;
      if (this.audio) this.audio.footstep(true);
      if (c.marker) c.marker.visible = false;
      if (c.target) { c.target = null; c.state = 'idle'; }
      this.stats.boarded++;
      return true;
    };
    const takeWalking = (c, mgr, type) => {
      if (onboard() >= FERRY.CAPACITY) return false;
      if (c.onFerry || c.leavingFerry) return false;
      if (c.home && !this._nearPort(c.home, port)) return false;
      if (this._degDist(c, port) > FERRY.BOARD_DEG) return false;
      const pk = { ref: c, mgr, type, queue: 'board' };
      // 起点 = 乘客脚下位置（船到港时开始朝船走）
      pk.from = (c.position ? c.position.clone() : c.object.position.clone());
      ferry.walkers.push(pk);
      c.onFerry = ferry.id;          // 预锁定（别船/别逻辑不再抓他）
      if (c.target) { c.target = null; c.state = 'idle'; }
      this.stats.boarded++;
      return true;
    };
    const take = walking ? takeWalking : takeDirect;
    if (this.characters) { for (const c of this.characters.characters) { if (!take(c, this.characters, 'character')) continue; if (onboard() >= FERRY.CAPACITY) return; } }
    if (this.pets) { for (const p of this.pets.pets) { if (!take(p, this.pets, 'pet')) continue; if (onboard() >= FERRY.CAPACITY) return; } }
  }

  /** 下船：沿「船 → 岸空地」步行（全程可见） */
  _startDisembark(ferry, pk, port) {
    const c = pk.ref;
    pk.queue = 'land';
    pk.from = ferry.position.clone();
    c.leavingFerry = ferry.id;
    c.onFerry = null;
    c.object.visible = true;
    if (c.marker) c.marker.visible = true;
    const spot = findClearSpot(this.sampler, this.rng, {
      home: port, homeChance: 0.85, spreadDeg: 6,
      maxSlopeDeg: pk.type === 'pet' ? 16 : 18,
      occupancy: this.occupancy,
      clearRadius: pk.type === 'pet' ? 2.4 : 2.2,
      includeSelf: true, shoreSafe: true,     // 下船也不落到水线边
    });
    pk.landSpot = spot || { lat: port.lat, lon: port.lon };
    ferry.walkers.push(pk);
  }

  /** 乘客步行推进：board = 岸→船门；land = 船→岸空地（切平面大圆小步走） */
  _updateWalkers(ferry, dt) {
    if (!ferry.walkers.length) return;
    const normal = getSurfaceNormal(ferry.position, this._n).clone();
    for (let i = ferry.walkers.length - 1; i >= 0; i--) {
      const pk = ferry.walkers[i];
      const c = pk.ref;
      const cur = c.position ? c.position : null;
      if (!cur) { this._dropWalker(ferry, i, pk); continue; }
      const target = pk.queue === 'board'
        ? ferry.position.clone().addScaledVector(normal, 0.4)         // 船门（船侧）
        : this.sampler.positionAt(pk.landSpot.lat, pk.landSpot.lon, 0.02, new THREE.Vector3());
      const dist = cur.distanceTo(target);
      const stepLen = Math.min(WALK_SPEED * dt, dist);
      // ⚠ 到达判定必须 ≥ 单步步长（世界单位）——旧版 `dist <= WALK_SPEED*dt`
      //   在 dist≈0 时恒假 → 永远走不到岸（血条/客数不更新的根因）
      if (dist <= Math.max(stepLen, 0.6)) { this._finishWalk(ferry, i, pk); this._placeWalker(c, target); continue; }
      const dir = _v.copy(target).sub(cur);
      dir.addScaledVector(normal, -dir.dot(normal));                  // 投到当地切平面
      if (dir.lengthSq() < 1e-9) { this._finishWalk(ferry, i, pk); continue; }
      dir.normalize();
      const next = cur.clone().addScaledVector(dir, stepLen);
      this._placeWalker(c, next);
      void i;
    }
  }

  /** 步行者贴地摆放（同角色范式：高度场 + 小抬升） */
  _placeWalker(c, pos) {
    const ll = vector3ToLatLon(pos);
    pos.setLength(this.sampler.radius + Math.max(this.sampler.heightAt(ll.lat, ll.lon), 0) + 0.02);
    c.position.copy(pos);
    c.latLive = ll.lat; c.lonLive = ll.lon;
    if (c.object) {
      c.object.position.copy(pos);
      if (c.object.userData.spec) {
        alignObjectToSurface(c.object, pos, null, { upAxis: 'y', forwardAxis: 'z' });
      }
    }
  }

  _finishWalk(ferry, i, pk) {
    const c = pk.ref;
    if (pk.queue === 'board') {
      ferry.walkers.splice(i, 1);
      if (ferry.passengers.length < FERRY.CAPACITY) {
        ferry.passengers.push({ ref: c, mgr: pk.mgr, type: pk.type });
        c.object.visible = false;
        if (c.marker) c.marker.visible = false;
      } else {
        // 挤不上（超员）→ 回岸上正常生活（不消失）
        c.onFerry = null;
        c.object.visible = true;
        if (c.marker) c.marker.visible = true;
        c.timer = 0.5 + this.rng() * 2;
      }
    } else {
      ferry.walkers.splice(i, 1);
      c.lat = pk.landSpot.lat; c.lon = pk.landSpot.lon;
      c.latLive = c.lat; c.lonLive = c.lon;
      c.home = ferry.dockedAt || c.home;        // 融入新港
      c.leavingFerry = null;
      c.onFerry = null;
      c.object.visible = true;
      if (c.marker) c.marker.visible = true;
      c.timer = 0.4 + this.rng() * 2;
      this.stats.landed++;
      if (this.audio) this.audio.footstep(false);
    }
  }

  _dropWalker(ferry, i, pk) {
    ferry.walkers.splice(i, 1);
    const c = pk.ref;
    c.onFerry = pk.queue === 'board' ? null : c.onFerry;
    c.leavingFerry = null;
    c.object.visible = true;
    if (c.marker) c.marker.visible = true;
  }

  /** 沉船弃船：放回较近的港（步行逻辑终止） */
  _abandonShip(ferry, pk) {
    const c = pk.ref;
    this._removeFrom(ferry.passengers, pk);
    this._removeFrom(ferry.walkers, pk);
    c.onFerry = null; c.leavingFerry = null;
    c.object.visible = true;
    if (c.marker) c.marker.visible = true;
    const home = this.rng() < 0.5 ? ferry.route.from : ferry.route.to;
    const spot = findClearSpot(this.sampler, this.rng, {
      home, homeChance: 0.9, spreadDeg: 8,
      maxSlopeDeg: 18, occupancy: this.occupancy, clearRadius: 2.2, includeSelf: true, shoreSafe: true,
    }) || { lat: home.lat, lon: home.lon };
    c.lat = c.latLive = spot.lat; c.lon = c.lonLive = spot.lon;
    c.home = home;
  }

  _removeFrom(arr, item) { const i = arr.indexOf(item); if (i >= 0) arr.splice(i, 1); }

  /* ─────────────────── 修理 ─────────────────── */

  _startRepair(ferry) {
    if (ferry.repairing) return;
    ferry.repairing = true;
    this.stats.repairs++;
    if (this.audio) this.audio.repairPing();
    // 延长停泊到修完（上限 12s：90hp 全修满 = 18s @5/s → 封顶不无限等）
    const need = (ferry.maxHp - ferry.hp) / SHIPS.REPAIR_HP_PER_SECOND;
    ferry.dockTimer = Math.max(ferry.dockTimer, Math.min(need, 12));
    if (this.fx) this.fx.setRepairBeacon(ferry.object, true);
  }

  _finishRepair(ferry) {
    if (!ferry.repairing) return;
    ferry.repairing = false;
    if (this.fx) this.fx.setRepairBeacon(ferry.object, false);
  }

  /* ─────────────────── 摆放：吃水 + 海浪漂浮 ─────────────────── */

  _place(ferry, time, dt = 1 / 60) {
    const s = ferry.state === 'dock' && ferry.dockPose
      ? { position: this._pos.copy(ferry.dockPose.position), tangent: this._tan.copy(ferry.dockPose.tangent), t: ferry.dockPose.t }
      : this.routes.sampleAt(ferry.route, ferry.walked, this._pos, this._tan, { wrap: false });
    if (!ferry.atFrom && !(ferry.state === 'dock' && ferry.dockPose)) s.tangent.negate();
    const normal = getSurfaceNormal(s.position, this._n).clone();
    const base = s.position.clone();
    const routeOffset = ferry.state === 'dock' ? 0 : (ferry.laneOffset || 0) + (ferry.avoidOffset || 0);
    if (routeOffset) {
      _v.crossVectors(s.tangent, normal).normalize();
      this._applySafeOffset(base, s.position, _v, routeOffset, ferry);
    }
    const ll = vector3ToLatLon(base);
    // ⭐ 吃水线：龙骨落到海平面下（≈ DRAFT − ROUTE_LIFT）→ 泡在水里 + 随浪升沉
    const offset = waveHeight(ll.lat, ll.lon, time) - DRAFT;
    const placed = base.clone().addScaledVector(normal, offset);
    alignObjectToSurface(ferry.object, placed, s.tangent, { upAxis: 'y', forwardAxis: 'z' });
    if (ferry.state === 'dock') {
      ferry.tiltCur.roll = 0;
      ferry.tiltCur.pitch = 0;
      ferry.position.copy(placed);
      ferry.tangent.copy(s.tangent);
      ferry.progress = s.t;
      return;
    }
    // 平滑摇摆（TILT_SMOOTH_SECONDS 惯性跟随，与 ShipManager 同款）
    const tilt = waveTilt(ll.lat, ll.lon, time);
    smoothTiltFor(ferry, tilt, dt);
    if (ferry.tiltCur.roll) {
      _v.copy(s.tangent).normalize();
      ferry.object.quaternion.multiply(this._q.setFromAxisAngle(_v, ferry.tiltCur.roll));
    }
    if (ferry.tiltCur.pitch) {
      _v.crossVectors(_v2.copy(s.tangent).normalize(), normal).normalize();
      ferry.object.quaternion.multiply(this._q.setFromAxisAngle(_v, ferry.tiltCur.pitch));
    }
    ferry.position.copy(placed);
    ferry.tangent.copy(s.tangent);
    ferry.progress = s.t;
  }

  _makeDockPose(ferry, port) {
    const spot = this._findDockWater(port, ferry);
    if (!spot) {
      const fallback = this.routes.sampleAt(ferry.route, ferry.walked, new THREE.Vector3(), new THREE.Vector3(), { wrap: false });
      if (!ferry.atFrom) fallback.tangent.negate();
      return {
        position: fallback.position.clone().setLength((this.sampler?.radius ?? fallback.position.length()) + SHIPS.POS_LIFT),
        tangent: fallback.tangent.clone().normalize(),
        t: ferry.atFrom ? 1 : 0,
      };
    }
    const position = this.sampler
      ? this.sampler.positionAt(spot.lat, spot.lon, 0, new THREE.Vector3()).setLength(this.sampler.radius + SHIPS.POS_LIFT)
      : ferry.position.clone();
    const normal = getSurfaceNormal(position, new THREE.Vector3());
    const portPos = this.sampler
      ? this.sampler.positionAt(port.lat, port.lon, 0, new THREE.Vector3()).setLength(this.sampler.radius + SHIPS.POS_LIFT)
      : position.clone().addScaledVector(normal, -1);
    const tangent = position.clone().sub(portPos);
    tangent.addScaledVector(normal, -tangent.dot(normal));
    if (tangent.lengthSq() < 1e-8) {
      const fallback = this.routes.sampleAt(ferry.route, ferry.walked, new THREE.Vector3(), new THREE.Vector3(), { wrap: false });
      tangent.copy(fallback.tangent);
      if (!ferry.atFrom) tangent.negate();
    }
    tangent.normalize();
    return { position, tangent, t: ferry.atFrom ? 1 : 0 };
  }

  _findDockWater(port, ferry) {
    if (!this.sampler) return null;
    let best = null;
    for (let r = 2; r <= DOCK_SEARCH_MAX_DEG; r += 1) {
      const steps = Math.max(16, Math.ceil((Math.PI * 2 * r) / 1.2));
      for (let i = 0; i < steps; i++) {
        const a = (i / steps) * Math.PI * 2;
        const lat = THREE.MathUtils.clamp(port.lat + Math.sin(a) * r, -72, 72);
        const lon = port.lon + (Math.cos(a) * r) / Math.max(0.25, Math.cos(THREE.MathUtils.degToRad(lat)));
        if (!this._isDockWater(lat, lon)) continue;
        const pos = this.sampler.positionAt(lat, lon, 0, new THREE.Vector3()).setLength(this.sampler.radius + SHIPS.POS_LIFT);
        if (!this._isBerthFree(pos, ferry, SHIPS.SHIP_AVOID_RADIUS * 1.08)) continue;
        const h = this.sampler.heightAt(lat, lon);
        const score = r + Math.max(0, h + 0.8) * 10;
        if (!best || score < best.score) best = { lat, lon, score };
      }
      if (best) return best;
    }
    return null;
  }

  _isDockWater(lat, lon) {
    if (this.sampler.heightAt(lat, lon) > FERRY_WATER_HEIGHT_MAX) return false;
    for (const [dlat, dlonRaw] of WATER_PROBES) {
      const la = THREE.MathUtils.clamp(lat + dlat * FERRY_WATER_CLEARANCE_DEG, -72, 72);
      const lo = lon + (dlonRaw * FERRY_WATER_CLEARANCE_DEG) / Math.max(0.25, Math.cos(THREE.MathUtils.degToRad(la)));
      if (this.sampler.heightAt(la, lo) > FERRY_WATER_PROBE_MAX) return false;
    }
    return true;
  }

  /* ─────────────────── 工具 ─────────────────── */

  _nearPort(home, port) { return this._degDist(home, port) <= FERRY.BOARD_DEG; }

  _degDist(a, b) {
    const lat = a.latLive ?? a.lat;
    const lon = a.lonLive ?? a.lon;
    const dLat = lat - b.lat;
    const dLon = (lon - b.lon) * Math.cos(THREE.MathUtils.degToRad((lat + b.lat) / 2));
    return Math.hypot(dLat, dLon);
  }

  summary() {
    return {
      ferries: this.ferries.length,
      model: this.ferries[0] ? this.ferries[0].object.userData.model : null,
      onboard: this.ferries.reduce((s, f) => s + f.passengers.length, 0),
      walking: this.ferries.reduce((s, f) => s + f.walkers.length, 0),
      docking: this.ferries.filter((f) => f.state === 'dock').length,
      repairing: this.ferries.filter((f) => f.repairing).length,
      capacityEach: FERRY.CAPACITY,
      boardedTotal: this.stats.boarded,
      landedTotal: this.stats.landed,
      repairs: this.stats.repairs,
    };
  }

  clear() {
    for (const f of this.ferries) {
      for (const pk of [...f.passengers, ...f.walkers]) {
        pk.ref.object.visible = true;
        if (pk.ref.marker) pk.ref.marker.visible = true;
        pk.ref.onFerry = null;
        pk.ref.leavingFerry = null;
      }
      if (this.fx) this.fx.setRepairBeacon(f.object, false);
      if (this.fx) this.fx.clearShipFire(f.object);
      f.passengers.length = 0; f.walkers.length = 0;
      this.group.remove(f.object);
    }
    this.ferries.length = 0;
  }

  /**
   * 渡轮↔渡轮避让（船↔船不重叠）：距离 < SHIP_AVOID_RADIUS → 双方航向互反偏转。
   * 停泊中的渡轮不动（只动航行腿）。
   */
  _avoidShips(dt) {
    const R = SHIPS.SHIP_AVOID_RADIUS;
    const all = this._avoidPool();
    for (let i = 0; i < all.length; i++) {
      const a = all[i];
      if (!this._blocksWaterway(a)) continue;
      for (let j = i + 1; j < all.length; j++) {
        const b = all[j];
        if (!this._blocksWaterway(b)) continue;
        const d = a.position.distanceTo(b.position);
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

  _avoidPool() {
    const ships = this.shipProvider ? this.shipProvider() : [];
    return [...this.ferries, ...ships].filter(Boolean);
  }

  _blocksWaterway(vessel) {
    return !!vessel && !vessel.destroyed && vessel.state !== 'wreck' && vessel.position && vessel.position.lengthSq() > 1e-6;
  }

  _canYield(vessel) {
    return vessel && this._blocksWaterway(vessel) && vessel.state !== 'dock' && !vessel.repairing;
  }

  _repelVessel(vessel, other, desiredAway, normal, overlap, dt) {
    if (!this._canYield(vessel)) return;
    desiredAway.addScaledVector(normal, -desiredAway.dot(normal));
    if (desiredAway.lengthSq() < 1e-9) return;
    desiredAway.normalize();

    if (vessel.state === 'chasing') {
      const turn = Math.atan2(new THREE.Vector3().crossVectors(vessel.tangent, desiredAway).dot(normal), vessel.tangent.dot(desiredAway));
      const yaw = THREE.MathUtils.clamp(turn, -SHIPS.SHIP_AVOID_STEER * dt * 2.4, SHIPS.SHIP_AVOID_STEER * dt * 2.4);
      vessel.tangent.applyAxisAngle(normal, yaw).normalize();
      this._pushLiveVessel(vessel, desiredAway, SHIPS.SHIP_AVOID_RADIUS * Math.max(overlap, 0.45));
      return;
    }

    const side = this._avoidSide(vessel, other, desiredAway, normal);
    const amount = side * SHIPS.SHIP_AVOID_RADIUS * (0.55 + overlap);
    vessel.avoidOffset = THREE.MathUtils.clamp((vessel.avoidOffset || 0) + amount, -AVOID_OFFSET_MAX, AVOID_OFFSET_MAX);
    this._nudgeAlongRoute(vessel, desiredAway, SHIPS.SHIP_AVOID_RADIUS * overlap * 0.55);
    if (vessel.object?.userData?.isFerry && overlap > 0.35) vessel.waitTimer = Math.max(vessel.waitTimer || 0, 0.35);
  }

  _avoidSide(vessel, other, desiredAway, normal) {
    const otherId = vesselId(other);
    const d = other?.position ? vessel.position.distanceTo(other.position) : Infinity;
    if (vessel.avoidLock && vessel.avoidLock.otherId === otherId && d < SHIPS.SHIP_AVOID_RADIUS * 1.55) {
      return vessel.avoidLock.side;
    }
    if (vessel.avoidLock && d >= SHIPS.SHIP_AVOID_RADIUS * 1.55) vessel.avoidLock = null;
    const raw = Math.atan2(new THREE.Vector3().crossVectors(vessel.tangent, desiredAway).dot(normal), vessel.tangent.dot(desiredAway));
    const fallback = stableSide(vesselId(vessel), otherId) * Math.sign(vessel.laneOffset || 1);
    const side = Math.sign(raw || fallback || 1);
    vessel.avoidLock = { otherId, side };
    return side;
  }

  _isSafeWater(position) {
    if (!this.sampler) return true;
    const ll = vector3ToLatLon(position);
    if (this.sampler.heightAt(ll.lat, ll.lon) > FERRY_WATER_HEIGHT_MAX) return false;
    for (const [dlat, dlonRaw] of WATER_PROBES) {
      const lat = THREE.MathUtils.clamp(ll.lat + dlat * FERRY_WATER_CLEARANCE_DEG, -72, 72);
      const lon = ll.lon + (dlonRaw * FERRY_WATER_CLEARANCE_DEG) / Math.max(0.25, Math.cos(THREE.MathUtils.degToRad(lat)));
      if (this.sampler.heightAt(lat, lon) > FERRY_WATER_PROBE_MAX) return false;
    }
    return true;
  }

  _applySafeOffset(out, origin, side, offset, ferry) {
    const scales = [1, 0.75, 0.5, 0.25];
    for (const scale of scales) {
      out.copy(origin).addScaledVector(side, offset * scale).setLength(origin.length());
      if (this._isSafeWater(out)) return true;
    }
    ferry.avoidOffset = 0;
    out.copy(origin);
    return false;
  }

  _pushLiveVessel(vessel, desiredAway, amount) {
    if (!vessel.position || !Number.isFinite(amount)) return false;
    const before = vessel.position.clone();
    vessel.position.addScaledVector(desiredAway, amount).setLength((this.sampler?.radius ?? 100) + SHIPS.POS_LIFT);
    if (!this._isSafeWater(vessel.position)) {
      vessel.position.copy(before);
      return false;
    }
    if (vessel.object) vessel.object.position.copy(vessel.position);
    return true;
  }

  _nudgeAlongRoute(vessel, desiredAway, amount) {
    if (!vessel.route || typeof vessel.walked !== 'number' || !Number.isFinite(amount) || amount <= 0) return;
    const len = Math.max(vessel.route.length || 0, 1e-6);
    const along = desiredAway.dot(vessel.tangent || _v2.set(1, 0, 0));
    if (Math.abs(along) < 0.08) return;
    const travelSign = vessel.atFrom === false ? -1 : 1;
    vessel.walked += Math.sign(along) * travelSign * amount;
    if (vessel.object?.userData?.isFerry) vessel.walked = THREE.MathUtils.clamp(vessel.walked, 0, len);
    else vessel.walked = ((vessel.walked % len) + len) % len;
  }

  _isBerthFree(position, self, minDist = SHIPS.SHIP_AVOID_RADIUS) {
    for (const other of this._avoidPool()) {
      if (other === self || !this._blocksWaterway(other)) continue;
      if (position.distanceTo(other.position) < minDist) return false;
    }
    return true;
  }

  _separateVisualOverlaps() {
    const all = this._avoidPool();
    for (let pass = 0; pass < 3; pass++) {
      for (let i = 0; i < all.length; i++) {
        const a = all[i];
        if (!this._blocksWaterway(a)) continue;
        for (let j = i + 1; j < all.length; j++) {
          const b = all[j];
          if (!this._blocksWaterway(b)) continue;
          const d = a.position.distanceTo(b.position);
          if (d >= VISUAL_SEPARATION_RADIUS) continue;
          const n = getSurfaceNormal(a.position, new THREE.Vector3());
          const away = new THREE.Vector3().subVectors(b.position, a.position);
          away.addScaledVector(n, -away.dot(n));
          if (away.lengthSq() < 1e-9) away.crossVectors(a.tangent || _v2.set(1, 0, 0), n);
          if (away.lengthSq() < 1e-9) continue;
          away.normalize();
          const push = (VISUAL_SEPARATION_RADIUS - d) * 0.62;
          const aCan = this._canYield(a);
          const bCan = this._canYield(b);
          if (aCan && bCan) {
            this._pushVisual(a, away.clone().negate(), push * 0.5);
            this._pushVisual(b, away, push * 0.5);
          } else if (aCan) {
            this._pushVisual(a, away.clone().negate(), push);
          } else if (bCan) {
            this._pushVisual(b, away, push);
          }
        }
      }
    }
  }

  _pushVisual(vessel, dir, amount) {
    if (!vessel.position || amount <= 0) return false;
    const before = vessel.position.clone();
    const normal = getSurfaceNormal(before, new THREE.Vector3());
    const candidates = [0, 0.55, -0.55, 1.1, -1.1, 1.65, -1.65, Math.PI];
    for (const angle of candidates) {
      const d = dir.clone().applyAxisAngle(normal, angle).normalize();
      for (const scale of [1, 0.7, 1.35]) {
        vessel.position.copy(before).addScaledVector(d, amount * scale).setLength(before.length());
        if (!this._isSafeWater(vessel.position)) continue;
        if (vessel.object) vessel.object.position.copy(vessel.position);
        return true;
      }
    }
    vessel.position.copy(before);
    return false;
  }
}

/** 模块级临时向量 */
const _v = new THREE.Vector3();
const _v2 = new THREE.Vector3();
const WATER_PROBES = [
  [1, 0], [-1, 0], [0, 1], [0, -1],
  [0.7, 0.7], [0.7, -0.7], [-0.7, 0.7], [-0.7, -0.7],
];

/** 指数平滑摇摆：船体按 TILT_SMOOTH_SECONDS 惯性追随浪面目标（流畅不抖） */
function smoothTiltFor(ferry, target, dt) {
  if (!ferry.tiltCur) ferry.tiltCur = { roll: 0, pitch: 0 };
  const k = Math.min(1, dt / Math.max(0.05, SHIPS.TILT_SMOOTH_SECONDS));
  ferry.tiltCur.roll += (target.roll - ferry.tiltCur.roll) * k;
  ferry.tiltCur.pitch += (target.pitch - ferry.tiltCur.pitch) * k;
}

function laneOffsetFor(index) {
  const lanes = [1, -1, 2, -2, 0, 3, -3];
  return lanes[index % lanes.length] * LANE_OFFSET_STEP;
}

function vesselId(vessel) {
  return vessel?.id || vessel?.object?.uuid || vessel?.name || '';
}

function stableSide(a, b) {
  const s = String(a) + '|' + String(b);
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return (h & 1) ? 1 : -1;
}

export { DRAFT };
