/* ============================================================
 * 模拟数据层：车间 / 设备 / 生产 / 经营 / 营收
 * 所有面板与三维场景共用；tick() 每秒推进一次实时数据
 * ============================================================ */

export const SHOPS = [
  { id: 'stamping',  name: '冲压车间', en: 'Stamping Shop',  color: 0x2f80ff,
    area: 28600, lines: 4, staff: 186, output: 1240, takt: 4.2,  oee: 91.3,
    devices: [
      ['SP-01', '5000T 伺服压力机', 'running'], ['SP-02', '2500T 压力机', 'running'],
      ['SP-03', '1600T 压力机', 'running'],     ['SP-04', '1200T 压力机', 'idle'],
      ['SP-05', '开卷落料线', 'running'],        ['SP-06', '废料输送线', 'running'],
      ['SP-07', '模具库 AGV', 'running'],        ['SP-08', '在线测量机', 'fault'],
    ]},
  { id: 'welding',   name: '焊装车间', en: 'Welding Shop',   color: 0xffa940,
    area: 35200, lines: 3, staff: 320, output: 1180, takt: 51,  oee: 88.7,
    devices: [
      ['WD-01', '机器人集群 A（48台）', 'running'], ['WD-02', '机器人集群 B（48台）', 'running'],
      ['WD-03', '侧围焊接线', 'running'],           ['WD-04', '底板焊接线', 'running'],
      ['WD-05', '调整线', 'idle'],                  ['WD-06', '激光焊接站', 'running'],
      ['WD-07', '在线测量门', 'running'],            ['WD-08', '涂胶检测机器人', 'fault'],
    ]},
  { id: 'painting',  name: '涂装车间', en: 'Painting Shop',  color: 0x19e6a4,
    area: 30400, lines: 2, staff: 142, output: 1150, takt: 55,  oee: 93.5,
    devices: [
      ['PT-01', '前处理电泳线', 'running'], ['PT-02', '烘房 P1', 'running'],
      ['PT-03', '色漆机器人（36台）', 'running'], ['PT-04', '清漆机器人（18台）', 'running'],
      ['PT-05', '烘干炉 P2', 'running'],   ['PT-06', '抛光工位', 'idle'],
      ['PT-07', '废气处理 RTO', 'running'],['PT-08', '检修线', 'running'],
    ]},
  { id: 'assembly',  name: '总装车间', en: 'Assembly Shop',  color: 0x00e5ff,
    area: 46800, lines: 2, staff: 860, output: 1092, takt: 57,  oee: 90.2,
    devices: [
      ['AS-01', '内饰线 A', 'running'],  ['AS-02', '内饰线 B', 'running'],
      ['AS-03', '底盘合装岛', 'running'],['AS-04', '最终线', 'running'],
      ['AS-05', '检测线（转毂/淋雨）', 'running'], ['AS-06', '玻璃安装机器人', 'idle'],
      ['AS-07', '轮胎装配机', 'running'],['AS-08', '加注机', 'fault'],
    ]},
  { id: 'logistics', name: '仓储物流中心', en: 'Logistics', color: 0xb388ff,
    area: 22000, lines: 6, staff: 96, output: 1050, takt: 0, oee: 95.1,
    devices: [
      ['LG-01', '立库堆垛机', 'running'], ['LG-02', 'ANF 无人配送车（24台）', 'running'],
      ['LG-03', '收货月台', 'running'],   ['LG-04', '发运月台', 'running'],
      ['LG-05', 'RFID 门禁', 'running'],  ['LG-06', '分拣线', 'idle'],
    ]},
];

/* -------- 生产经营（分区域） -------- */
export const REGIONS = ['华东区', '华南区', '华北区', '西南区', '华中区', '海外区'];
export const REGION_BIZ = {
  revenue: [86.4, 62.1, 54.8, 38.6, 44.2, 29.7],   // 亿元
  profit:  [9.8, 6.4, 5.1, 3.2, 3.9, 2.1],
  target:  [95, 78, 66, 48, 52, 40],               // 完成率目标
  rate:    [91.0, 79.6, 83.0, 80.4, 85.0, 74.2],   // 完成率 %
  sales:   [21.4, 15.2, 13.6, 9.1, 10.8, 6.7],     // 万辆
};

/* -------- 年度营收 / 销量 -------- */
export const MONTHS = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];
export const REVENUE_YEAR = [6.8,5.4,7.9,8.4,8.9,9.6,9.2,9.8,10.4,10.9,11.6,12.4];
export const PROFIT_YEAR  = [0.7,0.4,0.9,1.0,1.1,1.2,1.1,1.3,1.4,1.5,1.6,1.8];
export const SALES_MODELS = {
  models: ['轿车 A5','SUV X7','MPV M9','纯电 EV3','插混 P8'],
  data:   [[3.2,3.5,4.1,4.4,4.8,5.2,5.5,5.9,6.3,6.8,7.2,7.6],
           [2.1,2.4,2.9,3.3,3.7,4.2,4.5,4.8,5.2,5.6,6.0,6.4],
           [1.2,1.1,1.5,1.7,1.9,2.1,2.2,2.4,2.6,2.8,3.0,3.2],
           [1.8,2.0,2.6,3.0,3.5,4.0,4.4,4.9,5.4,6.0,6.6,7.3],
           [0.9,1.0,1.3,1.5,1.8,2.0,2.3,2.5,2.8,3.1,3.4,3.7]],
};

