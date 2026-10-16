/** DOM-free falling-block rules. Time is advanced explicitly with tick(ms). */
export const SHAPES = Object.freeze({
  I: Object.freeze([[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]].map(Object.freeze)),
  O: Object.freeze([[1, 1], [1, 1]].map(Object.freeze)),
  T: Object.freeze([[0, 1, 0], [1, 1, 1], [0, 0, 0]].map(Object.freeze)),
  S: Object.freeze([[0, 1, 1], [1, 1, 0], [0, 0, 0]].map(Object.freeze)),
  Z: Object.freeze([[1, 1, 0], [0, 1, 1], [0, 0, 0]].map(Object.freeze)),
  J: Object.freeze([[1, 0, 0], [1, 1, 1], [0, 0, 0]].map(Object.freeze)),
  L: Object.freeze([[0, 0, 1], [1, 1, 1], [0, 0, 0]].map(Object.freeze)),
});

export const COLORS = Object.freeze({
  I: '#65dcf5', O: '#f6d881', T: '#b79bff', S: '#8ee2b1',
  Z: '#f58e9c', J: '#87aef8', L: '#f4b07b',
});

const WIDTH = 10;
const HEIGHT = 20;
const LOCK_DELAY = 500;
const MAX_LOCK_RESETS = 15;
const TYPES = Object.keys(SHAPES);
const LINE_POINTS = [0, 100, 300, 500, 800];
const emptyRow = () => Array(WIDTH).fill(null);
const copyMatrix = matrix => matrix.map(row => [...row]);

// SRS kick offsets in screen coordinates (positive y points down).
const NORMAL_KICKS = {
  '0>1': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  '1>0': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  '1>2': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  '2>1': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  '2>3': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  '3>2': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  '3>0': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  '0>3': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
};
const I_KICKS = {
  '0>1': [[0, 0], [-2, 0], [1, 0], [-2, 1], [1, -2]],
  '1>0': [[0, 0], [2, 0], [-1, 0], [2, -1], [-1, 2]],
  '1>2': [[0, 0], [-1, 0], [2, 0], [-1, -2], [2, 1]],
  '2>1': [[0, 0], [1, 0], [-2, 0], [1, 2], [-2, -1]],
  '2>3': [[0, 0], [2, 0], [-1, 0], [2, -1], [-1, 2]],
  '3>2': [[0, 0], [-2, 0], [1, 0], [-2, 1], [1, -2]],
  '3>0': [[0, 0], [1, 0], [-2, 0], [1, 2], [-2, -1]],
  '0>3': [[0, 0], [-1, 0], [2, 0], [-1, -2], [2, 1]],
};

export class Game {
  constructor(options = {}) {
    if (typeof options === 'function') options = { onEvent: options };
    this.onEvent = options.onEvent || (() => {});
    this.random = options.random || Math.random;
    this._reset();
  }

  _reset() {
    this.board = Array.from({ length: HEIGHT }, emptyRow);
    this.piece = null;
    this.next = [];
    this.held = null;
    this.score = 0;
    this.lines = 0;
    this.level = 1;
    this.combo = 0;
    this.charge = 0;
    this.state = 'ready';
    this.canHold = true;
    this._bag = [];
    this._gravityElapsed = 0;
    this._lockElapsed = 0;
    this._lockResets = 0;
    this._fillNext();
  }

  get gravityMs() {
    return Math.max(65, 850 * Math.pow(0.8, this.level - 1));
  }

  get grounded() {
    return Boolean(this.piece && !this._fits(this.piece.matrix, this.piece.x, this.piece.y + 1));
  }

  start() {
    this._reset();
    this.state = 'playing';
    this._spawn();
    this._emit('start');
    return true;
  }

  _emit(type, details = {}) {
    this.onEvent({ type, ...details });
  }

  _fillNext() {
    while (this.next.length < 5) {
      if (!this._bag.length) {
        this._bag = [...TYPES];
        for (let i = this._bag.length - 1; i > 0; i--) {
          const j = Math.min(i, Math.max(0, Math.floor(this.random() * (i + 1))));
          [this._bag[i], this._bag[j]] = [this._bag[j], this._bag[i]];
        }
      }
      this.next.push(this._bag.pop());
    }
  }

