import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js";

const BOARD_SIZE = 15;
const CENTER = Math.floor(BOARD_SIZE / 2);
const BOARD_LETTERS = "abcdefghijklmno";
const GRID_WORLD = 11.15;
const CELL = GRID_WORLD / (BOARD_SIZE - 1);
const BOARD_WORLD = 13.1;
const MOBILE_VIEW_WORLD = GRID_WORLD + 1.05;
const PIECE_SPRITE_Y = CELL * 0.4;
const CELEBRANT_SPRITE_Y = CELL * 0.31;
const HINT_DANGER_SCORE = 58_000;
const HINT_CRITICAL_SCORE = 260_000;
const CAPTURE_RULE_TEXT = "吃子规则：落子夹住对方连续两子，就能吃掉这两子";
const PLAYER_ORANGE = 1;
const PLAYER_BLUE = -1;
const DIRECTIONS = [
  [1, 0],
  [0, 1],
  [1, 1],
  [1, -1],
];
const CAPTURE_DIRECTIONS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
  [1, 1],
  [-1, -1],
  [1, -1],
  [-1, 1],
];
const THEME = {
  [PLAYER_ORANGE]: {
    name: "橙方",
    color: "#d35d38",
    pale: "#ffe2b8",
    ink: "#873a28",
    score: "scoreOrange",
    capture: "captureOrange",
  },
  [PLAYER_BLUE]: {
    name: "蓝方",
    color: "#4c57a8",
    pale: "#dfe7ff",
    ink: "#25326f",
    score: "scoreBlue",
    capture: "captureBlue",
  },
};
const CHARACTER_BLUEPRINTS = [
  { id: "mushroom", label: "蘑菇", kind: "mushroom", body: "#f5ba63", accent: "#d86647", ink: "#8a3b27" },
  { id: "owl", label: "猫头鹰", kind: "owl", body: "#6572bf", accent: "#e4bd47", ink: "#26316f" },
  { id: "cat", label: "小猫", kind: "cat", body: "#f1a45d", accent: "#fff2c7", ink: "#7d442d" },
  { id: "sprout", label: "嫩芽", kind: "sprout", body: "#b6c978", accent: "#5d934f", ink: "#4b6538" },
  { id: "cactus", label: "仙人掌", kind: "cactus", body: "#7eb56f", accent: "#f2a5ba", ink: "#416934" },
  { id: "fox", label: "小狐", kind: "fox", body: "#df7744", accent: "#fff0ce", ink: "#7f3b23" },
  { id: "rabbit", label: "兔子", kind: "rabbit", body: "#f3d5c7", accent: "#f19aac", ink: "#755247" },
  { id: "flower", label: "花花", kind: "flower", body: "#80b765", accent: "#f0a2c6", ink: "#46673d" },
  { id: "bee", label: "小蜂", kind: "bee", body: "#f2c64d", accent: "#4d3a2e", ink: "#5f421f" },
  { id: "penguin", label: "企鹅", kind: "penguin", body: "#4d5796", accent: "#fff3d1", ink: "#252c5d" },
];
const CELEBRATION_ACTIONS = ["jump", "highFive", "daze", "bump", "wave", "spin"];

const canvas = document.querySelector("#scene");
const floatingLayer = document.querySelector("#floatingLayer");
const turnText = document.querySelector("#turnText");
const turnCard = document.querySelector("#turnCard");
const eventText = document.querySelector("#eventText");
const hintText = document.querySelector("#hintText");
const soundButton = document.querySelector("#sound");
const restartButton = document.querySelector("#restart");
const mischiefButton = document.querySelector("#mischief");
const hintButton = document.querySelector("#hint");
const attackButton = document.querySelector("#attack");
const modeButtons = [...document.querySelectorAll(".mode-button")];
const victoryPanel = document.querySelector("#victoryPanel");
const victoryTitle = document.querySelector("#victoryTitle");
const victorySubtitle = document.querySelector("#victorySubtitle");
const continueGameButton = document.querySelector("#continueGame");
const watchCelebrationButton = document.querySelector("#watchCelebration");

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true,
  preserveDrawingBuffer: true,
  powerPreference: "high-performance",
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0xf5ead4, 22, 62);

const perspectiveCamera = new THREE.PerspectiveCamera(34, 1, 0.1, 80);
const orthographicCamera = new THREE.OrthographicCamera(-8, 8, 8, -8, 0.1, 80);
let camera = perspectiveCamera;
const cameraTarget = new THREE.Vector3(0, 0, 0);
const baseCamera = new THREE.Vector3();
let isMobileView = false;

const boardRoot = new THREE.Group();
const pieceRoot = new THREE.Group();
const effectRoot = new THREE.Group();
const disturbanceRoot = new THREE.Group();
const victoryRoot = new THREE.Group();
scene.add(boardRoot, pieceRoot, effectRoot, disturbanceRoot, victoryRoot);

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const textureCache = new Map();
const animations = [];
const particles = [];
const planes = [];
const bombs = [];
const attackers = [];
const celebrants = [];
const fireworkParticles = [];
const letterSparks = [];

let boardPlane;
let hoverRing;
let lastRing;
let hintMarker;
let dangerMarker;
let audioContext = null;
let soundEnabled = true;
let aiTimer = null;
let victoryPromptTimer = null;
let manualMischiefCooldown = 0;
let manualAttackCooldown = 0;
let hintEnabled = false;
let shake = { time: 0, duration: 0, strength: 0 };
const celebration = {
  active: false,
  elapsed: 0,
  nextFirework: 0,
  player: null,
};
const disturbance = {
  nextAt: 0,
};

const state = {
  board: makeEmptyBoard(),
  mode: "ai",
  current: PLAYER_ORANGE,
  gameOver: false,
  aiThinking: false,
  scores: {
    [PLAYER_ORANGE]: 0,
    [PLAYER_BLUE]: 0,
  },
  captures: {
    [PLAYER_ORANGE]: 0,
    [PLAYER_BLUE]: 0,
  },
  pieces: new Map(),
  destroyed: new Set(),
  characters: {
    [PLAYER_ORANGE]: CHARACTER_BLUEPRINTS[0],
    [PLAYER_BLUE]: CHARACTER_BLUEPRINTS[1],
  },
  moveCount: 0,
};

initScene();
resetGame();
animate();

window.addEventListener("resize", resize);
canvas.addEventListener("pointermove", onPointerMove);
canvas.addEventListener("pointerleave", () => {
  hoverRing.visible = false;
});
canvas.addEventListener("pointerdown", onPointerDown);

restartButton.addEventListener("click", () => {
  ensureAudio();
  playTapSound();
  resetGame();
});

mischiefButton.addEventListener("click", () => {
  ensureAudio();
  playTapSound();
  triggerManualMischief();
});

hintButton.addEventListener("click", () => {
  ensureAudio();
  hintEnabled = !hintEnabled;
  updateHintButton();
  refreshHints(true);
  playTapSound();
});

attackButton.addEventListener("click", () => {
  ensureAudio();
  playTapSound();
  triggerAnimalAttack();
});

continueGameButton.addEventListener("click", () => {
  ensureAudio();
  playTapSound();
  resetGame();
});

watchCelebrationButton.addEventListener("click", () => {
  ensureAudio();
  playTapSound();
  hideVictoryPrompt();
});

soundButton.addEventListener("click", () => {
  ensureAudio();
  soundEnabled = !soundEnabled;
  soundButton.classList.toggle("sound-on", soundEnabled);
  soundButton.textContent = soundEnabled ? "♪" : "×";
  playTapSound();
});

modeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    ensureAudio();
    if (state.mode === button.dataset.mode) return;
    state.mode = button.dataset.mode;
    modeButtons.forEach((item) => {
      const active = item === button;
      item.classList.toggle("active", active);
      item.setAttribute("aria-selected", String(active));
    });
    playTapSound();
    resetGame();
  });
});

