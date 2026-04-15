-- ============================================================
-- FIX: Add missing unique constraint on task_assignments.task_id
-- Run this in Supabase SQL Editor
-- ============================================================

-- First, remove any duplicate task_id entries (keep the latest one)
DELETE FROM task_assignments a
USING task_assignments b
WHERE a.task_id = b.task_id 
  AND a.created_at < b.created_at;

-- Now add the unique constraint
ALTER TABLE task_assignments 
  ADD CONSTRAINT task_assignments_task_id_key UNIQUE (task_id);
