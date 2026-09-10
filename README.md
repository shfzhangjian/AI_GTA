# AI_GTA

AI 生成的游戏向 Web 项目集合。每个项目独立目录存放。

**🎮 在线试玩（GitHub Pages）：<https://shfzhangjian.github.io/AI_GTA/>**

## 项目索引

| 目录 | 说明 | 技术栈 | 在线试玩 |
| --- | --- | --- | --- |
| [`breakout/`](./breakout/) | **砖块破坏者**：元素级砖块自由建模（7 种材质独立破坏物理）、连锁爆炸、顶部随机英文单词砖、掉落道具（多球/挡板伸缩/火球+子弹）、连击积分、WebAudio 合成音效、调试模式事件追踪 | HTML5 Canvas 2D + 原生 ES Module + WebAudio，零依赖、零素材文件 | [🕹️ 立即开玩](https://shfzhangjian.github.io/AI_GTA/breakout/) |
| [`low-poly-city/`](./low-poly-city/) | **低多边形等距城市 + 第一人称武器沙盒**（锤子/冲锋枪/狙击枪/火箭筒，NPC 生态与碰撞） | HTML + Three.js r165（原生 ES Module，零构建、离线可跑） | [🕹️ 立即开玩](https://shfzhangjian.github.io/AI_GTA/low-poly-city/) |
| [`zelda-like/`](./zelda-like/) | **塞尔达风格开放世界动作游戏**：随机刷怪、武器拾取（树枝/火炬/刀/弓/火焰连弓/石头）、营火点枝成火炬、扇面攻击+自动锁敌+血条、鼠标瞄准、怪物先手硬直、WebAudio 合成音效、小地图与 L 键调试面板 | HTML + Three.js 0.160（原生 ES Module，零构建） | [🕹️ 立即开玩](https://shfzhangjian.github.io/AI_GTA/zelda-like/) |
| [`huluwa-save-grandpa/`](./huluwa-save-grandpa/) | **葫芦娃救爷爷**：水墨弓阵防守、免费精灵素材、葫芦娃技能养成、洞府封印、虚线落点预览、低抛物线射击、WebAudio 合成音效 | HTML + Three.js r165（原生 ES Module，零构建） | [🕹️ 立即开玩](https://shfzhangjian.github.io/AI_GTA/huluwa-save-grandpa/) |
| [`three-viewer/`](./three-viewer/) | **UAL 动作角色 · 动作游戏控制演示**：WASD 走 / Shift 跑 / 空格蓄力跳（含腾空移动）/ K 组合拳连段 / J 魔法弹道，43 段动画姿态分组浏览，GLB 骨骼动画状态机 | HTML + Three.js r185（原生 ES Module，零构建） | [🕹️ 立即开玩](https://shfzhangjian.github.io/AI_GTA/three-viewer/) |
| [`space-shooter/`](./space-shooter/) | **Space Rage 六边形星域空战**：竖版打飞机、波次编队与旋转水雷、每 5 波多阶段 Boss、连击倍率（最高 ×8）、强化掉落（等离子炮/速射/修甲）、屏幕震动与死亡慢镜、WebAudio 合成音效与动态配乐、Three.js + KayKit 六边形无限滚动地表 | HTML + Three.js 0.169 + Canvas 2D（原生 ES Module，零构建） | [🕹️ 立即开玩](https://shfzhangjian.github.io/AI_GTA/space-shooter/) |
| [`billiards-3d/`](./billiards-3d/) | **3D 台球**：真实比例球桌（球径 63.5mm、台面 2.375m×1.155m）、480Hz 子步弹性碰撞物理、鼠标瞄准+蓄力击球、幽灵球落点预测、几何 AI 对手（假想接触点求解+路径遮挡）、落袋/库边/击球/犯规 WebAudio 程序化音效、你 vs 电脑回合制清台赛 | HTML + Three.js r165（原生 ES Module，零构建、音效全程序合成零素材） | [🕹️ 立即开玩](https://shfzhangjian.github.io/AI_GTA/billiards-3d/) |

项目均为 **AI 全程生成代码**（模型：`unsloth/Qwen3.8-Flash-Next-GGUF`，经 DeepSeek Harness 代理迭代生成并自动化验证），生成介绍见各自目录内文档：

- breakout → [breakout/CODE_INTRO.md](./breakout/CODE_INTRO.md)
- low-poly-city → [low-poly-city/README.md](./low-poly-city/README.md)
- zelda-like → [zelda-like/README.md](./zelda-like/README.md)
- huluwa-save-grandpa → [huluwa-save-grandpa/README.md](./huluwa-save-grandpa/README.md)
- three-viewer → [three-viewer/README.md](./three-viewer/README.md)
- space-shooter → [space-shooter/README.md](./space-shooter/README.md)
- billiards-3d → [billiards-3d/README.md](./billiards-3d/README.md)

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
```

> ES Module + fetch 需要 http 环境，直接双击 index.html（file://）无法运行。

## GitHub Pages 部署方式

仓库根目录 `index.html` 为导航落地页；Pages 采用 **Deploy from a branch → `main` / (root)**，各子项目路径直达（见上表）。各子项目自包含、纯静态，无需构建步骤。
