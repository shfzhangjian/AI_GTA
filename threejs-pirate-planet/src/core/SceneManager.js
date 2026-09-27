/**
 * SceneManager.js — 场景图组织与光照（§9 场景总览）
 */
import * as THREE from 'three';
import { PLANET } from '../config.js';

export class SceneManager {
  constructor() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x05060e);

    /** 星球本体组（可整体自转） */
    this.planet = new THREE.Group();
    this.planet.name = 'Planet';
    this.scene.add(this.planet);

    /** 海洋 */
    this.oceanGroup = new THREE.Group();
    this.oceanGroup.name = 'Ocean';
    this.planet.add(this.oceanGroup);

    /** 陆地 + 岛屿 */
    this.landGroup = new THREE.Group();
    this.landGroup.name = 'Land';
    this.planet.add(this.landGroup);

    /** 云层（独立慢速旋转 → 不随星球自转） */
    this.cloudGroup = new THREE.Group();
    this.cloudGroup.name = 'Clouds';
    this.planet.add(this.cloudGroup);

    /** 大气层 */
    this.atmosphereGroup = new THREE.Group();
    this.atmosphereGroup.name = 'Atmosphere';
    this.planet.add(this.atmosphereGroup);

    /** 世界内容：建筑 / 港口 / 船只 / 航线 —— 挂在星球下随星球自转 */
    this.world = new THREE.Group();
    this.world.name = 'World';
    this.planet.add(this.world);

    this.buildings = new THREE.Group();
    this.buildings.name = 'Buildings';
    this.world.add(this.buildings);

    this.ports = new THREE.Group();
    this.ports.name = 'Ports';
    this.world.add(this.ports);

    this.props = new THREE.Group();
    this.props.name = 'Props';
    this.world.add(this.props);

    this.ships = new THREE.Group();
    this.ships.name = 'Ships';
    this.world.add(this.ships);

    /** 陆地小人独立层（显隐 / LOD / 调试，CharacterManager 默认挂这里） */
    this.characters = new THREE.Group();
    this.characters.name = 'Characters';
    this.world.add(this.characters);

    /** 陆地小动物独立层（PetManager 挂这里） */
    this.animals = new THREE.Group();
    this.animals.name = 'Animals';
    this.world.add(this.animals);

    this.routes = new THREE.Group();
    this.routes.name = 'Routes';
    this.world.add(this.routes);

    /** 星空挂在 scene 下（不随星球转） */
    this.sky = new THREE.Group();
    this.sky.name = 'Sky';
    this.scene.add(this.sky);

    this._buildLights();
  }

  _buildLights() {
    // 环境光：保证暗面不死黑
    this.ambient = new THREE.AmbientLight(0x8fa7c8, 0.42);
    this.scene.add(this.ambient);

    // 半球光：天空蓝 → 海面反射
    this.hemi = new THREE.HemisphereLight(0xbfe3ff, 0x2a5f7a, 0.35);
    this.scene.add(this.hemi);

    // 太阳（平行光）：方向可控 → 昼夜（§31）
    this.sun = new THREE.DirectionalLight(0xfff2d8, 2.1);
    this.sun.position.set(1, 0.35, 0.6).normalize().multiplyScalar(PLANET.RADIUS * 6);
    this.scene.add(this.sun);
    this.sunTarget = new THREE.Object3D();
    this.scene.add(this.sunTarget);
    this.sun.target = this.sunTarget;

    /** 夜晚港口暖黄光（§31），Phase 3 填充 */
    this.nightLights = [];
  }

  /**
   * 设置太阳方位 → 昼夜。angle 为绕 Y 的太阳方位角（弧度）
   * elevation ∈ [-1, 1]，负值 = 夜晚
   */
  setSunAngle(angle, elevation = 0.35) {
    const r = PLANET.RADIUS * 6;
    const e = THREE.MathUtils.clamp(elevation, -1, 1);
    const y = Math.sin(e * Math.PI * 0.5);
    const horiz = Math.cos(e * Math.PI * 0.5);
    this.sun.position.set(Math.cos(angle) * horiz * r, y * r, Math.sin(angle) * horiz * r);

    // 昼夜插值：白天暖白强光 → 黄昏橙 → 夜晚冷暗弱光
    const day = THREE.MathUtils.smoothstep(y, -0.12, 0.3);
    const dusk = 1 - Math.abs(THREE.MathUtils.clamp(y, -1, 1)) * 2;
    const dayColor = new THREE.Color(0xfff2d8);
    const duskColor = new THREE.Color(0xff9a52);
    const nightColor = new THREE.Color(0x3a4a7a);
    const c = dayColor.clone().lerp(duskColor, THREE.MathUtils.clamp(1 - day, 0, 1) * THREE.MathUtils.clamp(dusk, 0, 1));
    if (day < 0.5) c.lerp(nightColor, 1 - day * 2);
    this.sun.color.copy(c);
    this.sun.intensity = 0.18 + day * 2.0;
    this.ambient.intensity = 0.16 + day * 0.34;
    this.hemi.intensity = 0.10 + day * 0.32;

    /** 0=深夜 1=正午，供 UI / 港口灯使用 */
    this.dayFactor = day;
    return day;
  }

  /** 星球自转（§3） */
  update(dt) {
    this.planet.rotation.y += dt * PLANET.SPIN_SPEED;
    this.cloudGroup.rotation.y += dt * PLANET.SPIN_SPEED * 0.35;
  }

  /** 交互射线收集目标 */
  pickTargets() {
    return [...this.ships.children, ...this.characters.children, ...this.animals.children, ...this.buildings.children, ...this.ports.children];
  }
}
