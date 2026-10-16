'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const subjects = require('../src/subjects.js');
const { levels, initial, act, solved, solution } = subjects;
function deepFreeze(object) {
  if (object && typeof object === 'object') {
    Object.values(object).forEach(deepFreeze);
    Object.freeze(object);
  }
  return object;
}
function execute(levelIndex, taskIndex, actions) {
  let state = initial(levelIndex, taskIndex);
  for (const action of actions) {
    const snapshot = JSON.stringify(state);
    deepFreeze(state);
    deepFreeze(action);
    const result = act(levelIndex, taskIndex, state, action);
    assert.equal(result.ok, true, result.message);
    assert.equal(JSON.stringify(state), snapshot, 'input state must stay unchanged');
    assert.notEqual(result.state, state, 'valid actions return fresh state');
    assert.equal(typeof result.message, 'string');
    assert.ok(result.message.length > 0);
    state = result.state;
  }
  return state;
}
function rejection(levelIndex, action, taskIndex = 0, overrideState) {
  const state = overrideState || initial(levelIndex, taskIndex);
  deepFreeze(state);
  const result = act(levelIndex, taskIndex, state, action);
  assert.equal(result.ok, false, `must reject ${JSON.stringify(action)}`);
  assert.equal(result.state, state);
  assert.equal(typeof result.message, 'string');
  assert.ok(result.message.length > 0);
}

test('metadata describes eight frozen levels, three tasks each, and preferred renderer fields', () => {
  assert.equal(levels.length, 8);
  assert.equal(new Set(levels.map(level => level.id)).size, 8);
  for (const level of levels) {
    for (const key of ['id', 'title', 'subtitle', 'concept', 'unit']) assert.equal(typeof level[key], 'string');
    assert.equal(level.tasks.length, 3);
    assert.ok(Object.isFrozen(level));
    assert.ok(Object.isFrozen(level.tasks));
    level.tasks.forEach(task => assert.ok(Object.isFrozen(task)));
  }
  assert.deepEqual(levels[3].tasks.map(t => [t.m, t.b, t.x]), [[2, 1, -1], [-1, 2, 3], [0.5, -1, 4]]);
  assert.deepEqual(levels[5].tasks.map(t => [t.left, t.right]), [[4, 0], [7, 0], [6, 2]]);
  assert.deepEqual(levels[6].tasks.map(t => [t.force, t.work]), [[4, 12], [6, 30], [8, 12]]);
  assert.deepEqual(levels[7].tasks.map(t => [t.voltage, t.r1, t.current]), [[6, 2, 1], [12, 4, 2], [9, 3, 0.5]]);
});

for (let l = 0; l < 8; l++) {
  for (let t = 0; t < 3; t++) {
    test(`demo solution completes ${levels[l].id} task ${t + 1}, immutably`, () => {
      assert.equal(solved(l, t, initial(l, t)), false);
      const actions = solution(l, t);
      assert.ok(actions.length > 0);
      const state = execute(l, t, actions);
      assert.equal(solved(l, t, state), true, JSON.stringify(state));
      assert.deepEqual(initial(l, t), initial(l, t));
      assert.notEqual(initial(l, t), initial(l, t));
    });
  }
}

test('UMD attaches to browser global without CommonJS', () => {
  const context = {};
  context.window = context;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(require.resolve('../src/subjects.js'), 'utf8'), context);
  assert.equal(context.window.PaperSubjects.levels.length, 8);
  assert.equal(typeof context.window.PaperSubjects.act, 'function');
  assert.equal(context.window.PaperSubjects.solved(0, 0, { value: 0 }), true);
});

test('invalid selectors throw clear RangeErrors', () => {
  for (const [l, t] of [[-1, 0], [8, 0], [0.5, 0], [NaN, 0], [0, -1], [0, 3], [0, 0.5]]) {
    assert.throws(() => initial(l, t), RangeError);
    assert.throws(() => solution(l, t), RangeError);
    assert.throws(() => solved(l, t, {}), RangeError);
    assert.throws(() => act(l, t, {}, {}), RangeError);
  }
});

