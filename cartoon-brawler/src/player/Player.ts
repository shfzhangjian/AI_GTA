/**
 * Player: the hero entity. Implements CombatEntityLike, owns physics capsule,
 * visual rig, animation controller, weapon manager and FSM. All state behavior
 * lives in PlayerStateMachine states; Player exposes the services they use.
 */
import * as THREE from 'three';
import { CharacterPhysicsController } from '../physics/CharacterPhysics';
import { PhysicsGroups } from '../physics/CollisionLayers';
import { AnimationController } from '../animation/AnimationController';
import { ProceduralClipFactory } from '../animation/ProceduralClips';
import { WeaponManager } from '../weapons/WeaponManager';
import type { WeaponId } from '../weapons/WeaponData';
import { PlayerCombat } from './PlayerCombat';
import { buildPlayerFSM, addSharedStates, addAttackStates, type PlayerCtx } from './PlayerStateMachine';
import { StateMachine, defaultContext, type StateContext } from '../core/StateMachine';
import { PLAYER_CONFIG } from '../config/gameConfig';
import { Health } from '../characters/CharacterStats';
import type { HitData, CombatEntityLike } from '../combat/HitData';
import type { Team } from '../combat/DamageSystem';
import type { PhysicsWorld } from '../physics/PhysicsWorld';
import type { CombatSystem } from '../combat/CombatSystem';
import { HitBox } from '../combat/HitBox';
import type { VFXManager } from '../effects/VFXManager';
import type { EventBus } from '../core/EventBus';
import type { AudioManager } from '../audio/AudioManager';
import type { PlayerController } from './PlayerController';
import { buildProceduralCharacter, rigFromGLB, HERO_COLORS, type VisualRig } from '../characters/Character';
import type { LoadedModel } from '../assets/AssetManager';
import { Anim } from '../animation/AnimationState';
import { tmp } from '../core/TempObjects';

export class Player implements CombatEntityLike, PlayerCtx {
  readonly team: Team = 'player';
  readonly health: Health;
  readonly physics: CharacterPhysicsController;
  readonly anim: AnimationController;
  readonly weaponManager: WeaponManager;
  readonly combat: PlayerCombat;
  fsm: StateMachine<PlayerCtx>;
  readonly visualRoot = new THREE.Group();

  /** facing direction (horizontal, normalized) */
  readonly facing = new THREE.Vector3(0, 0, -1);
  private targetYaw = Math.PI; // face -Z into the level
  comboIndex = -1;
  /** true while an attack state is finishing into a chained attack */
  chaining = false;
  /** dodge press buffered briefly so presses during attacks aren't lost */
  dodgeBuffered = false;
  private dodgeBufferTimer = 0;
  dodgeCooldown = 0;
  invulnTimer = 0;
  /** knockback params applied by reaction states */
  knockDir = new THREE.Vector3();
  knockSpeed = 0;

  private rig: VisualRig;
  private flags: StateContext = defaultContext();
  private handFallback = new THREE.Vector3(0.42, 1.15, 0.1);

