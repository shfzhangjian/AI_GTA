# 交接文档（Handoff）— 玥玥星球 · 海战/渡运/音效/防重叠批次

> 交接时间：本轮任务**被用户叫停**时（任务A~D 完成，任务E 进行中，任务F/G/H 未开始）。
> 基线 git：`1fc7677`（本批次全部未提交改动已入库为此 commit；工作树干净）。
> 上一份交接：`docs/handoff.md` 的旧版已覆盖为本文件（旧内容全部已合入更早 commit）。
> **唯一事实来源仍是 `docs/progress.md`**（本文件只补充「本轮做到哪、怎么继续」）。

---

## 0. 本轮用户需求（原始表述，逐项对照）

| # | 需求 | 状态 |
|---|---|---|
| A | 音效 | ✅ 完成（AudioFx 程序化合成 + 全事件接线 + 手势解锁） |
| B | 每大陆只有一个城堡 | ✅ 完成（PortManager 按大陆中心去重降级） |
| C | 城堡和民居分开不重叠 | ✅ 完成（PORT_LAYOUT 移除墙圈内民居） |
| D | 民居随机散落每岛，与岛民数一致 | ⚠️ 部分（PortManager 注释指位；**CivilianManager 未创建**） |
| E | 船体摇摆流畅 | 🔶 进行中（SeaSwell 平滑参数已入 config；管理器接入未完成，见 §3） |
| F | 船↔船避让 | 🔶 半接入（ShipManager 已有 `_avoidShips`；FerryManager 有但断言待同步） |
| G | 岛民/小动物不能走到海边 | 🔶 核心已做（shoreSafe 已接线 10 处；断言 2 条待修，见 §4 已知失败） |
| H | 全量门禁 + build + 提交 | 🔶 build 通过、已 commit；**npm test 有 2 断言失败** |

更早批次（已在 git 历史，本轮**不要重做**）：
- 海盗船 AI（不载客、随机游历、发现→追踪→开炮）、DamageSystem.applyRepair、
  CombatFx（炮口闪光/弹道/炸点/三级着火/修理环）、渡轮到岸停下 + 乘客步行上下船、
  船只头顶 HUD（HudLayer.js：血条/客数/修理标记）、吃水线修复（DRAFT > ROUTE_LIFT）+ 海浪升沉。
  详见 progress.md §0.1~§0.4。

---

## 1. 如何运行 / 铁律（不变）

```bash
export PATH="$HOME/.local/bin:$PATH"        # node/npm 在 ~/.local/bin，不在默认 PATH
cd /Users/mac/Documents/games/threejs-pirate-planet
npm run dev          # → http://127.0.0.1:5317/（绝不能用 5199）
npm test             # 全静态门禁（语法/shader/TDZ/world/ships/camera/systems/characters/pets-ferry/castle/imports）
npm run build        # vite 打包验证
```

**铁律（违反必翻车，历史事故均入 progress.md §5）**：
1. **禁止浏览器/截图测试**——只允许静态检查（用户红线）。
2. **const 暂时性死区**：main.js 初始化顺序 = 依赖顺序（occupancy 必须先于全部 Manager）。
3. 球面数学只走 `GeoUtils`；落位只走 `TerrainSampler`；模型修正只走 `ModelUtils.MODEL_SPECS`。
4. 船姿态必须「**先定向后摇浪**」：align 之后用 **quaternion.multiply（右乘）** 叠加 tilt。
5. 双轴横摇限幅 3°/轴 → 合成 4.24°；断言阈值 5° / 0.085（unit-ships）。
6. 渡轮靠岸停泊在 **route.to/route.from 对象**（不是新坐标）——下船者 home 必须等于它。
7. 音频必须等首次手势 `audio.resume()`（浏览器自动播放策略）。

---

## 2. 本轮新增/改动文件

