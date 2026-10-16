/* Paper Zero: deterministic, immutable, exact-rational learning rules. */
(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.PaperSubjects = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function freezeDeep(value) {
    if (value && typeof value === 'object' && !Object.isFrozen(value)) {
      Object.keys(value).forEach(function (key) { freezeDeep(value[key]); });
      Object.freeze(value);
    }
    return value;
  }
  var levels = freezeDeep([
    { id: 'numberline', title: '有理数数轴', subtitle: '把纸片移到 0', concept: '正数向右，负数向左；相反数相加得 0。', unit: '', controls: { min: -20, max: 20 }, steps: [-3, -1, 1, 3], tasks: [
      { start: 4, target: 0, prompt: '从 +4 出发，每次移动 ±1 或 ±3，回到 0。' },
      { start: -5, target: 0, prompt: '从 −5 出发，每次移动 ±1 或 ±3，回到 0。' },
      { start: 7, target: 0, prompt: '从 +7 出发，每次移动 ±1 或 ±3，回到 0。' }
    ] },
    { id: 'rational', title: '分数运算', subtitle: '用分数凑出 0', concept: '分母不同先通分，计算后约分；分数值始终精确保存。', unit: '', controls: { min: -10, max: 10 }, steps: [{ n: 1, d: 2 }, { n: 1, d: 3 }, { n: 1, d: 4 }, { n: 1, d: 6 }], tasks: [
      { start: { n: 5, d: 6 }, target: { n: 0, d: 1 }, prompt: '从 5/6 出发，加减 1/2、1/3、1/4 或 1/6，得到 0。' },
      { start: { n: 3, d: 4 }, target: { n: 0, d: 1 }, prompt: '从 3/4 出发，加减 1/2、1/3、1/4 或 1/6，得到 0。' },
      { start: { n: -2, d: 3 }, target: { n: 0, d: 1 }, prompt: '从 −2/3 出发，加减 1/2、1/3、1/4 或 1/6，得到 0。' }
    ] },
    { id: 'equation', title: '一元一次方程', subtitle: '等式两边一起变', concept: '两边同加一个数，或同除以一个非零数，等式仍成立。目标是 x = 答案。', unit: '', controls: { min: -1000, max: 1000 }, tasks: [
      { a: 3, b: 6, c: 18, answer: 4, prompt: '3x + 6 = 18，把方程化成 x = 答案。' },
      { a: 2, b: -8, c: 6, answer: 7, prompt: '2x − 8 = 6，把方程化成 x = 答案。' },
      { a: -2, b: 4, c: 10, answer: -3, prompt: '−2x + 4 = 10，把方程化成 x = 答案。' }
    ] },
    { id: 'coordinates', title: '一次函数', subtitle: '找到函数上的点', concept: '把给定的 x 代入函数式，算出 y，再放置坐标点。', unit: '', controls: { min: -10, max: 10 }, tasks: [
      { m: 2, b: 1, slope: 2, intercept: 1, x: -1, y: -1, formula: 'y = 2x + 1', prompt: '在 y = 2x + 1 上，找出 x = −1 时的点。' },
      { m: -1, b: 2, slope: -1, intercept: 2, x: 3, y: -1, formula: 'y = −x + 2', prompt: '在 y = −x + 2 上，找出 x = 3 时的点。' },
      { m: 0.5, b: -1, slope: 0.5, intercept: -1, x: 4, y: 1, formula: 'y = x/2 − 1', prompt: '在 y = x/2 − 1 上，找出 x = 4 时的点。' }
    ] },
    { id: 'speed', title: '速度与单位', subtitle: '用路程和时间测速', concept: '平均速度 v = s ÷ t；先把路程换成米。', unit: 'm/s', controls: { min: 0, max: 10, step: 0.5 }, tasks: [
      { distance: 20, distanceUnit: 'm', distanceMeters: 20, time: 5, target: 4, prompt: '5 s 通过 20 m，设置平均速度后试跑。' },
      { distance: 18, distanceUnit: 'm', distanceMeters: 18, time: 3, target: 6, prompt: '3 s 通过 18 m，设置平均速度后试跑。' },
      { distance: 150, distanceUnit: 'cm', distanceMeters: 1.5, time: 3, target: 0.5, prompt: '3 s 通过 150 cm，先换算单位，再设置 m/s 速度。' }
    ] },
    { id: 'force', title: '二力平衡', subtitle: '让运动的小车保持匀速', concept: '小车初始向右运动。水平方向合力为 0 时，速度保持不变，不会自动停下。', unit: 'N', controls: { min: 0, max: 12, step: 1 }, tasks: [
      { left: 4, right: 0, existingRight: 0, target: 4, initialVelocity: 1, prompt: '左力 4 N，已有右力 0 N。补上右力，让向右运动的小车保持匀速。' },
      { left: 7, right: 0, existingRight: 0, target: 7, initialVelocity: 1, prompt: '左力 7 N，已有右力 0 N。补上右力，让小车保持匀速。' },
      { left: 6, right: 2, existingRight: 2, target: 4, initialVelocity: 1, prompt: '左力 6 N，已有右力 2 N。再加多少右力，合力才为 0？' }
    ] },
    { id: 'work', title: '力做的功', subtitle: '同向推力 × 位移', concept: '求指定推力所做的功：力与位移同向时 W = Fs。这里不是计算合力的功。', unit: 'm', controls: { min: 0, max: 8, step: 0.5 }, tasks: [
      { force: 4, work: 12, targetWork: 12, target: 3, direction: 'same', prompt: '指定推力 4 N，方向与位移相同。移动多远，这个力做功 12 J？' },
      { force: 6, work: 30, targetWork: 30, target: 5, direction: 'same', prompt: '指定推力 6 N，方向与位移相同。移动多远，这个力做功 30 J？' },
      { force: 8, work: 12, targetWork: 12, target: 1.5, direction: 'same', prompt: '指定推力 8 N，方向与位移相同。移动多远，这个力做功 12 J？' }
    ] },
    { id: 'circuit', title: '串联电路', subtitle: '调节电阻，闭合开关', concept: '串联总电阻 R = R₁ + R₂；闭合开关时 I = U/R。开路时电流为 0。', unit: 'Ω', controls: { min: 1, max: 20, step: 1 }, tasks: [
      { voltage: 6, r1: 2, current: 1, targetCurrent: 1, target: 4, prompt: '电源 6 V，R₁ = 2 Ω。调整 R₂ 并闭合开关，让电流达到 1 A。' },
      { voltage: 12, r1: 4, current: 2, targetCurrent: 2, target: 2, prompt: '电源 12 V，R₁ = 4 Ω。调整 R₂ 并闭合开关，让电流达到 2 A。' },
      { voltage: 9, r1: 3, current: 0.5, targetCurrent: 0.5, target: 15, prompt: '电源 9 V，R₁ = 3 Ω。调整 R₂ 并闭合开关，让电流达到 0.5 A。' }
    ] }
  ]);

  var MAX_SAFE = BigInt(Number.MAX_SAFE_INTEGER);
  function gcd(a, b) {
    a = a < 0n ? -a : a; b = b < 0n ? -b : b;
    while (b) { var next = a % b; a = b; b = next; }
    return a || 1n;
  }
  function rational(n, d) {
    if (d === 0n) throw new RangeError('分母不能为 0。');
    if (d < 0n) { n = -n; d = -d; }
    var divisor = gcd(n, d); n /= divisor; d /= divisor;
    if (n > MAX_SAFE || n < -MAX_SAFE || d > MAX_SAFE) throw new RangeError('数值过大，请换一种计算方法。');
    return { n: Number(n), d: Number(d) };
  }
  function asRational(value) {
    if (value && typeof value === 'object' && Number.isSafeInteger(value.n) && Number.isSafeInteger(value.d) && value.d !== 0) {
      return rational(BigInt(value.n), BigInt(value.d));
    }
    if (typeof value !== 'number' || !Number.isFinite(value)) throw new TypeError('请输入有限数值。');
    var text = String(value), parts = text.toLowerCase().split('e');
    var exponent = parts.length > 1 ? Number(parts[1]) : 0;
    var fractionDigits = (parts[0].split('.')[1] || '').length;
    var numerator = BigInt(parts[0].replace('.', ''));
    var power = exponent - fractionDigits;
    return power >= 0 ? rational(numerator * (10n ** BigInt(power)), 1n) : rational(numerator, 10n ** BigInt(-power));
  }
  function plus(a, b) { return rational(BigInt(a.n) * BigInt(b.d) + BigInt(b.n) * BigInt(a.d), BigInt(a.d) * BigInt(b.d)); }
  function divided(a, b) { return rational(BigInt(a.n) * BigInt(b.d), BigInt(a.d) * BigInt(b.n)); }
  function textFraction(a) { return a.d === 1 ? String(a.n) : a.n + '/' + a.d; }
  function equalFraction(a, b) { return BigInt(a.n) * BigInt(b.d) === BigInt(b.n) * BigInt(a.d); }
  function finite(value) { return typeof value === 'number' && Number.isFinite(value); }
  function same(a, b) { return finite(a) && finite(b) && Math.abs(a - b) <= 1e-9; }
  function selected(levelIndex, taskIndex) {
    if (!Number.isInteger(levelIndex) || levelIndex < 0 || levelIndex >= levels.length) throw new RangeError('Invalid levelIndex');
    var level = levels[levelIndex];
    if (!Number.isInteger(taskIndex) || taskIndex < 0 || taskIndex >= level.tasks.length) throw new RangeError('Invalid taskIndex');
    return { level: level, task: level.tasks[taskIndex] };
  }
  function initial(levelIndex, taskIndex) {
    var selection = selected(levelIndex, taskIndex), task = selection.task;
    switch (selection.level.id) {
      case 'numberline': return { value: task.start };
      case 'rational': return { n: task.start.n, d: task.start.d };
      case 'equation': return { a: asRational(task.a), b: asRational(task.b), c: asRational(task.c) };
      case 'coordinates': return { x: 0, y: 0, placed: false };
      case 'circuit': return { value: selection.level.controls.min, closed: false, ran: false };
      default: return { value: 0, ran: false };
    }
  }
  function within(value, limits) { return finite(value) && value >= limits.min && value <= limits.max; }
  function validControl(value, controls) {
    return within(value, controls) && (!controls.step || same((value - controls.min) / controls.step, Math.round((value - controls.min) / controls.step)));
  }
  function goodFraction(value) { return !!value && Number.isSafeInteger(value.n) && Number.isSafeInteger(value.d) && value.d > 0; }
  function validState(level, state) {
    if (!state || typeof state !== 'object') return false;
    switch (level.id) {
      case 'numberline': return Number.isInteger(state.value) && within(state.value, level.controls);
      case 'rational': return goodFraction(state) && within(state.n / state.d, level.controls);
      case 'equation': return goodFraction(state.a) && state.a.n !== 0 && goodFraction(state.b) && goodFraction(state.c);
      case 'coordinates': return within(state.x, level.controls) && within(state.y, level.controls) && typeof state.placed === 'boolean';
      case 'circuit': return validControl(state.value, level.controls) && typeof state.closed === 'boolean' && typeof state.ran === 'boolean';
      default: return validControl(state.value, level.controls) && typeof state.ran === 'boolean';
    }
  }
  function solved(levelIndex, taskIndex, state) {
    var selection = selected(levelIndex, taskIndex), level = selection.level, task = selection.task;
    if (!validState(level, state)) return false;
    switch (level.id) {
      case 'numberline': return state.value === 0;
      case 'rational': return state.n === 0;
      case 'equation': return equalFraction(state.a, { n: 1, d: 1 }) && state.b.n === 0 && equalFraction(state.c, asRational(task.answer));
      case 'coordinates': return state.placed && same(state.x, task.x) && same(state.y, task.y);
      case 'circuit': return state.closed && state.ran && same(task.voltage / (task.r1 + state.value), task.targetCurrent);
      case 'force': return state.ran && same(task.existingRight + state.value - task.left, 0);
      case 'work': return state.ran && same(task.force * state.value, task.targetWork);
      case 'speed': return state.ran && same(state.value * task.time, task.distanceMeters);
      default: return false;
    }
  }
  function act(levelIndex, taskIndex, state, action) {
    var selection = selected(levelIndex, taskIndex), level = selection.level, task = selection.task;
    function reject(message) { return { state: state, ok: false, message: message }; }
    function accept(next, message) { return { state: next, ok: true, message: message }; }
    if (!validState(level, state)) return reject('状态无效，请重新开始本题。');
    if (!action || typeof action !== 'object' || typeof action.type !== 'string') return reject('请选择一个有效操作。');
    try {
      if (level.id === 'numberline') {
        if (action.type !== 'step' || level.steps.indexOf(action.value) < 0) return reject('每次只能移动 +1、−1、+3 或 −3。');
        var nextValue = state.value + action.value;
        if (!within(nextValue, level.controls)) return reject('请留在 −20 到 20 的数轴范围内。');
        return accept({ value: nextValue }, nextValue === 0 ? '回到 0 了！正负移动相互抵消。' : '当前位置：' + nextValue);
      }
      if (level.id === 'rational') {
        if (action.type !== 'fraction' || !Number.isSafeInteger(action.n) || !Number.isSafeInteger(action.d) || action.d === 0) return reject('请选择有效的分数步长。');
        var step = asRational({ n: action.n, d: action.d });
        if (Math.abs(step.n) !== 1 || [2, 3, 4, 6].indexOf(step.d) < 0) return reject('每次只能加减 1/2、1/3、1/4 或 1/6。');
        var nextFraction = plus(state, step);
        if (!within(nextFraction.n / nextFraction.d, level.controls)) return reject('请把分数保持在 −10 到 10 之间。');
        return accept(nextFraction, nextFraction.n === 0 ? '恰好得到 0！' : '约分后的结果：' + textFraction(nextFraction));
      }
      if (level.id === 'equation') {
        if (action.type !== 'bothAdd' && action.type !== 'bothDivide') return reject('请对等式两边同时加数或除以非零数。');
        var operand = asRational(action.value);
        if (!within(operand.n / operand.d, level.controls)) return reject('操作数应在 −1000 到 1000 之间。');
        if (action.type === 'bothDivide' && operand.n === 0) return reject('不能除以 0；等式两边都一样。');
        var equation = action.type === 'bothAdd' ? {
          a: asRational(state.a), b: plus(state.b, operand), c: plus(state.c, operand)
        } : { a: divided(state.a, operand), b: divided(state.b, operand), c: divided(state.c, operand) };
        return accept(equation, solved(levelIndex, taskIndex, equation) ? '解得 x = ' + textFraction(equation.c) + '。' : '两边进行了相同的操作，等式仍成立。');
      }
      if (level.id === 'coordinates') {
        if (action.type !== 'point' || !within(action.x, level.controls) || !within(action.y, level.controls)) return reject('坐标必须是 −10 到 10 之间的有限数。');
        var point = { x: action.x, y: action.y, placed: true };
        return accept(point, solved(levelIndex, taskIndex, point) ? '坐标正确！代入 x 后得到了对应的 y。' : '再检查给定的 x，并把它代入函数式计算 y。');
      }
      if (action.type === 'set') {
        if (!validControl(action.value, level.controls)) return reject('数值需在 ' + level.controls.min + ' 到 ' + level.controls.max + ' 之间，步长为 ' + level.controls.step + ' ' + level.unit + '。');
        return accept(level.id === 'circuit' ? { value: action.value, closed: false, ran: false } : { value: action.value, ran: false }, level.id === 'circuit' ? '电阻已调整，请闭合开关验证电流。' : '数值已调整，请运行实验验证。');
      }
      if (level.id === 'circuit') {
        if (action.type !== 'switch' || typeof action.closed !== 'boolean') return reject('请明确选择闭合或断开开关。');
        var circuit = { value: state.value, closed: action.closed, ran: action.closed };
        return accept(circuit, action.closed ? '电流 I = ' + Number((task.voltage / (task.r1 + state.value)).toFixed(3)) + ' A。' : '开关断开，电流为 0 A。');
      }
      if (action.type !== 'run') return reject('请设置数值，或运行实验。');
      var trial = { value: state.value, ran: true };
      if (level.id === 'speed') return accept(trial, '按此速度，' + task.time + ' s 内通过 ' + Number((state.value * task.time).toFixed(6)) + ' m。');
      if (level.id === 'force') {
        var netForce = task.existingRight + state.value - task.left;
        return accept(trial, same(netForce, 0) ? '合力为 0，小车继续向右匀速运动。' : '合力为 ' + Math.abs(netForce) + ' N，方向向' + (netForce > 0 ? '右' : '左') + '；小车的速度会改变。');
      }
      return accept(trial, '指定推力所做的功 W = ' + task.force + ' × ' + state.value + ' = ' + Number((task.force * state.value).toFixed(6)) + ' J。');
    } catch (error) {
      return reject(error instanceof Error ? error.message : '该操作无法完成。');
    }
  }
  function solution(levelIndex, taskIndex) {
    var selection = selected(levelIndex, taskIndex), task = selection.task;
    switch (selection.level.id) {
      case 'numberline': return [[-3, -1], [3, 1, 1], [-3, -3, -1]][taskIndex].map(function (value) { return { type: 'step', value: value }; });
      case 'rational': return [[[-1, 2], [-1, 3]], [[-1, 2], [-1, 4]], [[1, 3], [1, 3]]][taskIndex].map(function (fraction) { return { type: 'fraction', n: fraction[0], d: fraction[1] }; });
      case 'equation': return [{ type: 'bothAdd', value: -task.b }, { type: 'bothDivide', value: task.a }];
      case 'coordinates': return [{ type: 'point', x: task.x, y: task.y }];
      case 'circuit': return [{ type: 'set', value: task.target }, { type: 'switch', closed: true }];
      default: return [{ type: 'set', value: task.target }, { type: 'run' }];
    }
  }
  return Object.freeze({ levels: levels, initial: initial, act: act, solved: solved, solution: solution });
});
