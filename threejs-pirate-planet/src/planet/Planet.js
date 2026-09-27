/**
 * Planet.js — 星球本体聚合（§11）
 * Ocean Sphere / Land Mesh / Cloud Layer / Atmosphere Sphere
 * 半径关系集中在 config.PLANET，绝不在这里硬编码。
 */
import * as THREE from 'three';
import { PLANET } from '../config.js';
import { latLonToVector3 } from '../utils/GeoUtils.js';
import { createOcean } from './Ocean.js';
import { createLand, makeHeightField } from './Land.js';
import { createAtmosphere } from './Atmosphere.js';
import { createClouds, createGroundMist } from './Clouds.js';

export class Planet {
  /**
   * @param {import('../core/SceneManager.js').SceneManager} sceneManager
   */
  constructor(sceneManager, opts = {}) {
    this.sm = sceneManager;
    this.radius = opts.radius ?? PLANET.RADIUS;

    this.landAmt = opts.landAmt ?? 1.35;
    this.heightField = opts.heightField || makeHeightField(opts.seed ?? 1337, this.landAmt);

    this.ocean = createOcean(this.radius);
    this.landAmt = opts.landAmt ?? 1.35;
    this.land = createLand(this.radius, { field: this.heightField, width: opts.landWidth, height: opts.landHeight, landAmt: this.landAmt });
    this.atmosphere = createAtmosphere(opts.atmosphereRadius ?? PLANET.ATMOSPHERE_RADIUS);
    this.clouds = createClouds(opts.cloudRadius ?? PLANET.CLOUD_RADIUS, opts.cloudCount ?? 18);
    this.mist = createGroundMist(this.radius + 24);

    sceneManager.oceanGroup.add(this.ocean);
    sceneManager.landGroup.add(this.land);
    sceneManager.atmosphereGroup.add(this.atmosphere);
    sceneManager.cloudGroup.add(this.clouds);
    sceneManager.cloudGroup.add(this.mist);
    this.mist.visible = false;   // 默认关闭

    /** 供 LOD 使用：云层 / 陆地细节分组 */
    this.land.userData.field = this.heightField;
  }

  /** 太阳方向变化 → 海洋 / 大气同步（昼夜，§31） */
  setSun(dir, night = 0) {
    this.ocean.setSun(dir);
    this.atmosphere.setSun(dir);
    this.ocean.setNight(night);
    if (this.land.setSun) { this.land.setSun(dir); this.land.setNight(night); }
    if (this.clouds.setSun) { this.clouds.setSun(dir); this.clouds.setNight(night); }
    if (this.mist && this.mist.setSun) { this.mist.setSun(dir); this.mist.setNight(night); }
  }

  update(time) {
    this.ocean.update(time);
    if (this.clouds.update) this.clouds.update(time);
    if (this.mist && this.mist.update) this.mist.update(time);
  }

  /** 采样某经纬度的地面高度（世界单位，0 = 海平面） */
  groundHeight(lat, lon) {
    if (!this._tmpDir) this._tmpDir = new THREE.Vector3();
    return this.heightField.sample(latLonToVector3(lat, lon, 1, this._tmpDir));
  }

  /** 云层显示开关（UI） */
  setCloudsVisible(v) {
    this.clouds.visible = !!v;
    if (this.mist) this.mist.visible = !!v;
  }
}
