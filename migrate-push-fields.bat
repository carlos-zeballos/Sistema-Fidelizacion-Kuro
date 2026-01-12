@echo off
chcp 65001 >nul
echo Ejecutando migracion de campos push...
cd /d "%~dp0backend"
node scripts\migrate-add-push-fields.js
pause
