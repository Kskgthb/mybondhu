import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';

export default function SettingsPage() {
  const { profile } = useAuth();

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Account Settings</CardTitle>
            <CardDescription>Manage your account preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Username</Label>
                <p className="text-sm text-muted-foreground">{profile?.username}</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Role</Label>
                <div className="mt-1">
                  <Badge variant="secondary" className="capitalize">
                    {profile?.role.replace('_', ' ')}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notification Preferences</CardTitle>
            <CardDescription>Choose what notifications you want to receive</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="task-notifications">Task Updates</Label>
                <p className="text-sm text-muted-foreground">
                  Receive notifications about task status changes
                </p>
              </div>
              <Switch id="task-notifications" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="rating-notifications">Ratings & Reviews</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified when you receive a new rating
                </p>
              </div>
              <Switch id="rating-notifications" defaultChecked />
            </div>
          </CardContent>
        </Card>

        {profile?.role === 'bondhu' && (
          <Card>
            <CardHeader>
              <CardTitle>Helper Settings</CardTitle>
              <CardDescription>Manage your helper preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="auto-location">Auto-Update Location</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically update your location when available
                  </p>
                </div>
                <Switch id="auto-location" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="nearby-radius">Search Radius</Label>
                  <p className="text-sm text-muted-foreground">
                    Maximum distance for nearby tasks: 50 km
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
