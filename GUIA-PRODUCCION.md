# 🚀 Guía Completa: Despliegue a Producción - Sistema de Fidelización KURO

## 📋 Pre-requisitos

Antes de desplegar, asegúrate de tener:
- ✅ Código funcionando en desarrollo
- ✅ Base de datos con datos de prueba (opcional)
- ✅ Servidor con Node.js 18+ instalado
- ✅ Dominio configurado (para HTTPS)
- ✅ Certificado SSL (Let's Encrypt recomendado)

---

## 🎯 Paso 1: Preparar el Código para Producción

### 1.1 Actualizar Variables de Entorno

Crea un archivo `.env` en producción con:

```env
# Ambiente
NODE_ENV=production

# JWT Secrets (¡GENERA NUEVOS PARA PRODUCCIÓN!)
JWT_SECRET_CUSTOMER=tu-secret-super-seguro-aqui-minimo-32-caracteres
JWT_SECRET_ADMIN=tu-secret-admin-super-seguro-aqui-minimo-32-caracteres

# Servidor
APP_BASE_URL=https://tudominio.com
PORT=3000

# VAPID Keys (¡GENERA NUEVAS PARA PRODUCCIÓN!)
VAPID_PUBLIC_KEY=tu-vapid-public-key-aqui
VAPID_PRIVATE_KEY=tu-vapid-private-key-aqui
VAPID_SUBJECT=mailto:admin@tudominio.com

# Coordenadas del Local KURO (¡ACTUALIZA CON LAS REALES!)
KURO_LAT=-12.0464
KURO_LNG=-77.0428

# SMTP (Opcional - para emails)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-app-password
```

**⚠️ IMPORTANTE:**
- Genera nuevos JWT secrets (usa: `openssl rand -hex 32`)
- Genera nuevas VAPID keys (usa: `npm run generate-vapid`)
- Actualiza coordenadas reales de KURO
- Nunca compartas las claves privadas

### 1.2 Generar VAPID Keys para Producción

```bash
cd backend
npm run generate-vapid
```

Copia las keys generadas al `.env` de producción.

### 1.3 Verificar Archivos Críticos

Asegúrate de que estos archivos existan:
- ✅ `backend/.env` (con todas las variables)
- ✅ `database/schema.sql`
- ✅ `database/loyalty.db` (se creará automáticamente si no existe)

---

## 🖥️ Paso 2: Configurar el Servidor

### 2.1 Instalar Node.js y npm

```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verificar instalación
node --version
npm --version
```

### 2.2 Clonar/Subir el Proyecto

```bash
# Opción 1: Git
git clone tu-repositorio
cd sistema-fidelizacion-kuro

# Opción 2: SCP/SFTP
# Sube todos los archivos al servidor
```

### 2.3 Instalar Dependencias

```bash
cd backend
npm install --production
```

---

## 🔒 Paso 3: Configurar HTTPS (OBLIGATORIO)

### 3.1 Usando Let's Encrypt (Certbot)

```bash
# Instalar Certbot
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# Obtener certificado (reemplaza con tu dominio)
sudo certbot --nginx -d tudominio.com -d www.tudominio.com

# Renovación automática
sudo certbot renew --dry-run
```

### 3.2 Configurar Nginx como Reverse Proxy

Crea `/etc/nginx/sites-available/kuro`:

```nginx
server {
    listen 80;
    server_name tudominio.com www.tudominio.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name tudominio.com www.tudominio.com;

    ssl_certificate /etc/letsencrypt/live/tudominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tudominio.com/privkey.pem;

    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Frontend
    location / {
        root /ruta/a/tu/proyecto/frontend/public;
        try_files $uri $uri/ /index.html;
        index index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # QR Landing Pages
    location /c {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health check
    location /health {
        proxy_pass http://localhost:3000/health;
    }
}
```

Activar el sitio:
```bash
sudo ln -s /etc/nginx/sites-available/kuro /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 🔄 Paso 4: Configurar PM2 (Process Manager)

### 4.1 Instalar PM2

```bash
sudo npm install -g pm2
```

### 4.2 Crear Archivo de Configuración PM2

Crea `ecosystem.config.js` en la raíz del proyecto:

```javascript
module.exports = {
  apps: [{
    name: 'kuro-loyalty-backend',
    script: './backend/src/server.js',
    cwd: '/ruta/a/tu/proyecto',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_memory_restart: '500M',
    watch: false
  }]
};
```

### 4.3 Iniciar con PM2

```bash
# Crear directorio de logs
mkdir -p logs

# Iniciar aplicación
pm2 start ecosystem.config.js

# Guardar configuración para auto-inicio
pm2 save
pm2 startup

# Verificar estado
pm2 status
pm2 logs
```

---

## 📊 Paso 5: Inicializar Base de Datos

### 5.1 Ejecutar Migraciones

```bash
cd backend
npm run init
npm run migrate:push-fields
```

### 5.2 Crear Usuario Admin

```bash
cd backend
node scripts/create-admin.js admin tu-password-seguro
```

**⚠️ IMPORTANTE:** Cambia `tu-password-seguro` por una contraseña fuerte.

---

## ⏰ Paso 6: Configurar Job para Notificaciones Obligatorias

### 6.1 Opción A: Usando node-cron en el Servidor

Instala `node-cron`:
```bash
cd backend
npm install node-cron
```

Crea `backend/src/jobs/mandatoryPush.js`:

```javascript
import cron from 'node-cron';
import fetch from 'node-fetch';

const APP_BASE_URL = process.env.APP_BASE_URL || 'http://localhost:3000';

// Ejecutar cada hora
cron.schedule('0 * * * *', async () => {
  try {
    console.log('🔄 Ejecutando evaluación de notificaciones obligatorias...');
    const response = await fetch(`${APP_BASE_URL}/api/push/evaluate-mandatory`, {
      method: 'POST'
    });
    const data = await response.json();
    console.log('✅ Notificaciones evaluadas:', data);
  } catch (error) {
    console.error('❌ Error en evaluación de notificaciones:', error);
  }
});

console.log('⏰ Job de notificaciones obligatorias configurado (cada hora)');
```

Importa en `backend/src/server.js`:
```javascript
import './jobs/mandatoryPush.js';
```

### 6.2 Opción B: Usando Cron del Sistema

Crea `/etc/cron.d/kuro-push`:

```bash
# Evaluar notificaciones obligatorias cada hora
0 * * * * curl -X POST https://tudominio.com/api/push/evaluate-mandatory
```

---

## 🔍 Paso 7: Verificaciones Finales

### 7.1 Checklist de Verificación

- [ ] HTTPS funcionando (certificado válido)
- [ ] Backend corriendo en PM2
- [ ] Base de datos inicializada
- [ ] Admin creado y puede hacer login
- [ ] Frontend accesible
- [ ] API respondiendo (`/health`)
- [ ] VAPID keys configuradas
- [ ] Coordenadas de KURO actualizadas
- [ ] Job de notificaciones configurado
- [ ] Logs funcionando

### 7.2 Comandos de Verificación

```bash
# Verificar backend
curl https://tudominio.com/health

# Verificar PM2
pm2 status
pm2 logs --lines 50

# Verificar Nginx
sudo nginx -t
sudo systemctl status nginx

# Verificar SSL
sudo certbot certificates
```

---

## 📱 Paso 8: Configuración Móvil

### 8.1 PWA (Progressive Web App)

El sistema ya incluye:
- ✅ `manifest.json`
- ✅ `service-worker.js`

Los usuarios pueden:
1. Abrir la web en móvil
2. Agregar a pantalla de inicio
3. Usar como app nativa

### 8.2 Notificaciones Push en Móvil

- ✅ Requiere HTTPS (ya configurado)
- ✅ Usuario debe aceptar permisos
- ✅ Funciona en Android Chrome y iOS Safari (con limitaciones)

---

## 🔐 Paso 9: Seguridad

### 9.1 Firewall

```bash
# Permitir solo puertos necesarios
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP (redirige a HTTPS)
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

### 9.2 Actualizar Secrets

**NUNCA uses los secrets de desarrollo en producción:**
- JWT secrets deben ser únicos y seguros
- VAPID keys deben ser únicas por dominio
- Cambia contraseñas de admin

### 9.3 Backup de Base de Datos

```bash
# Backup diario (agregar a cron)
0 2 * * * cp /ruta/a/database/loyalty.db /backups/loyalty-$(date +\%Y\%m\%d).db
```

---

## 📈 Paso 10: Monitoreo

### 10.1 PM2 Monitoring

```bash
# Ver métricas
pm2 monit

# Ver logs en tiempo real
pm2 logs

# Reiniciar si es necesario
pm2 restart kuro-loyalty-backend
```

### 10.2 Logs de Nginx

```bash
# Ver logs de acceso
sudo tail -f /var/log/nginx/access.log

# Ver logs de error
sudo tail -f /var/log/nginx/error.log
```

---

## 🚨 Troubleshooting

### Problema: Backend no inicia
```bash
# Verificar logs
pm2 logs kuro-loyalty-backend --lines 100

# Verificar .env
cat backend/.env

# Verificar puerto
sudo netstat -tulpn | grep 3000
```

### Problema: HTTPS no funciona
```bash
# Verificar certificado
sudo certbot certificates

# Renovar si es necesario
sudo certbot renew
```

### Problema: Notificaciones push no funcionan
- Verificar VAPID keys en `.env`
- Verificar que el dominio tenga HTTPS
- Verificar permisos del navegador

---

## ✅ Resumen de Comandos Rápidos

```bash
# Iniciar aplicación
pm2 start ecosystem.config.js

# Ver estado
pm2 status

# Ver logs
pm2 logs

# Reiniciar
pm2 restart kuro-loyalty-backend

# Detener
pm2 stop kuro-loyalty-backend

# Reiniciar Nginx
sudo systemctl reload nginx

# Verificar SSL
sudo certbot certificates
```

---

## 🎉 ¡Listo para Producción!

Tu sistema está ahora:
- ✅ Desplegado en producción
- ✅ Con HTTPS configurado
- ✅ Con PM2 gestionando el proceso
- ✅ Con job de notificaciones configurado
- ✅ Con seguridad básica implementada

**Próximos pasos recomendados:**
1. Probar todas las funcionalidades
2. Crear backups regulares
3. Configurar monitoreo avanzado (opcional)
4. Documentar credenciales de admin de forma segura

---

## 📞 Soporte

Si encuentras problemas:
1. Revisa los logs: `pm2 logs`
2. Verifica el estado: `pm2 status`
3. Revisa Nginx: `sudo nginx -t`
4. Verifica SSL: `sudo certbot certificates`

¡Éxito con tu despliegue! 🚀
