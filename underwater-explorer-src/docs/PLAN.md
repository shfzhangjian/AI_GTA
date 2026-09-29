# PLAN — 阶段计划与开发规范

## 0. 环境说明（本机 macOS arm64）

- 系统 PATH 无全局 node/npm。统一使用 DSH 运行时：
  - node: `/Users/mac/.dsh/dsh-runtimes/dsh-primary-runtime/dependencies/node/bin/node` (v24.21.0)
  - pnpm: `/Users/mac/.dsh/dsh-runtimes/dsh-primary-runtime/dependencies/pnpm/bin/pnpm.mjs` (11.7.0)
  - 运行前：`export PATH="/Users/mac/.dsh/dsh-runtimes/dsh-primary-runtime/dependencies/node/bin:$PATH"`
- **已知环境限制**：本机 macOS 库校验（Library Validation）禁止本 node 进程 `dlopen`
  第三方 `.node` 原生模块（rollup/rolldown native binding 全部 ERR_DLOPEN_FAILED）。
  - 解决：`pnpm.overrides` 把 rollup 指向官方 WASM 构建 `@rollup/wasm-node`（纯 JS/WASM，功能一致，构建略慢）。
  - vite 8（rolldown 版）在此限制下无 WASM 回退可用，故锁定 **vite 5**。
- three.js 规范：**只通过 CDN importmap 加载**（index.html `<script type="importmap">`，
  vite `build.rollupOptions.external: ['three']`）。npm 的 `three` / `@types/three` 仅用于类型检查，不打进产物。

## 1. 最高优先级规则（Agent 行为约束）

1. 每次只执行一个阶段；当前阶段未完成不得进入下一阶段。
2. 阶段结束必须：静态检查 → build 检查 → 控制台/编译错误检查 → 输出完成内容 / 测试方法 / 已知问题 → **立即停止**。
3. 必须等待用户回复 `继续` / `下一阶段` / `确认` 才能继续。
4. 禁止一次性或提前实现后续阶段功能。
5. 禁止用浏览器截图作为测试依据；以 tsc / vite build / 控制台日志 / 数据校验 / 用户实测为准。
6. 技术栈固定 TypeScript + Vite + three.js + HTML + CSS；不引入 Vue/React/Angular；新增依赖须先说明名称、用途、必要性。
7. 所有资产登记来源与许可证（docs/ASSET_LICENSES.md）；素材优先级 CC0 → 免费可商用 → 明确允许商用 → 可修改。
8. 禁止使用《潜水员戴夫》原始人物/UI/图片/音乐/音效/Logo/地图，仅参考玩法结构。
9. 用户本地已有素材优先分析；未经确认不批量下载。
10. 所有游戏数据数据驱动（src/data/），代码模块化，便于后续扩展鱼/生物/装备/地图。

## 2. 场景结构约定（阶段 2 起）

```
Scene
├─ BackgroundLayer   # 天空/海水渐变、远景
├─ WaterLayer        # 水体、光束
├─ TerrainLayer      # 海床、岩石、洞穴、沉船
├─ EntityLayer       # 玩家、鱼、生物、宝箱
├─ EffectLayer       # 气泡、粒子、前景
└─ UILayer           # HTML/CSS UI（不进 three 场景）
```

## 3. 阶段表

