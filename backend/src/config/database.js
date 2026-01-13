import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// RAILWAY COMPATIBLE: Use process.cwd() for absolute path
// In Railway, the working directory is the project root (where package.json is)
// So database/ is at backend/database/ relative to project root
const backendRoot = process.cwd();
const dbDir = path.resolve(backendRoot, 'database');

// UNIFIED DATABASE PATH - Used by ALL scripts
export const DB_PATH = path.resolve(dbDir, 'loyalty.db');
export const SCHEMA_PATH = path.resolve(dbDir, 'schema.sql');

// Log the actual path for verification
console.log('📁 DB_PATH:', DB_PATH);
console.log('📁 SCHEMA_PATH:', SCHEMA_PATH);

// Ensure database directory exists (already defined above, but ensure it exists)
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
  console.log('📁 Created database directory:', dbDir);
}

// Create database connection
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('❌ Error connecting to SQLite database:', err);
    throw err;
  }
  console.log('✅ Connected to SQLite database:', DB_PATH);
  
  // Enable foreign keys
  db.run('PRAGMA foreign_keys = ON', (err) => {
    if (err) {
      console.error('Error enabling foreign keys:', err);
    }
  });
});

// Promisify database methods for easier async/await usage
db.runAsync = promisify(db.run.bind(db));
db.getAsync = promisify(db.get.bind(db));
db.allAsync = promisify(db.all.bind(db));
db.execAsync = (sql) => {
  return new Promise((resolve, reject) => {
    db.exec(sql, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
};

// Helper method to run a query and get a single result
db.getOne = async (query, params = []) => {
  return await db.getAsync(query, params);
};

// Helper method to run a query and get all results
db.getAll = async (query, params = []) => {
  return await db.allAsync(query, params);
};

// Helper method to run a query (INSERT, UPDATE, DELETE)
// Returns an object with lastID and changes properties
db.runQuery = async (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(query, params, function(err) {
      if (err) {
        reject(err);
      } else {
        // 'this' is the Statement object with lastID and changes
        resolve({
          lastID: this.lastID,
          changes: this.changes
        });
      }
    });
  });
};

// Handle errors
db.on('error', (err) => {
  console.error('❌ Database error:', err);
});

export default db;
