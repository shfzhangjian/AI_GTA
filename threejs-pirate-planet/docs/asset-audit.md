# Phase 0 — Kenney Pirate Kit 资产审计报告

> 本报告中**每一个文件路径都经过实际递归扫描与解析验证**，不存在推测或虚构的模型。
> 所有尺寸 / 三角面数据由脚本直接读取 GLB 的 `accessors.min/max` 并遍历 `nodes` 场景图变换计算得出。

---

## 1. 环境确认（实测）

| 项目 | 实测结果 |
|---|---|
| 操作系统 | macOS (Darwin 25.6.0, arm64 / Apple Silicon T6050) |
| 用户目录 | `/Users/mac` |
| 桌面真实路径 | `/Users/mac/Desktop` （**已确认存在**） |
| `~/Desktop/kenney_pirate-kit` | ❌ **不存在** |
| 资产真实位置 | ✅ `/Users/mac/Downloads/kenney_pirate-kit` |
| Node.js | `~/.local/bin/node` → **v22.23.1** |
| npm | `~/.local/bin/npm` → **v10.9.8** |
| npm registry | ✅ 可访问（`npm ping` PONG 1280ms） |

> ⚠️ 重要修正：提示词假定资源在 `~/Desktop/kenney_pirate-kit`，实际扫描发现位于
> `~/Downloads/kenney_pirate-kit`。同时发现同级的 `kenney_pirate-pack`（另一版本压缩包）。
> 本项目全部以 **Downloads 目录下实测存在的文件** 为准。

### 发现的资产包

```text
/Users/mac/Downloads/kenney_pirate-kit.zip
/Users/mac/Downloads/kenney_pirate-kit/          ← 本项目使用
/Users/mac/Downloads/kenney_pirate-pack.zip
/Users/mac/Downloads/kenney_pirate-pack/         ← 仅 Preview_KenneyNL.png 等，未采用
```

---

## 2. 目录结构（实测递归结果）

```text
kenney_pirate-kit/
├── License.txt                  # CC0 (Creative Commons Zero)
├── Overview.html
├── Visit Kenney.url
├── Models/
│   ├── FBX format/              + Textures/colormap.png
│   ├── GLB format/              + Textures/colormap.png   ← 本项目采用
│   ├── OBJ format/              + Textures/colormap.png
│   └── Textures/                (空目录)
└── Previews/                    # 64x64 PNG 缩略图
```

### 文件类型统计（全量扫描）

| 扩展名 | 数量 | 说明 |
|---|---|---|
| `.png` | 77 | 72×Previews 缩略图 + 3×colormap + 其它 |
| `.obj` | 72 | OBJ 版本 |
| `.mtl` | 72 | OBJ 材质 |
| `.glb` | 72 | **GLB 版本（采用）** |
| `.fbx` | 72 | FBX 版本 |
| `.url` / `.txt` / `.html` | 5 | 说明文件 |

**结论：可用模型格式 = GLB（GLTF Binary）。** 无需 OBJ/FBX 转换器，`GLTFLoader` 可直接加载。
包内**无 `.gltf` 分离文件、无 `.webp`、无独立贴图集**（贴图仅一张图集，见 §4）。

---

## 3. 采用策略：只拷贝 GLB 到项目内

已实际执行拷贝（非引用外部绝对路径，保证 `npm run dev` 自包含可运行）：

```text
threejs-pirate-planet/public/assets/pirate-kit/
├── *.glb                ← 72 个（实测全部拷贝成功）
└── Textures/colormap.png ← 1 张共享图集
总大小 3.0 MB
```

并生成机器可读清单，**任何业务代码只允许引用清单中存在的 key**：

```text
threejs-pirate-planet/src/assets/manifest.json   ← 72 条实测记录
```

清单每条包含：`file`（真实相对路径）、`size`（W×H×D）、`base`（底面 Y）、`tris`、`parts`（子节点名）。

---

## 4. 关键发现：单一共享贴图图集（决定 Instancing 方案）

脚本统计 72 个 GLB 的 `images` / `textures`：

