/* ============================================================
 * ECharts 面板模块：总览 / 经营 / 生产 / 车间 / 设备
 * ============================================================ */
import {
  SHOPS, REGIONS, REGION_BIZ, MONTHS, REVENUE_YEAR, PROFIT_YEAR,
  SALES_MODELS, PRODUCTION, runtime,
} from '../data.js';

const AXIS = {
  axisLine: { lineStyle: { color: '#1d4a7d' } },
  axisLabel: { color: '#6e93c4', fontSize: 10 },
  splitLine: { lineStyle: { color: 'rgba(40,100,180,.18)' } },
};
const TIP = {
  backgroundColor: 'rgba(4,18,44,.92)', borderColor: '#1e90ff',
  textStyle: { color: '#cfe8ff', fontSize: 11 },
};
const LEG = { textStyle: { color: '#8fb4dd', fontSize: 10 }, itemWidth: 10, itemHeight: 7, top: 0 };
const GRID = { left: 38, right: 12, top: 26, bottom: 20 };
const grad = (c1, c2) => new echarts.graphic.LinearGradient(0, 0, 0, 1,
  [{ offset: 0, color: c1 }, { offset: 1, color: c2 }]);

const registry = {};
function mount(id, opt) {
  const el = document.getElementById(id);
  if (!el) return;
  let c = registry[id];
  if (!c || c.isDisposed()) { c = echarts.init(el); registry[id] = c; }
  c.setOption(opt, true);
  return c;
}

/* ================= 总览 ================= */
export function renderOverview() {
  mount('chart-revenue', {
    tooltip: { ...TIP, trigger: 'axis' },
    legend: { ...LEG, data: ['营收(亿元)', '利润(亿元)'] },
    grid: GRID,
    xAxis: { type: 'category', data: MONTHS, ...AXIS },
    yAxis: { type: 'value', ...AXIS },
    series: [
      { name: '营收(亿元)', type: 'bar', barWidth: 9, data: REVENUE_YEAR,
        itemStyle: { color: grad('#39a7ff', '#0c3a7a'), borderRadius: [3, 3, 0, 0] } },
      { name: '利润(亿元)', type: 'line', smooth: true, symbol: 'none', data: PROFIT_YEAR,
        lineStyle: { color: '#00e5ff', width: 2 },
        areaStyle: { color: grad('rgba(0,229,255,.35)', 'rgba(0,229,255,0)') } },
    ],
  });
  mount('chart-sales', {
    tooltip: { ...TIP, trigger: 'axis' },
    legend: { ...LEG, data: SALES_MODELS.models, type: 'scroll' },
    grid: { ...GRID, top: 40 },
    xAxis: { type: 'category', data: MONTHS, ...AXIS },
    yAxis: { type: 'value', name: '万辆', nameTextStyle: { color: '#6e93c4', fontSize: 9 }, ...AXIS },
    series: SALES_MODELS.models.map((m, i) => ({
      name: m, type: 'line', smooth: true, symbol: 'none', stack: 's',
      areaStyle: { opacity: .22 }, lineStyle: { width: 1.5 },
      data: SALES_MODELS.data[i],
    })),
    color: ['#2f80ff', '#19e6a4', '#ffc53d', '#00e5ff', '#ff6e9e'],
  });
}

/* ================= 经营概况 ================= */
export function renderBiz() {
  const ov = document.getElementById('kpi-overall');
  const total = REGION_BIZ.revenue.reduce((a, b) => a + b, 0);
  const profit = REGION_BIZ.profit.reduce((a, b) => a + b, 0);
  const sales = REGION_BIZ.sales.reduce((a, b) => a + b, 0);
  ov.innerHTML = [
    ['年营收', total.toFixed(1), '亿元', ''], ['年利润', profit.toFixed(1), '亿元', 'g'],
    ['年销量', sales.toFixed(1), '万辆', ''], ['毛利率', (profit / total * 100).toFixed(1), '%', 'g'],
    ['同比增长', '18.6', '%', 'g'], ['回款率', '96.4', '%', 'y'],
  ].map(([l, n, u, c]) =>
    `<div class="kpi ${c}"><div class="num">${n}<small>${u}</small></div><div class="lab">${l}</div></div>`).join('');

  mount('chart-region', {
    tooltip: { ...TIP, trigger: 'axis' },
    legend: { ...LEG, data: ['营收(亿元)', '利润(亿元)'] },
    grid: GRID,
    xAxis: { type: 'category', data: REGIONS, ...AXIS },
    yAxis: { type: 'value', ...AXIS },
    series: [
      { name: '营收(亿元)', type: 'bar', barWidth: 12, data: REGION_BIZ.revenue,
        itemStyle: { color: grad('#39a7ff', '#0c3a7a'), borderRadius: [3, 3, 0, 0] },
        label: { show: true, position: 'top', color: '#8fb4dd', fontSize: 9 } },
      { name: '利润(亿元)', type: 'bar', barWidth: 12, data: REGION_BIZ.profit,
        itemStyle: { color: grad('#19e6a4', '#0a5c48'), borderRadius: [3, 3, 0, 0] } },
    ],
  });
  mount('chart-region-rate', {
    tooltip: { ...TIP },
    grid: { ...GRID, left: 52 },
    xAxis: { type: 'value', max: 100, ...AXIS },
    yAxis: { type: 'category', data: REGIONS, ...AXIS },
    series: [{
      type: 'bar', barWidth: 10, data: REGION_BIZ.rate,
      showBackground: true, backgroundStyle: { color: 'rgba(30,70,130,.3)' },
      itemStyle: { color: v => v.value > 85 ? grad('#19e6a4', '#0a5c48') : v.value > 78 ? grad('#39a7ff', '#0c3a7a') : grad('#ffc53d', '#7a5a10'),
        borderRadius: 5 },
      label: { show: true, position: 'right', formatter: '{c}%', color: '#cfe8ff', fontSize: 10 },
    }],
  });
}

