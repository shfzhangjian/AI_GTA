/**
 * Environment: builds the cartoon medieval level geometry + static colliders.
 * Layout (Z axis is the main path; player starts at +Z, boss arena at -Z):
 *   z 38..26  Castle Gate entrance
 *   z 26..6   Village Road (houses, carts)
 *   z 6..-10  Small Plaza (breakables hub)
 *   z -10..-20 Wooden Bridge over river
 *   z -20..-48 Boss Arena
 */
import * as THREE from 'three';
import type RAPIER from '@dimforge/rapier3d-compat';
import type { PhysicsWorld } from '../physics/PhysicsWorld';
import { PhysicsGroups } from '../physics/CollisionLayers';
import { PALETTE } from '../config/graphicsConfig';

export interface LevelInfo {
  playerSpawn: THREE.Vector3;
  waveSpawns: THREE.Vector3[][]; // per-wave spawn points in plaza area
  arenaCenter: THREE.Vector3;
  bossSpawn: THREE.Vector3;
}

function mat(color: number, rough = 0.9): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: 0.04, flatShading: false });
}

const MATS = {
  grass: mat(PALETTE.grass),
  grassDark: mat(PALETTE.grassDark),
  dirt: mat(PALETTE.dirt),
  stone: mat(PALETTE.stone),
  stoneDark: mat(PALETTE.stoneDark),
  wood: mat(PALETTE.wood),
  woodDark: mat(PALETTE.woodDark),
  woodLight: mat(PALETTE.woodLight),
  roofRed: mat(PALETTE.roofRed),
  roofBlue: mat(PALETTE.roofBlue),
  roofPurple: mat(PALETTE.roofPurple),
  metal: mat(PALETTE.metal, 0.55),
  metalDark2: mat(PALETTE.metalDark, 0.6),
  gold: mat(PALETTE.gold, 0.4),
  water: new THREE.MeshStandardMaterial({ color: PALETTE.water, roughness: 0.25, metalness: 0.1, transparent: true, opacity: 0.85 }),
} as const;

export class Environment {
  readonly root = new THREE.Group();
  info: LevelInfo = {
    playerSpawn: new THREE.Vector3(0, 1.2, 30),
    waveSpawns: [],
    arenaCenter: new THREE.Vector3(0, 0, -34),
    bossSpawn: new THREE.Vector3(0, 2, -40),
  };

  constructor(private physics: PhysicsWorld, scene: THREE.Scene) {
    scene.add(this.root);
  }

  build(): LevelInfo {
    this.buildGround();
    this.buildCastleGate();
    this.buildVillageRoad();
    this.buildPlaza();
    this.buildRiverAndBridge();
    this.buildArena();
    this.buildScatterDecor();
    return this.info;
  }

  // ---------- helpers ----------
  private addMesh(mesh: THREE.Mesh, cast = true, receive = true): THREE.Mesh {
    mesh.castShadow = cast;
    mesh.receiveShadow = receive;
    this.root.add(mesh);
    return mesh;
  }

  private box(w: number, h: number, d: number, m: THREE.Material, x: number, y: number, z: number): THREE.Mesh {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
    mesh.position.set(x, y, z);
    return this.addMesh(mesh);
  }

  private colliderBox(rb: RAPIER.RigidBody | null, hx: number, hy: number, hz: number, x: number, y: number, z: number): void {
    const desc = this.physics.rapier.ColliderDesc.cuboid(hx, hy, hz)
      .setCollisionGroups(PhysicsGroups.WORLD)
      .setTranslation(x, y, z);
    if (rb) {
      this.physics.world.createCollider(desc, rb);
    } else {
      this.physics.world.createCollider(desc);
    }
  }

  private staticBody(): RAPIER.RigidBody {
    return this.physics.world.createRigidBody(this.physics.rapier.RigidBodyDesc.fixed());
  }

  private worldStatic(): RAPIER.RigidBody {
    if (!this._worldStatic) this._worldStatic = this.staticBody();
    return this._worldStatic;
  }
  private _worldStatic: RAPIER.RigidBody | null = null;

  // ---------- ground ----------
  private buildGround(): void {
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(220, 220), MATS.grass);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.root.add(ground);

    // subtle darker grass patches for depth
    const patchGeo = new THREE.CircleGeometry(6, 12);
    for (let i = 0; i < 26; i++) {
      const p = new THREE.Mesh(patchGeo, MATS.grassDark);
      p.rotation.x = -Math.PI / 2;
      p.position.set((Math.random() - 0.5) * 120, 0.015, (Math.random() - 0.5) * 140 + 4);
      const s = 0.6 + Math.random() * 1.6;
      p.scale.set(s, s, s);
      p.receiveShadow = true;
      this.root.add(p);
    }

