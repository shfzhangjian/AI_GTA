# CHANGELOG

## 当前迭代 — 视觉/玩法修订（2026-09-29）

- 潜水员出水逻辑重写：身体不再整体抬出水面；改为按当前帧高度计算 `diverExposedHeight`，
  并用 three.js 局部裁剪显示水线以上的头肩层。
- 新增氧气/生命基础系统：水下耗氧、露出水面恢复、缺氧扣生命；HUD 显示氧气槽和生命槽。
- 鱼碰撞行为调整：普通鱼碰到潜水员后快速反方向逃离，不再表现为被潜水员推着走。
- 危险鱼按当前需求下线：`ACTIVE_FISH_DEFS` 过滤 `aggressive` 和 `boss`，生成器和调试接口只使用安全鱼池。
- 鱼叉交互加强：保留瞄准、蓄力、发射、冷却、命中特效和鱼死亡短暂反馈；隐藏发射后长绳拖尾。
- 水面外部加入昼夜循环、太阳/月亮轨迹和星空；船体改为程序化绘制。
- 水底气泡升级：从海床附近成簇生成，更大、更慢起步，受浮力加速、终端速度、压力膨胀和摆动影响。
- 验证：按用户要求仅做静态检查，最近 `tsc --noEmit` 和 `vite build` 均通过；未使用已有测试脚本。

## 阶段 7 — 鱼叉捕鱼（完成）

- src/core/mouse.ts：鼠标移动/左键追踪；正交相机世界坐标换算；consumeLeftPress 单次消费。
- src/systems/HarpoonSystem.ts：
  * HARPOONS 数据表（basic：伤害 12、初速 620u/s、水阻 drag 1.1、寿命 1.7s、击退 90）
  * HarpoonProjectile：发射朝准星、指数水阻、飞行朝向跟随速度向量、寿命消耗
  * HarpoonSystem：0.45s 发射冷却、对象池复用（实测 19 发仅 2 个池对象）
  * CollisionSystem：鱼叉-鱼 AABB（按鱼 scale 半宽/半高）、命中扣 hp、
    hp≤0 → state='dead' + alive=false 交回收、命中击退、单发消耗
- World/main 接线：createWorld(engine, input, mouse)；测试钩子
  __UE_FIRE_HARPOON/__UE_HARPOON_STATS/__UE_PIN_FISH（引擎内钉住稳定测试目标）。
- scripts/harpoon-check.mjs 6 断言全过：发射+飞行推进、命中+击杀（hits=1 kills=1）、
  统计自洽、冷却（3 连发 1 支出膛）、池复用（19 发 2 对象）、页面异常 0。
- 修复测试目标定位缺陷：数组索引在鱼群回收重排中漂移导致"钉住的鱼"换个体——
  改为引擎 tick 内 __UE_PIN_FISH 持续钉住 + STATES 输出携带 hp。
- 回归：runtime-check 12/12、fish-check 14/14、deco-check 6/6、check-assets PASS。
- 素材：复用 weapons/harpoon.png（CC0 原创）+ 鱼图集；无新资产。
- 未实现：捕鱼入包/负重（阶段 8）、鱼叉绳索/链条视觉、升级鱼叉（后期）。

## 阶段 6 — 扩展到 50 种鱼（完成）

- src/data/fish.ts：10 → 50 种鱼，构成 25 common + 4 uncommon（29 普通带）/ 8 rare /
  6 deep / 5 aggressive / 2 boss；全部 16 字段、id 唯一、0 数据违规（页面内断言）。
  素材全复用 16 张 CC0 源图 + tint 变色（登记不变）。
- 深度五带全覆盖：0-30(15 种) / 30-60(12) / 60-100(14) / 100-150(14) / 150-260(12)，
  depthMax=260 表世界深渊带；rarity 差异化（普通 5-7、稀有/危险/大型 1）。
- 新行为模板 charge（危险鱼索敌冲撞，第 4 模板复用现有 tick）：
  aggroRadius 300-400u 内朝玩家 1.6× 加速逼近 2.6s 冷却；5 危险鱼（reefshark/blacktip/
  saberfish/crimsonfin/trenchfang，鲨鱼灰蓝色系 + 剑鱼 dart 素材）+ 2 大型 boss
  （sunkenwhale/leviathalfish，depth_big_fish 素材）。阶段 11 鲨鱼 AI 在此基础精修
  （前摇/咬击判定/退避）。
