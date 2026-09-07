import * as THREE from '../../libs/three.module.js';
import { AnimatedSprite, SPRITES } from './assets.js';
import { ENEMY_TYPES, WORLD } from './config.js';
import { circleTexture, createPlane, labelTexture, targetBadgeTexture } from './art.js';
import { measureTrajectory, sampleTrajectory, sampleTrajectoryTangent } from './trajectory.js';

const particleTextures = new Map();

export class Enemy {
  constructor(typeKey, levelScale, laneOffset = 0) {
    this.typeKey = typeKey;
    this.type = ENEMY_TYPES[typeKey];
    this.maxHp = Math.round(this.type.hp * levelScale);
    this.hp = this.maxHp;
    this.speed = this.type.speed * (0.95 + Math.random() * 0.16);
    this.radius = this.type.radius * this.type.scale;
    this.x = WORLD.caveX + 70 + Math.random() * 90;
    this.y = WORLD.laneY + laneOffset;
    this.dead = false;
    this.flashTime = 0;
    this.mesh = this.createMesh();
    this.syncMesh();
  }

  createMesh() {
    const group = new THREE.Group();
    const shadow = createParticlePlane('#000000', 92, 28, 0.22);
    shadow.scale.y = 0.46;
    shadow.position.set(0, -62, -0.1);
    group.add(shadow);

    const sprite = this.type.sprite === 'eye' ? SPRITES.enemies.eye : SPRITES.enemies.walk;
    const bodySize = this.type.body;
    this.animator = new AnimatedSprite({
      frames: sprite,
      width: bodySize.width * this.type.scale,
      height: bodySize.height * this.type.scale,
      fps: this.type.sprite === 'eye' ? 4 : 7,
      color: new THREE.Color(this.type.color).lerp(new THREE.Color('#ffffff'), 0.35),
      z: 0.1,
    });
    this.animator.mesh.position.y = bodySize.y * this.type.scale;
    group.add(this.animator.mesh);
    this.body = this.animator.mesh;

    const target = createPlane(
      targetBadgeTexture(this.type.color),
      this.type.target.size * this.type.scale,
      this.type.target.size * this.type.scale,
      0.28,
    );
    target.position.set(this.type.target.x * this.type.scale, this.type.target.y * this.type.scale, 0.28);
    target.material.opacity = 0.9;
    group.add(target);

    const hpBack = new THREE.Mesh(
      new THREE.PlaneGeometry(70, 7),
      new THREE.MeshBasicMaterial({ color: 0x1d1511, transparent: true, opacity: 0.78 }),
    );
    hpBack.position.set(0, 76 * this.type.scale, 0.2);
    group.add(hpBack);

    const hpFill = new THREE.Mesh(
      new THREE.PlaneGeometry(68, 5),
      new THREE.MeshBasicMaterial({ color: 0xe1b65e, transparent: true, opacity: 0.95 }),
    );
    hpFill.position.set(0, 76 * this.type.scale, 0.21);
    group.add(hpFill);
    this.hpFill = hpFill;

    return group;
  }

  update(dt, state) {
    const slow = state.hasBuff('slow') ? 0.58 : 1;
    const shieldDrag = state.hasBuff('shield') ? 0.86 : 1;
    this.x -= this.speed * slow * shieldDrag * dt;
    this.flashTime = Math.max(0, this.flashTime - dt);
    this.animator.update(dt);
    this.body.material.opacity = this.flashTime > 0 ? 0.58 : 1;
    this.mesh.rotation.z = Math.sin(performance.now() * 0.004 + this.x) * 0.035;
    this.syncMesh();
  }

  syncMesh() {
    this.mesh.position.set(this.x, this.y, 8 + (WORLD.caveX - this.x) * 0.002);
    this.hpFill.scale.x = Math.max(0.01, this.hp / this.maxHp);
    this.hpFill.position.x = -34 + 34 * this.hpFill.scale.x;
  }

  takeDamage(amount) {
    this.hp = Math.max(0, this.hp - amount);
    this.flashTime = 0.08;
    this.dead = this.hp <= 0;
    return this.dead;
  }
}

