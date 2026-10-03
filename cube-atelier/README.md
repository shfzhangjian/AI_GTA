# Cube Atelier · 魔方实验室

使用 HTML、CSS、原生 JavaScript 和 Three.js 制作的三阶魔方练习台。Three.js、求解器、字体均已放在 `vendor` 中，运行时无需联网，也无需安装 npm 依赖。

[在线体验](https://shfzhangjian.github.io/AI_GTA/cube-atelier/) · [验证记录](./VALIDATION.md)

![魔方实验室：3D 魔方、同步展开图和还原助手](./preview.png)

## 启动

在本目录运行：

```powershell
npm start
```

打开 <http://127.0.0.1:5186>。也可以双击 `启动魔方实验室.cmd`。需要 Node.js。页面使用 ES 模块和 Worker，请通过本地 HTTP 服务访问。

## 已实现

- 26 个可转动块、54 个色块构成的 3D 魔方；拖动观察、滚轮缩放、点击面选择转动层、复位视角和显示面记号。
- U / R / F / D / L / B 六面顺时针、逆时针和 180° 操作，键盘支持、撤销与重做。
- 10 / 20 / 30 步随机打乱，以及打乱公式复制。
- 同步六面展开图，也可切换为大幅展开视图，点击面选择操作层。
- 根据当前状态计算的还原指导：当前步骤、转动方向图示、完整路线、单步执行、连续演示与暂停；人工跟随时自动识别正确步骤，转错后重新规划。
- 六个公式的说明和独立示例演示。进入演示保留练习快照，退出恢复魔方状态、操作记录、模式与计时。
- 练习计时、转动记录、同色归位比例；本地保存练习，刷新后继续。
- 适配桌面、平板、手机；快捷键说明、原生对话框和减少动画偏好。

## 键盘

| 操作 | 快捷键 |
| --- | --- |
| 顺时针 90° | U / R / F / D / L / B |
| 逆时针 90° | Shift + 对应字母 |
| 撤销 / 重做 | Ctrl 或 ⌘ + Z / Shift + Z |
| 指导或演示的下一步 | Space |
| 关闭弹窗 / 退出公式演示 | Esc |
| 打开说明 | ? |

公式中的方向始终以中心块为准，从该面外侧正对观察判断顺逆时针。拖动相机改变观察角度，但不改变公式记号。

## 实现与验证

`model.js` 使用整数位置与法向维护 54 个色块；3D 和展开图均读取该状态。`solver-worker.js` 在后台使用 cubejs 的两阶段求解器，并再次校验路线确实还原。指导提供按当前状态求得的转动路线；公式手册另外提供常用公式的用途与示例，不将求解路线冒充层先法教程。求解器不可用时，可以按合法转动记录生成回溯路线。

```powershell
npm test
npm run test:ui
```

模型测试不需要安装依赖，包含 1,518 次独立色块对照、逆操作、颜色数量、公式合并，以及 12 次随机状态求解验证。浏览器检查覆盖手动操作、视图同步、撤销重做、指导纠错、暂停播放、完整还原、演示恢复、本地保存和移动端。浏览器测试需先启动页面服务；首次运行可执行 `npm install --no-save playwright` 和 `npx playwright install chromium`。也可通过 `PLAYWRIGHT_PATH`、`CHROME_PATH` 使用已有的 Playwright 与浏览器。`CUBE_TEST_URL` 指定待测地址，默认 `http://127.0.0.1:5186/`；测试在忽略提交的 `qa/` 中保存报告和截图。

## 第三方来源

- [Three.js](https://threejs.org/) 0.185.1，MIT；授权见 `vendor/THREE-LICENSE.txt`。
- [cubejs](https://github.com/ldez/cubejs) 1.3.2，MIT；授权见 `vendor/CUBEJS-LICENSE.txt`。
- [Manrope / Fontsource](https://fontsource.org/fonts/manrope)，SIL Open Font License；授权见 `vendor/MANROPE-LICENSE.txt`。
