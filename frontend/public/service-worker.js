// Service Worker for PWA
const CACHE_NAME = 'loyalty-system-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/register.html',
  '/dashboard.html',
  '/recover.html',
  '/manifest.json'
];

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // API requests: Always go to network (Railway backend), bypass cache
  if (url.pathname.startsWith('/api/') || url.hostname.includes('railway.app')) {
    event.respondWith(fetch(event.request));
    return;
  }
  
  // Static assets: Cache first, then network
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
  );
});

// Push notification event
self.addEventListener('push', (event) => {
  console.log('📬 Push notification received:', event);
  
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    // If data is text, use it as message
    data = { message: event.data ? event.data.text() : 'Tienes una nueva notificación' };
  }
  
  const title = data.title || data.push_title || 'Kuro Fidelización';
  const body = data.body || data.message || data.push_message || 'Tienes una nueva notificación';
  const url = data.url || data.cta_url || data.data?.url || '/dashboard.html';
  
  const options = {
    body: body,
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    image: data.image_url || null, // Show promotion image if available
    data: {
      url: url
    },
    vibrate: [200, 100, 200],
    requireInteraction: false,
    tag: data.promotion_id ? `promo-${data.promotion_id}` : 'kuro-notification',
    timestamp: Date.now(),
    actions: url ? [
      {
        action: 'open',
        title: 'Ver más'
      }
    ] : []
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('👆 Notification clicked:', event);
  event.notification.close();
  
  const action = event.action || 'open';
  const urlToOpen = event.notification.data?.url || '/dashboard.html';
  
  event.waitUntil(
    clients.matchAll({ 
      type: 'window', 
      includeUncontrolled: true 
    }).then((clientList) => {
      // Check if there's already a window/tab open
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        // Focus any open window (doesn't need to match exact URL)
        if ('focus' in client) {
          return client.focus().then(() => {
            // Navigate to the notification URL if different
            if (client.url !== urlToOpen && 'navigate' in client) {
              return client.navigate(urlToOpen);
            }
          });
        }
      }
      // If no window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});


