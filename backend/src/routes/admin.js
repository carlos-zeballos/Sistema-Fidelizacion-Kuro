import express from 'express';
import db from '../config/database.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const router = express.Router();

const ADMIN_SECRET = process.env.JWT_SECRET_ADMIN || 'admin-secret-change-in-production';

/**
 * POST /api/admin/login
 * Admin login with username and password
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Find staff member
    const staff = await db.getOne('SELECT id, username, password_hash, role FROM staff WHERE username = ?', [username]);

    if (!staff) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isValid = await bcrypt.compare(password, staff.password_hash);

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate admin token
    const adminToken = jwt.sign(
      { sub: staff.id, username: staff.username, role: staff.role, typ: 'admin' },
      ADMIN_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      message: 'Login successful',
      token: adminToken,
      admin: {
        id: staff.id,
        username: staff.username,
        role: staff.role
      }
    });
  } catch (error) {
    console.error('Error in admin login:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

/**
 * POST /api/admin/scan
 * Scan QR and add point (with 24h antifraud rule)
 */
router.post('/scan', requireAdmin, async (req, res) => {
  try {
    const { qrToken } = req.body;
    const staffId = req.adminId;

    console.log('📥 QR Scan request received:', { qrToken: qrToken ? `${qrToken.substring(0, 8)}...` : 'null', staffId });

    if (!qrToken || qrToken.trim().length === 0) {
      console.log('❌ QR token missing or empty');
      return res.status(400).json({ 
        success: false,
        error: 'Token QR es requerido',
        message: 'El token QR no puede estar vacío'
      });
    }

    const trimmedToken = qrToken.trim();
    console.log('🔍 Buscando cliente con token:', `${trimmedToken.substring(0, 8)}...`);

    // Find customer by QR token
    const customer = await db.getOne('SELECT id, full_name FROM customers WHERE qr_token = ?', [trimmedToken]);

    if (!customer) {
      console.log('❌ Cliente no encontrado con token:', `${trimmedToken.substring(0, 8)}...`);
      return res.status(404).json({ 
        success: false,
        error: 'Cliente no encontrado',
        message: 'El código QR no corresponde a ningún cliente registrado'
      });
    }

    console.log('✅ Cliente encontrado:', customer.id, customer.full_name);

    // Check antifraud: last SUCCESSFUL point event within 24 hours
    // IMPORTANT: Only check events where source = 'QR_SCAN' (successful points)
    // This ensures we only block if a point was actually added
    const lastEvent = await db.getOne(`
      SELECT created_at, source FROM point_events 
      WHERE customer_id = ? AND source = 'QR_SCAN'
      ORDER BY created_at DESC 
      LIMIT 1
    `, [customer.id]);

    if (lastEvent) {
      const lastEventTime = new Date(lastEvent.created_at);
      const now = new Date();
      const hoursSinceLastPoint = (now - lastEventTime) / (1000 * 60 * 60);

      if (hoursSinceLastPoint < 24) {
        const hoursRemaining = 24 - hoursSinceLastPoint;
        const minutesRemaining = Math.ceil(hoursRemaining * 60);
        console.log(`⏰ Antifraud: Cliente ${customer.id} debe esperar ${Math.ceil(hoursRemaining)} horas (${minutesRemaining} minutos) desde el último punto exitoso`);
        return res.status(400).json({
          success: false,
          error: `Debes esperar ${Math.ceil(hoursRemaining)} horas desde el último punto`,
          message: `Este cliente recibió un punto exitosamente hace ${Math.ceil(hoursSinceLastPoint * 60)} minutos. Debe esperar ${minutesRemaining} minutos más.`,
          customer: {
            id: customer.id,
            name: customer.full_name
          }
        });
      }
    }

    // Ensure loyalty_points record exists
    const existingLoyalty = await db.getOne('SELECT points FROM loyalty_points WHERE customer_id = ?', [customer.id]);
    
    if (!existingLoyalty) {
      // Create loyalty_points record if it doesn't exist
      await db.runQuery('INSERT INTO loyalty_points (customer_id, points) VALUES (?, 0)', [customer.id]);
      console.log(`📊 Creado registro de loyalty_points para cliente ${customer.id}`);
    }

    // Add point - THIS IS THE ACTUAL POINT ADDITION
    const updateResult = await db.runQuery(`
      UPDATE loyalty_points 
      SET points = points + 1, updated_at = datetime('now')
      WHERE customer_id = ?
    `, [customer.id]);

    if (updateResult.changes === 0) {
      throw new Error('Failed to update loyalty points');
    }

    // Get new point count to verify
    const loyalty = await db.getOne('SELECT points FROM loyalty_points WHERE customer_id = ?', [customer.id]);

    if (!loyalty) {
      throw new Error('Failed to retrieve loyalty points after update');
    }

    console.log(`✅ Punto agregado exitosamente. Cliente ${customer.id} ahora tiene ${loyalty.points} puntos`);

    // IMPORTANT: Only record the event AFTER the point was successfully added
    // This ensures the antifraud check only blocks if a point was actually added
    await db.runQuery(`
      INSERT INTO point_events (customer_id, staff_id, source)
      VALUES (?, ?, 'QR_SCAN')
    `, [customer.id, staffId]);

    console.log(`📝 Evento registrado para cliente ${customer.id}`);

    // Actualizar last_point_at del cliente
    await db.runQuery(`
      UPDATE customers 
      SET last_point_at = datetime('now')
      WHERE id = ?
    `, [customer.id]);

    res.json({
      success: true,
      message: 'Punto agregado exitosamente',
      customer: {
        id: customer.id,
        name: customer.full_name
      },
      points: loyalty.points || 0
    });
  } catch (error) {
    console.error('❌ Error scanning QR:', error);
    console.error('   Error message:', error.message);
    console.error('   Error stack:', error.stack);
    console.error('   Request body:', req.body);
    console.error('   Staff ID:', req.adminId);
    
    // Return more detailed error for debugging
    res.status(500).json({ 
      success: false,
      error: 'Failed to process QR scan',
      message: error.message || 'Error desconocido al procesar el escaneo',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * GET /api/admin/customers
 * List all customers (with search)
 */
router.get('/customers', requireAdmin, async (req, res) => {
  try {
    const { search, limit = 50, offset = 0 } = req.query;

    let query = 'SELECT c.*, lp.points FROM customers c LEFT JOIN loyalty_points lp ON c.id = lp.customer_id';
    const params = [];

    if (search) {
      query += ' WHERE c.dni LIKE ? OR c.email LIKE ? OR c.full_name LIKE ?';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    query += ' ORDER BY c.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const customers = await db.getAll(query, params);

    res.json({
      customers: customers.map(c => ({
        id: c.id,
        fullName: c.full_name,
        email: c.email,
        phone: c.phone,
        dni: c.dni,
        sex: c.sex,
        birthdate: c.birthdate,
        points: c.points || 0,
        createdAt: c.created_at
      })),
      total: customers.length
    });
  } catch (error) {
    console.error('Error listing customers:', error);
    res.status(500).json({ error: 'Failed to list customers' });
  }
});

/**
 * POST /api/admin/promotions
 * Create a new promotion
 */
router.post('/promotions', requireAdmin, async (req, res) => {
  try {
    const { 
      title, 
      description, 
      imageUrl, 
      pushTitle, 
      pushMessage, 
      ctaUrl, 
      audience = 'ALL',
      startAt, 
      endAt, 
      active = true 
    } = req.body;

    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required' });
    }

    if (!['ALL', 'NEARBY', 'REACTIVATION'].includes(audience)) {
      return res.status(400).json({ error: 'Invalid audience. Must be ALL, NEARBY, or REACTIVATION' });
    }

    const result = await db.runQuery(`
      INSERT INTO promotions 
      (title, description, image_url, push_title, push_message, cta_url, audience, start_at, end_at, active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      title, 
      description, 
      imageUrl || null, 
      pushTitle || null,
      pushMessage || null,
      ctaUrl || null,
      audience,
      startAt || null, 
      endAt || null, 
      active ? 1 : 0
    ]);

    const promotion = await db.getOne('SELECT * FROM promotions WHERE id = ?', [result.lastID]);

    res.status(201).json({
      message: 'Promotion created successfully',
      promotion: {
        id: promotion.id,
        title: promotion.title,
        description: promotion.description,
        imageUrl: promotion.image_url,
        startAt: promotion.start_at,
        endAt: promotion.end_at,
        active: promotion.active === 1,
        createdAt: promotion.created_at
      }
    });
  } catch (error) {
    console.error('Error creating promotion:', error);
    res.status(500).json({ error: 'Failed to create promotion' });
  }
});

/**
 * PUT /api/admin/promotions/:id
 * Update a promotion
 */
router.put('/promotions/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      title, 
      description, 
      imageUrl, 
      pushTitle, 
      pushMessage, 
      ctaUrl, 
      audience,
      startAt, 
      endAt, 
      active 
    } = req.body;

    const updates = [];
    const params = [];

    if (title !== undefined) {
      updates.push('title = ?');
      params.push(title);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description);
    }
    if (imageUrl !== undefined) {
      updates.push('image_url = ?');
      params.push(imageUrl);
    }
    if (pushTitle !== undefined) {
      updates.push('push_title = ?');
      params.push(pushTitle);
    }
    if (pushMessage !== undefined) {
      updates.push('push_message = ?');
      params.push(pushMessage);
    }
    if (ctaUrl !== undefined) {
      updates.push('cta_url = ?');
      params.push(ctaUrl);
    }
    if (audience !== undefined) {
      if (!['ALL', 'NEARBY', 'REACTIVATION'].includes(audience)) {
        return res.status(400).json({ error: 'Invalid audience. Must be ALL, NEARBY, or REACTIVATION' });
      }
      updates.push('audience = ?');
      params.push(audience);
    }
    if (startAt !== undefined) {
      updates.push('start_at = ?');
      params.push(startAt);
    }
    if (endAt !== undefined) {
      updates.push('end_at = ?');
      params.push(endAt);
    }
    if (active !== undefined) {
      updates.push('active = ?');
      params.push(active ? 1 : 0);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    params.push(id);

    await db.runQuery(`UPDATE promotions SET ${updates.join(', ')} WHERE id = ?`, params);

    const promotion = await db.getOne('SELECT * FROM promotions WHERE id = ?', [id]);

    if (!promotion) {
      return res.status(404).json({ error: 'Promotion not found' });
    }

    res.json({
      message: 'Promotion updated successfully',
      promotion: {
        id: promotion.id,
        title: promotion.title,
        description: promotion.description,
        imageUrl: promotion.image_url,
        pushTitle: promotion.push_title,
        pushMessage: promotion.push_message,
        ctaUrl: promotion.cta_url,
        audience: promotion.audience || 'ALL',
        startAt: promotion.start_at,
        endAt: promotion.end_at,
        active: promotion.active === 1,
        createdAt: promotion.created_at
      }
    });
  } catch (error) {
    console.error('Error updating promotion:', error);
    res.status(500).json({ error: 'Failed to update promotion' });
  }
});

/**
 * DELETE /api/admin/promotions/:id
 * Delete a promotion
 */
router.delete('/promotions/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if promotion exists first
    const existing = await db.getOne('SELECT id FROM promotions WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Promotion not found' });
    }

    await db.runQuery('DELETE FROM promotions WHERE id = ?', [id]);

    res.json({ message: 'Promotion deleted successfully' });
  } catch (error) {
    console.error('Error deleting promotion:', error);
    res.status(500).json({ error: 'Failed to delete promotion' });
  }
});

/**
 * GET /api/admin/promotions
 * List all promotions
 */
router.get('/promotions', requireAdmin, async (req, res) => {
  try {
    const promotions = await db.getAll('SELECT * FROM promotions ORDER BY created_at DESC');

    res.json({
      promotions: promotions.map(p => ({
        id: p.id,
        title: p.title,
        description: p.description,
        imageUrl: p.image_url,
        pushTitle: p.push_title,
        pushMessage: p.push_message,
        ctaUrl: p.cta_url,
        audience: p.audience || 'ALL',
        startAt: p.start_at,
        endAt: p.end_at,
        active: p.active === 1,
        createdAt: p.created_at
      }))
    });
  } catch (error) {
    console.error('Error listing promotions:', error);
    res.status(500).json({ error: 'Failed to list promotions' });
  }
});

/**
 * GET /api/admin/dashboard
 * Get dashboard stats
 */
router.get('/dashboard', requireAdmin, async (req, res) => {
  try {
    // Total customers
    const totalCustomersResult = await db.getOne('SELECT COUNT(*) as count FROM customers');
    const totalCustomers = totalCustomersResult.count;

    // Points given today
    const today = new Date().toISOString().split('T')[0];
    const pointsTodayResult = await db.getOne(`
      SELECT COUNT(*) as count FROM point_events 
      WHERE date(created_at) = date(?)
    `, [today]);
    const pointsToday = pointsTodayResult.count;

    // Recent customers
    const recentCustomers = await db.getAll(`
      SELECT c.*, lp.points 
      FROM customers c 
      LEFT JOIN loyalty_points lp ON c.id = lp.customer_id
      ORDER BY c.created_at DESC 
      LIMIT 10
    `);

    res.json({
      stats: {
        totalCustomers,
        pointsToday
      },
      recentCustomers: recentCustomers.map(c => ({
        id: c.id,
        fullName: c.full_name,
        email: c.email,
        points: c.points || 0,
        createdAt: c.created_at
      }))
    });
  } catch (error) {
    console.error('Error getting dashboard:', error);
    res.status(500).json({ error: 'Failed to get dashboard data' });
  }
});

/**
 * Middleware to require admin authentication
 */
function requireAdmin(req, res, next) {
  try {
    let token = req.headers.authorization;
    
    if (token && token.startsWith('Bearer ')) {
      token = token.substring(7);
    } else {
      token = req.cookies.adminToken;
    }

    if (!token) {
      return res.status(401).json({ error: 'Admin authentication required' });
    }

    const decoded = jwt.verify(token, ADMIN_SECRET);
    if (decoded.typ !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    req.adminId = decoded.sub;
    req.adminUsername = decoded.username;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired admin token' });
  }
}

/**
 * POST /api/admin/push/send
 * Send manual push notification to customers
 */
router.post('/push/send', requireAdmin, async (req, res) => {
  try {
    const { 
      promotionId, 
      title, 
      message, 
      ctaUrl, 
      segment 
    } = req.body;

    // Validar que tenga promoción o mensaje manual
    if (!promotionId && (!title || !message)) {
      return res.status(400).json({ error: 'Either promotionId or title+message are required' });
    }

    let notification = {};

    // Si hay promotionId, obtener datos de la promoción
    if (promotionId) {
      const promotion = await db.getOne('SELECT * FROM promotions WHERE id = ?', [promotionId]);
      if (!promotion) {
        return res.status(404).json({ error: 'Promotion not found' });
      }
      notification = {
        promotionId: promotion.id,
        title: promotion.push_title || promotion.title,
        message: promotion.push_message || promotion.description,
        ctaUrl: promotion.cta_url || '/dashboard.html'
      };
    } else {
      // Mensaje manual
      notification = {
        title,
        message,
        ctaUrl: ctaUrl || '/dashboard.html'
      };
    }

    // Constante para coordenadas de KURO (debe estar en .env)
    const KURO_LAT = parseFloat(process.env.KURO_LAT || '-12.0464');
    const KURO_LNG = parseFloat(process.env.KURO_LNG || '-77.0428');

    // Obtener lista de clientes según segmento
    let customerIds = [];

    if (segment === 'all') {
      // Todos los suscritos
      const customers = await db.getAll(`
        SELECT DISTINCT c.id 
        FROM customers c
        INNER JOIN push_subscriptions ps ON c.id = ps.customer_id
        WHERE ps.active = 1
      `);
      customerIds = customers.map(c => c.id);
    } else if (segment === 'inactive_36h') {
      // Inactivos > 36h
      const customers = await db.getAll(`
        SELECT DISTINCT c.id 
        FROM customers c
        INNER JOIN push_subscriptions ps ON c.id = ps.customer_id
        WHERE ps.active = 1
          AND (c.last_point_at IS NULL OR datetime(c.last_point_at, '+36 hours') < datetime('now'))
      `);
      customerIds = customers.map(c => c.id);
    } else if (segment === 'inactive_56h') {
      // Inactivos > 56h
      const customers = await db.getAll(`
        SELECT DISTINCT c.id 
        FROM customers c
        INNER JOIN push_subscriptions ps ON c.id = ps.customer_id
        WHERE ps.active = 1
          AND (c.last_point_at IS NULL OR datetime(c.last_point_at, '+56 hours') < datetime('now'))
      `);
      customerIds = customers.map(c => c.id);
    } else if (segment === 'nearby') {
      // Cercanos (solo si reportaron ubicación recientemente)
      const customers = await db.getAll(`
        SELECT DISTINCT c.id 
        FROM customers c
        INNER JOIN push_subscriptions ps ON c.id = ps.customer_id
        WHERE ps.active = 1
          AND c.last_location_at IS NOT NULL
          AND datetime(c.last_location_at, '+15 minutes') > datetime('now')
          AND (
            (c.last_location_lat - ?) * (c.last_location_lat - ?) + 
            (c.last_location_lng - ?) * (c.last_location_lng - ?)
          ) <= 0.0001
      `, [KURO_LAT, KURO_LAT, KURO_LNG, KURO_LNG]);
      customerIds = customers.map(c => c.id);
    } else {
      return res.status(400).json({ error: 'Invalid segment. Must be: all, inactive_36h, inactive_56h, nearby' });
    }

    if (customerIds.length === 0) {
      return res.json({
        message: 'No customers found for this segment',
        sent: 0,
        total: 0
      });
    }

    // Enviar notificaciones
    const { sendManualNotification } = await import('../services/pushNotifications.js');
    const results = await sendManualNotification(customerIds, notification);

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    res.json({
      message: `Notifications sent: ${successCount} successful, ${failCount} failed`,
      sent: successCount,
      failed: failCount,
      total: customerIds.length,
      results
    });
  } catch (error) {
    console.error('❌ Error sending manual push:', error);
    console.error('   Error message:', error.message);
    console.error('   Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Failed to send push notifications',
      message: error.message || 'Error desconocido al enviar notificaciones',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

export default router;
