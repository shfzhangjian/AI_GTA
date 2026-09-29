/**
 * 粒子效果（阶段 2）：上升气泡 + 漂浮尘埃颗粒。
 * 使用 THREE.Points + 单张粒子贴图（Kenney CC0 bubble），对象式 CPU 更新。
 * 数量克制（气泡 60 / 尘埃 120），后续阶段 23 统一性能优化。
 */
import * as THREE from 'three';
import type { Engine } from '../core/engine';
import type { Terrain } from './Terrain';
import { setDebug } from '../core/debug';

const BUBBLE_COUNT = 60;
const MOTE_COUNT = 120;
const BOTTOM_BUBBLE_MAX = 48;

interface ParticleField {
  points: THREE.Points;
  vel: Float32Array; // 每粒子速度 (x,y) 交错
}

interface BottomBubble {
  sprite: THREE.Sprite;
  active: boolean;
  life: number;
  maxLife: number;
  radius: number;
  velX: number;
  velY: number;
  terminalY: number;
  drift: number;
  phase: number;
}

export interface AmbientParticles {
  update(dt: number, camX: number, camY: number, halfW: number, halfH: number): void;
}

function loadTexture(url: string, onReady: (t: THREE.Texture) => void): void {
  new THREE.TextureLoader().load(
    url,
    (t) => {
      t.magFilter = THREE.NearestFilter;
      onReady(t);
    },
    undefined,
    () => console.warn(`[particles] texture load failed: ${url}`),
  );
}

