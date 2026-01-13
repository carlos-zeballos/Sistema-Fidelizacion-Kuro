# Resumen de Cambios - Refactorización Railway + Hostinger

## ✅ Cambios Completados

### 1. Frontend - Configuración de API

**Archivos modificados:**
- `frontend/public/js/config.js` (NUEVO)
  - Exporta `API_BASE_URL` configurable
  - Helper `apiUrl()` para construir URLs

- `frontend/public/js/auth.js`
  - Importa `API_BASE_URL` desde `config.js`
  - `authenticatedFetch` usa `API_BASE_URL`

- `frontend/public/js/admin.js`
  - Importa `API_BASE_URL` desde `config.js`
  - Todas las funciones usan `API_BASE_URL`

- `frontend/public/js/customer.js`
  - Importa `apiUrl` desde `config.js`
  - `getVapidPublicKey` usa `apiUrl()`

**Archivos HTML actualizados:**
- `frontend/public/index.html`
  - Agregado `window.API_BASE_URL` y función `apiUrl()`
  - `fetch('/api/...')` → `fetch(apiUrl('/api/...'))`

- `frontend/public/register.html`
  - Agregado `window.API_BASE_URL` y función `apiUrl()`
  - `fetch('/api/customers/register')` → `fetch(apiUrl('/api/customers/register'))`

- `frontend/public/dashboard.html`
  - Agregado `window.API_BASE_URL` y función `apiUrl()`
  - Todos los `fetch('/api/...')` actualizados

- `frontend/public/admin-login.html`
  - Agregado `window.API_BASE_URL` y función `apiUrl()`
  - `fetch('/api/admin/login')` → `fetch(apiUrl('/api/admin/login'))`

- `frontend/public/recover.html`
  - Agregado `window.API_BASE_URL` y función `apiUrl()`
  - `fetch('/api/auth/...')` → `fetch(apiUrl('/api/auth/...'))`

### 2. Backend - Configuración para Railway

**Archivos modificados:**
- `backend/src/server.js`
  - ❌ **ELIMINADO:** Servir archivos estáticos (`app.use(express.static(...))`)
  - ✅ **ACTUALIZADO:** CORS para permitir `FRONTEND_URL` (Hostinger)
  - ✅ **ACTUALIZADO:** Logs muestran `FRONTEND_URL` y `RAILWAY_PUBLIC_DOMAIN`
  - ✅ **MANTENIDO:** Health check en `/health`

- `backend/src/config/database.js`
  - ✅ **ACTUALIZADO:** Comentarios para Railway (no Hostinger)
  - ✅ **MANTENIDO:** Rutas absolutas con `process.cwd()`

- `backend/src/routes/customer.js`
  - ✅ **ACTUALIZADO:** `APP_BASE_URL` → `RAILWAY_PUBLIC_DOMAIN` o `BACKEND_URL`
  - QR URLs usan dominio del backend (Railway)

- `backend/src/routes/qr.js`
  - ✅ **ACTUALIZADO:** `APP_BASE_URL` → `RAILWAY_PUBLIC_DOMAIN` o `BACKEND_URL`

- `backend/src/routes/public.js`
  - ✅ **ACTUALIZADO:** `APP_BASE_URL` → `FRONTEND_URL` (para register URL)

### 3. Configuración de Despliegue

**Archivos creados:**
- `railway.json`
  - Configuración de build y deploy para Railway
  - Build command: `cd backend && npm install --omit=dev`
  - Start command: `cd backend && node src/server.js`

- `DESPLIEGUE-RAILWAY-HOSTINGER.md`
  - Guía completa paso a paso
  - Variables de entorno necesarias
  - Solución de problemas

### 4. Estructura Final

```
/
├── backend/
│   ├── src/
│   │   ├── server.js          ← NO sirve estáticos, CORS para FRONTEND_URL
│   │   ├── config/
│   │   │   └── database.js    ← Rutas absolutas para Railway
│   │   └── routes/            ← URLs usan RAILWAY_PUBLIC_DOMAIN
│   ├── database/
│   │   ├── loyalty.db
│   │   └── schema.sql
│   ├── scripts/
│   └── package.json
│
├── frontend/
│   └── public/
│       ├── index.html         ← Usa API_BASE_URL
│       ├── register.html      ← Usa API_BASE_URL
│       ├── dashboard.html     ← Usa API_BASE_URL
│       ├── admin-*.html       ← Usa API_BASE_URL
│       └── js/
│           ├── config.js      ← NUEVO: API_BASE_URL
│           ├── auth.js        ← Importa API_BASE_URL
│           ├── customer.js    ← Importa apiUrl
│           └── admin.js       ← Importa API_BASE_URL
│
├── railway.json               ← NUEVO: Config Railway
└── DESPLIEGUE-RAILWAY-HOSTINGER.md  ← NUEVO: Guía
```

## 🔄 Variables de Entorno

### Railway (Backend)
```env
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://kurosushifusion.com
BACKEND_URL=https://tu-proyecto.railway.app
RAILWAY_PUBLIC_DOMAIN=tu-proyecto.railway.app (automático)
JWT_SECRET_CUSTOMER=...
JWT_SECRET_ADMIN=...
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:admin@kurosushifusion.com
KURO_LAT=-12.0464
KURO_LNG=-77.0428
```

### Hostinger (Frontend)
No requiere variables de entorno. Solo actualiza:
```javascript
window.API_BASE_URL = 'https://tu-proyecto.railway.app';
```
en cada HTML o en `config.js`.

## 📝 Notas Importantes

1. **`backend/public/` NO se eliminó automáticamente** - Puedes eliminarlo manualmente si quieres, pero no afecta el funcionamiento.

2. **QR Codes:** Los QR apuntan al backend (Railway) porque las landing pages `/c/:token` están en el backend.

3. **Register QR:** El QR de registro apunta al frontend (Hostinger) porque es una página estática.

4. **CORS:** El backend permite requests desde `FRONTEND_URL` y localhost (desarrollo).

5. **Base de Datos:** SQLite funciona en Railway, pero considera usar un volumen para persistencia o migrar a PostgreSQL.

## ✅ Checklist de Validación

- [x] Frontend usa `API_BASE_URL` en todos los fetch
- [x] Backend NO sirve archivos estáticos
- [x] Backend CORS permite `FRONTEND_URL`
- [x] QR URLs usan dominio del backend
- [x] Register URL usa dominio del frontend
- [x] Railway.json configurado
- [x] Guía de despliegue creada

## 🚀 Próximos Pasos

1. **Desplegar en Railway:**
   - Conectar GitHub
   - Configurar variables de entorno
   - Verificar health check

2. **Desplegar en Hostinger:**
   - Subir `frontend/public/` a `public_html/`
   - Configurar `API_BASE_URL` en cada HTML

3. **Probar:**
   - Registro de cliente
   - Login de cliente
   - Dashboard
   - Admin login
   - Admin scan
