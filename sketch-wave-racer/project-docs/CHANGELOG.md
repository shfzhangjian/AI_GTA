### 追加：胀大感强化（用户实测"没感觉大多少"）

- **真根因 = 吃水**：胀大的船下半截沉在卡通水面之下，屏幕上只看得见水线
  以上 → 1.28× 体感缩水一半。**吃水补偿**：胀大同时把视觉船体抬高
  `(bs-1)×0.55m`，船底坐在水面上，胀大完整可见。
- **胀度感知曲线 sqrt(rev/revMax)**：轰到一半转速即 ~75% 体积（线性要轰满
  才明显）；整船胀大 0.28 → **0.6**（满转速 1.6×）+ 吃水补偿 = 一按就疯长。
- **爆缸弹跳 0.45 → 0.7 峰值**（从胀态再撑大 70% 起爆）；**起跑拉长
  1.32 → 1.5×** + 收窄 0.88；抖动 0.03 → 0.06。全部视觉参数收编
  `CONFIG.raceFlow.start`（swellBoatScale/swellMotorScale/swellShake/
  blowPopScale/launchStretch/launchSquash），嫌小嫌大改数字即愈。
- 回归：start_rules #10 断言升级（swell=0.5 → scale 1.2~1.45；拉长 ≥1.2）；
  全链 61 项绿。

---

### 追加：驾驶员弹出主戏 + 两个"静默失效"级 bug（用户：船头乱抖没效果！
### 我要把快艇驾驶员弹下船）

- **主戏改为驾驶员弹出**（用户指定）：爆缸瞬间红点驾驶员被顶出座椅——
  抛物线飞出（上冲 6.5m/s + 向船头 4.5m/s + 侧飘）→ **翻着跟头**（tumble
  8+ rad）→ 落回甲板弹簧式回弹（保留 45% 能量、翻滚减速）→ 弹跳耗尽滚落
  水中淡出消失；全程 `popDriverTime=1.7s`，动画自持零件位（main 的
  restoreHead 只在空闲帧回位，不打断动画）。
- **根因 bug①（"没效果"的元凶）**：视觉方法又挂错句柄——`BoatModel` 方法
  只在 `view` 上，`BoatController` 里调 `this.obj.setEngineSwell`（obj 是
  THREE.Group）恒 undefined 静默跳过；锁定期（popT 早退分支）还漏调
  applySwellShake，动画不喂帧冻在起爆帧。修复：统一 `this.view`，popT 分支
  内驱动动画。
- **根因 bug②（trace 误红的元凶）**：headless 桩 `isDown: () => true`
  恒真 → `_throttle = throttle(1) − brake(1) = 0` **永远加不了速**（真实键盘
  按 W 不触发 brake）。trace 桩改真实键盘语义 `(a)=>down && a==="throttle"`。
- **动力锁统一**：`popT = popDriverTime`（人未落地油门全吞）+
  `blownUp ≥ popDriverTime`（解锁不留熄火残罚卡速，GO 帧双写）。
- **trace_swell 升级为渲染帧级断言**（复刻 main 帧序 + 采样 boat.update 后
  真实 speed）：膨胀 1.6× 达渲染帧 → 驾驶员弹出离座 ≥1.2m / 翻滚 ≥1rad →
  锁定 ≥40 帧 speed 恒 0 → 解锁后恢复行驶 → 动画结束回座。
- 回归：全链 62 项绿（trace_swell 1 PASS）。

---

## 爆缸弹簧头 + 完美起跑慢还原（用户：头弹出像弹簧，慢慢缩小直到恢复才能
## 向前行驶；完美启动要慢慢还原，不要一下就还原！）

- **爆缸 = 弹簧头**（用户指定画面）：GO 帧砰一声后**船头（bow）像被顶出的
  弹簧**——沿 Z 弹出 1.1m 峰值 + 上颠 + 驾驶员/天线旗颠得更高（×1.5 卡通
  放大），阻尼振荡（周期 0.24s、包络半衰期 0.5s）**慢慢缩小**约 1.4s 缩回
  原位；整船随弹簧微晃。**锁定前进**：新 `boat.popT`（1.6s ≥ 动画全程）
  期间物理全冻结（update 顶部早退、speed 钉 0、无碰撞无特征），头不完全
  缩回**油门按烂也走不了**——"恢复才能向前行驶"由物理保证而非动画。
