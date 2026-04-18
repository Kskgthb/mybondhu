-- ============================================================
-- BONDHU APP - DEPLOY ALL MISSING RPC FUNCTIONS
-- ============================================================
-- HOW TO RUN:
-- 1. Go to https://supabase.com/dashboard
-- 2. Select your project (jfqudweigoqazpkhfgrj)
-- 3. Go to SQL Editor -> New Query
-- 4. Paste this ENTIRE file
-- 5. Click "Run"
-- ============================================================

-- =============================================
-- STEP 0: Ensure required columns exist on tasks table
-- =============================================
DO $$
BEGIN
  -- Add code_verified column if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'code_verified') THEN
    ALTER TABLE tasks ADD COLUMN code_verified BOOLEAN DEFAULT false;
  END IF;

  -- Add code_verified_at column if missing  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'code_verified_at') THEN
    ALTER TABLE tasks ADD COLUMN code_verified_at TIMESTAMPTZ;
  END IF;

  -- Add payment_verified column if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'payment_verified') THEN
    ALTER TABLE tasks ADD COLUMN payment_verified BOOLEAN DEFAULT false;
  END IF;

  -- Add payment_verified_at column if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'payment_verified_at') THEN
    ALTER TABLE tasks ADD COLUMN payment_verified_at TIMESTAMPTZ;
  END IF;

  -- Add completion_step column if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'completion_step') THEN
    ALTER TABLE tasks ADD COLUMN completion_step TEXT DEFAULT 'pending';
  END IF;

  -- Add payment_method column if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'payment_method') THEN
    ALTER TABLE tasks ADD COLUMN payment_method TEXT DEFAULT 'cash';
  END IF;

  -- Add payment_status column if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'payment_status') THEN
    ALTER TABLE tasks ADD COLUMN payment_status TEXT DEFAULT 'pending';
  END IF;

  -- Add payment_qr_data column if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'payment_qr_data') THEN
    ALTER TABLE tasks ADD COLUMN payment_qr_data TEXT;
  END IF;

  -- Add proof_url column if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'proof_url') THEN
    ALTER TABLE tasks ADD COLUMN proof_url TEXT;
  END IF;
END $$;

-- Ensure required columns on task_assignments table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'task_assignments' AND column_name = 'completion_code') THEN
    ALTER TABLE task_assignments ADD COLUMN completion_code TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'task_assignments' AND column_name = 'code_generated_at') THEN
    ALTER TABLE task_assignments ADD COLUMN code_generated_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'task_assignments' AND column_name = 'proof_url') THEN
    ALTER TABLE task_assignments ADD COLUMN proof_url TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'task_assignments' AND column_name = 'accepted_at') THEN
    ALTER TABLE task_assignments ADD COLUMN accepted_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'task_assignments' AND column_name = 'started_at') THEN
    ALTER TABLE task_assignments ADD COLUMN started_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'task_assignments' AND column_name = 'completed_at') THEN
    ALTER TABLE task_assignments ADD COLUMN completed_at TIMESTAMPTZ;
  END IF;
END $$;

-- Ensure required columns on profiles table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'total_tasks') THEN
    ALTER TABLE profiles ADD COLUMN total_tasks INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'total_earnings') THEN
    ALTER TABLE profiles ADD COLUMN total_earnings NUMERIC DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'location_lat') THEN
    ALTER TABLE profiles ADD COLUMN location_lat DOUBLE PRECISION;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'location_lng') THEN
    ALTER TABLE profiles ADD COLUMN location_lng DOUBLE PRECISION;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'location_updated_at') THEN
    ALTER TABLE profiles ADD COLUMN location_updated_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'availability_status') THEN
    ALTER TABLE profiles ADD COLUMN availability_status BOOLEAN DEFAULT true;
  END IF;
END $$;

