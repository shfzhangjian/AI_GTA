import { VIEW } from '../config/constants.js';
import { bus } from '../utils/eventBus.js';

/** Input —— 键鼠/触摸统一输入状态；发射动作经总线 'input.press' 广播 */
export class Input {
  constructor(canvas) {
    this.keys = new Set();
    this.pointerX = null;
    this.mode = 'keys'; // 'pointer' | 'keys'，最近一次操作方式

    canvas.addEventListener('pointermove', e => {
      const r = canvas.getBoundingClientRect();
      this.pointerX = (e.clientX - r.left) * VIEW.width / r.width;
      this.mode = 'pointer';
    });
    canvas.addEventListener('pointerdown', () => { bus.emit('input.press', { via: 'pointer' }); });
    // 点击画布外也可发射
    window.addEventListener('pointerdown', e => {
      if (e.target !== canvas) bus.emit('input.press', { via: 'pointer-outside' });
    });

    window.addEventListener('keydown', e => {
      this.keys.add(e.key.length === 1 ? e.key.toLowerCase() : e.key);
      if ([' ', 'ArrowLeft', 'ArrowRight'].includes(e.key)) e.preventDefault();
      if (e.key === ' ') bus.emit('input.press', { via: 'space' });
    });
    window.addEventListener('keyup', e => {
      this.keys.delete(e.key.length === 1 ? e.key.toLowerCase() : e.key);
    });
  }
}
