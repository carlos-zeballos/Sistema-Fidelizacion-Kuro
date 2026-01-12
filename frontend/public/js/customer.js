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
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    throw new Error('Push notifications are not supported');
  }

  try {
    // Register service worker
    const registration = await navigator.serviceWorker.register('/service-worker.js');
    
    // Request notification permission
    const permission = await Notification.requestPermission();
    
    if (permission !== 'granted') {
      throw new Error('Notification permission denied');
    }

    // Get VAPID public key
    const vapidPublicKey = await getVapidPublicKey();
    if (!vapidPublicKey) {
      throw new Error('VAPID public key not configured');
    }

    // Subscribe to push
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
    });

    // Send subscription to server
    const response = await authenticatedFetch('/api/push/subscribe', {
      method: 'POST',
      body: JSON.stringify({
        endpoint: subscription.endpoint,
        p256dh: arrayBufferToBase64(subscription.getKey('p256dh')),
        auth: arrayBufferToBase64(subscription.getKey('auth'))
      })
    });

    if (!response.ok) {
      throw new Error('Failed to save push subscription');
    }

    return true;
  } catch (error) {
    console.error('Error subscribing to push:', error);
    throw error;
  }
}

/**
 * Get VAPID public key from server
 */
async function getVapidPublicKey() {
  try {
    const response = await fetch('/api/push/vapid-key');
    if (response.ok) {
      const data = await response.json();
      return data.publicKey;
    }
    throw new Error('Failed to get VAPID key');
  } catch (error) {
    console.error('Error fetching VAPID key:', error);
    throw new Error('VAPID public key not available');
  }
}

/**
 * Convert VAPID key from base64 URL to Uint8Array
 */
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

/**
 * Convert ArrayBuffer to base64
 */
function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

/**
 * Send customer location to server
 * This triggers evaluation of nearby notification rule
 */
export async function sendLocation(lat, lng) {
  try {
    const response = await authenticatedFetch('/api/customers/location', {
      method: 'POST',
      body: JSON.stringify({ lat, lng })
    });

    if (!response.ok) {
      throw new Error('Failed to send location');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error sending location:', error);
    throw error;
  }
}

/**
 * Request location permission and start tracking
 * Sends location every 10-15 minutes while page is active
 */
export async function startLocationTracking() {
  if (!navigator.geolocation) {
    throw new Error('Geolocation is not supported by your browser');
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          await sendLocation(latitude, longitude);
          resolve({ lat: latitude, lng: longitude });
        } catch (error) {
          reject(error);
        }
      },
      (error) => {
        let message = 'Error al obtener ubicación';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'Permiso de ubicación denegado';
            break;
          case error.POSITION_UNAVAILABLE:
            message = 'Ubicación no disponible';
            break;
          case error.TIMEOUT:
            message = 'Tiempo de espera agotado';
            break;
        }
        reject(new Error(message));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  });
}

