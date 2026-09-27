# 开发计划与阶段验收 — threejs-pirate-planet

> 铁律（§40/§41）：分析资源 → 写计划 → 实现当前阶段 → 启动本地服务 →
> 提供访问地址 → **等待用户验收** → 依反馈修改 → 用户确认 → 才进入下一阶段。
>
> 禁止：闭门一次性写完、不启动服务就声称完成、未验收就进下一阶段、未分析模型就写模型路径。

---

## 环境事实（实测，见 asset-audit.md）

```text
OS      macOS arm64        Node ~/.local/bin/node v22.23.1
npm     ~/.local/bin/npm v10.9.8      registry 可达
资产    /Users/mac/Downloads/kenney_pirate-kit   (Desktop 下不存在)
格式    GLB ×72（单共享图集 512²）
```

`npm run dev` 前需保证 PATH 含 `~/.local/bin`。

---

## Phase 0 — 资源分析 ✅ **已完成，待你确认**

**产出**

- `docs/asset-audit.md` — 72 个模型全量实测尺寸 / 三角面 / UP / Forward / Instancing 适配
- `public/assets/pirate-kit/` — 72 个 `.glb` + `Textures/colormap.png` 实拷（3.0 MB）
- `src/assets/manifest.json` — 72 条机器生成记录，作为唯一合法引用源

**验收自查**

- [x] 资源目录存在性已明确（真实在 Downloads，Desktop 不存在已如实修正）
- [x] 可用格式明确 = **GLB**
- [x] 船 / 建筑 / 码头 / 树 / 岩石 / 木箱 / 木桶候选全部实测列出
- [x] **未引用任何不存在的模型路径**

⏸ **等待验收**：确认资产选择（MVP 29 个）与项目路径后进入 Phase 1。

---

## Phase 1 — Three.js 基础项目 🚧 **本轮实现**

**目标**：一个能浏览器访问的空 3D 世界骨架，不含星球内容。

**实现**

```text
package.json / vite.config.js / index.html
src/main.js          组装 + animate 循环 + resize
src/core/            RendererManager · SceneManager · CameraManager · AssetManager
src/utils/           GeoUtils（先建最小实现）· ModelUtils（先建最小实现）
src/config.js        半径常量
OrbitControls + DirectionalLight + AmbientLight + 一个临时测试球（Phase 2 替换）
lil-gui（可选）+ stats.js（可选，默认关）
```

**验收标准**

- [ ] `npm install` 成功
- [ ] `npm run dev` 成功，输出本地访问地址
- [ ] 浏览器能看到基础 3D 场景（临时球体 + 光照 + 星空占位）
- [ ] 鼠标可旋转、滚轮可缩放
- [ ] 无控制台报错

⏸ **等待验收** → 确认后才进 Phase 2。

---

## Phase 2 — Planet 星球本体（首次视觉验收）

**目标**：真球体微缩星球观感。

```text
planet/Ocean       ShaderMaterial：Fresnel + Specular + 噪声波 + 法线微扰
planet/Land        程序化大陆（球面高度场 + 噪声 + mask）+ 岛屿 + 沙滩带
planet/Clouds      InstancedMesh 云，独立慢旋转
planet/Atmosphere  Fresnel 边缘淡蓝光晕
planet/Stars       Points，低亮度不抢主体
```

**验收标准**

- [ ] 星球是**真正球体**（非平面贴图 + 蓝色背景）
- [ ] 海洋呈球形、有高光与轻微波动
- [ ] 陆地**贴合球面**，能看出大陆 / 岛屿 / 沙滩
- [ ] 能看到大气光晕 + 星空
- [ ] 整体有「微缩星球」观感
- [ ] 旋转缩放流畅

⏸ **等待用户视觉验收与修改意见**。

---

## Phase 3 — 加入 Kenney 模型

```text
utils/ModelUtils     scale / alignToGround / 材质归一化 / 部件提取 / 注册表
world/BuildingManager
world/PortManager    4~8 港口（实测存在的建筑 + 码头 + 树 + 岩石 + 箱 + 桶 + 旗）
InstancedMesh 树 / 岩石 / 箱 / 桶
```

**验收标准**

