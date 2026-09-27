# 架构设计 — threejs-pirate-planet

## 1. 场景总览（§9）

```text
Scene
│
├── Planet (Group, 可整体自转)
│   ├── Ocean        ShaderMaterial 球（Fresnel + Specular + 噪声扰动）
│   ├── Land         程序化球面陆地（多大陆 + 岛屿，合并几何）
│   ├── Clouds       InstancedMesh 云片，独立慢速旋转层
│   └── Atmosphere   Fresnel 辉光球（BackSide，加色混合）
│
├── World (Group)
│   ├── Buildings    BuildingManager（港内建筑，各自沿表面法线）
│   ├── Ports        PortManager（4~8 港口聚合：建筑/码头/道具/旗帜）
│   ├── Props        InstancedMesh：palm / rocks / crate / barrel
│   ├── Ships        ShipManager（3~5 艘，球面航行 + 姿态对齐）
│   └── Routes       RouteManager（大圆弧 Line，可开关，不入球内）
│
├── Sky
│   └── StarField    THREE.Points（低亮度，不抢主体）
│
├── Lighting
│   ├── DirectionalLight  ← Sun（可控方位 → 昼夜）
│   ├── AmbientLight / HemisphereLight
│   └── PortNightLights  夜晚暖黄点光（港口）
│
├── CameraSystem
│   ├── GlobeCamera   全球轨道观察
│   └── LocalCamera   贴地视角（弯曲地平线）
│
└── UI (DOM Overlay + 独立 Mini Globe 小场景)
    ├── MiniGlobe     第二 renderer/viewport 的真 3D 小地球
    ├── LocationPanel 悬停 / 选中信息
    └── HUD           视角切换、航线开关、时间、FPS
```

## 2. 分层与职责边界

| 层 | 文件 | 单一职责 | 禁止 |
|---|---|---|---|
| 引导 | `src/main.js` | 组装各 Manager，跑主循环 | 不写几何 / 定位数学 |
| 渲染 | `core/RendererManager.js` | renderer、size、pixelRatio、resize、Mini 视口 | 不碰场景内容 |
| 相机 | `core/CameraManager.js` | 持有 active camera、视角状态机、FlyTo | 不直接算球面坐标（调 GeoUtils）|
| 资产 | `core/AssetManager.js` | GLTFLoader 队列 + 清单校验 + 归一化 | 不做放置逻辑 |
| 星球 | `planet/*.js` | 球体 /  shader / 云层 / 大气 | 不放置建筑 |
| 世界 | `world/*.js` | 港口、船只、航线、Instanced 道具 | 不写散落模型修正值 |
| 交互 | `ui/*.js` | Raycast、面板、Mini Globe | 不改相机内部结构 |
| 数学 | `utils/GeoUtils.js` | 全部球面数学（唯一来源）| — |
| 模型 | `utils/ModelUtils.js` | 全部模型归一化（唯一来源）| — |

> **两条「唯一来源」铁律（§38/§39）**：
> ① 任何球面数学只能出现在 `GeoUtils.js`；② 任何模型 scale / 偏移 / 朝向 / 材质修正
> 只能出现在 `ModelUtils.js`。业务代码出现 `model.rotation.set(0,0,0)` 或裸
> `new Vector3(lat...)` 即视为违规。

## 3. 星球半径体系（§11）

```text
R_PLANET        = 100        海洋球半径（基准）
R_LAND          = 100 + h    陆地由高度场生成（h: 0.6 ~ 6.0，山峰到 9）
R_SHIP_FLOAT    = 100        船体吃水线贴 R_PLANET，轻微 bob ±0.35
R_CLOUD         = 112        云层
R_ATMOSPHERE    = 118        大气辉光（BackSide + AdditiveBlending）
```

半径**只在此处定义为常量**（`src/config.js`），其余模块引用常量。
陆地**不用**「贴图的球」，用高度场顶点位移 → 真实轮廓起伏（§13）。

## 4. 球面坐标与定位管线（§14）

```text
lat, lon
   │  GeoUtils.latLonToVector3(lat, lon, r)
   ▼
position ──── normal = normalize(position)
   │
   │  GeoUtils.alignObjectToSurface(obj, position, forwardHint)
   ▼
构建正交基  up = normal
            forward = tangent(forwardHint, normal)   ← 投影到切平面后归一化
            right = cross(up, forward)
   ▼
Matrix4 直接 write 到 object.quaternion（避免 Euler 万向锁 / up 抖动）
```

北极 up=+Y、赤道 up=水平向外、南极 up=−Y 自然成立。
**船只 forwardHint = 航线切线**，**建筑 forwardHint = 港口朝向或随机**。

## 5. 球面航行算法（§17/§18）

