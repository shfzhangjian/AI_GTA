// SPACE RAGE — arcade vertical shooter
// Art: SpaceRage sprite pack (Kenney-style atlas) + KayKit Medieval Hexagon Pack (3D backdrop)

import { loadAtlas } from './atlas.js';
import { AudioEngine } from './audio.js';
import { HexBackground } from './hexbg.js';

const TAU = Math.PI * 2;
const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const dist2 = (ax, ay, bx, by) => { const dx = ax - bx, dy = ay - by; return dx * dx + dy * dy; };

// ---------------------------------------------------------------- sprite names
const S = {
  player: ['player_r_m.png', 'player_r_l1.png', 'player_r_l2.png', 'player_r_l1.png'],
  playerBankL: ['player_r_l1.png', 'player_r_l2.png'],
  playerBankR: ['player_b_r1.png', 'player_b_r2.png'],
  enemies: [
    { body: 'enemy_1', colors: ['b', 'g', 'r'], hp: 2, speed: 150, score: 100, scale: 1.0, fire: 2.4 },
    { body: 'enemy_2', colors: ['b', 'g', 'r'], hp: 4, speed: 118, score: 180, scale: 1.15, fire: 1.6 },
  ],
  mines: [
    { body: 'mine_1', frames: 9, hp: 3, score: 60 },
    { body: 'mine_2', frames: 4, hp: 2, score: 45 },
    { body: 'mine_11', frames: 9, hp: 5, score: 90 },
    { body: 'mine_21', frames: 4, hp: 3, score: 70 },
  ],
  explosions: ['explosion_1', 'explosion_2', 'explosion_3'],
  bullets: ['vulcan', 'plasma', 'proton'],
};

// ------------------------------------------------------------------- game core
class Game {
  constructor() {
    this.gameCanvas = document.getElementById('game');
    this.ctx = this.gameCanvas.getContext('2d');
    this.hexCanvas = document.getElementById('hex');
    this.ui = {
      score: document.getElementById('v-score'),
      best: document.getElementById('v-best'),
      wave: document.getElementById('v-wave'),
      mult: document.getElementById('v-mult'),
      overlay: document.getElementById('overlay'),
      oCard: document.getElementById('ocard'),
      muted: document.getElementById('btn-mute'),
      pauseHint: document.getElementById('pause-hint'),
    };

    this.audio = new AudioEngine();
    this.atlas = null;
    this.bg = null;
    this.hex = null;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);

    this.W = 0; this.H = 0;
    this.state = 'menu';        // menu | play | pause | over
    this.time = 0;
    this.shake = 0;
    this.flash = 0;
    this.best = +(localStorage.getItem('spacerage_best') || 0);

