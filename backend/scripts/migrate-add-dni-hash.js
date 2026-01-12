import db, { DB_PATH } from '../src/config/database.js';
import bcrypt from 'bcrypt';

console.log('📁 Using DB_PATH:', DB_PATH);

/**
 * Migration: Add dni_hash column to customers table
 * This script:
 * 1. Adds dni_hash column if it doesn't exist
 * 2. Hashes existing DNI values for existing customers
 */
async function migrate() {
  try {
    console.log('🔄 Starting migration: Add dni_hash column...');

    // Check if column already exists
    const tableInfo = await db.getAll("PRAGMA table_info(customers)");
    const hasDniHash = tableInfo.some(col => col.name === 'dni_hash');

    if (!hasDniHash) {
      console.log('📊 Adding dni_hash column...');
      // Add column (SQLite doesn't support ALTER TABLE ADD COLUMN with NOT NULL directly)
      // So we'll add it as nullable first, then update values, then make it NOT NULL
      await db.runQuery('ALTER TABLE customers ADD COLUMN dni_hash TEXT');
      console.log('✅ Column added');
    } else {
      console.log('✅ Column dni_hash already exists');
    }

    // Get all customers without dni_hash or with null dni_hash
    const customers = await db.getAll(`
      SELECT id, dni FROM customers 
      WHERE dni_hash IS NULL OR dni_hash = ''
    `);

    console.log(`📊 Found ${customers.length} customers to migrate`);

    // Hash DNI for each customer
    for (const customer of customers) {
      if (customer.dni) {
        const dniHash = await bcrypt.hash(customer.dni, 10);
        await db.runQuery('UPDATE customers SET dni_hash = ? WHERE id = ?', [dniHash, customer.id]);
        console.log(`✅ Migrated customer ID: ${customer.id}`);
      }
    }

    // Now make the column NOT NULL (SQLite doesn't support this directly, but we can verify)
    // For new customers, we'll ensure dni_hash is always set during INSERT
    console.log('✅ Migration completed successfully');
    
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
