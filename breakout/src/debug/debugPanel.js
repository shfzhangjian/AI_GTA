/**
 * DebugPanel —— 调试模式（?debug=1 或 F2）。
 * 通过 bus.setRecorder 零侵入记录全部生命周期事件：加载 / 实体生成 / 损伤 /
 * 摧毁 / 碰撞 / 爆炸 / 积分 / 状态切换，并实时显示引擎运行指标。
 */
import { bus } from '../utils/eventBus.js';

const CATS = [
  ['load.', 'LOAD'], ['entity.', 'LIFE'], ['element.', 'LIFE'], ['word.', 'LIFE'],
  ['physics.', 'PHYS'], ['fx.', 'FX'], ['score.', 'SCORE'],
  ['game.', 'GAME'], ['powerup.', 'FX'], ['audio.', 'AUD'],
  ['input.', 'INPUT'], ['debug.', 'DEBUG'],
];

function catOf(evt) {
  for (const [prefix, cat] of CATS) if (evt.startsWith(prefix)) return cat;
  return 'DEBUG';
}

function shortPayload(p) {
  try {
    const s = JSON.stringify(p);
    return s === '{}' ? '' : (s.length > 84 ? s.slice(0, 84) + '…' : s);
  } catch { return ''; }
}

export function attachDebug(game) {
  const panel = document.createElement('div');
  panel.id = 'dbg-panel';
  panel.innerHTML = `
    <div class="dbg-head"><b>DEBUG</b><span>F2 开关 · 日志含历史</span></div>
    <div class="dbg-stats">…</div>
    <div class="dbg-log"></div>`;
  document.body.appendChild(panel);

  const statsEl = panel.querySelector('.dbg-stats');
  const logEl = panel.querySelector('.dbg-log');
  const t0 = performance.now();

  // 事件记录器（始终开启，日志上限 250 行滚动）
  bus.setRecorder((evt, payload) => {
    const row = document.createElement('div');
    row.className = `row cat-${catOf(evt)}`;
    const t = ((performance.now() - t0) / 1000).toFixed(2);
    row.textContent = `[${t}s] ${catOf(evt)} ${evt} ${shortPayload(payload)}`;
    logEl.appendChild(row);
    while (logEl.children.length > 250) logEl.firstChild.remove();
    logEl.scrollTop = logEl.scrollHeight;
  });

  // 实时指标
  setInterval(() => {
    const s = game.debugStats();
    statsEl.textContent =
      `FPS ${s.fps} · ${s.state}\n` +
      `关卡 ${s.level} · 元素 ${s.elements}\n` +
      `球×${s.balls} ${s.ball}\n` +
      `粒子 ${s.particles} · 待爆 ${s.pending} · 弹 ${s.bullets} · 掉落 ${s.powerups}\n` +
      `火球 ${s.fire}s · 加长 ${s.wide}s · 缩短 ${s.narrow}s\n` +
      `连击 ×${s.combo} 倍率 ×${s.mult} · 分 ${s.score} · 命 ${s.lives}`;
  }, 300);

  const sync = on => panel.classList.toggle('open', on);
  sync(game.debug);
  bus.on('debug.toggle', ({ on }) => sync(on));
}
