@echo off
chcp 65001 >nul
echo ========================================
echo Creando archivo .env para backend
echo ========================================
echo.

cd /d "%~dp0backend"

if exist .env (
    echo El archivo .env ya existe.
    echo ¿Deseas sobrescribirlo? (S/N)
    set /p overwrite=
    if /i not "%overwrite%"=="S" (
        echo Operacion cancelada.
        pause
        exit /b 0
    )
)

(
    echo # JWT Secrets
    echo JWT_SECRET_CUSTOMER=supersecretcustomer
    echo JWT_SECRET_ADMIN=supersecretadmin
    echo.
    echo # Server Configuration
    echo APP_BASE_URL=http://localhost:3000
    echo PORT=3000
    echo NODE_ENV=development
    echo.
    echo # VAPID Keys for Push Notifications
    echo VAPID_PUBLIC_KEY=BBLieZq7Bb_d-1zw3hiDInHWk57tpKLA95rLfvRShelSOaWd4dGJikBwKPS7e_WlAkmcxJXKoRnS0HmSRV65Nz4
    echo VAPID_PRIVATE_KEY=nuS9N_gmo2lYjI9UuXhNP5MtCXaqUrtxoafbZfRhPu0
    echo VAPID_SUBJECT=mailto:admin@kurosushifusion.com
    echo.
    echo # KURO Restaurant Location ^(Latitude, Longitude^)
    echo KURO_LAT=-12.0464
    echo KURO_LNG=-77.0428
    echo.
    echo # SQLite Database ^(automatically configured - no DATABASE_URL needed^)
    echo # Database path: database/loyalty.db ^(relative to project root^)
    echo.
    echo # SMTP Configuration ^(Optional - for email notifications^)
    echo # SMTP_HOST=smtp.gmail.com
    echo # SMTP_PORT=587
    echo # SMTP_USER=your-email@gmail.com
    echo # SMTP_PASS=your-app-password
) > .env

echo.
echo ✅ Archivo .env creado exitosamente en:
echo    %CD%\.env
echo.
echo Contenido del archivo:
echo ----------------------------------------
type .env
echo ----------------------------------------
echo.
echo ✅ Configuracion completada!
echo.
pause
