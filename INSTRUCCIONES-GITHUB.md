# 📤 Instrucciones para Subir el Proyecto a GitHub

## Opción 1: Usar el Script Automático (Recomendado)

Ejecuta el archivo `subir-github.bat` desde el explorador de Windows o desde la terminal:

```bash
subir-github.bat
```

## Opción 2: Comandos Manuales

Abre una terminal (CMD o PowerShell) en el directorio del proyecto y ejecuta:

```bash
# 1. Navegar al directorio del proyecto
cd "C:\PROYECTOS ZEBWARE\SISTEMA DE FIDELIZACIÓN KURO"

# 2. Inicializar Git (si no está inicializado)
git init

# 3. Agregar remote
git remote add origin https://github.com/carlos-zeballos/Sistema-Fidelizacion-Kuro.git

# 4. Agregar todos los archivos
git add .

# 5. Crear commit inicial
git commit -m "Initial commit: Sistema de Fidelizacion KURO MVP completo"

# 6. Cambiar a rama main
git branch -M main

# 7. Subir a GitHub
git push -u origin main
```

## ⚠️ Importante: Verificar antes de subir

Asegúrate de que estos archivos NO se suban (deben estar en `.gitignore`):
- ✅ `backend/.env` (archivo de configuración con secrets)
- ✅ `database/loyalty.db` (base de datos con datos)
- ✅ `backend/node_modules/` (dependencias)
- ✅ `*.log` (archivos de log)

## 🔐 Si te pide credenciales

Si GitHub te pide usuario y contraseña:

1. **Token de Acceso Personal (Recomendado)**:
   - Ve a GitHub → Settings → Developer settings → Personal access tokens
   - Crea un token con permisos `repo`
   - Usa el token como contraseña

2. **O configura SSH**:
   ```bash
   git remote set-url origin git@github.com:carlos-zeballos/Sistema-Fidelizacion-Kuro.git
   ```

## ✅ Verificación

Después de subir, verifica en:
https://github.com/carlos-zeballos/Sistema-Fidelizacion-Kuro

Deberías ver todos los archivos del proyecto (excepto los ignorados).
