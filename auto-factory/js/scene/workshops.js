/* ============================================================
 * 车间室内空间：冲压 / 焊装 / 涂装 / 总装 四条真实产线动画
 *   · 冲压：压力机滑块往复 + 板料传送
 *   · 焊装：机器人集群摆动 + 焊花粒子 + 白车身 EMS 环行
 *   · 涂装：车身连续输送 + 喷漆/烘房发光
 *   · 总装：分装线 + 内饰线 + 底盘合装 + 最终线 + 检测线
 * 车间悬停半透明（Ghost），点击设备弹出信息卡
 * ============================================================ */
import * as THREE from 'three';
import {
  MAT, box, factoryShell, makeCar, makeBodyInWhite, makeChassis,
  makeRobot, driveRobot, conveyorBelt, driveBelt, Mover,
  makePress, makeBooth, makeRack, makeAGV, deepCloneTree,
} from './builders.js';

/* ================= 焊花粒子池 ================= */
class SparkPool {
  constructor(scene, max = 240) {
    this.max = max; this.parts = [];
    const geo = new THREE.BufferGeometry();
    this.pos = new Float32Array(max * 3);
    this.col = new Float32Array(max * 3);
    geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(this.col, 3));
    this.pos.fill(-9999);
    this.points = new THREE.Points(geo, new THREE.PointsMaterial({
      size: .16, vertexColors: true, transparent: true, opacity: .95,
      blending: THREE.AdditiveBlending, depthWrite: false }));
    this.points.frustumCulled = false;
    scene.add(this.points);
    this.cursor = 0;
  }
  spawn(worldPos, n = 10) {
    for (let k = 0; k < n; k++) {
      const i = this.cursor = (this.cursor + 1) % this.max;
      this.parts[i] = {
        x: worldPos.x, y: worldPos.y, z: worldPos.z,
        vx: (Math.random() - .5) * 2.2, vy: Math.random() * 2.4 + .6, vz: (Math.random() - .5) * 2.2,
        life: .35 + Math.random() * .3,
        r: 1, g: .75 + Math.random() * .25, b: .3,
      };
    }
  }
  update(dt) {
    for (let i = 0; i < this.max; i++) {
      const p = this.parts[i];
      if (!p) { continue; }
      p.life -= dt;
      if (p.life <= 0) { this.pos[i*3+1] = -9999; this.parts[i] = null; continue; }
      p.vy -= 6.5 * dt;
      p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
      this.pos[i*3] = p.x; this.pos[i*3+1] = p.y; this.pos[i*3+2] = p.z;
      const f = Math.max(p.life, 0);
      this.col[i*3] = p.r * f; this.col[i*3+1] = p.g * f; this.col[i*3+2] = p.b * f;
    }
    this.points.geometry.attributes.position.needsUpdate = true;
    this.points.geometry.attributes.color.needsUpdate = true;
  }
}

/* ================= 通用：设备登记 ================= */
function registerEquip(list, group, data) {
  group.userData.equip = data;
  group.traverse(o => { o.userData.equipRoot = group; });
  list.push(group);
  // 状态指示灯
  const lampMat = data.status === 'running' ? MAT.glowGreen
    : data.status === 'idle' ? MAT.glowYellow : MAT.glowRed;
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(.16, 8, 8), lampMat);
  lamp.userData.noPick = true;
  return lamp;
}

