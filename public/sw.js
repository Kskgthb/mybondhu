// ============================================================
// BondhuApp Service Worker — Background Push Notifications
// Works even when the website tab is closed.
//
// Features:
//   1. Supabase Realtime inside the SW for background events
//   2. Proximity-based "new task nearby" alerts (~3 km)
//   3. Full task lifecycle notifications (accepted → on way → arrived → done → paid)
//   4. Click-to-open: tapping a notification opens the relevant page
// ============================================================

const APP_URL = self.location.origin;
const SW_VERSION = '2.0.0';

// ── State ────────────────────────────────────────────────────
let supabaseUrl = null;
let supabaseKey = null;
let accessToken = null;
let userId = null;
let userRole = null; // 'bondhu' | 'need_bondhu'
let userLocation = null; // { lat, lng }
let realtimeSocket = null;
let heartbeatInterval = null;
const NEARBY_RADIUS_KM = 3; // Notify Bondhu if a new task is within this radius

// ── Haversine ────────────────────────────────────────────────
function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// ── Notification Configs ─────────────────────────────────────
const NOTIF_CONFIGS = {
  new_task_nearby: {
    title: '📢 New Task Near You!',
    body: 'A new task is available nearby. Be the first to accept!',
    icon: '/logo.png',
    tag: 'new-task-nearby',
  },
  task_accepted: {
    title: '🎉 Task Accepted!',
    body: 'A Bondhu has accepted your task and is preparing to help!',
    icon: '/logo.png',
    tag: 'task-accepted',
  },
  bondhu_on_way: {
    title: '🚴 Bondhu On The Way!',
    body: 'Your Bondhu is heading to your location now.',
    icon: '/logo.png',
    tag: 'bondhu-on-way',
  },
  bondhu_arrived: {
    title: '📍 Bondhu Arrived!',
    body: 'Your Bondhu has reached the location!',
    icon: '/logo.png',
    tag: 'bondhu-arrived',
  },
  task_started: {
    title: '⚡ Task Started!',
    body: 'Your Bondhu has started working on your task.',
    icon: '/logo.png',
    tag: 'task-started',
  },
  task_completed: {
    title: '✅ Task Done!',
    body: 'Your task has been successfully completed!',
    icon: '/logo.png',
    tag: 'task-completed',
  },
  code_verified: {
    title: '🔐 Code Verified!',
    body: 'The completion code has been verified successfully.',
    icon: '/logo.png',
    tag: 'code-verified',
  },
  payment_confirmed: {
    title: '💰 Trust Delivered!',
    body: 'Payment confirmed — task complete!',
    icon: '/logo.png',
    tag: 'payment-confirmed',
  },
  message_received: {
    title: '💬 New Message',
    body: 'You have a new message.',
    icon: '/logo.png',
    tag: 'message',
  },
};

// ── Show Notification ────────────────────────────────────────
async function fireNotification(type, overrides = {}) {
  const config = NOTIF_CONFIGS[type] || NOTIF_CONFIGS.task_accepted;
  const title = overrides.title || config.title;
  const body = overrides.body || config.body;
  const url = overrides.url || APP_URL;

  try {
    await self.registration.showNotification(title, {
      body,
      icon: config.icon,
      badge: '/logo.png',
      tag: overrides.tag || config.tag,
      data: { url },
      vibrate: [200, 100, 200],
      requireInteraction: type !== 'message_received',
      actions: [
        { action: 'open', title: 'View' },
        { action: 'close', title: 'Dismiss' },
      ],
    });
    console.log(`[SW] 🔔 Notification shown: ${title}`);
  } catch (err) {
    console.error('[SW] Failed to show notification:', err);
  }
}

