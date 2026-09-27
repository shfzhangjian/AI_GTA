/**
 * RouteManager.js — 港口间航线（§19 / §16）
 *
 * 航线必须走球面水路，且抬升在海面之上，绝不穿过地球内部/大片陆地。
 * 数学全部走 GeoUtils（唯一来源）。
 */
import * as THREE from 'three';
import { PLANET, CAMERA } from '../config.js';
import {
  latLonToVector3, createGreatCirclePoints, greatCircleDistance, greatCircleTangent,
  slerpOnSphere,
} from '../utils/GeoUtils.js';

/** 航线相对海面的抬升（世界单位）：让线浮在海面上可见 */
export const ROUTE_LIFT = 0.55;
// CPU 高度场里真正海面是 Land.js 的 SEA_LEVEL=-0.04。
// 这里必须略高于 -0.04，不能写成 -0.28/-0.45，否则等于判定“没有海”。
const WATER_HEIGHT_MAX = 0.02;
const WATER_FALLBACK_HEIGHT_MAX = 0.08;
const WATER_PROBE_HEIGHT_MAX = 0.12;
const SHIP_CLEARANCE_DEG = 2.4;
const SAMPLE_CLEARANCE_DEG = 1.2;
const ROUTE_GRID_STEP = 4;
const ROUTE_LAT_MIN = -72;
const ROUTE_LAT_MAX = 72;
const ROUTE_MAX_SEARCH_DEG = 44;
const ROUTE_MIN_COUNT = 5;
const ROUTE_MID_MIN_GAP = PLANET.RADIUS * 0.58;
const ROUTE_TARGET_MIN_GAP = PLANET.RADIUS * 0.42;

const ROUTE_PROFILES = [
  { maxH: WATER_HEIGHT_MAX, clearanceDeg: SHIP_CLEARANCE_DEG },
  { maxH: WATER_FALLBACK_HEIGHT_MAX, clearanceDeg: SAMPLE_CLEARANCE_DEG },
  { maxH: WATER_FALLBACK_HEIGHT_MAX, clearanceDeg: 0 },
];

function normLon(lon) {
  return ((lon + 180) % 360 + 360) % 360 - 180;
}

function nodeKey(lat, lon) {
  return Math.round(lat) + ',' + Math.round(normLon(lon));
}

export class RouteManager {
  /**
   * @param {{sceneManager, sampler?, group?}} deps
   */
  constructor(deps) {
    this.sm = deps.sceneManager;
    this.sampler = deps.sampler || null;
    this.group = deps.group || this.sm.routes;
    this.group.name = 'Routes';
    /** @type {Array<object>} */
    this.lines = [];
    this.visible = true;
  }

  /**
   * 为若干港口建立环航航线（A→B→C→…→A）。
   * @param {Array<{id,name,lat,lon,position?}>} ports
   * @param {Array<[number,number]>|null} pairs 指定港口索引对；缺省 = 顺环
   */
  build(ports, pairs = null) {
    this.clear();
    if (!ports || ports.length < 2) return this;

    const seq = this._routePairs(ports, pairs);
    for (const [ai, bi] of seq) {
      const a = ports[ai], b = ports[bi];
      if (!a || !b) continue;
      this._makeLine(a, b);
    }
    this.setVisible(this.visible);
    return this;
  }

  _routePairs(ports, pairs) {
    const n = ports.length;
    if (pairs) return this._ensureMinRoutePairs(ports, [...pairs]);

    const seq = this._balancedPathPairs(ports);
    return this._ensureMinRoutePairs(ports, seq);
  }

  _balancedPathPairs(ports) {
    const n = ports.length;
    if (n < 2) return [];
    const routeGoal = Math.min(Math.max(1, n - 1), Math.max(ROUTE_MIN_COUNT, Math.ceil(n * 0.8)));
    let best = null;
    for (const order of permutations([...Array(n).keys()])) {
      const pairs = [];
      for (let i = 0; i < order.length - 1 && pairs.length < routeGoal; i++) pairs.push([order[i], order[i + 1]]);
      const score = this._routePairScore(ports, pairs);
      if (!best || score < best.score) best = { pairs, score };
    }
    return best ? best.pairs : [];
  }

