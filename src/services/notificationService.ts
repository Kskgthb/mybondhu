/**
 * Push Notification Service
 * Uses Service Worker for notifications that work even when tab is closed.
 *
 * Architecture:
 *   1. Registers the Service Worker
 *   2. Requests notification permission
 *   3. Sends Supabase credentials to the SW so it can maintain its own
 *      Realtime connection for background notifications
 *   4. Sends location updates to the SW for proximity-based task alerts
 *   5. Falls back to in-page notifications if SW is unavailable
 *
 * Notification types:
 *   - new_task_nearby:   "New task available near you!" (Bondhu, ~3 km)
 *   - task_accepted:     "Your task has been accepted by a Bondhu!"
 *   - bondhu_on_way:     "Your Bondhu is on the way!"
 *   - bondhu_arrived:    "Your Bondhu has reached the location!"
 *   - task_started:      "Bondhu has started working on your task!"
 *   - task_completed:    "Your task has been completed!"
 *   - code_verified:     "Completion code verified!"
 *   - payment_confirmed: "Payment confirmed — Trust Delivered!"
 *   - message_received:  "You have a new message"
 */

import { supabase } from '@/db/supabase';

// ============================================================
// Notification Configs
// ============================================================

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
    title: '⚡ Task Started!',
    body: 'Your Bondhu has started working on your task.',
    icon: '/logo.png',
    tag: 'task-started',
  },
  task_completed: {
    title: '✅ Task Completed!',
    body: 'Your task has been successfully completed!',
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
    title: '📢 New Task Near You!',
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

// ============================================================
// Service Worker Registration
// ============================================================

let swRegistration: ServiceWorkerRegistration | null = null;

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

    // Wait for the SW to be ready
    await navigator.serviceWorker.ready;
    return registration;
  } catch (error) {
    console.error('❌ Service Worker registration failed:', error);
    return null;
  }
}

// ============================================================
// Permission Management
// ============================================================

/**
 * Request notification permission (only if not already decided)
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.warn('[Notifications] Browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission === 'denied') {
    console.log('[Notifications] Permission previously denied, skipping request');
    return false;
  }

  // Only request if 'default' (never asked)
  const permission = await Notification.requestPermission();
  return permission === 'granted';
}

// ============================================================
// Service Worker Messaging
// ============================================================

/**
 * Send credentials and user info to Service Worker so it can establish
 * its own Supabase Realtime connection for background notifications.
 */
export async function sendCredentialsToSW(
  userId: string,
  userRole?: string,
  location?: { lat: number; lng: number }
): Promise<void> {
  const sw = await getActiveServiceWorker();
  if (!sw) {
    console.warn('[Notifications] No active SW to send credentials to');
    return;
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  sw.postMessage({
    type: 'INIT_REALTIME',
    payload: {
      supabaseUrl,
      supabaseKey,
      userId,
      userRole: userRole || null,
      location: location || null,
    },
  });

  console.log('✅ Credentials sent to Service Worker for background notifications');
}

/**
 * Send location update to SW for proximity-based notifications
 */
export function sendLocationToSW(lat: number, lng: number): void {
  getActiveServiceWorker().then((sw) => {
    if (sw) {
      sw.postMessage({
        type: 'UPDATE_LOCATION',
        payload: { lat, lng },
      });
    }
  });
}

/**
 * Send role update to SW
 */
export function sendRoleToSW(role: string): void {
  getActiveServiceWorker().then((sw) => {
    if (sw) {
      sw.postMessage({
        type: 'UPDATE_ROLE',
        payload: { role },
      });
    }
  });
}

/**
 * Tear down SW realtime connection (on logout)
 */
export async function teardownSWRealtime(): Promise<void> {
  const sw = await getActiveServiceWorker();
  if (sw) {
    sw.postMessage({ type: 'TEARDOWN' });
    console.log('🧹 SW realtime teardown requested');
  }
}

/**
 * Get the active service worker instance
 */
async function getActiveServiceWorker(): Promise<ServiceWorker | null> {
  if (!('serviceWorker' in navigator)) return null;

  try {
    const registration = swRegistration || (await navigator.serviceWorker.ready);
    swRegistration = registration;
    return registration.active;
  } catch {
    return null;
  }
}

// ============================================================
// Initialize Notification System
// ============================================================

/**
 * Initialize the full notification system:
 * 1. Register Service Worker
 * 2. Request Permission
 * 3. Send credentials to SW for background Realtime
 */
export async function initializeNotificationSystem(
  userId: string,
  userRole?: string,
  location?: { lat: number; lng: number }
): Promise<void> {
  // Register service worker
  await registerServiceWorker();

  // Request permission
  const granted = await requestNotificationPermission();

  if (granted) {
    console.log('✅ Notifications enabled for user:', userId);

    // Send credentials to SW for background operation
    await sendCredentialsToSW(userId, userRole, location);
  } else {
    console.log('ℹ️ Notifications not enabled (permission not granted)');
  }
}

// ============================================================
// Show Notifications
// ============================================================

/**
 * Show a notification using the Service Worker (works even when tab is closed)
 */
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

  // Build the notification content
  let title = options?.customTitle || config.title;
  let body = options?.customBody || config.body;

  // Personalize messages
  if (options?.bondhuName) {
    body = body.replace('A Bondhu', options.bondhuName).replace('Your Bondhu', options.bondhuName);
  }
  if (options?.taskTitle) {
    body += ` — "${options.taskTitle}"`;
  }

  // Build the click URL
  const url = options?.taskId
    ? `${window.location.origin}/task/${options.taskId}`
    : window.location.origin;

  // Try Service Worker notification (works when tab closed)
  const sw = await getActiveServiceWorker();
  if (sw) {
    try {
      // Send SHOW_NOTIFICATION message to SW
      sw.postMessage({
        type: 'SHOW_NOTIFICATION',
        payload: {
          title,
          body,
          icon: config.icon,
          badge: '/logo.png',
          tag: config.tag,
          url,
          vibrate: [200, 100, 200],
        },
      });
      return;
    } catch (err) {
      console.warn('[Notifications] SW notification failed, falling back:', err);
    }
  }

  // Fallback: use registration.showNotification directly
  if (swRegistration) {
    try {
      await swRegistration.showNotification(title, {
        body,
        icon: config.icon,
        badge: '/logo.png',
        tag: config.tag,
        data: { url },
        requireInteraction: type !== 'message_received',
        actions: [
          { action: 'open', title: 'View' },
          { action: 'close', title: 'Dismiss' },
        ],
      } as NotificationOptions);
      return;
    } catch (err) {
      console.warn('[Notifications] SW registration notification failed:', err);
    }
  }

  // Final fallback: standard Notification API (only works when tab is open)
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon: config.icon,
      badge: '/logo.png',
      tag: config.tag,
    });
  }
}

// ============================================================
// Supabase Realtime Notification Listeners (Main Thread Backup)
// ============================================================

/**
 * Subscribe to real-time notifications for a user
 * This is a BACKUP to the SW realtime — it fires when the tab is open.
 */
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

        // Map DB notification type to our NotificationType
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

/**
 * Subscribe to task status changes (for task poster)
 * Fires notifications when their task status changes
 */
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

        // Map status transitions to notification types
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

/**
 * Subscribe to assignment updates (bondhu on the way, arrived, etc.)
 */
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

// ============================================================
// Cleanup
// ============================================================

export function unsubscribeNotifications(channel: any) {
  if (channel) {
    supabase.removeChannel(channel);
  }
}
