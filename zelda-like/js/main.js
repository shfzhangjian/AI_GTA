// 游戏入口
import { Game } from './core/Game.js';
import { WEAPONS } from './player/Weapons.js';
// ---- 全局错误捕获：崩溃时显示红色错误覆盖层，便于定位卡死 ----
window.addEventListener('error', e => {
  const msg = (e.message || 'unknown') + '\n' + (e.filename || '') + ':' + (e.lineno || '');
  console.error('[game error]', msg, e.error);
  let ov = document.getElementById('crash-overlay');
  if (!ov) {
    ov = document.createElement('div');
    ov.id = 'crash-overlay';
    ov.style.cssText = 'position:fixed;top:0;left:0;right:0;background:rgba(180,20,20,.92);color:#fff;font:13px/1.6 ui-monospace,monospace;padding:12px 16px;z-index:999;white-space:pre-wrap;';
    document.body.appendChild(ov);
  }
  ov.textContent = '❌ ' + msg + '\n' + (e.error && e.error.stack ? String(e.error.stack).split('\n').slice(0,8).join('\n') : '');
});
window.addEventListener('unhandledrejection', e => {
  console.error('[promise error]', e.reason);
});

const WEAPONS_REF = WEAPONS;

const game = new Game(document.getElementById('app'));

// 小地图（树木静态，缓存一次；实体每帧重绘）
const mm = document.getElementById('minimap');
const mctx = mm.getContext('2d');
mm.width = 180; mm.height = 180;
let treeLayer = null; // 离屏缓存

function drawMinimap() {
  const R = game.world.BOUNDS + 2;
  const s = 180 / (R * 2);
  const toM = (v) => (v + R) * s;

  if (!treeLayer) {
    treeLayer = document.createElement('canvas');
    treeLayer.width = 180; treeLayer.height = 180;
    const tc = treeLayer.getContext('2d');
    tc.fillStyle = 'rgba(60,120,50,0.5)';
    tc.fillRect(0, 0, 180, 180);
    tc.fillStyle = '#2d6a35';
    for (const t of game.world.trees) {
      tc.beginPath();
      tc.arc(toM(t.position.x), toM(t.position.z), 1.5, 0, Math.PI * 2);
      tc.fill();
    }
  }
  mctx.clearRect(0, 0, 180, 180);
  mctx.drawImage(treeLayer, 0, 0);

  const dot = (x, z, color, r = 2) => {
    mctx.fillStyle = color;
    mctx.beginPath();
    mctx.arc(toM(x), toM(z), r, 0, Math.PI * 2);
    mctx.fill();
  };
  for (const f of game.world.campfires) dot(f.position.x, f.position.z, f.userData.lit ? '#ff8830' : '#888', 3);
  for (const f of game.world.fruits) dot(f.position.x, f.position.z, '#ff5566', 2);
  for (const d of game.world.drops) dot(d.position.x, d.position.z, '#ffd75a', 2.5);
  for (const m of game.monsters.list) if (!m.dead) dot(m.mesh.position.x, m.mesh.position.z, '#ff3333', 3);
  const p = game.player.mesh.position;
  dot(p.x, p.z, '#fff', 4);

  requestAnimationFrame(drawMinimap);
}
drawMinimap();

// 开始按钮
const overlay = document.getElementById('overlay');
const btn = document.getElementById('overlay-btn');

// ---- 鼠标瞄准光标：隐藏系统光标，游戏内画十字准星 ----
function setAimCursor(on) {
  document.body.style.cursor = on ? 'none' : '';
  let c = document.getElementById('aim-crosshair');
  if (!c) {
    c = document.createElement('div');
    c.id = 'aim-crosshair';
    c.style.cssText = 'position:fixed;width:26px;height:26px;pointer-events:none;z-index:40;display:none;' +
      'transform:translate(-50%,-50%);';
    c.innerHTML = '<svg width="26" height="26" viewBox="0 0 26 26">' +
      '<circle cx="13" cy="13" r="9" fill="none" stroke="rgba(255,255,255,.85)" stroke-width="2"/>' +
      '<line x1="13" y1="0" x2="13" y2="7" stroke="rgba(255,255,255,.85)" stroke-width="2"/>' +
      '<line x1="13" y1="19" x2="13" y2="26" stroke="rgba(255,255,255,.85)" stroke-width="2"/>' +
      '<line x1="0" y1="13" x2="7" y2="13" stroke="rgba(255,255,255,.85)" stroke-width="2"/>' +
      '<line x1="19" y1="13" x2="26" y2="13" stroke="rgba(255,255,255,.85)" stroke-width="2"/>' +
      '<circle cx="13" cy="13" r="1.5" fill="#ffd75a"/></svg>';
    document.body.appendChild(c);
  }
  c.style.display = on ? 'block' : 'none';
}
window.__setAimCursor = setAimCursor;
window.addEventListener('mousemove', e => {
  const c = document.getElementById('aim-crosshair');
  if (c && c.style.display === 'block') { c.style.left = e.clientX + 'px'; c.style.top = e.clientY + 'px'; }
});

