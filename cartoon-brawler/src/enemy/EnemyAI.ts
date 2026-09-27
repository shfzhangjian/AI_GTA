/**
 * EnemyAI: utility-based decision making on top of the FSM.
 * Score = distance × angle × cooldown × slot × visibility (multiplicative, 0..1).
 */
import * as THREE from 'three';
import { tmp } from '../core/TempObjects';

export interface AIInput {
  distToPlayer: number;
  angleToPlayer: number;      // radians between facing and direction-to-player
  attackCooldownLeft: number; // seconds
  hasAttackSlot: boolean;
  canAttackNow: boolean;      // coordinator allows
  inSight: boolean;
  healthFrac: number;
  circleChance: number;
  preferredRange: number;
}

export type AIAction = 'attack' | 'circle' | 'approach' | 'retreat' | 'idle';

export interface AIScore {
  action: AIAction;
  scores: Record<AIAction, number>;
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

export function utilityScores(input: AIInput): AIScore {
  const d = input.distToPlayer;
  const range = input.preferredRange;

  const distanceScoreAttack = smoothstep(range * 1.6, range * 0.9, d);
  const angleScore = smoothstep(1.4, 0.35, input.angleToPlayer) * 0.7 + 0.3;
  const cooldownScore = smoothstep(0.8, 0.0, input.attackCooldownLeft);
  const slotScore = input.canAttackNow && input.hasAttackSlot ? 1 : 0.06;
  const visibilityScore = input.inSight ? 1 : 0.05;

  const attack = distanceScoreAttack * angleScore * cooldownScore * slotScore * visibilityScore;

  // circle: good at mid distance, loves it when off-angle or low hp for rogues
  const distMid = 1 - Math.abs(d - range * 1.4) / (range * 1.2);
  const circle = Math.max(0.05, distMid) * (0.35 + input.circleChance) * visibilityScore * (input.hasAttackSlot ? 0.6 : 1);

  // approach: far away or no slot
  const approach = smoothstep(range * 1.2, range * 3.2, d) * (input.hasAttackSlot ? 0.75 : 1.15) * visibilityScore;

  // retreat: low hp rogues post-attack
  const retreat = input.healthFrac < 0.35 && input.circleChance > 0.4 ? smoothstep(range * 1.8, range * 0.8, d) * 0.7 : 0.02;

  const idle = d > 26 ? 0.9 : 0.01;

  const scores: Record<AIAction, number> = { attack, circle, approach, retreat, idle };
  let best: AIAction = 'approach';
  let bestV = -Infinity;
  for (const k of Object.keys(scores) as AIAction[]) {
    if (scores[k] > bestV) { bestV = scores[k]; best = k; }
  }
  return { action: best, scores };
}

/** Simple LOS check via ray against world colliders (cheap, called ~2x/sec per enemy). */
export function hasLineOfSight(
  rapierWorld: {
    castRay: (
      ray: { origin: unknown; dir: unknown },
      maxToi: number,
      solid: boolean,
      filterFlags?: number,
      filterGroups?: number,
    ) => { toi: number } | null;
  },
  from: THREE.Vector3,
  to: THREE.Vector3,
): boolean {
  tmp.vec3A.subVectors(to, from);
  const dist = tmp.vec3A.length();
  if (dist < 0.01) return true;
  tmp.vec3A.multiplyScalar(1 / dist);
  // only WORLD membership raycasts — characters never block sight
  const filterGroups = ((WORLD_BIT << 16) | WORLD_BIT) >>> 0;
  const hit = rapierWorld.castRay(
    {
      origin: { x: from.x, y: from.y + 1.0, z: from.z },
      dir: { x: tmp.vec3A.x, y: (to.y - from.y) / dist * 0.5, z: tmp.vec3A.z },
    },
    dist,
    true,
    0,
    filterGroups,
  );
  return hit === null || hit.toi > dist * 0.97;
}

const WORLD_BIT = 1;
