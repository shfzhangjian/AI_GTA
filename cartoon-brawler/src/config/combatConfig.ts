/** Combat tuning: attack data tables, hitstop, knockback, combo rules. */

export type AttackId =
  | 'sword_1' | 'sword_2' | 'sword_3'
  | 'sword_heavy'
  | 'hammer_1' | 'hammer_2' | 'hammer_3'
  | 'hammer_heavy';

/** Normalized-time driven attack definition (see AnimationEventTrack). */
export interface AttackData {
  id: AttackId;
  animation: string;          // logical animation name
  damage: number;
  startup: number;            // seconds
  active: number;             // hitbox window duration (s)
  recovery: number;           // s after active window
  comboWindowStart: number;   // normalized time [0..1]
  comboWindowEnd: number;
  knockback: number;          // horizontal impulse base
  verticalForce: number;      // launch impulse (0 = no launch)
  hitStop: number;            // seconds of hitstop on connect
  cameraShake: number;        // shake intensity units
  movementMultiplier: number; // root-motion drift during attack
  breakBonus: number;         // extra damage vs breakables
  launchOnBreak?: boolean;
}

export const SWORD_ATTACKS: Record<'1' | '2' | '3' | 'heavy', AttackData> = {
  '1': {
    id: 'sword_1', animation: 'Attack1', damage: 9, startup: 0.14, active: 0.16, recovery: 0.2,
    comboWindowStart: 0.34, comboWindowEnd: 0.78, knockback: 2.4, verticalForce: 0,
    hitStop: 0.035, cameraShake: 0.5, movementMultiplier: 1.6, breakBonus: 1.0,
  },
  '2': {
    id: 'sword_2', animation: 'Attack2', damage: 10, startup: 0.13, active: 0.16, recovery: 0.2,
    comboWindowStart: 0.34, comboWindowEnd: 0.78, knockback: 2.6, verticalForce: 0,
    hitStop: 0.035, cameraShake: 0.55, movementMultiplier: 1.7, breakBonus: 1.0,
  },
  '3': {
    id: 'sword_3', animation: 'Attack3', damage: 16, startup: 0.18, active: 0.2, recovery: 0.34,
    comboWindowStart: 0.0, comboWindowEnd: 0.0, knockback: 6.5, verticalForce: 4.2,
    hitStop: 0.055, cameraShake: 1.1, movementMultiplier: 2.2, breakBonus: 1.4, launchOnBreak: true,
  },
  'heavy': {
    id: 'sword_heavy', animation: 'HeavyAttack', damage: 24, startup: 0.34, active: 0.2, recovery: 0.42,
    comboWindowStart: 0.0, comboWindowEnd: 0.0, knockback: 8.5, verticalForce: 6.0,
    hitStop: 0.07, cameraShake: 1.5, movementMultiplier: 2.4, breakBonus: 2.2, launchOnBreak: true,
  },
};

export const HAMMER_ATTACKS: Record<'1' | '2' | '3' | 'heavy', AttackData> = {
  '1': {
    id: 'hammer_1', animation: 'Attack1', damage: 15, startup: 0.24, active: 0.18, recovery: 0.3,
    comboWindowStart: 0.42, comboWindowEnd: 0.82, knockback: 4.2, verticalForce: 0,
    hitStop: 0.045, cameraShake: 0.9, movementMultiplier: 1.3, breakBonus: 2.0,
  },
  '2': {
    id: 'hammer_2', animation: 'Attack2', damage: 16, startup: 0.22, active: 0.18, recovery: 0.3,
    comboWindowStart: 0.42, comboWindowEnd: 0.82, knockback: 4.5, verticalForce: 0,
    hitStop: 0.045, cameraShake: 0.95, movementMultiplier: 1.35, breakBonus: 2.0,
  },
  '3': {
    id: 'hammer_3', animation: 'Attack3', damage: 26, startup: 0.3, active: 0.22, recovery: 0.44,
    comboWindowStart: 0.0, comboWindowEnd: 0.0, knockback: 9.5, verticalForce: 7.5,
    hitStop: 0.07, cameraShake: 1.6, movementMultiplier: 1.8, breakBonus: 3.2, launchOnBreak: true,
  },
  'heavy': {
    id: 'hammer_heavy', animation: 'HeavyAttack', damage: 38, startup: 0.46, active: 0.24, recovery: 0.55,
    comboWindowStart: 0.0, comboWindowEnd: 0.0, knockback: 13.0, verticalForce: 9.5,
    hitStop: 0.085, cameraShake: 2.2, movementMultiplier: 2.0, breakBonus: 4.0, launchOnBreak: true,
  },
};

export const HITSTOP_CONFIG = {
  maxScaleClamp: 1 / 3, // never slow below this
} as const;

export const KNOCKBACK_CONFIG = {
  gravityMassNormalize: 75, // impulse scaled against this reference mass
  minLaunchSpeedForAirborne: 3.2,
  knockdownImpactSpeed: 6.5, // landing speed that triggers knockdown
} as const;

export const COMBO_CONFIG = {
  comboResetTime: 2.4,   // s without hits before counter resets
  maxComboDisplay: 99,
} as const;

export const HITBOX_CONFIG = {
  playerAttackAngleDeg: 120, // cone for arc hitbox approximation
  hurtboxPadding: 0.12,
} as const;