/* ================= 生产概况 ================= */
export function renderProduction() {
  mount('chart-plan', {
    tooltip: { ...TIP, trigger: 'axis' },
    legend: { ...LEG, data: ['计划', '完成'] },
    grid: GRID,
    xAxis: { type: 'category', data: PRODUCTION.products, ...AXIS, axisLabel: { ...AXIS.axisLabel, interval: 0 } },
    yAxis: { type: 'value', ...AXIS },
    series: [
      { name: '计划', type: 'bar', barWidth: 8, data: PRODUCTION.plan,
        itemStyle: { color: grad('#39a7ff', '#0c3a7a'), borderRadius: [3, 3, 0, 0] } },
      { name: '完成', type: 'bar', barWidth: 8, data: PRODUCTION.completed,
        itemStyle: { color: grad('#19e6a4', '#0a5c48'), borderRadius: [3, 3, 0, 0] } },
    ],
  });
  const st = PRODUCTION.status;
  mount('chart-status', {
    tooltip: { ...TIP },
    legend: { ...LEG, bottom: 0, top: 'auto' },
    series: [{
      type: 'pie', radius: ['52%', '72%'], center: ['50%', '46%'],
      label: { color: '#cfe8ff', fontSize: 10, formatter: '{b}\n{c}' },
      labelLine: { lineStyle: { color: '#2a5a92' } },
      data: [
        { name: '已完成', value: st.done, itemStyle: { color: '#19e6a4' } },
        { name: '生产中', value: st.wip, itemStyle: { color: '#2f80ff' } },
        { name: '滞留', value: st.stuck, itemStyle: { color: '#ff4d6b' } },
        { name: '在库', value: st.stock, itemStyle: { color: '#ffc53d' } },
      ],
    }, {
      type: 'pie', radius: ['0%', '44%'], center: ['50%', '46%'], silent: true,
      label: { show: true, position: 'center', formatter: '产品\n状态', color: '#6e93c4', fontSize: 11 },
      data: [{ value: 1, itemStyle: { color: 'rgba(20,50,100,.4)' } }],
    }],
  });
  mount('chart-stock', {
    tooltip: { ...TIP, trigger: 'axis' },
    legend: { ...LEG, data: ['入库', '出库'] },
    grid: { ...GRID, top: 30 },
    xAxis: { type: 'category', data: PRODUCTION.inOut.days, ...AXIS },
    yAxis: { type: 'value', ...AXIS },
    series: [
      { name: '入库', type: 'line', smooth: true, symbol: 'none', data: PRODUCTION.inOut.in,
        lineStyle: { color: '#00e5ff', width: 2 },
        areaStyle: { color: grad('rgba(0,229,255,.3)', 'rgba(0,229,255,0)') } },
      { name: '出库', type: 'line', smooth: true, symbol: 'none', data: PRODUCTION.inOut.out,
        lineStyle: { color: '#ffc53d', width: 2 },
        areaStyle: { color: grad('rgba(255,197,61,.25)', 'rgba(255,197,61,0)') } },
    ],
  });
}

/* ================= 车间概况 ================= */
let shopSel = SHOPS[0].id;
export function renderShopTabs(onPick) {
  const el = document.getElementById('shop-tabs');
  el.innerHTML = SHOPS.map(s =>
    `<div class="shop-tab ${s.id === shopSel ? 'active' : ''}" data-id="${s.id}">${s.name}</div>`).join('');
  el.querySelectorAll('.shop-tab').forEach(t => t.onclick = () => {
    shopSel = t.dataset.id;
    renderShopTabs(onPick); renderShopDetail(); onPick && onPick(shopSel);
  });
}
export function currentShop() { return shopSel; }

