/**
 * CharacterManager.js — 陆地小人（kenney_mini-characters，扩展架构 §Characters）
 *
 * 硬性要求：
 *   · 角色只引用 src/assets/manifest-mini-characters.json 实测 key（assertKnownMiniCharacterModel）
 *   · 落位只走 TerrainSampler（与陆地显示同一高度场）→ 不悬浮 / 不陷地
 *   · 姿态只走 GeoUtils：UP = 球面外法线，FORWARD = 行进切线 → 南极小人也不翻
 *   · 行走 = 沿大圆弧推进（与 ShipManager 同款球面移动范式，只是贴地）
 *   · 骨骼动画 = GLTF 自带 skinned walk/sprint/idle clip + AnimationMixer
 *     ⚠ 实测 walk/sprint 的 root.translation 仅是 ±0.05 的原地起伏（无 root motion），
 *       真实位移必须由本文件沿大圆推进，动画只负责四肢摆动
 *   · 模型 scale / 朝向修正只来自 ModelUtils.MINI_CHARACTER_SPECS
 *
 * 每个小人是独立蒙皮实例（骨骼动画需独立关节矩阵，无法 InstancedMesh），
 * 数量控制在数十级（默认 6 港 × 8 + 14 散居 ≈ 62 人）。
 */
import * as THREE from 'three';
import { CHARACTERS, CHARACTER_MODELS } from '../config.js';
import { assertKnownMiniCharacterModel, getMiniSpec } from '../utils/ModelUtils.js';
import {
  alignObjectToSurface, offsetAlongGreatCircle, greatCircleTangent,
  rotateInTangentPlane, getSurfaceNormal, greatCircleDistance, vector3ToLatLon,
} from '../utils/GeoUtils.js';
import { mulberry32 } from '../planet/Clouds.js';
import { findClearSpot, pickNextLegSpot } from './WalkerBase.js';

const DEG = Math.PI / 180;

/** 头顶标记共享几何（小四面体，替代精灵：便宜且永远可见） */
const CHAR_MARKER_GEO = new THREE.TetrahedronGeometry(0.34);

/** 岛民名字（海盗岛民风，非任何既有游戏角色） */
const CHAR_NAMES = [
  'Jack', 'Annie', 'Finn', 'Morgan', 'Celia', 'Rogue', 'Wren', 'Silas',
  'Bess', 'Hook', 'Nell', 'Gibbs', 'Ada', 'Bones', 'Coral', 'Dock',
  'Isla', 'Pike', 'Tess', 'Vane', 'Wade', 'Yara', 'Zane', 'Marlow',
  'Piper', 'Quill', 'Reef', 'Sable', 'Thatch', 'Uma', 'Van', 'Wicks',
  'Xara', 'Yorji', 'Zeke', 'Abel', 'Bram', 'Claw', 'Dune', 'Echo',
  'Fable', 'Gale', 'Heath', 'Ines', 'Jory', 'Kite', 'Lark', 'Mist',
  'Nim', 'Onyx', 'Penn', 'Reed', 'Sloan', 'True', 'Ulani', 'Vela',
  'Webster', 'Xio', 'Yates', 'Zeph', 'Bev', 'Cove', 'Dell', 'Evan',
];

export class CharacterManager {
  /**
   * @param {{sceneManager, assets, sampler, registry?, group?, count?, seed?}} deps
   *        count>0 时忽略港口分配，直接撒 count 个散居小人（测试 / 密度调节用）
   */
  constructor(deps) {
    this.sm = deps.sceneManager;
    this.assets = deps.assets;
    this.sampler = deps.sampler;
    this.registry = deps.registry || null;
    /** 防穿模：共享占用网格（建筑 / 树 / 落点互避） */
    this.occupancy = deps.occupancy || null;
    // 独立 Characters 层（SceneManager 提供）：显隐 / LOD / 调试用
    this.group = deps.group || this.sm.characters || this.sm.world;
    this.group.name = 'Characters';
    this.rng = mulberry32(deps.seed ?? 135790);
    this.count = deps.count ?? 0;

    /** @type {Array<object>} 小人记录 */
    this.characters = [];
    /** @type {Map<string, THREE.AnimationClip[]>} 每模型 clips 缓存 */
    this.clips = new Map();

    this._pos = new THREE.Vector3();
    this._posB = new THREE.Vector3();
    this._dst = new THREE.Vector3();
    this._tan = new THREE.Vector3();
    this._normal = new THREE.Vector3();
    this._fwd = new THREE.Vector3();
  }

