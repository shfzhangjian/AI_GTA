// Sketch Wave Racer — 简笔画卡通船（Phase 1 占位）
// 原则：Visual Mesh ≠ Collider。
// 视觉：低模组合 + 墨线描边；碰撞：单个圆柱近似（数据在 collider 中，不建网格）。

import * as THREE from "three";
import { CONFIG } from "../config.js";

const INK = 0x2e2a26;

// 给网格加描边（背向面外翻 + 墨线色）。低模下效果接近手绘轮廓线。
export function addOutline(mesh, thickness = 0.03) {
  const outline = new THREE.Mesh(
    mesh.geometry,
    new THREE.MeshBasicMaterial({
      color: INK,
      side: THREE.BackSide,
    })
  );
  outline.scale.multiplyScalar(1 + thickness);
  mesh.add(outline);
  return outline;
}

function toon(color) {
  return new THREE.MeshToonMaterial({ color });
}

// 创建一艘卡通小船。返回 { group, collider }
// collider: { type:'cylinder', radius, halfHeight } —— Phase 2/3 碰撞系统使用。
export function createBoat(color) {
  const group = new THREE.Group();

  // 船体：压扁的盒 + 尖头（圆锥）
  const hull = new THREE.Mesh(
    new THREE.BoxGeometry(1.4, 0.5, 3.0),
    toon(color)
  );
  hull.position.y = 0.25;
  addOutline(hull, 0.04);
  group.add(hull);

  const bow = new THREE.Mesh(
    new THREE.ConeGeometry(0.7, 1.2, 4),
    toon(color)
  );
  bow.rotation.x = Math.PI / 2;
  bow.rotation.y = Math.PI / 4;
  bow.scale.y = 0.5; // 压扁成尖船头
  bow.position.set(0, 0.25, -2.05);
  bow.userData.baseY = bow.position.y;
  bow.userData.baseZ = bow.position.z;
  bow.userData.baseScale = bow.scale.clone();
  addOutline(bow, 0.06);
  group.add(bow);

  // 船底防水裙（浅青色，视觉吃水线）
  const skirt = new THREE.Mesh(
    new THREE.BoxGeometry(1.5, 0.22, 3.1),
    toon(0x7fd1e0)
  );
  skirt.position.y = -0.02;
  addOutline(skirt, 0.05);
  group.add(skirt);

  // 驾驶舱
  const cockpit = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 0.45, 1.0),
    toon(0xffffff)
  );
  cockpit.position.set(0, 0.7, 0.2);
  addOutline(cockpit, 0.05);
  group.add(cockpit);

  // 小驾驶员（红点简笔）
  const driver = new THREE.Mesh(new THREE.SphereGeometry(0.26, 10, 8), toon(0xe4572e));
  driver.position.set(0, 1.1, 0.2);
  driver.userData.baseY = driver.position.y;
  driver.userData.baseZ = driver.position.z;
  driver.userData.baseScale = driver.scale.clone();
  addOutline(driver, 0.07);
  group.add(driver);

  // 船尾马达
  const motor = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.5, 0.4), toon(0x444a52));
  motor.position.set(0, 0.4, 1.55);
  motor.userData.baseScale = motor.scale.clone();
  motor.userData.baseY = motor.position.y;
  addOutline(motor, 0.06);
  group.add(motor);

  // 天线小旗（转向时可读性 + 卡通感）
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.0, 6), toon(INK));
  pole.position.set(0.3, 1.2, 0.5);
  pole.userData.baseY = pole.position.y;
  group.add(pole);
  const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.3), new THREE.MeshBasicMaterial({
    color: 0x35b24c,
    side: THREE.DoubleSide,
  }));
  flag.position.set(0.55, 1.55, 0.5);
  flag.userData.baseY = flag.position.y;
  flag.rotation.y = Math.PI / 2;
  group.add(flag);

  const blast = new THREE.Group();
  blast.visible = false;
  blast.position.set(0, 0.62, -2.45);
  for (let i = 0; i < 12; i++) {
    const hot = i % 2 === 0;
    const ray = new THREE.Mesh(
      new THREE.BoxGeometry(hot ? 0.09 : 0.06, hot ? 0.09 : 0.06, hot ? 1.1 : 0.75),
      new THREE.MeshBasicMaterial({
        color: hot ? 0xfff066 : 0xff6b2c,
        transparent: true,
        opacity: 0,
      })
    );
    const a = (i / 12) * Math.PI * 2;
    ray.position.set(Math.cos(a) * 0.2, Math.sin(a) * 0.2, -0.25);
    ray.rotation.z = a;
    ray.rotation.y = Math.PI / 2;
    ray.userData.baseX = ray.position.x;
    ray.userData.baseY = ray.position.y;
    ray.userData.baseZ = ray.position.z;
    blast.add(ray);
  }
  group.add(blast);

  // ---- 起步规则视觉（用户要求）----
  // 倒计时轰油门：**整船**随转速越胀越大（不只马达）+ 越憋越抖；
  // 爆缸 = 胀到顶再"砰"地弹开一圈冲击缩放后泄回原形；
  // 完美起步 = 弹射瞬间沿 Z 拉长（speedline 卡通感）再慢慢恢复正常。
  // 纯视觉零物理耦合；main 在渲染后把 group.scale/position 复位防叠加。
  let _swell = 0;
  let _sitY = 0;      // 胀大吃水补偿（applySwellShake 叠加）
  let _jerk = 0;      // 爆缸高频抖动剩余（s）
  let _pop = 0;       // 爆缸冲击缩放剩余（s）
  let _blast = 0;     // 船头爆炸冲击星芒剩余（s）
  let _blastT = 0;    // 船头爆炸冲击星芒已播放（s）
  let _launch = 0;    // 完美起跑拉长触发（s）
  let _launchT = 0;   // 拉长已进行时长（指数慢还原）
  let _launchPower = 1; // 完美起跑视觉强度：GO 帧实际膨胀大小
  let _spring = 0;    // 爆缸弹簧头触发（>0 = 动画进行）
  let _springT = 0;   // 弹簧已进行时长
  let _springDur = 1; // 本次爆缸动画总时长（由抢跑时长动态计算，<=1s）
  let _itemScale = 1; // 道具巨大化视觉倍率（BoatController 每帧写入）
  let _lastShakeT = -Infinity;
  function setEngineSwell(swell) {
    const SV = CONFIG.raceFlow.start;
    _swell = swell;
    // 马达鼓包先吃胀度（视觉最贴"发动机要炸"的叙事）
    const ms = 1 + swell * (0.55 + SV.swellMotorScale * 0.45);
    motor.scale.set(ms, ms * (1 + swell * 0.3), ms);
    motor.position.y = motor.userData.baseY + swell * 0.14;
    // 整船胀大：swell=1 → 1+swellBoatScale 倍（默认 1.6×，一眼夸张）。
    // 吃水补偿：放大后船体下缘会陷进水里（"变大"被水吃掉 = 用户"没感觉
    // 大多少"真根因）——抬高 group 让船底坐在水面上，胀大尽收眼底。
    const bs = 1 + swell * SV.swellBoatScale;
    group.scale.set(bs, bs, bs);
    _sitY = (bs - 1) * 0.55; // 船体半高 ~0.55m × 胀量
  }
  function setItemScale(scale = 1) {
    _itemScale = Math.max(1, Math.min(2.2, scale || 1));
  }
  // 每帧姿态钩子：BoatController 写完 obj.position/scale 之后由 main 调用
  function applySwellShake(dt, t) {
    if (t === _lastShakeT) return;
    _lastShakeT = t;
    const SV = CONFIG.raceFlow.start;
    if (_sitY > 0) group.position.y += _sitY;
    if (_swell > 0.02) {
      group.position.y += Math.sin(t * 47) * _swell * SV.swellShake;
    }
    if (_jerk > 0) {
      _jerk = Math.max(0, _jerk - dt);
      group.position.y += Math.abs(Math.sin(t * 60)) * 0.22 * (_jerk / 0.5);
    }
    if (_pop > 0) {
      // 爆缸冲击波：从胀到顶的体积"砰"地再撑大 blowPopScale 峰值弹回，
      // 1 个衰减周期（先可见地爆大，再泄回原形）
      _pop = Math.max(0, _pop - dt);
      const k = _pop / 0.45; // 1→0
      const bump = 1 + (SV.blowPopScale + 0.45) * Math.sin(k * Math.PI) * k;
      group.scale.set(bump, bump, bump);
    }
    if (_blast > 0) {
      _blast = Math.max(0, _blast - dt);
      _blastT += dt;
      const u = Math.min(1, _blastT / 0.45);
      const grow = 0.25 + 1.85 * Math.sin(u * Math.PI * 0.72);
      const alpha = Math.max(0, 1 - u * 1.15);
      blast.visible = alpha > 0.02;
      blast.scale.set(grow, grow, grow);
      blast.rotation.z = t * 8;
      for (const ray of blast.children) {
        ray.material.opacity = alpha;
        ray.position.x = ray.userData.baseX * (1 + u * 2.2);
        ray.position.y = ray.userData.baseY * (1 + u * 2.2);
        ray.position.z = ray.userData.baseZ - u * 0.55;
      }
    } else if (blast.visible) {
      blast.visible = false;
      for (const ray of blast.children) ray.material.opacity = 0;
    }
    if (_launch > 0) {
      // 完美起跑（用户：5 秒内逐步变小）：强度来自 GO 帧实际膨胀大小。
      // 膨胀越大，视觉上向前冲得越远、拉得越长；行驶中逐步恢复。
      _launchT = (_launchT || 0) + dt;
      const dur = SV.launchRestoreTime || 5.0;
      const u = Math.min(1, _launchT / dur);
      const k = 1 - (u * u * (3 - 2 * u)); // smoothstep 反向：1→0，单调缓降
      if (u >= 1) {
        _launch = 0;
        group.scale.set(1, 1, 1);
        group.rotation.x = 0;
      }
      else {
        const p = Math.max(0.35, Math.min(1, _launchPower || 1));
        const swollen = 1 + p * (SV.swellBoatScale || 0);
        const body = 1 + (swollen - 1) * k;
        const z = body + (SV.launchStretch - 1) * p * k;
        group.scale.set(body, body, z);
        group.translateZ(-(SV.launchForward || 0) * p * k);
        group.rotation.x = -0.12 * p * k; // 起跑抬机头，缓落
      }
    }
    // ---- 爆缸弹簧头 + 驾驶员弹出 ----
    // 爆炸先把船头顶出去，同时把驾驶员从座位里弹起、落到水面漂一下，
    // 再闪动还原。总时长由本次抢跑时长动态计算，最长 1 秒。
    if (_spring > 0) {
      _springT += dt;
      const T0 = _springDur || SV.popDriverTime || 1.0; // 动画全程 = 物理锁 popT 同源
      const SV2 = SV;
      if (_springT > T0) {
        _spring = 0;
        _restoreHead();
      } else {
        const u = Math.min(1, _springT / T0);
        const slow = Math.pow(1 - u, 0.58);
        const wobble = Math.exp(-_springT / 0.35);
        const ph = Math.sin(_springT / (SV2.popPeriod || 0.24) * Math.PI * 2);

        const punch = Math.max(0, slow * (1.0 + 0.22 * ph * wobble));
        bow.position.z = bow.userData.baseZ - 1.45 * punch;
        bow.position.y = bow.userData.baseY + 0.42 * punch + 0.08 * wobble * ph;
        bow.scale.set(
          bow.userData.baseScale.x * (1 + 0.55 * punch),
          bow.userData.baseScale.y * (1 + 2.35 * punch),
          bow.userData.baseScale.z * (1 + 0.55 * punch)
        );

        const smooth = (x) => x * x * (3 - 2 * x);
        const lerp = (a, b, x) => a + (b - a) * x;
        const dropEnd = T0 * 0.36;
        const floatEnd = T0 * 0.72;
        const waterY = 0.05;
        const waterZ = driver.userData.baseZ - 4.2;
        driver.visible = true;
        if (_springT < dropEnd) {
          const q = Math.min(1, _springT / dropEnd);
          const s = smooth(q);
          driver.position.set(
            0.75 * Math.sin(q * Math.PI * 1.15),
            lerp(driver.userData.baseY, waterY, s) + 5.2 * Math.sin(q * Math.PI),
            lerp(driver.userData.baseZ, waterZ, s)
          );
          driver.rotation.set(5.6 * q * Math.PI, 0, 9.0 * q * Math.PI);
          driver.scale.setScalar(1 + 1.25 * Math.sin(q * Math.PI));
        } else if (_springT < floatEnd) {
          const q = Math.min(1, (_springT - dropEnd) / Math.max(0.01, floatEnd - dropEnd));
          driver.position.set(
            0.45 * Math.sin(q * Math.PI * 2.2),
            waterY + 0.08 * Math.sin(_springT * 7.5),
            waterZ + 0.28 * Math.sin(q * Math.PI * 1.6)
          );
          driver.rotation.set(0.25 * Math.sin(_springT * 5), 0, 0.5 * Math.sin(_springT * 4.2));
          driver.scale.setScalar(1.25 + 0.08 * Math.sin(_springT * 6));
        } else {
          const q = Math.min(1, (_springT - floatEnd) / Math.max(0.01, T0 - floatEnd));
          const s = smooth(q);
          driver.visible = Math.floor(q * 14) % 2 === 0 || q > 0.88;
          driver.position.set(
            lerp(0, 0, s),
            lerp(waterY, driver.userData.baseY, s),
            lerp(waterZ, driver.userData.baseZ, s)
          );
          driver.rotation.set(0, 0, (1 - s) * 6);
          driver.scale.setScalar(1 + (1 - s) * 0.55);
        }
        pole.position.y = pole.userData.baseY + 0.1 * wobble * (1 - ph) * 0.5;
        flag.position.y = flag.userData.baseY + 0.1 * wobble * (1 - ph) * 0.5;
        group.position.y += 0.12 * wobble * Math.abs(ph);
        group.rotation.x = -0.08 * wobble * ph;
      }
    }
    if (_itemScale > 1.001) {
      group.scale.multiplyScalar(_itemScale);
      group.position.y += (_itemScale - 1) * 0.55;
    }
  }
  function _restoreHead() {
    bow.position.z = bow.userData.baseZ;
    bow.position.y = bow.userData.baseY;
    bow.scale.copy(bow.userData.baseScale);
    driver.position.set(0, driver.userData.baseY, driver.userData.baseZ);
    driver.rotation.set(0, 0, 0);
    driver.scale.copy(driver.userData.baseScale);
    driver.visible = true;
    pole.position.y = pole.userData.baseY;
    flag.position.y = flag.userData.baseY;
    _clearBlast();
  }
  function _resetPartsForExplosion() {
    bow.position.z = bow.userData.baseZ;
    bow.position.y = bow.userData.baseY;
    bow.scale.copy(bow.userData.baseScale);
    driver.position.set(0, driver.userData.baseY, driver.userData.baseZ);
    driver.rotation.set(0, 0, 0);
    driver.scale.copy(driver.userData.baseScale);
    driver.visible = true;
    pole.position.y = pole.userData.baseY;
    flag.position.y = flag.userData.baseY;
  }
  function _clearBlast() {
    blast.visible = false;
    for (const ray of blast.children) ray.material.opacity = 0;
  }
  // 供 main 渲染后统一回位：动画进行中不动零件（由动画自持），空闲回位
  function restoreHead() {
    if (_spring <= 0 && _launch <= 0) _restoreHead();
  }
  const animActive = () => _spring > 0 || _launch > 0;
  // 动画状态只读快照（trace/调试用）。
  const animState = () => ({ spring: _spring > 0, springT: _springT,
    launch: { active: _launch > 0, power: _launchPower, t: _launchT },
    itemScale: _itemScale,
    bow: { z: bow.position.z - bow.userData.baseZ,
      y: bow.position.y - bow.userData.baseY,
      scale: bow.scale.y / bow.userData.baseScale.y },
    blast: { visible: blast.visible, scale: blast.scale.x,
      opacity: blast.children[0]?.material.opacity || 0 },
    driver: { y: driver.position.y - driver.userData.baseY,
      z: driver.position.z - driver.userData.baseZ,
      visible: driver.visible,
      tumble: driver.rotation.z,
      landed: driver.position.y < driver.userData.baseY - 0.7 } });
  function triggerBlowUp() {
    _jerk = 0.5;   // 砰的高频抖（短——主戏交给弹簧头）
    _pop = 0.45;   // 明显冲击胀一下即泄
    _blast = 0.45;
    _blastT = 0;
  }
  // 爆缸弹簧头点火（main 在爆缸帧调用；缩回时长由物理端 popT 锁同步）
  function triggerSpringHead(duration = 1) {
    _spring = 1;
    _springT = 0;
    _springDur = Math.max(0.35, Math.min(1, duration || 1));
    _resetPartsForExplosion(); // 从干净基线起爆，但保留 triggerBlowUp 点亮的爆炸
  }
  function triggerLaunchStretch(power = 1) {
    _launch = 1; // 触发旗（动画时长由 _launchT 指数还原掌控）
    _launchT = 0;
    _launchPower = Math.max(0.35, Math.min(1, power || 1));
  }
  // 每帧消费 boat.launchPop（完美起跑拉长；main 在渲染后复位 scale）
  function syncLaunchPop(boat) {
    if (boat && boat.launchPop) {
      boat.launchPop = false;
      triggerLaunchStretch(boat.launchPower || boat.swell || 1);
      boat.launchPower = 0;
    }
  }

  return {
    group,
    flag,
    setEngineSwell,
    setItemScale,
    applySwellShake,
    triggerBlowUp,
    triggerSpringHead,
    restoreHead,
    animActive,
    animState,
    triggerLaunchStretch,
    syncLaunchPop,
    collider: { type: "cylinder", radius: 1.1, halfHeight: 0.4 },
  };
}
