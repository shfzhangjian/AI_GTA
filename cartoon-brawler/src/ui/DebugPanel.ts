/** DebugPanel: F3 panel — toggles collider/hitbox/AI viz, live stats. */
import type { PhysicsDebug } from '../physics/PhysicsDebug';
import { HitBox } from '../combat/HitBox';
import type { Enemy } from '../enemy/EnemyEntity';

export interface DebugStats {
  fps: number;
  drawCalls: number;
  rigidBodies: number;
  debris: number;
  enemies: number;
}

export class DebugPanel {
  visible = false;
  showAIState = false;
  showSlots = false;
  showScores = false;
  godMode = false;

  private el = document.getElementById('debug-panel')!;
  private statsEl = document.getElementById('debug-stats')!;
  private frames = 0;
  private fpsTimer = 0;
  private fps = 0;

  constructor(private physicsDebug: PhysicsDebug) {
    window.addEventListener('keydown', (e) => {
      if (e.code === 'F3') { e.preventDefault(); this.toggle(); }
      if (e.code === 'F4') { e.preventDefault(); this.godMode = !this.godMode; }
    });
    const bind = (id: string, fn: (v: boolean) => void): void => {
      const box = document.getElementById(id) as HTMLInputElement | null;
      box?.addEventListener('change', () => fn(box.checked));
    };
    bind('dbg-collider', (v) => this.physicsDebug.setEnabled(v));
    bind('dbg-hitbox', (v) => { HitBox.debugShowHitBoxes = v; });
    bind('dbg-hurtbox', () => { /* hurtboxes visualized via colliders */ });
    bind('dbg-aistate', (v) => { this.showAIState = v; });
    bind('dbg-slots', (v) => { this.showSlots = v; });
    bind('dbg-score', (v) => { this.showScores = v; });
  }

  toggle(): void {
    this.visible = !this.visible;
    this.el.style.display = this.visible ? 'block' : 'none';
  }

  get aiLabelsVisible(): boolean { return this.showAIState || this.showScores; }

  update(dt: number, stats: () => DebugStats, enemies: Enemy[]): void {
    if (!this.visible) return;
    this.frames++;
    this.fpsTimer += dt;
    if (this.fpsTimer >= 0.5) {
      this.fps = Math.round(this.frames / this.fpsTimer);
      this.frames = 0;
      this.fpsTimer = 0;
      const s = stats();
      const enemyLines = this.showScores
        ? '\n' + enemies.slice(0, 8).map((e) => `${e.id}:${e.fsm.stateName} ${Object.entries(e.lastScores ?? {}).map(([k, v]) => `${k[0]}${v.toFixed(2)}`).join(' ')}`).join('\n')
        : '';
      this.statsEl.textContent =
        `FPS ${this.fps} | draws ${s.drawCalls}\nbodies ${s.rigidBodies} (cap 100) | debris ${s.debris} (cap 50)\nenemies alive ${s.enemies}${enemyLines}`;
    }
  }
}