  _ensureMinRoutePairs(ports, seq) {
    const n = ports.length;
    const seen = new Set(seq.map(([a, b]) => a + '>' + b));
    const candidates = [];
    for (let a = 0; a < n; a++) {
      for (let b = 0; b < n; b++) {
        if (a === b) continue;
        const key = a + '>' + b;
        if (seen.has(key)) continue;
        const pair = [a, b];
        candidates.push({
          pair,
          score: this._routePairScore(ports, [...seq, pair]),
        });
      }
    }
    candidates.sort((a, b) => a.score - b.score);
    for (const c of candidates) {
      if (seq.length >= ROUTE_MIN_COUNT) break;
      seq.push(c.pair);
      seen.add(c.pair[0] + '>' + c.pair[1]);
    }
    return seq;
  }

  _routePairScore(ports, pairs) {
    let length = 0;
    let crossings = 0;
    let repeatedTargets = 0;
    let routeClustering = 0;
    let targetClustering = 0;
    const targets = new Set();
    const mids = [];
    const targetPositions = [];
    for (const [a, b] of pairs) {
      const start = this._posOf(ports[a]);
      const end = this._posOf(ports[b]);
      length += greatCircleDistance(start, end, PLANET.RADIUS);
      if (targets.has(b)) repeatedTargets++;
      targets.add(b);
      const mid = new THREE.Vector3();
      slerpOnSphere(start, end, 0.5, PLANET.RADIUS, mid);
      mids.push(mid);
      targetPositions.push(end);
    }
    for (let i = 0; i < pairs.length; i++) {
      for (let j = i + 1; j < pairs.length; j++) {
        if (sharesEndpoint(pairs[i], pairs[j])) continue;
        if (this._routesCross(ports, pairs[i], pairs[j])) crossings++;
      }
    }
    for (let i = 0; i < mids.length; i++) {
      for (let j = i + 1; j < mids.length; j++) {
        const midGap = greatCircleDistance(mids[i], mids[j], PLANET.RADIUS);
        routeClustering += Math.max(0, ROUTE_MID_MIN_GAP - midGap);
        const targetGap = greatCircleDistance(targetPositions[i], targetPositions[j], PLANET.RADIUS);
        targetClustering += Math.max(0, ROUTE_TARGET_MIN_GAP - targetGap);
      }
    }
    return crossings * 20000
      + repeatedTargets * 7000
      + routeClustering * 90
      + targetClustering * 70
      + length;
  }

  _routesCross(ports, a, b) {
    const A = this._posOf(ports[a[0]]).normalize();
    const B = this._posOf(ports[a[1]]).normalize();
    const C = this._posOf(ports[b[0]]).normalize();
    const D = this._posOf(ports[b[1]]).normalize();
    const n1 = new THREE.Vector3().crossVectors(A, B);
    const n2 = new THREE.Vector3().crossVectors(C, D);
    if (n1.lengthSq() < 1e-9 || n2.lengthSq() < 1e-9) return false;
    const p = new THREE.Vector3().crossVectors(n1.normalize(), n2.normalize());
    if (p.lengthSq() < 1e-9) return false;
    p.normalize();
    const q = p.clone().negate();
    return (this._pointOnArc(A, B, p) && this._pointOnArc(C, D, p))
      || (this._pointOnArc(A, B, q) && this._pointOnArc(C, D, q));
  }

  _pointOnArc(a, b, p) {
    const ab = greatCircleDistance(a, b, 1);
    const ap = greatCircleDistance(a, p, 1);
    const pb = greatCircleDistance(p, b, 1);
    return Math.abs((ap + pb) - ab) < 1e-4;
  }

  _portDistance(a, b) {
    return greatCircleDistance(this._posOf(a), this._posOf(b), PLANET.RADIUS);
  }

  _posOf(p) {
    if (p.position) return p.position.clone();
    return latLonToVector3(p.lat, p.lon, PLANET.RADIUS, new THREE.Vector3());
  }

  _makeLine(a, b) {
    const A = this._posOf(a), B = this._posOf(b);
    const path = this._buildWaterPath(a, b);
    const pts = this._smoothPath(path, ROUTE_LIFT);
    const segmentLengths = [];
    let len = 0;
    for (let i = 0; i < path.length - 1; i++) {
      const d = greatCircleDistance(path[i], path[i + 1], PLANET.RADIUS);
      segmentLengths.push(d);
      len += d;
    }

    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const mat = new THREE.LineBasicMaterial({
      color: 0x9fe8ff,
      transparent: true,
      opacity: 0.42,
      depthWrite: false,
    });
    mat.name = 'route-line';
    const line = new THREE.Line(geo, mat);
    line.name = 'Route:' + a.id + '→' + b.id;
    line.renderOrder = 1;
    line.frustumCulled = false;
    this.group.add(line);

    this.lines.push({
      line, from: a, to: b, A, B,
      path,
      segmentLengths,
      length: len,
      segmentCount: Math.max(0, pts.length - 1),
    });
    return line;
  }

