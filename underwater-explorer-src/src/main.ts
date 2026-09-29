/**
 * Underwater Explorer — 入口
 * 阶段 7：海底场景、潜水员、鱼群与基础鱼叉捕鱼。
 * three.js 经 CDN importmap 加载；npm three 仅类型检查。
 */
import { createEngine } from './core/engine';
import { createInput } from './core/input';
import { createMouse } from './core/mouse';
import { setDebug, reportError } from './core/debug';
import { attachFpsCounter } from './core/fps';
import { createWorld } from './world/World';
import { createDebugHud } from './ui/DebugHud';
import { installTestHooks } from './core/testhooks';
import { ACTIVE_FISH_DEFS } from './data/fish';

function boot(): void {
  try {
    const placeholder = document.getElementById('placeholder');
    if (placeholder) placeholder.style.display = 'none';

    const canvas = document.createElement('canvas');
    canvas.id = 'gl';
    document.getElementById('app')!.appendChild(canvas);

    const engine = createEngine(canvas);
    const input = createInput();
    setDebug({ stage: 'stage7' });
    attachFpsCounter(() => window.__UE_DEBUG__);
    const world = createWorld(engine, input, createMouse());
    // 测试钩子：无头断言枚举鱼群状态
    (window as unknown as { __UE_WORLD_FISH__?: () => unknown[] }).__UE_WORLD_FISH__ = () =>
      [...world.fish.fishes].map((f, i) => ({
        idx: i,
        id: f.def.id, state: f.state, behavior: f.def.behavior,
        pos: { x: f.pos.x, y: f.pos.y }, vel: { x: f.vel.x, y: f.vel.y }, hp: f.hp,
        defDepth: { min: f.def.depthMin, max: f.def.depthMax },
        spawnDepth: f.spawnDepth,
      }));
    (window as unknown as { __UE_FISH_DEFS?: () => unknown[] }).__UE_FISH_DEFS = () => [...ACTIVE_FISH_DEFS];
    // 阶段7 测试：把 idx 鱼钉在世界坐标 (x,y)（每 tick 维持直到解除）
    const pinned = new Map<number, { x: number; y: number }>();
    (window as unknown as { __UE_PIN_FISH?: (idx: number, x: number, y: number) => boolean }).__UE_PIN_FISH =
      (idx, x, y) => {
        const f = world.fish.fishes[idx];
        if (!f) return false;
        pinned.set(idx, { x, y });
        return true;
      };
    engine.addUpdate(() => {
      for (const [idx, pt] of pinned) {
        const f = world.fish.fishes[idx];
        if (!f || !f.alive) {
          pinned.delete(idx);
          continue;
        }
        f.pos.x = pt.x;
        f.pos.y = pt.y;
        f.vel.set(0, 0);
        f.leader = null;
      }
    });
    // 阶段7 测试钩子：发射鱼叉到目标点 + 统计
    (window as unknown as { __UE_FIRE_HARPOON?: (tx: number, ty: number) => boolean }).__UE_FIRE_HARPOON =
      (tx, ty) => world.harpoon.fireTo(tx, ty);
    (window as unknown as { __UE_HARPOON_STATS?: () => unknown }).__UE_HARPOON_STATS = () =>
      ({ ...world.harpoon.getStats(), active: world.harpoon.getActiveCount(), projectiles: [...world.harpoon.projectiles].map((p) => ({ active: p.active, x: p.sprite.position.x, y: p.sprite.position.y })) });
    // 测试：按索引强制传送某条鱼（fleeing 触发验证用）
    (window as unknown as { __UE_TEST_TELEPORT?: (index: number, x: number, y: number) => boolean }).__UE_TEST_TELEPORT =
      (index, x, y) => {
        const f = world.fish.fishes[index];
        if (!f) return false;
        f.pos.x = x;
        f.pos.y = y;
        f.leader = null; // 脱离队形保证独立行为
        return true;
      };
    createDebugHud();

    // HUD tick 由 rAF 驱动
    let last = performance.now();
    (function hud(now: number) {
      requestAnimationFrame(hud);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const tick = (window as unknown as { __UE_HUD_TICK__?: (dt: number) => void }).__UE_HUD_TICK__;
      tick?.(dt);
    })(last);

    console.log(
      '[boot] underwater-explorer stage 7 ok — diver, fish schools, and basic harpoon online. ' +
        'window.__UE_DEBUG__ for state.',
    );

    // 键盘注入钩子（?test=1）；autodemo=1 自动脚本；autokick=1 直接驱动输入系统（headless 用）
    const q = new URLSearchParams(location.search);
    if (q.get('test') === '1') {
      installTestHooks();
      if (q.get('autodemo') === '1') {
        const seq = ['KeyD', 'KeyW', 'KeyA', 'KeyS', ''] as const;
        const DUR = 1.5;
        let demoT = 0;
        let lastKey = '';
        const KEY_ACTION: Record<string, 'moveLeft' | 'moveRight' | 'moveUp' | 'moveDown' | ''> = {
          KeyD: 'moveRight', KeyA: 'moveLeft', KeyW: 'moveUp', KeyS: 'moveDown', '': '',
        };
        const kick = q.get('autokick') === '1';
        const timers = (window as unknown as { __UE_INPUT_TIMERS__?: { press(a: string): void; release(a: string): void } }).__UE_INPUT_TIMERS__ ?? null;
        const applyKey = (k: string, down: boolean): void => {
          if (k && kick && timers) {
            if (down) timers.press(KEY_ACTION[k]);
            else timers.release(KEY_ACTION[k]);
          } else if (k) {
            document.dispatchEvent(new KeyboardEvent(down ? 'keydown' : 'keyup', { code: k, bubbles: true }));
          }
        };
        const timer = setInterval(() => {
          demoT += 0.05;
          const step = Math.floor(demoT / DUR) % seq.length;
          const key = seq[step];
          if (key !== lastKey) {
            applyKey(lastKey, false);
            lastKey = key;
            if (key) {
              console.log(`__KEYSEQ__ step${step} ${kick ? 'action:' + KEY_ACTION[key] : key}`);
              applyKey(key, true);
            }
          }
        }, 50);
        setTimeout(() => {
          clearInterval(timer);
          const d = window.__UE_DEBUG__;
          console.log(
            `__DEMO_RESULT__ ${JSON.stringify({ diver: [d.diverX, d.diverY], vel: [d.diverVx, d.diverVy], facing: d.diverFacing, anim: d.diverState })}`,
          );
        }, 8300);
      }
    }

    // probe 钩子：?probe=1 周期打印；?probe=stream 记录轨迹（含实时轴向）
    const probeMode = q.get('probe');
    if (probeMode) {
      if (probeMode === 'stream') {
        const trail: unknown[] = [];
        const t0 = performance.now();
        const rec = setInterval(() => {
          const d = window.__UE_DEBUG__;
          trail.push([
            Math.round((performance.now() - t0) / 100) * 10,
            d.diverX, d.diverY, d.diverVx, d.diverVy, d.diverFacing, d.diverState === 'swim' ? 1 : 0,
            d.tickCount,
          ]);
        }, 100);
        setTimeout(() => {
          clearInterval(rec);
          console.log('__TRAIL__ ' + JSON.stringify(trail));
        }, 8200);
      }
      let n = 0;
      const probe = setInterval(() => {
        const d = window.__UE_DEBUG__;
        console.log(
          `__PROBE__ ${JSON.stringify({
            fps: d.fps,
            depth: +d.depthMeters.toFixed(1),
            diver: [d.diverX, d.diverY],
            vel: [d.diverVx, d.diverVy],
            facing: d.diverFacing,
            anim: d.diverState,
            clips: d.diverClips,
            bubbles: d.bubbleCount,
            motes: d.moteCount,
            segs: d.terrainSegments,
            calls: d.drawCalls,
            errors: d.errors.length,
          })}`,
        );
        n++;
        if (n > 20) {
          clearInterval(probe);
          window.close();
        }
      }, 400);
    }
    void world;
  } catch (err) {
    reportError('boot', err);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