- [ ] 模型**全部来自实测清单**（可在控制台列出已加载 key）
- [ ] 建筑**沿球面法线站立**：北极 ↑ / 赤道 → / 南极 ↓
- [ ] 港口分布在不同大陆 / 岛屿
- [ ] 模型比例协调，无穿地 / 悬浮 / 侧翻
- [ ] 底面偏移异常件已修正（`ship-wreck` −0.785、`cannon-ball` −0.335、`mast-ropes` −0.024）

⏸ **等待验收**。

---

## Phase 4 — 船只与航线

```text
world/ShipManager    3~5 艘，球面 slerp 推进，姿态 up=normal / forward=tangent
world/RouteManager   大圆弧线，抬升海面 0.6，可开关
波浪                  轻微 bob / roll / pitch（≤2°）
```

**验收标准**

- [ ] 船只**真的在移动**（非静态装饰）
- [ ] 轨迹为**球面弧线**，非 XYZ 直线
- [ ] 船底始终朝球心，船顶朝外
- [ ] 船头对准航线切线
- [ ] 无插海 / 悬浮过高 / 侧翻 / 保持世界水平
- [ ] 航线不穿过地球内部，可开关

⏸ **等待验收**。

---

## Phase 5 — 双视角系统

```text
camera/GlobeCamera · camera/LocalCamera
CameraManager 状态机 + FlyTo 平滑动画（GSAP 或自建 ease）
```

**验收标准**

- [ ] 全球视角可看到完整星球
- [ ] 局部视角贴近星球表面
- [ ] **局部视角地平线明显弯曲**（本项目最重要体验之一）
- [ ] 切换为**平滑飞行**，无瞬移
- [ ] 飞到球另一侧时相机不翻转错误

⏸ **等待验收**。

---

## Phase 6 — Mini Globe

```text
ui/MiniGlobe  同 renderer scissor/viewport 第二通道真 3D 小地球
              海洋 + 简化陆地 + 港口 Marker + 当前位置 Marker
              该视口 Raycast → vector3ToLatLon → CameraManager.flyTo
```

**验收标准**

- [ ] 是**真 3D 小地球**，不是一张 PNG
- [ ] 右下角稳定显示，不与其他 UI 重叠
- [ ] 点击小地球 → 得到球面位置 → 主相机平滑飞往
- [ ] 点击港口 Marker → 飞往该港口
- [ ] 当前位置 Marker 随视角实时更新

⏸ **等待验收**。

---

## Phase 7 — 交互与信息面板

```text
ui/LocationPanel  hover 信息 / 船只面板 / 港口面板
ui/HUD            视角切换、航线开关、时间、FPS
Raycaster 船只与港口选中 · Follow Ship
```

**验收标准**

- [ ] 悬停建筑 / 船 / 港口显示信息
- [ ] 点船 → 面板显示 名称 / 类型 / From / To / 状态 / **进度**
- [ ] `Follow Ship` 稳定跟随沿球面航行的船
- [ ] 取消选中正常
- [ ] UI 不遮挡主画面

⏸ **等待验收**。

---

## Phase 8 — 视觉打磨与性能

```text
海洋 shader 精修 · 大气 / 云精修 · Instancing 全量 · LOD
DrawCall 与 FPS 检查 · 桌面 / 移动布局检查
```

**验收标准**

- [ ] 桌面 **60 FPS**，DrawCall < 120
- [ ] Mini Globe 与其他 UI 无重叠
- [ ] 全球 / 局部两视角都稳定可用
- [ ] 场景视觉统一
- [ ] `docs/progress.md` 记录已完成 / 未完成 / 已知问题 / 运行方式

✅ **最终交付**：`npm install && npm run dev` 可用，体验全部核心（§41）。

---

## 里程碑一览

| Phase | 内容 | 状态 |
|---|---|---|
| 0 | 资源审计 | ✅ 完成，待确认 |
| 1 | Three.js 基础骨架 | 🚧 本轮 |
| 2 | 星球本体（海洋/陆地/大气/云/星） | ⬜ |
| 3 | Kenney 模型 + 港口（球面站立） | ⬜ |
| 4 | 船只球面航行 + 航线 | ⬜ |
| 5 | Global / Local 双视角 + 平滑切换 | ⬜ |
| 6 | Mini Globe 点击导航 | ⬜ |
| 7 | 交互面板 + Follow Ship | ⬜ |
| 8 | 打磨 + 性能 | ⬜ |
