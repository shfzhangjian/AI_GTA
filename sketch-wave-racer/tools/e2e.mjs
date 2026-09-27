// 无依赖端到端驱动：CDP over WebSocket 控制 chrome-headless-shell
// 用法: node tools/e2e.mjs [--headed]  —— 验证 加载→W加速→A转向→HUD/船位
import { spawn } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const BIN = process.env.CHROME_BIN ||
  "/Users/mac/Library/Caches/ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-mac-arm64/chrome-headless-shell";
const PORT = 9333 + Math.floor(Math.random() * 100);
const headed = process.argv.includes("--headed");
const url = process.env.E2E_URL || "http://localhost:5173/";

const proc = spawn(BIN, [
  "--remote-debugging-port=" + PORT,
  "--user-data-dir=" + mkdtempSync(join(tmpdir(), "swr-e2e-")),
  "--no-sandbox", "--disable-gpu-sandbox",
  ...(headed ? [] : ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"]),
  "--window-size=1280,800", "about:blank",
], { stdio: ["ignore", "ignore", "pipe"] });
let stderrBuf = "";
proc.stderr.on("data", (d) => { stderrBuf += d; });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// 等 ws url
async function getWs() {
  for (let i = 0; i < 50; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json`);
      const list = await res.json();
      const page = list.find((t) => t.type === "page");
      if (page?.webSocketDebuggerUrl) return page.webSocketDebuggerUrl;
    } catch {}
    await sleep(200);
  }
  throw new Error("CDP not up:\n" + stderrBuf.slice(-500));
}

let ws, msgId = 0;
const pending = new Map();
const events = [];
function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++msgId;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
}

ws = new WebSocket(await getWs());
await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) {
    const { resolve, reject } = pending.get(m.id);
    pending.delete(m.id);
    m.error ? reject(new Error(m.error.message)) : resolve(m.result);
  } else if (m.method) events.push(m);
};

await send("Page.enable");
await send("Runtime.enable");
await send("Log.enable");

const jsErrors = [];
ws.onmessage && null;
const origHandler = ws.onmessage;
ws.onmessage = (e) => {
  origHandler(e);
  const m = JSON.parse(e.data);
  if (m.method === "Runtime.exceptionThrown")
    jsErrors.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
  if (m.method === "Log.entryAdded" && m.params.entry.level === "error" &&
      !/swiftshader|mailbox|GL Driver|gpu/i.test(m.params.entry.text))
    jsErrors.push(m.params.entry.text);
};

await send("Page.navigate", { url });
await sleep(4000); // 等加载 + 若干帧

const diag1 = await send("Runtime.evaluate", {
  expression: `JSON.stringify({phase: window.SWR?1:0, speed: window.SWR?.boat.speed})`,
  returnByValue: true,
}).then((r) => JSON.parse(r.result.value));
console.log("load:", JSON.stringify(diag1));

const key = (type, code) =>
  send("Input.dispatchKeyEvent", {
    type, code, key: code, windowsVirtualKeyCode: code.charCodeAt(1) || code.charCodeAt(0),
  });

// ---- W 加速 2.5s ----
await key("keyDown", "KeyW");
await sleep(2500);
const afterW = await send("Runtime.evaluate", {
  expression: `({speed: SWR.boat.speed, z: SWR.boat.position.z, x: SWR.boat.position.x, hud: document.getElementById('hud-fps').textContent})`,
  returnByValue: true,
}).then((r) => r.result);
console.log("after W 2.5s:", JSON.stringify(afterW));
await key("keyUp", "KeyW");

// ---- A 左转 1.2s ----
const h0 = await send("Runtime.evaluate", { expression: "SWR.boat.heading", returnByValue: true }).then(r => r.result.value);
await key("keyDown", "KeyA");
await sleep(1200);
await key("keyUp", "KeyA");
const afterA = await send("Runtime.evaluate", {
  expression: `({heading: SWR.boat.heading, steer: SWR.boat.steer, lateral: SWR.boat.lateral})`,
  returnByValue: true,
}).then((r) => r.result);
console.log("after A 1.2s:", JSON.stringify(afterA), "heading0:", h0);

// ---- 截图 ----
const shot = await send("Page.captureScreenshot", { format: "png" });
const { writeFileSync } = await import("node:fs");
const shotPath = process.env.E2E_SHOT || "/tmp/swr_e2e.png";
writeFileSync(shotPath, Buffer.from(shot.data, "base64"));
console.log("screenshot:", shotPath);

// ---- 断言 ----
const fail = [];
if (diag1.phase !== 1) fail.push("SWR 未初始化（模块加载失败？）");
const spd = afterW.value ? afterW.value.speed : afterW.speed; if (!(spd > 5)) fail.push(`W 加速无效 speed=${spd}`);
const hd = afterA.value ? afterA.value.heading : afterA.heading; if (Math.abs(hd - h0) < 0.3) fail.push(`A 转向无效 heading Δ=${(hd - h0).toFixed(3)}`);
if (jsErrors.length) fail.push("JS 错误: " + jsErrors.slice(0, 3).join(" | "));

proc.kill("SIGKILL");
if (fail.length) { console.error("E2E FAIL:\n- " + fail.join("\n- ")); process.exit(1); }
console.log("E2E PASS: load + throttle + steering + no js errors");
