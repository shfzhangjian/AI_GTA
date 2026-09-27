# Test Results

自动化 / 静态检查记录（人工测试结果由用户反馈后补充）。

---

## Phase 0 — 项目初始化与文档系统（2025-09-23）✅ 用户已验收

环境：macOS arm64 · Node v22.23.1 · npm 10.9.8 · vite 5.4.21 · three 0.169.0

| 检查项 | 命令 / 方式 | 结果 |
| --- | --- | --- |
| 静态语法检查 | `node --check src/main.js` `node --check src/config.js` | PASS（首跑发现 JS 文件误用 `#` 注释，已修复后通过） |
| 生产构建 | `npm run build` | PASS（✓ built in 443ms，生成 `dist/`；仅 three 单 chunk >500kB 的体积警告，非错误） |
| 开发服务器 | `npm run dev` | PASS（Vite ready，监听 `http://localhost:5173/`） |
| 页面可访问 | `curl http://localhost:5173/` | PASS（HTTP 200，含 "Sketch Wave Racer" 标题） |
| 模块可访问 | `curl /src/main.js` `/src/config.js` `/src/styles.css` `/node_modules/.vite/deps/three.js` | 全部 HTTP 200 |
| 人工测试 | 用户确认 | ✅ 通过（回复"ok，继续"） |

---

## Phase 1 — 基础水面场景与玩家载具控制（2025-09-23）

| 检查项 | 命令 / 方式 | 结果 |
| --- | --- | --- |
| 静态语法检查 | `node --check` × 9 个模块 | PASS（一次通过） |
| headless 单元测试 | `npm test`（`test/phase1.test.mjs`，6 断言：波浪数学/单位法线/时变性、全油门收敛 maxSpeed=16、水阻停船、右转航向单调变化、倒车限速 -5、舵量平滑惯性） | PASS（首跑 2 处断言失败均为**测试桩自身问题**，修正桩后全绿；控制器代码无缺陷） |
| 生产构建 | `npm run build` | PASS（✓ built in 427ms；仅 three 体积警告） |
| 开发服务器 | dev 进程持续运行 + `curl` | PASS（`/` 与全部 7 个新模块 HTTP 200，HMR 生效） |
| 浏览器实际渲染 | —— | 待用户人工测试（环境无浏览器工具，不虚构） |

### 人工测试结论（用户反馈后填写）

- [ ] 海面动态起伏 + 高光 + 波峰白帽可见（非纯蓝平面）
- [ ] 驾驶有滑行感：加速抬头、转弯甩尾侧滑、水阻缓停
- [ ] 摄像机平滑跟随、加速拉远、无抖动
- [ ] 浮标/船随波上下
- [ ] 控制台无报错；`npm test`、`npm run build` 全绿
- 用户反馈：待填写

### 用户反馈「WSDA 没反应，海面没有起伏」→ 诊断与修复（同日）

| 检查项 | 方式 | 结果 |
| --- | --- | --- |
| 模块初始化冒烟 | Node 桩加载真实 main.js | 定位到 WebGL/HUD 抛错路径 |
| 真实浏览器 E2E | Chrome headless + CDP 派发真实 keydown/keyUp（`npm run test:e2e`） | PASS：W→speed 16 / 位移 21.6m / HUD 58km+h；A→heading Δ1.4 / lateral 1.35；零 JS 错误 |
| 截图取证 | `project-docs/shots/phase1-e2e-driving.png` | 船已驶离起点、随波航行、速度条增长 |
| 回归 | `npm test` + `npm run build` | 全绿 |

---

## Phase 2 — 赛道、边界、检查点与圈数（2025-09-23）