export class Projectile {
  constructor(origin, target, stats) {
    this.origin = origin.clone();
    this.target = target.clone();
    this.position = origin.clone();
    this.distance = 0;
    this.pathLength = measureTrajectory(this.origin, this.target);
    this.speed = stats.speed;
    this.damage = stats.damage;
    this.critChance = stats.critChance;
    this.critDamage = stats.critDamage;
    this.pierce = stats.pierce;
    this.hitIds = new Set();
    this.progress = 0;
    this.landed = false;
    this.dead = false;
    this.mesh = createArrowMesh();
    this.syncMesh();
  }

  update(dt) {
    this.distance += this.speed * dt;
    this.progress = Math.min(1, this.distance / this.pathLength);
    this.position.copy(sampleTrajectory(this.origin, this.target, this.progress));
    const tangent = sampleTrajectoryTangent(this.origin, this.target, this.progress);
    this.mesh.rotation.z = Math.atan2(tangent.y, tangent.x);
    this.landed = this.progress >= 1;

    if (
      this.position.x > WORLD.caveX + 230 ||
      this.position.x < WORLD.heroX - 160 ||
      this.position.y > WORLD.topY ||
      this.position.y < WORLD.bottomY
    ) {
      this.dead = true;
    }
    this.syncMesh();
  }

  syncMesh() {
    this.mesh.position.set(this.position.x, this.position.y, 20);
  }
}

export class Particle {
  constructor(position, options = {}) {
    this.age = 0;
    this.life = options.life ?? 0.6;
    this.velocity = options.velocity ?? new THREE.Vector2((Math.random() - 0.5) * 90, 80 + Math.random() * 80);
    this.mesh = createParticlePlane(options.color ?? '#ffe08a', options.size ?? 32, options.size ?? 32, options.opacity ?? 0.9);
    this.mesh.position.set(position.x, position.y, 28);
  }

  update(dt) {
    this.age += dt;
    this.mesh.position.x += this.velocity.x * dt;
    this.mesh.position.y += this.velocity.y * dt;
    this.mesh.material.opacity = Math.max(0, 1 - this.age / this.life);
    this.mesh.scale.multiplyScalar(1 + dt * 0.9);
    return this.age >= this.life;
  }
}

export class FloatingLabel {
  constructor(position, text, color = '#ffe28a') {
    this.age = 0;
    this.life = 0.82;
    this.mesh = createPlane(labelTexture(text, color), 102, 45, 30);
    this.mesh.position.set(position.x, position.y, 30);
  }

  update(dt) {
    this.age += dt;
    this.mesh.position.y += 74 * dt;
    this.mesh.material.opacity = Math.max(0, 1 - this.age / this.life);
    return this.age >= this.life;
  }
}

export function createParticlePlane(color, width, height, opacity = 1) {
  const key = `${color}-${opacity}`;
  if (!particleTextures.has(key)) {
    particleTextures.set(key, circleTexture(color, opacity));
  }
  const mesh = createPlane(particleTextures.get(key), width, height, 0);
  mesh.material.opacity = opacity;
  return mesh;
}

function createArrowMesh() {
  const group = new THREE.Group();
  const shaft = new THREE.Mesh(
    new THREE.PlaneGeometry(58, 5),
    new THREE.MeshBasicMaterial({ color: 0x3c2818, transparent: true }),
  );
  shaft.position.x = -4;
  group.add(shaft);

  const glow = new THREE.Mesh(
    new THREE.PlaneGeometry(52, 10),
    new THREE.MeshBasicMaterial({ color: 0xe7c55e, transparent: true, opacity: 0.32 }),
  );
  glow.position.x = -10;
  group.add(glow);

  const headShape = new THREE.Shape();
  headShape.moveTo(0, 0);
  headShape.lineTo(-18, 10);
  headShape.lineTo(-13, 0);
  headShape.lineTo(-18, -10);
  headShape.closePath();
  const head = new THREE.Mesh(
    new THREE.ShapeGeometry(headShape),
    new THREE.MeshBasicMaterial({ color: 0xf7dc7a, transparent: true }),
  );
  head.position.x = 34;
  group.add(head);

  const feather = new THREE.Mesh(
    new THREE.PlaneGeometry(18, 14),
    new THREE.MeshBasicMaterial({ color: 0x79b476, transparent: true, opacity: 0.92 }),
  );
  feather.position.x = -36;
  feather.rotation.z = 0.4;
  group.add(feather);
  return group;
}
