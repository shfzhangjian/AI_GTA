// Sketch Wave Racer — 全局配置
// Phase 1：水面、载具驾驶、摄像机参数。

export const CONFIG = {
  renderer: {
    antialias: true,
    pixelRatioCap: 2,
  },
  scene: {
    background: 0xbfe3f2, // 天空地平线色（与天穹底部一致）
    fogColor: 0xbfe3f2,
    fogNear: 120,
    fogFar: 420,
  },
  camera: {
    fov: 60,
    near: 0.1,
    far: 1000,
    position: [10, 8, 14],
    lookAt: [0, 0, 0],
  },
  debugPlaceholder: {
    spinSpeed: 0.6,
  },

  // ------------------------------------------------------------- water
  water: {
    size: 600, // 海面边长
    segments: 180, // 网格细分
    // 多层正弦波：[振幅, 波长, 速度, 方向角(弧度)]
    waves: [
      [0.55, 42, 0.55, 0.0],
      [0.35, 23, 0.8, 1.1],
      [0.22, 13, 1.2, 2.6],
      [0.12, 7, 1.9, 4.2],
      // Phase 6 高频细节波：只进 GLSL 顶点（freq>1 的 JS 船体采样自动跳过）
      [0.05, 4.5, 2.6, 0.9],
      [0.035, 3.0, 3.4, 2.2],
    ],
    colorDeep: 0x2a7fa8, // 深蓝
    colorShallow: 0x6fd3d8, // 浅青
    crestColor: 0xffffff, // 波峰亮色（简化菲涅耳/白帽）
    foamColor: 0xf4fbff,
  },

  // -------------------------------------------------------------- boat
  boat: {
    color: 0xf4b942,
    // 驾驶手感（Phase 1 初值，Phase 3 漂移时再调）
    maxSpeed: 33.3, // m/s = 120 km/h（用户调参：整体速度感）
    maxReverse: 7,
    accel: 15, // 提速到与 120km/h 匹配
    brake: 24,
    drag: 0.62, // 水阻力（高极速下滑行距离更长 = 速度感）
    turnRate: 1.5, // rad/s，满舵角速度
    turnSpdRef: 9, // 达到满转向所需速度
    inertiaLerp: 3.2, // 实际转向响应速度（越小惯性越大）
    bobFreq: 1.6, // 浮动频率
    pitchLerp: 4, // 姿态平滑

    // ------------------------------------------- Phase 3：漂移（Shift）
    drift: {
      minSpeed: 9,        // 低于此速度不触发漂移（需要滑行动能）
      latInject: 0.6,     // 每 (rad/s·m/s) 注入的侧向速度系数（甩尾强度）
      latClamp: 14,       // 漂移侧向速度上限 m/s（甩尾要夸张）
      turnBoost: 1.55,    // 漂移中转向角速度倍率
      drag: 1.15,         // 漂移中前向水阻（比正常 0.7 大：漂移掉速）
      chargePerSec: 0.8,  // 漂移蓄力速率（秒 boost/秒，封顶 chargeMax）
      chargeMax: 1.6,
      minHold: 0.35,      // 有效漂移最短时长（s），不足不给 boost
      boostForce: 14,     // 漂移结束小加速：叠加到 maxSpeed 的临时量
      boostDecay: 1.6,    // boost 指数衰减系数
      boostMax: 20,       // boost 上限
    },

    // ------------------------------------------- Phase 3：空中（跳台/落水）
    air: {
      gravity: 22,        // m/s²
      launchMinSpeed: 10, // 低于此速上跳台弹不起来（只做坡面抬升）
      splashSpeed: 9,     // 落水垂直速度超过此值触发水花事件
      splashUpTime: 0.9,  // 落水后向上缓冲时长
      splashSlow: 0.55,   // 落水瞬间水平速度保留比例
      airVScale: 0.14,    // 弹射初速 = 2.2 + speed*airVScale + height*0.9（滞空 ~1.4s 恒定）
    },
  },

  // ------------------------------------------- Phase 4：AI 走线
  ai: {
    speedCap: [22.5, 19.5, 16.5], // 三档 AI 巡航速度上限 m/s（skill 高→快）
    kP: 0.35, kD: 1.4,          // 横向 PD（扫参：全速 3 圈 maxD<4m 稳定走线）
    gain: 2,                    // 航向 P 增益
    lookAhead: 25,              // 前瞻米
    inner: 3,                   // 走线内偏米
  },

  // ------------------------------------------- Phase 3：碰撞 / 赛道特征
  trackFeatures: {
    boost: {
      padHalfWidth: 4.5,  // 加速带横向半宽
      padLength: 14,      // 弧长长度
      speedAdd: 14,       // 通过后的临时 maxSpeed 加成（秒进 170km/h，要炸裂）
      decay: 0.55,        // 加成衰减（保持 3-4s 明显加速段）
      maxTotal: 24,       // 加速加成总量上限
      cooldown: 1.5,      // 同一加速带重复触发冷却（秒）
    },
    ramps: [{ t: 0.30, height: 1.7 }], // 跳台：位置/高度
    colliderRadius: 1.1,  // 船体碰撞半径
    boatDeflect: 0.6,     // 船撞船：分离 + 速度偏转强度（轻微）
    obBounce: 0.35,       // 撞固定障碍物法向反弹系数
    obSpeedKeep: 0.55,    // 撞固定障碍物后水平速度保留比例
  },

  // ------------------------------------------- Phase 4：比赛流程
  raceFlow: {
    countdown: 3.0,  // 3·2·1·GO 倒计时秒数
    goFlash: 0.8,    // GO! 停留时长
    autoStart: true, // 自动化/无头测试立即开跑（浏览器 main 会置 false，人工按节奏出发）

    // ---------------- 起步规则（用户重设计：倒计时"拉转速"，GO 帧按转速定命运）
    // 倒计时期间油门 = 空挡轰油门：转速表（Gauge 指针）实时升起，但船体
    // 真实速度恒 0、零位移（raceLive 冻结保证）。GO 帧结算：
    //   转速 ∈ [rpmGreenLo, rpmGreenHi] → 完美起跑（奖励：瞬时初速 + 临时极速）
    //   转速 > rpmBlow                        → 爆缸（惩罚：熄火 = 按住时长×0.5）
    //   其余（低速挂着 / 根本没转速）        → 正常起步，不奖不罚
    start: {
      revRamp: 8.0,        // 转速升速 m/s²（纯表显；~2s 轰到 16 m/s ≈ 58km/h）
      revDrop: 1.2,        // 松油门转速回落 m/s²（缓慢掉回怠速）
      revMax: 17.0,        // 转速上限 m/s（≈61km/h 表显，红区）
      rpmGreenLo: 7.4,     // 奖励绿区下限 m/s（≈27km/h；过线即弹射 80% 转速起步）
      rpmGreenHi: 13.2,    // 奖励绿区上限 m/s（≈48km/h，80% 表程）
      rpmBlow: 15.5,       // 爆缸上限 m/s（≈56km/h；绿区与爆线间 = 不奖不罚带）
      penaltyRatio: 0.35,  // 爆缸惩罚熄火时长 = 提前按住时长 × 0.35
      penaltyMax: 1.0,     // 惩罚/爆缸动画总时长上限（用户要求：不超过 1s）
      boostSpeedAdd: 10,   // 完美起跑：临时极速加成 m/s（≈+36km/h）
      boostForce: 8,       // 完美起跑：起步推力 m/s²（GO 后按住油门快速拉离）
      boostDuration: 1.6,  // 完美起跑：加成持续（s）
      launchKeepRatio: 0.85,// GO 结算时初速保留比例（转速越高弹射越猛，但要防爆线）
      launchMin: 4.0,      // GO 帧低于此转速 = 无初速（老实等 GO 的正常起步）
      aiFalseStartChance: 0.3, // AI 随机抢跑概率（每局判定一次）
      // 视觉量（用户实测"大多少"调参处）
      swellBoatScale: 0.6,   // 整船胀大系数：swell=1 → scale 1.6×
      swellMotorScale: 1.0,  // 马达鼓包额外系数（叠在整船之上）
      swellShake: 0.06,      // 越憋越抖幅度（米）
      blowPopScale: 0.7,     // 爆缸冲击弹跳峰值（+70% 体积起爆）
      launchStretch: 1.5,    // 完美起跑 Z 拉长峰值（会按 GO 帧实际膨胀强度放大）
      launchSquash: 0.88,    // 拉长时 X/Y 收窄
      launchForward: 2.4,    // 完美起跑视觉前冲距离（米，按 GO 帧实际膨胀强度缩放）
      launchRestoreTime: 5.0,// 完美起跑从膨胀态逐步变回正常大小的总时长（s）
      popDriverTime: 1.0,    // 爆缸弹出→落水漂浮→闪动还原最长时长（实际按抢跑时长动态计算）
      popHeadZ: 0.25,        // 爆缸余晃：船头前后弹（米）
      popHeadY: 0.55,        // （历史保留）上颠峰值参考
      popPeriod: 0.24,       // 船体余晃周期（s）
    },
  },

  // ------------------------------------------- Phase 5：道具系统
  items: {
    // 道具箱：沿赛道分布（t 参数），船上进入半径即拾取
    boxes: { ts: [0.16, 0.37, 0.62, 0.88], lanes: [0, -5.6, 5.6], radius: 3.0, respawn: 7.0 },
    // 权重（均匀：每种 1）
    weights: { speed: 1, missile: 1, bubble: 1, shield: 1, wave: 1, turbo: 1, lightning: 1, giant: 1, bomb: 1 },
    speed:  { speedAdd: 12, decay: 0.1 }, // 闪电冲刺：+43km/h 数秒
    missile:{ speed: 45, range: 75, radius: 3.2, slowKeep: 0.3, spin: 1.5 }, // 更快更远更狠
    bubble: { speed: 30, range: 68, radius: 3.6, floatTime: 2.2, popDrop: 8.0,
      homing: 5.5, targetMinAhead: 4, targetMaxAhead: 70 }, // 追踪泡：随机锁前方选手
    trap:   { slowKeep: 0.18 },                 // 入泡瞬间速度保留比例
    shield: { duration: 6.0 },
    wave:   { radius: 16, push: 12, slowKeep: 0.4 }, // 音爆波范围/推离/掉速增强
    turbo:  { speedAdd: 10, duration: 5.0 }, // 涡轮：+36km/h 定长 5s
    stars:  {
      spawnInterval: [7.0, 11.0], chance: 0.72, chainMin: 3, chainMax: 5,
      aheadMin: 12, aheadMax: 20, spacing: 7.0, lateral: 1.6,
      radius: 2.4, life: 10.0, speedAdd: 8, boostDuration: 2.0, maxDuration: 10.0,
    },
    lightning: { duration: 3.2, slowDecay: 1.2 },
    giant:  { speedAdd: 9, duration: 4.0, shrinkTime: 2.2, scale: 1.55 },
    bomb:   { fuse: 2.0, radius: 12, throwSpeed: 25, throwRange: 34, slowKeep: 0.32, push: 8 },
    ai:     { useDelay: [0.8, 2.2], missileMinAhead: 6, missileMaxAhead: 45,
              bubbleBehind: [-45, -4], shieldWhenHit: true },
  },

  // ------------------------------------------- 动态危险物：飞鱼突袭
  flyingFish: {
    enabled: true,
    // 每秒概率：第 1/2/3 名更容易遇到飞鱼，后面的不会触发。
    rankChancePerSec: [0.12, 0.08, 0.05],
    cooldown: [5.0, 8.0],
    ahead: [24, 38],
    crossTime: 1.8,
    life: 2.6,
    radius: 2.0,
    jumpHeight: 3.1,
    laneJitter: 3.0,
    slowKeep: 0.35,
    push: 5.5,
  },

  // ------------------------------------------- Phase 7+：音效
  audio: {
    engineGain: 0.13, // 引擎满速音量（0~1，主音量另存 localStorage swr-volume）
  },

  // ------------------------------------------- Phase 6：画质分档 + 喷溅粒子
  quality: {
    low:  { name: "low",  waterSegments: 90,  detailNormals: false, particles: 300 },
    high: { name: "high", waterSegments: 180, detailNormals: true,  particles: 1400 },
    auto: { name: "auto", waterSegments: 140, detailNormals: true,  particles: 900 },
  },
  defaultQuality: "high",
  spray: {
    gravity: 14,       // 水滴重力 m/s²
    wakePerSec: 26,    // 尾迹喷溅速率（满速时）
    splashPerMs: 2.2,  // 落水：每 m/s 垂直速度产生的水花数
    splashMax: 60,
  },

  // ---------------------------------------------------------- camera follow
  followCam: {
    backDist: 9, // 跟随距离
    height: 4.2,
    lookHeight: 1.2,
    posLerp: 3.5, // 位置平滑
    lookLerp: 6, // 注视点平滑
    speedPush: 0.12, // 速度越快拉得越远/越高
  },
};
