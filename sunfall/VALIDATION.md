# SUNFALL 本地启动验证

日期：2026-10-03。环境：Windows、Python 3、Node.js、Codex 内置浏览器。

## 本次实际检查

- `npm run check`：`game.js`、`world.js`、`ai.js`、`actors.js`、`vanguard.js` 的 Node.js 语法检查通过。
- 角色模型：从 Three.js 官方来源获取，SHA-256 与源码包的 `dfb230fc1f942f259dd00281a1186953ad602fc5d69067ce63e24b2aa439736b` 一致，包含 Idle / Walk / Run 动画及 Vanguard 骨架。
- 本地资源：主页面、JavaScript 模块、四张材质贴图及角色 GLB 的 HTTP 响应均为 200。
- 真实浏览器：3D 主菜单显示，点击「空降战区」进入对局，初始 HUD 显示存活 12、生命 100、护甲 50、手枪弹药 15 / 75。
- 自动落地与 AI 交战：玩家落地高度为 0；暂停时 HUD 和游戏状态显示存活 9，战报出现 AI 淘汰记录。
- 暂停：既有暂停界面显示，游戏状态为 `paused`；浏览器错误日志为空。
- 启动器：`python start_local.py --no-browser` 已检查服务复用与后台服务重启，服务就绪后成功返回；刷新后主菜单正常显示。

游戏逻辑沿用原源码包，仓库新增启动器、文档和截图。此记录没有覆盖完整五分钟对局、玩家移动 / 搜刮 / 开火、胜负结算、手机触屏或性能基准；源码包原有测试记录保留在 README 并单独标明。

## 素材获取与静态托管

原始角色 GLB 通过 `.gitignore` 保留为本地素材；首次启动使用 `setup_character.py` 从官方来源补齐。GitHub Pages 只托管静态文件，不会运行该 Python 脚本；本次验证针对补齐素材后的本地游戏。

![真实本地浏览器中的游戏主菜单](./preview.png)
