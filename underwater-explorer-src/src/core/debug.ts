/** 运行时调试输出（无截图测试规范：状态走 console + window.__UE_DEBUG__） */
interface DebugState {
  stage: string;
  fps: number;
  cameraY: number;
  cameraX: number;
  depthMeters: number;
  bubbleCount: number;
  moteCount: number;
  terrainSegments: number;
  drawCalls: number;
  diverX: number;
  diverY: number;
  diverVx: number;
  diverVy: number;
  diverFacing: number;
  diverState: string;
  diverSurfacing: number;
  diverExposedHeight: number;
  diverDepthMeters: number;
  diverOxygen: number;
  diverHealth: number;
  diverBreathing: number;
  diverAiming: number;
  diverClips: number;
  elapsed: number;
  keyDownCount: number;
  keyUpCount: number;
  demoVelKick: number;
  tickCount: number;
  decorCount: number;
  decorLoaded: number;
  decorActive: number;
  decorTextures: number;
  decorMinDist: number;
  fishAlive: number;
  fishTextures: number;
  fishSprites: number;
  fishThreats: number;
  fishAttacks: number;
  harpoonActive: number;
  harpoonFired: number;
  harpoonHits: number;
  harpoonKills: number;
  errors: string[];
}

declare global {
  interface Window {
    __UE_DEBUG__: DebugState;
  }
}

window.__UE_DEBUG__ = {
  stage: 'stage7',
  fps: 0,
  cameraY: 0,
  cameraX: 0,
  depthMeters: 0,
  bubbleCount: 0,
  moteCount: 0,
  terrainSegments: 0,
  drawCalls: 0,
  diverX: 0,
  diverY: 0,
  diverVx: 0,
  diverVy: 0,
  diverFacing: 1,
  diverState: 'idle',
  diverSurfacing: 0,
  diverExposedHeight: 0,
  diverDepthMeters: 0,
  diverOxygen: 100,
  diverHealth: 100,
  diverBreathing: 0,
  diverAiming: 0,
  diverClips: 0,
  elapsed: 0,
  keyDownCount: 0,
  keyUpCount: 0,
  demoVelKick: 0,
  tickCount: 0,
  decorCount: 0,
  decorLoaded: 0,
  decorActive: 0,
  decorTextures: 0,
  decorMinDist: 0,
  fishAlive: 0,
  fishTextures: 0,
  fishSprites: 0,
  fishThreats: 0,
  fishAttacks: 0,
  harpoonActive: 0,
  harpoonFired: 0,
  harpoonHits: 0,
  harpoonKills: 0,
  errors: [],
};

export function windowDebug(): DebugState {
  return window.__UE_DEBUG__;
}

export function setDebug(patch: Partial<DebugState>): void {
  Object.assign(window.__UE_DEBUG__, patch);
}

export function reportError(where: string, err: unknown): void {
  const msg = err instanceof Error ? err.stack || err.message : String(err);
  window.__UE_DEBUG__.errors.push(`${where}: ${msg}`);
  console.error(`[${where}]`, err);
}
