/**
 * main.js — 装配入口（Phase 3：港口 + Kenney 模型上球）
 *
 * 星球本体 = 海洋 + 程序化陆地 + 云层 + 大气辉光 + 星空 + 昼夜光照
 *   + 可旋转缩放 + 平滑视角切换 + 右下角真 3D Mini Globe（可点击导航）
 * Phase 3：加载实测 Kenney 模型 → 港口聚落 + 程序化植被（全部沿球面法线站立）
 */
import * as THREE from 'three';
import { SceneManager } from './core/SceneManager.js';
import { RendererManager } from './core/RendererManager.js';
import { CameraManager, ViewMode } from './core/CameraManager.js';
import { Planet } from './planet/Planet.js';
import { createStarField } from './planet/Stars.js';
import { MiniGlobe } from './ui/MiniGlobe.js';
import { PLANET, CAMERA, PORTS, MVP_MODELS, CHARACTER_MODELS, PET_MODELS, SHIPS, resolvePortsOnLand } from './config.js';
import { AssetManager } from './core/AssetManager.js';
import { TerrainSampler } from './world/TerrainSampler.js';
import { NatureManager } from './world/NatureManager.js';
import { PortManager } from './world/PortManager.js';
import { Interaction } from './ui/Interaction.js';
import { RouteManager } from './world/RouteManager.js';
import { ShipManager } from './world/ShipManager.js';
import { CharacterManager } from './world/CharacterManager.js';
import { PetManager } from './world/PetManager.js';
import { FerryManager } from './world/FerryManager.js';
import { CivilianManager } from './world/CivilianManager.js';
import { GroundOccupancy } from './world/GroundOccupancy.js';
import { CombatFx } from './world/systems/CombatFx.js';
import { HudLayer } from './ui/HudLayer.js';
import { AudioFx } from './utils/AudioFx.js';
import { vector3ToLatLon } from './utils/GeoUtils.js';
import { EntityRegistry } from './world/systems/EntityRegistry.js';
import { DamageSystem } from './world/systems/DamageSystem.js';
import { EnvironmentEventSystem } from './world/systems/EnvironmentEventSystem.js';

const canvas = document.getElementById('gl');
const loadingEl = document.getElementById('loading');
const loadTxt = document.getElementById('loadtxt');
const barEl = document.querySelector('#bar > i');
const statsEl = document.getElementById('stats');
const merchantListEl = document.getElementById('merchant-list');
const miniFrame = document.getElementById('mini-frame');
const hintEl = document.getElementById('hint');

// ── 核心三件套 ────────────────────────────────────────────────
const rendererManager = new RendererManager(canvas);
const sceneManager = new SceneManager();
const cameraManager = new CameraManager(window.innerWidth / window.innerHeight);

// ── 星球本体 ──────────────────────────────────────────────────
const planet = new Planet(sceneManager, { seed: 1337 });
sceneManager.sky.add(createStarField(1400, 1800));

// 港口解析到真实陆地（Phase 3 建造 / Mini Globe Marker 都用这份落点）
const resolvedPorts = resolvePortsOnLand(planet.heightField);

// ── Phase 3：世界内容（资产 → 地形采样 → 植被 → 港口） ──────────
// ⚠ 初始化顺序 = 依赖顺序（const 有暂时性死区 TDZ：被引用者必须先声明，
//   否则页面启动直接 Cannot access 'occupancy' before initialization）
const assets = new AssetManager();
const sampler = new TerrainSampler(planet.heightField);
const entityRegistry = new EntityRegistry();
const damageSystem = new DamageSystem({ sceneManager, registry: entityRegistry });
const environment = new EnvironmentEventSystem({ sceneManager, damageSystem });
const occupancy = new GroundOccupancy(PLANET.RADIUS);          // 先建：被下面全部 Manager 引用
const audio = new AudioFx();                                    // 程序化音效（首次手势解锁）
const combatFx = new CombatFx({ sceneManager });                // 炮火/着火/修理环特效
const shipHud = new HudLayer({ sceneManager, cameraManager, rendererManager });   // 船血条/客数/修理标记
const nature = new NatureManager({ sceneManager, assets, sampler, occupancy });
const ports = new PortManager({ sceneManager, assets, sampler, registry: entityRegistry, damageSystem, occupancy });
const routes = new RouteManager({ sceneManager, sampler });
const ships = new ShipManager({ sceneManager, assets, routes, registry: entityRegistry, damageSystem, fx: combatFx, audio });
const characters = new CharacterManager({ sceneManager, assets, sampler, registry: entityRegistry, occupancy });
const civilians = new CivilianManager({ sceneManager, assets, sampler, occupancy, characters });
const pets = new PetManager({ sceneManager, assets, sampler, registry: entityRegistry, occupancy });
const ferries = new FerryManager({ sceneManager, assets, routes, sampler, characters, pets, occupancy, damageSystem, fx: combatFx, audio });
// 海盗猎杀渡轮：渡轮队注入商船队 AI
ships.setFerryProvider(() => ferries.ferries);
// 渡轮停泊/航行避让：普通船也算水面占位，避免泊位和航道重叠
ferries.setShipProvider(() => ships.ships);