test('all levels reject malformed actions and invalid states', () => {
  for (let l = 0; l < 8; l++) {
    for (const action of [null, undefined, {}, { type: 'unknown' }]) rejection(l, action);
    assert.equal(solved(l, 0, null), false);
    assert.equal(solved(l, 0, {}), false);
    assert.equal(solved(l, 0, { value: Infinity }), false);
    const invalidState = {};
    const result = act(l, 0, invalidState, solution(l, 0)[0]);
    assert.equal(result.ok, false);
    assert.equal(result.state, invalidState);
  }
});

test('numberline permits alternate paths, rejects wrong steps and bounds', () => {
  assert.equal(solved(0, 0, execute(0, 0, [1, -1, -1, -1, -1, -1].map(value => ({ type: 'step', value })))), true);
  for (const value of [0, 2, -2, 0.5, NaN, Infinity, -Infinity, '1']) rejection(0, { type: 'step', value });
  rejection(0, { type: 'step', value: 1 }, 0, { value: 20 });
  rejection(0, { type: 'step', value: -1 }, 0, { value: -20 });
});

test('fraction arithmetic normalizes gcd, signs, zero, and never accumulates float error', () => {
  assert.deepEqual(act(1, 0, initial(1, 0), { type: 'fraction', n: -1, d: 2 }).state, { n: 1, d: 3 });
  assert.deepEqual(execute(1, 0, [{ type: 'fraction', n: -2, d: 6 }, { type: 'fraction', n: 1, d: -2 }]), { n: 0, d: 1 });
  assert.deepEqual(execute(1, 2, [{ type: 'fraction', n: 1, d: 2 }, { type: 'fraction', n: 1, d: 6 }]), { n: 0, d: 1 });
  let state = initial(1, 0);
  for (let i = 0; i < 1000; i++) {
    state = act(1, 0, state, { type: 'fraction', n: 1, d: 3 }).state;
    state = act(1, 0, state, { type: 'fraction', n: -1, d: 3 }).state;
  }
  assert.deepEqual(state, initial(1, 0));
  for (const [n, d] of [[1, 0], [1, 5], [2, 3], [0, 2], [0.5, 3], [NaN, 3], [1, Infinity], [Number.MAX_SAFE_INTEGER + 1, 2]]) rejection(1, { type: 'fraction', n, d });
  rejection(1, { type: 'fraction', n: 1, d: 6 }, 0, { n: 10, d: 1 });
});

test('equations preserve exact coefficients on division-first and fractional alternate paths', () => {
  const alternatePaths = [
    [{ type: 'bothDivide', value: 3 }, { type: 'bothAdd', value: -2 }],
    [{ type: 'bothDivide', value: 2 }, { type: 'bothAdd', value: 4 }],
    [{ type: 'bothDivide', value: -2 }, { type: 'bothAdd', value: 2 }]
  ];
  for (let t = 0; t < 3; t++) assert.equal(solved(2, t, execute(2, t, alternatePaths[t])), true);
  let state = act(2, 0, initial(2, 0), { type: 'bothDivide', value: 4 }).state;
  assert.deepEqual(state, { a: { n: 3, d: 4 }, b: { n: 3, d: 2 }, c: { n: 9, d: 2 } });
  state = act(2, 0, state, { type: 'bothAdd', value: { n: -3, d: 2 } }).state;
  state = act(2, 0, state, { type: 'bothDivide', value: 0.75 }).state;
  assert.equal(solved(2, 0, state), true);
  state = initial(2, 0);
  for (let i = 0; i < 100; i++) {
    state = act(2, 0, state, { type: 'bothAdd', value: 0.1 }).state;
    state = act(2, 0, state, { type: 'bothAdd', value: -0.1 }).state;
  }
  assert.deepEqual(state, initial(2, 0));
});

test('equations reject zero division, nonfinite values, oversized operands, and unsafe rationals', () => {
  for (const value of [0, -0, { n: 0, d: 3 }]) rejection(2, { type: 'bothDivide', value });
  for (const type of ['bothAdd', 'bothDivide']) {
    for (const value of [NaN, Infinity, -Infinity, '3', null, 1001, -1001, { n: 1, d: 0 }, { n: Infinity, d: 1 }, 1e-100]) rejection(2, { type, value });
  }
  assert.equal(act(2, 0, initial(2, 0), { type: 'bothAdd', value: 0 }).ok, true);
  assert.equal(solved(2, 0, { a: { n: 2, d: 1 }, b: { n: 0, d: 1 }, c: { n: 8, d: 1 } }), false, 'equivalent equation must still isolate x');
});

