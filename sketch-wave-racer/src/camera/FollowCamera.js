// Sketch Wave Racer — 第三人称跟随摄像机（Phase 1）
// 平滑跟随；速度越快稍微拉远拉高（可读性）；注视点前移看向前方。
// Phase 4+ 扩展：漂移侧移、C 键切视角、回头看、结算回放。

import * as THREE from "three";
import { CONFIG } from "../config.js";

export class FollowCamera {
  /** @param {THREE.PerspectiveCamera} camera */
  constructor(camera) {
    this.cam = camera;
    this.focus = new THREE.Vector3();
    this._desired = new THREE.Vector3();
    this._lookAt = new THREE.Vector3();
    this._initialized = false;
  }

  /**
   * @param {{position:THREE.Vector3, heading:number, speed:number}} target
   */
  update(dt, target) {
    const F = CONFIG.followCam;
    const spd = Math.min(Math.abs(target.speed) / CONFIG.boat.maxSpeed, 1);

    // 期望位置：船后下方，随速度拉远拉高
    const back = F.backDist * (1 + spd * F.speedPush * 2);
    const h = F.height * (1 + spd * F.speedPush);
    this._desired.set(
      target.position.x + Math.sin(target.heading) * back,
      target.position.y + h,
      target.position.z + Math.cos(target.heading) * back
    );

    if (!this._initialized) {
      this.cam.position.copy(this._desired);
      this.focus.copy(target.position);
      this._initialized = true;
    }

    // 位置平滑（指数插值，帧率无关）
    const kPos = 1 - Math.exp(-F.posLerp * dt);
    this.cam.position.lerp(this._desired, kPos);

    // 注视点：船位置 + 前方一点（速度越快看得越远），高度随波浪船体
    this._lookAt.set(
      target.position.x - Math.sin(target.heading) * spd * 6,
      target.position.y + F.lookHeight,
      target.position.z - Math.cos(target.heading) * spd * 6
    );
    const kLook = 1 - Math.exp(-F.lookLerp * dt);
    this.focus.lerp(this._lookAt, kLook);
    this.cam.lookAt(this.focus);

    // 摄像机本身贴住波面之上，避免镜头埋入水里
    const minY = target.position.y + 1.2;
    if (this.cam.position.y < minY) this.cam.position.y = minY;
  }
}
