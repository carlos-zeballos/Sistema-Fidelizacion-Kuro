# Configuración de Notificaciones Push

## Pasos para Configurar el Sistema Completo

### 1. Ejecutar Migración de Base de Datos

Ejecuta el script de migración para agregar los campos necesarios:

```bash
cd backend
npm run migrate:push-fields
```

O ejecuta el archivo `.bat`:
```bash
migrate-push-fields.bat
```

### 2. Generar VAPID Keys

Genera las claves VAPID para push notifications:

```bash
cd backend
npm run generate-vapid
```

Esto mostrará las claves públicas y privadas. **Copia estas claves**.

### 3. Configurar Variables de Entorno

Crea o actualiza `backend/.env` con las siguientes variables:

```env
# VAPID Keys (generadas en paso 2)
VAPID_PUBLIC_KEY=tu-public-key-aqui
VAPID_PRIVATE_KEY=tu-private-key-aqui
VAPID_SUBJECT=mailto:admin@kurosushifusion.com

# Coordenadas del local KURO (reemplaza con las coordenadas reales)
KURO_LAT=-12.0464
KURO_LNG=-77.0428

# Otras variables existentes
JWT_SECRET_CUSTOMER=tu-secret-customer
JWT_SECRET_ADMIN=tu-secret-admin
APP_BASE_URL=http://localhost:3000
PORT=3000
```

### 4. Reiniciar el Servidor

Reinicia el servidor backend para aplicar los cambios:

```bash
cd backend
npm run dev
```

## Funcionalidades Implementadas

### Cliente (Dashboard)

✅ **Activar Notificaciones Push**
- Botón para solicitar permiso de notificaciones
- Suscripción automática al servicio push
- Se oculta la sección cuando ya está activado

✅ **Activar Ubicación**
- Botón para solicitar permiso de ubicación
- Envío automático de ubicación cada 10-15 minutos
- Evaluación automática de regla de cercanía

✅ **Carrusel de Promociones**
- Muestra promociones activas y vigentes
- Incluye imagen, título y descripción

### Admin (Panel)

✅ **Gestionar Promociones**
- Crear promociones con campos para push notifications
- Editar promociones existentes
- Campos: `push_title`, `push_message`, `cta_url`, `audience`
- Audience: `ALL`, `NEARBY`, `REACTIVATION`

✅ **Enviar Notificaciones Manuales**
- Usar promoción existente o mensaje manual
- Segmentación: todos, inactivos 36h, inactivos 56h, cercanos
- Vista previa de la notificación

### Reglas Automáticas

✅ **Notificación por Cercanía (≤1km)**
- Se evalúa cuando el cliente envía su ubicación
- Condiciones:
  - Distancia ≤ 1.0 km
  - Último punto hace > 36 horas
  - Cooldown de 12 horas desde última notificación cercanía
- Usa promociones con `audience = 'NEARBY'` o `'ALL'`

✅ **Notificación Obligatoria (56 horas)**
- Se evalúa periódicamente (endpoint `/api/push/evaluate-mandatory`)
- Condiciones:
  - Han pasado 56 horas desde última notificación obligatoria
  - (Opcional) Evita enviar si obtuvo punto en últimas 12h
- Usa promociones con `audience = 'REACTIVATION'` o `'ALL'`

## Endpoints API

### Cliente
- `POST /api/customers/location` - Enviar ubicación (evalúa cercanía)
- `GET /api/push/vapid-key` - Obtener VAPID public key
- `POST /api/push/subscribe` - Suscribirse a push
- `GET /api/push/status` - Estado de suscripción

### Admin
- `POST /api/admin/push/send` - Enviar notificación manual
  - Body: `{ promotionId?, title?, message?, ctaUrl?, segment }`
  - Segment: `'all'`, `'inactive_36h'`, `'inactive_56h'`, `'nearby'`

### Sistema
- `POST /api/push/evaluate-mandatory` - Evaluar notificaciones obligatorias (llamar periódicamente)

## Pruebas

### 1. Probar Notificaciones Push

1. Inicia sesión como cliente
2. Ve a dashboard
3. Haz clic en "Activar Notificaciones Push"
4. Acepta el permiso en el navegador
5. Como admin, ve a "Enviar Notificaciones"
6. Selecciona "Todos los suscritos" y envía una notificación de prueba

### 2. Probar Ubicación

1. Inicia sesión como cliente
2. Ve a dashboard
3. Haz clic en "Activar Ubicación"
4. Acepta el permiso de ubicación
5. La ubicación se enviará automáticamente cada 10-15 minutos
6. Si estás cerca (≤1km) y no obtuviste punto en 36h, recibirás notificación

### 3. Probar Regla de Cercanía

1. Cliente activa ubicación
2. Cliente está a ≤1km del local
3. Cliente no obtuvo punto en últimas 36 horas
4. Sistema envía notificación automáticamente

### 4. Probar Notificación Obligatoria

1. Configura un job/cron para llamar `/api/push/evaluate-mandatory` cada hora
2. Clientes suscritos que no recibieron notificación en 56h recibirán una

## Notas Importantes

⚠️ **HTTPS Requerido**: Las notificaciones push y geolocalización requieren HTTPS en producción (o localhost en desarrollo).

⚠️ **VAPID Keys**: Las claves VAPID deben ser únicas por dominio. No reutilices las claves de ejemplo en producción.

⚠️ **Coordenadas**: Actualiza `KURO_LAT` y `KURO_LNG` con las coordenadas reales del local.

⚠️ **Job de 56h**: Configura un job (cron, node-cron, etc.) para llamar `/api/push/evaluate-mandatory` periódicamente.
