/** Boss definitions: three phases, weighted skill table. */

export type BossSkillId =
  | 'horizontalSwing'
  | 'hammerSmash'
  | 'charge'
  | 'jumpSmash'
  | 'shockwave'
  | 'spinAttack'
  | 'doubleSmash';

export interface BossSkill {
  id: BossSkillId;
  name: string;
  windup: number;
  active: number;
  recovery: number;
  damage: number;
  knockback: number;
  verticalForce: number;
  range: number;
  hitStop: number;
  cameraShake: number;
  shockwave?: boolean;
  chargeSpeed?: number;
  chargeDuration?: number;
  spins?: number;
  hits?: number;
  minPhase: 1 | 2 | 3;
}

export const BOSS_SKILLS: Record<BossSkillId, BossSkill> = {
  horizontalSwing: { id: 'horizontalSwing', name: 'Horizontal Swing', windup: 0.65, active: 0.22, recovery: 0.5, damage: 14, knockback: 7, verticalForce: 0, range: 3.6, hitStop: 0.05, cameraShake: 1.2, minPhase: 1 },
  hammerSmash: { id: 'hammerSmash', name: 'Hammer Smash', windup: 0.85, active: 0.24, recovery: 0.65, damage: 22, knockback: 9, verticalForce: 7, range: 3.2, hitStop: 0.075, cameraShake: 1.8, minPhase: 1 },
  charge: { id: 'charge', name: 'Charge', windup: 0.7, active: 1.0, recovery: 0.6, damage: 18, knockback: 10, verticalForce: 4, range: 2.4, hitStop: 0.06, cameraShake: 1.4, chargeSpeed: 11, chargeDuration: 1.15, minPhase: 1 },
  jumpSmash: { id: 'jumpSmash', name: 'Jump Smash', windup: 0.6, active: 0.3, recovery: 0.7, damage: 24, knockback: 8, verticalForce: 9, range: 3.4, hitStop: 0.085, cameraShake: 2.2, shockwave: true, minPhase: 2 },
  shockwave: { id: 'shockwave', name: 'Ground Shockwave', windup: 0.9, active: 0.4, recovery: 0.7, damage: 16, knockback: 7, verticalForce: 5, range: 8.5, hitStop: 0.07, cameraShake: 2.0, shockwave: true, minPhase: 2 },
  spinAttack: { id: 'spinAttack', name: 'Spin Attack', windup: 0.6, active: 1.4, recovery: 0.8, damage: 10, knockback: 6, verticalForce: 3, range: 3.9, hitStop: 0.04, cameraShake: 1.0, spins: 3, minPhase: 3 },
  doubleSmash: { id: 'doubleSmash', name: 'Double Smash', windup: 0.55, active: 0.5, recovery: 0.6, damage: 15, knockback: 8, verticalForce: 6, range: 3.3, hitStop: 0.07, cameraShake: 1.9, hits: 2, minPhase: 3 },
};

/** phase weights: skill -> weight in that phase */
export const PHASE_WEIGHTS: Record<1 | 2 | 3, Partial<Record<BossSkillId, number>>> = {
  1: { horizontalSwing: 4, hammerSmash: 3, charge: 2.5 },
  2: { horizontalSwing: 3, hammerSmash: 3, charge: 2, jumpSmash: 3, shockwave: 2.5 },
  3: { horizontalSwing: 2, hammerSmash: 2, charge: 1.5, spinAttack: 3.5, doubleSmash: 3.5, shockwave: 1.5 },
};

export const BOSS_CONFIG = {
  maxHealth: 620,
  scale: 1.85,
  radius: 0.95,
  halfHeight: 1.4,
  moveSpeed: 3.4,
  attackRangeMul: 1.0,
  phaseThresholds: [0.7, 0.3], // phase2 at <=70%, phase3 at <=30%
  phase3SpeedMul: 1.35,
  attackInterval: [1.4, 2.6] as [number, number],
  skillCooldownAfterPhaseChange: 1.2,
} as const;
