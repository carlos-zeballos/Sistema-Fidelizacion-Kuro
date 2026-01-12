import { verifyCustomerToken } from '../services/jwt.js';

/**
 * Middleware to authenticate customer requests
 * Expects token in Authorization header or cookie
 */
export function authenticateCustomer(req, res, next) {
  try {
    // Try to get token from Authorization header
    let token = req.headers.authorization;
    
    if (token && token.startsWith('Bearer ')) {
      token = token.substring(7);
    } else {
      // Try to get from cookie
      token = req.cookies.customerToken;
    }

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = verifyCustomerToken(token);
    req.customerId = decoded.sub;
    req.token = token;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}


