// Sketch Wave Racer — 比赛进度系统（Phase 2）
// 职责：检查点通过判定（防作弊顺序制）、圈数、比赛用时、实时排名、
//       越界处理（软边界减速 + 超时重置到最近检查点）、R 键手动重置。
// 设计：任何"选手"（玩家或 AI）都注册为 racer，系统只认其 position。
//
// ★ 判定为何用"连续里程"（Phase 2 用户打回"圈数不变"后重写的关键设计约束，
//   勿改回按帧差 / 按 t 回绕值判定）：
//   线进度 t 模 1、且在航道外会因最近点跳变而剧烈回绕；任何基于"帧与帧
//   之间 t 的差"的判定，在低帧率（软渲染）+ 切弦驾驶下必然漏判/误判。
//   现方案：每帧取最近点线性弧长 s（Track.nearest().arc，不回绕），仅在
//   "0 < Δ ≤ MAX_STEP" 时累加进有界里程 _arcN（∈[0,L)，只前进不回退）；
//   倒退/大幅跳变（重置/传送）→ 重锚 _arcN 且不跨点（防作弊仍靠顺序制 +
//   只前进里程）。过点 = _arcN 抵达 cpArc[nextCp]（同一弧长度量）。
//   该判定与帧率、与 t 的回绕完全无关，起点线附近亦无假跳变。
//   （赛道外"沿岸平行行驶"时 _arcN 会停走——可接受：HUD 警告 + 8s 自动
//   重置兜底；AI 船需走赛道内。）
//
// ★ 越界惩罚不得剥夺动力（历史死锁根因）：水阻衰减带速度下限、自动重置
//   不清零速度、落点为几何最近检查点。曾"衰减到停 + 3.5s 拽回 nextCp-1 +
//   清零速度"，正常切弦驾驶（最近点距离轻松 >15m）每圈被拽回 20+ 次，
//   圈数永远不变、永无完赛横幅。

import { HALF_WIDTH, TOTAL_LAPS } from "../track/Track.js";
import { CONFIG } from "../config.js";

// 单帧最多吸收多少弧长增量（米）。远高于船的最大单帧位移
// （maxSpeed 16 m/s × 最坏帧 0.1s = 1.6m），低于任何"跳点/跳段"。
const MAX_STEP = 25;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

export class RaceState {
  /**
   * @param {Track} track
   * @param {{id:string, label:string, color:number, boat:{position:THREE.Vector3, heading:number, speed:number, setPose?:(p:THREE.Vector3,h:number)=>void}}[]} racers
   */
  constructor(track, racers) {
    this.track = track;
    this.laps = TOTAL_LAPS;
    this.time = 0;
    // started 标志语义：本帧物理/判定是否生效（update 每帧重算；R 键重置
    // 等外部路径在倒计时结束后会自行推进 placeAtCheckpoint，不依赖此标志）。
    this.started = false;      // Phase 4：倒计时结束才 true（false 时冻结判定）
    this.phase = "countdown";  // countdown | racing | over
    this.countdown = CONFIG.raceFlow.countdown; // 剩余倒计时
    this._goLeft = 0;
    this.finishedOrder = [];   // 冲线顺序（结算用）

    // ---- 起步规则（用户需求）：倒计时轰油门的三种下场 ----
    // "1"字窗内才按 = 完美起步（奖励）；"1"字前就按 = GO 帧爆缸（惩罚熄火）；
    // 老实等 GO 才按 = 正常起步。按住累计时长只在膨胀期收集，GO 帧结算。
    this.held = {};            // { racerId: 倒计时内已按住油门时长 s }
    this.heldSince = {};       // { racerId: 本段按住起始 countdown 值（null=未按） }
    this.perfectStart = {};    // { racerId: true } "1"字窗内才首次按下
    this.blown = {};           // { racerId: true } 本局已爆缸（每局每船只爆一次）

    this.entries = racers.map((r) => ({
      ...r,
      nextCp: 1,          // 下一个要过的检查点（起点线 = 0 作为冲线圈线）
      lap: 1,
      progress: 0,        // 0..1 当前圈内线进度（排名用）
      total: 0,           // 累计进度（跨圈，排名用）
      lapStart: 0,
      bestLap: null,
      finished: false,
      finishTime: null,
      place: 1,
      offCourse: 0,       // 越界累计时长
      outOfBounds: false,
      _arcN: undefined,   // 归一化连续里程 ∈ [0, L)，只前进
      _s: 0,              // 本帧最近点线性弧长（米，未回绕）
      _s_prev: 0,         // 上帧最近点线性弧长（米，未回绕）
      _hint: undefined,   // Track.nearest 的跟踪提示（上一帧归一化索引）
    }));

    this.rebuildTrackGeometry();

    this._placeSorted = [];
    this.event = null;   // {type:'lap'|'finish'|'reset', racerId, ...} 供 UI/音效挂钩
  }

