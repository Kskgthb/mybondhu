-- ============================================================
-- CHAT MEDIA SHARING — Add attachment columns to messages table
-- Run this in Supabase SQL Editor
-- ============================================================

-- Add media attachment columns to the messages table
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS attachment_url TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS attachment_type TEXT DEFAULT NULL
    CHECK (attachment_type IN ('image', 'video', 'file')),
  ADD COLUMN IF NOT EXISTS file_name TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS file_size BIGINT DEFAULT NULL;

-- Index for faster queries on messages with attachments
CREATE INDEX IF NOT EXISTS idx_messages_task_created
  ON public.messages(task_id, created_at);

-- Done! Verify:
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'messages';
