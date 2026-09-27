/**
 * PlayerStateMachine: states per spec. States are classes with enter/update/exit;
 * all behavior knobs come from config. The Player class is the context object.
 */
import * as THREE from 'three';
import { State, StateContext, StateMachine } from '../core/StateMachine';
import { PLAYER_CONFIG } from '../config/gameConfig';
import type { AttackData } from '../config/combatConfig';
import { Anim } from '../animation/AnimationState';
import { tmp } from '../core/TempObjects';
import type { Player } from './Player';

export type PlayerCtx = Player;
export type PState = State<PlayerCtx>;

abstract class BaseState implements PState {
  abstract readonly name: string;
  enter(_ctx: PlayerCtx): void { /* default no-op */ }
  update(_dt: number, _ctx: PlayerCtx): void { /* default no-op */ }
  exit(_ctx: PlayerCtx): void { /* default no-op */ }
}

/** Idle / Move / Run share locomotion; distinguished by speed & anim. */
class LocomotionState extends BaseState {
  readonly name: string;
  private anim: string;
  constructor(name: string, anim: string) { super(); this.name = name; this.anim = anim; }

  override enter(ctx: PlayerCtx): void {
    ctx.setFlags({ canMove: true, canRotate: true, canAttack: true, canDodge: true, canReceiveHit: true, invincible: false });
    if (ctx.anim.currentAnim !== this.anim) ctx.anim.crossFade(this.anim, 0.14, true);
  }

  override update(dt: number, ctx: PlayerCtx): void {
    // consume buffered attack first (input buffer!)
    const buf = ctx.controller.consumeBuffer();
    if (buf && ctx.comboIndex >= 0) {
      ctx.startAttack(buf.kind);
      return;
    }
    if (ctx.controller.dodgePressed) { ctx.tryDodge(); return; }
    if (ctx.controller.jumpPressed) { ctx.tryJump(); return; }

    const speed = ctx.moveSpeedNow();
    ctx.applyMove(speed, dt);

    // transition among idle/walk/run by intent
    const m = ctx.controller.moveAmount;
    if (m < 0.05) ctx.fsm.transition(Anim.Idle, ctx);
    else if (ctx.controller.sprint && this.name !== 'Run') ctx.fsm.transition('Run', ctx);
    else if (!ctx.controller.sprint && this.name === 'Run') ctx.fsm.transition('Move', ctx);
  }
}

class ExitChain extends Error {}

/** Attack states share logic, differ by data + chain index. */
class AttackState extends BaseState {
  readonly name: string;
  private data: AttackData;
  private chainIndex: number;
  private nextBufferedChain: 'light' | 'heavy' | null = null;

  constructor(name: string, data: AttackData, chainIndex: number) {
    super();
    this.name = name;
    this.data = data;
    this.chainIndex = chainIndex;
  }

  override enter(ctx: PlayerCtx): void {
    ctx.setFlags({ canMove: false, canRotate: true, canAttack: false, canDodge: false, canReceiveHit: true, invincible: false });
    ctx.combat.beginAttack(this.data, ctx, ctx.position, ctx.facing);
    const wd = ctx.weaponManager.data;
    ctx.combat.configureHitBox(wd.hitboxRadius, wd.hitboxOffset);
    ctx.anim.play(this.data.animation, { loop: false });
    ctx.vfx.trail.begin(ctx.weaponTipWorld(tmp.vec3A));
    this.nextBufferedChain = null;
  }

