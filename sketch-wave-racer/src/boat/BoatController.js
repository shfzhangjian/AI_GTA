// Sketch Wave Racer — 玩家驾驶控制器（Phase 1 初版 + Phase 3 漂移/跳台/加速带/碰撞）
// 手感目标：水上滑行感 > 陆地感。转向带惯性、加速抬头、随波浪上下浮动与横摇。
// Phase 3：
//   - Shift 漂移：甩尾（侧向冻结衰减 + 强注入）、掉速、出漂按蓄力给小加速；
//   - 跳台：冲上坡且速度足够 → 弹道起飞 → 落水浮动缓冲；
//   - 加速带：由 RaceState 连续里程正向跨线触发（与圈数判定同一套帧率解耦机制）；
//   - 障碍/船体碰撞：update 尾部交给 CollisionWorld 统一求解。
// 接口约定（无头测试 / CollisionWorld / RaceState 依赖，勿破坏）：
//   position{x,y,z}, heading, speed, lateral, airborne, setPose(pos,h),
//   update(dt,t), speedKmh, override{throttle,brake,steer,drift}。

import * as THREE from "three";
import { CONFIG } from "../config.js";
import { sampleWater } from "../water/Water.js";

export class BoatController {
  /**
   * @param {THREE.Group} object3D 载具视觉节点（createBoat 的 group）
   * @param {object} input  InputState 实例
   * @param {{track?:object, features?:object, race?:object, raceId?:string,
   *          collision?:object, mates?:()=>object[]}} ctx
   *        Phase 3 可选依赖；未注入时行为与 Phase 1 完全一致（向后兼容）。
   */
  constructor(object3D, input, ctx = {}) {
    this.obj = object3D;
    // 起步规则的视觉节点句柄（BoatModel 的 group + 方法，非物理组本身）。
    // ★ 勿与 this.obj 混用：obj 是 THREE.Group，没有 setEngineSwell 等方法。
    this.view = ctx.view || null;
    this.input = input;
    this.track = ctx.track || null;
    this.features = ctx.features || null;
    this.race = ctx.race || null;
    this.raceId = ctx.raceId || null;
    this.collision = ctx.collision || null;
    this.mates = ctx.mates || null; // () => BoatController[]（AI 船）

    this.position = new THREE.Vector3(0, 0, 0);
    this.heading = 0; // 弧度，0 = -Z
    this.speed = 0; // 前向速度（负为倒车）
    this.lateral = 0; // 侧向滑移速度（滑行感核心）
    this.steer = 0; // 平滑后的舵量 [-1,1]

    this.roll = 0; // 横摇（随波浪）
    this.pitch = 0; // 俯仰（加速抬头 / 落水浮动）
    this.bobPhase = Math.random() * Math.PI * 2;

    // ---- Phase 3 运行时状态 ----
    this.drifting = false;   // 本帧是否处于漂移
    this.driftTime = 0;      // 本次漂移已持续（s）
    this.driftCharge = 0;    // 漂移蓄力（决定出漂 boost 时长）
    this.driftBoost = 0;     // 出漂加速剩余时长（s）
    this.padBoost = 0;       // 加速带临时极速加成（m/s，随时间衰减）
    this.airborne = false;   // 空中（跳台弹射后 true；空中不贴合波浪/不碰撞）
    this.airV = 0;           // 垂直速度 m/s
    this.airPos = 0;         // 波面之上的附加高度
    this.splashUp = 0;       // 落水上浮缓冲剩余时长（s）
    this.lastEvent = null;   // 'driftboost'|'launch'|'splash'|'boostpad'|'hit'
    this._hitCool = -9;      // 碰撞事件节流时刻（防每帧刷屏）

    // ---- Phase 5 运行时（道具效果槽位，由 ItemSystem 施加/清除）----
    this.itemSpeed = 0;      // 临时极速加成（speed/turbo 道具共用，decay 衰减）
    this.shield = 0;         // 护盾剩余时长（>0 免疫下一次道具命中后归零）
    this.trapped = 0;        // 气泡陷阱剩余时长（>0 冻结动力，随波漂浮）
    this._trappedFrom = 0;   // 入泡速度（破泡掉速参考）
    this.item = null;        // 持有道具（ItemSystem 读写：拾取/使用/清空）
    this.turboLeft = 0;      // Turbo Charge 固定加速剩余时长（到期才清 itemSpeed）
    this.starBoostLeft = 0;  // 连续星星：每颗 +2s，期间给固定极速加成
    this.lightningSlow = 0;  // 闪电攻击：剩余渐慢时间
    this.giantTime = 0;      // 巨大化加速持续时间
    this.giantShrink = 0;    // 巨大化结束后的视觉缩回时间
    this.giantScale = 1;     // 视觉倍率（由 update 推进，BoatModel 消费）
    this._arcReanchor = false; // 气泡漂行后 RaceState 需重锚里程（一次性消费）
    this.onSplash = null;      // (airV)=>void 落水回调（main 接粒子水花；测试桩）

    // ---- 起步规则运行时（RaceState._resolveStarts / main 写入）----
    this.blownUp = 0;          // 抢跑爆缸熄火惩罚剩余时长（>0 油门无效）
    this.popT = 0;             // 爆缸弹簧弹出动画剩余（船头弹出缩回；>0 锁一切动力）
    this.popDur = 1.0;         // 本次弹跳时长（main 按惩罚时长写入）
    this.startBoost = 0;       // 完美起跑加成剩余时长（RaceState 盖章写入）
    this.startBoostAdd = 0;    // 完美起跑临时极速加成 m/s
    this.startBoostForce = 0;  // 完美起跑起步推力 m/s²
    this.launchPop = false;    // 完美起跑拉长一次性旗（BoatModel 消费）
    this.launchPower = 0;      // 完美起跑视觉强度：来自 GO 帧实际膨胀大小 0..1
    this.swell = 0;            // 倒计时膨胀视觉量 0..1（main 每帧写入，物理无关）

    this._vel = new THREE.Vector3();
  }