- **完美起跑慢还原**：拉长不再 0.6s 线性归零，改**指数还原**（半衰期 0.6s，
  残余 <2% 自然收束）+ 抬机头 -0.12rad 缓落——"嗖一下拉长、两三秒慢慢
  回形"；`triggerLaunchStretch` 重置 `_launchT` 保证每局从 k=1 起。
- 零件回位安全阀：`view.restoreHead()`（main 渲染后统一调，动画进行中由
  动画自持不回位）；`animActive()` 供外部查询。
- **trace_swell 测试升级入 npm test**：复刻 main 渲染前最后一刻采样——
  断言 ①膨胀到渲染帧（scale 1.6）②弹簧头 Δz 峰值 >0.5m 且 1.7s 内缩回
  ③锁定 1.5s 全程按住油门 speed 恒 0。接线再断 = 立刻红。
- 回归：全链 **62 项绿**（8 文件）；start_rules #10 同步慢还原断言。

---

## 起步船体动画三态（用户要求：倒数按加速整船越来越大；惩罚=大到爆炸，
## 奖励=冲出去拉长再慢慢恢复；正常=胀大后慢慢恢复）

- **整船胀大**：`BoatModel.setEngineSwell` 从只胀马达升级 = **整船 scale
  ×(1+swell·0.28)**（转速满 = 大一圈 + 越憋越抖），马达鼓包仍叠加在其上。
- **爆缸弹跳（惩罚）**：GO 帧爆缸先 `setEngineSwell(胀态)` 让 pop **从最大
  体积起爆**——冲击缩放 +45% 峰值衰减振动 0.45s 弹回原形 + 高频抽动 +
  黑烟蘑菇柱，"胀到顶→砰→泄回原形"完整因果链。
- **起跑拉长（奖励）**：完美起步船 Z 轴拉长 1.32 + 微收窄（speedline 卡通
  冲刺感），指数收敛 0.6s 慢慢恢复正常。`boat.launchPop` 一次性旗经
  `syncLaunchPop` 在 main 视觉收尾消费——**AI 完美起步同样有拉长动画**
  （不依赖只发玩家的 lastEvent）。
- **scale 安全**：视觉 scale 是每帧重写的（main 渲染后 `set(1,1,1)` 兜底），
  与碰撞零耦合（碰撞读数据非包围盒）；phase7 fakeGroup 桩补 `scale.set`。
- 回归：start_rules 新增 #10（胀大/爆跳/拉长/自动恢复四断言）；全链
  **61 项绿**；dev serving 新 BoatModel/main ✓。

---

## 起步爆缸爆炸强化（用户反馈：爆炸效果不行，要有爆炸烟雾+音效）

- **烟雾粒子系统升级**（`Spray.js`）：Points 池新增 **aDark 烟雾通道**
  （shader mix 深墨色）；烟雾物理独立：轻上浮 + 横向扩散 + **越飘越大**
  （size += 9/s）+ 慢淡出，与水花（重力/水面浮力）分流互不干扰。
- **`spray.emitBlast(x,z)` 爆缸大爆**：黑烟蘑菇主柱（26 粒向上）+
  外翻烟团环（22 粒横推）+ 白水花环（18 粒掀水）三合一，单次 66 粒；
  2s 后烟雾仍在飘（测试断言存活），0 粒子池安静降级。
- **爆炸音效 `Audio.sfx.explosion()`** 三层合成：① 低频砰炸（900Hz 噪声
  骤降 + 140→32Hz 方波冲击）② 金属崩散"哗啦"（2.4k/1.7k 双段短促噪声簇，
  sched 排队可被 stopAllSfx 掐断）③ 尾随轰隆烟腔共鸣（220Hz 低通长尾 0.9s）。
  GO 帧爆缸先 `stopAllSfx()` 掐掉膨胀低吼，爆炸不再被引擎声盖住。
- 每爆缸者一份：explosion + falseStart 双层轰爆 + emitBlast 大爆烟 +
  整船抽跳 + 便利贴；AI 爆缸同样原地冒烟（画面热闹）。
- 回归：phase6 新增 5.5 项（爆烟量/烟雾 2s 存活/0 池安全）；全链 **60 项绿**；
  dev 5173 serving 新 Spray/Audio/main ✓。

---

## 小地图起终点标记（用户要求：左下角地图要标注起终点）

