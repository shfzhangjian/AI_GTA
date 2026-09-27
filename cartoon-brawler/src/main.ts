/** Entry point: boot sequence, loading screen, start button. */
import { Game } from './core/Game';


const loadingScreen = document.getElementById('loading-screen')!;
const bar = document.getElementById('loading-bar')!;
const pct = document.getElementById('loading-pct')!;
const startBtn = document.getElementById('start-btn')!;

async function main(): Promise<void> {
  const host = document.getElementById('app')!;
  const game = new Game(host);
  (window as unknown as { game: Game }).game = game; // debug console access

  try {
    await game.boot((f, label) => {
      bar.style.width = `${Math.round(f * 100)}%`;
      pct.textContent = `Loading ${Math.round(f * 100)}% — ${label}`;
    });
  } catch (err) {
    console.error('[boot] fatal', err);
    pct.textContent = 'Boot failed — see console';
    return;
  }

  bar.style.width = '100%';
  pct.textContent = 'Ready';
  startBtn.style.display = 'inline-block';
  let booted = false;
  const begin = (): void => {
    if (!booted) {
      booted = true;
      game.loopForTestStart();
    }
    loadingScreen.classList.add('hidden');
    game.start();
    setTimeout(() => loadingScreen.remove(), 600);
  };
  startBtn.addEventListener('click', begin);

  // automation/testing hook: http://host/?autostart&ticks=900
  const params = new URLSearchParams(window.location.search);
  if (params.has('autostart')) {
    begin();
    const ticks = Number(params.get('ticks') ?? '0');
    if (ticks > 0) {
      // run simulated frames after boot settles, report via document.title for headless dump-dom
      const poll = setInterval(() => {
        if (!game.isBooted()) return;
        clearInterval(poll);
        setTimeout(async () => {
          try {
            const t0 = performance.now();
            game.tickFramesWithTrace(ticks);
            const mode = params.get('mode') ?? 'campaign';
            if (mode === 'world') {
              // breakables + debug overlays: smash crates near spawn, toggle F3 debug flags
              const props0 = game.debugBreakableCount();
              game.debugSmashNearestBreakables(4);
              game.tickFramesWithTrace(120);
              const props1 = game.debugBreakableCount();
              const debris = game.debugDebrisCount();
              game.testPress('F3');
              game.tickFramesWithTrace(60);
              document.title = `SMOKEW props:${props0}->${props1} debris:${debris} bodies:${game.debugBodyCount()} ms:${(performance.now() - t0).toFixed(0)}`;
            } else if (mode === 'combat') {
              // realistic: walk into wave 1, mash attacks + dodges for ~14s
              game.testPress('KeyW');
              game.tickForTest(5.5);
              game.testRelease('KeyW');
              game.tickForTest(0.3); // let dodge buffer expire before attack mashing
              const pHpBefore = game.debugPlayerHp();
              // deterministic: 12 clean sword swings, then dodge check
              let dmgTotal = 0;
              for (let i = 0; i < 12; i++) {
                const before = game.debugEnemyHps();
                game.testPress('KeyJ');
                game.tickForTest(0.9); // full swing incl. hit window
                const after = game.debugEnemyHps();
                for (let k = 0; k < before.length; k++) dmgTotal += before[k] - (after[k] ?? 0);
              }
              game.testRelease('KeyJ');
              const hpAfter = game.debugEnemyHps();
              document.title = `SMOKEC php:${game.debugPlayerHp()}/${pHpBefore} dmg:${dmgTotal} ehp:${hpAfter.join('/')} kills:${3 - game.debugEnemyCount()} z:${game.debugPlayerPos().z.toFixed(1)} ms:${(performance.now() - t0).toFixed(0)}`;
                        } else {
              // campaign fast-forward: kill each wave, wait for next, boss phases, restart, defeat
              let guard = 0;
              while (game.debugEnemyCount() > 0 && guard++ < 40) {
                game.debugKillAllEnemies();
                game.tickFramesWithTrace(360); // death anims + despawn + wave clear delay
              }
              game.tickFramesWithTrace(240); // let boss activate & walk in
              const bossActive = game.debugBossActive();
              const bossHp0 = game.debugBossHp();
              game.debugBossDamage(220); // ~phase 2
              game.tickFramesWithTrace(180);
              const phase2 = game.debugBossPhase();
              game.debugBossDamage(260); // ~phase 3
              game.tickFramesWithTrace(180);
              const phase3 = game.debugBossPhase();
              game.debugBossDamage(999);
              game.tickFramesWithTrace(240);
              const won = game.gameState() === 'ended'; // playing -> ended with victory screen
              game.restart();
              game.tickFramesWithTrace(120);
              const afterRestart = `${game.gameState()}:${game.debugEnemyCount()}`;
              game.debugGameOver();
              game.tickFramesWithTrace(60);
              document.title = `SMOKE3 bossUp:${bossActive} hp0:${bossHp0} p2:${phase2} p3:${phase3} win:${won} restart:${afterRestart} lose:${game.gameState()} ms:${(performance.now() - t0).toFixed(0)}`;
            }
            (window as unknown as { __SMOKE: string }).__SMOKE = document.title;
          } catch (e) {
            document.title = `SMOKE_ERROR ${String(e)}`;
            console.error('[smoke] tick error', e);
          }
        }, 300);
      }, 100);
    }
  }

  // expose for debugging / smoke tests
  (window as unknown as { game: Game }).game = game;
}

(window as unknown as { __LOG: string[] }).__LOG = [];
const _log = console.log.bind(console);
console.log = (...a: unknown[]) => { (window as unknown as { __LOG: string[] }).__LOG.push(a.map(String).join(' ')); _log(...a); };
main().catch((e) => console.error(e));