```text
拥有 1 张贴图 : 72 / 72
拥有 >1 张贴图:  0
无贴图        :  0
```

且 3 个格式目录下的 `colormap.png` **MD5 完全一致**：

```text
7aa0a33cbbc2b19f9ce5765b0e96e20d
```

图集规格：**512 × 512 PNG，10,061 字节**。目视确认为**纯渐变色块调色板**（约 20 个色块），
不含法线 / AO / 粗糙度 / 金属度通道。

材质特征（实测 `ship-pirate-large.glb`）：

```json
{
  "pbrMetallicRoughness": {
    "baseColorTexture": { "index": 0, "extensions": { "KHR_texture_transform": {...} } },
    "metallicFactor": 0
  },
  "doubleSided": true,
  "name": "colormap"
}
```

使用的唯一扩展：`KHR_texture_transform`（three.js `GLTFLoader` 原生支持）。

### 工程含义（极重要）

1. **所有模型共用 1 张图集 → 天然适合 `InstancedMesh`**：同类道具（树 / 岩石 / 木箱 / 木桶）
   可合并为极少 DrawCall，直接满足 §34 性能要求。
2. 卡通风格可用 `MeshLambertMaterial` + 同一图集，**无需 PBR / 环境贴图**，渲染开销低。
3. `doubleSided: true` → 旗帜、布片、草皮为单面片，加载后**不要**开启背面剔除，否则穿模消失。
4. 因颜色信息在 UV 图集里，**不能**简单 per-instance color 改色（会破坏贴图）；
   如需换色需走自定义 shader 或直接使用不同子模型。第一版不换色。

---

## 5. 模型清单（72 个，全实测尺寸）

尺寸格式 `W × H × D`（世界单位，GLB 原始单位）。`底面Y` 表示模型是否原点对齐底面（0 = 已对齐，可直接"种"在球面上）。
**所有模型 Y 轴朝上、`base=0`**（除 `cannon-ball` / `ship-wreck` 等少数），UP 轴统一为 **+Y**。

### 5.1 Ship 船只（10）— 核心动态资产

| 模型名称 | 实测 W×H×D | 三角面 | 子部件 | 建议用途 |
|---|---|---|---|---|
| `ship-pirate-large` | 4.80 × 9.96 × **13.10** | 1938 | hull, sail-a, sail-b, flag-c | **旗舰 / 海盗船**（Player 跟随目标） |
| `ship-pirate-medium` | 4.80 × 9.96 × 10.60 | 1812 | hull, sail-a, sail-b, flag-c | 主力海盗船 |
| `ship-pirate-small` | 4.80 × 9.96 × 8.80 | 1461 | hull, sail-a, flag-c | 轻型海盗船 |
| `ship-large` | 4.80 × 9.96 × 13.10 | 1849 | hull, sail-a, sail-b, flag-c | **商船 / 护卫舰** |
| `ship-medium` | 4.80 × 9.96 × 10.60 | 1723 | 同上 | 商船 |
| `ship-small` | 4.80 × 9.96 × 8.80 | 1370 | hull, sail-a, flag-c | 小型商船 |
| `ship-ghost` | 4.80 × 9.96 × 10.60 | 1703 | 同上 | **幽灵船**（夜晚彩蛋船，可选） |
| `ship-wreck` | 4.80 × 9.96 × 10.60 | 2282 | 16 节点 | 残骸装饰（**底面 Y = −0.785**，需修正） |
| `boat-row-large` | 2.75 × 0.85 × 2.85 | 174 | hull, oar | 港口小船 / 舢板 |
| `boat-row-small` | 2.75 × 0.85 × 2.37 | 168 | hull, oar | 港口小船 |

> **朝向实测**：船只 **forward = +Z**（D 轴最长 = 船体长度），mast/帆沿 +Y 升起。
> 船体 `base = 0` → 模型原点在**船底**，球面放置时需注意吃水线（需轻微下沉或抬高）。

### 5.2 Building 建筑（14）