// ── Mini Globe（真 3D 小地球，scissor 通道，§24~§27）───────────
const miniGlobe = new MiniGlobe(planet, resolvedPorts, {
  /** 点击小地球 → 主相机平滑飞往（§26） */
  onFly: (lat, lon, isPort) => {
    cameraManager.flyToLatLon(lat, lon, {
      mode: ViewMode.LOCAL,
      dist: CAMERA.LOCAL_ALT_DEFAULT,
      duration: isPort ? 1.6 : 1.9,
    });
    syncModeButtons();
  },
});
miniGlobe.attach(rendererManager);
miniGlobe.bindCamera(cameraManager);

// 悬停信息（§28）：星球自转下必须每帧重播 raycast，故 update 由 Interaction 内部重播
const interaction = new Interaction({
  rendererManager, cameraManager, sceneManager,
  infoEl: document.getElementById('info'),
  onPick: (info) => {
    const ship = info?.isShip ? ships.getByObject(info.object) : null;
    if (ship) {
      ships.traceShipForSeconds(ship, clock.elapsedTime, 5);
      console.log('[PickShip] ' + ship.name + '  id=' + ship.id + '  model=' + ship.model);
      return info;
    }
    if (info && info.model) console.log('[Pick] ' + info.name + '  model=' + info.model + (info.port ? '  port=' + info.port : ''));
    return info;
  },
});

// ── 昼夜（§31）───────────────────────────────────────────────
let sunAngle = 0.9;
let sunElev = 0.42;
function applySun() {
  const day = sceneManager.setSunAngle(sunAngle, sunElev);
  const dir = sceneManager.sun.position.clone().normalize();
  planet.setSun(dir, 1 - day);
  return day;
}
applySun();

// ── Mini Globe 边框与渲染器视口对齐（§24）──────────────────────
function layoutMini() {
  const r = rendererManager.miniRect;
  Object.assign(miniFrame.style, {
    left: r.x + 'px', top: r.y + 'px', width: r.w + 'px', height: r.h + 'px',
  });
  // 记录 scissor 视口（CSS px，左上原点）到 window，方便调 UI 重叠
  window.__miniViewport = { ...r };
}
layoutMini();

// ── UI 接线 ──────────────────────────────────────────────────
const btnGlobe = document.getElementById('btn-globe');
const btnLocal = document.getElementById('btn-local');
const btnClouds = document.getElementById('btn-clouds');
const btnRoutes = document.getElementById('btn-routes');
const sunSlider = document.getElementById('sun');
const todEl = document.getElementById('tod');
const cameraUi = document.getElementById('camera-ui');
const cameraToggle = document.getElementById('camera-toggle');
const cameraPad = document.getElementById('camera-pad');
const surfaceRaycaster = new THREE.Raycaster();
const surfacePointer = new THREE.Vector2();
const moveKeys = new Set();

function syncModeButtons() {
  const flying = cameraManager.isFlying;
  const m = flying ? cameraManager.pendingMode : cameraManager.mode;
  btnGlobe.classList.toggle('on', m === ViewMode.GLOBE);
  btnLocal.classList.toggle('on', m !== ViewMode.GLOBE);
  cameraUi?.classList.toggle('local', m !== ViewMode.GLOBE);
  if (m === ViewMode.GLOBE) {
    cameraUi?.classList.remove('open');
    cameraToggle?.classList.remove('on');
  }
  if (hintEl) {
    hintEl.textContent = m === ViewMode.GLOBE
      ? '拖动旋转 · 滚轮缩放 · 双击星球进入局部 · 点击右下小地球飞往该区域'
      : 'WASD 移动视角 · 拖动环视 · 滚轮缩放 · 镜头按钮辅助移动';
  }
}