- `MiniMap.js`：起终点从 8px 黑点升级 = **黑白格旗标**（沿航道真实弧长
  ±9m 投影成垂直航道的棋盘短门，5 格黑白交替 + 墨线垫底，任何转向下
  都正切航道）+ 纸底小签 **"起终点"/"Finish"**（i18n `minimap.finish`，
  中英齐全，phase7 i18n 键 16 个）。
- 回归：phase7 小地图用例新增旗标 lineTo 段数断言；全链 59 项绿；
  dev 5173 serving 新 MiniMap ✓。

---

## 起步规则重设计：倒计时"拉转速"（用户两轮反馈迭代，最终玩法）

用户需求演进：① 倒数按加速 → 慢慢爆缸膨胀，GO 帧才真爆缸，惩罚 = 按住
时长×0.5；"1"秒内才按 = 起跑加速奖励 → ② **要引入初始速度**：倒计时按键
速度刻度就要变化，玩家要在合适时机按键、GO 帧转速落在合适区间才拿起跑
加速；否则启动即爆缸（惩罚）；老实等 0 起步 = 不奖不罚。

- **转速系统（核心新玩法）**：倒计时期间油门 = 空挡轰油门——只拉
  `entry.rev`（Gauge 指针实时上表），**船体真实速度恒 0、零位移**
  （raceLive 冻结不变）。升速 8 m/s²、回落 1.2 m/s²、上限 17（≈61km/h 表显）。
- **GO 帧转速定命运**（`RaceState._resolveStarts`）：
  - 转速 ∈ 绿区 [7.4, 13.2] m/s（27~48km/h）→ **完美起跑**：弹射初速
    = 转速×0.85 + 临时极速/推力加成 1.6s + "完美起步！"便利贴 + 上行扫频音；
  - 转速 ≥ 爆缸线 15.5 → **爆缸**：轰隆爆缸音 + 黑烟火水花 + 便利贴 +
    熄火惩罚 = **首次按住段时长 × 0.5**（油门全吞、极速压到 8）；
  - 其余（松手早掉回 0 / 全程不按 / 低速挂着）→ 正常起步，不奖不罚。
- **慢慢爆缸膨胀 + 引擎声**：胀度 = rev/revMax，马达鼓包胀大 + 越轰越抖 +
  引擎循环音随胀度低吼（`Audio.sfx.engineSwell`，非一次性源，GO 帧起
  engineUpdate 正常接管）。GO 帧保留最后胀度供爆缸表演，爆缸当帧泄气。
- **Gauge 转速可视化**（用户"速度刻度会变化"落点）：倒计时中主针钉 0、
  中央大字数显转速（RPM）；表盘画**绿区弧 + 红色"爆"字刻线** + 橙色
  转速细针——倒计时玩家看得见绿区，收油卡点全凭表感。
- **AI 少量随机抢跑**（用户选项）：每局掷骰，30% AI 全程轰到爆缸、
  30% 用解析时机公式（hold h =（target+drop·start)/(ramp+drop)）收油卡绿区、
  其余老实起步。GO 帧走同一套 `_resolveStarts` 结算。
- **免罪门**：START 之前（菜单上）按着的 W 不拉转速不背抢跑锅
  （`race.startArmed` 由 onStart/onResume 当帧开门）。
- **防回归关键**：GO 帧（updateFlow 已推 phase）仍走膨胀结算——否则最后
  一帧转速漏计，按到 GO 瞬间的人反被判"完美起步"（仿真剧本抓出的边界 bug）。
- 参数全部集中于 `CONFIG.raceFlow.start`；`test/start_rules.test.mjs`
  **10 项**入 npm test（爆缸/绿区/轻点/不按/免罪/定格/AI 双计划/熄火语义/
  racing 冻结）。
- HUD/i18n：`event.perfectstart`（"完美起步！"/PERFECT START）+ 菜单新增
  绿框**起步规则提示条**（`menu.startrule`，中英 + styles.css 手绘绿签）。
- 回归：全链 **59 项绿**（7 phase + start_rules）；`vite build` 在本机被
  rollup 原生库签名问题阻塞（`ERR_DLOPEN_FAILED`，与代码无关，见 KNOWN_ISSUES）；
  dev http://localhost:5173/ 模块 200、已确认 serving 新代码。

---

