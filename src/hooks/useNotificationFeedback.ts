/**
 * useNotificationFeedback — The AI Learning Loop
 *
 * Listens for notification click messages posted from the Service Worker
 * and uses them to:
 *   1. Mark the notification_logs entry as clicked (for A/B analytics)
 *   2. Boost the user's category_weights (the AI interest profile)
 *
 * This is the core feedback loop that makes the AI smarter over time.
 * A Bondhu who clicks "Delivery" tasks repeatedly will start seeing
 * more Delivery tasks at the top of their smart notifications.
 */

import { useEffect } from 'react';
import { supabase } from '@/db/supabase';

// How much to boost category weight per notification click (0.0 → 1.0)
const CLICK_WEIGHT_BOOST = 0.15;

interface NotificationClickPayload {
  log_id?: string;
  task_id?: string;
  category?: string;
  variant?: string;
  trigger_type?: string;
}

export function useNotificationFeedback(userId: string | null) {

  useEffect(() => {
    if (!userId || !('serviceWorker' in navigator)) return;

    const handler = async (event: MessageEvent) => {
      if (event.data?.type !== 'NOTIFICATION_CLICKED') return;

      const payload: NotificationClickPayload = event.data.payload || {};
      const { log_id, task_id, category, variant, trigger_type } = payload;

      console.log('[NotificationFeedback] Click received:', payload);

      // ── 1. Mark log entry as clicked (enables A/B analytics) ──────────
      if (log_id) {
        const { error } = await supabase
          .from('notification_logs')
          .update({ clicked: true })
          .eq('id', log_id);

        if (error) {
          console.warn('[NotificationFeedback] Failed to log click:', error.message);
        } else {
          console.log('[NotificationFeedback] ✅ Click logged for log_id:', log_id);
        }
      }

      // ── 2. AI Interest Weight Boost (the learning part) ────────────────
      // Only boost for proximity/re-engagement triggers (not lifecycle events)
      if (category && trigger_type !== 'lifecycle') {
        const { error: rpcError } = await supabase.rpc('update_user_interest_profile', {
          p_user_id: userId,
          p_category: category,
          p_weight_increase: CLICK_WEIGHT_BOOST,
        });

        if (rpcError) {
          console.warn('[NotificationFeedback] Failed to update interest profile:', rpcError.message);
        } else {
          console.log(`[NotificationFeedback] 🧠 AI weight boosted +${CLICK_WEIGHT_BOOST} for category: ${category}`);
        }
      }
    };

    navigator.serviceWorker.addEventListener('message', handler);
    return () => navigator.serviceWorker.removeEventListener('message', handler);
  }, [userId]);

  // ── Also handle URL-based click tracking (when app was closed & reopened) ──
  // The SW appends ?click_log_id=... to the URL when a notification is clicked
  // while the app was closed. We process it here on mount.
  useEffect(() => {
    if (!userId) return;

    const params = new URLSearchParams(window.location.search);
    const logId = params.get('click_log_id');

    if (!logId) return;

    // Mark as clicked
    supabase
      .from('notification_logs')
      .update({ clicked: true })
      .eq('id', logId)
      .then(({ error }) => {
        if (!error) {
          console.log('[NotificationFeedback] ✅ URL-based click tracked for log_id:', logId);
          // Clean the URL without triggering a re-render
          const cleanUrl = window.location.pathname + window.location.search.replace(/[?&]click_log_id=[^&]+/, '');
          window.history.replaceState({}, '', cleanUrl);
        }
      });
  }, [userId]);
}
