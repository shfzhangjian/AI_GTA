/**
 * 输入系统（阶段 3）：键盘 WASD / 方向键。
 * ?devkey=1 时忽略 repeat/preventDefault（供无头脚本注入合成键）。
 */
export type AxisAction = 'moveLeft' | 'moveRight' | 'moveUp' | 'moveDown';

const DEV_KEY = new URLSearchParams(location.search).get('devkey') === '1';

const KEY_MAP: Record<string, AxisAction> = {
  KeyA: 'moveLeft',
  ArrowLeft: 'moveLeft',
  KeyD: 'moveRight',
  ArrowRight: 'moveRight',
  KeyW: 'moveUp',
  ArrowUp: 'moveUp',
  KeyS: 'moveDown',
  ArrowDown: 'moveDown',
};

export interface InputState {
  axisX(): number; // -1..1
  axisY(): number; // -1..1（上为正）
  isDown(action: AxisAction): boolean;
  dispose(): void;
}

/** headless 测试接口：按动作名直接模拟按下/松开（走与键盘相同的 active 路径） */
export interface InputTestTimers {
  press(action: string): void;
  release(action: string): void;
}

export function createInput(): InputState {
  const active = new Set<AxisAction>();

  function onKey(e: KeyboardEvent, down: boolean): void {
    const act = KEY_MAP[e.code];
    if (!act) return;
    if (!DEV_KEY) e.preventDefault(); // devkey=1（测试注入模式）不拦截合成键
    if (down) {
      active.add(act);
      window.__UE_DEBUG__.keyDownCount++;
    } else {
      window.__UE_DEBUG__.keyUpCount++;
      if (!e.repeat || DEV_KEY) active.delete(act);
    }
  }
  const kd = (e: KeyboardEvent) => onKey(e, true);
  const ku = (e: KeyboardEvent) => onKey(e, false);
  const blur = () => active.clear();
  window.addEventListener('keydown', kd);
  window.addEventListener('keyup', ku);
  window.addEventListener('blur', blur);

  // 测试注入通道（headless 无真实键盘事件时使用；与真实按键同一集合）
  const validActions = new Set<string>(['moveLeft', 'moveRight', 'moveUp', 'moveDown']);
  (window as unknown as { __UE_INPUT_TIMERS__?: InputTestTimers }).__UE_INPUT_TIMERS__ = {
    press(action) {
      if (validActions.has(action)) {
        active.add(action as AxisAction);
        window.__UE_DEBUG__.keyDownCount++;
      }
    },
    release(action) {
      if (validActions.has(action)) {
        active.delete(action as AxisAction);
        window.__UE_DEBUG__.keyUpCount++;
      }
    },
  };

  return {
    axisX() {
      return (active.has('moveRight') ? 1 : 0) - (active.has('moveLeft') ? 1 : 0);
    },
    axisY() {
      return (active.has('moveUp') ? 1 : 0) - (active.has('moveDown') ? 1 : 0);
    },
    isDown(a) {
      return active.has(a);
    },
    dispose() {
      window.removeEventListener('keydown', kd);
      window.removeEventListener('keyup', ku);
      window.removeEventListener('blur', blur);
    },
  };
}
