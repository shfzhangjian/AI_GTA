/**
 * config.js — 全局常量唯一来源
 * 半径体系见 docs/architecture.md §3。任何模块不得自行硬编码半径。
 */
import manifestJson from './assets/manifest.json';
import miniManifestJson from './assets/manifest-mini-characters.json';
import petsManifestJson from './assets/manifest-cube-pets.json';
/** 资产清单（由 scripts 扫描真实文件生成，唯一合法引用源） */
export const manifest = manifestJson;
/** kenney_mini-characters 清单（独立贴图图集，scripts/gen-manifest-mini-characters.mjs 生成） */
export const miniManifest = miniManifestJson;
/** kenney_cube-pets_1.0 清单（又一张独立图集，scripts/gen-manifest-cube-pets.mjs 生成） */
export const petsManifest = petsManifestJson;

export const PLANET = {
  /** 海洋球半径（世界单位，基准 R） */
  RADIUS: 100,
  /** 海岸带最小高度（用户要求：岛民/小动物不能走到海边）：
   *  高度 < 此值算「海滩/临水」→ 步行与出生禁止入内 */
  SHORE_MIN_HEIGHT: 0.6,
  /** 离海岸线的最小缓冲（世界单位，≈6°）→ 步行目标须离水线这么远 */
  SHORE_BUFFER_UNITS: 6,
  /** 陆地高度范围 */
  LAND_HEIGHT_MIN: 0.5,
  LAND_HEIGHT_MAX: 5.2,
  MOUNTAIN_HEIGHT: 6.0,
  /** 云层底部相对海面的高度 */
  CLOUD_CLEARANCE: 0.0,
  /** 港口建筑所在处的最小内陆覆盖阈值 */
  PORT_MIN_COVERAGE: 0.80,
  /** 航线抬升高度（避免穿入球体，§19） */
  ROUTE_LIFT: 0.6,
  /** 船只吃水：船体原点在其底面，故略微下沉模拟吃水线 */
  SHIP_DRAFT: 0.38,
  /** 云层半径 */
  CLOUD_RADIUS: 136,
  /** 大气层半径 */
  ATMOSPHERE_RADIUS: 156,
  /** 星球自转（弧度/秒） */
  SPIN_SPEED: 0.006,
};

export const CAMERA = {
  FOV_LOCAL: 60,   // 局部视角略广，强化微缩星球尺度
  FOV_GLOBE: 45,
  NEAR: 0.1,
  FAR: 4000,
  GLOBE_DIST_MIN: 150,
  GLOBE_DIST_MAX: 900,
  GLOBE_DIST_DEFAULT: 260,   // 星球居中且占屏更大
  LOCAL_ALT_MIN: 4.0,    // 贴地斜视：能看到弯曲地平线与地平线弧度
  LOCAL_ALT_MAX: 46.0,   // 垂直俯视（接近正射俯瞰港口）
  LOCAL_ALT_DEFAULT: 16.0,  // RTS 默认俯瞰高度（港口整体入画）
  FLY_DURATION: 1.8,
};

export const MINI_GLOBE = {
  SIZE: 170,
  MARGIN: 18,
  RADIUS: 1,
  ORBIT_DIST: 3.6,   // 38°FOV 下容下小球 + 陆地高度 + marker
};

export const ASSETS = {
  /** 唯一合法引用源（机器生成，勿手改）。import 保证 dev/build 均可用且校验存在性 */
  manifest,
};

/**
 * 陆地上会走动的小人（kenney_mini-characters，实测清单）。
 * 角色高 ≈0.67 模型单位 × unit 2.6 ≈ 1.8 世界单位（棕榈 ≈7）→ 微缩比例。
 * wheelchair 变体在 CharacterManager 里按小概率出现（实测带 wheelchair-sit/move 动画）。
 */
export const CHARACTER_MODELS = [
  'character-male-a', 'character-male-b', 'character-male-c',
  'character-male-d', 'character-male-e', 'character-male-f',
  'character-female-a', 'character-female-b', 'character-female-c',
  'character-female-d', 'character-female-e', 'character-female-f',
];

/**
 * 小人行为参数（世界单位 / 秒 / 弧度）
 * ⚠ 用户要求：不显示轮椅（wheelchair-* 不上球）；12 个角色全部出场；
 *   角色可重复，总数不少于 20 → TOTAL 是总数下限，按港数放大到每港有人。
 */
