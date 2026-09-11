/* ============================================================
 * 主入口：三维场景 + 大屏面板 编排
 *  视图模式：
 *   · factory   工厂外部全景（五大车间、物流动画）
 *   · interior  某车间室内空间（产线动画 + Ghost 外壳）
 * ============================================================ */
import * as THREE from 'three';
import { App } from './scene/app.js';
import { buildFactory } from './scene/factory.js';
import { buildShops } from './scene/workshops.js';
import { SHOPS, runtime } from './data.js';
import {
  renderOverview, renderBiz, renderProduction,
  renderShopTabs, renderShopDetail, currentShop, renderEquip,
} from './ui/charts.js';
import {
  startClock, renderAlarms, renderStations, renderMiniKpi,
  buildTicker, tickHud, maybeAlarm,
} from './ui/hud.js';

/* ---------------- 初始化 ---------------- */
const app = new App(document.getElementById('canvas3d'));
app.resize();

const factory = buildFactory(app.scene);
const ws = buildShops(app.scene, SHOPS);

let mode = 'factory';          // factory | interior
let page = 'overview';         // overview | biz | prod | shop | equip
let interiorId = null;         // 当前室内车间（标签分组 / 透视状态联动）

// 车间室内模型放到其厂区坐标上；外壳 Ghost 半透明（外部透视内部产线，进入室内后不渲染外墙）
for (const s of SHOPS) {
  const L = factory.layout[s.id];
  const shop = ws.shops[s.id];
  if (!shop) continue;
  shop.group.position.set(L.x, 0, L.z);
}

// 设备拾取注册表：室外 = 五大建筑（厂房外壳不可拾取，避免与内部设备冲突）
const outdoorPickables = [];
for (const [id, shell] of Object.entries(factory.shells)) {
  shell.traverse(o => { o.userData.noPick = true; });
  shell.userData.equip = {
    kind: 'building', shopId: id,
    name: factory.layout[id].label,
    shop: SHOPS.find(s => s.id === id),
  };
  outdoorPickables.push(shell);
}

const labels = [];
const _labelGroups = { factory: [], interior: new Map() };
function addLabel(obj, text, cls, offsetY, clickable, group) {
  const el = document.createElement('div');
  el.className = 'bubble' + (cls ? ' ' + cls : '');
  el.textContent = text;
  el.style.display = 'none';
  if (clickable) el.onclick = clickable;
  document.getElementById('labels').appendChild(el);
  const rec = { obj, el, offsetY, visible: true };
  if (group === 'interior') {
    if (!_labelGroups.interior.has(interiorId)) _labelGroups.interior.set(interiorId, []);
    _labelGroups.interior.get(interiorId).push(rec);
  } else _labelGroups.factory.push(rec);
  return el;
}
const _v = new THREE.Vector3();
function updateLabels() {
  const rect = app.canvas.getBoundingClientRect();
  const inPool = mode === 'factory' ? _labelGroups.factory
    : (_labelGroups.interior.get(interiorId) || []);
  const groupShown = mode !== 'factory' && ws.shops[interiorId] && ws.shops[interiorId].group.visible;
  for (const l of inPool) {
    if (!groupShown && mode !== 'factory') { l.el.style.display = 'none'; continue; }
    if (!isShown(l.obj)) { l.el.style.display = 'none'; continue; }
    l.obj.getWorldPosition(_v); _v.y += l.offsetY;
    const p = _v.clone().project(app.camera);
    if (p.z > 1 || p.x < -1.1 || p.x > 1.1 || p.y < -1.1 || p.y > 1.1) {
      l.el.style.display = 'none'; continue;
    }
    l.el.style.display = 'block';
    l.el.style.left = ((p.x + 1) / 2 * rect.width) + 'px';
    l.el.style.top = ((1 - p.y) / 2 * rect.height) + 'px';
  }
  // 非当前池的标签一律隐藏
  const others = mode === 'factory'
    ? [..._labelGroups.interior.values()].flat()
    : [..._labelGroups.factory, ...[..._labelGroups.interior.entries()]
        .filter(([k]) => k !== interiorId).flatMap(([, v]) => v)];
  for (const l of others) l.el.style.display = 'none';
}
/** 对象链是否全部可见 */
function isShown(o) { let c = o; while (c) { if (!c.visible) return false; c = c.parent; } return true; }

