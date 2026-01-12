/**
 * Validate email format
 */
export function isValidEmail(email) {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone format (basic validation)
 */
export function isValidPhone(phone) {
  if (!phone) return false;
  // Allow digits, spaces, +, -, and parentheses
  const phoneRegex = /^[\d\s\+\-\(\)]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 8;
}

/**
 * Validate date format and ensure it's in the past
 */
export function isValidBirthdate(dateString) {
  if (!dateString) return false;
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return false;
  // Must be in the past
  return date < new Date();
}

/**
 * Sanitize string input to prevent SQL injection
 * Note: We use parameterized queries, but this adds extra safety
 */
export function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  // Remove potentially dangerous characters
  return input.trim().replace(/[<>'"]/g, '');
}




