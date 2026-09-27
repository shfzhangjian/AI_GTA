/**
 * WalkerBase.js — 球面步行的共享落点逻辑（角色 / 动物 / 渡运共用）
 *
 * 铁律不变：落位只走 TerrainSampler 高度场 + 坡度限制；
 * 新增：occupancy 避让 —— 落点必须离建筑 / 树 / 其它走行者足够远（防穿模）。
 * 大圆弧移动与姿态（UP=法线 / FORWARD=切线）留在各管理器（单位不同但范式相同）。
 */
import * as THREE from 'three';
import { greatCircleDistance } from '../utils/GeoUtils.js';

const DEG = Math.PI / 180;

/**
 * 找一个合法出生/落脚位置：陆地 + 坡度 + 未被占用。
 * @param {import('./TerrainSampler.js').TerrainSampler} sampler
 * @param {() => number} rng
 * @param {{
 *   home?: {lat:number, lon:number}|null,  偏好附近（home 港口）
 *   homeChance?: number,
 *   spreadDeg?: number,                     home 撒布半径
 *   maxSlopeDeg: number,
 *   occupancy?: import('./GroundOccupancy.js').GroundOccupancy|null,
 *   clearRadius: number,                    与占用点的最小间距（世界单位）
 *   includeSelf?: boolean,                  是否也把自己注册进 occupancy（落位后防叠人）
 *   tries?: number,
 * }} opts
 * @returns {{lat:number, lon:number}|null}
 */
export function findClearSpot(sampler, rng, opts) {
  const {
    home = null, homeChance = 0.75, spreadDeg = 10,
    maxSlopeDeg, occupancy = null, clearRadius = 2,
    includeSelf = false, tries = 60,
    shoreSafe = false,                       // 用户：岛民/小动物不能走到海边
  } = opts;
  for (let t = 0; t < tries; t++) {
    let lat, lon;
    if (home && rng() < homeChance) {
      const r = rng() * spreadDeg;
      const a = rng() * Math.PI * 2;
      lat = THREE.MathUtils.clamp(home.lat + Math.sin(a) * r, -68, 68);
      lon = home.lon + (Math.cos(a) * r) / Math.max(0.25, Math.cos(lat * DEG));
    } else {
      lat = Math.asin(rng() * 2 - 1) / DEG;
      lon = rng() * 360 - 180;
    }
    let near = sampler.nearestBuildable(lat, lon, 10, 1.2);
    if (!near) continue;
    if (shoreSafe) {
      // 海岸缓冲：落点必须离水线足够远（否则螺旋进内陆）
      if (!sampler.isWalkerAllowed(near.lat, near.lon)) {
        near = sampler.nearestShorePoint(near.lat, near.lon, 16, 1.5) || near;
        if (!sampler.isWalkerAllowed(near.lat, near.lon)) continue;
      }
    }
    if (sampler.slopeDeg(near.lat, near.lon) > maxSlopeDeg) continue;
    if (occupancy && occupancy.blocked(near.lat, near.lon, clearRadius)) continue;
    if (includeSelf && occupancy) occupancy.add(near.lat, near.lon, clearRadius * 0.55);
    return { lat: near.lat, lon: near.lon };
  }
  // 兜底：home 点本身（resolvePortsOnLand 保证是陆地）
  if (home) return { lat: home.lat, lon: home.lon };
  return null;
}

/**
 * 选下一个步行目标点（同族逻辑：以当前位置为圆心的可建造空地）。
 * @returns {{lat:number, lon:number, dist:number}|null} dist = 大圆距离（世界单位）
 */
export function pickNextLegSpot(sampler, rng, cur, opts) {
  const {
    minDeg, maxDeg, maxSlopeDeg,
    occupancy = null, clearRadius = 2, minWorldDist = 3,
    radius = sampler.radius, shoreSafe = false,
  } = opts;
  for (let t = 0; t < 24; t++) {
    const span = minDeg + rng() * (maxDeg - minDeg);
    const a = rng() * Math.PI * 2;
    const lat = THREE.MathUtils.clamp(cur.lat + Math.sin(a) * span, -68, 68);
    const lon = cur.lon + (Math.cos(a) * span) / Math.max(0.25, Math.cos(cur.lat * DEG));
    let near = sampler.nearestBuildable(lat, lon, 8, 1.2);
    if (!near) continue;
    if (shoreSafe) {
      if (!sampler.isWalkerAllowed(near.lat, near.lon)) {
        near = sampler.nearestShorePoint(near.lat, near.lon, 14, 1.5) || near;
        if (!sampler.isWalkerAllowed(near.lat, near.lon)) continue;
      }
    }
    if (sampler.slopeDeg(near.lat, near.lon) > maxSlopeDeg) continue;
    if (occupancy && occupancy.blocked(near.lat, near.lon, clearRadius)) continue;
    const p0 = sampler.positionAt(cur.lat, cur.lon, 0, new THREE.Vector3());
    const p1 = sampler.positionAt(near.lat, near.lon, 0, new THREE.Vector3());
    const dist = greatCircleDistance(p0, p1, radius);
    if (dist < minWorldDist) continue;
    return { lat: near.lat, lon: near.lon, dist };
  }
  return null;
}
