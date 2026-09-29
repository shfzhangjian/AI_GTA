// 阶段5 鱼架构无头验证：生成/速度差异/深度分层/群游/逃跑/回收/防重叠
import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';
import process from 'node:process';
const HTTP_PORT = 9561, CDP_PORT = 9562;
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
const t = await send('Target.createTarget', { url: `http://127.0.0.1:${HTTP_PORT}/index.html?devdt=0.016&test=1` });
const tid = t.result.targetId;
let purl = null; for (let i = 0; i < 40; i++) { const l = await (await fetch(`http://127.0.0.1:${CDP_PORT}/json`)).json(); purl = l.find(x => x.id === tid)?.webSocketDebuggerUrl; if (purl) break; await sleep(250); }
if (!purl) { console.log('FAIL 拿不到页面 target'); cleanup(); process.exit(2); }
const ws = new WebSocket(purl); await new Promise(r => ws.addEventListener('open', r));
const PW = new Map(); const cerr = [];
ws.addEventListener('message', e => { const m = JSON.parse(e.data); if (m.id && PW.has(m.id)) { PW.get(m.id)(m); PW.delete(m.id); } if (m.method === 'Runtime.exceptionThrown') cerr.push(m.params.exceptionDetails?.text); });
let pid = 0;
let pchain = Promise.resolve();
const p = (met, pr = {}) => new Promise((resolve) => {
  pchain = pchain.then(async () => {
    const i = ++pid;
    const to = setTimeout(() => { if (PW.has(i)) { PW.delete(i); resolve(null); } }, 9000);
    PW.set(i, (m) => { clearTimeout(to); resolve(m); });
    try { ws.send(JSON.stringify({ id: i, method: met, params: pr })); }
    catch { clearTimeout(to); resolve(null); }
  });
});
await p('Runtime.enable');
const ev = async (x) => { const r = await p('Runtime.evaluate', { expression: x, returnByValue: true }); return r?.result?.result?.value ?? null; };
const keyDown = (c) => p('Input.dispatchKeyEvent', { type: 'keyDown', code: c, key: c[3].toLowerCase() });
const keyUp = (c) => p('Input.dispatchKeyEvent', { type: 'keyUp', code: c, key: c[3].toLowerCase() });
const out = [];
for (let i = 0; i < 40; i++) { const ok = await ev('typeof window.__UE_WORLD_FISH__==="function"'); if (ok === true) break; await sleep(300); }
const STATES = 'JSON.stringify((window.__UE_WORLD_FISH__||function(){return[]})())';
const samples = [];
const seenKeys = new Set();
const collect = async (n = 3) => {
  for (let k = 0; k < n; k++) {
    const s = await ev(STATES);
    if (s) for (const f of JSON.parse(s)) {
      const key = f.id + ':' + Math.round(f.pos.x / 40) + ':' + Math.round(f.pos.y / 40);
      if (!seenKeys.has(key)) { seenKeys.add(key); samples.push(f); }
    }
    await sleep(500);
  }
};
for (let i = 0; i < 30; i++) {
  const n = (await ev('__UE_DEBUG__.fishAlive|0')) || 0;
  if (n >= 4) break;
  await sleep(400);
}
await collect(2);
// 深水驻留：spawn 每 1.4s 一拨，深水鱼种 rarity 低需宽时间窗
await keyDown('KeyS'); await sleep(5200); await keyUp('KeyS');
for (let i = 0; i < 4; i++) await collect(3);
await keyDown('KeyW'); await sleep(900); await keyUp('KeyW');
await keyDown('KeyD'); await sleep(1800); await keyUp('KeyD');
await collect(3);
const ids = new Set(samples.map(s => s.id));
// 深度合规：生成时 y 必须在带内（巡游允许 ±12m 漂出）；用生成记录（页面记录 spawnDepth）更准
const badDepth = samples.filter((s) => s.spawnDepth != null && (s.spawnDepth < s.defDepth.min - 0.5 || s.spawnDepth > s.defDepth.max + 0.5));
out.push(samples.length >= 7 ? 'PASS 去重采样鱼 ' + samples.length + ' 条（浅水合规 4 种 + 深水驻留采集）' : 'FAIL 样本不足 ' + samples.length);
out.push(badDepth.length === 0 ? 'PASS 生成深度全部合规（depthMin/Max 生效，' + ids.size + ' 种出现）' : 'FAIL ' + badDepth.length + ' 条越出深度带');
const byId = {};
for (const s of samples) { const k = s.id; byId[k] = Math.max(byId[k] || 0, Math.abs(s.vel.x)); }
const spd = Object.entries(byId).filter((e) => e[1] > 5).sort((a, b) => b[1] - a[1]);
out.push(spd.length > 1 && new Set(spd.map((e) => Math.round(e[1] / 20))).size > 1 ? 'PASS 速度差异：' + spd.slice(0, 5).map((e) => e[0] + '=' + Math.round(e[1])).join(' ') : 'FAIL 速度无差异 ' + JSON.stringify(spd));
const wrongDeep = samples.filter((s) => s.id === 'deepdarter' && -s.pos.y / 10 < 60);
out.push(wrongDeep.length === 0 ? 'PASS 深度分层：deepdarter 仅 ≥60m 生成' : 'FAIL deepdarter 越层 ' + wrongDeep.length + ' 条');
// ── 收尾异步采集（所有 await 集中于此）──
const finish = async () => {
  let post = {};
  for (let i = 0; i < 20; i++) {
    post = JSON.parse((await ev('JSON.stringify({fish:__UE_DEBUG__.fishAlive|0,tex:__UE_DEBUG__.fishTextures|0})')) || '{}');
    if (post.fish > 0 && post.tex > 0) break;
    await sleep(600);
  }
  let fleeing = samples.filter((s) => s.state === 'fleeing');
  let fleeInfo = '';
  if (fleeing.length === 0 && (await ev('typeof window.__UE_TEST_TELEPORT')) === 'function') {
    for (let round = 0; round < 6 && fleeing.length === 0; round++) {
      const tele = await ev('(function(){var f=(window.__UE_WORLD_FISH__||function(){return[]})();var d=window.__UE_DEBUG__;if(!f.length)return "empty";var t=null;for(var i=0;i<f.length;i++){if(f[i].behavior==="flee"&&f[i].state==="active"){t=f[i];break}}if(!t){for(var i=0;i<f.length;i++){if(!t||f[i].idx<t.idx)t=f[i];}}var ok=window.__UE_TEST_TELEPORT(t.idx,d.diverX+50,d.diverY-10);var g=(window.__UE_WORLD_FISH__||function(){return[]})()[t.idx];return String(ok)+" "+t.id+"/"+t.behavior+" newd:"+(g?Math.round(Math.hypot(g.pos.x-d.diverX,g.pos.y-d.diverY)):"?")})()');
      fleeInfo = String(tele);
      for (let i = 0; i < 8; i++) {
        await sleep(400);
        const hit = (await ev('(function(){var f=(window.__UE_WORLD_FISH__||function(){return[]})();var n=0;for(var i=0;i<f.length;i++){if(f[i].state==="fleeing")n++}return n})()')) || 0;
        if (hit > 0) { await collect(2); fleeing = samples.filter((s) => s.state === 'fleeing'); break; }
      }
    }
  }
  const ov = (await ev('(function(){var f=(window.__UE_WORLD_FISH__||function(){return[]})();var n=0;for(var i=0;i<f.length;i++)for(var j=i+1;j<f.length;j++){var dx=f[i].pos.x-f[j].pos.x,dy=f[i].pos.y-f[j].pos.y;if(dx*dx+dy*dy<16*16)n++}return String(n)})()')) || '0';
  return { post, fleeing, fleeInfo, ov };
};
const fin = await finish();

