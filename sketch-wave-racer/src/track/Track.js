// Sketch Wave Racer — 第一张赛道：卡通海湾环线（Phase 2）
// 数据与可视化分离：本模块提供中心线样条 + 横向采样 + 检查点定义；
// 网格/浮标/拱门在 TrackView.js。赛道为"水上航道"：浮标是装饰边界，
// 真正判界用 outOfBounds（距中心线距离 + 可选内湖禁区）。

import * as THREE from "three";

// 控制点（x, z）：起终点在 t=0，顺切向前进。
// 布局：长直道(南) → 右大弯(东) → 东岸 → S 弯(北) → 西岸 → 回南直道。
export const DEFAULT_CONTROL_POINTS = [
  [0, -140], [80, -130], [140, -90], [150, -20], [110, 30], [60, 60],
  [20, 110], [-40, 140], [-110, 130], [-150, 80], [-140, 10], [-90, -40],
  [-60, -90], [-20, -140],
];

export const HALF_WIDTH = 15; // 航道半宽（米）
export const TOTAL_LAPS = 3;

export class Track {
  constructor(map = {}) {
    this.configure(map);
  }

  configure(map = {}) {
    this.map = {
      id: map.id || "cartoon-bay",
      name: map.name || "卡通海湾环线",
      style: map.style || "bay",
      difficulty: map.difficulty || 1,
      controlPoints: map.controlPoints || DEFAULT_CONTROL_POINTS,
    };
    this.curve = new THREE.CatmullRomCurve3(
      this.map.controlPoints.map(([x, z]) => new THREE.Vector3(x, 0, z)),
      true,
      "centripetal",
      0.5
    );
    this.length = this.curve.getLength();

    // 预采样用于最近点查询（均匀弧长参数）
    this.SAMPLES = 800;
    this.points = this.curve.getSpacedPoints(this.SAMPLES).slice(0, this.SAMPLES);

    // 检查点：每 1/10 圈一个（含起点线 = index 0）
    this.CP_COUNT = 10;
    this.checkpoints = [];
    for (let i = 0; i < this.CP_COUNT; i++) {
      const t = i / this.CP_COUNT;
      const p = this.curve.getPointAt(t);
      const tan = this.curve.getTangentAt(t).normalize();
      this.checkpoints.push({
        index: i,
        t,
        pos: p.clone(),
        tangent: tan,
        normal: new THREE.Vector3(-tan.z, 0, tan.x), // 横向
      });
    }

    this.startLine = this.checkpoints[0];
    return this;
  }

  // 世界坐标 → { t, arc, dist, side, hint } 最近中心线信息。
  // ★ Phase 2 打回（"圈数不变"）的两处根因都在这里（务必保留修复语义）：
  //   1) 旧版把"最近采样**点**"当最近点：船在线段中段时投到端点，弧长出现
  //      最大 ±半段长(~0.5m) 的阶梯抖动；起点线判定与连续里程被抖动重锚。
  //      现对**采样段做投影**（u∈[0,1] 连续），弧长在段内也连续。
  //   2) 旧版每帧全量 argmin：赛道自邻近处（对岸）会抢走最近点，t 整段跳变。
  //      现用"上一帧 hint ± 窗口"跟踪最近段，候选显著劣化（传送/重置）才
  //      回退全量。调用方（RaceState）逐帧回传 hint。
  // hint：上一帧返回的归一化索引 [0,1)（-1 = 无提示，全量扫描）。
  nearest(x, z, hint = -1) {
    const pts = this.points;
    const N = this.SAMPLES;
    let bi = -1, best = Infinity;
    if (hint >= 0) {
      const W = 8; // ±窗口（帧位移 ≤2m ≈ ±2 段，宽裕）
      const i0 = Math.round(hint * N);
      for (let k = -W; k <= W; k++) {
        const i = ((i0 + k) % N + N) % N;
        const r = this._segProj(x, z, i);
        if (r.d2 < best) { best = r.d2; bi = i; }
      }
      // 劣化哨兵（防 hint 失效后黏在错误段）：1/4 粗扫若有明显更近的点，
      // 说明发生了传送/重置级别的位置跳变 → 全量重扫。
      let coarse = Infinity;
      for (let i = 0; i < N; i += 4) {
        const p = pts[i];
        const dx = p.x - x, dz = p.z - z;
        const d = dx * dx + dz * dz;
        if (d < coarse) coarse = d;
      }
      // coarse 是"到采样**点**"的距离²，窗口 best 是"到采样**段**"的距离²。
      // 比较前必须给粗扫补上最多半段的投影优势（seglen≈1.13m → 修正 ≤0.57m），
      // 否则直跑中心线时 coarse 恒比 best 小半段 → 每帧误判"候选劣化"→
      // 全量重扫 → 赛道对岸在急弯抢走最近点 → 线进度乱跳（Phase 2 事故帮凶）。
      const halfSeg = this.length / N / 2;
      const coarseD = Math.sqrt(coarse) - halfSeg;
      const winD = Math.sqrt(best);
      if (coarseD < winD - 1e-9) bi = -1;
    }
    if (bi < 0) {
      best = Infinity;
      for (let i = 0; i < N; i++) {
        const r = this._segProj(x, z, i);
        if (r.d2 < best) { best = r.d2; bi = i; }
      }
    }
    return this._segResult(x, z, bi);
  }

