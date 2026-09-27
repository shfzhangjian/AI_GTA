/**
 * TerrainSampler.js — 地形查询的唯一入口（Phase 3）
 *
 * 存在意义（解决之前反复出错的根因）：
 *   陆地「显示」用的是 CPU 高度场；如果建筑/树木/港口各自再算一遍高度，
 *   就会出现「模型悬浮 / 陷进地里 / 与海岸错位」。因此**一切落位都必须走本文件**，
 *   与陆地显示共用同一份 heightField 数值。
 *
 * 提供：
 *   heightAt(lat, lon)            地表高度（世界单位，<=0 = 海面下）
 *   positionAt(lat, lon, extra)   地表世界坐标（沿法线抬升 extra）
 *   normalAt(position)            球面法线
 *   frameAt(lat, lon)             { position, normal, north, east } 局部切空间
 *   isLand / isShore              可建造性判断
 *   findLandings(port, n)         为港口找 n 个「平坦可建造」落点
 *   scatter(count, opts)          在陆地上程序化撒点（植被用）
 */
import * as THREE from 'three';
import { PLANET } from '../config.js';
import { latLonToVector3, getSurfaceNormal, rotateInTangentPlane } from '../utils/GeoUtils.js';

const _p = new THREE.Vector3();
const _n = new THREE.Vector3();
const _a = new THREE.Vector3();
const _b = new THREE.Vector3();

