/**
 * Enemy entity: visual rig + physics capsule + FSM + utility AI + coordinator
 * integration. Implements CombatEntityLike so player hitboxes can strike it.
 */
import * as THREE from 'three';
import { CharacterPhysicsController } from '../physics/CharacterPhysics';
import { PhysicsGroups } from '../physics/CollisionLayers';
import { AnimationController } from '../animation/AnimationController';
import { ProceduralClipFactory } from '../animation/ProceduralClips';
import { buildProceduralCharacter, type VisualRig } from '../characters/Character';
import { Health } from '../characters/CharacterStats';
import { ENEMY_DEFS, type EnemyDef, type EnemyKind } from './Enemy';
import { buildEnemyFSM } from './EnemyStateMachine';
import { EnemyCombat } from './EnemyCombat';
import { utilityScores, hasLineOfSight, type AIAction, type AIScore } from './EnemyAI';
import type { PhysicsWorld } from '../physics/PhysicsWorld';
import type { CombatSystem } from '../combat/CombatSystem';
import type { EnemyCoordinator } from './EnemyCoordinator';
import type { EventBus } from '../core/EventBus';
import type { AudioManager } from '../audio/AudioManager';
import type { HitData, CombatEntityLike } from '../combat/HitData';
import type { Team } from '../combat/DamageSystem';
import type { StateMachine } from '../core/StateMachine';
import type { EnemyCtx } from './EnemyStateMachine';
import { tmp } from '../core/TempObjects';

const enemyPosScratch = new THREE.Vector3();

let nextEnemyId = 1;

export class Enemy implements CombatEntityLike, EnemyCtx {
  readonly id: number = nextEnemyId++;
  readonly team: Team = 'enemy';
  readonly def: EnemyDef;
  readonly health: Health;
  readonly physics: CharacterPhysicsController;
  readonly anim: AnimationController;
  readonly combatOwner: EnemyCombat;
  fsm: StateMachine<EnemyCtx>;
  readonly visualRoot = new THREE.Group();
  readonly facing = new THREE.Vector3(0, 0, -1);
  private targetYaw = Math.PI;
  knockDir = new THREE.Vector3();
  knockSpeed = 0;
  elapsedAlive = 0;
  instanceSeed: number;
  attackCooldownLeft = 0.6 + Math.random() * 0.8;
  playerWasHit = false;
  lastScores: Record<string, number> | null = null;
  separationOffset?: THREE.Vector3;
  aiAction: AIAction = 'approach';
  private losTimer: number;
  inSight = true;
  private despawnRequested = false;
  private labelSprite: THREE.Sprite | null = null;

