/* ============================================================
 * 大屏 HUD：时钟 / 告警 / 工位状态 / 播报 / 关键指标
 * ============================================================ */
import { runtime, pushAlarm, TICKER_POOL, SHOPS } from '../data.js';

const LV = { err: ['故障', 'err'], warn: ['预警', 'warn'], info: ['生产', 'info'] };

export function startClock() {
  const dEl = document.getElementById('clock-date');
  const tEl = document.getElementById('clock-time');
  const upd = () => {
    const d = new Date();
    dEl.textContent = d.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
    tEl.textContent = d.toTimeString().slice(0, 8);
  };
  upd(); setInterval(upd, 1000);
}

export function renderAlarms() {
  document.getElementById('alarm-list').innerHTML = runtime.alarms.map(a =>
    `<li><span class="tag ${a.level}">${LV[a.level][0]}</span><span>${a.msg}</span><span class="time">${a.time}</span></li>`
  ).join('');
}

export function renderStations() {
  const LBL = { run: '运行', idle: '待机', err: '故障' };
  document.getElementById('station-grid').innerHTML = runtime.stations.map(s =>
    `<div class="sta ${s.state}"><b></b>${s.name}<span style="display:none">${LBL[s.state]}</span></div>`
  ).join('');
}

export function renderMiniKpi() {
  const donePct = (runtime.todayOutput / runtime.planToday * 100).toFixed(1);
  document.getElementById('mini-kpi').innerHTML = `
    <div class="mk"><em>今日下线整车</em><b>${runtime.todayOutput} <small>台</small></b></div>
    <div class="mk"><em>计划完成率</em><b>${donePct} <small>%</small></b></div>
    <div class="mk"><em>一次合格率</em><b>${runtime.yieldRate.toFixed(1)} <small>%</small></b></div>
    <div class="mk"><em>AGV 在线</em><b>${runtime.agvActive} <small>台</small></b></div>
    <div class="mk"><em>能耗（kWh×10³）</em><b>${Math.round(runtime.energy)} <small></small></b></div>
    <div class="mk"><em>平均 OEE</em><b>${runtime.oee.toFixed(1)} <small>%</small></b></div>`;
}

let tickerBuilt = false;
export function buildTicker() {
  if (tickerBuilt) return; tickerBuilt = true;
  const html = TICKER_POOL.map(t => `<span>◆ ${t}</span>`).join('');
  document.getElementById('ticker-inner').innerHTML = html + html;
}

/** 周期推进 HUD（约 2.5s 一次） */
export function tickHud() {
  renderAlarms(); renderStations(); renderMiniKpi();
}

/** 低频产生新告警 */
export function maybeAlarm() {
  if (Math.random() < .5) pushAlarm();
  renderAlarms();
}
