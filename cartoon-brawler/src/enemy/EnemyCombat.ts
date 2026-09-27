/** EnemyCombat: enemy weapon hitbox + player strike resolution. */
import * as THREE from 'three';
import type { PhysicsWorld } from '../physics/PhysicsWorld';
import type { CombatSystem } from '../combat/CombatSystem';
import { HitBox } from '../combat/HitBox';
import { LAYER_BITS } from '../config/physicsConfig';
import type { Enemy } from './EnemyEntity';

export class EnemyCombat {
  private hitBox: HitBox;
  private hitSet = new Set<number>();

  constructor(physicsWorld: PhysicsWorld, scene: THREE.Scene, private combat: CombatSystem) {
    this.hitBox = new HitBox(physicsWorld, scene);
    this.hitBox.targetLayer = LAYER_BITS.PLAYER;
  }

  configure(range: number): void {
    this.hitBox.configure({ radius: range * 0.95, offset: range * 0.45, angleDeg: 100 });
  }

  /** instantaneous strike check (called at windup end) */
  tryStrike(enemy: Enemy, damage: number, knockback: number, hitStop: number, cameraShake: number): boolean {
    this.hitSet.clear();
    const before = enemy.playerWasHit;
    this.hitBox.enabled = true;
    this.combat.processAttack(
      {
        source: enemy,
        hitBox: this.hitBox,
        origin: enemy.entityPosition,
        facing: enemy.facing,
        damage,
        knockback,
        verticalForce: 0,
        hitStop,
        cameraShake,
        category: 'light',
        breakPower: 0,
        hitSet: this.hitSet,
      },
      this.hitBox,
    );
    this.hitBox.enabled = false;
    return enemy.playerWasHit !== before;
  }

  endAttack(): void {
    this.hitBox.enabled = false;
    this.hitSet.clear();
  }
}