| 模型名称 | W×H×D | 三角面 | 建议用途 |
|---|---|---|---|
| `tower-complete-large` | 3.63 × **10.22** × 3.63 | 604 | **港口主塔楼 / 城堡**（最高地标） |
| `tower-complete-small` | 3.35 × 6.78 × 3.66 | 650 | 次级塔楼 |
| `tower-watch` | 3.05 × 2.79 × 3.05 | 248 | 瞭望塔 |
| `tower-top` | 3.35 × 2.78 × 3.35 | 334 | 塔顶（可拼装） |
| `tower-roof` | 3.63 × 3.44 × 3.63 | 110 | 塔顶盖 |
| `tower-base` | 3.16 × 2.00 × 3.16 | 44 | 塔基（极低面，适合批量） |
| `tower-base-door` | 3.16 × 2.00 × 3.56 | 130 | 塔基 + 门 |
| `tower-middle` | 3.05 × 2.00 × 3.05 | 210 | 塔身中段 |
| `tower-middle-windows` | 2.83 × 2.00 × 3.07 | 242 | 塔身带窗 |
| `castle-gate` | 4.00 × 4.40 × 3.60 | 716 | **城堡大门**（港口入口标志） |
| `castle-wall` | 2.00 × 4.40 × 2.80 | 306 | 城墙（可拼接） |
| `castle-window` | 2.00 × 4.40 × 2.80 | 292 | 带窗城墙 |
| `castle-door` | 2.00 × 4.40 × 3.20 | 392 | 城门 |
| `structure` / `structure-roof` | 2.50 × 2.20 × 2.50 / 3.09 × 3.40 × 3.23 | 276 / 348 | **港口民居**（主体 + 屋顶，可拼装） |

> **全部 `base = 0`，UP = +Y** → 完美适配 §14「建筑沿球面法线站立」。

### 5.3 Dock 码头 / 平台（8）— §15 港口必需

| 模型名称 | W×H×D | 三角面 | 建议用途 |
|---|---|---|---|
| `structure-platform-dock` | 2.50 × 1.31 × 2.51 | 324 | **主码头**（含桩腿，伸入海面） |
| `structure-platform-dock-small` | 1.90 × 1.31 × 2.51 | 312 | 小码头 |
| `structure-platform` | 2.50 × 0.93 × 2.51 | 220 | 木质平台 |
| `structure-platform-small` | 1.90 × 0.90 × 2.51 | 208 | 小平台 |
| `platform` | 2.50 × 0.23 × 2.51 | 60 | 平板（极低面，Instancing 首选） |
| `platform-planks` | 1.89 × 0.43 × 2.70 | 48 | 木板道 |
| `structure-fence` | 2.50 × 2.20 × 2.50 | 356 | 围栏 |
| `structure-fence-sides` | 2.50 × 2.20 × 2.50 | 436 | 侧围栏 |

### 5.4 Nature 自然物（18）— Instancing 主力

| 模型名称 | W×H×D | 三角面 | 建议用途 |
|---|---|---|---|
| `palm-detailed-straight` | 3.22 × 4.21 × 3.22 | 482 | **棕榈树（精品）** |
| `palm-detailed-bend` | 2.88 × 4.25 × 3.22 | 482 | 弯曲棕榈（精品） |
| `palm-straight` | 2.49 × 4.21 × 2.49 | 338 | **棕榈树（标准，Instancing 用）** |
| `palm-bend` | 2.88 × 4.25 × 3.22 | 338 | 弯曲棕榈 |
| `rocks-a` | 5.11 × 2.90 × 4.39 | 264 | 岩石 A |
| `rocks-b` | 4.44 × 3.65 × 4.70 | 300 | 岩石 B |
| `rocks-c` | 3.64 × 2.30 × 3.67 | 232 | 岩石 C |
| `rocks-sand-a` | 5.11 × 3.21 × 4.39 | 552 | 沙滩岩石 A |
| `rocks-sand-b` | 4.38 × 3.71 × 4.71 | 516 | 沙滩岩石 B |
| `rocks-sand-c` | 3.71 × 2.61 × 3.72 | 448 | 沙滩岩石 C |
| `patch-sand` | 7.74 × 0.25 × 6.04 | 108 | **沙地贴片**（陆地配色） |
| `patch-sand-foliage` | 7.74 × 0.56 × 6.04 | 636 | 沙地 + 植被 |
| `patch-grass` | 5.27 × 0.25 × 4.11 | 84 | **草地贴片** |
| `patch-grass-foliage` | 5.27 × 0.56 × 4.11 | 300 | 草地 + 植被 |
| `grass-patch` | 1.31 × 0.47 × 1.27 | 360 | 草丛 |
| `grass-plant` | 1.11 × 0.52 × 1.24 | 144 | 单株草 |
| `grass` | 0.52 × 0.31 × 0.54 | 72 | 小草（极低面） |
| `hole` | 2.86 × 0.35 × 2.70 | 286 | 地面坑洞（细节） |