    // main road strip (visual)
    const road = new THREE.Mesh(new THREE.PlaneGeometry(7, 40), MATS.dirt);
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, 0.02, 16);
    road.receiveShadow = true;
    this.root.add(road);

    const plaza = new THREE.Mesh(new THREE.CircleGeometry(11, 24), MATS.dirt);
    plaza.rotation.x = -Math.PI / 2;
    plaza.position.set(0, 0.025, -2);
    plaza.receiveShadow = true;
    this.root.add(plaza);

    // physics ground
    const g = this.worldStatic();
    this.colliderBox(g, 110, 0.5, 110, 0, -0.5, 0);
  }

  // ---------- castle gate (start) ----------
  private buildCastleGate(): void {
    const g = this.worldStatic();
    // two towers
    for (const side of [-1, 1]) {
      const x = side * 6.5;
      this.box(4, 9, 4, MATS.stone, x, 4.5, 38);
      const roof = new THREE.Mesh(new THREE.ConeGeometry(3.2, 3.4, 6), MATS.roofBlue);
      roof.position.set(x, 10.6, 38);
      this.addMesh(roof);
      this.colliderBox(g, 2, 4.5, 2, x, 4.5, 38);
    }
    // gate arch beam
    this.box(17, 2.2, 3, MATS.stone, 0, 8.4, 38);
    this.colliderBox(g, 8.5, 1.1, 1.5, 0, 8.4, 38);
    // hanging banner
    const banner = this.box(2.6, 3.4, 0.1, MATS.roofRed, 0, 6.4, 36.6);
    banner.castShadow = false;
    // walls flanking (invisible-ish blockers to keep player on path)
    for (const side of [-1, 1]) {
      this.box(9, 5, 2, MATS.stoneDark, side * 14.5, 2.5, 38);
      this.colliderBox(g, 4.5, 2.5, 1, side * 14.5, 2.5, 38);
    }
    // torch posts
    for (const side of [-1, 1]) {
      this.buildTorch(side * 4.2, 36);
    }
  }

  private buildTorch(x: number, z: number): void {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 2.6, 6), MATS.woodDark);
    post.position.set(x, 1.3, z);
    this.addMesh(post);
    const flame = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffb63d }));
    flame.position.set(x, 2.75, z);
    flame.name = 'torchFlame';
    this.root.add(flame);
  }

  // ---------- village road ----------
  private buildVillageRoad(): void {
    const g = this.worldStatic();
    const houseZs = [24, 18.5, 13];
    let i = 0;
    for (const z of houseZs) {
      for (const side of [-1, 1]) {
        const roofMat = [MATS.roofRed, MATS.roofBlue, MATS.roofPurple][i % 3];
        this.buildHouse(side * 10.5, z + (i % 2) * 1.6, roofMat, 4.6 + (i % 2));
        this.colliderBox(g, 2.6, 2, 2.6, side * 10.5, 2, z + (i % 2) * 1.6);
        i++;
      }
    }
    // fences along road edges
    for (const side of [-1, 1]) {
      for (let z = 8; z <= 26; z += 3) {
        const fence = this.box(0.14, 1.0, 2.6, MATS.woodLight, side * 6.2, 0.5, z);
        fence.castShadow = false;
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 1.1, 5), MATS.woodDark);
        post.position.set(side * 6.2, 0.55, z + 1.3);
        this.addMesh(post);
      }
    }
    // well in road corner
    this.buildWell(-4.6, 21);
    this.colliderBox(g, 1.0, 0.9, 1.0, -4.6, 0.9, 21);
  }

  private buildHouse(x: number, z: number, roofMat: THREE.Material, w: number): void {
    const body = this.box(w, 3.4, w * 0.9, MATS.woodLight, x, 1.7, z);
    body.rotation.y = (x > 0 ? -1 : 1) * 0.12;
    // beams
    const beam = this.box(w + 0.15, 0.24, w * 0.9 + 0.15, MATS.woodDark, x, 2.3, z);
    beam.rotation.y = body.rotation.y;
    const roof = new THREE.Mesh(new THREE.ConeGeometry(w * 0.86, 2.4, 4), roofMat);
    roof.position.set(x, 4.5, z);
    roof.rotation.y = Math.PI / 4 + body.rotation.y;
    this.addMesh(roof);
    // door
    const door = this.box(1.0, 1.8, 0.12, MATS.woodDark, x + (x > 0 ? -w / 2 : w / 2) * 0.995, 0.9, z);
    door.rotation.y = Math.PI / 2;
    door.castShadow = false;
  }

  private buildWell(x: number, z: number): void {
    const base = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.1, 1.2, 10), MATS.stone);
    base.position.set(x, 0.6, z);
    this.addMesh(base);
    const water = new THREE.Mesh(new THREE.CircleGeometry(0.8, 10), MATS.water);
    water.rotation.x = -Math.PI / 2;
    water.position.set(x, 1.21, z);
    this.root.add(water);
    for (const s of [-1, 1]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 2.2, 5), MATS.woodDark);
      post.position.set(x + s * 0.8, 1.7, z);
      this.addMesh(post);
    }
    const roof = new THREE.Mesh(new THREE.ConeGeometry(1.4, 1.0, 4), MATS.roofRed);
    roof.position.set(x, 3.2, z);
    roof.rotation.y = Math.PI / 4;
    this.addMesh(roof);
  }

  // ---------- plaza ----------
  private buildPlaza(): void {
    const g = this.worldStatic();
    // market stalls
    for (const [x, z, m] of [[-8.5, -3, MATS.roofRed], [8.5, -1, MATS.roofBlue]] as const) {
      this.box(3.4, 0.9, 2.2, MATS.wood, x, 0.45, z);
      for (const s of [-1, 1]) {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 2.6, 5), MATS.woodDark);
        post.position.set(x + s * 1.5, 1.3, z);
        this.addMesh(post);
      }
      const awning = this.box(3.8, 0.14, 2.7, m as THREE.Material, x, 2.6, z);
      awning.rotation.z = 0.12;
      this.colliderBox(g, 1.7, 1.3, 1.1, x, 1.3, z);
    }
    // statues / pillars marking plaza->bridge
    for (const side of [-1, 1]) {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.7, 4.2, 8), MATS.stone);
      p.position.set(side * 4.6, 2.1, -9.4);
      this.addMesh(p);
      const ball = new THREE.Mesh(new THREE.SphereGeometry(0.55, 10, 8), MATS.gold);
      ball.position.set(side * 4.6, 4.5, -9.4);
      this.addMesh(ball);
      this.colliderBox(g, 0.7, 2.1, 0.7, side * 4.6, 2.1, -9.4);
    }
  }

  // ---------- river + bridge ----------
  private buildRiverAndBridge(): void {
    const g = this.worldStatic();
    // river runs along X at z ~ -15
    const river = new THREE.Mesh(new THREE.PlaneGeometry(220, 14), MATS.water);
    river.rotation.x = -Math.PI / 2;
    river.position.set(0, -0.35, -15);
    river.name = 'river';
    this.root.add(river);

    // river banks (raised lips) — visual only except blockers below
    for (const side of [-1, 1]) {
      const bank = this.box(220, 1.4, 3.5, MATS.grassDark, 0, -0.1, -15 + side * 8.6);
      bank.receiveShadow = true;
      bank.castShadow = false;
    }
    // river banks with a gap for the bridge (visual + solid)
    const bw = 96; // half-length of each bank segment beyond the bridge gap
    for (const [cx, cz] of [[-bw / 2 - 3.5, -15 + 8.2], [bw / 2 + 3.5, -15 + 8.2],
                            [-bw / 2 - 3.5, -15 - 8.2], [bw / 2 + 3.5, -15 - 8.2]] as const) {
      const bank = this.box(bw, 4, 3.2, MATS.grassDark, cx, 0, cz);
      bank.castShadow = false;
      this.colliderBox(g, bw / 2, 2, 1.6, cx, 0, cz);
    }

    // bridge deck (walkable): z from -6.8 to -23.2, width 5
    const deck = this.box(5, 0.4, 16.4, MATS.wood, 0, 0.05, -15);
    deck.receiveShadow = true;
    const deckBody = this.staticBody();
    this.colliderBox(deckBody, 2.5, 0.3, 8.2, 0, 0.02, -15);
    // rails
    for (const side of [-1, 1]) {
      for (let i = 0; i < 6; i++) {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 1.15, 5), MATS.woodDark);
        post.position.set(side * 2.35, 0.75, -8 - i * 3);
        this.addMesh(post);
      }
      const rail = this.box(0.14, 0.16, 16.4, MATS.woodLight, side * 2.35, 1.2, -15);
      rail.castShadow = false;
      // rails are triggers-free solid but thin — give them collider to block falling off
      this.colliderBox(deckBody, 0.12, 1.4, 8.2, side * 2.35, 0.9, -15);
    }
    // torches at bridge ends
    this.buildTorch(2.6, -7.4);
    this.buildTorch(-2.6, -7.4);
  }

  // ---------- boss arena ----------
  private buildArena(): void {
    const g = this.worldStatic();
    // circular stone floor
    const floor = new THREE.Mesh(new THREE.CircleGeometry(13.5, 28), MATS.stoneDark);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0.03, -34);
    floor.receiveShadow = true;
    this.root.add(floor);

    // broken ring of pillars (arena bounds) — leave entrance gap at +Z
    const count = 14;
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      // gap around the entrance (facing +Z, angle ~ PI/2 region relative center)
      const zc = -34 + Math.sin(a) * 13.5;
      if (zc > -23.5 && Math.abs(Math.cos(a)) < 0.42) continue;
      const x = Math.cos(a) * 13.5;
      const h = 3.4 + (i % 3) * 1.4;
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.75, h, 8), MATS.stone);
      p.position.set(x, h / 2, zc);
      this.addMesh(p);
      this.colliderBox(g, 0.75, h / 2, 0.75, x, h / 2, zc);
    }

    // boss entrance gate frame
    for (const side of [-1, 1]) {
      this.box(2.4, 6.5, 2.4, MATS.stoneDark, side * 3.8, 3.25, -21.5);
      this.colliderBox(g, 1.2, 3.25, 1.2, side * 3.8, 3.25, -21.5);
    }
    this.box(10, 1.6, 2.2, MATS.stoneDark, 0, 7.2, -21.5);
    this.colliderBox(g, 5, 0.8, 1.1, 0, 7.2, -21.5);

    // braziers
    for (const side of [-1, 1]) {
      const b = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.3, 0.9, 8), MATS.metal);
      b.position.set(side * 6.2, 1.1, -24.5);
      this.addMesh(b);
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 1.8, 6), MATS.metalDark2);
      stem.position.set(side * 6.2, 0.9, -24.5);
      this.addMesh(stem);
      const flame = new THREE.Mesh(new THREE.SphereGeometry(0.34, 8, 6), new THREE.MeshBasicMaterial({ color: 0xff8a3d }));
      flame.position.set(side * 6.2, 1.8, -24.5);
      flame.name = 'torchFlame';
      this.root.add(flame);
    }

    // spawn points for the final mixed wave
    this.info.waveSpawns.push([
      new THREE.Vector3(-7, 1, -30),
      new THREE.Vector3(7, 1, -30),
      new THREE.Vector3(-9, 1, -38),
      new THREE.Vector3(9, 1, -38),
    ]);
  }

  // ---------- scatter decor (trees/rocks) ----------
  private buildScatterDecor(): void {
    const g = this.worldStatic();
    const rng = mulberry32(1337);
    for (let i = 0; i < 34; i++) {
      const x = (rng() - 0.5) * 130;
      const z = (rng() - 0.5) * 150 + 2;
      if (Math.abs(x) < 9 && z > -46 && z < 42) continue; // keep path clear
      if (Math.hypot(x, z + 34) < 17) continue; // arena clear
      if (rng() < 0.65) this.buildTree(x, z, rng);
      else {
        const r = 0.5 + rng() * 1.2;
        const rock = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 0), MATS.stoneDark);
        rock.position.set(x, r * 0.55, z);
        rock.rotation.set(rng(), rng(), rng());
        this.addMesh(rock);
        this.colliderBox(g, r * 0.8, r * 0.7, r * 0.8, x, r * 0.6, z);
      }
    }

    // wave spawn points: plaza + road ambush points
    this.info.waveSpawns = [
      [
        new THREE.Vector3(-5, 1, 4), new THREE.Vector3(5, 1, 4), new THREE.Vector3(0, 1, -6),
      ],
      [
        new THREE.Vector3(-8, 1, -2), new THREE.Vector3(8, 1, -2), new THREE.Vector3(-4, 1, -9),
        new THREE.Vector3(4, 1, -9), new THREE.Vector3(0, 1, 6),
      ],
    ];
  }

  private buildTree(x: number, z: number, rng: () => number): void {
    const h = 2.2 + rng() * 1.8;
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.34, h, 6), MATS.woodDark);
    trunk.position.set(x, h / 2, z);
    this.addMesh(trunk);
    const r = 1.4 + rng() * 1.1;
    const leaves = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 0), MATS.grassDark);
    leaves.position.set(x, h + r * 0.55, z);
    leaves.rotation.set(rng(), rng(), rng());
    this.addMesh(leaves);
    this.colliderBox(this.worldStatic(), 0.34, h / 2, 0.34, x, h / 2, z);
  }

  /** Animate water + torch flames. */
  update(time: number): void {
    const river = this.root.getObjectByName('river');
    if (river) river.position.y = -0.35 + Math.sin(time * 1.4) * 0.06;
    for (const f of this.torchFlames()) {
      const s = 1 + Math.sin(time * 9 + f.position.x * 3.1) * 0.18;
      f.scale.setScalar(s);
    }
  }

  private flameCache: THREE.Object3D[] | null = null;
  private torchFlames(): THREE.Object3D[] {
    if (!this.flameCache) {
      this.flameCache = [];
      this.root.traverse((o) => {
        if (o.name === 'torchFlame') this.flameCache!.push(o);
      });
    }
    return this.flameCache;
  }
}

// tiny seeded rng for deterministic scatter
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
