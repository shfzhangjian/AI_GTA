/** Collision layer helpers built on Rapier interaction groups. */
import { COLLISION_GROUPS } from '../config/physicsConfig';

export const PhysicsGroups = COLLISION_GROUPS;

export function isLayerHit(groupAndFilter: number, layerBit: number): boolean {
  // A collider "hits" a layer when its membership or filter contains the bit.
  return (groupAndFilter & layerBit) !== 0 || ((groupAndFilter >> 16) & layerBit) !== 0;
}
