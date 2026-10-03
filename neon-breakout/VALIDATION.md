# 霓城突围验证记录

验证环境：Windows、Node.js、真实 Chromium；桌面 1440×900、手机 390×844。人物为第二版曲面模型。

## 规则与通关

`npm run check` 检查游戏模拟、人物、渲染与页面模块的 JavaScript 语法。

`npm test` 的 31 项测试覆盖：三位英雄各自通过六章的完整跑道与首领战；可复现关卡生成；移动与暂停；增益门；真实弹道、穿透与计分；跳跃、受击无敌、英雄技能与护盾；首领攻击、弹药耗尽补给；结算、重开和无尽模式。

## 浏览器与模型

- [浏览器检查数据](./qa/browser-check.json)：键盘和触屏移动、暂停冻结与恢复、跳跃和爆发、首领战渲染、胜利结算、章节解锁、刷新后存档。桌面与手机均未发现布局溢出或浏览器运行错误。
- [模型检查数据](./qa/model-check.json)：三位英雄、普通怪物、首领与远处怪物的网格数值有效；模型实例关节独立；远景怪物三角面数由 64,972 降至 15,552。
- [实机画面](./preview.png) 与 [角色展示截图](./characters-preview.png) 随目录提供。
- 已在本地静态服务的 `/neon-breakout/` 子目录运行完整桌面与手机浏览器检查，并验证角色展示页、ES Module 与本地 Three.js 的相对路径加载。

## 复现

在此目录运行 `npm start` 后，另一终端执行 `npm run check`、`npm test`、`npm run build`。浏览器检查额外需要 puppeteer-core 和 Chrome，设置方法见 [README](./README.md#构建与验证)。

```powershell
node scripts/browser-check.mjs
node scripts/capture-models.mjs
```

游戏文件采用相对路径，源目录可直接发布在 GitHub Pages 的 `/AI_GTA/neon-breakout/`，无需 Node.js 后端；本地 Node.js 仅提供静态 HTTP 文件服务。