## 抢跑爆炸（上一版实现，已被上述转速版取代）

- 倒计时期间按油门 = **爆缸惩罚**：`audio.sfx.falseStart()`（低频轰爆+噪声
  碎响）+ `hit` 双层音 + 屏幕便利贴"**抢跑！发动机爆缸了！**"（中英）+
  船位爆一团水花粒子（爆缸黑烟的卡通替身）。
- 规则：油门在倒计时本就被冻结不前进（Phase 7 修复），现在补上"偷轰油门
  的代价"；**每局只罚一次**（防按住不放刷屏），resetRace 复位可再触发。
- HUD EVENT_KEYS / i18n zh+en / Audio.sfx.falseStart 三处注册齐全。

---

## UI/音效微调（用户两条：Esc 暂停停音 + 左侧提示卡通化）

- **Esc 暂停立即停音**：暂停分支 `audio.stopAllSfx() + engineUpdate(0)`——
  引擎声与全部排队旋律（GO/完赛/拾取音符）当帧掐断；Resume/重开后由 tick
  重新起播，不会静音漏音。
- **左侧提示卡通简笔画化**（styles.css）：
  - 左上角信息板 → **纸片卡片**：米色纸底 + 3px 墨线描边 + 手绘投影，
    标题黄色手写字影，FPS/操作说明间手绘虚线分隔；
  - 越界警告 → **歪斜便利贴**：粗描边 + 投影 + 左右抖动动画（warnshake）；
  - 事件提示条 → **弹跳便利贴**：+1.1° 微歪 + 内圈手绘虚线框 +
    缩放弹跳出现动画（eventpop）。
- 回归：npm test 全链 7/7 phase 绿（51 项）；build ✓；CSS 括号配平审计 ✅。

---

## 右上角卡通指针仪表盘（用户指定：赛车指针仪表，简笔画风）

- 新增 `src/ui/Gauge.js`：canvas 手绘仪表盘——**指针式速度表**（0-190 km/h，
  每 40 长刻度带数字、140+ 红区、120 黄基准点、指针平滑摆动、空心轴心）+
  中央大数字 km/h + 表盘下缘**漂移蓄力绿弧** + 底部三格 **RANK 1st/2st…、
  LAP 1/3、TIME m:ss**；纸张底板 + 双线墨线描边 + 投影，全卡通简笔画风。
- 右上角旧文本面板（名次/圈数/时间）与 `#race-hud` DOM/CSS 移除，
  `#hud-gauge` canvas 接管；main 与 HUD 同帧 `gauge.draw()`。
- 回归：`npm test` 全链 **7/7 phase 绿**（51 项断言）；`npm run build` ✓；
  dev 模块 200。

---

## UI/音效 收尾（用户三条：完赛停音、欢迎界面干净、去 phase 文案）

- **完赛音效立即停**：Audio 新增 `stopAllSfx()`——掐断全部在途振荡器/噪声源 +
  清 setTimeout 排队的 GO/完赛/拾取旋律（`sched()` 可取消音符）；**完赛当帧**
  与**重开当帧**各调一次，引擎增益同步归零（结算界面不再轰引擎）。
- **欢迎界面/再来一局残留清除**：结算卡顶部 `🏁 比赛结算` 大标题移除（用户：
  "去掉 menu-card 前面的 result"）；旧 HUD 内嵌结算框（DOM/CSS/JS）四文件
  零引用——结算单一来源 = Menu；所有开局按钮走 `forceCloseAll`；tick 里
  `resultShown` 兜底复位，面板不可能再弹回挡屏。
- **左上角**：去掉 "Phase X" 调试文案；`hud-title` 显示**本地化游戏名**
  （中文"简笔画浪速赛艇"/English "Sketch Wave Racer"），语言切换即时回灌。
- 回归：`npm test` 全链 **51 项**绿（7 phase）；`npm run build` ✓；
  源码审计 11/11 项通过。

---

## UI/音效 收尾（用户三条：完赛停音、欢迎界面干净、去 phase 文案）

- **完赛音效立即停**：Audio 新增 `stopAllSfx()`（掐断在途振荡器/噪声源 +
  清 setTimeout 排队的 GO/完赛/拾取旋律），完赛当帧与重开当帧各调用一次，
  引擎增益同步归零；GO/完赛/拾取旋律全部改走可取消 `sched()`。