| 检查项 | 方式 | 结果 |
| --- | --- | --- |
| 静态语法检查 | `node --check` × 全部新/改模块 | PASS |
| 逻辑单测 | `node test/phase2.test.mjs`：赛道长度 906m / 最近点投影 / 正圈计数(lap2, 圈速56.6s) / 倒穿跳点不计圈 / 排名反超 / 越界 4s 重置回航道 / 三圈完赛 | PASS 7/7 |
| 浏览器完赛 E2E | `node tools/e2e_lap.mjs`：真实页面驱船 3 圈，断言 lap 事件×3、HUD "Lap 3/3"、place=1、零 JS 错误 | PASS（截图 `shots/phase2-lap-finish.png`） |
| 真实按键回归 | `node tools/e2e.mjs`（W 加速→speed 16 位移 13.7m、A 转向 heading Δ、零错误） | PASS |
| 生产构建 | `npm run build` | PASS（✓ 559ms） |
| dev 服务器 | 持续运行，新模块全部 HTTP 200 | PASS |
| 浏览器实际渲染/操作手感 | —— | 待用户人工测试 |

### 人工测试结论（用户反馈后填写）

- [ ] 赛道整体可见：航道水带 / 浮标链 / 起终点门 / 地标岛
- [ ] 过线计圈 + 绿色事件条正常
- [ ] 越界减速 + 红色警告 + 3.5s 自动重置正常
- [ ] R 键重置正常；倒穿起点不计圈
- [ ] 跑满 3 圈出现完赛条
- [ ] `npm test` / `npm run test:e2e` / `npm run build` 全绿
- 用户反馈：待填写

### 用户打回后调查记录（同日，未完成）

| 检查项 | 方式 | 结果 |
| --- | --- | --- |
| 真实物理驾驶复现 | `tools/e2e_repro.mjs` 多轮（override 导引） | **不确定**：船在 t≈0.83↔0.90 段反复绕圈；`_monot` 在增长、nextCp 确认到 2 后卡住（脚本兜底逻辑有缺陷，非产品结论） |
| 浏览器内 trace | `/tmp/trace2.json` 1650 帧全量状态 | 已存档；显示导引船急转死区（err 恒 -3.13、位置冻结于出生点）—— 导引脚本 bug，非判定 bug |
| 单测 | `node test/phase2.test.mjs`（warp 传送驱动） | PASS 7/7（但与真实 BoatController 路径不同 → 漏检用户 bug 的可疑点） |
| 注入驱船完赛 e2e | `tools/e2e_lap.mjs` | 曾 PASS —— **假阳性**：绕过真实行驶状态，掩盖了"圈数不变" |
| 截图取证 | `shots/_tmp_repro.png` | 船在航道上、HUD 显示 Time 1:03 / Lap 1/3、速度 1km/h（重置后）——场景/HUD 渲染正常 |

**遗留风险（明确记录）**：`tools/e2e_repro.mjs` 与相关导引存在**长时间等待/卡死
风险**（软渲染 ~30fps 下每段真实驾驶 8-30s，导引不当即无限循环）。新会话使用
任何浏览器 e2e 前：设置 node 侧硬超时、限制每段时长、失败即换策略，禁止连环调参。

---

## Phase 2 修复复验（同日第二轮 — 圈数判定重写）

| 检查项 | 方式 | 结果 |
| --- | --- | --- |
| 圈数判定（用户真实键盘游戏） | 人工实测 | ✅ **用户确认"绕圈不更新等问题已经解决"** |
| 单测 phase1（6 项） | `npm test` | PASS 6/6 |
| 单测 phase2 第 1-3 项 | `npm test`（赛道属性 / nearest 判界 / **弧长连续性回归**：500 点窗口跟踪帧差单调 + 窗口vs全量 300 点一致） | PASS |
| 单测 phase2 第 4-6 项 | `npm test`（warp 驱动：计圈 / 防倒穿跳点 / 排名反超） | PASS |
| 单测 phase2 第 7 项 | `npm test`（越界 8s 重置到几何最近检查点；水阻带 ≥2m/s 下限） | PASS |
| 单测 phase2 第 8 项 | `npm test`（真实 BoatController 键盘驱动 8fps 走线计圈） | **FAIL（测试自身问题）**：仍调用已删除的静态 `RaceState.driveKeys` → TypeError；且 8fps 满舵剧本物理上不成立（见 KNOWN_ISSUES D） |
| 真实按键浏览器 e2e | `node tools/e2e_lap.mjs`（已重写：只发 CDP keyDown/keyUp，55s 硬超时） | ⬜ 未运行（用户要求停止长测试） |