/* -------- 生产概况（状态 / 计划 / 出入库） -------- */
export const PRODUCTION = {
  plan:      [1180, 1220, 1260, 1300, 1280, 1320],   // 各产品计划
  completed: [1120, 1198, 1207, 1266, 1244, 1301],
  products:  ['A5 轿车','X7 SUV','M9 MPV','EV3 纯电','P8 插混','V1 轻客'],
  status:    { done: 3218, wip: 486, stuck: 42, stock: 1860 },  // 完成/在制/滞留/库存
  inOut:     { days: [], out: [], in: [] },
};
(function seedInOut(){
  for (let i = 11; i >= 0; i--) {
    const d = new Date(Date.now() - i * 864e5);
    PRODUCTION.inOut.days.push(`${d.getMonth()+1}/${d.getDate()}`);
    PRODUCTION.inOut.out.push(900 + Math.round(Math.random()*420));
    PRODUCTION.inOut.in.push(780 + Math.round(Math.random()*380));
  }
})();

/* -------- 告警 / 播报池 -------- */
export const ALARM_POOL = [
  ['err',  '焊装车间 WD-08 涂胶检测机器人 视觉标定偏差超限'],
  ['err',  '总装车间 AS-08 加注机 压力异常，已联锁停机'],
  ['warn', '冲压车间 SP-08 在线测量机 通讯超时重试中'],
  ['warn', '涂装车间 P2 烘房 温度波动 ±3.2℃'],
  ['info', '总装内饰线 B 完成班次切换，节拍恢复 57s'],
  ['info', '物流中心 ANF-12 完成 36 托盘配送任务'],
  ['warn', '立库堆垛机 2# 巷道 激光通讯抖动'],
  ['info', '焊装机器人 WD-02 集群 完成焊点数 24,318'],
];

export const TICKER_POOL = [
  '总装一线 第 <b>1,092</b> 台整车下线（车型 EV3 / 订单 #20260911-117）',
  '冲压车间 今日板料冲压 <b>12,400</b> 件，一次合格率 <b>99.2%</b>',
  '焊装车间 白车身下线 <b>1,180</b> 台，在线质量门全通过',
  '涂装车间 颜色排产切换完成：极光银 → 曜石黑',
  '物流中心 今日发运 <b>1,050</b> 台，在途 <b>86</b> 台',
  '能源中心 单位产值能耗较昨日 <b>-2.4%</b>',
  '品质部 整车奥迪特平均得分 <b>1.8</b>（目标 ≤2.0）',
];

/* -------- 工位状态（右侧格子） -------- */
export const STATIONS = ['内A01','内A02','内A03','内A04','内A05','内A06',
  '底01','底02','底03','底04','底05','底06',
  '最01','最02','最03','最04','最05','检01'];

/* ============ 运行时状态（tick 会实时改写） ============ */
export const runtime = {
  todayOutput: 1092,
  planToday: 1320,
  yieldRate: 99.2,
  energy: 3842,
  agvActive: 24,
  oee: 90.9,
  alarms: ALARM_POOL.slice(0, 4).map(([lv, msg]) => ({
    level: lv, msg, time: fmtTime(new Date(Date.now() - Math.random() * 3600e3)),
  })),
  stations: STATIONS.map(s => ({
    name: s, state: Math.random() < .78 ? 'run' : (Math.random() < .5 ? 'idle' : 'err'),
  })),
  shopOutput: Object.fromEntries(SHOPS.map(s => [s.id, s.output])),
};

export function fmtTime(d) {
  return d.toTimeString().slice(0, 8);
}

/** 每秒推进一次模拟数据（由 main.js 的循环调用） */
export function tick() {
  // 今日产量缓慢增长
  if (Math.random() < 0.35 && runtime.todayOutput < runtime.planToday) runtime.todayOutput++;
  runtime.energy += Math.random() * 2;
  runtime.yieldRate = 99.0 + Math.random() * 0.35;
  // 各车间产量小幅波动
  for (const s of SHOPS) runtime.shopOutput[s.id] = s.output + Math.round((Math.random() - 0.5) * 24);
  // 工位状态偶尔切换
  const i = Math.floor(Math.random() * runtime.stations.length);
  const roll = Math.random();
  runtime.stations[i].state = roll < .75 ? 'run' : roll < .9 ? 'idle' : 'err';
  // 生产状态数据波动
  PRODUCTION.status.wip = 470 + Math.round(Math.random() * 40);
  PRODUCTION.status.stuck = Math.max(8, 42 + Math.round((Math.random() - .5) * 14));
  PRODUCTION.status.done += Math.random() < .4 ? 1 : 0;
  PRODUCTION.status.stock += Math.random() < .3 ? 1 : 0;
}

/** 随机产出一条新告警（低频调用） */
export function pushAlarm() {
  const [lv, msg] = ALARM_POOL[Math.floor(Math.random() * ALARM_POOL.length)];
  runtime.alarms.unshift({ level: lv, msg, time: fmtTime(new Date()) });
  if (runtime.alarms.length > 6) runtime.alarms.pop();
}
