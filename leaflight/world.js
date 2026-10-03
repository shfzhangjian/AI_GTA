(function (root) {
  'use strict';
  const N = 19;
  const projection = { cx: 480, oy: 96, halfW: 24, halfH: 12 };
  const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  function random(seed) {
    let s = seed >>> 0;
    return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  }
  function toScreen(x, y) { return { x: projection.cx + (x - y) * projection.halfW, y: projection.oy + (x + y) * projection.halfH }; }
  function toWorld(x, y) {
    const a = (x - projection.cx) / projection.halfW, b = (y - projection.oy) / projection.halfH;
    return { x: (a + b) / 2, y: (b - a) / 2 };
  }
  function passable(world, x, y, radius = 0.19) {
    for (const [dx, dy] of [[0, 0], [-radius, -radius], [radius, -radius], [-radius, radius], [radius, radius]]) {
      const tx = Math.floor(x + dx), ty = Math.floor(y + dy);
      if (tx < 0 || ty < 0 || tx >= N || ty >= N || world.blocked[ty * N + tx]) return false;
    }
    return true;
  }
  function path(world, from, to) {
    const sx = Math.floor(from.x), sy = Math.floor(from.y), ex = Math.floor(to.x), ey = Math.floor(to.y);
    if (ex < 0 || ey < 0 || ex >= N || ey >= N || !passable(world, ex + 0.5, ey + 0.5)) return null;
    const start = sy * N + sx, end = ey * N + ex;
    if (start < 0 || start >= N * N) return null;
    const queue = [start], previous = new Int16Array(N * N).fill(-1);
    previous[start] = start;
    for (let head = 0; head < queue.length; head++) {
      const id = queue[head];
      if (id === end) break;
      const x = id % N, y = Math.floor(id / N);
      for (const [nx, ny] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]) {
        const next = ny * N + nx;
        if (nx >= 0 && nx < N && ny >= 0 && ny < N && !world.blocked[next] && previous[next] === -1) {
          previous[next] = id; queue.push(next);
        }
      }
    }
    if (previous[end] === -1) return null;
    const steps = [];
    for (let id = end; id !== start; id = previous[id]) steps.push({ x: id % N + 0.5, y: Math.floor(id / N) + 0.5 });
    steps.reverse();
    if (!steps.length) steps.push({ x: ex + 0.5, y: ey + 0.5 });
    return steps;
  }
  function move(world, body, dx, dy) {
    let moved = false;
    if (passable(world, body.x + dx, body.y)) { body.x += dx; moved ||= Math.abs(dx) > 0; }
    if (passable(world, body.x, body.y + dy)) { body.y += dy; moved ||= Math.abs(dy) > 0; }
    return moved;
  }
  function build(seed = 20261003) {
    const rng = random(seed);
    const world = { blocked: new Uint8Array(N * N), trees: [], rocks: [], ground: [], stars: [], seed };
    const place = (x, y, type = 'tree') => {
      if (world.blocked[y * N + x]) return;
      world.blocked[y * N + x] = 1;
      (type === 'rock' ? world.rocks : world.trees).push({ x: x + 0.5, y: y + 0.5, kind: Math.floor(rng() * 3), size: 0.8 + rng() * 0.35, seed: rng() });
    };
    for (let i = 0; i < N; i++) { place(i, 0); place(i, N - 1); place(0, i); place(N - 1, i); }
    const groves = [[3, 3], [4, 3], [3, 4], [5, 6], [5, 7], [6, 6], [13, 3], [14, 3], [14, 4], [12, 8], [13, 8], [13, 9], [3, 12], [3, 13], [4, 13], [7, 14], [8, 14], [8, 15], [14, 13], [15, 13], [15, 14]];
    groves.forEach(([x, y]) => place(x, y));
    [[7, 4], [11, 5], [6, 10], [11, 13], [15, 7]].forEach(([x, y]) => place(x, y, 'rock'));
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      world.ground.push({ x, y, tone: Math.floor(rng() * 5), texture: Array.from({ length: 6 }, () => [rng(), rng(), rng()]), flower: rng() > 0.85 });
    }
    const positions = [[9, 12], [12, 11], [14, 16], [16, 9], [15, 4], [10, 2], [6, 3], [2, 7], [2, 15], [6, 16], [9, 6], [7, 9]];
    world.stars = positions.map(([x, y], i) => ({ x: x + 0.5, y: y + 0.5, collected: false, phase: i * 1.7 }));
    world.spawn = { x: 9.5, y: 10.5 };
    world.shrine = { x: 9.5, y: 8.5 };
    world.enemySpawns = [[5.5, 11.5], [13.5, 12.5], [10.5, 4.5], [4.5, 8.5]];
    return world;
  }
  const api = { N, distance, random, toScreen, toWorld, passable, path, move, build };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.ForestWorld = api;
})(typeof window !== 'undefined' ? window : globalThis);
