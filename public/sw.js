// ============================================================
// BondhuApp Service Worker — True Web Push Notifications
// Works even when the website tab/browser is closed!
// ============================================================

const APP_URL = self.location.origin;
const SW_VERSION = '3.0.1';

// Global state for location (lost when SW terminates, but useful for active sessions)
let lastKnownLocation = null;

// ── Push Event (VAPID Web Push) ────────────────────────────────

self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    console.log('[SW] 🔔 Push payload parsed:', data);
    
    const title = data.title || 'BondhuApp';
    const options = {
      body: data.body || data.message || '',
      icon: data.icon || '/logo.png',
      badge: '/logo.png',
      tag: data.tag || 'bondhu-push',
      data: { url: data.url || data.click_action || APP_URL },
      vibrate: [200, 100, 200],
      timestamp: data.timestamp || Date.now(),
      renotify: data.renotify !== undefined ? data.renotify : true,
      requireInteraction: data.requireInteraction !== undefined ? data.requireInteraction : false, // Changed to false by default to avoid spam flagging
      actions: [
        { action: 'open', title: 'Open BondhuApp' },
        { action: 'close', title: 'Dismiss' },
      ],
    };

    event.waitUntil(
      self.registration.showNotification(title, options)
        .then(() => console.log('[SW] ✅ Notification shown successfully:', title))
        .catch(err => console.error('[SW] ❌ Error showing notification:', err))
    );
  } catch (err) {
    console.error('[SW] ❌ Error parsing push data or showing notification:', err);
    // Fallback if payload isn't JSON
    event.waitUntil(
      self.registration.showNotification('BondhuApp', {
        body: event.data.text() || 'You have a new notification',
        icon: '/logo.png',
        data: { url: APP_URL },
        renotify: true,
        tag: 'bondhu-fallback'
      })
    );
  }
});

// ── Notification Click Handler ───────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  let urlToOpen = event.notification.data?.url || APP_URL;
  const logId = event.notification.data?.log_id;

  // Append log_id for A/B testing and click tracking by the main app
  if (logId) {
    urlToOpen += (urlToOpen.includes('?') ? '&' : '?') + 'click_log_id=' + logId;
  }

  // If action is 'close', just dismiss
  if (event.action === 'close') return;

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // If a tab is already open, focus it and navigate
        for (const client of clientList) {
          if (client.url.startsWith(APP_URL) && 'focus' in client) {
            client.focus();
            if (urlToOpen !== APP_URL) {
              client.navigate(urlToOpen);
            }
            return;
          }
        }
        // No tab open — open a new one
        return self.clients.openWindow(urlToOpen);
      })
  );
});

// ── Messages from Main Thread ────────────────────────────────
self.addEventListener('message', (event) => {
  if (!event.data || !event.data.type) return;

  const { type, payload } = event.data;

  // We can still allow the main thread to trigger local notifications if needed
  if (type === 'SHOW_NOTIFICATION') {
    const { title, body, icon, badge, tag, url, vibrate } = payload;
    self.registration.showNotification(title || 'BondhuApp', {
      body: body || '',
      icon: icon || '/logo.png',
      badge: badge || '/logo.png',
      tag: tag || 'bondhu-notification',
      data: { url: url || APP_URL },
      vibrate: vibrate || [200, 100, 200],
      requireInteraction: true,
      actions: [
        { action: 'open', title: 'View' },
        { action: 'close', title: 'Dismiss' },
      ],
    });
  }

  // Handle location updates from the main thread
  if (type === 'UPDATE_LOCATION') {
    lastKnownLocation = payload;
    console.log('[SW] 📍 Location updated in Service Worker:', lastKnownLocation);
  }
});


// ── Lifecycle ────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  console.log(`[SW] ✅ Service Worker v${SW_VERSION} installed (Web Push Mode)`);
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log(`[SW] ✅ Service Worker v${SW_VERSION} activated (Web Push Mode)`);
  event.waitUntil(self.clients.claim());
});

