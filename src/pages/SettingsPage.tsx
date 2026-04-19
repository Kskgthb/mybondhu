import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { tasksApi } from '@/db/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { categories } from '@/lib/categories';
import { Loader2 } from 'lucide-react';

export default function SettingsPage() {
  const { profile, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [preferences, setPreferences] = useState({
    preferred_radius_km: 10,
    quiet_hours_start: '',
    quiet_hours_end: '',
    muted_categories: [] as string[],
    max_notifications_per_day: 3,
  });

  useEffect(() => {
    if (user && profile?.role === 'bondhu') {
      loadPreferences();
    } else {
      setLoading(false);
    }
  }, [user, profile]);

  const loadPreferences = async () => {
    if (!user) return;
    try {
      const prefs = await tasksApi.getUserPreferences(user.id);
      if (prefs) {
        setPreferences({
          preferred_radius_km: prefs.preferred_radius_km || 10,
          quiet_hours_start: prefs.quiet_hours_start?.substring(0, 5) || '',
          quiet_hours_end: prefs.quiet_hours_end?.substring(0, 5) || '',
          muted_categories: prefs.muted_categories || [],
          max_notifications_per_day: prefs.max_notifications_per_day || 3,
        });
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await tasksApi.updateUserPreferences(user.id, {
        preferred_radius_km: preferences.preferred_radius_km,
        quiet_hours_start: preferences.quiet_hours_start ? `${preferences.quiet_hours_start}:00` : null,
        quiet_hours_end: preferences.quiet_hours_end ? `${preferences.quiet_hours_end}:00` : null,
        muted_categories: preferences.muted_categories,
        max_notifications_per_day: preferences.max_notifications_per_day,
      });
      toast.success('Preferences saved successfully!');
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const toggleMutedCategory = (category: string) => {
    setPreferences(prev => {
      const isMuted = prev.muted_categories.includes(category);
      if (isMuted) {
        return { ...prev, muted_categories: prev.muted_categories.filter(c => c !== category) };
      } else {
        return { ...prev, muted_categories: [...prev.muted_categories, category] };
      }
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl pb-24">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Account Settings</CardTitle>
            <CardDescription>Manage your account profile</CardDescription>
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

        {profile?.role === 'bondhu' && (
          <Card>
            <CardHeader>
              <CardTitle>Smart Notifications & Preferences</CardTitle>
              <CardDescription>Control how AI matches tasks to you</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {loading ? (
                <div className="flex justify-center py-4"><Loader2 className="animate-spin h-6 w-6" /></div>
              ) : (
                <>
                  {/* Radius Slider */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <Label>Proximity Radius: {preferences.preferred_radius_km} km</Label>
                    </div>
                    <Slider 
                      value={[preferences.preferred_radius_km]} 
                      min={1} 
                      max={50} 
                      step={1}
                      onValueChange={(val) => setPreferences({...preferences, preferred_radius_km: val[0]})}
                    />
                    <p className="text-xs text-muted-foreground">Receive push notifications for tasks within this distance.</p>
                  </div>

                  {/* Limits */}
                  <div className="space-y-4">
                    <Label>Max Notifications Per Day</Label>
                    <div className="flex gap-2 items-center">
                      <Input 
                        type="number" 
                        min={1} max={20} 
                        className="w-24"
                        value={preferences.max_notifications_per_day}
                        onChange={(e) => setPreferences({...preferences, max_notifications_per_day: parseInt(e.target.value) || 3})}
                      />
                      <span className="text-sm text-muted-foreground">notifications</span>
                    </div>
                  </div>

                  {/* Quiet Hours */}
                  <div className="space-y-4">
                    <Label>Quiet Hours (No push notifications)</Label>
                    <div className="flex items-center gap-4">
                      <div className="space-y-1">
                        <span className="text-xs text-muted-foreground">Start Time</span>
                        <Input 
                          type="time" 
                          value={preferences.quiet_hours_start}
                          onChange={(e) => setPreferences({...preferences, quiet_hours_start: e.target.value})}
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs text-muted-foreground">End Time</span>
                        <Input 
                          type="time" 
                          value={preferences.quiet_hours_end}
                          onChange={(e) => setPreferences({...preferences, quiet_hours_end: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Category Mutes */}
                  <div className="space-y-4">
                    <Label>Mute Specific Categories</Label>
                    <p className="text-xs text-muted-foreground mb-2">You will NOT receive push notifications for these selected categories.</p>
                    <div className="flex flex-wrap gap-2">
                      {categories.map((cat) => {
                        const isMuted = preferences.muted_categories.includes(cat.value);
                        return (
                          <Badge 
                            key={cat.value} 
                            variant={isMuted ? "destructive" : "outline"}
                            className="cursor-pointer"
                            onClick={() => toggleMutedCategory(cat.value)}
                          >
                            {isMuted ? '🔇 ' : ''}{cat.label}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>

                  <Button onClick={savePreferences} disabled={saving} className="w-full">
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Save Smart Preferences'}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
