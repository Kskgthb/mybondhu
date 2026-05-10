-- ============================================================
-- AI NOTIFICATION SYSTEM — FINAL SQL MIGRATION
-- Run this AFTER push_notifications_setup.sql
--           AND AFTER smart_notifications_setup.sql
-- ============================================================

-- ── 1. Add 'read' status to notifications table ──────────────────────────
-- (The NotificationsPage already calls markAsRead, this makes it persistent)
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS read BOOLEAN NOT NULL DEFAULT FALSE;

-- Fast index for unread badge counts
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON public.notifications(user_id, read)
  WHERE read = FALSE;

-- ── 2. Add 'last_seen_at' to profiles (for re-engagement cron) ────────────
-- The re-engage edge function uses this to find inactive Bondhus (3+ days)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Trigger: auto-update last_seen_at whenever the profile row is touched
-- (You can also call this manually from the app on every auth session)
CREATE OR REPLACE FUNCTION touch_last_seen_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_seen_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_touch_last_seen ON public.profiles;
CREATE TRIGGER trg_touch_last_seen
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION touch_last_seen_at();

-- ── 3. RPC: Get unread notification count ────────────────────────────────
-- Used by NotificationCenter for the badge number
CREATE OR REPLACE FUNCTION get_unread_notification_count(p_user_id UUID)
RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT COUNT(*)::integer
  FROM public.notifications
  WHERE user_id = p_user_id AND read = FALSE;
$$;

-- ── 4. RPC: Mark notifications as read ───────────────────────────────────
CREATE OR REPLACE FUNCTION mark_notifications_read(p_user_id UUID, p_ids UUID[])
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE public.notifications
  SET read = TRUE
  WHERE user_id = p_user_id
    AND (p_ids IS NULL OR id = ANY(p_ids));
$$;

-- ── 5. RLS: Allow users to UPDATE their own notifications (mark as read) ─
-- Only add if not exists to avoid duplicate policy error
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'notifications' AND policyname = 'Users can update own notifications'
  ) THEN
    CREATE POLICY "Users can update own notifications"
      ON public.notifications
      FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;
END;
$$;

-- ── 6. Verify notification_logs allows service_role inserts ──────────────
-- (Already in smart_notifications_setup.sql but re-confirmed here)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'notification_logs' AND policyname = 'Service Role can insert logs'
  ) THEN
    CREATE POLICY "Service Role can insert logs"
      ON public.notification_logs
      FOR INSERT WITH CHECK (true);
  END IF;
END;
$$;

-- ── 7. Grant execute on RPCs to authenticated users ──────────────────────
GRANT EXECUTE ON FUNCTION get_unread_notification_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_notifications_read(UUID, UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_interest_profile(UUID, TEXT, DOUBLE PRECISION) TO authenticated;
GRANT EXECUTE ON FUNCTION get_smart_notification_targets(DOUBLE PRECISION, DOUBLE PRECISION, TEXT, INTEGER) TO service_role;

-- ── Done ──────────────────────────────────────────────────────────────────
-- You can verify by running:
--   SELECT column_name FROM information_schema.columns WHERE table_name = 'notifications';
--   SELECT column_name FROM information_schema.columns WHERE table_name = 'profiles' AND column_name LIKE 'last%';
