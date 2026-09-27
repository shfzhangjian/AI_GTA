# 进度记录 — threejs-pirate-planet

> 本文件是「已完成 / 未完成 / 已知问题 / 如何运行」的唯一事实来源（§41）。
> 最后更新：**玥玥星球更名 + cube-pets 小动物 + 防穿模占地 + 渡轮跨港摆渡（每次 5 人）+ 城堡零件整合**。

---

## 0. 如何运行

```bash
export PATH="$HOME/.local/bin:$PATH"        # 本机 node/npm 在 ~/.local/bin，不在默认 PATH
cd /Users/mac/Documents/games/threejs-pirate-planet
npm install          # 首次；之后增量约 1s（已有 package-lock.json，可离线）
npm run dev          # → http://127.0.0.1:5317/
npm test             # ★ 全部静态检查（语法 / shader / 球面 / 船 / 相机 / 玩法 / 小人 / 动物渡轮 / import），不开浏览器
```

`npm test` 当前结果（全静态，无浏览器截图）：

```
PASS 语法全通过 (30 文件)
PASS 静态 shader 检查通过（未发现未声明标识符）
PASS 单元测试全通过 (21)              ← 球面数学 + 球面站立 + 地形落位
PASS 船队单元测试全通过 (18)           ← 沿球面水路航行 + 姿态 + 航线不穿球
PASS 相机视角单元测试全通过 (14)        ← 全球镜头对球心 + RTS 视角绕球不翻
PASS 玩法系统单元测试全通过 (33)        ← 实体注册/查询 + 伤害 + 灾害生命周期
PASS 小人单元测试全通过 (43)            ← mini-characters 防呆 + 蒙皮克隆独立 + 走动
PASS 动物+渡轮单元测试全通过 (33)        ← cube-pets + GroundOccupancy + 渡轮载 5 人跨港
PASS import 图全通过 (30 文件 / 117 引用)
```

git 基线：`91245ce`（岛民）→ `cd6ef84`（可见性链路修复）→ 本轮（cube-pets / 渡轮 / 城堡整合）。

---

## 0.1 本轮（用户 5 项需求，全部落实）

### ① 左上角更名「玥玥星球」（index.html title + HUD）

### ② cube-pets 小动物上球走动（kenney_cube-pets_1.0）
- 资产：24 GLB（实测非蒙皮骨骼层级 + 各自独立第三张 colormap.png）→ `public/assets/cube-pets/`
  + `src/assets/manifest-cube-pets.json`（`npm run gen:pets-manifest` 可再生，含蒙皮包围盒算法）。
- `PET_SPECS`（ModelUtils）：unit 0.8~1.2 → 动物高 ≈1.3~2.2 世界单位（小人 ≈2.2~2.6，cube-pets 本就 ≈1:1 小宠比例）。
- `PetManager`（src/world/）：20 物种 × ≥2 只 + 26 只随机补足 = **66 只**；大圆弧漫步 + idle/walk/run 状态机
  + AnimationMixer（idle/walk/run clip）；独立 `SceneManager.animals` 层；实体 `type:'pet'`。
- 悬停显示中文名（小猫 · 味噌…）；HUD 显示「动物 66」。

### ③ 防穿模（落位共享占用网格）
- 新文件 `src/world/GroundOccupancy.js`：球面弧长距离（世界单位）判定；
- 新文件 `src/world/WalkerBase.js`：`findClearSpot / pickNextLegSpot`（角色/动物共用）。
- 接入：PortManager 建筑落位注册占地（塔 3.4u / 码头 1.6u / 炮 1.1u）；NatureManager 树 1.6~2.4u、岩石 ~1.5u；
  TerrainSampler.scatter 支持 occupancy 过滤；角色 CLEAR_RADIUS 2.2u、动物 2.4u → **出生点与行走目标都避开建筑/树/岩石/同伴**。

### ④ 渡轮跨港摆渡（每次载入 5 个）
- 新文件 `src/world/FerryManager.js` + `config.FERRY`（CAPACITY=5、MODEL=boat-row-large、DRAFT=0.5）。
- 2 艘渡轮沿现成水路航线循环：A 岸载满 ≤5 人（角色优先、动物补位）→ 开往 B 港 → 中途放客
  （下船者 `home` 改指新港 = 融入新港）→ 绕圈回 A 再补客。
