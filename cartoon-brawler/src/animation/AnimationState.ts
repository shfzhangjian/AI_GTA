/** Logical animation state names used across the game. */
export const Anim = {
  Idle: 'Idle',
  Walk: 'Walk',
  Run: 'Run',
  Attack1: 'Attack1',
  Attack2: 'Attack2',
  Attack3: 'Attack3',
  HeavyAttack: 'HeavyAttack',
  Dodge: 'Dodge',
  Jump: 'Jump',
  Fall: 'Fall',
  Land: 'Land',
  Hit: 'Hit',
  Knockback: 'Knockback',
  Knockdown: 'Knockdown',
  GetUp: 'GetUp',
  Death: 'Death',
  // enemy/boss extras
  ShieldBash: 'Attack1',
  BossSwing: 'Attack1',
  BossSmash: 'HeavyAttack',
  BossWindup: 'BossWindup',
} as const;

export type AnimName = (typeof Anim)[keyof typeof Anim];
