// Sketch Wave Racer — 粒子特效系统（Phase 6）：船尾尾迹 / 喷溅 / 转弯溅水 / 落水水花
// 设计：单一 Points 池（容量=画质分档），CPU 端欧拉积分 + 重力 + 水面上浮收敛；
// 与渲染共享 sampleWater，保证"贴水面炸开、沉入水下淡出"的卡通水花观感。
// Visual ≠ Collider：粒子无任何判定职责。

import * as THREE from "three";
import { sampleWater } from "./Water.js";
import { CONFIG } from "../config.js";

export function createSpraySystem(quality) {
  const cap = quality.particles;
  const pos = new Float32Array(cap * 3);
  const vel = new Float32Array(cap * 3);
  const life = new Float32Array(cap); // 剩余寿命（秒）
  const size = new Float32Array(cap);
  const alpha = new Float32Array(cap);
  const dark = new Uint8Array(cap); // 1 = 烟雾粒子（深色慢漂，区别于白水花）
  for (let i = 0; i < cap; i++) { life[i] = 0; }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
  geo.setAttribute("aAlpha", new THREE.BufferAttribute(alpha, 1));
  geo.setAttribute("aDark", new THREE.BufferAttribute(dark, 1));

  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      uColor: { value: new THREE.Color(CONFIG.water.foamColor) },
      uPix: { value: Math.min(window.devicePixelRatio || 1, 2) },
    },
    vertexShader: /* glsl */ `
      attribute float aSize;
      attribute float aAlpha;
      attribute float aDark;
      varying float vAlpha;
      varying float vDark;
      uniform float uPix;
      void main() {
        vAlpha = aAlpha;
        vDark = aDark;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = aSize * uPix * (140.0 / max(-mv.z, 1.0));
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      varying float vAlpha;
      varying float vDark;
      void main() {
        vec2 uv = gl_PointCoord - 0.5;
        float r = length(uv);
        if (r > 0.5 || vAlpha <= 0.0) discard;
        float edge = smoothstep(0.5, 0.32, r); // 软边圆点
        vec3 col = mix(uColor, vec3(0.16, 0.15, 0.14), vDark); // 爆缸黑烟
        gl_FragColor = vec4(col, vAlpha * edge);
      }
    `,
  });

  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  let head = 0; // 环形分配指针

  // 喷一颗：world 位置 + 速度 + 寿命/大小
  function spawn(x, y, z, vx, vy, vz, lifeSec, px, isDark = 0) {
    if (cap === 0) return;
    const i = head;
    head = (head + 1) % cap;
    pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z;
    vel[i * 3] = vx; vel[i * 3 + 1] = vy; vel[i * 3 + 2] = vz;
    life[i] = lifeSec;
    size[i] = px;
    alpha[i] = 1;
    dark[i] = isDark;
  }

  const rng = (() => { let s = 12345; return () => ((s = (s * 16807) % 2147483647) / 2147483647); })();

  return {
    points,
    // 船尾喷溅：船速比例决定数量与初速（speed m/s，heading 弧度）
    emitWake(boat, dt, t) {
      const spd = Math.abs(boat.speed);
      if (spd < 3 || boat.trapped > 0) return;
      const P = CONFIG.spray;
      const n = Math.min(P.wakePerSec, Math.round(spd * P.wakePerSec / 20));
      const fx = -Math.sin(boat.heading), fz = -Math.cos(boat.heading);
      for (let k = 0; k < n; k++) {
        if (rng() > dt * P.wakePerSec) continue;
        // 船尾两侧
        const side = rng() < 0.5 ? 1 : -1;
        const rx = Math.cos(boat.heading) * side, rz = -Math.sin(boat.heading) * side;
        const x = boat.position.x - fx * 1.6 + rx * 0.8;
        const z = boat.position.z - fz * 1.6 + rz * 0.8;
        const w = sampleWater(x, z, t);
        spawn(x, w.y + 0.15, z,
          -fx * spd * 0.25 + (rng() - 0.5) * 1.5,
          1.2 + rng() * 1.6,
          -fz * spd * 0.25 + (rng() - 0.5) * 1.5,
          0.5 + rng() * 0.5, 5 + rng() * 6);
      }
      // 转弯外侧溅水：大侧滑时喷 stronger
      if (Math.abs(boat.lateral) > 2.5 && spd > 5) {
        const sgn = Math.sign(boat.lateral);
        const rx = Math.cos(boat.heading) * sgn, rz = -Math.sin(boat.heading) * sgn;
        const x = boat.position.x + rx * 1.1;
        const z = boat.position.z + rz * 1.1;
        const w = sampleWater(x, z, t);
        spawn(x, w.y + 0.2, z,
          rx * 3.5 + (rng() - 0.5) * 2, 2.5 + rng() * 2.5, rz * 3.5 + (rng() - 0.5) * 2,
          0.5 + rng() * 0.4, 7 + rng() * 7);
      }
    },
    // 落水水花：船以垂直速度 airV 落回水面 → 环形水花
    emitSplash(boat, airV) {
      const P = CONFIG.spray;
      const n = Math.round(Math.min(P.splashMax, Math.abs(airV) * P.splashPerMs));
      for (let k = 0; k < n; k++) {
        const a = (k / Math.max(1, n)) * Math.PI * 2 + rng() * 0.6;
        const rr = 0.7 + rng() * 0.9;
        const x = boat.position.x + Math.cos(a) * rr;
        const z = boat.position.z + Math.sin(a) * rr;
        const w = sampleWater(x, z, 0);
        spawn(x, Math.max(0, w.y) + 0.25, z,
          Math.cos(a) * (2 + airV * 0.12) + (rng() - 0.5) * 1.5,
          3 + Math.abs(airV) * 0.4 + rng() * 2.5,
          Math.sin(a) * (2 + airV * 0.12) + (rng() - 0.5) * 1.5,
          0.6 + rng() * 0.5, 8 + rng() * 8);
      }
    },
    // 道具命中水花（Phase 5 联动：missile/wave 命中点）
    emitHit(x, z) {
      for (let k = 0; k < 14; k++) {
        const a = rng() * Math.PI * 2;
        spawn(x + Math.cos(a) * 0.6, 0.4, z + Math.sin(a) * 0.6,
          Math.cos(a) * 3.5, 4 + rng() * 3, Math.sin(a) * 3.5,
          0.5 + rng() * 0.4, 7 + rng() * 6);
      }
    },
    // 爆缸爆炸（起步惩罚）：黑烟蘑菇柱 + 四周烟团 + 白水花环三合一。
    // 与 emitHit 区别：这是"砰"的大爆——烟多、持久、胀大，看得见惩罚。
    emitBlast(x, z) {
      // 1) 黑烟主柱：中心向上蘑菇
      for (let k = 0; k < 26; k++) {
        const a = rng() * Math.PI * 2, rr = rng() * 0.7;
        spawn(x + Math.cos(a) * rr, 0.5 + rng() * 0.5, z + Math.sin(a) * rr,
          Math.cos(a) * (0.5 + rng()), 2.6 + rng() * 2.4, Math.sin(a) * (0.5 + rng()),
          1.4 + rng() * 1.2, 14 + rng() * 14, 1);
      }
      // 2) 黑烟横推环：向外翻卷
      for (let k = 0; k < 22; k++) {
        const a = (k / 22) * Math.PI * 2 + rng() * 0.3;
        spawn(x + Math.cos(a) * 0.8, 0.4 + rng() * 0.4, z + Math.sin(a) * 0.8,
          Math.cos(a) * (2.6 + rng() * 1.8), 1.2 + rng() * 1.6, Math.sin(a) * (2.6 + rng() * 1.8),
          1.1 + rng() * 0.9, 10 + rng() * 12, 1);
      }
      // 3) 白水花环：爆炸掀起的近身水花（爆炸的"爆"感）
      for (let k = 0; k < 18; k++) {
        const a = (k / 18) * Math.PI * 2 + rng() * 0.25;
        spawn(x + Math.cos(a) * 0.6, 0.25, z + Math.sin(a) * 0.6,
          Math.cos(a) * 4.2, 4.5 + rng() * 3, Math.sin(a) * 4.2,
          0.5 + rng() * 0.4, 7 + rng() * 7, 0);
      }
    },
    update(dt) {
      const g = CONFIG.spray.gravity;
      for (let i = 0; i < cap; i++) {
        if (life[i] <= 0) { alpha[i] = 0; continue; }
        life[i] -= dt;
        const i3 = i * 3;
        if (dark[i]) {
          // 烟雾：轻微上浮 + 横向扩散 + 逐渐胀大淡出（不走水面下浮力分支）
          vel[i3 + 1] += (0.6 - vel[i3 + 1]) * Math.min(1, 2 * dt);
          vel[i3] *= Math.exp(-0.7 * dt);
          vel[i3 + 2] *= Math.exp(-0.7 * dt);
          size[i] += 9 * dt; // 卡通烟团越飘越大
          alpha[i] = life[i] > 0 ? Math.min(0.85, life[i] * 1.1) : 0;
        } else {
          vel[i3 + 1] -= g * dt;
          // 水面以下：浮力减速 + 淡出
          if (pos[i3 + 1] < -0.05) {
            vel[i3 + 1] *= Math.exp(-3 * dt);
            vel[i3] *= Math.exp(-2.5 * dt);
            vel[i3 + 2] *= Math.exp(-2.5 * dt);
          }
          alpha[i] = life[i] > 0 ? Math.min(1, life[i] * 2.2) : 0;
        }
        pos[i3] += vel[i3] * dt;
        pos[i3 + 1] += vel[i3 + 1] * dt;
        pos[i3 + 2] += vel[i3 + 2] * dt;
        if (life[i] <= 0) alpha[i] = 0;
      }
      geo.attributes.position.needsUpdate = true;
      geo.attributes.aAlpha.needsUpdate = true;
      geo.attributes.aSize.needsUpdate = true;
      geo.attributes.aDark.needsUpdate = true;
    },
    liveCount() {
      let n = 0;
      for (let i = 0; i < cap; i++) if (life[i] > 0) n++;
      return n;
    },
  };
}