- 上船者：隐藏 + `onFerry` 标记 → CharacterManager/PetManager update 中**暂停其走动**；下船走 `findClearSpot` 落空地。
- 渡轮姿态同船队（UP=法线/FORWARD=切线）；HUD 显示「渡轮 2」；`__debug.ferries.summary()` 看板载/累计上船/下船数。

### ⑤ 城堡零件拼成「一个整体」
- 港口布局重做（PortManager PORT_LAYOUT）：
  **主塔 = tower-base-door + tower-middle + tower-middle-windows + tower-top + tower-roof 五层同点位堆叠**
  （`stack:` 字段 = 沿表面法线抬升，按实测层高 × unit 精确计算：3.92/7.92/11.84/17.36）；
  两侧角楼各 3 层（base+top+roof）；民居 = structure+structure-roof 同点位成对；
  删掉散落独立的 tower-complete/tower-watch 摆放（零件塔替代）。
- 主港要塞群：主塔 + 城门（castle-gate）+ 环抱城墙（castle-wall×2 + castle-window×2）+ 角楼 ×2 + 民居 ×4；
  小港 = 一座三层小塔 + 民居 ×2 + 码头。
- `MVP_MODELS` 补齐零件（tower-base/-door/-middle/-windows/-top/-roof、castle-window）。

### ⑥ 方形城墙（用户要求「城堡围成方形城墙效果」，随后「长宽至少加大 2 倍」）
- 城墙尺寸：主港 **34×26**、小港 **22×18** 世界单位（首版 17×13 / 11×9 的 2 倍）；
  R=100 下主港墙圈 ≈19.5°×14.9° 经纬度 → 星球上「有分量的要塞」。
- ⚠ 连带改动 `resolvePortsOnLand`（config.js）：墙圈放大后很多设计点（如 Golden Harbor
  34,146）半径内放不下整圈 → 港口解析改为「**整块墙圈矩形必须完整落在陆地**」
  （每 2 单位采样 minH>0.05，偏好墙圈尽可能高），六港实测 minH 4.0~4.4 全陆地
  （Golden Harbor 迁移 46 单位到 (12,130)、Turtle Island 到 (-12,-20) 的大块陆地，
  航线/渡运/Mini Globe 用的都是解析后的落点，自洽）。
- 墙内重排：主塔移墙圈正中（y=13）、民居 4 栋进大门两侧墙内 + 后院、大炮守门内侧、
  角楼旗/三角旗随角楼坐标（±17）。

- `PortManager.squareWallLayout(rect)` 程序化城墙生成器：沿矩形周长铺
  **castle-wall / castle-window（每第 3 块换窗墙做变化）**，间距 = 实测墙宽
  （castle-wall 2×unit2.2 = 4.4 世界单位 → 无缝相接），**四角各一座三层角楼**
  （tower-base+top+roof stack 一体），**南面（朝海侧）正中 castle-gate 大门**，
  门洞两侧墙段咬合。主港 17×13 单位墙圈（≈9.7°×7.4°）+ 主塔居中；
  小港 11×9 单位小墙圈。城墙/角楼坐标实测全部坐在陆地上（六港 wall minH > 0.5）。
- 新测试 `scripts/unit-castle.mjs`（16 断言）：四角楼坐标、四边墙存在、南墙被门打断、
  墙间距无大缺口（≤门宽+墙宽+1）、同点位 stack 递增（堆叠成整体）、主塔 5 层一体、大门朝南。

### ⑦ 致命修复：occupancy 暂时性死区（TDZ）（用户复核指出）
- **根因**：`main.js` 里 `const occupancy = new GroundOccupancy(...)` 排在
  `new NatureManager({ ..., occupancy })` / `new PortManager({ ..., occupancy })` **之后**。
  `const` 有暂时性死区 → 页面启动即 `Cannot access 'occupancy' before initialization`，
  世界构建 / 角色加载全部中断 → 表象是「角色不上球 / 地图空白」，与角色本身无关。
