# scenario-iso-cycles · 美术与动画交接

本项目读取并应用了 scenario-iso-cycles 的角色一致性、八方向、固定网格、脚底锚点、每方向帧率与方向质量检查规范。当前未连接 Scenario MCP，也未安装相关 scenario 通用技能，因此没有执行模型推荐、价格询问或付费生成。没有伪造模型、费用、资产或任务 ID。

## 当前可玩的原创素材

素材由 tools/make_sprites.py 使用 Pillow 绘制，为程序像素素材。它不是 Scenario 模型生成的结果。生成 10 个角色 × idle / walk / run / attack 四种动作，共 40 张透明 PNG，每张 8 行 × 8 帧。

| 参数 | 原型约定 |
| --- | --- |
| 单格尺寸 | 80 × 88 px |
| 表单尺寸 | 640 × 704 px |
| 脚底锚点 | [40, 76]，从左上角测量 |
| 行顺序 | se, sw, ne, nw, e, w, s, n |
| 帧数 | 每行 8 帧 |
| idle / walk / run / attack | 5 / 8 / 12 / 14 fps |
| attack | 单次播放，其他动作循环 |
| 调色 | 深绿轮廓，低饱和土色与每位角色的主色 |
| 武器 | 独立图层，允许换装备且避免镜像换手 |

元数据位于 assets/meta.json。当前所有方向使用相同程序运动节拍，因此每方向的帧率值相同；正式生成后须保留处理工具给出的每方向帧率，不应强制套用当前值。现有素材的步幅、帽饰和轮廓是原型水平，正式发行仍需美术审修。

## 正式 Scenario 配置

docs/cast.json 已包含 10 位角色的外观、背面、空手攻击、idle、S / N 方向攻击与一致性约束。角色身体与武器分离，因此所有角色都可使用全部武器。生成方向为 se / ne / e / s / n，sw / nw / w 可水平镜像；若正式服装加入左右不对称标志，则应改为单独生成这些方向。

docs/scenario-prompts.json 是技能自带 make_prompts.py 根据 cast.json 生成的离线请求模板。模型 ID、首帧资产 ID 都是明确占位符，不能直接作为真实任务提交。

1. 连接 Scenario MCP，载入 scenario 通用技能。调用 memory_recall、teams_list / projects_list 并确认正式项目范围。
2. 用 recommend 和按 createdAt 倒序的 search 选择图像、图生视频模型，读取各候选 model_schema_get。视频需支持首帧、尾帧、正方形输出、3 / 5 秒和关闭音频。
3. 对各类请求执行 dry_run 报价，汇总并预留约 25% 重画额度。按技能规定，付费执行前告知总价并取得同意。
4. 首先只生产苔痕的 SE / NE 原画，再上传首帧并逐个补 E / S / N。S / N 用垂直中心线检查，不通过则只重绘该方向。
5. 只提交第一位角色的动画，下载、抠底、搜索循环、统一尺度并输出 8 方向预览。所有角度与步速通过后再扩展另外 9 位。
6. 图生视频需要 10 × 5 × 4 = 200 段基础动画。根据实际模型 schema 调整字段后才提交；初始模板没有足够首帧资产，不能直接生成完整批次。
7. 用 process.py 的 --report 检查循环接缝，再正式输出。检查 S / N 朝向、左右侧面漂转、背面倒走、武器裁切、色边、角色大小与播放速度。
8. 最终交付每角色每动作 PNG、meta.json、八方向 GIF 和模型 / 任务 / 费用日志。替换游戏素材时可保持当前网格，或修改 renderer.js 的读取尺寸和锚点。

## 运行离线模板命令

```powershell
python -X utf8 <scenario-iso-cycles技能目录>/scripts/make_prompts.py docs/cast.json -o docs/scenario-prompts.json
```

将 `<scenario-iso-cycles技能目录>` 替换为本机安装的技能路径。读取外观配置与生成请求不会调用 Scenario 或花费积分。正式模型选定后，使用 --still-model / --clip-model 填入真实 ID，并根据实时工具 schema 修正请求。

## 引擎移植

Godot 的 SpriteFrames 每行建立一个方向动画，纹理过滤设置为 nearest，attack 关闭循环，脚底节点使用 [40,76] 锚点。Unity 按 80×88 固定网格切图、Point 过滤，归一化 pivot 为 [0.5, 1 - 76/88]。Canvas 原型按 x+y 深度排序并将角色脚底投射到地面。

## 本次日志

- 日期：2026-10-03（Asia/Shanghai）。
- Scenario 连接 / 模型 / 任务 / 资产：未连接 / 未选定 / 无 / 无。
- Scenario 支出：0，本次没有付费生成调用。
- 角色素材：原创程序绘制，10 角色、40 表单、2,560 个格子。
- 结构检查：80×88 格、8×8 表单、透明背景、8 方向、统一 pivot、四动作。
- 已修正：idle 的一像素呼吸变化，独立武器图层避免换装冲突，拱门横梁与石柱顶盖使用正确的高度基座。
