@echo off
chcp 65001 >nul
echo Verificando QR del cliente Carlos...
cd /d "%~dp0backend"
node scripts\verify-carlos-qr.js
pause
