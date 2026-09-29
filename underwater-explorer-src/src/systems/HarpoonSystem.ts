/**
 * 鱼叉捕鱼（阶段 7）：HarpoonSystem（发射/冷却/池）+ HarpoonProjectile（飞行/阻力/寿命）
 * + CollisionSystem（鱼叉-鱼 AABB，命中扣 hp、hp≤0 转 dead 掉入回收池）。
 * 第一版仅普通鱼叉（无升级）；伤害/击退数据驱动自 HARPOONS。
 * 素材：/assets/weapons/harpoon.png（CC0 原创，登记见 ASSET_LICENSES.md）。
 */
import * as THREE from 'three';
import type { Engine } from '../core/engine';
import type { MouseState } from '../core/mouse';
import type { FishManager } from '../systems/FishManager';
import type { Diver } from '../entities/Diver';
import { setDebug, reportError } from '../core/debug';

export interface HarpoonDef {
  id: string;
  damage: number;
  speed: number; // 初速 u/s
  drag: number; // 水阻衰减系数
  life: number; // s
  knockback: number;
}

export const HARPOONS: Record<string, HarpoonDef> = {
  basic: { id: 'basic', damage: 12, speed: 620, drag: 1.1, life: 1.7, knockback: 90 },
};
const HARPOON_ROTATION_OFFSET = Math.PI;
const HARPOON_HEIGHT = 12;
const HARPOON_LENGTH = HARPOON_HEIGHT * 4;
const HARPOON_HAND_FORWARD = 22;
const HARPOON_HAND_Y = 8;
const HARPOON_TIP_INSET = 4;
const CHARGE_MIN = 0.15;
const CHARGE_MAX = 1.15;
const FIRE_COOLDOWN = 0.85;
const AIM_RANGE = 380;
const AIM_SEGMENT_COUNT = 9;
const AIM_SEGMENT_LENGTH = 20;
const AIM_SEGMENT_THICKNESS = 2.2;

interface Projectile {
  sprite: THREE.Sprite;
  line: THREE.Line;
  def: HarpoonDef;
  vel: THREE.Vector2;
  dir: THREE.Vector2;
  damage: number;
  knockback: number;
  life: number;
  active: boolean;
}

interface HitFx {
  ring: THREE.Mesh;
  spark: THREE.Mesh;
  life: number;
  active: boolean;
}

export interface HarpoonSystem {
  readonly projectiles: ReadonlyArray<Projectile>;
  /** 测试钩子：从玩家位置朝目标点发射 */
  fireTo(tx: number, ty: number): boolean;
  getActiveCount(): number;
  getStats(): { fired: number; hits: number; kills: number };
}

