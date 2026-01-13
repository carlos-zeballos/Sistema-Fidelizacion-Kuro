// Admin-related functions

const API_BASE_URL = '';

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
 * Make authenticated API request for admin
 */
export async function adminAuthenticatedFetch(url, options = {}) {
  const token = getAdminToken();
  
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
  const response = await adminAuthenticatedFetch('/api/admin/stats');
  if (!response.ok) {
    throw new Error('Failed to get dashboard stats');
  }
  return await response.json();
}

/**
 * Get customers
 */
export async function getCustomers(search = '') {
  const url = search ? `/api/admin/customers?search=${encodeURIComponent(search)}` : '/api/admin/customers';
  const response = await adminAuthenticatedFetch(url);
  if (!response.ok) {
    throw new Error('Failed to get customers');
  }
  return await response.json();
}

/**
 * Get promotions
 */
export async function getPromotions() {
  const response = await adminAuthenticatedFetch('/api/admin/promotions');
  if (!response.ok) {
    throw new Error('Failed to get promotions');
  }
  return await response.json();
}

/**
 * Create promotion
 */
export async function createPromotion(promotionData) {
  const response = await adminAuthenticatedFetch('/api/admin/promotions', {
    method: 'POST',
    body: JSON.stringify(promotionData)
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create promotion');
  }
  return await response.json();
}

/**
 * Update promotion
 */
export async function updatePromotion(id, promotionData) {
  const response = await adminAuthenticatedFetch(`/api/admin/promotions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(promotionData)
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update promotion');
  }
  return await response.json();
}

/**
 * Delete promotion
 */
export async function deletePromotion(id) {
  const response = await adminAuthenticatedFetch(`/api/admin/promotions/${id}`, {
    method: 'DELETE'
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete promotion');
  }
  return await response.json();
}

/**
 * Scan QR code
 */
export async function scanQR(qrToken) {
  try {
    const response = await adminAuthenticatedFetch('/api/admin/scan', {
      method: 'POST',
      body: JSON.stringify({ qrToken })
    });

    const data = await response.json();

    if (!response.ok) {
      // Return error data in a format that can be handled
      const error = {
        success: false,
        error: data.error || data.message || 'Error al procesar QR',
        customer: data.customer || null,
        status: response.status
      };
      throw error;
    }

    return {
      success: true,
      customer: data.customer,
      points: data.points,
      message: data.message
    };
  } catch (error) {
    // If it's already formatted, rethrow
    if (error.success !== undefined) {
      throw error;
    }
    
    // Otherwise, format it
    throw {
      success: false,
      error: error.message || 'Error al procesar QR',
      customer: null,
      status: error.status || 500
    };
  }
}

/**
 * Send manual push notification
 */
export async function sendManualPushNotification(payload) {
  const response = await adminAuthenticatedFetch('/api/admin/push/send', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to send notification');
  }
  return await response.json();
}
