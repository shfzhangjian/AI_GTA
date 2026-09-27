/**
 * MiniGlobe.js — 右下角真 3D 小地球（§24~§27）
 *
 * 不是 PNG 贴图：复用主星球的海洋 / 陆地几何（缩小到 R=1）+ 港口 Marker + 当前位置 Marker。
 * 通过同一 renderer 的 scissor/viewport 渲染（不新建 WebGL 上下文）。
 * 交互：视口内 Raycaster → 球面求交 → vector3ToLatLon → onFly(经纬度)（§26）
 *       点击港口 Marker → 飞往该港口（§27）
 */
import * as THREE from 'three';
import { MINI_GLOBE, PLANET } from '../config.js';
import { latLonToVector3, vector3ToLatLon } from '../utils/GeoUtils.js';
import { bakeLandHeights } from '../planet/Land.js';

const _v = new THREE.Vector3();

export class MiniGlobe {
  /**
   * @param {import('../planet/Planet.js').Planet} planet 主星球（复用几何）
   * @param {Array<{id,name,lat,lon,kind}>} ports
   * @param {{onFly?:(lat:number,lon:number,isPort:boolean)=>void}} opts
   */
  constructor(planet, ports, opts = {}) {
    this.planet = planet;
    this.ports = ports;
    this.onFly = opts.onFly || null;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x07111f);   // 给 mini 场景背景，球在框内可见清晰
    this.camera = new THREE.PerspectiveCamera(38, 1, 0.5, 30);   // near 不能 0.05：会毁掉深度精度 → 小地球渲染空白
    this.orbitDist = MINI_GLOBE.ORBIT_DIST;
    this.yaw = -0.6;
    this.pitch = 0.35;
    this.spin = PLANET.SPIN_SPEED * 1.4;

    // 不缩放 root（缩放 0.01 + 近远平面会毁深度精度）。几何直接按 MINI 半径(=1)构建。
    this.root = new THREE.Group();
    this.scene.add(this.root);

    this._buildContent();
    this._buildLights();

    this.raycaster = new THREE.Raycaster();
    this.hoverPort = null;

