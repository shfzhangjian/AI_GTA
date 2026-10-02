# 摧毁任意网页 · Pixel Lab

基于 https://destroy.spritefusion.com/ 公开交互设计独立实现的可玩复刻版本。当前界面为简体中文；中文化范围与验证记录见 `docs/LOCALIZATION.zh-CN.md`。

Independent playable recreation with a Simplified Chinese interface.

## 本地运行

需要 **Node.js 22.13 或更高版本**。在本目录执行以下命令，安装锁定依赖、编译并初始化本地数据库：

```bash
npm ci
npm run build
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_handy_deathbird.sql
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0001_colossal_marvel_apes.sql
npm start -- --port 8787
```

打开 <http://127.0.0.1:8787/>，点击「演示网页」即可进入游戏。

两条数据库初始化命令只需在新的本地数据库执行一次。完成首次安装后，后续直接运行 `npm start -- --port 8787`；Windows 也可双击 `启动游戏.cmd`。本地数据库、截图缓存、运行日志和工具配置保存在项目内，不提交到仓库。

开发调试使用 `npm run dev`，默认端口为 5173；数据库结构变化时运行 `npm run db:generate`，再应用新增迁移。类型检查使用 `npx tsc --noEmit`。

项目使用 Vinext / React / Canvas 2D，API 运行在 Cloudflare Workers 环境。本地由 Wrangler 模拟 D1 数据库（`DB`，房间状态）和 R2 存储（`BUCKET`，网页截图）；绑定配置位于 `.openai/hosting.json`。完整应用需要本地服务或 Cloudflare Workers 部署，GitHub Pages 的静态托管不能运行这些 API。

![Windows 本地运行：内置演示网页](./preview.jpg)

## Controls

- A/D or Left/Right: run
- Space/W/Up: jump; tap in the air to flip; hold to fly
- S/Down: drop through platforms
- Mouse: aim; left-click/hold: fire
- Right-click: grenade
- 1–0 or wheel: choose weapon
- Escape: pause; Tab: multiplayer scores
- Touch: onscreen movement, fly, fire and grenade buttons; drag on the canvas to aim

Weapons: Pistol, SMG, Shotgun, Rocket, Railgun, Flamethrower, Too Much, Drone, PSR B0531+21, The Magic Wand. Drone: fire again to order hovering drones to dive.

## Screenshot capture

Only public HTTP(S) URLs without credentials, custom ports, IP addresses or query strings are accepted. On an explicit submit, the URL is sent to thum.io's documented screenshot API. The free service captures a 1200×1200 viewport; availability, quota and target-site login/bot walls apply. No private/authenticated content is supported. Screenshots cache in R2 for one day. Remote levels use screenshot fragments, not a scraped copy of source code.

## Multiplayer

Remote room play uses a D1-backed polling protocol, up to four players. Each session has a private token that is not broadcast. The host chooses the map, room events synchronize destructive blasts, server-side health/kill handling ends a match at 10 kills, and the host can rematch. Rooms expire after two hours; event history is bounded. The Site's owner-only access applies before room admission. Sharing a room code does not grant access to a private Site.

## Attribution and differences

The original site's source, sprites, weapon artwork, sounds and branding are not bundled. Character, weapon, particle and audio code are independently authored. Licensed backgrounds and font notices are in `public/ATTRIBUTION.txt` and `public/assets/`.

This is not a claim of exact parity. See `docs/PARITY.md` for concrete differences and `docs/VERIFICATION.md` for passed and still-blocked tests.
