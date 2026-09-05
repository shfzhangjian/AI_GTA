import { bus } from '../utils/eventBus.js';
import { Brick } from '../entities/brick.js';

/** 关卡清单（相对站点根） */
export const LEVEL_FILES = [
  './src/level/levels/level1.json',
  './src/level/levels/level2.json',
  './src/level/levels/level3.json',
];

/** 单字符建模别名；也可直接在 cells 中写逗号分隔的完整元素名 */
export const ALIAS = { G: 'glass', S: 'stone', I: 'ice', W: 'wood', M: 'metal', '$': 'gold', X: 'explosive' };

function resolveToken(token) {
  if (token === '.' || token === '' || token === ' ') return null; // 空格子
  if (ALIAS[token]) return ALIAS[token];
  return token; // 完整元素名（brick.js 内校验是否存在）
}

/**
 * loadLevel —— 拉取关卡 JSON → 解析模型库 → 构建砖块/元素 → 预载底图。
 * 全程经总线上报道具，供调试面板追踪加载耗时与规模。
 */
export async function loadLevel(url, assets) {
  const t0 = performance.now();
  bus.emit('load.level', { url });

  const res = await fetch(url);
  if (!res.ok) throw new Error(`关卡加载失败 ${url} (HTTP ${res.status})`);
  const json = await res.json();

  // 底图：图片型先加载，失败回退程序化
  if (json.bg?.type === 'image') {
    try { await assets.loadImage(json.bg.src); }
    catch (err) { bus.emit('load.warning', { msg: err.message + '，回退程序化底图' }); json.bg = { ...json.bg, type: 'procedural' }; }
  }
  const bgCanvas = assets.buildBackground(json.bg || {});

  // 建模：spec.cells 内联网格，或 spec.model 引用 level.models 共享模型
  const cellSize = json.cellSize || 24;
  const bricks = [];
  let elementTotal = 0;
  for (const spec of json.bricks || []) {
    const cells = spec.cells || json.models?.[spec.model]?.cells;
    if (!cells) { bus.emit('load.warning', { msg: `砖块 ${spec.name || '?'} 缺少网格定义` }); continue; }
    const brick = new Brick({ ...spec, cells }, cellSize, resolveToken);
    bricks.push(brick);
    elementTotal += brick.elements.length;
  }

  const elements = bricks.flatMap(b => b.elements);
  bus.emit('load.level.done', {
    name: json.name, ms: +(performance.now() - t0).toFixed(1),
    bricks: bricks.length, elements: elementTotal, cellSize,
  });

  return { json, bgCanvas, bricks, elements };
}
