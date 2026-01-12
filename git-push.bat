@echo off
chcp 65001 >nul
cd /d "%~dp0"
git init
git remote remove origin 2>nul
git remote add origin https://github.com/carlos-zeballos/Sistema-Fidelizacion-Kuro.git
git add .
git commit -m "Initial commit: Sistema de Fidelizacion KURO MVP completo"
git branch -M main
git push -u origin main
pause