  rebuildTrackGeometry(track = this.track) {
    this.track = track;
    // 检查点弧长 ∈ [0, L)（曲线精确投影；t*L 有误差会把起点线判定推偏）
    this.cpArc = track.checkpoints.map((cp) => {
      const n = track.nearest(cp.pos.x, cp.pos.z);
      return ((n.arc % track.length) + track.length) % track.length;
    });

    // 内侧符号自动校准：
    // 闭合中心线在 x-z 平面的绕行方向决定"哪侧法线是航道内侧"。
    let A = 0;
    for (let i = 0; i < track.points.length; i++) {
      const p = track.points[i], q = track.points[(i + 1) % track.points.length];
      A += p.x * q.z - q.x * p.z;
    }
    this._insideSign = A > 0 ? 1 : -1; // +1 = 左法线为内
    return this;
  }

  // 中心线前方 lookAhead 米处向**内侧**偏 inner 米的走线目标点
  _racingLinePoint(pos, lookAhead, inner) {
    const near = this.track.nearest(pos.x, pos.z);
    const lt = (((near.t + lookAhead / this.track.length) % 1) + 1) % 1;
    const tp = this.track.pointAt(lt);
    const tan = this.track.tangentAt(lt);
    return {
      x: tp.x + this._insideSign * -tan.z * inner,
      z: tp.z + this._insideSign * tan.x * inner,
      t: lt,
    };
  }

  // 几何最近的检查点索引（重置落点：偏航时"上一个已过点"可能更远）
  _nearestCpIndex(s) {
    const L = this.track.length;
    let best = 0, bd = Infinity;
    for (const cp of this.track.checkpoints) {
      let d = Math.abs(this.cpArc[cp.index] - s);
      d = Math.min(d, L - d);
      if (d < bd) { bd = d; best = cp.index; }
    }
    return best;
  }

  // 公开 API：把选手摆到指定检查点并清状态（R 键重置 / 越界重置 / 调试）
  placeAtCheckpoint(e, cpIndex) {
    const cp = this.track.checkpoints[cpIndex];
    const p = cp.pos.clone();
    p.y = 0.2;
    e.boat.setPose?.(p, Math.atan2(-cp.tangent.x, -cp.tangent.z));
    // 不清零 speed：保留动能让船能自己开回航道（清零+水阻 = 死锁帮凶）
    e.boat.lateral = 0;
    e.offCourse = 0;
    e.outOfBounds = false;
    // 重锚里程到落点弧长（绝不"就地累加"，防传送被当作前进计圈）。
    // 注意：不推进 nextCp——船在"下一个检查点附近"重置后仍应能正向判过它。
    const a = ((this.cpArc[cpIndex] % this.track.length) + this.track.length) % this.track.length;
    e._s = a;
    e._s_prev = a;
    e._arcN = a;
    e.progress = a / this.track.length;
    return e;
  }

