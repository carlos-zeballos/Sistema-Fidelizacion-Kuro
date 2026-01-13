# 🚀 Guía Completa: Desplegar en Hostinger Business Web Hosting

## ✅ Confirmación

Tu plan **Business Web Hosting** de Hostinger **SÍ soporta Node.js** 🟢

## 📋 Paso a Paso: Configuración en Hostinger

### Paso 1: Acceder a Node.js en hPanel

1. **Inicia sesión en hPanel** de Hostinger
2. Ve a **Websites** → **kurosushifusion.com** → **Gestionar**
3. Busca la sección **"Web Apps"** o **"Node.js"** o **"Agregar sitio web front-end / Node.js"**
4. Haz clic en **"Crear nueva aplicación"** o **"Add Node.js App"**

### Paso 2: Configurar la Aplicación Node.js

En el formulario de creación, configura:

#### **Configuración Básica:**
- **Nombre de la aplicación**: `kuro-loyalty` (o el que prefieras)
- **Versión de Node.js**: **18.x** o **20.x** (recomendado 18)
- **Modo**: **Production**

#### **Configuración de Archivos:**
- **Archivo de entrada (Entry Point)**: `backend/src/server.js`
- **Directorio de trabajo (Working Directory)**: `/` (raíz del proyecto)
- **Comando de inicio (Start Command)**: `cd backend && node src/server.js`
  - O simplemente: `node backend/src/server.js`

#### **Puerto:**
- Dejar en **automático** (Hostinger lo asigna)
- El código ya usa `process.env.PORT` que Hostinger proporciona

### Paso 3: Subir el Proyecto

Tienes dos opciones:

#### **Opción A: File Manager (Más Fácil)**

1. En hPanel, ve a **File Manager**
2. Navega a la carpeta de tu dominio (generalmente `public_html` o `domains/kurosushifusion.com`)
3. **Sube TODOS los archivos** del proyecto manteniendo la estructura:
   ```
   public_html/ (o tu carpeta)
   ├── backend/
   │   ├── src/
   │   │   └── server.js
   │   ├── package.json
   │   └── ...
   ├── frontend/
   │   └── public/
   ├── database/
   │   └── schema.sql
   ├── package.json (raíz)
   └── ...
   ```

#### **Opción B: FTP/SFTP**

1. Usa FileZilla o similar
2. Conecta con las credenciales FTP de Hostinger
3. Sube todos los archivos manteniendo la estructura

**⚠️ IMPORTANTE:** Asegúrate de subir:
- ✅ `backend/` (carpeta completa)
- ✅ `frontend/` (carpeta completa)
- ✅ `database/` (carpeta completa)
- ✅ `package.json` (en la raíz)
- ✅ `.env` (en `backend/`, ver Paso 4)

### Paso 4: Configurar Variables de Entorno

En la configuración de Node.js en hPanel, busca **"Environment Variables"** o **"Variables de Entorno"** y agrega:

```env
NODE_ENV=production
PORT=3000
APP_BASE_URL=https://kurosushifusion.com
JWT_SECRET_CUSTOMER=tu-secret-customer-muy-seguro-aqui
JWT_SECRET_ADMIN=tu-secret-admin-muy-seguro-aqui
VAPID_PUBLIC_KEY=tu-vapid-public-key
VAPID_PRIVATE_KEY=tu-vapid-private-key
VAPID_SUBJECT=mailto:admin@kurosushifusion.com
KURO_LAT=-12.0464
KURO_LNG=-77.0428
```

**🔑 Para generar VAPID keys:**
1. En tu PC local, ejecuta:
   ```bash
   cd backend
   npm run generate-vapid
   ```
2. Copia las keys generadas a las variables de entorno en Hostinger

**⚠️ IMPORTANTE:** 
- **NO subas** el archivo `.env` con datos sensibles a GitHub
- Usa las variables de entorno del panel de Hostinger

### Paso 5: Instalar Dependencias

En la configuración de Node.js en hPanel, busca **"Build Command"** o **"Install Dependencies"**:

**Build Command:**
```bash
cd backend && npm install --production
```

O si Hostinger tiene una opción automática, déjala activada.

**Alternativa (por SSH si está disponible):**
```bash
cd /home/usuario/domains/kurosushifusion.com/public_html
cd backend
npm install --production
```

### Paso 6: Inicializar Base de Datos

**Opción A: Por SSH (Recomendado)**

1. Conecta por SSH a Hostinger
2. Navega a tu proyecto:
   ```bash
   cd /home/usuario/domains/kurosushifusion.com/public_html
   # o la ruta que Hostinger te indique
   ```
3. Inicializa la base de datos:
   ```bash
   cd backend
   npm run init
   ```
4. Crea el usuario admin:
   ```bash
   node scripts/create-admin.js admin tu-password-seguro
   ```

**Opción B: Por Script Automático**

