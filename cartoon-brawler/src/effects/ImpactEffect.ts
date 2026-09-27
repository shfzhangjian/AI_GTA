/** ImpactEffect + pooled particle bursts. Everything is instanced-per-pool, zero allocs per hit. */
import * as THREE from 'three';
import { ObjectPool } from './ParticlePool';

interface BurstParticle {
  sprite: THREE.Mesh;
  vel: THREE.Vector3;
  life: number;
  maxLife: number;
  active: boolean;
}

interface Burst extends PoolItem {
  group: THREE.Group;
  particles: BurstParticle[];
  age: number;
  duration: number;
}
interface PoolItem { onAcquire?: () => void; onRelease?: () => void }

const PARTICLE_GEO = new THREE.BoxGeometry(0.12, 0.12, 0.12);

function makeBurst(scene: THREE.Scene): Burst {
  const group = new THREE.Group();
  group.visible = false;
  scene.add(group);
  const particles: BurstParticle[] = [];
  for (let i = 0; i < 10; i++) {
    const mat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const sprite = new THREE.Mesh(PARTICLE_GEO, mat);
    group.add(sprite);
    particles.push({ sprite, vel: new THREE.Vector3(), life: 0, maxLife: 1, active: false });
  }
  return {
    group, particles, age: 0, duration: 0.5,
    onRelease: () => { group.visible = false; },
  };
}

export interface BurstOptions {
  color: number;
  count?: number;
  speed?: number;
  size?: number;
  duration?: number;
  gravity?: number;
  ring?: boolean;
}

export class ImpactEffect {
  private pool: ObjectPool<Burst>;
  private live: Burst[] = [];

  constructor(scene: THREE.Scene) {
    this.pool = new ObjectPool<Burst>(() => makeBurst(scene), 8);
  }

  burst(pos: THREE.Vector3, opts: BurstOptions): void {
    const b = this.pool.acquire();
    const count = Math.min(opts.count ?? 8, b.particles.length);
    const speed = opts.speed ?? 5;
    b.group.position.copy(pos);
    b.group.visible = true;
    b.age = 0;
    b.duration = opts.duration ?? 0.45;
    let i = 0;
    for (; i < count; i++) {
      const p = b.particles[i];
      p.active = true;
      p.sprite.visible = true;
      const a = Math.random() * Math.PI * 2;
      const up = opts.ring ? 0.6 + Math.random() * 1.4 : Math.random() * 3.4;
      p.vel.set(Math.cos(a) * speed, up, Math.sin(a) * speed);
      p.life = b.duration * (0.7 + Math.random() * 0.5);
      p.maxLife = p.life;
      const s = opts.size ?? 1;
      p.sprite.scale.setScalar(s * (0.6 + Math.random() * 0.9));
      (p.sprite.material as THREE.MeshBasicMaterial).color.setHex(opts.color);
      p.sprite.position.set(0, 0, 0);
    }
    for (; i < b.particles.length; i++) {
      b.particles[i].active = false;
      b.particles[i].sprite.visible = false;
    }
    this.live.push(b);
  }

  update(dt: number): void {
    const gravity = -14;
    for (let i = this.live.length - 1; i >= 0; i--) {
      const b = this.live[i];
      b.age += dt;
      let anyAlive = false;
      for (const p of b.particles) {
        if (!p.active) continue;
        p.life -= dt;
        if (p.life <= 0) { p.active = false; p.sprite.visible = false; continue; }
        anyAlive = true;
        p.vel.y += gravity * dt;
        p.sprite.position.addScaledVector(p.vel, dt);
        const f = Math.max(0.05, p.life / p.maxLife);
        p.sprite.scale.multiplyScalar(Math.pow(f, dt * 3));
      }
      if (!anyAlive || b.age > b.duration + 1) {
        this.live.splice(i, 1);
        this.pool.release(b);
      }
    }
  }

  get activeCount(): number {
    return this.pool.activeCount;
  }
}
