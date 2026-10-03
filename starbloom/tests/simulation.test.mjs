import test from 'node:test';
import assert from 'node:assert/strict';
import { Simulation, V, arc, toward, tangent, walk, UPGRADES } from '../core.js';

const DT = 1 / 60;
const near = (a, b, tolerance = 1e-8, message = '') => assert.ok(Math.abs(a - b) < tolerance, `${message} ${a} != ${b}`);
const unit = (v, label) => { for (const n of v.toArray()) assert.ok(Number.isFinite(n), `${label} must be finite`); near(v.length(), 1, 1e-8, `${label} unit length`); };
const tangentUnit = (v, n, label) => { unit(v, label); near(v.dot(n), 0, 1e-8, `${label} tangency`); };
function quietSimulation(level = 0) { const s = new Simulation(); s.start(level); s.wait = 1e9; return s; }
function assertGeometry(s) {
  unit(s.player.n, 'player radius'); tangentUnit(s.camForward, s.player.n, 'camera heading');
  tangentUnit(s.player.forward, s.player.n, 'player heading'); tangentUnit(s.player.aim, s.player.n, 'aim heading');
  for (const e of s.enemies) { unit(e.n, 'enemy radius'); tangentUnit(e.forward, e.n, 'enemy heading'); }
  for (const b of s.bullets) { unit(b.n, 'bullet radius'); tangentUnit(b.dir, b.n, 'bullet heading'); }
  assert.ok(s.player.hp >= 0 && s.player.hp <= s.stats.maxHp);
}
function combatInput(s) {
  const p = s.player, n = p.n, cf = s.camForward, right = V().crossVectors(cf, n).normalize();
  const nearest = s.enemies.map(e => ({ e, d: arc(e.n, n) })).sort((a, b) => a.d - b.d)[0];
  if (!nearest) return { fire: true };
  const { e, d } = nearest, direction = toward(n, e.n);
  const move = d > 6 ? direction : d < 4 ? direction.negate() : V().crossVectors(direction, n).normalize().multiplyScalar(0.8);
  return { fire: true, x: move.dot(right), y: move.dot(cf), dash: d < 2.4 };
}
function clearWithCombat(s, input = combatInput) {
  const counts = {}, initialKills = s.kills;
  let ticks = 0, clearHealChecked = false;
  while (s.phase === 'playing' && ticks < 60 * 180) {
    s.events = [];
    const beforeHp = s.player.hp;
    s.update(DT, input(s));
    ticks++;
    for (const e of s.events) counts[e.type] = (counts[e.type] || 0) + 1;
    if (ticks % 30 === 0) assertGeometry(s);
    if (s.events.some(e => e.type === 'clear')) {
      const damage = s.events.filter(e => e.type === 'hurt').reduce((sum, e) => sum + e.amount, 0);
      const kills = s.events.filter(e => e.type === 'kill').length;
      near(s.player.hp, Math.min(s.stats.maxHp, beforeHp - damage + kills * s.stats.leech + 18), 1e-8, 'clear heals by 18 with no full reset');
      clearHealChecked = true;
    }
  }
  assert.equal(s.phase, 'upgrade', `combat must clear planet ${s.level}, snapshot=${JSON.stringify(s.snapshot())}`);
  assert.equal(s.wave, 3);
  assert.equal(s.enemies.length, 0);
  assert.equal(s.kills - initialKills, 24 + 3 * s.level, 'all real spawned enemies killed');
  assert.equal(counts.wave, 3);
  assert.equal(counts.between, 2);
  assert.equal(counts.clear, 1);
  assert.ok(counts.shoot > 0 && counts.hit > 0 && counts.kill > 0);
  assert.ok(counts.enemyshoot > 0, 'spitters really fire');
  assert.ok(clearHealChecked);
  return { seconds: +(ticks * DT).toFixed(2), hp: s.player.hp, kills: s.kills, events: counts };
}

// Geometric tests isolate movement only; combat tests below never delete or damage enemies directly.
test('geodesic quarter, half, and complete orbits preserve exact surface radius and heading', () => {
  const n = V(0, 1, 0), f = V(0, 0, -1), origin = n.clone(), initialHeading = f.clone();
  for (let quarter = 1; quarter <= 4; quarter++) {
    walk(n, f, f.clone().multiplyScalar(Math.PI * 14 / 2));
    unit(n, 'surface normal'); tangentUnit(f, n, 'heading');
    if (quarter === 1) near(arc(origin, n), 14 * Math.PI / 2);
    if (quarter === 2) near(n.dot(origin), -1);
  }
  near(n.distanceTo(origin), 0); near(f.distanceTo(initialHeading), 0);
});

test('actual movement crosses both poles repeatedly without radius or orientation drift', () => {
  for (const level of [0, 2]) {
    const s = quietSimulation(level); let minY = 1, maxY = -1;
    for (let i = 0; i < 60 * 100; i++) {
      s.update(DT, { y: 1, autoAim: false });
      minY = Math.min(minY, s.player.n.y); maxY = Math.max(maxY, s.player.n.y);
      if (i % 10 === 0) assertGeometry(s);
    }
    assert.ok(minY < -0.999 && maxY > 0.999, `level ${level} must pass both poles`);
  }
});

test('randomized geodesic walks stay normalized and tangent over 20,000 steps', () => {
  let seed = 54321;
  const random = () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 2 ** 32;
  const n = V(0, 1, 0), f = V(0, 0, -1);
  for (let i = 0; i < 20000; i++) {
    const dir = tangent(V(random() - .5, random() - .5, random() - .5), n);
    walk(n, f, dir.multiplyScalar(random() * 1.5));
    unit(n, 'surface normal'); tangentUnit(f, n, 'heading');
  }
});

test('toward handles coincident and antipodal points at every principal pole', () => {
  for (const a of [V(1, 0, 0), V(0, 1, 0), V(0, 0, 1), V(0, 0, -1)]) {
    tangentUnit(toward(a, a), a, 'coincident fallback');
    tangentUnit(toward(a, a.clone().negate()), a, 'antipodal fallback');
  }
});

test('stationary auto-aim and firing clears the real first three waves', () => {
  const s = new Simulation(); s.start(0);
  const result = clearWithCombat(s, () => ({ fire: true }));
  assert.equal(s.kills, 24); assert.ok(s.shots > 50); assert.ok(s.player.hp > 0);
  console.log('Stationary combat:', JSON.stringify(result));
});

test('a complete five-planet run wins through combat and only offered upgrades', () => {
  const s = new Simulation(); s.start(0); const results = [];
  for (let level = 0; level < 5; level++) {
    if (level) {
      const hp = s.player.hp, stats = { ...s.stats }, upgrades = [...s.upgrades], kills = s.kills;
      assert.equal(s.phase, 'route'); s.beginLevel(level);
      assert.equal(s.player.hp, hp, 'HP carries across planets');
      assert.deepEqual(s.stats, stats); assert.deepEqual(s.upgrades, upgrades); assert.equal(s.kills, kills);
      assert.equal(s.wave, 0); assert.equal(s.bullets.length, 0); assert.equal(s.enemies.length, 0);
      assert.equal(s.player.invuln, 1.5); near(s.player.n.distanceTo(V(0, 1, 0)), 0);
    }
    const result = clearWithCombat(s);
    assert.deepEqual(s.visited, Array.from({ length: level + 1 }, (_, i) => i));
    const choices = s.choices();
    assert.equal(choices.length, 3); assert.equal(new Set(choices.map(c => c.id)).size, 3);
    const priority = s.stats.leech > 0 ? ['power', 'rapid', 'split', 'health', 'pierce', 'leech', 'speed', 'dash'] : ['leech', 'power', 'rapid', 'split', 'health', 'pierce', 'speed', 'dash'];
    const selected = priority.find(id => choices.some(c => c.id === id));
    assert.ok(s.applyUpgrade(selected));
    assert.equal(s.phase, level === 4 ? 'won' : 'route');
    results.push({ level, ...result, selected });
  }
  assert.equal(s.kills, 150); assert.equal(s.upgrades.length, 5); assert.ok(s.shots > 150);
  const frozen = s.snapshot(), time = s.time; s.update(10, { fire: true, y: 1 });
  assert.deepEqual(s.snapshot(), frozen); assert.equal(s.time, time);
  console.log('Five-planet real-combat run:', JSON.stringify({ results, snapshot: s.snapshot(), shots: s.shots }));
});

