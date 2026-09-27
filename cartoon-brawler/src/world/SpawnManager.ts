/** SpawnManager: wave progression + boss trigger. */
import * as THREE from 'three';
import { WAVES } from '../config/gameConfig';
import type { EnemyKind } from '../enemy/Enemy';

export interface WaveDef {
  label: string;
  spawns: { kind: EnemyKind; pos: THREE.Vector3 }[];
}

export class SpawnManager {
  waveIndex = 0;
  totalWaves: number;
  private aliveInWave = 0;
  private clearTimer = -1;
  onWave: ((wave: WaveDef, index: number) => void) | null = null;
  onBossTrigger: (() => void) | null = null;
  private bossTriggered = false;

  constructor(private levelSpawns: THREE.Vector3[][], private arenaSpawns: THREE.Vector3[]) {
    this.totalWaves = 3;
  }

  buildWave(index: number): WaveDef {
    const pick = (i: number, pool: THREE.Vector3[]): THREE.Vector3 => pool[i % pool.length].clone();
    if (index === 0) {
      return {
        label: 'AMBUSH ON THE ROAD',
        spawns: [
          { kind: 'swordsman', pos: pick(0, this.levelSpawns[0]) },
          { kind: 'swordsman', pos: pick(1, this.levelSpawns[0]) },
          { kind: 'rogue', pos: pick(2, this.levelSpawns[0]) },
        ],
      };
    }
    if (index === 1) {
      const pool = this.levelSpawns[1];
      return {
        label: 'THE PLAZA IS HELD',
        spawns: [
          { kind: 'swordsman', pos: pick(0, pool) },
          { kind: 'brute', pos: pick(1, pool) },
          { kind: 'rogue', pos: pick(2, pool) },
          { kind: 'swordsman', pos: pick(3, pool) },
          { kind: 'rogue', pos: pick(4, pool) },
        ],
      };
    }
    // mixed wave in the arena antechamber
    const pool = this.arenaSpawns;
    return {
      label: 'GUARDS OF THE ARENA',
      spawns: [
        { kind: 'brute', pos: pick(0, pool) },
        { kind: 'swordsman', pos: pick(1, pool) },
        { kind: 'rogue', pos: pick(2, pool) },
        { kind: 'swordsman', pos: pick(3, pool) },
      ],
    };
  }

  startWave(index: number): void {
    this.waveIndex = index;
    const wave = this.buildWave(index);
    this.aliveInWave = wave.spawns.length;
    this.onWave?.(wave, index);
  }

  notifyKilled(): void {
    this.aliveInWave--;
    if (this.aliveInWave <= 0 && this.clearTimer < 0) {
      this.clearTimer = WAVES.waveClearDelay;
    }
  }

  /** returns event when wave cleared */
  update(dt: number): 'next' | 'boss' | null {
    if (this.clearTimer > 0) {
      this.clearTimer -= dt;
      if (this.clearTimer <= 0) {
        this.clearTimer = -1;
        if (this.waveIndex + 1 < this.totalWaves) return 'next';
        if (!this.bossTriggered) {
          this.bossTriggered = true;
          return 'boss';
        }
      }
    }
    return null;
  }

  reset(): void {
    this.waveIndex = 0;
    this.aliveInWave = 0;
    this.clearTimer = -1;
    this.bossTriggered = false;
  }
}
