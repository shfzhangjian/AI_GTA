// Sketch Wave Racer — 水面系统（Phase 6 真实感版）
// 多层正弦波（uniform 数组，CONFIG.water.waves 单一来源）+ 解析法线 +
// 双层波纹法线扰动（程序化噪声梯度，无贴图）+ 菲涅耳天空/阳光双段反射 +
// 波峰白帽 + 泡沫条 + 手动雾。sampleWater 是 JS 端共享采样（船体浮动用）。

import * as THREE from "three";
import { CONFIG } from "../config.js";

// 共享水面采样函数：船体浮动、尾迹、AI 都会复用。
// 返回 { y, nx, nz }（解析法线，避免每帧 normalize 属性计算）。
export function sampleWater(x, z, t) {
  let y = 0;
  let dx = 0;
  let dz = 0;
  const waves = CONFIG.water.waves;
  for (let i = 0; i < waves.length; i++) {
    const [amp, len, speed, dir] = waves[i];
    if (len < 2 * Math.PI) continue; // 高频细节波只给 GLSL；船体浮动保持稳定
    const k = (Math.PI * 2) / len;
    const d = Math.cos(dir) * x + Math.sin(dir) * z;
    const phase = k * d - speed * t;
    const s = Math.sin(phase);
    const c = Math.cos(phase);
    y += amp * s;
    dx += amp * k * c * Math.cos(dir);
    dz += amp * k * c * Math.sin(dir);
  }
  // 法线 = normalize(-dx, 1, -dz)
  const inv = 1 / Math.sqrt(dx * dx + 1 + dz * dz);
  return { y, nx: -dx * inv, ny: inv, nz: -dz * inv };
}

// waves → uniform 数组（[振幅, 波长, 速度, 方向角] → amp / kdir=(k·cos,sin·cos)/speed）
export function buildWaveUniforms(waves) {
  const MAXW = 8;
  const amps = [], kdirs = [], speeds = [];
  for (let i = 0; i < MAXW; i++) {
    const w = waves[i];
    if (w) {
      const [amp, len, speed, dir] = w;
      const k = (Math.PI * 2) / len;
      amps.push(amp);
      kdirs.push(new THREE.Vector2(k * Math.cos(dir), k * Math.sin(dir)));
      speeds.push(speed);
    } else {
      amps.push(0);
      kdirs.push(new THREE.Vector2(0, 0));
      speeds.push(0);
    }
  }
  return { amps, kdirs, speeds, count: Math.min(waves.length, MAXW) };
}

