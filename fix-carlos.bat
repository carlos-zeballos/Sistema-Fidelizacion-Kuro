@echo off
chcp 65001 >nul
echo Corrigiendo eventos del cliente Carlos...
cd /d "%~dp0backend"
node scripts\fix-carlos-events.js
pause