    this.keys = new Set();
    this.pointer = { x: 0, y: 0, active: false, down: false };
    this.reset();
    this.bindInput();
    window.addEventListener('resize', () => this.resize());
  }

  reset() {
    this.player = {
      x: 0, y: 0, vx: 0, vy: 0, r: 17, hp: 3, maxHp: 5,
      invuln: 1.2, bank: 0, thrust: 0, alive: true,
      weapon: 'vulcan', weaponTimer: 0, fireCd: 0, spread: 0, rapid: 0,
    };
    this.bullets = [];
    this.ebullets = [];
    this.enemies = [];
    this.mines = [];
    this.fx = [];
    this.particles = [];
    this.floats = [];
    this.powerups = [];
    this.stars = Array.from({ length: 90 }, () => ({
      x: Math.random(), y: Math.random(), z: rand(0.25, 1), r: rand(0.5, 1.7),
    }));

    this.score = 0;
    this.mult = 1;
    this.combo = 0;
    this.comboTimer = 0;
    this.wave = 0;
    this.waveTimer = 2.0;
    this.spawnQueue = [];
    this.killCount = 0;
    this.boss = null;
    this.slowmo = 0;
  }

  // ------------------------------------------------------------------ loading
  async boot() {
    setStatus('加载资源…');
    const { atlas, bg } = await loadAtlas();
    this.atlas = atlas;
    this.bg = bg;
    setStatus(`已载入 ${atlas.frames.size} 个贴图`);

    this.hex = new HexBackground(this.hexCanvas, () => {
      document.getElementById('loading').classList.add('hidden');
    });
    // fallback if glTF fails
    setTimeout(() => document.getElementById('loading').classList.add('hidden'), 3500);

    this.resize();
    this.updateHud();
    this.ui.overlay.classList.add('hidden');
    this.showMenu();
    requestAnimationFrame(t => this.frame(t));
  }

  // ------------------------------------------------------------------- layout
  resize() {
    const w = window.innerWidth, h = window.innerHeight;
    this.W = w; this.H = h;
    for (const c of [this.gameCanvas, this.hexCanvas]) {
      c.width = Math.floor(w * this.dpr);
      c.height = Math.floor(h * this.dpr);
      c.style.width = w + 'px';
      c.style.height = h + 'px';
    }
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.hex?.resize();
    if (this.state === 'menu') { this.player.x = w / 2; this.player.y = h * 0.72; }
    this.player.x = clamp(this.player.x, 30, w - 30);
    this.player.y = clamp(this.player.y, 40, h - 30);
  }

  // -------------------------------------------------------------------- input
  bindInput() {
    this.isTouch = matchMedia('(pointer:coarse)').matches;
    const keymap = {
      ArrowLeft: 'l', KeyA: 'l', ArrowRight: 'r', KeyD: 'r',
      ArrowUp: 'u', KeyW: 'u', ArrowDown: 'd', KeyS: 'd',
    };
    window.addEventListener('keydown', e => {
      if (keymap[e.code]) { this.keys.add(keymap[e.code]); e.preventDefault(); }
      if (e.code === 'Space') { this.keys.add('fire'); e.preventDefault(); this.startIfNeeded(); }
      if (e.code === 'KeyP' || e.code === 'Escape') this.togglePause();
      if (e.code === 'Enter' && this.state === 'pause') this.togglePause();
      if (e.code === 'KeyM') this.toggleMute();
      if (e.code === 'Enter') this.startIfNeeded();
    });
    window.addEventListener('keyup', e => {
      if (keymap[e.code]) this.keys.delete(keymap[e.code]);
      if (e.code === 'Space') this.keys.delete('fire');
    });

    const setP = e => {
      const t = e.touches ? e.touches[0] : e;
      // touch: hold an offset above the finger so it doesn't cover the ship
      this.pointer.x = t.clientX;
      this.pointer.y = t.clientY - (this.isTouch ? 92 : 0);
    };

    this.gameCanvas.addEventListener('pointerdown', e => {
      this.audio.init(); this.audio.resume();
      setP(e); this.pointer.active = true; this.pointer.down = true;
      this.startIfNeeded();
    });
    window.addEventListener('pointermove', e => { if (this.pointer.active || !this.isTouch) setP(e); });
    window.addEventListener('pointerup', () => { this.pointer.down = false; if (this.isTouch) this.pointer.active = false; });
    window.addEventListener('pointercancel', () => { this.pointer.down = false; });

    // #btn-start / #btn-again live inside the overlay card, bound in showMenu()/gameOver()
    this.ui.muted.addEventListener('click', () => this.toggleMute());
    document.getElementById('btn-pause').addEventListener('click', () => this.togglePause());
  }

  startIfNeeded() {
    if (this.state === 'menu') this.start();
    else if (this.state === 'over') this.start();
    else this.audio.resume();
  }

  toggleMute() {
    this.muted = !this.muted;
    this.audio.init();
    this.audio.setMuted(this.muted);
    this.ui.muted.textContent = this.muted ? '🔇' : '🔊';
    this.ui.muted.classList.toggle('off', this.muted);
  }

  togglePause() {
    if (this.state === 'play') {
      this.state = 'pause';
      this.audio.silence();
      this.ui.pauseHint.classList.remove('hidden');
    } else if (this.state === 'pause') {
      this.state = 'play';
      this.ui.pauseHint.classList.add('hidden');
    }
  }

  // ------------------------------------------------------------------ session
  start() {
    this.audio.init(); this.audio.resume();
    this.reset();
    this.player.x = this.W / 2; this.player.y = this.H * 0.78;
    this.state = 'play';
    this.ui.overlay.classList.add('hidden');
    this.updateHud();
    this.nextWave(1);
  }

  showMenu() {
    this.ui.oCard.innerHTML = `
      <div class="badge">KAYKIT × SPACERAGE</div>
      <h1>SPACE<em>RAGE</em></h1>
      <p class="sub">低多边形六边形星域 · 空战射击</p>
      <div class="keys">
        <div><kbd>W A S D</kbd> / <kbd>方向键</kbd> 或 鼠标·触屏 — 移动</div>
        <div><kbd>空格</kbd> / 按住屏幕 — 自动射击</div>
        <div><kbd>P</kbd> 暂停 · <kbd>M</kbd> 静音</div>
      </div>
      <button id="btn-start" class="cta">开始游戏 <span>ENTER</span></button>
      <div class="foot">最高分 ${this.best}</div>`;
    this.ui.overlay.classList.remove('hidden');
    document.getElementById('btn-start').addEventListener('click', () => this.start());
  }

  gameOver() {
    this.state = 'over';
    this.audio.silence();
    if (this.score > this.best) { this.best = this.score; localStorage.setItem('spacerage_best', this.best); }
    this.ui.oCard.innerHTML = `
      <div class="badge danger">SHIP DESTROYED</div>
      <h1 class="small">GAME <em>OVER</em></h1>
      <div class="stats">
        <div><span>得分</span><b>${this.score.toLocaleString()}</b></div>
        <div><span>波次</span><b>${this.wave}</b></div>
        <div><span>击坠</span><b>${this.killCount}</b></div>
        <div><span>最高</span><b>${this.best.toLocaleString()}</b></div>
      </div>
      ${this.score >= this.best && this.score > 0 ? '<div class="newbest">NEW RECORD!</div>' : ''}
      <button id="btn-again" class="cta">再来一局 <span>ENTER</span></button>`;
    this.ui.overlay.classList.remove('hidden');
    document.getElementById('btn-again').addEventListener('click', () => this.start());
  }

  // ------------------------------------------------------------------ spawning
  nextWave(n) {
    this.wave = n;
    this.ui.wave.textContent = n;
    const boss = n % 5 === 0;
    const q = [];
    if (boss) {
      q.push({ t: 'boss', at: 1.4 });
      for (let i = 0; i < 3 + (n / 5 | 0); i++) q.push({ t: 'enemy', at: 2.2 + i * 1.1, kind: 1, color: 'r' });
    } else {
      const count = Math.min(6 + n * 2, 30);
      for (let i = 0; i < count; i++) {
        q.push({
          t: Math.random() < 0.22 ? 'mine' : 'enemy',
          at: 0.7 + i * rand(0.42, 0.85) - n * 0.01,
          kind: Math.random() < clamp(0.15 + n * 0.05, 0, 0.6) ? 1 : 0,
          color: ['b', 'g', 'r'][Math.min(2, (Math.random() * (1 + n * 0.3)) | 0)],
        });
      }
    }
    q.sort((a, b) => a.at - b.at);
    this.spawnQueue = q;
    this.waveTimer = 0;
    this.banner(`WAVE ${n}${boss ? ' — BOSS' : ''}`, boss ? '#ff5470' : '#6fe3ff');
  }

  banner(text, color) {
    this.floats.push({ text, x: this.W / 2, y: this.H * 0.34, vy: -12, life: 1.9, max: 1.9, big: true, color });
  }

  spawnEnemy(spec) {
    const def = S.enemies[spec.kind | 0];
    const x = rand(50, this.W - 50);
    const hpScale = 1 + (this.wave - 1) * 0.14;
    this.enemies.push({
      x, y: -50, r: 20 * def.scale,
      vx: 0, vy: def.speed * (1 + this.wave * 0.03),
      hp: Math.ceil(def.hp * hpScale), maxHp: Math.ceil(def.hp * hpScale),
      def, color: spec.color || 'b', t: rand(0, 9),
      fireCd: rand(0.6, def.fire), sway: rand(0.7, 1.6), phase: rand(0, TAU),
      boss: false, hitFlash: 0,
    });
  }

  spawnBoss() {
    const tier = 1 + (this.wave / 5 | 0);
    const hp = Math.ceil((46 + this.wave * 9) * 1);
    this.boss = {
      x: this.W / 2, y: -120, r: 58, vx: 70, vy: 0,
      hp, maxHp: hp, t: 0, phase: 0, fireCd: 1.2, hitFlash: 0,
      def: { body: 'enemy_2', colors: ['r'], score: 2400 * tier, scale: 3.6 },
      color: 'r', boss: true, entering: true, sway: 0.55,
    };
    this.enemies.push(this.boss);
    this.audio.fanfare(false);
    this.shake = 14;
  }

  spawnMine() {
    const m = S.mines[(Math.random() * S.mines.length) | 0];
    this.mines.push({
      x: rand(40, this.W - 40), y: -40, r: 20, vy: rand(52, 88), vx: rand(-24, 24),
      hp: m.hp + (this.wave / 6 | 0), def: m, spin: rand(0.4, 1.3), t: rand(0, 9), score: m.score,
    });
  }

  // ------------------------------------------------------------------- firing
  playerFire() {
    const p = this.player;
    const rapid = p.rapid > 0 ? 0.62 : 1;
    const cd = (p.weapon === 'plasma' ? 0.30 : 0.115) * rapid;
    if (p.fireCd > 0) return;
    p.fireCd = cd;

    if (p.weapon === 'plasma') {
      this.bullets.push({ x: p.x, y: p.y - 26, vx: 0, vy: -980, dmg: 5, r: 13, sprite: 'plasma_1.png', score: 1, big: true });
      for (let i = -1; i <= 1; i += 2) {
        this.bullets.push({ x: p.x + i * 22, y: p.y - 12, vx: i * 90, vy: -820, dmg: 3, r: 11, sprite: 'plasma_1.png', score: 1 });
      }
      this.audio.shoot('plasma');
      this.shake = Math.max(this.shake, 2.4);
    } else {
      const n = p.spread > 0 ? 3 : 2;
      for (let i = 0; i < n; i++) {
        const off = n === 2 ? (i ? 15 : -15) : (i - 1) * 14;
        const ang = -Math.PI / 2 + (n === 3 ? (i - 1) * 0.12 : 0);
        this.bullets.push({
          x: p.x + off, y: p.y - 18, vx: Math.cos(ang) * 1050, vy: Math.sin(ang) * 1050,
          dmg: 1, r: 7, sprite: 'vulcan_1.png', score: 1,
        });
      }
      this.audio.shoot('vulcan');
    }
    // muzzle particles
    for (let i = 0; i < 3; i++) {
      this.particles.push({ x: p.x + rand(-8, 8), y: p.y - 24, vx: rand(-40, 40), vy: rand(-160, -60), life: 0.16, max: 0.16, c: '150,230,255', r: rand(1.5, 3) });
    }
  }

  enemyFire(e) {
    const p = this.player;
    const ang = Math.atan2(p.y - e.y, p.x - e.x);
    const speed = e.boss ? 300 : 250 + this.wave * 4;
    const shots = e.boss ? (e.hp / e.maxHp < 0.45 ? 5 : 3) : 1;
    for (let i = 0; i < shots; i++) {
      const a = ang + (i - (shots - 1) / 2) * 0.16;
      this.ebullets.push({
        x: e.x, y: e.y + e.r * 0.5, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed,
        r: e.boss ? 9 : 6, sprite: 'proton_01.png', rot: a + Math.PI / 2,
      });
    }
    this.audio.hit(0.35);
  }

  bossFire(b) {
    const p = this.player;
    const ang = Math.atan2(p.y - b.y, p.x - b.x);
    // radial burst + aimed volley
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * TAU + b.t * 0.7;
      this.ebullets.push({
        x: b.x, y: b.y, vx: Math.cos(a) * 205, vy: Math.sin(a) * 205,
        r: 8, sprite: 'proton_02.png', rot: a + Math.PI / 2,
      });
    }
    for (let i = -2; i <= 2; i++) {
      const a = ang + i * 0.13;
      this.ebullets.push({
        x: b.x, y: b.y + 20, vx: Math.cos(a) * 340, vy: Math.sin(a) * 340,
        r: 9, sprite: 'plasma_1.png', rot: a + Math.PI / 2, big: true,
      });
    }
    this.audio.explode(0.5);
    this.shake = Math.max(this.shake, 5);
  }

  // ----------------------------------------------------------------- collision
  damageEnemy(e, dmg, fromX, fromY) {
    e.hp -= dmg;
    e.hitFlash = 0.09;
    this.particles.push({ x: fromX, y: fromY, vx: 0, vy: 0, life: 0.1, max: 0.1, c: '255,255,255', r: 16, ring: true });
    if (e.hp <= 0) this.killEnemy(e);
    else this.audio.hit(e.boss ? 1.4 : 0.8);
  }

  killEnemy(e) {
    const idx = this.enemies.indexOf(e);
    if (idx < 0) return;
    this.enemies.splice(idx, 1);
    this.killCount++;
    this.combo++;
    this.comboTimer = 2.4;
    const nm = clamp(1 + Math.floor(this.combo / 6), 1, 8);
    if (nm !== this.mult) { this.mult = nm; this.hudDirty = true; }

    const gain = Math.round((e.def.score || 100) * this.mult);
    this.score += gain;
    this.hudDirty = true;
    this.floats.push({ text: '+' + gain, x: e.x, y: e.y, vy: -46, life: 0.85, max: 0.85, color: e.boss ? '#ffd166' : '#c8f0ff' });

    const big = e.boss ? 3 : e.maxHp >= 4 ? 2 : 1;
    this.explode(e.x, e.y, big);
    this.shake = Math.max(this.shake, e.boss ? 22 : 6 + big * 2);
    if (e.boss) {
      this.boss = null;
      this.flash = 0.5;
      this.audio.fanfare(true);
      for (let i = 0; i < 6; i++) setTimeout(() => this.explode(e.x + rand(-70, 70), e.y + rand(-50, 50), 2), i * 130);
      this.dropPowerup(e.x, e.y, 'plasma');
      this.dropPowerup(e.x + 40, e.y, 'heal');
    } else if (Math.random() < 0.09) {
      this.dropPowerup(e.x, e.y, Math.random() < 0.25 ? 'heal' : (Math.random() < 0.5 ? 'plasma' : 'rapid'));
    }
  }

  dropPowerup(x, y, kind) {
    const sprite = kind === 'heal' ? 'mine_2_01.png' : kind === 'plasma' ? 'plasma_2.png' : 'vulcan_3.png';
    this.powerups.push({ x, y, vy: 96, r: 18, kind, sprite, t: 0 });
  }

  explode(x, y, tier = 1) {
    const body = S.explosions[Math.min(tier - 1, 2)];
    const frames = [];
    for (let i = 1; i <= 11; i++) {
      const n = `${body}_${String(i).padStart(2, '0')}.png`;
      if (this.atlas.frames.has(n)) frames.push(n);
    }
    if (!frames.length) frames.push('explosion_1_01.png');
    this.fx.push({ x, y, frames, i: 0, step: tier === 3 ? 0.05 : 0.042, scale: tier === 3 ? 3.2 : tier === 2 ? 1.9 : 1.25 });
    this.audio.explode(tier * 0.7);

    const n = 12 + tier * 12;
    for (let i = 0; i < n; i++) {
      const a = rand(0, TAU), s = rand(60, 340) * (0.6 + tier * 0.3);
      this.particles.push({
        x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: rand(0.3, 0.85), max: 0.85,
        c: i % 3 === 0 ? '255,240,190' : i % 3 === 1 ? '255,140,60' : '255,70,40', r: rand(1.6, 4.4),
      });
    }
    this.particles.push({ x, y, vx: 0, vy: 0, life: 0.34, max: 0.34, c: '255,200,120', r: 12 + tier * 14, ring: true });
  }

  hurtPlayer(src) {
    const p = this.player;
    if (p.invuln > 0 || !p.alive) return;
    p.hp--;
    p.invuln = 1.6;
    this.combo = 0; this.mult = 1;
    this.shake = Math.max(this.shake, 16);
    this.flash = 0.35;
    this.audio.hurt();
    if (src) { const i = this.ebullets.indexOf(src); if (i >= 0) this.ebullets.splice(i, 1); }
    for (let i = 0; i < 22; i++) {
      const a = rand(0, TAU), s = rand(80, 300);
      this.particles.push({ x: p.x, y: p.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: rand(0.25, 0.6), max: 0.6, c: '120,220,255', r: rand(1.5, 3.5) });
    }
    if (p.hp <= 0) {
      p.alive = false;
      this.explode(p.x, p.y, 3);
      this.slowmo = 1.0;
      setTimeout(() => { if (!this.player.alive) this.gameOver(); }, 1150);
    }
    this.updateHud();
  }

  updateHud() {
    this.ui.score.textContent = this.score.toLocaleString();
    this.ui.best.textContent = this.best.toLocaleString();
    this.ui.mult.textContent = '×' + this.mult;
    this.ui.mult.classList.toggle('hot', this.mult >= 3);
    const hp = document.getElementById('hp');
    if (!hp) return;
    const pips = [];
    for (let i = 0; i < this.player.maxHp; i++) {
      pips.push(`<i class="${i < Math.max(0, this.player.hp) ? 'on' : ''}"></i>`);
    }
    hp.innerHTML = pips.join('');
    const w = document.getElementById('weapon');
    if (w) {
      const names = { vulcan: 'VULCAN', plasma: 'PLASMA', rapid: 'RAPID' };
      let label = names[this.player.weapon];
      if (this.player.rapid > 0) label += ' +R';
      w.textContent = label;
    }
  }

  // -------------------------------------------------------------------- update
  update(dt) {
    this.time += dt;
    const p = this.player;

    // background always alive
    this.hex?.update(Math.min(dt, 0.05), clamp(this.wave / 12, 0, 1));

    if (this.state !== 'play') {
      this.updateFx(dt);
      return;
    }

    const slow = this.slowmo > 0 ? 0.35 : 1;
    if (this.slowmo > 0) this.slowmo -= dt;
    const d = dt * slow;

    // ---- player movement
    let ax = 0, ay = 0;
    if (this.keys.has('l')) ax -= 1;
    if (this.keys.has('r')) ax += 1;
    if (this.keys.has('u')) ay -= 1;
    if (this.keys.has('d')) ay += 1;
    const accel = 2600, maxv = 470;

    if (ax || ay) {
      p.vx += ax * accel * d; p.vy += ay * accel * d;
      this.pointer.active = false;
    } else if (this.pointer.active) {
      const kx = clamp((this.pointer.x - p.x) * 9, -maxv, maxv);
      const ky = clamp((this.pointer.y - p.y) * 9, -maxv, maxv);
      p.vx += (kx - p.vx) * clamp(12 * d, 0, 1);
      p.vy += (ky - p.vy) * clamp(12 * d, 0, 1);
    }

    const fr = Math.pow(0.0016, d);
    p.vx *= fr; p.vy *= fr;
    const sp = Math.hypot(p.vx, p.vy);
    if (sp > maxv) { p.vx = p.vx / sp * maxv; p.vy = p.vy / sp * maxv; }
    p.x += p.vx * d; p.y += p.vy * d;

    const m = 26;
    if (p.x < m) { p.x = m; p.vx = Math.abs(p.vx) * 0.3; }
    if (p.x > this.W - m) { p.x = this.W - m; p.vx = -Math.abs(p.vx) * 0.3; }
    if (p.y < m + 10) { p.y = m + 10; p.vy = Math.abs(p.vy) * 0.3; }
    if (p.y > this.H - m) { p.y = this.H - m; p.vy = -Math.abs(p.vy) * 0.3; }

    p.bank += (clamp(p.vx / maxv, -1, 1) * 2 - p.bank) * clamp(9 * d, 0, 1);
    p.thrust = clamp(sp / maxv, 0, 1);
    if (p.invuln > 0) p.invuln -= dt;
    if (p.fireCd > 0) p.fireCd -= dt;
    if (p.rapid > 0) { p.rapid -= dt; if (p.rapid <= 0) this.updateHud(); }
    if (p.weaponTimer > 0) { p.weaponTimer -= dt; if (p.weaponTimer <= 0 && p.weapon === 'plasma') { p.weapon = 'vulcan'; this.updateHud(); } }

    if (p.alive && (this.keys.has('fire') || this.pointer.active || this.pointer.down)) this.playerFire();
    // engine trail
    if (p.alive && Math.random() < 0.9) {
      this.particles.push({
        x: p.x + rand(-6, 6), y: p.y + 22, vx: rand(-25, 25) - p.vx * 0.12, vy: rand(80, 190),
        life: rand(0.18, 0.4), max: 0.4, c: '90,190,255', r: rand(2, 4.6),
      });
    }

    // ---- combo decay
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0 && this.combo) { this.combo = 0; if (this.mult !== 1) { this.mult = 1; this.updateHud(); } }
    }

    // ---- waves / spawns
    this.waveTimer += dt;
    while (this.spawnQueue.length && this.spawnQueue[0].at <= this.waveTimer) {
      const s = this.spawnQueue.shift();
      if (s.t === 'enemy') this.spawnEnemy(s);
      else if (s.t === 'mine') this.spawnMine();
      else if (s.t === 'boss') this.spawnBoss();
    }
    if (!this.spawnQueue.length && !this.enemies.length && this.state === 'play') {
      this.waveTimer += dt * 2;
      if (this.waveTimer > 1.5) {
        const bonus = 250 * this.wave;
        this.score += bonus;
        this.banner(`WAVE CLEAR +${bonus}`, '#8ef5b4');
        this.audio.fanfare(true);
        if (this.player.hp < this.player.maxHp && this.wave % 2 === 0) { this.player.hp++; }
        this.updateHud();
        this.nextWave(this.wave + 1);
      }
    }

    // ---- bullets
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.x += b.vx * d; b.y += b.vy * d;
      if (b.y < -40 || b.x < -30 || b.x > this.W + 30) { this.bullets.splice(i, 1); continue; }

      let hit = false;
      for (const e of this.enemies) {
        const rr = (e.r + b.r) * (e.r + b.r);
        if (dist2(b.x, b.y, e.x, e.y) < rr) {
          this.damageEnemy(e, b.dmg, b.x, b.y);
          hit = true;
          this.particles.push({ x: b.x, y: b.y, vx: rand(-70, 70), vy: rand(-30, 90), life: 0.2, max: 0.2, c: '200,240,255', r: 3 });
          break;
        }
      }
      if (!hit) {
        for (const mn of this.mines) {
          if (dist2(b.x, b.y, mn.x, mn.y) < (mn.r + b.r) ** 2) {
            mn.hp -= b.dmg; mn.flash = 0.08;
            hit = true;
            this.audio.hit(0.6);
            if (mn.hp <= 0) {
              const gain = Math.round(mn.score * this.mult);
              this.score += gain;
              this.floats.push({ text: '+' + gain, x: mn.x, y: mn.y, vy: -40, life: 0.7, max: 0.7, color: '#c8f0ff' });
              this.explode(mn.x, mn.y, 1);
              this.mines.splice(this.mines.indexOf(mn), 1);
            }
            break;
          }
        }
      }
      if (hit) this.bullets.splice(i, 1);
    }

    // ---- enemy bullets
    for (let i = this.ebullets.length - 1; i >= 0; i--) {
      const b = this.ebullets[i];
      b.x += b.vx * d; b.y += b.vy * d;
      if (b.y > this.H + 40 || b.y < -60 || b.x < -50 || b.x > this.W + 50) { this.ebullets.splice(i, 1); continue; }
      if (p.alive && dist2(b.x, b.y, p.x, p.y) < (p.r + b.r) ** 2) {
        this.hurtPlayer(b);
        this.ebullets.splice(i, 1);
      }
    }

    // ---- enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      e.t += d;
      if (e.hitFlash > 0) e.hitFlash -= dt;

      if (e.boss) {
        if (e.entering) {
          e.y += 78 * d;
          if (e.y >= 130) { e.entering = false; }
        } else {
          e.x += Math.cos(e.t * 0.62) * 150 * d * e.sway;
          e.y = 130 + Math.sin(e.t * 0.9) * 34;
          e.fireCd -= d;
          if (e.fireCd <= 0) { this.bossFire(e); e.fireCd = clamp(1.5 - (1 - e.hp / e.maxHp) * 0.7, 0.62, 1.5); }
        }
        e.x = clamp(e.x, 70, this.W - 70);
      } else {
        e.x += Math.cos(e.t * e.sway + e.phase) * 78 * d;
        e.y += e.vy * d;
        e.fireCd -= d;
        if (e.fireCd <= 0 && e.y > 20 && e.y < this.H * 0.62 && p.alive) {
          this.enemyFire(e);
          e.fireCd = e.def.fire * rand(0.75, 1.4) / (1 + this.wave * 0.02);
        }
        if (e.y > this.H + 60) { this.enemies.splice(i, 1); continue; }
      }

      // ram the player
      if (p.alive && dist2(e.x, e.y, p.x, p.y) < (e.r * 0.82 + p.r) ** 2) {
        this.hurtPlayer();
        if (!e.boss) { this.damageEnemy(e, 3, e.x, e.y); }
      }
    }

    // ---- mines
    for (let i = this.mines.length - 1; i >= 0; i--) {
      const mn = this.mines[i];
      mn.t += d;
      if (mn.flash > 0) mn.flash -= dt;
      mn.x += mn.vx * d; mn.y += mn.vy * d;
      if (mn.x < 24 || mn.x > this.W - 24) mn.vx *= -1;
      if (mn.y > this.H + 50) { this.mines.splice(i, 1); continue; }
      if (p.alive && dist2(mn.x, mn.y, p.x, p.y) < (mn.r * 0.8 + p.r) ** 2) {
        this.explode(mn.x, mn.y, 1);
        this.mines.splice(i, 1);
        this.hurtPlayer();
      }
    }

    // ---- powerups
    for (let i = this.powerups.length - 1; i >= 0; i--) {
      const u = this.powerups[i];
      u.t += dt; u.y += u.vy * d;
      if (u.y > this.H + 40) { this.powerups.splice(i, 1); continue; }
      if (p.alive && dist2(u.x, u.y, p.x, p.y) < (u.r + p.r + 6) ** 2) {
        this.powerups.splice(i, 1);
        if (u.kind === 'heal') { p.hp = Math.min(p.maxHp, p.hp + 1); this.banner('HULL +1', '#8ef5b4'); }
        else if (u.kind === 'plasma') { p.weapon = 'plasma'; p.weaponTimer = 13; this.banner('PLASMA CANNON', '#c39bff'); }
        else { p.rapid = 11; p.spread = 1; this.banner('RAPID FIRE', '#ffd166'); }
        this.audio.fanfare(true);
        this.score += 50;
        this.updateHud();
      }
    }

    this.updateFx(dt);
    this.audio.setIntensity(clamp(0.15 + this.enemies.length * 0.07 + (this.boss ? 0.5 : 0), 0, 1));
    if (this.shake > 0) this.shake = Math.max(0, this.shake - dt * 42);
    if (this.flash > 0) this.flash = Math.max(0, this.flash - dt * 1.6);
    if (this.hudDirty || Math.floor(this.time * 6) % 10 === 0) { this.updateHud(); this.hudDirty = false; }
  }

  updateFx(dt) {
    for (let i = this.fx.length - 1; i >= 0; i--) {
      const f = this.fx[i];
      f.i += dt / f.step;
      if (f.i >= f.frames.length) this.fx.splice(i, 1);
    }
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const q = this.particles[i];
      q.life -= dt;
      if (q.life <= 0) { this.particles.splice(i, 1); continue; }
      q.x += (q.vx || 0) * dt; q.y += (q.vy || 0) * dt;
      if (!q.ring) { q.vx *= Math.pow(0.15, dt); q.vy *= Math.pow(0.15, dt); }
    }
    for (let i = this.floats.length - 1; i >= 0; i--) {
      const f = this.floats[i];
      f.life -= dt; f.y += f.vy * dt;
      if (f.life <= 0) this.floats.splice(i, 1);
    }
    for (const s of this.stars) {
      s.y += (0.06 + s.z * 0.28) * dt * (this.state === 'play' ? 1.4 : 0.5);
      if (s.y > 1) { s.y = -0.02; s.x = Math.random(); }
    }
  }

  // --------------------------------------------------------------------- draw
  draw() {
    const ctx = this.ctx, W = this.W, H = this.H;
    ctx.clearRect(0, 0, W, H);

    ctx.save();
    if (this.shake > 0.2) ctx.translate(rand(-this.shake, this.shake) * 0.6, rand(-this.shake, this.shake) * 0.6);

    // parallax stars over the 3D layer
    ctx.globalCompositeOperation = 'lighter';
    for (const s of this.stars) {
      ctx.globalAlpha = 0.18 + s.z * 0.55;
      ctx.fillStyle = '#bfe4ff';
      ctx.fillRect(s.x * W, s.y * H, s.r, s.r * (1 + s.z * 2));
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;

    // mines
    for (const mn of this.mines) {
      const n = mn.def.frames;
      const idx = Math.floor(mn.t * 8) % n;
      const name = `${mn.def.body}_${String(idx + 1).padStart(2, '0')}.png`;
      this.atlas.draw(ctx, name, mn.x, mn.y, 1.15, mn.t * mn.spin);
      if (mn.flash > 0) {
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        this.atlas.draw(ctx, name, mn.x, mn.y, 1.2, mn.t * mn.spin, 0.8);
        ctx.restore();
      }
    }

    // powerups
    if (this.powerups) {
      for (const u of this.powerups) {
        const pulse = 1 + Math.sin(u.t * 7) * 0.12;
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = u.kind === 'heal' ? 'rgba(120,255,170,.35)' : u.kind === 'plasma' ? 'rgba(190,140,255,.35)' : 'rgba(255,210,110,.35)';
        ctx.beginPath(); ctx.arc(u.x, u.y, 20 * pulse, 0, TAU); ctx.fill();
        ctx.restore();
        this.atlas.draw(ctx, u.sprite, u.x, u.y, 1.4 * pulse, u.t * 1.6);
      }
    }

    // enemies
    for (const e of this.enemies) {
      const col = e.color || 'b';
      const base = `${e.def.body}_${col}`;
      let sprite;
      if (e.boss) sprite = `${base}_m.png`;
      else {
        const bankIdx = Math.round(Math.cos(e.t * e.sway + e.phase) * 2); // -2..2
        const order = ['l2', 'l1', 'm', 'r1', 'r2'];
        sprite = `${base}_${order[clamp(bankIdx, 0, 4)]}.png`;
      }
      if (!this.atlas.frames.has(sprite)) sprite = `${base}_m.png`;

      if (e.boss) {
        // glow + hp bar
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const g = ctx.createRadialGradient(e.x, e.y, 10, e.x, e.y, 120);
        g.addColorStop(0, 'rgba(255,90,120,.4)'); g.addColorStop(1, 'rgba(255,90,120,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(e.x, e.y, 120, 0, TAU); ctx.fill();
        ctx.restore();
      }
      const s = e.def.scale || 1;
      this.atlas.draw(ctx, sprite, e.x, e.y, s, e.boss ? Math.sin(e.t) * 0.05 : 0, 1);
      if (e.hitFlash > 0) {
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        this.atlas.draw(ctx, sprite, e.x, e.y, s * 1.04, 0, 0.75);
        ctx.restore();
      }
      if (e.boss) {
        const w = 220, x = e.x - w / 2, y = 34;
        ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(x - 2, y - 2, w + 4, 12);
        const f = clamp(e.hp / e.maxHp, 0, 1);
        const grad = ctx.createLinearGradient(x, 0, x + w, 0);
        grad.addColorStop(0, '#ff3d6b'); grad.addColorStop(1, '#ffb347');
        ctx.fillStyle = grad; ctx.fillRect(x, y, w * f, 8);
        ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 1; ctx.strokeRect(x - 2.5, y - 2.5, w + 5, 13);
      }
    }

    // player bullets
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const b of this.bullets) {
      const rot = Math.atan2(b.vy, b.vx) + Math.PI / 2;
      if (b.big) {
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        const g = ctx.createRadialGradient(b.x, b.y, 1, b.x, b.y, 26);
        g.addColorStop(0, 'rgba(190,140,255,.55)'); g.addColorStop(1, 'rgba(190,140,255,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(b.x, b.y, 26, 0, TAU); ctx.fill();
        ctx.restore();
      }
      this.atlas.draw(ctx, b.sprite, b.x, b.y, b.big ? 1.5 : 1.1, rot, 1);
    }
    // enemy bullets
    for (const b of this.ebullets) {
      const g = ctx.createRadialGradient(b.x, b.y, 1, b.x, b.y, 16);
      g.addColorStop(0, 'rgba(255,90,80,.5)'); g.addColorStop(1, 'rgba(255,90,80,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(b.x, b.y, 16, 0, TAU); ctx.fill();
      this.atlas.draw(ctx, b.sprite, b.x, b.y, b.big ? 1.3 : 1, b.rot, 1);
    }
    ctx.restore();

    // player
    const p = this.player;
    if (p.alive) {
      const blink = p.invuln > 0 && Math.floor(this.time * 14) % 2 === 0;
      if (!blink) {
        // engine glow
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const g = ctx.createRadialGradient(p.x, p.y + 26, 2, p.x, p.y + 26, 34);
        g.addColorStop(0, `rgba(110,220,255,${0.35 + p.thrust * 0.4})`);
        g.addColorStop(1, 'rgba(110,220,255,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y + 26, 34, 0, TAU); ctx.fill();
        ctx.restore();

        const order = ['player_r_l2.png', 'player_r_l1.png', 'player_r_m.png', 'player_b_r1.png', 'player_b_r2.png'];
        const idx = clamp(Math.round(p.bank) + 2, 0, 4);
        let sprite = order[idx];
        if (!this.atlas.frames.has(sprite)) sprite = 'player_r_m.png';
        this.atlas.draw(ctx, sprite, p.x, p.y, 1.35, p.bank * 0.16);

        if (p.invuln > 0) {
          ctx.save();
          ctx.strokeStyle = `rgba(120,220,255,${0.25 + Math.sin(this.time * 18) * 0.2})`;
          ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(p.x, p.y, 30, 0, TAU); ctx.stroke();
          ctx.restore();
        }
      }
    }

    // explosion sprite animations
    for (const f of this.fx) {
      const i = clamp(Math.floor(f.i), 0, f.frames.length - 1);
      this.atlas.draw(ctx, f.frames[i], f.x, f.y, f.scale);
    }

    // particles
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const q of this.particles) {
      const a = clamp(q.life / q.max, 0, 1);
      if (q.ring) {
        const r = q.r * (1 + (1 - a) * 2.4);
        ctx.strokeStyle = `rgba(${q.c},${a * 0.85})`;
        ctx.lineWidth = 2 + a * 3;
        ctx.beginPath(); ctx.arc(q.x, q.y, r, 0, TAU); ctx.stroke();
      } else {
        ctx.fillStyle = `rgba(${q.c},${a})`;
        ctx.beginPath(); ctx.arc(q.x, q.y, q.r * (0.4 + a), 0, TAU); ctx.fill();
      }
    }
    ctx.restore();

    // floating score / banners
    for (const f of this.floats) {
      const a = clamp(f.life / f.max, 0, 1);
      ctx.save();
      ctx.globalAlpha = a;
      ctx.textAlign = 'center';
      if (f.big) {
        ctx.font = `800 ${Math.round(Math.min(W * 0.09, 54))}px ui-monospace, monospace`;
        ctx.shadowColor = f.color; ctx.shadowBlur = 26;
        ctx.fillStyle = f.color;
        ctx.fillText(f.text, f.x, f.y);
      } else {
        ctx.font = `700 ${f.text.length > 6 ? 15 : 17}px ui-monospace, monospace`;
        ctx.fillStyle = f.color;
        ctx.shadowColor = 'rgba(0,0,0,.8)'; ctx.shadowBlur = 6;
        ctx.fillText(f.text, f.x, f.y);
      }
      ctx.restore();
    }

    ctx.restore();

    // damage flash vignette
    if (this.flash > 0) {
      ctx.fillStyle = `rgba(255,60,80,${this.flash * 0.35})`;
      ctx.fillRect(0, 0, W, H);
    }
  }

  // --------------------------------------------------------------------- loop
  frame(t) {
    if (!this.last) this.last = t;
    let dt = (t - this.last) / 1000;
    this.last = t;
    dt = Math.min(dt, 1 / 25);
    this.update(dt);
    this.draw();
    requestAnimationFrame(t2 => this.frame(t2));
  }
}

function setStatus(text) {
  const el = document.getElementById('load-text');
  if (el) el.textContent = text;
}

const game = new Game();
game.boot().catch(err => {
  console.error(err);
  setStatus('资源加载失败：' + err.message);
});
window.__game = game;