- **修复**：`occupancy` 提前到所有使用它的 Manager 之前（声明顺序 = 依赖顺序）。
- **顺手修**：加载提示文字与加载顺序错位（先小动物后岛民，提示曾先「岛民」被「小动物」覆盖）→ 已按实际顺序重排。
- **门禁**：新增 `scripts/check-init-order.mjs` 进 `npm test`（紧跟 shader 检查）——
  扫描 main.js 顶层语句：顶层 const/let/class 的「首次顶层引用行」早于声明行即报 TDZ 违例；
  负向验证：对出错版 main.js 精确报出 58/59 行两处违例（当年 bug 必被拦下）。
  ⚠ 该类错误静态单测永远抓不到（单测各自 import 模块、从不执行 main.js）——入口文件必须单独设门禁。

### 测试
- `scripts/unit-pets-ferry.mjs`（33 断言）：GroundOccupancy 弧长换算（1°≈1.745u）、20 物种全出场、
  出生避开建筑避让圈、行走目标不被占用、渡轮每次 ≤5 且出发载满、上船隐藏、中途放客 home 切换新港、
  下船落点距新港 <10°、回 A 港补客、姿态 UP=法线、移动不穿球、clear 归还可见。
- 52 个 mini/pets 资产 URL HEAD 全 200；vite build 通过。
---

## 0.3 上轮：kenney_mini-characters 陆地小人

**需求**：减少树木密度；读取下载目录 `kenney_mini-characters`；按比例在陆地增加人物模型，在陆地走动。

### 资产（实测，勿虚构）
| 路径 | 说明 |
|---|---|
| `~/Downloads/kenney_mini-characters/Models/GLB format/` | 26 个 `.glb`（12 角色 + 4 轮椅 + 10 道具 aid-*）+ `Textures/colormap.png`（**独立图集**，与 pirate 图集是两张图）|
| `public/assets/mini-characters/` | 已拷入项目 |
| `src/assets/manifest-mini-characters.json` | `scripts/gen-manifest-mini-characters.mjs` 生成：真实路径 + 场景级包围盒 + tris + 动画名 |

⚠ 关键实测：角色是 **GLTF 蒙皮模型**（joints = root/leg-left/leg-right/torso/arm-left/arm-right/head）。
POSITION accessor 只是绑定姿势（读它算包围盒会得到错的尺寸），生成器沿 **joint 链矩阵**变换得真实尺寸：
角色高 ≈0.67~0.78、底面对齐 baseY=0。每模型自带 32 条动画（walk/sprint/idle/…/wheelchair-sit/wheelchair-move-forward）。

### 比例（`ModelUtils.MINI_CHARACTER_SPECS`）
`unit 2.6` → 小人高 ≈1.7~2.0 世界单位；对比棕榈 ≈7、建筑 5~7、船长 13~17。
棕榈 900 → **220**、岩石 420 → **120**、草 700 → **200**（树木密度下调，视觉空间留给小人）。

### 行为（`src/world/CharacterManager.js`）
- **落位**：走 TerrainSampler 高度场 + `nearestBuildable` + 坡度 ≤18° → 贴地不悬浮不陷地、不进海、不上峭壁。
- **走动**：与船队同款球面范式——目标点 = 半径 3~11° 内随机可建造点，位置沿**大圆弧** `offsetAlongGreatCircle` 推进；`UP=表面法线`、`FORWARD=行进切线`（`alignObjectToSurface`）。
- **状态机**：idle（站桩 1.2~4.5s）→ walk（0.9~1.7 u/s，8~30% 概率 sprint 2.4~3.4）→ 循环。
- **骨骼动画**：`AnimationMixer` + 共享 clips；⚠ 实测 walk 的 `root.translation` 仅 ±0.05 **原地起伏**（无 root motion）→ 位移由 CharacterManager 驱动，动画只管四肢；淡入淡出切姿，进入 `reset()` 从头播（永远迈左脚）。
- **数量**：`max(TOTAL 24, PER_PORT 4 × 6 港) = 24 人`（≥20，用户要求）；前 12 人按池内轮转发牌 → **12 个角色全部出场**，其余随机重复（用户允许重复）。蒙皮角色无法 InstancedMesh，24×3 mesh ≈ 72 drawCalls。
- ⚠ **轮椅不上球**（用户要求）：`WHEELCHAIR_MODELS` 已从 config/main 移除，`loadMiniCharacters` 只加载 12 个站立角色；CharacterManager 无 isChair/sit 逻辑。
- **交互**：悬停岛民显示「杰克 · 行走中」`Interaction.bindCharacters()`；实体注册 `type:'character'`（不可伤害）。

