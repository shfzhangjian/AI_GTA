/**
 * 鱼类数据表（阶段 6，数据驱动核心）
 * 50 种鱼：25 普通 / 4 非普通 / 8 稀有 / 6 深海 / 5 危险 / 2 大型。
 * 群游鱼 6 种，通过 schoolSize 扩展成鱼群规模。
 * 行为仅复用模板：cruise 巡游 / school 群游 / flee 遇玩家逃跑 / charge 主动冲撞（危险鱼）。
 * 阶段 5 的 10 种保留（数值微调使深度带按 0-30/30-60/60-100/100-150/150+ 分层更均匀）。
 * 素材：Kenney Fish Pack（CC0）基础体 + tint 复用；骨架/描边变体做稀有；深海包做 deep。
 */
export type FishCategory = 'common' | 'uncommon' | 'rare' | 'deep' | 'aggressive' | 'boss';
export type FishBehavior = 'cruise' | 'school' | 'flee' | 'charge';

export interface FishDef {
  id: string;
  name: string;
  category: FishCategory;
  sprite: string;
  hp: number;
  /** 巡游速度 u/s（1u=0.1m） */
  speed: number;
  /** kg */
  weight: number;
  /** 金币价值 */
  value: number;
  /** 生成深度范围（米） */
  depthMin: number;
  depthMax: number;
  behavior: FishBehavior;
  aggressive: boolean;
  /** 1 最常见 */
  rarity: number;
  /** 表现 */
  scale: number;
  tint: string | null;
  /** school 成员数 */
  schoolSize?: number;
  /** charge 型：索敌半径 / 冲撞加速 */
  aggroRadius?: number;
}

/** 常用素材快捷 */
const S = {
  orange: '/assets/fish/common/fish_orange.png',
  blue: '/assets/fish/common/fish_blue.png',
  green: '/assets/fish/common/fish_green.png',
  brown: '/assets/fish/common/fish_brown.png',
  pink: '/assets/fish/common/fish_pink.png',
  red: '/assets/fish/common/fish_red.png',
  grey: '/assets/fish/common/fish_grey.png',
  greyLongA: '/assets/fish/common/fish_grey_long_a.png',
  greyLongB: '/assets/fish/common/fish_grey_long_b.png',
  skeletonBlue: '/assets/fish/uncommon/fish_skeleton.png',
  skeletonOrange: '/assets/fish/uncommon/fish_skeleton_orange.png',
  outlineOrange: '/assets/fish/rare/fish_orange_outline.png',
  outlineGreen: '/assets/fish/rare/fish_green_outline.png',
  deepFish: '/assets/fish/deep/depth_fish.png',
  dart: '/assets/fish/aggressive/depth_dart.png',
  big: '/assets/fish/boss/depth_big_fish.png',
} as const;

