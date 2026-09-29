/**
 * 潜水员实体（阶段 3）
 * - 输入 WASD/方向键；加速度 + 阻尼 + 最大速度（水下惯性，不瞬移）
 * - 朝向：水平速度方向；sprite 水平翻转
 * - 动画：swim（移动）/ idle（悬停）；帧数据来自 src/data/diverClips.ts
 * - 边界：水面下封顶、海床地形、左右世界边界
 * - headless：?devdt=N 由 engine 强制步长；本文件为纯 dt 积分，天然兼容
 */
import * as THREE from 'three';
import type { Engine } from '../core/engine';
import type { InputState } from '../core/input';
import { framesToTextures, ClipPlayer, type ClipDef } from '../utils/spritesheet';
import { DIVER_CLIPS } from '../data/diverClips';
import type { Terrain } from '../world/Terrain';
import { UNITS_PER_METER, WORLD_X_LIMIT } from '../world/Terrain';
import { setDebug, reportError } from '../core/debug';

// 运动参数（1 unit = 0.1m）
const ACCEL = 1500;
const DAMPING = 3.4;
const MAX_SPEED_X = 250;
const MAX_SPEED_Y = 210;
const SINK_DRIFT = 26; // 悬停时缓慢下沉
const DISPLAY_SCALE = 1.6;
const SURFACE_LIMIT = -10; // 身体中心保持在水下，出水部分由独立头肩层绘制
const SURFACE_POSE_Y = -54; // 接近水面时改用直立姿态，避免横泳帧把头压在水线里
const SURFACE_OVERLAY_TOP = 43;
const GROUND_CLEARANCE = 44; // 避免潜水员身体沉进海床/礁石
const MAX_OXYGEN = 100;
const MAX_HEALTH = 100;
const OXYGEN_DRAIN_PER_SEC = 5.2;
const OXYGEN_RECOVER_PER_SEC = 28;
const NO_OXYGEN_DAMAGE_PER_SEC = 10;
const BREATHING_EXPOSED_HEIGHT = 18;
const DAMAGE_INVULN_TIME = 0.72;
const HURT_FLASH_TIME = 0.22;
const AIM_SHOULDER_X = 9;
const AIM_SHOULDER_Y = 8;
const SHOOT_RECOIL_TIME = 0.16;

export type DiverState = 'idle' | 'swim';

export interface Diver {
  pos: THREE.Vector2;
  vel: THREE.Vector2;
  readonly oxygen: number;
  readonly maxOxygen: number;
  readonly health: number;
  readonly maxHealth: number;
  readonly isBreathing: boolean;
  readonly facing: 1 | -1;
  readonly state: DiverState;
  takeDamage(amount: number, knockbackX: number, knockbackY: number): boolean;
  setAimPose(active: boolean, dirX: number, dirY: number, power: number): void;
  triggerShootPose(): void;
}

