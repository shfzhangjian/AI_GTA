# 雨山湖夜游

基于安徽马鞍山雨山湖与金鹰双塔照片制作的交互像素场景。默认夜景，保留红色楼体灯光。全部场景、人物、船只、雨水、烟花、倒影与界面图标均为代码绘制的 SVG，无位图场景素材、无外部字体或运行依赖。

## 打开

直接用浏览器打开 `index.html`，或在此目录运行 `npm start`，访问 http://127.0.0.1:4178 。`npm run check` 检查脚本语法。

## 游玩

- WASD / 方向键移动，点击湖岸步道自动前往；手机支持方向按钮。
- 在三处金色观景标记附近按 E，或点击“留住此刻”。印记保存在当前浏览器。
- 点击夜空手动释放烟花。底栏可开关人流、烟花、红色灯光秀、雨天和程序合成音效。
- 右上切换昼夜，底栏进入全屏。关闭灯光秀保留静态红色立面。
- 雨天行人和玩家撑伞，湖面产生雨滴涟漪；白天有飞机飞过。

## 参考与艺术处理

- [金鹰官方建筑介绍：双塔与商业裙楼](https://www.netge.com/web/ResidenceDetail/14)
- [雨山湖、金鹰亮化照片与项目介绍](https://www.sohu.com/a/379602252_741350)
- [雨山湖岸边实拍](https://bbs.zol.com.cn/dcbbs/d167_415802.html)
- [雨山湖游船照片](https://touch.travel.qunar.com/comment/5683298)

按用户确认采用夜间红色金鹰灯光与湖面倒影作为主参考。景观为艺术化组合：双塔高低轮廓、商业裙楼、沿湖绿带与栈道保留识别特征，非测绘复刻。原需求中的外滩与黄浦江按雨山湖主题调整，船只采用游船及脚踏船。烟花为游戏创作效果。

## 文件

- `index.html`：页面结构、控制栏和无障碍标签。
- `style.css`：响应式布局、界面与昼夜状态样式。
- `game.js`：SVG 生成、动画、行走、天气、音效、印记收集。
- `server.cjs`：仅绑定本机的零依赖静态服务。

照片只作为造型参考，运行时不加载照片。场景不使用 Canvas 或图片嵌入；PNG 截图导出时才将 SVG 光栅化。

## 无人机与录制更新

- 标题“今夜，走慢一点。”已转换为 SVG 字形路径，逐字亮起、轻微浮动并带移动光点。截图不依赖网页外层标题。
- 807 个 SVG 灯点按照 48 秒循环表演：升空 → “我爱马鞍山雨山湖” → 爱心 → 双塔与湖面轮廓 → 文字。支持开关；白天隐藏。
- 无人机倒影随编队变化，人物、游船、雨水、烟花和楼面灯光继续动态更新。
- 顶部“截图”导出 1920×1080 PNG；“取景”隐藏控制界面，Esc 退出。
- `?capture=1` 启用固定时间轴，`yushanCapture.renderAt(seconds)` 按顺序推进场景，可稳定逐帧截图；`yushanCapture.serializeSVG()` 导出包含当前动画状态的独立 SVG。`yushanCapture.saveSVG()` 下载矢量截图。
- 截图时仅将完整 SVG 光栅化为 PNG，Canvas 不参与场景绘制。

## 成片与博文

打开 `film.html` 可观看并下载成片。`exports/雨山湖夜游-无人机告白.mp4` 为 48 秒、1080p、24 fps、H.264 / AAC，配乐由本项目程序合成。`exports/博文-把雨山湖的夜色做成像素游戏.txt` 是可发布博文。

## 重新导出与验证

普通游玩不需要安装依赖，直接打开 `index.html` 或运行 `npm start` 即可。

需要自动化验证或重新导出视频时：

```sh
npm install
npx playwright install chromium
python -m pip install -r requirements-export.txt
# 另一个终端先运行 npm start
npm test
python make-soundtrack.py
npm run export:video
```

视频导出还需要安装 FFmpeg 并将 `ffmpeg` 加入 PATH，或用 `FFMPEG_PATH` 指定可执行文件。测试和导出默认使用 Playwright Chromium；可以通过 `BROWSER_CHANNEL=msedge` 使用已安装的 Edge。可选的 `PLAYWRIGHT_PATH` 可指向已有 Playwright 安装。

`PORT` 可设置本地服务端口；测试与导出对应使用带尾部斜线的 `YUSHAN_URL`，例如 `http://127.0.0.1:4179/`。

`lettering.js` 已包含标题轮廓和无人机文字坐标，运行游戏不依赖系统字体文件。若需重新生成，可运行 `python build-lettering.py`；该脚本默认使用 Windows 微软雅黑与黑体。其他系统需设置 `YUSHAN_TITLE_FONT` 和 `YUSHAN_DOT_FONT` 为支持中文的本地 TTF/TTC 字体路径。更换字体会改变字形和灯点数量。

## 在线访问

- [在线漫步](https://shfzhangjian.github.io/AI_GTA/yushan-lake-pixel/)
- [观看成片与下载素材](https://shfzhangjian.github.io/AI_GTA/yushan-lake-pixel/film.html)

![无人机文字编队与金鹰夜景](./exports/文字编队.png)
