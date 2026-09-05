/**
 * App —— 渲染器 / 场景 / 相机 / 灯光 / 主循环。
 * 只负责“引擎层”，不关心城市内容本身。
 */
import * as THREE from 'three';
import { PALETTE, WORLD } from '../config.js';

export class App {
  /** @param {HTMLElement} container 挂载画布的容器 */
  constructor(container) {
    this.clock = new THREE.Clock();

    // 场景与雾（与背景同色，远处自然淡出）
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(PALETTE.sky);
    this.scene.fog = new THREE.Fog(PALETTE.sky, WORLD.half * 2.2, WORLD.half * 5);

    // 相机（俯视/第一人称共用同一个，由模式管理器切换姿态）
    this.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 800);
    this.camera.position.set(78, 62, 78);
    this.scene.add(this.camera); // 相机入场景图，其子物体（第一人称双手）才会被渲染

    // 渲染器
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    this._setupLights();
    window.addEventListener('resize', () => this.onResize());
    this.onResize();
  }

  _setupLights() {
    // 半球光：天空偏冷、地面草地反光偏暖
    const hemi = new THREE.HemisphereLight(0xdfeaff, 0xbcd6a8, 0.85);
    this.scene.add(hemi);

    // 太阳平行光（投影）
    const sun = new THREE.DirectionalLight(0xfff3e0, 1.5);
    sun.position.set(55, 85, 35);
    sun.castShadow = true;
    const s = WORLD.half + 12;
    sun.shadow.camera.left = -s;
    sun.shadow.camera.right = s;
    sun.shadow.camera.top = s;
    sun.shadow.camera.bottom = -s;
    sun.shadow.camera.near = 10;
    sun.shadow.camera.far = 250;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.bias = -0.0004;
    this.scene.add(sun);

    // 少量补光，避免背光面死黑
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.18));
  }

  /** 启动主循环 @param {(dt:number,t:number)=>void} onUpdate */
  start(onUpdate) {
    this.renderer.setAnimationLoop(() => {
      const dt = Math.min(this.clock.getDelta(), 0.05);
      const t = this.clock.elapsedTime;
      onUpdate(dt, t);
      this.renderer.render(this.scene, this.camera);
    });
  }

  onResize() {
    const el = this.renderer.domElement;
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    el.style.width = '100%';
    el.style.height = '100%';
  }
}