  // ---- AI 走线（Phase 4 AI 船直接调用；与键盘导引同一套几何，防两套漂移）----
  // 返回该选手本帧的连续油门/舵量（override / AI 输入接口用）。
  // 弯道收油：按"前方 lookAhead 处的弯率"预判（8fps 急弯每帧横向甩 1.3m+）。
  autopilotKeys(e, lookAhead = 18, inner = 4) {
    const tgt = this._racingLinePoint(e.boat.position, lookAhead, inner);
    const want = Math.atan2(-(tgt.x - e.boat.position.x), -(tgt.z - e.boat.position.z));
    const err = Math.atan2(Math.sin(want - e.boat.heading), Math.cos(want - e.boat.heading));
    const l0 = (((tgt.t - 8 / this.track.length) % 1) + 1) % 1;
    const l1 = (((tgt.t + 8 / this.track.length) % 1) + 1) % 1;
    const ta = this.track.tangentAt(l0), tb = this.track.tangentAt(l1);
    const curv = Math.abs(Math.atan2(ta.x * tb.z - ta.z * tb.x, ta.x * tb.x + ta.z * tb.z));
    return {
      throttle: Math.abs(err) < 0.5 && curv < 0.02 ? 1 : 0, // 直道油门，弯前收油
      steer: Math.max(-1, Math.min(1, err * 2)),
    };
  }

  // ---- Phase 4：AI 比赛状态 ----
  // 每个 entry 增加 ai 字段（autopilot 油门/舵 + 低速恢复态）。
  // 物理更新顺序约定（main.js / 测试）：updateAi(dt) → 各船 boat.update() →
  // race.update(dt)。AI 输出写 boat.override，BoatController 优先读 override。
  // Phase 4 AI 走线：横向 PD（航向 P + 横向位置 P + 横向速度 D）+ 巡航限速。
// 该控制律经无头扫参验证：全速 3 圈横向偏差 <4m、稳定完赛（见 test/phase4）。
// 曾叠加"目标点追逐 + 弯率收油"两套方案均极限环失速/甩出（见本函数历史
// 注释与 KNOWN_ISSUES）——横向 PD 是最终稳定解，勿回退。
  updateAi(dt) {
    const AI = CONFIG.ai;
    for (const e of this.entries) {
      if (!e.ai) continue;
      const b = e.boat;
      if (e.finished || !this.started) { // 完赛 AI / 倒计时：怠速
        b.override = { throttle: 0, brake: 0, steer: 0 };
        continue;
      }
      const st = e.ai;
      const near = this.track.nearest(b.position.x, b.position.z, e._hint);
      // 横向带符号偏差与横向速度（弧长系近似：dt 固定足够）
      const lat = (near.side || 0) * near.dist;
      st._latPrev = st._latPrev === undefined ? lat : st._latPrev;
      const latVel = (lat - st._latPrev) / Math.max(dt, 1e-3);
      st._latPrev = lat;
      // 前瞻目标：中心线前 lookAhead 米内偏 inner 米
      const lt = ((near.t + AI.lookAhead / this.track.length) % 1 + 1) % 1;
      const tp = this.track.pointAt(lt);
      const tan = this.track.tangentAt(lt);
      const want = Math.atan2(
        -(tp.x + this._insideSign * -tan.z * AI.inner - b.position.x),
        -(tp.z + this._insideSign * tan.x * AI.inner - b.position.z));
      const err = Math.atan2(Math.sin(want - b.heading), Math.cos(want - b.heading));
      // 起步/恢复推进窗口：speed<4 的累积 <1.6s → 强制全油门
      //（出生、重置落点、碰撞 aftermath 都从这里自动回速，无需外部指令）
      st.launchT = b.speed < 4 ? (st.launchT || 0) + dt : 0;
      const launching = st.launchT < 1.6;
      // 目标极速 = 巡航档 + 当前加成（加速带/道具提速期 AI 同样继续推进——
      // 否则 AI 在加成期"油门空转"，加成白给）。
      const boostNow = (b.padBoost || 0) + (b.itemSpeed || 0) +
        (b.starBoostLeft > 0 ? (CONFIG.items.stars?.speedAdd || 0) : 0) +
        (b.giantTime > 0 ? (CONFIG.items.giant?.speedAdd || 0) : 0) +
        (b.driftBoost > 0 ? CONFIG.boat.drift.boostForce : 0);
      const throttle = launching || b.speed < st.speedCap + boostNow ? 1 : 0;
      const steer = clamp(err * AI.gain - lat * AI.kP - latVel * AI.kD, -1, 1);
      b.override = { throttle, brake: 0, steer };
      // Phase 5：道具决策（ItemSystem 注入后生效）。气泡内的由 BoatController
      // 冻结逻辑兜底，这里跳过即可。
      if (this.itemsAi && !b.trapped && !b.airborne) this.itemsAi(dt, e, (pos) => {
        const n = this.track.nearest(pos.x, pos.z);
        return n.dist <= HALF_WIDTH + 6 ? n.arc : null;
      });
    }
  }