export function createWater(quality = null) {
  const { size, segments, colorDeep, colorShallow, crestColor, foamColor } = CONFIG.water;
  const q = quality || CONFIG.quality.high;
  const seg = q ? q.waterSegments : segments;

  const geo = new THREE.PlaneGeometry(size, size, seg, seg);
  geo.rotateX(-Math.PI / 2);

  const W = buildWaveUniforms(CONFIG.water.waves);

  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uDeep: { value: new THREE.Color(colorDeep) },
      uShallow: { value: new THREE.Color(colorShallow) },
      uCrest: { value: new THREE.Color(crestColor) },
      uFoam: { value: new THREE.Color(foamColor) },
      uSky: { value: new THREE.Color(CONFIG.scene.background) },
      uSunDir: { value: new THREE.Vector3(0.5, 0.7, 0.35).normalize() },
      uFogColor: { value: new THREE.Color(CONFIG.scene.fogColor) },
      uFogNear: { value: CONFIG.scene.fogNear },
      uFogFar: { value: CONFIG.scene.fogFar },
      uAmp: { value: W.amps },
      uKdir: { value: W.kdirs },
      uSpeed: { value: W.speeds },
      uWaveCount: { value: W.count },
      uDetail: { value: q.detailNormals ? 1 : 0 },
    },
    vertexShader: /* glsl */ `
      uniform float uTime;
      uniform float uAmp[8];
      uniform vec2 uKdir[8];
      uniform float uSpeed[8];
      uniform int uWaveCount;
      varying vec3 vWorldPos;
      varying vec3 vNormal;
      varying float vCrest;

      // CONFIG.water.waves 经 uniform 数组注入（单一来源，无手工同步）。
      float waveHeight(vec2 p, out vec3 grad) {
        float h = 0.0; grad = vec3(0.0);
        for (int i = 0; i < 8; i++) {
          if (i >= uWaveCount) break;
          float k = length(uKdir[i]);
          if (k <= 0.0) continue;
          vec2 d = uKdir[i] / k;
          float ph = k * dot(p, d) - uSpeed[i] * uTime;
          float s = sin(ph); float c = cos(ph);
          h += uAmp[i] * s;
          grad += vec3(uAmp[i] * k * c * d.x, 0.0, uAmp[i] * k * c * d.y);
        }
        return h;
      }

      void main() {
        vec3 pos = position;
        vec3 grad;
        pos.y = waveHeight(pos.xz, grad);
        vNormal = normalize(vec3(-grad.x, 1.0, -grad.z));
        vCrest = clamp(pos.y / 0.9, 0.0, 1.0);
        vec4 wp = modelMatrix * vec4(pos, 1.0);
        vWorldPos = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uDeep;
      uniform vec3 uShallow;
      uniform vec3 uCrest;
      uniform vec3 uFoam;
      uniform vec3 uSky;
      uniform vec3 uSunDir;
      uniform vec3 uFogColor;
      uniform float uFogNear;
      uniform float uFogFar;
      uniform float uTime;
      uniform float uDetail;
      varying vec3 vWorldPos;
      varying vec3 vNormal;
      varying float vCrest;

      // ---- 程序化波纹噪声（双层：细碎近波 + 中频涌动）----
      // 梯度扰动基波法线 = "法线波纹"（无贴图，纯解析，成本极小）。
      float nhash(vec2 p) {
        p = fract(p * vec2(234.34, 435.345));
        p += dot(p, p + 34.23);
        return fract(p.x * p.y);
      }
      float vnoise(vec2 p) {
        vec2 i = floor(p), f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        float a = nhash(i), b = nhash(i + vec2(1, 0));
        float c = nhash(i + vec2(0, 1)), d = nhash(i + vec2(1, 1));
        return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
      }
      // 噪声梯度（中心差分）→ 法线扰动量
      vec3 rippleNormal(vec2 p, float scale, float t, float amp) {
        float e = 0.35 / scale;
        float n0 = vnoise(p * scale + vec2(t * 0.7, t * 0.35));
        float nx = vnoise((p + vec2(e, 0.0)) * scale + vec2(t * 0.7, t * 0.35));
        float nz = vnoise((p + vec2(0.0, e)) * scale + vec2(t * 0.7, t * 0.35));
        return vec3(-(nx - n0) / e, 0.0, -(nz - n0) / e) * amp;
      }

      void main() {
        vec3 N = normalize(vNormal);
        vec3 V = normalize(cameraPosition - vWorldPos);

        // ---- 细节波纹法线（Phase 6 核心：近景碎波闪动）----
        vec2 wp = vWorldPos.xz;
        if (uDetail > 0.5) {
          vec3 r1 = rippleNormal(wp, 0.45, uTime * 0.9, 0.30); // 中频涌动
          vec3 r2 = rippleNormal(wp * 1.7 + 13.7, 1.4, uTime * 1.6, 0.18); // 近景碎波
          N = normalize(N + vec3(r1.x + r2.x, 0.0, r1.z + r2.z));
        }

        // 深浅双色随坡度混合（浅滩感）
        float slope = 1.0 - N.y;
        vec3 base = mix(uDeep, uShallow, clamp(slope * 3.5, 0.0, 1.0));

        // ---- 菲涅耳 + 环境反射感（天穹色/日光带两段环境）----
        float fres = pow(1.0 - max(dot(N, V), 0.0), 3.0);
        vec3 R = reflect(-V, N);
        vec3 envUp = uSky;                                   // 朝上 = 天光
        vec3 envSun = uSky * 0.55 + uCrest * 0.45;           // 朝 = 太阳带
        float sunBand = pow(max(dot(R, uSunDir), 0.0), 6.0); // 太阳方位偏色
        vec3 env = mix(envUp, envSun, sunBand);
        base = mix(base, env, fres * 0.6);

        // 半郎伯 + 太阳高光条带（波纹法线让高光随碎波闪动）
        float lam = dot(N, uSunDir) * 0.5 + 0.5;
        base *= 0.75 + 0.35 * lam;
        vec3 H = normalize(uSunDir + V);
        float spec = pow(max(dot(N, H), 0.0), 120.0);
        base += vec3(1.0, 0.98, 0.9) * spec * 1.1;

        // 波峰白帽 + 泡沫条（坡度大的地方挂泡沫，随时间蠕动）
        base = mix(base, uCrest, vCrest * vCrest * 0.35);
        if (uDetail > 0.5) {
          float foamBand = smoothstep(0.30, 0.62, slope * 2.2 + 0.22 * vnoise(wp * 0.7 + uTime * 0.4));
          base = mix(base, uFoam, clamp(foamBand, 0.0, 1.0) * 0.35);
        }

        // 手动雾
        float dist = length(cameraPosition - vWorldPos);
        float fogF = smoothstep(uFogNear, uFogFar, dist);
        vec3 col = mix(base, uFogColor, fogF);

        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.y = 0;
  mesh.frustumCulled = false;

  return {
    mesh,
    update(t) {
      mat.uniforms.uTime.value = t;
    },
  };
}
