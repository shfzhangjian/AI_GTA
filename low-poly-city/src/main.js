/**
 * main —— 入口：装配 App、城市、模式管理器与小地图，并驱动每帧更新。
 */
import * as THREE from 'three';
import { App } from './core/App.js';
import { ModeManager } from './core/ModeManager.js';
import { WeaponSystem } from './core/WeaponSystem.js';
import { Sfx } from './core/Sfx.js';
import { buildCity } from './world/CityBuilder.js';
import { Minimap } from './ui/Minimap.js';
import { FP } from './config.js';

const app = new App(document.getElementById('app'));
const city = buildCity(app.scene);

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
const weapons = new WeaponSystem({
  app, city, mode, sfx,
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
city.traffic.attachAvoid([...city.agents.list, playerProxy]);

window.__cityBooted = true; // 通知 index.html 的错误兜底：启动成功

app.start((dt, t) => {
  const camPos = app.camera.position;

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
    // 挥拳命中帧：锥形范围判定，NPC 扣血/红闪/血条/逃跑
    if (mode.fp.consumePunchHit()) {
      city.agents.attack(camPos.x, camPos.z, mode.fp.facing.x, mode.fp.facing.z);
    }

    mode.syncAvatar(dt);
    app.camera.getWorldDirection(_fwd);
    minimap.update(camPos, _fwd);
  }

  weapons.update(dt); // 内部自判是否处于第一人称
  city.traffic.update(dt);
  city.agents.update(dt, camPos); // 俯视模式也传位置：NPC 复活时远离玩家
  city.zonesGroup.visible = mode.mode === 'overhead';
  city.pulse(t, mode.overhead.getHovered());
  mode.syncLabel();
});