  _headingErr(e, near) {
    // 与 autopilotKeys 同一"内侧走线目标"，恢复态用它回正
    const tgt = this._racingLinePoint(e.boat.position, e.ai.lookAhead, e.ai.inner);
    const want = Math.atan2(-(tgt.x - e.boat.position.x), -(tgt.z - e.boat.position.z));
    return want - e.boat.heading;
  }

  // 注册 AI 选手（Phase 4 主流程 / 测试用）。skill∈[0,1] 控制走线激进度。
  addAiRacers(boats, skills) {
    boats.forEach((b, i) => {
      if (!this.entries.some((e) => e.id === b.id)) {
        this.entries.push({
          id: b.id, label: b.label, color: b.color, boat: b.boat,
          nextCp: 1, lap: 1, progress: 0, total: 0, lapStart: 0, bestLap: null,
          finished: false, finishTime: null, place: this.entries.length + 1,
          offCourse: 0, outOfBounds: false, _arcN: undefined, _s: 0, _s_prev: 0,
          _hint: undefined,
        });
        const e = this.entries[this.entries.length - 1];
        const skill = skills?.[i] ?? 0.6;
        const caps = CONFIG.ai.speedCap;
        e.ai = {
          skill,
          speedCap: caps[Math.min(caps.length - 1, Math.floor((1 - skill) * caps.length))],
        };
        // 起步规则的 per-racer 账本（AI 抢跑随机性在 main 的 preCountdown 掷骰）
        e.held = 0; e.heldSince = null; e.perfectStart = false; e.blownStart = false;
        return e;
      }
    });
    // cpArc 已全局，不需重算
    return this.entries;
  }

  // heading 约定：0 = -Z。船的朝向角 = atan2(-fwd.x, -fwd.z)
  static headingFromTangent(tan) {
    return Math.atan2(tan.x, tan.z) + Math.PI; // 反向于前进向量推导
  }

  // 倒计时每帧（main 调用）：油门 = 空挡轰油门——只拉转速（Gauge 实时显示），
  // 船体真实速度恒 0、零位移（raceLive 物理冻结保证）。
  // 账本（per-entry）：
  //   e.rev      当前转速 m/s 表显（升 revRamp / 落 revDrop，封顶 revMax）
  //   e.fated    本局是否已首次按过油门（再按不改命运、不重结算）
  //   e.held     首次按住段的按住时长（爆缸罚时基数，松手定格）
  //   e.holding/e.holdDone 按住段状态
  // 命运在 GO 帧 updateFlow._resolveStarts 结算（转速定结局）；这里只走表。
  // ★ START 之前（菜单上）就按着 W 不许背锅：main 在 START 当帧
  //   race.startArmed=true 才开门。
  noteThrottle(id, down) {
    if (this.phase !== "countdown" || !this.startArmed) return;
    const S = CONFIG.raceFlow.start;
    const e = this.entryOf(id);
    if (!e) return;
    if (down) {
      if (!e.fated) { e.fated = true; e.holding = true; e.holdDone = false; e.held = 0; }
      if (e.holding && !e.holdDone) e.held += this._noteDt; // 首次按住段走表
      e.rev = Math.min(S.revMax, (e.rev || 0) + S.revRamp * this._noteDt);
    } else {
      if (e.holding && !e.holdDone) e.holdDone = true; // 首次松手：按住时长定格
      e.rev = Math.max(0, (e.rev || 0) - S.revDrop * this._noteDt);
    }
  }

  // 转速表每帧推进（main 在倒计时期间调用；noteThrottle 用 _noteDt 记账，
  // 单测可直接设 race._noteDt 后调用 noteThrottle）。
  tickRev(dt, throttleDown) {
    if (this.phase !== "countdown") return;
    this._noteDt = dt;
    this.noteThrottle(this.playerId ?? "player", !!throttleDown);
    // AI 转速由 main 的 aiCountdownHold 直接走表（同参数）
  }