  _buildWaterPath(a, b) {
    if (!this.sampler) return [this._posOf(a), this._posOf(b)];

    const start = this._nearestWater(a.lat, a.lon)
      || this._nearestWater(a.lat, a.lon, WATER_FALLBACK_HEIGHT_MAX, 56, SAMPLE_CLEARANCE_DEG)
      || this._nearestWater(a.lat, a.lon, WATER_FALLBACK_HEIGHT_MAX, 72, 0);
    const goal = this._nearestWater(b.lat, b.lon)
      || this._nearestWater(b.lat, b.lon, WATER_FALLBACK_HEIGHT_MAX, 56, SAMPLE_CLEARANCE_DEG)
      || this._nearestWater(b.lat, b.lon, WATER_FALLBACK_HEIGHT_MAX, 72, 0);
    if (!start || !goal) return [this._posOf(a), this._posOf(b)];

    for (const profile of ROUTE_PROFILES) {
      const nodes = this._findWaterNodes(start, goal, profile);
      if (nodes && nodes.length >= 2) {
        return nodes.map((p) => latLonToVector3(p.lat, p.lon, PLANET.RADIUS, new THREE.Vector3()));
      }
      if (this._waterSegmentClear(start, goal, profile)) {
        return [
          latLonToVector3(start.lat, start.lon, PLANET.RADIUS, new THREE.Vector3()),
          latLonToVector3(goal.lat, goal.lon, PLANET.RADIUS, new THREE.Vector3()),
        ];
      }
    }

    return this._buildFallbackWaterPath(start, goal)
      .map((p) => latLonToVector3(p.lat, p.lon, PLANET.RADIUS, new THREE.Vector3()));
  }

  _nearestWater(lat, lon, maxH = WATER_HEIGHT_MAX, maxSearchDeg = ROUTE_MAX_SEARCH_DEG, clearanceDeg = SHIP_CLEARANCE_DEG) {
    if (this._isWater(lat, lon, maxH, clearanceDeg)) return { lat, lon: normLon(lon) };
    let best = null;
    for (let r = 1.5; r <= maxSearchDeg; r += 1.5) {
      const steps = Math.max(12, Math.ceil((Math.PI * 2 * r) / 1.5));
      for (let i = 0; i < steps; i++) {
        const a = (i / steps) * Math.PI * 2;
        const la = THREE.MathUtils.clamp(lat + Math.sin(a) * r, ROUTE_LAT_MIN, ROUTE_LAT_MAX);
        const lo = normLon(lon + (Math.cos(a) * r) / Math.max(0.25, Math.cos(THREE.MathUtils.degToRad(la))));
        if (!this._isWater(la, lo, maxH, clearanceDeg)) continue;
        const h = this.sampler.heightAt(la, lo);
        const score = r + Math.max(0, h + 1.2) * 24 + this._coastPenalty({ lat: la, lon: lo });
        if (!best || score < best.score) best = { lat: la, lon: lo, score };
      }
      if (best) return best;
    }
    return null;
  }

  _findWaterNodes(start, goal, profile = ROUTE_PROFILES[0]) {
    const snap = (p) => ({
      lat: THREE.MathUtils.clamp(Math.round(p.lat / ROUTE_GRID_STEP) * ROUTE_GRID_STEP, ROUTE_LAT_MIN, ROUTE_LAT_MAX),
      lon: normLon(Math.round(p.lon / ROUTE_GRID_STEP) * ROUTE_GRID_STEP),
    });
    const s = this._nearestWater(snap(start).lat, snap(start).lon, profile.maxH, ROUTE_MAX_SEARCH_DEG, profile.clearanceDeg) || start;
    const g = this._nearestWater(snap(goal).lat, snap(goal).lon, profile.maxH, ROUTE_MAX_SEARCH_DEG, profile.clearanceDeg) || goal;
    const startKey = nodeKey(s.lat, s.lon);
    const goalKey = nodeKey(g.lat, g.lon);

    const open = new Set([startKey]);
    const came = new Map();
    const gScore = new Map([[startKey, 0]]);
    const nodes = new Map([[startKey, s], [goalKey, g]]);
    let guard = 0;

    while (open.size && guard++ < 9000) {
      let currentKey = null;
      let currentScore = Infinity;
      for (const key of open) {
        const p = nodes.get(key);
        const score = (gScore.get(key) || 0) + this._nodeHeuristic(p, g);
        if (score < currentScore) {
          currentScore = score;
          currentKey = key;
        }
      }

      if (currentKey === goalKey) {
        const path = [];
        let k = currentKey;
        while (k) {
          path.push(nodes.get(k));
          k = came.get(k);
        }
        path.reverse();
        path[0] = start;
        path[path.length - 1] = goal;
        return this._relaxPath(path, profile);
      }

      open.delete(currentKey);
      const current = nodes.get(currentKey);
      for (const next of this._neighbors(current, g, profile)) {
        const k = nodeKey(next.lat, next.lon);
        if (!nodes.has(k)) nodes.set(k, next);
        const tentative = (gScore.get(currentKey) || 0) + this._nodeDistance(current, next) + this._coastPenalty(next);
        if (tentative >= (gScore.get(k) ?? Infinity)) continue;
        came.set(k, currentKey);
        gScore.set(k, tentative);
        open.add(k);
      }
    }
    return null;
  }

