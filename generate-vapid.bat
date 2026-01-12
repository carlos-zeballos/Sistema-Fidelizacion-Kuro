@echo off
chcp 65001 >nul
echo Generando VAPID keys...
cd /d "%~dp0backend"
node scripts\generate-vapid-keys.js
pause
