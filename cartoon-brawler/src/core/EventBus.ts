/** Typed event bus used to decouple systems (combat -> UI, world -> audio...). */

export interface GameEvents {
  'player:hit': { damage: number; health: number; maxHealth: number };
  'player:died': Record<string, never>;
  'enemy:killed': { kind: string };
  'boss:appeared': { name: string; maxHealth: number };
  'boss:hit': { health: number; maxHealth: number };
  'boss:died': Record<string, never>;
  'game:victory': Record<string, never>;
  'game:over': Record<string, never>;
  'game:restart': Record<string, never>;
  'wave:start': { index: number; label: string };
  'combo:changed': { count: number };
  'weapon:changed': { weapon: 'sword' | 'hammer' };
  'impact': { x: number; y: number; z: number; power: number; kind: ImpactKind };
}

export type ImpactKind = 'hit' | 'heavy' | 'break' | 'world' | 'death' | 'boss';

type Handler<T> = (payload: T) => void;

export class EventBus {
  private handlers = new Map<keyof GameEvents, Set<Handler<GameEvents[keyof GameEvents]>>>();

  on<K extends keyof GameEvents>(event: K, handler: Handler<GameEvents[K]>): () => void {
    let set = this.handlers.get(event);
    if (!set) {
      set = new Set();
      this.handlers.set(event, set);
    }
    set.add(handler as Handler<GameEvents[keyof GameEvents]>);
    return () => this.off(event, handler);
  }

  off<K extends keyof GameEvents>(event: K, handler: Handler<GameEvents[K]>): void {
    this.handlers.get(event)?.delete(handler as Handler<GameEvents[keyof GameEvents]>);
  }

  emit<K extends keyof GameEvents>(event: K, payload: GameEvents[K]): void {
    const set = this.handlers.get(event);
    if (!set) return;
    for (const h of set) {
      (h as Handler<GameEvents[K]>)(payload);
    }
  }

  clear(): void {
    this.handlers.clear();
  }
}