- 数值曲线：稀有 150-165u/s 最快、危险 130-175、深海最慢 55-78；
  重量 0.2→300kg、价值 14→1500 金币（大型鱼为负重/价值大头）。
- scripts/fish-check.mjs 扩至 14 断言全过：50 种完整性/构成计数/五带覆盖/charge 模板数
  + 阶段 5 全部断言（速度差异 pinkbass=220 实测、fleeing 14 条、鱼数 25≤40 回收、重叠 0）。
- 测试基建调优：runtime-check URL 统一 index.html?devdt=0.03&test=1（CDP 往返~0.4s/样本
  与固定步长匹配，惯性过渡样本 4 帧重现）、drive 轮询窗 12s、snap 防 null。
- 回归：runtime-check 12/12（含惯性起步 4 帧渐进）、fish-check 14/14、deco-check 6/6、
  check-assets PASS、console 异常 0。

## 阶段 5 — 10 种鱼验证架构（完成）

- src/data/fish.ts：10 种鱼数据表（id/name/category/sprite/hp/speed/weight/value/
  depthMin/depthMax/behavior/aggressive/rarity + scale/tint/schoolSize）；
  fishAtDepth(depth) 查询；行为仅 3 模板（cruise/school/flee）复用。
  速度差异化 45~120u/s；深度带 0–130m；rarity 权重生成。
- src/entities/FishEntity.ts：位置/速度/朝向/leader(群)/hp/state/spawnDepth。
- src/systems/FishManager.ts：
  * FishSpawner：视野边缘生成、rarity 加权 + 深度过滤、重叠抑制（生成间距 46u）、
    school 一次成群（5-6 员，offset 跟随领队）；0.6s 节奏、上限 40。
  * FishBehavior：cruise 巡游（变向/回头/波状起伏）、school 队形追随（掉队自动转巡游）、
    flee 玩家 220u 内 2.1× 逃离 3s。
  * FishManager：精灵对象池、距离回收（1400u）、sprite 朝向翻转、按鱼源图共享。
- 验证脚本 scripts/fish-check.mjs（9 断言全过）：去重采样 238 实例、7 种出现、
  生成深度记录全部合规（spawnDepth 审计）、速度差异 redsnapper=243>pinkbass=105>…>browngoby=45、
  fleeing 4 条触发、巡游后 28≤40 回收、鱼源贴图 7 张共享、重叠 0、页面异常 0。
- 修复测试基建两缺陷（记录在案）：页面 ?probe=1 的 window.close()/定时器与
  长跑 CDP 会话冲突 → 验证脚本改用无 probe 纯 devdt 页面；CDP 断言散落 await
  导致 top-level-await 竞态 → 断言集中于 finish() 阶段。
- 回归：runtime-check 12/12、deco-check 6/6、check-assets 全绿。
- 未实现：鱼叉捕鱼（阶段 7）、50 种扩展（阶段 6 需确认）、危险鱼攻击（阶段 11+）。

## 阶段 4 — 海底环境丰富（完成）

- src/world/Decorations.ts：程序化环境装饰系统——9 类装饰表（SHEETS）驱动：
  海草×3（摆动 sway 0.08-0.1 rad + 缓慢上浮感）、岩石×2、近景小珊瑚丛×3 切片、
  中景图腾×2、远景拱门/柱廊大构件、漂浮剪影；确定性散布（mulberry32 种子 1337）。
- props_coral 图集（1024×496，CC0 ansimuz）连通域分析切出 10 个构件
  （拱门×2、图腾柱×2、柱廊、碎石×2、黄/紫珊瑚丛、海扇），存 src/data 级常量 CORAL_SLICES。
- 三层视差：decorFar（跟随系数 0.45）/ decorMid（0.72）/ decorNear（1.0），
  相机平移驱动，与背景/水/地形/实体层共同构成 5 层视觉纵深。
- 性能：源纹理 6 张共享（160 装饰实例仅 6 次纹理加载）；视野休眠（160→45~62 激活）；
  显隐检查 20Hz 节流；实测 drawCalls 30（装饰+粒子+地形+光束全部 <250 限值）。
