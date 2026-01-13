// Customer-related functions

import { authenticatedFetch } from './auth.js';

/**
 * Get customer profile
 */
export async function getCustomerProfile() {
  try {
    const response = await authenticatedFetch('/api/customers/me');
    
    if (!response.ok) {
      // Handle 404 specifically
      if (response.status === 404) {
        const errorData = await response.json().catch(() => ({ error: 'Customer not found' }));
        throw new Error(errorData.error || 'Cliente no encontrado. Por favor, regístrate nuevamente.');
      }
      
      // Handle other errors
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || 'Failed to get customer profile');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error in getCustomerProfile:', error);
    // If it's an auth error, the authenticatedFetch will handle redirect
    throw error;
  }
}

/**
 * Subscribe to push notifications
 */
export async function subscribeToPush() {
  try {
    // Request notification permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      throw new Error('Permiso de notificaciones denegado');
    }

    // Get VAPID public key
    const vapidResponse = await fetch('/api/push/vapid-key');
    if (!vapidResponse.ok) {
      throw new Error('No se pudo obtener la clave VAPID');
    }
    const { publicKey } = await vapidResponse.json();

    // Convert VAPID key to Uint8Array
    const applicationServerKey = urlBase64ToUint8Array(publicKey);

    // Register service worker
    const registration = await navigator.serviceWorker.register('/service-worker.js');
    
    // Subscribe to push
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: applicationServerKey
    });

    // Send subscription to backend
    const response = await authenticatedFetch('/api/push/subscribe', {
      method: 'POST',
      body: JSON.stringify({
        subscription: {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: arrayBufferToBase64(subscription.getKey('p256dh')),
            auth: arrayBufferToBase64(subscription.getKey('auth'))
          }
        }
      })
    });

    if (!response.ok) {
      throw new Error('Error al suscribirse a notificaciones');
    }

    return await response.json();
  } catch (error) {
    console.error('Error subscribing to push:', error);
    throw error;
  }
}

/**
 * Get VAPID public key
 */
export async function getVapidPublicKey() {
  try {
    const response = await fetch('/api/push/vapid-key');
    if (!response.ok) {
      throw new Error('No se pudo obtener la clave VAPID');
    }
    return await response.json();
  } catch (error) {
    console.error('Error getting VAPID key:', error);
    throw error;
  }
}

/**
 * Start location tracking
 */
export async function startLocationTracking() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocalización no está disponible en este navegador'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          await sendLocation(position.coords.latitude, position.coords.longitude);
          resolve();
        } catch (error) {
          reject(error);
        }
      },
      (error) => {
        let errorMsg = 'Error al obtener ubicación';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMsg = 'Permiso de ubicación denegado';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMsg = 'Ubicación no disponible';
            break;
          case error.TIMEOUT:
            errorMsg = 'Tiempo de espera agotado';
            break;
        }
        reject(new Error(errorMsg));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  });
}

/**
 * Send location to backend
 */
export async function sendLocation(latitude, longitude) {
  try {
    const response = await authenticatedFetch('/api/customers/location', {
      method: 'POST',
      body: JSON.stringify({
        latitude,
        longitude
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || 'Error al enviar ubicación');
    }

    return await response.json();
  } catch (error) {
    console.error('Error sending location:', error);
    throw error;
  }
}

// Helper functions
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}
