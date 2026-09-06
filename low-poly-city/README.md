# 🏙️ Low-Poly City · Three.js 等距城市 + 第一人称武器沙盒

用 **HTML + Three.js（原生 ES Module，零构建工具）** 实现的低多边形等距城市：彩色屋顶的白蓝塔楼、
玻璃幕墙科技园、阶梯退台公寓、红顶小镇房、秋色系树木、循环车流（会礼让行人）、随机生成的行人与狗，
支持**点击城区进入第一人称**，携带锤子/冲锋枪/狙击枪/火箭筒四种武器在街道中战斗漫游。

> 本项目为 **AI 全程生成 + AI 无头测试验证** 的代码，介绍见下文。

---

## 🧑‍🔬 生成方式与模型版本

| 项 | 版本 / 说明 |
| --- | --- |
| 生成模型 | `unsloth/Qwen3.8-Flash-Next-GGUF`（Qwen3.8 Flash-Next GGUF 量化版） |
| 运行载体 | DeepSeek Harness 智能体管线（文件工具 + PowerShell + 子代理/工作流均参与迭代） |
| 渲染库 | **three.js r165（0.165.0）**，已本地化到 `libs/`（`three.module.js` + `OrbitControls.js` + `PointerLockControls.js`），**离线可运行** |
| 模块化方式 | 浏览器原生 `<script type="importmap">` + ES Modules，无打包器、无 npm 依赖安装 |
| 音效 | Web Audio API 实时合成（零音频素材文件） |
| 纹理 | Canvas 2D 程序化生成窗格/玻璃幕墙（零图片资源） |
| 验证 | Node.js v24 无头冒烟测试（stub DOM/AudioContext，33 项断言全过：装配、碰撞、战斗、弹道、开镜、毁车燃烧、弹坑、车型规格归一化/拆轮/判向免疫根旋转、车轮世界系无滑移轴向、警车内置警灯、警匪对抗、玩家阵亡） |

## 🚀 运行

ES Module 受同源策略限制，需通过本地服务器打开（不能直接双击 `index.html`）：

```bash
cd low-poly-city
npx serve .                    # 方式一（Node）
# 或
python -m http.server 8000     # 方式二（Python）
```

浏览器访问终端提示的地址即可，**无需联网**（three.js 已本地化）。

## 🎮 操作

| 模式 | 操作 |
| --- | --- |
| 俯视（默认） | 左键拖拽旋转 · 滚轮缩放 · 右键平移；悬停发光圆圈预览城区，点击进入第一人称 |
| 第一人称 | `W/A/S/D` 或方向键移动 · `Shift` 奔跑 · 鼠标转向 · **左键攻击/开火** · `Esc` 返回俯视；右上角小地图实时显示位置与朝向 |
| 武器 | `1`~`4` 切换 锤子/冲锋枪/狙击枪/火箭筒 · `R` 装填 · **右键开关瞄准镜**（狙击枪全屏瞄具）· 冲锋枪按住连发 |

## 🌆 武器系统

| 武器 | 行为 | 伤害 |
| --- | --- | --- |
| 🔨 锤子 | 左键挥击（弧线动画，行程中段结算），范围 2.2m | 45 |
| 🔫 冲锋枪 | 按住连发、弹匣 30、散布较大、带曳光弹与枪口焰 | 12/发 |
| 🎯 狙击枪 | 右键开全屏瞄准镜（FOV 12°，开镜自动隐藏枪模防遮挡），高伤单发、大后座、回声尾音 | 90 |
| 🚀 火箭筒 | **重力抛物线弹道**，触地/撞楼/近身引爆：范围伤害 + 火球 + 光闪 + 碎石飞溅 + 震屏白闪；**可摧毁汽车**（碳黑残骸临时堵路 25s） | ≤100 衰减 |

- 命中判定为解析射线检测（NPC 水平圆柱 + 高度带，建筑 Box3 遮挡，地面接弹）
- NPC 受击：红闪 + 击退 + 头顶血条（绿/橙/红三档），血量归零打倒躺地、远离玩家后满血复活；未打倒立即转身狂奔逃离

