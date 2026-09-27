/** Rendering / visual tuning. */

export const GRAPHICS_CONFIG = {
  shadowMapSize: 1024,
  shadowArea: 46, // ortho extent of directional shadow camera
  pixelRatioCap: 1.75,
  fogNear: 55,
  fogFar: 130,
  fogColor: 0xbfd8e8,
  skyColorTop: 0x8ec9ef,
  skyColorBottom: 0xdff0f7,
  ambientSkyColor: 0x9db8d6,
  ambientGroundColor: 0x6a5a3f,
  sunColor: 0xffe8b8,
  sunIntensity: 2.4,
  hemiIntensity: 0.85,
} as const;

/** Palette used across procedural geometry (cartoon saturated, low metal). */
export const PALETTE = {
  grass: 0x7cb45a,
  grassDark: 0x689e4b,
  dirt: 0xb98d5e,
  dirtDark: 0x9c744a,
  stone: 0x9aa3ad,
  stoneDark: 0x77808a,
  wood: 0xa5713f,
  woodDark: 0x7d5230,
  woodLight: 0xc99a62,
  roofRed: 0xc94f3d,
  roofBlue: 0x4f7dc9,
  roofPurple: 0x7d4fc9,
  metal: 0x8f9aa8,
  metalDark: 0x5c6672,
  gold: 0xe8b23a,
  skin: 0xf2c19b,
  heroTunic: 0x3f8f5a,
  heroCloth: 0xd9563f,
  enemyA: 0x8a4f3f,
  enemyB: 0x5c6672,
  enemyC: 0x4f5e8a,
  boss: 0x3d4450,
  bossCloth: 0x8a2f3f,
  water: 0x4f9dc9,
  crate: 0xc9974f,
  barrel: 0xa5713f,
} as const;
