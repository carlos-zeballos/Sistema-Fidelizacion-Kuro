@echo off
chcp 65001 >nul
echo Verificando eventos del cliente Carlos...
cd /d "%~dp0backend"
node scripts\check-customer-events.js 1
pause
