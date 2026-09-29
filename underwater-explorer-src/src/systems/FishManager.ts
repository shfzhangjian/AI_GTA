/**
 * 鱼群管理器（阶段 5）：FishManager + FishSpawner + FishBehavior 三合一职责清晰拆分。
 *
 * FishSpawner：按深度带在视野边缘生成；rarity 权重抽取；深度用「鱼的 y」换算，
 *   相机与海床间随机 y 并夹在该鱼 depthMin/Max 内。
 * FishBehavior：cruise / school / flee 模板。flee：玩家进入 220u 半径 → 加速逃离 3s。
 * FishManager：精灵池复用、深度/距离回收（cull）、重叠抑制（生成间距检查）。
 */
import * as THREE from 'three';
import type { Engine } from '../core/engine';
import type { Terrain } from '../world/Terrain';
import { UNITS_PER_METER } from '../world/Terrain';
import { fishAtDepth, type FishDef } from '../data/fish';
import { createFish, type FishEntity } from '../entities/FishEntity';
import type { Diver } from '../entities/Diver';
import { setDebug, reportError } from '../core/debug';

const SPAWN_INTERVAL = 0.6; // s（世界鱼量密度需要；回收由距离保证上限）
const DESPAWN_DIST = 1400; // 距相机远于此回收
const FLEE_RADIUS = 220;
const FLEE_BOOST = 2.1;
const FLEE_TIME = 3.0;
const COLLISION_FLEE_TIME = 0.85;
const COLLISION_FLEE_BOOST = 3.15;
const MIN_SPAWN_GAP = 46; // 重叠抑制：新生成鱼与其他鱼最小间距
const MAX_FISH = 40;
const DIVER_HIT_HALF_W = 18;
const DIVER_HIT_HALF_H = 34;
const FISH_ATTACK_RECOIL = 92;

interface Visual {
  fish: FishEntity;
  sprite: THREE.Sprite;
  rightMap: THREE.Texture;
  leftMap: THREE.Texture;
}

