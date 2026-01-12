import db, { DB_PATH } from '../src/config/database.js';
import { generateQRToken } from '../src/services/qrToken.js';

console.log('📁 Using DB_PATH:', DB_PATH);

/**
 * Migration: Add QR tokens to customers that don't have them
 * This script:
 * 1. Finds all customers without qr_token or with null/empty qr_token
 * 2. Generates a unique QR token for each
 * 3. Updates the customer record
 */
async function migrate() {
  try {
    console.log('🔄 Starting migration: Add QR tokens to customers...');

    // Get all customers without qr_token or with null/empty qr_token
    const customers = await db.getAll(`
      SELECT id, full_name, email, qr_token 
      FROM customers 
      WHERE qr_token IS NULL OR qr_token = '' OR LENGTH(qr_token) != 64
    `);

    console.log(`📊 Found ${customers.length} customers without valid QR tokens`);

    if (customers.length === 0) {
      console.log('✅ All customers already have QR tokens');
      db.close((err) => {
        if (err) console.error('Error closing database:', err);
        process.exit(0);
      });
      return;
    }

    // Generate and assign QR tokens
    let updated = 0;
    for (const customer of customers) {
      let qrToken = generateQRToken();
      let attempts = 0;
      const maxAttempts = 10;

      // Ensure token is unique
      while (attempts < maxAttempts) {
        const existing = await db.getOne('SELECT id FROM customers WHERE qr_token = ?', [qrToken]);
        if (!existing) {
          break; // Token is unique
        }
        qrToken = generateQRToken();
        attempts++;
      }

      if (attempts >= maxAttempts) {
        console.error(`❌ Failed to generate unique token for customer ${customer.id} after ${maxAttempts} attempts`);
        continue;
      }

      // Update customer with new QR token
      await db.runQuery('UPDATE customers SET qr_token = ? WHERE id = ?', [qrToken, customer.id]);
      console.log(`✅ Asignado QR token a cliente ${customer.id} (${customer.full_name})`);
      updated++;
    }

    console.log(`✅ Migration completed successfully. Updated ${updated} customers.`);

    db.close((err) => {
      if (err) console.error('Error closing database:', err);
      process.exit(0);
    });
  } catch (error) {
    console.error('❌ Migration error:', error);
    db.close();
    process.exit(1);
  }
}

migrate();
