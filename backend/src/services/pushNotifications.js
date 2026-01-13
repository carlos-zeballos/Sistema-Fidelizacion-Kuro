import webpush from 'web-push';
import db from '../config/database.js';

// VAPID keys - Deben estar en variables de entorno en producción
let VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY?.trim();
let VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY?.trim();
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@kurosushifusion.com';

// Validar y regenerar keys si no son válidas
function validateAndSetVapidKeys() {
  try {
    // Si no hay keys o están vacías, generar nuevas
    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      console.log('⚠️  VAPID keys no encontradas, generando nuevas...');
      const newKeys = webpush.generateVAPIDKeys();
      VAPID_PUBLIC_KEY = newKeys.publicKey;
      VAPID_PRIVATE_KEY = newKeys.privateKey;
      console.log('✅ Nuevas VAPID keys generadas');
      console.log('📋 Agrega estas líneas a tu archivo backend/.env:');
      console.log(`VAPID_PUBLIC_KEY=${VAPID_PUBLIC_KEY}`);
      console.log(`VAPID_PRIVATE_KEY=${VAPID_PRIVATE_KEY}`);
    }
    
    // Intentar configurar VAPID con las keys
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
    console.log('✅ VAPID keys configuradas correctamente');
  } catch (error) {
    console.error('❌ Error con VAPID keys:', error.message);
    console.log('🔄 Regenerando VAPID keys válidas...');
    
    // Regenerar keys válidas
    const newKeys = webpush.generateVAPIDKeys();
    VAPID_PUBLIC_KEY = newKeys.publicKey;
    VAPID_PRIVATE_KEY = newKeys.privateKey;
    
    // Configurar con las nuevas keys
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
    
    console.log('✅ Nuevas VAPID keys generadas y configuradas');
    console.log('📋 IMPORTANTE: Actualiza tu archivo backend/.env con estas keys:');
    console.log(`VAPID_PUBLIC_KEY=${VAPID_PUBLIC_KEY}`);
    console.log(`VAPID_PRIVATE_KEY=${VAPID_PRIVATE_KEY}`);
  }
}

// Configurar VAPID
validateAndSetVapidKeys();

// Coordenadas del local KURO (ejemplo - deben ser las reales)
const KURO_LAT = parseFloat(process.env.KURO_LAT || '-12.0464');
const KURO_LNG = parseFloat(process.env.KURO_LNG || '-77.0428');

/**
 * Calcular distancia entre dos puntos geográficos (Haversine)
 * Retorna distancia en kilómetros
 */
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Radio de la Tierra en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Convertir base64 a Uint8Array
 */
function base64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  
  const rawData = Buffer.from(base64, 'base64');
  return new Uint8Array(rawData);
}

/**
 * Enviar notificación push a un cliente
 */