export const CHARACTERS = {
  /** 小人总数下限（≥20；实际 = max(TOTAL, PER_PORT × 港数)） */
  TOTAL: 24,
  /** 每港分配的小人数量（12 种角色在该港轮转出现，可重复） */
  PER_PORT: 4,
  /** 远离港口的散居小人数量（补足到 TOTAL） */
  WANDERERS: 12,
  /** 步行速度范围（世界单位/秒）。对比船速 3.4~6.6 → 小人慢得多 */
  WALK_SPEED_MIN: 0.9,
  WALK_SPEED_MAX: 1.7,
  /** 跑动速度（偶发冲刺） */
  SPRINT_SPEED_MIN: 2.4,
  SPRINT_SPEED_MAX: 3.4,
  /** 一次行走目标点距离范围（度，沿陆地表面） */
  LEG_DIST_MIN_DEG: 3.0,
  LEG_DIST_MAX_DEG: 11.0,
  /** 到点后站桩 idle 时长范围（秒） */
  PAUSE_MIN: 1.2,
  PAUSE_MAX: 4.5,
  /** 允许出现的小人坡度上限（度）——太陡不上去 */
  MAX_SLOPE_DEG: 18,
  /** 地面吸附：小人脚底贴地（模型 baseY=0 实测） */
  GROUND_LIFT: 0.02,
  /** 防穿模：与建筑 / 树 / 岩石 / 彼此的最小间距（世界单位） */
  CLEAR_RADIUS: 2.2,
  /** 走路起伏：实测 walk clip 时长 0.67s、root 起伏 +0.05 模型单位
   *  （× 本表 unit 2.6 ≈ 0.13 世界单位）。步频 = 1/clip 时长 × 步幅/速度。 */
  BOB_AMP_WALK: 0.11,
  BOB_AMP_SPRINT: 0.16,
  /** 步态角频率（弧度/秒，乘 time）：walk ≈ 2π/0.67 ≈ 9.4 */
  BOB_FREQ_WALK: 9.4,
  BOB_FREQ_SPRINT: 13.0,
};

/** Phase 3 起 MVP 加载的模型（全部经 asset-audit.md 实测存在） */
export const MVP_MODELS = [
  'ship-pirate-large', 'ship-pirate-medium',
  'ship-large', 'ship-medium',
  'tower-complete-large', 'tower-complete-small', 'tower-watch',
  // 城堡零件（PortManager 堆叠成完整塔楼：base + middle + top + roof）
  'tower-base', 'tower-base-door', 'tower-middle', 'tower-middle-windows', 'tower-top', 'tower-roof',
  'castle-gate', 'castle-wall', 'castle-window', 'structure', 'structure-roof',
  'structure-platform-dock', 'structure-platform-dock-small', 'platform-planks', 'structure-fence',
  'palm-straight', 'palm-bend', 'rocks-a', 'rocks-b',
  'grass-patch', 'grass-plant', 'chest',
  'barrel', 'crate', 'crate-bottles', 'flag-pirate-high', 'flag-pennant', 'cannon',
];

export const PORTS = [
  { id: 'port-royal',    name: 'Port Royal',    lat:  22, lon: -46, kind: 'major' },
  { id: 'skull-bay',     name: 'Skull Bay',     lat:   6, lon:  70, kind: 'major' },
  { id: 'golden-harbor', name: 'Golden Harbor', lat:  34, lon: 146, kind: 'major' },
  { id: 'turtle-island', name: 'Turtle Island', lat: -18, lon: -46, kind: 'small' },
  { id: 'storm-port',    name: 'Storm Port',    lat:  12, lon: 100, kind: 'small' },
  { id: 'emerald-cove',  name: 'Emerald Cove',  lat:  -2, lon: -100, kind: 'small' },
];

/**
 * 渡轮（跨港渡运）：每艘每次载 5 个旅行者（角色优先、动物补位），
 * 从 A 港沿航线开到 B 港放客，绕圈回 A 再补客。吃水是 config 唯一来源。
 */
export const FERRY = {
  COUNT: 0,
  /** 每次载入人数（用户要求：每次可以载入 5 个角色） */
  CAPACITY: 5,
  /** 渡轮模型：大划艇比 pirate 大船比例更贴近「小人渡轮」 */
  MODEL: 'boat-row-large',
  /** 吃水：航线弧抬升 ROUTE_LIFT=0.55 − 0.5 ≈ 船体贴海面（±0.2 海浪浮动不穿海） */
  DRAFT: 0.5,
  SPEED_MIN: 4.2,
  SPEED_MAX: 5.6,
  /** 距港口该度数内算「在港可上船」 */
  BOARD_DEG: 7,
  /** 靠岸停泊时长（秒）：上下船步行 + 修理都在这期间完成（船停下不消失） */
  DOCK_SECONDS: 10,
};

