import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bell, LogOut, User, Settings, LayoutDashboard, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useEffect, useState } from 'react';
import { notificationsApi, profilesApi } from '@/db/api';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Power, MapPin } from 'lucide-react';
import Logo from '@/components/common/Logo';
import RoleSwitchButton from '@/components/common/RoleSwitchButton';

export default function Header() {
  const { user, profile, signOut, loading, refreshProfile } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isAvailable, setIsAvailable] = useState(false);
  const [locationEnabled, setLocationEnabled] = useState(false);

  const loadUnreadCount = async () => {
    if (!user) return;
    try {
      const count = await notificationsApi.getUnreadCount(user.id);
      setUnreadCount(count);
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  };

  useEffect(() => {
    if (user) {
      loadUnreadCount();
      const interval = setInterval(loadUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  useEffect(() => {
    if (profile) {
      setIsAvailable(profile.availability_status);
    }
  }, [profile]);

  useEffect(() => {
    // Check if location is enabled
    if (navigator.geolocation) {
      navigator.permissions.query({ name: 'geolocation' as PermissionName }).then((result) => {
        if (result.state === 'granted') setLocationEnabled(true);
        result.onchange = () => {
          if (result.state === 'granted') setLocationEnabled(true);
          else setLocationEnabled(false);
        };
      });
    }
  }, []);

  const handleAvailabilityToggle = async (checked: boolean) => {
    if (!user) return;
    try {
      await profilesApi.updateAvailability(user.id, checked);
      setIsAvailable(checked);
      await refreshProfile();
      toast.success(checked ? 'You are now available for tasks' : 'You are now offline');
    } catch (error) {
      toast.error('Failed to update availability');
    }
  };

  // Don't render header while auth is loading (after all hooks)
  if (loading) {
    return null;
  }

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const getDashboardLink = () => {
    if (!profile) return '/';
    
    // Use active_role if available, otherwise fall back to role
    const activeRole = profile.active_role || profile.role;
    
    if (profile.role === 'admin') return '/admin/dashboard';
    if (activeRole === 'bondhu') return '/bondhu/dashboard';
    return '/need-bondhu/dashboard';
  };

  const getInitials = () => {
    if (profile?.username) {
      return profile.username.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <Logo size="sm" />
        </Link>

        <div className="flex items-center gap-4">
          {user && profile ? (
            <>
              {(profile.role === 'bondhu' || profile.active_role === 'bondhu') && (
                <div className="hidden md:flex items-center gap-4 mr-2">
                  <div className="flex items-center gap-2 bg-secondary/10 px-3 py-1.5 rounded-full border border-secondary/20">
                    <MapPin className={`h-4 w-4 ${locationEnabled ? 'text-green-500' : 'text-muted-foreground'}`} />
                    <span className="text-xs font-medium">{locationEnabled ? 'Loc On' : 'Loc Off'}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 bg-secondary/10 px-3 py-1.5 rounded-full border border-secondary/20">
                    <Power className={`h-4 w-4 ${isAvailable ? 'text-green-500' : 'text-muted-foreground'}`} />
                    <Switch
                      id="header-availability"
                      checked={isAvailable}
                      onCheckedChange={handleAvailabilityToggle}
                      className="scale-75 data-[state=checked]:bg-green-500"
                    />
                    <Label htmlFor="header-availability" className="text-xs cursor-pointer font-medium">
                      {isAvailable ? 'Online' : 'Offline'}
                    </Label>
                  </div>
                </div>
              )}

              <RoleSwitchButton variant="ghost" size="icon" showLabel={false} />
              
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="text-2xl hover:scale-110 transition-transform hidden sm:flex"
                title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
              >
                🦉
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="relative hidden sm:flex"
                onClick={() => navigate('/notifications')}
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Badge>
                )}
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={profile.avatar_url || undefined} alt={profile.username} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {getInitials()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{profile.username}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {(profile.active_role || profile.role).replace('_', ' ')}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate(getDashboardLink())}>
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/settings')}>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  {profile.role === 'admin' && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => navigate('/admin/dashboard')}>
                        <Shield className="mr-2 h-4 w-4" />
                        Admin Panel
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={() => navigate('/login')}>
                Sign In
              </Button>
              <Button onClick={() => navigate('/signup')}>
                Sign Up
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
