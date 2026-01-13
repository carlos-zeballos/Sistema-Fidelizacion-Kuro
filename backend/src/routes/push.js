import express from 'express';
import db from '../config/database.js';
import jwt from 'jsonwebtoken';
import { getVAPIDPublicKey } from '../services/pushNotifications.js';

const router = express.Router();

const CUSTOMER_SECRET = process.env.JWT_SECRET_CUSTOMER || 'customer-secret-change-in-production';

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

/**
 * GET /api/push/status
 * Check if customer has active push subscription
 */
router.get('/status', authenticateCustomer, async (req, res) => {
  try {
    const customerId = req.customerId;

    if (!customerId) {
      return res.status(401).json({ error: 'Customer ID not found' });
    }

    // Check if customer has active push subscription
    // Use try-catch for the query in case table doesn't exist or has issues
    let subscription = null;
    try {
      subscription = await db.getOne(`
        SELECT id FROM push_subscriptions 
        WHERE customer_id = ? AND active = 1
        LIMIT 1
      `, [customerId]);
    } catch (dbError) {
      // If table doesn't exist or query fails, assume not subscribed
      console.warn('Error querying push_subscriptions (table may not exist):', dbError.message);
      return res.json({ subscribed: false });
    }

    res.json({
      subscribed: !!subscription
    });
  } catch (error) {
    // If authentication fails, return 401 instead of 500
    if (error.message && (error.message.includes('Authentication') || error.message.includes('token'))) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    console.error('Error checking push status:', error);
    // Return 200 with subscribed: false instead of 500 to prevent frontend errors
    res.json({ subscribed: false });
  }
});

/**
 * POST /api/push/subscribe
 * Subscribe customer to push notifications
 */
router.post('/subscribe', authenticateCustomer, async (req, res) => {
  try {
    const customerId = req.customerId;
    const { endpoint, p256dh, auth } = req.body;

    if (!endpoint || !p256dh || !auth) {
      return res.status(400).json({ error: 'Missing subscription data' });
    }

    // Check if subscription already exists
    const existing = await db.getOne(`
      SELECT id FROM push_subscriptions 
      WHERE customer_id = ? AND endpoint = ?
    `, [customerId, endpoint]);

    if (existing) {
      // Update existing subscription
      await db.runQuery(`
        UPDATE push_subscriptions 
        SET p256dh = ?, auth = ?, active = 1
        WHERE id = ?
      `, [p256dh, auth, existing.id]);

      return res.json({ 
        message: 'Push subscription updated',
        subscribed: true 
      });
    }

    // Create new subscription
    await db.runQuery(`
      INSERT INTO push_subscriptions (customer_id, endpoint, p256dh, auth, active)
      VALUES (?, ?, ?, ?, 1)
    `, [customerId, endpoint, p256dh, auth]);

    res.json({ 
      message: 'Push subscription created',
      subscribed: true 
    });
  } catch (error) {
    console.error('Error subscribing to push:', error);
    res.status(500).json({ error: 'Failed to subscribe to push notifications' });
  }
});

/**
 * GET /api/push/vapid-key
 * Get VAPID public key for frontend
 */
router.get('/vapid-key', (req, res) => {
  try {
    const publicKey = getVAPIDPublicKey();
    res.json({ publicKey });
  } catch (error) {
    console.error('Error getting VAPID key:', error);
    res.status(500).json({ error: 'Failed to get VAPID key' });
  }
});

/**
 * POST /api/push/evaluate-mandatory
 * Evaluate and send mandatory notification (56h) - called by scheduled job or admin
 * This endpoint can be called periodically to check all customers
 */
router.post('/evaluate-mandatory', async (req, res) => {
  try {
    // Import dynamically to avoid circular dependency
    const { evaluateMandatoryNotification } = await import('../services/pushNotifications.js');
    
    // Get all customers with active push subscriptions
    const customers = await db.getAll(`
      SELECT DISTINCT c.id 
      FROM customers c
      INNER JOIN push_subscriptions ps ON c.id = ps.customer_id
      WHERE ps.active = 1
    `);

    const results = [];
    for (const customer of customers) {
      const result = await evaluateMandatoryNotification(customer.id);
      results.push({
        customerId: customer.id,
        ...result
      });
    }

    res.json({
      evaluated: customers.length,
      results
    });
  } catch (error) {
    console.error('Error evaluating mandatory notifications:', error);
    res.status(500).json({ error: 'Failed to evaluate mandatory notifications' });
  }
});

export default router;
