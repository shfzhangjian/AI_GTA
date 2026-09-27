// Sketch Wave Racer — 键盘输入（Phase 1）
// 动作语义化（不绑死键位），Phase 7 加手柄 / 触摸时只需扩展此模块。

const DEFAULT_BINDS = {
  throttle: ["KeyW", "ArrowUp"],
  brake: ["KeyS", "ArrowDown"],
  left: ["KeyA", "ArrowLeft"],
  right: ["KeyD", "ArrowRight"],
  drift: ["ShiftLeft", "ShiftRight"], // Phase 3 启用
  item: ["Space"], // Phase 5 启用
  reset: ["KeyR"], // Phase 2 启用
  pause: ["Escape"], // Phase 4 启用
};

export class InputState {
  constructor() {
    this.down = new Set();
    this.pressed = new Set;
    this.binds = DEFAULT_BINDS;
    this._keyToAction = new Map();
    for (const [action, codes] of Object.entries(this.binds)) {
      for (const c of codes) this._keyToAction.set(c, action);
    }

    window.addEventListener("keydown", (e) => {
      if (e.repeat) return;
      const action = this._keyToAction.get(e.code);
      if (!action) return;
      e.preventDefault();
      this.down.add(action);
      this.pressed.add(action);
    });
    window.addEventListener("keyup", (e) => {
      const action = this._keyToAction.get(e.code);
      if (!action) return;
      this.down.delete(action);
    });
    // 失焦清空，防止卡键
    window.addEventListener("blur", () => this.down.clear());
  }

  isDown(action) {
    return this.down.has(action);
  }

  // 本帧刚按下（消费式）。主循环末尾调用 endFrame 清空。
  wasPressed(action) {
    return this.pressed.has(action);
  }

  endFrame() {
    this.pressed.clear();
  }
}