// 车间名标签（室外）+ 每车间室内一盏补光（远景剪影车间动画冻结，节能）
for (const [id, shell] of Object.entries(factory.shells)) {
  const name = factory.layout[id].label;
  addLabel(shell, '▣ ' + name, '', factory.layout[id].h + 2,
    () => enterShop(id));
}
  // 故障设备 + 关键设备标签（仅室内视图显示）
  for (const s of SHOPS) {
    const shop = ws.shops[s.id]; if (!shop) continue;
    interiorId = s.id;   // 临时用于标签分组
    for (const g of shop.equip) {
      const d = g.userData.equip;
      if (!d) continue;
      if (d.status === 'fault') {
        addLabel(g, `${d.code} ${d.name}`, 'err', 2.2,
          () => showEquipPopup(d, 120, 90), 'interior');
      } else if (['SP-01', 'WD-06', 'PT-03', 'AS-03', 'LG-01'].includes(d.code)) {
        const el = addLabel(g, `${d.code} ${d.name}`, 'key', 2.4,
          () => showEquipPopup(d, 120, 90), 'interior');
        el.style.opacity = '.75'; el.style.fontSize = '11px';
      }
    }
  }
  interiorId = null;

/* ---------------- 设备信息浮窗 ---------------- */
const popup = document.getElementById('equip-popup');
document.getElementById('popup-close').onclick = () => popup.classList.add('hidden');
function showEquipPopup(d, x, y) {
  if (!d) { popup.classList.add('hidden'); return; }
  document.getElementById('popup-title').textContent = `${d.shop} · ${d.code}`;
  const stTxt = { running: '<b style="color:#19e6a4">运行中</b>', idle: '<b style="color:#ffc53d">待机</b>', fault: '<b style="color:#ff4d6b">故障</b>' };
  document.getElementById('popup-body').innerHTML = `
    <div class="row"><span>设备名称</span><b>${d.name}</b></div>
    <div class="row"><span>运行状态</span>${stTxt[d.status]}</div>
    <div class="row"><span>综合效率 OEE</span><b>${d.oee.toFixed(1)}%</b></div>
    <div class="row"><span>本体温度</span><b>${d.temp.toFixed(1)}℃</b></div>
    <div class="row"><span>连续运行</span><b>${d.run.toFixed(1)}h</b></div>
    <div class="row"><span>今日加工件</span><b>${d.parts.toLocaleString()}</b></div>`;
  popup.classList.remove('hidden');
  const vp = document.getElementById('viewport').getBoundingClientRect();
  popup.style.left = Math.min(x + 14, vp.width - 268) + 'px';
  popup.style.top = Math.min(y + 10, vp.height - 220) + 'px';
}
app.onClickEquip = (d, x, y) => {
  if (!d) { popup.classList.add('hidden'); return; }
  if (d.kind === 'building') { enterShop(d.shopId); return; }
  if (mode !== 'interior') return;
  showEquipPopup(d, x, y);
};

/* ---------------- 视图模式与切换 ---------------- */
const crumb = document.getElementById('breadcrumb');
const labelsEl = document.getElementById('labels');

function setPickTargets() {
  if (mode === 'factory') {
    app.pickTargets = outdoorPickables;
  } else {
    const shop = ws.shops[currentShopId()];
    app.pickTargets = shop ? shop.equip : [];
  }
}
function currentShopId() {
  return mode === 'interior' ? interiorId : currentShop();
}

const camHome = { pos: [-150, 130, 170], target: [10, 4, 0] };

/** 全景机位巡航（空闲自动环绕） */
let idleT = 0, cruise = false;
app.controls.addEventListener('start', () => { idleT = 0; cruise = false; });

function flyFactory(near) {
  mode = 'factory';
  if (interiorId) { ws.setGhost(interiorId, false); interiorId = null; }
  ws.showAvatars();
  popup.classList.add('hidden');
  crumb.classList.remove('show');
  app.flyTo(camHome.pos, camHome.target, 1600, () => { setPickTargets(); idleT = 0; });
}