/**
 * 船只战斗 / 漂浮 / 修理参数（吃水线为海面下正值，单位=世界单位）。
 * ⚠ 船模原点在龙骨（实测 baseY=0）→ 龙骨要沉到海平面下 draft 才算「泡在水里」。
 */
export const SHIPS = {
  /** 船数上限；0 = 不设硬上限，按航线自动生成商船。 */
  MAX_ACTIVE_SHIPS: 0,
  /** 海盗船固定数量：随机航线巡逻，10 秒没遇到商船会换线继续找。 */
  PIRATE_COUNT: 2,
  /** 商船最少数量：每条航线 1 艘商船，且至少 5 艘。 */
  MIN_MERCHANT_SHIPS: 5,
  MERCHANTS_PER_ROUTE: true,
  /** 初始生成时的最小分散距离；不足时使用最远点兜底。 */
  SPAWN_MIN_DISTANCE: 90,
  /** 吃水（海面下）：大船 1.1 / 渡轮 0.55 —— 旧值把船抬在海面上 → 「悬浮」根因 */
  DRAFT_SHIP: 1.1,
  DRAFT_FERRY: 0.55,
  /** 海盗船 AI：索敌半径 / 炮击射程 / 炮击伤害 / 冷却 */
  PIRATE_SEEK_RADIUS: 85,       // 世界单位
  PIRATE_CANNON_RANGE: 46,
  PIRATE_CANNON_DAMAGE_MIN: 4,
  PIRATE_CANNON_DAMAGE_MAX: 9,
  PIRATE_CANNON_COOLDOWN: [1.6, 2.8],   // 秒
  PIRATE_SPEED_CHASE: 5.6,      // 追击速度
  PIRATE_ROUTE_SEARCH_SECONDS: 10,
  PIRATE_ATTACK_ARC_DEG: 76,
  DESTROYED_SHIP_HIDE_SECONDS: 1.0,
  /** 海岸避让后保持船头方向的时间，避免贴岸时每帧来回修正造成抖动。 */
  HEADING_HOLD_SECONDS: 0.85,
  /** 追踪时船体保持在海面抬升高度（= RouteManager ROUTE_LIFT，避免大圆推进穿球） */
  POS_LIFT: 0.55,
  /** 船体摇摆平滑跟随时间（秒）：船体按自身周期惯性追随浪面 → 流畅不抖 */
  TILT_SMOOTH_SECONDS: 0.75,
  /** 船↔船避让：最近距离（世界单位，按大船视觉船身留出硬间距）与转向增益 */
  SHIP_AVOID_RADIUS: 34,
  SHIP_AVOID_STEER: 3.2,
  /** 每大陆城堡港上限（用户：每大陆只有一个城堡）→ 多余 major 降级 small（去城墙圈） */
  CASTLES_PER_CONTINENT: 1,
  /** 着火分级（受伤比例）：≥0.3 火星点 / ≥0.55 火势+黑烟 / ≥0.8 大火 */
  FIRE_LEVELS: [0.3, 0.55, 0.8],
  /** 修理：靠岸停留时长 + 每秒回血 */
  REPAIR_DOCK_SECONDS: 9,
  REPAIR_HP_PER_SECOND: 5,
  /** 渡轮血量（被海盗打伤 → 到岸修理） */
  FERRY_MAX_HP: 90,
  SHIP_MAX_HP: { pirate: 130, merchant: 115 },
};

/** 陆地小动物（kenney_cube-pets_1.0，实测清单）。全部 24 种都可能出场 */
export const PET_MODELS = [
  'animal-cat', 'animal-dog', 'animal-bunny', 'animal-fox', 'animal-deer',
  'animal-lion', 'animal-tiger', 'animal-panda', 'animal-penguin', 'animal-pig',
  'animal-cow', 'animal-giraffe', 'animal-elephant', 'animal-monkey', 'animal-koala',
  'animal-hog', 'animal-beaver', 'animal-crab', 'animal-chick', 'animal-parrot',
];

/** 小动物行为参数 */
export const PETS = {
  /** 每种动物至少出场数（20 种 × 2 = 40 只保底） */
  PER_SPECIES: 2,
  /** 全局额外随机撒的只数 */
  EXTRAS: 26,
  WALK_SPEED_MIN: 1.1,
  WALK_SPEED_MAX: 2.2,
  RUN_SPEED_MIN: 2.8,
  RUN_SPEED_MAX: 4.2,
  RUN_CHANCE: 0.18,
  LEG_DIST_MIN_DEG: 2.5,
  LEG_DIST_MAX_DEG: 9.0,
  PAUSE_MIN: 1.0,
  PAUSE_MAX: 4.0,
  MAX_SLOPE_DEG: 16,
  GROUND_LIFT: 0.02,
  /** 防穿模：与建筑 / 树 / 小人的最小间距（世界单位） */
  CLEAR_RADIUS: 2.4,
  BOB_FREQ_WALK: 12.6,     // walk clip 0.5s → 2π/0.5 ≈ 12.6
  BOB_FREQ_RUN: 25.1,
  BOB_AMP_WALK: 0.1,
  BOB_AMP_RUN: 0.16,
};