  _neighbors(p, goal, profile = ROUTE_PROFILES[0]) {
    const out = [];
    const dirs = [
      [-1, 0], [1, 0], [0, -1], [0, 1],
      [-1, -1], [-1, 1], [1, -1], [1, 1],
    ];
    for (const [da, dl] of dirs) {
      const lat = THREE.MathUtils.clamp(p.lat + da * ROUTE_GRID_STEP, ROUTE_LAT_MIN, ROUTE_LAT_MAX);
      const lon = normLon(p.lon + dl * ROUTE_GRID_STEP);
      if (Math.abs(lat - p.lat) < 1e-6 && dl === 0) continue;
      if (!this._isWater(lat, lon, profile.maxH, profile.clearanceDeg)) continue;
      out.push({ lat, lon });
    }

    // 终点附近允许直接收束，避免最后一段被网格锯齿拉长。
    if (this._nodeDistance(p, goal) < PLANET.RADIUS * THREE.MathUtils.degToRad(ROUTE_GRID_STEP * 1.8) && this._waterSegmentClear(p, goal, profile)) {
      out.push(goal);
    }
    return out;
  }

  _relaxPath(path, profile = ROUTE_PROFILES[0]) {
    if (path.length <= 2) return path;
    const out = [path[0]];
    let anchor = 0;
    for (let i = 2; i < path.length; i++) {
      if (!this._waterSegmentClear(path[anchor], path[i], profile)) {
        out.push(path[i - 1]);
        anchor = i - 1;
      }
    }
    out.push(path[path.length - 1]);
    return out;
  }

  _buildFallbackWaterPath(start, goal) {
    const candidates = [];
    const avgLat = THREE.MathUtils.clamp((start.lat + goal.lat) * 0.5, ROUTE_LAT_MIN, ROUTE_LAT_MAX);
    const lanes = [avgLat, 0, 42, -42, 64, -64]
      .filter((lat, i, arr) => arr.findIndex((v) => Math.abs(v - lat) < 1) === i);

    for (const laneLat of lanes) {
      const a = this._nearestWater(laneLat, start.lon, WATER_FALLBACK_HEIGHT_MAX, 36, 0);
      const b = this._nearestWater(laneLat, goal.lon, WATER_FALLBACK_HEIGHT_MAX, 36, 0);
      if (a && b) candidates.push([start, a, b, goal]);

      const midLon = normLon(start.lon + this._shortLonDelta(start.lon, goal.lon) * 0.5);
      const m = this._nearestWater(laneLat, midLon, WATER_FALLBACK_HEIGHT_MAX, 36, 0);
      if (m) candidates.push([start, m, goal]);
    }

    let best = null;
    const profile = ROUTE_PROFILES[2];
    for (const raw of candidates) {
      const path = this._dedupePath(raw);
      if (path.length < 2 || !this._pathClear(path, profile)) continue;
      const len = this._pathDistance(path);
      if (!best || len < best.len) best = { path, len };
    }
    if (best) return this._relaxPath(best.path, profile);

    const sampled = this._sampleProjectedWaterPath(start, goal);
    return this._dedupePath(sampled.length >= 2 ? sampled : [start, goal]);
  }

