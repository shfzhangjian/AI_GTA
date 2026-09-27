/**
 * Game: composition root. Wires subsystems, owns the loop slots per spec order:
 * Input -> AI -> Logic -> FixedPhysics -> TransformSync -> Animation -> Camera
 * -> Effects -> Render. Kept thin — all behavior lives in the systems.
 */
import * as THREE from 'three';
import { Time } from './Time';
import { PHYSICS_CONFIG } from '../config/physicsConfig';
import { GameLoop } from './GameLoop';
import { EventBus } from './EventBus';
import { RendererManager } from '../renderer/RendererManager';
import { Lighting } from '../renderer/Lighting';
import { Environment } from '../renderer/Environment';
import { PhysicsWorld } from '../physics/PhysicsWorld';
import { PhysicsDebug } from '../physics/PhysicsDebug';
import { InputController } from '../input/InputManager';
import { CameraController } from '../camera/CameraController';
import { CameraShake } from '../camera/CameraShake';
import { CombatSystem } from '../combat/CombatSystem';
import { ComboSystem } from '../combat/ComboSystem';
import { VFXManager } from '../effects/VFXManager';
import { AudioManager } from '../audio/AudioManager';
import { AssetManager } from '../assets/AssetManager';
import { Player } from '../player/Player';
import { PlayerController } from '../player/PlayerController';
import { Enemy } from '../enemy/EnemyEntity';
import { ENEMY_DEFS, type EnemyKind } from '../enemy/Enemy';
import { EnemyCoordinator } from '../enemy/EnemyCoordinator';
import { Boss } from '../boss/Boss';
import { DestructionSystem } from '../world/DestructionSystem';
import { World } from '../world/World';
import { HUD } from '../ui/HUD';
import { BossHealthBar } from '../ui/BossHealthBar';
import { GameOverUI } from '../ui/GameOverUI';
import { DebugPanel } from '../ui/DebugPanel';

export type GameState = 'loading' | 'playing' | 'paused' | 'ended';

export class Game {
  private time = new Time(PHYSICS_CONFIG.fixedTimeStep);
  private bus = new EventBus();
  private rendererMgr: RendererManager;
  readonly lighting: Lighting;
  private environment: Environment;
  private physics = new PhysicsWorld();
  private physicsDebug!: PhysicsDebug;
  private input = new InputController();
  private cameraShake = new CameraShake();
  private cameraCtrl: CameraController;
  private combat!: CombatSystem;
  private comboSystem!: ComboSystem;
  private vfx!: VFXManager;
  private audio = new AudioManager();
  private assets!: AssetManager;
  private player!: Player;
  private enemies: Enemy[] = [];
  private coordinator!: EnemyCoordinator;
  private boss!: Boss;
  private destruction!: DestructionSystem;
  private world!: World;
  private hud!: HUD;
  private bossBar!: BossHealthBar;
  private gameOverUI!: GameOverUI;
  private debugPanel!: DebugPanel;
  private loop!: GameLoop;
  state: GameState = 'loading';


  constructor(host: HTMLElement) {
    this.rendererMgr = new RendererManager(host);
    this.lighting = new Lighting(this.rendererMgr.scene);
    this.environment = new Environment(this.physics, this.rendererMgr.scene);
    this.cameraCtrl = new CameraController(this.rendererMgr.camera, this.cameraShake);
  }

  /** async boot: rapier wasm + assets */
  async boot(onProgress: (f: number, label: string) => void): Promise<void> {
    await this.physics.init();
    this.assets = new AssetManager(this.rendererMgr.renderer);
    onProgress(0.05, 'physics');
    await this.assets.loadAll((f: number, label: string) => onProgress(0.05 + f * 0.9, label));

    this.setup();
    onProgress(1, 'ready');
  }

