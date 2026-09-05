# 底图目录

把自定义底图放在这里，然后在关卡 JSON 中引用：

```json
"bg": { "type": "image", "src": "assets/bg/desert.png", "top": "#261a0b", "bottom": "#52381c" }
```

- `type:"image"` 加载失败时自动回退到程序化渐变底图（`top`/`bottom`/`stars`/`seed` 为回退参数）。
- 第三关默认引用 `assets/bg/desert.png`，放入同名图片即生效；不放也没关系，会自动回退。