### 工程修复（用户复核后确认的关键点，全部落实）
1. **蒙皮克隆必须用官方 `SkeletonUtils.clone`**（`three/addons/utils/SkeletonUtils.js`）：
   `Object3D.clone/copy` 复制 `SkinnedMesh.skeleton` 只是**共享引用**，克隆体骨骼仍指向原始
   GLTF scene 的关节节点 —— 原始层级被 normalizeModel 搬走 / 多实例复用后骨骼变换互相覆盖，
   表现为「角色不显示 / 挤在原点 / 动画不动」。`cloneNormalizedModel`：检测到 SkinnedMesh →
   `SkeletonUtils.clone`（重建独立 Skeleton + bones 映射到克隆内关节 + rebind）。
   单测「蒙皮克隆独立性」5 断言为回归防线（**动 A 骨骼不能影响 B 的世界坐标**）。
2. **新增角色三处登记**（只加 MVP_MODELS 不会加载岛民——角色走独立 CHARACTER_MODELS 链路）：
   ① `npm run gen:mini-manifest`（清单 + 拷贝资产）② `config.js CHARACTER_MODELS` ③ `ModelUtils.MINI_CHARACTER_SPECS`。
3. **独立 `SceneManager.characters` 层**：小人不再裸挂 world（显隐 / LOD / 调试有抓手）。
4. mini 角色贴图与 pirate 图集是**两张不同 colormap.png** → `loadMiniAtlas()` 拆分加载。
5. 走路起伏只加在**渲染半径**上、不参与高度反解（防正反馈）。
6. **角色 unit 2.6→3.3**（高 ≈2.2~2.6 世界单位，RTS 镜头下不被地形吞）+
   **头顶金色四面体标记**（`depthTest:false` 恒可见）；重名岛民自动编号（杰克 / 杰克 II）。

### ⑥ 方形城墙（用户要求「城堡围成方形城墙效果」，随后「长宽至少加大 2 倍」）
- 城墙尺寸：主港 **34×26**、小港 **22×18** 世界单位（首版 17×13 / 11×9 的 2 倍）；
  R=100 下主港墙圈 ≈19.5°×14.9° 经纬度 → 星球上「有分量的要塞」。
- ⚠ 连带改动 `resolvePortsOnLand`（config.js）：墙圈放大后很多设计点（如 Golden Harbor
  34,146）半径内放不下整圈 → 港口解析改为「**整块墙圈矩形必须完整落在陆地**」
  （每 2 单位采样 minH>0.05，偏好墙圈尽可能高），六港实测 minH 4.0~4.4 全陆地
  （Golden Harbor 迁移 46 单位到 (12,130)、Turtle Island 到 (-12,-20) 的大块陆地，
  航线/渡运/Mini Globe 用的都是解析后的落点，自洽）。
- 墙内重排：主塔移墙圈正中（y=13）、民居 4 栋进大门两侧墙内 + 后院、大炮守门内侧、
  角楼旗/三角旗随角楼坐标（±17）。

- `PortManager.squareWallLayout(rect)` 程序化城墙生成器：沿矩形周长铺
  **castle-wall / castle-window（每第 3 块换窗墙做变化）**，间距 = 实测墙宽
  （castle-wall 2×unit2.2 = 4.4 世界单位 → 无缝相接），**四角各一座三层角楼**
  （tower-base+top+roof stack 一体），**南面（朝海侧）正中 castle-gate 大门**，
  门洞两侧墙段咬合。主港 17×13 单位墙圈（≈9.7°×7.4°）+ 主塔居中；
  小港 11×9 单位小墙圈。城墙/角楼坐标实测全部坐在陆地上（六港 wall minH > 0.5）。
- 新测试 `scripts/unit-castle.mjs`（16 断言）：四角楼坐标、四边墙存在、南墙被门打断、
  墙间距无大缺口（≤门宽+墙宽+1）、同点位 stack 递增（堆叠成整体）、主塔 5 层一体、大门朝南。

