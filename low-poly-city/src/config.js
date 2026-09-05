/**
 * 全局配置 —— 调色板与世界参数。
 * 想调整整体美术风格（颜色、尺寸、行走速度等），只改这里即可。
 */

export const PALETTE = {
  // 环境
  sky: 0xeef1f5,
  fogNear: 140,
  fogFar: 320,
  slabSide: 0xc9ced6,   // 地块底座侧面（浅灰）

  // 地面
  grass: [0x8fbf5a, 0x9cc766, 0x84b34e], // 草地色（多档轻微变化）
  sidewalk: 0xd7dbe2,   // 人行道
  asphalt: 0x3a3f47,    // 沥青路面
  paint: 0xf2f4f6,      // 道路标线白

  // 建筑立面（CSS 字符串，供 CanvasTexture 使用）
  wallWhite: '#f5f7f9', winBlue: '#8fbfe8', roofBlue: '#3f7fc4',
  wallGray: '#e7eaef',  winGray: '#6d7b8a', roofGray: '#9aa4af',
  wallOrange: '#ef7d3b', winCream: '#fff1da', roofOrange: '#d95f26',
  glassBase: '#5b9bd5',

  // 植被 / 道具
  roofGreen: 0x6fae4e,  // 屋顶绿化
  trunk: 0x8a5a33,
  foliage: [0xf4b423, 0xf08a2e, 0xe86f2a, 0x7fae4e, 0xf7c948], // 秋色系
  wood: 0xa3703f,
  metal: 0x6f7b8a,
  lampGlow: 0xffe9b0,
  car: [0xd94b41, 0x4a90d9, 0xf4c127, 0xf2f4f6, 0x555c66, 0x3fb37f],
};

/** 世界尺寸（单位≈米）。整个城市是一块 half×half 的方形“浮岛”地块。 */
export const WORLD = {
  half: 64,        // 地块半边长
  roadHalf: 7,     // 十字路口的半宽（全路宽 14）
  walk: 3,         // 人行道宽度
  surfGrass: 0.3,  // 草地/人行道顶面高度（建筑基准面）
  surfRoad: 0.18,  // 沥青路面顶面高度
};

/** 第一人称漫游参数 */
export const FP = {
  eye: 1.7,        // 视点高度
  radius: 0.55,    // 玩家碰撞半径（圆形）
  walkSpeed: 6,    // 步行 m/s
  runSpeed: 10.5,  // 奔跑 m/s
  bounds: 62,      // 可行走范围（防止走出地块）
};
