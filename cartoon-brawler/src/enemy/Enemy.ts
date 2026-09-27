/** Enemy definitions: three archetypes with data-driven stats. */
import type { CharacterStats } from '../characters/CharacterStats';
import { PALETTE } from '../config/graphicsConfig';

export type EnemyKind = 'swordsman' | 'brute' | 'rogue';

export interface EnemyDef {
  kind: EnemyKind;
  displayName: string;
  stats: CharacterStats;
  colors: { body: number; cloth: number; skin: number; accent: number };
  scale: number;
  attackDamage: number;
  attackRange: number;      // preferred strike distance
  attackWindup: number;     // seconds before hitbox enables
  attackActive: number;
  attackRecovery: number;
  attackCooldown: [min: number, max: number];
  circleChance: number;     // rogue-like strafing tendency
  strafeSpeed: number;
  damage: number;
  knockback: number;
  hitStop: number;
  cameraShake: number;
}

export const ENEMY_DEFS: Record<EnemyKind, EnemyDef> = {
  swordsman: {
    kind: 'swordsman', displayName: 'MERCENARY',
    stats: { maxHealth: 34, knockResistance: 0.1, mass: 72, canBeLaunched: true, isBossOrHeavy: false, moveSpeed: 4.1, damageMultiplier: 1 },
    colors: { body: PALETTE.enemyA, cloth: 0x5c3a2a, skin: PALETTE.skin, accent: 0x8f9aa8 },
    scale: 0.96,
    attackDamage: 8, attackRange: 1.9, attackWindup: 0.42, attackActive: 0.16, attackRecovery: 0.35,
    attackCooldown: [1.1, 1.9], circleChance: 0.15, strafeSpeed: 2.2,
    damage: 8, knockback: 3.2, hitStop: 0.03, cameraShake: 0.5,
  },
  brute: {
    kind: 'brute', displayName: 'IRONBACK',
    stats: { maxHealth: 90, knockResistance: 0.72, mass: 140, canBeLaunched: false, isBossOrHeavy: true, moveSpeed: 2.7, damageMultiplier: 1 },
    colors: { body: PALETTE.enemyB, cloth: 0x3d4450, skin: 0xd9b48f, accent: PALETTE.gold },
    scale: 1.22,
    attackDamage: 16, attackRange: 2.3, attackWindup: 0.72, attackActive: 0.2, attackRecovery: 0.55,
    attackCooldown: [1.8, 2.6], circleChance: 0.0, strafeSpeed: 0,
    damage: 16, knockback: 6.5, hitStop: 0.055, cameraShake: 1.1,
  },
  rogue: {
    kind: 'rogue', displayName: 'SHADELING',
    stats: { maxHealth: 20, knockResistance: 0.0, mass: 55, canBeLaunched: true, isBossOrHeavy: false, moveSpeed: 6.1, damageMultiplier: 1 },
    colors: { body: PALETTE.enemyC, cloth: 0x2f3550, skin: 0xe8c9a8, accent: 0x9fe8a0 },
    scale: 0.88,
    attackDamage: 5, attackRange: 1.7, attackWindup: 0.26, attackActive: 0.12, attackRecovery: 0.22,
    attackCooldown: [0.7, 1.2], circleChance: 0.55, strafeSpeed: 4.2,
    damage: 5, knockback: 2.0, hitStop: 0.025, cameraShake: 0.35,
  },
};
