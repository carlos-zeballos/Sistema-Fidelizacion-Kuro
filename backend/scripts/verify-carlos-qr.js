import db, { DB_PATH } from '../src/config/database.js';
import { generateQRDataURL } from '../src/services/qrImage.js';

console.log('📁 Using DB_PATH:', DB_PATH);

/**
 * Script para verificar el QR de Carlos
 */
async function verifyQR() {
  try {
    const customerId = 1; // Carlos
    
    console.log('🔍 Verificando QR del cliente Carlos (ID: 1)...\n');

    // Get customer info
    const customer = await db.getOne('SELECT id, full_name, qr_token FROM customers WHERE id = ?', [customerId]);
    
    if (!customer) {
      console.log(`❌ Cliente con ID ${customerId} no encontrado`);
      db.close();
      process.exit(1);
    }

    console.log(`👤 Cliente: ${customer.full_name} (ID: ${customer.id})`);
    console.log(`🔑 QR Token: ${customer.qr_token || 'NO TIENE'}`);
    console.log(`🔑 QR Token Length: ${customer.qr_token ? customer.qr_token.length : 0} caracteres\n`);

    if (!customer.qr_token || customer.qr_token.length !== 64) {
      console.log('❌ ERROR: El token QR no es válido (debe tener 64 caracteres hex)');
      db.close();
      process.exit(1);
    }

    // Build QR URL
    const baseUrl = process.env.APP_BASE_URL || 'http://localhost:3000';
    const qrUrl = `${baseUrl}/c/${customer.qr_token}`;
    
    console.log('📱 URL del QR que se genera:');
    console.log(`   ${qrUrl}\n`);
    console.log('📏 Longitud de la URL:', qrUrl.length, 'caracteres\n');

    // Verify token format
    const tokenMatch = qrUrl.match(/\/c\/([a-f0-9]{64})/i);
    if (tokenMatch && tokenMatch[1]) {
      console.log('✅ Formato de URL válido');
      console.log(`   Token extraído: ${tokenMatch[1].substring(0, 16)}...\n`);
    } else {
      console.log('❌ ERROR: No se puede extraer el token de la URL generada\n');
    }

    // Try to generate QR image to verify it works
    try {
      console.log('🖼️  Generando imagen QR para verificar...');
      const qrImageData = await generateQRDataURL(qrUrl);
      console.log('✅ QR generado exitosamente');
      console.log(`   Tamaño base64: ${qrImageData.substring(0, 50)}... (${qrImageData.length} caracteres)\n`);
    } catch (error) {
      console.error('❌ Error generando QR:', error.message);
    }

    // Test regex patterns that the scanner uses
    console.log('🧪 Probando patrones de extracción del scanner:\n');
    
    const patterns = [
      { name: 'Patrón 1: /c/<token>', regex: /\/c\/([a-f0-9]{64})/i },
      { name: 'Patrón 2: c/<token>', regex: /c\/([a-f0-9]{64})/i },
      { name: 'Patrón 3: Token directo', regex: /^[a-f0-9]{64}$/i },
      { name: 'Patrón 4: Cualquier 64 hex', regex: /([a-f0-9]{64})/i },
      { name: 'Patrón 5: Query/fragment', regex: /[\/\?&#]([a-f0-9]{64})/i },
      { name: 'Patrón 6: Después de : o /', regex: /[:\/]([a-f0-9]{64})/i }
    ];

    patterns.forEach((pattern, index) => {
      const match = qrUrl.match(pattern.regex);
      if (match && match[1] && match[1].length === 64) {
        console.log(`   ✅ ${pattern.name}: FUNCIONA - Token: ${match[1].substring(0, 16)}...`);
      } else {
        console.log(`   ❌ ${pattern.name}: NO FUNCIONA`);
      }
    });

    console.log('\n✅ Verificación completada\n');

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

verifyQR();
