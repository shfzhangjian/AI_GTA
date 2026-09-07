import { BALANCE, LEVELS, SKILLS, UPGRADES } from './config.js';

const upgradeMap = new Map(UPGRADES.map((upgrade) => [upgrade.id, upgrade]));
const skillMap = new Map(SKILLS.map((skill) => [skill.id, skill]));

export class GameState extends EventTarget {
  constructor() {
    super();
    this.reset();
  }

  reset() {
    this.phase = 'ready';
    this.levelIndex = 0;
    this.score = 0;
    this.coins = 120;
    this.gourd = 85;
    this.jade = 0;
    this.grandpaHp = 100;
    this.upgrades = { bow: 1, string: 1, gourd: 0, craft: 0 };
    this.unlockedSkills = new Set(['dawa']);
    this.cooldowns = {};
    this.buffs = {};
    this.message = '青藤已醒。';
    this.setLevelSeal();
    this.emit('reset');
  }

  emit(type, detail = {}) {
    this.dispatchEvent(new CustomEvent(type, { detail }));
    this.dispatchEvent(new CustomEvent('change', { detail: { type, ...detail } }));
  }

  get level() {
    return LEVELS[this.levelIndex] ?? null;
  }

  get isFinalVictory() {
    return this.phase === 'won' && this.levelIndex >= LEVELS.length;
  }

  setLevelSeal() {
    const level = this.level;
    this.sealMax = level?.seal ?? 1;
    this.sealHp = this.sealMax;
  }

  start() {
    if (this.phase === 'ready' || this.phase === 'paused') {
      this.phase = 'playing';
      this.message = `${this.level.name} 开战。`;
      this.emit('start');
    }
  }

  togglePause() {
    if (this.phase === 'playing') {
      this.phase = 'paused';
      this.message = '弓阵暂歇。';
      this.emit('pause');
      return;
    }

    if (this.phase === 'paused') {
      this.phase = 'playing';
      this.message = '继续破阵。';
      this.emit('resume');
    }
  }

  update(dt) {
    if (this.phase !== 'playing') {
      return;
    }

    const stats = this.getResourceStats();
    this.gourd = Math.min(stats.gourdMax, this.gourd + stats.gourdRegen * dt);

    for (const key of Object.keys(this.cooldowns)) {
      this.cooldowns[key] = Math.max(0, this.cooldowns[key] - dt);
    }

    for (const key of Object.keys(this.buffs)) {
      this.buffs[key].time = Math.max(0, this.buffs[key].time - dt);
      if (this.buffs[key].time === 0) {
        delete this.buffs[key];
        this.emit('buff-expired', { id: key });
      }
    }
  }

  getUpgradeLevel(id) {
    return this.upgrades[id] ?? 0;
  }

  getUpgradeCost(id) {
    const upgrade = upgradeMap.get(id);
    const level = this.getUpgradeLevel(id);

    if (!upgrade || level >= upgrade.max) {
      return Infinity;
    }

    return Math.round(upgrade.baseCost * upgrade.growth ** level);
  }

  upgrade(id) {
    const upgrade = upgradeMap.get(id);
    const level = this.getUpgradeLevel(id);
    const cost = this.getUpgradeCost(id);

    if (!upgrade || level >= upgrade.max || this.coins < cost) {
      this.emit('denied', { reason: 'coins' });
      return false;
    }

    this.coins -= cost;
    this.upgrades[id] = level + 1;
    this.message = `${upgrade.name} 提升到 ${level + 1} 级。`;
    this.emit('upgrade', { id, level: level + 1 });
    return true;
  }

  isSkillUnlocked(id) {
    return this.unlockedSkills.has(id);
  }

  canUnlockSkill(id) {
    const skill = skillMap.get(id);
    return Boolean(
      skill &&
        !this.unlockedSkills.has(id) &&
        this.levelIndex >= skill.minLevel &&
        this.coins >= skill.unlockCost,
    );
  }

  unlockSkill(id) {
    const skill = skillMap.get(id);

    if (!skill || this.unlockedSkills.has(id)) {
      return false;
    }

    if (this.levelIndex < skill.minLevel || this.coins < skill.unlockCost) {
      this.emit('denied', { reason: 'unlock' });
      return false;
    }

    this.coins -= skill.unlockCost;
    this.unlockedSkills.add(id);
    this.message = `${skill.name} 入阵。`;
    this.emit('skill-unlocked', { id });
    return true;
  }