  /**
   * 建造小人 population。
   * @param {Array<{lat:number, lon:number, name?:string}>} ports 已解析落港
   */
  build(ports = []) {
    this.clear();

    // 用户要求：只上 12 个站立角色（轮椅不上球），角色可重复
    const pool = CHARACTER_MODELS.filter((m) => this.assets.has(m));
    if (!pool.length) {
      console.warn('[CharacterManager] 没有可用角色模型（需先 assets.loadMiniCharacters(...)）');
      return this;
    }
    this._cacheClips(pool);

    // 落点计划：max(TOTAL, PER_PORT×港数) 人；每港 PER_PORT 个 + 散居补足
    const total = Math.max(CHARACTERS.TOTAL, CHARACTERS.PER_PORT * ports.length);
    const wanderers = Math.max(CHARACTERS.WANDERERS, total - CHARACTERS.PER_PORT * ports.length);
    /** @type {Array<{lat:number, lon:number, home:object|null}>} */
    const plan = [];
    if (this.count > 0) {
      // 显式数量：直接撒 count 个（散居 + 港口附近混合）
      for (let i = 0; i < this.count; i++) {
        plan.push(this._wanderSpot(ports.length && this.rng() < 0.7 ? ports[Math.floor(this.rng() * ports.length)] : null));
      }
    } else {
      for (const p of ports) {
        for (let i = 0; i < CHARACTERS.PER_PORT; i++) plan.push(this._wanderSpot(p));
      }
      for (let i = 0; i < wanderers; i++) plan.push(this._wanderSpot(null));
    }

    let nameIdx = Math.floor(this.rng() * CHAR_NAMES.length);
    const usedNames = new Map();   // 角色可重复 → 名字也加编号（杰克 ×2 → 杰克 / 杰克 II）
    for (let i = 0; i < plan.length; i++) {
      // 模型分配：⚠ 前 N 人按「港口批次 × 池内轮转」发牌，保证 12 个角色全部出场；
      // 之后随机重复（用户允许重复）。
      let model;
      if (i < pool.length) model = pool[i % pool.length];
      else model = pool[Math.floor(this.rng() * pool.length)];
      assertKnownMiniCharacterModel(model);           // 清单防呆（虚构 key 直接抛错）
      const clips = this.clips.get(model) || [];

      const obj = this.assets.instance(model, { shadows: false });
      obj.name = 'character';
      obj.userData.model = model;
      obj.userData.isCharacter = true;
      // 注意：不覆盖 userData.spec（归一化时 ModelUtils 已写入真实 up/forward 轴）

      // ── 骨骼动画：mixer + 共享 clips（同模型 clip 只解析一次） ──
      const mixer = new THREE.AnimationMixer(obj);
      const find = (n) => clips.find((c) => c.name === n) || null;
      const clipsFor = {
        walk: find('walk'),
        sprint: find('sprint'),
        idle: find('idle'),
      };
      if (!Object.values(clipsFor).some(Boolean)) {
        console.warn('[CharacterManager] ' + model + ' 未取到动画 clips（检查 AssetManager.animations）');
      }

      const baseName = CHAR_NAMES[(nameIdx++) % CHAR_NAMES.length];
      const rep = (usedNames.get(baseName) || 0) + 1;
      usedNames.set(baseName, rep);
      const ch = {
        id: 'char-' + i,
        name: rep === 1 ? baseName : baseName + ' ' + (rep === 2 ? 'II' : rep === 3 ? 'III' : String.fromCharCode(63 + rep)),
        model,
        object: obj,
        mixer,
        clips: clipsFor,
        actions: {},
        mode: null,
        home: plan[i].home || null,
        lat: plan[i].lat,
        lon: plan[i].lon,
        latLive: plan[i].lat,
        lonLive: plan[i].lon,
        speed: CHARACTERS.WALK_SPEED_MIN + this.rng() * (CHARACTERS.WALK_SPEED_MAX - CHARACTERS.WALK_SPEED_MIN),
        sprintSpeed: CHARACTERS.SPRINT_SPEED_MIN + this.rng() * (CHARACTERS.SPRINT_SPEED_MAX - CHARACTERS.SPRINT_SPEED_MIN),
        sprintChance: 0.08 + this.rng() * 0.22,
        phase: this.rng() * Math.PI * 2,
        state: 'idle',                  // idle | walk | sprint
        timer: 0.5 + this.rng() * 4,
        target: null,                   // { from:{lat,lon}, lat, lon, dist, walked }
        onFerry: null,                  // 渡轮借调中（FerryManager：隐藏 + 暂停）
        heading: this.rng() * Math.PI * 2,
        position: new THREE.Vector3(),
      };

      this._setMode(ch, 'idle');
      mixer.timeScale = 0.72 + this.rng() * 0.5;      // 微差避免整齐划一

      if (this.registry) {
        this.registry.register(obj, {
          type: 'character',
          tags: ['character', 'walker', model],
          model,
          damageable: false,
          data: { characterId: ch.id },
        });
      }

      this.group.add(obj);
      // 头顶小标记（微光点）：RTS 镜头高度下确认「小人确实在地图上」
      const dot = new THREE.Mesh(CHAR_MARKER_GEO, new THREE.MeshBasicMaterial({
        color: 0xffd977, transparent: true, opacity: 0.9, depthTest: false,
      }));
      dot.renderOrder = 6;                    // 画在地形/建筑之上
      dot.position.y = (ch.object.userData.size ? ch.object.userData.size[1] : 0.7) * getMiniSpec(model).unit + 0.55;
      obj.add(dot);
      ch.marker = dot;
      this.characters.push(ch);
      this._pickNextLeg(ch);            // 先定好第一个目标点，一帧就开始走动
      this._place(ch, 0);
    }
    return this;
  }

