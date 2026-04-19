-- ============================================================
-- FIX PROXIMITY PUSH NOTIFICATIONS TRIGGER
-- Run this in the Supabase SQL Editor
-- ============================================================

-- 1. Enable pg_net extension (required for HTTP requests from Postgres)
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- 2. Make sure our radius function is robust and uses COALESCE for null coordinates
CREATE OR REPLACE FUNCTION get_users_within_radius(
  target_lat double precision,
  target_lng double precision,
  radius_km double precision,
  target_role text
)
RETURNS TABLE (
  user_id uuid,
  distance_km double precision
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    id as user_id,
    ( 6371 * acos( 
        LEAST(1.0, 
          cos( radians(target_lat) ) * cos( radians( COALESCE(last_location_lat, location_lat, 0) ) ) * 
          cos( radians( COALESCE(last_location_lng, location_lng, 0) ) - radians(target_lng) ) + 
          sin( radians(target_lat) ) * sin( radians( COALESCE(last_location_lat, location_lat, 0) ) ) 
        )
    ) ) AS distance_km
  FROM profiles
  WHERE 
    role = target_role
    AND (last_location_lat IS NOT NULL OR location_lat IS NOT NULL)
    AND (last_location_lat != 0 OR location_lat != 0)
    AND ( 6371 * acos( 
        LEAST(1.0, 
          cos( radians(target_lat) ) * cos( radians( COALESCE(last_location_lat, location_lat, 0) ) ) * 
          cos( radians( COALESCE(last_location_lng, location_lng, 0) ) - radians(target_lng) ) + 
          sin( radians(target_lat) ) * sin( radians( COALESCE(last_location_lat, location_lat, 0) ) ) 
        )
    ) ) <= radius_km;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create the function to call the Edge Function
CREATE OR REPLACE FUNCTION trigger_push_notification_edge_function()
RETURNS TRIGGER AS $$
DECLARE
  -- You can replace these with hardcoded values if current_setting is empty in your DB
  -- URL format: https://[PROJECT_REF].supabase.co/functions/v1/push-notify
  -- Example: 'https://jfqudweigoqazpkhfgrj.supabase.co/functions/v1/push-notify'
  webhook_url text := 'https://jfqudweigoqazpkhfgrj.supabase.co/functions/v1/push-notify';
  
  -- We need to pass the anon key or service role key in headers. 
  -- We'll just construct a basic payload that the Edge Function expects.
  payload jsonb;
  request_id bigint;
BEGIN
  -- Construct the payload to match what Supabase Database Webhooks send
  payload := jsonb_build_object(
    'type', TG_OP,
    'table', TG_TABLE_NAME,
    'schema', TG_TABLE_SCHEMA,
    'record', row_to_json(NEW),
    'old_record', CASE WHEN TG_OP = 'UPDATE' OR TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE null END
  );

  -- Perform async HTTP POST via pg_net
  SELECT net.http_post(
      url := webhook_url,
      headers := jsonb_build_object(
          'Content-Type', 'application/json'
      ),
      body := payload
  ) INTO request_id;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't prevent the task from being created
    RAISE WARNING 'Failed to trigger push notification webhook: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create the trigger on the tasks table
DROP TRIGGER IF EXISTS tr_notify_on_task_changes ON tasks;
CREATE TRIGGER tr_notify_on_task_changes
  AFTER INSERT OR UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION trigger_push_notification_edge_function();

-- NOTE: For this pg_net trigger to work, the Edge Function must NOT require authorization, 
-- or you must provide an Authorization header with a valid JWT/Anon Key in the net.http_post headers above.
-- If the Edge Function requires Auth, update the headers to:
-- headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer YOUR_ANON_KEY')

-- ALTERNATIVE (Recommended): Set up a "Database Webhook" via the Supabase Dashboard
-- 1. Go to Database -> Webhooks -> Create Webhook
-- 2. Name: push-notify-trigger
-- 3. Table: tasks
-- 4. Events: Insert, Update
-- 5. Type: Supabase Edge Function
-- 6. Method: POST
-- 7. Edge Function: push-notify
