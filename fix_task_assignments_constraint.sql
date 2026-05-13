-- Fix for "violates check constraint task_assignments_status_check" when declining a task
ALTER TABLE task_assignments DROP CONSTRAINT IF EXISTS task_assignments_status_check;
ALTER TABLE task_assignments ADD CONSTRAINT task_assignments_status_check 
  CHECK (status IN ('accepted', 'in_progress', 'completed', 'cancelled', 'declined'));
