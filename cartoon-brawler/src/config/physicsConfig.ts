/** Physics tuning + collision layer bit definitions. */

export const PHYSICS_CONFIG = {
  fixedTimeStep: 1 / 60,
  maxSubSteps: 4,
  accumulatorClamp: 0.25, // clamp huge frame deltas (tab switch)
  gravity: [0, -26, 0] as const,
} as const;

/** Collision groups: membership << 16 | filter. Rapier interaction groups. */
export const LAYER_BITS = {
  WORLD: 1 << 0,
  PLAYER: 1 << 1,
  ENEMY: 1 << 2,
  PLAYER_HITBOX: 1 << 3,
  ENEMY_HITBOX: 1 << 4,
  BREAKABLE: 1 << 5,
  DEBRIS: 1 << 6,
  TRIGGER: 1 << 7,
} as const;

function group(membership: number, filter: number): number {
  return (membership << 16) | filter;
}

const all = (bits: number[]) => bits.reduce((a, b) => a | b, 0);

export const COLLISION_GROUPS = {
  /** Solid world geometry */
  WORLD: group(LAYER_BITS.WORLD, all([LAYER_BITS.PLAYER, LAYER_BITS.ENEMY, LAYER_BITS.BREAKABLE, LAYER_BITS.DEBRIS])),
  PLAYER: group(LAYER_BITS.PLAYER, all([LAYER_BITS.WORLD, LAYER_BITS.ENEMY, LAYER_BITS.ENEMY_HITBOX, LAYER_BITS.TRIGGER])),
  ENEMY: group(LAYER_BITS.ENEMY, all([LAYER_BITS.WORLD, LAYER_BITS.PLAYER, LAYER_BITS.ENEMY, LAYER_BITS.PLAYER_HITBOX, LAYER_BITS.BREAKABLE, LAYER_BITS.TRIGGER])),
  /** Player weapon hitboxes only sense enemies + breakables */
  PLAYER_HITBOX: group(LAYER_BITS.PLAYER_HITBOX, all([LAYER_BITS.ENEMY, LAYER_BITS.BREAKABLE, LAYER_BITS.WORLD])),
  ENEMY_HITBOX: group(LAYER_BITS.ENEMY_HITBOX, all([LAYER_BITS.PLAYER])),
  BREAKABLE: group(LAYER_BITS.BREAKABLE, all([LAYER_BITS.WORLD, LAYER_BITS.ENEMY, LAYER_BITS.PLAYER, LAYER_BITS.PLAYER_HITBOX, LAYER_BITS.DEBRIS])),
  DEBRIS: group(LAYER_BITS.DEBRIS, all([LAYER_BITS.WORLD, LAYER_BITS.ENEMY, LAYER_BITS.BREAKABLE])),
  TRIGGER: group(LAYER_BITS.TRIGGER, all([LAYER_BITS.PLAYER, LAYER_BITS.ENEMY])),
} as const;

export const CHARACTER_PHYSICS = {
  groundFriction: 0.7,
  airControl: 0.35,
  enemySeparationForce: 22,
  maxRigidBodies: 100,
  maxDebris: 48,
  debrisLifeMin: 3.0,
  debrisLifeMax: 8.0,
} as const;