Si Hostinger permite ejecutar scripts, crea un script de inicialización.

**Opción C: Manual (Si no tienes SSH)**

La base de datos se inicializará automáticamente cuando el servidor inicie (el código ya tiene esta lógica), pero necesitarás crear el admin después.

### Paso 7: Verificar Permisos de Archivos

Asegúrate de que la carpeta `database/` tenga permisos de escritura:

1. En **File Manager**, ve a la carpeta `database/`
2. Click derecho → **Change Permissions**
3. Establece: **755** o **775** (lectura/escritura para el propietario)

### Paso 8: Iniciar la Aplicación

1. En la configuración de Node.js en hPanel
2. Haz clic en **"Start"** o **"Deploy"** o **"Iniciar"**
3. Espera a que se inicie (puede tardar 1-2 minutos)

### Paso 9: Verificar que Funciona

1. **Health Check:**
   ```
   https://kurosushifusion.com/health
   ```
   Debe responder: `{"status":"ok","timestamp":"..."}`

2. **Frontend:**
   ```
   https://kurosushifusion.com/
   ```
   Debe cargar `index.html`

3. **API:**
   ```
   https://kurosushifusion.com/api/promotions
   ```
   Debe responder con JSON

### Paso 10: Configurar Dominio (Si es necesario)

Si tu aplicación Node.js está en un subdirectorio o puerto específico:

1. En la configuración de Node.js, busca **"Domain"** o **"URL"**
2. Asigna tu dominio: `kurosushifusion.com`
3. Hostinger debería configurar automáticamente el proxy

## 🔧 Configuración Detallada de Node.js App

### Estructura Esperada por Hostinger:

```
public_html/ (o tu carpeta)
├── package.json          ← Debe estar aquí (✅ ya creado)
├── backend/
│   ├── src/
│   │   └── server.js     ← Entry point
│   ├── package.json
│   └── node_modules/     ← Se crea con npm install
├── frontend/
│   └── public/
└── database/
    └── schema.sql
```

### Configuración en hPanel:

```
Application Name: kuro-loyalty
Node.js Version: 18.x
Entry Point: backend/src/server.js
Start Command: cd backend && node src/server.js
Working Directory: / (raíz)
Port: (automático)
```

## 📝 Checklist de Despliegue

- [ ] Aplicación Node.js creada en hPanel
- [ ] Versión Node.js 18.x seleccionada
- [ ] Entry point configurado: `backend/src/server.js`
- [ ] Todos los archivos subidos (backend, frontend, database)
- [ ] Variables de entorno configuradas en hPanel
- [ ] VAPID keys generadas y configuradas
- [ ] Dependencias instaladas (`npm install` en backend)
- [ ] Base de datos inicializada
- [ ] Usuario admin creado
- [ ] Permisos de carpeta `database/` configurados (755)
- [ ] Aplicación iniciada en hPanel
- [ ] Health check funciona: `/health`
- [ ] Frontend carga: `/`
- [ ] API responde: `/api/promotions`

## 🐛 Solución de Problemas

### Error: "Cannot find module"

**Solución:**
- Verifica que `npm install` se ejecutó en `backend/`
- Revisa que `backend/node_modules/` existe
- Verifica la ruta del Entry Point

### Error: "Port already in use"

**Solución:**
- Hostinger asigna el puerto automáticamente
- Asegúrate de usar `process.env.PORT` (ya está en el código)

### Error: "Database locked" o "no such table"

**Solución:**
- Verifica permisos de `database/` (755 o 775)
- Ejecuta `npm run init` en backend
- Verifica que `database/schema.sql` existe

### La aplicación no inicia

**Solución:**
1. Revisa los logs en hPanel (sección "Logs" o "Console")
2. Verifica que el Entry Point sea correcto: `backend/src/server.js`
3. Verifica que todas las variables de entorno estén configuradas
4. Verifica que las dependencias estén instaladas

### Frontend no carga

**Solución:**
- Verifica que `frontend/public/` esté subido
- El servidor ya sirve archivos estáticos desde `frontend/public`
- Verifica la ruta en el navegador

## 🔐 Seguridad Post-Despliegue

1. **Cambiar credenciales por defecto:**
   - Cambia el password del admin
   - Cambia los JWT secrets

2. **SSL/HTTPS:**
   - Asegúrate de que SSL esté activado (obligatorio para push notifications)
   - Hostinger generalmente lo activa automáticamente

3. **Variables de entorno:**
   - NO subas `.env` a GitHub
   - Usa solo las variables del panel de Hostinger

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs en hPanel
2. Contacta soporte de Hostinger mencionando:
   - "Aplicación Node.js + Express"
   - "Entry point: backend/src/server.js"
   - El error específico que ves

---

**¡Listo!** Tu aplicación debería estar funcionando en `https://kurosushifusion.com`
