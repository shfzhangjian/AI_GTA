/** Logical input actions — everything else reads this, never raw keys. */
export type InputAction =
  | 'moveX' | 'moveZ' | 'sprint'
  | 'light' | 'heavy' | 'dodge' | 'jump'
  | 'weapon1' | 'weapon2'
  | 'pause';

/** One frame's snapshot of input intent. */
export interface InputFrame {
  moveX: number;      // -1..1 (already deadzoned)
  moveZ: number;
  sprint: boolean;
  /** edge-triggered presses this frame */
  pressedLight: boolean;
  pressedHeavy: boolean;
  pressedDodge: boolean;
  pressedJump: boolean;
  pressedWeapon1: boolean;
  pressedWeapon2: boolean;
  pressedPause: boolean;
}

export const EMPTY_FRAME: InputFrame = {
  moveX: 0, moveZ: 0, sprint: false,
  pressedLight: false, pressedHeavy: false, pressedDodge: false, pressedJump: false,
  pressedWeapon1: false, pressedWeapon2: false, pressedPause: false,
};

import { KeyboardInput } from './KeyboardInput';
import { GamepadInput } from './GamepadInput';

/** Samples keyboard + gamepad into one frame each update; owns enable/pause state. */
export class InputController {
  readonly keyboard = new KeyboardInput();
  readonly gamepad = new GamepadInput();
  readonly frame: InputFrame = { ...EMPTY_FRAME };

  set enabled(v: boolean) {
    this.keyboard.enabled = v;
  }

  update(): void {
    const f = this.frame;
    f.moveX = 0; f.moveZ = 0; f.sprint = false;
    f.pressedLight = false; f.pressedHeavy = false; f.pressedDodge = false; f.pressedJump = false;
    f.pressedWeapon1 = false; f.pressedWeapon2 = false; f.pressedPause = false;
    this.keyboard.sample(f);
    this.gamepad.sample(f);
    this.keyboard.endFrame();
    this.gamepad.endFrame();
    // clamp combined movement
    f.moveX = Math.max(-1, Math.min(1, f.moveX));
    f.moveZ = Math.max(-1, Math.min(1, f.moveZ));
  }
}

