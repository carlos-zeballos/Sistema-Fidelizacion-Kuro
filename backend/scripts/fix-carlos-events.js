import db, { DB_PATH } from '../src/config/database.js';

console.log('📁 Using DB_PATH:', DB_PATH);

/**
 * Script para limpiar eventos fallidos y corregir el estado de Carlos
 * Este script:
 * 1. Verifica si hay eventos QR_SCAN sin puntos correspondientes
 * 2. Elimina eventos fallidos
 * 3. Crea registro en loyalty_points si no existe
 */
async function fixCarlos() {
  try {
    const customerId = 1; // Carlos
    
    console.log('🔧 Corrigiendo estado del cliente Carlos (ID: 1)...\n');

    // Get customer info
    const customer = await db.getOne('SELECT id, full_name FROM customers WHERE id = ?', [customerId]);
    
    if (!customer) {
      console.log(`❌ Cliente con ID ${customerId} no encontrado`);
      db.close();
      process.exit(1);
    }

    console.log(`👤 Cliente: ${customer.full_name} (ID: ${customer.id})\n`);

    // Check loyalty_points
    const loyalty = await db.getOne('SELECT points FROM loyalty_points WHERE customer_id = ?', [customerId]);
    
    if (!loyalty) {
      console.log('📊 Creando registro en loyalty_points...');
      await db.runQuery('INSERT INTO loyalty_points (customer_id, points) VALUES (?, 0)', [customerId]);
      console.log('✅ Registro creado con 0 puntos\n');
    } else {
      console.log(`💰 Puntos actuales: ${loyalty.points}\n`);
    }

    // Get all QR_SCAN events
    const qrScanEvents = await db.getAll(`
      SELECT id, created_at 
      FROM point_events 
      WHERE customer_id = ? AND source = 'QR_SCAN'
      ORDER BY created_at DESC
    `, [customerId]);

    console.log(`📋 Eventos QR_SCAN encontrados: ${qrScanEvents.length}`);

    if (qrScanEvents.length > 0) {
      // Check if points match events
      const currentPoints = loyalty ? loyalty.points : 0;
      
      if (currentPoints < qrScanEvents.length) {
        console.log(`\n⚠️  PROBLEMA DETECTADO:`);
        console.log(`   - Eventos QR_SCAN: ${qrScanEvents.length}`);
        console.log(`   - Puntos actuales: ${currentPoints}`);
        console.log(`   - Diferencia: ${qrScanEvents.length - currentPoints} eventos sin punto correspondiente\n`);
        
        console.log('🗑️  Eliminando eventos fallidos...');
        
        // Delete all QR_SCAN events (they're all invalid since points don't match)
        const deleteResult = await db.runQuery(`
          DELETE FROM point_events 
          WHERE customer_id = ? AND source = 'QR_SCAN'
        `, [customerId]);
        
        console.log(`✅ Eliminados ${deleteResult.changes} eventos fallidos\n`);
        
        // Reset points to 0 if they don't match
        if (currentPoints > 0) {
          console.log('🔄 Reseteando puntos a 0 (no coinciden con eventos)...');
          await db.runQuery('UPDATE loyalty_points SET points = 0, updated_at = datetime("now") WHERE customer_id = ?', [customerId]);
          console.log('✅ Puntos reseteados\n');
        }
      } else {
        console.log(`✅ Los puntos (${currentPoints}) coinciden con los eventos (${qrScanEvents.length})\n`);
        console.log('⚠️  Pero hay eventos que pueden estar bloqueando. ¿Deseas eliminarlos?');
        console.log('   (Esto permitirá escanear el QR inmediatamente)\n');
        
        // Delete all QR_SCAN events to allow immediate scanning
        console.log('🗑️  Eliminando todos los eventos QR_SCAN para permitir escaneo inmediato...');
        const deleteResult = await db.runQuery(`
          DELETE FROM point_events 
          WHERE customer_id = ? AND source = 'QR_SCAN'
        `, [customerId]);
        console.log(`✅ Eliminados ${deleteResult.changes} eventos\n`);
      }
    } else {
      console.log('✅ No hay eventos QR_SCAN - estado limpio\n');
    }

    // Verify final state
    const finalLoyalty = await db.getOne('SELECT points FROM loyalty_points WHERE customer_id = ?', [customerId]);
    const finalEvents = await db.getAll('SELECT COUNT(*) as count FROM point_events WHERE customer_id = ? AND source = "QR_SCAN"', [customerId]);
    
    console.log('📊 Estado final:');
    console.log(`   - Puntos: ${finalLoyalty ? finalLoyalty.points : 0}`);
    console.log(`   - Eventos QR_SCAN: ${finalEvents[0]?.count || 0}`);
    console.log(`\n✅ Cliente Carlos está listo para recibir puntos\n`);

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

fixCarlos();