function initScene() {
  const ambient = new THREE.HemisphereLight(0xfff7e7, 0x889577, 2.3);
  scene.add(ambient);

  const key = new THREE.DirectionalLight(0xffffff, 2.2);
  key.position.set(-4.5, 12, 8);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 28;
  key.shadow.camera.left = -9;
  key.shadow.camera.right = 9;
  key.shadow.camera.top = 9;
  key.shadow.camera.bottom = -9;
  scene.add(key);

  const fill = new THREE.DirectionalLight(0xdedfff, 0.8);
  fill.position.set(6, 8, -6);
  scene.add(fill);

  const tableTexture = createPaperTexture(1200, 1200, 0.12);
  tableTexture.colorSpace = THREE.SRGBColorSpace;
  tableTexture.wrapS = THREE.RepeatWrapping;
  tableTexture.wrapT = THREE.RepeatWrapping;
  tableTexture.repeat.set(2, 2);
  const table = new THREE.Mesh(
    new THREE.PlaneGeometry(38, 34, 1, 1),
    new THREE.MeshStandardMaterial({
      map: tableTexture,
      color: 0xf2e8d5,
      roughness: 1,
    }),
  );
  table.rotation.x = -Math.PI / 2;
  table.position.y = -0.08;
  table.receiveShadow = true;
  scene.add(table);

  const boardTexture = createBoardTexture();
  boardTexture.colorSpace = THREE.SRGBColorSpace;
  boardTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  boardPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(BOARD_WORLD, BOARD_WORLD, 1, 1),
    new THREE.MeshStandardMaterial({
      map: boardTexture,
      roughness: 0.92,
      metalness: 0,
    }),
  );
  boardPlane.rotation.x = -Math.PI / 2;
  boardPlane.receiveShadow = true;
  boardRoot.add(boardPlane);

  const boardShadow = new THREE.Mesh(
    new THREE.PlaneGeometry(BOARD_WORLD + 0.5, BOARD_WORLD + 0.5),
    new THREE.MeshBasicMaterial({
      color: 0x3d3326,
      transparent: true,
      opacity: 0.08,
      depthWrite: false,
    }),
  );
  boardShadow.rotation.x = -Math.PI / 2;
  boardShadow.position.set(0.08, -0.07, -0.04);
  boardRoot.add(boardShadow);

  hoverRing = new THREE.Mesh(
    new THREE.RingGeometry(CELL * 0.28, CELL * 0.41, 48),
    new THREE.MeshBasicMaterial({
      color: 0xd35d38,
      transparent: true,
      opacity: 0.68,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  );
  hoverRing.rotation.x = -Math.PI / 2;
  hoverRing.position.y = 0.07;
  hoverRing.visible = false;
  boardRoot.add(hoverRing);

  lastRing = new THREE.Mesh(
    new THREE.RingGeometry(CELL * 0.36, CELL * 0.46, 64),
    new THREE.MeshBasicMaterial({
      color: 0xf2c84b,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  );
  lastRing.rotation.x = -Math.PI / 2;
  lastRing.position.y = 0.075;
  boardRoot.add(lastRing);

  hintMarker = new THREE.Mesh(
    new THREE.RingGeometry(CELL * 0.43, CELL * 0.58, 64),
    new THREE.MeshBasicMaterial({
      color: 0x6e9e54,
      transparent: true,
      opacity: 0.76,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  );
  hintMarker.rotation.x = -Math.PI / 2;
  hintMarker.position.y = 0.102;
  hintMarker.visible = false;
  boardRoot.add(hintMarker);

  dangerMarker = new THREE.Mesh(
    new THREE.RingGeometry(CELL * 0.5, CELL * 0.65, 64),
    new THREE.MeshBasicMaterial({
      color: 0xe34d3e,
      transparent: true,
      opacity: 0.78,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  );
  dangerMarker.rotation.x = -Math.PI / 2;
  dangerMarker.position.y = 0.108;
  dangerMarker.visible = false;
  boardRoot.add(dangerMarker);

  resize();
}

function resize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const aspect = width / height;
  renderer.setSize(width, height, false);

  isMobileView = aspect < 0.78;
  camera = perspectiveCamera;
  perspectiveCamera.aspect = aspect;
  if (isMobileView) {
    scene.fog.near = 80;
    scene.fog.far = 130;
    cameraTarget.set(0, 0, -1.15);
    camera.up.set(0, 0, -1);
    const viewWidth = MOBILE_VIEW_WORLD;
    const distance = viewWidth / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * aspect);
    baseCamera.set(0, distance, cameraTarget.z);
  } else {
    scene.fog.near = 22;
    scene.fog.far = 62;
    cameraTarget.set(0, 0, 0);
    camera.up.set(0, 1, 0);
    baseCamera.set(0, 11.25, 15.1);
  }
  camera.position.copy(baseCamera);
  camera.lookAt(cameraTarget);
  camera.updateProjectionMatrix();
  applyResponsiveSpriteScales();
}

function pieceScaleMultiplier() {
  return isMobileView ? 1.65 : 1;
}

function celebrantScaleMultiplier() {
  return isMobileView ? 1.72 : 1;
}

function setPieceSpriteScale(sprite) {
  const scale = pieceScaleMultiplier();
  const height = CELL * 1.07 * scale;
  sprite.scale.set(CELL * 0.85 * scale, height, 1);
  sprite.position.y = PIECE_SPRITE_Y;
  sprite.position.z = isMobileView ? -height * 0.34 : 0;
}

function setCelebrantSpriteScale(sprite) {
  const scale = celebrantScaleMultiplier();
  const height = CELL * 0.72 * scale;
  sprite.scale.set(CELL * 0.56 * scale, height, 1);
  sprite.position.y = CELEBRANT_SPRITE_Y;
  sprite.position.z = isMobileView ? -height * 0.34 : 0;
}

function applyResponsiveSpriteScales() {
  state.pieces.forEach((piece) => {
    if (piece.userData.sprite) setPieceSpriteScale(piece.userData.sprite);
  });
  celebrants.forEach((celebrant) => {
    if (celebrant.userData.sprite) setCelebrantSpriteScale(celebrant.userData.sprite);
  });
}

function makeEmptyBoard() {
  return Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(0));
}

function resetGame() {
  clearTimeout(aiTimer);
  clearTimeout(victoryPromptTimer);
  manualMischiefCooldown = 0;
  manualAttackCooldown = 0;
  updateMischiefButton();
  updateAttackButton();
  updateHintButton();
  state.board = makeEmptyBoard();
  state.current = PLAYER_ORANGE;
  state.gameOver = false;
  state.aiThinking = false;
  state.scores[PLAYER_ORANGE] = 0;
  state.scores[PLAYER_BLUE] = 0;
  state.captures[PLAYER_ORANGE] = 0;
  state.captures[PLAYER_BLUE] = 0;
  state.pieces.clear();
  state.destroyed.clear();
  state.moveCount = 0;
  assignRandomCharacters();
  clearCelebration();
  clearDisturbance();
  hideVictoryPrompt();

  while (pieceRoot.children.length) {
    pieceRoot.remove(pieceRoot.children[0]);
  }
  while (effectRoot.children.length) {
    effectRoot.remove(effectRoot.children[0]);
  }
  while (disturbanceRoot.children.length) {
    disturbanceRoot.remove(disturbanceRoot.children[0]);
  }
  while (victoryRoot.children.length) {
    victoryRoot.remove(victoryRoot.children[0]);
  }
  particles.length = 0;
  planes.length = 0;
  bombs.length = 0;
  attackers.length = 0;
  animations.length = 0;
  hoverRing.visible = false;
  lastRing.material.opacity = 0;
  hideHintMarkers();
  eventText.textContent =
    state.mode === "ai"
      ? `${playerLabel(PLAYER_ORANGE)}先手`
      : `${playerLabel(PLAYER_ORANGE)} 对 ${playerLabel(PLAYER_BLUE)}`;
  updateUi();
}

function onPointerMove(event) {
  if (!canHumanPlay()) {
    hoverRing.visible = false;
    return;
  }

  const cell = pointerToCell(event);
  if (!cell || !isCellPlayable(cell.col, cell.row)) {
    hoverRing.visible = false;
    return;
  }

  const pos = boardToWorld(cell.col, cell.row);
  hoverRing.position.set(pos.x, 0.08, pos.z);
  hoverRing.material.color.set(THEME[state.current].color);
  hoverRing.visible = true;
}

function onPointerDown(event) {
  ensureAudio();
  if (!canHumanPlay()) return;
  const cell = pointerToCell(event);
  if (!cell) return;
  const moved = placeStone(cell.col, cell.row, state.current);
  if (moved && state.mode === "ai" && !state.gameOver) {
    state.aiThinking = true;
    updateUi();
    aiTimer = setTimeout(() => {
      const move = chooseAiMove();
      if (move) placeStone(move.col, move.row, PLAYER_BLUE);
      state.aiThinking = false;
      if (!state.gameOver) updateUi();
    }, 430);
  }
}

function canHumanPlay() {
  return !state.gameOver && !state.aiThinking && !(state.mode === "ai" && state.current === PLAYER_BLUE);
}

function pointerToCell(event) {
  const rect = canvas.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObject(boardPlane, false);
  if (!hits.length) return null;

  const point = hits[0].point;
  const col = Math.round(point.x / CELL + CENTER);
  const row = Math.round(point.z / CELL + CENTER);
  if (!inside(col, row)) return null;

  const snapped = boardToWorld(col, row);
  const distance = Math.hypot(snapped.x - point.x, snapped.z - point.z);
  if (distance > CELL * 0.55) return null;
  return { col, row };
}

function placeStone(col, row, player) {
  if (!isCellPlayable(col, row) || state.gameOver) return false;

  state.board[row][col] = player;
  state.moveCount += 1;

  const piece = createPiece(player, col, row);
  state.pieces.set(keyOf(col, row), piece);
  showLastMove(col, row);
  playPlaceSound(player);

  const captures = findCaptures(col, row, player);
  if (captures.length) {
    removeCaptured(captures, player);
  }

  const winCells = getWinningCells(col, row, player);
  if (winCells.length) {
    state.gameOver = true;
    state.scores[player] += 5;
    eventText.textContent = `${playerLabel(player)}五连`;
    markWinningCells(winCells);
    playWinSound(player);
    addBoardPunch(0.28, 0.08);
    startVictoryCelebration(player, winCells);
    updateUi(`${playerLabel(player)}胜利`);
    return true;
  }

  if (state.moveCount >= BOARD_SIZE * BOARD_SIZE) {
    state.gameOver = true;
    eventText.textContent = "平局";
    updateUi("平局");
    return true;
  }

  state.current = -player;
  updateUi();
  return true;
}

function createPiece(player, col, row) {
  const pos = boardToWorld(col, row);
  const group = new THREE.Group();
  group.position.set(pos.x, 0.02, pos.z);
  group.userData = { col, row, player, born: performance.now() };

  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(CELL * 0.35, 36),
    new THREE.MeshBasicMaterial({
      color: 0x2c231a,
      transparent: true,
      opacity: 0.16,
      depthWrite: false,
    }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.scale.set(1.35, 0.6, 1);
  shadow.position.y = 0.005;
  group.add(shadow);

  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: getPieceTexture(player, "normal"),
      transparent: true,
      depthWrite: false,
      alphaTest: 0.02,
    }),
  );
  sprite.position.y = PIECE_SPRITE_Y;
  setPieceSpriteScale(sprite);
  group.add(sprite);
  group.userData.sprite = sprite;

  group.scale.setScalar(0.08);
  pieceRoot.add(group);

  animations.push({
    duration: 0.38,
    age: 0,
    update(dt) {
      this.age += dt;
      const t = Math.min(this.age / this.duration, 1);
      const eased = backOut(t);
      group.scale.setScalar(eased);
      group.position.y = Math.sin(t * Math.PI) * 0.2 + 0.02;
      return t >= 1;
    },
    done() {
      group.scale.setScalar(1);
      group.position.y = 0.02;
    },
  });

  return group;
}

function findCaptures(col, row, player) {
  const enemy = -player;
  const captured = new Map();
  CAPTURE_DIRECTIONS.forEach(([dx, dy]) => {
    const c1 = col + dx;
    const r1 = row + dy;
    const c2 = col + dx * 2;
    const r2 = row + dy * 2;
    const c3 = col + dx * 3;
    const r3 = row + dy * 3;
    if (!inside(c1, r1) || !inside(c2, r2) || !inside(c3, r3)) return;
    if (state.board[r1][c1] === enemy && state.board[r2][c2] === enemy && state.board[r3][c3] === player) {
      captured.set(keyOf(c1, r1), { col: c1, row: r1 });
      captured.set(keyOf(c2, r2), { col: c2, row: r2 });
    }
  });
  return [...captured.values()];
}

function removeCaptured(cells, player) {
  state.scores[player] += cells.length;
  state.captures[player] += cells.length;
  eventText.textContent = `${playerLabel(player)} +${cells.length}`;
  addBoardPunch(0.2, 0.06);
  playCaptureSound(player);

  const center = new THREE.Vector3();
  cells.forEach(({ col, row }) => {
    state.board[row][col] = 0;
    state.moveCount -= 1;
    const piece = state.pieces.get(keyOf(col, row));
    state.pieces.delete(keyOf(col, row));
    const world = boardToWorld(col, row);
    center.add(new THREE.Vector3(world.x, CELL * 0.7, world.z));
    spawnBurst(world.x, CELL * 0.62, world.z, THEME[-player].color);
    spawnShockwave(world.x, world.z, THEME[player].color);
    if (piece) animatePieceRemoval(piece);
  });
  center.multiplyScalar(1 / cells.length);
  showFloatingText(center, `+${cells.length}`, THEME[player].color);
  updateUi();
}

function animatePieceRemoval(group) {
  group.userData.removing = true;
  animations.push({
    duration: 0.48,
    age: 0,
    update(dt) {
      this.age += dt;
      const t = Math.min(this.age / this.duration, 1);
      const wobble = Math.sin(t * Math.PI * 7) * 0.13 * (1 - t);
      group.rotation.z = wobble;
      group.position.y = 0.02 + Math.sin(t * Math.PI) * 0.42;
      group.scale.setScalar(Math.max(0.02, 1 - t * 0.94));
      group.children.forEach((child) => {
        if (child.material) child.material.opacity = 1 - t;
      });
      return t >= 1;
    },
    done() {
      pieceRoot.remove(group);
      group.traverse((child) => {
        if (child.material) child.material.dispose();
      });
    },
  });
}

function getWinningCells(col, row, player) {
  for (const [dx, dy] of DIRECTIONS) {
    const line = [{ col, row }];
    let c = col + dx;
    let r = row + dy;
    while (inside(c, r) && state.board[r][c] === player) {
      line.push({ col: c, row: r });
      c += dx;
      r += dy;
    }
    c = col - dx;
    r = row - dy;
    while (inside(c, r) && state.board[r][c] === player) {
      line.unshift({ col: c, row: r });
      c -= dx;
      r -= dy;
    }
    if (line.length >= 5) {
      const placedIndex = line.findIndex((cell) => cell.col === col && cell.row === row);
      const start = Math.max(0, Math.min(placedIndex - 2, line.length - 5));
      return line.slice(start, start + 5);
    }
  }
  return [];
}

function markWinningCells(cells) {
  cells.forEach(({ col, row }, index) => {
    const pos = boardToWorld(col, row);
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(CELL * 0.44, CELL * 0.56, 48),
      new THREE.MeshBasicMaterial({
        color: 0xf2c84b,
        transparent: true,
        opacity: 0.78,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(pos.x, 0.09 + index * 0.002, pos.z);
    effectRoot.add(ring);
    animations.push({
      duration: 1.1,
      age: -index * 0.08,
      update(dt) {
        this.age += dt;
        if (this.age < 0) return false;
        const t = (this.age % this.duration) / this.duration;
        ring.scale.setScalar(1 + Math.sin(t * Math.PI * 2) * 0.08);
        ring.material.opacity = 0.58 + Math.sin(t * Math.PI * 2) * 0.18;
        return false;
      },
    });
  });
}

function startVictoryCelebration(player, winCells) {
  clearCelebration();
  celebration.active = true;
  celebration.elapsed = 0;
  celebration.nextFirework = 0.08;
  celebration.player = player;

  makeWinnerPiecesHappy(player);
  spawnCelebrants(player, winCells);
  spawnVictoryTextFireworks(`${playerLabel(player)}胜利`, player);
  for (let i = 0; i < 4; i += 1) {
    const x = -4.2 + i * 2.8 + (Math.random() - 0.5) * 0.8;
    spawnFireworkBurst(x, 4.25 + Math.random() * 1.4, -4.2 + Math.random() * 1.4, THEME[player].color, 0.95);
  }

  clearTimeout(victoryPromptTimer);
  victoryPromptTimer = window.setTimeout(() => {
    showVictoryPrompt(player);
  }, 900);
}

function makeWinnerPiecesHappy(player) {
  state.pieces.forEach((piece) => {
    const sprite = piece.userData.sprite;
    if (!sprite) return;
    if (piece.userData.player === player) {
      piece.userData.celebrating = true;
      sprite.material.map = getPieceTexture(player, "happy");
      sprite.material.needsUpdate = true;
    } else {
      piece.userData.celebrating = false;
    }
  });
}

function spawnCelebrants(player, winCells) {
  const cells = selectCelebrationCells(winCells, 24);
  cells.forEach((cell, index) => {
    const action = CELEBRATION_ACTIONS[Math.floor(Math.random() * CELEBRATION_ACTIONS.length)];
    createCelebrant(player, cell.col, cell.row, action, index);
  });
}

function selectCelebrationCells(winCells, count) {
  const occupied = new Set([...state.pieces.keys()]);
  const candidates = new Map();
  const center = winCells.reduce(
    (sum, cell) => {
      sum.col += cell.col;
      sum.row += cell.row;
      return sum;
    },
    { col: 0, row: 0 },
  );
  center.col /= winCells.length;
  center.row /= winCells.length;

  winCells.forEach((cell) => {
    for (let dy = -5; dy <= 5; dy += 1) {
      for (let dx = -5; dx <= 5; dx += 1) {
        const col = cell.col + dx;
        const row = cell.row + dy;
        if (!inside(col, row) || occupied.has(keyOf(col, row)) || isCellDestroyed(col, row)) continue;
        const distance = Math.hypot(col - center.col, row - center.row);
        if (distance < 1.2 || distance > 5.8) continue;
        candidates.set(keyOf(col, row), { col, row, distance: distance + Math.random() * 0.85 });
      }
    }
  });

  if (candidates.size < count) {
    for (let row = 0; row < BOARD_SIZE; row += 1) {
      for (let col = 0; col < BOARD_SIZE; col += 1) {
        if (occupied.has(keyOf(col, row)) || isCellDestroyed(col, row)) continue;
        const edgeBonus = Math.min(col, row, BOARD_SIZE - 1 - col, BOARD_SIZE - 1 - row) * 0.18;
        candidates.set(keyOf(col, row), {
          col,
          row,
          distance: Math.hypot(col - center.col, row - center.row) + edgeBonus + Math.random(),
        });
      }
    }
  }

  return [...candidates.values()].sort((a, b) => a.distance - b.distance).slice(0, count);
}

function createCelebrant(player, col, row, action, index) {
  const pos = boardToWorld(col, row);
  const group = new THREE.Group();
  group.position.set(pos.x, 0.03, pos.z);

  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(CELL * 0.24, 28),
    new THREE.MeshBasicMaterial({
      color: 0x2c231a,
      transparent: true,
      opacity: 0.12,
      depthWrite: false,
    }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.scale.set(1.45, 0.62, 1);
  group.add(shadow);

  const mood = action === "daze" || action === "bump" ? "dazed" : "happy";
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: getPieceTexture(player, mood),
      transparent: true,
      depthWrite: false,
      alphaTest: 0.02,
    }),
  );
  sprite.position.y = CELEBRANT_SPRITE_Y;
  setCelebrantSpriteScale(sprite);
  group.add(sprite);
  group.scale.setScalar(0.1);
  victoryRoot.add(group);

  const data = {
    action,
    base: new THREE.Vector3(pos.x, 0.03, pos.z),
    col,
    row,
    phase: Math.random() * Math.PI * 2,
    side: index % 2 === 0 ? 1 : -1,
    sprite,
    shadow,
    player,
  };
  group.userData = data;
  celebrants.push(group);

  animations.push({
    duration: 0.32 + Math.random() * 0.25,
    age: -index * 0.018,
    update(dt) {
      this.age += dt;
      if (this.age < 0) return false;
      const t = Math.min(this.age / this.duration, 1);
      group.scale.setScalar(backOut(t) * (0.78 + Math.random() * 0.04));
      return t >= 1;
    },
  });
}

function updateCelebration(dt, time) {
  updateCelebrants(time);
  updateFireworkParticles(dt);
  updateLetterSparks(dt, time);

  if (!celebration.active) return;
  celebration.elapsed += dt;
  if (celebration.elapsed >= celebration.nextFirework) {
    const drift = Math.sin(celebration.elapsed * 1.7) * 1.2;
    spawnFireworkBurst(
      (Math.random() - 0.5) * 8 + drift,
      4.1 + Math.random() * 2,
      -4.5 + Math.random() * 1.8,
      pickFireworkColor(celebration.player),
      0.7 + Math.random() * 0.55,
    );
    celebration.nextFirework += 0.42 + Math.random() * 0.5;
  }
}

function updateCelebrants(time) {
  celebrants.forEach((group) => {
    const data = group.userData;
    const t = time + data.phase;
    const pulse = Math.sin(t * 6);
    let x = data.base.x;
    let y = data.base.y;
    let z = data.base.z;
    let rotation = 0;
    let shadowScale = 1;

    if (data.action === "jump") {
      const hop = Math.max(0, Math.sin(t * 5.6));
      y += hop * 0.55;
      rotation = Math.sin(t * 8.5) * 0.14;
      shadowScale = 1 - hop * 0.28;
    } else if (data.action === "highFive") {
      const reach = Math.max(0, Math.sin(t * 4.8));
      x += data.side * reach * 0.16;
      y += reach * 0.26;
      rotation = data.side * (0.22 + reach * 0.32);
      shadowScale = 1 - reach * 0.16;
    } else if (data.action === "daze") {
      y += Math.sin(t * 2.2) * 0.04;
      x += Math.sin(t * 3.3) * 0.035;
      rotation = Math.sin(t * 4.2) * 0.18;
    } else if (data.action === "bump") {
      const cycle = ((t * 0.43) % 1 + 1) % 1;
      if (cycle < 0.25) {
        x += data.side * cycle * 1.1;
        y += Math.sin(cycle * Math.PI * 4) * 0.12;
        rotation = data.side * cycle * 0.8;
      } else if (cycle < 0.46) {
        const fall = (cycle - 0.25) / 0.21;
        x += data.side * (0.28 - fall * 0.18);
        y += 0.05;
        rotation = data.side * (0.35 + fall * 1.05);
        shadowScale = 1.18;
      } else if (cycle < 0.66) {
        const recover = (cycle - 0.46) / 0.2;
        rotation = data.side * (1.2 * (1 - recover));
        y += recover * 0.22;
      } else {
        const hop = Math.max(0, Math.sin((cycle - 0.66) * Math.PI * 3));
        y += hop * 0.34;
        rotation = Math.sin(t * 8) * 0.12;
      }
    } else if (data.action === "spin") {
      const hop = Math.max(0, Math.sin(t * 5));
      y += hop * 0.34;
      rotation = t * data.side * 1.9;
      shadowScale = 1 - hop * 0.2;
    } else {
      y += Math.max(0, pulse) * 0.24;
      rotation = Math.sin(t * 5.5) * 0.24;
    }

    group.position.set(x, y, z);
    data.sprite.material.rotation = rotation;
    data.shadow.scale.set(1.45 * shadowScale, 0.62 * shadowScale, 1);
  });
}

function spawnFireworkBurst(x, y, z, color, scale = 1) {
  const map = getParticleTexture();
  for (let i = 0; i < 46; i += 1) {
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map,
        color,
        transparent: true,
        opacity: 0.95,
        depthWrite: false,
      }),
    );
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(Math.random() * 2 - 1);
    const speed = (0.8 + Math.random() * 2.2) * scale;
    sprite.position.set(x, y, z);
    sprite.scale.setScalar(0.055 + Math.random() * 0.09 * scale);
    victoryRoot.add(sprite);
    fireworkParticles.push({
      mesh: sprite,
      velocity: new THREE.Vector3(Math.sin(phi) * Math.cos(theta) * speed, Math.cos(phi) * speed, Math.sin(phi) * Math.sin(theta) * speed),
      age: 0,
      duration: 0.72 + Math.random() * 0.42,
      spin: (Math.random() - 0.5) * 9,
    });
  }
  playFireworkSound(scale);
}

