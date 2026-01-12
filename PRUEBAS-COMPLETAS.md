# Guía de Pruebas - Sistema de Notificaciones Push

## Pre-requisitos

1. ✅ Ejecutar migración de base de datos: `migrate-push-fields.bat`
2. ✅ Generar VAPID keys: `generate-vapid.bat` y agregar a `backend/.env`
3. ✅ Configurar coordenadas de KURO en `backend/.env`
4. ✅ Reiniciar servidor backend

## Prueba 1: Migración de Base de Datos

```bash
# Ejecutar migración
migrate-push-fields.bat
```

**Resultado esperado:**
- ✅ Campos agregados a `customers`: `last_point_at`, `last_nearby_push_at`, `last_mandatory_push_at`, `last_location_lat`, `last_location_lng`, `last_location_at`
- ✅ Campos agregados a `promotions`: `push_title`, `push_message`, `cta_url`, `audience`
- ✅ Tabla `push_notifications_log` creada

## Prueba 2: Generar VAPID Keys

```bash
# Generar keys
generate-vapid.bat
```

**Resultado esperado:**
- ✅ Muestra `VAPID_PUBLIC_KEY` y `VAPID_PRIVATE_KEY`
- ✅ Copiar estas keys a `backend/.env`

## Prueba 3: Cliente - Activar Notificaciones Push

1. Inicia sesión como cliente en `http://localhost:3000/dashboard.html`
2. Haz clic en "Activar Notificaciones Push"
3. Acepta el permiso en el navegador
4. **Resultado esperado:**
   - ✅ Sección de notificaciones desaparece
   - ✅ En la consola: "Push subscription created"
   - ✅ En la base de datos: registro en `push_subscriptions`

## Prueba 4: Cliente - Activar Ubicación

1. En el dashboard del cliente
2. Haz clic en "Activar Ubicación"
3. Acepta el permiso de ubicación
4. **Resultado esperado:**
   - ✅ Estado cambia a "✅ Activado"
   - ✅ Botón cambia a "Desactivar Ubicación"
   - ✅ En la consola: "📍 Ubicación actualizada" (cada 10 min)
   - ✅ En la base de datos: `customers.last_location_lat` y `last_location_lng` actualizados

## Prueba 5: Admin - Crear Promoción con Push

1. Inicia sesión como admin
2. Ve a "Gestionar Promociones"
3. Crea una nueva promoción con:
   - Título: "Promo Test"
   - Descripción: "Descripción de prueba"
   - Título push: "¡Oferta Especial!"
   - Mensaje push: "Ven a visitarnos"
   - URL: "/dashboard.html"
   - Audiencia: "NEARBY"
4. **Resultado esperado:**
   - ✅ Promoción creada exitosamente
   - ✅ Aparece en el listado con "📢 Con push"
   - ✅ Aparece en el carrusel del cliente

## Prueba 6: Admin - Enviar Notificación Manual

1. Ve a "Enviar Notificaciones"
2. Selecciona "Usar Promoción Existente"
3. Elige la promoción creada
4. Segmento: "Todos los suscritos"
5. Haz clic en "Enviar Notificación"
6. **Resultado esperado:**
   - ✅ Mensaje de éxito: "X exitosos, Y fallidos"
   - ✅ Cliente recibe notificación push
   - ✅ Al hacer clic, abre `/dashboard.html`
   - ✅ Registro en `push_notifications_log`

## Prueba 7: Notificación por Cercanía (Automática)

**Setup:**
1. Cliente tiene notificaciones push activadas
2. Cliente tiene ubicación activada
3. Cliente NO obtuvo punto en últimas 36 horas
4. Cliente está a ≤1km del local (o simula con coordenadas cercanas)

**Proceso:**
1. Cliente envía ubicación (automático cada 10 min o manual)
2. Backend evalúa regla de cercanía
3. **Resultado esperado:**
   - ✅ Si cumple condiciones: recibe notificación automáticamente
   - ✅ `last_nearby_push_at` actualizado
   - ✅ Registro en `push_notifications_log` con `notification_type = 'NEARBY'`

## Prueba 8: Notificación Obligatoria (56h)

**Setup:**
1. Cliente tiene notificaciones push activadas
2. Han pasado 56 horas desde última notificación obligatoria

**Proceso:**
1. Llamar endpoint: `POST /api/push/evaluate-mandatory`
2. **Resultado esperado:**
   - ✅ Clientes elegibles reciben notificación
   - ✅ `last_mandatory_push_at` actualizado
   - ✅ Registro en `push_notifications_log` con `notification_type = 'MANDATORY_56H'`

## Prueba 9: Verificar Logs de Notificaciones

```sql
-- Ver todas las notificaciones enviadas
SELECT * FROM push_notifications_log ORDER BY sent_at DESC LIMIT 10;

-- Ver notificaciones por tipo
SELECT notification_type, COUNT(*) as count 
FROM push_notifications_log 
GROUP BY notification_type;

-- Ver notificaciones exitosas vs fallidas
SELECT success, COUNT(*) as count 
FROM push_notifications_log 
GROUP BY success;
```

## Comandos curl para Pruebas

### 1. Obtener VAPID Public Key
```bash
curl http://localhost:3000/api/push/vapid-key
```

### 2. Suscribirse a Push (requiere token de cliente)
```bash
curl -X POST http://localhost:3000/api/push/subscribe \
  -H "Authorization: Bearer TU_TOKEN_CLIENTE" \
  -H "Content-Type: application/json" \
  -d '{
    "endpoint": "https://fcm.googleapis.com/...",
    "p256dh": "...",
    "auth": "..."
  }'
```

### 3. Enviar Ubicación (requiere token de cliente)
```bash
curl -X POST http://localhost:3000/api/customers/location \
  -H "Authorization: Bearer TU_TOKEN_CLIENTE" \
  -H "Content-Type: application/json" \
  -d '{
    "lat": -12.0464,
    "lng": -77.0428
  }'
```

### 4. Enviar Notificación Manual (requiere token de admin)
```bash
curl -X POST http://localhost:3000/api/admin/push/send \
  -H "Authorization: Bearer TU_TOKEN_ADMIN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Manual",
    "message": "Mensaje de prueba",
    "segment": "all"
  }'
```

### 5. Evaluar Notificaciones Obligatorias
```bash
curl -X POST http://localhost:3000/api/push/evaluate-mandatory
```

## Checklist Final

- [ ] Migración ejecutada sin errores
- [ ] VAPID keys generadas y configuradas
- [ ] Cliente puede activar notificaciones push
- [ ] Cliente puede activar ubicación
- [ ] Admin puede crear promoción con campos push
- [ ] Admin puede enviar notificación manual
- [ ] Notificación manual llega al cliente
- [ ] Notificación por cercanía funciona (si aplica)
- [ ] Logs de notificaciones se registran correctamente
- [ ] Service worker maneja notificaciones correctamente
- [ ] Al hacer clic en notificación, abre la URL correcta

## Troubleshooting

### Notificaciones no llegan
- Verifica VAPID keys en `.env`
- Verifica que el cliente aceptó permisos
- Revisa consola del navegador para errores
- Verifica `push_subscriptions` en la base de datos

### Ubicación no funciona
- Verifica permisos del navegador
- Asegúrate de usar HTTPS o localhost
- Revisa consola para errores de geolocalización

### Error 500 en endpoints
- Verifica que la migración se ejecutó correctamente
- Revisa logs del servidor
- Verifica que todas las tablas existen
