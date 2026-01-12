import express from 'express';
import db from '../config/database.js';
import { generateQRToken } from '../services/qrToken.js';
import { generateQRDataURL } from '../services/qrImage.js';
import { isValidEmail, isValidPhone, isValidBirthdate, sanitizeInput } from '../utils/validators.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const router = express.Router();

const CUSTOMER_SECRET = process.env.JWT_SECRET_CUSTOMER || 'customer-secret-change-in-production';

/**
 * POST /api/customers/register
 * Register a new customer
 */
router.post('/register', async (req, res) => {
  try {
    const { fullName, email, phone, dni, sex, birthdate, marketingOptIn } = req.body;

    // Validation
    if (!fullName || fullName.trim().length < 2) {
      return res.status(400).json({ error: 'Full name is required (min 2 characters)' });
    }

    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ error: 'Valid email is required' });
    }

    if (!phone || !isValidPhone(phone)) {
      return res.status(400).json({ error: 'Valid phone number is required' });
    }

    if (!dni || dni.trim().length < 8) {
      return res.status(400).json({ error: 'Valid DNI is required (min 8 characters)' });
    }

    if (!sex || !['M', 'F', 'O'].includes(sex.toUpperCase())) {
      return res.status(400).json({ error: 'Sex is required (M, F, or O)' });
    }

    if (!birthdate || !isValidBirthdate(birthdate)) {
      return res.status(400).json({ error: 'Valid birthdate is required' });
    }

    // Sanitize inputs
    const sanitizedFullName = sanitizeInput(fullName);
    const sanitizedEmail = email.toLowerCase().trim();
    const sanitizedPhone = phone.trim();
    const sanitizedDni = dni.trim();
    const sanitizedSex = sex.toUpperCase();

    // Check for existing email, phone, or DNI - identify which field is duplicate
    const existingEmail = await db.getOne('SELECT id FROM customers WHERE email = ?', [sanitizedEmail]);
    if (existingEmail) {
      return res.status(409).json({ 
        error: 'CONFLICT',
        field: 'email',
        message: 'Este correo electrónico ya está registrado'
      });
    }

    const existingDni = await db.getOne('SELECT id FROM customers WHERE dni = ?', [sanitizedDni]);
    if (existingDni) {
      return res.status(409).json({ 
        error: 'CONFLICT',
        field: 'dni',
        message: 'Este DNI ya está registrado'
      });
    }

    const existingPhone = await db.getOne('SELECT id FROM customers WHERE phone = ?', [sanitizedPhone]);
    if (existingPhone) {
      return res.status(409).json({ 
        error: 'CONFLICT',
        field: 'phone',
        message: 'Este teléfono ya está registrado'
      });
    }

    // Generate QR token
    const qrToken = generateQRToken();
    const baseUrl = process.env.APP_BASE_URL || 'http://localhost:3000';
    const qrUrl = `${baseUrl}/c/${qrToken}`;

    // Generate QR image
    const qrImageData = await generateQRDataURL(qrUrl);

    // Hash DNI for login
    const dniHash = await bcrypt.hash(sanitizedDni, 10);

    // Insert customer
    const result = await db.runQuery(`
      INSERT INTO customers (full_name, email, phone, dni, dni_hash, sex, birthdate, marketing_opt_in, qr_token)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      sanitizedFullName,
      sanitizedEmail,
      sanitizedPhone,
      sanitizedDni,
      dniHash,
      sanitizedSex,
      birthdate,
      marketingOptIn ? 1 : 0,
      qrToken
    ]);

    const customerId = result.lastID;

    // Create loyalty_points record
    await db.runQuery('INSERT INTO loyalty_points (customer_id, points) VALUES (?, 0)', [customerId]);

    // Generate customer token
    const customerToken = jwt.sign(
      { sub: customerId, typ: 'customer' },
      CUSTOMER_SECRET,
      { expiresIn: '30d' }
    );

    // Set cookie
    res.cookie('customerToken', customerToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    res.status(201).json({
      message: 'Customer registered successfully',
      customer: {
        id: customerId,
        fullName: sanitizedFullName,
        email: sanitizedEmail,
        phone: sanitizedPhone,
        dni: sanitizedDni,
        sex: sanitizedSex,
        birthdate
      },
      token: customerToken,
      qrToken,
      qrUrl,
      qrImageData
    });
  } catch (error) {
    console.error('❌ Error registering customer:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    // Check for specific database errors
    if (error.message && (error.message.includes('UNIQUE constraint') || error.message.includes('UNIQUE'))) {
      // Try to identify which field caused the constraint violation
      let field = 'email';
      let message = 'Este correo electrónico ya está registrado';
      
      if (error.message.includes('dni') || error.message.includes('customers.dni')) {
        field = 'dni';
        message = 'Este DNI ya está registrado';
      } else if (error.message.includes('phone') || error.message.includes('customers.phone')) {
        field = 'phone';
        message = 'Este teléfono ya está registrado';
      } else if (error.message.includes('email') || error.message.includes('customers.email')) {
        field = 'email';
        message = 'Este correo electrónico ya está registrado';
      }
      
      return res.status(409).json({ 
        error: 'CONFLICT',
        field: field,
        message: message
      });
    }
    
    if (error.message && (error.message.includes('no such table') || error.message.includes('SQLITE_ERROR'))) {
      console.error('⚠️  Database tables not found. Attempting to initialize...');
      console.error('Error details:', error.message);
      try {
        const { initializeDatabase } = await import('../utils/init-db.js');
        await initializeDatabase();
        console.log('✅ Database initialized automatically. Retrying registration...');
        
        // Retry the registration immediately after initialization
        try {
          // Re-execute the registration logic
          const { fullName, email, phone, dni, sex, birthdate, marketingOptIn } = req.body;
          
          // Validation (same as before)
          if (!fullName || fullName.trim().length < 2) {
            return res.status(400).json({ error: 'Full name is required (min 2 characters)' });
          }
          if (!email || !isValidEmail(email)) {
            return res.status(400).json({ error: 'Valid email is required' });
          }
          if (!phone || !isValidPhone(phone)) {
            return res.status(400).json({ error: 'Valid phone number is required' });
          }
          if (!dni || dni.trim().length < 8) {
            return res.status(400).json({ error: 'Valid DNI is required (min 8 characters)' });
          }
          if (!sex || !['M', 'F', 'O'].includes(sex.toUpperCase())) {
            return res.status(400).json({ error: 'Sex is required (M, F, or O)' });
          }
          if (!birthdate || !isValidBirthdate(birthdate)) {
            return res.status(400).json({ error: 'Valid birthdate is required' });
          }
          
          // Sanitize inputs
          const sanitizedFullName = sanitizeInput(fullName);
          const sanitizedEmail = email.toLowerCase().trim();
          const sanitizedPhone = phone.trim();
          const sanitizedDni = dni.trim();
          const sanitizedSex = sex.toUpperCase();
          
          // Check for existing email, phone, or DNI - identify which field is duplicate
          const existingEmail = await db.getOne('SELECT id FROM customers WHERE email = ?', [sanitizedEmail]);
          if (existingEmail) {
            return res.status(409).json({ 
              error: 'CONFLICT',
              field: 'email',
              message: 'Este correo electrónico ya está registrado'
            });
          }

          const existingDni = await db.getOne('SELECT id FROM customers WHERE dni = ?', [sanitizedDni]);
          if (existingDni) {
            return res.status(409).json({ 
              error: 'CONFLICT',
              field: 'dni',
              message: 'Este DNI ya está registrado'
            });
          }

          const existingPhone = await db.getOne('SELECT id FROM customers WHERE phone = ?', [sanitizedPhone]);
          if (existingPhone) {
            return res.status(409).json({ 
              error: 'CONFLICT',
              field: 'phone',
              message: 'Este teléfono ya está registrado'
            });
          }
          
          // Generate QR token
          const qrToken = generateQRToken();
          const baseUrl = process.env.APP_BASE_URL || 'http://localhost:3000';
          const qrUrl = `${baseUrl}/c/${qrToken}`;
          
          // Generate QR image
          const qrImageData = await generateQRDataURL(qrUrl);
          
          // Hash DNI for login
          const dniHash = await bcrypt.hash(sanitizedDni, 10);
          
          // Insert customer
          const result = await db.runQuery(`
            INSERT INTO customers (full_name, email, phone, dni, dni_hash, sex, birthdate, marketing_opt_in, qr_token)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            sanitizedFullName,
            sanitizedEmail,
            sanitizedPhone,
            sanitizedDni,
            dniHash,
            sanitizedSex,
            birthdate,
            marketingOptIn ? 1 : 0,
            qrToken
          ]);
          
          const customerId = result.lastID;
          
          // Create loyalty_points record
          await db.runQuery('INSERT INTO loyalty_points (customer_id, points) VALUES (?, 0)', [customerId]);
          
          // Generate customer token
          const customerToken = jwt.sign(
            { sub: customerId, typ: 'customer' },
            CUSTOMER_SECRET,
            { expiresIn: '30d' }
          );
          
          // Set cookie
          res.cookie('customerToken', customerToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
          });
          
          return res.status(201).json({
            message: 'Customer registered successfully',
            customer: {
              id: customerId,
              fullName: sanitizedFullName,
              email: sanitizedEmail,
              phone: sanitizedPhone,
              dni: sanitizedDni,
              sex: sanitizedSex,
              birthdate
            },
            token: customerToken,
            qrToken,
            qrUrl,
            qrImageData
          });
        } catch (retryError) {
          console.error('❌ Error retrying registration after init:', retryError);
          return res.status(500).json({ 
            error: 'Failed to register after database initialization',
            message: retryError.message,
            details: process.env.NODE_ENV === 'development' ? retryError.stack : undefined
          });
        }
      } catch (initError) {
        console.error('❌ Failed to auto-initialize database:', initError);
        console.error('Init error details:', initError.message);
        console.error('Init error stack:', initError.stack);
        return res.status(500).json({ 
          error: 'Database not initialized',
          message: 'Failed to initialize database. Please check server logs.',
          details: process.env.NODE_ENV === 'development' ? initError.message : undefined
        });
      }
    }
    
    res.status(500).json({ 
      error: 'Failed to register customer',
      message: error.message || 'Unknown error occurred',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * POST /api/customers/login
 * Customer login with email and DNI
 */
router.post('/login', async (req, res) => {
  try {
    const { email, dni } = req.body;

    if (!email || !dni) {
      return res.status(400).json({ error: 'Email and DNI are required' });
    }

    // Find customer by email
    let customer;
    try {
      customer = await db.getOne(`
        SELECT id, full_name, email, dni, dni_hash, qr_token
        FROM customers WHERE email = ?
      `, [email.toLowerCase().trim()]);
    } catch (dbError) {
      // If column doesn't exist, try without dni_hash
      if (dbError.message && dbError.message.includes('no such column: dni_hash')) {
        console.log('⚠️  Column dni_hash not found. Running migration...');
        // Try to get customer without dni_hash
        customer = await db.getOne(`
          SELECT id, full_name, email, dni, qr_token
          FROM customers WHERE email = ?
        `, [email.toLowerCase().trim()]);
        
        if (customer) {
          // Add dni_hash column and hash the DNI
          try {
            await db.runQuery('ALTER TABLE customers ADD COLUMN dni_hash TEXT');
          } catch (alterError) {
            // Column might already exist or other error
            if (!alterError.message.includes('duplicate column')) {
              console.error('Error adding dni_hash column:', alterError);
            }
          }
          
          const dniHash = await bcrypt.hash(customer.dni, 10);
          await db.runQuery('UPDATE customers SET dni_hash = ? WHERE id = ?', [dniHash, customer.id]);
          customer.dni_hash = dniHash;
        }
      } else {
        throw dbError;
      }
    }

    if (!customer) {
      return res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'Credenciales incorrectas'
      });
    }

    // Check if dni_hash exists (for migrated customers)
    if (!customer.dni_hash) {
      // If no hash exists, hash the current DNI and update
      const dniHash = await bcrypt.hash(customer.dni, 10);
      try {
        await db.runQuery('UPDATE customers SET dni_hash = ? WHERE id = ?', [dniHash, customer.id]);
      } catch (updateError) {
        // If column doesn't exist, add it first
        if (updateError.message && updateError.message.includes('no such column: dni_hash')) {
          await db.runQuery('ALTER TABLE customers ADD COLUMN dni_hash TEXT');
          await db.runQuery('UPDATE customers SET dni_hash = ? WHERE id = ?', [dniHash, customer.id]);
        } else {
          throw updateError;
        }
      }
      customer.dni_hash = dniHash;
    }

    // Compare DNI with hash
    const isValid = await bcrypt.compare(dni.trim(), customer.dni_hash);

    if (!isValid) {
      return res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'Credenciales incorrectas'
      });
    }

    // Generate customer token
    const customerToken = jwt.sign(
      { sub: customer.id, typ: 'customer' },
      CUSTOMER_SECRET,
      { expiresIn: '30d' }
    );

    // Set cookie
    res.cookie('customerToken', customerToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    res.json({
      token: customerToken,
      message: 'Login successful'
    });
  } catch (error) {
    console.error('❌ Error in customer login:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    // If it's a database error about missing column, try to fix it
    if (error.message && error.message.includes('no such column: dni_hash')) {
      try {
        console.log('⚠️  Column dni_hash not found. Adding it automatically...');
        await db.runQuery('ALTER TABLE customers ADD COLUMN dni_hash TEXT');
        console.log('✅ Column dni_hash added. Please try login again.');
        return res.status(500).json({ 
          error: 'Database migration needed',
          message: 'The database has been updated. Please try logging in again.'
        });
      } catch (migrationError) {
        console.error('❌ Failed to add dni_hash column:', migrationError);
        return res.status(500).json({ 
          error: 'Database error',
          message: 'Please run migration: node backend/scripts/migrate-add-dni-hash.js'
        });
      }
    }
    
    res.status(500).json({ 
      error: 'Failed to login',
      message: error.message || 'Unknown error occurred',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * GET /api/customers/me
 * Get current customer profile
 */
router.get('/me', authenticateCustomer, async (req, res) => {
  try {
    const customerId = req.customerId;

    // Get customer data
    const customer = await db.getOne(`
      SELECT id, full_name, email, phone, dni, sex, birthdate, marketing_opt_in, qr_token, created_at
      FROM customers WHERE id = ?
    `, [customerId]);

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Get loyalty points
    const loyalty = await db.getOne('SELECT points, updated_at FROM loyalty_points WHERE customer_id = ?', [customerId]) || {
      points: 0,
      updated_at: null
    };

    // Build QR URL
    const baseUrl = process.env.APP_BASE_URL || 'http://localhost:3000';
    const qrUrl = `${baseUrl}/c/${customer.qr_token}`;

    // Generate QR image
    const qrImageData = await generateQRDataURL(qrUrl);

    // Get active promotions
    const now = new Date().toISOString();
    const promotions = await db.getAll(`
      SELECT id, title, description, image_url, start_at, end_at, created_at
      FROM promotions
      WHERE active = 1
        AND (start_at IS NULL OR start_at <= ?)
        AND (end_at IS NULL OR end_at >= ?)
      ORDER BY created_at DESC
    `, [now, now]);

    res.json({
      customer: {
        id: customer.id,
        fullName: customer.full_name,
        email: customer.email,
        phone: customer.phone,
        dni: customer.dni,
        sex: customer.sex,
        birthdate: customer.birthdate,
        marketingOptIn: customer.marketing_opt_in === 1,
        createdAt: customer.created_at
      },
      loyalty: {
        points: loyalty.points || 0,
        updatedAt: loyalty.updated_at || null
      },
      qrToken: customer.qr_token,
      qrUrl,
      qrImageData,
      promotions: promotions.map(p => ({
        id: p.id,
        title: p.title,
        description: p.description,
        imageUrl: p.image_url,
        startAt: p.start_at,
        endAt: p.end_at,
        createdAt: p.created_at
      }))
    });
  } catch (error) {
    console.error('Error getting customer profile:', error);
    res.status(500).json({ error: 'Failed to get customer profile' });
  }
});

/**
 * POST /api/customers/location
 * Receive customer location and evaluate nearby notification rule
 */
router.post('/location', authenticateCustomer, async (req, res) => {
  try {
    const customerId = req.customerId;
    const { lat, lng } = req.body;

    if (!lat || !lng || typeof lat !== 'number' || typeof lng !== 'number') {
      return res.status(400).json({ error: 'Valid latitude and longitude are required' });
    }

    // Actualizar última ubicación del cliente
    await db.runQuery(`
      UPDATE customers 
      SET last_location_lat = ?, last_location_lng = ?, last_location_at = datetime('now')
      WHERE id = ?
    `, [lat, lng, customerId]);

    // Evaluar regla de cercanía (importar dinámicamente para evitar dependencia circular)
    const { evaluateNearbyNotification } = await import('../services/pushNotifications.js');
    const result = await evaluateNearbyNotification(customerId, lat, lng);

    res.json({
      locationUpdated: true,
      notificationEvaluated: result.shouldSend,
      notificationSent: result.sent || false,
      reason: result.reason || null
    });
  } catch (error) {
    console.error('Error processing location:', error);
    res.status(500).json({ error: 'Failed to process location' });
  }
});

/**
 * Middleware to authenticate customer
 */
function authenticateCustomer(req, res, next) {
  try {
    let token = req.headers.authorization;
    
    if (token && token.startsWith('Bearer ')) {
      token = token.substring(7);
    } else {
      token = req.cookies.customerToken;
    }

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, CUSTOMER_SECRET);
    if (decoded.typ !== 'customer') {
      return res.status(401).json({ error: 'Invalid token type' });
    }

    req.customerId = decoded.sub;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export default router;