function updateFireworkParticles(dt) {
  for (let i = fireworkParticles.length - 1; i >= 0; i -= 1) {
    const p = fireworkParticles[i];
    p.age += dt;
    const t = p.age / p.duration;
    p.velocity.y -= 1.25 * dt;
    p.mesh.position.addScaledVector(p.velocity, dt);
    p.mesh.material.opacity = Math.max(0, 1 - t);
    p.mesh.material.rotation += p.spin * dt;
    p.mesh.scale.multiplyScalar(1 + dt * 0.36);
    if (t >= 1) {
      victoryRoot.remove(p.mesh);
      p.mesh.material.dispose();
      fireworkParticles.splice(i, 1);
    }
  }
}

function spawnVictoryTextFireworks(text, player) {
  const points = createVictoryTextPoints(text);
  const map = getParticleTexture();
  const colors = [THEME[player].color, "#f2c84b", "#fff4bf", THEME[player].pale];
  spawnFireworkTextSprite(text, player);
  points.forEach((point, index) => {
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map,
        color: colors[index % colors.length],
        transparent: true,
        opacity: 0,
        depthTest: false,
        depthWrite: false,
      }),
    );
    const start = new THREE.Vector3((Math.random() - 0.5) * 1.4, 2.7 + Math.random() * 1.1, -2.7 + Math.random() * 0.8);
    const target = new THREE.Vector3((point.x - 0.5) * 7.25, 3.35 + (0.5 - point.y) * 1.35, -2.62);
    sprite.position.copy(start);
    sprite.scale.setScalar(0.07 + Math.random() * 0.045);
    victoryRoot.add(sprite);
    letterSparks.push({
      mesh: sprite,
      start,
      target,
      age: -Math.random() * 0.58,
      duration: 0.9 + Math.random() * 0.55,
      baseScale: sprite.scale.x,
      phase: Math.random() * Math.PI * 2,
    });
  });
}

function spawnFireworkTextSprite(text, player) {
  const texture = createFireworkTextTexture(text, player);
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    opacity: 0,
    depthTest: false,
    depthWrite: false,
  });
  const sprite = new THREE.Sprite(material);
  sprite.position.set(0, 2.55, 0.15);
  sprite.scale.set(7.45, 1.86, 1);
  victoryRoot.add(sprite);
  animations.push({
    duration: 0.82,
    age: 0,
    update(dt) {
      this.age += dt;
      const t = Math.min(this.age / this.duration, 1);
      const eased = easeOutCubic(t);
      material.opacity = eased * 0.92;
      sprite.scale.set(7.45 * (0.88 + eased * 0.12), 1.86 * (0.88 + eased * 0.12), 1);
      return t >= 1;
    },
  });
  animations.push({
    duration: 1,
    age: 0,
    update(dt) {
      this.age += dt;
      if (!celebration.active) return true;
      material.opacity = 0.82 + Math.sin(this.age * 5.2) * 0.1;
      sprite.position.y = 2.55 + Math.sin(this.age * 2.4) * 0.025;
      return false;
    },
  });
}