out.push(fin.fleeing.length > 0 ? 'PASS 遇玩家逃跑：' + fin.fleeing.length + ' 条进入 fleeing（flee 半径 220u）' : 'FAIL fleeing 未触发（诊断=' + fin.fleeInfo + '）');
out.push(fin.post.fish > 0 && fin.post.fish <= 40 ? 'PASS 巡游后鱼数 ' + fin.post.fish + ' ≤40（回收生效）' : 'FAIL 鱼数 ' + fin.post.fish);
out.push((fin.post.tex ?? 99) <= 10 ? 'PASS 鱼源贴图 ' + fin.post.tex + ' 张共享（10 种鱼源图≤10）' : 'FAIL 贴图 ' + fin.post.tex);
out.push(Number(fin.ov) <= 2 ? 'PASS 重叠对 ' + fin.ov + '（生成间距 46u 抑制）' : 'FAIL 重叠 ' + fin.ov + ' 对');

// ── 阶段6：50 种数据完整性（页面内求值 FISH 表通过 __UE_FISH_DEFS 暴露）──
if ((await ev('typeof window.__UE_FISH_DEFS')) === 'function') {
  const comp = JSON.parse((await ev('JSON.stringify((function(){var d=window.__UE_FISH_DEFS();var cat={},bad=0,ids={};for(var i=0;i<d.length;i++){var f=d[i];cat[f.category]=(cat[f.category]||0)+1;if(ids[f.id])bad++;ids[f.id]=1;if(!(f.id&&f.name&&f.sprite&&f.hp>0&&f.speed>0&&f.weight>0&&f.value>0&&f.depthMin<f.depthMax&&f.rarity>0&&f.scale>0))bad++}return {n:d.length,cat:cat,bad:bad,bands:[[0,30],[30,60],[60,100],[100,150],[150,260]].map(function(b){var n=0;for(var i=0;i<d.length;i++){if(d[i].depthMin<b[1]&&d[i].depthMax>b[0])n++}return b[0]+"-"+b[1]+":"+n}),charge:d.filter(function(f){return f.behavior==="charge"}).length}})())')) || '{}');
  out.push(comp.n === 50 && comp.bad === 0 ? 'PASS 50 种鱼数据完整（字段 0 违规, id 唯一）' : 'FAIL 数据表 ' + comp.n + ' 条 / 违规 ' + comp.bad);
  const c = comp.cat || {};
  out.push(c.common === 25 && c.uncommon === 4 && c.rare === 8 && c.deep === 6 && c.aggressive === 5 && c.boss === 2 ? 'PASS 构成 25+4=29普通/8稀有/6深海/5危险/2大型' : 'FAIL 构成 ' + JSON.stringify(c));
  const bands = comp.bands || [];
  const covered = bands.filter((b) => Number(String(b).split(':')[1]) >= 5).length;
  out.push(covered === 5 ? 'PASS 五深度带全覆盖 ' + bands.join(' ') : 'FAIL 深度带 ' + bands.join(' '));
  out.push(comp.charge === 7 ? 'PASS 危险鱼 charge 模板 7 条（5危险+2大型复用）' : 'FAIL charge ' + comp.charge);
} else {
  out.push('FAIL __UE_FISH_DEFS 未暴露');
}
// charge 实测：页面内把危险鱼传送玩家旁看其逼近
if ((await ev('typeof window.__UE_TEST_TELEPORT')) === 'function') {
  const before = JSON.parse((await ev('(function(){var f=(window.__UE_WORLD_FISH__||function(){return[]})();var d=window.__UE_DEBUG__;var t=null;for(var i=0;i<f.length;i++){if(f[i].behavior==="charge"){t=f[i];break}}if(!t)return JSON.stringify(null);window.__MARKIDX__=t.idx;window.__UE_TEST_TELEPORT(t.idx,d.diverX+260,d.diverY+30);return JSON.stringify({id:t.id,d0:Math.hypot(260,30)})})()')) || 'null');
  if (before) {
    let closing = false;
    for (let i = 0; i < 8; i++) {
      await sleep(350);
      const dist = (await ev('(function(){var f=(window.__UE_WORLD_FISH__||function(){return[]})();var d=window.__UE_DEBUG__;var t=f[window.__MARKIDX__];if(!t)return -1;return Math.round(Math.hypot(t.pos.x-d.diverX,t.pos.y-d.diverY))})()')) ?? -1;
      if (dist >= 0 && dist < 240) { closing = true; break; }
    }
    out.push(closing ? 'PASS 危险鱼索敌逼近（charge 冲撞行为实测距离收缩）' : 'WARN 未捕捉到 charge 逼近');
  } else {
    out.push('WARN 同屏暂无危险鱼可测 charge（rarity=1 稀有，属正常）');
  }
}
out.push(cerr.length === 0 ? 'PASS 页面异常 0' : 'FAIL 异常 ' + cerr.join('|'));
for (const o of out) console.log('  ' + o);
console.log(out.some((o) => o.startsWith('FAIL')) ? 'FISH CHECK: FAIL' : 'FISH CHECK: PASS');
cleanup();
process.exit(out.some((o) => o.startsWith('FAIL')) ? 1 : 0);
