# 2D 足球弹珠游戏 — Qwen3.8 / DSH Agent 开发提示词

## 总目标
创建一个 HTML5 Canvas + JavaScript 的 **2D 足球弹珠游戏**：弹珠从足球场一端发射，突破 5 名足球运动员的分层防守后射入球门。球员会预测弹珠轨迹、移动拦截，并在碰撞后把弹珠打退。

> 核心原则：先分析本地资源，再规划，再编码；禁止浏览器截图/视觉截图验收；Agent 自身只允许静态代码与逻辑测试；每个阶段完成后必须暂停，等待用户实际访问测试并确认。

---

## 1. 第一任务：读取下载目录中的 Kenney Sports Pack
在写任何正式游戏代码之前，先读取当前用户的 `Downloads/下载` 目录，寻找：`kenney_sports-pack`、`kenney_sports_pack`、`Kenney Sports Pack` 或明显的近似目录名。

递归扫描后分析：目录结构、PNG/SVG/JPG/WEBP、spritesheet/atlas、JSON/XML/TXT、足球、球场、球门、运动员、UI、图标、音效、字体及其他可复用素材。

必须先生成 `docs/assets.md`，记录：原始路径、文件名、类型、可静态读取的尺寸/格式、推荐用途、是否采用、复制后的目标路径。优先复用该资源包；缺少资源时才允许 Canvas/CSS/简单 SVG 程序化占位。**禁止擅自联网下载素材。**

## 2. 严禁截图测试
禁止使用：浏览器截图、Playwright/Puppeteer screenshot、任何 screenshot API、截图分析、图像识别验收，以及“截图看起来正常”作为测试结论。

允许启动本地 HTTP 服务并提供地址给用户自己打开浏览器体验，但 Agent 自己只能通过以下方式验收：HTML/CSS/JS 静态检查、JS 语法、import/export、资源路径存在性、文件完整性、数值逻辑测试、碰撞数学测试、AI 状态机测试、游戏状态流测试、单元测试或无浏览器逻辑测试。

## 3. 项目初始化
创建新目录，例如 `football-pinball-2d/`：

```text
football-pinball-2d/
├─ docs/
│  ├─ plan.md
│  ├─ assets.md
│  ├─ rules.md
│  └─ test-checklist.md
├─ assets/
├─ src/
├─ tests/
├─ index.html
└─ README.md
```

编码前必须完成上述 4 个 docs 文件。`rules.md` 必须写明：禁止截图测试、优先本地 Kenney 素材、禁止私自联网找素材、分阶段开发、每阶段结束暂停等待用户确认。

## 4. 技术路线
优先使用 HTML5 + CSS + JavaScript ES Modules + Canvas 2D。除非已有依赖，否则不要引入大型框架。物理优先轻量自研：Vector2、position、velocity、acceleration、friction/damping、circle-circle、circle-rectangle、impulse、restitution、fixed timestep。

建议逻辑世界尺寸 `1280×720`；Canvas 可响应窗口缩放，但物理世界坐标不能直接依赖 CSS 像素。

## 5. 游戏场景
横向 2D 足球场，包括草坪、边线、中线、禁区、球门、弹珠发射区、5 名防守球员和 HUD。优先用 Kenney Sports Pack 拼装。

## 6. 弹珠系统
至少包含：`position / velocity / radius / mass / restitution / friction / maxSpeed`。实现发射、运动、摩擦减速、边界反弹、球员碰撞、进球判定、丢球/重新发球、最大速度限制、防高速穿透基础处理。推荐固定时间步长。

## 7. 五名球员分层防守
5 人不能使用相同 AI，也不能全部无脑追球：

| 球员 | 角色 | 职责 |
|---|---|---|
| P1 | 左中场 | 提前干扰左路 |
| P2 | 右中场 | 提前干扰右路 |
| P3 | 左后卫 | 防守禁区左侧 |
| P4 | 右后卫 | 防守禁区右侧 |
| P5 | 守门员 | 球门前最后防线 |

每人至少具有：`homePosition, position, velocity, patrolArea, interceptArea, maxSpeed, reactionTime, hitPower, state, cooldown`。

AI 状态至少包括：`IDLE → TRACK → INTERCEPT → BLOCK/KICK → RETURN_HOME → COOLDOWN`。

只有预测轨迹进入自己的职责区域才允许主动拦截；拦截结束必须回归 `homePosition`。每名球员有 `minX/maxX/minY/maxY` 活动范围，守门员绝不能长期离开球门区域。

## 8. 轨迹预测
基础预测：

```js
predicted = ball.position + ball.velocity * predictionTime;
```

不同位置使用不同 `predictionTime`。第一版无需复杂模拟，但 AI 必须综合弹珠位置、速度、方向、自身职责区和球门位置做决定。

## 9. 击退物理
有效拦截不能只是停球。根据碰撞法线、球员移动方向、`hitPower` 和弹珠当前速度施加反向冲量，使球真正被打回去。守门员可拥有更高击退力。必须有 cooldown，防止每帧重复碰撞导致速度爆炸。

## 10. 游戏循环
```text
READY → LAUNCH → PLAYING
PLAYING → GOAL → SCORE → NEXT_BALL
PLAYING → BALL_LOST → LIFE_LOST → NEXT_BALL
lives = 0 → GAME_OVER
```

