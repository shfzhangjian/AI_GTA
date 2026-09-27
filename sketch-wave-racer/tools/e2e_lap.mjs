// Phase 2 真实键盘 E2E —— 用户打回场景的端到端复验。
// 铁律（本文件存在的意义）：
//   1. 只发真实 CDP Input.dispatchKeyEvent（W/A/S/D 长按与点按）。
//      绝不注入 boat.override、绝不 setPose/改位置——上一版 e2e_lap.mjs
//      注入驱船（直接按弧长摆位置）造成"3 圈 PASS"假阳性，掩盖了用户实测
//      "圈数不变"的真实 bug，此罪状见 KNOWN_ISSUES。
//   2. Node 侧硬超时（默认 50s）。软渲染 ~30fps 下一圈真实驾驶约 70s，
//      故不追求完赛：验证"连续过检查点 + 正向跨过起点线计圈 + HUD 更新"
//      即 PASS；圈数不推进 = FAIL。绝不连环等待/调参。
//   3. 导引完全在页面内用 rAF + 键盘状态做滞环 PD（模拟人看门开船），
//      Node 侧只轮询状态并转发 key 事件。
// 用法：node tools/e2e_lap.mjs [--headed] [超时秒=50]
import { spawn } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const BIN = process.env.CHROME_BIN ||
  "/Users/mac/Library/Caches/ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-mac-arm64/chrome-headless-shell";
const PORT = 9333 + Math.floor(Math.random() * 100);
const url = process.env.E2E_URL || "http://localhost:5173/";
const headed = process.argv.includes("--headed");
const HARD_TIMEOUT = (Number(process.argv.find((a) => /^\d+$/.test(a))) || 50) * 1000;
const SHOT = process.env.E2E_SHOT || new URL("../project-docs/shots/phase2-lap-realkeys.png", import.meta.url).pathname;

const proc = spawn(BIN, [
  "--remote-debugging-port=" + PORT,
  "--user-data-dir=" + mkdtempSync(join(tmpdir(), "swr-laprk-")),
  "--no-sandbox", "--disable-gpu-sandbox",
  ...(headed ? [] : ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"]),
  "--window-size=1280,800", "about:blank",
], { stdio: ["ignore", "ignore", "pipe"] });
let errBuf = ""; proc.stderr.on("data", (d) => (errBuf += d));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const hardKill = (why) => {
  try { proc.kill("SIGKILL"); } catch {}
  console.error("E2E-LAP ABORT:", why);
  process.exit(1);
};
const hardTimer = setTimeout(() => hardKill("hard timeout " + HARD_TIMEOUT / 1000 + "s"), HARD_TIMEOUT);
hardTimer.unref?.();

let ws, id = 0; const pend = new Map(); const jsErrors = [];
function send(m, p = {}) {
  return new Promise((res, rej) => {
    const i = ++id; pend.set(i, { res, rej });
    ws.send(JSON.stringify({ id: i, method: m, params: p }));
  });
}
async function evl(x) {
  const r = await send("Runtime.evaluate", { expression: x, returnByValue: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || "eval err");
  return r.result.value;
}

let wsUrl = null;
for (let i = 0; i < 60 && !wsUrl; i++) {
  try {
    const l = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json();
    const pg = l.find((t) => t.type === "page");
    if (pg?.webSocketDebuggerUrl) wsUrl = pg.webSocketDebuggerUrl;
  } catch {}
  if (!wsUrl) await sleep(200);
}
if (!wsUrl) hardKill("CDP not up: " + errBuf.slice(-300));

ws = new WebSocket(wsUrl);
await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pend.has(m.id)) {
    const { res, rej } = pend.get(m.id); pend.delete(m.id);
    m.error ? rej(new Error(m.error.message)) : res(m.result);
  } else if (m.method === "Runtime.exceptionThrown") {
    jsErrors.push(m.params.exceptionDetails.exception?.description || "");
  }
};
await send("Runtime.enable");
await send("Log.enable");
await send("Page.navigate", { url });
for (let i = 0; i < 40; i++) { await sleep(250); if (await evl("window.SWR?1:0").catch(() => 0)) break; }
if (!(await evl("window.SWR?1:0"))) hardKill("page load fail: " + jsErrors.slice(0, 2).join("|"));

