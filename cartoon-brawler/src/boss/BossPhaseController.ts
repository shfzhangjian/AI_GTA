/** BossPhaseController: phase transitions + weighted-random skill selection. */
import { BOSS_CONFIG, PHASE_WEIGHTS, BOSS_SKILLS, type BossSkill, type BossSkillId } from './BossAI';

export class BossPhaseController {
  phase: 1 | 2 | 3 = 1;
  private lastSkill: BossSkillId | null = null;
  private recentSkills: BossSkillId[] = [];

  /** returns new phase if it changed */
  checkPhase(healthFrac: number): 1 | 2 | 3 | null {
    const [t2, t3] = BOSS_CONFIG.phaseThresholds;
    let want: 1 | 2 | 3 = 1;
    if (healthFrac <= t3) want = 3;
    else if (healthFrac <= t2) want = 2;
    if (want !== this.phase) {
      this.phase = want;
      return want;
    }
    return null;
  }

  /** Weighted random with anti-repeat: never same skill twice in a row, dampen last-2. */
  chooseSkill(): BossSkill {
    const weights = PHASE_WEIGHTS[this.phase];
    const ids = Object.keys(weights) as BossSkillId[];
    let total = 0;
    const adjusted: number[] = [];
    for (const id of ids) {
      let w = weights[id] ?? 0;
      if (id === this.lastSkill) w *= 0.15;
      else if (this.recentSkills.includes(id)) w *= 0.5;
      adjusted.push(w);
      total += w;
    }
    let r = Math.random() * total;
    let chosen: BossSkillId = ids[0];
    for (let i = 0; i < ids.length; i++) {
      r -= adjusted[i];
      if (r <= 0) { chosen = ids[i]; break; }
    }
    this.lastSkill = chosen;
    this.recentSkills.push(chosen);
    if (this.recentSkills.length > 2) this.recentSkills.shift();
    return BOSS_SKILLS[chosen];
  }

  speedMultiplier(): number {
    return this.phase === 3 ? BOSS_CONFIG.phase3SpeedMul : 1;
  }
}
