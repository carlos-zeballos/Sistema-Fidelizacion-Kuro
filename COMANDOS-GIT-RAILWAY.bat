@echo off
chcp 65001 >nul
echo ========================================
echo Subiendo configuracion de Railway a GitHub
echo ========================================
echo.

cd /d "%~dp0"

echo [1/5] Verificando estado de Git...
git status --short
echo.

echo [2/5] Agregando archivos nuevos...
git add railway.json
git add nixpacks.toml
git add package.json
git add SOLUCION-RAILWAY.md
git add COMANDOS-GIT-RAILWAY.bat
echo.

echo [3/5] Verificando archivos agregados...
git status --short
echo.

echo [4/5] Creando commit...
git commit -m "Fix Railway deployment: add build config and fix dependencies installation"
if %errorlevel% neq 0 (
    echo.
    echo ⚠️  Error: No se pudo crear el commit
    echo    Posiblemente no hay cambios nuevos o ya existe el commit
    echo.
    pause
    exit /b 1
)
echo.

echo [5/5] Subiendo a GitHub...
git branch -M main 2>nul
git push -u origin main
if %errorlevel% neq 0 (
    echo.
    echo ⚠️  Error al subir. Verifica:
    echo    1. Que tengas conexion a internet
    echo    2. Que tengas permisos en el repositorio
    echo    3. Que el repositorio remoto este configurado
    echo.
    pause
    exit /b 1
)
echo.

echo ========================================
echo ✅ Cambios subidos a GitHub exitosamente
echo ========================================
echo.
echo 📋 PRÓXIMOS PASOS EN RAILWAY:
echo.
echo 1. Ve a tu proyecto en Railway
echo 2. Settings → Build & Deploy
echo 3. Configura:
echo    - Build Command: cd backend && npm install --omit=dev
echo    - Start Command: cd backend && node src/server.js
echo 4. Click en "Redeploy" o "Deploy"
echo.
pause