export function createHarpoonSystem(
  engine: Engine,
  mouse: MouseState,
  diver: Diver,
  fishManager: FishManager,
): HarpoonSystem {
  const group = engine.layers.entity;
  const pool: Projectile[] = [];
  const hitFxPool: HitFx[] = [];
  let texPromise: Promise<THREE.Texture> | null = null;
  let cooldown = 0;
  let wasDown = false;
  let charging = false;
  let charge = 0;
  const stats = { fired: 0, hits: 0, kills: 0 };

  const aimGeo = new THREE.BufferGeometry();
  aimGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
  const aimLineMat = new THREE.LineBasicMaterial({
    color: 0x8ff4ff,
    transparent: true,
    opacity: 0.18,
    depthTest: false,
    depthWrite: false,
  });
  const aimLine = new THREE.Line(
    aimGeo,
    aimLineMat,
  );
  aimLine.renderOrder = 32;
  aimLine.visible = false;
  group.add(aimLine);

  const aimSegments = Array.from({ length: AIM_SEGMENT_COUNT }, (_, i) => {
    const mat = new THREE.MeshBasicMaterial({
      color: 0x8ff4ff,
      transparent: true,
      opacity: 0,
      depthTest: false,
      depthWrite: false,
    });
    const seg = new THREE.Mesh(new THREE.PlaneGeometry(1, AIM_SEGMENT_THICKNESS), mat);
    seg.renderOrder = 33;
    seg.visible = false;
    group.add(seg);
    return { mesh: seg, material: mat, index: i };
  });

  const originGlowMat = new THREE.MeshBasicMaterial({
    color: 0x8ff4ff,
    transparent: true,
    opacity: 0,
    depthTest: false,
    depthWrite: false,
  });
  const originGlow = new THREE.Mesh(new THREE.RingGeometry(7, 11, 24), originGlowMat);
  originGlow.renderOrder = 35;
  originGlow.visible = false;
  group.add(originGlow);

  const reticleMat = new THREE.MeshBasicMaterial({
    color: 0xdefcff,
    transparent: true,
    opacity: 0.72,
    depthTest: false,
    depthWrite: false,
  });
  const reticle = new THREE.Mesh(
    new THREE.RingGeometry(9, 12, 24),
    reticleMat,
  );
  reticle.renderOrder = 33;
  reticle.visible = false;
  group.add(reticle);

  const reticlePulseMat = new THREE.MeshBasicMaterial({
    color: 0xdefcff,
    transparent: true,
    opacity: 0,
    depthTest: false,
    depthWrite: false,
  });
  const reticlePulse = new THREE.Mesh(new THREE.RingGeometry(14, 16, 28), reticlePulseMat);
  reticlePulse.renderOrder = 32;
  reticlePulse.visible = false;
  group.add(reticlePulse);

  const crosshairMat = new THREE.MeshBasicMaterial({
    color: 0xdefcff,
    transparent: true,
    opacity: 0.82,
    depthTest: false,
    depthWrite: false,
  });
  const crosshairH = new THREE.Mesh(new THREE.PlaneGeometry(24, 2), crosshairMat);
  const crosshairV = new THREE.Mesh(new THREE.PlaneGeometry(2, 24), crosshairMat);
  crosshairH.renderOrder = 34;
  crosshairV.renderOrder = 34;
  crosshairH.visible = false;
  crosshairV.visible = false;
  group.add(crosshairH, crosshairV);

  const chargeBack = new THREE.Mesh(
    new THREE.PlaneGeometry(46, 4),
    new THREE.MeshBasicMaterial({ color: 0x0b3143, transparent: true, opacity: 0.78, depthTest: false, depthWrite: false }),
  );
  chargeBack.renderOrder = 33;
  chargeBack.visible = false;
  group.add(chargeBack);

  const chargeFill = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 4),
    new THREE.MeshBasicMaterial({ color: 0x7fffe7, transparent: true, opacity: 0.92, depthTest: false, depthWrite: false }),
  );
  chargeFill.renderOrder = 34;
  chargeFill.visible = false;
  group.add(chargeFill);

  function createHitFx(): HitFx {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(7, 11, 24),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthTest: false, depthWrite: false }),
    );
    ring.renderOrder = 40;
    ring.visible = false;
    group.add(ring);

    const spark = new THREE.Mesh(
      new THREE.CircleGeometry(5, 16),
      new THREE.MeshBasicMaterial({ color: 0x7fffe7, transparent: true, opacity: 0, depthTest: false, depthWrite: false }),
    );
    spark.renderOrder = 41;
    spark.visible = false;
    group.add(spark);
    return { ring, spark, life: 0, active: false };
  }

  function spawnHitFx(x: number, y: number): void {
    const fx = hitFxPool.find((item) => !item.active) ?? createHitFx();
    if (!hitFxPool.includes(fx)) hitFxPool.push(fx);
    fx.active = true;
    fx.life = 0.28;
    fx.ring.position.set(x, y, 0);
    fx.spark.position.set(x, y, 0);
    fx.ring.scale.setScalar(0.45);
    fx.spark.scale.setScalar(1);
    fx.ring.visible = true;
    fx.spark.visible = true;
  }

  function getTex(): Promise<THREE.Texture> {
    if (!texPromise) {
      texPromise = new Promise((res, rej) => {
        new THREE.TextureLoader().load(
          '/assets/weapons/harpoon.png',
          (t) => {
            t.magFilter = THREE.NearestFilter;
            t.minFilter = THREE.LinearMipmapLinearFilter;
            res(t);
          },
          undefined,
          rej,
        );
      });
    }
    return texPromise;
  }
  void getTex();

  function setProjectileVisible(proj: Projectile, visible: boolean): void {
    proj.active = visible;
    proj.sprite.visible = visible;
    // 只保留蓄力瞄准线；发射后的长绳会像尾巴一样跟着潜水员，先隐藏掉。
    proj.line.visible = false;
  }

  function updateLine(proj: Projectile, originX: number, originY: number): void {
    const tailX = proj.sprite.position.x - proj.dir.x * (HARPOON_LENGTH / 2 - 3);
    const tailY = proj.sprite.position.y - proj.dir.y * (HARPOON_LENGTH / 2 - 3);
    const attr = proj.line.geometry.getAttribute('position') as THREE.BufferAttribute;
    const pos = attr.array as Float32Array;
    pos[0] = originX;
    pos[1] = originY;
    pos[2] = 0;
    pos[3] = tailX;
    pos[4] = tailY;
    pos[5] = 0;
    attr.needsUpdate = true;
  }

  function hideAim(): void {
    aimLine.visible = false;
    for (const seg of aimSegments) seg.mesh.visible = false;
    originGlow.visible = false;
    reticle.visible = false;
    reticlePulse.visible = false;
    crosshairH.visible = false;
    crosshairV.visible = false;
    chargeBack.visible = false;
    chargeFill.visible = false;
    diver.setAimPose(false, 1, 0, 0);
  }

  function aimState(tx: number, ty: number): { originX: number; originY: number; dirX: number; dirY: number; targetX: number; targetY: number } {
    const aimBaseY = diver.pos.y + HARPOON_HAND_Y;
    const dx = tx - diver.pos.x;
    const dy = ty - aimBaseY;
    const d = Math.sqrt(dx * dx + dy * dy) || 1;
    const dirX = dx / d;
    const dirY = dy / d;
    const originX = diver.pos.x + dirX * HARPOON_HAND_FORWARD;
    const originY = aimBaseY + dirY * 6;
    const range = Math.min(AIM_RANGE, Math.max(90, d));
    return { originX, originY, dirX, dirY, targetX: originX + dirX * range, targetY: originY + dirY * range };
  }

  function updateAimVisual(tx: number, ty: number, power: number, elapsed: number): void {
    const aim = aimState(tx, ty);
    const angle = Math.atan2(aim.dirY, aim.dirX);
    const range = Math.hypot(aim.targetX - aim.originX, aim.targetY - aim.originY);
    const aimColor = new THREE.Color(0x8ff4ff).lerp(new THREE.Color(0xffe47a), power);
    const attr = aimLine.geometry.getAttribute('position') as THREE.BufferAttribute;
    const pos = attr.array as Float32Array;
    pos[0] = aim.originX;
    pos[1] = aim.originY;
    pos[2] = 0;
    pos[3] = aim.targetX;
    pos[4] = aim.targetY;
    pos[5] = 0;
    attr.needsUpdate = true;
    aimLineMat.color.copy(aimColor);
    aimLineMat.opacity = 0.14 + power * 0.12;
    aimLine.visible = true;

    for (const seg of aimSegments) {
      const t = (seg.index + 0.8) / AIM_SEGMENT_COUNT;
      const wobble = Math.sin(elapsed * 12 - seg.index * 0.7) * 0.5 + 0.5;
      const dist = Math.min(range - 16, t * range);
      seg.mesh.position.set(aim.originX + aim.dirX * dist, aim.originY + aim.dirY * dist, 0);
      seg.mesh.rotation.z = angle;
      seg.mesh.scale.set(AIM_SEGMENT_LENGTH * (0.82 + power * 0.38), 1, 1);
      seg.material.color.copy(aimColor);
      seg.material.opacity = (0.18 + power * 0.42) * (1 - t * 0.45) * (0.76 + wobble * 0.24);
      seg.mesh.visible = dist > 22 && dist < range - 10;
    }

    originGlow.position.set(aim.originX, aim.originY, 0);
    originGlow.scale.setScalar(0.9 + power * 0.35 + Math.sin(elapsed * 15) * 0.04);
    originGlowMat.color.copy(aimColor);
    originGlowMat.opacity = 0.34 + power * 0.34;
    originGlow.visible = true;

    reticle.position.set(aim.targetX, aim.targetY, 0);
    reticle.scale.setScalar(0.85 + power * 0.32);
    reticle.rotation.z = -elapsed * (1.8 + power * 2.5);
    reticleMat.color.copy(aimColor);
    reticleMat.opacity = 0.62 + power * 0.26;
    reticle.visible = true;

    reticlePulse.position.set(aim.targetX, aim.targetY, 0);
    reticlePulse.scale.setScalar(0.9 + power * 0.7 + (Math.sin(elapsed * 9) * 0.5 + 0.5) * 0.24);
    reticlePulseMat.color.copy(aimColor);
    reticlePulseMat.opacity = 0.16 + power * 0.22;
    reticlePulse.visible = true;

    crosshairH.position.set(aim.targetX, aim.targetY, 0);
    crosshairV.position.set(aim.targetX, aim.targetY, 0);
    crosshairH.rotation.z = angle;
    crosshairV.rotation.z = angle;
    crosshairMat.color.copy(aimColor);
    crosshairMat.opacity = 0.5 + power * 0.38;
    crosshairH.visible = true;
    crosshairV.visible = true;

    chargeBack.position.set(aim.originX, aim.originY + 20, 0);
    chargeBack.visible = true;
    chargeFill.position.set(aim.originX - 23 + power * 23, aim.originY + 20, 0);
    chargeFill.scale.set(Math.max(1, 46 * power), 1, 1);
    (chargeFill.material as THREE.MeshBasicMaterial).color.copy(aimColor);
    chargeFill.visible = true;
    diver.setAimPose(true, aim.dirX, aim.dirY, power);
  }

  function spawn(tx: number, ty: number, power: number): void {
    const def = HARPOONS.basic;
    getTex().then(
      (tex) => {
        const p =
          pool.find((q) => !q.active) ??
          null;
        const img = tex.image as HTMLImageElement;
        const aspect = img.width / img.height;
        let proj: Projectile;
        if (p) {
          proj = p;
        } else {
          const mat = new THREE.SpriteMaterial({ map: tex, depthTest: false, depthWrite: false, transparent: true });
          const sp = new THREE.Sprite(mat);
          sp.renderOrder = 35;
          group.add(sp);
          const lineGeo = new THREE.BufferGeometry();
          lineGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
          const lineMat = new THREE.LineBasicMaterial({
            color: 0xc6eef7,
            transparent: true,
            opacity: 0.58,
            depthTest: false,
            depthWrite: false,
          });
          const line = new THREE.Line(lineGeo, lineMat);
          line.renderOrder = 34;
          line.visible = false;
          group.add(line);
          proj = {
            sprite: sp,
            line,
            def,
            vel: new THREE.Vector2(),
            dir: new THREE.Vector2(1, 0),
            damage: def.damage,
            knockback: def.knockback,
            life: 0,
            active: false,
          };
          pool.push(proj);
        }
        const mat = proj.sprite.material as THREE.SpriteMaterial;
        mat.map = tex;
        mat.depthTest = false;
        mat.depthWrite = false;
        proj.sprite.renderOrder = 35;
        const aim = aimState(tx, ty);
        proj.sprite.scale.set(HARPOON_LENGTH * (0.95 + power * 0.1), (HARPOON_LENGTH / aspect) * (0.95 + power * 0.1), 1);
        proj.dir.set(aim.dirX, aim.dirY);
        proj.vel.set(aim.dirX * def.speed * (0.78 + power * 0.38), aim.dirY * def.speed * (0.78 + power * 0.38));
        proj.damage = Math.round(def.damage * (0.7 + power * 0.65));
        proj.knockback = def.knockback * (0.65 + power * 0.55);
        proj.life = def.life * (0.7 + power * 0.28);
        setProjectileVisible(proj, true);
        proj.sprite.position.set(aim.originX + aim.dirX * (HARPOON_LENGTH / 2), aim.originY + aim.dirY * (HARPOON_LENGTH / 2), 0);
        // harpoon.png 默认朝左，旋转 180° 后沿发射方向指向目标。
        (proj.sprite.material as THREE.SpriteMaterial).rotation = Math.atan2(aim.dirY, aim.dirX) + HARPOON_ROTATION_OFFSET;
        updateLine(proj, aim.originX, aim.originY);
        stats.fired++;
      },
      (err) => reportError('harpoon.tex', err),
    );
  }

  engine.addUpdate((dt, elapsed) => {
    cooldown = Math.max(0, cooldown - dt);
    mouse.consumeLeftPress();

    const down = mouse.leftDown();
    const aimX = mouse.worldX(engine.camera);
    const aimY = mouse.worldY(engine.camera);
    if (down && !wasDown && cooldown <= 0) {
      charging = true;
      charge = 0;
    }
    if (down && charging) {
      charge = Math.min(CHARGE_MAX, charge + dt);
      updateAimVisual(aimX, aimY, charge / CHARGE_MAX, elapsed);
    }
    if (!down && wasDown && charging) {
      const power = Math.min(1, charge / CHARGE_MAX);
      hideAim();
      charging = false;
      if (charge >= CHARGE_MIN) {
        cooldown = FIRE_COOLDOWN;
        diver.triggerShootPose();
        spawn(aimX, aimY, power);
      }
    }
    if (!charging) hideAim();
    wasDown = down;

    // 飞行 + 阻力 + 碰撞
    for (const fx of hitFxPool) {
      if (!fx.active) continue;
      fx.life -= dt;
      const t = THREE.MathUtils.clamp(fx.life / 0.28, 0, 1);
      (fx.ring.material as THREE.MeshBasicMaterial).opacity = t * 0.9;
      (fx.spark.material as THREE.MeshBasicMaterial).opacity = t * 0.95;
      fx.ring.scale.setScalar(0.45 + (1 - t) * 1.35);
      fx.spark.scale.setScalar(0.75 + (1 - t) * 0.75);
      if (fx.life <= 0) {
        fx.active = false;
        fx.ring.visible = false;
        fx.spark.visible = false;
      }
    }

    const fishes = fishManager.fishes;
    let active = 0;
    for (const proj of pool) {
      if (!proj.active) continue;
      proj.life -= dt;
      if (proj.life <= 0) {
        setProjectileVisible(proj, false);
        continue;
      }
      // 水阻
      const drag = Math.exp(-proj.def.drag * dt);
      proj.vel.multiplyScalar(drag);
      proj.sprite.position.x += proj.vel.x * dt;
      proj.sprite.position.y += proj.vel.y * dt;
      const speed = proj.vel.length();
      if (speed > 1) proj.dir.set(proj.vel.x / speed, proj.vel.y / speed);
      (proj.sprite.material as THREE.SpriteMaterial).rotation = Math.atan2(proj.vel.y, proj.vel.x) + HARPOON_ROTATION_OFFSET;
      const originX = diver.pos.x + proj.dir.x * HARPOON_HAND_FORWARD;
      const originY = diver.pos.y + HARPOON_HAND_Y + proj.dir.y * 6;
      updateLine(proj, originX, originY);

      // CollisionSystem：用鱼叉尖端命中，避免整根鱼叉像大棍子一样判定。
      const tipX = proj.sprite.position.x + proj.dir.x * (HARPOON_LENGTH / 2 - HARPOON_TIP_INSET);
      const tipY = proj.sprite.position.y + proj.dir.y * (HARPOON_LENGTH / 2 - HARPOON_TIP_INSET);
      for (const f of fishes) {
        if (!f.alive || f.state === 'dead' || !proj.active) continue;
        const hw = f.def.scale * 26;
        const hh = f.def.scale * 18;
        const dxp = tipX - f.pos.x;
        const dyp = tipY - f.pos.y;
        if (Math.abs(dxp) < hw && Math.abs(dyp) < hh) {
          spawnHitFx(tipX, tipY);
          f.hp -= proj.damage;
          f.vel.x += Math.sign(proj.vel.x) * proj.knockback;
          f.vel.y += Math.sign(proj.vel.y) * proj.knockback * 0.4;
          stats.hits++;
          if (f.hp <= 0) {
            f.state = 'dead';
            f.timer = 0.42;
            stats.kills++;
          }
          setProjectileVisible(proj, false); // 命中即消耗
          break;
        }
      }
      if (proj.active) active++;
    }
    setDebug({ harpoonActive: active, harpoonFired: stats.fired, harpoonHits: stats.hits, harpoonKills: stats.kills });
  });

  return {
    get projectiles() {
      return pool;
    },
    fireTo(tx, ty) {
      if (cooldown > 0) return false;
      cooldown = FIRE_COOLDOWN;
      const aim = aimState(tx, ty);
      diver.setAimPose(true, aim.dirX, aim.dirY, 1);
      diver.triggerShootPose();
      diver.setAimPose(false, aim.dirX, aim.dirY, 0);
      spawn(tx, ty, 1);
      return true;
    },
    getActiveCount() {
      return pool.filter((p) => p.active).length;
    },
    getStats() {
      return { ...stats };
    },
  };
}
