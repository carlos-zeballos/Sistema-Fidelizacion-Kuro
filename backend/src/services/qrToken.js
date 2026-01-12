import crypto from 'crypto';

/**
 * Generate a secure random QR token
 * Returns a 64-character hex string (32 bytes)
 */
export function generateQRToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Validate QR token format
 */
export function isValidQRToken(token) {
  if (!token || typeof token !== 'string') {
    return false;
  }
  // Should be 64 hex characters
  return /^[a-f0-9]{64}$/i.test(token);
}

