@echo off
chcp 65001 >nul
echo Ejecutando migracion de tokens QR...
cd /d "%~dp0backend"
if exist "scripts\migrate-add-qr-tokens.js" (
    node scripts\migrate-add-qr-tokens.js
) else (
    echo Error: No se encontro el script de migracion
    pause
    exit /b 1
)
pause