  constructor(
    def: EnemyDef,
    spawnPos: THREE.Vector3,
    private physicsWorld: PhysicsWorld,
    scene: THREE.Scene,
    public combatSystem: CombatSystem,
    public coordinator: EnemyCoordinator,
    private playerEntity: { position: THREE.Vector3; isAlive: boolean },
    private bus: EventBus,
    public audio: AudioManager,
    private showLabels: () => boolean,
  ) {
    this.def = def;
    this.health = new Health(def.stats.maxHealth);
    this.instanceSeed = Math.random() * 100;
    this.losTimer = Math.random() * 0.5;

    // visual
    const rig: VisualRig = buildProceduralCharacter(def.colors, def.scale);
    this.visualRoot.add(rig.root);
    scene.add(this.visualRoot);
    this.rig = rig;

    // weapon prop for readability (sword/mace/dagger block)
    this.attachWeapon(scene);

    const procedural = new ProceduralClipFactory(rig.armatureRoot).buildAll();
    this.anim = new AnimationController({ root: rig.armatureRoot, fileClips: [], proceduralClips: procedural });

    // physics
    this.physics = new CharacterPhysicsController(physicsWorld, {
      radius: 0.4 * def.scale,
      halfHeight: 0.55 * def.scale,
      groups: PhysicsGroups.ENEMY,
      initialPos: spawnPos.clone().setY(spawnPos.y + 0.6),
      mass: def.stats.mass,
    });

    this.combatOwner = new EnemyCombat(physicsWorld, scene, combatSystem);
    this.combatOwner.configure(def.attackRange);

    this.fsm = buildEnemyFSM(this);
    this.anchor = spawnPos.clone();

    // AI debug label
    const canvas = document.createElement('canvas');
    canvas.width = 256; canvas.height = 64;
    const tex = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true });
    this.labelSprite = new THREE.Sprite(mat);
    this.labelSprite.scale.set(2.4, 0.6, 1);
    this.labelSprite.visible = false;
    scene.add(this.labelSprite);
    this.labelCanvas = canvas;
    this.labelTex = tex;

    combatSystem.bindEntity({
      entity: this,
      colliderHandle: this.physics.collider.handle,
      stats: {
        knockResistance: def.stats.knockResistance,
        mass: def.stats.mass,
        canBeLaunched: def.stats.canBeLaunched,
        isBossOrHeavy: def.stats.isBossOrHeavy,
      },
    });
    coordinator.register(this.id, this.entityPosition);
  }

  private rig: VisualRig;
  private labelCanvas: HTMLCanvasElement;
  private labelTex: THREE.CanvasTexture;
  anchor: THREE.Vector3;

  private attachWeapon(scene: THREE.Scene): void {
    void scene;
    const kind = this.def.kind;
    const mat = new THREE.MeshStandardMaterial({ color: this.def.colors.accent, roughness: 0.5, metalness: 0.4 });
    let mesh: THREE.Mesh;
    if (kind === 'swordsman') {
      mesh = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.9, 0.04), mat);
    } else if (kind === 'brute') {
      mesh = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.42, 0.42), mat);
    } else {
      mesh = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.5, 4), mat);
    }
    const hand = this.rig.handBone ?? this.rig.root;
    mesh.position.set(0, -0.12, 0.12);
    mesh.rotation.x = -0.5;
    mesh.castShadow = true;
    hand.add(mesh);
  }

  /** stable per-entity scratch (not shared with physics temps) */
  private readonly posScratch = enemyPosScratch;
  get entityPosition(): THREE.Vector3 {
    return this.posScratch.copy(this.visualRoot.position);
  }
  /** CombatEntityLike */
  get position(): THREE.Vector3 {
    return this.entityPosition;
  }
  getPositionInto(out: THREE.Vector3): THREE.Vector3 {
    return out.copy(this.visualRoot.position);
  }
  get isAlive(): boolean {
    return !this.health.isDead;
  }
  playerPosition(out: THREE.Vector3): THREE.Vector3 {
    return out.copy(this.playerEntity.position);
  }

  faceTowards(dir: THREE.Vector3): void {
    if (dir.lengthSq() < 1e-6) return;
    this.targetYaw = Math.atan2(dir.x, dir.z);
  }

  // ---------- hit pipeline ----------
  applyHit(hit: HitData & { reaction?: string }): void {
    if (this.health.isDead) return;
    const died = this.health.damage(hit.damage);
    this.knockDir.copy(hit.direction).normalize();
    this.knockSpeed = hit.knockback * (1 - this.def.stats.knockResistance);

    if (died) {
      this.fsm.transition('Death', this);
      this.bus.emit('enemy:killed', { kind: this.def.kind });
      return;
    }
    const reaction = hit.reaction ?? 'hit';
    if (reaction === 'launch') {
      this.physics.launch(hit.verticalForce);
      this.physics.addKnockback(this.knockDir.x, this.knockDir.z, this.knockSpeed);
      this.fsm.transition('Airborne', this);
    } else if (reaction === 'knockback') {
      this.physics.addKnockback(this.knockDir.x, this.knockDir.z, this.knockSpeed);
      this.fsm.transition('Knockback', this);
    } else if (reaction === 'stagger') {
      this.physics.addKnockback(this.knockDir.x, this.knockDir.z, this.knockSpeed * 0.35);
      this.fsm.transition('Hit', this);
    } else {
      this.physics.addKnockback(this.knockDir.x, this.knockDir.z, this.knockSpeed);
      this.fsm.transition('Hit', this);
    }
    // aggro on being hit
    this.attackCooldownLeft = Math.min(this.attackCooldownLeft, 0.4);
  }

  /** physics chain reaction: fast-moving enemies smash breakables they collide with */
  smashBreakablesNearby(radius: number, impactForce: number): void {
    const pos = this.physics.position;
    tmp.vec3A.set(pos.x, pos.y - this.physics.centerOffset + 0.6, pos.z);
    this.combatSystem.breakableQuery(tmp.vec3A, radius, (handle) => {
      this.combatSystem.smashBreakableByHandle(handle, impactForce, tmp.vec3B.copy(tmp.vec3A));
    });
  }

  /** enemy strike attempt against player (called by Attack state) */
  tryHitPlayer(): void {
    this.playerWasHit = false;
    const def = this.def;
    this.combatOwner.tryStrike(this, def.damage, def.knockback, def.hitStop, def.cameraShake);
  }

  onAttackFinished(): void {
    const [min, max] = this.def.attackCooldown;
    this.attackCooldownLeft = min + Math.random() * (max - min);
    this.coordinator.setAttacking(this.id, false);
  }

  aiSuggestPostHit(): string {
    return 'Chase';
  }

  onDeathFx(): void {
    this.bus.emit('impact', { x: this.visualRoot.position.x, y: this.visualRoot.position.y + 1, z: this.visualRoot.position.z, power: 1, kind: 'death' });
    this.coordinator.unregister(this.id);
    if (this.labelSprite) this.labelSprite.visible = false;
  }

  requestDespawn(): void {
    this.despawnRequested = true;
  }
  get wantsDespawn(): boolean {
    return this.despawnRequested;
  }

  // ---------- AI move target (slot-aware) ----------
  aiMoveTarget(out: THREE.Vector3): THREE.Vector3 {
    const claimant = this.coordinator.claimant(this.id);
    if (claimant && claimant.holdingSlot >= 0) {
      this.coordinator.slotPosition(claimant.holdingSlot, out);
      return out;
    }
    return out.copy(this.playerEntity.position);
  }

  /** AI decision phase (called in ai slot of loop) */
  updateAI(dt: number): void {
    if (!this.isAlive) return;

    this.elapsedAlive += dt;
    if (this.attackCooldownLeft > 0) this.attackCooldownLeft -= dt;

    // LOS refresh ~2x/s
    this.losTimer -= dt;
    if (this.losTimer <= 0) {
      this.losTimer = 0.5;
      tmp.vec3A.copy(this.playerEntity.position);
      this.inSight = hasLineOfSight(
        this.physicsWorld.world as never,
        this.visualRoot.position,
        tmp.vec3A,
      );
    }

    const state = this.fsm.stateName;
    if (state === 'Idle' || state === 'Patrol') {
      if (this.inSight && this.distToPlayer() < 18) this.fsm.transition('Chase', this);
      return;
    }
    if (state === 'Attack' || state === 'Recover' || state.startsWith('Knock') || state === 'Airborne' || state === 'GetUp' || state === 'Hit' || state === 'Death') return;

    // utility decision
    const d = this.distToPlayer();
    tmp.vec3A.subVectors(this.playerEntity.position, this.visualRoot.position).setY(0);
    const toPlayerAngle = Math.abs(angleBetween(this.facing, tmp.vec3A));
    const input = {
      distToPlayer: d,
      angleToPlayer: toPlayerAngle,
      attackCooldownLeft: this.attackCooldownLeft,
      hasAttackSlot: (this.coordinator.claimant(this.id)?.holdingSlot ?? -1) >= 0,
      canAttackNow: this.coordinator.canAttack(this.id),
      inSight: this.inSight,
      healthFrac: this.health.fraction,
      circleChance: this.def.circleChance,
      preferredRange: this.def.attackRange,
    };
    const result: AIScore = utilityScores(input);
    this.aiAction = result.action;
    if (this.showLabels()) {
      this.lastScores = result.scores as Record<string, number>;
    } else this.lastScores = null;

    switch (result.action) {
      case 'attack':
        if (this.coordinator.canAttack(this.id)) {
          this.coordinator.setAttacking(this.id, true);
          this.faceTowards(tmp.vec3A);
          this.fsm.transition('Attack', this);
        } else {
          this.fsm.transition('Circle', this);
        }
        break;
      case 'circle':
        if (state !== 'Circle') this.fsm.transition('Circle', this);
        break;
      case 'retreat': {
        tmp.vec3B.subVectors(this.visualRoot.position, this.playerEntity.position).setY(0).normalize();
        tmp.vec3B.multiplyScalar(this.def.stats.moveSpeed * 0.8);
        this.faceTowards(tmp.vec3A); // keep facing player while backing off handled in physics move
        this.physics.move(tmp.vec3B, dt);
        if (state !== 'Circle' && d > this.def.attackRange * 2.4) this.fsm.transition('Chase', this);
        break;
      }
      case 'idle':
        this.fsm.transition('Idle', this);
        break;
      case 'approach':
      default:
        if (state !== 'Chase') this.fsm.transition('Chase', this);
        break;
    }
  }

  private distToPlayer(): number {
    return Math.hypot(
      this.visualRoot.position.x - this.playerEntity.position.x,
      this.visualRoot.position.z - this.playerEntity.position.z,
    );
  }

  /** logic phase: FSM */
  update(dt: number): void {
    if (this.health.isDead && this.fsm.stateName !== 'Death') {
      this.fsm.transition('Death', this);
    }
    // separation nudge: small velocity applied for one frame
    if (this.separationOffset) {
      tmp.vec3A.copy(this.separationOffset).multiplyScalar(60);
      if (tmp.vec3A.length() > 3) tmp.vec3A.setLength(3);
      this.physics.move(tmp.vec3A, dt);
      this.separationOffset = undefined;
    }
    this.fsm.update(dt, this);
  }

  updateAnim(dt: number): void {
    this.anim.update(dt);
  }

  syncTransform(dt: number): void {
    const p = this.physics.getPositionInto(tmp.vec3A);
    this.visualRoot.position.set(p.x, p.y - this.physics.centerOffset, p.z);
    let diff = this.targetYaw - this.visualRoot.rotation.y;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    this.visualRoot.rotation.y += diff * Math.min(1, 10 * dt);
    this.facing.set(Math.sin(this.visualRoot.rotation.y), 0, Math.cos(this.visualRoot.rotation.y));

    if (this.labelSprite) {
      const show = this.showLabels() && this.isAlive;
      this.labelSprite.visible = show;
      if (show) {
        this.labelSprite.position.set(this.visualRoot.position.x, this.visualRoot.position.y + 2.6 * this.def.scale, this.visualRoot.position.z);
        this.drawLabel();
      }
    }
  }

  private labelFrame = 0;
  private drawLabel(): void {
    this.labelFrame++;
    if (this.labelFrame % 15 !== 1) return;
    const c = this.labelCanvas.getContext('2d');
    if (!c) return;
    c.clearRect(0, 0, 256, 64);
    c.fillStyle = 'rgba(0,0,0,0.55)';
    c.fillRect(0, 0, 256, 64);
    c.font = '20px monospace';
    c.fillStyle = '#9fe8a0';
    const scoreStr = this.lastScores
      ? Object.entries(this.lastScores).map(([k, v]) => `${k[0]}${v.toFixed(1)}`).join(' ')
      : '';
    c.fillText(`${this.fsm.stateName} ${scoreStr}`, 6, 26);
    c.fillStyle = '#ffd76a';
    c.fillText(`hp ${Math.ceil(this.health.current)} cd:${this.attackCooldownLeft.toFixed(1)}`, 6, 52);
    this.labelTex.needsUpdate = true;
  }

  dispose(): void {
    this.coordinator.unregister(this.id);
    this.combatOwner.endAttack();
    this.physics.dispose();
    this.anim.dispose();
    this.visualRoot.removeFromParent();
    if (this.labelSprite) {
      this.labelSprite.removeFromParent();
      this.labelTex.dispose();
    }
  }

  get physicsColliderHandle(): number {
    return this.physics.collider.handle;
  }
}

function angleBetween(a: THREE.Vector3, b: THREE.Vector3): number {
  const la = a.length(), lb = b.length();
  if (la < 1e-6 || lb < 1e-6) return Math.PI;
  const dot = (a.x * b.x + a.z * b.z) / (la * lb);
  return Math.acos(Math.max(-1, Math.min(1, dot)));
}

/** convenience for spawn tables */
export function enemyDefFor(kind: EnemyKind): EnemyDef {
  return ENEMY_DEFS[kind];
}