  override update(dt: number, ctx: PlayerCtx): void {
    // animation events drive hitbox windows
    for (const e of ctx.animEvents()) ctx.combat.onAnimEvent(e);

    // slight forward drift during swing
    const drift = this.data.movementMultiplier * 1.4;
    if (ctx.anim.normalizedTime < 0.6) {
      tmp.vec3A.set(ctx.facing.x * drift * dt, 0, ctx.facing.z * drift * dt);
      ctx.physics.move(tmp.vec3A, dt);
    } else {
      ctx.physics.move(tmp.vec3A.set(0, 0, 0), dt);
    }

    // combat overlap each frame while active
    ctx.combat.update(ctx.position, ctx.facing);
    ctx.vfx.trail.update(ctx.weaponTipWorld(tmp.vec3B));

    // dodge press is buffered for a moment so attack-tail presses still land
    if (ctx.dodgeBuffered && ctx.anim.normalizedTime > 0.45) {
      ctx.dodgeBuffered = false;
      ctx.vfx.trail.end();
      ctx.combat.endAttack();
      ctx.tryDodge();
      return;
    }

    // dodge cancel during recovery (classic brawler feel)
    if (ctx.controller.dodgePressed && ctx.anim.normalizedTime > 0.55) {
      ctx.vfx.trail.end();
      ctx.combat.endAttack();
      ctx.tryDodge();
      return;
    }

    // combo chaining: press anywhere in tail half of the swing queues the next hit.
    const inComboWindow = ctx.combat.comboWindowOpen || ctx.anim.normalizedTime > 0.45;
    if (inComboWindow && this.nextBufferedChain === null) {
      const buf = ctx.controller.consumeBuffer();
      if (buf) {
        if (buf.kind === 'heavy') this.nextBufferedChain = 'heavy';
        else if (this.chainIndex < 2) this.nextBufferedChain = 'light';
      }
    }
    // finish: anim clip end OR wall-clock fallback (clip may be missing on some rigs)
    const dur = this.data.startup + this.data.active + this.data.recovery;
    const finish = ctx.anim.finished || ctx.animDuration() >= dur * 1.25;
    if (finish) {
      ctx.vfx.trail.end();
      ctx.combat.endAttack();
      ctx.chaining = true;
      try {
        if (this.nextBufferedChain === 'heavy') {
          ctx.startHeavy();
        } else if (this.nextBufferedChain === 'light' && this.chainIndex < 2) {
          ctx.startAttack('light');
        } else {
          throw new ExitChain();
        }
      } catch (e) {
        if (!(e instanceof ExitChain)) throw e;
        ctx.comboIndex = -1;
        ctx.fsm.transition(ctx.controller.moveAmount > 0.05 ? 'Move' : Anim.Idle, ctx);
      } finally {
        ctx.chaining = false;
      }
    }
    void dt;
  }

  override exit(ctx: PlayerCtx): void {
    ctx.vfx.trail.end();
  }
}

class DodgeState extends BaseState {
  readonly name = Anim.Dodge;
  private t = 0;
  private dir = new THREE.Vector3();

  override enter(ctx: PlayerCtx): void {
    this.t = 0;
    ctx.setFlags({ canMove: false, canRotate: false, canAttack: false, canDodge: false, canReceiveHit: true, invincible: false });
    // dodge direction: current input or facing
    const m = ctx.controller.moveAmount;
    if (m > 0.05) this.dir.copy(ctx.controller.moveDir);
    else this.dir.copy(ctx.facing);
    ctx.faceTowards(this.dir);
    ctx.anim.play(Anim.Dodge, { loop: false });
    ctx.dodgeCooldown = PLAYER_CONFIG.dodge.cooldown;
  }

  override update(dt: number, ctx: PlayerCtx): void {
    this.t += dt;
    for (const e of ctx.animEvents()) {
      if (e === 'InvincibleOn') ctx.setFlags({ invincible: true });
      if (e === 'InvincibleOff') ctx.setFlags({ invincible: false });
      void e;
    }
    const dur = PLAYER_CONFIG.dodge.duration;
    // movement synced to animation window
    if (this.t < dur * 0.75) {
      tmp.vec3A.copy(this.dir).multiplyScalar(PLAYER_CONFIG.dodge.speed);
      ctx.physics.move(tmp.vec3A, dt);
    } else {
      ctx.physics.move(tmp.vec3A.set(0, 0, 0), dt);
    }
    if (ctx.anim.finished || this.t > dur + 0.1) {
      ctx.setFlags({ invincible: false });
      ctx.fsm.transition(ctx.controller.moveAmount > 0.05 ? 'Move' : Anim.Idle, ctx);
    }
  }
}

