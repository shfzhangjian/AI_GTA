/** World: level + destruction + spawn orchestration facade used by Game. */
import { Level } from './Level';
import { SpawnManager } from './SpawnManager';
import type { DestructionSystem } from './DestructionSystem';
import type { LevelInfo } from '../renderer/Environment';

export class World {
  level: Level;
  spawns: SpawnManager;

  constructor(destruction: DestructionSystem, levelInfo: LevelInfo) {
    this.level = new Level(destruction);
    this.spawns = new SpawnManager(levelInfo.waveSpawns, levelInfo.waveSpawns[levelInfo.waveSpawns.length - 1]);
  }

  build(): void {
    this.level.buildProps();
  }
}
