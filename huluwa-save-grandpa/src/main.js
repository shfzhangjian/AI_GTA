import { GameAudio } from './game/audio.js';
import { GameScene } from './game/scene.js';
import { GameState } from './game/state.js';
import { GameUI } from './game/ui.js';

const canvas = document.querySelector('#game-canvas');
const state = new GameState();
const audio = new GameAudio();
const scene = new GameScene(canvas, state);
const ui = new GameUI(state, {
  onStart: () => {
    void audio.unlock();
    scene.prepareLevel();
    state.start();
  },
  onRestart: () => {
    void audio.unlock();
    state.reset();
    scene.prepareLevel();
    state.start();
  },
  onPause: () => state.togglePause(),
  onToggleSound: () => audio.toggle(),
  isSoundEnabled: () => audio.enabled,
  onUpgrade: (id) => state.upgrade(id),
  onUnlockSkill: (id) => state.unlockSkill(id),
  onCastSkill: (id) => state.useSkill(id),
});

scene.attachLog((message) => ui.pushLog(message));
scene.attachSound((name) => audio.play(name));
audio.bindState(state);
scene.start();
ui.start();
