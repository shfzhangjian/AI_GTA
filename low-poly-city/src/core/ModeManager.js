/**
 * ModeManager —— 模式状态机：俯视(orbit) <-> 第一人称(pointer-lock)。
 * 负责两套控制器的互斥切换、HUD 显隐、退出后相机复位、悬停标签跟随。
 */
import * as THREE from 'three';
import { OverheadControls } from '../controls/OverheadControls.js';
import { FirstPersonControls } from '../controls/FirstPersonControls.js';
import { createPlayerAvatar } from '../world/PlayerAvatar.js';

export class ModeManager {
  /**
   * @param {import('./App.js').App} app
   * @param {ReturnType<import('../world/CityBuilder.js').buildCity>} city
   * @param {{overhead:HTMLElement, fp:HTMLElement, label:HTMLElement, minimap:HTMLElement}} hud
   */
  constructor(app, city, hud) {
    this.app = app;
    this.city = city;
    this.hud = hud;
    this.mode = 'overhead'; // 'overhead' | 'fp'

    this.overhead = new OverheadControls({
      camera: app.camera,
      dom: app.renderer.domElement,
      zones: city.zones,
      picker: city.groundPicker,
      onActivate: (zone) => this.enterFP(zone),
    });

    this.fp = new FirstPersonControls({
      camera: app.camera,
      dom: app.renderer.domElement,
      colliders: city.colliders,
      onEnter: () => this._showHud('fp'),
      onExit: () => this.exitFP(), // Esc 解锁 / 锁定失败都会走到这里
    });

    // 指针锁定申请失败（如浏览器策略拒绝）时兜底回俯视，避免卡死
    window.addEventListener('pointerlockerror', () => this.exitFP());

    // 第一人称玩家实体：世界中的身体（头部在 layer 2，自己看不到）
    this.avatar = createPlayerAvatar();
    this.avatar.group.visible = false;
    app.scene.add(this.avatar.group);

    // 车辆成为玩家的动态碰撞体（汽车不再穿透第一人称用户）
    this.fp.dynamicRects = () => city.traffic.carRects();

    // 记住俯视机位与目标，退出第一人称后原路返回
    this.saved = {
      pos: app.camera.position.clone(),
      target: new THREE.Vector3(0, 5, 0),
    };
  }

  enterFP(zone) {
    if (this.mode === 'fp') return;
    this.saved.pos.copy(this.app.camera.position);
    this.overhead.setEnabled(false);
    this.fp.tryEnter(zone); // 处于点击手势调用栈内，满足 pointer-lock 要求
    this.mode = 'fp';
  }

  /** 每帧（FP 模式）：玩家身体跟随相机，四肢随移动强度摆动 */
  syncAvatar(dt) {
    const cam = this.app.camera;
    this.avatar.group.position.set(cam.position.x, cam.position.y - 1.7, cam.position.z);
    this.avatar.group.rotation.y = Math.atan2(this.fp.facing.x, this.fp.facing.z);
    this.avatar.update(dt, this.fp.movingRatio, this.fp.walkPhase);
  }

  exitFP() {
    if (this.mode !== 'fp') return;
    this.mode = 'overhead';
    const cam = this.app.camera;
    cam.position.copy(this.saved.pos);
    this.overhead.orbit.target.copy(this.saved.target);
    this.overhead.orbit.update();
    this.overhead.setEnabled(true);
    this._showHud('overhead');
  }

  _showHud(m) {
    this.hud.overhead.classList.toggle('hidden', m !== 'overhead');
    this.hud.fp.classList.toggle('hidden', m !== 'fp');
    this.hud.minimap.classList.toggle('hidden', m !== 'fp'); // 小地图仅第一人称可见
    this.avatar.group.visible = m === 'fp';                   // 玩家实体仅在 FP 模式存在
    if (m !== 'overhead') this.hud.label.classList.add('hidden');
  }

  /** 每帧调用：把悬停城区的浮动标签投到屏幕坐标 */
  syncLabel() {
    const z = this.mode === 'overhead' ? this.overhead.getHovered() : null;
    if (!z) {
      this.hud.label.classList.add('hidden');
      return;
    }
    const v = new THREE.Vector3(z.x, 3.6, z.z).project(this.app.camera);
    const el = this.hud.label;
    el.textContent = `▶ 点击进入 · ${z.name}`;
    el.style.left = `${(v.x * 0.5 + 0.5) * window.innerWidth}px`;
    el.style.top = `${(-v.y * 0.5 + 0.5) * window.innerHeight}px`;
    el.classList.remove('hidden');
  }
}
