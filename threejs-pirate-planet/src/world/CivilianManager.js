/**
 * CivilianManager.js — 岛上散居民居
 *
 * 民居不再塞进港口/城堡布局里：每个港口按岛民数量散落完整房子
 * （structure + structure-roof 同点位成对），落点走 TerrainSampler + occupancy。
 */
import * as THREE from 'three';
import { CHARACTERS } from '../config.js';
import { alignObjectToSurface, rotateInTangentPlane } from '../utils/GeoUtils.js';
import { mulberry32 } from '../planet/Clouds.js';
import { findClearSpot } from './WalkerBase.js';

export class CivilianManager {
  /**
   * @param {{sceneManager, assets, sampler, occupancy?, characters?, group?, seed?}} deps
   */
  constructor(deps) {
    this.sm = deps.sceneManager;
    this.assets = deps.assets;
    this.sampler = deps.sampler;
    this.occupancy = deps.occupancy || null;
    this.characters = deps.characters || null;
    this.group = deps.group || this.sm.buildings || this.sm.world;
    this.group.name = 'Buildings';
    this.rng = mulberry32(deps.seed ?? 424242);
    this.houses = [];
    this.stats = { houses: 0, ports: 0 };
    this._north = new THREE.Vector3();
    this._forward = new THREE.Vector3();
  }

  build(ports = []) {
    this.clear();
    if (!this.assets.has('structure') || !this.assets.has('structure-roof')) {
      console.warn('[CivilianManager] 缺少 structure / structure-roof，跳过民居');
      return this;
    }

    for (const port of ports) {
      const count = this._houseCountFor(port);
      for (let i = 0; i < count; i++) this._buildHouse(port, i);
    }
    this.stats.ports = ports.length;
    return this;
  }

  _houseCountFor(port) {
    const chars = this.characters && this.characters.characters ? this.characters.characters : [];
    const n = chars.filter((c) => c.home && (c.home === port || c.home.id === port.id)).length;
    return Math.max(CHARACTERS.PER_PORT, n || 0);
  }

  _buildHouse(port, index) {
    const spot = findClearSpot(this.sampler, this.rng, {
      home: port,
      homeChance: 1,
      spreadDeg: 14,
      maxSlopeDeg: 20,
      occupancy: this.occupancy,
      clearRadius: 3.2,
      includeSelf: true,
      tries: 120,
      shoreSafe: true,
    });
    if (!spot) return;

    const base = this.assets.instance('structure', { shadows: false });
    const roof = this.assets.instance('structure-roof', { shadows: false });
    const group = new THREE.Group();
    group.name = 'House:' + port.id + ':' + index;
    group.userData.isHouse = true;
    group.userData.port = port.id;

    const pos = this.sampler.positionAt(spot.lat, spot.lon, -0.25, new THREE.Vector3());
    const normal = pos.clone().normalize();
    this._north.set(0, 1, 0);
    if (Math.abs(this._north.dot(normal)) > 0.98) this._north.set(0, 0, 1);
    this._north.projectOnPlane(normal).normalize();
    rotateInTangentPlane(this._north, normal, this.rng() * Math.PI * 2, this._forward);

    alignObjectToSurface(group, pos, this._forward, { upAxis: 'y', forwardAxis: 'z' });
    roof.position.y = 2.05;
    group.add(base);
    group.add(roof);
    this.group.add(group);

    this.houses.push({ object: group, port, lat: spot.lat, lon: spot.lon });
    this.stats.houses++;
  }

  clear() {
    for (const h of this.houses) this.group.remove(h.object);
    this.houses.length = 0;
    this.stats = { houses: 0, ports: 0 };
  }

  summary() {
    return { houses: this.stats.houses, ports: this.stats.ports };
  }
}