| 阶段 | 内容 | 状态 |
|---|---|---|
| 0 | 项目与规范：目录、文档、Vite 骨架、build 通过 | ✅ 完成 |
| 1 | 分析和整理素材：ASSET_MAPPING、资源检测脚本、缺失清单 | ⬜ |
| 2 | 基础 three.js 海底场景：Scene/Renderer/Camera/Loop/Resize/渐变海水/基础地形 | ⬜ |
| 3 | 潜水员角色：移动/朝向/动画/边界/惯性/相机跟随 | ⬜ |
| 4 | 海底环境丰富：珊瑚/海草/岩石/气泡/颗粒/光束/视差/摆动/性能 | ⬜ |
| 5 | 10 种鱼验证架构：FishEntity/Manager/Spawner/Behavior（巡游/群游/逃跑） | ⬜ |
| 6 | 扩展到 50 种鱼（需阶段 5 用户确认） | ⬜ |
| 7 | 鱼叉捕鱼：瞄准/发射/飞行/碰撞/命中/受伤/捕获 | ⬜ |
| 8 | 捕获与背包：记录/重量/价值/负重减速 | ⬜ |
| 9 | 氧气系统：消耗/UI/报警/耗尽扣 HP | ⬜ |
| 10 | 深度系统：深度显示/海水颜色/光照/鱼种/危险分级 | ⬜ |
| 11 | 鲨鱼 AI：PATROL/DETECT/CHASE/ATTACK/COOLDOWN/RETURN，攻击有前摇 | ⬜ |
| 13 | 洞穴：CaveArea 配置数据，入口窄/内部暗/稀有鱼多 | ⬜ |
| 14 | 沉船：Hull/Cabin/Cargo/TreasurePoint，Sprite 组合 | ⬜ |
| 15 | 宝箱：Common/Rare/Epic，CLOSED/OPENING/OPENED | ⬜ |
| 16 | 母船与返航：出生/下潜/返航/探索结算 | ⬜ |
| 17 | UI 完整化：HP/O2/Depth/Weight/背包/暂停/结算，16:9 适配 | ⬜ |
| 18 | 音效：环境+行为 SFX，总/BGM/SFX 三路音量 | ⬜ |
| 19 | BGM：浅海/深海/危险/Boss，渐入渐出/区域切换 | ⬜ |
| 20 | 大型鱼与深海生物：剑鱼/鮟鱇/大鱿鱼，复用状态机与系统 | ⬜ |
| 21 | 探索奖励与稀有鱼：普通/稀有/史诗，无抽卡 | ⬜ |
| 22 | 水下视觉优化：fog/粒子/光束/水感/深海黑暗，不掉 FPS | ⬜ |
| 23 | 性能优化：对象池/纹理复用/距离裁剪/60FPS 目标 | ⬜ |
| 24 | 本地存档 localStorage：设置/最深纪录/图鉴/累计 | ⬜ |
| 25 | 鱼类图鉴：50 种鱼图鉴 UI | ⬜ |
| 26 | 完整流程测试：TEST_CHECKLIST 全链路，问题分级 | ⬜ |
| 27 | 最终整理：删冗余/查许可证/查引用/final build | ⬜ |

## 4. 深度分层设计目标

```
0–30m    浅海      明亮蓝
30–80m   珊瑚区
80–130m  中深层
130–200m 深海
200m+    黑暗区
```

## 5. 数据驱动规范

鱼类数据结构（阶段 5 落地于 `src/data/fish.ts` 或 `fish.json`）：

```json
{
  "id": "clownfish", "name": "Clownfish", "category": "common",
  "sprite": "/assets/fish/common/clownfish.png",
  "hp": 10, "speed": 0.8, "weight": 0.4, "value": 20,
  "depthMin": 0, "depthMax": 30,
  "behavior": "school", "aggressive": false, "rarity": 1
}
```

行为模板复用，禁止一鱼一套 AI。50 种鱼目标构成：20 普通 / 10 群游 / 8 稀有 / 5 深海 / 5 危险 / 2 大型。

## 6. 每阶段统一输出格式

```
========================================
阶段 X 完成
========================================
【本阶段完成】 1. 2. 3.
【创建/修改文件】 - xxx
【静态检查】 TypeScript: PASS/FAIL  Build: PASS/FAIL  资源检查: PASS/FAIL
【如何测试】 1. 2. 3.
【当前已知问题】 1. 2.
【下一阶段】 阶段 X+1：xxxx
等待用户测试确认。请回复："继续" 或 "下一阶段"
```
