/** Weapon stat blocks + hitbox shape config. */

export type WeaponId = 'sword' | 'hammer';

export interface WeaponData {
  id: WeaponId;
  displayName: string;
  /** attack table keys map to combatConfig tables */
  lightChain: ('1' | '2' | '3')[];
  hasHeavy: boolean;
  hitboxRadius: number;   // arc radius in meters
  hitboxOffset: number;   // forward offset from character center
  /** how easily it smashes breakables */
  breakPower: number;
  colorBody: number;
  colorGrip: number;
}

export const WEAPONS: Record<WeaponId, WeaponData> = {
  sword: {
    id: 'sword',
    displayName: 'SWORD',
    lightChain: ['1', '2', '3'],
    hasHeavy: true,
    hitboxRadius: 2.05,
    hitboxOffset: 0.85,
    breakPower: 1.0,
    colorBody: 0xcfd6de,
    colorGrip: 0x7d5230,
  },
  hammer: {
    id: 'hammer',
    displayName: 'HAMMER',
    lightChain: ['1', '2', '3'],
    hasHeavy: true,
    hitboxRadius: 2.45,
    hitboxOffset: 0.75,
    breakPower: 2.4,
    colorBody: 0x8f9aa8,
    colorGrip: 0x5c3a1e,
  },
};
