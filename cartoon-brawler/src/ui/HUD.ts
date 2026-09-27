/** HUD: player HP, weapon slots, combo counter, enemy count, wave banner. */
import type { EventBus } from '../core/EventBus';

export class HUD {
  private hpBar = mustGet<HTMLElement>('hp-bar');
  private comboWrap = mustGet<HTMLElement>('combo-wrap');
  private comboCount = mustGet<HTMLElement>('combo-count');
  private enemyCount = mustGet<HTMLElement>('enemy-count');
  private waveBanner = mustGet<HTMLElement>('wave-banner');
  private slotSword = mustGet<HTMLElement>('slot-sword');
  private slotHammer = mustGet<HTMLElement>('slot-hammer');
  private comboHideTimer = 0;
  private bannerTimer = 0;

  constructor(bus: EventBus) {
    bus.on('player:hit', (e) => {
      this.hpBar.style.width = `${(e.health / e.maxHealth) * 100}%`;
      this.hpBar.style.background = e.health / e.maxHealth < 0.3
        ? 'linear-gradient(90deg, #d84334, #ff7c5c)'
        : 'linear-gradient(90deg, #58d063, #8ee06a)';
    });
    bus.on('combo:changed', (e) => {
      if (e.count > 1) {
        this.comboCount.textContent = String(e.count);
        this.comboWrap.style.opacity = '1';
        this.comboHideTimer = 1.2;
      } else {
        this.comboWrap.style.opacity = '0';
      }
    });
    bus.on('weapon:changed', (e) => {
      this.slotSword.classList.toggle('active', e.weapon === 'sword');
      this.slotHammer.classList.toggle('active', e.weapon === 'hammer');
    });
    bus.on('wave:start', (e) => {
      this.waveBanner.textContent = e.label;
      this.waveBanner.style.opacity = '1';
      this.bannerTimer = 2.4;
    });
    this.slotSword.classList.add('active');
  }

  setEnemyCount(n: number): void {
    this.enemyCount.textContent = n > 0 ? `FOES ${n}` : '';
  }

  update(dt: number): void {
    if (this.comboHideTimer > 0) {
      this.comboHideTimer -= dt;
      if (this.comboHideTimer <= 0) this.comboWrap.style.opacity = '0';
    }
    if (this.bannerTimer > 0) {
      this.bannerTimer -= dt;
      if (this.bannerTimer <= 0) this.waveBanner.style.opacity = '0';
    }
  }

  reset(): void {
    this.hpBar.style.width = '100%';
    this.comboWrap.style.opacity = '0';
    this.enemyCount.textContent = '';
    this.slotSword.classList.add('active');
    this.slotHammer.classList.remove('active');
  }
}

function mustGet<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`HUD element #${id} missing`);
  return el as T;
}
