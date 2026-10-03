# 视频生产记录

介绍视频使用真实浏览器 WebGL 游戏帧，由正常战斗逻辑和自动操作完成五球、150 次击破。录制用脚本独立于已部署的游戏代码，没有更改生命、伤害或敌人状态。

1. 将上传的 `source-original.zip` 解压到 `E:/videgame/starbloom-source/`。
2. 将本目录复制到 `E:/videgame/starbloom-video/`。
3. 运行 `python prepare_capture.py` 与 `python server.py`；浏览器打开 `http://127.0.0.1:8094/`，点击「开始实机录制」。页面使用浏览器的 MediaRecorder 录制 1280×720 游戏场景与状态叠层；原始约 200 秒录像保存在本地。
4. 运行 `python -m pip install --target voice-deps edge-tts`，再运行 `python voice_neural.py`，用标准中文神经男声 `zh-CN-YunxiNeural` 生成评测式旁白。`voice.ps1` 保留 Windows 本地中文语音备用。
5. 安装 Python 的 NumPy / Pillow，准备 FFmpeg，运行 `render_video.py`。脚本依照实机录制时间点剪辑，合成约 150 秒、30fps、H.264 / AAC MP4 与 SRT 字幕，并生成抽帧检查图。

脚本中的绝对路径为本次制作工作区，可按需修改。剪辑时间点对应 `../media/capture-trace.json`，源录像未提交仓库；重新录制后应按新时间点调整 `shots`。

动态战斗镜头保持正常速度；标题、升级与后续战斗交替出现，结算界面延长停留以配合旁白。视频状态叠层重新排版，游戏截图保留原始 DOM 界面。旁白采用正常语速与自然停顿，经过响度规范化；字幕烧录进 MP4，同时单独提供 SRT。