btnGlobe.addEventListener('click', () => { cameraManager.setMode(ViewMode.GLOBE); routes.tuneForMode('GLOBE'); syncModeButtons(); });
btnLocal.addEventListener('click', () => { cameraManager.setMode(ViewMode.LOCAL); routes.tuneForMode('LOCAL'); syncModeButtons(); });
btnClouds.addEventListener('click', () => {
  const on = !planet.clouds.visible;
  planet.setCloudsVisible(on);
  btnClouds.classList.toggle('on', on);
});
btnRoutes.addEventListener('click', () => {
  const on = !routes.visible;
  routes.setVisible(on);
  btnRoutes.classList.toggle('on', on);
});
btnRoutes.classList.add('on');

cameraToggle?.addEventListener('click', () => {
  const open = !cameraUi.classList.contains('open');
  cameraUi.classList.toggle('open', open);
  cameraToggle.classList.toggle('on', open);
});

let cameraHold = null;
function runCameraAction(action) {
  const step = THREE.MathUtils.clamp(cameraManager.state.dist * 0.58, 4, 18);
  if (action === 'forward') cameraManager.moveLocal(step, 0);
  else if (action === 'back') cameraManager.moveLocal(-step, 0);
  else if (action === 'left') cameraManager.moveLocal(0, -step);
  else if (action === 'right') cameraManager.moveLocal(0, step);
  else if (action === 'in') cameraManager.onWheel(-1);
  else if (action === 'out') cameraManager.onWheel(1);
}
function stopCameraHold() {
  if (cameraHold) clearInterval(cameraHold);
  cameraHold = null;
}
cameraPad?.addEventListener('pointerdown', (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;
  e.preventDefault();
  btn.setPointerCapture?.(e.pointerId);
  const action = btn.dataset.cameraMove || btn.dataset.cameraZoom;
  runCameraAction(action);
  stopCameraHold();
  cameraHold = setInterval(() => runCameraAction(action), 90);
});
cameraPad?.addEventListener('pointerup', stopCameraHold);
cameraPad?.addEventListener('pointerleave', stopCameraHold);
cameraPad?.addEventListener('pointercancel', stopCameraHold);

window.addEventListener('keydown', (e) => {
  const tag = document.activeElement?.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA') return;
  const k = e.key.toLowerCase();
  if (k === 'w' || k === 'a' || k === 's' || k === 'd') {
    moveKeys.add(k);
    e.preventDefault();
  }
});
window.addEventListener('keyup', (e) => {
  moveKeys.delete(e.key.toLowerCase());
});

merchantListEl?.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-merchant-id]');
  if (!btn) return;
  const ship = ships.getById(btn.dataset.merchantId);
  if (!ship) return;
  flyToShip(ship);
});

function flyToShip(ship) {
  const ll = vector3ToLatLon(ship.position);
  cameraManager.followTarget = ship.object;
  cameraManager.flyTo({
    lat: ll.lat,
    lon: ll.lon,
    mode: ViewMode.FOLLOW,
    dist: CAMERA.LOCAL_ALT_DEFAULT,
    duration: 1.15,
  });
  ships.traceShipForSeconds(ship, clock.elapsedTime, 5);
  routes.tuneForMode('LOCAL');
  syncModeButtons();
}

function renderMerchantList(time = 0) {
  if (!merchantListEl) return;
  const merchants = ships.ships.filter((s) => s.kind === 'merchant');
  if (!merchants.length) {
    merchantListEl.innerHTML = '<div class="merchant-meta">暂无商船</div>';
    return;
  }
  merchantListEl.innerHTML = merchants.map((ship) => {
    const hpRatio = Math.max(0, ship.hp / Math.max(1, ship.maxHp));
    const danger = ship.state === 'fleeing' || ship.hp < ship.maxHp || (time - ship.lastAttackAt) < 4;
    const status = merchantStatusLabel(ship, time);
    const chance = ship.lastShotChance ? ' 命中率 ' + Math.round(ship.lastShotChance * 100) + '%' : '';
    return '<div class="merchant-row">' +
      '<div>' +
        '<div class="merchant-name">' + escHtml(ship.name) + '</div>' +
        '<div class="merchant-meta">速度 ' + ship.speed.toFixed(1) + ' · 血量 ' + Math.round(hpRatio * 100) + '%' + chance + '</div>' +
        '<div class="merchant-status' + (danger ? ' danger' : '') + '">' + escHtml(status) + '</div>' +
      '</div>' +
      '<button title="镜头飞往商船" aria-label="镜头飞往商船" data-merchant-id="' + escHtml(ship.id) + '">镜头</button>' +
    '</div>';
  }).join('');
}

