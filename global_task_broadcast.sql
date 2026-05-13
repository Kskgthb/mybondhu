-- ============================================================
-- GLOBAL TASK BROADCAST NOTIFICATION SYSTEM
-- Run this in the Supabase SQL Editor to enable
-- automatic push notifications to ALL users on new task posts
-- ============================================================

-- 1. Create a trigger function that inserts a notification row
--    for every active user when a new task is created.
--    This triggers the push-notify Edge Function via the existing
--    Database Webhook on the notifications table.
CREATE OR REPLACE FUNCTION notify_all_users_on_new_task()
RETURNS TRIGGER AS $$
BEGIN
  -- Only fire for new pending tasks
  IF NEW.status = 'pending' THEN
    -- Insert a notification for every user EXCEPT the poster
    INSERT INTO public.notifications (user_id, type, title, message, task_id, read)
    SELECT
      p.id,
      'new_task_broadcast',
      '📢 New Task: ' || NEW.title,
      NEW.category || ' • ₹' || NEW.amount || ' — ' || COALESCE(NEW.location_address, 'Check it out!'),
      NEW.id,
      false
    FROM public.profiles p
    WHERE p.id != NEW.poster_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop existing trigger if it exists (idempotent)
DROP TRIGGER IF EXISTS trigger_notify_all_on_new_task ON public.tasks;

-- 3. Create the trigger on the tasks table
CREATE TRIGGER trigger_notify_all_on_new_task
  AFTER INSERT ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION notify_all_users_on_new_task();

-- 4. Add policy to allow service role to insert notifications for any user
-- (This is needed because the trigger runs as SECURITY DEFINER)
DO $$
BEGIN
  -- Check if the policy already exists before creating it
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'notifications' 
    AND policyname = 'Allow trigger to insert notifications for all users'
  ) THEN
    CREATE POLICY "Allow trigger to insert notifications for all users"
      ON public.notifications
      FOR INSERT
      WITH CHECK (true);
  END IF;
END $$;

-- 5. Ensure the push_subscriptions table has a policy allowing
--    the edge function to read all subscriptions for broadcast
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'push_subscriptions' 
    AND policyname = 'Service role can read all push subscriptions'
  ) THEN
    CREATE POLICY "Service role can read all push subscriptions"
      ON public.push_subscriptions
      FOR SELECT
      USING (true);
  END IF;
END $$;

-- ============================================================
-- VERIFICATION: Run these queries to confirm everything is set up
-- ============================================================
-- Check trigger exists:
-- SELECT * FROM information_schema.triggers WHERE trigger_name = 'trigger_notify_all_on_new_task';
-- 
-- Check function exists:
-- SELECT proname, prosrc FROM pg_proc WHERE proname = 'notify_all_users_on_new_task';
-- ============================================================
