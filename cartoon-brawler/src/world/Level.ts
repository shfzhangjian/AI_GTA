/** Level: level composition — props placement + spawn metadata (World owns lifecycle). */
import * as THREE from 'three';
import type { DestructionSystem } from './DestructionSystem';
import type { BreakableKind } from './BreakableObject';

export interface PlacedProp { kind: BreakableKind; x: number; z: number; rot?: number }

/** Hand-tuned prop layout along the path (crates/barrels near fights, cover fences). */
export const PROP_LAYOUT: PlacedProp[] = [
  // road
  { kind: 'crate', x: 3.4, z: 25.5 }, { kind: 'barrel', x: 4.3, z: 24.6, rot: 0.4 },
  { kind: 'cart', x: -3.6, z: 16.8, rot: 0.5 },
  { kind: 'crate', x: -3.1, z: 12.4, rot: 0.9 }, { kind: 'chair', x: 3.9, z: 11.5 },
  // plaza cluster (main breakable hub)
  { kind: 'barrel', x: -6.2, z: 0.8 }, { kind: 'barrel', x: -5.6, z: -0.4, rot: 1.2 },
  { kind: 'crate', x: 6.4, z: 1.6 }, { kind: 'crate', x: 5.7, z: 0.5, rot: 0.7 }, { kind: 'crate', x: 6.1, z: -1.5, rot: 1.9 },
  { kind: 'table', x: -2.8, z: -4.6, rot: 0.3 }, { kind: 'chair', x: -1.9, z: -5.4 }, { kind: 'chair', x: -3.6, z: -5.8, rot: 2.1 },
  { kind: 'fence', x: 2.9, z: -5.2, rot: 1.4 }, { kind: 'fence', x: 4.3, z: -5.6, rot: 1.4 },
  { kind: 'smallWall', x: -7.8, z: -5.8, rot: 0.2 },
  // bridge approach
  { kind: 'barrel', x: -2.9, z: -7.8 }, { kind: 'crate', x: 3.1, z: -8.4, rot: 0.6 },
  // arena entrance
  { kind: 'cart', x: -4.4, z: -23.5, rot: 1.2 },
  { kind: 'crate', x: 5.2, z: -25.5 }, { kind: 'barrel', x: 6.0, z: -24.6, rot: 0.8 },
  // arena interior corners
  { kind: 'smallWall', x: -8.5, z: -31, rot: 0.9 }, { kind: 'smallWall', x: 8.5, z: -37, rot: 2.3 },
  { kind: 'barrel', x: -7.5, z: -38, rot: 0.3 }, { kind: 'crate', x: 7.6, z: -30.4 },
];

export class Level {
  constructor(private destruction: DestructionSystem) {}

  buildProps(): void {
    for (const p of PROP_LAYOUT) {
      this.destruction.spawn(p.kind, p.x, p.z, p.rot ?? 0);
    }
  }

  spawnPointAt(z: number, x = 0): THREE.Vector3 {
    return new THREE.Vector3(x, 1.2, z);
  }
}