**产品侧关键结论**：真根因在 `Track.nearest`（采样点最近→段投影连续 + 修正单位
的 hint 劣化哨兵）与越界惩罚死锁（衰减到停+3.5s 拽回+清零），已由 RaceState
连续里程 `_arcN` 方案修复并经用户实测确认。

**下一会话验证链**：修 KNOWN_ISSUES D（测试第 8 项改用 `race.autopilotKeys(e)`
连续输出阈值化）→ `npm test` 全绿 → `node tools/e2e_lap.mjs` 补真实按键截图 →
勾 USER_ACCEPTANCE → Phase 3。

---

## Phase 4 比赛流程收尾（本轮 — 倒计时/结算/HUD）

| 检查项 | 方式 | 结果 |
| --- | --- | --- |
| 流程状态机 | phase4 测试 #6（autoStart=false 路径） | PASS：倒计时冻结 time/判定/AI 怠速 → racing → settled 事件含冲线顺序 → over |
| 浏览器全流程 | phase4 测试 #7（DOM 桩驱动真实 HUD） | PASS：3/2/1/GO 标签齐全、GO 窗≈0.8s、结算面板渲染名次行 |
| 多人 4 船完赛排序 | phase4 测试 #3 | PASS：名次实时变化、4/4 完赛、完赛时间序=名次序 |
| 回归 | npm test 全链 29 项 | PASS（phase1 6 + phase2 8+skip + phase3 7 + phase4 7，~15s） |
| 构建/页面 | npm run build + dev HTTP | PASS（574ms / 200） |
| 浏览器实际渲染 | —— | 待用户人工测试（本环境无浏览器渲染验证工具，不虚构） |

---

## Phase 5 道具系统（实现轮）

| 检查项 | 方式 | 结果 |
| --- | --- | --- |
| 道具规则全链 | node test/phase5.test.mjs | PASS 8/8（拾取+冷却 / 极速到期 / 盾挡+再中 / 泡冻结+破泡限速 / 波范围 / AI 真实闭环 / 泡中免疫 / 拒用闸门） |
| 回归 | npm test 全链 37 项 | PASS |
| 构建 | npm run build | PASS |

## Phase 6 真实感水面（实现轮）

| 检查项 | 方式 | 结果 |
| --- | --- | --- |
| 着色器/粒子/分档 | node test/phase6.test.mjs | PASS 6/6（uniform 同源 / 浮动不变 / 菲涅耳+波纹+泡沫源码断言 / 粒子生命周期 / 落水联动 / 分档语义） |
| 无渲染器接线冒烟 | 60s 主循环桩 | PASS（粒子存活 357、船体正常） |
| 回归 | npm test 43 项 + build | PASS |

## Phase 7 UI/语言/本地记录（实现轮）

| 检查项 | 方式 | 结果 |
| --- | --- | --- |
| 菜单/最佳成绩/结算/小地图/i18n | node test/phase7.test.mjs | PASS 6/6（记录含坏 JSON 容错 / 语言切换文案回灌 / 结算★ / 小地图全员 / 13 键中英齐全） |
| 回归 | npm test 全链 **49 项** | PASS（7 个 phase 全绿） |
| 构建/页面 | npm run build + dev HTTP | PASS（536ms / 200） |
| README | 已编写（玩法/操作/画质/结构/测试注记） | DONE |
| 浏览器实际渲染 | —— | 待用户人工测试（不虚构） |

---

## 用户反馈调优 + 音效轮