  constructor(
    physicsWorld: PhysicsWorld,
    combatSystem: CombatSystem,
    scene: THREE.Scene,
    public vfx: VFXManager,
    public controller: PlayerController,
    private bus: EventBus,
    private audio: AudioManager,
    model: LoadedModel | undefined,
  ) {
    this.health = new Health(PLAYER_CONFIG.maxHealth);

    // ---- visual rig ----
    if (model && model.fromFile) {
      const inst = model.template.clone(true);
      // normalize height to ~2.3m cartoon hero
      const box = new THREE.Box3().setFromObject(inst);
      const size = new THREE.Vector3();
      box.getSize(size);
      const scale = 2.3 / Math.max(size.y, 0.01);
      inst.position.y = -box.min.y * scale;
      this.rig = rigFromGLB(inst, scale);
      // recolor to hero palette (stylize)
      inst.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (mesh.isMesh && mesh.material) {
          const m = (Array.isArray(mesh.material) ? mesh.material[0] : mesh.material) as THREE.MeshStandardMaterial;
          if (m.color.getHex() < 0x202020) return; // keep dark parts
          if (/visor/i.test(mesh.name)) m.color.setHex(HERO_COLORS.cloth);
          else m.color.setHex(HERO_COLORS.body).offsetHSL(0, 0.15, 0);
        }
      });
    } else {
      this.rig = buildProceduralCharacter(HERO_COLORS, 1.06);
    }
    this.visualRoot.add(this.rig.root);
    if (model && model.fromFile) {
      // pin feet: rig root space bottom must sit at visualRoot origin.
      // inst already has a compensating position.y set above, so re-measure after adding.
      const b = new THREE.Box3().setFromObject(this.rig.root);
      this.rig.root.position.y -= b.min.y;
    }
    scene.add(this.visualRoot);

    // ---- weapon ----
    this.weaponManager = new WeaponManager(this.rig.root);
    this.weaponManager.bindHandBone(this.rig.handBone);

    // ---- animation ----
    const procedural = new ProceduralClipFactory(this.rig.armatureRoot).buildAll();
    this.anim = new AnimationController({
      root: this.rig.armatureRoot,
      fileClips: model?.fromFile ? model.clips : [],
      proceduralClips: procedural,
    });

    // ---- physics capsule ----
    this.physics = new CharacterPhysicsController(physicsWorld, {
      radius: PLAYER_CONFIG.radius,
      // capsule cylinder half-height; collider is centered on the body origin, so
      // feet sit at translation.y - (halfHeight + radius)
      halfHeight: PLAYER_CONFIG.height / 2 - PLAYER_CONFIG.radius,
      groups: PhysicsGroups.PLAYER,
      initialPos: new THREE.Vector3(PLAYER_CONFIG.respawnOnRestart.x, PLAYER_CONFIG.respawnOnRestart.y + (PLAYER_CONFIG.height / 2), PLAYER_CONFIG.respawnOnRestart.z),
    });

    // ---- combat ----
    const hitBox = new HitBox(physicsWorld, scene);
    this.combat = new PlayerCombat(combatSystem, hitBox);

    // ---- fsm ----
    this.fsm = buildPlayerFSM();
    addSharedStates(this.fsm);
    this.refreshAttackStates(combatSystem);

    combatSystem.bindEntity({
      entity: this,
      colliderHandle: this.physics.collider.handle,
      stats: {
        knockResistance: 0.15,
        mass: 75,
        canBeLaunched: true,
        isBossOrHeavy: false,
      },
    });
  }

  /** hitboxes need the scene + physics; small shim to avoid circular import cost */
  private refreshAttackStates(combatSystem: CombatSystem): void {
    void combatSystem;
    addAttackStates(this.fsm, PlayerCombat.attackTable(this.weaponManager.current.id));
  }

  switchWeapon(id: WeaponId): void {
    if (this.weaponManager.current.id === id) return;
    this.weaponManager.equip(id, this.rig.root);
    this.comboIndex = -1;
    this.bus.emit('weapon:changed', { weapon: id });
    this.audio.play('ui');
  }

  // ---------- CombatEntityLike ----------
  get position(): THREE.Vector3 {
    return tmp.vec3D.copy(this.visualRoot.position);
  }
  get isAlive(): boolean {
    return !this.health.isDead;
  }

  applyHit(hit: HitData & { reaction?: string }): void {
    if (this.flags.invincible || this.health.isDead) return;
    const died = this.health.damage(hit.damage);
    this.bus.emit('player:hit', { damage: hit.damage, health: this.health.current, maxHealth: this.health.max });
    this.audio.play('hurt');

    if (died) {
      this.fsm.transition(Anim.Death, this);
      this.bus.emit('player:died', {});
      return;
    }

    this.knockDir.copy(hit.direction).normalize();
    this.knockSpeed = hit.knockback * 0.85;
    const reaction = hit.reaction ?? 'hit';
    if (reaction === 'launch') {
      this.physics.launch(hit.verticalForce * 0.8);
      this.fsm.transition(Anim.Knockback, this);
    } else if (reaction === 'knockback') {
      this.fsm.transition(Anim.Knockback, this);
    } else {
      this.fsm.transition(Anim.Hit, this);
    }
    this.comboIndex = -1;
  }

  // ---------- services used by states ----------
  setFlags(partial: Partial<StateContext>): void {
    Object.assign(this.flags, partial);
  }
  get context(): StateContext {
    return this.flags;
  }

  moveSpeedNow(): number {
    const base = PLAYER_CONFIG.moveSpeed;
    return this.controller.sprint ? base * PLAYER_CONFIG.sprintMultiplier : base;
  }

  applyMove(speed: number, dt: number): void {
    tmp.vec3A.copy(this.controller.moveDir).multiplyScalar(speed * this.controller.moveAmount);
    if (tmp.vec3A.lengthSq() > 0.01) {
      this.faceTowards(tmp.vec3A);
    }
    this.physics.move(tmp.vec3A, dt);
  }

  /** beat-'em-up idle: face into the screen */
  faceCameraForward(): void {
    this.targetYaw = Math.PI;
  }

  faceTowards(dir: THREE.Vector3): void {
    if (dir.lengthSq() < 1e-5) return;
    this.targetYaw = Math.atan2(dir.x, dir.z);
  }

  tryDodge(): void {
    if (this.dodgeCooldown > 0) return;
    this.dodgeBuffered = false;
    this.setFlags({ canDodge: true }); // attacks buffer-cancel into dodge
    const ok = this.fsm.transition(Anim.Dodge, this);
    this.setFlags({ canDodge: false });
    if (ok) this.audio.play('dodge');
  }

  tryJump(): void {
    if (!this.physics.isGrounded) return;
    if (this.physics.jump(PLAYER_CONFIG.jumpImpulse)) {
      this.fsm.transition('Jump', this);
      this.audio.play('jump');
    }
  }

  startAttack(kind: 'light' | 'heavy'): void {
    if (!this.flags.canAttack && !this.chaining) return;
    const table = PlayerCombat.attackTable(this.weaponManager.current.id);
    if (kind === 'heavy') {
      this.startHeavy();
      return;
    }
    // chain progression
    let stateName: string;
    if (this.comboIndex < 0) { this.comboIndex = 0; stateName = 'Attack1'; }
    else if (this.comboIndex === 0) { this.comboIndex = 1; stateName = 'Attack2'; }
    else if (this.comboIndex === 1) { this.comboIndex = 2; stateName = 'Attack3'; }
    else { this.comboIndex = 0; stateName = 'Attack1'; }
    if (stateName === 'Attack3') this.comboIndex = -1; // next light restarts chain
    void table;
    const entered = this.fsm.transition(stateName, this);
    if (!entered) { this.comboIndex = -1; return; }
    this.audio.play('swing');
  }

  startHeavy(): void {
    if (!this.flags.canAttack && !this.chaining) return;
    if (this.fsm.transition('HeavyAttack', this)) {
      this.comboIndex = -1;
      this.audio.play('swing');
    }
  }

  /** events fired by the most recent animation update (consumed by attack states) */
  private lastAnimEvents: string[] = [];

  animEvents(): string[] {
    return this.lastAnimEvents;
  }

  debugHandInfo(): string {
    const hb = this.rig.handBone;
    if (!hb) return 'no handBone';
    const p = hb.getWorldPosition(new THREE.Vector3());
    return `hand ${p.x.toFixed(2)},${p.y.toFixed(2)},${p.z.toFixed(2)} name ${hb.name}`;
  }

  debugRigInfo(): string {
    this.visualRoot.updateWorldMatrix(true, false);
    const p = this.rig.root.position;
    const ps = this.rig.root.getWorldScale(new THREE.Vector3());
    const box = new THREE.Box3().setFromObject(this.visualRoot);
    return `rigLocal ${p.y.toFixed(2)} scale ${ps.y.toFixed(2)} meshY ${box.min.y.toFixed(2)}..${box.max.y.toFixed(2)}`;
  }

  weaponTipWorld(out: THREE.Vector3): THREE.Vector3 {
    // matrices are stale at logic-time (renderer updates them later in the frame)
    this.visualRoot.updateWorldMatrix(true, true);
    return this.weaponManager.current.tipAnchor.getWorldPosition(out);
  }

  /** elapsed time in current animation (seconds) */
  animDuration(): number {
    return this.anim.elapsedInAnim;
  }

  // ---------- per-frame ----------
  /** logic phase: FSM + timers */
  update(dt: number): void {
    if (this.health.isDead) {
      this.physics.move(tmp.vec3A.set(0, 0, 0), dt);
      return;
    }
    if (this.dodgeCooldown > 0) this.dodgeCooldown -= dt;
    if (this.controller.dodgePressed) this.dodgeBuffered = true;
    this.dodgeBufferTimer = this.dodgeBuffered ? this.dodgeBufferTimer + dt : 0;
    if (this.dodgeBufferTimer > 0.25) {
      this.dodgeBuffered = false;
      this.dodgeBufferTimer = 0;
    }
    if (this.invulnTimer > 0) {
      this.invulnTimer -= dt;
      if (this.invulnTimer <= 0 && this.fsm.stateName === Anim.Idle) this.setFlags({ invincible: false });
    }
    // fall out of world safety
    const p = this.physics.position;
    if (p.y < -6) {
      this.physics.teleport(new THREE.Vector3(p.x, 1.5, Math.max(-20, Math.min(34, p.z))));
    }
    this.fsm.update(dt, this);
  }

  /** animation phase: advance mixer once per frame (states consume events first) */
  updateAnim(dt: number): void {
    const events = this.anim.update(dt);
    this.lastAnimEvents = events;
    for (const e of events) {
      if (e === 'HitBoxEnable' || e === 'HitBoxDisable' || e === 'ComboWindowOpen' || e === 'ComboWindowClose') {
        this.combat.onAnimEvent(e);
      }
    }
  }

  /** transform sync: physics -> visual */
  syncTransform(dt: number): void {
    const p = this.physics.getPositionInto(tmp.vec3A);
    this.visualRoot.position.set(p.x, p.y - this.physics.centerOffset, p.z);

    // smooth rotation toward target yaw
    let diff = this.targetYaw - this.visualRoot.rotation.y;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    this.visualRoot.rotation.y += diff * Math.min(1, PLAYER_CONFIG.facingTurnSpeed * dt);

    // facing vector from yaw
    this.facing.set(Math.sin(this.visualRoot.rotation.y), 0, Math.cos(this.visualRoot.rotation.y));

    // weapon hand follow
    this.weaponManager.syncHand(this.rig.root, this.handFallback);
  }

  reset(spawn: THREE.Vector3): void {
    this.health.reset();
    this.physics.teleport(spawn);
    this.comboIndex = -1;
    this.dodgeCooldown = 0;
    this.invulnTimer = 0;
    this.controller.reset();
    this.combat.endAttack();
    this.fsm = buildPlayerFSM();
    addSharedStates(this.fsm);
    addAttackStates(this.fsm, PlayerCombat.attackTable(this.weaponManager.current.id));
    this.setFlags(defaultContext());
    this.targetYaw = Math.PI;
  }

  get physicsColliderHandle(): number {
    return this.physics.collider.handle;
  }

  dispose(): void {
    this.physics.dispose();
    this.anim.dispose();
  }
}


