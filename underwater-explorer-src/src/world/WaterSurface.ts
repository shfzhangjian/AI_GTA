/**
 * 水面效果（阶段 2）：y=0 处的水面亮带 + 太阳光束（WaterLayer）。
 * 光束为半透明倾斜四边形，缓慢摆动；数量克制。
 */
import * as THREE from 'three';
import type { Engine } from '../core/engine';

export interface WaterSurface {
  update(dt: number, elapsed: number, camX: number, camY: number, halfW: number): void;
}

const RAYS = 5;
const STAR_COUNT = 90;
const DAY_NIGHT_PERIOD = 60;

export function createWaterSurface(engine: Engine): WaterSurface {
  const group = engine.layers.water;

  const skyMat = new THREE.MeshBasicMaterial({ color: 0x061525, transparent: true, opacity: 0.96, depthWrite: false });
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(1, 520), skyMat);
  sky.position.y = 260;
  sky.renderOrder = 1;
  group.add(sky);

  const moonMat = new THREE.MeshBasicMaterial({ color: 0xdff6ff, transparent: true, opacity: 0.88, depthWrite: false });
  const moon = new THREE.Mesh(new THREE.CircleGeometry(18, 32), moonMat);
  moon.position.set(230, 250, 0);
  moon.renderOrder = 2;
  group.add(moon);

  const sunMat = new THREE.MeshBasicMaterial({ color: 0xffd76a, transparent: true, opacity: 0.96, depthWrite: false });
  const sun = new THREE.Mesh(new THREE.CircleGeometry(22, 32), sunMat);
  sun.renderOrder = 2;
  group.add(sun);

  const sunGlow = new THREE.Mesh(
    new THREE.CircleGeometry(50, 32),
    new THREE.MeshBasicMaterial({ color: 0xffeaa0, transparent: true, opacity: 0.18, depthWrite: false }),
  );
  sunGlow.renderOrder = 1;
  group.add(sunGlow);

  const starPos = new Float32Array(STAR_COUNT * 3);
  for (let i = 0; i < STAR_COUNT; i++) {
    starPos[i * 3] = (Math.random() - 0.5) * 1800;
    starPos[i * 3 + 1] = 40 + Math.random() * 360;
    starPos[i * 3 + 2] = 0;
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  const stars = new THREE.Points(
    starGeo,
    new THREE.PointsMaterial({
      size: 2.1,
      sizeAttenuation: false,
      color: 0xd9f5ff,
      transparent: true,
      opacity: 0.88,
      depthWrite: false,
    }),
  );
  stars.renderOrder = 3;
  group.add(stars);

  // 水面亮带
  const surfGeo = new THREE.PlaneGeometry(1, 6);
  const surfMat = new THREE.MeshBasicMaterial({ color: 0xaee6ff, transparent: true, opacity: 0.75 });
  const surf = new THREE.Mesh(surfGeo, surfMat);
  surf.position.y = 0;
  group.add(surf);

  // 光束
  const rayMat = new THREE.MeshBasicMaterial({
    color: 0x9fd8ff,
    transparent: true,
    opacity: 0.07,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const rays: { mesh: THREE.Mesh; phase: number; baseX: number; tilt: number }[] = [];
  for (let i = 0; i < RAYS; i++) {
    const g = new THREE.PlaneGeometry(60 + i * 18, 1400);
    const m = new THREE.Mesh(g, rayMat);
    const baseX = (i - (RAYS - 1) / 2) * 220;
    m.userData.ray = i;
    m.position.set(baseX, -700, 0);
    m.rotation.z = 0.18 + i * 0.02;
    group.add(m);
    rays.push({ mesh: m, phase: i * 1.7, baseX, tilt: 0.18 + i * 0.02 });
  }

  return {
    update(_dt, elapsed, camX, camY, halfW) {
      const skyVisible = camY > -520;
      const phase = (elapsed % DAY_NIGHT_PERIOD) / DAY_NIGHT_PERIOD;
      const sunArc = Math.sin(phase * Math.PI * 2);
      const moonArc = Math.sin((phase + 0.5) * Math.PI * 2);
      const dayAmount = THREE.MathUtils.smoothstep(sunArc, -0.16, 0.38);
      const nightAmount = 1 - dayAmount;
      skyMat.color.set(new THREE.Color(0x061525).lerp(new THREE.Color(0x6dc8ff), dayAmount));
      skyMat.opacity = 0.96;

      sky.visible = skyVisible;
      stars.visible = skyVisible && nightAmount > 0.08;
      (stars.material as THREE.PointsMaterial).opacity = 0.88 * nightAmount;
      moon.visible = skyVisible && nightAmount > 0.02;
      sun.visible = skyVisible && dayAmount > 0.02;
      sunGlow.visible = sun.visible;
      sky.scale.x = halfW * 2.8;
      sky.position.x = camX;
      stars.position.x = camX;
      const arcW = Math.min(halfW * 0.95, 420);
      sun.position.x = camX - arcW + phase * arcW * 2;
      sun.position.y = 42 + Math.max(0, sunArc) * 270;
      sunMat.opacity = 0.96 * dayAmount;
      sunGlow.position.copy(sun.position);
      (sunGlow.material as THREE.MeshBasicMaterial).opacity = 0.2 * dayAmount;

      moon.position.x = camX - arcW + ((phase + 0.5) % 1) * arcW * 2;
      moon.position.y = 42 + Math.max(0, moonArc) * 245;
      moonMat.opacity = 0.88 * nightAmount;

      surf.scale.x = halfW * 2.2;
      surf.position.x = camX;
      surfMat.color.set(new THREE.Color(0x86d6ff).lerp(new THREE.Color(0xfff2c2), dayAmount * 0.45));
      surfMat.opacity = 0.58 + dayAmount * 0.24;
      for (const r of rays) {
        // 光束只在浅水区可见（camY > -150m*10 才有意义；深度换算是近似，阶段 10 精化）
        const depth = -camY;
        const vis = Math.max(0, 1 - depth / 1300);
        r.mesh.material = rayMat;
        rayMat.opacity = (0.025 + 0.08 * dayAmount) * vis;
        r.mesh.rotation.z = r.tilt + Math.sin(elapsed * 0.15 + r.phase) * 0.03;
        r.mesh.visible = vis > 0.02;
        // 光束跟随相机横向，避免横游时露出空背景
        r.mesh.position.x = camX + r.baseX;
      }
    },
  };
}
