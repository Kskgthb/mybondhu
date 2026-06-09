-- ============================================================
-- BONDHU APP - Withdrawal System Setup
-- Run this script in Supabase SQL Editor
-- ============================================================

-- 1. Create withdrawal_requests table
CREATE TABLE IF NOT EXISTS withdrawal_requests (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount        NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
  upi_id        TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  note          TEXT,
  processed_by  UUID REFERENCES profiles(id),
  processed_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Index for fast user lookups
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_user_id ON withdrawal_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_status  ON withdrawal_requests(status);

-- 3. Enable Row Level Security
ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;

-- 4. RLS: Users can only see their own withdrawal requests
DROP POLICY IF EXISTS "withdrawal_requests_user_select" ON withdrawal_requests;
CREATE POLICY "withdrawal_requests_user_select"
  ON withdrawal_requests FOR SELECT
  USING (auth.uid() = user_id);

-- 5. RLS: Users can insert their own requests
DROP POLICY IF EXISTS "withdrawal_requests_user_insert" ON withdrawal_requests;
CREATE POLICY "withdrawal_requests_user_insert"
  ON withdrawal_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 6. RLS: Admin can view ALL withdrawal requests
DROP POLICY IF EXISTS "withdrawal_requests_admin_all" ON withdrawal_requests;
CREATE POLICY "withdrawal_requests_admin_all"
  ON withdrawal_requests FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 7. Updated updated_at trigger
CREATE OR REPLACE FUNCTION set_withdrawal_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_withdrawal_updated_at ON withdrawal_requests;
CREATE TRIGGER tr_withdrawal_updated_at
  BEFORE UPDATE ON withdrawal_requests
  FOR EACH ROW EXECUTE FUNCTION set_withdrawal_updated_at();

-- 8. Updated withdraw_request RPC - now actually saves to table
CREATE OR REPLACE FUNCTION withdraw_request(p_amount NUMERIC, p_upi_id TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id   UUID;
  v_balance   NUMERIC;
  v_request   withdrawal_requests;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Not authenticated');
  END IF;

  -- Check balance
  SELECT total_earnings INTO v_balance
  FROM profiles WHERE id = v_user_id;

  IF v_balance IS NULL OR v_balance < p_amount THEN
    RETURN json_build_object('success', false, 'message', 'Insufficient balance');
  END IF;

  IF p_amount <= 0 THEN
    RETURN json_build_object('success', false, 'message', 'Amount must be greater than zero');
  END IF;

  -- Insert withdrawal request
  INSERT INTO withdrawal_requests (user_id, amount, upi_id, status)
  VALUES (v_user_id, p_amount, p_upi_id, 'pending')
  RETURNING * INTO v_request;

  RETURN json_build_object(
    'success', true,
    'message', 'Withdrawal request of ₹' || p_amount || ' submitted successfully. It will be processed within 24–48 hours.',
    'request_id', v_request.id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION withdraw_request(NUMERIC, TEXT) TO authenticated;

-- 9. Grant table access
GRANT SELECT, INSERT, UPDATE ON withdrawal_requests TO authenticated;
GRANT ALL ON withdrawal_requests TO service_role;
