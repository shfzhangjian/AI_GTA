/* Deterministic boss rhythm: no Canvas or DOM dependency, easy to test. */
(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined') module.exports = api;
  root.PaperZeroBoss = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  function createBossState() {
    return { phase: 1, cooldown: 1.4, next: 'ink-ring', telegraph: null };
  }

  function resetPhase(state, phase) {
    state.phase = phase;
    state.cooldown = phase === 1 ? 1.3 : 0.85;
    state.telegraph = null;
    state.next = phase === 1 ? 'ink-ring' : 'ruler-dash';
    return { type: 'clear-threats' };
  }

  function tick(state, dt, paused) {
    if (paused || dt <= 0) return [];
    const events = [];
    if (state.telegraph) {
      state.telegraph.remaining -= dt;
      if (state.telegraph.remaining <= 0) {
        events.push({ type: 'fire', attack: state.telegraph.attack, phase: state.phase });
        state.telegraph = null;
        state.cooldown = state.phase === 1 ? 2.3 : 1.45;
      }
      return events;
    }
    state.cooldown -= dt;
    if (state.cooldown <= 0) {
      const attack = state.next;
      state.next = attack === 'ink-ring' ? 'ruler-dash' : 'ink-ring';
      state.telegraph = { attack, remaining: attack === 'ink-ring' ? 0.82 : 1.05 };
      events.push({ type: 'telegraph', attack, phase: state.phase, duration: state.telegraph.remaining });
    }
    return events;
  }
  return { createBossState, resetPhase, tick };
});
