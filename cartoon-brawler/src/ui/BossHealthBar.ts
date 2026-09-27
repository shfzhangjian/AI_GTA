/** BossHealthBar: appears when boss activates. */
import type { EventBus } from '../core/EventBus';

export class BossHealthBar {
  private wrap = document.getElementById('boss-bar-wrap')!;
  private bar = document.getElementById('boss-hp')!;
  private nameEl = document.getElementById('boss-name')!;

  constructor(bus: EventBus) {
    bus.on('boss:appeared', (e) => {
      this.nameEl.textContent = e.name;
      this.bar.style.width = '100%';
      this.wrap.style.opacity = '1';
    });
    bus.on('boss:hit', (e) => {
      this.bar.style.width = `${(e.health / e.maxHealth) * 100}%`;
    });
    bus.on('boss:died', () => {
      this.bar.style.width = '0%';
      setTimeout(() => { this.wrap.style.opacity = '0'; }, 900);
    });
  }

  reset(): void {
    this.wrap.style.opacity = '0';
  }
}