    /** 主相机经纬度同步到当前位置 Marker（§25） */
    this.currentMarker = this._makeMarker(0xffe08a, 0xffb020, 2.6);
    this.currentMarker.name = 'MiniCurrentPos';
    this.root.add(this.currentMarker);
  }

  _buildContent() {
    // 复用主星球几何 → 零额外显存
    const MR = MINI_GLOBE.RADIUS;   // = 1（小地球世界单位）
    const oceanGeo = new THREE.SphereGeometry(MR, 40, 28);
    const ocean = new THREE.Mesh(oceanGeo, this._miniOceanMat());
    ocean.name = 'MiniOcean';
    this.root.add(ocean);

    // 陆地：用主高度场在 R=1 球上烘焙（陆地高度按 MR/PLANET.RADIUS 缩放）
    const landGeo = new THREE.SphereGeometry(MR, 64, 40);
    if (this.planet.land.userData.field && bakeLandHeights) {
      bakeLandHeights(landGeo, this.planet.land.userData.field, MR, MR / PLANET.RADIUS);
    }
    const land = new THREE.Mesh(landGeo, this._miniLandMat());
    land.name = 'MiniLand';
    this.root.add(land);
    this.landMesh = land;
    this.oceanMesh = ocean;

    // 港口 Marker（§25/§27）
    this.portMarkers = [];
    for (const p of this.ports) {
      const m = this._makeMarker(0xffffff, 0xff6b4a, 3.2);
      m.name = 'MiniPort';
      m.userData.port = p;
      latLonToVector3(p.lat, p.lon, 1, _v);
      // 地面高度按小地球比例（0.01）抬一点，避免埋进陆地
      const gh = 0.02 + (p.groundH || 0) * 0.0006;
      m.position.copy(_v.clone().setLength(MINI_GLOBE.RADIUS + gh));
      this.root.add(m);
      this.portMarkers.push(m);

      // 名称标签（§25）
      const label = this._makeLabel(p.name);
      label.position.copy(m.position).setLength(MINI_GLOBE.RADIUS + gh + 0.14);
      label.name = 'MiniPortLabel';
      this.root.add(label);
      m.userData.label = label;
    }
  }

  /** 小球 Marker：Sprite 永远面向相机，不随星球旋转 → 点击无遮挡 */
  _makeMarker(color, edge, size) {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const g = c.getContext('2d');
    const cx = 32, cy = 32, r = 20;
    const grd = g.createRadialGradient(cx, cy, 1, cx, cy, r);
    grd.addColorStop(0, '#ffffff');
    grd.addColorStop(0.45, '#' + color.toString(16).padStart(6, '0'));
    grd.addColorStop(1, '#' + edge.toString(16).padStart(6, '0') + '00');
    g.fillStyle = grd;
    g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.fill();
    g.globalAlpha = 0.85;
    g.strokeStyle = '#' + edge.toString(16).padStart(6, '0');
    g.lineWidth = 2.5;
    g.beginPath(); g.arc(cx, cy, 9, 0, Math.PI * 2); g.stroke();

    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false, depthWrite: false });
    const sp = new THREE.Sprite(mat);
    sp.scale.setScalar(size * 0.06);   // MR=1 尺度
    sp.renderOrder = 10;
    return sp;
  }

  _miniOceanMat() {
    const m = new THREE.MeshLambertMaterial({ color: 0x1d7fb8, emissive: 0x0a3a5e });
    m.name = 'mini-ocean';
    return m;
  }

  _miniLandMat() {
    // 陆地 shader 需要 uniform，Mini 用简化 Lambert + 顶点色不可用 → 用纯色 Lambert
    const m = new THREE.MeshLambertMaterial({ color: 0xffffff, vertexColors: true });
    m.name = 'mini-land';
    return m;
  }

  _buildLights() {
    this.scene.add(new THREE.AmbientLight(0x9fb6d8, 1.5));
    const d = new THREE.DirectionalLight(0xffffff, 1.6);
    d.position.set(1, 0.5, 0.8);
    this.scene.add(d);
  }

  attach(rendererManager) {
    this.rm = rendererManager || this.rm;
    if (this.rm) this.rm.enableMini(this.scene, this.camera);
  }

  /** 主相机位置 → 当前区域 Marker（§25） */
  update(dt) {
    const cam = this.cameraManager?.camera;
    if (cam) {
      latLonToVector3(this.cameraManager.state.lat, this.cameraManager.state.lon, MINI_GLOBE.RADIUS, _v);
      this.currentMarker.position.copy(_v);
    }
    // 缓慢自转（与主星球同向，观感一致）
    this.yaw += dt * this.spin * 6;
    const dist = this.orbitDist;
    this.camera.position.set(
      Math.sin(this.yaw) * Math.cos(this.pitch) * dist,
      Math.sin(this.pitch) * dist,
      Math.cos(this.yaw) * Math.cos(this.pitch) * dist,
    );
    this.camera.up.set(0, 1, 0);
    this.camera.lookAt(0, 0, 0);
    this.camera.updateMatrixWorld();
    this.root.updateMatrixWorld(true);
  }

  /** 视口内坐标 → NDC（由 RendererManager 提供矩形换算） */
  _ndc(x, y) {
    const r = this.rm?.miniRect;
    if (!r) return null;
    if (x < r.x || x > r.x + r.w || y < r.y || y > r.y + r.h) return null;
    return { x: ((x - r.x) / r.w) * 2 - 1, y: -(((y - r.y) / r.h) * 2 - 1) };
  }

  /** 点击小地球 → 球面交点 → 经纬度 → 飞往（§26/§27） */
  handleClick(x, y) {
    const ndc = this._ndc(x, y);
    if (!ndc) return null;
    this.raycaster.setFromCamera(ndc, this.camera);

    // 先命中港口 Marker（§27）
    const portHits = this.raycaster.intersectObjects(this.portMarkers, false);
    if (portHits.length) {
      const p = portHits[0].object.userData.port;
      this.onFly?.(p.lat, p.lon, true);
      return { type: 'port', port: p };
    }
    // 再命中海洋 / 陆地球面
    const hits = this.raycaster.intersectObjects([this.oceanMesh], false);
    if (hits.length) {
      const world = hits[0].point.clone();
      this.root.worldToLocal(world);
      const { lat, lon } = vector3ToLatLon(world);   // root 不缩放，命中点即小地球尺度
      this.onFly?.(lat, lon, false);
      return { type: 'surface', lat, lon };
    }
    return null;
  }

  _makeLabel(text) {
    const c = document.createElement('canvas');
    c.width = 256; c.height = 64;
    const g = c.getContext('2d');
    g.font = '600 30px -apple-system, "PingFang SC", system-ui, sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.shadowColor = 'rgba(0,0,0,.85)';
    g.shadowBlur = 8;
    g.fillStyle = '#dce9ff';
    g.fillText(text, 128, 32);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false, depthWrite: false });
    const sp = new THREE.Sprite(mat);
    const k = 0.03;
    sp.scale.set(7 * k * 4, 7 * k, 1);
    sp.renderOrder = 11;
    sp.visible = false;   // 默认只显示 ●，悬停才显名，避免右下拥挤
    return sp;
  }

  /** 悬停高亮（§25 视觉反馈） */
  setHover(x, y) {
    const ndc = this._ndc(x, y);
    if (!ndc) return;
    this.raycaster.setFromCamera(ndc, this.camera);
    const hits = this.raycaster.intersectObjects(this.portMarkers, false);
    const p = hits.length ? hits[0].object : null;
    if (p !== this.hoverPort) {
      if (this.hoverPort) {
        this.hoverPort.scale.copy(this._baseScale);
        this.hoverPort.userData.label && (this.hoverPort.userData.label.visible = false);
      }
      this.hoverPort = p;
      if (p) {
        if (!this._baseScale) this._baseScale = p.scale.clone();
        p.scale.copy(this._baseScale).multiplyScalar(1.7);
        p.userData.label && (p.userData.label.visible = true);
      }
    }
    document.body.style.cursor = p ? 'pointer' : '';
  }

  clearHover() {
    if (this.hoverPort) {
      this.hoverPort.scale.copy(this._baseScale);
      this.hoverPort.userData.label && (this.hoverPort.userData.label.visible = false);
    }
    this.hoverPort = null;
    document.body.style.cursor = '';
  }

  /** 绑定主相机（当前位置 Marker 用） */
  bindCamera(cameraManager) {
    this.cameraManager = cameraManager;
  }

  setSpinSpeed(v) { this.spin = v; }
}
