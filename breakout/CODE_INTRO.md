# 生成代码介绍 · Breakout Elements（砖块破坏者）

> 本文档说明本项目的 **AI 生成来源、模型版本、架构设计与验证方式**。

## 一、生成信息

| 项目 | 内容 |
|---|---|
| 生成日期 | 2026-09-05 |
| 生成模型 | **unsloth/Qwen3.8-Flash-Next-GGUF**（GGUF 量化权重） |
| 运行载体 | DeepSeek Harness 编码代理（Agent 工具链：文件读写 / PowerShell / Node.js 校验） |
| 生成方式 | 对话式迭代生成：三轮需求 → 架构规划 → 逐模块实现 → 自动化验证 → 功能增强 |
| 代码规模 | 20 个 ES Module 源码文件 + 3 个 JSON 关卡数据 + 无 DOM 回归测试（27 项断言） |
| 技术栈 | 原生 HTML5 Canvas 2D + ES Modules + WebAudio API，零第三方依赖、零素材文件 |

## 二、验证方式

- `node --check`：全部 JS 模块按 ES Module 语法解析通过；
- JSON 关卡数据经 UTF-8 反序列化校验；
- `tests/smoke.test.mjs`：**27 项断言全部通过**，覆盖碰撞检测/相切边界、镜面反射、字符网格建模展开、元素损伤状态机、积分连击公式与奖励分、粒子生命周期回收、球运动与轨迹预测、炸药参数完备性、单词砖标签与材质规则、道具定义与坠落。

## 三、架构总览（分层 + 事件总线）

```
breakout/
├─ index.html / styles.css        入口页；CSS 屏幕自适应（视口等比缩放，逻辑分辨率恒定 960×640）
├─ start.bat                      一键本地服务器
├─ src/
│  ├─ main.js                     引导：装配系统、挂接调试、暴露 window.__BREAKOUT__
│  ├─ config/constants.js         全部可调参数（物理子步长/球速上限/连击窗口…）
│  ├─ utils/eventBus.js           ★全局事件总线：所有生命周期事件的唯一广播口
│  ├─ utils/math.js               clamp / rand / 种子随机（裂纹外观可复现）
│  ├─ core/game.js                主控：状态机 + 固定子步循环 + 碰撞调度 + 爆炸队列 + 道具/子弹
│  ├─ core/input.js               键鼠触摸统一输入 → input.press 总线事件
│  ├─ core/assets.js              资源加载 + 程序化底图生成（渐变/星云/星点，支持图片底图回退）
│  ├─ physics/collision.js        圆-AABB 碰撞、镜面反射、轨迹预测（调试可视化）
│  ├─ entities/element.js         ★元素注册表：7 种材质各带 HP/分值/质量/特效/音效定义
│  ├─ entities/brick.js           ★砖块自由建模：字符网格 → 可独立破坏的元素阵列
│  ├─ entities/ball.js            多球支持：速度矢量、拖尾、反弹方向修正、火球命中冷却
│  ├─ entities/paddle.js          挡板：偏移角映射反弹（±60°）、宽度动态变化
│  ├─ entities/powerup.js         掉落道具：多球/加长/缩短/火球 + 坠落拾取判定
│  ├─ level/levelLoader.js        JSON 关卡解析、别名映射、共享模型库
│  ├─ level/wordFactory.js        ★顶部单词砖：随机英文单词，逐字母随机材质（相邻不重复）
│  ├─ level/levels/*.json         3 个关卡建模数据
│  ├─ render/renderer.js          底图→元素→道具/子弹→挡板/球→特效→HUD→遮罩→调试层
│  ├─ score/scoreEngine.js        积分算法：基础分 × 速度加成 × 连击倍率 + 单词奖励
│  ├─ effects/particles.js        碎片/火花/冲击波环/火焰拖尾/漂浮文字
│  ├─ audio/audioEngine.js        WebAudio 程序化合成全部音效（噪声扫频爆炸、琶音金币…）
│  └─ debug/debugPanel.js         调试面板：事件日志 + 实时指标（?debug=1 / F2）
└─ tests/smoke.test.mjs           无 DOM 冒烟测试
```

**设计原则**：模块单向依赖（entities/physics/score 不依赖 core），跨层通信一律走 `eventBus`，调试器以"记录器"身份零侵入接入；新增元素/关卡/道具均为纯数据扩展。

## 四、核心算法摘要

- **连续碰撞等效**：固定物理子步 1/120s，球单步位移 < 半径，离散圆-AABB 检测即不穿模；反弹后限制最小垂直速度防水平死循环。
- **连锁爆炸**：炸药被毁 → 延迟起爆队列 → 半径内点-矩形距离判定施加伤害 → 波及炸药再入队，自然形成链式爆破节奏。
- **积分**：`得分 = 基础分 × (1 + 球速/1200) × min(1 + (连击-1)×0.25, 5)`；连击窗口 1.6s；整词摧毁另有固定奖励分。
- **火球模式**：穿透不反弹，同元素 0.35s 灼烧冷却、伤害 ×3；挡板接球自动开炮 + 手动子弹（0.18s 冷却）。
- **屏幕自适应**：逻辑分辨率恒定，CSS `min(视口宽, 视口高×3:2)` 等比缩放，指针坐标逆变换映射。

## 五、运行

```bash
cd breakout
python -m http.server 8765        # 或双击 start.bat
# 浏览器打开 http://localhost:8765      调试模式加 /?debug=1
node tests/smoke.test.mjs         # 回归测试
```

操作：鼠标/←→/AD 移动 · 空格/点击发射（火球模式下开炮）· P 暂停 · M 静音 · R 重开 · F2 调试。