  _spawn(type) {
    if (!type) {
      type = this.next.shift();
      this._fillNext();
    }
    const matrix = copyMatrix(SHAPES[type]);
    this.piece = { type, matrix, x: Math.floor((WIDTH - matrix.length) / 2), y: -1, rotation: 0 };
    this._gravityElapsed = 0;
    this._lockElapsed = 0;
    this._lockResets = 0;
    if (!this._fits(matrix, this.piece.x, this.piece.y)) this._end('spawn');
  }

  _fits(matrix, x, y) {
    for (let row = 0; row < matrix.length; row++) {
      for (let col = 0; col < matrix[row].length; col++) {
        if (!matrix[row][col]) continue;
        const bx = x + col;
        const by = y + row;
        if (bx < 0 || bx >= WIDTH || by >= HEIGHT) return false;
        if (by >= 0 && this.board[by][bx] !== null) return false;
      }
    }
    return true;
  }

  _resetLockAfterInput(wasGrounded) {
    if (wasGrounded && this._lockResets < MAX_LOCK_RESETS) {
      this._lockElapsed = 0;
      this._lockResets++;
    }
  }

  move(dx) {
    if (this.state !== 'playing' || !this.piece || !Number.isFinite(dx)) return false;
    const steps = Math.min(WIDTH, Math.abs(Math.trunc(dx)));
    const direction = Math.sign(dx);
    const wasGrounded = this.grounded;
    let moved = 0;
    for (let i = 0; i < steps; i++) {
      if (!this._fits(this.piece.matrix, this.piece.x + direction, this.piece.y)) break;
      this.piece.x += direction;
      moved += direction;
    }
    if (!moved) return false;
    this._resetLockAfterInput(wasGrounded);
    this._emit('move', { dx: moved });
    return true;
  }

  rotate(dir = 1) {
    if (this.state !== 'playing' || !this.piece || !Number.isFinite(dir) || dir === 0) return false;
    if (this.piece.type === 'O') return false;
    const clockwise = dir > 0;
    const old = this.piece.matrix;
    const size = old.length;
    const matrix = Array.from({ length: size }, (_, row) => Array.from({ length: size }, (_, col) =>
      clockwise ? old[size - 1 - col][row] : old[col][size - 1 - row]));
    const from = this.piece.rotation || 0;
    const to = (from + (clockwise ? 1 : 3)) % 4;
    const table = this.piece.type === 'I' ? I_KICKS : NORMAL_KICKS;
    const wasGrounded = this.grounded;
    for (const [dx, dy] of table[`${from}>${to}`]) {
      if (!this._fits(matrix, this.piece.x + dx, this.piece.y + dy)) continue;
      this.piece.matrix = matrix;
      this.piece.x += dx;
      this.piece.y += dy;
      this.piece.rotation = to;
      this._resetLockAfterInput(wasGrounded);
      this._emit('rotate', { direction: clockwise ? 1 : -1, kick: { x: dx, y: dy } });
      return true;
    }
    return false;
  }

  softDrop() {
    if (this.state !== 'playing' || !this.piece) return false;
    if (!this._fits(this.piece.matrix, this.piece.x, this.piece.y + 1)) return false;
    this.piece.y++;
    this.score++;
    if (this._lockResets < MAX_LOCK_RESETS) this._lockElapsed = 0;
    this._emit('drop', { hard: false, distance: 1 });
    return true;
  }

  ghostY() {
    if (!this.piece) return null;
    let y = this.piece.y;
    while (this._fits(this.piece.matrix, this.piece.x, y + 1)) y++;
    return y;
  }

  hardDrop() {
    if (this.state !== 'playing' || !this.piece) return false;
    const y = this.ghostY();
    const distance = y - this.piece.y;
    this.piece.y = y;
    this.score += distance * 2;
    this._emit('drop', { hard: true, distance, piece: this._pieceSnapshot() });
    this._lock();
    return distance;
  }

  hold() {
    if (this.state !== 'playing' || !this.piece || !this.canHold) return false;
    const previous = this.held;
    this.held = this.piece.type;
    this.canHold = false;
    this._spawn(previous || undefined);
    this._emit('hold', { held: this.held, active: this.piece.type });
    return true;
  }

