// Admin-related functions

// Use window.API_BASE_URL from config.js (loaded in HTML)
const API = window.API_BASE_URL || '';

/**
 * Get admin token from localStorage
 */
export function getAdminToken() {
  return localStorage.getItem('adminToken');
}

/**
 * Set admin token
 */
export function setAdminToken(token) {
  localStorage.setItem('adminToken', token);
}

/**
 * Remove admin token
 */
export function removeAdminToken() {
  localStorage.removeItem('adminToken');
  document.cookie = 'adminToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
}

/**
 * Logout admin
 */
export function logout() {
  removeAdminToken();
  window.location.href = '/admin-login.html';
}

/**
 * Check if admin is authenticated
 */
export function isAdminAuthenticated() {
  return !!getAdminToken();
}

/**
 * Make authenticated API request for admin
 */
export async function adminAuthenticatedFetch(url, options = {}) {
  const token = getAdminToken();
  
  if (!token) {
    removeAdminToken();
    window.location.href = '/admin-login.html';
    throw new Error('Not authenticated');
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...options.headers
  };

  const response = await fetch(`${API}${url}`, {
    ...options,
    headers
  });

  if (response.status === 401) {
    removeAdminToken();
    window.location.href = '/admin-login.html';
    throw new Error('Session expired');
  }

  return response;
}

/**
 * Get dashboard stats
 */
export async function getDashboardStats() {
  try {
    const response = await adminAuthenticatedFetch('/api/admin/dashboard');
    
    if (!response.ok) {
      throw new Error('Failed to get dashboard stats');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    throw error;
  }
}

/**
 * Scan QR and add point
 */
export async function scanQR(qrToken) {
  try {
    console.log('🔍 scanQR called with token:', qrToken ? `${qrToken.substring(0, 16)}...` : 'null');
    
    if (!qrToken || qrToken.trim().length === 0) {
      throw new Error('Token QR es requerido');
    }
    
    if (qrToken.trim().length !== 64) {
      throw new Error(`Token QR inválido: debe tener 64 caracteres (tiene ${qrToken.trim().length})`);
    }
    
    const response = await adminAuthenticatedFetch('/api/admin/scan', {
      method: 'POST',
      body: JSON.stringify({ qrToken: qrToken.trim() })
    });
    
    const data = await response.json();
    
    // If response is not ok, throw error with backend message
    if (!response.ok) {
      const error = new Error(data.error || data.message || 'Error al escanear QR');
      error.status = response.status;
      error.data = data;
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error scanning QR:', error);
    throw error;
  }
}

/**
 * Get customers list
 */
export async function getCustomers(search = '') {
  try {
    const url = `/api/admin/customers${search ? `?search=${encodeURIComponent(search)}` : ''}`;
    const response = await adminAuthenticatedFetch(url);
    
    if (!response.ok) {
      throw new Error('Failed to get customers');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error getting customers:', error);
    throw error;
  }
}

/**
 * Get promotions list
 */
export async function getPromotions() {
  try {
    const response = await adminAuthenticatedFetch('/api/admin/promotions');
    
    if (!response.ok) {
      throw new Error('Failed to get promotions');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error getting promotions:', error);
    throw error;
  }
}

/**
 * Create promotion
 */
export async function createPromotion(promotionData) {
  try {
    const response = await adminAuthenticatedFetch('/api/admin/promotions', {
      method: 'POST',
      body: JSON.stringify(promotionData)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create promotion');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error creating promotion:', error);
    throw error;
  }
}

/**
 * Update promotion
 */
export async function updatePromotion(id, promotionData) {
  try {
    const response = await adminAuthenticatedFetch(`/api/admin/promotions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(promotionData)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update promotion');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error updating promotion:', error);
    throw error;
  }
}

/**
 * Delete promotion
 */
export async function deletePromotion(id) {
  try {
    const response = await adminAuthenticatedFetch(`/api/admin/promotions/${id}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete promotion');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error deleting promotion:', error);
    throw error;
  }
}
