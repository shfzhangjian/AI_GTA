/**
 * GroundOccupancy.js — 落点占用网格（防穿模的唯一共享来源）
 *
 * 港口建筑 / 树木（Instancing 植被）落位后，其「地面占用点」注册进来；
 * 小人与小动物选落点时查询半径内是否被占用 → 不会生成在墙里 / 树干里 / 人堆里。
 *
 * 球面距离按世界单位计算（世界单位 = 半径 × 弧度），与 PETS.CLEAR_RADIUS 同单位。
 */
import * as THREE from 'three';

const _a = new THREE.Vector3();
const _b = new THREE.Vector3();

/**
 * 经纬度 → 单位球面点（弧长 = 半径 × 夹角；用单位球夹角 × R 换算世界单位距离）
 */
function dirOf(lat, lon, out) {
  const phi = (90 - lat) * Math.PI / 180;
  const theta = (lon + 180) * Math.PI / 180;
  const sp = Math.sin(phi);
  return out.set(-sp * Math.cos(theta), Math.cos(phi), sp * Math.sin(theta));
}

export class GroundOccupancy {
  /**
   * @param {number} radius 世界半径（PLANET.RADIUS），距离换算用
   */
  constructor(radius = 100) {
    this.radius = radius;
    /** @type {Array<{x:number,y:number,z:number,r:number}>} 单位球点 + 半径（世界单位） */
    this.points = [];
  }

  /**
   * 注册一个占用点（建筑中心 / 树干 / 角色出生点…）
   * @param {number} lat
   * @param {number} lon
   * @param {number} r 占用半径（世界单位）
   */
  add(lat, lon, r = 1.5) {
    const p = dirOf(lat, lon, new THREE.Vector3());
    this.points.push({ x: p.x, y: p.y, z: p.z, r });
    return this;
  }

  /** 批量：把 {lat,lon} 点集按半径 r 注册 */
  addAll(list, r = 1.5) {
    for (const p of list) this.add(p.lat, p.lon, r);
    return this;
  }

  /**
   * (lat,lon) 处半径 needR 内是否有占用点？
   * 夹角阈值 = (r + needR) / R（弧度）
   */
  blocked(lat, lon, needR = 1) {
    dirOf(lat, lon, _a);
    for (const p of this.points) {
      _b.set(p.x, p.y, p.z);
      const dot = THREE.MathUtils.clamp(_a.dot(_b), -1, 1);
      const gap = Math.acos(dot) * this.radius;    // 世界单位弧长
      if (gap < p.r + needR) return true;
    }
    return false;
  }

  /** 清空（重建世界时） */
  clear() { this.points.length = 0; }

  get count() { return this.points.length; }
}
