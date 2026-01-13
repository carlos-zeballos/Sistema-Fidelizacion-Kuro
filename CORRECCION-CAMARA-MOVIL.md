# Corrección de Cámara en Móvil - Escáner QR

## Problema Identificado

En dispositivos móviles, el escáner QR se veía "invertido/espejado" y no escaneaba correctamente. En desktop funcionaba bien.

## Causa del Problema

1. **Transform CSS**: Anteriormente había un `transform: scaleX(-1)` en el elemento `<video>` que causaba el efecto espejo
2. **Cámara frontal por defecto**: Algunos navegadores móviles seleccionaban la cámara frontal por defecto
3. **Falta de foco automático**: La cámara no tenía foco continuo activado, afectando la detección de QR

## Soluciones Implementadas

### 1. Eliminación de Transform/Mirror ✅
- **Removido**: `transform: scaleX(-1)` del CSS del elemento `#video`
- **Resultado**: El video ahora muestra la orientación correcta de la cámara sin espejo

### 2. Forzar Cámara Trasera ✅
- **Constraints mejorados**:
  ```javascript
  video: {
    facingMode: { ideal: 'environment', exact: false }, // Force rear camera
    width: { ideal: 1280, min: 640 },
    height: { ideal: 720, min: 480 }
  }
  ```
- **Resultado**: El sistema siempre intenta usar la cámara trasera primero

### 3. Atributos Móviles del Video ✅
- **Ya implementados**:
  - `autoplay`: Inicia automáticamente
  - `playsinline`: Evita pantalla completa en iOS
  - `webkit-playsinline`: Compatibilidad con Safari antiguo
  - `muted`: Requerido para autoplay en algunos navegadores

### 4. Foco Continuo ✅
- **Implementado**: Detección y activación de `focusMode: 'continuous'` si está disponible
- **Código**:
  ```javascript
  if (capabilities && capabilities.focusMode && capabilities.focusMode.includes('continuous')) {
    await track.applyConstraints({
      advanced: [{ focusMode: 'continuous' }]
    });
  }
  ```
- **Resultado**: Mejor detección de QR gracias al auto-foco

### 5. Selección de Cámara ✅
- **Enumeración de cámaras**: `enumerateDevices()` para listar todas las cámaras disponibles
- **Ordenamiento**: Cámaras traseras primero (busca "back", "rear", "environment" en el label)
- **Botón "Cambiar Cámara"**: Aparece automáticamente si hay múltiples cámaras
- **Resultado**: Usuario puede cambiar entre cámaras si es necesario

### 6. Canvas sin Inversión ✅
- **Verificado**: El canvas dibuja el video directamente sin transformaciones
- **Código**:
  ```javascript
  // Draw video directly without any transform/mirror
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  ```
- **Resultado**: El QR se detecta correctamente sin inversión

## Archivos Modificados

- `frontend/public/admin-scan.html`:
  - CSS: Removido `transform: scaleX(-1)`
  - JavaScript: Constraints mejorados, enumeración de cámaras, foco continuo, botón cambiar cámara

## Pruebas Recomendadas

### Android Chrome
1. Abrir `admin-scan.html` en HTTPS
2. Permitir acceso a cámara
3. Verificar que se usa cámara trasera
4. Escanear QR y verificar que se detecta correctamente
5. Probar botón "Cambiar Cámara" si hay múltiples cámaras

### iPhone Safari
1. Abrir `admin-scan.html` en HTTPS
2. Permitir acceso a cámara
3. Verificar que se usa cámara trasera
4. Verificar que el video no entra en pantalla completa (playsinline)
5. Escanear QR y verificar que se detecta correctamente

## Notas Técnicas

- **HTTPS requerido**: La cámara solo funciona en HTTPS o localhost
- **Permisos**: El navegador solicitará permisos de cámara la primera vez
- **Fallback**: Si la cámara no funciona, el usuario puede usar el ingreso manual del token
- **Logging**: Se agregó logging detallado para debugging (ver consola del navegador)

## Estado

✅ **Completado**: Todas las mejoras implementadas y listas para pruebas en producción.
