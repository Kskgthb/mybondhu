-- ============================================================
-- BONDHU APP - Dashboard, Wallet & Referral System Updates
-- Run this script in Supabase SQL Editor
-- ============================================================

-- 1. Update Profiles Table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS upi_id TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bondhu_coins INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES profiles(id);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_tasks_posted INTEGER DEFAULT 0;

-- 2. Function to generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_code TEXT;
  v_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate a 8-character random alphanumeric code
    v_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 8));
    
    -- Check if it exists
    SELECT EXISTS(SELECT 1 FROM profiles WHERE referral_code = v_code) INTO v_exists;
    
    EXIT WHEN NOT v_exists;
  END LOOP;
  RETURN v_code;
END;
$$;

-- 3. Trigger to assign referral code to new profiles
CREATE OR REPLACE FUNCTION on_profile_created_assign_referral()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := generate_referral_code();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_assign_referral_code ON profiles;
CREATE TRIGGER tr_assign_referral_code
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION on_profile_created_assign_referral();

-- Assign codes to existing profiles
UPDATE profiles SET referral_code = generate_referral_code() WHERE referral_code IS NULL;

-- 4. Trigger for Task Completion Rewards (1 coin per task)
CREATE OR REPLACE FUNCTION on_task_completed_reward()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_amount NUMERIC;
BEGIN
  -- Only trigger when status changes to 'completed'
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    -- Reward the Bondhu who completed the task
    UPDATE profiles 
    SET bondhu_coins = bondhu_coins + 1
    WHERE id = NEW.bondhu_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_reward_on_task_completion ON task_assignments;
CREATE TRIGGER tr_reward_on_task_completion
  AFTER UPDATE OF status ON task_assignments
  FOR EACH ROW
  EXECUTE FUNCTION on_task_completed_reward();

-- 5. Trigger for Referral Rewards (5 coins to referrer on first task post)
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
  IF v_poster_record.total_tasks_posted = 0 AND v_poster_record.referred_by IS NOT NULL THEN
    -- Reward the referrer
    UPDATE profiles 
    SET bondhu_coins = bondhu_coins + 5
    WHERE id = v_poster_record.referred_by;
    
    -- Notify the referrer
    INSERT INTO notifications (user_id, type, title, message)
    VALUES (
      v_poster_record.referred_by, 
      'rating_received', -- Using an existing type or we can add 'referral_reward'
      'Referral Reward! 🪙', 
      'Your friend ' || COALESCE(v_poster_record.username, 'someone') || ' posted their first task. You earned 5 Bondhu Coins!'
    );
  END IF;
  
  -- Increment total tasks posted
  UPDATE profiles 
  SET total_tasks_posted = total_tasks_posted + 1
  WHERE id = NEW.poster_id;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_referral_reward_on_first_task ON tasks;
CREATE TRIGGER tr_referral_reward_on_first_task
  AFTER INSERT ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION on_task_posted_referral_reward();

-- 6. Helper RPC for Withdraw Request (Placeholder)
CREATE OR REPLACE FUNCTION withdraw_request(p_amount NUMERIC, p_upi_id TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- In a real app, you'd insert into a 'withdrawals' table
  -- For now, we'll just return success
  RETURN json_build_object(
    'success', true, 
    'message', 'Withdraw request for ₹' || p_amount || ' sent successfully to UPI: ' || p_upi_id
  );
END;
$$;

-- Grant permissions
-- Grant permissions
GRANT EXECUTE ON FUNCTION withdraw_request(NUMERIC, TEXT) TO authenticated;

-- 7. Trigger to update profile rating_avg when a new rating is added
CREATE OR REPLACE FUNCTION update_bondhu_rating_avg()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE profiles
  SET rating_avg = (
    SELECT AVG(rating)::NUMERIC(3,2)
    FROM ratings
    WHERE bondhu_id = NEW.bondhu_id
  )
  WHERE id = NEW.bondhu_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_update_rating_avg ON ratings;
CREATE TRIGGER tr_update_rating_avg
  AFTER INSERT OR UPDATE ON ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_bondhu_rating_avg();
