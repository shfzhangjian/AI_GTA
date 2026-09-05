# 音效目录（预留）

当前全部音效由 `src/audio/audioEngine.js` 用 WebAudio **程序化合成**，无需任何素材文件。

如需替换为真实采样音效，可在 AudioEngine.play() 中扩展：用 `ctx.decodeAudioData` 加载本目录下的音频并接入现有总线即可。