  /** 解析并缓存每个模型的动画 clips */
  _cacheClips(models) {
    for (const m of models) {
      if (this.clips.has(m)) continue;
      const clips = this.assets.animations.get(m) || [];
      this.clips.set(m, clips);
    }
  }

  /**
   * 动画模式切换。互斥 = idle / walk / sprint（同角色共享一组动作）。
   * 进入用 fadeIn（从头重播，走路永远迈左脚），离开用 fadeOut 平滑过渡。
   * @param {'idle'|'walk'|'sprint'} mode
   */
  _setMode(ch, mode) {
    const actions = ch.actions;
    const want = mode === 'walk' ? 'walk'
      : mode === 'sprint' && ch.clips.sprint ? 'sprint'
      : 'idle';

    // 动作创建 / 换源（clip 集变化时重建对应 action）
    const ensure = (key) => {
      const clip = ch.clips[key];
      if (!clip) { if (actions[key]) { actions[key].stop(); actions[key] = null; } return; }
      const act = actions[key];
      if (act && act.getClip() === clip) return;
      if (act) act.stop();
      actions[key] = ch.mixer.clipAction(clip);
      actions[key].setLoop(THREE.LoopRepeat, Infinity);
    };
    for (const key of ['idle', 'walk', 'sprint']) ensure(key);

    if (ch.mode === want) return;
    ch.mode = want;

    for (const key of ['idle', 'walk', 'sprint']) {
      const a = actions[key];
      if (!a) continue;
      if (key === want) a.enabled = true;
      else if (a.isRunning()) a.fadeOut(0.25);
      else a.enabled = false;
    }
    const main = actions[want];
    if (main) {
      if (!main.isRunning() || main.time <= 0.0001 || main.time >= main.getClip().duration - 0.0001) {
        main.reset();   // 从头播：走路永远迈左脚
        main.play();
      }
      main.fadeIn(0.25);
    }
  }

