import test from 'node:test';
import assert from 'node:assert/strict';
import { Game, SHAPES, COLORS } from '../engine.js';

const emptyBoard = () => Array.from({ length: 20 }, () => Array(10).fill(null));
const clone = matrix => matrix.map(row => [...row]);
const makeGame = () => {
  const events = [];
  const game = new Game({ onEvent: event => events.push(event), random: () => 0.375 });
  game.start();
  return { game, events };
};
const putPiece = (game, type, x, y) => {
  game.piece = { type, matrix: clone(SHAPES[type]), x, y, rotation: 0 };
  game._gravityElapsed = game._lockElapsed = game._lockResets = 0;
};
const setClear = (game, count) => {
  game.board = emptyBoard();
  for (let y = 20 - count; y < 20; y++) {
    game.board[y] = Array(10).fill('J');
    game.board[y][5] = null;
  }
  putPiece(game, 'I', 3, 15);
  assert.equal(game.rotate(), true); // Occupied column is x + 2 = 5.
};

test('ready state, start, restart and exports have complete, independent data', () => {
  const game = new Game();
  assert.equal(game.state, 'ready');
  assert.equal(game.board.length, 20);
  assert.equal(game.board[0].length, 10);
  assert.ok(game.next.length >= 3);
  assert.equal(game.ghostY(), null);
  assert.deepEqual(Object.keys(SHAPES).sort(), Object.keys(COLORS).sort());
  assert.equal(Object.values(SHAPES).every(matrix => matrix.flat().filter(Boolean).length === 4), true);
  game.start();
  assert.equal(game.state, 'playing');
  game.board[19][0] = 'L';
  game.score = 50;
  game.start();
  assert.equal(game.score, 0);
  assert.equal(game.board[19][0], null);
  assert.notEqual(game.board[0], game.board[1]);
  assert.notEqual(game.piece.matrix, SHAPES[game.piece.type]);
});

test('a function may be supplied directly as the event callback', () => {
  const events = [];
  new Game(event => events.push(event)).start();
  assert.equal(events[0].type, 'start');
});

test('every seven-piece bag contains all seven tetrominoes', () => {
  const { game } = makeGame();
  const types = [];
  for (let i = 0; i < 70; i++) {
    types.push(game.piece.type);
    game.board = emptyBoard();
    game.hardDrop();
    assert.ok(game.next.length >= 3);
  }
  for (let i = 0; i < types.length; i += 7) {
    assert.deepEqual([...new Set(types.slice(i, i + 7))].sort(), Object.keys(SHAPES).sort());
  }
});

test('pieces spawn partially above the board and can rotate there', () => {
  const { game } = makeGame();
  putPiece(game, 'T', 3, -1);
  assert.equal(game.rotate(), true);
  assert.equal(game.state, 'playing');
  assert.ok(game._fits(game.piece.matrix, game.piece.x, game.piece.y));
});

test('four clockwise rotations restore a piece, and counterclockwise reverses clockwise', () => {
  const { game } = makeGame();
  for (const type of ['I', 'T', 'S', 'Z', 'J', 'L']) {
    putPiece(game, type, 3, 5);
    for (let i = 0; i < 4; i++) assert.equal(game.rotate(), true);
    assert.deepEqual(game.piece.matrix, SHAPES[type]);
    assert.equal(game.piece.rotation, 0);
    game.rotate();
    game.rotate(-1);
    assert.deepEqual(game.piece.matrix, SHAPES[type]);
  }
});

test('SRS rotates a T away from the left wall', () => {
  const { game, events } = makeGame();
  putPiece(game, 'T', 0, 4);
  game.rotate();
  game.move(-1);
  assert.equal(game.piece.x, -1);
  assert.equal(game.rotate(), true);
  assert.equal(game.piece.x, 0);
  assert.deepEqual(events.at(-1).kick, { x: 1, y: 0 });
});

test('I-piece wall kick handles the right wall', () => {
  const { game } = makeGame();
  putPiece(game, 'I', 3, 5);
  game.rotate();
  game.move(10);
  assert.equal(game.piece.x, 7);
  assert.equal(game.rotate(), true);
  assert.equal(game.piece.x, 6);
  assert.ok(game._fits(game.piece.matrix, game.piece.x, game.piece.y));
});

test('floor kicks lift a grounded piece without entering the floor', () => {
  const { game } = makeGame();
  putPiece(game, 'T', 3, 18);
  assert.equal(game.grounded, true);
  assert.equal(game.rotate(), true);
  assert.equal(game.piece.y, 17);
  assert.ok(game._fits(game.piece.matrix, game.piece.x, game.piece.y));
});

test('blocked rotation leaves piece state unchanged', () => {
  const { game } = makeGame();
  game.board = Array.from({ length: 20 }, () => Array(10).fill('J'));
  putPiece(game, 'T', 3, 8);
  game.piece.matrix.forEach((row, dy) => row.forEach((v, dx) => {
    if (v) game.board[8 + dy][3 + dx] = null;
  }));
  const before = structuredClone(game.piece);
  assert.equal(game.rotate(), false);
  assert.deepEqual(game.piece, before);
});

