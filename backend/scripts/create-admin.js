import bcrypt from 'bcrypt';
import db, { DB_PATH } from '../src/config/database.js';

console.log('📁 Using DB_PATH:', DB_PATH);

/**
 * Create admin user
 * Usage: node scripts/create-admin.js <username> <password>
 */
async function createAdmin() {
  const username = process.argv[2];
  const password = process.argv[3];

  if (!username || !password) {
    console.error('Usage: node scripts/create-admin.js <username> <password>');
    process.exit(1);
  }

  try {
    // Check if user exists
    const existing = await db.getOne('SELECT id FROM staff WHERE username = ?', [username]);
    if (existing) {
      console.error(`❌ Usuario "${username}" ya existe`);
      process.exit(1);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Insert admin
    const result = await db.runQuery(`
      INSERT INTO staff (username, password_hash, role)
      VALUES (?, ?, 'ADMIN')
    `, [username, passwordHash]);

    console.log(`✅ Admin creado exitosamente!`);
    console.log(`   Usuario: ${username}`);
    console.log(`   ID: ${result.lastID}`);
    
    // Close database connection
    db.close((err) => {
      if (err) console.error('Error closing database:', err);
      process.exit(0);
    });
  } catch (error) {
    console.error('❌ Error creando admin:', error);
    db.close();
    process.exit(1);
  }
}

createAdmin();
