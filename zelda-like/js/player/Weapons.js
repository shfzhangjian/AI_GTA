// 武器定义
import * as THREE from 'three';

export const WEAPONS = {
  branch: {
    id: 'branch', name: '树枝', damage: 5, range: 2.2, arc: Math.PI / 2,
    cooldown: 0.55, type: 'melee',
    build() {
      const g = new THREE.Group();
      const geo = new THREE.CylinderGeometry(0.05, 0.08, 1.1, 6);
      const mat = new THREE.MeshLambertMaterial({ color: 0x8b5a2b });
      const stick = new THREE.Mesh(geo, mat);
      stick.position.y = 0.55;
      stick.rotation.z = 0.15;
      g.add(stick);
      const twigGeo = new THREE.CylinderGeometry(0.02, 0.04, 0.5, 5);
      const twig = new THREE.Mesh(twigGeo, mat);
      twig.position.set(0.18, 0.85, 0);
      twig.rotation.z = -0.8;
      g.add(twig);
      return g;
    }
  },
  torch: {
    id: 'torch', name: '火炬', damage: 8, range: 2.4, arc: Math.PI * 2,
    cooldown: 0.55, type: 'melee', fire: true, omnidirectional: true, // 360° 全向攻击
    build() {
      const g = new THREE.Group();
      const stick = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.08, 1.1, 6),
        new THREE.MeshLambertMaterial({ color: 0x8b5a2b })
      );
      stick.position.y = 0.55;
      g.add(stick);
      const flame = new THREE.Mesh(
        new THREE.ConeGeometry(0.16, 0.4, 8),
        new THREE.MeshBasicMaterial({ color: 0xff9840 })
      );
      flame.position.y = 1.15;
      g.add(flame);
      const light = new THREE.PointLight(0xff8830, 1.4, 12);
      light.position.y = 1.2;
      g.add(light);
      g.userData.flame = flame;
      return g;
    }
  },
  knife: {
    id: 'knife', name: '刀', damage: 10, range: 2.0, arc: Math.PI / 1.6,
    cooldown: 0.4, type: 'melee',
    build() {
      const g = new THREE.Group();
      const blade = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.8, 0.22),
        new THREE.MeshLambertMaterial({ color: 0xccd6e0 })
      );
      blade.position.y = 0.55;
      g.add(blade);
      const guard = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, 0.06, 0.26),
        new THREE.MeshLambertMaterial({ color: 0x8a6a3a })
      );
      guard.position.y = 0.12;
      g.add(guard);
      return g;
    }
  },
  bow: {
    id: 'bow', name: '弓', damage: 12, range: 25, arc: 0.02,
    cooldown: 0.9, type: 'ranged',
    build() {
      const g = new THREE.Group();
      const curve = new THREE.CylinderGeometry(0.03, 0.03, 1.1, 6);
      const mat = new THREE.MeshLambertMaterial({ color: 0x7a5230 });
      const limb = new THREE.Mesh(curve, mat);
      limb.position.y = 0.55;
      g.add(limb);
      // 弦
      const line = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(0, 1.05, 0.05), new THREE.Vector3(0, 0.05, 0.05)
        ]),
        new THREE.LineBasicMaterial({ color: 0xddd8c0 })
      );
      g.add(line);
      return g;
    }
  },
  rock: {
    id: 'rock', name: '石头', damage: 7, range: 10, arc: 0.02,
    cooldown: 0.8, type: 'ranged', throwable: true,
    build() {
      const g = new THREE.Group();
      const rock = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.22, 0),
        new THREE.MeshLambertMaterial({ color: 0x8a8a88 })
      );
      rock.position.y = 0.6;
      g.add(rock);
      return g;
    }
  },
  firebow: {
    id: 'firebow', name: '火焰连弓', damage: 8, range: 24, arc: 0.02,
    cooldown: 1.0, type: 'ranged', fire: true, multishot: 3, spread: 0.16, // 三连发火箭
    build() {
      const g = new THREE.Group();
      const limb = new THREE.Mesh(
        new THREE.CylinderGeometry(0.035, 0.035, 1.15, 6),
        new THREE.MeshLambertMaterial({ color: 0x8a3a20 })
      );
      limb.position.y = 0.57;
      g.add(limb);
      const line = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(0, 1.1, 0.06), new THREE.Vector3(0, 0.05, 0.06)
        ]),
        new THREE.LineBasicMaterial({ color: 0xffcc88 })
      );
      g.add(line);
      // 弓梢火苗
      const flame = new THREE.Mesh(
        new THREE.ConeGeometry(0.09, 0.26, 7),
        new THREE.MeshBasicMaterial({ color: 0xff7830 })
      );
      flame.position.set(0, 1.15, 0);
      g.add(flame);
      const light = new THREE.PointLight(0xff7020, 0.8, 8);
      light.position.y = 1.1;
      g.add(light);
      g.userData.flame = flame;
      return g;
    }
  }
};

export function createWeaponMesh(def) {
  return def.build();
}