/* ================= 冲压车间 ================= */
function buildStamping(shop, ctx) {
  const { group, equip } = shop;
  const presses = [];
  // 4 台压力机 + 开卷线
  for (let i = 0; i < 4; i++) {
    const p = makePress(1.15);
    p.group.position.set(-21 + i * 7.5, 0, 0);
    group.add(p.group);
    presses.push(p);
    const lamp = registerEquip(equip, p.group, ctx.equipOf('SP-0' + (i + 1)));
    lamp.position.set(0, 5.2, 0); p.group.add(lamp);
  }
  // 开卷落料线
  const uncoil = box(4, 2.4, 3, MAT.machine, -31, 1.2, 0, group);
  registerEquip(equip, uncoil, ctx.equipOf('SP-05')); group.add(uncoil);
  const coil = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 2.4, 18), MAT.steel);
  coil.rotation.x = Math.PI / 2; coil.position.set(-31, 2.6, 0); group.add(coil);
  // 废料输送
  const scrap = conveyorBelt(30, 'x', group); scrap.group.position.set(-10, -0.0, 4.5);
  // 板料传送带 + 白色板料工件
  const feed = conveyorBelt(44, 'x', group); feed.group.position.set(-6, 0, -2.6);
  const blanks = [];
  for (let i = 0; i < 8; i++) {
    const b = box(1.5, .08, 1.2, new THREE.MeshStandardMaterial({ color: 0xdfe8f0, metalness: .9, roughness: .3 }),
      0, 0, 0, group);
    b.userData.noPick = true; blanks.push(b);
  }
  const feedCurve = new THREE.LineCurve3(new THREE.Vector3(-28, 1.3, -2.6), new THREE.Vector3(16, 1.3, -2.6));
  const feedMover = new Mover(feedCurve, blanks, .12, .07);
  // 模具库 AGV
  const agvCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-30, .0, 8), new THREE.Vector3(20, .0, 8),
    new THREE.Vector3(24, .0, 4), new THREE.Vector3(24, .0, -6),
    new THREE.Vector3(-30, .0, -8)], true, 'catmullrom', .3);
  const mAgv = makeAGV(true); group.add(mAgv);
  const agvMover = new Mover(agvCurve, [mAgv], .0, .05);
  const pressLamps = presses.map(p => p.lamp);
  return {
    update(t, dt) {
      feedMover.update(dt); agvMover.update(dt);
      driveBelt(feed, 44, 'x', 1.4); driveBelt(scrap, 30, 'x', 2.4);
      presses.forEach((p, i) => {
        const ph = t * 2.4 + i * 1.4;
        p.ram.position.y = 2.8 + Math.min(0, Math.sin(ph)) * .85;
        p.lamp.scale.setScalar(1 + Math.max(0, Math.sin(ph)) * .3);
      });
    },
  };
}

/* ================= 焊装车间 ================= */
function buildWelding(shop, ctx) {
  const { group, equip } = shop;
  let wT = 0;
  const robots = [];
  const weldSpots = [];
  // 两条焊接线，两侧机器人集群
  for (const line of [-1, 1]) {
    const z = line * 7;
    // 机器人 2 × 6 台
    for (let i = 0; i < 6; i++) {
      const r = makeRobot(line < 0 ? MAT.robotArm : MAT.robotArm2, 1.1);
      const x = -22 + i * 8;
      r.group.position.set(x, 0, z + line * 4.2);
      group.add(r.group); robots.push(r);
      weldSpots.push({ robot: r, world: new THREE.Vector3(x, 1.6, z) });
      if (i % 3 === 0) {
        const lamp = registerEquip(equip, r.group,
          ctx.equipOf(line < 0 ? 'WD-01' : 'WD-02'));
        lamp.position.set(0, 3.6, 0); r.group.add(lamp);
      }
    }
    // 滑橇输送线（EMS）：白车身沿线移动
    const belt = conveyorBelt(52, 'x', group); belt.group.position.set(-1, 0, z);
    const bodies = [];
    for (let i = 0; i < 6; i++) {
      const b = makeBodyInWhite();
      b.scale.setScalar(.9); b.userData.noPick = true; group.add(b); bodies.push(b);
      // 滑撬
      const skid = box(4.8, .18, 2.2, MAT.steelDark, 0, 0, 0, b);
      skid.position.y = -0.05;
    }
    const curve = new THREE.LineCurve3(new THREE.Vector3(-27, 1.55, z), new THREE.Vector3(25, 1.55, z));
    bodies.__mover = new Mover(curve, bodies, .17, .045);
    shop.beltMovers = shop.beltMovers || [];
    shop.beltMovers.push({ belt, len: 52, curve, mover: bodies.__mover });
  }
  // 中部：侧围/底板合装工位 + 测量门
  const cell = box(6, 3.2, 5, MAT.machine, -1, 1.6, 0, group);
  registerEquip(equip, cell, ctx.equipOf('WD-04')); group.add(cell);
  const door = new THREE.Group(); group.add(door);
  box(.5, 4.2, .5, MAT.steelDark, -1, 2.1, -2.6, door);
  box(.5, 4.2, .5, MAT.steelDark, -1, 2.1, 2.6, door);
  box(6, .5, .5, MAT.steelDark, -1, 4.4, 0, door);
  for (let i = 0; i < 3; i++) {
    const s = box(.2, .2, .2, MAT.glowCyan, -3 + i * 2, 3.6, 0, door);
  }
  // 激光焊工位
  const laser = box(3, 2.6, 3, MAT.machineHi, 22, 1.3, 0, group);
  registerEquip(equip, laser, ctx.equipOf('WD-06')); group.add(laser);
  // 涂胶机器人（故障示例）
  const faultBot = makeRobot(MAT.robotArm, 1); faultBot.group.position.set(20, 0, -11.2); group.add(faultBot.group);
  const lampF = registerEquip(equip, faultBot.group, ctx.equipOf('WD-08'));
  lampF.position.set(0, 3.4, 0); faultBot.group.add(lampF);
  faultBot.fault = true;

  return {
    update(t, dt) {
      for (const b of shop.beltMovers) {
        driveBelt(b.belt, b.len, 'x', 1.1); b.mover.update(dt);
      }
      wT = t;
      for (const r of robots) driveRobot(r, wT, r.group.position.x * .35, 1.15);
      if (!faultBot.fault) driveRobot(faultBot, wT, 5, 1);
      for (const w of weldSpots) {
        if (Math.random() < dt * 2.2 && ctx.sparks) {
          w.robot.tip.getWorldPosition(w.world);
          ctx.sparks.spawn(w.world, 6);
        }
      }
      // 测量门扫描光
      door.children[3] && (door.children[3].position.y = 1.5 + (Math.sin(t * 2) * .5 + .5) * 2.6);
    },
  };
}

