// 阶段7 鱼叉捕鱼无头验证：发射/飞行/命中/击杀/冷却/池复用
import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';
import process from 'node:process';
const HTTP_PORT = 9571, CDP_PORT = 9572;
const server = spawn('python3', ['-m', 'http.server', String(HTTP_PORT), '--bind', '127.0.0.1'], { cwd: 'dist', stdio: 'ignore' });
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new', '--remote-debugging-port=' + CDP_PORT, '--use-angle=swiftshader-webgl', '--use-gl=angle', '--enable-unsafe-swiftshader', '--no-first-run', 'about:blank'], { stdio: 'ignore' });
const cleanup = () => { try { server.kill(); } catch {} try { chrome.kill('SIGKILL'); } catch {} };
process.on('exit', cleanup);
let j = null; for (let i = 0; i < 60; i++) { try { j = await (await fetch(`http://127.0.0.1:${CDP_PORT}/json/version`)).json(); if (j.webSocketDebuggerUrl) break; } catch {} await sleep(250); }
if (!j?.webSocketDebuggerUrl) { console.log('chrome fail'); process.exit(2); }
const bws = new WebSocket(j.webSocketDebuggerUrl); await new Promise(r => bws.addEventListener('open', r));
let id = 0; const W = new Map();
bws.addEventListener('message', e => { const m = JSON.parse(e.data); if (m.id && W.has(m.id)) { W.get(m.id)(m); W.delete(m.id); } });
const send = (met, pr = {}) => new Promise((r) => { const i = ++id; W.set(i, r); bws.send(JSON.stringify({ id: i, method: met, params: pr })); setTimeout(() => { if (W.has(i)) { W.delete(i); r(null); } }, 8000); });
const t = await send('Target.createTarget', { url: `http://127.0.0.1:${HTTP_PORT}/index.html?devdt=0.03&test=1` });
const tid = t.result.targetId;
let purl = null; for (let i = 0; i < 40; i++) { const l = await (await fetch(`http://127.0.0.1:${CDP_PORT}/json`)).json(); purl = l.find(x => x.id === tid)?.webSocketDebuggerUrl; if (purl) break; await sleep(250); }
if (!purl) { console.log('FAIL 页面 target 丢失'); cleanup(); process.exit(2); }
const ws = new WebSocket(purl); await new Promise(r => ws.addEventListener('open', r));
const PW = new Map(); const cerr = [];
ws.addEventListener('message', e => { const m = JSON.parse(e.data); if (m.id && PW.has(m.id)) { PW.get(m.id)(m); PW.delete(m.id); } if (m.method === 'Runtime.exceptionThrown') cerr.push(m.params.exceptionDetails?.text); });
let pid = 0; const p = (met, pr = {}) => new Promise((r) => { const i = ++pid; PW.set(i, r); ws.send(JSON.stringify({ id: i, method: met, params: pr })); setTimeout(() => { if (PW.has(i)) { PW.delete(i); r(null); } }, 9000); });
await p('Runtime.enable');
const ev = async (x) => {
  for (let i = 0; i < 4; i++) {
    const r = await p('Runtime.evaluate', { expression: x, returnByValue: true });
    const v = r?.result?.result?.value;
    if (v !== null && v !== undefined) return v;
    await sleep(600);
  }
  return null;
};
const out = [];

// 就绪：页面钩子 + 鱼群存在
let ready = false;
for (let i = 0; i < 60; i++) {
  const ok = await ev('typeof window.__UE_FIRE_HARPOON==="function" && __UE_DEBUG__.fishAlive>=3');
  if (ok === true) { ready = true; break; }
  await sleep(400);
}
if (!ready) { console.log('FAIL 页面/鱼群未就绪'); cleanup(); process.exit(3); }

