import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Bell, BellOff, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { initializePushNotifications } from '@/services/notificationService';
import { useAuth } from '@/contexts/AuthContext';

export default function NotificationSettings() {
  const { user } = useAuth();
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [isInitializing, setIsInitializing] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);

  useEffect(() => {
    checkNotificationPermission();
  }, []);

  const checkNotificationPermission = () => {
    if ('Notification' in window) {
      const permission = Notification.permission;
      setNotificationPermission(permission);
      setPushEnabled(permission === 'granted');
    }
  };

  const handleEnableNotifications = async () => {
    if (!user) {
      toast.error('Please log in to enable notifications');
      return;
    }

    setIsInitializing(true);
    try {
      await initializePushNotifications(user.id);
      checkNotificationPermission();
      toast.success('Push notifications enabled successfully!');
    } catch (error) {
      console.error('Error enabling notifications:', error);
      toast.error('Failed to enable notifications. Please try again.');
    } finally {
      setIsInitializing(false);
    }
  };

  const handleDisableNotifications = () => {
    toast.info('To disable notifications, please use your browser settings');
  };

  const getPermissionBadge = () => {
    switch (notificationPermission) {
      case 'granted':
        return (
          <Badge className="bg-success">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Enabled
          </Badge>
        );
      case 'denied':
        return (
          <Badge variant="destructive">
            <BellOff className="h-3 w-3 mr-1" />
            Blocked
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <AlertCircle className="h-3 w-3 mr-1" />
            Not Set
          </Badge>
        );
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Push Notifications
            </CardTitle>
            <CardDescription>
              Receive real-time updates about your tasks
            </CardDescription>
          </div>
          {getPermissionBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Toggle */}
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <div className="space-y-1">
            <Label htmlFor="push-notifications" className="text-base font-medium">
              Enable Push Notifications
            </Label>
            <p className="text-sm text-muted-foreground">
              Get notified even when the app is closed
            </p>
          </div>
          <Switch
            id="push-notifications"
            checked={pushEnabled}
            onCheckedChange={(checked) => {
              if (checked) {
                handleEnableNotifications();
              } else {
                handleDisableNotifications();
              }
            }}
            disabled={isInitializing || notificationPermission === 'denied'}
          />
        </div>

        {/* Notification Types */}
        <div className="space-y-4">
          <h4 className="font-semibold text-sm">You will receive notifications for:</h4>
          <div className="space-y-3">
            <div className="flex items-start gap-3 text-sm">
              <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <CheckCircle2 className="h-3 w-3 text-primary" />
              </div>
              <div>
                <p className="font-medium">New Tasks Nearby</p>
                <p className="text-muted-foreground text-xs">
                  When someone posts a task in your area (Bondhu mode)
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 text-sm">
              <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <CheckCircle2 className="h-3 w-3 text-primary" />
              </div>
              <div>
                <p className="font-medium">Task Accepted</p>
                <p className="text-muted-foreground text-xs">
                  When a Bondhu accepts your task
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 text-sm">
              <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <CheckCircle2 className="h-3 w-3 text-primary" />
              </div>
              <div>
                <p className="font-medium">Bondhu Arrived</p>
                <p className="text-muted-foreground text-xs">
                  When your Bondhu arrives at the task location
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 text-sm">
              <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <CheckCircle2 className="h-3 w-3 text-primary" />
              </div>
              <div>
                <p className="font-medium">Task Completed</p>
                <p className="text-muted-foreground text-xs">
                  When your task is marked as completed
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Permission Denied Help */}
        {notificationPermission === 'denied' && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div className="space-y-2">
                <p className="text-sm font-medium text-destructive">
                  Notifications Blocked
                </p>
                <p className="text-xs text-muted-foreground">
                  You have blocked notifications for this site. To enable them:
                </p>
                <ol className="text-xs text-muted-foreground list-decimal list-inside space-y-1">
                  <li>Click the lock icon in your browser's address bar</li>
                  <li>Find "Notifications" in the permissions list</li>
                  <li>Change the setting to "Allow"</li>
                  <li>Refresh this page</li>
                </ol>
              </div>
            </div>
          </div>
        )}

        {/* Refresh Button */}
        {notificationPermission === 'granted' && (
          <Button
            variant="outline"
            className="w-full"
            onClick={handleEnableNotifications}
            disabled={isInitializing}
          >
            {isInitializing ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Refreshing...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh Notification Token
              </>
            )}
          </Button>
        )}

        {/* Info */}
        <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
          <p className="text-xs text-blue-700 dark:text-blue-300">
            <strong>💡 Tip:</strong> Keep notifications enabled to never miss important updates about your tasks. Notifications work even when the app is closed or in the background.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