### ⑦ 致命修复：occupancy 暂时性死区（TDZ）（用户复核指出）
- **根因**：`main.js` 里 `const occupancy = new GroundOccupancy(...)` 排在
  `new NatureManager({ ..., occupancy })` / `new PortManager({ ..., occupancy })` **之后**。
  `const` 有暂时性死区 → 页面启动即 `Cannot access 'occupancy' before initialization`，
  世界构建 / 角色加载全部中断 → 表象是「角色不上球 / 地图空白」，与角色本身无关。
- **修复**：`occupancy` 提前到所有使用它的 Manager 之前（声明顺序 = 依赖顺序）。
- **顺手修**：加载提示文字与加载顺序错位（先小动物后岛民，提示曾先「岛民」被「小动物」覆盖）→ 已按实际顺序重排。
- **门禁**：新增 `scripts/check-init-order.mjs` 进 `npm test`（紧跟 shader 检查）——
  扫描 main.js 顶层语句：顶层 const/let/class 的「首次顶层引用行」早于声明行即报 TDZ 违例；
  负向验证：对出错版 main.js 精确报出 58/59 行两处违例（当年 bug 必被拦下）。
  ⚠ 该类错误静态单测永远抓不到（单测各自 import 模块、从不执行 main.js）——入口文件必须单独设门禁。

### 测试
`scripts/unit-characters.mjs`（43 断言，**假资产 = 真 Bone/SkinnedMesh/Skeleton 层级**，instance 走真实 `cloneNormalizedModel`）：清单防呆、比例区间、UP=法线（含南半球）、贴地误差、不走海/不穿球、状态机、mixer 驱动 root、**蒙皮克隆独立性**、独立层 + 头顶标记、clear 后 update 不抛错。
新增 `scripts/check-imports.mjs` 进 `npm test` 尾门禁（src 全部 import 可解析）。
另用 `vite build` + dev server HEAD（26 资产 + 贴图全 200）做非浏览器验证。

---

## 0.5 本轮读代码发现的变化（相对上次交接，已通读并纳入认知）

代码在交接后被进一步扩展。以下均已读源码确认，并已补对应静态单测。

### 新增 `src/world/systems/`（玩法扩展层，见 `docs/extension-architecture.md`）
| 文件 | 职责 | 接入点 |
|---|---|---|
| `EntityRegistry.js` | 世界实体索引 `register/get/query({type,tag,damageable})`；系统间靠查询解耦 | `main.js` 实例化并注入 Port/Ship 管理器 |
| `DamageSystem.js` | 统一破坏入口 `applyDamage` / `applyRadialDamage`（距离衰减）/ `spawnImpact` 冲击环（随时间回收） | 挂 `sceneManager.world`；主循环 `damageSystem.update(dt)` |
| `EnvironmentEventSystem.js` | 局部天气/灾害 `rain/tornado/tsunami/meteor`：生命周期 + 视觉 + 调 DamageSystem 造伤 | 控制台 `__debug.environment.trigger('meteor',{lat,lon,radius,damage})` |

PortManager / ShipManager 已登记实体（`type:'ship'/'building'`、`damageable:true`）。新增 `scripts/unit-systems.mjs`（33 断言）覆盖之。

### `RouteManager` 重大升级（+236 行）：直线大圆 → **水路 A\* 寻路**
- 新增 `_buildWaterPath / _findWaterNodes`（A*，格宽 4°）、`_nearestWater`、`_isWater`、`_waterSegmentClear`、`_coastPenalty`（贴岸罚）、`_relaxPath`（拉直拐点）、`_smoothPath`（逐段大圆平滑）。
- 航线现在**绕开陆地走海面**；`sampleAt` 支持多段 `segmentLengths` 沿线取位与切线。
- `constructor` 新增 `sampler` 依赖，`main.js` 已传 `new RouteManager({ sceneManager, sampler })`。

### `CameraManager`：局部视角改为 **RTS 式斜俯视**（+75 行）
- `LOCAL` 不再直盯球心，而把 `state.lat/lon` 当「**镜头关注的地表点**」，相机在其**后上方**按 `pitch`（默认 52°，区间 34–68°）斜看地表。
- 新增 `moveLocal(forwardStep, rightStep)`（WASD / 镜头按钮用）；拖拽在 LOCAL 下改 `yaw` 环视 + `pitch` 俯仰；`flyTo` 插值 `pitch`。
- `up`：LOCAL 用关注点表面法线（绕球不翻），GLOBE 用世界 +Y。
- **单测判据已同步更新**：旧版「LOCAL 对准球心 <0.01°」已过时 → 新判据「**镜头射线必命中星球地表**（画面有地面）+ `camera.up ≈ 表面法线` + 跨极点不突变」。

