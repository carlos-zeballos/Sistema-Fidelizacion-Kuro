# Script de migración para generar tokens QR
$scriptPath = Join-Path $PSScriptRoot "backend\scripts\migrate-add-qr-tokens.js"
Set-Location $PSScriptRoot
node $scriptPath