export async function sendPushNotification(customerId, subscription, notification) {
  let pushSubscription = null;
  let removed = false;
  
  try {
    // Convertir keys de base64 a Uint8Array si son strings
    if (typeof subscription.p256dh === 'string' || typeof subscription.auth === 'string') {
      pushSubscription = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: typeof subscription.p256dh === 'string' 
            ? base64ToUint8Array(subscription.p256dh)
            : subscription.p256dh,
          auth: typeof subscription.auth === 'string'
            ? base64ToUint8Array(subscription.auth)
            : subscription.auth
        }
      };
    } else if (subscription.keys) {
      // Si ya tiene estructura keys, convertir dentro
      pushSubscription = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: typeof subscription.keys.p256dh === 'string'
            ? base64ToUint8Array(subscription.keys.p256dh)
            : subscription.keys.p256dh,
          auth: typeof subscription.keys.auth === 'string'
            ? base64ToUint8Array(subscription.keys.auth)
            : subscription.keys.auth
        }
      };
    } else {
      pushSubscription = subscription;
    }

    const payload = JSON.stringify({
      title: notification.title,
      body: notification.message,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      image: notification.image_url || null,
      data: {
        url: notification.ctaUrl || '/dashboard.html',
        promotion_id: notification.promotionId || null
      }
    });

    await webpush.sendNotification(pushSubscription, payload);

    // Registrar en log
    await db.runQuery(`
      INSERT INTO push_notifications_log 
      (customer_id, promotion_id, notification_type, push_title, push_message, cta_url, success)
      VALUES (?, ?, ?, ?, ?, ?, 1)
    `, [
      customerId,
      notification.promotionId || null,
      notification.type || 'MANUAL',
      notification.title,
      notification.message,
      notification.ctaUrl || null
    ]);

    return { success: true, removed: false };
  } catch (error) {
    // 1) Logging detallado del error de web-push
    console.error(`❌ Error sending push to customer ${customerId}:`, error.message);
    if (error.statusCode) {
      console.error(`   Web-push statusCode: ${error.statusCode}`);
      console.error(`   Web-push body:`, error.body);
      console.error(`   Web-push headers:`, error.headers);
    }
    if (error.stack) {
      console.error(`   Stack:`, error.stack);
    }

    // Registrar error en log
    const errorMessage = error.statusCode 
      ? `[${error.statusCode}] ${error.body || error.message}`
      : error.message || 'Unknown error';
    
    await db.runQuery(`
      INSERT INTO push_notifications_log 
      (customer_id, promotion_id, notification_type, push_title, push_message, cta_url, success, error_message)
      VALUES (?, ?, ?, ?, ?, ?, 0, ?)
    `, [
      customerId,
      notification.promotionId || null,
      notification.type || 'MANUAL',
      notification.title,
      notification.message,
      notification.ctaUrl || null,
      errorMessage
    ]);

    // 4) Si la suscripción es inválida (410 Gone, 404 Not Found), ELIMINAR de la DB
    if (error.statusCode === 410 || error.statusCode === 404) {
      const endpoint = pushSubscription?.endpoint || subscription.endpoint;
      console.log(`🗑️  Eliminando suscripción inválida para cliente ${customerId} (endpoint: ${endpoint?.substring(0, 50)}...)`);
      
      try {
        await db.runQuery(`
          DELETE FROM push_subscriptions 
          WHERE customer_id = ? AND endpoint = ?
        `, [customerId, endpoint]);
        removed = true;
        console.log(`✅ Suscripción eliminada para cliente ${customerId}`);
      } catch (deleteError) {
        console.error(`❌ Error eliminando suscripción:`, deleteError);
        // Si no se puede eliminar, al menos desactivarla
        await db.runQuery(`
          UPDATE push_subscriptions 
          SET active = 0 
          WHERE customer_id = ? AND endpoint = ?
        `, [customerId, endpoint]);
      }
    }

    return { 
      success: false, 
      error: errorMessage,
      removed: removed,
      statusCode: error.statusCode,
      webpushBody: error.body
    };
  }
}

/**
 * Obtener promoción para notificación por cercanía
 */
async function getNearbyPromotion() {
  const now = new Date().toISOString();
  
  // Buscar promoción con audience NEARBY o ALL
  const promo = await db.getOne(`
    SELECT id, push_title, push_message, cta_url
    FROM promotions
    WHERE active = 1
      AND (audience = 'NEARBY' OR audience = 'ALL')
      AND (start_at IS NULL OR start_at <= ?)
      AND (end_at IS NULL OR end_at >= ?)
    ORDER BY 
      CASE WHEN audience = 'NEARBY' THEN 1 ELSE 2 END,
      created_at DESC
    LIMIT 1
  `, [now, now]);

  if (promo) {
    return {
      promotionId: promo.id,
      title: promo.push_title || '¡Estás cerca de KURO!',
      message: promo.push_message || 'Ven a visitarnos y obtén puntos',
      ctaUrl: promo.cta_url || '/dashboard.html'
    };
  }

  // Promoción genérica si no hay promociones
  return {
    title: '¡Estás cerca de KURO!',
    message: 'Ven a visitarnos, tenemos beneficios especiales para ti',
    ctaUrl: '/dashboard.html'
  };
}