  /** 找一个合法落点：偏好港口附近陆地 + 坡度受限 + 不被建筑/树/同伴占用 */
  _wanderSpot(home) {
    const spot = findClearSpot(this.sampler, this.rng, {
      home, homeChance: 0.75, spreadDeg: CHARACTERS.LEG_DIST_MAX_DEG,
      maxSlopeDeg: CHARACTERS.MAX_SLOPE_DEG,
      occupancy: this.occupancy, clearRadius: CHARACTERS.CLEAR_RADIUS,
      includeSelf: true, shoreSafe: true,
    });
    // 兜底：落在港口（resolvePortsOnLand 已保证是陆地）
    return spot ? { ...spot, home } : { lat: home ? home.lat : 0, lon: home ? home.lon : 0, home };
  }

  /** 选下一个步行目标（大圆目的地；避开建筑 / 树 / 同伴占用点）。找不到就原地站桩休息。 */
  _pickNextLeg(ch) {
    const from = { lat: ch.lat, lon: ch.lon };
    const spot = pickNextLegSpot(this.sampler, this.rng, { lat: ch.lat, lon: ch.lon }, {
      minDeg: CHARACTERS.LEG_DIST_MIN_DEG, maxDeg: CHARACTERS.LEG_DIST_MAX_DEG,
      maxSlopeDeg: CHARACTERS.MAX_SLOPE_DEG,
      occupancy: this.occupancy, clearRadius: CHARACTERS.CLEAR_RADIUS,
      minWorldDist: 3, shoreSafe: true,
    });
    if (spot) {
      ch.target = { from, lat: spot.lat, lon: spot.lon, dist: spot.dist, walked: 0 };
      ch.state = this.rng() < ch.sprintChance ? 'sprint' : 'walk';
      this._setMode(ch, ch.state);
      return;
    }
    // 找不到目标：站桩休息一会儿
    ch.target = null;
    ch.state = 'idle';
    ch.timer = CHARACTERS.PAUSE_MIN + this.rng() * (CHARACTERS.PAUSE_MAX - CHARACTERS.PAUSE_MIN);
    ch.heading = this.rng() * Math.PI * 2;
    this._setMode(ch, 'idle');
  }

