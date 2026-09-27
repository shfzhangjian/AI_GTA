/** Global game tuning — every gameplay knob lives here, not in systems. */

export const GAME_CONFIG = {
  title: "Tinker's Crossing",
  groundY: 0,
  gravity: -26,
} as const;

export const PLAYER_CONFIG = {
  maxHealth: 120,
  radius: 0.42,
  height: 1.55, // capsule half-height (cylinder part) => ~ total 2.4m tall cartoon hero
  moveSpeed: 5.6,
  sprintMultiplier: 1.35,
  rotationLerpSpeed: 14,
  jumpImpulse: 8.2,
  maxJumps: 1,
  facingTurnSpeed: 16,

  dodge: {
    duration: 0.5,
    speed: 11.5,
    invincibleStart: 0.1,
    invincibleEnd: 0.32,
    cooldown: 0.75,
    distance: 3.2,
  },

  inputBufferWindow: 0.18, // seconds an attack press is remembered
  comboDropTime: 0.62, // if no chained input by attack end + this, combo resets

  hitReaction: {
    hitStun: 0.28,
    knockbackStun: 0.45,
    knockdownDuration: 1.0,
    getUpDuration: 0.6,
    invulnAfterGetUp: 0.35,
  },

  respawnOnRestart: { x: 0, y: 1.2, z: 30 },
} as const;

export const CAMERA_CONFIG = {
  distance: 10.0,
  height: 5.4,
  pitchDeg: 28, // downward angle toward player
  followLerp: 6.5,
  lookAheadLerp: 4.0,
  lookAheadMax: 2.6,
  minDistance: 7.5,
  maxDistance: 15.0,
  combatDistanceBonus: 0.8, // extra distance when multiple enemies near
  bossDistanceBonus: 3.2,
  bossHeightBonus: 1.4,
  zoomLerp: 2.2,
} as const;

export const WAVES = {
  wave1Count: 3,
  waveClearDelay: 1.6,
  arenaSpawnRadius: 9,
} as const;

export const DEBUG_KEYS = {
  togglePanel: 'F3',
  godMode: 'F4',
} as const;