class AirState extends BaseState {
  readonly name: string;
  private animName: string;
  constructor(name: string, animName: string) { super(); this.name = name; this.animName = animName; }

  override enter(ctx: PlayerCtx): void {
    ctx.setFlags({ canMove: true, canRotate: true, canAttack: false, canDodge: false, canReceiveHit: true, invincible: false });
    if (ctx.anim.currentAnim !== this.animName) ctx.anim.crossFade(this.animName, 0.08, this.name === 'Fall');
  }

  override update(dt: number, ctx: PlayerCtx): void {
    const speed = ctx.moveSpeedNow() * 0.6; // air control
    tmp.vec3A.copy(ctx.controller.moveDir).multiplyScalar(speed);
    ctx.physics.move(tmp.vec3A, dt);

    if (ctx.physics.isGrounded) {
      ctx.fsm.transition('Land', ctx);
      return;
    }
    if (this.name === 'Jump' && !ctx.physics.airborne) ctx.fsm.transition('Fall', ctx);
  }
}

class LandState extends BaseState {
  readonly name = 'Land';
  private t = 0;
  override enter(ctx: PlayerCtx): void {
    this.t = 0;
    ctx.setFlags({ canMove: false, canRotate: true, canAttack: false, canDodge: false, canReceiveHit: true, invincible: false });
    ctx.anim.play(Anim.Land, { loop: false });
  }
  override update(dt: number, ctx: PlayerCtx): void {
    this.t += dt;
    ctx.physics.move(tmp.vec3A.set(0, 0, 0), dt);
    if (ctx.anim.finished || this.t > 0.34) {
      ctx.fsm.transition(ctx.controller.moveAmount > 0.05 ? 'Move' : Anim.Idle, ctx);
    }
  }
}

class HitState extends BaseState {
  readonly name = Anim.Hit;
  private t = 0;
  override enter(ctx: PlayerCtx): void {
    this.t = 0;
    ctx.setFlags({ canMove: false, canRotate: false, canAttack: false, canDodge: false, canReceiveHit: false, invincible: true });
    ctx.anim.play(Anim.Hit, { loop: false });
  }
  override update(dt: number, ctx: PlayerCtx): void {
    this.t += dt;
    const decay = Math.exp(-8 * dt);
    tmp.vec3A.copy(ctx.knockDir).multiplyScalar(ctx.knockSpeed * decay);
    ctx.physics.move(tmp.vec3A, dt);
    if (this.t > PLAYER_CONFIG.hitReaction.hitStun) {
      ctx.setFlags({ invincible: false });
      ctx.fsm.transition(Anim.Idle, ctx);
    }
  }
}

class KnockbackState extends BaseState {
  readonly name = Anim.Knockback;
  private t = 0;
  override enter(ctx: PlayerCtx): void {
    this.t = 0;
    ctx.setFlags({ canMove: false, canRotate: false, canAttack: false, canDodge: false, canReceiveHit: false, invincible: true });
    ctx.anim.play(Anim.Knockback, { loop: false });
  }
  override update(dt: number, ctx: PlayerCtx): void {
    this.t += dt;
    const decay = Math.exp(-5 * dt);
    tmp.vec3A.copy(ctx.knockDir).multiplyScalar(ctx.knockSpeed * decay);
    ctx.physics.move(tmp.vec3A, dt);
    if (ctx.physics.lastLandingImpact > 6 && ctx.physics.isGrounded) {
      ctx.fsm.transition(Anim.Knockdown, ctx);
      return;
    }
    if (this.t > PLAYER_CONFIG.hitReaction.knockbackStun) {
      ctx.setFlags({ invincible: false });
      ctx.fsm.transition(Anim.Idle, ctx);
    }
  }
}

