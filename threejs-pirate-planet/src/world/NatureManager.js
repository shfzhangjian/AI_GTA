/**
 * NatureManager.js — 程序化自然植被（§34 Instancing / §13 陆地生态）
 *
 * 棕榈树、岩石、草丛分别用 InstancedMesh 铺到陆地上：
 *   · 落位走 TerrainSampler（与陆地显示同一高度场）→ 绝不悬浮/陷地
 *   · 姿态走 alignObjectToSurface（UP = 球面外法线）→ 树沿球面生长
 *   · 棕榈偏好海滩与内陆，岩石偏好坡地与海岸
 *
 * DrawCall：棕榈 2（直/弯）+ 岩石 3 + 草 1 ≈ 6 个 DrawCall 覆盖数千实例。
 */
import { PLANET } from '../config.js';
import { InstancedPropLayer, bakeInstancedAsset } from './InstancedPropLayer.js';
import { mulberry32 } from '../planet/Clouds.js';

const PALM_VARIANTS = ['palm-straight', 'palm-bend'];
const ROCK_VARIANTS = ['rocks-a', 'rocks-b', 'rocks-sand-a'];
const GRASS_VARIANTS = ['grass-patch'];

export class NatureManager {
  /**
   * @param {{sceneManager, assets, sampler, group?}} deps
   */
  constructor(deps) {
    this.sm = deps.sceneManager;
    this.assets = deps.assets;
    this.sampler = deps.sampler;
    this.rng = mulberry32(deps.seed ?? 24680);
    this.group = deps.group || this.sm.props;
    /** 防穿模：每棵树占地注册进共享占用网格（角色 / 动物落位避让） */
    this.occupancy = deps.occupancy || null;
    this.layers = [];
    this.stats = { palms: 0, rocks: 0, grass: 0 };
  }

  /**
   * 铺设植被。
   * @param {{palms?:number, rocks?:number, grass?:number}} counts
   */
  build(counts = {}) {
    const palmCount = counts.palms ?? 900;
    const rockCount = counts.rocks ?? 420;
    const grassCount = counts.grass ?? 700;

    this._buildPalms(palmCount);
    this._buildRocks(rockCount);
    this._buildGrass(grassCount);

    return this;
  }

  /** 把归一化模型批量烘成实例几何（走 AssetManager 的归一化缓存，杜绝自嵌套） */
  _bakeAll(names) {
    return names
      .filter((n) => this.assets.has(n))
      .map((n) => {
        const norm = this.assets.normalized(n, { shadows: false });
        const baked = bakeInstancedAsset(norm.group, n);
        return { name: n, ...baked };
      });
  }

  _buildPalms(count) {
    const baked = this._bakeAll(PALM_VARIANTS);
    if (!baked.length) return;
    const layer = new InstancedPropLayer({ name: 'Palms', capacity: count, material: baked[0].material });
    for (const b of baked) layer.addVariant(b.geometry, b.name, b.material);
    // ⚠ bakeInstancedAsset 已把模型的 unit 缩放 / 底面抬升烘进顶点
    //   → 实例 scale 必须 ≈1，否则会被重复放大（实测曾到 ~70 倍，棕榈比山还高）

    // 防重叠：避开港口建筑占地（ports 必须先建）+ 树与树互斥
    //   occAll = 建筑点 + 已放的树/岩石（同一张 GroundOccupancy 越铺越满）
    const spots = this.sampler.scatter(count, {
      minH: 0.5, maxH: 4.6, maxSlopeDeg: 30, rng: this.rng,
      occupancy: this.occupancy, clearRadius: 2.2,
      includeSelf: true, selfRadius: 1.8,     // 选中即注册 → 后续树不落在前一棵树冠里
    });
    for (const s of spots) {
      const pos = this.sampler.positionAt(s.lat, s.lon, -0.2);
      const variant = this.rng() < 0.5 ? 0 : 1;
      const scale = 0.72 + this.rng() * 0.55;          // 基准 1（几何已含真实尺度）
      layer.push(pos, { variant, scale, scaleY: scale * (0.88 + this.rng() * 0.3), heading: this.rng() * Math.PI * 2 });
      if (this.occupancy) this.occupancy.add(s.lat, s.lon, 1.6 + scale * 0.8);   // 树干 + 树冠占地
    }
    layer.finish();
    this.layers.push(layer);
    this.group.add(layer.group);
    this.stats.palms = layer.total;
  }

  _buildRocks(count) {
    const baked = this._bakeAll(ROCK_VARIANTS);
    if (!baked.length) return;
    const layer = new InstancedPropLayer({ name: 'Rocks', capacity: count, material: baked[0].material });
    for (const b of baked) layer.addVariant(b.geometry, b.name, b.material);

    const spots = this.sampler.scatter(count, {
      minH: 0.25, maxH: 99, maxSlopeDeg: 60, rng: this.rng,
      occupancy: this.occupancy, clearRadius: 1.6,
      includeSelf: true, selfRadius: 1.1,     // 岩石互斥
    });
    for (const s of spots) {
      const pos = this.sampler.positionAt(s.lat, s.lon, -0.25);
      const variant = Math.floor(this.rng() * layer.variants.length);
      const scale = 0.45 + this.rng() * 0.95;
      layer.push(pos, { variant, scale, scaleY: scale * (0.55 + this.rng() * 0.45), heading: this.rng() * Math.PI * 2 });
      if (this.occupancy) this.occupancy.add(s.lat, s.lon, 0.8 + scale * 0.7);   // 岩石占地
    }
    layer.finish();
    this.layers.push(layer);
    this.group.add(layer.group);
    this.stats.rocks = layer.total;
  }

  _buildGrass(count) {
    const baked = this._bakeAll(GRASS_VARIANTS);
    if (!baked.length) return;
    const layer = new InstancedPropLayer({
      name: 'Grass', capacity: count, material: baked[0].material, castShadow: false,
    });
    for (const b of baked) layer.addVariant(b.geometry, b.name, b.material);

    const spots = this.sampler.scatter(count, {
      minH: 0.7, maxH: 3.6, maxSlopeDeg: 34, rng: this.rng, bias: 'inland',
      occupancy: this.occupancy, clearRadius: 1.0,     // 草丛也避开建筑（视觉整洁）
    });
    for (const s of spots) {
      const pos = this.sampler.positionAt(s.lat, s.lon, -0.05);
      const scale = 0.7 + this.rng() * 1.1;
      layer.push(pos, { variant: 0, scale, heading: this.rng() * Math.PI * 2 });
    }
    layer.finish();
    this.layers.push(layer);
    this.group.add(layer.group);
    this.stats.grass = layer.total;
  }

  /** 显示开关（LOD 雏形：全球视角可关草/岩细碎物） */
  setVisible(key, visible) {
    const map = { palms: 'Palms', rocks: 'Rocks', grass: 'Grass' };
    const name = map[key];
    if (!name) return;
    const l = this.layersByName[name];
    if (l) l.group.visible = !!visible;
  }

  /** 控制台统计 */
  summary() {
    const drawCalls = this.layers.reduce((s, l) => s + l.drawCalls, 0);
    const inst = this.layers.reduce((s, l) => s + l.total, 0);
    return { ...this.stats, drawCalls, instances: inst };
  }

  /** 供 LOD：返回各层（按 name 索引） */
  /** InstancedPropLayer 实例按名字索引（.group 可整体显隐） */
  get layersByName() {
    const out = {};
    for (const l of this.layers) out[l.name] = l;
    return out;
  }

  dispose() {
    for (const l of this.layers) l.dispose();
    this.layers.length = 0;
  }
}

export { PLANET };
