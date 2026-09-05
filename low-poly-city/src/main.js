/**
 * main —— 入口：装配 App、城市、模式管理器与小地图，并驱动每帧更新。
 */
import * as THREE from 'three';
import { App } from './core/App.js';
import { ModeManager } from './core/ModeManager.js';
import { WeaponSystem } from './core/WeaponSystem.js';
import { PlayerHealth } from './core/PlayerHealth.js';
import { Sfx } from './core/Sfx.js';
import { buildCity } from './world/CityBuilder.js';
import { PoliceSystem } from './world/PoliceSystem.js';
import { CombatFx } from './world/CombatFx.js';
import { loadCarTemplate } from './world/CarModel.js';
import { Minimap } from './ui/Minimap.js';
import { FP } from './config.js';

const app = new App(document.getElementById('app'));

// ---- 真车模型先行：保时捷911（3d-car-showcase, MIT），失败回退肌肉车/盒装车；车流第一帧即真模型 ----
const carTemplate = await loadCarTemplate();

const city = buildCity(app.scene, { carTemplate, camPos: app.camera.position });

const mode = new ModeManager(app, city, {
  overhead: document.getElementById('hud-overhead'),
  fp: document.getElementById('hud-fp'),
  label: document.getElementById('zone-label'),
  minimap: document.getElementById('minimap'),
});

const minimap = new Minimap(document.getElementById('minimap'), city);
const _fwd = new THREE.Vector3(); // 复用，避免每帧分配

// 武器系统：1~4 切枪 / R 装填 / 左键开火 / 右键瞄准镜（音效 WebAudio 合成）
const sfx = new Sfx();

// 警匪对抗：袭击路人 -> 警车出警 -> 警察持枪反击；玩家中 5 弹阵亡退出第一人称
const police = new PoliceSystem({ scene: app.scene, colliders: city.colliders, sfx });
police.template = carTemplate; // 警车同款模型（白漆），null 则程序化警车
const health = new PlayerHealth({
  sfx,
  hud: {
    vignette: document.getElementById('damage-vignette'),
    bar: document.getElementById('hp-bar'),
    fill: document.getElementById('hp-fill'),
    deathMsg: document.getElementById('death-msg'),
  },
  onDeath: () => mode.exitFP(),
});
police.onPlayerHit = () => health.takeHit(20); // 警察子弹：5 枪阵亡

// 战斗特效中枢：爆炸粒子 / 地面弹坑 / 残骸燃烧（全程序化，零素材）
const combatFx = new CombatFx(app.scene);

const weapons = new WeaponSystem({
  app, city, mode, sfx, police, health, fx: combatFx,
  hud: {
    bar: document.getElementById('weapon-hud'),
    slots: Array.from(document.querySelectorAll('.wslot')),
    ammo: document.getElementById('ammo'),
    scope: document.getElementById('scope'),
    flash: document.getElementById('hit-flash'),
  },
});

// 玩家实体注册进车流避让表：汽车会为你刹停，且其矩形阻挡玩家（互相不穿透）
const playerProxy = { x: 999, z: 999 };
city.traffic.attachAvoid([...city.agents.list, playerProxy, police.proxy]);

minimap.police = police; // 小地图显示警察与闪烁警车

window.__cityBooted = true; // 通知 index.html 的错误兜底：启动成功

let prevMode = mode.mode;
app.start((dt, t) => {
  const camPos = app.camera.position;

  // 模式切换沿：进入第一人称重置血量；退出则警方收队清场
  if (mode.mode !== prevMode) {
    if (mode.mode === 'fp') health.reset();
    else police.standDown();
    prevMode = mode.mode;
  }

  if (mode.mode === 'overhead') {
    mode.overhead.update();
    playerProxy.x = 999; playerProxy.z = 999; // 俯视模式车辆无需让行玩家
  } else {
    mode.fp.update(dt);
    playerProxy.x = camPos.x; playerProxy.z = camPos.z;

    // 撞上行人/狗：对方踉跄让开，玩家明显减速（软性阻挡）
    if (city.agents.bumpAt(camPos.x, camPos.z, FP.radius)) {
      mode.fp.vel.multiplyScalar(0.35);
    }
    // 挥拳命中帧：锥形范围判定，NPC 扣血/红闪/血条/逃跑；袭击平民会引来报警
    if (mode.fp.consumePunchHit()) {
      const res = city.agents.attack(camPos.x, camPos.z, mode.fp.facing.x, mode.fp.facing.z);
      if (res.hits > 0) police.reportCrime(res.x, res.z);
    }

    mode.syncAvatar(dt);
    app.camera.getWorldDirection(_fwd);
    minimap.update(camPos, _fwd);
  }

  weapons.update(dt); // 内部自判是否处于第一人称
  combatFx.update(dt);
  police.update(dt, mode.mode === 'fp' ? camPos : null);
  health.update(dt, mode.mode === 'fp');
  city.traffic.update(dt);
  city.agents.update(dt, camPos); // 俯视模式也传位置：NPC 复活时远离玩家
  city.zonesGroup.visible = mode.mode === 'overhead';
  city.pulse(t, mode.overhead.getHovered());
  mode.syncLabel();
});
