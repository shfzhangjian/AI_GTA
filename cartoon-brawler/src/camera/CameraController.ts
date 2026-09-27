/**
 * CameraController: beat-'em-up style follow cam.
 * Fixed pitch, distance/height from config; smooth follow + look-ahead on input;
 * dynamic zoom-out when surrounded or during boss framing. Shake applied last.
 */
import * as THREE from 'three';
import { CAMERA_CONFIG } from '../config/gameConfig';
import { CameraShake } from './CameraShake';
import { tmp } from '../core/TempObjects';

export interface CameraFocus {
  playerPos: THREE.Vector3;
  /** where the player is "looking" (facing) */
  facing: THREE.Vector3;
  /** extra points that must stay framed (boss, crowds) */
  focusPoints: THREE.Vector3[];
  surroundLevel: number; // 0..1 how many enemies nearby
  bossMode: boolean;
}

export class CameraController {
  private target = new THREE.Vector3(0, 1.2, 30);
  private lookAhead = new THREE.Vector3();
  private currentDistance = CAMERA_CONFIG.distance;
  private currentHeight = CAMERA_CONFIG.height;
  readonly pitchRad = (CAMERA_CONFIG.pitchDeg * Math.PI) / 180;
  /** camera-relative basis vectors for movement conversion */
  readonly forward = new THREE.Vector3(0, 0, -1);
  readonly right = new THREE.Vector3(1, 0, 0);

  constructor(private camera: THREE.PerspectiveCamera, public shake: CameraShake) {
    this.updateBasis();
  }

  snapTo(pos: THREE.Vector3): void {
    this.target.copy(pos).setY(pos.y + 1.1);
    this.lookAhead.set(0, 0, 0);
    this.applyImmediate();
  }

  private updateBasis(): void {
    // forward = horizontal direction from camera toward player (into screen)
    const cp = Math.cos(this.pitchRad);
    void cp;
    this.forward.set(0, 0, -1);
    this.right.set(1, 0, 0);
  }

  update(dt: number, focus: CameraFocus, elapsed: number): void {
    const cfg = CAMERA_CONFIG;

    // desired follow target: player + look-ahead toward facing/focus
    tmp.vec3A.copy(focus.playerPos).setY(focus.playerPos.y + 1.1);

    tmp.vec3B.copy(focus.facing).multiplyScalar(cfg.lookAheadMax * Math.min(1, focus.facing.length()));
    if (focus.focusPoints.length > 0) {
      // pull framing toward centroid of focus points (boss / crowd)
      tmp.vec3C.set(0, 0, 0);
      for (const p of focus.focusPoints) tmp.vec3C.add(p);
      tmp.vec3C.multiplyScalar(1 / focus.focusPoints.length);
      tmp.vec3C.sub(tmp.vec3A).setY(0);
      const d = Math.min(tmp.vec3C.length(), 6);
      if (tmp.vec3C.lengthSq() > 1e-4) tmp.vec3C.normalize().multiplyScalar(d * 0.45);
      tmp.vec3B.add(tmp.vec3C);
    }
    const laLerp = 1 - Math.exp(-cfg.lookAheadLerp * dt);
    this.lookAhead.lerp(tmp.vec3B, laLerp);

    tmp.vec3D.copy(tmp.vec3A).add(this.lookAhead);
    const followLerp = 1 - Math.exp(-cfg.followLerp * dt);
    this.target.lerp(tmp.vec3D, followLerp);

    // dynamic distance/height
    let wantDist = cfg.distance + focus.surroundLevel * cfg.combatDistanceBonus;
    let wantHeight = cfg.height;
    if (focus.bossMode) {
      wantDist += cfg.bossDistanceBonus;
      wantHeight += cfg.bossHeightBonus;
    }
    const zLerp = 1 - Math.exp(-cfg.zoomLerp * dt);
    this.currentDistance += (Math.min(cfg.maxDistance, Math.max(cfg.minDistance, wantDist)) - this.currentDistance) * zLerp;
    this.currentHeight += (wantHeight - this.currentHeight) * zLerp;

    this.applyImmediate();

    // shake rides on top of resolved transform
    this.shake.apply(this.camera, elapsed);
  }

  private applyImmediate(): void {
    const dist = this.currentDistance;
    const h = this.currentHeight;
    this.camera.position.set(this.target.x, this.target.y + h, this.target.z + dist);
    this.camera.lookAt(this.target.x, this.target.y + 1.2, this.target.z);
  }

  /** Move vector (WASD/gamepad) -> world direction using camera yaw. */
  cameraRelativeMove(mx: number, mz: number, out: THREE.Vector3): THREE.Vector3 {
    // camera looks toward -Z from +Z offset; screen-up == world -Z
    out.set(mx, 0, -mz);
    return out;
  }
}
