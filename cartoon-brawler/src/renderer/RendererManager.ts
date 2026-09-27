/** Renderer manager: renderer, scene, fog, sky gradient, resize handling. */
import * as THREE from 'three';
import { GRAPHICS_CONFIG } from '../config/graphicsConfig';

export class RendererManager {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene: THREE.Scene;
  readonly camera: THREE.PerspectiveCamera;
  skyMesh: THREE.Mesh | null = null;

  constructor(canvasHost: HTMLElement) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, GRAPHICS_CONFIG.pixelRatioCap));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    canvasHost.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(GRAPHICS_CONFIG.fogColor, GRAPHICS_CONFIG.fogNear, GRAPHICS_CONFIG.fogFar);

    this.camera = new THREE.PerspectiveCamera(52, window.innerWidth / window.innerHeight, 0.1, 300);
    this.camera.position.set(0, 6, 12);

    this.buildSky();

    window.addEventListener('resize', () => this.onResize());
  }

  private buildSky(): void {
    // vertical gradient baked into a CanvasTexture — no custom shaders, depthWrite off,
    // rendered first (renderOrder) so scene geometry always draws over it.
    const c = document.createElement('canvas');
    c.width = 2; c.height = 128;
    const ctx = c.getContext('2d')!;
    const grad = ctx.createLinearGradient(0, 0, 0, 128);
    const top = new THREE.Color(GRAPHICS_CONFIG.skyColorTop).getStyle();
    const bot = new THREE.Color(GRAPHICS_CONFIG.skyColorBottom).getStyle();
    grad.addColorStop(0, top);
    grad.addColorStop(0.65, bot);
    grad.addColorStop(1, '#ffffff');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 2, 128);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    const geo = new THREE.SphereGeometry(240, 16, 12);
    const mat = new THREE.MeshBasicMaterial({
      map: tex, side: THREE.BackSide, depthWrite: false, fog: false, toneMapped: false,
    });
    const sky = new THREE.Mesh(geo, mat);
    sky.name = 'sky';
    sky.renderOrder = -100; // draw first, everything else wins the depth test
    this.skyMesh = sky;
    this.scene.add(sky);
  }

  private onResize(): void {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  get drawCalls(): number {
    return this.renderer.info.render.calls;
  }
}