function merchantStatusLabel(ship, time) {
  if (ship.destroyed) return '已被摧毁';
  if (ship.repairing || ship.state === 'repairing') return '靠岸修理中';
  if (ship.state === 'fleeing') return ship.attackStatus || '正在利用速度规避海盗';
  if ((time - ship.lastHitAt) < 4) return ship.attackStatus || '刚刚被命中';
  if ((time - ship.lastAttackAt) < 4) return ship.attackStatus || '正在被炮击';
  if (ship.hp < ship.maxHp) return '受损，继续航行';
  return ship.attackStatus || '沿航线巡航';
}

function escHtml(value) {
  return String(value).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

sunSlider.addEventListener('input', () => {
  const v = Number(sunSlider.value) / 100;
  sunAngle = v * Math.PI * 2;
  sunElev = 0.55 * Math.cos(v * Math.PI * 2 - Math.PI * 0.15) + 0.06;
  const day = applySun();
  todEl.textContent = day > 0.7 ? '白天' : day > 0.35 ? '黄昏' : '夜晚';
});

// ── 指针交互（Mini Globe 视口内的操作归小地球）─────────────────
function inMiniRect(x, y) {
  const r = rendererManager.miniRect;
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

// 浏览器自动播放策略：首次手势解锁 AudioContext（海浪 / 海鸥声启动）
canvas.addEventListener('pointerdown', (e) => {
  audio.resume();
  if (inMiniRect(e.clientX, e.clientY)) return;      // 交给 Mini Globe
  canvas.setPointerCapture(e.pointerId);
  cameraManager.onPointerDown(e.clientX, e.clientY, e.pointerId);
});
canvas.addEventListener('pointermove', (e) => {
  if (inMiniRect(e.clientX, e.clientY)) { miniGlobe.setHover(e.clientX, e.clientY); return; }
  miniGlobe.clearHover();
  cameraManager.onPointerMove(e.clientX, e.clientY);
});
canvas.addEventListener('pointerup', (e) => {
  cameraManager.onPointerUp();
  canvas.releasePointerCapture?.(e.pointerId);
  syncModeButtons();
});
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  if (inMiniRect(e.clientX, e.clientY)) return;
  cameraManager.onWheel(e.deltaY);
}, { passive: false });
canvas.addEventListener('contextmenu', (e) => e.preventDefault());

// Mini Globe 点击 → 球面坐标 → FlyTo（§26/§27）
canvas.addEventListener('click', (e) => {
  if (!inMiniRect(e.clientX, e.clientY)) return;
  miniGlobe.handleClick(e.clientX, e.clientY);
});

canvas.addEventListener('dblclick', (e) => {
  if (inMiniRect(e.clientX, e.clientY) || cameraManager.mode !== ViewMode.GLOBE) return;
  e.preventDefault();
  surfacePointer.set((e.clientX / window.innerWidth) * 2 - 1, -((e.clientY / window.innerHeight) * 2 - 1));
  surfaceRaycaster.setFromCamera(surfacePointer, cameraManager.camera);
  const hits = surfaceRaycaster.intersectObjects([planet.ocean, planet.land], false);
  if (!hits.length) return;
  const ll = vector3ToLatLon(hits[0].point);
  cameraManager.flyToLatLon(ll.lat, ll.lon, {
    mode: ViewMode.LOCAL,
    dist: CAMERA.LOCAL_ALT_DEFAULT,
    duration: 1.25,
  });
  routes.tuneForMode('LOCAL');
  syncModeButtons();
});

// ── Resize ───────────────────────────────────────────────────
window.addEventListener('resize', () => {
  cameraManager.resize(window.innerWidth / window.innerHeight);
  layoutMini();
});

// ── 动画循环 ─────────────────────────────────────────────────
const clock = new THREE.Clock();
let lastStats = 0, frames = 0, fps = 0;
let lastMerchantUi = 0;