## 🚗 真实车辆模型与破坏特效

- **真车模型**：集成 [3d-car-showcase](https://github.com/TotoroZuo/3d-car-showcase)（MIT, © 2022 Fat Totoro）的保时捷 911 GLB
  （Draco 压缩 + clearcoat，解码器已本地化 `libs/draco/`）。规格驱动双车型适配（simple-muscle-car 保留为回退档）：
  **剔除展台背景板/反光地板/LED 灯带**，以真实几何归一化（车长 4.5m、轮胎接地、车头按前杠判定朝行驶向），
  按材质名 "paint" 逐车换漆；Sketchfab 导出缺 metallic/roughness 因子，加载时统一调校并加 **RoomEnvironment HDR 环境反射**还原车漆高光；
  **Cylinder.000/001"轴对"节点按象限聚类拆成 4 个轮毂枢轴，行驶中按 ω=up×v/r 真实滚动**。
  模型在建城前预加载，车流第一帧即真模型；>38m 自动切回低模盒车（距离 LOD，14×130万三角全显会压垮 GPU），
  GLB 档用径向渐变**贴地假阴影**替代实时投影。警车为自建低多边形模型 `libs/car/police_car.glb`（黑白格涂装 + POLICE 字样 +
  推杠 + 内置发光警灯条，红蓝交替爆闪走 emissiveIntensity 脉冲；四轮独立节点直接支持滚动），缺失时回退白漆保时捷/程序化警车。
- **爆炸升级**：火球 + 上升火焰精灵群 + 黑烟柱（膨胀消散）+ 碎石飞溅 + PointLight 光闪，纹理全 Canvas 程序化生成。
- **地面弹坑**：不规则边缘焦土贴花（多层随机径向渐变 + 飞溅斑点），空爆也投影到地面；上限 26 个滚动清除。
- **残骸燃烧**：被摧毁的汽车持续喷火冒烟约 16 秒、火光随机闪烁、火势渐弱，末期塌缩消失（期间始终作为路障阻挡通行）。

## 🚨 警匪对抗（GTA 式通缉）

- **袭击路人**（拳/枪命中，或火箭炸到路人/汽车）→ 75% 概率有人报警，2~5 秒后警车出警
- 警车沿最近车道驶来：**红蓝警灯交替闪烁 + WebAudio 连绵警笛**，抵达案发点后警察下车走向你（同时只存在一名警察）
- 警察随机持**手枪**（单发）或**冲锋枪**（三连点射），带建筑视线遮挡、距离衰减命中率与曳光弹，可绕墙躲避
- **玩家会受伤**：中弹瞬间全屏红色晕影脉冲 + 耳鸣音，左下角血条随剩余血量变色；被击中 **5 枪阵亡**，死亡提示后自动退出第一人称
- 火箭近爆同样伤及自己（5.5m 内按一次中弹结算）；警察可被子弹/火箭击倒（120 HP），击倒或玩家逃远（>60m）后警车收队，冷却后可再次出警
- **火箭筒可摧毁汽车**：碳黑残骸抛锚堵路约 25 秒（期间阻挡玩家与后车）
- 小地图实时显示闪烁红蓝警车方块与警察蓝点

## 🧩 碰撞与生态

- **玩家实体化**：第一人称在世界中有身体（低头可见躯干双腿，头部经 layer 对自己隐藏）
- **汽车不穿透玩家**：车流为你提前刹停让行（红色尾灯），车身矩形同时阻挡玩家
- **活物系统**：行人沿人行道巡航并偶尔横穿；狗在草地随机游走自动避障；两两分离不穿模；撞到会踉跄让开
- **爆炸波及**：圈内扣血、圈缘恐慌逃散

## 📁 代码结构（关注点分离）

```
low-poly-city/
├── index.html                  # 页面 + HUD + importmap
├── css/style.css               # HUD 样式（武器栏/狙击瞄具/小地图/震屏闪白）
├── libs/                       # three.js r165 及官方控制器（本地化，MIT）
└── src/
    ├── main.js                 # 入口：装配 + 每帧更新
    ├── config.js               # ★ 调色板 / 世界尺寸 / 漫游参数
    ├── core/
    │   ├── App.js              # 渲染器、场景、相机、灯光、主循环
    │   ├── Collision.js        # 圆形 vs 世界碰撞查询（玩家与行人/狗共用）
    │   ├── Sfx.js              # WebAudio 程序化音效引擎（零素材，自动静默降级）
    │   ├── WeaponSystem.js     # 武器状态机：切枪/弹道/瞄准镜/火箭弹/爆炸特效
    │   └── ModeManager.js      # 俯视 <-> 第一人称 状态机（HUD/相机互切、玩家化身）
    ├── world/
    │   ├── textures.js         # Canvas 程序化立面纹理（窗格/玻璃幕墙），零图片
    │   ├── PlayerAvatar.js     # 玩家化身（头部 layer 隔离）+ 第一人称双手动画
    │   ├── WeaponModels.js     # 锤子/冲锋枪/狙击枪/火箭筒低多边形枪模 + 火箭弹
    │   ├── CarModel.js         # 肌肉车 GLB 加载（GLTF+Draco）与归一化换漆
    │   ├── CombatFx.js         # 爆炸粒子/黑烟柱/弹坑贴花/残骸燃烧特效中枢
    │   ├── GroundBuilder.js    # 地块底座、草地四象限、人行道、拾取平面
    │   ├── RoadBuilder.js      # 十字路、虚线、斑马线、停车场
    │   ├── BuildingFactory.js  # 6 种建筑生成函数（spec -> Group），碰撞标记
    │   ├── NatureBuilder.js    # 低多边形树/灌木（坐标哈希确定性随机）
    │   ├── PropBuilder.js      # 路灯、长椅、循环车流（让行刹车 + 尾灯 + 车辆矩形）
    │   ├── AgentBuilder.js     # 随机行人/狗：巡航游走 + 血条/红闪/击退/逃跑/打倒复活
    │   └── CityBuilder.js      # 装配全场景 + 汇总 AABB/圆形碰撞体 + 进入区域环
    ├── controls/
    │   ├── OverheadControls.js # OrbitControls + 悬停拾取 + 点击(非拖拽)判定
    │   └── FirstPersonControls.js # PointerLock + WASD + 惯性平滑 + 分轴碰撞滑行 + 挥拳
    ├── ui/
    │   └── Minimap.js          # 第一人称右上角小地图（静态层预渲染+玩家箭头+NPC圆点）
    └── data/
        └── cityLayout.js       # ★ 纯数据：建筑/树/车道/进入区域，改城市只改这里
```

### 关键设计

- **数据驱动**：`config.js`（风格）与 `data/cityLayout.js`（布局）集中所有可调内容；加一种建筑只需在
  `BuildingFactory.js` 写一个 `spec -> Group` 纯函数并注册。
- **碰撞统一口径**：建筑 AABB（Box3）+ 树/路灯圆形 + 车辆动态矩形，玩家、行人、狗、子弹共用同一套查询。
- **性能**：小地图静态层离屏预渲染；程序化纹理共享几何体；NPC O(n²) 分离在 n=21 下开销可忽略。

## ⚖️ 许可与致谢

- three.js r165（MIT License, © three.js authors）— 随仓库 `libs/` 本地分发
- 车辆模型：[3d-car-showcase](https://github.com/TotoroZuo/3d-car-showcase)（MIT License, © 2022 Fat Totoro）— `libs/car/porsche911.glb`，许可证副本见 `libs/car/CAR_SHOWCASE_LICENSE.txt`
- 警车模型：自建模低多边形警车 — `libs/car/police_car.glb`（Blender GEO-* 命名规范，内置发光警灯条与涂装）
- 备用车型：[simple-muscle-car](https://github.com/ASouthernCat/simple-muscle-car)（MIT License, © 2024 ASouthernCat）— `libs/car/car_draco.glb`，许可证副本见 `libs/car/MUSCLE_CAR_LICENSE.txt`
- Draco 压缩解码器（Apache-2.0, © Google）— `libs/draco/`
- 其余代码由 AI 生成，供学习研究使用