export function createDiver(engine: Engine, input: InputState, terrain: Terrain): Diver {
  const group = new THREE.Group();
  group.name = 'diver';
  engine.layers.entity.add(group);

  const material = new THREE.SpriteMaterial({ depthTest: false, depthWrite: false, transparent: true });
  const sprite = new THREE.Sprite(material);
  sprite.visible = false;
  sprite.renderOrder = 30;
  const aboveWaterClip = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

  const surfaceGlowMat = new THREE.MeshBasicMaterial({
    color: 0xbff3ff,
    transparent: true,
    opacity: 0,
    depthTest: false,
    depthWrite: false,
  });
  const surfaceGlow = new THREE.Mesh(new THREE.CircleGeometry(42, 32), surfaceGlowMat);
  surfaceGlow.renderOrder = 29;
  surfaceGlow.scale.set(1.35, 0.72, 1);
  surfaceGlow.visible = false;
  group.add(surfaceGlow);

  const surfaceHead = new THREE.Group();
  surfaceHead.name = 'surface-head';
  surfaceHead.visible = false;
  surfaceHead.renderOrder = 46;
  group.add(surfaceHead);

  const hoodMat = new THREE.MeshBasicMaterial({
    color: 0x1f258f,
    depthTest: false,
    depthWrite: false,
    opacity: 0.98,
    transparent: true,
    clippingPlanes: [aboveWaterClip],
  });
  const faceMat = new THREE.MeshBasicMaterial({
    color: 0xf0b17d,
    depthTest: false,
    depthWrite: false,
    opacity: 0.98,
    transparent: true,
    clippingPlanes: [aboveWaterClip],
  });
  const visorMat = new THREE.MeshBasicMaterial({
    color: 0xc9f6ff,
    depthTest: false,
    depthWrite: false,
    opacity: 0.92,
    transparent: true,
    clippingPlanes: [aboveWaterClip],
  });
  const outlineMat = new THREE.MeshBasicMaterial({
    color: 0xf2fdff,
    depthTest: false,
    depthWrite: false,
    opacity: 0.46,
    transparent: true,
    clippingPlanes: [aboveWaterClip],
  });
  const shoulderMat = new THREE.MeshBasicMaterial({
    color: 0x2930ad,
    depthTest: false,
    depthWrite: false,
    opacity: 0.88,
    transparent: true,
    clippingPlanes: [aboveWaterClip],
  });
  const rippleMat = new THREE.MeshBasicMaterial({
    color: 0xdffbff,
    depthTest: false,
    depthWrite: false,
    opacity: 0,
    transparent: true,
  });

  const headOutline = new THREE.Mesh(new THREE.RingGeometry(13, 16, 32), outlineMat);
  headOutline.position.set(0, 28, 0.06);
  headOutline.scale.set(0.78, 1.03, 1);
  headOutline.renderOrder = 46;
  surfaceHead.add(headOutline);

  const hood = new THREE.Mesh(new THREE.CircleGeometry(13.5, 32), hoodMat);
  hood.position.set(0, 28, 0.07);
  hood.scale.set(0.74, 1.02, 1);
  hood.renderOrder = 47;
  surfaceHead.add(hood);

  const face = new THREE.Mesh(new THREE.CircleGeometry(7.8, 24), faceMat);
  face.position.set(2.2, 26.4, 0.08);
  face.scale.set(0.82, 1.08, 1);
  face.renderOrder = 48;
  surfaceHead.add(face);

  const visor = new THREE.Mesh(new THREE.PlaneGeometry(15, 5.4), visorMat);
  visor.position.set(3.4, 30.2, 0.09);
  visor.renderOrder = 49;
  surfaceHead.add(visor);

  const shoulder = new THREE.Mesh(new THREE.PlaneGeometry(30, 11), shoulderMat);
  shoulder.position.set(0, 13.4, 0.05);
  shoulder.scale.set(1, 0.62, 1);
  shoulder.renderOrder = 45;
  surfaceHead.add(shoulder);

  const ripple = new THREE.Mesh(new THREE.PlaneGeometry(46, 4.5), rippleMat);
  ripple.position.set(0, 0.8, 0.1);
  ripple.renderOrder = 50;
  surfaceHead.add(ripple);

  group.add(sprite);

  const aimPose = new THREE.Group();
  aimPose.name = 'diver-aim-pose';
  aimPose.visible = false;
  aimPose.renderOrder = 37;
  group.add(aimPose);

  const aimArmMat = new THREE.MeshBasicMaterial({
    color: 0x2630a8,
    transparent: true,
    opacity: 0.96,
    depthTest: false,
    depthWrite: false,
  });
  const aimGloveMat = new THREE.MeshBasicMaterial({
    color: 0xf0b17d,
    transparent: true,
    opacity: 0.98,
    depthTest: false,
    depthWrite: false,
  });
  const heldHarpoonMat = new THREE.MeshBasicMaterial({
    color: 0xd6edf2,
    transparent: true,
    opacity: 0.95,
    depthTest: false,
    depthWrite: false,
  });
  const heldTipMat = new THREE.MeshBasicMaterial({
    color: 0x93a8b3,
    transparent: true,
    opacity: 0.98,
    depthTest: false,
    depthWrite: false,
  });

  const aimArm = new THREE.Mesh(new THREE.PlaneGeometry(22, 6), aimArmMat);
  aimArm.position.set(11, 0, 0.12);
  aimArm.renderOrder = 37;
  aimPose.add(aimArm);

  const aimGlove = new THREE.Mesh(new THREE.CircleGeometry(4.2, 16), aimGloveMat);
  aimGlove.position.set(22.5, 0, 0.13);
  aimGlove.renderOrder = 38;
  aimPose.add(aimGlove);

  const heldHarpoon = new THREE.Mesh(new THREE.PlaneGeometry(42, 3), heldHarpoonMat);
  heldHarpoon.position.set(42, 0, 0.14);
  heldHarpoon.renderOrder = 39;
  aimPose.add(heldHarpoon);

  const heldTip = new THREE.Mesh(new THREE.CircleGeometry(4, 3), heldTipMat);
  heldTip.position.set(64, 0, 0.15);
  heldTip.rotation.z = -Math.PI / 2;
  heldTip.scale.set(1.45, 0.72, 1);
  heldTip.renderOrder = 40;
  aimPose.add(heldTip);

  const clips: Record<string, THREE.Texture[]> = {};
  const defs: Record<string, ClipDef> = DIVER_CLIPS;
  const player = new ClipPlayer(clips, defs, material);
  let firstLoaded = false;

  function clipKey(name: DiverState, dir: 1 | -1): string {
    return `${name}:${dir === 1 ? 'right' : 'left'}`;
  }

  function loadClip(name: string, def: ClipDef): void {
    new THREE.TextureLoader().load(
      def.url,
      (tex) => {
        tex.magFilter = THREE.NearestFilter;
        tex.minFilter = THREE.NearestFilter;
        const img = tex.image as HTMLImageElement;
        clips[`${name}:right`] = framesToTextures(img, def.frames, def.frameWidth, def.frameHeight);
        clips[`${name}:left`] = framesToTextures(img, def.frames, def.frameWidth, def.frameHeight, true);
        if (!firstLoaded) {
          firstLoaded = true;
          player.play(clipKey('swim', facing));
          player.update(0);
          sprite.visible = true;
        }
        setDebug({ diverClips: Object.keys(clips).length });
      },
      undefined,
      (err) => reportError(`diver.load(${name})`, err),
    );
  }
  for (const [name, def] of Object.entries(defs)) loadClip(name, def);

  const pos = new THREE.Vector2(0, -180); // 起始深度 18m
  const vel = new THREE.Vector2(0, 0);
  let facing: 1 | -1 = 1;
  let state: DiverState = 'idle';
  let oxygen = MAX_OXYGEN;
  let health = MAX_HEALTH;
  let breathing = false;
  let damageInvuln = 0;
  let hurtFlash = 0;
  let aiming = false;
  let aimDirX = 1;
  let aimDirY = 0;
  let aimPower = 0;
  let shootRecoil = 0;

  function bound(): void {
    if (pos.y > SURFACE_LIMIT) {
      pos.y = SURFACE_LIMIT;
      if (vel.y > 0) vel.y = 0;
    }
    const ground = terrain.groundYAt(pos.x) + GROUND_CLEARANCE;
    if (pos.y < ground) {
      pos.y = ground;
      if (vel.y < 0) vel.y = 0;
    }
    if (pos.x > WORLD_X_LIMIT) {
      pos.x = WORLD_X_LIMIT;
      vel.x = Math.min(0, vel.x);
    }
    if (pos.x < -WORLD_X_LIMIT) {
      pos.x = -WORLD_X_LIMIT;
      vel.x = Math.max(0, vel.x);
    }
  }

  function takeDamage(amount: number, knockbackX: number, knockbackY: number): boolean {
    if (health <= 0 || damageInvuln > 0) return false;
    health = Math.max(0, health - amount);
    vel.x += knockbackX;
    vel.y += knockbackY;
    damageInvuln = DAMAGE_INVULN_TIME;
    hurtFlash = HURT_FLASH_TIME;
    return true;
  }

  function setAimPose(active: boolean, dirX: number, dirY: number, power: number): void {
    aiming = active;
    if (!active) return;
    const d = Math.sqrt(dirX * dirX + dirY * dirY) || 1;
    aimDirX = dirX / d;
    aimDirY = dirY / d;
    aimPower = THREE.MathUtils.clamp(power, 0, 1);
  }

  function triggerShootPose(): void {
    shootRecoil = SHOOT_RECOIL_TIME;
  }

  engine.addUpdate((dt) => {
    const ax = input.axisX();
    const ay = input.axisY();

    // 惯性起步证据（scripts/runtime-check2.mjs 断言用）：输入起始 tick + 速度演化样本
    const dbg = window.__UE_DEBUG__ as unknown as Record<string, unknown>;
    const prevAx = (dbg.__prevAx as number) ?? 0;
    const prevAy = (dbg.__prevAy as number) ?? 0;
    if ((ax !== 0 || ay !== 0) && prevAx === 0 && prevAy === 0) {
      dbg.inputStartTick = window.__UE_DEBUG__.tickCount;
      dbg.velSamples = [];
    }
    if (ax !== 0 || ay !== 0) {
      const samples = (dbg.velSamples as number[]) ?? [];
      samples.push(Math.round(vel.x), Math.round(vel.y));
      if (samples.length > 64) samples.shift();
      dbg.velSamples = samples;
    }
    dbg.__prevAx = ax;
    dbg.__prevAy = ay;

    // 纯 dt 积分：加速度 / 阻尼 / 悬停缓沉
    vel.x += ax * ACCEL * dt;
    vel.y += ay * ACCEL * 0.85 * dt;
    if (ay === 0) vel.y -= SINK_DRIFT * dt;
    damageInvuln = Math.max(0, damageInvuln - dt);
    hurtFlash = Math.max(0, hurtFlash - dt);
    shootRecoil = Math.max(0, shootRecoil - dt);

    const damp = Math.exp(-DAMPING * dt);
    if (ax === 0) vel.x *= damp;
    if (ay === 0) vel.y = vel.y * damp - SINK_DRIFT * dt;

    vel.x = THREE.MathUtils.clamp(vel.x, -MAX_SPEED_X, MAX_SPEED_X);
    vel.y = THREE.MathUtils.clamp(vel.y, -MAX_SPEED_Y, MAX_SPEED_Y);

    pos.x += vel.x * dt;
    pos.y += vel.y * dt;
    bound();

    if (aiming) facing = aimDirX >= 0 ? 1 : -1;
    else if (Math.abs(vel.x) > 15) facing = vel.x > 0 ? 1 : -1;

    const nearSurface = pos.y > SURFACE_POSE_Y;
    const moving = Math.abs(vel.x) > 22 || Math.abs(vel.y) > 22;
    state = nearSurface ? 'idle' : moving ? 'swim' : 'idle';
    const nextClip = clipKey(state, facing);
    if (player.clipName !== nextClip && clips[nextClip]) player.play(nextClip);
    player.update(dt);
    sprite.visible = !!material.map;

    const def = defs[state] ?? defs.swim;
    sprite.scale.set(def.frameWidth * DISPLAY_SCALE, def.frameHeight * DISPLAY_SCALE, 1);
    const bodyHeight = def.frameHeight * DISPLAY_SCALE;
    const bodyTopWorldY = pos.y + bodyHeight * 0.5;
    const exposedHeight = THREE.MathUtils.clamp(bodyTopWorldY, 0, SURFACE_OVERLAY_TOP);
    const exposedRatio = exposedHeight / SURFACE_OVERLAY_TOP;
    const waterlineLocalY = -pos.y;
    surfaceGlow.visible = exposedHeight > 0;
    surfaceGlow.position.set(0, waterlineLocalY, -0.01);
    surfaceGlowMat.opacity = exposedHeight > 0 ? 0.12 + exposedRatio * 0.06 : 0;
    surfaceGlow.scale.set(1.04 + exposedRatio * 0.16, 0.15 + exposedRatio * 0.08, 1);
    surfaceHead.visible = exposedHeight > 0;
    surfaceHead.position.set(facing * 1.5, 0, 0.04);
    surfaceHead.scale.set(facing, 1, 1);
    ripple.visible = exposedHeight > 0;
    ripple.position.y = waterlineLocalY + 0.8;
    rippleMat.opacity = exposedHeight > 0 ? 0.42 + exposedRatio * 0.08 : 0;
    breathing = exposedHeight >= BREATHING_EXPOSED_HEIGHT;
    if (breathing) {
      oxygen = Math.min(MAX_OXYGEN, oxygen + OXYGEN_RECOVER_PER_SEC * dt);
    } else {
      oxygen = Math.max(0, oxygen - OXYGEN_DRAIN_PER_SEC * dt);
      if (oxygen <= 0) health = Math.max(0, health - NO_OXYGEN_DAMAGE_PER_SEC * dt);
    }
    if (health <= 0) {
      vel.multiplyScalar(Math.exp(-6 * dt));
      oxygen = Math.max(0, oxygen);
    }
    const hurtPulse = hurtFlash > 0 ? 0.45 + 0.35 * Math.sin(hurtFlash * 90) : 0;
    material.color.setRGB(1, 1 - hurtPulse, 1 - hurtPulse);
    aimPose.visible = aiming || shootRecoil > 0;
    if (aimPose.visible) {
      const angle = Math.atan2(aimDirY, aimDirX);
      const recoilT = shootRecoil / SHOOT_RECOIL_TIME;
      const recoil = recoilT > 0 ? 7 * recoilT : 0;
      const brace = 1 + aimPower * 0.12;
      aimPose.position.set(facing * AIM_SHOULDER_X - aimDirX * recoil, AIM_SHOULDER_Y - aimDirY * recoil, 0.18);
      aimPose.rotation.z = angle;
      aimArm.scale.set(1.05 + aimPower * 0.12, brace, 1);
      aimGlove.position.x = 22.5 + aimPower * 2 - recoil * 0.18;
      heldHarpoon.position.x = 42 + aimPower * 2 - recoil * 0.35;
      heldTip.position.x = 64 + aimPower * 2 - recoil * 0.48;
      const chargeGlow = 1 + aimPower * 0.35;
      heldHarpoonMat.color.setRGB(Math.min(1, 0.84 * chargeGlow), Math.min(1, 0.93 * chargeGlow), 0.96);
    }
    sprite.position.y = 0;
    group.position.set(pos.x, pos.y, 0);

    setDebug({
      diverX: Math.round(pos.x),
      diverY: Math.round(pos.y),
      diverVx: Math.round(vel.x),
      diverVy: Math.round(vel.y),
      diverFacing: facing,
      diverState: state,
      diverSurfacing: nearSurface ? 1 : 0,
      diverExposedHeight: Math.round(exposedHeight),
      diverDepthMeters: Math.max(0, -pos.y) / UNITS_PER_METER,
      diverOxygen: Math.round(oxygen),
      diverHealth: Math.round(health),
      diverBreathing: breathing ? 1 : 0,
      diverAiming: aiming ? 1 : 0,
    });
  });

  return {
    pos,
    vel,
    get oxygen() {
      return oxygen;
    },
    get maxOxygen() {
      return MAX_OXYGEN;
    },
    get health() {
      return health;
    },
    get maxHealth() {
      return MAX_HEALTH;
    },
    get isBreathing() {
      return breathing;
    },
    get facing() {
      return facing;
    },
    get state() {
      return state;
    },
    takeDamage,
    setAimPose,
    triggerShootPose,
  };
}
