import { Element } from '../entities/element.js';
import { VIEW } from '../config/constants.js';
import { bus } from '../utils/eventBus.js';

/**
 * 单词砖生成器 —— 每次加载关卡在顶部随机拼出一个英文单词，
 * 每个字母砖独立随机材质（相邻不重复；15% 概率是危险的炸药桶）。
 * 全部字母摧毁 → 额外奖励分 + 必定掉落一件道具。
 */
const WORDS = [
  'BRAVE', 'STORM', 'PIXEL', 'LASER', 'COMBO', 'MAGIC', 'SPARK', 'FROST',
  'GALAXY', 'NEON', 'BLITZ', 'ORBIT', 'PRISM', 'NOVA', 'HYPER', 'VOLT',
  'PHOENIX', 'THUNDER', 'QUANTUM', 'RHYTHM', 'JETPACK', 'VOLCANO', 'ZEPHYR',
];

const MATERIAL_POOL = ['glass', 'ice', 'stone', 'wood', 'metal', 'gold'];

export function buildWordRow(y = 30, cell = 30) {
  const word = WORDS[(Math.random() * WORDS.length) | 0];
  const x0 = (VIEW.width - word.length * cell) / 2;
  const elements = [];
  let prev = null;

  for (let i = 0; i < word.length; i++) {
    let key;
    do { // 随机材质，相邻字母不重复（含炸药桶）
      key = Math.random() < 0.15 ? 'explosive' : MATERIAL_POOL[(Math.random() * MATERIAL_POOL.length) | 0];
    } while (key === prev);
    prev = key;
    elements.push(new Element(key, x0 + i * cell, y, cell, cell, 0, i, word[i]));
  }

  bus.emit('word.spawn', { word, letters: elements.length });
  return { word, elements };
}