function createFireworkTextTexture(text, player) {
  const textureCanvas = document.createElement("canvas");
  textureCanvas.width = 1024;
  textureCanvas.height = 280;
  const ctx = textureCanvas.getContext("2d", { willReadFrequently: true });
  ctx.clearRect(0, 0, textureCanvas.width, textureCanvas.height);
  ctx.font = "900 126px Microsoft YaHei, SimHei, Trebuchet MS, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineWidth = 14;
  ctx.shadowColor = THEME[player].color;
  ctx.shadowBlur = 24;
  ctx.strokeStyle = "rgba(255, 247, 205, 0.95)";
  ctx.fillStyle = "#fff6bd";
  ctx.strokeText(text, textureCanvas.width / 2, textureCanvas.height / 2);
  ctx.fillText(text, textureCanvas.width / 2, textureCanvas.height / 2);

  const image = ctx.getImageData(0, 0, textureCanvas.width, textureCanvas.height);
  ctx.globalCompositeOperation = "source-atop";
  for (let i = 0; i < 1350; i += 1) {
    const x = Math.floor(Math.random() * textureCanvas.width);
    const y = Math.floor(Math.random() * textureCanvas.height);
    const alpha = image.data[(y * textureCanvas.width + x) * 4 + 3];
    if (alpha < 40) continue;
    const radius = 1.5 + Math.random() * 4.2;
    ctx.fillStyle = pickFireworkColor(player);
    ctx.globalAlpha = 0.42 + Math.random() * 0.48;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
  const texture = new THREE.CanvasTexture(textureCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function updateLetterSparks(dt, time) {
  letterSparks.forEach((spark) => {
    spark.age += dt;
    if (spark.age < 0) return;
    const t = Math.min(spark.age / spark.duration, 1);
    const eased = easeOutCubic(t);
    spark.mesh.position.lerpVectors(spark.start, spark.target, eased);
    if (t >= 1) {
      spark.mesh.position.x = spark.target.x + Math.sin(time * 2.1 + spark.phase) * 0.012;
      spark.mesh.position.y = spark.target.y + Math.cos(time * 2.8 + spark.phase) * 0.012;
    }
    spark.mesh.material.opacity = t < 1 ? eased : 0.7 + Math.sin(time * 5.5 + spark.phase) * 0.22;
    spark.mesh.scale.setScalar(spark.baseScale * (1 + Math.sin(time * 4.2 + spark.phase) * 0.18));
  });
}

function createVictoryTextPoints(text) {
  const textCanvas = document.createElement("canvas");
  textCanvas.width = 920;
  textCanvas.height = 230;
  const ctx = textCanvas.getContext("2d", { willReadFrequently: true });
  ctx.clearRect(0, 0, textCanvas.width, textCanvas.height);
  ctx.font = "900 126px Microsoft YaHei, SimHei, Trebuchet MS, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineWidth = 9;
  ctx.strokeStyle = "rgba(255,255,255,0.85)";
  ctx.fillStyle = "#ffffff";
  ctx.strokeText(text, textCanvas.width / 2, textCanvas.height / 2);
  ctx.fillText(text, textCanvas.width / 2, textCanvas.height / 2);
  const image = ctx.getImageData(0, 0, textCanvas.width, textCanvas.height);
  const points = [];
  for (let y = 18; y < textCanvas.height - 18; y += 7) {
    for (let x = 12; x < textCanvas.width - 12; x += 7) {
      const idx = (y * textCanvas.width + x) * 4 + 3;
      if (image.data[idx] > 90 && Math.random() > 0.18) {
        points.push({ x: x / textCanvas.width, y: y / textCanvas.height });
      }
    }
  }
  shuffleInPlace(points);
  return points.slice(0, 520);
}

function pickFireworkColor(player) {
  const options = [THEME[player].color, THEME[player].pale, "#f2c84b", "#fff4bf", player === PLAYER_ORANGE ? "#ff8a4f" : "#91a1ff"];
  return options[Math.floor(Math.random() * options.length)];
}

function showVictoryPrompt(player) {
  victoryTitle.textContent = `${playerLabel(player)}胜利`;
  victorySubtitle.textContent = `${playerLabel(player)}们还在庆祝，是否继续下一局？`;
  victoryPanel.classList.remove("hidden");
}

function hideVictoryPrompt() {
  victoryPanel.classList.add("hidden");
}

function clearCelebration() {
  celebration.active = false;
  celebration.elapsed = 0;
  celebration.nextFirework = 0;
  celebration.player = null;
  celebrants.length = 0;
  fireworkParticles.length = 0;
  letterSparks.length = 0;
  while (victoryRoot.children.length) {
    const child = victoryRoot.children[0];
    victoryRoot.remove(child);
    if (child.material) child.material.dispose();
    if (child.geometry) child.geometry.dispose();
  }
}

function clearDisturbance() {
  planes.length = 0;
  bombs.length = 0;
  attackers.length = 0;
  disturbance.nextAt = performance.now() * 0.001 + 16 + Math.random() * 8;
  while (disturbanceRoot.children.length) {
    const child = disturbanceRoot.children[0];
    disturbanceRoot.remove(child);
    disposeObject(child);
  }
}

function updateDisturbances(dt, time) {
  if (manualMischiefCooldown > 0) {
    manualMischiefCooldown = Math.max(0, manualMischiefCooldown - dt);
    updateMischiefButton();
  }
  if (manualAttackCooldown > 0) {
    manualAttackCooldown = Math.max(0, manualAttackCooldown - dt);
    updateAttackButton();
  }
  if (!state.gameOver && time >= disturbance.nextAt && planes.length === 0 && bombs.length < 3) {
    spawnMischiefPlane();
    disturbance.nextAt = time + 14 + Math.random() * 14;
  }
  updatePlanes(dt);
  updateBombs(dt);
  updateAttackers(dt);
}

function triggerManualMischief() {
  if (state.gameOver) {
    eventText.textContent = "棋局结束啦";
    return;
  }
  if (manualMischiefCooldown > 0) {
    eventText.textContent = "飞机还在调头";
    return;
  }
  const spawned = spawnMischiefPlane(true);
  if (spawned) {
    manualMischiefCooldown = 3.2;
    disturbance.nextAt = performance.now() * 0.001 + 12 + Math.random() * 10;
    updateMischiefButton();
  }
}

function updateMischiefButton() {
  const cooling = manualMischiefCooldown > 0;
  mischiefButton.disabled = cooling;
  mischiefButton.classList.toggle("cooling", cooling);
  mischiefButton.title = cooling ? "飞机调头中" : "捣乱";
}

function triggerAnimalAttack() {
  if (state.gameOver) {
    eventText.textContent = "棋局结束啦";
    return;
  }
  if (state.aiThinking) {
    eventText.textContent = `等${playerLabel(PLAYER_BLUE)}想完再攻击`;
    return;
  }
  if (manualAttackCooldown > 0) {
    eventText.textContent = "小动物还在集合";
    return;
  }

  const target = pickAttackTarget();
  if (!target) {
    eventText.textContent = "棋盘上还没有对方角色可赶";
    return;
  }

  startAnimalAttack(target);
  manualAttackCooldown = 3.4;
  updateAttackButton();
}

function updateAttackButton() {
  const cooling = manualAttackCooldown > 0;
  attackButton.disabled = cooling;
  attackButton.classList.toggle("cooling", cooling);
  attackButton.title = cooling ? "小动物集合中" : "攻击";
}

function pickAttackTarget() {
  const opponent = -state.current;
  const pieces = [...state.pieces.values()].filter(
    (piece) => piece.userData.player === opponent && !piece.userData.removing && !piece.userData.attacked,
  );
  if (!pieces.length) return null;
  return pieces[Math.floor(Math.random() * pieces.length)];
}

function startAnimalAttack(target) {
  const { col, row, player } = target.userData;
  const key = keyOf(col, row);
  if (!state.pieces.has(key)) return;

  const pos = boardToWorld(col, row);
  const edge = pickAttackEdge();
  const targetWorld = new THREE.Vector3(pos.x, 0.04, pos.z);
  const exitWorld = getAttackExitWorld(targetWorld, edge);
  const label = state.characters[player]?.label || "小动物";

  state.board[row][col] = 0;
  state.pieces.delete(key);
  state.moveCount = Math.max(0, state.moveCount - 1);
  target.userData.attacked = true;
  target.userData.removing = true;

  spawnAttackSquad(targetWorld, exitWorld, edge);
  animatePieceRunAway(target, exitWorld, 0.72);
  spawnShockwave(pos.x, pos.z, "#8d5fc3");
  spawnBurst(pos.x, CELL * 0.62, pos.z, "#8d5fc3");
  showFloatingText(new THREE.Vector3(pos.x, CELL * 0.8, pos.z), "快跑!", "#8d5fc3");
  addBoardPunch(0.18, isMobileView ? 0.025 : 0.05);
  playAttackSound();

  eventText.textContent = `一群小动物把${label}赶跑了`;
  updateUi();
}

function pickAttackEdge() {
  const options = [
    { axis: "z", x: -GRID_WORLD * 0.74, dx: 1, dz: 0 },
    { axis: "z", x: GRID_WORLD * 0.74, dx: -1, dz: 0 },
    { axis: "x", z: -GRID_WORLD * 0.74, dx: 0, dz: 1 },
    { axis: "x", z: GRID_WORLD * 0.74, dx: 0, dz: -1 },
  ];
  return options[Math.floor(Math.random() * options.length)];
}

function getAttackExitWorld(targetWorld, edge) {
  const exit = targetWorld.clone();
  if (edge.dx) exit.x = edge.dx * GRID_WORLD * 0.82;
  if (edge.dz) exit.z = edge.dz * GRID_WORLD * 0.82;
  return exit;
}

function spawnAttackSquad(targetWorld, exitWorld, edge) {
  const count = 7 + Math.floor(Math.random() * 3);
  const middle = (count - 1) / 2;
  const direction = new THREE.Vector3(edge.dx, 0, edge.dz);
  const perpendicular = new THREE.Vector3(edge.dz, 0, -edge.dx);
  const fanWidth = CELL * (3.2 + Math.random() * 1.2);
  for (let i = 0; i < count; i += 1) {
    const fanRatio = middle === 0 ? 0 : (i - middle) / middle;
    const offset = fanRatio * fanWidth + (Math.random() - 0.5) * CELL * 0.34;
    const start =
      edge.axis === "z"
        ? new THREE.Vector3(edge.x - edge.dx * CELL * (0.28 + Math.random() * 0.8), 0.04, targetWorld.z + offset)
        : new THREE.Vector3(targetWorld.x + offset, 0.04, edge.z - edge.dz * CELL * (0.28 + Math.random() * 0.8));
    const surround = targetWorld
      .clone()
      .addScaledVector(direction, -CELL * (0.18 + Math.random() * 0.18))
      .addScaledVector(perpendicular, offset * 0.22);
    const chase = targetWorld
      .clone()
      .addScaledVector(direction, CELL * (0.35 + Math.random() * 0.45))
      .addScaledVector(perpendicular, offset * 0.1);
    const exit = exitWorld
      .clone()
      .addScaledVector(direction, CELL * (0.18 + Math.random() * 0.9))
      .addScaledVector(perpendicular, offset * 0.2);
    start.y = 0.04;
    surround.y = 0.04;
    chase.y = 0.04;
    exit.y = 0.04;
    const group = createAttackerSprite(i);
    group.position.copy(start);
    group.visible = false;
    disturbanceRoot.add(group);
    attackers.push({
      group,
      sprite: group.userData.sprite,
      shadow: group.userData.shadow,
      start,
      surround,
      chase,
      exit,
      age: -i * 0.075 - Math.random() * 0.08,
      duration: 1.58 + Math.random() * 0.36 + i * 0.035,
      fadeAt: 0.82 + Math.random() * 0.09,
      phase: Math.random() * Math.PI * 2,
    });
  }
}

function createAttackerSprite(index) {
  const group = new THREE.Group();
  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(CELL * 0.2, 24),
    new THREE.MeshBasicMaterial({
      color: 0x2c231a,
      transparent: true,
      opacity: 0.12,
      depthWrite: false,
    }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.scale.set(1.35, 0.56, 1);
  group.add(shadow);

  const character = CHARACTER_BLUEPRINTS[Math.floor(Math.random() * CHARACTER_BLUEPRINTS.length)];
  const team = Math.random() > 0.5 ? PLAYER_ORANGE : PLAYER_BLUE;
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: getCharacterTexture(character, THEME[team], "happy", `attack:${character.id}:${team}:happy`),
      transparent: true,
      depthWrite: false,
      alphaTest: 0.02,
    }),
  );
  const scale = isMobileView ? 1.35 : 1;
  const height = CELL * 0.61 * scale;
  sprite.position.y = CELL * 0.27;
  sprite.scale.set(CELL * 0.48 * scale, height, 1);
  sprite.position.z = isMobileView ? -height * 0.34 : 0;
  sprite.material.rotation = (index % 2 === 0 ? -1 : 1) * 0.08;
  group.add(sprite);
  group.userData = { sprite, shadow };
  return group;
}

function updateAttackers(dt) {
  for (let i = attackers.length - 1; i >= 0; i -= 1) {
    const item = attackers[i];
    item.age += dt;
    if (item.age < 0) continue;
    item.group.visible = true;
    const t = Math.min(item.age / item.duration, 1);
    if (t < 0.45) {
      item.group.position.lerpVectors(item.start, item.surround, easeOutCubic(t / 0.45));
    } else if (t < 0.64) {
      item.group.position.lerpVectors(item.surround, item.chase, easeOutCubic((t - 0.45) / 0.19));
    } else {
      item.group.position.lerpVectors(item.chase, item.exit, easeOutCubic((t - 0.64) / 0.36));
    }
    const hop = Math.max(0, Math.sin((t * 5.8 + item.phase) * Math.PI));
    item.group.position.y = 0.04 + hop * CELL * 0.2;
    item.sprite.material.rotation = Math.sin(t * 16 + item.phase) * 0.16;
    item.shadow.scale.set(1.35 * (1 - hop * 0.22), 0.56 * (1 - hop * 0.12), 1);
    const fade = t < item.fadeAt ? 1 : Math.max(0, (1 - t) / (1 - item.fadeAt));
    item.sprite.material.opacity = fade;
    item.shadow.material.opacity = 0.12 * fade;
    if (t >= 1) {
      disturbanceRoot.remove(item.group);
      disposeObject(item.group);
      attackers.splice(i, 1);
    }
  }
}

function animatePieceRunAway(piece, exitWorld, delay = 0) {
  const start = piece.position.clone();
  const exit = exitWorld.clone();
  animations.push({
    duration: delay + 1.34,
    age: 0,
    update(dt) {
      this.age += dt;
      if (this.age < delay) {
        const panic = this.age / Math.max(delay, 0.001);
        piece.position.copy(start);
        piece.position.y = 0.02 + Math.max(0, Math.sin(panic * Math.PI * 6)) * 0.12;
        piece.rotation.z = Math.sin(panic * Math.PI * 12) * 0.12;
        piece.scale.setScalar(1 - Math.max(0, Math.sin(panic * Math.PI * 3)) * 0.06);
        return false;
      }
      const t = Math.min((this.age - delay) / (this.duration - delay), 1);
      const eased = easeOutCubic(t);
      piece.position.lerpVectors(start, exit, eased);
      piece.position.y = 0.02 + Math.sin(t * Math.PI) * 0.32;
      piece.rotation.z = Math.sin(t * Math.PI * 7) * 0.2 + t * 0.7;
      piece.scale.setScalar(Math.max(0.22, 1 - t * 0.2));
      piece.children.forEach((child) => {
        if (child.material) child.material.opacity = t < 0.84 ? 1 : Math.max(0, (1 - t) / 0.16);
      });
      return t >= 1;
    },
    done() {
      pieceRoot.remove(piece);
      disposeObject(piece);
    },
  });
}

function spawnMischiefPlane(manual = false) {
  const targets = pickBombTargets(1 + Math.floor(Math.random() * 2));
  if (!targets.length) return;

  const fromLeft = Math.random() > 0.5;
  const z = (Math.random() - 0.5) * GRID_WORLD * 0.82;
  const start = new THREE.Vector3(fromLeft ? -BOARD_WORLD * 0.75 : BOARD_WORLD * 0.75, 4.8, z);
  const end = new THREE.Vector3(fromLeft ? BOARD_WORLD * 0.75 : -BOARD_WORLD * 0.75, 4.8, z + (Math.random() - 0.5) * 1.5);
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: getPlaneTexture(fromLeft),
      transparent: true,
      depthWrite: false,
      depthTest: false,
    }),
  );
  sprite.position.copy(start);
  sprite.scale.set(1.65, 0.74, 1);
  disturbanceRoot.add(sprite);
  planes.push({
    mesh: sprite,
    start,
    end,
    age: 0,
    duration: 4.1 + Math.random() * 0.8,
    drops: targets.map((target, index) => ({
      target,
      time: 0.22 + index * 0.23 + Math.random() * 0.16,
      dropped: false,
    })),
  });
  eventText.textContent = manual ? "你叫来了捣乱飞机" : "捣乱飞机来了";
  return true;
}

function pickBombTargets(count) {
  const options = [];
  for (let row = 1; row < BOARD_SIZE - 1; row += 1) {
    for (let col = 1; col < BOARD_SIZE - 1; col += 1) {
      if (isCellDestroyed(col, row)) continue;
      const centerWeight = 1 / (1 + Math.hypot(col - CENTER, row - CENTER) * 0.18);
      if (Math.random() < centerWeight) options.push({ col, row });
    }
  }
  shuffleInPlace(options);
  return options.slice(0, count);
}

function updatePlanes(dt) {
  for (let i = planes.length - 1; i >= 0; i -= 1) {
    const plane = planes[i];
    plane.age += dt;
    const t = Math.min(plane.age / plane.duration, 1);
    plane.mesh.position.lerpVectors(plane.start, plane.end, easeOutCubic(t));
    plane.mesh.position.y = plane.start.y + Math.sin(t * Math.PI) * 0.38;
    plane.mesh.material.opacity = t < 0.88 ? 1 : Math.max(0, (1 - t) / 0.12);
    plane.drops.forEach((drop) => {
      if (!drop.dropped && t >= drop.time) {
        drop.dropped = true;
        spawnBomb(plane.mesh.position, drop.target);
      }
    });
    if (t >= 1) {
      disturbanceRoot.remove(plane.mesh);
      plane.mesh.material.dispose();
      planes.splice(i, 1);
    }
  }
}

