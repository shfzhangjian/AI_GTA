/**
 * EventBus —— 全局事件总线
 * 所有生命周期事件（加载/实体生成/损伤/摧毁/碰撞/爆炸/积分/状态切换）都经此广播。
 * 调试模式通过 setRecorder() 挂接记录器，实现零侵入的事件追踪。
 */
class EventBus {
  constructor() {
    this._handlers = new Map(); // eventName -> Set<fn>
    this._recorder = null;      // (event, payload) => void
  }

  on(event, fn) {
    if (!this._handlers.has(event)) this._handlers.set(event, new Set());
    this._handlers.get(event).add(fn);
    return () => this.off(event, fn);
  }

  off(event, fn) {
    this._handlers.get(event)?.delete(fn);
  }

  /** '*' 可订阅全部事件 */
  emit(event, payload = {}) {
    this._recorder?.(event, payload);
    this._handlers.get(event)?.forEach(fn => fn(payload));
    this._handlers.get('*')?.forEach(fn => fn(event, payload));
  }

  setRecorder(fn) { this._recorder = fn; }
}

/** 单例 */
export const bus = new EventBus();
