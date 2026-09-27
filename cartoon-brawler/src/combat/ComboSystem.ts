/** ComboSystem: player hit-chain counter + UI events. */
import { COMBO_CONFIG } from '../config/combatConfig';
import type { EventBus } from '../core/EventBus';

export class ComboSystem {
  count = 0;
  private timer = 0;

  constructor(private bus: EventBus) {}

  registerHit(): void {
    this.count++;
    this.timer = COMBO_CONFIG.comboResetTime;
    this.bus.emit('combo:changed', { count: Math.min(this.count, COMBO_CONFIG.maxComboDisplay) });
  }

  update(dt: number): void {
    if (this.count === 0) return;
    this.timer -= dt;
    if (this.timer <= 0) this.reset();
  }

  reset(): void {
    if (this.count > 0) {
      this.count = 0;
      this.bus.emit('combo:changed', { count: 0 });
    }
  }
}
