/** EnemyStateMachine: full spec state set. Behavior decisions come from EnemyAI (utility scores). */
import * as THREE from 'three';
import { State, StateMachine, defaultContext, type StateContext } from '../core/StateMachine';
import { Anim } from '../animation/AnimationState';
import { tmp } from '../core/TempObjects';
import type { Enemy } from './EnemyEntity';

export type EnemyCtx = Enemy;
type EState = State<EnemyCtx>;

abstract class Base implements EState {
  abstract readonly name: string;
  enter(_ctx: EnemyCtx): void { /* noop */ }
  update(_dt: number, _ctx: EnemyCtx): void { /* noop */ }
  exit(_ctx: EnemyCtx): void { /* noop */ }
}

function moveToward(ctx: EnemyCtx, target: THREE.Vector3, speed: number, dt: number): number {
  tmp.vec3A.subVectors(target, ctx.entityPosition);
  tmp.vec3A.y = 0;
  const dist = tmp.vec3A.length();
  if (dist > 0.05) {
    tmp.vec3A.multiplyScalar(1 / dist);
    ctx.faceTowards(tmp.vec3A);
    tmp.vec3A.multiplyScalar(Math.min(speed, dist * 6 + speed * 0.4));
  } else {
    tmp.vec3A.set(0, 0, 0);
  }
  ctx.physics.move(tmp.vec3A, dt);
  return dist;
}

class IdleState extends Base {
  readonly name = 'Idle';
  override enter(ctx: EnemyCtx): void { ctx.anim.crossFade(Anim.Idle, 0.2, true); }
  override update(dt: number, ctx: EnemyCtx): void {
    ctx.physics.move(tmp.vec3A.set(0, 0, 0), dt);
    void dt;
  }
}

class PatrolState extends Base {
  readonly name = 'Patrol';
  private t = 0;
  override enter(ctx: EnemyCtx): void { ctx.anim.crossFade(Anim.Walk, 0.2, true); this.t = 0; }
  override update(dt: number, ctx: EnemyCtx): void {
    this.t += dt;
    // wander around anchor
    const a = ctx.anchor;
    tmp.vec3A.set(a.x + Math.sin(ctx.elapsedAlive * 0.6 + ctx.instanceSeed) * 2.5, 0, a.z + Math.cos(ctx.elapsedAlive * 0.45 + ctx.instanceSeed) * 2.5);
    moveToward(ctx, tmp.vec3A, ctx.def.stats.moveSpeed * 0.4, dt);
  }
}

class ChaseState extends Base {
  readonly name = 'Chase';
  override enter(ctx: EnemyCtx): void { ctx.anim.crossFade(Anim.Run, 0.15, true); }
  override update(dt: number, ctx: EnemyCtx): void {
    const target = ctx.aiMoveTarget(tmp.vec3A);
    moveToward(ctx, target, ctx.def.stats.moveSpeed, dt);
  }
}

class CircleState extends Base {
  readonly name = 'Circle';
  private strafeDir = 1;
  override enter(ctx: EnemyCtx): void {
    this.strafeDir = Math.random() < 0.5 ? 1 : -1;
    ctx.anim.crossFade(Anim.Walk, 0.15, true);
  }
  override update(dt: number, ctx: EnemyCtx): void {
    const p = ctx.entityPosition;
    const player = ctx.playerPosition(tmp.vec3B);
    tmp.vec3A.subVectors(p, player).setY(0);
    const r = tmp.vec3A.length();
    if (r < 0.2) { ctx.physics.move(tmp.vec3C.set(0, 0, 0), dt); return; }
    tmp.vec3A.multiplyScalar(1 / r);
    // tangential strafe + radial spring toward preferred radius
    const pref = ctx.def.attackRange * 1.25;
    const radial = (pref - r) * 1.6;
    tmp.vec3C.set(-tmp.vec3A.z * this.strafeDir, 0, tmp.vec3A.x * this.strafeDir)
      .multiplyScalar(ctx.def.strafeSpeed)
      .addScaledVector(tmp.vec3A, radial);
    ctx.faceTowards(tmp.vec3B.subVectors(player, p));
    const spd = ctx.def.stats.moveSpeed;
    if (tmp.vec3C.length() > spd) tmp.vec3C.setLength(spd);
    ctx.physics.move(tmp.vec3C, dt);
  }
}

class AttackState extends Base {
  readonly name = 'Attack';
  private t = 0;
  private hitDone = false;
  override enter(ctx: EnemyCtx): void {
    this.t = 0;
    this.hitDone = false;
    ctx.anim.crossFade(Anim.BossWindup, 0.1, false); // windup pose clip
    ctx.audio.play('swing');
  }
  override update(dt: number, ctx: EnemyCtx): void {
    this.t += dt;
    const def = ctx.def;
    ctx.physics.move(tmp.vec3A.set(0, 0, 0), dt);
    // small lunge during windup tail
    if (this.t > def.attackWindup * 0.55 && this.t < def.attackWindup) {
      tmp.vec3A.copy(ctx.facing).multiplyScalar(2.6);
      ctx.physics.move(tmp.vec3A, dt);
    }

    if (!this.hitDone && this.t >= def.attackWindup && this.t < def.attackWindup + def.attackActive) {
      this.hitDone = true;
      ctx.tryHitPlayer();
    }
    if (this.t >= def.attackWindup + def.attackActive + def.attackRecovery) {
      ctx.onAttackFinished();
      ctx.fsm.transition('Recover', ctx);
    }
  }
}