test('hold is permitted only once per active piece and resets after locking', () => {
  const { game } = makeGame();
  const first = game.piece.type;
  const next = game.next[0];
  assert.equal(game.hold(), true);
  assert.equal(game.held, first);
  assert.equal(game.piece.type, next);
  assert.equal(game.canHold, false);
  assert.equal(game.hold(), false);
  game.hardDrop();
  assert.equal(game.canHold, true);
  const active = game.piece.type;
  const queue = [...game.next];
  assert.equal(game.hold(), true);
  assert.equal(game.piece.type, first);
  assert.equal(game.held, active);
  assert.deepEqual(game.next, queue);
  assert.equal(game.piece.rotation, 0);
});

for (const count of [1, 2, 3, 4]) {
  test(`clears ${count} row(s), awards normal line score, and charges the skill`, () => {
    const { game, events } = makeGame();
    setClear(game, count);
    const drop = game.ghostY() - game.piece.y;
    game.hardDrop();
    assert.equal(game.lines, count);
    assert.equal(game.score, [0, 100, 300, 500, 800][count] + 2 * drop);
    assert.equal(game.charge, 25 * count);
    assert.equal(game.combo, 1);
    assert.equal(game.board.length, 20);
    assert.equal(game.board.some(row => row.every(Boolean)), false);
    const event = events.find(event => event.type === 'clear');
    assert.deepEqual(event.rows, Array.from({ length: count }, (_, i) => 20 - count + i));
    assert.equal(event.count, count);
    assert.equal(event.skill, false);
    assert.equal(event.combo, 1);
  });
}

test('combos give a bonus only on consecutive clears and reset on a nonclear', () => {
  const { game, events } = makeGame();
  setClear(game, 1);
  game.hardDrop();
  setClear(game, 1);
  game.hardDrop();
  assert.equal(game.combo, 2);
  assert.equal(events.filter(event => event.type === 'clear').at(-1).points, 150);
  game.board = emptyBoard();
  game.hardDrop();
  assert.equal(game.combo, 0);
});

test('level advances at ten cleared rows and charge is capped at 100', () => {
  const { game } = makeGame();
  game.lines = 9;
  game.charge = 90;
  const speed = game.gravityMs;
  setClear(game, 2);
  game.hardDrop();
  assert.equal(game.lines, 11);
  assert.equal(game.level, 2);
  assert.equal(game.charge, 100);
  assert.ok(game.gravityMs < speed);
});

test('ghost lands against a stack and hard drop uses exactly that position', () => {
  const { game, events } = makeGame();
  game.board[15][4] = 'Z';
  putPiece(game, 'O', 4, 0);
  assert.equal(game.ghostY(), 13);
  assert.equal(game.piece.y, 0);
  assert.equal(game.hardDrop(), 13);
  assert.equal(game.board[13][4], 'O');
  assert.equal(game.board[14][5], 'O');
  assert.equal(game.board[15][4], 'Z');
  assert.equal(game.score, 26);
  assert.equal(events.find(event => event.type === 'drop').distance, 13);
});

test('soft drop awards one point, never passes through a stack, and keeps lock delay', () => {
  const { game } = makeGame();
  putPiece(game, 'O', 4, 17);
  assert.equal(game.softDrop(), true);
  assert.equal(game.score, 1);
  assert.equal(game.piece.y, 18);
  assert.equal(game.softDrop(), false);
  assert.equal(game.board[19][4], null);
  game.tick(499);
  assert.equal(game.board[19][4], null);
  game.tick(1);
  assert.equal(game.board[19][4], 'O');
});

test('grounded movement resets lock delay, with a strict cap of fifteen resets', () => {
  const { game, events } = makeGame();
  putPiece(game, 'O', 4, 18);
  for (let i = 0; i < 15; i++) {
    game.tick(400);
    assert.equal(game.move(i % 2 ? 1 : -1), true);
    assert.equal(events.some(event => event.type === 'lock'), false);
  }
  assert.equal(game._lockResets, 15);
  game.tick(400);
  game.move(1);
  game.tick(100);
  assert.equal(events.filter(event => event.type === 'lock').length, 1);
});

test('failed input does not prolong lock delay', () => {
  const { game } = makeGame();
  putPiece(game, 'O', 0, 18);
  game.tick(400);
  assert.equal(game.move(-1), false);
  assert.equal(game.rotate(), false);
  game.tick(100);
  assert.equal(game.board[19][0], 'O');
});

test('leaving the floor cannot bypass the fifteen-reset limit', () => {
  for (const downwardAction of ['gravity', 'softDrop']) {
    const { game } = makeGame();
    putPiece(game, 'O', 4, 17);
    game._lockResets = 15;
    game._lockElapsed = 400;
    if (downwardAction === 'gravity') game.tick(game.gravityMs);
    else game.softDrop();
    assert.equal(game.piece.y, 18);
    assert.equal(game._lockElapsed, 400);
    game.tick(100);
    assert.equal(game.board[19][4], 'O');
  }
});