### UI / 交互新增（`index.html` + `main.js`）
- 右下 **📷 镜头控制面板**（仅 LOCAL：▲▼◀▶ 平移 + ＋－ 缩放，长按连发）。
- **WASD** 平移局部视角；**双击星球**从全球飞入该点局部视角（raycast 命中 ocean/land）。

### 常量调整（`config.js` / `ModelUtils` / `Planet`）
`SHIP_DRAFT 0.45→0.38`、`CLOUD_RADIUS 106→136`、`ATMOSPHERE_RADIUS 108→156`、`LOCAL_ALT_MAX 46`、`FOV_LOCAL 60`；船模 `unit` 整体下调约 12–14%（`ship-pirate-large 2.2→1.9` 等）；`Planet.mist` 半径 `R+1.4→R+24`。

---


---

## 1. ⚠️ 关于 Kenney 资产路径（回答用户提问）

| 路径 | 状态 |
|---|---|
| `~/Desktop/kenney_pirate-kit` | ❌ **不存在**（这是提示词里假定的路径，实测不存在） |
| `/Users/mac/Downloads/kenney_pirate-kit` | ✅ **实际位置**，72 个 `.glb` |
| `public/assets/pirate-kit/` | ✅ 已拷入项目（72 glb + `Textures/colormap.png`，3.0 MB） |
| `src/assets/manifest.json` | ✅ 由扫描生成：每个模型的**真实路径 + 尺寸 + 三角面** |

**为什么船一开始没上球（根因，已修复）**

船模**一直被正确加载**（`MVP_MODELS` 含 6 个 `ship-*`，控制台 `已加载 30/30`），但：

1. **没有任何代码把它摆到场景里** —— `src/world/` 下当时只有 `TerrainSampler / InstancedPropLayer / NatureManager / PortManager`，**`ShipManager.js` 与 `RouteManager.js` 根本不存在**；港口布局里只放了 `boat-row-small`（小舢板，尺寸小、贴港，远看几乎看不见）。
2. 换句话说：**船从未被实例化、从未被放到球面、从未被赋予航线**。这是遗漏，不是渲染问题。

**修复**：新建 `src/world/RouteManager.js`（港口间大圆弧航线）+ `src/world/ShipManager.js`（船队沿弧线航行），并在 `main.js` 的 `buildWorld()` 里 `routes.build(ports.ports)` → `ships.build()`，主循环 `ships.update(dt, time)`。
现在船队 6 艘（海盗船 ×4 + 商船 ×2），名字如 Black Pearl / Sea Serpent，各自沿港口航线航行，HUD 显示「船 6」。

---

## 2. 相机需求返工（用户明确要求，已实现并单测）

### ① 「镜头对着星球中央」
- **GLOBE**：相机 `lookAt(0,0,0)`，距离由 `fitGlobeToView()` **按视口 + FOV 反算** → 任何窗口大小都「居中 + 完整装下」（实测占比 ~87%）。
- **LOCAL**：同样 `lookAt(0,0,0)` → 星球始终在画面正中。
- 飞行动画**去掉了 `sin(e)*arc` 弧线抬升**（它曾把相机甩远到 ~390，造成星球甩偏）。
- 单测断言：`相机正对球心（<0.01°）` 对 GLOBE / LOCAL / 任意高度全部通过。

### ② 「局部视角要类似 RTS 视角」（这是之前「画面怼成地平线」的真正根因）
- 旧代码局部视角把相机 **UP 设成世界 +Y**。相机绕球运动时，UP 与实际表面法线脱节 → 画面**翻成地平线 / 在极点突变翻转**。
- 现在：**LOCAL/FOLLOW 的相机 UP = 相机所在点的表面法线**（`camera.up = normalize(camera.position)`）→「头顶朝天、脚下朝球心」，绕全球 360° 不翻。
- GLOBE 仍用世界 +Y（北极朝上），并在极区退化时自动换参考轴防 NaN 抖动。
- 高度区间改为 RTS 可用区间：`LOCAL_ALT_MIN 4`（贴地斜视，可见弯曲地平线）↔ `LOCAL_ALT_MAX 46`（垂直俯视港口），默认 `16`；`FOV_LOCAL 60`。
- 单测断言：`UP 始终对齐表面法线`、`全程 UP 贴住法线（无翻转）`、`跨极点无突变`、`任意高度仍对准星球中央`。

