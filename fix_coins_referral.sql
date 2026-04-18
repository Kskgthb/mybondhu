-- BONDHU APP - Fix Coins & Referral System
-- Run this script in Supabase SQL Editor

-- 1. Initialize NULL values to 0 for existing profiles
-- This ensures that adding coins works (NULL + 5 = NULL, but 0 + 5 = 5)
UPDATE profiles SET bondhu_coins = 0 WHERE bondhu_coins IS NULL;
UPDATE profiles SET total_tasks_posted = 0 WHERE total_tasks_posted IS NULL;

-- 2. Fix Task Completion Rewards (1 coin per task)
CREATE OR REPLACE FUNCTION on_task_completed_reward()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only trigger when status changes to 'completed'
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    -- Reward the Bondhu who completed the task
    -- Use COALESCE to safely handle any potential NULLs
    UPDATE profiles 
    SET bondhu_coins = COALESCE(bondhu_coins, 0) + 1
    WHERE id = NEW.bondhu_id;
  END IF;
  RETURN NEW;
END;
$$;

-- 3. Fix Referral Rewards (5 coins to referrer on first task post)
CREATE OR REPLACE FUNCTION on_task_posted_referral_reward()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_poster_record RECORD;
BEGIN
  -- Get poster's profile
  SELECT * INTO v_poster_record FROM profiles WHERE id = NEW.poster_id;
  
  -- Check if this is their first task and they were referred
  -- We check total_tasks_posted = 0 because the increment happens at the end of this function
  IF COALESCE(v_poster_record.total_tasks_posted, 0) = 0 AND v_poster_record.referred_by IS NOT NULL THEN
    -- Reward the referrer
    -- Use COALESCE to safely handle any potential NULLs
    UPDATE profiles 
    SET bondhu_coins = COALESCE(bondhu_coins, 0) + 5
    WHERE id = v_poster_record.referred_by;
    
    -- Notify the referrer
    INSERT INTO notifications (user_id, type, title, message, task_id)
    VALUES (
      v_poster_record.referred_by, 
      'rating_received', -- Using an existing type
      'Referral Reward! 🪙', 
      'Your friend ' || COALESCE(v_poster_record.username, 'someone') || ' posted their first task. You earned 5 Bondhu Coins!',
      NEW.id
    );
  END IF;
  
  -- Increment total tasks posted for the user who just posted
  -- Use COALESCE to safely handle any potential NULLs
  UPDATE profiles 
  SET total_tasks_posted = COALESCE(total_tasks_posted, 0) + 1
  WHERE id = NEW.poster_id;
  
  RETURN NEW;
END;
$$;
