@echo off
chcp 65001 >nul
echo ========================================
echo Subiendo cambios de refactorizacion Railway + Hostinger
echo ========================================
echo.

cd /d "%~dp0"

echo [1/5] Verificando estado de Git...
git status
echo.

echo [2/5] Agregando archivos modificados y nuevos...
git add .
echo.

echo [3/5] Creando commit...
git commit -m "Refactorizacion: Railway (backend) + Hostinger (frontend estatico) - Frontend: Configurado API_BASE_URL - Backend: Eliminado servir estaticos, CORS para FRONTEND_URL - Actualizado URLs a RAILWAY_PUBLIC_DOMAIN - Creado railway.json y guias de despliegue"
echo.

echo [4/5] Verificando remoto...
git remote -v
echo.

echo [5/5] Subiendo a GitHub...
git push origin main
echo.

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo ✅ Cambios subidos exitosamente!
    echo ========================================
    echo.
) else (
    echo.
    echo ========================================
    echo ❌ Error al subir cambios
    echo ========================================
    echo.
    echo Verifica:
    echo   1. Que tengas acceso al repositorio
    echo   2. Que hayas configurado tus credenciales de Git
    echo   3. Que el repositorio exista en GitHub
    echo.
)

pause
