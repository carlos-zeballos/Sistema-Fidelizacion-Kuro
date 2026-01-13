# Guía de Despliegue en Hostinger Business Web Hosting

## ✅ Checklist de Preparación

### 1. Estructura del Proyecto
- ✅ Frontend movido a `backend/public/`
- ✅ `server.js` configurado para servir estáticos desde `backend/public/`
- ✅ `database.js` usa rutas absolutas con `process.cwd()`
- ✅ `init-db.js` usa `SCHEMA_PATH` unificado
- ✅ `create-admin.js` usa `DB_PATH` unificado

### 2. Archivos Requeridos en Hostinger

```
backend/
  src/
    server.js              ← Startup file
    config/
      database.js
    routes/
    utils/
      init-db.js
  public/                  ← Frontend (HTML, JS, manifest, service-worker)
  database/
    loyalty.db             ← Se crea automáticamente si no existe
    schema.sql             ← Schema SQLite
  scripts/
    create-admin.js
  package.json
```

## 📋 Pasos de Despliegue en Hostinger

### Paso 1: Subir Archivos

1. **Conecta por FTP o File Manager** a tu hosting Hostinger
2. **Navega a la carpeta de tu dominio** (ej: `public_html` o `domains/kurosushifusion.com/public_html`)
3. **Sube TODO el contenido de `backend/`** a la raíz del dominio o a una subcarpeta (ej: `nodeapp/backend/`)

**Estructura en Hostinger:**
```
public_html/
  backend/              ← Todo el contenido de backend/
    src/
    public/
    database/
    scripts/
    package.json
```

### Paso 2: Crear Aplicación Node.js en hPanel

1. **Ve a hPanel** → **Websites** → **kurosushifusion.com** → **Gestionar**
2. **Busca "Node.js" o "Web Apps"** en el menú
3. **Crea una nueva aplicación Node.js:**
   - **Application Root:** `backend/` (o `nodeapp/backend/` si usaste subcarpeta)
   - **Startup File:** `src/server.js`
   - **Node.js Version:** 18.x o 20.x (recomendado 18)
   - **Port:** Dejar el que asigne Hostinger (se usa `process.env.PORT`)

### Paso 3: Configurar Variables de Entorno

En la sección **Environment Variables** de la aplicación Node.js, agrega:

```env
NODE_ENV=production
PORT=3000
APP_BASE_URL=https://kurosushifusion.com
JWT_SECRET_CUSTOMER=tu-secret-customer-muy-seguro-y-largo
JWT_SECRET_ADMIN=tu-secret-admin-muy-seguro-y-largo
VAPID_PUBLIC_KEY=tu-vapid-public-key-base64
VAPID_PRIVATE_KEY=tu-vapid-private-key-base64
VAPID_SUBJECT=mailto:admin@kurosushifusion.com
KURO_LAT=-12.0464
KURO_LNG=-77.0428
```

**⚠️ IMPORTANTE:**
- Genera `JWT_SECRET_CUSTOMER` y `JWT_SECRET_ADMIN` con valores aleatorios y seguros (mínimo 32 caracteres)
- Para VAPID keys, ejecuta en local: `npm run generate-vapid-keys` y copia las keys generadas
- `APP_BASE_URL` debe ser tu dominio real con HTTPS

### Paso 4: Instalar Dependencias

En hPanel, busca la opción **"Terminal"** o **"SSH"** y ejecuta:

```bash
cd backend
npm install --omit=dev
```

O si Hostinger tiene un botón "Install Dependencies", úsalo.

### Paso 5: Inicializar Base de Datos

En la terminal SSH o desde hPanel:

```bash
cd backend
node src/utils/init-db.js
```

Esto creará `database/loyalty.db` y ejecutará el schema.

### Paso 6: Crear Usuario Admin

```bash
cd backend
node scripts/create-admin.js admin tu-password-seguro
```

Reemplaza `admin` y `tu-password-seguro` con tus credenciales.

### Paso 7: Iniciar la Aplicación

1. En hPanel, ve a la configuración de tu aplicación Node.js
2. **Haz clic en "Start" o "Deploy"**
3. Espera a que la aplicación inicie (puede tardar 1-2 minutos)

### Paso 8: Verificar Funcionamiento

1. **Health Check:**
   ```
   https://kurosushifusion.com/health
   ```
   Debe devolver: `{"status":"ok","timestamp":"..."}`

2. **Página Principal:**
   ```
   https://kurosushifusion.com/
   ```
   Debe cargar `index.html`

3. **Dashboard Admin:**
   ```
   https://kurosushifusion.com/admin-login.html
   ```
   Debe permitir login con las credenciales creadas

4. **Registro de Cliente:**
   ```
   https://kurosushifusion.com/register.html
   ```
   Debe permitir crear un nuevo cliente

## 🔧 Solución de Problemas

### Error: "Cannot find module 'express'"
**Solución:** Asegúrate de ejecutar `npm install --omit=dev` en la carpeta `backend/`

### Error: "no such table: customers"
**Solución:** Ejecuta `node src/utils/init-db.js` para inicializar la base de datos

### Error: "EACCES: permission denied" al crear base de datos
**Solución:** Verifica permisos de escritura en `backend/database/`. Puede requerir crear la carpeta manualmente con permisos 755

### Error: CORS bloqueando requests
**Solución:** Verifica que `APP_BASE_URL` esté configurado correctamente (con `https://` y sin barra final)

### Error: Service Worker no se registra
**Solución:** Asegúrate de que `manifest.json` y `service-worker.js` estén en `backend/public/` y sean accesibles desde la raíz

### La aplicación no inicia
**Solución:**
1. Revisa los logs en hPanel → Node.js → Logs
2. Verifica que todas las variables de entorno estén configuradas
3. Verifica que `PORT` esté siendo usado (el servidor debe escuchar en `process.env.PORT`)

## 📝 Notas Importantes

1. **HTTPS es obligatorio** para:
   - Service Workers
   - Push Notifications
   - Geolocation API
   - Camera API (en móviles)

2. **Base de Datos SQLite:**
   - Se crea automáticamente en `backend/database/loyalty.db`
   - Asegúrate de tener permisos de escritura
   - Realiza backups periódicos

3. **Rutas:**
   - Frontend: `/index.html`, `/dashboard.html`, etc.
   - API: `/api/customers/*`, `/api/admin/*`, etc.
   - QR: `/c/:token` (landing pages de QR)

4. **PWA:**
   - `manifest.json` debe estar en `/manifest.json`
   - `service-worker.js` debe estar en `/service-worker.js`
   - Ambos deben ser accesibles desde la raíz del dominio

## ✅ Validación Final

Después del despliegue, verifica:

- [ ] `GET /health` devuelve `{"status":"ok"}`
- [ ] `GET /index.html` carga correctamente
- [ ] Registro crea cliente y genera `qr_token`
- [ ] Dashboard muestra QR y puntos
- [ ] Admin login funciona
- [ ] Admin scan suma punto
- [ ] Promociones creadas por admin se ven en cliente
- [ ] Push subscribe funciona bajo HTTPS (si el navegador soporta)

## 🎉 ¡Listo!

Tu sistema de fidelización está desplegado y funcionando en Hostinger.

Para actualizaciones futuras:
1. Sube los archivos modificados por FTP
2. Reinicia la aplicación Node.js desde hPanel
3. Verifica que todo funcione correctamente