-- Create bondhu_locations table if not exists
CREATE TABLE IF NOT EXISTS bondhu_locations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bondhu_id UUID REFERENCES profiles(id),
  task_id UUID REFERENCES tasks(id),
  location_lat DOUBLE PRECISION NOT NULL,
  location_lng DOUBLE PRECISION NOT NULL,
  accuracy DOUBLE PRECISION,
  speed DOUBLE PRECISION,
  heading DOUBLE PRECISION,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create notifications table if not exists
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  task_id UUID,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create messages table if not exists
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES tasks(id),
  sender_id UUID REFERENCES profiles(id),
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create ratings table if not exists
CREATE TABLE IF NOT EXISTS ratings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES tasks(id),
  bondhu_id UUID REFERENCES profiles(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- STEP 1: Drop all existing function overloads
-- =============================================
DROP FUNCTION IF EXISTS accept_task(UUID, UUID);
DROP FUNCTION IF EXISTS decline_task(UUID, UUID);
DROP FUNCTION IF EXISTS start_task(UUID, UUID);
DROP FUNCTION IF EXISTS complete_task(UUID, UUID, TEXT);
DROP FUNCTION IF EXISTS complete_task_with_code(UUID, TEXT);
DROP FUNCTION IF EXISTS complete_task_with_code(UUID, UUID, TEXT);
DROP FUNCTION IF EXISTS complete_task_with_code(UUID, TEXT, UUID);
DROP FUNCTION IF EXISTS verify_payment_and_complete(UUID);
DROP FUNCTION IF EXISTS bondhu_confirm_payment_received(UUID);
DROP FUNCTION IF EXISTS get_nearby_tasks(DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION);
DROP FUNCTION IF EXISTS mark_notifications_read(UUID[]);
DROP FUNCTION IF EXISTS update_bondhu_location(UUID, DOUBLE PRECISION, DOUBLE PRECISION);
DROP FUNCTION IF EXISTS get_bondhu_location_for_task(UUID);

-- =============================================
-- STEP 2: Create all functions
-- =============================================

-- 1. ACCEPT TASK
CREATE OR REPLACE FUNCTION accept_task(p_task_id UUID, p_bondhu_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_task tasks%ROWTYPE;
  v_code TEXT;
BEGIN
  SELECT * INTO v_task FROM tasks WHERE id = p_task_id FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'Task not found');
  END IF;
  
  IF v_task.status != 'pending' THEN
    RETURN json_build_object('success', false, 'message', 'Task is no longer available');
  END IF;
  
  -- Generate 6-digit completion code
  v_code := LPAD(FLOOR(RANDOM() * 900000 + 100000)::TEXT, 6, '0');
  
  UPDATE tasks SET status = 'accepted', updated_at = NOW() WHERE id = p_task_id;
  
  INSERT INTO task_assignments (task_id, bondhu_id, status, accepted_at, completion_code, code_generated_at)
  VALUES (p_task_id, p_bondhu_id, 'accepted', NOW(), v_code, NOW())
  ON CONFLICT (task_id) DO UPDATE 
    SET bondhu_id = p_bondhu_id, status = 'accepted', accepted_at = NOW(), 
        completion_code = v_code, code_generated_at = NOW();
  
  INSERT INTO notifications (user_id, type, title, message, task_id)
  SELECT v_task.poster_id, 'task_accepted', 'Task Accepted!', 
         'A Bondhu has accepted your task: ' || v_task.title, p_task_id;
  
  RETURN json_build_object('success', true, 'message', 'Task accepted successfully');
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$;

-- 2. DECLINE TASK
CREATE OR REPLACE FUNCTION decline_task(p_task_id UUID, p_bondhu_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO task_assignments (task_id, bondhu_id, status, accepted_at)
  VALUES (p_task_id, p_bondhu_id, 'declined', NOW())
  ON CONFLICT (task_id) DO UPDATE SET status = 'declined';
  
  RETURN json_build_object('success', true, 'message', 'Task declined');
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$;

-- 3. START TASK
CREATE OR REPLACE FUNCTION start_task(p_task_id UUID, p_bondhu_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_task tasks%ROWTYPE;
BEGIN
  SELECT * INTO v_task FROM tasks WHERE id = p_task_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'Task not found');
  END IF;
  
  IF v_task.status != 'accepted' THEN
    RETURN json_build_object('success', false, 'message', 'Task cannot be started');
  END IF;
  
  UPDATE tasks SET status = 'in_progress', updated_at = NOW() WHERE id = p_task_id;
  UPDATE task_assignments SET status = 'in_progress', started_at = NOW() 
    WHERE task_id = p_task_id AND bondhu_id = p_bondhu_id;
  
  INSERT INTO notifications (user_id, type, title, message, task_id)
  VALUES (v_task.poster_id, 'task_started', 'Bondhu Started!', 
          'Your Bondhu has started working on: ' || v_task.title, p_task_id);
  
  RETURN json_build_object('success', true, 'message', 'Task started successfully');
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$;

-- 4. COMPLETE TASK (legacy, without code)
CREATE OR REPLACE FUNCTION complete_task(p_task_id UUID, p_bondhu_id UUID, p_proof_url TEXT DEFAULT NULL)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_task tasks%ROWTYPE;
BEGIN
  SELECT * INTO v_task FROM tasks WHERE id = p_task_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'Task not found');
  END IF;
  
  UPDATE tasks SET status = 'completed', updated_at = NOW() WHERE id = p_task_id;
  UPDATE task_assignments 
    SET status = 'completed', completed_at = NOW(), proof_url = COALESCE(p_proof_url, proof_url)
    WHERE task_id = p_task_id AND bondhu_id = p_bondhu_id;
  
  UPDATE profiles SET 
    total_tasks = COALESCE(total_tasks, 0) + 1,
    total_earnings = COALESCE(total_earnings, 0) + v_task.amount
  WHERE id = p_bondhu_id;
  
  INSERT INTO notifications (user_id, type, title, message, task_id)
  VALUES (v_task.poster_id, 'task_completed', 'Task Completed!', 
          'Your task has been completed: ' || v_task.title, p_task_id);
  
  RETURN json_build_object('success', true, 'message', 'Task completed successfully');
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$;

-- 5. COMPLETE TASK WITH CODE (main completion flow)
CREATE OR REPLACE FUNCTION complete_task_with_code(p_task_id UUID, p_completion_code TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_task tasks%ROWTYPE;
  v_assignment task_assignments%ROWTYPE;
BEGIN
  SELECT * INTO v_task FROM tasks WHERE id = p_task_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'Task not found');
  END IF;
  
  SELECT * INTO v_assignment FROM task_assignments WHERE task_id = p_task_id LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'No assignment found for this task');
  END IF;
  
  IF v_assignment.completion_code IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'No completion code has been generated for this task');
  END IF;
  
  IF v_assignment.completion_code != p_completion_code THEN
    RETURN json_build_object('success', false, 'message', 'Invalid completion code. Please check and try again.');
  END IF;
  
  -- Mark code as verified
  UPDATE tasks SET 
    code_verified = true, 
    code_verified_at = NOW(),
    completion_step = 'code_verified',
    updated_at = NOW()
  WHERE id = p_task_id;
  
  -- For cash payment, auto-complete
  IF v_task.payment_method = 'cash' OR v_task.payment_method IS NULL THEN
    UPDATE tasks SET 
      status = 'completed',
      payment_verified = true,
      payment_verified_at = NOW(),
      completion_step = 'completed',
      updated_at = NOW()
    WHERE id = p_task_id;
    
    UPDATE task_assignments SET status = 'completed', completed_at = NOW()
    WHERE task_id = p_task_id;
    
    UPDATE profiles SET 
      total_tasks = COALESCE(total_tasks, 0) + 1,
      total_earnings = COALESCE(total_earnings, 0) + v_task.amount
    WHERE id = v_assignment.bondhu_id;
    
    INSERT INTO notifications (user_id, type, title, message, task_id)
    VALUES (v_task.poster_id, 'task_completed', 'Task Completed!', 
            'Your task has been completed: ' || v_task.title, p_task_id);
    
    RETURN json_build_object(
      'success', true, 
      'message', 'Task completed successfully!',
      'auto_completed', true,
      'payment_method', 'cash'
    );
  END IF;
  
  -- For online payment, wait for payment confirmation
  RETURN json_build_object(
    'success', true,
    'message', 'Code verified! Waiting for payment confirmation.',
    'requires_payment', true,
    'payment_method', v_task.payment_method,
    'auto_completed', false
  );
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'message', 'Database error: ' || SQLERRM);
END;
$$;