  canUseSkill(id) {
    const skill = skillMap.get(id);
    return Boolean(
      this.phase === 'playing' &&
        skill &&
        this.unlockedSkills.has(id) &&
        this.gourd >= skill.cost &&
        (this.cooldowns[id] ?? 0) <= 0,
    );
  }

  useSkill(id) {
    const skill = skillMap.get(id);

    if (!this.canUseSkill(id)) {
      this.emit('denied', { reason: 'skill', id });
      return false;
    }

    this.gourd -= skill.cost;
    this.cooldowns[id] = skill.cooldown;
    this.message = `${skill.name}·${skill.title}`;
    this.emit('skill', { id });
    return true;
  }

  addBuff(id, duration, value = 1) {
    this.buffs[id] = { time: duration, value };
    this.emit('buff', { id, duration, value });
  }

  hasBuff(id) {
    return Boolean(this.buffs[id]?.time > 0);
  }

  getArrowStats() {
    const bow = this.getUpgradeLevel('bow');
    const string = this.getUpgradeLevel('string');
    const craft = this.getUpgradeLevel('craft');
    const focus = this.hasBuff('focus') ? 0.28 : 0;

    return {
      damage: Math.round(BALANCE.arrowDamage + bow * 13 + craft * 4),
      speed: Math.round(BALANCE.arrowSpeed + string * 42),
      cooldown: Math.max(0.19, BALANCE.shotCooldown - string * 0.04),
      critChance: Math.min(0.68, BALANCE.critChance + craft * 0.035 + focus),
      critDamage: BALANCE.critDamage + craft * 0.06,
      pierce: bow >= 4 ? 1 : 0,
    };
  }

  getResourceStats() {
    const gourd = this.getUpgradeLevel('gourd');
    const craft = this.getUpgradeLevel('craft');

    return {
      gourdMax: BALANCE.gourdMax + gourd * 18,
      gourdRegen: BALANCE.gourdRegen + gourd * 0.75,
      coinRewardBonus: BALANCE.coinRewardBonus + craft * 0.08,
    };
  }

  rewardEnemy(enemyType) {
    const stats = this.getResourceStats();
    const coin = Math.round(enemyType.coin * (1 + stats.coinRewardBonus));
    this.coins += coin;
    this.gourd = Math.min(stats.gourdMax, this.gourd + enemyType.gourd);
    this.score += coin + enemyType.sealDamage;
    this.damageSeal(enemyType.sealDamage);
    this.emit('reward', { coin, gourd: enemyType.gourd });
  }

  damageSeal(amount) {
    if (this.phase !== 'playing') {
      return;
    }

    this.sealHp = Math.max(0, this.sealHp - amount);
    this.emit('seal-hit', { amount });
  }

  damageGrandpa(amount) {
    if (this.phase !== 'playing') {
      return;
    }

    const reduced = this.hasBuff('shield') ? Math.ceil(amount * 0.35) : amount;
    this.grandpaHp = Math.max(0, this.grandpaHp - reduced);
    this.emit('grandpa-hit', { amount: reduced });

    if (this.grandpaHp <= 0) {
      this.phase = 'lost';
      this.message = '洞府封印反噬，营救失败。';
      this.emit('lost');
    }
  }

  completeLevel() {
    if (this.phase !== 'playing') {
      return;
    }

    const level = this.level;
    this.sealHp = 0;
    this.coins += level.reward.coins;
    this.gourd = Math.min(this.getResourceStats().gourdMax, this.gourd + level.reward.gourd);
    this.jade += level.reward.jade;
    this.score += level.reward.coins + level.reward.jade * 60;
    this.emit('level-complete', { level });

    this.levelIndex += 1;
    if (this.levelIndex >= LEVELS.length) {
      this.phase = 'won';
      this.message = '石门开了，爷爷得救。';
      this.emit('won');
      return;
    }

    this.setLevelSeal();
    this.message = `${this.level.name} 待破。`;
    this.emit('level-change', { level: this.level });
  }
}
