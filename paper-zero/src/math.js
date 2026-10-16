/** Pure arithmetic rules shared by the canvas game and tests. */
(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined') module.exports = api;
  root.PaperZeroMath = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const OPERATORS = {
    minus: { label: '−1', key: '1', cooldown: 0.12 },
    half: { label: '÷2', key: '2', cooldown: 0.36, charges: 7 },
    root: { label: '√', key: '3', cooldown: 0.58, charges: 5 },
    mod: { label: 'mod 3', key: '4', cooldown: 0.44, charges: 4 }
  };

  function isPerfectSquare(n) { return Number.isInteger(Math.sqrt(n)); }
  function operation(value, op) {
    if (!Number.isSafeInteger(value) || value < 0) return { ok:false, reason:'仅处理非负安全整数' };
    if (op === 'minus') return { ok:true, value: Math.max(0, value - 1) };
    if (op === 'half') return value % 2 === 0 ? { ok:true, value:value / 2 } : { ok:false, reason:'奇数不能整除' };
    if (op === 'root') return isPerfectSquare(value) ? { ok:true, value:Math.sqrt(value) } : { ok:false, reason:'不是完全平方数' };
    if (op === 'mod') return { ok:true, value:value % 3 };
    return { ok:false, reason:'未知运算' };
  }
  function apply(value, op, target) {
    if (target === 10 && op === 'mod') return { ok:false, reason:'目标 10 禁用模 3' };
    const result = operation(value, op);
    if (!result.ok) return result;
    if (target === 10 && result.value < 10) return { ok:false, reason:'会低于 10' };
    return result;
  }
  function operatorAvailable(value, op, target) { return apply(value, op, target).ok; }
  return { OPERATORS, operation, apply, operatorAvailable, isPerfectSquare };
});
