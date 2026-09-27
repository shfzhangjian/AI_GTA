/**
 * PetManager.js — 陆地小动物（kenney_cube-pets_1.0，扩展架构 §Animals）
 *
 * 硬性要求：
 *   · 只引用 src/assets/manifest-cube-pets.json 实测 key（assertKnownPetModel）
 *   · 落位只走 TerrainSampler + occupancy 避让（不穿树 / 不穿建筑 / 不叠人）
 *   · 姿态只走 GeoUtils：UP = 球面外法线，FORWARD = 行进切线
 *   · 骨骼动画 = GLTF 自带 idle/walk/run clip（实测 walk root.translation 仅 +0.099
 *     原地起伏 → 位移由本文件沿大圆推进，与角色同款范式）
 *   · 模型 scale / 朝向修正只来自 ModelUtils.PET_SPECS
 *   · 动物可上渡轮（FerryManager 借调；onFerry 时隐藏并暂停走动）
 */
import * as THREE from 'three';
import { PETS, PET_MODELS } from '../config.js';
import { assertKnownPetModel } from '../utils/ModelUtils.js';
import {
  alignObjectToSurface, offsetAlongGreatCircle, greatCircleTangent,
  rotateInTangentPlane, getSurfaceNormal, vector3ToLatLon,
} from '../utils/GeoUtils.js';
import { mulberry32 } from '../planet/Clouds.js';
import { findClearSpot, pickNextLegSpot } from './WalkerBase.js';

const DEG = Math.PI / 180;

/** 动物名（岛民宠物风，非任何既有游戏角色 IP） */
const PET_NAMES = {
  'animal-cat': 'Miso', 'animal-dog': 'Biscuit', 'animal-bunny': 'Thistle',
  'animal-fox': 'Ember', 'animal-deer': 'Fern', 'animal-lion': 'Sunny',
  'animal-tiger': 'Storm', 'animal-panda': 'Bamboo', 'animal-penguin': 'Pebble',
  'animal-pig': 'Truffle', 'animal-cow': 'Buttercup', 'animal-giraffe': 'Cloud',
  'animal-elephant': 'Tusker', 'animal-monkey': 'Mango', 'animal-koala': 'Gumleaf',
  'animal-hog': 'Cinder', 'animal-beaver': 'Timber', 'animal-crab': 'Cinderclaw',
  'animal-chick': 'Pip', 'animal-parrot': 'Kiki',
};

export class PetManager {
  /**
   * @param {{sceneManager, assets, sampler, registry?, occupancy?, group?, seed?}} deps
   */
  constructor(deps) {
    this.sm = deps.sceneManager;
    this.assets = deps.assets;
    this.sampler = deps.sampler;
    this.registry = deps.registry || null;
    this.occupancy = deps.occupancy || null;
    // 独立 Animals 层（SceneManager 提供；缺省退回 world）
    this.group = deps.group || this.sm.animals || this.sm.world;
    this.group.name = 'Animals';
    this.rng = mulberry32(deps.seed ?? 357159);

    /** @type {Array<object>} 动物记录 */
    this.pets = [];
    /** @type {Map<string, THREE.AnimationClip[]>} */
    this.clips = new Map();

    this._pos = new THREE.Vector3();
    this._posB = new THREE.Vector3();
    this._dst = new THREE.Vector3();
    this._tan = new THREE.Vector3();
    this._normal = new THREE.Vector3();
    this._fwd = new THREE.Vector3();
  }

