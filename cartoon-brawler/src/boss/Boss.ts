/**
 * Boss: giant cartoon hammer knight. FSM-lite via skill state machine (Chase /
 * Windup / SkillActive / Recover / Stagger / Dead) driven by BossPhaseController.
 */
import * as THREE from 'three';
import { CharacterPhysicsController } from '../physics/CharacterPhysics';
import { PhysicsGroups } from '../physics/CollisionLayers';
import { AnimationController } from '../animation/AnimationController';
import { ProceduralClipFactory } from '../animation/ProceduralClips';
import { buildProceduralCharacter, BOSS_COLORS } from '../characters/Character';
import { Health } from '../characters/CharacterStats';
import { HitBox } from '../combat/HitBox';
import { LAYER_BITS } from '../config/physicsConfig';
import type { CombatSystem } from '../combat/CombatSystem';
import type { PhysicsWorld } from '../physics/PhysicsWorld';
import type { EventBus } from '../core/EventBus';
import type { AudioManager } from '../audio/AudioManager';
import type { VFXManager } from '../effects/VFXManager';
import { BossPhaseController } from './BossPhaseController';
import { BOSS_CONFIG, type BossSkill } from './BossAI';
import type { HitData, CombatEntityLike } from '../combat/HitData';
import type { Team } from '../combat/DamageSystem';
import { tmp } from '../core/TempObjects';

type BossState = 'Idle' | 'Chase' | 'Windup' | 'Skill' | 'Recover' | 'Stagger' | 'Dead';

export class Boss implements CombatEntityLike {
  readonly team: Team = 'boss';
  readonly health: Health;
  readonly physics: CharacterPhysicsController;
  readonly anim: AnimationController;
  readonly visualRoot = new THREE.Group();
  readonly facing = new THREE.Vector3(0, 0, -1);
  private targetYaw = Math.PI;
  state: BossState = 'Idle';
  private stateT = 0;
  private skill: BossSkill | null = null;
  readonly phases = new BossPhaseController();

  /** test hook: apply damage through the normal hit path */
  debugTakeDamage(d: number): void {
    this.applyHit({
      source: this as never, target: this as never, damage: d, knockback: 0, verticalForce: 0,
      hitStop: 0, cameraShake: 0, direction: tmp.vec3A.set(0, 0, 1), impactPoint: tmp.vec3B.copy(this.visualRoot.position),
      category: 'melee' as never, breakPower: 0,
    });
  }
  private attackTimer = 2.0;
  private hitSet = new Set<number>();
  private hitBox: HitBox;
  private hammerGroup = new THREE.Group();
  private spinAngle = 0;
  private doubleSmashHits = 0;
  active = false;

