/**
 * CharacterPhysicsController: kinematic-character-based capsule controller used
 * by player and enemies. Handles gravity, ground snap, slopes, knockback impulses,
 * launch/airborne state, and wall blocking (no mesh clipping).
 */
import type RAPIER from '@dimforge/rapier3d-compat';
import * as THREE from 'three';
import type { PhysicsWorld } from './PhysicsWorld';
import { tmp } from '../core/TempObjects';

export interface CharacterPhysicsOptions {
  radius: number;
  halfHeight: number; // capsule cylinder half-height
  groups: number;
  initialPos: THREE.Vector3;
  mass?: number;
}

const moveScratchPos = new THREE.Vector3();
const moveScratchHoriz = new THREE.Vector3();
const moveScratchDesired = new THREE.Vector3();
const GRAVITY = -26;
const MAX_FALL_SPEED = 42;

export class CharacterPhysicsController {

  body!: RAPIER.KinematicCharacterController;
  rigidBody!: RAPIER.RigidBody;
  collider!: RAPIER.Collider;

  readonly radius: number;
  private readonly halfHeight: number;
  private grounded = false;
  private velY = 0;
  /** Horizontal free velocity (knockback / launch), decays over time. */
  private impulseVel = new THREE.Vector3();
  private verticalImpulse = 0;
  airborne = false;
  private fallSpeedOnAir = 0;
  private physics: PhysicsWorld;
  private rapier: typeof RAPIER;
  private enabled = true;

  /** last landing impact speed (positive), consumed by state machines */
  lastLandingImpact = 0;

  constructor(physics: PhysicsWorld, opts: CharacterPhysicsOptions) {
    this.physics = physics;
    this.rapier = physics.rapier;
    this.radius = opts.radius;
    this.halfHeight = opts.halfHeight;

    const bodyDesc = this.rapier.RigidBodyDesc.kinematicPositionBased()
      .setTranslation(opts.initialPos.x, opts.initialPos.y, opts.initialPos.z);
    this.rigidBody = physics.world.createRigidBody(bodyDesc);

    const colDesc = this.rapier.ColliderDesc.capsule(opts.halfHeight, opts.radius)
      .setCollisionGroups(opts.groups)
      .setSolverGroups(opts.groups)
      .setFriction(0.0);
    this.collider = physics.world.createCollider(colDesc, this.rigidBody);

    this.body = physics.world.createCharacterController(0.14); // small offset (NOT the capsule radius — see Rapier docs)
    this.body.setUp({ x: 0, y: 1, z: 0 });
    this.body.setMaxSlopeClimbAngle((52 * Math.PI) / 180);
    this.body.setMinSlopeSlideAngle((38 * Math.PI) / 180);
    this.body.setApplyImpulsesToDynamicBodies(true);
    this.body.setCharacterMass(opts.mass ?? 75);
  }

  /** WARNING: returns a shared temp (vec3E) — copy immediately if retained. */
  get position(): THREE.Vector3 {
    const t = this.rigidBody.translation();
    return tmp.vec3E.set(t.x, t.y, t.z);
  }

  getPositionInto(out: THREE.Vector3): THREE.Vector3 {
    const t = this.rigidBody.translation();
    return out.set(t.x, t.y, t.z);
  }

  get isGrounded(): boolean {
    return this.grounded;
  }

  get centerOffset(): number {
    // capsule center to feet distance
    return this.halfHeight + this.radius;
  }

  teleport(pos: THREE.Vector3): void {
    this.rigidBody.setTranslation({ x: pos.x, y: pos.y + this.centerOffset, z: pos.z }, true);
    this.impulseVel.set(0, 0, 0);
    this.verticalImpulse = 0;
    this.velY = 0;
    this.airborne = false;
  }

  setEnabled(v: boolean): void {
    this.enabled = v;
    this.collider.setEnabled(v);
  }