- **欢迎界面/再来一局残留清除**：结算卡顶部的 `🏁 比赛结算` 大标题按用户
  要求移除（卡片直接显示名次成绩）；所有开局按钮走 `forceCloseAll`，tick 里
  `resultShown` 兜底复位——面板不可能再弹回。
- **左上角**：去掉 "Phase X" 调试文案；`hud-title` = 本地化游戏名
  （中文"简笔画浪速赛艇" / English "Sketch Wave Racer"），语言切换即时回灌。
- 回归：npm test 全链 51 项绿（7 phase）；build ✓。

---

## UI 文案三处调整（用户指定）

- 左上角去掉 "Phase X" 调试文案；游戏名**跟语言本地化**：中文 = "简笔画浪速赛艇"、
  English = "Sketch Wave Racer"（语言切换即时回灌左上角标题）。
- 结算卡片去掉与外层标题重复的 "result/比赛结算" 大标题行（点完赛后面板直接
  显示名次与成绩，不再"card 前面顶着 result"）。
- 回归：npm test 全链 7/7 phase 绿；build ✓。

---

## 修复 — 用户浏览器反馈：START 报 items.reset is not a function

- `ItemSystem.reset()`：新一局重开——飞行体/视觉效果/事件日志清空、道具箱
  冷却清零并重随机到货、**全船存货与道具效果清空**（main.resetRace 语义补全）。
- `ItemView.reset()`：水弹/水牢泡网格与音爆环全部回收出场景图。
- `main.resetRace` 接 `itemView.reset()`；`showFatal` 错误横幅升级附带
  堆栈前 3 行（今后此类浏览器缺陷直接可见可定位）。
- 回归：`test/phase5.test.mjs` 新增 #9（reset API 存在性 + 状态清账 +
  重开后拾取/使用照常）；全链 `npm test` **50 项**绿；build ✓。

---

## Phase 4 收尾 — 比赛流程完整（倒计时 → 比赛 → 结算）

### 产品

- **RaceState 流程状态机**：`countdown → racing → over`。`updateFlow(dt)` 推进
  （3·2·1 冻结计时/判定/冲线，GO! 闪现 0.8s）；全员完赛当帧发
  `settled` 事件（含冲线顺序）。`flowLabel()` 统一提供展示词。
- `autoStart` 开关：config 默认 true（无头测试直接开跑）；浏览器 main 置
  false 走人工倒计时。AI 在倒计时/完赛均怠速（override 归零）。
- HUD：倒计时大字（3·2·1·GO!）+ 全员完赛后**结算面板**（名次+完赛用时，
  i18n 中英）。新增 `hud-countdown`/`hud-result` DOM + 描边卡通样式。
- 玩家导引剧本参数修正（测试侧）：纯 P 控（无横向阻尼）全速急弯极限环
  漂出航道 → 加 kD 阻尼 + 巡航 12 m/s 后稳定完赛。

### 测试

- `test/phase4.test.mjs` 扩至 **7 项**：新增流程状态机（冻结/GO/结算/顺序）
  与浏览器全流程（真实 HUD + DOM 桩：标签齐全、GO 窗时长、结算面板渲染）。
- `npm test` 全链 29 项绿（~15s）；`npm run build` ✓（574ms）；dev 200。

### 文档

- TEST_PLAN 补 Phase 3（存档）/ Phase 4 用户测试计划；TEST_RESULTS 记收尾轮。

---

## Phase 4 — AI 对手与比赛流程（实现完成，待用户测试）

### 产品

- **3 名 AI 对手**（红/绿/蓝船，出生格错位在玩家身后）：横向 PD 走线控制律
  `RaceState.updateAi`（航向 P×2 − 横向 kP 0.35 − 横向速度 kD 1.4 + 巡航限速
  10.5/9.5/8.8 三档 + 起步/恢复 1.6s 推进窗口），无头扫参验证 3 圈全航道内、
  零越界重置；skill∈[0,1] 线性映射速度档。
- 船体互撞全线接通：玩家与 AI 的 `mates` 互联 → CollisionWorld 船对轻微偏转
  在真实对局生效（挤线、起点群船互相推开，速度可控）。
- AI 复用 Phase 3 全套物理（加速带/跳台/障碍碰撞自动生效）。
- 完赛 AI 漂停（override 归零），不再狂奔。
- `src/boat/AiRacers.js` 新模块（造船/出生格/注册）；main 循环顺序约定
  `updateAi → 全体 boat.update → race.update`。