-- 6. VERIFY PAYMENT AND COMPLETE
CREATE OR REPLACE FUNCTION verify_payment_and_complete(p_task_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_task tasks%ROWTYPE;
  v_assignment task_assignments%ROWTYPE;
BEGIN
  SELECT * INTO v_task FROM tasks WHERE id = p_task_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'Task not found');
  END IF;
  
  IF NOT COALESCE(v_task.code_verified, false) THEN
    RETURN json_build_object('success', false, 'message', 'Completion code must be verified first');
  END IF;
  
  SELECT * INTO v_assignment FROM task_assignments WHERE task_id = p_task_id LIMIT 1;
  
  UPDATE tasks SET 
    status = 'completed',
    payment_verified = true,
    payment_verified_at = NOW(),
    completion_step = 'completed',
    updated_at = NOW()
  WHERE id = p_task_id;
  
  UPDATE task_assignments SET status = 'completed', completed_at = NOW()
  WHERE task_id = p_task_id;
  
  IF v_assignment.bondhu_id IS NOT NULL THEN
    UPDATE profiles SET 
      total_tasks = COALESCE(total_tasks, 0) + 1,
      total_earnings = COALESCE(total_earnings, 0) + v_task.amount
    WHERE id = v_assignment.bondhu_id;
  END IF;
  
  INSERT INTO notifications (user_id, type, title, message, task_id)
  VALUES (v_task.poster_id, 'task_completed', 'Task Completed!', 
          'Payment confirmed and task completed: ' || v_task.title, p_task_id);
  
  RETURN json_build_object('success', true, 'message', 'Payment confirmed. Task completed!');
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$;

