# Guía de Instalación y Uso - Sistema de Login

## 📋 Archivos Modificados

### Base de Datos
- `database/schema.sql` - Agregada columna `dni_hash TEXT NOT NULL`

### Backend
- `backend/src/routes/customer.js` - Agregado endpoint `/login` y actualizado registro para hashear DNI
- `backend/scripts/migrate-add-dni-hash.js` - Script de migración para clientes existentes

### Frontend
- `frontend/public/index.html` - Agregado formulario de login

## 🚀 Instalación y Configuración

### 1. Instalar Dependencias

```bash
cd backend
npm install
```

**Nota**: `bcrypt` ya está en `package.json` (versión 5.1.1), no necesitas agregarlo.

### 2. Migrar Base de Datos

Si ya tienes clientes registrados, ejecuta la migración:

```bash
node backend/scripts/migrate-add-dni-hash.js
```

Este script:
- Agrega la columna `dni_hash` si no existe
- Hashea el DNI de todos los clientes existentes

**Si es una instalación nueva**, la base de datos se inicializará automáticamente con el schema actualizado al iniciar el servidor.

### 3. Iniciar Servidor

```bash
npm run dev
```

El servidor se iniciará en `http://localhost:3000`

## 📱 Cómo Usar en PC

### 1. Acceder a la Aplicación

Abre tu navegador y ve a:
```
http://localhost:3000
```

### 2. Login de Cliente

1. En la página principal (`index.html`), verás el formulario de login
2. Ingresa:
   - **Email**: El email con el que te registraste
   - **DNI**: Tu DNI completo
3. Haz clic en "Ingresar"
4. Serás redirigido a `/dashboard.html` con tu perfil

### 3. Registro de Cliente

1. Haz clic en "Registrarse"
2. Completa el formulario
3. Si el email o DNI ya existe, verás un mensaje de error específico
4. Al registrarte exitosamente, serás redirigido al dashboard

## 📱 Cómo Usar en Celular (IP Local)

### 1. Encontrar tu IP Local

**Windows:**
```bash
ipconfig
```
Busca "IPv4 Address" (ejemplo: `192.168.1.100`)

**Mac/Linux:**
```bash
ifconfig
```
O:
```bash
ip addr show
```

### 2. Configurar APP_BASE_URL

Edita `backend/.env` y agrega:

```env
APP_BASE_URL=http://TU_IP:3000
```

Por ejemplo:
```env
APP_BASE_URL=http://192.168.1.100:3000
```

### 3. Reiniciar Servidor

```bash
npm run dev
```

### 4. Acceder desde el Celular

1. Asegúrate de que tu celular esté en la misma red WiFi que tu PC
2. Abre el navegador en tu celular
3. Ve a: `http://TU_IP:3000`
   - Ejemplo: `http://192.168.1.100:3000`

### 5. Usar la Aplicación

- **Login**: Ingresa email y DNI
- **Registro**: Completa el formulario
- **Dashboard**: Ve tu perfil, puntos y QR

## 🔐 Credenciales de Prueba

### Cliente de Prueba

Después de registrar un cliente, puedes usar:
- **Email**: El que registraste
- **DNI**: El DNI que registraste

### Admin

Para acceder al panel admin:
- URL: `http://localhost:3000/admin-login.html`
- Usuario: `admin`
- Contraseña: `admin123`

Si no existe el admin, créalo:
```bash
node backend/scripts/create-admin.js admin admin123
```

## 🧪 Pruebas con curl

Ver archivo `COMANDOS-PRUEBA-LOGIN.md` para comandos curl completos.

### Ejemplo Rápido

**Registro:**
```bash
curl -X POST http://localhost:3000/api/customers/register \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Test User","email":"test@example.com","phone":"1234567890","dni":"12345678","sex":"M","birthdate":"1990-01-01","marketingOptIn":false}'
```

**Login:**
```bash
curl -X POST http://localhost:3000/api/customers/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","dni":"12345678"}'
```

**Perfil (reemplaza YOUR_TOKEN):**
```bash
curl -X GET http://localhost:3000/api/customers/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🔍 Verificar Puntos en SQLite

### Opción 1: CLI

```bash
sqlite3 database/loyalty.db

# Ver clientes y puntos
SELECT c.full_name, c.email, lp.points 
FROM customers c 
LEFT JOIN loyalty_points lp ON c.id = lp.customer_id;
```

### Opción 2: DB Browser

1. Descarga DB Browser for SQLite: https://sqlitebrowser.org/
2. Abre `database/loyalty.db`
3. Ejecuta la query anterior

## ⚠️ Solución de Problemas

### Error: "no such column: dni_hash"

**Solución**: Ejecuta la migración:
```bash
node backend/scripts/migrate-add-dni-hash.js
```

### Error: "Credenciales incorrectas" al hacer login

**Verifica**:
1. Que el email sea correcto (case-insensitive)
2. Que el DNI sea exactamente el mismo que registraste
3. Que el cliente exista en la base de datos

### No puedo acceder desde el celular

**Verifica**:
1. Que el celular esté en la misma red WiFi
2. Que el firewall de Windows permita conexiones en el puerto 3000
3. Que `APP_BASE_URL` en `.env` tenga tu IP correcta
4. Que el servidor esté corriendo

### Error 404 en `/api/customers/me`

**Verifica**:
1. Que estés enviando el token en el header `Authorization: Bearer <token>`
2. Que el token no haya expirado (30 días)
3. Que el token sea válido

## 📝 Notas Importantes

- El DNI se hashea con bcrypt (10 rounds) para seguridad
- El DNI original se guarda en texto plano (necesario para el admin escanear QR)
- El token JWT tiene validez de 30 días
- Los puntos se actualizan automáticamente cada 30 segundos en el dashboard
- El admin puede seguir escaneando QR para sumar puntos

## 🎯 Flujo Completo

1. **Cliente se registra** → Se guarda DNI hasheado
2. **Cliente hace login** → Se valida DNI con hash → Se genera token
3. **Cliente accede a dashboard** → Se carga perfil con token
4. **Admin escanea QR** → Se suma punto → Cliente ve actualización automática
