/** Physics debug visualization is driven from PhysicsWorld.renderDebug(); this module exposes toggles. */
import type { PhysicsWorld } from './PhysicsWorld';

export class PhysicsDebug {
  constructor(private physics: PhysicsWorld) {}

  setEnabled(v: boolean): void {
    this.physics.showDebug = v;
  }
}
