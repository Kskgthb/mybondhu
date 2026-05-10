/**
 * NotificationCenter — Real-time bell icon with slide-in drawer
 *
 * Features:
 * - Live unread badge count via Supabase Realtime
 * - Slide-in notification drawer
 * - Mark individual / all as read
 * - Click navigates to task
 * - Animated entry for each new notification
 * - Type-specific icons and colors
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/db/supabase';
import { notificationsApi, realtimeApi } from '@/db/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { getClearedNotifications, clearNotification } from '@/lib/clearStorage';
import type { Notification } from '@/types/types';
import {
  Bell,
  CheckCheck,
  X,
  Package,
  Bike,
  MapPin,
  Zap,
  CheckCircle2,
  CreditCard,
  MessageSquare,
  Lock,
  AlertCircle,
  ChevronRight,
  BellOff,
} from 'lucide-react';

// ── Type → icon/color map ──────────────────────────────────────────────────
const TYPE_CONFIG: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  task_accepted:    { icon: <Package className="h-4 w-4" />,      color: 'text-blue-500',   bg: 'bg-blue-500/15' },
  bondhu_on_way:    { icon: <Bike className="h-4 w-4" />,          color: 'text-amber-500',  bg: 'bg-amber-500/15' },
  bondhu_arrived:   { icon: <MapPin className="h-4 w-4" />,        color: 'text-green-500',  bg: 'bg-green-500/15' },
  task_started:     { icon: <Zap className="h-4 w-4" />,           color: 'text-purple-500', bg: 'bg-purple-500/15' },
  task_completed:   { icon: <CheckCircle2 className="h-4 w-4" />,  color: 'text-green-500',  bg: 'bg-green-500/15' },
  payment_received: { icon: <CreditCard className="h-4 w-4" />,    color: 'text-emerald-500',bg: 'bg-emerald-500/15' },
  payment_confirmed:{ icon: <CreditCard className="h-4 w-4" />,    color: 'text-emerald-500',bg: 'bg-emerald-500/15' },
  new_task_nearby:  { icon: <AlertCircle className="h-4 w-4" />,   color: 'text-orange-500', bg: 'bg-orange-500/15' },
  message_received: { icon: <MessageSquare className="h-4 w-4" />, color: 'text-sky-500',    bg: 'bg-sky-500/15' },
  code_verified:    { icon: <Lock className="h-4 w-4" />,          color: 'text-violet-500', bg: 'bg-violet-500/15' },
};

const getTypeConfig = (type: string) =>
  TYPE_CONFIG[type] ?? { icon: <Bell className="h-4 w-4" />, color: 'text-muted-foreground', bg: 'bg-muted' };

// ── Main Component ─────────────────────────────────────────────────────────
export default function NotificationCenter() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // ── Load notifications from DB ─────────────────────────────────────────
  const loadNotifications = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await notificationsApi.getMyNotifications(user.id);
      const cleared = getClearedNotifications();
      const filtered = data.filter((n) => !cleared.includes(n.id));
      setNotifications(filtered);
      setUnreadCount(filtered.filter((n) => !n.read).length);
    } catch (err) {
      console.error('[NotificationCenter] Load error:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // ── Initial load + Realtime subscription ──────────────────────────────
  useEffect(() => {
    if (!user) return;
    loadNotifications();

    const channel = realtimeApi.subscribeToNotifications(user.id, () => {
      loadNotifications();
    });

    return () => { realtimeApi.unsubscribe(channel); };
  }, [user, loadNotifications]);

  // ── Also update unread count even when drawer is closed ───────────────
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      notificationsApi
        .getUnreadCount(user.id)
        .then(setUnreadCount)
        .catch(() => {});
    }, 30_000);
    return () => clearInterval(interval);
  }, [user]);

  const handleOpen = () => {
    setOpen(true);
    if (!loading) loadNotifications();
  };

  const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    await notificationsApi.markAsRead([id]);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  const handleMarkAllRead = async () => {
    if (!user) return;
    await notificationsApi.markAllAsRead(user.id);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const handleDismiss = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    clearNotification(id);
    setNotifications((prev) => {
      const updated = prev.filter((n) => n.id !== id);
      setUnreadCount(updated.filter((n) => !n.read).length);
      return updated;
    });
  };

  const handleClick = (n: Notification) => {
    if (!n.read) handleMarkAsRead(n.id);
    if (n.task_id) navigate(`/task/${n.task_id}`);
    setOpen(false);
  };

  if (!user) return null;

  return (
    <>
      {/* ── Bell Button ─────────────────────────────────────────── */}
      <button
        id="notification-center-bell"
        onClick={handleOpen}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        className="relative p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary/20 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground px-1 shadow-sm animate-in zoom-in-75 duration-200">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* ── Backdrop ────────────────────────────────────────────── */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ── Slide-in Drawer ─────────────────────────────────────── */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-sm bg-background border-l border-border shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold text-base leading-tight">Notifications</h2>
              <p className="text-xs text-muted-foreground">
                {unreadCount > 0
                  ? `${unreadCount} unread alert${unreadCount > 1 ? 's' : ''}`
                  : 'All caught up!'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-8 px-2 text-primary hover:text-primary"
                onClick={handleMarkAllRead}
              >
                <CheckCheck className="h-3.5 w-3.5 mr-1" />
                Read all
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => setOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Notification List */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {loading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex gap-3 p-3">
                  <Skeleton className="h-9 w-9 rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center px-6">
              <div className="p-4 rounded-full bg-muted/50 mb-4">
                <BellOff className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <p className="font-medium text-muted-foreground">No notifications yet</p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                We'll notify you when something important happens.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {notifications.map((n) => {
                const cfg = getTypeConfig(n.type);
                return (
                  <div
                    key={n.id}
                    onClick={() => handleClick(n)}
                    className={`group flex items-start gap-3.5 px-4 py-3.5 cursor-pointer transition-all duration-150 hover:bg-muted/40 ${!n.read ? 'bg-primary/4' : ''}`}
                  >
                    {/* Icon */}
                    <div className={`flex-shrink-0 mt-0.5 h-9 w-9 rounded-full flex items-center justify-center ${cfg.bg} ${cfg.color}`}>
                      {cfg.icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm leading-snug ${!n.read ? 'font-semibold' : 'font-medium'}`}>
                          {n.title}
                        </p>
                        <button
                          onClick={(e) => handleDismiss(n.id, e)}
                          className="flex-shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                          aria-label="Dismiss notification"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">
                        {n.message}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[11px] text-muted-foreground/70">
                          {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                        </span>
                        {!n.read && (
                          <span className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                        )}
                        {n.task_id && (
                          <span className="ml-auto flex items-center gap-0.5 text-[11px] text-primary font-medium">
                            View task <ChevronRight className="h-3 w-3" />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-border bg-muted/20">
          <Button
            variant="ghost"
            className="w-full text-sm text-muted-foreground hover:text-foreground"
            onClick={() => { navigate('/notifications'); setOpen(false); }}
          >
            View all notifications
          </Button>
        </div>
      </div>
    </>
  );
}
