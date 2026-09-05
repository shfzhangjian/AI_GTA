/**
 * PlayerHealth —— 第一人称玩家生命系统。
 *
 * - 每次被警察子弹命中扣 20（5 枪阵亡），火箭近爆同样按一次中弹结算。
 * - 受伤瞬间全屏红色晕影脉冲 + 低频耳鸣；低血量时保留搏动性淡红底晕。
 * - 左下角血条实时更新；阵亡显示死亡提示，短暂延迟后回调 onDeath（退出第一人称）。
 */
export class PlayerHealth {
  /**
   * @param {{sfx, hud:{vignette:HTMLElement, bar:HTMLElement, fill:HTMLElement, deathMsg:HTMLElement}, onDeath:()=>void}} opts
   */
  constructor({ sfx, hud, onDeath }) {
    this.sfx = sfx;
    this.hud = hud;
    this.onDeath = onDeath;
    this.max = 100;
    this.reset();
  }

  reset() {
    this.hp = this.max;
    this.dead = false;
    this.iframeT = 0;   // 受击无敌帧，防连发瞬间清空
    this.pulseT = 0;    // 红晕脉冲剩余
    this.deathT = -1;   // >=0：死亡谢幕倒计时
    this._pct = -1;
  }

  takeHit(dmg = 20) {
    if (this.dead || this.iframeT > 0) return false;
    this.hp = Math.max(0, this.hp - dmg);
    this.iframeT = 0.45;
    this.pulseT = 1.1;
    this.sfx.playerHit();
    if (this.hp <= 0) {
      this.dead = true;
      this.deathT = 1.6;
      this.hud.deathMsg.classList.remove('hidden');
    }
    return true;
  }

  /** @param {boolean} active 是否处于第一人称 */
  update(dt, active) {
    this.hud.bar.classList.toggle('hidden', !active || this.dead);
    if (!active) {
      this.hud.vignette.style.opacity = '0';
      return;
    }

    if (this.iframeT > 0) this.iframeT -= dt;

    // 红晕：受伤脉冲 + 低血量搏动底晕
    if (this.pulseT > 0) this.pulseT -= dt;
    const pulse = Math.max(0, this.pulseT / 1.1) * 0.9;
    const low = this.hp <= 40 && !this.dead
      ? 0.22 + Math.sin(performance.now() / (this.hp <= 20 ? 230 : 420)) * 0.1
      : 0;
    this.hud.vignette.style.opacity = String(Math.min(1, pulse + low));

    // 血条（仅在变化时写 DOM）
    const pct = Math.round((this.hp / this.max) * 100);
    if (pct !== this._pct) {
      this._pct = pct;
      this.hud.fill.style.width = `${pct}%`;
      this.hud.fill.style.background = pct > 60
        ? 'linear-gradient(90deg,#35d07f,#28a765)'
        : pct > 30 ? 'linear-gradient(90deg,#f4a127,#d97c06)' : 'linear-gradient(90deg,#ff5b4d,#d92b1c)';
    }

    // 死亡谢幕 → 退出第一人称
    if (this.deathT >= 0) {
      this.deathT -= dt;
      this.hud.vignette.style.opacity = '1';
      if (this.deathT < 0) {
        this.hud.deathMsg.classList.add('hidden');
        this.onDeath();
      }
    }
  }
}
