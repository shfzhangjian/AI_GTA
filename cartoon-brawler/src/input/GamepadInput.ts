/** Gamepad bindings -> InputFrame (merged on top of keyboard each frame). */
import type { InputFrame } from './InputManager';

const DEADZONE = 0.18;

export class GamepadInput {
  private prevButtons: boolean[] = [];
  private pressedSet = new Set<number>();
  connected = false;

  constructor() {
    window.addEventListener('gamepadconnected', () => { this.connected = true; });
    window.addEventListener('gamepaddisconnected', () => {
      const pads = navigator.getGamepads?.() ?? [];
      this.connected = Array.from(pads).some((p) => p !== null);
    });
  }

  sample(frame: InputFrame): void {
    const pads = navigator.getGamepads?.();
    if (!pads) return;
    for (const pad of pads) {
      if (!pad) continue;
      this.connected = true;
      const [ax, ay] = [pad.axes[0] ?? 0, pad.axes[1] ?? 0];
      if (Math.abs(ax) > DEADZONE) frame.moveX += ax > 0 ? 1 : -1;
      if (Math.abs(ay) > DEADZONE) frame.moveZ += ay > 0 ? -1 : 1;

      const b = (i: number): { down: boolean; pressed: boolean } => {
        const btn = pad.buttons[i];
        const down = btn ? btn.pressed : false;
        const pressed = down && !this.prevButtons[i];
        if (pressed) this.pressedSet.add(i);
        return { down, pressed };
      };

      for (let i = 0; i < pad.buttons.length; i++) this.prevButtons[i] = !!pad.buttons[i]?.pressed;
      if (b(7).down || b(6).down) frame.sprint = true; // LT / RT triggers as sprint
      const was = (i: number): boolean => this.pressedSet.has(i);
      b(0); b(1); b(2); b(3); b(4); b(5); b(6); b(7); b(8); b(9); b(10); b(12);
      if (was(0) || was(2)) frame.pressedLight = true;   // A / X
      if (was(1) || was(3)) frame.pressedHeavy = true;   // B / Y
      if (was(5) || was(4)) frame.pressedDodge = true;   // RB / LB
      if (was(9) || was(12)) frame.pressedPause = true;  // start / select
      if (was(8)) frame.pressedWeapon1 = true;
      if (was(10)) frame.pressedWeapon2 = true;
      break; // first pad only
    }
  }

  endFrame(): void {
    this.pressedSet.clear();
  }
}
