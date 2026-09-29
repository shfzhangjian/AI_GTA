# ASSET_LICENSES — 资产许可证登记表

> 规则：任何进入 `public/assets/` 的文件必须先在此登记。
> 优先级：CC0 → 免费可商用 → 明确允许商用 → 付费可商用。
> 授权不明确 / 禁止 AI 项目使用 / 《潜水员戴夫》原始素材 → 一律不用。
> 《潜水员戴夫》原始素材：**未使用、禁止使用**。

## 已登记资产

### 1. Kenney Fish Pack v2.0 — CC0 1.0

| 资源名称 | 作者 | 来源 URL | 许可证 | 可商用 | 需署名 | 允许修改 | 限制 AI 使用 | 本地文件路径 |
|---|---|---|---|---|---|---|---|---|
| Fish Pack 2.0（基础鱼×9、骨架鱼、描边鱼、海草×9、岩石、沙地瓦片、气泡、HUD 数字符号） | Kenney Vleugels | https://opengameart.org/content/fish-pack-0 （镜像页 https://kenney.nl/assets/fish-pack）下载 https://opengameart.org/sites/default/files/kenney_fish-pack_2.0.zip | CC0 1.0 | 是 | 否（致谢可选） | 是 | 无限制声明 | public/assets/fish/*, environment/seaweed/*, environment/rocks/rock_*, terrain_*, effects/bubble_*, ui/hud_* |

注：官方 License.txt 亦随包（CC0，"may use in commercial projects, credit nice but not mandatory"）。50 种鱼将复用这些基础体 + 代码调色（tint），属允许修改。

### 2. Underwater Diving Pack — CC0（美术）+ CC-BY 3.0（包内音乐）

| 资源名称 | 作者 | 来源 URL | 许可证 | 可商用 | 需署名 | 允许修改 | 限制 AI 使用 | 本地文件路径 |
|---|---|---|---|---|---|---|---|---|
| Diving Pack 美术（潜水员 5 组动画、大鱼/深海鱼/镖鱼、水雷、气泡 FX、死亡 FX、背景/中景/珊瑚道具/瓦片） | Luis Zuno @ansimuz | https://opengameart.org/content/underwater-diving-pack 下载 underwater-diving-files.zip | CC0（包内 public-license.txt 原文：Public domain, personal or commercial, credit not required but appreciated） | 是 | 否（致谢可选） | 是 | 无限制声明 | public/assets/player/diver_*.png, fish/{deep,boss,aggressive}/*, effects/bubbles_spritesheet.png, effects/enemy_death.png, environment/{cave,coral,rocks/underwater_tiles}* |
| BGM「Watery Cave」(loop) | Pascal Belisle（包内署名素材） | 同上包内 Sound/watery_cave_loop.ogg；作者 soundcloud.com/pascalbelisle | CC-BY 3.0（依据 OGA 页面声明"music free to use as long as you give appropriate credit"） | 是 | **是** | 是 | 无限制声明 | public/assets/audio/music/watery_cave_loop.ogg |

**署名文本（将展示于游戏 Credits / README）**：Music: "Watery Cave" by Pascal Belisle (CC-BY 3.0). Artwork in diving pack by Luis Zuno (@ansimuz, CC0).

### 3. Kenney UI Pack — CC0 1.0

| 资源名称 | 作者 | 来源 URL | 许可证 | 可商用 | 需署名 | 允许修改 | 限制 AI 使用 | 本地文件路径 |
|---|---|---|---|---|---|---|---|---|
| UI Pack（面板框 button_rectangle_depth_*） | Kenney | https://kenney.nl/assets/ui-pack 下载 kenney_ui-pack.zip | CC0 1.0 | 是 | 否 | 是 | 无 | public/assets/ui/panels/* |

### 4. Kenney Interface Sounds — CC0 1.0

| 资源名称 | 作者 | 来源 URL | 许可证 | 可商用 | 需署名 | 允许修改 | 限制 AI 使用 | 本地文件路径 |
|---|---|---|---|---|---|---|---|---|
| Interface Sounds（click/select/toggle/scroll 共 6 个 UI 音） | Kenney | https://kenney.nl/assets/interface-sounds 下载 kenney_interface-sounds.zip | CC0 1.0 | 是 | 否 | 是 | 无 | public/assets/audio/sfx/{click,select,toggle,scroll}_*.ogg |

### 5. Kenney Pixel / Regular Pirate Pack（本地已有素材，CC0 1.0）

