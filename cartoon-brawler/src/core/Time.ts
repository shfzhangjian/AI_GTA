/**
 * Time: frame delta, scaled simulation time (hitstop / pause), fixed accumulator.
 * HitStop slows `simDelta` only — UI and rendering keep running at real time.
 */

export class Time {
  /** Real seconds since last frame (unbounded). */
  rawDelta = 0;
  /** Real delta clamped for gameplay sanity. */
  delta = 0;
  /** Simulation delta after hitstop scaling — what AI/logic/physics should use. */
  simDelta = 0;
  elapsed = 0;
  frame = 0;

  private hitStopRemaining = 0;
  private hitStopScale = 1;
  paused = false;

  private accumulator = 0;
  readonly fixedStep: number;

  constructor(fixedStep: number) {
    this.fixedStep = fixedStep;
  }

  /** Begin a hitstop: simulation time runs at `scale` (e.g. 0.05) for `duration`. */
  hitStop(duration: number, scale = 0.06): void {
    // Refresh if a new hitstop arrives during one — prefer the stronger freeze.
    if (duration >= this.hitStopRemaining || scale <= this.hitStopScale) {
      this.hitStopRemaining = Math.max(this.hitStopRemaining, duration);
      this.hitStopScale = scale;
    }
  }

  get inHitStop(): boolean {
    return this.hitStopRemaining > 0;
  }

  /** Called once per rendered frame with real (rAF) delta seconds. */
  tick(realDelta: number): void {
    const dt = Math.min(realDelta, 1 / 5); // clamp tab-switch spikes
    this.rawDelta = realDelta;
    this.delta = dt;
    this.frame++;

    if (this.paused) {
      this.simDelta = 0;
      return;
    }

    let scale = 1;
    if (this.hitStopRemaining > 0) {
      this.hitStopRemaining -= dt;
      scale = this.hitStopScale;
      if (this.hitStopRemaining <= 0) this.hitStopScale = 1;
    }
    this.simDelta = dt * scale;
    this.elapsed += this.simDelta;

    this.accumulator += Math.min(this.simDelta, 0.25);
  }

  /** Consume fixed steps for physics. Returns number of steps to run (capped). */
  consumeFixedSteps(maxSteps: number): number {
    let steps = 0;
    while (this.accumulator >= this.fixedStep && steps < maxSteps) {
      this.accumulator -= this.fixedStep;
      steps++;
    }
    // Avoid spiral of death: drop leftover time when we had to bail out.
    if (steps === maxSteps && this.accumulator > this.fixedStep * 2) {
      this.accumulator = 0;
    }
    return steps;
  }

  reset(): void {
    this.hitStopRemaining = 0;
    this.hitStopScale = 1;
    this.accumulator = 0;
    this.elapsed = 0;
  }
}