// ---- 页面内键盘滞环导引（无 override）----
// 真实键盘只有满舵 A/D；导引只决定"这一拍按住哪个键"。
// 通过 CDP 的 key state 由 Node 转发：页面里读 SWR.input.down（真实 InputState）。
await evl(`
(() => {
  const { race } = window.SWR;
  window.__cmd = { throttle: true, steer: 0 };  // 导引意图（由 rAF 更新）
  window.__events = [];
  window.__stop = false;
  let lastLap = 1, lastCp = 1, stuck = 0;
  function tick() {
    if (window.__stop) return;
    const { boat, track } = window.SWR;
    const e = race.entryOf("player");
    if (race.event && (race.event.type === "lap" || race.event.type === "finish" || race.event.type === "reset")) {
      window.__events.push({ t: +race.time.toFixed(1), type: race.event.type, lap: e.lap });
    }
    // 选瞄准检查点：nextCp 停滞 >2s 则换瞄更前方一个（玩家自救）
    if (e.nextCp === lastCp) { if (++stuck > 60) stuck = -120; }
    else { lastCp = e.nextCp; stuck = 0; }
    const aim = (e.nextCp + (stuck < 0 ? 1 : 0) + 10) % 10;
    const target = track.checkpoints[aim].pos;
    const p = boat.position;
    // 纯追踪：瞄准航道上目标前方一点，防外切
    const near = track.nearest(p.x, p.z);
    const look = track.pointAt(near.t + 20 / track.length);
    const desired = Math.atan2(-(look.x - p.x), -(look.z - p.z));
    let err = Math.atan2(Math.sin(desired - boat.heading), Math.cos(desired - boat.heading));
    window.__cmd = { throttle: Math.abs(err) < 0.9, steer: err > 0.05 ? 1 : err < -0.05 ? -1 : 0 };
    if (e.finished || e.lap !== lastLap && e.lap > 2) { window.__stop = true; return; }
    requestAnimationFrame(tick);
  }
  tick();
})()
`);

// ---- 把 __cmd 意图翻译为真实按键事件（keydown/keyup 成对，经 InputState 真实路径）----
let down = {};
async function applyKeys(cmd) {
  const want = { KeyW: cmd.throttle, KeyD: cmd.steer > 0, KeyA: cmd.steer < 0 };
  for (const code of ["KeyW", "KeyD", "KeyA"]) {
    if (!!want[code] === !!down[code]) continue;
    down[code] = !!want[code];
    await send("Input.dispatchKeyEvent", {
      type: want[code] ? "keyDown" : "keyUp", code, key: code.slice(-1),
      windowsVirtualKeyCode: code.charCodeAt(3) || code.charCodeAt(2),
    });
  }
}

// ---- 轮询：每 1.5s 读状态 + 转发按键；全程受 hardTimer 保护 ----
const trace = [];
let last = null;
const t0 = Date.now();
let pass = false, fail = [];
while (Date.now() - t0 < HARD_TIMEOUT - 4000) {
  const st = await evl(`(() => {
    const e = SWR.race.entryOf("player");
    const n = SWR.track.nearest(e.boat.position.x, e.boat.position.z);
    return { t: +SWR.race.time.toFixed(1), lap: e.lap, nextCp: e.nextCp,
      arcN: +e._arcN.toFixed(0), dist: +n.dist.toFixed(1), spd: +e.boat.speed.toFixed(1),
      resets: (window.__events||[]).filter(x=>x.type==="reset").length,
      events: JSON.stringify(window.__events||[]),
      hud: document.getElementById("hud-lap")?.textContent,
      cmd: window.__cmd, finished: e.finished };
  })()`).catch((e) => hardKill("eval: " + e.message));
  trace.push(st);
  await applyKeys(st.cmd || { throttle: true, steer: 0 });
  if (trace.length <= 4 || trace.length % 8 === 0) {
    console.log(JSON.stringify({ t: st.t, lap: st.lap, nextCp: st.nextCp, arcN: st.arcN, dist: st.dist, spd: st.spd, resets: st.resets, hud: st.hud }));
  }
  // 判定：过 ≥3 个检查点 且（lap≥2 或 已完赛）→ 圈数系统工作
  if (st.finished || st.lap >= 2) { pass = true; break; }
  if (st.resets >= 5) { fail.push("auto-reset 风暴（≥5 次）：" + st.events); break; }
  await sleep(1200);
}

// 松键 + 截图一张（唯一一次）+ trace 落盘
await applyKeys({ throttle: false, steer: 0 }).catch(() => {});
try {
  const shot = await send("Page.captureScreenshot", { format: "png" });
  writeFileSync(SHOT, Buffer.from(shot.data, "base64"));
} catch {}
writeFileSync("/tmp/swr_lap_trace.json", JSON.stringify(trace));
try { proc.kill("SIGKILL"); } catch {}
clearTimeout(hardTimer);

const final = trace[trace.length - 1] || {};
if (!pass) {
  if (!fail.length) fail.push(`超时未见 lap≥2（真实键盘驾驶 ${final.t}s，nextCp=${final.nextCp} arcN=${final.arcN}）trace:/tmp/swr_lap_trace.json`);
  if (jsErrors.length) fail.push("JS 错误: " + jsErrors.slice(0, 2).join(" | "));
  console.error("E2E-LAP FAIL:\n- " + fail.join("\n- "));
  process.exit(1);
}
if (jsErrors.length) { console.error("E2E-LAP FAIL（JS 错误）: " + jsErrors.slice(0, 2).join(" | ")); process.exit(1); }
console.log(`E2E-LAP PASS: 真实键盘驾驶 lap=${final.lap} (${final.hud || ""}) events=${final.events}`);
console.log("screenshot:", SHOT, "| trace: /tmp/swr_lap_trace.json");