function animate() {
  const dt = Math.min(clock.getDelta(), 0.05);
  const time = clock.elapsedTime;

  if (cameraManager.mode !== ViewMode.GLOBE && moveKeys.size) {
    const speed = THREE.MathUtils.clamp(cameraManager.state.dist * 2.4, 18, 62);
    const forward = (moveKeys.has('w') ? 1 : 0) + (moveKeys.has('s') ? -1 : 0);
    const right = (moveKeys.has('d') ? 1 : 0) + (moveKeys.has('a') ? -1 : 0);
    if (forward || right) cameraManager.moveLocal(forward * speed * dt, right * speed * dt);
  }

  sceneManager.update(dt);
  planet.update(time);
  environment.update(dt);
  damageSystem.update(dt);
  cameraManager.update(dt);
  miniGlobe.update(dt);
  if (ready) {
    ships.update(dt, time);        // 船沿大圆弧航行 + 海盗追踪开炮（§17 / 海战）
    characters.update(dt, time);   // 小人沿大圆弧走路（贴地 + 骨骼动画）
    pets.update(dt, time);         // 小动物漫步
    ferries.update(dt, time);      // 渡轮靠岸停靠 + 排队上下船 + 修理
    shipHud.update();              // 血条 + 客数 + 修理标记跟随（DOM）
    if (time - lastMerchantUi > 0.25) {
      renderMerchantList(time);
      lastMerchantUi = time;
    }
    interaction.update();          // 星球自转下每帧重播 raycast（§28）
  }

  rendererManager.renderMain(sceneManager.scene, cameraManager.camera);
  // ⚠ 弹道命中回调会改血量 → 必须晚于本帧船只 update（在 render 后结算），
  //   同一帧 fx 只推进一次。fx 特效本身下一帧可见（延迟一帧，观感无差）。
  if (ready) combatFx.update(dt, time);

  frames++;
  if (time - lastStats > 0.5) {
    fps = Math.round(frames / (time - lastStats));
    frames = 0; lastStats = time;
    const s = cameraManager.state;
    const info = rendererManager.renderer.info.render;
    statsEl.textContent =
      'FPS ' + fps + '   视角 ' + cameraManager.mode + '\n' +
      'lat ' + s.lat.toFixed(1) + '°  lon ' + s.lon.toFixed(1) + '°  高度/距离 ' + s.dist.toFixed(1) + '\n' +
      'drawCalls ' + info.calls + '  tris ' + info.triangles +
      (ready ? '\n港口 ' + ports.ports.length + '  船 ' + ships.ships.length + '  岛民 ' + characters.characters.length + '  动物 ' + pets.pets.length + '  渡轮 ' + ferries.ferries.length : '');
  }
  requestAnimationFrame(animate);
}

// ── 启动：先渲染星球（即时可见），再异步加载 Kenney 资产并建世界 ──
let ready = false;
let bootStarted = false;

