// Sketch Wave Racer — 飞鱼危险物可视化
// 程序化卡通网格：鱼身、尾鳍、背鳍、水花圈；状态由 FlyingFishSystem 驱动。

import * as THREE from "three";

const INK = 0x2e2a26;
const toon = (c) => new THREE.MeshToonMaterial({ color: c });

function outline(mesh, thickness = 0.05) {
  const o = new THREE.Mesh(mesh.geometry, new THREE.MeshBasicMaterial({ color: INK, side: THREE.BackSide }));
  o.scale.multiplyScalar(1 + thickness);
  mesh.add(o);
}

function makeFishMesh() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.75, 14, 9), toon(0x6fd3d8));
  body.scale.set(0.75, 0.42, 1.55);
  outline(body, 0.06);
  g.add(body);

  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.65, 10), toon(0xf4fbff));
  nose.rotation.x = -Math.PI / 2;
  nose.position.z = -1.18;
  outline(nose, 0.05);
  g.add(nose);

  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.55, 0.75, 3), toon(0x3a86ff));
  tail.rotation.x = Math.PI / 2;
  tail.position.z = 1.28;
  tail.scale.x = 0.7;
  outline(tail, 0.05);
  g.add(tail);

  for (const sx of [-1, 1]) {
    const fin = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.72, 3), toon(0x9be8ff));
    fin.rotation.z = sx * Math.PI / 2;
    fin.rotation.y = sx * 0.55;
    fin.position.set(sx * 0.58, 0, 0.05);
    outline(fin, 0.05);
    g.add(fin);
  }

  const eyeGeo = new THREE.SphereGeometry(0.08, 8, 6);
  for (const sx of [-1, 1]) {
    const eye = new THREE.Mesh(eyeGeo, new THREE.MeshBasicMaterial({ color: INK }));
    eye.position.set(sx * 0.28, 0.18, -1.1);
    g.add(eye);
  }

  const splashGeo = new THREE.RingGeometry(0.5, 0.75, 24);
  splashGeo.rotateX(-Math.PI / 2);
  const splash = new THREE.Mesh(splashGeo, new THREE.MeshBasicMaterial({
    color: 0xf4fbff, transparent: true, opacity: 0.55, depthWrite: false,
  }));
  splash.position.y = -0.35;
  splash.renderOrder = 3;
  g.add(splash);
  g.userData.splash = splash;
  return g;
}

export function createFlyingFishView(scene, system) {
  const group = new THREE.Group();
  scene.add(group);
  const meshes = new Map();

  return {
    group,
    reset() {
      for (const [, m] of meshes) group.remove(m);
      meshes.clear();
    },
    update(dt, t) {
      const live = new Set(system.fish);
      for (const f of system.fish) {
        let m = meshes.get(f);
        if (!m) {
          m = makeFishMesh();
          group.add(m);
          meshes.set(f, m);
        }
        m.visible = true;
        m.position.set(f.x, f.y, f.z);
        m.rotation.set(f.roll || 0, f.heading || 0, Math.sin(t * 9 + f.id) * 0.18, "YXZ");
        const pulse = 1 + Math.sin(t * 16 + f.id) * 0.04;
        m.scale.setScalar(pulse);
        const splash = m.userData.splash;
        if (splash) {
          const nearWater = Math.max(0, 1 - Math.abs(f.y) / 1.1);
          splash.visible = nearWater > 0.05;
          splash.material.opacity = 0.55 * nearWater;
          splash.scale.setScalar(1 + (1 - nearWater) * 1.8);
        }
      }
      for (const [f, m] of [...meshes]) {
        if (!live.has(f) || !f.alive) {
          group.remove(m);
          meshes.delete(f);
        }
      }
    },
  };
}
