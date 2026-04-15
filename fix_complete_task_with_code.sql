-- ============================================================
-- FIX: Drop and recreate complete_task_with_code function
-- Run this in Supabase Dashboard -> SQL Editor -> New Query
-- ============================================================

-- Step 1: Drop existing function (all overloads)
DROP FUNCTION IF EXISTS complete_task_with_code(UUID, TEXT);
DROP FUNCTION IF EXISTS complete_task_with_code(UUID, UUID, TEXT);
DROP FUNCTION IF EXISTS complete_task_with_code(UUID, TEXT, UUID);

-- Step 2: Recreate with correct signature (p_task_id, p_completion_code)
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
  -- Find the task
  SELECT * INTO v_task FROM tasks WHERE id = p_task_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'Task not found');
  END IF;
  
  -- Find the assignment
  SELECT * INTO v_assignment FROM task_assignments WHERE task_id = p_task_id LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'No assignment found for this task');
  END IF;
  
  -- Verify the completion code
  IF v_assignment.completion_code IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'No completion code has been generated for this task');
  END IF;
  
  IF v_assignment.completion_code != p_completion_code THEN
    RETURN json_build_object('success', false, 'message', 'Invalid completion code. Please check the code and try again.');
  END IF;
  
  -- Mark code as verified on the task
  UPDATE tasks SET 
    code_verified = true, 
    code_verified_at = NOW(),
    completion_step = 'code_verified',
    updated_at = NOW()
  WHERE id = p_task_id;
  
  -- For cash payment, auto-complete the task
  IF v_task.payment_method = 'cash' OR v_task.payment_method IS NULL THEN
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
      total_tasks = COALESCE(total_tasks, 0) + 1,
      total_earnings = COALESCE(total_earnings, 0) + v_task.amount
    WHERE id = v_assignment.bondhu_id;
    
    -- Notify poster
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

-- Step 3: Grant permissions
GRANT EXECUTE ON FUNCTION complete_task_with_code(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION complete_task_with_code(UUID, TEXT) TO anon;
