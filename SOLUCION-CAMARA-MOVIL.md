# Solución: Cámara no funciona en Móvil

## 🔧 Cambios Aplicados

### 1. Atributos del Video Mejorados
- Agregado `webkit-playsinline` para iOS
- Agregado `muted` (requerido para autoplay en algunos navegadores)
- Mantenido `playsinline` para Android
- Agregado `autoplay` para inicio automático

### 2. Configuración de getUserMedia Mejorada
- Constraints optimizados para móviles
- Preferencia por cámara trasera (`facingMode: 'environment'`)
- Resolución adaptativa
- Mejor manejo de errores específicos

### 3. Manejo de Errores Mejorado
- Mensajes específicos según el tipo de error
- Instrucciones claras para el usuario
- Fallback al ingreso manual

## 📱 Requisitos para Cámara en Móvil

### HTTPS o Localhost
Los navegadores móviles requieren HTTPS para acceder a la cámara (excepto localhost).

**Opciones:**

1. **Usar IP Local (Recomendado para desarrollo)**
   - Configura `APP_BASE_URL` en `backend/.env`:
     ```env
     APP_BASE_URL=http://TU_IP:3000
     ```
   - Accede desde el celular: `http://TU_IP:3000/admin-scan.html`
   - **Nota**: Algunos navegadores móviles pueden requerir HTTPS incluso con IP local

2. **Usar HTTPS Local**
   - Instala un certificado SSL local
   - O usa un túnel como ngrok

3. **Usar localhost (Solo si el celular y PC están en la misma red)**
   - No funciona directamente desde celular
   - Necesitas usar la IP local

## 🔍 Solución de Problemas

### Error: "getUserMedia no está disponible"
**Causa**: No estás en HTTPS o localhost
**Solución**: 
- Usa la IP local de tu PC
- O configura HTTPS

### Error: "NotAllowedError" o "PermissionDeniedError"
**Causa**: Permisos de cámara denegados
**Solución**:
1. Ve a configuración del navegador en tu celular
2. Permisos → Cámara
3. Permite el acceso para el sitio

### Error: "NotFoundError"
**Causa**: No hay cámara disponible
**Solución**: 
- Verifica que el celular tenga cámara
- Cierra otras apps que usen la cámara

### Error: "NotReadableError"
**Causa**: La cámara está siendo usada por otra app
**Solución**:
- Cierra todas las apps que usen la cámara
- Reinicia el navegador

## ✅ Verificación

1. **Abre desde el celular**: `http://TU_IP:3000/admin-scan.html`
2. **Haz clic en "Iniciar Cámara"**
3. **Permite el acceso** cuando el navegador lo solicite
4. **La cámara debería activarse** y mostrar el video

## 🎯 Alternativa: Ingreso Manual

Si la cámara no funciona, siempre puedes usar el **ingreso manual**:
1. Abre el QR del cliente en tu celular
2. Copia la URL completa o el token
3. Pégalo en el campo "Ingresar Token Manualmente"
4. Haz clic en "Procesar"

## 📝 Notas

- En iOS, Safari funciona mejor que Chrome para la cámara
- En Android, Chrome funciona bien
- Algunos navegadores requieren interacción del usuario antes de activar la cámara (por eso el botón "Iniciar Cámara")
- El video se muestra en espejo para mejor UX