  private setup(): void {
    const scene = this.rendererMgr.scene;
    const levelInfo = this.environment.build();

    this.physicsDebug = new PhysicsDebug(this.physics);
    this.physics.setDebugMeshTarget(scene);

    this.combat = new CombatSystem(this.physics, this.time, this.cameraShake, this.bus, scene);
    this.comboSystem = new ComboSystem(this.bus);
    this.vfx = new VFXManager(scene, this.bus);

    // player
    const playerController = new PlayerController(this.cameraCtrl);
    this.player = new Player(
      this.physics, this.combat, scene, this.vfx, playerController, this.bus, this.audio,
      this.assets.get('heroModel'),
    );

    // coordinator + boss
    this.coordinator = new EnemyCoordinator(scene, () => this.debugPanel?.showSlots ?? false);
    const bossPlayerRef = {
      get position() { return livePlayerPos; },
      get isAlive() { return true; },
    };
    this.boss = new Boss(
      levelInfo.bossSpawn, this.physics, scene, this.combat,
      bossPlayerRef,
      this.bus, this.audio, this.vfx,
    );

    this.destruction = new DestructionSystem(this.physics, this.combat, this.bus, this.audio, scene);
    this.world = new World(this.destruction, levelInfo);
    this.world.build();

    // UI
    this.hud = new HUD(this.bus);
    this.bossBar = new BossHealthBar(this.bus);
    this.gameOverUI = new GameOverUI(this.bus, this.audio);
    this.gameOverUI.onRestart = () => this.restart();
    this.debugPanel = new DebugPanel(this.physicsDebug);

    // bus wiring
    this.bus.on('enemy:killed', () => {
      this.world.spawns.notifyKilled();
    });
    this.bus.on('player:died', () => {
      if (this.state === 'playing') {
        this.state = 'ended';
        this.bus.emit('game:over', {});
      }
    });
    this.bus.on('boss:died', () => {
      if (this.state === 'playing') {
        this.state = 'ended';
        this.bus.emit('game:victory', {});
      }
    });

    // camera start
    livePlayerPos.copy(this.player.visualRoot.position);
    this.cameraCtrl.snapTo(livePlayerPos);

    // loop
    this.loop = new GameLoop(this.time, {
      input: (dt: number) => this.onInput(dt),
      ai: (dt: number) => this.onAI(dt),
      logic: (dt: number) => this.onLogic(dt),
      fixedPhysicsStep: () => this.physics.step(),
      transformSync: (dt: number) => this.onTransformSync(dt),
      animation: (dt: number) => this.onAnimation(dt),
      camera: (dt: number, elapsed: number) => this.onCamera(dt, elapsed),
      effects: (dt: number) => this.onEffects(dt),
      render: () => this.onRender(),
    });

    // start first wave when game begins
    this.world.spawns.onWave = (wave, index) => {
      this.bus.emit('wave:start', { index, label: `WAVE ${index + 1} — ${wave.label}` });
      for (const s of wave.spawns) this.spawnEnemy(s.kind, s.pos);
    };
  }

  start(): void {
    if (this.state === 'playing') return;
    this.audio.init();
    this.state = 'playing';
    this.time.paused = false;
    this.loop.start();
    this.world.spawns.startWave(0);
    document.getElementById('hud')!.style.display = 'block';
  }

  restart(): void {
    // clear enemies
    for (const e of this.enemies) {
      this.combat.unbindEntity(e.physicsColliderHandle);
      e.dispose();
    }
    this.enemies.length = 0;
    this.boss.reset(this.environment.info.bossSpawn);
    this.destruction.reset();
    this.world.build();
    this.player.reset(this.environment.info.playerSpawn);
    this.comboSystem.reset();
    this.cameraShake.reset();
    livePlayerPos.copy(this.player.visualRoot.position);
    this.cameraCtrl.snapTo(livePlayerPos);
    this.hud.reset();
    this.bossBar.reset();
    this.gameOverUI.hideAll();
    this.world.spawns.reset();
    this.time.reset();
    this.state = 'playing';
    this.time.paused = false;
    document.getElementById('hud')!.style.display = 'block';
    this.world.spawns.startWave(0);
  }

  // ---------- loop slots ----------
  private onInput(dt: number): void {
    this.input.update();
    const f = this.input.frame;

    if (f.pressedPause && (this.state === 'playing' || this.state === 'paused')) {
      this.togglePause();
      return;
    }
    if (this.state !== 'playing') {
      this.input.enabled = false;
      return;
    }
    this.input.enabled = true;

    this.player.controller.update(f, dt);
    if (f.pressedWeapon1) this.player.switchWeapon('sword');
    if (f.pressedWeapon2) this.player.switchWeapon('hammer');

    // pause key handled; dodge/jump edges consumed by controller buffer
  }

  private togglePause(): void {
    if (this.state === 'playing') {
      this.state = 'paused';
      this.time.paused = true;
      document.getElementById('pause-screen')!.style.display = 'flex';
    } else if (this.state === 'paused') {
      this.state = 'playing';
      this.time.paused = false;
      document.getElementById('pause-screen')!.style.display = 'none';
    }
  }

