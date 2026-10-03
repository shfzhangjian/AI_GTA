@echo off
setlocal
cd /d "%~dp0"
python start_local.py
if errorlevel 1 pause
