# Underwater Explorer

原创的 **2D / 2.5D 横向侧视海底探索小游戏**，玩法结构参考《潜水员戴夫》的"海底探索 / 捕鱼"部分（**不含**餐厅、厨师、寿司、顾客、经营系统）。

> ⚠️ 本项目为分阶段开发。当前进度请见 [docs/CHANGELOG.md](docs/CHANGELOG.md)。

## 技术栈

| 项目 | 选择 |
|---|---|
| 语言 | TypeScript（strict） |
| 构建 | Vite 5 |
| 渲染 | three.js **r0.186.1，通过 CDN importmap 引入，绝不打包** |
| UI | 原生 HTML + CSS |
| 框架 | 无（不引入 Vue / React / Angular） |

## 快速开始

```bash
# 安装依赖（本机使用 pnpm；npm 亦可）
pnpm install

# 本地开发
pnpm run dev        # 默认 http://127.0.0.1:5175/

# 构建检查
pnpm run build      # = tsc --noEmit + vite build
```

> 本仓库开发环境说明：系统 PATH 中无全局 node，请使用 DSH 自带运行时
> `/Users/mac/.dsh/dsh-runtimes/dsh-primary-runtime/dependencies/node/bin/node`
> 与 pnpm `.../pnpm/bin/pnpm.mjs` 执行以上命令（详见 docs/PLAN.md「环境说明」）。

## 核心玩法循环（目标）

```
母船 → 下潜 → 探索海底 → 发现鱼群 → 鱼叉捕鱼 → 躲避/对抗危险生物
→ 进入洞穴 → 探索沉船 → 开启宝箱 → 管理氧气和负重 → 返回母船 → 探索结算
```

## 目录结构

```
underwater-explorer/
├─ index.html            # 含 three.js CDN importmap
├─ vite.config.ts        # three 标记 external → CDN
├─ tsconfig.json
├─ docs/                 # PLAN / GAME_DESIGN / ASSET_LICENSES / ASSET_MAPPING / TEST_CHECKLIST / CHANGELOG
├─ scripts/              # 资源检测等开发脚本
├─ public/assets/        # 全部游戏资产（player/fish/creatures/environment/boat/ui/audio…）
└─ src/
    ├─ main.ts
    ├─ core/  game/  entities/  systems/  world/  ui/  audio/  data/  utils/  styles/
```

## 开发规则（摘要）

1. **一次只做一个阶段**，阶段完成 → 自检 → 停止 → 等待用户确认。
2. 游戏数据一律**数据驱动**（`src/data/`），禁止硬编码鱼种参数。
3. 所有资产必须登记进 [docs/ASSET_LICENSES.md](docs/ASSET_LICENSES.md)。
4. 禁止使用《潜水员戴夫》原始素材，只参考玩法结构。
5. three.js 只允许 CDN（importmap），npm 包仅用于类型检查。
6. 不用截图判断功能完成；以编译 / build / 控制台 / 数据校验为准。

完整规范见 [docs/PLAN.md](docs/PLAN.md)。

## 文档索引

- [docs/PLAN.md](docs/PLAN.md) — 阶段计划与开发规范
- [docs/GAME_DESIGN.md](docs/GAME_DESIGN.md) — 游戏设计
- [docs/ASSET_LICENSES.md](docs/ASSET_LICENSES.md) — 资产许可证登记
- [docs/ASSET_MAPPING.md](docs/ASSET_MAPPING.md) — 资产映射（阶段 1 起填写）
- [docs/TEST_CHECKLIST.md](docs/TEST_CHECKLIST.md) — 测试清单
- [docs/CHANGELOG.md](docs/CHANGELOG.md) — 阶段完成记录
- [docs/HANDOFF.md](docs/HANDOFF.md) — 当前交接文档
