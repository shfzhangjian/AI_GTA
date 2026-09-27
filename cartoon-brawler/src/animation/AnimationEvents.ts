/**
 * AnimationEvents: Three.js has no Animator events, so we drive gameplay from
 * normalized-time event tracks attached to logical animation names.
 *
 * Example (Attack1): 0.00 AttackStart | 0.18 HitBoxEnable | 0.32 HitBoxDisable
 *                    0.35 ComboWindowOpen | 0.52 ComboWindowClose | 0.65 AttackEnd
 */

export type AnimEventName =
  | 'AttackStart'
  | 'HitBoxEnable'
  | 'HitBoxDisable'
  | 'ComboWindowOpen'
  | 'ComboWindowClose'
  | 'AttackEnd'
  | 'DodgeStart'
  | 'DodgeImpulse'
  | 'InvincibleOn'
  | 'InvincibleOff'
  | 'DodgeEnd'
  | 'LandImpact'
  | 'DeathApply';

export interface AnimEvent {
  name: AnimEventName;
  /** normalized time [0..1] */
  t: number;
}

export type AnimationEventTrack = AnimEvent[];

const TRACKS = new Map<string, AnimationEventTrack>();

export function defineTrack(anim: string, events: AnimationEventTrack): void {
  TRACKS.set(anim, [...events].sort((a, b) => a.t - b.t));
}

export function getTrack(anim: string): AnimationEventTrack | undefined {
  return TRACKS.get(anim);
}

/** Fires events between prevT and t (exclusive-inclusive), wrapping handled by caller. */
export class EventCursor {
  private index = 0;

  reset(): void {
    this.index = 0;
  }

  /** Advance to normalized time `t` (monotonic within one playback). Returns fired events. */
  advance(track: AnimationEventTrack, t: number): AnimEventName[] {
    const fired: AnimEventName[] = [];
    while (this.index < track.length && track[this.index].t <= t) {
      fired.push(track[this.index].name);
      this.index++;
    }
    return fired;
  }

  /** For looping clips: handle wrap by resetting index when t jumps backwards. */
  notifyLoop(t: number): void {
    if (t < 0.02) this.index = 0;
  }
}

// ---------- default tracks ----------
defineTrack('Attack1', [
  { name: 'AttackStart', t: 0 },
  { name: 'HitBoxEnable', t: 0.34 },
  { name: 'HitBoxDisable', t: 0.62 },
  { name: 'ComboWindowOpen', t: 0.5 },
  { name: 'ComboWindowClose', t: 0.985 },
  { name: 'AttackEnd', t: 1 },
]);
defineTrack('Attack2', [
  { name: 'AttackStart', t: 0 },
  { name: 'HitBoxEnable', t: 0.32 },
  { name: 'HitBoxDisable', t: 0.6 },
  { name: 'ComboWindowOpen', t: 0.48 },
  { name: 'ComboWindowClose', t: 0.985 },
  { name: 'AttackEnd', t: 1 },
]);
defineTrack('Attack3', [
  { name: 'AttackStart', t: 0 },
  { name: 'HitBoxEnable', t: 0.36 },
  { name: 'HitBoxDisable', t: 0.68 },
  { name: 'AttackEnd', t: 1 },
]);
defineTrack('HeavyAttack', [
  { name: 'AttackStart', t: 0 },
  { name: 'HitBoxEnable', t: 0.42 },
  { name: 'HitBoxDisable', t: 0.72 },
  { name: 'AttackEnd', t: 1 },
]);
defineTrack('Dodge', [
  { name: 'DodgeStart', t: 0 },
  { name: 'InvincibleOn', t: 0.2 },   // 0.1s of 0.5s
  { name: 'DodgeImpulse', t: 0.2 },
  { name: 'InvincibleOff', t: 0.64 }, // 0.32s of 0.5s
  { name: 'DodgeEnd', t: 1 },
]);
defineTrack('Hit', [{ name: 'AttackEnd', t: 1 }]);
defineTrack('Knockback', [{ name: 'AttackEnd', t: 1 }]);
defineTrack('Knockdown', [{ name: 'LandImpact', t: 0.98 }, { name: 'AttackEnd', t: 1 }]);
defineTrack('Death', [{ name: 'DeathApply', t: 0.9 }]);
defineTrack('BossWindup', [{ name: 'HitBoxEnable', t: 0.55 }, { name: 'HitBoxDisable', t: 0.8 }, { name: 'AttackEnd', t: 1 }]);
