/**
 * 海水渐变背景（阶段 2）：纵向渐变，浅海蓝 → 中层蓝 → 深海暗蓝。
 * 挂在 BackgroundLayer，跟随相机 y 移动（伪无限下潜，阶段 2 简化方案）。
 */
import * as THREE from 'three';
import type { Engine } from '../core/engine';

const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAG = /* glsl */ `
  precision mediump float;
  uniform vec3 uShallow;
  uniform vec3 uMid;
  uniform vec3 uDeep;
  uniform float uDepthMeters;
  uniform float uMaxDepth;
  varying vec2 vUv;

  void main() {
    // 屏幕纵向位置 + 深度偏移共同决定颜色；uDepthMeters 越大整体越暗
    float t = clamp(uDepthMeters / uMaxDepth, 0.0, 1.0);
    float y = vUv.y;
    vec3 c = mix(uDeep, uMid, smoothstep(0.0, 0.55, y));
    c = mix(c, uShallow, smoothstep(0.45, 1.0, y));
    // 深度压暗
    c = mix(c, uDeep * 0.55, t * 0.85);
    gl_FragColor = vec4(c, 1.0);
  }
`;

export interface WaterBackground {
  update(cameraX: number, cameraY: number, depthMeters: number): void;
}

export function createWaterBackground(engine: Engine): WaterBackground {
  const uniforms = {
    uShallow: { value: new THREE.Color(0x4fb8e8) },
    uMid: { value: new THREE.Color(0x1565a0) },
    uDeep: { value: new THREE.Color(0x041a30) },
    uDepthMeters: { value: 0 },
    uMaxDepth: { value: 260 },
  };
  const mat = new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    uniforms,
    depthWrite: false,
  });
  const geo = new THREE.PlaneGeometry(1, 1);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.z = 10; // 最远
  engine.layers.background.add(mesh);

  function fit(): void {
    const cam = engine.camera;
    const h = cam.top - cam.bottom;
    const w = cam.right - cam.left;
    mesh.scale.set(w * 1.2, h * 1.2, 1);
  }
  fit();

  return {
    update(cameraX, cameraY, depthMeters) {
      mesh.position.x = cameraX;
      mesh.position.y = cameraY; // 始终覆盖相机视野
      uniforms.uDepthMeters.value = depthMeters;
      fit();
    },
  };
}