test('gravity and locking are independent of frame subdivision', () => {
  const { game: first } = makeGame();
  const { game: second } = makeGame();
  first.tick(18000);
  for (let i = 0; i < 1800; i++) second.tick(10);
  assert.deepEqual(first.board, second.board);
  assert.deepEqual(first.piece, second.piece);
  assert.equal(first.score, second.score);
});

test('pause freezes time and rejects all play actions', () => {
  const { game } = makeGame();
  game.charge = 100;
  game.board[19][0] = 'S';
  game.togglePause();
  assert.equal(game.state, 'paused');
  const piece = structuredClone(game.piece);
  game.tick(50000);
  for (const result of [game.move(1), game.rotate(), game.softDrop(), game.hardDrop(), game.hold(), game.useSkill()]) {
    assert.equal(result, false);
  }
  assert.deepEqual(game.piece, piece);
  game.togglePause();
  game.tick(game.gravityMs);
  assert.equal(game.piece.y, piece.y + 1);
});

test('spawn collision and above-board locking both cause top-out', () => {
  const { game, events } = makeGame();
  game.board[0] = Array(10).fill('J');
  game._spawn('T');
  assert.equal(game.state, 'over');
  assert.equal(events.at(-1).reason, 'spawn');
  game.start();
  putPiece(game, 'O', 4, -1);
  game.board[1][4] = 'J';
  game.board[1][5] = 'J';
  game.hardDrop();
  assert.equal(game.state, 'over');
  assert.equal(events.at(-1).reason, 'lock');
  assert.equal(game.togglePause(), false);
});

test('skill clears the two bottom occupied rows, skips empty rows, and consumes full charge', () => {
  const { game, events } = makeGame();
  game.charge = 100;
  game.board[19][0] = 'L';
  game.board[16][1] = 'I';
  game.board[13][2] = 'T';
  assert.equal(game.useSkill(), true);
  assert.equal(game.charge, 0);
  assert.equal(game.lines, 2);
  assert.equal(game.score, 200);
  assert.equal(game.board[15][2], 'T');
  assert.equal(game.board.flat().filter(Boolean).length, 1);
  assert.equal(game.useSkill(), false);
  const clear = events.at(-1);
  assert.equal(clear.type, 'clear');
  assert.equal(clear.skill, true);
  assert.equal(clear.count, 2);
  assert.deepEqual(clear.rows, [16, 19]);
});

test('skill requires full charge and preserves it on an empty board', () => {
  const { game } = makeGame();
  game.board[19][0] = 'L';
  game.charge = 99;
  assert.equal(game.useSkill(), false);
  assert.equal(game.charge, 99);
  game.board = emptyBoard();
  game.charge = 100;
  assert.equal(game.useSkill(), false);
  assert.equal(game.charge, 100);
});

test('skill can clear a single remaining occupied row', () => {
  const { game, events } = makeGame();
  game.charge = 100;
  game.board[12][0] = 'L';
  assert.equal(game.useSkill(), true);
  assert.equal(game.board.flat().filter(Boolean).length, 0);
  assert.equal(game.charge, 0);
  assert.equal(events.at(-1).count, 1);
});

test('nonfinite time and movement inputs cannot corrupt state', () => {
  const { game } = makeGame();
  const piece = structuredClone(game.piece);
  for (const value of [NaN, Infinity, -Infinity]) {
    game.tick(value);
    assert.equal(game.move(value), false);
    assert.equal(game.rotate(value), false);
  }
  assert.deepEqual(game.piece, piece);
});

test('seeded mixed-input stress test preserves board and collision invariants', () => {
  for (let seed = 1; seed <= 10; seed++) {
    let state = seed;
    const random = () => ((state = (Math.imul(state, 1664525) + 1013904223) >>> 0) / 2 ** 32);
    const game = new Game({ random });
    game.start();
    for (let i = 0; i < 1000; i++) {
      if (game.state === 'over') game.start();
      const action = Math.floor(random() * 10);
      if (action < 2) game.move(action ? 1 : -1);
      else if (action < 4) game.rotate(action === 2 ? 1 : -1);
      else if (action === 4) game.hold();
      else if (action === 5) game.softDrop();
      else if (action === 6) game.hardDrop();
      else if (action === 7) { game.charge = 100; game.useSkill(); }
      else game.tick(random() * 1500);
      assert.equal(game.board.length, 20);
      assert.ok(game.board.every(row => row.length === 10));
      assert.ok(game.charge >= 0 && game.charge <= 100);
      assert.ok(Number.isFinite(game.score) && game.score >= 0);
      assert.ok(game.next.length >= 3);
      if (game.state === 'playing') {
        assert.ok(game._fits(game.piece.matrix, game.piece.x, game.piece.y));
        const ghost = game.ghostY();
        assert.ok(game._fits(game.piece.matrix, game.piece.x, ghost));
        assert.equal(game._fits(game.piece.matrix, game.piece.x, ghost + 1), false);
      }
    }
  }
});