-- 7. BONDHU CONFIRM PAYMENT RECEIVED
CREATE OR REPLACE FUNCTION bondhu_confirm_payment_received(p_task_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE tasks SET 
    payment_status = 'completed',
    updated_at = NOW()
  WHERE id = p_task_id;
  
  RETURN json_build_object('success', true, 'message', 'Payment receipt confirmed');
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$;

-- 8. GET NEARBY TASKS
CREATE OR REPLACE FUNCTION get_nearby_tasks(
  user_lat DOUBLE PRECISION,
  user_lng DOUBLE PRECISION,
  max_distance_km DOUBLE PRECISION DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  category TEXT,
  location_address TEXT,
  location_lat DOUBLE PRECISION,
  location_lng DOUBLE PRECISION,
  urgency TEXT,
  amount NUMERIC,
  status TEXT,
  poster_id UUID,
  proof_url TEXT,
  payment_method TEXT,
  payment_status TEXT,
  payment_qr_data TEXT,
  code_verified BOOLEAN,
  code_verified_at TIMESTAMPTZ,
  payment_verified BOOLEAN,
  payment_verified_at TIMESTAMPTZ,
  completion_step TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  distance_km DOUBLE PRECISION
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.title,
    t.description,
    t.category,
    t.location_address,
    t.location_lat,
    t.location_lng,
    t.urgency::TEXT,
    t.amount,
    t.status::TEXT,
    t.poster_id,
    t.proof_url,
    t.payment_method::TEXT,
    t.payment_status::TEXT,
    t.payment_qr_data,
    t.code_verified,
    t.code_verified_at,
    t.payment_verified,
    t.payment_verified_at,
    t.completion_step::TEXT,
    t.created_at,
    t.updated_at,
    (
      6371 * acos(
        LEAST(1.0, 
          cos(radians(user_lat)) * cos(radians(t.location_lat)) *
          cos(radians(t.location_lng) - radians(user_lng)) +
          sin(radians(user_lat)) * sin(radians(t.location_lat))
        )
      )
    ) AS distance_km
  FROM tasks t
  WHERE 
    t.status = 'pending'
    AND t.location_lat IS NOT NULL 
    AND t.location_lng IS NOT NULL
    AND t.location_lat != 0 
    AND t.location_lng != 0
    AND (
      6371 * acos(
        LEAST(1.0,
          cos(radians(user_lat)) * cos(radians(t.location_lat)) *
          cos(radians(t.location_lng) - radians(user_lng)) +
          sin(radians(user_lat)) * sin(radians(t.location_lat))
        )
      )
    ) <= max_distance_km
  ORDER BY distance_km ASC;
END;
$$;

-- 9. MARK NOTIFICATIONS READ
CREATE OR REPLACE FUNCTION mark_notifications_read(notification_ids UUID[])
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE notifications 
  SET read = true 
  WHERE id = ANY(notification_ids);
END;
$$;

-- 10. UPDATE BONDHU LOCATION
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
    location_updated_at = NOW()
  WHERE id = p_bondhu_id;
END;
$$;

-- 11. GET BONDHU LOCATION FOR TASK
CREATE OR REPLACE FUNCTION get_bondhu_location_for_task(p_task_id UUID)
RETURNS TABLE (
  bondhu_id UUID,
  location_lat DOUBLE PRECISION,
  location_lng DOUBLE PRECISION,
  accuracy DOUBLE PRECISION,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    bl.bondhu_id,
    bl.location_lat,
    bl.location_lng,
    bl.accuracy,
    bl.created_at as updated_at
  FROM bondhu_locations bl
  WHERE bl.task_id = p_task_id
  ORDER BY bl.created_at DESC
  LIMIT 1;
  
  -- Fallback: try profile location if no bondhu_locations entry
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT 
      ta.bondhu_id,
      p.location_lat,
      p.location_lng,
      NULL::DOUBLE PRECISION as accuracy,
      p.location_updated_at as updated_at
    FROM task_assignments ta
    JOIN profiles p ON p.id = ta.bondhu_id
    WHERE ta.task_id = p_task_id
    AND p.location_lat IS NOT NULL
    AND p.location_lng IS NOT NULL
    LIMIT 1;
  END IF;
END;
$$;

-- =============================================
-- STEP 3: Create view for active task tracking
-- =============================================
CREATE OR REPLACE VIEW active_task_tracking AS
SELECT 
  t.id as task_id,
  t.title as task_title,
  t.location_lat as task_lat,
  t.location_lng as task_lng,
  t.location_address as task_address,
  t.poster_id,
  ta.bondhu_id,
  p.username as bondhu_name,
  p.phone as bondhu_phone,
  COALESCE(p.location_lat, 0) as bondhu_lat,
  COALESCE(p.location_lng, 0) as bondhu_lng,
  p.location_updated_at as bondhu_location_updated,
  ta.status as assignment_status,
  t.status as task_status,
  t.created_at as task_created_at,
  ta.accepted_at,
  ta.started_at
FROM tasks t
JOIN task_assignments ta ON ta.task_id = t.id
JOIN profiles p ON p.id = ta.bondhu_id
WHERE t.status IN ('accepted', 'in_progress')
AND ta.status IN ('accepted', 'in_progress');

-- =============================================
-- STEP 4: Grant permissions
-- =============================================
GRANT EXECUTE ON FUNCTION accept_task(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION decline_task(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION start_task(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION complete_task(UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION complete_task_with_code(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION verify_payment_and_complete(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION bondhu_confirm_payment_received(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_nearby_tasks(DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION) TO authenticated;
GRANT EXECUTE ON FUNCTION get_nearby_tasks(DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION) TO anon;
GRANT EXECUTE ON FUNCTION mark_notifications_read(UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION update_bondhu_location(UUID, DOUBLE PRECISION, DOUBLE PRECISION) TO authenticated;
GRANT EXECUTE ON FUNCTION get_bondhu_location_for_task(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_bondhu_location_for_task(UUID) TO anon;

-- Grant view access
GRANT SELECT ON active_task_tracking TO authenticated;

-- =============================================
-- STEP 5: Enable RLS policies for new tables
-- =============================================

-- Enable RLS on tables
ALTER TABLE bondhu_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

-- Bondhu locations policies
DROP POLICY IF EXISTS "Users can insert their own location" ON bondhu_locations;
CREATE POLICY "Users can insert their own location" ON bondhu_locations
  FOR INSERT TO authenticated
  WITH CHECK (bondhu_id = auth.uid());

DROP POLICY IF EXISTS "Users can read locations for their tasks" ON bondhu_locations;
CREATE POLICY "Users can read locations for their tasks" ON bondhu_locations
  FOR SELECT TO authenticated
  USING (true);

-- Notifications policies
DROP POLICY IF EXISTS "Users can read own notifications" ON notifications;
CREATE POLICY "Users can read own notifications" ON notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- Messages policies
DROP POLICY IF EXISTS "Users can read task messages" ON messages;
CREATE POLICY "Users can read task messages" ON messages
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can send messages" ON messages;
CREATE POLICY "Users can send messages" ON messages
  FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid());

-- Ratings policies
DROP POLICY IF EXISTS "Users can read ratings" ON ratings;
CREATE POLICY "Users can read ratings" ON ratings
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can create ratings" ON ratings;
CREATE POLICY "Users can create ratings" ON ratings
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Enable realtime for key tables (safe - skip if already added)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'bondhu_locations') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE bondhu_locations;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'notifications') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'messages') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE messages;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'task_assignments') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE task_assignments;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'tasks') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
  END IF;
END $$;

-- ============================================================
-- DONE! All functions deployed successfully.
-- ============================================================

-- Run this script in your Supabase SQL Editor to ensure the Profile Edit feature works smoothly

-- 1. Ensure the profiles table allows users to update their own profile
-- This is necessary for saving the new username, phone number, and avatar_url
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" 
ON public.profiles
FOR UPDATE
USING (auth.uid() = id);

-- 2. Ensure users can upload profile pictures (avatars) to the storage bucket
-- The bucket is "app-83dmv202aiv5_bondhu_documents"
-- This policy allows users to insert (upload) files only into their own folder
DROP POLICY IF EXISTS "Users can upload their own documents and avatars" ON storage.objects;
CREATE POLICY "Users can upload their own documents and avatars"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'app-83dmv202aiv5_bondhu_documents' AND 
  (auth.uid())::text = (storage.foldername(name))[1]
);

-- 3. Ensure users can update (overwrite) their existing avatars
DROP POLICY IF EXISTS "Users can update their own documents and avatars" ON storage.objects;
CREATE POLICY "Users can update their own documents and avatars"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'app-83dmv202aiv5_bondhu_documents' AND 
  (auth.uid())::text = (storage.foldername(name))[1]
);

-- 4. Ensure avatars and documents are publicly readable (or readable by authenticated users)
-- This allows the app to display the profile picture to everyone
DROP POLICY IF EXISTS "Avatars and documents are publicly readable" ON storage.objects;
CREATE POLICY "Avatars and documents are publicly readable"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'app-83dmv202aiv5_bondhu_documents'
);