  /** Horizontal move request (already dt-scaled velocity in m/s). */
  move(horizontalVelocity: THREE.Vector3, dt: number): void {
    if (!this.enabled) return;
    const pos = this.rigidBody.translation();
    moveScratchPos.set(pos.x, pos.y, pos.z);

    // decay knockback impulse
    const decay = Math.exp(-6.0 * dt);
    this.impulseVel.multiplyScalar(this.grounded ? decay : Math.exp(-1.2 * dt));
    if (this.impulseVel.lengthSq() < 0.0025) this.impulseVel.set(0, 0, 0);

    moveScratchHoriz.copy(horizontalVelocity).add(this.impulseVel);
    const horiz = moveScratchHoriz;

    // vertical
    if (this.verticalImpulse > 0) {
      this.velY = this.verticalImpulse;
      this.verticalImpulse = 0;
      this.airborne = true;
    }
    if (!this.grounded || this.velY > 0) {
      this.velY += GRAVITY * dt;
      this.velY = Math.max(this.velY, -MAX_FALL_SPEED);
    } else {
      // keep pressed to ground
      this.velY = Math.min(this.velY, -2.0);
    }

    // safety clamp: characters can never be commanded faster than 40 m/s
    if (horiz.lengthSq() > 1600) horiz.setLength(40);

    const desired = moveScratchDesired.set(horiz.x * dt, this.velY * dt, horiz.z * dt);

    this.body.computeColliderMovement(this.collider, desired);
    const corrected = this.body.computedMovement();


    // Landing detection: if we were airborne and now grounded with downward speed.
    const wasAirborne = this.airborne;
    // Ground detection: we pressed downward velocity each step; if the controller
    // consumed most of it, we're standing on something. (computedGrounded() is
    // unreliable when autostep/snap flags are combined via the JS bindings.)
    const dy = desired.y;
    const consumed = Math.abs(corrected.y) <= Math.abs(dy) + 1e-6;
    const groundedNow = dy < 0 && (consumed || Math.abs(corrected.y - dy) < 1e-4);

    if (wasAirborne && groundedNow && this.fallSpeedOnAir > 1.5) {
      this.lastLandingImpact = this.fallSpeedOnAir;
    } else if (!groundedNow) {
      this.lastLandingImpact = 0;
    }
    if (groundedNow && this.velY <= 0) {
      this.airborne = false;
      this.velY = -2.0;
      this.fallSpeedOnAir = 0;
    } else if (!groundedNow) {
      this.airborne = true;
      this.fallSpeedOnAir = Math.max(this.fallSpeedOnAir, -this.velY);
    }
    this.grounded = groundedNow;




    // reject absurd per-step movement (physics blowup guard)
    const maxStep = 1.5; // meters per fixed step ~ 90 m/s
    if (!Number.isFinite(corrected.x) || !Number.isFinite(corrected.y) || !Number.isFinite(corrected.z)
      || Math.abs(corrected.x) > maxStep || Math.abs(corrected.y) > maxStep * 2 || Math.abs(corrected.z) > maxStep) {
      this.impulseVel.set(0, 0, 0);
      this.velY = -3;
      return; // skip this step entirely; next frame settles
    }

    let nx = pos.x + corrected.x;
    let ny = pos.y + corrected.y;
    let nz = pos.z + corrected.z;

    // NaN guard (physics must never fling characters out of the world)
    if (!Number.isFinite(nx) || !Number.isFinite(ny) || !Number.isFinite(nz)) {
      this.impulseVel.set(0, 0, 0);
      this.velY = -2;
      nx = pos.x; ny = pos.y; nz = pos.z;
    }
    // world bounds
    nx = Math.max(-105, Math.min(105, nx));
    nz = Math.max(-105, Math.min(105, nz));
    ny = Math.max(-2, Math.min(60, ny));

    // kinematicPositionBased bodies move via setTranslation (setNextKinematic*
    // targets only apply to KinematicVelocityBased bodies and can desync badly)
    this.rigidBody.setTranslation({ x: nx, y: ny, z: nz }, false);
  }

  /** Instant horizontal impulse (knockback). */
  addKnockback(dirX: number, dirZ: number, force: number): void {
    tmp.vec3A.set(dirX, 0, dirZ);
    if (tmp.vec3A.lengthSq() < 1e-6) return;
    tmp.vec3A.normalize().multiplyScalar(force);
    this.impulseVel.add(tmp.vec3A);
  }

  /** Vertical launch impulse. */
  launch(upForce: number): void {
    this.verticalImpulse = Math.max(this.verticalImpulse, upForce);
  }

  jump(upForce: number): boolean {
    if (!this.grounded) return false;
    this.verticalImpulse = upForce;
    return true;
  }

  get horizontalImpulseSpeed(): number {
    return this.impulseVel.length();
  }

  dispose(): void {
    this.physics.world.removeCharacterController(this.body);
    this.physics.world.removeRigidBody(this.rigidBody);
  }
}
