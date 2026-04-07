import { supabase } from '@/db/supabase';
import { toast } from 'sonner';

/**
 * Initialize browser push notifications for the current user.
 * Uses the native Web Push API — no Firebase required.
 */
export const initializePushNotifications = async (userId: string): Promise<void> => {
  try {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('Notification permission denied');
      return;
    }
    console.log('✅ Browser notifications enabled for user:', userId);
  } catch (error) {
    console.error('Error initializing push notifications:', error);
  }
};

export const showBrowserNotification = (title: string, body: string, icon?: string): void => {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body, icon: icon || '/logo.png', badge: '/logo.png' });
  }
};

export const showToastNotification = (title: string, body: string, taskId?: string): void => {
  toast.info(title, {
    description: body,
    duration: 5000,
    action: taskId ? { label: 'View', onClick: () => { window.location.href = `/task/${taskId}`; } } : undefined,
  });
};

export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

export const requestTaskNotification = async (
  taskId: string,
  taskTitle: string,
  taskLocation: { lat: number; lng: number },
  maxDistance: number = 10
): Promise<void> => {
  try {
    const { error } = await supabase.functions.invoke('send-task-notification', {
      body: { taskId, taskTitle, location: taskLocation, maxDistance },
    });
    if (error) console.error('Error sending task notification:', error);
  } catch (error) {
    console.error('Error requesting task notification:', error);
  }
};
