/** GameOverUI: victory / game over overlays with restart. */
import type { EventBus } from '../core/EventBus';
import type { AudioManager } from '../audio/AudioManager';

export class GameOverUI {
  private victory = document.getElementById('victory-screen')!;
  private gameover = document.getElementById('gameover-screen')!;
  onRestart: (() => void) | null = null;

  constructor(bus: EventBus, audio: AudioManager) {
    bus.on('game:victory', () => {
      audio.play('victory');
      this.show(this.victory);
    });
    bus.on('game:over', () => {
      audio.play('lose');
      setTimeout(() => this.show(this.gameover), 900);
    });
    document.querySelectorAll('[data-restart]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.hideAll();
        this.onRestart?.();
      });
    });
  }

  private show(el: HTMLElement): void {
    el.style.display = 'flex';
  }

  hideAll(): void {
    this.victory.style.display = 'none';
    this.gameover.style.display = 'none';
  }
}