/* ================= 涂装车间 ================= */
function buildPainting(shop, ctx) {
  const { group, equip } = shop;
  // 环形连续输送（前处理→电泳→烘房P1→色漆→清漆→烘干P2→检查）
  const stations = [];
  function boothAt(x, z, w, label, color, equipId) {
    const b = makeBooth(w, 5.2, 6.5, color);
    b.position.set(x, 0, z); group.add(b);
    if (equipId) { const l = registerEquip(equip, b, ctx.equipOf(equipId)); l.position.set(w/2, 5.6, 0); b.add(l); }
    return b;
  }
  boothAt(-26, -6, 9, '前处理电泳', 0x21ccff, 'PT-01');
  boothAt(-11, -6, 8, '烘房 P1', 0xff9a3d, 'PT-02');
  boothAt(  5, -6, 10, '色漆机器人', 0x19e6a4, 'PT-03');
  boothAt( 21, -6, 8, '清漆机器人', 0x7ee6ff, 'PT-04');
  boothAt( 24,  8, 8, '烘干炉 P2', 0xff9a3d, 'PT-05');
  boothAt(  8,  8, 8, '抛光工位', 0x9fdcff, 'PT-06');
  // 输送链：蛇形路径
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-32, 2.0, -6), new THREE.Vector3(26, 2.0, -6),
    new THREE.Vector3(30, 2.0, 1),  new THREE.Vector3(30, 2.0, 8),
    new THREE.Vector3(4, 2.0, 8),   new THREE.Vector3(-24, 2.0, 8),
    new THREE.Vector3(-32, 2.0, 1),
  ], true, 'catmullrom', .35);
  const pv = new THREE.BufferGeometry().setFromPoints(curve.getPoints(200));
  group.add(new THREE.Line(pv, new THREE.LineBasicMaterial({ color: 0x1d7fe0, transparent: true, opacity: .5 })));
  // 吊具 + 车身（湿漆亮色）
  const bodies = [];
  for (let i = 0; i < 9; i++) {
    const rig = new THREE.Group(); group.add(rig);
    box(.16, 1.4, .16, MAT.steelDark, 0, .7, 0, rig).userData.noPick = true;
    const b = makeCar(MAT.carPaint);
    b.scale.setScalar(.78); b.position.y = -.9; b.userData.noPick = true;
    rig.add(b);
    const shell = box(4.0, 1.7, 1.9, new THREE.MeshStandardMaterial({
      color: [0xdfe8f0, 0x1c2733, 0xb4293c, 0x2f6bce, 0x9aa7b4][i % 5],
      metalness: 1, roughness: .08, transparent: true, opacity: .85 }), 0, -.35, 0, rig);
    shell.userData.noPick = true;
    bodies.push(rig);
  }
  const mover = new Mover(curve, bodies, .105, .028);
  // 排气塔
  for (let i = 0; i < 3; i++) {
    const stack = new THREE.Mesh(new THREE.CylinderGeometry(.5, .7, 8, 10), MAT.pipe);
    stack.position.set(-26 + i * 18, 4, -11); group.add(stack);
  }
  // RTO 废气处理
  const rto = box(5, 5, 5, MAT.machine, -30, 2.5, 8, group);
  registerEquip(equip, rto, ctx.equipOf('PT-07')); group.add(rto);
  return { update(t, dt) { mover.update(dt); } };
}

