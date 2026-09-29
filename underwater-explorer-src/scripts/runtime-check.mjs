#!/usr/bin/env node
/**
 * runtime-check.mjs — 无头运行时验证 v2（CDP 实时驱动，不依赖截图）
 * 用法：node scripts/runtime-check.mjs [dist|dev]
 *   - 启动目标页（不带任何 demo 自驱动参数），CDP 注入真实 keydown/keyup
 *   - 轮询 __UE_DEBUG__ 断言：四方向位移、朝向翻转、swim/idle、边界、0 JS 错误
 */
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as sleep } from 'node:timers/promises';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const mode = process.argv[2] === 'dev' ? 'dev' : 'dist';
const PORT = 9444;
let server = null;

// 静态服务 dist
if (mode === 'dist') {
  const distDir = join(ROOT, 'dist');
  if (!existsSync(join(distDir, 'index.html'))) {
    console.error('runtime-check: dist missing; run vite build first');
    process.exit(2);
  }
  server = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: distDir, stdio: 'ignore' });
  await sleep(1000);
}
const BASE = mode === 'dist' ? `http://127.0.0.1:${PORT}/` : 'http://127.0.0.1:5175/';
const PAGE = 'http://127.0.0.1:9333'; // chrome debug port 固定

// ── CDP 连接 ──
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
  '--headless=new', '--remote-debugging-port=9333',
  '--use-angle=swiftshader-webgl', '--use-gl=angle', '--enable-unsafe-swiftshader',
  '--no-first-run', '--window-size=1280,720', 'about:blank',
], { stdio: ['ignore', 'ignore', 'pipe'] });

async function getWs() {
  for (let i = 0; i < 40; i++) {
    try {
      const j = await (await fetch('http://127.0.0.1:9333/json/version')).json();
      if (j.webSocketDebuggerUrl) return j.webSocketDebuggerUrl.replace(/\/$/, '');
    } catch { /* retry */ }
    await sleep(250);
  }
  throw new Error('chrome devtools not reachable');
}
void PAGE;

const browserWsUrl = await getWs();
const bws = new WebSocket(browserWsUrl);
await new Promise((r) => bws.addEventListener('open', r));

let id = 0;
const waiters = new Map();
const consoleErrors = [];
bws.addEventListener('message', (e) => {
  const m = JSON.parse(e.data);
  if (m.id != null && waiters.has(m.id)) { waiters.get(m.id)(m); waiters.delete(m.id); }
  if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') {
    consoleErrors.push(JSON.stringify(m.params.args).slice(0, 200));
  }
  if (m.method === 'Runtime.exceptionThrown') {
    consoleErrors.push('exception: ' + JSON.stringify(m.params).slice(0, 200));
  }
});
const send = (method, params = {}) => new Promise((res) => {
  const i = ++id; waiters.set(i, res); bws.send(JSON.stringify({ id: i, method, params }));
});

// 新页面 target
const t = await send('Target.createTarget', { url: BASE + (mode === 'dist' ? 'index.html?devdt=0.03&test=1' : '?test=1') });
const targetId = t.result.targetId;
const pageWs = await (await fetch(`http://127.0.0.1:9333/json`)).json().then((l) => l.find((p) => p.id === targetId)?.webSocketDebuggerUrl);
const ws = new WebSocket(pageWs);
await new Promise((r) => ws.addEventListener('open', r));

const pwaiters = new Map();
const perrors = consoleErrors;
ws.addEventListener('message', (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id != null && pwaiters.has(m.id)) { pwaiters.get(m.id)(m); pwaiters.delete(m.id); }
  if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') perrors.push(JSON.stringify(m.params.args).slice(0, 200));
  if (m.method === 'Runtime.exceptionThrown') perrors.push('exception:' + JSON.stringify(m.params.exceptionDetails?.text));
});
let pid = 0;
const p = (method, params = {}) => new Promise((res) => {
  const i = ++pid; pwaiters.set(i, res); ws.send(JSON.stringify({ id: i, method, params }));
});
await p('Runtime.enable');

const ev = async (expr) => {
  const r = await p('Runtime.evaluate', { expression: expr, returnByValue: true });
  if (r.error) throw new Error(r.error.message);
  return r.result?.result?.value;
};

// 等页面 boot
let booted = false;
for (let i = 0; i < 40 && !booted; i++) {
  booted = await ev(`!!(window.__UE_DEBUG__ && window.__UE_DEBUG__.diverClips >= 1)`);
  await sleep(300);
}

const pass = [];
const fail = [];
const note = (ok, msg) => (ok ? pass : fail).push(msg);

note(booted, 'boot: __UE_DEBUG__ 在线');
note(!(await ev(`window.__UE_DEBUG__.errors.length`)) > 0, 'boot: 无 reportError 记录');

