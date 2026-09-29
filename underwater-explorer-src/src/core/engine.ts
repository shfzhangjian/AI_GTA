/**
 * Engine — 渲染核心（阶段 2）
 * Scene / Renderer / Camera / 游戏循环 / Resize。
 * 层级约定见 docs/PLAN.md：Background/Water/Terrain/Entity/Effect（UI 为 HTML 层）。
 */
import * as THREE from 'three';

export const LAYERS = {
  background: 0,
  water: 1,
  terrain: 2,
  entity: 3,
  effect: 4,
} as const;

export type UpdateFn = (dt: number, elapsed: number) => void;

export interface Engine {
  scene: THREE.Scene;
  camera: THREE.OrthographicCamera;
  renderer: THREE.WebGLRenderer;
  layers: Record<keyof typeof LAYERS, THREE.Group>;
  addUpdate(fn: UpdateFn): () => void;
  dispose(): void;
}

/** 世界坐标约定：1 unit = 1 像素 @ zoom=1；y 向上，水面 y=0，向下为负（深度 = -y 米换算见阶段 10）。 */
const VIEW_HEIGHT = 540; // 固定可见世界高度，宽度随窗口比例

export function createEngine(canvas: HTMLCanvasElement): Engine {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.localClippingEnabled = true;

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 2000);
  camera.position.set(0, -VIEW_HEIGHT / 2, 100);
  camera.lookAt(0, -VIEW_HEIGHT / 2, 0);

  const layerDefs = [
    ['background', LAYERS.background],
    ['water', LAYERS.water],
    ['terrain', LAYERS.terrain],
    ['entity', LAYERS.entity],
    ['effect', LAYERS.effect],
  ] as const;
  const layers = {} as Record<keyof typeof LAYERS, THREE.Group>;
  for (const [name, z] of layerDefs) {
    const g = new THREE.Group();
    g.name = `${name}Layer`;
    g.position.z = -z;
    g.renderOrder = z;
    scene.add(g);
    layers[name as keyof typeof LAYERS] = g;
  }

  function resize(): void {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h, true);
    const aspect = w / h;
    const halfH = VIEW_HEIGHT / 2;
    const halfW = halfH * aspect;
    camera.left = -halfW;
    camera.right = halfW;
    camera.top = halfH;
    camera.bottom = -halfH;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  const updates: UpdateFn[] = [];
  let raf = 0;
  let last = performance.now();
  // devdt=N：强制固定步长（headless 虚拟时间下 rAF 间隔极小，真实 dt 会被压没）
  const devdt = parseFloat(new URLSearchParams(location.search).get('devdt') || '0');
  function frame(now: number): void {
    raf = requestAnimationFrame(frame);
    const dt = devdt > 0 ? devdt : Math.min((now - last) / 1000, 0.05);
    last = now;
    // 推进量用真实 dt；elapsed 为帧率无关累计（虚拟时间下 dt 被钳制仍会推进）
    const elapsed = window.__UE_DEBUG__.elapsed + dt;
    window.__UE_DEBUG__.elapsed = elapsed;
    window.__UE_DEBUG__.tickCount++;
    for (const fn of updates) fn(dt, elapsed);
    renderer.render(scene, camera);
  }
  raf = requestAnimationFrame(frame);

  return {
    scene,
    camera,
    renderer,
    layers,
    addUpdate(fn) {
      updates.push(fn);
      return () => {
        const i = updates.indexOf(fn);
        if (i >= 0) updates.splice(i, 1);
      };
    },
    dispose() {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      renderer.dispose();
    },
  };
}
