import bcrypt from 'bcrypt';
import db from '../config/database.js';

const OTP_EXPIRATION_MINUTES = 10;

/**
 * Generate a random 6-digit OTP code
 */
export function generateOTPCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Hash OTP code for storage
 */
export async function hashOTPCode(code) {
  return await bcrypt.hash(code, 10);
}

/**
 * Verify OTP code against hash
 */
export async function verifyOTPCode(code, hash) {
  return await bcrypt.compare(code, hash);
}

/**
 * Save OTP code to database
 */
export async function saveOTPCode(email, codeHash, expiresAt) {
  const result = await db.runQuery(`
    INSERT INTO otp_codes (email, code_hash, expires_at)
    VALUES (?, ?, ?)
  `, [email, codeHash, expiresAt.toISOString()]);
  
  return result.lastID;
}

/**
 * Find and verify OTP code
 */
export async function findAndVerifyOTP(email, code) {
  // Find unused, non-expired OTP for this email
  const otpRecord = await db.getOne(`
    SELECT id, code_hash, expires_at
    FROM otp_codes
    WHERE email = ?
      AND used_at IS NULL
      AND expires_at > datetime('now')
    ORDER BY created_at DESC
    LIMIT 1
  `, [email]);
  
  if (!otpRecord) {
    return { valid: false, reason: 'No valid OTP found' };
  }
  
  // Check if expired
  if (new Date(otpRecord.expires_at) < new Date()) {
    return { valid: false, reason: 'OTP expired' };
  }
  
  // Verify code
  const isValid = await verifyOTPCode(code, otpRecord.code_hash);
  
  if (!isValid) {
    return { valid: false, reason: 'Invalid OTP code' };
  }
  
  // Mark as used
  await db.runQuery('UPDATE otp_codes SET used_at = datetime(\'now\') WHERE id = ?', [otpRecord.id]);
  
  return { valid: true, otpId: otpRecord.id };
}

/**
 * Get expiration time for OTP
 */
export function getOTPExpirationTime() {
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + OTP_EXPIRATION_MINUTES);
  return expiresAt;
}

/**
 * Clean up expired OTP codes
 */
export async function cleanupExpiredOTPs() {
  await db.runQuery(`
    DELETE FROM otp_codes
    WHERE expires_at < datetime('now', '-1 day')
  `);
}