async function buildWorld() {
  if (loadTxt) loadTxt.textContent = '正在装载 Kenney 模型…';
  const res = await assets.loadAll(MVP_MODELS);
  console.log('[AssetManager] 已加载 ' + assets.listLoaded().length + '/' + MVP_MODELS.length + ' 个模型（清单实测路径）');
  if (res.failed && res.failed.length) {
    console.error('[AssetManager] 加载失败：\n' + res.failed.join('\n'));
  }

  // 小动物（cube-pets，第三张独立图集）→ 岛民（mini-characters，第四张独立图集）
  // 提示文字与加载顺序一一对应，别写串行（会误导排查）
  if (loadTxt) loadTxt.textContent = '正在装载小动物…';
  const petRes = await assets.loadPets(PET_MODELS);
  console.log('[AssetManager] 已加载小动物 ' + petRes.loaded + '/' + petRes.total + ' 个（cube-pets 清单实测路径）');
  if (petRes.failed && petRes.failed.length) {
    console.error('[AssetManager] 小动物加载失败：\n' + petRes.failed.join('\n'));
  }

  if (loadTxt) loadTxt.textContent = '正在装载岛民模型…';
  const miniRes = await assets.loadMiniCharacters(CHARACTER_MODELS);
  console.log('[AssetManager] 已加载岛民 ' + miniRes.loaded + '/' + miniRes.total + ' 个（mini-characters 清单实测路径）');
  if (miniRes.failed && miniRes.failed.length) {
    console.error('[AssetManager] 岛民加载失败：\n' + miniRes.failed.join('\n'));
  }

  // 建造：程序化植被（Instancing）→ 港口聚落
  // 树木密度下调（900→220），留出视觉空间给小人活动
  // ⚠ 建造顺序：港口（建筑注册占地）→ 植被（scatter 按 occupancy 避让建筑）→ 角色/动物
  ports.build(resolvedPorts);
  nature.build({ palms: 220, rocks: 120, grass: 200 });
  interaction.bindPorts(ports);

  // 航线（港口间大圆弧）→ 船队沿弧线航行（§16~§19）
  routes.build(ports.ports);
  ships.build();

  // 陆地小人（§Characters）：沿港口附近陆地沿大圆来回走动（占地避让建筑/树）
  characters.build(resolvedPorts);
  interaction.bindCharacters(characters);

  // 散居民居：每岛民居数 = 该港岛民数；避开城堡/码头/树/角色，且不贴海岸
  civilians.build(ports.ports);

  // 陆地小动物（§Animals）：cube-pets，同球面漫步 + 防穿模
  pets.build(resolvedPorts);

  // 渡轮（§Ferry）：靠岸停靠 + 排队上下船 + 修理
  ferries.build(resolvedPorts);
  // 船只头顶 HUD（血条 / 客数 / 修理标记）注册全部船只
  shipHud.bindShips([...ships.ships, ...ferries.ferries]);
  renderMerchantList(clock.elapsedTime);
  console.log('[World] 航线 ' + JSON.stringify(routes.summary()));
  console.log('[World] 船队 ' + JSON.stringify(ships.summary()));
  console.log('[World] 船：' + ships.ships.map((x) => x.name + '[' + x.typeLabel + '] ' + x.route.from.name + '→' + x.route.to.name).join('  |  '));

  console.log('[World] 植被 ' + JSON.stringify(nature.summary()));
  console.log('[World] 港口 ' + JSON.stringify(ports.summary()));
  console.log('[World] 小人 ' + JSON.stringify(characters.summary()));
  console.log('[World] 民居 ' + JSON.stringify(civilians.summary()));
  console.log('[World] 动物 ' + JSON.stringify(pets.summary()));
  console.log('[World] 渡轮 ' + JSON.stringify(ferries.summary()) + '（每次载 ' + 5 + ' 人，跨港摆渡）');
  console.log('[World] 占地注册 ' + occupancy.count + ' 点（防穿模）');
  console.log('[World] 小人（前 8 名）：' + characters.characters.slice(0, 8).map((c) => c.name + '(' + c.model.replace('character-', '') + ',' + c.state + ' lat' + c.latLive.toFixed(1) + ' lon' + c.lonLive.toFixed(1) + ')').join('  '));
  console.log('[World] 港口落点：' + ports.ports.map((p) => p.name + '(' + p.lat.toFixed(1) + ',' + p.lon.toFixed(1) + ' h' + (p.groundH || 0).toFixed(2) + ')').join('  '));
  console.log('[World] 战况 ' + JSON.stringify(combatFx.summary()) + '  HUD ' + JSON.stringify(shipHud.summary()));

  ready = true;
  window.__ready = true;

  // 渲染过两帧后做 shader 自检：把 GLSL 编译失败显式打出来（杜绝静默回退白材质）
  requestAnimationFrame(() => requestAnimationFrame(() => {
    assets.reportShaderErrors(rendererManager.renderer);
    if (loadTxt) loadTxt.textContent = '已就绪';
    if (barEl) barEl.style.width = '100%';
  }));
}

requestAnimationFrame(() => {
  clock.start();
  syncModeButtons();
  animate();
  if (!bootStarted) {
    bootStarted = true;
    buildWorld().finally(() => {
      loadingEl && loadingEl.classList.add('hide');
      setTimeout(() => loadingEl && loadingEl.remove(), 600);
    });
  }
});

// 暴露调试句柄（控制台可用 THREE / __debug 检查渲染状态）
window.THREE = THREE;
const debug = {
  planet, sceneManager, cameraManager, rendererManager, miniGlobe, interaction,
  assets, sampler, nature, ports, routes, ships, characters, civilians, pets, ferries, occupancy,
  entityRegistry, damageSystem, environment, combatFx, shipHud, audio,
  ViewMode, PLANET, PORTS, resolvedPorts,
};
window.__debug = debug;
window.__planet = debug;

// 加载进度占位（Phase 3 资产加载时使用）
export function setLoadProgress(ratio, text) {
  if (!barEl || !loadTxt) return;
  barEl.style.width = Math.round(ratio * 100) + '%';
  if (text) loadTxt.textContent = text;
}
