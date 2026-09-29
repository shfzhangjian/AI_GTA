# ASSET_MAPPING — 资产映射表（阶段 1 生成，scripts/check-assets.mjs 可校验引用）

> 图片尺寸/透明通道由脚本读取 PNG IHDR 得到。Sprite Sheet 帧 = 宽/帧宽（横向切片）。
> 许可证全文与出处见 docs/ASSET_LICENSES.md。

## 玩家（player/）

| 资产名称 | 文件位置 | 格式 | 尺寸 | Sprite Sheet 帧 | 透明通道 | 许可证 | 用途 |
|---|---|---|---|---|---|---|---|
| 潜水员游泳 | /assets/player/diver_swimming.png | PNG | 560×80 | 7帧(80px) | Y | CC0 | 主角色游泳动画（首选） |
| 潜水员待机 | /assets/player/diver_idle.png | PNG | 480×80 | 6帧 | Y | CC0 | 待机 |
| 潜水员受伤 | /assets/player/diver_hurt.png | PNG | 400×80 | 5帧 | Y | CC0 | 受伤闪烁 |
| 潜水员快速 | /assets/player/diver_fast.png | PNG | 400×80 | 5帧 | Y | CC0 | 快速游动 |
| 潜水员冲刺 | /assets/player/diver_rush.png | PNG | 560×80 | 7帧 | Y | CC0 | 冲刺/闪避 |
| 水肺潜水员大图 | /assets/player/scuba_diver_sheet_ccby.png | PNG | 3840×2160 | 需手动切帧 | Y | CC-BY 4.0 | 备用高质量角色 |

## 鱼（fish/，Kenney Fish Pack 基础体 + 数据驱动调色复用）

| 资产名称 | 文件位置 | 格式 | 尺寸 | 帧 | 透明 | 许可证 | 用途 |
|---|---|---|---|---|---|---|---|
| 基础鱼×9 形态 | /assets/fish/common/fish_*.png | PNG | ~32×16 | 单帧 | Y | CC0 | 50 种鱼的基础体（代码 tint 变色） |
| 骨架鱼×2 | /assets/fish/uncommon/fish_skeleton.png, fish_skeleton_orange.png | PNG | 32×16 | 单帧 | Y | CC0 | 稀有/幽灵鱼 |
| 描边鱼×2 | /assets/fish/rare/fish_orange_outline.png, fish_green_outline.png | PNG | 32×16 | 单帧 | Y | CC0 | 稀有鱼变体 |
| 大鱼(深海包) | /assets/fish/boss/depth_big_fish.png | PNG | 216×49 | 单帧(2×3格) | Y | CC0 | Boss/大型鱼 |
| 深海鱼 | /assets/fish/deep/depth_fish.png | PNG | 128×32 | 单帧(2×2格) | Y | CC0 | 深海鱼 |
| 镖鱼 | /assets/fish/aggressive/depth_dart.png | PNG | 156×20 | 单帧(3格) | Y | CC0 | 剑鱼/快攻鱼 |

## 危险生物（creatures/）

| 资产名称 | 文件位置 | 说明 | 许可证 | 用途 |
|---|---|---|---|---|
| 鲨鱼(占位原创) | /assets/creatures/shark/shark_placeholder.png | 程序绘制 | CC0(原创) | 占位，待正式美术 |
| 鮟鱇(占位原创) | /assets/creatures/anglerfish/anglerfish_placeholder.png | 程序绘制(发光诱饵) | CC0(原创) | 占位 |
| 大鱿鱼(占位原创) | /assets/creatures/squid/squid_placeholder.png | 程序绘制 | CC0(原创) | 占位 |
| 剑鱼(占位原创) | /assets/creatures/swordfish/swordfish_placeholder.png | 程序绘制 | CC0(原创) | 占位 |

## 环境（environment/）

