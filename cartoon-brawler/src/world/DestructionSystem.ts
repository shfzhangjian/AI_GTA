/**
 * DestructionSystem: owns breakable props (dynamic rigid bodies) + fragment
 * debris with hard caps (<50 active fragments, <100 rigid bodies), auto-expiry
 * 3-8s and pooling of fragment meshes.
 */
import * as THREE from 'three';
import { BREAKABLE_DEFS, type BreakableKind } from './BreakableObject';
import { PhysicsGroups } from '../physics/CollisionLayers';
import { CHARACTER_PHYSICS } from '../config/physicsConfig';
import type { PhysicsWorld } from '../physics/PhysicsWorld';
import type { CombatSystem } from '../combat/CombatSystem';
import type { EventBus } from '../core/EventBus';
import type { AudioManager } from '../audio/AudioManager';
import { tmp } from '../core/TempObjects';

interface BreakableInstance {
  kind: BreakableKind;
  body: ReturnType<PhysicsWorld['world']['bodies']['getAll']>[number];
  colliderHandle: number;
  visual: THREE.Group;
  health: number;
  def: (typeof BREAKABLE_DEFS)[BreakableKind];
}

interface Debris {
  mesh: THREE.Mesh;
  body: ReturnType<PhysicsWorld['world']['bodies']['getAll']>[number];
  age: number;
  life: number;
}

export class DestructionSystem {
  private props: BreakableInstance[] = [];
  private debris: Debris[] = [];

  get propCount(): number {
    return this.props.length;
  }
  get debrisCount(): number {
    return this.debris.length;
  }

  /** test hook: destroy the n nearest breakables to a point */
  debugSmashNearest(n: number, near: THREE.Vector3): void {
    const sorted = [...this.props].sort(
      (a, b) => a.visual.position.distanceToSquared(near) - b.visual.position.distanceToSquared(near),
    );
    for (const p of sorted.slice(0, n)) this.destroyProp(p, p.visual.position.clone());
  }
  private debrisPool: THREE.Mesh[] = [];
  private fragmentBodies: Set<number> = new Set(); // collider handles of debris (for impact ignore)
  private eventRemove: (() => void) | null = null;

  constructor(
    private physics: PhysicsWorld,
    private combat: CombatSystem,
    private bus: EventBus,
    private audio: AudioManager,
    private scene: THREE.Scene,
  ) {
    // physics-impact destruction: dynamic bodies hitting each other hard
    this.eventRemove = null;
  }

  spawn(kind: BreakableKind, x: number, z: number, yRot = 0): void {
    const def = BREAKABLE_DEFS[kind];
    const visual = def.buildVisual();
    visual.position.set(x, 0, z);
    visual.rotation.y = yRot;
    this.scene.add(visual);

    const bodyDesc = this.physics.rapier.RigidBodyDesc.dynamic()
      .setTranslation(x, def.halfExtents[1] + 0.02, z)
      .setRotation({ x: 0, y: Math.sin(yRot / 2), z: 0, w: Math.cos(yRot / 2) })
      .setLinearDamping(0.35)
      .setAngularDamping(0.6)
      .setCanSleep(true);
    const body = this.physics.world.createRigidBody(bodyDesc);
    const colDesc = this.physics.rapier.ColliderDesc.cuboid(def.halfExtents[0], def.halfExtents[1], def.halfExtents[2])
      .setDensity(def.mass / (8 * def.halfExtents[0] * def.halfExtents[1] * def.halfExtents[2]))
      .setCollisionGroups(PhysicsGroups.BREAKABLE)
      .setRestitution(0.1);
    const collider = this.physics.world.createCollider(colDesc, body);

    const inst: BreakableInstance = { kind, body, colliderHandle: collider.handle, visual, health: def.health, def };
    this.props.push(inst);

    this.combat.registerBreakable(collider.handle, {
      onWeaponHit: (damage, impulse, point) => this.damageProp(inst, damage, impulse, point),
    });
  }

  private damageProp(inst: BreakableInstance, damage: number, impulse: THREE.Vector3, point: THREE.Vector3): void {
    if (inst.health <= 0) return;
    inst.health -= damage;
    // shove the prop physically
    inst.body.applyImpulse({ x: impulse.x * 0.12, y: Math.abs(impulse.y) * 0.02 + 0.4, z: impulse.z * 0.12 }, true);
    if (damage >= inst.def.breakThreshold * 0.5 || inst.health <= 0) {
      this.destroyProp(inst, point);
    }
  }

  private destroyProp(inst: BreakableInstance, point: THREE.Vector3): void {
    inst.health = 0;
    this.scene.remove(inst.visual);
    this.combat.unregisterBreakable(inst.colliderHandle);
    this.physics.world.removeRigidBody(inst.body);
    this.props = this.props.filter((p) => p !== inst);
    this.audio.play('break');
    this.bus.emit('impact', { x: point.x, y: Math.max(0.4, point.y), z: point.z, power: 1, kind: 'break' });
    this.spawnDebris(inst.def, point);
  }

