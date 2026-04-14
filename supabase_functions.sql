-- ============================================================
-- BONDHU APP - Required Supabase RPC Functions
-- Run this entire script in Supabase SQL Editor
-- Dashboard -> SQL Editor -> New Query -> Paste -> Run
-- ============================================================

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
  -- Check task exists and is pending
  SELECT * INTO v_task FROM tasks WHERE id = p_task_id FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'Task not found');
  END IF;
  
  IF v_task.status != 'pending' THEN
    RETURN json_build_object('success', false, 'message', 'Task is no longer available');
  END IF;
  
  -- Generate a 6-digit completion code
  v_code := LPAD(FLOOR(RANDOM() * 900000 + 100000)::TEXT, 6, '0');
  
  -- Update task status
  UPDATE tasks SET status = 'accepted', updated_at = NOW() WHERE id = p_task_id;
  
  -- Create assignment with completion code
  INSERT INTO task_assignments (task_id, bondhu_id, status, accepted_at, completion_code, code_generated_at)
  VALUES (p_task_id, p_bondhu_id, 'accepted', NOW(), v_code, NOW())
  ON CONFLICT (task_id) DO UPDATE 
    SET bondhu_id = p_bondhu_id, status = 'accepted', accepted_at = NOW(), 
        completion_code = v_code, code_generated_at = NOW();
  
  -- Create notification for task poster
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
  -- Insert declined record
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
  
  -- Notify poster
  INSERT INTO notifications (user_id, type, title, message, task_id)
  VALUES (v_task.poster_id, 'task_started', 'Bondhu Arrived!', 
          'Your Bondhu has started working on: ' || v_task.title, p_task_id);
  
  RETURN json_build_object('success', true, 'message', 'Task started successfully');
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$;

-- 4. COMPLETE TASK (without code - legacy)
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
  
  -- Update bondhu stats
  UPDATE profiles SET 
    total_tasks = total_tasks + 1,
    total_earnings = total_earnings + v_task.amount
  WHERE id = p_bondhu_id;
  
  -- Notify poster
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
  v_auto_completed BOOLEAN := false;
BEGIN
  SELECT * INTO v_task FROM tasks WHERE id = p_task_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'Task not found');
  END IF;
  
  SELECT * INTO v_assignment FROM task_assignments WHERE task_id = p_task_id LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'No assignment found for this task');
  END IF;
  
  -- Verify the code
  IF v_assignment.completion_code != p_completion_code THEN
    RETURN json_build_object('success', false, 'message', 'Invalid completion code. Please check the code and try again.');
  END IF;
  
  -- Mark code as verified
  UPDATE tasks SET 
    code_verified = true, 
    code_verified_at = NOW(),
    completion_step = 'code_verified',
    updated_at = NOW()
  WHERE id = p_task_id;
  
  -- For cash payment, auto-complete the task
  IF v_task.payment_method = 'cash' THEN
    UPDATE tasks SET 
      status = 'completed',
      payment_verified = true,
      payment_verified_at = NOW(),
      completion_step = 'completed',
      updated_at = NOW()
    WHERE id = p_task_id;
    
    UPDATE task_assignments SET 
      status = 'completed', 
      completed_at = NOW()
    WHERE task_id = p_task_id;
    
    -- Update bondhu stats
    UPDATE profiles SET 
      total_tasks = total_tasks + 1,
      total_earnings = total_earnings + v_task.amount
    WHERE id = v_assignment.bondhu_id;
    
    v_auto_completed := true;
    
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
  RETURN json_build_object('success', false, 'message', SQLERRM);
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
  
  IF NOT v_task.code_verified THEN
    RETURN json_build_object('success', false, 'message', 'Completion code must be verified first');
  END IF;
  
  SELECT * INTO v_assignment FROM task_assignments WHERE task_id = p_task_id LIMIT 1;
  
  -- Mark payment verified and complete task
  UPDATE tasks SET 
    status = 'completed',
    payment_verified = true,
    payment_verified_at = NOW(),
    completion_step = 'completed',
    updated_at = NOW()
  WHERE id = p_task_id;
  
  UPDATE task_assignments SET 
    status = 'completed', 
    completed_at = NOW()
  WHERE task_id = p_task_id;
  
  -- Update bondhu stats
  IF v_assignment.bondhu_id IS NOT NULL THEN
    UPDATE profiles SET 
      total_tasks = total_tasks + 1,
      total_earnings = total_earnings + v_task.amount
    WHERE id = v_assignment.bondhu_id;
  END IF;
  
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

-- 8. GET NEARBY TASKS (with PostGIS distance calculation)
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
    -- Haversine formula for distance in km
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

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION accept_task(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION decline_task(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION start_task(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION complete_task(UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION complete_task_with_code(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION verify_payment_and_complete(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION bondhu_confirm_payment_received(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_nearby_tasks(DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_notifications_read(UUID[]) TO authenticated;

-- Also grant to anon for public access if needed
GRANT EXECUTE ON FUNCTION get_nearby_tasks(DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION) TO anon;