  _sampleProjectedWaterPath(start, goal) {
    const va = latLonToVector3(start.lat, start.lon, PLANET.RADIUS, new THREE.Vector3());
    const vb = latLonToVector3(goal.lat, goal.lon, PLANET.RADIUS, new THREE.Vector3());
    const out = [start];
    const p = new THREE.Vector3();
    for (let i = 1; i < 32; i++) {
      slerpOnSphere(va, vb, i / 32, 1, p);
      const lat = THREE.MathUtils.radToDeg(Math.asin(THREE.MathUtils.clamp(p.y, -1, 1)));
      const lon = normLon(Math.atan2(p.z, -p.x) * 180 / Math.PI - 180);
      const near = this._nearestWater(lat, lon, WATER_FALLBACK_HEIGHT_MAX, 24, 0);
      if (near) out.push(near);
    }
    out.push(goal);
    return out;
  }

  _pathClear(path, profile = ROUTE_PROFILES[0]) {
    for (let i = 0; i < path.length - 1; i++) {
      if (!this._waterSegmentClear(path[i], path[i + 1], profile)) return false;
    }
    return true;
  }

  _pathDistance(path) {
    let len = 0;
    for (let i = 0; i < path.length - 1; i++) len += this._nodeDistance(path[i], path[i + 1]);
    return len;
  }

  _dedupePath(path) {
    const out = [];
    for (const p of path) {
      if (!p) continue;
      const last = out[out.length - 1];
      if (last && this._nodeDistance(last, p) < 0.75) continue;
      out.push({ lat: p.lat, lon: normLon(p.lon) });
    }
    return out;
  }

  _shortLonDelta(a, b) {
    return normLon(b - a);
  }

  _smoothPath(path, lift) {
    const pts = [];
    for (let i = 0; i < path.length - 1; i++) {
      const a = path[i], b = path[i + 1];
      const len = greatCircleDistance(a, b, PLANET.RADIUS);
      const segs = Math.max(4, Math.min(48, Math.round(len * 0.28)));
      const chunk = createGreatCirclePoints(a, b, PLANET.RADIUS, segs, lift);
      if (i > 0) chunk.shift();
      pts.push(...chunk);
    }
    return pts;
  }

  _isWater(lat, lon, maxH = WATER_HEIGHT_MAX, clearanceDeg = SHIP_CLEARANCE_DEG) {
    if (!this.sampler) return true;
    if (this.sampler.heightAt(lat, lon) > maxH) return false;
    if (clearanceDeg <= 0) return true;
    const probes = [
      [clearanceDeg, 0], [-clearanceDeg, 0], [0, clearanceDeg], [0, -clearanceDeg],
      [clearanceDeg * 0.7, clearanceDeg * 0.7], [clearanceDeg * 0.7, -clearanceDeg * 0.7],
      [-clearanceDeg * 0.7, clearanceDeg * 0.7], [-clearanceDeg * 0.7, -clearanceDeg * 0.7],
    ];
    for (const [dlat, dlonRaw] of probes) {
      const la = THREE.MathUtils.clamp(lat + dlat, ROUTE_LAT_MIN, ROUTE_LAT_MAX);
      const lo = normLon(lon + dlonRaw / Math.max(0.25, Math.cos(THREE.MathUtils.degToRad(la))));
      if (this.sampler.heightAt(la, lo) > WATER_PROBE_HEIGHT_MAX) return false;
    }
    return true;
  }

  _waterSegmentClear(a, b, profile = ROUTE_PROFILES[0]) {
    const va = latLonToVector3(a.lat, a.lon, PLANET.RADIUS, new THREE.Vector3());
    const vb = latLonToVector3(b.lat, b.lon, PLANET.RADIUS, new THREE.Vector3());
    const len = greatCircleDistance(va, vb, PLANET.RADIUS);
    const steps = Math.max(4, Math.ceil(len / 3));
    const p = new THREE.Vector3();
    for (let i = 1; i < steps; i++) {
      slerpOnSphere(va, vb, i / steps, 1, p);
      const lat = THREE.MathUtils.radToDeg(Math.asin(THREE.MathUtils.clamp(p.y, -1, 1)));
      const lon = normLon(Math.atan2(p.z, -p.x) * 180 / Math.PI - 180);
      if (!this._isWater(lat, lon, profile.maxH, Math.min(profile.clearanceDeg, SAMPLE_CLEARANCE_DEG))) return false;
    }
    return true;
  }

  _nodeDistance(a, b) {
    const A = latLonToVector3(a.lat, a.lon, PLANET.RADIUS, new THREE.Vector3());
    const B = latLonToVector3(b.lat, b.lon, PLANET.RADIUS, new THREE.Vector3());
    return greatCircleDistance(A, B, PLANET.RADIUS);
  }

