# Space Rage · 低多边形六边形星域空战

竖版打飞机（vertical shoot-em-up）。底层是 **Three.js + KayKit 六边形地块**构成的无限滚动低多边形星域，上层是 **Canvas 2D** 的弹幕玩法与 SpaceRage 精灵图集。纯静态、零构建、离线可跑（three.js 走 CDN importmap）。

## 玩法

- `WASD` / `方向键` 或 **鼠标 · 触屏**：移动（带惯性手感）
- `空格` / **按住屏幕**：自动射击
- `P`：暂停 · `M`：静音 · `Enter`：开始 / 重开
- 连击提升倍率（最高 ×8），命中越准分数越高；最高分存 `localStorage`

## 特色

- **波次系统**：普通敌机（3 色编队）、旋转水雷、每 5 波一个 Boss（多阶段弹幕 + 血条）
- **强化掉落**：等离子炮、速射/三向、装甲修复
- **手感反馈**：屏幕震动、受击闪红、死亡慢镜、爆炸粒子与冲击环
- **WebAudio 合成音效**：射击、命中金属声、爆炸（噪声 + 次低频 + 脆裂瞬态）、受伤、拾取音阶；另有随战场热度变化的引擎低鸣 + 琶音 + 心跳底鼓
- **3D 背景层**：`hex_grass` 铺成滚动地表，`cloud_big/small` 视差云，`building_castle_green` / `hill_single_A` 地标点缀；WebGL 不可用时自动降级为纯星空

## 本地运行

```bash
python3 -m http.server 8080
```

打开 <http://127.0.0.1:8080/>。ES Module + `fetch` 需要 http 环境，直接双击 `index.html`（`file://`）无法运行。

> 音效在首次点击 / 按键后才初始化（浏览器自动播放策略要求）。

## 结构

- `index.html`：入口、HUD、开始与结算卡片
- `src/main.js`：玩法核心（玩家、敌机、Boss、弹幕、掉落、粒子、波次）
- `src/hexbg.js`：KayKit 六边形 Three.js 背景层
- `src/atlas.js`：SpaceRage TexturePacker 图集解析与绘制
- `src/audio.js`：WebAudio 程序化音效与背景音乐
- `assets/img/`：`spritesheet.png` + `spritesheet.xml`（148 帧）
- `assets/three/`：KayKit glTF 2.0 模型（`.gltf` + `.bin`）与共享贴图

## 素材来源

- **SpaceRage** — Kenney 风格免费精灵包（玩家 / 敌机 / 爆炸 / 弹体图集）
- **KayKit Medieval Hexagon Pack 1.0 FREE** — Ken Nichols / KayKit 六边形低多边形地块
