# 🚂 Desplegar en Railway (Alternativa Rápida)

## ✅ Por Qué Railway

- ✅ **Gratis para empezar** (con límites)
- ✅ **Despliegue automático** desde GitHub
- ✅ **Dominio gratuito** incluido
- ✅ **Configuración mínima**
- ✅ **Perfecto para pruebas** sin dominio propio

## 🚀 Pasos para Desplegar en Railway

### Paso 1: Crear Cuenta

1. Ve a: https://railway.app
2. Click en **"Start a New Project"**
3. Inicia sesión con **GitHub**
4. Autoriza Railway a acceder a tus repositorios

### Paso 2: Conectar Repositorio

1. Click en **"New Project"**
2. Selecciona **"Deploy from GitHub repo"**
3. Busca y selecciona: `Sistema-Fidelizacion-Kuro`
4. Railway detectará automáticamente Node.js

### Paso 3: Configurar Variables de Entorno

En Railway, ve a tu proyecto → **Variables** y agrega:

```env
NODE_ENV=production
PORT=3000
APP_BASE_URL=https://tu-app.railway.app
JWT_SECRET_CUSTOMER=tu-secret-customer-muy-seguro-aqui
JWT_SECRET_ADMIN=tu-secret-admin-muy-seguro-aqui
VAPID_PUBLIC_KEY=tu-vapid-public-key
VAPID_PRIVATE_KEY=tu-vapid-private-key
VAPID_SUBJECT=mailto:admin@tudominio.com
KURO_LAT=-12.0464
KURO_LNG=-77.0428
```

**🔑 Para generar VAPID keys:**
```bash
cd backend
npm run generate-vapid
```

### Paso 4: Configurar Build y Start

Railway debería detectar automáticamente, pero verifica:

**Settings → Build & Deploy:**

- **Root Directory:** `/` (raíz)
- **Build Command:** `cd backend && npm install`
- **Start Command:** `cd backend && node src/server.js`

O deja Railway detectar automáticamente (generalmente funciona).

### Paso 5: Inicializar Base de Datos

Railway tiene una terminal integrada:

1. Ve a tu proyecto en Railway
2. Click en **"View Logs"** o busca **"Terminal"**
3. Ejecuta:
   ```bash
   cd backend
   npm run init
   node scripts/create-admin.js admin tu-password-seguro
   ```

**O** la base de datos se inicializará automáticamente al iniciar (el código ya lo hace).

### Paso 6: Obtener URL

1. Railway asignará automáticamente una URL
2. Ve a **Settings → Domains**
3. Verás algo como: `tu-app.railway.app`
4. Esta es tu URL pública

### Paso 7: Verificar

1. **Health Check:**
   ```
   https://tu-app.railway.app/health
   ```

2. **Frontend:**
   ```
   https://tu-app.railway.app/
   ```

3. **API:**
   ```
   https://tu-app.railway.app/api/promotions
   ```

## 🔧 Configuración Adicional

### Dominio Personalizado (Opcional)

Si quieres usar tu dominio:

1. En Railway → Settings → Domains
2. Click en **"Custom Domain"**
3. Agrega: `kurosushifusion.com`
4. Railway te dará instrucciones de DNS

### Variables de Entorno Sensibles

**⚠️ IMPORTANTE:** No subas `.env` a GitHub. Usa solo las variables de Railway.

### Logs y Monitoreo

- Railway muestra logs en tiempo real
- Puedes ver errores fácilmente
- Monitoreo básico incluido

## 📊 Ventajas vs Hostinger

| Característica | Railway | Hostinger |
|---------------|---------|-----------|
| **Configuración** | ⚡ Muy fácil | ⚙️ Más manual |
| **Tiempo setup** | 10 min | 30-60 min |
| **Dominio gratis** | ✅ Sí | ❌ No |
| **Costo inicial** | Gratis | Ya pagado |
| **Para producción** | ✅ Bueno | ✅ Mejor |
| **Control** | Limitado | Total |

## 🎯 Cuándo Usar Railway

✅ **Usa Railway si:**
- Quieres probar rápido
- No tienes dominio aún
- Necesitas desplegar HOY
- Quieres algo simple

❌ **No uses Railway si:**
- Necesitas control total del servidor
- Tienes requisitos específicos de infraestructura
- Ya pagaste Hostinger y quieres aprovecharlo

## 🔄 Migrar de Railway a Hostinger Después

Cuando tengas dominio y quieras migrar:

1. **Exporta la base de datos** de Railway (si es necesario)
2. **Sigue `GUIA-HOSTINGER-BUSINESS.md`**
3. **Actualiza variables de entorno** en Hostinger
4. **Cambia DNS** del dominio a Hostinger
5. **Despliega en Hostinger**

## 🆘 Solución de Problemas

### Error: "Build failed"

**Solución:**
- Verifica que `backend/package.json` existe
- Verifica que todas las dependencias estén listadas
- Revisa los logs de Railway

### Error: "Cannot find module"

**Solución:**
- Verifica que `npm install` se ejecutó
- Revisa que `backend/node_modules/` existe
- Verifica la ruta del Start Command

### Base de datos no funciona

**Solución:**
- Verifica permisos de escritura
- Railway debería permitir escritura en el sistema de archivos
- Si no, considera usar una base de datos externa (opcional)

## 📝 Checklist Railway

- [ ] Cuenta creada en Railway
- [ ] Repositorio conectado
- [ ] Variables de entorno configuradas
- [ ] VAPID keys generadas y configuradas
- [ ] Build Command configurado
- [ ] Start Command configurado
- [ ] Base de datos inicializada
- [ ] Admin creado
- [ ] URL obtenida
- [ ] Health check funciona
- [ ] Frontend carga
- [ ] API responde

---

**¡Listo!** Tu app estará en línea en minutos con Railway.