function mulberry(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface FishManager {
  fishAt(index: number): FishEntity | undefined;
  getAliveCount(): number;
  readonly fishes: ReadonlyArray<FishEntity>;
}

export function createFishManager(engine: Engine, terrain: Terrain, diver: Diver): FishManager {
  const rand = mulberry(90210);
  const group = engine.layers.entity;
  const visuals: Visual[] = [];
  const spritePool: THREE.Sprite[] = [];
  const texCache = new Map<string, Promise<{ right: THREE.Texture; left: THREE.Texture }>>();
  const fishes: FishEntity[] = [];
  let spawnTimer = 0.5;
  let attackCount = 0;

  function flipTexture(base: THREE.Texture): THREE.Texture {
    const t = base.clone();
    t.repeat.set(-1, 1);
    t.offset.set(1, 0);
    t.needsUpdate = true;
    return t;
  }

  function getTex(url: string): Promise<{ right: THREE.Texture; left: THREE.Texture }> {
    let p = texCache.get(url);
    if (!p) {
      p = new Promise((res, rej) => {
        new THREE.TextureLoader().load(
          url,
          (t) => {
            t.magFilter = THREE.NearestFilter;
            t.minFilter = THREE.LinearMipmapLinearFilter;
            res({ right: t, left: flipTexture(t) });
          },
          undefined,
          rej,
        );
      });
      texCache.set(url, p);
    }
    return p;
  }

  /** rarity 权重 + 深度过滤抽取 */
  function pickDef(depthM: number): FishDef | null {
    const pool = fishAtDepth(depthM);
    if (!pool.length) return null;
    const total = pool.reduce((s, f) => s + f.rarity, 0);
    let r = rand() * total;
    for (const f of pool) {
      r -= f.rarity;
      if (r <= 0) return f;
    }
    return pool[pool.length - 1];
  }

  function overlapsAny(x: number, y: number): boolean {
    for (const f of fishes) {
      const dx = f.pos.x - x;
      const dy = f.pos.y - y;
      if (dx * dx + dy * dy < MIN_SPAWN_GAP * MIN_SPAWN_GAP) return true;
    }
    return false;
  }

  function makeVisual(fish: FishEntity): void {
    getTex(fish.def.sprite).then(
      (tex) => {
        if (!fish.alive) return;
        const sp =
          spritePool.pop() ??
          new THREE.Sprite(new THREE.SpriteMaterial({ depthTest: false, depthWrite: false, transparent: true }));
        const mat = sp.material as THREE.SpriteMaterial;
        mat.depthTest = false;
        mat.depthWrite = false;
        mat.map = fish.facing === 1 ? tex.right : tex.left;
        mat.color.set(fish.def.tint ?? '#ffffff');
        mat.opacity = 1;
        mat.needsUpdate = true;
        const s = fish.def.scale * 32;
        sp.scale.set(s, s * (tex.right.image as HTMLImageElement).height / (tex.right.image as HTMLImageElement).width, 1);
        sp.visible = true;
        sp.renderOrder = 18;
        group.add(sp);
        visuals.push({ fish, sprite: sp, rightMap: tex.right, leftMap: tex.left });
      },
      (err) => reportError('fish.tex ' + fish.def.id, err),
    );
  }

  function spawn(camX: number, camY: number): void {
    if (fishes.length >= MAX_FISH) return;
    const side = rand() > 0.5 ? 1 : -1;
    const x = camX + side * (420 + rand() * 300);
    if (Math.abs(x) > 1500) return;
    const groundY = terrain.groundYAt(x);
    // 深度带：相机深度 ±120u 内取 y，夹在水面~海床之间
    let y = camY + (rand() - 0.5) * 400;
    y = Math.min(-20, Math.max(groundY + 30, y));
    const depthM = Math.max(0, -y) / UNITS_PER_METER;
    const def = pickDef(depthM);
    if (!def) return;
    if (overlapsAny(x, y)) return;
    const fish = createFish(def, x, y);
    fishes.push(fish);
    makeVisual(fish);

    // school：追加成员跟随首条
    if (def.behavior === 'school' && def.schoolSize) {
      for (let i = 1; i < def.schoolSize; i++) {
        const ox = x + (rand() - 0.5) * 120 - side * i * 26;
        const oy = y + (rand() - 0.5) * 60;
        if (overlapsAny(ox, oy)) continue;
        const m = createFish(def, ox, oy);
        m.leader = fish;
        m.schoolOffset = new THREE.Vector2(ox - x, oy - y);
        fishes.push(m);
        makeVisual(m);
      }
    }
  }

  // ── 行为模板（按 behavior 分派，全类型共用一条 tick）──
  function behaviorCruise(f: FishEntity, dt: number): void {
    f.timer -= dt;
    if (f.timer <= 0) {
      f.timer = 2 + rand() * 3;
      f.wander = (rand() - 0.5) * 0.9; // 轻微变向
      if (rand() < 0.18) f.vel.x = -f.vel.x; // 偶发回头
    }
    const sp = f.def.speed;
    f.vel.x = THREE.MathUtils.clamp(f.vel.x + Math.sign(f.vel.x) * 30 * dt, -sp, sp);
    f.vel.y = Math.sin(f.pos.x * 0.01 + f.wander) * sp * 0.25;
  }

  function behaviorSchool(f: FishEntity, _dt: number): void {
    if (!f.leader || !f.leader.alive) {
      // 掉队→独立巡游
      behaviorCruise(f, _dt);
      return;
    }
    const tx = f.leader.pos.x + (f.schoolOffset?.x ?? 0);
    const ty = f.leader.pos.y + (f.schoolOffset?.y ?? 0);
    f.vel.x = (tx - f.pos.x) * 3.2;
    f.vel.y = (ty - f.pos.y) * 3.2;
  }

  /**
   * charge：危险鱼索敌冲撞（阶段 6 基础版）。
   * 进入 aggroRadius → 朝玩家加速冲刺（速度上限 speed*1.6），持续 chaseTime 后冷却。
   * 阶段 11 鲨鱼 AI（前摇/咬击判定/退避）会在此基础上精修。
   */
  function behaviorCharge(f: FishEntity, dt: number, diver: THREE.Vector2): void {
    const radius = f.def.aggroRadius ?? 300;
    const dx = diver.x - f.pos.x;
    const dy = diver.y - f.pos.y;
    const d2 = dx * dx + dy * dy;
    if (f.state === 'active' && d2 < radius * radius) {
      f.state = 'fleeing' as 'fleeing'; // 复用状态枚举表达「冲撞中」
      f.timer = 2.6;
    }
    if (f.state === 'fleeing') {
      f.timer -= dt;
      if (f.timer <= 0) f.state = 'active';
      const d = Math.sqrt(d2) || 1;
      const sp = f.def.speed * 1.6;
      f.vel.x += ((dx / d) * sp - f.vel.x) * Math.min(1, dt * 2.4);
      f.vel.y += ((dy / d) * sp * 0.8 - f.vel.y) * Math.min(1, dt * 2.4);
    } else {
      behaviorCruise(f, dt);
    }
  }

  function behaviorFlee(f: FishEntity, dt: number, diver: THREE.Vector2): void {
    const dx = f.pos.x - diver.x;
    const dy = f.pos.y - diver.y;
    const d2 = dx * dx + dy * dy;
    if (f.state === 'active' && d2 < FLEE_RADIUS * FLEE_RADIUS) {
      f.state = 'fleeing';
      f.timer = FLEE_TIME;
    }
    if (f.state === 'fleeing') {
      f.timer -= dt;
      if (f.timer <= 0) {
        f.state = 'active';
        f.panicDir = null;
      }
      const d = Math.sqrt(d2) || 1;
      const panic = f.panicDir;
      const dirX = panic?.x ?? dx / d;
      const dirY = panic?.y ?? dy / d;
      const sp = f.def.speed * (panic ? COLLISION_FLEE_BOOST : FLEE_BOOST);
      f.vel.x = dirX * sp;
      f.vel.y = dirY * sp * 0.78;
    } else {
      behaviorCruise(f, dt);
    }
  }

  function attackDamage(f: FishEntity): number {
    if (f.def.category === 'boss') return Math.round(26 + f.def.scale * 8);
    if (f.def.aggressive) return Math.round(13 + f.def.scale * 6);
    return Math.round(4 + f.def.scale * 2);
  }

  function attackCooldown(f: FishEntity): number {
    if (f.def.category === 'boss') return 1.35;
    return f.def.aggressive ? 1.05 : 2.15;
  }

  function collideWithDiver(f: FishEntity): void {
    if (f.state === 'dead') return;
    const dx = diver.pos.x - f.pos.x;
    const dy = diver.pos.y + 3 - f.pos.y;
    const fishHalfW = Math.max(12, f.def.scale * 22);
    const fishHalfH = Math.max(8, f.def.scale * 13);
    const overlapX = DIVER_HIT_HALF_W + fishHalfW - Math.abs(dx);
    const overlapY = DIVER_HIT_HALF_H + fishHalfH - Math.abs(dy);
    if (overlapX <= 0 || overlapY <= 0) return;

    const d = Math.sqrt(dx * dx + dy * dy) || 1;
    const nx = dx / d;
    const ny = dy / d;
    if (overlapX < overlapY) {
      f.pos.x -= Math.sign(dx || f.vel.x || 1) * (overlapX + 2);
    } else {
      f.pos.y -= Math.sign(dy || f.vel.y || 1) * (overlapY + 2);
    }
    f.vel.x -= nx * (f.def.aggressive ? 96 : 132);
    f.vel.y -= ny * (f.def.aggressive ? 46 : 68);
    if (!f.def.aggressive) {
      f.state = 'fleeing';
      f.timer = COLLISION_FLEE_TIME;
      f.leader = null;
      f.panicDir = new THREE.Vector2(-nx, -ny || 0.15).normalize();
      f.vel.set(f.panicDir.x * f.def.speed * COLLISION_FLEE_BOOST, f.panicDir.y * f.def.speed * COLLISION_FLEE_BOOST * 0.78);
      return;
    }
    if (f.attackCooldown > 0) return;

    const impact = f.def.aggressive ? 142 : 74;
    const didHit = diver.takeDamage(attackDamage(f), nx * impact, ny * impact * 0.72);
    if (!didHit) return;

    attackCount++;
    f.attackCooldown = attackCooldown(f);
    f.vel.x -= nx * FISH_ATTACK_RECOIL;
    f.vel.y -= ny * FISH_ATTACK_RECOIL * 0.5;
    if (f.def.aggressive) {
      f.state = 'active';
      f.timer = 0.55;
    }
  }

  engine.addUpdate((dt) => {
    const cam = engine.camera;
    spawnTimer -= dt;
    if (spawnTimer <= 0) {
      spawnTimer = SPAWN_INTERVAL;
      spawn(cam.position.x, cam.position.y);
    }

    let alive = 0;
    let threats = 0;
    const toRemove: number[] = [];
    for (let i = 0; i < fishes.length; i++) {
      const f = fishes[i];
      if (!f.alive) { toRemove.push(i); continue; }
      f.attackCooldown = Math.max(0, f.attackCooldown - dt);

      if (f.state === 'dead') {
        f.timer -= dt;
        f.vel.multiplyScalar(Math.exp(-3.4 * dt));
        f.vel.y += 22 * dt;
        if (f.timer <= 0) {
          f.alive = false;
          toRemove.push(i);
          continue;
        }
      } else {
        switch (f.def.behavior) {
          case 'school': behaviorSchool(f, dt); break;
          case 'flee': behaviorFlee(f, dt, diver.pos); break;
          case 'charge': behaviorCharge(f, dt, diver.pos); break;
          default: behaviorCruise(f, dt);
        }
      }

      f.pos.x += f.vel.x * dt;
      f.pos.y += f.vel.y * dt;

      // 边界：海床/水面/世界
      const ground = terrain.groundYAt(f.pos.x) + 24;
      if (f.pos.y < ground) { f.pos.y = ground; f.vel.y = Math.abs(f.vel.y); }
      if (f.pos.y > -14) { f.pos.y = -14; f.vel.y = -Math.abs(f.vel.y); }
      if (f.pos.x > 1520 || f.pos.x < -1520) f.vel.x = -f.vel.x;

      if (Math.abs(f.vel.x) > 6) f.facing = f.vel.x > 0 ? 1 : -1;
      if (f.def.aggressive) {
        const radius = f.def.aggroRadius ?? 300;
        const tx = f.pos.x - diver.pos.x;
        const ty = f.pos.y - diver.pos.y;
        if (tx * tx + ty * ty < radius * radius) threats++;
      }
      collideWithDiver(f);

      // 距离回收
      const cdx = f.pos.x - cam.position.x;
      const cdy = f.pos.y - cam.position.y;
      if (cdx * cdx + cdy * cdy > DESPAWN_DIST * DESPAWN_DIST) {
        f.alive = false;
        toRemove.push(i);
        continue;
      }
      alive++;
    }

    // 回收（倒序删除保持索引）
    for (let k = toRemove.length - 1; k >= 0; k--) {
      const idx = toRemove[k];
      const f = fishes[idx];
      void f; // 群员 leader 引用失效由 behaviorSchool 的 alive 判定处理
      fishes.splice(idx, 1);
      const vi = visuals.findIndex((v) => v.fish === f);
      if (vi >= 0) {
        const v = visuals[vi];
        group.remove(v.sprite);
        v.sprite.visible = false;
        if (spritePool.length < 80) spritePool.push(v.sprite);
        visuals.splice(vi, 1);
      }
    }

    // 同步精灵
    for (const v of visuals) {
      if (!v.fish.alive) continue;
      v.sprite.position.copy(v.fish.pos);
      const base = v.fish.def.scale * 32;
      const mat = v.sprite.material as THREE.SpriteMaterial;
      mat.map = v.fish.facing === 1 ? v.rightMap : v.leftMap;
      mat.opacity = v.fish.state === 'dead' ? THREE.MathUtils.clamp(v.fish.timer / 0.42, 0, 1) : 1;
      const aspect = (mat.map.image as HTMLImageElement).height / (mat.map.image as HTMLImageElement).width;
      v.sprite.scale.set(base, base * aspect, 1);
    }

    setDebug({
      fishAlive: alive,
      fishTextures: texCache.size,
      fishSprites: visuals.length,
      fishThreats: threats,
      fishAttacks: attackCount,
    });
  });

  return {
    fishAt(i) {
      return fishes[i];
    },
    getAliveCount() {
      return fishes.length;
    },
    get fishes() {
      return fishes;
    },
  };
}
