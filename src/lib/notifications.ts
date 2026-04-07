// Notification utilities with sound support
import { generateNotificationSound } from './soundGenerator';

export type NotificationType = 'task_accepted' | 'bondhu_arrived' | 'task_completed';

interface NotificationConfig {
  title: string;
  message: string;
  soundType: 'success' | 'arrival' | 'completion';
}

const notificationConfigs: Record<NotificationType, NotificationConfig> = {
  task_accepted: {
    title: '🎉 Task Accepted!',
    message: 'A Bondhu has accepted your task and is on the way!',
    soundType: 'success'
  },
  bondhu_arrived: {
    title: '📍 Bondhu Arrived!',
    message: 'Your Bondhu has reached the location!',
    soundType: 'arrival'
  },
  task_completed: {
    title: '✅ Task Completed!',
    message: 'The task has been successfully completed!',
    soundType: 'completion'
  }
};

// Play notification sound using Web Audio API
export const playNotificationSound = (type: NotificationType) => {
  try {
    const config = notificationConfigs[type];
    generateNotificationSound(config.soundType);
  } catch (error) {
    console.warn('Error playing notification sound:', error);
  }
};

// Show browser notification with sound
export const showNotification = (type: NotificationType, customMessage?: string) => {
  const config = notificationConfigs[type];
  
  // Play sound
  playNotificationSound(type);
  
  // Show browser notification if permission granted
  if ('Notification' in window && Notification.permission === 'granted') {
    const options: NotificationOptions = {
      body: customMessage || config.message,
      icon: '/logo.png',
      badge: '/logo.png',
      tag: type,
      requireInteraction: true
    };
    
    // Add vibrate if supported
    if ('vibrate' in navigator) {
      (options as any).vibrate = [200, 100, 200];
    }
    
    new Notification(config.title, options);
  }
};

// Request notification permission
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
};

// Initialize notifications on app load
export const initializeNotifications = async () => {
  await requestNotificationPermission();
};
