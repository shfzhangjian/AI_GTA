/**
 * PlayerCombat: owns attack execution — builds AttackActivations from AttackData,
 * opens/closes hitboxes via animation events, dedupes hits per swing.
 */
import * as THREE from 'three';
import type { AttackData } from '../config/combatConfig';
import { SWORD_ATTACKS, HAMMER_ATTACKS } from '../config/combatConfig';
import type { HitBox } from '../combat/HitBox';
import type { CombatSystem } from '../combat/CombatSystem';
import type { CombatEntityLike } from '../combat/HitData';
import type { DamageCategory } from '../combat/DamageSystem';

export class PlayerCombat {
  activeAttack: AttackData | null = null;
  hitBoxActive = false;
  comboWindowOpen = false;
  private attackStateRef: AttackState | null = null;

  constructor(private combat: CombatSystem, private hitBox: HitBox) {}

  static attackTable(weapon: 'sword' | 'hammer'): Record<'1' | '2' | '3' | 'heavy', AttackData> {
    return weapon === 'sword' ? SWORD_ATTACKS : HAMMER_ATTACKS;
  }

  /** Called by state machine when an attack begins. */
  beginAttack(data: AttackData, source: CombatEntityLike, origin: THREE.Vector3, facing: THREE.Vector3): void {
    this.activeAttack = data;
    this.hitBoxActive = false;
    this.comboWindowOpen = false;
    const state: AttackState = {
      data,
      source,
      hitSet: new Set<number>(),
      lastOrigin: origin.clone(),
      lastFacing: facing.clone(),
    };
    this.attackStateRef = state;
  }

  /** per-frame while attacking: process overlap if hitbox is live */
  update(origin: THREE.Vector3, facing: THREE.Vector3): void {
    const s = this.attackStateRef;
    if (!s) return;
    s.lastOrigin.copy(origin);
    s.lastFacing.copy(facing);
    if (this.hitBoxActive && this.activeAttack) {
      const d = this.activeAttack;
      this.combat.processAttack(
        {
          source: s.source,
          hitBox: this.hitBox,
          origin,
          facing,
          damage: d.damage,
          knockback: d.knockback,
          verticalForce: d.verticalForce,
          hitStop: d.hitStop,
          cameraShake: d.cameraShake,
          category: (d.id.includes('heavy') ? 'heavy' : d.id.endsWith('_3') ? 'finisher' : 'light') as DamageCategory,
          breakPower: 1,
          hitSet: s.hitSet,
        },
        this.hitBox,
      );
    }
  }

  onAnimEvent(event: string): void {
    switch (event) {
      case 'HitBoxEnable':
        this.hitBoxActive = true;
        this.hitBox.enabled = true;
        break;
      case 'HitBoxDisable':
        this.hitBoxActive = false;
        this.hitBox.enabled = false;
        break;
      case 'ComboWindowOpen':
        this.comboWindowOpen = true;
        break;
      case 'ComboWindowClose':
        this.comboWindowOpen = false;
        break;
    }
  }

  configureHitBox(radius: number, offset: number): void {
    this.hitBox.configure({ radius, offset });
  }

  endAttack(): void {
    this.activeAttack = null;
    this.attackStateRef = null;
    this.hitBoxActive = false;
    this.comboWindowOpen = false;
    this.hitBox.enabled = false;
  }
}

interface AttackState {
  data: AttackData;
  source: CombatEntityLike;
  hitSet: Set<number>;
  lastOrigin: THREE.Vector3;
  lastFacing: THREE.Vector3;
}
