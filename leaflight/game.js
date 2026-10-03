(() => {
  'use strict';
  const W = window.ForestWorld;
  const canvas = document.querySelector('#game'), ctx = canvas.getContext('2d');
  const $ = id => document.getElementById(id);
  const ui = Object.fromEntries(['overlay', 'overlayKicker', 'overlayTitle', 'overlayBody', 'overlayHint', 'startButton', 'pauseButton', 'soundButton', 'restartButton', 'countLabel', 'collectionFill', 'hearts', 'dashFill', 'timeLabel', 'questTitle', 'questText', 'toast'].map(id => [id, $(id)]));
  const keys = new Set(), touch = new Set();
  const sheet = new Image();
  let loaded = false;
  sheet.onload = () => { loaded = true; };
  sheet.onerror = () => { $('loadError').hidden = false; ui.startButton.disabled = true; };
  sheet.src = './sprites/forest_spirit_4dir.png';
  for (let i = 0; i < 12; i++) { const star = document.createElement('span'); star.textContent = '✦'; $('starGrid').append(star); }

  let world, player, enemies, particles, trail, fireflies;
  let mode = 'intro', elapsed = 0, clock = 0, count = 0, shake = 0, toastTime = 0;
  let audioContext = null, soundOn = false, clickTarget = null;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function beep(notes, type = 'sine', volume = 0.045) {
    if (!soundOn) return;
    try {
      audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
      audioContext.resume();
      notes.forEach((frequency, i) => {
        const osc = audioContext.createOscillator(), gain = audioContext.createGain();
        const at = audioContext.currentTime + i * 0.085;
        osc.type = type; osc.frequency.value = frequency;
        gain.gain.setValueAtTime(0.001, at); gain.gain.linearRampToValueAtTime(volume, at + 0.008); gain.gain.exponentialRampToValueAtTime(0.001, at + 0.17);
        osc.connect(gain); gain.connect(audioContext.destination); osc.start(at); osc.stop(at + 0.18);
      });
    } catch { soundOn = false; ui.soundButton.textContent = '声音：关'; }
  }
  function message(text, seconds = 2.3) { ui.toast.textContent = text; toastTime = seconds; ui.toast.classList.add('visible'); }
  function burst(x, y, color, amount = 12) {
    for (let i = 0; i < amount; i++) { const angle = Math.random() * Math.PI * 2, speed = 10 + Math.random() * 40; particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 20, life: 0.55 + Math.random() * 0.5, max: 1.05, color, size: Math.random() > 0.5 ? 3 : 2 }); }
  }
  function refreshHud() {
    ui.countLabel.textContent = count;
    ui.collectionFill.style.width = `${count / 12 * 100}%`;
    [...$('starGrid').children].forEach((el, i) => el.classList.toggle('collected', i < count));
    ui.hearts.textContent = '♥ '.repeat(player.hearts) + '♡ '.repeat(3 - player.hearts);
    ui.hearts.setAttribute('aria-label', `生命值 ${player.hearts}`);
    if (count === 12) { ui.questTitle.textContent = '回到树心祭坛'; ui.questText.textContent = '星露已集齐！跟随金色光线，点亮森林。'; }
    else { ui.questTitle.textContent = '寻找星露'; ui.questText.textContent = '它们藏在林间，像落在草地上的小星星。'; }
  }
  function reset() {
    keys.clear(); touch.clear();
    document.querySelectorAll('[data-dir]').forEach(button => button.classList.remove('active'));
    world = W.build();
    player = { ...world.spawn, hearts: 3, face: 0, moving: false, walk: 0, invincible: 0, dash: 0, cooldown: 0, lastDirection: { x: 1, y: 0 }, path: [] };
    enemies = world.enemySpawns.map(([x, y], i) => ({ x, y, home: { x, y }, stun: 0, path: [], rethink: i * 0.13, phase: i * 2, chasing: false }));
    particles = []; trail = []; elapsed = 0; count = 0; shake = 0; clickTarget = null; toastTime = 0;
    ui.timeLabel.textContent = '00:00'; ui.toast.classList.remove('visible'); ui.dashFill.style.width = '100%';
    const rng = W.random(721);
    fireflies = Array.from({ length: 36 }, () => ({ x: 80 + rng() * 800, y: 130 + rng() * 380, phase: rng() * 6.28, speed: 0.4 + rng(), size: rng() > 0.7 ? 2 : 1 }));
    refreshHud();
  }
  function start() {
    if (!loaded) { message('正在载入小精灵…', 1); return; }
    if (mode === 'paused') { mode = 'playing'; ui.overlay.hidden = true; ui.pauseButton.textContent = '暂停'; canvas.focus({ preventScroll: true }); return; }
    reset(); mode = 'playing'; ui.overlay.hidden = true; ui.pauseButton.disabled = false; ui.pauseButton.textContent = '暂停'; canvas.focus({ preventScroll: true }); beep([392, 523, 659]);
    message('收集星露，让森林重新亮起来', 3);
  }
  function pause() {
    if (mode === 'playing') {
      mode = 'paused'; keys.clear(); touch.clear(); ui.overlay.hidden = false; ui.overlayKicker.textContent = '在树荫下歇一会儿'; ui.overlayTitle.textContent = '森林会等你'; ui.overlayBody.innerHTML = `已收集 <strong>${count} / 12 颗星露</strong>。<br>准备好就继续这场小冒险。`;
      ui.startButton.innerHTML = '继续冒险 <span aria-hidden="true">↗</span>'; ui.overlayHint.textContent = '按 P / Esc 也可以继续'; ui.pauseButton.textContent = '继续';
    } else if (mode === 'paused') start();
  }
  function finish(won) {
    mode = won ? 'won' : 'lost'; keys.clear(); touch.clear(); ui.pauseButton.disabled = true; ui.overlay.hidden = false;
    ui.overlayKicker.textContent = won ? '你把微光带回了森林' : '冒险有时也需要第二次尝试';
    ui.overlayTitle.textContent = won ? '森林因你而明亮' : '在苔藓里休息一下';
    ui.overlayBody.innerHTML = won ? `收齐 <strong>12 颗星露</strong>，点亮了树心祭坛。<br>这趟冒险用了 <strong>${Math.floor(elapsed / 60)} 分 ${Math.floor(elapsed % 60)} 秒</strong>。` : `你带回了 <strong>${count} 颗星露</strong>。<br>再试一次，记得用叶风冲刺保护自己。`;
    ui.startButton.innerHTML = '再玩一次 <span aria-hidden="true">↻</span>'; ui.overlayHint.textContent = won ? '小小的你，也能照亮整片森林。' : '冲刺期间无敌，冲刺也能击晕暗影菇。';
    if (won) { const p = W.toScreen(world.shrine.x, world.shrine.y); burst(p.x, p.y - 30, '#f5d68c', 60); beep([523, 659, 784, 1046]); }
    else beep([220, 174, 146], 'triangle');
  }
  function inputDirection() {
    const x = Number(keys.has('d') || keys.has('arrowright') || touch.has('right')) - Number(keys.has('a') || keys.has('arrowleft') || touch.has('left'));
    const y = Number(keys.has('s') || keys.has('arrowdown') || touch.has('down')) - Number(keys.has('w') || keys.has('arrowup') || touch.has('up'));
    if (!x && !y) return null;
    const wx = x + y, wy = y - x, len = Math.hypot(wx, wy);
    return { x: wx / len, y: wy / len };
  }
  function dash() {
    if (mode !== 'playing' || player.cooldown > 0) return;
    player.lastDirection = inputDirection() || player.lastDirection;
    player.dash = 0.23; player.cooldown = 1.8; player.path = []; clickTarget = null;
    beep([329, 493], 'triangle', 0.035);
  }
  function face(dx, dy) {
    const sx = dx - dy, sy = dx + dy;
    const right = Math.abs(sx) < 0.01 ? player.face % 2 === 0 : sx > 0;
    player.face = (sy >= 0 ? 0 : 2) + (right ? 0 : 1);
  }
  function update(dt) {
    clock += dt;
    if (toastTime > 0) { toastTime -= dt; if (toastTime <= 0) ui.toast.classList.remove('visible'); }
    particles.forEach(p => { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 22 * dt; p.life -= dt; }); particles = particles.filter(p => p.life > 0);
    trail.forEach(p => p.life -= dt); trail = trail.filter(p => p.life > 0);
    shake = Math.max(0, shake - dt * 18);
    if (mode !== 'playing') return;
    elapsed += dt; ui.timeLabel.textContent = `${String(Math.floor(elapsed / 60)).padStart(2, '0')}:${String(Math.floor(elapsed % 60)).padStart(2, '0')}`;
    player.invincible = Math.max(0, player.invincible - dt); player.cooldown = Math.max(0, player.cooldown - dt);
    ui.dashFill.style.width = `${(1 - player.cooldown / 1.8) * 100}%`;
    let dir = inputDirection();
    if (dir) { player.path = []; clickTarget = null; }
    else if (player.path.length && player.dash <= 0) {
      let waypoint = player.path[0], dx = waypoint.x - player.x, dy = waypoint.y - player.y, len = Math.hypot(dx, dy);
      if (len < 0.12) { player.path.shift(); waypoint = player.path[0]; if (waypoint) { dx = waypoint.x - player.x; dy = waypoint.y - player.y; len = Math.hypot(dx, dy); } else { clickTarget = null; } }
      if (waypoint && len > 0.001) dir = { x: dx / len, y: dy / len, remaining: len };
    }
    const dashing = player.dash > 0;
    if (dashing) { dir = player.lastDirection; player.dash = Math.max(0, player.dash - dt); }
    player.moving = Boolean(dir);
    if (dir) {
      const speed = dashing ? 12.5 : 3.4;
      const step = Math.min(speed * dt, dir.remaining || Infinity);
      const moved = W.move(world, player, dir.x * step, dir.y * step);
      player.moving = moved;
      if (moved) { player.lastDirection = { x: dir.x, y: dir.y }; face(dir.x, dir.y); player.walk += dt * (dashing ? 25 : 13); }
      else if (dashing) player.dash = 0;
      if (dashing) { const pos = W.toScreen(player.x, player.y); trail.push({ ...pos, face: player.face, life: 0.18 }); }
    }

    for (const enemy of enemies) {
      enemy.stun = Math.max(0, enemy.stun - dt); enemy.rethink -= dt;
      if (enemy.stun > 0) continue;
      const separation = W.distance(player, enemy);
      enemy.chasing = separation < 4.6;
      if (enemy.rethink <= 0) {
        const target = enemy.chasing ? player : { x: enemy.home.x + Math.sin(clock * 0.45 + enemy.phase) * 1.1, y: enemy.home.y + Math.cos(clock * 0.35 + enemy.phase) * 1.1 };
        enemy.path = W.path(world, enemy, target) || []; enemy.rethink = 0.38;
      }
      if (enemy.path.length) {
        const target = enemy.path[0], dx = target.x - enemy.x, dy = target.y - enemy.y, len = Math.hypot(dx, dy);
        if (len < 0.1) enemy.path.shift();
        else { const step = Math.min((enemy.chasing ? 2.2 : 0.75) * dt, len); W.move(world, enemy, dx / len * step, dy / len * step); }
      }
      if (separation < 0.58) {
        if (dashing) { enemy.stun = 3.0; enemy.path = []; const p = W.toScreen(enemy.x, enemy.y); burst(p.x, p.y - 12, '#b5d17e', 15); beep([587, 440], 'triangle', 0.03); }
        else if (player.invincible <= 0) {
          player.hearts--; player.invincible = 1.7; shake = reducedMotion ? 0 : 4; const p = W.toScreen(player.x, player.y); burst(p.x, p.y - 18, '#f19892', 10); refreshHud(); beep([180, 130], 'sawtooth', 0.015);
          const away = { x: player.x - enemy.x, y: player.y - enemy.y }, length = Math.hypot(away.x, away.y) || 1; W.move(world, player, away.x / length * 0.25, away.y / length * 0.25);
          if (!player.hearts) { finish(false); return; }
          message('被暗影菇碰到了！空格冲刺可以保护你', 2);
        }
      }
    }
    for (const star of world.stars) {
      if (!star.collected && W.distance(player, star) < 0.55) {
        star.collected = true; count++; const p = W.toScreen(star.x, star.y); burst(p.x, p.y - 13, '#f6d897', 18); refreshHud(); beep([659, 880, 1046], 'sine', 0.035);
        if (count === 12) message('星露集齐了！回到中央树心祭坛', 4);
        else if (count === 1) message('第一颗星露！继续探索森林吧');
      }
    }
    if (count === 12 && W.distance(player, world.shrine) < 0.9) finish(true);
  }

  // The renderer below paints the forest directly with Canvas; the player uses the existing PNG sprite.
  function diamond(x, y, w, h, fill) {
    ctx.fillStyle = fill; ctx.beginPath(); ctx.moveTo(x, y - h / 2); ctx.lineTo(x + w / 2, y); ctx.lineTo(x, y + h / 2); ctx.lineTo(x - w / 2, y); ctx.closePath(); ctx.fill();
  }
  function ellipse(x, y, rx, ry, color) { ctx.fillStyle = color; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fill(); }
  function pixel(x, y, size, color) { ctx.fillStyle = color; ctx.fillRect(Math.round(x), Math.round(y), size, size); }
  function starShape(x, y, size, color) { ctx.fillStyle = color; ctx.beginPath(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, r = i % 2 ? size * 0.27 : size; const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r; if (!i) ctx.moveTo(px, py); else ctx.lineTo(px, py); } ctx.closePath(); ctx.fill(); }

  function paintGround() {
    ctx.fillStyle = '#132b23'; ctx.fillRect(0, 0, 960, 640);
    const mid = W.toScreen(9.5, 9.5);
    ellipse(mid.x, mid.y + 100, 425, 208, '#0d211b');
    const palette = ['#294a30', '#2c5033', '#315437', '#28482f', '#2d4d32'];
    for (const tile of world.ground) {
      const p = W.toScreen(tile.x + 0.5, tile.y + 0.5);
      const road = (tile.x === 9 && tile.y > 5 && tile.y < 14) || (tile.y === 9 && tile.x > 5 && tile.x < 14);
      diamond(p.x, p.y + 4, 48, 24, '#203b2a'); diamond(p.x, p.y, 48, 24, road ? '#586440' : palette[tile.tone]);
      for (const [a, b, c] of tile.texture) {
        const dx = (a - b) * 20, dy = (a + b - 1) * 9;
        pixel(p.x + dx, p.y + dy, c > 0.75 ? 3 : 2, road ? (c > 0.5 ? '#6e754d' : '#495b3c') : (c > 0.5 ? '#406440' : '#23422e'));
      }
      if (tile.flower && !world.blocked[tile.y * W.N + tile.x] && !road) { pixel(p.x + 9, p.y - 2, 2, tile.tone > 2 ? '#d5a76e' : '#87b2a2'); pixel(p.x + 9, p.y, 1, '#517844'); }
    }
    // The trailing edge makes the little forest read as a raised island.
    ctx.fillStyle = '#183726';
    ctx.beginPath(); ctx.moveTo(24, 324); ctx.lineTo(480, 552); ctx.lineTo(936, 324); ctx.lineTo(936, 333); ctx.lineTo(480, 565); ctx.lineTo(24, 333); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#476240'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(24, 325); ctx.lineTo(480, 553); ctx.lineTo(936, 325); ctx.stroke();
    if (clickTarget && mode === 'playing') {
      const p = W.toScreen(clickTarget.x, clickTarget.y);
      ctx.strokeStyle = '#d1df9a'; ctx.lineWidth = 1.5; ctx.globalAlpha = 0.55 + Math.sin(clock * 5) * 0.2;
      ctx.beginPath(); ctx.ellipse(p.x, p.y, 12, 5, 0, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1;
      player.path.forEach((point, i) => { if (i % 2 === 0) { const q = W.toScreen(point.x, point.y); pixel(q.x, q.y - 1, 2, '#acbe73'); } });
    }
    if (count === 12 && mode === 'playing') {
      const p = W.toScreen(player.x, player.y), s = W.toScreen(world.shrine.x, world.shrine.y);
      ctx.save(); ctx.setLineDash([4, 8]); ctx.lineDashOffset = -clock * 20; ctx.strokeStyle = '#e4cb8580'; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(s.x, s.y); ctx.stroke(); ctx.restore();
    }
  }

  function paintTree(tree) {
    const p = W.toScreen(tree.x, tree.y), x = Math.round(p.x), y = Math.round(p.y), s = tree.size;
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ellipse(0, 2, 22, 9, '#0c241986');
    ctx.fillStyle = '#423f28'; ctx.fillRect(-5, -43, 11, 45); ctx.fillStyle = '#696043'; ctx.fillRect(-3, -42, 3, 42); ctx.fillStyle = '#283b23'; ctx.fillRect(2, -25, 4, 25);
    ctx.fillStyle = '#283d21'; ctx.fillRect(-8, -2, 17, 4); ctx.fillRect(-12, 1, 25, 2);
    const palettes = [['#1c3d28', '#2e5431', '#426937', '#6b8547'], ['#193c2b', '#28573a', '#3f7043', '#70914d'], ['#24442b', '#3b5c32', '#56713b', '#8e994f']];
    const colors = palettes[tree.kind];
    const layers = [[-26, -67, 46, 24], [-34, -56, 64, 26], [-27, -39, 48, 20], [-17, -81, 33, 22]];
    layers.forEach(([a, b, w, h], i) => { ctx.fillStyle = colors[0]; ctx.fillRect(a - 3, b + 5, w + 6, h); ctx.fillStyle = colors[1]; ctx.fillRect(a, b, w, h); ctx.fillStyle = colors[2]; ctx.fillRect(a + 3, b + 2, w - 12, Math.max(7, h - 9)); ctx.fillStyle = colors[3]; ctx.fillRect(a + 6, b, Math.floor(w * 0.4), 5); pixel(a + 4 + (tree.seed * 31 + i * 7) % (w - 9), b + 8, 4, colors[2]); });
    if (tree.kind === 2) { pixel(12, -29, 3, '#b4a55c'); pixel(-18, -49, 3, '#859946'); }
    ctx.restore();
  }
  function paintRock(rock) {
    const p = W.toScreen(rock.x, rock.y);
    ellipse(p.x, p.y + 1, 14, 6, '#10271b80');
    ctx.fillStyle = '#354639'; ctx.fillRect(p.x - 14, p.y - 14, 25, 13); ctx.fillRect(p.x - 10, p.y - 20, 17, 7);
    ctx.fillStyle = '#657561'; ctx.fillRect(p.x - 10, p.y - 18, 15, 5); ctx.fillStyle = '#4c6149'; ctx.fillRect(p.x - 12, p.y - 12, 14, 9); ctx.fillStyle = '#6d844e'; ctx.fillRect(p.x - 9, p.y - 20, 6, 3);
  }
  function paintShrine() {
    const p = W.toScreen(world.shrine.x, world.shrine.y), ready = count === 12 || mode === 'won';
    ellipse(p.x, p.y, 34, 14, '#243e2d'); diamond(p.x, p.y - 1, 52, 26, '#526a4b'); diamond(p.x, p.y - 5, 40, 20, '#708163');
    const stones = [[-21, -8], [18, -9], [-12, 5], [12, 4]];
    stones.forEach(([x, y]) => { ctx.fillStyle = '#82927b'; ctx.fillRect(p.x + x - 3, p.y + y - 10, 7, 11); ctx.fillStyle = '#536d55'; ctx.fillRect(p.x + x, p.y + y - 7, 4, 9); });
    ctx.save(); ctx.translate(p.x, p.y - 31);
    ctx.fillStyle = '#2e5136'; ctx.fillRect(-9, -14, 19, 36); ctx.fillStyle = '#719360'; ctx.fillRect(-7, -15, 5, 28); ctx.fillStyle = '#4d7449'; ctx.fillRect(-2, -11, 10, 31);
    diamond(0, -18, 30, 14, '#688c57'); diamond(0, -21, 23, 11, '#95b675');
    const glow = ctx.createRadialGradient(0, -26, 1, 0, -26, ready ? 60 : 28); glow.addColorStop(0, ready ? '#f5d18c90' : '#a2d6b14a'); glow.addColorStop(1, '#9ad8a000'); ctx.fillStyle = glow; ctx.fillRect(-70, -95, 140, 140);
    starShape(0, -24 + Math.sin(clock * 1.7) * 2, ready ? 12 : 7, ready ? '#ffe2a0' : '#abdbaf');
    ctx.restore();
    if (ready) { ctx.strokeStyle = '#e5d09380'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(p.x, p.y - 3, 37 + Math.sin(clock * 2) * 2, 16, 0, 0, Math.PI * 2); ctx.stroke(); }
  }
  function paintStar(star) {
    const p = W.toScreen(star.x, star.y), bob = Math.sin(clock * 2.8 + star.phase) * 3;
    ellipse(p.x, p.y + 1, 9, 3, '#172a1c70');
    const glow = ctx.createRadialGradient(p.x, p.y - 13, 1, p.x, p.y - 13, 22); glow.addColorStop(0, '#e6cc8265'); glow.addColorStop(1, '#f1d09500'); ctx.fillStyle = glow; ctx.fillRect(p.x - 25, p.y - 40, 50, 50);
    starShape(p.x, p.y - 13 + bob, 7, '#edce82'); starShape(p.x - 1, p.y - 14 + bob, 3, '#fff0bc');
  }
  function paintEnemy(enemy) {
    const p = W.toScreen(enemy.x, enemy.y), bob = enemy.stun > 0 ? 0 : Math.abs(Math.sin(clock * (enemy.chasing ? 8 : 4) + enemy.phase)) * 2;
    ctx.save(); ctx.translate(Math.round(p.x), Math.round(p.y - bob));
    ellipse(0, 2 + bob, 14, 5, '#071d197d');
    ctx.fillStyle = enemy.stun > 0 ? '#bbb597' : '#b1a9a8'; ctx.fillRect(-7, -13, 14, 13); ctx.fillStyle = '#746e7f'; ctx.fillRect(2, -13, 5, 13);
    ctx.fillStyle = enemy.chasing && enemy.stun <= 0 ? '#6b4059' : '#524d68'; ctx.fillRect(-17, -22, 34, 10); ctx.fillRect(-12, -29, 24, 9); ctx.fillRect(-5, -33, 10, 5);
    ctx.fillStyle = '#847389'; ctx.fillRect(-12, -27, 15, 5); ctx.fillStyle = '#bca6b0'; ctx.fillRect(-8, -28, 4, 3); ctx.fillRect(9, -21, 4, 3);
    ctx.fillStyle = enemy.chasing && enemy.stun <= 0 ? '#edb89d' : '#262d38'; ctx.fillRect(-5, -10, 3, 3); ctx.fillRect(3, -10, 3, 3);
    if (enemy.stun > 0) { for (let i = 0; i < 3; i++) { const angle = clock * 4 + i * Math.PI * 2 / 3; starShape(Math.cos(angle) * 13, -40 + Math.sin(angle) * 4, 3, '#d5dd9a'); } }
    ctx.restore();
  }
  function paintPlayer() {
    const p = W.toScreen(player.x, player.y), moving = player.moving && mode === 'playing';
    const bob = moving ? Math.abs(Math.sin(player.walk)) * 2 : Math.sin(clock * 1.8) * 0.6;
    ellipse(p.x, p.y + 1, 12, 5, '#0a2416a0');
    if (!loaded) return;
    ctx.save(); ctx.translate(Math.round(p.x), Math.round(p.y - bob));
    if (player.invincible > 0 && Math.floor(clock * 12) % 2 === 0) ctx.globalAlpha = 0.45;
    const swing = moving && !reducedMotion ? Math.sin(player.walk) * 0.025 : 0;
    ctx.rotate(swing); ctx.imageSmoothingEnabled = false;
    ctx.drawImage(sheet, player.face * 128, 0, 128, 128, -48, -84, 96, 96); ctx.restore();
  }
  function render() {
    ctx.imageSmoothingEnabled = false; ctx.save();
    if (shake > 0) ctx.translate(Math.sin(clock * 130) * shake, Math.cos(clock * 115) * shake);
    paintGround();
    for (const ghost of trail) { ctx.save(); ctx.globalAlpha = ghost.life / 0.18 * 0.22; ctx.drawImage(sheet, ghost.face * 128, 0, 128, 128, ghost.x - 48, ghost.y - 84, 96, 96); ctx.restore(); }
    const entities = [
      ...world.trees.map(tree => ({ depth: tree.x + tree.y, draw: () => paintTree(tree) })),
      ...world.rocks.map(rock => ({ depth: rock.x + rock.y, draw: () => paintRock(rock) })),
      ...world.stars.filter(star => !star.collected).map(star => ({ depth: star.x + star.y, draw: () => paintStar(star) })),
      ...enemies.map(enemy => ({ depth: enemy.x + enemy.y, draw: () => paintEnemy(enemy) })),
      { depth: world.shrine.x + world.shrine.y, draw: paintShrine },
      { depth: player.x + player.y, draw: paintPlayer }
    ];
    entities.sort((a, b) => a.depth - b.depth).forEach(entity => entity.draw());
    particles.forEach(p => { ctx.globalAlpha = Math.min(1, p.life * 2); pixel(p.x, p.y, p.size, p.color); }); ctx.globalAlpha = 1;
    fireflies.forEach(f => { const alpha = (Math.sin(clock * f.speed * 1.8 + f.phase) + 1) * 0.25; ctx.globalAlpha = alpha; pixel(f.x + Math.sin(clock * 0.3 + f.phase) * 12, f.y + Math.cos(clock * 0.4 + f.phase) * 8, f.size, '#dfdc9c'); }); ctx.globalAlpha = 1;
    const vignette = ctx.createRadialGradient(480, 338, 170, 480, 335, 535); vignette.addColorStop(0, '#071e1800'); vignette.addColorStop(0.7, '#071e1808'); vignette.addColorStop(1, '#04191396'); ctx.fillStyle = vignette; ctx.fillRect(0, 0, 960, 640);
    ctx.restore();
  }

  ui.startButton.addEventListener('click', start);
  ui.pauseButton.addEventListener('click', pause);
  ui.restartButton.addEventListener('click', () => { mode = 'intro'; start(); });
  ui.soundButton.addEventListener('click', () => { soundOn = !soundOn; ui.soundButton.textContent = soundOn ? '声音：开' : '声音：关'; ui.soundButton.setAttribute('aria-label', soundOn ? '关闭声音' : '开启声音'); if (soundOn) beep([523, 659], 'sine', 0.025); });
  $('touchDash').addEventListener('pointerdown', e => { e.preventDefault(); dash(); });
  document.querySelectorAll('[data-dir]').forEach(button => {
    button.addEventListener('pointerdown', e => { e.preventDefault(); if (mode !== 'playing') return; button.setPointerCapture(e.pointerId); touch.add(button.dataset.dir); button.classList.add('active'); });
    const release = () => { touch.delete(button.dataset.dir); button.classList.remove('active'); };
    button.addEventListener('pointerup', release); button.addEventListener('pointercancel', release); button.addEventListener('lostpointercapture', release);
  });
  const controlKeys = new Set(['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ', 'p', 'escape']);
  window.addEventListener('keydown', e => {
    const key = e.key.toLowerCase();
    if (!controlKeys.has(key) || e.ctrlKey || e.metaKey || e.altKey) return;
    // Keep Space/Enter activation available on the start and pause buttons.
    if (e.target instanceof HTMLButtonElement && (key === ' ' || key === 'enter')) return;
    if (mode === 'playing' || mode === 'paused') e.preventDefault();
    if (e.repeat && [' ', 'p', 'escape'].includes(key)) return;
    if (key === 'p' || key === 'escape') pause();
    else if (key === ' ') dash();
    else if (mode === 'playing') keys.add(key);
  });
  window.addEventListener('keyup', e => keys.delete(e.key.toLowerCase()));
  window.addEventListener('blur', () => { keys.clear(); touch.clear(); if (mode === 'playing') pause(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden && mode === 'playing') pause(); });
  canvas.addEventListener('pointerdown', e => {
    if (mode !== 'playing' || e.button !== 0) return;
    e.preventDefault(); canvas.focus({ preventScroll: true });
    const rect = canvas.getBoundingClientRect(), target = W.toWorld((e.clientX - rect.left) * 960 / rect.width, (e.clientY - rect.top) * 640 / rect.height);
    const route = W.path(world, player, target);
    if (!route) { message('这里有树木挡路，点一块空地试试', 1.6); return; }
    player.path = route; clickTarget = route[route.length - 1];
  });
  reset();
  let previous = performance.now();
  function frame(now) { const dt = Math.min((now - previous) / 1000, 0.04); previous = now; update(dt); render(); requestAnimationFrame(frame); }
  requestAnimationFrame(frame);
})();
