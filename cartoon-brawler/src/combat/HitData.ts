/** HitData: everything a landed hit carries through the pipeline. */
import * as THREE from 'three';
import type { AttackData } from '../config/combatConfig';
import type { DamageCategory, Team } from './DamageSystem';

export interface HitBoxOwnerRef {
  team: Team;
  /** callback used by knockback resistance etc. */
  entity: CombatEntityLike;
}

export interface CombatEntityLike {
  team: Team;
  position: THREE.Vector3;
  applyHit(hit: HitData): void;
  readonly isAlive: boolean;
}

export interface HitData {
  source: CombatEntityLike;
  target: CombatEntityLike;
  damage: number;
  knockback: number;
  verticalForce: number;
  hitStop: number;
  cameraShake: number;
  /** horizontal direction from source to target (normalized, y=0) */
  direction: THREE.Vector3;
  /** world-space impact point */
  impactPoint: THREE.Vector3;
  category: DamageCategory;
  attack?: AttackData;
  breakPower: number;
}
