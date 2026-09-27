/** Shared FSM contract used by player and enemy state machines. */

export interface StateContext {
  canMove: boolean;
  canRotate: boolean;
  canAttack: boolean;
  canDodge: boolean;
  canReceiveHit: boolean;
  invincible: boolean;
}

export function defaultContext(): StateContext {
  return {
    canMove: true,
    canRotate: true,
    canAttack: true,
    canDodge: true,
    canReceiveHit: true,
    invincible: false,
  };
}

export interface State<TCtx> {
  readonly name: string;
  enter(ctx: TCtx): void;
  update(dt: number, ctx: TCtx): void;
  exit(ctx: TCtx): void;
}

export class StateMachine<TCtx> {
  current: State<TCtx>;
  private map = new Map<string, State<TCtx>>();

  constructor(initial: State<TCtx>) {
    this.current = initial;
    this.map.set(initial.name, initial);
  }

  add(state: State<TCtx>): void {
    this.map.set(state.name, state);
  }

  get stateName(): string {
    return this.current.name;
  }

  transition(name: string, ctx: TCtx): boolean {
    const next = this.map.get(name);
    if (!next || next === this.current) return false;
    this.current.exit(ctx);
    this.current = next;
    next.enter(ctx);
    return true;
  }

  update(dt: number, ctx: TCtx): void {
    this.current.update(dt, ctx);
  }
}