  /**
   * 建造动物 population。
   * @param {Array<{lat:number, lon:number, name?:string}>} ports 已解析落港
   */
  build(ports = []) {
    this.clear();

    const pool = PET_MODELS.filter((m) => this.assets.has(m));
    if (!pool.length) {
      console.warn('[PetManager] 没有可用动物模型（需先 assets.loadPets(...)）');
      return this;
    }
    for (const m of pool) {
      if (!this.clips.has(m)) this.clips.set(m, this.assets.animations.get(m) || []);
    }

    // 计划：每种 ≥ PER_SPECIES 只（保底全物种出场），再随机补足 EXTRAS 只
    const plan = [];
    for (const model of pool) {
      for (let i = 0; i < PETS.PER_SPECIES; i++) plan.push({ model });
    }
    for (let i = 0; i < PETS.EXTRAS; i++) {
      plan.push({ model: pool[Math.floor(this.rng() * pool.length)] });
    }

    for (let i = 0; i < plan.length; i++) {
      const model = plan[i].model;
      assertKnownPetModel(model);
      const clips = this.clips.get(model) || [];
      const home = ports.length ? ports[Math.floor(this.rng() * ports.length)] : null;

      const obj = this.assets.instance(model, { shadows: false });
      obj.name = 'pet';
      obj.userData.model = model;
      obj.userData.isPet = true;

      const mixer = new THREE.AnimationMixer(obj);
      const find = (n) => clips.find((c) => c.name === n) || null;

      const pet = {
        id: 'pet-' + i,
        name: PET_NAMES[model] || model,
        model,
        object: obj,
        mixer,
        clips: { walk: find('walk'), run: find('run'), idle: find('idle') },
        actions: {},
        mode: null,
        home,
        speed: PETS.WALK_SPEED_MIN + this.rng() * (PETS.WALK_SPEED_MAX - PETS.WALK_SPEED_MIN),
        runSpeed: PETS.RUN_SPEED_MIN + this.rng() * (PETS.RUN_SPEED_MAX - PETS.RUN_SPEED_MIN),
        runChance: PETS.RUN_CHANCE + this.rng() * 0.15,
        phase: this.rng() * Math.PI * 2,
        state: 'idle',                  // idle | walk | run
        timer: 0.5 + this.rng() * 4,
        target: null,
        heading: this.rng() * Math.PI * 2,
        onFerry: null,                  // 渡轮借调中（隐藏 + 暂停）
        position: new THREE.Vector3(),
        lat: 0, lon: 0, latLive: 0, lonLive: 0,
      };

      const spot = findClearSpot(this.sampler, this.rng, {
        home, homeChance: 0.8, spreadDeg: PETS.LEG_DIST_MAX_DEG,
        maxSlopeDeg: PETS.MAX_SLOPE_DEG,
        occupancy: this.occupancy, clearRadius: PETS.CLEAR_RADIUS,
        includeSelf: true, shoreSafe: true,
      }) || { lat: home ? home.lat : 0, lon: home ? home.lon : 0 };
      pet.lat = pet.latLive = spot.lat;
      pet.lon = pet.lonLive = spot.lon;

      this._setMode(pet, 'idle');
      mixer.timeScale = 0.75 + this.rng() * 0.5;

      if (this.registry) {
        this.registry.register(obj, {
          type: 'pet',
          tags: ['pet', 'animal', model],
          model,
          damageable: false,
          data: { petId: pet.id },
        });
      }

      this.group.add(obj);
      this.pets.push(pet);
      this._pickNextLeg(pet);
      this._place(pet, 0);
    }
    return this;
  }

  /** 动画模式切换（互斥 idle/walk/run；同 CharacterManager 策略） */
  _setMode(pet, mode) {
    const actions = pet.actions;
    const want = mode === 'walk' ? 'walk'
      : mode === 'run' && pet.clips.run ? 'run'
      : 'idle';
    const ensure = (key) => {
      const clip = pet.clips[key];
      if (!clip) { if (actions[key]) { actions[key].stop(); actions[key] = null; } return; }
      const act = actions[key];
      if (act && act.getClip() === clip) return;
      if (act) act.stop();
      actions[key] = pet.mixer.clipAction(clip);
      actions[key].setLoop(THREE.LoopRepeat, Infinity);
    };
    for (const key of ['idle', 'walk', 'run']) ensure(key);
    if (pet.mode === want) return;
    pet.mode = want;
    for (const key of ['idle', 'walk', 'run']) {
      const a = actions[key];
      if (!a) continue;
      if (key === want) a.enabled = true;
      else if (a.isRunning()) a.fadeOut(0.22);
      else a.enabled = false;
    }
    const main = actions[want];
    if (main) {
      if (!main.isRunning() || main.time <= 0.0001 || main.time >= main.getClip().duration - 0.0001) {
        main.reset();
        main.play();
      }
      main.fadeIn(0.22);
    }
  }

  /** 下一个漫步目标（避开建筑/树/同伴占用） */
  _pickNextLeg(pet) {
    const from = { lat: pet.lat, lon: pet.lon };
    const spot = pickNextLegSpot(this.sampler, this.rng, { lat: pet.lat, lon: pet.lon }, {
      minDeg: PETS.LEG_DIST_MIN_DEG, maxDeg: PETS.LEG_DIST_MAX_DEG,
      maxSlopeDeg: PETS.MAX_SLOPE_DEG,
      occupancy: this.occupancy, clearRadius: PETS.CLEAR_RADIUS,
      minWorldDist: 2.5, shoreSafe: true,
    });
    if (spot) {
      pet.target = { from, lat: spot.lat, lon: spot.lon, dist: spot.dist, walked: 0 };
      pet.state = this.rng() < pet.runChance ? 'run' : 'walk';
      this._setMode(pet, pet.state);
      return;
    }
    pet.target = null;
    pet.state = 'idle';
    pet.timer = PETS.PAUSE_MIN + this.rng() * (PETS.PAUSE_MAX - PETS.PAUSE_MIN);
    pet.heading = this.rng() * Math.PI * 2;
    this._setMode(pet, 'idle');
  }