  private onAI(dt: number): void {
    if (this.state !== 'playing') return;
    // coordinator uses live player pos
    this.coordinator.update(dt, livePlayerPos);
    this.coordinator.separate(this.enemies.filter((e) => e.isAlive), dt);
    for (const e of this.enemies) e.updateAI(dt);
    this.boss.update(dt);
  }

  private onLogic(dt: number): void {
    if (this.state !== 'playing') return;
    this.comboSystem.update(dt);
    this.player.update(dt);
    for (const e of this.enemies) e.update(dt);

    // despawn dead enemies after death anim
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      if (this.enemies[i].wantsDespawn) {
        this.combat.unbindEntity(this.enemies[i].physicsColliderHandle);
        this.enemies[i].dispose();
        this.enemies.splice(i, 1);
      }
    }

    // wave progression + boss trigger
    const evt = this.world.spawns.update(dt);
    if (evt === 'next') {
      this.world.spawns.startWave(this.world.spawns.waveIndex + 1);
    } else if (evt === 'boss') {
      this.bus.emit('wave:start', { index: 3, label: 'SER BOLDWYN THE HOLLOW AWAKENS' });
      this.boss.activate();
    }

    // keep live player pos for AI refs
    livePlayerPos.copy(this.player.visualRoot.position);
  }

  private onTransformSync(dt: number): void {
    this.player.syncTransform(dt);
    for (const e of this.enemies) e.syncTransform(dt);
    this.boss.syncTransform(dt);
    this.destruction.update(dt);
    livePlayerPos.copy(this.player.visualRoot.position);
  }

  private onAnimation(dt: number): void {
    this.player.updateAnim(dt);
    for (const e of this.enemies) e.updateAnim(dt);
    this.boss.updateAnim(dt);
  }

  private onCamera(dt: number, elapsed: number): void {
    // surround level: enemies within 8m
    let near = 0;
    for (const e of this.enemies) {
      if (!e.isAlive) continue;
      const d = Math.hypot(e.visualRoot.position.x - livePlayerPos.x, e.visualRoot.position.z - livePlayerPos.z);
      if (d < 8) near++;
    }
    tmpFocusPoints.length = 0;
    if (this.boss.active && this.boss.isAlive) tmpFocusPoints.push(this.boss.visualRoot.position);
    const bossMode = this.boss.active && this.boss.isAlive;

    this.cameraCtrl.update(dt, {
      playerPos: livePlayerPos,
      facing: this.player.facing,
      focusPoints: tmpFocusPoints,
      surroundLevel: Math.min(1, near / 4),
      bossMode,
    }, elapsed);

    // lighting follows action
    this.lighting.follow(livePlayerPos.x, livePlayerPos.z);
    // sky dome rides the camera so its radius always exceeds the far plane locally
    const sky = this.rendererMgr.skyMesh;
    if (sky) { sky.position.copy(this.rendererMgr.camera.position); }
  }

  private onEffects(dt: number): void {
    // trails must stop even if an attack state exits via a path that skipped end()
    if (this.playerStateName.indexOf('Attack') !== 0) this.vfx.trail.end();
    this.vfx.update(dt);
    this.environment.update(this.time.elapsed);
    this.hud.setEnemyCount(this.enemies.filter((e) => e.isAlive).length);
    this.hud.update(dt);
    this.debugPanel.update(dt, () => ({
      fps: 0,
      drawCalls: this.rendererMgr.drawCalls,
      rigidBodies: this.physics.world.bodies.len(),
      debris: this.destruction.activeDebris,
      enemies: this.enemies.filter((e) => e.isAlive).length,
    }), this.enemies);
  }

  private onRender(): void {
    this.physics.renderDebug();
    this.rendererMgr.render();
  }

  // ---------- spawning ----------
  private spawnEnemy(kind: EnemyKind, pos: THREE.Vector3): void {
    const def = ENEMY_DEFS[kind];
    const enemy = new Enemy(
      def, pos, this.physics, this.rendererMgr.scene, this.combat, this.coordinator,
      { get position() { return livePlayerPos; }, get isAlive() { return true; } },
      this.bus, this.audio,
      () => this.debugPanel?.aiLabelsVisible ?? false,
    );
    this.enemies.push(enemy);
  }

  debugPlayerController(): PlayerController {
    return this.player.controller;
  }

  lastInputFrame() {
    return this.input.frame;
  }

  gameState(): string {
    return this.state;
  }

  loopRunning(): boolean {
    return this.loop?.running ?? false;
  }

  isBooted(): boolean {
    return this.state !== 'loading';
  }

  /** inject a logical key press for automated tests */
  testPress(code: string): void {
    window.dispatchEvent(new KeyboardEvent('keydown', { code }));
  }

  testRelease(code: string): void {
    window.dispatchEvent(new KeyboardEvent('keyup', { code }));
  }

  debugPlayerCenterOffset(): number {
    return this.player.physics.centerOffset;
  }

  debugPlayerPhysZ(): number {
    return this.player.physics.rigidBody.translation().z;
  }

  debugPlayerPhysY(): number {
    return this.player.physics.rigidBody.translation().y;
  }

  debugSpawnZ(): number {
    return this.environment.info.playerSpawn.z;
  }

  debugBreakableCount(): number {
    return this.destruction.propCount;
  }

  debugDebrisCount(): number {
    return this.destruction.debrisCount;
  }

  debugBodyCount(): number {
    return this.physics.world.bodies.len();
  }

  debugSmashNearestBreakables(n: number): void {
    this.destruction.debugSmashNearest(n, this.player.visualRoot.position);
  }

  debugPlayerDiag(): string {
    const p = this.player.physics.position;
    const v = this.player.visualRoot.position;
    return `phys ${p.x.toFixed(2)},${p.y.toFixed(2)},${p.z.toFixed(2)} vis ${v.x.toFixed(2)},${v.y.toFixed(2)},${v.z.toFixed(2)} | ${this.player.debugRigInfo()}`;
  }

  debugScreenshot(): string {
    this.rendererMgr.render();
    const src = this.rendererMgr.renderer.domElement as HTMLCanvasElement;
    const w = 320, h = 180;
    (window as unknown as { __shot: string }).__shot = `canvas ${src.width}x${src.height}`;
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const ctx = c.getContext('2d')!;
    ctx.drawImage(src, 0, 0, w, h);
    const d = ctx.getImageData(0, 0, w, h).data;
    let minL = 255, maxL = 0; const rows: number[] = [];
    for (let y = 0; y < h; y++) {
      let s2 = 0;
      for (let x = 0; x < w; x++) { const i = (y * w + x) * 4; const l = (d[i] + d[i+1] + d[i+2]) / 3; s2 += l; if (l < minL) minL = l; if (l > maxL) maxL = l; }
      rows.push(Math.round(s2 / w));
    }
    const bands = [0,1,2,3,4,5].map(b => Math.round(rows.slice(b*30,(b+1)*30).reduce((a,v)=>a+v,0)/30));
    return `min ${minL} max ${maxL} bands ${bands.join(',')}`;
  }

  debugRenderProbe(): string {
    // render with clear color set to RED, read back center pixel via gl directly
    const r = this.rendererMgr.renderer;
    const prev = new THREE.Color(); this.rendererMgr.renderer.getClearColor(prev);
    r.setClearColor(0xff0000, 1);
    this.rendererMgr.render();
    let px = 'n/a';
    try {
      const gl = r.getContext();
      const w = gl.drawingBufferWidth, h = gl.drawingBufferHeight;
      const buf = new Uint8Array(4 * 9);
      // read center region directly from the back buffer right after render (preserveDrawingBuffer=false but same task)
      gl.readPixels(Math.floor(w / 2) - 1, Math.floor(h / 2) - 1, 3, 3, gl.RGBA, gl.UNSIGNED_BYTE, buf);
      px = `${buf[0]},${buf[1]},${buf[2]}`;
    } catch (e) { px = String(e); }
    r.setClearColor(prev, 1);
    this.rendererMgr.render();
    return `centerpx ${px}`;
  }

  debugSceneDiag(): string {
    let vis = 0, total = 0;
    this.rendererMgr.scene.traverse((o) => { if ((o as THREE.Mesh).isMesh) { total++; if (o.visible) vis++; } });
    return `meshes ${vis}/${total} sunInt ${this.lighting.sun.intensity.toFixed(2)} hemiInt ${(this.lighting.hemi as unknown as { intensity: number }).intensity.toFixed(2)}`;
  }

  debugCameraDiag(): string {
    const c = this.rendererMgr.camera;
    return `pos ${c.position.x.toFixed(1)},${c.position.y.toFixed(1)},${c.position.z.toFixed(1)} quat ${c.quaternion.x.toFixed(2)},${c.quaternion.y.toFixed(2)},${c.quaternion.z.toFixed(2)},${c.quaternion.w.toFixed(2)} fov ${c.fov} near ${c.near} far ${c.far}`;
  }

  debugCameraInfo(): string {
    const c = this.rendererMgr.camera.position;
    const t = this.player.visualRoot.position;
    const d = c.distanceTo(t);
    return `cam ${c.x.toFixed(1)},${c.y.toFixed(1)},${c.z.toFixed(1)} dist ${d.toFixed(1)}`;
  }

  debugWeaponTip(): THREE.Vector3 {
    // read straight from the scene graph (no logic-time matrix refresh) to see staleness
    const out = new THREE.Vector3();
    this.player.visualRoot.getWorldPosition(out);
    return out;
  }

  debugHandInfo(): string {
    return this.player.debugHandInfo();
  }

  debugGameOver(): void {
    if (this.state === 'playing') this.bus.emit('player:died', {});
  }

  debugBossActive(): boolean {
    return this.boss.active;
  }

  debugBossHp(): number {
    return Math.ceil(this.boss.health.current);
  }

  debugBossPhase(): number {
    return this.boss.phases.phase;
  }

  debugBossDamage(d: number): void {
    if (!this.boss.health.isDead) this.boss.debugTakeDamage(d);
  }

  debugKillAllEnemies(): void {
    for (const e of this.enemies) {
      if (!e.isAlive) continue;
      const dir = new THREE.Vector3(0, 0, -1);
      e.applyHit({
        source: this.player, target: e, damage: 9999, knockback: 2, verticalForce: 0,
        hitStop: 0, cameraShake: 0, direction: dir,
        impactPoint: e.visualRoot.position.clone(), category: 'melee' as never, breakPower: 0,
      });
    }
  }

  debugEnemyDistances(): string {
    const p = this.player.visualRoot.position;
    return this.enemies.map((e) => Math.hypot(e.visualRoot.position.x - p.x, e.visualRoot.position.z - p.z).toFixed(1)).join(',');
  }

  debugEnemyZs(): string {
    return this.enemies.map((e) => `${e.visualRoot.position.z.toFixed(0)}:${e.fsm.stateName}`).join(',');
  }

  debugEnemyHps(): number[] {
    return this.enemies.map((e) => Math.ceil(e.health.current));
  }

  playerAnimTime(): number {
    return this.player.anim.elapsedInAnim;
  }

  debugPlayerPos(): THREE.Vector3 {
    return this.player.visualRoot.position;
  }

  /** loop must exist even before start() for smoke tests */
  loopForTestStart(): void {
    this.loop?.start();
  }

  /** headless smoke test support */
  tickForTest(seconds: number): void {
    const step = 1 / 60;
    for (let t = 0; t < seconds; t += step) this.loop.tickOnce(step);
  }

  tickForTestWithTrace(seconds: number): void {
    const step = 1 / 60;
    for (let t = 0; t < seconds; t += step) {
      this.loop.tickOnce(step);
    }
  }

  tickFramesWithTrace(frames: number): void {
    for (let i = 0; i < frames; i++) this.loop.tickOnce(1 / 60);
  }

  get playerStateName(): string {
    return this.player.fsm.stateName;
  }

  debugPlayerHp(): number {
    return Math.round(this.player.health.current);
  }

  debugEnemyCount(): number {
    return this.enemies.filter((e) => e.isAlive).length;
  }

  debugPlayerCapsuleY(): string {
    const t = this.player.physics.rigidBody.translation();
    return `${t.y.toFixed(2)} grounded:${this.player.physics.isGrounded}`;
  }

  debugSnapshot(): string {
    const p = this.player.visualRoot.position;
    const enemyLine = this.enemies
      .filter((e) => e.isAlive)
      .map((e) => {
        const d = Math.hypot(e.visualRoot.position.x - p.x, e.visualRoot.position.z - p.z).toFixed(1);
        return `${e.def.kind}:${e.fsm.stateName}@${d}m/hp${Math.ceil(e.health.current)}`;
      })
      .join(',');
    return `pos ${p.x.toFixed(1)},${p.z.toFixed(1)} | ${enemyLine}`;
  }
}

const livePlayerPos = new THREE.Vector3(0, 1.2, 30);
const tmpFocusPoints: THREE.Vector3[] = [];
