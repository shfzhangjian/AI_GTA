const assert = require('assert');
const Boss = require('../src/boss.js');

const boss = Boss.createBossState();
assert.deepStrictEqual(Boss.tick(boss, 2, false)[0].type, 'telegraph');
const remaining = boss.telegraph.remaining;
assert.deepStrictEqual(Boss.tick(boss, 1, true), []);
assert.strictEqual(boss.telegraph.remaining, remaining, 'pause freezes telegraph');
assert.deepStrictEqual(Boss.tick(boss, 1, false)[0], {type:'fire', attack:'ink-ring', phase:1});
assert.ok(boss.cooldown > 2, 'post-fire cooldown leaves dodge window');
const reset = Boss.resetPhase(boss, 2);
assert.deepStrictEqual(reset, {type:'clear-threats'});
assert.strictEqual(boss.telegraph, null, 'phase clears pending attack');
assert.strictEqual(boss.next, 'ruler-dash', 'phase two begins with ruler attack');
assert.deepStrictEqual(Boss.tick(boss, 1, false)[0].attack, 'ruler-dash');
assert.deepStrictEqual(Boss.tick(boss, 2, false)[0], {type:'fire', attack:'ruler-dash', phase:2});
console.log('boss tests: ok');
