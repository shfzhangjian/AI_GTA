// Sketch Wave Racer — 开放水域浮标布景（Phase 1）
// 供驾驶参照物 + 验证波浪采样贴合（浮标随波上下起伏）。Phase 2 赛道正式化。

import * as THREE from "three";
import { sampleWater } from "../water/Water.js";

export function createBuoyRing(scene) {
  const INK = 0x2e2a26;
  const toon = (c) => new THREE.MeshToonMaterial({ color: c });
  const buoys = [];

  const rand = mulberry(777);
  for (let i = 0; i < 26; i++) {
    const ang = rand() * Math.PI * 2;
    const dist = 30 + rand() * 130;
    const g = new THREE.Group();

    const isRed = i % 2 === 0;
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.7, 12, 10), toon(isRed ? 0xe4572e : 0x35b24c));
    body.position.y = 0.2;
    const o = new THREE.Mesh(body.geometry, new THREE.MeshBasicMaterial({ color: INK, side: THREE.BackSide }));
    o.scale.multiplyScalar(1.06);
    body.add(o);
    g.add(body);

    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.4, 6), toon(INK));
    pole.position.y = 1.1;
    g.add(pole);

    const light = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 6), new THREE.MeshBasicMaterial({ color: isRed ? 0xff8f6e : 0x8ff0a0 }));
    light.position.y = 1.9;
    g.add(light);

    g.position.set(Math.cos(ang) * dist, 0, Math.sin(ang) * dist);
    g.userData.base = g.position.clone();
    scene.add(g);
    buoys.push(g);
  }

  return {
    update(t) {
      for (const b of buoys) {
        const w = sampleWater(b.userData.base.x, b.userData.base.z, t);
        b.position.y = w.y + 0.15;
        // 随波轻微摇摆
        b.rotation.z = Math.sin(t * 1.3 + b.userData.base.x) * 0.12;
        b.rotation.x = Math.cos(t * 1.1 + b.userData.base.z) * 0.1;
      }
    },
  };
}

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
