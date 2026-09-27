# Development Rules

本项目所有开发（包括 AI Agent）必须遵守以下规则。

## 1. 分阶段开发流程

每个阶段严格执行：

```text
PLAN → IMPLEMENT → STATIC CHECK → AUTOMATED TEST（如适用）→ RUN → USER TEST PREPARATION → STOP
```

每阶段完成后必须：

1. 更新 `project-docs/` 中的相关文档；
2. 运行并确认 `npm run build` 与 `npm run dev` 均成功；
3. 给出**实际启动成功后的访问地址**（禁止虚构）；
4. 列出本阶段变化；
5. 列出用户应测试的内容与预期结果；
6. 列出真实存在的已知问题；
7. **停止，等待用户确认**；
8. 未经用户确认，不得进入下一阶段。

## 2. 代码组织

- JavaScript ES Modules，按功能拆分为多个模块文件，禁止把全部代码堆进一个文件。
- 建议结构：
  - `src/main.js` — 入口与主循环组装
  - `src/config.js` — 全局常量与可调参数
  - `src/core/` — 循环、输入、时钟等引擎级模块
  - `src/water/` — 水面系统
  - `src/boat/` — 载具与控制
  - `src/camera/` — 摄像机
  - `src/track/` — 赛道、检查点、道具箱
  - `src/ai/` — AI 选手
  - `src/items/` — 道具系统
  - `src/ui/` — HUD、菜单、结算
  - `src/i18n/` — 文案
- 任何新目录需求按同样原则新建。

## 3. 渲染与美术

- 风格：简笔画 / 手绘卡通（程序化几何 + 描边 + 明快配色）。
- 水面必须明显优于普通卡通平面水面（真实起伏、法线波纹、反射、菲涅耳、尾迹、水花、泡沫）。
- 始终保持 `Visual Mesh ≠ Collider`：复杂视觉模型绝不直接作为精确碰撞体。
- 不使用任何侵权素材；所有资产为程序生成或原创。

## 4. 文案与语言

- 所有面向用户的文本经由 `src/i18n/` 管理，禁止在功能文件中散落硬编码文案。
- 只支持中文与 English；按浏览器语言自动选择；用户手动切换后保存 localStorage。

## 5. 质量门槛

- 每阶段结束前必须验证：
  1. `npm run build` 成功；
  2. `npm run dev` 成功且页面能打开；
  3. 本阶段新功能确实可见；
  4. 控制台无阻塞性错误。
- 未运行的功能不得声称"已测试通过"。
- Build 失败时不得宣布阶段完成。

## 6. 资源策略

- 第一版全部使用程序化占位模型（简化几何 + 描边材质），不等待正式模型。
- 正式资源在后续阶段逐步替换（见 `ASSET_PLAN.md`）。

## 7. 文档即状态

- `project-docs/` 是项目长期记忆与状态唯一来源。
- 每次阶段结束必须同步：`CURRENT_PHASE.md`、`CHANGELOG.md`、`TEST_PLAN.md`、
  `TEST_RESULTS.md`、`KNOWN_ISSUES.md`，必要时更新 `ROADMAP.md`、`ASSET_PLAN.md`、`USER_ACCEPTANCE.md`。