  constructor(
    spawn: THREE.Vector3,
    physicsWorld: PhysicsWorld,
    scene: THREE.Scene,
    private combatSystem: CombatSystem,
    private playerEntity: { position: THREE.Vector3; isAlive: boolean },
    private bus: EventBus,
    private audio: AudioManager,
    private vfx: VFXManager,
  ) {
    this.health = new Health(BOSS_CONFIG.maxHealth);

    const rig = buildProceduralCharacter(BOSS_COLORS, BOSS_CONFIG.scale);
    // boss gets a horned helm + giant hammer
    rig.root.traverse((o) => {
      if (o.name === 'head') {
        const horn = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.55, 6), new THREE.MeshStandardMaterial({ color: BOSS_COLORS.accent, roughness: 0.4, metalness: 0.6 }));
        horn.position.set(0.28, 0.5, 0);
        horn.rotation.z = -0.7;
        o.add(horn);
        const horn2 = horn.clone();
        horn2.position.x = -0.28;
        horn2.rotation.z = 0.7;
        o.add(horn2);
      }
    });
    this.visualRoot.add(rig.root);
    scene.add(this.visualRoot);

    // giant hammer in right hand
    const headMat = new THREE.MeshStandardMaterial({ color: 0x5c6672, roughness: 0.4, metalness: 0.6 });
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 3.2, 8), new THREE.MeshStandardMaterial({ color: 0x5c3a1e, roughness: 0.9 }));
    handle.position.y = 1.4;
    const head = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.1, 1.1), headMat);
    head.position.y = 3.1;
    handle.castShadow = head.castShadow = true;
    this.hammerGroup.add(handle, head);
    (rig.handBone ?? rig.root).add(this.hammerGroup);

    const procedural = new ProceduralClipFactory(rig.armatureRoot).buildAll();
    this.anim = new AnimationController({ root: rig.armatureRoot, fileClips: [], proceduralClips: procedural });
    this.anim.setSpeedScale(0.85);

    this.physics = new CharacterPhysicsController(physicsWorld, {
      radius: BOSS_CONFIG.radius,
      halfHeight: BOSS_CONFIG.halfHeight,
      groups: PhysicsGroups.ENEMY,
      initialPos: spawn.clone().setY(spawn.y + 1),
      mass: 320,
    });

    this.hitBox = new HitBox(physicsWorld, scene);
    this.hitBox.targetLayer = LAYER_BITS.PLAYER;

    combatSystem.bindEntity({
      entity: this,
      colliderHandle: this.physics.collider.handle,
      stats: { knockResistance: 0.92, mass: 320, canBeLaunched: false, isBossOrHeavy: true },
    });
  }

  activate(): void {
    if (this.active) return;
    this.active = true;
    this.audio.play('bossRoar');
    this.bus.emit('boss:appeared', { name: 'SER BOLDWYN THE HOLLOW', maxHealth: this.health.max });
  }

  get position(): THREE.Vector3 {
    return tmp.vec3E.copy(this.visualRoot.position);
  }
  get isAlive(): boolean {
    return !this.health.isDead;
  }

  applyHit(hit: HitData & { reaction?: string }): void {
    if (this.state === 'Dead') return;
    const died = this.health.damage(hit.damage);
    this.bus.emit('boss:hit', { health: this.health.current, maxHealth: this.health.max });
    const newPhase = this.phases.checkPhase(this.health.fraction);
    if (newPhase) {
      this.audio.play('bossRoar');
      this.state = 'Recover';
      this.stateT = 0;
      this.attackTimer = BOSS_CONFIG.skillCooldownAfterPhaseChange;
      // phase change shockwave taunt
      this.vfx.spawnShockwave(tmp.vec3A.copy(this.visualRoot.position).setY(0.1), 12, 0xff7847);
    }
    if (died) {
      this.state = 'Dead';
      this.stateT = 0;
      this.anim.play('Death', { loop: false });
      this.audio.play('death');
      this.bus.emit('boss:died', {});
      return;
    }
    if (this.state !== 'Stagger' && Math.random() < 0.25) {
      this.state = 'Stagger';
      this.stateT = 0;
    }
    void hit;
  }

  update(dt: number): void {
    if (!this.active) return;
    const pos = this.physics.position;
    if (pos.y < -6) this.physics.teleport(tmp.vec3A.set(0, 1.5, -34));

    this.stateT += dt;
    if (this.state === 'Dead') {
      this.physics.move(tmp.vec3A.set(0, 0, 0), dt);
      return;
    }

    const player = tmp.vec3B.copy(this.playerEntity.position);
    const dist = Math.hypot(pos.x - player.x, pos.z - player.z);
    tmp.vec3A.subVectors(player, this.visualRoot.position).setY(0);
    if (tmp.vec3A.lengthSq() > 1e-5) {
      tmp.vec3A.normalize();
      this.targetYaw = Math.atan2(tmp.vec3A.x, tmp.vec3A.z);
    }

    const speedMul = this.phases.speedMultiplier();

    switch (this.state) {
      case 'Idle':
        this.physics.move(tmp.vec3A.set(0, 0, 0), dt);
        if (dist < 24) this.setState('Chase');
        break;
      case 'Chase': {
        const spd = BOSS_CONFIG.moveSpeed * speedMul;
        tmp.vec3A.subVectors(player, this.visualRoot.position).setY(0);
        if (tmp.vec3A.lengthSq() > 0.1) tmp.vec3A.setLength(spd);
        this.physics.move(tmp.vec3A, dt);
        this.attackTimer -= dt;
        if (this.attackTimer <= 0 && dist < 16) {
          this.skill = this.phases.chooseSkill();
          this.setState('Windup');
          const clip = this.skill.windup > 0.75 ? 'HeavyAttack' : 'BossWindup';
          this.anim.play(clip, { loop: false });
          this.audio.play('swing');
        }
        break;
      }
      case 'Windup': {
        this.physics.move(tmp.vec3A.set(0, 0, 0), dt);
        const s = this.skill!;
        if (this.stateT >= s.windup * (2 - speedMul)) {
          this.setState('Skill');
          this.hitSet.clear();
          this.doubleSmashHits = 0;
          this.spinAngle = 0;
          this.hitBox.enabled = true;
          if (s.id === 'charge') {
            // face player hard at charge start
            this.targetYaw = Math.atan2(tmp.vec3A.x, tmp.vec3A.z);
            this.visualRoot.rotation.y = this.targetYaw;
          }
        }
        break;
      }
      case 'Skill': {
        const s = this.skill!;
        // per-skill movement
        if (s.id === 'charge') {
          tmp.vec3A.set(Math.sin(this.visualRoot.rotation.y), 0, Math.cos(this.visualRoot.rotation.y)).multiplyScalar(s.chargeSpeed!);
          this.physics.move(tmp.vec3A, dt);
          if (this.stateT > 0.15 && Math.floor(this.stateT * 8) !== Math.floor((this.stateT - dt) * 8)) {
            this.vfx.trail.update(this.hammerTip(tmp.vec3C));
          }
        } else if (s.id === 'spinAttack') {
          this.spinAngle += dt * 10;
          tmp.vec3A.set(Math.sin(this.visualRoot.rotation.y), 0, Math.cos(this.visualRoot.rotation.y)).multiplyScalar(1.6);
          this.physics.move(tmp.vec3A, dt);
        } else if (s.id === 'jumpSmash' && this.stateT < s.active) {
          // arc hop handled visually; small forward drift
          tmp.vec3A.copy(this.facing).multiplyScalar(4.5);
          this.physics.move(tmp.vec3A, dt);
        } else {
          this.physics.move(tmp.vec3A.set(0, 0, 0), dt);
        }

        // hit windows
        const interval = s.hits ? s.active / s.hits : s.active;
        const windowStart = s.hits ? this.doubleSmashHits * interval : 0;
        if (this.stateT >= windowStart && (!s.hits || this.doubleSmashHits === Math.floor(this.stateT / interval))) {
          this.hitBox.configure({ radius: s.range, offset: s.range * 0.4, angleDeg: s.id === 'spinAttack' ? 360 : 150 });
          const shakeMul = s.id === 'spinAttack' ? 0.4 : 1;
          this.combatSystem.processAttack(
            {
              source: this, hitBox: this.hitBox, origin: this.visualRoot.position, facing: this.facing,
              damage: s.damage * (s.hits ? 0.75 : 1), knockback: s.knockback, verticalForce: s.verticalForce,
              hitStop: s.hitStop, cameraShake: s.cameraShake * shakeMul, category: 'heavy', breakPower: 3, hitSet: this.hitSet,
            },
            this.hitBox,
          );
        }

        // shockwave skills emit ring at strike moment
        if (s.shockwave && !this.hitSet.has(-7) && this.stateT >= (s.hits ? interval * 0.5 : s.active * 0.4)) {
          this.hitSet.add(-7);
          this.audio.play('shockwave');
          this.vfx.spawnShockwave(tmp.vec3A.copy(this.visualRoot.position).setY(0.09), 13, 0x9fdcff);
          // ring damage: if player within radius band
          const d = Math.hypot(player.x - this.visualRoot.position.x, player.z - this.visualRoot.position.z);
          if (d < s.range) {
            tmp.vec3A.subVectors(player, this.visualRoot.position).setY(0).normalize();
            (this.playerEntity as unknown as { applyHit(h: HitData & { reaction?: string }): void }).applyHit({
              source: this, target: this.playerEntity as never, damage: s.damage * 0.7, knockback: s.knockback * 0.8,
              verticalForce: s.verticalForce * 0.6, hitStop: 0.05, cameraShake: s.cameraShake, direction: tmp.vec3A.clone(),
              impactPoint: player.clone().setY(1), category: 'shockwave', breakPower: 0, reaction: 'knockback',
            });
          }
        }

        if (s.hits && this.stateT >= (this.doubleSmashHits + 1) * interval && this.doubleSmashHits < s.hits) {
          this.doubleSmashHits++;
          this.hitSet.delete(-1); // allow re-hit on second swing
          this.anim.play('Attack1', { loop: false });
        }

        const totalActive = s.active + (s.id === 'charge' ? 0.15 : 0);
        if (this.stateT >= totalActive) {
          this.hitBox.enabled = false;
          if (s.shockwave) this.audio.play('hitHeavy');
          else this.audio.play('hitHeavy');
          // ground pound fx + shake even on miss
          if (s.id === 'hammerSmash' || s.id === 'jumpSmash') {
            this.vfx.spawnShockwave(tmp.vec3A.copy(this.visualRoot.position).setY(0.07), 8, 0xcfd6de);
            this.audio.play('shockwave');
          }
          this.setState('Recover');
        }
        break;
      }
      case 'Recover': {
        this.physics.move(tmp.vec3A.set(0, 0, 0), dt);
        const s = this.skill;
        if (this.stateT >= (s ? s.recovery : 0.5) / speedMul) {
          const [min, max] = BOSS_CONFIG.attackInterval;
          this.attackTimer = ((min + Math.random() * (max - min)) / speedMul);
          this.setState('Chase');
        }
        break;
      }
      case 'Stagger': {
        this.physics.move(tmp.vec3A.set(0, 0, 0), dt);
        if (this.stateT > 0.35) this.setState('Chase');
        break;
      }
    }

    // hammer swing visual follows anim state
    const t = this.anim.normalizedTime;
    if (this.state === 'Windup') {
      this.hammerGroup.rotation.x = -2.4 * Math.min(1, t * 2);
    } else if (this.state === 'Skill') {
      const s = this.skill!;
      if (s.id === 'spinAttack') this.hammerGroup.rotation.y = this.spinAngle;
      else this.hammerGroup.rotation.x = -2.4 + 4.0 * Math.min(1, t * 3);
    } else {
      this.hammerGroup.rotation.x *= Math.exp(-6 * dt);
      this.hammerGroup.rotation.y *= Math.exp(-6 * dt);
    }
  }

  private hammerTip(out: THREE.Vector3): THREE.Vector3 {
    return out.set(0, 3.1, 0).applyMatrix4(this.hammerGroup.matrixWorld);
  }

  private setState(s: BossState): void {
    this.state = s;
    this.stateT = 0;
    if (s === 'Chase' && this.anim.currentAnim !== 'Run') this.anim.crossFade('Run', 0.15, true);
    if (s === 'Idle') this.anim.crossFade('Idle', 0.3, true);
  }

  syncTransform(dt: number): void {
    const p = this.physics.getPositionInto(tmp.vec3A);
    this.visualRoot.position.set(p.x, p.y - this.physics.centerOffset, p.z);
    let diff = this.targetYaw - this.visualRoot.rotation.y;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    const turn = this.state === 'Windup' ? 3 : 7;
    this.visualRoot.rotation.y += diff * Math.min(1, turn * dt);
    this.facing.set(Math.sin(this.visualRoot.rotation.y), 0, Math.cos(this.visualRoot.rotation.y));
  }

  updateAnim(dt: number): void {
    this.anim.update(dt);
  }

  get physicsColliderHandle(): number {
    return this.physics.collider.handle;
  }

  reset(spawn: THREE.Vector3): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const h = this.health as any;
    h.current = h.max; h.dead = false;
    this.state = 'Idle';
    this.active = false;
    this.phases.phase = 1;
    this.attackTimer = 2;
    this.physics.teleport(spawn.clone().setY(spawn.y + 1));
    this.visualRoot.rotation.set(0, Math.PI, 0);
    this.visualRoot.visible = true;
    this.anim.crossFade('Idle', 0.2, true);
  }
}
