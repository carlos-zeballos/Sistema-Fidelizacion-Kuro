import jwt from 'jsonwebtoken';

const CUSTOMER_SECRET = process.env.JWT_SECRET_CUSTOMER || 'customer-secret-change-in-production';

/**
 * Verify customer token
 */
export function verifyCustomerToken(token) {
  try {
    const decoded = jwt.verify(token, CUSTOMER_SECRET);
    if (decoded.typ !== 'customer') {
      throw new Error('Invalid token type');
    }
    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}


