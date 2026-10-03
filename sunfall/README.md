# 落日协议 · SUNFALL

原创单机浏览器 3D 大逃杀。1 名玩家与 11 名 AI 对手；无多人服务器或付费接口。此目录提供游戏源码、配套静态资源与本地启动脚本。

![落日协议：本地浏览器中的海岛与主菜单](./preview.png)

## 本地启动

本目录保留源码包的角色素材获取方式：Vanguard 原始 GLB 单独从官方来源下载，不纳入 Git；其余代码、Three.js 及原创贴图均已包含。首次运行前请阅读 [第三方素材说明](./THIRD_PARTY_ASSETS.md)。

安装 Python 3 并加入 PATH 后，Windows 可直接双击 [start-game.cmd](./start-game.cmd)，或在本目录运行：

```powershell
python start_local.py
```

启动器会在需要时执行 `setup_character.py`，从 Three.js 官方来源取得模型并核对 SHA-256，保存为 `dist/assets/vanguard.glb`；随后在后台启动仅供本机访问的 HTTP 服务，并打开 <http://127.0.0.1:4177/>。首次获取模型需要联网，补齐后运行无需联网。已启动时会复用服务，不重复占用端口；端口被其他应用占用时会报错。

也可手动补齐模型并以前台方式启动服务：

```powershell
python setup_character.py
python -m http.server 4177 --bind 127.0.0.1 --directory dist
```

macOS / Linux 的 Python 命令若为 `python3`，将上面的 `python` 替换为 `python3`。需要支持 WebGL 2 的现代浏览器和开启的硬件加速；ES Module 必须通过 HTTP 访问，不能直接双击 `dist/index.html`。

已安装 Node.js 和 Python 时也可运行 `npm start`；JavaScript 语法检查使用 `npm run check`。Three.js 已随源码打包，不需要 `npm install` 或 CDN。此目录是源码归档，GitHub Pages 静态目录不会自动执行 Python 角色下载脚本。

## 操作

- WASD：移动；鼠标：转向
- 左键：开火；右键按住：瞄准
- Shift：冲刺；空格：跳跃
- E：搜刮补给箱；空降时开伞/切伞（低空自动开伞）
- R：换弹；1/2/3 或滚轮：换枪
- Q：医疗包；M：战术地图
- Esc：暂停并释放鼠标
- 触屏：左侧摇杆移动，右侧滑动转向，按钮开火/瞄准/跳跃/搜刮/治疗

手枪、突击步枪、精确步枪的伤害、射速、扩散、后坐力、瞄准与装填各不相同。空降后搜刮装备，观察小地图虚线标记的下一处安全区。淘汰所有 AI 即获胜；受击、坠落和风暴可导致失败。AI 之间也会交战。

## 文件

- dist/index.html：游戏界面
- dist/style.css：响应式 HUD、菜单、结算和触屏控件
- dist/game.js：主循环、物理碰撞、武器、风暴、声音、交互
- dist/world.js：原创低多边形海岛、建筑、楼梯、掩体
- dist/ai.js：AI 感知、寻路、战术和射击节奏
- dist/actors.js：原创细节武器、瞄具与第一人称手臂
- dist/vanguard.js：Vanguard 骨架克隆、动画混合、握枪 IK 与战斗动作
- dist/assets：原创建材贴图（混凝土、砖、沥青、涂装金属）
- dist/vendor：本地 Three.js 与其 MIT 许可证
- setup_character.py：从官方来源获取并校验角色模型
- start_local.py / start-game.cmd：Python 本地启动器与 Windows 双击入口
- [VALIDATION.md](./VALIDATION.md)：本次本地浏览器启动验证记录

## 实现与边界

世界含 12 个可进入建筑、5 条屋顶楼梯路线、51 个初始补给点。AI 使用视线检测及网格 A* 寻路，射击必须有实际视线。所有淘汰来自生命值受损，没有计时自动淘汰。对局约 5 分钟；对手是 AI，不是在线玩家。

场景、武器与第一人称手臂为原创建模；环境使用生成材质贴图与本地合成音频。AI 身体采用 Three.js 官方示例提供的 Mixamo Vanguard / Soldier，保留原始网格、纹理与 49 骨骼。Idle、Walk、Run 是原始动画；持枪、台阶脚部落点、射击后坐、受击和倒地为程序叠加动作，并非来源自带动作或物理布娃娃。模型及动画按其素材许可使用，不按 Three.js 的 MIT 许可重新授权。详见 THIRD_PARTY_ASSETS.md。Three.js 代码按 MIT 许可证分发。游戏设置和个人最佳记录仅保存在浏览器 localStorage。

## 源码包原有验证记录

v1.2 角色替换经过 18 项本地集成检查：11 套独立骨架、真实蒙皮躯干/头盔命中、墙体遮挡、AI 枪弹、双手握枪与枪口方向、地面/屋顶高度、实际楼梯迈步时的脚部穿透修正、倒地、重开释放资源，以及独立风暴伤害和结算。运行真实 Three.js 几何和游戏函数，DOM 与 WebGL 渲染器由测试替身提供；此结果不表示真实浏览器试玩完成。

已通过 JavaScript 语法和本地逻辑集成测试：空降着陆、移动、搜刮、开火换弹、治疗、暂停继续、胜利、失败和重新开始。AI 模块另测反应延迟、换弹节奏、遮挡检测与绕墙寻路。并使用真实角色网格验证命中、墙体遮挡，以及所有武器瞄具的无遮挡视线。场景、室内和角色/武器的实际几何及材质还经过 Blender 离线渲染检查。离线渲染不等同于浏览器实拍：不包含 DOM HUD，光照与 WebGL 可能不同。受支持云浏览器拒绝 localhost，私有发布页需登录，公开 3D 查看器也报告无法创建 WebGL 上下文，因此未完成真实浏览器交互试玩；画面与设备性能仍可能有差异。

以上为源码包附带的历史记录，本次未重跑这些逻辑测试。2026-10-03 已补齐角色并完成真实本地浏览器的菜单、空降、自动落地、AI 交战与暂停检查，浏览器未记录运行错误，详见 [本次验证记录](./VALIDATION.md)。
