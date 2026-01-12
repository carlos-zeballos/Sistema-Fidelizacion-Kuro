import webpush from 'web-push';

/**
 * Generate VAPID keys for push notifications
 * Run this script to generate keys and add them to your .env file
 */
console.log('🔑 Generando VAPID keys para push notifications...\n');

const vapidKeys = webpush.generateVAPIDKeys();

console.log('✅ VAPID keys generadas:\n');
console.log('📋 Agrega estas líneas a tu archivo backend/.env:\n');
console.log('VAPID_PUBLIC_KEY=' + vapidKeys.publicKey);
console.log('VAPID_PRIVATE_KEY=' + vapidKeys.privateKey);
console.log('VAPID_SUBJECT=mailto:admin@kurosushifusion.com');
console.log('\n⚠️  IMPORTANTE: Mantén la clave privada segura y nunca la compartas.\n');

process.exit(0);
