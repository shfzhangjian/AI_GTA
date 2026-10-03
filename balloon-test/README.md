# 气球测试 / The Balloon Test

[在线试玩](https://shfzhangjian.github.io/AI_GTA/balloon-test/) · [单文件成品](./index.html) · [验证记录](./QA.md)

双击 `index.html` 即可运行。唯一可选网络请求是 Google Fonts；断网会使用本机字体。Three.js、样式、纹理、全部模型和 Web Audio 都包含在这个 HTML 中。

轻触页面或 Space 泵气；F 轻弹；W 切换水模式并开始新一轮；R 重置；S 在爆破后以 1/12 速度重播。右上控件可切换声音。声音在首次交互后启用。个人最佳分空气和水保存至 localStorage；浏览器阻止存储时仍可正常玩。

## 文件

- `index.html`：可复制、可离线打开的单文件成品。
- `app.js`、`template.html`：可编辑源文件。
- `build.cjs`：将 Three.js 与应用内联打包；构建依赖由 `package-lock.json` 锁定。
- `server.cjs`：`node server.cjs`，预览于 http://localhost:8791。
- `verify.cjs`：`node verify.cjs`，检查 1,000 轮 Gent 曲线及单文件约束。

## 本地预览与重建

试玩现成的 `index.html` 不需要安装依赖或编译。使用 Node.js 18 或更高版本可启动 HTTP 预览：

```bash
cd balloon-test
node server.cjs
# http://localhost:8791
```

修改源码后重新生成单文件：

```bash
npm ci
npm run build
npm run check
```

`three` 与 `esbuild` 仅用于开发和打包。发布到 GitHub Pages 只需已提交的 `index.html`，运行时不加载 npm 包或其他项目的文件。

## 物理与渲染

压力使用 Gent 不可压缩薄膜近似：

`P = (2 μ H / R) (λ⁻¹ − λ⁻⁷) / [1 − (2 λ² + λ⁻⁴ − 3) / Jm]`

等容积冲程加入空气，并包含理想气体的小幅压力修正。末轮随机破裂阈值独立于压力曲线。结果的 `×` 指**面积拉伸 λ²**，也决定静止厚度 / 面积拉伸的 Beer–Lambert 透射。参考：[Mangan & Destrade, Gent models for the inflation of spherical balloons](https://arxiv.org/html/2009.08752)。

乳胶后壁、前壁分别按乘法透射及加法散射绘制。图案和署名是两张程序化印刷纹理，锁定材料 UV；图案随过度拉伸裂开，署名独立保留。水层使用 Three.js physical transmission / IOR 1.333，并使用程序化工作室环境。

折叠、局部弱点、碎片卷曲及液体薄片是实时视觉近似；这不是完整流体或有限元求解器。爆破使用固定 120 Hz 物理步长；慢动作降低时间推进频率而保留相同步长。撕裂位置、碎片和水滴由种子预生成，重播在第 120 步检查物理状态指纹。结束面板出现后，运动继续至落地。

启动预编译全部着色器，包括未显示的水、碎片、印刷与烟雾。手机像素比封顶 1.75，复用碎片与水滴池。`prefers-reduced-motion` 关闭闲置摆动、波纹形变和界面过渡；保留理解实验结果所需的手柄及爆破运动。

Three.js r165，MIT，许可证保留于内联包。程序不请求外部音频、图片、模型或脚本。

![气球测试：纸质工作室中的乳胶实验](./preview.png)
