// Sketch Wave Racer — 音效系统（Phase 7+ 用户新增需求）
// 全部 **WebAudio 程序合成**（振荡器/噪声缓冲/滤波/包络），零外部音频素材。
// 浏览器自动播放策略：首次用户手势（START 点击 / 任意按键）时 resume()。
// 无 AudioContext 环境（无头测试桩）整体安静降级——游戏逻辑零耦合。

import { CONFIG } from "../config.js";

const AC = () => (typeof window !== "undefined" && (window.AudioContext || window.webkitAudioContext)) || null;

export function createAudio() {
  const Ctor = AC();
  let ctx = null;
  let master = null;
  let engine = null; // 引擎循环
  let ready = false;

  // ---- 懒初始化（首次手势调用 unlock 时建链）----
  function unlock() {
    if (!Ctor) return;
    if (!ctx) {
      try {
        ctx = new Ctor();
        master = ctx.createGain();
        master.gain.value = loadEnabled() ? loadVolume() : 0;
        master.connect(ctx.destination);
        buildEngine();
        buildAmbient();
        ready = true;
      } catch { ready = false; }
    }
    if (ctx && ctx.state === "suspended") ctx.resume();
  }

  function loadVolume() {
    try {
      const v = parseFloat(localStorage.getItem("swr-volume"));
      return Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : 0.6;
    } catch { return 0.6; }
  }

  // ---- 引擎循环：锯齿 + 低通，音高/音量随船速（速度感的核心听觉来源）----
  function buildEngine() {
    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.value = 46;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 380;
    const g = ctx.createGain();
    g.gain.value = 0;
    osc.connect(lp); lp.connect(g); g.connect(master);
    osc.start();
    engine = { osc, lp, g };
  }

  // ---- 环境海浪白噪：噪声源 + 低通 + LFO 音量蠕动 ----
  function buildAmbient() {
    const len = ctx.sampleRate * 2;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf; src.loop = true;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass"; lp.frequency.value = 420;
    const g = ctx.createGain();
    g.gain.value = 0.05;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.13;
    const lfoG = ctx.createGain();
    lfoG.gain.value = 0.025;
    lfo.connect(lfoG); lfoG.connect(g.gain);
    src.connect(lp); lp.connect(g); g.connect(master);
    src.start(); lfo.start();
  }

  // ---- 引擎逐帧跟随 ----
  function engineUpdate(speed, maxSpeed) {
    if (!ready || !engine) return;
    const t = ctx.currentTime;
    const k = Math.min(Math.abs(speed) / maxSpeed, 1);
    const target = CONFIG.audio.engineGain * k;
    engine.g.gain.setTargetAtTime(speed > 0.5 ? target : 0, t, 0.09);
    engine.osc.frequency.setTargetAtTime(42 + k * 105, t, 0.11);
    engine.lp.frequency.setTargetAtTime(280 + k * 1300, t, 0.12);
  }

  // ---- 一次性音效库 ----
  // 在途一次性音源（含排队旋律音符）：stopAllSfx() 立即掐掉 + 取消排队。
  //（用户反馈：完赛音效要立即停；重开一局不许残留上一局的 GO/完赛旋律。）
  const liveStops = [];
  const timers = new Set();
  function sched(ms, fn) {
    if (!ready) return;
    const id = setTimeout(() => { timers.delete(id); fn(); }, ms);
    timers.add(id);
  }
  function beep({ f0 = 440, f1 = null, dur = 0.12, type = "square", gain = 0.2, sweep = "exp" }) {
    if (!ready) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    if (f1) sweep === "exp" ? o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + dur)
      : o.frequency.linearRampToValueAtTime(f1, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + dur + 0.02);
    liveStops.push({ stop: () => { try { o.stop(0); g.gain.value = 0; } catch { /* noop */ } } });
  }

  function noise({ dur = 0.3, cutoff = 900, gain = 0.3, sweepTo = 120, q = 0.8 }) {
    if (!ready) return;
    const t = ctx.currentTime;
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass"; bp.Q.value = q;
    bp.frequency.setValueAtTime(cutoff, t);
    bp.frequency.exponentialRampToValueAtTime(Math.max(40, sweepTo), t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(bp); bp.connect(g); g.connect(master);
    src.start(t); src.stop(t + dur + 0.02);
    liveStops.push({ stop: () => { try { src.stop(0); g.gain.value = 0; } catch { /* noop */ } } });
  }

  const sfx = {
    go:        () => { beep({ f0: 880, f1: 1320, dur: 0.4, type: "square", gain: 0.3 }); },
    count:     (n) => beep({ f0: 300 + (3 - n) * 90, dur: 0.14, gain: 0.22 }),
    drift:     () => { noise({ dur: 0.45, cutoff: 2200, sweepTo: 500, gain: 0.24 }); beep({ f0: 220, f1: 560, dur: 0.35, type: "sawtooth", gain: 0.16 }); },
    pad:       () => beep({ f0: 340, f1: 1500, dur: 0.5, type: "sawtooth", gain: 0.26 }),
    launch:    () => beep({ f0: 240, f1: 900, dur: 0.5, type: "sine", gain: 0.3 }),
    splash:    () => noise({ dur: 0.55, cutoff: 1500, sweepTo: 160, gain: 0.42, q: 0.6 }),
    hit:       () => { noise({ dur: 0.22, cutoff: 500, sweepTo: 90, gain: 0.4, q: 1.4 }); beep({ f0: 130, f1: 60, dur: 0.2, type: "square", gain: 0.25 }); },
    pickup:    () => { beep({ f0: 660, dur: 0.07, gain: 0.2 }); sched(70, () => beep({ f0: 990, dur: 0.09, gain: 0.2 })); },
    use:       () => beep({ f0: 520, f1: 880, dur: 0.16, type: "triangle", gain: 0.24 }),
    missile:   () => { noise({ dur: 0.6, cutoff: 300, sweepTo: 3600, gain: 0.3, q: 3 }); },
    missileHit:() => { noise({ dur: 0.3, cutoff: 2600, sweepTo: 220, gain: 0.45 }); beep({ f0: 90, dur: 0.25, type: "square", gain: 0.3 }); },
    bubble:    () => { beep({ f0: 300, f1: 150, dur: 0.5, type: "sine", gain: 0.28 }); },
    bubblePop: () => { beep({ f0: 900, f1: 1800, dur: 0.1, type: "sine", gain: 0.2 }); noise({ dur: 0.18, cutoff: 4000, sweepTo: 800, gain: 0.18 }); },
    block:     () => { beep({ f0: 700, f1: 1100, dur: 0.22, type: "square", gain: 0.3 }); beep({ f0: 350, f1: 550, dur: 0.3, type: "square", gain: 0.18 }); },
    waveBurst: () => { noise({ dur: 0.7, cutoff: 200, sweepTo: 2600, gain: 0.4, q: 1.2 }); },
    shield:    () => beep({ f0: 400, f1: 1200, dur: 0.4, type: "sine", gain: 0.24 }),
    turbo:     () => { beep({ f0: 200, f1: 2400, dur: 0.7, type: "sawtooth", gain: 0.3 }); noise({ dur: 0.7, cutoff: 400, sweepTo: 5000, gain: 0.2 }); },
    speed:     () => beep({ f0: 260, f1: 1900, dur: 0.55, type: "sawtooth", gain: 0.3 }),
    lap:       () => { [523, 659, 784].forEach((f, i) => sched(i * 90, () => beep({ f0: f, dur: 0.12, type: "square", gain: 0.22 }))); },
    finish:    () => { [523, 659, 784, 1046, 1318].forEach((f, i) => sched(i * 110, () => beep({ f0: f, dur: 0.16, type: "square", gain: 0.26 }))); },
    click:     () => beep({ f0: 600, dur: 0.05, gain: 0.14 }),
    falseStart:() => { noise({ dur: 0.5, cutoff: 700, sweepTo: 60, gain: 0.55, q: 1.6 });
                       beep({ f0: 160, f1: 40, dur: 0.5, type: "square", gain: 0.34 }); },
    // 起步爆缸大爆炸（三层：低频砰炸 + 金属碎裂 + 尾随轰隆烟腔共鸣）
    explosion() {
      if (!ready) return;
      // 1) 砰：低频冲击（方波骤降 + 噪声重锤）
      noise({ dur: 0.4, cutoff: 900, sweepTo: 45, gain: 0.65, q: 1.1 });
      beep({ f0: 140, f1: 32, dur: 0.42, type: "square", gain: 0.4 });
      // 2) 金属零件崩散（中频短促噪声簇，模拟"哗啦"碎片）
      sched(60, () => noise({ dur: 0.3, cutoff: 2400, sweepTo: 300, gain: 0.3, q: 2.2 }));
      sched(140, () => noise({ dur: 0.22, cutoff: 1700, sweepTo: 240, gain: 0.22, q: 2.6 }));
      // 3) 尾随轰隆（烟腔共鸣：低通长尾指数衰减）
      sched(30, () => noise({ dur: 0.9, cutoff: 220, sweepTo: 55, gain: 0.4, q: 0.7 }));
    },
    // 起步规则：完美起跑（上行冲线感扫频 + 短促气口）
    perfectStart:() => { beep({ f0: 300, f1: 1500, dur: 0.45, type: "sawtooth", gain: 0.28 });
                         noise({ dur: 0.3, cutoff: 400, sweepTo: 3200, gain: 0.16, q: 1.1 }); },
    // 倒计时膨胀期"憋压轰隆"：引擎循环临时低吼（非一次性源——不进 liveStops，
    // 由 main 在爆缸/清场时调 engineUpdate 或 stopAllSfx 后的增益回落兜住）
    engineSwell(level) {
      if (!ready || !engine) return;
      const t = ctx.currentTime;
      const k = Math.max(0, Math.min(1, level));
      // 临时抬引擎增益/音高（setTargetAtTime 平滑，膨胀越大吼得越脏）
      engine.g.gain.setTargetAtTime(CONFIG.audio.engineGain * (0.35 + 0.9 * k), t, 0.1);
      engine.osc.frequency.setTargetAtTime(42 + k * 30, t, 0.15);
      engine.lp.frequency.setTargetAtTime(220 + k * 500, t, 0.15);
    },
    reset:     () => { beep({ f0: 500, f1: 200, dur: 0.3, type: "triangle", gain: 0.22 }); },
    trapped:   () => beep({ f0: 180, f1: 70, dur: 0.6, type: "sine", gain: 0.3 }),
  };

  let enabled = loadEnabled();
  function loadEnabled() {
    try { return localStorage.getItem("swr-sound") !== "0"; } catch { return true; }
  }
  // 静音 = master 增益 0（不关 AudioContext，状态机保持简单可靠）
  function applyEnabled() { if (master) master.gain.value = enabled ? loadVolume() : 0; }

  return {
    unlock,
    engineUpdate,
    sfx,
    stopAllSfx() {
      for (const t of timers) clearTimeout(t);
      timers.clear();
      for (const n of liveStops) { try { n.stop(); } catch { /* noop */ } }
      liveStops.length = 0;
    },
    get ready() { return ready; },
    isEnabled: () => enabled,
    setEnabled(v) {
      enabled = !!v;
      try { localStorage.setItem("swr-sound", v ? "1" : "0"); } catch { /* noop */ }
      applyEnabled();
    },
    toggleSound() {
      enabled = !enabled;
      try { localStorage.setItem("swr-sound", enabled ? "1" : "0"); } catch { /* noop */ }
      applyEnabled();
      return enabled;
    },
    setVolume(v) {
      try { localStorage.setItem("swr-volume", String(v)); } catch { /* noop */ }
      if (master) master.gain.value = Math.max(0, Math.min(1, v));
    },
    getVolume: loadVolume,
  };
}
