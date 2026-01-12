# Comandos de Prueba - Sistema de Fidelización

## 1. Registrar Cliente

```bash
curl -X POST http://localhost:3000/api/customers/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Juan Pérez",
    "email": "juan@example.com",
    "phone": "1234567890",
    "dni": "12345678",
    "sex": "M",
    "birthdate": "1990-01-01",
    "marketingOptIn": true
  }'
```

**Respuesta esperada (201):**
```json
{
  "message": "Customer registered successfully",
  "customer": {
    "id": 1,
    "fullName": "Juan Pérez",
    "email": "juan@example.com",
    "phone": "1234567890",
    "dni": "12345678",
    "sex": "M",
    "birthdate": "1990-01-01"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "qrToken": "abc123...",
  "qrUrl": "http://localhost:3000/c/abc123...",
  "qrImageData": "data:image/png;base64,iVBORw0KGgo..."
}
```

**Respuesta esperada (409 - Email duplicado):**
```json
{
  "error": "CONFLICT",
  "field": "email",
  "message": "Este correo electrónico ya está registrado"
}
```

**Respuesta esperada (409 - DNI duplicado):**
```json
{
  "error": "CONFLICT",
  "field": "dni",
  "message": "Este DNI ya está registrado"
}
```

## 2. Obtener Perfil del Cliente (GET /api/customers/me)

Primero, registra un cliente y copia el `token` de la respuesta.

```bash
# Reemplaza YOUR_TOKEN con el token obtenido del registro
curl -X GET http://localhost:3000/api/customers/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Respuesta esperada (200):**
```json
{
  "customer": {
    "id": 1,
    "fullName": "Juan Pérez",
    "email": "juan@example.com",
    "phone": "1234567890",
    "dni": "12345678",
    "sex": "M",
    "birthdate": "1990-01-01",
    "marketingOptIn": true,
    "createdAt": "2024-01-01 12:00:00"
  },
  "loyalty": {
    "points": 0,
    "updatedAt": "2024-01-01 12:00:00"
  },
  "qrToken": "abc123...",
  "qrUrl": "http://localhost:3000/c/abc123...",
  "qrImageData": "data:image/png;base64,iVBORw0KGgo..."
}
```

**Respuesta esperada (401 - Sin token):**
```json
{
  "error": "Authentication required"
}
```

**Respuesta esperada (404 - Cliente no encontrado):**
```json
{
  "error": "Customer not found"
}
```

## 3. Flujo Completo de Prueba

### Paso 1: Registrar un cliente nuevo
```bash
curl -X POST http://localhost:3000/api/customers/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "María García",
    "email": "maria@example.com",
    "phone": "9876543210",
    "dni": "87654321",
    "sex": "F",
    "birthdate": "1995-05-15",
    "marketingOptIn": false
  }'
```

Guarda el `token` de la respuesta.

### Paso 2: Obtener el perfil con el token
```bash
# Reemplaza YOUR_TOKEN con el token del paso 1
curl -X GET http://localhost:3000/api/customers/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Paso 3: Intentar registrar el mismo email (debe dar 409)
```bash
curl -X POST http://localhost:3000/api/customers/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Otro Nombre",
    "email": "maria@example.com",
    "phone": "1111111111",
    "dni": "11111111",
    "sex": "M",
    "birthdate": "2000-01-01",
    "marketingOptIn": false
  }'
```

Debería retornar:
```json
{
  "error": "CONFLICT",
  "field": "email",
  "message": "Este correo electrónico ya está registrado"
}
```

## 4. Verificar Rutas en el Servidor

```bash
# Health check
curl http://localhost:3000/health

# Verificar que la ruta /api/customers está montada
curl http://localhost:3000/api/customers/me
# Debe retornar 401 (sin token) o 404 (con token inválido), NO 404 de ruta no encontrada
```

## Notas

- El token JWT tiene una validez de 30 días
- El token se puede enviar en:
  - Header: `Authorization: Bearer <token>`
  - Cookie: `customerToken=<token>`
- El frontend guarda el token en `localStorage` con la clave `customerToken`