  _nodeHeuristic(a, b) {
    return this._nodeDistance(a, b);
  }

  _coastPenalty(p) {
    const h = this.sampler ? this.sampler.heightAt(p.lat, p.lon) : -1;
    return Math.max(0, h + 1.2) * 14;
  }

  /** 主循环：沿某条航线按已走路长取位置与切线（船真正沿弧线移动） */
  sampleAt(route, walked, outPos = new THREE.Vector3(), outTan = new THREE.Vector3(), opts = {}) {
    const total = Math.max(route.length, 1e-6);
    const wrap = opts.wrap !== false;
    const sampled = wrap ? ((walked % total) + total) % total : THREE.MathUtils.clamp(walked, 0, total);
    let d = sampled;
    let idx = 0;
    while (idx < route.segmentLengths.length - 1 && d > route.segmentLengths[idx]) {
      d -= route.segmentLengths[idx];
      idx++;
    }
    const segLen = Math.max(route.segmentLengths[idx] || total, 1e-6);
    const t = THREE.MathUtils.clamp(d / segLen, 0, 1);
    const a = route.path[idx] || route.A;
    const b = route.path[idx + 1] || route.B;
    slerpOnSphere(a, b, t, PLANET.RADIUS + ROUTE_LIFT, outPos);
    // 切线：前方微小角距的差分（保证在切平面内）
    const ahead = Math.min(1, t + 0.018);
    if (ahead > t && idx < route.path.length - 1) {
      slerpOnSphere(a, b, ahead, PLANET.RADIUS + ROUTE_LIFT, outTan);
      outTan.sub(outPos);
      // 去掉径向分量 → 纯切向
      const radial = outPos.clone().normalize();
      outTan.addScaledVector(radial, -outTan.dot(radial));
      if (outTan.lengthSq() > 1e-10) outTan.normalize();
      else greatCircleTangent(a, b, outTan);
    } else {
      greatCircleTangent(a, b, outTan);
    }
    return { position: outPos, tangent: outTan, t: sampled / total };
  }

  /** 航线总数（船只 AI 用） */
  get count() { return this.lines.length; }

  pick(index) { return this.lines[index % Math.max(1, this.lines.length)]; }

  /** 找 a→b（或反向）的现成航线；没有就临时生成一条水路（海战 / 修理回航用）。
   *  注意：临时航线不加 line 网格（不打扰航线可视化），纯数据。 */
  routeBetween(a, b) {
    for (const l of this.lines) {
      if ((l.from.id === a.id && l.to.id === b.id) || (l.from.id === b.id && l.to.id === a.id)) return l;
    }
    return this._makeTransient(a, b);
  }

  /** 生成一条「临时水路」（无可视化，只给 sampleAt 用；不重复加进 this.lines） */
  _makeTransient(a, b) {
    const A = this._posOf(a), B = this._posOf(b);
    const path = this._buildWaterPath(a, b);
    const segmentLengths = [];
    let len = 0;
    for (let i = 0; i < path.length - 1; i++) {
      const d = greatCircleDistance(path[i], path[i + 1], PLANET.RADIUS);
      segmentLengths.push(d);
      len += d;
    }
    return {
      line: null, from: a, to: b, A, B, path, segmentLengths, length: len, transient: true,
    };
  }

  setVisible(v) {
    this.visible = !!v;
    this.lines.forEach((r) => (r.line.visible = this.visible));
  }

  /** 相机可见性 LOD：全球视角用低不透明度，局部视角更明显 */
  tuneForMode(mode) {
    const o = mode === 'GLOBE' ? 0.22 : 0.5;
    this.lines.forEach((r) => (r.line.material.opacity = o));
  }

  clear() {
    for (const r of this.lines) {
      r.line.geometry.dispose();
      r.line.material.dispose();
      this.group.remove(r.line);
    }
    this.lines.length = 0;
  }

  summary() {
    return { routes: this.lines.length, visible: this.visible };
  }
}

function sharesEndpoint(a, b) {
  return a[0] === b[0] || a[0] === b[1] || a[1] === b[0] || a[1] === b[1];
}

function permutations(items) {
  if (items.length <= 1) return [items];
  const out = [];
  for (let i = 0; i < items.length; i++) {
    const head = items[i];
    const rest = items.slice(0, i).concat(items.slice(i + 1));
    for (const tail of permutations(rest)) out.push([head, ...tail]);
  }
  return out;
}

export { CAMERA };
