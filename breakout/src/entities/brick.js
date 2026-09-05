import { Element, ELEMENTS } from './element.js';
import { bus } from '../utils/eventBus.js';

/**
 * Brick —— “自由建模”容器：
 * 砖块由一个字符网格（cells）描述，每格引用一种元素类型，
 * 加载时展开为若干可独立破坏的 Element。
 * 支持关卡内共享模型库（level.models），多处复用同一造型。
 */
export class Brick {
  /**
   * @param spec  { x, y, cells: string[] , name? }
   * @param cellSize 每个元素单元的像素尺寸
   * @param resolveKey (token:string) => elementKey|null（'.'/' ' 返回 null 表示空格）
   */
  constructor(spec, cellSize, resolveKey) {
    this.name = spec.name || 'brick';
    this.cellSize = cellSize;
    this.elements = [];

    const rows = spec.cells.length;
    const cols = Math.max(...spec.cells.map(r => r.length));

    for (let r = 0; r < rows; r++) {
      const row = spec.cells[r];
      // 支持两种写法：单字符别名（"SSG"）或多字符 token（"stone,glass" 以逗号分隔）
      const tokens = row.includes(',') ? row.split(',') : [...row];
      for (let c = 0; c < tokens.length; c++) {
        const key = resolveKey(tokens[c].trim());
        if (!key) continue;
        if (!(key in ELEMENTS)) {
          bus.emit('load.warning', { msg: `未知元素 "${tokens[c]}"，已跳过` });
          continue;
        }
        this.elements.push(new Element(key, spec.x + c * cellSize, spec.y + r * cellSize, cellSize, cellSize, r, c));
      }
    }

    this.w = cols * cellSize;
    this.h = rows * cellSize;
    bus.emit('entity.spawn', { kind: 'brick', name: this.name, elements: this.elements.length, x: spec.x, y: spec.y });
  }

  aliveCount() { return this.elements.reduce((n, e) => n + (e.alive ? 1 : 0), 0); }
}
