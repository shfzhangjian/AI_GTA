# three-viewer · UAL 动作角色浏览器

HTML + Three.js（r185，CDN importmap，零构建）加载 `assets/UAL1_Standard.glb`（Unreal / Godot 通用动作角色动画集，43 段动画、65 骨骼），并实现**动作游戏式操作控制**。

## 操作说明

| 按键 | 动作 |
| --- | --- |
| W / A / S / D | 走动（相机相对方向，自动转身） |
| Shift + WASD | 跑步 |
| 空格（按住 → 松开） | 蓄力下蹲，松开跳起；蓄力越久跳越高 |
| 空中 + WASD | **腾空移动**：保留出跳惯性，可空中加速 / 转向（Shift 增强操控） |
| K | 打拳，连按进入 Jab ↔ Cross 组合拳（右侧 "N Hit!" 计数） |
| J | 释放魔法（施法动作 + 蓝色光球弹道） |
| S（单独按住） | 蹲行 |

状态可自由组合：跑动中起跳、空中转向、落地缓冲后无缝接续移动、走动中出拳（缓慢漂移跟随）。

## 技术要点

- `AnimationMixer` 状态机：单向 `play() + crossFadeTo()` 交叉淡入淡出（避免 `startAfter` 混用导致的动作卡死）
- 一次性动画（拳击 / 施法 / 跳跃三段 Jump_Start → Jump_Loop → Jump_Land）按时长自动回归循环层
- 垂直物理：重力 22 m/s²，蓄力映射初速 4.2–7.0 m/s；空中惯性指数衰减 + 输入加速封顶
- OrbitControls 相机跟随（target 插值到角色位置），左键旋转 / 滚轮缩放 / 右键平移
- 左侧面板按姿态分组浏览全部 43 段动画（站立 / 移动 / 蹲伏 / 格斗 / 武器 / 坐姿 / 施法 / 游泳 / 交互）

## 本地运行

```bash
cd three-viewer && python3 -m http.server 8000
# 打开 http://localhost:8000/
```

> ES Module + GLB fetch 需要 http 环境，file:// 直接打开会被 CORS 拦截。
