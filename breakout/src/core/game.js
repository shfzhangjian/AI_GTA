import { VIEW, PHYSICS, PADDLE, BALL, START_LIVES } from '../config/constants.js';
import { bus } from '../utils/eventBus.js';
import { clamp } from '../utils/math.js';
import { Ball } from '../entities/ball.js';
import { Paddle } from '../entities/paddle.js';
import { PowerUp, POWERUPS, rollDropType } from '../entities/powerup.js';
import { Input } from './input.js';
import { AssetLoader } from './assets.js';
import { Renderer } from '../render/renderer.js';
import { ParticleSystem } from '../effects/particles.js';
import { ScoreEngine } from '../score/scoreEngine.js';
import { audio } from '../audio/audioEngine.js';
import { loadLevel, LEVEL_FILES } from '../level/levelLoader.js';
import { buildWordRow } from '../level/wordFactory.js';
import { circleRectHit, reflect } from '../physics/collision.js';

/** 掉落概率：炸药必掉、金块 35%、其他 10% */
function rollDrop(key) {
  const p = key === 'explosive' ? 1 : key === 'gold' ? .35 : .10;
  return Math.random() < p ? rollDropType() : null;
}

/**
 * Game —— 主控：状态机 + 固定子步物理 + 碰撞调度 + 爆炸队列 + 道具/子弹/火球。
 *
 * 状态流转: boot → ready ⇄ playing ⇄ paused → clear → (下一关 ready | win) / gameover
 */
export class Game {
  constructor(canvas, { debug = false } = {}) {
    this.debug = debug;
    this.assets = new AssetLoader();
    this.input = new Input(canvas);
    this.renderer = new Renderer(canvas);
    this.fx = new ParticleSystem();
    this.score = new ScoreEngine();
    this.paddle = new Paddle();

    this.balls = [];            // 多球支持（道具分裂）
    this.powerups = [];         // 坠落道具
    this.bullets = [];          // 火球模式下的挡板子弹
    this.timers = { wide: 0, narrow: 0, fire: 0 };
    this._bulletCd = 0;

    this.state = 'boot';
    this.levelIndex = 0;
    this.lives = START_LIVES;
    this.baseSpeed = 330;
    this.remaining = 0;
    this.time = 0;
    this.acc = 0;
    this.fps = 60;
    this.shakeT = 0; this.shakeDur = .3; this.shakeMag = 8;
    this.pendingExplosions = []; // 延迟起爆队列 → 连锁爆炸节奏
    this.clearTimer = -1;
    this.level = { json: {}, bricks: [], elements: [] };
    this.word = null;            // 顶部单词砖 {word, elements:Set}
    this.bgCanvas = null;
    this._lastTs = 0;

    bus.on('input.press', () => {
      audio.ensure(); // 首次手势解锁音频
      if (this.state === 'ready' || (this.state === 'playing' && this.balls.some(b => b.stuck))) {
        this.launchBall();
      } else if (this.state === 'playing') {
        this.tryFire(); // 火球模式下空格 = 开炮
      }
    });

    window.addEventListener('keydown', e => {
      const k = e.key.toLowerCase();
      if (k === 'p' && (this.state === 'playing' || this.state === 'paused')) this._togglePause();
      else if (k === 'm') { audio.enabled = !audio.enabled; bus.emit('game.mute', { muted: !audio.enabled }); }
      else if (k === 'r' && (this.state === 'gameover' || this.state === 'win')) this.restartRun();
      else if (k === 'x' && this.state === 'playing') this.tryFire();
      else if (e.key === 'F2') { e.preventDefault(); this.debug = !this.debug; bus.emit('debug.toggle', { on: this.debug }); }
    });
  }

  get fireActive() { return this.timers.fire > 0; }

  async start() {
    await this.loadLevel(0);
    requestAnimationFrame(ts => this._frame(ts));
  }