| 文件 | 状态 | 职责 |
|---|---|---|
| `src/utils/AudioFx.js` | ✅ 新 | WebAudio 程序化音效（海浪/海鸥/开炮/呼啸/爆炸/脚步/修理叮当），零资产文件 |
| `src/world/SeaSwell.js` | 🔶 改 | `SWELL.TILT_SMOOTH_SECONDS = 0.75` 已入 config；`waveTilt` 注释已改 3° |
| `src/world/ShipManager.js` | 🔶 改 | 记录含 `tiltCur:{roll,pitch}`；`_place(ship,time,dt)` 链已通；模块级 `smoothTiltFor(ship,target,dt)` 已定义（`_place` 里调用名待核对）；`_avoidShips(dt)` 船↔船避让已实现 |
| `src/world/FerryManager.js` | 🔶 改 | `tiltCur` 已入记录；`smoothTiltFor(ferry,...)` 模块级已加；`_avoidShips` 已加；shoreSafe 下船已接 |
| `src/world/PortManager.js` | ✅ 改 | build() 按 CONTINENTS 中心最近邻分大陆，同大陆第 2+ 个 major → 降级 small（去方形城墙圈）；`CASTLES_PER_CONTINENT=1`；**墙圈内民居已全部移除（任务C）** |
| `src/config.js` | ✅ 改 | `SHIPS.CASTLES_PER_CONTINENT:1` / `TILT_SMOOTH_SECONDS:0.75` / `SHIP_AVOID_RADIUS:13` / `SHIP_AVOID_STEER:1.4`（去重后只剩一份） |
| `src/world/WalkerBase.js` + `CharacterManager` / `PetManager` / `FerryManager` 调用点 | ✅ 改 | `shoreSafe:true`（10 处）：出生/漫步目标过 `isWalkerAllowed`/`nearestShorePoint` |
| `src/world/TerrainSampler.js` | ⚠️ 遗留 | `continentOf` BFS 版（**已证伪**：高度场连续 → 六港全同 id；勿再依赖，PortManager 用的是自己的中心法）；`shoreDistance/isWalkerAllowed/nearestShorePoint/nearestLandPoint` 是本轮可用原语 |
| `scripts/unit-characters.mjs` | ✅ 改 | 「角色可重复」断言改鸽巢语义（最多者 ≥2 份），44/44 过 |
| `scripts/unit-pets-ferry.mjs` | 🔶 改 | 新断言框架（paxLegDock 逐帧捕获 land 步行者）；**当前 2 断言失败，见 §4** |

---

## 3. 任务 E（船体摇摆流畅化）— 未完成部分

**已完成**：config 参数（TILT_SMOOTH_SECONDS 0.75）、SeaSwell 注释统一、
`tiltCur` 字段、`smoothTiltFor(ship/ferry, target, dt)` 模块函数（两处文件都定义了）。

**未完成 / 需核对**：
1. **调用名一致性**：`ShipManager._place` / `FerryManager._place` 里实际调用名必须 = `smoothTiltFor`
   （历史上有 `smoothstepDeg`/`smoothTilt` 拼写漂移，每次改前先 grep）：
   ```bash
   grep -n "smoothTilt\|smoothstepDeg\|smoothTiltFor" src/world/ShipManager.js src/world/FerryManager.js
   ```
2. **dt 必须传到 `_place`**：`_place(x, time, dt)` 三处调用点（update 循环 + build 初始）都补 `dt`
   （build 时 `this._place(ferry, 0, 1 / 60)`）。
3. **验收标准（静态）**：
   - `npm test` 的 unit-ships「船顶朝外 <5°」「船头在切平面 <0.085」必须过；
   - 新增断言建议（unit-ships）：连续帧 tilt 差 `|tiltCur(t)-tiltCur(t-dt)| < 0.02 rad`（平滑证明）；
   - tilt 叠加必须是 `object.quaternion.multiply(...)`（右乘）；左乘会把局部 +Y 掀离法线（历史教训）。

**平滑语义**：`k = min(1, dt / TILT_SMOOTH_SECONDS)`；`tiltCur += (target - tiltCur) * k`。
目标值 = `waveTilt(lat,lon,time)`（单轴限幅 3°，双轴合成 ≤4.24°）。

---

## 4. 任务 G 已知测试失败（2 断言）——接手必修

`scripts/unit-pets-ferry.mjs`：
```
XX  f0 中途放客（乘客步行下船完成）  全局 landed=4
XX  靠岸后持续上/下船（统计推进）  boarded=18 landed=4
```
**注意：`landed=4/18` 说明放客机制在工作（全局 4 人下船成功，随后统计冻结）**，失败在「f0 的 pax0 成员」身上。已排除：SB 岸合法（isWalkerAllowed true）。

**待验证根因清单（按嫌疑排序）**：
1. **pax0 在首航被「直接登船」（`_boardAt(walking=false)`）→ 从未进过 walkers**；f0 第一次到 GH 港时 pax0 全部转 `queue='land'` 进 walkers —— 测试 `prev` 快照是 update **前**抓的，`_arrive` 发生在 update **内** → `before` 快照里没有它们 → 理论应捕获。请逐帧打印 `f0.walkers.map(w=>[w.queue, pax0.includes(w.ref)])` 定位捕获为何落空。
2. 步行下船可能中途被 `dir.lengthSq() < 1e-9`（切平面退化）或 `_dropWalker` 异常丢弃 → 检查丢弃计数。
3. `pax0` 全员是否真的被 f0 载着（`chars.build` 后「直接登船」按 home 抓人 → pax0 home=GH? 而 f0 首停是 GH? 对照 `ferries.ferries[0].route = lines[1] = GH→TI`）。

**修复纪律**：只改测试断言或 FerryManager；不许动「停泊港 = route.to 对象」语义（历史断言 `home === route.to` 已因此被改写为「home 是解析港对象 + 落点近家港」，别再退回旧断言）。

---

## 5. 任务 D（民居随机散落每岛）— 未开始部分