function enterShop(id) {
  if (!ws.shops[id]) return;
  const prev = interiorId;
  if (prev && prev !== id) { ws.setGhost(prev, false); }
  mode = 'interior'; interiorId = id;
  ws.setFocused(id);
  const L = factory.layout[id];
  const d = SHOPS.find(s => s.id === id);
  crumb.textContent = '工厂总览 / ' + d.name + '室内 ✕';
  crumb.classList.add('show');
  popup.classList.add('hidden');
  // 一镜到底：掠到建筑近旁 → 穿墙落入车间内部（真实室内组在第二段落位时显形）
  app.flyTo([L.x + 52, 26, L.z + 50], [L.x, 4, L.z], 900, () => {
    ws.revealGroup(id);
    const CAM = {
      stamping:  [[-24, 6.5, -12], [10, 2.5, 4]],
      welding:   [[-22, 6.5, -12], [10, 2.5, 4]],
      painting:  [[-26, 6.5, -14], [6, 2.5, 6]],
      assembly:  [[-28, 6.5, -14], [8, 2.5, 6]],
      logistics: [[-18, 6.0, -10], [6, 2.5, 2]],
    }[id];
    app.flyTo([L.x + CAM[0][0], CAM[0][1], L.z + CAM[0][2]],
              [L.x + CAM[1][0], CAM[1][1], L.z + CAM[1][2]], 1500, () => {
      ws.setGhost(id, true);        // 到位：墙转暗顶氛围 + 邻区隐藏
      setPickTargets();
    });
  });
  // 同步切到“车间概况”面板
  switchPage('shop', true);
  shopTabPick(id);
}
crumb.onclick = () => flyFactory();

/* ---------------- 页面（面板）切换 ---------------- */
function switchPage(p, fromShopFlow) {
  page = p;
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.view === p));
  document.querySelectorAll('.panel-page').forEach(s => s.classList.toggle('hidden', s.dataset.page !== p));
  if (p === 'overview') renderOverview();
  if (p === 'biz') renderBiz();
  if (p === 'prod') renderProduction();
  if (p === 'shop') { renderShopDetail(); }
  if (p === 'equip') renderEquip();
  // 页面联动相机（可选：经营/生产时缓慢环绕）
  if (mode === 'factory' && !fromShopFlow) {
    // 停留当前机位，不强制飞行
  }
}
document.querySelectorAll('.nav-btn').forEach(b =>
  b.addEventListener('click', () => switchPage(b.dataset.view)));

// 车间 tab 联动进入
function shopTabPick(id) {
  const tabs = document.querySelectorAll('.shop-tab');
  const idx = SHOPS.findIndex(s => s.id === id);
  tabs.forEach((t, i) => t.classList.toggle('active', i === idx));
}
renderShopTabs(id => { if (mode === 'interior' && id !== interiorId) enterShop(id); });
document.getElementById('btn-enter-shop').onclick = () => enterShop(currentShop());

/* 生产流程链点击 → 进入对应车间 */
document.querySelectorAll('.flow-node').forEach(n =>
  n.addEventListener('click', () => enterShop(n.dataset.shop)));

/* ---------------- 主循环 ---------------- */
let last = performance.now(), hudAcc = 0, alarmAcc = 0, dataAcc = 0;
import('./data.js').then(({ tick }) => {
  function loop(now) {
    const dt = Math.min((now - last) / 1000, .1); last = now;
    const t = now / 1000;
    dataAcc += dt; if (dataAcc > 1) { dataAcc = 0; tick(); }
    hudAcc += dt; if (hudAcc > 2.5) { hudAcc = 0; tickHud(); if (page === 'shop') renderShopDetail(); if (page === 'equip') renderEquip(); }
    alarmAcc += dt; if (alarmAcc > 14) { alarmAcc = 0; maybeAlarm(); }

    factory.update(t, dt);
    ws.update(t, dt);
    // 全景空闲巡航：20s 无操作后缓慢环绕厂区
    if (mode === 'factory' && !app.flight) {
      idleT += dt;
      if (idleT > 20) {
        cruise = true;
        const a = t * .045, R = 250;
        const tx = 10 + Math.cos(a) * R, tz = Math.sin(a) * R, k = Math.min(dt * .9, .08);
        app.camera.position.x += (tx - app.camera.position.x) * k;
        app.camera.position.z += (tz - app.camera.position.z) * k;
        app.camera.position.y += (120 - app.camera.position.y) * k;
        app.controls.target.set(10, 4, 0);
      }
    }
    app.update(dt);
    updateLabels();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
});

/* ---------------- 首屏 ---------------- */
ws.showAvatars();
ws.setFocused('assembly');     // 默认聚焦总装车间（半透视展示内部产线）
startClock(); buildTicker(); renderAlarms(); renderStations(); renderMiniKpi();
switchPage('overview');
renderEquip();
// 开场：从高空俯冲进入全景
app.camera.position.set(-260, 320, 340);
app.flyTo(camHome.pos, camHome.target, 2600, setPickTargets);
