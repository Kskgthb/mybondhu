-- ============================================================
-- FIX: Update complete_task_with_code to enforce proof upload
-- Run this in Supabase Dashboard -> SQL Editor -> New Query
-- ============================================================

-- Step 1: Drop existing function (all overloads)
DROP FUNCTION IF EXISTS complete_task_with_code(UUID, TEXT);

-- Step 2: Recreate with correct signature (p_task_id, p_completion_code)
CREATE OR REPLACE FUNCTION complete_task_with_code(p_task_id UUID, p_completion_code TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_task tasks%ROWTYPE;
  v_assignment task_assignments%ROWTYPE;
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
  
  -- Do NOT auto-complete here. Wait for proof upload.
  RETURN json_build_object(
    'success', true, 
    'message', 'Code verified! Please upload task completion proof.',
    'auto_completed', false,
    'payment_method', v_task.payment_method
  );
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'message', 'Database error: ' || SQLERRM);
END;
$$;

-- Step 3: Create function to complete cash tasks after proof is uploaded
CREATE OR REPLACE FUNCTION complete_cash_task_after_proof(p_task_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_task tasks%ROWTYPE;
  v_assignment task_assignments%ROWTYPE;
BEGIN
  SELECT * INTO v_task FROM tasks WHERE id = p_task_id;
  SELECT * INTO v_assignment FROM task_assignments WHERE task_id = p_task_id LIMIT 1;
  
  -- Verify payment method is cash
  IF v_task.payment_method != 'cash' AND v_task.payment_method IS NOT NULL THEN
     RETURN json_build_object('success', false, 'message', 'Task is not a cash task.');
  END IF;

  -- Ensure proof is uploaded
  IF v_assignment.proof_url IS NULL THEN
     RETURN json_build_object('success', false, 'message', 'Proof must be uploaded before completion.');
  END IF;

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
          'Your task has been completed and proof has been uploaded: ' || v_task.title, p_task_id);
  
  RETURN json_build_object('success', true, 'message', 'Task completed successfully!');
END;
$$;

GRANT EXECUTE ON FUNCTION complete_task_with_code(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION complete_task_with_code(UUID, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION complete_cash_task_after_proof(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION complete_cash_task_after_proof(UUID) TO anon;