class KnockdownState extends BaseState {
  readonly name = Anim.Knockdown;
  private t = 0;
  override enter(ctx: PlayerCtx): void {
    this.t = 0;
    ctx.setFlags({ canMove: false, canRotate: false, canAttack: false, canDodge: false, canReceiveHit: false, invincible: true });
    ctx.anim.play(Anim.Knockdown, { loop: false });
  }
  override update(dt: number, ctx: PlayerCtx): void {
    this.t += dt;
    ctx.physics.move(tmp.vec3A.set(0, 0, 0), dt);
    if (this.t > PLAYER_CONFIG.hitReaction.knockdownDuration) ctx.fsm.transition(Anim.GetUp, ctx);
  }
}

class GetUpState extends BaseState {
  readonly name = Anim.GetUp;
  private t = 0;
  override enter(ctx: PlayerCtx): void {
    this.t = 0;
    ctx.setFlags({ canMove: false, canRotate: true, canAttack: false, canDodge: false, canReceiveHit: false, invincible: true });
    ctx.anim.play(Anim.GetUp, { loop: false });
  }
  override update(dt: number, ctx: PlayerCtx): void {
    this.t += dt;
    ctx.physics.move(tmp.vec3A.set(0, 0, 0), dt);
    if (this.t > PLAYER_CONFIG.hitReaction.getUpDuration) {
      ctx.invulnTimer = PLAYER_CONFIG.hitReaction.invulnAfterGetUp;
      ctx.setFlags({ invincible: true });
      ctx.fsm.transition(Anim.Idle, ctx);
    }
  }
}

class DeathState extends BaseState {
  readonly name = Anim.Death;
  override enter(ctx: PlayerCtx): void {
    ctx.setFlags({ canMove: false, canRotate: false, canAttack: false, canDodge: false, canReceiveHit: false, invincible: true });
    ctx.combat.endAttack();
    ctx.anim.play(Anim.Death, { loop: false });
  }
  override update(dt: number, ctx: PlayerCtx): void {
    ctx.physics.move(tmp.vec3A.set(0, 0, 0), dt);
    void dt;
  }
}

const idleState: PState = {
  name: Anim.Idle,
  enter(ctx) {
    ctx.setFlags({ canMove: true, canRotate: true, canAttack: true, canDodge: true, canReceiveHit: true, invincible: false });
    if (ctx.anim.currentAnim !== Anim.Idle) ctx.anim.crossFade(Anim.Idle, 0.15, true);
  },
  update(dt, ctx) {
    const buf = ctx.controller.consumeBuffer();
    if (buf) { ctx.startAttack(buf.kind); return; }
    if (ctx.controller.dodgePressed) { ctx.tryDodge(); return; }
    if (ctx.controller.jumpPressed) { ctx.tryJump(); return; }
    ctx.applyMove(0, dt);
    if (ctx.controller.moveAmount < 0.05) ctx.faceCameraForward();
    if (ctx.controller.moveAmount > 0.05) ctx.fsm.transition('Move', ctx);
  },
  exit() { /* noop */ },
};

export function buildPlayerFSM(): StateMachine<PlayerCtx> {
  const fsm = new StateMachine<PlayerCtx>(idleState);
  fsm.add(new LocomotionState('Move', Anim.Walk));
  fsm.add(new LocomotionState('Run', Anim.Run));
  return fsm;
}

/** Build the three-chain + heavy attack states for a given weapon table. */
export function addAttackStates(fsm: StateMachine<PlayerCtx>, table: Record<'1' | '2' | '3' | 'heavy', AttackData>): void {
  fsm.add(new AttackState('Attack1', table['1'], 0));
  fsm.add(new AttackState('Attack2', table['2'], 1));
  fsm.add(new AttackState('Attack3', table['3'], 2));
  fsm.add(new AttackState('HeavyAttack', table['heavy'], -1));
}

export function addSharedStates(fsm: StateMachine<PlayerCtx>): void {
  fsm.add(new DodgeState());
  fsm.add(new AirState('Jump', Anim.Jump));
  fsm.add(new AirState('Fall', Anim.Fall));
  fsm.add(new LandState());
  fsm.add(new HitState());
  fsm.add(new KnockbackState());
  fsm.add(new KnockdownState());
  fsm.add(new GetUpState());
  fsm.add(new DeathState());
}

export type { StateContext };