// ── Supabase Realtime via WebSocket ──────────────────────────
function connectSupabaseRealtime() {
  if (!supabaseUrl || !supabaseKey || !userId) {
    console.log('[SW] Missing credentials, skipping realtime connection');
    return;
  }

  // Tear down existing connection
  disconnectRealtime();

  try {
    const wsUrl = supabaseUrl.replace('https://', 'wss://').replace('http://', 'ws://');
    const realtimeUrl = `${wsUrl}/realtime/v1/websocket?apikey=${supabaseKey}&vsn=1.0.0`;

    console.log('[SW] 🔌 Connecting to Supabase Realtime...');
    realtimeSocket = new WebSocket(realtimeUrl);

    realtimeSocket.onopen = () => {
      console.log('[SW] ✅ Realtime WebSocket connected');

      // Authenticate the connection for Row Level Security (RLS)
      if (accessToken) {
        realtimeSocket.send(JSON.stringify({
          topic: 'realtime',
          event: 'access_token',
          payload: { access_token: accessToken },
          ref: 'auth'
        }));
        console.log('[SW] 🔐 Realtime WebSocket authenticated');
      }

      // Join the realtime channel for postgres_changes
      // Subscribe to tasks table (new tasks for bondhu proximity alerts)
      const joinTasksMsg = {
        topic: `realtime:public:tasks`,
        event: 'phx_join',
        payload: {
          config: {
            broadcast: { self: false },
            presence: { key: '' },
            postgres_changes: [
              {
                event: 'INSERT',
                schema: 'public',
                table: 'tasks',
              },
              {
                event: 'UPDATE',
                schema: 'public',
                table: 'tasks',
              },
            ],
          },
        },
        ref: '1',
      };
      realtimeSocket.send(JSON.stringify(joinTasksMsg));

      // Subscribe to task_assignments table
      const joinAssignmentsMsg = {
        topic: `realtime:public:task_assignments`,
        event: 'phx_join',
        payload: {
          config: {
            broadcast: { self: false },
            presence: { key: '' },
            postgres_changes: [
              {
                event: 'INSERT',
                schema: 'public',
                table: 'task_assignments',
              },
              {
                event: 'UPDATE',
                schema: 'public',
                table: 'task_assignments',
              },
            ],
          },
        },
        ref: '2',
      };
      realtimeSocket.send(JSON.stringify(joinAssignmentsMsg));

      // Subscribe to notifications table for this user
      const joinNotifMsg = {
        topic: `realtime:public:notifications:user_id=eq.${userId}`,
        event: 'phx_join',
        payload: {
          config: {
            broadcast: { self: false },
            presence: { key: '' },
            postgres_changes: [
              {
                event: 'INSERT',
                schema: 'public',
                table: 'notifications',
                filter: `user_id=eq.${userId}`,
              },
            ],
          },
        },
        ref: '3',
      };
      realtimeSocket.send(JSON.stringify(joinNotifMsg));

      // Start heartbeat to keep connection alive
      startHeartbeat();
    };

    realtimeSocket.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        handleRealtimeMessage(msg);
      } catch (err) {
        // Ignore parse errors for heartbeat responses etc.
      }
    };

    realtimeSocket.onerror = (error) => {
      console.error('[SW] Realtime WebSocket error:', error);
    };

    realtimeSocket.onclose = (event) => {
      console.log('[SW] Realtime WebSocket closed, code:', event.code);
      stopHeartbeat();
      // Auto-reconnect after 5 seconds
      setTimeout(() => {
        if (userId && supabaseUrl) {
          console.log('[SW] 🔄 Reconnecting Realtime...');
          connectSupabaseRealtime();
        }
      }, 5000);
    };
  } catch (err) {
    console.error('[SW] Failed to connect Realtime:', err);
  }
}

function disconnectRealtime() {
  stopHeartbeat();
  if (realtimeSocket) {
    try {
      realtimeSocket.close();
    } catch (e) {
      // Ignore
    }
    realtimeSocket = null;
  }
}

function startHeartbeat() {
  stopHeartbeat();
  heartbeatInterval = setInterval(() => {
    if (realtimeSocket && realtimeSocket.readyState === WebSocket.OPEN) {
      realtimeSocket.send(
        JSON.stringify({
          topic: 'phoenix',
          event: 'heartbeat',
          payload: {},
          ref: Date.now().toString(),
        })
      );
    }
  }, 30000); // Every 30 seconds
}