  async loadLevel(i) {
    this.levelIndex = i;
    this.level = await loadLevel(LEVEL_FILES[i], this.assets);
    this.bgCanvas = this.level.bgCanvas;

    // 顶部单词砖：随机英文单词，逐字母随机材质
    const word = buildWordRow(30, 30);
    this.word = { word: word.word, elements: new Set(word.elements) };
    this.level.elements.push(...word.elements);
    bus.emit('entity.spawn', { kind: 'word', word: word.word, x: 'top' });

    this.remaining = this.level.elements.length;
    this.baseSpeed = this.level.json.ballSpeed || 330;
    this.fx.clear();
    this.pendingExplosions.length = 0;
    this.powerups.length = 0;
    this.bullets.length = 0;
    this.timers.wide = this.timers.narrow = this.timers.fire = 0;
    this.paddle.w = PADDLE.w;
    this.clearTimer = -1;
    this.resetBallOnPaddle();
    this._setState('ready');
  }

  resetBallOnPaddle() {
    this.balls = [new Ball()];
    const b = this.balls[0];
    b.reset(this.paddle.x, this.paddle.y - PADDLE.h / 2 - BALL.r - 1);
  }

  launchBall() {
    for (const b of this.balls) if (b.stuck) b.launch(this.baseSpeed);
    audio.play('launch');
    bus.emit('game.launch', { speed: Math.round(this.baseSpeed), balls: this.balls.length });
    if (this.state === 'ready') this._setState('playing');
  }

  _setState(s) {
    this.state = s;
    bus.emit('game.state', { state: s });
  }

  _togglePause() {
    this._setState(this.state === 'paused' ? 'playing' : 'paused');
  }

  restartRun() {
    this.lives = START_LIVES;
    this.score.reset();
    bus.emit('game.restart', {});
    this.loadLevel(0);
  }

  shake(dur, mag) { this.shakeDur = dur; this.shakeT = dur; this.shakeMag = mag; }

  // ---------------- 主循环 ----------------
  _frame(ts) {
    const dt = Math.min((ts - this._lastTs) / 1000, .05);
    this._lastTs = ts;
    if (dt > 0) this.fps = this.fps * .92 + (1 / dt) * .08;

    this.update(dt);
    this.renderer.draw(this);
    requestAnimationFrame(t => this._frame(t));
  }

  update(dt) {
    this.time += dt;
    if (this.shakeT > 0) this.shakeT -= dt;
    this.score.update(dt);
    this.fx.update(dt);

    if (this.state === 'playing') {
      // 道具计时器 → 挡板宽度
      for (const k of ['wide', 'narrow', 'fire']) this.timers[k] = Math.max(0, this.timers[k] - dt);
      this._bulletCd = Math.max(0, this._bulletCd - dt);
      const scale = this.timers.wide > 0 ? 1.6 : this.timers.narrow > 0 ? .62 : 1;
      this.paddle.w = PADDLE.w * scale;

      // 火球拖尾火焰
      if (this.fireActive) for (const b of this.balls) if (!b.stuck) this.fx.flame(b.x, b.y);

      this.paddle.update(dt, this.input);
      this.acc += dt;
      let guard = 0;
      while (this.acc >= PHYSICS.step && guard++ < 12) {
        this._substep(PHYSICS.step);
        this.acc -= PHYSICS.step;
        if (this.state !== 'playing') break;
      }
    } else if (this.state === 'ready') {
      this.paddle.update(dt, this.input);
      for (const b of this.balls) if (b.stuck) {
        b.x = this.paddle.x;
        b.y = this.paddle.y - PADDLE.h / 2 - BALL.r - 1;
      }
    }

    if (this.clearTimer > 0) {
      this.clearTimer -= dt;
      if (this.clearTimer <= 0) this._nextLevel();
    }
  }

