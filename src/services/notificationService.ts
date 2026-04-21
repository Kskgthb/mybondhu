/**
 * Push Notification Service
 * Uses True Web Push Architecture to deliver notifications even when the app is closed.
 */

import { supabase } from '@/db/supabase';

export type NotificationType =
  | 'task_accepted'
  | 'bondhu_on_way'
  | 'bondhu_arrived'
  | 'task_started'
  | 'task_completed'
  | 'payment_received'
  | 'new_task_nearby'
  | 'message_received'
  | 'code_verified'
  | 'payment_confirmed';

interface NotificationConfig {
  title: string;
  body: string;
  icon: string;
  tag: string;
}

const NOTIFICATION_CONFIGS: Record<NotificationType, NotificationConfig> = {
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
    title: '⚡ Bondhu Started Task!',
    body: 'Bondhu started working on your task.',
    icon: '/logo.png',
    tag: 'task-started',
  },
  task_completed: {
    title: '✅ Task Completed!',
    body: 'Payment confirmed and task completed!',
    icon: '/logo.png',
    tag: 'task-completed',
  },
  payment_received: {
    title: '💰 Payment Received!',
    body: 'Payment has been confirmed for your completed task.',
    icon: '/logo.png',
    tag: 'payment-received',
  },
  new_task_nearby: {
    title: '📢 New Task Posted!',
    body: 'A new task is available in your area. Be the first to accept!',
    icon: '/logo.png',
    tag: 'new-task',
  },
  message_received: {
    title: '💬 New Message',
    body: 'You have a new message.',
    icon: '/logo.png',
    tag: 'message',
  },
  code_verified: {
    title: '🔐 Code Verified!',
    body: 'The completion code has been verified successfully.',
    icon: '/logo.png',
    tag: 'code-verified',
  },
  payment_confirmed: {
    title: '✅ Payment Confirmed!',
    body: 'Payment has been confirmed. Task is now complete!',
    icon: '/logo.png',
    tag: 'payment-confirmed',
  },
};

let swRegistration: ServiceWorkerRegistration | null = null;

// The VAPID Public Key generated for Web Push
// In production, this MUST come from your environment variables
const PUBLIC_VAPID_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || 'BDXhj031Lh_H3YUN5JzpRAZVgb3tukLc8TrG2nN0uQPJ8dYzFEzS5_Cd2m4gXbykdsLSg2BOmGumBHJQzrbAyU0';

/**
 * Register the Service Worker for push notifications
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.warn('[Notifications] Service Workers are not supported in this browser');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });
    swRegistration = registration;
    console.log('✅ Service Worker registered successfully');
    await navigator.serviceWorker.ready;
    return registration;
  } catch (error) {
    console.error('❌ Service Worker registration failed:', error);
    return null;
  }
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const permission = await Notification.requestPermission();
  return permission === 'granted';
}

/**
 * Convert VAPID key to Uint8Array for the PushManager API
 */
function urlBase64ToUint8Array(base64String: string) {
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
 * Subscribe the current browser to True Web Push
 */
export async function subscribeToWebPush(userId: string): Promise<void> {
  try {
    const registration = await registerServiceWorker();
    if (!registration) return;

    // Check if already subscribed
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      console.log('🌐 Requesting new push subscription...');
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY),
      });
    }

    // Parse the subscription to get keys
    const subJSON = subscription.toJSON();
    if (!subJSON.endpoint || !subJSON.keys) throw new Error('Invalid subscription');

    // Save subscription securely to Supabase
    const { error } = await supabase.from('push_subscriptions').upsert(
      {
        user_id: userId,
        endpoint: subJSON.endpoint,
        p256dh_key: subJSON.keys.p256dh,
        auth_key: subJSON.keys.auth,
      },
      { onConflict: 'endpoint' }
    );

    if (error) {
      console.error('❌ Failed to save push subscription to DB:', error);
    } else {
      console.log('✅ Push subscription saved to DB successfully');
    }
  } catch (err) {
    console.error('❌ Error during Web Push subscription:', err);
  }
}

/**
 * Update user's last known location in the database
 * This is crucial for the efficient 3km radius spatial query.
 */
export async function updateUserLocation(userId: string, location: { lat: number; lng: number }) {
  try {
    // We update BOTH sets of columns to ensure all systems (active tracking & proximity push) 
    // are working with the same data.
    await supabase.from('profiles').update({
      last_location_lat: location.lat,
      last_location_lng: location.lng,
      location_lat: location.lat,
      location_lng: location.lng,
      location_updated_at: new Date().toISOString()
    }).eq('id', userId);
    console.log('📍 Location synced to backend for spatial notifications');
  } catch (err) {
    console.error('❌ Failed to update location:', err);
  }
}

/**
 * Initialize the full notification system:
 */
export async function initializeNotificationSystem(
  userId: string,
  userRole?: string,
  location?: { lat: number; lng: number }
): Promise<void> {
  const granted = await requestNotificationPermission();

  if (granted) {
    console.log('✅ Notifications enabled for user:', userId);
    
    // Subscribe to backend push
    await subscribeToWebPush(userId);
    
    // Sync location for proximity alerts
    if (location) {
      await updateUserLocation(userId, location);
    }
  } else {
    console.log('ℹ️ Notifications not enabled (permission not granted)');
  }
}

