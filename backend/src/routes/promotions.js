import express from 'express';
import db from '../config/database.js';

const router = express.Router();

/**
 * GET /api/promotions
 * Get active promotions (for customers)
 * Only returns promotions that are:
 * - active = 1
 * - within valid date range (if dates are set)
 */
router.get('/promotions', async (req, res) => {
  try {
    const now = new Date().toISOString();

    const promotions = await db.getAll(`
      SELECT id, title, description, image_url, push_title, push_message, cta_url, audience, start_at, end_at, created_at
      FROM promotions
      WHERE active = 1
        AND (start_at IS NULL OR start_at <= ?)
        AND (end_at IS NULL OR end_at >= ?)
      ORDER BY created_at DESC
    `, [now, now]);

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
        createdAt: p.created_at
      }))
    });
  } catch (error) {
    console.error('Error fetching promotions:', error);
    res.status(500).json({ error: 'Failed to fetch promotions' });
  }
});

export default router;