function stopHeartbeat() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
}

// ── Handle Realtime Messages ─────────────────────────────────
function handleRealtimeMessage(msg) {
  // Only handle postgres_changes events
  if (msg.event !== 'postgres_changes') return;

  const payload = msg.payload;
  if (!payload || !payload.data) return;

  const { type: changeType, table, record, old_record } = payload.data;

  console.log(`[SW] 📡 Realtime: ${changeType} on ${table}`);

  if (table === 'tasks') {
    handleTaskChange(changeType, record, old_record);
  } else if (table === 'task_assignments') {
    handleAssignmentChange(changeType, record, old_record);
  } else if (table === 'notifications') {
    handleNotificationInsert(record);
  }
}

// ── Task Changes ─────────────────────────────────────────────
function handleTaskChange(changeType, record, oldRecord) {
  if (!record) return;

  // NEW TASK INSERTED — check if it's nearby for Bondhu users
  if (changeType === 'INSERT' && record.status === 'pending') {
    checkNearbyAndNotify(record);
    return;
  }

  // TASK STATUS UPDATED — notify the poster
  if (changeType === 'UPDATE' && oldRecord) {
    const oldStatus = oldRecord.status;
    const newStatus = record.status;

    if (oldStatus === newStatus) return;

    // Only notify the task poster
    if (record.poster_id !== userId) return;

    const taskUrl = `${APP_URL}/task/${record.id}`;
    const taskTitle = record.title || 'Your task';

    if (newStatus === 'accepted') {
      fireNotification('task_accepted', {
        body: `A Bondhu has accepted "${taskTitle}"!`,
        url: taskUrl,
      });
    } else if (newStatus === 'in_progress') {
      fireNotification('task_started', {
        body: `Bondhu has started working on "${taskTitle}".`,
        url: taskUrl,
      });
    } else if (newStatus === 'completed') {
      fireNotification('task_completed', {
        body: `"${taskTitle}" has been completed! Please verify and rate.`,
        url: taskUrl,
      });
    }

    // Check code_verified / payment_verified changes
    if (record.code_verified && !oldRecord.code_verified) {
      fireNotification('code_verified', {
        body: `Completion code verified for "${taskTitle}".`,
        url: taskUrl,
      });
    }
    if (record.payment_verified && !oldRecord.payment_verified) {
      fireNotification('payment_confirmed', {
        body: `Payment confirmed for "${taskTitle}" — Trust Delivered!`,
        url: taskUrl,
      });
    }
  }
}

// ── Assignment Changes ───────────────────────────────────────
function handleAssignmentChange(changeType, record, oldRecord) {
  if (!record) return;

  // On INSERT — a task was just accepted
  if (changeType === 'INSERT') {
    // Don't notify yourself
    if (record.bondhu_id === userId) return;
    // We'll let the task update handler deal with this
    return;
  }

  // On UPDATE — status changed
  if (changeType === 'UPDATE' && oldRecord) {
    const oldStatus = oldRecord.status;
    const newStatus = record.status;
    if (oldStatus === newStatus) return;

    const taskUrl = `${APP_URL}/task/${record.task_id}`;

    // Notify the poster about bondhu movement
    // (We can't easily get poster_id here, so we fire for any user
    //  and the main thread can deduplicate if needed)

    if (newStatus === 'in_progress' && oldStatus === 'accepted') {
      // Bondhu started / on the way
      fireNotification('bondhu_on_way', {
        body: 'Your Bondhu is on the way to the task location!',
        url: taskUrl,
      });
    }
  }
}

