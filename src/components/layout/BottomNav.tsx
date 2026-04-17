import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Home, ClipboardList, PlusCircle, Bell, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { notificationsApi } from '@/db/api';

export default function BottomNav() {
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
    return null; // Don't show bottom nav for logged out users
  }

  const getDashboardLink = () => {
    const activeRole = profile.active_role || profile.role;
    if (profile.role === 'admin') return '/admin/dashboard';
    if (activeRole === 'bondhu') return '/bondhu/dashboard';
    return '/need-bondhu/dashboard';
  };

  const navItems = [
    { icon: Home, label: 'Dashboard', href: getDashboardLink() },
    { icon: ClipboardList, label: 'My Tasks', href: getDashboardLink() }, // Could be updated later to a specific tab
    { icon: PlusCircle, label: 'Post Task', action: () => navigate('/need-bondhu/dashboard'), isAction: true },
    { icon: Bell, label: 'Alerts', href: '/notifications', badge: unreadCount },
    { icon: User, label: 'Profile', href: '/profile' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border/50 pb-safe md:hidden shadow-[0_-5px_15px_-10px_rgba(0,0,0,0.1)]">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          
          if (item.isAction) {
            return (
              <button
                key={item.label}
                onClick={item.action}
                className="flex flex-col items-center justify-center w-14 h-full relative group"
                aria-label={item.label}
              >
                <div className="absolute -top-5 bg-primary text-primary-foreground rounded-full p-3 shadow-lg group-hover:scale-105 transition-transform">
                  <item.icon className="h-6 w-6" strokeWidth={2.5} />
                </div>
                <span className="text-[10px] font-medium mt-6 text-muted-foreground">{item.label}</span>
              </button>
            );
          }

          return (
            <Link
              key={item.label}
              to={item.href || '#'}
              className={cn(
                "flex flex-col items-center justify-center w-14 h-full relative transition-colors",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className="relative">
                <item.icon className={cn("h-5 w-5 mb-1 transition-transform", isActive && "scale-110")} strokeWidth={isActive ? 2.5 : 2} />
                {item.badge ? (
                  <span className="absolute -top-1 -right-2 bg-destructive text-destructive-foreground flex items-center justify-center rounded-full text-[9px] font-bold h-4 min-w-4 px-1 shadow-sm">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                ) : null}
              </div>
              <span className={cn("text-[10px] font-medium", isActive ? "font-semibold" : "")}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