  // 供比赛系统重置位置（RaceState.placeAtCheckpoint 调用）
  setPose(pos, heading) {
    this.position.copy(pos);
    this.heading = heading;
    this.speed = 0;
    this.lateral = 0;
    this.steer = 0;
    // Phase 3：清空中/漂移状态（重置不给 boost，防"重置骗加速"）
    this.drifting = false;
    this.driftTime = 0;
    this.driftCharge = 0;
    this.driftBoost = 0;
    this.airborne = false;
    this.airV = 0;
    this.airPos = 0;
    this.splashUp = 0;
    // Phase 5：重置 = 惩罚性落点，清道具效果（持有物 item 保留——道具是奖励）
    this.itemSpeed = 0;
    this.turboLeft = 0;
    this.starBoostLeft = 0;
    this.lightningSlow = 0;
    this.giantTime = 0;
    this.giantShrink = 0;
    this.giantScale = 1;
    if (this.view?.setItemScale) this.view.setItemScale(1);
    this.shield = 0;
    this.trapped = 0;
  }

  // 外部施加的操控/油门覆盖（越界拖慢、AI 输入用），默认取键盘
  _throttle() {
    return (this.override?.throttle ?? (this.input.isDown("throttle") ? 1 : 0))
      - (this.override?.brake ?? (this.input.isDown("brake") ? 1 : 0));
  }
  _steerInput() {
    return this.override?.steer ??
      ((this.input.isDown("right") ? 1 : 0) - (this.input.isDown("left") ? 1 : 0));
  }
  _driftHeld() {
    return this.override?.drift ?? (this.input.isDown("drift") ? 1 : 0);
  }