  /** 摆放：大圆弧贴地行走（同角色范式），UP=法线 FORWARD=切线 */
  _place(pet, time) {
    const pos = this._posB;
    if (pet.target) {
      const p0 = this.sampler.positionAt(pet.target.from.lat, pet.target.from.lon, 0, this._pos);
      const p1 = this.sampler.positionAt(pet.target.lat, pet.target.lon, 0, this._dst);
      const walked = Math.min(pet.target.dist, pet.target.walked);
      offsetAlongGreatCircle(p0, p1, walked, this.sampler.radius, pos);
      const ll = vector3ToLatLon(pos);
      pet.latLive = ll.lat; pet.lonLive = ll.lon;
      const ahead = offsetAlongGreatCircle(p0, p1, Math.min(1, walked / pet.target.dist + 0.05) * pet.target.dist, this.sampler.radius, this._tan).clone();
      greatCircleTangent(pos, ahead, this._tan);
    } else {
      this.sampler.positionAt(pet.lat, pet.lon, 0, pos);
      const n = getSurfaceNormal(pos, this._normal);
      const north = this._fwd.set(0, 1, 0);
      if (Math.abs(n.dot(north)) > 0.99) north.set(0, 0, 1);
      north.projectOnPlane(n).normalize();
      rotateInTangentPlane(north, n, pet.heading, this._tan);
      pet.latLive = pet.lat; pet.lonLive = pet.lon;
    }

    const h = Math.max(this.sampler.heightAt(pet.latLive, pet.lonLive), 0);
    const r = this.sampler.radius + h + PETS.GROUND_LIFT;
    const moving = pet.target && (pet.state === 'walk' || pet.state === 'run');
    const bob = moving
      ? Math.abs(Math.sin(time * (pet.state === 'run' ? PETS.BOB_FREQ_RUN : PETS.BOB_FREQ_WALK) + pet.phase))
        * (pet.state === 'run' ? PETS.BOB_AMP_RUN : PETS.BOB_AMP_WALK)
      : 0;
    pos.setLength(r + bob);

    if (!pet.target) {
      const n = getSurfaceNormal(pos, this._normal);
      const north = this._fwd.set(0, 1, 0);
      if (Math.abs(n.dot(north)) > 0.99) north.set(0, 0, 1);
      north.projectOnPlane(n).normalize();
      rotateInTangentPlane(north, n, pet.heading, this._tan);
    }
    alignObjectToSurface(pet.object, pos, this._tan, { upAxis: 'y', forwardAxis: 'z' });
    pet.position.copy(pos);
  }

  /** 每帧推进（渡轮借调中的动物暂停） */
  update(dt, time) {
    if (!this.pets.length) return;
    for (const pet of this.pets) {
      if (pet.onFerry) continue;              // 在船上：隐藏 + 暂停
      if (pet.target) {
        const sp = pet.state === 'run' ? pet.runSpeed : pet.speed;
        pet.target.walked += sp * dt;
        if (pet.target.walked >= pet.target.dist) {
          pet.lat = pet.target.lat;
          pet.lon = pet.target.lon;
          pet.target = null;
          pet.state = 'idle';
          pet.timer = PETS.PAUSE_MIN + this.rng() * (PETS.PAUSE_MAX - PETS.PAUSE_MIN);
          pet.heading = this.rng() * Math.PI * 2;
          this._setMode(pet, 'idle');
        }
      } else {
        pet.timer -= dt;
        if (pet.timer <= 0) this._pickNextLeg(pet);
      }
      this._place(pet, time);
      pet.mixer.update(dt);
    }
  }

  describe(pet) {
    return {
      name: pet.name,
      kind: '小动物',
      model: pet.model,
      state: pet.onFerry ? 'ferry' : pet.state,
      home: pet.home ? pet.home.name : '野外',
      lat: +pet.latLive.toFixed(2),
      lon: +pet.lonLive.toFixed(2),
    };
  }

  summary() {
    const byState = {};
    for (const p of this.pets) byState[p.onFerry ? 'ferry' : p.state] = (byState[p.onFerry ? 'ferry' : p.state] || 0) + 1;
    return {
      pets: this.pets.length,
      species: new Set(this.pets.map((p) => p.model)).size,
      byState,
    };
  }

  setVisible(v) { this.group.visible = !!v; }

  clear() {
    for (const p of this.pets) {
      p.mixer.stopAllAction();
      this.group.remove(p.object);
    }
    this.pets.length = 0;
  }
}
