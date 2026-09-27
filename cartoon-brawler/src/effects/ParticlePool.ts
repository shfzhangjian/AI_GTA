/** Generic object pool: acquire/release, keeps three.js objects alive. */

export interface Poolable {
  /** called on acquire — reset state */
  onAcquire?: () => void;
  onRelease?: () => void;
}

export class ObjectPool<T extends Poolable> {
  private free: T[] = [];
  activeCount = 0;

  constructor(
    private factory: () => T,
    prewarm = 0,
  ) {
    for (let i = 0; i < prewarm; i++) this.free.push(factory());
  }

  acquire(): T {
    const obj = this.free.pop() ?? this.factory();
    obj.onAcquire?.();
    this.activeCount++;
    return obj;
  }

  release(obj: T): void {
    obj.onRelease?.();
    this.activeCount--;
    if (this.free.length < 128) this.free.push(obj);
  }

  get pooled(): number {
    return this.free.length;
  }
}
