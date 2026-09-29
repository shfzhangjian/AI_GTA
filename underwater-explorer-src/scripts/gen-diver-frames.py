#!/usr/bin/env python3
"""生成 src/data/diverClips.ts：潜水员动画帧数据（alpha 通道分析，勿手改生成物）。"""
import re, numpy as np
from PIL import Image

FPS = {"diver_swimming":10,"diver_idle":6,"diver_hurt":8,"diver_fast":12,"diver_rush":12}
CLIP = {"diver_swimming":"swim","diver_idle":"idle","diver_hurt":"hurt","diver_fast":"fast","diver_rush":"rush"}

def frames_of(name):
    im = Image.open(f"public/assets/player/{name}.png").convert("RGBA")
    a = np.array(im)[:, :, 3]
    s = "".join("1" if v else "0" for v in (a > 0).any(axis=0))
    merged = []
    for m in re.finditer(r"1+", s):
        s0, s1 = m.start(), m.end()
        if merged and s0 - merged[-1][1] < 6: merged[-1][1] = s1
        else: merged.append([s0, s1])
    segs = [(x0, x1) for x0, x1 in merged if x1 - x0 >= 12]
    fw = max(s1 - s0 for s0, s1 in segs); mh = 0; raw = []
    for s0, s1 in segs:
        sub = a[:, s0:s1]
        ys = np.where((sub > 0).any(axis=1))[0]; xs = np.where((sub > 0).any(axis=0))[0]
        h = int(ys.max() - ys.min() + 1); mh = max(mh, h)
        raw.append((int(s0 + xs.min()), int(xs.max() - xs.min() + 1), int(ys.min()), h))
    return fw, mh, [{"x": max(0, x0 - (fw - w) // 2), "y": max(0, y0 - (mh - h) // 2)} for x0, w, y0, h in raw]

L = ["/**",
     " * 潜水员动画帧数据（数据驱动，勿手改）。",
     " * 由 scripts/gen-diver-frames.py 从素材 alpha 通道分析生成（等宽帧 + 居中包围盒）。",
     " * 素材：ansimuz Underwater Diving Pack（CC0，登记见 docs/ASSET_LICENSES.md）。",
     " */",
     "import type { ClipDef } from '../utils/spritesheet';",
     "",
     "export const DIVER_CLIPS: Record<string, ClipDef> = {"]
for name in FPS:
    fw, mh, frames = frames_of(name)
    L += [f"  {CLIP[name]}: {{", f"    url: '/assets/player/{name}.png',",
          f"    frameWidth: {fw}, frameHeight: {mh}, fps: {FPS[name]}, loop: true,",
          "    frames: ["]
    L += [f"      {{ x: {f['x']}, y: {f['y']} }}," for f in frames]
    L += ["    ],", "  },"]
L += ["};", ""]
open("src/data/diverClips.ts", "w").write("\n".join(L))
print("regenerated diverClips.ts")
