import * as THREE from '../../libs/three.module.js';
import { WORLD } from './config.js';

const TRAJECTORY = Object.freeze({
  minArc: 10,
  maxArc: 58,
  distanceFactor: 0.034,
  verticalFactor: 0.08,
  segments: 34,
});

export function getShotOrigin() {
  return new THREE.Vector2(WORLD.heroX + 78, WORLD.laneY + 76);
}

export function clampAimTarget(target) {
  return new THREE.Vector2(
    Math.max(WORLD.heroX + 120, Math.min(WORLD.caveX + 110, target.x)),
    Math.max(WORLD.bottomY + 72, Math.min(WORLD.topY - 56, target.y)),
  );
}

export function sampleTrajectory(origin, target, t) {
  const progress = THREE.MathUtils.clamp(t, 0, 1);
  const linear = origin.clone().lerp(target, progress);
  linear.y += Math.sin(progress * Math.PI) * getArcHeight(origin, target);
  return linear;
}

export function sampleTrajectoryTangent(origin, target, t) {
  const before = sampleTrajectory(origin, target, Math.max(0, t - 0.012));
  const after = sampleTrajectory(origin, target, Math.min(1, t + 0.012));
  return after.sub(before).normalize();
}

export function buildTrajectoryPoints(origin, target, segments = TRAJECTORY.segments) {
  const points = [];
  for (let i = 0; i <= segments; i += 1) {
    const point = sampleTrajectory(origin, target, i / segments);
    points.push(new THREE.Vector3(point.x, point.y, 22));
  }
  return points;
}

export function measureTrajectory(origin, target, segments = TRAJECTORY.segments) {
  const points = buildTrajectoryPoints(origin, target, segments);
  let length = 0;
  for (let i = 1; i < points.length; i += 1) {
    length += points[i].distanceTo(points[i - 1]);
  }
  return Math.max(length, 1);
}

function getArcHeight(origin, target) {
  const distance = Math.abs(target.x - origin.x);
  const upwardAim = Math.max(0, target.y - origin.y);
  return THREE.MathUtils.clamp(
    TRAJECTORY.minArc + distance * TRAJECTORY.distanceFactor + upwardAim * TRAJECTORY.verticalFactor,
    TRAJECTORY.minArc,
    TRAJECTORY.maxArc,
  );
}