/**
 * 港口落点解析（Phase 3 建造 / Phase 6 Mini Globe / 航线与渡运共用）。
 * ⚠ 方形城墙（34×26 / 22×18 世界单位）放大后，港口不再钉死在设计点上：
 *   以设计点为中心搜索 ±searchRadius，要求【整块墙圈矩形】都坐在陆地上
 *   （每 2 单位采样 minH > 0.05），并偏好墙圈尽可能高（远离海岸）。
 *   找不到整块陆地时退化为「锚点陆地」并 console.warn 暴露。
 * @param {ReturnType<import('./planet/Land.js').makeHeightField>} field
 * @param {number} searchRadius 搜索半径（度）
 */
export function resolvePortsOnLand(field, searchRadius = 26) {
  const out = [];
  const DEG = Math.PI / 180;
  // 方形城墙footprint（世界单位，PortManager.squareWallLayout 同表）：墙圈中心 = 聚落锚点
  // （主港墙圈中心在锚点北 13 单位 → 搜索时整圈平移）
  const WALL_RECT = { major: { w: 34, d: 26, cy: 13 }, small: { w: 22, d: 18, cy: 9 } };
  const R = 100;
  const degPerUnit = 180 / Math.PI / R;

  /** 墙圈是否完整坐落陆地（每 2 单位采样，minH > 阈值） */
  function wallLandScore(lat, lon, kind) {
    const r = WALL_RECT[kind] || WALL_RECT.small;
    const cosLat = Math.max(0.2, Math.cos(lat * DEG));
    const x0 = -r.w / 2, x1 = r.w / 2, y0 = r.cy - r.d / 2, y1 = r.cy + r.d / 2;
    let minH = Infinity;
    for (let gx = x0; gx <= x1; gx += 2) {
      for (let gy = y0; gy <= y1; gy += 2) {
        const h = field.sample({ lat: lat + gy * degPerUnit, lon: lon + gx * degPerUnit / cosLat });
        if (h < minH) minH = h;
      }
    }
    return minH;
  }

  for (const p of PORTS) {
    let best = null;
    const step = 2;   // 度
    for (let dlat = -searchRadius; dlat <= searchRadius; dlat += step) {
      for (let dlon = -searchRadius; dlon <= searchRadius; dlon += step) {
        const lat = THREE_clampLat(p.lat + dlat);
        const lon = p.lon + dlon;
        const h = field.sample({ lat, lon });
        if (h < 1.0) continue;                       // 锚点本身必须是陆地
        const wallH = wallLandScore(lat, lon, p.kind);
        if (wallH < 0.05) continue;                  // 城墙圈必须完整坐落在陆地上
        // 偏好：墙圈尽量高（远离海岸）、锚点离设计点近
        const dist = Math.hypot(lat - p.lat, dlon);
        const score = Math.min(wallH, 4) * 10 - dist * 0.06;
        if (!best || score > best.score) best = { lat, lon, h, wallH, score };
      }
    }
    if (!best) {
      // 兜底：退化为原逻辑（锚点陆地即可，城墙可能部分临海 —— 日志会暴露）
      for (let dlat = -searchRadius; dlat <= searchRadius; dlat += 2) {
        for (let dlon = -searchRadius; dlon <= searchRadius; dlon += 2) {
          const lat = THREE_clampLat(p.lat + dlat);
          const lon = p.lon + dlon;
          const h = field.sample({ lat, lon });
          if (h > 1.0 && (!best || h - Math.hypot(lat - p.lat, dlon) * 0.06 > best.score)) {
            best = { lat, lon, h, wallH: h, score: h - Math.hypot(lat - p.lat, dlon) * 0.06 };
          }
        }
      }
      if (best) console.warn('[config] 港口 ' + p.name + ' 找不到能放下方形城墙的整块陆地，退化为锚点落位');
    }
    out.push({ ...p, lat: best ? best.lat : p.lat, lon: best ? best.lon : p.lon, resolved: !!best, groundH: best ? best.h : 0 });
  }
  return out;
}

function THREE_clampLat(v) {
  return Math.max(-64, Math.min(64, v));
}
