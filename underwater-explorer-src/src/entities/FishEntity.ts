/**
 * 鱼实体（阶段 5）：位置/速度/朝向/状态 + 行为模板驱动。
 * 行为模板（复用，非一鱼一套）：cruise 巡游 / school 群游 / flee 遇玩家逃跑。
 * HP 与捕获状态（阶段 7 鱼叉接入）。
 */
import * as THREE from 'three';
import type { FishDef } from '../data/fish';

export type FishBehaviorName = 'cruise' | 'school' | 'flee' | 'charge';

export interface FishEntity {
  def: FishDef;
  pos: THREE.Vector3;
  vel: THREE.Vector2;
  facing: 1 | -1;
  /** 群游时指向领队（school 追随） */
  leader: FishEntity | null;
  schoolOffset: THREE.Vector2 | null;
  alive: boolean;
  hp: number;
  state: 'active' | 'fleeing' | 'dead';
  /** 生成时深度（米，数据合规审计） */
  spawnDepth: number;
  /** 行为私有计时器 */
  timer: number;
  /** 攻击潜水员后的冷却，避免贴身时每帧扣血 */
  attackCooldown: number;
  /** 碰撞避让方向：短时间锁定，避免鱼被玩家顶着走 */
  panicDir: THREE.Vector2 | null;
  wander: number;
}

export function createFish(def: FishDef, x: number, y: number): FishEntity {
  return {
    def,
    pos: new THREE.Vector3(x, y, 0),
    vel: new THREE.Vector2(def.speed * (Math.random() > 0.5 ? 1 : -1), 0),
    facing: 1,
    leader: null,
    schoolOffset: null,
    alive: true,
    hp: def.hp,
    spawnDepth: Math.max(0, -y) / 10,
    state: 'active',
    timer: Math.random() * 4,
    attackCooldown: 0,
    panicDir: null,
    wander: Math.random() * Math.PI * 2,
  };
}
