export const getClearedTasks = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem('clearedTasks') || '[]');
  } catch {
    return [];
  }
};

export const clearTask = (taskId: string) => {
  const cleared = getClearedTasks();
  if (!cleared.includes(taskId)) {
    localStorage.setItem('clearedTasks', JSON.stringify([...cleared, taskId]));
  }
};

export const getClearedNotifications = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem('clearedNotifications') || '[]');
  } catch {
    return [];
  }
};

export const clearNotification = (notificationId: string) => {
  const cleared = getClearedNotifications();
  if (!cleared.includes(notificationId)) {
    localStorage.setItem('clearedNotifications', JSON.stringify([...cleared, notificationId]));
  }
};

export const clearAllNotifications = (notificationIds: string[]) => {
  const cleared = getClearedNotifications();
  const newCleared = Array.from(new Set([...cleared, ...notificationIds]));
  localStorage.setItem('clearedNotifications', JSON.stringify(newCleared));
};
