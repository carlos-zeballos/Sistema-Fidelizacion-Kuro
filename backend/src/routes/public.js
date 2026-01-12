import express from 'express';
import db from '../config/database.js';
import { generateQRDataURL } from '../services/qrImage.js';

const router = express.Router();

/**
 * GET /api/public/register-qr
 * Generate a public QR code for registration
 * Returns the QR as base64 image data
 */
router.get('/register-qr', async (req, res) => {
  try {
    const baseUrl = process.env.APP_BASE_URL || 'http://localhost:3000';
    const registerUrl = `${baseUrl}/register.html`;
    
    // Generate QR as base64 image
    const qrImageData = await generateQRDataURL(registerUrl);
    
    res.json({
      qrUrl: registerUrl,
      qrImageData: qrImageData,
      message: 'Scan this QR to register or access your profile'
    });
  } catch (error) {
    console.error('Error generating register QR:', error);
    res.status(500).json({ error: 'Failed to generate register QR' });
  }
});

/**
 * POST /api/public/check-customer
 * Check if a customer exists by email or phone
 * Used when scanning the public registration QR
 */
router.post('/check-customer', async (req, res) => {
  try {
    const { email, phone } = req.body;

    if (!email && !phone) {
      return res.status(400).json({ error: 'Email or phone is required' });
    }

    let query = 'SELECT id, full_name, email, phone FROM customers WHERE ';
    const params = [];
    
    if (email && phone) {
      query += '(email = ? OR phone = ?)';
      params.push(email, phone);
    } else if (email) {
      query += 'email = ?';
      params.push(email);
    } else {
      query += 'phone = ?';
      params.push(phone);
    }

    const customer = await db.getOne(query, params);

    if (customer) {
      // Customer exists - redirect to login/recover
      res.json({
        exists: true,
        customer: customer,
        action: 'recover',
        message: 'Ya estás registrado. Usa la opción de recuperar sesión.'
      });
    } else {
      // Customer doesn't exist - redirect to register
      res.json({
        exists: false,
        action: 'register',
        message: 'Regístrate para obtener tu tarjeta de fidelización'
      });
    }
  } catch (error) {
    console.error('Error checking customer:', error);
    res.status(500).json({ error: 'Failed to check customer' });
  }
});

export default router;


