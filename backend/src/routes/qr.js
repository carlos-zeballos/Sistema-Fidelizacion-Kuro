import express from 'express';
import { generateQRPNG } from '../services/qrImage.js';
import db from '../config/database.js';

const router = express.Router();

/**
 * GET /api/qr/image
 * Generate QR code as PNG image
 * Query params: data (URL or token) or token (qr_token)
 */
router.get('/image', async (req, res) => {
  try {
    let qrData = req.query.data || req.query.token;

    if (!qrData) {
      return res.status(400).json({ error: 'data or token parameter is required' });
    }

    // If token provided, build URL
    if (req.query.token && !qrData.includes('http')) {
      // Use Railway public domain or construct from environment
      const baseUrl = process.env.RAILWAY_PUBLIC_DOMAIN 
        ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
        : process.env.BACKEND_URL || 'http://localhost:3000';
      qrData = `${baseUrl}/c/${qrData}`;
    }

    // Generate QR as PNG
    const pngBuffer = await generateQRPNG(qrData);

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(pngBuffer);
  } catch (error) {
    console.error('Error generating QR image:', error);
    res.status(500).json({ error: 'Failed to generate QR image' });
  }
});

/**
 * GET /c/:token
 * QR code landing page (for scanning)
 */
router.get('/c/:token', async (req, res) => {
  try {
    const { token } = req.params;

    // Find customer by QR token
    const customer = await db.getOne('SELECT full_name FROM customers WHERE qr_token = ?', [token]);

    if (!customer) {
      return res.status(404).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>QR Inválido</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              margin: 0;
              background: #f5f5f5;
            }
            .container {
              text-align: center;
              background: white;
              padding: 2rem;
              border-radius: 8px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>❌ QR Inválido</h1>
            <p>Este código QR no está registrado en el sistema.</p>
          </div>
        </body>
        </html>
      `);
    }

    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>QR Escaneado</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            background: #f5f5f5;
          }
          .container {
            text-align: center;
            background: white;
            padding: 2rem;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>✅ QR Escaneado</h1>
          <p>Cliente: ${customer.full_name}</p>
          <p>Este código debe ser escaneado por el staff para sumar puntos.</p>
        </div>
      </body>
      </html>
    `);
  } catch (error) {
    res.status(500).send('Error processing QR');
  }
});

export default router;
