/**
 * LiveTaskNotification — Real-Time Global Task Push Notifications
 * 
 * This component subscribes to ALL new task inserts via Supabase Realtime.
 * Every logged-in user sees a stunning animated notification when any task is posted,
 * regardless of their location or role.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/db/supabase';
import { showPushNotification } from '@/services/notificationService';
import { generateNotificationSound } from '@/lib/soundGenerator';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Clock, Zap, ArrowRight, Sparkles, IndianRupee } from 'lucide-react';

interface NewTaskPayload {
  id: string;
  title: string;
  category: string;
  amount: number;
  urgency: string;
  location_address: string;
  poster_id: string;
  status: string;
  created_at: string;
}

interface TaskToast {
  id: string;
  task: NewTaskPayload;
  timestamp: number;
}

// Category emoji map for visual richness
const CATEGORY_EMOJI: Record<string, string> = {
  'Academic': '📚',
  'Delivery': '📦',
  'Shopping': '🛒',
  'Food': '🍕',
  'Cleaning': '🧹',
  'Tutoring': '📖',
  'Tech Support': '💻',
  'Moving': '🚚',
  'Errand': '🏃',
  'Creative': '🎨',
  'Personal': '👤',
  'Event Planning': '🎉',
  'Photography': '📸',
  'Writing': '✍️',
  'Repair': '🔧',
  'Cooking': '🍳',
  'Laundry': '👔',
  'Transport': '🚗',
  'Printing': '🖨️',
  'Other': '✨',
};

// Urgency color schemes
const URGENCY_STYLES: Record<string, { bg: string; text: string; border: string; glow: string }> = {
  urgent: {
    bg: 'bg-red-500/15',
    text: 'text-red-400',
    border: 'border-red-500/30',
    glow: 'shadow-red-500/20',
  },
  high: {
    bg: 'bg-orange-500/15',
    text: 'text-orange-400',
    border: 'border-orange-500/30',
    glow: 'shadow-orange-500/20',
  },
  medium: {
    bg: 'bg-yellow-500/15',
    text: 'text-yellow-400',
    border: 'border-yellow-500/30',
    glow: 'shadow-yellow-500/20',
  },
  low: {
    bg: 'bg-green-500/15',
    text: 'text-green-400',
    border: 'border-green-500/30',
    glow: 'shadow-green-500/20',
  },
};

const AUTO_DISMISS_MS = 8000; // 8 seconds
const MAX_VISIBLE_TOASTS = 3;

export default function LiveTaskNotification() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [toasts, setToasts] = useState<TaskToast[]>([]);
  const channelRef = useRef<any>(null);
  const dismissTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Dismiss a single toast
  const dismissToast = useCallback((toastId: string) => {
    setToasts(prev => prev.filter(t => t.id !== toastId));
    const timer = dismissTimersRef.current.get(toastId);
    if (timer) {
      clearTimeout(timer);
      dismissTimersRef.current.delete(toastId);
    }
  }, []);

  // Navigate to task detail
  const handleViewTask = useCallback((taskId: string, toastId: string) => {
    dismissToast(toastId);
    navigate(`/task/${taskId}`);
  }, [navigate, dismissToast]);

  // Subscribe to global task inserts
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('global-new-tasks-broadcast')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'tasks',
        },
        (payload) => {
          const newTask = payload.new as NewTaskPayload;

          // Don't notify the poster about their own task
          if (newTask.poster_id === user.id) return;

          // Only notify for pending tasks (new posts)
          if (newTask.status !== 'pending') return;

          const toastId = `task-toast-${newTask.id}-${Date.now()}`;

          // Play notification sound
          try {
            generateNotificationSound('success');
          } catch (e) {
            // Audio context might not be ready
          }

          // Show browser push notification (for background/minimized tabs)
          showPushNotification('new_task_nearby', {
            customTitle: `📢 New Task: ${newTask.title}`,
            customBody: `${newTask.category} • ₹${newTask.amount} — ${newTask.location_address || 'Nearby'}`,
            taskId: newTask.id,
          });

          // Add in-app toast
          setToasts(prev => {
            const updated = [{ id: toastId, task: newTask, timestamp: Date.now() }, ...prev];
            // Keep only the latest toasts to avoid overflow
            return updated.slice(0, MAX_VISIBLE_TOASTS + 2);
          });

          // Auto-dismiss after timeout
          const timer = setTimeout(() => {
            dismissToast(toastId);
          }, AUTO_DISMISS_MS);
          dismissTimersRef.current.set(toastId, timer);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('🔔 Live task notification channel active — listening for new tasks globally');
        }
      });

    channelRef.current = channel;

    return () => {
      // Cleanup
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      // Clear all timers
      dismissTimersRef.current.forEach(timer => clearTimeout(timer));
      dismissTimersRef.current.clear();
    };
  }, [user, dismissToast]);

  // Don't render anything if no toasts
  if (toasts.length === 0) return null;

  const visibleToasts = toasts.slice(0, MAX_VISIBLE_TOASTS);

  return (
    <div
      className="fixed top-20 right-4 z-[9999] flex flex-col gap-3 pointer-events-none"
      style={{ maxWidth: '420px', width: 'calc(100vw - 2rem)' }}
      id="live-task-notifications"
    >
      <AnimatePresence mode="popLayout">
        {visibleToasts.map((toast, index) => {
          const urgency = URGENCY_STYLES[toast.task.urgency] || URGENCY_STYLES.medium;
          const emoji = CATEGORY_EMOJI[toast.task.category] || '📋';

          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, x: 100, scale: 0.85 }}
              animate={{
                opacity: 1,
                x: 0,
                scale: 1,
                transition: {
                  type: 'spring',
                  stiffness: 400,
                  damping: 30,
                  delay: index * 0.05,
                },
              }}
              exit={{
                opacity: 0,
                x: 120,
                scale: 0.8,
                transition: { duration: 0.25, ease: 'easeInOut' },
              }}
              className={`
                pointer-events-auto 
                relative overflow-hidden 
                rounded-2xl border ${urgency.border}
                bg-background/95 backdrop-blur-xl
                shadow-2xl ${urgency.glow}
                cursor-pointer
                group
              `}
              onClick={() => handleViewTask(toast.task.id, toast.id)}
            >
              {/* Animated progress bar for auto-dismiss */}
              <motion.div
                className={`absolute top-0 left-0 h-[3px] ${urgency.bg.replace('/15', '/60')}`}
                style={{ background: 'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--secondary)))' }}
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: AUTO_DISMISS_MS / 1000, ease: 'linear' }}
              />

              {/* Shimmer effect on hover */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div
                  className="absolute inset-0"
                  style={{
                    background: 'linear-gradient(135deg, transparent 30%, rgba(255,255,255,0.05) 50%, transparent 70%)',
                  }}
                />
              </div>

              <div className="relative p-4">
                {/* Header row */}
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {/* Animated pulse dot */}
                    <div className="relative flex-shrink-0">
                      <span className="flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase text-primary/80">
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>New Task</span>
                    </div>
                  </div>

                  {/* Close button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      dismissToast(toast.id);
                    }}
                    className="flex-shrink-0 p-1 rounded-full hover:bg-muted/80 transition-colors text-muted-foreground hover:text-foreground"
                    aria-label="Dismiss notification"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Task title with emoji */}
                <h4 className="text-sm font-bold text-foreground leading-snug mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                  <span className="mr-1.5">{emoji}</span>
                  {toast.task.title}
                </h4>

                {/* Meta row */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
                  {/* Category badge */}
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${urgency.bg} ${urgency.text} font-medium`}>
                    <Zap className="h-3 w-3" />
                    {toast.task.category}
                  </span>

                  {/* Amount */}
                  <span className="inline-flex items-center gap-0.5 font-semibold text-foreground">
                    <IndianRupee className="h-3 w-3" />
                    {toast.task.amount}
                  </span>

                  {/* Location */}
                  {toast.task.location_address && (
                    <span className="inline-flex items-center gap-1 truncate max-w-[140px]">
                      <MapPin className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{toast.task.location_address}</span>
                    </span>
                  )}
                </div>

                {/* CTA row */}
                <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-border/50">
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Just now
                  </span>

                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary group-hover:gap-2 transition-all">
                    View Task
                    <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Overflow indicator */}
      {toasts.length > MAX_VISIBLE_TOASTS && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="pointer-events-auto text-center"
        >
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-background/80 backdrop-blur-sm rounded-full px-3 py-1 border border-border/50">
            +{toasts.length - MAX_VISIBLE_TOASTS} more notification{toasts.length - MAX_VISIBLE_TOASTS > 1 ? 's' : ''}
          </span>
        </motion.div>
      )}
    </div>
  );
}