- 海床深度分层重做（修复"海床过深装饰永不显示"缺陷）：Terrain.groundYAt 大尺度海床带
  随横向位置 -25m 浅滩 ↔ -67m 深槽（sin 叠加），潜水员横游即穿越深度层；
  世界底界常量 MAX_DEPTH_UNITS=-3000，WORLD_X_LIMIT 移入 Terrain 共享。
- scripts/deco-check.mjs（新增无头断言）：装饰量/纹理共享/激活休眠/drawCalls/长途巡游/0 异常。
- 验证：tsc PASS、build PASS、runtime-check 12/12 PASS、deco-check 6/6 PASS、check-assets PASS。

## 阶段 3 — 潜水员角色（完成）

- src/data/diverClips.ts（数据驱动）：由 scripts/gen-diver-frames.py 从素材 alpha 通道分析生成的
  5 组动画帧表（swim 7帧/idle 6帧/hurt 5帧/fast 5帧/rush 7帧，等宽帧+居中包围盒，帧位置唯一性已验证）。
- src/core/input.ts：WASD/方向键轴输入（加速度模型消费）；?devkey=1 测试模式；
  __UE_INPUT_TIMERS__ 程序化注入通道（与真实按键共用同一 active 集合）。
- src/entities/Diver.ts：水下惯性运动——ACCEL 1500 + 指数阻尼 3.4 + 最大速度(250/210 u/s) clamp，
  悬停缓沉；水平速度驱动朝向翻转；移动=swim / 悬停=idle 动画切换；
  边界：水面探出≤6m、海床地形钳制、左右 ±150m。
- src/utils/spritesheet.ts：ClipDef 帧矩形切帧 + ClipPlayer 帧动画播放器。
- World：相机平滑跟随潜水员（指数趋近、面朝方向前瞻 30u、垂直 0.85 系数、
  水面/海床夹取），阶段 2 自动巡游已移除。
- 测试脚手架（无截图规范）：engine ?devdt=N 固定步长（headless 虚拟时间 rAF 稀疏问题的对策）；
  velSamples tick 级速度演化证据；scripts/runtime-check.mjs（CDP 原生 WebSocket 客户端，
  注入真实 Input.dispatchKeyEvent，断言四方向位移/朝向翻转/阻尼/惯性起步/边界/0 错误/three 未打包）。
- 修复过程记录（重要）：诊断出无头模式 rAF≈2次/秒 + 合成键 preventDefault 丢弃两问题，
  以 devdt 步长放大与 Input 通道解决；物理本身为纯 dt 积分无缺陷
  （实测加速曲线 0→48→96→…→250 线性爬升，无瞬移）。
- 验证：tsc PASS；build PASS（dist 无 three 代码）；runtime-check 12/12 PASS；check-assets PASS。
- 未实现：鱼叉、伤害、氧气（后续阶段）。

## 阶段 2 — 基础 three.js 海底场景（完成）

- src/core/engine.ts：Scene / WebGLRenderer / OrthographicCamera（固定 540 世界高、随窗口调宽）
  / requestAnimationFrame 游戏循环（dt 上限 0.05s）/ resize 处理；
  五层 Group：BackgroundLayer / WaterLayer / TerrainLayer / EntityLayer / EffectLayer。
- src/world/WaterBackground.ts：GLSL 纵向渐变（浅海蓝 #4fb8e8 → 中层蓝 #1565a0 → 深海暗蓝 #041a30），
  按深度均匀压暗，随相机移动覆盖全屏。
- src/world/WaterSurface.ts：水面亮带 + 5 束太阳光（加法混合、缓慢摆动、>130m 深度渐隐）。
- src/world/Terrain.ts：程序化海床（三重正弦高度场），沙地块 + 深色断面带，
  随相机横向范围平铺，Mesh 回收池复用；常量 UNITS_PER_METER=10、最深 -260m。
- src/world/Particles.ts：气泡 60（上升）+ 漂浮尘埃 120（缓沉），THREE.Points + Kenney CC0 贴图，
  视野四周环绕回收。
