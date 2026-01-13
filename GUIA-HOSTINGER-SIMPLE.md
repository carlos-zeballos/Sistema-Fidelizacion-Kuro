# 🚀 Guía Rápida: Desplegar en Hostinger

## ⚠️ Importante: Hostinger y Node.js

Hostinger tiene diferentes tipos de hosting:
- **Hosting Compartido**: Generalmente NO soporta Node.js
- **VPS**: Soporta Node.js completamente
- **Cloud Hosting**: Puede soportar Node.js según el plan

## ✅ Solución: Usar VPS de Hostinger

Si tienes un **VPS de Hostinger**, sigue estos pasos:

### 1. Conectar por SSH

```bash
ssh usuario@tu-servidor-hostinger.com
```

### 2. Instalar Node.js

```bash
# Usando nvm (recomendado)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18
```

### 3. Subir el Proyecto

**Opción A: Git**
```bash
cd /home/usuario
git clone https://github.com/carlos-zeballos/Sistema-Fidelizacion-Kuro.git
cd Sistema-Fidelizacion-Kuro
```

**Opción B: SCP/SFTP**
- Sube todos los archivos a `/home/usuario/sistema-fidelizacion-kuro`

### 4. Instalar Dependencias

```bash
cd backend
npm install --production
```

### 5. Configurar Variables de Entorno

Crea `backend/.env`:
```env
NODE_ENV=production
PORT=3000
APP_BASE_URL=https://tudominio.com
JWT_SECRET_CUSTOMER=tu-secret-aqui
JWT_SECRET_ADMIN=tu-secret-aqui
VAPID_PUBLIC_KEY=tu-key-aqui
VAPID_PRIVATE_KEY=tu-key-aqui
VAPID_SUBJECT=mailto:admin@tudominio.com
KURO_LAT=-12.0464
KURO_LNG=-77.0428
```

### 6. Inicializar Base de Datos

```bash
cd backend
npm run init
node scripts/create-admin.js admin tu-password
```

### 7. Instalar PM2

```bash
npm install -g pm2
```

### 8. Iniciar con PM2

```bash
cd /home/usuario/sistema-fidelizacion-kuro
pm2 start backend/src/server.js --name kuro-loyalty
pm2 save
pm2 startup
```

### 9. Configurar Nginx (si está disponible)

Crea `/etc/nginx/sites-available/kuro`:
```nginx
server {
    listen 80;
    server_name tudominio.com;

    location / {
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
}
```

Activar:
```bash
sudo ln -s /etc/nginx/sites-available/kuro /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 10. Configurar SSL (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d tudominio.com
```

## 🔄 Si Tienes Hosting Compartido

Si tienes **hosting compartido** y NO soporta Node.js:

### Alternativas:

1. **Railway** (Recomendado - Gratis para empezar)
   - https://railway.app
   - Conecta tu repositorio de GitHub
   - Despliega automáticamente

2. **Render** (Gratis con limitaciones)
   - https://render.com
   - Conecta GitHub
   - Despliega automáticamente

3. **Heroku** (Pago después del free tier)
   - https://heroku.com
   - Usa el `Procfile` que creé

4. **Vercel** (Para frontend + serverless)
   - https://vercel.com
   - Bueno para Node.js

## 📋 Checklist para Hostinger VPS

- [ ] Node.js 18+ instalado
- [ ] Proyecto subido al servidor
- [ ] Dependencias instaladas (`npm install` en backend)
- [ ] Archivo `.env` configurado
- [ ] Base de datos inicializada
- [ ] Admin creado
- [ ] PM2 instalado y configurado
- [ ] Nginx configurado (opcional pero recomendado)
- [ ] SSL/HTTPS configurado
- [ ] Firewall configurado (puertos 80, 443, 22)
- [ ] Dominio apuntando al servidor

## 🆘 Si Hostinger Dice "Framework No Compatible"

Esto significa que:
1. **Tu plan NO soporta Node.js** → Necesitas VPS
2. **O la estructura no es la correcta** → Verifica `package.json` en la raíz

**Solución:**
- Verifica tu tipo de hosting en Hostinger
- Si es compartido, contrata VPS o usa Railway/Render
- Si es VPS, sigue la guía de arriba

## 📞 Contactar Soporte Hostinger

Si necesitas ayuda:
1. Pregunta si tu plan soporta Node.js
2. Si no, pregunta sobre VPS
3. Menciona que necesitas Node.js 18+ para una app Express

---

**Recomendación:** Si Hostinger compartido no funciona, usa **Railway** o **Render** que son más fáciles para Node.js y tienen planes gratuitos.
