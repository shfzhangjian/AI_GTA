/** CharacterStats: data-driven combat stats shared by player/enemies/boss. */

export interface CharacterStats {
  maxHealth: number;
  /** 0..1 knockback resistance */
  knockResistance: number;
  mass: number;
  canBeLaunched: boolean;
  isBossOrHeavy: boolean;
  moveSpeed: number;
  damageMultiplier: number;
}

export const DEFAULT_STATS: CharacterStats = {
  maxHealth: 40,
  knockResistance: 0,
  mass: 75,
  canBeLaunched: true,
  isBossOrHeavy: false,
  moveSpeed: 4.2,
  damageMultiplier: 1,
};

export class Health {
  current: number;
  readonly max: number;
  private dead = false;

  constructor(max: number) {
    this.max = max;
    this.current = max;
  }

  get isDead(): boolean {
    return this.dead;
  }

  damage(amount: number): boolean {
    if (this.dead) return false;
    this.current = Math.max(0, this.current - amount);
    if (this.current <= 0) {
      this.dead = true;
      return true; // died now
    }
    return false;
  }

  get fraction(): number {
    return this.current / this.max;
  }

  reset(): void {
    this.current = this.max;
    this.dead = false;
  }
}