class RecoverState extends Base {
  readonly name = 'Recover';
  private t = 0;
  override enter(ctx: EnemyCtx): void { this.t = 0; ctx.anim.crossFade(Anim.Idle, 0.15, true); }
  override update(dt: number, ctx: EnemyCtx): void {
    this.t += dt;
    ctx.physics.move(tmp.vec3A.set(0, 0, 0), dt);
    if (this.t > 0.4) ctx.fsm.transition('Chase', ctx);
  }
}

class HitState extends Base {
  readonly name = Anim.Hit;
  private t = 0;
  override enter(ctx: EnemyCtx): void {
    this.t = 0;
    ctx.anim.play(Anim.Hit, { loop: false });
    if (ctx.coordinator) ctx.coordinator.notifyHit(ctx);
  }
  override update(dt: number, ctx: EnemyCtx): void {
    this.t += dt;
    const decay = Math.exp(-7 * dt);
    tmp.vec3A.copy(ctx.knockDir).multiplyScalar(ctx.knockSpeed * decay);
    ctx.physics.move(tmp.vec3A, dt);
    if (this.t > 0.3) {
      ctx.fsm.transition(ctx.aiSuggestPostHit(), ctx);
    }
  }
}

class KnockbackState extends Base {
  readonly name = Anim.Knockback;
  private t = 0;
  override enter(ctx: EnemyCtx): void {
    this.t = 0;
    ctx.anim.play(Anim.Knockback, { loop: false });
  }
  override update(dt: number, ctx: EnemyCtx): void {
    this.t += dt;
    const decay = Math.exp(-4.5 * dt);
    tmp.vec3A.copy(ctx.knockDir).multiplyScalar(ctx.knockSpeed * decay);
    ctx.physics.move(tmp.vec3A, dt);

    // physics chain reaction: slamming into breakables at speed smashes them
    if (ctx.physics.horizontalImpulseSpeed > 4.5) {
      ctx.smashBreakablesNearby(1.15, ctx.physics.horizontalImpulseSpeed * 9);
    }

    if (ctx.physics.lastLandingImpact > 6.2 && ctx.physics.isGrounded) {
      ctx.fsm.transition(Anim.Knockdown, ctx);
      return;
    }
    if (this.t > 0.55) ctx.fsm.transition('Chase', ctx);
  }
}

class AirborneState extends Base {
  readonly name = 'Airborne';
  override enter(ctx: EnemyCtx): void { ctx.anim.play(Anim.Fall, { loop: true }); }
  override update(dt: number, ctx: EnemyCtx): void {
    tmp.vec3A.copy(ctx.knockDir).multiplyScalar(ctx.knockSpeed * 0.5);
    ctx.physics.move(tmp.vec3A, dt);
    if (ctx.physics.isGrounded) ctx.fsm.transition(Anim.Knockdown, ctx);
  }
}

class KnockdownState extends Base {
  readonly name = Anim.Knockdown;
  private t = 0;
  override enter(ctx: EnemyCtx): void {
    this.t = 0;
    ctx.anim.play(Anim.Knockdown, { loop: false });
    ctx.smashBreakablesNearby(1.3, 40);
  }
  override update(dt: number, ctx: EnemyCtx): void {
    this.t += dt;
    ctx.physics.move(tmp.vec3A.set(0, 0, 0), dt);
    if (this.t > 1.05) ctx.fsm.transition(Anim.GetUp, ctx);
  }
}

class GetUpState extends Base {
  readonly name = Anim.GetUp;
  private t = 0;
  override enter(ctx: EnemyCtx): void { this.t = 0; ctx.anim.play(Anim.GetUp, { loop: false }); }
  override update(dt: number, ctx: EnemyCtx): void {
    this.t += dt;
    ctx.physics.move(tmp.vec3A.set(0, 0, 0), dt);
    if (this.t > 0.6) ctx.fsm.transition('Chase', ctx);
  }
}

class DeathState extends Base {
  readonly name = Anim.Death;
  private t = 0;
  override enter(ctx: EnemyCtx): void {
    this.t = 0;
    ctx.combatOwner.endAttack();
    ctx.anim.play(Anim.Death, { loop: false });
    ctx.audio.play('death');
    ctx.onDeathFx();
  }
  override update(dt: number, ctx: EnemyCtx): void {
    this.t += dt;
    ctx.physics.move(tmp.vec3A.set(0, 0, 0), dt);
    if (this.t > 4) ctx.requestDespawn();
  }
}

export function buildEnemyFSM(ctx: EnemyCtx): StateMachine<EnemyCtx> {
  const idle: EState = new IdleState();
  const fsm = new StateMachine<EnemyCtx>(idle);
  fsm.add(new PatrolState());
  fsm.add(new ChaseState());
  fsm.add(new CircleState());
  fsm.add(new AttackState());
  fsm.add(new RecoverState());
  fsm.add(new HitState());
  fsm.add(new KnockbackState());
  fsm.add(new AirborneState());
  fsm.add(new KnockdownState());
  fsm.add(new GetUpState());
  fsm.add(new DeathState());
  void ctx;
  return fsm;
}

export type { StateContext, EState };
export { defaultContext };
