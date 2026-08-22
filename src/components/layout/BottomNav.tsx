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
    { icon: PlusCircle, label: 'Post Task', action: () => navigate('/need-bondhu/dashboard?action=post'), isAction: true },
    { icon: Bell, label: 'Alerts', href: '/notifications', badge: unreadCount },
    { icon: User, label: 'Profile', href: '/profile' },
  ];

  return (
    <div className="fixed bottom-4 left-0 right-0 z-50 flex justify-center pointer-events-none md:hidden">
      <div
        className="pointer-events-auto flex items-center justify-around gap-1 px-3 py-2 rounded-full shadow-2xl"
        style={{
          background: 'rgba(18, 18, 28, 0.88)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.10)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.40), 0 2px 8px rgba(0,0,0,0.30)',
          minWidth: '320px',
          maxWidth: '92vw',
        }}
      >
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;

          if (item.isAction) {
            return (
              <button
                key={item.label}
                onClick={item.action}
                className="flex flex-col items-center justify-center w-14 relative group"
                aria-label={item.label}
                style={{ minHeight: '52px' }}
              >
                <div
                  className="flex items-center justify-center rounded-full p-3 group-hover:scale-105 transition-transform shadow-lg"
                  style={{
                    background: 'hsl(var(--primary))',
                    color: 'hsl(var(--primary-foreground))',
                    marginTop: '-18px',
                    boxShadow: '0 4px 16px rgba(120,60,220,0.5)',
                  }}
                >
                  <item.icon className="h-5 w-5" strokeWidth={2.5} />
                </div>
                <span className="text-[9px] font-medium mt-1" style={{ color: 'rgba(255,255,255,0.55)' }}>{item.label}</span>
              </button>
            );
          }

          return (
            <Link
              key={item.label}
              to={item.href || '#'}
              className="flex flex-col items-center justify-center w-14 relative transition-colors"
              style={{ minHeight: '52px' }}
            >
              <div className="relative flex items-center justify-center">
                <item.icon
                  className={cn('h-5 w-5 transition-transform', isActive && 'scale-110')}
                  strokeWidth={isActive ? 2.5 : 2}
                  style={{ color: isActive ? 'hsl(var(--primary))' : 'rgba(255,255,255,0.55)' }}
                />
                {item.badge ? (
                  <span className="absolute -top-1 -right-2 bg-destructive text-destructive-foreground flex items-center justify-center rounded-full text-[9px] font-bold h-4 min-w-4 px-1 shadow-sm">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                ) : null}
              </div>
              <span
                className={cn('text-[9px] mt-1', isActive ? 'font-semibold' : 'font-medium')}
                style={{ color: isActive ? 'hsl(var(--primary))' : 'rgba(255,255,255,0.55)' }}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
