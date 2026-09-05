// 纯逻辑冒烟测试（无 DOM）：碰撞 / 建模 / 积分 / 粒子 / 球运动
const B = 'file:///E:/aibot/breakout/src/';
const { circleRectHit, reflect, predictTrajectory } = await import(B + 'physics/collision.js');
const { Brick } = await import(B + 'entities/brick.js');
const { ELEMENTS } = await import(B + 'entities/element.js');
const { ScoreEngine } = await import(B + 'score/scoreEngine.js');
const { ParticleSystem } = await import(B + 'effects/particles.js');
const { Ball } = await import(B + 'entities/ball.js');
const { ALIAS } = await import(B + 'level/levelLoader.js');
const { buildWordRow } = await import(B + 'level/wordFactory.js');
const { POWERUPS, rollDropType, PowerUp } = await import(B + 'entities/powerup.js');

let pass = 0, fail = 0;
const t = (name, cond) => { cond ? pass++ : (fail++, console.error('FAIL: ' + name)); };

// 1. 碰撞检测
let h = circleRectHit(50, 41, 8, 40, 50, 24, 24);           // 上方接近（距边9>半径8），未相交
t('不相交返回null', h === null);
h = circleRectHit(50, 42, 8, 40, 50, 24, 24);               // 恰好相切 → 判定接触
t('边界相切判定为接触', !!h && h.ny < -0.9);
h = circleRectHit(50, 45, 8, 40, 50, 24, 24);               // 顶部相交
t('顶部相交', h && h.ny < -0.9 && h.depth > 0 && h.depth <= 8);
h = circleRectHit(52, 62, 8, 40, 50, 24, 24);               // 圆心在内部
t('内部推出', h && h.depth > 8);

// 2. 反射保速
const v = { vx: 100, vy: -100 };
reflect(v, { nx: 0, ny: -1 });
t('镜面反射', v.vx === 100 && v.vy === 100);

// 3. 建模：字符网格 → 元素阵列（含空格跳过）
const resolve = tk => (tk === '.' || tk === ' ') ? null : (ALIAS[tk] || tk);
const brick = new Brick({ x: 100, y: 100, cells: ['SS.S', 'G..G'] }, 24, resolve);
t('网格展开计数(空格跳过)', brick.elements.length === 5); // SS.S→3 + G..G→2
t('元素属性绑定', brick.elements[0].def === ELEMENTS.stone && brick.elements[0].hp === 2);
t('坐标偏移正确', brick.elements[4].x === 172 && brick.elements[4].y === 124); // 第2行末格 G（跳过空格后为索引4）

// 4. 损伤与破坏
const e = brick.elements[0];
t('受击未死', e.damage(1) === 'damaged' && e.hp === 1);
t('致命摧毁', e.damage(1) === 'destroyed' && !e.alive);
t('死亡后免伤', e.damage(1) === null);

// 5. 积分算法：连击 + 速度加成
const sc = new ScoreEngine();
const fake = { def: { score: 10 } };
let r = sc.hit(fake, 300);                                   // 10 × (1+300/1200) × 1 = 12.5 → 13
t('基础分×速度加成', r.gain === 13 && r.combo === 1 && r.mult === 1);
r = sc.hit(fake, 300);                                       // 连击2: ×1.25 → 16
t('二级连击倍率', r.combo === 2 && Math.abs(r.mult - 1.25) < 1e-9 && r.gain === 16);
sc.update(2.0);                                              // 超时清零
t('连击窗口超时清零', sc.combo === 0);

// 6. 粒子系统生命周期
const fx = new ParticleSystem();
fx.burst(100, 100, 'shatter', ['#fff']);
fx.explode(200, 200, 80);
fx.text(50, 50, '+99');
t('特效生成', fx.p.length > 40 && fx.rings.length === 1 && fx.texts.length === 1);
for (let i = 0; i < 200; i++) fx.update(1 / 60);             // 模拟3.3秒
t('特效自动回收', fx.p.length === 0 && fx.rings.length === 0 && fx.texts.length === 0);

// 7. 球运动 + 轨迹预测
const ball = new Ball();
ball.launch(330);
t('发射向上', ball.vy < 0 && Math.abs(ball.speed - 330) < 1);
const x0 = ball.x, y0 = ball.y;
for (let i = 0; i < 60; i++) ball.update(1 / 120);
t('匀速直线运动', Math.abs(ball.x - x0 - ball.vx / 2) < 1 && Math.abs(ball.y - y0 - ball.vy / 2) < 1);
const pts = predictTrajectory(480, 300, 200, -300, 8, [{ x: 300, y: 100, w: 48, h: 24 }], { width: 960, height: 640 });
t('轨迹预测折线', pts.length >= 2 && pts[0].x === 480);

// 8. 炸药定义完备性
const boom = ELEMENTS.explosive;
t('炸药爆炸参数', boom.explode && boom.explode.radius > 0 && boom.explode.damage > 0 && boom.explode.delay >= 0);

// 9. 顶部单词砖：标签正确 / 材质合法 / 相邻字母材质不同
const row = buildWordRow(30, 30);
t('单词砖标签与字母一致', row.elements.every((e, i) => e.label === row.word[i] && e.alive));
t('单词砖材质全部合法', row.elements.every(e => !!e.def && (e.key === 'explosive' || ['glass', 'ice', 'stone', 'wood', 'metal', 'gold'].includes(e.key))));
t('相邻字母材质不同', row.elements.every((e, i) => i === 0 || e.key !== row.elements[i - 1].key));

// 10. 掉落道具系统
t('四种道具定义完备', ['multi', 'wide', 'narrow', 'fire'].every(k => POWERUPS[k]?.name && POWERUPS[k]?.color));
let dropValid = true;
for (let i = 0; i < 500; i++) if (!POWERUPS[rollDropType()]) dropValid = false;
t('掉落类型恒合法(500次)', dropValid);
const pu = new PowerUp('fire', 100, 100);
pu.update(.5);
t('道具下坠与碰撞盒', pu.y > 100 && pu.rect().w === 52 && pu.def.name === '火球');

// 11. 积分奖励接口
const sc2 = new ScoreEngine();
sc2.bonus(200);
t('单词奖励分入账', sc2.score === 200 && sc2.combo === 0);

console.log(`\n冒烟测试: ${pass} 通过, ${fail} 失败`);
process.exit(fail ? 1 : 0);
