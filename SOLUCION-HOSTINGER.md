# 🔧 Solución: "Framework No Compatible" en Hostinger

## ⚠️ Problema

Hostinger dice: **"El marco no es compatible o la estructura de proyecto no es válida"**

## 🔍 Diagnóstico

Esto ocurre porque:
1. **Hosting Compartido de Hostinger NO soporta Node.js** directamente
2. O la estructura del proyecto no es la que Hostinger espera

## ✅ Soluciones

### Opción 1: Verificar Tipo de Hosting (RECOMENDADO)

1. **Accede al Panel de Hostinger**
2. **Ve a "Node.js" o "Aplicaciones"**
3. **Si NO aparece la opción Node.js:**
   - Tu plan NO soporta Node.js
   - Necesitas **VPS** o usar otra plataforma

### Opción 2: Usar VPS de Hostinger

Si tienes o puedes contratar un VPS:

**Pasos:**
1. Conecta por SSH
2. Instala Node.js 18+
3. Sube el proyecto
4. Instala dependencias: `cd backend && npm install`
5. Configura `.env` en `backend/`
6. Inicializa DB: `cd backend && npm run init`
7. Usa PM2: `pm2 start backend/src/server.js`

**Ver guía completa:** `GUIA-HOSTINGER-SIMPLE.md`

### Opción 3: Usar Plataforma Alternativa (MÁS FÁCIL)

Si Hostinger compartido no funciona, usa estas plataformas que son **más fáciles** para Node.js:

#### 🚂 Railway (Recomendado - Gratis para empezar)

1. Ve a: https://railway.app
2. Crea cuenta (con GitHub)
3. Click "New Project" → "Deploy from GitHub repo"
4. Selecciona tu repositorio: `Sistema-Fidelizacion-Kuro`
5. Railway detecta automáticamente Node.js
6. Agrega variables de entorno en "Variables"
7. ¡Listo! Tu app estará en línea

**Variables de entorno en Railway:**
```
NODE_ENV=production
PORT=3000
APP_BASE_URL=https://tu-app.railway.app
JWT_SECRET_CUSTOMER=tu-secret
JWT_SECRET_ADMIN=tu-secret
VAPID_PUBLIC_KEY=tu-key
VAPID_PRIVATE_KEY=tu-key
VAPID_SUBJECT=mailto:admin@tudominio.com
KURO_LAT=-12.0464
KURO_LNG=-77.0428
```

#### 🎨 Render (Gratis con limitaciones)

1. Ve a: https://render.com
2. Crea cuenta
3. "New" → "Web Service"
4. Conecta tu repositorio de GitHub
5. Configuración:
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && node src/server.js`
6. Agrega variables de entorno
7. Deploy

#### ☁️ Heroku

1. Ve a: https://heroku.com
2. Crea cuenta
3. Instala Heroku CLI
4. Ejecuta:
   ```bash
   heroku login
   heroku create tu-app-name
   git push heroku main
   ```

## 📋 Archivos Creados para Hostinger

He creado estos archivos para que Hostinger detecte Node.js:

✅ **`package.json`** (raíz) - Configuración principal
✅ **`Procfile`** - Para Heroku/Railway
✅ **`app.json`** - Metadatos
✅ **`.nvmrc`** - Versión de Node.js
✅ **`hostinger.json`** - Configuración específica

## 🔧 Si Hostinger SÍ Soporta Node.js

Si tu plan SÍ tiene Node.js, configura así:

1. **En el Panel de Hostinger:**
   - Ve a "Node.js" o "Aplicaciones"
   - Crea nueva aplicación
   - **Ruta de inicio**: `backend/src/server.js`
   - **Versión Node.js**: 18.x
   - **Puerto**: Dejar en blanco (auto)

2. **Variables de entorno:**
   Agrega todas las variables necesarias en el panel

3. **Instalar dependencias:**
   - Por SSH: `cd backend && npm install`
   - O espera a que Hostinger lo haga automáticamente

4. **Inicializar base de datos:**
   ```bash
   cd backend
   npm run init
   node scripts/create-admin.js admin tu-password
   ```

## 🎯 Recomendación Final

**Si Hostinger compartido no funciona:**
→ Usa **Railway** o **Render** (más fácil y gratis para empezar)

**Si tienes VPS de Hostinger:**
→ Sigue `GUIA-HOSTINGER-SIMPLE.md`

**Si necesitas ayuda:**
→ Contacta soporte de Hostinger y pregunta:
   - "¿Mi plan soporta Node.js?"
   - "¿Necesito VPS para Node.js?"
   - "¿Cómo configuro una app Node.js + Express?"

---

**Nota:** La mayoría de hosting compartido NO soporta Node.js. Para Node.js necesitas VPS o usar plataformas como Railway/Render que están diseñadas para esto.
