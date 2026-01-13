# Guía de Despliegue: Railway (Backend) + Hostinger (Frontend Estático)

## 📋 Resumen

- **Backend (Node.js + Express)**: Desplegado en Railway
- **Frontend (HTML/CSS/JS)**: Desplegado en Hostinger como sitio estático
- **Base de Datos**: SQLite en Railway (o PostgreSQL si prefieres persistencia)

## 🚀 Paso 1: Desplegar Backend en Railway

### 1.1 Preparar el Proyecto

1. **Conecta tu repositorio GitHub a Railway:**
   - Ve a [Railway.app](https://railway.app)
   - Crea un nuevo proyecto
   - Selecciona "Deploy from GitHub repo"
   - Elige tu repositorio

2. **Railway detectará automáticamente:**
   - `railway.json` (configuración de build)
   - `backend/package.json` (dependencias)

### 1.2 Configurar Variables de Entorno en Railway

En Railway → Variables, agrega:

```env
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://kurosushifusion.com
BACKEND_URL=https://tu-proyecto.railway.app
JWT_SECRET_CUSTOMER=tu-secret-customer-muy-seguro-y-largo-minimo-32-caracteres
JWT_SECRET_ADMIN=tu-secret-admin-muy-seguro-y-largo-minimo-32-caracteres
VAPID_PUBLIC_KEY=tu-vapid-public-key-base64
VAPID_PRIVATE_KEY=tu-vapid-private-key-base64
VAPID_SUBJECT=mailto:admin@kurosushifusion.com
KURO_LAT=-12.0464
KURO_LNG=-77.0428
```

**⚠️ IMPORTANTE:**
- `FRONTEND_URL`: URL de tu sitio en Hostinger (donde está el frontend)
- `BACKEND_URL`: URL que Railway te asigna (o tu dominio personalizado)
- `RAILWAY_PUBLIC_DOMAIN`: Railway lo asigna automáticamente, pero puedes usar `BACKEND_URL` si prefieres

### 1.3 Generar VAPID Keys (si no las tienes)

En local, ejecuta:
```bash
cd backend
npm run generate-vapid
```

Copia las keys generadas a Railway.

### 1.4 Inicializar Base de Datos

Railway ejecutará automáticamente el servidor. La base de datos se inicializa automáticamente al iniciar.

**Para crear el admin inicial:**
1. Conecta a Railway via SSH/Terminal
2. Ejecuta:
```bash
cd backend
node scripts/create-admin.js admin tu-password-seguro
```

### 1.5 Verificar Backend

1. **Health Check:**
   ```
   https://tu-proyecto.railway.app/health
   ```
   Debe devolver: `{"status":"ok","timestamp":"..."}`

2. **Verifica los logs en Railway** para confirmar que todo inició correctamente.

## 🌐 Paso 2: Desplegar Frontend en Hostinger

### 2.1 Preparar Frontend

1. **Actualiza `frontend/public/js/config.js` o agrega script en cada HTML:**

   Opción A: Editar `config.js`:
   ```javascript
   export const API_BASE_URL = 'https://tu-proyecto.railway.app';
   ```

   Opción B (Recomendado): Agrega esto ANTES de otros scripts en cada HTML:
   ```html
   <script>
     window.API_BASE_URL = 'https://tu-proyecto.railway.app';
   </script>
   ```

2. **O mejor aún, crea un archivo `config.html` que incluyas en todos:**

   Crea `frontend/public/config.html`:
   ```html
   <script>
     // API Configuration - Actualiza esta URL con tu backend de Railway
     window.API_BASE_URL = 'https://tu-proyecto.railway.app';
   </script>
   ```

   Y en cada HTML, agrega ANTES de otros scripts:
   ```html
   <script src="/config.html"></script>
   ```

   **O simplemente agrega el script inline en cada HTML** (más simple).

### 2.2 Subir a Hostinger

1. **Conecta por FTP o File Manager** a Hostinger
2. **Navega a `public_html`** (o la carpeta de tu dominio)
3. **Sube TODO el contenido de `frontend/public/`** a `public_html/`

**Estructura en Hostinger:**
```
public_html/
  index.html
  register.html
  dashboard.html
  admin-login.html
  admin-dashboard.html
  admin-*.html
  js/
    config.js
    auth.js
    customer.js
    admin.js
  manifest.json
  service-worker.js
```

### 2.3 Configurar API_BASE_URL en Producción

**Opción 1: Script inline en cada HTML (más simple)**

Agrega esto al inicio de cada HTML (después de `<head>`):

```html
<script>
  // API Configuration - Backend en Railway
  window.API_BASE_URL = 'https://tu-proyecto.railway.app';
</script>
```

**Opción 2: Archivo de configuración**

Crea `public_html/config.js`:
```javascript
window.API_BASE_URL = 'https://tu-proyecto.railway.app';
```

Y en cada HTML, agrega:
```html
<script src="/config.js"></script>
```

### 2.4 Verificar Frontend

1. **Abre tu sitio:** `https://kurosushifusion.com`
2. **Verifica que carga correctamente**
3. **Abre la consola del navegador (F12)**
4. **Intenta registrarte o hacer login**
5. **Verifica que las llamadas a la API van a Railway:**
   - En Network tab, deberías ver requests a `https://tu-proyecto.railway.app/api/...`

## 🔧 Paso 3: Configurar CORS

El backend ya está configurado para permitir el frontend. Solo asegúrate de que:

1. **`FRONTEND_URL` en Railway** sea exactamente `https://kurosushifusion.com` (sin barra final)
2. **Si tienes www**, agrega también `https://www.kurosushifusion.com` a CORS (ya está configurado automáticamente)

## 📊 Paso 4: Base de Datos

### SQLite en Railway

Railway permite SQLite, pero **NO es persistente** por defecto (se pierde al redeploy).

**Solución 1: Usar Volumen de Railway (Recomendado)**
1. En Railway → Settings → Volumes
2. Crea un volumen para `/app/backend/database`
3. La base de datos persistirá entre redeploys

**Solución 2: Migrar a PostgreSQL (Más robusto)**
1. En Railway → New → Database → PostgreSQL
2. Railway te dará `DATABASE_URL`
3. Actualiza `backend/src/config/database.js` para usar PostgreSQL
4. Ejecuta el schema SQL en PostgreSQL

## ✅ Checklist de Validación

- [ ] Backend responde en `/health`
- [ ] Frontend carga correctamente
- [ ] Registro de cliente funciona
- [ ] Login de cliente funciona
- [ ] Dashboard muestra QR y puntos
- [ ] Admin login funciona
- [ ] Admin scan suma puntos
- [ ] Promociones se ven en cliente
- [ ] Push notifications funcionan (si configuradas)
- [ ] CORS no bloquea requests

## 🐛 Solución de Problemas

### Error: CORS bloqueando requests
**Solución:** Verifica que `FRONTEND_URL` en Railway sea exactamente la URL de tu frontend (con `https://`)

### Error: 404 en `/api/...`
**Solución:** Verifica que `API_BASE_URL` en el frontend apunte a tu backend de Railway

### Error: Base de datos se pierde
**Solución:** Usa un volumen de Railway o migra a PostgreSQL

### Error: QR no se genera
**Solución:** Verifica que `BACKEND_URL` o `RAILWAY_PUBLIC_DOMAIN` esté configurado en Railway

## 📝 Notas Finales

1. **HTTPS es obligatorio** para:
   - Service Workers
   - Push Notifications
   - Geolocation API
   - Camera API (en móviles)

2. **Actualizaciones:**
   - **Backend:** Push a GitHub → Railway redeploya automáticamente
   - **Frontend:** Sube archivos nuevos por FTP a Hostinger

3. **Backups:**
   - Realiza backups periódicos de `database/loyalty.db` (si usas SQLite)
   - O configura backups automáticos si usas PostgreSQL

## 🎉 ¡Listo!

Tu sistema está desplegado:
- **Backend:** Railway (API REST)
- **Frontend:** Hostinger (Sitio estático)
- **Base de Datos:** SQLite en Railway (o PostgreSQL)