---

## 3. 已完成

### Phase 0 资源审计 ✅
72 模型实测尺寸 / UP / Forward / 三角面 / Instancing 适配 → `docs/asset-audit.md`。

### Phase 1 工程骨架 ✅
Scene / Renderer / Camera / 光照 / resize / 动画循环 / Vite。

### Phase 2 星球本体 ✅
真球体：球形海洋 + 程序化陆地（CPU 高度场逐顶点烘焙）+ 云层 + 大气 Fresnel + 星空 + 昼夜 + Mini Globe（右下真 3D，可点击导航）。

### Phase 3 Kenney 模型上球 ✅
| 模块 | 内容 |
|---|---|
| `world/TerrainSampler.js` | **落位唯一入口**：heightAt / positionAt / frameAt / slopeDeg / isBuildable / nearestBuildable / findLandings / scatter。与陆地显示共用同一高度场 → 不悬浮、不陷地 |
| `world/InstancedPropLayer.js` | 通用 InstancedMesh 层 + `bakeInstancedAsset`（模型烘成单一几何，1 DrawCall 数千实例）|
| `world/NatureManager.js` | 棕榈 / 岩石 / 草程序化植被（沿球面法线生长）|
| `world/PortManager.js` | 6 个港口聚落：切空间铺开「港口平面图」→ 塔楼 / 城门 / 城墙 / 民居 / 瞭望塔 / 码头 / 栈道 / 大炮 / 旗帜 / 木桶木箱 |
| `ui/Interaction.js` | 悬停信息（星球自转下**每帧重播 raycast**，否则失效）+ 点击区分拖拽 |

**球面站立铁律已单测**：`alignObjectToSurface` → 局部 +Y == 球面外法线，偏差 < 0.01°；北极 UP≈+Y、南极 UP≈−Y、赤道 UP 水平。

### Phase 4 船队与航线 ✅
- `world/RouteManager.js`：港口间**大圆弧**航线（`createGreatCirclePoints` + 抬升海面 0.55，单测证明**无点穿入地球内部**），可开关、按视角调不透明度。
- `world/ShipManager.js`：6 艘船沿弧线推进（`slerp` 插值，**非 XYZ 直线**）；**UP = 表面法线 + FORWARD = 航线切线**；极轻微 bob / roll / pitch 海浪氛围；`describe()` 供 Phase 7 面板。

---

## 4. 未完成 / 下一步

| 阶段 | 状态 | 待办 |
|---|---|---|
| Phase 5 双视角打磨 | 🟡 基本可用 | GLOBE/LOCAL + 平滑 FlyTo 已有；切换 FOV 动画、贴地「弯曲地平线」调参待打磨 |
| Phase 6 Mini Globe | 🟡 已实现 | 港口 Marker 已有（6 个）；当前区域 Marker 需改为跟随船只；点击导航已通 |
| Phase 7 交互面板 | 🟡 打底完成 | 悬停显示建筑/船/岛民/小动物；**船只信息面板 + Follow Ship 未做**（`ships.describe()` / `characters.describe()` 数据已就绪） |
| Phase 8 打磨与性能 | ⬜ 未开始 | LOD（全球隐藏植被/远处小人）、阴影、海洋 shader 精修、移动端 |
| 扩展（extension-architecture.md） | 🟡 进行中 | ~~CharacterManager~~ ✅ ~~PetManager~~ ✅ ~~FerryManager~~ ✅；WaterFeatureManager、船只海战、任务系统未做 |

---

## 5. 已知问题 / 重要教训（务必保留，避免重犯）

1. **自定义 ShaderMaterial 若引用未声明变量 → GLSL 编译失败 → three 静默回退默认材质**，表现却像「颜色调错」。曾因此白耗多轮（`Ocean.js` 里的 `refl`）。
   ✅ 现在每帧渲染后自动跑 `assets.reportShaderErrors(renderer)`，把 `renderer.info.programs[i].diagnostics` 打到控制台。
