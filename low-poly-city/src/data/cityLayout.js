/**
 * cityLayout —— 纯数据：在这里摆放建筑、树木、车道与进入区域。
 * 想改城市的样子，基本只需要改这个文件。
 *
 * 坐标系：十字路把地块分成四个象限（道路占 |x|<=10 或 |z|<=10）。
 * 建筑 x/z 为底面中心；s=缩放 c=秋色索引；树/灌木同理。
 */

export const BUILDINGS = [
  // —— 西北：蓝顶住宅区（白塔 + 橙色侧翼）——
  { type: 'tower', x: -30, z: -24, w: 14, d: 14, h: 34, variant: 'whiteBlue', wing: true },
  { type: 'tower', x: -48, z: -40, w: 12, d: 12, h: 27, variant: 'whiteBlue' },

  // —— 东北：中央商务区（双子塔 + 橙色中层）——
  { type: 'tower', x: 20, z: -30, w: 13, d: 13, h: 46, variant: 'whiteBlue', antenna: true },
  { type: 'tower', x: 36, z: -44, w: 12, d: 12, h: 40, variant: 'gray', antenna: true },
  { type: 'midRise', x: 50, z: -16, w: 12, d: 11, h: 20 },
  { type: 'midRise', x: 52, z: -32, w: 11, d: 10, h: 17 },

  // —— 西南：花园老镇（红顶小镇房 + 圆角塔楼 + 停车场）——
  { type: 'house', x: -34, z: 26, w: 10, d: 8, h: 5 },
  { type: 'roundTower', x: -16, z: 42, r: 6, h: 30, antenna: true },

  // —— 东南：玻璃科技园（幕墙裙房+塔楼 / 阶梯退台公寓）——
  {
    type: 'glassOffice', x: 34, z: 26, w: 30, d: 18, h: 9,
    tower: { dx: -7, dz: -3, w: 12, d: 12, h: 26 },
    deck: { dx: 7, dz: 2, w: 11, d: 9 },
  },
  {
    type: 'stepped', x: 52, z: 48,
    steps: [{ w: 16, d: 16, h: 9 }, { w: 13, d: 13, h: 7 }, { w: 10, d: 10, h: 6 }],
  },
];

/** s=缩放 c=秋色索引(0黄 1橙 2深橙 3绿 4亮黄) */
export const TREES = [
  // 西北
  { x: -14, z: -14, s: 1.0, c: 0 }, { x: -22, z: -52, s: 1.1, c: 1 },
  { x: -38, z: -13, s: 0.9, c: 2 }, { x: -56, z: -20, s: 1.2, c: 2 },
  { x: -14, z: -30, s: 1.0, c: 4 }, { x: -14, z: -46, s: 1.1, c: 1 },
  { x: -30, z: -56, s: 1.0, c: 0 }, { x: -56, z: -56, s: 0.9, c: 3 },
  { x: -24, z: -38, s: 1.15, c: 2 },
  // 东北
  { x: 14, z: -14, s: 1.0, c: 0 }, { x: 30, z: -14, s: 0.9, c: 1 },
  { x: 60, z: -44, s: 1.1, c: 2 }, { x: 44, z: -58, s: 1.0, c: 4 },
  { x: 20, z: -56, s: 1.2, c: 1 }, { x: 12, z: -40, s: 0.9, c: 3 },
  { x: 28, z: -56, s: 1.0, c: 0 }, { x: 58, z: -14, s: 0.9, c: 2 },
  // 西南
  { x: -14, z: 14, s: 1.1, c: 1 }, { x: -56, z: 16, s: 1.0, c: 0 },
  { x: -14, z: 30, s: 0.9, c: 2 }, { x: -30, z: 44, s: 1.0, c: 4 },
  { x: -40, z: 24, s: 1.2, c: 3 }, { x: -56, z: 30, s: 1.0, c: 1 },
  { x: -22, z: 58, s: 1.1, c: 0 }, { x: -44, z: 60, s: 0.9, c: 2 },
  { x: -28, z: 36, s: 1.0, c: 1 },
  // 东南
  { x: 14, z: 14, s: 1.0, c: 2 }, { x: 14, z: 30, s: 1.1, c: 0 },
  { x: 24, z: 58, s: 1.0, c: 1 }, { x: 38, z: 44, s: 0.9, c: 4 },
  { x: 60, z: 20, s: 1.1, c: 3 }, { x: 12, z: 52, s: 1.0, c: 1 },
  { x: 30, z: 14, s: 0.9, c: 0 }, { x: 52, z: 14, s: 1.0, c: 2 },
];

export const BUSHES = [
  { x: -30, z: 32 }, { x: -20, z: 50, s: 1.2 }, { x: -44, z: -20 },
  { x: 24, z: -16, s: 0.8 }, { x: 16, z: 40 }, { x: 44, z: 36, s: 1.1 },
  { x: -52, z: -50 }, { x: 40, z: -20, s: 0.9 },
];

export const BENCHES = [
  { x: -28, z: 16, rotY: Math.PI },
  { x: 16, z: 44, rotY: -Math.PI / 2 },
];

/** 车道：axis=行驶轴，lane=横向坐标，dir=方向(+1/-1) */
export const LANES = [
  { axis: 'x', lane: -3.5, dir: 1, speed: 8, count: 3 },
  { axis: 'x', lane: 3.5, dir: -1, speed: 7, count: 2 },
  { axis: 'z', lane: 3.5, dir: 1, speed: 7.5, count: 2 },
  { axis: 'z', lane: -3.5, dir: -1, speed: 6.5, count: 2 },
];

/** 第一人称进入区域：(x,z) 为落点，(fx,fz) 为进场朝向目标 */
export const ZONES = [
  { name: '蓝湾住区', x: -18, z: -12, fx: -34, fz: -30 },
  { name: '中央商务区', x: 18, z: -12, fx: 40, fz: -30 },
  { name: '花园老镇', x: -18, z: 12, fx: -36, fz: 34 },
  { name: '玻璃科技园', x: 18, z: 12, fx: 38, fz: 34 },
];
