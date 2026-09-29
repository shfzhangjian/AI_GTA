/**
 * 母船（阶段 7 视觉版）：原创夜间潜水小船。
 * 程序化几何组合船体/甲板/驾驶舱/灯光，避免依赖旧占位贴图。
 */
import * as THREE from 'three';
import type { Engine } from '../core/engine';

export interface Boat {
  update(elapsed: number): void;
}

function rect(w: number, h: number, color: number, opacity = 1): THREE.Mesh {
  return new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthTest: false, depthWrite: false }),
  );
}

function hullMesh(): THREE.Mesh {
  const shape = new THREE.Shape();
  shape.moveTo(-92, 8);
  shape.lineTo(78, 8);
  shape.quadraticCurveTo(62, -20, 22, -27);
  shape.lineTo(-58, -27);
  shape.quadraticCurveTo(-88, -12, -92, 8);
  return new THREE.Mesh(
    new THREE.ShapeGeometry(shape),
    new THREE.MeshBasicMaterial({ color: 0x163348, transparent: true, depthTest: false, depthWrite: false }),
  );
}

export function createBoat(engine: Engine): Boat {
  const group = new THREE.Group();
  group.name = 'motherBoat';
  group.position.set(-220, 18, 20);
  group.renderOrder = 80;
  engine.scene.add(group);

  const hull = hullMesh();
  hull.renderOrder = 80;
  group.add(hull);

  const hullStripe = rect(142, 5, 0xffd56a, 0.95);
  hullStripe.position.set(-4, -1, 0);
  hullStripe.renderOrder = 81;
  group.add(hullStripe);

  const deck = rect(128, 10, 0x274f67);
  deck.position.set(-8, 14, 0);
  deck.renderOrder = 82;
  group.add(deck);

  const cabin = rect(58, 34, 0xf0ead2);
  cabin.position.set(-12, 36, 0);
  cabin.renderOrder = 83;
  group.add(cabin);

  const roof = rect(72, 9, 0xd15b42);
  roof.position.set(-12, 57, 0);
  roof.renderOrder = 84;
  group.add(roof);

  const windowA = rect(17, 13, 0x89d7ff, 0.9);
  windowA.position.set(-29, 39, 0);
  windowA.renderOrder = 85;
  group.add(windowA);

  const windowB = rect(17, 13, 0x89d7ff, 0.9);
  windowB.position.set(-5, 39, 0);
  windowB.renderOrder = 85;
  group.add(windowB);

  const warmLight = rect(12, 7, 0xffd36b, 0.95);
  warmLight.position.set(24, 30, 0);
  warmLight.renderOrder = 85;
  group.add(warmLight);

  const mast = rect(5, 62, 0x513629);
  mast.position.set(42, 47, 0);
  mast.renderOrder = 84;
  group.add(mast);

  const antenna = rect(2, 42, 0x9fc4d5);
  antenna.position.set(52, 82, 0);
  antenna.rotation.z = -0.24;
  antenna.renderOrder = 84;
  group.add(antenna);

  const lampGlow = new THREE.Mesh(
    new THREE.CircleGeometry(18, 24),
    new THREE.MeshBasicMaterial({ color: 0xffc85b, transparent: true, opacity: 0.18, depthTest: false, depthWrite: false }),
  );
  lampGlow.position.set(28, 30, 0);
  lampGlow.renderOrder = 79;
  group.add(lampGlow);

  const waterShadow = rect(160, 5, 0x071725, 0.38);
  waterShadow.position.set(-8, -29, 0);
  waterShadow.renderOrder = 79;
  group.add(waterShadow);

  return {
    update(elapsed) {
      group.position.y = 18 + Math.sin(elapsed * 0.8) * 2.4;
      group.rotation.z = Math.sin(elapsed * 0.55) * 0.025;
      lampGlow.scale.setScalar(1 + Math.sin(elapsed * 2.4) * 0.08);
    },
  };
}
