# 🚀 Guía de Despliegue en Hostinger

## 📋 Configuración para Hostinger

Hostinger requiere una estructura específica para detectar aplicaciones Node.js. He creado los archivos necesarios.

## ✅ Archivos Creados para Hostinger

1. **`package.json` (raíz)** - Configuración principal del proyecto
2. **`Procfile`** - Para plataformas como Heroku (opcional)
3. **`app.json`** - Metadatos de la aplicación

## 🔧 Pasos para Desplegar en Hostinger

### Paso 1: Subir Archivos

1. **Opción A: FTP/SFTP**
   - Conecta a tu hosting de Hostinger
   - Sube TODOS los archivos del proyecto a la carpeta `public_html` o `htdocs`
   - Mantén la estructura de carpetas:
     ```
     public_html/
     ├── backend/
     ├── frontend/
     ├── database/
     ├── package.json
     └── .htaccess
     ```

2. **Opción B: Git (si Hostinger lo soporta)**
   - Conecta tu repositorio de GitHub
   - Hostinger clonará automáticamente

### Paso 2: Configurar Node.js en Hostinger

1. **Accede al Panel de Control de Hostinger**
   - Ve a "Node.js" o "Aplicaciones"
   - Crea una nueva aplicación Node.js

2. **Configuración de la Aplicación:**
   - **Versión de Node.js**: 18.x o superior
   - **Ruta de inicio**: `backend/src/server.js`
   - **Puerto**: Dejar en blanco (Hostinger lo asigna automáticamente)
   - **Directorio raíz**: `/` (raíz del proyecto)

3. **Variables de Entorno:**
   Agrega estas variables en el panel de Hostinger:
   ```
   NODE_ENV=production
   PORT=3000
   APP_BASE_URL=https://tudominio.com
   JWT_SECRET_CUSTOMER=tu-secret-customer
   JWT_SECRET_ADMIN=tu-secret-admin
   VAPID_PUBLIC_KEY=tu-vapid-public-key
   VAPID_PRIVATE_KEY=tu-vapid-private-key
   VAPID_SUBJECT=mailto:admin@tudominio.com
   KURO_LAT=-12.0464
   KURO_LNG=-77.0428
   ```

### Paso 3: Instalar Dependencias

Hostinger debería instalar automáticamente con `npm install`, pero si no:

1. Accede por SSH (si está disponible)
2. Ejecuta:
   ```bash
   cd backend
   npm install
   ```

### Paso 4: Inicializar Base de Datos

1. **Por SSH:**
   ```bash
   cd backend
   npm run init
   node scripts/create-admin.js admin tu-password-seguro
   ```

2. **O crea un script de inicialización** que Hostinger ejecute automáticamente

### Paso 5: Configurar Dominio

1. En el panel de Hostinger, apunta tu dominio a la aplicación Node.js
2. Asegúrate de que el SSL/HTTPS esté activado (obligatorio para push notifications)

## ⚠️ Problemas Comunes y Soluciones

### Error: "Framework no compatible"

**Solución:**
- Asegúrate de que `package.json` esté en la raíz del proyecto
- Verifica que tenga el campo `"main"` apuntando a `backend/src/server.js`
- Verifica que tenga el script `"start"`

### Error: "No se encuentra el módulo"

**Solución:**
- Verifica que las dependencias estén instaladas en `backend/node_modules`
- Ejecuta `npm install` en la carpeta `backend`

### Error: "Puerto no disponible"

**Solución:**
- Hostinger asigna el puerto automáticamente
- Usa `process.env.PORT` (ya está configurado en el código)

### Base de Datos no funciona

**Solución:**
- Verifica permisos de escritura en la carpeta `database/`
- Asegúrate de que la ruta `database/loyalty.db` sea accesible
- Verifica que SQLite esté disponible en el servidor

## 📝 Estructura Requerida en Hostinger

```
public_html/ (o htdocs/)
├── package.json          ← Debe estar aquí
├── .htaccess            ← Para redirecciones (opcional)
├── backend/
│   ├── src/
│   │   └── server.js    ← Punto de entrada
│   ├── package.json
│   └── node_modules/
├── frontend/
│   └── public/
└── database/
    └── schema.sql
```

## 🔍 Verificación Post-Despliegue

1. **Health Check:**
   ```
   https://tudominio.com/health
   ```
   Debe responder: `{"status":"ok","timestamp":"..."}`

2. **Frontend:**
   ```
   https://tudominio.com/
   ```
   Debe cargar `index.html`

3. **API:**
   ```
   https://tudominio.com/api/promotions
   ```
   Debe responder con JSON

## 🆘 Si Hostinger No Detecta Node.js

Si Hostinger sigue sin detectar la aplicación:

1. **Verifica el package.json en la raíz:**
   ```json
   {
     "name": "sistema-fidelizacion-kuro",
     "main": "backend/src/server.js",
     "scripts": {
       "start": "cd backend && node src/server.js"
     }
   }
   ```

2. **Contacta con Soporte de Hostinger:**
   - Indica que es una aplicación Node.js + Express
   - Punto de entrada: `backend/src/server.js`
   - Versión de Node.js requerida: 18+

## 📞 Alternativa: Usar VPS de Hostinger

Si el hosting compartido no funciona:

1. **Contrata un VPS de Hostinger**
2. **Sigue la guía de producción** (`GUIA-PRODUCCION.md`)
3. **Usa PM2** para gestionar el proceso
4. **Configura Nginx** como reverse proxy

---

**Nota:** Algunos planes de Hostinger pueden no soportar Node.js directamente. En ese caso, considera:
- VPS de Hostinger
- Otras plataformas: Heroku, Railway, Render, Vercel, etc.