function spawnBomb(startPosition, target) {
  const world = boardToWorld(target.col, target.row);
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: getBombTexture(),
      transparent: true,
      depthWrite: false,
      depthTest: false,
    }),
  );
  sprite.position.copy(startPosition);
  sprite.scale.setScalar(0.34);
  disturbanceRoot.add(sprite);
  bombs.push({
    mesh: sprite,
    start: startPosition.clone(),
    target: new THREE.Vector3(world.x, 0.1, world.z),
    cell: target,
    age: 0,
    duration: 1.05 + Math.random() * 0.35,
    spin: (Math.random() > 0.5 ? 1 : -1) * (3.5 + Math.random() * 2),
  });
  playBombWhistle();
}

function updateBombs(dt) {
  for (let i = bombs.length - 1; i >= 0; i -= 1) {
    const bomb = bombs[i];
    bomb.age += dt;
    const t = Math.min(bomb.age / bomb.duration, 1);
    bomb.mesh.position.lerpVectors(bomb.start, bomb.target, t);
    bomb.mesh.position.y = bomb.start.y * (1 - t) + bomb.target.y * t + Math.sin(t * Math.PI) * 1.75;
    bomb.mesh.material.rotation += bomb.spin * dt;
    bomb.mesh.scale.setScalar(0.28 + t * 0.2);
    if (t >= 1) {
      disturbanceRoot.remove(bomb.mesh);
      bomb.mesh.material.dispose();
      destroyBoardAt(bomb.cell.col, bomb.cell.row);
      bombs.splice(i, 1);
    }
  }
}

function destroyBoardAt(col, row) {
  const blastCells = [{ col, row }];
  shuffleInPlace([
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ]).forEach(([dx, dy], index) => {
    if (index < 2 && Math.random() > 0.42) blastCells.push({ col: col + dx, row: row + dy });
  });

  let destroyedCount = 0;
  blastCells.forEach((cell) => {
    if (!inside(cell.col, cell.row) || isCellDestroyed(cell.col, cell.row)) return;
    state.destroyed.add(keyOf(cell.col, cell.row));
    destroyedCount += 1;

    const piece = state.pieces.get(keyOf(cell.col, cell.row));
    if (piece) {
      state.board[cell.row][cell.col] = 0;
      state.pieces.delete(keyOf(cell.col, cell.row));
      state.moveCount = Math.max(0, state.moveCount - 1);
      animatePieceRemoval(piece);
    }
    addCrater(cell.col, cell.row);
  });

  const center = boardToWorld(col, row);
  spawnBlast(center.x, center.z);
  addBoardPunch(0.24, isMobileView ? 0.04 : 0.08);
  playExplosionSound();
  if (destroyedCount) {
    hoverRing.visible = false;
    eventText.textContent = `棋盘被炸坏 ${destroyedCount} 处`;
    if (!firstPlayableCell()) {
      state.gameOver = true;
      updateUi("棋盘毁坏");
    }
  }
  refreshHints();
}

function addCrater(col, row) {
  const pos = boardToWorld(col, row);
  const crater = new THREE.Mesh(
    new THREE.PlaneGeometry(CELL * 1.35, CELL * 1.35),
    new THREE.MeshBasicMaterial({
      map: getCraterTexture(),
      transparent: true,
      opacity: 0.92,
      depthWrite: false,
    }),
  );
  crater.rotation.x = -Math.PI / 2;
  crater.rotation.z = Math.random() * Math.PI * 2;
  crater.position.set(pos.x, 0.095, pos.z);
  effectRoot.add(crater);
}

function spawnBlast(x, z) {
  spawnShockwave(x, z, "#3e3126");
  spawnBurst(x, CELL * 0.72, z, "#5b4632");
  const map = getParticleTexture();
  for (let i = 0; i < 34; i += 1) {
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map,
        color: i % 3 === 0 ? "#d86b45" : "#6b5744",
        transparent: true,
        opacity: 0.9,
        depthWrite: false,
      }),
    );
    const angle = Math.random() * Math.PI * 2;
    const speed = 1 + Math.random() * 3.2;
    sprite.position.set(x, 0.55 + Math.random() * 0.35, z);
    sprite.scale.setScalar(0.07 + Math.random() * 0.1);
    effectRoot.add(sprite);
    particles.push({
      mesh: sprite,
      velocity: new THREE.Vector3(Math.cos(angle) * speed, 1.4 + Math.random() * 2.2, Math.sin(angle) * speed),
      age: 0,
      duration: 0.65 + Math.random() * 0.45,
      spin: (Math.random() - 0.5) * 10,
    });
  }
}

function chooseAiMove() {
  const candidates = getCandidateMoves();
  if (!candidates.length) return firstPlayableCell();

  let best = candidates[0];
  let bestScore = -Infinity;

  for (const move of candidates) {
    const winNow = scoreMove(move.col, move.row, PLAYER_BLUE);
    if (winNow >= 9_000_000) return move;

    const blockNow = scoreMove(move.col, move.row, PLAYER_ORANGE);
    let score = winNow + blockNow * 0.92;
    score += capturePotential(move.col, move.row, PLAYER_BLUE) * 38_000;
    score += capturePotential(move.col, move.row, PLAYER_ORANGE) * 20_000;
    score += centerBias(move.col, move.row);
    score += Math.random() * 60;

    if (score > bestScore) {
      bestScore = score;
      best = move;
    }
  }
  return best;
}

function getCandidateMoves() {
  if (state.moveCount === 0) {
    if (isCellPlayable(CENTER, CENTER)) return [{ col: CENTER, row: CENTER }];
    const first = firstPlayableCell();
    return first ? [first] : [];
  }
  const candidates = new Map();
  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      if (state.board[row][col] === 0) continue;
      for (let dy = -2; dy <= 2; dy += 1) {
        for (let dx = -2; dx <= 2; dx += 1) {
          const nextCol = col + dx;
          const nextRow = row + dy;
          if (!isCellPlayable(nextCol, nextRow)) continue;
          candidates.set(keyOf(nextCol, nextRow), { col: nextCol, row: nextRow });
        }
      }
    }
  }
  const closeMoves = [...candidates.values()];
  if (closeMoves.length) return closeMoves;
  const fallback = [];
  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      if (isCellPlayable(col, row)) fallback.push({ col, row });
    }
  }
  return fallback;
}

function scoreMove(col, row, player) {
  if (!isCellPlayable(col, row)) return -Infinity;
  state.board[row][col] = player;
  let best = 0;
  for (const [dx, dy] of DIRECTIONS) {
    const forward = countRun(col, row, dx, dy, player);
    const backward = countRun(col, row, -dx, -dy, player);
    const total = 1 + forward.count + backward.count;
    const openEnds = Number(forward.open) + Number(backward.open);
    best = Math.max(best, lineScore(total, openEnds));
  }
  state.board[row][col] = 0;
  return best;
}

function countRun(col, row, dx, dy, player) {
  let c = col + dx;
  let r = row + dy;
  let count = 0;
  while (inside(c, r) && state.board[r][c] === player) {
    count += 1;
    c += dx;
    r += dy;
  }
  return { count, open: isCellPlayable(c, r) };
}

function lineScore(total, openEnds) {
  if (total >= 5) return 10_000_000;
  if (total === 4 && openEnds === 2) return 850_000;
  if (total === 4 && openEnds === 1) return 260_000;
  if (total === 3 && openEnds === 2) return 58_000;
  if (total === 3 && openEnds === 1) return 11_000;
  if (total === 2 && openEnds === 2) return 2_800;
  if (total === 2 && openEnds === 1) return 650;
  if (total === 1 && openEnds === 2) return 80;
  return 6;
}

function capturePotential(col, row, player) {
  const enemy = -player;
  let total = 0;
  CAPTURE_DIRECTIONS.forEach(([dx, dy]) => {
    const c1 = col + dx;
    const r1 = row + dy;
    const c2 = col + dx * 2;
    const r2 = row + dy * 2;
    const c3 = col + dx * 3;
    const r3 = row + dy * 3;
    if (!inside(c1, r1) || !inside(c2, r2) || !inside(c3, r3) || isCellDestroyed(c1, r1) || isCellDestroyed(c2, r2) || isCellDestroyed(c3, r3)) return;
    if (state.board[r1][c1] === enemy && state.board[r2][c2] === enemy && state.board[r3][c3] === player) {
      total += 2;
    }
  });
  return total;
}

function centerBias(col, row) {
  const distance = Math.hypot(col - CENTER, row - CENTER);
  return Math.max(0, 18 - distance) * 9;
}

function updateUi(forcedText = "") {
  document.querySelector(".score-card.orange .score-name").textContent = playerLabel(PLAYER_ORANGE);
  document.querySelector(".score-card.blue .score-name").textContent = playerLabel(PLAYER_BLUE);
  document.querySelector(`#${THEME[PLAYER_ORANGE].score}`).textContent = String(state.scores[PLAYER_ORANGE]);
  document.querySelector(`#${THEME[PLAYER_BLUE].score}`).textContent = String(state.scores[PLAYER_BLUE]);
  document.querySelector(`#${THEME[PLAYER_ORANGE].capture}`).textContent = `吃子 ${state.captures[PLAYER_ORANGE]}`;
  document.querySelector(`#${THEME[PLAYER_BLUE].capture}`).textContent = `吃子 ${state.captures[PLAYER_BLUE]}`;

  let text = forcedText;
  if (!text) {
    if (state.aiThinking) text = `${playerLabel(PLAYER_BLUE)}思考`;
    else if (state.gameOver) text = "棋局结束";
    else text = `${playerLabel(state.current)}落子`;
  }
  turnText.textContent = text;
  turnCard.style.borderColor = state.current === PLAYER_ORANGE ? "rgba(211, 93, 56, 0.45)" : "rgba(76, 87, 168, 0.45)";
  refreshHints();
}

function updateHintButton() {
  hintButton.classList.toggle("active", hintEnabled);
  hintButton.setAttribute("aria-pressed", String(hintEnabled));
  hintButton.title = hintEnabled ? "关闭提示" : "提示";
}

function hideHintMarkers() {
  if (hintMarker) hintMarker.visible = false;
  if (dangerMarker) dangerMarker.visible = false;
  hintText.textContent = "";
  hintText.classList.add("hidden");
}

function refreshHints(announce = false) {
  if (!hintEnabled || state.gameOver) {
    hideHintMarkers();
    if (announce) {
      eventText.textContent = hintEnabled ? "棋局结束啦" : "提示已关闭";
    }
    return;
  }
  if (state.aiThinking) {
    if (hintMarker) hintMarker.visible = false;
    if (dangerMarker) dangerMarker.visible = false;
    hintText.textContent = `${playerLabel(PLAYER_BLUE)}正在思考，等它落完再推荐；${CAPTURE_RULE_TEXT}`;
    hintText.classList.remove("hidden");
    return;
  }

  const advice = getMoveAdvice(state.current);
  if (!advice || !advice.move) {
    hideHintMarkers();
    return;
  }

  placeHintMarker(hintMarker, advice.move, THEME[state.current].color);

  let text = `${playerLabel(state.current)}推荐 ${cellLabel(advice.move.col, advice.move.row)}`;
  if (advice.attackScore >= 10_000_000) {
    text += "，这一手可五连";
  } else if (advice.defenseScore >= HINT_CRITICAL_SCORE) {
    text += "，先挡住危险";
  } else if (advice.captureScore > 0) {
    text += `，可吃 ${advice.captureScore} 子`;
  }

  if (advice.danger && advice.danger.score >= HINT_DANGER_SCORE) {
    placeHintMarker(dangerMarker, advice.danger, "#e34d3e");
    const dangerLabel = cellLabel(advice.danger.col, advice.danger.row);
    if (advice.danger.score >= 10_000_000) text += `；危险 ${dangerLabel} 会被五连`;
    else if (advice.danger.score >= HINT_CRITICAL_SCORE) text += `；危险 ${dangerLabel} 必须留意`;
    else text += `；注意 ${dangerLabel} 有攻势`;
  } else if (dangerMarker) {
    dangerMarker.visible = false;
  }

  hintText.textContent = `${text}；${CAPTURE_RULE_TEXT}`;
  hintText.classList.remove("hidden");
  if (announce) {
    eventText.textContent = hintEnabled ? "提示已开启" : "提示已关闭";
  }
}

function placeHintMarker(marker, move, color) {
  if (!marker) return;
  const pos = boardToWorld(move.col, move.row);
  marker.position.set(pos.x, marker.position.y, pos.z);
  marker.material.color.set(color);
  marker.visible = true;
}

function updateHintMarkerPulse(time) {
  if (hintMarker?.visible) {
    const pulse = 1 + Math.sin(time * 5.2) * 0.06;
    hintMarker.scale.setScalar(pulse);
    hintMarker.material.opacity = 0.62 + Math.sin(time * 5.2) * 0.12;
  }
  if (dangerMarker?.visible) {
    const pulse = 1 + Math.sin(time * 7.4) * 0.09;
    dangerMarker.scale.setScalar(pulse);
    dangerMarker.material.opacity = 0.58 + Math.sin(time * 7.4) * 0.18;
  }
}

function getMoveAdvice(player) {
  const candidates = getCandidateMoves();
  if (!candidates.length) return null;

  let best = null;
  let bestScore = -Infinity;
  let danger = null;
  let dangerScore = -Infinity;

  for (const move of candidates) {
    const attackScore = scoreMove(move.col, move.row, player);
    const defenseScore = scoreMove(move.col, move.row, -player);
    const captureScore = capturePotential(move.col, move.row, player);
    const enemyCaptureScore = capturePotential(move.col, move.row, -player);
    const score =
      attackScore +
      defenseScore * 0.96 +
      captureScore * 38_000 +
      enemyCaptureScore * 16_000 +
      centerBias(move.col, move.row) +
      Math.random() * 10;

    if (score > bestScore) {
      bestScore = score;
      best = { ...move, attackScore, defenseScore, captureScore };
    }
    if (defenseScore > dangerScore) {
      dangerScore = defenseScore;
      danger = { ...move, score: defenseScore };
    }
  }

  return { ...best, move: best, danger };
}

