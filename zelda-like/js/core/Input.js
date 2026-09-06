// 输入管理：鼠标事件绑到 window（避免 canvas 被 UI 遮挡时收不到点击）
export class Input {
  constructor() {
    this.keys = new Set();
    this.mouseLeft = false;
    this.mouseRight = false;
    this.mouseMoved = false;
    this.mx = 0;
    this.my = 0;
    // 左键边沿（单次按下触发一次）
    this._leftPressed = false;
    this._leftLatch = false;
    this.leftTap = false;

    window.addEventListener('keydown', e => {
      if (['Space', 'ArrowUp', 'ArrowDown'].includes(e.code)) e.preventDefault();
      this.keys.add(e.code);
    });
    window.addEventListener('keyup', e => this.keys.delete(e.code));

    window.addEventListener('mousedown', e => {
      if (e.button === 0) { this.mouseLeft = true; this._leftPressed = true; }
      if (e.button === 2) this.mouseRight = true;
    });
    window.addEventListener('mouseup', e => {
      if (e.button === 0) this.mouseLeft = false;
      if (e.button === 2) this.mouseRight = false;
    });
    window.addEventListener('blur', () => {
      this.keys.clear();
      this.mouseLeft = this.mouseRight = false;
    });
    document.addEventListener('contextmenu', e => e.preventDefault());
    window.addEventListener('mousemove', e => { this.mouseMoved = true; this.mx = e.clientX; this.my = e.clientY; });
    // 触摸：当左键处理（长按可连续攻击）
    window.addEventListener('touchstart', e => { this.mouseLeft = true; this._leftPressed = true; }, { passive: true });
    window.addEventListener('touchend', () => { this.mouseLeft = false; });
    window.addEventListener('touchcancel', () => { this.mouseLeft = false; });
  }
  key(code) { return this.keys.has(code); }
  // 左键本帧是否刚按下（边沿触发，适合单次攻击）
  consumeLeftTap() {
    if (this._leftPressed && !this._leftLatch) { this._leftLatch = true; return true; }
    if (!this._leftPressed) this._leftLatch = false;
    return false;
  }
}
