/**
 * 全局常量 —— 调手感、调平衡只改这里
 */
export const VIEW = { width: 960, height: 640 };

export const PHYSICS = {
  step: 1 / 120,        // 物理子步长（秒）：球每步位移 < 半径，等效连续碰撞，防止高速穿模
  maxSpeed: 560,        // 球速上限
  speedUpPerKill: 1.006,// 每破坏一个元素，球速提升系数
  minVy: 70,            // 反弹后垂直速度下限，防止球长时间近乎水平来回弹
};

export const PADDLE = {
  w: 112, h: 14,
  y: VIEW.height - 44,  // 挡板中心 Y
  keySpeed: 620,        // 键盘移动速度 px/s
  maxBounceAngle: Math.PI / 3, // 最大反弹角（相对竖直方向 60°）
};

export const BALL = { r: 8, trail: 14 };

export const SCORE_CFG = {
  comboWindow: 1.6,   // 连击窗口（秒），超时清零
  comboStep: 0.25,    // 每级连击的倍率增量
  maxMult: 5,         // 倍率上限
  speedBonusK: 1200,  // 速度加成：bonus = 1 + speed / K
};

export const START_LIVES = 3;