### 测试

- 新增 `test/phase4.test.mjs` 5 项：AI 3 圈完赛零重置 / 3 出生道全完赛 /
  4 人局名次实时变化+完赛时间排序=名次 / skill→速度档映射 / 完赛漂停。全绿。
- `npm test` 全链：phase1 6/6 + phase2（8 绿+1 裁定 skip）+ phase3 7/7 +
  phase4 5/5；`npm run build` ✓（499ms）。

---

## Phase 3 — 漂移、加速带、跳台、碰撞（实现完成，待用户测试）

### 产品

- **漂移（Shift+方向）**：甩尾（侧向冻结衰减+强注入，上限 7.5 m/s）、转向增强
  ×1.35、掉速加剧；出漂按蓄力（0.55/s，封顶 1.6s）给固定力度 +7 m/s 的小加速；
  短漂（<0.35s）不给 boost，重置不给 boost（防骗加速）。HUD 新增漂移蓄力条。
- **加速带 ×3**（t=0.10/0.42/0.80）：用 RaceState 连续里程正向跨线判定（与圈数
  判定同一帧率解耦机制），横向绕过不触发、同一次通过不重复（冷却 1.5s）；
  临时极速 +6（衰减，总封顶 +10）。
- **跳台 ×1**（t=0.30，高 1.7m）：≥6 m/s 冲上坡顶弹射起飞 → 抛物线弹道
  （gravity 22）→ 落水浮动缓冲（sin 上浮曲线 + 拍减速 ×0.55）→ 恢复航行。
- **碰撞**：S 弯木桩 ×5 + 中央大岛圆柱近似（CollisionWorld，Visual≠Collider）
  推开+法向反弹+整体降速；船-船圆柱对：对半推开 + 连线动量分量交换 ×0.6
  （轻微偏转，等质量近似）；空中船不参与碰撞。事件词（漂移加速/加速带/起飞/
  扑通/咣当）进 HUD + i18n（中英）。
- `BoatController` 增 ctx 依赖注入（track/features/race/collision/mates，全部
  可选，未注入=Phase 1 行为）；AI 复用同一物理入口（Phase 4 用）。
- `i18n`：越界警告文案 3.5s→8s（与代码一致的历史遗留错位）。

### 测试 / 工具

- 新增 `test/phase3.test.mjs` 7 项（漂移甩尾+出漂加速、蓄力分级、跳台弹射
  落水、加速带触发/绕过/极速、木桩反弹无穿模、船撞推开、空撞共存），
  全绿，运行 <2s。
- `npm test` 链改为 phase1 + phase2 --stop-at-8 + phase3：
  - phase2 第 8 项=已裁定测试剧本误报（KNOWN_ISSUES D，用户指示不修订），
    --stop-at-8 跳过执行保留裁定语义；
  - 第 9 项暴露并修复历史剧本缺陷（见 KNOWN_ISSUES F），现真实通过。
- dev/build 通过（仅 three 体积警告，遗留 #4）。

---

# Changelog

格式：每个阶段一条记录。

## [Phase 0] — 项目初始化与文档系统（2025-09-23）

### 新增

- `project-docs/` 全部 10 份项目状态文档
- Vite 5 工程（`package.json`、`vite.config.js`、`index.html`、`.gitignore`、`README.md`）
- Three.js 0.169 依赖安装
- 最小可运行 3D 场景：
  - `src/main.js` — 渲染器 / 场景 / 相机 / 光照 / 主循环 / FPS 统计 / 窗口自适应
  - `src/config.js` — 全局配置常量
  - `src/styles.css` — 纸张底色 + 手绘风 HUD 样式
  - 占位物：网格地面、旋转黄色立方体（MeshToonMaterial）、红色坐标柱
  - HUD 左上角显示标题、当前阶段、FPS

### 修改

- 无（首个阶段）

### 修复

- 首版 `src/main.js` / `src/config.js` 使用了 `#` 注释导致语法错误 → 改为 `//`

### 已知遗留

- three 单 chunk 体积警告（见 KNOWN_ISSUES #1）

## [Phase 1] — 基础水面场景与玩家载具控制（2025-09-23）

### 新增