/**
 * Obtener promoción para notificación obligatoria (56h)
 */
async function getReactivationPromotion() {
  const now = new Date().toISOString();
  
  // Buscar promoción con audience REACTIVATION o ALL
  const promo = await db.getOne(`
    SELECT id, push_title, push_message, cta_url
    FROM promotions
    WHERE active = 1
      AND (audience = 'REACTIVATION' OR audience = 'ALL')
      AND (start_at IS NULL OR start_at <= ?)
      AND (end_at IS NULL OR end_at >= ?)
    ORDER BY 
      CASE WHEN audience = 'REACTIVATION' THEN 1 ELSE 2 END,
      created_at DESC
    LIMIT 1
  `, [now, now]);

  if (promo) {
    return {
      promotionId: promo.id,
      title: promo.push_title || '¡Te extrañamos en KURO!',
      message: promo.push_message || 'Ven a visitarnos y obtén puntos',
      ctaUrl: promo.cta_url || '/dashboard.html'
    };
  }

  // Promoción genérica si no hay promociones
  return {
    title: '¡Te extrañamos en KURO!',
    message: 'Ven a visitarnos y obtén puntos de fidelización',
    ctaUrl: '/dashboard.html'
  };
}

/**
 * Evaluar y enviar notificación por cercanía
 * Regla: distancia ≤ 1km, last_point_at > 36h, cooldown 12h
 */
export async function evaluateNearbyNotification(customerId, lat, lng) {
  try {
    // Calcular distancia
    const distance = calculateDistance(lat, lng, KURO_LAT, KURO_LNG);
    
    if (distance > 1.0) {
      return { shouldSend: false, reason: 'Too far away' };
    }

    // Obtener datos del cliente
    const customer = await db.getOne(`
      SELECT last_point_at, last_nearby_push_at
      FROM customers
      WHERE id = ?
    `, [customerId]);

    if (!customer) {
      return { shouldSend: false, reason: 'Customer not found' };
    }

    // Verificar si obtuvo punto en las últimas 36 horas
    if (customer.last_point_at) {
      const lastPointTime = new Date(customer.last_point_at);
      const now = new Date();
      const hoursSinceLastPoint = (now - lastPointTime) / (1000 * 60 * 60);
      
      if (hoursSinceLastPoint <= 36) {
        return { shouldSend: false, reason: 'Got point within 36h' };
      }
    }

    // Verificar cooldown (12 horas desde última notificación cercanía)
    if (customer.last_nearby_push_at) {
      const lastPushTime = new Date(customer.last_nearby_push_at);
      const now = new Date();
      const hoursSinceLastPush = (now - lastPushTime) / (1000 * 60 * 60);
      
      if (hoursSinceLastPush <= 12) {
        return { shouldSend: false, reason: 'Cooldown active (12h)' };
      }
    }

    // Verificar si tiene suscripción activa
    const subscription = await db.getOne(`
      SELECT endpoint, p256dh, auth
      FROM push_subscriptions
      WHERE customer_id = ? AND active = 1
      LIMIT 1
    `, [customerId]);

    if (!subscription) {
      return { shouldSend: false, reason: 'No active subscription' };
    }

    // Obtener promoción
    const notification = await getNearbyPromotion();
    notification.type = 'NEARBY';

    // Enviar notificación (las keys vienen en base64 desde la DB)
    const pushSubscription = {
      endpoint: subscription.endpoint,
      p256dh: subscription.p256dh, // base64 string
      auth: subscription.auth // base64 string
    };

    const result = await sendPushNotification(customerId, pushSubscription, notification);

    if (result.success) {
      // Actualizar last_nearby_push_at
      await db.runQuery(`
        UPDATE customers 
        SET last_nearby_push_at = datetime('now')
        WHERE id = ?
      `, [customerId]);
    }

    return { shouldSend: true, sent: result.success };
  } catch (error) {
    console.error('Error evaluating nearby notification:', error);
    return { shouldSend: false, error: error.message };
  }
}

/**
 * Evaluar y enviar notificación obligatoria (56 horas)
 * Regla: han pasado 56h desde última notificación obligatoria
 */
