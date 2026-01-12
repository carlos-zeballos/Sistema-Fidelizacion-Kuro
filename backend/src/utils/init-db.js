import db from '../config/database.js';
import { SCHEMA_PATH } from '../config/database.js';
import fs from 'fs';

/**
 * Initialize database with schema
 * Run this once to set up the database
 */
export async function initializeDatabase() {
  try {
    // Use unified SCHEMA_PATH from database.js
    if (!fs.existsSync(SCHEMA_PATH)) {
      throw new Error('Schema file not found: ' + SCHEMA_PATH);
    }

    console.log('📄 Reading schema from:', SCHEMA_PATH);
    const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
    
    // Remove single-line comments (-- comment)
    const lines = schema.split('\n');
    const cleanedLines = lines.map(line => {
      const commentIndex = line.indexOf('--');
      if (commentIndex >= 0) {
        return line.substring(0, commentIndex);
      }
      return line;
    });
    
    const cleanedSchema = cleanedLines.join('\n');
    
    // Split by semicolon, but preserve multi-line statements
    // First, normalize newlines and whitespace
    const normalized = cleanedSchema
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\n+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    // Split by semicolon
    const rawStatements = normalized
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    // Separate CREATE TABLE statements from CREATE INDEX statements
    const tableStatements = [];
    const indexStatements = [];
    const otherStatements = [];

    for (const statement of rawStatements) {
      const upper = statement.toUpperCase().trim();
      if (upper.startsWith('CREATE TABLE')) {
        tableStatements.push(statement);
      } else if (upper.startsWith('CREATE INDEX')) {
        indexStatements.push(statement);
      } else if (upper.startsWith('PRAGMA')) {
        otherStatements.push(statement);
      }
      // Skip INSERT statements (they're in comments in schema.sql)
    }

    console.log(`📊 Found ${tableStatements.length} CREATE TABLE statements`);
    console.log(`📊 Found ${indexStatements.length} CREATE INDEX statements`);
    console.log(`📊 Found ${otherStatements.length} PRAGMA statements`);
    
    // Log table names for debugging
    if (tableStatements.length > 0) {
      console.log('📋 Tables to create:', tableStatements.map(s => {
        const match = s.match(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)/i);
        return match ? match[1] : 'unknown';
      }).join(', '));
    }

    // Execute PRAGMA statements first
    for (const statement of otherStatements) {
      if (statement.trim()) {
        try {
          const cleanStatement = statement.trim().replace(/;$/, '');
          if (cleanStatement) {
            await db.runQuery(cleanStatement);
          }
        } catch (error) {
          // PRAGMA errors are usually safe to ignore
          if (!error.message.includes('already')) {
            console.warn('PRAGMA warning:', error.message);
          }
        }
      }
    }

    // Helper function to extract table name from CREATE TABLE statement
    function extractTableName(statement) {
      const match = statement.match(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)/i);
      return match ? match[1] : 'unknown';
    }
    
    // Execute CREATE TABLE statements
    for (const statement of tableStatements) {
      if (statement.trim()) {
        try {
          // Add semicolon back (we removed it when splitting)
          const finalStatement = statement.trim() + ';';
          const tableName = extractTableName(finalStatement);
          
          console.log(`📋 Creating table: ${tableName}`);
          await db.runQuery(finalStatement);
          console.log(`✅ Table created: ${tableName}`);
        } catch (error) {
          if (!error.message.includes('already exists') && 
              !error.message.includes('duplicate') &&
              !error.message.includes('already exist')) {
            console.error('❌ Error creating table:', error.message);
            console.error('Table:', extractTableName(statement));
            console.error('Statement preview:', statement.substring(0, 200));
            throw error; // Fail if table creation fails
          } else {
            console.log(`⚠️  Table already exists: ${extractTableName(statement)}`);
          }
        }
      }
    }

    // Execute CREATE INDEX statements (after tables exist)
    for (const statement of indexStatements) {
      if (statement.trim()) {
        try {
          // Add semicolon back (we removed it when splitting)
          const finalStatement = statement.trim() + ';';
          await db.runQuery(finalStatement);
        } catch (error) {
          // Ignore "already exists" and "no such table" errors for indexes
          if (!error.message.includes('already exists') && 
              !error.message.includes('duplicate') &&
              !error.message.includes('no such table')) {
            console.warn('⚠️  Warning creating index:', error.message);
            console.warn('Statement:', statement.substring(0, 100));
          }
        }
      }
    }

    console.log('✅ Database initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeDatabase().then(() => {
    process.exit(0);
  }).catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