export const FISH_DEFS: FishDef[] = [
  // ═══ 阶段 5 既有 10 种（深度带微调）═══
  { id: 'clownfish', name: 'Clownfish', category: 'common', sprite: S.orange, hp: 8, speed: 55, weight: 0.4, value: 20, depthMin: 0, depthMax: 30, behavior: 'school', aggressive: false, rarity: 5, scale: 0.9, tint: null, schoolSize: 5 },
  { id: 'bluegill', name: 'Blue Gill', category: 'common', sprite: S.blue, hp: 10, speed: 70, weight: 0.7, value: 26, depthMin: 0, depthMax: 30, behavior: 'school', aggressive: false, rarity: 4, scale: 1.0, tint: null, schoolSize: 6 },
  { id: 'greenperch', name: 'Green Perch', category: 'common', sprite: S.green, hp: 12, speed: 85, weight: 1.1, value: 34, depthMin: 0, depthMax: 30, behavior: 'flee', aggressive: false, rarity: 4, scale: 1.05, tint: null },
  { id: 'browngoby', name: 'Sand Goby', category: 'common', sprite: S.brown, hp: 10, speed: 45, weight: 0.8, value: 22, depthMin: 0, depthMax: 30, behavior: 'cruise', aggressive: false, rarity: 5, scale: 0.95, tint: null },
  { id: 'pinkbass', name: 'Pink Bass', category: 'uncommon', sprite: S.pink, hp: 18, speed: 105, weight: 2.2, value: 65, depthMin: 30, depthMax: 60, behavior: 'flee', aggressive: false, rarity: 3, scale: 1.2, tint: null },
  { id: 'redsnapper', name: 'Red Snapper', category: 'uncommon', sprite: S.red, hp: 22, speed: 120, weight: 3.0, value: 90, depthMin: 30, depthMax: 60, behavior: 'flee', aggressive: false, rarity: 2, scale: 1.3, tint: null },
  { id: 'greyling', name: 'Greyling', category: 'common', sprite: S.greyLongA, hp: 14, speed: 60, weight: 1.6, value: 40, depthMin: 0, depthMax: 30, behavior: 'cruise', aggressive: false, rarity: 4, scale: 1.15, tint: null },
  { id: 'phantinfish', name: 'Phantom Fish', category: 'rare', sprite: S.skeletonBlue, hp: 16, speed: 150, weight: 1.8, value: 160, depthMin: 60, depthMax: 100, behavior: 'flee', aggressive: false, rarity: 1, scale: 1.1, tint: null },
  { id: 'ghostamber', name: 'Ghost Amber', category: 'rare', sprite: S.skeletonOrange, hp: 16, speed: 140, weight: 1.7, value: 150, depthMin: 60, depthMax: 100, behavior: 'flee', aggressive: false, rarity: 1, scale: 1.05, tint: null },
  { id: 'deepdarter', name: 'Deep Darter', category: 'deep', sprite: S.deepFish, hp: 26, speed: 110, weight: 4.5, value: 130, depthMin: 100, depthMax: 260, behavior: 'cruise', aggressive: false, rarity: 2, scale: 1.0, tint: null },

  // ═══ 普通扩展（浅水到中层，巡游/群游/逃跑混合）═══
  { id: 'sunfish', name: 'Sunfish', category: 'common', sprite: S.orange, hp: 9, speed: 60, weight: 0.6, value: 24, depthMin: 0, depthMax: 30, behavior: 'cruise', aggressive: false, rarity: 5, scale: 0.95, tint: '#ffd27f' },
  { id: 'skyminnow', name: 'Sky Minnow', category: 'common', sprite: S.blue, hp: 7, speed: 75, weight: 0.3, value: 18, depthMin: 0, depthMax: 30, behavior: 'school', aggressive: false, rarity: 6, scale: 0.8, tint: '#8fd0ff', schoolSize: 7 },
  { id: 'mossminnow', name: 'Moss Minnow', category: 'common', sprite: S.green, hp: 7, speed: 72, weight: 0.3, value: 18, depthMin: 0, depthMax: 30, behavior: 'school', aggressive: false, rarity: 6, scale: 0.8, tint: '#9fe3a0', schoolSize: 7 },
  { id: 'duskeel', name: 'Dusk Eel', category: 'common', sprite: S.greyLongB, hp: 13, speed: 52, weight: 1.5, value: 38, depthMin: 0, depthMax: 30, behavior: 'cruise', aggressive: false, rarity: 4, scale: 1.1, tint: null },
  { id: 'coppergill', name: 'Copper Gill', category: 'common', sprite: S.brown, hp: 11, speed: 64, weight: 0.9, value: 28, depthMin: 0, depthMax: 30, behavior: 'flee', aggressive: false, rarity: 4, scale: 0.95, tint: '#d9a066' },
  { id: 'peachbass', name: 'Peach Bass', category: 'common', sprite: S.pink, hp: 15, speed: 88, weight: 1.4, value: 42, depthMin: 0, depthMax: 30, behavior: 'flee', aggressive: false, rarity: 3, scale: 1.05, tint: '#ffc9a3' },
  { id: 'ashtrout', name: 'Ash Trout', category: 'common', sprite: S.grey, hp: 14, speed: 82, weight: 1.3, value: 40, depthMin: 30, depthMax: 60, behavior: 'flee', aggressive: false, rarity: 4, scale: 1.05, tint: null },
  { id: 'emberfish', name: 'Ember Fish', category: 'common', sprite: S.red, hp: 16, speed: 96, weight: 1.9, value: 52, depthMin: 30, depthMax: 60, behavior: 'flee', aggressive: false, rarity: 3, scale: 1.1, tint: '#ff9a6b' },
  { id: 'reefwhistle', name: 'Reef Whistle', category: 'common', sprite: S.blue, hp: 12, speed: 78, weight: 1.0, value: 36, depthMin: 30, depthMax: 60, behavior: 'school', aggressive: false, rarity: 4, scale: 0.9, tint: '#7fe0d5', schoolSize: 6 },
  { id: 'tawnyminnow', name: 'Tawny Minnow', category: 'common', sprite: S.orange, hp: 8, speed: 70, weight: 0.4, value: 24, depthMin: 30, depthMax: 60, behavior: 'school', aggressive: false, rarity: 5, scale: 0.8, tint: '#e6b877', schoolSize: 7 },
  { id: 'jadeperch', name: 'Jade Perch', category: 'common', sprite: S.green, hp: 13, speed: 86, weight: 1.2, value: 44, depthMin: 30, depthMax: 60, behavior: 'flee', aggressive: false, rarity: 4, scale: 1.0, tint: '#66d9a5' },
  { id: 'duskfin', name: 'Duskfin', category: 'common', sprite: S.greyLongA, hp: 15, speed: 58, weight: 1.7, value: 46, depthMin: 30, depthMax: 60, behavior: 'cruise', aggressive: false, rarity: 4, scale: 1.1, tint: '#b0a4c9' },
  { id: 'pearlscale', name: 'Pearlscale', category: 'common', sprite: S.pink, hp: 14, speed: 90, weight: 1.3, value: 48, depthMin: 0, depthMax: 30, behavior: 'flee', aggressive: false, rarity: 3, scale: 1.0, tint: '#ffe3ec' },
  { id: 'cobblefish', name: 'Cobblefish', category: 'common', sprite: S.brown, hp: 12, speed: 50, weight: 1.2, value: 32, depthMin: 30, depthMax: 60, behavior: 'cruise', aggressive: false, rarity: 4, scale: 1.0, tint: '#a08a68' },
  { id: 'seaglider', name: 'Sea Glider', category: 'common', sprite: S.greyLongB, hp: 16, speed: 66, weight: 2.0, value: 50, depthMin: 0, depthMax: 30, behavior: 'cruise', aggressive: false, rarity: 3, scale: 1.2, tint: '#c2d8e8' },
  { id: 'flametail', name: 'Flametail', category: 'common', sprite: S.red, hp: 15, speed: 100, weight: 1.6, value: 55, depthMin: 60, depthMax: 100, behavior: 'flee', aggressive: false, rarity: 3, scale: 1.05, tint: '#ff7f5e' },
  { id: 'indigojack', name: 'Indigo Jack', category: 'common', sprite: S.blue, hp: 20, speed: 108, weight: 2.6, value: 68, depthMin: 60, depthMax: 100, behavior: 'flee', aggressive: false, rarity: 3, scale: 1.15, tint: '#6f7fd0' },
  { id: 'tidecarp', name: 'Tide Carp', category: 'common', sprite: S.grey, hp: 18, speed: 76, weight: 2.4, value: 58, depthMin: 60, depthMax: 100, behavior: 'cruise', aggressive: false, rarity: 4, scale: 1.1, tint: '#8fa8b8' },
  { id: 'kelpdarter', name: 'Kelp Darter', category: 'common', sprite: S.green, hp: 14, speed: 92, weight: 1.5, value: 46, depthMin: 0, depthMax: 30, behavior: 'flee', aggressive: false, rarity: 4, scale: 0.95, tint: '#b8e07f' },
  { id: 'saltcrystal', name: 'Salt Crystal Fish', category: 'common', sprite: S.pink, hp: 13, speed: 84, weight: 1.2, value: 44, depthMin: 60, depthMax: 100, behavior: 'flee', aggressive: false, rarity: 3, scale: 0.95, tint: '#d9f0ff' },

  // ═══ 稀有/非普通 8（60-260m，速度快，价值高，描边/骨架外观）═══
  { id: 'goldenglow', name: 'Golden Glow', category: 'rare', sprite: S.outlineOrange, hp: 20, speed: 150, weight: 2.4, value: 210, depthMin: 60, depthMax: 100, behavior: 'flee', aggressive: false, rarity: 1, scale: 1.1, tint: null },
  { id: 'verdanthalo', name: 'Verdant Halo', category: 'rare', sprite: S.outlineGreen, hp: 19, speed: 145, weight: 2.2, value: 195, depthMin: 60, depthMax: 100, behavior: 'flee', aggressive: false, rarity: 1, scale: 1.05, tint: null },
  { id: 'mooneel', name: 'Moon Eel', category: 'rare', sprite: S.greyLongB, hp: 22, speed: 160, weight: 2.8, value: 240, depthMin: 60, depthMax: 100, behavior: 'flee', aggressive: false, rarity: 1, scale: 1.2, tint: '#cfd8ff' },
  { id: 'frostveil', name: 'Frost Veil', category: 'rare', sprite: S.skeletonBlue, hp: 18, speed: 155, weight: 2.0, value: 220, depthMin: 100, depthMax: 260, behavior: 'flee', aggressive: false, rarity: 1, scale: 1.0, tint: '#cfeaff' },
  { id: 'emberwraith', name: 'Ember Wraith', category: 'rare', sprite: S.skeletonOrange, hp: 18, speed: 158, weight: 2.0, value: 230, depthMin: 100, depthMax: 260, behavior: 'flee', aggressive: false, rarity: 1, scale: 1.0, tint: '#ffb38a' },
  { id: 'midnightkoi', name: 'Midnight Koi', category: 'uncommon', sprite: S.red, hp: 26, speed: 152, weight: 3.4, value: 260, depthMin: 100, depthMax: 260, behavior: 'flee', aggressive: false, rarity: 1, scale: 1.25, tint: '#b87fff' },
  { id: 'crystalback', name: 'Crystalback', category: 'rare', sprite: S.pink, hp: 21, speed: 148, weight: 2.5, value: 245, depthMin: 60, depthMax: 100, behavior: 'flee', aggressive: false, rarity: 1, scale: 1.1, tint: '#e6ffff' },
  { id: 'voidglint', name: 'Void Glint', category: 'uncommon', sprite: S.blue, hp: 24, speed: 165, weight: 3.1, value: 280, depthMin: 100, depthMax: 260, behavior: 'flee', aggressive: false, rarity: 1, scale: 1.15, tint: '#8a6fff' },

  // ═══ 深海扩展（100m+，慢速巡游、发光感）═══
  { id: 'abysslantern', name: 'Abyss Lantern', category: 'deep', sprite: S.deepFish, hp: 30, speed: 70, weight: 5.5, value: 180, depthMin: 100, depthMax: 260, behavior: 'cruise', aggressive: false, rarity: 2, scale: 1.1, tint: '#8affd8' },
  { id: 'trenchcrawler', name: 'Trench Crawler', category: 'deep', sprite: S.greyLongA, hp: 34, speed: 55, weight: 7.0, value: 200, depthMin: 100, depthMax: 260, behavior: 'cruise', aggressive: false, rarity: 2, scale: 1.2, tint: '#5f7f8f' },
  { id: 'nightveilray', name: 'Nightveil Ray', category: 'deep', sprite: S.greyLongB, hp: 40, speed: 62, weight: 9.0, value: 240, depthMin: 100, depthMax: 260, behavior: 'cruise', aggressive: false, rarity: 1, scale: 1.35, tint: '#4f5f9f' },
  { id: 'glowdrifter', name: 'Glow Drifter', category: 'deep', sprite: S.pink, hp: 24, speed: 66, weight: 3.6, value: 165, depthMin: 100, depthMax: 260, behavior: 'cruise', aggressive: false, rarity: 3, scale: 1.0, tint: '#9fffe0' },
  { id: 'darkmaw', name: 'Dark Maw', category: 'deep', sprite: S.grey, hp: 36, speed: 78, weight: 8.0, value: 250, depthMin: 100, depthMax: 260, behavior: 'cruise', aggressive: false, rarity: 1, scale: 1.3, tint: '#3f4f6f' },

  // ═══ 危险 5（charge：主动索敌冲撞，鲨鱼色/剑鱼素材）═══
  { id: 'reefshark', name: 'Reef Shark', category: 'aggressive', sprite: S.grey, hp: 60, speed: 130, weight: 30, value: 320, depthMin: 0, depthMax: 60, behavior: 'charge', aggressive: true, rarity: 1, scale: 1.6, tint: '#9fb4c4', aggroRadius: 320 },
  { id: 'blacktip', name: 'Blacktip', category: 'aggressive', sprite: S.grey, hp: 75, speed: 145, weight: 40, value: 420, depthMin: 30, depthMax: 100, behavior: 'charge', aggressive: true, rarity: 1, scale: 1.75, tint: '#5f7488', aggroRadius: 360 },
  { id: 'saberfish', name: 'Saber Fish', category: 'aggressive', sprite: S.dart, hp: 45, speed: 175, weight: 12, value: 300, depthMin: 30, depthMax: 100, behavior: 'charge', aggressive: true, rarity: 2, scale: 1.0, tint: null, aggroRadius: 300 },
  { id: 'crimsonfin', name: 'Crimson Fin', category: 'aggressive', sprite: S.red, hp: 55, speed: 150, weight: 22, value: 380, depthMin: 60, depthMax: 150, behavior: 'charge', aggressive: true, rarity: 1, scale: 1.4, tint: '#d94f4f', aggroRadius: 340 },
  { id: 'trenchfang', name: 'Trench Fang', category: 'aggressive', sprite: S.deepFish, hp: 85, speed: 140, weight: 50, value: 520, depthMin: 100, depthMax: 260, behavior: 'charge', aggressive: true, rarity: 1, scale: 1.5, tint: '#6f5f9f', aggroRadius: 400 },

  // ═══ 大型 2（boss 类：低速高值，charge 缓速）═══
  { id: 'sunkenwhale', name: 'Sunken Whale', category: 'boss', sprite: S.big, hp: 220, speed: 55, weight: 300, value: 1500, depthMin: 100, depthMax: 260, behavior: 'charge', aggressive: true, rarity: 1, scale: 1.0, tint: null, aggroRadius: 260 },
  { id: 'leviathalfish', name: 'Leviathan Calf', category: 'boss', sprite: S.big, hp: 180, speed: 68, weight: 240, value: 1200, depthMin: 60, depthMax: 150, behavior: 'charge', aggressive: true, rarity: 1, scale: 0.8, tint: '#8a9fff', aggroRadius: 300 }];

/** 深度(m)内可生成的鱼 */
export const ACTIVE_FISH_DEFS = FISH_DEFS.filter((f) => !f.aggressive && f.category !== 'boss');

export function fishAtDepth(depthM: number): FishDef[] {
  return ACTIVE_FISH_DEFS.filter((f) => depthM >= f.depthMin && depthM <= f.depthMax);
}

export const FISH_BY_ID = new Map(ACTIVE_FISH_DEFS.map((f) => [f.id, f]));
