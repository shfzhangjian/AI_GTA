// Sketch Wave Racer — 天空与环境（Phase 1 占位）
// 渐变天穹（上蓝下暖地平线）+ 简笔太阳 + 几只远景"海胆岛"提升空间感。

import * as THREE from "three";

export function createSky() {
  const group = new THREE.Group();

  // 渐变天穹：大 sphere 内侧着色
  const skyGeo = new THREE.SphereGeometry(480, 24, 16);
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: {
      uTop: { value: new THREE.Color(0x67b7e8) },
      uHorizon: { value: new THREE.Color(0xbfe3f2) },
      uWarm: { value: new THREE.Color(0xffe7c4) },
      uSunDir: { value: new THREE.Vector3(0.5, 0.7, 0.35).normalize() },
    },
    vertexShader: /* glsl */ `
      varying vec3 vDir;
      void main() {
        vDir = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uTop; uniform vec3 uHorizon; uniform vec3 uWarm; uniform vec3 uSunDir;
      varying vec3 vDir;
      void main() {
        float h = clamp(vDir.y, 0.0, 1.0);
        vec3 col = mix(uHorizon, uTop, pow(h, 0.7));
        // 地平线暖色带
        col = mix(col, uWarm, smoothstep(0.12, 0.0, vDir.y));
        // 太阳光晕
        float s = max(dot(normalize(vDir), uSunDir), 0.0);
        col += vec3(1.0, 0.9, 0.7) * pow(s, 200.0) * 1.2;
        col += vec3(1.0, 0.85, 0.6) * pow(s, 8.0) * 0.15;
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
  const sky = new THREE.Mesh(skyGeo, skyMat);
  sky.frustumCulled = false;
  group.add(sky);

  return group;
}

// 远景简笔小岛群：只造空间参照物（Phase 2 赛道会正式建岛）。
export function createScatterIslands(scene) {
  const INK = 0x2e2a26;
  const toon = (c) => new THREE.MeshToonMaterial({ color: c });
  const outline = (m, s = 0.04) => {
    const o = new THREE.Mesh(m.geometry, new THREE.MeshBasicMaterial({ color: INK, side: THREE.BackSide }));
    o.scale.multiplyScalar(1 + s);
    m.add(o);
  };

  const rand = mulberry(20250923);
  const group = new THREE.Group();
  for (let i = 0; i < 14; i++) {
    const ang = (i / 14) * Math.PI * 2 + rand() * 0.4;
    const dist = 220 + rand() * 130;
    const island = new THREE.Group();

    const rock = new THREE.Mesh(
      new THREE.ConeGeometry(6 + rand() * 10, 8 + rand() * 14, 7),
      toon(0x8a9b6e)
    );
    rock.position.y = 2;
    outline(rock, 0.03);
    island.add(rock);

    if (rand() > 0.4) {
      const palm = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.6, 6, 6), toon(0x9c6b3f));
      palm.position.y = 10;
      island.add(palm);
      const leaf = new THREE.Mesh(new THREE.SphereGeometry(2.4, 8, 6), toon(0x35b24c));
      leaf.scale.y = 0.5;
      leaf.position.y = 13.2;
      outline(leaf, 0.06);
      island.add(leaf);
    }

    island.position.set(Math.cos(ang) * dist, 0, Math.sin(ang) * dist);
    group.add(island);
  }
  scene.add(group);
  return group;
}

// 确定性伪随机（保证每次刷新布景一致）
function mulberry(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
