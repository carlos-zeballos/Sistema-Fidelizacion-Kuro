@echo off
chcp 65001 >nul
echo ========================================
echo Subiendo proyecto a GitHub
echo ========================================
echo.

cd /d "%~dp0"

echo [1/5] Verificando Git...
if not exist .git (
    echo Inicializando repositorio Git...
    git init
) else (
    echo Git ya inicializado
)
echo.

echo [2/5] Configurando remote...
git remote remove origin 2>nul
git remote add origin https://github.com/carlos-zeballos/Sistema-Fidelizacion-Kuro.git
git remote -v
echo.

echo [3/5] Agregando archivos...
git add .
echo.

echo [4/5] Creando commit...
git commit -m "Initial commit: Sistema de Fidelizacion KURO MVP completo"
echo.

echo [5/5] Subiendo a GitHub...
git branch -M main
git push -u origin main
echo.

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo ✅ Proyecto subido exitosamente!
    echo ========================================
    echo.
    echo Repositorio: https://github.com/carlos-zeballos/Sistema-Fidelizacion-Kuro
    echo.
) else (
    echo.
    echo ========================================
    echo ❌ Error al subir el proyecto
    echo ========================================
    echo.
    echo Verifica:
    echo   1. Que tengas acceso al repositorio
    echo   2. Que hayas configurado tus credenciales de Git
    echo   3. Que el repositorio exista en GitHub
    echo.
)

pause
