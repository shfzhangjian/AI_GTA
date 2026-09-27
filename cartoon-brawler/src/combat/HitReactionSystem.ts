/**
 * HitReactionSystem: decides reaction type from hit data + target stats,
 * applies knockback/launch through physics, triggers hitstop & camera shake.
 */
import { KNOCKBACK_CONFIG } from '../config/combatConfig';
import type { HitData } from './HitData';
import type { Time } from '../core/Time';
import type { CameraShake } from '../camera/CameraShake';
import type { EventBus } from '../core/EventBus';
import type { ImpactKind } from '../core/EventBus';

export type ReactionType = 'hit' | 'knockback' | 'launch' | 'knockdown' | 'stagger' | 'none';

export interface ReactionTargetStats {
  /** 0..1, higher = shrugs off knockback (armored) */
  knockResistance: number;
  mass: number;
  canBeLaunched: boolean;
  isBossOrHeavy: boolean;
}

export class HitReactionSystem {
  constructor(private time: Time, private shake: CameraShake, private bus: EventBus) {}

  /** Decide + apply reaction. Returns chosen reaction so state machines can react. */
  resolve(hit: HitData, stats: ReactionTargetStats): ReactionType {
    // hitstop + shake scale with power, reduced by resistance for heavies
    const resist = stats.knockResistance;
    if (hit.hitStop > 0) this.time.hitStop(hit.hitStop);
    if (hit.cameraShake > 0) this.shake.shake(hit.cameraShake * (1 - resist * 0.5));

    const finalForce = hit.knockback * (1 - resist);
    let reaction: ReactionType = 'hit';

    if (hit.verticalForce > 0 && stats.canBeLaunched && !stats.isBossOrHeavy) {
      reaction = 'launch';
    } else if (finalForce > KNOCKBACK_CONFIG.minLaunchSpeedForAirborne * 0.8 && !stats.isBossOrHeavy) {
      reaction = 'knockback';
    } else if (stats.isBossOrHeavy && finalForce > 1) {
      reaction = 'stagger';
    }

    const kind: ImpactKind = hit.category === 'heavy' || hit.category === 'finisher' ? 'heavy' : 'hit';
    this.bus.emit('impact', {
      x: hit.impactPoint.x, y: hit.impactPoint.y, z: hit.impactPoint.z,
      power: hit.damage / 20 + hit.knockback * 0.1, kind,
    });

    return reaction;
  }
}