  // ---------------- 物理子步 ----------------
  _substep(h) {
    const r = BALL.r;

    for (let bi = this.balls.length - 1; bi >= 0; bi--) {
      const b = this.balls[bi];
      if (b.stuck) {
        b.x = this.paddle.x;
        b.y = this.paddle.y - PADDLE.h / 2 - BALL.r - 1;
        continue;
      }
      b.update(h);

      // 墙壁
      if (b.x - r < 0) { b.x = r; b.vx = Math.abs(b.vx); this._wallBounce(); }
      else if (b.x + r > VIEW.width) { b.x = VIEW.width - r; b.vx = -Math.abs(b.vx); this._wallBounce(); }
      if (b.y - r < 0) { b.y = r; b.vy = Math.abs(b.vy); this._wallBounce(); }

      // 底部漏球：移除该球，全部失去才扣生命
      if (b.y - r > VIEW.height) {
        this.balls.splice(bi, 1);
        bus.emit('game.ballLost', { left: this.balls.length });
        if (this.balls.length === 0) { this._loseLife(); return; }
        continue;
      }

      // 挡板
      const pr = this.paddle.rect();
      const hp = circleRectHit(b.x, b.y, r, pr.x, pr.y, pr.w, pr.h);
      if (hp && b.vy > 0) {
        b.x += hp.nx * hp.depth;
        b.y += hp.ny * hp.depth;
        if (hp.ny < -0.4) this.paddle.reflect(b);
        else reflect(b, hp);
        audio.play('paddle');
        bus.emit('physics.collision', { target: 'paddle', speed: Math.round(b.speed) });
        if (this.fireActive) this._autoFire(); // 火球模式：接球自动开炮
      }

      // 元素碰撞
      for (const e of this.level.elements) {
        if (!e.alive) continue;
        const hit = circleRectHit(b.x, b.y, r, e.x, e.y, e.w, e.h);
        if (!hit) continue;

        if (this.fireActive) {
          // 火球：不反弹直接穿透，同一元素 0.35s 灼烧冷却，伤害 ×3
          const last = b.fireHits.get(e.id) ?? -9;
          if (this.time - last > .35) {
            b.fireHits.set(e.id, this.time);
            const res = e.damage(3);
            bus.emit('physics.collision', { target: 'element', mode: 'fire', id: e.id, key: e.key });
            if (res === 'destroyed') this._destroyElement(e, 'fire');
            else if (res === 'damaged') {
              this.fx.burst(e.cx, e.cy, 'dust', e.def.frag);
              this.score.graze(e);
              bus.emit('element.damage', { id: e.id, key: e.key, hp: e.hp });
            }
          }
          continue; // 穿透：继续扫描其他元素，不 break
        }

        b.x += hit.nx * hit.depth;
        b.y += hit.ny * hit.depth;
        reflect(b, hit);
        b.clampBounceDir();
        bus.emit('physics.collision', { target: 'element', id: e.id, key: e.key, hpLeft: e.hp });

        const res = e.damage(1);
        if (res === 'destroyed') this._destroyElement(e, 'ball');
        else if (res === 'damaged') {
          audio.play(e.def.sound);
          this.fx.burst(b.x - hit.nx * r, b.y - hit.ny * r, 'dust', e.def.frag);
          this.score.graze(e);
          bus.emit('element.damage', { id: e.id, key: e.key, hp: e.hp });
        }
        break; // 常规模式每子步最多处理一个命中
      }
    }

    this._updateBullets(h);
    this._updatePowerups(h);
  }

  _wallBounce() {
    audio.play('bounce');
    bus.emit('physics.collision', { target: 'wall' });
  }

  // ---------------- 子弹（火球模式） ----------------
  tryFire() {
    if (!this.fireActive || this._bulletCd > 0) return;
    this._bulletCd = .18;
    this.spawnBullet(this.paddle.x);
  }

  _autoFire() {
    if (this._bulletCd <= 0) { this._bulletCd = .25; this.spawnBullet(this.paddle.x); }
  }

  spawnBullet(x) {
    this.bullets.push({ x, y: this.paddle.y - PADDLE.h / 2 - 10, vy: -560 });
    audio.play('bounce');
    bus.emit('fx.bullet', { x: Math.round(x), total: this.bullets.length });
  }

