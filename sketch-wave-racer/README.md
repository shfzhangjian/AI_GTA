# Sketch Wave Racer 简笔画浪速赛艇

第三人称 3D 水上赛艇游戏：**手绘卡通简笔画世界**（程序化几何 + 墨线描边 +
明快配色）配**高质感动态水面**（多层波 + 波纹法线 + 菲涅耳环境反射 +
泡沫 + 粒子水花）。Three.js / Vite 纯前端，全部资产程序化原创。

## 快速开始

```bash
npm install
npm run dev        # → http://localhost:5173/
```

打开页面 → 点 **开始比赛**（或 START RACE）→ 3·2·1·GO 倒计时后开船。

## 操作

| 键 | 动作 |
| --- | --- |
| W / S | 油门 / 刹车·倒车 |
| A / D | 左 / 右转向 |
| Shift | 漂移（甩尾蓄力，松开小加速） |
| 空格 | 使用道具 |
| R | 回到最近检查点 |
| Esc | 暂停菜单（语言 / 画质 / 音效切换） |

## 玩法要点

- **起步规则（转速定命运）**：倒计时按油门 = 空挡轰油门——右上角转速表上表、
  马达慢慢膨胀，但船不动。**GO 帧**结算：转速卡在**绿区（27~48 km/h）**=
  完美起步弹射（轰得越满弹得越猛）；轰过红色**爆缸线** = 爆缸熄火
  （惩罚 = 按住时长 × 0.5 秒）；老实等 GO 或轻点没卡上 = 干净起步不奖不罚
- **3 圈制**：按顺序通过 10 个检查点拱门，正向跨过起点线才计圈
- **漂移**：高速按住 Shift+方向甩尾，绿条蓄满松开 → 出漂小加速
- **赛道机关**：黄色加速带 ×3、t≈0.30 大跳台（全速冲落水有大水花）、
  S 弯木桩、中央大岛（不能抄近道）
- **道具 ×6**（吃礼盒获得，空格释放）：⚡闪电冲刺 / 💧水弹 / 🫧水牢泡 /
  🛡护盾 / 🌀音爆波 / 🔥涡轮；3 名 AI 对手会主动用道具追打你
- **本地最佳成绩**：最快圈速 / 最佳完赛用时 / 最佳名次（localStorage）
- **极速 120 km/h**：加速带瞬时 ~170 km/h；⚡冲刺 +43、🔥涡轮 +36 km/h；
  Shift 漂移甩尾蓄力，出漂再 +50 km/h
- **音效全程序合成**（WebAudio，零音频素材）：引擎随速轰鸣、水花、漂移啸叫、
  道具全套、倒计时与完赛旋律（菜单可开关，跨会话记住）

## 测试

```bash
npm test           # 全链 headless：phase1–7 + 起步规则共 59 项断言
npm run build      # 生产构建（dist/；base=/AI_GTA/sketch-wave-racer/，Pages 直发）
npm run preview    # 预览构建产物
```

> 注：phase2 测试第 8 项为历史遗留的测试剧本误报（见
> `project-docs/KNOWN_ISSUES.md` D 项），`--stop-at-8` 已按用户裁定优雅跳过，
> 不影响产品判定（圈数正确性由其余用例与实测背书）。

## 画质分档

控制台执行后刷新即生效（Esc 菜单里也有切换按钮）：

```js
localStorage.setItem('swr-quality', 'low')   // 软渲染/老机器
localStorage.setItem('swr-quality', 'high')  // 默认
localStorage.removeItem('swr-quality')       // 回默认
```

| 档 | 水面网格 | 细节波纹 | 粒子池 |
| --- | --- | --- | --- |
| high | 180² | ✓ | 1400 |
| auto | 140² | ✓ | 900 |
| low | 90² | ✗ | 300 |

## 语言

按浏览器语言自动中英；Esc 菜单点 **语言 / Language** 手动切换（持久化）。

## 项目结构

```
src/
  main.js            入口与主循环组装
  config.js          全局参数（波/驾驶/AI/道具/画质/流程）
  core/              输入（语义化键位）
  water/             水面着色器 + 喷溅粒子系统
  boat/              载具物理（漂移/跳台/道具状态槽）+ AI 选手
  camera/            第三人称跟随
  track/             赛道几何 / 加速带·跳台判定（数据≠网格）
  physics/           碰撞世界（障碍/船-船）
  race/              比赛判定（连续里程圈数/排名/流程）
  items/             道具规则 + 道具视觉
  ui/                HUD / 小地图 / 菜单·结算 / 本地记录
  world/  i18n/      天穹·岛屿 / 文案（zh/en）
project-docs/        开发状态唯一来源（规则见 DEVELOPMENT_RULES.md）
```

## 在线试玩（GitHub Pages）

构建产物已提交在 `dist/`，随仓库 Pages 直接发布：
**<https://shfzhangjian.github.io/AI_GTA/sketch-wave-racer/dist/>**

> `vite.config.js` 已设 `base: "/AI_GTA/sketch-wave-racer/"`（Pages 子路径）。
> 重新构建后把 `dist/` 一并提交即可更新线上版。

## 许可

全部程序化原创资产，不含任何第三方素材。