// ── Notification Table Insert ────────────────────────────────
function handleNotificationInsert(record) {
  if (!record) return;

  // This is a notification specifically for this user (filtered by user_id)
  const type = record.type || 'task_accepted';
  const title = record.title || NOTIF_CONFIGS[type]?.title || 'BondhuApp';
  const body = record.message || NOTIF_CONFIGS[type]?.body || '';
  const taskUrl = record.task_id
    ? `${APP_URL}/task/${record.task_id}`
    : APP_URL;

  fireNotification(type, { title, body, url: taskUrl });
}

// ── Proximity Check for New Tasks ────────────────────────────
function checkNearbyAndNotify(task) {
  // Only notify Bondhu-role users
  if (userRole === 'need_bondhu') return;

  // Need user location to check distance
  if (!userLocation || !userLocation.lat || !userLocation.lng) return;

  // Need task location
  if (!task.location_lat || !task.location_lng) return;

  const distance = haversineDistance(
    userLocation.lat,
    userLocation.lng,
    task.location_lat,
    task.location_lng
  );

  console.log(`[SW] 📍 New task "${task.title}" is ${distance.toFixed(1)} km away`);

  if (distance <= NEARBY_RADIUS_KM) {
    const distStr = distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)} km`;
    fireNotification('new_task_nearby', {
      title: '📢 New Task Near You!',
      body: `"${task.title}" — ₹${task.amount} (${distStr} away)`,
      url: `${APP_URL}/task/${task.id}`,
      tag: `new-task-${task.id}`,
    });
  }
}

// ── Notification Click Handler ───────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || APP_URL;

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

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification dismissed:', event.notification.tag);
});

// ── Messages from Main Thread ────────────────────────────────
self.addEventListener('message', (event) => {
  if (!event.data || !event.data.type) return;

  const { type, payload } = event.data;

  switch (type) {
    case 'INIT_REALTIME': {
      // Main thread sends Supabase credentials + user info
      supabaseUrl = payload.supabaseUrl;
      supabaseKey = payload.supabaseKey;
      userId = payload.userId;
      userRole = payload.userRole || null;
      accessToken = payload.accessToken || null;
      if (payload.location) {
        userLocation = payload.location;
      }
      console.log(`[SW] 🔑 Credentials received for user ${userId?.slice(0, 8)}... (role: ${userRole})`);
      connectSupabaseRealtime();
      break;
    }

    case 'UPDATE_LOCATION': {
      // Main thread sends updated location
      userLocation = payload;
      console.log(`[SW] 📍 Location updated: ${payload.lat.toFixed(4)}, ${payload.lng.toFixed(4)}`);
      break;
    }

    case 'UPDATE_ROLE': {
      userRole = payload.role;
      console.log(`[SW] 👤 Role updated: ${userRole}`);
      break;
    }

    case 'SHOW_NOTIFICATION': {
      // Direct notification request from main thread
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
      break;
    }

    case 'TEARDOWN': {
      // User logged out — cleanup
      console.log('[SW] 🧹 Tearing down realtime connection');
      disconnectRealtime();
      userId = null;
      userRole = null;
      userLocation = null;
      supabaseUrl = null;
      supabaseKey = null;
      accessToken = null;
      break;
    }

    default:
      console.log('[SW] Unknown message type:', type);
  }
});

// ── Push Event (for future Web Push / VAPID) ─────────────────
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: 'BondhuApp', body: event.data?.text() || 'You have a new notification' };
  }

  const title = data.title || 'BondhuApp';
  const options = {
    body: data.body || data.message || '',
    icon: data.icon || '/logo.png',
    badge: '/logo.png',
    tag: data.tag || 'push-notification',
    data: { url: data.url || data.click_action || APP_URL },
    vibrate: [200, 100, 200],
    requireInteraction: true,
    actions: [
      { action: 'open', title: 'View' },
      { action: 'close', title: 'Dismiss' },
    ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// ── Lifecycle ────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  console.log(`[SW] ✅ Service Worker v${SW_VERSION} installed`);
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log(`[SW] ✅ Service Worker v${SW_VERSION} activated`);
  event.waitUntil(self.clients.claim());
});
