import * as THREE from '../../libs/three.module.js';
import { AnimatedSprite, SPRITES } from './assets.js';
import { caveTexture, createPlane, groundTexture, mountainTexture, sealCrackTexture, skyTexture, treeTexture } from './art.js';
import { Enemy, FloatingLabel, Particle, Projectile, createParticlePlane } from './entities.js';
import { LEVELS, WORLD } from './config.js';
import { buildTrajectoryPoints, clampAimTarget, getShotOrigin } from './trajectory.js';

export class GameScene {
  constructor(canvas, state) {
    this.canvas = canvas;
    this.state = state;
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      preserveDrawingBuffer: true,
    });
    this.renderer.setClearColor(0xd9ebcb, 1);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-800, 800, 450, -450, 0.1, 1000);
    this.camera.position.z = 500;

    this.lastFrame = performance.now();
    this.enemies = [];
    this.projectiles = [];
    this.particles = [];
    this.labels = [];
    this.spawnQueue = [];
    this.levelTime = 0;
    this.lastShotAt = -10;
    this.pointerDown = false;
    this.logHandler = null;
    this.soundHandler = null;
    this.active = false;

    this.buildScene();
    this.bindEvents();
    this.prepareLevel();
  }

  attachLog(handler) {
    this.logHandler = handler;
  }

  attachSound(handler) {
    this.soundHandler = handler;
  }

  log(message) {
    this.logHandler?.(message);
  }

  sound(name) {
    this.soundHandler?.(name);
  }

  start() {
    if (this.active) {
      return;
    }
    this.active = true;
    this.lastFrame = performance.now();
    this.resize();
    this.tick();
  }

  buildScene() {
    const sky = createPlane(skyTexture(), WORLD.width, WORLD.height, -20);
    sky.position.y = 0;
    this.scene.add(sky);

    const farMountains = createPlane(mountainTexture(0), WORLD.width * 1.06, 360, -12);
    farMountains.position.set(0, 96, -12);
    this.scene.add(farMountains);

    const midMountains = createPlane(mountainTexture(1), WORLD.width * 1.06, 330, -8);
    midMountains.position.set(22, 8, -8);
    this.scene.add(midMountains);

    const nearHills = createPlane(mountainTexture(2), WORLD.width * 1.08, 300, -4);
    nearHills.position.set(-28, -86, -4);
    this.scene.add(nearHills);

    const groundHeight = 1700;
    const ground = createPlane(groundTexture(), WORLD.width * 1.08, groundHeight, 0);
    ground.position.set(0, -68 - groundHeight / 2, 0);
    this.scene.add(ground);

    const treeA = createPlane(treeTexture(), 230, 300, 2);
    treeA.position.set(-72, -72, 2);
    this.scene.add(treeA);

    const treeB = createPlane(treeTexture(), 190, 246, 1);
    treeB.position.set(540, -82, 1);
    treeB.scale.x = -1;
    this.scene.add(treeB);

    const bamboo = createPlane(treeTexture(), 150, 195, 0.5);
    bamboo.position.set(-514, -92, 0.5);
    bamboo.material.opacity = 0.72;
    this.scene.add(bamboo);

    this.cave = createPlane(caveTexture(), 260, 260, 3);
    this.cave.position.set(WORLD.caveX, WORLD.laneY + 40, 3);
    this.scene.add(this.cave);

    this.crack = createPlane(sealCrackTexture(), 180, 180, 6);
    this.crack.position.set(WORLD.caveX + 2, WORLD.laneY + 58, 6);
    this.crack.material.opacity = 0;
    this.scene.add(this.crack);

    this.heroSprite = new AnimatedSprite({
      frames: SPRITES.hero.idle,
      width: 224,
      height: 224,
      fps: 4,
      color: new THREE.Color(1.85, 1.92, 1.52),
      z: 16,
    });
    this.hero = this.heroSprite.mesh;
    this.hero.position.set(WORLD.heroX + 8, WORLD.laneY + 64, 16);

    this.heroAura = createParticlePlane('#ffe08a', 272, 246, 0.28);
    this.heroAura.position.set(WORLD.heroX + 26, WORLD.laneY + 72, 15.4);
    this.scene.add(this.heroAura);
    this.scene.add(this.hero);

    this.grandpaCage = this.createGrandpaCage();
    this.grandpaCage.position.set(WORLD.caveX - 80, WORLD.laneY + 12, 9);
    this.scene.add(this.grandpaCage);

    this.aimLine = this.createAimLine();
    this.scene.add(this.aimLine);

    this.landingMarker = this.createLandingMarker();
    this.scene.add(this.landingMarker);

    this.shieldDome = createParticlePlane('#f8dc80', 270, 270, 0.24);
    this.shieldDome.position.set(WORLD.heroX + 36, WORLD.laneY + 62, 18);
    this.shieldDome.visible = false;
    this.scene.add(this.shieldDome);
  }

  bindEvents() {
    window.addEventListener('resize', () => this.resize());
    this.canvas.addEventListener('pointerdown', (event) => this.onPointerDown(event));
    this.canvas.addEventListener('pointermove', (event) => this.onPointerMove(event));
    window.addEventListener('pointerup', (event) => this.onPointerUp(event));
    window.addEventListener('keydown', (event) => this.onKeyDown(event));

    this.state.addEventListener('reset', () => this.prepareLevel());
    this.state.addEventListener('level-change', () => this.prepareLevel());
    this.state.addEventListener('skill', (event) => this.castSkill(event.detail.id));
    this.state.addEventListener('level-complete', (event) => {
      this.log(`${event.detail.level.name} 封印破除。`);
      this.burst(new THREE.Vector2(WORLD.caveX, WORLD.laneY + 70), '#ffe08a', 24);
    });
  }

  prepareLevel() {
    this.clearActors();
    this.levelTime = 0;
    this.spawnQueue = buildSpawnQueue(this.state.levelIndex);
    this.crack.material.opacity = 0;
  }

  clearActors() {
    for (const collection of [this.enemies, this.projectiles, this.particles, this.labels]) {
      for (const item of collection) {
        this.scene.remove(item.mesh);
      }
      collection.length = 0;
    }
  }

  resize() {
    const { clientWidth, clientHeight } = this.canvas;
    const width = Math.max(1, clientWidth);
    const height = Math.max(1, clientHeight);
    this.renderer.setSize(width, height, false);

    const aspect = width / height;
    const isPortrait = aspect < 0.82;
    const halfWidth = isPortrait ? 700 : Math.max(WORLD.width / 2, (WORLD.height / 2) * aspect);
    const halfHeight = isPortrait ? halfWidth / aspect : WORLD.height / 2;
    this.camera.position.x = isPortrait ? -20 : 0;
    this.camera.position.y = isPortrait ? -80 : 0;
    this.camera.left = -halfWidth;
    this.camera.right = halfWidth;
    this.camera.top = halfHeight;
    this.camera.bottom = -halfHeight;
    this.camera.updateProjectionMatrix();
  }

  tick() {
    requestAnimationFrame(() => this.tick());
    const now = performance.now();
    const dt = Math.min((now - this.lastFrame) / 1000, 0.05);
    this.lastFrame = now;
    this.update(dt);
    this.renderer.render(this.scene, this.camera);
  }

  update(dt) {
    this.state.update(dt);
    this.heroSprite.update(dt);
    this.grandpaSprite.update(dt);
    this.hero.position.y = WORLD.laneY + 64 + Math.sin(performance.now() * 0.003) * 3;
    this.heroAura.position.y = this.hero.position.y + 4;
    this.heroAura.material.opacity = 0.22 + Math.sin(performance.now() * 0.004) * 0.04;
    this.grandpaCage.position.y = WORLD.laneY + 12 + Math.sin(performance.now() * 0.004) * 2;
    this.cave.rotation.z = Math.sin(performance.now() * 0.0018) * 0.008;
    this.shieldDome.visible = this.state.hasBuff('shield');
    this.shieldDome.material.opacity = this.state.hasBuff('shield')
      ? 0.18 + Math.sin(performance.now() * 0.009) * 0.06
      : 0;

    if (this.state.phase === 'playing') {
      this.levelTime += dt;
      this.spawnDueEnemies();
      this.updateProjectiles(dt);
      this.updateEnemies(dt);
      this.checkLevelEnd();
    }

    this.updateParticles(dt);
    this.updateSealVisual();
  }

  spawnDueEnemies() {
    while (this.spawnQueue.length > 0 && this.spawnQueue[0].time <= this.levelTime) {
      const next = this.spawnQueue.shift();
      this.spawnEnemy(next.type, next.laneOffset);
    }
  }

  spawnEnemy(typeKey, laneOffset) {
    const scale = 1 + this.state.levelIndex * 0.22;
    const enemy = new Enemy(typeKey, scale, laneOffset);
    this.enemies.push(enemy);
    this.scene.add(enemy.mesh);
  }

  updateEnemies(dt) {
    for (const enemy of this.enemies) {
      enemy.update(dt, this.state);
      if (enemy.x < WORLD.heroX + 28) {
        this.state.damageGrandpa(enemy.type.leakDamage);
        this.labels.push(new FloatingLabel(new THREE.Vector2(WORLD.heroX + 72, WORLD.laneY + 60), `-${enemy.type.leakDamage}`, '#ff806f'));
        this.scene.add(this.labels.at(-1).mesh);
        enemy.dead = true;
      }
    }
    this.removeDead(this.enemies);
  }

  updateProjectiles(dt) {
    for (const projectile of this.projectiles) {
      projectile.update(dt);

      for (const enemy of this.enemies) {
        if (enemy.dead || projectile.hitIds.has(enemy)) {
          continue;
        }

        const dx = projectile.position.x - enemy.x;
        const dy = projectile.position.y - enemy.y;
        if (dx * dx + dy * dy <= enemy.radius * enemy.radius) {
          this.applyProjectileHit(projectile, enemy);
          if (projectile.dead) {
            break;
          }
        }
      }

      if (!projectile.dead && projectile.position.x > WORLD.caveX - 32) {
        this.handleProjectileLanding(projectile, true);
      } else if (!projectile.dead && projectile.landed) {
        this.handleProjectileLanding(projectile, false);
      }
    }
    this.removeDead(this.projectiles);
  }

  handleProjectileLanding(projectile, forceSealHit) {
    const nearCave = projectile.position.x > WORLD.caveX - 92;
    if (forceSealHit || nearCave) {
        const chip = Math.round(projectile.damage * 0.28);
        this.state.damageSeal(chip);
        this.sound('seal');
        this.burst(projectile.position, '#f5cd69', 8);
        this.labels.push(new FloatingLabel(projectile.position.clone(), '破', '#ffe08a'));
        this.scene.add(this.labels.at(-1).mesh);
    } else {
      this.burst(projectile.position, '#d8bf76', 4);
    }
    projectile.dead = true;
  }

  applyProjectileHit(projectile, enemy) {
    projectile.hitIds.add(enemy);
    const critical = Math.random() < projectile.critChance;
    const damage = Math.round(projectile.damage * (critical ? projectile.critDamage : 1));
    const defeated = enemy.takeDamage(damage);
    this.sound(critical ? 'critical' : 'hit');
    const color = critical ? '#ff6655' : '#ffe28a';
    this.labels.push(new FloatingLabel(new THREE.Vector2(enemy.x, enemy.y + 48), critical ? `${damage}x` : `${damage}`, color));
    this.scene.add(this.labels.at(-1).mesh);
    this.burst(new THREE.Vector2(enemy.x, enemy.y + 10), critical ? '#ff735c' : '#f5d274', critical ? 11 : 6);

    if (defeated) {
      this.sound('defeat');
      this.state.rewardEnemy(enemy.type);
      this.log(`${enemy.type.name} 被击破。`);
    }

    if (projectile.pierce > 0) {
      projectile.pierce -= 1;
    } else {
      projectile.dead = true;
    }
  }

  updateParticles(dt) {
    for (const collection of [this.particles, this.labels]) {
      for (const item of collection) {
        item.dead = item.update(dt);
      }
      this.removeDead(collection);
    }
  }

  updateSealVisual() {
    const ratio = 1 - this.state.sealHp / this.state.sealMax;
    this.crack.material.opacity = Math.min(0.82, Math.max(0, ratio));
    this.crack.rotation.z += 0.006 * ratio;
  }

  checkLevelEnd() {
    if (
      this.state.phase === 'playing' &&
      this.spawnQueue.length === 0 &&
      this.enemies.length === 0 &&
      this.projectiles.length === 0
    ) {
      this.state.completeLevel();
    }
  }

  fireAt(target) {
    if (this.state.phase !== 'playing') {
      return;
    }

    const stats = this.state.getArrowStats();
    const now = performance.now() / 1000;
    if (now - this.lastShotAt < stats.cooldown) {
      return;
    }

    this.lastShotAt = now;
    this.sound('shoot');
    this.heroSprite.setSequence(SPRITES.hero.shoot, {
      fps: 14,
      loop: false,
      onDone: () => this.heroSprite.setSequence(SPRITES.hero.idle, { fps: 4, loop: true }),
    });
    const origin = getShotOrigin();
    const clampedTarget = clampAimTarget(target);
    const projectile = new Projectile(origin, clampedTarget, stats);
    this.projectiles.push(projectile);
    this.scene.add(projectile.mesh);
    this.burst(origin, '#e9ce74', 5);
  }

  castSkill(id) {
    if (id === 'dawa') {
      this.log('大娃震山，前阵开裂。');
      for (const enemy of this.enemies) {
        if (enemy.x < 420) {
          if (enemy.takeDamage(92 + this.state.levelIndex * 20)) {
            this.state.rewardEnemy(enemy.type);
          }
          this.burst(new THREE.Vector2(enemy.x, enemy.y + 14), '#f0cb66', 12);
        }
      }
      this.burst(new THREE.Vector2(-90, WORLD.laneY + 22), '#f0cb66', 30);
      this.removeDead(this.enemies);
      return;
    }

    if (id === 'erwa') {
      this.state.addBuff('focus', 7, 1);
      this.log('二娃开眼，弱点尽显。');
      for (const enemy of this.enemies) {
        this.labels.push(new FloatingLabel(new THREE.Vector2(enemy.x, enemy.y + 68), '准', '#a9f2c5'));
        this.scene.add(this.labels.at(-1).mesh);
      }
      return;
    }

    if (id === 'sanwa') {
      this.state.addBuff('shield', 8, 1);
      this.log('三娃护阵，爷爷暂安。');
      this.burst(new THREE.Vector2(WORLD.heroX + 42, WORLD.laneY + 70), '#ffe08a', 22);
      return;
    }

    if (id === 'huowa') {
      this.log('火娃落焰，洞前燃起。');
      for (let i = 0; i < 7; i += 1) {
        const center = new THREE.Vector2(210 + Math.random() * 470, WORLD.laneY - 8 + Math.random() * 98);
        setTimeout(() => {
          if (this.state.phase !== 'playing') {
            return;
          }
          this.burst(center, '#ff7856', 18);
          this.labels.push(new FloatingLabel(center.clone(), '焰', '#ff8966'));
          this.scene.add(this.labels.at(-1).mesh);
          for (const enemy of this.enemies) {
            const dx = enemy.x - center.x;
            const dy = enemy.y - center.y;
            if (dx * dx + dy * dy < 150 * 150) {
              if (enemy.takeDamage(70 + this.state.levelIndex * 18)) {
                this.state.rewardEnemy(enemy.type);
              }
            }
          }
          this.removeDead(this.enemies);
        }, i * 130);
      }
    }
  }

  burst(position, color, amount) {
    for (let i = 0; i < amount; i += 1) {
      const particle = new Particle(position, {
        color,
        size: 18 + Math.random() * 30,
        life: 0.35 + Math.random() * 0.45,
        velocity: new THREE.Vector2((Math.random() - 0.5) * 180, (Math.random() - 0.15) * 150),
      });
      this.particles.push(particle);
      this.scene.add(particle.mesh);
    }
  }

  removeDead(collection) {
    for (let i = collection.length - 1; i >= 0; i -= 1) {
      if (collection[i].dead) {
        this.scene.remove(collection[i].mesh);
        collection.splice(i, 1);
      }
    }
  }

  onPointerDown(event) {
    this.pointerDown = true;
    this.canvas.setPointerCapture?.(event.pointerId);
    this.updateAim(event);
  }

  onPointerMove(event) {
    if (!this.pointerDown) {
      return;
    }
    this.updateAim(event);
  }

  onPointerUp(event) {
    if (!this.pointerDown) {
      return;
    }
    this.pointerDown = false;
    this.updateAim(event);
    this.fireAt(this.pointerWorld);
    this.hideAimGuide();
  }

  onKeyDown(event) {
    if (event.code === 'Space') {
      event.preventDefault();
      this.fireAt(this.getNearestTarget());
    }

    if (event.key === 'p' || event.key === 'P') {
      this.state.togglePause();
    }

    const skillByKey = {
      1: 'dawa',
      2: 'erwa',
      3: 'sanwa',
      4: 'huowa',
    };
    if (skillByKey[event.key]) {
      this.state.useSkill(skillByKey[event.key]);
    }
  }

  updateAim(event) {
    this.pointerWorld = clampAimTarget(this.screenToWorld(event.clientX, event.clientY));
    this.updateAimGuide(this.pointerWorld);
  }

  screenToWorld(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 2 - 1;
    const y = -(((clientY - rect.top) / rect.height) * 2 - 1);
    const vector = new THREE.Vector3(x, y, 0).unproject(this.camera);
    return new THREE.Vector2(vector.x, vector.y);
  }

  getNearestTarget() {
    const living = this.enemies.filter((enemy) => !enemy.dead);
    if (living.length === 0) {
      return new THREE.Vector2(WORLD.caveX, WORLD.laneY + 50);
    }
    const nearest = living.reduce((best, enemy) => (enemy.x < best.x ? enemy : best), living[0]);
    return new THREE.Vector2(nearest.x, nearest.y + 24);
  }

  createAimLine() {
    const geometry = new THREE.BufferGeometry().setFromPoints(
      buildTrajectoryPoints(getShotOrigin(), new THREE.Vector2(WORLD.caveX, WORLD.laneY)),
    );
    const material = new THREE.LineDashedMaterial({
      color: 0xffe08a,
      transparent: true,
      opacity: 0.72,
      dashSize: 12,
      gapSize: 10,
    });
    const line = new THREE.Line(geometry, material);
    line.computeLineDistances();
    line.visible = false;
    return line;
  }

  updateAimGuide(target) {
    const visible = this.state.phase === 'playing';
    const points = buildTrajectoryPoints(getShotOrigin(), target);
    this.aimLine.geometry.dispose();
    this.aimLine.geometry = new THREE.BufferGeometry().setFromPoints(points);
    this.aimLine.computeLineDistances();
    this.aimLine.visible = visible;
    this.landingMarker.visible = visible;
    this.landingMarker.position.set(target.x, target.y, 23);
  }

  hideAimGuide() {
    this.aimLine.visible = false;
    this.landingMarker.visible = false;
  }

  createLandingMarker() {
    const group = new THREE.Group();
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(18, 25, 48),
      new THREE.MeshBasicMaterial({
        color: 0xffe08a,
        transparent: true,
        opacity: 0.82,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    );
    group.add(ring);

    const lineMaterial = new THREE.MeshBasicMaterial({
      color: 0x2b1d12,
      transparent: true,
      opacity: 0.58,
      depthWrite: false,
    });
    const horizontal = new THREE.Mesh(new THREE.PlaneGeometry(42, 3), lineMaterial);
    const vertical = new THREE.Mesh(new THREE.PlaneGeometry(3, 42), lineMaterial);
    group.add(horizontal, vertical);
    group.visible = false;
    return group;
  }

  createGrandpaCage() {
    const group = new THREE.Group();
    const glow = createParticlePlane('#ffe5a5', 116, 96, 0.22);
    glow.position.set(0, 0, -0.04);
    group.add(glow);

    this.grandpaSprite = new AnimatedSprite({
      frames: SPRITES.grandpa.idle,
      width: 46,
      height: 86,
      fps: 1,
      pixelated: true,
      z: 0.05,
    });
    this.grandpaSprite.mesh.position.set(0, -4, 0.05);
    group.add(this.grandpaSprite.mesh);

    const bronze = new THREE.MeshBasicMaterial({
      color: 0x9b6a38,
      transparent: true,
      opacity: 0.94,
      depthWrite: false,
    });
    const bars = [
      [0, 24, 104, 7],
      [0, -42, 104, 7],
      [-49, -9, 7, 74],
      [-24, -9, 6, 72],
      [0, -9, 6, 72],
      [24, -9, 6, 72],
      [49, -9, 7, 74],
    ];

    for (const [x, y, width, height] of bars) {
      const bar = new THREE.Mesh(new THREE.PlaneGeometry(width, height), bronze);
      bar.position.set(x, y, 0.12);
      group.add(bar);
    }

    return group;
  }
}

function buildSpawnQueue(levelIndex) {
  const level = LEVELS[levelIndex];
  if (!level) {
    return [];
  }

  const queue = [];
  let cursor = 0;
  level.waves.forEach((wave, waveIndex) => {
    cursor += wave.delay + (waveIndex > 0 ? level.waveGap : 0);
    for (let i = 0; i < wave.count; i += 1) {
      queue.push({
        time: cursor + i * wave.every,
        type: wave.types[i % wave.types.length],
        laneOffset: ((i % 3) - 1) * 22 + Math.sin(i * 1.7) * 8,
      });
    }
    cursor += wave.count * wave.every;
  });
  return queue;
}
