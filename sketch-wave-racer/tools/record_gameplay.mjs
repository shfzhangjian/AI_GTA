// Record a short gameplay clip through Chrome DevTools Protocol and ffmpeg.
// Usage:
//   node tools/record_gameplay.mjs [url] [output.mp4] [durationSeconds]

import { spawn, spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";

const CHROME_BIN = process.env.CHROME_BIN ||
  "/Users/mac/Library/Caches/ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-mac-arm64/chrome-headless-shell";
const FFMPEG_BIN = process.env.FFMPEG_BIN || "/opt/homebrew/bin/ffmpeg";
const PORT = 9333 + Math.floor(Math.random() * 1000);
const url = process.argv[2] || "http://127.0.0.1:5174/";
const out = resolve(process.argv[3] || "recordings/sketch-wave-racer-gameplay.mp4");
const duration = Math.max(6, Number(process.argv[4]) || 16);
const fps = Number(process.env.RECORD_FPS || 15);
const width = Number(process.env.RECORD_WIDTH || 1280);
const height = Number(process.env.RECORD_HEIGHT || 720);
const frameDir = mkdtempSync(join(tmpdir(), "swr-record-frames-"));
const userDataDir = mkdtempSync(join(tmpdir(), "swr-record-profile-"));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
mkdirSync(dirname(out), { recursive: true });

if (!existsSync(CHROME_BIN)) {
  throw new Error(`Chrome binary not found: ${CHROME_BIN}`);
}
if (!existsSync(FFMPEG_BIN)) {
  throw new Error(`ffmpeg not found: ${FFMPEG_BIN}`);
}

const chrome = spawn(CHROME_BIN, [
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${userDataDir}`,
  "--no-sandbox",
  "--disable-gpu-sandbox",
  "--use-angle=swiftshader",
  "--enable-unsafe-swiftshader",
  `--window-size=${width},${height}`,
  "about:blank",
], { stdio: ["ignore", "ignore", "pipe"] });

let stderr = "";
chrome.stderr.on("data", (d) => { stderr += d; });

let ws;
let id = 0;
const pending = new Map();
const jsErrors = [];
let recording = false;
let recordStartedAt = 0;
let nextFrameAt = 0;
let frameCount = 0;
let targetFrames = 0;

function shutdown() {
  try { chrome.kill("SIGKILL"); } catch {}
  try { rmSync(userDataDir, { recursive: true, force: true }); } catch {}
}

async function getWsUrl() {
  for (let i = 0; i < 70; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json();
      const page = list.find((t) => t.type === "page");
      if (page?.webSocketDebuggerUrl) return page.webSocketDebuggerUrl;
    } catch {}
    await sleep(150);
  }
  throw new Error("Chrome DevTools did not start:\n" + stderr.slice(-800));
}

function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const msgId = ++id;
    pending.set(msgId, { resolve, reject });
    ws.send(JSON.stringify({ id: msgId, method, params }));
  });
}

async function evaluate(expression) {
  const r = await send("Runtime.evaluate", { expression, returnByValue: true });
  if (r.exceptionDetails) {
    const desc = r.exceptionDetails.exception?.description || r.exceptionDetails.text;
    throw new Error(desc || "Runtime evaluation failed");
  }
  return r.result.value;
}

function keyParams(code, type) {
  const key = code === "Space" ? " " : code.replace(/^Key/, "");
  const vk = code === "Space" ? 32 : key.charCodeAt(0);
  return {
    type,
    code,
    key,
    text: type === "keyDown" && code !== "Space" ? key.toLowerCase() : undefined,
    windowsVirtualKeyCode: vk,
    nativeVirtualKeyCode: vk,
  };
}

async function setKey(code, down, pressed) {
  if (!!pressed[code] === !!down) return;
  pressed[code] = !!down;
  await send("Input.dispatchKeyEvent", keyParams(code, down ? "keyDown" : "keyUp"));
}

async function tap(code, ms = 90) {
  await send("Input.dispatchKeyEvent", keyParams(code, "keyDown"));
  await sleep(ms);
  await send("Input.dispatchKeyEvent", keyParams(code, "keyUp"));
}

try {
  ws = new WebSocket(await getWsUrl());
  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });
  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result);
      return;
    }
    if (msg.method === "Page.screencastFrame") {
      send("Page.screencastFrameAck", { sessionId: msg.params.sessionId }).catch(() => {});
      if (!recording || frameCount >= targetFrames) return;
      const now = Date.now();
      if (now < nextFrameAt) return;
      frameCount += 1;
      nextFrameAt += 1000 / fps;
      writeFileSync(
        join(frameDir, `frame${String(frameCount).padStart(5, "0")}.jpg`),
        Buffer.from(msg.params.data, "base64")
      );
      return;
    }
    if (msg.method === "Runtime.exceptionThrown") {
      jsErrors.push(msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text);
    }
    if (msg.method === "Log.entryAdded" && msg.params.entry.level === "error" &&
      !/swiftshader|mailbox|GL Driver|gpu/i.test(msg.params.entry.text)) {
      jsErrors.push(msg.params.entry.text);
    }
  };

  await send("Page.enable");
  await send("Runtime.enable");
  await send("Log.enable");
  await send("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await send("Page.navigate", { url });

  for (let i = 0; i < 80; i++) {
    if (await evaluate("Boolean(window.SWR && document.getElementById('btn-start'))").catch(() => false)) break;
    await sleep(150);
  }
  const ready = await evaluate("Boolean(window.SWR && document.getElementById('btn-start'))");
  if (!ready) throw new Error("Game did not initialize");

  await evaluate(`
    (() => {
      localStorage.setItem("swr-sound", "0");
      const btn = document.getElementById("btn-start");
      if (btn) btn.click();
      return true;
    })()
  `);

  const pressed = {};
  targetFrames = Math.round(duration * fps);
  recordStartedAt = Date.now();
  nextFrameAt = recordStartedAt;
  recording = true;
  const driveStart = 3.25;

  await send("Page.startScreencast", {
    format: "jpeg",
    quality: 84,
    maxWidth: width,
    maxHeight: height,
    everyNthFrame: 1,
  });

  const itemTapAt = [7.2, 10.7, 13.5];
  const itemTapped = new Set();
  while (Date.now() - recordStartedAt < duration * 1000) {
    const t = (Date.now() - recordStartedAt) / 1000;
    if (t >= driveStart) {
      const steerWave = Math.sin((t - driveStart) * 1.6);
      await setKey("KeyW", true, pressed);
      await setKey("KeyA", steerWave < -0.38, pressed);
      await setKey("KeyD", steerWave > 0.38, pressed);
      for (const tapAt of itemTapAt) {
        if (!itemTapped.has(tapAt) && t >= tapAt) {
          itemTapped.add(tapAt);
          await tap("Space");
        }
      }
    } else {
      await setKey("KeyW", false, pressed);
      await setKey("KeyA", false, pressed);
      await setKey("KeyD", false, pressed);
    }
    await sleep(80);
  }
  recording = false;
  await sleep(250);
  await send("Page.stopScreencast").catch(() => {});

  await Promise.all([
    setKey("KeyW", false, pressed),
    setKey("KeyA", false, pressed),
    setKey("KeyD", false, pressed),
  ]);

  if (frameCount < 2) {
    throw new Error(`Not enough frames captured: ${frameCount}`);
  }

  const encodeFps = Math.max(1, frameCount / duration);
  const ffmpeg = spawnSync(FFMPEG_BIN, [
    "-y",
    "-framerate", String(encodeFps),
    "-i", join(frameDir, "frame%05d.jpg"),
    "-vf", "format=yuv420p",
    "-c:v", "libx264",
    "-preset", "veryfast",
    "-crf", "20",
    "-movflags", "+faststart",
    out,
  ], { encoding: "utf8" });

  if (ffmpeg.status !== 0) {
    throw new Error("ffmpeg failed:\n" + (ffmpeg.stderr || ffmpeg.stdout || "").slice(-1600));
  }

  console.log(JSON.stringify({
    out,
    frames: frameCount,
    captureFps: fps,
    encodeFps: +encodeFps.toFixed(3),
    duration: +(frameCount / encodeFps).toFixed(2),
    jsErrors: jsErrors.slice(0, 4),
    frameDir,
  }, null, 2));
} finally {
  shutdown();
}