export function createAmbientParticles(engine: Engine, terrain: Terrain): AmbientParticles {
  let ready = false;
  let bubbleTex: THREE.Texture | null = null;
  let bottomSpawnTimer = 0.25;

  function makeField(count: number, size: number, color: number, opacity: number, texUrl: string): ParticleField {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 2);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 2000;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 2000;
      pos[i * 3 + 2] = 0;
      vel[i * 2] = (Math.random() - 0.5) * 6;
      vel[i * 2 + 1] = Math.random() * 20 + 8;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      size,
      color,
      transparent: true,
      opacity,
      depthWrite: false,
      sizeAttenuation: false,
    });
    const points = new THREE.Points(geo, mat);
    points.frustumCulled = false;
    loadTexture(texUrl, (t) => {
      mat.map = t;
      mat.needsUpdate = true;
      ready = true;
    });
    engine.layers.effect.add(points);
    return { points, vel };
  }

  const bubbles = makeField(BUBBLE_COUNT, 10, 0xbfeaff, 0.85, '/assets/effects/bubble_a.png');
  const motes = makeField(MOTE_COUNT, 3, 0x9fc8e8, 0.35, '/assets/effects/bubble_b.png');
  bubbles.points.position.z = -1;
  motes.points.position.z = -2;

  loadTexture('/assets/effects/bubble_a.png', (t) => {
    bubbleTex = t;
  });

  const bottomBubbles: BottomBubble[] = [];
  function makeBottomBubble(): BottomBubble {
    const mat = new THREE.SpriteMaterial({
      map: bubbleTex ?? undefined,
      color: 0xd8fbff,
      transparent: true,
      opacity: 0,
      depthTest: false,
      depthWrite: false,
    });
    const sprite = new THREE.Sprite(mat);
    sprite.visible = false;
    sprite.renderOrder = 8;
    engine.layers.effect.add(sprite);
    return {
      sprite,
      active: false,
      life: 0,
      maxLife: 1,
      radius: 8,
      velX: 0,
      velY: 0,
      terminalY: 54,
      drift: 8,
      phase: 0,
    };
  }

  function spawnBottomBubble(camX: number, camY: number, halfW: number, halfH: number, sourceX?: number): void {
    const item = bottomBubbles.find((b) => !b.active) ?? (bottomBubbles.length < BOTTOM_BUBBLE_MAX ? makeBottomBubble() : null);
    if (!item) return;
    if (!bottomBubbles.includes(item)) bottomBubbles.push(item);

    const x = sourceX ?? camX + (Math.random() - 0.5) * halfW * 1.85;
    const bottomY = terrain.groundYAt(x) + 20 + Math.random() * 34;
    const viewBottomY = camY - halfH + 18;
    const y = Math.max(viewBottomY, Math.min(-22, bottomY));
    const radius = 7 + Math.random() * 11;
    const life = 4.2 + Math.random() * 2.8;
    item.active = true;
    item.life = life;
    item.maxLife = life;
    item.radius = radius;
    item.velX = (Math.random() - 0.5) * 3;
    item.velY = 8 + Math.random() * 10;
    item.terminalY = 34 + Math.sqrt(radius) * 16 + Math.random() * 10;
    item.drift = 7 + radius * 0.55 + Math.random() * 8;
    item.phase = Math.random() * Math.PI * 2;
    item.sprite.position.set(x, y, 0);
    item.sprite.scale.setScalar(radius * 1.65);
    item.sprite.visible = true;
    const mat = item.sprite.material as THREE.SpriteMaterial;
    if (bubbleTex && mat.map !== bubbleTex) {
      mat.map = bubbleTex;
      mat.needsUpdate = true;
    }
    mat.opacity = 0;
  }

  function stepBottomBubbles(dt: number, camX: number, camY: number, halfW: number, halfH: number): void {
    bottomSpawnTimer -= dt;
    if (bottomSpawnTimer <= 0) {
      bottomSpawnTimer = 0.22 + Math.random() * 0.48;
      const sourceX = camX + (Math.random() - 0.5) * halfW * 1.85;
      const cluster = 1 + Math.floor(Math.random() * 3);
      for (let i = 0; i < cluster; i++) {
        spawnBottomBubble(camX, camY, halfW, halfH, sourceX + (Math.random() - 0.5) * 24);
      }
    }

    const topY = Math.min(-8, camY + halfH + 16);
    const sidePad = halfW + 80;
    for (const b of bottomBubbles) {
      if (!b.active) continue;
      b.life -= dt;
      const age = 1 - b.life / b.maxLife;
      const depthM = Math.max(0, -b.sprite.position.y) / 10;
      const pressureExpansion = 1 + THREE.MathUtils.clamp((26 - depthM) / 26, 0, 1) * 0.34;
      const buoyancy = 20 + b.radius * 2.6;
      b.velY += buoyancy * dt;
      b.velY += (b.terminalY - b.velY) * Math.min(1, dt * 1.8);
      b.velX += Math.sin(age * 10 + b.phase) * b.drift * dt;
      b.velX *= Math.exp(-1.8 * dt);
      b.sprite.position.x += b.velX * dt;
      b.sprite.position.y += b.velY * dt;
      const wobble = 1 + Math.sin(age * 18 + b.phase) * 0.08;
      const size = b.radius * 1.65 * pressureExpansion * (1 + age * 0.18);
      b.sprite.scale.set(size * wobble, size * (1.08 - (wobble - 1) * 0.45), 1);
      const fadeIn = THREE.MathUtils.smoothstep(age, 0, 0.16);
      const fadeOut = 1 - THREE.MathUtils.smoothstep(age, 0.7, 1);
      (b.sprite.material as THREE.SpriteMaterial).opacity = 0.82 * fadeIn * fadeOut;
      const outsideX = b.sprite.position.x < camX - sidePad || b.sprite.position.x > camX + sidePad;
      if (b.life <= 0 || b.sprite.position.y > topY || outsideX) {
        b.active = false;
        b.sprite.visible = false;
      }
    }
  }

  function step(field: ParticleField, dt: number, camX: number, camY: number, halfW: number, halfH: number, upward: boolean): void {
    const attr = field.points.geometry.getAttribute('position') as THREE.BufferAttribute;
    const arr = attr.array as Float32Array;
    const n = attr.count;
    // 粒子坐标是 layer 局部；相机在层局部中的位置 = camPos - layerPos（layer 未平移，则等于相机）
    const lx = camX - field.points.parent!.position.x;
    const ly = camY - field.points.parent!.position.y;
    for (let i = 0; i < n; i++) {
      let x = arr[i * 3];
      let y = arr[i * 3 + 1];
      x += field.vel[i * 2] * dt + Math.sin(y * 0.02 + i) * 4 * dt;
      y += (upward ? field.vel[i * 2 + 1] : -Math.abs(field.vel[i * 2 + 1]) * 0.15) * dt;
      // 环绕：离开视野四周回收
      if (upward && y > ly + halfH + 20) y = ly - halfH - 20;
      if (!upward && y < ly - halfH - 20) y = ly + halfH + 20;
      if (x > lx + halfW + 20) x = lx - halfW - 20;
      if (x < lx - halfW - 20) x = lx + halfW + 20;
      arr[i * 3] = x;
      arr[i * 3 + 1] = y;
    }
    attr.needsUpdate = true;
  }

  return {
    update(dt, camX, camY, halfW, halfH) {
      if (!ready) return;
      step(bubbles, dt, camX, camY, halfW, halfH, true);
      step(motes, dt, camX, camY, halfW, halfH, false);
      stepBottomBubbles(dt, camX, camY, halfW, halfH);
      setDebug({ bubbleCount: BUBBLE_COUNT + bottomBubbles.filter((b) => b.active).length, moteCount: MOTE_COUNT });
    },
  };
}
