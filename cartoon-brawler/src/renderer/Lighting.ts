/** Lighting: hemisphere fill + one shadow-casting directional sun. Follows camera target cheaply. */
import * as THREE from 'three';
import { GRAPHICS_CONFIG } from '../config/graphicsConfig';

export class Lighting {
  readonly sun: THREE.DirectionalLight;
  readonly hemi: THREE.HemisphereLight;
  private pivot = new THREE.Object3D();

  constructor(scene: THREE.Scene) {
    this.hemi = new THREE.HemisphereLight(
      GRAPHICS_CONFIG.ambientSkyColor,
      GRAPHICS_CONFIG.ambientGroundColor,
      GRAPHICS_CONFIG.hemiIntensity,
    );
    scene.add(this.hemi);

    this.sun = new THREE.DirectionalLight(GRAPHICS_CONFIG.sunColor, GRAPHICS_CONFIG.sunIntensity);
    this.sun.position.set(18, 30, 14);
    this.sun.castShadow = true;
    const s = GRAPHICS_CONFIG.shadowMapSize;
    this.sun.shadow.mapSize.set(s, s);
    const a = GRAPHICS_CONFIG.shadowArea;
    this.sun.shadow.camera.left = -a / 2;
    this.sun.shadow.camera.right = a / 2;
    this.sun.shadow.camera.top = a / 2;
    this.sun.shadow.camera.bottom = -a / 2;
    this.sun.shadow.camera.near = 5;
    this.sun.shadow.camera.far = 90;
    this.sun.shadow.bias = -0.0012;
    this.sun.shadow.normalBias = 0.03;

    // sun rides a pivot so shadow frustum follows gameplay focus
    this.pivot.add(this.sun);
    this.sun.position.set(18, 30, 14);
    scene.add(this.pivot);
    this.sun.target.position.set(0, 0, 0);
    this.pivot.add(this.sun.target); // target rides the pivot so the shadow frustum follows focus
  }

  /** Keep the shadow camera centered on the action. */
  follow(x: number, z: number): void {
    this.pivot.position.set(Math.round(x / 4) * 4, 0, Math.round(z / 4) * 4);
  }
}
