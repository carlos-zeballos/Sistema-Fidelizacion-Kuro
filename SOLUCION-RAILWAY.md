# 🔧 Solución: Error "Cannot find package 'express'" en Railway

## ❌ Problema

Railway está ejecutando `npm install` en la raíz, pero las dependencias están en `backend/package.json`.

## ✅ Solución

He creado archivos de configuración para Railway. Sigue estos pasos:

### Paso 1: Verificar Archivos Creados

He creado estos archivos:
- ✅ `railway.json` - Configuración de Railway
- ✅ `nixpacks.toml` - Configuración alternativa
- ✅ `package.json` - Actualizado con `postinstall`

### Paso 2: Configurar Railway Manualmente

En Railway, ve a tu proyecto → **Settings** → **Build & Deploy**:

#### **Build Command:**
```bash
cd backend && npm install --omit=dev
```

#### **Start Command:**
```bash
cd backend && node src/server.js
```

#### **Root Directory:**
```
/ (raíz del proyecto)
```

### Paso 3: Redeploy

1. En Railway, ve a **Deployments**
2. Click en **"Redeploy"** o **"Deploy"**
3. Railway usará la nueva configuración

## 🔄 Alternativa: Usar Nixpacks

Si Railway no detecta automáticamente, puedes forzar Nixpacks:

1. En Railway → Settings → **Build & Deploy**
2. Busca **"Buildpack"** o **"Builder"**
3. Selecciona **"Nixpacks"**
4. Railway usará `nixpacks.toml`

## 📋 Verificación

Después del redeploy, verifica los logs:

1. Deberías ver: `npm install` ejecutándose en `backend/`
2. Deberías ver: `node_modules` creado en `backend/`
3. Deberías ver: `Server running successfully!`

## 🐛 Si Sigue Fallando

### Opción A: Forzar Rebuild Completo

1. En Railway → Settings → **Danger Zone**
2. Click en **"Clear Build Cache"**
3. Click en **"Redeploy"**

### Opción B: Verificar Estructura

Asegúrate de que en GitHub tengas:
```
/
├── package.json          ← En la raíz
├── railway.json         ← Nuevo (opcional)
├── nixpacks.toml        ← Nuevo (opcional)
└── backend/
    ├── package.json      ← Con todas las dependencias
    └── src/
        └── server.js
```

### Opción C: Usar Build Command Manual

En Railway → Settings → Build & Deploy:

**Build Command:**
```bash
cd backend && npm ci --omit=dev
```

**Start Command:**
```bash
cd backend && node src/server.js
```

## ✅ Checklist

- [ ] `railway.json` creado (o configurado manualmente)
- [ ] Build Command: `cd backend && npm install --omit=dev`
- [ ] Start Command: `cd backend && node src/server.js`
- [ ] Cambios subidos a GitHub
- [ ] Railway redeploy ejecutado
- [ ] Logs muestran `npm install` en `backend/`
- [ ] Logs muestran `Server running successfully!`

---

**Después de estos cambios, Railway debería instalar las dependencias correctamente.**