操作建议：Space 蓄力/发射，A/D 或 ←/→ 调方向，P 暂停，R 重开。

计分至少支持：进球、突破球员、高速进球、Combo、生命/剩余球、关卡、localStorage 最高分。所有数值集中在配置文件，禁止散落硬编码。

## 11. 难度
随关卡逐步调整球员速度、reactionTime、predictionTime、hitPower、防守区域、守门员速度、弹珠初始速度；全部必须有合理上下限。

## 12. 视觉与音效
保持 2D、清晰、明亮、Kenney 风格优先。可逐步加入残影、碰撞粒子、击退反馈、进球闪光、球网震动、轻微 squash/stretch。若资源包有音效则复用；没有就保持静音，禁止联网补素材。

## 13. 推荐源码结构
```text
src/
├─ main.js
├─ config.js
├─ game/Game.js
├─ game/GameState.js
├─ game/LevelManager.js
├─ entities/Ball.js
├─ entities/Player.js
├─ entities/Goal.js
├─ entities/Field.js
├─ ai/DefenderAI.js
├─ ai/GoalkeeperAI.js
├─ ai/TrajectoryPredictor.js
├─ physics/Vector2.js
├─ physics/Collision.js
├─ physics/PhysicsWorld.js
├─ rendering/Renderer.js
├─ rendering/SpriteManager.js
├─ rendering/Effects.js
├─ input/InputManager.js
├─ audio/AudioManager.js
└─ ui/HUD.js
```

不要把整个游戏塞进一个巨大 `index.html`。

## 14. 强制静态测试
每阶段至少检查：文件存在性、大小写、相对路径、资源映射、失效引用、JS 语法、模块导入、未定义变量、重复声明、初始化顺序、RAF 生命周期。

数学测试：normalize、dot、reflection、circle collision、impulse、speed clamp、bounds clamp。

AI 固定输入测试：球不在区域时不追；预测轨迹进入区域时 INTERCEPT；拦截后 KICK；完成后 RETURN_HOME；回到站位后 IDLE；守门员不越界。

状态测试：READY→PLAYING、GOAL→NEXT_BALL、BALL_LOST→LIFE_LOST、0 lives→GAME_OVER、restart 完整复位。

重点排查：高速穿透、球卡在球员内部、重复击球速度爆炸、5 人聚团、门将越界、速度无限增加、球进入墙体、resize 改物理坐标、restart 重复注册事件、多个 RAF 循环、重复创建音频、图片未加载就读取、资源路径空格/大小写错误。

## 15. 分阶段执行（强制暂停机制）
### Phase 0 — 资源分析
只扫描 `kenney_sports-pack`，生成 `docs/assets.md`、`plan.md`、`rules.md`、`test-checklist.md`。**完成后停止，不编码游戏，向用户报告资源与计划，等待“继续”。**

### Phase 1 — 最小可玩版
足球场、球门、单颗弹珠、发射、边界碰撞、进球/丢球判定、基础 HUD。静态测试通过后启动服务供用户体验，然后停止等待确认。

### Phase 2 — 5 球员 AI
加入五人站位、职责区、状态机、轨迹预测、回位逻辑。完成静态/逻辑测试后停止等待确认。

### Phase 3 — 碰撞与击退
完善球员-弹珠冲量、cooldown、防穿透、最大速度和异常恢复。测试后停止等待确认。

### Phase 4 — 游戏化
加入计分、Combo、生命、关卡、难度曲线、最高分。测试后停止等待确认。

### Phase 5 — 表现增强
在不破坏玩法的前提下加入 Kenney 素材、动画、粒子和本地音效。测试后停止等待确认。

### Phase 6 — 最终整理
清理调试代码、README、完整测试清单、启动方式、操作说明、已知限制。禁止用截图作为最终验收。

## 16. 每阶段必须输出
每次暂停时必须向用户列出：
1. 当前阶段完成内容；
2. 新增/修改文件；
3. 使用的 Kenney 资源及真实路径；
4. 已执行的静态测试；
5. 测试结果与未解决问题；
6. 本地启动命令和访问地址（若本阶段可运行）；
7. 用户应重点测试的项目；
8. 明确写出：**“已暂停，等待用户确认后继续下一阶段。”**

用户未确认前不得自动进入下一阶段。

## 17. 最终验收标准
- 游戏无需截图分析即可完成全部工程测试；
- 本地 Kenney Sports Pack 被实际分析并优先复用；
- 弹珠物理稳定，无明显速度爆炸或卡死；
- 5 名球员具有不同职责和限制区域；
- 球员能预测、拦截并明显击退弹珠；
- 不会出现 5 人长期聚成一团；
- 守门员保持球门防区；
- 可以进球、丢球、重新发球、计分、Game Over、Restart；
- resize 不破坏物理；
- 无重复 RAF/输入监听；
- 资源路径全部有效；
- README 能让用户独立启动项目。

## 18. 立即执行
现在只执行 **Phase 0**：定位并递归分析当前下载目录中的 `kenney_sports-pack`，创建项目目录和 4 个 docs 文档，给出资源清单、开发计划和静态测试方案。**不要开始 Phase 1；完成后停下来等待用户确认。**
