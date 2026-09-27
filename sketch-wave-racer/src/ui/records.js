// Sketch Wave Racer — 本地记录（Phase 7）：localStorage 封装
// 键：swr-lang（语言）、swr-quality（画质）、swr-best（本赛道最佳成绩 JSON）。
// 全部纯函数 + 异常防御（隐私模式 localStorage 抛错也不能弄崩游戏）。

export const BEST_KEY = "swr-be…Loop";

// 记录一场比赛：playerPlace 名次（1 起）、bestLap 最快圈速秒、finishTime 完赛秒。
// 返回 { newBestLap, newBestTime, newBestPlace, best } —— UI 据此放"新纪录！"。
export function recordRace(place, bestLap, finishTime) {
  const best = loadBest();
  const out = { newBestLap: false, newBestTime: false, newBestPlace: false, best: { ...best } };
  if (typeof bestLap === "number" && (best.bestLap === null || bestLap < best.bestLap)) {
    best.bestLap = bestLap; out.newBestLap = true;
  }
  if (typeof finishTime === "number" && (best.finishTime === null || finishTime < best.finishTime)) {
    best.finishTime = finishTime; out.newBestTime = true;
  }
  if (typeof place === "number" && (best.place === null || place < best.place)) {
    best.place = place; out.newBestPlace = true;
  }
  try { localStorage.setItem(BEST_KEY, JSON.stringify(best)); } catch { /* 隐私模式：本轮内存记录 */ }
  _mem = best;
  out.best = best;
  return out;
}

let _mem = null; // localStorage 不可用时的本轮内存回退

// 测试/设置界面可清内存回退（loadBest 会改读 localStorage 真值）
export function _resetMemoryFallback() { _mem = null; }

export function loadBest() {
  if (_mem) return { ..._mem };
  try {
    const raw = localStorage.getItem(BEST_KEY);
    if (raw) {
      const j = JSON.parse(raw);
      if (j && typeof j === "object") {
        return {
          bestLap: typeof j.bestLap === "number" ? j.bestLap : null,
          finishTime: typeof j.finishTime === "number" ? j.finishTime : null,
          place: typeof j.place === "number" ? j.place : null,
        };
      }
    }
  } catch { /* 损坏 JSON / 禁用存储：回默认 */ }
  return { bestLap: null, finishTime: null, place: null };
}

export function hasAnyBest() {
  const b = loadBest();
  return b.bestLap !== null || b.finishTime !== null || b.place !== null;
}

// 画质持久化（Phase 6 pickQuality 收编至此，单一来源）
export function loadQualityName() {
  try {
    const q = localStorage.getItem("swr-quality");
    return q && CONFIG_QUALITY_NAMES().includes(q) ? q : null;
  } catch { return null; }
}
export function saveQualityName(name) {
  try { localStorage.setItem("swr-quality", name); } catch { /* noop */ }
}

function CONFIG_QUALITY_NAMES() {
  // 延迟 require 避免循环 import（config 不依赖本模块，实际无环；保守写法）
  return ["low", "auto", "high"];
}