2. **不要用 `discard` 剔除「朝向/背向相机的面」**来控制透明层叠加 —— 会误删可见面（云层曾因此消失）。用 `depthTest` + `renderOrder` + `depthWrite:false`。
3. **`bakeInstancedAsset` 会把模型 `unit` 缩放烘进顶点** → 实例的 `scale` 必须 ≈1，否则重复放大（实测曾到 ~70 倍，棕榈比山还高）。
4. **canvas 必须 `position:absolute; top:0; left:0; width/height:100%`** 且 CSS 尺寸显式 —— 否则 `setScissor/setViewport`（假设 canvas 左上 = 视口左上）整体偏移 → Mini Globe 错位不可见。
5. **相机绕球运动时 UP 必须用表面法线**（用世界 +Y 会在极点翻转）；反之全球视角要世界 +Y。
6. **完整 Google Chrome 在本机会被系统 SIGKILL**，自动化验证请用 `chrome-headless-shell`（`npx --yes @puppeteer/browsers install chrome-headless-shell@stable`）。
7. **无头浏览器（ANGLE Metal 软件路径）的色彩/明暗与用户真浏览器不同** → 我的截图**只能验证「有无报错、几何/位置对不对」，不能作为最终观感标准**。用户验收请以本机浏览器 + 硬刷新为准。
8. **蒙皮模型包围盒不能用 POSITION accessor min/max**（那只是绑定姿势，动画位移不在其中）→ 必须沿 skin joint 链变换。`gen-manifest-mini-characters.mjs` 已按此实现。
9. **蒙皮模型克隆必须用官方 `SkeletonUtils.clone`**：`Object3D.clone/copy` 的 skeleton 是共享引用（骨骼指向源层级），多实例互相覆盖 → 角色不显示/动画不动。动画 track 按**节点同名**（`root`/`torso`…）解析到克隆体内。
10. **walk 类动画 ≠ root motion**：mini-characters 的 walk/sprint `root.translation` 只是 ±0.05 原地起伏 → 真实位移必须自己沿球面大圆推进，动画只负责四肢。

---

## 6. 自动化测试工具（`scripts/`，全部零依赖）

| 脚本 | 是否开浏览器 | 作用 |
|---|---|---|
| `check-syntax.mjs` | ❌ 纯静态 | src 下每个 .js 逐个 `node --check` |
| `check-shaders.mjs` | ❌ 纯静态 | GLSL 词法检查：抓「引用未声明标识符」（`${}` 插值与注释会先剥离）|
| `unit-world.mjs` | ❌ 纯逻辑 | 经纬度往返 / **球面站立 UP=法线** / 南北极方向 / 船头沿切线 / 落位半径 / 港口可建造 / 陆地覆盖率 |
| `unit-ships.mjs` | ❌ 纯逻辑 | 航线**不穿地球内部**且半径恒定 / 船真移动 / **船顶朝外 + 船头在切平面** / 非直线航行 / describe 数据 |
| `unit-camera.mjs` | ❌ 纯逻辑 | **镜头对球心 <0.01°**（GLOBE/LOCAL/任意高度）/ **RTS：UP=法线、绕球 360° 不翻、跨极点无突变** |
| `unit-characters.mjs` | ❌ 纯逻辑 | mini 清单防呆 / 比例区间 / 贴地误差 / 南北极 UP=法线 / 大圆走动不穿球不进海 / mixer 驱动关节 |
| `check-imports.mjs` | ❌ 纯静态 | src 全部 import（相对 / 裸包 / three addons / JSON）可解析 |
| `gen-manifest-mini-characters.mjs` | ❌ 生成器 | 扫描 kenney_mini-characters → 拷贝资产 + 生成实测清单（含蒙皮包围盒）|
| `json-loader.mjs` + `register-loader.mjs` | — | 让纯 Node 能 import `.json`（Vite 原生支持，Node 需 attribute）|
| `serve.mjs` | ❌ | 零依赖静态服务器（含 `three` 裸说明符重写）|
| `runtime-check.mjs` | ⚠️ 可选 | 需要真实运行时才用；默认**不进 npm test**，手动 `npm run check:runtime` |
