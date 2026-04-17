import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Home, ClipboardList, PlusCircle, Bell, User, Settings, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import Logo from '@/components/common/Logo';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { notificationsApi } from '@/db/api';

export default function Sidebar() {
  const { user, profile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      const loadUnreadCount = async () => {
        try {
          const count = await notificationsApi.getUnreadCount(user.id);
          setUnreadCount(count);
        } catch (error) {
          console.error('Error loading unread count:', error);
        }
      };
      loadUnreadCount();
      const interval = setInterval(loadUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  if (!user || !profile) {
    return null; // Don't show sidebar for logged out users
  }

  const getDashboardLink = () => {
    const activeRole = profile.active_role || profile.role;
    if (profile.role === 'admin') return '/admin/dashboard';
    if (activeRole === 'bondhu') return '/bondhu/dashboard';
    return '/need-bondhu/dashboard';
  };

  const navItems = [
    { icon: Home, label: 'Dashboard', href: getDashboardLink() },
    { icon: ClipboardList, label: 'My Tasks', href: getDashboardLink() }, // Currently points to dashboard, can be updated later
    { icon: Bell, label: 'Notifications', href: '/notifications', badge: unreadCount },
    { icon: User, label: 'Profile', href: '/profile' },
    { icon: Settings, label: 'Settings', href: '/settings' },
  ];

  if (profile.role === 'admin') {
    navItems.push({ icon: Shield, label: 'Admin Panel', href: '/admin/dashboard' });
  }

  const handlePostTask = () => {
    // Currently, signup handles the posting flow, but for logged in users, we might navigate to a create task page.
    // For now, if active role is need_bondhu, they can post a task from their dashboard.
    navigate('/need-bondhu/dashboard');
  };

  return (
    <div className="w-64 border-r bg-background flex-col flex h-[calc(100vh-4rem)] sticky top-16 py-6 px-4">
      <div className="flex-1 space-y-2">
        {navItems.map((item) => (
          <Link
            key={item.label}
            to={item.href}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium",
              location.pathname === item.href 
                ? "bg-primary text-primary-foreground" 
                : "text-muted-foreground hover:bg-secondary/10 hover:text-foreground"
            )}
          >
            <item.icon className="h-5 w-5" />
            {item.label}
            {item.badge ? (
              <span className="ml-auto bg-destructive text-destructive-foreground px-2 py-0.5 rounded-full text-xs">
                {item.badge > 9 ? '9+' : item.badge}
              </span>
            ) : null}
          </Link>
        ))}
      </div>
      
      <div className="mt-auto pt-6">
        <Button 
          className="w-full gap-2" 
          size="lg"
          onClick={handlePostTask}
        >
          <PlusCircle className="h-5 w-5" />
          Post Task
        </Button>
      </div>
    </div>
  );
}