const snap = async () => ev(`JSON.stringify({x:__UE_DEBUG__.diverX,y:__UE_DEBUG__.diverY,vx:__UE_DEBUG__.diverVx,vy:__UE_DEBUG__.diverVy,f:__UE_DEBUG__.diverFacing,a:__UE_DEBUG__.diverState,ticks:__UE_DEBUG__.tickCount})`).then((s) => { try { return JSON.parse(s); } catch { return null; } });

// 驱动：按下→轮询位置变化→松开
const key = (type, code) => p('Input.dispatchKeyEvent', {
  type, code, key: code === 'KeyD' ? 'd' : code === 'KeyA' ? 'a' : code === 'KeyW' ? 'w' : 's',
  windowsVirtualKeyCode: code === 'KeyD' ? 68 : code === 'KeyA' ? 65 : code === 'KeyW' ? 87 : 83,
});

async function drive(code, axis, expect) {
  await key('keyDown', code);
  const seen = [];
  for (let i = 0; i < 30; i++) { // 轮询最多 12s（CDP 往返慢时每样本间隔≈0.4s）
    await sleep(400);
    const s = await snap();
    if (s && typeof s.vx === 'number') seen.push(s);
    if (seen.length && expect(seen[seen.length - 1])) break;
  }
  await key('keyUp', code);
  return seen;
}

const s0 = await snap();
const right = await drive('KeyD', 'x', (s) => s.vx > 40);
const up = await drive('KeyW', 'y', (s) => s.vy > 25);
const left = await drive('KeyA', 'x', (s) => s.vx < -40);
const down = await drive('KeyS', 'y', (s) => s.vy < -20);

note(right.some((s) => s.vx > 40), `右移：vx 峰值 ${Math.max(...right.map((s) => s.vx))}`);
note(up.some((s) => s.vy > 40), `上移：vy 峰值 ${Math.max(...up.map((s) => s.vy))}`);
note(left.some((s) => s.vx < -40), `左移：vx 谷值 ${Math.min(...left.map((s) => s.vx))}`);
note(down.some((s) => s.vy < -20), `下移：vy 谷值 ${Math.min(...down.map((s) => s.vy))}`);
note(left[left.length - 1]?.f === -1, '朝向翻转（向左后 facing=-1）');
note(right.some((s) => s.a === 'swim') && (await snap()).a !== undefined, 'swim 动画状态出现');

// 松开后阻尼收敛（惯性：先维持再降）
const afterRelease = [];
for (let i = 0; i < 8; i++) { await sleep(150); afterRelease.push((await snap()).vx); }
note(Math.abs(afterRelease[afterRelease.length - 1]) < Math.abs(afterRelease[0] || 1) || Math.abs(afterRelease[0]) < 15, `松开后阻尼 vx ${afterRelease[0]}→${afterRelease[afterRelease.length - 1]}`);

// 惯性非零起步（不瞬移）：按下 D，读 tick 级 velSamples 渐变
await key('keyDown', 'KeyD');
await sleep(600);
await key('keyUp', 'KeyD');
await sleep(200);
const rampRaw = await ev(`window.__UE_DEBUG__.velSamples ? JSON.stringify(window.__UE_DEBUG__.velSamples) : '[]'`);
const ramp = JSON.parse(rampRaw).filter((_, i) => i % 2 === 0);
const rising = ramp.filter((v) => v > 1 && v < 245).length;
note(rising >= 2 && ramp.some((v) => v >= 150), `惯性起步：加速过渡样本 ${rising} 帧（0→${Math.max(...ramp, 0)}，非瞬移）`);

// three 打包检查（dist 模式）
const distJs = existsSync(join(ROOT, 'dist'))
  ? (await import('node:fs')).readdirSync(join(ROOT, 'dist', 'assets')).filter((f) => f.endsWith('.js'))
  : [];
if (mode === 'dist' && distJs.length) {
  const code = (await import('node:fs')).readFileSync(join(ROOT, 'dist', 'assets', distJs[0]), 'utf8');
  note(!code.includes('WebGLRenderer:'), 'three 未打包进 dist（走 CDN）');
}

// 错误汇总
note(perrors.length === 0, `console 错误 ${perrors.length} 条${perrors.length ? '：' + perrors[0] : ''}`);

const s1 = await snap();
console.log(`state: start(${s0.x},${s0.y}) now(${s1.x},${s1.y}) ticks=${s1.ticks}`);
console.log(`\n=== runtime-check (${mode}) ===`);
for (const x of pass) console.log('  PASS ' + x);
for (const x of fail) console.log('  FAIL ' + x);
ws.close(); bws.close(); chrome.kill('SIGKILL'); if (server) server.kill();
if (fail.length) { console.log('RUNTIME CHECK: FAIL'); process.exit(1); }
console.log('RUNTIME CHECK: PASS');