  _updateBullets(h) {
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bl = this.bullets[i];
      bl.y += bl.vy * h;
      if (bl.y < -12) { this.bullets.splice(i, 1); continue; }

      for (const e of this.level.elements) {
        if (!e.alive) continue;
        if (!circleRectHit(bl.x, bl.y, 3.5, e.x, e.y, e.w, e.h)) continue;
        this.bullets.splice(i, 1);
        const res = e.damage(2);
        bus.emit('physics.collision', { target: 'element', mode: 'bullet', id: e.id, key: e.key });
        if (res === 'destroyed') this._destroyElement(e, 'bullet');
        else if (res === 'damaged') {
          audio.play(e.def.sound);
          this.fx.burst(bl.x, bl.y, 'spark', e.def.frag);
          bus.emit('element.damage', { id: e.id, key: e.key, hp: e.hp });
        }
        break;
      }
    }
  }

  // ---------------- 道具掉落与拾取 ----------------
  _updatePowerups(h) {
    const pr = this.paddle.rect();
    for (let i = this.powerups.length - 1; i >= 0; i--) {
      const pu = this.powerups[i];
      pu.update(h);
      if (pu.y > VIEW.height + 24) { this.powerups.splice(i, 1); continue; }

      const rc = pu.rect();
      const caught = rc.x < pr.x + pr.w && rc.x + rc.w > pr.x && rc.y < pr.y + pr.h && rc.y + rc.h > pr.y;
      if (caught) {
        this.powerups.splice(i, 1);
        this._applyPowerUp(pu.type);
      }
    }
  }

  _applyPowerUp(type) {
    audio.play('gold');
    bus.emit('powerup.apply', { type });
    switch (type) {
      case 'multi':  this._splitBalls(); break;
      case 'wide':   this.timers.wide = 10; this.timers.narrow = 0; break;
      case 'narrow': this.timers.narrow = 8; this.timers.wide = 0; break;
      case 'fire':   this.timers.fire = 6; break;
    }
    const def = POWERUPS[type];
    this.fx.text(this.paddle.x, this.paddle.y - 34, `${def.name}!`, def.color);
  }

  _splitBalls() {
    const src = [...this.balls].filter(b => !b.stuck);
    if (!src.length) return;
    for (const s of src) {
      for (const sign of [-1, 1]) {
        if (this.balls.length >= 6) return; // 数量上限，防止失控
        const a = sign * 24 * Math.PI / 180;
        const cos = Math.cos(a), sin = Math.sin(a);
        const nb = new Ball();
        nb.x = s.x; nb.y = s.y;
        nb.vx = s.vx * cos - s.vy * sin;
        nb.vy = s.vx * sin + s.vy * cos;
        if (nb.vy > -40) nb.vy = -40; // 分裂球保持向上趋势，避免贴地来回
        nb.stuck = false;
        this.balls.push(nb);
      }
    }
    bus.emit('powerup.multi', { balls: this.balls.length });
  }

  // ---------------- 破坏与积分结算 ----------------
  _destroyElement(el, cause) {
    const d = el.def;
    if (d.fx !== 'boom') this.fx.burst(el.cx, el.cy, d.fx, d.frag);
    audio.play(d.sound);

    const speed = this.balls.find(b => !b.stuck)?.speed || this.baseSpeed;
    const { gain, combo, mult } = this.score.hit(el, speed);
    this.fx.text(el.cx, el.cy - 8, `+${gain}${combo > 1 ? ` ×${mult.toFixed(2)}` : ''}`, combo > 1 ? '#ffd970' : '#ffffff');
    bus.emit('element.destroy', { id: el.id, key: el.key, cause, gain, combo });

    this.remaining--;

    // 掉落道具
    const drop = rollDrop(el.key);
    if (drop) {
      this.powerups.push(new PowerUp(drop, el.cx, el.cy));
      bus.emit('powerup.drop', { type: drop, from: el.key });
    }

    // 单词砖进度：整词摧毁 → 奖励分 + 必掉道具
    if (this.word && this.word.elements.has(el)) {
      if ([...this.word.elements].every(e => !e.alive)) this._wordCleared();
    }

    // 球速随破坏递增（所有活跃球）
    for (const b of this.balls) {
      if (!b.stuck) b.setSpeed(Math.min(b.speed * PHYSICS.speedUpPerKill, PHYSICS.maxSpeed));
    }

    if (d.explode) {
      this.pendingExplosions.push({ ...d.explode, x: el.cx, y: el.cy });
      bus.emit('fx.explosionPending', { x: Math.round(el.cx), y: Math.round(el.cy), radius: d.explode.radius });
    }

    if (this.remaining <= 0 && this.state === 'playing') {
      this._setState('clear');
      audio.play('clear');
      this.clearTimer = 1.4;
      bus.emit('game.levelClear', { level: this.levelIndex + 1 });
    }
  }

  _wordCleared() {
    const bonus = 200 * (this.levelIndex + 1);
    this.score.bonus(bonus);
    audio.play('gold');
    bus.emit('game.wordClear', { word: this.word.word, bonus });
    const mid = [...this.word.elements][0];
    this.fx.text(VIEW.width / 2, mid.cy + 34, `单词 ${this.word.word} +${bonus}`, '#8be9fd');
    this.fx.ring(VIEW.width / 2, mid.cy, 120, 'rgba(139,233,253,');
    this.powerups.push(new PowerUp(rollDropType(), VIEW.width / 2, mid.cy + 10)); // 整词奖励必掉一件
  }

  // ---------------- 爆炸队列（连锁） ----------------
  _processExplosions(dt) {
    if (!this.pendingExplosions.length) return;
    for (const p of this.pendingExplosions) p.delay -= dt;
    const ready = this.pendingExplosions.filter(p => p.delay <= 0);
    this.pendingExplosions = this.pendingExplosions.filter(p => p.delay > 0);

    for (const p of ready) {
      this.fx.explode(p.x, p.y, p.radius);
      audio.play('explosion');
      this.shake(.3, 10);

      let hits = 0;
      for (const e of this.level.elements) {
        if (!e.alive) continue;
        const px = clamp(p.x, e.x, e.x + e.w), py = clamp(p.y, e.y, e.y + e.h);
        if (Math.hypot(p.x - px, p.y - py) > p.radius) continue;
        hits++;
        if (e.damage(p.damage) === 'destroyed') this._destroyElement(e, 'explosion');
      }
      bus.emit('fx.explosion', { x: Math.round(p.x), y: Math.round(p.y), radius: p.radius, hits });
    }
  }

  _loseLife() {
    this.lives--;
    audio.play('lose');
    this.shake(.25, 6);
    bus.emit('game.life', { lives: this.lives });
    if (this.lives <= 0) {
      this._setState('gameover');
      audio.play('gameover');
    } else {
      this.resetBallOnPaddle();
    }
  }

  _nextLevel() {
    if (this.levelIndex + 1 >= LEVEL_FILES.length) {
      this._setState('win');
      bus.emit('game.win', { score: this.score.score });
    } else {
      this.loadLevel(this.levelIndex + 1);
    }
  }

  // ---------------- 调试支撑 ----------------
  debugStats() {
    const b = this.balls[0];
    return {
      fps: Math.round(this.fps), state: this.state,
      level: `${this.level.json?.name || '-'}${this.word ? ` [${this.word.word}]` : ''}`,
      elements: `${this.remaining}/${this.level.elements.length}`,
      particles: this.fx.p.length, pending: this.pendingExplosions.length,
      ball: !b ? '-' : b.stuck ? 'STUCK' : `(${b.x | 0},${b.y | 0}) v=(${b.vx | 0},${b.vy | 0}) |v|=${b.speed | 0}`,
      balls: this.balls.length, bullets: this.bullets.length, powerups: this.powerups.length,
      fire: +this.timers.fire.toFixed(1), wide: +this.timers.wide.toFixed(1), narrow: +this.timers.narrow.toFixed(1),
      combo: this.score.combo, mult: +this.score.multiplier.toFixed(2),
      score: this.score.score, lives: this.lives,
    };
  }

  /** 控制台调试 API：__BREAKOUT__.game.debugKillAll() */
  debugKillAll() {
    for (const e of this.level.elements) if (e.alive) this._destroyElement(e, 'debug');
  }
  debugNextLevel() { this.clearTimer = -1; this._nextLevel(); }
  debugDrop(type = 'fire') { this.powerups.push(new PowerUp(type || rollDropType(), VIEW.width / 2, 300)); }
}