| 资产名称 | 文件位置 | 格式 | 尺寸 | 透明 | 许可证 | 用途 |
|---|---|---|---|---|---|---|
| 海草×9 | /assets/environment/seaweed/seaweed_*.png, background_seaweed_*.png | PNG | ~16×48/16×64 | Y | CC0 | 海草摆动（代码 shear 动画） |
| 岩石×4 | /assets/environment/rocks/rock_*.png | PNG | 16×16级 | Y | CC0 | 岩石 |
| 沙地/泥土瓦×8 | /assets/environment/rocks/terrain_*.png | PNG | 18×18 | Y | CC0 | 海床地形 tile |
| 水下瓦片集 | /assets/environment/rocks/underwater_tiles.png | PNG | 480×656 | Y | CC0 | 洞穴/岩壁 tileset |
| 珊瑚道具集 | /assets/environment/coral/props_coral.png | PNG | 1024×496 | Y(多格) | CC0 | 珊瑚/洞穴道具 |
| 视差背景 | /assets/environment/cave/parallax_background.png | PNG | 288×256 | N | CC0 | 洞穴/远景 |
| 视差中景 | /assets/environment/cave/parallax_midground.png | PNG | 960×512 | Y | CC0 | 洞穴中景 |

## 特效 / UI / 船

| 资产名称 | 文件位置 | 格式 | 尺寸 | 许可证 | 用途 |
|---|---|---|---|---|---|
| 气泡×3 | /assets/effects/bubble_*.png | PNG | 小 | CC0 | 上升气泡 |
| 气泡动画 | /assets/effects/bubbles_spritesheet.png | PNG | 168×? | CC0 | 气泡串 |
| 敌人死亡 | /assets/effects/enemy_death.png | PNG | 312×53 | CC0 | 死亡爆开 |
| HUD 数字/符号×15 | /assets/ui/hud_*.png | PNG | 5×9 | CC0 | 数值显示 |
| UI 面板框×2 | /assets/ui/panels/button_rectangle_depth_*.png | PNG | 192×64 | CC0 | 背包/结算面板 |
| 母船 | /assets/boat/boat_base.png | PNG | 304×208 | CC0 | 母船(本地已有海盗包) |
| 小船 | /assets/boat/boat_small.png | PNG | ~200× | CC0 | 装饰 |

## 音频（audio/）

| 资产名称 | 文件位置 | 格式 | 许可证 | 用途 |
|---|---|---|---|---|
| 气泡×3、鱼叉发射/命中、受伤、鲨鱼咬、宝箱、拾取、低氧报警、入水、UI点击、捕鱼成功 | /assets/audio/sfx/*.wav | WAV 44.1kHz 单声道 | **CC0（本项目原创合成，作者=开发 Agent）** | 全部行为 SFX |
| UI 点击变体×6 | /assets/audio/sfx/{click,select,toggle,scroll}_*.ogg | OGG | CC0 Kenney Interface Sounds | UI SFX |
| watery_cave_loop | /assets/audio/music/watery_cave_loop.ogg | OGG loop | CC-BY 3.0 Pascal Belisle | 浅海/洞穴 BGM |

## 缺失资产清单（详见 ASSET_LICENSES.md 推荐资源）

1. **鲨鱼** sprite（首要）— 推荐：OGA「Open Ocean Game Art」(CC-BY 4.0) 或 Kenney 素材拼合
2. **鮟鱇鱼、大型鱿鱼、剑鱼正式美术** — 推荐：Open Ocean Game Art
3. **沉船（沉没 hull/cabin/cargo）** — 推荐：OGA「Shipwreck」(CC-BY)；或用本地 pirate ship sprite 做沉没状态（旋转+破洞遮罩）
4. **宝箱 CLOSED/OPENED** — 推荐：Kenney 未含；候选 OGA CC0 chest、或程序绘制
5. **鱼叉武器 sprite** — 可用 Kenney fish pack 尖形鱼/程序绘制长矛（缺失）
6. **BGM 深海/危险/Boss** — 候选 CC0 Kevin MacLeod「Microscopic Sunset」等（需确认 OGA CC0 条目）
7. **水下环境底噪（ambience loop）** — 候选 OGA CC0 海洋录音（未找到满意 CC0 项，暂缺）
