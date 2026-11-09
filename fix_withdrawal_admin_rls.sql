-- ============================================================
-- BONDHU APP - Fix Withdrawal Admin Access & Functions
-- Run this in your Supabase SQL Editor once
-- ============================================================

-- 1. Ensure withdrawal_requests table has all necessary columns
CREATE TABLE IF NOT EXISTS public.withdrawal_requests (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount        NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
  upi_id        TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'completed', 'rejected')),
  note          TEXT,
  processed_by  UUID REFERENCES public.profiles(id),
  processed_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;

-- 2. Drop any previous restrictive policies
DROP POLICY IF EXISTS "withdrawal_requests_user_select" ON public.withdrawal_requests;
DROP POLICY IF EXISTS "withdrawal_requests_user_insert" ON public.withdrawal_requests;
DROP POLICY IF EXISTS "withdrawal_requests_admin_all" ON public.withdrawal_requests;
DROP POLICY IF EXISTS "withdrawal_requests_select" ON public.withdrawal_requests;
DROP POLICY IF EXISTS "withdrawal_requests_update" ON public.withdrawal_requests;
DROP POLICY IF EXISTS "withdrawal_requests_all" ON public.withdrawal_requests;
DROP POLICY IF EXISTS "withdrawal_requests_insert_policy" ON public.withdrawal_requests;
DROP POLICY IF EXISTS "withdrawal_requests_select_policy" ON public.withdrawal_requests;
DROP POLICY IF EXISTS "withdrawal_requests_update_policy" ON public.withdrawal_requests;

-- 3. Policy: User can create their own withdrawal request
CREATE POLICY "withdrawal_requests_insert_policy"
  ON public.withdrawal_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 4. Policy: Users can view their own requests OR authenticated admins can view ALL
CREATE POLICY "withdrawal_requests_select_policy"
  ON public.withdrawal_requests FOR SELECT
  USING (
    auth.uid() = user_id
    OR (
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND (
          role = 'admin'
          OR email IN (
            'tusharkumar01190@gmail.com',
            'kumarnishant01190@gmail.com',
            'kumarsumitsumitkumar187@gmail.com'
          )
        )
      )
    )
  );

-- 5. Policy: Admins can update status (Payment Done / Approve / Reject)
CREATE POLICY "withdrawal_requests_update_policy"
  ON public.withdrawal_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND (
        role = 'admin'
        OR email IN (
          'tusharkumar01190@gmail.com',
          'kumarnishant01190@gmail.com',
          'kumarsumitsumitkumar187@gmail.com'
        )
      )
    )
  );

-- 6. Ensure Realtime publication includes withdrawal_requests
ALTER PUBLICATION supabase_realtime ADD TABLE public.withdrawal_requests;

-- 7. SECURITY DEFINER RPC to get user withdrawals (bypasses RLS safely for admins)
CREATE OR REPLACE FUNCTION admin_get_user_withdrawals(p_user_id UUID)
RETURNS SETOF public.withdrawal_requests
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.withdrawal_requests
  WHERE user_id = p_user_id
  ORDER BY created_at DESC;
$$;

-- 8. SECURITY DEFINER RPC to update withdrawal status & mark payment done
CREATE OR REPLACE FUNCTION admin_update_withdrawal_status(
  p_withdrawal_id UUID,
  p_status TEXT,
  p_note TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_req public.withdrawal_requests;
BEGIN
  UPDATE public.withdrawal_requests
  SET 
    status = p_status,
    note = COALESCE(p_note, note),
    processed_by = auth.uid(),
    processed_at = NOW(),
    updated_at = NOW()
  WHERE id = p_withdrawal_id
  RETURNING * INTO v_req;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'Withdrawal request not found');
  END IF;

  RETURN json_build_object(
    'success', true,
    'message', 'Withdrawal request marked as ' || p_status,
    'data', row_to_json(v_req)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION admin_get_user_withdrawals(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_update_withdrawal_status(UUID, TEXT, TEXT) TO authenticated;
