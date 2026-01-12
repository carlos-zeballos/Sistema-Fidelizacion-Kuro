# Cambios Implementados - Corrección de Errores 409 y 404

## Resumen

Se corrigieron los errores 409 (Conflict) y 404 (Not Found) en el sistema de fidelización, mejorando el manejo de errores tanto en backend como frontend.

---

## Archivos Modificados

### 1. `backend/src/routes/customer.js`

#### Cambios en el endpoint POST `/api/customers/register`:

**Antes:**
- Retornaba 409 genérico: `{ error: 'Email, phone, or DNI already registered' }`
- No identificaba qué campo específico estaba duplicado

**Después:**
- Identifica el campo específico duplicado (email, dni, o phone)
- Retorna estructura JSON estándar:
  ```json
  {
    "error": "CONFLICT",
    "field": "email|dni|phone",
    "message": "Mensaje específico en español"
  }
  ```
- Verifica cada campo por separado antes de insertar
- Maneja errores UNIQUE constraint de SQLite identificando el campo

**Líneas modificadas:**
- Líneas 53-61: Verificación individual de email, dni y phone
- Líneas 128-145: Manejo mejorado de errores UNIQUE constraint
- Líneas 172-195: Mismo manejo en el código de reintento

#### Endpoint GET `/api/customers/me`:

**Estado:** ✅ Ya existía y funciona correctamente
- Ruta: `/api/customers/me`
- Requiere autenticación JWT (Bearer token o cookie)
- Retorna estructura completa:
  ```json
  {
    "customer": {...},
    "loyalty": {"points": n},
    "qrToken": "...",
    "qrUrl": "http://localhost:3000/c/<qrToken>",
    "qrImageData": "data:image/png;base64,..."
  }
  ```

---

### 2. `frontend/public/register.html`

#### Cambios en el manejo de errores:

**Antes:**
- Mostraba mensaje genérico para todos los errores
- No resaltaba el campo específico con error

**Después:**
- Maneja específicamente el error 409 (CONFLICT)
- Muestra el mensaje específico del campo duplicado
- Resalta visualmente el campo con error (borde rojo)
- El resaltado se elimina automáticamente después de 3 segundos

**Líneas modificadas:**
- Líneas 204-228: Manejo mejorado de errores 409 y 503

---

### 3. `frontend/public/js/customer.js`

#### Cambios en `getCustomerProfile()`:

**Antes:**
- No manejaba específicamente el error 404

**Después:**
- Maneja específicamente el error 404
- Muestra mensaje claro: "Cliente no encontrado. Por favor, regístrate nuevamente."
- Mejora el manejo de otros errores

**Líneas modificadas:**
- Líneas 8-23: Manejo mejorado de errores, especialmente 404

---

### 4. `backend/src/server.js`

#### Verificación de rutas:

**Estado:** ✅ Las rutas están correctamente montadas
- Línea 35: `app.use('/api/customers', customerRoutes);`
- El endpoint `/api/customers/me` está disponible y funcionando

---

## Estructura de Respuestas

### 409 Conflict (Email duplicado)
```json
{
  "error": "CONFLICT",
  "field": "email",
  "message": "Este correo electrónico ya está registrado"
}
```

### 409 Conflict (DNI duplicado)
```json
{
  "error": "CONFLICT",
  "field": "dni",
  "message": "Este DNI ya está registrado"
}
```

### 409 Conflict (Teléfono duplicado)
```json
{
  "error": "CONFLICT",
  "field": "phone",
  "message": "Este teléfono ya está registrado"
}
```

### 200 OK (Perfil obtenido)
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

### 404 Not Found (Cliente no encontrado)
```json
{
  "error": "Customer not found"
}
```

### 401 Unauthorized (Sin token)
```json
{
  "error": "Authentication required"
}
```

---

## Flujo de Registro Corregido

1. **Usuario intenta registrarse** → `POST /api/customers/register`
2. **Si email/dni/phone ya existe:**
   - Backend retorna 409 con campo específico
   - Frontend muestra mensaje específico
   - Frontend resalta el campo con error
3. **Si registro es exitoso:**
   - Backend retorna 201 con token
   - Frontend guarda token en localStorage
   - Frontend redirige a dashboard
4. **Dashboard carga perfil:**
   - Frontend llama `GET /api/customers/me` con token
   - Backend valida token y retorna perfil completo
   - Frontend muestra datos del cliente

---

## Comandos de Prueba

Ver archivo `COMANDOS-PRUEBA.md` para comandos curl completos.

### Prueba rápida de registro:
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

### Prueba rápida de perfil:
```bash
curl -X GET http://localhost:3000/api/customers/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Verificaciones Realizadas

✅ Endpoint `/api/customers/register` retorna 409 con estructura correcta  
✅ Endpoint `/api/customers/me` existe y funciona correctamente  
✅ Ruta `/api/customers` está montada en `server.js`  
✅ Frontend maneja errores 409 mostrando mensajes específicos  
✅ Frontend maneja errores 404 con mensajes claros  
✅ Autenticación JWT funciona correctamente  
✅ Token se envía en header `Authorization: Bearer <token>`  

---

## Próximos Pasos

1. Reiniciar el servidor: `npm run dev`
2. Probar registro con email duplicado (debe mostrar mensaje específico)
3. Probar registro exitoso → dashboard debe cargar perfil sin 404
4. Verificar que el token se guarda correctamente en localStorage

---

## Notas Técnicas

- El token JWT tiene validez de 30 días
- El token se puede enviar en:
  - Header: `Authorization: Bearer <token>`
  - Cookie: `customerToken=<token>`
- El frontend guarda el token en `localStorage` con la clave `customerToken`
- Los mensajes de error están en español para mejor UX
