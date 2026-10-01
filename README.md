# AI_GTA

AI 生成的游戏向 Web 项目集合。每个项目独立目录存放。

**🎮 在线试玩（GitHub Pages）：<https://shfzhangjian.github.io/AI_GTA/>**

## 项目索引

| 目录 | 说明 | 技术栈 | 在线试玩 |
| --- | --- | --- | --- |
| [`tilt-ball/`](./tilt-ball/) | **Tilt Lab 倾斜实验室**：倾斜球台物理闯关，木板 / 冰面 / 毛毡各一关，程序纹理与随机金属陶瓷小球，真实接球洞下落，键盘与手机摇杆 | HTML + Three.js 0.180 + Rapier 3D + Vite（源码与相对路径 dist/ 一并提交） | [🕹️ 立即开玩](https://shfzhangjian.github.io/AI_GTA/tilt-ball/dist/) |
| [`breakout/`](./breakout/) | **砖块破坏者**：元素级砖块自由建模（7 种材质独立破坏物理）、连锁爆炸、顶部随机英文单词砖、掉落道具（多球/挡板伸缩/火球+子弹）、连击积分、WebAudio 合成音效、调试模式事件追踪 | HTML5 Canvas 2D + 原生 ES Module + WebAudio，零依赖、零素材文件 | [🕹️ 立即开玩](https://shfzhangjian.github.io/AI_GTA/breakout/) |
| [`low-poly-city/`](./low-poly-city/) | **低多边形等距城市 + 第一人称武器沙盒**（锤子/冲锋枪/狙击枪/火箭筒，NPC 生态与碰撞） | HTML + Three.js r165（原生 ES Module，零构建、离线可跑） | [🕹️ 立即开玩](https://shfzhangjian.github.io/AI_GTA/low-poly-city/) |
| [`zelda-like/`](./zelda-like/) | **塞尔达风格开放世界动作游戏**：随机刷怪、武器拾取（树枝/火炬/刀/弓/火焰连弓/石头）、营火点枝成火炬、扇面攻击+自动锁敌+血条、鼠标瞄准、怪物先手硬直、WebAudio 合成音效、小地图与 L 键调试面板 | HTML + Three.js 0.160（原生 ES Module，零构建） | [🕹️ 立即开玩](https://shfzhangjian.github.io/AI_GTA/zelda-like/) |
| [`huluwa-save-grandpa/`](./huluwa-save-grandpa/) | **葫芦娃救爷爷**：水墨弓阵防守、免费精灵素材、葫芦娃技能养成、洞府封印、虚线落点预览、低抛物线射击、WebAudio 合成音效 | HTML + Three.js r165（原生 ES Module，零构建） | [🕹️ 立即开玩](https://shfzhangjian.github.io/AI_GTA/huluwa-save-grandpa/) |
| [`three-viewer/`](./three-viewer/) | **UAL 动作角色 · 动作游戏控制演示**：WASD 走 / Shift 跑 / 空格蓄力跳（含腾空移动）/ K 组合拳连段 / J 魔法弹道，43 段动画姿态分组浏览，GLB 骨骼动画状态机 | HTML + Three.js r185（原生 ES Module，零构建） | [🕹️ 立即开玩](https://shfzhangjian.github.io/AI_GTA/three-viewer/) |
| [`space-shooter/`](./space-shooter/) | **Space Rage 六边形星域空战**：竖版打飞机、波次编队与旋转水雷、每 5 波多阶段 Boss、连击倍率（最高 ×8）、强化掉落（等离子炮/速射/修甲）、屏幕震动与死亡慢镜、WebAudio 合成音效与动态配乐、Three.js + KayKit 六边形无限滚动地表 | HTML + Three.js 0.169 + Canvas 2D（原生 ES Module，零构建） | [🕹️ 立即开玩](https://shfzhangjian.github.io/AI_GTA/space-shooter/) |
| [`billiards-3d/`](./billiards-3d/) | **3D 台球**：真实比例球桌（球径 63.5mm、台面 2.375m×1.155m）、480Hz 子步弹性碰撞物理、鼠标瞄准+蓄力击球、幽灵球落点预测、几何 AI 对手（假想接触点求解+路径遮挡）、落袋/库边/击球/犯规 WebAudio 程序化音效、你 vs 电脑回合制清台赛 | HTML + Three.js r165（原生 ES Module，零构建、音效全程序合成零素材） | [🕹️ 立即开玩](https://shfzhangjian.github.io/AI_GTA/billiards-3d/) |
| [`gomoku-threejs/`](./gomoku-threejs/) | **手绘五子棋**：动物/植物随机角色棋子、手机平面棋盘、吃子爆炸消除、提示推荐与危险提醒、攻击按钮赶走对方角色、飞机投弹破坏棋盘、胜利烟花与小人庆祝 | HTML + Three.js 0.164 + WebAudio（原生 ES Module，零构建） | [🕹️ 立即开玩](https://shfzhangjian.github.io/AI_GTA/gomoku-threejs/) |
| [`auto-factory/`](./auto-factory/) | **汽车智慧工厂数字孪生可视化大屏**：厂区五大车间三维全景 + 车间室内一镜到底进入；冲压滑块往复/焊装机器人集群+焊花粒子/涂装连续输送/总装合装岛升降四条产线动画、AGV 环线与跨车间物流光带、五大监控面板（工厂总览/经营概况/生产概况/车间概况/设备概况）+ ECharts 实时联动、设备点选监管浮窗与故障告警 | HTML + Three.js 0.160 + ECharts 5.5（原生 ES Module，零构建；three/echarts 走 CDN 需联网） | [🕹️ 立即体验](https://shfzhangjian.github.io/AI_GTA/auto-factory/) |
| [`sketch-wave-racer/`](./sketch-wave-racer/dist/) | **简笔画浪速赛艇**：第三人称 3D 水上赛艇——手绘卡通简笔画世界 + 高质感动态水面（多层波/菲涅耳反射/泡沫/水花粒子）；转速定命运的起步玩法（绿区完美弹射 / 轰过爆缸线爆缸熄火）、3 圈 10 检查点、漂移蓄力小加速、6 道具 + 3 AI 对手、飞鱼障碍、程序化赛道生成、卡通转速表、中英双语、本地最佳纪录、音效全 WebAudio 程序合成 | Three.js 0.169 + Vite 5（发布编译产物 dist/；npm test 61 项 headless 断言；全资产程序化原创零素材） | [🕹️ 立即开玩](https://shfzhangjian.github.io/AI_GTA/sketch-wave-racer/dist/) |
| [`cartoon-brawler/`](./cartoon-brawler/dist/) | **Tinker's Crossing 卡通格斗**：卡通中世纪 3D 清版动作——城堡门→村道→广场→木桥→Boss 竞技场一镜到底连续关卡；剑/锤双武器三段连击、刀剑客/蛮兵/游勇 3 种敌人 + 三阶段 Boss（6 加权随机技能）、受击停顿/镜头震动/武器拖痕/击退浮空倒地、包围圈围攻 AI（攻击槽位 + 效用评分）、可破坏场景（板条箱/桶/栅栏/桌/椅/车，碎块池硬上限）、固定步长物理 + 可变渲染帧、零素材全程序回退 | TypeScript(strict) + Vite 8 + Three.js 0.185 + Rapier3D（发布自包含 dist/ 相对 base；tsc --noEmit 严格零错误；soldier.glb 为 three.js MIT 示例，其余全程序生成） | [🕹️ 立即开玩](https://shfzhangjian.github.io/AI_GTA/cartoon-brawler/dist/) |
| [`underwater-explorer/`](./underwater-explorer/) | **Underwater Explorer 海底探索**：潜水员戴夫风格 2D/2.5D 海底探索原型，包含潜水员惯性移动、昼夜水面、氧气/生命 HUD、鱼群逃离、鱼叉瞄准蓄力发射、水底大气泡和海底装饰 | TypeScript(strict) + Vite 5 + Three.js 0.186（发布编译产物直接放在 underwater-explorer/；three 通过 CDN importmap 加载） | [🕹️ 立即开玩](https://shfzhangjian.github.io/AI_GTA/underwater-explorer/) |
| [`threejs-pirate-planet/`](./threejs-pirate-planet/dist/) | **微缩航海星球**：马里奥银河式球形小星球沙盒——球形地表（陆地/海洋/云层/大气/星空）+ Kenney Pirate Kit 全模型；港口城堡（方形城墙/角楼/大门/要塞）、球面弧线航线与船只（吃水/姿态对齐/海战炮击）、渡轮摆渡（每次载 5 人跨港）、小人漫游 + 方块宠物跟随、防重叠占位系统、环境事件与伤害系统、WebAudio 程序音效、lil-gui 调试面板 | Three.js 0.180 + Vite 5 + GSAP + lil-gui（发布编译产物 dist/ 含全部模型资源；node scripts 单元/静态检查 93+ 项断言；Kenney 海盗素材 CC0） | [🕹️ 立即开玩](https://shfzhangjian.github.io/AI_GTA/threejs-pirate-planet/dist/) |

项目均为 **AI 全程生成代码**（模型：`unsloth/Qwen3.8-Flash-Next-GGUF`，经 DeepSeek Harness 代理迭代生成并自动化验证），生成介绍见各自目录内文档：

- breakout → [breakout/CODE_INTRO.md](./breakout/CODE_INTRO.md)
- low-poly-city → [low-poly-city/README.md](./low-poly-city/README.md)
- zelda-like → [zelda-like/README.md](./zelda-like/README.md)
- huluwa-save-grandpa → [huluwa-save-grandpa/README.md](./huluwa-save-grandpa/README.md)
- three-viewer → [three-viewer/README.md](./three-viewer/README.md)
- space-shooter → [space-shooter/README.md](./space-shooter/README.md)
- billiards-3d → [billiards-3d/README.md](./billiards-3d/README.md)
- gomoku-threejs → [gomoku-threejs/README.md](./gomoku-threejs/README.md)
- auto-factory → [auto-factory/README.md](./auto-factory/README.md)
- sketch-wave-racer → 编译产物发布在 [sketch-wave-racer/dist/](./sketch-wave-racer/dist/)（开发文档见本地工作区源码目录）
- underwater-explorer → 编译产物发布在 [underwater-explorer/](./underwater-explorer/)（源码归档见 [underwater-explorer-src/](./underwater-explorer-src/)）
- threejs-pirate-planet → 编译产物发布在 [threejs-pirate-planet/dist/](./threejs-pirate-planet/dist/)
- cartoon-brawler → [cartoon-brawler/README.md](./cartoon-brawler/README.md)

- tilt-ball → [tilt-ball/README.md](./tilt-ball/README.md)（由 Codex 协助开发）

## 本地运行

```bash
# 砖块破坏者（推荐 start.bat，自动开浏览器）
cd breakout && python -m http.server 8765

# 低多边形城市
cd low-poly-city && npx serve .

# 塞尔达风格开放世界
cd zelda-like && python3 -m http.server 8080

# 葫芦娃救爷爷
cd huluwa-save-grandpa && python3 -m http.server 8080

# Space Rage 六边形星域空战
cd space-shooter && python3 -m http.server 8080

# 3D 台球
cd billiards-3d && node serve.js   # 或 python -m http.server 8765

# 手绘五子棋
cd gomoku-threejs && python3 -m http.server 8080

# 汽车智慧工厂数字孪生大屏
cd auto-factory && python3 -m http.server 8080


# Underwater Explorer 海底探索（发布版直接打开；源码开发用 npm install && npm run dev）
cd underwater-explorer && python3 -m http.server 8080

# 简笔画浪速赛艇（构建版直接开玩；源码开发用 npm install && npm run dev）
cd sketch-wave-racer/dist && python3 -m http.server 8080
```

> ES Module + fetch 需要 http 环境，直接双击 index.html（file://）无法运行。

## GitHub Pages 部署方式

仓库根目录 `index.html` 为导航落地页；Pages 采用 **Deploy from a branch → `main` / (root)**，各子项目路径直达（见上表）。各子项目自包含、纯静态，无需构建步骤（例外：sketch-wave-racer 源码需 Vite 构建，但其 `dist/` 已随仓库提交，Pages 直接可用）。

## Tilt Lab 倾斜实验室开发

进入 tilt-ball 目录，运行 npm ci 和 npm run dev；构建运行 npm run build，物理验证运行 node tools/verify-goal.mjs。dist/ 已提交，可直接通过 GitHub Pages 试玩，详细说明见 [项目 README](./tilt-ball/README.md)。