  private spawnDebris(def: (typeof BREAKABLE_DEFS)[BreakableKind], at: THREE.Vector3): void {
    const budget = CHARACTER_PHYSICS.maxDebris - this.debris.length;
    const count = Math.min(def.fragmentCount, Math.max(0, budget));
    for (let i = 0; i < count; i++) {
      if (this.physics.world.bodies.len() >= CHARACTER_PHYSICS.maxRigidBodies) break;
      const fragDef = def.buildFragments()[i % def.fragmentCount];
      const mesh = this.acquireFragmentMesh(fragDef.geo, fragDef.color);
      mesh.position.copy(at).add(tmp.vec3A.set((Math.random() - 0.5) * 0.6, Math.random() * 0.7, (Math.random() - 0.5) * 0.6));

      const bodyDesc = this.physics.rapier.RigidBodyDesc.dynamic()
        .setTranslation(mesh.position.x, mesh.position.y, mesh.position.z)
        .setLinearDamping(0.2);
      const body = this.physics.world.createRigidBody(bodyDesc);
      const colDesc = this.physics.rapier.ColliderDesc.cuboid(fragDef.size.x / 2, fragDef.size.y / 2, fragDef.size.z / 2)
        .setDensity(180)
        .setCollisionGroups(PhysicsGroups.DEBRIS)
        .setRestitution(0.2);
      const col = this.physics.world.createCollider(colDesc, body);
      this.fragmentBodies.add(col.handle);

      const dir = tmp.vec3B.set((Math.random() - 0.5) * 6, 2 + Math.random() * 5, (Math.random() - 0.5) * 6);
      body.setLinvel({ x: dir.x, y: dir.y, z: dir.z }, true);
      body.setAngvel({ x: rand(6), y: rand(6), z: rand(6) }, true);

      this.debris.push({
        mesh, body, age: 0,
        life: CHARACTER_PHYSICS.debrisLifeMin + Math.random() * (CHARACTER_PHYSICS.debrisLifeMax - CHARACTER_PHYSICS.debrisLifeMin),
      });
    }
  }

  private acquireFragmentMesh(geo: THREE.BufferGeometry, color: number): THREE.Mesh {
    let mesh = this.debrisPool.pop();
    if (!mesh) {
      mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color, roughness: 0.9 }));
      mesh.castShadow = true;
      this.scene.add(mesh);
    } else {
      mesh.geometry = geo;
      (mesh.material as THREE.MeshStandardMaterial).color.setHex(color);
      mesh.visible = true;
    }
    return mesh;
  }

  /** sync visuals + expire debris */
  update(dt: number): void {
    for (const p of this.props) {
      const t = p.body.translation();
      const r = p.body.rotation();
      p.visual.position.set(t.x, t.y - p.def.halfExtents[1], t.z);
      p.visual.quaternion.set(r.x, r.y, r.z, r.w);
    }
    for (let i = this.debris.length - 1; i >= 0; i--) {
      const d = this.debris[i];
      d.age += dt;
      const t = d.body.translation();
      const r = d.body.rotation();
      d.mesh.position.set(t.x, t.y, t.z);
      d.mesh.quaternion.set(r.x, r.y, r.z, r.w);
      // fade in last second
      if (d.age > d.life - 1) {
        const mat = d.mesh.material as THREE.MeshStandardMaterial;
        mat.transparent = true;
        mat.opacity = Math.max(0, (d.life - d.age));
      }
      if (d.age >= d.life || t.y < -4) {
        this.physics.world.removeRigidBody(d.body);
        d.mesh.visible = false;
        if (this.debrisPool.length < 40) this.debrisPool.push(d.mesh);
        this.debris.splice(i, 1);
      }
    }
  }

  /** physics chain reaction: fast-moving props smash into other props */
  checkPropImpacts(): void {
    for (const p of this.props) {
      const linvel = p.body.linvel();
      const speed = Math.hypot(linvel.x, linvel.y, linvel.z);
      if (speed < 3.5) continue;
      const t = p.body.translation();
      tmp.vec3A.set(t.x, t.y, t.z);
      for (const other of this.props) {
        if (other === p || other.health <= 0) continue;
        const ot = other.body.translation();
        const d2 = (t.x - ot.x) ** 2 + (t.y - ot.y) ** 2 + (t.z - ot.z) ** 2;
        const reach = (p.def.halfExtents[0] + other.def.halfExtents[0] + 0.45) ** 2;
        if (d2 < reach) {
          tmp.vec3B.set(ot.x - t.x, 0, ot.z - t.z).normalize().multiplyScalar(speed * other.def.mass * 0.9);
          this.damageProp(other, speed * other.def.mass * 0.35, tmp.vec3B, tmp.vec3C.set(ot.x, ot.y, ot.z));
        }
      }
    }
  }

  get activeDebris(): number { return this.debris.length; }
  get activeProps(): number { return this.props.length; }

  reset(): void {
    for (const d of this.debris) {
      this.physics.world.removeRigidBody(d.body);
      d.mesh.visible = false;
      this.debrisPool.push(d.mesh);
    }
    this.debris.length = 0;
    for (const p of this.props) {
      this.scene.remove(p.visual);
      this.combat.unregisterBreakable(p.colliderHandle);
      this.physics.world.removeRigidBody(p.body);
    }
    this.props.length = 0;
    this.eventRemove?.();
  }
}

function rand(n: number): number {
  return (Math.random() - 0.5) * n;
}
