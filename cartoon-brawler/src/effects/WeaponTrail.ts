/** WeaponTrail: ribbon mesh following the weapon tip while attacks are active. Pooled. */
import * as THREE from 'three';
import { ObjectPool } from './ParticlePool';

const SEGMENTS = 12;

class Ribbon {
  onAcquire(): void { /* reset happens via begin() */ }
  onRelease(): void { this.mesh.visible = false; }
  mesh: THREE.Mesh;
  points: THREE.Vector3[] = [];
  private positions: Float32Array;
  private geometry: THREE.BufferGeometry;

  constructor(material: THREE.Material) {
    this.geometry = new THREE.BufferGeometry();
    this.positions = new Float32Array(SEGMENTS * 2 * 3);
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    const idx: number[] = [];
    for (let i = 0; i < SEGMENTS - 1; i++) {
      const a = i * 2;
      idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
    this.geometry.setIndex(idx);
    this.mesh = new THREE.Mesh(this.geometry, material);
    this.mesh.frustumCulled = false;
    this.mesh.visible = false;
    for (let i = 0; i < SEGMENTS; i++) this.points.push(new THREE.Vector3());
  }

  reset(tip: THREE.Vector3): void {
    for (const p of this.points) p.copy(tip);
  }

  push(tip: THREE.Vector3): void {
    // shift points (ring rotation — no per-frame allocation)
    const last = this.points.shift()!;
    last.copy(tip);
    this.points.push(last);
    // build ribbon: each point expanded along camera-ish axis (use Y for simplicity + width)
    let w = 0.26;
    for (let i = 0; i < SEGMENTS; i++) {
      const p = this.points[i];
      const fade = 1 - i / SEGMENTS;
      const hw = w * fade;
      this.positions[i * 6 + 0] = p.x - hw;
      this.positions[i * 6 + 1] = p.y + hw * 0.5;
      this.positions[i * 6 + 2] = p.z;
      this.positions[i * 6 + 3] = p.x + hw;
      this.positions[i * 6 + 4] = p.y - hw * 0.5;
      this.positions[i * 6 + 5] = p.z;
    }
    (this.geometry.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;
  }

  setVisible(v: boolean): void {
    this.mesh.visible = v;
  }
}

export class WeaponTrail {
  private pool: ObjectPool<Ribbon>;
  active: Ribbon | null = null;

  constructor(scene: THREE.Scene) {
    const mat = new THREE.MeshBasicMaterial({
      color: 0xbfe8ff, transparent: true, opacity: 0.55, side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    this.pool = new ObjectPool<Ribbon>(() => {
      const r = new Ribbon(mat);
      scene.add(r.mesh);
      return r;
    }, 2);
  }

  begin(tip: THREE.Vector3): void {
    if (this.active) return;
    this.active = this.pool.acquire();
    this.active.reset(tip);
    this.active.setVisible(true);
  }

  update(tip: THREE.Vector3): void {
    this.active?.push(tip);
  }

  end(): void {
    if (!this.active) return;
    this.active.setVisible(false);
    this.pool.release(this.active);
    this.active = null;
  }
}
