@echo off
chcp 65001 > nul
cd /d "%~dp0"
call npm run dev -- --open --port 5173 --strictPort
pause
