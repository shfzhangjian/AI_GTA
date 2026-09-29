# HANDOFF — 当前交接文档

更新时间：2026-09-29

## 当前状态

项目是 Vite + TypeScript + three.js 的 2D/2.5D 海底探索原型，运行入口为 `index.html` / `src/main.ts`。

当前可玩核心已经包括：

- 潜水员 WASD/方向键移动、惯性、海床/水面/左右边界。
- 相机跟随潜水员，海面上方有昼夜循环、太阳/月亮/星空。
- 程序化海床、珊瑚/岩石/遗迹装饰、背景光束、粒子。
- 鱼群生成、群游、巡游、逃离、鱼叉命中和死亡反馈。
- 鱼叉瞄准、蓄力、发射、冷却，不能连续发射。
- 氧气/生命 HUD：入水耗氧，露出水面到达呼吸高度后恢复，缺氧后扣生命。
- 普通鱼与潜水员碰撞后快速反方向逃开，不会被潜水员推着走。
- 水底随机大气泡：从海床成簇冒出，受浮力加速、终端速度、压力膨胀和摆动影响。

## 最近用户确认/要求

- 不要用浏览器访问，只允许代码静态检查；此前用户明确要求不要用已有测试脚本。
- `http://127.0.0.1:5175/` 访问正常。
- 重点视觉反馈来自用户截图：潜水员出水、鱼贴身、船/昼夜、水泡等需要按视觉观感调整。
- 危险鱼已按用户要求下线：数据仍保留，但活跃生成池过滤掉 `aggressive` 和 `boss`。

## 本轮主要改动

### 潜水员出水

文件：`src/entities/Diver.ts`

- 取消了把整张潜水员 sprite 整体上抬的做法。
- 身体中心限制在水下，出水部分由独立头肩层绘制。
- 开启 three.js 局部裁剪后，头肩层按水面裁剪，不再通过透明度慢慢消失。
- `diverExposedHeight` 用当前帧高度计算实际露出水面的高度。

相关文件：

- `src/core/engine.ts`：`renderer.localClippingEnabled = true`
- `src/core/debug.ts`：新增 `diverExposedHeight`

### 氧气和生命

文件：`src/entities/Diver.ts`, `src/ui/DebugHud.ts`, `src/styles/main.css`

- 潜水员新增 `oxygen / health / isBreathing / takeDamage`。
- 水下持续消耗氧气；露出足够高度后恢复氧气；氧气为 0 后持续扣生命。
- HUD 增加氧气槽、生命槽和状态提示。
- 受伤时潜水员短暂闪红，并有受伤冷却。

### 鱼行为和碰撞

文件：`src/entities/FishEntity.ts`, `src/systems/FishManager.ts`, `src/data/fish.ts`

- 鱼实体新增 `attackCooldown` 和 `panicDir`。
- 普通鱼碰到潜水员后会：
  - 先被推出碰撞盒；
  - 断开群游跟随；
  - 锁定反方向；
  - 以更快速度短时间逃离。
- 危险鱼已从活跃池中移除：
  - `ACTIVE_FISH_DEFS = FISH_DEFS.filter((f) => !f.aggressive && f.category !== 'boss')`
  - `FishManager` 生成只走 `fishAtDepth()`，因此不会抽到危险鱼。
  - `main.ts` 的 `__UE_FISH_DEFS` 也只暴露活跃安全鱼池。

### 鱼叉

文件：`src/systems/HarpoonSystem.ts`

- 当前已有瞄准、蓄力、发射、冷却、命中特效、鱼死亡短暂反馈。
- 发射后的长绳已隐藏，避免像拖尾一直跟着潜水员。

### 水面、天空和船

文件：`src/world/WaterSurface.ts`, `src/world/Boat.ts`

- 水面外部支持昼夜变化，一分钟循环。
- 太阳/月亮随时间上升下降，夜晚有星空。
- 船体已改为程序化绘制，层级高于水面并在天空/水面附近显示。

### 水底气泡

文件：`src/world/Particles.ts`, `src/world/World.ts`

- `createAmbientParticles(engine, terrain)` 现在接收地形。
- 新增底部气泡池：
  - 海床附近随机成簇生成；
  - 大尺寸泡；
  - 初速较慢，受浮力加速并趋近终端速度；
  - 大泡上升更快；
  - 接近水面压力变小会略膨胀；
  - 左右轻微摆动；
  - 寿命结束、升出视野或接近水面后消失回收。

## 关键文件速查

- `src/world/World.ts`：组装所有系统、相机跟随、背景/水面/粒子更新。
- `src/entities/Diver.ts`：潜水员移动、边界、出水、氧气/生命、受伤。
- `src/systems/FishManager.ts`：鱼生成、行为、碰撞、逃离。
- `src/systems/HarpoonSystem.ts`：鱼叉瞄准、蓄力、发射、命中。
- `src/world/WaterSurface.ts`：水面、昼夜、太阳/月亮/星空、光束。
- `src/world/Boat.ts`：船体绘制。
- `src/world/Particles.ts`：背景气泡、尘埃、水底气泡。
- `src/ui/DebugHud.ts` 和 `src/styles/main.css`：氧气/生命 HUD。
- `src/core/debug.ts`：运行时调试状态字段。
- `src/data/fish.ts`：鱼数据；危险鱼数据保留但活跃池过滤。

## 验证方式

用户当前要求是不使用浏览器、不使用已有测试脚本。最近采用的验证命令：

```bash
/Users/mac/.dsh/dsh-runtimes/dsh-primary-runtime/dependencies/node/bin/node node_modules/typescript/bin/tsc --noEmit
/Users/mac/.dsh/dsh-runtimes/dsh-primary-runtime/dependencies/node/bin/node node_modules/vite/bin/vite.js build
```

最近一次验证结果：

- `tsc --noEmit` 通过
- `vite build` 通过

注意：旧的 `scripts/fish-check.mjs` 仍假设危险鱼/charge 模板存在于活跃鱼池中；当前按用户要求禁用了危险鱼，因此这些旧脚本不适合作为当前验收依据，除非同步更新脚本断言。

## 当前已知风险

- `docs/CHANGELOG.md` 和旧测试脚本仍记录“50 种鱼/危险鱼”阶段目标；现在产品方向临时改为危险鱼不生成，文档需要持续对齐。
- 鱼叉视觉比例和潜水员出水比例已多轮调整，但最终仍以用户实机截图反馈为准。
- 船、水面、昼夜已经可用，但用户此前认为船的视觉仍可能需要继续精修。
- 氧气/生命目前是基础机制，没有失败/复活/返航结算流程。
- 普通鱼碰撞逃离已改为主动反方向冲开，但未做精细的圆形/胶囊碰撞，只是 AABB + 推出。

## 建议下一步

1. 用用户实机截图确认水底气泡大小、密度和上升速度。
2. 继续精修潜水员出水外观：头肩位置、轮廓光、与昼夜天空的对比。
3. 给氧气/生命增加明确的危险反馈：低氧闪烁、音效、屏幕边缘提示。
4. 把鱼叉捕获流程补齐：命中后拖拽/收鱼/入背包/重量。
5. 如果继续禁用危险鱼，同步修订 `docs/PLAN.md`、`docs/TEST_CHECKLIST.md` 和旧测试脚本。