  update(dt, t) {
    const B = CONFIG.boat;
    const D = B.drift;
    const A = B.air;
    const raceLive = !this.race || this.race.started !== false;
    const I = CONFIG.items;
    if (raceLive) {
      if (this.starBoostLeft > 0) this.starBoostLeft = Math.max(0, this.starBoostLeft - dt);
      if (this.lightningSlow > 0) {
        this.lightningSlow = Math.max(0, this.lightningSlow - dt);
        const k = I.lightning?.slowDecay ?? 1.1;
        this.speed *= Math.exp(-k * dt);
        this.lateral *= Math.exp(-k * 0.8 * dt);
      }
      if (this.giantTime > 0) {
        const was = this.giantTime;
        this.giantTime = Math.max(0, this.giantTime - dt);
        if (was > 0 && this.giantTime === 0) {
          this.giantShrink = Math.max(this.giantShrink || 0, I.giant?.shrinkTime ?? 2.0);
        }
      } else if (this.giantShrink > 0) {
        this.giantShrink = Math.max(0, this.giantShrink - dt);
      }
    }
    const giantMax = I.giant?.scale ?? 1.5;
    const shrinkTime = Math.max(0.01, I.giant?.shrinkTime ?? 2.0);
    this.giantScale = this.giantTime > 0
      ? giantMax
      : (this.giantShrink > 0 ? 1 + (giantMax - 1) * (this.giantShrink / shrinkTime) : 1);
    if (this.view?.setItemScale) this.view.setItemScale(this.giantScale);
    // ---- 爆缸弹跳期（用户要求）：船头像弹簧一样弹出、慢慢缩回，
    // 缩回完成（popT 归零）前锁死一切动力——不许"向前行驶"。
    // 只贴合波浪 + 转视觉姿态，物理/判定/特征全冻结。
    if (this.popT > 0) {
      this.popT = Math.max(0, this.popT - dt);
      this.speed = 0;
      this.lateral = 0;
      const w = sampleWater(this.position.x, this.position.z, t);
      this.position.y += (w.y + 0.18 - this.position.y) * Math.min(1, 4 * dt);
      this.obj.position.copy(this.position);
      this.obj.rotation.set(this.pitch, this.heading, this.roll, "YXZ");
      if (this.view?.setEngineSwell) this.view.setEngineSwell(0);
      // 驱动爆缸动画（驾驶员弹出抛物线 + 回弹）——锁定期必须持续喂帧，
      // 否则 _spring 动画冻结在起爆帧 = "没效果"。
      if (this.view?.applySwellShake) this.view.applySwellShake(dt, t);
      return this;
    }
    // Phase 5：气泡陷阱 = 动力全冻结（override 与键盘都不生效，只随波漂浮）
    if (this.trapped > 0) {
      this.trapped -= dt;
      if (this.trapped <= 0) {
        this.trapped = 0;
        if (this.speed > CONFIG.items.bubble.popDrop) this.speed = CONFIG.items.bubble.popDrop; // 破泡限速
        this.lastEvent = "bubblepop";
      }
      const w = sampleWater(this.position.x, this.position.z, t);
      this.position.y += (w.y + 0.18 - this.position.y) * Math.min(1, 4 * dt);
      this.lateral *= Math.exp(-3 * dt);
      this.drifting = false;
      this.driftCharge = 0;
      this.driftTime = 0; // trapped 结束不得"白放"出漂 boost
      this.obj.position.copy(this.position);
      this.obj.rotation.set(this.pitch, this.heading, this.roll, "YXZ");
      return this; // 气泡内：物理判定/碰撞/特征全冻结
    }
    if (this.shield > 0) this.shield = Math.max(0, this.shield - dt);
    // ---- 起步规则：完美起跑加成（RaceState GO 帧盖章，扣减门控 raceLive：
    // 倒计时冻结期不扣、GO 当帧起扣）；爆缸熄火惩罚（>0 油门全吞，只留滑行）
    if (this.startBoost > 0 && raceLive) this.startBoost = Math.max(0, this.startBoost - dt);
    if (this.blownUp > 0) this.blownUp = Math.max(0, this.blownUp - dt);
    // 道具加速：turbo 固定时长线性到期；speed 指数衰减（decay 系数）
    if (this.turboLeft > 0) {
      this.turboLeft -= dt;
      if (this.turboLeft <= 0 && this.itemSpeed > 0) this.itemSpeed = 0;
    } else if (this.itemSpeed > 0) {
      this.itemSpeed = Math.max(0, this.itemSpeed - CONFIG.items.speed.decay * this.itemSpeed * dt);
    }

    // ================================================== 漂移状态机
    const steerRaw = this._steerInput();
    // 比赛进行中才可漂移：倒计时/菜单冻结（race.started=false）时 Shift+方向
    // 不得进入漂移态——否则倒计时"假蓄力"，GO 帧 started 翻 true 而 Shift 已松
    // → 走"出漂结算"在起点原地爆 boost（用户反馈"原地爆炸"）。
    const drifting = !!this._driftHeld() &&
      raceLive &&
      !this.airborne &&
      Math.abs(this.speed) >= D.minSpeed &&
      Math.abs(steerRaw) > 0.5; // 漂移必须带转向意图（纯 Shift 不算甩尾）
    if (drifting) {
      if (!this.drifting) this.driftTime = 0;
      this.driftTime += dt;
      this.driftCharge = Math.min(D.chargeMax, this.driftCharge + D.chargePerSec * dt);
    } else if (this.drifting) {
      // 出漂结算：有效漂移 + 前进中 → 小加速（力度固定，时长=蓄力量）
      if (this.driftTime >= D.minHold && this.speed > 0) {
        this.driftBoost = Math.min(D.boostMax / D.boostForce, this.driftCharge);
        this.lastEvent = "driftboost";
      }
      this.driftCharge = 0;
      this.driftTime = 0;
    }
    this.drifting = drifting;
    if (this.driftBoost > 0) this.driftBoost = Math.max(0, this.driftBoost - dt);
    if (this.padBoost > 0) {
      const TF = CONFIG.trackFeatures.boost;
      this.padBoost = Math.max(0, this.padBoost - TF.decay * this.padBoost * dt);
    }
    // 起步规则加料：完美起跑 = 临时极速加成 + 起步推力；
    // 爆缸熄火（blownUp>0）压到怠速极速（能转向脱困，轰不出前进动力）
    const sb = this.startBoost > 0 ? (this.startBoostAdd || 0) : 0;
    const starBoost = this.starBoostLeft > 0 ? (CONFIG.items.stars?.speedAdd || 0) : 0;
    const giantBoost = this.giantTime > 0 ? (CONFIG.items.giant?.speedAdd || 0) : 0;
    let maxSpeed = B.maxSpeed + this.padBoost + (this.itemSpeed || 0) +
      starBoost + giantBoost + (this.driftBoost > 0 ? D.boostForce : 0) + sb;
    if (this.blownUp > 0) maxSpeed = Math.min(maxSpeed, 8);

    // ------------------------------------------------ 油门 / 刹车 / 空中
    // 倒计时/暂停冻结：race.started=false 时油门刹车全部吞掉——
    // 出生格"预热轰油门"不许溜车（用户缺陷：倒计时按住 W 船偷偷滑出，
    // GO 时已带 33m/s 初速 + Shift 假蓄力爆 boost 起飞滑飞）。
    let throttle = raceLive ? this._throttle() : 0;
    // 爆缸惩罚：GO 后仍按住油门也吞掉（熄火），只留刹车/倒车脱困
    if (this.blownUp > 0 && throttle > 0) throttle = 0;
    if (this.airborne) {
      // 空中弹道：无动力无水阻，只有重力
      this.airV -= A.gravity * dt;
      this.airPos += this.airV * dt;
      if (this.airPos <= 0) {
        // 落水：浮动缓冲（"扑通—浮起"）+ 拍减速
        this.airborne = false;
        this.airPos = 0;
        if (Math.abs(this.airV) > A.splashSpeed) this.lastEvent = "splash";
        this.onSplash?.(this.airV);
        this.splashUp = Math.min(A.splashUpTime, Math.abs(this.airV) * 0.1);
        this.speed *= A.splashSlow;
        this.airV = 0;
      }
    } else {
      // 完美起跑起步推力：倒计时冻结无初速，GO 后按住油门快速拉离（松开即止）
      if (this.startBoost > 0 && throttle > 0) this.speed += (this.startBoostForce || 0) * dt;
      if (throttle > 0) {
        this.speed += B.accel * dt;
      } else if (throttle < 0) {
        if (this.speed > 0.5) this.speed -= B.brake * dt;
        else this.speed -= B.accel * 0.5 * dt; // 挂倒
      }
      // 水阻力：无油门时向 0 指数衰减；漂移中拖得更狠（漂移掉速）
      if (throttle === 0) {
        this.speed *= Math.exp(-(drifting ? D.drag : B.drag) * dt);
        if (Math.abs(this.speed) < 0.05) this.speed = 0;
      }
    }
    this.speed = THREE.MathUtils.clamp(this.speed, -B.maxReverse, maxSpeed);

    // ------------------------------------------------ 转向（带惯性）
    // 低速转向弱：先加速才能灵活转向
    const spdFactor = THREE.MathUtils.clamp(Math.abs(this.speed) / B.turnSpdRef, 0, 1);
    // 舵量平滑 = 转向惯性
    this.steer += (steerRaw - this.steer) * Math.min(1, B.inertiaLerp * dt);

    const turnMul = drifting ? D.turnBoost : 1;
    const yawRate = this.steer * B.turnRate * spdFactor * turnMul * (this.speed < 0 ? -1 : 1);
    this.heading -= yawRate * dt;

    // ------------------------------------------------ 滑行：速度矢量与船头有夹角
    // 前进方向 = 船头方向；实际速度 = 前向 + 残余侧向缓慢收敛
    const fwd = new THREE.Vector3(-Math.sin(this.heading), 0, -Math.cos(this.heading));
    const right = new THREE.Vector3(Math.cos(this.heading), 0, -Math.sin(this.heading));

    // 侧向速度：转向时注入（转弯外侧滑移）。
    // 漂移 = 衰减冻结 + 强注入 → 持续大侧滑 = 甩尾手感；出漂即恢复衰减。
    if (drifting) {
      this.lateral += -yawRate * this.speed * D.latInject * dt;
      this.lateral = THREE.MathUtils.clamp(this.lateral, -D.latClamp, D.latClamp);
    } else {
      this.lateral += -yawRate * this.speed * 0.35 * dt;
      this.lateral *= Math.exp(-2.8 * dt);
    }

    this._vel
      .copy(fwd)
      .multiplyScalar(this.speed)
      .addScaledVector(right, this.lateral);

    this.position.addScaledVector(this._vel, dt);

    // ------------------------------------------------ Phase 3：跳台 / 加速带
    if (!this.airborne && this.features && this.track) {
      const near = this.track.nearest(this.position.x, this.position.z);
      // 跳台：冲上坡、到达台顶、速度足够 → 弹射起飞
      const ramp = this.features.rampAt(near.arc, near.dist, near.side);
      if (ramp && near.arc >= ramp.ramp.arc - 2 && this.speed >= A.launchMinSpeed) {
        this.airborne = true;
        this.airPos = Math.max(0, ramp.h);
        this.airV = 2.2 + Math.min(this.speed, 34) * (A.airVScale ?? 0.14) + ramp.ramp.height * 1.6; // 滞空≈1.6s 全速
        this.lastEvent = "launch";
      }
      // 加速带：正向跨线判定复用 RaceState 的连续里程（帧率解耦）。
      // 里程由 RaceState.update 在本函数之前推进；此处消费并更新快照。
      if (this.race && this.raceId) {
        const e = this.race.entryOf(this.raceId);
        if (e && e._arcN !== undefined && e._arcFeat !== undefined) {
          const pad = this.features.checkBoostCrossing(
            e._arcFeat, e._arcN, near.dist, this.track.length, this.race.time);
          if (pad) {
            const TF = CONFIG.trackFeatures.boost;
            this.padBoost = Math.min(TF.maxTotal, this.padBoost + TF.speedAdd);
            this.lastEvent = "boostpad";
          }
        }
        if (e) e._arcFeat = e._arcN;
      }
    }

    // ------------------------------------------------ 障碍与船体碰撞（Phase 3）
    // CollisionWorld 就地修位置 + 改 speed/lateral（轻微偏转语义）。
    if (this.collision && !this.airborne) {
      const vel = { x: this._vel.x, z: this._vel.z };
      const hit = this.collision.resolveObstacles(this.position, vel);
      if (hit) {
        // 世界系反弹速度分解回 speed / lateral
        const f = { x: -Math.sin(this.heading), z: -Math.cos(this.heading) };
        const r = { x: Math.cos(this.heading), z: -Math.sin(this.heading) };
        this.speed = vel.x * f.x + vel.z * f.z;
        this.lateral = vel.x * r.x + vel.z * r.z;
        this._flagHit(t);
      }
      const mates = this.mates ? this.mates() : [];
      if (mates.length) {
        const pairs = this.collision.resolveBoatPairs([this, ...mates]);
        if (pairs.length) this._flagHit(t);
      }
    }

    // ------------------------------------------------ 贴合波浪 + 姿态
    const w = sampleWater(this.position.x, this.position.z, t);

    // 落水上浮缓冲：波面之上抬升沿 sin 弧线落回（卡通"浮起"）
    let splashOff = 0;
    if (this.splashUp > 0) {
      this.splashUp = Math.max(0, this.splashUp - dt);
      const k = this.splashUp / A.splashUpTime;
      splashOff = Math.sin(k * Math.PI) * 0.6;
    }

    // 浮体上下浮动：目标高度 = 波面 + 吃水，加轻微相位浮动
    const bob = Math.sin(t * B.bobFreq + this.bobPhase) * 0.06 * (1 - Math.min(Math.abs(this.speed) / B.maxSpeed, 1) * 0.6);
    if (this.airborne) {
      // 空中：保持弹道高度（叠加瞬时波面，不做平滑贴合）
      this.position.y = w.y + 0.18 + this.airPos;
    } else {
      const targetY = w.y + 0.18 + bob + splashOff;
      this.position.y += (targetY - this.position.y) * Math.min(1, 6 * dt);
    }

    // 横摇：沿左右两点采样波高差（船体随浪横滚）
    const wl = sampleWater(this.position.x - 0.8, this.position.z, t);
    const wr = sampleWater(this.position.x + 0.8, this.position.z, t);
    let targetRoll = Math.atan2(wr.y - wl.y, 1.6) * 0.8;

    // 滑行外倾：转弯时向内侧倾；漂移夸张加倍
    const carveRoll = -this.steer * spdFactor * (drifting ? 0.36 : 0.18);

    // 俯仰：加速抬头，减速低头；空中随垂直速度抬头/栽头
    let targetPitch = THREE.MathUtils.clamp(throttle * 0.08, -0.1, 0.12);
    if (this.airborne) targetPitch = THREE.MathUtils.clamp(-this.airV * 0.03, -0.35, 0.3);
    if (this.splashUp > 0) targetPitch = -0.18; // 落水点头

    this.roll += (targetRoll + carveRoll - this.roll) * Math.min(1, B.pitchLerp * dt);
    this.pitch += (targetPitch - this.pitch) * Math.min(1, B.pitchLerp * dt);

    // ------------------------------------------------ 应用到视觉节点
    this.obj.position.copy(this.position);
    this.obj.rotation.set(this.pitch, this.heading, this.roll, "YXZ");
    // 起步规则视觉：倒计时膨胀量写入马达（main 每帧更新 swell；main 在
    // 全体船物理后推进 race.update，GO 帧盖章在船物理之前完成，无时序缺口）
    if (this.view?.setEngineSwell) this.view.setEngineSwell(this.swell || 0);

    return this;
  }

  _flagHit(t) {
    if (t - this._hitCool > 0.5) {
      this.lastEvent = "hit";
      this._hitCool = t;
    }
  }

  // 供 HUD 显示
  get speedKmh() {
    return Math.abs(this.speed) * 3.6;
  }
}
