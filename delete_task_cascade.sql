CREATE OR REPLACE FUNCTION delete_task_cascade(p_task_id UUID) RETURNS VOID AS $$
BEGIN
  DELETE FROM bondhu_locations WHERE task_id = p_task_id;
  DELETE FROM notifications WHERE task_id = p_task_id;
  DELETE FROM messages WHERE task_id = p_task_id;
  DELETE FROM ratings WHERE task_id = p_task_id;
  DELETE FROM task_assignments WHERE task_id = p_task_id;
  DELETE FROM tasks WHERE id = p_task_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
