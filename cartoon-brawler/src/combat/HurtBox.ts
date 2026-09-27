/** HurtBox: logical volume belonging to a combat entity (registered for queries). */
import * as THREE from 'three';
import { HITBOX_CONFIG } from '../config/combatConfig';

export class HurtBox {
  enabled = true;
  radius: number;
  height: number;

  constructor(radius: number, height: number) {
    this.radius = radius + HITBOX_CONFIG.hurtboxPadding;
    this.height = height;
  }

  /** approximate containment test against a world point (used with hitbox query results) */
  containsPoint(p: THREE.Vector3, center: THREE.Vector3): boolean {
    const dx = p.x - center.x;
    const dz = p.z - center.z;
    const r = this.radius + 0.35; // generous cartoon forgiveness
    return dx * dx + dz * dz <= r * r;
  }
}
