# 🍣 Sistema de Fidelización KURO

Sistema web mobile-first para restaurante con gestión de puntos, QR codes, promociones y notificaciones push.

## ✨ Características Principales

### Cliente
- ✅ Registro sin contraseña (email + DNI)
- ✅ Login con email + DNI
- ✅ Visualización de puntos de fidelización
- ✅ QR personal único por cliente
- ✅ Carrusel de promociones activas
- ✅ Activación de notificaciones push
- ✅ Geolocalización para promociones cercanas

### Admin
- ✅ Dashboard completo con estadísticas
- ✅ Escaneo de QR para agregar puntos
- ✅ Gestión completa de promociones (CRUD)
- ✅ Envío de notificaciones push manuales
- ✅ Gestión de clientes
- ✅ Sistema antifraude (1 punto cada 24h)

### Notificaciones Automáticas
- ✅ **Por Cercanía**: Notifica cuando cliente está ≤1km y no obtuvo punto en 36h
- ✅ **Por Inactividad**: Notifica cada 56 horas a clientes suscritos
- ✅ **Manuales**: Admin puede enviar notificaciones segmentadas

## 🛠️ Stack Tecnológico

- **Backend**: Node.js + Express
- **Base de Datos**: SQLite (sqlite3)
- **Frontend**: HTML + Tailwind CSS + JavaScript (vanilla)
- **QR Codes**: qrcode (npm) - generación en backend
- **Autenticación**: JWT para clientes y admin
- **Push Notifications**: Web Push API + VAPID
- **Geolocalización**: Navigator Geolocation API

## 📦 Instalación

### Requisitos Previos
- Node.js 18+ 
- npm

### Pasos de Instalación

```bash
# 1. Clonar repositorio
git clone https://github.com/carlos-zeballos/Sistema-Fidelizacion-Kuro.git
cd Sistema-Fidelizacion-Kuro

# 2. Instalar dependencias
cd backend
npm install

# 3. Configurar variables de entorno
# Copia backend/.env.example a backend/.env y configura:
# - JWT_SECRET_CUSTOMER
# - JWT_SECRET_ADMIN
# - VAPID_PUBLIC_KEY y VAPID_PRIVATE_KEY (generar con: npm run generate-vapid)
# - KURO_LAT y KURO_LNG (coordenadas del local)

# 4. Inicializar base de datos
npm run init

# 5. Crear usuario admin
node scripts/create-admin.js admin tu-password

# 6. Iniciar servidor
npm run dev
```

El servidor estará disponible en `http://localhost:3000`

## 📁 Estructura del Proyecto

```
.
├── backend/
│   ├── src/
│   │   ├── config/          # Configuración (database, etc.)
│   │   ├── routes/          # Endpoints API
│   │   ├── services/        # Lógica de negocio
│   │   ├── middleware/      # Autenticación
│   │   └── utils/           # Utilidades
│   ├── scripts/             # Scripts de migración y utilidades
│   └── package.json
├── frontend/
│   └── public/              # Archivos estáticos
│       ├── *.html           # Páginas
│       ├── js/              # JavaScript
│       └── service-worker.js
├── database/
│   ├── schema.sql           # Esquema de base de datos
│   └── loyalty.db           # Base de datos (se crea automáticamente)
└── README.md
```

## 🚀 Uso Rápido

### Cliente
1. Acceder a `http://localhost:3000`
2. Registrarse con email, DNI, teléfono, etc.
3. Ver dashboard con puntos y QR personal
4. Activar notificaciones push y ubicación

### Admin
1. Acceder a `http://localhost:3000/admin-login.html`
2. Login con usuario y contraseña admin
3. Escanear QR de clientes para agregar puntos
4. Gestionar promociones desde el dashboard
5. Enviar notificaciones push manuales

## 📚 Documentación

- `GUIA-PRODUCCION.md` - Guía completa de despliegue a producción
- `VERIFICACION-PROYECTO.md` - Verificación de funcionalidades
- `CONFIGURACION-PUSH.md` - Configuración de notificaciones push
- `PRUEBAS-COMPLETAS.md` - Guía de pruebas

## 🔐 Seguridad

- ✅ JWT para autenticación
- ✅ DNI hasheado con bcrypt
- ✅ Tokens QR únicos y seguros
- ✅ Validación de entrada
- ✅ Regla antifraude (1 punto/24h)

## 📱 PWA (Progressive Web App)

El sistema funciona como PWA:
- ✅ Instalable en móviles
- ✅ Funciona offline (con cache)
- ✅ Notificaciones push nativas
- ✅ Service Worker configurado

## 🔔 Notificaciones Push

### Automáticas
- **Cercanía**: Se activa cuando cliente envía ubicación y está ≤1km
- **Inactividad**: Se evalúa periódicamente (configurar job/cron)

### Manuales
- Admin puede enviar notificaciones a:
  - Todos los suscritos
  - Inactivos >36h
  - Inactivos >56h
  - Cercanos (reportando ubicación)

## 🗄️ Base de Datos

SQLite con las siguientes tablas principales:
- `customers` - Clientes
- `loyalty_points` - Puntos de fidelización
- `point_events` - Eventos de puntos (antifraude)
- `promotions` - Promociones
- `push_subscriptions` - Suscripciones push
- `push_notifications_log` - Log de notificaciones
- `staff` - Administradores

## 📝 Scripts Disponibles

```bash
# Desarrollo
npm run dev              # Iniciar con watch mode

# Producción
npm run start            # Iniciar servidor

# Base de datos
npm run init             # Inicializar base de datos
npm run migrate:push-fields  # Migrar campos push

# Utilidades
npm run generate-vapid   # Generar VAPID keys
```

## 🐛 Troubleshooting

### Error: "no such table"
```bash
npm run init
```

### Error: VAPID keys inválidas
```bash
npm run generate-vapid
# Copiar las keys al .env
```

### Cámara no funciona en móvil
- Usa HTTPS o IP local
- Permite permisos de cámara
- Usa cámara trasera

## 📄 Licencia

Este proyecto es privado y propietario.

## 👤 Autor

Carlos Zeballos

## 🔗 Repositorio

https://github.com/carlos-zeballos/Sistema-Fidelizacion-Kuro

---

**¡Sistema listo para producción!** 🚀

Para más información sobre despliegue, ver `GUIA-PRODUCCION.md`
