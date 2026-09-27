// unit-castle.mjs — 方形城墙布局（squareWallLayout）纯逻辑测试
//   node --import ./scripts/register-loader.mjs scripts/unit-castle.mjs
//
// 验证：闭合矩形（四角有角楼、四边墙密度均匀、南边正中有大门）；
//       主港/小港两套 PORT_LAYOUT 整合后不报错、元素数合理、海防大门朝向海。
import * as THREE from 'three';
globalThis.THREE = THREE;

let pass = 0, fail = 0;
const ok = (n, c, x = '') => { if (c) { pass++; console.log('  ok  ' + n); } else { fail++; console.log('  XX  ' + n + (x ? '  ' + x : '')); } };

const src = (await import('node:fs')).readFileSync(new URL('../src/world/PortManager.js', import.meta.url), 'utf8');

// 提取并 eval 布局函数（导出的是 PortManager 类，squareWallLayout 是模块私有函数）
const fnMatch = src.match(/function squareWallLayout[\s\S]*?\n\}/);
ok('squareWallLayout 定义存在', !!fnMatch);
const squareWallLayout = new Function('return ' + fnMatch[0])();

// PORT_LAYOUT 用正则展开成纯对象数组（避免 eval 模块私有作用域）
function materializeLayout(kind, squareWallLayout) {
  const re = new RegExp(kind + ': [\\s\\S]*?\\n  \\],');
  const seg = src.match(re)[0];
  const inner = seg.replace(/^[^:]*: \[/, '').replace(/\],?\s*$/, '');
  // 展开 ...squareWallLayout({...}) → 逗号拼接对象
  return eval('[' + inner.replace(/\.\.\.squareWallLayout\((\{[^)]*\})\),/g,
    (_m, arg) => JSON.stringify(squareWallLayout(new Function('return (' + arg + ')')())).slice(1, -1) + ',') + ']');
}

console.log('--- squareWallLayout：闭合矩形 ---');
{
  const items = squareWallLayout({ x1: -8.5, y1: 0.5, x2: 8.5, y2: 13.5 });
  const walls = items.filter((i) => i.model === 'castle-wall' || i.model === 'castle-window');
  const towers = items.filter((i) => /^tower-/.test(i.model));
  const gates = items.filter((i) => i.model === 'castle-gate');

  ok('四角各一座角楼（base/top/roof ×4）', towers.length === 12, 'n=' + towers.length);
  const corners = [[-8.5, 0.5], [8.5, 0.5], [-8.5, 13.5], [8.5, 13.5]];
  ok('角楼落在四角坐标', corners.every(([cx, cy]) => towers.some((t) => Math.abs(t.x - cx) < 0.01 && Math.abs(t.y - cy) < 0.01)));
  const iy1 = 0.5 + 1.0, iy2 = 13.5 - 1.0;   // TOWER_INSET=1.0 内缩线
  ok('南面正中一道大门', gates.length === 1 && Math.abs(gates[0].x) < 0.01 && Math.abs(gates[0].y - iy1) < 0.01,
    JSON.stringify(gates[0] || null));

  // 四边都有墙（南/北/东/西）
  const ix1 = -8.5 + 1.0, ix2 = 8.5 - 1.0;
  const south = walls.filter((w) => Math.abs(w.y - iy1) < 1.2);
  const north = walls.filter((w) => Math.abs(w.y - iy2) < 1.2);
  const east = walls.filter((w) => Math.abs(w.x - ix2) < 1.2);
  const west = walls.filter((w) => Math.abs(w.x - ix1) < 1.2);
  ok('南墙存在（门两侧合计 ≥2）', south.length >= 2, 'n=' + south.length);
  ok('北墙存在 ≥3', north.length >= 3, 'n=' + north.length);
  ok('东墙存在 ≥3', east.length >= 3, 'n=' + east.length);
  ok('西墙存在 ≥3', west.length >= 3, 'n=' + west.length);

  // 闭合性：沿周长排序后相邻间隙 ≤ 1.5×pitch（无大缺口）
  const PITCH = 4.4;
  const perimWalls = walls.filter((w) => w !== gates[0]);
  let maxGap = 0;
  for (const fixed of [iy1, iy2]) {
    const xs = perimWalls.filter((w) => Math.abs(w.y - fixed) < 1.2).map((w) => w.x).sort((p, q) => p - q);
    for (let i = 1; i < xs.length; i++) maxGap = Math.max(maxGap, xs[i] - xs[i - 1]);
  }
  for (const fixedX of [ix1, ix2]) {
    const ys = perimWalls.filter((w) => Math.abs(w.x - fixedX) < 1.2).map((w) => w.y).sort((p, q) => p - q);
    for (let i = 1; i < ys.length; i++) maxGap = Math.max(maxGap, ys[i] - ys[i - 1]);
  }
  // 大门开口 3.6 + 一段墙 4.4 ≈ 8 → 墙↔墙间距 ≤ 门+墙 + 容差
  ok('墙间距无大缺口（≤ 门宽+墙宽+1）', maxGap < 3.6 + PITCH + 1, 'maxGap=' + maxGap.toFixed(2));

  // 大门正对海（heading 180 = 朝 -y）
  ok('大门朝南（heading=180）', gates[0].heading === 180);
}

console.log('--- PORT_LAYOUT 整合：major / small ---');
{
  // 重新构造两份布局（模拟模块展开）
  const major = materializeLayout('major', squareWallLayout);
  const small = materializeLayout('small', squareWallLayout);

  ok('主港元素 ≥45（城墙 24 + 要塞 + 民居 + 码头）', major.length >= 45, 'n=' + major.length);
  ok('小港元素 ≥28', small.length >= 28, 'n=' + small.length);

  const models = new Set([...major, ...small].map((i) => i.model));
  ok('全部模型都有 stack/坐标字段', [...major, ...small].every((i) => typeof i.x === 'number' && typeof i.y === 'number' && typeof i.heading === 'number'));
  ok('城墙体系齐全（wall/window/gate/tower-base/top/roof）',
    ['castle-wall', 'castle-window', 'castle-gate', 'tower-base', 'tower-top', 'tower-roof'].every((m) => models.has(m)));

  // stack 一致性：同一 (x,y) 的零件 stack 严格递增（堆叠成整体）
  const byPos = new Map();
  for (const i of major) {
    const k = i.x.toFixed(1) + ',' + i.y.toFixed(1);
    if (!byPos.has(k)) byPos.set(k, []);
    byPos.get(k).push(i);
  }
  let stackOk = true;
  for (const [, arr] of byPos) {
    if (arr.length < 2) continue;
    const stacks = arr.map((i) => i.stack || 0);
    const sorted = [...stacks].sort((a, b) => a - b);
    if (JSON.stringify(stacks) !== JSON.stringify(sorted)) stackOk = false;
  }
  ok('同点位零件 stack 递增（自下而上）', stackOk);

  // 主塔五层齐全
  const keep = (byPos.get('0.0,13.0') || []).filter((i) => /^tower-/.test(i.model));
  ok('主塔 = 5 层一体（base-door+middle+windows+top+roof）', keep.length === 5,
    keep.map((k) => k.model).join('+'));
}

console.log(fail === 0 ? '\nPASS 方形城墙布局单元测试全通过 (' + pass + ')' : '\nFAIL ' + fail + '/' + (pass + fail) + ' 失败');
process.exit(fail ? 1 : 0);
