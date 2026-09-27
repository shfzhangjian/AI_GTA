/**
 * PhysicsWorld: Rapier init (compat/wasm inlined), stepping, debug render,
 * shared helpers for collision groups.
 */
import RAPIER from '@dimforge/rapier3d-compat';
import * as THREE from 'three';
import { PHYSICS_CONFIG } from '../config/physicsConfig';

export type Physics = typeof RAPIER;

export class PhysicsWorld {
  world!: RAPIER.World;
  rapier!: Physics;

  private debugMesh: THREE.LineSegments | null = null;
  showDebug = false;

  async init(): Promise<void> {
    await RAPIER.init();
    this.rapier = RAPIER;
    const g = PHYSICS_CONFIG.gravity;
    this.world = new RAPIER.World({ x: g[0], y: g[1], z: g[2] });
    this.world.timestep = PHYSICS_CONFIG.fixedTimeStep;
  }

  /** One fixed step. */
  step(): void {
    this.world.step();
  }

  setDebugMeshTarget(scene: THREE.Scene): void {
    const geo = new THREE.BufferGeometry();
    const mat = new THREE.LineBasicMaterial({ color: 0x44ff88 });
    this.debugMesh = new THREE.LineSegments(geo, mat);
    this.debugMesh.frustumCulled = false;
    this.debugMesh.visible = false;
    scene.add(this.debugMesh);
  }

  renderDebug(): void {
    if (!this.debugMesh) return;
    this.debugMesh.visible = this.showDebug;
    if (!this.showDebug) return;
    const buffers = this.world.debugRender();
    const verts = new Float32Array(buffers.vertices);
    this.debugMesh.geometry.dispose();
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
    if (buffers.colors && buffers.colors.length >= verts.length) {
      geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(buffers.colors), 4));
    }
    this.debugMesh.geometry = geo;
  }

  /** Interaction groups helper. */
  groups(membership: number, filter: number): number {
    return (membership << 16) | filter;
  }
}
