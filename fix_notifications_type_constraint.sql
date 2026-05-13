-- ============================================================
-- FIX NOTIFICATIONS TYPE CONSTRAINT
-- Run this in the Supabase SQL Editor
-- ============================================================

-- First, we need to know the name of the constraint. It's usually "notifications_type_check"
-- Let's drop it and recreate it with the new values.

ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Add the updated constraint allowing 'new_task_broadcast' and 'chat_message'
ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check 
CHECK (type IN (
  'task_posted', 
  'task_accepted', 
  'bondhu_on_way',
  'bondhu_arrived',
  'task_started', 
  'task_completed', 
  'rating_received',
  'payment_received',
  'payment_confirmed',
  'code_verified',
  'new_task_nearby',
  'new_task_broadcast',
  'chat_message'
));