export function renderShopDetail() {
  const s = SHOPS.find(x => x.id === shopSel);
  document.getElementById('shop-detail-title').textContent =
    `${s.name} · ${s.en}`;
  const out = runtime.shopOutput[s.id];
  document.getElementById('shop-detail').innerHTML = `
    <div class="sd-row"><span class="k">占地面积</span><span class="v">${s.area.toLocaleString()} ㎡</span></div>
    <div class="sd-row"><span class="k">产线数量 / 在岗人员</span><span class="v">${s.lines} 条 / ${s.staff} 人</span></div>
    <div class="sd-row"><span class="k">今日产量（台套）</span><span class="v up">${out}</span></div>
    <div class="sd-row"><span class="k">生产节拍</span><span class="v">${s.takt ? s.takt + ' JPH/s' : '—'}</span></div>
    <div class="sd-row"><span class="k">设备综合效率 OEE</span><span class="v ${s.oee > 90 ? 'up' : 'down'}">${s.oee}%</span></div>
    <div class="bar-line"><i style="width:${s.oee}%"></i></div>
    <div class="sd-row"><span class="k">一次合格率</span><span class="v up">${(97.5 + Math.random() * 2).toFixed(1)}%</span></div>
    <div class="sd-row"><span class="k">能耗强度（tce/万元）</span><span class="v">${(0.11 + Math.random() * .04).toFixed(3)}</span></div>
    <div class="sd-row"><span class="k">当日故障停机</span><span class="v down">${(Math.random() * 40).toFixed(0)} min</span></div>`;

  // 车间产量节拍趋势（随机游走）
  const hrs = Array.from({ length: 12 }, (_, i) => `${8 + i}:00`);
  let base = out / 9;
  const data = hrs.map(() => { base = Math.max(20, base + (Math.random() - .45) * 22); return Math.round(base); });
  mount('chart-shop', {
    tooltip: { ...TIP, trigger: 'axis' },
    grid: GRID,
    xAxis: { type: 'category', data: hrs, ...AXIS },
    yAxis: { type: 'value', ...AXIS },
    series: [{
      name: s.name + ' 产量', type: 'bar', data, barWidth: 10,
      itemStyle: { color: `#${s.color.toString(16).padStart(6, '0')}`, borderRadius: [3, 3, 0, 0], opacity: .9 },
      markLine: {
        silent: true, symbol: 'none',
        lineStyle: { color: '#ffc53d', type: 'dashed' },
        label: { color: '#ffc53d', fontSize: 9, formatter: '目标 {c}' },
        data: [{ yAxis: Math.round(out / 9.5) }],
      },
    }],
  });
}

/* ================= 设备概况 ================= */
export function renderEquip() {
  const total = SHOPS.reduce((a, s) => a + s.devices.length, 0);
  let run = 0, idle = 0, fault = 0;
  SHOPS.forEach(s => s.devices.forEach(d => {
    if (d[2] === 'running') run++; else if (d[2] === 'idle') idle++; else fault++;
  }));
  document.getElementById('kpi-equip').innerHTML = [
    ['车间数量', SHOPS.length - 1 + ' + 1', '', ''], ['设备总数', total, '台', ''],
    ['运行中', run, '台', 'g'], ['待机', idle, '台', 'y'], ['故障', fault, '台', 'r'],
    ['平均 OEE', runtime.oee.toFixed(1), '%', ''],
  ].map(([l, n, u, c]) =>
    `<div class="kpi ${c}"><div class="num">${n}<small>${u}</small></div><div class="lab">${l}</div></div>`).join('');

  mount('chart-equip-bar', {
    tooltip: { ...TIP, trigger: 'axis' },
    legend: { ...LEG, data: ['运行', '待机', '故障'] },
    grid: GRID,
    xAxis: { type: 'category', data: SHOPS.map(s => s.name.slice(0, 2)), ...AXIS },
    yAxis: { type: 'value', ...AXIS },
    series: ['running', 'idle', 'fault'].map((st, i) => ({
      name: ['运行', '待机', '故障'][i], type: 'bar', stack: 'e', barWidth: 16,
      data: SHOPS.map(s => s.devices.filter(d => d[2] === st).length),
      itemStyle: { color: ['#19e6a4', '#ffc53d', '#ff4d6b'][i], borderRadius: i === 2 ? [3, 3, 0, 0] : 0 },
    })),
  });
  mount('chart-equip-pie', {
    tooltip: { ...TIP },
    legend: { ...LEG, bottom: 0, top: 'auto' },
    series: [{
      type: 'pie', radius: ['46%', '68%'], center: ['50%', '44%'], roseType: 'radius',
      label: { color: '#cfe8ff', fontSize: 10, formatter: '{b} {c}台' },
      labelLine: { lineStyle: { color: '#2a5a92' } },
      data: [
        { name: '运行', value: run, itemStyle: { color: '#19e6a4' } },
        { name: '待机', value: idle, itemStyle: { color: '#ffc53d' } },
        { name: '故障', value: fault, itemStyle: { color: '#ff4d6b' } },
      ],
    }],
  });
}

export function resizeCharts() {
  for (const c of Object.values(registry)) if (c && !c.isDisposed()) c.resize();
}
addEventListener('resize', resizeCharts);