- src/world/Boat.ts：母船占位（Kenney CC0 ship sprite，水面起伏）——阶段 16 才接逻辑。
- 运行时状态输出：src/core/debug.ts（window.__UE_DEBUG__：fps/深度/粒子数/地形段/drawCalls/错误列表）、
  src/core/fps.ts、src/ui/DebugHud.ts（顶部调试条）、?probe=1 无头验证钩子（控制台打印 __PROBE__ JSON）。
- 阶段 2 相机自动缓慢巡游（0 ~ -120m 往复）以验证分层与渐变；玩家控制在阶段 3 接管。
- 验证：tsc PASS；vite build PASS（dist 不含 three 代码，产物 9KB）；
  headless Chrome（SwiftShader，非截图，读控制台）：boot ok、0 页面错误、
  状态输出 bubbles=60 motes=120 segs=46 drawCalls≈9 errors=0。
- 未实现：玩家、鱼、鱼叉、UI 正式化（后续阶段范围）。

## 阶段 1 — 分析和整理素材（完成）

- 本地素材盘点：Downloads 中无潜水/鱼类素材；仅有 Kenney CC0 海盗包（船体/船壳/木板 → 用作母船与沉船部件，已核对包内 License.txt = CC0）。
- 网络调研（逐个核查许可证页面后下载，共 4 批）：
  - Kenney Fish Pack 2.0（CC0）：鱼×13、海草×9、岩石、沙地瓦片、气泡、HUD 数字 → fish/seaweed/rocks/effects/ui
  - ansimuz Underwater Diving Pack（美术 CC0）：潜水员 5 组动画、大鱼/深海鱼/镖鱼、珊瑚道具、视差背景、瓦片、FX
  - Kenney UI Pack + Interface Sounds（CC0）：面板框、UI 点击音
  - CC-BY：Pascal Belisle「Watery Cave」BGM loop（CC-BY 3.0）、Mateus Ferreira 水肺潜水员大图（CC-BY 4.0，备用）
- 本项目原创素材（程序绘制/合成，声明 CC0）：行为 SFX（WAV）、宝箱三态、鱼叉、4 个生物占位美术（鲨/鮟鱇/鱿鱼/剑鱼）。
- 弃用记录：OGA jute 音效包（版权质疑）、CC-BY-SA 音乐（传染性）、Pixabay CDN（403 不可达）。
- 产出：scripts/check-assets.mjs（空文件/异常扩展名/重名/魔数/引用完整性检测）、docs/ASSET_MAPPING.md（含帧数/尺寸/alpha）、docs/ASSET_LICENSES.md（全量登记+署名汇总+缺失推荐）。
- 资产规模：109 个文件 / 3.7MB；check-assets PASS；tsc/build PASS。
- 缺失待补（推荐已列入 ASSET_LICENSES.md 候选池）：鲨鱼/鮟鱇/鱿鱼/剑鱼正式美术、整船沉船美术、深海/Boss BGM、水下 ambience。

## 阶段 0 — 建立项目与规范（完成）

- 创建 `underwater-explorer/` Vite (Vanilla TS) 项目：`package.json` / `tsconfig.json` / `vite.config.ts` / `index.html`。
- 依赖：typescript 5.9.3、vite 5.4.20、three 0.186.1 + @types/three 0.186.0（仅类型检查）；
  three.js 运行时通过 **CDN importmap**（jsdelivr）加载，dev alias + build external 双重保证不打包。
- 环境适配：本机 macOS 库校验禁止 node dlopen 第三方 `.node`，采用 `@rollup/wasm-node` 覆盖 rollup（vite 8/rolldown 无稳定 JS/WASM 回退，锁定 vite 5）。
注：`patches/rollup@4.63.5` 为该环境修补的一部分，请勿删除；`@rollup/wasm-node` 为纯 JS/WASM 官方构建。
- 完整目录骨架：`public/assets/*`（player/fish×6/creatures×5/environment×6/boat/ui/effects/audio×3）与 `src/*`（core/game/entities/systems/world/ui/audio/data/utils/styles）。
- 文档：PLAN / GAME_DESIGN / ASSET_LICENSES / ASSET_MAPPING / TEST_CHECKLIST + README。
- `npm/pnpm run build`（tsc --noEmit + vite build）通过。
- 无任何游戏玩法代码。
