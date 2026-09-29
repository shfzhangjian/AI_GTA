/**
 * World 组装（阶段 3）：海水渐变 + 水面/光束 + 基础海床 + 气泡/尘埃 + 母船 + 潜水员。
 * 相机平滑跟随潜水员（阶段 2 的自动巡游已移除）。
 */
import * as THREE from 'three';
import type { Engine } from '../core/engine';
import { setDebug } from '../core/debug';
import { createWaterBackground } from './WaterBackground';
import { createWaterSurface } from './WaterSurface';
import { createTerrain, UNITS_PER_METER, WORLD_X_LIMIT } from './Terrain';
import { createAmbientParticles } from './Particles';
import { createDecorations } from './Decorations';
import { createBoat } from './Boat';
import { createFishManager, type FishManager } from '../systems/FishManager';
import { createHarpoonSystem, type HarpoonSystem } from '../systems/HarpoonSystem';
import type { MouseState } from '../core/mouse';
import { createDiver, type Diver } from '../entities/Diver';
import type { InputState } from '../core/input';

export interface World {
  diver: Diver;
  fish: FishManager;
  harpoon: HarpoonSystem;
}

export function createWorld(engine: Engine, input: InputState, mouse: MouseState): World {
  const background = createWaterBackground(engine);
  const surface = createWaterSurface(engine);
  const terrain = createTerrain(engine);
  createDecorations(engine, terrain);
  const particles = createAmbientParticles(engine, terrain);
  const boat = createBoat(engine);
  const diver = createDiver(engine, input, terrain);
  const fish = createFishManager(engine, terrain, diver);

  // 相机跟随：水平全跟随、垂直部分跟随（前瞻留白）
  const camTarget = new THREE.Vector2(0, -180);
  const FOLLOW_X = 1; // 横向往返地图不大，全跟
  const FOLLOW_Y = 0.85;
  const cam = engine.camera;

  engine.addUpdate((dt) => {
    // 目标：潜水员位置略向上偏（面朝方向多留视野）
    camTarget.x = diver.pos.x + diver.facing * 30;
    camTarget.y = diver.pos.y + 20;

    // 平滑（指数趋近，帧率无关）
    const kx = 1 - Math.exp(-4.5 * FOLLOW_X * dt);
    const ky = 1 - Math.exp(-4.0 * FOLLOW_Y * dt);
    cam.position.x += (camTarget.x - cam.position.x) * kx;
    cam.position.y += (camTarget.y - cam.position.y) * ky;

    // 相机夹取：不越过水面太多、不穿地
    const halfH = (cam.top - cam.bottom) / 2;
    const halfW = (cam.right - cam.left) / 2;
    if (halfW < WORLD_X_LIMIT) {
      cam.position.x = THREE.MathUtils.clamp(cam.position.x, -WORLD_X_LIMIT + halfW, WORLD_X_LIMIT - halfW);
    } else {
      cam.position.x = 0;
    }
    cam.position.y = Math.min(cam.position.y, halfH - 90); // 水面始终可见一部分
    const ground = terrain.groundYAt(cam.position.x) + halfH - 120;
    cam.position.y = Math.max(cam.position.y, ground);

    const depthMeters = Math.max(0, -cam.position.y) / UNITS_PER_METER;
    background.update(cam.position.x, cam.position.y, depthMeters);
    surface.update(dt, performance.now() / 1000, cam.position.x, cam.position.y, halfW);
    particles.update(dt, cam.position.x, cam.position.y, halfW, halfH);
    boat.update(performance.now() / 1000);

    setDebug({
      cameraY: cam.position.y,
      cameraX: cam.position.x,
      depthMeters,
      terrainSegments: terrain.getSegmentCount(),
      drawCalls: engine.renderer.info.render.calls,
    });
  });

  const harpoon = createHarpoonSystem(engine, mouse, diver, fish);
  return { diver, fish, harpoon };
}
