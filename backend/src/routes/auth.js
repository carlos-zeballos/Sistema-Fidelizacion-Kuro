import express from 'express';
import db from '../config/database.js';
import { isValidEmail } from '../utils/validators.js';
import { generateOTPCode, hashOTPCode, saveOTPCode, findAndVerifyOTP, getOTPExpirationTime } from '../services/otp.js';
import { sendOTPEmail } from '../services/email.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

const CUSTOMER_SECRET = process.env.JWT_SECRET_CUSTOMER || 'customer-secret-change-in-production';

/**
 * POST /api/customers/request-otp
 * Request OTP code for passwordless login
 */
router.post('/request-otp', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ error: 'Valid email is required' });
    }

    // Check if customer exists
    const customer = await db.getOne('SELECT id FROM customers WHERE email = ?', [email]);

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found with this email' });
    }

    // Generate OTP
    const code = generateOTPCode();
    const codeHash = await hashOTPCode(code);
    const expiresAt = getOTPExpirationTime();

    // Save OTP
    await saveOTPCode(email, codeHash, expiresAt);

    // Send email
    await sendOTPEmail(email, code);

    res.json({
      message: 'OTP code sent to email',
      expiresIn: '10 minutes'
    });
  } catch (error) {
    console.error('Error requesting OTP:', error);
    res.status(500).json({ error: 'Failed to send OTP code' });
  }
});

/**
 * POST /api/customers/verify-otp
 * Verify OTP code and return customer token
 */
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ error: 'Valid email is required' });
    }

    if (!code || code.length !== 6) {
      return res.status(400).json({ error: 'Valid 6-digit code is required' });
    }

    // Verify OTP
    const verification = await findAndVerifyOTP(email, code);

    if (!verification.valid) {
      return res.status(400).json({ error: verification.reason || 'Invalid OTP code' });
    }

    // Get customer
    const customer = await db.getOne('SELECT id FROM customers WHERE email = ?', [email]);

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Generate token
    const token = jwt.sign(
      { sub: customer.id, typ: 'customer' },
      CUSTOMER_SECRET,
      { expiresIn: '30d' }
    );

    // Set cookie
    res.cookie('customerToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    res.json({
      message: 'OTP verified successfully',
      token,
      customerId: customer.id
    });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ error: 'Failed to verify OTP' });
  }
});

export default router;
