/**
 * 引导入口。URL 加 ?debug=1 可直接以调试模式打开；运行中按 F2 随时切换。
 */
import { Game } from './core/game.js';
import { attachDebug } from './debug/debugPanel.js';
import { bus } from './utils/eventBus.js';

const canvas = document.getElementById('game');
const errEl = document.getElementById('boot-error');

const debug = new URLSearchParams(location.search).has('debug');
const game = new Game(canvas, { debug });

attachDebug(game); // 事件记录器始终挂接：即使面板隐藏，F2 打开后也能看到此前日志

// 暴露到控制台，方便手动调试：__BREAKOUT__.game.debugKillAll() / debugNextLevel()
window.__BREAKOUT__ = { game, bus, version: '1.0.0' };

game.start().catch(err => {
  console.error(err);
  errEl.textContent = `启动失败：${err.message} —— 请通过本地服务器打开（双击 start.bat），浏览器不允许 file:// 加载 ES 模块。`;
});
