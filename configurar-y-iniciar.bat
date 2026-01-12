@echo off
chcp 65001 >nul
echo ========================================
echo Configurando e iniciando el proyecto...
echo ========================================
echo.

echo [1/3] Ejecutando migracion de base de datos...
cd backend
node scripts\migrate-add-push-fields.js
if errorlevel 1 (
    echo ERROR: La migracion fallo
    pause
    exit /b 1
)
echo.

echo [2/3] Verificando archivo .env...
if not exist .env (
    echo Creando archivo .env...
    (
        echo JWT_SECRET_CUSTOMER=supersecretcustomer
        echo JWT_SECRET_ADMIN=supersecretadmin
        echo APP_BASE_URL=http://localhost:3000
        echo PORT=3000
        echo.
        echo # VAPID Keys - Ejecuta: npm run generate-vapid
        echo VAPID_PUBLIC_KEY=
        echo VAPID_PRIVATE_KEY=
        echo VAPID_SUBJECT=mailto:admin@kurosushifusion.com
        echo.
        echo # Coordenadas del local KURO
        echo KURO_LAT=-12.0464
        echo KURO_LNG=-77.0428
    ) > .env
    echo Archivo .env creado. Por favor agrega las VAPID keys.
) else (
    echo Archivo .env existe.
)
echo.

echo [3/3] Iniciando servidor...
echo.
echo ========================================
echo Servidor iniciando en http://localhost:3000
echo ========================================
echo.
node src\server.js
