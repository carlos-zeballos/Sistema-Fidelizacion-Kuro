import db, { DB_PATH } from '../src/config/database.js';

console.log('📁 Using DB_PATH:', DB_PATH);

/**
 * Migration: Add push notification and location fields to customers and promotions
 */
async function migrate() {
  try {
    console.log('🔄 Starting migration: Add push notification fields...\n');

    // Check and add fields to customers table
    const customerColumns = await db.getAll("PRAGMA table_info(customers)");
    const customerColumnNames = customerColumns.map(col => col.name);

    const customerFieldsToAdd = [
      { name: 'last_point_at', type: 'TEXT' },
      { name: 'last_nearby_push_at', type: 'TEXT' },
      { name: 'last_mandatory_push_at', type: 'TEXT' },
      { name: 'last_location_lat', type: 'REAL' },
      { name: 'last_location_lng', type: 'REAL' },
      { name: 'last_location_at', type: 'TEXT' }
    ];

    for (const field of customerFieldsToAdd) {
      if (!customerColumnNames.includes(field.name)) {
        console.log(`📊 Adding ${field.name} to customers table...`);
        await db.runQuery(`ALTER TABLE customers ADD COLUMN ${field.name} ${field.type}`);
        console.log(`✅ Added ${field.name}`);
      } else {
        console.log(`✅ Column ${field.name} already exists`);
      }
    }

    // Check and add fields to promotions table
    const promotionColumns = await db.getAll("PRAGMA table_info(promotions)");
    const promotionColumnNames = promotionColumns.map(col => col.name);

    const promotionFieldsToAdd = [
      { name: 'push_title', type: 'TEXT' },
      { name: 'push_message', type: 'TEXT' },
      { name: 'cta_url', type: 'TEXT' },
      { name: 'audience', type: 'TEXT DEFAULT "ALL"' }
    ];

    for (const field of promotionFieldsToAdd) {
      if (!promotionColumnNames.includes(field.name)) {
        console.log(`📊 Adding ${field.name} to promotions table...`);
        if (field.name === 'audience') {
          await db.runQuery(`ALTER TABLE promotions ADD COLUMN ${field.name} ${field.type} CHECK(${field.name} IN ('ALL', 'NEARBY', 'REACTIVATION'))`);
        } else {
          await db.runQuery(`ALTER TABLE promotions ADD COLUMN ${field.name} ${field.type}`);
        }
        console.log(`✅ Added ${field.name}`);
      } else {
        console.log(`✅ Column ${field.name} already exists`);
      }
    }

    // Create push_notifications_log table if it doesn't exist
    const tables = await db.getAll("SELECT name FROM sqlite_master WHERE type='table' AND name='push_notifications_log'");
    if (tables.length === 0) {
      console.log('📊 Creating push_notifications_log table...');
      await db.runQuery(`
        CREATE TABLE IF NOT EXISTS push_notifications_log (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          customer_id INTEGER NOT NULL,
          promotion_id INTEGER,
          notification_type TEXT NOT NULL CHECK(notification_type IN ('NEARBY', 'MANDATORY_56H', 'MANUAL')),
          push_title TEXT NOT NULL,
          push_message TEXT NOT NULL,
          cta_url TEXT,
          sent_at TEXT NOT NULL DEFAULT (datetime('now')),
          success INTEGER NOT NULL DEFAULT 1,
          error_message TEXT,
          FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
          FOREIGN KEY (promotion_id) REFERENCES promotions(id) ON DELETE SET NULL
        )
      `);
      console.log('✅ Created push_notifications_log table');

      // Create indexes
      await db.runQuery('CREATE INDEX IF NOT EXISTS idx_push_notifications_log_customer_id ON push_notifications_log(customer_id)');
      await db.runQuery('CREATE INDEX IF NOT EXISTS idx_push_notifications_log_sent_at ON push_notifications_log(sent_at)');
      console.log('✅ Created indexes');
    } else {
      console.log('✅ push_notifications_log table already exists');
    }

    // Update existing promotions to have audience = 'ALL' if NULL
    const nullAudience = await db.getAll("SELECT id FROM promotions WHERE audience IS NULL");
    if (nullAudience.length > 0) {
      console.log(`📊 Updating ${nullAudience.length} promotions with NULL audience to 'ALL'...`);
      await db.runQuery("UPDATE promotions SET audience = 'ALL' WHERE audience IS NULL");
      console.log('✅ Updated promotions');
    }

    console.log('\n✅ Migration completed successfully');

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
