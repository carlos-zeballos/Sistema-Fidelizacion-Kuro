# Script para subir cambios a GitHub
# Ejecutar desde PowerShell en el directorio del proyecto

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Subiendo cambios de refactorizacion Railway + Hostinger" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Cambiar al directorio del script
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

Write-Host "[1/5] Verificando estado de Git..." -ForegroundColor Yellow
git status
Write-Host ""

Write-Host "[2/5] Agregando archivos modificados y nuevos..." -ForegroundColor Yellow
git add .
Write-Host ""

Write-Host "[3/5] Creando commit..." -ForegroundColor Yellow
git commit -m "Refactorizacion: Railway (backend) + Hostinger (frontend estatico)

- Frontend: Configurado API_BASE_URL para consumir backend de Railway
- Backend: Eliminado servir archivos estaticos, CORS para FRONTEND_URL
- Actualizado APP_BASE_URL a RAILWAY_PUBLIC_DOMAIN/BACKEND_URL
- Creado railway.json para despliegue en Railway
- Creado guias de despliegue Railway + Hostinger
- Todos los fetch actualizados para usar API_BASE_URL"
Write-Host ""

Write-Host "[4/5] Verificando remoto..." -ForegroundColor Yellow
git remote -v
Write-Host ""

Write-Host "[5/5] Subiendo a GitHub..." -ForegroundColor Yellow
git push origin main
Write-Host ""

Write-Host "========================================" -ForegroundColor Green
Write-Host "✅ Cambios subidos a GitHub" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