export async function evaluateMandatoryNotification(customerId) {
  try {
    // Obtener datos del cliente
    const customer = await db.getOne(`
      SELECT last_mandatory_push_at, last_point_at
      FROM customers
      WHERE id = ?
    `, [customerId]);

    if (!customer) {
      return { shouldSend: false, reason: 'Customer not found' };
    }

    // Verificar si han pasado 56 horas desde última notificación obligatoria
    let hoursSinceLastMandatory = Infinity;
    if (customer.last_mandatory_push_at) {
      const lastPushTime = new Date(customer.last_mandatory_push_at);
      const now = new Date();
      hoursSinceLastMandatory = (now - lastPushTime) / (1000 * 60 * 60);
    }

    if (hoursSinceLastMandatory < 56) {
      return { shouldSend: false, reason: `Only ${hoursSinceLastMandatory.toFixed(1)}h since last mandatory push` };
    }

    // Opcional: evitar enviar si obtuvo punto en las últimas 12h
    if (customer.last_point_at) {
      const lastPointTime = new Date(customer.last_point_at);
      const now = new Date();
      const hoursSinceLastPoint = (now - lastPointTime) / (1000 * 60 * 60);
      
      if (hoursSinceLastPoint <= 12) {
        return { shouldSend: false, reason: 'Got point within 12h (optional skip)' };
      }
    }

    // Verificar si tiene suscripción activa
    const subscription = await db.getOne(`
      SELECT endpoint, p256dh, auth
      FROM push_subscriptions
      WHERE customer_id = ? AND active = 1
      LIMIT 1
    `, [customerId]);

    if (!subscription) {
      return { shouldSend: false, reason: 'No active subscription' };
    }

    // Obtener promoción
    const notification = await getReactivationPromotion();
    notification.type = 'MANDATORY_56H';

    // Enviar notificación (las keys vienen en base64 desde la DB)
    const pushSubscription = {
      endpoint: subscription.endpoint,
      p256dh: subscription.p256dh, // base64 string
      auth: subscription.auth // base64 string
    };

    const result = await sendPushNotification(customerId, pushSubscription, notification);

    if (result.success) {
      // Actualizar last_mandatory_push_at
      await db.runQuery(`
        UPDATE customers 
        SET last_mandatory_push_at = datetime('now')
        WHERE id = ?
      `, [customerId]);
    }

    return { shouldSend: true, sent: result.success };
  } catch (error) {
    console.error('Error evaluating mandatory notification:', error);
    return { shouldSend: false, error: error.message };
  }
}

/**
 * Enviar notificación manual a múltiples clientes
 */
export async function sendManualNotification(customerIds, notification) {
  const results = [];
  
  for (const customerId of customerIds) {
    try {
      // Obtener suscripción activa
      const subscription = await db.getOne(`
        SELECT endpoint, p256dh, auth
        FROM push_subscriptions
        WHERE customer_id = ? AND active = 1
        LIMIT 1
      `, [customerId]);

      if (!subscription) {
        results.push({ customerId, success: false, reason: 'No subscription', removed: false });
        continue;
      }

      // Las keys vienen en base64 desde la DB, sendPushNotification las convertirá
      const pushSubscription = {
        endpoint: subscription.endpoint,
        p256dh: subscription.p256dh, // base64 string
        auth: subscription.auth // base64 string
      };

      notification.type = 'MANUAL';
      const result = await sendPushNotification(customerId, pushSubscription, notification);
      results.push({ 
        customerId, 
        success: result.success,
        removed: result.removed || false,
        error: result.error || null
      });
    } catch (error) {
      console.error(`❌ Error procesando cliente ${customerId}:`, error);
      results.push({ 
        customerId, 
        success: false, 
        error: error.message,
        removed: false
      });
    }
  }

  return results;
}

/**
 * Obtener VAPID public key para el frontend
 */
export function getVAPIDPublicKey() {
  return VAPID_PUBLIC_KEY;
}

// Export keys for use in other modules
export { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY };
