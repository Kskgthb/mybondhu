-- ============================================================
-- FIX NOTIFICATION LOGIC & LOCATION SYNC
-- ============================================================

-- 1. Unify location columns and fix the proximity RPC
-- We make it use BOTH sets of columns (COALESCE) to ensure it works
-- even if one sync method is used instead of the other.

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
    AND ( 6371 * acos( 
        LEAST(1.0, 
          cos( radians(target_lat) ) * cos( radians( COALESCE(last_location_lat, location_lat, 0) ) ) * 
          cos( radians( COALESCE(last_location_lng, location_lng, 0) ) - radians(target_lng) ) + 
          sin( radians(target_lat) ) * sin( radians( COALESCE(last_location_lat, location_lat, 0) ) ) 
        )
    ) ) <= radius_km;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Update update_bondhu_location to sync BOTH pairs of columns
-- This ensures that any update to one updates the other for full compatibility.

CREATE OR REPLACE FUNCTION update_bondhu_location(
  p_bondhu_id UUID,
  p_lat DOUBLE PRECISION,
  p_lng DOUBLE PRECISION
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles SET 
    location_lat = p_lat,
    location_lng = p_lng,
    last_location_lat = p_lat,
    last_location_lng = p_lng,
    location_updated_at = NOW()
  WHERE id = p_bondhu_id;
END;
$$;

-- 3. Ensure profiles table has both columns (just in case)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'last_location_lat') THEN
        ALTER TABLE public.profiles ADD COLUMN last_location_lat DOUBLE PRECISION;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'last_location_lng') THEN
        ALTER TABLE public.profiles ADD COLUMN last_location_lng DOUBLE PRECISION;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'location_lat') THEN
        ALTER TABLE public.profiles ADD COLUMN location_lat DOUBLE PRECISION;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'location_lng') THEN
        ALTER TABLE public.profiles ADD COLUMN location_lng DOUBLE PRECISION;
    END IF;
END $$;
