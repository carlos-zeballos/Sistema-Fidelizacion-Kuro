import db, { DB_PATH } from '../src/config/database.js';

console.log('📁 Using DB_PATH:', DB_PATH);

/**
 * Script para verificar eventos de puntos de un cliente
 * Uso: node scripts/check-customer-events.js [customer_id]
 */
async function checkEvents() {
  try {
    const customerId = process.argv[2] || 1; // Default to customer ID 1 (Carlos)
    
    console.log(`🔍 Verificando eventos para cliente ID: ${customerId}`);

    // Get customer info
    const customer = await db.getOne('SELECT id, full_name, qr_token FROM customers WHERE id = ?', [customerId]);
    
    if (!customer) {
      console.log(`❌ Cliente con ID ${customerId} no encontrado`);
      db.close();
      process.exit(1);
    }

    console.log(`\n👤 Cliente: ${customer.full_name} (ID: ${customer.id})`);
    console.log(`🔑 QR Token: ${customer.qr_token ? customer.qr_token.substring(0, 16) + '...' : 'NO TIENE'}`);

    // Get all point events
    const events = await db.getAll(`
      SELECT id, customer_id, staff_id, source, created_at 
      FROM point_events 
      WHERE customer_id = ?
      ORDER BY created_at DESC
    `, [customerId]);

    console.log(`\n📊 Total de eventos: ${events.length}`);

    if (events.length > 0) {
      console.log('\n📋 Eventos recientes:');
      events.forEach((event, index) => {
        const eventTime = new Date(event.created_at);
        const now = new Date();
        const hoursAgo = (now - eventTime) / (1000 * 60 * 60);
        console.log(`  ${index + 1}. ID: ${event.id}, Source: ${event.source || 'NULL'}, Hace: ${hoursAgo.toFixed(2)} horas (${event.created_at})`);
      });

      // Check last successful QR_SCAN event
      const lastQRScan = events.find(e => e.source === 'QR_SCAN');
      if (lastQRScan) {
        const lastEventTime = new Date(lastQRScan.created_at);
        const now = new Date();
        const hoursSince = (now - lastEventTime) / (1000 * 60 * 60);
        console.log(`\n⏰ Último punto exitoso (QR_SCAN): Hace ${hoursSince.toFixed(2)} horas`);
        if (hoursSince < 24) {
          const hoursRemaining = 24 - hoursSince;
          console.log(`   ⚠️  Debe esperar ${hoursRemaining.toFixed(2)} horas más (${Math.ceil(hoursRemaining * 60)} minutos)`);
        } else {
          console.log(`   ✅ Puede recibir un punto ahora`);
        }
      } else {
        console.log(`\n✅ No hay eventos QR_SCAN - puede recibir un punto`);
      }

      // Check for events without source (old/failed events)
      const eventsWithoutSource = events.filter(e => !e.source || e.source !== 'QR_SCAN');
      if (eventsWithoutSource.length > 0) {
        console.log(`\n⚠️  Eventos sin source o con source diferente a QR_SCAN: ${eventsWithoutSource.length}`);
        console.log('   Estos eventos NO bloquean el escaneo (solo QR_SCAN bloquea)');
      }
    } else {
      console.log('\n✅ No hay eventos registrados - puede recibir un punto');
    }

    // Get loyalty points
    const loyalty = await db.getOne('SELECT points, updated_at FROM loyalty_points WHERE customer_id = ?', [customerId]);
    if (loyalty) {
      console.log(`\n💰 Puntos actuales: ${loyalty.points}`);
      console.log(`   Última actualización: ${loyalty.updated_at}`);
    } else {
      console.log(`\n⚠️  No tiene registro en loyalty_points`);
    }

    db.close((err) => {
      if (err) console.error('Error closing database:', err);
      process.exit(0);
    });
  } catch (error) {
    console.error('❌ Error:', error);
    db.close();
    process.exit(1);
  }
}

checkEvents();
