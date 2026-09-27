// runtime-check.mjs — 真实运行验证（chrome-headless-shell + CDP，零第三方依赖）
//
//   node scripts/runtime-check.mjs [url] [out-prefix]
//   例：node scripts/runtime-check.mjs http://127.0.0.1:5317/ /tmp/rc
//
// 检查：JS 异常 / console.error / Shader 编译失败 / DrawCall 与 tris /
//       模型加载数 / 植被与港口统计 / 相机是否对准球心 / canvas 与 mini 视口一致性。
// 说明：完整 Google Chrome 在本机会被系统 SIGKILL，故用 chrome-headless-shell（静态编译）。
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

const URL = process.argv[2] || 'http://127.0.0.1:5317/';
const OUT = process.argv[3] || '/tmp/rc';
const PORT = Number(process.env.RC_PORT || 19660);
const SETTLE = Number(process.env.RC_SETTLE || 6000);

function findShell() {
  const roots = ['/private/tmp/chrome-headless-shell', '/tmp/chrome-headless-shell'];
  for (const r of roots) {
    if (!fs.existsSync(r)) continue;
    for (const d of fs.readdirSync(r)) {
      const p = path.join(r, d, 'chrome-headless-shell-mac-arm64', 'chrome-headless-shell');
      if (fs.existsSync(p)) return p;
    }
  }
  throw new Error('未找到 chrome-headless-shell。安装：npx --yes @puppeteer/browsers install chrome-headless-shell@stable');
}

const BIN = findShell();
const chrome = spawn(BIN, [
  '--headless',
  '--remote-debugging-port=' + PORT,
  '--remote-debugging-address=127.0.0.1',
  '--use-gl=angle', '--use-angle=metal',
  '--no-sandbox', '--disable-gpu-sandbox',
  '--window-size=1280,800',
  '--hide-scrollbars',
  'about:blank',
], { stdio: ['ignore', 'pipe', 'pipe'] });

let chromeErr = '';
chrome.stderr.on('data', (d) => (chromeErr += d.toString()));
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

let page = null;
for (let i = 0; i < 50 && !page; i++) {
  await wait(400);
  try {
    const list = await (await fetch('http://127.0.0.1:' + PORT + '/json')).json();
    page = list.find((t) => t.type === 'page') || null;
  } catch { /* CDP 未就绪 */ }
}
if (!page) {
  console.log('FAIL 无法连接 chrome-headless-shell CDP (port ' + PORT + ')');
  console.log(chromeErr.split('\n').slice(0, 8).join('\n'));
  chrome.kill('SIGKILL');
  process.exit(2);
}

const ws = new WebSocket(page.webSocketDebuggerUrl);
let idc = 0;
const pending = new Map();
const errors = [];
const warns = [];
const logs = [];

ws.addEventListener('message', (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  if (m.method === 'Runtime.exceptionThrown') {
    const d = m.params.exceptionDetails;
    errors.push('EXCEPTION: ' + (((d.exception || {}).description) || d.text || '').split('\n')[0]);
  }
  if (m.method === 'Runtime.consoleAPICalled') {
    const txt = (m.params.args || []).map((a) => a.value ?? a.description ?? '').join(' ');
    if (m.params.type === 'error') errors.push('CONSOLE.ERROR: ' + txt.slice(0, 400));
    else if (m.params.type === 'warning') warns.push(txt.slice(0, 200));
    else logs.push(txt.slice(0, 240));
    if (/Shader Error|VALIDATE_STATUS|shader is not compiled/i.test(txt)) {
      errors.push('SHADER: ' + txt.split('\n').slice(0, 8).join(' | ').slice(0, 500));
    }
  }
});
ws.addEventListener('error', (e) => errors.push('WS ERROR ' + (e.message || '')));

const send = (method, params = {}) =>
  new Promise((res) => { const i = ++idc; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });

await new Promise((r) => ws.addEventListener('open', r));
await send('Runtime.enable');
await send('Page.enable');
await send('Page.navigate', { url: URL + (URL.includes('?') ? '&' : '?') + 'rc=' + Date.now() });

// 等 window.__ready（资产加载 + 世界建造完成）
let ready = false;
for (let i = 0; i < 120; i++) {
  await wait(500);
  const r = await send('Runtime.evaluate', { expression: '!!(window.__ready && window.__debug)', returnByValue: true });
  if (r.result && r.result.result && r.result.result.value) { ready = true; break; }
}
await wait(SETTLE);   // 跑够帧数统计 FPS / DrawCall

const PROBE = [
  '(() => {',
  '  const d = window.__debug;',
  '  if (!d) return { err: "window.__debug 不存在（main.js 未跑完）" };',
  '  const info = d.rendererManager.renderer.info;',
  '  const cam = d.cameraManager.camera;',
  '  const dir = new THREE.Vector3(); cam.getWorldDirection(dir);',
  '  const camPos = cam.getWorldPosition(new THREE.Vector3());',
  '  const toC = new THREE.Vector3(0, 0, 0).sub(camPos).normalize();',
  '  const angToCenter = THREE.MathUtils.radToDeg(Math.acos(Math.max(-1, Math.min(1, dir.dot(toC)))));',
  '  const rect = d.rendererManager.canvas.getBoundingClientRect();',
  '  return {',
  '    ready: !!window.__ready,',
  '    loadedModels: d.assets.listLoaded ? d.assets.listLoaded().length : -1,',
  '    loadErrors: (d.assets.errors || []).length,',
  '    drawCalls: info.render.calls,',
  '    triangles: info.render.triangles,',
  '    programs: (info.programs || []).length,',
  '    programsBroken: (info.programs || []).filter((p) => p.diagnostics).length,',
  '    shaderSelfCheck: d.assets.reportShaderErrors ? d.assets.reportShaderErrors(d.rendererManager.renderer).length : -1,',
  '    mode: d.cameraManager.mode,',
  '    fitDist: d.cameraManager._fit ? Math.round(d.cameraManager._fit) : null,',
  '    angleToCenterDeg: +angToCenter.toFixed(3),',
  '    miniEnabled: !!d.rendererManager.miniEnabled,',
  '    miniRect: { x: Math.round(d.rendererManager.miniRect.x), y: Math.round(d.rendererManager.miniRect.y), w: d.rendererManager.miniRect.w, h: d.rendererManager.miniRect.h },',
  '    canvasCss: { w: Math.round(rect.width), h: Math.round(rect.height), left: Math.round(rect.left), top: Math.round(rect.top) },',
  '    canvasBuffer: { w: d.rendererManager.renderer.domElement.width, h: d.rendererManager.renderer.domElement.height },',
  '    dpr: window.devicePixelRatio,',
  '    innerW: window.innerWidth, innerH: window.innerHeight,',
  '    nature: d.nature ? d.nature.summary() : null,',
  '    ports: d.ports ? d.ports.summary() : null,',
  '    portsList: d.ports ? d.ports.ports.map((p) => ({ id: p.id, lat: +p.lat.toFixed(1), lon: +p.lon.toFixed(1), h: +(p.groundH || 0).toFixed(2) })) : [],',
  '    hudStats: (document.getElementById("stats") || {}).textContent || "",',
  '    instanced: (() => {',
  '      const arr = [];',
  '      let drawnTris = 0;',
  '      d.sceneManager.scene.traverse((o) => {',
  '        if (!o.isInstancedMesh) return;',
  '        const vis = o.visible && (!o.parent || o.parent.visible);',
  '        arr.push({ name: o.name, count: o.count, visible: vis, frustumCulled: o.frustumCulled, hasUv: !!o.geometry.attributes.uv, mat: o.material && o.material.type });',
  '        if (vis && o.count > 0 && o.geometry.index) drawnTris += (o.geometry.index.count / 3) * o.count;',
  '      });',
  '      return { layers: arr.length, total: arr, expectedInstanceTris: Math.round(drawnTris) };',
  '    })()',
  '  };',
  '})()',
].join('\n');

const probe = await send('Runtime.evaluate', { expression: PROBE, returnByValue: true });
const v = probe.result && probe.result.result ? probe.result.result.value : null;

console.log('── 运行验证 ' + URL + ' ──');
console.log('  页面就绪 window.__ready : ' + (v ? v.ready : 'n/a') + (ready ? '' : '  ⚠ 等待超时'));
if (!v) {
  console.log('  探测失败: ' + JSON.stringify(probe).slice(0, 400));
} else {
  console.log('  Kenney 模型加载        : ' + v.loadedModels + ' 个（加载失败 ' + v.loadErrors + '）');
  console.log('  DrawCall / 三角面      : ' + v.drawCalls + ' / ' + v.triangles);
  console.log('  program 总数 / 失败    : ' + v.programs + ' / ' + v.programsBroken + '   shader 自检失败 ' + v.shaderSelfCheck);
  console.log('  视角 / 屏幕适配距离    : ' + v.mode + ' / ' + v.fitDist);
  console.log('  镜头偏离球心角         : ' + v.angleToCenterDeg + '°  （<1° = 镜头对着星球中央）');
  console.log('  canvas CSS             : ' + v.canvasCss.w + 'x' + v.canvasCss.h + ' @(' + v.canvasCss.left + ',' + v.canvasCss.top + ')');
  console.log('  canvas 帧缓冲          : ' + v.canvasBuffer.w + 'x' + v.canvasBuffer.h + '   dpr=' + v.dpr + '   window=' + v.innerW + 'x' + v.innerH);
  console.log('  Mini 通道 / 视口       : ' + v.miniEnabled + '  rect=' + JSON.stringify(v.miniRect));
  console.log('  植被（Instancing）     : ' + JSON.stringify(v.nature));
  console.log('  港口聚落               : ' + JSON.stringify(v.ports));
  console.log('  港口落点               : ' + v.portsList.map((p) => p.id + '(' + p.lat + ',' + p.lon + ' h' + p.h + ')').join(' '));
  console.log('  HUD 状态栏             : ' + String(v.hudStats).replace(/\n/g, ' | '));
  if (v.instanced) {
    console.log('  InstancedMesh 层数     : ' + v.instanced.layers + '   实例应产生三角面 ≈' + v.instanced.expectedInstanceTris);
    v.instanced.total.forEach((l) => console.log('     · ' + l.name + '  count=' + l.count + ' visible=' + l.visible + ' uv=' + l.hasUv + ' mat=' + l.mat));
    if (v.instanced.expectedInstanceTris > 0 && v.triangles < v.instanced.expectedInstanceTris * 0.4) {
      console.log('     ⚠ 实测 tris(' + v.triangles + ') 远小于实例应有三角面 → 实例可能未被绘制（或被视锥剔除）');
    }
  }

  // 坐标一致性：canvas CSS 应铺满 window 且原点 (0,0)，否则 scissor 会整体偏移
  const canvasOk = v.canvasCss.w === v.innerW && v.canvasCss.h === v.innerH && v.canvasCss.left === 0 && v.canvasCss.top === 0;
  console.log('  canvas 与视口对齐      : ' + (canvasOk ? '✓ 一致（scissor/mini 坐标可靠）' : '✗ 不一致 → Mini 会错位'));
  if (!canvasOk) errors.push('canvas CSS 与 window 不一致: ' + JSON.stringify(v.canvasCss) + ' vs ' + v.innerW + 'x' + v.innerH);

  // 截图：全球 / 港口贴地（等 FlyTo 结束）/ 全球
  const waitFor = async (expr, ms = 8000, step = 300) => {
    const t0 = Date.now();
    while (Date.now() - t0 < ms) {
      const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true });
      if (r.result && r.result.result && r.result.result.value) return true;
      await wait(step);
    }
    return false;
  };
  // 渲染帧计数（证明每帧在画世界内容）
  await send('Runtime.evaluate', { expression: "window.__rcFrames=0; (function(){const o=window.__debug.rendererManager.renderMain.bind(window.__debug.rendererManager); window.__debug.rendererManager.renderMain=function(){window.__rcFrames++;return o.apply(null,arguments);};})()" });

  const snap = async (tag, js) => {
    if (js) await send('Runtime.evaluate', { expression: js });
    await wait(1600);
    const s = await send('Page.captureScreenshot', { format: 'png' });
    if (s.result && s.result.data) {
      const file = OUT + '-' + tag + '.png';
      fs.writeFileSync(file, Buffer.from(s.result.data, 'base64'));
      console.log('  截图 → ' + file);
    }
  };
  await snap('globe', null);
  await send('Runtime.evaluate', { expression: "(() => { const d = window.__debug; const p = d.ports.ports[0]; d.sceneManager.planet.rotation.y = 0; d.cameraManager.state.lat = p.lat; d.cameraManager.state.lon = p.lon; d.cameraManager.flyToLatLon(p.lat, p.lon, { mode:'LOCAL', dist:16, duration:0.9 }); })()" });
  await waitFor("window.__debug.cameraManager.mode==='LOCAL' && !window.__debug.cameraManager.isFlying", 9000);
  // 港口贴地 + 统计：世界内容是否真的在每帧被画
  var fs2Hold = null;
  const frameStat = await send('Runtime.evaluate', { expression: "(() => { const before = window.__rcFrames; return new Promise(r => setTimeout(() => r({ frames: window.__rcFrames - before, drawCalls: window.__debug.rendererManager.renderer.info.render.calls, tris: window.__debug.rendererManager.renderer.info.render.triangles, instances: window.__debug.rendererManager.renderer.info.render.frame }), 900)); })()", awaitPromise: true, returnByValue: true });
  fs2Hold = frameStat.result && frameStat.result.result ? frameStat.result.result.value : null;
  var fs2 = fs2Hold;
  if (fs2) console.log('  贴地渲染统计         : 0.9s 内渲染 ' + fs2.frames + ' 帧  drawCalls=' + fs2.drawCalls + '  tris=' + fs2.tris);
  if (fs2 && fs2.frames < 5) errors.push('贴地视角渲染帧数过少（动画循环可能停）: ' + JSON.stringify(fs2));
  if (fs2 && fs2.tris < 5000) errors.push('贴地视角三角面过少（世界内容没被画？）: ' + fs2.tris);
  await snap('port', null);
  await snap('ports', "(() => { const d = window.__debug; d.cameraManager.setMode('GLOBE'); })()");
}

console.log('');
if (warns.length) { console.log('── 警告 ' + warns.length + ' 条 ──'); warns.slice(0, 6).forEach((w) => console.log('  ' + w)); }
console.log('── 错误 ' + errors.length + ' 条 ──');
errors.slice(0, 16).forEach((e) => console.log('  ' + e.slice(0, 400)));

const ok =
  ready &&
  errors.length === 0 &&
  !!v &&
  v.programsBroken === 0 &&
  v.shaderSelfCheck === 0 &&
  v.triangles > 1000 &&
  v.loadedModels >= 25 &&
  v.angleToCenterDeg < 1 &&
  !!(v.nature && v.nature.palms > 0 && v.nature.grass > 0) &&
  !!(v.ports && v.ports.ports >= 4);
// 贴地统计若存在则必须真在画世界
const okFinal = ok && (!fs2 || (fs2.frames >= 5 && fs2.tris > 5000));

console.log('');
console.log(okFinal ? 'PASS 运行验证通过（模型上球、港口就位、镜头对心、Mini 可见）' : 'FAIL 运行验证发现问题');
ws.close();
chrome.kill('SIGKILL');
process.exit(okFinal ? 0 : 1);