test('coordinates require the requested x as well as correct y and a placed point', () => {
  assert.equal(solved(3, 0, { x: -1, y: -1, placed: false }), false);
  const wrongX = act(3, 0, initial(3, 0), { type: 'point', x: 0, y: 1 });
  assert.equal(wrongX.ok, true);
  assert.equal(solved(3, 0, wrongX.state), false);
  const wrongY = act(3, 0, initial(3, 0), { type: 'point', x: -1, y: 1 });
  assert.equal(solved(3, 0, wrongY.state), false);
  for (const value of [NaN, Infinity, -Infinity, -11, 11, '1']) {
    rejection(3, { type: 'point', x: value, y: 1 });
    rejection(3, { type: 'point', x: 1, y: value });
  }
});

test('numeric controls enforce finite, bounded, aligned values and reset experiment evidence', () => {
  for (let l = 4; l < 8; l++) {
    const controls = levels[l].controls;
    for (const value of [NaN, Infinity, -Infinity, '1', null, controls.min - controls.step, controls.max + controls.step, controls.min + controls.step / 2]) rejection(l, { type: 'set', value });
    for (const value of [controls.min, controls.max]) assert.equal(act(l, 0, initial(l, 0), { type: 'set', value }).ok, true);
    let state = execute(l, 0, solution(l, 0));
    assert.equal(solved(l, 0, state), true);
    state = act(l, 0, state, { type: 'set', value: state.value }).state;
    assert.equal(state.ran, false);
    assert.equal(solved(l, 0, state), false);
    if (l === 7) assert.equal(state.closed, false);
  }
});

test('speed converts centimetres before checking m/s, and requires a run', () => {
  const configured = act(4, 2, initial(4, 2), { type: 'set', value: 0.5 }).state;
  assert.equal(solved(4, 2, configured), false);
  const result = act(4, 2, configured, { type: 'run' });
  assert.equal(solved(4, 2, result.state), true);
  assert.match(result.message, /1\.5 m/);
  assert.equal(solved(4, 0, execute(4, 0, [{ type: 'set', value: 5 }, { type: 'run' }])), false);
});

test('force accounts for existing rightward force and keeps an already moving box moving', () => {
  const state = execute(5, 2, solution(5, 2));
  assert.equal(state.value, 4);
  const result = act(5, 2, state, { type: 'run' });
  assert.equal(solved(5, 2, result.state), true);
  assert.match(result.message, /继续向右匀速/);
  assert.equal(solved(5, 2, execute(5, 2, [{ type: 'set', value: 6 }, { type: 'run' }])), false);
  assert.match(levels[5].concept, /不会自动停下/);
});

test('work is the specified same-direction force work, including half-metre distance', () => {
  const result = act(6, 2, { value: 1.5, ran: false }, { type: 'run' });
  assert.equal(solved(6, 2, result.state), true);
  assert.match(result.message, /指定推力/);
  assert.match(result.message, /12 J/);
  assert.match(levels[6].concept, /不是计算合力/);
});

test('series circuit requires a closed switch and correct total resistance', () => {
  const configured = act(7, 2, initial(7, 2), { type: 'set', value: 15 }).state;
  assert.equal(solved(7, 2, configured), false);
  const closed = act(7, 2, configured, { type: 'switch', closed: true }).state;
  assert.equal(solved(7, 2, closed), true);
  assert.deepEqual(closed, { value: 15, closed: true, ran: true });
  const opened = act(7, 2, closed, { type: 'switch', closed: false });
  assert.equal(solved(7, 2, opened.state), false);
  assert.equal(opened.state.ran, false);
  assert.match(opened.message, /0 A/);
  for (const value of [1, 'true', null, undefined]) rejection(7, { type: 'switch', closed: value });
  rejection(7, { type: 'run' });
  assert.equal(solved(7, 0, execute(7, 0, [{ type: 'set', value: 6 }, { type: 'switch', closed: true }])), false);
});

test('returned solutions and states do not share mutable task data', () => {
  const fraction = initial(1, 0);
  fraction.n = 999;
  assert.equal(initial(1, 0).n, 5);
  const equation = initial(2, 0);
  equation.a.n = 999;
  assert.equal(initial(2, 0).a.n, 3);
  const steps = solution(0, 0);
  steps[0].value = 1;
  assert.equal(solution(0, 0)[0].value, -3);
});
