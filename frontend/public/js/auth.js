// Authentication utilities

const API_BASE_URL = '';

/**
 * Get customer token from localStorage or cookie
 */
export function getCustomerToken() {
  return localStorage.getItem('customerToken') || getCookie('customerToken');
}

/**
 * Set customer token
 */
export function setCustomerToken(token) {
  localStorage.setItem('customerToken', token);
}

/**
 * Remove customer token
 */
export function removeCustomerToken() {
  localStorage.removeItem('customerToken');
  document.cookie = 'customerToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated() {
  return !!getCustomerToken();
}

/**
 * Get cookie value
 */
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}

/**
 * Make authenticated API request
 */
export async function authenticatedFetch(url, options = {}) {
  const token = getCustomerToken();
  
  if (!token) {
    throw new Error('Not authenticated');
  }

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers
  });

  if (response.status === 401) {
    removeCustomerToken();
    window.location.href = '/index.html';
    throw new Error('Session expired');
  }

  return response;
}