/* ================= 总装车间 ================= */
function buildAssembly(shop, ctx) {
  const { group, equip } = shop;
  /* 布局（z 轴为流程方向）：
     z=-12 内饰线A/B（两段并行）  z=-2 底盘分装  z=6 合装岛  z=13 最终线  z=18 检测线 */
  const anims = [];
  let shopT = 0;

  /* ---- 内饰线 A/B：车身随滑撬移动 ---- */
  for (const side of [-1, 1]) {
    const x0 = side < 0 ? -14 : 14;
    const belt = conveyorBelt(60, 'x', group);
    belt.group.position.set(0, 2.2, -12 + (side < 0 ? 0 : 2) * 4);
    const bodies = [];
    for (let i = 0; i < 6; i++) {
      const rig = new THREE.Group(); group.add(rig);
      const b = makeBodyInWhite(); b.scale.setScalar(.92); rig.add(b);
      box(5, .16, 2.2, MAT.steelDark, 0, -.08, 0, rig);
      rig.userData.noPick = true; bodies.push(rig);
    }
    const curve = new THREE.LineCurve3(
      new THREE.Vector3(-32, 3.1, belt.group.position.z), new THREE.Vector3(30, 3.1, belt.group.position.z));
    const mover = new Mover(curve, bodies, .17, .035);
    const sideRef = { mover, belt, dt: 1 / 60 };
    anims.push(() => { driveBelt(belt, 60, 'x', 1); sideRef.mover.update(sideRef.dt); });
    anims.__last = sideRef;
    // 内饰装配机器人（玻璃安装）
    const rob = makeRobot(MAT.robotArm2, 1); rob.group.position.set(-20, 3, belt.group.position.z + 3.2);
    group.add(rob.group);
    const lamp = registerEquip(equip, rob.group, ctx.equipOf(side < 0 ? 'AS-01' : 'AS-06'));
    lamp.position.set(0, 3.4, 0); rob.group.add(lamp);
    anims.push(() => driveRobot(rob, shopT, side * 2, 1));
    // 工位操作台
    for (let i = 0; i < 5; i++) {
      box(3.4, 1, 1.4, MAT.steelDark, -24 + i * 11, .5, belt.group.position.z + 3.4, group);
    }
  }

  /* ---- 底盘分装线 ---- */
  const cBelt = conveyorBelt(56, 'x', group); cBelt.group.position.set(-2, 0, -2);
  const chassis = [];
  for (let i = 0; i < 5; i++) {
    const c = makeChassis(); c.userData.noPick = true; group.add(c); chassis.push(c);
  }
  const cCurve = new THREE.LineCurve3(new THREE.Vector3(-30, 1.15, -2), new THREE.Vector3(26, 1.15, -2));
  const cMover = new Mover(cCurve, chassis, .2, .03);

  /* ---- 合装岛：车身下降与底盘结合 ---- */
  const marry = new THREE.Group(); marry.position.set(2, 0, 5.5); group.add(marry);
  box(7, .5, 7, MAT.steelDark, 0, .25, 0, marry);
  const liftTop = box(6, .4, 6, MAT.steel, 0, 5.2, 0, marry);
  const liftCar = makeCar(MAT.carPaint); liftCar.scale.setScalar(.82); liftCar.userData.noPick = true;
  marry.add(liftCar);
  box(.5, 5.5, .5, MAT.machine, -3.4, 2.6, -3.4, marry);
  box(.5, 5.5, .5, MAT.machine, 3.4, 2.6, -3.4, marry);
  box(.5, 5.5, .5, MAT.machine, -3.4, 2.6, 3.4, marry);
  box(.5, 5.5, .5, MAT.machine, 3.4, 2.6, 3.4, marry);
  const marryLamp = registerEquip(equip, marry, ctx.equipOf('AS-03'));
  marryLamp.position.set(0, 6, 0); marry.add(marryLamp);

  /* ---- 最终线：下线整车流动 ---- */
  const fBelt = conveyorBelt(56, 'x', group); fBelt.group.position.set(-2, 0, 12);
  const cars = [];
  for (let i = 0; i < 5; i++) {
    const c = makeCar(); c.scale.setScalar(.82); c.userData.noPick = true; group.add(c); cars.push(c);
  }
  const fCurve = new THREE.LineCurve3(new THREE.Vector3(-30, 1.05, 12), new THREE.Vector3(26, 1.05, 12));
  const fMover = new Mover(fCurve, cars, .2, .028);
  // 最终线机器人/拧紧枪
  const finalRob = makeRobot(MAT.robotArm, 1); finalRob.group.position.set(14, 0, 15.2); group.add(finalRob.group);
  const frLamp = registerEquip(equip, finalRob.group, ctx.equipOf('AS-04'));
  frLamp.position.set(0, 3.4, 0); finalRob.group.add(frLamp);

  /* ---- 检测线：转毂 + 淋雨 ---- */
  const test = new THREE.Group(); test.position.set(30, 0, 12); group.add(test);
  for (let i = 0; i < 2; i++) {
    const drum = new THREE.Mesh(new THREE.CylinderGeometry(.5, .5, 2.2, 14), MAT.steel);
    drum.rotation.x = Math.PI / 2; drum.position.set(0, .5, -1 + i * 2); test.add(drum);
    drum.userData.spin = true;
  }
  box(5, 4.5, 5, new THREE.MeshStandardMaterial({ color: 0x33507a, transparent: true, opacity: .5 }), 7, 2.25, 0, test);
  const tLamp = registerEquip(equip, test, ctx.equipOf('AS-05'));
  tLamp.position.set(0, 4.8, 0); test.add(tLamp);

  /* ---- 轮胎/玻璃分装 + 加注机 ---- */
  // 加注机
  const adder = box(3.4, 2.8, 3.4, MAT.machine, -24, 1.4, 12, group);
  const addLamp = registerEquip(equip, adder, ctx.equipOf('AS-08'));
  addLamp.position.set(0, 3.2, 0); adder.add(addLamp);
  // 轮胎垛
  const tireGeo = new THREE.CylinderGeometry(.42, .42, .3, 12);
  for (let i = 0; i < 12; i++) {
    const t = new THREE.Mesh(tireGeo, MAT.tire);
    t.position.set(-26 + (i % 4) * 1.1, .42 + Math.floor(i / 4) * .32, 16.5);
    group.add(t);
  }
  // 配送 AGV 沿 z 通道
  const agvC = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-34, .0, 16), new THREE.Vector3(-34, .0, -14),
    new THREE.Vector3(24, .0, -14), new THREE.Vector3(24, .0, 16)], true, 'catmullrom', .3);
  const agvItems = [];
  for (let i = 0; i < 3; i++) { const a = makeAGV(i !== 1); group.add(a); agvItems.push(a); }
  const agvM = new Mover(agvC, agvItems, .3, .04);

  /* ---- 成品下线驶出 ---- */
  const outCars = [];
  for (let i = 0; i < 3; i++) {
    const c = makeCar(); c.scale.setScalar(.82); c.userData.noPick = true; group.add(c); outCars.push(c);
  }
  const outCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(30, 1.05, 12), new THREE.Vector3(42, 1.05, 12),
    new THREE.Vector3(46, .6, 14), new THREE.Vector3(46, .05, 18)]);
  const outM = new Mover(outCurve, outCars, .3, .02);

  return {
    update(t, dt) {
      shopT = t;
      for (const f of anims) f();
      driveBelt(cBelt, 56, 'x', .9); cMover.update(dt);
      driveBelt(fBelt, 56, 'x', 1); fMover.update(dt);
      driveRobot(finalRob, t, 3, 1);
      // 合装动画：升降 6 秒周期
      const ph = (t % 6) / 6;
      const y = ph < .4 ? 4.4 : ph < .5 ? 4.4 - (ph - .4) / .1 * 3.3
        : ph < .8 ? 1.1 : 1.1 + (ph - .8) / .2 * 3.3;
      liftCar.position.y = y; liftTop.position.y = y + .9;
      agvM.update(dt); outM.update(dt);
      test.children.forEach(c => { if (c.userData.spin) c.rotation.z = t * 6; });
    },
  };
}

