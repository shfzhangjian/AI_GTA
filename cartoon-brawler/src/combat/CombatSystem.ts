/** CombatSystem: central hit pipeline coordinator. */
import * as THREE from 'three';
import type { PhysicsWorld } from '../physics/PhysicsWorld';
import type { Time } from '../core/Time';
import type { EventBus } from '../core/EventBus';
import type { CameraShake } from '../camera/CameraShake';
import { HitBox } from './HitBox';
import type { CombatEntityLike, HitData } from './HitData';
import { hostile, type DamageCategory } from './DamageSystem';
import { HitReactionSystem, type ReactionTargetStats, type ReactionType } from './HitReactionSystem';
import { tmp } from '../core/TempObjects';

/** Registry mapping collider handle -> combat entity */
export interface EntityBinding {
  entity: CombatEntityLike;
  colliderHandle: number;
  stats: ReactionTargetStats;
}

export interface AttackActivation {
  source: CombatEntityLike;
  hitBox: HitBox;
  origin: THREE.Vector3;   // world
  facing: THREE.Vector3;   // normalized horizontal
  damage: number;
  knockback: number;
  verticalForce: number;
  hitStop: number;
  cameraShake: number;
  category: DamageCategory;
  breakPower: number;
  /** per-activation dedupe (each target hit once per swing) */
  hitSet: Set<number>;
}

export class CombatSystem {
  readonly reaction: HitReactionSystem;
  private bindings = new Map<number, EntityBinding>();
  /** breakable registry keyed by collider handle */
  private breakables = new Map<number, { onWeaponHit: (damage: number, impulse: THREE.Vector3, point: THREE.Vector3) => void }>();

  readonly scene: THREE.Scene;

  constructor(private physics: PhysicsWorld, time: Time, shake: CameraShake, bus: EventBus, scene: THREE.Scene) {
    this.reaction = new HitReactionSystem(time, shake, bus);
    this.scene = scene;
  }

  bindEntity(binding: EntityBinding): void {
    this.bindings.set(binding.colliderHandle, binding);
  }

  unbindEntity(handle: number): void {
    this.bindings.delete(handle);
  }

  registerBreakable(handle: number, b: { onWeaponHit: (damage: number, impulse: THREE.Vector3, point: THREE.Vector3) => void }): void {
    this.breakables.set(handle, b);
  }

  unregisterBreakable(handle: number): void {
    this.breakables.delete(handle);
  }

  /** direct smash by handle (chain reaction path) */
  smashBreakableByHandle(handle: number, force: number, point: THREE.Vector3): void {
    const brk = this.breakables.get(handle);
    if (!brk) return;
    tmp.vec3A.set(1, 0, 0.4).normalize().multiplyScalar(force * 0.5);
    brk.onWeaponHit(force * 0.8, tmp.vec3A, point);
  }

  /** sphere query over registered breakables (used for physics chain reactions) */
  smashBreakable(_handle: number, force: number, point: THREE.Vector3): void {
    // find any breakable collider overlapping the query sphere via rapier intersection
    const ball = new this.physics.rapier.Ball(0.9);
    this.physics.world.intersectionsWithShape(
      { x: point.x, y: point.y, z: point.z },
      { x: 0, y: 0, z: 0, w: 1 },
      ball,
      (c: { handle: number }) => {
        const brk = this.breakables.get(c.handle);
        if (brk) {
          tmp.vec3A.set(1, 0, 0.4).normalize().multiplyScalar(force * 0.5);
          if (tmp.vec3A.lengthSq() < 1e-6) tmp.vec3A.set(1, 0, 0);
          tmp.vec3A.normalize().multiplyScalar(force * 0.5);
          brk.onWeaponHit(force * 0.8, tmp.vec3A, point);
        }
        return true;
      },
    );
  }

  /** query breakable colliders near a point (radius) — callback per handle */
  breakableQuery(point: THREE.Vector3, radius: number, cb: (handle: number) => void): void {
    const ball = new this.physics.rapier.Ball(radius);
    this.physics.world.intersectionsWithShape(
      { x: point.x, y: point.y, z: point.z },
      { x: 0, y: 0, z: 0, w: 1 },
      ball,
      (c: { handle: number }) => {
        if (this.breakables.has(c.handle)) cb(c.handle);
        return true;
      },
    );
  }

  /** One query pass for an active attack hitbox. Called every frame while active. */
  processAttack(a: AttackActivation, hitBox: HitBox): void {
    const selfHandle = (a.source as unknown as { physicsColliderHandle?: number }).physicsColliderHandle ?? null;
    hitBox.query(a.origin, a.facing, selfHandle, (res) => {
      const handle = res.handle;
      if (a.hitSet.has(handle)) return;

      // entity?
      const binding = this.bindings.get(handle);
      if (binding && hostile(a.source.team, binding.entity.team) && binding.entity.isAlive) {
        a.hitSet.add(handle);
        tmp.vec3A.subVectors(binding.entity.position, a.origin);
        tmp.vec3A.y = 0;
        if (tmp.vec3A.lengthSq() < 1e-6) tmp.vec3A.copy(a.facing);
        tmp.vec3A.normalize();

        const hit: HitData = {
          source: a.source,
          target: binding.entity,
          damage: a.damage,
          knockback: a.knockback,
          verticalForce: a.verticalForce,
          hitStop: a.hitStop,
          cameraShake: a.cameraShake,
          direction: tmp.vec3A.clone(),
          impactPoint: tmp.vec3B.copy(binding.entity.position).setY(binding.entity.position.y + 0.9),
          category: a.category,
          breakPower: a.breakPower,
        };
        const reaction = this.reaction.resolve(hit, binding.stats);
        binding.entity.applyHit(withReaction(hit, reaction));
        return;
      }

      // breakable?
      const brk = this.breakables.get(handle);
      if (brk && a.source.team === 'player') {
        a.hitSet.add(handle);
        tmp.vec3A.subVectors(res.center, a.origin);
        tmp.vec3A.y = 0;
        if (tmp.vec3A.lengthSq() < 1e-6) tmp.vec3A.copy(a.facing);
        tmp.vec3A.normalize().multiplyScalar(a.knockback * 2.2 + a.damage * 0.4);
        brk.onWeaponHit(a.damage * a.breakPower, tmp.vec3A, res.center);
      }
    });
  }
}

/** attach reaction to hit so entity state machines can pick the right state */
function withReaction(hit: HitData, reaction: string): HitData & { reaction: string } {
  (hit as HitData & { reaction: string }).reaction = reaction;
  return hit as HitData & { reaction: string };
}

export type { ReactionType };
