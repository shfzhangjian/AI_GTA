/** BreakableObject: data-driven props (crates, barrels, fences...) with health, mass, fragments. */
import * as THREE from 'three';

export interface BreakableDef {
  kind: string;
  health: number;
  mass: number;
  breakThreshold: number;    // damage that destroys in one hit path
  impactThreshold: number;   // impulse magnitude that damages via physics collision
  fragmentCount: number;
  buildVisual: () => THREE.Group;
  buildFragments: () => { geo: THREE.BufferGeometry; color: number; size: THREE.Vector3 }[];
  halfExtents: [number, number, number];
}

const woodMat = () => new THREE.MeshStandardMaterial({ color: 0xc9974f, roughness: 0.85 });
const darkWoodMat = () => new THREE.MeshStandardMaterial({ color: 0x8a6134, roughness: 0.9 });

function crateVisual(): THREE.Group {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), woodMat());
  body.castShadow = true;
  g.add(body);
  for (const [x, ry] of [[0.51, Math.PI / 2], [-0.51, Math.PI / 2]] as const) {
    const band = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.98, 0.3), darkWoodMat());
    band.position.x = x;
    void ry;
    g.add(band);
  }
  const top = new THREE.Mesh(new THREE.BoxGeometry(1.02, 0.08, 1.02), darkWoodMat());
  top.position.y = 0.5;
  g.add(top);
  return g;
}

function barrelVisual(): THREE.Group {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.42, 1.1, 10), darkWoodMat());
  body.castShadow = true;
  g.add(body);
  for (const y of [-0.3, 0.3]) {
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.44, 0.1, 10), new THREE.MeshStandardMaterial({ color: 0x5c6672, roughness: 0.5, metalness: 0.5 }));
    ring.position.y = y;
    g.add(ring);
  }
  return g;
}

function fenceVisual(): THREE.Group {
  const g = new THREE.Group();
  const plank = new THREE.Mesh(new THREE.BoxGeometry(2, 0.9, 0.1), woodMat());
  plank.castShadow = true;
  g.add(plank);
  for (const x of [-0.8, 0.8]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.2, 0.14), darkWoodMat());
    post.position.set(x, 0.1, 0);
    g.add(post);
  }
  return g;
}

function tableVisual(): THREE.Group {
  const g = new THREE.Group();
  const top = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.12, 1), woodMat());
  top.position.y = 0.55;
  top.castShadow = true;
  g.add(top);
  for (const [x, z] of [[-0.7, -0.4], [0.7, -0.4], [-0.7, 0.4], [0.7, 0.4]] as const) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.55, 0.12), darkWoodMat());
    leg.position.set(x, 0.27, z);
    g.add(leg);
  }
  return g;
}

function chairVisual(): THREE.Group {
  const g = new THREE.Group();
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.1, 0.55), woodMat());
  seat.position.y = 0.42;
  seat.castShadow = true;
  g.add(seat);
  const back = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.6, 0.08), woodMat());
  back.position.set(0, 0.72, -0.24);
  g.add(back);
  for (const [x, z] of [[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]] as const) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.42, 0.07), darkWoodMat());
    leg.position.set(x, 0.21, z);
    g.add(leg);
  }
  return g;
}

function cartVisual(): THREE.Group {
  const g = new THREE.Group();
  const bed = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.5, 1.2), woodMat());
  bed.position.y = 0.85;
  bed.castShadow = true;
  g.add(bed);
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x6b4a26, roughness: 0.9 });
  for (const x of [-0.7, 0.7]) {
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.14, 10), wheelMat);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(x, 0.5, 0.68);
    g.add(wheel);
    const w2 = wheel.clone();
    w2.position.z = -0.68;
    g.add(w2);
  }
  return g;
}

function smallWallVisual(): THREE.Group {
  const g = new THREE.Group();
  const wall = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.5, 0.5), new THREE.MeshStandardMaterial({ color: 0x9aa3ad, roughness: 0.9 }));
  wall.position.y = 0.75;
  wall.castShadow = true;
  g.add(wall);
  const cap = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.18, 0.6), new THREE.MeshStandardMaterial({ color: 0x77808a, roughness: 0.9 }));
  cap.position.y = 1.56;
  g.add(cap);
  return g;
}

const frags = (color: number, n: number, size: [number, number, number]) =>
  Array.from({ length: n }, () => ({
    geo: new THREE.BoxGeometry(size[0], size[1], size[2]),
    color,
    size: new THREE.Vector3(size[0], size[1], size[2]),
  }));

export const BREAKABLE_DEFS: Record<string, BreakableDef> = {
  crate: { kind: 'crate', health: 18, mass: 14, breakThreshold: 20, impactThreshold: 30, fragmentCount: 6, buildVisual: crateVisual, buildFragments: () => frags(0xc9974f, 6, [0.32, 0.32, 0.32]), halfExtents: [0.52, 0.52, 0.52] },
  barrel: { kind: 'barrel', health: 14, mass: 12, breakThreshold: 18, impactThreshold: 26, fragmentCount: 5, buildVisual: barrelVisual, buildFragments: () => frags(0x8a6134, 5, [0.3, 0.34, 0.16]), halfExtents: [0.5, 0.56, 0.5] },
  fence: { kind: 'fence', health: 10, mass: 8, breakThreshold: 12, impactThreshold: 20, fragmentCount: 4, buildVisual: fenceVisual, buildFragments: () => frags(0xc9974f, 4, [0.5, 0.22, 0.1]), halfExtents: [1.0, 0.6, 0.1] },
  table: { kind: 'table', health: 22, mass: 20, breakThreshold: 24, impactThreshold: 34, fragmentCount: 7, buildVisual: tableVisual, buildFragments: () => frags(0xc9974f, 7, [0.4, 0.14, 0.3]), halfExtents: [0.8, 0.6, 0.5] },
  chair: { kind: 'chair', health: 8, mass: 6, breakThreshold: 10, impactThreshold: 14, fragmentCount: 4, buildVisual: chairVisual, buildFragments: () => frags(0xc9974f, 4, [0.24, 0.24, 0.1]), halfExtents: [0.35, 0.6, 0.35] },
  cart: { kind: 'cart', health: 30, mass: 30, breakThreshold: 34, impactThreshold: 44, fragmentCount: 8, buildVisual: cartVisual, buildFragments: () => frags(0x8a6134, 8, [0.42, 0.3, 0.3]), halfExtents: [1.1, 0.9, 0.7] },
  smallWall: { kind: 'smallWall', health: 45, mass: 60, breakThreshold: 50, impactThreshold: 60, fragmentCount: 8, buildVisual: smallWallVisual, buildFragments: () => frags(0x9aa3ad, 8, [0.4, 0.32, 0.3]), halfExtents: [1.2, 0.78, 0.28] },
};

export type BreakableKind = keyof typeof BREAKABLE_DEFS;
