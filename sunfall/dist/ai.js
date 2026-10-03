/**
 * SUNFALL — honest, bounded single-player opponents.
 * Positions are feet positions. This module never changes health, awards kills,
 * teleports actors, or damages anything. onShoot must resolve a real raycast.
 * Collision / movement and all storm damage remain owned by the game.
 */
export function createBotBrain({ bots, world, random = Math.random, onShoot = () => {}, onEliminated } = {}) {
  if (!Array.isArray(bots) || !world || typeof world.move !== 'function' ||
      typeof world.isBlocked !== 'function' || typeof world.lineOfSight !== 'function') {
    throw new Error('createBotBrain needs bots and world { move, isBlocked, lineOfSight }');
  }
  // Kept in the public signature for integration symmetry. The game alone owns
  // eliminations, so this module deliberately never invokes onEliminated.
  void onEliminated;
  const GRID_MIN = -93, CELL = 3, SIZE = 63, COUNT = SIZE * SIZE;
  const BODY = 0.48, EYE = 1.35, SIGHT = 55, SIGHT2 = SIGHT * SIGHT;
  const occupancy = new Uint8Array(COUNT);
  const minds = new WeakMap();
  let now = 0;
  const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
  const distance2 = (a, b) => (a.x - b.x) ** 2 + (a.z - b.z) ** 2;
  const living = a => !!a && a.alive !== false && (a.hp === undefined || a.hp > 0);
  const rnd = (a = 0, b = 1) => a + clamp(random(), 0, 0.999999) * (b - a);
  const center = id => ({ x: GRID_MIN + (id % SIZE) * CELL, z: GRID_MIN + Math.floor(id / SIZE) * CELL });
  const cellId = (x, z) => clamp(Math.round((x - GRID_MIN) / CELL), 0, SIZE - 1) +
    clamp(Math.round((z - GRID_MIN) / CELL), 0, SIZE - 1) * SIZE;
  const freeAt = (x, z) => x > -94 && x < 94 && z > -94 && z < 94 && !world.isBlocked(x, z, BODY);
  function cellFree(id) {
    if (!occupancy[id]) {
      const p = center(id);
      occupancy[id] = freeAt(p.x, p.z) ? 1 : 2;
    }
    return occupancy[id] === 1;
  }
  function walkable(ax, az, bx, bz) {
    const steps = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / 0.65));
    for (let i = 1; i <= steps; i++) {
      const f = i / steps;
      if (!freeAt(ax + (bx - ax) * f, az + (bz - az) * f)) return false;
    }
    return true;
  }
  function nearestCell(x, z, fromX = x, fromZ = z, requireConnection = false) {
    const root = cellId(x, z), cx = root % SIZE, cz = Math.floor(root / SIZE);
    let best = -1, bestCost = Infinity;
    for (let ring = 0; ring <= 5; ring++) {
      for (let dz = -ring; dz <= ring; dz++) for (let dx = -ring; dx <= ring; dx++) {
        if (ring && Math.abs(dx) !== ring && Math.abs(dz) !== ring) continue;
        const xx = cx + dx, zz = cz + dz;
        if (xx < 0 || zz < 0 || xx >= SIZE || zz >= SIZE) continue;
        const id = xx + zz * SIZE;
        if (!cellFree(id)) continue;
        const p = center(id), cost = (p.x - x) ** 2 + (p.z - z) ** 2;
        if (cost >= bestCost || (requireConnection && !walkable(fromX, fromZ, p.x, p.z))) continue;
        best = id; bestCost = cost;
      }
      if (best !== -1) return best;
    }
    return -1;
  }
  class MinHeap {
    constructor() { this.a = []; }
    push(id, score) {
      const a = this.a; let i = a.length; a.push({ id, score });
      while (i) {
        const p = (i - 1) >> 1;
        if (a[p].score <= score) break;
        a[i] = a[p]; i = p;
      }
      a[i] = { id, score };
    }
    pop() {
      const a = this.a, first = a[0], last = a.pop();
      if (a.length) {
        let i = 0;
        while (true) {
          let child = i * 2 + 1;
          if (child >= a.length) break;
          if (child + 1 < a.length && a[child + 1].score < a[child].score) child++;
          if (a[child].score >= last.score) break;
          a[i] = a[child]; i = child;
        }
        a[i] = last;
      }
      return first;
    }
  }
  function findPath(bot, goal) {
    if (walkable(bot.x, bot.z, goal.x, goal.z)) return [{ ...goal }];
    const start = nearestCell(bot.x, bot.z, bot.x, bot.z, true);
    const end = nearestCell(goal.x, goal.z);
    if (start < 0 || end < 0) return [];
    const g = new Float32Array(COUNT); g.fill(Infinity); g[start] = 0;
    const parent = new Int32Array(COUNT); parent.fill(-1);
    const closed = new Uint8Array(COUNT), heap = new MinHeap();
    const ex = end % SIZE, ez = Math.floor(end / SIZE);
    const heuristic = id => Math.hypot(id % SIZE - ex, Math.floor(id / SIZE) - ez);
    heap.push(start, heuristic(start));
    let best = start, bestH = heuristic(start), expansions = 0;
    while (heap.a.length && expansions++ < 1800) {
      const { id } = heap.pop();
      if (closed[id]) continue;
      closed[id] = 1;
      const h = heuristic(id);
      if (h < bestH) { best = id; bestH = h; }
      if (id === end) { best = end; break; }
      const x = id % SIZE, z = Math.floor(id / SIZE), a = center(id);
      for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dz) continue;
        const nx = x + dx, nz = z + dz;
        if (nx < 0 || nz < 0 || nx >= SIZE || nz >= SIZE) continue;
        const next = nx + nz * SIZE;
        if (closed[next] || !cellFree(next)) continue;
        if (dx && dz && (!cellFree(x + dx + z * SIZE) || !cellFree(x + (z + dz) * SIZE))) continue;
        const b = center(next);
        if (!walkable(a.x, a.z, b.x, b.z)) continue;
        const tentative = g[id] + (dx && dz ? Math.SQRT2 : 1);
        if (tentative >= g[next]) continue;
        g[next] = tentative; parent[next] = id;
        heap.push(next, tentative + heuristic(next));
      }
    }
    if (best === start) return [];
    const path = []; let at = best;
    while (at !== -1) { path.push(center(at)); if (at === start) break; at = parent[at]; }
    path.reverse();
    if (best === end && walkable(path[path.length - 1].x, path[path.length - 1].z, goal.x, goal.z)) path.push({ ...goal });
    return path;
  }
  function weaponProfile(weapon) {
    const name = String(typeof weapon === 'string' ? weapon : weapon?.id || weapon?.type || weapon?.name || 'rifle').toLowerCase();
    if (/shot|scatter/.test(name)) return { magazine: 5, interval: 1.1, reload: 2.5, ideal: 11 };
    if (/smg|sub|burst/.test(name)) return { magazine: 20, interval: 0.29, reload: 2.2, ideal: 17 };
    if (/snip|marks|long/.test(name)) return { magazine: 4, interval: 1.7, reload: 2.8, ideal: 33 };
    return { magazine: 14, interval: 0.64, reload: 2.1, ideal: 24 };
  }
  function getMind(bot) {
    let m = minds.get(bot);
    if (m) return m;
    const profile = weaponProfile(bot.weapon);
    m = { target: null, lastKnown: null, lastSeen: -100, scanAt: now + rnd(0, 0.4),
      decideAt: 0, goal: null, path: [], pathAt: 0, nextShot: 0, reaction: rnd(0.8, 1.12),
      aim: 0, ammo: profile.magazine, reloadUntil: 0, reloadStart: 0,
      strafe: rnd() > 0.5 ? 1 : -1, strafeAt: now + rnd(0.8, 2.3),
      stalled: 0, patrolAt: 0, coverUntil: 0, coverGoal: null, profile };
    minds.set(bot, m);
    bot.state = 'patrol'; bot.aimTime = 0; bot.alert = 0;
    bot.reloading = false; bot.reloadProgress = 0; bot.aiAmmo = m.ammo;
    return m;
  }
  function canSee(bot, target) {
    return living(target) && distance2(bot, target) <= SIGHT2 && world.lineOfSight(
      bot.x, (bot.y || 0) + EYE, bot.z, target.x, (target.y || 0) + 1.1, target.z);
  }
  function scan(bot, m, player) {
    let chosen = canSee(bot, m.target) ? m.target : null;
    let cost = chosen ? distance2(bot, chosen) * 0.68 : Infinity;
    // Player and bots undergo the exact same detection checks and weighting.
    const inspect = other => {
      if (other === bot || !living(other)) return;
      const d = distance2(bot, other);
      if (d < cost && d <= SIGHT2 && canSee(bot, other)) { cost = d; chosen = other; }
    };
    inspect(player); for (const other of bots) inspect(other);
    if (chosen && chosen !== m.target) {
      m.target = chosen; m.aim = 0; m.nextShot = Math.max(m.nextShot, now + m.reaction);
      m.coverGoal = null;
    } else if (!chosen && (!living(m.target) || now - m.lastSeen > 4.5)) {
      m.target = null; m.aim = 0;
    }
  }
  function pickFreeGoal(bot, zone, local = false) {
    const radius = Math.max(1.5, Math.min(zone.radius - 3, 75));
    for (let i = 0; i < 20; i++) {
      const angle = rnd(0, Math.PI * 2), r = Math.sqrt(rnd()) * (local ? Math.min(radius, 20) : radius);
      const x = clamp((local ? bot.x : zone.x) + Math.cos(angle) * r, -91, 91);
      const z = clamp((local ? bot.z : zone.z) + Math.sin(angle) * r, -91, 91);
      if (Math.hypot(x - zone.x, z - zone.z) < Math.max(2, zone.radius - 2) && freeAt(x, z)) return { x, z };
    }
    const id = nearestCell(zone.x, zone.z);
    return id < 0 ? { x: bot.x, z: bot.z } : center(id);
  }
  function moveVector(bot, m, dx, dz) {
    const ox = bot.x, oz = bot.z;
    world.move(bot, dx, dz);
    if (Math.hypot(bot.x - ox, bot.z - oz) < Math.hypot(dx, dz) * 0.12) {
      // The authoritative collision mover resolves walls; try sliding first.
      if (Math.abs(dx) > 0.001) world.move(bot, dx, 0);
      if (Math.abs(dz) > 0.001) world.move(bot, 0, dz);
    }
    const moved = Math.hypot(bot.x - ox, bot.z - oz);
    if (moved < 0.005) m.stalled += 1; else m.stalled = 0;
    return moved;
  }
  function navigate(bot, m, goal, dt, speed, faceMovement = true) {
    if (!goal || distance2(bot, goal) < 1.1) return;
    bot.targetX = goal.x; bot.targetZ = goal.z;
    if (!m.goal || distance2(m.goal, goal) > 9 || now > m.pathAt || m.stalled > 12) {
      m.goal = { ...goal }; m.path = findPath(bot, goal); m.pathAt = now + rnd(1.1, 1.8);
      m.stalled = 0;
    }
    while (m.path.length && distance2(bot, m.path[0]) < 1.4) m.path.shift();
    if (!m.path.length) return;
    // Never smooth across a wall, even if the source cell itself is free.
    for (let i = Math.min(m.path.length - 1, 5); i > 0; i--) {
      if (walkable(bot.x, bot.z, m.path[i].x, m.path[i].z)) { m.path.splice(0, i); break; }
    }
    const point = m.path[0], dx = point.x - bot.x, dz = point.z - bot.z, d = Math.hypot(dx, dz);
    if (d < 0.01) return;
    const step = Math.min(d, speed * dt);
    moveVector(bot, m, dx / d * step, dz / d * step);
    if (faceMovement) bot.yaw = Math.atan2(dx, dz);
  }
  function findCover(bot, target) {
    let best = null, bestScore = Infinity;
    const away = Math.atan2(bot.z - target.z, bot.x - target.x);
    for (let i = 0; i < 12; i++) {
      const angle = away + (i % 2 ? 1 : -1) * Math.floor(i / 2) * 0.42;
      const radius = 4 + (i % 3) * 2;
      const p = { x: bot.x + Math.cos(angle) * radius, z: bot.z + Math.sin(angle) * radius };
      if (!freeAt(p.x, p.z) || !walkable(bot.x, bot.z, p.x, p.z)) continue;
      if (world.lineOfSight(target.x, (target.y || 0) + EYE, target.z, p.x, (bot.y || 0) + 1.1, p.z)) continue;
      const score = distance2(bot, p);
      if (score < bestScore) { best = p; bestScore = score; }
    }
    return best;
  }
  function update(rawDt, elapsed, player, rawZone) {
    const dt = clamp(Number(rawDt) || 0, 0, 0.1);
    if (!dt) return;
    now = Number.isFinite(elapsed) ? elapsed : now + dt;
    const zone = { x: Number(rawZone?.x) || 0, z: Number(rawZone?.z) || 0,
      radius: Math.max(1, Number(rawZone?.radius) || 100) };
    for (const bot of bots) {
      if (!living(bot)) { bot.state = 'eliminated'; bot.aimTime = 0; bot.alert = 0; continue; }
      const m = getMind(bot);
      if (now >= m.scanAt) { scan(bot, m, player); m.scanAt = now + rnd(0.2, 0.32); }
      const visible = !!m.target && canSee(bot, m.target);
      if (visible) {
        m.lastSeen = now; m.lastKnown = { x: m.target.x, z: m.target.z };
        m.aim += dt; bot.yaw = Math.atan2(m.target.x - bot.x, m.target.z - bot.z);
      } else m.aim = 0;
      bot.aimTime = m.aim; bot.alert = visible ? clamp(m.aim / m.reaction, 0.15, 1) : 0;
      bot.targetId = m.target?.id ?? null;
      bot.aimPitch = visible ? Math.atan2((m.target.y || 0) - (bot.y || 0) - .18, Math.max(1, Math.sqrt(distance2(bot, m.target)))) : 0;
      if (m.reloadUntil && now >= m.reloadUntil) {
        m.ammo = m.profile.magazine; m.reloadUntil = 0; m.coverGoal = null;
      }
      if (!m.reloadUntil && m.ammo <= 0) {
        m.reloadStart = now; m.reloadUntil = now + m.profile.reload;
        if (visible) m.coverGoal = findCover(bot, m.target);
      }
      bot.reloading = m.reloadUntil > now;
      bot.reloadProgress = bot.reloading ? clamp((now - m.reloadStart) / m.profile.reload, 0, 1) : 0;
      bot.aiAmmo = m.ammo;
      const zoneDistance = Math.hypot(bot.x - zone.x, bot.z - zone.z);
      const unsafe = zoneDistance > Math.max(1, zone.radius - 5);
      if (unsafe) {
        bot.state = 'seek-safe-zone';
        if (!m.safeGoal || now > m.safeAt || Math.hypot(m.safeGoal.x - zone.x, m.safeGoal.z - zone.z) > zone.radius - 3) {
          // Stable inward routes beat repeatedly aiming at an obstructed center.
          const inner = { ...zone, radius: Math.max(3, zone.radius * 0.68) };
          m.safeGoal = pickFreeGoal(bot, inner); m.safeAt = now + 3;
        }
        navigate(bot, m, m.safeGoal, dt, 5.8, !visible);
      } else if (bot.reloading) {
        bot.state = 'reload';
        if (m.coverGoal) navigate(bot, m, m.coverGoal, dt, 4.8, !visible);
      } else if (visible) {
        const target = m.target, d = Math.sqrt(distance2(bot, target));
        bot.state = 'engage';
        if ((bot.hp || 100) < 35 && now > m.coverUntil) {
          m.coverGoal = findCover(bot, target); m.coverUntil = now + rnd(4, 6);
          m.coverMoveUntil = now + 1.4;
        }
        if (m.coverGoal && now < m.coverMoveUntil) {
          bot.state = 'cover'; navigate(bot, m, m.coverGoal, dt, 4.7, false);
        } else if (d > m.profile.ideal + 6) {
          navigate(bot, m, m.lastKnown, dt, 4.1, false);
        } else {
          if (now > m.strafeAt) { m.strafe *= -1; m.strafeAt = now + rnd(0.8, 2); }
          const dx = (target.x - bot.x) / Math.max(0.01, d), dz = (target.z - bot.z) / Math.max(0.01, d);
          const retreat = d < m.profile.ideal * 0.55 ? -0.75 : 0;
          const vx = -dz * m.strafe + dx * retreat, vz = dx * m.strafe + dz * retreat;
          const n = Math.hypot(vx, vz);
          // Brief reposition, then a planted aiming beat so gait and muzzle agree.
          if ((now + bot.id * .17) % 1.6 < .55) moveVector(bot, m, vx / n * 2.25 * dt, vz / n * 2.25 * dt);
          if (m.stalled > 5) { m.strafe *= -1; m.stalled = 0; }
        }
      } else if (m.target && m.lastKnown && now - m.lastSeen < 4.5) {
        bot.state = 'search'; navigate(bot, m, m.lastKnown, dt, 4.15);
      } else {
        bot.state = 'patrol';
        if (!m.patrolGoal || now > m.patrolAt || distance2(bot, m.patrolGoal) < 4) {
          m.patrolGoal = pickFreeGoal(bot, zone); m.patrolAt = now + rnd(7, 11);
        }
        navigate(bot, m, m.patrolGoal, dt, 3.9);
      }
      // A final LOS check after movement prevents wall shots during strafes.
      if (!bot.reloading && visible && m.aim >= m.reaction && now >= m.nextShot && canSee(bot, m.target)) {
        const target = m.target;
        const dx = target.x - bot.x, dy = (target.y || 0) + 1.1 - ((bot.y || 0) + EYE), dz = target.z - bot.z;
        const d = Math.max(0.01, Math.hypot(dx, dy, dz));
        m.nextShot = now + m.profile.interval * rnd(0.92, 1.18);
        m.ammo--; bot.aiAmmo = m.ammo;
        bot.aiAccuracy = clamp(0.64 - d * 0.006, 0.24, 0.6);
        onShoot(bot, target, { x: dx / d, y: dy / d, z: dz / d, distance: d, aimTime: m.aim, accuracy: bot.aiAccuracy });
      }
    }
  }
  function reset() {
    now = 0; occupancy.fill(0);
    for (const bot of bots) {
      minds.delete(bot); bot.state = living(bot) ? 'patrol' : 'eliminated';
      bot.aimTime = 0; bot.alert = 0; bot.reloading = false; bot.reloadProgress = 0; bot.targetId = null;
    }
  }
  return { update, reset };
}
