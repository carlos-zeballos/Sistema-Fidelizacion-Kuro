import express from 'express';
import 'dotenv/config';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import customerRoutes from './routes/customer.js';
import authRoutes from './routes/auth.js';
import promotionsRoutes from './routes/promotions.js';
import adminRoutes from './routes/admin.js';
import qrRoutes from './routes/qr.js';
import publicRoutes from './routes/public.js';
import pushRoutes from './routes/push.js';
import db, { DB_PATH } from './config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// CORS configuration for Railway + Hostinger static frontend
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5500',
  'http://127.0.0.1:5500',
].filter(Boolean);

// Also add www version if FRONTEND_URL is set and doesn't include www
if (process.env.FRONTEND_URL && !process.env.FRONTEND_URL.includes('www.')) {
  const wwwUrl = process.env.FRONTEND_URL.replace(/^https?:\/\//, 'https://www.');
  allowedOrigins.push(wwwUrl);
}

// Middleware
app.use(cors({
  origin: (origin, cb) => {
    // Permite llamadas sin origin (Postman, curl, server-to-server)
    if (!origin) return cb(null, true);

    if (allowedOrigins.includes(origin)) return cb(null, true);
    console.warn(`CORS blocked for origin: ${origin}`);
    console.warn(`Allowed origins: ${allowedOrigins.join(', ')}`);
    return cb(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
}));

// Important: Enable OPTIONS (preflight) for all routes
app.options('*', cors());
app.use(express.json());
app.use(cookieParser());

// NO servir archivos estáticos - Frontend está en Hostinger

// Routes
app.use('/api/customers', customerRoutes);
app.use('/api', authRoutes);
app.use('/api', promotionsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/qr', qrRoutes);
app.use('/api/public', publicRoutes); // Public routes (register QR, etc.)
app.use('/api/push', pushRoutes); // Push notification routes
app.use('/', qrRoutes); // QR code landing pages

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

// Test database connection and initialize
async function startServer() {
  try {
    // Always try to initialize database on startup
    console.log('📊 Verificando base de datos...');
    console.log('📁 Using DB_PATH:', DB_PATH);
    
    // Check if database file exists (using unified DB_PATH)
    const dbExists = fs.existsSync(DB_PATH);
    console.log(`📁 Database file exists: ${dbExists}`);
    
    if (!dbExists) {
      console.log('📊 Base de datos no encontrada. Inicializando...');
      const { initializeDatabase } = await import('./utils/init-db.js');
      await initializeDatabase();
      console.log('✅ Base de datos inicializada');
    } else {
      // Test database connection
      try {
        await db.getOne('SELECT 1');
        console.log('✅ Database connection successful');
        
        // Check if tables exist
        const tables = await db.getAll("SELECT name FROM sqlite_master WHERE type='table'");
        if (tables.length === 0) {
          console.log('📊 Tablas no encontradas. Inicializando schema...');
          const { initializeDatabase } = await import('./utils/init-db.js');
          await initializeDatabase();
          console.log('✅ Schema inicializado');
        } else {
          console.log(`📊 Database ready (${tables.length} tables found)`);
          // Verify critical tables exist
          const tableNames = tables.map(t => t.name);
          const requiredTables = ['customers', 'loyalty_points', 'staff', 'promotions', 'otp_codes'];
          const missingTables = requiredTables.filter(t => !tableNames.includes(t));
          if (missingTables.length > 0) {
            console.log(`⚠️  Faltan tablas: ${missingTables.join(', ')}. Reinicializando...`);
            const { initializeDatabase } = await import('./utils/init-db.js');
            await initializeDatabase();
            console.log('✅ Base de datos reinicializada');
          }
        }
      } catch (dbError) {
        console.error('❌ Database error:', dbError.message);
        console.log('📊 Intentando inicializar base de datos...');
        try {
          const { initializeDatabase } = await import('./utils/init-db.js');
          await initializeDatabase();
          console.log('✅ Base de datos inicializada después del error');
        } catch (initError) {
          console.error('❌ No se pudo inicializar la base de datos:', initError.message);
          console.error('Stack:', initError.stack);
          throw initError;
        }
      }
    }
    
    // Start server
    app.listen(PORT, () => {
      console.log('\n🚀 Server running successfully!');
      console.log(`📍 Port: ${PORT}`);
      console.log(`🌐 Backend URL: ${process.env.RAILWAY_PUBLIC_DOMAIN || `http://localhost:${PORT}`}`);
      console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
      console.log(`💚 Health check: ${process.env.RAILWAY_PUBLIC_DOMAIN || `http://localhost:${PORT}`}/health`);
      console.log('\n✨ Sistema de Fidelización listo para usar!\n');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    console.error('\n⚠️  Verifica:');
    console.error('   1. Que tengas permisos de escritura en la carpeta database');
    console.error('   2. Que el archivo database/schema.sql exista');
    console.error('   3. Revisa los logs arriba para más detalles\n');
    process.exit(1);
  }
}

startServer();