**设计已定（§41 规划），缺实现**：
1. 新建 `src/world/CivilianManager.js`：
   - 输入：`resolvedPorts`（含解析落点）、`sampler`、`occupancy`、`assets`。
   - **每岛民居数 = 该岛岛民数**（岛民数 = `CharacterManager.characters` 中 `home === 该港` 的数量，或 `CHARACTERS.PER_PORT` 常量）。
   - 落位：`findClearSpot(..., { home: 该港, spreadDeg: 14, shoreSafe: true, occupancy, clearRadius: 3.2, includeSelf: true })` → 与树/城堡/人互不重叠。
   - 每栋 = `structure` + `structure-roof` **同点位成对**（完整房子）；`alignObjectToSurface` 贴地；挂 `sceneManager.buildings`（或新 `sceneManager.houses` 层，需在 SceneManager 加）。
   - 民居**必须落在墙圈外**：占用避让 PortManager 已注册的占地（PortManager build 在前，见 main.js 建造顺序：ports → nature → characters → pets → ferries）。
2. `main.js` 实例化 + `civilian.build(resolvedPorts)`（ports 之后）。
3. 断言（新 unit 脚本或并入 unit-castle）：民居数 = 岛民数、与建筑占用点距离 ≥ clearRadius、不临海（isWalkerAllowed）。

**PortManager 里已留注释**：「民居散落职责由 CivilianManager 承担」（grep `CivilianManager`）。

---

## 6. 音效（任务A 已完成，勿重建）

- `src/utils/AudioFx.js`：纯 WebAudio 合成（无 mp3/无资产），
  API：`resume()` / `cannon()` / `cannonWhiz()` / `explosion()` / `footstep(bool)` / `repairPing()` / `clear()`。
- 接线：`main.js` `const audio = new AudioFx()` → 注入 `ships`/`ferries` 构造；
  解锁：`canvas.addEventListener('pointerdown', () => audio.resume())`（文件已含）。
- 事件点：开炮/命中（ShipManager `_fireCannon`/settle）、上下船脚步（FerryManager `_boardAt`/`_finishWalk`）、修理开修（`_startRepair`）。
- 调试：`__debug.audio.summary()` → `{unlocked, enabled}`。

---

## 7. 当前测试门禁基线

```
PASS 语法全通过 (34 文件)
PASS 静态 shader 检查通过
PASS 入口初始化顺序（TDZ）+ import 全通过（50 顶层声明 / 120 引用）
PASS 单元测试全通过 (21)
PASS 船队单元测试全通过 (18)
PASS 相机视角单元测试全通过 (14)
PASS 玩法系统单元测试全通过 (33)
PASS 小人单元测试全通过 (44)
FAIL 动物+渡轮单元测试 2/34 失败        ← §4 的 2 条（接手第一优先）
PASS 方形城墙布局单元测试全通过 (16)
（import 图门禁被上面 FAIL 短路，修好后自动续跑）
npm run build：✓ built（974ms）
```

---

## 8. 接手行动顺序（建议）

1. **修 §4 的 2 条断言** → `npm test` 全绿（含 castle/imports 门禁复跑）。
2. **完成任务 E**：按 §3 清单 grep 核对调用名/签名，补 unit-ships 平滑断言。
3. **任务 D**：按 §5 建 CivilianManager + main 接线 + 断言。
4. **任务 H 收尾**：`npm test` + `npm run build` 全绿后 commit（消息含「本轮任务A~H 完成」），
   同步更新 `docs/progress.md`（§0 结果 + 新教训进 §5）。
5. 浏览器验收由**用户在本机**做（硬刷新 http://127.0.0.1:5317/）；我们不开浏览器。

---

## 9. 关键数值速查

| 常量（config.js） | 值 | 用途 |
|---|---|---|
| `SHIPS.DRAFT_SHIP / DRAFT_FERRY` | 1.1 / 0.55 | 吃水（须 > ROUTE_LIFT 0.55 否则悬浮） |
| `SHIPS.TILT_SMOOTH_SECONDS` | 0.75 | 摇摆平滑时间常数 |
| `SHIPS.SHIP_AVOID_RADIUS / STEER` | 13 / 1.4 | 船↔船避让半径/转向 |
| `SHIPS.CASTLES_PER_CONTINENT` | 1 | 每大陆城堡数（任务B） |
| `SHIPS.FIRE_LEVELS` | [0.3,0.55,0.8] | 着火分级 |
| `SHIPS.REPAIR_DOCK_SECONDS / HP_PER_SECOND` | 9 / 5 | 修理 |
| `PLANET.SHORE_MIN_HEIGHT / SHORE_BUFFER_UNITS` | 0.6 / 6 | 海岸禁入（任务G） |
| `SeaSwell.SWELL.TILT_MAX_DEG` | 3.0 | 单轴限幅（双轴合成 4.24°） |
| `FERRY.DOCK_SECONDS / CAPACITY` | 10 / 5 | 停泊/载客 |

**单位陷阱**：`_degDist` 用「度」、步行/避让距离用「世界单位」（1°≈1.745 单位）——混用必翻车（历史 bug）。
