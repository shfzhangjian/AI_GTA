# AI_GTA

AI 生成的游戏向 Web 项目集合。每个项目独立目录存放。

| 目录 | 说明 | 技术栈 |
| --- | --- | --- |
| [`low-poly-city/`](./low-poly-city/) | 低多边形等距城市 + 第一人称武器沙盒（锤子/冲锋枪/狙击枪/火箭筒，NPC 生态与碰撞） | HTML + Three.js r165（原生 ES Module，零构建、离线可跑） |

## low-poly-city 快速开始

```bash
cd low-poly-city
npx serve .            # 或 python -m http.server 8000
```

浏览器打开终端提示的地址即可。详见 [low-poly-city/README.md](./low-poly-city/README.md)。