  // 新一局倒计时开始前复位起步账本（main resetRace / preCountdown 调用）
  resetStartLedgers() {
    this.held = {}; this.heldSince = {}; this.perfectStart = {}; this.blown = {};
    this.startArmed = false; // 等 START 当帧再开门
    this._noteDt = 1 / 60;
    for (const e of this.entries) {
      e.held = 0; e.heldSince = null; e.perfectStart = false; e.blownStart = false;
      e.fated = false; e.holding = false; e.holdDone = false; e.since = null;
      e.rev = 0;
    }
  }

  // GO 帧结算（updateFlow 在 phase 翻转的当帧调用）——转速定命运：
  //   rev ≥ rpmBlow  → 爆缸 { racerId, held, penalty=held×0.5 }（轰过头）
  //   rev ∈ 绿区     → 完美起跑：初速 = rev×launchKeepRatio + 临时加成盖章
  //   0 < rev < rpmBlow 或 rev=0 → 正常起步（不奖不罚，初速 0）
  _resolveStarts() {
    const S = CONFIG.raceFlow.start;
    const out = [];
    const ids = new Set([...this.entries.map((e) => e.id), ...Object.keys(this.held)]);
    for (const id of ids) {
      const e = this.entryOf(id);
      if (!e) continue;
      const rev = e.rev || 0;
      const held = e.held || 0;
      if (rev >= S.rpmBlow) {
        e.blownStart = true;
        out.push({ racerId: id, held, penalty: Math.min(S.penaltyMax, held * S.penaltyRatio) });
      } else if (rev >= S.rpmGreenLo) {
        e.perfectStart = true;
        const b = e.boat;
        if (b) {
          b.startBoost = S.boostDuration;
          b.startBoostAdd = S.boostSpeedAdd;
          b.startBoostForce = S.boostForce;
          b.speed = Math.max(b.speed, rev * S.launchKeepRatio); // 弹射初速
          // 完美起跑视觉强度直接取 GO 帧实际膨胀大小：
          // main 倒计时中使用 sqrt(rev/revMax) 写 swell，这里保持同一口径。
          b.launchPower = Math.sqrt(Math.min(1, rev / S.revMax));
          b.launchPop = true; // 视觉：冲出起跑的拉长效果（main 消费）
          b.lastEvent = "perfectstart";
        }
      }
      // 其余：正常起步，零处理
    }
    return out;
  }

  // 比赛流程推进（main 循环在 update 前调用）。
  // 倒计时期间：time 不推进、判定冻结；物理仍可跑（船在出生格里漂着没事，
  // 但 AI 的油门由 updateAi 的 started 门控归零，见 updateAi）。
  updateFlow(dt) {
    if (this.phase === "countdown") {
      this.countdown -= dt;
      if (this.countdown <= 0) {
        this.phase = "racing";
        this.started = true;
        this._goLeft = CONFIG.raceFlow.goFlash; // HUD 显示 "GO!" 的剩余时长
        // GO 帧起步结算：爆缸名单进 go 事件（HUD/音效消费）；
        // 完美起步在 _resolveStarts 内直接盖到船对象上。
        const blown = this._resolveStarts();
        this.event = { type: "go", blown };
      }
      return; // 倒计时期间不扣 GO 窗
    }
    if (this._goLeft > 0) this._goLeft -= dt; // racing/over：GO! 闪现窗计时
  }

  // 展示词（'3'|'2'|'1'|'GO!'|null）。GO! 闪现窗由 updateFlow 计时关闭，
  // 本函数只读不扣——否则被多消费者（HUD/测试）分摊，闪现时长失真。
  flowLabel() {
    if (this.phase === "countdown") return String(Math.ceil(Math.max(this.countdown, 0)));
    if (this._goLeft > 0) return "GO!";
    return null;
  }