/**
 * Teardown / Unsubscribe (on logout)
 */
export async function teardownSWRealtime(): Promise<void> {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      // We don't necessarily unsubscribe completely because they might log in again, 
      // but a proper app would delete the subscription from the DB here.
      const subJSON = subscription.toJSON();
      if (subJSON.endpoint) {
        await supabase.from('push_subscriptions').delete().eq('endpoint', subJSON.endpoint);
      }
      await subscription.unsubscribe();
      console.log('🧹 Push subscription removed on logout');
    }
  } catch (err) {
    console.error('❌ Error during push unsubscribe:', err);
  }
}

// ============================================================
// Show Notifications (Local / Active Tab)
// ============================================================

export async function showPushNotification(
  type: NotificationType,
  options?: {
    customTitle?: string;
    customBody?: string;
    taskId?: string;
    bondhuName?: string;
    taskTitle?: string;
  }
): Promise<void> {
  const config = NOTIFICATION_CONFIGS[type];
  let title = options?.customTitle || config.title;
  let body = options?.customBody || config.body;

  if (options?.bondhuName) {
    body = body.replace('A Bondhu', options.bondhuName).replace('Your Bondhu', options.bondhuName);
  }
  if (options?.taskTitle) {
    body += ` — "${options.taskTitle}"`;
  }

  const url = options?.taskId
    ? `${window.location.origin}/task/${options.taskId}`
    : window.location.origin;

  if (swRegistration) {
    try {
      await swRegistration.showNotification(title, {
        body,
        icon: `${window.location.origin}${config.icon}`,
        badge: `${window.location.origin}/logo.png`,
        tag: `${config.tag}-${Date.now()}`,
        data: { url },
        requireInteraction: false,
        actions: [
          { action: 'open', title: 'Open BondhuApp' },
          { action: 'close', title: 'Dismiss' },
        ],
      } as NotificationOptions);
      return;
    } catch (err) {
      console.warn('[Notifications] SW local notification failed:', err);
    }
  }

  // Final fallback: standard Notification API (only works when tab is open)
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon: `${window.location.origin}${config.icon}`,
      badge: `${window.location.origin}/logo.png`,
      tag: `${config.tag}-${Date.now()}`,
    });
  }
}

/**
 * Send the user's current location to the Service Worker
 * so it can perform proximity-based notifications for new tasks.
 */
export function sendLocationToSW(lat: number, lng: number) {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'UPDATE_LOCATION',
      payload: { lat, lng }
    });
  }
}


// ============================================================
// Supabase Realtime Listeners (Foreground Backup)
// ============================================================

// The backend handles background push notifications, but we still keep these active
// so the UI updates instantly while the user is actively staring at the app.

export function subscribeToUserNotifications(userId: string) {
  const channel = supabase
    .channel(`user-notifications-${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        const notification = payload.new as {
          type: string;
          title: string;
          message: string;
          task_id: string | null;
        };

        const typeMap: Record<string, NotificationType> = {
          task_accepted: 'task_accepted',
          bondhu_on_way: 'bondhu_on_way',
          bondhu_arrived: 'bondhu_arrived',
          task_started: 'task_started',
          task_completed: 'task_completed',
          payment_received: 'payment_received',
          payment_confirmed: 'payment_confirmed',
          code_verified: 'code_verified',
          new_task_nearby: 'new_task_nearby',
          message_received: 'message_received',
        };

        const notifType = typeMap[notification.type] || 'task_accepted';

        showPushNotification(notifType, {
          customTitle: notification.title,
          customBody: notification.message,
          taskId: notification.task_id || undefined,
        });
      }
    )
    .subscribe();

  return channel;
}

export function subscribeToTaskUpdates(taskId: string, posterName?: string) {
  const channel = supabase
    .channel(`task-updates-${taskId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'tasks',
        filter: `id=eq.${taskId}`,
      },
      (payload) => {
        const oldStatus = (payload.old as any)?.status;
        const newStatus = (payload.new as any)?.status;
        const taskTitle = (payload.new as any)?.title;

        if (oldStatus === newStatus) return; // No status change

        const statusNotifMap: Record<string, NotificationType> = {
          accepted: 'task_accepted',
          in_progress: 'task_started',
          completed: 'task_completed',
        };

        const notifType = statusNotifMap[newStatus];
        if (notifType) {
          showPushNotification(notifType, {
            taskId,
            taskTitle,
          });
        }
      }
    )
    .subscribe();

  return channel;
}

export function subscribeToAssignmentUpdates(taskId: string) {
  const channel = supabase
    .channel(`assignment-updates-${taskId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'task_assignments',
        filter: `task_id=eq.${taskId}`,
      },
      (payload) => {
        const oldStatus = (payload.old as any)?.status;
        const newStatus = (payload.new as any)?.status;

        if (oldStatus === newStatus) return;

        const statusMap: Record<string, NotificationType> = {
          accepted: 'task_accepted',
          in_progress: 'bondhu_on_way',
          completed: 'task_completed',
        };

        const notifType = statusMap[newStatus];
        if (notifType) {
          showPushNotification(notifType, { taskId });
        }
      }
    )
    .subscribe();

  return channel;
}

export function unsubscribeNotifications(channel: any) {
  if (channel) supabase.removeChannel(channel);
}
