/** 调试 HUD（HTML 层，阶段 7 验证用；正式 UI 阶段 17 替换） */
import { windowDebug } from '../core/debug';

export function createDebugHud(): void {
  const el = document.createElement('div');
  el.id = 'debug-hud';
  el.innerHTML = `
    <div class="hud-card">
      <div class="hud-row">
        <span class="hud-label">氧气</span>
        <span class="hud-bar hud-oxygen"><i></i></span>
        <span class="hud-value" data-kind="oxygen">100</span>
      </div>
      <div class="hud-row">
        <span class="hud-label">生命</span>
        <span class="hud-bar hud-health"><i></i></span>
        <span class="hud-value" data-kind="health">100</span>
      </div>
      <div class="hud-status"></div>
      <div class="hud-debug"></div>
    </div>
  `;
  document.body.appendChild(el);
  const oxygenFill = el.querySelector('.hud-oxygen i') as HTMLElement;
  const healthFill = el.querySelector('.hud-health i') as HTMLElement;
  const oxygenValue = el.querySelector('[data-kind="oxygen"]') as HTMLElement;
  const healthValue = el.querySelector('[data-kind="health"]') as HTMLElement;
  const status = el.querySelector('.hud-status') as HTMLElement;
  const debug = el.querySelector('.hud-debug') as HTMLElement;

  let acc = 0;
  function tick(dt: number): void {
    acc += dt;
    if (acc < 0.12) return;
    acc = 0;
    const d = windowDebug();
    const oxygen = Math.max(0, Math.min(100, d.diverOxygen));
    const health = Math.max(0, Math.min(100, d.diverHealth));
    oxygenFill.style.width = `${oxygen}%`;
    healthFill.style.width = `${health}%`;
    oxygenValue.textContent = `${Math.round(oxygen)}`;
    healthValue.textContent = `${Math.round(health)}`;
    el.classList.toggle('is-low-oxygen', oxygen < 26 && !d.diverBreathing);
    el.classList.toggle('is-hurt', health < 45 || d.fishThreats > 0);
    if (health <= 0) {
      status.textContent = '危险：生命耗尽';
    } else if (oxygen <= 0) {
      status.textContent = '缺氧受伤，快浮出水面';
    } else if (d.diverBreathing) {
      status.textContent = '正在换气';
    } else if (d.fishThreats > 0) {
      status.textContent = `危险鱼靠近 x${d.fishThreats}`;
    } else {
      status.textContent = '潜水中';
    }
    debug.textContent =
      `[阶段7 调试] fps ${d.fps} · 深度 ${d.depthMeters.toFixed(1)}m · 鱼 ${d.fishAlive} · ` +
      `攻击 ${d.fishAttacks} · 鱼叉 ${d.harpoonActive} · 命中 ${d.harpoonHits} · drawCalls ${d.drawCalls}` +
      (d.errors.length ? ` · ERRORS ${d.errors.length}` : '');
  }
  (window as unknown as { __UE_HUD_TICK__: (dt: number) => void }).__UE_HUD_TICK__ = tick;
}
