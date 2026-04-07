import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Bell } from 'lucide-react';
import NotificationDialog from './NotificationDialog';
import { playNotificationSound, requestNotificationPermission } from '@/lib/notifications';
import { toast } from 'sonner';

export default function TestNotificationButton() {
  const [showDialog, setShowDialog] = useState(false);

  const handleTestNotification = async () => {
    // Request permission first
    const hasPermission = await requestNotificationPermission();
    
    if (hasPermission) {
      toast.success('Notification permission granted!');
    } else {
      toast.info('Notification permission denied or not supported');
    }
    
    // Play sound
    playNotificationSound('task_accepted');
    
    // Show dialog
    setShowDialog(true);
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleTestNotification}
        className="gap-2"
      >
        <Bell className="h-4 w-4" />
        Test Notification
      </Button>

      <NotificationDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        type="task_accepted"
        title="🎉 Test Notification"
        message="This is a test notification with sound! If you can hear a sound and see this popup, notifications are working correctly."
        actionLabel="Got it!"
        onAction={() => setShowDialog(false)}
      />
    </>
  );
}
