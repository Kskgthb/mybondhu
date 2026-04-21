import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { profilesApi } from '@/db/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { categories } from '@/lib/categories';
import { Loader2, BrainCircuit, BellRing, Target, Activity, Zap, ShieldAlert, MapPin } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
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
    category_weights: {} as Record<string, number>,
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
      const prefs = await profilesApi.getUserPreferences(user.id);
      if (prefs) {
        setPreferences({
          preferred_radius_km: prefs.preferred_radius_km || 10,
          quiet_hours_start: prefs.quiet_hours_start?.substring(0, 5) || '',
          quiet_hours_end: prefs.quiet_hours_end?.substring(0, 5) || '',
          muted_categories: prefs.muted_categories || [],
          max_notifications_per_day: prefs.max_notifications_per_day || 3,
          category_weights: prefs.category_weights || {},
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
      await profilesApi.updateUserPreferences(user.id, {
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

  const getTopInterests = () => {
    const weights = preferences.category_weights;
    if (!weights || Object.keys(weights).length === 0) return [];
    
    return Object.entries(weights)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([cat, val]) => ({
        category: cat,
        percentage: Math.min(Math.round(val * 100), 100)
      }));
  };

  const topInterests = getTopInterests();

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
          <Card className="border-primary/20 shadow-lg shadow-primary/5 overflow-hidden">
            <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 border-b border-primary/10">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-primary/20 rounded-lg text-primary">
                  <BrainCircuit className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-xl">Smart Earning Assistant</CardTitle>
                  <CardDescription className="text-primary/70">AI-powered opportunity matching</CardDescription>
                </div>
              </div>
            </div>
            
            <CardContent className="space-y-8 p-6">
              {loading ? (
                <div className="flex justify-center py-8"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
              ) : (
                <>
                  {/* AI Interest Profile Visualization */}
                  <div className="p-5 bg-accent/5 rounded-xl border border-accent/10 space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                      <Activity className="h-5 w-5 text-accent" />
                      <h3 className="font-semibold text-lg">Your AI Profile</h3>
                    </div>
                    
                    {topInterests.length > 0 ? (
                      <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">Based on your activity, we predict you are most likely to accept these tasks:</p>
                        {topInterests.map((interest, i) => {
                          const catLabel = categories.find(c => c.value === interest.category)?.label || interest.category;
                          return (
                            <div key={i} className="space-y-2">
                              <div className="flex justify-between text-sm font-medium">
                                <span>{catLabel}</span>
                                <span className="text-primary">{interest.percentage}% Match</span>
                              </div>
                              <Progress value={interest.percentage} className="h-2 bg-primary/20 [&>div]:bg-primary" />
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center p-4 bg-background/50 rounded-lg border border-dashed border-muted-foreground/30">
                        <Target className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                        <p className="text-sm text-muted-foreground">Interact with more tasks to build your AI profile!</p>
                      </div>
                    )}
                  </div>

                  <div className="grid gap-8 md:grid-cols-2">
                    {/* Delivery Controls */}
                    <div className="space-y-6">
                      <div className="flex items-center gap-2 border-b pb-2">
                        <BellRing className="h-5 w-5 text-muted-foreground" />
                        <h3 className="font-medium">Delivery Controls</h3>
                      </div>

                      {/* Radius Slider */}
                      <div className="space-y-4 bg-card p-4 rounded-lg border shadow-sm">
                        <div className="flex justify-between items-center mb-2">
                          <Label className="text-base font-semibold">Discovery Radius</Label>
                          <Badge variant="secondary" className="font-mono text-sm bg-primary/10 text-primary">{preferences.preferred_radius_km} km</Badge>
                        </div>
                        <Slider 
                          value={[preferences.preferred_radius_km]} 
                          min={1} 
                          max={50} 
                          step={1}
                          onValueChange={(val) => setPreferences({...preferences, preferred_radius_km: val[0]})}
                          className="py-4"
                        />
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> Get alerts for tasks within this area.
                        </p>
                      </div>

                      {/* Limits */}
                      <div className="space-y-4 bg-card p-4 rounded-lg border shadow-sm">
                        <Label className="text-base font-semibold mb-2 block">Daily Alert Limit</Label>
                        <div className="flex gap-3 items-center">
                          <Input 
                            type="number" 
                            min={0} max={20} 
                            className="w-24 text-center font-mono text-lg"
                            value={preferences.max_notifications_per_day}
                            onChange={(e) => setPreferences({...preferences, max_notifications_per_day: parseInt(e.target.value) || 0})}
                          />
                          <span className="text-sm text-muted-foreground">High-value alerts / day</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                           <ShieldAlert className="h-3 w-3" /> Set to 0 to pause all alerts.
                        </p>
                      </div>
                    </div>

                    {/* Filter Controls */}
                    <div className="space-y-6">
                      <div className="flex items-center gap-2 border-b pb-2">
                        <Zap className="h-5 w-5 text-muted-foreground" />
                        <h3 className="font-medium">Focus Filters</h3>
                      </div>

                      {/* Quiet Hours */}
                      <div className="space-y-4 bg-card p-4 rounded-lg border shadow-sm">
                        <Label className="text-base font-semibold block mb-2">Do Not Disturb</Label>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">From</span>
                            <Input 
                              type="time" 
                              className="font-mono"
                              value={preferences.quiet_hours_start}
                              onChange={(e) => setPreferences({...preferences, quiet_hours_start: e.target.value})}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">To</span>
                            <Input 
                              type="time" 
                              className="font-mono"
                              value={preferences.quiet_hours_end}
                              onChange={(e) => setPreferences({...preferences, quiet_hours_end: e.target.value})}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Category Mutes */}
                      <div className="space-y-4 bg-card p-4 rounded-lg border shadow-sm">
                        <Label className="text-base font-semibold block mb-2">Muted Categories</Label>
                        <p className="text-xs text-muted-foreground mb-3 leading-relaxed">Tap to mute categories you're not interested in.</p>
                        <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                          {categories.map((cat) => {
                            const isMuted = preferences.muted_categories.includes(cat.value);
                            return (
                              <Badge 
                                key={cat.value} 
                                variant={isMuted ? "secondary" : "outline"}
                                className={`cursor-pointer transition-all duration-200 py-1.5 px-3 ${isMuted ? 'opacity-50 grayscale bg-muted text-muted-foreground border-transparent' : 'hover:border-primary hover:bg-primary/5'}`}
                                onClick={() => toggleMutedCategory(cat.value)}
                              >
                                {isMuted ? '🔇 ' : ''}{cat.label}
                              </Badge>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t mt-4">
                    <Button 
                      onClick={savePreferences} 
                      disabled={saving} 
                      className="w-full h-12 text-lg shadow-md shadow-primary/20 hover:shadow-primary/40 transition-all duration-300"
                    >
                      {saving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 'Save Assistant Settings'}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
