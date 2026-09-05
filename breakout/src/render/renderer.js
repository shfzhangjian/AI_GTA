import { VIEW, BALL } from '../config/constants.js';
import { predictTrajectory } from '../physics/collision.js';

/** Renderer —— Canvas2D 渲染：底图 → 元素 → 道具/子弹 → 挡板/球组 → 特效 → HUD → 遮罩 → 调试层 */
export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = VIEW.width * dpr;
    canvas.height = VIEW.height * dpr;
    this.ctx.scale(dpr, dpr);
  }

  draw(game) {
    const ctx = this.ctx;
    ctx.save();

    // 爆炸震屏
    if (game.shakeT > 0) {
      const m = game.shakeMag * Math.max(game.shakeT / game.shakeDur, 0);
      ctx.translate((Math.random() - .5) * m, (Math.random() - .5) * m);
    }

    // 底图
    if (game.bgCanvas) ctx.drawImage(game.bgCanvas, 0, 0);
    else { ctx.fillStyle = '#000'; ctx.fillRect(-20, -20, VIEW.width + 40, VIEW.height + 40); }

    // 元素（砖块单元，含顶部单词砖）
    for (const e of game.level.elements) if (e.alive) e.draw(ctx, game.time);

    // 坠落道具
    for (const pu of game.powerups) pu.draw(ctx);

    // 子弹
    ctx.shadowColor = '#ffb347';
    ctx.shadowBlur = 8;
    for (const bl of game.bullets) {
      ctx.fillStyle = '#ffd970';
      ctx.fillRect(bl.x - 1.6, bl.y - 7, 3.2, 12);
    }
    ctx.shadowBlur = 0;

    this._drawPaddle(ctx, game.paddle);
    for (const b of game.balls) this._drawBall(ctx, b, game.fireActive);
    game.fx.draw(ctx);
    ctx.restore(); // 震屏结束，HUD 不抖

    this._drawHud(ctx, game);
    this._drawOverlayText(ctx, game);
    if (game.debug) this._drawDebug(ctx, game);
  }

  _roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  _drawPaddle(ctx, p) {
    const r = p.rect();
    const g = ctx.createLinearGradient(0, r.y, 0, r.y + r.h);
    g.addColorStop(0, '#8fe3ff'); g.addColorStop(1, '#2f7bd8');
    ctx.fillStyle = g;
    this._roundRect(ctx, r.x, r.y, r.w, r.h, 6);
    ctx.fill();
    ctx.strokeStyle = 'rgba(180,240,255,.9)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  _drawBall(ctx, ball, fire) {
    // 拖尾（火球模式为橙红色）
    const trailColor = fire ? '#ff9a4d' : '#9fdcff';
    for (let i = ball.trail.length - 1; i >= 0; i--) {
      const t = ball.trail[i];
      const k = 1 - i / ball.trail.length;
      ctx.globalAlpha = k * .35;
      ctx.fillStyle = trailColor;
      ctx.beginPath();
      ctx.arc(t.x, t.y, BALL.r * k * .8, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // 球体 + 辉光（火球：更大橙色辉光 + 橙金渐变）
    ctx.shadowColor = fire ? '#ff6a2d' : '#6fd0ff';
    ctx.shadowBlur = fire ? 24 : 14;
    if (fire) {
      const g = ctx.createRadialGradient(ball.x - 2, ball.y - 2, 1, ball.x, ball.y, BALL.r);
      g.addColorStop(0, '#fff6d8');
      g.addColorStop(.55, '#ffb347');
      g.addColorStop(1, '#ff5a2d');
      ctx.fillStyle = g;
    } else {
      ctx.fillStyle = '#eef8ff';
    }
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, fire ? BALL.r * 1.15 : BALL.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  _drawHud(ctx, game) {
    ctx.textBaseline = 'top';
    ctx.font = 'bold 16px Consolas, monospace';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#dfe7ff';
    ctx.fillText(`得分 ${game.score.score}`, 14, 12);

    if (game.score.combo > 1) {
      ctx.fillStyle = '#ffd970';
      ctx.fillText(`连击×${game.score.combo}  倍率×${game.score.multiplier.toFixed(2)}`, 14, 34);
    }

    // 生效中的道具计时条（左上第二列）
    const bars = [];
    if (game.timers.fire > 0)   bars.push(['火球', game.timers.fire, 6, '#ffb347']);
    if (game.timers.wide > 0)   bars.push(['加长', game.timers.wide, 10, '#4fd8ff']);
    if (game.timers.narrow > 0) bars.push(['缩短', game.timers.narrow, 8, '#ff7b7b']);
    bars.forEach(([name, t, max, color], i) => {
      const y = 56 + i * 18;
      ctx.font = '11px Consolas, monospace';
      ctx.fillStyle = color;
      ctx.fillText(`${name} ${t.toFixed(1)}s`, 14, y);
      ctx.fillStyle = 'rgba(255,255,255,.16)';
      ctx.fillRect(78, y + 3, 90, 7);
      ctx.fillStyle = color;
      ctx.fillRect(78, y + 3, 90 * Math.min(t / max, 1), 7);
    });

    // 关卡名移至底部（顶部让给单词砖）
    ctx.textAlign = 'center';
    ctx.font = '13px Consolas, monospace';
    ctx.fillStyle = '#5f6f96';
    ctx.fillText(game.level.json?.name || '', VIEW.width / 2, VIEW.height - 20);

    // 生命
    for (let i = 0; i < game.lives; i++) {
      ctx.fillStyle = '#6fd0ff';
      ctx.beginPath();
      ctx.arc(VIEW.width - 20 - i * 22, 20, 6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.textBaseline = 'alphabetic';
  }

  _drawOverlayText(ctx, game) {
    const s = game.state;
    if (s === 'boot' || s === 'playing') return;

    ctx.fillStyle = 'rgba(3,6,16,.55)';
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);

    const cx = VIEW.width / 2, cy = VIEW.height / 2;
    ctx.textAlign = 'center';

    const line = (txt, y, size = 34, color = '#eaf4ff') => {
      ctx.font = `bold ${size}px "Microsoft YaHei", sans-serif`;
      ctx.fillStyle = color;
      ctx.fillText(txt, cx, y);
    };

    if (s === 'ready') {
      line(game.level.json?.name || '', cy - 60, 30, '#8be9fd');
      if (game.word) line(`击碎单词 ${game.word.word} 有大奖`, cy - 24, 15, '#ffd970');
      line('点击 / 空格 发射', cy + 16, 24);
    } else if (s === 'paused') {
      line('已暂停', cy - 10);
      line('按 P 继续', cy + 34, 16, '#9fb0d8');
    } else if (s === 'clear') {
      line('关卡完成！', cy - 10, 38, '#50fa7b');
      line('进入下一关…', cy + 36, 16, '#9fb0d8');
    } else if (s === 'gameover') {
      line('游戏结束', cy - 24, 38, '#ff7b7b');
      line(`最终得分 ${game.score.score}`, cy + 14, 20);
      line('按 R 重新开始', cy + 52, 16, '#9fb0d8');
    } else if (s === 'win') {
      line('全部通关！', cy - 24, 40, '#ffd970');
      line(`总得分 ${game.score.score}`, cy + 14, 22);
      line('按 R 再来一局', cy + 52, 16, '#9fb0d8');
    }
  }

  /** 调试覆盖层：碰撞盒 / 速度矢量 / 轨迹预测 */
  _drawDebug(ctx, game) {
    const rects = [];
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(0,255,140,.35)';
    for (const e of game.level.elements) {
      if (!e.alive) continue;
      ctx.strokeRect(e.x + .5, e.y + .5, e.w - 1, e.h - 1);
      rects.push(e);
    }

    for (const b of game.balls) {
      ctx.strokeStyle = 'rgba(255,60,90,.85)';
      ctx.beginPath();
      ctx.arc(b.x, b.y, BALL.r, 0, Math.PI * 2);
      ctx.stroke();

      if (!b.stuck) {
        ctx.strokeStyle = 'rgba(255,80,120,.9)';
        ctx.beginPath();
        ctx.moveTo(b.x, b.y);
        ctx.lineTo(b.x + b.vx * .15, b.y + b.vy * .15);
        ctx.stroke();
      }
    }

    const lead = game.balls.find(b => !b.stuck);
    if (lead) {
      const pts = predictTrajectory(lead.x, lead.y, lead.vx, lead.vy, BALL.r, rects, VIEW);
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = 'rgba(255,240,120,.65)';
      ctx.beginPath();
      pts.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }
}
