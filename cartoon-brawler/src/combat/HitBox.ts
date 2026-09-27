/**
 * HitBox: an arc-shaped sensor activated during attack windows.
 * Uses Rapier intersection queries against the physics world (not distance
 * checks): query colliders intersecting a sphere at the swing center, then
 * validate the cone angle vs facing and target centers.
 */
import * as THREE from 'three';
import type RAPIER from '@dimforge/rapier3d-compat';
import type { PhysicsWorld } from '../physics/PhysicsWorld';
import { LAYER_BITS } from '../config/physicsConfig';
import { HITBOX_CONFIG } from '../config/combatConfig';
import { tmp } from '../core/TempObjects';

export interface HitBoxParams {
  radius: number;
  offset: number;
  angleDeg?: number;
}

export interface HitColliderRef {
  handle: number;
  center: THREE.Vector3;
}

export class HitBox {
  enabled = false;
  targetLayer: number = LAYER_BITS.ENEMY | LAYER_BITS.BREAKABLE;
  private params: HitBoxParams = { radius: 2, offset: 0.8, angleDeg: HITBOX_CONFIG.playerAttackAngleDeg };
  private debugMesh: THREE.Mesh | null = null;
  static debugShowHitBoxes = false;

  constructor(private physics: PhysicsWorld, scene: THREE.Scene) {
    const geo = new THREE.SphereGeometry(1, 8, 6);
    this.debugMesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0xff4444, wireframe: true, transparent: true, opacity: 0.5 }));
    this.debugMesh.visible = false;
    scene.add(this.debugMesh);
  }

  configure(p: Partial<HitBoxParams>): void {
    Object.assign(this.params, p);
  }

  /**
   * Sweep-test against the physics world. onResult receives each matching collider.
   */
  query(
    origin: THREE.Vector3,
    facing: THREE.Vector3,
    excludeColliderHandle: number | null,
    onResult: (collider: HitColliderRef) => void,
  ): void {
    if (!this.enabled) return;

    const center = tmp.vec3A.copy(origin);
    center.x += facing.x * this.params.offset;
    center.z += facing.z * this.params.offset;
    center.y += 0.6;

    const radius = this.params.radius;
    const angleCos = Math.cos((((this.params.angleDeg ?? 120)) / 2) * (Math.PI / 180));

    if (this.debugMesh) {
      this.debugMesh.visible = HitBox.debugShowHitBoxes && this.enabled;
      this.debugMesh.position.copy(center);
      this.debugMesh.scale.setScalar(radius);
    }
    if (!HitBox.debugShowHitBoxes && this.debugMesh) this.debugMesh.visible = false;

    const world = this.physics.world;
    const ball = new this.physics.rapier.Ball(radius);

    world.intersectionsWithShape(
      { x: center.x, y: center.y, z: center.z },
      { x: 0, y: 0, z: 0, w: 1 },
      ball,
      (collider: RAPIER.Collider) => {
        if (excludeColliderHandle !== null && collider.handle === excludeColliderHandle) return true;
        const groups = collider.collisionGroups();
        const membership = (groups >> 16) & 0xffff;
        if ((membership & this.targetLayer) === 0) return true;

        const t = collider.translation();
        tmp.vec3B.set(t.x - origin.x, 0, t.z - origin.z);
        const len = tmp.vec3B.length();
        if (len > 1e-4) {
          tmp.vec3B.multiplyScalar(1 / len);
          const dot = tmp.vec3B.x * facing.x + tmp.vec3B.z * facing.z;
          if (dot < angleCos) return true;
        }
        tmp.vec3C.set(t.x, t.y, t.z);
        onResult({ handle: collider.handle, center: tmp.vec3C });
        return true;
      },
    );
  }

  dispose(): void {
    this.debugMesh?.geometry.dispose();
  }
}