btn.addEventListener('click', () => {
  overlay.classList.add('hidden');
  setAimCursor(true);
  game.start();
  game.elapsed0 = performance.now();
});

// 记录存活时间
setInterval(() => {
  if (game.running && game.elapsed0) {
    game.elapsed = (performance.now() - game.elapsed0) / 1000;
  }
}, 1000);

// HUD 击杀/分数显示在武器面板
setInterval(() => {
  const el = document.getElementById('weapon-panel');
  if (el) {
    el.querySelector('h3').innerHTML = `武器 (1-4切换 | J/左键攻击 | K/右键射击) <br>
      <span style="font-size:12px;opacity:.8">击杀 ${game.monsters.kills} | 分数 ${game.monsters.score}</span>`;
  }
}, 500);

// ---- 调试窗口 (L 键或 F3 切换) ----
const debugEl = document.getElementById('debug');
window.addEventListener('keydown', e => {
  if (e.code === 'F3' || e.code === 'KeyL') {
    e.preventDefault();
    debugEl.classList.toggle('hidden');
    game._debugOn = !debugEl.classList.contains('hidden');
  }
});
game._debugOn = false;

setInterval(() => {
  if (!game._debugOn || !game.running) return;
  const p = game.player;
  const k = p.input;
  const W = WEAPONS_REF[p.current];
  const pos = p.mesh.position;
  // 收集攻击范围内的目标
  let inRange = [], outOfRange = [];
  const consider = (t, label) => {
    if (!p._targetAlive(t)) return;
    const tp = t.isMonster ? t.mesh.position : t.position;
    const d = tp.distanceTo(pos);
    const hasHurt = t.isMonster ? !!t._hasHurt : !!t.userData._hasHurt;
    const R = W.range * (hasHurt ? 1.0 : 1.35) + 0.5;
    const ang = p.facing.angleTo(tp.clone().sub(pos).normalize());
    // 与 collectAttackTargets 相同判定：距离够 + 扇面 ±90°（全向武器/贴脸不限角）
    const ok = d <= R && (W.omnidirectional || ang <= Math.PI / 2 || d < 0.5);
    const inFront = ang < Math.PI / 2;
    (ok ? inRange : outOfRange).push(
      `${label} d=${d.toFixed(1)}/R=${R.toFixed(1)} a=${(ang * 57.3).toFixed(0)}°${inFront ? '' : '(out)'} hp=${t.isMonster ? t.hp : t.userData.hp}`
    );
  };
  for (const m of game.monsters.list) consider(m, m.type);
  for (const s of game.world.sheep) consider(s, 'sheep');

  const lines = [
    `— 调试 (L/F3 关闭) —`,
    (() => { const a = p.getAimPoint(); return a ? `瞄准点 x=${a.x.toFixed(1)} z=${a.z.toFixed(1)}` : '瞄准点: 无(未移动鼠标)'; })(),
    `面朝 ${p.facing.x.toFixed(2)},${p.facing.z.toFixed(2)}`,
    `武器: ${W.name} (${W.type})  冷却: ${p.coolTimer.toFixed(2)}/${W.cooldown}`,
    `左键: ${k.mouseLeft ? '按住' : '-'}  右键: ${k.mouseRight ? '按住' : '-'}  J: ${k.key('KeyJ') ? '按住' : '-'}  K: ${k.key('KeyK') ? '按住' : '-'}`,
    `方向: ${p.facing.x.toFixed(2)},${p.facing.z.toFixed(2)}  位置: ${pos.x.toFixed(1)},${pos.z.toFixed(1)}`,
    `锁定: ${p.target ? `${p.target.isMonster ? p.target.type : 'sheep'} (${p._lockT.toFixed(1)}s)` : '无'}  挥击: ${p._dbgSwings || 0} 次`,
    `怪物: ${game.monsters.list.filter(m => !m.dead).length}  羊: ${game.world.sheep.length}  投射物: ${game.world.projectiles.length}`,
    `攻击范围内: ${inRange.length}`,
    ...inRange.slice(0, 4).map(s => '  ✓ ' + s),
    ...(inRange.length > 4 ? [`  ... +${inRange.length - 4}`] : []),
    `范围外(最近): `,
    ...outOfRange.slice(0, 3).map(s => '  ✗ ' + s),
  ];
  debugEl.textContent = lines.join('\n');
}, 100);
