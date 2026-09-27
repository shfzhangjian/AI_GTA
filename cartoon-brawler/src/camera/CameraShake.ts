/** CameraShake: trauma-based decaying shake applied to the live camera. */
import * as THREE from 'three';
import { tmp } from '../core/TempObjects';

export class CameraShake {
  private trauma = 0; // 0..1
  private readonly maxTrauma = 1;
  private static readonly DECAY = 2.4;
  private seed = Math.random() * 100;

  /** intensity ~ hit power (0.5 light .. 2.5 heavy) */
  shake(intensity: number): void {
    this.trauma = Math.min(this.maxTrauma, this.trauma + intensity * 0.22);
  }

  apply(camera: THREE.Camera, elapsed: number): void {
    if (this.trauma <= 0.001) return;
    this.trauma = Math.max(0, this.trauma - CameraShake.DECAY * (1 / 60));
    const t = this.trauma * this.trauma; // quadratic: snappier falloff
    const s = elapsed * 42 + this.seed;
    const ox = noise(s) * 0.35 * t;
    const oy = noise(s * 1.31 + 7.3) * 0.28 * t;
    const rot = noise(s * 0.87 + 19.1) * 0.022 * t;
    camera.position.x += ox;
    camera.position.y += oy;
    tmp.eulerA.set(0, 0, rot);
    camera.rotateZ(rot);
  }

  reset(): void {
    this.trauma = 0;
  }
}

/** cheap deterministic pseudo-noise [-1..1] */
function noise(x: number): number {
  return Math.sin(x * 12.9898) * 43758.5453 % 1;
}
