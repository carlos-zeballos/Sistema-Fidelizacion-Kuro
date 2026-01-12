# Script para subir proyecto a GitHub
$ErrorActionPreference = "Stop"

# Cambiar al directorio del script
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Subiendo proyecto a GitHub" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/6] Verificando Git..." -ForegroundColor Yellow
if (-not (Test-Path .git)) {
    Write-Host "Inicializando repositorio Git..." -ForegroundColor Green
    git init
} else {
    Write-Host "Git ya inicializado" -ForegroundColor Green
}
Write-Host ""

Write-Host "[2/6] Configurando remote..." -ForegroundColor Yellow
git remote remove origin 2>$null
git remote add origin https://github.com/carlos-zeballos/Sistema-Fidelizacion-Kuro.git
git remote -v
Write-Host ""

Write-Host "[3/6] Agregando archivos..." -ForegroundColor Yellow
git add .
Write-Host ""

Write-Host "[4/6] Creando commit..." -ForegroundColor Yellow
git commit -m "Initial commit: Sistema de Fidelizacion KURO MVP completo"
Write-Host ""

Write-Host "[5/6] Configurando rama main..." -ForegroundColor Yellow
git branch -M main
Write-Host ""

Write-Host "[6/6] Subiendo a GitHub..." -ForegroundColor Yellow
git push -u origin main
Write-Host ""

if ($LASTEXITCODE -eq 0) {
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "✅ Proyecto subido exitosamente!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Repositorio: https://github.com/carlos-zeballos/Sistema-Fidelizacion-Kuro" -ForegroundColor Cyan
    Write-Host ""
} else {
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "❌ Error al subir el proyecto" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Verifica:" -ForegroundColor Yellow
    Write-Host "  1. Que tengas acceso al repositorio" -ForegroundColor Yellow
    Write-Host "  2. Que hayas configurado tus credenciales de Git" -ForegroundColor Yellow
    Write-Host "  3. Que el repositorio exista en GitHub" -ForegroundColor Yellow
    Write-Host ""
}