```text
Route = [portA, portB, portC, ...]   港口经纬度序列
对相邻港口对：
  GeoUtils.createGreatCirclePoints(a, b, R, segments)
    → 起点/终点单位向量夹角 θ，按 slerp 逐段插值 → × R
每帧：
  t += dt * speed / routeLength
  pos = slerpOnSphere(a, b, tLocal, R)
  tangent = 归一化(dPos)（切线 = 前视点 − 当前点）
  Ship.up = normalize(pos)，Ship.forward = tangent
  + 轻微 bob / roll / pitch（正弦噪声，幅度 ≤ 2°）
```

航线 Line **抬升到 R_PLANET + 0.6**，避免穿入球体（§19）。

## 6. 相机系统（§20–§23）

```text
状态机：GLOBE ──flyTo──▶ LOCAL ──flyTo──▶ GLOBE
             （GSAP 或自建 easeInOutCubic，禁止瞬移）

GLOBE：球坐标轨道，target = 球心，radius 150~600
LOCAL：position 位于球面上方 altitude 4~18，lookAt 前方地表点
        由 (lat, lon, altitude, heading) 参数化 → 保证地平线弯曲可见
Follow Ship：LOCAL 参数跟随船 (lat, lon) 实时推导
FlyTo：起止 (lat,lon,radius) 双参数同时插值 → 球面位置沿弧插值，不平直穿球
```

## 7. Mini Globe（§24–§27）

```text
独立 THREE.Scene + 复用同一 renderer（scissor + viewport，右下角）
内容：简化海洋球(R=1) + 简化陆地 + 港口 Marker(Sprite/小球) + 当前位置 Marker
交互：该视口坐标 → NDC → Raycaster → 与 Mini 球求交
      → vector3ToLatLon → CameraManager.flyTo(lat, lon)
      Marker 命中 → flyTo(port)
```

用 **scissor/viewport 同 renderer 双通道**，避免第二个 WebGLRenderer 的上下文开销。
Mini Globe 为**真 3D**，非 PNG 贴图（§24）。

## 8. 交互（§28–§30）

```text
pointermove → Raycaster（GLOBE/LOCAL 主相机）→ hover 目标
   命中 Ship / Port / Building → LocationPanel 简介
pointerdown → 选中 Ship → 船只面板（名称 / 类型 / From / To / 状态 / 进度）
   → [Follow Ship] 按钮 → 进入跟随状态
点击空白 → 取消选中
```

Hover 与 Mini Globe Raycast 使用**各自的相机与视口矩形**，互不干扰。

## 9. 性能策略（§34/§35）

| 策略 | 实现 |
|---|---|
| InstancedMesh | palm / rocks / crate / barrel / grass，1 类 1 DrawCall |
| 共享图集 | 72 模型同一 512² colormap（实测 MD5 一致）→ 材质可复用 |
| 材质 | `MeshLambertMaterial`（低开销，适配 flat 卡通），`doubleSided` 保留 |
| 合并几何 | 陆地 / 岛屿合成少量 BufferGeometry |
| LOD | 后期：GLOBE 隐藏小道具，LOCAL 全显示（`progress.md` 记录） |
| 预算 | DrawCall < 120，目标 60 FPS |

## 10. 资产管线（实测路径）

```text
/Users/mac/Downloads/kenney_pirate-kit/Models/GLB format/   ← 扫描源
        │ 已物理拷贝 72 个 .glb + Textures/colormap.png
        ▼
public/assets/pirate-kit/*.glb                ← 运行时加载（自包含）
src/assets/manifest.json                      ← 72 条实测记录（唯一合法引用源）
        │ AssetManager 校验：清单里没有的 key 直接抛错
        ▼
ModelUtils 归一化（scale / alignToGround / 材质 / 部件提取）
```

## 11. 目录结构（§10，按需而非教条）

```text
threejs-pirate-planet/
├── index.html
├── package.json
├── vite.config.js
├── public/assets/pirate-kit/       # 72 glb + Textures/colormap.png（实测）
├── src/
│   ├── main.js
│   ├── config.js                   # 半径 / 常量唯一来源
│   ├── assets/manifest.json        # 机器生成，勿手改
│   ├── core/    SceneManager · CameraManager · RendererManager · AssetManager
│   ├── planet/  Planet · Ocean · Land · Atmosphere · Clouds · Stars
│   ├── world/   BuildingManager · PortManager · ShipManager · RouteManager
│   ├── camera/  GlobeCamera · LocalCamera
│   ├── ui/      MiniGlobe · LocationPanel · HUD
│   └── utils/   GeoUtils · ModelUtils
└── docs/   project-goal · asset-audit · architecture · development-plan · progress
```

## 12. 主循环

```text
animate(dt):
  AssetManager.ready? → 首帧后启用交互
  Planet.update(dt)         # 自转、云层偏移
  ShipManager.update(dt)    # 球面推进 + 姿态 + 波浪
  CameraManager.update(dt)  # 状态机 / FlyTo / Follow
  MiniGlobe.update(dt)      # 位置 Marker 同步
  render 主视口 → render Mini 视口
```
