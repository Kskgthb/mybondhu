-- ============================================================
-- SMART NOTIFICATION SYSTEM SCHEMA & RPCs
-- Run this in the Supabase SQL Editor
-- ============================================================

-- 1. Create User Preferences Table
CREATE TABLE IF NOT EXISTS public.user_preferences (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_weights JSONB DEFAULT '{}'::jsonb,
  quiet_hours_start TIME WITHOUT TIME ZONE,
  quiet_hours_end TIME WITHOUT TIME ZONE,
  preferred_radius_km DOUBLE PRECISION DEFAULT 10.0,
  muted_categories TEXT[] DEFAULT '{}',
  max_notifications_per_day INTEGER DEFAULT 3,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own preferences" ON public.user_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" ON public.user_preferences
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences" ON public.user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_user_preferences_modtime ON public.user_preferences;
CREATE TRIGGER update_user_preferences_modtime
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 2. Create Notification Logs Table (For Anti-Spam & A/B Testing)
CREATE TABLE IF NOT EXISTS public.notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  trigger_type TEXT NOT NULL, -- 'proximity', 're-engagement', 'lifecycle'
  variant TEXT, -- 'formal', 'emoji', 'urgent'
  clicked BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast daily limit checking (using UTC to ensure immutability)
CREATE INDEX IF NOT EXISTS idx_notification_logs_user_date ON public.notification_logs(user_id, ((sent_at AT TIME ZONE 'UTC')::date));

-- Enable RLS
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own logs" ON public.notification_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own logs" ON public.notification_logs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Service Role can insert logs" ON public.notification_logs
  FOR INSERT WITH CHECK (true); -- Usually called by edge functions

-- 3. RPC: Update User Interest Profile
-- Exponential moving average or simple additive weight
CREATE OR REPLACE FUNCTION update_user_interest_profile(
  p_user_id UUID,
  p_category TEXT,
  p_weight_increase DOUBLE PRECISION
) RETURNS void AS $$
DECLARE
  current_weights JSONB;
  current_val DOUBLE PRECISION;
  new_val DOUBLE PRECISION;
BEGIN
  -- Ensure preferences exist
  INSERT INTO public.user_preferences (user_id) 
  VALUES (p_user_id) 
  ON CONFLICT (user_id) DO NOTHING;

  -- Get current weights
  SELECT category_weights INTO current_weights FROM public.user_preferences WHERE user_id = p_user_id;
  
  -- Extract current value for category (default 0)
  current_val := COALESCE((current_weights->>p_category)::numeric, 0)::double precision;
  
  -- Increase and cap at 1.0
  new_val := LEAST(current_val + p_weight_increase, 1.0);
  
  -- Update
  UPDATE public.user_preferences 
  SET category_weights = jsonb_set(
    COALESCE(category_weights, '{}'::jsonb), 
    array[p_category], 
    to_jsonb(new_val)
  )
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. RPC: Get Smart Notification Targets
-- This replaces basic proximity search with intelligent filtering
CREATE OR REPLACE FUNCTION get_smart_notification_targets(
  p_target_lat DOUBLE PRECISION,
  p_target_lng DOUBLE PRECISION,
  p_category TEXT,
  p_limit INTEGER DEFAULT 10
) RETURNS TABLE (
  user_id UUID,
  distance_km DOUBLE PRECISION,
  match_score DOUBLE PRECISION,
  variant TEXT
) AS $$
DECLARE
  current_utc_time TIME := (NOW() AT TIME ZONE 'UTC')::time;
BEGIN
  RETURN QUERY
  WITH user_data AS (
    SELECT 
      p.id,
      p.role,
      p.last_location_lat,
      p.last_location_lng,
      p.location_lat,
      p.location_lng,
      COALESCE(up.preferred_radius_km, 10.0) as preferred_radius,
      COALESCE(up.max_notifications_per_day, 3) as max_daily,
      up.quiet_hours_start,
      up.quiet_hours_end,
      up.muted_categories,
      COALESCE((up.category_weights->>p_category)::numeric, 0.1)::double precision as category_weight,
      ( 6371 * acos( 
          LEAST(1.0, 
            cos( radians(p_target_lat) ) * cos( radians( COALESCE(p.last_location_lat, p.location_lat, 0) ) ) * 
            cos( radians( COALESCE(p.last_location_lng, p.location_lng, 0) ) - radians(p_target_lng) ) + 
            sin( radians(p_target_lat) ) * sin( radians( COALESCE(p.last_location_lat, p.location_lat, 0) ) ) 
          )
      ) ) AS distance
    FROM public.profiles p
    LEFT JOIN public.user_preferences up ON p.id = up.user_id
    WHERE 
      p.role = 'bondhu'
      AND (p.last_location_lat != 0 OR p.location_lat != 0)
  ),
  filtered_users AS (
    SELECT 
      ud.id,
      ud.distance,
      ud.category_weight,
      -- Calculate match score (Higher is better)
      -- Base 1.0 + Interest Weight (0 to 1.0) - Distance Penalty
      (1.0 + (ud.category_weight * 2.0) - (ud.distance / ud.preferred_radius)) as score
    FROM user_data ud
    WHERE 
      ud.distance <= ud.preferred_radius
      -- Check Muted Categories
      AND (ud.muted_categories IS NULL OR NOT (p_category = ANY(ud.muted_categories)))
      -- Check Quiet Hours (Simple logic, assumes UTC for now)
      AND (
        ud.quiet_hours_start IS NULL OR ud.quiet_hours_end IS NULL OR
        (
          ud.quiet_hours_start < ud.quiet_hours_end AND (current_utc_time < ud.quiet_hours_start OR current_utc_time > ud.quiet_hours_end)
        ) OR (
          ud.quiet_hours_start >= ud.quiet_hours_end AND (current_utc_time < ud.quiet_hours_start AND current_utc_time > ud.quiet_hours_end)
        )
      )
  ),
  users_with_limits AS (
    SELECT 
      fu.id,
      fu.distance,
      fu.score,
      (SELECT COUNT(*) FROM public.notification_logs nl WHERE nl.user_id = fu.id AND (nl.sent_at AT TIME ZONE 'UTC')::date = (NOW() AT TIME ZONE 'UTC')::date) as today_count,
      (SELECT max_notifications_per_day FROM public.user_preferences WHERE user_id = fu.id) as max_allowed
    FROM filtered_users fu
  )
  SELECT 
    uwl.id as user_id,
    uwl.distance as distance_km,
    uwl.score as match_score,
    -- Assign random A/B test variant
    CASE (random() * 2)::INT 
      WHEN 0 THEN 'formal'
      WHEN 1 THEN 'emoji'
      ELSE 'urgent'
    END as variant
  FROM users_with_limits uwl
  WHERE uwl.today_count < COALESCE(uwl.max_allowed, 3)
  ORDER BY uwl.score DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