- `src/water/Water.js` — 动态海面：4 层正弦波顶点动画、解析法线、深浅双色、
  简化菲涅耳边缘提亮、太阳半郎伯 + 高光条带、波峰白帽、手动距离雾；
  共享函数 `sampleWater(x,z,t)` 供船体/浮标/后续 AI 复用
- `src/world/Sky.js` — 渐变天穹 Shader + 太阳光晕 + 14 座确定性布景的远景简笔岛
- `src/world/Buoys.js` — 26 个随波上下起伏摇摆的红/绿浮标（驾驶参照物）
- `src/boat/BoatModel.js` — 卡通船占位模型（船体+尖头+驾驶舱+驾驶员+马达+小旗），
  全部低模 + BackSide 墨线描边；碰撞体为数据（cylinder），不建网格
- `src/boat/BoatController.js` — 街机式水上的驾驶：油门/刹车/倒车、水阻指数衰减、
  舵量平滑（转向惯性）、低速转向弱、转弯侧向滑移、随波浮动/横摇、加速抬头
- `src/camera/FollowCamera.js` — 第三人称平滑跟随：随速度拉远拉高、注视点前移、
  帧率无关指数插值、镜头下限防埋水
- `src/core/InputState.js` — 动作语义化键盘输入（W/S/A/D + 方向键，失焦清键）
- `test/phase1.test.mjs` — headless 单元测试（6 项）+ `npm test`

### 修改

- `src/main.js` — 重写：组装水面/天空/浮标/船/摄像机/HUD 主循环
- `src/config.js` — 新增 water / boat / followCam 参数组
- `index.html` / `src/styles.css` — HUD 增加操作提示与底部速度条（墨线框+斜纹填充）
- `package.json` — 增加 `npm test`

### 修复

- headless 测试首跑暴露：测试桩缓存了旧 input 引用导致"松油门不停船"误报
  （控制器本身无 bug）；同时修正测试中 heading 符号方向断言

## [Phase 2] — 赛道、边界、检查点与圈数（2025-09-23）

### 新增

- `src/track/Track.js` — 906m 海湾环线（Catmull-Rom 向心样条，14 控制点）；
  `nearest(x,z)` 弧长投影查询；10 个检查点；半宽 15m；3 圈赛制常量
- `src/track/TrackView.js` — 程序化赛道可视化：半透明航道水带、240 随波浮标链、
  起终点格纹横幅（canvas 原创棋盘贴图）、10 检查点拱门、中央地标岛+5 椰树、
  S 弯 5 根交错木桩（视觉占位，Phase 3 上碰撞）
- `src/race/RaceState.js` — 比赛进度核心：检查点顺序制圈数（防倒穿/跳点）、
  越界软减速 + 3.5s 自动重置到最近检查点、累计进度实时排名、完赛用时排序、
  圈速记录、事件流（lap/finish/reset）
- `src/ui/HUD.js` — 名次/圈数/时间面板、越界闪烁警告、过圈事件条
- `src/i18n/i18n.js` — zh/en 字符串字典 + {占位}替换；浏览器语言自动选择；
  localStorage(swr-lang) 覆盖
- `test/phase2.test.mjs` — 7 项逻辑单测（赛道长度/最近点/计圈/防作弊/排名/
  越界重置/三圈完赛）
- `tools/e2e_lap.mjs` — 浏览器级完赛验证：确定性弧长驱船绕 3 圈直至完赛，
  断言 lap 事件 ×3、HUD "Lap 3/3"、第 1 名、零 JS 错误
- `project-docs/shots/phase2-lap-finish.png` — 完赛截图取证

### 修改

- `src/boat/BoatController.js` — 输入读取重构为 `_throttle()/_steerInput()`，
  支持 `override` 覆盖口（越界减速、后续 AI 复用）；新增 `setPose()`
- `src/main.js` — 组装 Track/RaceState/HUD；出生位起点线后 6m；R 键重置；
  删除 Phase 1 散置浮标（并入赛道）
- `index.html` / `src/styles.css` — 右上名次面板、警告条、事件条样式
- `package.json` — `npm test` 并入 phase2；`npm run test:e2e` 并入完赛 e2e

### 修复（开发期发现，均有测试锚定）

- i18n 字典值误写为函数且参数名遮蔽翻译函数 → "f is not a function" 崩页；
  改为纯字符串 + 占位替换（教训已写入 i18n.js 注释）
