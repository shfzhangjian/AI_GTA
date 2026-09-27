/** DamageSystem: team model, damage application pipeline entry. */
import type { HitData } from './HitData';

export type Team = 'player' | 'enemy' | 'boss';
export type DamageCategory = 'light' | 'heavy' | 'finisher' | 'shockwave' | 'world';

export interface DamageReceiver {
  team: Team;
  /** returns actual damage dealt after armor/invuln */
  receiveDamage(hit: HitData): number;
}

/** True if two teams can damage each other. */
export function hostile(a: Team, b: Team): boolean {
  if (a === 'player') return b === 'enemy' || b === 'boss';
  return a === 'enemy' || a === 'boss' ? b === 'player' : false;
}
