# 遗物猎场 · RELIC FIELD

原创等距动作 + 收集 + 肉鸽浏览器原型。废墟寻宝主题，完整 9 房间远征、3 位 Boss、10 名角色、24 把武器、40 件遗物、8 种补给与永久收藏档案。

**在线试玩：[遗物猎场](https://shfzhangjian.github.io/AI_GTA/relic-hunters/)**

## 启动

双击「开始游戏.cmd」，或在本目录运行 `node server.cjs`，打开 http://127.0.0.1:8731。需要系统已有 Node.js，无需安装第三方 npm 包。也可用其他静态 HTTP 服务器提供本目录，ES 模块建议通过 HTTP 访问。

## 操作

WASD / 方向键移动，鼠标瞄准并按住左键攻击；空格闪避，E 技能，Q 补给，F 宝箱 / 前进，Esc 暂停。奖励选择可按 1–4。手机使用方向按钮与自动瞄准攻击按钮，底部可点按闪避和技能。

营地可以自由试用所有角色与武器。打倒守卫、捡取掉落、从宝箱换武器、从升级与房间奖励中选遗物。每个区域第三房间是 Boss，完成第九房间后归档。倒下或主动撤退保留 40% 碎片，图鉴发现永久保留。

## 设计与素材

- [游戏设计](docs/GAME_DESIGN.md)：核心循环、操作、组合、敌人、区域和扩展边界。
- [完整内容图鉴](docs/CONTENT_CATALOG.md)：与实际游戏数据同步的 82 个条目。
- [动画管线](docs/ANIMATION_PIPELINE.md)：scenario-iso-cycles 应用情况、素材规范与正式生产流程。
- [Scenario 角色配置](docs/cast.json) 和 [离线请求模板](docs/scenario-prompts.json)。

角色图为原创程序像素素材，40 张 PNG，全部 8 方向 × 8 帧，固定脚底锚点；武器为独立层。当前未连接 Scenario MCP，没有调用付费模型。正式 AI 动画的配置和请求模板已经准备，模板含待填写的模型 / 资产占位符。

## 验证与当前边界

`npm test` 运行战斗、组合、奖励与归档规则检查，`npm run check` 进行 JavaScript 语法检查。`npm run test:browser` 检查真实界面、完整路线与正常数值的首房间战斗；浏览器检查需另行安装 Playwright（`npm install --no-save --package-lock=false playwright` 与 `npx playwright install chromium`），游戏运行和规则测试不需要该依赖。已安装的 Chrome 也可通过 `CHROME_PATH` 指定。`GAME_URL` 可指向子目录预览网址，默认为本地 8731 端口。自动完整路线测试提高生命与护盾，用于流程验证，不证明正常难度平衡。

原型保存收藏与累计成绩，不保存中断的局内进度。关卡布局固定，敌人、宝箱与奖励随机。金币用于拾取反馈、角色天赋与成绩，碎片用于归档成绩，尚未提供商人或营地建设。所有数值为原型值；正式上线前需要更多真实试玩与美术修整。
