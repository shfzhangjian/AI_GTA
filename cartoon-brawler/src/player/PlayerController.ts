/**
 * PlayerController: reads InputController, converts to camera-relative movement,
 * feeds the state machine, manages input buffering (100-200ms) and weapon switch.
 */
import * as THREE from 'three';
import type { InputFrame } from '../input/InputManager';
import type { CameraController } from '../camera/CameraController';
import { PLAYER_CONFIG } from '../config/gameConfig';
import { tmp } from '../core/TempObjects';

export interface BufferedPress {
  kind: 'light' | 'heavy';
  age: number;
}

export class PlayerController {
  /** smoothed movement intent in world space (camera-relative) */
  readonly moveDir = new THREE.Vector3();
  moveAmount = 0;
  sprint = false;
  buffered: BufferedPress | null = null;
  dodgePressed = false;
  jumpPressed = false;

  constructor(_camera: CameraController) { void _camera; }

  update(frame: InputFrame, dt: number): void {
    // camera-relative movement: this camera looks toward -Z from +Z offset, so
    // screen-up (W, moveZ=+1) must move the player toward -Z (deeper into the level).
    tmp.vec3A.set(frame.moveX, 0, -frame.moveZ);
    const len = Math.hypot(tmp.vec3A.x, tmp.vec3A.z);
    if (len > 0.01) {
      tmp.vec3A.multiplyScalar(1 / Math.max(len, 1)); // clamp diagonal to unit
      if (this.moveAmount < 0.05 || this.moveDir.dot(tmp.vec3A) > 0.98) {
        this.moveDir.copy(tmp.vec3A); // instant response from stop / straight continuation
      } else {
        this.moveDir.lerp(tmp.vec3A, 1 - Math.exp(-26 * dt));
      }
      this.moveAmount = Math.min(1, len);
    } else {
      this.moveAmount = 0;
    }
    this.sprint = frame.sprint;

    // buffer attack presses
    if (frame.pressedLight) this.buffered = { kind: 'light', age: 0 };
    else if (frame.pressedHeavy) this.buffered = { kind: 'heavy', age: 0 };
    if (this.buffered) {
      this.buffered.age += dt;
      if (this.buffered.age > PLAYER_CONFIG.inputBufferWindow) this.buffered = null;
    }

    this.dodgePressed = frame.pressedDodge;
    this.jumpPressed = frame.pressedJump;
  }

  consumeBuffer(): BufferedPress | null {
    const b = this.buffered;
    this.buffered = null;
    return b;
  }

  reset(): void {
    this.buffered = null;
    this.dodgePressed = false;
    this.jumpPressed = false;
    this.moveAmount = 0;
    this.moveDir.set(0, 0, 0);
  }
}
