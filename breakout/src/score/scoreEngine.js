import { SCORE_CFG } from '../config/constants.js';
import { bus } from '../utils/eventBus.js';

/**
 * ScoreEngine —— 积分算法
 *
 *   得分 = 元素基础分 × 速度加成 × 连击倍率
 *   速度加成   = 1 + 球速 / speedBonusK          （打得越快越值钱）
 *   连击倍率   = min(1 + (连击数-1) × comboStep, maxMult)
 *   连击窗口   = 最后一次破坏后 comboWindow 秒内再次破坏则连击 +1，超时清零
 */
export class ScoreEngine {
  constructor() { this.reset(); }

  reset() {
    this.score = 0;
    this.combo = 0;
    this.timer = 0;
  }

  get multiplier() {
    return Math.min(1 + Math.max(this.combo - 1, 0) * SCORE_CFG.comboStep, SCORE_CFG.maxMult);
  }

  /** 破坏一个元素时调用；返回本次结算明细 */
  hit(element, ballSpeed) {
    const base = element.def.score;
    const speedBonus = 1 + ballSpeed / SCORE_CFG.speedBonusK;
    this.combo = this.timer > 0 ? this.combo + 1 : 1;
    this.timer = SCORE_CFG.comboWindow;
    const mult = this.multiplier;
    const gain = Math.round(base * speedBonus * mult);
    this.score += gain;

    bus.emit('score.change', { gain, total: this.score, combo: this.combo, mult: +mult.toFixed(2) });
    return { gain, combo: this.combo, mult };
  }

  /** 未摧毁但受击：小额得分，维持连击窗口 */
  graze(element) {
    const gain = Math.max(1, Math.round(element.def.score * 0.1));
    this.score += gain;
    return gain;
  }

  /** 奖励分（单词整词摧毁等），不参与连击倍率 */
  bonus(n) {
    this.score += n;
    bus.emit('score.bonus', { gain: n, total: this.score });
  }

  update(dt) {
    if (this.timer > 0) {
      this.timer -= dt;
      if (this.timer <= 0 && this.combo > 0) {
        bus.emit('score.comboReset', { lostCombo: this.combo });
        this.combo = 0;
      }
    }
  }
}
