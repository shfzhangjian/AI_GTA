/** VFXManager: subscribes to impact events, drives trails/bursts/shockwave rings. */
import * as THREE from 'three';
import type { EventBus } from '../core/EventBus';
import { ImpactEffect } from './ImpactEffect';
import { WeaponTrail } from './WeaponTrail';

export class VFXManager {
  readonly trail: WeaponTrail;
  private impacts: ImpactEffect;
  private rings: { mesh: THREE.Mesh; age: number; maxAge: number; speed: number }[] = [];
  private ringGeo: THREE.RingGeometry;
  private ringPool: THREE.Mesh[] = [];

  private sceneRef: THREE.Scene;

  constructor(scene: THREE.Scene, bus: EventBus) {
    this.sceneRef = scene;
    this.trail = new WeaponTrail(scene);
    this.impacts = new ImpactEffect(scene);
    this.ringGeo = new THREE.RingGeometry(0.5, 0.72, 24);

    bus.on('impact', (e) => {
      const p = tmpPos.set(e.x, e.y, e.z);
      switch (e.kind) {
        case 'hit':
          this.impacts.burst(p, { color: 0xffe28a, count: 6, speed: 4.5, duration: 0.35 });
          break;
        case 'heavy':
          this.impacts.burst(p, { color: 0xffb03d, count: 10, speed: 7, size: 1.4, duration: 0.5 });
          break;
        case 'break':
          this.impacts.burst(p, { color: 0xd9a05c, count: 9, speed: 6, size: 1.2, duration: 0.6 });
          break;
        case 'world':
          this.spawnShockwave(tmpPos.set(e.x, 0.08, e.z), 14, 0x9fdcff);
          this.impacts.burst(p, { color: 0xcfd6de, count: 12, speed: 9, size: 1.3, duration: 0.55, ring: true });
          break;
        case 'death':
          this.impacts.burst(p, { color: 0xff7847, count: 12, speed: 6.5, size: 1.3, duration: 0.7 });
          break;
        case 'boss':
          this.impacts.burst(p, { color: 0xff5c5c, count: 14, speed: 8, size: 1.6, duration: 0.6 });
          break;
      }
    });
  }

  spawnShockwave(pos: THREE.Vector3, speed: number, color: number): void {
    let mesh = this.ringPool.pop();
    if (!mesh) {
      mesh = new THREE.Mesh(
        this.ringGeo,
        new THREE.MeshBasicMaterial({ color, transparent: true, side: THREE.DoubleSide, depthWrite: false }),
      );
    } else {
      (mesh.material as THREE.MeshBasicMaterial).color.setHex(color);
    }
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.copy(pos);
    mesh.scale.setScalar(0.5);
    mesh.visible = true;
    this.rings.push({ mesh, age: 0, maxAge: 0.8, speed });
    if (!mesh.parent) this.sceneRef.add(mesh);
  }

  update(dt: number): void {
    this.impacts.update(dt);
    for (let i = this.rings.length - 1; i >= 0; i--) {
      const r = this.rings[i];
      r.age += dt;
      const s = 0.5 + r.speed * r.age;
      r.mesh.scale.setScalar(s);
      (r.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 1 - r.age / r.maxAge);
      if (r.age >= r.maxAge) {
        r.mesh.visible = false;
        this.rings.splice(i, 1);
        if (this.ringPool.length < 6) this.ringPool.push(r.mesh);
      }
    }
  }

  get particleActive(): number {
    return this.impacts.activeCount;
  }
}

const tmpPos = new THREE.Vector3();
