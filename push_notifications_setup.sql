-- ==============================================================================
-- PUSH NOTIFICATIONS & SPATIAL QUERIES SETUP
-- ==============================================================================

-- 1. Create Push Subscriptions Table
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL UNIQUE,
    auth_key TEXT NOT NULL,
    p256dh_key TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS on push_subscriptions
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can only see and manage their own subscriptions
CREATE POLICY "Users can manage their own push subscriptions"
    ON public.push_subscriptions
    FOR ALL
    USING (auth.uid() = user_id);

-- 2. Add last_location to profiles if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'last_location_lat') THEN
        ALTER TABLE public.profiles ADD COLUMN last_location_lat DOUBLE PRECISION;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'last_location_lng') THEN
        ALTER TABLE public.profiles ADD COLUMN last_location_lng DOUBLE PRECISION;
    END IF;
END $$;

-- 3. Create a highly efficient Haversine distance function in Postgres
-- This avoids needing the heavy PostGIS extension for simple radius queries.
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
        cos( radians(target_lat) ) * cos( radians( last_location_lat ) ) * 
        cos( radians( last_location_lng ) - radians(target_lng) ) + 
        sin( radians(target_lat) ) * sin( radians( last_location_lat ) ) 
    ) ) AS distance_km
  FROM profiles
  WHERE 
    role = target_role
    AND last_location_lat IS NOT NULL
    AND last_location_lng IS NOT NULL
    AND ( 6371 * acos( cos( radians(target_lat) ) * cos( radians( last_location_lat ) ) * cos( radians( last_location_lng ) - radians(target_lng) ) + sin( radians(target_lat) ) * sin( radians( last_location_lat ) ) ) ) <= radius_km;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create Database Webhooks (Triggers) to notify the Edge Function
-- First, we create a generic function to call an edge function
CREATE OR REPLACE FUNCTION trigger_push_notification_edge_function()
RETURNS TRIGGER AS $$
DECLARE
  edge_function_url text := current_setting('app.settings.edge_function_url', true);
  anon_key text := current_setting('app.settings.anon_key', true);
BEGIN
  -- We don't block the database transaction waiting for the edge function.
  -- Instead, we use pg_net (if available) or rely on a standard HTTP request.
  -- For Supabase, the best way to do webhooks securely is via Edge Functions listening to Realtime or pg_net.
  -- Since we want this to be robust, we'll configure the Edge Function to just use standard HTTP if pg_net is available.
  
  -- ACTUALLY: The easiest way to trigger an Edge Function on table change in Supabase is using the Supabase Dashboard "Database Webhooks" UI.
  -- We will leave instructions for the user to set up the Webhook via the UI.
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