function cellLabel(col, row) {
  return `${BOARD_LETTERS[col]}${BOARD_SIZE - row}`;
}

function showLastMove(col, row) {
  const pos = boardToWorld(col, row);
  lastRing.position.set(pos.x, 0.082, pos.z);
  lastRing.material.opacity = 0.78;
  lastRing.scale.setScalar(0.7);
  animations.push({
    duration: 0.42,
    age: 0,
    update(dt) {
      this.age += dt;
      const t = Math.min(this.age / this.duration, 1);
      lastRing.scale.setScalar(0.72 + t * 0.34);
      lastRing.material.opacity = 0.78 * (1 - t) + 0.36;
      return t >= 1;
    },
  });
}

function spawnBurst(x, y, z, color) {
  const map = getParticleTexture();
  for (let i = 0; i < 26; i += 1) {
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map,
        color,
        transparent: true,
        opacity: 0.98,
        depthWrite: false,
      }),
    );
    const angle = Math.random() * Math.PI * 2;
    const lift = 0.95 + Math.random() * 1.8;
    const speed = 1.5 + Math.random() * 2.8;
    sprite.position.set(x, y, z);
    sprite.scale.setScalar(0.075 + Math.random() * 0.12);
    effectRoot.add(sprite);
    particles.push({
      mesh: sprite,
      velocity: new THREE.Vector3(Math.cos(angle) * speed, lift, Math.sin(angle) * speed),
      age: 0,
      duration: 0.62 + Math.random() * 0.28,
      spin: (Math.random() - 0.5) * 8,
    });
  }
}

function spawnShockwave(x, z, color) {
  const wave = new THREE.Mesh(
    new THREE.RingGeometry(CELL * 0.15, CELL * 0.2, 48),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.65,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  );
  wave.rotation.x = -Math.PI / 2;
  wave.position.set(x, 0.1, z);
  effectRoot.add(wave);
  animations.push({
    duration: 0.45,
    age: 0,
    update(dt) {
      this.age += dt;
      const t = Math.min(this.age / this.duration, 1);
      wave.scale.setScalar(1 + t * 2.8);
      wave.material.opacity = 0.65 * (1 - t);
      return t >= 1;
    },
    done() {
      effectRoot.remove(wave);
      wave.geometry.dispose();
      wave.material.dispose();
    },
  });
}

function showFloatingText(world, text, color) {
  const el = document.createElement("div");
  el.className = "float-pop";
  el.textContent = text;
  el.style.color = color;
  floatingLayer.appendChild(el);
  const screen = worldToScreen(world);
  el.style.left = `${screen.x}px`;
  el.style.top = `${screen.y}px`;
  window.setTimeout(() => el.remove(), 900);
}

function worldToScreen(world) {
  const projected = world.clone().project(camera);
  return {
    x: (projected.x * 0.5 + 0.5) * window.innerWidth,
    y: (-projected.y * 0.5 + 0.5) * window.innerHeight,
  };
}

function addBoardPunch(duration, strength) {
  shake = { time: duration, duration, strength };
}

function animate(now = 0) {
  requestAnimationFrame(animate);
  const dt = Math.min(0.035, (animate.last ? now - animate.last : 16) / 1000);
  animate.last = now;

  updateAnimations(dt);
  updateParticles(dt);
  updateCelebration(dt, now * 0.001);
  updateDisturbances(dt, now * 0.001);
  updateHintMarkerPulse(now * 0.001);
  updatePieceIdle(now * 0.001);
  updateCameraShake();

  renderer.render(scene, camera);
}

function updateAnimations(dt) {
  for (let i = animations.length - 1; i >= 0; i -= 1) {
    const item = animations[i];
    const finished = item.update(dt);
    if (finished) {
      animations.splice(i, 1);
      if (item.done) item.done();
    }
  }
}

function updateParticles(dt) {
  for (let i = particles.length - 1; i >= 0; i -= 1) {
    const p = particles[i];
    p.age += dt;
    const t = p.age / p.duration;
    p.velocity.y -= 4.2 * dt;
    p.mesh.position.addScaledVector(p.velocity, dt);
    p.mesh.material.opacity = Math.max(0, 1 - t);
    p.mesh.material.rotation += p.spin * dt;
    p.mesh.scale.multiplyScalar(1 + dt * 0.55);
    if (t >= 1) {
      effectRoot.remove(p.mesh);
      p.mesh.material.dispose();
      particles.splice(i, 1);
    }
  }
}

function updatePieceIdle(time) {
  state.pieces.forEach((piece) => {
    if (piece.userData.removing) return;
    const phase = piece.userData.col * 0.7 + piece.userData.row * 0.43;
    if (piece.userData.celebrating) {
      const hop = Math.max(0, Math.sin(time * 6.2 + phase));
      piece.position.y = 0.02 + hop * 0.18;
      piece.rotation.z = Math.sin(time * 7.4 + phase) * 0.055;
      return;
    }
    piece.position.y = 0.02;
    piece.rotation.z = Math.sin(time * 1.2 + phase) * 0.018;
  });
}

function updateCameraShake() {
  if (shake.time <= 0) {
    camera.position.copy(baseCamera);
    camera.lookAt(cameraTarget);
    return;
  }
  shake.time -= 1 / 60;
  const t = Math.max(0, shake.time / shake.duration);
  const amp = shake.strength * t * t;
  if (isMobileView) {
    camera.position.set(baseCamera.x + (Math.random() - 0.5) * amp, baseCamera.y, baseCamera.z + (Math.random() - 0.5) * amp);
  } else {
    camera.position.set(
      baseCamera.x + (Math.random() - 0.5) * amp,
      baseCamera.y + (Math.random() - 0.5) * amp,
      baseCamera.z + (Math.random() - 0.5) * amp,
    );
  }
  camera.lookAt(cameraTarget);
}

function boardToWorld(col, row) {
  return {
    x: (col - CENTER) * CELL,
    z: (row - CENTER) * CELL,
  };
}

function inside(col, row) {
  return col >= 0 && row >= 0 && col < BOARD_SIZE && row < BOARD_SIZE;
}

function isCellDestroyed(col, row) {
  return inside(col, row) && state.destroyed.has(keyOf(col, row));
}

function isCellPlayable(col, row) {
  return inside(col, row) && state.board[row][col] === 0 && !isCellDestroyed(col, row);
}

function firstPlayableCell() {
  for (let radius = 0; radius < BOARD_SIZE; radius += 1) {
    for (let row = CENTER - radius; row <= CENTER + radius; row += 1) {
      for (let col = CENTER - radius; col <= CENTER + radius; col += 1) {
        if (isCellPlayable(col, row)) return { col, row };
      }
    }
  }
  return null;
}

function keyOf(col, row) {
  return `${col},${row}`;
}

function disposeObject(object) {
  object.traverse((child) => {
    if (child.geometry) child.geometry.dispose();
    if (child.material) child.material.dispose();
  });
}

function backOut(t) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function createBoardTexture() {
  const size = 1600;
  const canvasTexture = document.createElement("canvas");
  canvasTexture.width = size;
  canvasTexture.height = size;
  const ctx = canvasTexture.getContext("2d");
  const rng = mulberry32(20261001);

  ctx.fillStyle = "#f6efdf";
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 8000; i += 1) {
    const alpha = 0.018 + rng() * 0.03;
    ctx.fillStyle = rng() > 0.55 ? `rgba(95, 73, 47, ${alpha})` : `rgba(255, 255, 255, ${alpha * 1.6})`;
    ctx.fillRect(rng() * size, rng() * size, 1 + rng() * 1.6, 1 + rng() * 1.6);
  }

  const margin = (size - (GRID_WORLD / BOARD_WORLD) * size) / 2;
  const grid = size - margin * 2;
  const step = grid / (BOARD_SIZE - 1);

  ctx.save();
  ctx.translate(margin, margin);

  for (let row = 0; row < BOARD_SIZE - 1; row += 1) {
    for (let col = 0; col < BOARD_SIZE - 1; col += 1) {
      if ((row + col) % 2 === 1) continue;
      ctx.save();
      ctx.beginPath();
      ctx.rect(col * step + 4, row * step + 4, step - 8, step - 8);
      ctx.clip();
      ctx.strokeStyle = "rgba(118, 146, 97, 0.25)";
      ctx.lineWidth = 2;
      for (let y = -step; y < step * 2; y += 10) {
        roughLine(ctx, -4, y, step + 4, y + step * 0.55, "rgba(118, 146, 97, 0.24)", 2.2, rng);
      }
      ctx.restore();
    }
  }

  ctx.lineCap = "round";
  for (let i = 0; i < BOARD_SIZE; i += 1) {
    const p = i * step;
    roughLine(ctx, 0, p, grid, p, "rgba(56, 43, 31, 0.84)", 4.2, rng);
    roughLine(ctx, p, 0, p, grid, "rgba(56, 43, 31, 0.84)", 4.2, rng);
  }

  ctx.restore();

  drawCoordinateLabels(ctx, margin, grid, step, rng);
  drawSleepyDoodles(ctx, size, margin, rng);

  return new THREE.CanvasTexture(canvasTexture);
}

function drawCoordinateLabels(ctx, margin, grid, step, rng) {
  const letters = "abcdefghijklmno".split("");
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineWidth = 2;

  for (let i = 0; i < BOARD_SIZE; i += 1) {
    const x = margin + i * step + (rng() - 0.5) * 7;
    const bottom = margin + grid + 70 + (rng() - 0.5) * 7;
    const top = margin - 65 + (rng() - 0.5) * 7;
    ctx.save();
    ctx.translate(x, bottom);
    ctx.rotate((rng() - 0.5) * 0.16);
    ctx.font = "86px Comic Sans MS, Trebuchet MS, sans-serif";
    ctx.fillStyle = i % 2 === 0 ? "#b43d32" : "#4154aa";
    ctx.fillText(letters[i], 0, 0);
    ctx.restore();

    ctx.save();
    ctx.translate(x, top);
    ctx.rotate((rng() - 0.5) * 0.12);
    ctx.font = "38px Comic Sans MS, Trebuchet MS, sans-serif";
    ctx.fillStyle = "rgba(65, 84, 170, 0.4)";
    ctx.fillText(letters[i], 0, 0);
    ctx.restore();
  }

  for (let i = 0; i < BOARD_SIZE; i += 1) {
    const y = margin + grid - i * step + (rng() - 0.5) * 6;
    const left = margin - 72 + (rng() - 0.5) * 8;
    const right = margin + grid + 72 + (rng() - 0.5) * 8;
    ctx.save();
    ctx.translate(left, y);
    ctx.rotate((rng() - 0.5) * 0.18);
    ctx.font = "55px Comic Sans MS, Trebuchet MS, sans-serif";
    ctx.fillStyle = i % 2 === 0 ? "#b43d32" : "#4154aa";
    ctx.fillText(String(i + 1), 0, 0);
    ctx.restore();

    ctx.save();
    ctx.translate(right, y);
    ctx.rotate((rng() - 0.5) * 0.12);
    ctx.font = "34px Comic Sans MS, Trebuchet MS, sans-serif";
    ctx.fillStyle = "rgba(112, 85, 60, 0.32)";
    ctx.fillText(String(i + 1), 0, 0);
    ctx.restore();
  }
}

function drawSleepyDoodles(ctx, size, margin, rng) {
  const spots = [
    [margin - 92, margin - 76],
    [size - margin + 92, margin - 72],
    [margin - 104, size - margin + 86],
    [size - margin + 96, size - margin + 88],
  ];

  spots.forEach(([x, y], index) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((rng() - 0.5) * 0.2);
    ctx.strokeStyle = "rgba(84, 66, 43, 0.72)";
    ctx.fillStyle = index % 2 ? "rgba(255, 255, 255, 0.32)" : "rgba(244, 223, 188, 0.35)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(0, 0, 48, 33, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    roughLine(ctx, -20, -3, -7, 7, "rgba(84, 66, 43, 0.72)", 2.2, rng);
    roughLine(ctx, 7, 7, 20, -3, "rgba(84, 66, 43, 0.72)", 2.2, rng);
    ctx.beginPath();
    ctx.arc(0, 10, 16, 0, Math.PI);
    ctx.stroke();
    ctx.font = "31px Comic Sans MS, Trebuchet MS, sans-serif";
    ctx.fillStyle = "rgba(84, 66, 43, 0.72)";
    ctx.fillText("z", 42, -30);
    ctx.fillText("z", 62, -50);
    ctx.restore();
  });
}

function createPaperTexture(width, height, opacity) {
  const paper = document.createElement("canvas");
  paper.width = width;
  paper.height = height;
  const ctx = paper.getContext("2d");
  const rng = mulberry32(481516);
  ctx.fillStyle = "#f2e8d4";
  ctx.fillRect(0, 0, width, height);
  for (let i = 0; i < 12000; i += 1) {
    const shade = rng() > 0.5 ? 0 : 255;
    ctx.fillStyle = `rgba(${shade}, ${shade}, ${shade}, ${opacity * rng()})`;
    ctx.fillRect(rng() * width, rng() * height, 1 + rng() * 2, 1 + rng() * 2);
  }
  return new THREE.CanvasTexture(paper);
}