/** 大陆锚点用的确定性种子 rng（同 id 同序列 → 锚点可比） */
function mulberrySeed(id) {
  let t = (id * 2654435761) >>> 0;
  return () => {
    t += 0x6d2b79f5; t >>>= 0;
    let x = Math.imul(t ^ (t >>> 15), 1 | t);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

export class TerrainSampler {
  /**
   * @param {ReturnType<import('../planet/Land.js').makeHeightField>} field
   */
  constructor(field, opts = {}) {
    this.field = field;
    this.radius = opts.radius ?? PLANET.RADIUS;
    /** 判定「可建造」的最小高度（避免种在浪里） */
    this.minLandHeight = opts.minLandHeight ?? 0.45;
    /** 判定「太陡不可建造」的法线夹角（度） */
    this.maxSlopeDeg = opts.maxSlopeDeg ?? 26;
    this._tmp = new THREE.Vector3();
  }

  /**
   * 大陆归属（连通陆地块 ID）= 港口聚落图判定：
   * 两港「同大陆」⇔ A 港的聚落锚点集（findLandings，保证间距 0.9° 可达）
   * 与 B 港的聚落锚点集有交集（互相能走到）。离散采样会因「不可建造空隙」
   * 把同一块大陆切碎（实测 2.2° BFS 全港同 id → 已修正为聚落图并查集）。
   * 结果缓存（只算一次）。@returns {number} 大陆 id
   */
  continentOf(lat, lon, searchDeg = 26) {
    if (!this._contCache) this._contCache = new Map();
    const key = lat.toFixed(2) + ',' + lon.toFixed(2);
    const cached = this._contCache.get(key);
    if (cached !== undefined) return cached;
    // 港点 → 锚点集（findLandings 的最近可建造点链）
    const portA = this.nearestBuildable(lat, lon, searchDeg, 1.5);
    if (!portA) return -1;
    const aKey = portA.lat.toFixed(2) + ',' + portA.lon.toFixed(2);
    // 找已有大陆：任一已登记港的锚点集包含 portA → 归入
    this._contPorts = this._contPorts || [];
    let id = -1;
    for (const rec of this._contPorts) {
      if (rec.keys.has(aKey) || rec.keys.has(key)) { id = rec.id; break; }
      // 双向：portA 的可达锚点里有 rec 的锚点
      const hits = this.findLandings(lat, lon, 14, 8, mulberrySeed(rec.id));
      if (hits.some((h) => rec.keys.has(h.lat.toFixed(2) + ',' + h.lon.toFixed(2)))) { id = rec.id; break; }
    }
    if (id < 0) id = (this._contNext = (this._contNext || 2000) + 1);
    const rec = this._contPorts.find((r) => r.id === id);
    const anchors = this.findLandings(lat, lon, 14, 8, mulberrySeed(id));
    const keys = new Set(anchors.map((h) => h.lat.toFixed(2) + ',' + h.lon.toFixed(2)));
    keys.add(aKey); keys.add(key);
    if (rec) { for (const k of keys) rec.keys.add(k); }
    else this._contPorts.push({ id, keys });
    this._contCache.set(key, id);
    return id;
  }

  /** findLandings 的种子 rng（同一港每次结果一致 → 锚点可比较） */
  /** 螺旋搜索最近陆地（不要求可建造，只要求 isLand） */
  nearestLandPoint(lat, lon, maxSearchDeg = 30, stepDeg = 2) {
    if (this.isLand(lat, lon)) return { lat, lon };
    for (let r = stepDeg; r <= maxSearchDeg; r += stepDeg) {
      const steps = Math.max(8, Math.round((2 * Math.PI * r) / stepDeg));
      for (let i = 0; i < steps; i++) {
        const a = (i / steps) * Math.PI * 2;
        const la = THREE.MathUtils.clamp(lat + Math.sin(a) * r, -78, 78);
        const dLon = 1 / Math.max(0.25, Math.cos(THREE.MathUtils.degToRad(la)));
        const lo = lon + Math.cos(a) * r * dLon;
        if (this.isLand(la, lo)) return { lat: la, lon: lo };
      }
    }
    return null;
  }

  /** 地表高度（世界单位；<=0 = 海面下） */
  heightAt(lat, lon) {
    return this.field.sample({ lat, lon });
  }

  /** 方向向量形式的高度（内部/几何用） */
  heightAtDir(x, y, z) {
    return this.field.sample({ x, y, z });
  }

  /** 是否可建造陆地 */
  isLand(lat, lon) {
    return this.heightAt(lat, lon) >= this.minLandHeight;
  }

  /** 是否海滩（近海低地）——棕榈树偏好这里 */
  isShore(lat, lon) {
    const h = this.heightAt(lat, lon);
    return h > 0.05 && h < 1.1;
  }

  /**
   * 离海岸线的近似弧长距离（世界单位）。
   * ⚠ 球面数学（方向旋转 / 反解经纬）全走 GeoUtils —— 本文件不重复实现。
   */
  shoreDistance(lat, lon) {
    const SH = PLANET.SHORE_MIN_HEIGHT;
    if (this.heightAt(lat, lon) < SH) return 0;
    for (let d = 1.0; d <= 10; d += 1.0) {       // 1 度 ≈ 1.75 世界单位 → 10° ≈ 17u
      for (const [dlat, dlon] of [[d, 0], [-d, 0], [0, d], [0, -d]]) {
        if (this.heightAt(lat + dlat, lon + dlon) < SH) return d * DEG2UNIT;
      }
    }
    return 10 * DEG2UNIT;                        // 大于 10° = 深处内陆
  }

  /** 岛民 / 小动物是否允许落脚：足够内陆（用户：不能走到海边） */
  isWalkerAllowed(lat, lon) {
    return this.heightAt(lat, lon) >= PLANET.SHORE_MIN_HEIGHT
      && this.shoreDistance(lat, lon) >= PLANET.SHORE_BUFFER_UNITS;
  }

  /** 最近的合法落脚点（内陆方向螺旋搜索）。找不到 → null */
  nearestShorePoint(lat, lon, maxSearchDeg = 20, stepDeg = 1.6) {
    if (this.isWalkerAllowed(lat, lon)) return { lat, lon, h: this.heightAt(lat, lon) };
    for (let r = stepDeg; r <= maxSearchDeg; r += stepDeg) {
      const steps = Math.max(8, Math.round((2 * Math.PI * r) / stepDeg));
      for (let i = 0; i < steps; i++) {
        const a = (i / steps) * Math.PI * 2;
        const la = THREE.MathUtils.clamp(lat + Math.sin(a) * r, -72, 72);
        const lo = lon + Math.cos(a) * r * (1 / Math.max(0.25, Math.cos(THREE.MathUtils.degToRad(la))));
        if (this.isWalkerAllowed(la, lo)) return { lat: la, lon: lo, h: this.heightAt(la, lo) };
      }
    }
    return null;
  }

  /** 球面外法线 */
  normalAt(position, out = new THREE.Vector3()) {
    return getSurfaceNormal(position, out);
  }

  /**
   * 地表世界坐标
   * @param {number} extra 额外抬升（贴地 = 0，略浮 = 正值）
   */
  positionAt(lat, lon, extra = 0, out = new THREE.Vector3()) {
    return latLonToVector3(lat, lon, this.radius + this.heightAt(lat, lon) + extra, out);
  }

  /**
   * 局部切空间：法线 + 正北 + 正东（用于把「港口平面」铺到球面）
   */
  frameAt(lat, lon) {
    const position = this.positionAt(lat, lon, 0, new THREE.Vector3());
    const normal = this.normalAt(position, new THREE.Vector3());
    // 正北：球面 +Y 投影到切平面
    const north = _a.set(0, 1, 0).projectOnPlane(normal).normalize();
    // 对跖退化处理
    if (north.lengthSq() < 1e-8) north.set(1, 0, 0).projectOnPlane(normal).normalize();
    const east = north.clone().cross(normal).normalize();
    return { position, normal, north: north.clone(), east };
  }

  /**
   * 地表某点法线（**用地形梯度**，不是纯径向）→ 判断坡度用。
   * 通过邻域高度差估计真实坡面法线。
   */
  terrainNormal(lat, lon, out = new THREE.Vector3()) {
    const step = 1.2; // 度
    const hC = this.heightAt(lat, lon);
    const hN = this.heightAt(lat + step, lon);
    const hE = this.heightAt(lat, lon + step);
    const base = this.positionAt(lat, lon, 0, _p);
    const pn = this.positionAt(lat + step, lon, 0, _a);
    const pe = this.positionAt(lat, lon + step, 0, _b);
    // 用高度差微调邻域点半径，得到真实坡面
    pn.setLength(this.radius + hN);
    pe.setLength(this.radius + hE);
    out.crossVectors(_b.copy(pe).sub(base), _n.copy(pn).sub(base));
    if (out.lengthSq() < 1e-10) return this.normalAt(base, out);
    out.normalize();
    // 统一朝外
    if (out.dot(this.normalAt(base, _n)) < 0) out.negate();
    void hC;
    return out;
  }

  /** 坡度（度）：0 = 水平地面，越大越陡 */
  slopeDeg(lat, lon) {
    const tn = this.terrainNormal(lat, lon, this._tmp);
    const radial = this.positionAt(lat, lon, 0, _p).normalize();
    return THREE.MathUtils.radToDeg(Math.acos(THREE.MathUtils.clamp(tn.dot(radial), -1, 1)));
  }

  /** 可建造：有陆地 + 坡度可接受 */
  isBuildable(lat, lon) {
    return this.isLand(lat, lon) && this.slopeDeg(lat, lon) <= this.maxSlopeDeg;
  }

  /**
   * 从 (lat,lon) 出发螺旋搜索最近的可建造点
   * @returns {{lat:number,lon:number,h:number}|null}
   */
  nearestBuildable(lat, lon, maxSearchDeg = 22, stepDeg = 1.5) {
    if (this.isBuildable(lat, lon)) return { lat, lon, h: this.heightAt(lat, lon) };
    for (let r = stepDeg; r <= maxSearchDeg; r += stepDeg) {
      const steps = Math.max(6, Math.round((2 * Math.PI * r) / stepDeg));
      for (let i = 0; i < steps; i++) {
        const a = (i / steps) * Math.PI * 2;
        const la = THREE.MathUtils.clamp(lat + Math.sin(a) * r, -72, 72);
        const lo = lon + Math.cos(a) * r * (1 / Math.max(0.25, Math.cos(THREE.MathUtils.degToRad(la))));
        if (this.isBuildable(la, lo)) return { lat: la, lon: lo, h: this.heightAt(la, lo) };
      }
    }
    return null;
  }

  /**
   * 为港口找 n 个可建造落点（围绕中心向外铺开，落在切平面附近以模拟「聚落」）
   * @param {number} centerLat
   * @param {number} centerLon
   * @param {number} n
   * @param {number} radiusDeg 聚落半径（度）
   */
  findLandings(centerLat, centerLon, n, radiusDeg = 6, rng = Math.random) {
    const out = [];
    let guard = 0;
    let tries = 0;
    while (out.length < n && tries < n * 40 && guard < 4000) {
      guard++;
      // 极坐标散布：近中心密度高
      const t = Math.pow(rng(), 0.62);
      const r = t * radiusDeg;
      const a = rng() * Math.PI * 2;
      const lat = centerLat + Math.sin(a) * r;
      const lon = centerLon + (Math.cos(a) * r) / Math.max(0.25, Math.cos(THREE.MathUtils.degToRad(centerLat)));
      tries++;
      if (lat < -72 || lat > 72) continue;
      const near = this.nearestBuildable(lat, lon, 3.2, 0.8);
      if (!near) continue;
      // 间距约束，避免建筑重叠
      let ok = true;
      for (const q of out) {
        if (this._degDist(q, near) < 0.9) { ok = false; break; }
      }
      if (ok) out.push(near);
    }
    return out;
  }

  /**
   * 在陆地上程序化撒点（植被/岩石用）
   * @param {number} count
   * @param {{minH?:number, maxH?:number, maxSlopeDeg?:number, rng?:()=>number, bias?:'shore'|'inland'|'any'}} opts
   */
  scatter(count, opts = {}) {
    const rng = opts.rng || Math.random;
    const minH = opts.minH ?? this.minLandHeight;
    const maxH = opts.maxH ?? 99;
    const maxSlope = opts.maxSlopeDeg ?? this.maxSlopeDeg;
    const bias = opts.bias ?? 'any';
    /** 防穿模：占用网格（PortManager 建筑落位先注册）+ 需要的避让半径 */
    const occ = opts.occupancy || null;
    const clearR = opts.clearRadius ?? 0;
    const selfOcc = !!opts.includeSelf && !!occ;
    const selfR = opts.selfRadius ?? clearR;
    const out = [];
    let guard = 0;
    const cap = count * 60;
    while (out.length < count && guard < cap) {
      guard++;
      const lat = Math.asin(rng() * 2 - 1) * RAD2DEG;   // 均匀球面分布（避免极区过密）
      const lon = rng() * 360 - 180;
      const h = this.heightAt(lat, lon);
      if (h < minH || h > maxH) continue;
      if (bias === 'shore' && h > 1.6) continue;
      if (bias === 'inland' && h < 1.4) continue;
      if (maxSlope < 90 && this.slopeDeg(lat, lon) > maxSlope) continue;
      if (occ && occ.blocked(lat, lon, clearR)) continue;
      if (selfOcc) occ.add(lat, lon, selfR);   // 植被间互斥：选中即占位
      out.push({ lat, lon, h });
    }
    return out;
  }

  _degDist(a, b) {
    const dLat = a.lat - b.lat;
    const dLon = (a.lon - b.lon) * Math.cos(THREE.MathUtils.degToRad((a.lat + b.lat) / 2));
    return Math.hypot(dLat, dLon);
  }
}

const RAD2DEG = 180 / Math.PI;
/** 1° 纬度 ≈ R×π/180 世界单位（距离换算唯一来源） */
const DEG2UNIT = PLANET.RADIUS * Math.PI / 180;

/**
 * 把「以 +Y 为上、+Z 为前」的模型摆到球面某地表点，并可选按方位角旋转。
 * 港内布局常用：先取 frameAt 的切空间，再算 forwardHint。
 * @returns {{position:THREE.Vector3, normal:THREE.Vector3, forward:THREE.Vector3}}
 */
export function surfaceFrameAt(sampler, lat, lon, headingDeg = 0, extra = 0) {
  const { position, normal, north, east } = sampler.frameAt(lat, lon);
  position.setLength(sampler.radius + sampler.heightAt(lat, lon) + extra);
  const f = rotateInTangentPlane(north, normal, THREE.MathUtils.degToRad(headingDeg), new THREE.Vector3());
  void east;
  return { position, normal, forward: f };
}