  // 点 (x,z) 到采样段 [pts[i], pts[i+1]] 的最近点（段内投影 u∈[0,1]，连续）
  _segProj(x, z, i) {
    const pts = this.points;
    const p = pts[i], q = pts[(i + 1) % this.SAMPLES];
    const ex = q.x - p.x, ez = q.z - p.z;
    const len2 = ex * ex + ez * ez;
    let u = 0;
    if (len2 > 1e-12) u = Math.max(0, Math.min(1, ((x - p.x) * ex + (z - p.z) * ez) / len2));
    const px = p.x + ex * u, pz = p.z + ez * u;
    const dx = x - px, dz = z - pz;
    return { d2: dx * dx + dz * dz, u, i };
  }

  _segResult(x, z, i) {
    const pts = this.points;
    const N = this.SAMPLES;
    const r = this._segProj(x, z, i);
    const p = pts[i], q = pts[(i + 1) % N];
    const ex = q.x - p.x, ez = q.z - p.z;
    const el = Math.sqrt(ex * ex + ez * ez) || 1;
    const tx = ex / el, tz = ez / el;
    const px = p.x + ex * r.u, pz = p.z + ez * r.u;
    const vx = x - px, vz = z - pz;
    const along = vx * tx + vz * tz;
    const lateral = vx * -tz + vz * tx;
    // 连续弧长：段基弧长 + 段内 u 细分 + 纵向偏移（小值，半段内）。
    // 该 arc 是**线性值**（可 <0 / >length，不回绕）。
    // ★ 返回前把纵向过冲裁到 [-半段, +半段]：船冲过检查点线时，未裁剪的
    //   along 可达 ±5m 级；纯追踪导引会把"arc 倒退"误读成偏航猛打舵→
    //   船被自己导引甩出航道。裁剪后 arc 沿任何真实行驶**严格单调**。
    const half = el / 2;
    const alongC = Math.max(-half, Math.min(half, along));
    const arc = ((i + r.u) / N) * this.length + alongC;
    return {
      t: ((arc / this.length) % 1 + 1) % 1,
      arc,
      dist: Math.abs(lateral),
      side: Math.sign(lateral),
      // hint 归一到 [0,1)：起点线前（along<0）时为负会被 `hint >= 0`
      // 判据当"无提示"，每帧退化全量扫描（浪费但无害）；归一后正常跟踪。
      hint: (((i + r.u) / N) % 1 + 1) % 1,
    };
  }

  // 中心线上 t 处的点（贴水面由调用方处理）
  pointAt(t) {
    return this.curve.getPointAt(((t % 1) + 1) % 1);
  }

  tangentAt(t) {
    return this.curve.getTangentAt(((t % 1) + 1) % 1).normalize();
  }

  isOnTrack(x, z, margin = 0) {
    return this.nearest(x, z).dist <= HALF_WIDTH + margin;
  }
}