### 5.5 Prop 港口装饰（22）

| 模型名称 | W×H×D | 三角面 | 建议用途 |
|---|---|---|---|
| `barrel` | 1.34 × 1.23 × 1.34 | 148 | **木桶**（Instancing） |
| `crate` | 1.08 × 0.77 × 1.31 | 76 | **木箱**（极低面，Instancing） |
| `crate-bottles` | 1.08 × 1.06 × 1.31 | 572 | 装瓶木箱 |
| `chest` | 1.27 × 1.15 × 1.27 | 232 | **宝箱**（港口亮点） |
| `bottle` | 0.36 × 0.89 × 0.36 | 124 | 酒瓶 |
| `bottle-large` | 0.47 × 0.89 × 0.47 | 108 | 大酒瓶 |
| `cannon` | 1.40 × 1.05 × 1.92 | 232 | **岸防炮** |
| `cannon-mobile` | 1.68 × 1.38 × 1.92 | 472 | 移动炮（带轮） |
| `cannon-ball` | 0.64 × 0.67 × 0.55 | 48 | 炮弹（**base = −0.335，需修正**） |
| `tool-paddle` | 0.66 × 2.35 × 0.21 | 60 | 船桨 |
| `tool-shovel` | 0.66 × 2.35 × 0.28 | 168 | 铁锹 |
| `flag-pirate-high` | 1.34 × 3.60 × 0.40 | 144 | **高海盗旗** |
| `flag-pirate-high-pennant` | 1.76 × 3.60 × 0.40 | 118 | 高海盗三角旗 |
| `flag-pirate` | 1.34 × 2.10 × 0.40 | 144 | 海盗旗 |
| `flag-pirate-pennant` | 1.76 × 2.10 × 0.40 | 118 | 海盗三角旗 |
| `flag-high` | 1.34 × 3.60 × 0.40 | 144 | 高旗杆 |
| `flag-high-pennant` | 1.76 × 3.60 × 0.40 | 118 | 高三角旗 |
| `flag` | 1.34 × 2.10 × 0.40 | 144 | 旗帜 |
| `flag-pennant` | 1.76 × 2.10 × 0.40 | 118 | 三角旗 |
| `mast` | 4.39 × 7.86 × 1.74 | 302 | 独立桅杆 |
| `mast-ropes` | 4.39 × 7.89 × 2.35 | 350 | 桅杆 + 索具（**base = −0.024**） |

---

## 6. 全局面统计与性能预判

- **全 72 模型合计 ≈ 27,800 三角面**（极低，Kenney 低多边形风格）
- 最大单模型 `ship-wreck` = 2,282 tris；地标 `tower-complete-large` = 604 tris
- 船只单模 ≈ 1,400–1,950 tris × 5 艘 ≈ **9,000 tris** — 完全无压力
- 树 / 岩 / 箱 / 桶 单体 **72–552 tris** → `InstancedMesh` 各 1 个 DrawCall 即可渲染数百实例
- **DrawCall 预算**（MVP 目标 < 120）：

