/**
 * EnemyCoordinator ("siege manager"): owns attack slots around the player so
 * enemies surround instead of clumping. Slot i sits at angle 2*pi*i/N around the
 * player; enemies re-claim slots by distance/angle/idle priority. Only slot
 * holders may enter Attack; others Chase or Circle.
 */
import * as THREE from 'three';
import { tmp } from '../core/TempObjects';

export interface SlotClaimant {
  id: number;
  position: THREE.Vector3;
  holdingSlot: number; // -1 = none
  busyAttacking: boolean;
}

export const COORDINATOR_CONFIG = {
  attackSlots: 2,
  approachRadius: 4.6,
  circleRadius: 3.0,
  slotMinDist: 2.2,
};

export class EnemyCoordinator {
  private claims = new Map<number, SlotClaimant>();
  slotOwners: (number | null)[] = [];
  private playerPos = new THREE.Vector3();
  private reassignTimer = 0;
  /** debug ring meshes */
  private slotMeshes: THREE.Mesh[] = [];

  constructor(scene: THREE.Scene, showSlots: () => boolean) {
    this.showSlots = showSlots;
    for (let i = 0; i < COORDINATOR_CONFIG.attackSlots + 3; i++) {
      const m = new THREE.Mesh(
        new THREE.CylinderGeometry(0.4, 0.4, 0.06, 10),
        new THREE.MeshBasicMaterial({ color: 0xff9f43, transparent: true, opacity: 0.5 }),
      );
      m.visible = false;
      scene.add(m);
      this.slotMeshes.push(m);
    }
    this.slotOwners = new Array(COORDINATOR_CONFIG.attackSlots + 3).fill(null);
  }
  private showSlots: () => boolean;

  register(id: number, pos: THREE.Vector3): SlotClaimant {
    const c: SlotClaimant = { id, position: pos.clone(), holdingSlot: -1, busyAttacking: false };
    this.claims.set(id, c);
    return c;
  }

  unregister(id: number): void {
    const c = this.claims.get(id);
    if (c && c.holdingSlot >= 0) this.slotOwners[c.holdingSlot] = null;
    this.claims.delete(id);
  }

  claimant(id: number): SlotClaimant | undefined {
    return this.claims.get(id);
  }

  /** slot world position for index i (N slots total) */
  slotPosition(i: number, out: THREE.Vector3): THREE.Vector3 {
    const n = this.slotOwners.length;
    // rotate ring by half-slot so slots never sit exactly on player facing
    const angle = (Math.PI * 2 * i) / n + Math.PI * 0.15;
    const r = COORDINATOR_CONFIG.circleRadius + (i % 2) * 1.1;
    return out.set(
      this.playerPos.x + Math.cos(angle) * r,
      0,
      this.playerPos.z + Math.sin(angle) * r,
    );
  }

  /** how many attack slots are currently held by attacking enemies */
  get openAttackSlots(): number {
    let free = 0;
    for (let i = 0; i < COORDINATOR_CONFIG.attackSlots; i++) {
      const ownerId = this.slotOwners[i];
      if (ownerId === null) free++;
      else {
        const c = this.claims.get(ownerId);
        if (c && !c.busyAttacking) free++;
      }
    }
    return free;
  }

  /** can this enemy start an attack? must own one of the primary slots */
  canAttack(id: number): boolean {
    const c = this.claims.get(id);
    if (!c || c.holdingSlot < 0 || c.holdingSlot >= COORDINATOR_CONFIG.attackSlots) return false;
    // ensure no other owner is actively attacking on the same slot set beyond cap
    let attackers = 0;
    for (let i = 0; i < COORDINATOR_CONFIG.attackSlots; i++) {
      const ownerId = this.slotOwners[i];
      if (ownerId !== null) {
        const o = this.claims.get(ownerId);
        if (o?.busyAttacking) attackers++;
      }
    }
    return attackers < COORDINATOR_CONFIG.attackSlots;
  }

  setAttacking(id: number, v: boolean): void {
    const c = this.claims.get(id);
    if (c) c.busyAttacking = v;
  }

  notifyHit(enemy: { id: number }): void {
    const c = this.claims.get(enemy.id);
    if (c) c.busyAttacking = false;
  }

  /** periodic slot reassignment weighted by distance+angle */
  update(dt: number, playerPos: THREE.Vector3): void {
    this.playerPos.copy(playerPos);
    this.reassignTimer -= dt;
    if (this.reassignTimer <= 0) {
      this.reassignTimer = 0.45;
      this.reassign();
    }
    // keep claimant positions fresh + debug viz
    
    const n = this.slotOwners.length;
    for (let i = 0; i < n; i++) {
      const mesh = this.slotMeshes[i];
      if (!mesh) continue;
      mesh.visible = this.showSlots();
      if (mesh.visible) {
        this.slotPosition(i, tmp.vec3A);
        mesh.position.set(tmp.vec3A.x, 0.06, tmp.vec3A.z);
      }
    }
  }

  private reassign(): void {
    const list = [...this.claims.values()];
    if (list.length === 0) return;
    // release slots of far / dead owners
    for (let i = 0; i < this.slotOwners.length; i++) {
      const ownerId = this.slotOwners[i];
      if (ownerId === null) continue;
      const c = this.claims.get(ownerId);
      if (!c || c.position.distanceTo(this.playerPos) > COORDINATOR_CONFIG.approachRadius * 2.4) {
        if (c) c.holdingSlot = -1;
        this.slotOwners[i] = null;
      }
    }
    // sort unassigned by distance to player (closest get priority)
    const free = list.filter((c) => c.holdingSlot === -1).sort((a, b) => a.position.distanceToSquared(this.playerPos) - b.position.distanceToSquared(this.playerPos));
    for (const c of free) {
      // choose nearest unowned slot
      let best = -1;
      let bestD = Infinity;
      for (let i = 0; i < this.slotOwners.length; i++) {
        if (this.slotOwners[i] !== null) continue;
        const d = this.slotPosition(i, tmp.vec3A).distanceToSquared(c.position);
        if (d < bestD) { bestD = d; best = i; }
      }
      if (best >= 0) {
        this.slotOwners[best] = c.id;
        c.holdingSlot = best;
      }
    }
  }

  /** separation: push enemies apart so they never stack */
  separate(enemies: SeparatableEnemy[], dt: number): void {
    const minD = COORDINATOR_CONFIG.slotMinDist;
    for (let i = 0; i < enemies.length; i++) {
      for (let j = i + 1; j < enemies.length; j++) {
        const a = enemies[i], b = enemies[j];
        tmp.vec3A.subVectors(a.entityPosition, b.entityPosition);
        tmp.vec3A.y = 0;
        const d = tmp.vec3A.length();
        if (d > 0 && d < minD) {
          const strength = Math.min(1.2, (minD - d) * 8 * dt); // velocity-ish units, capped
          tmp.vec3A.multiplyScalar((1 / d) * strength);
          this.push(a, tmp.vec3A);
          this.push(b, tmp.vec3B.set(-tmp.vec3A.x, 0, -tmp.vec3A.z));
        }
      }
    }
  }

  private push(e: SeparatableEnemy, dir: THREE.Vector3): void {
    e.separationOffset = dir.clone();
  }
}

export interface SeparatableEnemy {
  id: number;
  entityPosition: THREE.Vector3;
  separationOffset?: THREE.Vector3;
}
