/**
 * Collision —— 圆形 vs 世界的共享碰撞查询。
 * 供第一人称玩家与行人/动物共用，保证判定口径一致。
 */

/** @param {{boxes:THREE.Box3[],circles:{x,z,r}[]}} colliders */
export function blockedCircle(colliders, x, z, r) {
  for (const b of colliders.boxes) {
    if (x > b.min.x - r && x < b.max.x + r && z > b.min.z - r && z < b.max.z + r) return true;
  }
  for (const c of colliders.circles) {
    const dx = x - c.x;
    const dz = z - c.z;
    const rr = r + c.r;
    if (dx * dx + dz * dz < rr * rr) return true;
  }
  return false;
}
