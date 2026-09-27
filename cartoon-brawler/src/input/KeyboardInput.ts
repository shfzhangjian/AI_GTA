/** Keyboard bindings -> InputFrame. */
import type { InputFrame } from './InputManager';

export class KeyboardInput {
  private keys = new Set<string>();
  private pressedQueue = new Set<string>();
  enabled = true;

  constructor() {
    window.addEventListener('keydown', (e) => {
      if (e.repeat) return;
      this.keys.add(e.code);
      this.pressedQueue.add(e.code);
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.code)) {
        e.preventDefault();
      }
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
    window.addEventListener('blur', () => {
      this.keys.clear();
      this.pressedQueue.clear();
    });
  }

  /** Fill frame from current state; call once per frame before consumption. */
  sample(frame: InputFrame): void {
    if (!this.enabled) return;
    let mx = 0, mz = 0;
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) mx -= 1;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) mx += 1;
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) mz += 1;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) mz -= 1;
    frame.moveX = mx;
    frame.moveZ = mz;
    if (this.keys.has('ShiftLeft') || this.keys.has('ShiftRight')) frame.sprint = true;

    if (this.pressedQueue.has('KeyJ') || this.pressedQueue.has('KeyZ')) frame.pressedLight = true;
    if (this.pressedQueue.has('KeyK') || this.pressedQueue.has('KeyX')) frame.pressedHeavy = true;
    if (this.pressedQueue.has('Space') || this.pressedQueue.has('ShiftRight')) frame.pressedDodge = true;
    if (this.pressedQueue.has('KeyL') || this.pressedQueue.has('KeyC')) frame.pressedJump = true;
    if (this.pressedQueue.has('Digit1')) frame.pressedWeapon1 = true;
    if (this.pressedQueue.has('Digit2')) frame.pressedWeapon2 = true;
    if (this.pressedQueue.has('Escape') || this.pressedQueue.has('KeyP')) frame.pressedPause = true;

  }

  /** called by InputController AFTER all samplers ran */
  endFrame(): void {
    this.pressedQueue.clear();
  }

  reset(): void {
    this.keys.clear();
    this.pressedQueue.clear();
  }
}