| 检查项 | 方式 | 结果 |
| --- | --- | --- |
| 120km/h 极速/提速链 | 冒烟：基础 120、加速带 133、⚡148、漂移出漂 170km/h | PASS（实测峰值） |
| 跳台滞空重标（防高速长滞空失控） | 公式 2.2+min(v,34)*0.14+h*1.6 | ≈1.6s 全速（30fps 帧数验证） |
| AI 巡航感知加成 | RaceState.boostNow | 编译+回归全绿 |
| 音效系统 | WebAudio 全合成（引擎/海浪/20 音效/旋律）+ 无 AC 环境降级冒烟 | ready=false 安静降级不崩 |
| 音效开关 | 菜单"音效: 开/关"+localStorage swr-sound | 语义实现 |
| 回归 | npm test 全链 | PASS 7/7 phase 全绿；build ✓ |

---

## 用户反馈三缺陷修复轮（完赛音效残留 / 重开排名残留 / 欢迎界面残留结算框）

| 检查项 | 方式 | 结果 |
| --- | --- | --- |
| 完赛音效立即停（旋律可掐断+引擎归零） | Audio.stopAllSfx + resetRace/over 双调；无头降级冒烟 | PASS（stopAllSfx 存在、无 AC 不崩） |
| 重开后排名/结算框不再显示 | 流程脚本：完赛 flex → 点再来一局 → display=none 且一帧后仍 none | PASS |
| 欢迎界面不残留再来一局框 | 流程脚本：showPauseMenu(false) 时 result display=none | PASS（旧 HUD 内嵌结算移除，单一结算来源） |
| 回归 | npm test 全链 | PASS 7/7 phase 绿；build ✓ |

---

## 结算面板懒建（用户要求：DOM 里不许常驻结算对话框）

| 检查项 | 方式 | 结果 |
| --- | --- | --- |
| 欢迎界面 DOM 无 #result 节点 | 脚本：createMenu 后 findDesc(app,'result')=null | PASS |
| 完赛弹面板（懒建）+ 按钮文案 | showResult 后 open=true，再来一局/回主菜单文案正确 | PASS |
| 点再来一局收面板 + 再完赛重建新面板 | 双次 showResult 复验（含★新纪录） | PASS |
| 回归 | npm test 全链 | PASS 7/7 phase 绿（48 项断言）；build ✓ |

---

## 右上角卡通仪表盘轮（用户指定）

| 检查项 | 方式 | 结果 |
| --- | --- | --- |
| 仪表盘接线（main+HUD 同帧 draw，canvas 桩安全） | canvas 2d ctx 桩（arcTo/fillText/arc 等 noop）全链跑通 | PASS |
| 旧文本面板清除 | grep #race-hud/#hud-place/#hud-lap/#hud-time = 0 处 | PASS |
| 回归 | npm test 全链 7/7 phase 绿（51 项）；build ✓；dev Gauge 模块 200 | PASS |

---

## 起步规则重设计轮（转速定命运 · 用户两轮反馈）

| 检查项 | 方式 | 结果 |
| --- | --- | --- |
| 全程轰 → GO 爆缸，惩罚=按住×0.5，倒计时零位移 | start_rules #1 | PASS（penalty=1.51s） |
| 绿区收油 → 完美弹射（初速+加成+事件词） | start_rules #2 + 主循环等价仿真扫段 | PASS（1.2~1.9s 按住带全落绿区） |
| 轻点/不按 → 不奖不罚 | start_rules #3/#4 | PASS |
| START 前按着 W 免罪（startArmed） | start_rules #5 | PASS |
| 首次按住段松手定格，再按不改命运 | start_rules #6 | PASS |
| AI 爆缸/完美双计划解析时机 | start_rules #7 | PASS（perfect 落绿区、blow 惩罚=1.1s） |
| 熄火吞油门 + resetStartLedgers 清账 | start_rules #8 | PASS |
| GO 同帧转速冻结 | start_rules #9 | PASS |
| GO 帧最后一帧转速不漏计（边界漏判 bug） | main tick 序等价仿真抓出 → countdown 分支含 GO 帧结算 | PASS（按 2.1s 正确爆缸） |
| i18n 新键（startrule/perfectstart）中英齐全 | phase7 #6（15 键） | PASS |
| 回归全链 | node 逐 phase + start_rules | PASS 59 项绿；vite build 本机 rollup 签名阻塞（KNOWN_ISSUES H）；dev 5173 serving 新代码 ✓ |
