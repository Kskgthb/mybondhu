// ============================================================
// BondhuApp Service Worker - Push Notifications
// Handles notifications when tab is closed/browser is in background
// ============================================================

const APP_URL = self.location.origin;

// Notification click handler - opens the app when user clicks notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || APP_URL;

  event.waitUntil(
    // Check if app is already open in a tab
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a tab is already open, focus it
      for (const client of clientList) {
        if (client.url.startsWith(APP_URL) && 'focus' in client) {
          client.focus();
          // Navigate to the specific page if needed
          if (urlToOpen !== APP_URL) {
            client.navigate(urlToOpen);
          }
          return;
        }
      }
      // No tab open - open a new one
      return self.clients.openWindow(urlToOpen);
    })
  );
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  // Analytics or cleanup can go here
  console.log('[SW] Notification closed:', event.notification.tag);
});

// Listen for messages from the main app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, body, icon, badge, tag, url, vibrate } = event.data.payload;
    
    event.waitUntil(
      self.registration.showNotification(title, {
        body: body || '',
        icon: icon || '/logo.png',
        badge: badge || '/logo.png',
        tag: tag || 'bondhu-notification',
        data: { url: url || APP_URL },
        vibrate: vibrate || [200, 100, 200],
        requireInteraction: true,
        actions: [
          { action: 'open', title: 'View' },
          { action: 'close', title: 'Dismiss' }
        ]
      })
    );
  }
});

// Service Worker install
self.addEventListener('install', (event) => {
  console.log('[SW] Service Worker installed');
  self.skipWaiting();
});

// Service Worker activate
self.addEventListener('activate', (event) => {
  console.log('[SW] Service Worker activated');
  event.waitUntil(self.clients.claim());
});
