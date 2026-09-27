/** Game loop: fixed-timestep accumulator driving the ordered update pipeline. */
import type { Time } from './Time';

export type FrameCb = (dt: number, elapsed: number) => void;

/**
 * Order per spec: Input -> AI -> GameLogic -> FixedPhysics -> TransformSync
 * -> Animation -> Camera -> Effects -> Render.
 * The Game class registers callbacks for each slot; this class sequences them.
 */
export class GameLoop {
  private raf = 0;
  running = false;
  private lastTime = 0;

  constructor(
    private time: Time,
    private slots: {
      input: FrameCb;
      ai: FrameCb;
      logic: FrameCb;
      fixedPhysicsStep: (fixedDt: number) => void;
      transformSync: FrameCb;
      animation: FrameCb;
      camera: FrameCb;
      effects: FrameCb;
      render: FrameCb;
    },
  ) {}

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    const frame = (now: number): void => {
      if (!this.running) return;
      const dt = Math.min((now - this.lastTime) / 1000, 0.25);
      this.lastTime = now;
      this.tickOnce(dt);
      this.raf = requestAnimationFrame(frame);
    };
    this.raf = requestAnimationFrame(frame);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  /** one full frame — exposed for headless tests */
  tickOnce(dt: number): void {
    const t = this.time;
    const s = this.slots;
    t.tick(dt);

    s.input(t.delta, t.elapsed);
    // logic first (player intent + entity FSM), AI reacts to fresh state.
    // The fixed-physics step runs immediately after so nothing moves twice per frame.
    s.logic(t.simDelta, t.elapsed);
    s.ai(t.simDelta, t.elapsed);

    const steps = t.consumeFixedSteps(4);
    for (let i = 0; i < steps; i++) s.fixedPhysicsStep(t.fixedStep);

    s.transformSync(t.delta, t.elapsed);
    s.animation(t.simDelta, t.elapsed);
    s.camera(t.delta, t.elapsed);
    s.effects(t.simDelta, t.elapsed);
    s.render(t.rawDelta, t.elapsed);
  }
}