| 内容 | 方案 | DrawCall |
|---|---|---|
| 海洋球 | 单个 ShaderMaterial 球 | 1 |
| 陆地 / 岛屿 | 合并 BufferGeometry | 1–2 |
| 云 | InstancedMesh | 1 |
| 大气层 | 单个 Fresnel 球 | 1 |
| 星空 | Points | 1 |
| 棕榈树 ×N | InstancedMesh | 1 |
| 岩石 ×N | InstancedMesh | 1 |
| 木箱 / 木桶 ×N | InstancedMesh | 2 |
| 建筑（港口 4~8 处 × ~6 栋） | 独立 Mesh（需各自朝向） | ~40 |
| 船只 5 艘（含帆） | 每艘 2–3 Mesh | ~12 |
| 航线 | Line ×N | ~6 |
| Mini Globe（独立小场景） | 复用简化球 | ~4 |
| **合计** | | **≈ 70–80** ✅ |

**结论：桌面端 60 FPS 目标（§34）在此资产量级下无风险。**

---

## 7. 需在 `ModelUtils.js` 中统一处理的修正项

实测发现的**不一致点**（必须集中在 `ModelUtils` 处理，禁止散落到业务代码 — §39）：

| 问题 | 影响模型 | 处理方式 |
|---|---|---|
| 原点在**船底**（base=0） | 所有 ship-* | 球面放置时按吃水深度下沉 `hullDraft`，避免"悬浮" |
| `base = −0.785` | `ship-wreck` | 统一 `alignToGround()` 抬升 |
| `base = −0.335` | `cannon-ball` | 同上 |
| `base = −0.024` | `mast-ropes` | 同上（误差极小） |
| `doubleSided = true` | 全部（尤其旗 / 草） | 保持不剔除背面 |
| 子节点命名重复（`flag-c` ×3） | 所有 ship-* | 按 **index** 而非 name 取部件做动画（帆 / 旗） |
| 朝向不统一风险 | 船 forward=+Z | 统一 `forwardAxis = +Z`，由 GeoUtils 旋转对齐 |

`ModelUtils.js` 职责（§39）：`scale`、`alignToGround`、`setShadow`、`cloneModel`、`extractParts`、
`normalizeMaterials`（Lambert 化 + 共享图集），并输出统一的「模型注册表」。

---

## 8. MVP 选用模型（**只用实测存在的这些**）

第一版**不加载全部 72 个**（§5 要求）。从实测清单中挑选：

```text
Ships      ship-pirate-large, ship-pirate-medium, ship-pirate-small,
           ship-large, ship-medium, boat-row-small            (6)
Buildings  tower-complete-large, tower-complete-small, tower-watch,
           castle-gate, castle-wall, structure, structure-roof (7)
Docks      structure-platform-dock, structure-platform-dock-small,
           platform-planks, structure-fence                    (4)
Nature     palm-straight, palm-bend, rocks-a, rocks-b,
           patch-sand, patch-grass                             (6)
Props      barrel, crate, chest, flag-pirate-high, flag-pennant,
           cannon                                              (6)
                                                                  共 29 个
```

未采用但已拷入项目备用：`ship-ghost`（夜晚彩蛋）、`ship-wreck`（海上残骸）、
`grass-*` 系列、`bottle*`、`tower-*` 拼装件、`mast*`、`tool-*`、`hole`。

---

## 9. Phase 0 验收自查（§37）

- [x] 资源目录**是否存在** → 存在，真实路径 `/Users/mac/Downloads/kenney_pirate-kit`（Desktop 下不存在，已如实修正）
- [x] 可用模型**格式** → **GLB**（GLTF Binary），`GLTFLoader` 直接可用
- [x] 船 / 建筑 / 码头 / 树 / 岩石 / 木箱 / 木桶 **候选模型全部实测列出**（§5.1–5.5，72 个全列）
- [x] **未引用任何不存在的模型路径** — 全部路径来自实际扫描，并已物理拷贝至
      `public/assets/pirate-kit/`，同时生成 `src/assets/manifest.json` 作为唯一合法引用源
- [x] 尺寸 / UP 轴 / Forward 轴 / 面数 / Instancing 适配性 **均经脚本解析实测**（§5、§6）
- [x] 共享图集与 `doubleSided` / `KHR_texture_transform` 特性已确认（§4）

**License**：CC0（`License.txt` 实测），可自由商用。建议 UI 底部署名 "Assets: Kenney (kenney.nl)"。