  /**
   * 摆放一个小人：位置沿大圆弧插值，UP=表面法线，FORWARD=行进切线，贴地走高度场。
   */
  _place(ch, time) {
    const pos = this._posB;
    if (ch.target) {
      const p0 = this.sampler.positionAt(ch.target.from.lat, ch.target.from.lon, 0, this._pos);
      const p1 = this.sampler.positionAt(ch.target.lat, ch.target.lon, 0, this._dst);
      const walked = Math.min(ch.target.dist, ch.target.walked);
      // ⭐ 沿同一条大圆前进 walked（§17 同款，ShipManager 用弧线抬升、这里贴地）
      offsetAlongGreatCircle(p0, p1, walked, this.sampler.radius, pos);
      const ll = vector3ToLatLon(pos);
      ch.latLive = ll.lat; ch.lonLive = ll.lon;
      // FORWARD：当前点 → 前方 4% 处的大圆切线
      const ahead = offsetAlongGreatCircle(p0, p1, Math.min(1, walked / ch.target.dist + 0.04) * ch.target.dist, this.sampler.radius, this._tan).clone();
      greatCircleTangent(pos, ahead, this._tan);
    } else {
      this.sampler.positionAt(ch.lat, ch.lon, 0, pos);
      const n = getSurfaceNormal(pos, this._normal);
      // 站桩朝向：自身 heading 的切线
      const north = this._fwd.set(0, 1, 0);
      if (Math.abs(n.dot(north)) > 0.99) north.set(0, 0, 1);
      north.projectOnPlane(n).normalize();
      rotateInTangentPlane(north, n, ch.heading, this._tan);
      ch.latLive = ch.lat; ch.lonLive = ch.lon;
    }

    // ⭐ 贴地：逻辑半径只取高度场（纯数值，防「起伏抬高→重新反解」正反馈）
    const h = Math.max(this.sampler.heightAt(ch.latLive, ch.lonLive), 0);
    const r = this.sampler.radius + h + CHARACTERS.GROUND_LIFT;

    // 走路起伏：实测 walk clip 0.67s / root +0.05（×unit 2.6 ≈ 0.13 世界单位）
    // → 用 |sin| 同频起伏（直接加在渲染半径上，不参与反解，稳定）
    const moving = ch.target && (ch.state === 'walk' || ch.state === 'sprint');
    const bob = moving
      ? Math.abs(Math.sin(time * (ch.state === 'sprint' ? CHARACTERS.BOB_FREQ_SPRINT : CHARACTERS.BOB_FREQ_WALK) + ch.phase))
        * (ch.state === 'sprint' ? CHARACTERS.BOB_AMP_SPRINT : CHARACTERS.BOB_AMP_WALK)
      : 0;
    pos.setLength(r + bob);

    // 站桩时切线需按当前贴地点重算（法线随位置微变）
    if (!ch.target) {
      const n = getSurfaceNormal(pos, this._normal);
      const north = this._fwd.set(0, 1, 0);
      if (Math.abs(n.dot(north)) > 0.99) north.set(0, 0, 1);
      north.projectOnPlane(n).normalize();
      rotateInTangentPlane(north, n, ch.heading, this._tan);
    }

    // ⭐ UP = 球面外法线，FORWARD = 行进切线（§14，禁止 rotation.set）
    alignObjectToSurface(ch.object, pos, this._tan, { upAxis: 'y', forwardAxis: 'z' });
    ch.position.copy(pos);
  }

  /** 每帧：推进状态机 + 骨骼动画 */
  update(dt, time) {
    if (!this.characters.length) return;
    for (const ch of this.characters) {
      if (ch.onFerry) continue;          // 在渡轮上：隐藏 + 暂停
      if (ch.target) {
        const sp = ch.state === 'sprint' ? ch.sprintSpeed : ch.speed;
        ch.target.walked += sp * dt;
        if (ch.target.walked >= ch.target.dist) {
          // 到达：落到目标点，站桩休息
          ch.lat = ch.target.lat;
          ch.lon = ch.target.lon;
          ch.target = null;
          ch.state = 'idle';
          ch.timer = CHARACTERS.PAUSE_MIN + this.rng() * (CHARACTERS.PAUSE_MAX - CHARACTERS.PAUSE_MIN);
          ch.heading = this.rng() * Math.PI * 2;
          this._setMode(ch, 'idle');
        }
      } else {
        ch.timer -= dt;
        if (ch.timer <= 0) this._pickNextLeg(ch);
      }
      this._place(ch, time);
      ch.mixer.update(dt);
    }
  }

  /** 控制台 / UI：一个小人在干什么 */
  describe(ch) {
    return {
      name: ch.name,
      kind: '岛民',
      model: ch.model,
      state: ch.state,
      home: ch.home ? ch.home.name : '流浪',
      lat: +ch.latLive.toFixed(2),
      lon: +ch.lonLive.toFixed(2),
    };
  }

  summary() {
    const byState = {};
    for (const c of this.characters) byState[c.state] = (byState[c.state] || 0) + 1;
    return {
      characters: this.characters.length,
      byState,
      modelsUsed: [...new Set(this.characters.map((c) => c.model))].length,
    };
  }

  setVisible(v) { this.group.visible = !!v; }

  clear() {
    for (const c of this.characters) {
      c.mixer.stopAllAction();
      if (c.marker) c.marker.material.dispose();   // 几何共享 CHAR_MARKER_GEO，不销毁
      this.group.remove(c.object);
    }
    this.characters.length = 0;
  }
}