  update(dt) {
    // 流程自动开跑：autoStart（无头测试/快速模式）清零倒计时；
    // 浏览器 main 置 autoStart=false → 由 updateFlow 推进 3·2·1·GO。
    if (CONFIG.raceFlow.autoStart && this.phase === "countdown") {
      this.phase = "racing";
      this.countdown = 0;
    }
    this.started = this.phase !== "countdown"; // 每帧同步（倒计时冻结判定/计时）
    if (this.time === null || !this.started) return;
    this.time += dt;
    this.event = null;
    const L = this.track.length;

    for (const e of this.entries) {
      if (e.finished) continue;
      const pos = e.boat.position;
      const near = this.track.nearest(pos.x, pos.z, e._hint);
      e._hint = near.hint; // 回传跟踪提示（窗口加速 + 防跳段）
      e.progress = near.t;
      const s = near.arc; // 线性弧长（米，未回绕 → 无假跳变）
      e._s = s;

      // ---- 连续里程推进（见文件头 ★）----
      if (e._arcN === undefined || e.boat._arcReanchor) {
        e.boat._arcReanchor = false; // 气泡漂行冻结期消费一次性重锚
        e._arcN = s;
        e._s_prev = s;
      } else {
        const d = s - e._s_prev;
        if (d > 0 && d <= MAX_STEP) {
          e._arcN += d;
          if (e._arcN >= L) e._arcN -= L; // 正向跨圈
        } else if (d < 0 || d > MAX_STEP) {
          e._arcN = s; // 倒退/传送：重锚（不判过任何点）
        }
      }
      e._s_prev = s;
      e.total = (e.lap - 1) + e.progress;

      // ---- 检查点通过：里程抵达 nextCp 弧长即判过 ----
      // 起点线（cp0）必须正向抵达才计圈；顺序制天然防跳点/防倒穿。
      if (this._reached(e._arcN, this.cpArc[e.nextCp])) {
        if (e.nextCp === 0) {
          const lapTime = this.time - e.lapStart;
          e.bestLap = e.bestLap === null ? lapTime : Math.min(e.bestLap, lapTime);
          e.lapStart = this.time;
          e.lap += 1;
          if (e.lap > this.laps) {
            e.finished = true;
            e.finishTime = this.time;
            this.finishedOrder.push(e.id);
            this.event = { type: "finish", racerId: e.id };
          } else {
            this.event = { type: "lap", racerId: e.id, lap: e.lap, lapTime };
          }
        }
        e.nextCp = (e.nextCp + 1) % this.track.CP_COUNT;
      }

      // ---- 软边界：越界拖慢（带下限）+ 超时重置到最近检查点 ----
      const out = near.dist > HALF_WIDTH;
      e.outOfBounds = out;
      if (out) {
        e.offCourse += dt;
        const floor = 2.0; // 保留最低动力：低速转不了向 → 开不回航道
        if (e.boat.speed > floor) {
          e.boat.speed = Math.max(floor, e.boat.speed * Math.exp(-1.6 * dt));
        }
        if (e.offCourse > 8) {
          this.placeAtCheckpoint(e, this._nearestCpIndex(s));
          this.event = { type: "reset", racerId: e.id };
        }
      } else {
        e.offCourse = Math.max(0, e.offCourse - dt * 2);
      }
    }

    // ---- 排名：总进度降序；完赛的按完赛时间优先 ----
    this._placeSorted = [...this.entries].sort((a, b) => {
      if (a.finished && b.finished) return a.finishTime - b.finishTime;
      if (a.finished) return -1;
      if (b.finished) return 1;
      return b.total - a.total;
    });
    this._placeSorted.forEach((e, i) => (e.place = i + 1));

    // racing → 全员完赛即进入结算（phase=over）：本帧发 settled 事件
    if (this.phase === "racing" && this.entries.length && this.entries.every((e) => e.finished)) {
      this.phase = "over";
      this.event = { type: "settled", order: [...this.finishedOrder] };
    }
  }

  // 环形 reached：里程 cur 是否已抵达（未越过一圈内过远处）target
  _reached(cur, target) {
    let d = target - cur;
    if (d < 0) d += this.track.length;
    return d < this.track.length * 0.25;
  }

  manualReset(id) {
    const e = this.entries.find((x) => x.id === id);
    if (e && !e.finished) {
      this.placeAtCheckpoint(e, this._nearestCpIndex(e._s));
      this.event = { type: "reset", racerId: e.id };
    }
  }

  // HUD 查询
  entryOf(id) {
    return this.entries.find((x) => x.id === id);
  }

  formatTime(sec) {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    const cs = Math.floor((sec * 100) % 100);
    return `${m}:${String(s).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
  }
}