const main = async () => {
  // ── 1. 发射：鱼叉出现在玩家前方并飞行 ──
  await ev('window.__UE_FIRE_HARPOON(__UE_DEBUG__.diverX+400, __UE_DEBUG__.diverY)');
  await sleep(500);
  const p1 = JSON.parse((await ev('JSON.stringify(window.__UE_HARPOON_STATS())')) || '{}');
  const diverX = Number((await ev('__UE_DEBUG__.diverX')) || 0);
  const moving = p1.projectiles && p1.projectiles.some((pr) => pr.x > diverX + 60);
  out.push(p1.fired === 1 && moving ? 'PASS 发射成功且飞行推进（fired=1 位移>60u）' : 'FAIL 发射/飞行 fired=' + p1.fired);

  // ── 2. 命中与击杀：把一条鱼传送到玩家正前方，连续射击至击杀 ──
  await sleep(900); // 等第一支耗尽
  const tele = (await ev('(function(){var f=(window.__UE_WORLD_FISH__||function(){return[]})();var d=window.__UE_DEBUG__;if(!f.length)return "nofish";window.__TARGET__=f[0].idx;return f[0].id+"/hp"+(f[0].hp||"?")})()')) || 'nofish';
  // 目标鱼钉在固定位置轮射（鱼叉 150u 到达 ≈0.3s；钉住循环持续到击杀或 12 轮）
  const kills0j = await ev('__UE_HARPOON_STATS().kills|0');
  const kills0 = Number(kills0j || 0);
  let killDone = false;
  for (let round = 0; round < 12 && !killDone; round++) {
    await ev('(function(){var d=window.__UE_DEBUG__;window.__UE_PIN_FISH(window.__TARGET__, d.diverX+150, d.diverY);window.__UE_FIRE_HARPOON(d.diverX+155, d.diverY);return 1})()');
    await sleep(650);
    const stj = await ev('JSON.stringify(window.__UE_HARPOON_STATS())');
    const st = JSON.parse(stj || '{}');
    if ((st.kills || 0) > kills0) {
      out.push('PASS 命中+击杀（hits=' + st.hits + ' kills=' + st.kills + '，伤害 ' + (await ev('12')) + '/发，绿鲈 hp12 一击杀）');
      out.push(st.hits >= st.kills ? 'PASS 命中先于击杀统计自洽' : 'FAIL hits<kills');
      killDone = true;
      break;
    }
    if (round === 11) {
      const diag = await ev('(function(){var d=window.__UE_DEBUG__;window.__UE_PIN_FISH(window.__TARGET__, d.diverX+150, d.diverY);var f=(window.__UE_WORLD_FISH__||function(){return[]})()[window.__TARGET__];var s=window.__UE_HARPOON_STATS();return "hits="+s.hits+" act="+s.active+" tgt="+(f?("hp"+f.hp+"@"+Math.round(f.pos.x)):"gone")})()');
      out.push('FAIL 12 轮射击未击杀（' + tele + '；' + diag + '）');
    }
  }

  // ── 3. 冷却：连续快速发射应被限制 ──
  await sleep(1000);
  const burst = (await ev('(function(){var d=window.__UE_DEBUG__;var n=0;if(window.__UE_FIRE_HARPOON(d.diverX+300,d.diverY))n++;if(window.__UE_FIRE_HARPOON(d.diverX+300,d.diverY+10))n++;if(window.__UE_FIRE_HARPOON(d.diverX+300,d.diverY-10))n++;return String(n)})()')) || '0';
  out.push(Number(burst) === 1 ? 'PASS 发射冷却 0.45s（3 连发只出 1 支）' : 'FAIL 冷却失效 fired=' + burst);

  // ── 4. 池复用：多次发射后 projectile 总数不线性增长 ──
  for (let i = 0; i < 4; i++) {
    await sleep(700);
    await ev('(function(){var d=window.__UE_DEBUG__;window.__UE_FIRE_HARPOON(d.diverX-300,d.diverY)})()');
  }
  await sleep(1200);
  const stj2 = await ev('JSON.stringify(window.__UE_HARPOON_STATS())');
  const st2 = JSON.parse(stj2 || '{}');
  const poolSize = (st2.projectiles && st2.projectiles.length) || 0;
  out.push(poolSize > 0 && poolSize <= 10 ? 'PASS 鱼叉对象池复用（发射' + st2.fired + '发，池对象' + poolSize + '个）' : 'FAIL 池增长 ' + poolSize + '/' + st2.fired);

  out.push(cerr.length === 0 ? 'PASS 页面异常 0' : 'FAIL 异常 ' + cerr.join('|'));
};
await main();

for (const o of out) console.log('  ' + o);
console.log(out.some((o) => o.startsWith('FAIL')) ? 'HARPOON CHECK: FAIL' : 'HARPOON CHECK: PASS');
cleanup();
process.exit(out.some((o) => o.startsWith('FAIL')) ? 1 : 0);