| 资源名称 | 作者 | 来源 URL | 许可证 | 可商用 | 需署名 | 允许修改 | 限制 AI 使用 | 本地文件路径 |
|---|---|---|---|---|---|---|---|---|
| Pirate Pack（母船 ship(1)、dinghy、船体 hullLarge/hullSmall、破帆 sailLarge(5)、木板 tile_01 → 沉船部件） | Kenney | https://kenney.nl/assets/pirate-pack （本地 /Users/mac/Downloads/kenney_pirate-pack，License.txt CC0 已核对） | CC0 1.0 | 是 | 否 | 是 | 无 | public/assets/boat/*, environment/wreck/* |

### 6. 本项目原创素材（本 Agent 程序绘制/合成，声明 CC0 1.0，无第三方版权）

| 资源名称 | 作者 | 来源 URL | 许可证 | 可商用 | 需署名 | 允许修改 | 限制 AI 使用 | 本地文件路径 |
|---|---|---|---|---|---|---|---|---|
| 行为 SFX（气泡3、鱼叉发射/命中、受伤、鲨鱼咬、宝箱、拾取、低氧报警、入水、UI点击、捕鱼成功）——程序合成 | 本项目开发 Agent | 本地生成（无外部来源） | CC0 1.0（本项声明） | 是 | 否 | 是 | 无 | public/assets/audio/sfx/*.wav |
| 宝箱三态贴图（closed/opening/open）——程序绘制 | 本项目开发 Agent | 本地生成 | CC0 1.0 | 是 | 否 | 是 | 无 | public/assets/environment/treasure/* |
| 鱼叉贴图——程序绘制 | 本项目开发 Agent | 本地生成 | CC0 1.0 | 是 | 否 | 是 | 无 | public/assets/weapons/harpoon.png |
| 生物占位美术（鲨/鮟鱇/鱿鱼/剑鱼，占位性质，正式美术到位后替换）——程序绘制 | 本项目开发 Agent | 本地生成 | CC0 1.0 | 是 | 否 | 是 | 无 | public/assets/creatures/*/_placeholder.png |

### 7. CC-BY 4.0 备用素材（已登记，尚未确定采用）

| 资源名称 | 作者 | 来源 URL | 许可证 | 可商用 | 需署名 | 允许修改 | 限制 AI 使用 | 本地文件路径 |
|---|---|---|---|---|---|---|---|---|
| Scuba Diver 大图(3840×2160) | Mateus Ferreira (mergulhador) | https://opengameart.org/content/scuba-diver 下载 sprites_mergulhador.png | CC-BY 4.0 | 是 | **是** | 是 | 无限制声明 | public/assets/player/scuba_diver_sheet_ccby.png |

若最终采用需署名："Diver sprite by Mateus Ferreira (CC-BY 4.0, opengameart.org)"。**当前主角色使用 CC0 diver_swimming 等，此图为备用。**

## 候选资源池（缺失资产推荐，采用前逐个核查）

| 缺失资产 | 候选 | 来源 | 初步许可 | 备注 |
|---|---|---|---|---|
| 鲨鱼正式美术 | Open Ocean Game Art (2D Fish Animations) | opengameart.org/content/open-ocean-game-art-mostly-2d-fish-animations | 需页面确认（多为 CC-BY 4.0） | 含鲨/鲸/大鱼动画 |
| 沉船整船 | Shipwreck / wrecked sunken ship bg | opengameart.org/content/shipwreck-0 | 需逐查 | 当前用 Kenney CC0 hull 部件拼沉船（已可用） |
| 深海/危险/Boss BGM | 关键词 CC0 检索 music (ocean, dark, boss) | opengameart.org / kenney（Kenney 无音乐包发布到 OGA） | 目标 CC0 | 现有 watery_cave(CC-BY 3.0) 可做浅海主题 |
| 水下 ambience 底噪 | CC0 sea ambience 检索 | opengameart.org | 目标 CC0；Pixabay CDN 403 不可达，Freesound 需逐个登录+查许可 | 暂缺，可先用 watery_cave loop 低通滤波 |

## 明确排除项（原因）

| 候选 | 排除原因 |
|---|---|
| OGA "Items, door, fire, weapon hits"(jute) | 页面有版权来源质疑记录（Sound Ideas 素材疑议）→ 授权不明确，弃用 |
| "Sea [ambient futuristic]"（CC-BY-SA 3.0） | SA 传染条款给音频资产带来不必要的传染性，弃用（除非唯一可用） |
| Pixabay 音频 | CDN 直连 403，无法验证许可页与下载，弃用 |
| 《潜水员戴夫》全部原始素材 | 版权作品，禁止 |

## 署名汇总（游戏内 Credits 使用）

- Music: "Watery Cave" © Pascal Belisle, CC-BY 3.0
- Diver sprite (备用): © Mateus Ferreira, CC-BY 4.0
- 其余全部 CC0（Kenney / ansimuz / 本项目原创）