- e2e 自动驾驶在大 lookahead + 软渲染低帧率下环绕震荡绕不出弯：先后试过回中项、
  纯追踪均不稳 → 改为弧长确定性驱船（测圈数逻辑，驾驶路径由真实按键 e2e 覆盖）

## [Phase 2 修复中 — 未完结]（同日，用户打回后）

### 修改（针对用户反馈"圈数不变，也没完赛横幅"）

- `src/race/RaceState.js`
  - 检查点判定从"相邻帧 progress 跨过 + 物理贴近"改为**单调累计进度
    `_monot` 跨过 cp.t**（低帧率/大 dt 不吞事件；倒退与倒穿仍被拒）
  - 删除中途加入的"贴近检查点才判过"条件（曾造成放置死锁）
  - `resetRacer` 重构出公开 API `placeAtCheckpoint(e, cpIndex)`：
    清速度/越界状态并把 `_monot` 重锚为**船位真实投影** `nearest().t`
    （曾用 `cp.t+0.001` 固定值，偏差 ~0.01 造成判定死锁）
- `src/main.js` — `window.SWR` 暴露 `debugPlaceAt(cp)` 调试 API（e2e/控制台用）

### 未验证 / 未完成

- 上述修复**没有通过任何真实键盘端到端验证**；旧 `tools/e2e_lap.mjs`
  （注入驱船）与真实路径不符，其 PASS 属假阳性，掩盖了用户可复现的 bug
- `tools/e2e_repro.mjs`（分段导引真实驾驶一整圈）反复调参未收敛，
  最后一次运行被用户叫停（长时间等待/循环风险），进程已清理
- 结论：Phase 2 保持打回状态，禁止进入 Phase 3

---

## [Phase 2 修复 — 圈数判定重写]（同日第二轮，用户实测已确认）

### 修复（产品）

- `src/track/Track.js`
  - `nearest()` 重写：对**采样段做投影**（段内 u 连续，弧长无端点阶梯），
    接受上一帧 `hint` 做 ±8 段窗口跟踪；劣化哨兵比较"粗扫点距离−半段"与
    "窗口段距离"（修正单位后直跑中心线不再每帧误重扫）
  - 新增 `arc`（线性未回绕弧长）与 `hint` 返回字段；起点线附近 ±整圈
    假跳变彻底消除（"圈数不变"第一真根因）
- `src/race/RaceState.js`
  - 判定改为**连续里程 `_arcN`**（只前进；单帧吸收 ≤25m；倒退/传送重锚且
    不判过）；过点 = `_arcN` 抵达 `cpArc[nextCp]`（曲线精确投影弧长）
  - 越界惩罚去死锁：水阻衰减带 **≥2m/s 下限**、自动重置 3.5s→**8s**、
    落点=**几何最近**检查点、重置**不清零速度**（第二真根因：每圈被拽回
    20+ 次的惩罚循环）
  - `placeAtCheckpoint` 重锚 `_arcN/_s/_s_prev` 到落点真实弧长
  - 新增 `autopilotKeys(e)`（Phase 4 AI 走线：鞋带公式自动校准内侧法线 +
    弯率预判收油）、`_racingLinePoint`、`_nearestCpIndex`
- 用户人工实测确认：圈数正常更新，打回问题解决

### 测试 / 工具

- `test/phase2.test.mjs` 重写扩充至 8 项：新增弧长连续性回归（窗口 vs 全量、
  跨圈单调）、越界 8s/水阻下限、真实 BoatController 键盘驱动计圈用例
  （第 8 项目前 red：悬空引用 `RaceState.driveKeys` + 8fps 剧本物理不成立，
  改法已注释在测试内，见 KNOWN_ISSUES D）
- `tools/e2e_lap.mjs` 推倒重写：**只用真实 CDP keyDown/keyUp**（禁 override/
  位置注入），页面内 rAF 导引 + Node 翻译按键，55s 硬超时，输出 trace + 一张
  截图；`tools/e2e_repro.mjs` 与临时实验文件删除
- git 仓库初始化，检查点 68bb93d / 16451f8 / 72a6528

### 待办（下一会话）

1. 修 KNOWN_ISSUES D → `npm test` 全绿
2. 跑 `node tools/e2e_lap.mjs`（≤55s）补真实按键取证
3. USER_ACCEPTANCE/ROADMAP 收口 → Phase 3