test('each upgrade materially changes its advertised stat or projectile behavior', () => {
  for (const { id } of UPGRADES) {
    const s = new Simulation(); s.phase = 'upgrade'; s.player.hp = 50;
    const before = { ...s.stats }; assert.ok(s.applyUpgrade(id)); assert.deepEqual(s.upgrades, [id]);
    assert.equal(s.phase, 'route');
    if (id === 'power') near(s.stats.damage, before.damage * 1.35);
    if (id === 'rapid') near(s.stats.interval, before.interval * .78);
    if (id === 'split') { s.shoot(s.player.n, s.player.aim); assert.equal(s.bullets.length, 3); assert.equal(s.stats.spread, 1); }
    if (id === 'health') { assert.equal(s.stats.maxHp, 125); assert.equal(s.player.hp, 85); }
    if (id === 'dash') near(s.stats.dashCooldown, before.dashCooldown * .7);
    if (id === 'leech') assert.equal(s.stats.leech, 3);
    if (id === 'pierce') { s.shoot(s.player.n, s.player.aim); assert.equal(s.bullets[0].pierce, 1); }
    if (id === 'speed') near(s.stats.speed, before.speed * 1.18);
    assert.equal(s.applyUpgrade(id), false, 'cannot upgrade outside the upgrade screen');
  }
  const invalid = new Simulation(); invalid.phase = 'upgrade'; assert.equal(invalid.applyUpgrade('invalid'), false); assert.equal(invalid.phase, 'upgrade');
});

test('stacked upgrades respect spread and cooldown caps', () => {
  const s = new Simulation();
  for (let i = 0; i < 40; i++) for (const id of ['split', 'rapid', 'dash']) { s.phase = 'upgrade'; s.applyUpgrade(id); }
  assert.equal(s.stats.spread, 3); assert.equal(s.stats.interval, .06); assert.equal(s.stats.dashCooldown, .6);
  s.shoot(s.player.n, s.player.aim); assert.equal(s.bullets.length, 7);
});

test('damage, invulnerability, dash immunity, and death/reset behave correctly', () => {
  const s = quietSimulation(); s.damage(12); assert.equal(s.player.hp, 88); s.damage(12); assert.equal(s.player.hp, 88);
  for (let i = 0; i < 60; i++) s.update(DT);
  s.update(DT, { y: 1, dash: true }); assert.ok(s.player.dash > 0); s.damage(999); assert.equal(s.player.hp, 88);
  for (let i = 0; i < 60; i++) s.update(DT);
  s.damage(999); assert.equal(s.player.hp, 0); assert.equal(s.phase, 'dead');
  const time = s.time; s.update(1, { fire: true }); assert.equal(s.time, time);
  s.start(0); assert.deepEqual(s.snapshot(), { phase: 'playing', level: 0, wave: 0, enemies: 0, hp: 100, maxHp: 100, kills: 0, visited: [], upgrades: [] });
  assert.equal(s.shots, 0); assert.equal(s.bullets.length, 0); assert.equal(s.stats.leech, 0);
});

test('leech cannot give positive HP to a character already killed in the same frame', () => {
  const s = quietSimulation(); s.player.hp = 12; s.stats.leech = 3;
  s.enemies.push({ id: 888, n: s.player.n.clone(), forward: V(1, 0, 0), type: 'beetle', hp: 15, maxHp: 15, cooldown: 10, flash: 0, charge: 0 });
  s.update(DT, { fire: true });
  assert.equal(s.phase, 'dead'); assert.equal(s.kills, 1); assert.equal(s.player.hp, 0);
});
