# Script para configurar e iniciar el proyecto
$ErrorActionPreference = "Stop"

# Cambiar al directorio del proyecto
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Configurando e iniciando el proyecto..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Ejecutar migración
Write-Host "[1/3] Ejecutando migración de base de datos..." -ForegroundColor Yellow
Set-Location "backend"
node scripts\migrate-add-push-fields.js
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: La migración falló" -ForegroundColor Red
    pause
    exit 1
}
Write-Host ""

# 2. Verificar .env
Write-Host "[2/3] Verificando archivo .env..." -ForegroundColor Yellow
if (-not (Test-Path ".env")) {
    Write-Host "Creando archivo .env..." -ForegroundColor Green
    @"
JWT_SECRET_CUSTOMER=supersecretcustomer
JWT_SECRET_ADMIN=supersecretadmin
APP_BASE_URL=http://localhost:3000
PORT=3000
VAPID_PUBLIC_KEY=BBLieZq7Bb_d-1zw3hiDInHWk57tpKLA95rLfvRShelSOaWd4dGJikBwKPS7e_WlAkmcxJXKoRnS0HmSRV65Nz4
VAPID_PRIVATE_KEY=nuS9N_gmo2lYjI9UuXhNP5MtCXaqUrtxoafbZfRhPu0
VAPID_SUBJECT=mailto:admin@kurosushifusion.com
KURO_LAT=-12.0464
KURO_LNG=-77.0428
"@ | Out-File -FilePath ".env" -Encoding utf8
    Write-Host "Archivo .env creado con las VAPID keys generadas." -ForegroundColor Green
} else {
    Write-Host "Archivo .env ya existe." -ForegroundColor Green
}
Write-Host ""

# 3. Iniciar servidor
Write-Host "[3/3] Iniciando servidor..." -ForegroundColor Yellow
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Servidor iniciando en http://localhost:3000" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
node src\server.js
