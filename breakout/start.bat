@echo off
rem 一键启动本地服务器（ES Module 与 fetch 需要 http 环境）
cd /d %~dp0
echo.
echo   砖块破坏者 · Breakout Elements
echo   服务启动后请访问: http://localhost:8765
echo   (调试模式: http://localhost:8765/?debug=1)
echo.
start "" http://localhost:8765
python -m http.server 8765 || npx --yes serve -l 8765 .
pause
