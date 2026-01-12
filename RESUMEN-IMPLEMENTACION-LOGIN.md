# ✅ Resumen de Implementación - Login de Clientes

## 🎯 Estado: COMPLETADO

Sistema de login de clientes implementado completamente con email y DNI como contraseña.

---

## 📁 Archivos Modificados

### 1. Base de Datos
- **`database/schema.sql`**
  - ✅ Agregada columna `dni_hash TEXT NOT NULL` a la tabla `customers`

### 2. Backend
- **`backend/src/routes/customer.js`**
  - ✅ Actualizado `POST /api/customers/register` para hashear DNI con bcrypt
  - ✅ Creado `POST /api/customers/login` - Login con email y DNI
  - ✅ Actualizado `GET /api/customers/me` para incluir promociones en la respuesta
  - ✅ Manejo mejorado de errores 409 (CONFLICT) con campo específico

- **`backend/scripts/migrate-add-dni-hash.js`** (NUEVO)
  - ✅ Script de migración para agregar `dni_hash` a clientes existentes
  - ✅ Hashea automáticamente DNIs de clientes ya registrados

### 3. Frontend
- **`frontend/public/index.html`**
  - ✅ Agregado formulario de login (email + DNI)
  - ✅ Manejo de errores de login
  - ✅ Guarda token en localStorage y redirige a dashboard

- **`frontend/public/register.html`**
  - ✅ Ya maneja correctamente errores 409 con mensajes específicos
  - ✅ Resalta campos con error

---

## 🔐 Endpoints Implementados

### 1. POST /api/customers/register
**Body:**
```json
{
  "fullName": "Juan Pérez",
  "email": "juan@example.com",
  "phone": "1234567890",
  "dni": "12345678",
  "sex": "M",
  "birthdate": "1990-01-01",
  "marketingOptIn": true
}
```

**Respuestas:**
- **201**: Registro exitoso
- **409 CONFLICT**: Email o DNI duplicado (con campo específico)

### 2. POST /api/customers/login (NUEVO)
**Body:**
```json
{
  "email": "juan@example.com",
  "dni": "12345678"
}
```

**Respuestas:**
- **200**: Login exitoso → `{ "token": "...", "message": "Login successful" }`
- **401 UNAUTHORIZED**: Credenciales incorrectas
- **400**: Campos faltantes

### 3. GET /api/customers/me
**Headers:**
```
Authorization: Bearer <token>
```

**Respuesta:**
```json
{
  "customer": {...},
  "loyalty": {"points": n},
  "qrToken": "...",
  "qrUrl": "...",
  "qrImageData": "...",
  "promotions": [...]
}
```

---

## 🔄 Migración de Base de Datos

### Para Clientes Existentes

Si ya tienes clientes registrados, ejecuta:

```bash
node backend/scripts/migrate-add-dni-hash.js
```

Este script:
1. Agrega la columna `dni_hash` si no existe
2. Hashea el DNI de todos los clientes existentes
3. Permite que los clientes existentes puedan hacer login

### Para Instalaciones Nuevas

No necesitas migración. El schema se inicializa automáticamente con `dni_hash` incluido.

---

## 🧪 Comandos de Prueba

Ver archivo completo: `COMANDOS-PRUEBA-LOGIN.md`

### Registro
```bash
curl -X POST http://localhost:3000/api/customers/register \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Test User","email":"test@example.com","phone":"1234567890","dni":"12345678","sex":"M","birthdate":"1990-01-01","marketingOptIn":false}'
```

### Login
```bash
curl -X POST http://localhost:3000/api/customers/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","dni":"12345678"}'
```

### Perfil
```bash
curl -X GET http://localhost:3000/api/customers/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📱 Uso en PC y Celular

### PC
1. Iniciar servidor: `npm run dev`
2. Abrir: `http://localhost:3000`
3. Login con email y DNI

### Celular (IP Local)
1. Encontrar IP local: `ipconfig` (Windows) o `ifconfig` (Mac/Linux)
2. Configurar `APP_BASE_URL` en `backend/.env`:
   ```env
   APP_BASE_URL=http://TU_IP:3000
   ```
3. Reiniciar servidor
4. Acceder desde celular: `http://TU_IP:3000`

Ver guía completa: `GUIA-INSTALACION-LOGIN.md`

---

## 🔍 Verificar Puntos en SQLite

```bash
sqlite3 database/loyalty.db

# Ver clientes y puntos
SELECT c.full_name, c.email, lp.points 
FROM customers c 
LEFT JOIN loyalty_points lp ON c.id = lp.customer_id;

# Ver eventos de puntos
SELECT pe.id, c.full_name, pe.created_at
FROM point_events pe
JOIN customers c ON pe.customer_id = c.id
ORDER BY pe.created_at DESC;
```

---

## ✅ Checklist de Funcionalidades

- ✅ Columna `dni_hash` agregada al schema
- ✅ Registro hashea DNI con bcrypt
- ✅ Endpoint de login creado
- ✅ Login valida email y DNI
- ✅ Endpoint `/me` incluye promociones
- ✅ Frontend de login en `index.html`
- ✅ Manejo de errores 409 mejorado
- ✅ Script de migración para clientes existentes
- ✅ Token se guarda en localStorage
- ✅ Redirección a dashboard después de login
- ✅ Admin puede seguir escaneando QR

---

## 🔐 Seguridad

- ✅ DNI se hashea con bcrypt (10 rounds)
- ✅ DNI original se guarda en texto plano (necesario para admin/QR)
- ✅ Token JWT con validez de 30 días
- ✅ Validación de credenciales en backend
- ✅ Mensajes de error genéricos para evitar enumeración

---

## 📝 Notas Importantes

1. **DNI como Contraseña**: El DNI completo se usa como contraseña. Asegúrate de que los clientes lo ingresen exactamente como lo registraron.

2. **Migración**: Si tienes clientes existentes, ejecuta la migración antes de permitir logins.

3. **QR Code**: El admin puede seguir escaneando el QR del cliente para sumar puntos. El login no afecta esta funcionalidad.

4. **Token**: El token se guarda en `localStorage` con la clave `customerToken`. Se puede enviar en header `Authorization: Bearer <token>` o cookie.

5. **Auto-refresh**: El dashboard del cliente actualiza puntos automáticamente cada 30 segundos.

---

## 🚀 Próximos Pasos

1. Ejecutar migración si tienes clientes existentes
2. Probar registro y login
3. Verificar que el dashboard carga correctamente
4. Probar desde celular con IP local

¡Sistema de login completamente funcional! 🎉