  tick(dt) {
    if (this.state !== 'playing' || !this.piece || !Number.isFinite(dt) || dt <= 0) return;
    let remaining = dt;
    // Advance to each physics boundary so a slow frame cannot skip lock delay.
    while (remaining > 0 && this.state === 'playing') {
      const grounded = this.grounded;
      const untilGravity = Math.max(0, this.gravityMs - this._gravityElapsed);
      const untilLock = grounded ? Math.max(0, LOCK_DELAY - this._lockElapsed) : Infinity;
      const elapsed = Math.min(remaining, untilGravity, untilLock);
      this._gravityElapsed += elapsed;
      if (grounded) this._lockElapsed += elapsed;
      remaining -= elapsed;

      if (grounded && this._lockElapsed >= LOCK_DELAY) {
        this._lock();
        continue;
      }
      if (this._gravityElapsed >= this.gravityMs) {
        this._gravityElapsed = 0;
        if (this._fits(this.piece.matrix, this.piece.x, this.piece.y + 1)) {
          this.piece.y++;
          if (this._lockResets < MAX_LOCK_RESETS) this._lockElapsed = 0;
        }
      }
    }
  }

  togglePause() {
    if (this.state === 'playing') this.state = 'paused';
    else if (this.state === 'paused') this.state = 'playing';
    else return false;
    this._emit('pause', { paused: this.state === 'paused' });
    return true;
  }

  _pieceSnapshot() {
    return { ...this.piece, matrix: copyMatrix(this.piece.matrix) };
  }

  _lock() {
    const piece = this._pieceSnapshot();
    const cells = [];
    let aboveBoard = false;
    piece.matrix.forEach((row, dy) => row.forEach((value, dx) => {
      if (!value) return;
      const x = piece.x + dx;
      const y = piece.y + dy;
      cells.push({ x, y, type: piece.type });
      if (y < 0) aboveBoard = true;
      else this.board[y][x] = piece.type;
    }));
    this._emit('lock', { piece, cells });
    if (aboveBoard) {
      this._end('lock');
      return;
    }
    const rows = [];
    this.board.forEach((row, index) => {
      if (row.every(cell => cell !== null)) rows.push(index);
    });
    if (rows.length) {
      this.combo++;
      const points = (LINE_POINTS[Math.min(4, rows.length)] + 50 * Math.max(0, this.combo - 1)) * this.level;
      this.score += points;
      this.lines += rows.length;
      this.charge = Math.min(100, this.charge + rows.length * 25);
      this.level = Math.floor(this.lines / 10) + 1;
      this._removeRows(rows);
      this._emit('clear', { rows, count: rows.length, skill: false, combo: this.combo, points });
    } else {
      this.combo = 0;
    }
    this.canHold = true;
    this._spawn();
  }

  _removeRows(rows) {
    const removed = new Set(rows);
    this.board = this.board.filter((_, index) => !removed.has(index));
    while (this.board.length < HEIGHT) this.board.unshift(emptyRow());
  }

  useSkill() {
    if (this.state !== 'playing' || !this.piece || this.charge < 100) return false;
    const rows = [];
    for (let y = HEIGHT - 1; y >= 0 && rows.length < 2; y--) {
      if (this.board[y].some(cell => cell !== null)) rows.push(y);
    }
    if (!rows.length) return false;
    rows.sort((a, b) => a - b);
    this.charge = 0;
    this._removeRows(rows);
    const points = rows.length * 100 * this.level;
    this.score += points;
    this.lines += rows.length;
    this.level = Math.floor(this.lines / 10) + 1;
    // A falling piece never gets embedded in blocks shifted down by the skill.
    while (!this._fits(this.piece.matrix, this.piece.x, this.piece.y)) this.piece.y--;
    this._lockElapsed = 0;
    this._emit('clear', { rows, count: rows.length, skill: true, combo: this.combo, points });
    return true;
  }

  _end(reason) {
    this.state = 'over';
    this._emit('over', { reason, score: this.score, lines: this.lines });
  }
}