function assignRandomCharacters() {
  const pool = [...CHARACTER_BLUEPRINTS];
  shuffleInPlace(pool);
  state.characters[PLAYER_ORANGE] = pool[0];
  state.characters[PLAYER_BLUE] = pool[1];
}

function playerLabel(player) {
  return state.characters[player]?.label || THEME[player].name;
}

function getPieceTexture(player, mood = "normal") {
  const character = state.characters[player] || CHARACTER_BLUEPRINTS[player === PLAYER_ORANGE ? 0 : 1];
  const cacheKey = `piece:${character.id}:${player}:${mood}`;
  return getCharacterTexture(character, THEME[player], mood, cacheKey);
}

function getCharacterTexture(character, theme, mood, cacheKey) {
  if (textureCache.has(cacheKey)) return textureCache.get(cacheKey);

  const textureCanvas = document.createElement("canvas");
  textureCanvas.width = 384;
  textureCanvas.height = 448;
  const ctx = textureCanvas.getContext("2d");
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  drawCharacter(ctx, character, theme, mood);

  const texture = new THREE.CanvasTexture(textureCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache.set(cacheKey, texture);
  return texture;
}

function drawCharacter(ctx, character, theme, mood) {
  const body = character.body;
  const accent = character.accent;
  const ink = character.ink;
  const team = theme.color;
  ctx.save();
  ctx.translate(192, 252);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.fillStyle = "rgba(55, 43, 30, 0.15)";
  ctx.beginPath();
  ctx.ellipse(0, 142, 86, 18, 0, 0, Math.PI * 2);
  ctx.fill();

  drawCelebrationArms(ctx, ink, team, mood);

  if (character.kind === "mushroom") drawMushroomCharacter(ctx, body, team, ink, mood);
  else if (character.kind === "owl") drawOwlCharacter(ctx, body, accent, ink, mood);
  else if (character.kind === "cat") drawCatCharacter(ctx, body, accent, ink, mood);
  else if (character.kind === "sprout") drawSproutCharacter(ctx, body, accent, ink, mood);
  else if (character.kind === "cactus") drawCactusCharacter(ctx, body, accent, ink, mood);
  else if (character.kind === "fox") drawFoxCharacter(ctx, body, accent, ink, mood);
  else if (character.kind === "rabbit") drawRabbitCharacter(ctx, body, accent, ink, mood);
  else if (character.kind === "flower") drawFlowerCharacter(ctx, body, accent, ink, mood);
  else if (character.kind === "bee") drawBeeCharacter(ctx, body, accent, ink, mood);
  else drawPenguinCharacter(ctx, body, accent, ink, mood);

  drawTeamRibbon(ctx, team, ink);
  if (mood === "happy") drawConfettiMarks(ctx, team);
  ctx.restore();
}

function drawMushroomCharacter(ctx, body, accent, ink, mood) {
  ctx.fillStyle = body;
  ctx.strokeStyle = ink;
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.roundRect(-74, -60, 148, 180, 58);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.moveTo(-118, -68);
  ctx.bezierCurveTo(-102, -145, -44, -181, 18, -176);
  ctx.bezierCurveTo(88, -168, 121, -124, 116, -62);
  ctx.quadraticCurveTo(8, -34, -118, -68);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#ffe9c2";
  [
    [-68, -87, 14],
    [-26, -126, 18],
    [35, -113, 13],
    [77, -75, 15],
    [9, -60, 11],
  ].forEach(([x, y, r]) => {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  });
  drawMoodFace(ctx, mood, ink, "#d65c43", 10);
  drawTinyLegs(ctx, ink);
}

function drawOwlCharacter(ctx, body, accent, ink, mood) {
  ctx.fillStyle = body;
  ctx.strokeStyle = ink;
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(-92, 116);
  ctx.bezierCurveTo(-126, 20, -86, -116, 0, -146);
  ctx.bezierCurveTo(90, -116, 124, 18, 92, 116);
  ctx.quadraticCurveTo(0, 154, -92, 116);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.moveTo(0, 27);
  ctx.lineTo(-14, 1);
  ctx.lineTo(14, 1);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#fff8dd";
  ctx.beginPath();
  ctx.ellipse(-35, -21, 38, 45, -0.14, 0, Math.PI * 2);
  ctx.ellipse(35, -21, 38, 45, 0.14, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  drawMoodFace(ctx, mood, "#202546", "#d46d84", -7);
  drawFeatherLines(ctx, "rgba(255,248,221,0.38)");
  drawTinyLegs(ctx, ink);
}

function drawCatCharacter(ctx, body, accent, ink, mood) {
  ctx.fillStyle = body;
  ctx.strokeStyle = ink;
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(-78, -46);
  ctx.lineTo(-106, -128);
  ctx.lineTo(-37, -90);
  ctx.lineTo(0, -108);
  ctx.lineTo(37, -90);
  ctx.lineTo(106, -128);
  ctx.lineTo(78, -46);
  ctx.quadraticCurveTo(100, 68, 58, 121);
  ctx.quadraticCurveTo(0, 156, -58, 121);
  ctx.quadraticCurveTo(-100, 68, -78, -46);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.ellipse(0, 55, 55, 48, 0, 0, Math.PI * 2);
  ctx.fill();
  drawWhiskers(ctx, ink);
  drawMoodFace(ctx, mood, ink, "#d66f77", 7);
  drawTinyLegs(ctx, ink);
}

function drawSproutCharacter(ctx, body, accent, ink, mood) {
  ctx.fillStyle = "#efe0b5";
  ctx.strokeStyle = ink;
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.roundRect(-68, -35, 136, 158, 45);
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = accent;
  ctx.lineWidth = 11;
  roughLine(ctx, 0, -35, 0, -132, accent, 10, Math.random);
  ctx.fillStyle = body;
  ctx.strokeStyle = ink;
  ctx.beginPath();
  ctx.ellipse(-38, -126, 54, 27, -0.48, 0, Math.PI * 2);
  ctx.ellipse(38, -126, 54, 27, 0.48, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  drawMoodFace(ctx, mood, ink, "#df845f", 18);
  drawTinyLegs(ctx, ink);
}

function drawCactusCharacter(ctx, body, accent, ink, mood) {
  ctx.fillStyle = body;
  ctx.strokeStyle = ink;
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.roundRect(-56, -122, 112, 240, 55);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.roundRect(-112, -45, 56, 92, 28);
  ctx.roundRect(56, -68, 56, 110, 28);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.arc(3, -144, 18, 0, Math.PI * 2);
  ctx.fill();
  drawMoodFace(ctx, mood, "#263922", "#e6908e", 8);
  drawTinyLegs(ctx, ink);
}

function drawFoxCharacter(ctx, body, accent, ink, mood) {
  ctx.fillStyle = body;
  ctx.strokeStyle = ink;
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(-96, -120);
  ctx.lineTo(-45, -72);
  ctx.quadraticCurveTo(0, -102, 45, -72);
  ctx.lineTo(96, -120);
  ctx.quadraticCurveTo(78, 12, 78, 50);
  ctx.quadraticCurveTo(76, 132, 0, 145);
  ctx.quadraticCurveTo(-76, 132, -78, 50);
  ctx.quadraticCurveTo(-78, 12, -96, -120);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.moveTo(-64, 10);
  ctx.quadraticCurveTo(0, 92, 64, 10);
  ctx.quadraticCurveTo(42, 124, 0, 132);
  ctx.quadraticCurveTo(-42, 124, -64, 10);
  ctx.fill();
  drawMoodFace(ctx, mood, ink, "#e98a73", 8);
  drawTinyLegs(ctx, ink);
}

function drawRabbitCharacter(ctx, body, accent, ink, mood) {
  ctx.fillStyle = body;
  ctx.strokeStyle = ink;
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.ellipse(-36, -118, 29, 75, -0.2, 0, Math.PI * 2);
  ctx.ellipse(36, -118, 29, 75, 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.ellipse(-36, -118, 12, 48, -0.2, 0, Math.PI * 2);
  ctx.ellipse(36, -118, 12, 48, 0.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.roundRect(-74, -48, 148, 170, 64);
  ctx.fill();
  ctx.stroke();
  drawMoodFace(ctx, mood, ink, "#ee9cab", 10);
  drawTinyLegs(ctx, ink);
}

function drawFlowerCharacter(ctx, body, accent, ink, mood) {
  ctx.strokeStyle = ink;
  ctx.lineWidth = 8;
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.roundRect(-42, -5, 84, 127, 38);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.ellipse(-55, 40, 42, 18, -0.4, 0, Math.PI * 2);
  ctx.ellipse(55, 40, 42, 18, 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = accent;
  for (let i = 0; i < 8; i += 1) {
    const angle = (Math.PI * 2 * i) / 8;
    ctx.beginPath();
    ctx.ellipse(Math.cos(angle) * 48, -82 + Math.sin(angle) * 42, 26, 42, angle, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.fillStyle = "#ffe48d";
  ctx.beginPath();
  ctx.arc(0, -82, 43, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  drawMoodFace(ctx, mood, ink, "#e98a73", -80);
  drawTinyLegs(ctx, ink);
}

function drawBeeCharacter(ctx, body, accent, ink, mood) {
  ctx.fillStyle = "rgba(224,242,255,0.66)";
  ctx.strokeStyle = ink;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.ellipse(-62, -64, 39, 58, -0.62, 0, Math.PI * 2);
  ctx.ellipse(62, -64, 39, 58, 0.62, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = body;
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.roundRect(-74, -78, 148, 194, 72);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = accent;
  [-38, 10, 58].forEach((y) => {
    ctx.beginPath();
    ctx.roundRect(-70, y, 140, 24, 12);
    ctx.fill();
  });
  drawMoodFace(ctx, mood, "#3d2b20", "#dd7c56", -12);
  drawTinyLegs(ctx, ink);
}

function drawPenguinCharacter(ctx, body, accent, ink, mood) {
  ctx.fillStyle = body;
  ctx.strokeStyle = ink;
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.ellipse(0, 0, 88, 137, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.ellipse(0, 28, 56, 86, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#e3b947";
  ctx.beginPath();
  ctx.moveTo(0, -8);
  ctx.lineTo(-15, -31);
  ctx.lineTo(15, -31);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  drawMoodFace(ctx, mood, "#202546", "#d46d84", -38);
  drawTinyLegs(ctx, ink);
}

function drawMoodFace(ctx, mood, eyeColor, blushColor, y = 0) {
  ctx.save();
  ctx.translate(0, y);
  ctx.strokeStyle = eyeColor;
  ctx.fillStyle = eyeColor;
  ctx.lineWidth = 6;

  if (mood === "happy") {
    ctx.beginPath();
    ctx.arc(-34, -2, 13, 0.06 * Math.PI, 0.94 * Math.PI);
    ctx.arc(34, -2, 13, 0.06 * Math.PI, 0.94 * Math.PI);
    ctx.stroke();
    ctx.fillStyle = "#7f2f36";
    ctx.beginPath();
    ctx.ellipse(0, 27, 18, 22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffd9df";
    ctx.beginPath();
    ctx.ellipse(0, 36, 11, 6, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (mood === "dazed") {
    drawSpiralEye(ctx, -34, -2, eyeColor);
    drawSpiralEye(ctx, 34, -2, eyeColor);
    ctx.beginPath();
    ctx.arc(0, 28, 13, Math.PI, Math.PI * 2);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.arc(-34, -1, 8, 0, Math.PI * 2);
    ctx.arc(34, -1, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(-37, -5, 3, 0, Math.PI * 2);
    ctx.arc(31, -5, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = eyeColor;
    ctx.beginPath();
    ctx.arc(0, 18, 16, 0.08 * Math.PI, 0.92 * Math.PI);
    ctx.stroke();
  }

  ctx.fillStyle = blushColor;
  ctx.globalAlpha = 0.55;
  ctx.beginPath();
  ctx.ellipse(-58, 24, 18, 10, -0.1, 0, Math.PI * 2);
  ctx.ellipse(58, 24, 18, 10, 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawSpiralEye(ctx, x, y, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.beginPath();
  for (let i = 0; i < 18; i += 1) {
    const r = 1.2 + i * 0.72;
    const a = i * 0.75;
    const px = Math.cos(a) * r;
    const py = Math.sin(a) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();
  ctx.restore();
}

function drawCelebrationArms(ctx, ink, team, mood) {
  ctx.strokeStyle = ink;
  ctx.lineWidth = 8;
  if (mood === "happy") {
    roughLine(ctx, -70, 18, -122, -50, ink, 8, Math.random);
    roughLine(ctx, 70, 18, 122, -50, ink, 8, Math.random);
    ctx.fillStyle = team;
    ctx.beginPath();
    ctx.arc(-125, -53, 10, 0, Math.PI * 2);
    ctx.arc(125, -53, 10, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  roughLine(ctx, -70, 38, -116, 52, ink, 7, Math.random);
  roughLine(ctx, 70, 38, 116, 52, ink, 7, Math.random);
}

function drawTeamRibbon(ctx, team, ink) {
  ctx.fillStyle = team;
  ctx.strokeStyle = ink;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.roundRect(-48, 84, 96, 23, 11);
  ctx.fill();
  ctx.stroke();
}

function drawConfettiMarks(ctx, team) {
  ctx.strokeStyle = team;
  ctx.lineWidth = 5;
  [
    [-118, -154, -105, -174],
    [112, -150, 128, -170],
    [-145, -11, -166, -2],
    [145, -18, 166, -10],
  ].forEach(([x1, y1, x2, y2]) => roughLine(ctx, x1, y1, x2, y2, team, 4, Math.random));
}

function drawWhiskers(ctx, ink) {
  roughLine(ctx, -43, 18, -94, 4, ink, 3.8, Math.random);
  roughLine(ctx, -43, 30, -98, 32, ink, 3.8, Math.random);
  roughLine(ctx, 43, 18, 94, 4, ink, 3.8, Math.random);
  roughLine(ctx, 43, 30, 98, 32, ink, 3.8, Math.random);
}

function drawFeatherLines(ctx, color) {
  for (let y = 42; y < 105; y += 22) {
    roughLine(ctx, -52, y, 52, y + 7, color, 3, Math.random);
  }
}

function drawOrangeMascot(ctx) {
  ctx.save();
  ctx.translate(192, 254);
  ctx.fillStyle = "rgba(107, 69, 32, 0.15)";
  ctx.beginPath();
  ctx.ellipse(0, 142, 86, 18, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#f6bb5f";
  ctx.strokeStyle = "#943e27";
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.roundRect(-76, -70, 152, 190, 58);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#d96b49";
  ctx.strokeStyle = "#943e27";
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(-116, -72);
  ctx.bezierCurveTo(-104, -145, -45, -184, 20, -176);
  ctx.bezierCurveTo(86, -168, 120, -128, 118, -64);
  ctx.quadraticCurveTo(8, -34, -116, -72);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#ffe9c2";
  [
    [-68, -88, 15],
    [-26, -126, 18],
    [35, -117, 14],
    [78, -76, 16],
    [9, -61, 12],
  ].forEach(([x, y, r]) => {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.fillStyle = "#fff8dd";
  ctx.beginPath();
  ctx.ellipse(-27, 5, 38, 46, -0.12, 0, Math.PI * 2);
  ctx.ellipse(37, 8, 38, 46, 0.12, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#943e27";
  ctx.lineWidth = 5;
  ctx.stroke();

  drawFace(ctx, "#3b2d24", "#d65c43");
  drawTinyLegs(ctx, "#943e27");
  ctx.restore();
}

function drawBlueMascot(ctx) {
  ctx.save();
  ctx.translate(192, 252);
  ctx.fillStyle = "rgba(39, 47, 95, 0.16)";
  ctx.beginPath();
  ctx.ellipse(0, 142, 86, 18, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#5361b5";
  ctx.strokeStyle = "#25326f";
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(-92, 118);
  ctx.bezierCurveTo(-126, 20, -86, -116, 0, -146);
  ctx.bezierCurveTo(90, -116, 124, 18, 92, 118);
  ctx.quadraticCurveTo(0, 154, -92, 118);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#6979c9";
  ctx.strokeStyle = "#25326f";
  ctx.lineWidth = 5;
  for (let i = -3; i <= 3; i += 1) {
    ctx.beginPath();
    ctx.moveTo(i * 27, -120);
    ctx.lineTo(i * 18, -169 - Math.abs(i) * 4);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(i * 18, -169 - Math.abs(i) * 4, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  ctx.fillStyle = "#fff8dd";
  ctx.beginPath();
  ctx.ellipse(-33, -18, 39, 45, -0.14, 0, Math.PI * 2);
  ctx.ellipse(33, -18, 39, 45, 0.14, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#25326f";
  ctx.lineWidth = 5;
  ctx.stroke();

  ctx.fillStyle = "#e3b947";
  ctx.beginPath();
  ctx.moveTo(0, 20);
  ctx.lineTo(-14, -3);
  ctx.lineTo(14, -3);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  drawFace(ctx, "#202546", "#d46d84");

  ctx.strokeStyle = "rgba(255, 248, 221, 0.55)";
  ctx.lineWidth = 4;
  for (let y = 44; y < 105; y += 22) {
    roughLine(ctx, -52, y, 52, y + 7, "rgba(255, 248, 221, 0.38)", 3, Math.random);
  }
  drawTinyLegs(ctx, "#25326f");
  ctx.restore();
}

function drawFace(ctx, eyeColor, blushColor) {
  ctx.fillStyle = eyeColor;
  ctx.beginPath();
  ctx.arc(-34, 1, 8, 0, Math.PI * 2);
  ctx.arc(34, 1, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(-37, -3, 3, 0, Math.PI * 2);
  ctx.arc(31, -3, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = eyeColor;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(0, 15, 16, 0.08 * Math.PI, 0.92 * Math.PI);
  ctx.stroke();
  ctx.fillStyle = blushColor;
  ctx.globalAlpha = 0.58;
  ctx.beginPath();
  ctx.ellipse(-59, 24, 18, 10, -0.1, 0, Math.PI * 2);
  ctx.ellipse(59, 24, 18, 10, 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

function drawTinyLegs(ctx, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 8;
  roughLine(ctx, -31, 116, -42, 140, color, 8, Math.random);
  roughLine(ctx, 31, 116, 42, 140, color, 8, Math.random);
  roughLine(ctx, -51, 140, -28, 140, color, 7, Math.random);
  roughLine(ctx, 28, 140, 51, 140, color, 7, Math.random);
}

function getParticleTexture() {
  const cacheKey = "particle";
  if (textureCache.has(cacheKey)) return textureCache.get(cacheKey);
  const p = document.createElement("canvas");
  p.width = 96;
  p.height = 96;
  const ctx = p.getContext("2d");
  const gradient = ctx.createRadialGradient(48, 48, 2, 48, 48, 46);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.38, "rgba(255,255,255,0.85)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(48, 48, 46, 0, Math.PI * 2);
  ctx.fill();
  const texture = new THREE.CanvasTexture(p);
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache.set(cacheKey, texture);
  return texture;
}

function getPlaneTexture(fromLeft) {
  const cacheKey = `plane:${fromLeft ? "right" : "left"}`;
  if (textureCache.has(cacheKey)) return textureCache.get(cacheKey);
  const p = document.createElement("canvas");
  p.width = 360;
  p.height = 170;
  const ctx = p.getContext("2d");
  ctx.save();
  if (!fromLeft) {
    ctx.translate(p.width, 0);
    ctx.scale(-1, 1);
  }
  ctx.translate(22, 0);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = "#4f3b2b";
  ctx.lineWidth = 8;
  ctx.fillStyle = "#f5ead4";
  ctx.beginPath();
  ctx.moveTo(38, 90);
  ctx.quadraticCurveTo(145, 38, 292, 78);
  ctx.quadraticCurveTo(319, 86, 294, 99);
  ctx.quadraticCurveTo(158, 139, 39, 104);
  ctx.quadraticCurveTo(10, 96, 38, 90);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#d75f3f";
  ctx.beginPath();
  ctx.moveTo(146, 79);
  ctx.lineTo(207, 25);
  ctx.lineTo(224, 74);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#5967ba";
  ctx.beginPath();
  ctx.moveTo(142, 102);
  ctx.lineTo(219, 146);
  ctx.lineTo(205, 98);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#f2c84b";
  ctx.beginPath();
  ctx.moveTo(31, 91);
  ctx.lineTo(4, 63);
  ctx.lineTo(54, 84);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#cfe3ff";
  for (let i = 0; i < 4; i += 1) {
    ctx.beginPath();
    ctx.ellipse(112 + i * 33, 83, 12, 9, -0.08, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.font = "900 28px Comic Sans MS, Trebuchet MS, sans-serif";
  ctx.fillStyle = "#4f3b2b";
  ctx.fillText("!", 253, 94);
  ctx.restore();
  const texture = new THREE.CanvasTexture(p);
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache.set(cacheKey, texture);
  return texture;
}

function getBombTexture() {
  const cacheKey = "bomb";
  if (textureCache.has(cacheKey)) return textureCache.get(cacheKey);
  const b = document.createElement("canvas");
  b.width = 128;
  b.height = 128;
  const ctx = b.getContext("2d");
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.fillStyle = "rgba(42, 33, 24, 0.2)";
  ctx.beginPath();
  ctx.ellipse(65, 84, 31, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#2f2a27";
  ctx.strokeStyle = "#17120f";
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.ellipse(62, 67, 31, 39, -0.25, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#f6e7b7";
  ctx.beginPath();
  ctx.ellipse(49, 52, 9, 14, -0.25, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#8b3f2f";
  ctx.lineWidth = 6;
  roughLine(ctx, 80, 34, 101, 18, "#8b3f2f", 6, Math.random);
  ctx.fillStyle = "#f2c84b";
  ctx.beginPath();
  ctx.moveTo(103, 12);
  ctx.lineTo(115, 22);
  ctx.lineTo(101, 28);
  ctx.lineTo(96, 17);
  ctx.closePath();
  ctx.fill();
  const texture = new THREE.CanvasTexture(b);
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache.set(cacheKey, texture);
  return texture;
}

function getCraterTexture() {
  const cacheKey = "crater";
  if (textureCache.has(cacheKey)) return textureCache.get(cacheKey);
  const c = document.createElement("canvas");
  c.width = 180;
  c.height = 180;
  const ctx = c.getContext("2d");
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const gradient = ctx.createRadialGradient(90, 90, 6, 90, 90, 78);
  gradient.addColorStop(0, "rgba(38, 29, 22, 0.92)");
  gradient.addColorStop(0.45, "rgba(76, 55, 37, 0.72)");
  gradient.addColorStop(0.78, "rgba(131, 93, 55, 0.35)");
  gradient.addColorStop(1, "rgba(131, 93, 55, 0)");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.ellipse(90, 92, 66, 45, -0.08, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(49, 36, 27, 0.7)";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.ellipse(90, 92, 55, 34, -0.08, 0, Math.PI * 2);
  ctx.stroke();
  [
    [42, 76, 10, 57],
    [63, 121, 31, 147],
    [115, 65, 154, 44],
    [126, 112, 161, 133],
    [88, 52, 84, 18],
  ].forEach(([x1, y1, x2, y2]) => roughLine(ctx, x1, y1, x2, y2, "rgba(62, 44, 31, 0.62)", 4, Math.random));
  const texture = new THREE.CanvasTexture(c);
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache.set(cacheKey, texture);
  return texture;
}

function roughLine(ctx, x1, y1, x2, y2, color, width, rng) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  for (let pass = 0; pass < 2; pass += 1) {
    ctx.beginPath();
    ctx.moveTo(x1 + (rng() - 0.5) * 5, y1 + (rng() - 0.5) * 5);
    const mx = (x1 + x2) / 2 + (rng() - 0.5) * 14;
    const my = (y1 + y2) / 2 + (rng() - 0.5) * 14;
    ctx.quadraticCurveTo(mx, my, x2 + (rng() - 0.5) * 5, y2 + (rng() - 0.5) * 5);
    ctx.stroke();
  }
  ctx.restore();
}

function mulberry32(seed) {
  return function random() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleInPlace(items) {
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

function ensureAudio() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioContext.state === "suspended") {
    audioContext.resume();
  }
}

function playPlaceSound(player) {
  if (!soundEnabled) return;
  ensureAudio();
  const base = player === PLAYER_ORANGE ? 390 : 310;
  playTone(base, "triangle", 0.07, 0.08);
  playTone(base * 1.5, "sine", 0.11, 0.035, 0.03);
}

function playCaptureSound(player) {
  if (!soundEnabled) return;
  ensureAudio();
  playNoise(0.18, 0.16);
  playTone(player === PLAYER_ORANGE ? 155 : 132, "sawtooth", 0.12, 0.05);
  playTone(player === PLAYER_ORANGE ? 620 : 540, "square", 0.06, 0.035, 0.03);
}

function playFireworkSound(scale = 1) {
  if (!soundEnabled || !audioContext) return;
  playNoise(0.09, 0.035 * scale);
  playTone(740 + Math.random() * 420, "sine", 0.08, 0.018 * scale, 0.02);
}

function playBombWhistle() {
  if (!soundEnabled || !audioContext) return;
  playTone(880 + Math.random() * 180, "sine", 0.16, 0.018, 0);
  playTone(520 + Math.random() * 120, "triangle", 0.18, 0.014, 0.08);
}

function playExplosionSound() {
  if (!soundEnabled) return;
  ensureAudio();
  playNoise(0.28, 0.22);
  playTone(96, "sawtooth", 0.18, 0.09);
  playTone(164, "square", 0.09, 0.035, 0.04);
}

function playAttackSound() {
  if (!soundEnabled) return;
  ensureAudio();
  playNoise(0.13, 0.12);
  playTone(520, "triangle", 0.07, 0.045);
  playTone(310, "square", 0.08, 0.028, 0.05);
  playTone(690, "sine", 0.06, 0.024, 0.11);
}

function playWinSound(player) {
  if (!soundEnabled) return;
  ensureAudio();
  const notes = player === PLAYER_ORANGE ? [392, 494, 587, 784] : [330, 415, 554, 660];
  notes.forEach((freq, index) => playTone(freq, "triangle", 0.18, 0.07, index * 0.09));
}

function playTapSound() {
  if (!soundEnabled || !audioContext) return;
  playTone(260, "sine", 0.05, 0.035);
}

function playTone(freq, type, duration, gainValue, delay = 0) {
  const start = audioContext.currentTime + delay;
  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(gainValue, start + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain);
  gain.connect(audioContext.destination);
  osc.start(start);
  osc.stop(start + duration + 0.03);
}

function playNoise(duration, gainValue) {
  const sampleRate = audioContext.sampleRate;
  const bufferSize = Math.floor(sampleRate * duration);
  const buffer = audioContext.createBuffer(1, bufferSize, sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i += 1) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2.4);
  }
  const source = audioContext.createBufferSource();
  const gain = audioContext.createGain();
  const filter = audioContext.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 800;
  filter.Q.value = 0.9;
  gain.gain.value = gainValue;
  source.buffer = buffer;
  source.connect(filter);
  filter.connect(gain);
  gain.connect(audioContext.destination);
  source.start();
}