/* ================= 仓储物流中心 ================= */
function buildLogistics(shop, ctx) {
  const { group, equip } = shop;
  const anims = [];
  let shopTime = 0;
  // 立库货架 ×4 排 + 堆垛机
  const stRefs = [];
  for (let r = 0; r < 4; r++) {
    const rack = makeRack(4, 8, 20, 3, group);
    rack.position.set(-12 + r * 8, 0, 0);
    if (r === 0) { const l = registerEquip(equip, rack, ctx.equipOf('LG-01')); l.position.set(0, 8.6, 0); rack.add(l); }
    // 堆垛机巷道小车
    const st = box(1.4, 8.2, 1.4, MAT.machine, -12 + r * 8, 4.1, 0, group);
    stRefs.push({ st, r });
  }
  // ANF 无人配送车（多个沿外部环路）
  const anfCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-16, .0, 14), new THREE.Vector3(16, .0, 14),
    new THREE.Vector3(16, .0, -14), new THREE.Vector3(-16, .0, -14)], true, 'catmullrom', .3);
  const anfs = [];
  for (let i = 0; i < 4; i++) { const a = makeAGV(i % 2 === 0); group.add(a); anfs.push(a); }
  const anfM = new Mover(anfCurve, anfs, .24, .05);
  // 收货/发运月台
  const dockR = box(6, 1.2, 3, MAT.steelDark, -14, .6, -18, group);
  const dockS = box(6, 1.2, 3, MAT.steelDark, 14, .6, -18, group);
  const dl = registerEquip(equip, dockR, ctx.equipOf('LG-03')); dl.position.set(0, 2, 0); dockR.add(dl);
  const dls = registerEquip(equip, dockS, ctx.equipOf('LG-04')); dls.position.set(0, 2, 0); dockS.add(dls);
  // RFID 门
  const rfid = new THREE.Group(); group.add(rfid);
  box(.4, 4, .4, MAT.steelDark, 0, 2, -13, rfid); box(.4, 4, .4, MAT.steelDark, 4, 2, -13, rfid);
  box(4.6, .4, .4, MAT.steelDark, 2, 4.2, -13, rfid);
  const rl = registerEquip(equip, rfid, ctx.equipOf('LG-05')); rl.position.set(2, 4.6, 0); rfid.add(rl);
  return { update(t, dt) {
    shopTime = t;
    for (const f of anims) f();
    for (const { st, r } of stRefs) st.position.z = Math.sin(shopTime * .6 + r) * 8;
    anfM.update(dt);
  } };
}

