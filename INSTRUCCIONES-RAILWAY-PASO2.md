# 📋 Paso 2 y 3: Configurar Railway

## ✅ Paso 1 Completado

Los archivos de configuración ya están en GitHub:
- ✅ `railway.json`
- ✅ `nixpacks.toml`
- ✅ `package.json` (actualizado)

## 🔧 Paso 2: Configurar Railway

### Instrucciones Detalladas:

1. **Abre Railway:**
   - Ve a: https://railway.app
   - Inicia sesión
   - Selecciona tu proyecto: `Sistema-Fidelizacion-Kuro`

2. **Ve a Settings:**
   - Click en tu proyecto
   - Click en **"Settings"** (Configuración)
   - O busca el ícono de engranaje ⚙️

3. **Ve a Build & Deploy:**
   - En el menú lateral, busca **"Build & Deploy"**
   - O busca **"Deploy"** o **"Build"**

4. **Configura los Comandos:**

   **Build Command:**
   ```
   cd backend && npm install --omit=dev
   ```
   
   **Start Command:**
   ```
   cd backend && node src/server.js
   ```
   
   **Root Directory:**
   ```
   / (dejar por defecto - raíz)
   ```

5. **Guarda los Cambios:**
   - Click en **"Save"** o **"Update"**
   - Railway guardará la configuración

## 🚀 Paso 3: Redeploy

1. **Ve a Deployments:**
   - Click en **"Deployments"** en el menú lateral
   - O busca la pestaña **"Deployments"**

2. **Redeploy:**
   - Click en el botón **"Redeploy"** o **"Deploy"**
   - O click en los tres puntos (...) del último deployment → **"Redeploy"**

3. **Espera el Build:**
   - Railway comenzará a construir tu aplicación
   - Verás los logs en tiempo real
   - Debería tomar 2-5 minutos

4. **Verifica los Logs:**
   - Deberías ver: `cd backend && npm install --omit=dev`
   - Deberías ver: `npm install` ejecutándose
   - Deberías ver: `node_modules` creado
   - Al final: `Server running successfully!`

## ✅ Verificación Final

Después del redeploy, verifica:

1. **Health Check:**
   ```
   https://tu-app.railway.app/health
   ```
   Debe responder: `{"status":"ok","timestamp":"..."}`

2. **Frontend:**
   ```
   https://tu-app.railway.app/
   ```
   Debe cargar `index.html`

3. **API:**
   ```
   https://tu-app.railway.app/api/promotions
   ```
   Debe responder con JSON

## 🐛 Si Sigue Fallando

### Opción A: Limpiar Cache

1. Settings → **Danger Zone**
2. Click en **"Clear Build Cache"**
3. Redeploy

### Opción B: Verificar Configuración

Asegúrate de que:
- ✅ Build Command sea exactamente: `cd backend && npm install --omit=dev`
- ✅ Start Command sea exactamente: `cd backend && node src/server.js`
- ✅ No haya espacios extra al inicio/final
- ✅ Root Directory esté en `/` (raíz)

### Opción C: Usar Nixpacks Manualmente

1. Settings → Build & Deploy
2. Busca **"Builder"** o **"Buildpack"**
3. Selecciona **"Nixpacks"**
4. Railway usará `nixpacks.toml` automáticamente

## 📸 Capturas de Pantalla (Referencia)

**Build Command:**
```
cd backend && npm install --omit=dev
```

**Start Command:**
```
cd backend && node src/server.js
```

---

**¡Listo!** Después de configurar y redeploy, tu aplicación debería funcionar correctamente.
