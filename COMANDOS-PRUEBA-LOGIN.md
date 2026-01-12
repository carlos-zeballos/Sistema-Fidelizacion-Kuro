# Comandos de Prueba - Login de Clientes

## 1. Migrar Base de Datos (Primera vez)

Si ya tienes clientes registrados, ejecuta la migración para agregar `dni_hash`:

```bash
node backend/scripts/migrate-add-dni-hash.js
```

## 2. Registrar Cliente

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
  "qrUrl": "http://localhost:3000/c/abc123..."
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

## 3. Login de Cliente

```bash
curl -X POST http://localhost:3000/api/customers/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "juan@example.com",
    "dni": "12345678"
  }'
```

**Respuesta esperada (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "message": "Login successful"
}
```

**Respuesta esperada (401 - Credenciales incorrectas):**
```json
{
  "error": "UNAUTHORIZED",
  "message": "Credenciales incorrectas"
}
```

**Respuesta esperada (400 - Campos faltantes):**
```json
{
  "error": "Email and DNI are required"
}
```

## 4. Obtener Perfil del Cliente (GET /api/customers/me)

Primero, registra o inicia sesión y copia el `token` de la respuesta.

```bash
# Reemplaza YOUR_TOKEN con el token obtenido
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
  "qrImageData": "data:image/png;base64,iVBORw0KGgo...",
  "promotions": [
    {
      "id": 1,
      "title": "Promoción Especial",
      "description": "Descripción de la promoción",
      "imageUrl": "https://example.com/image.jpg",
      "startAt": "2024-01-01",
      "endAt": "2024-12-31",
      "createdAt": "2024-01-01 12:00:00"
    }
  ]
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

## 5. Flujo Completo de Prueba

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

### Paso 2: Login con email y DNI
```bash
curl -X POST http://localhost:3000/api/customers/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "maria@example.com",
    "dni": "87654321"
  }'
```

Debería retornar un nuevo `token`.

### Paso 3: Obtener el perfil con el token
```bash
# Reemplaza YOUR_TOKEN con el token del paso 2
curl -X GET http://localhost:3000/api/customers/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Paso 4: Intentar login con credenciales incorrectas
```bash
curl -X POST http://localhost:3000/api/customers/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "maria@example.com",
    "dni": "12345678"
  }'
```

Debería retornar:
```json
{
  "error": "UNAUTHORIZED",
  "message": "Credenciales incorrectas"
}
```

## 6. Verificar Puntos en SQLite

### Opción 1: Usando sqlite3 CLI

```bash
# Abrir base de datos
sqlite3 database/loyalty.db

# Ver clientes y sus puntos
SELECT c.id, c.full_name, c.email, c.dni, lp.points 
FROM customers c 
LEFT JOIN loyalty_points lp ON c.id = lp.customer_id;

# Ver puntos de un cliente específico
SELECT c.full_name, lp.points, lp.updated_at
FROM customers c
JOIN loyalty_points lp ON c.id = lp.customer_id
WHERE c.email = 'juan@example.com';

# Ver eventos de puntos (historial)
SELECT pe.id, c.full_name, pe.created_at, pe.source
FROM point_events pe
JOIN customers c ON pe.customer_id = c.id
ORDER BY pe.created_at DESC
LIMIT 10;
```

### Opción 2: Usando herramienta gráfica

Puedes usar herramientas como:
- **DB Browser for SQLite** (https://sqlitebrowser.org/)
- **SQLiteStudio** (https://sqlitestudio.pl/)

Abre el archivo: `database/loyalty.db`

### Opción 3: Script Node.js rápido

Crea un archivo `check-points.js`:

```javascript
import db from './backend/src/config/database.js';

async function checkPoints() {
  const customers = await db.getAll(`
    SELECT c.id, c.full_name, c.email, lp.points, lp.updated_at
    FROM customers c
    LEFT JOIN loyalty_points lp ON c.id = lp.customer_id
    ORDER BY lp.points DESC
  `);
  
  console.log('\n📊 Clientes y Puntos:\n');
  customers.forEach(c => {
    console.log(`${c.full_name} (${c.email}): ${c.points || 0} puntos`);
  });
  
  db.close();
}

checkPoints();
```

Ejecuta:
```bash
node check-points.js
```

## 7. Verificar que dni_hash se guardó correctamente

```bash
sqlite3 database/loyalty.db

# Ver estructura de la tabla
.schema customers

# Ver clientes con dni_hash (no mostrar el hash completo por seguridad)
SELECT id, full_name, email, dni, 
       CASE WHEN dni_hash IS NOT NULL THEN 'Hashed' ELSE 'NULL' END as hash_status
FROM customers;
```

## Notas Importantes

- El DNI se hashea con bcrypt (10 rounds)
- El DNI original se guarda en texto plano (necesario para el admin)
- El `dni_hash` se usa solo para autenticación
- El token JWT tiene validez de 30 días
- El token se puede enviar en:
  - Header: `Authorization: Bearer <token>`
  - Cookie: `customerToken=<token>`
- El frontend guarda el token en `localStorage` con la clave `customerToken`
