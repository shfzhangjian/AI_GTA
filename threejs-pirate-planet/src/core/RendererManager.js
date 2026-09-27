/**
 * RendererManager.js — WebGL 渲染器与视口管理
 * 主视口 + Mini Globe 视口共用同一 renderer（scissor/viewport 双通道，见 architecture §7）
 *
 * 坐标约定：miniRect 使用 CSS 坐标（原点左上，y 向下）。
 * 需要 WebGL 坐标（原点左下）时用 _glRect() 转换，避免混用。
 */
import * as THREE from 'three';
import { MINI_GLOBE } from '../config.js';

export class RendererManager {
  /** @param {HTMLCanvasElement} canvas */
  constructor(canvas) {
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight, false);
    this.renderer.autoClear = false; // 双通道手动清屏
    this.renderer.shadowMap.enabled = false; // Phase 8 视性能再开
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    // 自定义 shader 已在片元里做 gamma，无需 ACES（否则高光会被推爆）
    this.renderer.toneMapping = THREE.NoToneMapping;
    this.renderer.toneMappingExposure = 1.0;

    /** Mini Globe 视口矩形（右下角，§24） */
    this.miniRect = { x: 0, y: 0, w: MINI_GLOBE.SIZE, h: MINI_GLOBE.SIZE };
    this.miniEnabled = false;
    this.miniScene = null;
    this.miniCamera = null;

    this._onResize = this._onResize.bind(this);
    window.addEventListener('resize', this._onResize);
    this._updateMiniRect();
  }

  _onResize() {
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight, false);
    this._updateMiniRect();
  }

  /** CSS 坐标矩形（左上角原点） */
  _updateMiniRect() {
    const s = MINI_GLOBE.SIZE;
    this.miniRect = {
      x: window.innerWidth - s - MINI_GLOBE.MARGIN,
      y: window.innerHeight - s - MINI_GLOBE.MARGIN,
      w: s,
      h: s,
    };
  }

  /** 同矩形但转为 WebGL 坐标（原点左下） */
  _glRect() {
    const { x, y, w, h } = this.miniRect;
    return { x, y: window.innerHeight - y - h, w, h };
  }

  /** CSS 坐标 → Mini 视口内 NDC；落在视口外返回 null */
  pointerToMiniNDC(clientX, clientY) {
    if (!this.miniEnabled) return null;
    const { x, y, w, h } = this.miniRect;
    if (clientX < x || clientX > x + w || clientY < y || clientY > y + h) return null;
    return {
      x: ((clientX - x) / w) * 2 - 1,
      y: -(((clientY - y) / h) * 2 - 1),
    };
  }

  /** 渲染主场景（含可选 Mini Globe 第二通道） */
  renderMain(scene, camera) {
    const W = window.innerWidth;
    const H = window.innerHeight;

    this.renderer.setScissorTest(false);
    this.renderer.setViewport(0, 0, W, H);
    this.renderer.clear();
    this.renderer.render(scene, camera);

    if (this.miniEnabled && this.miniScene && this.miniCamera) {
      const r = this._glRect();
      this.renderer.setScissorTest(true);
      this.renderer.setScissor(r.x, r.y, r.w, r.h);
      this.renderer.setViewport(r.x, r.y, r.w, r.h);
      this.renderer.clearDepth();
      this.renderer.render(this.miniScene, this.miniCamera);
      this.renderer.setScissorTest(false);
    }
  }

  /** 启用 Mini Globe 通道（同一 renderer，不额外建 WebGL 上下文） */
  enableMini(scene, camera) {
    this.miniScene = scene;
    this.miniCamera = camera;
    this.miniEnabled = true;
    this._updateMiniRect();
  }

  get canvas() {
    return this.renderer.domElement;
  }

  dispose() {
    window.removeEventListener('resize', this._onResize);
    this.renderer.dispose();
  }
}