/* ================= 车间构建分发表 ================= */
const BUILDERS = {
  stamping: buildStamping, welding: buildWelding,
  painting: buildPainting, assembly: buildAssembly, logistics: buildLogistics,
};

/**
 * 构建全部车间室内模型。每个车间一个 Group，初始隐藏。
 * @param scene 主场景  @param shopData data.js 的 SHOPS
 */
export function buildShops(scene, shopData) {
  const shops = {};
  const shopGroups = [];
  const sparks = new SparkPool(scene, 260);
  const equipMeshes = [];

  for (const s of shopData) {
    const L = { w: 64, d: 34, h: 13 };   // 统一室内体量
    const group = new THREE.Group();
    group.visible = false;              // 全景用外观替身；进入室内时才显示真实车间
    scene.add(group);

    // 地面
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(L.w, L.d),
      new THREE.MeshStandardMaterial({ color: 0x1b2c46, roughness: .9 }));
    floor.rotation.x = -Math.PI / 2; floor.position.y = .02; group.add(floor);
    // 通道网格线
    const fg = new THREE.GridHelper(L.w, 26, 0x27466f, 0x1d3454);
    fg.position.y = .04; group.add(fg);
    // 厂房外壳（默认以 Ghost 半透明呈现，可从外部透视内部产线；进入后更透）
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x9fb4cc, transparent: true, opacity: .96 });
    const shell = factoryShell(L.w, L.d, L.h, {
      wallMat, roof: 'flat', glowColor: s.color,
    });
    group.add(shell);
    group.userData.shell = shell;
    // 顶部照明带（室内发光；集中一组便于远景剪影时隐藏）
    const lights = new THREE.Group(); group.add(lights);
    for (let i = 0; i < 5; i++)
      box(L.w * .85, .12, .5, new THREE.MeshBasicMaterial({ color: 0xcfeaff, transparent: true }),
        0, L.h - .6, -L.d / 2 + 3 + i * (L.d - 6) / 4, lights);

    const shop = { group, shell, lights, equip: [], shop: s, beltMovers: [] };
    const ctx = {
      sparks,
      equipOf(code) {
        const dev = s.devices.find(d => d[0] === code) || [code, code, 'running'];
        const data = { shop: s.name, shopId: s.id, code: dev[0], name: dev[1], status: dev[2],
          oee: 82 + Math.random() * 14, temp: 32 + Math.random() * 26,
          run: 4 + Math.random() * 14, parts: Math.floor(200 + Math.random() * 8000) };
        return data;
      },
    };
    const api = (BUILDERS[s.id] || buildLogistics)(shop, ctx);
    shopGroups.push(group);
    // 收集所有设备根节点（供拾取）
    shop.equip.forEach(g => { g.traverse(o => { if (!o.userData.noPick) o.userData.equipRoot = g; }); });
    equipMeshes.push(...shop.equip);
    // 室内补光（唯一一盏）
    const fill = new THREE.PointLight(s.color, 300, 70, 1.6);
    fill.position.y = L.h - 2; group.add(fill);
    // 厂区外观替身：不透明、静态，供工厂全景展示；进入室内时隐藏
    const avatar = deepCloneTree(shell);
    scene.add(avatar);
    avatar.visible = false;
    shops[s.id] = { ...shop, api, data: s, fill, avatar };
  }

  /** 单车间聚焦：其余车间外壳淡为剪影 */
  function setFocused(id) {
    for (const [k, sh] of Object.entries(shops)) {
      sh._focused = (k === id);
      sh.group.visible = true;
      applyGhost(sh);
    }
  }
  function show(id) { setFocused(id); }

  function applyGhost(sh) {
    const deep = !!sh._deepGhost;   // 进入室内：墙/顶隐藏，室内视野纯净
    const far = !sh._focused;       // 全景：聚焦车间可见内部，其余淡为剪影
    // ② 车间外壳与室内内容：进入/deep 状态直接生效；全景剪影切换用 2 秒平滑过渡
    if (deep) {
      sh._tw = null;
      sh.shell.traverse(o => {
        if (!o.isMesh || !o.material || o.material.isLineBasicMaterial) return;
        const hex = o.material.color && o.material.color.getHex();
        if (hex === 0x9fb4cc) {           // 浅墙 → 深色车间墙（仅首次转换，避免过渡回读污染）
          if (!o.userData._deepened) {
            o.material.color.setHex(0x16283f);
            o.material.emissive && o.material.emissive.setHex(0x060e1c);
            o.userData._deepened = true;
          }
          o.visible = true; o.material.opacity = 1; o.material.transparent = false;
        } else if (hex === 0x2a3d57 || hex === 0x55708c) {    // 屋顶 / 通风管保持
          o.visible = true; o.material.opacity = 1; o.material.transparent = false;
        } else if (hex === 0x66c8ff) {    // 采光带 → 亮天窗
          o.visible = true; o.material.opacity = .85; o.material.transparent = true;
        } else if (hex === 0x33465e || hex === 0x4a5a72) {    // 钢构保持
          o.visible = true; o.material.opacity = 1; o.material.transparent = false;
        } else {
          o.visible = true; o.material.opacity = 1; o.material.transparent = false;
        }
      });
      sh.shell.traverse(o => { if (o.isLineSegments) o.material.opacity = .18; });
      // deep：室内内容全亮，并清理过渡状态
      sh._tw = null;
      for (const c of sh.group.children) {
        if (c === sh.shell || c.isLight || c === sh.lights) continue;
        c.traverse(o => {
          if (!(o.isMesh && o.material) || o.material.isLineBasicMaterial) return;
          const base = _opCache.get(o.material) ?? 1;
          o.material.transparent = base < 1;
          o.material.opacity = base;
        });
      }
      if (sh.lights) sh.lights.traverse(o => {
        if (o.isMesh && o.material) { o.visible = true; o.material.opacity = 1; }
      });
      if (sh.fill) sh.fill.intensity = 380;
      sh._tw = null;
      return;
    }

    // —— 全景剪影：记录过渡起点并平滑动画 ——
    const targets = {
      shellOp: far ? .16 : .32, interiorOp: far ? .45 : 1,
      lightsVis: !far, fillInt: far ? 25 : 120,
    };
    const from = {};
    sh.shell.traverse(o => {
      if (!o.isMesh || !o.material || o.material.isLineBasicMaterial) return;
      if (o.userData._op === undefined) o.userData._op = o.material.opacity ?? 1;
      o.material.transparent = true; o.visible = true;
    });
    sh.shell.traverse(o => { if (o.isLineSegments) o.material.opacity = .55; });
    sh._tw = { t: 0, dur: 2, from: snapshot(sh), to: targets };
    applyTw(sh, sh._tw.t);
  }

  function snapshot(sh) {
    const f = { shells: [], interiors: [], line: null, fill: sh.fill ? sh.fill.intensity : 0, lights: [] };
    sh.shell.traverse(o => { if (o.isMesh && o.material && !o.material.isLineBasicMaterial) f.shells.push(o.material.opacity); });
    const mats = [];
    for (const c of sh.group.children) {
      if (c === sh.shell || c.isLight || c === sh.lights) continue;
      c.traverse(o => { if (o.isMesh && o.material && !o.material.isLineBasicMaterial) mats.push(o.material.opacity); });
    }
    f.interiors = mats;
    if (sh.lights) sh.lights.traverse(o => { if (o.isMesh) f.lights.push(o.visible ? 1 : 0); });
    return f;
  }
  const _opCache = new WeakMap();
  function applyTw(sh, t) {
    const tw = sh._tw; if (!tw) return;
    const k = t / tw.dur;
    const lerp = (a, b) => a + (b - a) * k;
    let si = 0;
    sh.shell.traverse(o => {
      if (!o.isMesh || !o.material || o.material.isLineBasicMaterial) return;
      o.material.opacity = lerp(tw.from.shells[si] ?? o.userData._op ?? 1, tw.to.shellOp);
      si++;
    });
    let ii = 0;
    for (const c of sh.group.children) {
      if (c === sh.shell || c.isLight || c === sh.lights) continue;
      c.traverse(o => {
        if (!(o.isMesh && o.material) || o.material.isLineBasicMaterial) return;
        const base = _opCache.get(o.material) ?? 1;
        o.material.transparent = true;
        o.material.opacity = lerp(tw.from.interiors[ii] ?? base, base * tw.to.interiorOp);
        ii++;
      });
    }
    let li = 0;
    if (sh.lights) sh.lights.traverse(o => {
      if (!(o.isMesh && o.material)) return;
      o.material.opacity = 1;
      o.visible = tw.to.lightsVis;   // 发光件不做半程：直接按目标显隐
      li++;
    });
    if (sh.fill) sh.fill.intensity = lerp(tw.from.fill, tw.to.fillInt);
  }

  /** 剪影过渡推进（每帧） */
  function tickTransit(dt) {
    for (const sh of Object.values(shops)) {
      const tw = sh._tw;
      if (!tw) continue;
      tw.t += dt;
      if (tw.t >= tw.dur) { sh._tw = null; applyTw(sh, tw.dur); continue; }
      applyTw(sh, tw.t);
    }
  }

  /** 车间动画：聚焦/室内全速；远景剪影车间每 8 帧一步（皮带照常循环，保证切回连贯） */
  let _slow = 0;
  function update(t, dt) {
    _slow = (_slow + 1) % 8;
    for (const sh of Object.values(shops)) {
      if (sh._focused || sh._deepGhost) sh.api.update(t, dt);
      else if (_slow === 0) sh.api.update(t, dt * 8);
    }
    tickTransit(dt);
    sparks.update(dt);
  }

  /** Ghost 模式：进入室内时当前车间墙/顶几乎全透 */
  function setGhost(id, on) {
    const sh = shops[id]; if (!sh) return;
    sh._deepGhost = on;
    // 进入室内：其他车间整体隐藏；退出：恢复剪影（带过渡）
    for (const [k, other] of Object.entries(shops)) {
      if (k !== id) {
        other.group.visible = on ? false : true;
        other.avatar.visible = !on;
        if (!on) { other._focused = false; applyGhost(other); }
      }
    }
    sh.avatar.visible = false;
    applyGhost(sh);
  }

  /** 工厂全景：显示所有不透明外观替身（真实车间组隐藏） */
  function showAvatars() {
    for (const sh of Object.values(shops)) {
      sh.avatar.visible = true;
      sh._focused = false;
      sh._deepGhost = false;
      sh.group.visible = false;
    }
  }

  /** 车间聚焦：真实车间组进入场景（内部可见），替身隐藏 */
  function revealGroup(id) {
    const sh = shops[id]; if (!sh) return;
    for (const [k, other] of Object.entries(shops)) {
      if (k !== id) { other.group.visible = false; other.avatar.visible = false; }
    }
    sh.group.visible = true;
    sh.avatar.visible = false;
  }

  return { shops, shopGroups, show, setFocused, update, equipMeshes, sparks, setGhost, showAvatars, revealGroup };
}
